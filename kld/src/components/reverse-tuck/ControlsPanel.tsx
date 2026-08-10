import React from 'react';
import { Sliders, Box, HelpCircle } from 'lucide-react';

interface ControlsPanelProps {
  L: number;
  W: number;
  H: number;
  unit: 'mm' | 'in';
  thickness: number;
  material: string;
  sizeMode: 'mfg' | 'inner';
  tuck: number;
  glueTab: number;
  orientation: number;
  showCreaseLines: boolean;
  showDimensions: boolean;
  showPanelShading: boolean;
  onUpdateL: (val: number) => void;
  onUpdateW: (val: number) => void;
  onUpdateH: (val: number) => void;
  onToggleUnit: (unit: 'mm' | 'in') => void;
  onUpdateThickness: (val: number) => void;
  onUpdateMaterial: (val: string) => void;
  onUpdateSizeMode: (mode: 'mfg' | 'inner') => void;
  onUpdateTuck: (val: number) => void;
  onUpdateGlueTab: (val: number) => void;
  onUpdateOrientation: (val: number) => void;
  onToggleCreaseLines: () => void;
  onToggleDimensions: () => void;
  onTogglePanelShading: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  L,
  W,
  H,
  unit,
  thickness,
  material,
  sizeMode,
  tuck,
  glueTab,
  orientation,
  showCreaseLines,
  showDimensions,
  showPanelShading,
  onUpdateL,
  onUpdateW,
  onUpdateH,
  onToggleUnit,
  onUpdateThickness,
  onUpdateMaterial,
  onUpdateSizeMode,
  onUpdateTuck,
  onUpdateGlueTab,
  onUpdateOrientation,
  onToggleCreaseLines,
  onToggleDimensions,
  onTogglePanelShading,
}) => {
  const materials = [
    { id: 'white', name: 'White Paperboard', color: '#ffffff' },
    { id: 'white-heavy', name: '350g White Paperboard', color: '#f5f0e8' },
    { id: 'kraft', name: 'Kraft Brown', color: '#c4a265' },
    { id: 'matte-black', name: 'Matte Black', color: '#2c2c2c' },
    { id: 'gold', name: 'Gold Metallic', color: '#d4af37' },
  ];

  return (
    <div className="w-[320px] bg-white border-r border-zinc-200 flex flex-col h-full overflow-y-auto p-5 shrink-0 select-none">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
        <h2 className="text-[17px] font-bold text-zinc-950 flex items-center gap-2">
          <Box className="w-5 h-5 text-amber-500" />
          Reverse Tuck Box
        </h2>
        <div className="flex bg-zinc-100 rounded-lg p-0.5 text-xs font-semibold">
          <button
            onClick={() => onToggleUnit('mm')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              unit === 'mm' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
            }`}
          >
            mm
          </button>
          <button
            onClick={() => onToggleUnit('in')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              unit === 'in' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
            }`}
          >
            in
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Size Inputs */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Box Dimensions
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
                Length (L)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={L}
                  onChange={(e) => onUpdateL(Number(e.target.value))}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-zinc-800 animate-fade-in"
                />
                <span className="absolute right-2 top-2 text-[10px] text-zinc-400 font-bold">{unit}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
                Width (W)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={W}
                  onChange={(e) => onUpdateW(Number(e.target.value))}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-zinc-800"
                />
                <span className="absolute right-2 top-2 text-[10px] text-zinc-400 font-bold">{unit}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
              Height (H)
            </label>
            <div className="relative">
              <input
                type="number"
                value={H}
                onChange={(e) => onUpdateH(Number(e.target.value))}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-zinc-800"
              />
              <span className="absolute right-2.5 top-2.5 text-[10px] text-zinc-400 font-bold">{unit}</span>
            </div>
          </div>
        </div>

        {/* Advanced Parameters */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Advanced Parameters
          </span>
          <div>
            <div className="flex justify-between text-[11px] text-zinc-500 font-semibold mb-1">
              <span>Tuck Size</span>
              <span className="text-zinc-850 font-mono font-bold">{tuck} {unit}</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              value={tuck}
              onChange={(e) => onUpdateTuck(Number(e.target.value))}
              className="w-full h-1 bg-zinc-200 rounded-lg cursor-pointer accent-amber-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-zinc-500 font-semibold mb-1">
              <span>Glue Tab</span>
              <span className="text-zinc-850 font-mono font-bold">{glueTab} {unit}</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={glueTab}
              onChange={(e) => onUpdateGlueTab(Number(e.target.value))}
              className="w-full h-1 bg-zinc-200 rounded-lg cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Orientation */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Box Orientation</span>
          <div className="grid grid-cols-4 gap-1 bg-zinc-100 rounded-xl p-1 text-xs font-semibold">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => onUpdateOrientation(deg)}
                className={`py-1 rounded-lg text-center transition-all ${
                  orientation === deg
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            Choose Material
            <HelpCircle className="w-3.5 h-3.5 text-zinc-300" />
          </span>
          <div className="flex flex-col gap-1.5">
            {materials.map((m) => (
              <button
                key={m.id}
                onClick={() => onUpdateMaterial(m.id)}
                className={`w-full flex items-center gap-3 border px-3 py-2 rounded-xl text-left transition-all ${
                  material === m.id
                    ? 'border-amber-500 bg-amber-500/5 font-semibold text-zinc-950'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-md border border-zinc-300 shrink-0"
                  style={{ background: m.color }}
                />
                <span className="text-xs">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Thickness */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Thickness</span>
          <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden">
            <button
              onClick={() => onUpdateThickness(Math.max(0.1, thickness - 0.1))}
              className="px-4 py-2 hover:bg-zinc-50 text-lg font-bold border-r border-zinc-200 text-zinc-500"
            >
              −
            </button>
            <input
              type="number"
              value={thickness.toFixed(1)}
              readOnly
              className="w-full text-center text-sm font-semibold text-zinc-800 bg-transparent border-none outline-none"
            />
            <button
              onClick={() => onUpdateThickness(Math.min(5, thickness + 0.1))}
              className="px-4 py-2 hover:bg-zinc-50 text-lg font-bold border-l border-zinc-200 text-zinc-500"
            >
              +
            </button>
          </div>
        </div>

        {/* Size Mode */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            Size Mode
            <HelpCircle className="w-3.5 h-3.5 text-zinc-300" />
          </span>
          <div className="grid grid-cols-2 gap-2 bg-zinc-100 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => onUpdateSizeMode('mfg')}
              className={`py-2 rounded-lg text-center transition-all ${
                sizeMode === 'mfg'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Manufacture
            </button>
            <button
              onClick={() => onUpdateSizeMode('inner')}
              className={`py-2 rounded-lg text-center transition-all ${
                sizeMode === 'inner'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Inner Size
            </button>
          </div>
        </div>

        {/* Display Toggles */}
        <div className="flex flex-col gap-2.5 border-t border-zinc-100 pt-4 mt-2 mb-5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Display Settings</span>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Show Crease Lines', val: showCreaseLines, toggle: onToggleCreaseLines },
              { label: 'Show Dimension Guides', val: showDimensions, toggle: onToggleDimensions },
              { label: 'Show Panel Shading', val: showPanelShading, toggle: onTogglePanelShading },
            ].map((s, idx) => (
              <label key={idx} className="flex items-center justify-between cursor-pointer py-0.5">
                <span className="text-xs text-zinc-700 font-medium">{s.label}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={s.val}
                    onChange={s.toggle}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-checked:bg-amber-500 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
