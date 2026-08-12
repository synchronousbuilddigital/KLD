import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Box3D, { BoxState } from '../models/Box3D';
import Bottle3D from '../models/Bottle3D';
import WaterBottle3D from '../models/WaterBottle3D';
import Can3D from '../models/Can3D';
import Tube3D from '../models/Tube3D';
import Cup3D from '../models/Cup3D';
import PizzaBox3D from '../models/PizzaBox3D';
import TuckBox3D from '../models/TuckBox3D';
import GiftBox3D from '../models/GiftBox3D';
import PaperBag3D from '../models/PaperBag3D';
import Pouch3D from '../models/Pouch3D';
import './HoverPreviewCard.css';

export interface TargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
  bottom: number;
}

interface Props {
  item: { label: string; img: string };
  targetRect?: TargetRect | null;
  posX?: number;
  posY?: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function HoverPreviewCard({ item, targetRect, posX = 0, posY = 0, onMouseEnter, onMouseLeave }: Props) {
  const [animState, setAnimState] = useState<BoxState>('closed');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
    return () => setVisible(false);
  }, []);

  // The remaining boxes that use the interactive step-by-step Box3D animation
  const isBox = ['Mailer Box'].includes(item.label);

  useEffect(() => {
    if (!item) return;
    
    // Non-box items use 'rotate' instead of 'flat' for their 3rd state
    const sequence: string[] = isBox 
      ? ['closed', 'open', 'flat', 'open']
      : ['closed', 'open', 'rotate', 'open'];
      
    let currentIndex = 0;
    setAnimState('closed' as any);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % sequence.length;
      setAnimState(sequence[currentIndex] as any);
    }, 2800);

    return () => clearInterval(interval);
  }, [item, isBox]);

  const CARD_W = 300;
  const CARD_H = 320;

  const rect = targetRect || {
    left: posX - 70,
    top: posY,
    width: 140,
    height: 120,
    bottom: posY + 120
  };

  const itemCenterX = rect.left + rect.width / 2;

  // Determine whether to place card above or below item based on available viewport space
  const spaceAbove = rect.top;

  // Place below if not enough room above (e.g. near top navbar header)
  const positionMode = (spaceAbove < CARD_H + 20) ? 'below' : 'above';

  let left = itemCenterX - CARD_W / 2;
  const minLeft = 12;
  const maxLeft = window.innerWidth - CARD_W - 12;
  left = Math.max(minLeft, Math.min(maxLeft, left));

  let pointerLeft = itemCenterX - left;
  pointerLeft = Math.max(28, Math.min(CARD_W - 28, pointerLeft));

  const positionStyle: React.CSSProperties = positionMode === 'below' 
    ? {
        position: 'fixed',
        left: `${left}px`,
        top: `${Math.min(window.innerHeight - CARD_H - 12, rect.bottom + 14)}px`,
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        zIndex: 9999,
      }
    : {
        position: 'fixed',
        left: `${left}px`,
        bottom: `${window.innerHeight - rect.top + 14}px`,
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        zIndex: 9999,
      };

  const card = (
    <div
      className={`hover-preview-card hover-preview-card--${positionMode} ${visible ? 'hover-preview-card--visible' : ''}`}
      style={positionStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Pointer triangle - points to item (up if below, down if above) */}
      <div 
        className={`hover-preview-card__pointer hover-preview-card__pointer--${positionMode}`} 
        style={{ left: `${pointerLeft}px` }}
      />

      {/* Header */}
      <div className="hover-preview-card__header">
        <h3 className="hover-preview-card__title">{item.label}</h3>
        <p className="hover-preview-card__subtitle">
          {isBox ? 'Structural Animation' : '3D Component Preview'}
        </p>
      </div>

      {/* 3D Viewport */}
      <div className="hover-preview-card__viewport">
        {(() => {
          if (item.label === 'Pizza Box') {
            return <div style={{ transform: 'scale(0.5)' }}><PizzaBox3D animState={animState} /></div>;
          }
          if (item.label === 'Supplement') {
            return <div style={{ transform: 'scale(0.75)' }}><Bottle3D /></div>;
          }
          if (item.label === 'Bottle' || item.label === 'Water Bottle') {
            return <div style={{ transform: 'scale(0.75)' }}><WaterBottle3D /></div>;
          }
          if (item.label === 'Can') {
            return <div style={{ transform: 'scale(0.8)' }}><Can3D /></div>;
          }
          if (item.label === 'Tube') {
            return <div style={{ transform: 'scale(0.8)' }}><Tube3D /></div>;
          }
          if (item.label === 'Cup') {
            return <div style={{ transform: 'scale(0.85)' }}><Cup3D /></div>;
          }
          if (item.label === 'Tuck End') {
            return <div style={{ transform: 'scale(0.8)' }}><TuckBox3D /></div>;
          }
          if (item.label === 'Gift Box') {
            return <div style={{ transform: 'scale(0.8)' }}><GiftBox3D /></div>;
          }
          if (item.label === 'Paper Bag') {
            return <div style={{ transform: 'scale(0.8)' }}><PaperBag3D /></div>;
          }
          if (item.label === 'Pouch') {
            return <div style={{ transform: 'scale(0.85)' }}><Pouch3D /></div>;
          }
          if (isBox) {
            return <div style={{ transform: 'scale(0.5)' }}><Box3D boxState={animState} type={item.label} /></div>;
          }
          return (
            <div className="hover-preview-card__float-container">
              <div 
                className="hover-preview-card__float-img"
                style={{ backgroundImage: `url(${item.img})` }}
              />
            </div>
          );
        })()}
      </div>

      {/* State indicator dots */}
      <div className="hover-preview-card__dots">
        {['closed', 'open', '3', 'open'].map((_, i) => (
          <div
            key={i}
            className={`hover-preview-card__dot ${
              (animState === 'closed' && i === 0) ||
              (animState === 'open' && i === 1) ||
              ((animState === 'flat' || animState === 'rotate') && i === 2) ||
              (animState === 'open' && i === 3)
                ? 'hover-preview-card__dot--active' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );

  // Render via portal to escape overflow clipping
  return ReactDOM.createPortal(card, document.body);
}
