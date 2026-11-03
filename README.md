# 🌲 Workspace Tree (Dual-OS Visual Navigator)

A lightweight, fluid, interactive visual tree on a clean white canvas that branches your filesystem into **Windows**, **Ubuntu (WSL)**, and native **Linux**.

---

## ✨ Features

- **Split Trunk Visualization:**
  - 🐧 **Ubuntu / Linux Branch:** Bridges your WSL filesystem (`\\wsl.localhost\Ubuntu\home\<user>`) or native Linux home (`$HOME`).
  - 🪟 **Windows Branch:** Bridges your local Windows filesystem (`C:\Users\<user>`).
- **Fluid Animation & High-DPI Canvas:**
  - 60–120 FPS physics-based spring expansion/collapse
  - Smooth Bezier branching curves with glowing hover states
  - Infinite pan and smooth cursor-centered zoom
- **Smart Project & Framework Detection:**
  - **Node / Express:** Auto-detects package scripts and standalone entrypoints (`server.js`, `app.js`, `index.js`).
  - **Python Ecosystem:** Auto-detects virtual environments (`.venv`, `venv`), frameworks (**Django**, **FastAPI**, **Flask**), and entry scripts (`manage.py`, `app.py`, `main.py`).
  - **Rust, Go, Java, Docker, Git:** Auto-identifies repos, branch statuses, and active port bindings.
- **Embedded Multi-Process Dev Server:**
  - Run, stream live stdout/stderr logs, and terminate processes safely with process-tree cleanup.
  - Built-in custom command runner (`⚙️ Custom command...`).
- **Desktop Actions:**
  - One-click launch into **VS Code**, default file manager (**Explorer / xdg-open**), or terminal (**Windows Terminal / Linux default terminal**).
- **Lightweight & Fast:**
  - Pure native desktop app powered by **Tauri v2** + **Rust** (~2 MB binary/installer).
  - Also runs as a standalone browser app via Node.js on port **7337**.

---

## 🚀 Quick Start

### 🪟 Windows (Native Installer)
Download and run the installer wizard from [Releases](https://github.com/Reneilrp/workspace-tree/releases):
👉 **`Workspace-Tree-Setup-v1.0.0.exe`**
- Only **~2.03 MB**!
- Creates desktop & start menu shortcuts with an uninstaller wizard.

### 🐧 Linux (Debian / Ubuntu / Universal)
- **Debian / Ubuntu:** Install the `.deb` package:
  ```bash
  sudo dpkg -i workspace-tree_*_amd64.deb
  ```
- **Universal Linux:** Run the `.AppImage`:
  ```bash
  chmod +x workspace-tree_*_amd64.AppImage
  ./workspace-tree_*_amd64.AppImage
  ```

### 🌐 Option 3: Browser & Local Server
```bash
node server.js
```
Then open: 👉 **[http://localhost:7337](http://localhost:7337)**

---

## 🛠️ Building from Source

### On Windows
```bash
npm install
npm run tauri build
```

### On Linux (Ubuntu / Debian)
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
npm install
npm run tauri build
```

---

## 🎮 Controls

| Action | Control |
| :--- | :--- |
| **Pan Canvas** | Click & drag anywhere on the canvas |
| **Zoom In / Out** | Mouse wheel or `+` / `-` buttons |
| **Expand / Collapse** | Click any node card |
| **Inspect / Launch Actions** | Click a node to view the action inspector card |
| **Focus Node** | Double-click any node |
| **Recenter View** | Click **Recenter** or double-click empty canvas |
| **Jump to OS** | Click the floating **Ubuntu** or **Windows** pills in bottom-left |
