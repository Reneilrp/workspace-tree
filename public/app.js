// Bifrost Workspace Tree • Tabbed Multi-Workspace Navigator
const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

// Header & Controls Elements
const zoomLabel = document.getElementById('zoomLabel');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnResetView = document.getElementById('btnResetView');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const homeLegend = document.getElementById('homeLegend');
const jumpUbuntu = document.getElementById('jumpUbuntu');
const jumpWin = document.getElementById('jumpWin');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// Tabs & Docked Bars Elements
const tabHome = document.getElementById('tabHome');
const dynamicTabs = document.getElementById('dynamicTabs');
const tabsBar = document.getElementById('tabsBar');
const collapsibleDockWrapper = document.getElementById('collapsibleDockWrapper');
const mainViewBar = document.getElementById('mainViewBar');
const projectActionBar = document.getElementById('projectActionBar');
const btnHideToolbarMain = document.getElementById('btnHideToolbarMain');
const btnHideToolbarProj = document.getElementById('btnHideToolbarProj');

// Project Action Bar Elements
const projOsBadge = document.getElementById('projOsBadge');
const projBreadcrumbNav = document.getElementById('projBreadcrumbNav');
const projActiveTitle = document.getElementById('projActiveTitle');
let focusedBreadcrumbNode = null;
const btnCopyPath = document.getElementById('btnCopyPath');
const btnCopyPathText = document.getElementById('btnCopyPathText');
const btnToggleTools = document.getElementById('btnToggleTools');
const scriptSelect = document.getElementById('scriptSelect');
const btnStartServer = document.getElementById('btnStartServer');
const btnStartServerText = document.getElementById('btnStartServerText');
const btnProjectTerminal = document.getElementById('btnProjectTerminal');
const btnProjectCode = document.getElementById('btnProjectCode');
const btnProjectExplorer = document.getElementById('btnProjectExplorer');
const btnExpandCollapseAll = document.getElementById('btnExpandCollapseAll');
const btnExpandCollapseText = document.getElementById('btnExpandCollapseText');
const btnZoomToFit = document.getElementById('btnZoomToFit');
const btnProjectRecenter = document.getElementById('btnProjectRecenter');
const btnOpenSettings = document.getElementById('btnOpenSettings');
const btnProjectSettings = document.getElementById('btnProjectSettings');

// Custom Cursor Elements
const customCursorDot = document.getElementById('customCursorDot');
const customCursorRing = document.getElementById('customCursorRing');

// Settings Modal Elements
const settingsModal = document.getElementById('settingsModal');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const cursorStyleOptions = document.getElementById('cursorStyleOptions');
const cursorColorPalette = document.getElementById('cursorColorPalette');
const canvasGridOptions = document.getElementById('canvasGridOptions');
const btnFilterProjects = document.getElementById('btnFilterProjects');
const btnFilterAll = document.getElementById('btnFilterAll');
const projectsOnlyOptions = document.getElementById('projectsOnlyOptions');
const hiddenFilesOptions = document.getElementById('hiddenFilesOptions');
const lanUrlDisplay = document.getElementById('lanUrlDisplay');
const localUrlDisplay = document.getElementById('localUrlDisplay');
const btnCopyLanUrl = document.getElementById('btnCopyLanUrl');
const btnCopyLocalUrl = document.getElementById('btnCopyLocalUrl');
const btnExportTabs = document.getElementById('btnExportTabs');
const btnResetTabs = document.getElementById('btnResetTabs');
const btnStopService = document.getElementById('btnStopService');
const serviceStatusDesc = document.getElementById('serviceStatusDesc');
const shortcutsList = document.getElementById('shortcutsList');
const btnResetShortcuts = document.getElementById('btnResetShortcuts');

// Inspector Card Elements
const inspectorCard = document.getElementById('inspectorCard');
const inspOsTag = document.getElementById('inspOsTag');
const inspTypeTag = document.getElementById('inspTypeTag');
const inspName = document.getElementById('inspName');
const inspPath = document.getElementById('inspPath');
const inspCloseBtn = document.getElementById('inspCloseBtn');
const btnOpenCockpit = document.getElementById('btnOpenCockpit');
const btnOpenTab = document.getElementById('btnOpenTab');
const btnOpenTabText = document.getElementById('btnOpenTabText');
const btnFocusView = document.getElementById('btnFocusView');
const btnViewFile = document.getElementById('btnViewFile');
const btnOpenCode = document.getElementById('btnOpenCode');
const btnOpenExplorer = document.getElementById('btnOpenExplorer');
const btnOpenTerminal = document.getElementById('btnOpenTerminal');
const inspStatus = document.getElementById('inspStatus');

// In-App File & Code Viewer Elements
const fileViewerDrawer = document.getElementById('fileViewerDrawer');
const fvResizeHandle = document.getElementById('fvResizeHandle');
const fvWrapBtn = document.getElementById('fvWrapBtn');
const fvIcon = document.getElementById('fvIcon');
const fvTitle = document.getElementById('fvTitle');
const fvPath = document.getElementById('fvPath');
const fvSize = document.getElementById('fvSize');
const fvLines = document.getElementById('fvLines');
const fvCopyBtn = document.getElementById('fvCopyBtn');
const fvCloseBtn = document.getElementById('fvCloseBtn');
const fvImageContainer = document.getElementById('fvImageContainer');
const fvImagePreview = document.getElementById('fvImagePreview');
const fvCodeContainer = document.getElementById('fvCodeContainer');
const fvCodeText = document.getElementById('fvCodeText');
const fvBinaryNotice = document.getElementById('fvBinaryNotice');
const fvBinaryMessage = document.getElementById('fvBinaryMessage');

// In-App Dev Console Elements
const devConsoleDrawer = document.getElementById('devConsoleDrawer');
const consoleResizeHandle = document.getElementById('consoleResizeHandle');
const consoleStatusDot = document.getElementById('consoleStatusDot');
const consoleTitle = document.getElementById('consoleTitle');
const consoleCmdBadge = document.getElementById('consoleCmdBadge');
const btnConsoleClear = document.getElementById('btnConsoleClear');
const btnConsoleStop = document.getElementById('btnConsoleStop');
const btnConsoleToggle = document.getElementById('btnConsoleToggle');
const btnConsoleClose = document.getElementById('btnConsoleClose');
const consoleOutput = document.getElementById('consoleOutput');
const btnToggleDevConsole = document.getElementById('btnToggleDevConsole');
const consoleBtnLabel = document.getElementById('consoleBtnLabel');
const btnMainLiveServers = document.getElementById('btnMainLiveServers');
const mainServersCountText = document.getElementById('mainServersCountText');
const consoleProjectTabs = document.getElementById('consoleProjectTabs');
const btnFilterLevelAll = document.getElementById('btnFilterLevelAll');
const btnFilterLevelErrors = document.getElementById('btnFilterLevelErrors');
const btnFilterLevelWarn = document.getElementById('btnFilterLevelWarn');
const btnFilterLevelHttp = document.getElementById('btnFilterLevelHttp');
const countAll = document.getElementById('countAll');
const countErrors = document.getElementById('countErrors');
const countWarn = document.getElementById('countWarn');
const countHttp = document.getElementById('countHttp');
const consoleSearchInput = document.getElementById('consoleSearchInput');
const btnConsoleSearchClear = document.getElementById('btnConsoleSearchClear');
const btnJumpLatestError = document.getElementById('btnJumpLatestError');

// Camera & Viewport State
let camera = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  zoom: 1,
  targetX: window.innerWidth / 2,
  targetY: window.innerHeight / 2,
  targetZoom: 1
};

let isDragging = false;
let dragStart = { x: 0, y: 0 };
let hoveredNode = null;
let selectedNode = null;

// Custom Cursor & Settings State
let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let cursorRingPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

let currentSettings = {
  cursorStyle: 'ring-dot', // 'ring-dot' | 'glow-orb' | 'precision' | 'system'
  cursorColor: '#0f172a',
  gridStyle: 'dots', // 'dots' | 'lines' | 'blank'
  projectsOnly: true, // Show only coding projects by default
  showHiddenFiles: 'projects' // 'projects' (inside projects only) | 'none' | 'all'
};

function loadSettings() {
  try {
    const raw = localStorage.getItem('workspace_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      currentSettings = { ...currentSettings, ...parsed };
      // Compatibility migration for boolean showHiddenFiles
      if (currentSettings.showHiddenFiles === true) currentSettings.showHiddenFiles = 'all';
      if (currentSettings.showHiddenFiles === false) currentSettings.showHiddenFiles = 'projects';
    }
  } catch {}
}
loadSettings();

// ==========================================
// 1. TAB & WORKSPACE STATE
// ==========================================

function detectOsFromPath(filePath, fallback = 'windows') {
  if (!filePath) return fallback;
  if (filePath.startsWith('\\\\wsl') || filePath.startsWith('/') || filePath.includes('Ubuntu') || filePath.includes('ubuntu')) return 'ubuntu';
  if (/^[a-zA-Z]:/.test(filePath)) return 'windows';
  return fallback;
}

// Resolve the parent root project for any node or path so subfolders (e.g. frontend) never pollute the top tab bar
function findRootProjectInfo(nodeOrPath) {
  const targetPath = typeof nodeOrPath === 'string' ? nodeOrPath : (nodeOrPath ? nodeOrPath.path : '');
  if (!targetPath) return null;

  // 1. Try to traverse node parent chain if a tree node is provided
  if (typeof nodeOrPath === 'object' && nodeOrPath !== null) {
    let curr = nodeOrPath;
    while (curr && curr.parent && curr.parent.type !== 'root' && curr.parent.type !== 'os-root') {
      curr = curr.parent;
    }
    if (curr && curr.type !== 'root' && curr.type !== 'os-root') {
      return {
        path: curr.path,
        name: curr.name,
        os: curr.os || detectOsFromPath(curr.path),
        node: curr
      };
    }
  }

  // 2. Fallback based on known OS root boundaries
  const winRootNode = homeRootNode && homeRootNode.children ? homeRootNode.children.find(c => c.os === 'windows') : null;
  const winBasePath = (winRootNode && winRootNode.path) ? winRootNode.path : 'C:\\Users\\ASUS TUF A5';

  const normTarget = targetPath.replace(/\\/g, '/').toLowerCase();
  const normWinBase = winBasePath.replace(/\\/g, '/').toLowerCase();

  if (normTarget.startsWith(normWinBase)) {
    const origRel = targetPath.slice(winBasePath.length).replace(/^[\\\/]+/, '');
    const origSegment = origRel.split(/[\\\/]/)[0];
    if (origSegment) {
      const rootPath = winBasePath.endsWith('\\') ? winBasePath + origSegment : winBasePath + '\\' + origSegment;
      return {
        path: rootPath,
        name: origSegment,
        os: 'windows'
      };
    }
  }

  const ubuRootNode = homeRootNode && homeRootNode.children ? homeRootNode.children.find(c => c.os === 'ubuntu') : null;
  if (ubuRootNode && ubuRootNode.path) {
    const normUbuBase = ubuRootNode.path.replace(/\\/g, '/').toLowerCase();
    if (normTarget.startsWith(normUbuBase)) {
      const origRel = targetPath.slice(ubuRootNode.path.length).replace(/^[\\\/]+/, '');
      const origSegment = origRel.split(/[\\\/]/)[0];
      if (origSegment) {
        const rootPath = ubuRootNode.path.replace(/\\/g, '/') + '/' + origSegment;
        return {
          path: rootPath,
          name: origSegment,
          os: 'ubuntu'
        };
      }
    }
  }

  return null;
}

let activeTabId = 'home';
let homeRootNode = null;
let activeTreeRoot = null;
let activeNodesMap = new Map(); // id -> node currently on canvas
const projectTreeCache = new Map(); // path -> cached isolated root node
let openTabs = loadSavedTabs(); // Array of { id, title, path, os, type }

function loadSavedTabs() {
  try {
    const raw = localStorage.getItem('workspace_open_tabs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const list = parsed.map(tab => {
          if (!tab || !tab.path) return null;
          const rootInfo = findRootProjectInfo(tab.path);
          const isSubfolder = rootInfo && rootInfo.path !== tab.path;
          return {
            ...tab,
            parentProjectName: tab.parentProjectName || (isSubfolder ? rootInfo.name : null)
          };
        }).filter(Boolean);

        // Group children next to their parents
        const clustered = [];
        const processed = new Set();

        for (const tab of list) {
          if (!tab.parentProjectName) {
            clustered.push(tab);
            processed.add(tab.id);
            for (const child of list) {
              if (child.parentProjectName === tab.title && !processed.has(child.id)) {
                clustered.push(child);
                processed.add(child.id);
              }
            }
          }
        }

        for (const tab of list) {
          if (!processed.has(tab.id)) {
            clustered.push(tab);
            processed.add(tab.id);
          }
        }

        return clustered;
      }
    }
  } catch {}
  return [];
}

function saveTabs() {
  try {
    localStorage.setItem('workspace_open_tabs', JSON.stringify(openTabs));
  } catch {}
}

// Resize Canvas for High-DPI screens
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================
// 2. ROOT & DATA FETCHING
// ==========================================

async function initWorkspace() {
  try {
    const res = await fetch('/api/roots');
    const data = await res.json();
    
    // Create Global Dual-Trunk Home Tree
    homeRootNode = {
      id: 'root-system',
      name: 'Workspace',
      path: '',
      type: 'root',
      os: 'system',
      expanded: true,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      opacity: 1,
      width: 140,
      height: 48,
      children: []
    };

    const ubuntuRoot = data.roots.find(r => r.os === 'ubuntu');
    const winRoot = data.roots.find(r => r.os === 'windows');

    if (ubuntuRoot) {
      const uNode = createNode(ubuntuRoot, homeRootNode, -1);
      uNode.targetX = -280;
      uNode.targetY = 0;
      uNode.currentX = -100;
      homeRootNode.children.push(uNode);
    }

    if (winRoot) {
      const wNode = createNode(winRoot, homeRootNode, 1);
      wNode.targetX = 280;
      wNode.targetY = 0;
      wNode.currentX = 100;
      homeRootNode.children.push(wNode);
    }

    // Auto expand both main OS branches for initial overview
    for (const child of homeRootNode.children) {
      if (!child.disabled) {
        await expandDirectory(child, false);
      }
    }

    renderTabsUI();

    // Check if there was an active project tab restored
    if (openTabs.length > 0) {
      await switchToProjectTab(openTabs[0]);
    } else {
      switchToHomeView();
    }

    checkServerStatus();
    initConsoleSSE();

    loadingOverlay.classList.add('fade-out');
  } catch (err) {
    console.error('Failed to initialize workspace:', err);
    loadingOverlay.classList.add('fade-out');
  }
}

