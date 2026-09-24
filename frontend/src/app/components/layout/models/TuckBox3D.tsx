import React from 'react';
import './TuckBox3D.css';

export default function TuckBox3D() {
  return (
    <div className="tuckbox-scene">
      <div className="tuckbox-camera">
        <div className="tuckbox-shadow" />
        <div className="tuckbox-container">
          <div className="tuckbox-body">
            {/* Front Face with Precision Craft Branding */}
            <div className="tuckbox-face tuckbox-face-front">
              <div className="tuckbox-brand-badge">
                <div className="tuckbox-brand-title">KLD CRAFT</div>
                <div className="tuckbox-brand-line" />
                <div className="tuckbox-brand-sub">REVERSE TUCK</div>
              </div>
            </div>

            {/* Back Face */}
            <div className="tuckbox-face tuckbox-face-back">
              <div style={{
                fontFamily: 'monospace',
                fontSize: '8px',
                color: 'rgba(59, 35, 15, 0.4)',
                letterSpacing: '1px'
              }}>
                DIELINE #0842-RTE
              </div>
            </div>

            {/* Side Walls */}
            <div className="tuckbox-face tuckbox-face-left" />
            <div className="tuckbox-face tuckbox-face-right" />
            <div className="tuckbox-face tuckbox-face-bottom" />
            
            {/* Dust Flaps */}
            <div className="tuckbox-dust-left" />
            <div className="tuckbox-dust-right" />

            {/* Hinged Top Lid & Tuck Tongue */}
            <div className="tuckbox-lid-hinge">
              <div className="tuckbox-top-flap">
                <div className="tuckbox-tuck-flap" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
