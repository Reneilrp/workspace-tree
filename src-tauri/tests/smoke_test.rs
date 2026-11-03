use app_lib::dev_server::ServerManager;
use app_lib::fs_scanner;
use app_lib::system_tools;

#[test]
fn test_get_roots() {
    let roots = fs_scanner::get_roots();
    println!("Roots found: {:?}", roots.len());
    assert!(!roots.is_empty(), "Should find at least Windows root");
    let win_root = roots.iter().find(|r| r.os == "windows");
    assert!(win_root.is_some(), "Windows root must be present");
    println!("Windows root path: {}", win_root.unwrap().path);
}

#[test]
fn test_browse_directory() {
    let win_home = std::env::var("USERPROFILE").unwrap();
    let res = fs_scanner::browse_directory(&win_home, 20, Some("projects"), true);
    assert!(res.success, "Browse directory should succeed");
    println!("Browse total folders: {}, files: {}", res.total_folders, res.total_files);
}

#[test]
fn test_project_details() {
    let current_dir = std::env::current_dir().unwrap();
    let res = fs_scanner::get_project_details(&current_dir.to_string_lossy());
    assert!(res.success, "Project details should succeed");
    if let Some(details) = res.details {
        println!("Detected project: {}, type: {}", details.name, details.project_type);
        assert!(details.is_project, "src-tauri should be recognized as a project");
        assert_eq!(details.project_type, "Rust");
    }
}

#[test]
fn test_translate_path() {
    let win_path = r"C:\Users\test\project";
    let trans = system_tools::translate_path(win_path);
    assert!(trans.success);
    assert_eq!(trans.linux_path, "/mnt/c/Users/test/project");
    println!("Translated Windows to Linux: {}", trans.linux_path);
}

#[test]
fn test_active_ports() {
    let ports = system_tools::get_active_ports();
    assert!(ports.success);
    println!("Active monitored ports detected: {}", ports.ports.len());
}

#[test]
fn test_server_manager_lifecycle() {
    let manager = ServerManager::new();
    let status = manager.get_server_status();
    assert!(!status.running, "Initially no servers should be running");
    assert_eq!(status.servers.len(), 0);
}
