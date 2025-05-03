// Main content script for Boring Blocker extension

// Configuration
let config = {
  enabled: true,
  replacementText: "[that guy]",
  blockImages: true, // Changed default to true
  mentionPatterns: [
    // Elon patterns
    { id: "elon-musk", pattern: /\b(Elon\s+Musk)\b/gi, enabled: true },
    { id: "elon", pattern: /\b(Elon)\b/gi, enabled: true },
    { id: "musk", pattern: /\b(Musk)\b/g, enabled: true }, // Case sensitive
    { id: "elonmusk", pattern: /\b(ElonMusk|Elon_Musk|@elonmusk)\b/gi, enabled: true },
    // Trump patterns
    { id: "donald-trump", pattern: /\b(Donald\s+Trump)\b/gi, enabled: false },
    { id: "trump", pattern: /\b(Trump)\b/g, enabled: false }, 
    { id: "donaldtrump", pattern: /\b(donaldtrump)\b/gi, enabled: false },
    { id: "realdonaldtrump", pattern: /\b(@realDonaldTrump)\b/gi, enabled: false },
    { id: "donald-j-trump", pattern: /\b(Donald\s+J\.\s+Trump)\b/gi, enabled: false },
    // Voldemort patterns
    { id: "voldemort", pattern: /\b(Voldemort)\b/gi, enabled: false },
    { id: "he-who-must-not-be-named", pattern: /\b(He\s+Who\s+Must\s+Not\s+Be\s+Named)\b/gi, enabled: false },
    { id: "you-know-who", pattern: /\b(You\s+Know\s+Who)\b/gi, enabled: false },
    { id: "dark-lord", pattern: /\b(The\s+Dark\s+Lord)\b/gi, enabled: false },
    { id: "tom-riddle", pattern: /\b(Tom\s+Riddle)\b/gi, enabled: false },
    { id: "tom-marvolo-riddle", pattern: /\b(Tom\s+Marvolo\s+Riddle)\b/gi, enabled: false }
  ]
};

// Statistics
let statistics = {
  totalReplaced: 0,
  pagesProcessed: 0,
  currentPageBlocked: 0
};

// Keep track of the current URL to detect navigation
let currentUrl = window.location.href;

// Flag to track if extension context is valid
let isExtensionContextValid = true;

// Check if extension context is valid
function checkExtensionContext() {
  try {
    // A simple way to check if extension context is valid is to access chrome.runtime
    return !!chrome && !!chrome.runtime && !!chrome.runtime.id;
  } catch (e) {
    console.warn("[The Boring Blocker] Extension context is invalid");
    isExtensionContextValid = false;
    return false;
  }
}

// Badge management function
function updateBadge() {
  if (!config.enabled || !checkExtensionContext()) {
    return;
  }
  
  try {
    // Only update if we have blocked something
    if (statistics.currentPageBlocked > 0) {
      chrome.runtime.sendMessage({
        action: "updateBadge",
        count: statistics.currentPageBlocked
      });
    } else {
      // If nothing is blocked, clear the badge
      chrome.runtime.sendMessage({
        action: "updateBadge",
        count: 0,
        clear: true
      });
    }
  } catch (error) {
    console.warn("[The Boring Blocker] Error updating badge:", error);
    isExtensionContextValid = false;
  }
}

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
      
      // Process mentions
      for (const mention of parsedMentions) {
        const existingPattern = config.mentionPatterns.find(p => p.id === mention.id);
        if (existingPattern) {
          existingPattern.enabled = mention.enabled;
        }
      }
    } catch (e) {
      console.error("[The Boring Blocker] Error parsing saved mentions:", e);
    }
  }

  // Load custom terms
  const savedCustomOptions = localStorage.getItem("boring-blocker-custom-options");
  if (savedCustomOptions !== null) {
    try {
      const customOptions = JSON.parse(savedCustomOptions);
      console.log("[The Boring Blocker] Loading custom options:", customOptions);
      
      // Remove any existing custom patterns to avoid duplicates
      config.mentionPatterns = config.mentionPatterns.filter(p => !p.id.startsWith('custom-'));
      
      // Add custom patterns
      customOptions.forEach(option => {
        if (option.term && option.term.trim()) {
          // Escape special regex characters in the term
          const escapedTerm = option.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const pattern = {
            id: `custom-${option.id}`,
            pattern: new RegExp(`\\b(${escapedTerm})\\b`, 'gi'),
            enabled: option.enabled
          };
          console.log("[The Boring Blocker] Adding custom pattern:", pattern);
          config.mentionPatterns.push(pattern);
        }
      });
    } catch (e) {
      console.error("[The Boring Blocker] Error loading custom options:", e);
    }
  }

  // Load Voldemort options
  const savedVoldemortOptions = localStorage.getItem("boring-blocker-voldemort-options");
  if (savedVoldemortOptions !== null) {
    try {
      const voldemortOptions = JSON.parse(savedVoldemortOptions);
      console.log("[The Boring Blocker] Loading Voldemort options:", voldemortOptions);
      
      // Update Voldemort patterns
      voldemortOptions.forEach(option => {
        const existingPattern = config.mentionPatterns.find(p => p.id === option.id);
        if (existingPattern) {
          existingPattern.enabled = option.enabled;
          console.log(`[The Boring Blocker] Setting Voldemort pattern ${option.id} to ${option.enabled}`);
        }
      });
    } catch (e) {
      console.error("[The Boring Blocker] Error loading Voldemort options:", e);
    }
  }
}

