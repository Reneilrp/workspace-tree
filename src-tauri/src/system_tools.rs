use std::fs;
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::process::Command;

use crate::fs_scanner::{is_wsl_path, to_linux_path};
use crate::models::{
    ActionResponse, ActivePortItem, ActivePortsResponse, FileContentResponse, GitStatusResponse,
    StorageArtifact, StorageCleanResponse, StorageFootprintResponse, TranslatePathResponse,
};

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn translate_path(target_path: &str) -> TranslatePathResponse {
    let is_wsl = is_wsl_path(target_path);
    let linux_path;
    let win_unc;
    let win_drive_path;

    if is_wsl {
        linux_path = to_linux_path(target_path);
        let clean_linux = linux_path.trim_start_matches('/').replace('/', "\\");
        win_unc = format!(r"\\wsl.localhost\Ubuntu\{}", clean_linux);

        if linux_path.starts_with("/mnt/") && linux_path.len() >= 7 {
            let drive_char = linux_path.chars().nth(5).unwrap_or('c').to_ascii_uppercase();
            let rest = &linux_path[7..].replace('/', "\\");
            win_drive_path = format!("{}:\\{}", drive_char, rest);
        } else {
            win_drive_path = win_unc.clone();
        }
    } else {
        win_drive_path = target_path.replace('/', "\\");
        win_unc = win_drive_path.clone();

        if win_drive_path.len() >= 2 && win_drive_path.chars().nth(1) == Some(':') {
            let drive_char = win_drive_path.chars().next().unwrap_or('c').to_ascii_lowercase();
            let rest = win_drive_path[2..].replace('\\', "/");
            linux_path = format!("/mnt/{}/{}", drive_char, rest.trim_start_matches('/'));
        } else {
            linux_path = target_path.replace('\\', "/");
        }
    }

    TranslatePathResponse {
        success: true,
        source_path: target_path.to_string(),
        is_wsl,
        windows_path: win_drive_path,
        linux_path,
        wsl_unc_path: win_unc,
    }
}

pub fn get_file_content(target_path: &str) -> FileContentResponse {
    let p = Path::new(target_path);
    if !p.exists() {
        return FileContentResponse {
            success: false,
            path: target_path.to_string(),
            content: None,
            size: None,
            is_binary: None,
            error: Some("File does not exist".to_string()),
        };
    }

    let meta = match fs::metadata(p) {
        Ok(m) => m,
        Err(e) => {
            return FileContentResponse {
                success: false,
                path: target_path.to_string(),
                content: None,
                size: None,
                is_binary: None,
                error: Some(e.to_string()),
            };
        }
    };

    let size = meta.len();
    if size > 2 * 1024 * 1024 {
        return FileContentResponse {
            success: false,
            path: target_path.to_string(),
            content: None,
            size: Some(size),
            is_binary: Some(false),
            error: Some("File exceeds 2MB preview limit".to_string()),
        };
    }

    match fs::read(p) {
        Ok(bytes) => {
            if bytes.iter().take(1024).any(|&b| b == 0) {
                FileContentResponse {
                    success: true,
                    path: target_path.to_string(),
                    content: None,
                    size: Some(size),
                    is_binary: Some(true),
                    error: None,
                }
            } else {
                let content = String::from_utf8_lossy(&bytes).to_string();
                FileContentResponse {
                    success: true,
                    path: target_path.to_string(),
                    content: Some(content),
                    size: Some(size),
                    is_binary: Some(false),
                    error: None,
                }
            }
        }
        Err(e) => FileContentResponse {
            success: false,
            path: target_path.to_string(),
            content: None,
            size: Some(size),
            is_binary: None,
            error: Some(e.to_string()),
        },
    }
}

