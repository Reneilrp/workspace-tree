use std::collections::HashSet;
use std::fs;
use std::path::Path;

use crate::models::{
    BrowseItem, BrowseResult, ProjectDetails, ProjectDetailsResult, RootItem, ScriptItem,
    SearchResultItem,
};

pub const IGNORED_NAMES: &[&str] = &[
    "node_modules",
    ".git",
    ".svn",
    ".hg",
    "AppData",
    "Local Settings",
    "Application Data",
    "$RECYCLE.BIN",
    "System Volume Information",
    ".cache",
    ".npm",
    ".pnpm",
    ".yarn",
    "dist",
    "build",
    "target",
    "vendor",
    "venv",
    ".venv",
    "__pycache__",
    ".next",
    ".nuxt",
    "NTUSER.DAT",
    "ntuser.dat.LOG1",
    "ntuser.dat.LOG2",
    "ntuser.ini",
];

pub struct ProjectIndicator {
    pub file: &'static str,
    pub ptype: &'static str,
    pub icon: &'static str,
}

pub const PROJECT_INDICATORS: &[ProjectIndicator] = &[
    ProjectIndicator { file: "artisan", ptype: "PHP (Laravel)", icon: "php" },
    ProjectIndicator { file: "composer.json", ptype: "PHP", icon: "php" },
    ProjectIndicator { file: "package.json", ptype: "Node.js", icon: "node" },
    ProjectIndicator { file: "Cargo.toml", ptype: "Rust", icon: "rust" },
    ProjectIndicator { file: "pyproject.toml", ptype: "Python", icon: "python" },
    ProjectIndicator { file: "requirements.txt", ptype: "Python", icon: "python" },
    ProjectIndicator { file: "manage.py", ptype: "Python (Django)", icon: "python" },
    ProjectIndicator { file: "Pipfile", ptype: "Python", icon: "python" },
    ProjectIndicator { file: "setup.py", ptype: "Python", icon: "python" },
    ProjectIndicator { file: "environment.yml", ptype: "Python", icon: "python" },
    ProjectIndicator { file: "server.js", ptype: "Node.js (Express)", icon: "node" },
    ProjectIndicator { file: "go.mod", ptype: "Go", icon: "go" },
    ProjectIndicator { file: "pom.xml", ptype: "Java", icon: "java" },
    ProjectIndicator { file: ".git", ptype: "Git Repo", icon: "git" },
    ProjectIndicator { file: "CMakeLists.txt", ptype: "C/C++", icon: "cpp" },
    ProjectIndicator { file: "docker-compose.yml", ptype: "Docker", icon: "docker" },
    ProjectIndicator { file: "compose.yaml", ptype: "Docker", icon: "docker" },
    ProjectIndicator { file: "composer.json", ptype: "PHP", icon: "php" },
];

pub fn is_wsl_path(p: &str) -> bool {
    let norm = p.replace('\\', "/").to_lowercase();
    norm.contains("wsl.localhost")
        || norm.contains("wsl$")
        || norm.starts_with("/home")
        || norm.contains("/ubuntu")
}

pub fn to_linux_path(wsl_path: &str) -> String {
    let parts: Vec<&str> = wsl_path
        .split(|c| c == '\\' || c == '/')
        .filter(|s| !s.is_empty())
        .collect();

    if parts.len() >= 2 {
        let first = parts[0].to_lowercase();
        if first == "wsl.localhost" || first == "wsl$" {
            if parts.len() > 2 {
                return format!("/{}", parts[2..].join("/"));
            } else {
                return "/".to_string();
            }
        }
    }
    wsl_path.replace('\\', "/")
}

pub fn normalize_path_cmp(p: &str) -> String {
    p.replace('\\', "/").to_lowercase().trim_end_matches('/').to_string()
}

