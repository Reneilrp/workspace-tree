<h1 align="center">🌲 Workspace Tree</h1>

<p align="center">
  <b>Stop hunting for project folders across terminals. Work on your dual-OS canvas.</b><br>
  An infinite, fluid visual tree that bridges <b>Windows</b> and <b>Ubuntu (WSL)</b> — auto-detects stacks, kills zombie ports, and inspects projects in one click.
</p>

<p align="center">
  <a href="https://github.com/Reneilrp/workspace-tree/releases/latest"><img src="https://img.shields.io/github/v/release/Reneilrp/workspace-tree?label=Download%20for%20Windows&logo=windows&color=0078d4&style=for-the-badge" alt="Download Workspace Tree for Windows"></a>
  <a href="https://github.com/Reneilrp/workspace-tree/releases/latest"><img src="https://img.shields.io/github/v/release/Reneilrp/workspace-tree?label=Download%20for%20Linux&logo=linux&logoColor=white&color=e8a33d&style=for-the-badge" alt="Download Workspace Tree for Linux"></a>
  <a href="http://localhost:7337"><img src="https://img.shields.io/badge/Run%20in%20Browser-Node.js%20Port%207337-339933?logo=nodedotjs&logoColor=white&style=for-the-badge" alt="Run in Browser via Node.js"></a>
</p>

<p align="center">
  <sub>Windows 10/11 x64 (~2.1 MB installer) · Ubuntu & WSL2 · Linux (.deb & .AppImage) · Tauri v2 Native · Zero Bloat</sub>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-666666?labelColor=333333" alt="MIT license" /></a>
  <a href="https://github.com/Reneilrp/workspace-tree/releases"><img src="https://img.shields.io/github/v/release/Reneilrp/workspace-tree?color=10b981&labelColor=333333" alt="Release Version" /></a>
  <a href="https://github.com/Reneilrp/workspace-tree/stargazers"><img src="https://img.shields.io/github/stars/Reneilrp/workspace-tree?labelColor=333333&color=666666&logo=github" alt="GitHub stars" /></a>
</p>

Or run instantly in your browser with Node.js (no build tools required):

