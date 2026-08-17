import React from 'react';
import { motion } from 'motion/react';
import { PlacedImage } from './MockupGenerator';

interface DielineEditorProps {
  placedImages: PlacedImage[];
  activeSide: 'outside' | 'inside';
  updatePlacedImage: (id: string, updates: Partial<PlacedImage>) => void;
  removePlacedImage: (id: string) => void;
  packageColor: string;
}

export default function DielineEditor({
  placedImages,
  activeSide,
  updatePlacedImage,
  removePlacedImage,
  packageColor
}: DielineEditorProps) {

  // Coordinates and Dimensions (Scale by 2.0 to make it larger like the screenshot)
  const SCALE = 2.0;
  const W = 120 * SCALE; // Width (Front/Back)
  const H = 160 * SCALE; // Height
  const D = 60 * SCALE;  // Depth (Side panels / Flaps)
  const T = 15 * SCALE;  // Tuck / Glue flap width

  // Offset to center it
  const startX = 200;
  const startY = 150;

  const panels = [
    { id: 'glue', label: 'Glue', x: startX, y: startY + D + T, w: T, h: H, dropId: 'glue' },
    { id: 'left', label: 'Left', x: startX + T, y: startY + D + T, w: D, h: H, dropId: 'left' },
    { id: 'front', label: 'Front', x: startX + T + D, y: startY + D + T, w: W, h: H, dropId: 'front' },
    { id: 'right', label: 'Right', x: startX + T + D + W, y: startY + D + T, w: D, h: H, dropId: 'right' },
    { id: 'back', label: 'Back', x: startX + T + D + W + D, y: startY + D + T, w: W, h: H, dropId: 'back' },
    
    // Top elements
    { id: 'top-flap', label: 'Top Flap', x: startX + T + D, y: startY + T, w: W, h: D, dropId: 'top-flap' },
    { id: 'top-tuck', label: 'Tuck', x: startX + T + D, y: startY, w: W, h: T, dropId: 'top-tuck' },
    { id: 'dust-top-left', label: 'Dust', x: startX + T, y: startY + T, w: D, h: D, dropId: 'dust-top-left' },
    { id: 'dust-top-right', label: 'Dust', x: startX + T + D + W, y: startY + T, w: D, h: D, dropId: 'dust-top-right' },
    
    // Bottom elements 
    { id: 'bottom-flap', label: 'Bottom Flap', x: startX + T + D + W + D, y: startY + D + T + H, w: W, h: D, dropId: 'bottom-flap' },
    { id: 'bottom-tuck', label: 'Tuck', x: startX + T + D + W + D, y: startY + D + T + H + D, w: W, h: T, dropId: 'bottom-tuck' },
    { id: 'dust-bottom-left', label: 'Dust', x: startX + T, y: startY + D + T + H, w: D, h: D, dropId: 'dust-bottom-left' },
    { id: 'dust-bottom-right', label: 'Dust', x: startX + T + D + W, y: startY + D + T + H, w: D, h: D, dropId: 'dust-bottom-right' },
  ];

  // The outline path combines all outer edges (Trim line)
  // Slightly refined curves for a cleaner look
  const outlinePath = `
    M ${startX + T} ${startY + D + T} 
    L ${startX} ${startY + D + T + 10}
    L ${startX} ${startY + D + T + H - 10}
    L ${startX + T} ${startY + D + T + H}
    
    L ${startX + T} ${startY + D + T + H + D - 15}
    Q ${startX + T + D/2} ${startY + D + T + H + D - 5} ${startX + T + D} ${startY + D + T + H + D}
    L ${startX + T + D} ${startY + D + T + H}

    L ${startX + T + D + W} ${startY + D + T + H}

    L ${startX + T + D + W} ${startY + D + T + H + D - 15}
    Q ${startX + T + D + W + D/2} ${startY + D + T + H + D - 5} ${startX + T + D + W + D} ${startY + D + T + H + D}
    L ${startX + T + D + W + D} ${startY + D + T + H + D}

    L ${startX + T + D + W + D + 15} ${startY + D + T + H + D + T}
    L ${startX + T + D + W + D + W - 15} ${startY + D + T + H + D + T}
    L ${startX + T + D + W + D + W} ${startY + D + T + H + D}
    L ${startX + T + D + W + D + W} ${startY + D + T}

    L ${startX + T + D + W + D} ${startY + D + T}
    
    L ${startX + T + D + W + D} ${startY + T + 15}
    Q ${startX + T + D + W + D/2} ${startY + T + 5} ${startX + T + D + W} ${startY + T}
    L ${startX + T + D + W} ${startY + D + T}

    L ${startX + T + D + W} ${startY + T}
    L ${startX + T + D + W - 15} ${startY}
    L ${startX + T + D + 15} ${startY}
    L ${startX + T + D} ${startY + T}

    L ${startX + T + D} ${startY + D + T}

    L ${startX + T + D} ${startY + T + 15}
    Q ${startX + T + D/2} ${startY + T + 5} ${startX + T} ${startY + T}
    Z
  `;

  // Fold lines (Crease)
  const foldLines = `
    M ${startX + T} ${startY + D + T} L ${startX + T} ${startY + D + T + H}
    M ${startX + T + D} ${startY + D + T} L ${startX + T + D} ${startY + D + T + H}
    M ${startX + T + D + W} ${startY + D + T} L ${startX + T + D + W} ${startY + D + T + H}
    M ${startX + T + D + W + D} ${startY + D + T} L ${startX + T + D + W + D} ${startY + D + T + H}

    M ${startX + T + D} ${startY + D + T} L ${startX + T + D + W} ${startY + D + T}
    M ${startX + T + D} ${startY + D + T + H} L ${startX + T + D + W} ${startY + D + T + H}

    M ${startX + T + D + W + D} ${startY + D + T} L ${startX + T + D + W + D + W} ${startY + D + T}
    M ${startX + T + D + W + D} ${startY + D + T + H} L ${startX + T + D + W + D + W} ${startY + D + T + H}

    M ${startX + T + D} ${startY + T} L ${startX + T + D + W} ${startY + T}
    M ${startX + T + D + W + D} ${startY + D + T + H + D} L ${startX + T + D + W + D + W} ${startY + D + T + H + D}
  `;

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center select-none bg-[#f8f9fc]">
       {/* Background structural SVG */}
       <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 1400 1000" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(100, 50)">
              {/* Outer Bleed line (Green) */}
              <path d={outlinePath} fill="none" stroke="#22c55e" strokeWidth="6" strokeLinejoin="round" />
              
              {/* Fill to cover inside of thick green stroke and provide background */}
              <path d={outlinePath} fill="#ffffff" />
              
              {/* If packageColor is picked and it's not white, blend it lightly for preview */}
              {packageColor !== '#ffffff' && (
                <path d={outlinePath} fill={packageColor} fillOpacity="0.2" />
              )}
              
              {/* Inner Trim line (Blue) */}
              <path d={outlinePath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />

              {/* Fold lines (Red Dashed - Crease) */}
              <path d={foldLines} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 6" />

              {/* Dimension Lines (Pacdora style) */}
              <g stroke="#3b82f6" strokeWidth="1" fill="none">
                 {/* Left panel width */}
                 <line x1={startX+T} y1={startY+D+T+H/2} x2={startX+T+D} y2={startY+D+T+H/2} />
                 <polygon points={`${startX+T+6},${startY+D+T+H/2-4} ${startX+T},${startY+D+T+H/2} ${startX+T+6},${startY+D+T+H/2+4}`} fill="#3b82f6" stroke="none" />
                 <polygon points={`${startX+T+D-6},${startY+D+T+H/2-4} ${startX+T+D},${startY+D+T+H/2} ${startX+T+D-6},${startY+D+T+H/2+4}`} fill="#3b82f6" stroke="none" />
                 <text x={startX+T+D/2} y={startY+D+T+H/2-8} fill="#3b82f6" fontSize="14" textAnchor="middle" stroke="none">60.60 mm</text>

                 {/* Front panel width */}
                 <line x1={startX+T+D} y1={startY+D+T+H/2} x2={startX+T+D+W} y2={startY+D+T+H/2} />
                 <polygon points={`${startX+T+D+6},${startY+D+T+H/2-4} ${startX+T+D},${startY+D+T+H/2} ${startX+T+D+6},${startY+D+T+H/2+4}`} fill="#3b82f6" stroke="none" />
                 <polygon points={`${startX+T+D+W-6},${startY+D+T+H/2-4} ${startX+T+D+W},${startY+D+T+H/2} ${startX+T+D+W-6},${startY+D+T+H/2+4}`} fill="#3b82f6" stroke="none" />
                 <text x={startX+T+D+W/2} y={startY+D+T+H/2-8} fill="#3b82f6" fontSize="14" textAnchor="middle" stroke="none">120.60 mm</text>

                 {/* Height dimension (right side of back panel) */}
                 <line x1={startX+T+D+W+D+W+25} y1={startY+D+T} x2={startX+T+D+W+D+W+25} y2={startY+D+T+H} />
                 <polygon points={`${startX+T+D+W+D+W+21},${startY+D+T+6} ${startX+T+D+W+D+W+25},${startY+D+T} ${startX+T+D+W+D+W+29},${startY+D+T+6}`} fill="#3b82f6" stroke="none" />
                 <polygon points={`${startX+T+D+W+D+W+21},${startY+D+T+H-6} ${startX+T+D+W+D+W+25},${startY+D+T+H} ${startX+T+D+W+D+W+29},${startY+D+T+H-6}`} fill="#3b82f6" stroke="none" />
                 <text x={startX+T+D+W+D+W+40} y={startY+D+T+H/2} fill="#3b82f6" fontSize="14" alignmentBaseline="middle" stroke="none">162.10 mm</text>

                 {/* Overall Width (bottom) */}
                 <line x1={startX} y1={startY+D+T+H+D+T+50} x2={startX+T+D+W+D+W} y2={startY+D+T+H+D+T+50} />
                 <polygon points={`${startX+6},${startY+D+T+H+D+T+46} ${startX},${startY+D+T+H+D+T+50} ${startX+6},${startY+D+T+H+D+T+54}`} fill="#3b82f6" stroke="none" />
                 <polygon points={`${startX+T+D+W+D+W-6},${startY+D+T+H+D+T+46} ${startX+T+D+W+D+W},${startY+D+T+H+D+T+50} ${startX+T+D+W+D+W-6},${startY+D+T+H+D+T+54}`} fill="#3b82f6" stroke="none" />
                 <text x={startX+(T+D+W+D+W)/2} y={startY+D+T+H+D+T+50} fill="#999" fontSize="14" alignmentBaseline="middle" textAnchor="middle" stroke="none" style={{ background: '#f8f9fc', padding: '0 10px' }}>
                    <tspan dx="-20">380.0 mm</tspan>
                 </text>

                 {/* Overall Height (right) */}
                 <line x1={startX+T+D+W+D+W+80} y1={startY} x2={startX+T+D+W+D+W+80} y2={startY+D+T+H+D+T} />
                 <text x={startX+T+D+W+D+W+80} y={startY+(D+T+H+D+T)/2} fill="#999" fontSize="14" textAnchor="middle" stroke="none" transform={`rotate(-90 ${startX+T+D+W+D+W+80} ${startY+(D+T+H+D+T)/2})`} dy="-10">
                    303.7 mm
                 </text>
              </g>

              {/* Legends (Top Left) */}
              <g transform="translate(100, 40)" fontSize="12" fill="#666">
                <line x1="0" y1="0" x2="30" y2="0" stroke="#22c55e" strokeWidth="2" />
                <text x="40" y="4">Bleed</text>

                <line x1="90" y1="0" x2="120" y2="0" stroke="#3b82f6" strokeWidth="2" />
                <text x="130" y="4">Trim</text>

                <line x1="170" y1="0" x2="200" y2="0" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="210" y="4">Crease</text>
              </g>
          </g>
       </svg>

       {/* Interactive Zones for Framer Motion */}
       <div className="absolute inset-0 pointer-events-none" style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
         <svg className="w-full h-full" viewBox="0 0 1400 1000" preserveAspectRatio="xMidYMid meet">
           <g transform="translate(100, 50)">
             <foreignObject x="0" y="0" width="1400" height="1000">
               <div className="w-full h-full relative">
                  {panels.map(panel => (
                    <div
                      key={panel.id}
                      className="absolute pointer-events-auto flex items-center justify-center overflow-hidden"
                      style={{
                        left: panel.x,
                        top: panel.y,
                        width: panel.w,
                        height: panel.h,
                      }}
                    >
                      {placedImages.filter(img => img.face === panel.dropId && img.side === activeSide).map(img => (
                        <motion.div
                          key={img.id}
                          className="absolute cursor-move border border-indigo-400/0 hover:border-indigo-400/100 transition-colors"
                          drag
                          dragMomentum={false}
                          initial={{ x: img.x, y: img.y }}
                          onDragEnd={(_, info) => {
                            updatePlacedImage(img.id, {
                              x: img.x + info.offset.x,
                              y: img.y + info.offset.y
                            });
                          }}
                          style={{
                            width: img.width,
                            height: img.height,
                            x: img.x,
                            y: img.y
                          }}
                        >
                          <img 
                            src={img.url} 
                            alt="" 
                            className="w-full h-full object-contain pointer-events-none" 
                            style={{ transform: `rotate(${img.rotation}deg)` }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlacedImage(img.id);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 hover:opacity-100"
                          >
                            ✕
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ))}
               </div>
             </foreignObject>
           </g>
         </svg>
       </div>
    </div>
  );
}