function createNode(data, parent, sideDirection) {
  const isOsRoot = data.type === 'os-root';
  const isProj = data.isProject;
  const parentOs = parent ? parent.os : 'windows';
  const nodeOs = data.os || detectOsFromPath(data.path, parentOs);
  
  const node = {
    id: data.id || data.path,
    name: data.name,
    subname: data.subname || '',
    path: data.path,
    type: data.type,
    os: nodeOs,
    side: sideDirection || (parent ? parent.side : 1),
    isProject: isProj,
    projectType: data.projectType,
    projectIcon: data.projectIcon,
    hasChildren: data.hasChildren !== false,
    children: [],
    expanded: false,
    loading: false,
    parent: parent,
    depth: parent ? parent.depth + 1 : 0,
    disabled: data.disabled,
    
    currentX: parent ? parent.currentX : 0,
    currentY: parent ? parent.currentY : 0,
    targetX: parent ? parent.targetX : 0,
    targetY: parent ? parent.targetY : 0,
    opacity: 0,
    scale: 0.05,
    pulse: 1,
    emergeDelay: 0,
    badgeAngle: (sideDirection || (parent ? parent.side : 1)) === -1 ? Math.PI : 0,
    width: isOsRoot || isProj ? 164 : 140,
    height: isOsRoot || isProj ? 44 : 38,
    gitStatus: null
  };

  if (isProj && data.path) {
    setTimeout(() => {
      fetch(`/api/git-status?path=${encodeURIComponent(data.path)}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.isGit) {
            node.gitStatus = res;
          }
        }).catch(() => {});
    }, 150);
  }

  return node;
}

// Get the mouth / edge point of a folder where files emerge and absorb
function getParentEjectPoint(parent) {
  if (!parent) return { x: 0, y: 0 };
  const side = parent.side || 1;
  return {
    x: parent.currentX + (parent.width / 2) * side,
    y: parent.currentY
  };
}

// Particle shockwave ripples on folder emergence / absorption
const folderRipples = [];

function triggerFolderRipple(x, y, os, type = 'eject', side = 1) {
  const particles = [];
  if (type === 'eject') {
    for (let i = 0; i < 6; i++) {
      const angle = (side === -1 ? Math.PI : 0) + (Math.random() - 0.5) * 1.5;
      const speed = 1.6 + Math.random() * 2.6;
      particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5
      });
    }
  }

  folderRipples.push({
    x,
    y,
    os,
    type,
    particles,
    progress: 0,
    maxFrames: 36 // Clearly visible ~400ms duration
  });
}

function updateAndDrawRipples() {
  for (let i = folderRipples.length - 1; i >= 0; i--) {
    const r = folderRipples[i];
    r.progress += 1;
    const t = r.progress / r.maxFrames;
    if (t >= 1) {
      folderRipples.splice(i, 1);
      continue;
    }

    ctx.save();
    const isUbuntu = r.os === 'ubuntu';
    const color = isUbuntu ? '233, 84, 32' : '2, 132, 199';

    if (r.type === 'eject') {
      // Primary expanding burst wave radiating outward as files emerge
      const radius1 = 8 + t * 44;
      const alpha1 = Math.max(0, (1 - t) * 0.75);
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${alpha1})`;
      ctx.lineWidth = 2.5 * (1 - t * 0.5);
      ctx.stroke();

      // Secondary soft aura wave
      const radius2 = 4 + t * 26;
      const alpha2 = Math.max(0, (1 - t) * 0.45);
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${alpha2})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Emerge spark particles
      for (const p of r.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        const pAlpha = (1 - t) * 0.8;
        ctx.beginPath();
        ctx.arc(r.x + p.x, r.y + p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${pAlpha})`;
        ctx.fill();
      }
    } else {
      // Imploding dual suction vortex pulling files inward as they absorb
      const radius1 = Math.max(1, 46 * (1 - t * 0.9));
      const alpha1 = Math.min(1, t * 2.5) * (1 - t) * 0.85;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${alpha1})`;
      ctx.lineWidth = 2.5 * (1 - t * 0.3);
      ctx.stroke();

      const radius2 = Math.max(1, 28 * (1 - t * 0.85));
      const alpha2 = Math.min(1, t * 2) * (1 - t) * 0.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${alpha2})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }
}

async function expandDirectory(node, recompute = true) {
  if (!node || !node.hasChildren || node.disabled) return;
  
  // Guard against multi-click while an async fetch is in-flight!
  if (node.loading) return;

  const ejectPoint = getParentEjectPoint(node);

  if (node.expanded) {
    // ABSORB / CLOSE
    node.expanded = false;
    node.pulse = 0.80; // Noticeable inward suction pulse
    triggerFolderRipple(ejectPoint.x, ejectPoint.y, node.os, 'absorb', node.side);
    // Sucks all descendant files and folders directly back into the folder mouth
    collapseDescendants(node);
    if (recompute) recalculateLayout();
    return;
  }

  // EMERGE / OPEN
  node.pulse = 1.18; // Noticeable outward ejection pop
  triggerFolderRipple(ejectPoint.x, ejectPoint.y, node.os, 'eject', node.side);

  if (!node.children || node.children.length === 0) {
    node.loading = true;
    try {
      const showHiddenParam = `&showHidden=${encodeURIComponent(currentSettings.showHiddenFiles || 'projects')}`;
      const projectsOnlyParam = `&projectsOnly=${encodeURIComponent(currentSettings.projectsOnly !== false)}`;
      const res = await fetch(`/api/browse?path=${encodeURIComponent(node.path)}${showHiddenParam}${projectsOnlyParam}`);
      const data = await res.json();
      
      if (data.success && Array.isArray(data.items)) {
        node.children = data.items.map((item, idx) => {
          const itemNode = createNode(item, node, node.side);
          itemNode.currentX = ejectPoint.x;
          itemNode.currentY = ejectPoint.y;
          itemNode.targetX = ejectPoint.x;
          itemNode.targetY = ejectPoint.y;
          itemNode.opacity = 0;
          itemNode.scale = 0.05;
          itemNode.emergeDelay = Math.min(idx * 5, 45); // Paced wave ~45-50ms per child
          return itemNode;
        });
      }
    } catch (err) {
      console.error('Failed to load path:', node.path, err);
    } finally {
      node.loading = false;
    }
  } else {
    // If children already exist, emerge them outwards from the folder mouth in a paced wave
    node.children.forEach((child, idx) => {
      if (child.opacity < 0.25) {
        child.currentX = ejectPoint.x;
        child.currentY = ejectPoint.y;
        child.scale = 0.05;
        child.opacity = 0;
        child.emergeDelay = Math.min(idx * 5, 45);
      }
    });
  }

  node.expanded = true;
  if (recompute) recalculateLayout();
}

// ==========================================
// 3. TAB MANAGEMENT & TRUE TREE ISOLATION
// ==========================================

function renderTabsUI() {
  // Cluster consecutive tabs belonging to the same project
  const clusters = [];
  let currentCluster = null;

  for (const tab of openTabs) {
    const clusterKey = tab.parentProjectName || tab.title;
    if (currentCluster && currentCluster.key === clusterKey) {
      currentCluster.tabs.push(tab);
    } else {
      currentCluster = { key: clusterKey, tabs: [tab] };
      clusters.push(currentCluster);
    }
  }

  dynamicTabs.innerHTML = clusters.map(cluster => {
    const isMulti = cluster.tabs.length > 1;
    const tabsHtml = cluster.tabs.map(tab => {
      const isSub = !!tab.parentProjectName;
      return `
        <button class="tab-item ${isSub ? 'sub-tab' : ''} ${activeTabId === tab.id ? 'active' : ''}" data-tab-id="${tab.id}" title="${tab.path || ''}">
          <span class="tab-icon">${tab.os === 'ubuntu' ? '🐧' : '🪟'}</span>
          ${isSub ? `<span class="tab-sub-arrow">↳</span>` : ''}
          <span class="tab-title">${tab.title}</span>
          <span class="tab-close-btn" data-close-id="${tab.id}" title="Close Tab">&times;</span>
        </button>
      `;
    }).join('');

    if (isMulti) {
      return `<div class="tab-cluster">${tabsHtml}</div>`;
    }
    return tabsHtml;
  }).join('');

  tabHome.className = `tab-item ${activeTabId === 'home' ? 'active' : ''}`;

  // Attach tab click events
  dynamicTabs.querySelectorAll('.tab-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close-btn')) return;
      const tabId = el.getAttribute('data-tab-id');
      const tab = openTabs.find(t => t.id === tabId);
      if (tab) switchToProjectTab(tab);
    });
  });

  // Attach tab close events
  dynamicTabs.querySelectorAll('.tab-close-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const closeId = el.getAttribute('data-close-id');
      closeProjectTab(closeId);
    });
  });
}

async function openProjectInNewTab(node) {
  if (!node || !node.path) return;

  // Determine if this is a subfolder inside a root project
  const rootInfo = findRootProjectInfo(node);
  const isSubfolder = rootInfo && rootInfo.path !== node.path;
  const parentProjectName = isSubfolder ? rootInfo.name : null;

  const tabId = 'tab-' + node.path;
  let tab = openTabs.find(t => t.id === tabId);

  if (!tab) {
    tab = {
      id: tabId,
      title: node.name,
      parentProjectName,
      path: node.path,
      os: node.os || detectOsFromPath(node.path),
      type: 'project'
    };

    if (isSubfolder) {
      // Smart Sibling Insertion: find the last index of a tab belonging to this project cluster
      let insertIndex = -1;
      for (let i = 0; i < openTabs.length; i++) {
        const t = openTabs[i];
        const isParent = (rootInfo && t.path === rootInfo.path) || (parentProjectName && t.title === parentProjectName && !t.parentProjectName);
        const isSibling = (parentProjectName && t.parentProjectName === parentProjectName) ||
                          (rootInfo && (t.path.startsWith(rootInfo.path + '\\') || t.path.startsWith(rootInfo.path + '/')));
        if (isParent || isSibling) {
          insertIndex = i;
        }
      }

      if (insertIndex !== -1) {
        // Insert immediately after the last sibling/parent in the cluster
        openTabs.splice(insertIndex + 1, 0, tab);
      } else {
        openTabs.push(tab);
      }
    } else {
      // Standalone root project tab: append to end
      openTabs.push(tab);
    }

    saveTabs();
    renderTabsUI();
  }

  await switchToProjectTab(tab);
}

function closeProjectTab(tabId) {
  const idx = openTabs.findIndex(t => t.id === tabId);
  if (idx !== -1) {
    openTabs.splice(idx, 1);
    saveTabs();
    renderTabsUI();

    if (activeTabId === tabId) {
      if (openTabs.length > 0) {
        switchToProjectTab(openTabs[Math.max(0, idx - 1)]);
      } else {
        switchToHomeView();
      }
    }
  }
}

tabHome.addEventListener('click', switchToHomeView);

function switchToHomeView() {
  activeTabId = 'home';
  focusedBreadcrumbNode = null;
  renderTabsUI();

  // Show main view bar, hide project bar
  mainViewBar.classList.remove('hidden');
  projectActionBar.classList.add('hidden');
  homeLegend.classList.remove('hidden');

  // Activate Global Home Tree
  activeTreeRoot = homeRootNode;
  recalculateLayout();

  // Recenter Camera for Home Overview
  camera.targetX = window.innerWidth / 2;
  camera.targetY = window.innerHeight / 2;
  camera.targetZoom = 1;

  // Scope Dev Console to 'all' in home view
  selectedConsoleFilter = 'all';
  renderConsoleProjectTabs();
  renderFilteredLogs();
  updateConsoleControls();
}

async function switchToProjectTab(tab) {
  activeTabId = tab.id;
  renderTabsUI();

  // Hide main view bar, show project docked bar
  mainViewBar.classList.add('hidden');
  projectActionBar.classList.remove('hidden');
  setToolsMinimized(false);
  homeLegend.classList.add('hidden');

  const tabOs = tab.os || detectOsFromPath(tab.path, 'windows');
  projOsBadge.textContent = tabOs.toUpperCase();
  projOsBadge.className = `os-badge ${tabOs}`;

  btnExpandCollapseText.textContent = 'Expand All';

  // Scope Dev Console to this project
  selectedConsoleFilter = normalizePathKey(tab.path);
  renderConsoleProjectTabs();
  renderFilteredLogs();
  updateConsoleControls();

  // Load runnable scripts for this project
  loadProjectScripts(tab.path);

  // TRUE TREE ISOLATION:
  // Build a single isolated root node. No other files/OS directories exist on canvas!
  let projRoot = projectTreeCache.get(tab.path);

  if (!projRoot) {
    projRoot = {
      id: 'isolated-' + tab.path,
      name: tab.title,
      path: tab.path,
      type: 'project',
      isProject: true,
      os: tabOs,
      side: 1, // Flow cleanly to the right
      expanded: true,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      opacity: 1,
      width: 170,
      height: 48,
      children: [],
      hasChildren: true
    };
    projectTreeCache.set(tab.path, projRoot);
  }

  activeTreeRoot = projRoot;

  // If children haven't been loaded yet, load them
  if (!projRoot.children || projRoot.children.length === 0) {
    await expandDirectory(projRoot, false);
  }

  recalculateLayout();

  focusedBreadcrumbNode = projRoot;
  updateBreadcrumb(projRoot);

  // Position camera nicely to the left so the project tree flows gracefully
  camera.targetX = window.innerWidth / 3;
  camera.targetY = window.innerHeight / 2;
  camera.targetZoom = 1.05;
}

function formatScriptOptionLabel(s, rootPath) {
  let folderTag = 'root';
  if (s.cwd && rootPath) {
    const normCwd = s.cwd.replace(/\\/g, '/').replace(/\/+$/, '');
    const normRoot = rootPath.replace(/\\/g, '/').replace(/\/+$/, '');
    if (normCwd.startsWith(normRoot)) {
      folderTag = normCwd.slice(normRoot.length).replace(/^\/+/, '') || 'root';
    } else {
      folderTag = normCwd.split('/').pop() || 'root';
    }
  } else if (s.name && s.name.includes(':')) {
    folderTag = s.name.split(':')[0].trim();
  }
  return `📁 ${folderTag} ➔ ${s.command}`;
}

// Main View Custom Command Modal Controller
let currentAppCustomProjPath = '';
let currentAppCustomProjDetails = null;

const customCmdModal = document.getElementById('customCmdModal');
const btnCloseCustomCmd = document.getElementById('btnCloseCustomCmd');
const btnCancelCustomCmd = document.getElementById('btnCancelCustomCmd');
const btnSaveCustomCmd = document.getElementById('btnSaveCustomCmd');
const customCmdFolder = document.getElementById('customCmdFolder');
const customCmdCustomFolder = document.getElementById('customCmdCustomFolder');
const customCmdInput = document.getElementById('customCmdInput');
const customCmdPreviewFolder = document.getElementById('customCmdPreviewFolder');
const customCmdPreviewExec = document.getElementById('customCmdPreviewExec');

function openAppCustomCmdModal(projectPath, details) {
  if (!customCmdModal) return;
  currentAppCustomProjPath = projectPath;
  currentAppCustomProjDetails = details || {};

  customCmdFolder.innerHTML = '';
  const rootOpt = document.createElement('option');
  rootOpt.value = '';
  rootOpt.textContent = '📁 / (Project Root)';
  customCmdFolder.appendChild(rootOpt);

  const subfolderSet = new Set();
  if (details.subfolders) {
    details.subfolders.forEach(s => subfolderSet.add(s));
  }
  if (details.scripts) {
    details.scripts.forEach(s => {
      if (s.cwd) {
        const normCwd = s.cwd.replace(/\\/g, '/').replace(/\/+$/, '');
        const normProj = (projectPath || '').replace(/\\/g, '/').replace(/\/+$/, '');
        if (normCwd.startsWith(normProj)) {
          const rel = normCwd.slice(normProj.length).replace(/^\/+/, '');
          if (rel) subfolderSet.add(rel);
        }
      }
    });
  }

  subfolderSet.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = `📁 ${sub}`;
    customCmdFolder.appendChild(opt);
  });

  const otherOpt = document.createElement('option');
  otherOpt.value = '__other__';
  otherOpt.textContent = '✏️ Custom relative path...';
  customCmdFolder.appendChild(otherOpt);

  customCmdCustomFolder.classList.add('hidden');
  customCmdCustomFolder.value = '';
  customCmdInput.value = '';

  updateAppCustomCmdPreview();
  customCmdModal.classList.remove('hidden');
  setTimeout(() => { customCmdInput.focus(); }, 60);
}

function closeAppCustomCmdModal() {
  if (customCmdModal) {
    customCmdModal.classList.add('hidden');
  }
  if (scriptSelect.value === '__custom__') {
    scriptSelect.selectedIndex = 0;
  }
}

function getAppSelectedWorkingDir() {
  if (customCmdFolder && customCmdFolder.value === '__other__') {
    return (customCmdCustomFolder.value || '').trim();
  }
  return customCmdFolder ? (customCmdFolder.value || '') : '';
}

function updateAppCustomCmdPreview() {
  const relFolder = getAppSelectedWorkingDir();
  const cmd = customCmdInput ? (customCmdInput.value || '').trim() : '';
  if (customCmdPreviewFolder) {
    customCmdPreviewFolder.textContent = relFolder ? `/${relFolder}` : '/ (root)';
  }
  if (customCmdPreviewExec) {
    customCmdPreviewExec.textContent = cmd || '—';
  }
}

if (customCmdFolder) {
  customCmdFolder.addEventListener('change', () => {
    if (customCmdFolder.value === '__other__') {
      customCmdCustomFolder.classList.remove('hidden');
      customCmdCustomFolder.focus();
    } else {
      customCmdCustomFolder.classList.add('hidden');
    }
    updateAppCustomCmdPreview();
  });
}

if (customCmdCustomFolder) {
  customCmdCustomFolder.addEventListener('input', updateAppCustomCmdPreview);
}

if (customCmdInput) {
  customCmdInput.addEventListener('input', updateAppCustomCmdPreview);
}

if (btnCloseCustomCmd) btnCloseCustomCmd.addEventListener('click', closeAppCustomCmdModal);
if (btnCancelCustomCmd) btnCancelCustomCmd.addEventListener('click', closeAppCustomCmdModal);

