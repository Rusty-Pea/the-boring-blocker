import { createContext, useState, useContext, useEffect, ReactNode } from "react";

interface Statistics {
  totalReplaced: number;
  pagesProcessed: number;
}

interface Mention {
  id: string;
  name: string;
  enabled: boolean;
  type: string;
}

interface PersonOption {
  id: string;
  name: string;
  enabled: boolean;
}

interface CustomOption {
  id: string;
  term: string;
  enabled: boolean;
}

interface AppContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  replacementText: string;
  setReplacementText: (text: string) => void;
  blockImages: boolean;
  setBlockImages: (block: boolean) => void;
  statistics: Statistics;
  setStatistics: (stats: Statistics) => void;
  mentions: Mention[];
  setMentions: (mentions: Mention[]) => void;
  elonOptions: PersonOption[];
  setElonOptions: (options: PersonOption[]) => void;
  trumpOptions: PersonOption[];
  setTrumpOptions: (options: PersonOption[]) => void;
  customOptions: CustomOption[];
  setCustomOptions: (options: CustomOption[]) => void;
  handleToggleChange: (checked: boolean) => void;
  handleSaveOptions: () => void;
  handleToggleMention: (id: string, enabled: boolean) => void;
  handleToggleBlockImages: (enabled: boolean) => void;
  handleTogglePersonOption: (personType: string, id: string, enabled: boolean) => void;
  handleAddCustomTerm: (term: string) => void;
  handleRemoveCustomTerm: (id: string) => void;
  handleToggleCustomOption: (id: string, enabled: boolean) => void;
  handleDeleteHistory: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [replacementText, setReplacementText] = useState("[that guy]");
  const [blockImages, setBlockImages] = useState(true);
  const [statistics, setStatistics] = useState({ totalReplaced: 0, pagesProcessed: 0 });
  const [mentions, setMentions] = useState([
    { id: "elon", name: "Elon Musk", enabled: true, type: "elon" },
    { id: "trump", name: "Donald Trump", enabled: false, type: "trump" },
    { id: "voldemort", name: "Voldemort", enabled: false, type: "voldemort" },
    { id: "custom", name: "Choose your own", enabled: false, type: "custom" }
  ]);
  
  const [elonOptions, setElonOptions] = useState([
    { id: "elon-musk", name: "Elon Musk", enabled: true },
    { id: "elon", name: "Elon", enabled: true },
    { id: "musk", name: "Musk", enabled: true },
    { id: "elonmusk", name: "@elonmusk", enabled: true }
  ]);
  
  const [trumpOptions, setTrumpOptions] = useState([
    { id: "donald-trump", name: "Donald Trump", enabled: true },
    { id: "trump", name: "Trump", enabled: true },
    { id: "donaldtrump", name: "donaldtrump", enabled: true },
    { id: "realdonaldtrump", name: "@realDonaldTrump", enabled: true },
    { id: "donald-j-trump", name: "Donald J. Trump", enabled: true }
  ]);
  
  const [voldemortOptions, setVoldemortOptions] = useState([
    { id: "voldemort", name: "Voldemort", enabled: true },
    { id: "he-who-must-not-be-named", name: "He Who Must Not Be Named", enabled: true },
    { id: "you-know-who", name: "You Know Who", enabled: true },
    { id: "dark-lord", name: "The Dark Lord", enabled: true },
    { id: "tom-riddle", name: "Tom Riddle", enabled: true },
    { id: "tom-marvolo-riddle", name: "Tom Marvolo Riddle", enabled: true }
  ]);
  
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([]);

  const sendMessageToActiveTab = (message: any) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          try {
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
              if (chrome.runtime.lastError) {
                console.log("Connection error:", chrome.runtime.lastError.message);
              }
            });
          } catch (error) {
            console.error("Error sending message:", error);
          }
        }
      });
    }
  };

  const { toast } = useContext(ToastContext) || { toast: () => {} };

  const handleToggleChange = (checked: boolean) => {
    setIsEnabled(checked);
    localStorage.setItem("boring-blocker-enabled", JSON.stringify(checked));
    
    sendMessageToActiveTab({ 
      action: "toggleExtension", 
      enabled: checked 
    });
    
    toast({
      title: checked ? "The Boring Blocker Enabled" : "The Boring Blocker Disabled",
      duration: 3000,
    });
  };

  const handleSaveOptions = () => {
    localStorage.setItem("boring-blocker-replacement", replacementText);
    
    sendMessageToActiveTab({ 
      action: "updateOptions", 
      replacementText 
    });
    
    toast({
      title: "Options Saved",
      description: `Replacement text updated to "${replacementText}"`,
      duration: 3000,
    });
  };

  const handleToggleMention = (id: string, enabled: boolean) => {
    const updatedMentions = mentions.map(mention => 
      mention.id === id ? { ...mention, enabled } : mention
    );
    
    setMentions(updatedMentions);
    localStorage.setItem("boring-blocker-mentions", JSON.stringify(updatedMentions));
    
    // Send both main categories and detailed options to content script
    sendMessageToActiveTab({ 
      action: "updateMentions", 
      mentions: updatedMentions,
      elonOptions,
      trumpOptions,
      customOptions
    });
    
    setTimeout(() => {
      sendMessageToActiveTab({
        action: "reloadPage"
      });
    }, 100);
    
    toast({
      title: "Mentions Updated",
      description: `Block settings for "${updatedMentions.find(m => m.id === id)?.name}" updated`,
      duration: 3000,
    });
  };
  
  const handleTogglePersonOption = (personType: string, id: string, enabled: boolean) => {
    if (personType === "elon") {
      const updatedOptions = elonOptions.map(option => 
        option.id === id ? { ...option, enabled } : option
      );
      setElonOptions(updatedOptions);
      localStorage.setItem("boring-blocker-elon-options", JSON.stringify(updatedOptions));
    } else if (personType === "trump") {
      const updatedOptions = trumpOptions.map(option => 
        option.id === id ? { ...option, enabled } : option
      );
      setTrumpOptions(updatedOptions);
      localStorage.setItem("boring-blocker-trump-options", JSON.stringify(updatedOptions));
    } else if (personType === "voldemort") {
      const updatedOptions = voldemortOptions.map(option => 
        option.id === id ? { ...option, enabled } : option
      );
      setVoldemortOptions(updatedOptions);
      localStorage.setItem("boring-blocker-voldemort-options", JSON.stringify(updatedOptions));
    }
    
    // Send both main categories and detailed options to content script
    sendMessageToActiveTab({ 
      action: "updateOptions", 
      mentions,
      elonOptions: personType === "elon" ? 
        elonOptions.map(option => option.id === id ? { ...option, enabled } : option) : 
        elonOptions,
      trumpOptions: personType === "trump" ? 
        trumpOptions.map(option => option.id === id ? { ...option, enabled } : option) : 
        trumpOptions,
      voldemortOptions: personType === "voldemort" ? 
        voldemortOptions.map(option => option.id === id ? { ...option, enabled } : option) : 
        voldemortOptions,
      customOptions
    });
    
    setTimeout(() => {
      sendMessageToActiveTab({
        action: "reloadPage"
      });
    }, 100);
    
    toast({
      title: "Block Options Updated",
      duration: 3000,
    });
  };
  
  const handleToggleCustomOption = (id: string, enabled: boolean) => {
    const updatedOptions = customOptions.map(option => 
      option.id === id ? { ...option, enabled } : option
    );
    setCustomOptions(updatedOptions);
    localStorage.setItem("boring-blocker-custom-options", JSON.stringify(updatedOptions));
    
    // Send updated options to content script
    sendMessageToActiveTab({ 
      action: "updateCustomOptions", 
      customOptions: updatedOptions
    });
    
    setTimeout(() => {
      sendMessageToActiveTab({
        action: "reloadPage"
      });
    }, 100);
    
    toast({
      title: "Custom Block Updated",
      duration: 3000,
    });
  };
  
  const handleAddCustomTerm = (term: string) => {
    if (!term.trim()) return;
    
    // Create unique ID for the new term
    const id = `term-${Date.now()}`;
    const newOption = { id, term: term.trim(), enabled: true };
    
    const updatedOptions = [...customOptions, newOption];
    setCustomOptions(updatedOptions);
    localStorage.setItem("boring-blocker-custom-options", JSON.stringify(updatedOptions));
    
    // If custom filters weren't enabled before, enable them
    if (!mentions.find(m => m.id === "custom")?.enabled) {
      const updatedMentions = mentions.map(mention => 
        mention.id === "custom" ? { ...mention, enabled: true } : mention
      );
      setMentions(updatedMentions);
      localStorage.setItem("boring-blocker-mentions", JSON.stringify(updatedMentions));
    }
    
    // Send updated options to content script
    sendMessageToActiveTab({ 
      action: "updateCustomOptions", 
      customOptions: updatedOptions,
      mentions: mentions.map(mention => 
        mention.id === "custom" ? { ...mention, enabled: true } : mention
      )
    });
    
    setTimeout(() => {
      sendMessageToActiveTab({
        action: "reloadPage"
      });
    }, 100);
    
    toast({
      title: "Custom Block Added",
      description: `New block for "${term}" added`,
      duration: 3000,
    });
  };
  
  const handleRemoveCustomTerm = (id: string) => {
    const updatedOptions = customOptions.filter(option => option.id !== id);
    setCustomOptions(updatedOptions);
    localStorage.setItem("boring-blocker-custom-options", JSON.stringify(updatedOptions));
    
    // Send updated options to content script
    sendMessageToActiveTab({ 
      action: "updateCustomOptions", 
      customOptions: updatedOptions
    });
    
    setTimeout(() => {
      sendMessageToActiveTab({
        action: "reloadPage"
      });
    }, 100);
    
    toast({
      title: "Custom Block Removed",
      duration: 3000,
    });
  };

  const handleToggleBlockImages = (enabled: boolean) => {
    setBlockImages(enabled);
    localStorage.setItem("boring-blocker-block-images", JSON.stringify(enabled));
    
    sendMessageToActiveTab({ 
      action: "toggleBlockImages", 
      blockImages: enabled 
    });
    
    toast({
      title: "Image blocking " + (enabled ? "Enabled" : "Disabled"),
      duration: 3000,
    });
    
    sendMessageToActiveTab({
      action: "reloadPage"
    });
  };

  const handleDeleteHistory = () => {
    // Clear all localStorage items
    localStorage.removeItem("boring-blocker-enabled");
    localStorage.removeItem("boring-blocker-replacement");
    localStorage.removeItem("boring-blocker-block-images");
    localStorage.removeItem("boring-blocker-mentions");
    localStorage.removeItem("boring-blocker-elon-options");
    localStorage.removeItem("boring-blocker-trump-options");
    localStorage.removeItem("boring-blocker-custom-options");
    localStorage.removeItem("boring-blocker-statistics");
    
    // Clear all cookies that might be set by the extension
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      chrome.cookies.getAll({ domain: chrome.runtime.id }, (cookies) => {
        cookies.forEach(cookie => {
          chrome.cookies.remove({
            url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
            name: cookie.name
          });
        });
      });
    }
    
    // Clear extension storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.clear();
      chrome.storage.sync.clear();
    }
    
    // Reset statistics
    setStatistics({ totalReplaced: 0, pagesProcessed: 0 });
    
    // Reset state to defaults
    setIsEnabled(true);
    setReplacementText("[that guy]");
    setBlockImages(true);
    setMentions([
      { id: "elon", name: "Elon Musk", enabled: true, type: "elon" },
      { id: "trump", name: "Donald Trump", enabled: false, type: "trump" },
      { id: "voldemort", name: "Voldemort", enabled: false, type: "voldemort" },
      { id: "custom", name: "Custom Terms", enabled: false, type: "custom" }
    ]);
    setElonOptions([
      { id: "elon-musk", name: "Elon Musk", enabled: true },
      { id: "elon", name: "Elon", enabled: true },
      { id: "musk", name: "Musk", enabled: true },
      { id: "elonmusk", name: "@elonmusk", enabled: true }
    ]);
    setTrumpOptions([
      { id: "donald-trump", name: "Donald Trump", enabled: false },
      { id: "trump", name: "Trump", enabled: false },
      { id: "donaldtrump", name: "donaldtrump", enabled: false },
      { id: "realdonaldtrump", name: "@realDonaldTrump", enabled: false },
      { id: "donald-j-trump", name: "Donald J. Trump", enabled: false }
    ]);
    setVoldemortOptions([
      { id: "voldemort", name: "Voldemort", enabled: true },
      { id: "he-who-must-not-be-named", name: "He Who Must Not Be Named", enabled: true },
      { id: "you-know-who", name: "You Know Who", enabled: true },
      { id: "dark-lord", name: "The Dark Lord", enabled: true },
      { id: "tom-riddle", name: "Tom Riddle", enabled: true },
      { id: "tom-marvolo-riddle", name: "Tom Marvolo Riddle", enabled: true }
    ]);
    setCustomOptions([]);
    
    // Send message to content script to reload and clear its state
    sendMessageToActiveTab({
      action: "clearAllData"
    });
    
    setTimeout(() => {
      sendMessageToActiveTab({
        action: "reloadPage"
      });
    }, 100);
    
    toast({
      title: "All Data Deleted",
      description: "All extension data has been cleared and settings reset to defaults",
      duration: 3000,
    });
  };

  useEffect(() => {
    const savedEnabled = localStorage.getItem("boring-blocker-enabled");
    if (savedEnabled !== null) {
      setIsEnabled(JSON.parse(savedEnabled));
    }
    
    const savedReplacement = localStorage.getItem("boring-blocker-replacement");
    if (savedReplacement !== null) {
      setReplacementText(savedReplacement);
    }
    
    const savedBlockImages = localStorage.getItem("boring-blocker-block-images");
    if (savedBlockImages !== null) {
      setBlockImages(JSON.parse(savedBlockImages));
    }
    
    // Load main category options
    const savedMentions = localStorage.getItem("boring-blocker-mentions");
    if (savedMentions !== null) {
      try {
        const parsedMentions = JSON.parse(savedMentions);
        // Check if new format (with type) or old format
        if (parsedMentions.length > 0 && 'type' in parsedMentions[0]) {
          // If we don't have the custom option yet, add it
          if (!parsedMentions.some(m => m.id === "custom")) {
            parsedMentions.push({ id: "custom", name: "Choose your own", enabled: false, type: "custom" });
          }
          setMentions(parsedMentions);
        } else {
          // Migrate old format to new format
          const hasElon = parsedMentions.some(m => 
            m.id.includes('elon') || m.id.includes('musk')
          );
          
          const newMentions = [
            { id: "elon", name: "Elon Musk", enabled: hasElon, type: "elon" },
            { id: "trump", name: "Donald Trump", enabled: false, type: "trump" },
            { id: "voldemort", name: "Voldemort", enabled: false, type: "voldemort" },
            { id: "custom", name: "Choose your own", enabled: false, type: "custom" }
          ];
          
          setMentions(newMentions);
          localStorage.setItem("boring-blocker-mentions", JSON.stringify(newMentions));
        }
      } catch (e) {
        console.error("Error parsing saved mentions:", e);
      }
    }
    
    // Load Elon detailed options
    const savedElonOptions = localStorage.getItem("boring-blocker-elon-options");
    if (savedElonOptions !== null) {
      try {
        setElonOptions(JSON.parse(savedElonOptions));
      } catch (e) {
        console.error("Error parsing saved Elon options:", e);
      }
    } else {
      // If no saved options, use the old mentions as initial options
      const savedMentions = localStorage.getItem("boring-blocker-mentions");
      if (savedMentions !== null) {
        try {
          const parsedMentions = JSON.parse(savedMentions);
          // Filter Elon-related options from old format
          const elonRelated = parsedMentions.filter(m => 
            m.id === "elon-musk" || m.id === "elon" || m.id === "musk" || m.id === "elonmusk"
          );
          
          if (elonRelated.length > 0) {
            setElonOptions(elonRelated);
            localStorage.setItem("boring-blocker-elon-options", JSON.stringify(elonRelated));
          }
        } catch (e) {
          console.error("Error migrating Elon options:", e);
        }
      }
    }
    
    // Load Trump detailed options
    const savedTrumpOptions = localStorage.getItem("boring-blocker-trump-options");
    if (savedTrumpOptions !== null) {
      try {
        setTrumpOptions(JSON.parse(savedTrumpOptions));
      } catch (e) {
        console.error("Error parsing saved Trump options:", e);
      }
    }
    
    // Load Voldemort detailed options
    const savedVoldemortOptions = localStorage.getItem("boring-blocker-voldemort-options");
    if (savedVoldemortOptions !== null) {
      try {
        setVoldemortOptions(JSON.parse(savedVoldemortOptions));
      } catch (e) {
        console.error("Error parsing saved Voldemort options:", e);
      }
    }
    
    // Load Custom Terms
    const savedCustomOptions = localStorage.getItem("boring-blocker-custom-options");
    if (savedCustomOptions !== null) {
      try {
        setCustomOptions(JSON.parse(savedCustomOptions));
      } catch (e) {
        console.error("Error parsing saved custom options:", e);
      }
    }
    
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          try {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: "getStatistics" 
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log("Could not fetch statistics:", chrome.runtime.lastError.message);
                return;
              }
              
              if (response && response.statistics) {
                setStatistics(response.statistics);
              }
            });
          } catch (error) {
            console.error("Error fetching statistics:", error);
          }
        }
      });
    }
  }, []);

  const value = {
    isEnabled,
    setIsEnabled,
    replacementText,
    setReplacementText,
    blockImages,
    setBlockImages,
    statistics,
    setStatistics,
    mentions,
    setMentions,
    elonOptions,
    setElonOptions,
    trumpOptions,
    setTrumpOptions,
    voldemortOptions,
    setVoldemortOptions,
    customOptions,
    setCustomOptions,
    handleToggleChange,
    handleSaveOptions,
    handleToggleMention,
    handleToggleBlockImages,
    handleTogglePersonOption,
    handleAddCustomTerm,
    handleRemoveCustomTerm,
    handleToggleCustomOption,
    handleDeleteHistory
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

// Create a separate context for toast to avoid circular dependency
interface ToastContextType {
  toast: (args: { title: string; description?: string; duration?: number }) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
