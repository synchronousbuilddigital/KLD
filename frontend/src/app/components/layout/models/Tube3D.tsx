import React, { useMemo } from 'react';
import './Tube3D.css';

export default function Tube3D() {
  const faces = 24;
  const radius = 32;
  const height = 125;
  const angle = 360 / faces;
  const faceWidth = (radius * 2 * Math.tan(Math.PI / faces)) + 0.8;

  // Generate smooth 3D cylinder faces with cosine-based studio lighting
  const cylinderFaces = useMemo(() => {
    const elements = [];

    for (let i = 0; i < faces; i++) {
      const rad = (i * angle * Math.PI) / 180;
      const light = Math.cos(rad - Math.PI / 4);
      const intensity = 0.5 + 0.5 * light;

      // Highlights & shadows on satin cosmetic tube (warm peach blush)
      const baseR = 246, baseG = 236, baseB = 228;
      const r = Math.round(baseR * (0.65 + 0.35 * intensity));
      const g = Math.round(baseG * (0.65 + 0.35 * intensity));
      const b = Math.round(baseB * (0.65 + 0.35 * intensity));

      elements.push(
        <div
          key={i}
          className="tube-body-facet"
          style={{
            position: 'absolute',
            width: `${faceWidth}px`,
            height: `${height}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            background: `linear-gradient(to bottom, rgb(${r},${g},${b}) 0%, rgb(${Math.round(r * 0.96)},${Math.round(g * 0.96)},${Math.round(b * 0.96)}) 100%)`,
            backfaceVisibility: 'hidden',
          }}
        />
      );
    }
    return elements;
  }, [faces, radius, height, angle, faceWidth]);

  // Curved UV-mapped cosmetic label wrapped flush around the tube
  const labelSlices = useMemo(() => {
    const labelFaceCount = 12; // 12 faces = 180 degrees of wrap
    const labelHeight = 85;
    const labelWidth = labelFaceCount * faceWidth;
    const elements = [];

    for (let k = 0; k < labelFaceCount; k++) {
      const sliceAngle = (k - (labelFaceCount - 1) / 2) * angle;

      elements.push(
        <div
          key={`tube-label-slice-${k}`}
          className="tube-label-slice"
          style={{
            width: `${faceWidth}px`,
            height: `${labelHeight}px`,
            top: `${(height - labelHeight) / 2 + 5}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${sliceAngle}deg) translateZ(${radius + 0.3}px)`,
          }}
        >
          <div
            className="tube-label-art"
            style={{
              width: `${labelWidth}px`,
              height: `${labelHeight}px`,
              left: `${-k * faceWidth}px`,
            }}
          >
            <div className="tube-badge-inner">
              <span className="tube-brand-sup">KLD DERMA LAB</span>
              <div className="tube-brand-line" />
              <h4 className="tube-brand-name">BOTANICAL SERUM</h4>
              <p className="tube-brand-desc">PEPTIDE REPAIR + HYDRATE</p>
              <div className="tube-brand-vol">50 ml ℮ 1.7 FL. OZ.</div>
            </div>
          </div>
        </div>
      );
    }
    return elements;
  }, [angle, faceWidth, height, radius]);

  // Cap cylinder facets
  const capFaces = useMemo(() => {
    const capFacesCount = 20;
    const capRadius = 26;
    const capHeight = 28;
    const capFaceWidth = (capRadius * 2 * Math.tan(Math.PI / capFacesCount)) + 1.2;
    const angleStep = 360 / capFacesCount;
    const elements = [];

    for (let i = 0; i < capFacesCount; i++) {
      const capAngle = i * angleStep;
      const rad = (capAngle * Math.PI) / 180;
      const light = Math.cos(rad - Math.PI / 4);
      const baseR = 195, baseG = 145, baseB = 120;
      const r = Math.round(baseR * (0.6 + 0.4 * (0.5 + 0.5 * light)));
      const g = Math.round(baseG * (0.6 + 0.4 * (0.5 + 0.5 * light)));
      const b = Math.round(baseB * (0.6 + 0.4 * (0.5 + 0.5 * light)));

      elements.push(
        <div
          key={`cap-${i}`}
          style={{
            position: 'absolute',
            width: `${capFaceWidth}px`,
            height: `${capHeight}px`,
            left: `${capRadius - capFaceWidth / 2}px`,
            transform: `rotateY(${capAngle}deg) translateZ(${capRadius}px)`,
            background: `linear-gradient(to bottom, rgb(${r + 20},${g + 15},${b + 10}), rgb(${r},${g},${b}))`,
            backfaceVisibility: 'hidden',
          }}
        />
      );
    }
    return elements;
  }, []);

  return (
    <div className="tube-scene">
      <div className="tube-camera">
        <div className="tube-shadow" />
        
        <div className="tube-container">
          {/* Top Crimped Heat-Seal */}
          <div className="tube-crimp-seal">
            <div className="tube-crimp-front">
              <div className="tube-crimp-texture" />
              <span className="tube-crimp-lot">LOT 24B • EXP 11/28</span>
            </div>
            <div className="tube-crimp-back">
              <div className="tube-crimp-texture" />
            </div>
          </div>

          {/* Tube Main Body Cylinder with Curved Label */}
          <div className="tube-body-wrap">
            {cylinderFaces}
            {labelSlices}
          </div>

          {/* Curved Shoulder Disk */}
          <div className="tube-shoulder-disk" />

          {/* Threaded Neck */}
          <div className="tube-neck-tube" />

          {/* Luxury Screw/Flip Cap with animated unscrew */}
          <div className="tube-cap-assembly">
            <div className="tube-cap-top-disk" />
            {capFaces}
            <div className="tube-cap-bottom-disk" />
          </div>
        </div>
      </div>
    </div>
  );
}