// Process text nodes
function processTextNode(node) {
  if (!config.enabled || !isExtensionContextValid) return false;

  // Check if node.nodeValue is valid
  if (!node || node.nodeValue === null || node.nodeValue === undefined) {
    return false;
  }

  // Skip processing text nodes that are inside <script> elements
  try {
    let parentNode = node.parentNode;
    while (parentNode) {
      if (parentNode.nodeName && parentNode.nodeName.toLowerCase() === 'script') {
        // Skip processing script content
        return false;
      }
      parentNode = parentNode.parentNode;
    }
  } catch (parentErr) {
    console.warn("[The Boring Blocker] Error checking parent nodes:", parentErr);
    // Continue processing if we can't check parents
  }

  const originalText = node.nodeValue;
  let newText = originalText;
  let replaced = false;
  
  try {
    // Reset RegExp lastIndex property for each pattern before testing
    for (const mentionPattern of config.mentionPatterns) {
      if (!mentionPattern.enabled) continue;
      
      // Create a fresh copy of the pattern for each test to avoid lastIndex issues
      const freshPattern = new RegExp(mentionPattern.pattern.source, mentionPattern.pattern.flags);
      
      // Test if the pattern matches
      if (freshPattern.test(newText)) {
        // Create another fresh copy for replacement to avoid lastIndex issues
        const replacementPattern = new RegExp(mentionPattern.pattern.source, mentionPattern.pattern.flags);
        newText = newText.replace(replacementPattern, config.replacementText);
        replaced = true;
        console.log(`[The Boring Blocker] Replaced text using pattern ${mentionPattern.id}`);
      }
    }
    
    if (replaced) {
      try {
        node.nodeValue = newText;
        statistics.totalReplaced++;
        statistics.currentPageBlocked++;
        updateBadge(); // Update badge when text is replaced
      } catch (modificationError) {
        console.warn("[The Boring Blocker] Could not modify node:", modificationError);
        // If we can't modify the node, just continue
        return false;
      }
      return true;
    }
  } catch (error) {
    console.error("[The Boring Blocker] Error processing text node:", error);
  }
  
  return false;
}

