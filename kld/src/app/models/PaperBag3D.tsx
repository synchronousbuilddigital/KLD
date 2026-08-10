import React from 'react';
import './PaperBag3D.css';

export default function PaperBag3D() {
  return (
    <div className="bag-scene">
      <div className="bag-camera">
        <div className="bag-shadow"></div>
        <div className="bag-container">
          <div className="bag-body">
            <div className="bag-face bag-face-front"></div>
            <div className="bag-face bag-face-back"></div>
            <div className="bag-face bag-face-left">
              {/* Accordion fold line */}
              <div style={{ position: 'absolute', top: 0, left: '30px', width: '1px', height: '150px', background: 'rgba(0,0,0,0.1)' }}></div>
            </div>
            <div className="bag-face bag-face-right">
              <div style={{ position: 'absolute', top: 0, left: '30px', width: '1px', height: '150px', background: 'rgba(0,0,0,0.1)' }}></div>
            </div>
            <div className="bag-face bag-face-bottom"></div>
            <div className="bag-face bag-face-inner-floor"></div>
            <div className="bag-face bag-face-inner-back"></div>
            
            <div className="bag-handle bag-handle-front"></div>
            <div className="bag-handle bag-handle-back"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
