import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const tubeStyle = {
  backgroundColor: '#f8fafc',
  backgroundImage: 'linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #e2e8f0 100%)',
  borderTopLeftRadius: '50px',
  borderTopRightRadius: '50px',
  borderBottomLeftRadius: '4px',
  borderBottomRightRadius: '4px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
};

const squeezeVariants = {
  initial: { scaleX: 1 },
  squeeze: { scaleX: 0.85, transition: { duration: 0.5, ease: "easeInOut" } },
};

interface HoverTubeAnimationProps {
  isHovered: boolean;
}

export default function HoverTubeAnimation({ isHovered }: HoverTubeAnimationProps) {
  const controls = useAnimation();

  useEffect(() => {
    let isActive = true;
    const playLoop = async () => {
      if (!isHovered) {
        controls.start('initial');
        return;
      }
      while (isActive && isHovered) {
        await controls.start('squeeze');
        await new Promise(r => setTimeout(r, 600));
        await controls.start('initial');
        await new Promise(r => setTimeout(r, 500));
      }
    };
    playLoop();
    return () => { isActive = false; controls.stop(); };
  }, [isHovered, controls]);

  return (
    <div style={{ perspective: '1200px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        style={{ width: 80, height: 200, position: 'relative', transformStyle: 'preserve-3d', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        initial={{ rotateY: -15, rotateZ: 5 }}
        animate={isHovered ? { rotateY: 15, rotateZ: -5 } : { rotateY: -15, rotateZ: 5 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
      >
        {/* Cap */}
        <div style={{ width: 60, height: 30, backgroundColor: '#3b82f6', borderRadius: '4px 4px 0 0', zIndex: 10, boxShadow: 'inset -10px 0 10px rgba(0,0,0,0.2)' }} />
        
        {/* Body */}
        <motion.div variants={squeezeVariants} initial="initial" animate={controls} style={{ ...tubeStyle, width: '100%', flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
           {/* Crimp End */}
           <div style={{ width: '100%', height: 15, backgroundColor: '#cbd5e1', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)' }} />
        </motion.div>
      </motion.div>
    </div>
  );
}
