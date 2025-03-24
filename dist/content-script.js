// Main content script for Boring Blocker extension

// Configuration
let config = {
  enabled: true,
  replacementText: "[that guy]",
  blockImages: true,
  mentionPatterns: [
    { id: "elon-musk", pattern: /\b(Elon\s+Musk)\b/gi, enabled: true },
    { id: "elon", pattern: /\b(Elon)\b/gi, enabled: true },
    { id: "musk", pattern: /\b(Musk)\b/gi, enabled: true },
    { id: "elonmusk", pattern: /\b(ElonMusk|Elon_Musk|@elonmusk)\b/gi, enabled: true }
  ]
};

// Statistics
let statistics = {
  totalReplaced: 0,
  pagesProcessed: 0
};

// Load saved configuration from localStorage
function loadConfiguration() {
  const savedEnabled = localStorage.getItem("boring-blocker-enabled");
  if (savedEnabled !== null) {
    config.enabled = JSON.parse(savedEnabled);
  }
  
  const savedReplacement = localStorage.getItem("boring-blocker-replacement");
  if (savedReplacement !== null) {
    config.replacementText = savedReplacement;
  }
  
  const savedBlockImages = localStorage.getItem("boring-blocker-block-images");
  if (savedBlockImages !== null) {
    config.blockImages = JSON.parse(savedBlockImages);
  }

  const savedMentions = localStorage.getItem("boring-blocker-mentions");
  if (savedMentions !== null) {
    try {
      const parsedMentions = JSON.parse(savedMentions);
      for (const mention of parsedMentions) {
        const existingPattern = config.mentionPatterns.find(p => p.id === mention.id);
        if (existingPattern) {
          existingPattern.enabled = mention.enabled;
        }
      }
      
      // Make sure elonmusk pattern is included
      const hasElonmusk = config.mentionPatterns.some(pattern => pattern.id === "elonmusk");
      if (!hasElonmusk) {
        config.mentionPatterns.push({ 
          id: "elonmusk", 
          pattern: /\b(ElonMusk|Elon_Musk|@elonmusk)\b/gi, 
          enabled: true 
        });
      }
    } catch (e) {
      console.error("[The Boring Blocker] Error parsing saved mentions:", e);
    }
  }
}

// Process text nodes
function processTextNode(node) {
  if (!config.enabled) return false;

  // Check if node.nodeValue is valid
  if (!node || node.nodeValue === null || node.nodeValue === undefined) {
    return false;
  }

  const originalText = node.nodeValue;
  let newText = originalText;
  let replaced = false;
  
  for (const mentionPattern of config.mentionPatterns) {
    if (mentionPattern.enabled && mentionPattern.pattern.test(newText)) {
      newText = newText.replace(mentionPattern.pattern, config.replacementText);
      replaced = true;
    }
  }
  
  if (replaced) {
    node.nodeValue = newText;
    statistics.totalReplaced++;
    return true;
  }
  
  return false;
}

