import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const W = 200;
const D = 140;
const H = 160;

const smooth = { duration: 0.8, ease: [0.32, 0.72, 0, 1] };

const boxStyle = {
  backgroundColor: '#c4a482',
  borderColor: '#b89672',
  boxShadow: 'inset 0 0 30px rgba(139, 107, 74, 0.4), 0 0 1px rgba(0,0,0,0.2)',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const containerVariants = {
  initial: { rotateX: 60, rotateZ: 30, scale: 0.5, y: 0 },
  flat: { rotateX: 60, rotateZ: 30, scale: 0.4, y: 40, transition: smooth },
};

const backVariants = {
  initial: { rotateX: -90, ...boxStyle, transition: smooth },
  open: { rotateX: -90, ...boxStyle, transition: smooth },
  flat: { rotateX: 0, ...boxStyle, transition: smooth },
};
const topVariants = {
  initial: { z: H, transition: smooth },
  open: { z: H, transition: smooth },
  flat: { z: 0, transition: smooth },
};
const leftVariants = {
  initial: { rotateY: 90, ...boxStyle, transition: smooth },
  open: { rotateY: 90, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};
const rightVariants = {
  initial: { rotateY: -90, ...boxStyle, transition: smooth },
  open: { rotateY: -90, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};

const leftDoorVariants = {
  initial: { rotateY: 90, ...boxStyle, transition: smooth },
  open: { rotateY: 180, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};
const rightDoorVariants = {
  initial: { rotateY: -90, ...boxStyle, transition: smooth },
  open: { rotateY: -180, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};

interface Props {
  isHovered: boolean;
}

export default function DoubleDoorBoxAnimation({ isHovered }: Props) {
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
        
        <motion.div style={{ position: 'absolute', inset: 0, ...boxStyle, transformStyle: 'preserve-3d' }}>
          <motion.div style={{ position: 'absolute', bottom: '100%', left: 0, width: W, height: H, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }} variants={backVariants} />
          <motion.div style={{ position: 'absolute', inset: 0, ...boxStyle }} variants={topVariants} />
          
          <motion.div style={{ position: 'absolute', top: 0, right: '100%', width: H, height: D, transformOrigin: 'right', transformStyle: 'preserve-3d' }} variants={leftVariants}>
            <motion.div style={{ position: 'absolute', top: 0, right: '100%', width: H, height: W/2, transformOrigin: 'right', transformStyle: 'preserve-3d' }} variants={leftDoorVariants} />
          </motion.div>
          
          <motion.div style={{ position: 'absolute', top: 0, left: '100%', width: H, height: D, transformOrigin: 'left', transformStyle: 'preserve-3d' }} variants={rightVariants}>
            <motion.div style={{ position: 'absolute', top: 0, left: '100%', width: H, height: W/2, transformOrigin: 'left', transformStyle: 'preserve-3d' }} variants={rightDoorVariants} />
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  );
}
