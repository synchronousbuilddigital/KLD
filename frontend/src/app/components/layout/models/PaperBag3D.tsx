import React from 'react';
import './PaperBag3D.css';

export default function PaperBag3D() {
  return (
    <div className="bag-scene">
      <div className="bag-camera">
        {/* Soft floor shadow */}
        <div className="bag-shadow" />

        <div className="bag-container">
          <div className="bag-body">
            {/* Front Face with Retail Shopping Bag Brand Artwork */}
            <div className="bag-face bag-face-front">
              <div className="bag-brand-badge">
                {/* Botanical leaf icon (matches thumbnail) */}
                <svg className="bag-brand-icon" viewBox="0 0 24 24" fill="none" stroke="#3b230f" strokeWidth="2">
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.5 9 8 9.8V15h4v6.8c4.5-.8 8-4.8 8-9.8 0-5.5-4.5-10-10-10z" strokeLinejoin="round"/>
                  <path d="M12 2v20" />
                </svg>
                <span className="bag-brand-logo">KLD</span>
                <span className="bag-brand-sub">PACKAGING</span>
                <span className="bag-brand-tag">RETAIL SHOPPING BAG</span>
              </div>
            </div>

            {/* Back Face */}
            <div className="bag-face bag-face-back">
              <div style={{
                fontFamily: 'monospace',
                fontSize: '8px',
                color: 'rgba(59, 35, 15, 0.4)',
                letterSpacing: '1px'
              }}>
                100% RECYCLED KRAFT
              </div>
            </div>

            {/* Accordion Gusset Side Walls */}
            <div className="bag-face bag-face-left">
              <div style={{ position: 'absolute', top: 0, left: '32px', width: '1px', height: '150px', background: 'rgba(0,0,0,0.15)' }} />
            </div>
            <div className="bag-face bag-face-right">
              <div style={{ position: 'absolute', top: 0, left: '32px', width: '1px', height: '150px', background: 'rgba(0,0,0,0.12)' }} />
            </div>

            {/* Bottom Base */}
            <div className="bag-face bag-face-bottom" />
            <div className="bag-face bag-face-inner-floor" />
            <div className="bag-face bag-face-inner-back" />

            {/* Twisted Paper Rope Handles */}
            <div className="bag-handle bag-handle-front" />
            <div className="bag-handle bag-handle-back" />
          </div>
        </div>
      </div>
    </div>
  );
}