// Process images that might contain alt text or titles with target words
function processImages() {
  // Skip image processing if blockImages is disabled
  if (!config.blockImages) return;
  
  try {
    const images = document.querySelectorAll('img');
    const replacementImageUrl = chrome.runtime.getURL('icon-128.png');
    
    images.forEach(img => {
      try {
        // Skip images that are part of the extension's UI
        if (img.src && img.src.startsWith(chrome.runtime.getURL(''))) {
          return;
        }
        
        // Check if we need to process this image
        const altHasMention = img.alt && config.mentionPatterns.some(
          pattern => pattern.enabled && pattern.pattern.test(img.alt)
        );
        
        const titleHasMention = img.title && config.mentionPatterns.some(
          pattern => pattern.enabled && pattern.pattern.test(img.title)
        );
        
        const srcHasMention = img.src && config.mentionPatterns.some(
          pattern => pattern.enabled && pattern.pattern.test(img.src)
        );
        
        // If no mentions found in any attribute, skip this image
        if (!altHasMention && !titleHasMention && !srcHasMention) {
          return;
        }
        
        // Check if this image was already processed
        if (img.hasAttribute('data-boring-blocker-original') && 
            img.getAttribute('data-boring-blocker-processed') === 'true') {
          
          // Double-check that the src wasn't reverted
          if (img.src !== replacementImageUrl) {
            img.src = replacementImageUrl;
          }
          return; // Already processed
        }
        
        // Store the original image source and dimensions before replacing
        const originalSrc = img.src;
        const originalWidth = img.width || img.naturalWidth || 300;
        const originalHeight = img.height || img.naturalHeight || 300;
        const originalStyle = img.getAttribute('style') || '';
        const originalSrcset = img.getAttribute('srcset') || '';
        
        // Mark as processed and store original sources for potential restoration
        img.setAttribute('data-boring-blocker-original', originalSrc);
        if (originalSrcset) {
          img.setAttribute('data-boring-blocker-original-srcset', originalSrcset);
          // Remove srcset to prevent the browser from using it
          img.removeAttribute('srcset');
        }
        img.setAttribute('data-boring-blocker-processed', 'true');
        
        // Replace the image source with our icon
        img.src = replacementImageUrl;
        
        // Add style to ensure the replaced image displays correctly
        img.style.objectFit = 'contain';
        img.style.backgroundColor = '#f1f1f1';
        
        // Maintain the original image dimensions
        if (originalWidth && originalHeight) {
          img.width = originalWidth;
          img.height = originalHeight;
        }
        
        // Add a tooltip to show it was redacted
        img.title = "[that guy] - Original content filtered";
        
        // Create a wrapper for the image with a position relative for the label
        if (!img.parentNode.classList || !img.parentNode.classList.contains('boring-blocker-img-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.classList.add('boring-blocker-img-wrapper');
          wrapper.style.position = 'relative';
          wrapper.style.display = 'inline-block';
          wrapper.style.overflow = 'hidden';
          
          // Add a small label in the corner
          const label = document.createElement('div');
          label.textContent = "[that guy]";
          label.style.position = 'absolute';
          label.style.bottom = '0';
          label.style.right = '0';
          label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          label.style.color = 'white';
          label.style.padding = '3px 6px';
          label.style.fontSize = '12px';
          label.style.fontWeight = 'bold';
          label.style.borderTopLeftRadius = '4px';
          label.style.zIndex = '10000';
          
          // Replace the image with our wrapper containing the image
          img.parentNode.insertBefore(wrapper, img);
          wrapper.appendChild(img);
          wrapper.appendChild(label);
          
          // Add a mutation observer to watch for src changes on this specific image
          const imgObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && 
                  (mutation.attributeName === 'src' || mutation.attributeName === 'srcset')) {
                const currentSrc = img.src;
                if (currentSrc !== replacementImageUrl) {
                  // Someone tried to change back the image - reapply our replacement
                  img.src = replacementImageUrl;
                  console.log('[The Boring Blocker] Prevented image from reverting back');
                }
                
                // If srcset was added, remove it
                if (img.hasAttribute('srcset')) {
                  img.removeAttribute('srcset');
                }
              }
            });
          });
          
          // Start observing the image
          imgObserver.observe(img, { attributes: true });
        }
        
        statistics.totalReplaced++;
      } catch (imgErr) {
        console.error("[The Boring Blocker] Error processing individual image:", imgErr);
      }
    });
  } catch (err) {
    console.error("[The Boring Blocker] Error in processImages:", err);
  }
}

// Walk through DOM and process text nodes
function processDOM() {
  try {
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeValue && node.nodeValue.trim() !== '') {
        textNodes.push(node);
      }
    }
    
    let replacedNodes = 0;
    textNodes.forEach(node => {
      try {
        if (processTextNode(node)) {
          replacedNodes++;
        }
      } catch (err) {
        console.error("[The Boring Blocker] Error processing text node:", err);
      }
    });
    
    // Also process images
    try {
      processImages();
    } catch (err) {
      console.error("[The Boring Blocker] Error processing images:", err);
    }
    
    if (replacedNodes > 0) {
      console.log(`[The Boring Blocker] Replaced ${replacedNodes} text nodes`);
    }
    
    if (replacedNodes > 0 || textNodes.length > 0) {
      statistics.pagesProcessed++;
    }
  } catch (err) {
    console.error("[The Boring Blocker] Error in processDOM:", err);
  }
}

// Add a function to handle lazy-loaded images
function setupImageObserver() {
  // Create a mutation observer to detect when new images are added or image attributes change
  const imageObserver = new MutationObserver((mutations) => {
    let shouldProcessImages = false;
    
    mutations.forEach((mutation) => {
      // Check for added nodes that might be images
      if (mutation.addedNodes && mutation.addedNodes.length) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeName === 'IMG') {
            shouldProcessImages = true;
            break;
          }
          
          // Check if the added node contains images
          if (node.nodeType === 1) { // ELEMENT_NODE
            const hasImages = node.querySelectorAll('img').length > 0;
            if (hasImages) {
              shouldProcessImages = true;
              break;
            }
          }
        }
      }
      
      // Check for attribute changes on images
      if (mutation.type === 'attributes' && 
          mutation.target.nodeName === 'IMG' && 
          (mutation.attributeName === 'src' || 
           mutation.attributeName === 'srcset' || 
           mutation.attributeName === 'alt' || 
           mutation.attributeName === 'title')) {
        shouldProcessImages = true;
      }
    });
    
    if (shouldProcessImages) {
      processImages();
    }
  });
  
  // Start observing the entire document for image-related changes
  imageObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'alt', 'title']
  });
  
  return imageObserver;
}

