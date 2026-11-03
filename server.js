import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { exec, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const PORT = parseInt(process.env.PORT || '7337', 10);

// Ignore lists to keep navigation smooth and prevent deep freezes
const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'AppData',
  'Local Settings',
  'Application Data',
  '$RECYCLE.BIN',
  'System Volume Information',
  '.cache',
  '.npm',
  '.pnpm',
  '.yarn',
  'dist',
  'build',
  'target',
  'vendor',
  'venv',
  '.venv',
  '__pycache__',
  '.next',
  '.nuxt',
  'NTUSER.DAT',
  'ntuser.dat.LOG1',
  'ntuser.dat.LOG2',
  'ntuser.ini'
]);

// Known project indicator files
const PROJECT_INDICATORS = [
  { file: 'package.json', type: 'Node.js', icon: 'node' },
  { file: 'server.js', type: 'Node.js (Express)', icon: 'node' },
  { file: 'Cargo.toml', type: 'Rust', icon: 'rust' },
  { file: 'pyproject.toml', type: 'Python', icon: 'python' },
  { file: 'requirements.txt', type: 'Python', icon: 'python' },
  { file: 'manage.py', type: 'Python (Django)', icon: 'python' },
  { file: 'Pipfile', type: 'Python', icon: 'python' },
  { file: 'setup.py', type: 'Python', icon: 'python' },
  { file: 'environment.yml', type: 'Python', icon: 'python' },
  { file: 'go.mod', type: 'Go', icon: 'go' },
  { file: 'pom.xml', type: 'Java', icon: 'java' },
  { file: '.git', type: 'Git Repo', icon: 'git' },
  { file: 'CMakeLists.txt', type: 'C/C++', icon: 'cpp' },
  { file: 'docker-compose.yml', type: 'Docker', icon: 'docker' },
  { file: 'composer.json', type: 'PHP', icon: 'php' }
];

function isWslPath(p) {
  if (!p) return false;
  const norm = p.replace(/\\/g, '/').toLowerCase();
  return norm.includes('wsl.localhost') || norm.includes('wsl$') || norm.startsWith('/home') || norm.includes('/ubuntu');
}

function toLinuxPath(wslPath) {
  const parts = wslPath.split(/[\\\/]+/).filter(Boolean);
  if (parts.length >= 2 && (parts[0].toLowerCase() === 'wsl.localhost' || parts[0].toLowerCase() === 'wsl$')) {
    return '/' + parts.slice(2).join('/');
  }
  return wslPath.replace(/\\/g, '/');
}

// Discover available roots
async function getRoots() {
  const winHome = os.homedir();
  const roots = [];

  // 1. Windows Root
  roots.push({
    id: 'win-root',
    name: 'Windows',
    subname: winHome,
    path: winHome,
    os: 'windows',
    type: 'os-root',
    icon: 'windows'
  });

  // 2. Discover Ubuntu / WSL Root
  let ubuntuPath = null;
  const potentialWslHosts = ['\\\\wsl.localhost', '\\\\wsl$'];

  for (const host of potentialWslHosts) {
    try {
      const distros = await fsp.readdir(host);
      for (const distro of distros) {
        if (distro.toLowerCase().includes('ubuntu') || distro.toLowerCase().includes('debian') || distro.toLowerCase().includes('wsl')) {
          const homeDir = path.join(host, distro, 'home');
          try {
            const users = await fsp.readdir(homeDir);
            for (const user of users) {
              const userHome = path.join(homeDir, user);
              const st = await fsp.stat(userHome);
              if (st.isDirectory()) {
                ubuntuPath = userHome;
                roots.push({
                  id: `wsl-${distro}-${user}`,
                  name: `Ubuntu (${user})`,
                  subname: `/home/${user}`,
                  path: userHome,
                  os: 'ubuntu',
                  type: 'os-root',
                  icon: 'ubuntu'
                });
                break;
              }
            }
          } catch {}
        }
      }
      if (roots.length > 1) break;
    } catch {}
  }

  // Fallback if WSL discovery didn't find specific path
  if (roots.length === 1) {
    const fallbackPath = '\\\\wsl.localhost\\Ubuntu\\home\\pheinz';
    try {
      await fsp.access(fallbackPath);
      roots.push({
        id: 'ubuntu-root',
        name: 'Ubuntu (WSL)',
        subname: '/home/pheinz',
        path: fallbackPath,
        os: 'ubuntu',
        type: 'os-root',
        icon: 'ubuntu'
      });
    } catch {
      roots.push({
        id: 'ubuntu-root',
        name: 'Ubuntu (WSL)',
        subname: 'Not currently active',
        path: '\\\\wsl.localhost\\Ubuntu',
        os: 'ubuntu',
        type: 'os-root',
        icon: 'ubuntu',
        disabled: true
      });
    }
  }

  return roots;
}

// Inspect a directory to determine if it is a project
async function inspectDirectory(dirPath) {
  let isProject = false;
  let projectType = null;
  let projectIcon = null;

  try {
    const entries = await fsp.readdir(dirPath);
    for (const item of PROJECT_INDICATORS) {
      if (entries.includes(item.file)) {
        isProject = true;
        projectType = item.type;
        projectIcon = item.icon;
        break;
      }
    }
  } catch {}

  return { isProject, projectType, projectIcon };
}

