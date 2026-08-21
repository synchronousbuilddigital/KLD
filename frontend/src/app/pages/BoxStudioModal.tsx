// @ts-nocheck
import React, { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, RotateCcw, Maximize2, Play, Download, Check, Info, Save, Printer, Share2, Menu, Star, ExternalLink, Palette } from "lucide-react";
import { useBoxStore } from "../../lib/useBoxStore";
import DielineSVG from "../../components/DielineSVG";
import Box3DViewer from "../../components/Box3DViewer";
import MaterialDropdown from "../../components/dieline/MaterialDropdown";
import EditorModal from "./EditorModal";
import { exportSVG, exportDXF, exportPDF, generateDXFString } from "../../lib/exportUtils";
import { generateRTEDielineDXF } from "../../lib/rteDielineGenerator";
import { generateTEDielineDXF } from "../../lib/teDielineGenerator";
import { generateAutoLockDieline } from "../../lib/autoLockDielineGenerator";
import { generateCosmeticBoxDieline } from "../../lib/cosmeticBoxDielineGenerator";
import { API_BASE_URL } from "../../config/api";

interface BoxStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModel?: "rte" | "te" | "auto_lock" | "cosmetic";
  boxTitle?: string;
}

class StudioErrorBoundary extends React.Component<{ children: React.ReactNode; onClose?: () => void }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Studio error caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white text-zinc-900 z-[999999]">
          <div className="max-w-lg bg-zinc-50 border border-red-200 rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-base font-bold text-red-900">Studio Error Details</h2>
            <div className="bg-zinc-900 text-red-400 p-3 rounded-lg text-xs font-mono w-full overflow-x-auto break-all max-h-40 overflow-y-auto">
              {String(this.state.error?.stack || this.state.error?.message || this.state.error || "Unknown Error")}
            </div>
            {this.props.onClose && (
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onClose?.();
                }}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                ← Back to Dielines
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }

}



