import React from "react";
import { Card } from "@/components/ui/card";
import ExtensionHeader from "@/components/ExtensionHeader";
import ReplacementOptions from "@/components/ReplacementOptions";
import MentionsOptions from "@/components/MentionsOptions";
import StatisticsCard from "@/components/StatisticsCard";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const MainLayout: React.FC = () => {
  const {
    isEnabled,
    replacementText,
    setReplacementText,
    blockImages,
    statistics,
    mentions,
    handleToggleChange,
    handleSaveOptions,
    handleToggleMention,
    handleToggleBlockImages
  } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-lg mx-auto">
        <ExtensionHeader isEnabled={isEnabled} onToggleChange={handleToggleChange} />
        
        <Card 
          className={cn(
            "p-6 shadow-lg mb-6 bg-white/80 backdrop-blur-sm transition-all duration-300",
            !isEnabled && "opacity-75 grayscale-[50%]"
          )}
        >
          <ReplacementOptions
            replacementText={replacementText}
            setReplacementText={setReplacementText}
            onSave={handleSaveOptions}
          />
        </Card>
        
        <Card 
          className={cn(
            "p-6 shadow-lg mb-6 bg-white/80 backdrop-blur-sm transition-all duration-300",
            !isEnabled && "opacity-75 grayscale-[50%]"
          )}
        >
          <MentionsOptions 
            mentions={mentions}
            onToggleMention={handleToggleMention}
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

export default MainLayout;
