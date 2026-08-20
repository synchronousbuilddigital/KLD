import React, { useState, useRef, useEffect } from 'react';
import './RTEBox.css';

export interface RTEBoxPrototypeProps {
  width: number;
  depth: number;
  height: number;
  foldProgress: number; // 0 to 100
  material: string; // 'kraft', 'matte-white', 'slate-black', 'gold-foil'
  baseStyle: React.CSSProperties; // fallback for custom finishes
  renderArtwork?: () => React.ReactNode;
}

export default function RTEBoxPrototype({
  width,
  depth,
  height,
  foldProgress,
  material,
  baseStyle,
  renderArtwork
}: RTEBoxPrototypeProps) {
  // Mouse Drag Rotation State
  const [rotX, setRotX] = useState(-15);
  const [rotY, setRotY] = useState(30);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseUp = () => { isDragging.current = false; };
    const handleMouseLeave = () => { isDragging.current = false; };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - prevMouse.current.x;
      const deltaY = e.clientY - prevMouse.current.y;
      
      setRotY(prev => prev + deltaX * 0.5);
      setRotX(prev => prev - deltaY * 0.5);
      
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    prevMouse.current = { x: e.clientX, y: e.clientY };
  };

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  const mapRange = (val: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    let p = (val - inMin) / (inMax - inMin);
    p = clamp(p, 0, 1);
    return outMin + p * (outMax - outMin);
  };

  // Stage 2: Dust Flaps Fold In (10-45)
  const dustTop = mapRange(foldProgress, 10, 45, 0, -90);
  const dustBot = mapRange(foldProgress, 10, 45, 0, 90);

  // Stage 3: Side Panels Assemble (45-80)
  const bodyL = mapRange(foldProgress, 45, 80, 0, 90);
  const bodyR = mapRange(foldProgress, 45, 80, 0, -90);
  const bodyF = mapRange(foldProgress, 45, 80, 0, -90);
  const bodyG = mapRange(foldProgress, 45, 80, 0, 90);
  
  // Stage 4: Lid Tucks In (80-100)
  const tuckTop = mapRange(foldProgress, 80, 100, 0, -90);
  const tuckTopLip = mapRange(foldProgress, 80, 100, 0, -90);
  
  const tuckBot = mapRange(foldProgress, 80, 100, 0, 90);
  const tuckBotLip = mapRange(foldProgress, 80, 100, 0, 90);

  const knownMaterials = ['kraft', 'matte-white', 'slate-black', 'gold-foil'];
  const materialClass = knownMaterials.includes(material) ? material : 'custom';

  const styleVars = {
    '--w': `${width}px`,
    '--h': `${height}px`,
    '--d': `${depth}px`,
    '--lip': '15px',
    '--f-body-l': `${bodyL}deg`,
    '--f-body-r': `${bodyR}deg`,
    '--f-body-f': `${bodyF}deg`,
    '--f-body-g': `${bodyG}deg`,
    '--f-dust-top': `${dustTop}deg`,
    '--f-dust-bot': `${dustBot}deg`,
    '--f-tuck-top': `${tuckTop}deg`,
    '--f-tuck-top-lip': `${tuckTopLip}deg`,
    '--f-tuck-bot': `${tuckBot}deg`,
    '--f-tuck-bot-lip': `${tuckBotLip}deg`,
    '--custom-bg': baseStyle.background || baseStyle.backgroundColor || 'transparent'
  } as React.CSSProperties;

  return (
    <div 
      className="rte-scene w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center pointer-events-auto" 
      style={styleVars}
      onMouseDown={handleMouseDown}
    >
      <div 
        className={`rte-box ${materialClass}`} 
        id="box-root"
        style={{ transform: `scale(0.45) rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
      >
        
        {/* Base face: Panel 2 (Back) */}
        <div className="rte-face rte-panel-back">
            <div className="rte-texture-layer"></div>
            
            {/* Top Tuck Flap */}
            <div className="rte-face rte-flap rte-tuck-top">
                <div className="rte-texture-layer"></div>
                <div className="rte-face rte-tuck-lip rte-tuck-lip-top">
                    <div className="rte-texture-layer"></div>
                </div>
            </div>
            
            {/* Panel 1 (Left), attached to Back's left edge */}
            <div className="rte-face rte-panel-left">
                <div className="rte-texture-layer"></div>
                
                {/* Left Dust Flaps */}
                <div className="rte-face rte-flap rte-dust-top-left"><div className="rte-texture-layer"></div></div>
                <div className="rte-face rte-flap rte-dust-bot-left"><div className="rte-texture-layer"></div></div>
                
                {/* Glue Flap, attached to Left's left edge */}
                <div className="rte-face rte-glue-flap">
                    <div className="rte-texture-layer"></div>
                </div>
            </div>

            {/* Panel 3 (Right), attached to Back's right edge */}
            <div className="rte-face rte-panel-right">
                <div className="rte-texture-layer"></div>
                
                {/* Right Dust Flaps */}
                <div className="rte-face rte-flap rte-dust-top-right"><div className="rte-texture-layer"></div></div>
                <div className="rte-face rte-flap rte-dust-bot-right"><div className="rte-texture-layer"></div></div>
                
                {/* Panel 4 (Front), attached to Right's right edge */}
                <div className="rte-face rte-panel-front">
                    <div className="rte-texture-layer"></div>
                    
                    {/* Render User Artwork on Front Panel */}
                    {renderArtwork && (
                        <div className="rte-artwork-container">
                            {renderArtwork()}
                        </div>
                    )}
                    
                    {/* Bottom Tuck Flap */}
                    <div className="rte-face rte-flap rte-tuck-bot">
                        <div className="rte-texture-layer"></div>
                        <div className="rte-face rte-tuck-lip rte-tuck-lip-bot">
                            <div className="rte-texture-layer"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
