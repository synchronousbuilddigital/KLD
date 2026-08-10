import React from 'react';
import { BoxState } from './Box3D'; // Reuse the same BoxState type

interface Props {
  animState: BoxState;
}

export default function PizzaBox3D({ animState }: Props) {
  // Pizza box proportions: Wide and deep, but short.
  const W = 220; // Width
  const D = 220; // Depth
  const H = 40;  // Height
  const F = 38;  // Lid front tuck flap
  const SideFlap = 38; // Side tuck flaps

  const colors = { bg: '#e0c097', border: '#c49a6c', inner: '#f0d8b6', print: '#c0392b' };

  const getTransforms = (state: BoxState) => {
    switch (state) {
      case 'flat':
        return {
          back: 'rotateX(0deg)',
          lid: 'rotateX(0deg)',
          lidFrontFlap: 'rotateX(0deg)',
          lidLeftFlap: 'rotateY(0deg)',
          lidRightFlap: 'rotateY(0deg)',
          front: 'rotateX(0deg)',
          left: 'rotateY(0deg)',
          right: 'rotateY(0deg)'
        };
      case 'open':
        return {
          back: 'rotateX(-90deg)',
          lid: 'rotateX(45deg)', // Lid open at 45 degrees relative to back
          lidFrontFlap: 'rotateX(-90deg)',
          lidLeftFlap: 'rotateY(-90deg)',
          lidRightFlap: 'rotateY(90deg)',
          front: 'rotateX(90deg)',
          left: 'rotateY(90deg)',
          right: 'rotateY(-90deg)'
        };
      case 'closed':
      default:
        return {
          back: 'rotateX(-90deg)',
          lid: 'rotateX(90deg)', // Lid closed
          lidFrontFlap: 'rotateX(-90deg) translateZ(-1px)',
          lidLeftFlap: 'rotateY(-90deg) translateZ(-1px)',
          lidRightFlap: 'rotateY(90deg) translateZ(-1px)',
          front: 'rotateX(90deg)',
          left: 'rotateY(90deg)',
          right: 'rotateY(-90deg)'
        };
    }
  };

  const t = getTransforms(animState);

  const face = (
    w: number, h: number,
    pos: React.CSSProperties,
    hinge: string,
    transform: string,
    isInner?: boolean,
    children?: React.ReactNode,
    extraStyle?: React.CSSProperties
  ): React.ReactNode => (
    <div
      style={{
        position: 'absolute',
        width: w,
        height: h,
        transformOrigin: hinge,
        transform,
        transformStyle: 'preserve-3d',
        transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        backgroundColor: isInner ? colors.inner : colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: `inset 0 0 15px rgba(0,0,0,0.08)`,
        borderRadius: '2px',
        ...pos,
        ...extraStyle
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{
      width: W, height: D,
      position: 'relative',
      transformStyle: 'preserve-3d',
      transform: 'rotateX(60deg) rotateZ(-30deg)',
      transition: 'transform 0.6s ease'
    }}>
      {/* Bottom base */}
      <div style={{
        position: 'absolute',
        width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        backgroundColor: colors.inner,
        border: `1px solid ${colors.border}`,
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1)',
      }}>
        {/* Inside Pizza graphic */}
        <div style={{
          position: 'absolute', top: '10%', left: '10%', width: '80%', height: '80%',
          borderRadius: '50%', background: '#e67e22', border: '8px solid #d35400',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)', opacity: animState === 'closed' ? 0 : 1,
          transition: 'opacity 0.5s',
        }}>
           {/* Pepperonis */}
           <div style={{ position: 'absolute', top: '20%', left: '30%', width: 25, height: 25, borderRadius: '50%', background: '#c0392b' }}/>
           <div style={{ position: 'absolute', top: '60%', left: '40%', width: 25, height: 25, borderRadius: '50%', background: '#c0392b' }}/>
           <div style={{ position: 'absolute', top: '40%', left: '70%', width: 25, height: 25, borderRadius: '50%', background: '#c0392b' }}/>
           <div style={{ position: 'absolute', top: '70%', left: '70%', width: 25, height: 25, borderRadius: '50%', background: '#c0392b' }}/>
        </div>

        {/* Back wall */}
        {face(W, H, { top: -H }, 'bottom center', t.back, false,
          <>
            {/* Top lid attached to back wall */}
            {face(W, D, { top: -D }, 'bottom center', t.lid, false,
              <>
                {/* Brand print on lid */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  color: colors.print, fontWeight: 'bold', fontSize: '24px', fontFamily: 'serif',
                  border: `3px solid ${colors.print}`, padding: '10px 20px', borderRadius: '10px',
                  backfaceVisibility: 'hidden'
                }}>
                  ARTISAN PIZZA
                </div>
                {/* Lid Front Tuck Flap */}
                {face(W, F, { top: -F }, 'bottom center', t.lidFrontFlap, true)}
                {/* Lid Left Flap */}
                {face(SideFlap, D, { left: -SideFlap, top: 0 }, 'right center', t.lidLeftFlap, true)}
                {/* Lid Right Flap */}
                {face(SideFlap, D, { right: -SideFlap, top: 0 }, 'left center', t.lidRightFlap, true)}
              </>
            )}
          </>
        )}

        {/* Front wall */}
        {face(W, H, { top: D }, 'top center', t.front, false)}

        {/* Left wall */}
        {face(H, D, { left: -H, top: 0 }, 'right center', t.left, false)}

        {/* Right wall */}
        {face(H, D, { right: -H, top: 0 }, 'left center', t.right, false)}
      </div>
    </div>
  );
}
