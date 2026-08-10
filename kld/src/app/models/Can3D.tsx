import React, { useMemo } from 'react';
import './Can3D.css';

export default function Can3D() {
  const faces = 72;

  const bodyElements = useMemo(() => {
    const angle = 360 / faces;
    const faceWidth = (100 * Math.tan(Math.PI / faces)) + 0.5;
    const radius = 50;
    const elements = [];

    for (let i = 0; i < faces; i++) {
      const transform = `rotateY(${i * angle}deg) translateZ(${radius}px)`;
      const angleRad = (i * angle) * Math.PI / 180;
      const light = Math.cos(angleRad - 0.5);

      const darkness = light < 0 ? Math.abs(light) * 0.45 : 0;
      const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;

      elements.push(
        <div
          key={i}
          className="can-face"
          style={{
            position: 'absolute',
            width: faceWidth,
            height: 200,
            left: 50 - faceWidth / 2,
            top: 0,
            transform,
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(to bottom, #d2c6b4, #B8956A, #96764d)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(0,0,0,${darkness})`,
              boxShadow: `inset 0 0 3px rgba(255,255,255,${highlight})`,
              borderRight: '1px solid rgba(0,0,0,0.01)'
            }}
          />
        </div>
      );
    }
    return elements;
  }, []);

  return (
    <div className="can-scene">
      <div className="can-camera">
        <div className="can-shadow" />
        <div className="can-body">
          {bodyElements}
        </div>
        <div className="can-lid-container">
          <div className="can-lid-surface">
            <div className="can-lid-hole" />
            <div className="can-opening-flap" />
            <div className="can-ring-tab" />
            <div className="can-rivet" />
          </div>
        </div>
        <div className="can-base" />
      </div>
    </div>
  );
}