// Process images that might contain alt text or titles with target words
function processImages() {
  // Skip image processing if blockImages is disabled or extension context is invalid
  if (!config.blockImages || !isExtensionContextValid) return;
  
  try {
    // Check extension context before proceeding
    if (!checkExtensionContext()) {
      return;
    }
    
    const images = document.querySelectorAll('img');
    
    let replacementImageUrl;
    try {
      replacementImageUrl = chrome.runtime.getURL('icon-128.png');
      if (!replacementImageUrl) {
        console.warn("[The Boring Blocker] Couldn't get replacement image URL");
        return;
      }
    } catch (urlError) {
      console.error("[The Boring Blocker] Error getting replacement image URL:", urlError);
      isExtensionContextValid = false;
      return;
    }
    
    images.forEach(img => {
      try {
        // Skip invalid images or images without a src
        if (!img || typeof img !== 'object' || !img.src) {
          return;
        }
        
        // Skip images that are part of the extension's UI
        try {
          if (img.src.startsWith(chrome.runtime.getURL(''))) {
            return;
          }
        } catch (srcError) {
          // If this fails, just continue - better to skip an image than break the whole process
          console.warn("[The Boring Blocker] Error checking image source:", srcError);
          if (srcError.message && srcError.message.includes("Extension context invalidated")) {
            isExtensionContextValid = false;
            return;
          }
        }
        
        // Check if we need to process this image
        let shouldProcess = false;
        
        try {
          // Safe check for alt text
          const altHasMention = img.alt && config.mentionPatterns.some(
            pattern => pattern.enabled && (new RegExp(pattern.pattern.source, pattern.pattern.flags)).test(img.alt)
          );
          
          // Safe check for title
          const titleHasMention = img.title && config.mentionPatterns.some(
            pattern => pattern.enabled && (new RegExp(pattern.pattern.source, pattern.pattern.flags)).test(img.title)
          );
          
          // Safe check for src
          const srcHasMention = img.src && config.mentionPatterns.some(
            pattern => pattern.enabled && (new RegExp(pattern.pattern.source, pattern.pattern.flags)).test(img.src)
          );
          
          shouldProcess = altHasMention || titleHasMention || srcHasMention;
        } catch (matchError) {
          console.warn("[The Boring Blocker] Error checking image attributes:", matchError);
          return; // Skip this image if we can't check it properly
        }
        
        // If no mentions found in any attribute, skip this image
        if (!shouldProcess) {
          return;
        }
        
        // Check if this image was already processed
        if (img.hasAttribute('data-boring-blocker-original') && 
            img.getAttribute('data-boring-blocker-processed') === 'true') {
          
          // Double-check that the src wasn't reverted
          if (img.src !== replacementImageUrl) {
            try {
              img.src = replacementImageUrl;
            } catch (srcError) {
              console.warn("[The Boring Blocker] Couldn't update image src:", srcError);
              if (srcError.message && srcError.message.includes("Extension context invalidated")) {
                isExtensionContextValid = false;
              }
            }
          }
          return; // Already processed
        }
        
        // Store the original image source and dimensions before replacing
        const originalSrc = img.src || '';
        
        // Safely get dimensions with fallbacks
        let originalWidth = 300;
        let originalHeight = 300;
        
        try {
          originalWidth = img.width || (img.naturalWidth ? img.naturalWidth : 300);
          originalHeight = img.height || (img.naturalHeight ? img.naturalHeight : 300);
        } catch (dimensionError) {
          console.warn("[The Boring Blocker] Error getting image dimensions:", dimensionError);
        }
        
        const originalStyle = img.getAttribute('style') || '';
        const originalSrcset = img.getAttribute('srcset') || '';
        
        try {
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
          // First check if the parent node exists and is valid
          if (img.parentNode && img.parentNode.insertBefore && 
              (!img.parentNode.classList || !img.parentNode.classList.contains('boring-blocker-img-wrapper'))) {
            
            try {
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
              try {
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
              } catch (observerError) {
                console.warn("[The Boring Blocker] Couldn't set up image observer:", observerError);
              }
            } catch (wrapperError) {
              console.warn("[The Boring Blocker] Couldn't create image wrapper:", wrapperError);
              if (wrapperError.message && wrapperError.message.includes("Extension context invalidated")) {
                isExtensionContextValid = false;
              }
            }
          }
          
          statistics.totalReplaced++;
          statistics.currentPageBlocked++;
          updateBadge(); // Update badge when image is replaced
        } catch (processError) {
          console.error("[The Boring Blocker] Error applying image changes:", processError);
          if (processError.message && processError.message.includes("Extension context invalidated")) {
            isExtensionContextValid = false;
          }
        }
      } catch (imgErr) {
        console.error("[The Boring Blocker] Error processing individual image:", imgErr);
        if (imgErr.message && imgErr.message.includes("Extension context invalidated")) {
          isExtensionContextValid = false;
        }
      }
    });
  } catch (err) {
    console.error("[The Boring Blocker] Error in processImages:", err);
    if (err.message && err.message.includes("Extension context invalidated")) {
      isExtensionContextValid = false;
    }
  }
}

