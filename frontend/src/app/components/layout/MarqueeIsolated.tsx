import React, { useState, useRef, useCallback, useEffect } from 'react';
import './MarqueeIsolated.css';
import HoverPreviewCard, { TargetRect } from '../../pages/HoverPreviewCard';

const boxTypes = [
  { label: "Tuck End", img: "/images/box.png" },
  { label: "Bottle", img: "/images/bottle.png" },
  { label: "Can", img: "/images/can.png" },
  { label: "Pouch", img: "/images/pouch.png" },
  { label: "Tube", img: "/images/tube.png" },
  { label: "Gift Box", img: "/images/gift_box.png" },
  { label: "Cup", img: "/images/cup.png" },
  { label: "Paper Bag", img: "/images/paper_bag.png" },
  { label: "Pizza Box", img: "/images/pizza_box.png" },
  { label: "Supplement", img: "/images/supplement.png" }
];

export default function MarqueeIsolated() {
  const [hoveredItem, setHoveredItem] = useState<{ label: string; img: string } | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((box: { label: string; img: string }, e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setTargetRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom
    });
    setHoveredItem(box);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  }, []);

  useEffect(() => {
    const handleScrollOrResize = () => {
      setHoveredItem(null);
    };
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('wheel', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('wheel', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  const renderItems = () => (
    <div className="marquee-content">
      {boxTypes.map((box, index) => (
        <div
          className="marquee-item"
          key={index}
          onMouseEnter={(e) => handleMouseEnter(box, e)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="marquee-thumb">
            <img src={box.img} alt={box.label} />
          </div>
          <span className="marquee-label">{box.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <section className="marquee-section">
        <div 
          className={`marquee-container ${hoveredItem ? 'is-paused' : ''}`} 
          id="marquee-container"
          style={{ animationPlayState: hoveredItem ? 'paused' : undefined }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <React.Fragment key={i}>
              {renderItems()}
            </React.Fragment>
          ))}
        </div>
      </section>

      {hoveredItem && (
        <HoverPreviewCard
          item={hoveredItem}
          targetRect={targetRect}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={() => {
            setHoveredItem(null);
          }}
        />
      )}
    </>
  );
}
