// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBoxStore } from '../../lib/useBoxStore';
import { sendAiChatMessage } from '../../services/ai';
import Box3DViewer from '../../components/Box3DViewer';
import AiPackagingAssistant from '../components/AiPackagingAssistant';
import { generateRTEDielineDXF } from '../../lib/rteDielineGenerator';
import { generateTEDielineDXF } from '../../lib/teDielineGenerator';
import { generateAutoLockDieline } from '../../lib/autoLockDielineGenerator';
import { generateCosmeticBoxDieline } from '../../lib/cosmeticBoxDielineGenerator';
import { generateDXFString } from '../../lib/exportUtils';
import DielineSVG from '../../components/DielineSVG';
import EditorModal from './EditorModal';
import Header from '../components/layout/Header';
import './AiStudioPage.css';
import { 
  Sparkles, 
  Send, 
  RotateCcw, 
  History, 
  X, 
  Image as ImageIcon, 
  LayoutGrid, 
  Box, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  MousePointer,
  Grid,
  MapPin,
  Type,
  ExternalLink,
  Download,
  Play,
  Pause,
  Sliders,
  CheckCircle2,
  Layers,
  Palette,
  Eye,
  Edit3,
  Move,
  Maximize2
} from 'lucide-react';

interface AiStudioPageProps {
  onBack?: () => void;
  onNavigateToWorkshop?: () => void;
}