if (btnSaveCustomCmd) {
  btnSaveCustomCmd.addEventListener('click', () => {
    const cmd = (customCmdInput.value || '').trim();
    if (!cmd) {
      alert('Please enter a command to execute.');
      customCmdInput.focus();
      return;
    }
    const relFolder = getAppSelectedWorkingDir();
    const fullCwd = relFolder ? (currentAppCustomProjPath.replace(/[\\\/]+$/, '') + '/' + relFolder.replace(/\\/g, '/')) : '';
    const folderLabel = relFolder || 'root';

    const projKey = normalizePathKey(currentAppCustomProjPath);
    const opt = document.createElement('option');
    opt.value = cmd;
    opt.setAttribute('data-cwd', fullCwd);
    opt.textContent = `📁 ${folderLabel} ➔ ${cmd} (Custom)`;
    opt.selected = true;

    scriptSelect.insertBefore(opt, scriptSelect.firstChild);
    scriptSelect.value = cmd;

    localStorage.setItem('workspace_cmd_' + projKey, cmd);
    if (fullCwd) {
      localStorage.setItem('workspace_cwd_' + projKey, fullCwd);
    }

    if (btnStartServerText) {
      btnStartServerText.textContent = `Run: ${cmd}`;
    }

    if (customCmdModal) customCmdModal.classList.add('hidden');
  });
}

// Load scripts for Start Server button
async function loadProjectScripts(projectPath) {
  scriptSelect.innerHTML = '';
  scriptSelect.classList.add('hidden');
  btnStartServerText.textContent = 'Start Server';

  // Update Path Chips, Git Status Badge, and Port Badge
  updateProjectBarEnhancements(projectPath);

  try {
    const res = await fetch(`/api/project-details?path=${encodeURIComponent(projectPath)}`);
    const data = await res.json();
    
    if (data.success && data.details && data.details.scripts && data.details.scripts.length > 0) {
      const scripts = data.details.scripts;
      const subfolders = data.details.subfolders || [];

      const projKey = normalizePathKey(projectPath);
      const savedCmd = localStorage.getItem('workspace_cmd_' + projKey);
      const savedCwd = localStorage.getItem('workspace_cwd_' + projKey);

      let hasSelected = false;
      const isLaravel = data.details.defaultScript && data.details.defaultScript.includes('artisan');
      const isStaleNpm = isLaravel && savedCmd && !savedCmd.includes('artisan');

      const scriptOptions = scripts.map(s => {
        let isSel = false;
        if (!isStaleNpm && savedCmd && s.command === savedCmd) {
          isSel = true;
          hasSelected = true;
        } else if ((!savedCmd || isStaleNpm) && !hasSelected && s.command === data.details.defaultScript) {
          isSel = true;
          hasSelected = true;
        }
        const label = formatScriptOptionLabel(s, projectPath);
        return `<option value="${s.command}" data-cwd="${s.cwd || ''}" ${isSel ? 'selected' : ''}>${label}</option>`;
      }).join('');

      let customSavedOpt = '';
      if (savedCmd && !hasSelected && !isStaleNpm) {
        const fName = savedCwd ? savedCwd.replace(/\\/g, '/').split('/').pop() : 'root';
        customSavedOpt = `<option value="${savedCmd}" data-cwd="${savedCwd || ''}" selected>📁 ${fName} ➔ ${savedCmd} (Custom)</option>`;
      }

      scriptSelect.innerHTML = customSavedOpt + scriptOptions + `<option value="__custom__">⚙️ Custom command...</option>`;
      scriptSelect.classList.remove('hidden');

      const isRunning = allRunningServers.some(s => s.id === projKey);
      if (isRunning) {
        btnStartServerText.textContent = 'Server Running';
      } else {
        const chosen = scriptSelect.value;
        const selected = scripts.find(s => s.command === chosen);
        btnStartServerText.textContent = selected ? `Run: ${selected.command}` : (chosen ? `Run: ${chosen}` : 'Run Server');
      }

      scriptSelect.onchange = () => {
        if (scriptSelect.value === '__custom__') {
          openAppCustomCmdModal(projectPath, data.details);
          return;
        }

        localStorage.setItem('workspace_cmd_' + projKey, scriptSelect.value);
        const sel = scriptSelect.options[scriptSelect.selectedIndex];
        const cwd = sel ? sel.getAttribute('data-cwd') : '';
        if (cwd) {
          localStorage.setItem('workspace_cwd_' + projKey, cwd);
        }

        const isRunning = allRunningServers.some(s => s.id === projKey);
        if (!isRunning) {
          const selected = scripts.find(s => s.command === scriptSelect.value);
          btnStartServerText.textContent = selected ? `Run: ${selected.command}` : 'Run Server';
        }
      };
    } else {
      // Fallback: allow custom command even if no predefined scripts found
      scriptSelect.innerHTML = `<option value="__custom__">⚙️ Custom command...</option>`;
      scriptSelect.classList.remove('hidden');
      btnStartServerText.textContent = 'Run Command';
      scriptSelect.onchange = () => {
        if (scriptSelect.value === '__custom__') {
          openAppCustomCmdModal(projectPath, data.details || {});
        }
      };
    }
  } catch {}
}

// ==========================================
// 3B. SCOPED BREADCRUMB NAVIGATION
// ==========================================

function updateBreadcrumb(targetNode) {
  if (!projBreadcrumbNav || activeTabId === 'home') return;
  const currentTab = openTabs.find(t => t.id === activeTabId);
  const rootNode = activeTreeRoot;
  if (!rootNode) return;

  const node = targetNode || focusedBreadcrumbNode || rootNode;
  focusedBreadcrumbNode = node;

  // Build ancestral chain from rootNode down to node
  const chain = [];
  let curr = node;
  while (curr) {
    chain.unshift(curr);
    if (curr === rootNode) break;
    curr = curr.parent;
  }

  // Safety fallback: if current node is not rooted in activeTreeRoot
  if (chain.length === 0 || chain[0] !== rootNode) {
    chain.length = 0;
    chain.push(rootNode);
    focusedBreadcrumbNode = rootNode;
  }

  projBreadcrumbNav.innerHTML = chain.map((n, idx) => {
    const isLast = idx === chain.length - 1;
    const name = n.name || (currentTab ? currentTab.title : 'Project');
    const isRoot = idx === 0;
    const sep = isLast ? '' : '<span class="crumb-sep">›</span>';
    return `
      <button class="crumb-btn ${isLast ? 'active' : ''}" data-crumb-id="${n.id}" title="${n.path || ''}">
        ${isRoot ? (n.os === 'ubuntu' ? '🐧 ' : '🪟 ') : '📁 '}${name}
      </button>
      ${sep}
    `;
  }).join('');

  // Attach click handler to each breadcrumb button to jump/recenter to that level
  projBreadcrumbNav.querySelectorAll('.crumb-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const crumbId = btn.getAttribute('data-crumb-id');
      const crumbNode = activeNodesMap.get(crumbId) || (rootNode.id === crumbId ? rootNode : null);
      if (crumbNode) {
        focusBreadcrumbNode(crumbNode);
      }
    });
  });

  // Ensure active crumb is scrolled into view smoothly
  const activeCrumb = projBreadcrumbNav.querySelector('.crumb-btn.active');
  if (activeCrumb) {
    activeCrumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  // Dynamically load scripts if this sub-package has a package.json
  if (node.path) {
    loadProjectScripts(node.path);
  }
}

async function focusBreadcrumbNode(targetNode) {
  if (!targetNode) return;
  focusedBreadcrumbNode = targetNode;
  selectNode(targetNode);

  if (targetNode.hasChildren && !targetNode.expanded) {
    await expandDirectory(targetNode, true);
  }

  updateBreadcrumb(targetNode);

  // Smoothly center camera on the focused breadcrumb node
  camera.targetX = window.innerWidth / 2 - targetNode.currentX * camera.targetZoom;
  camera.targetY = window.innerHeight / 2 - targetNode.currentY * camera.targetZoom;
  targetNode.pulse = 1.15;
}

// ==========================================
// 4. TREE LAYOUT ALGORITHM
// ==========================================

function syncActiveNodes() {
  if (!activeTreeRoot) return;
  activeNodesMap.clear();
  function visit(node) {
    if (!node) return;
    activeNodesMap.set(node.id, node);
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }
  visit(activeTreeRoot);
}

function collapseDescendants(node) {
  if (!node || !node.children || node.children.length === 0) return;
  const ejectPoint = getParentEjectPoint(node);
  const total = node.children.length;
  node.children.forEach((child, idx) => {
    child.expanded = false;
    child.targetX = ejectPoint.x;
    child.targetY = ejectPoint.y;
    // Outer/further children get absorbed in a smooth cascading suction wave
    child.absorbDelay = Math.min((total - 1 - idx) * 3, 24);
    collapseDescendants(child);
  });
}

function recalculateLayout() {
  if (!activeTreeRoot) return;

  activeTreeRoot.targetX = 0;
  activeTreeRoot.targetY = 0;

  if (activeTabId === 'home') {
    // Dual trunk: Left for Ubuntu, Right for Windows
    const leftNodes = activeTreeRoot.children.filter(c => c.side === -1);
    layoutSubtreeBranch(leftNodes, -1, -290);

    const rightNodes = activeTreeRoot.children.filter(c => c.side === 1);
    layoutSubtreeBranch(rightNodes, 1, 290);
  } else {
    // Isolated project tree: Flows cleanly rightward
    layoutSubtreeBranch(activeTreeRoot.children, 1, 260);
  }

  // Synchronize all loaded nodes into activeNodesMap
  syncActiveNodes();
}

function isNodeVisible(node) {
  if (!node) return false;
  if (node === activeTreeRoot) return true;
  let curr = node.parent;
  while (curr) {
    if (!curr.expanded) return false;
    if (curr === activeTreeRoot) return true;
    curr = curr.parent;
  }
  return false;
}

function layoutSubtreeBranch(nodes, direction, startX) {
  const horizontalStep = 220 * direction;
  const verticalSpacing = 52;

  function countLeafSpan(node) {
    if (!node.expanded || !node.children || node.children.length === 0) return 1;
    let count = 0;
    for (const child of node.children) {
      count += countLeafSpan(child);
    }
    return Math.max(1, count);
  }

  function layoutSubtree(node, currentX, topY, height) {
    node.targetX = currentX;
    node.targetY = topY + height / 2;

    if (!node.expanded || !node.children || node.children.length === 0) {
      collapseDescendants(node);
      return;
    }

    let childTopY = topY;
    for (const child of node.children) {
      const childSpan = countLeafSpan(child);
      const childHeight = childSpan * verticalSpacing;
      layoutSubtree(child, currentX + horizontalStep, childTopY, childHeight);
      childTopY += childHeight;
    }
  }

  const totalBranchSpan = nodes.reduce((acc, n) => acc + countLeafSpan(n), 0);
  let currentTopY = -((totalBranchSpan * verticalSpacing) / 2);

  for (const node of nodes) {
    const span = countLeafSpan(node);
    const height = span * verticalSpacing;
    layoutSubtree(node, startX, currentTopY, height);
    currentTopY += height;
  }
}

// ==========================================
// 5. 60-120 FPS HIGH-DPI CANVAS RENDER LOOP
// ==========================================

