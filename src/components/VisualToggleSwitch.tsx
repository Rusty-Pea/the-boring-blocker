import React from "react";
import { cn } from "@/lib/utils";

interface VisualToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const VisualToggleSwitch = ({
  checked,
  onCheckedChange,
  className,
}: VisualToggleSwitchProps) => {
  return (
    <div className={cn("relative flex items-center cursor-pointer group", className)} onClick={() => onCheckedChange(!checked)}>
      {/* Labels positioned to the left of the toggle */}
      <div className="absolute left-[-52px] flex flex-col space-y-11 text-xs font-medium">
        <span className={cn("transition-colors", checked ? "text-indigo-600 font-bold" : "text-gray-500")}>ON</span>
        <span className={cn("transition-colors", !checked ? "text-indigo-600 font-bold" : "text-gray-500")}>OFF</span>
      </div>
      
      <div className="flex items-center">
        {/* Hand image - smaller and positioned to overlap with body */}
        <div className="mr-[-20px] mt-[-50px] z-10">
          <img 
            src="./images/hand.png" 
            alt="Hand" 
            className={cn(
              "h-auto w-[60px] object-contain transition-transform duration-300 origin-right",
              checked 
                ? "transform rotate-100" 
                : "transform -rotate-[70deg] translate-x-[-25px] translate-y-[15px]"
            )}
          />
        </div>
        
        {/* Body image */}
        <div className="relative">
          <img 
            src="./images/body.png" 
            alt="Body" 
            className="w-[70px] h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default VisualToggleSwitch;