```bash
git clone https://github.com/Reneilrp/workspace-tree.git
cd workspace-tree
node server.js
```
Then open **[http://localhost:7337](http://localhost:7337)**.

For native desktop installers (.exe, .deb, .AppImage), see [Install](#install).

---

## Why

When coding on Windows with WSL, your projects live in two separate worlds:
- Windows drive roots (`C:\Users\<user>\...`)
- Linux subsystem roots (`\\wsl.localhost\Ubuntu\home\<user>\...` or `$HOME`)

Jumping between them means juggling multiple Explorer windows, navigating long terminal paths, and forgetting which project has an active `.venv` or uncommitted branch. To make matters worse, dead dev servers frequently linger in the background, locking ports like `3000` or `5173` and forcing tedious `netstat` and `taskkill` commands.

Traditional file trees don't fix this: they show static, monochrome folder trees without any awareness of your developer environment. 

**Workspace Tree changes this workflow.** It visualizes both filesystems as twin trunks on an infinite, high-DPI canvas powered by spring physics. Node scripts, Python virtual environments, Git branch statuses, and active ports are detected automatically. When a background server hangs, a single click in the **Cockpit Studio** terminates the zombie process and frees the port.

---

## The Loop

| Step | What you do | What you see |
|---|---|---|
| **1. Navigate** | Pan, zoom, or jump between the **Windows** and **Ubuntu** pills | A 60–120 FPS spring-physics canvas with smooth Bezier branching curves and glowing hover nodes |
| **2. Identify** | Expand any directory node | Auto-detected stack badges: Node/Express, Python (`FastAPI`, `Flask`, `Django`, `.venv`), Rust, Go, Docker, and Git |
| **3. Diagnose** | Open the detached **Cockpit Studio** | Working branch, remote ahead/behind sync status, granular uncommitted file lists, and pre-flight health checks |
| **4. Clean Ports** | Check **Ports & Sockets (Zombie Killer)** | Active and lingering dev ports (`3000`, `5173`, `8000`, `8080`) across Windows & WSL with a 1-click process terminator |
| **5. Launch & Stream** | Click **VS Code**, **Terminal**, **Explorer**, or **Run** | Instant launcher for your favorite tools, plus live monospace streaming stdout/stderr console logs with process supervision |

---

## See It in Action

### 🌲 Dual-OS Infinite Canvas
> Expand, collapse, and pan across both your Windows and Ubuntu/WSL home directories on a clean, responsive canvas with physics-based spring animations.

```
       [ 🪟 Windows Trunk: C:\Users\<user> ]              [ 🐧 Ubuntu / WSL Trunk: /home/<user> ]
              │                                                     │
       ├── Projects/                                         ├── services/
       │     └── my-fastapi-app [Python 3.11 • venv]         │     └── auth-api [Go • Docker]
       └── web-frontend [React • Port :5173]                 └── worker [Rust • Cargo]
```

### 🎛️ Detached Cockpit Studio (v1.1.3)
> A dedicated multi-window companion workspace with live pre-flight diagnostics, branch tracking, and a built-in process supervisor.

- **🛡️ Ports & Sockets (Zombie Killer):** Instantly locates which process is hogging ports `3000`, `5173`, `8000`, or `8080` and kills it with one click across both OSs.
- **🧭 Git & Branch Diagnostics:** Inspects active branches, remote ahead/behind count, and uncommitted files with color-coded status badges.
- **📋 Live Stream Terminal:** Monospace streaming output with auto-scroll and clean process-tree termination.

---

## More You Can Do

Trigger commands and actions directly from the project inspector card or the Cockpit Studio:

| Action | What happens |
|---|---|
| `⚙️ Custom command...` | Runs any custom CLI command or script inside the project's root folder with live streaming output |
| `🚀 Run Package Script` | Auto-detects scripts from `package.json` (`npm run dev`, `start`, etc.) or Python entrypoints (`manage.py`, `app.py`) |
| `📂 Reveal in Explorer / xdg-open` | Opens the exact path in Windows Explorer or Linux default file manager |
| `💻 Launch Terminal` | Launches Windows Terminal or native Linux terminal directly inside the project directory |
| `📝 Open in VS Code` | Opens the folder in VS Code (`code .` or WSL remote mode) with zero path conversion friction |

---

## Get Started

1. **Download & Launch** — Grab the lightweight Windows installer from [Releases](https://github.com/Reneilrp/workspace-tree/releases/latest) or start via `node server.js`.
2. **Explore your Tree** — Click either the **Windows** or **Ubuntu** trunk to browse your active projects.
3. **Open the Cockpit** — Click **Cockpit Studio** on any detected project to monitor ports, review Git diffs, or run dev servers.

---

## Features

- **dual-trunk visual canvas** — seamless branching into Windows (`C:\Users\<user>`) and Ubuntu/WSL (`\\wsl.localhost\Ubuntu\home\<user>` or `$HOME`) with 60–120 FPS spring physics and smooth Bezier curves.
- **detached cockpit studio** — dedicated companion diagnostic window with live pre-flight health, Git branch inspections, and server monitors.
- **zombie port killer** — automatically identifies occupied ports (`3000`, `5173`, `8000`, etc.) and nukes orphan processes with 1 click across Windows and WSL.
- **zero-config stack detection** — automatically detects Node/Express entry points, Python virtualenvs (`.venv`, `venv`) & frameworks (FastAPI, Django, Flask), Rust `Cargo.toml`, Go modules, Docker, and active Git repositories.
- **multi-process dev runner & log streamer** — execute scripts or custom commands with real-time stdout/stderr streaming and safe process-tree termination.
- **featherweight native desktop binary** — built with Tauri v2 + Rust; the Windows installer is only **~2.1 MB** (unlike 150MB+ Electron apps) and consumes negligible system memory.
- **standalone browser mode** — also runs with pure Node.js on port `7337` without requiring Tauri or Rust installed.
- **in-app update notifier** — non-blocking GitHub release checking to notify you of future updates.

---

## Controls

| Action | Control |
| :--- | :--- |
| **Pan Canvas** | Click & drag anywhere on empty canvas |
| **Zoom In / Out** | Mouse scroll wheel or `+` / `-` buttons |
| **Expand / Collapse Branch** | Click any node card |
| **Inspect / Launch Actions** | Click a node to open the inspector card (VS Code, Terminal, Explorer, Run) |
| **Focus Node** | Double-click any node card |
| **Recenter View** | Click **Recenter** or double-click empty canvas |
| **Jump to OS Trunk** | Click the floating **Ubuntu** or **Windows** pills in bottom-left |

---

## Install

### Desktop App (Tauri v2 Native)

| Platform | Package | Install Command / Action |
|---|---|---|
| **Windows 10+ (x64)** | [**Workspace-Tree-Setup-v1.1.3.exe**](https://github.com/Reneilrp/workspace-tree/releases/latest) | Run installer wizard (~2.1 MB) with desktop & start menu shortcuts |
| **Debian / Ubuntu (x64)** | [`.deb` Package](https://github.com/Reneilrp/workspace-tree/releases/latest) | `sudo dpkg -i workspace-tree_*_amd64.deb` |
| **Universal Linux (x64)** | [`.AppImage`](https://github.com/Reneilrp/workspace-tree/releases/latest) | `chmod +x workspace-tree_*_amd64.AppImage && ./workspace-tree_*_amd64.AppImage` |

### Browser / Standalone Server Mode

No Rust or Tauri toolchains required:

```bash
git clone https://github.com/Reneilrp/workspace-tree.git
cd workspace-tree
node server.js
```

Open [http://localhost:7337](http://localhost:7337) in any modern browser (Chrome, Edge, Firefox, Brave).

---

## Development

To build the native desktop application from source:

### Windows

```bash
# Prerequisites: Node.js 18+, Rust toolchain (cargo, rustc)
npm install
npm run tauri build
```

The compiled installer will be located in `src-tauri/target/release/bundle/nsis/`.

### Linux (Ubuntu / Debian)

```bash
# Install Tauri prerequisites
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

npm install
npm run tauri build
```

The compiled `.deb` and `.AppImage` packages will be placed in `src-tauri/target/release/bundle/`.

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Workspace Tree is open source and released under the [MIT License](LICENSE).
