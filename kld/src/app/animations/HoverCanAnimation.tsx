import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const SIDES = 16;
const SIDE_W = 24;
const H = 160; 
const LID_H = 10;
const R = 60.5; // (24/2)/tan(11.25deg) ~ 60.3

const smooth = { duration: 0.8, ease: [0.32, 0.72, 0, 1] };

const baseStyle = {
  backgroundColor: '#cbd5e1', // slate-300
  borderColor: '#94a3b8', // slate-400
  borderWidth: '1px',
  borderStyle: 'solid',
  boxShadow: 'inset 0 0 15px rgba(255,255,255,0.4), inset -10px 0 20px rgba(0,0,0,0.1)',
};

const lidStyle = {
  backgroundColor: '#94a3b8',
  borderColor: '#64748b',
  borderWidth: '1px',
  borderStyle: 'solid',
};

interface Props {
  isHovered: boolean;
}

export default function HoverCanAnimation({ isHovered }: Props) {
  const spinControls = useAnimation();
  const lidControls = useAnimation();

  useEffect(() => {
    spinControls.start({
      rotateY: [0, 360],
      transition: { duration: 8, ease: "linear", repeat: Infinity }
    });
  }, [spinControls]);

  useEffect(() => {
    if (isHovered) {
      // Pop tab / open lid
      lidControls.start({ rotateX: 30, y: -20, z: -20, transition: smooth });
    } else {
      lidControls.start({ rotateX: 0, y: 0, z: 0, transition: smooth });
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
      <motion.div style={{ transformStyle: 'preserve-3d', rotateX: -20, rotateZ: 10, y: 30 }}>
        
        <motion.div style={{ transformStyle: 'preserve-3d' }} animate={spinControls}>
          
          {/* Can Body */}
          <div style={{ position: 'absolute', top: -H/2, left: 0, transformStyle: 'preserve-3d' }}>
            {renderCylinder(H, baseStyle)}
          </div>

          {/* Can Lid (Pops open on hover) */}
          <motion.div 
            style={{ position: 'absolute', top: -H/2 - LID_H, left: 0, transformStyle: 'preserve-3d', transformOrigin: 'bottom back' }} 
            animate={lidControls}
          >
            {renderCylinder(LID_H, lidStyle)}
            {/* Top flat piece */}
            <div style={{
               position: 'absolute', top: 0, left: '50%', width: R*2, height: R*2,
               marginLeft: -R, transformOrigin: 'top', transform: 'rotateX(-90deg)',
               borderRadius: '50%', ...lidStyle
            }}>
              {/* Tab representation */}
              <div style={{ position: 'absolute', top: '20%', left: '45%', width: '10%', height: '30%', backgroundColor: '#64748b', borderRadius: '4px' }} />
            </div>
          </motion.div>

        </motion.div>

      </motion.div>
    </div>
  );
}
