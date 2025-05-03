
// Configuration and storage management
var config = {
  enabled: true,
  replacementText: "REDACTED",
  blockImages: true, // Changed default to true
  activeFilters: {
    elon: true,
    trump: false,
    custom: false // Add custom filter option
  },
  mentionPatterns: [
    // Elon Musk patterns
    { id: "elon-musk", pattern: /\b(Elon\s+Musk)\b/gi, enabled: true, type: "elon" },
    { id: "elon", pattern: /\b(Elon)\b/gi, enabled: true, type: "elon" },
    { id: "musk", pattern: /\b(Musk)\b/g, enabled: true, type: "elon" }, // Case sensitive
    { id: "elonmusk", pattern: /\b(@elonmusk)\b/gi, enabled: true, type: "elon" },
    
    // Donald Trump patterns
    { id: "donald-trump", pattern: /\b(Donald\s+Trump)\b/gi, enabled: false, type: "trump" },
    { id: "trump", pattern: /\b(Trump)\b/g, enabled: false, type: "trump" }, // Case sensitive
    { id: "donaldtrump", pattern: /\b(donaldtrump)\b/gi, enabled: false, type: "trump" },
    { id: "realdonaldtrump", pattern: /\b(@realDonaldTrump)\b/gi, enabled: false, type: "trump" }, // Now case insensitive
    { id: "donald-j-trump", pattern: /\b(Donald\s+J\.\s+Trump)\b/gi, enabled: false, type: "trump" }
    
    // Custom patterns will be added at runtime
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

  // Load main category filters
  const savedMentions = localStorage.getItem("boring-blocker-mentions");
  if (savedMentions !== null) {
    try {
      const mentions = JSON.parse(savedMentions);
      
      // Check if new format (with type field)
      if (mentions.length > 0 && 'type' in mentions[0]) {
        // Update active filters based on main categories
        mentions.forEach(mention => {
          if (mention.type && mention.type in config.activeFilters) {
            config.activeFilters[mention.type] = mention.enabled;
          }
        });
      } else {
        // Handle legacy format - just check if any Elon filters are enabled
        const hasEnabledElon = mentions.some(m => 
          (m.id.includes('elon') || m.id.includes('musk')) && m.enabled
        );
        config.activeFilters.elon = hasEnabledElon;
      }
    } catch (e) {
      console.error("[The Boring Blocker] Error loading mentions:", e);
    }
  }
  
  // Load detailed Elon options
  const savedElonOptions = localStorage.getItem("boring-blocker-elon-options");
  if (savedElonOptions !== null) {
    try {
      const elonOptions = JSON.parse(savedElonOptions);
      // Update pattern enablement for Elon-related patterns
      config.mentionPatterns.forEach(pattern => {
        if (pattern.type === "elon") {
          const savedOption = elonOptions.find(o => o.id === pattern.id);
          if (savedOption) {
            pattern.enabled = savedOption.enabled;
          }
        }
      });
    } catch (e) {
      console.error("[The Boring Blocker] Error loading Elon options:", e);
    }
  }
  
  // Load detailed Trump options
  const savedTrumpOptions = localStorage.getItem("boring-blocker-trump-options");
  if (savedTrumpOptions !== null) {
    try {
      const trumpOptions = JSON.parse(savedTrumpOptions);
      // Update pattern enablement for Trump-related patterns
      config.mentionPatterns.forEach(pattern => {
        if (pattern.type === "trump") {
          const savedOption = trumpOptions.find(o => o.id === pattern.id);
          if (savedOption) {
            pattern.enabled = savedOption.enabled;
          }
        }
      });
    } catch (e) {
      console.error("[The Boring Blocker] Error loading Trump options:", e);
    }
  }
  
  // Load custom filter options and terms
  const savedCustomOptions = localStorage.getItem("boring-blocker-custom-options");
  if (savedCustomOptions !== null) {
    try {
      const customOptions = JSON.parse(savedCustomOptions);
      
      // Find and remove existing custom patterns to avoid duplicates
      config.mentionPatterns = config.mentionPatterns.filter(pattern => pattern.type !== "custom");
      
      // Add custom patterns back to the configuration
      customOptions.forEach(option => {
        if (option.term && option.term.trim()) {
          const pattern = new RegExp(`\\b(${option.term})\\b`, 'gi');
          config.mentionPatterns.push({
            id: `custom-${option.id}`,
            pattern: pattern,
            enabled: option.enabled,
            type: "custom",
            term: option.term
          });
        }
      });
    } catch (e) {
      console.error("[The Boring Blocker] Error loading custom options:", e);
    }
  }

  const savedBlockImages = localStorage.getItem("boring-blocker-block-images");
  if (savedBlockImages !== null) {
    config.blockImages = JSON.parse(savedBlockImages);
  } else {
    // If not set in localStorage, ensure it's explicitly true and save it
    config.blockImages = true;
    localStorage.setItem("boring-blocker-block-images", JSON.stringify(true));
  }
  
  // Apply active filters
  config.mentionPatterns.forEach(pattern => {
    if (pattern.type && pattern.type in config.activeFilters) {
      // Only enable the pattern if both the specific pattern AND its category are enabled
      pattern.enabled = pattern.enabled && config.activeFilters[pattern.type];
    }
  });
}
