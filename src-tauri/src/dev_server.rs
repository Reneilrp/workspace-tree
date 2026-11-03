use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::SystemTime;

use serde_json::json;
use tauri::{AppHandle, Emitter};

use crate::fs_scanner::{is_wsl_path, to_linux_path};
use crate::models::{ActionResponse, RunningServerSummary, ServerStatusResponse};

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct ServerProcessEntry {
    pub child: Child,
    pub name: String,
    pub path: String,
    pub working_dir: String,
    pub command: String,
    pub started_at: String,
    pub start_time: u64,
    pub is_wsl: bool,
}

#[derive(Default, Clone)]
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

    pub fn get_servers_summary_internal(&self) -> Vec<RunningServerSummary> {
        let map = self.servers.lock().unwrap();
        let mut list = Vec::new();
        for (id, item) in map.iter() {
            list.push(RunningServerSummary {
                id: id.clone(),
                key: id.clone(),
                name: item.name.clone(),
                path: item.path.clone(),
                project_name: item.name.clone(),
                project_path: item.path.clone(),
                working_dir: item.working_dir.clone(),
                command: item.command.clone(),
                started_at: item.started_at.clone(),
                start_time: item.start_time,
                os: if item.is_wsl { "ubuntu".to_string() } else { "windows".to_string() },
            });
        }
        list
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

                let (now_str, now_unix) = now_timestamps();
                let entry = ServerProcessEntry {
                    child,
                    name: project_name.clone(),
                    path: target_path.to_string(),
                    working_dir: working_dir.clone(),
                    command: command.to_string(),
                    started_at: now_str.clone(),
                    start_time: now_unix,
                    is_wsl,
                };

                {
                    let mut map = self.servers.lock().unwrap();
                    map.insert(key.clone(), entry);
                }

                let current_servers = self.get_servers_summary_internal();

                // Initial status emit
                let _ = app.emit(
                    "server-log",
                    json!({
                        "type": "status",
                        "running": true,
                        "status": "starting",
                        "projectId": key,
                        "projectName": project_name,
                        "servers": current_servers,
                        "text": format!("🚀 [{}] Starting: {}\n📂 Directory: {} [{}]\n", project_name, command, working_dir, if is_wsl { "Ubuntu WSL" } else { "Windows" })
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
                                    "stream": "stdout",
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
                                    "stream": "stderr",
                                    "text": format!("{}\n", line)
                                }),
                            );
                        }
                    });
                }

                // Spawn watcher thread to detect natural exit / termination
                let app_handle_watch = app.clone();
                let self_clone = self.clone();
                let key_watch = key.clone();
                let proj_watch = project_name.clone();
                thread::spawn(move || {
                    loop {
                        thread::sleep(std::time::Duration::from_millis(500));
                        let should_clean = {
                            let mut map = self_clone.servers.lock().unwrap();
                            if let Some(item) = map.get_mut(&key_watch) {
                                match item.child.try_wait() {
                                    Ok(Some(status)) => {
                                        let exit_code = status.code().unwrap_or(-1);
                                        let _ = app_handle_watch.emit(
                                            "server-log",
                                            json!({
                                                "type": "exit",
                                                "code": exit_code,
                                                "projectId": key_watch,
                                                "projectName": proj_watch,
                                                "text": format!("\n🛑 [{}] Process exited with code {}\n", proj_watch, exit_code)
                                            }),
                                        );
                                        true
                                    }
                                    Ok(None) => false,
                                    Err(_) => true,
                                }
                            } else {
                                break;
                            }
                        };

                        if should_clean {
                            let mut map = self_clone.servers.lock().unwrap();
                            map.remove(&key_watch);
                            let remaining = self_clone.get_servers_summary_internal();
                            let is_running = !remaining.is_empty();
                            let _ = app_handle_watch.emit(
                                "server-log",
                                json!({
                                    "type": "status",
                                    "running": is_running,
                                    "projectId": key_watch,
                                    "servers": remaining
                                }),
                            );
                            break;
                        }
                    }
                });

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
                    if item.is_wsl {
                        let _ = Command::new("wsl.exe")
                            .args(["-d", "Ubuntu", "pkill", "-f", &item.command])
                            .creation_flags(CREATE_NO_WINDOW)
                            .output();
                    }
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
                if item.is_wsl {
                    let _ = Command::new("wsl.exe")
                        .args(["-d", "Ubuntu", "pkill", "-f", &item.command])
                        .creation_flags(CREATE_NO_WINDOW)
                        .output();
                }

                let remaining: Vec<RunningServerSummary> = map
                    .iter()
                    .map(|(id, it)| RunningServerSummary {
                        id: id.clone(),
                        key: id.clone(),
                        name: it.name.clone(),
                        path: it.path.clone(),
                        project_name: it.name.clone(),
                        project_path: it.path.clone(),
                        working_dir: it.working_dir.clone(),
                        command: it.command.clone(),
                        started_at: it.started_at.clone(),
                        start_time: it.start_time,
                        os: if it.is_wsl { "ubuntu".to_string() } else { "windows".to_string() },
                    })
                    .collect();

                let is_running = !remaining.is_empty();

                let _ = app.emit(
                    "server-log",
                    json!({
                        "type": "status",
                        "running": is_running,
                        "status": "stopped",
                        "projectId": key,
                        "projectName": item.name,
                        "servers": remaining,
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
        let list = self.get_servers_summary_internal();
        let running = !list.is_empty();
        ServerStatusResponse {
            success: true,
            running,
            servers: list,
        }
    }
}

fn now_timestamps() -> (String, u64) {
    let now = SystemTime::now();
    let unix = now
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let str_repr = format!("timestamp:{}", unix);
    (str_repr, unix)
}
