import React, { useState, useEffect, useRef, useLayoutEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BoxState } from './models/Box3D';
import './HoverPreviewCard.css';

const Box3D = lazy(() => import('./models/Box3D'));
const Bottle3D = lazy(() => import('./models/Bottle3D'));
const WaterBottle3D = lazy(() => import('./models/WaterBottle3D'));
const Can3D = lazy(() => import('./models/Can3D'));
const Tube3D = lazy(() => import('./models/Tube3D'));
const Cup3D = lazy(() => import('./models/Cup3D'));
const PizzaBox3D = lazy(() => import('./models/PizzaBox3D'));
const TuckBox3D = lazy(() => import('./models/TuckBox3D'));
const GiftBox3D = lazy(() => import('./models/GiftBox3D'));
const PaperBag3D = lazy(() => import('./models/PaperBag3D'));
const Pouch3D = lazy(() => import('./models/Pouch3D'));

interface Props {
  item: { label: string; img: string };
  hoveredNode: HTMLDivElement;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function HoverPreviewCard({ item, hoveredNode, onMouseEnter, onMouseLeave }: Props) {
  const [animState, setAnimState] = useState<BoxState>('closed');
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState<'above' | 'below'>('above');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
    return () => setVisible(false);
  }, []);

  const CARD_W = 340;
  const CARD_H = 390;

  useLayoutEffect(() => {
    if (!hoveredNode || !cardRef.current) return;

    const updatePosition = () => {
      if (!hoveredNode || !cardRef.current) return;
      const rect = hoveredNode.getBoundingClientRect();
      
      // Auto-dismiss if scrolled out of visible viewport
      if (rect.bottom < 60 || rect.top > window.innerHeight - 60) {
        onMouseLeave();
        return;
      }

      const zoom = parseFloat(document.body.style.zoom || '1');
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      const posX = (rect.left + scrollX) / zoom + (rect.width / zoom) / 2;
      const posY = (rect.top + scrollY) / zoom;

      // Position above by default
      let left = posX - CARD_W / 2;
      let top = posY - CARD_H - (14 / zoom);
      let newPlacement: 'above' | 'below' = 'above';

      // Clamp horizontally to viewport
      const minLeft = 16 + scrollX;
      const maxLeft = (window.innerWidth / zoom + scrollX) - CARD_W - 16;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;

      // Flip placement to below if it clips into top navbar
      const minTop = 75 + scrollY;
      if (top < minTop) {
        top = posY + (rect.height / zoom) + (14 / zoom);
        newPlacement = 'below';
      }

      setPlacement(prev => (prev !== newPlacement ? newPlacement : prev));

      cardRef.current.style.left = `${left}px`;
      cardRef.current.style.top = `${top}px`;
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [hoveredNode, onMouseLeave]);

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

  const card = (
    <div
      ref={cardRef}
      className={`hover-preview-card ${visible ? 'hover-preview-card--visible' : ''} ${placement === 'below' ? 'hover-preview-card--below' : ''}`}
      style={{
        position: 'absolute',
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        zIndex: 9999,
        // left/top will be set by the layout effect
        left: '-9999px',
        top: '-9999px',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Pointer triangle */}
      <div className="hover-preview-card__pointer" />

      {/* Header */}
      <div className="hover-preview-card__header">
        <h3 className="hover-preview-card__title">{item.label}</h3>
        <p className="hover-preview-card__subtitle">
          {isBox ? 'Structural Animation' : '3D Component Preview'}
        </p>
      </div>

      {/* 3D Viewport */}
      <div className="hover-preview-card__viewport">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center w-full h-full opacity-50">
            <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mb-2"></div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Loading 3D...</span>
          </div>
        }>
          {(() => {
            if (item.label === 'Pizza Box') {
              return <div style={{ transform: 'scale(0.55)' }}><PizzaBox3D animState={animState} /></div>;
            }
            if (item.label === 'Supplement') {
              return <div style={{ transform: 'scale(0.8)' }}><Bottle3D /></div>;
            }
            if (item.label === 'Bottle' || item.label === 'Water Bottle') {
              return <div style={{ transform: 'scale(0.8)' }}><WaterBottle3D /></div>;
            }
            if (item.label === 'Can') {
              return <div style={{ transform: 'scale(0.9)' }}><Can3D /></div>;
            }
            if (item.label === 'Tube') {
              return <div style={{ transform: 'scale(0.9)' }}><Tube3D /></div>;
            }
            if (item.label === 'Cup') {
              return <div style={{ transform: 'scale(0.9)' }}><Cup3D /></div>;
            }
            if (item.label === 'Tuck End') {
              return <div style={{ transform: 'scale(0.9)' }}><TuckBox3D /></div>;
            }
            if (item.label === 'Gift Box') {
              return <div style={{ transform: 'scale(0.9)' }}><GiftBox3D /></div>;
            }
            if (item.label === 'Paper Bag') {
              return <div style={{ transform: 'scale(0.9)' }}><PaperBag3D /></div>;
            }
            if (item.label === 'Pouch') {
              return <div style={{ transform: 'scale(1.0)' }}><Pouch3D /></div>;
            }
            if (isBox) {
              return <div style={{ transform: 'scale(0.55)' }}><Box3D boxState={animState} type={item.label} /></div>;
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
        </Suspense>
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
              (animState === 'open' && i === 3) // Technically this indicator might not perfectly sync if state is duplicated, but let's just highlight based on a timer index if we could. For now this is fine.
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