// Set up MutationObserver to monitor DOM changes
function setupObserver() {
  const observer = new MutationObserver(mutations => {
    if (!config.enabled) return;
    
    mutations.forEach(mutation => {
      try {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const newNode = mutation.addedNodes[i];
            
            // Skip <script> nodes that might contain speculation rules
            if (newNode.tagName === 'SCRIPT') {
              continue;
            }
            
            if (newNode.nodeType === Node.ELEMENT_NODE) {
              // Check if the new node is an image
              if (newNode.tagName === 'IMG') {
                try {
                  processImages();
                } catch (imgErr) {
                  console.error("[The Boring Blocker] Error processing image:", imgErr);
                }
              }
              
              // Process text nodes inside the element
              try {
                const textNodes = [];
                const walker = document.createTreeWalker(
                  newNode,
                  NodeFilter.SHOW_TEXT,
                  null,
                  false
                );
                
                let node;
                while (node = walker.nextNode()) {
                  if (node.nodeValue && node.nodeValue.trim() !== '') {
                    textNodes.push(node);
                  }
                }
                
                textNodes.forEach(node => {
                  try {
                    processTextNode(node);
                  } catch (textErr) {
                    console.error("[The Boring Blocker] Error processing text node:", textErr);
                  }
                });
              } catch (walkErr) {
                console.error("[The Boring Blocker] Error walking DOM:", walkErr);
              }
            }
          }
        }
      } catch (mutationErr) {
        console.error("[The Boring Blocker] Error processing mutation:", mutationErr);
      }
    });
  });
  
  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (observeErr) {
    console.error("[The Boring Blocker] Error setting up observer:", observeErr);
  }
  
  return observer;
}

// Initialize observer
let observer = null;

// Initialize image observer
let imageObserver = null;

// Initialize
function initialize() {
  loadConfiguration();
  
  if (config.enabled) {
    processDOM();
    observer = setupObserver();
    imageObserver = setupImageObserver();
    
    // Process images again after a short delay to catch any that loaded after our initial pass
    setTimeout(processImages, 1000);
    // And again after a longer delay for really slow pages
    setTimeout(processImages, 3000);
  }
  
  console.log(`[The Boring Blocker] Extension ${config.enabled ? 'enabled' : 'disabled'}`);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[The Boring Blocker] Message received:", message);
  
  switch(message.action) {
    case "toggleExtension":
      config.enabled = message.enabled;
      localStorage.setItem("boring-blocker-enabled", JSON.stringify(config.enabled));
      
      if (config.enabled) {
        processDOM();
        if (!observer) {
          observer = setupObserver();
        }
        if (!imageObserver) {
          imageObserver = setupImageObserver();
        }
        // Process images again after a short delay to catch any that loaded after our initial pass
        setTimeout(processImages, 1000);
      } else {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (imageObserver) {
          imageObserver.disconnect();
          imageObserver = null;
        }
        restoreOriginalText();
      }
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
      break;
      
    case "toggleBlockImages":
      config.blockImages = message.blockImages;
      localStorage.setItem("boring-blocker-block-images", JSON.stringify(config.blockImages));
      
      // Always reload the page to apply image blocking changes
      window.location.reload();
      break;
      
    case "reloadPage":
      // Force a reload of the page
      window.location.reload();
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
      break;
      
    case "getStatistics":
      sendResponse({ statistics });
      break;
  }
  
  return true;
});

// Run the script when the page is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Restore all replaced text when disabled
function restoreOriginalText() {
  // Restore original image sources before reload
  try {
    const processedImages = document.querySelectorAll('[data-boring-blocker-processed="true"]');
    processedImages.forEach(img => {
      if (img.hasAttribute('data-boring-blocker-original')) {
        img.src = img.getAttribute('data-boring-blocker-original');
        
        // Restore srcset if it existed
        if (img.hasAttribute('data-boring-blocker-original-srcset')) {
          img.setAttribute('srcset', img.getAttribute('data-boring-blocker-original-srcset'));
        }
      }
    });
  } catch (err) {
    console.error("[The Boring Blocker] Error restoring images:", err);
  }
  
  // Reload the page to restore all other content
  window.location.reload();
}
