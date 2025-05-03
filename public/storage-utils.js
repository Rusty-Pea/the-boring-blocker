
// Storage utilities for The Boring Blocker extension
// Uses localStorage instead of chrome.storage API to reduce permissions needed

const StorageUtils = {
  // Get a value from localStorage
  getItem: function(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`[The Boring Blocker] Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  
  // Set a value in localStorage
  setItem: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[The Boring Blocker] Error setting ${key} in localStorage:`, error);
      return false;
    }
  },
  
  // Remove an item from localStorage
  removeItem: function(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[The Boring Blocker] Error removing ${key} from localStorage:`, error);
      return false;
    }
  }
};

// Make the utilities available globally
window.BoringBlockerStorage = StorageUtils;
