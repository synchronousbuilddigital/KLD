import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Save, 
  Check, 
  Printer, 
  Sparkles, 
  Download, 
  Upload, 
  Maximize2, 
  Sliders, 
  Layers, 
  RotateCw, 
  Share2, 
  Palette,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  X,
  Info,
  Trash2
} from 'lucide-react';
import Box3DViewer from '../../../components/Box3DViewer';
import { useBoxStore } from '../../../lib/useBoxStore';
import EditorModal from '../../pages/EditorModal';
import AiPackagingAssistant from '../../components/AiPackagingAssistant';
import { getBoxDieline } from '../../../lib/boxDielineDispatcher';
import { generateDXFString } from '../../../lib/exportUtils';
import { setLargeData } from '../../../lib/idbStorage';
import { API_BASE_URL } from '../../../config/api';

interface MobileStudioTabProps {
  initialModelKey?: string;
  onNavigateTab?: (tab: 'home' | 'models' | 'studio' | 'dielines' | 'profile') => void;
}

export const MobileStudioTab: React.FC<MobileStudioTabProps> = ({ 
  initialModelKey = 'sipper_water_bottle',
  onNavigateTab
}) => {
  const store = useBoxStore();

  // Active Model Sync
  const currentModel = store.boxModel || initialModelKey || 'sipper_water_bottle';

  // Fold animation progress (0 = Open, 1 = Folded closed)
  const [foldProgress, setFoldProgress] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // Modals & Panels
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isFullscreen3D, setIsFullscreen3D] = useState<boolean>(false);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExportingSnapshot, setIsExportingSnapshot] = useState<boolean>(false);
  const [activeSheetTab, setActiveSheetTab] = useState<'edit' | 'dimensions' | 'material' | 'color' | 'animation'>('edit');
  const [unit, setUnit] = useState<'in' | 'mm'>('in');

  // Input states for dimensions
  const [inputL, setInputL] = useState<string>(store.L ? store.L.toString() : '4.7244');
  const [inputW, setInputW] = useState<string>(store.W ? store.W.toString() : '2.3622');
  const [inputH, setInputH] = useState<string>(store.H ? store.H.toString() : '6.2992');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Decal Placement State
  const [activeDecalUrl, setActiveDecalUrl] = useState<string | null>(null);
  const [activeDecalName, setActiveDecalName] = useState<string>('');
  const [decalPanel, setDecalPanel] = useState<string>('Front');
  const [decalScale, setDecalScale] = useState<number>(1);
  const [decalX, setDecalX] = useState<number>(0);
  const [decalY, setDecalY] = useState<number>(0);
  const [decalRotation, setDecalRotation] = useState<number>(0);

  // Curated list of all 3D parametric & CAD models matching desktop WorkshopPage
  const modelsList = [
    { key: 'sipper_water_bottle', name: '1000ml Sipper Bottle', category: 'Bottles', modelId: '516050', labelDim: '949 × 858 px' },
    { key: 'water_bottle', name: '500ml Mineral Water Bottle', category: 'Bottles', modelId: '530040', labelDim: '918 × 174 px' },
    { key: 'can', name: '12 oz Aluminum Soda Can', category: 'Cans', modelId: '550034', labelDim: '784 × 472 px' },
    { key: 'slim_can', name: '355ml Slim Beverage Can', category: 'Cans', modelId: '550035', labelDim: '661 × 548 px' },
    { key: 'tube', name: 'Toothpaste Tube', category: 'Tubes', modelId: '602620', labelDim: '170 × 503 px' },
    { key: 'rte', name: 'Reverse Tuck End Box', category: 'Boxes', modelId: '150010', labelDim: 'Parametric Dieline' },
    { key: 'te', name: 'Straight Tuck End Box', category: 'Boxes', modelId: '150020', labelDim: 'Parametric Dieline' },
    { key: 'rsc', name: 'Square Shipping Box', category: 'Boxes', modelId: '150030', labelDim: 'Parametric Dieline' },
    { key: 'auto_lock', name: 'Auto Lock Bottom Box', category: 'Boxes', modelId: '150040', labelDim: 'Parametric Dieline' },
    { key: 'cosmetic', name: 'Cosmetic Box', category: 'Boxes', modelId: '150050', labelDim: 'Parametric Dieline' },
    { key: 'cosmetic_b', name: 'Mailer / Tray Box', category: 'Boxes', modelId: '150060', labelDim: 'Parametric Dieline' },
    { key: 'button_hole', name: 'Button Hole Box', category: 'Boxes', modelId: '150070', labelDim: 'Parametric Dieline' },
    { key: 'pizza_box', name: 'Pizza Box (FEFCO 0426)', category: 'Boxes', modelId: '150090', labelDim: 'Parametric Dieline' },
    { key: 'fefco_0300', name: 'FEFCO 0300 Shoe Box with Lid', category: 'Boxes', modelId: '150080', labelDim: 'Parametric Dieline' },
  ];

  const activeModelInfo = modelsList.find(m => m.key === currentModel) || modelsList[0];
  const isBoxModel = ['rte', 'te', 'rsc', 'auto_lock', 'cosmetic', 'cosmetic_b', 'button_hole', 'fefco_0300', 'shoe_box_with_lid', 'pizza_box', 'fefco_0426', 'pizza'].includes(currentModel);
  const isCylinder = ['can', 'soda_can', 'slim_can', 'slim_355ml_can', 'sipper_water_bottle', 'water_bottle', 'tube'].includes(currentModel);
  const hasCapColor = ['sipper_water_bottle', 'water_bottle', 'tube'].includes(currentModel);

  // Sync initial model
  useEffect(() => {
    if (initialModelKey && store.boxModel !== initialModelKey) {
      store.setBoxModel(initialModelKey);
    }
  }, [initialModelKey]);

  // Sync inputs with unit change
  useEffect(() => {
    const valL = unit === 'in' ? store.L : store.L * 25.4;
    const valW = unit === 'in' ? store.W : store.W * 25.4;
    const valH = unit === 'in' ? store.H : store.H * 25.4;
    setInputL(unit === 'in' ? valL.toFixed(4) : valL.toFixed(2));
    setInputW(unit === 'in' ? valW.toFixed(4) : valW.toFixed(2));
    setInputH(unit === 'in' ? valH.toFixed(4) : valH.toFixed(2));
  }, [store.L, store.W, store.H, unit]);

  // Play / pause fold animation loop
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying, foldProgress]);

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

  // Sync active decal if store already has one for this model
  useEffect(() => {
    const existing = store.decalsByModel?.[currentModel]?.[0];
    if (existing?.url) {
      setActiveDecalUrl(existing.url);
      setActiveDecalName(existing.name || 'Uploaded Artwork');
      if (existing.panel === 'p3') setDecalPanel('Back');
      else if (existing.panel === 'p4') setDecalPanel('Left');
      else if (existing.panel === 'p2') setDecalPanel('Right');
      else if (existing.panel === 'p1_top_cover') setDecalPanel('Top');
      else if (existing.isWrap) setDecalPanel('Wrap');
      else setDecalPanel('Front');
      if (existing.scale) setDecalScale(existing.scale);
      if (existing.x !== undefined) setDecalX(existing.x);
      if (existing.y !== undefined) setDecalY(existing.y);
      if (existing.rotation) setDecalRotation(Math.round((existing.rotation * 180) / Math.PI));
    } else {
      setActiveDecalUrl(null);
      setActiveDecalName('');
    }
  }, [currentModel]);

  // Apply & Update Decal on Model
  const applyDecalToModel = (url: string, name: string, panel: string, scale: number, x: number, y: number, rotDeg: number) => {
    setActiveDecalUrl(url);
    setActiveDecalName(name);
    setDecalPanel(panel);
    setDecalScale(scale);
    setDecalX(x);
    setDecalY(y);
    setDecalRotation(rotDeg);

    const isCylinder = ['can', 'soda_can', 'slim_can', 'slim_355ml_can', 'sipper_water_bottle', 'water_bottle', 'tube'].includes(currentModel);
    
    let panelId = 'p1';
    if (panel === 'Front') panelId = 'p1';
    else if (panel === 'Back') panelId = 'p3';
    else if (panel === 'Left') panelId = 'p4';
    else if (panel === 'Right') panelId = 'p2';
    else if (panel === 'Top') panelId = 'p1_top_cover';
    else if (panel === 'Wrap') panelId = 'p1';

    const baseDim = (store.W || 2.5);
    const newDecal = {
      id: 'mobile-decal-' + Date.now(),
      type: 'image',
      url,
      name,
      panel: panelId,
      custom: true,
      x: x,
      y: y,
      scale: scale,
      width: baseDim * scale,
      height: baseDim * scale,
      rotation: (rotDeg * Math.PI) / 180,
      surface: 'Outside',
      isWrap: panel === 'Wrap' || isCylinder,
      opacity: 1
    };

    if (store.setDecals) {
      store.setDecals([newDecal]);
    }
  };

  const handleRemoveDecal = () => {
    setActiveDecalUrl(null);
    setActiveDecalName('');
    if (store.setDecals) {
      store.setDecals([]);
    }
  };

  // Direct Artwork Upload
  const handleDirectArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          applyDecalToModel(dataUrl, file.name, decalPanel || 'Front', decalScale || 1, decalX || 0, decalY || 0, decalRotation || 0);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save to Workspace & Backend (parity with WorkshopPage.tsx)
  const handleSaveToWorkspace = async () => {
    setIsSaving(true);
    const dimL_mm = Math.round((store.L || 4.72) * 25.4);
    const dimW_mm = Math.round((store.W || 2.36) * 25.4);
    const dimH_mm = Math.round((store.H || 6.29) * 25.4);

    const isExistingProject = !!store.activeProjectId;
    const targetId = store.activeProjectId || ('saved-' + Date.now());
    const targetName = store.activeProjectName || `${activeModelInfo.name} (${dimL_mm}×${dimW_mm}×${dimH_mm}mm)`;

    const savedItem = {
      id: targetId,
      _id: targetId,
      name: targetName,
      type: 'MOCKUP',
      category: activeModelInfo.name,
      boxModel: currentModel,
      variantId: currentModel === 'rte' ? 2 : 1,
      dimensions: { L: dimL_mm, W: dimW_mm, H: dimH_mm, length: store.L, width: store.W, height: store.H },
      packageColor: store.packageColor || null,
      insideColor: store.insideColor || null,
      capColor: store.capColor || '#ffffff',
      materialType: store.materialType || 'plastic_glossy',
      decals: store.decalsByModel ? store.decalsByModel[currentModel] || [] : [],
      tabCategory: 'projects',
      isDraft: false,
      updatedAt: new Date().toISOString()
    };

    // Save to LocalStorage
    try {
      const stored = localStorage.getItem('kld_workspace_items');
      const existing = stored ? JSON.parse(stored) : [];
      let updatedList = [];
      if (Array.isArray(existing)) {
        const index = existing.findIndex((i: any) => i.id === targetId || i._id === targetId);
        if (index >= 0) {
          updatedList = [...existing];
          updatedList[index] = savedItem;
        } else {
          updatedList = [savedItem, ...existing];
        }
      } else {
        updatedList = [savedItem];
      }
      localStorage.setItem('kld_workspace_items', JSON.stringify(updatedList));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // Save to API Backend if token exists
    try {
      const token = localStorage.getItem('token');
      if (token) {
        if (isExistingProject && targetId.length === 24) {
          await fetch(`${API_BASE_URL}/mockups/saved/${targetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(savedItem)
          });
        } else {
          const res = await fetch(`${API_BASE_URL}/mockups/saved`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(savedItem)
          });
          const data = await res.json();
          if (res.ok && data.success && data.data?.design?._id) {
            savedItem.id = data.data.design._id;
            savedItem._id = data.data.design._id;
            if (store.setActiveProject) store.setActiveProject(savedItem.id, targetName);
          }
        }
      }
    } catch (err) {
      console.warn('API save error:', err);
    }

    window.dispatchEvent(new CustomEvent('project-saved', { detail: savedItem }));
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Print Imposition (parity with WorkshopPage.tsx)
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
      const dielineData = getBoxDieline(currentModel, params);
      const dxfString = generateDXFString(dielineData);

      const paramsPayload = {
        L_mm: Math.round((store.L || 4.7244) * 25.4),
        W_mm: Math.round((store.W || 2.3622) * 25.4),
        H_mm: Math.round((store.H || 6.2992) * 25.4),
        boxModel: currentModel,
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
      alert('Could not prepare print layout. See console.');
    }
  };

  // High-Resolution Snapshot Capture
  const handleExportSnapshot = () => {
    setIsExportingSnapshot(true);
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `kld_${currentModel}_3d_mockup.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setIsExportingSnapshot(false);
    }, 400);
  };

  // Preset Materials
  const materials = [
    { id: 'plastic_glossy', label: 'Glossy Plastic', category: 'Plastic' },
    { id: 'plastic_matte', label: 'Matte Plastic', category: 'Plastic' },
    { id: 'metal_gloss', label: 'Polished Metal', category: 'Metallic' },
    { id: 'metal_matt', label: 'Brushed Aluminum', category: 'Metallic' },
    { id: 'sbs_white', label: 'SBS White Board', category: 'Paperboard' },
    { id: 'corrugated', label: 'Kraft Corrugated', category: 'Paperboard' },
  ];

  // Preset Cap Swatches
  const capColorPresets = [
    { name: 'Jet Black', color: '#18181b' },
    { name: 'Pure White', color: '#ffffff' },
    { name: 'Sky Blue', color: '#38bdf8' },
    { name: 'Royal Blue', color: '#2563eb' },
    { name: 'Emerald Green', color: '#16a34a' },
    { name: 'Crimson Red', color: '#dc2626' },
    { name: 'Bright Yellow', color: '#eab308' },
  ];

  // Preset Package Body Colors
  const packageColorPresets = [
    { name: 'Clean White', color: '#ffffff' },
    { name: 'Midnight', color: '#111827' },
    { name: 'Kraft Brown', color: '#d97706' },
    { name: 'Forest Green', color: '#15803d' },
    { name: 'Deep Crimson', color: '#b91c1c' },
    { name: 'Cobalt Blue', color: '#1d4ed8' },
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-112px)] pb-16 overflow-hidden bg-zinc-950 text-white select-none">
      
      {/* 1. TOP MODEL SWITCHER CAROUSEL */}
      <div className="bg-zinc-900 border-b border-zinc-800/90 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
        {modelsList.map((m) => {
          const isActive = currentModel === m.key;
          return (
            <button
              key={m.key}
              onClick={() => {
                store.setBoxModel(m.key);
                setFoldProgress(1);
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                  : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 active:scale-95'
              }`}
            >
              <span>{m.name.split(' (')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* 2. TOP ACTION BUTTONS BAR (Desktop Parity: Print, AI Assistant, Save, Export) */}
      <div className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/80 px-3 py-1.5 flex items-center justify-between gap-2 flex-shrink-0 text-xs">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider truncate">
            {activeModelInfo.category} • ID: {activeModelInfo.modelId}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            title="Open in Print & Imposition Tool"
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all border border-zinc-700/60 cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xs:inline">Print</span>
          </button>

          {/* CAD / AI Assistant */}
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all border cursor-pointer active:scale-95 ${
              isAiOpen
                ? 'bg-zinc-100 text-zinc-950 border-white shadow-xs'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-zinc-300" />
            <span className="hidden xs:inline">CAD AI</span>
          </button>

          {/* Save Project Button */}
          <button
            onClick={handleSaveToWorkspace}
            disabled={isSaving}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 text-white transition-all shadow-xs cursor-pointer active:scale-95 ${
              isSaved ? 'bg-emerald-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Snapshot Export */}
          <button
            onClick={handleExportSnapshot}
            disabled={isExportingSnapshot}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Export 3D Snapshot"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. MAIN PHOTOREALISTIC 3D STAGE */}
      <div className="relative flex-1 w-full bg-gradient-to-b from-zinc-900 via-zinc-950 to-black overflow-hidden flex items-center justify-center">
        <Box3DViewer 
          key={`${currentModel}-${store.packageColor}-${store.capColor}-${store.materialType}`}
          boxModelOverride={currentModel}
          overrideLayout="single"
          L={store.L}
          W={store.W}
          H={store.H}
          T={store.T}
          progress={foldProgress}
          lightingPreset="studio"
          activeAnimation="none"
        />

        {/* Floating Fold Animation Control for Boxes */}
        {isBoxModel && (
          <div className="absolute top-3 left-3 right-3 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex items-center gap-2 z-10">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex-shrink-0 cursor-pointer active:scale-95"
              title={isPlaying ? 'Pause Fold' : 'Play Fold'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
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
                setIsPlaying(false);
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-400 font-bold">Folded</span>
          </div>
        )}

        {/* Fullscreen 3D View Button */}
        <button
          onClick={() => setIsFullscreen3D(true)}
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 text-white text-[11px] font-semibold flex items-center gap-1.5 z-20 cursor-pointer active:scale-95 transition-all shadow-lg"
          title="Open Fullscreen 3D View"
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Fullscreen</span>
        </button>

        {/* Floating Active Decal Notification Pill on 3D Stage */}
        {activeDecalUrl && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-blue-600/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blue-400/40 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xl z-20 pointer-events-none whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>Artwork on <strong>{decalPanel}</strong> • Spin 360° to view</span>
          </div>
        )}

        {/* Orbit Instructions Pill */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 pointer-events-none text-[10px] text-zinc-400 flex items-center gap-1.5">
          <RotateCw className="w-3 h-3 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Touch & drag to rotate 360°</span>
        </div>

        {/* Tap for Fullscreen Hint Button */}
        <button
          onClick={() => setIsFullscreen3D(true)}
          className="absolute bottom-3 right-3 bg-blue-600/85 hover:bg-blue-600 backdrop-blur-md px-2.5 py-1 rounded-full border border-blue-400/30 text-white text-[10px] font-semibold flex items-center gap-1 shadow-md cursor-pointer active:scale-95 transition-all z-20"
          title="Expand to Fullscreen"
        >
          <Maximize2 className="w-3 h-3 text-white" />
          <span>Tap to Expand View</span>
        </button>
      </div>

      {/* 4. BOTTOM FLOATING CONTROLS SHEET (Collapsible for maximum 3D view) */}
      <div className={`bg-zinc-900 border-t border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
        isSheetCollapsed ? 'max-h-[58px] overflow-hidden' : 'max-h-[46vh]'
      }`}>
        
        {/* Drag Handle & Collapse/Expand Toggle */}
        <div 
          onClick={() => setIsSheetCollapsed(!isSheetCollapsed)}
          className="w-full pt-2 pb-1 flex flex-col items-center justify-center cursor-pointer active:opacity-75 transition-opacity"
          title={isSheetCollapsed ? "Tap to Expand Controls" : "Collapse to see full 3D preview"}
        >
          <div className="w-10 h-1 bg-zinc-700 hover:bg-zinc-600 rounded-full transition-colors" />
          <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-semibold mt-0.5">
            {isSheetCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3 text-blue-400" />
                <span>Tap to Expand Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
                <span>Collapse Panel</span>
              </>
            )}
          </div>
        </div>

        {/* Control Tabs Strip */}
        <div className="flex items-center justify-around border-b border-zinc-800/80 px-2 pb-1 text-[11px] font-semibold text-zinc-400">
          <button
            onClick={() => {
              setActiveSheetTab('edit');
              if (isSheetCollapsed) setIsSheetCollapsed(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSheetTab === 'edit' && !isSheetCollapsed ? 'bg-zinc-800 text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Artwork</span>
          </button>

          <button
            onClick={() => {
              setActiveSheetTab('dimensions');
              if (isSheetCollapsed) setIsSheetCollapsed(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSheetTab === 'dimensions' && !isSheetCollapsed ? 'bg-zinc-800 text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Size</span>
          </button>

          <button
            onClick={() => {
              setActiveSheetTab('material');
              if (isSheetCollapsed) setIsSheetCollapsed(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSheetTab === 'material' && !isSheetCollapsed ? 'bg-zinc-800 text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Material</span>
          </button>

          <button
            onClick={() => {
              setActiveSheetTab('color');
              if (isSheetCollapsed) setIsSheetCollapsed(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSheetTab === 'color' && !isSheetCollapsed ? 'bg-zinc-800 text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Color</span>
          </button>
        </div>

        {/* Tab Contents Viewport */}
        <div className="p-3.5 overflow-y-auto space-y-3">
          
          {/* TAB 1: ARTWORK & DESIGN ONLINE */}
          {activeSheetTab === 'edit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">2D Label / Dieline Graphics</span>
                <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-900/60">
                  {activeModelInfo.labelDim}
                </span>
              </div>

              {/* Placed Decal Controller UI when artwork is active */}
              {activeDecalUrl ? (
                <div className="space-y-2.5 bg-zinc-850 p-3 rounded-2xl border border-zinc-700/80">
                  {/* Thumbnail & File Name */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                        <img 
                          src={activeDecalUrl} 
                          alt={activeDecalName} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-zinc-200 truncate block">
                          {activeDecalName || 'Uploaded Artwork'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Placed on {decalPanel}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Replace or Delete */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-650 text-zinc-200 text-[10px] font-semibold cursor-pointer active:scale-95 transition-all"
                        title="Change Artwork"
                      >
                        Replace
                      </button>
                      <button
                        onClick={handleRemoveDecal}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/40 text-red-400 text-[10px] cursor-pointer active:scale-95 transition-all"
                        title="Remove Artwork"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Surface / Panel Face Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Placement Face
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {isCylinder ? (
                        <>
                          {['Front Label', '360° Wrap'].map((face) => (
                            <button
                              key={face}
                              onClick={() => applyDecalToModel(activeDecalUrl, activeDecalName, face, decalScale, decalX, decalY, decalRotation)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                                decalPanel === face
                                  ? 'bg-blue-600 text-white shadow-md font-bold border border-blue-400/50'
                                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                              }`}
                            >
                              {decalPanel === face && <Check className="w-3 h-3" />}
                              <span>{face}</span>
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          {['Front', 'Back', 'Left', 'Right', 'Top'].map((face) => (
                            <button
                              key={face}
                              onClick={() => applyDecalToModel(activeDecalUrl, activeDecalName, face, decalScale, decalX, decalY, decalRotation)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                                decalPanel === face
                                  ? 'bg-blue-600 text-white shadow-md font-bold border border-blue-400/50'
                                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                              }`}
                            >
                              {decalPanel === face && <Check className="w-3 h-3" />}
                              <span>{face}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Position & Scale Sliders */}
                  <div className="space-y-1.5 pt-1.5 border-t border-zinc-800">
                    {/* Scale */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 font-medium">Artwork Scale</span>
                        <span className="font-mono text-blue-400 font-bold">{decalScale.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="2.5"
                        step="0.05"
                        value={decalScale}
                        onChange={(e) => applyDecalToModel(activeDecalUrl, activeDecalName, decalPanel, parseFloat(e.target.value), decalX, decalY, decalRotation)}
                        className="w-full accent-blue-500 cursor-pointer h-1"
                      />
                    </div>

                    {/* Horizontal & Vertical Positioning */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400 font-medium">Position X</span>
                          <span className="font-mono text-zinc-300">{decalX > 0 ? `+${decalX.toFixed(1)}` : decalX.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={decalX}
                          onChange={(e) => applyDecalToModel(activeDecalUrl, activeDecalName, decalPanel, decalScale, parseFloat(e.target.value), decalY, decalRotation)}
                          className="w-full accent-blue-500 cursor-pointer h-1"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400 font-medium">Position Y</span>
                          <span className="font-mono text-zinc-300">{decalY > 0 ? `+${decalY.toFixed(1)}` : decalY.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={decalY}
                          onChange={(e) => applyDecalToModel(activeDecalUrl, activeDecalName, decalPanel, decalScale, decalX, parseFloat(e.target.value), decalRotation)}
                          className="w-full accent-blue-500 cursor-pointer h-1"
                        />
                      </div>
                    </div>

                    {/* Rotation & Center Reset */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 font-medium">Rotation</span>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="15"
                          value={decalRotation}
                          onChange={(e) => applyDecalToModel(activeDecalUrl, activeDecalName, decalPanel, decalScale, decalX, decalY, parseInt(e.target.value, 10))}
                          className="w-20 accent-blue-500 cursor-pointer h-1"
                        />
                        <span className="text-[10px] font-mono text-zinc-400">{decalRotation}°</span>
                      </div>

                      <button
                        onClick={() => applyDecalToModel(activeDecalUrl, activeDecalName, decalPanel, 1, 0, 0, 0)}
                        className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                      >
                        Reset Position
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons: Design Online & Upload Image */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Launch Desktop-parity 2D EditorModal */}
                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5" />
                  <span>Design Online</span>
                  <span className="text-[10px] text-blue-200 font-normal">Full 2D Dieline Studio</span>
                </button>

                {/* Direct Image Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-dashed border-zinc-700 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-xs font-bold text-zinc-300 transition-colors active:scale-95"
                >
                  <Upload className="w-5 h-5 text-zinc-400" />
                  <span>{activeDecalUrl ? 'Upload Another' : 'Upload Image'}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">PNG, JPG, SVG</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDirectArtworkUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Dielines Navigation Hint */}
              <div 
                onClick={() => onNavigateTab?.('dielines')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-800 text-xs text-zinc-400 cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Switch to 2D CAD Dieline Generator</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* TAB 2: PARAMETRIC DIMENSIONS */}
          {activeSheetTab === 'dimensions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">
                  {isBoxModel ? 'Parametric Box Dimensions' : 'Container Specifications'}
                </span>
                
                {/* Unit Toggle */}
                <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700/80 text-[11px] font-semibold">
                  <button
                    onClick={() => { setUnit('mm'); store.setUnit?.('mm'); }}
                    className={`px-2.5 py-0.5 rounded-md transition-colors ${unit === 'mm' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    mm
                  </button>
                  <button
                    onClick={() => { setUnit('in'); store.setUnit?.('in'); }}
                    className={`px-2.5 py-0.5 rounded-md transition-colors ${unit === 'in' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    in
                  </button>
                </div>
              </div>

              {isBoxModel ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">Length (L)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={inputL}
                        onChange={(e) => handleLChange(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-zinc-500">{unit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">Width (W)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={inputW}
                        onChange={(e) => handleWChange(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-zinc-500">{unit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">Height (H)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={inputH}
                        onChange={(e) => handleHChange(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-zinc-500">{unit}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-zinc-800/80 rounded-2xl border border-zinc-700/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Standard Volume:</span>
                    <span className="font-bold text-white">
                      {currentModel === 'sipper_water_bottle' ? '1000 ml (33.8 oz)' :
                       currentModel === 'water_bottle' ? '500 ml PET' :
                       currentModel === 'can' ? '355 ml (12 oz Standard)' :
                       currentModel === 'slim_can' ? '355 ml (12 oz Slim)' : '75 ml Paste Tube'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Flat Label Size:</span>
                    <span className="font-bold text-blue-400">{activeModelInfo.labelDim}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM MATERIAL */}
          {activeSheetTab === 'material' && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-zinc-200 block">Substrate & Packaging Material</span>
              <div className="grid grid-cols-2 gap-2">
                {materials.map((mat) => {
                  const isSelected = (store.materialType || 'plastic_glossy') === mat.id;
                  return (
                    <button
                      key={mat.id}
                      onClick={() => store.setMaterialType?.(mat.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-blue-950/60 border-blue-500 text-white shadow-xs'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        {mat.category}
                      </span>
                      <span className="text-xs font-bold">{mat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CAP & PACKAGE COLOR */}
          {activeSheetTab === 'color' && (
            <div className="space-y-3.5">
              {/* Cap Color Picker if bottle or tube */}
              {hasCapColor && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200">
                      {currentModel === 'tube' ? 'Tube Cap Color' : 'Bottle Cap & Ring Color'}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {store.capColor || '#ffffff'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {/* Native Color Picker */}
                    <label className="w-7 h-7 rounded-full border border-zinc-600 cursor-pointer relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-tr from-red-500 via-green-500 to-blue-500">
                      <input
                        type="color"
                        value={store.capColor || '#ffffff'}
                        onChange={(e) => store.setCapColor?.(e.target.value)}
                        className="opacity-0 absolute inset-0 cursor-pointer"
                      />
                    </label>

                    {capColorPresets.map((swatch) => (
                      <button
                        key={swatch.color}
                        onClick={() => store.setCapColor?.(swatch.color)}
                        className={`w-7 h-7 rounded-full flex-shrink-0 border transition-transform cursor-pointer active:scale-90 ${
                          (store.capColor || '#ffffff').toLowerCase() === swatch.color.toLowerCase()
                            ? 'ring-2 ring-blue-500 border-white scale-110'
                            : 'border-zinc-600'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Package Body Color */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-200">Package Body Color</span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {store.packageColor || 'Default'}
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {/* Native Color Picker */}
                  <label className="w-7 h-7 rounded-full border border-zinc-600 cursor-pointer relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-tr from-yellow-500 via-purple-500 to-pink-500">
                    <input
                      type="color"
                      value={store.packageColor || '#ffffff'}
                      onChange={(e) => store.setPackageColor?.(e.target.value)}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                  </label>

                  {packageColorPresets.map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => store.setPackageColor?.(swatch.color)}
                      className={`w-7 h-7 rounded-full flex-shrink-0 border transition-transform cursor-pointer active:scale-90 ${
                        (store.packageColor || '#ffffff').toLowerCase() === swatch.color.toLowerCase()
                          ? 'ring-2 ring-blue-500 border-white scale-110'
                          : 'border-zinc-600'
                      }`}
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 5. FULL 2D LABEL & DIELINE EDITOR MODAL (Identical to Desktop) */}
      {isEditorOpen && (
        <EditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          contextType="mockup"
        />
      )}

      {/* 6. AI PACKAGING ASSISTANT MODAL (Identical to Desktop) */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-2 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-zinc-300" />
                <h3 className="text-sm font-bold text-white">KLD Packaging CAD Assistant</h3>
              </div>
              <button
                onClick={() => setIsAiOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-1 bg-zinc-800 rounded-lg"
              >
                ✕ Close
              </button>
            </div>
            <AiPackagingAssistant
              onApplyVariation={(variation: any) => {
                if (variation?.backgroundUrl || variation?.url) {
                  const newDecal = {
                    id: 'ai-' + Date.now(),
                    url: variation.backgroundUrl || variation.url,
                    name: 'AI Generated Artwork',
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotation: 0,
                    surface: 'Outside',
                    isWrap: true,
                    opacity: 1
                  };
                  if (store.setDecals) {
                    store.setDecals([newDecal]);
                  }
                }
                setIsAiOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 7. FULLSCREEN IMMERSIVE 3D INSPECTION MODAL */}
      {isFullscreen3D && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black flex flex-col animate-in fade-in duration-200">
          {/* Fullscreen Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-black/70 backdrop-blur-md z-20">
            <button
              onClick={() => setIsFullscreen3D(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold cursor-pointer transition-all border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Studio</span>
            </button>

            <div className="text-center px-2">
              <h3 className="text-xs font-bold text-white leading-tight truncate max-w-[180px]">{activeModelInfo.name}</h3>
              <span className="text-[10px] text-zinc-400 font-mono">360° Inspection</span>
            </div>

            <button
              onClick={() => setIsFullscreen3D(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer transition-all border border-white/10"
              title="Close Fullscreen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen 3D Canvas Viewport */}
          <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
            <Box3DViewer 
              key={`fullscreen-${currentModel}-${store.packageColor}-${store.capColor}-${store.materialType}`}
              boxModelOverride={currentModel}
              overrideLayout="single"
              L={store.L}
              W={store.W}
              H={store.H}
              T={store.T}
              progress={foldProgress}
              lightingPreset="studio"
              activeAnimation="none"
              zoom={0.88}
            />

            {/* Fold Animation Control if Box Model */}
            {isBoxModel && (
              <div className="absolute top-4 left-4 right-4 max-w-sm mx-auto bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 flex items-center gap-2.5 z-20 shadow-xl">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer active:scale-95"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
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
                    setIsPlaying(false);
                  }}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-400 font-bold">Folded</span>
              </div>
            )}

            {/* Floating Active Decal Badge */}
            {activeDecalUrl && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-blue-400/40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl z-20 pointer-events-none whitespace-nowrap">
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Artwork on <strong>{decalPanel}</strong> face</span>
              </div>
            )}

            {/* Interaction Guide Pill */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-white/90 text-xs flex items-center gap-2 shadow-2xl pointer-events-none whitespace-nowrap">
              <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Touch & drag to rotate 360° • Pinch to zoom</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileStudioTab;
