import React, { useMemo } from 'react';
import './Bottle3D.css';

export default function Bottle3D() {
  const faces = 24;
  const radius = 35;
  const height = 115;
  const angle = 360 / faces;
  const faceWidth = (radius * 2 * Math.tan(Math.PI / faces)) + 0.8;

  // Amber glass cylinder body facets with studio reflection
  const cylinderFaces = useMemo(() => {
    const elements = [];

    for (let i = 0; i < faces; i++) {
      const rad = (i * angle * Math.PI) / 180;
      const light = Math.cos(rad - Math.PI / 4);
      const intensity = 0.5 + 0.5 * light;

      // Amber glass: deep rich caramel/brown with warm golden specular highlights
      const baseR = 120, baseG = 65, baseB = 25;
      const r = Math.round(baseR * (0.6 + 0.4 * intensity));
      const g = Math.round(baseG * (0.6 + 0.4 * intensity));
      const b = Math.round(baseB * (0.6 + 0.4 * intensity));

      const isSpecular = Math.abs(i * angle - 45) < 25;
      const specularGleam = isSpecular ? 'rgba(255, 200, 120, 0.25)' : 'transparent';

      elements.push(
        <div
          key={i}
          className="bottle-facet"
          style={{
            position: 'absolute',
            width: `${faceWidth}px`,
            height: `${height}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            background: `linear-gradient(to right, ${specularGleam}, transparent), linear-gradient(to bottom, rgb(${r + 15},${g + 10},${b + 5}) 0%, rgb(${r},${g},${b}) 80%, rgb(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b * 0.7)}) 100%)`,
            backfaceVisibility: 'hidden',
          }}
        />
      );
    }
    return elements;
  }, [faces, radius, height, angle, faceWidth]);

  // Curved UV-mapped apothecary label slices wrapped flush against amber glass
  const labelSlices = useMemo(() => {
    const labelFaceCount = 12; // 12 faces = 180 degrees of wrap
    const labelHeight = 85;
    const labelWidth = labelFaceCount * faceWidth;
    const elements = [];

    for (let k = 0; k < labelFaceCount; k++) {
      const sliceAngle = (k - (labelFaceCount - 1) / 2) * angle;

      elements.push(
        <div
          key={`bottle-label-slice-${k}`}
          className="bottle-label-slice"
          style={{
            width: `${faceWidth}px`,
            height: `${labelHeight}px`,
            top: `${(height - labelHeight) / 2 + 5}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${sliceAngle}deg) translateZ(${radius + 0.3}px)`,
          }}
        >
          <div
            className="bottle-label-card"
            style={{
              width: `${labelWidth}px`,
              height: `${labelHeight}px`,
              left: `${-k * faceWidth}px`,
            }}
          >
            <div className="bottle-brand-badge">
              <span className="bottle-badge-est">EST. 2024 • CRAFT BOTANICALS</span>
              <h4 className="bottle-badge-brand">KLD LABS</h4>
              <div className="bottle-badge-divider" />
              <span className="bottle-badge-product">RADIANCE ELIXIR</span>
              <span className="bottle-badge-sub">COLD-PRESSED EXTRACT COMPLEX</span>
              <div className="bottle-badge-vol">30 ML ℮ 1.0 FL. OZ.</div>
            </div>
          </div>
        </div>
      );
    }
    return elements;
  }, [angle, faceWidth, height, radius]);

  return (
    <div className="bottle-scene">
      <div className="bottle-camera">
        <div className="bottle-shadow" />

        <div className="bottle-container">
          {/* Amber Glass Body with Curved Label */}
          <div className="bottle-body-wrap">
            {cylinderFaces}
            {labelSlices}
          </div>

          {/* Rounded Glass Shoulder */}
          <div className="bottle-shoulder-disk" />

          {/* Threaded Glass Neck */}
          <div className="bottle-neck-threaded" />

          {/* Bottom Glass Base */}
          <div className="bottle-base-disk" />

          {/* Dropper Assembly (Collar, Pipette, & Rubber Bulb) */}
          <div className="bottle-dropper-assembly">
            <div className="bottle-dropper-collar">
              <div className="bottle-collar-rim" />
            </div>

            <div className="bottle-dropper-bulb" />

            <div className="bottle-pipette-stem">
              <div className="bottle-pipette-fluid" />
              <div className="bottle-pipette-tip" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
