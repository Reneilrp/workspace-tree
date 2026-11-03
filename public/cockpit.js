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
  const btnStartServer = document.getElementById('btnStartServer');
  const btnStopServer = document.getElementById('btnStopServer');

  // Vitals
  const vitalPorts = document.getElementById('vitalPorts');
  const vitalPortsText = document.getElementById('vitalPortsText');
  const vitalEnv = document.getElementById('vitalEnv');
  const vitalEnvText = document.getElementById('vitalEnvText');
  const vitalGit = document.getElementById('vitalGit');
  const vitalGitText = document.getElementById('vitalGitText');
  const vitalStatus = document.getElementById('vitalStatus');
  const vitalStatusText = document.getElementById('vitalStatusText');

  // Badges
  const badgePorts = document.getElementById('badgePorts');
  const badgeEnv = document.getElementById('badgeEnv');
  const badgeLogs = document.getElementById('badgeLogs');

  // Tables
  const portsTableBody = document.getElementById('portsTableBody');
  const envTableBody = document.getElementById('envTableBody');
  const btnRefreshPorts = document.getElementById('btnRefreshPorts');
  const btnRefreshEnv = document.getElementById('btnRefreshEnv');
  const btnCopyMissing = document.getElementById('btnCopyMissing');
  const btnRefreshGit = document.getElementById('btnRefreshGit');

  // Env stats
  const statEnvFile = document.getElementById('statEnvFile');
  const statExampleFile = document.getElementById('statExampleFile');
  const statMissingCount = document.getElementById('statMissingCount');
  const statMatchedCount = document.getElementById('statMatchedCount');
  let currentMissingTemplate = '';

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
    refreshEnvDrift();
    refreshGitStatus();
    checkServerStatus();
  }

  function normalizeKey(p) {
    return (p || '').toLowerCase().replace(/\\/g, '/').replace(/\/+$/, '');
  }

  function populateScripts(scripts, defaultScript) {
    scriptSelect.innerHTML = '';
    const projKey = normalizeKey(currentPath);
    const savedCmd = localStorage.getItem('workspace_cmd_' + projKey);

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
      opt.textContent = `${s.name} (${s.command})`;
      if (savedCmd && s.command === savedCmd) {
        opt.selected = true;
        hasSelected = true;
      } else if (!savedCmd && !hasSelected && (s.name === defaultScript || s.command === defaultScript)) {
        opt.selected = true;
        hasSelected = true;
      }
      scriptSelect.appendChild(opt);
    });

    if (savedCmd && !hasSelected) {
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
        const customCmd = prompt('Enter custom terminal command to run for this project:', '');
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
        return;
      }
      if (scriptSelect.value) {
        localStorage.setItem('workspace_cmd_' + projKey, scriptSelect.value);
      }
    };
  }

  // 5. Ports Inspector
  async function refreshPorts() {
    try {
      const res = await fetch('/api/active-ports');
      const data = await res.json();
      activePortList = data.ports || [];

      renderPorts(activePortList);
    } catch (err) {
      portsTableBody.innerHTML = `<tr><td colspan="6" class="table-empty">Failed to scan ports</td></tr>`;
    }
  }

  function renderPorts(ports) {
    if (!ports || ports.length === 0) {
      portsTableBody.innerHTML = `<tr><td colspan="6" class="table-empty">No active dev listening ports found</td></tr>`;
      vitalPortsText.textContent = 'All Clear';
      vitalPorts.querySelector('.vital-dot').className = 'vital-dot green';
      badgePorts.classList.add('hidden');
      return;
    }

    vitalPortsText.textContent = `${ports.length} Port(s) Busy`;
    vitalPorts.querySelector('.vital-dot').className = 'vital-dot yellow';
    badgePorts.textContent = ports.length;
    badgePorts.classList.remove('hidden');

    portsTableBody.innerHTML = ports.map(p => {
      const pidStr = p.pid ? String(p.pid) : '—';
      const nameStr = p.name || `Port ${p.port}`;
      return `
        <tr>
          <td><strong>:${p.port}</strong></td>
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

  window.killPortItem = async function (port, pid) {
    try {
      const res = await fetch('/api/kill-port', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, pid })
      });
      const data = await res.json();
      appendLog(`[System] Terminated process on port :${port}`, 'system');
      setTimeout(refreshPorts, 600);
    } catch (err) {
      alert('Failed to kill port process: ' + err.message);
    }
  };

  btnRefreshPorts.addEventListener('click', refreshPorts);

  // 6. Env Drift Guard
  async function refreshEnvDrift() {
    if (!currentPath) return;
    try {
      const res = await fetch(`/api/env-drift?path=${encodeURIComponent(currentPath)}`);
      const data = await res.json();
      renderEnvDrift(data);
    } catch {
      envTableBody.innerHTML = `<tr><td colspan="4" class="table-empty">Failed to check .env status</td></tr>`;
    }
  }

  function renderEnvDrift(data) {
    if (!data.success) {
      envTableBody.innerHTML = `<tr><td colspan="4" class="table-empty">No environment files detected</td></tr>`;
      return;
    }

    statEnvFile.textContent = data.hasEnv ? data.envFile : 'Not Found';
    statExampleFile.textContent = data.hasExample ? data.exampleFile : 'None';
    statMissingCount.textContent = data.missingCount || 0;
    statMatchedCount.textContent = data.matchedCount || 0;

    const dot = vitalEnv.querySelector('.vital-dot');
    if (data.missingCount > 0) {
      vitalEnvText.textContent = `${data.missingCount} Missing Key(s)`;
      dot.className = 'vital-dot yellow';
      badgeEnv.classList.remove('hidden');
    } else if (data.hasEnv) {
      vitalEnvText.textContent = 'All Configured';
      dot.className = 'vital-dot green';
      badgeEnv.classList.add('hidden');
    } else {
      vitalEnvText.textContent = 'No .env';
      dot.className = 'vital-dot gray';
      badgeEnv.classList.add('hidden');
    }

    const missingKeys = (data.keys || []).filter(k => k.status === 'missing');
    currentMissingTemplate = missingKeys.map(k => `${k.key}=${k.exampleValue || ''}`).join('\n');

    if (!data.keys || data.keys.length === 0) {
      envTableBody.innerHTML = `<tr><td colspan="4" class="table-empty">No environment variables found</td></tr>`;
      return;
    }

    envTableBody.innerHTML = data.keys.map(k => {
      let statusChip = '';
      if (k.status === 'matched') {
        statusChip = '<span class="env-status-pill matched">Configured</span>';
      } else if (k.status === 'missing') {
        statusChip = '<span class="env-status-pill missing">Missing</span>';
      } else {
        statusChip = '<span class="env-status-pill extra">Local Extra</span>';
      }

      const hasValText = k.hasValue ? '🟢 Yes' : (k.status === 'missing' ? '❌ No' : '⚪ Empty');
      const hint = k.exampleValue ? `<code>${k.exampleValue}</code>` : '—';

      return `
        <tr>
          <td><strong>${k.key}</strong></td>
          <td>${statusChip}</td>
          <td>${hasValText}</td>
          <td>${hint}</td>
        </tr>
      `;
    }).join('');
  }

  btnCopyMissing.addEventListener('click', () => {
    if (!currentMissingTemplate) {
      alert('No missing keys to copy!');
      return;
    }
    navigator.clipboard.writeText(currentMissingTemplate);
    const oldText = btnCopyMissing.textContent;
    btnCopyMissing.textContent = '✅ Copied!';
    setTimeout(() => { btnCopyMissing.textContent = oldText; }, 2000);
  });

  btnRefreshEnv.addEventListener('click', refreshEnvDrift);

  // 7. Git Status
  async function refreshGitStatus() {
    if (!currentPath) return;
    try {
      const res = await fetch(`/api/git-status?path=${encodeURIComponent(currentPath)}`);
      const data = await res.json();
      if (data.success && data.isGit) {
        gitBranchName.textContent = data.branch || 'main';
        gitWorkingStatus.textContent = data.status || 'Clean';
        gitUncommitted.textContent = data.uncommittedCount ? `${data.uncommittedCount} uncommitted files` : 'Clean';
        gitAheadBehind.textContent = data.aheadBehind || 'Up to date';

        vitalGitText.textContent = data.branch || 'Git';
        vitalGit.querySelector('.vital-dot').className = 'vital-dot green';
      } else {
        gitBranchName.textContent = 'Not a git repo';
        gitWorkingStatus.textContent = '—';
        gitUncommitted.textContent = '—';
        gitAheadBehind.textContent = '—';
        vitalGitText.textContent = 'None';
        vitalGit.querySelector('.vital-dot').className = 'vital-dot gray';
      }
    } catch {}
  }

  btnRefreshGit.addEventListener('click', refreshGitStatus);

  // 8. Server Controls & Live Logging
  btnStartServer.addEventListener('click', async () => {
    const cmd = scriptSelect.value;
    if (!cmd) {
      alert('Please select or specify a command to run.');
      return;
    }
    localStorage.setItem('workspace_cmd_' + normalizeKey(currentPath), cmd);

    appendLog(`[System] Starting: ${cmd}...`, 'system');
    btnStartServer.disabled = true;

    try {
      const res = await fetch('/api/server-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          command: cmd,
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
      vitalStatusText.textContent = 'Running';
      vitalStatus.querySelector('.vital-dot').className = 'vital-dot green';
      badgeLogs.classList.remove('hidden');
    } else {
      btnStartServer.classList.remove('hidden');
      btnStopServer.classList.add('hidden');
      vitalStatusText.textContent = 'Idle';
      vitalStatus.querySelector('.vital-dot').className = 'vital-dot gray';
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