pub fn get_git_status(target_path: &str) -> GitStatusResponse {
    let p = Path::new(target_path);
    let git_dir = p.join(".git");
    if !git_dir.exists() {
        return GitStatusResponse {
            success: true,
            is_git: false,
            branch: None,
            status: None,
            ahead_behind: None,
            uncommitted_count: None,
        };
    }

    let is_wsl = is_wsl_path(target_path);
    let output = if is_wsl {
        let linux_path = to_linux_path(target_path);
        Command::new("wsl.exe")
            .args(["-d", "Ubuntu", "--cd", &linux_path, "git", "status", "--porcelain=v1", "-b"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
    } else {
        Command::new("git.exe")
            .args(["-C", target_path, "status", "--porcelain=v1", "-b"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
    };

    match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let mut branch = "unknown".to_string();
            let mut uncommitted = 0;
            let mut ahead_behind = None;

            for line in stdout.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("##") {
                    let parts: Vec<&str> = trimmed.trim_start_matches("##").trim().split("...").collect();
                    if let Some(b) = parts.first() {
                        let branch_name = b.split_whitespace().next().unwrap_or(*b);
                        branch = branch_name.to_string();
                    }
                    if trimmed.contains('[') && trimmed.contains(']') {
                        if let (Some(start), Some(end)) = (trimmed.find('['), trimmed.rfind(']')) {
                            ahead_behind = Some(trimmed[start + 1..end].to_string());
                        }
                    }
                } else if !trimmed.is_empty() {
                    uncommitted += 1;
                }
            }

            GitStatusResponse {
                success: true,
                is_git: true,
                branch: Some(branch),
                status: Some(if uncommitted == 0 { "Clean" } else { "Modified" }.to_string()),
                ahead_behind,
                uncommitted_count: Some(uncommitted),
            }
        }
        _ => GitStatusResponse {
            success: true,
            is_git: true,
            branch: Some("main".to_string()),
            status: Some("Clean".to_string()),
            ahead_behind: None,
            uncommitted_count: Some(0),
        },
    }
}

pub fn get_active_ports() -> ActivePortsResponse {
    let output = Command::new("netstat")
        .args(["-ano", "-p", "tcp"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

    let mut ports = Vec::new();
    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        for line in stdout.lines() {
            if !line.contains("LISTENING") {
                continue;
            }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                let local_addr = parts[1];
                let pid_str = parts[parts.len() - 1];
                let pid = pid_str.parse::<u32>().ok();

                if let Some(pos) = local_addr.rfind(':') {
                    if let Ok(port) = local_addr[pos + 1..].parse::<u16>() {
                        let is_dev_port = (3000..=3010).contains(&port)
                            || (5170..=5185).contains(&port)
                            || (8000..=8090).contains(&port)
                            || (19000..=19010).contains(&port)
                            || port == 4000
                            || port == 4200
                            || port == 7337;

                        if is_dev_port && !ports.iter().any(|p: &ActivePortItem| p.port == port) {
                            ports.push(ActivePortItem {
                                port,
                                pid,
                                name: Some(format!("Port {}", port)),
                                protocol: "TCP".to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    ActivePortsResponse {
        success: true,
        ports,
    }
}

pub fn kill_port(target_port: u16, target_pid: Option<u32>) -> ActionResponse {
    if let Some(pid) = target_pid {
        let _ = Command::new("taskkill")
            .args(["/F", "/PID", &pid.to_string(), "/T"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
    }

    // Try killing any process listening on this port via netstat & taskkill
    if let Ok(out) = Command::new("netstat")
        .args(["-ano", "-p", "tcp"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    {
        let stdout = String::from_utf8_lossy(&out.stdout);
        let port_pattern = format!(":{} ", target_port);
        for line in stdout.lines() {
            if line.contains(&port_pattern) && line.contains("LISTENING") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if let Some(last) = parts.last() {
                    if *last != "0" {
                        let _ = Command::new("taskkill")
                            .args(["/F", "/PID", last, "/T"])
                            .creation_flags(CREATE_NO_WINDOW)
                            .output();
                    }
                }
            }
        }
    }

    // Also attempt kill in WSL if running
    let _ = Command::new("wsl.exe")
        .args(["-d", "Ubuntu", "fuser", "-k", &format!("{}/tcp", target_port)])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

    ActionResponse {
        success: true,
        message: Some(format!("Terminated process on port {}", target_port)),
        error: None,
    }
}

const HEAVY_TARGET_NAMES: &[&str] = &[
    "node_modules", ".cache", "dist", "build", ".next", "vendor", ".venv", "venv", "target",
];

pub fn get_storage_footprint(target_path: &str) -> StorageFootprintResponse {
    let p = Path::new(target_path);
    let mut artifacts = Vec::new();

    if let Ok(entries) = fs::read_dir(p) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if HEAVY_TARGET_NAMES.contains(&name.as_str()) && entry.path().is_dir() {
                artifacts.push(StorageArtifact {
                    name,
                    path: entry.path().to_string_lossy().to_string(),
                    size: 0,
                    formatted_size: "...".to_string(),
                });
            }
        }
    }

    if is_wsl_path(target_path) {
        let linux_path = to_linux_path(target_path);
        let arg_names = artifacts.iter().map(|a| format!("\"{}\"", a.name)).collect::<Vec<_>>().join(" ");
        let cmd = format!("du -sh {} 2>/dev/null", arg_names);
        if let Ok(out) = Command::new("wsl.exe")
            .args(["-d", "Ubuntu", "--cd", &linux_path, "bash", "-c", &cmd])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let size = parts[0];
                    let raw_name = parts[1].trim_matches('"');
                    let base_name = Path::new(raw_name).file_name().map(|s| s.to_string_lossy().to_string()).unwrap_or_else(|| raw_name.to_string());
                    if let Some(art) = artifacts.iter_mut().find(|a| a.name == base_name) {
                        art.formatted_size = size.to_string();
                    }
                }
            }
        }
    } else {
        let ps_parts: Vec<String> = artifacts
            .iter()
            .map(|a| {
                let safe = a.path.replace('\'', "''");
                format!(
                    "if (Test-Path '{safe}') {{ $s = (Get-ChildItem -LiteralPath '{safe}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; [math]::Round($s / 1MB, 1).ToString() + 'M ' + '{name}' }}",
                    safe = safe,
                    name = a.name
                )
            })
            .collect();

        if !ps_parts.is_empty() {
            let script = ps_parts.join("; ");
            if let Ok(out) = Command::new("powershell.exe")
                .args(["-NoProfile", "-Command", &script])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
            {
                let stdout = String::from_utf8_lossy(&out.stdout);
                for line in stdout.lines() {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let size = parts[0];
                        let name = parts[1];
                        if let Some(art) = artifacts.iter_mut().find(|a| a.name == name) {
                            art.formatted_size = size.to_string();
                        }
                    }
                }
            }
        }
    }

    StorageFootprintResponse {
        success: true,
        path: target_path.to_string(),
        total_bytes: 0,
        formatted_total: "Calculated".to_string(),
        artifacts,
    }
}

pub fn clean_storage(target_path: &str, targets: Vec<String>) -> StorageCleanResponse {
    let p = Path::new(target_path);
    let mut count = 0;

    for target_name in targets {
        let artifact_path = p.join(&target_name);
        if artifact_path.exists() {
            if is_wsl_path(target_path) {
                let linux_path = to_linux_path(&artifact_path.to_string_lossy());
                let _ = Command::new("wsl.exe")
                    .args(["-d", "Ubuntu", "rm", "-rf", &linux_path])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output();
            } else {
                let _ = fs::remove_dir_all(&artifact_path);
            }
            count += 1;
        }
    }

    StorageCleanResponse {
        success: true,
        freed_bytes: 0,
        formatted_freed: format!("Removed {} artifact folders", count),
        message: format!("Successfully cleaned {} artifact(s)", count),
    }
}