export default function AiStudioPage({ onBack, onNavigateToWorkshop }: AiStudioPageProps) {
  const store = useBoxStore((state: any) => state);
  
  // Hydrate persistent state from localStorage if available
  const savedStudioState = useMemo(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('kld_ai_studio_state') : null;
      if (s) return JSON.parse(s);
    } catch (e) {}
    return null;
  }, []);

  // Core UI State
  const [cardMode, setCardMode] = useState<'render' | '3d' | '2d'>(savedStudioState?.cardMode || 'render'); // AI Render | 3D Model | 2D Dieline
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatThread, setChatThread] = useState<any[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<any>(null);
  
  // Compositor Layer State
  const currentDecals = store.aiDecalsByModel ? (store.aiDecalsByModel[store.boxModel] || []) : [];
  
  useEffect(() => {
    // Ensure we are operating in the mockup context so we don't accidentally leak changes to the dieline context
    if (store.setContextAndModel) {
      store.setContextAndModel("mockup", store.boxModel);
    }
  }, []);
  
  // Try to find the existing applied background from the store if one isn't explicitly active
  const initialBgUrl = useMemo(() => {
    const bgDecal = currentDecals.find(d => d.type === 'image' && d.url);
    return bgDecal ? bgDecal.url : null;
  }, [currentDecals]);

  const [activeBackgroundUrl, setActiveBackgroundUrl] = useState<string | null>(savedStudioState?.activeBackgroundUrl || null);
  const [activeIconUrl, setActiveIconUrl] = useState<string | null>(savedStudioState?.activeIconUrl || null);
  const [activeTypography, setActiveTypography] = useState<any>(savedStudioState?.activeTypography || null);

  // If no background is actively set, but we have one in the store, use it for the AI 2D view
  const displayBackgroundUrl = activeBackgroundUrl || initialBgUrl;
  
  const [showBriefAccordion, setShowBriefAccordion] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [foldProgress, setFoldProgress] = useState(1); // 1 = closed box, 0 = open dieline
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Per-prompt box tracking (Pacdora-accurate routing)
  const [activeBoxModel, setActiveBoxModel] = useState<string>(savedStudioState?.activeBoxModel || store.boxModel || 'rte');
  const [activeBoxColor, setActiveBoxColor] = useState<string>(savedStudioState?.activeBoxColor || store.packageColor || '#18181b');
  const [activeDims_mm, setActiveDims_mm] = useState(savedStudioState?.activeDims_mm || { L: 120, W: 80, H: 200 });
  const [activeArtworkFace, setActiveArtworkFace] = useState<string>('front');

  // Keep activeBoxModel in sync whenever store.boxModel changes
  useEffect(() => {
    if (store.boxModel && store.boxModel !== activeBoxModel) {
      setActiveBoxModel(store.boxModel);
    }
  }, [store.boxModel]);

  const handleApplyBoxModel = (model: string, dimsIn?: any, dimsMm?: any) => {
    setActiveBoxModel(model);
    if (store.setBoxModel) {
      store.setBoxModel(model);
    }
    if (dimsIn && store.setDim) {
      store.setDim('L', dimsIn.L);
      store.setDim('W', dimsIn.W);
      store.setDim('H', dimsIn.H);
    }
    if (dimsMm) {
      setActiveDims_mm(dimsMm);
    } else if (dimsIn) {
      setActiveDims_mm({
        L: Math.round(dimsIn.L * 25.4),
        W: Math.round(dimsIn.W * 25.4),
        H: Math.round(dimsIn.H * 25.4)
      });
    }
    // Switch canvas immediately to 3D mode so user sees the box in 3D
    setCardMode('3d');
  };

  // Save studio state whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem('kld_ai_studio_state', JSON.stringify({
        activeBackgroundUrl,
        activeIconUrl,
        activeTypography,
        activeBoxModel,
        activeBoxColor,
        activeDims_mm,
        cardMode
      }));
    } catch (e) {}
  }, [activeBackgroundUrl, activeIconUrl, activeTypography, activeBoxModel, activeBoxColor, activeDims_mm, cardMode]);
  
  // AI Second Edit State
  const [selectedPanel, setSelectedPanel] = useState<'Front' | 'Back' | 'Left' | 'Right'>('Front');
  const [decalX, setDecalX] = useState(0);
  const [decalY, setDecalY] = useState(0);
  const [decalScale, setDecalScale] = useState(1);
  const [overlayText, setOverlayText] = useState('');
  const [showSecondEditPanel, setShowSecondEditPanel] = useState(false);



  // Helper to construct AI compositor decals locally
  // Helper to construct AI full-bleed wrap decals on dieline & 3D model
  const syncDecalsToStore = (bgUrl: string, iconUrl?: string, typography?: any) => {
    if (!bgUrl) return;
    const W = store.W || 2.36;
    const H = store.H || 6.29;
    const L = store.L || 4.72;
    const glue = store.glueFlapWidth || 0.625;

    // Full dieline span across all panels
    const totalW = glue + L * 2 + W * 2;
    const yTop = W + 0.625;
    const totalH = H + W * 2 + 1.25;
    const xCenter = totalW / 2;
    const yCenter = yTop + (H / 2);

    const wrapDecal = {
      id: 'ai-wrap-' + Date.now(),
      type: 'image',
      url: bgUrl,
      width: totalW,
      height: totalH,
      x: xCenter,
      y: yCenter,
      surface: 'Outside',
      isWrap: true
    };

    const newDecals: any[] = [wrapDecal];

    // Optional user-specified typography on front panel
    if (typography && typography.brandName) {
      const frontX = glue + L / 2;
      newDecals.push({
        id: 'ai-typo',
        type: 'text',
        content: typography.brandName,
        fontFamily: typography.fontStyle || 'sans-serif',
        color: typography.color || '#ffffff',
        bold: true,
        fontSize: Math.max(0.2, H * 0.05),
        x: frontX,
        y: yCenter,
        width: L * 0.8,
        height: H * 0.2,
        surface: 'Outside',
        textAlign: 'center'
      });
    }

    store.setAiDecals(newDecals);
    if (typeof store.setDecals === 'function') {
      store.setDecals(newDecals);
    }
  };

  // Restore compositor decals on initial mount if saved background is present
  useEffect(() => {
    if (savedStudioState?.activeBackgroundUrl) {
      syncDecalsToStore(
        savedStudioState.activeBackgroundUrl,
        savedStudioState.activeIconUrl,
        savedStudioState.activeTypography
      );
    }
  }, []);

  const handleApplyVariationTo3DModel = (variation: any) => {
    const bgUrl = variation.backgroundUrl || variation.url;
    setActiveBackgroundUrl(bgUrl);
    setActiveIconUrl(variation.iconUrl || null);
    setActiveTypography(variation.typography || null);

    // Automatically extract dominant color from the design
    if (bgUrl) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        
        try {
          const data = ctx.getImageData(0, 0, 50, 50).data;
          let r = 0, g = 0, b = 0, count = 0;
          
          for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
              if (x < 5 || x > 45 || y < 5 || y > 45) {
                const idx = (y * 50 + x) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
              }
            }
          }
          
          if (count > 0) {
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            setActiveBoxColor(hex);
            if (typeof store.setPackageColor === 'function') {
              store.setPackageColor(hex);
            }
          }
        } catch (e) {
          console.warn("Could not extract color automatically:", e);
        }
      };
      img.src = bgUrl;
    }

    // Apply the full-bleed continuous wrap decal across the entire box
    syncDecalsToStore(bgUrl, variation.iconUrl, variation.typography);
  };


  const W_in = store.W || 2.36;
  const H_in = store.H || 6.29;
  const L_in = store.L || 4.72;

  return (
    <div className={`ai-studio-root ${store.theme === 'dark' ? 'dark-theme' : ''}`}>
      
      {/* --- TOP NAVIGATION BAR --- */}
      <Header activeNav="aistudio" />
      
      {/* --- AI STUDIO TOOLBAR --- */}
      <div className="ai-studio-topbar" style={{ marginTop: '10px' }}>
        <div className="ai-topbar-left">
          <span className="ai-project-name" style={{ marginLeft: '12px' }}>Untitled KLD AI Design</span>
        </div>
      </div>

      {/* --- MAIN STUDIO WORKSPACE --- */}
      <div className="ai-studio-main">

        {/* --- CENTER CANVAS WORKSPACE --- */}
        <div className="ai-canvas-workspace">
          
            {/* Pacdora 2D | 3D Interactive Card Canvas Container */}
            <div style={{ position: 'relative', width: '560px', height: '560px', background: '#ffffff', border: '2px stroke #a855f7', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Card Header: mode badge + 3-way toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'transparent', zIndex: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7e22ce', fontSize: '13px', fontWeight: '800' }}>
                  <Sparkles style={{ width: '15px', height: '15px' }} />
                  <span>{
                    cardMode === 'render' ? 'AI Product Render' :
                    cardMode === '3d' ? '3D Box Model' : '2D Dieline'
                  }</span>
                </div>
                {/* 3-way pill: AI Render | 3D | 2D */}
                <div style={{ display: 'flex', background: '#18181b', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                  {(['render', '3d', '2d'] as const).map(m => (
                    <button key={m} onClick={() => setCardMode(m)}
                      style={{ background: cardMode === m ? '#fff' : 'transparent', color: cardMode === m ? '#000' : '#a1a1aa', border: 'none', padding: '4px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {m === 'render' ? 'AI' : m === '3d' ? '3D' : '2D'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Main Viewport */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

                {cardMode === 'render' ? (
                  /* AI Compositor Preview — shows bg + icon + text composited */
                  <div style={{ width: '100%', height: '100%', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {displayBackgroundUrl ? (
                      <>
                        {/* 1. Base graphic */}
                        <img src={displayBackgroundUrl} alt="Background Art" style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain', boxShadow: '0 12px 40px rgba(0,0,0,0.1)', borderRadius: '4px' }}/>
                        
                        {/* 2. Isolated Icon (Centered) */}
                        {activeIconUrl && (
                          <div style={{ zIndex: 2, mixBlendMode: 'multiply', marginBottom: '40px', position: 'absolute' }}>
                            <img src={activeIconUrl} alt="icon" style={{ width: '180px', height: '180px', objectFit: 'contain' }} />
                          </div>
                        )}
                        
                        {/* 3. Typography Layer */}
                        {activeTypography?.brandName && (
                          <div style={{ position: 'absolute', bottom: '15%', zIndex: 3, textAlign: 'center', color: activeTypography.color || '#000', fontFamily: activeTypography.fontStyle || 'sans-serif' }}>
                            <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '2px', margin: 0 }}>{activeTypography.brandName}</h2>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#a1a1aa', zIndex: 10 }}>
                        <Sparkles style={{ width: '32px', height: '32px', opacity: 0.3 }}/>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>AI composites appear here</span>
                      </div>
                    )}
                  </div>
                ) : cardMode === '3d' ? (
                  /* 3D WebGL Box — uses activeBoxModel (correct per prompt type) */
                  <div 
                    style={{ width: '100%', height: '100%', position: 'relative' }}
                    onDoubleClick={() => setIsEditorOpen(true)}
                  >
                    <Box3DViewer
                      boxModelOverride={store.boxModel || activeBoxModel}
                      overrideLayout="single"
                      L={store.L}
                      W={store.W}
                      H={store.H}
                      T={store.T}
                      progress={foldProgress}
                      zoom={zoomLevel}
                      materialPreset={(store.materialType || '').toLowerCase().includes('corrugated') ? 'corrugated-kraft' : 'white-kraft'}
                      lightingPreset="studio"
                      decals={currentDecals}
                    />
                    {/* Fold slider */}
                    <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#ffffff', border: '1px solid #e4e4e7', padding: '8px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10 }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#71717a' }}>Open</span>
                      <input type="range" min="0" max="1" step="0.01" value={foldProgress}
                        onChange={e => { setFoldProgress(parseFloat(e.target.value)); setIsPlaying(false); }}
                        style={{ width: '130px', accentColor: '#2563eb', cursor: 'pointer' }}/>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#71717a' }}>Close</span>
                      <div style={{ width: '1px', height: '16px', background: '#e4e4e7', margin: '0 4px' }} />
                      <button onClick={() => setIsPlaying(!isPlaying)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                        {isPlaying ? <Pause style={{ width: '14px', height: '14px' }} /> : <Play style={{ width: '14px', height: '14px' }} />}
                        <span>{isPlaying ? 'Pause' : 'Fold'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 2D Structural Dieline */
                  <div 
                    style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
                    onDoubleClick={() => setIsEditorOpen(true)}
                  >
                    <div style={{ width: '100%', height: '100%', transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}>
                      <DielineSVG
                        isEditorMode={false}
                        decals={currentDecals}
                        activeColor={activeBoxColor}
                        L_override={activeDims_mm.L}
                        W_override={activeDims_mm.W}
                        H_override={activeDims_mm.H}
                        model_override={store.boxModel || activeBoxModel}
                      />
                    </div>
                  </div>
                )}

              </div>

            </div>

          {/* Floating Canvas Bottom Toolbar */}
          <div className="ai-canvas-floating-toolbar">
            <button className="ai-canvas-tool-btn active" title="Select pointer">
              <MousePointer style={{ width: '16px', height: '16px' }} />
            </button>
            <button 
              className={`ai-canvas-tool-btn ${showGrid ? 'active' : ''}`}
              onClick={() => setShowGrid(!showGrid)} 
              title="Toggle grid overlay"
            >
              <Grid style={{ width: '16px', height: '16px' }} />
            </button>
            <button className="ai-canvas-tool-btn" title="Position locator">
              <MapPin style={{ width: '16px', height: '16px' }} />
            </button>
            <div className="ai-canvas-divider" />
            <button className="ai-canvas-tool-btn" title="Choose 3D model">
              <Box style={{ width: '16px', height: '16px' }} />
            </button>
            <button className="ai-canvas-tool-btn" title="Import media/image">
              <ImageIcon style={{ width: '16px', height: '16px' }} />
            </button>
            <button className="ai-canvas-tool-btn" title="Typography text">
              <Type style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Bottom Left Zoom Controls */}
          <div className="ai-canvas-bottom-left">
            <button 
              onClick={() => setZoomLevel(Math.max(0.4, zoomLevel - 0.1))}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
            >
              −
            </button>
            <span>{Math.round(zoomLevel * 100)}%</span>
            <button 
              onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
            >
              +
            </button>
          </div>

        </div>

        {/* --- AI SECOND EDIT WORKSPACE SIDEBAR PANEL --- */}
        {showSecondEditPanel && (
          <div style={{ width: '280px', background: '#ffffff', borderLeft: '1px solid #e4e4e7', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#18181b' }}>AI Second Edit</span>
              <button onClick={() => setShowSecondEditPanel(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Target Panel Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#71717a', textTransform: 'uppercase' }}>Target Box Panel</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {['Front', 'Back', 'Left', 'Right'].map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPanel(p as any);
                    }}
                    style={{ background: selectedPanel === p ? '#2563eb' : '#f4f4f5', color: selectedPanel === p ? '#fff' : '#18181b', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {p} Face
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Text Overlay */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#71717a', textTransform: 'uppercase' }}>Typography Overlay</span>
              <input 
                type="text"
                placeholder="e.g. 750ml • 14.5% ALC / VOL"
                value={overlayText}
                onChange={(e) => {
                  setOverlayText(e.target.value);
                  if (activeBackgroundUrl) syncDecalsToStore(activeBackgroundUrl, activeIconUrl, { ...activeTypography, brandName: e.target.value });
                }}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }}
              />
            </div>
          </div>
        )}

        {/* --- RIGHT SIDEBAR ("AI packaging design") --- */}
        <div style={{ width: '420px', borderLeft: '1px solid #e4e4e7', background: '#fcfcfc', display: 'flex', flexDirection: 'column' }}>
          <AiPackagingAssistant 
            useStore={useBoxStore} 
            isOpen={true} 
            onApplyVariation={handleApplyVariationTo3DModel} 
            onApplyBoxModel={handleApplyBoxModel}
          />
        </div>
      </div>

      {isEditorOpen && (
        <EditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} isAiMode={true} />
      )}
    </div>
  );
}