function drawGrid(step = 32) {
  if (currentSettings.gridStyle === 'blank') return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const startX = ((camera.x % (step * camera.zoom)) + (step * camera.zoom)) % (step * camera.zoom);
  const startY = ((camera.y % (step * camera.zoom)) + (step * camera.zoom)) % (step * camera.zoom);

  if (currentSettings.gridStyle === 'lines') {
    ctx.save();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < width; x += step * camera.zoom) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += step * camera.zoom) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.fillStyle = '#f1f5f9';
  const dotSize = Math.max(1.2, 1.8 * camera.zoom);

  for (let x = startX; x < width; x += step * camera.zoom) {
    for (let y = startY; y < height; y += step * camera.zoom) {
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBezierBranch(p1, p2, os, isHovered, branchOpacity = 1) {
  if (branchOpacity <= 0.03) return;
  ctx.save();
  ctx.globalAlpha = branchOpacity;
  ctx.beginPath();
  
  const dx = (p2.x - p1.x) * 0.55;
  ctx.moveTo(p1.x, p1.y);
  ctx.bezierCurveTo(
    p1.x + dx, p1.y,
    p2.x - dx, p2.y,
    p2.x, p2.y
  );

  const isUbuntu = os === 'ubuntu';
  ctx.strokeStyle = isHovered ? (isUbuntu ? '#e95420' : '#0284c7') : (isUbuntu ? 'rgba(233, 84, 32, 0.45)' : 'rgba(2, 132, 199, 0.45)');
  ctx.lineWidth = isHovered ? 2.5 : 1.75;

  ctx.stroke();
  ctx.restore();
}

function drawNode(node) {
  const isHovered = hoveredNode === node;
  const isSelected = selectedNode === node;
  const isUbuntu = node.os === 'ubuntu';
  const isWin = node.os === 'windows';
  const isRoot = node.type === 'root' || node === activeTreeRoot;

  const w = node.width;
  const h = node.height;
  const totalScale = (node.scale || 1) * (node.pulse || 1);
  if (totalScale < 0.1 || node.opacity < 0.02) return;

  ctx.save();
  ctx.translate(node.currentX, node.currentY);
  ctx.scale(totalScale, totalScale);
  ctx.globalAlpha = Math.min(1, Math.max(0, node.opacity));

  const x = -w / 2;
  const y = -h / 2;

  // Drop Shadow
  if (isSelected || isHovered) {
    ctx.shadowColor = isUbuntu ? 'rgba(233, 84, 32, 0.25)' : (isWin ? 'rgba(2, 132, 199, 0.25)' : 'rgba(15, 23, 42, 0.15)');
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
  } else {
    ctx.shadowColor = 'rgba(15, 23, 42, 0.04)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  }

  // Card Background
  ctx.beginPath();
  const radius = isRoot ? 20 : 12;
  ctx.roundRect(x, y, w, h, radius);

  if (isRoot) {
    ctx.fillStyle = '#0f172a';
  } else if (node.type === 'os-root') {
    ctx.fillStyle = isUbuntu ? '#fff7ed' : '#f0f9ff';
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fill();

  // Card Border
  ctx.lineWidth = isSelected ? 2 : (isHovered ? 1.5 : 1);
  if (isSelected) {
    ctx.strokeStyle = isUbuntu ? '#e95420' : (isWin ? '#0284c7' : '#0f172a');
  } else if (isHovered) {
    ctx.strokeStyle = isUbuntu ? '#fb923c' : (isWin ? '#38bdf8' : '#64748b');
  } else {
    ctx.strokeStyle = isRoot ? '#0f172a' : (node.type === 'os-root' ? (isUbuntu ? '#fdba74' : '#bae6fd') : '#e2e8f0');
  }
  ctx.stroke();

  ctx.shadowColor = 'transparent';

  // Icon Indicator
  let iconText = '📁';
  if (isRoot) iconText = activeTabId === 'home' ? '🌐' : '⚡';
  else if (node.type === 'os-root') iconText = isUbuntu ? '🐧' : '🪟';
  else if (node.isProject) iconText = node.expanded ? '📂' : '⚡';
  else if (node.type === 'file') iconText = '📄';
  else iconText = node.expanded ? '📂' : '📁';

  // Live Server Running Pulse
  const nodeKey = normalizePathKey(node.path);
  const isRunning = allRunningServers.some(s => s.id === nodeKey);
  if (isRunning) {
    const pulsePhase = (Date.now() % 2000) / 2000;
    const pulseRadius = 10 + pulsePhase * 10;
    const pulseAlpha = Math.max(0, 1 - pulsePhase);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 19, y + h / 2, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(34, 197, 94, ${pulseAlpha * 0.8})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + 19, y + h / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
    ctx.restore();
  }

  ctx.font = '14px sans-serif';
  ctx.fillStyle = isRoot ? '#ffffff' : '#0f172a';
  ctx.fillText(iconText, x + 12, y + h / 2 + 5);

  // Title
  ctx.font = isRoot || node.type === 'os-root' ? '600 13px "Plus Jakarta Sans"' : '500 12px "Plus Jakarta Sans"';
  ctx.fillStyle = isRoot ? '#ffffff' : '#0f172a';

  let title = node.name;
  if (title.length > 15) title = title.substring(0, 13) + '…';
  ctx.fillText(title, x + 34, y + (node.isProject ? h / 2 - 2 : h / 2 + 4));

  // Project Tag
  if (node.isProject && node.projectType && !isRoot) {
    ctx.font = '500 9px "JetBrains Mono"';
    ctx.fillStyle = isUbuntu ? '#c2410c' : '#0369a1';
    ctx.fillText(node.projectType, x + 34, y + h / 2 + 11);

    // Git Status dot on Node Card
    if (node.gitStatus && node.gitStatus.isGit) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + w - 28, y + h / 2 + 7, 3, 0, Math.PI * 2);
      ctx.fillStyle = node.gitStatus.isClean ? '#22c55e' : '#f59e0b';
      ctx.fill();
      ctx.restore();
    }
  }

  // Expansion indicator: Animated rotating chevron badge
  if (node.hasChildren && !isRoot) {
    const badgeX = x + w - 14;
    const badgeY = y + h / 2;

    if (node.loading) {
      node.spinAngle = (node.spinAngle || 0) + 0.18;
      ctx.save();
      ctx.translate(badgeX, badgeY);
      ctx.rotate(node.spinAngle);
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 1.5);
      ctx.strokeStyle = isUbuntu ? '#e95420' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(badgeX, badgeY);
      ctx.rotate(node.badgeAngle || 0);

      // Pill container
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = node.expanded ? (isUbuntu ? '#fff1ec' : '#f0f9ff') : '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = node.expanded ? (isUbuntu ? '#fdba74' : '#bae6fd') : '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Mini chevron
      ctx.beginPath();
      ctx.moveTo(-2, -3);
      ctx.lineTo(2, 0);
      ctx.lineTo(-2, 3);
      ctx.strokeStyle = node.expanded ? (isUbuntu ? '#e95420' : '#0284c7') : '#64748b';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}

function render() {
  // Smooth Camera Interpolation
  camera.x += (camera.targetX - camera.x) * 0.14;
  camera.y += (camera.targetY - camera.y) * 0.14;
  camera.zoom += (camera.targetZoom - camera.zoom) * 0.14;

  zoomLabel.textContent = `${Math.round(camera.zoom * 100)}%`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle Dot Grid
  drawGrid();

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Smooth Node Interpolation with Spring Scale and Emerge/Absorb physics
  for (const node of activeNodesMap.values()) {
    const visible = isNodeVisible(node);
    const targetAlpha = visible ? 1 : 0;
    const targetScale = visible ? 1 : 0.05;
    const targetAngle = node.expanded ? (Math.PI / 2) : ((node.side === -1) ? Math.PI : 0);

    // If waiting for stagger emerge delay, hold at folder mouth until delay ticks down
    if (visible && node.emergeDelay && node.emergeDelay > 0) {
      node.emergeDelay -= 1;
      node.opacity = 0;
      node.scale = 0.05;
    } else if (!visible && node.absorbDelay && node.absorbDelay > 0) {
      // Inward absorption wave delay
      node.absorbDelay -= 1;
      node.currentX += (node.targetX - node.currentX) * 0.04;
      node.currentY += (node.targetY - node.currentY) * 0.04;
      node.scale = (node.scale !== undefined ? node.scale : 0.05) + (targetScale - (node.scale !== undefined ? node.scale : 0.05)) * 0.04;
      node.opacity += (targetAlpha - node.opacity) * 0.04;
    } else {
      // Cinematic, visible travel speed (smooth ~400ms glide)
      node.currentX += (node.targetX - node.currentX) * 0.078;
      node.currentY += (node.targetY - node.currentY) * 0.078;
      node.opacity += (targetAlpha - node.opacity) * 0.095;
      node.scale = (node.scale !== undefined ? node.scale : 0.05) + (targetScale - (node.scale !== undefined ? node.scale : 0.05)) * 0.085;
    }

    node.pulse = (node.pulse || 1) + (1 - (node.pulse || 1)) * 0.09;
    node.badgeAngle = (node.badgeAngle !== undefined ? node.badgeAngle : targetAngle) + (targetAngle - (node.badgeAngle !== undefined ? node.badgeAngle : targetAngle)) * 0.12;
  }

  // Draw connecting Bezier curves
  function drawNodeConnections(node) {
    if (!node || !node.expanded || !node.children) return;
    for (const child of node.children) {
      if (child.opacity <= 0.04 || child.scale <= 0.1) continue;
      const branchAlpha = Math.min(node.opacity, child.opacity);
      if (branchAlpha <= 0.04) continue;
      const isBranchHovered = hoveredNode === child || hoveredNode === node;
      drawBezierBranch(
        { x: node.currentX, y: node.currentY },
        { x: child.currentX, y: child.currentY },
        child.os || node.os,
        isBranchHovered,
        branchAlpha
      );
      drawNodeConnections(child);
    }
  }

  if (activeTreeRoot) {
    drawNodeConnections(activeTreeRoot);
  }

  // Draw nodes on top
  for (const node of activeNodesMap.values()) {
    if (node.opacity > 0.03 && (node.scale || 0) > 0.08) {
      drawNode(node);
    }
  }

  // Draw emergence / absorption ripples
  updateAndDrawRipples();

  ctx.restore();

  // Smooth Custom Trailing Cursor Animation
  if (currentSettings.cursorStyle !== 'system') {
    cursorRingPos.x += (mousePos.x - cursorRingPos.x) * 0.22;
    cursorRingPos.y += (mousePos.y - cursorRingPos.y) * 0.22;
    customCursorDot.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px, 0) translate(-50%, -50%)`;
    customCursorRing.style.transform = `translate3d(${cursorRingPos.x}px, ${cursorRingPos.y}px, 0) translate(-50%, -50%)`;
  }

  requestAnimationFrame(render);
}

// ==========================================
// 6. MOUSE & GESTURE INTERACTIONS
// ==========================================

function screenToWorld(sx, sy) {
  return {
    x: (sx - camera.x) / camera.zoom,
    y: (sy - camera.y) / camera.zoom
  };
}

function getNodeAt(worldX, worldY) {
  for (const node of activeNodesMap.values()) {
    if (!isNodeVisible(node) || node.opacity < 0.25) continue;
    const halfW = node.width / 2;
    const halfH = node.height / 2;
    if (
      worldX >= node.currentX - halfW &&
      worldX <= node.currentX + halfW &&
      worldY >= node.currentY - halfH &&
      worldY <= node.currentY + halfH
    ) {
      return node;
    }
  }
  return null;
}

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const worldPos = screenToWorld(e.clientX, e.clientY);
  const clicked = getNodeAt(worldPos.x, worldPos.y);

  if (clicked) {
    selectNode(clicked);
    if (clicked.type === 'file') {
      openFileViewer(clicked.path, clicked.name, clicked.ext);
    } else {
      expandDirectory(clicked);
      if (activeTabId !== 'home') {
        updateBreadcrumb(clicked);
      }
    }
  } else {
    isDragging = true;
    dragStart = { x: e.clientX - camera.targetX, y: e.clientY - camera.targetY };
  }
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    camera.targetX = e.clientX - dragStart.x;
    camera.targetY = e.clientY - dragStart.y;
  } else {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const hit = getNodeAt(worldPos.x, worldPos.y);
    if (hit !== hoveredNode) {
      hoveredNode = hit;
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    }
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// Smooth Zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  const newZoom = Math.min(Math.max(camera.targetZoom * zoomFactor, 0.2), 3.0);

  const mouseWorldBefore = screenToWorld(e.clientX, e.clientY);
  camera.targetZoom = newZoom;
  camera.targetX = e.clientX - mouseWorldBefore.x * newZoom;
  camera.targetY = e.clientY - mouseWorldBefore.y * newZoom;
}, { passive: false });

// Double click: Open dedicated tab for any folder or project
canvas.addEventListener('dblclick', (e) => {
  const worldPos = screenToWorld(e.clientX, e.clientY);
  const clicked = getNodeAt(worldPos.x, worldPos.y);
  if (clicked && clicked.type !== 'root' && clicked.type !== 'os-root') {
    if (clicked.isProject || clicked.hasChildren) {
      openProjectInNewTab(clicked);
    } else {
      focusBreadcrumbNode(clicked);
    }
  } else {
    recenterView();
  }
});

function recenterView() {
  if (activeTabId === 'home') {
    camera.targetX = window.innerWidth / 2;
    camera.targetY = window.innerHeight / 2;
    camera.targetZoom = 1;
  } else {
    camera.targetX = window.innerWidth / 3;
    camera.targetY = window.innerHeight / 2;
    camera.targetZoom = 1.05;
  }
}

// ==========================================
// 7. DEVELOPER ACTION BAR RUNNERS & CONTROLS
// ==========================================

// Copy Project / Focused Breadcrumb Path to Clipboard
if (btnCopyPath) {
  btnCopyPath.addEventListener('click', async () => {
    const targetPath = getActiveActionPath();
    if (!targetPath) return;
    try {
      await navigator.clipboard.writeText(targetPath);
      btnCopyPath.classList.add('copied');
      if (btnCopyPathText) btnCopyPathText.textContent = 'Copied! ✓';
      setTimeout(() => {
        btnCopyPath.classList.remove('copied');
        if (btnCopyPathText) btnCopyPathText.textContent = 'Copy Path';
      }, 1800);
    } catch (err) {
      if (btnCopyPathText) btnCopyPathText.textContent = 'Error copying';
    }
  });
}

// Helper to get target path for actions (focused breadcrumb node, selected node, or active tab path)
function getActiveActionPath() {
  if (focusedBreadcrumbNode && focusedBreadcrumbNode.path) return focusedBreadcrumbNode.path;
  if (selectedNode && selectedNode.path) return selectedNode.path;
  const currentTab = openTabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.path) return currentTab.path;
  if (activeTreeRoot && activeTreeRoot.path) return activeTreeRoot.path;
  return null;
}

// ==========================================
// IN-APP FILE & CODE VIEWER LOGIC
// ==========================================

async function openFileViewer(filePath, fileName, fileExt) {
  if (!filePath || !fileViewerDrawer) return;

  fileViewerDrawer.classList.remove('hidden');
  fvTitle.textContent = fileName || filePath.split(/[\\\/]/).pop();
  fvPath.textContent = filePath;
  fvSize.textContent = 'Loading...';
  fvLines.textContent = '';
  fvCodeText.textContent = 'Loading file content...';
  fvCodeContainer.classList.remove('hidden');
  fvImageContainer.classList.add('hidden');
  fvBinaryNotice.classList.add('hidden');

  const ext = (fileExt || (filePath.includes('.') ? '.' + filePath.split('.').pop() : '')).toLowerCase();
  const fileIcons = {
    '.js': '🟨', '.jsx': '⚛️', '.ts': '🟦', '.tsx': '⚛️',
    '.json': '📋', '.html': '🌐', '.css': '🎨', '.scss': '🎨',
    '.py': '🐍', '.rs': '🦀', '.go': '🐹', '.java': '☕',
    '.md': '📝', '.txt': '📄', '.env': '🔒', '.yml': '⚙️', '.yaml': '⚙️',
    '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.svg': '🎨', '.ico': '🖼️', '.webp': '🖼️'
  };
  fvIcon.textContent = fileIcons[ext] || '📄';

  try {
    const res = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
    const data = await res.json();
    if (!data.success) {
      fvCodeText.textContent = `Error loading file: ${data.error || 'Access denied'}`;
      fvSize.textContent = 'Error';
      return;
    }

    const sizeKB = (data.size / 1024).toFixed(1);
    fvSize.textContent = data.size < 1024 ? `${data.size} B` : `${sizeKB} KB`;

    if (data.isImage && data.dataUrl) {
      fvCodeContainer.classList.add('hidden');
      fvBinaryNotice.classList.add('hidden');
      fvImageContainer.classList.remove('hidden');
      fvImagePreview.src = data.dataUrl;
      fvLines.textContent = 'Image';
      return;
    }

    if (data.isBinary) {
      fvCodeContainer.classList.add('hidden');
      fvImageContainer.classList.add('hidden');
      fvBinaryNotice.classList.remove('hidden');
      fvBinaryMessage.textContent = data.message || 'Binary file cannot be displayed.';
      fvLines.textContent = 'Binary';
      return;
    }

    fvImageContainer.classList.add('hidden');
    fvBinaryNotice.classList.add('hidden');
    fvCodeContainer.classList.remove('hidden');
    fvLines.textContent = `${data.lines || 1} lines`;
    fvCodeText.textContent = data.content || '(Empty file)';
  } catch (err) {
    fvCodeText.textContent = `Failed to load file: ${err.message}`;
    fvSize.textContent = 'Error';
  }
}

if (fvCloseBtn) {
  fvCloseBtn.addEventListener('click', () => {
    fileViewerDrawer.classList.add('hidden');
  });
}

if (fvCopyBtn) {
  fvCopyBtn.addEventListener('click', async () => {
    if (!fvCodeText.textContent) return;
    try {
      await navigator.clipboard.writeText(fvCodeText.textContent);
      fvCopyBtn.classList.add('copied');
      fvCopyBtn.textContent = 'Copied! ✓';
      setTimeout(() => {
        fvCopyBtn.classList.remove('copied');
        fvCopyBtn.textContent = 'Copy';
      }, 1800);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  });
}

// ==========================================
// DRAWER RESIZING & CONTENT WRAP LOGIC
// ==========================================

let isFvResizing = false;
let fvStartX = 0;
let fvStartWidth = 680;

// Restore saved drawer width from localStorage
const savedFvWidth = localStorage.getItem('workspace_fv_width');
if (savedFvWidth && fileViewerDrawer) {
  const w = parseInt(savedFvWidth, 10);
  if (!isNaN(w) && w >= 340 && w <= window.innerWidth - 40) {
    fileViewerDrawer.style.width = `${w}px`;
  }
}

// Restore word wrap preference
let isWordWrap = localStorage.getItem('workspace_fv_wrap') === 'true';
function updateWrapUI() {
  if (fvCodeContainer) {
    fvCodeContainer.classList.toggle('word-wrap', isWordWrap);
  }
  if (fvWrapBtn) {
    fvWrapBtn.textContent = isWordWrap ? 'Wrap: On' : 'Wrap: Off';
    fvWrapBtn.classList.toggle('active', isWordWrap);
  }
}
updateWrapUI();

if (fvWrapBtn) {
  fvWrapBtn.addEventListener('click', () => {
    isWordWrap = !isWordWrap;
    localStorage.setItem('workspace_fv_wrap', isWordWrap ? 'true' : 'false');
    updateWrapUI();
  });
}

if (fvResizeHandle) {
  fvResizeHandle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isFvResizing = true;
    fvStartX = e.clientX;
    fvStartWidth = fileViewerDrawer.getBoundingClientRect().width;
    fileViewerDrawer.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  // Double-click on handle to toggle width: default (680px) vs expansive (65% screen width)
  fvResizeHandle.addEventListener('dblclick', () => {
    const currW = fileViewerDrawer.getBoundingClientRect().width;
    const defaultW = 680;
    const expansiveW = Math.min(window.innerWidth - 60, Math.round(window.innerWidth * 0.65));
    const targetW = currW > (defaultW + 60) ? defaultW : expansiveW;
    fileViewerDrawer.style.width = `${targetW}px`;
    localStorage.setItem('workspace_fv_width', targetW);
  });
}

// Console Drawer Vertical Resizing
let isConsoleResizing = false;
let consoleStartY = 0;
let consoleStartHeight = 260;

const savedConsoleH = localStorage.getItem('workspace_console_height');
if (savedConsoleH && devConsoleDrawer) {
  const h = parseInt(savedConsoleH, 10);
  if (!isNaN(h) && h >= 140 && h <= window.innerHeight - 80) {
    devConsoleDrawer.style.height = `${h}px`;
  }
}

if (consoleResizeHandle) {
  consoleResizeHandle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isConsoleResizing = true;
    consoleStartY = e.clientY;
    consoleStartHeight = devConsoleDrawer.getBoundingClientRect().height;
    devConsoleDrawer.classList.add('resizing');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  consoleResizeHandle.addEventListener('dblclick', () => {
    const currH = devConsoleDrawer.getBoundingClientRect().height;
    const defaultH = 260;
    const expandedH = 480;
    const targetH = currH > 350 ? defaultH : expandedH;
    devConsoleDrawer.style.height = `${targetH}px`;
    localStorage.setItem('workspace_console_height', targetH);
  });
}

// Global Mouse Listeners for Resizing
window.addEventListener('mousemove', (e) => {
  if (isFvResizing) {
    // Drawer pinned to right, drag left increases width
    const deltaX = fvStartX - e.clientX;
    const newWidth = Math.max(340, Math.min(window.innerWidth - 40, fvStartWidth + deltaX));
    fileViewerDrawer.style.width = `${newWidth}px`;
  }
  if (isConsoleResizing) {
    // Console pinned to bottom, drag up increases height
    const deltaY = consoleStartY - e.clientY;
    const newHeight = Math.max(140, Math.min(window.innerHeight - 80, consoleStartHeight + deltaY));
    devConsoleDrawer.style.height = `${newHeight}px`;
  }
});

window.addEventListener('mouseup', () => {
  if (isFvResizing) {
    isFvResizing = false;
    fileViewerDrawer.classList.remove('resizing');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    const currentW = Math.round(fileViewerDrawer.getBoundingClientRect().width);
    localStorage.setItem('workspace_fv_width', currentW);
  }
  if (isConsoleResizing) {
    isConsoleResizing = false;
    devConsoleDrawer.classList.remove('resizing');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    const currentH = Math.round(devConsoleDrawer.getBoundingClientRect().height);
    localStorage.setItem('workspace_console_height', currentH);
  }
});

// ==========================================
// IN-APP DEV SERVER LIVE CONSOLE (SSE) - MULTI-PROCESS SUPPORT
// ==========================================

let consoleEventSource = null;
let isDevServerRunning = false;
let allRunningServers = [];
let selectedConsoleFilter = 'all'; // 'all' or normalized project path key
let selectedLogLevelFilter = 'all'; // 'all' | 'error' | 'warn' | 'http'
let consoleSearchQuery = '';
let consoleLogHistory = [];

function normalizePathKey(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');
}

function linkifyUrls(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/https?:\/\/[^\s"'<>]+/g, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

function classifyLogEntry(entry) {
  const text = entry.text || '';
  const stream = entry.stream || 'stdout';

  // Check for Errors
  if (
    stream === 'stderr' ||
    /(TypeError|ReferenceError|SyntaxError|RangeError|URIError|EvalError|UnhandledPromiseRejection|AssertionError|InternalServerError)/i.test(text) ||
    /(\bError:\b|\bException:\b|Traceback \(most recent call last\)|FATAL|CRITICAL|\bECONNREFUSED\b|\bETIMEDOUT\b|\bENOTFOUND\b)/i.test(text) ||
    /\b(500|502|503|504)\s+(Internal Server Error|Bad Gateway|Service Unavailable|Gateway Timeout)/i.test(text) ||
    /(\bfailed with exit code\b|\bcompile error\b|\bFailed to compile\b)/i.test(text)
  ) {
    return 'error';
  }

  // Check for HTTP Requests
  if (
    /\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(\/[^\s]*)/i.test(text) ||
    /\b(HTTP\/\d\.\d)\s+(\d{3})/i.test(text) ||
    /\[(GET|POST|PUT|PATCH|DELETE)\]/i.test(text)
  ) {
    return 'http';
  }

  // Check for Warnings
  if (
    /\b(Warning|WARN|DeprecationWarning|ExperimentalWarning)\b/i.test(text) ||
    /\b(400|401|403|404|422)\s+(Bad Request|Unauthorized|Forbidden|Not Found)/i.test(text)
  ) {
    return 'warn';
  }

  return 'info';
}

function formatLogHtml(entry) {
  let text = entry.text || '';

  // 1. Escape HTML special characters
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Format HTTP method badges
  escaped = escaped.replace(/\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g, (match) => {
    return `<span class="http-badge http-${match.toLowerCase()}">${match}</span>`;
  });

  // 3. Format HTTP status codes
  escaped = escaped.replace(/\b([1-5]\d{2})\b/g, (match) => {
    const code = parseInt(match, 10);
    if (code >= 200 && code < 300) {
      return `<span class="http-status status-2xx">${match}</span>`;
    } else if (code >= 300 && code < 400) {
      return `<span class="http-status status-3xx">${match}</span>`;
    } else if (code >= 400 && code < 500) {
      return `<span class="http-status status-4xx">${match}</span>`;
    } else if (code >= 500 && code < 600) {
      return `<span class="http-status status-5xx">${match}</span>`;
    }
    return match;
  });

  // 4. Format Stack Trace frames
  escaped = escaped.replace(/(^\s+at\s+[^\n]+)/gm, '<span class="log-stack-frame">$1</span>');
  escaped = escaped.replace(/(^\s+File\s+"[^"]+",\s+line\s+\d+[^\n]+)/gm, '<span class="log-stack-frame">$1</span>');

  // 5. Convert URLs to clickable links
  return linkifyUrls(escaped);
}

function createLogLineElement(entry) {
  if (!entry.level) {
    entry.level = classifyLogEntry(entry);
  }

  const line = document.createElement('div');
  let levelClass = '';
  if (entry.level === 'error') levelClass = ' log-error-line';
  else if (entry.level === 'warn') levelClass = ' log-warn-line';
  else if (entry.level === 'http') levelClass = ' log-http-line';

  line.className = `log-line log-${entry.stream || 'stdout'}${levelClass}`;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = entry.timestamp ? `[${entry.timestamp.split('T')[1]?.split('.')[0] || entry.timestamp}] ` : '';
  line.appendChild(timeSpan);

  // In 'All Active' view, prepend project badge
  if (selectedConsoleFilter === 'all' && entry.projectName) {
    const projTag = document.createElement('span');
    projTag.className = 'log-proj-tag';
    projTag.textContent = `[${entry.projectName}]`;
    line.appendChild(projTag);
  }

  const msgSpan = document.createElement('span');
  msgSpan.className = 'log-msg';
  msgSpan.innerHTML = formatLogHtml(entry);
  line.appendChild(msgSpan);

  return line;
}

function updateLogCategoryCounts() {
  let total = 0;
  let errors = 0;
  let warns = 0;
  let https = 0;

  for (const entry of consoleLogHistory) {
    if (selectedConsoleFilter === 'all' || entry.projectId === selectedConsoleFilter) {
      if (!entry.level) entry.level = classifyLogEntry(entry);
      total++;
      if (entry.level === 'error') errors++;
      else if (entry.level === 'warn') warns++;
      else if (entry.level === 'http') https++;
    }
  }

  if (countAll) countAll.textContent = total;
  if (countErrors) countErrors.textContent = errors;
  if (countWarn) countWarn.textContent = warns;
  if (countHttp) countHttp.textContent = https;

  if (btnJumpLatestError) {
    if (errors > 0) {
      btnJumpLatestError.classList.remove('hidden');
    } else {
      btnJumpLatestError.classList.add('hidden');
    }
  }
}

function renderFilteredLogs() {
  if (!consoleOutput) return;
  consoleOutput.innerHTML = '';

  const q = (consoleSearchQuery || '').toLowerCase().trim();

  const filtered = consoleLogHistory.filter(entry => {
    // 1. Project filter
    if (selectedConsoleFilter !== 'all' && entry.projectId !== selectedConsoleFilter) {
      return false;
    }
    // 2. Log level category filter
    if (!entry.level) entry.level = classifyLogEntry(entry);
    if (selectedLogLevelFilter !== 'all' && entry.level !== selectedLogLevelFilter) {
      return false;
    }
    // 3. Search query
    if (q) {
      const textMatch = (entry.text || '').toLowerCase().includes(q);
      const projMatch = (entry.projectName || '').toLowerCase().includes(q);
      if (!textMatch && !projMatch) return false;
    }
    return true;
  });

  updateLogCategoryCounts();

  if (filtered.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.className = 'log-line log-system';
    let filterMsg = selectedConsoleFilter === 'all' ? 'any active dev server' : 'this project';
    if (selectedLogLevelFilter !== 'all') filterMsg += ` (${selectedLogLevelFilter.toUpperCase()} only)`;
    if (q) filterMsg += ` matching "${q}"`;
    emptyNotice.innerHTML = `<span class="log-msg">No logs found for ${filterMsg}.</span>`;
    consoleOutput.appendChild(emptyNotice);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const entry of filtered) {
    fragment.appendChild(createLogLineElement(entry));
  }
  consoleOutput.appendChild(fragment);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function appendConsoleLog(entry) {
  if (!entry.level) entry.level = classifyLogEntry(entry);
  consoleLogHistory.push(entry);
  if (consoleLogHistory.length > 2500) {
    consoleLogHistory.shift();
  }

  updateLogCategoryCounts();

  const projMatches = (selectedConsoleFilter === 'all') || (entry.projectId === selectedConsoleFilter);
  const levelMatches = (selectedLogLevelFilter === 'all') || (entry.level === selectedLogLevelFilter);
  const q = (consoleSearchQuery || '').toLowerCase().trim();
  const searchMatches = !q || (entry.text || '').toLowerCase().includes(q) || (entry.projectName && entry.projectName.toLowerCase().includes(q));

  if (projMatches && levelMatches && searchMatches && consoleOutput) {
    const line = createLogLineElement(entry);
    consoleOutput.appendChild(line);

    while (consoleOutput.children.length > 1500) {
      consoleOutput.removeChild(consoleOutput.firstChild);
    }
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
}

function renderConsoleProjectTabs() {
  if (!consoleProjectTabs) return;
  consoleProjectTabs.innerHTML = '';

  if (activeTabId === 'home') {
    const allChip = document.createElement('button');
    allChip.className = `console-tab-chip ${selectedConsoleFilter === 'all' ? 'active' : ''}`;
    allChip.innerHTML = `All Active (${allRunningServers.length})`;
    allChip.title = 'View aggregated logs across all running projects';
    allChip.onclick = () => {
      selectedConsoleFilter = 'all';
      renderConsoleProjectTabs();
      renderFilteredLogs();
      updateConsoleControls();
    };
    consoleProjectTabs.appendChild(allChip);

    for (const server of allRunningServers) {
      const chip = document.createElement('button');
      chip.className = `console-tab-chip ${selectedConsoleFilter === server.id ? 'active' : ''}`;
      chip.innerHTML = `⚡ ${server.projectName}`;
      chip.title = `${server.projectName} (${server.command})`;
      chip.onclick = () => {
        selectedConsoleFilter = server.id;
        renderConsoleProjectTabs();
        renderFilteredLogs();
        updateConsoleControls();
      };
      consoleProjectTabs.appendChild(chip);
    }
  } else {
    const currentTab = openTabs.find(t => t.id === activeTabId);
    const projKey = currentTab ? normalizePathKey(currentTab.path) : null;
    const projName = currentTab ? currentTab.title : 'Project';
    const isRunning = allRunningServers.some(s => s.id === projKey);

    const chip = document.createElement('button');
    chip.className = `console-tab-chip ${selectedConsoleFilter === projKey ? 'active' : ''}`;
    chip.innerHTML = `${isRunning ? '⚡ ' : ''}${projName}`;
    chip.title = currentTab ? currentTab.path : '';
    chip.onclick = () => {
      selectedConsoleFilter = projKey;
      renderConsoleProjectTabs();
      renderFilteredLogs();
      updateConsoleControls();
    };
    consoleProjectTabs.appendChild(chip);

    if (allRunningServers.length > 1) {
      const allChip = document.createElement('button');
      allChip.className = `console-tab-chip ${selectedConsoleFilter === 'all' ? 'active' : ''}`;
      allChip.innerHTML = `All Active (${allRunningServers.length})`;
      allChip.title = 'Switch to view all active servers';
      allChip.onclick = () => {
        selectedConsoleFilter = 'all';
        renderConsoleProjectTabs();
        renderFilteredLogs();
        updateConsoleControls();
      };
      consoleProjectTabs.appendChild(allChip);
    }
  }
}

function updateConsoleControls() {
  if (activeTabId === 'home') {
    if (selectedConsoleFilter === 'all') {
      const anyRunning = allRunningServers.length > 0;
      isDevServerRunning = anyRunning;
      if (consoleStatusDot) {
        consoleStatusDot.classList.toggle('running', anyRunning);
        consoleStatusDot.classList.toggle('stopped', !anyRunning);
      }
      if (btnConsoleStop) {
        btnConsoleStop.disabled = !anyRunning;
        btnConsoleStop.title = 'Stop all running dev servers';
        const stopText = btnConsoleStop.querySelector('span');
        if (stopText) stopText.textContent = 'Stop All';
      }
      if (consoleCmdBadge) {
        if (anyRunning) {
          consoleCmdBadge.textContent = `${allRunningServers.length} Active`;
          consoleCmdBadge.classList.remove('hidden');
        } else {
          consoleCmdBadge.classList.add('hidden');
        }
      }
    } else {
      const targetServer = allRunningServers.find(s => s.id === selectedConsoleFilter);
      const isRunning = !!targetServer;
      if (consoleStatusDot) {
        consoleStatusDot.classList.toggle('running', isRunning);
        consoleStatusDot.classList.toggle('stopped', !isRunning);
      }
      if (btnConsoleStop) {
        btnConsoleStop.disabled = !isRunning;
        btnConsoleStop.title = targetServer ? `Stop ${targetServer.projectName}` : 'Stop Server';
        const stopText = btnConsoleStop.querySelector('span');
        if (stopText) stopText.textContent = targetServer ? `Stop ${targetServer.projectName}` : 'Stop';
      }
      if (consoleCmdBadge) {
        if (targetServer && targetServer.command) {
          consoleCmdBadge.textContent = targetServer.command;
          consoleCmdBadge.classList.remove('hidden');
        } else {
          consoleCmdBadge.classList.add('hidden');
        }
      }
    }
  } else {
    // Project Tab view
    const currentTab = openTabs.find(t => t.id === activeTabId);
    const projKey = currentTab ? normalizePathKey(currentTab.path) : null;
    const currentServer = allRunningServers.find(s => s.id === projKey);
    const isRunning = !!currentServer;

    isDevServerRunning = isRunning;
    if (consoleStatusDot) {
      consoleStatusDot.classList.toggle('running', isRunning);
      consoleStatusDot.classList.toggle('stopped', !isRunning);
    }
    if (btnConsoleStop) {
      btnConsoleStop.disabled = !isRunning;
      const stopText = btnConsoleStop.querySelector('span');
      if (stopText) stopText.textContent = 'Stop';
      btnConsoleStop.title = isRunning ? `Stop ${currentTab ? currentTab.title : 'Server'}` : 'Server Not Running';
    }
    if (consoleCmdBadge) {
      if (currentServer && currentServer.command) {
        consoleCmdBadge.textContent = currentServer.command;
        consoleCmdBadge.classList.remove('hidden');
      } else {
        consoleCmdBadge.classList.add('hidden');
      }
    }
    if (btnStartServerText) {
      if (isRunning) {
        btnStartServerText.textContent = 'Server Running';
      } else {
        const selected = scriptSelect && scriptSelect.options[scriptSelect.selectedIndex];
        btnStartServerText.textContent = selected ? `Run: ${selected.text.split(':')[0]}` : 'Start Server';
      }
    }
  }
}

function updateConsoleStatus(running, details = {}) {
  if (details.servers) {
    allRunningServers = details.servers;
  }

  // Update Main View Live Servers count button
  if (btnMainLiveServers && mainServersCountText) {
    if (allRunningServers.length > 0) {
      btnMainLiveServers.classList.remove('hidden');
      mainServersCountText.textContent = `${allRunningServers.length} Active Server${allRunningServers.length > 1 ? 's' : ''}`;
    } else {
      btnMainLiveServers.classList.add('hidden');
      mainServersCountText.textContent = '0 Active Servers';
    }
  }

  renderConsoleProjectTabs();
  updateConsoleControls();
}

function initConsoleSSE() {
  if (consoleEventSource) return;

  consoleEventSource = new EventSource('/api/server-stream');

  consoleEventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        if (data.servers) allRunningServers = data.servers;
        if (data.logs) {
          consoleLogHistory = data.logs;
          renderFilteredLogs();
        }
        updateConsoleStatus(allRunningServers.length > 0, { servers: allRunningServers });
      } else if (data.type === 'log') {
        appendConsoleLog(data);
      } else if (data.type === 'status') {
        updateConsoleStatus(data.running, data);
      }
    } catch (e) {
      console.error('SSE parse error:', e);
    }
  };

  consoleEventSource.onerror = () => {
    // Reconnect handled automatically by EventSource
  };
}

async function checkServerStatus() {
  try {
    const res = await fetch('/api/server-status');
    const data = await res.json();
    if (data.success || data.servers) {
      updateConsoleStatus(data.running, data);
    }
  } catch {}
}

if (btnMainLiveServers) {
  btnMainLiveServers.addEventListener('click', () => {
    selectedConsoleFilter = 'all';
    if (devConsoleDrawer) {
      devConsoleDrawer.classList.remove('hidden');
    }
    initConsoleSSE();
    renderConsoleProjectTabs();
    renderFilteredLogs();
    updateConsoleControls();
  });
}

if (btnToggleDevConsole) {
  btnToggleDevConsole.addEventListener('click', () => {
    if (devConsoleDrawer) {
      devConsoleDrawer.classList.toggle('hidden');
      initConsoleSSE();
      renderConsoleProjectTabs();
      renderFilteredLogs();
      updateConsoleControls();
    }
  });
}

if (btnConsoleClose) {
  btnConsoleClose.addEventListener('click', () => {
    if (devConsoleDrawer) {
      devConsoleDrawer.classList.add('hidden');
    }
  });
}

if (btnConsoleToggle) {
  btnConsoleToggle.addEventListener('click', () => {
    if (devConsoleDrawer) {
      devConsoleDrawer.classList.toggle('expanded');
      btnConsoleToggle.title = devConsoleDrawer.classList.contains('expanded') ? 'Minimize Height' : 'Expand Height';
    }
  });
}

if (btnConsoleClear) {
  btnConsoleClear.addEventListener('click', () => {
    if (selectedConsoleFilter === 'all') {
      consoleLogHistory = [];
    } else {
      consoleLogHistory = consoleLogHistory.filter(l => l.projectId !== selectedConsoleFilter);
    }
    updateLogCategoryCounts();
    if (consoleOutput) {
      consoleOutput.innerHTML = '<div class="log-line log-system"><span class="log-msg">Console cleared.</span></div>';
    }
  });
}

// Log Level Filter Chips (All, Errors, Warnings, API Requests)
const levelFilterBtns = [
  { btn: btnFilterLevelAll, level: 'all' },
  { btn: btnFilterLevelErrors, level: 'error' },
  { btn: btnFilterLevelWarn, level: 'warn' },
  { btn: btnFilterLevelHttp, level: 'http' }
];

levelFilterBtns.forEach(({ btn, level }) => {
  if (btn) {
    btn.addEventListener('click', () => {
      selectedLogLevelFilter = level;
      levelFilterBtns.forEach(item => {
        if (item.btn) item.btn.classList.toggle('active', item.level === level);
      });
      renderFilteredLogs();
    });
  }
});

// Console Live Search
if (consoleSearchInput) {
  let searchDebounce = null;
  consoleSearchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      consoleSearchQuery = consoleSearchInput.value.trim();
      if (btnConsoleSearchClear) {
        btnConsoleSearchClear.classList.toggle('hidden', !consoleSearchQuery);
      }
      renderFilteredLogs();
    }, 80);
  });
}

if (btnConsoleSearchClear) {
  btnConsoleSearchClear.addEventListener('click', () => {
    if (consoleSearchInput) {
      consoleSearchInput.value = '';
      consoleSearchQuery = '';
      btnConsoleSearchClear.classList.add('hidden');
      renderFilteredLogs();
      consoleSearchInput.focus();
    }
  });
}

// Jump to Latest Error
if (btnJumpLatestError) {
  btnJumpLatestError.addEventListener('click', () => {
    // If currently filtered to non-error, switch to errors
    if (selectedLogLevelFilter !== 'all' && selectedLogLevelFilter !== 'error') {
      selectedLogLevelFilter = 'error';
      levelFilterBtns.forEach(item => {
        if (item.btn) item.btn.classList.toggle('active', item.level === 'error');
      });
      renderFilteredLogs();
    }

    const errorLines = consoleOutput ? consoleOutput.querySelectorAll('.log-error-line') : [];
    if (errorLines.length > 0) {
      const lastError = errorLines[errorLines.length - 1];
      lastError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      lastError.classList.remove('flash-highlight');
      void lastError.offsetWidth; // force reflow
      lastError.classList.add('flash-highlight');
      setTimeout(() => {
        lastError.classList.remove('flash-highlight');
      }, 1600);
    }
  });
}

if (btnConsoleStop) {
  btnConsoleStop.addEventListener('click', async () => {
    try {
      btnConsoleStop.disabled = true;
      let bodyPayload = {};
      if (activeTabId === 'home' && selectedConsoleFilter === 'all') {
        bodyPayload = { all: true };
      } else {
        let targetPath = null;
        if (activeTabId !== 'home') {
          targetPath = getActiveActionPath();
        } else {
          const s = allRunningServers.find(srv => srv.id === selectedConsoleFilter);
          targetPath = s ? s.projectPath : null;
        }
        bodyPayload = { path: targetPath };
      }

      const res = await fetch('/api/server-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      await res.json();
      await checkServerStatus();
    } catch (e) {
      console.error('Failed to stop server:', e);
    } finally {
      btnConsoleStop.disabled = false;
    }
  });
}

// Start Dev Server
btnStartServer.addEventListener('click', async () => {
  const targetPath = getActiveActionPath();
  if (!targetPath) return;

  const currentTab = openTabs.find(t => t.id === activeTabId);
  const projTitle = (focusedBreadcrumbNode && focusedBreadcrumbNode.name) || (currentTab && currentTab.title) || (selectedNode && selectedNode.name);

  const selectedOpt = scriptSelect.options[scriptSelect.selectedIndex];
  let cmd = scriptSelect.value || null;
  const cwd = selectedOpt ? selectedOpt.getAttribute('data-cwd') : null;

  if (cmd === '__custom__') {
    openAppCustomCmdModal(targetPath, currentAppCustomProjDetails || {});
    return;
  }

  btnStartServerText.textContent = 'Launching...';

  // Automatically scope filter to this project
  selectedConsoleFilter = normalizePathKey(targetPath);

  // Open drawer and connect SSE immediately
  if (devConsoleDrawer) {
    devConsoleDrawer.classList.remove('hidden');
  }
  initConsoleSSE();

  try {
    const res = await fetch('/api/server-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath, command: cmd, cwd: cwd || undefined, name: projTitle })
    });
    const result = await res.json();
    if (result.success) {
      await checkServerStatus();
      btnStartServerText.textContent = 'Server Running';
    } else {
      btnStartServerText.textContent = result.message || 'Failed';
      setTimeout(() => {
        const selected = scriptSelect.options[scriptSelect.selectedIndex];
        btnStartServerText.textContent = selected ? `Run: ${selected.text.split(':')[0]}` : 'Start Server';
      }, 3000);
    }
  } catch {
    btnStartServerText.textContent = 'Failed';
    setTimeout(() => {
      const selected = scriptSelect.options[scriptSelect.selectedIndex];
      btnStartServerText.textContent = selected ? `Run: ${selected.text.split(':')[0]}` : 'Start Server';
    }, 3000);
  }
});

// Project Terminal (Ubuntu terminal for WSL paths, PowerShell for Windows paths - groups tabs in single window)
btnProjectTerminal.addEventListener('click', async () => {
  const targetPath = getActiveActionPath();
  if (!targetPath) return;
  const currentTab = openTabs.find(t => t.id === activeTabId);
  const projTitle = (focusedBreadcrumbNode && focusedBreadcrumbNode.name) || (currentTab && currentTab.title) || (selectedNode && selectedNode.name);
  const labelSpan = btnProjectTerminal.querySelector('span');
  const originalText = labelSpan ? labelSpan.textContent : 'Terminal';
  const originalTitle = btnProjectTerminal.getAttribute('title') || 'Terminal';

  if (labelSpan) labelSpan.textContent = 'Opening...';
  btnProjectTerminal.setAttribute('title', 'Attaching Terminal Tab...');

  try {
    const res = await fetch('/api/run-terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath, title: projTitle })
    });
    const result = await res.json();
    if (labelSpan) labelSpan.textContent = result.success ? 'Tab Added! ✓' : 'Failed';
    btnProjectTerminal.setAttribute('title', result.message || 'Attached Terminal Tab');
  } catch (err) {
    if (labelSpan) labelSpan.textContent = 'Failed';
    console.error('Failed to run terminal:', err);
  }
  setTimeout(() => {
    if (labelSpan) labelSpan.textContent = originalText;
    btnProjectTerminal.setAttribute('title', originalTitle);
  }, 2200);
});

// Project VS Code (code . at folder directory)
btnProjectCode.addEventListener('click', async () => {
  const targetPath = getActiveActionPath();
  if (!targetPath) return;
  const originalTitle = btnProjectCode.getAttribute('title') || 'VS Code';
  btnProjectCode.setAttribute('title', 'Opening VS Code...');
  try {
    const res = await fetch('/api/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vscode', path: targetPath })
    });
    const result = await res.json();
    btnProjectCode.setAttribute('title', result.message || 'Opened in VS Code');
  } catch (err) {
    console.error('Failed to open VS Code:', err);
  }
  setTimeout(() => btnProjectCode.setAttribute('title', originalTitle), 2500);
});

// Project File Explorer
if (btnProjectExplorer) {
  btnProjectExplorer.addEventListener('click', async () => {
    const targetPath = getActiveActionPath();
    if (!targetPath) return;
    const labelSpan = btnProjectExplorer.querySelector('span');
    const originalText = labelSpan ? labelSpan.textContent : 'Explorer';
    const originalTitle = btnProjectExplorer.getAttribute('title') || 'File Explorer';

    if (labelSpan) labelSpan.textContent = 'Opening...';
    btnProjectExplorer.setAttribute('title', 'Opening Explorer...');

    try {
      const res = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'explorer', path: targetPath })
      });
      const result = await res.json();
      if (labelSpan) labelSpan.textContent = result.success ? 'Opened! ✓' : 'Failed';
      btnProjectExplorer.setAttribute('title', result.message || 'Opened Explorer');
    } catch (err) {
      if (labelSpan) labelSpan.textContent = 'Failed';
      console.error('Failed to open File Explorer:', err);
    }
    setTimeout(() => {
      if (labelSpan) labelSpan.textContent = originalText;
      btnProjectExplorer.setAttribute('title', originalTitle);
    }, 2200);
  });
}

// Recenter Project Tree
btnProjectRecenter.addEventListener('click', () => {
  camera.targetX = window.innerWidth / 3;
  camera.targetY = window.innerHeight / 2;
  camera.targetZoom = 1.05;
});

// Zoom to Fit Entire Tree
btnZoomToFit.addEventListener('click', zoomToFit);

function zoomToFit() {
  if (!activeTreeRoot) return;
  const visibleNodes = Array.from(activeNodesMap.values()).filter(n => isNodeVisible(n) && n.opacity > 0.05);
  if (visibleNodes.length === 0) return;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const n of visibleNodes) {
    const hw = n.width / 2;
    const hh = n.height / 2;
    minX = Math.min(minX, n.currentX - hw);
    maxX = Math.max(maxX, n.currentX + hw);
    minY = Math.min(minY, n.currentY - hh);
    maxY = Math.max(maxY, n.currentY + hh);
  }

  const treeW = Math.max(maxX - minX, 100);
  const treeH = Math.max(maxY - minY, 100);

  const paddingX = 160;
  const paddingY = 180;
  const availW = window.innerWidth - paddingX;
  const availH = window.innerHeight - paddingY;

  const fitZoom = Math.min(Math.max(Math.min(availW / treeW, availH / treeH), 0.35), 1.5);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  camera.targetZoom = fitZoom;
  camera.targetX = window.innerWidth / 2 - centerX * fitZoom;
  camera.targetY = window.innerHeight / 2 - centerY * fitZoom;
}

// Expand All / Collapse All Toggle
let isAllExpanded = false;
btnExpandCollapseAll.addEventListener('click', async () => {
  if (!activeTreeRoot) return;
  isAllExpanded = !isAllExpanded;

  async function setExpandedRecursive(node, expand) {
    if (!node.hasChildren || node.disabled) return;
    if (expand) {
      if (node.children.length === 0) {
        await expandDirectory(node, false);
      } else {
        node.expanded = true;
      }
      for (const child of node.children) {
        await setExpandedRecursive(child, expand);
      }
    } else {
      if (node !== activeTreeRoot) {
        node.expanded = false;
        collapseDescendants(node);
      }
      for (const child of node.children) {
        await setExpandedRecursive(child, expand);
      }
    }
  }

  loadingText.textContent = isAllExpanded ? 'Expanding All Folders...' : 'Collapsing All Folders...';
  loadingOverlay.classList.remove('fade-out');

  await setExpandedRecursive(activeTreeRoot, isAllExpanded);
  recalculateLayout();

  btnExpandCollapseText.textContent = isAllExpanded ? 'Collapse All' : 'Expand All';

  setTimeout(() => {
    loadingOverlay.classList.add('fade-out');
    if (isAllExpanded) {
      zoomToFit();
    } else {
      camera.targetX = window.innerWidth / 3;
      camera.targetY = window.innerHeight / 2;
      camera.targetZoom = 1.05;
    }
  }, 250);
});

// ==========================================
// 8. INSPECTOR CARD ACTIONS
// ==========================================

function selectNode(node) {
  selectedNode = node;
  if (!node || node.type === 'root') {
    inspectorCard.classList.add('hidden');
    return;
  }

  inspName.textContent = node.name;
  inspPath.textContent = node.path;
  
  inspOsTag.textContent = node.os;
  inspOsTag.className = `os-badge ${node.os}`;

  const isFile = node.type === 'file';
  inspTypeTag.textContent = isFile ? `File (${node.ext || 'file'})` : (node.isProject ? (node.projectType || 'Project') : (node.type === 'os-root' ? 'OS Root' : 'Folder'));

  if (btnViewFile) {
    btnViewFile.classList.toggle('hidden', !isFile);
  }

  if (isFile) {
    if (btnOpenCockpit) btnOpenCockpit.classList.add('hidden');
    if (btnOpenTab) btnOpenTab.classList.add('hidden');
    if (btnFocusView) btnFocusView.classList.add('hidden');
  } else {
    if (btnOpenCockpit) btnOpenCockpit.classList.remove('hidden');
    if (btnOpenTab) {
      btnOpenTab.classList.remove('hidden');
      if (btnOpenTabText) btnOpenTabText.textContent = 'Open Tab';
      btnOpenTab.title = 'Open this folder in a dedicated tab';
    }
    if (btnFocusView) {
      btnFocusView.classList.remove('hidden');
      btnFocusView.title = 'Focus this folder in current breadcrumb view';
    }
  }
  
  inspStatus.classList.add('hidden');
  inspectorCard.classList.remove('hidden');
}

if (btnViewFile) {
  btnViewFile.addEventListener('click', () => {
    if (selectedNode && selectedNode.type === 'file') {
      openFileViewer(selectedNode.path, selectedNode.name, selectedNode.ext);
    }
  });
}

inspCloseBtn.addEventListener('click', () => {
  inspectorCard.classList.add('hidden');
  selectedNode = null;
});

btnOpenTab.addEventListener('click', () => {
  if (selectedNode) {
    openProjectInNewTab(selectedNode);
    inspectorCard.classList.add('hidden');
  }
});

if (btnOpenCockpit) {
  btnOpenCockpit.addEventListener('click', async () => {
    if (!selectedNode || !selectedNode.path) return;
    try {
      const isTauri = typeof window.__TAURI_INTERNALS__ !== 'undefined' || typeof window.__TAURI__ !== 'undefined';
      if (isTauri) {
        await fetch('/api/open-cockpit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: selectedNode.path })
        });
      } else {
        const win = window.open(`/cockpit.html?path=${encodeURIComponent(selectedNode.path)}`, 'cockpit', 'width=960,height=680,resizable=yes');
        if (win) win.focus();
      }
    } catch (err) {
      console.error('Failed to open cockpit:', err);
    }
  });
}

if (btnFocusView) {
  btnFocusView.addEventListener('click', () => {
    if (selectedNode) {
      focusBreadcrumbNode(selectedNode);
      inspectorCard.classList.add('hidden');
    }
  });
}

async function triggerLaunch(action) {
  if (!selectedNode || !selectedNode.path) return;
  inspStatus.textContent = `Launching ${action}...`;
  inspStatus.classList.remove('hidden');

  try {
    const res = await fetch('/api/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, path: selectedNode.path, title: selectedNode.name })
    });
    const result = await res.json();
    inspStatus.textContent = result.message || 'Launched successfully!';
  } catch (err) {
    inspStatus.textContent = 'Failed to execute command';
  }

  setTimeout(() => {
    inspStatus.classList.add('hidden');
  }, 3500);
}

btnOpenCode.addEventListener('click', () => triggerLaunch('vscode'));
btnOpenExplorer.addEventListener('click', () => triggerLaunch('explorer'));
btnOpenTerminal.addEventListener('click', () => triggerLaunch('terminal'));

// Navigation Zoom controls
btnZoomIn.addEventListener('click', () => { camera.targetZoom = Math.min(camera.targetZoom * 1.25, 3.0); });
btnZoomOut.addEventListener('click', () => { camera.targetZoom = Math.max(camera.targetZoom * 0.8, 0.2); });
btnResetView.addEventListener('click', recenterView);

// Quick Jump Buttons
jumpUbuntu.addEventListener('click', () => {
  const node = Array.from(activeNodesMap.values()).find(n => n.type === 'os-root' && n.os === 'ubuntu');
  if (node) {
    camera.targetX = window.innerWidth / 2 - node.targetX * camera.targetZoom;
    camera.targetY = window.innerHeight / 2 - node.targetY * camera.targetZoom;
  }
});

jumpWin.addEventListener('click', () => {
  const node = Array.from(activeNodesMap.values()).find(n => n.type === 'os-root' && n.os === 'windows');
  if (node) {
    camera.targetX = window.innerWidth / 2 - node.targetX * camera.targetZoom;
    camera.targetY = window.innerHeight / 2 - node.targetY * camera.targetZoom;
  }
});

// ==========================================
// 8B. COLLAPSIBLE TOOLBAR (HORIZONTAL SLIDE MINIMIZE & ZEN)
// ==========================================

let isToolbarCollapsed = false;
let isToolsMinimized = false;

function setToolsMinimized(minimized) {
  isToolsMinimized = minimized;
  if (projectActionBar) {
    projectActionBar.classList.toggle('minimized', isToolsMinimized);
  }
  if (btnToggleTools) {
    btnToggleTools.setAttribute('title', isToolsMinimized ? 'Expand Developer Tools (Ctrl+B)' : 'Minimize Tools (Ctrl+B)');
  }
  localStorage.setItem('workspace_tools_minimized', isToolsMinimized ? 'true' : 'false');
}

function toggleTools() {
  setToolsMinimized(!isToolsMinimized);
}

function setToolbarCollapsed(collapsed) {
  isToolbarCollapsed = collapsed;
  if (activeTabId !== 'home') {
    setToolsMinimized(collapsed);
  } else {
    if (collapsibleDockWrapper) {
      collapsibleDockWrapper.classList.toggle('collapsed', isToolbarCollapsed);
    }
  }
  localStorage.setItem('workspace_dock_collapsed', isToolbarCollapsed ? 'true' : 'false');
}

function toggleToolbar() {
  if (activeTabId !== 'home') {
    toggleTools();
  } else {
    setToolbarCollapsed(!isToolbarCollapsed);
  }
}

if (btnToggleTools) btnToggleTools.addEventListener('click', toggleTools);
if (btnHideToolbarMain) btnHideToolbarMain.addEventListener('click', () => setToolbarCollapsed(true));
if (btnHideToolbarProj) btnHideToolbarProj.addEventListener('click', () => setToolbarCollapsed(true));

// Ensure tools are visible by default
setToolsMinimized(false);
if (localStorage.getItem('workspace_dock_collapsed') === 'true') {
  setToolbarCollapsed(true);
}

// ==========================================
// 8C. CONFIGURABLE KEYBOARD SHORTCUTS
// ==========================================

const DEFAULT_SHORTCUTS = {
  startServer: { key: 's', ctrl: true, shift: false, alt: false, label: 'Start Dev Server', display: 'Ctrl + S' },
  terminal: { key: '`', ctrl: true, shift: false, alt: false, label: 'Open Terminal', display: 'Ctrl + `' },
  vscode: { key: 'c', ctrl: true, shift: true, alt: false, label: 'Open in VS Code', display: 'Ctrl + Shift + C' },
  toggleZen: { key: 'b', ctrl: true, shift: false, alt: false, label: 'Toggle Toolbars (Zen)', display: 'Ctrl + B' },
  zoomFit: { key: 'f', ctrl: true, shift: false, alt: false, label: 'Fit View', display: 'Ctrl + F' },
  recenter: { key: 'r', ctrl: true, shift: false, alt: false, label: 'Recenter View', display: 'Ctrl + R' },
  expandCollapse: { key: 'e', ctrl: true, shift: false, alt: false, label: 'Expand/Collapse All', display: 'Ctrl + E' },
  search: { key: 'k', ctrl: true, shift: false, alt: false, label: 'Global Search', display: 'Ctrl + K' },
  settings: { key: ',', ctrl: true, shift: false, alt: false, label: 'Open Settings', display: 'Ctrl + ,' }
};

let activeShortcuts = { ...DEFAULT_SHORTCUTS };
let recordingAction = null;

function loadShortcuts() {
  try {
    const saved = localStorage.getItem('workspace_shortcuts');
    if (saved) {
      activeShortcuts = { ...DEFAULT_SHORTCUTS, ...JSON.parse(saved) };
    }
  } catch {}
}
loadShortcuts();

function renderShortcutsList() {
  if (!shortcutsList) return;
  shortcutsList.innerHTML = Object.entries(activeShortcuts).map(([actionKey, sc]) => `
    <div class="shortcut-row">
      <span class="shortcut-label">${sc.label}</span>
      <button class="shortcut-badge ${recordingAction === actionKey ? 'recording' : ''}" data-action="${actionKey}">
        ${recordingAction === actionKey ? 'Press keys...' : sc.display}
      </button>
    </div>
  `).join('');

  shortcutsList.querySelectorAll('.shortcut-badge').forEach(btn => {
    btn.addEventListener('click', () => {
      const actionKey = btn.getAttribute('data-action');
      recordingAction = actionKey;
      renderShortcutsList();
    });
  });
}

function resetShortcuts() {
  activeShortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
  localStorage.removeItem('workspace_shortcuts');
  recordingAction = null;
  renderShortcutsList();
}

if (btnResetShortcuts) btnResetShortcuts.addEventListener('click', resetShortcuts);

// Global Keydown Handler (Intercepts shortcuts and executes actions)
window.addEventListener('keydown', (e) => {
  // 1. If currently recording a new shortcut in settings:
  if (recordingAction) {
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
    e.preventDefault();

    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;

    const parts = [];
    if (ctrl) parts.push('Ctrl');
    if (shift) parts.push('Shift');
    if (alt) parts.push('Alt');
    parts.push(key.length === 1 ? key.toUpperCase() : e.key);

    const display = parts.join(' + ');

    activeShortcuts[recordingAction] = {
      ...activeShortcuts[recordingAction],
      key,
      ctrl,
      shift,
      alt,
      display
    };

    localStorage.setItem('workspace_shortcuts', JSON.stringify(activeShortcuts));
    recordingAction = null;
    renderShortcutsList();
    return;
  }

  // 2. Global Escape key handling
  if (e.key === 'Escape') {
    if (quickJumpModal && !quickJumpModal.classList.contains('hidden')) {
      closeQuickJump();
      return;
    }
    if (storageModal && !storageModal.classList.contains('hidden')) {
      closeStorageModal();
      return;
    }
    if (fileViewerDrawer && !fileViewerDrawer.classList.contains('hidden')) {
      fileViewerDrawer.classList.add('hidden');
      return;
    }
    if (devConsoleDrawer && !devConsoleDrawer.classList.contains('hidden')) {
      devConsoleDrawer.classList.add('hidden');
      return;
    }
    if (!settingsModal.classList.contains('hidden')) {
      closeSettingsModal();
      return;
    }
    if (selectedNode) {
      inspectorCard.classList.add('hidden');
      selectedNode = null;
      return;
    }
    if (activeTabId !== 'home') {
      switchToHomeView();
      return;
    }
  }

  // 3. Ignore typing inside inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    return;
  }

  // 4. Match against configured shortcuts
  const eventKey = e.key.toLowerCase();
  const eventCtrl = e.ctrlKey || e.metaKey;
  const eventShift = e.shiftKey;
  const eventAlt = e.altKey;

  for (const [actionKey, sc] of Object.entries(activeShortcuts)) {
    const keyMatches = sc.key.toLowerCase() === eventKey || sc.key.toLowerCase() === e.code.toLowerCase();
    const ctrlMatches = !sc.ctrl || eventCtrl;
    const shiftMatches = !sc.shift || eventShift;
    const altMatches = !sc.alt || eventAlt;

    if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
      e.preventDefault();
      executeShortcutAction(actionKey);
      return;
    }
  }
});

function executeShortcutAction(actionKey) {
  switch (actionKey) {
    case 'startServer':
      if (btnStartServer) btnStartServer.click();
      break;
    case 'terminal':
      if (btnProjectTerminal) btnProjectTerminal.click();
      break;
    case 'vscode':
      if (btnProjectCode) btnProjectCode.click();
      break;
    case 'toggleZen':
      toggleToolbar();
      break;
    case 'zoomFit':
      if (activeTabId !== 'home') {
        if (btnZoomToFit) btnZoomToFit.click();
      } else {
        recenterView();
      }
      break;
    case 'recenter':
      recenterView();
      break;
    case 'expandCollapse':
      if (btnExpandCollapseAll) btnExpandCollapseAll.click();
      break;
    case 'search':
      openQuickJump();
      break;
    case 'settings':
      openSettingsModal();
      break;
  }
}

// ==========================================
// 9. LIVE SEARCH & OPEN
// ==========================================

let searchDebounce = null;
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  clearTimeout(searchDebounce);
  if (query.length < 2) {
    searchResults.classList.add('hidden');
    return;
  }

  searchDebounce = setTimeout(async () => {
    try {
      const showHiddenParam = `&showHidden=${encodeURIComponent(currentSettings.showHiddenFiles || 'projects')}`;
      const projectsOnlyParam = `&projectsOnly=${encodeURIComponent(currentSettings.projectsOnly !== false)}`;
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}${showHiddenParam}${projectsOnlyParam}`);
      const data = await res.json();
      renderSearchResults(data.results || []);
    } catch {}
  }, 200);
});

