import { Ban } from "lucide-react";
import VisualToggleSwitch from "@/components/VisualToggleSwitch";

interface ExtensionHeaderProps {
  isEnabled: boolean;
  onToggleChange?: (checked: boolean) => void;
}

const ExtensionHeader = ({ isEnabled, onToggleChange }: ExtensionHeaderProps) => {
  const handleToggleChange = (checked: boolean) => {
    if (onToggleChange) {
      onToggleChange(checked);
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 gap-2.5">
        {/* Left side - Text content (50% width) */}
        <div className="w-1/2 text-left">
          <h1 className={`text-2xl font-bold bg-gradient-to-r ${isEnabled ? 'from-indigo-600 to-purple-600' : 'from-gray-500 to-gray-700'} bg-clip-text text-transparent transition-all duration-300`}>
            The Boring Blocker
          </h1>
          <p className={`${isEnabled ? 'text-gray-600' : 'text-gray-400'} mt-1 text-sm transition-all duration-300`}>
            Browse the web without seeing <span className="line-through">you know who</span>
          </p>
        </div>
        
        {/* Right side - Toggle switch (50% width) */}
        {onToggleChange && (
          <div className="w-1/2 flex justify-end">
            <VisualToggleSwitch
              checked={isEnabled}
              onCheckedChange={handleToggleChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionHeader;
