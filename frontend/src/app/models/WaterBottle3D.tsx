import React, { useMemo } from 'react';
import './WaterBottle3D.css';

function blendColor(r: number, g: number, b: number, darkness: number, highlight: number) {
  let rr = r, gg = g, bb = b;
  if (darkness > 0) { rr *= (1 - darkness); gg *= (1 - darkness); bb *= (1 - darkness); }
  if (highlight > 0) { rr += (255 - rr) * highlight; gg += (255 - gg) * highlight; bb += (255 - bb) * highlight; }
  return `rgb(${Math.round(rr)},${Math.round(gg)},${Math.round(bb)})`;
}

export default function WaterBottle3D() {
  const f = 24; // Reduced from 72 to fix lag

  const bottleBody = useMemo(() => {
    const slices = 15; // Reduced from 45 to fix lag
    const faces = f;
    const diameterBot = 60;
    const diameterTop = 60;
    const height = 140;
    
    const heightPerSlice = height / slices;
    const angle = 360 / faces;
    const radius = diameterBot / 2;
    const baseWidth = (diameterBot * Math.tan(Math.PI / faces)) + 1.5;
    
    const elements = [];
    
    for(let j=0; j<slices; j++) {
      const y = j * heightPerSlice;
      const progress = j / (slices - 1); 
      let scaleX = 1, scaleZ = 1, isLabel = false;
      
      let scale = 1;
      if (progress >= 0.35 && progress <= 0.65) {
         isLabel = true; 
      } else if (progress < 0.35) {
         scale = 1 - (Math.sin((progress / 0.35) * Math.PI * 6) + 1)/2 * 0.04;
      } else {
         scale = 1 - (Math.sin(((progress - 0.65) / 0.35) * Math.PI * 8) + 1)/2 * 0.04;
      }
      if (progress > 0.95) scale *= 1 - (progress - 0.95) * 1.5;
      scaleX = scaleZ = scale;
      
      for(let i=0; i<faces; i++) {
        const angleRad = (i * angle) * Math.PI / 180;
        const light = Math.cos(angleRad - 0.5);
        const darkness = light < 0 ? Math.abs(light) * 0.15 : 0;
        const highlight = light > 0.85 ? (light - 0.85) * 2.5 : 0;
        
        let r=210, g=235, b=255; 
        if (isLabel) { r=0; g=139; b=70; } // Bisleri Green label
        
        elements.push(
          <div
            key={`body-${j}-${i}`}
            style={{
              position: 'absolute',
              width: baseWidth,
              height: heightPerSlice + 1.5,
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

  const bottleShoulder = useMemo(() => {
    const slices = 10; // Reduced from 20 to fix lag
    const faces = f;
    const diameterBot = 60;
    const diameterTop = 20;
    const height = 40;
    
    const heightPerSlice = height / slices;
    const angle = 360 / faces;
    const radius = diameterBot / 2;
    const baseWidth = (diameterBot * Math.tan(Math.PI / faces)) + 1.5;
    
    const elements = [];
    
    for(let j=0; j<slices; j++) {
      const y = j * heightPerSlice;
      const progress = j / (slices - 1); 
      
      const curve = Math.sin(progress * Math.PI / 2);
      const scaleXZ = (diameterTop/diameterBot) + (1 - (diameterTop/diameterBot)) * curve;
      
      for(let i=0; i<faces; i++) {
        const angleRad = (i * angle) * Math.PI / 180;
        const light = Math.cos(angleRad - 0.5);
        const darkness = light < 0 ? Math.abs(light) * 0.15 : 0;
        const highlight = light > 0.85 ? (light - 0.85) * 2.5 : 0;
        
        elements.push(
          <div
            key={`shoulder-${j}-${i}`}
            style={{
              position: 'absolute',
              width: baseWidth,
              height: heightPerSlice + 1.5,
              left: radius - baseWidth/2,
              transform: `translateY(${y}px) scale3d(${scaleXZ}, 1, ${scaleXZ}) rotateY(${i * angle}deg) translateZ(${radius}px)`,
              backfaceVisibility: 'hidden',
              background: blendColor(210, 235, 255, darkness, highlight)
            }}
          />
        );
      }
    }
    return elements;
  }, []);

  const bottleNeck = useMemo(() => {
    const faces = f;
    const diameter = 20;
    const height = 15;
    const angle = 360 / faces;
    const radius = diameter / 2;
    const baseWidth = (diameter * Math.tan(Math.PI / faces)) + 1.5;
    const elements = [];
    
    for(let i=0; i<faces; i++) {
      const angleRad = (i * angle) * Math.PI / 180;
      const light = Math.cos(angleRad - 0.5);
      const darkness = light < 0 ? Math.abs(light) * 0.25 : 0;
      const highlight = light > 0.85 ? (light - 0.85) * 2.0 : 0;
      
      const c = blendColor(200, 230, 255, darkness, highlight);
      const bg = `repeating-linear-gradient(-15deg, ${c} 0px, ${c} 2px, #fff 3px, #e8e8e8 4px, ${c} 5px)`;
        
      elements.push(
        <div
          key={`neck-${i}`}
          style={{
            position: 'absolute',
            width: baseWidth,
            height: height,
            left: radius - baseWidth/2,
            transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            backfaceVisibility: 'hidden',
            background: bg
          }}
        />
      );
    }
    return elements;
  }, []);

  const bottleCap = useMemo(() => {
    const faces = f;
    const diameter = 24;
    const height = 15;
    const angle = 360 / faces;
    const radius = diameter / 2;
    const baseWidth = (diameter * Math.tan(Math.PI / faces)) + 1.5;
    const elements = [];
    
    for(let i=0; i<faces; i++) {
      const angleRad = (i * angle) * Math.PI / 180;
      const light = Math.cos(angleRad - 0.5);
      const darkness = light < 0 ? Math.abs(light) * 0.25 : 0;
      const highlight = light > 0.85 ? (light - 0.85) * 2.0 : 0;
      
      const c = blendColor(0, 139, 70, darkness, highlight * 0.5);
      const bg = `repeating-linear-gradient(to right, ${c} 0px, ${c} 1px, #005c2e 2px, ${c} 3px)`;
      
      elements.push(
        <div
          key={`cap-${i}`}
          style={{
            position: 'absolute',
            width: baseWidth,
            height: height,
            left: radius - baseWidth/2,
            transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            backfaceVisibility: 'hidden',
            background: bg
          }}
        />
      );
    }
    return elements;
  }, []);

  const bottleCapInner = useMemo(() => {
    const faces = f;
    const diameter = 22;
    const height = 15;
    const angle = 360 / faces;
    const radius = diameter / 2;
    const baseWidth = (diameter * Math.tan(Math.PI / faces)) + 1.5;
    const elements = [];
    
    for(let i=0; i<faces; i++) {
      elements.push(
        <div
          key={`capinner-${i}`}
          style={{
            position: 'absolute',
            width: baseWidth,
            height: height,
            left: radius - baseWidth/2,
            transform: `rotateY(${i * angle}deg) translateZ(${radius - 1}px) rotateY(180deg)`,
            background: '#005c2e'
          }}
        />
      );
    }
    return elements;
  }, []);

  return (
    <div className="water-scene">
      <div className="water-camera">
        <div className="water-shadow"></div>
        <div className="water-container">
           <div className="water-body">
             {bottleBody}
           </div>
           <div className="water-disk water-base-disk"></div>
           <div className="water-shoulder">
             {bottleShoulder}
           </div>
           <div className="water-neck">
             {bottleNeck}
           </div>
           <div className="water-disk water-neck-bottom-disk"></div>
           <div className="water-cap-wrap">
               <div className="water-cap">{bottleCap}</div>
               <div className="water-cap">{bottleCapInner}</div>
               <div className="water-disk water-cap-top-disk"></div>
               <div className="water-disk water-cap-inner-ceiling"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
