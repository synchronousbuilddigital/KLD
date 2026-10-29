import React, { useState } from 'react';
import { X, Sparkles, Box, Download, Check, Layers } from 'lucide-react';
import Mobile3DViewer from './Mobile3DViewer';
import { MockupVariant } from '../../data/mockupData';

interface MobileModelDetailSheetProps {
  model: MockupVariant | null;
  categoryName: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenInStudio: (modelKey: string) => void;
}

export const MobileModelDetailSheet: React.FC<MobileModelDetailSheetProps> = ({
  model,
  categoryName,
  isOpen,
  onClose,
  onOpenInStudio,
}) => {
  const [substrate, setSubstrate] = useState<'white' | 'kraft' | 'metal' | 'plastic'>('white');
  const [isCopied, setIsCopied] = useState(false);
  const [boxProgress, setBoxProgress] = useState<number>(1);

  if (!isOpen || !model) return null;

  const modelKey = model.boxModelKey || 'rte';
  const isBoxModel = ['rte', 'te', 'rsc', 'auto_lock', 'cosmetic', 'cosmetic_b', 'button_hole'].includes(modelKey);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Container */}
      <div 
        className="bg-white w-full rounded-t-3xl shadow-2xl border-t border-zinc-200 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1.5 bg-zinc-300 rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-2 flex items-center justify-between border-b border-zinc-100">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-indigo-600 uppercase font-mono">
              {categoryName}
            </span>
            <h3 className="font-bold text-zinc-900 text-base leading-tight">{model.name}</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Interactive 3D Preview Box */}
          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-zinc-800 overflow-hidden relative shadow-inner">
            <Mobile3DViewer 
              modelType={modelKey} 
              substrate={substrate} 
              height={230} 
              autoRotate={true}
              progress={boxProgress}
            />

            {/* Substrate Pill Switcher */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-xs">
              <button
                onClick={() => setSubstrate('white')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  substrate === 'white'
                    ? 'bg-white text-zinc-950 shadow-xs font-bold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                White
              </button>
              <button
                onClick={() => setSubstrate('kraft')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  substrate === 'kraft'
                    ? 'bg-[#c89a63] text-white shadow-xs font-bold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                Kraft
              </button>
              {(modelKey.includes('can') || modelKey.includes('bottle')) && (
                <button
                  onClick={() => setSubstrate('metal')}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    substrate === 'metal'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Metallic
                </button>
              )}
            </div>

            {/* Floating Fold Control for Boxes */}
            {isBoxModel && (
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 z-10">
                <span className="text-[10px] text-zinc-400 font-bold whitespace-nowrap">Fold</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={boxProgress}
                  onChange={(e) => setBoxProgress(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1"
                />
                <span className="text-[10px] text-blue-400 font-mono font-bold whitespace-nowrap">
                  {Math.round(boxProgress * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Model Description & Specs */}
          <div className="space-y-3">
            <p className="text-xs text-zinc-600 leading-relaxed">
              {model.animation || 'Photorealistic 3D packaging mockup with procedural folding animation and CAD vector blueprint.'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 block uppercase font-medium font-mono">Model Code</span>
                <span className="font-bold text-zinc-800 tracking-tight">{modelKey.toUpperCase()}</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 block uppercase font-medium font-mono">3D Geometry</span>
                <span className="font-bold text-zinc-800 tracking-tight">Parametric CAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sheet Footer CTA */}
        <div className="p-4 border-t border-zinc-100 bg-white space-y-2 pb-[max(env(safe-area-inset-bottom,16px),16px)]">
          <button
            onClick={() => {
              onClose();
              onOpenInStudio(modelKey);
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-600 text-white font-semibold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Customize in 3D Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileModelDetailSheet;
