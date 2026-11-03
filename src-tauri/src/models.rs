use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RootItem {
    pub id: String,
    pub name: String,
    pub subname: String,
    pub path: String,
    pub os: String,
    #[serde(rename = "type")]
    pub root_type: String,
    pub icon: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowseItem {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub item_type: String, // "project" | "directory" | "file"
    #[serde(rename = "isProject")]
    pub is_project: bool,
    #[serde(rename = "projectType", skip_serializing_if = "Option::is_none")]
    pub project_type: Option<String>,
    #[serde(rename = "projectIcon", skip_serializing_if = "Option::is_none")]
    pub project_icon: Option<String>,
    #[serde(rename = "hasChildren")]
    pub has_children: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ext: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowseResult {
    pub success: bool,
    pub path: String,
    pub items: Vec<BrowseItem>,
    #[serde(rename = "totalFolders")]
    pub total_folders: usize,
    #[serde(rename = "totalFiles")]
    pub total_files: usize,
    #[serde(rename = "isRoot")]
    pub is_root: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptItem {
    pub name: String,
    pub command: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cwd: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDetails {
    pub path: String,
    pub name: String,
    #[serde(rename = "isProject")]
    pub is_project: bool,
    #[serde(rename = "projectType")]
    pub project_type: String,
    pub scripts: Vec<ScriptItem>,
    #[serde(rename = "defaultScript", skip_serializing_if = "Option::is_none")]
    pub default_script: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub subfolders: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDetailsResult {
    pub success: bool,
    pub details: Option<ProjectDetails>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub os: String,
    #[serde(rename = "type")]
    pub item_type: String,
    #[serde(rename = "isProject")]
    pub is_project: bool,
    #[serde(rename = "projectType", skip_serializing_if = "Option::is_none")]
    pub project_type: Option<String>,
    #[serde(rename = "projectIcon", skip_serializing_if = "Option::is_none")]
    pub project_icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContentResponse {
    pub success: bool,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<u64>,
    #[serde(rename = "isBinary", skip_serializing_if = "Option::is_none")]
    pub is_binary: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslatePathResponse {
    pub success: bool,
    #[serde(rename = "sourcePath")]
    pub source_path: String,
    #[serde(rename = "isWsl")]
    pub is_wsl: bool,
    #[serde(rename = "windowsPath")]
    pub windows_path: String,
    #[serde(rename = "linuxPath")]
    pub linux_path: String,
    #[serde(rename = "wslUncPath")]
    pub wsl_unc_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFileChange {
    pub status: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatusResponse {
    pub success: bool,
    #[serde(rename = "isGit")]
    pub is_git: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub branch: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(rename = "aheadBehind", skip_serializing_if = "Option::is_none")]
    pub ahead_behind: Option<String>,
    #[serde(rename = "uncommittedCount", skip_serializing_if = "Option::is_none")]
    pub uncommitted_count: Option<usize>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub files: Vec<GitFileChange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivePortItem {
    pub port: u16,
    pub pid: Option<u32>,
    pub name: Option<String>,
    pub protocol: String,
    #[serde(rename = "isProjectPort", skip_serializing_if = "Option::is_none")]
    pub is_project_port: Option<bool>,
    #[serde(rename = "projectName", skip_serializing_if = "Option::is_none")]
    pub project_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivePortsResponse {
    pub success: bool,
    pub ports: Vec<ActivePortItem>,
    #[serde(rename = "projectPortCount", skip_serializing_if = "Option::is_none")]
    pub project_port_count: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageArtifact {
    pub name: String,
    pub path: String,
    pub size: u64,
    #[serde(rename = "formattedSize")]
    pub formatted_size: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageFootprintResponse {
    pub success: bool,
    pub path: String,
    #[serde(rename = "totalBytes")]
    pub total_bytes: u64,
    #[serde(rename = "formattedTotal")]
    pub formatted_total: String,
    pub artifacts: Vec<StorageArtifact>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageCleanResponse {
    pub success: bool,
    #[serde(rename = "freedBytes")]
    pub freed_bytes: u64,
    #[serde(rename = "formattedFreed")]
    pub formatted_freed: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunningServerSummary {
    pub id: String,
    pub key: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "projectName")]
    pub project_name: String,
    #[serde(rename = "projectPath")]
    pub project_path: String,
    #[serde(rename = "workingDir")]
    pub working_dir: String,
    pub command: String,
    #[serde(rename = "startedAt")]
    pub started_at: String,
    #[serde(rename = "startTime")]
    pub start_time: u64,
    pub os: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatusResponse {
    pub success: bool,
    pub running: bool,
    pub servers: Vec<RunningServerSummary>,
}
