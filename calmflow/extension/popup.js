/* ═══════════════════════════════════════
   CalmFlow Blocker - popup.js
   Extension popup UI logic
   ═══════════════════════════════════════ */

let blockedSites = [];
let focusMode = false;

// Load saved data when popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    blockedSites = response.sites || [];
    focusMode = response.enabled || false;
    renderList();
    updateToggle();
  });

  // Event listeners
  document.getElementById('focus-toggle').addEventListener('change', toggleFocusMode);
  document.getElementById('add-btn').addEventListener('click', addSite);
  document.getElementById('site-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSite();
  });
});

// Toggle focus mode on/off
function toggleFocusMode() {
  focusMode = document.getElementById('focus-toggle').checked;
  updateToggle();
  sendUpdate();
}

// Update the status bar UI
function updateToggle() {
  const toggle = document.getElementById('focus-toggle');
  const statusBar = document.getElementById('status-bar');

  toggle.checked = focusMode;

  if (focusMode) {
    statusBar.textContent = `🔒 Blocking ${blockedSites.length} sites`;
    statusBar.className = 'status status-on';
  } else {
    statusBar.textContent = 'Focus Mode OFF';
    statusBar.className = 'status status-off';
  }
}

// Add a new site to the block list
function addSite() {
  const input = document.getElementById('site-input');
  let site = input.value.trim();

  // Clean up the URL
  site = site.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  if (!site) return;

  // Don't add duplicates
  if (blockedSites.includes(site)) {
    input.value = '';
    return;
  }

  blockedSites.push(site);
  input.value = '';
  renderList();
  sendUpdate();
}

// Remove a site from the block list
function removeSite(index) {
  blockedSites.splice(index, 1);
  renderList();
  sendUpdate();
}

// Render the site list in the popup
function renderList() {
  const list = document.getElementById('site-list');

  if (blockedSites.length === 0) {
    list.innerHTML = '<p class="empty-msg">No sites added yet</p>';
    return;
  }

  list.innerHTML = blockedSites.map((site, index) => `
    <li class="site-item">
      <span>🌐 ${site}</span>
      <button class="remove-btn" data-index="${index}">✕</button>
    </li>
  `).join('');

  // Add remove button listeners
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeSite(parseInt(btn.dataset.index)));
  });

  updateToggle();
}

// Send updated data to background script
function sendUpdate() {
  chrome.runtime.sendMessage({
    action: 'updateRules',
    sites: blockedSites,
    enabled: focusMode
  });
}
