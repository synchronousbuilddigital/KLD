import React, { useState, useRef, useCallback, useEffect } from 'react';
import './MarqueeIsolated.css';
import HoverPreviewCard from './HoverPreviewCard';
import { catalogService } from '../../../services/catalog';

interface MarqueeItem {
  label: string;
  img: string;
  itemId?: string;
}

const defaultBoxTypes: MarqueeItem[] = [
  { label: "Tuck End", img: "/images/box.png", itemId: "box-mockups" },
  { label: "Bottle", img: "/images/bottle.png", itemId: "bottle-mockups" },
  { label: "Can", img: "/images/can.png", itemId: "can-mockups" },
  { label: "Pouch", img: "/images/pouch.png", itemId: "pouch-bag-mockups" },
  { label: "Tube", img: "/images/tube.png", itemId: "tube-mockups" },
  { label: "Gift Box", img: "/images/gift_box.png", itemId: "gift-box-mockups" },
  { label: "Cup", img: "/images/cup.png", itemId: "cup-container-mockups" },
  { label: "Paper Bag", img: "/images/paper_bag.png", itemId: "paper-bag-mockups" },
  { label: "Pizza Box", img: "/images/pizza_box.png", itemId: "pizza-packaging-mockups" },
  { label: "Supplement", img: "/images/supplement.png", itemId: "supplement-bottle-mockups" }
];

function getCurrentTranslateX(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  const transform = style.transform || (style as any).webkitTransform;
  if (!transform || transform === 'none') return 0;
  
  if (transform.startsWith('matrix3d(')) {
    const values = transform.slice(9, -1).split(',');
    return parseFloat(values[12]?.trim()) || 0;
  }
  if (transform.startsWith('matrix(')) {
    const values = transform.slice(7, -1).split(',');
    return parseFloat(values[4]?.trim()) || 0;
  }
  return 0;
}

