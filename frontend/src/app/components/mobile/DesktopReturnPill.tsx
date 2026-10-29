import React from 'react';
import { Smartphone } from 'lucide-react';

interface DesktopReturnPillProps {
  onReturnToMobile: () => void;
}

export const DesktopReturnPill: React.FC<DesktopReturnPillProps> = ({ onReturnToMobile }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={onReturnToMobile}
        className="px-4 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-zinc-700/80 hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
      >
        <Smartphone className="w-4 h-4 text-amber-400" />
        <span>Mobile View</span>
      </button>
    </div>
  );
};

export default DesktopReturnPill;