pub fn get_roots() -> Vec<RootItem> {
    let mut roots = Vec::new();

    #[cfg(target_os = "windows")]
    {
        let win_home = std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\".to_string());
        roots.push(RootItem {
            id: "win-root".to_string(),
            name: "Windows".to_string(),
            subname: win_home.clone(),
            path: win_home,
            os: "windows".to_string(),
            root_type: "os-root".to_string(),
            icon: "windows".to_string(),
            disabled: None,
        });

        let potential_hosts = [r"\\wsl.localhost", r"\\wsl$"];
        for host in potential_hosts {
            if let Ok(distro_entries) = fs::read_dir(host) {
                for distro in distro_entries.flatten() {
                    let distro_name = distro.file_name().to_string_lossy().to_string();
                    let lower_name = distro_name.to_lowercase();
                    if lower_name.contains("ubuntu")
                        || lower_name.contains("debian")
                        || lower_name.contains("wsl")
                    {
                        let home_dir = Path::new(host).join(&distro_name).join("home");
                        if let Ok(users) = fs::read_dir(&home_dir) {
                            for user in users.flatten() {
                                let user_name = user.file_name().to_string_lossy().to_string();
                                let user_home = home_dir.join(&user_name);
                                if user_home.is_dir() {
                                    let path_str = user_home.to_string_lossy().to_string();
                                    roots.push(RootItem {
                                        id: format!("wsl-{}-{}", distro_name, user_name),
                                        name: format!("Ubuntu ({})", user_name),
                                        subname: format!("/home/{}", user_name),
                                        path: path_str,
                                        os: "ubuntu".to_string(),
                                        root_type: "os-root".to_string(),
                                        icon: "ubuntu".to_string(),
                                        disabled: None,
                                    });
                                    break;
                                }
                            }
                        }
                    }
                }
                if roots.len() > 1 {
                    break;
                }
            }
        }

        if roots.len() == 1 {
            let fallback_path = r"\\wsl.localhost\Ubuntu\home\pheinz";
            if Path::new(fallback_path).exists() {
                roots.push(RootItem {
                    id: "ubuntu-root".to_string(),
                    name: "Ubuntu (WSL)".to_string(),
                    subname: "/home/pheinz".to_string(),
                    path: fallback_path.to_string(),
                    os: "ubuntu".to_string(),
                    root_type: "os-root".to_string(),
                    icon: "ubuntu".to_string(),
                    disabled: None,
                });
            } else {
                roots.push(RootItem {
                    id: "ubuntu-root".to_string(),
                    name: "Ubuntu (WSL)".to_string(),
                    subname: "Not currently active".to_string(),
                    path: r"\\wsl.localhost\Ubuntu".to_string(),
                    os: "ubuntu".to_string(),
                    root_type: "os-root".to_string(),
                    icon: "ubuntu".to_string(),
                    disabled: Some(true),
                });
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| "/home".to_string());
        let username = Path::new(&home)
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "User".to_string());

        roots.push(RootItem {
            id: "linux-home".to_string(),
            name: format!("Home ({})", username),
            subname: home.clone(),
            path: home,
            os: "ubuntu".to_string(),
            root_type: "os-root".to_string(),
            icon: "ubuntu".to_string(),
            disabled: None,
        });

        // If running in dual-boot or with mounted Windows C: drive
        if Path::new("/mnt/c").exists() {
            roots.push(RootItem {
                id: "win-mnt-c".to_string(),
                name: "Windows (C:)".to_string(),
                subname: "/mnt/c".to_string(),
                path: "/mnt/c".to_string(),
                os: "windows".to_string(),
                root_type: "os-root".to_string(),
                icon: "windows".to_string(),
                disabled: None,
            });
        }
    }

    roots
}

pub fn inspect_directory(dir_path: &Path) -> (bool, Option<String>, Option<String>) {
    let mut is_project = false;
    let mut project_type = None;
    let mut project_icon = None;

    if let Ok(entries) = fs::read_dir(dir_path) {
        let mut entry_names = HashSet::new();
        for entry in entries.flatten() {
            entry_names.insert(entry.file_name().to_string_lossy().to_string());
        }

        for indicator in PROJECT_INDICATORS {
            if entry_names.contains(indicator.file) {
                is_project = true;
                project_type = Some(indicator.ptype.to_string());
                project_icon = Some(indicator.icon.to_string());
                break;
            }
        }
    }

    (is_project, project_type, project_icon)
}

