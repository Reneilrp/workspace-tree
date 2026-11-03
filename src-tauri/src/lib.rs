pub mod dev_server;
pub mod fs_scanner;
pub mod launcher;
pub mod models;
pub mod system_tools;

use dev_server::ServerManager;
use models::{
    ActionResponse, ActivePortsResponse, BrowseResult, EnvDriftResponse, FileContentResponse,
    GitStatusResponse, ProjectDetailsResult, RootItem, SearchResultItem, ServerStatusResponse,
    StorageCleanResponse, StorageFootprintResponse, TranslatePathResponse,
};
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn get_roots() -> Vec<RootItem> {
    fs_scanner::get_roots()
}

#[tauri::command]
fn browse_directory(
    path: String,
    max_items: Option<usize>,
    show_hidden: Option<String>,
    projects_only: Option<bool>,
) -> BrowseResult {
    fs_scanner::browse_directory(
        &path,
        max_items.unwrap_or(120),
        show_hidden.as_deref(),
        projects_only.unwrap_or(true),
    )
}

#[tauri::command]
fn get_project_details(path: String) -> ProjectDetailsResult {
    fs_scanner::get_project_details(&path)
}

#[tauri::command]
fn search_paths(
    query: String,
    show_hidden: Option<String>,
    projects_only: Option<bool>,
) -> Vec<SearchResultItem> {
    fs_scanner::search_paths(
        &query,
        show_hidden.as_deref(),
        projects_only.unwrap_or(true),
    )
}

#[tauri::command]
fn launch_action(
    action: String,
    path: String,
    custom_title: Option<String>,
) -> ActionResponse {
    launcher::launch_action(&action, &path, custom_title.as_deref())
}

#[tauri::command]
fn run_terminal(
    path: String,
    command: Option<String>,
    cwd: Option<String>,
    custom_title: Option<String>,
) -> ActionResponse {
    launcher::run_terminal(&path, command.as_deref(), cwd.as_deref(), custom_title.as_deref())
}

#[tauri::command]
fn translate_path(path: String) -> TranslatePathResponse {
    system_tools::translate_path(&path)
}

#[tauri::command]
fn get_file_content(path: String) -> FileContentResponse {
    system_tools::get_file_content(&path)
}

#[tauri::command]
fn get_git_status(path: String) -> GitStatusResponse {
    system_tools::get_git_status(&path)
}

#[tauri::command]
fn get_active_ports() -> ActivePortsResponse {
    system_tools::get_active_ports()
}

#[tauri::command]
fn kill_port(target_port: u16, target_pid: Option<u32>) -> ActionResponse {
    system_tools::kill_port(target_port, target_pid)
}

#[tauri::command]
fn get_storage_footprint(path: String) -> StorageFootprintResponse {
    system_tools::get_storage_footprint(&path)
}

#[tauri::command]
fn clean_storage(path: String, targets: Vec<String>) -> StorageCleanResponse {
    system_tools::clean_storage(&path, targets)
}

#[tauri::command]
fn start_server(
    app: AppHandle,
    state: State<'_, ServerManager>,
    path: String,
    command: String,
    cwd: Option<String>,
    custom_name: Option<String>,
) -> ActionResponse {
    state.start_server(&app, &path, &command, cwd.as_deref(), custom_name.as_deref())
}

#[tauri::command]
fn stop_server(
    app: AppHandle,
    state: State<'_, ServerManager>,
    path: Option<String>,
) -> ActionResponse {
    state.stop_server(&app, path.as_deref())
}

#[tauri::command]
fn get_server_status(state: State<'_, ServerManager>) -> ServerStatusResponse {
    state.get_server_status()
}

fn urlencode_simple(s: &str) -> String {
    let mut result = String::new();
    for b in s.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                result.push(b as char);
            }
            _ => {
                result.push_str(&format!("%{:02X}", b));
            }
        }
    }
    result
}

#[tauri::command]
fn open_project_cockpit(app: AppHandle, path: String) -> ActionResponse {
    let window_label = "cockpit";

    if let Some(window) = app.get_webview_window(window_label) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        let _ = window.emit("switch-project", serde_json::json!({ "path": path }));
        return ActionResponse {
            success: true,
            message: Some("Cockpit focused".to_string()),
            error: None,
        };
    }

    let encoded_path = urlencode_simple(&path);
    let url_str = format!("cockpit.html?path={}", encoded_path);

    let builder = WebviewWindowBuilder::new(&app, window_label, WebviewUrl::App(url_str.into()))
        .title("Project Cockpit — Workspace Tree")
        .inner_size(960.0, 680.0)
        .min_inner_size(720.0, 520.0)
        .resizable(true);

    match builder.build() {
        Ok(_) => ActionResponse {
            success: true,
            message: Some("Cockpit opened".to_string()),
            error: None,
        },
        Err(e) => ActionResponse {
            success: false,
            message: None,
            error: Some(format!("Failed to open cockpit window: {}", e)),
        },
    }
}

#[tauri::command]
fn check_env_drift(path: String) -> EnvDriftResponse {
    system_tools::check_env_drift(&path)
}

#[tauri::command]
fn save_env_file(path: String, content: String) -> ActionResponse {
    system_tools::save_env_file(&path, &content)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ServerManager::new())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_roots,
            browse_directory,
            get_project_details,
            search_paths,
            launch_action,
            run_terminal,
            translate_path,
            get_file_content,
            get_git_status,
            get_active_ports,
            kill_port,
            get_storage_footprint,
            clean_storage,
            start_server,
            stop_server,
            get_server_status,
            open_project_cockpit,
            check_env_drift,
            save_env_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
