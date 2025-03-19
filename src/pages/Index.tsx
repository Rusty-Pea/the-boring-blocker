import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import ExtensionHeader from "@/components/ExtensionHeader";
import ReplacementOptions from "@/components/ReplacementOptions";
import StatisticsCard from "@/components/StatisticsCard";
import MentionsOptions from "@/components/MentionsOptions";

const Index = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [replacementText, setReplacementText] = useState("[that guy]");
  const [blockImages, setBlockImages] = useState(false);
  const [statistics, setStatistics] = useState({ totalReplaced: 0, pagesProcessed: 0 });
  const [mentions, setMentions] = useState([
    { id: "elon-musk", name: "Elon Musk", enabled: true },
    { id: "elon", name: "Elon", enabled: true },
    { id: "musk", name: "Musk", enabled: true }
  ]);
  const { toast } = useToast();

  const sendMessageToActiveTab = (message) => {
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
    
    sendMessageToActiveTab({ 
      action: "updateMentions", 
      mentions: updatedMentions 
    });
    
    // Send an explicit reload message to ensure the page refreshes
    setTimeout(() => {
      sendMessageToActiveTab({
        action: "reloadPage"
      });
    }, 100);
    
    toast({
      title: "Mentions Updated",
      description: `Filter settings for "${updatedMentions.find(m => m.id === id)?.name}" updated`,
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
      title: "Image Blocking " + (enabled ? "Enabled" : "Disabled"),
      duration: 3000,
    });
    
    // Force a reload to apply the new image blocking setting
    sendMessageToActiveTab({
      action: "reloadPage"
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
    
    const savedMentions = localStorage.getItem("boring-blocker-mentions");
    if (savedMentions !== null) {
      try {
        const parsedMentions = JSON.parse(savedMentions);
        // Filter out "e-musk" entries if they exist
        const filteredMentions = parsedMentions.filter(mention => mention.id !== "e-musk");
        setMentions(filteredMentions);
      } catch (e) {
        console.error("Error parsing saved mentions:", e);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-lg mx-auto">
        <ExtensionHeader isEnabled={isEnabled} />
        
        <Card className="p-6 shadow-lg mb-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium">Blocker On/Off</h3>
            </div>
            <Switch 
              checked={isEnabled} 
              onCheckedChange={handleToggleChange} 
              className={isEnabled ? "bg-indigo-600" : ""}
            />
          </div>
          
          <ReplacementOptions
            replacementText={replacementText}
            setReplacementText={setReplacementText}
            onSave={handleSaveOptions}
          />
        </Card>
        
        <Card className="p-6 shadow-lg mb-6 bg-white/80 backdrop-blur-sm">
          <MentionsOptions 
            mentions={mentions}
            onToggleMention={handleToggleMention}
            blockImages={blockImages}
            onToggleBlockImages={handleToggleBlockImages}
          />
        </Card>
        
        <StatisticsCard statistics={statistics} />
        
        <div className="text-center mt-2 text-sm text-gray-500">
          <p>Free your browsing experience!</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
