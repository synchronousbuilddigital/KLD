import React, { useMemo } from 'react';
import './Pouch3D.css';

function blendColor(r: number, g: number, b: number, darkness: number, highlight: number) {
  let rr = r, gg = g, bb = b;
  if (darkness > 0) { rr *= (1 - darkness); gg *= (1 - darkness); bb *= (1 - darkness); }
  if (highlight > 0) { rr += (255 - rr) * highlight; gg += (255 - gg) * highlight; bb += (255 - bb) * highlight; }
  return `rgb(${Math.round(rr)},${Math.round(gg)},${Math.round(bb)})`;
}

export default function Pouch3D() {
  const f = 24;

  const pouchBody = useMemo(() => {
    const slices = 15;
    const faces = f;
    const width = 100; // Wider base
    const depth = 45;
    const height = 130;
    
    const heightPerSlice = height / slices;
    const angle = 360 / faces;
    const radius = width / 2;
    const baseWidth = (width * Math.tan(Math.PI / faces)) + 1.5;
    
    const elements = [];
    
    for(let j=0; j<slices; j++) {
      const y = j * heightPerSlice;
      const progress = j / (slices - 1); 
      
      // The width stays exactly the same from base to opening (straight left and right edges)
      const scaleX = 1; 
      // Pinch Z from `depth / width` down to almost 0 at the top (wide base, flat opening)
      const scaleZ = (depth / width) * (1 - Math.pow(progress, 1.2) * 0.95);
      
      const isLabel = (progress > 0.25 && progress < 0.75);
      
      for(let i=0; i<faces; i++) {
        const angleRad = (i * angle) * Math.PI / 180;
        const light = Math.cos(angleRad - 0.5);
        const darkness = light < 0 ? Math.abs(light) * 0.25 : 0;
        const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;
        
        // Pouch color: warm kraft/off-white
        let r=245, g=240, b=232; 
        if (isLabel) { r=184; g=149; b=106; }
        
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

  return (
    <div className="pouch-scene">
      <div className="pouch-camera">
        <div className="pouch-shadow"></div>
        <div className="pouch-container">
           <div className="pouch-body">
             {pouchBody}
             
             {/* Zipper Seal */}
             <div style={{ position: 'absolute', top: -4, left: 0, width: 100, height: 8, transformStyle: 'preserve-3d' }}>
               <div style={{ position: 'absolute', width: 100, height: 8, background: '#555', transform: 'translateZ(2px)' }} />
               <div style={{ position: 'absolute', width: 100, height: 8, background: '#333', transform: 'translateZ(-2px) rotateY(180deg)' }} />
               <div style={{ position: 'absolute', width: 100, height: 4, top: -2, background: '#777', transform: 'rotateX(90deg)' }} />
               
               {/* Zipper Pull Tab */}
               <div className="pouch-zipper-pull"></div>
             </div>

             {/* Bottom Base Disk to close the hole */}
             <div style={{
               position: 'absolute',
               top: 130 - 50,
               left: 0,
               width: 100,
               height: 100,
               background: '#d4ceb8',
               borderRadius: '50%',
               transform: `rotateX(-90deg) scaleY(${45 / 100})`,
               backfaceVisibility: 'hidden'
             }}></div>
           </div>
        </div>
      </div>
    </div>
  );
}
