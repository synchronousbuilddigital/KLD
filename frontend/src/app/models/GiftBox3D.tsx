import React from 'react';
import './GiftBox3D.css';

export default function GiftBox3D() {
  return (
    <div className="giftbox-scene">
      <div className="giftbox-camera">
        <div className="giftbox-shadow"></div>
        <div className="giftbox-container">
          <div className="giftbox-base">
            <div className="giftbox-face-base giftbox-bb-front"></div>
            <div className="giftbox-face-base giftbox-bb-back"></div>
            <div className="giftbox-face-base giftbox-bb-left"></div>
            <div className="giftbox-face-base giftbox-bb-right"></div>
            <div className="giftbox-face-base giftbox-bb-bottom"></div>
            <div className="giftbox-face-base giftbox-bb-inner-floor"></div>
            <div className="giftbox-face-base giftbox-bb-inner-back"></div>
            <div className="giftbox-face-base giftbox-bb-inner-left"></div>
            <div className="giftbox-face-base giftbox-bb-inner-right"></div>
          </div>
          <div className="giftbox-lid">
            <div className="giftbox-face-lid giftbox-bl-front"></div>
            <div className="giftbox-face-lid giftbox-bl-back"></div>
            <div className="giftbox-face-lid giftbox-bl-left"></div>
            <div className="giftbox-face-lid giftbox-bl-right"></div>
            <div className="giftbox-face-lid giftbox-bl-top"></div>
            <div className="giftbox-face-lid giftbox-bl-inner-ceiling"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
