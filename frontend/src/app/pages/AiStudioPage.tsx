// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBoxStore } from '../../lib/useBoxStore';
import { sendAiChatMessage, detectDielineFile } from '../../services/ai';
import Box3DViewer from '../../components/Box3DViewer';
import AiPackagingAssistant from '../components/AiPackagingAssistant';
import { generateRTEDielineDXF } from '../../lib/rteDielineGenerator';
import { generateTEDielineDXF } from '../../lib/teDielineGenerator';
import { generateAutoLockDieline } from '../../lib/autoLockDielineGenerator';
import { generateCosmeticBoxDieline } from '../../lib/cosmeticBoxDielineGenerator';
import { generateDXFString } from '../../lib/exportUtils';
import DielineSVG from '../../components/DielineSVG';
const EditorModal = React.lazy(() => import('./EditorModal'));
const BoxStudioModal = React.lazy(() => import('./BoxStudioModal'));
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
  Maximize2,
  Scissors,
  Upload,
  ScanLine,
  FileCheck,
  Check
} from 'lucide-react';

interface AiStudioPageProps {
  onBack?: () => void;
  onNavigateToWorkshop?: () => void;
}

const BOX_TITLES: Record<string, string> = {
  rsc: 'Square Shipping Box',
  rte: 'Reverse Tuck End Box',
  te: 'Straight Tuck End Box',
  auto_lock: 'Auto Lock Bottom Box',
  cosmetic: 'Cosmetic Box',
  cosmetic_b: 'Mailer / Tray Box',
  button_hole: 'Button Hole Box',
  pizza_box: 'Pizza Box (FEFCO 0426)',
  fefco_0300: 'Shoe Box with Lid (FEFCO 0300)',
  water_bottle: 'Water Bottle',
  sipper_water_bottle: 'Sipper Water Bottle with Handle',
  can: 'Beverage Can',
  slim_can: 'Slim / Sleek Can',
  tube: 'Toothpaste & Squeeze Tube'
};

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
  
  const [activeBackgroundUrl, setActiveBackgroundUrl] = useState<string | null>(null);
  const [activeIconUrl, setActiveIconUrl] = useState<string | null>(null);
  const [activeTypography, setActiveTypography] = useState<any>(null);

  // Decal is only visible when user explicitly applies it via 3D Studio button
  const displayBackgroundUrl = activeBackgroundUrl;

  // Compositor Layer State: Decals are strictly opt-in and only active when user explicitly clicks 3D Studio for a variation
  const currentDecals = activeBackgroundUrl && store.aiDecalsByModel ? (store.aiDecalsByModel[store.boxModel] || []) : [];
  
  useEffect(() => {
    // Ensure we are operating in the mockup context so we don't accidentally leak changes to the dieline context
    if (store.setContextAndModel) {
      store.setContextAndModel("mockup", store.boxModel);
    }
  }, []);
  
  const [showBriefAccordion, setShowBriefAccordion] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [foldProgress, setFoldProgress] = useState(1); // 1 = closed box, 0 = open dieline
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDielineStudioOpen, setIsDielineStudioOpen] = useState(false);

  // AI Dieline Detector state
  const dielineFileInputRef = useRef<HTMLInputElement>(null);
  const [isDielineDetecting, setIsDielineDetecting] = useState(false);
  const [dielineDetectionResult, setDielineDetectionResult] = useState<any>(null);

  const handleDielineFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDielineDetecting(true);
    try {
      const result = await detectDielineFile(file);
      setDielineDetectionResult(result);

      const targetKey = result.matchedModelKey || (result as any).model || 'rte';
      setActiveBoxModel(targetKey);
      if (typeof store.setBoxModel === 'function') {
        store.setBoxModel(targetKey);
      } else {
        useBoxStore.setState({ boxModel: targetKey });
      }

      if (result.dimensionsIn) {
        useBoxStore.setState({
          L: result.dimensionsIn.L,
          W: result.dimensionsIn.W,
          H: result.dimensionsIn.H
        });
      } else if (result.dimensions) {
        const isMm = result.dimensions.unit === 'mm' || result.dimensions.L > 30;
        const scale = isMm ? 1 / 25.4 : 1;
        useBoxStore.setState({
          L: Number((result.dimensions.L * scale).toFixed(2)),
          W: Number((result.dimensions.W * scale).toFixed(2)),
          H: Number((result.dimensions.H * scale).toFixed(2))
        });
      }

      // Switch to 3d mode so user sees the detected box
      setCardMode('3d');
    } catch (err: any) {
      console.error('Dieline detection error:', err);
      alert('Unable to analyze dieline file. Please ensure it is a valid DXF, SVG, PDF, or image.');
    } finally {
      setIsDielineDetecting(false);
      if (dielineFileInputRef.current) dielineFileInputRef.current.value = '';
    }
  };

  // Per-prompt box tracking (Pacdora-accurate routing)
  const [activeBoxModel, setActiveBoxModel] = useState<string>(savedStudioState?.activeBoxModel || store.boxModel || 'rte');
  const [activeBoxColor, setActiveBoxColor] = useState<string>(savedStudioState?.activeBoxColor || store.packageColor || '#18181b');
  const [activeDims_mm, setActiveDims_mm] = useState(savedStudioState?.activeDims_mm || { L: 120, W: 80, H: 200 });
  const [activeArtworkFace, setActiveArtworkFace] = useState<string>('front');

  // Keep activeBoxModel in sync and ensure box starts completely blank when model changes
  useEffect(() => {
    if (store.boxModel && store.boxModel !== activeBoxModel) {
      setActiveBoxModel(store.boxModel);
      setActiveBackgroundUrl(null);
      setActiveIconUrl(null);
      setActiveTypography(null);
      if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
      else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
    }
  }, [store.boxModel]);

  const handleApplyBoxModel = (model: string, dimsIn?: any, dimsMm?: any) => {
    setActiveBoxModel(model);
    // Independent decal rule: clear decals completely so new box opens 100% blank
    setActiveBackgroundUrl(null);
    setActiveIconUrl(null);
    setActiveTypography(null);
    if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
    else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);

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
        W: Math.round(dimsIn.L * 25.4),
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

  // Decals are strictly independent & opt-in: keep 3D box clean by default on initial mount
  useEffect(() => {
    setActiveBackgroundUrl(null);
    setActiveIconUrl(null);
    setActiveTypography(null);
    if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
    else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
    try {
      localStorage.removeItem('kld_saved_ai_decals');
      localStorage.removeItem('kld_ai_studio_state');
    } catch (e) {}
  }, []);

  const handleApplyVariationTo3DModel = (variation: any) => {
    if (!variation) {
      setActiveBackgroundUrl(null);
      setActiveIconUrl(null);
      setActiveTypography(null);
      if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
      else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
      if (typeof store.setDecals === 'function') store.setDecals([]);
      return;
    }
    const bgUrl = variation.backgroundUrl || variation.url;
    setActiveBackgroundUrl(bgUrl);
    setActiveIconUrl(variation.iconUrl || null);
    setActiveTypography(variation.typography || null);
    setCardMode('3d');

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

      {/* --- MAIN STUDIO WORKSPACE --- */}
      <div className="ai-studio-main">

        {/* --- CENTER CANVAS WORKSPACE --- */}
        <div className="ai-canvas-workspace">
          
          {/* Subtle Ambient Radial Glow */}
          <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '650px', height: '280px', background: 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.09) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 80%)', pointerEvents: 'none', zIndex: 0 }} />

          {/* Hidden File Input for Dieline Detector */}
          <input
            type="file"
            ref={dielineFileInputRef}
            onChange={handleDielineFileUpload}
            accept=".dxf,.svg,.pdf,.png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
          />

          {/* Top Engine Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '8px', zIndex: 5, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '20px', background: 'rgba(147, 51, 234, 0.08)', border: '1px solid rgba(147, 51, 234, 0.22)', color: '#7e22ce', fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <Sparkles style={{ width: '12px', height: '12px', color: '#9333ea' }} />
              <span>AI Packaging Engine • Live Precision CAD</span>
            </div>
          </div>

          {/* Prominent AI Dieline & CAD Detector Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            width: '600px',
            maxWidth: '92%',
            padding: '10px 16px',
            marginBottom: '12px',
            borderRadius: '16px',
            background: store.theme === 'dark' ? '#18181b' : '#ffffff',
            border: '1.5px dashed rgba(99, 102, 241, 0.45)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
              }}>
                <ScanLine style={{ width: '17px', height: '17px' }} />
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: store.theme === 'dark' ? '#f4f4f5' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>AI Dieline & CAD Detector</span>
                  <span style={{ fontSize: '9px', fontWeight: '800', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '6px' }}>
                    NEW
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                  Upload DXF, SVG, or photo to auto-detect box family, crease lines & dimensions
                </div>
              </div>
            </div>

            <button
              onClick={() => !isDielineDetecting && dielineFileInputRef.current?.click()}
              disabled={isDielineDetecting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '800',
                border: 'none',
                cursor: isDielineDetecting ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              {isDielineDetecting ? (
                <>
                  <div style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Upload style={{ width: '13px', height: '13px' }} />
                  <span>Upload Dieline</span>
                </>
              )}
            </button>
          </div>

          {/* Dieline Detection Banner (when detected) */}
          {dielineDetectionResult && (
            <div style={{
              width: '600px',
              maxWidth: '92%',
              padding: '10px 14px',
              marginBottom: '10px',
              borderRadius: '14px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0 }} />
                <div style={{ fontSize: '11px', fontWeight: '700' }}>
                  <span>Matched: <strong>{dielineDetectionResult.matchedTitle || dielineDetectionResult.matchedModelKey}</strong> ({Math.round(dielineDetectionResult.confidence > 1 ? dielineDetectionResult.confidence : dielineDetectionResult.confidence * 100)}% match)</span>
                  {dielineDetectionResult.dimensionsIn && (
                    <span style={{ opacity: 0.8, marginLeft: '6px' }}>
                      ({dielineDetectionResult.dimensionsIn.L.toFixed(2)}″ × {dielineDetectionResult.dimensionsIn.W.toFixed(2)}″ × {dielineDetectionResult.dimensionsIn.H.toFixed(2)}″)
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setCardMode('2d')}
                  style={{ background: '#fff', border: '1px solid #10b981', color: '#065f46', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                >
                  View 2D CAD
                </button>
                <button
                  onClick={() => setDielineDetectionResult(null)}
                  style={{ background: 'transparent', border: 'none', color: '#065f46', cursor: 'pointer', padding: '2px', display: 'flex' }}
                  title="Dismiss"
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          )}

          {/* Interactive Card Canvas Container */}
          <div style={{ 
            position: 'relative', 
            width: '600px', 
            height: '600px', 
            maxWidth: '92%', 
            maxHeight: '80vh', 
            background: store.theme === 'dark' ? '#141518' : '#FAF8F4', 
            border: store.theme === 'dark' ? '1px solid #27272a' : '1px solid rgba(0,0,0,0.08)', 
            borderRadius: '24px', 
            boxShadow: store.theme === 'dark' ? '0 25px 60px rgba(0,0,0,0.5)' : '0 25px 70px -15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            zIndex: 5
          }}>
            
            {/* Card Header: Clean mode badge on left + Action button & 3-way toggle on right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: store.theme === 'dark' ? '#1f1f23' : '#ffffff', borderBottom: store.theme === 'dark' ? '1px solid #27272a' : '1px solid rgba(0,0,0,0.06)', zIndex: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: cardMode === '3d' ? '#eff6ff' : cardMode === '2d' ? '#f5f3ff' : '#f4f4f5', color: cardMode === '3d' ? '#2563eb' : cardMode === '2d' ? '#7c3aed' : '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles style={{ width: '15px', height: '15px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: store.theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                    {cardMode === 'render' ? 'AI Product Render' : cardMode === '3d' ? '3D Box Model' : '2D CAD Dieline'}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>
                    {BOX_TITLES[store.boxModel || activeBoxModel] || 'Standard Packaging'}
                  </span>
                </div>
              </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Subtle, elegant header actions */}
                  {cardMode === '2d' && (
                    <button
                      onClick={() => setIsDielineStudioOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#0f172a'; }}
                      title="Open full Dieline Generator & Studio"
                    >
                      <Scissors style={{ width: '12px', height: '12px', color: '#2563eb' }} />
                      <span>Customise Dieline</span>
                      <ExternalLink style={{ width: '11px', height: '11px', opacity: 0.6 }} />
                    </button>
                  )}

                  {cardMode === '3d' && (
                    <button
                      onClick={() => setIsEditorOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#0f172a'; }}
                      title="Customise 3D Box graphics and artwork"
                    >
                      <Box style={{ width: '12px', height: '12px', color: '#2563eb' }} />
                      <span>Customise Box</span>
                      <ExternalLink style={{ width: '11px', height: '11px', opacity: 0.6 }} />
                    </button>
                  )}

                  {/* Quick AI Dieline Scan button */}
                  <button
                    onClick={() => dielineFileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Upload DXF, SVG or dieline photo for AI structural auto-detection"
                  >
                    <ScanLine style={{ width: '12px', height: '12px' }} />
                    <span>AI Dieline</span>
                  </button>

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
              </div>

              {/* Card Main Viewport */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: store.theme === 'dark' ? '#141518' : '#FAF8F4' }}>

                {cardMode === 'render' ? (
                  /* AI Compositor Preview — shows bg + icon + text composited */
                  <div style={{ width: '100%', height: '100%', background: store.theme === 'dark' ? '#1c1c1f' : '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      position: 'relative',
                      background: store.theme === 'dark' 
                        ? 'radial-gradient(circle at 50% 45%, #1e2024 0%, #121316 100%)' 
                        : 'radial-gradient(circle at 50% 40%, #ffffff 0%, #FAF8F4 70%, #efebe2 100%)'
                    }}
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
                    <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: store.theme === 'dark' ? 'rgba(30, 32, 36, 0.92)' : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', border: store.theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)', padding: '8px 22px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 12px 30px -6px rgba(0,0,0,0.12)', zIndex: 10 }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: store.theme === 'dark' ? '#a1a1aa' : '#64748b' }}>Open</span>
                      <input type="range" min="0" max="1" step="0.01" value={foldProgress}
                        onChange={e => { setFoldProgress(parseFloat(e.target.value)); setIsPlaying(false); }}
                        style={{ width: '130px', accentColor: '#2563eb', cursor: 'pointer' }}/>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: store.theme === 'dark' ? '#a1a1aa' : '#64748b' }}>Close</span>
                      <div style={{ width: '1px', height: '16px', background: store.theme === 'dark' ? '#3f3f46' : '#cbd5e1', margin: '0 4px' }} />
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
                    style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                    onDoubleClick={() => setIsDielineStudioOpen(true)}
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

                    {/* Prominent floating action button in 2D mode */}
                    <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                      <button
                        onClick={() => setIsDielineStudioOpen(true)}
                        style={{
                          background: '#ffffff',
                          color: '#0f172a',
                          border: '1.5px solid #cbd5e1',
                          padding: '8px 18px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <Scissors style={{ width: '13px', height: '13px', color: '#2563eb' }} />
                        <span>Open Dieline Studio (Dimensions & CAD)</span>
                        <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.6 }} />
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          {/* Floating Canvas Bottom Toolbar */}
          <div className="ai-canvas-floating-toolbar" style={{ left: 'calc(50% - 35px)' }}>
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
        <div style={{ width: '520px', minWidth: '460px', maxWidth: '620px', borderLeft: store.theme === 'dark' ? '1px solid #27272a' : '1px solid rgba(0,0,0,0.08)', boxShadow: '-4px 0 24px rgba(0,0,0,0.03)', background: store.theme === 'dark' ? '#18181b' : '#ffffff', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <AiPackagingAssistant 
            useStore={useBoxStore} 
            isOpen={true} 
            onApplyVariation={handleApplyVariationTo3DModel} 
            onApplyBoxModel={handleApplyBoxModel}
          />
        </div>
      </div>

      <React.Suspense fallback={null}>
        {isDielineStudioOpen && (
          <BoxStudioModal
            isOpen={isDielineStudioOpen}
            onClose={() => setIsDielineStudioOpen(false)}
            initialModel={store.boxModel || activeBoxModel}
            boxTitle={BOX_TITLES[store.boxModel || activeBoxModel] || 'Dieline Studio'}
          />
        )}

        {isEditorOpen && (
          <EditorModal 
            isOpen={isEditorOpen} 
            onClose={() => setIsEditorOpen(false)} 
            contextType={cardMode === '2d' ? 'dieline' : 'mockup'} 
            isAiMode={true} 
          />
        )}
      </React.Suspense>
    </div>
  );
}
