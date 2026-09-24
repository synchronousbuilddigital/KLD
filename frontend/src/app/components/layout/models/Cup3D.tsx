import React, { useMemo } from 'react';
import './Cup3D.css';

function blendColor(r: number, g: number, b: number, darkness: number, highlight: number) {
  let rr = r, gg = g, bb = b;
  if (darkness > 0) {
    rr *= (1 - darkness); gg *= (1 - darkness); bb *= (1 - darkness);
  }
  if (highlight > 0) {
    rr += (255 - rr) * highlight; gg += (255 - gg) * highlight; bb += (255 - bb) * highlight;
  }
  return `rgb(${Math.round(rr)},${Math.round(gg)},${Math.round(bb)})`;
}

export default function Cup3D() {
  const f = 24;
  const angle = 360 / f;
  const diameterBot = 50;
  const radius = diameterBot / 2;
  const baseWidth = (diameterBot * Math.tan(Math.PI / f)) + 1.2;

  const cupBody = useMemo(() => {
    const slices = 15;
    const faces = f;
    const diameterTop = 70;
    const height = 120;
    
    const heightPerSlice = height / slices;
    const elements = [];
    
    for (let j = 0; j < slices; j++) {
      const y = j * heightPerSlice;
      const progress = j / (slices - 1); 
      const scaleXZ = 1 + ((diameterTop / diameterBot) - 1) * (1 - progress);
      const isLabel = (progress > 0.28 && progress < 0.68);
      
      for (let i = 0; i < faces; i++) {
        const angleRad = (i * angle) * Math.PI / 180;
        const light = Math.cos(angleRad - 0.5);
        const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
        const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;
        
        let r = 253, g = 253, b = 253; 
        if (isLabel) { r = 184; g = 149; b = 106; } // Kraft sleeve
        
        elements.push(
          <div
            key={`body-${j}-${i}`}
            style={{
              position: 'absolute',
              width: baseWidth,
              height: heightPerSlice + 0.8,
              left: radius - baseWidth / 2,
              transform: `translateY(${y}px) scale3d(${scaleXZ}, 1, ${scaleXZ}) rotateY(${i * angle}deg) translateZ(${radius}px)`,
              backfaceVisibility: 'hidden',
              background: blendColor(r, g, b, darkness, highlight),
            }}
          />
        );
      }
    }
    return elements;
  }, [f, angle, diameterBot, radius, baseWidth]);

  // Curved UV-mapped sleeve badge slices flush on the cup
  const badgeSlices = useMemo(() => {
    const badgeFaceCount = 10;
    const badgeHeight = 44;
    const badgeWidth = badgeFaceCount * (baseWidth * 1.15);
    const elements = [];

    for (let k = 0; k < badgeFaceCount; k++) {
      const sliceAngle = (k - (badgeFaceCount - 1) / 2) * angle;

      elements.push(
        <div
          key={`cup-badge-slice-${k}`}
          className="cup-badge-slice"
          style={{
            width: `${baseWidth * 1.15}px`,
            height: `${badgeHeight}px`,
            top: '52px',
            left: `${radius - (baseWidth * 1.15) / 2}px`,
            transform: `rotateY(${sliceAngle}deg) translateZ(${radius * 1.25}px)`,
          }}
        >
          <div
            className="cup-badge-card"
            style={{
              width: `${badgeWidth}px`,
              height: `${badgeHeight}px`,
              left: `${-k * (baseWidth * 1.15)}px`,
            }}
          >
            <span className="cup-brand-title">KLD</span>
            <div className="cup-brand-divider" />
            <span className="cup-brand-sub">ARTISAN ROAST</span>
            <span className="cup-brand-extra">100% ORGANIC ARABICA</span>
          </div>
        </div>
      );
    }
    return elements;
  }, [angle, baseWidth, radius]);

  const sipSpout = useMemo(() => {
    const faces = f;
    const diameter = 14;
    const height = 8;
    const r = diameter / 2;
    const bw = (diameter * Math.tan(Math.PI / faces)) + 1.2;
    const elements = [];
    
    for (let i = 0; i < faces; i++) {
      const angleRad = (i * angle) * Math.PI / 180;
      const light = Math.cos(angleRad - 0.5);
      const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
      const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;
      
      elements.push(
        <div
          key={`spout-${i}`}
          style={{
            position: 'absolute',
            width: bw,
            height,
            left: r - bw / 2,
            transform: `rotateY(${i * angle}deg) translateZ(${r}px)`,
            backfaceVisibility: 'hidden',
            background: blendColor(26, 26, 26, darkness, highlight * 0.4),
          }}
        />
      );
    }
    return elements;
  }, [f, angle]);

  const cupLid = useMemo(() => {
    const faces = f;
    const diameter = 74;
    const height = 15;
    const r = diameter / 2;
    const bw = (diameter * Math.tan(Math.PI / faces)) + 1.5;
    const elements = [];
    
    for (let i = 0; i < faces; i++) {
      const angleRad = (i * angle) * Math.PI / 180;
      const light = Math.cos(angleRad - 0.5);
      const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
      const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;
      
      elements.push(
        <div
          key={`lid-${i}`}
          style={{
            position: 'absolute',
            width: bw,
            height,
            left: r - bw / 2,
            transform: `rotateY(${i * angle}deg) translateZ(${r}px)`,
            backfaceVisibility: 'hidden',
            background: blendColor(26, 26, 26, darkness, highlight * 0.4),
          }}
        />
      );
    }
    return elements;
  }, [f, angle]);

  return (
    <div className="cup-scene">
      <div className="cup-camera">
        <div className="cup-shadow" />
        <div className="cup-container">
          <div className="cup-body">
            {cupBody}
            {badgeSlices}
          </div>
          <div className="cup-disk cup-base-disk" />
          <div className="cup-disk cup-inner-coffee" />
          
          <div className="cup-lid-wrap">
            <div className="cup-lid">{cupLid}</div>
            <div className="cup-disk cup-lid-top-disk" />
            
            <div className="cup-sip-spout">
              {sipSpout}
            </div>
            <div className="cup-disk cup-spout-top-disk" />
          </div>
        </div>
      </div>
    </div>
  );
}
