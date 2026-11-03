use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;

use serde_json::json;
use tauri::{AppHandle, Emitter};

use crate::fs_scanner::{is_wsl_path, to_linux_path};
use crate::models::{ActionResponse, RunningServerSummary, ServerStatusResponse};

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct ServerProcessEntry {
    pub child: Child,
    pub name: String,
    pub path: String,
    pub command: String,
    pub started_at: String,
}

#[derive(Default)]
pub struct ServerManager {
    pub servers: Arc<Mutex<HashMap<String, ServerProcessEntry>>>,
}

fn normalize_key(p: &str) -> String {
    p.replace('\\', "/").to_lowercase().trim_end_matches('/').to_string()
}

impl ServerManager {
    pub fn new() -> Self {
        Self {
            servers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn start_server(
        &self,
        app: &AppHandle,
        target_path: &str,
        command: &str,
        cwd: Option<&str>,
        custom_name: Option<&str>,
    ) -> ActionResponse {
        let key = normalize_key(target_path);
        let working_dir = cwd.unwrap_or(target_path).to_string();
        let is_wsl = is_wsl_path(&working_dir);

        let p = Path::new(&working_dir);
        let project_name = custom_name
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                p.file_name()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_else(|| "Server".to_string())
            });

        // If an existing server is running for this key, stop it first
        let _ = self.stop_server(app, Some(target_path));

        let spawn_res = if is_wsl {
            let linux_path = to_linux_path(&working_dir);
            Command::new("wsl.exe")
                .args(["-d", "Ubuntu", "--cd", &linux_path, "bash", "-ic", command])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .creation_flags(CREATE_NO_WINDOW)
                .spawn()
        } else {
            Command::new("powershell.exe")
                .args(["-NoProfile", "-Command", command])
                .current_dir(&working_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .creation_flags(CREATE_NO_WINDOW)
                .spawn()
        };

        match spawn_res {
            Ok(mut child) => {
                let stdout = child.stdout.take();
                let stderr = child.stderr.take();

                let now_str = chrono_or_fallback();
                let entry = ServerProcessEntry {
                    child,
                    name: project_name.clone(),
                    path: target_path.to_string(),
                    command: command.to_string(),
                    started_at: now_str,
                };

                {
                    let mut map = self.servers.lock().unwrap();
                    map.insert(key.clone(), entry);
                }

                // Initial status emit
                let _ = app.emit(
                    "server-log",
                    json!({
                        "type": "status",
                        "status": "starting",
                        "projectId": key,
                        "projectName": project_name,
                        "text": format!("🚀 [{}] Starting: {}\n📂 Directory: {}\n", project_name, command, working_dir)
                    }),
                );

                // Spawn thread to read stdout
                let app_handle_out = app.clone();
                let key_out = key.clone();
                let proj_out = project_name.clone();
                if let Some(out) = stdout {
                    thread::spawn(move || {
                        let reader = BufReader::new(out);
                        for line in reader.lines().map_while(Result::ok) {
                            let _ = app_handle_out.emit(
                                "server-log",
                                json!({
                                    "type": "log",
                                    "projectId": key_out,
                                    "projectName": proj_out,
                                    "text": format!("{}\n", line)
                                }),
                            );
                        }
                    });
                }

                // Spawn thread to read stderr
                let app_handle_err = app.clone();
                let key_err = key.clone();
                let proj_err = project_name.clone();
                if let Some(err) = stderr {
                    thread::spawn(move || {
                        let reader = BufReader::new(err);
                        for line in reader.lines().map_while(Result::ok) {
                            let _ = app_handle_err.emit(
                                "server-log",
                                json!({
                                    "type": "log",
                                    "projectId": key_err,
                                    "projectName": proj_err,
                                    "text": format!("{}\n", line)
                                }),
                            );
                        }
                    });
                }

                ActionResponse {
                    success: true,
                    message: Some(format!("Started server for {}", project_name)),
                    error: None,
                }
            }
            Err(e) => ActionResponse {
                success: false,
                message: None,
                error: Some(e.to_string()),
            },
        }
    }

    pub fn stop_server(&self, app: &AppHandle, target_path: Option<&str>) -> ActionResponse {
        let mut map = self.servers.lock().unwrap();

        if let Some(tp) = target_path {
            if tp == "all" {
                for (_, mut item) in map.drain() {
                    let pid = item.child.id();
                    let _ = Command::new("taskkill")
                        .args(["/F", "/PID", &pid.to_string(), "/T"])
                        .creation_flags(CREATE_NO_WINDOW)
                        .output();
                    let _ = item.child.kill();
                }
                let _ = app.emit("server-log", json!({ "type": "status", "running": false, "servers": [] }));
                return ActionResponse {
                    success: true,
                    message: Some("Stopped all active servers".to_string()),
                    error: None,
                };
            }

            let key = normalize_key(tp);
            if let Some(mut item) = map.remove(&key) {
                let pid = item.child.id();
                let _ = Command::new("taskkill")
                    .args(["/F", "/PID", &pid.to_string(), "/T"])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output();
                let _ = item.child.kill();

                let _ = app.emit(
                    "server-log",
                    json!({
                        "type": "status",
                        "status": "stopped",
                        "projectId": key,
                        "projectName": item.name,
                        "text": format!("\n🛑 [{}] Server stopped by user\n", item.name)
                    }),
                );

                return ActionResponse {
                    success: true,
                    message: Some(format!("Stopped server for {}", item.name)),
                    error: None,
                };
            }
        }

        ActionResponse {
            success: true,
            message: Some("No active server running".to_string()),
            error: None,
        }
    }

    pub fn get_server_status(&self) -> ServerStatusResponse {
        let map = self.servers.lock().unwrap();
        let mut list = Vec::new();
        for (id, item) in map.iter() {
            list.push(RunningServerSummary {
                id: id.clone(),
                name: item.name.clone(),
                path: item.path.clone(),
                command: item.command.clone(),
                started_at: item.started_at.clone(),
            });
        }
        let running = !list.is_empty();
        ServerStatusResponse {
            success: true,
            running,
            servers: list,
        }
    }
}

fn chrono_or_fallback() -> String {
    use std::time::SystemTime;
    match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(d) => format!("timestamp:{}", d.as_secs()),
        Err(_) => "now".to_string(),
    }
}
