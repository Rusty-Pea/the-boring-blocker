
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ToggleSectionProps {
  isEnabled: boolean;
  onToggleChange: (checked: boolean) => void;
}

const ToggleSection: React.FC<ToggleSectionProps> = ({ isEnabled, onToggleChange }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex justify-center mb-12">
      {/* VisualToggleSwitch has been moved to ExtensionHeader */}
    </div>
  );
};

export default ToggleSection;
