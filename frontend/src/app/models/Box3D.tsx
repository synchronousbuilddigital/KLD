import React from 'react';

export type BoxState = 'closed' | 'open' | 'flat';

interface Props {
  boxState: BoxState;
  type: string;
}

/* Color palette per box type */
function getColors(type: string) {
  switch (type) {
    case 'Gift Box':
      return { bg: '#2e2e2e', border: '#444', accent: '#B8956A', inner: '#3a3a3a' };
    case 'Pizza Box':
      return { bg: '#d4a76a', border: '#b8864a', accent: '#8B4513', inner: '#e8c494' };
    case 'Paper Bag':
      return { bg: '#c9a87c', border: '#a88960', accent: '#7a6040', inner: '#ddc4a0' };
    case 'Pouch':
      return { bg: '#f5f0e8', border: '#d4c8b4', accent: '#B8956A', inner: '#faf7f2' };
    case 'Tuck End':
    default:
      return { bg: '#C89A63', border: '#B58556', accent: '#8B6A3E', inner: '#ddb882' };
  }
}

export default function Box3D({ boxState, type }: Props) {
  const W = 200, D = 150, H = 80, F = 25, E = 25;
  const colors = getColors(type);

  const getTransforms = (state: BoxState) => {
    switch (state) {
      case 'flat':
        return {
          back: 'rotateX(0deg)',
          topLid: 'rotateX(0deg)',
          lidFlap: 'rotateX(0deg)',
          lidLeftEar: 'rotateY(0deg)',
          lidRightEar: 'rotateY(0deg)',
          front: 'rotateX(0deg)',
          frontFlap: 'rotateX(0deg)',
          left: 'rotateY(0deg)',
          leftFlapBack: 'rotateX(0deg)',
          leftFlapFront: 'rotateX(0deg)',
          right: 'rotateY(0deg)',
          rightFlapBack: 'rotateX(0deg)',
          rightFlapFront: 'rotateX(0deg)'
        };
      case 'open':
        return {
          back: 'rotateX(-90deg)',
          topLid: 'rotateX(15deg)',
          lidFlap: 'rotateX(0deg)',
          lidLeftEar: 'rotateY(0deg)',
          lidRightEar: 'rotateY(0deg)',
          front: 'rotateX(90deg)',
          frontFlap: 'rotateX(90deg)',
          left: 'rotateY(90deg)',
          leftFlapBack: 'rotateX(90deg)',
          leftFlapFront: 'rotateX(90deg)',
          right: 'rotateY(-90deg)',
          rightFlapBack: 'rotateX(90deg)',
          rightFlapFront: 'rotateX(90deg)'
        };
      case 'closed':
      default:
        return {
          back: 'rotateX(-90deg)',
          topLid: 'rotateX(90deg)',
          lidFlap: 'rotateX(90deg) translateZ(1.5px)',
          lidLeftEar: 'rotateY(-90deg)',
          lidRightEar: 'rotateY(90deg)',
          front: 'rotateX(90deg)',
          frontFlap: 'rotateX(90deg)',
          left: 'rotateY(90deg)',
          leftFlapBack: 'rotateX(90deg)',
          leftFlapFront: 'rotateX(90deg)',
          right: 'rotateY(-90deg)',
          rightFlapBack: 'rotateX(90deg)',
          rightFlapFront: 'rotateX(90deg)'
        };
    }
  };

  const t = getTransforms(boxState);

  const face = (
    w: number, h: number,
    pos: React.CSSProperties,
    hinge: string,
    transform: string,
    isInner?: boolean,
    children?: React.ReactNode
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
        boxShadow: `inset 0 0 12px rgba(0,0,0,0.12)`,
        borderRadius: '2px',
        ...pos,
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
      {/* Bottom */}
      <div style={{
        position: 'absolute',
        width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        backgroundColor: colors.inner,
        border: `1px solid ${colors.border}`,
        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.12)',
        borderRadius: '2px',
      }}>
        {/* Back wall */}
        {face(W, H, { top: -H }, 'bottom center', t.back, false,
          <>
            {/* Top lid */}
            {face(W, D, { top: -D }, 'bottom center', t.topLid, false,
              <>
                {/* Lid flap */}
                {face(W, F, { top: -F }, 'bottom center', t.lidFlap, true)}
                {/* Lid left ear */}
                {face(E, D, { left: -E, top: 0 }, 'right center', t.lidLeftEar, true)}
                {/* Lid right ear */}
                {face(E, D, { right: -E, top: 0 }, 'left center', t.lidRightEar, true)}
              </>
            )}
          </>
        )}

        {/* Front wall */}
        {face(W, H, { top: D }, 'top center', t.front, false,
          <>
            {/* Front flap */}
            {face(W, F, { top: H }, 'top center', t.frontFlap, true)}
          </>
        )}

        {/* Left wall */}
        {face(H, D, { left: -H, top: 0 }, 'right center', t.left, false,
          <>
            {face(H, F, { top: -F }, 'bottom center', t.leftFlapBack, true)}
            {face(H, F, { top: D }, 'top center', t.leftFlapFront, true)}
          </>
        )}

        {/* Right wall */}
        {face(H, D, { right: -H, top: 0 }, 'left center', t.right, false,
          <>
            {face(H, F, { top: -F }, 'bottom center', t.rightFlapBack, true)}
            {face(H, F, { top: D }, 'top center', t.rightFlapFront, true)}
          </>
        )}
      </div>
    </div>
  );
}
