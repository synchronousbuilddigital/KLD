import React, { useEffect, useState, useRef } from 'react';
import './KraftPackagingShowcase.css';

export default function KraftBoxAnimation() {
  const [progress, setProgress] = useState(0); // 0 to 100
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth continuous folding & packing animation loop
  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    const DURATION = 9000; // 9 second full cycle

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % DURATION;
      const t = elapsed / DURATION;

      // 0.00 - 0.35: Folding up from flat dieline to box
      // 0.35 - 0.70: Box closed & tied with twine and tag (holding state)
      // 0.70 - 1.00: Unfolding back to dieline
      let p = 0;
      if (t < 0.35) {
        // Folding up (0 to 100) with smooth cubic ease
        const ease = Math.sin((t / 0.35) * (Math.PI / 2));
        p = ease * 100;
      } else if (t < 0.65) {
        // Holding closed & packed with twine
        p = 100;
      } else {
        // Unfolding (100 to 0) with smooth ease
        const ease = Math.cos(((t - 0.65) / 0.35) * (Math.PI / 2));
        p = ease * 100;
      }

      setProgress(p);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Subtle interactive 3D mouse parallax on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Dimensions of kraft gift box
  const W = 160; // Width
  const D = 110; // Depth
  const H = 42;  // Height

  // Calculate angles
  const norm = progress / 100;
  const wallAngle = 90 * Math.min(1, norm * 1.6);
  const lidAngle = 90 * Math.max(0, (norm - 0.45) * 2);
  const tuckFlapAngle = 90 * Math.max(0, (norm - 0.7) * 3.3);
  const twineOpacity = norm > 0.8 ? Math.min(1, (norm - 0.8) / 0.18) : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-[260px] flex items-center justify-center relative cursor-pointer select-none"
      style={{ perspective: 1200 }}
    >
      {/* Ground Shadow */}
      <div 
        className="kraft-ground-shadow" 
        style={{
          width: `${W + 50}px`,
          bottom: '25px',
          transform: `translateX(-50%) scale(${0.7 + (norm * 0.3)})`,
          opacity: 0.25 + (norm * 0.15),
          transition: 'transform 0.2s ease, opacity 0.2s ease'
        }}
      />

      {/* 3D Rotatable Scene */}
      <div
        className="kraft-3d-world"
        style={{
          transform: `rotateX(${55 - tilt.y}deg) rotateZ(${28 + tilt.x}deg)`,
          '--kraft-bg': '#cfa878',
          '--kraft-border': '#b58d5c',
        } as React.CSSProperties}
      >
        {/* Flat Stack Shadow Box Behind */}
        <div
          style={{
            position: 'absolute',
            width: `${W + 20}px`,
            height: `${D + 15}px`,
            left: '-10px',
            top: '-7px',
            transform: `translateZ(-30px) rotateZ(-4deg)`,
            backgroundColor: '#c49a68',
            border: '1px solid #aa8050',
            boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
            borderRadius: '2px',
            opacity: 0.85
          }}
        />

        {/* MAIN FOLDING KRAFT BOX */}
        <div
          style={{
            position: 'relative',
            width: `${W}px`,
            height: `${D}px`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* BASE BOTTOM PANEL */}
          <div
            className="kraft-panel"
            style={{
              width: `${W}px`,
              height: `${D}px`,
              backgroundColor: '#cfa878',
            }}
          />

          {/* FRONT WALL PANEL */}
          <div
            className="kraft-panel"
            style={{
              top: `${D}px`,
              left: 0,
              width: `${W}px`,
              height: `${H}px`,
              transformOrigin: 'top center',
              transform: `rotateX(${wallAngle}deg)`,
            }}
          >
            {/* Front tuck flap */}
            <div
              className="kraft-panel"
              style={{
                top: `${H}px`,
                left: 0,
                width: `${W}px`,
                height: '20px',
                transformOrigin: 'top center',
                transform: `rotateX(${tuckFlapAngle}deg)`,
                backgroundColor: '#bd9666',
              }}
            />
          </div>

          {/* BACK WALL PANEL */}
          <div
            className="kraft-panel"
            style={{
              bottom: `${D}px`,
              left: 0,
              width: `${W}px`,
              height: `${H}px`,
              transformOrigin: 'bottom center',
              transform: `rotateX(-${wallAngle}deg)`,
            }}
          >
            {/* TOP LID ATTACHED TO BACK WALL */}
            <div
              className="kraft-panel"
              style={{
                bottom: `${H}px`,
                left: 0,
                width: `${W}px`,
                height: `${D}px`,
                transformOrigin: 'bottom center',
                transform: `rotateX(-${lidAngle}deg)`,
                backgroundColor: '#cfa878',
              }}
            >
              {/* Natural Jute Twine Wrapping */}
              <div style={{ opacity: twineOpacity, transition: 'opacity 0.3s ease' }}>
                <div className="kraft-twine-h" />
                <div className="kraft-twine-v" />

                {/* Artisan Kraft Tag */}
                <div className="kraft-tag" style={{ transform: 'translate(-50%, -50%) translateZ(4px) rotate(-6deg) scale(0.9)' }}>
                  <span className="text-[10px] font-bold text-amber-950">KEYLINE</span>
                </div>

                {/* Dried Botanical Sprig */}
                <div className="kraft-botanical" style={{ transform: 'translate(-25%, -60%) translateZ(5px) rotate(22deg) scale(0.85)' }}>
                  <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
                    <path d="M50 90 Q40 50 20 20" stroke="#8d6741" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="20" cy="20" r="5.5" fill="#c0392b" />
                    <circle cx="32" cy="35" r="5" fill="#d35400" />
                    <circle cx="44" cy="55" r="4.5" fill="#e67e22" />
                    <circle cx="28" cy="18" r="4" fill="#f39c12" />
                  </svg>
                </div>
              </div>

              {/* Top Lid Front Tuck Flap */}
              <div
                className="kraft-panel"
                style={{
                  bottom: `${D}px`,
                  left: 0,
                  width: `${W}px`,
                  height: '22px',
                  transformOrigin: 'bottom center',
                  transform: `rotateX(-${tuckFlapAngle}deg)`,
                  backgroundColor: '#bd9666',
                  borderRadius: '0 0 4px 4px',
                }}
              />
            </div>
          </div>

          {/* LEFT WALL PANEL */}
          <div
            className="kraft-panel"
            style={{
              top: 0,
              right: `${W}px`,
              width: `${H}px`,
              height: `${D}px`,
              transformOrigin: 'right center',
              transform: `rotateY(${wallAngle}deg)`,
            }}
          >
            {/* Left dust flap */}
            <div
              className="kraft-panel"
              style={{
                top: 0,
                right: `${H}px`,
                width: '22px',
                height: `${D}px`,
                transformOrigin: 'right center',
                transform: `rotateY(${tuckFlapAngle}deg)`,
                backgroundColor: '#c09868',
              }}
            />
          </div>

          {/* RIGHT WALL PANEL */}
          <div
            className="kraft-panel"
            style={{
              top: 0,
              left: `${W}px`,
              width: `${H}px`,
              height: `${D}px`,
              transformOrigin: 'left center',
              transform: `rotateY(-${wallAngle}deg)`,
            }}
          >
            {/* Right dust flap */}
            <div
              className="kraft-panel"
              style={{
                top: 0,
                left: `${H}px`,
                width: '22px',
                height: `${D}px`,
                transformOrigin: 'left center',
                transform: `rotateY(-${tuckFlapAngle}deg)`,
                backgroundColor: '#c09868',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
