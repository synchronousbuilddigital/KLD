import React, { useMemo } from 'react';
import './Tube3D.css';

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

export default function Tube3D() {
  const facesOuter = 24;
  const facesInner = 20;
  const facesDetail = 16;

  const createStandardCylinder = (faces: number, diameter: number, height: number, type: string, flip: boolean = false) => {
    const angle = 360 / faces;
    const radius = diameter / 2;
    const faceWidth = (diameter * Math.tan(Math.PI / faces)) + 1.2;
    const elements = [];

    for (let i = 0; i < faces; i++) {
      let transform, bg;
      if (flip) {
        transform = `rotateY(${i * angle}deg) translateZ(${radius - 1}px) rotateY(180deg)`;
        bg = '#111';
      } else {
        transform = `rotateY(${i * angle}deg) translateZ(${radius}px)`;
        const angleRad = (i * angle) * Math.PI / 180;
        const light = Math.cos(angleRad - 0.5);
        const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
        const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;

        if (type === 'neck') {
          const c = blendColor(224, 224, 224, darkness, highlight);
          bg = `repeating-linear-gradient(-15deg, ${c} 0px, ${c} 2px, #999 3px, #e8e8e8 4px, ${c} 5px)`;
        } else if (type === 'cap') {
          bg = blendColor(26, 26, 26, darkness, highlight * 0.4);
        } else if (type === 'crimp') {
          const c = blendColor(204, 204, 204, darkness, highlight);
          bg = `repeating-linear-gradient(to right, ${c} 0px, ${c} 1px, #fff 2px, ${c} 3px)`;
        }
      }

      elements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            width: faceWidth,
            height,
            left: radius - faceWidth / 2,
            transform,
            background: bg,
            backfaceVisibility: 'hidden'
          }}
        />
      );
    }
    return elements;
  };

  const createTubeBody = (slices: number, faces: number, diameter: number, height: number) => {
    const heightPerSlice = height / slices;
    const bodySlices = [];

    for (let j = 0; j < slices; j++) {
      const y = j * heightPerSlice;
      const progress = j / (slices - 1);
      const pinch = Math.pow(progress, 0.6);
      const scaleX = 1 + (1 - pinch) * 0.4;

      const angle = 360 / faces;
      const faceWidth = (diameter * Math.tan(Math.PI / faces)) + 1.2;
      const radius = diameter / 2;

      const sliceFaces = [];
      for (let i = 0; i < faces; i++) {
        const transform = `rotateY(${i * angle}deg) translateZ(${radius}px)`;
        const angleRad = (i * angle) * Math.PI / 180;
        const light = Math.cos(angleRad - 0.5);
        const darkness = light < 0 ? Math.abs(light) * 0.35 : 0;
        const highlight = light > 0.85 ? (light - 0.85) * 1.5 : 0;

        const isLabel = (progress > 0.25 && progress < 0.75);
        let r = 253, g = 253, b = 253; // white plastic
        if (isLabel) { r = 184; g = 149; b = 106; } // gold label

        sliceFaces.push(
          <div
            key={i}
            style={{
              position: 'absolute',
              width: faceWidth,
              height: heightPerSlice + 0.5,
              left: radius - faceWidth / 2,
              transform,
              backfaceVisibility: 'hidden',
              background: blendColor(r, g, b, darkness, highlight)
            }}
          />
        );
      }

      bodySlices.push(
        <div
          key={j}
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            width: diameter,
            height: heightPerSlice,
            transformStyle: 'preserve-3d',
            transform: `scale3d(${scaleX}, 1, ${Math.max(pinch, 0.02)})`
          }}
        >
          {sliceFaces}
        </div>
      );
    }
    return bodySlices;
  };

  const crimp = useMemo(() => createStandardCylinder(facesDetail, 60, 6, 'crimp'), []);
  const body = useMemo(() => createTubeBody(15, facesInner, 60, 120), []);
  const neck = useMemo(() => createStandardCylinder(facesDetail, 30, 15, 'neck'), []);
  const capOuter = useMemo(() => createStandardCylinder(facesOuter, 50, 35, 'cap'), []);
  const capInner = useMemo(() => createStandardCylinder(facesInner, 48, 35, 'cap', true), []);

  return (
    <div className="tube-scene">
      <div className="tube-camera">
        <div className="tube-shadow" />
        <div className="tube-container">
          {/* Pinched Crimp Seal */}
          <div style={{ position: 'absolute', top: 14, left: 20, width: 60, height: 6, transformStyle: 'preserve-3d', transform: 'scale3d(1.4,1,0.05)' }}>
            {crimp}
          </div>

          <div className="tube-body">{body}</div>
          <div className="tube-shoulder-disk disk" />

          <div className="tube-neck">{neck}</div>
          <div className="tube-neck-bottom-disk disk" />

          <div className="tube-cap">
            <div className="tube-cap-bottom-disk disk" />
            <div className="tube-cap-inner-floor disk" />
            {capOuter}
            {capInner}
          </div>
        </div>
      </div>
    </div>
  );
}
