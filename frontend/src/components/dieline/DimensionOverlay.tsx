import React from 'react';

export interface DimensionLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  type: 'horizontal' | 'vertical';
  offset?: number; // visual offset from original dieline edge
}

interface DimensionOverlayProps {
  dimensions?: DimensionLine[];
  scale: number;
}

export const DimensionOverlay: React.FC<DimensionOverlayProps> = ({
  dimensions = [],
  scale,
}) => {
  if (dimensions.length === 0) return null;

  const strokeWidth = 1;
  const arrowSize = 4 / scale;

  return (
    <g className="dieline-dimensions">
      {dimensions.map((dim, idx) => {
        const { x1, y1, x2, y2, label, type } = dim;

        // Calculate text position (center of line)
        const tx = (x1 + x2) / 2;
        const ty = (y1 + y2) / 2;

        // Render line and arrows
        let startArrow = '';
        let endArrow = '';

        if (type === 'horizontal') {
          // Horizontal arrows pointing outwards from center or inwards
          startArrow = `M ${x1 + arrowSize},${y1 - arrowSize/2} L ${x1},${y1} L ${x1 + arrowSize},${y1 + arrowSize/2} Z`;
          endArrow = `M ${x2 - arrowSize},${y2 - arrowSize/2} L ${x2},${y2} L ${x2 - arrowSize},${y2 + arrowSize/2} Z`;
        } else {
          // Vertical arrows
          startArrow = `M ${x1 - arrowSize/2},${y1 + arrowSize} L ${x1},${y1} L ${x1 + arrowSize/2},${y1 + arrowSize} Z`;
          endArrow = `M ${x2 - arrowSize/2},${y2 - arrowSize} L ${x2},${y2} L ${x2 + arrowSize/2},${y2 - arrowSize} Z`;
        }

        return (
          <g key={idx} style={{ pointerEvents: 'none' }}>
            {/* Guide line */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3b82f6"
              strokeWidth={strokeWidth}
            />

            {/* Start Arrowhead */}
            <path d={startArrow} fill="#3b82f6" />

            {/* End Arrowhead */}
            <path d={endArrow} fill="#3b82f6" />

            {/* Text badge background */}
            <rect
              x={type === 'horizontal' ? tx - 25 : tx - 30}
              y={ty - 8}
              width={type === 'horizontal' ? 50 : 60}
              height={16}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={0.5}
              rx={3}
            />

            {/* Text label */}
            <text
              x={tx}
              y={ty + 4}
              fill="#3b82f6"
              fontSize={10}
              fontWeight={600}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
};
