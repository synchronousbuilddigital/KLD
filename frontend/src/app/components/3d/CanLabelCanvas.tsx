import React, { useRef, useState } from 'react';
import { CanvasDecal } from './BeverageCan3D';
import { RotateCw, Trash2, Copy, Move } from 'lucide-react';

interface CanLabelCanvasProps {
  labelWidthPx?: number;  // 784 px
  labelHeightPx?: number; // 472 px
  decals: CanvasDecal[];
  packageColor: string;
  onUpdateDecal: (id: string, updates: Partial<CanvasDecal>) => void;
  onRemoveDecal: (id: string) => void;
  onDuplicateDecal?: (id: string) => void;
  selectedId: string | null;
  onSelectDecal: (id: string | null) => void;
  zoom?: number;
  showGuides?: boolean;
}

export default function CanLabelCanvas({
  labelWidthPx = 784,
  labelHeightPx = 472,
  decals,
  packageColor,
  onUpdateDecal,
  onRemoveDecal,
  onDuplicateDecal,
  selectedId,
  onSelectDecal,
  zoom = 1,
  showGuides = true,
}: CanLabelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    id: string;
    handle: string;
    startX: number;
    startY: number;
    origW: number;
    origH: number;
    origX: number;
    origY: number;
  } | null>(null);

  const CANVAS_WIDTH = labelWidthPx;
  const CANVAS_HEIGHT = labelHeightPx;

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

  const handleResizeStart = (e: React.MouseEvent, decal: CanvasDecal, handle: string) => {
    e.stopPropagation();
    setResizeState({
      id: decal.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origW: decal.width,
      origH: decal.height,
      origX: decal.x,
      origY: decal.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState) {
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;

      const clampedX = Math.max(-CANVAS_WIDTH * 0.5, Math.min(CANVAS_WIDTH * 1.5, dragState.origX + dx));
      const clampedY = Math.max(-CANVAS_HEIGHT * 0.5, Math.min(CANVAS_HEIGHT * 1.5, dragState.origY + dy));

      onUpdateDecal(dragState.id, {
        x: clampedX,
        y: clampedY,
      });
      return;
    }

    if (resizeState) {
      const dx = (e.clientX - resizeState.startX) / zoom;
      const dy = (e.clientY - resizeState.startY) / zoom;
      const { id, handle, origW, origH, origX, origY } = resizeState;

      let newW = origW;
      let newH = origH;
      let newX = origX;
      let newY = origY;

      if (handle.includes('e')) newW = Math.max(30, origW + dx);
      if (handle.includes('s')) newH = Math.max(30, origH + dy);
      if (handle.includes('w')) {
        const delta = Math.min(origW - 30, dx);
        newW = origW - delta;
        newX = origX + delta;
      }
      if (handle.includes('n')) {
        const delta = Math.min(origH - 30, dy);
        newH = origH - delta;
        newY = origY + delta;
      }

      onUpdateDecal(id, {
        width: newW,
        height: newH,
        x: newX,
        y: newY,
      });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setResizeState(null);
  };

  const isTransparent = packageColor === 'transparent';

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => onSelectDecal(null)}
    >
      {/* Scaled Canvas Container matching Screenshot 2 */}
      <div
        className="relative transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
        }}
      >
        {/* Canvas Wrap Artboard */}
        <div
          className="relative w-full h-full border border-gray-400 shadow-lg overflow-hidden"
          style={{
            backgroundColor: isTransparent ? 'transparent' : (packageColor || '#ffffff'),
            backgroundImage: isTransparent
              ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)'
              : 'none',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
        >
          {/* Guide Lines matching Screenshot 2 */}
          {showGuides && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Top bleed guideline */}
              <div className="absolute top-[28px] left-0 right-0 h-[1px] bg-gray-300 border-t border-gray-300" />
              {/* Top safe margin guideline */}
              <div className="absolute top-[52px] left-0 right-0 h-[1px] bg-gray-300 border-t border-gray-300" />
              {/* Center vertical dashed fold line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] border-l border-dashed border-gray-300" />
              {/* Bottom safe margin guideline */}
              <div className="absolute bottom-[28px] left-0 right-0 h-[1px] bg-gray-300 border-b border-gray-300" />
            </div>
          )}

          {/* Render Decals */}
          {decals.map((decal) => {
            const isSelected = decal.id === selectedId;

            return (
              <div
                key={decal.id}
                onMouseDown={(e) => handleMouseDown(e, decal)}
                className={`absolute cursor-move select-none ${
                  isSelected ? 'ring-2 ring-purple-600 ring-offset-1 z-30' : 'hover:ring-1 hover:ring-purple-400 z-20'
                }`}
                style={{
                  left: `${decal.x}px`,
                  top: `${decal.y}px`,
                  width: `${decal.width}px`,
                  height: `${decal.height}px`,
                  transform: decal.rotation ? `rotate(${decal.rotation}deg)` : 'none',
                  transformOrigin: 'center center',
                }}
              >
                {/* Image Decal */}
                {decal.type === 'image' && decal.url && (
                  <img
                    src={decal.url}
                    alt="Decal"
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                )}

                {/* Text Decal */}
                {(decal.type === 'text' || decal.content) && (
                  <div
                    className="w-full h-full flex items-center justify-center p-1 leading-tight break-words pointer-events-none"
                    style={{
                      fontFamily: decal.fontFamily || 'Inter',
                      fontSize: `${decal.fontSize || 24}px`,
                      fontWeight: decal.bold ? 'bold' : (decal.fontWeight || 'normal'),
                      fontStyle: decal.italic ? 'italic' : (decal.fontStyle || 'normal'),
                      color: decal.color || decal.fillColor || '#000000',
                      textAlign: decal.textAlign || 'center',
                    }}
                  >
                    {decal.text || decal.content}
                  </div>
                )}

                {/* Shape Decals */}
                {decal.type === 'shape' && (
                  <div className="w-full h-full pointer-events-none flex items-center justify-center">
                    {decal.shapeType === 'circle' && (
                      <div
                        className="rounded-full w-full h-full"
                        style={{
                          backgroundColor: decal.fillColor || '#3b82f6',
                          borderColor: decal.strokeColor || 'transparent',
                          borderWidth: `${decal.strokeWidth || 0}px`,
                        }}
                      />
                    )}
                    {(decal.shapeType === 'rounded-rectangle' || decal.shapeType === 'pill') && (
                      <div
                        className="w-full h-full"
                        style={{
                          borderRadius: decal.shapeType === 'pill' ? '9999px' : '12px',
                          backgroundColor: decal.fillColor || '#3b82f6',
                          borderColor: decal.strokeColor || 'transparent',
                          borderWidth: `${decal.strokeWidth || 0}px`,
                        }}
                      />
                    )}
                    {decal.shapeType === 'triangle' && (
                      <svg viewBox="0 0 24 24" className="w-full h-full" fill={decal.fillColor || '#3b82f6'}>
                        <polygon points="12,4 4,20 20,20" />
                      </svg>
                    )}
                    {decal.shapeType === 'star' && (
                      <svg viewBox="0 0 24 24" className="w-full h-full" fill={decal.fillColor || '#3b82f6'}>
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    )}
                    {(decal.shapeType === 'line' || decal.shapeType === 'dashed-line') && (
                      <div
                        className="w-full"
                        style={{
                          borderBottom: `${decal.strokeWidth || 3}px ${decal.shapeType === 'dashed-line' ? 'dashed' : 'solid'} ${
                            decal.strokeColor || decal.fillColor || '#000000'
                          }`,
                        }}
                      />
                    )}
                    {(!decal.shapeType || decal.shapeType === 'rect') && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: decal.fillColor || '#3b82f6',
                          borderColor: decal.strokeColor || 'transparent',
                          borderWidth: `${decal.strokeWidth || 0}px`,
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Symbols & Social Media */}
                {(decal.type === 'symbol' || decal.svgContent || decal.svgString) && (
                  <div
                    className="w-full h-full pointer-events-none p-1 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full"
                    style={{ color: decal.fillColor || decal.color || '#000000' }}
                    dangerouslySetInnerHTML={{
                      __html: (decal.svgContent || decal.svgString || '')
                        .replace(/currentColor/g, decal.fillColor || decal.color || '#000000')
                    }}
                  />
                )}

                {/* Selection Handles & Quick Actions */}
                {isSelected && (
                  <>
                    {/* Corner resize handles */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, decal, 'nw')}
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-purple-600 rounded-xs cursor-nwse-resize"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, decal, 'ne')}
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-purple-600 rounded-xs cursor-nesw-resize"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, decal, 'sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-purple-600 rounded-xs cursor-nesw-resize"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, decal, 'se')}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-purple-600 rounded-xs cursor-nwse-resize"
                    />

                    {/* Floating mini toolbar */}
                    <div
                      className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900 text-white rounded-lg px-2 py-1 shadow-lg text-[11px] pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          const currentRot = decal.rotation || 0;
                          onUpdateDecal(decal.id, { rotation: (currentRot + 90) % 360 });
                        }}
                        className="p-1 hover:text-purple-400 transition-colors"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      {onDuplicateDecal && (
                        <button
                          onClick={() => onDuplicateDecal(decal.id)}
                          className="p-1 hover:text-purple-400 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveDecal(decal.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
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