// Get comprehensive project details & detectable runnable scripts
async function getProjectDetails(dirPath) {
  const details = {
    path: dirPath,
    name: path.basename(dirPath),
    isProject: false,
    projectType: 'Folder',
    scripts: [],
    defaultScript: null
  };

  try {
    const entries = await fsp.readdir(dirPath);
    
    // 1. Node.js / Express
    const hasPkg = entries.includes('package.json');
    const hasServerJs = entries.includes('server.js');
    const hasAppJs = entries.includes('app.js');
    const hasIndexJs = entries.includes('index.js');

    if (hasPkg || hasServerJs || hasAppJs || hasIndexJs) {
      details.isProject = true;
      details.projectType = 'Node.js';
      if (hasPkg) {
        try {
          const pkgData = JSON.parse(await fsp.readFile(path.join(dirPath, 'package.json'), 'utf-8'));
          if (pkgData.name) details.name = pkgData.name;
          if (pkgData.scripts) {
            const priority = ['dev', 'start', 'serve', 'build', 'test'];
            for (const s of priority) {
              if (pkgData.scripts[s]) {
                details.scripts.push({ name: s, command: `npm run ${s}` });
              }
            }
            // Add any remaining scripts
            for (const [s, cmd] of Object.entries(pkgData.scripts)) {
              if (!priority.includes(s)) {
                details.scripts.push({ name: s, command: `npm run ${s}` });
              }
            }
          }
        } catch {}
      }

      // Standalone Node/Express server fallbacks
      const hasRunScript = details.scripts.some(s => s.name === 'dev' || s.name === 'start');
      if (!hasRunScript) {
        if (hasServerJs) details.scripts.push({ name: 'node server.js', command: 'node server.js' });
        if (hasAppJs) details.scripts.push({ name: 'node app.js', command: 'node app.js' });
        if (hasIndexJs) details.scripts.push({ name: 'node index.js', command: 'node index.js' });
      }
    }

    // 2. Rust (Cargo.toml)
    if (entries.includes('Cargo.toml')) {
      details.isProject = true;
      details.projectType = 'Rust';
      details.scripts.push({ name: 'run', command: 'cargo run' });
      details.scripts.push({ name: 'test', command: 'cargo test' });
      details.scripts.push({ name: 'build', command: 'cargo build' });
    }

    // 3. Python (FastAPI, Flask, Django, Streamlit, Scripts, Virtualenvs)
    const isPython = entries.includes('pyproject.toml') ||
      entries.includes('requirements.txt') ||
      entries.includes('manage.py') ||
      entries.includes('Pipfile') ||
      entries.includes('setup.py') ||
      entries.includes('environment.yml') ||
      entries.includes('main.py') ||
      entries.includes('app.py') ||
      entries.includes('server.py') ||
      entries.includes('api.py') ||
      entries.includes('run.py');

    if (isPython) {
      details.isProject = true;
      if (details.projectType === 'Folder' || details.projectType === 'Node.js') {
        details.projectType = entries.includes('manage.py') ? 'Python (Django)' : 'Python';
      }

      const isWsl = isWslPath(dirPath);
      let pyBin = isWsl ? 'python3 -u' : 'python -u';
      if (isWsl) {
        if (fs.existsSync(path.join(dirPath, '.venv', 'bin', 'python'))) pyBin = '.venv/bin/python -u';
        else if (fs.existsSync(path.join(dirPath, 'venv', 'bin', 'python'))) pyBin = 'venv/bin/python -u';
      } else {
        if (fs.existsSync(path.join(dirPath, '.venv', 'Scripts', 'python.exe'))) pyBin = '.\\.venv\\Scripts\\python.exe -u';
        else if (fs.existsSync(path.join(dirPath, 'venv', 'Scripts', 'python.exe'))) pyBin = '.\\venv\\Scripts\\python.exe -u';
      }

      // Django
      if (entries.includes('manage.py')) {
        details.scripts.push({ name: 'django runserver', command: `${pyBin} manage.py runserver` });
        details.scripts.push({ name: 'django migrate', command: `${pyBin} manage.py migrate` });
      }

      // FastAPI / Uvicorn check
      let isFastApi = false;
      for (const f of ['main.py', 'app.py', 'api.py', 'server.py']) {
        if (entries.includes(f)) {
          try {
            const content = await fsp.readFile(path.join(dirPath, f), 'utf-8');
            if (content.includes('FastAPI') || content.includes('fastapi')) {
              isFastApi = true;
              const mod = f.replace(/\.py$/, '');
              details.scripts.push({ name: 'fastapi dev (uvicorn)', command: `uvicorn ${mod}:app --reload` });
              break;
            }
          } catch {}
        }
      }

      // Streamlit
      if (entries.includes('streamlit_app.py')) {
        details.scripts.push({ name: 'streamlit run', command: 'streamlit run streamlit_app.py' });
      }

      // Standard python scripts
      for (const file of ['main.py', 'app.py', 'server.py', 'run.py', 'api.py', 'bot.py']) {
        if (entries.includes(file)) {
          const cmd = `${pyBin} ${file}`;
          if (!details.scripts.some(s => s.command === cmd)) {
            details.scripts.push({ name: `run ${file}`, command: cmd });
          }
        }
      }

      // Poetry
      if (entries.includes('poetry.lock')) {
        details.scripts.push({ name: 'poetry run', command: 'poetry run python main.py' });
      }
    }

    // 4. Docker Compose
    if (entries.includes('docker-compose.yml') || entries.includes('compose.yaml')) {
      details.scripts.push({ name: 'docker up', command: 'docker compose up' });
    }

    // 5. Makefile
    if (entries.includes('Makefile')) {
      details.scripts.push({ name: 'make', command: 'make' });
    }

    // 6. Monorepo / Subfolder auto-detection: if no root scripts found, scan subfolders (e.g. frontend, backend, packages)
    if (details.scripts.length === 0) {
      for (const entry of entries) {
        if (IGNORED_NAMES.has(entry) || entry.startsWith('.')) continue;
        const subPath = path.join(dirPath, entry);
        try {
          const st = await fsp.stat(subPath);
          if (st.isDirectory()) {
            const subEntries = await fsp.readdir(subPath);
            if (subEntries.includes('package.json')) {
              try {
                const subPkg = JSON.parse(await fsp.readFile(path.join(subPath, 'package.json'), 'utf-8'));
                if (subPkg.scripts) {
                  for (const s of ['dev', 'start', 'serve', 'build']) {
                    if (subPkg.scripts[s]) {
                      details.scripts.push({
                        name: `${entry}: ${s}`,
                        command: `npm run ${s}`,
                        cwd: subPath
                      });
                    }
                  }
                }
              } catch {}
            } else {
              // Check 1 level deeper (e.g. frontend/AccommoTrackWeb)
              for (const sub2 of subEntries) {
                if (IGNORED_NAMES.has(sub2) || sub2.startsWith('.')) continue;
                const sub2Path = path.join(subPath, sub2);
                try {
                  const st2 = await fsp.stat(sub2Path);
                  if (st2.isDirectory()) {
                    const sub2Entries = await fsp.readdir(sub2Path);
                    if (sub2Entries.includes('package.json')) {
                      const sub2Pkg = JSON.parse(await fsp.readFile(path.join(sub2Path, 'package.json'), 'utf-8'));
                      if (sub2Pkg.scripts) {
                        for (const s of ['dev', 'start', 'serve', 'build']) {
                          if (sub2Pkg.scripts[s]) {
                            details.scripts.push({
                              name: `${sub2}: ${s}`,
                              command: `npm run ${s}`,
                              cwd: sub2Path
                            });
                          }
                        }
                      }
                    }
                  }
                } catch {}
              }
            }
          }
        } catch {}
      }
    }

    // Set default script if available
    if (details.scripts.length > 0) {
      details.defaultScript = details.scripts[0].command;
    }

    return { success: true, details };
  } catch (err) {
    return { success: false, error: err.message, details };
  }
}

