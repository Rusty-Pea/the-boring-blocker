
// Message handling from popup

// Initialize observer
var observer = null;

// Listen for messages from popup
function setupMessageListener() {
  console.log("[The Boring Blocker] Setting up message listener");
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[The Boring Blocker] Message received:", message);
    
    try {
      switch(message.action) {
        case "toggleExtension":
          config.enabled = message.enabled;
          localStorage.setItem("boring-blocker-enabled", JSON.stringify(config.enabled));
          
          if (config.enabled) {
            processDOM();
            if (!observer) {
              observer = setupObserver();
            }
          } else {
            restoreOriginalContent();
            if (observer) {
              observer.disconnect();
              observer = null;
            }
          }
          // Make sure to respond
          sendResponse({ success: true });
          break;
          
        case "updateOptions":
          if (message.replacementText) {
            config.replacementText = message.replacementText;
            localStorage.setItem("boring-blocker-replacement", config.replacementText);
            
            if (config.enabled) {
              // Force a reload to apply the new replacement text
              window.location.reload();
            }
          }
          // Make sure to respond
          sendResponse({ success: true });
          break;

        case "updateMentions":
          if (message.mentions && Array.isArray(message.mentions)) {
            message.mentions.forEach(mention => {
              const targetMention = config.mentionPatterns.find(m => m.id === mention.id);
              if (targetMention) {
                targetMention.enabled = mention.enabled;
              }
            });
            
            localStorage.setItem("boring-blocker-mentions", JSON.stringify(message.mentions));
            
            if (config.enabled) {
              // Force a reload to apply the new mention settings
              window.location.reload();
            }
          }
          // Make sure to respond
          sendResponse({ success: true });
          break;
          
        case "toggleBlockImages":
          config.blockImages = message.blockImages;
          localStorage.setItem("boring-blocker-block-images", JSON.stringify(config.blockImages));
          
          if (config.enabled) {
            processImages();
            // No need to reload for this setting - we can dynamically process images
          }
          // Make sure to respond
          sendResponse({ success: true });
          break;
          
        case "getStatistics":
          sendResponse({ statistics });
          break;
        
        default:
          // Always respond to unknown actions
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("[The Boring Blocker] Error processing message:", error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // Keep the message channel open for asynchronous response
  });
}
