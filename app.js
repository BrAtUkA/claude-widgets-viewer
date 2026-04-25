// ═══════════════════════════════════════════════════
// Claude Widgets Viewer — Core Logic
// ═══════════════════════════════════════════════════

// ── State ──
let CLAUDE_THEME_CSS = '';
let files = [];          // { id, name, title, content, size, width }
let activeFileId = null;
let currentTheme = 'dark';

// ── DOM refs ──
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const previewArea = document.getElementById('previewArea');
const emptyState = document.getElementById('emptyState');
const dropZone = document.getElementById('dropZone');
const globalDrop = document.getElementById('globalDrop');
const fileInput = document.getElementById('fileInput');
const themeToggle = document.getElementById('themeToggle');
const uploadBtn = document.getElementById('uploadBtn');
const searchBtn = document.getElementById('searchBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const layout = document.getElementById('layout');
const activeTitle = document.getElementById('activeTitle');
const sidebarFooter = document.getElementById('sidebarFooter');
const footerStats = document.getElementById('footerStats');
const clearAllBtn = document.getElementById('clearAllBtn');
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchEmpty = document.getElementById('searchEmpty');
const searchCloseBtn = document.getElementById('searchCloseBtn');
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancel = document.getElementById('confirmCancel');
const confirmOk = document.getElementById('confirmOk');
const promptOverlay = document.getElementById('promptOverlay');
const promptTextarea = document.getElementById('promptTextarea');
const promptCloseBtn = document.getElementById('promptCloseBtn');
const promptCopyBtn = document.getElementById('promptCopyBtn');
const promptClaudeBtn = document.getElementById('promptClaudeBtn');
const aboutBtn = document.getElementById('aboutBtn');
const aboutOverlay = document.getElementById('aboutOverlay');
const aboutCloseBtn = document.getElementById('aboutCloseBtn');
const securityOverlay = document.getElementById('securityOverlay');
const securityCloseBtn = document.getElementById('securityCloseBtn');
const securityDontShowBtn = document.getElementById('securityDontShowBtn');

// SVG icon fragments for file list items
const ICON_FILE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>';
const ICON_CLOSE = '<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink: 0;"><path d="M11.323 1.5a1.5 1.5 0 0 1 1.393.943L13.338 4H17.5l.1.01a.5.5 0 0 1 0 .98l-.1.01h-1.537l-.894 11.615A1.5 1.5 0 0 1 13.574 18H6.426a1.5 1.5 0 0 1-1.478-1.24l-.017-.145L4.037 5H2.5a.5.5 0 0 1 0-1h4.162l.622-1.557.047-.104A1.5 1.5 0 0 1 8.677 1.5zM5.928 16.538a.5.5 0 0 0 .498.462h7.148a.5.5 0 0 0 .498-.462L14.961 5H5.039zM8.5 8a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5m3 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5M8.677 2.5a.5.5 0 0 0-.43.246l-.034.068L7.738 4h4.524l-.475-1.186a.5.5 0 0 0-.464-.314z"></path></svg>';

// ══════════════════════════════════════
// Load theme CSS
// ══════════════════════════════════════

async function loadThemeCSS() {
  try {
    const resp = await fetch('claude-theme.css');
    CLAUDE_THEME_CSS = await resp.text();
  } catch (e) {
    console.error('Failed to load claude-theme.css:', e);
  }
}

// ══════════════════════════════════════
// File handling
// ══════════════════════════════════════

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();
  const srMatch = html.match(/class="sr-only"[^>]*>([^<]+)/i);
  if (srMatch) return srMatch[1].trim();
  const headingMatch = html.match(/<h[1-3][^>]*>([^<]+)/i);
  if (headingMatch) return headingMatch[1].trim();
  return null;
}

function updateFooterStats() {
  if (files.length === 0) {
    footerStats.textContent = 'No widgets stored';
  } else {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    footerStats.textContent = `${files.length} widget${files.length > 1 ? 's' : ''} · ${formatSize(totalSize)}`;
  }
}