pub fn browse_directory(
    target_path: &str,
    max_items: usize,
    show_hidden: Option<&str>,
    projects_only: bool,
) -> BrowseResult {
    let target = Path::new(target_path);
    if !target.exists() {
        return BrowseResult {
            success: false,
            path: target_path.to_string(),
            items: Vec::new(),
            total_folders: 0,
            total_files: 0,
            is_root: false,
            error: Some("Path does not exist".to_string()),
        };
    }

    let roots = get_roots();
    let norm_target = normalize_path_cmp(target_path);
    let is_root = roots.iter().any(|r| normalize_path_cmp(&r.path) == norm_target);

    let ignored_set: HashSet<&str> = IGNORED_NAMES.iter().copied().collect();
    let hidden_mode = show_hidden.unwrap_or("projects");

    let mut folders = Vec::new();
    let mut files = Vec::new();

    if let Ok(entries) = fs::read_dir(target) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if ignored_set.contains(name.as_str()) || name.starts_with('$') {
                continue;
            }

            if name.starts_with('.') {
                if hidden_mode == "none" {
                    continue;
                }
                if (hidden_mode == "projects" || hidden_mode == "false") && is_root {
                    continue;
                }
            }

            let full_path = entry.path();
            let full_path_str = full_path.to_string_lossy().to_string();

            if full_path.is_dir() {
                let (is_project, project_type, project_icon) = inspect_directory(&full_path);

                if projects_only && is_root && !is_project {
                    continue;
                }

                folders.push(BrowseItem {
                    id: full_path_str.clone(),
                    name,
                    path: full_path_str,
                    item_type: if is_project { "project".to_string() } else { "directory".to_string() },
                    is_project,
                    project_type,
                    project_icon,
                    has_children: true,
                    ext: None,
                });
            } else if full_path.is_file() {
                if projects_only && is_root {
                    continue;
                }
                if files.len() < 50 {
                    let ext = full_path
                        .extension()
                        .map(|e| format!(".{}", e.to_string_lossy().to_lowercase()));

                    files.push(BrowseItem {
                        id: full_path_str.clone(),
                        name,
                        path: full_path_str,
                        item_type: "file".to_string(),
                        is_project: false,
                        project_type: None,
                        project_icon: None,
                        has_children: false,
                        ext,
                    });
                }
            }
        }
    }

    folders.sort_by(|a, b| {
        if a.is_project && !b.is_project {
            std::cmp::Ordering::Less
        } else if !a.is_project && b.is_project {
            std::cmp::Ordering::Greater
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    let total_folders = folders.len();
    let total_files = files.len();

    let mut combined = folders;
    combined.extend(files);
    if combined.len() > max_items {
        combined.truncate(max_items);
    }

    BrowseResult {
        success: true,
        path: target_path.to_string(),
        items: combined,
        total_folders,
        total_files,
        is_root,
        error: None,
    }
}

fn inspect_sub_dir(
    name: &str,
    dir: &Path,
    b_scripts: &mut Vec<ScriptItem>,
    f_scripts: &mut Vec<ScriptItem>,
) {
    if let Ok(entries) = fs::read_dir(dir) {
        let mut sub_set = HashSet::new();
        for e in entries.flatten() {
            sub_set.insert(e.file_name().to_string_lossy().to_string());
        }

        // 1. Laravel artisan
        if sub_set.contains("artisan") {
            b_scripts.push(ScriptItem {
                name: format!("{}: php artisan serve", name),
                command: "php artisan serve".to_string(),
                cwd: Some(dir.to_string_lossy().to_string()),
            });
            b_scripts.push(ScriptItem {
                name: format!("{}: php artisan migrate", name),
                command: "php artisan migrate".to_string(),
                cwd: Some(dir.to_string_lossy().to_string()),
            });
        }

        // 2. Python manage.py
        if sub_set.contains("manage.py") {
            b_scripts.push(ScriptItem {
                name: format!("{}: python manage.py runserver", name),
                command: "python manage.py runserver".to_string(),
                cwd: Some(dir.to_string_lossy().to_string()),
            });
        }

        // 3. Rust Cargo.toml
        if sub_set.contains("Cargo.toml") {
            b_scripts.push(ScriptItem {
                name: format!("{}: cargo run", name),
                command: "cargo run".to_string(),
                cwd: Some(dir.to_string_lossy().to_string()),
            });
        }

        // 4. Node.js package.json
        if sub_set.contains("package.json") {
            if let Ok(content) = fs::read_to_string(dir.join("package.json")) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(s_map) = val.get("scripts").and_then(|v| v.as_object()) {
                        let lower_name = name.to_lowercase();
                        let is_backend = lower_name.contains("backend")
                            || lower_name.contains("server")
                            || lower_name.contains("api");
                        for &s in &["server", "dev", "start", "serve", "build"] {
                            if s_map.contains_key(s) {
                                let item = ScriptItem {
                                    name: format!("{}: npm run {}", name, s),
                                    command: format!("npm run {}", s),
                                    cwd: Some(dir.to_string_lossy().to_string()),
                                };
                                if is_backend || s == "server" {
                                    b_scripts.push(item);
                                } else {
                                    f_scripts.push(item);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

pub fn get_project_details(dir_path: &str) -> ProjectDetailsResult {
    let p = Path::new(dir_path);
    let name = p
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| dir_path.to_string());

    let mut details = ProjectDetails {
        path: dir_path.to_string(),
        name,
        is_project: false,
        project_type: "Folder".to_string(),
        scripts: Vec::new(),
        default_script: None,
        subfolders: Vec::new(),
    };

    let entries = match fs::read_dir(p) {
        Ok(e) => {
            let mut list = Vec::new();
            for item in e.flatten() {
                list.push(item.file_name().to_string_lossy().to_string());
            }
            list
        }
        Err(err) => {
            return ProjectDetailsResult {
                success: false,
                details: Some(details),
                error: Some(err.to_string()),
            };
        }
    };

    let entry_set: HashSet<String> = entries.into_iter().collect();

    // 1. Node.js / Express
    let has_pkg = entry_set.contains("package.json");
    let has_server_js = entry_set.contains("server.js");
    let has_app_js = entry_set.contains("app.js");
    let has_index_js = entry_set.contains("index.js");

    if has_pkg || has_server_js || has_app_js || has_index_js {
        details.is_project = true;
        details.project_type = "Node.js".to_string();
        let mut is_backend = has_server_js || has_app_js;
        let mut is_frontend = false;

        if has_pkg {
            if let Ok(content) = fs::read_to_string(p.join("package.json")) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(pkg_name) = val.get("name").and_then(|v| v.as_str()) {
                        details.name = pkg_name.to_string();
                    }

                    // Smart detection: Inspect dependencies for Backend vs Frontend packages
                    let backend_indicators = [
                        "express", "fastify", "@nestjs/core", "koa", "hapi", "apollo-server",
                        "socket.io", "mongoose", "prisma", "typeorm", "sequelize", "pg", "mysql2",
                        "redis", "dotenv", "cors", "helmet", "jsonwebtoken"
                    ];
                    let frontend_indicators = [
                        "react", "react-dom", "vue", "vite", "next", "nuxt", "@angular/core",
                        "svelte", "astro", "remix", "solid-js", "gatsby"
                    ];

                    let check_deps = |key: &str| -> (bool, bool) {
                        let mut b = false;
                        let mut f = false;
                        if let Some(deps) = val.get(key).and_then(|v| v.as_object()) {
                            for ind in &backend_indicators {
                                if deps.contains_key(*ind) { b = true; break; }
                            }
                            for ind in &frontend_indicators {
                                if deps.contains_key(*ind) { f = true; break; }
                            }
                        }
                        (b, f)
                    };

                    let (b1, f1) = check_deps("dependencies");
                    let (b2, f2) = check_deps("devDependencies");
                    if b1 || b2 { is_backend = true; }
                    if f1 || f2 { is_frontend = true; }

                    if is_backend && !is_frontend {
                        details.project_type = "Node.js (Backend)".to_string();
                    } else if is_frontend && !is_backend {
                        details.project_type = "Node.js (Frontend)".to_string();
                    } else if is_backend && is_frontend {
                        details.project_type = "Fullstack (Node.js)".to_string();
                    }

                    if let Some(scripts) = val.get("scripts").and_then(|v| v.as_object()) {
                        let priority: &[&str] = if is_backend && !is_frontend {
                            &["server", "api", "backend", "start:backend", "dev:backend", "start:server", "dev:server", "start", "dev", "serve", "build"]
                        } else {
                            &["dev", "start", "serve", "server", "api", "build", "preview", "test"]
                        };

                        for s in priority {
                            if scripts.contains_key(*s) {
                                details.scripts.push(ScriptItem {
                                    name: s.to_string(),
                                    command: format!("npm run {}", s),
                                    cwd: None,
                                });
                            }
                        }
                        for (k, _) in scripts {
                            if !priority.contains(&k.as_str()) {
                                details.scripts.push(ScriptItem {
                                    name: k.clone(),
                                    command: format!("npm run {}", k),
                                    cwd: None,
                                });
                            }
                        }
                    }
                }
            }
        }

        // Standalone Node/Express server fallbacks
        let has_run_script = details.scripts.iter().any(|s| s.name == "server" || s.name == "dev" || s.name == "start");
        if !has_run_script || (is_backend && !details.scripts.iter().any(|s| s.name.contains("server"))) {
            if has_server_js {
                details.scripts.insert(0, ScriptItem {
                    name: "node server.js".to_string(),
                    command: "node server.js".to_string(),
                    cwd: None,
                });
            }
            if has_app_js && !details.scripts.iter().any(|s| s.name == "node app.js") {
                details.scripts.push(ScriptItem {
                    name: "node app.js".to_string(),
                    command: "node app.js".to_string(),
                    cwd: None,
                });
            }
            if has_index_js && !details.scripts.iter().any(|s| s.name == "node index.js") {
                details.scripts.push(ScriptItem {
                    name: "node index.js".to_string(),
                    command: "node index.js".to_string(),
                    cwd: None,
                });
            }
        }
    }

    // 2. Rust (Cargo.toml)
    if entry_set.contains("Cargo.toml") {
        details.is_project = true;
        details.project_type = "Rust".to_string();
        details.scripts.push(ScriptItem {
            name: "run".to_string(),
            command: "cargo run".to_string(),
            cwd: None,
        });
        details.scripts.push(ScriptItem {
            name: "test".to_string(),
            command: "cargo test".to_string(),
            cwd: None,
        });
        details.scripts.push(ScriptItem {
            name: "build".to_string(),
            command: "cargo build".to_string(),
            cwd: None,
        });
    }

    // 3. Python (FastAPI, Flask, Django, Streamlit, Scripts, Virtualenv)
    let is_python = entry_set.contains("pyproject.toml")
        || entry_set.contains("requirements.txt")
        || entry_set.contains("manage.py")
        || entry_set.contains("Pipfile")
        || entry_set.contains("setup.py")
        || entry_set.contains("environment.yml")
        || entry_set.contains("main.py")
        || entry_set.contains("app.py")
        || entry_set.contains("server.py")
        || entry_set.contains("api.py")
        || entry_set.contains("run.py");

    if is_python {
        details.is_project = true;
        let mut py_scripts = Vec::new();

        let is_wsl = is_wsl_path(dir_path);
        // Detect virtualenv (.venv or venv)
        let py_bin = if is_wsl {
            if p.join(".venv").join("bin").join("python").exists() {
                ".venv/bin/python -u"
            } else if p.join("venv").join("bin").join("python").exists() {
                "venv/bin/python -u"
            } else {
                "python3 -u"
            }
        } else if p.join(".venv").join("Scripts").join("python.exe").exists() {
            r".\.venv\Scripts\python.exe -u"
        } else if p.join("venv").join("Scripts").join("python.exe").exists() {
            r".\venv\Scripts\python.exe -u"
        } else {
            "python -u"
        };

        // FastAPI / Uvicorn check
        let is_fastapi = ["main.py", "app.py", "api.py", "server.py"].iter().any(|f| {
            if entry_set.contains(*f) {
                if let Ok(content) = fs::read_to_string(p.join(f)) {
                    return content.contains("FastAPI") || content.contains("fastapi");
                }
            }
            false
        });

        // Django
        if entry_set.contains("manage.py") {
            details.project_type = "Python (Django)".to_string();
            py_scripts.push(ScriptItem {
                name: "django runserver".to_string(),
                command: format!("{} manage.py runserver", py_bin),
                cwd: None,
            });
            py_scripts.push(ScriptItem {
                name: "django migrate".to_string(),
                command: format!("{} manage.py migrate", py_bin),
                cwd: None,
            });
        } else if is_fastapi {
            details.project_type = "Python (FastAPI)".to_string();
            let entry_mod = if entry_set.contains("main.py") {
                "main"
            } else if entry_set.contains("app.py") {
                "app"
            } else {
                "api"
            };
            py_scripts.push(ScriptItem {
                name: "fastapi dev (uvicorn)".to_string(),
                command: format!("uvicorn {}:app --reload", entry_mod),
                cwd: None,
            });
        } else if details.project_type == "Folder" {
            details.project_type = "Python".to_string();
        }

        // Streamlit
        if entry_set.contains("streamlit_app.py") {
            py_scripts.push(ScriptItem {
                name: "streamlit run".to_string(),
                command: "streamlit run streamlit_app.py".to_string(),
                cwd: None,
            });
        }

        // Standard script entrypoints
        for file in ["main.py", "app.py", "server.py", "run.py", "api.py", "bot.py"] {
            if entry_set.contains(file) {
                let script_cmd = format!("{} {}", py_bin, file);
                if !py_scripts.iter().any(|s| s.command == script_cmd) && !details.scripts.iter().any(|s| s.command == script_cmd) {
                    py_scripts.push(ScriptItem {
                        name: format!("run {}", file),
                        command: script_cmd,
                        cwd: None,
                    });
                }
            }
        }

        // Poetry
        if entry_set.contains("poetry.lock") {
            py_scripts.push(ScriptItem {
                name: "poetry run".to_string(),
                command: "poetry run python main.py".to_string(),
                cwd: None,
            });
        }

        // Insert Python scripts at the front so backend commands take precedence
        details.scripts.splice(0..0, py_scripts);
    }

    // 4. PHP / Laravel (artisan, composer.json, index.php)
    let has_artisan = entry_set.contains("artisan");
    let has_composer = entry_set.contains("composer.json");
    let has_index_php = entry_set.contains("index.php") || p.join("public").join("index.php").exists();

    if has_artisan || has_composer || has_index_php {
        details.is_project = true;
        let mut php_scripts = Vec::new();

        if has_artisan {
            details.project_type = "PHP (Laravel)".to_string();
            php_scripts.push(ScriptItem {
                name: "php artisan serve".to_string(),
                command: "php artisan serve".to_string(),
                cwd: None,
            });
            php_scripts.push(ScriptItem {
                name: "php artisan migrate".to_string(),
                command: "php artisan migrate".to_string(),
                cwd: None,
            });
            php_scripts.push(ScriptItem {
                name: "php artisan queue:work".to_string(),
                command: "php artisan queue:work".to_string(),
                cwd: None,
            });
        } else if has_composer {
            if details.project_type == "Folder" {
                details.project_type = "PHP".to_string();
            }
            if let Ok(comp_content) = fs::read_to_string(p.join("composer.json")) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&comp_content) {
                    if let Some(scripts) = val.get("scripts").and_then(|v| v.as_object()) {
                        for &s in &["start", "dev", "serve", "test"] {
                            if scripts.contains_key(s) {
                                php_scripts.push(ScriptItem {
                                    name: format!("composer {}", s),
                                    command: format!("composer run {}", s),
                                    cwd: None,
                                });
                            }
                        }
                    }
                }
            }
            if php_scripts.is_empty() {
                if p.join("public").join("index.php").exists() {
                    php_scripts.push(ScriptItem {
                        name: "php server (public)".to_string(),
                        command: "php -S localhost:8000 -t public".to_string(),
                        cwd: None,
                    });
                } else if entry_set.contains("index.php") {
                    php_scripts.push(ScriptItem {
                        name: "php server".to_string(),
                        command: "php -S localhost:8000".to_string(),
                        cwd: None,
                    });
                }
            }
        } else if has_index_php {
            if details.project_type == "Folder" {
                details.project_type = "PHP".to_string();
            }
            php_scripts.push(ScriptItem {
                name: "php server".to_string(),
                command: "php -S localhost:8000".to_string(),
                cwd: None,
            });
        }

        // Prepend PHP scripts so backend commands (artisan serve) take precedence over frontend asset watchers (Vite dev)
        details.scripts.splice(0..0, php_scripts);
    }

    // 5. Docker Compose
    if entry_set.contains("docker-compose.yml") || entry_set.contains("compose.yaml") {
        details.scripts.push(ScriptItem {
            name: "docker up".to_string(),
            command: "docker compose up".to_string(),
            cwd: None,
        });
    }

    // 6. Monorepo subfolders scanning (if no root scripts)
    if details.scripts.is_empty() {
        let mut backend_sub_scripts = Vec::new();
        let mut frontend_sub_scripts = Vec::new();

        if let Ok(sub_entries) = fs::read_dir(p) {
            for sub in sub_entries.flatten() {
                let sub_name = sub.file_name().to_string_lossy().to_string();
                if sub_name.starts_with('.') || IGNORED_NAMES.contains(&sub_name.as_str()) {
                    continue;
                }
                let sub_path = sub.path();
                if sub_path.is_dir() {
                    inspect_sub_dir(&sub_name, &sub_path, &mut backend_sub_scripts, &mut frontend_sub_scripts);

                    let lower = sub_name.to_lowercase();
                    if lower == "frontend" || lower == "apps" || lower == "packages" || lower == "services" || lower == "modules" {
                        if let Ok(nest_entries) = fs::read_dir(&sub_path) {
                            for nest in nest_entries.flatten() {
                                let nest_name = nest.file_name().to_string_lossy().to_string();
                                if nest_name.starts_with('.') || IGNORED_NAMES.contains(&nest_name.as_str()) {
                                    continue;
                                }
                                let nest_path = nest.path();
                                if nest_path.is_dir() {
                                    inspect_sub_dir(&nest_name, &nest_path, &mut backend_sub_scripts, &mut frontend_sub_scripts);
                                }
                            }
                        }
                    }
                }
            }
        }

        let mut all_scripts = backend_sub_scripts;
        all_scripts.extend(frontend_sub_scripts);

        if !all_scripts.is_empty() {
            details.is_project = true;
            if details.project_type == "Folder" {
                details.project_type = "Fullstack / Monorepo".to_string();
            }
            details.scripts = all_scripts;
        }
    }

    if let Some(first) = details.scripts.first() {
        details.default_script = Some(first.command.clone());
    }

    // Collect discovered subfolders for custom command targeting
    let mut discovered_subs = Vec::new();
    if let Ok(sub_entries) = fs::read_dir(p) {
        for sub in sub_entries.flatten() {
            let sub_name = sub.file_name().to_string_lossy().to_string();
            if sub_name.starts_with('.') || IGNORED_NAMES.contains(&sub_name.as_str()) {
                continue;
            }
            if sub.path().is_dir() {
                discovered_subs.push(sub_name.clone());
                let lower = sub_name.to_lowercase();
                if lower == "frontend" || lower == "apps" || lower == "packages" || lower == "services" || lower == "modules" {
                    if let Ok(nested) = fs::read_dir(sub.path()) {
                        for nest in nested.flatten() {
                            let nest_name = nest.file_name().to_string_lossy().to_string();
                            if !nest_name.starts_with('.') && !IGNORED_NAMES.contains(&nest_name.as_str()) && nest.path().is_dir() {
                                discovered_subs.push(format!("{}/{}", sub_name, nest_name));
                            }
                        }
                    }
                }
            }
        }
    }
    details.subfolders = discovered_subs;

    ProjectDetailsResult {
        success: true,
        details: Some(details),
        error: None,
    }
}

pub fn search_paths(
    query: &str,
    show_hidden: Option<&str>,
    projects_only: bool,
) -> Vec<SearchResultItem> {
    let q = query.trim().to_lowercase();
    if q.len() < 2 {
        return Vec::new();
    }

    let roots = get_roots();
    let mut results = Vec::new();
    let hidden_mode = show_hidden.unwrap_or("projects");

    for root in roots {
        if root.disabled.unwrap_or(false) {
            continue;
        }

        let root_path = Path::new(&root.path);
        if let Ok(entries) = fs::read_dir(root_path) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if IGNORED_NAMES.contains(&name.as_str()) {
                    continue;
                }
                if name.starts_with('.') && (hidden_mode == "none" || hidden_mode == "projects" || hidden_mode == "false") {
                    continue;
                }

                if name.to_lowercase().contains(&q) {
                    let full_path = entry.path();
                    let is_dir = full_path.is_dir();
                    let (is_project, ptype, picon) = if is_dir {
                        inspect_directory(&full_path)
                    } else {
                        (false, None, None)
                    };

                    if projects_only && !is_project {
                        continue;
                    }

                    results.push(SearchResultItem {
                        id: full_path.to_string_lossy().to_string(),
                        name,
                        path: full_path.to_string_lossy().to_string(),
                        os: root.os.clone(),
                        item_type: if is_dir {
                            if is_project { "project".to_string() } else { "directory".to_string() }
                        } else {
                            "file".to_string()
                        },
                        is_project,
                        project_type: ptype,
                        project_icon: picon,
                    });

                    if results.len() >= 25 {
                        break;
                    }
                }
            }
        }
    }

    results
}
