import React from 'react';
import { MousePointer, Move, ZoomIn, ZoomOut, Settings, PenTool } from 'lucide-react';

interface ToolbarProps {
  activeTool: string;
  onSelectTool: (tool: string) => void;
  onToggleSettings: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  onToggleSettings,
}) => {
  const tools = [
    { id: 'cursor', label: 'Cursor', icon: MousePointer },
    { id: 'hand', label: 'Pan Hand', icon: Move },
    { id: 'zoomin', label: 'Zoom In', icon: ZoomIn },
    { id: 'zoomout', label: 'Zoom Out', icon: ZoomOut },
    { id: 'pen', label: 'Pen Tool', icon: PenTool },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] pointer-events-auto">
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={t.label}
            className={`p-2 rounded-lg transition-all duration-150 ${
              isActive
                ? 'bg-amber-500 text-black font-bold'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
      <div className="w-px h-5 bg-zinc-200 mx-1" />
      <button
        onClick={onToggleSettings}
        title="Settings"
        className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all duration-150"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
};
