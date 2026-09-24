import React from 'react';
import './GiftBox3D.css';

export default function GiftBox3D() {
  return (
    <div className="giftbox-scene">
      <div className="giftbox-camera">
        {/* Soft floor shadow */}
        <div className="giftbox-shadow" />

        <div className="giftbox-container">
          {/* Rigid Base */}
          <div className="giftbox-base">
            <div className="giftbox-face-base giftbox-bb-front" />
            <div className="giftbox-face-base giftbox-bb-back" />
            <div className="giftbox-face-base giftbox-bb-left" />
            <div className="giftbox-face-base giftbox-bb-right" />
            <div className="giftbox-face-base giftbox-bb-bottom" />
            <div className="giftbox-face-base giftbox-bb-inner-floor" />
          </div>

          {/* Luxury Telescoping Lid */}
          <div className="giftbox-lid">
            <div className="giftbox-face-lid giftbox-bl-front" />
            <div className="giftbox-face-lid giftbox-bl-back" />
            <div className="giftbox-face-lid giftbox-bl-left" />
            <div className="giftbox-face-lid giftbox-bl-right" />
            
            {/* Top Lid Surface with Gold Foil Branding & Satin Ribbon */}
            <div className="giftbox-face-lid giftbox-bl-top">
              <div className="giftbox-ribbon-v" />
              <div className="giftbox-ribbon-h" />
              <div className="giftbox-gold-seal">
                <span className="giftbox-gold-logo">KLD</span>
                <div className="giftbox-gold-line" />
                <span className="giftbox-gold-sub">LUXURY RIGID BOX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
