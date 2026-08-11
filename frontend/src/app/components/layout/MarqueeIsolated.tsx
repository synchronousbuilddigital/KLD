import React, { useState, useRef, useCallback, useEffect } from 'react';
import './MarqueeIsolated.css';
import HoverPreviewCard from '../../pages/HoverPreviewCard';

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
  const [cardPos, setCardPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((box: { label: string; img: string }, e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setCardPos({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setHoveredItem(box);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setHoveredItem(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Also listen to wheel events in case it's a custom scroll container
    window.addEventListener('wheel', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
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
        <div className="marquee-container" id="marquee-container">
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
          posX={cardPos.x}
          posY={cardPos.y}
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