async function addFiles(fileObjs) {
  let lastId = null;
  for (const file of fileObjs) {
    if (!file.name.match(/\.html?$/i)) continue;
    const readPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        const id = generateId();
        const title = extractTitle(content) || file.name.replace(/\.html?$/i, '');
        const newFile = { id, name: file.name, title, content, size: file.size, width: '720', addedAt: Date.now() };
        files.push(newFile);
        await dbSave(newFile);
        lastId = id;
        resolve();
      };
      reader.readAsText(file);
    });
    await readPromise;
  }
  if (lastId) {
    renderFileList();
    selectFile(lastId);
  }
}

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

let confirmCallback = null;
function showConfirm(msg, onOk) {
  confirmMessage.innerHTML = msg;
  confirmCallback = onOk;
  confirmOverlay.classList.add('visible');
}

confirmCancel.addEventListener('click', () => {
  confirmOverlay.classList.remove('visible');
  confirmCallback = null;
});

confirmOk.addEventListener('click', () => {
  confirmOverlay.classList.remove('visible');
  if (confirmCallback) confirmCallback();
  confirmCallback = null;
});

function removeFile(id) {
  const file = files.find(f => f.id === id);
  if (!file) return;
  showConfirm(`Are you sure you want to remove this widget?<div class="confirm-target-box">${escapeHTML(file.title)}</div>`, async () => {
    files = files.filter(f => f.id !== id);
    await dbRemove(id);
    if (activeFileId === id) {
      activeFileId = null;
      if (files.length > 0) selectFile(files[0].id);
      else showEmptyState();
    }
    renderFileList();
  });
}

// ══════════════════════════════════════
// Rendering
// ══════════════════════════════════════

function renderFileList() {
  updateFooterStats();
  fileCount.textContent = files.length;
  fileList.innerHTML = files.map((f, i) => `
    <div class="file-item ${f.id === activeFileId ? 'active' : ''}" data-id="${f.id}" title="${f.name} · ${formatSize(f.size)}">
      <div class="file-icon">${ICON_FILE}</div>
      <div class="file-num">${i + 1}</div>
      <div class="file-name">${f.title}</div>
      <button class="file-remove" data-remove="${f.id}" title="Remove">${ICON_CLOSE}</button>
    </div>
  `).join('');

  fileList.querySelectorAll('.file-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.file-remove')) return;
      selectFile(el.dataset.id);
    });
  });
  fileList.querySelectorAll('.file-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFile(btn.dataset.remove);
    });
  });
}

function setWidthControlsEnabled(enabled) {
  document.querySelectorAll('.width-btn').forEach(btn => {
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '' : '0.35';
    btn.style.pointerEvents = enabled ? '' : 'none';
  });
}

function showEmptyState() {
  previewArea.innerHTML = '';
  previewArea.appendChild(emptyState);
  emptyState.style.display = 'flex';
  activeTitle.textContent = '';
  setWidthControlsEnabled(false);
}

function selectFile(id, isInitialLoad = false) {
  activeFileId = id;
  localStorage.setItem('claude-visuals-last-open', id);
  const file = files.find(f => f.id === id);
  if (!file) return;
  setWidthControlsEnabled(true);
  renderFileList();
  syncWidthButtons(file.width);
  // Re-trigger title animation
  activeTitle.style.animation = 'none';
  activeTitle.offsetHeight; // force reflow
  activeTitle.style.animation = '';
  activeTitle.textContent = file.title;
  renderPreview(file);
  
  if (window.innerWidth <= 768 && !isInitialLoad) {
    document.getElementById('layout').classList.add('sidebar-collapsed');
  }
}

function getResolvedTheme() {
  return currentTheme;
}

// ══════════════════════════════════════
// light-dark() pre-resolver
// ══════════════════════════════════════

function resolveLightDark(css, mode) {
  let result = '';
  let i = 0;
  const marker = 'light-dark(';

  while (i < css.length) {
    const idx = css.indexOf(marker, i);
    if (idx === -1) { result += css.slice(i); break; }
    result += css.slice(i, idx);

    let depth = 1, j = idx + marker.length, commaPos = -1;
    while (j < css.length && depth > 0) {
      if (css[j] === '(') depth++;
      else if (css[j] === ')') { depth--; if (depth === 0) break; }
      else if (css[j] === ',' && depth === 1 && commaPos === -1) commaPos = j;
      j++;
    }

    if (commaPos !== -1 && depth === 0) {
      const lightVal = css.slice(idx + marker.length, commaPos).trim();
      const darkVal = css.slice(commaPos + 1, j).trim();
      result += (mode === 'dark') ? darkVal : lightVal;
    } else {
      result += css.slice(idx, j + 1);
    }
    i = j + 1;
  }
  return result;
}

