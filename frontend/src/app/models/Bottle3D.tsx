import React, { useMemo } from 'react';
import './Bottle3D.css';

export default function Bottle3D() {
  const resolution = 36; // Reduced from 144 to prevent lag

  const createCylinder = (faces: number, diameter: number, height: number, type: string, flip = false) => {
    const angle = 360 / faces;
    const faceWidth = (diameter * Math.tan(Math.PI / faces)) + 1.0; 
    const radius = diameter / 2;
    const elements = [];
    
    for(let i = 0; i < faces; i++) {
      let transform = '';
      let background = '';
      
      if (flip) {
        transform = `rotateY(${i * angle}deg) translateZ(${radius - 1}px) rotateY(180deg)`;
        background = '#0a0a0a';
      } else {
        transform = `rotateY(${i * angle}deg) translateZ(${radius}px)`;
        
        const angleRad = (i * angle) * Math.PI / 180;
        const light = Math.cos(angleRad - 0.5); 
        const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
        const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;
        
        let baseDesign = '';
        if (type === 'body') {
          baseDesign = 'linear-gradient(to bottom, var(--white-plastic) 25%, var(--label-gold) 25%, var(--label-gold) 75%, var(--white-plastic) 75%)';
        } else if (type === 'neck') {
          baseDesign = 'repeating-linear-gradient(-15deg, #e0e0e0 0px, #e0e0e0 2px, #ccc 3px, #e8e8e8 4px, #e0e0e0 5px)';
        } else if (type === 'cap') {
          baseDesign = 'linear-gradient(to bottom, #1a1a1a, #1a1a1a)';
        }
        
        const lightingOverlay = `linear-gradient(rgba(255,255,255,${highlight}), rgba(255,255,255,${highlight})), linear-gradient(rgba(0,0,0,${darkness}), rgba(0,0,0,${darkness}))`;
        background = `${lightingOverlay}, ${baseDesign}`;
      }

      elements.push(
        <div
          key={`${type}-${i}`}
          className="bottle-face"
          style={{
            position: 'absolute',
            top: 0,
            backfaceVisibility: 'hidden',
            width: faceWidth,
            height: height,
            left: radius - faceWidth/2,
            transform,
            background
          }}
        />
      );
    }
    return elements;
  };

  const bodyElements = useMemo(() => createCylinder(resolution, 90, 120, 'body', false), [resolution]);
  const neckElements = useMemo(() => createCylinder(resolution, 70, 20, 'neck', false), [resolution]);
  const capElements = useMemo(() => createCylinder(resolution, 74, 34, 'cap', false), [resolution]);
  const capInnerElements = useMemo(() => createCylinder(resolution, 72, 34, 'cap', true), [resolution]);

  return (
    <div className="bottle-scene">
      <div className="bottle-camera">
        <div className="bottle-shadow"></div>
        <div className="bottle-container">
           <div className="bottle-body">{bodyElements}</div>
           <div className="bottle-disk base-disk"></div>
           <div className="bottle-disk shoulder-disk"></div>
           
           <div className="bottle-neck">{neckElements}</div>
           <div className="bottle-disk neck-top-disk"></div>
           
           <div className="bottle-cap">
               {capElements}
               {capInnerElements}
               <div className="bottle-disk cap-top-disk"></div>
               <div className="bottle-disk cap-inner-ceiling"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
