import React, { useMemo } from 'react';
import './Can3D.css';

export default function Can3D() {
  const faces = 36;
  const diameter = 90;
  const height = 150;
  const radius = diameter / 2;
  const angle = 360 / faces;
  const faceWidth = (diameter * Math.tan(Math.PI / faces)) + 0.8;

  // Base Aluminum Cylinder Body
  const bodyElements = useMemo(() => {
    const elements = [];

    for (let i = 0; i < faces; i++) {
      const transform = `rotateY(${i * angle}deg) translateZ(${radius}px)`;
      const angleRad = (i * angle) * Math.PI / 180;
      const light = Math.cos(angleRad - 0.4);

      // Smooth cosine lighting
      const darkness = light < 0 ? Math.abs(light) * 0.4 : 0;
      const highlight = light > 0.8 ? (light - 0.8) * 1.6 : 0;

      elements.push(
        <div
          key={i}
          className="can-face"
          style={{
            width: `${faceWidth}px`,
            height: `${height}px`,
            left: `${radius - faceWidth / 2}px`,
            transform,
            background: `
              linear-gradient(
                rgba(255, 255, 255, ${highlight * 0.6}),
                rgba(0, 0, 0, ${darkness * 0.4})
              ),
              linear-gradient(
                to bottom,
                #b0bccb 0%,
                #8a9aa9 5%,
                #f1f5f9 6%,
                #e2e8f0 92%,
                #8a9aa9 93%,
                #64748b 100%
              )
            `,
          }}
        />
      );
    }
    return elements;
  }, [faces, diameter, height, radius, angle, faceWidth]);

  // Curved Label wrapped flush to cylinder surface
  const labelSlices = useMemo(() => {
    const labelFaceCount = 16; // 16 faces = 160 degrees of arc coverage
    const labelHeight = 114;
    const labelWidth = labelFaceCount * faceWidth;
    const elements = [];

    for (let k = 0; k < labelFaceCount; k++) {
      // Center the label around front (angle 0)
      const sliceAngle = (k - (labelFaceCount - 1) / 2) * angle;

      elements.push(
        <div
          key={`label-slice-${k}`}
          className="can-label-slice"
          style={{
            width: `${faceWidth}px`,
            height: `${labelHeight}px`,
            top: `${(height - labelHeight) / 2}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${sliceAngle}deg) translateZ(${radius + 0.4}px)`,
          }}
        >
          <div
            className="can-label-art"
            style={{
              width: `${labelWidth}px`,
              height: `${labelHeight}px`,
              left: `${-k * faceWidth}px`,
            }}
          >
            {/* Background design elements */}
            <div className="can-art-shape-tan" />
            <div className="can-art-shape-blue" />
            
            {/* Center Typography & Branding */}
            <div className="can-art-content">
              <span className="can-art-brand">KLD</span>
              <span className="can-art-tag">ORGANIC PACKAGING</span>
              <div className="can-art-divider" />
              <span className="can-art-desc">SPARKLING SODA</span>
              <span className="can-art-sub">NATURAL BOTANICAL EXTRACT</span>
              <span className="can-art-vol">330 ML ℮ 11.2 FL. OZ.</span>
            </div>

            {/* Side Barcode on label */}
            <div className="can-art-barcode">
              <div className="can-barcode-lines" />
              <span>0 12345 67890 5</span>
            </div>
          </div>
        </div>
      );
    }
    return elements;
  }, [angle, faceWidth, height, radius]);

  return (
    <div className="can-scene">
      <div className="can-camera">
        {/* Soft floor contact shadow */}
        <div className="can-shadow" />

        {/* Cylinder Body */}
        <div className="can-body">
          {bodyElements}
          {labelSlices}
        </div>

        {/* Brushed Aluminum Top Neck & Chime Ring */}
        <div className="can-top-rim" />

        {/* Can Lid with Animated Tab */}
        <div className="can-lid-container">
          <div className="can-lid-surface">
            <div className="can-lid-hole" />
            <div className="can-opening-flap" />
            <div className="can-ring-tab" />
            <div className="can-rivet" />
          </div>
        </div>

        {/* Bottom Tapered Rim */}
        <div className="can-base" />
      </div>
    </div>
  );
}
