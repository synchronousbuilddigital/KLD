import React, { useState, useRef, useCallback } from 'react';
import './MarqueeIsolated.css';
import HoverPreviewCard from './HoverPreviewCard';

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
  const [hoveredNode, setHoveredNode] = useState<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((box: { label: string; img: string }, e: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredNode(e.currentTarget);
    setHoveredItem(box);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setHoveredNode(null);
    }, 150);
  }, []);

  const renderItems = () => (
    <div className="marquee-content">
      {boxTypes.map((box, index) => (
        <div 
          className="marquee-item" 
          key={index}
          onMouseEnter={(e) => handleMouseEnter(box, e)}
          onMouseLeave={handleMouseLeave}
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'models' }))}
          style={{ cursor: 'pointer' }}
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
          {renderItems()}
          {renderItems()}
        </div>
      </section>
      
      {hoveredItem && hoveredNode && (
        <HoverPreviewCard 
          item={hoveredItem} 
          hoveredNode={hoveredNode}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={() => {
            setHoveredItem(null);
            setHoveredNode(null);
          }}
        />
      )}
    </>
  );
}
