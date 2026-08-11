import React, { useState, useRef } from 'react';

interface SvgViewportProps {
  sheetW: number;
  sheetH: number;
  margin: number;
  allowZoomPan?: boolean;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  children: (scale: number, pX: number, pY: number) => React.ReactNode;
}

export const SvgViewport: React.FC<SvgViewportProps> = ({
  sheetW,
  sheetH,
  margin,
  allowZoomPan = false,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  children,
}) => {
  const CVW = 800;
  const CVH = 600;
  const PAD = 24;

  // Svg zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Auto-fit calculation (base layout)
  const scl = Math.min((CVW - PAD * 2) / sheetW, (CVH - PAD * 2) / sheetH);
  const pW = sheetW * scl;
  const pH = sheetH * scl;
  const pX = (CVW - pW) / 2;
  const pY = (CVH - pH) / 2;

  const mX = (margin / sheetW) * pW;
  const mY = (margin / sheetH) * pH;

  const handleWheel = (e: React.WheelEvent) => {
    if (!allowZoomPan) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.2, Math.min(10, prev * factor)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!allowZoomPan) return;
    // Pan with middle click or left click with shift
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      e.preventDefault();
    }
  };

  const handleViewportMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y
      });
    }
    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const handleViewportMouseUp = (e: React.MouseEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
    }
    if (onMouseUp) {
      onMouseUp(e);
    }
  };

  const handleViewportMouseLeave = (e: React.MouseEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
    }
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  // Compose overall transform matrix: center dieline transform, zoom, and pan offset
  const transform = allowZoomPan
    ? `translate(${pan.x}, ${pan.y}) translate(${CVW / 2}, ${CVH / 2}) scale(${zoom}) translate(${-CVW / 2}, ${-CVH / 2})`
    : '';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${CVW} ${CVH}`}
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
        className="printable-sheet"
        style={{
          display: 'block',
          maxHeight: '100%',
          overflow: 'visible',
          cursor: isPanning.current ? 'grabbing' : 'default',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleViewportMouseMove}
        onMouseUp={handleViewportMouseUp}
        onMouseLeave={handleViewportMouseLeave}
      >
        <g transform={transform}>
          {/* Paper drop-shadow */}
          <rect
            x={pX + 3}
            y={pY + 3}
            width={pW}
            height={pH}
            fill="rgba(0,0,0,0.07)"
            rx={3}
          />

          {/* Paper Background */}
          <rect
            x={pX}
            y={pY}
            width={pW}
            height={pH}
            fill="#ffffff"
            stroke="#d1d5db"
            strokeWidth={1}
            rx={3}
          />

          {/* Margin Guide Line */}
          <rect
            x={pX + mX}
            y={pY + mY}
            width={pW - 2 * mX}
            height={pH - 2 * mY}
            fill="none"
            stroke="#ef4444"
            strokeWidth={0.7}
            strokeDasharray="4,3"
          />

          {/* Placed content inside the scale parameters */}
          {children(scl, pX, pY)}
        </g>
      </svg>
    </div>
  );
};

