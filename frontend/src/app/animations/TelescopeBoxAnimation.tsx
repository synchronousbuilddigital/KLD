import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const W = 180;
const D = 180;
const H = 100;

const smooth = { duration: 0.8, ease: [0.32, 0.72, 0, 1] };

const boxStyle = {
  backgroundColor: '#c4a482',
  borderColor: '#b89672',
  boxShadow: 'inset 0 0 30px rgba(139, 107, 74, 0.4), 0 0 1px rgba(0,0,0,0.2)',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const innerStyle = {
  backgroundColor: '#b89672', // darker inner base
  borderColor: '#a38462',
  boxShadow: 'inset 0 0 20px rgba(0,0,0, 0.1)',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const containerVariants = {
  initial: { rotateX: 60, rotateZ: 30, scale: 0.6, y: 0 },
  flat: { rotateX: 60, rotateZ: 30, scale: 0.45, y: 40, transition: smooth },
};

const lidContainerVariants = {
  initial: { z: 0, x: 0, y: 0, transition: smooth },
  open: { z: H * 1.5, x: 0, y: 0, transition: smooth }, // Lift straight up
  flat: { z: 0, x: W + 20, y: 0, transition: smooth }, // Move to the side and flatten
};

const baseFront = { initial: { rotateX: 90, ...innerStyle }, open: { rotateX: 90, ...innerStyle }, flat: { rotateX: 0, ...innerStyle } };
const baseBack = { initial: { rotateX: -90, ...innerStyle }, open: { rotateX: -90, ...innerStyle }, flat: { rotateX: 0, ...innerStyle } };
const baseLeft = { initial: { rotateY: 90, ...innerStyle }, open: { rotateY: 90, ...innerStyle }, flat: { rotateY: 0, ...innerStyle } };
const baseRight = { initial: { rotateY: -90, ...innerStyle }, open: { rotateY: -90, ...innerStyle }, flat: { rotateY: 0, ...innerStyle } };

const lidFront = { initial: { rotateX: 90, ...boxStyle }, open: { rotateX: 90, ...boxStyle }, flat: { rotateX: 0, ...boxStyle } };
const lidBack = { initial: { rotateX: -90, ...boxStyle }, open: { rotateX: -90, ...boxStyle }, flat: { rotateX: 0, ...boxStyle } };
const lidLeft = { initial: { rotateY: -90, ...boxStyle }, open: { rotateY: -90, ...boxStyle }, flat: { rotateY: 0, ...boxStyle } };
const lidRight = { initial: { rotateY: 90, ...boxStyle }, open: { rotateY: 90, ...boxStyle }, flat: { rotateY: 0, ...boxStyle } };

interface Props {
  isHovered: boolean;
}

export default function TelescopeBoxAnimation({ isHovered }: Props) {
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
        
        {/* Base Bottom Half */}
        <motion.div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
          <motion.div style={{ position: 'absolute', inset: 0, ...innerStyle }} />
          <motion.div style={{ position: 'absolute', top: '100%', left: 0, width: W, height: H, transformOrigin: 'top', transformStyle: 'preserve-3d' }} variants={baseFront} />
          <motion.div style={{ position: 'absolute', bottom: '100%', left: 0, width: W, height: H, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }} variants={baseBack} />
          <motion.div style={{ position: 'absolute', top: 0, right: '100%', width: H, height: D, transformOrigin: 'right', transformStyle: 'preserve-3d' }} variants={baseLeft} />
          <motion.div style={{ position: 'absolute', top: 0, left: '100%', width: H, height: D, transformOrigin: 'left', transformStyle: 'preserve-3d' }} variants={baseRight} />
        </motion.div>

        {/* Top Lid Half */}
        <motion.div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }} variants={lidContainerVariants}>
          <motion.div style={{ position: 'absolute', inset: 0, transform: `translateZ(${H}px)`, ...boxStyle }} />
          <motion.div style={{ position: 'absolute', top: '100%', left: 0, width: W, height: H, transformOrigin: 'top', transformStyle: 'preserve-3d' }} variants={lidFront} />
          <motion.div style={{ position: 'absolute', bottom: '100%', left: 0, width: W, height: H, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }} variants={lidBack} />
          <motion.div style={{ position: 'absolute', top: 0, right: '100%', width: H, height: D, transformOrigin: 'right', transformStyle: 'preserve-3d' }} variants={lidLeft} />
          <motion.div style={{ position: 'absolute', top: 0, left: '100%', width: H, height: D, transformOrigin: 'left', transformStyle: 'preserve-3d' }} variants={lidRight} />
        </motion.div>

      </motion.div>
    </div>
  );
}
