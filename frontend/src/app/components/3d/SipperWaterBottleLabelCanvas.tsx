import React, { useRef, useState } from 'react';
import { CanvasDecal } from './SipperWaterBottle3D';
import { RotateCw, Trash2, Copy, Move } from 'lucide-react';

interface SipperWaterBottleLabelCanvasProps {
  labelWidthMm?: number;  // 251 mm
  labelHeightMm?: number; // 227 mm
  decals: CanvasDecal[];
  labelColor: string;
  onUpdateDecal: (id: string, updates: Partial<CanvasDecal>) => void;
  onRemoveDecal: (id: string) => void;
  onDuplicateDecal?: (id: string) => void;
  selectedId: string | null;
  onSelectDecal: (id: string | null) => void;
  zoom?: number;
}

export default function SipperWaterBottleLabelCanvas({
  labelWidthMm = 251,
  labelHeightMm = 227,
  decals,
  labelColor,
  onUpdateDecal,
  onRemoveDecal,
  onDuplicateDecal,
  selectedId,
  onSelectDecal,
  zoom = 1,
}: SipperWaterBottleLabelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Canvas visual sizing: 580px x 524px (matching aspect ratio 251 : 227, 949 x 858)
  const CANVAS_WIDTH = 580;
  const CANVAS_HEIGHT = 524;

  const handleMouseDown = (e: React.MouseEvent, decal: CanvasDecal) => {
    e.stopPropagation();
    onSelectDecal(decal.id);
    setDragState({
      id: decal.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: decal.x,
      origY: decal.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    const dx = (e.clientX - dragState.startX) / zoom;
    const dy = (e.clientY - dragState.startY) / zoom;

    const scaleX = CANVAS_WIDTH / 949;
    const scaleY = CANVAS_HEIGHT / 858;
    const dBaseX = dx / scaleX;
    const dBaseY = dy / scaleY;

    const clampedX = Math.max(-100, Math.min(949 - 20, dragState.origX + dBaseX));
    const clampedY = Math.max(-100, Math.min(858 - 20, dragState.origY + dBaseY));

    onUpdateDecal(dragState.id, {
      x: clampedX,
      y: clampedY,
    });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  const isTransparent = labelColor === 'transparent';

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => onSelectDecal(null)}
    >
      {/* Scaled Canvas Container with Dimension Indicators */}
      <div
        className="relative transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
        }}
      >
        {/* Horizontal Dimension Indicator (251 mm) */}
        <div
          className="absolute -top-7 left-0 right-0 flex items-center justify-between text-[#0284c7] pointer-events-none"
          style={{ width: '100%' }}
        >
          <div className="flex items-center w-full relative">
            <div className="w-2 h-2 border-t-2 border-l-2 border-[#0284c7] -rotate-45" />
            <div className="flex-1 h-[1px] bg-[#0284c7]/80 mx-1 relative">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[12px] font-semibold tracking-wide bg-white/90 px-1.5 py-0.5 rounded shadow-xs text-[#0284c7]">
                {labelWidthMm} mm
              </span>
            </div>
            <div className="w-2 h-2 border-t-2 border-r-2 border-[#0284c7] rotate-45" />
          </div>
        </div>

        {/* Vertical Dimension Indicator (227 mm) */}
        <div
          className="absolute -right-8 top-0 bottom-0 flex flex-col items-center justify-between text-[#0284c7] pointer-events-none"
          style={{ height: '100%' }}
        >
          <div className="flex flex-col items-center h-full relative">
            <div className="w-2 h-2 border-t-2 border-l-2 border-[#0284c7] rotate-45" />
            <div className="w-[1px] flex-1 bg-[#0284c7]/80 my-1 relative">
              <span
                className="absolute top-1/2 -left-12 -translate-y-1/2 text-[12px] font-semibold tracking-wide bg-white/90 px-1.5 py-0.5 rounded shadow-xs text-[#0284c7] whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {labelHeightMm} mm
              </span>
            </div>
            <div className="w-2 h-2 border-b-2 border-l-2 border-[#0284c7] -rotate-45" />
          </div>
        </div>

        {/* The Printable Canvas Area */}
        <div
          className="relative w-full h-full rounded-xs shadow-md border border-zinc-300 overflow-hidden cursor-crosshair transition-colors duration-200"
          style={{
            backgroundColor: isTransparent ? '#ffffff' : labelColor,
            backgroundImage: isTransparent
              ? 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)'
              : 'none',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
        >
          {/* Subtle Grid / Watermark Preview when no decals */}
          {decals.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-zinc-400 opacity-60">
              <p className="text-sm font-semibold text-zinc-500">Upload your image</p>
              <p className="text-xs text-zinc-400 mt-1">or create with</p>
              <p className="text-base font-bold text-zinc-600 mt-1">949 × 858</p>
              <span className="text-[11px] text-zinc-400 mt-0.5">251 × 227 mm Wrap Area</span>
            </div>
          )}

          {/* Dieline Trim & Safety Boundary Guides */}
          <div className="absolute inset-2 border border-dashed border-sky-400/50 pointer-events-none rounded-xs" />

          {/* Decals Render Layer */}
          {decals.map((decal) => {
            const isSelected = selectedId === decal.id;

            // Map decal coordinates from 949 x 858 base to canvas display
            const scaleX = CANVAS_WIDTH / 949;
            const scaleY = CANVAS_HEIGHT / 858;
            const left = decal.x * scaleX;
            const top = decal.y * scaleY;
            const width = decal.width * scaleX;
            const height = decal.height * scaleY;

            return (
              <div
                key={decal.id}
                onMouseDown={(e) => handleMouseDown(e, decal)}
                className={`absolute cursor-move group ${
                  isSelected ? 'ring-2 ring-sky-500 ring-offset-1' : 'hover:ring-1 hover:ring-sky-300'
                }`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  transform: decal.rotation ? `rotate(${decal.rotation}deg)` : 'none',
                  transformOrigin: 'center center',
                }}
              >
                {/* Content rendering */}
                {decal.type === 'text' && (
                  <div
                    className="w-full h-full flex items-center justify-center text-center overflow-hidden"
                    style={{
                      fontSize: `${(decal.fontSize || 32) * scaleY}px`,
                      fontFamily: decal.fontFamily || 'Inter',
                      fontWeight: decal.bold ? 'bold' : decal.fontWeight || 'normal',
                      fontStyle: decal.italic ? 'italic' : decal.fontStyle || 'normal',
                      color: decal.color || decal.fillColor || '#000000',
                    }}
                  >
                    {decal.text || decal.content || 'Sample Text'}
                  </div>
                )}

                {((decal.type === 'image' || decal.type === 'upload' || (!decal.type && (decal.url || decal.src || decal.image || decal.preview || decal.dataUrl))) && (decal.url || decal.src || decal.image || decal.preview || decal.dataUrl)) && (
                  <img
                    src={(decal.url || decal.src || decal.image || decal.preview || decal.dataUrl)!}
                    alt="Decal"
                    className="w-full h-full object-contain pointer-events-none select-none"
                    draggable={false}
                  />
                )}

                {decal.type === 'symbol' && (decal.svgString || decal.svgContent) && (
                  <div
                    className="w-full h-full flex items-center justify-center pointer-events-none [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: decal.svgString || decal.svgContent || '' }}
                  />
                )}

                {decal.type === 'shape' && (
                  <div
                    className="w-full h-full pointer-events-none"
                    style={{
                      backgroundColor: decal.fillColor || '#3b82f6',
                      borderColor: decal.strokeColor || 'transparent',
                      borderWidth: `${(decal.strokeWidth || 0) * scaleX}px`,
                      borderStyle: 'solid',
                      borderRadius: decal.shapeType === 'circle' ? '9999px' : decal.shapeType === 'pill' ? '9999px' : '4px',
                    }}
                  />
                )}

                {/* Selection Controls */}
                {isSelected && (
                  <>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-sky-500 rounded-full cursor-nwse-resize shadow-xs" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-sky-500 rounded-full cursor-nesw-resize shadow-xs" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-sky-500 rounded-full cursor-nesw-resize shadow-xs" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-sky-500 rounded-full cursor-nwse-resize shadow-xs" />

                    {/* Quick action bar */}
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900 text-white rounded-lg px-2 py-1 shadow-md text-xs pointer-events-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateDecal(decal.id, { rotation: ((decal.rotation || 0) + 45) % 360 });
                        }}
                        className="p-1 hover:bg-zinc-700 rounded transition"
                        title="Rotate 45°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      {onDuplicateDecal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateDecal(decal.id);
                          }}
                          className="p-1 hover:bg-zinc-700 rounded transition"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveDecal(decal.id);
                        }}
                        className="p-1 hover:bg-red-600 rounded transition text-red-300 hover:text-white"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
