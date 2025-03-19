
// Configuration and storage management
var config = {
  enabled: true,
  replacementText: "REDACTED",
  blockImages: false,
  mentionPatterns: [
    { id: "elon-musk", pattern: /\b(Elon\s+Musk)\b/gi, enabled: true },
    { id: "elon", pattern: /\b(Elon)\b/gi, enabled: true },
    { id: "musk", pattern: /\b(Musk)\b/gi, enabled: true }
  ]
};

// Statistics
var statistics = {
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

  const savedMentions = localStorage.getItem("boring-blocker-mentions");
  if (savedMentions !== null) {
    try {
      const mentions = JSON.parse(savedMentions);
      // Filter out "e-musk" entries if they exist
      const filteredMentions = mentions.filter(mention => mention.id !== "e-musk");
      
      // Update localStorage if we filtered anything out
      if (mentions.length !== filteredMentions.length) {
        localStorage.setItem("boring-blocker-mentions", JSON.stringify(filteredMentions));
      }
      
      config.mentionPatterns.forEach(mention => {
        const savedMention = filteredMentions.find(m => m.id === mention.id);
        if (savedMention) {
          mention.enabled = savedMention.enabled;
        }
      });
    } catch (e) {
      console.error("[The Boring Blocker] Error loading mentions:", e);
    }
  }

  const savedBlockImages = localStorage.getItem("boring-blocker-block-images");
  if (savedBlockImages !== null) {
    config.blockImages = JSON.parse(savedBlockImages);
  }
}
