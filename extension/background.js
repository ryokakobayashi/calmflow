/* ═══════════════════════════════════════
   CalmFlow Blocker - background.js
   Handles site blocking using declarativeNetRequest
   ═══════════════════════════════════════ */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateRules') {
    updateBlockRules(message.sites, message.enabled);
    sendResponse({ success: true });
  }

  if (message.action === 'getStatus') {
    chrome.storage.local.get(['blockedSites', 'focusMode'], (data) => {
      sendResponse({
        sites: data.blockedSites || [],
        enabled: data.focusMode || false
      });
    });
    return true; // Keep the message channel open for async response
  }
});

// Update the blocking rules based on the site list and focus mode
async function updateBlockRules(sites, enabled) {
  // Save to storage
  chrome.storage.local.set({
    blockedSites: sites,
    focusMode: enabled
  });

  // First, remove all existing rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(rule => rule.id);

  if (existingIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds
    });
  }

  // If focus mode is off, don't add any rules
  if (!enabled || sites.length === 0) return;

  // Create blocking rules for each site
  const newRules = sites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site)
      }
    },
    condition: {
      urlFilter: `*://${site}/*`,
      resourceTypes: ['main_frame']
    }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: newRules
  });

  console.log(`CalmFlow: ${enabled ? 'Blocking' : 'Allowing'} ${sites.length} sites`);
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    blockedSites: ['twitter.com', 'youtube.com', 'tiktok.com'],
    focusMode: false
  });
});