function renderSearchResults(results) {
  if (results.length === 0) {
    searchResults.innerHTML = '<div style="padding:12px; font-size:12px; color:#64748b;">No matches found</div>';
    searchResults.classList.remove('hidden');
    return;
  }

  searchResults.innerHTML = results.map(item => `
    <div class="search-item" data-path="${item.path}" data-name="${item.name}" data-os="${item.os}">
      <div class="search-item-info">
        <span class="search-item-name">${item.isProject ? '⚡ ' : '📁 '}${item.name}</span>
        <span class="search-item-path">${item.path}</span>
      </div>
      <span class="os-badge ${item.os}">${item.os}</span>
    </div>
  `).join('');

  searchResults.classList.remove('hidden');

  searchResults.querySelectorAll('.search-item').forEach(el => {
    el.addEventListener('click', () => {
      const targetPath = el.getAttribute('data-path');
      const targetName = el.getAttribute('data-name');
      const targetOs = el.getAttribute('data-os');
      
      openProjectInNewTab({
        name: targetName,
        path: targetPath,
        os: targetOs,
        isProject: true
      });

      searchResults.classList.add('hidden');
      searchInput.value = '';
    });
  });
}

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.add('hidden');
  }
});

// ==========================================
// 10. CUSTOM CURSOR & SETTINGS CONFIGURATION
// ==========================================

