import React from 'react';
import { SvgViewport } from './SvgViewport';
import { DielineRenderer } from './DielineRenderer';
import { DimensionOverlay, DimensionLine } from './DimensionOverlay';

export interface PlacedBox {
  id: number;
  x: number;
  y: number;
  rot: number;
}

interface DielineCanvasProps {
  // Geometry & Box Size
  geom: any;
  L: number;
  W: number;
  H: number;
  glueTab: number;

  // Sheet Specifications
  sheetW: number;
  sheetH: number;
  margin: number;
  spacing: number;
  maxTotal: number;

  // Placed Nests
  activeBoxes: PlacedBox[];
  selectedBoxId: number | null;
  collisions: Set<number>;
  layoutMode: 'auto' | 'manual';
  draggedBoxId: number | null;

  // Interactive Options
  allowZoomPan?: boolean;

  // Event Handlers
  onBoxMouseDown?: (e: React.MouseEvent, id: number) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;

  // Overlay Config
  dimensions?: DimensionLine[];

  // Display Option Config
  showCreaseLines?: boolean;
  showDimensions?: boolean;
  showPanelShading?: boolean;
}

export const DielineCanvas: React.FC<DielineCanvasProps> = ({
  geom,
  L,
  W,
  H,
  glueTab,
  sheetW,
  sheetH,
  margin,
  spacing,
  maxTotal,
  activeBoxes,
  selectedBoxId,
  collisions,
  layoutMode,
  draggedBoxId,
  allowZoomPan = false,
  onBoxMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  dimensions = [],
  showCreaseLines = true,
  showDimensions = true,
  showPanelShading = true,
}) => {
  const CVW = 800;
  const CVH = 600;

  const dieNatW = geom ? geom.flatW : 0;
  const dieNatH = geom ? geom.flatH : 0;

  return (
    <SvgViewport
      sheetW={sheetW}
      sheetH={sheetH}
      margin={margin}
      allowZoomPan={allowZoomPan}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {(scl, pX, pY) => {
        if (maxTotal === 0) {
          return (
            <g>
              <text
                x={CVW / 2}
                y={CVH / 2 - 12}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="#dc2626"
                fontFamily="sans-serif"
              >
                Dieline too large for this sheet
              </text>
              <text
                x={CVW / 2}
                y={CVH / 2 + 8}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
                fontFamily="sans-serif"
              >
                {Math.round(dieNatW)} × {Math.round(dieNatH)} mm does not fit in {sheetW} × {sheetH} mm
              </text>
              <text
                x={CVW / 2}
                y={CVH / 2 + 24}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
                fontFamily="sans-serif"
              >
                Try: larger sheet, smaller box, or reduce margin/glue tab
              </text>
            </g>
          );
        }

        return (
          <>
            {activeBoxes.map((box) => {
              const bx = box.x;
              const by = box.y;
              const rot = box.rot;

              const cx = pX + bx * scl;
              const cy = pY + by * scl;

              const isBoxRot = rot === 90 || rot === 270;
              const viewW = isBoxRot ? dieNatH : dieNatW;
              const viewH = isBoxRot ? dieNatW : dieNatH;

              const hasCollision = collisions.has(box.id);

              // Transform relative to bounding box center
              const tx = bx + viewW / 2;
              const ty = by + viewH / 2;

              return (
                <g
                  key={box.id}
                  onMouseDown={(e) => onBoxMouseDown && onBoxMouseDown(e, box.id)}
                  style={{
                    cursor: layoutMode === 'manual'
                      ? (draggedBoxId === box.id ? 'grabbing' : 'grab')
                      : 'default'
                  }}
                >
                  {/* ── Derived geometry component rendering ── */}
                  <g transform={
                    rot === 90
                      ? `translate(${pX + (bx + dieNatH) * scl},${pY + by * scl}) rotate(90) scale(${scl})`
                      : rot === 180
                      ? `translate(${pX + (bx + dieNatW) * scl},${pY + (by + dieNatH) * scl}) rotate(180) scale(${scl})`
                      : rot === 270
                      ? `translate(${pX + bx * scl},${pY + (by + dieNatW) * scl}) rotate(270) scale(${scl})`
                      : `translate(${pX + bx * scl},${pY + by * scl}) scale(${scl})`
                  }>
                    <DielineRenderer
                      geom={geom}
                      boxId={box.id}
                      L={L}
                      W={W}
                      H={H}
                      scale={scl}
                      hasCollision={hasCollision}
                      showCreaseLines={showCreaseLines}
                      showPanelShading={showPanelShading}
                    />
                  </g>

                  {/* Interactive selection highlight */}
                  {selectedBoxId === box.id && (
                    <rect
                      x={cx - 3}
                      y={cy - 3}
                      width={viewW * scl + 6}
                      height={viewH * scl + 6}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeDasharray="4,2"
                      rx="4"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* Collision warning outline */}
                  {hasCollision && (
                    <rect
                      x={cx - 1.5}
                      y={cy - 1.5}
                      width={viewW * scl + 3}
                      height={viewH * scl + 3}
                      fill="rgba(239, 68, 68, 0.08)"
                      stroke="#ef4444"
                      strokeWidth="2"
                      style={{ pointerEvents: 'none' }}
                      rx="4"
                    />
                  )}

                  {/* Box layout background wrapper (Drawn only for selection or collision warning) */}
                  <rect
                    x={cx + 0.5}
                    y={cy + 0.5}
                    width={viewW * scl - 1}
                    height={viewH * scl - 1}
                    fill={hasCollision ? "rgba(254, 226, 226, 0.3)" : (selectedBoxId === box.id ? "rgba(59, 130, 246, 0.05)" : "none")}
                    stroke={hasCollision ? "#ef4444" : (selectedBoxId === box.id ? "#3b82f6" : "none")}
                    strokeWidth="0.8"
                    rx="2"
                  />
                </g>
              );
            })}

            {/* Render any overall dimension overlays (if specified) */}
            {showDimensions && <DimensionOverlay dimensions={dimensions} scale={scl} />}
          </>
        );
      }}
    </SvgViewport>
  );
};
