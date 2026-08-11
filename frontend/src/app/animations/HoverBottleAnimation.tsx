import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const SIDES = 12;
const SIDE_W = 32;
const H = 200; // Body height
const LID_H = 40; // Lid height
// Radius = (SIDE_W / 2) / Math.tan(Math.PI / SIDES)
const R = 60.5; 

const smooth = { duration: 0.8, ease: [0.32, 0.72, 0, 1] };

const baseStyle = {
  backgroundColor: '#f1f5f9', // slate-100
  borderColor: '#e2e8f0', // slate-200
  borderWidth: '1px',
  borderStyle: 'solid',
  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
};

const lidStyle = {
  backgroundColor: '#3b82f6', // blue-500
  borderColor: '#2563eb', // blue-600
  borderWidth: '1px',
  borderStyle: 'solid',
  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
};

interface Props {
  isHovered: boolean;
}

export default function HoverBottleAnimation({ isHovered }: Props) {
  const spinControls = useAnimation();
  const lidControls = useAnimation();

  useEffect(() => {
    // Continuous spin
    spinControls.start({
      rotateY: [0, 360],
      transition: { duration: 10, ease: "linear", repeat: Infinity }
    });
  }, [spinControls]);

  useEffect(() => {
    if (isHovered) {
      // Open lid
      lidControls.start({ y: -40, transition: smooth });
    } else {
      // Close lid
      lidControls.start({ y: 0, transition: smooth });
    }
  }, [isHovered, lidControls]);

  const renderCylinder = (height: number, style: any) => {
    const panels = [];
    for (let i = 0; i < SIDES; i++) {
      const angle = i * (360 / SIDES);
      panels.push(
        <div 
          key={i}
          style={{
            position: 'absolute',
            width: SIDE_W,
            height: height,
            left: '50%',
            top: 0,
            marginLeft: -SIDE_W / 2,
            transform: `rotateY(${angle}deg) translateZ(${R}px)`,
            ...style
          }}
        />
      );
    }
    return panels;
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none" style={{ perspective: '1200px' }}>
      {/* Container tilts downward to see top */}
      <motion.div style={{ transformStyle: 'preserve-3d', rotateX: -20, rotateZ: -10, y: 30 }}>
        
        {/* Spinning Wrapper */}
        <motion.div style={{ transformStyle: 'preserve-3d' }} animate={spinControls}>
          
          {/* Bottle Body */}
          <div style={{ position: 'absolute', top: -H/2, left: 0, transformStyle: 'preserve-3d' }}>
            {renderCylinder(H, baseStyle)}
          </div>

          {/* Bottle Lid (Animates up when hovered) */}
          <motion.div style={{ position: 'absolute', top: -H/2 - LID_H, left: 0, transformStyle: 'preserve-3d' }} animate={lidControls}>
            {renderCylinder(LID_H, lidStyle)}
            {/* Lid Top Cap */}
            <div style={{
               position: 'absolute', top: 0, left: '50%', width: R*2, height: R*2,
               marginLeft: -R, transformOrigin: 'top', transform: 'rotateX(-90deg)',
               borderRadius: '50%', ...lidStyle
            }} />
          </motion.div>

        </motion.div>

      </motion.div>
    </div>
  );
}