function applySettings() {
  document.body.className = `cursor-custom style-${currentSettings.cursorStyle}`;
  if (currentSettings.cursorStyle === 'system') {
    document.body.classList.remove('cursor-custom');
  }
  document.documentElement.style.setProperty('--cursor-color', currentSettings.cursorColor);

  // Update UI active buttons
  cursorStyleOptions.querySelectorAll('.pill-opt').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-style') === currentSettings.cursorStyle);
  });

  cursorColorPalette.querySelectorAll('.color-dot').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-color') === currentSettings.cursorColor);
  });

  canvasGridOptions.querySelectorAll('.pill-opt').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-grid') === currentSettings.gridStyle);
  });

  // Update Projects Only filter buttons
  const isProjOnly = currentSettings.projectsOnly !== false;
  if (btnFilterProjects) btnFilterProjects.classList.toggle('active', isProjOnly);
  if (btnFilterAll) btnFilterAll.classList.toggle('active', !isProjOnly);

  if (projectsOnlyOptions) {
    projectsOnlyOptions.querySelectorAll('.pill-opt').forEach(btn => {
      const val = btn.getAttribute('data-projects-only') === 'true';
      btn.classList.toggle('active', val === isProjOnly);
    });
  }

  // Update Dotfiles visibility buttons
  if (hiddenFilesOptions) {
    const curHidden = currentSettings.showHiddenFiles || 'projects';
    hiddenFilesOptions.querySelectorAll('.pill-opt').forEach(btn => {
      const val = btn.getAttribute('data-show-hidden');
      btn.classList.toggle('active', val === curHidden);
    });
  }

  localStorage.setItem('workspace_settings', JSON.stringify(currentSettings));
}

