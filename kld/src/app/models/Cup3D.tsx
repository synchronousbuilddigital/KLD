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

  const cupBody = useMemo(() => {
    const slices = 15;
    const faces = f;
    const diameterBot = 50;
    const diameterTop = 70;
    const height = 120;
    
    const heightPerSlice = height / slices;
    const angle = 360 / faces;
    const radius = diameterBot / 2;
    const baseWidth = (diameterBot * Math.tan(Math.PI / faces)) + 1.5;
    
    const elements = [];
    
    for(let j=0; j<slices; j++) {
      const y = j * heightPerSlice;
      const progress = j / (slices - 1); 
      let scaleX = 1, scaleZ = 1;
      
      scaleX = scaleZ = 1 + ((diameterTop/diameterBot) - 1) * (1 - progress);
      const isLabel = (progress > 0.3 && progress < 0.7);
      
      for(let i=0; i<faces; i++) {
        const angleRad = (i * angle) * Math.PI / 180;
        const light = Math.cos(angleRad - 0.5);
        const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
        const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;
        
        let r=253, g=253, b=253; 
        if (isLabel) { r=184; g=149; b=106; } // Coffee Sleeve color
        
        elements.push(
          <div
            key={`body-${j}-${i}`}
            style={{
              position: 'absolute',
              width: baseWidth,
              height: heightPerSlice + 0.8,
              left: radius - baseWidth/2,
              transform: `translateY(${y}px) scale3d(${scaleX}, 1, ${scaleZ}) rotateY(${i * angle}deg) translateZ(${radius}px)`,
              backfaceVisibility: 'hidden',
              background: blendColor(r, g, b, darkness, highlight)
            }}
          />
        );
      }
    }
    return elements;
  }, []);

  const sipSpout = useMemo(() => {
    const faces = f;
    const diameter = 14;
    const height = 8;
    const angle = 360 / faces;
    const radius = diameter / 2;
    const baseWidth = (diameter * Math.tan(Math.PI / faces)) + 1.5;
    const elements = [];
    
    for(let i=0; i<faces; i++) {
      const angleRad = (i * angle) * Math.PI / 180;
      const light = Math.cos(angleRad - 0.5);
      const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
      const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;
      
      elements.push(
        <div
          key={`spout-${i}`}
          style={{
            position: 'absolute',
            width: baseWidth,
            height: height,
            left: radius - baseWidth/2,
            transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            backfaceVisibility: 'hidden',
            background: blendColor(26, 26, 26, darkness, highlight * 0.4)
          }}
        />
      );
    }
    return elements;
  }, []);

  const cupLid = useMemo(() => {
    const faces = f;
    const diameter = 74;
    const height = 15;
    const angle = 360 / faces;
    const radius = diameter / 2;
    const baseWidth = (diameter * Math.tan(Math.PI / faces)) + 1.5;
    const elements = [];
    
    for(let i=0; i<faces; i++) {
      const angleRad = (i * angle) * Math.PI / 180;
      const light = Math.cos(angleRad - 0.5);
      const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
      const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;
      
      elements.push(
        <div
          key={`lid-${i}`}
          style={{
            position: 'absolute',
            width: baseWidth,
            height: height,
            left: radius - baseWidth/2,
            transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            backfaceVisibility: 'hidden',
            background: blendColor(26, 26, 26, darkness, highlight * 0.4)
          }}
        />
      );
    }
    return elements;
  }, []);

  const cupLidInner = useMemo(() => {
    const faces = f;
    const diameter = 72;
    const height = 15;
    const angle = 360 / faces;
    const radius = diameter / 2;
    const baseWidth = (diameter * Math.tan(Math.PI / faces)) + 1.5;
    const elements = [];
    
    for(let i=0; i<faces; i++) {
      elements.push(
        <div
          key={`lidinner-${i}`}
          style={{
            position: 'absolute',
            width: baseWidth,
            height: height,
            left: radius - baseWidth/2,
            transform: `rotateY(${i * angle}deg) translateZ(${radius - 1}px) rotateY(180deg)`,
            background: '#111'
          }}
        />
      );
    }
    return elements;
  }, []);

  return (
    <div className="cup-scene">
      <div className="cup-camera">
        <div className="cup-shadow"></div>
        <div className="cup-container">
           <div className="cup-body">
             {cupBody}
           </div>
           <div className="cup-disk cup-base-disk"></div>
           <div className="cup-disk cup-inner-coffee"></div>
           
           <div className="cup-lid-wrap">
               <div className="cup-lid">{cupLid}</div>
               <div className="cup-lid">{cupLidInner}</div>
               <div className="cup-disk cup-lid-top-disk"></div>
               <div className="cup-disk cup-lid-inner-ceiling"></div>
               
               <div className="cup-sip-spout">
                 {sipSpout}
               </div>
               <div className="cup-disk cup-spout-top-disk"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
