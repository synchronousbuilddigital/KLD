import React from 'react';

export type AnimState = 'closed' | 'open' | 'rotate';

interface CylinderProps {
  radius: number;
  height: number;
  color: string;
  topColor?: string;
  bottomColor?: string;
  segments?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable CSS 3D cylinder built from vertical strips.
 */
export default function Cylinder3D({
  radius,
  height,
  color,
  topColor,
  bottomColor,
  segments = 40,
  style,
  className,
  children
}: CylinderProps) {
  // slightly more overlap to prevent any subpixel gaps during rotation
  const stripWidth = 2 * radius * Math.tan(Math.PI / segments) + 1.2; 

  return (
    <div
      className={className}
      style={{
        width: radius * 2,
        height: height,
        position: 'relative',
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {/* Strips forming the cylinder wall */}
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (360 / segments) * i;
        // Smooth gradient-like shading
        const normalizedAngle = Math.abs(((angle + 180) % 360) - 180);
        const shade = 1 - Math.pow(normalizedAngle / 180, 1.5) * 0.45;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: stripWidth,
              height: height,
              left: '50%',
              top: 0,
              marginLeft: -stripWidth / 2,
              background: color,
              filter: `brightness(${shade}) drop-shadow(0 0 1px ${color})`,
              transformOrigin: `center center -${radius}px`,
              transform: `rotateY(${angle}deg)`,
              backfaceVisibility: 'hidden',
            }}
          />
        );
      })}

      {/* Top cap (ellipse) */}
      <div
        style={{
          position: 'absolute',
          width: radius * 2,
          height: radius * 2,
          borderRadius: '50%',
          background: topColor || color,
          top: -radius,
          left: 0,
          transform: 'rotateX(90deg)',
          transformOrigin: 'center bottom',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
        }}
      />

      {/* Bottom cap (ellipse) */}
      <div
        style={{
          position: 'absolute',
          width: radius * 2,
          height: radius * 2,
          borderRadius: '50%',
          background: bottomColor || color,
          bottom: -radius,
          left: 0,
          transform: 'rotateX(-90deg)',
          transformOrigin: 'center top',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)',
        }}
      />

      {children}
    </div>
  );
}