// Track mouse position for custom cursor
window.addEventListener('mousemove', (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;

  if (currentSettings.cursorStyle !== 'system') {
    customCursorDot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
  }

  // Add hover effect when over interactive elements
  const target = e.target;
  const isInteractive = target && (
    target.closest('button') ||
    target.closest('input') ||
    target.closest('select') ||
    target.closest('.tab-item') ||
    target.closest('.search-item') ||
    hoveredNode !== null
  );

  document.body.classList.toggle('cursor-hover', !!isInteractive);
});

window.addEventListener('mousedown', () => {
  document.body.classList.add('cursor-click');
});

window.addEventListener('mouseup', () => {
  document.body.classList.remove('cursor-click');
});

// Settings Modal Handlers
async function openSettingsModal() {
  settingsModal.classList.remove('hidden');
  renderShortcutsList();

  try {
    const res = await fetch('/api/network-info');
    const data = await res.json();
    lanUrlDisplay.textContent = data.lanUrl;
    localUrlDisplay.textContent = data.localUrl;
  } catch {
    lanUrlDisplay.textContent = 'http://192.168.x.x:7337';
  }
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

btnOpenSettings.addEventListener('click', openSettingsModal);
if (btnProjectSettings) btnProjectSettings.addEventListener('click', openSettingsModal);
btnCloseSettings.addEventListener('click', closeSettingsModal);

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettingsModal();
});

// Cursor Style Buttons
cursorStyleOptions.querySelectorAll('.pill-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    currentSettings.cursorStyle = btn.getAttribute('data-style');
    applySettings();
  });
});

// Cursor Color Palette
cursorColorPalette.querySelectorAll('.color-dot').forEach(btn => {
  btn.addEventListener('click', () => {
    currentSettings.cursorColor = btn.getAttribute('data-color');
    applySettings();
  });
});

// Canvas Grid Appearance
canvasGridOptions.querySelectorAll('.pill-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    currentSettings.gridStyle = btn.getAttribute('data-grid');
    applySettings();
  });
});

async function refreshCurrentTree() {
  projectTreeCache.clear();
  if (activeTabId !== 'home') {
    const currTab = openTabs.find(t => t.id === activeTabId);
    if (currTab) {
      await switchToProjectTab(currTab);
    }
  } else {
    // Reset home tree roots children and reload with current filter
    if (homeRootNode && homeRootNode.children) {
      for (const c of homeRootNode.children) {
        c.children = [];
        c.expanded = false;
        await expandDirectory(c, false);
      }
      recalculateLayout();
    }
  }
}

// Quick View Filter (Main Toolbar)
if (btnFilterProjects) {
  btnFilterProjects.addEventListener('click', async () => {
    if (currentSettings.projectsOnly === true) return;
    currentSettings.projectsOnly = true;
    applySettings();
    await refreshCurrentTree();
  });
}

if (btnFilterAll) {
  btnFilterAll.addEventListener('click', async () => {
    if (currentSettings.projectsOnly === false) return;
    currentSettings.projectsOnly = false;
    applySettings();
    await refreshCurrentTree();
  });
}

// Settings Modal: Projects Only Filter
if (projectsOnlyOptions) {
  projectsOnlyOptions.querySelectorAll('.pill-opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-projects-only') === 'true';
      if (currentSettings.projectsOnly === val) return;
      currentSettings.projectsOnly = val;
      applySettings();
      await refreshCurrentTree();
    });
  });
}

// Settings Modal: Dotfiles Visibility
if (hiddenFilesOptions) {
  hiddenFilesOptions.querySelectorAll('.pill-opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-show-hidden');
      if (currentSettings.showHiddenFiles === val) return;
      currentSettings.showHiddenFiles = val;
      applySettings();
      await refreshCurrentTree();
    });
  });
}

// Copy LAN Wi-Fi URL for friends
btnCopyLanUrl.addEventListener('click', async () => {
  const url = lanUrlDisplay.textContent;
  if (!url || url.includes('Loading')) return;
  try {
    await navigator.clipboard.writeText(url);
    btnCopyLanUrl.classList.add('copied');
    btnCopyLanUrl.querySelector('span').textContent = 'Copied! ✓';
    setTimeout(() => {
      btnCopyLanUrl.classList.remove('copied');
      btnCopyLanUrl.querySelector('span').textContent = 'Copy Link';
    }, 1800);
  } catch {}
});

// Copy Localhost URL
btnCopyLocalUrl.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(localUrlDisplay.textContent);
    btnCopyLocalUrl.classList.add('copied');
    btnCopyLocalUrl.querySelector('span').textContent = 'Copied! ✓';
    setTimeout(() => {
      btnCopyLocalUrl.classList.remove('copied');
      btnCopyLocalUrl.querySelector('span').textContent = 'Copy';
    }, 1800);
  } catch {}
});

