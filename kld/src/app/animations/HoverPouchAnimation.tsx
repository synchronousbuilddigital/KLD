import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const W = 160;
const H = 200;
const SEAL_H = 30;
const DEPTH = 60; // Bottom thickness

const smooth = { duration: 0.8, ease: [0.32, 0.72, 0, 1] };

const pouchStyle = {
  background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', // Colorful gradient
  borderWidth: '1px',
  borderColor: '#ff758c',
  borderStyle: 'solid',
  boxShadow: 'inset 0 0 20px rgba(255,255,255,0.5)',
};

const innerStyle = {
  backgroundColor: '#f8f9fa',
  borderWidth: '1px',
  borderColor: '#dee2e6',
  borderStyle: 'solid',
};

export default function HoverPouchAnimation({ isHovered }: { isHovered: boolean }) {
  const spinControls = useAnimation();
  const frontControls = useAnimation();
  const backControls = useAnimation();

  useEffect(() => {
    spinControls.start({
      rotateY: [0, 360],
      transition: { duration: 12, ease: "linear", repeat: Infinity }
    });
  }, [spinControls]);

  useEffect(() => {
    if (isHovered) {
      // Zipper opens
      frontControls.start({ rotateX: 30, z: 20, transition: smooth });
      backControls.start({ rotateX: -30, z: -20, transition: smooth });
    } else {
      // Zipper closes
      frontControls.start({ rotateX: 10, z: DEPTH/4, transition: smooth }); // Natural pouch bulge
      backControls.start({ rotateX: -10, z: -DEPTH/4, transition: smooth });
    }
  }, [isHovered, frontControls, backControls]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none" style={{ perspective: '1200px' }}>
      <motion.div style={{ transformStyle: 'preserve-3d', rotateX: -15, y: 30 }}>
        
        <motion.div style={{ transformStyle: 'preserve-3d' }} animate={spinControls}>
          
          {/* Front Half of Pouch */}
          <motion.div style={{ position: 'absolute', top: -H/2, left: -W/2, width: W, height: H, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }} animate={frontControls}>
            <div style={{ position: 'absolute', inset: 0, ...pouchStyle, borderRadius: '8px 8px 0 0' }} />
            {/* Inner foil lining */}
            <div style={{ position: 'absolute', inset: 0, ...innerStyle, transform: 'translateZ(-1px)', borderRadius: '8px 8px 0 0' }} />
            {/* Top Seal Detail */}
            <div style={{ position: 'absolute', top: SEAL_H, left: 0, width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
          </motion.div>

          {/* Back Half of Pouch */}
          <motion.div style={{ position: 'absolute', top: -H/2, left: -W/2, width: W, height: H, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }} animate={backControls}>
            <div style={{ position: 'absolute', inset: 0, ...pouchStyle, borderRadius: '8px 8px 0 0' }} />
            {/* Inner foil lining */}
            <div style={{ position: 'absolute', inset: 0, ...innerStyle, transform: 'translateZ(1px)', borderRadius: '8px 8px 0 0' }} />
            {/* Top Seal Detail */}
            <div style={{ position: 'absolute', top: SEAL_H, left: 0, width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
          </motion.div>

          {/* Bottom Gusset */}
          <div style={{ 
            position: 'absolute', top: H/2, left: -W/2, width: W, height: DEPTH, 
            transformOrigin: 'top', transform: `rotateX(-90deg) translateY(-${DEPTH/2}px)`, 
            ...innerStyle, borderRadius: '50%' // Oval shaped bottom
          }} />

        </motion.div>

      </motion.div>
    </div>
  );
}
