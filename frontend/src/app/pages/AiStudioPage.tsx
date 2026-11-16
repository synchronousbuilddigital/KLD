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
  Check,
  ArrowRight
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

const SAMPLE_DIELINES = [
  { 
    name: 'FEFCO 0426 Pizza Box', 
    key: 'pizza_box', 
    dims: { L: 12.0, W: 12.0, H: 2.0, unit: 'in' }, 
    features: ['Roll-End Tuck Front', 'Self-Locking Side Flaps', 'Integrated Hinged Lid'],
    explanation: 'Corrugated pizza takeout net with rollover locking tabs and hinged lid.'
  },
  { 
    name: 'FEFCO 0300 Shoe Box', 
    key: 'fefco_0300', 
    dims: { L: 11.89, W: 8.03, H: 2.40, unit: 'in' }, 
    features: ['Two-Piece Telescope', 'Rigid Separate Lid', 'Base Tray Rollover Walls'],
    explanation: 'Standard footwear two-piece telescope packaging with fitted lid.'
  },
  { 
    name: 'Reverse Tuck End Box', 
    key: 'rte', 
    dims: { L: 4.72, W: 2.36, H: 6.29, unit: 'in' }, 
    features: ['Opposite Tuck Direction', 'Side Glue Seam', 'Top & Bottom Dust Flaps'],
    explanation: 'Classic retail folding carton with opposite-facing closure tuck flaps.'
  },
  { 
    name: 'Auto Lock Bottom Box', 
    key: 'auto_lock', 
    dims: { L: 5.0, W: 3.5, H: 7.0, unit: 'in' }, 
    features: ['Crash Lock Base', '45° Pre-Glued Diagonals', 'Rapid Assembly'],
    explanation: 'Heavy-duty automatic pop-open base for fast manual or machine packaging.'
  },
  {
    name: 'Straight Tuck End Box',
    key: 'te',
    dims: { L: 4.72, W: 2.36, H: 6.29, unit: 'in' },
    features: ['Same Tuck Direction', 'Clean Display Face', 'Quick Fill Line'],
    explanation: 'Pharmaceutical & luxury cosmetic carton where both flaps fold towards the rear.'
  },
  {
    name: 'Square Shipping Box (RSC)',
    key: 'rsc',
    dims: { L: 10.0, W: 10.0, H: 10.0, unit: 'in' },
    features: ['Standard Shipping Carton', 'Equal Length Flaps', 'High Stacking Strength'],
    explanation: 'FEFCO 0201 regular slotted container for freight, shipping & e-commerce.'
  }
];

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

  // Segregated sub-tab: 'design' (AI Design Studio) | 'detector' (CAD Dieline Generator)
  const [subTab, setSubTab] = useState<'design' | 'detector'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') || urlParams.get('mode');
      if (tabParam === 'detector' || tabParam === 'dieline' || tabParam === 'cad') return 'detector';
      const saved = localStorage.getItem('kld_ai_subtab');
      if (saved === 'detector' || saved === 'design') return saved;
    }
    return 'design';
  });

  const handleSubTabChange = (newTab: 'design' | 'detector') => {
    setSubTab(newTab);
    try {
      localStorage.setItem('kld_ai_subtab', newTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  // AI Dieline Detector state
  const dielineFileInputRef = useRef<HTMLInputElement>(null);
  const [isDielineDetecting, setIsDielineDetecting] = useState(false);
  const [dielineDetectionResult, setDielineDetectionResult] = useState<any>(null);
  const [detectorScanningStep, setDetectorScanningStep] = useState<string>('');
  const [detectorPreviewMode, setDetectorPreviewMode] = useState<'3d' | '2d'>('3d');
  const [isDragOver, setIsDragOver] = useState(false);
  const [detectorFoldProgress, setDetectorFoldProgress] = useState(1);

  const processDielineFile = async (file: File) => {
    if (!file) return;
    setIsDielineDetecting(true);
    setDetectorScanningStep('Scanning crease lines and boundary geometry...');

    try {
      setTimeout(() => setDetectorScanningStep('Matching flap topologies against 8 packaging families...'), 600);
      setTimeout(() => setDetectorScanningStep('Extracting dimensions and locking mechanisms...'), 1200);

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
        store.setDim?.('L', result.dimensionsIn.L);
        store.setDim?.('W', result.dimensionsIn.W);
        store.setDim?.('H', result.dimensionsIn.H);
      } else if (result.dimensions) {
        const isMm = result.dimensions.unit === 'mm' || result.dimensions.L > 30;
        const scale = isMm ? 1 / 25.4 : 1;
        const lIn = Number((result.dimensions.L * scale).toFixed(2));
        const wIn = Number((result.dimensions.W * scale).toFixed(2));
        const hIn = Number((result.dimensions.H * scale).toFixed(2));
        useBoxStore.setState({ L: lIn, W: wIn, H: hIn });
        store.setDim?.('L', lIn);
        store.setDim?.('W', wIn);
        store.setDim?.('H', hIn);
      }

      setCardMode('3d');
    } catch (err: any) {
      console.error('Dieline detection error:', err);
      alert('Unable to analyze dieline file. Please ensure it is a valid DXF, SVG, PDF, or image.');
    } finally {
      setIsDielineDetecting(false);
      setDetectorScanningStep('');
      if (dielineFileInputRef.current) dielineFileInputRef.current.value = '';
    }
  };

  const handleDielineFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processDielineFile(file);
  };

  const handleApplySampleDieline = (sample: typeof SAMPLE_DIELINES[0]) => {
    setIsDielineDetecting(true);
    setDetectorScanningStep(`Simulating CAD vector scan for ${sample.name}...`);
    setTimeout(() => {
      setDetectorScanningStep('Extracting precision crease coordinates...');
      setTimeout(() => {
        const mockResult: any = {
          matchedModelKey: sample.key,
          matchedTitle: sample.name,
          confidence: 98.7,
          dimensionsIn: sample.dims,
          dimensions: {
            L: Number((sample.dims.L * 25.4).toFixed(1)),
            W: Number((sample.dims.W * 25.4).toFixed(1)),
            H: Number((sample.dims.H * 25.4).toFixed(1)),
            unit: 'mm'
          },
          detectedFeatures: sample.features,
          explanation: sample.explanation
        };
        setDielineDetectionResult(mockResult);
        setActiveBoxModel(sample.key);
        if (typeof store.setBoxModel === 'function') {
          store.setBoxModel(sample.key);
        } else {
          useBoxStore.setState({ boxModel: sample.key });
        }
        useBoxStore.setState({
          L: sample.dims.L,
          W: sample.dims.W,
          H: sample.dims.H
        });
        store.setDim?.('L', sample.dims.L);
        store.setDim?.('W', sample.dims.W);
        store.setDim?.('H', sample.dims.H);
        setIsDielineDetecting(false);
        setDetectorScanningStep('');
      }, 600);
    }, 600);
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

          {/* Segmented Sub-Tab Switcher: AI Design Studio VS CAD Dieline Generator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px',
            background: store.theme === 'dark' ? '#18181b' : '#ffffff',
            borderRadius: '16px',
            border: store.theme === 'dark' ? '1px solid #27272a' : '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            marginBottom: '16px',
            zIndex: 10
          }}>
            <button
              onClick={() => handleSubTabChange('design')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '12px',
                border: 'none',
                background: subTab === 'design' 
                  ? (store.theme === 'dark' ? '#27272a' : '#0f172a') 
                  : 'transparent',
                color: subTab === 'design' 
                  ? '#ffffff' 
                  : (store.theme === 'dark' ? '#a1a1aa' : '#64748b'),
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles style={{ width: '15px', height: '15px', color: subTab === 'design' ? '#c084fc' : '#a1a1aa' }} />
              <span>AI Design Studio</span>
            </button>

            <button
              onClick={() => handleSubTabChange('detector')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '12px',
                border: 'none',
                background: subTab === 'detector' 
                  ? (store.theme === 'dark' ? '#27272a' : '#0f172a') 
                  : 'transparent',
                color: subTab === 'detector' 
                  ? '#ffffff' 
                  : (store.theme === 'dark' ? '#a1a1aa' : '#64748b'),
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ScanLine style={{ width: '15px', height: '15px', color: subTab === 'detector' ? '#38bdf8' : '#a1a1aa' }} />
              <span>CAD Dieline Generator</span>
              <span style={{
                padding: '1px 6px',
                background: subTab === 'detector' ? '#38bdf8' : (store.theme === 'dark' ? '#3f3f46' : '#e2e8f0'),
                color: subTab === 'detector' ? '#0f172a' : (store.theme === 'dark' ? '#f4f4f5' : '#475569'),
                fontSize: '9px',
                fontWeight: '900',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                CAD
              </span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* VIEW A: CAD DIELINE GENERATOR & NET INSPECTOR (DEDICATED) */}
          {/* ======================================================== */}
          {subTab === 'detector' && (
            <div style={{
              width: '660px',
              maxWidth: '96%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'fadeIn 0.25s ease'
            }}>
              {/* Hidden File Input for Dieline Detector */}
              <input
                type="file"
                ref={dielineFileInputRef}
                onChange={handleDielineFileUpload}
                accept=".dxf,.svg,.pdf,.png,.jpg,.jpeg,.webp"
                style={{ display: 'none' }}
              />

              {/* Dieline Detector Hero Banner - High-End Minimalist Architectural Card */}
              <div style={{
                padding: '24px',
                borderRadius: '24px',
                background: store.theme === 'dark' ? '#121316' : '#18181b',
                color: '#ffffff',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8'
                    }}>
                      <ScanLine style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
                        Vector Dieline & CAD Scanner
                      </h3>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0', fontWeight: '500' }}>
                        Automated fold topology & parametric dimension extraction
                      </p>
                    </div>
                  </div>

                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase'
                  }}>
                    CAD Engine
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Upload an AutoCAD <strong style={{ color: '#ffffff' }}>.DXF</strong>, vector artwork <strong style={{ color: '#ffffff' }}>.SVG</strong>, technical sheet <strong style={{ color: '#ffffff' }}>.PDF</strong>, or high-res scan. The CAD engine maps fold axes, determines kinematics, and simulates 3D assembly.
                </p>

                {/* Interactive Upload Dropzone */}
                <div
                  onClick={() => !isDielineDetecting && dielineFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer?.files?.[0];
                    if (file) processDielineFile(file);
                  }}
                  style={{
                    border: isDragOver ? '2px dashed #38bdf8' : '2px dashed rgba(255, 255, 255, 0.2)',
                    background: isDragOver ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '18px',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    cursor: isDielineDetecting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: '10px'
                  }}>
                    <Upload style={{ width: '22px', height: '22px' }} />
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                    Select or Drag & Drop Dieline or CAD Net File
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                    Supports DXF, SVG, PDF, PNG & High-Res JPG
                  </span>

                  {/* Supported Format Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                    {['DXF CAD', 'SVG Vector', 'PDF Sheet', 'Physical Scan'].map(b => (
                      <span key={b} style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#cbd5e1'
                      }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Test Samples */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Or inspect standard packaging templates:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {SAMPLE_DIELINES.map(sample => (
                      <button
                        key={sample.key}
                        onClick={() => handleApplySampleDieline(sample)}
                        disabled={isDielineDetecting}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: isDielineDetecting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sample.name}</span>
                        <ArrowRight style={{ width: '13px', height: '13px', opacity: 0.6, flexShrink: 0, marginLeft: '4px' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scanning Progress Banner */}
              {isDielineDetecting && (
                <div style={{
                  background: store.theme === 'dark' ? '#18181b' : '#ffffff',
                  borderRadius: '18px',
                  padding: '16px 20px',
                  border: store.theme === 'dark' ? '1px solid #27272a' : '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: store.theme === 'dark' ? '#27272a' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ScanLine style={{ width: '22px', height: '22px', color: '#2563eb' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: store.theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                        Parametric CAD Analysis
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>
                        Processing...
                      </span>
                    </div>
                    <div style={{ width: '100%', background: store.theme === 'dark' ? '#27272a' : '#e2e8f0', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #2563eb, #38bdf8)', borderRadius: '999px' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '6px 0 0', fontWeight: '500' }}>
                      {detectorScanningStep || 'Analyzing geometry & crease lines...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Detection Result Card */}
              {dielineDetectionResult && !isDielineDetecting && (
                <div style={{
                  background: store.theme === 'dark' ? '#18181b' : '#ffffff',
                  borderRadius: '24px',
                  padding: '20px',
                  border: store.theme === 'dark' ? '1px solid #27272a' : '1px solid #e2e8f0',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: store.theme === 'dark' ? '1px solid #27272a' : '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: '#dcfce7',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          CAD Specification Match
                        </span>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: store.theme === 'dark' ? '#f8fafc' : '#0f172a', margin: 0 }}>
                          {dielineDetectionResult.matchedTitle || BOX_TITLES[dielineDetectionResult.matchedModelKey] || 'Custom Packaging Model'}
                        </h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: store.theme === 'dark' ? '#27272a' : '#f1f5f9',
                        border: store.theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e2e8f0',
                        fontSize: '11px',
                        fontWeight: '900',
                        color: store.theme === 'dark' ? '#f8fafc' : '#0f172a'
                      }}>
                        {Math.round(dielineDetectionResult.confidence > 1 ? dielineDetectionResult.confidence : dielineDetectionResult.confidence * 100)}% MATCH
                      </span>
                      <button
                        onClick={() => setDielineDetectionResult(null)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                        title="Dismiss"
                      >
                        <X style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Dimensions Breakdown Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: store.theme === 'dark' ? '#121316' : '#f8fafc',
                    border: store.theme === 'dark' ? '1px solid #27272a' : '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Length (L)</span>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: store.theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                        {(dielineDetectionResult.dimensionsIn?.L || store.L || 4.72).toFixed(2)}″
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {Math.round((dielineDetectionResult.dimensionsIn?.L || store.L || 4.72) * 25.4)} mm
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Width (W)</span>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: store.theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                        {(dielineDetectionResult.dimensionsIn?.W || store.W || 2.36).toFixed(2)}″
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {Math.round((dielineDetectionResult.dimensionsIn?.W || store.W || 2.36) * 25.4)} mm
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Height (H)</span>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: store.theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                        {(dielineDetectionResult.dimensionsIn?.H || store.H || 6.29).toFixed(2)}″
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {Math.round((dielineDetectionResult.dimensionsIn?.H || store.H || 6.29) * 25.4)} mm
                      </span>
                    </div>
                  </div>

                  {/* Detected Structural Features */}
                  {dielineDetectionResult.detectedFeatures && dielineDetectionResult.detectedFeatures.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Extracted Structural Features:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {dielineDetectionResult.detectedFeatures.map((feat: string, idx: number) => (
                          <span key={idx} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: store.theme === 'dark' ? '#27272a' : '#f1f5f9',
                            border: store.theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e2e8f0',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: store.theme === 'dark' ? '#e4e4e7' : '#334155'
                          }}>
                            <Check style={{ width: '12px', height: '12px', color: '#16a34a' }} />
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Explanation Note */}
                  {dielineDetectionResult.explanation && (
                    <p style={{
                      fontSize: '12px',
                      color: store.theme === 'dark' ? '#a1a1aa' : '#475569',
                      background: store.theme === 'dark' ? '#141518' : '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: store.theme === 'dark' ? '1px solid #27272a' : '1px solid #e2e8f0',
                      lineHeight: '1.6',
                      margin: 0
                    }}>
                      {dielineDetectionResult.explanation}
                    </p>
                  )}

                  {/* Live 3D / 2D Kinematic Fold Inspection */}
                  <div style={{
                    borderRadius: '18px',
                    background: '#09090b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Kinematic Net Inspection
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: '800',
                          color: '#4ade80'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                          Verified
                        </span>
                      </div>

                      {/* Mode switcher: 3D vs 2D */}
                      <div style={{ display: 'flex', background: '#18181b', borderRadius: '8px', padding: '2px', gap: '2px' }}>
                        <button
                          onClick={() => setDetectorPreviewMode('3d')}
                          style={{
                            background: detectorPreviewMode === '3d' ? '#ffffff' : 'transparent',
                            color: detectorPreviewMode === '3d' ? '#000000' : '#a1a1aa',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          3D Fold
                        </button>
                        <button
                          onClick={() => setDetectorPreviewMode('2d')}
                          style={{
                            background: detectorPreviewMode === '2d' ? '#ffffff' : 'transparent',
                            color: detectorPreviewMode === '2d' ? '#000000' : '#a1a1aa',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          2D CAD Net
                        </button>
                      </div>
                    </div>

                    {/* Viewport Canvas */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '240px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: 'radial-gradient(ellipse at center, #18181b 0%, #09090b 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {detectorPreviewMode === '3d' ? (
                        <Box3DViewer
                          key={`detector-3d-${dielineDetectionResult.matchedModelKey || activeBoxModel}-${detectorFoldProgress}`}
                          boxModelOverride={dielineDetectionResult.matchedModelKey || activeBoxModel}
                          overrideLayout="single"
                          L={dielineDetectionResult.dimensionsIn?.L || store.L}
                          W={dielineDetectionResult.dimensionsIn?.W || store.W}
                          H={dielineDetectionResult.dimensionsIn?.H || store.H}
                          progress={detectorFoldProgress}
                          lightingPreset="studio"
                          activeAnimation="none"
                          showWatermark={false}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                          <DielineSVG width={580} height={220} />
                        </div>
                      )}
                    </div>

                    {/* Fold Slider if in 3D */}
                    {detectorPreviewMode === '3d' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>
                          Fold Net
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={detectorFoldProgress}
                          onChange={(e) => setDetectorFoldProgress(Number(e.target.value))}
                          style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', minWidth: '36px', textAlign: 'right' }}>
                          {Math.round(detectorFoldProgress * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '4px' }}>
                    <button
                      onClick={() => onNavigateToWorkshop ? onNavigateToWorkshop() : setIsEditorOpen(true)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '800',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; }}
                    >
                      <Box style={{ width: '15px', height: '15px', color: '#38bdf8' }} />
                      <span>Open in 3D Workshop</span>
                      <ExternalLink style={{ width: '13px', height: '13px', opacity: 0.6 }} />
                    </button>

                    <button
                      onClick={() => setIsDielineStudioOpen(true)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: store.theme === 'dark' ? '#27272a' : '#f1f5f9',
                        color: store.theme === 'dark' ? '#f8fafc' : '#0f172a',
                        fontSize: '12px',
                        fontWeight: '800',
                        border: store.theme === 'dark' ? '1px solid #3f3f46' : '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = store.theme === 'dark' ? '#3f3f46' : '#cbd5e1'; e.currentTarget.style.color = store.theme === 'dark' ? '#f8fafc' : '#0f172a'; }}
                    >
                      <Scissors style={{ width: '15px', height: '15px', color: '#2563eb' }} />
                      <span>Open Dieline Studio</span>
                      <ExternalLink style={{ width: '13px', height: '13px', opacity: 0.6 }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW B: AI DESIGN STUDIO (PACKAGING VISUAL GENERATOR)   */}
          {/* ======================================================== */}
          {subTab === 'design' && (
            <>
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
        </>
      )}

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