// Export Open Tabs to JSON
btnExportTabs.addEventListener('click', () => {
  const data = JSON.stringify(openTabs, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'workspace-setup.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Reset Tabs
btnResetTabs.addEventListener('click', () => {
  if (confirm('Close all open project tabs and reset to main view?')) {
    openTabs = [];
    saveTabs();
    renderTabsUI();
    switchToHomeView();
    closeSettingsModal();
  }
});

// Stop Background Service
if (btnStopService) {
  btnStopService.addEventListener('click', async () => {
    if (confirm('Shut down the background Workspace Tree service? (You can restart it anytime with start.bat or start-service.vbs)')) {
      try {
        btnStopService.disabled = true;
        btnStopService.textContent = 'Stopping...';
        await fetch('/api/service-shutdown', { method: 'POST' });
        if (serviceStatusDesc) {
          serviceStatusDesc.textContent = 'Service stopped. Run start.bat or restart-service.bat to resume.';
        }
        btnStopService.textContent = 'Stopped';
      } catch {
        btnStopService.textContent = 'Stopped';
      }
    }
  });
}

// ==========================================
// 11. WORKSPACE TREE POWER FEATURES (PHASES 1-5)
// ==========================================

let currentProjectTranslatedPaths = null;

// Dual-OS Path Translation & Badges
async function updateProjectBarEnhancements(projectPath) {
  if (!projectPath) return;

  // 1. Fetch Dual-OS Paths
  currentProjectTranslatedPaths = null;
  fetch(`/api/translate-path?path=${encodeURIComponent(projectPath)}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        currentProjectTranslatedPaths = data;
      }
    }).catch(() => {});

  // 2. Fetch Git Status Badge
  const projGitBadge = document.getElementById('projGitBadge');
  const projGitText = document.getElementById('projGitText');
  if (projGitBadge && projGitText) {
    projGitBadge.classList.add('hidden');
    fetch(`/api/git-status?path=${encodeURIComponent(projectPath)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.isGit) {
          projGitBadge.classList.remove('hidden');
          if (data.isClean) {
            projGitBadge.className = 'proj-badge-pill git-badge clean';
            projGitText.textContent = `${data.branch} ✓`;
            projGitBadge.title = `Git Branch: ${data.branch} (Working tree clean)`;
          } else {
            projGitBadge.className = 'proj-badge-pill git-badge dirty';
            projGitText.textContent = `${data.branch} ● ${data.dirtyCount}`;
            const fileList = data.dirtyFiles ? data.dirtyFiles.map(f => f.file).join(', ') : '';
            projGitBadge.title = `Git Branch: ${data.branch} (${data.dirtyCount} changed files: ${fileList})`;
          }
        }
      }).catch(() => {});
  }

  // 3. Update Live Port Badge
  updateProjectPortBadge(projectPath);
}

function updateProjectPortBadge(projectPath) {
  const projLivePortBadge = document.getElementById('projLivePortBadge');
  const projPortText = document.getElementById('projPortText');
  if (!projLivePortBadge || !projPortText) return;

  const projKey = normalizePathKey(projectPath);
  const activeServer = allRunningServers.find(s => s.id === projKey);
  if (activeServer) {
    projLivePortBadge.classList.remove('hidden');
    projPortText.textContent = activeServer.port ? `:${activeServer.port}` : 'Active';
  } else {
    projLivePortBadge.classList.add('hidden');
  }
}

// Copy Chips Event Listeners
const btnCopyPathWsl = document.getElementById('btnCopyPathWsl');
const btnCopyPathWin = document.getElementById('btnCopyPathWin');
const btnCopyPathCode = document.getElementById('btnCopyPathCode');

function copyWithFeedback(button, textToCopy, label) {
  if (!textToCopy) return;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const origHtml = button.innerHTML;
    button.innerHTML = `<span style="color:#10b981;font-weight:bold;">✓ Copied</span>`;
    setTimeout(() => {
      button.innerHTML = origHtml;
    }, 1500);
  }).catch(() => {});
}

if (btnCopyPathWsl) {
  btnCopyPathWsl.addEventListener('click', () => {
    const p = currentProjectTranslatedPaths?.linuxPath || getActiveActionPath();
    copyWithFeedback(btnCopyPathWsl, p, 'WSL');
  });
}

if (btnCopyPathWin) {
  btnCopyPathWin.addEventListener('click', () => {
    const p = currentProjectTranslatedPaths?.winDrivePath || currentProjectTranslatedPaths?.winUnc || getActiveActionPath();
    copyWithFeedback(btnCopyPathWin, p, 'Win');
  });
}

if (btnCopyPathCode) {
  btnCopyPathCode.addEventListener('click', () => {
    const p = currentProjectTranslatedPaths?.vscodeUri;
    copyWithFeedback(btnCopyPathCode, p, 'VSCode');
  });
}

// Quick Kill Port Button
const btnKillPortQuick = document.getElementById('btnKillPortQuick');
if (btnKillPortQuick) {
  btnKillPortQuick.addEventListener('click', async (e) => {
    e.stopPropagation();
    const projKey = normalizePathKey(getActiveActionPath());
    const srv = allRunningServers.find(s => s.id === projKey);
    if (srv) {
      if (confirm(`Stop dev server for "${srv.projectName}"?`)) {
        await fetch('/api/server-stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: srv.projectPath })
        });
        document.getElementById('projLivePortBadge')?.classList.add('hidden');
      }
    }
  });
}

// Global Quick-Jump Spotlight Palette (Ctrl+K / Cmd+K)
const quickJumpModal = document.getElementById('quickJumpModal');
const qjInput = document.getElementById('qjInput');
const qjResultsList = document.getElementById('qjResultsList');
let qjSelectedIndex = 0;
let qjCurrentResults = [];

function openQuickJump() {
  if (!quickJumpModal) return;
  quickJumpModal.classList.remove('hidden');
  if (qjInput) {
    qjInput.value = '';
    qjInput.focus();
  }
  renderQuickJumpResults('');
}

function closeQuickJump() {
  if (!quickJumpModal) return;
  quickJumpModal.classList.add('hidden');
}

if (quickJumpModal) {
  quickJumpModal.addEventListener('click', (e) => {
    if (e.target === quickJumpModal) closeQuickJump();
  });
}

if (qjInput) {
  let qjDebounce = null;
  qjInput.addEventListener('input', (e) => {
    clearTimeout(qjDebounce);
    qjDebounce = setTimeout(() => {
      renderQuickJumpResults(e.target.value);
    }, 100);
  });

  qjInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (qjCurrentResults.length > 0) {
        qjSelectedIndex = (qjSelectedIndex + 1) % qjCurrentResults.length;
        updateQuickJumpSelection();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (qjCurrentResults.length > 0) {
        qjSelectedIndex = (qjSelectedIndex - 1 + qjCurrentResults.length) % qjCurrentResults.length;
        updateQuickJumpSelection();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectQuickJumpItem(qjSelectedIndex, e.shiftKey);
    } else if (e.key === 'Escape') {
      closeQuickJump();
    }
  });
}

function updateQuickJumpSelection() {
  if (!qjResultsList) return;
  const items = qjResultsList.querySelectorAll('.qj-item');
  items.forEach((item, idx) => {
    item.classList.toggle('selected', idx === qjSelectedIndex);
    if (idx === qjSelectedIndex) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

async function renderQuickJumpResults(query) {
  if (!qjResultsList) return;
  const q = query.trim().toLowerCase();

  const candidates = [];
  for (const node of activeNodesMap.values()) {
    if (!node.name || node.type === 'root') continue;
    candidates.push({
      name: node.name,
      path: node.path,
      os: node.os,
      isProject: node.isProject,
      projectType: node.projectType || 'Folder',
      nodeRef: node
    });
  }

  let matches = candidates.filter(c => {
    if (!q) return c.isProject;
    return c.name.toLowerCase().includes(q) || c.path.toLowerCase().includes(q);
  });

  if (q.length >= 2 && matches.length < 5) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&projectsOnly=true`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        for (const r of data.results) {
          if (!matches.some(m => m.path === r.path)) {
            matches.push({
              name: r.name,
              path: r.path,
              os: r.os,
              isProject: true,
              projectType: r.projectType || 'Project',
              nodeRef: null
            });
          }
        }
      }
    } catch {}
  }

  qjCurrentResults = matches.slice(0, 15);
  qjSelectedIndex = 0;

  if (qjCurrentResults.length === 0) {
    qjResultsList.innerHTML = `<div class="qj-empty-state">No matching projects found for "${query}"</div>`;
    return;
  }

  qjResultsList.innerHTML = qjCurrentResults.map((item, idx) => `
    <div class="qj-item ${idx === 0 ? 'selected' : ''}" data-index="${idx}">
      <div class="qj-item-title-group">
        <span class="qj-item-icon">${item.isProject ? '⚡' : '📁'}</span>
        <div>
          <div class="qj-item-name">${item.name}</div>
          <div class="qj-item-sub">${item.path}</div>
        </div>
      </div>
      <span class="qj-item-os ${item.os === 'ubuntu' ? 'ubuntu' : 'windows'}">${(item.os || 'win').toUpperCase()}</span>
    </div>
  `).join('');

  qjResultsList.querySelectorAll('.qj-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-index'), 10);
      selectQuickJumpItem(idx, false);
    });
  });
}

function selectQuickJumpItem(index, openInTab = false) {
  const item = qjCurrentResults[index];
  if (!item) return;
  closeQuickJump();

  if (openInTab) {
    openProjectInNewTab({
      name: item.name,
      path: item.path,
      os: item.os,
      isProject: true
    });
  } else {
    if (activeTabId !== 'home') {
      switchToHomeView();
    }
    if (item.nodeRef) {
      focusAndHighlightNode(item.nodeRef);
    } else {
      openProjectInNewTab({
        name: item.name,
        path: item.path,
        os: item.os,
        isProject: true
      });
    }
  }
}

function focusAndHighlightNode(node) {
  if (!node) return;
  let curr = node.parent;
  while (curr) {
    curr.expanded = true;
    curr = curr.parent;
  }
  recalculateLayout();

  camera.targetX = window.innerWidth / 2 - node.currentX * camera.targetZoom;
  camera.targetY = window.innerHeight / 2 - node.currentY * camera.targetZoom;
  camera.targetZoom = 1.25;

  node.pulse = 1.4;
  selectedNode = node;
  focusedBreadcrumbNode = node;
  updateBreadcrumb(node);
}

// Storage Hygiene Modal Logic
const storageModal = document.getElementById('storageModal');
const btnStorageCleanup = document.getElementById('btnStorageCleanup');
const btnStorageClose = document.getElementById('btnStorageClose');
const btnStorageCancel = document.getElementById('btnStorageCancel');
const btnStorageCleanSelected = document.getElementById('btnStorageCleanSelected');
const storageArtifactsList = document.getElementById('storageArtifactsList');
const storageLoading = document.getElementById('storageLoading');
const storageTotalReclaimable = document.getElementById('storageTotalReclaimable');

let currentStoragePath = null;
let currentArtifactsData = [];

function openStorageModal(projectPath) {
  if (!storageModal) return;
  currentStoragePath = projectPath || getActiveActionPath();
  storageModal.classList.remove('hidden');
  document.getElementById('storageModalTitle').textContent = `Storage Hygiene`;
  document.getElementById('storageModalSub').textContent = currentStoragePath;
  loadStorageFootprint(currentStoragePath);
}

function closeStorageModal() {
  if (!storageModal) return;
  storageModal.classList.add('hidden');
}

if (btnStorageCleanup) {
  btnStorageCleanup.addEventListener('click', () => {
    openStorageModal(getActiveActionPath());
  });
}
if (btnStorageClose) btnStorageClose.addEventListener('click', closeStorageModal);
if (btnStorageCancel) btnStorageCancel.addEventListener('click', closeStorageModal);

async function loadStorageFootprint(targetPath) {
  if (!storageArtifactsList || !storageLoading) return;
  storageArtifactsList.innerHTML = '';
  storageLoading.classList.remove('hidden');
  btnStorageCleanSelected.disabled = true;
  storageTotalReclaimable.textContent = 'Calculating...';

  try {
    const res = await fetch(`/api/storage-footprint?path=${encodeURIComponent(targetPath)}`);
    const data = await res.json();
    storageLoading.classList.add('hidden');

    if (!data.success || !data.artifacts || data.artifacts.length === 0) {
      storageArtifactsList.innerHTML = `<div class="storage-loading">✨ Clean! No heavy build or cache artifacts detected.</div>`;
      storageTotalReclaimable.textContent = 'Reclaimable: 0 MB';
      return;
    }

    currentArtifactsData = data.artifacts;
    renderStorageArtifacts();
  } catch (err) {
    storageLoading.classList.add('hidden');
    storageArtifactsList.innerHTML = `<div class="storage-loading">Error loading storage: ${err.message}</div>`;
  }
}

function renderStorageArtifacts() {
  storageArtifactsList.innerHTML = currentArtifactsData.map((item, idx) => `
    <div class="storage-artifact-row">
      <div class="storage-row-left">
        <input type="checkbox" id="chk_art_${idx}" data-name="${item.name}" class="storage-chk" checked>
        <label for="chk_art_${idx}" class="storage-artifact-name">${item.name}/</label>
      </div>
      <span class="storage-artifact-size">${item.formattedSize}</span>
    </div>
  `).join('');

  updateStorageSelectedCount();
  storageArtifactsList.querySelectorAll('.storage-chk').forEach(chk => {
    chk.addEventListener('change', updateStorageSelectedCount);
  });
}

function updateStorageSelectedCount() {
  const selected = Array.from(storageArtifactsList.querySelectorAll('.storage-chk:checked')).map(c => c.getAttribute('data-name'));
  btnStorageCleanSelected.disabled = selected.length === 0;
  btnStorageCleanSelected.textContent = selected.length > 0 ? `Clean Selected (${selected.length})` : 'Clean Selected';
  storageTotalReclaimable.textContent = `${selected.length} artifact folders selected`;
}

if (btnStorageCleanSelected) {
  btnStorageCleanSelected.addEventListener('click', async () => {
    const selected = Array.from(storageArtifactsList.querySelectorAll('.storage-chk:checked')).map(c => c.getAttribute('data-name'));
    if (selected.length === 0) return;

    if (!confirm(`Are you sure you want to delete [${selected.join(', ')}] from:\n${currentStoragePath}?\n\nThis will free up disk space. You can reinstall packages later with npm/cargo.`)) {
      return;
    }

    btnStorageCleanSelected.disabled = true;
    btnStorageCleanSelected.textContent = 'Cleaning...';

    try {
      const res = await fetch('/api/clean-artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentStoragePath, targets: selected })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully deleted: ${data.deleted.join(', ')}`);
        loadStorageFootprint(currentStoragePath);
      } else {
        alert(`Clean completed with errors: ${data.errors ? data.errors.join('; ') : 'failed'}`);
        loadStorageFootprint(currentStoragePath);
      }
    } catch (err) {
      alert(`Error cleaning artifacts: ${err.message}`);
    }
  });
}

// Apply initial settings
applySettings();

// Start Workspace & Render Loop
initWorkspace();
requestAnimationFrame(render);

// ==========================================
// 15. AUTO-UPDATE CHECKER (GitHub Releases)
// ==========================================
const APP_VERSION = '1.1.0';
const GITHUB_REPO = 'Reneilrp/workspace-tree';

function isNewerVersion(remoteTag, localVer) {
  const cleanRemote = String(remoteTag || '').replace(/^v/i, '').trim();
  const cleanLocal = String(localVer || '').replace(/^v/i, '').trim();
  const rParts = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
  const lParts = cleanLocal.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

async function checkForUpdates() {
  const banner = document.getElementById('updateBanner');
  const bannerText = document.getElementById('updateBannerText');
  const btnDownload = document.getElementById('btnUpdateDownload');
  const btnDismiss = document.getElementById('btnDismissUpdate');
  if (!banner || !bannerText || !btnDownload) return;

  btnDismiss.addEventListener('click', () => {
    banner.classList.add('hidden');
    if (window._latestReleaseTag) {
      try {
        localStorage.setItem('dismissed_update_tag', window._latestReleaseTag);
      } catch {}
    }
  });

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!res.ok) return;

    const release = await res.json();
    if (!release || !release.tag_name) return;

    window._latestReleaseTag = release.tag_name;
    const dismissed = localStorage.getItem('dismissed_update_tag');
    if (dismissed === release.tag_name) return;

    if (isNewerVersion(release.tag_name, APP_VERSION)) {
      bannerText.textContent = `New update available: ${release.name || release.tag_name}`;
      btnDownload.href = release.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`;
      btnDownload.addEventListener('click', () => {
        banner.classList.add('hidden');
        try {
          localStorage.setItem('dismissed_update_tag', release.tag_name);
        } catch {}
      });
      banner.classList.remove('hidden');
    }
  } catch {
    // Silently ignore network or offline errors
  }
}

// Check for updates 3 seconds after startup
setTimeout(checkForUpdates, 3000);