// ══════════════════════════════════════
// Build iframe srcdoc
// ══════════════════════════════════════

function buildSrcdoc(content) {
  const resolved = getResolvedTheme();
  let themedCSS = resolveLightDark(CLAUDE_THEME_CSS, resolved);
  themedCSS = themedCSS.replace('color-scheme: light dark', 'color-scheme: normal');

  // Since color-scheme:normal means the browser default text stays black,
  // we must explicitly set body color so all elements inherit the correct
  // theme text color (Claude relies on color-scheme:dark for this).
  const textColor = resolved === 'dark'
    ? 'rgba(250, 249, 245, 1)'
    : 'rgba(20, 20, 19, 1)';
  themedCSS += `\nhtml, body { background: transparent !important; color: ${textColor}; }\n`;

  // Also resolve light-dark() in the widget's own content
  let resolvedContent = resolveLightDark(content, resolved);

  // Handle @media(prefers-color-scheme:dark) in widget CSS:
  // Since we use color-scheme:normal, these media queries won't fire.
  // In dark mode: extract the rules and make them unconditional.
  // In light mode: strip the dark blocks entirely.
  resolvedContent = resolvedContent.replace(
    /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{([\s\S]*?\})\s*\}/g,
    (match, innerRules) => {
      return resolved === 'dark' ? innerRules : '';
    }
  );

  const isFullDoc = /<html[\s>]/i.test(resolvedContent) || /<!DOCTYPE/i.test(resolvedContent);

  const polyTag = `<script>window.sendPrompt=function(p){window.parent.postMessage({type:'CLAUDE_PROMPT',prompt:p},'*');};</script>`;
  const tag = `<style id="claude-theme">${themedCSS}</style>${polyTag}`;

  if (isFullDoc) {
    if (/<head[\s>]/i.test(resolvedContent)) {
      return resolvedContent.replace(/<head([^>]*)>/i, `<head$1>${tag}`);
    }
    return resolvedContent.replace(/<html([^>]*)>/i, `<html$1><head>${tag}</head>`);
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${tag}</head><body>${resolvedContent}</body></html>`;
}

function renderPreview(file) {
  const w = file.width;
  const isFull = w === '100%';

  previewArea.innerHTML = `
    <div class="preview-container${isFull ? ' full-width' : ''}" id="previewContainer">
      <div class="iframe-card" id="iframeCard" style="max-width:${isFull ? '100%' : w + 'px'}">
        <iframe class="preview-iframe" id="previewIframe"
                sandbox="allow-scripts allow-same-origin"
                allowtransparency="true"></iframe>
      </div>
    </div>
  `;

  const iframe = document.getElementById('previewIframe');
  iframe.srcdoc = buildSrcdoc(file.content);

  iframe.addEventListener('load', () => {
    try {
      const doc = iframe.contentDocument;
      if (doc && doc.body) {
        const ro = new ResizeObserver(() => {
          iframe.style.height = Math.max(400, doc.documentElement.scrollHeight) + 'px';
        });
        ro.observe(doc.body);
        setTimeout(() => {
          iframe.style.height = Math.max(400, doc.documentElement.scrollHeight) + 'px';
        }, 150);
        
        // Close sidebar on mobile if iframe is tapped
        doc.addEventListener('click', () => {
          if (window.innerWidth <= 768 && !layout.classList.contains('sidebar-collapsed')) {
            layout.classList.add('sidebar-collapsed');
          }
        });
      }
    } catch (e) { }
  });
}

// ══════════════════════════════════════
// Width controls — per visual
// ══════════════════════════════════════

function syncWidthButtons(width) {
  document.querySelectorAll('.width-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.width === width);
  });
  const center = document.querySelector('.topbar-center');
  activeTitle.classList.remove('width-wide', 'width-full');
  center.classList.remove('width-full');
  if (width === '960') {
    activeTitle.classList.add('width-wide');
  } else if (width === '100%') {
    activeTitle.classList.add('width-full');
    center.classList.add('width-full');
  }
}

document.querySelectorAll('.width-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const file = files.find(f => f.id === activeFileId);
    if (!file) return;

    // Store width on this file
    file.width = btn.dataset.width;
    dbUpdateWidth(file.id, file.width);
    syncWidthButtons(file.width);

    // Apply immediately
    const card = document.getElementById('iframeCard');
    const container = document.getElementById('previewContainer');
    if (!card) return;

    if (file.width === '100%') {
      card.style.maxWidth = '100%';
      if (container) container.classList.add('full-width');
    } else {
      card.style.maxWidth = file.width + 'px';
      if (container) container.classList.remove('full-width');
    }
  });
});

// ══════════════════════════════════════
// Theme
// ══════════════════════════════════════

function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('claude-visuals-theme', theme);

  // Toggle icon visibility
  document.getElementById('themeIconSun').style.display = theme === 'dark' ? 'none' : 'block';
  document.getElementById('themeIconMoon').style.display = theme === 'dark' ? 'block' : 'none';

  // Re-render iframe with new theme
  const file = files.find(f => f.id === activeFileId);
  if (file) renderPreview(file);
}

themeToggle.addEventListener('click', () => {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// ══════════════════════════════════════
// Sidebar toggle
// ══════════════════════════════════════

sidebarToggle.addEventListener('click', () => {
  layout.classList.toggle('sidebar-collapsed');
  sidebarToggle.classList.toggle('active');
});

// ══════════════════════════════════════
// File input & drag-drop
// ══════════════════════════════════════

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => { addFiles(Array.from(e.target.files)); fileInput.value = ''; });

// Empty state drop target + browse button
dropZone.addEventListener('click', (e) => {
  if (e.target.closest('.empty-example-btn')) return;
  fileInput.click();
});
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); addFiles(Array.from(e.dataTransfer.files)); });


const emptyExampleBtn = document.getElementById('emptyExampleBtn');
if (emptyExampleBtn) {
  emptyExampleBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      const resp = await fetch('example-widget.html');
      if (!resp.ok) throw new Error('Network error');
      const content = await resp.text();
      const fileId = generateId();
      const fileObj = {
        id: fileId,
        name: 'example-widget.html',
        title: extractTitle(content) || 'Example Dashboard Widget',
        content: content,
        size: new Blob([content]).size,
        width: '720',
        addedAt: Date.now()
      };
      files.push(fileObj);
      await dbSave(fileObj);
      renderFileList();
      selectFile(fileId);
    } catch (err) {
      console.error(err);
      alert('Could not fetch example widget. Please ensure example-widget.html is available.');
    }
  });
}

let dragCounter = 0;
document.addEventListener('dragenter', (e) => {
  e.preventDefault(); dragCounter++;
  if (files.length > 0) globalDrop.classList.add('visible');
  else dropZone.classList.add('drag-over');
});
document.addEventListener('dragleave', (e) => {
  e.preventDefault(); dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    globalDrop.classList.remove('visible');
    dropZone.classList.remove('drag-over');
  }
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault(); dragCounter = 0;
  globalDrop.classList.remove('visible');
  dropZone.classList.remove('drag-over');
  if (e.target.closest('.empty-drop-target')) return;
  addFiles(Array.from(e.dataTransfer.files));
});

// ══════════════════════════════════════
// Search & Clear All
// ══════════════════════════════════════

clearAllBtn.addEventListener('click', () => {
  if (files.length === 0) return;
  showConfirm(`Are you sure you want to clear all stored widgets?<div class="confirm-target-box">${files.length} widget${files.length > 1 ? 's' : ''}</div>This cannot be undone.`, async () => {
    await dbClear();
    files = [];
    activeFileId = null;
    showEmptyState();
    renderFileList();
  });
});

function openSearch() {
  searchOverlay.classList.add('visible');
  searchInput.value = '';
  renderSearchResults('');
  searchInput.focus();
}

function closeSearch() {
  searchOverlay.classList.remove('visible');
  searchInput.blur();
}

function renderSearchResults(query) {
  const q = query.toLowerCase().trim();
  const results = q ? files.filter(f => f.title.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)) : files;

  if (results.length === 0) {
    searchResults.innerHTML = '';
    searchEmpty.style.display = 'block';
  } else {
    searchEmpty.style.display = 'none';
    searchResults.innerHTML = results.map(f => `
      <div class="search-result-item" data-id="${f.id}">
        <div class="file-icon">${ICON_FILE}</div>
        <div class="search-result-title">${f.title}</div>
        <div class="search-result-meta">${formatSize(f.size)}</div>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        closeSearch();
        selectFile(el.dataset.id);
      });
    });
  }
}