export const BoxStudioModal: React.FC<BoxStudioModalProps> = ({
  isOpen,
  onClose,
  initialModel = "rte",
  boxTitle = "Dieline Generator & 3D Preview"
}) => {
  const store = useBoxStore();

  // Unit State
  const [unit, setUnit] = useState<"in" | "mm">("in");

  // Local string inputs for smooth typing
  const [inputL, setInputL] = useState(store.L.toString());
  const [inputW, setInputW] = useState(store.W.toString());
  const [inputH, setInputH] = useState(store.H.toString());

  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Prevent background scrolling when studio is open, set dieline context, and handle browser back button in 1 click
  useEffect(() => {
    if (isOpen) {
      store.setContextAndModel("dieline", initialModel || store.boxModel);
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Push history state so browser BACK button triggers popstate and closes modal in 1 click
      window.history.pushState({ modal: 'box-studio' }, '', window.location.href);

      const handlePopState = () => {
        onClose();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        document.body.style.overflow = origOverflow;
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, initialModel]);

  // Sync inputs when store dimensions or unit change externally
  useEffect(() => {
    const valL = unit === "in" ? store.L : store.L * 25.4;
    const valW = unit === "in" ? store.W : store.W * 25.4;
    const valH = unit === "in" ? store.H : store.H * 25.4;
    setInputL(unit === "in" ? valL.toFixed(4) : valL.toFixed(2));
    setInputW(unit === "in" ? valW.toFixed(4) : valW.toFixed(2));
    setInputH(unit === "in" ? valH.toFixed(4) : valH.toFixed(2));
  }, [store.L, store.W, store.H, unit]);

  // 3D Preview & Fold Progress State
  const [foldProgress, setFoldProgress] = useState(1); // 0 = Open, 1 = Close
  const [isPlayingAnim, setIsPlayingAnim] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  // Zoom / Reset Canvas State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Set initial box model
  useEffect(() => {
    if (isOpen && initialModel) {
      store.setBoxModel(initialModel);
    }
  }, [isOpen, initialModel]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle fold play animation loop
  useEffect(() => {
    if (isPlayingAnim) {
      let direction = foldProgress >= 1 ? -1 : 1;
      let startProgress = foldProgress;
      let startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        let newProgress = startProgress + direction * (elapsed / 2.5);

        if (newProgress >= 1) {
          newProgress = 1;
          direction = -1;
          startTime = now;
          startProgress = 1;
        } else if (newProgress <= 0) {
          newProgress = 0;
          direction = 1;
          startTime = now;
          startProgress = 0;
        }

        setFoldProgress(newProgress);
        animFrameRef.current = requestAnimationFrame(animate);
      };

      animFrameRef.current = requestAnimationFrame(animate);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlayingAnim]);

  if (!isOpen) return null;

  const modelLabels: Record<string, string> = {
    te: "Straight Tuck End Box",
    rte: "Reverse Tuck End Box",
    auto_lock: "Auto Lock Bottom Box",
    cosmetic: "Cosmetic Box"
  };

  const currentTitle = modelLabels[store.boxModel] || boxTitle;

  // Handlers for inputs
  const handleLChange = (valStr: string) => {
    setInputL(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const inVal = unit === "in" ? num : num / 25.4;
      store.setDim("L", inVal);
    }
  };

  const handleWChange = (valStr: string) => {
    setInputW(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const inVal = unit === "in" ? num : num / 25.4;
      store.setDim("W", inVal);
    }
  };

  const handleHChange = (valStr: string) => {
    setInputH(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const inVal = unit === "in" ? num : num / 25.4;
      store.setDim("H", inVal);
    }
  };

  // Format readouts for display
  const displayL = unit === "in" ? store.L.toFixed(4) : (store.L * 25.4).toFixed(2);
  const displayW = unit === "in" ? store.W.toFixed(4) : (store.W * 25.4).toFixed(2);
  const displayH = unit === "in" ? store.H.toFixed(4) : (store.H * 25.4).toFixed(2);

  // Export handlers
  const handleExportDXF = () => {
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
      let dielineData;
      if (store.boxModel === "te") dielineData = generateTEDielineDXF(params);
      else if (store.boxModel === "auto_lock") dielineData = generateAutoLockDieline(params);
      else if (store.boxModel === "cosmetic") dielineData = generateCosmeticBoxDieline(params);
      else dielineData = generateRTEDielineDXF(params);
      exportDXF(dielineData, `${store.boxModel}_dieline.dxf`);
    } catch (err) {
      console.error("DXF Export Error:", err);
    }
  };

  const handlePrint = () => {
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
      let dielineData;
      if (store.boxModel === "te") dielineData = generateTEDielineDXF(params);
      else if (store.boxModel === "auto_lock") dielineData = generateAutoLockDieline(params);
      else if (store.boxModel === "cosmetic") dielineData = generateCosmeticBoxDieline(params);
      else dielineData = generateRTEDielineDXF(params);
      
      const dxfString = generateDXFString(dielineData);
      
      // Store in localStorage so dieline-tool.html can pick it up automatically
      localStorage.setItem("autoLoadDXF", dxfString);
      localStorage.setItem("autoLoadParams", JSON.stringify({
        L_mm: Math.round((store.L || 4.7244) * 25.4),
        W_mm: Math.round((store.W || 2.3622) * 25.4),
        H_mm: Math.round((store.H || 6.2992) * 25.4),
        boxModel: store.boxModel
      }));
      window.open('/dieline-tool.html', '_blank');
    } catch (err) {
      console.error("Print Error:", err);
    }
  };

  const handleExportPDF = async () => {
    try {
      const svgElement = document.querySelector("#dieline-svg-wrapper svg") as SVGSVGElement | null;
      if (svgElement) {
        await exportPDF(svgElement, `${store.boxModel}_dieline.pdf`, "CMYK");
      } else {
        handleExportDXF();
      }
    } catch (err) {
      console.error("PDF Export Error:", err);
      handleExportDXF();
    }
  };

  const handleExportAI = () => {
    try {
      const svgElement = document.querySelector("#dieline-svg-wrapper svg") as SVGSVGElement | null;
      if (svgElement) {
        // AI can natively open SVG files and editing is perfectly preserved
        exportSVG(svgElement, `${store.boxModel}_dieline.ai`);
      }
    } catch (err) {
      console.error("AI Export Error:", err);
    }
  };

  const handleExportSVG = () => {
    try {
      const svgElement = document.querySelector("#dieline-svg-wrapper svg") as SVGSVGElement | null;
      if (svgElement) {
        exportSVG(svgElement, `${store.boxModel}_dieline.svg`);
      }
    } catch (err) {
      console.error("SVG Export Error:", err);
    }
  };

  const handleSaveProject = async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || !!localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("⚠️ Login Required: Please sign in or create an account to save your design to your workspace.");
      window.dispatchEvent(new CustomEvent('open-sign-in-modal'));
      return;
    }

    setIsSaving(true);
    const dimL_mm = Math.round(store.L * 25.4);
    const dimW_mm = Math.round(store.W * 25.4);
    const dimH_mm = Math.round(store.H * 25.4);
    const modelName = currentTitle;

    const newItemData = {
      name: `${modelName} (${dimL_mm}×${dimW_mm}×${dimH_mm}mm)`,
      type: 'DIELINE',
      category: modelName,
      boxModel: store.boxModel,
      tabCategory: 'projects',
      variantId: 1,
      dimensions: { L: dimL_mm, W: dimW_mm, H: dimH_mm },
      packageColor: store.packageColor || null,
      insideColor: store.insideColor || null,
      decals: store.decalsByModel ? store.decalsByModel[store.boxModel] || [] : [],
      isDraft: false,
      isFavorite: false
    };

    let createdId = 'saved-' + Date.now();

    // 1. Post to API backend if authenticated
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        let res = await fetch(`${API_BASE_URL}/mockups/saved`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          credentials: 'include',
          body: JSON.stringify(newItemData)
        });
        let data = await res.json();
        if (res.ok && data.data?.design?._id) {
          createdId = data.data.design._id;
        }
      } catch (err) {
        console.error("Backend save error:", err);
      }
    }

    // 2. Save locally to localStorage so it appears in Workspace immediately
    try {
      const stored = localStorage.getItem('kld_workspace_items');
      let items: any[] = [];
      if (stored) {
        try { items = JSON.parse(stored); } catch (e) { items = []; }
      }
      if (!Array.isArray(items)) items = [];
      const newItem = {
        id: createdId,
        ...newItemData,
        updatedAt: new Date().toISOString()
      };
      items = items.filter(i => i.id !== createdId && i.id !== 'active-session-draft');
      items.unshift(newItem);
      localStorage.setItem('kld_workspace_items', JSON.stringify(items));
    } catch (err) {
      console.error("Local save error:", err);
    }

    // 3. Dispatch real-time project-saved event for instant User Profile & Admin Dashboard update
    window.dispatchEvent(new CustomEvent('project-saved', { detail: newItemData }));

    setIsSaved(true);
    setIsSaving(false);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getGeometryForModel = (L: number, W: number, H: number, glueTab: number) => {
    const tuck = 18;
    const flapH = W * 0.5;
    if (store.boxModel === 'te') {
      return getStraightTuckGeometry(L, W, H, glueTab, tuck, flapH);
    } else if (store.boxModel === 'rte') {
      return getReverseTuckGeometry(L, W, H, glueTab, tuck, flapH);
    } else if (store.boxModel === 'auto_lock') {
      return getAutoLockBottomGeometry(L, W, H, glueTab);
    } else {
      return getRscGeometry(L, W, H, glueTab);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-[#eeeeee] flex flex-col font-sans text-zinc-900 overflow-hidden w-full h-full">
      <StudioErrorBoundary onClose={onClose}>
        <div className="relative w-full h-full flex flex-col overflow-hidden">

        
        {/* TOP NAVBAR */}
        <header className="h-14 bg-white border-b border-zinc-200 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 text-zinc-900">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
                <path d="m7.5 4.27 9 5.15" />
              </svg>
            </div>

            <span className="font-bold text-sm text-zinc-900 hidden sm:inline">{currentTitle}</span>

            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                title="Menu"
              >
                <Menu className="w-5 h-5 text-zinc-700" />
              </button>

              {isMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50">
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.dispatchEvent(new CustomEvent('navigate', { detail: 'workspace' }));
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
                  >
                    My Workspace
                  </button>
                  <div className="h-px bg-zinc-100 my-1" />
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
                  >
                    All Dieline Templates
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Save Project Button */}
            <button
              onClick={handleSaveProject}
              disabled={isSaving}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isSaved ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
              }`}
              style={{ backgroundColor: isSaved ? '#047857' : '#10b981' }}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>{isSaving ? 'Saving...' : 'Save Project'}</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              style={{ backgroundColor: '#007aff' }}
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </button>

          </div>
        </header>

        {/* MAIN THREE-COLUMN STUDIO EDITOR */}
        <div className="flex-1 flex overflow-hidden relative w-full">
          
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR PANEL (Custom Size, Material, Size Mode, Display Options)    */}
          {/* ========================================================================= */}
          <aside className="w-[260px] md:w-[280px] bg-white border-r border-zinc-200 p-4 md:p-5 overflow-y-auto shrink-0 flex flex-col gap-6 text-zinc-800 shadow-sm z-10">
            
            {/* Custom Size Header & Unit Switcher */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Custom size</h3>
                <div className="flex bg-zinc-100 p-0.5 rounded-md border border-zinc-200 text-[11px] font-semibold">
                  <button
                    onClick={() => { setUnit("mm"); store.setUnit("mm"); }}
                    className={`px-2 py-0.5 rounded ${unit === "mm" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-zinc-500"}`}
                  >
                    mm
                  </button>
                  <button
                    onClick={() => { setUnit("in"); store.setUnit("in"); }}
                    className={`px-2 py-0.5 rounded ${unit === "in" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-zinc-500"}`}
                  >
                    in
                  </button>
                </div>
              </div>

              {/* Length & Width Input Row */}
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium block mb-1">Length</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={inputL}
                      onChange={(e) => handleLChange(e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 font-mono font-medium focus:outline-none focus:border-blue-500 pr-7"
                    />
                    <span className="absolute right-2 top-1.5 text-[11px] text-zinc-400 font-mono">{unit}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium block mb-1">Width</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={inputW}
                      onChange={(e) => handleWChange(e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 font-mono font-medium focus:outline-none focus:border-blue-500 pr-7"
                    />
                    <span className="absolute right-2 top-1.5 text-[11px] text-zinc-400 font-mono">{unit}</span>
                  </div>
                </div>
              </div>

              {/* Height Input Row */}
              <div>
                <label className="text-[11px] text-zinc-500 font-medium block mb-1">Height</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={inputH}
                    onChange={(e) => handleHChange(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 font-mono font-medium focus:outline-none focus:border-blue-500 pr-7"
                  />
                  <span className="absolute right-2 top-1.5 text-[11px] text-zinc-400 font-mono">{unit}</span>
                </div>
              </div>
            </div>

            {/* Material Dropdown Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Material</span>
              </div>
              <MaterialDropdown />
            </div>

            {/* Size Mode Radio Buttons */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Size mode</h3>
              <div className="space-y-1 bg-zinc-50 p-1.5 rounded-lg border border-zinc-200">
                <button
                  onClick={() => store.setSizeMode("manufacture")}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    store.sizeMode === "manufacture" ? "bg-amber-100/80 text-amber-900 font-semibold border border-amber-300/60" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Manufacture dimensions
                </button>
                <button
                  onClick={() => store.setSizeMode("inner")}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    store.sizeMode === "inner" ? "bg-amber-100/80 text-amber-900 font-semibold border border-amber-300/60" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Inner dimensions
                </button>
                <button
                  onClick={() => store.setSizeMode("outer")}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    store.sizeMode === "outer" ? "bg-amber-100/80 text-amber-900 font-semibold border border-amber-300/60" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Outer dimensions
                </button>
              </div>
            </div>

            {/* Display Options Toggles */}
            <div className="space-y-3 pt-2 border-t border-zinc-200">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Display options</h3>

              <div className="flex items-center justify-between text-xs text-zinc-700">
                <span>Overall dimensions</span>
                <input
                  type="checkbox"
                  checked={store.showOverallDims}
                  onChange={() => store.toggleView("showOverallDims")}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-700">
                <span>Basic dimensions</span>
                <input
                  type="checkbox"
                  checked={store.showBasicDims}
                  onChange={() => store.toggleView("showBasicDims")}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-700">
                <span>Bleed contours</span>
                <input
                  type="checkbox"
                  checked={store.showBleedLine}
                  onChange={() => store.toggleView("showBleedLine")}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-700">
                <span>Annotations</span>
                <input
                  type="checkbox"
                  checked={store.showAnnotations}
                  onChange={() => store.toggleView("showAnnotations")}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>
            </div>
            
            {/* Customise Button */}
            <div className="mt-4 pt-4 border-t border-zinc-200">
              <button
                onClick={() => setIsEditorOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-3 rounded-xl transition-colors shadow-sm"
              >
                <Palette className="w-4 h-4" />
                Customise
              </button>
            </div>

          </aside>

          {/* ========================================================================= */}
          {/* CENTER CANVAS AREA (Top Legend + Readout + 2D Dieline Vector Canvas)      */}
          {/* ========================================================================= */}
          <main
            id="dieline-canvas-area"
            className="flex-1 min-w-0 bg-[#fffcf7] relative flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden"
          >
            {/* Top Legend Bar */}
            <div className="absolute top-4 left-6 flex items-center gap-6 text-xs text-zinc-600 font-semibold z-10">
              <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-blue-600 inline-block" />
                <span>Trim</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-0 border-b-2 border-dashed border-red-500 inline-block" />
                <span>Crease</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-green-600 inline-block" />
                <span>Bleed</span>
              </div>
            </div>

            {/* Reset View Button Top Right */}
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors z-10 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset View
            </button>

            {/* Manufacture & Inner/Outer Dimensions Readout Overlay */}
            <div className="absolute top-12 left-6 text-xs text-zinc-500 space-y-1 font-mono z-10">
              <div>
                <span className="text-blue-600 font-semibold">Manufacture dimensions:</span>{" "}
                <span className="font-bold">{displayL} × {displayW} × {displayH} {unit}</span>
              </div>
              <div>
                <span className="text-zinc-400">Inner dimensions:</span>{" "}
                <span>
                  {unit === 'in' 
                    ? `${(store.L - 2 * store.T).toFixed(4)} × ${(store.W - 2 * store.T).toFixed(4)} × ${(store.H - 2 * store.T).toFixed(4)} in`
                    : `${((store.L - 2 * store.T) * 25.4).toFixed(2)} × ${((store.W - 2 * store.T) * 25.4).toFixed(2)} × ${((store.H - 2 * store.T) * 25.4).toFixed(2)} mm`
                  }
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Outer dimensions:</span>{" "}
                <span>
                  {unit === 'in'
                    ? `${(store.L + 2 * store.T).toFixed(4)} × ${(store.W + 2 * store.T).toFixed(4)} × ${(store.H + 2 * store.T).toFixed(4)} in`
                    : `${((store.L + 2 * store.T) * 25.4).toFixed(2)} × ${((store.W + 2 * store.T) * 25.4).toFixed(2)} × ${((store.H + 2 * store.T) * 25.4).toFixed(2)} mm`
                  }
                </span>
              </div>
            </div>

            {/* 2D Vector CAD Canvas */}
            <div
              id="dieline-svg-wrapper"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center",
                transition: "transform 0.15s ease-out"
              }}
              className="w-full h-full flex items-center justify-center p-8"
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
          </main>

          {/* ========================================================================= */}
          {/* RIGHT FLOATING PANEL (3D Box Preview + File Formats + You Will Get)       */}
          {/* ========================================================================= */}
          <aside className="w-[300px] md:w-[320px] bg-[#fafafa] border-l border-zinc-200 p-4 overflow-y-auto flex flex-col gap-4 shrink-0 text-zinc-900 z-10">
            
            {/* CARD 1: 3D BOX PREVIEW */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900">3D box preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-md text-[11px] font-semibold text-zinc-700 transition-colors"
                  >
                    <Play className="w-3 h-3 text-blue-600 fill-blue-600" />
                    {isPlayingAnim ? "Pause" : "Play"}
                  </button>
                  <span className="text-[10px] font-bold bg-zinc-200 px-2 py-0.5 rounded text-zinc-700">3D</span>
                </div>
              </div>

              {/* 3D Viewer Canvas */}
              <div className="w-full h-56 rounded-xl bg-gradient-to-b from-zinc-100 to-zinc-200 border border-zinc-200 overflow-hidden relative">
                <StudioErrorBoundary>
                  <Box3DViewer
                    boxModelOverride={store.boxModel}
                    L={store.L}
                    W={store.W}
                    H={store.H}
                    T={store.T}
                    progress={foldProgress}
                    lightingPreset="studio"
                    activeAnimation="none"
                  />
                </StudioErrorBoundary>
              </div>


              {/* Open -- Fold Slider -- Close */}
              <div className="flex items-center gap-3 px-2 pt-1 text-xs font-medium text-zinc-500">
                <span>Open</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={foldProgress}
                  onChange={(e) => setFoldProgress(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                />
                <span>Close</span>
              </div>
            </div>

            {/* CARD 2: FILE FORMATS */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-zinc-900">File formats</h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportAI}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all text-xs font-semibold text-zinc-800 text-left"
                >
                  <span className="w-6 h-6 rounded bg-amber-500 text-zinc-900 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                    Ai
                  </span>
                  <span>AI dieline</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all text-xs font-semibold text-zinc-800 text-left"
                >
                  <span className="w-6 h-6 rounded bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                    PDF
                  </span>
                  <span>PDF dieline</span>
                </button>

                <button
                  onClick={handleExportDXF}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all text-xs font-semibold text-zinc-800 text-left"
                >
                  <span className="w-6 h-6 rounded bg-zinc-800 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                    DXF
                  </span>
                  <span>DXF dieline</span>
                </button>

                <button
                  onClick={handleExportSVG}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all text-xs font-semibold text-zinc-800 text-left"
                >
                  <span className="w-6 h-6 rounded bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                    3D
                  </span>
                  <span>3D mockup</span>
                </button>
              </div>
            </div>

            {/* CARD 3: YOU WILL GET INFO */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5 text-xs text-zinc-600">
              <h3 className="text-sm font-bold text-zinc-900 mb-1">You will get</h3>
              
              <ul className="space-y-2 list-disc list-inside text-[11px] leading-relaxed text-zinc-600">
                <li>All dieline files can be generated and downloaded within a few minutes.</li>
                <li>All dieline files are rigorously structurally inspected. Dimensions, thickness, and material descriptions are included. Ready for printing.</li>
                <li>All dieline files are without watermarks and can be locally edited using Adobe Illustrator.</li>
              </ul>
            </div>

            {/* CARD 4: MANUFACTURE & INNER CUT SIZE READOUTS */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white border border-zinc-200 p-2.5 rounded-xl">
                <span className="text-zinc-400 font-semibold block uppercase tracking-wider mb-0.5">Manufacture Cut Size</span>
                <span className="font-mono font-bold text-zinc-800 text-xs">
                  {unit === 'in'
                    ? `${(store.L * 1.0).toFixed(3)} × ${(store.W * 1.01).toFixed(3)} × ${(store.H * 1.31).toFixed(3)} in`
                    : `${(store.L * 25.4).toFixed(1)} × ${(store.W * 1.01 * 25.4).toFixed(1)} × ${(store.H * 1.31 * 25.4).toFixed(1)} mm`
                  }
                </span>
              </div>
              <div className="bg-white border border-zinc-200 p-2.5 rounded-xl">
                <span className="text-zinc-400 font-semibold block uppercase tracking-wider mb-0.5">Inner Cavity Size</span>
                <span className="font-mono font-bold text-zinc-800 text-xs">
                  {unit === 'in'
                    ? `${(store.L - 2*store.T).toFixed(3)} × ${(store.W - 2*store.T).toFixed(3)} × ${(store.H - 2*store.T).toFixed(3)} in`
                    : `${((store.L - 2*store.T) * 25.4).toFixed(1)} × ${((store.W - 2*store.T) * 25.4).toFixed(1)} × ${((store.H - 2*store.T) * 25.4).toFixed(1)} mm`
                  }
                </span>
              </div>
            </div>

          </aside>
        </div>

        </div>
        
        {/* Mockup Editor instance using dieline context */}
        {isEditorOpen && (
          <EditorModal 
            isOpen={isEditorOpen} 
            onClose={() => setIsEditorOpen(false)} 
            contextType="dieline" 
          />
        )}
      </StudioErrorBoundary>
    </div>,
    document.body
  );
};

export default BoxStudioModal;
