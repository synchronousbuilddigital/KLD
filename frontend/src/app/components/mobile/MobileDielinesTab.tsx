// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Save, 
  Check, 
  Printer, 
  Maximize2, 
  Sliders, 
  RotateCcw, 
  Box, 
  Layers, 
  Info, 
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import DielineSVG from '../../../components/DielineSVG';
import Box3DViewer from '../../../components/Box3DViewer';
import { useBoxStore } from '../../../lib/useBoxStore';
import EditorModal from '../../pages/EditorModal';
import { exportSVG, exportDXF, exportPDF, generateDXFString } from '../../../lib/exportUtils';
import { getBoxDieline } from '../../../lib/boxDielineDispatcher';
import { exportService } from '../../../services/exportService';
import { setLargeData } from '../../../lib/idbStorage';

interface MobileDielinesTabProps {
  onOpenInStudio: (modelKey: string) => void;
  onNavigateTab?: (tab: 'home' | 'models' | 'studio' | 'dielines' | 'profile') => void;
}

export const MobileDielinesTab: React.FC<MobileDielinesTabProps> = ({ 
  onOpenInStudio,
  onNavigateTab
}) => {
  const store = useBoxStore();

  // Box Models List matching desktop DielinesPage & BoxStudioModal
  const boxModels = [
    { key: 'rte', name: 'Reverse Tuck End', shortName: 'RTE Box', type: 'Folding Carton', defaultDim: { L: 4.72, W: 2.36, H: 6.30 } },
    { key: 'te', name: 'Straight Tuck End', shortName: 'STE Box', type: 'Folding Carton', defaultDim: { L: 4.33, W: 2.16, H: 6.30 } },
    { key: 'rsc', name: 'Square Shipping Box', shortName: 'RSC Shipper', type: 'Corrugated Box', defaultDim: { L: 7.87, W: 7.87, H: 7.87 } },
    { key: 'auto_lock', name: 'Auto Lock Bottom', shortName: 'Crash-Lock', type: 'Heavy Duty Box', defaultDim: { L: 3.94, W: 3.94, H: 8.66 } },
    { key: 'cosmetic', name: 'Cosmetic Box', shortName: 'Cosmetic', type: 'Beauty Box', defaultDim: { L: 3.15, W: 3.15, H: 5.12 } },
    { key: 'cosmetic_b', name: 'Mailer / Tray Box', shortName: 'Mailer Tray', type: 'E-commerce Box', defaultDim: { L: 8.27, W: 5.91, H: 2.36 } },
    { key: 'button_hole', name: 'Button Hole Box', shortName: 'Button Hole', type: 'Snap-Lock Box', defaultDim: { L: 4.00, W: 2.50, H: 6.00 } },
    { key: 'pizza_box', name: 'Pizza Box (FEFCO 0426)', shortName: 'Pizza Box', type: 'Roll End Tray', defaultDim: { L: 8.15, W: 8.07, H: 2.05 } },
    { key: 'fefco_0300', name: 'FEFCO 0300 Shoe Box with Lid', shortName: 'Shoe Box', type: 'Telescope Box', defaultDim: { L: 11.89, W: 8.03, H: 2.40 } },
  ];

  const [activeModelKey, setActiveModelKey] = useState<string>(() => {
    return ['rte', 'te', 'rsc', 'auto_lock', 'cosmetic', 'cosmetic_b', 'button_hole', 'fefco_0300', 'shoe_box_with_lid', 'pizza_box', 'fefco_0426', 'pizza'].includes(store.boxModel)
      ? store.boxModel
      : 'rte';
  });

  const currentModel = boxModels.find(m => m.key === activeModelKey) || boxModels[0];

  // Unit State
  const [unit, setUnit] = useState<'in' | 'mm'>('in');

  // String Inputs for smooth typing
  const [inputL, setInputL] = useState<string>(store.L ? store.L.toString() : '4.7244');
  const [inputW, setInputW] = useState<string>(store.W ? store.W.toString() : '2.3622');
  const [inputH, setInputH] = useState<string>(store.H ? store.H.toString() : '6.2992');

  // 3D Fold Simulation State
  const [foldProgress, setFoldProgress] = useState<number>(1);
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // View States
  const [activeViewMode, setActiveViewMode] = useState<'dieline' | '3d' | 'dual'>('dieline');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Sync active model with store
  useEffect(() => {
    if (activeModelKey && store.boxModel !== activeModelKey) {
      store.setBoxModel(activeModelKey);
    }
  }, [activeModelKey]);

  // Sync inputs with unit or store dimensions change
  useEffect(() => {
    const valL = unit === 'in' ? store.L : store.L * 25.4;
    const valW = unit === 'in' ? store.W : store.W * 25.4;
    const valH = unit === 'in' ? store.H : store.H * 25.4;
    setInputL(unit === 'in' ? valL.toFixed(4) : valL.toFixed(2));
    setInputW(unit === 'in' ? valW.toFixed(4) : valW.toFixed(2));
    setInputH(unit === 'in' ? valH.toFixed(4) : valH.toFixed(2));
  }, [store.L, store.W, store.H, unit]);

  // Fold Play Animation Loop
  useEffect(() => {
    if (isPlayingAnim) {
      let direction = foldProgress >= 1 ? -1 : 1;
      let startProgress = foldProgress;
      let startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        let newProgress = startProgress + direction * (elapsed / 2.2);

        if (direction === -1 && newProgress <= 0) {
          newProgress = 0;
          direction = 1;
          startProgress = 0;
          startTime = now;
        } else if (direction === 1 && newProgress >= 1) {
          newProgress = 1;
          direction = -1;
          startProgress = 1;
          startTime = now;
        }

        setFoldProgress(newProgress);
        animFrameRef.current = requestAnimationFrame(animate);
      };

      animFrameRef.current = requestAnimationFrame(animate);
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [isPlayingAnim, foldProgress]);

  // Dimension Handlers
  const handleLChange = (valStr: string) => {
    setInputL(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const inVal = unit === 'in' ? num : num / 25.4;
      store.setDim('L', inVal);
    }
  };

  const handleWChange = (valStr: string) => {
    setInputW(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const inVal = unit === 'in' ? num : num / 25.4;
      store.setDim('W', inVal);
    }
  };

  const handleHChange = (valStr: string) => {
    setInputH(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const inVal = unit === 'in' ? num : num / 25.4;
      store.setDim('H', inVal);
    }
  };

  // Dimensions formatted readouts (matching BoxStudioModal.tsx)
  const displayL = unit === 'in' ? store.L.toFixed(4) : (store.L * 25.4).toFixed(2);
  const displayW = unit === 'in' ? store.W.toFixed(4) : (store.W * 25.4).toFixed(2);
  const displayH = unit === 'in' ? store.H.toFixed(4) : (store.H * 25.4).toFixed(2);

  const innerL = unit === 'in' ? (store.L - 2 * store.T).toFixed(4) : ((store.L - 2 * store.T) * 25.4).toFixed(2);
  const innerW = unit === 'in' ? (store.W - 2 * store.T).toFixed(4) : ((store.W - 2 * store.T) * 25.4).toFixed(2);
  const innerH = unit === 'in' ? (store.H - 2 * store.T).toFixed(4) : ((store.H - 2 * store.T) * 25.4).toFixed(2);

  const outerL = unit === 'in' ? (store.L + 2 * store.T).toFixed(4) : ((store.L + 2 * store.T) * 25.4).toFixed(2);
  const outerW = unit === 'in' ? (store.W + 2 * store.T).toFixed(4) : ((store.W + 2 * store.T) * 25.4).toFixed(2);
  const outerH = unit === 'in' ? (store.H + 2 * store.T).toFixed(4) : ((store.H + 2 * store.T) * 25.4).toFixed(2);

  // DXF Export Handler (AutoCAD R12)
  const handleExportDXF = async () => {
    try {
      const params = {
        L: store.L,
        W: store.W,
        H: store.H,
        T: store.T,
        glueFlapWidth: store.glueFlapWidth,
        bleed: store.bleed,
        windowDecals: store.windowDecals || []
      };
      const dielineData = getBoxDieline(activeModelKey, params);
      const fileName = `${activeModelKey}_dieline.dxf`;
      exportDXF(dielineData, fileName);
      try {
        await exportService.logExport({ format: 'DXF', resolution: 'CAD Vector', fileName });
      } catch (e) {}
      setShowExportModal(false);
    } catch (err) {
      console.error('DXF Export Error:', err);
    }
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    try {
      const svgElement = document.querySelector('#mobile-dieline-canvas svg') as SVGSVGElement | null;
      const fileName = `${activeModelKey}_dieline.pdf`;
      if (svgElement) {
        await exportPDF(svgElement, fileName, 'CMYK');
        try {
          await exportService.logExport({ format: 'PDF', resolution: 'Vector CMYK', fileName });
        } catch (e) {}
      } else {
        handleExportDXF();
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('PDF Export Error:', err);
      handleExportDXF();
    }
  };

  // Ai / SVG Export Handler
  const handleExportSVG = async (format: 'ai' | 'svg') => {
    try {
      const svgElement = document.querySelector('#mobile-dieline-canvas svg') as SVGSVGElement | null;
      const fileName = `${activeModelKey}_dieline.${format}`;
      if (svgElement) {
        exportSVG(svgElement, fileName);
        try {
          await exportService.logExport({ format: 'SVG', resolution: format === 'ai' ? 'Adobe Vector' : 'Scalable Vector', fileName });
        } catch (e) {}
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('Vector Export Error:', err);
    }
  };

  // Print Imposition Tool
  const handlePrint = async () => {
    try {
      const params = {
        L: store.L,
        W: store.W,
        H: store.H,
        T: store.T,
        glueFlapWidth: store.glueFlapWidth,
        bleed: store.bleed,
        windowDecals: store.windowDecals || []
      };
      const dielineData = getBoxDieline(activeModelKey, params);
      const dxfString = generateDXFString(dielineData);

      const paramsPayload = {
        L_mm: Math.round((store.L || 4.7244) * 25.4),
        W_mm: Math.round((store.W || 2.3622) * 25.4),
        H_mm: Math.round((store.H || 6.2992) * 25.4),
        boxModel: activeModelKey,
        flatWidth_mm: Math.round((dielineData.width || 0) * 25.4 * 10) / 10,
        flatHeight_mm: Math.round((dielineData.height || 0) * 25.4 * 10) / 10
      };

      try {
        sessionStorage.setItem('autoLoadDXF', dxfString);
        sessionStorage.setItem('autoLoadParams', JSON.stringify(paramsPayload));
        localStorage.setItem('autoLoadDXF', dxfString);
        localStorage.setItem('autoLoadParams', JSON.stringify(paramsPayload));
        await setLargeData('autoLoadDXF', dxfString);
      } catch (e) {}

      sessionStorage.setItem('dieline_tool_referrer', window.location.href);
      window.location.href = '/dieline-tool.html';
    } catch (err) {
      console.error('Print Error:', err);
    }
  };

  // Save Project Handler
  const handleSaveProject = async () => {
    setIsSaving(true);
    const dimL_mm = Math.round(store.L * 25.4);
    const dimW_mm = Math.round(store.W * 25.4);
    const dimH_mm = Math.round(store.H * 25.4);

    const savedItem = {
      id: 'saved-' + Date.now(),
      _id: 'saved-' + Date.now(),
      name: `${currentModel.name} (${dimL_mm}×${dimW_mm}×${dimH_mm}mm)`,
      type: 'DIELINE',
      category: currentModel.name,
      boxModel: activeModelKey,
      tabCategory: 'projects',
      variantId: 1,
      dimensions: { L: dimL_mm, W: dimW_mm, H: dimH_mm },
      updatedAt: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem('kld_workspace_items');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('kld_workspace_items', JSON.stringify([savedItem, ...(Array.isArray(existing) ? existing : [])]));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('project-saved', { detail: savedItem }));
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex flex-col space-y-3 pb-24 px-3 pt-2 select-none font-sans text-zinc-900">
      
      {/* 3D Models vs CAD Dielines Switcher */}
      {onNavigateTab && (
        <div className="flex bg-zinc-200/80 p-0.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => onNavigateTab('models')}
            className="flex-1 py-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Box className="w-3.5 h-3.5 text-zinc-700" />
            <span>3D Models</span>
          </button>
          <button
            className="flex-1 py-1.5 rounded-lg bg-white text-zinc-900 shadow-xs flex items-center justify-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>CAD Dielines</span>
          </button>
        </div>
      )}

      {/* 1. MODEL SELECTOR CAROUSEL */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3">
        {boxModels.map((m) => {
          const isActive = activeModelKey === m.key;
          return (
            <button
              key={m.key}
              onClick={() => {
                setActiveModelKey(m.key);
                setFoldProgress(1);
                setIsPlayingAnim(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200/90 hover:bg-zinc-100 active:scale-95'
              }`}
            >
              <Box className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span>{m.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* 2. TOP ACTION BUTTONS (Parity with Desktop BoxStudioModal) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-2.5 flex items-center justify-between gap-2 shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            {currentModel.type}
          </span>
          <h2 className="text-xs font-bold text-zinc-900 leading-tight">{currentModel.name}</h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Design Online (EditorModal) */}
          <button
            onClick={() => setIsEditorOpen(true)}
            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Design</span>
          </button>

          {/* Download Dieline Modal Trigger */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Save Project */}
          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            className={`p-1.5 rounded-xl text-white transition-all cursor-pointer active:scale-95 shadow-xs ${
              isSaved ? 'bg-emerald-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
            title="Save Project"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. VIEW MODE TOGGLE (2D Dieline CAD vs 3D Fold Preview vs Dual) */}
      <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200 text-xs font-semibold">
        <button
          onClick={() => setActiveViewMode('dieline')}
          className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeViewMode === 'dieline' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-zinc-600'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2D CAD Dieline</span>
        </button>
        <button
          onClick={() => setActiveViewMode('3d')}
          className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeViewMode === '3d' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-zinc-600'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Fold Preview</span>
        </button>
        <button
          onClick={() => setActiveViewMode('dual')}
          className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeViewMode === 'dual' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-zinc-600'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Dual Sync</span>
        </button>
      </div>

      {/* 4. MAIN CANVAS STAGE (2D CAD DielineSVG and/or 3D Box3DViewer) */}
      <div className="bg-zinc-100/90 rounded-3xl border border-zinc-200/90 overflow-hidden relative shadow-inner">
        
        {/* CAD Legend Bar */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 text-[10px] font-semibold text-zinc-700 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-xs border border-white/60 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-blue-600 inline-block" />
              <span>Trim</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0 border-b-2 border-dashed border-red-500 inline-block" />
              <span>Crease</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-green-600 inline-block" />
              <span>Bleed</span>
            </div>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('reset-dieline-view'))}
            className="p-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/60 text-zinc-700 shadow-xs hover:bg-white pointer-events-auto cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2D CAD Dieline Viewport */}
        {(activeViewMode === 'dieline' || activeViewMode === 'dual') && (
          <div 
            id="mobile-dieline-canvas" 
            className={`w-full flex items-center justify-center overflow-hidden bg-[#e2e8f0] ${
              activeViewMode === 'dual' ? 'h-56' : 'h-80'
            }`}
          >
            <DielineSVG
              L={store.L}
              W={store.W}
              H={store.H}
              T={store.T}
              unit={unit}
              materialType={store.materialCategory}
              isEditorMode={true}
              activeColor={store.packageColor}
              activeSurface="Outside"
            />
          </div>
        )}

        {/* 3D Fold Preview Viewport */}
        {(activeViewMode === '3d' || activeViewMode === 'dual') && (
          <div className={`w-full bg-zinc-900 relative ${activeViewMode === 'dual' ? 'h-52 border-t border-zinc-200' : 'h-80'}`}>
            <Box3DViewer
              key={`${activeModelKey}-${store.packageColor}-${store.materialType}`}
              boxModelOverride={activeModelKey}
              overrideLayout="single"
              L={store.L}
              W={store.W}
              H={store.H}
              T={store.T}
              progress={foldProgress}
              lightingPreset="studio"
              activeAnimation="none"
            />

            {/* Fold Scrubber Overlay */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2 z-10">
              <button
                onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer active:scale-95"
              >
                {isPlayingAnim ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <span className="text-[10px] text-zinc-400 font-bold">Open</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={foldProgress}
                onChange={(e) => {
                  setFoldProgress(parseFloat(e.target.value));
                  setIsPlayingAnim(false);
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <span className="text-[10px] text-zinc-400 font-bold">Folded</span>
            </div>
          </div>
        )}

      </div>

      {/* 5. DYNAMIC READOUTS CARD (Manufacture, Inner, Outer Dimensions) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-3 shadow-xs space-y-1.5 text-xs font-mono">
        <div className="flex justify-between items-center text-zinc-800">
          <span className="text-blue-600 font-bold font-sans">Manufacture dims:</span>
          <span className="font-bold">{displayL} × {displayW} × {displayH} {unit}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-500 text-[11px]">
          <span className="font-sans">Inner dimensions:</span>
          <span>{innerL} × {innerW} × {innerH} {unit}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-500 text-[11px]">
          <span className="font-sans">Outer dimensions:</span>
          <span>{outerL} × {outerW} × {outerH} {unit}</span>
        </div>
      </div>

      {/* 6. PARAMETRIC SIZE CONTROLS (Length, Width, Height, Unit) */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-900">Custom Dimensions</h3>
          
          {/* Unit Toggle */}
          <div className="flex bg-zinc-100 p-0.5 rounded-full border border-zinc-200 text-xs font-semibold">
            <button
              onClick={() => { setUnit('mm'); store.setUnit?.('mm'); }}
              className={`px-3 py-0.5 rounded-full transition-colors ${unit === 'mm' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-zinc-500'}`}
            >
              mm
            </button>
            <button
              onClick={() => { setUnit('in'); store.setUnit?.('in'); }}
              className={`px-3 py-0.5 rounded-full transition-colors ${unit === 'in' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-zinc-500'}`}
            >
              in
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="text-[11px] text-zinc-500 block mb-1 font-semibold">Length (L)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={inputL}
                onChange={(e) => handleLChange(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 font-mono">{unit}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-500 block mb-1 font-semibold">Width (W)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={inputW}
                onChange={(e) => handleWChange(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 font-mono">{unit}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-500 block mb-1 font-semibold">Height (H)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={inputH}
                onChange={(e) => handleHChange(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 font-mono">{unit}</span>
            </div>
          </div>
        </div>

        {/* Size Mode Switcher */}
        <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-semibold">Size Mode:</span>
          <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200/80">
            {[
              { id: 'manufacture', label: 'Manufacture' },
              { id: 'inner', label: 'Inner' },
              { id: 'outer', label: 'Outer' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => store.setSizeMode?.(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  store.sizeMode === m.id ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-zinc-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. QUICK ACTION BUTTONS (Edit Package Artwork & Open in 3D Studio) */}
      <div className="space-y-2">
        <button
          onClick={() => setIsEditorOpen(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-transform active:scale-98 shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Edit Package Artwork Online</span>
        </button>

        <button
          onClick={() => {
            store.setBoxModel(activeModelKey);
            onOpenInStudio(activeModelKey);
          }}
          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition-transform active:scale-98 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Box className="w-4 h-4 text-blue-400" />
          <span>Open in 3D Mockup Studio</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* 8. EXPORT FORMATS MODAL (Desktop Parity: DXF, PDF, Ai, SVG) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end p-3">
          <div className="bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Download CAD Dieline</h3>
                <p className="text-xs text-zinc-500">Production ready vector files with trim & crease lines</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* DXF AutoCAD */}
              <button
                onClick={handleExportDXF}
                className="p-3 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50 hover:bg-zinc-100 transition-all text-left flex items-center gap-3 cursor-pointer"
              >
                <span className="w-9 h-9 rounded-xl bg-zinc-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                  DXF
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight">AutoCAD DXF</h4>
                  <p className="text-[10px] text-zinc-500">CNC & Laser Cutter</p>
                </div>
              </button>

              {/* PDF Vector */}
              <button
                onClick={handleExportPDF}
                className="p-3 rounded-2xl border border-red-200 hover:border-red-500 bg-red-50/50 hover:bg-red-50 transition-all text-left flex items-center gap-3 cursor-pointer"
              >
                <span className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  PDF
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight">Vector PDF</h4>
                  <p className="text-[10px] text-zinc-500">Print CMYK Ready</p>
                </div>
              </button>

              {/* Adobe Illustrator */}
              <button
                onClick={() => handleExportSVG('ai')}
                className="p-3 rounded-2xl border border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 transition-all text-left flex items-center gap-3 cursor-pointer"
              >
                <span className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                  Ai
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight">Adobe Illustrator</h4>
                  <p className="text-[10px] text-zinc-500">Vector Layers</p>
                </div>
              </button>

              {/* SVG Vector */}
              <button
                onClick={() => handleExportSVG('svg')}
                className="p-3 rounded-2xl border border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 transition-all text-left flex items-center gap-3 cursor-pointer"
              >
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  SVG
                </span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight">Scalable Vector</h4>
                  <p className="text-[10px] text-zinc-500">Web & Plotters</p>
                </div>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 rounded-2xl border border-zinc-300 hover:border-zinc-900 text-zinc-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-zinc-600" />
              <span>Open in Print Layout & Imposition Tool</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. FULL 2D LABEL & DIELINE EDITOR MODAL (Identical to Desktop) */}
      {isEditorOpen && (
        <EditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          contextType="dieline"
        />
      )}

    </div>
  );
};

export default MobileDielinesTab;
