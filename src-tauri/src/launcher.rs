use std::os::windows::process::CommandExt;
use std::path::Path;
use std::process::Command;

use crate::fs_scanner::{is_wsl_path, to_linux_path};
use crate::models::ActionResponse;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn run_terminal(
    target_path: &str,
    command: Option<&str>,
    cwd: Option<&str>,
    custom_title: Option<&str>,
) -> ActionResponse {
    let working_dir = cwd.unwrap_or(target_path);
    let is_wsl = is_wsl_path(working_dir);

    let p = Path::new(working_dir);
    let proj_name = custom_title
        .map(|s| s.to_string())
        .unwrap_or_else(|| {
            p.file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "Terminal".to_string())
        });

    if is_wsl {
        let linux_path = to_linux_path(working_dir);
        let tab_title = format!("{} (WSL)", proj_name);

        let res = if let Some(cmd) = command {
            let bash_arg = format!("{}; exec bash", cmd);
            Command::new("wt.exe")
                .args(["-w", "0", "new-tab", "--title", &tab_title, "wsl.exe", "-d", "Ubuntu", "--cd", &linux_path, "bash", "-ic", &bash_arg])
                .spawn()
                .or_else(|_| {
                    Command::new("cmd.exe")
                        .args(["/c", "start", &tab_title, "wsl.exe", "-d", "Ubuntu", "--cd", &linux_path, "bash", "-ic", &bash_arg])
                        .creation_flags(CREATE_NO_WINDOW)
                        .spawn()
                })
        } else {
            Command::new("wt.exe")
                .args(["-w", "0", "new-tab", "--title", &tab_title, "wsl.exe", "-d", "Ubuntu", "--cd", &linux_path])
                .spawn()
                .or_else(|_| {
                    Command::new("cmd.exe")
                        .args(["/c", "start", &tab_title, "wsl.exe", "-d", "Ubuntu", "--cd", &linux_path])
                        .creation_flags(CREATE_NO_WINDOW)
                        .spawn()
                })
        };

        match res {
            Ok(_) => ActionResponse {
                success: true,
                message: Some(format!("Opened WSL Terminal for {}", proj_name)),
                error: None,
            },
            Err(e) => ActionResponse {
                success: false,
                message: None,
                error: Some(e.to_string()),
            },
        }
    } else {
        let tab_title = proj_name.clone();

        let res = if let Some(cmd) = command {
            Command::new("wt.exe")
                .args(["-w", "0", "new-tab", "--title", &tab_title, "-d", working_dir, "powershell.exe", "-NoExit", "-Command", cmd])
                .spawn()
                .or_else(|_| {
                    Command::new("cmd.exe")
                        .args(["/c", "start", &tab_title, "/d", working_dir, "powershell.exe", "-NoExit", "-Command", cmd])
                        .creation_flags(CREATE_NO_WINDOW)
                        .spawn()
                })
        } else {
            Command::new("wt.exe")
                .args(["-w", "0", "new-tab", "--title", &tab_title, "-d", working_dir, "powershell.exe", "-NoExit"])
                .spawn()
                .or_else(|_| {
                    Command::new("cmd.exe")
                        .args(["/c", "start", &tab_title, "/d", working_dir, "powershell.exe", "-NoExit"])
                        .creation_flags(CREATE_NO_WINDOW)
                        .spawn()
                })
        };

        match res {
            Ok(_) => ActionResponse {
                success: true,
                message: Some(format!("Opened Terminal for {}", proj_name)),
                error: None,
            },
            Err(e) => ActionResponse {
                success: false,
                message: None,
                error: Some(e.to_string()),
            },
        }
    }
}

pub fn launch_action(action: &str, target_path: &str, _custom_title: Option<&str>) -> ActionResponse {
    let is_wsl = is_wsl_path(target_path);
    let linux_path = if is_wsl { to_linux_path(target_path) } else { String::new() };

    match action {
        "vscode" => {
            let res = if is_wsl {
                Command::new("wsl.exe")
                    .args(["-d", "Ubuntu", "--cd", &linux_path, "code", "."])
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn()
                    .or_else(|_| {
                        Command::new("cmd.exe")
                            .args(["/c", "code", target_path])
                            .creation_flags(CREATE_NO_WINDOW)
                            .spawn()
                    })
            } else {
                Command::new("cmd.exe")
                    .args(["/c", "code", "."])
                    .current_dir(target_path)
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn()
                    .or_else(|_| {
                        Command::new("cmd.exe")
                            .args(["/c", "code", target_path])
                            .creation_flags(CREATE_NO_WINDOW)
                            .spawn()
                    })
            };

            match res {
                Ok(_) => ActionResponse {
                    success: true,
                    message: Some("Opened in VS Code".to_string()),
                    error: None,
                },
                Err(e) => ActionResponse {
                    success: false,
                    message: None,
                    error: Some(e.to_string()),
                },
            }
        }
        "explorer" => {
            let p = Path::new(target_path);
            let is_file = p.is_file();

            let res = if is_file {
                let cmd = format!("Start-Process explorer.exe -ArgumentList '/select,\"{}\"'", target_path);
                Command::new("powershell.exe")
                    .args(["-NoProfile", "-Command", &cmd])
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn()
            } else {
                Command::new("rundll32.exe")
                    .args(["url.dll,FileProtocolHandler", target_path])
                    .spawn()
                    .or_else(|_| {
                        Command::new("explorer.exe")
                            .arg(target_path)
                            .spawn()
                    })
            };

            match res {
                Ok(_) => ActionResponse {
                    success: true,
                    message: Some("Opened in Explorer".to_string()),
                    error: None,
                },
                Err(e) => ActionResponse {
                    success: false,
                    message: None,
                    error: Some(e.to_string()),
                },
            }
        }
        _ => ActionResponse {
            success: false,
            message: None,
            error: Some(format!("Unknown action: {}", action)),
        },
    }
}