// Walk through DOM and process text nodes
function processDOM() {
  try {
    // Check if extension context is still valid
    if (!isExtensionContextValid && !checkExtensionContext()) {
      return;
    }
    
    // Reset current page statistics before processing
    statistics.currentPageBlocked = 0;
    
    const textNodes = [];
    let walker;
    
    try {
      walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
    } catch (walkerError) {
      console.error("[The Boring Blocker] Error creating TreeWalker:", walkerError);
      return; // Exit if we can't create the walker
    }
    
    let node;
    try {
      while (node = walker.nextNode()) {
        if (node.nodeValue && node.nodeValue.trim() !== '') {
          textNodes.push(node);
        }
      }
    } catch (walkError) {
      console.error("[The Boring Blocker] Error walking DOM:", walkError);
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
    
    // Update badge with final count
    updateBadge();
  } catch (err) {
    console.error("[The Boring Blocker] Error in processDOM:", err);
    if (err.message && err.message.includes("Extension context invalidated")) {
      isExtensionContextValid = false;
    }
  }
}

// Add a function to handle lazy-loaded images
function setupImageObserver() {
  // Check if extension context is still valid
  if (!isExtensionContextValid && !checkExtensionContext()) {
    return null;
  }
  
  // Create a mutation observer to detect when new images are added or image attributes change
  try {
    const imageObserver = new MutationObserver((mutations) => {
      // Skip if extension context is invalid
      if (!isExtensionContextValid) return;
      
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
  } catch (error) {
    console.error("[The Boring Blocker] Error setting up image observer:", error);
    if (error.message && error.message.includes("Extension context invalidated")) {
      isExtensionContextValid = false;
    }
    return null;
  }
}

// Set up MutationObserver to monitor DOM changes
function setupObserver() {
  // Check if extension context is still valid
  if (!isExtensionContextValid && !checkExtensionContext()) {
    return null;
  }
  
  try {
    const observer = new MutationObserver(mutations => {
      if (!config.enabled || !isExtensionContextValid) return;
      
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
          if (mutationErr.message && mutationErr.message.includes("Extension context invalidated")) {
            isExtensionContextValid = false;
            observer.disconnect();
          }
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
      if (observeErr.message && observeErr.message.includes("Extension context invalidated")) {
        isExtensionContextValid = false;
      }
      return null;
    }
    
    return observer;
  } catch (error) {
    console.error("[The Boring Blocker] Error creating observer:", error);
    if (error.message && error.message.includes("Extension context invalidated")) {
      isExtensionContextValid = false;
    }
    return null;
  }
}

// Initialize observer
let observer = null;

// Initialize image observer
let imageObserver = null;

// URL change detector
let lastProcessedUrl = '';

// Setup URL change detection
function setupUrlChangeDetection() {
  // Check if extension context is still valid
  if (!isExtensionContextValid && !checkExtensionContext()) {
    return;
  }
  
  // Check if we're in a browser environment with the history API
  if (window.history && window.history.pushState) {
    // Save the original methods
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    // Override pushState
    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      handleUrlChange();
    };
    
    // Override replaceState
    window.history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      handleUrlChange();
    };
    
    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', function() {
      handleUrlChange();
    });
  }
  
  // Also check URL periodically for changes
  // This catches some cases the history API doesn't
  setInterval(() => {
    // Skip if extension context is invalid
    if (!isExtensionContextValid) return;
    
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      handleUrlChange();
    }
  }, 1000);
}

// Handle URL changes
function handleUrlChange() {
  // Reset extension context flag on navigation
  isExtensionContextValid = true;
  
  // Check if extension context is valid
  if (!checkExtensionContext()) {
    return;
  }
  
  const newUrl = window.location.href;
  
  // Only reprocess if the URL has actually changed
  if (newUrl !== lastProcessedUrl) {
    console.log("[The Boring Blocker] URL changed, reprocessing page");
    lastProcessedUrl = newUrl;
    
    // Reset the statistics for current page
    statistics.currentPageBlocked = 0;
    
    // Update badge to reflect the reset
    updateBadge();
    
    // Wait a bit for content to load then process DOM again
    setTimeout(() => {
      if (config.enabled && isExtensionContextValid) {
        processDOM();
      }
    }, 500);
  }
}