// Browse directory contents
async function browseDirectory(targetPath, maxItems = 120, showHidden = 'projects', projectsOnly = true) {
  try {
    const entries = await fsp.readdir(targetPath, { withFileTypes: true });
    const folders = [];
    const files = [];

    const roots = await getRoots();
    const isRoot = roots.some(r => {
      if (!r.path) return false;
      const normT = path.normalize(targetPath).toLowerCase().replace(/[\\\/]+$/, '');
      const normR = path.normalize(r.path).toLowerCase().replace(/[\\\/]+$/, '');
      return normT === normR;
    });

    for (const entry of entries) {
      if (IGNORED_NAMES.has(entry.name) || entry.name.startsWith('$')) {
        continue;
      }

      // Dotfiles rule:
      // 'none': hide everywhere
      // 'all' / true: show everywhere
      // 'projects' / false (default): hide at root, allow inside projects
      if (entry.name.startsWith('.')) {
        if (showHidden === 'none') {
          continue;
        }
        if ((showHidden === 'projects' || showHidden === 'false' || showHidden === false) && isRoot) {
          continue;
        }
      }

      const fullPath = path.join(targetPath, entry.name);

      if (entry.isDirectory()) {
        const { isProject, projectType, projectIcon } = await inspectDirectory(fullPath);

        // Projects-Only mode at OS root: only include detected coding projects
        if (projectsOnly && isRoot && !isProject) {
          continue;
        }

        folders.push({
          id: fullPath,
          name: entry.name,
          path: fullPath,
          type: isProject ? 'project' : 'directory',
          isProject,
          projectType,
          projectIcon,
          hasChildren: true
        });
      } else if (entry.isFile()) {
        // Projects-Only mode at OS root: skip loose files
        if (projectsOnly && isRoot) {
          continue;
        }

        if (files.length < 50) {
          const ext = path.extname(entry.name).toLowerCase();
          files.push({
            id: fullPath,
            name: entry.name,
            path: fullPath,
            type: 'file',
            ext,
            hasChildren: false
          });
        }
      }
    }

    // Sort: Projects first, then folders, then files
    folders.sort((a, b) => {
      if (a.isProject && !b.isProject) return -1;
      if (!a.isProject && b.isProject) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const combined = [...folders, ...files].slice(0, maxItems);
    return { success: true, path: targetPath, items: combined, totalFolders: folders.length, totalFiles: files.length, isRoot };
  } catch (err) {
    return { success: false, error: err.message, path: targetPath, items: [] };
  }
}

// Search across Windows & Ubuntu roots
async function searchPaths(query, showHidden = 'projects', projectsOnly = true) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const roots = await getRoots();
  const results = [];

  for (const root of roots) {
    if (root.disabled) continue;
    try {
      const entries = await fsp.readdir(root.path, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORED_NAMES.has(entry.name)) continue;
        if (entry.name.startsWith('.') && (showHidden === 'none' || showHidden === 'projects' || showHidden === 'false' || showHidden === false)) continue;

        if (entry.name.toLowerCase().includes(q)) {
          const fullPath = path.join(root.path, entry.name);
          const { isProject, projectType, projectIcon } = entry.isDirectory() ? await inspectDirectory(fullPath) : {};

          if (projectsOnly && !isProject) continue;

          results.push({
            id: fullPath,
            name: entry.name,
            path: fullPath,
            os: root.os,
            type: entry.isDirectory() ? (isProject ? 'project' : 'directory') : 'file',
            isProject: !!isProject,
            projectType,
            projectIcon
          });
          if (results.length >= 25) break;
        }
      }
    } catch {}
  }

  return results;
}

