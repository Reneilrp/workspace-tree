// cockpit.js — Dedicated Project Cockpit Window Logic
(function () {
  let currentPath = '';
  let currentProject = null;
  let activePortList = [];
  let isServerRunning = false;
  let sseSource = null;

  // DOM Elements
  const projectName = document.getElementById('projectName');
  const projectPath = document.getElementById('projectPath');
  const projectOsBadge = document.getElementById('projectOsBadge');
  const projectTypeBadge = document.getElementById('projectTypeBadge');
  const btnCopyPath = document.getElementById('btnCopyPath');

  const btnVscode = document.getElementById('btnVscode');
  const btnTerminal = document.getElementById('btnTerminal');
  const btnExplorer = document.getElementById('btnExplorer');

  const scriptSelect = document.getElementById('scriptSelect');
  const scriptCwdBadge = document.getElementById('scriptCwdBadge');
  const scriptCwdText = document.getElementById('scriptCwdText');
  const btnStartServer = document.getElementById('btnStartServer');
  const btnStopServer = document.getElementById('btnStopServer');

  // Badges
  const badgePorts = document.getElementById('badgePorts');
  const badgeLogs = document.getElementById('badgeLogs');
  const badgeGit = document.getElementById('badgeGit');

  // Tables
  const portsTableBody = document.getElementById('portsTableBody');
  const btnRefreshPorts = document.getElementById('btnRefreshPorts');
  const btnRefreshGit = document.getElementById('btnRefreshGit');
  const btnFilterProjectPorts = document.getElementById('btnFilterProjectPorts');
  const btnFilterAllPorts = document.getElementById('btnFilterAllPorts');
  const gitChangesCount = document.getElementById('gitChangesCount');
  const gitChangesBody = document.getElementById('gitChangesBody');

  // Logs
  const terminalOutput = document.getElementById('terminalOutput');
  const btnClearLogs = document.getElementById('btnClearLogs');
  const chkAutoScroll = document.getElementById('chkAutoScroll');

  // Git
  const gitBranchName = document.getElementById('gitBranchName');
  const gitWorkingStatus = document.getElementById('gitWorkingStatus');
  const gitUncommitted = document.getElementById('gitUncommitted');
  const gitAheadBehind = document.getElementById('gitAheadBehind');

  // 1. Initial Load from Query Params
  const params = new URLSearchParams(window.location.search);
  const initialPath = params.get('path');
  if (initialPath) {
    loadProject(initialPath);
  } else {
    projectName.textContent = 'No Project Selected';
    projectPath.textContent = 'Open a project from the Workspace Tree canvas';
    refreshPorts();
  }

  // 2. Tauri event listener for project switching
  if (window.__TAURI__ && window.__TAURI__.event && window.__TAURI__.event.listen) {
    window.__TAURI__.event.listen('switch-project', (event) => {
      if (event.payload && event.payload.path) {
        loadProject(event.payload.path);
      }
    });

    window.__TAURI__.event.listen('server-log', (event) => {
      const { text, stream, path: logPath } = event.payload || {};
      if (!logPath || logPath === currentPath) {
        appendLog(text || '', stream || 'stdout');
      }
    });
  }

  // 3. Tab Switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });

  // 4. Load Project Data
  async function loadProject(targetPath) {
    currentPath = targetPath;
    projectPath.textContent = targetPath;
    const baseName = targetPath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'Project';
    projectName.textContent = baseName;
    document.title = `${baseName} — Cockpit`;

    // Detect OS & translation
    try {
      const transRes = await fetch(`/api/translate-path?path=${encodeURIComponent(targetPath)}`);
      const trans = await transRes.json();
      if (trans.isWsl) {
        projectOsBadge.textContent = 'Ubuntu (WSL)';
        projectOsBadge.className = 'os-pill ubuntu';
      } else {
        projectOsBadge.textContent = 'Windows';
        projectOsBadge.className = 'os-pill windows';
      }
    } catch {}

    // Load details & scripts
    try {
      const detRes = await fetch(`/api/project-details?path=${encodeURIComponent(targetPath)}`);
      const det = await detRes.json();
      if (det.success && det.details) {
        currentProject = det.details;
        projectTypeBadge.textContent = det.details.projectType || 'Project';
        populateScripts(det.details.scripts || [], det.details.defaultScript);
      }
    } catch {}

    // Load diagnostics
    refreshPorts();
    refreshGitStatus();
    checkServerStatus();
  }

  function normalizeKey(p) {
    return (p || '').toLowerCase().replace(/\\/g, '/').replace(/\/+$/, '');
  }

  function updateScriptCwdDisplay() {
    if (!scriptCwdBadge || !scriptCwdText) return;
    const selected = scriptSelect.options[scriptSelect.selectedIndex];
    if (!selected || !selected.value || selected.value === '__custom__') {
      scriptCwdBadge.classList.add('hidden');
      return;
    }
    const cwd = selected.getAttribute('data-cwd');
    if (cwd) {
      const normCwd = cwd.replace(/\\/g, '/').replace(/\/+$/, '');
      const normProj = (currentPath || '').replace(/\\/g, '/').replace(/\/+$/, '');
      let rel = normCwd.startsWith(normProj) ? normCwd.slice(normProj.length).replace(/^\/+/, '') : normCwd.split('/').pop();
      scriptCwdText.textContent = rel || 'root';
      scriptCwdBadge.classList.remove('hidden');
    } else {
      scriptCwdText.textContent = 'root';
      scriptCwdBadge.classList.remove('hidden');
    }
  }

  function populateScripts(scripts, defaultScript) {
    scriptSelect.innerHTML = '';
    const projKey = normalizeKey(currentPath);
    const savedCmd = localStorage.getItem('workspace_cmd_' + projKey);

    const isLaravel = defaultScript && defaultScript.includes('artisan');
    const isStaleNpm = isLaravel && savedCmd && !savedCmd.includes('artisan');

    if (!scripts || scripts.length === 0) {
      if (savedCmd) {
        const opt = document.createElement('option');
        opt.value = savedCmd;
        opt.textContent = `Custom: ${savedCmd}`;
        opt.selected = true;
        scriptSelect.appendChild(opt);
      } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No preset scripts found';
        scriptSelect.appendChild(opt);
      }
      const customOpt = document.createElement('option');
      customOpt.value = '__custom__';
      customOpt.textContent = '⚙️ Custom command...';
      scriptSelect.appendChild(customOpt);
      setupScriptSelectHandler(projKey);
      return;
    }

    let hasSelected = false;
    scripts.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.command;
      opt.setAttribute('data-cwd', s.cwd || '');
      opt.setAttribute('data-name', s.name || '');

      const label = s.name.includes(':') ? `📁 ${s.name}` : `${s.name} (${s.command})`;
      opt.textContent = label;

      if (!isStaleNpm && savedCmd && s.command === savedCmd) {
        opt.selected = true;
        hasSelected = true;
      } else if ((!savedCmd || isStaleNpm) && !hasSelected && (s.name === defaultScript || s.command === defaultScript)) {
        opt.selected = true;
        hasSelected = true;
      }
      scriptSelect.appendChild(opt);
    });

    if (savedCmd && !hasSelected && !isStaleNpm) {
      const customOpt = document.createElement('option');
      customOpt.value = savedCmd;
      customOpt.textContent = `Custom: ${savedCmd}`;
      customOpt.selected = true;
      scriptSelect.insertBefore(customOpt, scriptSelect.firstChild);
    }

    const customPromptOpt = document.createElement('option');
    customPromptOpt.value = '__custom__';
    customPromptOpt.textContent = '⚙️ Custom command...';
    scriptSelect.appendChild(customPromptOpt);

    setupScriptSelectHandler(projKey);
  }

  function setupScriptSelectHandler(projKey) {
    scriptSelect.onchange = () => {
      if (scriptSelect.value === '__custom__') {
        const customCmd = prompt('Enter custom terminal command (e.g. "php artisan serve", "backend: php artisan serve"):', '');
        if (customCmd && customCmd.trim()) {
          const raw = customCmd.trim();
          const opt = document.createElement('option');
          opt.value = raw;
          opt.textContent = `Custom: ${raw}`;
          opt.selected = true;
          scriptSelect.insertBefore(opt, scriptSelect.firstChild);
          scriptSelect.value = raw;
          localStorage.setItem('workspace_cmd_' + projKey, raw);
        } else {
          scriptSelect.selectedIndex = 0;
        }
      } else if (scriptSelect.value) {
        localStorage.setItem('workspace_cmd_' + projKey, scriptSelect.value);
      }
      updateScriptCwdDisplay();
    };
    updateScriptCwdDisplay();
  }

  // 5. Ports Inspector
  let portFilterMode = 'project';

  async function refreshPorts() {
    try {
      const q = currentPath ? `?path=${encodeURIComponent(currentPath)}` : '';
      const res = await fetch(`/api/active-ports${q}`);
      const data = await res.json();
      activePortList = data.ports || [];

      renderPorts(activePortList);
    } catch (err) {
      portsTableBody.innerHTML = `<tr><td colspan="6" class="table-empty">Failed to scan ports</td></tr>`;
    }
  }

  function renderPorts(ports) {
    // Determine project ports vs total dev ports
    const projectPorts = ports.filter(p => p.isProjectPort);
    const displayPorts = (portFilterMode === 'project') ? projectPorts : ports;

    // Tab badge reflects active project ports count
    if (projectPorts.length > 0) {
      badgePorts.textContent = projectPorts.length;
      badgePorts.classList.remove('hidden');
    } else {
      badgePorts.classList.add('hidden');
    }

    if (!displayPorts || displayPorts.length === 0) {
      const emptyMsg = (portFilterMode === 'project')
        ? `No active listening ports for this project.<br><span style="font-size:12px;color:var(--text-muted);font-weight:normal;">Switch to "🌐 All Dev Ports" or start the server.</span>`
        : `No active dev listening ports found`;
      portsTableBody.innerHTML = `<tr><td colspan="6" class="table-empty">${emptyMsg}</td></tr>`;
      return;
    }

    portsTableBody.innerHTML = displayPorts.map(p => {
      const pidStr = p.pid ? String(p.pid) : '—';
      const nameStr = p.name || `Port ${p.port}`;
      const isProj = Boolean(p.isProjectPort);
      const badgeHtml = isProj
        ? `<span class="type-pill" style="background:#e0f2fe;color:#0369a1;margin-left:6px;font-size:10px;">Project</span>`
        : '';
      return `
        <tr>
          <td><strong>:${p.port}</strong>${badgeHtml}</td>
          <td><span class="type-pill">${p.protocol || 'TCP'}</span></td>
          <td><code>${pidStr}</code></td>
          <td>${nameStr}</td>
          <td><span class="env-status-pill matched">Listening</span></td>
          <td>
            <button class="pill-btn danger" onclick="window.killPortItem(${p.port}, ${p.pid || 'null'})">
              Kill Process
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (btnFilterProjectPorts && btnFilterAllPorts) {
    btnFilterProjectPorts.addEventListener('click', () => {
      portFilterMode = 'project';
      btnFilterProjectPorts.classList.add('active');
      btnFilterAllPorts.classList.remove('active');
      renderPorts(activePortList);
    });

    btnFilterAllPorts.addEventListener('click', () => {
      portFilterMode = 'all';
      btnFilterAllPorts.classList.add('active');
      btnFilterProjectPorts.classList.remove('active');
      renderPorts(activePortList);
    });
  }

  window.killPortItem = async function (port, pid) {
    if (port === 7337) {
      alert("Port 7337 is Workspace Tree's internal daemon port and is protected.\nTo quit Workspace Tree, use Settings or exit the application.");
      return;
    }

    try {
      const res = await fetch('/api/kill-port', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, pid })
      });
      const data = await res.json();
      if (data.success) {
        appendLog(`[System] Terminated process on port :${port}`, 'system');
        setTimeout(refreshPorts, 600);
      } else {
        alert(data.error || `Failed to kill process on port :${port}`);
      }
    } catch (err) {
      alert('Failed to kill port process: ' + err.message);
    }
  };

  btnRefreshPorts.addEventListener('click', refreshPorts);

  // Helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 7. Git Status
  async function refreshGitStatus() {
    if (!currentPath) return;
    try {
      const res = await fetch(`/api/git-status?path=${encodeURIComponent(currentPath)}`);
      const data = await res.json();
      if (data.success && data.isGit) {
        gitBranchName.textContent = data.branch || 'main';
        const count = data.uncommittedCount ?? data.dirtyCount ?? (data.files ? data.files.length : 0);
        gitWorkingStatus.textContent = data.status || (count > 0 ? 'Modified' : 'Clean');
        gitUncommitted.textContent = count > 0 ? `${count} uncommitted file(s)` : 'Clean';
        gitAheadBehind.textContent = data.aheadBehind || 'Up to date';

        if (count > 0) {
          badgeGit.textContent = count;
          badgeGit.classList.remove('hidden');
        } else {
          badgeGit.classList.add('hidden');
        }

        renderGitChanges(data.files || data.dirtyFiles || []);
      } else {
        gitBranchName.textContent = 'Not a git repo';
        gitWorkingStatus.textContent = '—';
        gitUncommitted.textContent = '—';
        gitAheadBehind.textContent = '—';
        badgeGit.classList.add('hidden');
        renderGitChanges([]);
      }
    } catch {
      renderGitChanges([]);
    }
  }

  function renderGitChanges(files) {
    if (!gitChangesBody) return;
    if (gitChangesCount) {
      gitChangesCount.textContent = files.length;
    }
    if (!files || files.length === 0) {
      gitChangesBody.innerHTML = `<tr><td colspan="2" class="table-empty">No uncommitted changes detected. Working tree clean.</td></tr>`;
      return;
    }

    gitChangesBody.innerHTML = files.map(f => {
      const st = (f.status || 'M').trim();
      let badgeClass = 'modified';
      let label = 'M';
      if (st.includes('?') || st === '??') {
        badgeClass = 'untracked';
        label = '??';
      } else if (st.includes('D')) {
        badgeClass = 'deleted';
        label = 'D';
      } else if (st.includes('A')) {
        badgeClass = 'added';
        label = 'A';
      } else {
        badgeClass = 'modified';
        label = st || 'M';
      }

      const filePath = f.path || f.file || '';
      return `
        <tr>
          <td><span class="git-status-badge ${badgeClass}" title="${label}">${label}</span></td>
          <td><code>${escapeHtml(filePath)}</code></td>
        </tr>
      `;
    }).join('');
  }

  btnRefreshGit.addEventListener('click', refreshGitStatus);

  // 8. Server Controls & Live Logging
  btnStartServer.addEventListener('click', async () => {
    const selectedOpt = scriptSelect.options[scriptSelect.selectedIndex];
    const cmd = scriptSelect.value;
    const cwd = selectedOpt ? selectedOpt.getAttribute('data-cwd') : null;
    if (!cmd) {
      alert('Please select or specify a command to run.');
      return;
    }
    localStorage.setItem('workspace_cmd_' + normalizeKey(currentPath), cmd);

    const folderDesc = cwd ? cwd.replace(/\\/g, '/').split('/').filter(Boolean).pop() : 'root';
    appendLog(`[System] Starting: ${cmd} (Folder: ${folderDesc})...`, 'system');
    btnStartServer.disabled = true;

    try {
      const res = await fetch('/api/server-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          command: cmd,
          cwd: cwd || undefined,
          customName: projectName.textContent
        })
      });
      const data = await res.json();
      if (data.success) {
        setServerRunning(true);
        startSseLogs();
      } else {
        appendLog(`[System Error] ${data.error || 'Failed to start'}`, 'stderr');
      }
    } catch (err) {
      appendLog(`[System Error] ${err.message}`, 'stderr');
    } finally {
      btnStartServer.disabled = false;
    }
  });

  btnStopServer.addEventListener('click', async () => {
    btnStopServer.disabled = true;
    try {
      await fetch('/api/server-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath })
      });
      appendLog('[System] Server stopped.', 'system');
      setServerRunning(false);
      setTimeout(refreshPorts, 1000);
    } catch (err) {
      appendLog(`[System Error] ${err.message}`, 'stderr');
    } finally {
      btnStopServer.disabled = false;
    }
  });

  async function checkServerStatus() {
    try {
      const res = await fetch('/api/server-status');
      const data = await res.json();
      const running = data.servers && data.servers.some(s => s.projectPath === currentPath || s.path === currentPath);
      setServerRunning(running);
      if (running) {
        startSseLogs();
      }
    } catch {}
  }

  function setServerRunning(running) {
    isServerRunning = running;
    if (running) {
      btnStartServer.classList.add('hidden');
      btnStopServer.classList.remove('hidden');
      badgeLogs.classList.remove('hidden');
    } else {
      btnStartServer.classList.remove('hidden');
      btnStopServer.classList.add('hidden');
      badgeLogs.classList.add('hidden');
    }
  }

  function startSseLogs() {
    if (sseSource) return;
    try {
      sseSource = new EventSource('/api/server-stream');
      sseSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.text) {
            appendLog(payload.text, payload.stream || 'stdout');
          }
        } catch {
          appendLog(event.data, 'stdout');
        }
      };
      sseSource.onerror = () => {
        // SSE will auto-retry
      };
    } catch {}
  }

  function appendLog(text, stream) {
    const line = document.createElement('div');
    line.className = `terminal-line ${stream}`;
    line.textContent = text;
    terminalOutput.appendChild(line);

    if (chkAutoScroll.checked) {
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  }

  btnClearLogs.addEventListener('click', () => {
    terminalOutput.innerHTML = '';
  });

  // 9. Launch Action Buttons
  async function launchAction(action) {
    if (!currentPath) return;
    try {
      await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, path: currentPath })
      });
    } catch {}
  }

  btnVscode.addEventListener('click', () => launchAction('vscode'));
  btnTerminal.addEventListener('click', () => launchAction('terminal'));
  btnExplorer.addEventListener('click', () => launchAction('explorer'));

  btnCopyPath.addEventListener('click', () => {
    if (!currentPath) return;
    navigator.clipboard.writeText(currentPath);
    btnCopyPath.textContent = 'Copied!';
    setTimeout(() => { btnCopyPath.textContent = 'Copy'; }, 1800);
  });
})();
