// tauri-bridge.js
// Seamlessly bridges standard fetch() and EventSource() calls in app.js to native Tauri IPC commands
(function () {
  const isTauri = typeof window.__TAURI_INTERNALS__ !== 'undefined' || typeof window.__TAURI__ !== 'undefined';
  if (!isTauri) return;

  const getInvoke = () => {
    if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
      return window.__TAURI__.core.invoke;
    }
    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
      return window.__TAURI_INTERNALS__.invoke;
    }
    return null;
  };

  const originalFetch = window.fetch;
  window.fetch = async function (url, options = {}) {
    if (typeof url !== 'string' || !url.startsWith('/api/')) {
      return originalFetch.apply(this, arguments);
    }

    const invoke = getInvoke();
    if (!invoke) return originalFetch.apply(this, arguments);

    const parsedUrl = new URL(url, 'http://localhost');
    const pathname = parsedUrl.pathname;
    const params = parsedUrl.searchParams;
    let body = {};
    if (options.body) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch {}
    }

    try {
      let result = null;

      if (pathname === '/api/roots') {
        const roots = await invoke('get_roots');
        result = { roots };
      } else if (pathname === '/api/browse') {
        const path = params.get('path');
        const showHidden = params.get('showHidden') || 'projects';
        const projectsOnly = params.get('projectsOnly') !== 'false';
        result = await invoke('browse_directory', { path, showHidden, projectsOnly });
      } else if (pathname === '/api/project-details') {
        const path = params.get('path');
        result = await invoke('get_project_details', { path });
      } else if (pathname === '/api/git-status') {
        const path = params.get('path');
        result = await invoke('get_git_status', { path });
      } else if (pathname === '/api/file-content') {
        const path = params.get('path');
        result = await invoke('get_file_content', { path });
      } else if (pathname === '/api/search') {
        const query = params.get('q') || '';
        const showHidden = params.get('showHidden') || 'projects';
        const projectsOnly = params.get('projectsOnly') !== 'false';
        const searchResults = await invoke('search_paths', { query, showHidden, projectsOnly });
        result = { results: searchResults };
      } else if (pathname === '/api/launch') {
        result = await invoke('launch_action', { action: body.action, path: body.path, customTitle: body.customTitle });
      } else if (pathname === '/api/run-terminal') {
        result = await invoke('run_terminal', { path: body.path, command: body.command, cwd: body.cwd, customTitle: body.customTitle });
      } else if (pathname === '/api/translate-path') {
        const path = params.get('path') || body.path;
        result = await invoke('translate_path', { path });
      } else if (pathname === '/api/active-ports') {
        result = await invoke('get_active_ports');
      } else if (pathname === '/api/kill-port') {
        const port = parseInt(body.port, 10);
        result = await invoke('kill_port', { targetPort: port, targetPid: body.pid ? parseInt(body.pid, 10) : null });
      } else if (pathname === '/api/storage-footprint') {
        const path = params.get('path');
        result = await invoke('get_storage_footprint', { path });
      } else if (pathname === '/api/storage-clean') {
        result = await invoke('clean_storage', { path: body.path, targets: body.targets || [] });
      } else if (pathname === '/api/server-start') {
        const customName = body.name || body.customName;
        result = await invoke('start_server', { path: body.path, command: body.command, cwd: body.cwd, customName });
      } else if (pathname === '/api/server-stop') {
        const stopPath = body.path || params.get('path') || null;
        result = await invoke('stop_server', { path: stopPath });
      } else if (pathname === '/api/server-status') {
        result = await invoke('get_server_status');
      } else if (pathname === '/api/open-cockpit') {
        const path = body.path || params.get('path');
        result = await invoke('open_project_cockpit', { path });
      } else if (pathname === '/api/env-drift') {
        const path = params.get('path') || body.path;
        result = await invoke('check_env_drift', { path });
      } else if (pathname === '/api/save-env') {
        result = await invoke('save_env_file', { path: body.path, content: body.content });
      } else if (pathname === '/api/network-info') {
        result = { success: true, ips: ['127.0.0.1'], port: 0 };
      } else if (pathname === '/api/service-shutdown') {
        result = { success: true, message: 'Shutdown requested' };
      } else {
        result = { success: false, error: 'Endpoint not mapped in Tauri' };
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };

  // Mock EventSource for in-app server logs
  const originalEventSource = window.EventSource;
  window.EventSource = function (url) {
    if (url === '/api/server-stream' && isTauri) {
      const emitter = {
        onmessage: null,
        onerror: null,
        readyState: 1,
        close: () => {
          if (unlisten) unlisten();
        }
      };

      let unlisten = null;
      const setupListener = async () => {
        const invoke = getInvoke();
        if (window.__TAURI__ && window.__TAURI__.event && window.__TAURI__.event.listen) {
          unlisten = await window.__TAURI__.event.listen('server-log', (event) => {
            if (emitter.onmessage) {
              emitter.onmessage({ data: JSON.stringify(event.payload) });
            }
          });
        }
        if (invoke) {
          try {
            const status = await invoke('get_server_status');
            if (emitter.onmessage) {
              emitter.onmessage({ data: JSON.stringify({ type: 'init', servers: status.servers || [], logs: [] }) });
            }
          } catch {}
        }
      };
      setupListener();

      return emitter;
    }
    return new originalEventSource(url);
  };
})();
