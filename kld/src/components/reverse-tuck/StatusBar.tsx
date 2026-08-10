import React from 'react';
import { Ruler, Maximize } from 'lucide-react';

interface StatusBarProps {
  geom: any;
  L: number;
  W: number;
  H: number;
  unit: 'mm' | 'in';
}

export const StatusBar: React.FC<StatusBarProps> = ({
  geom,
  L,
  W,
  H,
  unit,
}) => {
  const flatW = geom ? geom.flatW : 0;
  const flatH = geom ? geom.flatH : 0;

  return (
    <div className="h-9 bg-white border-t border-zinc-200 px-5 flex items-center justify-between text-[11px] font-medium text-zinc-500 select-none">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-zinc-600">
          <Ruler className="w-3.5 h-3.5" />
          Flat Size: <strong className="text-zinc-900 font-bold">{flatW.toFixed(1)} × {flatH.toFixed(1)} {unit}</strong>
        </span>
        <span className="text-zinc-300">|</span>
        <span>Bleed: 3.0 mm</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          Scale: <strong className="text-zinc-800">1:1 (Auto-fit)</strong>
        </span>
        <span className="text-zinc-300">|</span>
        <button className="flex items-center gap-1 hover:text-zinc-900 transition-colors">
          <Maximize className="w-3.5 h-3.5" />
          Reset View
        </button>
      </div>
    </div>
  );
};