// Run terminal or command (groups tabs in single Windows Terminal window via wt.exe -w 0 new-tab)
function runTerminal(targetPath, command, cwd = null, customTitle = null) {
  return new Promise((resolve) => {
    try {
      const workingDir = cwd || targetPath;
      const isWsl = isWslPath(workingDir);
      const projName = customTitle || path.basename(workingDir) || 'Terminal';

      if (isWsl) {
        // --- UBUNTU (WSL) ---
        const linuxPath = toLinuxPath(workingDir);
        const tabTitle = `${projName} (WSL)`;

        if (command) {
          // Dev server command in Ubuntu WSL tab
          const wtArgs = [
            '-w', '0', 'new-tab',
            '--title', tabTitle,
            'wsl.exe', '-d', 'Ubuntu', '--cd', linuxPath, 'bash', '-ic', `${command}; exec bash`
          ];
          const p = spawn('wt.exe', wtArgs, { detached: true, stdio: 'ignore' });
          p.on('error', () => {
            spawn('cmd.exe', ['/c', 'start', `"${tabTitle}"`, 'wsl.exe', '-d', 'Ubuntu', '--cd', linuxPath, 'bash', '-ic', `${command}; exec bash`], {
              detached: true,
              stdio: 'ignore'
            }).unref();
          });
          p.unref();
        } else {
          // Interactive Ubuntu WSL tab grouped in single Windows Terminal window
          const wtArgs = [
            '-w', '0', 'new-tab',
            '--title', tabTitle,
            'wsl.exe', '-d', 'Ubuntu', '--cd', linuxPath
          ];
          const p = spawn('wt.exe', wtArgs, { detached: true, stdio: 'ignore' });
          p.on('error', () => {
            spawn('cmd.exe', ['/c', 'start', `"${tabTitle}"`, 'wsl.exe', '-d', 'Ubuntu', '--cd', linuxPath], {
              detached: true,
              stdio: 'ignore'
            }).unref();
          });
          p.unref();
        }
      } else {
        // --- WINDOWS (PowerShell) ---
        const tabTitle = `${projName}`;

        if (command) {
          // Dev server command in Windows PowerShell tab
          const wtArgs = [
            '-w', '0', 'new-tab',
            '--title', tabTitle,
            '-d', workingDir,
            'powershell.exe', '-NoExit', '-Command', command
          ];
          const p = spawn('wt.exe', wtArgs, { detached: true, stdio: 'ignore' });
          p.on('error', () => {
            spawn('cmd.exe', ['/c', 'start', `"${tabTitle}"`, '/d', workingDir, 'powershell.exe', '-NoExit', '-Command', command], {
              detached: true,
              stdio: 'ignore'
            }).unref();
          });
          p.unref();
        } else {
          // Interactive PowerShell tab grouped in single Windows Terminal window
          const wtArgs = [
            '-w', '0', 'new-tab',
            '--title', tabTitle,
            '-d', workingDir,
            'powershell.exe', '-NoExit'
          ];
          const p = spawn('wt.exe', wtArgs, { detached: true, stdio: 'ignore' });
          p.on('error', () => {
            spawn('cmd.exe', ['/c', 'start', `"${tabTitle}"`, '/d', workingDir, 'powershell.exe', '-NoExit'], {
              detached: true,
              stdio: 'ignore'
            }).unref();
          });
          p.unref();
        }
      }
      resolve({ success: true, message: command ? `Started in Terminal Tab: ${command}` : `Opened "${projName}" in Terminal tab` });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

// Launch desktop actions (VS Code, Explorer, Terminal)
function launchAction(action, targetPath, customTitle = null) {
  return new Promise((resolve) => {
    try {
      const isWsl = isWslPath(targetPath);
      const linuxPath = isWsl ? toLinuxPath(targetPath) : null;

      switch (action) {
        case 'vscode': {
          if (isWsl && linuxPath) {
            // In WSL: run `code .` inside Ubuntu at the target directory
            const p = spawn('wsl.exe', ['-d', 'Ubuntu', '--cd', linuxPath, 'code', '.'], {
              detached: true,
              stdio: 'ignore'
            });
            p.on('error', () => {
              spawn('cmd.exe', ['/c', 'code', targetPath], { detached: true, stdio: 'ignore' }).unref();
            });
            p.unref();
          } else {
            // In Windows: run `code .` with working directory set to targetPath
            const p = spawn('cmd.exe', ['/c', 'code', '.'], {
              cwd: targetPath,
              detached: true,
              stdio: 'ignore'
            });
            p.on('error', () => {
              spawn('cmd.exe', ['/c', 'code', targetPath], { detached: true, stdio: 'ignore' }).unref();
            });
            p.unref();
          }
          return resolve({ success: true, message: 'Opened in VS Code' });
        }
        case 'explorer': {
          let winPath = targetPath;
          if (winPath.startsWith('/') || winPath.startsWith('\\home')) {
            const clean = winPath.replace(/^\/+/, '').replace(/\\+/g, '/');
            winPath = `\\\\wsl.localhost\\Ubuntu\\${clean.replace(/\//g, '\\')}`;
          }

          if (!/^[a-zA-Z]:[\\\/]?$/.test(winPath)) {
            winPath = winPath.replace(/[\\\/]+$/, '');
          }

          let isFile = false;
          try {
            const stat = fs.statSync(winPath);
            isFile = stat.isFile();
          } catch {}

          if (isFile) {
            // Reveal and select file in Windows File Explorer
            const p = spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process explorer.exe -ArgumentList '/select,\`"${winPath}\`"'`], {
              detached: true,
              stdio: 'ignore'
            });
            p.on('error', () => {
              spawn('rundll32.exe', ['url.dll,FileProtocolHandler', path.dirname(winPath)], { detached: true, stdio: 'ignore' }).unref();
            });
            p.unref();
          } else {
            // Open directory in Windows File Explorer via rundll32 FileProtocolHandler (instant, handles Windows and WSL UNC paths)
            const p = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', winPath], {
              detached: true,
              stdio: 'ignore'
            });
            p.on('error', () => {
              spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process explorer.exe -ArgumentList '${winPath.replace(/'/g, "''")}'`], {
                detached: true,
                stdio: 'ignore'
              }).unref();
            });
            p.unref();
          }

          return resolve({ success: true, message: 'Opened in File Explorer' });
        }
        case 'terminal':
          return runTerminal(targetPath, null, null, customTitle).then(resolve);
        default:
          return resolve({ success: false, error: 'Unknown action' });
      }
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

// ==========================================
// IN-APP FILE CONTENT INSPECTOR
// ==========================================

async function getFileContent(targetPath) {
  try {
    const stats = await fsp.stat(targetPath);
    const ext = path.extname(targetPath).toLowerCase();
    const name = path.basename(targetPath);

    const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext);
    const isBinaryExt = ['.exe', '.dll', '.bin', '.zip', '.tar', '.gz', '.7z', '.pdf', '.docx', '.xlsx', '.sqlite', '.db'].includes(ext);

    if (isImage) {
      if (ext === '.svg') {
        const svgContent = await fsp.readFile(targetPath, 'utf-8');
        return {
          success: true,
          name,
          path: targetPath,
          ext,
          size: stats.size,
          isImage: true,
          content: svgContent
        };
      }
      const buffer = await fsp.readFile(targetPath);
      const mime = MIME_TYPES[ext] || 'image/png';
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      return {
        success: true,
        name,
        path: targetPath,
        ext,
        size: stats.size,
        isImage: true,
        dataUrl
      };
    }

    if (isBinaryExt || stats.size > 2 * 1024 * 1024) {
      return {
        success: true,
        name,
        path: targetPath,
        ext,
        size: stats.size,
        isBinary: true,
        message: stats.size > 2 * 1024 * 1024 ? 'File is too large to preview (>2MB)' : 'Binary file format'
      };
    }

    const content = await fsp.readFile(targetPath, 'utf-8');
    const lines = content.split('\n').length;

    return {
      success: true,
      name,
      path: targetPath,
      ext,
      size: stats.size,
      lines,
      content,
      isImage: false,
      isBinary: false
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// ==========================================
// MULTI-PROJECT IN-APP DEV SERVER MANAGER
// ==========================================

const activeServers = new Map(); // projectKey -> { child, info, logs: [] }
const sseClients = new Set();

function normalizePathKey(p) {
  if (!p) return '';
  return path.normalize(p).toLowerCase().replace(/[\\\/]+$/, '');
}

function broadcastToClients(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch {
      sseClients.delete(client);
    }
  }
}

function getActiveServersSummary() {
  const list = [];
  for (const [key, item] of activeServers.entries()) {
    list.push({
      key,
      ...item.info
    });
  }
  return list;
}

function startDevServerProcess(targetPath, command, cwd = null, customName = null) {
  const workingDir = cwd || targetPath;
  const projectKey = normalizePathKey(targetPath);
  const isWsl = isWslPath(workingDir);
  const cmd = command || 'npm run dev';
  const projectName = customName || path.basename(targetPath) || 'Server';

  // Stop any currently running instance for THIS project before restarting
  stopDevServerProcess(targetPath);

  const serverInfo = {
    id: projectKey,
    projectPath: targetPath,
    workingDir,
    projectName,
    command: cmd,
    startTime: Date.now(),
    os: isWsl ? 'ubuntu' : 'windows'
  };

  const serverEntry = {
    child: null,
    info: serverInfo,
    logs: []
  };

  activeServers.set(projectKey, serverEntry);

  const addLog = (entry) => {
    const logItem = {
      ...entry,
      projectId: projectKey,
      projectName,
      timestamp: new Date().toISOString()
    };
    serverEntry.logs.push(logItem);
    if (serverEntry.logs.length > 1500) serverEntry.logs.shift();
    broadcastToClients({ type: 'log', ...logItem });
  };

  addLog({
    type: 'status',
    status: 'starting',
    text: `🚀 [${projectName}] Starting: ${cmd}\n📂 Directory: ${workingDir} [${isWsl ? 'Ubuntu WSL' : 'Windows'}]\n`
  });

  let child;
  if (isWsl) {
    const linuxPath = toLinuxPath(workingDir);
    child = spawn('wsl.exe', ['-d', 'Ubuntu', '--cd', linuxPath, 'bash', '-c', cmd], {
      detached: false
    });
  } else {
    child = spawn(cmd, {
      cwd: workingDir,
      shell: true,
      detached: false
    });
  }

  serverEntry.child = child;

  child.stdout.on('data', (chunk) => {
    addLog({ type: 'stdout', text: chunk.toString() });
  });

  child.stderr.on('data', (chunk) => {
    addLog({ type: 'stderr', text: chunk.toString() });
  });

  child.on('error', (err) => {
    addLog({ type: 'error', text: `❌ [${projectName}] Failed to start: ${err.message}\n` });
    activeServers.delete(projectKey);
    broadcastToClients({ type: 'status', running: false, projectId: projectKey, servers: getActiveServersSummary() });
  });

  child.on('close', (code) => {
    addLog({ type: 'exit', code, text: `\n⏹️ [${projectName}] Process exited with code ${code}\n` });
    activeServers.delete(projectKey);
    broadcastToClients({ type: 'status', running: false, projectId: projectKey, servers: getActiveServersSummary() });
  });

  broadcastToClients({ type: 'status', running: true, projectId: projectKey, info: serverInfo, servers: getActiveServersSummary() });

  return { success: true, message: `Server started for ${projectName} (${cmd})`, info: serverInfo, servers: getActiveServersSummary() };
}

function stopDevServerProcess(targetPath = null) {
  if (!targetPath || targetPath === 'all') {
    // Stop all active servers
    let count = 0;
    for (const [key, item] of activeServers.entries()) {
      try {
        if (process.platform === 'win32' && item.child && item.child.pid) {
          spawn('taskkill', ['/pid', item.child.pid.toString(), '/T', '/F']);
        } else if (item.child) {
          item.child.kill('SIGTERM');
        }
      } catch {}
      count++;
    }
    activeServers.clear();
    broadcastToClients({ type: 'status', servers: [] });
    return { success: true, message: `Stopped ${count} server(s)`, servers: [] };
  }

  const projectKey = normalizePathKey(targetPath);
  const item = activeServers.get(projectKey);
  if (item && item.child) {
    try {
      if (process.platform === 'win32' && item.child.pid) {
        spawn('taskkill', ['/pid', item.child.pid.toString(), '/T', '/F']);
      } else {
        item.child.kill('SIGTERM');
      }
    } catch {}
    activeServers.delete(projectKey);
    broadcastToClients({
      type: 'log',
      projectId: projectKey,
      projectName: item.info.projectName,
      type: 'status',
      status: 'stopped',
      text: `\n🛑 [${item.info.projectName}] Server stopped by user\n`
    });
    broadcastToClients({ type: 'status', running: false, projectId: projectKey, servers: getActiveServersSummary() });
    return { success: true, message: `Server stopped for ${item.info.projectName}`, servers: getActiveServersSummary() };
  }

  return { success: true, message: 'No active server for this project', servers: getActiveServersSummary() };
}

// ==========================================
// 1. DUAL-OS PATH TRANSLATOR
// ==========================================
function translatePath(targetPath) {
  if (!targetPath) return { success: false, error: 'Path is required' };
  const isWsl = isWslPath(targetPath);
  let linuxPath = '';
  let winUnc = '';
  let winDrivePath = '';
  let vscodeUri = '';

  if (isWsl) {
    linuxPath = toLinuxPath(targetPath);
    const cleanLinux = linuxPath.replace(/^\/+/, '').replace(/\//g, '\\');
    winUnc = `\\\\wsl.localhost\\Ubuntu\\${cleanLinux}`;
    vscodeUri = `vscode://vscode-remote/wsl+Ubuntu${linuxPath.startsWith('/') ? linuxPath : '/' + linuxPath}`;
    const mntMatch = linuxPath.match(/^\/mnt\/([a-zA-Z])\/(.*)/);
    if (mntMatch) {
      const driveLetter = mntMatch[1].toUpperCase();
      winDrivePath = `${driveLetter}:\\${mntMatch[2].replace(/\//g, '\\')}`;
    } else {
      winDrivePath = winUnc;
    }
  } else {
    winDrivePath = path.normalize(targetPath);
    winUnc = winDrivePath;
    const driveMatch = winDrivePath.match(/^([a-zA-Z]):\\(.*)/);
    if (driveMatch) {
      const driveLetter = driveMatch[1].toLowerCase();
      linuxPath = `/mnt/${driveLetter}/${driveMatch[2].replace(/\\/g, '/')}`;
    } else {
      linuxPath = targetPath.replace(/\\/g, '/');
    }
    const cleanSlash = winDrivePath.replace(/\\/g, '/');
    vscodeUri = `vscode://file/${cleanSlash.startsWith('/') ? cleanSlash : '/' + cleanSlash}`;
  }

  return {
    success: true,
    isWsl,
    linuxPath,
    winUnc,
    winDrivePath,
    vscodeUri
  };
}

// ==========================================
// 2. GIT STATUS SERVICE (15s In-Memory Cache)
// ==========================================
const gitStatusCache = new Map();

async function getGitStatus(targetPath) {
  if (!targetPath) return { success: false, error: 'Path is required' };
  const cacheKey = targetPath.toLowerCase().replace(/[\\\/]+$/, '');
  const now = Date.now();
  if (gitStatusCache.has(cacheKey)) {
    const entry = gitStatusCache.get(cacheKey);
    if (now - entry.timestamp < 15000) {
      return entry.data;
    }
  }

  const isWsl = isWslPath(targetPath);
  const gitFolder = path.join(targetPath, '.git');

  try {
    if (!fs.existsSync(gitFolder)) {
      const res = { success: true, isGit: false };
      gitStatusCache.set(cacheKey, { timestamp: now, data: res });
      return res;
    }
  } catch {
    return { success: true, isGit: false };
  }

  return new Promise((resolve) => {
    let cmd = '';
    let args = [];
    if (isWsl) {
      const linuxPath = toLinuxPath(targetPath);
      cmd = 'wsl.exe';
      args = ['-d', 'Ubuntu', '--cd', linuxPath, 'git', 'status', '--porcelain=v1', '-b'];
    } else {
      cmd = 'git.exe';
      args = ['-C', targetPath, 'status', '--porcelain=v1', '-b'];
    }

    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', d => { stdout += d.toString(); });
    p.stderr.on('data', d => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      try { p.kill(); } catch {}
      const fallback = { success: true, isGit: true, branch: 'git', isClean: true, dirtyCount: 0 };
      resolve(fallback);
    }, 4000);

    p.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        const fallback = { success: true, isGit: false, error: stderr.trim() };
        resolve(fallback);
        return;
      }

      const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
      let branch = 'unknown';
      let ahead = 0;
      let behind = 0;
      const dirtyFiles = [];

      for (const line of lines) {
        if (line.startsWith('##')) {
          const branchMatch = line.match(/^##\s+([^.\s]+)/);
          if (branchMatch) branch = branchMatch[1];
          const aheadMatch = line.match(/ahead\s+(\d+)/);
          if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
          const behindMatch = line.match(/behind\s+(\d+)/);
          if (behindMatch) behind = parseInt(behindMatch[1], 10);
        } else {
          const status = line.slice(0, 2).trim();
          const file = line.slice(3).trim();
          dirtyFiles.push({ status, file });
        }
      }

      const res = {
        success: true,
        isGit: true,
        branch,
        isClean: dirtyFiles.length === 0,
        dirtyCount: dirtyFiles.length,
        ahead,
        behind,
        dirtyFiles: dirtyFiles.slice(0, 8)
      };
      gitStatusCache.set(cacheKey, { timestamp: now, data: res });
      resolve(res);
    });

    p.on('error', () => {
      clearTimeout(timeout);
      resolve({ success: true, isGit: false });
    });
  });
}

// ==========================================
// 3. ACTIVE DEV SERVERS & PORT MONITOR
// ==========================================
async function getActiveListeningPorts() {
  return new Promise((resolve) => {
    exec('netstat -ano -p tcp', { windowsHide: true }, (err, stdout) => {
      const activePorts = [];
      if (!err && stdout) {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (!line.includes('LISTENING')) continue;
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            const localAddr = parts[1];
            const pid = parts[parts.length - 1];
            const portMatch = localAddr.match(/:(\d+)$/);
            if (portMatch) {
              const port = parseInt(portMatch[1], 10);
              const isDevPort = (port >= 3000 && port <= 3010) ||
                                (port >= 5170 && port <= 5185) ||
                                (port >= 8000 && port <= 8090) ||
                                (port >= 19000 && port <= 19010) ||
                                port === 4000 || port === 4200 || port === 7337;
              if (isDevPort && !activePorts.some(p => p.port === port)) {
                activePorts.push({ port, pid, address: localAddr });
              }
            }
          }
        }
      }
      resolve({ success: true, ports: activePorts, internalServers: getActiveServersSummary() });
    });
  });
}

async function killPortProcess(targetPort, targetPid = null) {
  return new Promise((resolve) => {
    const portNum = parseInt(targetPort, 10);
    if (!portNum) return resolve({ success: false, error: 'Valid port required' });

    if (targetPid) {
      exec(`taskkill /F /PID ${targetPid} /T`, { windowsHide: true }, (err) => {
        if (!err) return resolve({ success: true, message: `Terminated PID ${targetPid} on port ${portNum}` });
        killPortViaNetstat(portNum, resolve);
      });
    } else {
      killPortViaNetstat(portNum, resolve);
    }
  });
}

function killPortViaNetstat(portNum, resolve) {
  exec('netstat -ano -p tcp', { windowsHide: true }, (err, stdout) => {
    if (err || !stdout) return resolve({ success: false, error: 'Failed to inspect ports' });
    const lines = stdout.split('\n');
    let killed = false;
    for (const line of lines) {
      if (line.includes(`:${portNum} `) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          try {
            exec(`taskkill /F /PID ${pid} /T`, { windowsHide: true });
            killed = true;
          } catch {}
        }
      }
    }
    try {
      exec(`wsl.exe -d Ubuntu fuser -k ${portNum}/tcp`, { windowsHide: true });
    } catch {}

    resolve({ success: true, message: `Attempted to stop server on port ${portNum}` });
  });
}