searchBtn.addEventListener('click', openSearch);
searchCloseBtn.addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', (e) => {
  if (e.target === searchOverlay) closeSearch();
});
searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && searchOverlay.classList.contains('visible')) {
    closeSearch();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
});

// ══════════════════════════════════════
// Mobile Sidebar Toggle
// ══════════════════════════════════════
const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
if (mobileSidebarToggle) {
  mobileSidebarToggle.addEventListener('click', () => {
    layout.classList.remove('sidebar-collapsed');
  });
}

// ══════════════════════════════════════
// Mobile Sidebar Outside Click
// ══════════════════════════════════════
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768 && !layout.classList.contains('sidebar-collapsed')) {
    const sidebar = document.getElementById('sidebar');
    // If click is not inside sidebar, not on the sidebar toggle, not on the mobile toggle
    if (sidebar && !sidebar.contains(e.target)
        && !sidebarToggle.contains(e.target)
        && (!mobileSidebarToggle || !mobileSidebarToggle.contains(e.target))) {
      layout.classList.add('sidebar-collapsed');
    }
  }
});

// ══════════════════════════════════════
// Prompt Interceptor
// ══════════════════════════════════════
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'CLAUDE_PROMPT') {
    promptTextarea.value = e.data.prompt;
    promptOverlay.style.display = 'flex';
  }
});

