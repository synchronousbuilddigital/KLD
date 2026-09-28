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

  // TRUE REVERSE TUCK END (RTE) PHYSICAL FOLDING KINEMATICS:
  // 1. Tube Formation (8% - 36%): Body panels fold along creases into 3D rectangular sleeve
  const bodyL = mapRange(foldProgress, 8, 30, 0, 90);
  const bodyR = mapRange(foldProgress, 8, 30, 0, -90);
  const bodyF = mapRange(foldProgress, 14, 36, 0, -90);
  const bodyG = mapRange(foldProgress, 18, 36, 0, 90);

  // 2. Bottom Closure (35% - 65%):
  // 2a. Bottom dust flaps (hinged to side walls) fold 90° inward across the bottom aperture
  const dustBot = mapRange(foldProgress, 35, 46, 0, 90);
  // 2b. Bottom tuck flap (hinged to Front panel) folds 90° inward over dust flaps
  const tuckBot = mapRange(foldProgress, 44, 56, 0, 90);
  // 2c. Bottom tuck lip folds 90° and slides inside along the Back wall, locking the bottom
  const tuckBotLip = mapRange(foldProgress, 50, 65, 0, 90);

  // 3. Top Dust Flaps (65% - 78%):
  // Top dust flaps (hinged to side walls) fold 90° inward across the top aperture
  const dustTop = mapRange(foldProgress, 65, 78, 0, -90);

  // 4. Top Lid Closure & Front Reverse Tuck (78% - 100%):
  // 4a. Top tuck flap (hinged to Back panel) folds 90° forward over top dust flaps
  const tuckTop = mapRange(foldProgress, 78, 92, 0, -90);
  // 4b. Top tuck friction lip folds 90° downward and slides cleanly inside behind the Front panel
  const tuckTopLip = mapRange(foldProgress, 84, 100, 0, -90);

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
        className="rte-pivot"
        style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
      >
        <div 
          className={`rte-box ${materialClass}`} 
          id="box-root"
        >
          {/* Base face: Panel 2 (Back) */}
          <div className="rte-face rte-panel-back">
            <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
            
            {/* Top Tuck Flap */}
            <div className="rte-face rte-flap rte-tuck-top">
                <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
                <div className="rte-face rte-tuck-lip rte-tuck-lip-top">
                    <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
                </div>
            </div>
            
            {/* Panel 1 (Left), attached to Back's left edge */}
            <div className="rte-face rte-panel-left">
                <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
                
                {/* Left Dust Flaps */}
                <div className="rte-face rte-flap rte-dust-top-left"><div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div></div>
                <div className="rte-face rte-flap rte-dust-bot-left"><div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div></div>
                
                {/* Glue Flap, attached to Left's left edge */}
                <div className="rte-face rte-glue-flap">
                    <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
                </div>
            </div>

            {/* Panel 3 (Right), attached to Back's right edge */}
            <div className="rte-face rte-panel-right">
                <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
                
                {/* Right Dust Flaps */}
                <div className="rte-face rte-flap rte-dust-top-right"><div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div></div>
                <div className="rte-face rte-flap rte-dust-bot-right"><div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div></div>
                
                {/* Panel 4 (Front), attached to Right's right edge */}
                <div className="rte-face rte-panel-front">
                    <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
                    
                    {/* Render User Artwork on Front Panel (Both flat dieline face and assembled 3D outside face) */}
                    {renderArtwork && (
                        <>
                            {/* Outside 3D Box Face (Faces customer when assembled at 100%) */}
                            <div className="rte-artwork-container" style={{ transform: 'rotateY(180deg) translateZ(1.5px)' }}>
                                {renderArtwork()}
                            </div>
                            {/* Flat Dieline Face (Faces customer when flat at 0%) */}
                            <div className="rte-artwork-container" style={{ transform: 'translateZ(1.5px)' }}>
                                {renderArtwork()}
                            </div>
                        </>
                    )}
                    
                    {/* Bottom Tuck Flap */}
                    <div className="rte-face rte-flap rte-tuck-bot">
                        <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
                        <div className="rte-face rte-tuck-lip rte-tuck-lip-bot">
                            <div className="rte-texture-layer outside"></div><div className="rte-texture-layer inside"></div><div className="rte-edge"></div>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