// ==========================================
// 4. STORAGE FOOTPRINT & ARTIFACT CLEANER
// ==========================================
const HEAVY_TARGET_NAMES = ['node_modules', '.cache', 'dist', 'build', '.next', 'vendor', '.venv', 'venv', 'target'];

async function getStorageFootprint(targetPath) {
  if (!targetPath) return { success: false, error: 'Path is required' };
  const isWsl = isWslPath(targetPath);
  const artifacts = [];

  try {
    const entries = await fsp.readdir(targetPath);
    for (const name of HEAVY_TARGET_NAMES) {
      if (!entries.includes(name)) continue;
      const artifactPath = path.join(targetPath, name);
      try {
        const st = await fsp.stat(artifactPath);
        if (st.isDirectory()) {
          artifacts.push({ name, path: artifactPath, formattedSize: '...' });
        }
      } catch {}
    }
  } catch (err) {
    return { success: false, error: err.message };
  }

  if (artifacts.length === 0) {
    return { success: true, artifacts: [] };
  }

  if (isWsl) {
    const linuxPath = toLinuxPath(targetPath);
    return new Promise((resolve) => {
      exec(`wsl.exe -d Ubuntu --cd "${linuxPath}" du -sh ${artifacts.map(a => `"${a.name}"`).join(' ')} 2>/dev/null`, { windowsHide: true }, (err, stdout) => {
        if (!err && stdout) {
          const lines = stdout.split('\n').filter(Boolean);
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              const size = parts[0];
              const name = path.basename(parts[1]);
              const item = artifacts.find(a => a.name === name);
              if (item) item.formattedSize = size;
            }
          }
        }
        resolve({ success: true, artifacts });
      });
    });
  } else {
    return new Promise((resolve) => {
      const psCommands = artifacts.map(a => {
        const safe = a.path.replace(/'/g, "''");
        return `if (Test-Path '${safe}') { $s = (Get-ChildItem -LiteralPath '${safe}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; [math]::Round($s / 1MB, 1).ToString() + 'M ' + '${a.name}' }`;
      }).join('; ');

      exec(`powershell.exe -NoProfile -Command "${psCommands}"`, { windowsHide: true }, (err, stdout) => {
        if (!err && stdout) {
          const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
          for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
              const size = parts[0];
              const name = parts[1];
              const item = artifacts.find(a => a.name === name);
              if (item) item.formattedSize = size;
            }
          }
        }
        resolve({ success: true, artifacts });
      });
    });
  }
}

