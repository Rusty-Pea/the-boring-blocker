
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MentionsOptionsProps {
  mentions: { id: string; name: string; enabled: boolean; type: string }[];
  onToggleMention: (id: string, enabled: boolean) => void;
}

const MentionsOptions = ({ mentions, onToggleMention }: MentionsOptionsProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">People to block</h3>
          <Button 
            variant="outline" 
            onClick={() => navigate("/settings")}
            className="text-sm"
          >
            Settings
          </Button>
        </div>
        
        <div className="space-y-3">
          {mentions.map((mention) => (
            <div key={mention.id} className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
              <Checkbox 
                id={`mention-${mention.id}`} 
                checked={mention.enabled}
                onCheckedChange={(checked) => onToggleMention(mention.id, checked as boolean)}
                className="data-[state=checked]:bg-indigo-600"
              />
              <Label 
                htmlFor={`mention-${mention.id}`}
                className="text-sm font-medium cursor-pointer flex-1"
              >
                {mention.name}
              </Label>
              {mention.enabled && (
                <span className="text-indigo-600">
                  <Check size={16} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentionsOptions;
