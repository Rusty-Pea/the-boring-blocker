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
          // Handle replacement text
          if (message.replacementText) {
            config.replacementText = message.replacementText;
            localStorage.setItem("boring-blocker-replacement", config.replacementText);
          }
          
          // Handle detailed person options if provided
          if (message.mentions) {
            // Update category-level filters
            message.mentions.forEach(mention => {
              if (mention.type && config.activeFilters && mention.type in config.activeFilters) {
                config.activeFilters[mention.type] = mention.enabled;
              }
            });
          }
          
          // Update Elon options if provided
          if (message.elonOptions) {
            localStorage.setItem("boring-blocker-elon-options", JSON.stringify(message.elonOptions));
            config.mentionPatterns.forEach(pattern => {
              if (pattern.type === "elon") {
                const updatedOption = message.elonOptions.find(o => o.id === pattern.id);
                if (updatedOption && config.activeFilters) {
                  pattern.enabled = updatedOption.enabled && config.activeFilters.elon;
                }
              }
            });
          }
          
          // Update Trump options if provided
          if (message.trumpOptions) {
            localStorage.setItem("boring-blocker-trump-options", JSON.stringify(message.trumpOptions));
            config.mentionPatterns.forEach(pattern => {
              if (pattern.type === "trump") {
                const updatedOption = message.trumpOptions.find(o => o.id === pattern.id);
                if (updatedOption && config.activeFilters) {
                  pattern.enabled = updatedOption.enabled && config.activeFilters.trump;
                }
              }
            });
          }

          // Update Voldemort options if provided
          if (message.voldemortOptions) {
            localStorage.setItem("boring-blocker-voldemort-options", JSON.stringify(message.voldemortOptions));
            config.mentionPatterns.forEach(pattern => {
              if (pattern.type === "voldemort") {
                const updatedOption = message.voldemortOptions.find(o => o.id === pattern.id);
                if (updatedOption && config.activeFilters) {
                  pattern.enabled = updatedOption.enabled && config.activeFilters.voldemort;
                }
              }
            });
          }
          
          if (config.enabled) {
            // Force a reload to apply the new settings
            window.location.reload();
          }
          
          // Make sure to respond
          sendResponse({ success: true });
          break;

        case "updateMentions":
          if (message.mentions && Array.isArray(message.mentions)) {
            localStorage.setItem("boring-blocker-mentions", JSON.stringify(message.mentions));
            
            // Update category-level filters
            if (config.activeFilters) {
              message.mentions.forEach(mention => {
                if (mention.type && mention.type in config.activeFilters) {
                  config.activeFilters[mention.type] = mention.enabled;
                }
              });
            }
            
            // Apply category filters to patterns
            config.mentionPatterns.forEach(pattern => {
              if (pattern.type && config.activeFilters && pattern.type in config.activeFilters) {
                // Pattern is only enabled if its specific option is enabled AND its category is enabled
                const categoryEnabled = config.activeFilters[pattern.type];
                
                // Default to current enabled state if detailed options aren't provided
                let optionEnabled = pattern.enabled;
                
                // Check for detailed option state
                if (pattern.type === "elon" && message.elonOptions) {
                  const detailedOption = message.elonOptions.find(o => o.id === pattern.id);
                  if (detailedOption) optionEnabled = detailedOption.enabled;
                }
                else if (pattern.type === "trump" && message.trumpOptions) {
                  const detailedOption = message.trumpOptions.find(o => o.id === pattern.id);
                  if (detailedOption) optionEnabled = detailedOption.enabled;
                }
                
                pattern.enabled = optionEnabled && categoryEnabled;
              }
            });
            
            // Update the specific mentions in the old format for backward compatibility
            const targetMention = config.mentionPatterns.find(m => m.id === message.mentions[0]?.id);
            if (targetMention) {
              targetMention.enabled = message.mentions[0].enabled;
            }
          }
          
          if (config.enabled) {
            // Force a reload to apply the new mention settings
            window.location.reload();
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
          
        case "reloadPage":
          if (config.enabled) {
            window.location.reload();
          }
          sendResponse({ success: true });
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