promptCloseBtn.addEventListener('click', () => {
  promptOverlay.style.display = 'none';
});

promptCopyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(promptTextarea.value);
  const oldText = promptCopyBtn.textContent;
  promptCopyBtn.textContent = 'Copied!';
  setTimeout(() => promptCopyBtn.textContent = oldText, 2000);
});

promptClaudeBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(promptTextarea.value);
  window.open(`https://claude.ai/new?q=${encodeURIComponent(promptTextarea.value)}`, '_blank');
  promptOverlay.style.display = 'none';
});

// ══════════════════════════════════════
// About Interceptor
// ══════════════════════════════════════

aboutBtn.addEventListener('click', () => {
  aboutOverlay.style.display = 'flex';
});

aboutCloseBtn.addEventListener('click', () => {
  aboutOverlay.style.display = 'none';
});

// ══════════════════════════════════════
// Security Interceptor
// ══════════════════════════════════════

securityCloseBtn.addEventListener('click', () => {
  securityOverlay.style.display = 'none';
});

securityDontShowBtn.addEventListener('click', () => {
  localStorage.setItem('claude-visuals-hide-security', 'true');
  securityOverlay.style.display = 'none';
});

// ══════════════════════════════════════
// Init
// ══════════════════════════════════════

(async () => {
  await loadThemeCSS();
  
  const savedTheme = localStorage.getItem('claude-visuals-theme');
  setTheme(savedTheme === 'light' ? 'light' : 'dark');

  const hideSecurity = localStorage.getItem('claude-visuals-hide-security');
  if (!hideSecurity) {
    securityOverlay.style.display = 'flex';
  }

  try {
    files = await dbGetAll();
    files.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  } catch (e) {
    console.error("Failed to load from DB", e);
  }

  if (files.length > 0) {
    renderFileList();
    const lastOpenId = localStorage.getItem('claude-visuals-last-open');
    if (lastOpenId && files.some(f => f.id === lastOpenId)) {
      selectFile(lastOpenId, true);
    } else {
      selectFile(files[files.length - 1].id, true);
    }
  } else {
    showEmptyState();
    renderFileList();
  }
})();