async function cleanArtifacts(targetPath, targets = []) {
  if (!targetPath || !Array.isArray(targets) || targets.length === 0) {
    return { success: false, error: 'Valid path and targets required' };
  }

  const isWsl = isWslPath(targetPath);
  const deleted = [];
  const errors = [];

  for (const name of targets) {
    if (!HEAVY_TARGET_NAMES.includes(name)) continue;
    const itemPath = path.join(targetPath, name);

    try {
      if (isWsl) {
        const linuxPath = toLinuxPath(targetPath);
        await new Promise((resolve) => {
          exec(`wsl.exe -d Ubuntu --cd "${linuxPath}" rm -rf "${name}"`, { windowsHide: true }, (err) => {
            if (!err) deleted.push(name);
            else errors.push(`${name}: ${err.message}`);
            resolve();
          });
        });
      } else {
        await fsp.rm(itemPath, { recursive: true, force: true });
        deleted.push(name);
      }
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }

  return { success: true, deleted, errors };
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API Routes ---
  if (pathname === '/api/roots') {
    const roots = await getRoots();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ roots }));
    return;
  }

  if (pathname === '/api/browse') {
    const targetPath = url.searchParams.get('path');
    const showHidden = url.searchParams.get('showHidden') || 'projects';
    const projectsOnly = url.searchParams.get('projectsOnly') !== 'false';
    if (!targetPath) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Path parameter is required' }));
      return;
    }
    const data = await browseDirectory(targetPath, 120, showHidden, projectsOnly);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (pathname === '/api/project-details') {
    const targetPath = url.searchParams.get('path');
    if (!targetPath) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Path parameter is required' }));
      return;
    }
    const data = await getProjectDetails(targetPath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (pathname === '/api/network-info') {
    const ifaces = os.networkInterfaces();
    const lanIps = [];
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          lanIps.push(iface.address);
        }
      }
    }
    const lanUrl = lanIps.length > 0 ? `http://${lanIps[0]}:${PORT}` : `http://localhost:${PORT}`;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      port: PORT,
      localUrl: `http://localhost:${PORT}`,
      lanUrl,
      lanIp: lanIps[0] || '127.0.0.1'
    }));
    return;
  }

  if (pathname === '/api/search') {
    const q = url.searchParams.get('q') || '';
    const showHidden = url.searchParams.get('showHidden') || 'projects';
    const projectsOnly = url.searchParams.get('projectsOnly') !== 'false';
    const results = await searchPaths(q, showHidden, projectsOnly);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ results }));
    return;
  }

  if (pathname === '/api/run-terminal' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { path: targetPath, command, cwd, title } = JSON.parse(body || '{}');
        if (!targetPath && !cwd) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Path is required' }));
          return;
        }
        const result = await runTerminal(targetPath, command, cwd, title);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/launch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { action, path: targetPath, title } = JSON.parse(body || '{}');
        if (!action || !targetPath) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Action and path required' }));
          return;
        }
        const result = await launchAction(action, targetPath, title);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // File Content Viewer API
  if (pathname === '/api/file-content') {
    const targetPath = url.searchParams.get('path');
    if (!targetPath) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Path parameter is required' }));
      return;
    }
    const result = await getFileContent(targetPath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // In-App Dev Server Controller APIs (Multi-Project Support)
  if (pathname === '/api/server-start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { path: targetPath, command, cwd, name } = JSON.parse(body || '{}');
        const result = startDevServerProcess(targetPath, command, cwd, name);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/server-stop' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { path: targetPath, all } = JSON.parse(body || '{}');
        const result = stopDevServerProcess(all ? null : targetPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/service-shutdown' && req.method === 'POST') {
    stopDevServerProcess(null);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Workspace Tree Service is shutting down.' }));
    setTimeout(() => {
      process.exit(0);
    }, 400);
    return;
  }

  if (pathname === '/api/server-status') {
    const qPath = url.searchParams.get('path');
    const servers = getActiveServersSummary();
    const isSpecificRunning = qPath ? activeServers.has(normalizePathKey(qPath)) : servers.length > 0;
    const specificInfo = qPath && activeServers.get(normalizePathKey(qPath)) ? activeServers.get(normalizePathKey(qPath)).info : (servers[0] || null);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      running: isSpecificRunning,
      count: servers.length,
      servers,
      info: specificInfo
    }));
    return;
  }

  // Server-Sent Events (SSE) Live Log Stream for In-App Console
  if (pathname === '/api/server-stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    // Send initial snapshot of all servers and recent logs
    const allLogs = [];
    for (const item of activeServers.values()) {
      allLogs.push(...item.logs);
    }
    allLogs.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));

    res.write(`data: ${JSON.stringify({
      type: 'init',
      servers: getActiveServersSummary(),
      logs: allLogs
    })}\n\n`);
    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // --- Workspace Tree Power Features APIs ---

  // 1. Dual-OS Path Translation
  if (pathname === '/api/translate-path') {
    const targetPath = url.searchParams.get('path');
    const result = translatePath(targetPath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // 2. Git Status Inspection
  if (pathname === '/api/git-status') {
    const targetPath = url.searchParams.get('path');
    const result = await getGitStatus(targetPath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // 3. Active Listening Dev Ports
  if (pathname === '/api/active-ports') {
    const result = await getActiveListeningPorts();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/kill-port' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { port, pid } = JSON.parse(body || '{}');
        const result = await killPortProcess(port, pid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 4. Storage Footprint & Cleaner
  if (pathname === '/api/storage-footprint') {
    const targetPath = url.searchParams.get('path');
    const result = await getStorageFootprint(targetPath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/clean-artifacts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { path: targetPath, targets } = JSON.parse(body || '{}');
        const result = await cleanArtifacts(targetPath, targets);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- Static File Serving ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  try {
    const stats = await fsp.stat(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await fsp.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(content);
  } catch (err) {
    try {
      const fallback = await fsp.readFile(path.join(PUBLIC_DIR, 'index.html'));
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(fallback);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
});

// Start Server with Auto-fallback
function startServer(portToTry) {
  server.listen(portToTry, '0.0.0.0', () => {
    const ifaces = os.networkInterfaces();
    let lanIp = '127.0.0.1';
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          lanIp = iface.address;
          break;
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`  🌲 Dual-OS Workspace Tree running at:`);
    console.log(`  -> Local:   http://localhost:${portToTry}`);
    console.log(`  -> Network: http://${lanIp}:${portToTry} (Share with friends)`);
    console.log(`  -> Port:    ${portToTry}`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${portToTry} is in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
