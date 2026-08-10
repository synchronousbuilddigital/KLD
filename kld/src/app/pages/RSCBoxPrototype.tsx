import React, { useState, useRef, useEffect } from 'react';
import './RSCBox.css';

export type SealState = 'unsealed' | 'sealing' | 'sealed' | 'cutting';

export interface RSCBoxPrototypeProps {
  width: number;
  depth: number;
  height: number;
  foldProgress: number; // 0 to 100
  material: string; // 'kraft', 'matte-white', 'slate-black', 'gold-foil'
  baseStyle: React.CSSProperties; // fallback for custom finishes
  renderArtwork?: () => React.ReactNode;
  sealState?: SealState;
}

export default function RSCBoxPrototype({
  width,
  depth,
  height,
  foldProgress,
  material,
  baseStyle,
  renderArtwork,
  sealState = 'unsealed'
}: RSCBoxPrototypeProps) {
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

  // Clamp helper
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  // MapRange helper
  const mapRange = (val: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    let p = (val - inMin) / (inMax - inMin);
    p = clamp(p, 0, 1);
    return outMin + p * (outMax - outMin);
  };

  // RSC Folding Logic Mapping
  // Stage 1 (0-10): Flat Dieline
  
  // Stage 2 (10-40): Box Body Forms (Left/Right/Front/Glue)
  const bodyL = mapRange(foldProgress, 10, 40, 0, -90);
  const bodyR = mapRange(foldProgress, 10, 40, 0, 90);
  
  // Stage 3 (40-70): Minor Flaps Fold In (Left & Right top/bottom flaps)
  const minorTop = mapRange(foldProgress, 40, 70, 0, 90);
  const minorBottom = mapRange(foldProgress, 40, 70, 0, -90);
  
  // Stage 4 (70-100): Major Flaps Seal Box (Front & Back top/bottom flaps)
  const majorTop = mapRange(foldProgress, 70, 100, 0, 90);
  const majorBottom = mapRange(foldProgress, 70, 100, 0, -90);

  // Determine material class
  const knownMaterials = ['kraft', 'matte-white', 'slate-black', 'gold-foil'];
  const materialClass = knownMaterials.includes(material) ? material : 'custom';

  // CSS Variables
  const styleVars = {
    '--w': `${width}px`,
    '--h': `${height}px`,
    '--d': `${depth}px`,
    '--slot': '6px',
    '--f-body-l': `${bodyL}deg`,
    '--f-body-r': `${bodyR}deg`,
    '--f-minor-top': `${minorTop}deg`,
    '--f-minor-bottom': `${minorBottom}deg`,
    '--f-major-top': `${majorTop}deg`,
    '--f-major-bottom': `${majorBottom}deg`,
    '--custom-bg': baseStyle.background || baseStyle.backgroundColor || 'transparent'
  } as React.CSSProperties;

  return (
    <div 
      className="rsc-scene w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center pointer-events-auto" 
      style={styleVars}
      onMouseDown={handleMouseDown}
    >
      <div 
        className={`rsc-box ${materialClass} ${sealState !== 'unsealed' ? sealState : ''}`} 
        id="box-root"
        style={{ transform: `scale(0.45) rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
      >
        
        {/* Tape Sealing (Top and Bottom) */}
        <div className="rsc-tape-group">
            <div className="rsc-tape-container rsc-tape-top">
                <div className="rsc-tape-face rsc-tape-center">
                    <div className="rsc-tape-cut-line"></div>
                </div>
                <div className="rsc-tape-face rsc-tape-drop rsc-tape-left"></div>
                <div className="rsc-tape-face rsc-tape-drop rsc-tape-right"></div>
                
                {/* Animated Tools */}
                <div className="rsc-action-tool rsc-tape-tool">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 19h8"/></svg>
                </div>
                <div className="rsc-action-tool rsc-blade-tool">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.5 3.5l-15 15a2 2 0 0 0 2.8 2.8l15-15a2 2 0 0 0-2.8-2.8z"/><path d="M13 10l-4 4"/><path d="M9 14l-2 2"/></svg>
                </div>
            </div>
            <div className="rsc-tape-container rsc-tape-bottom">
                <div className="rsc-tape-face rsc-tape-center">
                    <div className="rsc-tape-cut-line"></div>
                </div>
                <div className="rsc-tape-face rsc-tape-drop rsc-tape-left"></div>
                <div className="rsc-tape-face rsc-tape-drop rsc-tape-right"></div>
                
                {/* Animated Tools */}
                <div className="rsc-action-tool rsc-tape-tool">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 19h8"/></svg>
                </div>
                <div className="rsc-action-tool rsc-blade-tool">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.5 3.5l-15 15a2 2 0 0 0 2.8 2.8l15-15a2 2 0 0 0-2.8-2.8z"/><path d="M13 10l-4 4"/><path d="M9 14l-2 2"/></svg>
                </div>
            </div>
        </div>

        {/* Base face: Panel 2 (Back) */}
        <div className="rsc-face rsc-panel-back">
            <div className="rsc-texture-layer"></div>
            
            {/* Back Flaps */}
            <div className="rsc-face rsc-flap rsc-flap-top-back"><div className="rsc-texture-layer"></div></div>
            <div className="rsc-face rsc-flap rsc-flap-bottom-back"><div className="rsc-texture-layer"></div></div>
            
            {/* Panel 1 (Left), attached to Back's left edge */}
            <div className="rsc-face rsc-panel-left">
                <div className="rsc-texture-layer"></div>
                
                {/* Left Flaps (Minor) */}
                <div className="rsc-face rsc-flap rsc-flap-top-left"><div className="rsc-texture-layer"></div></div>
                <div className="rsc-face rsc-flap rsc-flap-bottom-left"><div className="rsc-texture-layer"></div></div>
                
                {/* Glue Flap, attached to Left's left edge */}
                <div className="rsc-face rsc-glue-flap">
                    <div className="rsc-texture-layer"></div>
                </div>
            </div>

            {/* Panel 3 (Right), attached to Back's right edge */}
            <div className="rsc-face rsc-panel-right">
                <div className="rsc-texture-layer"></div>
                
                {/* Right Flaps (Minor) */}
                <div className="rsc-face rsc-flap rsc-flap-top-right"><div className="rsc-texture-layer"></div></div>
                <div className="rsc-face rsc-flap rsc-flap-bottom-right"><div className="rsc-texture-layer"></div></div>
                
                {/* Panel 4 (Front), attached to Right's right edge */}
                <div className="rsc-face rsc-panel-front">
                    <div className="rsc-texture-layer"></div>
                    
                    {/* Render User Artwork on Front Panel */}
                    {renderArtwork && (
                        <div className="rsc-artwork-container">
                            {renderArtwork()}
                        </div>
                    )}
                    
                    {/* Front Flaps (Major) */}
                    <div className="rsc-face rsc-flap rsc-flap-top-front"><div className="rsc-texture-layer"></div></div>
                    <div className="rsc-face rsc-flap rsc-flap-bottom-front"><div className="rsc-texture-layer"></div></div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
