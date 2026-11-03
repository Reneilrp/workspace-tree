# 🌲 Workspace Tree (Dual-OS Visual Navigator)

A lightweight, fluid, interactive visual tree on a clean white canvas that branches your filesystem into **Windows** and **Ubuntu (WSL)**.

---

## ✨ Features

- **Split Trunk Visualization:**
  - 🐧 **Ubuntu Branch:** Directly bridges your WSL filesystem (`\\wsl.localhost\Ubuntu\home\<user>`)
  - 🪟 **Windows Branch:** Bridges your local Windows filesystem (`C:\Users\<user>`)
- **Fluid Animation & High-DPI Canvas:**
  - 60–120 FPS physics-based spring expansion/collapse
  - Smooth Bezier branching curves with glowing hover states
  - Infinite pan and smooth cursor-centered zoom
- **Smart Project Detection:**
  - Automatically recognizes Git repositories, Node.js, Python, Rust, Go, and Java projects
- **Desktop Actions:**
  - One-click launch into **VS Code**, **Windows Explorer**, or **Windows Terminal**
- **Lightweight & Fast:**
  - Built with native Node.js 22 (zero heavy backend npm dependencies)
  - Starts in ~10 milliseconds
  - Port **7337**

---

## 🚀 Quick Start

### Option 1: Native Windows Installer (No Node.js Required!)
Run the installer wizard:
👉 **`Workspace-Tree-Setup-v1.0.0.exe`** (or in `src-tauri/target/release/bundle/nsis/`)
- Pure native Windows application powered by **Tauri v2** + **Rust**.
- Installer size is only **~2.01 MB**!
- Creates desktop & start menu shortcuts with an uninstaller wizard.

### Option 2: Browser & Local Server
```bash
cd "C:\Users\ASUS TUF A5\workspace-tree"
node server.js
```
Then open: 👉 **[http://localhost:7337](http://localhost:7337)**

### 🛠️ Building the Installer from Source
```bash
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
