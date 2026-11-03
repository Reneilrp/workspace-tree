use std::fs;
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
fn test_express_detection() {
    let temp_dir = std::env::temp_dir().join("test_express_app");
    let _ = fs::create_dir_all(&temp_dir);
    let _ = fs::write(temp_dir.join("server.js"), "const express = require('express');");
    
    let res = fs_scanner::get_project_details(&temp_dir.to_string_lossy());
    let _ = fs::remove_dir_all(&temp_dir);

    assert!(res.success);
    let details = res.details.unwrap();
    assert!(details.is_project);
    assert!(details.scripts.iter().any(|s| s.command == "node server.js"), "Should auto-detect node server.js");
    println!("Express auto-detection verified: {:?}", details.scripts);
}

#[test]
fn test_python_frameworks_detection() {
    // 1. Django
    let django_dir = std::env::temp_dir().join("test_django_app");
    let _ = fs::create_dir_all(&django_dir);
    let _ = fs::write(django_dir.join("manage.py"), "# django manage");
    let res_django = fs_scanner::get_project_details(&django_dir.to_string_lossy());
    let _ = fs::remove_dir_all(&django_dir);

    assert!(res_django.success);
    let django_details = res_django.details.unwrap();
    assert!(django_details.scripts.iter().any(|s| s.command.contains("manage.py runserver")), "Should detect Django runserver");

    // 2. FastAPI
    let fastapi_dir = std::env::temp_dir().join("test_fastapi_app");
    let _ = fs::create_dir_all(&fastapi_dir);
    let _ = fs::write(fastapi_dir.join("main.py"), "from fastapi import FastAPI\napp = FastAPI()");
    let res_fastapi = fs_scanner::get_project_details(&fastapi_dir.to_string_lossy());
    let _ = fs::remove_dir_all(&fastapi_dir);

    assert!(res_fastapi.success);
    let fastapi_details = res_fastapi.details.unwrap();
    assert!(fastapi_details.scripts.iter().any(|s| s.command.contains("uvicorn main:app --reload")), "Should detect FastAPI uvicorn");

    println!("Python & Django & FastAPI auto-detection verified!");
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
    let ports = system_tools::get_active_ports(None);
    assert!(ports.success);
    assert!(!ports.ports.iter().any(|p| p.port == 7337), "Port 7337 must be excluded from active dev ports list");
    println!("Active monitored ports detected: {}", ports.ports.len());
}

#[test]
fn test_server_manager_lifecycle() {
    let manager = ServerManager::new();
    let status = manager.get_server_status();
    assert!(!status.running, "Initially no servers should be running");
    assert_eq!(status.servers.len(), 0);
}

#[test]
fn test_laravel_php_detection() {
    let temp_dir = std::env::temp_dir().join("test_laravel_app");
    let _ = fs::create_dir_all(&temp_dir);
    let _ = fs::write(temp_dir.join("artisan"), "#!/usr/bin/env php\n");
    let _ = fs::write(temp_dir.join("package.json"), r#"{"scripts":{"dev":"vite","build":"vite build"}}"#);

    let details = fs_scanner::get_project_details(&temp_dir.to_string_lossy());
    assert!(details.success);
    let det = details.details.unwrap();
    assert_eq!(det.project_type, "PHP (Laravel)");
    assert!(!det.scripts.is_empty());
    assert_eq!(det.scripts[0].command, "php artisan serve");
    assert_eq!(det.default_script.unwrap(), "php artisan serve");

    let _ = fs::remove_dir_all(&temp_dir);
    println!("test_laravel_php_detection passed successfully!");
}
#[test]
fn test_monorepo_laravel_frontend_detection() {
    let temp_dir = std::env::temp_dir().join("test_evac_monorepo");
    let _ = fs::create_dir_all(temp_dir.join("backend"));
    let _ = fs::create_dir_all(temp_dir.join("frontend").join("mobile"));
    let _ = fs::write(temp_dir.join("backend").join("artisan"), "#!/usr/bin/env php\n");
    let _ = fs::write(temp_dir.join("frontend").join("mobile").join("package.json"), r#"{"scripts":{"dev":"expo start"}}"#);

    let details = fs_scanner::get_project_details(&temp_dir.to_string_lossy());
    assert!(details.success);
    let det = details.details.unwrap();
    assert_eq!(det.project_type, "Fullstack / Monorepo");
    assert!(!det.scripts.is_empty());
    assert_eq!(det.scripts[0].command, "php artisan serve");
    assert_eq!(det.default_script.unwrap(), "php artisan serve");

    let _ = fs::remove_dir_all(&temp_dir);
    println!("test_monorepo_laravel_frontend_detection passed successfully!");
}
#[test]
fn test_git_status_evac() {
    let path = r"\\wsl.localhost\Ubuntu\home\pheinz\Evac_Route";
    let status = system_tools::get_git_status(path);
    println!("EVAC STATUS: {:?}", status);
}
