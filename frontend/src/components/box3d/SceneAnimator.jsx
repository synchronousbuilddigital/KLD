import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function SceneAnimator({ activeAnimation, children }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    const t = state.clock.getElapsedTime();

    // Reset rotation, position, scale if animation changes
    if (activeAnimation !== 'rotation') {
      group.rotation.y = 0;
    }
    if (activeAnimation !== 'drop') {
      group.position.y = 0;
    }
    if (activeAnimation !== 'scale' && activeAnimation !== 'emphasis') {
      group.scale.set(1, 1, 1);
    }

    switch (activeAnimation) {
      case 'rotation':
        group.rotation.y += delta;
        break;
      
      case 'drop':
        const duration = 2.5; // loop every 2.5s
        const dropPhase = (t % duration) / duration; // 0.0 to 1.0
        
        let y = 0;
        if (dropPhase < 0.3) {
          // Drop from above
          const p = dropPhase / 0.3; // 0 to 1
          y = (1 - p * p) * 200; // Drop from 200 units up
        } else if (dropPhase < 0.45) {
          // First bounce
          const p = (dropPhase - 0.3) / 0.15; // 0 to 1
          y = Math.sin(p * Math.PI) * 40; 
        } else if (dropPhase < 0.6) {
          // Second bounce
          const p = (dropPhase - 0.45) / 0.15; 
          y = Math.sin(p * Math.PI) * 15;
        } else if (dropPhase < 0.7) {
          // Third small bounce
          const p = (dropPhase - 0.6) / 0.1;
          y = Math.sin(p * Math.PI) * 5;
        }
        group.position.y = y;
        break;

      case 'scale':
        // Smooth scaling in and out
        const scaleVal = 1 + Math.sin(t * 2) * 0.15;
        group.scale.set(scaleVal, scaleVal, scaleVal);
        break;

      case 'emphasis':
        // A heartbeat emphasis
        const beat = (t * 2) % 1;
        let s = 1;
        if (beat < 0.1) s = 1 + beat * 2; // quick up to 1.2
        else if (beat < 0.2) s = 1.2 - (beat - 0.1) * 2; // quick down to 1.0
        else if (beat < 0.3) s = 1 + (beat - 0.2) * 1.5; // second small beat to 1.15
        else if (beat < 0.4) s = 1.15 - (beat - 0.3) * 1.5; // back to 1.0
        
        group.scale.set(s, s, s);
        break;
        
      case 'folder':
      default:
        // folder animation is handled by progress prop in Box3DViewer
        break;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}
