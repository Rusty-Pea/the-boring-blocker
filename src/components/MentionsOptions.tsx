import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MentionsOptionsProps {
  mentions: { id: string; name: string; enabled: boolean }[];
  onToggleMention: (id: string, enabled: boolean) => void;
  blockImages: boolean;
  onToggleBlockImages: (enabled: boolean) => void;
}

const MentionsOptions = ({ mentions, onToggleMention, blockImages, onToggleBlockImages }: MentionsOptionsProps) => {
  // Function to handle image blocking toggle with direct message to content script
  const handleToggleBlockImages = (checked: boolean) => {
    // Call the provided toggle handler
    onToggleBlockImages(checked);
    
    // Send message directly to content script to ensure reload
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          try {
            // First update the blocking setting
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: "toggleBlockImages", 
              blockImages: checked 
            });
            
            // Then explicitly trigger a reload
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
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-4">Mentions to Filter</h3>
        <div className="space-y-3">
          {mentions.map((mention) => (
            <div key={mention.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`mention-${mention.id}`} 
                checked={mention.enabled}
                onCheckedChange={(checked) => onToggleMention(mention.id, checked as boolean)}
              />
              <Label 
                htmlFor={`mention-${mention.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                {mention.name}
              </Label>
            </div>
          ))}
          
          <div className="flex items-center space-x-2 pt-2 mt-2 border-t border-gray-200">
            <Checkbox 
              id="block-images" 
              checked={blockImages}
              onCheckedChange={(checked) => handleToggleBlockImages(checked as boolean)}
            />
            <Label 
              htmlFor="block-images"
              className="text-sm font-medium cursor-pointer"
            >
              Block images of Elon
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentionsOptions;
