import React from 'react';

interface PanelOverlayProps {
  geom: any;
  L: number;
  W: number;
  H: number;
  hasCollision?: boolean;
  strokeWidth?: number | string;
  cCut: string;
  cFill: string;
}

export const PanelOverlay: React.FC<PanelOverlayProps> = ({
  geom,
  L,
  W,
  H,
  hasCollision = false,
  strokeWidth = 1,
  cCut,
  cFill,
}) => {
  // If the dieline engine did not calculate panel markings, skip rendering
  if (!geom || geom.x1 === undefined || geom.y2 === undefined) {
    return null;
  }

  const panels = [
    { x: geom.x1, w: L },
    { x: geom.x2, w: W },
    { x: geom.x3, w: L },
    { x: geom.x4, w: W }
  ];

  return (
    <>
      {panels.map((p, idx) => {
        const fill = idx % 2 === 0
          ? (hasCollision ? '#fee2e2' : '#eff6ff')
          : cFill;
        return (
          <rect
            key={idx}
            x={p.x}
            y={geom.y2}
            width={p.w}
            height={H}
            fill={fill}
            stroke={cCut}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </>
  );
};
