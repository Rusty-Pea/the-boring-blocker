import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ReplacementOptionsProps {
  replacementText: string;
  setReplacementText: (text: string) => void;
  onSave: () => void;
}

const ReplacementOptions = ({ 
  replacementText, 
  setReplacementText, 
  onSave 
}: ReplacementOptionsProps) => {
  
  // Handle suggestion click - set text, save and refresh
  const handleSuggestionClick = (suggestion: string) => {
    // Update UI state
    setReplacementText(suggestion);
    
    // Save to localStorage
    localStorage.setItem("boring-blocker-replacement", suggestion);
    
    // Send message to content script to update and reload
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          try {
            // Send updateOptions message
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: "updateOptions", 
              replacementText: suggestion 
            });
            
            // To ensure reload happens, explicitly send reload message after a short delay
            setTimeout(() => {
              chrome.tabs.sendMessage(tabs[0].id, { 
                action: "reloadPage"
              });
            }, 100);
          } catch (error) {
            console.error("Error sending message:", error);
          }
        }
      });
    }
  };
  
  // Handle manual save button click - save entered text and reload
  const handleManualSave = () => {
    // Call the parent's onSave handler
    onSave();
    
    // Also directly send reload message to ensure page refreshes
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          try {
            setTimeout(() => {
              chrome.tabs.sendMessage(tabs[0].id, { 
                action: "reloadPage"
              });
            }, 100);
          } catch (error) {
            console.error("Error sending reload message:", error);
          }
        }
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label htmlFor="replacement" className="text-sm font-medium text-gray-700 block mb-1">
            Replacement Text
          </label>
          <div className="flex gap-2">
            <Input
              id="replacement"
              value={replacementText}
              onChange={(e) => setReplacementText(e.target.value)}
              placeholder="[that guy]"
              className="flex-1"
            />
            <Button onClick={handleManualSave} variant="outline" className="bg-indigo-50 hover:bg-indigo-100 border-indigo-200">
              Save
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 pt-1">
          {["[that guy]", "[REDACTED]", "Someone"].map((suggestion) => (
            <Button 
              key={suggestion}
              variant="outline" 
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReplacementOptions;
