import React from 'react';
import { PlacedImage } from '../MockupGenerator';
import './TuckBox3D.css';

interface TuckBox3DProps {
  placedImages: PlacedImage[];
  packageColor: string;
  activeSide: 'outside' | 'inside';
  openProgress: number;
}

export default function TuckBox3D({ placedImages, packageColor, activeSide, openProgress }: TuckBox3DProps) {
  return (
    <div className="tuckbox-scene">
      <div className="tuckbox-camera">
        <div className="tuckbox-shadow"></div>
        <div className="tuckbox-container">
          <div className="tuckbox-body">
            <div className="tuckbox-face tuckbox-face-front">
              <div style={{ textAlign: 'center', marginTop: '35px', fontFamily: 'Arial, sans-serif', color: '#5a422b' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>KRAFT</div>
                <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '5px' }}>PREMIUM BOX</div>
                <div style={{ marginTop: '20px', borderTop: '2px solid #5a422b', width: '40px', marginLeft: '30px' }}></div>
              </div>
            </div>
            <div className="tuckbox-face tuckbox-face-back"></div>
            <div className="tuckbox-face tuckbox-face-left"></div>
            <div className="tuckbox-face tuckbox-face-right"></div>
            <div className="tuckbox-face tuckbox-face-bottom"></div>
            
            <div className="tuckbox-dust-left"></div>
            <div className="tuckbox-dust-right"></div>

            <div className="tuckbox-lid-hinge">
              <div className="tuckbox-top-flap">
                <div className="tuckbox-tuck-flap"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
