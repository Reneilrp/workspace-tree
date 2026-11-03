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

#[test]
fn test_check_env_drift() {
    let temp_dir = std::env::temp_dir().join("test_env_drift_app");
    let _ = fs::create_dir_all(&temp_dir);
    let _ = fs::write(temp_dir.join(".env"), "PORT=3000\nDATABASE_URL=postgres://localhost\nEXTRA=1\n");
    let _ = fs::write(temp_dir.join(".env.example"), "PORT=3000\nDATABASE_URL=postgres://...\nAPI_KEY=xyz\n");

    let drift = system_tools::check_env_drift(&temp_dir.to_string_lossy());
    assert!(drift.success);
    assert!(drift.has_env);
    assert!(drift.has_example);
    assert_eq!(drift.matched_count, 2);
    assert_eq!(drift.missing_count, 1);
    assert_eq!(drift.extra_count, 1);

    let _ = fs::remove_dir_all(&temp_dir);
    println!("test_check_env_drift passed successfully!");
}
