import React, { useMemo } from 'react';
import './SupplementJar3D.css';

export default function SupplementJar3D() {
  const faces = 24;
  const radius = 42;
  const height = 95;
  const angle = 360 / faces;
  const faceWidth = (radius * 2 * Math.tan(Math.PI / faces)) + 0.8;

  // Tub body facets with matte studio lighting
  const tubFaces = useMemo(() => {
    const elements = [];

    for (let i = 0; i < faces; i++) {
      const rad = (i * angle * Math.PI) / 180;
      const light = Math.cos(rad - Math.PI / 4);
      const intensity = 0.5 + 0.5 * light;

      // Matte obsidian / dark charcoal plastic
      const baseVal = 26;
      const val = Math.round(baseVal * (0.6 + 0.8 * intensity));

      elements.push(
        <div
          key={i}
          className="tub-facet"
          style={{
            position: 'absolute',
            width: `${faceWidth}px`,
            height: `${height}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            background: `linear-gradient(to bottom, rgb(${val + 10},${val + 10},${val + 10}) 0%, rgb(${val},${val},${val}) 70%, rgb(${Math.max(10, val - 8)},${Math.max(10, val - 8)},${Math.max(10, val - 8)}) 100%)`,
            backfaceVisibility: 'hidden',
          }}
        />
      );
    }
    return elements;
  }, [faces, radius, height, angle, faceWidth]);

  // Curved UV-mapped nutrition label wrapped flush around tub surface
  const labelSlices = useMemo(() => {
    const labelFaceCount = 14; // 14 faces = ~210 degrees of wrap
    const labelHeight = 80;
    const labelWidth = labelFaceCount * faceWidth;
    const elements = [];

    for (let k = 0; k < labelFaceCount; k++) {
      const sliceAngle = (k - (labelFaceCount - 1) / 2) * angle;

      elements.push(
        <div
          key={`supp-label-slice-${k}`}
          className="supp-label-slice"
          style={{
            width: `${faceWidth}px`,
            height: `${labelHeight}px`,
            top: `${(height - labelHeight) / 2}px`,
            left: `${radius - faceWidth / 2}px`,
            transform: `rotateY(${sliceAngle}deg) translateZ(${radius + 0.3}px)`,
          }}
        >
          <div
            className="supp-label-wrap"
            style={{
              width: `${labelWidth}px`,
              height: `${labelHeight}px`,
              left: `${-k * faceWidth}px`,
            }}
          >
            <div className="supp-badge-header">
              <span className="supp-badge-brand">KLD LABS</span>
              <span className="supp-badge-edition">SERIES 01</span>
            </div>
            
            <div className="supp-badge-accent-bar" />

            <h3 className="supp-badge-title">WHEY ISOLATE</h3>
            <span className="supp-badge-formula">100% HYDROLYZED PEPTIDES</span>

            <div className="supp-badge-stats">
              <div className="supp-stat">
                <span className="supp-stat-val">27G</span>
                <span className="supp-stat-lbl">PROTEIN</span>
              </div>
              <div className="supp-stat-sep" />
              <div className="supp-stat">
                <span className="supp-stat-val">6.2G</span>
                <span className="supp-stat-lbl">BCAAS</span>
              </div>
              <div className="supp-stat-sep" />
              <div className="supp-stat">
                <span className="supp-stat-val">0G</span>
                <span className="supp-stat-lbl">SUGAR</span>
              </div>
            </div>

            <div className="supp-badge-footer">
              <span>CHOCOLATE FUDGE</span>
              <span>NET WT 2.0 LBS (908G)</span>
            </div>
          </div>
        </div>
      );
    }
    return elements;
  }, [angle, faceWidth, height, radius]);

  // Ribbed Lid facets
  const lidFaces = useMemo(() => {
    const lidCount = 28;
    const lidRadius = 44;
    const lidHeight = 24;
    const lidFaceWidth = (lidRadius * 2 * Math.tan(Math.PI / lidCount)) + 1.2;
    const angleStep = 360 / lidCount;
    const elements = [];

    for (let i = 0; i < lidCount; i++) {
      const lidAngle = i * angleStep;
      const rad = (lidAngle * Math.PI) / 180;
      const light = Math.cos(rad - Math.PI / 4);
      const val = Math.round(24 + 18 * light);

      elements.push(
        <div
          key={`lid-${i}`}
          className="tub-lid-facet"
          style={{
            position: 'absolute',
            width: `${lidFaceWidth}px`,
            height: `${lidHeight}px`,
            left: `${lidRadius - lidFaceWidth / 2}px`,
            transform: `rotateY(${lidAngle}deg) translateZ(${lidRadius}px)`,
            background: `repeating-linear-gradient(to right, rgb(${val + 15},${val + 15},${val + 15}) 0px, rgb(${val + 15},${val + 15},${val + 15}) 1.5px, rgb(${val - 5},${val - 5},${val - 5}) 1.5px, rgb(${val - 5},${val - 5},${val - 5}) 3px)`,
            backfaceVisibility: 'hidden',
          }}
        />
      );
    }
    return elements;
  }, []);

  return (
    <div className="supp-scene">
      <div className="supp-camera">
        <div className="supp-shadow" />

        <div className="supp-container">
          {/* Main Tub Body with Curved UV Label */}
          <div className="supp-body-wrap">
            {tubFaces}
            {labelSlices}
          </div>

          {/* Tub Base Disk */}
          <div className="supp-base-disk" />

          {/* Silver Foil Induction Seal (tamper-evident disc under lid) */}
          <div className="supp-seal-disk">
            <span className="supp-seal-text">SEALED FOR YOUR PROTECTION</span>
          </div>

          {/* Ribbed Screw-On Lid Assembly */}
          <div className="supp-lid-assembly">
            <div className="supp-lid-top-disk" />
            {lidFaces}
            <div className="supp-lid-bottom-disk" />
          </div>
        </div>
      </div>
    </div>
  );
}
