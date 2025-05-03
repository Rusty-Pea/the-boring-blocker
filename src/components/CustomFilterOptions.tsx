
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface CustomFilterOptionsProps {
  customOptions: { id: string; term: string; enabled: boolean }[];
  blockImages: boolean;
  onAddTerm: (term: string) => void;
  onRemoveTerm: (id: string) => void;
  onToggleOption: (id: string, enabled: boolean) => void;
  onToggleBlockImages: (enabled: boolean) => void;
}

const CustomFilterOptions: React.FC<CustomFilterOptionsProps> = ({
  customOptions,
  blockImages,
  onAddTerm,
  onRemoveTerm,
  onToggleOption,
  onToggleBlockImages
}) => {
  const [newTerm, setNewTerm] = useState("");

  const handleAddTerm = () => {
    if (newTerm.trim()) {
      onAddTerm(newTerm);
      setNewTerm("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTerm();
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Add your own terms to block</h3>
        <div className="flex space-x-2 mb-4">
          <Input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a term to block"
            className="flex-1"
          />
          <Button onClick={handleAddTerm} type="button">Add</Button>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-sm font-medium mb-3">Current custom choices</h3>
        {customOptions.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No custom terms added yet.</p>
        ) : (
          <div className="space-y-3">
            {customOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`custom-option-${option.id}`} 
                    checked={option.enabled}
                    onCheckedChange={(checked) => onToggleOption(option.id, checked as boolean)}
                  />
                  <Label 
                    htmlFor={`custom-option-${option.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {option.term}
                  </Label>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemoveTerm(option.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-sm font-medium mb-3">Image blocking</h3>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="block-custom-images" 
            checked={blockImages}
            onCheckedChange={(checked) => onToggleBlockImages(checked as boolean)}
          />
          <Label 
            htmlFor="block-custom-images"
            className="text-sm font-medium cursor-pointer"
          >
            Block images with the above terms in the description
          </Label>
        </div>
      </div>
    </div>
  );
};

export default CustomFilterOptions;
