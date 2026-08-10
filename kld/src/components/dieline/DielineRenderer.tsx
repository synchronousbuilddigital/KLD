import React from 'react';
import { PanelOverlay } from './PanelOverlay';

export interface DielineRendererProps {
  geom: any;
  boxId?: number | string;
  L: number;
  W: number;
  H: number;
  scale?: number;
  hasCollision?: boolean;
  showCreaseLines?: boolean;
  showPanelShading?: boolean;
  cutStrokeWidth?: number | string;
  creaseStrokeWidth?: number | string;
  creaseDashArray?: string;
  cutColor?: string;
  creaseColor?: string;
  paperFill?: string;
}

export const DielineRenderer: React.FC<DielineRendererProps> = ({
  geom,
  boxId = 0,
  L,
  W,
  H,
  scale = 1,
  hasCollision = false,
  showCreaseLines = true,
  showPanelShading = true,
  cutStrokeWidth = 1.5,
  creaseStrokeWidth = 1.0,
  creaseDashArray = '5 3',
  cutColor = hasCollision ? '#b91c1c' : '#1e40af',
  creaseColor = hasCollision ? '#ef4444' : '#dc2626',
  paperFill = '#ffffff',
}) => {
  if (!geom) return null;

  const clipId = `dieline-cut-clip-${boxId}`;
  const cFill = hasCollision ? '#fee2e2' : '#dbeafe';

  return (
    <>
      <defs>
        {/* SVG clipPath with clipPathUnits="userSpaceOnUse" to cleanly trim crease lines inside cutPath */}
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={geom.cutPath} />
        </clipPath>
      </defs>

      {/* Layer 1: Paper Substrate Background */}
      <path
        d={geom.cutPath}
        fill={paperFill}
        stroke="none"
      />

      {/* Layer 2: Panel Shading (Body Panels) */}
      {showPanelShading && (
        <PanelOverlay
          geom={geom}
          L={L}
          W={W}
          H={H}
          hasCollision={hasCollision}
          strokeWidth={cutStrokeWidth}
          cCut={cutColor}
          cFill={cFill}
        />
      )}

      {/* Layer 4: Clipped Crease Lines (Rendered beneath cut path, clipped to paperboard perimeter) */}
      {showCreaseLines && geom.creaseLines && (
        <g clipPath={`url(#${clipId})`}>
          {geom.creaseLines.map((line: any, idx: number) => (
            <line
              key={idx}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={creaseColor}
              strokeWidth={creaseStrokeWidth}
              strokeDasharray={creaseDashArray}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: 'none' }}
            />
          ))}
        </g>
      )}

      {/* Layer 5: Cut Path (Outer solid trim line rendered on top of crease lines for crisp capping) */}
      <path
        d={geom.cutPath}
        fill="none"
        stroke={cutColor}
        strokeWidth={cutStrokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
};