// Initialize
function initialize() {
  // Reset extension context flag on initialization
  isExtensionContextValid = true;
  
  // Check if extension context is valid
  if (!checkExtensionContext()) {
    console.warn("[The Boring Blocker] Extension context is invalid during initialization");
    return;
  }
  
  loadConfiguration();
  
  // Store initial URL
  lastProcessedUrl = window.location.href;
  
  if (config.enabled) {
    processDOM();
    observer = setupObserver();
    imageObserver = setupImageObserver();
    setupUrlChangeDetection();
    
    // Process images again after a short delay to catch any that loaded after our initial pass
    setTimeout(() => {
      if (isExtensionContextValid) {
        processImages();
      }
    }, 1000);
    // And again after a longer delay for really slow pages
    setTimeout(() => {
      if (isExtensionContextValid) {
        processImages();
      }
    }, 3000);
  }
  
  console.log(`[The Boring Blocker] Extension ${config.enabled ? 'enabled' : 'disabled'}`);
}

// Clear badge when disabling
function clearBadge() {
  if (!isExtensionContextValid) return;
  
  try {
    chrome.runtime.sendMessage({
      action: "updateBadge",
      count: 0,
      clear: true
    });
  } catch (error) {
    console.warn("[The Boring Blocker] Error clearing badge:", error);
    if (error.message && error.message.includes("Extension context invalidated")) {
      isExtensionContextValid = false;
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Skip if extension context is invalid
  if (!isExtensionContextValid && !checkExtensionContext()) {
    // Still try to respond to avoid hanging the popup
    try {
      sendResponse({ error: "Extension context invalidated" });
    } catch (e) {
      // Ignore response errors
    }
    return true;
  }
  
  console.log("[The Boring Blocker] Message received:", message);
  
  try {
    switch(message.action) {
      case "clearAllData":
        // Reset all statistics
        statistics = {
          totalReplaced: 0,
          pagesProcessed: 0,
          currentPageBlocked: 0
        };
        
        // Reset configuration to defaults
        config = {
          enabled: true,
          replacementText: "[that guy]",
          blockImages: true,
          mentionPatterns: [
            // Elon patterns
            { id: "elon-musk", pattern: /\b(Elon\s+Musk)\b/gi, enabled: true },
            { id: "elon", pattern: /\b(Elon)\b/gi, enabled: true },
            { id: "musk", pattern: /\b(Musk)\b/g, enabled: true },
            { id: "elonmusk", pattern: /\b(ElonMusk|Elon_Musk|@elonmusk)\b/gi, enabled: true },
            // Trump patterns
            { id: "donald-trump", pattern: /\b(Donald\s+Trump)\b/gi, enabled: false },
            { id: "trump", pattern: /\b(Trump)\b/g, enabled: false },
            { id: "donaldtrump", pattern: /\b(donaldtrump)\b/gi, enabled: false },
            { id: "realdonaldtrump", pattern: /\b(@realDonaldTrump)\b/gi, enabled: false },
            { id: "donald-j-trump", pattern: /\b(Donald\s+J\.\s+Trump)\b/gi, enabled: false },
            // Voldemort patterns
            { id: "voldemort", pattern: /\b(Voldemort)\b/gi, enabled: false },
            { id: "he-who-must-not-be-named", pattern: /\b(He\s+Who\s+Must\s+Not\s+Be\s+Named)\b/gi, enabled: false },
            { id: "you-know-who", pattern: /\b(You\s+Know\s+Who)\b/gi, enabled: false },
            { id: "dark-lord", pattern: /\b(The\s+Dark\s+Lord)\b/gi, enabled: false },
            { id: "tom-riddle", pattern: /\b(Tom\s+Riddle)\b/gi, enabled: false },
            { id: "tom-marvolo-riddle", pattern: /\b(Tom\s+Marvolo\s+Riddle)\b/gi, enabled: false }
          ]
        };
        
        // Clear any cached data
        currentUrl = window.location.href;
        lastProcessedUrl = '';
        
        // Clear badge
        clearBadge();
        
        // Restore any modified text
        restoreOriginalText();
        
        sendResponse({ success: true });
        break;

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
          // Remove grayscale filter
          toggleGrayscaleFilter(true);
        } else {
          if (observer) {
            observer.disconnect();
            observer = null;
          }
          if (imageObserver) {
            imageObserver.disconnect();
            imageObserver = null;
          }
          clearBadge(); // Clear badge when disabling extension
          restoreOriginalText();
          // Apply grayscale filter
          toggleGrayscaleFilter(false);
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
            
            // Check for special cases - update all related patterns
            if (mention.id === "trump") {
              // When the main Trump toggle changes, update all Trump-related patterns
              config.mentionPatterns.forEach(pattern => {
                if (pattern.id.includes("trump") || pattern.id.includes("donald")) {
                  console.log(`Setting Trump pattern ${pattern.id} to ${mention.enabled}`);
                  pattern.enabled = mention.enabled;
                }
              });
            } else if (mention.id === "elon") {
              // When the main Elon toggle changes, update all Elon-related patterns
              config.mentionPatterns.forEach(pattern => {
                if (pattern.id.includes("elon") || pattern.id.includes("musk")) {
                  pattern.enabled = mention.enabled;
                }
              });
            } else if (mention.id === "voldemort") {
              // When the main Voldemort toggle changes, update all Voldemort-related patterns
              config.mentionPatterns.forEach(pattern => {
                if (pattern.id.includes("voldemort") || 
                    pattern.id.includes("he-who-must-not-be-named") || 
                    pattern.id.includes("you-know-who") || 
                    pattern.id.includes("dark-lord") || 
                    pattern.id.includes("tom-riddle")) {
                  console.log(`Setting Voldemort pattern ${pattern.id} to ${mention.enabled}`);
                  pattern.enabled = mention.enabled;
                }
              });

              // Save Voldemort options to localStorage
              const voldemortOptions = config.mentionPatterns
                .filter(pattern => 
                  pattern.id.includes("voldemort") || 
                  pattern.id.includes("he-who-must-not-be-named") || 
                  pattern.id.includes("you-know-who") || 
                  pattern.id.includes("dark-lord") || 
                  pattern.id.includes("tom-riddle"))
                .map(pattern => ({
                  id: pattern.id,
                  enabled: pattern.enabled
                }));
              localStorage.setItem("boring-blocker-voldemort-options", JSON.stringify(voldemortOptions));
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
        sendResponse({ 
          statistics: {
            ...statistics,
            currentPageBlocked: statistics.currentPageBlocked
          } 
        });
        break;

      case "updateCustomOptions":
        if (message.customOptions && Array.isArray(message.customOptions)) {
          console.log("[The Boring Blocker] Updating custom options:", message.customOptions);
          
          // Remove existing custom patterns
          config.mentionPatterns = config.mentionPatterns.filter(p => !p.id.startsWith('custom-'));
          
          // Add new custom patterns
          message.customOptions.forEach(option => {
            if (option.term && option.term.trim()) {
              // Escape special regex characters in the term
              const escapedTerm = option.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const pattern = {
                id: `custom-${option.id}`,
                pattern: new RegExp(`\\b(${escapedTerm})\\b`, 'gi'),
                enabled: option.enabled
              };
              console.log("[The Boring Blocker] Adding custom pattern:", pattern);
              config.mentionPatterns.push(pattern);
            }
          });
          
          // Save to localStorage
          localStorage.setItem("boring-blocker-custom-options", JSON.stringify(message.customOptions));
          
          if (config.enabled) {
            // Force a reload to apply the new custom patterns
            window.location.reload();
          }
        }
        break;
    }
  } catch (error) {
    console.error("[The Boring Blocker] Error processing message:", error);
    if (error.message && error.message.includes("Extension context invalidated")) {
      isExtensionContextValid = false;
    }
    sendResponse({ error: error.message });
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

// Apply or remove grayscale filter
function toggleGrayscaleFilter(enabled) {
  try {
    // Create and inject the CSS if it doesn't exist
    if (!document.getElementById('boring-blocker-styles')) {
      const style = document.createElement('style');
      style.id = 'boring-blocker-styles';
      style.textContent = `
        .boring-blocker-grayscale {
          filter: grayscale(100%) !important;
          -webkit-filter: grayscale(100%) !important;
          -moz-filter: grayscale(100%) !important;
          -ms-filter: grayscale(100%) !important;
          -o-filter: grayscale(100%) !important;
        }
        .boring-blocker-grayscale img {
          filter: grayscale(100%) brightness(0.8) !important;
          -webkit-filter: grayscale(100%) brightness(0.8) !important;
          -moz-filter: grayscale(100%) brightness(0.8) !important;
          -ms-filter: grayscale(100%) brightness(0.8) !important;
          -o-filter: grayscale(100%) brightness(0.8) !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Toggle the class on the body
    if (enabled) {
      document.body.classList.remove('boring-blocker-grayscale');
    } else {
      document.body.classList.add('boring-blocker-grayscale');
    }
  } catch (error) {
    console.error("[The Boring Blocker] Error toggling grayscale filter:", error);
  }
}
