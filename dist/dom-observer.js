
// DOM mutation observer

// Set up MutationObserver to monitor DOM changes
function setupObserver() {
  const observer = new MutationObserver(mutations => {
    if (!config.enabled) return;
    
    mutations.forEach(mutation => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const newNode = mutation.addedNodes[i];
          if (newNode.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is an image
            if (newNode.tagName === 'IMG') {
              setTimeout(() => processImages(), 10); // Slight delay to allow alt text to be set
            }
            
            const textNodes = [];
            const walker = document.createTreeWalker(
              newNode,
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
            
            textNodes.forEach(node => {
              processTextNode(node);
            });
          }
        }
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
}
