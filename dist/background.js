
// Background script for The Boring Blocker extension

// Listen for badge update requests from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBadge") {
    // Get the tab ID from the sender
    const tabId = sender.tab ? sender.tab.id : null;
    
    if (!tabId) return true;
    
    if (message.clear) {
      // Clear the badge for this specific tab
      try {
        chrome.action.setBadgeText({ tabId: tabId, text: "" });
      } catch (err) {
        console.error("[The Boring Blocker] Error clearing badge:", err);
      }
    } else {
      // Update badge with count for this specific tab
      const count = message.count || 0;
      
      // Only show badge if there are blocked items
      if (count > 0) {
        // Format badge count (show "9+" for large numbers)
        let formattedCount = count.toString();
        if (count > 9) {
          formattedCount = "9+";
        }
        
        // Set badge text and color for this specific tab
        try {
          chrome.action.setBadgeText({ tabId: tabId, text: formattedCount });
          chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#FF5555" });
        } catch (err) {
          console.error("[The Boring Blocker] Error updating badge:", err);
        }
      } else {
        // Clear badge if count is zero for this specific tab
        try {
          chrome.action.setBadgeText({ tabId: tabId, text: "" });
        } catch (err) {
          console.error("[The Boring Blocker] Error clearing badge:", err);
        }
      }
    }
  }
  
  return true;
});

// Initialize badge to empty on browser startup
chrome.runtime.onStartup.addListener(() => {
  try {
    chrome.action.setBadgeText({ text: "" });
  } catch (err) {
    console.error("[The Boring Blocker] Error initializing badge on startup:", err);
  }
});

// Initialize badge when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.action.setBadgeText({ text: "" });
  } catch (err) {
    console.error("[The Boring Blocker] Error initializing badge on install:", err);
  }
});
