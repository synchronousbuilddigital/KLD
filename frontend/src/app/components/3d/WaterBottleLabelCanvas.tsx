import React, { useRef, useState } from 'react';
import { CanvasDecal } from './PlasticWaterBottle3D';
import { RotateCw, Trash2, Copy, Move } from 'lucide-react';

interface WaterBottleLabelCanvasProps {
  labelWidthMm?: number; // 243 mm
  labelHeightMm?: number; // 46 mm
  decals: CanvasDecal[];
  labelColor: string;
  onUpdateDecal: (id: string, updates: Partial<CanvasDecal>) => void;
  onRemoveDecal: (id: string) => void;
  onDuplicateDecal?: (id: string) => void;
  selectedId: string | null;
  onSelectDecal: (id: string | null) => void;
  zoom?: number;
}

export default function WaterBottleLabelCanvas({
  labelWidthMm = 243,
  labelHeightMm = 46,
  decals,
  labelColor,
  onUpdateDecal,
  onRemoveDecal,
  onDuplicateDecal,
  selectedId,
  onSelectDecal,
  zoom = 1,
}: WaterBottleLabelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Canvas visual sizing: 918px by 174px (matching aspect ratio 5.28:1)
  const CANVAS_WIDTH = 918;
  const CANVAS_HEIGHT = 174;

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

    const clampedX = Math.max(-120, Math.min(CANVAS_WIDTH - 20, dragState.origX + dx));
    const clampedY = Math.max(-60, Math.min(CANVAS_HEIGHT - 20, dragState.origY + dy));

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
        {/* Horizontal Dimension Line (243 mm) */}
        <div
          className="absolute -top-7 left-0 right-0 flex items-center justify-between text-[#0284c7] pointer-events-none"
          style={{ width: '100%' }}
        >
          <div className="flex items-center w-full relative">
            <div className="w-2 h-2 border-t-2 border-l-2 border-[#0284c7] -rotate-45" />
            <div className="flex-1 h-[1px] bg-[#0284c7]/80 mx-1 relative">
              <span className="absolute left-1/2 -translate-x-1/2 -top-3.5 bg-transparent px-2 text-[12px] font-semibold text-[#0284c7]">
                {labelWidthMm} mm
              </span>
            </div>
            <div className="w-2 h-2 border-t-2 border-r-2 border-[#0284c7] rotate-45" />
          </div>
        </div>

        {/* Vertical Dimension Line (46 mm) */}
        <div
          className="absolute top-0 bottom-0 right-28 flex flex-col items-center justify-between text-[#0284c7] pointer-events-none z-10"
          style={{ height: '100%' }}
        >
          <div className="w-2 h-2 border-t-2 border-l-2 border-[#0284c7] rotate-45" />
          <div className="flex-1 w-[1px] bg-[#0284c7]/80 my-1 relative flex items-center justify-center">
            <span className="absolute bg-transparent text-[12px] font-semibold text-[#0284c7] whitespace-nowrap pl-16">
              {labelHeightMm} mm
            </span>
          </div>
          <div className="w-2 h-2 border-b-2 border-l-2 border-[#0284c7] -rotate-45" />
        </div>

        {/* Outer Dimension Border Guide */}
        <div className="absolute inset-0 border border-[#0284c7]/60 pointer-events-none z-10 rounded-sm" />

        {/* Main Label Canvas Surface */}
        <div
          className="w-full h-full relative overflow-hidden shadow-sm"
          style={{
            backgroundColor: isTransparent ? '#ffffff' : labelColor,
            backgroundImage: isTransparent
              ? 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)'
              : undefined,
            backgroundSize: isTransparent ? '16px 16px' : undefined,
            backgroundPosition: isTransparent ? '0 0, 0 8px, 8px -8px, -8px 0px' : undefined,
          }}
        >
          {/* Subtle Grid / Watermark when empty */}
          {decals.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
              <span className="text-[14px] font-bold tracking-widest uppercase text-slate-500">
                WRAP-AROUND LABEL • 243 × 46 MM (918 × 174 PX)
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Click Uploads, Elements, or Text to add designs to this bottle
              </span>
            </div>
          )}

          {/* Render Placed Decals */}
          {decals.map((decal) => {
            const isSelected = selectedId === decal.id;

            return (
              <div
                key={decal.id}
                onMouseDown={(e) => handleMouseDown(e, decal)}
                className={`absolute select-none cursor-move ${
                  isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-20' : 'hover:ring-1 hover:ring-blue-300'
                }`}
                style={{
                  left: `${decal.x}px`,
                  top: `${decal.y}px`,
                  width: `${decal.width}px`,
                  height: `${decal.height}px`,
                  transform: decal.rotation ? `rotate(${decal.rotation}deg)` : undefined,
                }}
              >
                {/* 1. Image Decal */}
                {decal.type === 'image' && decal.url && (
                  <img
                    src={decal.url}
                    alt=""
                    className="w-full h-full object-cover pointer-events-none rounded-xs shadow-xs"
                    draggable={false}
                  />
                )}

                {/* 2. Text Decal */}
                {decal.type === 'text' && (
                  <div
                    className="w-full h-full flex items-center select-none"
                    style={{
                      fontFamily: decal.fontFamily || 'Inter',
                      fontSize: `${decal.fontSize || 24}px`,
                      fontWeight: decal.fontWeight || 'bold',
                      fontStyle: decal.fontStyle || 'normal',
                      color: decal.fillColor || '#000000',
                      justifyContent:
                        decal.textAlign === 'left' ? 'flex-start' : decal.textAlign === 'right' ? 'flex-end' : 'center',
                    }}
                  >
                    {decal.text || 'Add Text'}
                  </div>
                )}

                {/* 3. Shape Decal */}
                {decal.type === 'shape' && (
                  <div className="w-full h-full flex items-center justify-center">
                    {decal.shapeType === 'circle' ? (
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          backgroundColor: decal.fillColor || '#3b82f6',
                          border: decal.strokeWidth ? `${decal.strokeWidth}px solid ${decal.strokeColor}` : undefined,
                        }}
                      />
                    ) : decal.shapeType === 'rounded-rectangle' ? (
                      <div
                        className="w-full h-full rounded-2xl"
                        style={{
                          backgroundColor: decal.fillColor || '#3b82f6',
                          border: decal.strokeWidth ? `${decal.strokeWidth}px solid ${decal.strokeColor}` : undefined,
                        }}
                      />
                    ) : decal.shapeType === 'pill' ? (
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          backgroundColor: decal.fillColor || '#3b82f6',
                          border: decal.strokeWidth ? `${decal.strokeWidth}px solid ${decal.strokeColor}` : undefined,
                        }}
                      />
                    ) : decal.shapeType === 'triangle' ? (
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <polygon
                          points="50,5 95,95 5,95"
                          fill={decal.fillColor || '#3b82f6'}
                          stroke={decal.strokeColor}
                          strokeWidth={decal.strokeWidth}
                        />
                      </svg>
                    ) : decal.shapeType === 'star' ? (
                      <svg viewBox="0 0 24 24" className="w-full h-full">
                        <polygon
                          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                          fill={decal.fillColor || '#3b82f6'}
                          stroke={decal.strokeColor}
                          strokeWidth={decal.strokeWidth}
                        />
                      </svg>
                    ) : decal.shapeType === 'line' || decal.shapeType === 'dashed-line' ? (
                      <div
                        className="w-full"
                        style={{
                          height: `${decal.strokeWidth || 3}px`,
                          backgroundColor: decal.fillColor || '#000000',
                          borderTop: decal.shapeType === 'dashed-line' ? '3px dashed currentColor' : undefined,
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: decal.fillColor || '#3b82f6',
                          border: decal.strokeWidth ? `${decal.strokeWidth}px solid ${decal.strokeColor}` : undefined,
                        }}
                      />
                    )}
                  </div>
                )}

                {/* 4. Symbol / Social Media Decal */}
                {decal.type === 'symbol' && decal.svgContent && (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    style={{ color: decal.fillColor || '#000000' }}
                    dangerouslySetInnerHTML={{ __html: decal.svgContent }}
                  />
                )}

                {/* Selection Handle Controls */}
                {isSelected && (
                  <>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDecal(decal.id);
                        onSelectDecal(null);
                      }}
                      className="absolute -top-3.5 -right-3.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer z-30"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Rotate button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateDecal(decal.id, {
                          rotation: ((decal.rotation || 0) + 45) % 360,
                        });
                      }}
                      className="absolute -bottom-3.5 -right-3.5 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer z-30"
                      title="Rotate 45°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate button */}
                    {onDuplicateDecal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateDecal(decal.id);
                        }}
                        className="absolute -top-3.5 -left-3.5 w-6 h-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer z-30"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Resize handle (bottom-left) */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startW = decal.width;
                        const startH = decal.height;
                        const startX = e.clientX;
                        const onMove = (ev: MouseEvent) => {
                          const delta = (ev.clientX - startX) / zoom;
                          const ratio = startH / startW;
                          const newW = Math.max(20, startW + delta);
                          const newH = newW * ratio;
                          onUpdateDecal(decal.id, { width: newW, height: newH });
                        };
                        const onUp = () => {
                          window.removeEventListener('mousemove', onMove);
                          window.removeEventListener('mouseup', onUp);
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                      className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-nesw-resize z-30 shadow-xs"
                      title="Resize"
                    />
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
