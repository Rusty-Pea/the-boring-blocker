// Content processing logic
import { config, statistics } from './content-script-config.js';

// Process text nodes
function processTextNode(node) {
  if (!config.enabled) return false;

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

// Check if image should be blocked based on alt text
function shouldBlockImage(altText) {
  if (!config.enabled || !config.blockImages || !altText) return false;
  
  for (const mentionPattern of config.mentionPatterns) {
    if (mentionPattern.enabled && mentionPattern.pattern.test(altText)) {
      return true;
    }
  }
  
  return false;
}

// Process images
function processImages() {
  if (!config.enabled || !config.blockImages) return;
  
  const images = document.querySelectorAll('img');
  let blockedImages = 0;
  
  images.forEach(img => {
    const altText = img.alt || '';
    const title = img.title || '';
    
    if (shouldBlockImage(altText) || shouldBlockImage(title)) {
      // Store original src and dimensions
      if (!img.dataset.originalSrc) {
        img.dataset.originalSrc = img.src;
        img.dataset.originalWidth = img.width;
        img.dataset.originalHeight = img.height;
      }
      
      // Replace with doge logo - using properly accessible URL
      img.src = chrome.runtime.getURL('no-doge.svg');
      
      // Keep original width and height if available
      if (img.dataset.originalWidth && img.dataset.originalHeight) {
        img.width = parseInt(img.dataset.originalWidth);
        img.height = parseInt(img.dataset.originalHeight);
      }
      
      img.style.objectFit = 'contain';
      img.alt = 'Blocked content';
      img.title = 'Blocked content';
      
      blockedImages++;
      statistics.totalReplaced++;
    } else if (img.dataset.originalSrc && config.enabled) {
      // Keep the image blocked if extension is enabled
    } else if (img.dataset.originalSrc) {
      // Restore original image if extension is disabled
      img.src = img.dataset.originalSrc;
      img.alt = '';
      img.title = '';
    }
  });
  
  if (blockedImages > 0) {
    console.log(`[The Boring Blocker] Blocked ${blockedImages} images`);
  }
}

// Restore all replaced content when disabled
function restoreOriginalContent() {
  // Reload the page to restore original text and images
  window.location.reload();
}

// Walk through DOM and process text nodes
function processDOM() {
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue.trim() !== '') {
      textNodes.push(node);
    }
  }
  
  let replacedNodes = 0;
  textNodes.forEach(node => {
    if (processTextNode(node)) {
      replacedNodes++;
    }
  });
  
  if (replacedNodes > 0) {
    console.log(`[The Boring Blocker] Replaced ${replacedNodes} text nodes`);
  }
  
  // Process images after text nodes
  processImages();
  
  if (replacedNodes > 0 || textNodes.length > 0) {
    statistics.pagesProcessed++;
  }
}

export { processTextNode, processImages, restoreOriginalContent, processDOM };
