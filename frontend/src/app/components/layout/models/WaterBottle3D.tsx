import React, { useMemo } from 'react';
import './WaterBottle3D.css';

export default function WaterBottle3D() {
  const faces = 24;
  const radius = 34;
  const height = 135;
  const angle = 360 / faces;
  const faceWidth = (radius * 2 * Math.tan(Math.PI / faces)) + 0.8;

  // Hydration bottle facets with glacier ice blue / frosted studio lighting
  const cylinderFaces = useMemo(() => {
    const elements = [];

    for (let i = 0; i < faces; i++) {
      const rad = (i * angle * Math.PI) / 180;
      const light = Math.cos(rad - Math.PI / 4);
      const intensity = 0.5 + 0.5 * light;

      // Glacier Teal / Arctic Blue
      const baseR = 190, baseG = 225, baseB = 238;
      const r = Math.round(baseR * (0.65 + 0.35 * intensity));
      const g = Math.round(baseG * (0.65 + 0.35 * intensity));
      const b = Math.round(baseB * (0.65 + 0.35 * intensity));

      const isSpecular = Math.abs(i * angle - 45) < 25;
      const specularGleam = isSpecular ? 'rgba(255, 255, 255, 0.45)' : 'transparent';

      elements.push(
        <div
          key={i}
          className="water-facet"
          style={{
            position: 'absolute',
            width: `${faceWidth}px`,
            height: `${height}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            background: `linear-gradient(to right, ${specularGleam}, transparent), linear-gradient(to bottom, rgb(${r + 15},${g + 15},${b + 12}) 0%, rgb(${r},${g},${b}) 70%, rgb(${Math.round(r * 0.85)},${Math.round(g * 0.85)},${Math.round(b * 0.9)}) 100%)`,
            backfaceVisibility: 'hidden',
          }}
        />
      );
    }
    return elements;
  }, [faces, radius, height, angle, faceWidth]);

  // Curved UV-mapped hydration label slices wrapped flush around the bottle
  const labelSlices = useMemo(() => {
    const labelFaceCount = 12; // 12 faces = 180 degrees of wrap
    const labelHeight = 85;
    const labelWidth = labelFaceCount * faceWidth;
    const elements = [];

    for (let k = 0; k < labelFaceCount; k++) {
      const sliceAngle = (k - (labelFaceCount - 1) / 2) * angle;

      elements.push(
        <div
          key={`water-label-slice-${k}`}
          className="water-label-slice"
          style={{
            width: `${faceWidth}px`,
            height: `${labelHeight}px`,
            top: `${(height - labelHeight) / 2 + 5}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${sliceAngle}deg) translateZ(${radius + 0.3}px)`,
          }}
        >
          <div
            className="water-label-card"
            style={{
              width: `${labelWidth}px`,
              height: `${labelHeight}px`,
              left: `${-k * faceWidth}px`,
            }}
          >
            <span className="water-brand-sup">PURE HYDRATION</span>
            <h3 className="water-brand-title">KLD HYDRO</h3>
            <div className="water-brand-bar" />
            <span className="water-brand-stat">750 ML • 25 FL. OZ.</span>
            <span className="water-brand-tech">VACUUM INSULATED // 24H COLD</span>
          </div>
        </div>
      );
    }
    return elements;
  }, [angle, faceWidth, height, radius]);

  return (
    <div className="water-scene">
      <div className="water-camera">
        <div className="water-shadow" />

        <div className="water-container">
          {/* Main Bottle Body Cylinder with Curved Label */}
          <div className="water-body-wrap">
            {cylinderFaces}
            {labelSlices}
          </div>

          {/* Curved Shoulder Disk */}
          <div className="water-shoulder-disk" />

          {/* Stainless Steel Neck Chime */}
          <div className="water-neck-steel" />

          {/* Bottom Base Disk */}
          <div className="water-base-disk" />

          {/* Chug Cap with Carry Loop Assembly */}
          <div className="water-cap-assembly">
            <div className="water-cap-body">
              <div className="water-cap-top-disk" />
              <div className="water-cap-rim" />
              <div className="water-carry-loop">
                <div className="water-loop-hole" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
