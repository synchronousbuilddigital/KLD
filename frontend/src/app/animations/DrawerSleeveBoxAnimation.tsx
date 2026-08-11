import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const W = 200;
const D = 140;
const H = 80;

const smooth = { duration: 0.8, ease: [0.32, 0.72, 0, 1] };

const boxStyle = {
  backgroundColor: '#c4a482',
  borderColor: '#b89672',
  boxShadow: 'inset 0 0 30px rgba(139, 107, 74, 0.4), 0 0 1px rgba(0,0,0,0.2)',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const innerStyle = {
  backgroundColor: '#d6b896',
  borderColor: '#c4a482',
  boxShadow: 'inset 0 0 20px rgba(139, 107, 74, 0.2), 0 0 1px rgba(0,0,0,0.1)',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const containerVariants = {
  initial: { rotateX: 60, rotateZ: 30, scale: 0.6, y: 0 },
  flat: { rotateX: 60, rotateZ: 30, scale: 0.5, y: 40, transition: smooth },
};

const drawerVariants = {
  initial: { y: 0, transition: smooth },
  open: { y: D * 0.7, transition: smooth },
  flat: { y: D * 1.2, transition: smooth }, // Slide out further and flatten
};

// Sleeve Variants
const topSleeveVariants = {
  initial: { z: H, transition: smooth },
  open: { z: H, transition: smooth },
  flat: { z: 0, transition: smooth }, // Collapses down
};
const leftSleeveVariants = {
  initial: { rotateY: 90, ...boxStyle, transition: smooth },
  open: { rotateY: 90, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};
const rightSleeveVariants = {
  initial: { rotateY: -90, ...boxStyle, transition: smooth },
  open: { rotateY: -90, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};

// Drawer Variants
const frontDrawerVariants = {
  initial: { rotateX: 90, ...innerStyle, transition: smooth },
  open: { rotateX: 90, ...innerStyle, transition: smooth },
  flat: { rotateX: 0, ...innerStyle, transition: smooth },
};
const backDrawerVariants = {
  initial: { rotateX: -90, ...innerStyle, transition: smooth },
  open: { rotateX: -90, ...innerStyle, transition: smooth },
  flat: { rotateX: 0, ...innerStyle, transition: smooth },
};
const leftDrawerVariants = {
  initial: { rotateY: 90, ...innerStyle, transition: smooth },
  open: { rotateY: 90, ...innerStyle, transition: smooth },
  flat: { rotateY: 0, ...innerStyle, transition: smooth },
};
const rightDrawerVariants = {
  initial: { rotateY: -90, ...innerStyle, transition: smooth },
  open: { rotateY: -90, ...innerStyle, transition: smooth },
  flat: { rotateY: 0, ...innerStyle, transition: smooth },
};

interface Props {
  isHovered: boolean;
}

export default function DrawerSleeveBoxAnimation({ isHovered }: Props) {
  const controls = useAnimation();

  useEffect(() => {
    let isActive = true;
    const playLoop = async () => {
      if (!isHovered) {
        controls.start('initial');
        return;
      }
      while (isActive && isHovered) {
        await controls.start('open');
        if (!isActive || !isHovered) break;
        await new Promise(r => setTimeout(r, 800));

        await controls.start('flat');
        if (!isActive || !isHovered) break;
        await new Promise(r => setTimeout(r, 1200));

        await controls.start('initial');
        if (!isActive || !isHovered) break;
        await new Promise(r => setTimeout(r, 800));
      }
    };
    playLoop();
    return () => { isActive = false; };
  }, [isHovered, controls]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none" style={{ perspective: '1200px' }}>
      <motion.div style={{ width: W, height: D, transformStyle: 'preserve-3d' }} variants={containerVariants} initial="initial" animate={controls}>
        
        {/* Outer Sleeve */}
        <motion.div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
          <motion.div style={{ position: 'absolute', inset: 0, ...boxStyle }} variants={topSleeveVariants} />
          <motion.div style={{ position: 'absolute', inset: 0, ...boxStyle }} />
          <motion.div style={{ position: 'absolute', top: 0, right: '100%', width: H, height: D, transformOrigin: 'right', transformStyle: 'preserve-3d' }} variants={leftSleeveVariants} />
          <motion.div style={{ position: 'absolute', top: 0, left: '100%', width: H, height: D, transformOrigin: 'left', transformStyle: 'preserve-3d' }} variants={rightSleeveVariants} />
        </motion.div>

        {/* Inner Drawer */}
        <motion.div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }} variants={drawerVariants}>
           <motion.div style={{ position: 'absolute', inset: 0, ...innerStyle }} />
           <motion.div style={{ position: 'absolute', top: '100%', left: 0, width: W, height: H-4, transformOrigin: 'top', transformStyle: 'preserve-3d' }} variants={frontDrawerVariants} />
           <motion.div style={{ position: 'absolute', bottom: '100%', left: 0, width: W, height: H-4, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }} variants={backDrawerVariants} />
           <motion.div style={{ position: 'absolute', top: 0, right: '100%', width: H-4, height: D, transformOrigin: 'right', transformStyle: 'preserve-3d' }} variants={leftDrawerVariants} />
           <motion.div style={{ position: 'absolute', top: 0, left: '100%', width: H-4, height: D, transformOrigin: 'left', transformStyle: 'preserve-3d' }} variants={rightDrawerVariants} />
        </motion.div>

      </motion.div>
    </div>
  );
}
