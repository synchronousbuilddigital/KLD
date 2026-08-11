import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const W = 200;
const D = 140;
const H = 60;

const smooth = { duration: 0.8, ease: [0.32, 0.72, 0, 1] };

const boxStyle = {
  backgroundColor: '#c4a482',
  borderColor: '#b89672',
  boxShadow: 'inset 0 0 30px rgba(139, 107, 74, 0.4), 0 0 1px rgba(0,0,0,0.2)',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const containerVariants = {
  initial: { rotateX: 60, rotateZ: 30, scale: 0.6, y: 0 },
  openLid: { rotateX: 60, rotateZ: 30, scale: 0.6, y: 20, transition: smooth },
  flat: { rotateX: 60, rotateZ: 30, scale: 0.6, y: 40, transition: smooth },
};

const frontVariants = {
  initial: { rotateX: 90, ...boxStyle, transition: smooth },
  openLid: { rotateX: 90, ...boxStyle, transition: smooth },
  flat: { rotateX: 0, ...boxStyle, transition: smooth },
};

const backVariants = {
  initial: { rotateX: -90, ...boxStyle, transition: smooth },
  openLid: { rotateX: -90, ...boxStyle, transition: smooth },
  flat: { rotateX: 0, ...boxStyle, transition: smooth },
};

const leftVariants = {
  initial: { rotateY: 90, ...boxStyle, transition: smooth },
  openLid: { rotateY: 90, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};

const rightVariants = {
  initial: { rotateY: -90, ...boxStyle, transition: smooth },
  openLid: { rotateY: -90, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};

const lidVariants = {
  initial: { rotateX: -90, ...boxStyle, transition: smooth },
  openLid: { rotateX: 0, ...boxStyle, transition: smooth },
  flat: { rotateX: 0, ...boxStyle, transition: smooth },
};

const tuckVariants = {
  initial: { rotateX: -90, ...boxStyle, transition: smooth },
  openLid: { rotateX: 0, ...boxStyle, transition: smooth },
  flat: { rotateX: 0, ...boxStyle, transition: smooth },
};

const dustFlapLeftVariants = {
  initial: { rotateY: 90, ...boxStyle, transition: smooth },
  openLid: { rotateY: 0, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};

const dustFlapRightVariants = {
  initial: { rotateY: -90, ...boxStyle, transition: smooth },
  openLid: { rotateY: 0, ...boxStyle, transition: smooth },
  flat: { rotateY: 0, ...boxStyle, transition: smooth },
};

interface HoverBoxAnimationProps {
  isHovered: boolean;
}

export default function HoverBoxAnimation({ isHovered }: HoverBoxAnimationProps) {
  const controls = useAnimation();

  useEffect(() => {
    let isActive = true;

    const playLoop = async () => {
      if (!isHovered) {
        controls.start('initial');
        return;
      }

      while (isActive && isHovered) {
        await controls.start('openLid');
        if (!isActive || !isHovered) break;
        await new Promise(r => setTimeout(r, 600));
        
        await controls.start('flat');
        if (!isActive || !isHovered) break;
        await new Promise(r => setTimeout(r, 1000));
        
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
      <motion.div
        style={{ width: W, height: D, transformStyle: 'preserve-3d' }}
        variants={containerVariants}
        initial="initial"
        animate={controls}
      >
        <motion.div style={{ position: 'absolute', inset: 0, ...boxStyle, transformStyle: 'preserve-3d' }}>
          
          <motion.div
            style={{ position: 'absolute', top: '100%', left: 0, width: W, height: H, transformOrigin: 'top', transformStyle: 'preserve-3d' }}
            variants={frontVariants}
          />

          <motion.div
            style={{ position: 'absolute', bottom: '100%', left: 0, width: W, height: H, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }}
            variants={backVariants}
          >
            <motion.div
              style={{ position: 'absolute', bottom: '100%', left: 0, width: W, height: D, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }}
              variants={lidVariants}
            >
              <motion.div
                style={{ position: 'absolute', bottom: '100%', left: 0, width: W, height: 20, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }}
                variants={tuckVariants}
              />
            </motion.div>
          </motion.div>

          <motion.div
            style={{ position: 'absolute', top: 0, right: '100%', width: H, height: D, transformOrigin: 'right', transformStyle: 'preserve-3d' }}
            variants={leftVariants}
          >
            <motion.div
              style={{ position: 'absolute', top: 0, right: '100%', width: W/2.1, height: D, transformOrigin: 'right', transformStyle: 'preserve-3d' }}
              variants={dustFlapLeftVariants}
            />
          </motion.div>

          <motion.div
            style={{ position: 'absolute', top: 0, left: '100%', width: H, height: D, transformOrigin: 'left', transformStyle: 'preserve-3d' }}
            variants={rightVariants}
          >
            <motion.div
              style={{ position: 'absolute', top: 0, left: '100%', width: W/2.1, height: D, transformOrigin: 'left', transformStyle: 'preserve-3d' }}
              variants={dustFlapRightVariants}
            />
          </motion.div>

        </motion.div>
      </motion.div>
    </div>
  );
}