export default function MarqueeIsolated() {
  const [boxTypes, setBoxTypes] = useState<MarqueeItem[]>(defaultBoxTypes);
  const [hoveredItem, setHoveredItem] = useState<MarqueeItem | null>(null);
  const [hoveredNode, setHoveredNode] = useState<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag state
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const initialTxRef = useRef(0);
  const currentTxRef = useRef(0);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const publicCatalog = await catalogService.getPublicCatalog();
        if (isMounted && publicCatalog && publicCatalog.length > 0) {
          const items = publicCatalog
            .filter(item => item.group !== 'dielines')
            .map(item => ({
              label: item.title,
              img: item.img || "/images/box.png",
              itemId: item.itemId
            }));
          if (items.length > 0) {
            setBoxTypes(items);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch catalog for marquee", err);
      }
    };
    fetchCatalog();
    return () => { isMounted = false; };
  }, []);

  // Helper to resume CSS animation seamlessly from currentTx
  const resumeAnimationAt = useCallback((targetTx: number) => {
    const container = containerRef.current;
    if (!container) return;

    const halfW = container.scrollWidth / 2;
    if (halfW <= 0) return;

    let normalized = -targetTx % halfW;
    if (normalized < 0) normalized += halfW;
    const progress = normalized / halfW;
    const delay = progress * 25; // 25s is original animation duration

    container.style.transform = '';
    container.style.animation = 'none';
    void container.offsetHeight; // Force reflow to apply new animation-delay cleanly
    container.style.animation = 'scroll 25s linear infinite';
    container.style.animationDelay = `-${delay.toFixed(3)}s`;
    if (hoveredItem) {
      container.style.animationPlayState = 'paused';
    }
  }, [hoveredItem]);

  // Wheel listener: allows rolling wheel to scroll the strip
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onWheel = (e: WheelEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 1) return;
      e.preventDefault();

      if (hoveredItem) {
        setHoveredItem(null);
        setHoveredNode(null);
      }

      const currentTx = getCurrentTranslateX(container);
      const newTx = currentTx - delta * 0.8;
      resumeAnimationAt(newTx);
    };

    section.addEventListener('wheel', onWheel, { passive: false });
    return () => section.removeEventListener('wheel', onWheel);
  }, [hoveredItem, resumeAnimationAt]);

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    isDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;

    const currentTx = getCurrentTranslateX(container);
    initialTxRef.current = currentTx;
    currentTxRef.current = currentTx;

    container.style.animation = 'none';
    container.style.transform = `translateX(${currentTx}px)`;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current || !containerRef.current) return;
    const diff = e.pageX - startXRef.current;

    if (Math.abs(diff) > 5) {
      hasDraggedRef.current = true;
      if (hoveredItem) {
        setHoveredItem(null);
        setHoveredNode(null);
      }
    }

    const container = containerRef.current;
    const halfW = container.scrollWidth / 2;
    let newTx = initialTxRef.current + diff;

    if (halfW > 0) {
      if (newTx > 0) newTx -= halfW;
      if (newTx < -halfW) newTx += halfW;
    }

    currentTxRef.current = newTx;
    container.style.transform = `translateX(${newTx}px)`;
  };

  const handleMouseUpOrLeave = () => {
    if (isDownRef.current) {
      isDownRef.current = false;
      setIsDragging(false);
      resumeAnimationAt(currentTxRef.current);
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    isDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.touches[0].pageX;

    const currentTx = getCurrentTranslateX(container);
    initialTxRef.current = currentTx;
    currentTxRef.current = currentTx;

    container.style.animation = 'none';
    container.style.transform = `translateX(${currentTx}px)`;

    if (hoveredItem) {
      setHoveredItem(null);
      setHoveredNode(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDownRef.current || !containerRef.current) return;
    const diff = e.touches[0].pageX - startXRef.current;

    if (Math.abs(diff) > 5) {
      hasDraggedRef.current = true;
    }

    const container = containerRef.current;
    const halfW = container.scrollWidth / 2;
    let newTx = initialTxRef.current + diff;

    if (halfW > 0) {
      if (newTx > 0) newTx -= halfW;
      if (newTx < -halfW) newTx += halfW;
    }

    currentTxRef.current = newTx;
    container.style.transform = `translateX(${newTx}px)`;
  };

  const handleTouchEnd = () => {
    if (isDownRef.current) {
      isDownRef.current = false;
      resumeAnimationAt(currentTxRef.current);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (hoveredItem) {
      container.style.animationPlayState = 'paused';
    } else if (!isDownRef.current) {
      container.style.animationPlayState = 'running';
    }
  }, [hoveredItem]);

  const handleMouseEnter = useCallback((box: MarqueeItem, e: React.MouseEvent<HTMLDivElement>) => {
    if (isDownRef.current || hasDraggedRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (containerRef.current) {
      containerRef.current.style.animationPlayState = 'paused';
    }
    setHoveredNode(e.currentTarget);
    setHoveredItem(box);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setHoveredNode(null);
      if (containerRef.current && !isDownRef.current) {
        containerRef.current.style.animationPlayState = 'running';
      }
    }, 150);
  }, []);

  const handleItemClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'models' }));
  };

  const renderItems = () => (
    <div className="marquee-content">
      {boxTypes.map((box, index) => (
        <div 
          className="marquee-item" 
          key={index}
          onMouseEnter={(e) => handleMouseEnter(box, e)}
          onMouseLeave={handleMouseLeave}
          onClick={handleItemClick}
        >
          <div className="marquee-thumb">
            <img src={box.img} alt={box.label} draggable={false} />
          </div>
          <span className="marquee-label">{box.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <section 
        className={`marquee-section ${isDragging ? 'is-dragging' : ''}`}
        ref={sectionRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={`marquee-container ${hoveredItem ? 'paused' : ''}`} 
          id="marquee-container"
          ref={containerRef}
        >
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
