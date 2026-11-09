use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::sync::Mutex;
use std::time::Instant;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use crate::fs_scanner::{is_wsl_path, to_linux_path};
use crate::models::{
    ActionResponse, ActivePortItem, ActivePortsResponse,
    FileContentResponse, GitFileChange, GitStatusResponse, StorageArtifact, StorageCleanResponse,
    StorageFootprintResponse, TranslatePathResponse,
};

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn translate_path(target_path: &str) -> TranslatePathResponse {
    let is_wsl = is_wsl_path(target_path);
    let linux_path;
    let win_unc;
    let win_drive_path;

    #[cfg(target_os = "windows")]
    {
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
    }

    #[cfg(not(target_os = "windows"))]
    {
        linux_path = target_path.to_string();
        if linux_path.starts_with("/mnt/") && linux_path.len() >= 7 {
            let drive_char = linux_path.chars().nth(5).unwrap_or('c').to_ascii_uppercase();
            let rest = &linux_path[7..].replace('/', "\\");
            win_drive_path = format!("{}:\\{}", drive_char, rest);
            win_unc = win_drive_path.clone();
        } else {
            win_drive_path = linux_path.clone();
            win_unc = linux_path.clone();
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

static GIT_STATUS_CACHE: Mutex<Option<HashMap<String, (Instant, GitStatusResponse)>>> = Mutex::new(None);

pub fn get_git_status(target_path: &str) -> GitStatusResponse {
    let cache_key = target_path.to_lowercase().replace('\\', "/");
    if let Ok(guard) = GIT_STATUS_CACHE.lock() {
        if let Some(ref map) = *guard {
            if let Some((ts, cached)) = map.get(&cache_key) {
                if ts.elapsed().as_secs() < 15 {
                    return cached.clone();
                }
            }
        }
    }

    let p = Path::new(target_path);
    let git_dir = p.join(".git");
    if !git_dir.exists() {
        let res = GitStatusResponse {
            success: true,
            is_git: false,
            branch: None,
            status: None,
            ahead_behind: None,
            uncommitted_count: None,
            files: Vec::new(),
        };
        if let Ok(mut guard) = GIT_STATUS_CACHE.lock() {
            let map = guard.get_or_insert_with(HashMap::new);
            map.insert(cache_key, (Instant::now(), res.clone()));
        }
        return res;
    }

    #[cfg(target_os = "windows")]
    let output = {
        let is_wsl = is_wsl_path(target_path);
        if is_wsl {
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
        }
    };

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("git")
        .args(["-C", target_path, "status", "--porcelain=v1", "-b"])
        .output();

    let res = match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let mut branch = "unknown".to_string();
            let mut uncommitted = 0;
            let mut ahead_behind = None;
            let mut files = Vec::new();

            for raw_line in stdout.lines() {
                let line = raw_line.trim_end_matches(['\r', '\n']);
                if line.trim().starts_with("##") {
                    let trimmed = line.trim();
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
                } else if !line.trim().is_empty() {
                    uncommitted += 1;
                    // In porcelain v1, format is XY <path> (XY 2-chars, space at index 2, path at index 3+)
                    let (st_code, file_path) = if line.len() >= 3 {
                        let code = line[0..2].trim();
                        let path = line[3..].trim();
                        (if code.is_empty() { "M" } else { code }, path)
                    } else {
                        ("M", line.trim())
                    };
                    files.push(GitFileChange {
                        status: st_code.to_string(),
                        path: file_path.to_string(),
                    });
                }
            }

            GitStatusResponse {
                success: true,
                is_git: true,
                branch: Some(branch),
                status: Some(if uncommitted == 0 { "Clean" } else { "Modified" }.to_string()),
                ahead_behind,
                uncommitted_count: Some(uncommitted),
                files,
            }
        }
        _ => GitStatusResponse {
            success: true,
            is_git: true,
            branch: Some("main".to_string()),
            status: Some("Clean".to_string()),
            ahead_behind: None,
            uncommitted_count: Some(0),
            files: Vec::new(),
        },
    };

    if let Ok(mut guard) = GIT_STATUS_CACHE.lock() {
        let map = guard.get_or_insert_with(HashMap::new);
        map.insert(cache_key, (Instant::now(), res.clone()));
    }

    res
}

pub fn get_active_ports(target_path: Option<&str>) -> ActivePortsResponse {
    let mut ports = Vec::new();
    let mut project_expected_ports = HashSet::new();

    if let Some(tp) = target_path {
        let p = Path::new(tp);
        for env_file in &[p.join(".env"), p.join(".env.local"), p.join("backend").join(".env")] {
            if let Ok(content) = fs::read_to_string(env_file) {
                for line in content.lines() {
                    let t = line.trim();
                    if t.starts_with('#') || !t.contains('=') { continue; }
                    let parts: Vec<&str> = t.splitn(2, '=').collect();
                    let key = parts[0].trim().to_uppercase();
                    let val = parts[1].trim().trim_matches('"').trim_matches('\'');
                    if key.contains("PORT") || key.contains("URL") {
                        if let Ok(num) = val.parse::<u16>() {
                            project_expected_ports.insert(num);
                        } else if let Some(pos) = val.rfind(':') {
                            if let Ok(num) = val[pos + 1..].trim_end_matches('/').parse::<u16>() {
                                project_expected_ports.insert(num);
                            }
                        }
                    }
                }
            }
        }

        for dir in &[p.to_path_buf(), p.join("frontend"), p.join("backend")] {
            if dir.join("artisan").exists() {
                project_expected_ports.insert(8000);
                project_expected_ports.insert(5173);
            }
            if dir.join("vite.config.ts").exists() || dir.join("vite.config.js").exists() || dir.join("vite.config.mjs").exists() {
                project_expected_ports.insert(5173);
                project_expected_ports.insert(5174);
            }
            if let Ok(pkg_raw) = fs::read_to_string(dir.join("package.json")) {
                if pkg_raw.contains("\"vite\"") {
                    project_expected_ports.insert(5173);
                    project_expected_ports.insert(5174);
                }
                if pkg_raw.contains("\"next\"") || pkg_raw.contains("\"nuxt\"") {
                    project_expected_ports.insert(3000);
                    project_expected_ports.insert(3001);
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(out) = Command::new("netstat")
            .args(["-ano", "-p", "tcp"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
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
                            // PROTECTED PORT 7337 (Workspace Tree core server)
                            if port == 7337 {
                                continue;
                            }

                            let is_proj = project_expected_ports.contains(&port);
                            let is_dev_port = is_proj
                                || (3000..=3010).contains(&port)
                                || (5170..=5185).contains(&port)
                                || (8000..=8090).contains(&port)
                                || (19000..=19010).contains(&port)
                                || port == 4000
                                || port == 4200;

                            if is_dev_port && !ports.iter().any(|p: &ActivePortItem| p.port == port) {
                                ports.push(ActivePortItem {
                                    port,
                                    pid,
                                    name: Some(if is_proj { format!("Port {} (Project)", port) } else { format!("Port {}", port) }),
                                    protocol: "TCP".to_string(),
                                    is_project_port: Some(is_proj),
                                    project_name: if is_proj {
                                        target_path.and_then(|s| Path::new(s).file_name().map(|n| n.to_string_lossy().to_string()))
                                    } else {
                                        None
                                    },
                                    os: Some("windows".to_string()),
                                });
                            }
                        }
                    }
                }
            }
        }

        // WSL Port Scanning
        if let Ok(wsl_out) = Command::new("wsl.exe")
            .args(["-d", "Ubuntu", "sh", "-c", "ss -tlpn 2>/dev/null"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            let stdout = String::from_utf8_lossy(&wsl_out.stdout);
            for line in stdout.lines() {
                if !line.contains("LISTEN") {
                    continue;
                }
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 4 {
                    let local_addr = parts[3];
                    if let Some(pos) = local_addr.rfind(':') {
                        if let Ok(port) = local_addr[pos + 1..].parse::<u16>() {
                            if port == 7337 {
                                continue;
                            }
                            let is_proj = project_expected_ports.contains(&port);
                            let is_dev_port = is_proj
                                || (3000..=3010).contains(&port)
                                || (5170..=5185).contains(&port)
                                || (8000..=8090).contains(&port)
                                || (19000..=19010).contains(&port)
                                || port == 4000
                                || port == 4200;

                            if is_dev_port && !ports.iter().any(|p: &ActivePortItem| p.port == port) {
                                let pid = if let Some(idx) = line.find("pid=") {
                                    let rest = &line[idx + 4..];
                                    let digits: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
                                    digits.parse::<u32>().ok()
                                } else {
                                    None
                                };

                                ports.push(ActivePortItem {
                                    port,
                                    pid,
                                    name: Some(if is_proj { format!("Port {} (Project)", port) } else { format!("Port {} [WSL]", port) }),
                                    protocol: "TCP".to_string(),
                                    is_project_port: Some(is_proj),
                                    project_name: if is_proj {
                                        target_path.and_then(|s| Path::new(s).file_name().map(|n| n.to_string_lossy().to_string()))
                                    } else {
                                        None
                                    },
                                    os: Some("wsl".to_string()),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        if let Ok(out) = Command::new("ss").args(["-tulpn"]).output() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                if !line.contains("LISTEN") {
                    continue;
                }
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 5 {
                    let local_addr = parts[4];
                    if let Some(pos) = local_addr.rfind(':') {
                        if let Ok(port) = local_addr[pos + 1..].parse::<u16>() {
                            if port == 7337 { continue; }
                            let is_proj = project_expected_ports.contains(&port);
                            if !ports.iter().any(|p: &ActivePortItem| p.port == port) {
                                ports.push(ActivePortItem {
                                    port,
                                    pid: None,
                                    name: Some(if is_proj { format!("Port {} (Project)", port) } else { format!("Port {}", port) }),
                                    protocol: "TCP".to_string(),
                                    is_project_port: Some(is_proj),
                                    project_name: if is_proj {
                                        target_path.and_then(|s| Path::new(s).file_name().map(|n| n.to_string_lossy().to_string()))
                                    } else {
                                        None
                                    },
                                    os: Some("linux".to_string()),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    let project_port_count = ports.iter().filter(|p| p.is_project_port.unwrap_or(false)).count();

    ActivePortsResponse {
        success: true,
        ports,
        project_port_count: Some(project_port_count),
    }
}

pub fn kill_port(target_port: u16, target_pid: Option<u32>) -> ActionResponse {
    if target_port == 7337 {
        return ActionResponse {
            success: false,
            message: None,
            error: Some("Port 7337 is Workspace Tree's internal daemon port and is protected. To quit Workspace Tree, use Settings or exit the application.".to_string()),
        };
    }
    #[cfg(target_os = "windows")]
    {
        if let Some(pid) = target_pid {
            let _ = Command::new("taskkill")
                .args(["/F", "/PID", &pid.to_string(), "/T"])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
            let _ = Command::new("wsl.exe")
                .args(["-d", "Ubuntu", "sh", "-c", &format!("kill -9 {} 2>/dev/null", pid)])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
        }

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

        let _ = Command::new("wsl.exe")
            .args(["-d", "Ubuntu", "sh", "-c", &format!("fuser -k {}/tcp 2>/dev/null", target_port)])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
    }

    #[cfg(not(target_os = "windows"))]
    {
        if let Some(pid) = target_pid {
            let _ = Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output();
        }
        let _ = Command::new("fuser")
            .args(["-k", &format!("{}/tcp", target_port)])
            .output();
    }

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

    #[cfg(target_os = "windows")]
    {
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
    }

    #[cfg(not(target_os = "windows"))]
    {
        for art in &mut artifacts {
            if let Ok(out) = Command::new("du").args(["-sh", &art.path]).output() {
                let stdout = String::from_utf8_lossy(&out.stdout);
                let parts: Vec<&str> = stdout.split_whitespace().collect();
                if let Some(size) = parts.first() {
                    art.formatted_size = size.to_string();
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
            #[cfg(target_os = "windows")]
            {
                if is_wsl_path(target_path) {
                    let linux_path = to_linux_path(&artifact_path.to_string_lossy());
                    let _ = Command::new("wsl.exe")
                        .args(["-d", "Ubuntu", "rm", "-rf", &linux_path])
                        .creation_flags(CREATE_NO_WINDOW)
                        .output();
                } else {
                    let _ = fs::remove_dir_all(&artifact_path);
                }
            }

            #[cfg(not(target_os = "windows"))]
            {
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
