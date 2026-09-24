import React from 'react';
import './Pouch3D.css';

export default function Pouch3D() {
  return (
    <div className="pouch-scene">
      <div className="pouch-camera">
        <div className="pouch-shadow" />

        <div className="pouch-container">
          {/* Main Stand-up Pouch Assembly */}
          <div className="pouch-body-wrap">
            {/* Top Heat-Seal Bar with Tear Notches & Zipper */}
            <div className="pouch-top-seal">
              <div className="pouch-tear-notch pouch-tear-left" />
              <div className="pouch-tear-notch pouch-tear-right" />
              <div className="pouch-seal-pattern" />
              <div className="pouch-zipper-track" />
            </div>

            {/* Front Panel (Curved 3D feel with side heat-seals) */}
            <div className="pouch-panel pouch-panel-front">
              <div className="pouch-side-seal pouch-seal-left" />
              <div className="pouch-side-seal pouch-seal-right" />

              {/* Degassing Valve Indicator */}
              <div className="pouch-valve">
                <div className="pouch-valve-core" />
              </div>

              {/* Front Label Artwork */}
              <div className="pouch-label-art">
                <span className="pouch-brand-origin">ORIGIN RESERVE</span>
                <div className="pouch-brand-divider" />
                <h3 className="pouch-brand-title">KLD COFFEE</h3>
                <span className="pouch-brand-sub">SINGLE ORIGIN ETHIOPIA</span>
                
                <div className="pouch-notes-box">
                  <span>JASMINE • BERGAMOT • PEACH</span>
                </div>

                <div className="pouch-label-bottom">
                  <span>WHOLE BEAN</span>
                  <span>250G / 8.8 OZ</span>
                </div>
              </div>
            </div>

            {/* Back Panel */}
            <div className="pouch-panel pouch-panel-back">
              <div className="pouch-side-seal pouch-seal-left" />
              <div className="pouch-side-seal pouch-seal-right" />

              <div className="pouch-back-art">
                <h5 className="pouch-back-heading">ROASTER'S NOTES</h5>
                <p className="pouch-back-text">
                  Hand-harvested at 2,000m elevation. Nitrogen-flushed valve packaging preserves maximum aromatics.
                </p>
                <div className="pouch-back-cert">
                  <span>FAIR TRADE CERTIFIED</span>
                  <span>100% ARABICA</span>
                </div>
              </div>
            </div>

            {/* Bottom Gusset (Expands inward, giving the authentic 3D pouch depth) */}
            <div className="pouch-bottom-gusset">
              <div className="pouch-gusset-crease" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
