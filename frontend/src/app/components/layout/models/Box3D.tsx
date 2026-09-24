import React from 'react';
import './Box3D.css';

export type BoxState = 'closed' | 'open' | 'flat';

interface Props {
  boxState: BoxState;
  type: string;
}

export default function Box3D({ boxState }: Props) {
  // Proportions for Mailer Box (Roll-End Tuck-Top)
  const W = 160; // Width
  const D = 120; // Depth
  const H = 46;  // Height
  const F = 20;  // Flap depth
  const E = 20;  // Ear width

  const isFlat = boxState === 'flat';
  const isOpen = boxState === 'open';

  // Staggered transitions for realistic physical assembly sequence
  const wallTransition = 'transform 1.0s cubic-bezier(0.25, 1, 0.5, 1)';
  const lidTransition = isFlat 
    ? 'transform 1.0s cubic-bezier(0.25, 1, 0.5, 1) 0.1s' 
    : 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
  const flapTransition = isOpen
    ? 'transform 1.1s cubic-bezier(0.2, 0.9, 0.3, 1) 0.18s'
    : 'transform 0.9s cubic-bezier(0.25, 1, 0.5, 1)';

  return (
    <div className="box3d-scene">
      <div className="box3d-camera">
        {/* Soft floor shadow */}
        <div 
          className={`box3d-shadow ${isOpen ? 'box3d-shadow--open' : ''} ${isFlat ? 'box3d-shadow--flat' : ''}`} 
        />

        {/* 1. Bottom Floor of Box (Anchor of hierarchy) */}
        <div
          className="box3d-face box3d-face--inner"
          style={{
            width: `${W}px`,
            height: `${D}px`,
            left: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner Floor Stamp */}
          <div className="box3d-inner-stamp">
            KLD • PACKAGING
          </div>

          {/* 2. Rear Wall (Hinged at top of bottom floor) */}
          <div
            className="box3d-face box3d-face--inner"
            style={{
              width: `${W}px`,
              height: `${H}px`,
              left: 0,
              top: `-${H}px`,
              transformOrigin: 'bottom center',
              transform: isFlat ? 'rotateX(0deg)' : 'rotateX(-90deg)',
              transition: wallTransition,
            }}
          >
            {/* 3. Top Hinged Lid (Hinged at top of rear wall) */}
            <div
              className="box3d-face"
              style={{
                width: `${W}px`,
                height: `${D}px`,
                left: 0,
                top: `-${D}px`,
                transformOrigin: 'bottom center',
                transform: isFlat 
                  ? 'rotateX(0deg)' 
                  : isOpen 
                    ? 'rotateX(28deg)' 
                    : 'rotateX(-90deg)',
                transition: lidTransition,
              }}
            >
              {/* Outer Lid Branding (Right-side up facing viewer when closed) */}
              <div className="box3d-lid-art">
                <div className="box3d-organic-shape" />
                <div className="box3d-organic-shape-2" />
                <span className="box3d-brand-logo">KLD</span>
                <span className="box3d-brand-subtitle">PACKAGING</span>
                <span className="box3d-brand-detail">SUSTAINABLE MAILER</span>
              </div>

              {/* Inner Lid Custom Unboxing Greeting (Visible when opened) */}
              <div className="box3d-lid-inner-art">
                <span className="box3d-inner-hello">UNBOX THE EXTRAORDINARY</span>
                <div className="box3d-inner-divider" />
                <span className="box3d-inner-link">WWW.KLDPACKAGING.COM</span>
              </div>

              {/* 4. Lid Front Tuck Flap (Hinged at top edge of lid) */}
              <div
                className="box3d-face"
                style={{
                  width: `${W - 4}px`,
                  height: `${F}px`,
                  left: '2px',
                  top: `-${F}px`,
                  transformOrigin: 'bottom center',
                  transform: isFlat 
                    ? 'rotateX(0deg)' 
                    : isOpen 
                      ? 'rotateX(-45deg)' 
                      : 'rotateX(-90deg) translateZ(1.5px)',
                  borderRadius: '4px 4px 0 0',
                  transition: flapTransition,
                }}
              />

              {/* 5. Left Cherry Locking Ear (Hinged on left edge of lid) */}
              <div
                className="box3d-face"
                style={{
                  width: `${E}px`,
                  height: `${D - 10}px`,
                  left: `-${E}px`,
                  top: '5px',
                  transformOrigin: 'right center',
                  transform: isFlat 
                    ? 'rotateY(0deg)' 
                    : isOpen 
                      ? 'rotateY(75deg)' 
                      : 'rotateY(90deg) translateZ(1.5px)',
                  borderRadius: '8px 0 0 8px',
                  transition: flapTransition,
                }}
              />

              {/* 6. Right Cherry Locking Ear (Hinged on right edge of lid) */}
              <div
                className="box3d-face"
                style={{
                  width: `${E}px`,
                  height: `${D - 10}px`,
                  right: `-${E}px`,
                  top: '5px',
                  transformOrigin: 'left center',
                  transform: isFlat 
                    ? 'rotateY(0deg)' 
                    : isOpen 
                      ? 'rotateY(-75deg)' 
                      : 'rotateY(-90deg) translateZ(1.5px)',
                  borderRadius: '0 8px 8px 0',
                  transition: flapTransition,
                }}
              />
            </div>
          </div>

          {/* 7. Front Wall (Hinged at bottom edge of floor) */}
          <div
            className="box3d-face"
            style={{
              width: `${W}px`,
              height: `${H}px`,
              left: 0,
              top: `${D}px`,
              transformOrigin: 'top center',
              transform: isFlat ? 'rotateX(0deg)' : 'rotateX(90deg)',
              transition: wallTransition,
            }}
          >
            {/* Front Panel Artwork */}
            <div className="box3d-front-art">
              <div className="box3d-organic-shape" />
              <div className="box3d-organic-shape-2" />
              <span className="box3d-brand-logo">KLD</span>
              <span className="box3d-brand-subtitle">PACKAGING</span>
              <span className="box3d-brand-detail">READY PACK • 100% ECO</span>
            </div>

            {/* Front Rollover Inner Locking Flap */}
            <div
              className="box3d-face box3d-face--inner"
              style={{
                width: `${W - 2}px`,
                height: `${H - 2}px`,
                left: '1px',
                top: `${H}px`,
                transformOrigin: 'top center',
                transform: isFlat ? 'rotateX(0deg)' : 'rotateX(90deg)',
                transition: flapTransition,
              }}
            />
          </div>

          {/* 8. Left Wall (Hinged at left edge of floor) */}
          <div
            className="box3d-face box3d-face--inner"
            style={{
              width: `${H}px`,
              height: `${D}px`,
              left: `-${H}px`,
              top: 0,
              transformOrigin: 'right center',
              transform: isFlat ? 'rotateY(0deg)' : 'rotateY(90deg)',
              transition: wallTransition,
            }}
          >
            {/* Left Back Dust Flap (folds inside behind rear wall) */}
            <div
              className="box3d-face box3d-face--inner"
              style={{
                width: `${H - 2}px`,
                height: `${F}px`,
                left: 0,
                top: `-${F}px`,
                transformOrigin: 'bottom center',
                transform: isFlat ? 'rotateX(0deg)' : 'rotateX(-88deg) translateZ(-1px)',
                borderRadius: '3px 0 0 0',
                transition: flapTransition,
              }}
            />

            {/* Left Front Dust Flap (folds inside behind front wall) */}
            <div
              className="box3d-face box3d-face--inner"
              style={{
                width: `${H - 2}px`,
                height: `${F}px`,
                left: 0,
                top: `${D}px`,
                transformOrigin: 'top center',
                transform: isFlat ? 'rotateX(0deg)' : 'rotateX(88deg) translateZ(-1px)',
                borderRadius: '0 0 0 3px',
                transition: flapTransition,
              }}
            />
          </div>

          {/* 9. Right Wall (Hinged at right edge of floor) */}
          <div
            className="box3d-face box3d-face--inner"
            style={{
              width: `${H}px`,
              height: `${D}px`,
              right: `-${H}px`,
              top: 0,
              transformOrigin: 'left center',
              transform: isFlat ? 'rotateY(0deg)' : 'rotateY(-90deg)',
              transition: wallTransition,
            }}
          >
            {/* Right Back Dust Flap */}
            <div
              className="box3d-face box3d-face--inner"
              style={{
                width: `${H - 2}px`,
                height: `${F}px`,
                left: 0,
                top: `-${F}px`,
                transformOrigin: 'bottom center',
                transform: isFlat ? 'rotateX(0deg)' : 'rotateX(-88deg) translateZ(-1px)',
                borderRadius: '0 3px 0 0',
                transition: flapTransition,
              }}
            />

            {/* Right Front Dust Flap */}
            <div
              className="box3d-face box3d-face--inner"
              style={{
                width: `${H - 2}px`,
                height: `${F}px`,
                left: 0,
                top: `${D}px`,
                transformOrigin: 'top center',
                transform: isFlat ? 'rotateX(0deg)' : 'rotateX(88deg) translateZ(-1px)',
                borderRadius: '0 0 3px 0',
                transition: flapTransition,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
