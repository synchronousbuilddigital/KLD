import React from 'react';
import { BoxState } from './Box3D';
import './PizzaBox3D.css';

interface Props {
  animState: BoxState;
}

export default function PizzaBox3D({ animState }: Props) {
  // Precision carton dimensions (Roll-End Tuck-Front standard dieline)
  const W = 180; // Width
  const D = 180; // Depth
  const H = 34;  // Wall Height
  const F = 26;  // Front Tuck-in Flap
  const S = 24;  // Side Dust Wings

  const isFlat = animState === 'flat';
  const isOpen = animState === 'open';

  return (
    <div className="pizzabox-scene">
      <div className="pizzabox-camera">
        {/* Contact and floor shadow */}
        <div 
          className={`pizzabox-shadow ${isOpen ? 'pizzabox-shadow--open' : ''} ${isFlat ? 'pizzabox-shadow--flat' : ''}`} 
        />

        <div className="pizzabox-root">
          {/* 1. Bottom Tray Base (Center of Dieline) */}
          <div
            className="pizzabox-face pizzabox-face--inner"
            style={{
              width: `${W}px`,
              height: `${D}px`,
              left: 0,
              top: 0,
            }}
          >
            <div className="pizzabox-inner-stamp">
              KLD • REFT-CORRUGATED • #0426
            </div>

            {/* 2. Rear Wall (Hinged at top of bottom base) */}
            <div
              className="pizzabox-face pizzabox-face--inner"
              style={{
                width: `${W}px`,
                height: `${H}px`,
                left: 0,
                top: `-${H}px`,
                transformOrigin: 'bottom center',
                transform: isFlat ? 'rotateX(0deg)' : 'rotateX(-90deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Ventilation Steam Holes */}
              <div className="pizzabox-vent" />
              <div className="pizzabox-vent" />
              <div className="pizzabox-vent" />

              {/* 3. Top Hinged Lid (Attached to top of rear wall) */}
              <div
                className="pizzabox-face"
                style={{
                  width: `${W}px`,
                  height: `${D}px`,
                  left: 0,
                  top: `-${D}px`,
                  transformOrigin: 'bottom center',
                  transform: isFlat 
                    ? 'rotateX(0deg)' 
                    : isOpen 
                      ? 'rotateX(15deg)' 
                      : 'rotateX(-90deg)',
                }}
              >
                {/* Brand Seal on Lid Top */}
                <div className="pizzabox-brand-seal">
                  <span className="pizzabox-brand-title">KLD PACKAGING</span>
                  <div className="pizzabox-brand-line" />
                  <span className="pizzabox-brand-subtitle">CRAFT ARTISAN CARTON</span>
                  <span className="pizzabox-brand-badge">100% RECYCLED KRAFT</span>
                </div>

                {/* 4. Front Locking Tuck Flap (Attached to top edge of lid) */}
                <div
                  className="pizzabox-face"
                  style={{
                    width: `${W}px`,
                    height: `${F}px`,
                    left: 0,
                    top: `-${F}px`,
                    transformOrigin: 'bottom center',
                    transform: isFlat 
                      ? 'rotateX(0deg)' 
                      : isOpen 
                        ? 'rotateX(-35deg)' 
                        : 'rotateX(-90deg) translateZ(1px)',
                    borderRadius: '4px 4px 0 0',
                  }}
                />

                {/* 5. Left Side Dust Wing (Attached to left edge of lid) */}
                <div
                  className="pizzabox-face"
                  style={{
                    width: `${S}px`,
                    height: `${D - 10}px`,
                    left: `-${S}px`,
                    top: '5px',
                    transformOrigin: 'right center',
                    transform: isFlat 
                      ? 'rotateY(0deg)' 
                      : isOpen 
                        ? 'rotateY(75deg)' 
                        : 'rotateY(90deg) translateZ(1.5px)',
                    borderRadius: '8px 0 0 8px',
                  }}
                />

                {/* 6. Right Side Dust Wing (Attached to right edge of lid) */}
                <div
                  className="pizzabox-face"
                  style={{
                    width: `${S}px`,
                    height: `${D - 10}px`,
                    right: `-${S}px`,
                    top: '5px',
                    transformOrigin: 'left center',
                    transform: isFlat 
                      ? 'rotateY(0deg)' 
                      : isOpen 
                        ? 'rotateY(-75deg)' 
                        : 'rotateY(-90deg) translateZ(1.5px)',
                    borderRadius: '0 8px 8px 0',
                  }}
                />
              </div>
            </div>

            {/* 7. Front Wall of Tray (Hinged at bottom of base) */}
            <div
              className="pizzabox-face pizzabox-face--inner"
              style={{
                width: `${W}px`,
                height: `${H}px`,
                left: 0,
                bottom: `-${H}px`,
                transformOrigin: 'top center',
                transform: isFlat ? 'rotateX(0deg)' : 'rotateX(90deg)',
              }}
            >
              {/* Die-cut thumb opening notch */}
              <div className="pizzabox-thumb-notch" />
            </div>

            {/* 8. Left Wall of Tray */}
            <div
              className="pizzabox-face pizzabox-face--inner"
              style={{
                width: `${H}px`,
                height: `${D}px`,
                left: `-${H}px`,
                top: 0,
                transformOrigin: 'right center',
                transform: isFlat ? 'rotateY(0deg)' : 'rotateY(90deg)',
              }}
            >
              {/* Rolled double wall inner flap for corrugated thickness */}
              <div
                className="pizzabox-face pizzabox-face--inner"
                style={{
                  width: `${H - 2}px`,
                  height: `${D}px`,
                  left: `-${H - 2}px`,
                  top: 0,
                  transformOrigin: 'right center',
                  transform: isFlat ? 'rotateY(0deg)' : 'rotateY(90deg) translateZ(1px)',
                }}
              />
            </div>

            {/* 9. Right Wall of Tray */}
            <div
              className="pizzabox-face pizzabox-face--inner"
              style={{
                width: `${H}px`,
                height: `${D}px`,
                right: `-${H}px`,
                top: 0,
                transformOrigin: 'left center',
                transform: isFlat ? 'rotateY(0deg)' : 'rotateY(-90deg)',
              }}
            >
              {/* Rolled double wall inner flap */}
              <div
                className="pizzabox-face pizzabox-face--inner"
                style={{
                  width: `${H - 2}px`,
                  height: `${D}px`,
                  right: `-${H - 2}px`,
                  top: 0,
                  transformOrigin: 'left center',
                  transform: isFlat ? 'rotateY(0deg)' : 'rotateY(-90deg) translateZ(1px)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
