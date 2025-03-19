import { Ban } from "lucide-react";

interface ExtensionHeaderProps {
  isEnabled: boolean;
}

const ExtensionHeader = ({ isEnabled }: ExtensionHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <div className="mb-4 flex justify-center">
        <img 
          src="/icon-128.png" 
          alt="No Doge Logo" 
          className={`w-28 h-28 transition-all duration-300 ${!isEnabled ? 'grayscale opacity-60' : ''}`} 
        />
      </div>
      <h1 className={`text-3xl font-bold bg-gradient-to-r ${isEnabled ? 'from-indigo-600 to-purple-600' : 'from-gray-500 to-gray-700'} bg-clip-text text-transparent transition-all duration-300`}>
        The Boring Blocker
      </h1>
      <p className={`${isEnabled ? 'text-gray-600' : 'text-gray-400'} mt-2 transition-all duration-300`}>
        Browse the web without seeing <span className="line-through">you know who</span>
      </p>
    </div>
  );
};

export default ExtensionHeader;
