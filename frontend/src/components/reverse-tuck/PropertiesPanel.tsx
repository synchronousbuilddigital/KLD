import React from 'react';
import { Download, FileText, Image as ImageIcon, Box } from 'lucide-react';

interface PropertiesPanelProps {
  onDownloadDieline: (format: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  onDownloadDieline,
}) => {
  const formats = [
    { id: 'ai', name: 'Adobe Illustrator', icon: FileText, extension: '.ai' },
    { id: 'pdf', name: 'PDF Vector dieline', icon: FileText, extension: '.pdf' },
    { id: 'dxf', name: 'DXF CAD layout', icon: FileText, extension: '.dxf' },
    { id: 'mockup', name: '3D Mockup render', icon: ImageIcon, extension: '.gltf' },
  ];

  return (
    <div className="w-[320px] bg-white border-l border-zinc-200 flex flex-col h-full overflow-y-auto p-5 shrink-0 select-none">
      {/* 3D Mockup Card Placeholder */}
      <div className="bg-gradient-to-b from-zinc-200 to-zinc-300 rounded-2xl h-[240px] relative overflow-hidden shadow-inner border border-zinc-300 flex flex-col items-center justify-center mb-6">
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1 shadow-sm border border-zinc-150">
          <Box className="w-3.5 h-3.5" />
          Interactive 3D
        </div>
        
        {/* Placeholder mesh representation */}
        <div className="w-20 h-20 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded-xl flex items-center justify-center animate-pulse">
          <Box className="w-8 h-8 text-amber-500/80" />
        </div>
        
        {/* Progress slider placeholder */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-md border border-zinc-100">
          <span className="text-[11px] font-semibold text-zinc-500">Fold</span>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="30"
            disabled
            className="flex-1 h-1 bg-zinc-200 rounded-lg cursor-not-allowed accent-amber-500"
          />
          <span className="text-[11px] font-semibold text-zinc-500">Unfold</span>
        </div>
      </div>

      {/* File Formats */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Export File Formats
        </span>
        <div className="grid grid-cols-2 gap-2">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => onDownloadDieline(f.id)}
              className="border border-zinc-200 hover:border-amber-500 hover:bg-amber-500/5 hover:-translate-y-0.5 rounded-xl p-3 flex flex-col gap-2 items-center justify-center text-center transition-all duration-200"
            >
              <div className="p-2.5 bg-zinc-50 rounded-lg text-zinc-600 border border-zinc-100 group-hover:bg-amber-500/10">
                <f.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-zinc-800 leading-tight">
                {f.name}
              </span>
              <span className="text-[9px] font-bold text-zinc-400 font-mono">
                {f.extension}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

