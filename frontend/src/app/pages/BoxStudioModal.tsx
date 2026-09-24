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
import { generateCosmeticBoxBDieline } from "../../lib/cosmeticBoxBDielineGenerator";
import { generateButtonHoleDieline } from "../../lib/buttonHoleDielineGenerator";
import { API_BASE_URL } from "../../config/api";
import { exportService } from "../../services/exportService";
import { setLargeData } from "../../lib/idbStorage";

interface BoxStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModel?: "rte" | "te" | "auto_lock" | "cosmetic" | "cosmetic_b" | "button_hole";
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

  // Zoom / Reset Canvas State (managed entirely by DielineSVG now)
  const canvasAreaRef = useRef<HTMLElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

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

  // Custom Zoom & Pan Logic
  // Handled entirely by DielineSVG to avoid CSS transform lag
  // -------------------------------------------------------------



  if (!isOpen) return null;

  const modelLabels: Record<string, string> = {
    te: "Straight Tuck End Box",
    rte: "Reverse Tuck End Box",
    auto_lock: "Auto Lock Bottom Box",
    cosmetic: "Cosmetic Box",
    cosmetic_b: "Cosmetic Box B (Mailer/Tray Style)",
    button_hole: "Button Hole Box"
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
      let dielineData;
      if (store.boxModel === "te") dielineData = generateTEDielineDXF(params);
      else if (store.boxModel === "auto_lock") dielineData = generateAutoLockDieline(params);
      else if (store.boxModel === "cosmetic") dielineData = generateCosmeticBoxDieline(params);
      else if (store.boxModel === "cosmetic_b") dielineData = generateCosmeticBoxBDieline(params);
      else if (store.boxModel === "button_hole") dielineData = generateButtonHoleDieline(params);
      else dielineData = generateRTEDielineDXF(params);
      
      const fileName = `${store.boxModel}_dieline.dxf`;
      exportDXF(dielineData, fileName);

      try {
        await exportService.logExport({
          format: 'DXF',
          resolution: 'CAD Vector',
          fileName
        });
      } catch (e) {}
    } catch (err) {
      console.error("DXF Export Error:", err);
    }
  };

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
      let dielineData;
      if (store.boxModel === "te") dielineData = generateTEDielineDXF(params);
      else if (store.boxModel === "auto_lock") dielineData = generateAutoLockDieline(params);
      else if (store.boxModel === "cosmetic") dielineData = generateCosmeticBoxDieline(params);
      else if (store.boxModel === "cosmetic_b") dielineData = generateCosmeticBoxBDieline(params);
      else if (store.boxModel === "button_hole") dielineData = generateButtonHoleDieline(params);
      else dielineData = generateRTEDielineDXF(params);
      
      const dxfString = generateDXFString(dielineData);
      
      try {
        sessionStorage.setItem("autoLoadDXF", dxfString);
        sessionStorage.setItem("autoLoadParams", JSON.stringify({
          L_mm: Math.round((store.L || 4.7244) * 25.4),
          W_mm: Math.round((store.W || 2.3622) * 25.4),
          H_mm: Math.round((store.H || 6.2992) * 25.4),
          boxModel: store.boxModel
        }));
      } catch (e) {
        console.warn("sessionStorage store error:", e);
      }

      try {
        localStorage.setItem("autoLoadDXF", dxfString);
        localStorage.setItem("autoLoadParams", JSON.stringify({
          L_mm: Math.round((store.L || 4.7244) * 25.4),
          W_mm: Math.round((store.W || 2.3622) * 25.4),
          H_mm: Math.round((store.H || 6.2992) * 25.4),
          boxModel: store.boxModel
        }));
      } catch (e) {}

      try {
        await setLargeData("autoLoadDXF", dxfString);
      } catch (e) {}
      
      sessionStorage.setItem('dieline_tool_referrer', window.location.href);
      window.location.href = '/dieline-tool.html';
    } catch (err) {
      console.error("Print Error:", err);
      alert("An error occurred while preparing the print layout. See console for details.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const svgElement = document.querySelector("#dieline-svg-wrapper svg") as SVGSVGElement | null;
      const fileName = `${store.boxModel}_dieline.pdf`;
      if (svgElement) {
        await exportPDF(svgElement, fileName, "CMYK");
        try {
          await exportService.logExport({
            format: 'PDF',
            resolution: 'Vector CMYK',
            fileName
          });
        } catch (e) {}
      } else {
        handleExportDXF();
      }
    } catch (err) {
      console.error("PDF Export Error:", err);
      handleExportDXF();
    }
  };

  const handleExportAI = async () => {
    try {
      const svgElement = document.querySelector("#dieline-svg-wrapper svg") as SVGSVGElement | null;
      const fileName = `${store.boxModel}_dieline.ai`;
      if (svgElement) {
        // AI can natively open SVG files and editing is perfectly preserved
        exportSVG(svgElement, fileName);
        try {
          await exportService.logExport({
            format: 'SVG',
            resolution: 'Adobe Vector',
            fileName
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error("AI Export Error:", err);
    }
  };

  const handleExportSVG = async () => {
    try {
      const svgElement = document.querySelector("#dieline-svg-wrapper svg") as SVGSVGElement | null;
      const fileName = `${store.boxModel}_dieline.svg`;
      if (svgElement) {
        exportSVG(svgElement, fileName);
        try {
          await exportService.logExport({
            format: 'SVG',
            resolution: 'Scalable Vector',
            fileName
          });
        } catch (e) {}
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onClose()}
              className="flex items-center gap-1.5 px-2 py-1.5 -ml-2 rounded-lg hover:bg-zinc-100 text-zinc-900 transition-colors cursor-pointer group"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:text-zinc-900 transition-colors" />
              <span className="font-bold text-[14px] text-zinc-700 group-hover:text-zinc-900">Back</span>
            </button>

            <div className="h-4 w-px bg-zinc-300"></div>

            <span className="font-bold text-[14px] text-zinc-900">{currentTitle}</span>

            <div className="relative ml-2">
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
              className="px-4 py-2 rounded-lg text-[13px] font-bold text-white transition-all shadow-sm cursor-pointer hover:bg-opacity-90 flex items-center gap-1.5"
              style={{ backgroundColor: isSaved ? '#047857' : '#00c48c' }}
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
              className="px-4 py-2 rounded-lg text-[13px] font-bold text-white transition-all shadow-sm cursor-pointer hover:bg-opacity-90 flex items-center gap-1.5"
              style={{ backgroundColor: '#2563eb' }}
            >
              <Printer className="w-4 h-4 text-white" />
              Print
            </button>

          </div>
        </header>

        {/* MAIN FLOATING STUDIO EDITOR */}
        <div className="flex-1 overflow-hidden relative w-full bg-[#d1d5db]">
          
          {/* FULL SCREEN CANVAS */}
          <main
            id="dieline-canvas-area"
            ref={canvasAreaRef}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <div id="dieline-svg-wrapper" className="absolute inset-0 flex items-center justify-center">
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

          {/* FLOATING TOP READOUTS */}
          <div className="absolute top-6 left-[450px] right-[400px] pointer-events-none flex items-start justify-between z-10">
            <div className="flex flex-col gap-4 pointer-events-auto">
              {/* Top Legend Bar */}
              <div className="flex items-center gap-6 text-xs text-zinc-600 font-semibold bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-white/50">
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

              {/* Manufacture & Inner/Outer Dimensions Readout Overlay */}
              <div className="text-xs text-zinc-600 space-y-1 font-mono bg-white/80 backdrop-blur-md px-4 py-3 rounded-xl shadow-sm border border-white/50">
                <div>
                  <span className="text-blue-600 font-semibold">Manufacture dimensions:</span>{" "}
                  <span className="font-bold text-zinc-800">{displayL} × {displayW} × {displayH} {unit}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Inner dimensions:</span>{" "}
                  <span>
                    {unit === 'in' 
                      ? `${(store.L - 2 * store.T).toFixed(4)} × ${(store.W - 2 * store.T).toFixed(4)} × ${(store.H - 2 * store.T).toFixed(4)} in`
                      : `${((store.L - 2 * store.T) * 25.4).toFixed(2)} × ${((store.W - 2 * store.T) * 25.4).toFixed(2)} × ${((store.H - 2 * store.T) * 25.4).toFixed(2)} mm`
                    }
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Outer dimensions:</span>{" "}
                  <span>
                    {unit === 'in'
                      ? `${(store.L + 2 * store.T).toFixed(4)} × ${(store.W + 2 * store.T).toFixed(4)} × ${(store.H + 2 * store.T).toFixed(4)} in`
                      : `${((store.L + 2 * store.T) * 25.4).toFixed(2)} × ${((store.W + 2 * store.T) * 25.4).toFixed(2)} × ${((store.H + 2 * store.T) * 25.4).toFixed(2)} mm`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Reset View Button Top Right */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('reset-dieline-view'))}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset View
            </button>
          </div>

          {/* FLOATING LEFT UI WRAPPER */}
          <div className="absolute left-6 top-6 bottom-6 z-10 flex gap-4 pointer-events-none">
            
            {/* Nav Strip */}
            <div className="pointer-events-auto flex flex-col gap-3">
              <div className="bg-white rounded-[32px] px-2 py-3 flex flex-col items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                {[
                  { id: 'Edit', icon: <Palette className="w-5 h-5" /> }
                ].map((item, i) => {
                  const isActive = true; // Hardcoded active for now
                  return (
                    <div 
                      key={i} 
                      className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-zinc-500 hover:bg-zinc-50'}`}
                      title={item.id}
                    >
                      {item.icon}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Configuration Panel */}
            <div className="pointer-events-auto w-[320px] bg-white rounded-3xl p-6 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-y-auto scrollbar-hide">
              
              {/* Custom Size Header & Unit Switcher */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-bold text-zinc-900">Custom size</h3>
                  <div className="flex bg-zinc-100 rounded-full border border-zinc-200 text-[12px] font-semibold overflow-hidden p-[2px]">
                    <button
                      onClick={() => { setUnit("mm"); store.setUnit("mm"); }}
                      className={`px-3 py-1 rounded-full transition-colors ${unit === "mm" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                      mm
                    </button>
                    <button
                      onClick={() => { setUnit("in"); store.setUnit("in"); }}
                      className={`px-3 py-1 rounded-full transition-colors ${unit === "in" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                      in
                    </button>
                  </div>
                </div>

                {/* Length & Width Input Row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[12px] text-zinc-500 block mb-1.5 font-medium">Length</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={inputL}
                        onChange={(e) => handleLChange(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[13px] text-zinc-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors pr-8"
                      />
                      <span className="absolute right-3 top-2 text-[12px] text-zinc-400 font-mono">{unit}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] text-zinc-500 block mb-1.5 font-medium">Width</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={inputW}
                        onChange={(e) => handleWChange(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[13px] text-zinc-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors pr-8"
                      />
                      <span className="absolute right-3 top-2 text-[12px] text-zinc-400 font-mono">{unit}</span>
                    </div>
                  </div>
                </div>

                {/* Height Input Row */}
                <div>
                  <label className="text-[12px] text-zinc-500 block mb-1.5 font-medium">Height</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={inputH}
                      onChange={(e) => handleHChange(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[13px] text-zinc-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors pr-8"
                    />
                    <span className="absolute right-3 top-2 text-[12px] text-zinc-400 font-mono">{unit}</span>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-zinc-100 my-5"></div>

              {/* Material Dropdown Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-zinc-900">Material</h3>
                </div>
                <MaterialDropdown />
              </div>

              <div className="h-px w-full bg-zinc-100 my-5"></div>

              {/* Size Mode Radio Buttons */}
              <div>
                <h3 className="text-[14px] font-bold text-zinc-900 mb-3">Size mode</h3>
                <div className="space-y-1.5 p-1.5 rounded-2xl border border-zinc-200/60 bg-zinc-50/50">
                  <button
                    onClick={() => store.setSizeMode("manufacture")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] transition-colors ${
                      store.sizeMode === "manufacture" ? "bg-white text-blue-600 font-semibold shadow-sm" : "text-zinc-600 hover:bg-zinc-100/50"
                    }`}
                  >
                    Manufacture dimensions
                  </button>
                  <button
                    onClick={() => store.setSizeMode("inner")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] transition-colors ${
                      store.sizeMode === "inner" ? "bg-white text-blue-600 font-semibold shadow-sm" : "text-zinc-600 hover:bg-zinc-100/50"
                    }`}
                  >
                    Inner dimensions
                  </button>
                  <button
                    onClick={() => store.setSizeMode("outer")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] transition-colors ${
                      store.sizeMode === "outer" ? "bg-white text-blue-600 font-semibold shadow-sm" : "text-zinc-600 hover:bg-zinc-100/50"
                    }`}
                  >
                    Outer dimensions
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-zinc-100 my-5"></div>

              {/* Display Options Toggles */}
              <div className="space-y-3.5">
                <h3 className="text-[14px] font-bold text-zinc-900 mb-2">Display options</h3>

                <div className="flex items-center justify-between text-[13px] text-zinc-600">
                  <span>Overall dimensions</span>
                  <input
                    type="checkbox"
                    checked={store.showOverallDims}
                    onChange={() => store.toggleView("showOverallDims")}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-[13px] text-zinc-600">
                  <span>Basic dimensions</span>
                  <input
                    type="checkbox"
                    checked={store.showBasicDims}
                    onChange={() => store.toggleView("showBasicDims")}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-[13px] text-zinc-600">
                  <span>Bleed contours</span>
                  <input
                    type="checkbox"
                    checked={store.showBleedLine}
                    onChange={() => store.toggleView("showBleedLine")}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-[13px] text-zinc-600">
                  <span>Annotations</span>
                  <input
                    type="checkbox"
                    checked={store.showAnnotations}
                    onChange={() => store.toggleView("showAnnotations")}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex-1 min-h-[20px]"></div>

              {/* Customise Button */}
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Edit Package Artwork
                </button>
              </div>

            </div>
          </div>

          {/* FLOATING RIGHT UI WRAPPER */}
          <div className="absolute right-6 top-6 bottom-6 z-10 w-[340px] pointer-events-none flex flex-col gap-4 overflow-y-auto pb-6 scrollbar-hide">
            
            {/* CARD 1: 3D BOX PREVIEW */}
            <div className="pointer-events-auto bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-zinc-900">3D Preview</h3>
                <div className="flex items-center gap-1.5 bg-zinc-100 p-0.5 rounded-md">
                  <button
                    onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${isPlayingAnim ? 'bg-white shadow-sm text-blue-600' : 'text-zinc-600 hover:text-zinc-800'}`}
                  >
                    <Play className={`w-3 h-3 ${isPlayingAnim ? 'fill-blue-600' : ''}`} />
                    Play
                  </button>
                  <button className="px-2.5 py-1 rounded text-[11px] font-semibold text-zinc-600 hover:text-zinc-800 transition-colors">
                    3D
                  </button>
                </div>
              </div>

              {/* 3D Viewer Canvas */}
              <div className="w-full h-48 rounded-2xl bg-zinc-100 overflow-hidden relative shadow-inner">
                <StudioErrorBoundary>
                  <Box3DViewer
                    boxModelOverride={store.boxModel}
                    overrideLayout="single"
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
              <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-zinc-500">
                <span>Open</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={foldProgress}
                  onChange={(e) => setFoldProgress(parseFloat(e.target.value))}
                  className="w-full slick-slider"
                />
                <span>Close</span>
              </div>
            </div>

            {/* CARD 2: FILE FORMATS */}
            <div className="pointer-events-auto bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col gap-4">
              <h3 className="text-[14px] font-bold text-zinc-900">Download formats</h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportAI}
                  className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 transition-all text-[12px] font-semibold text-zinc-800 text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#ff9a00] text-black font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                    Ai
                  </span>
                  <span>Ai dieline</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 transition-all text-[12px] font-semibold text-zinc-800 text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#ff0000] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                    PDF
                  </span>
                  <span>PDF dieline</span>
                </button>

                <button
                  onClick={handleExportDXF}
                  className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 transition-all text-[12px] font-semibold text-zinc-800 text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#333333] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                    DXF
                  </span>
                  <span>DXF dieline</span>
                </button>

                <button
                  onClick={handleExportSVG}
                  className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 transition-all text-[12px] font-semibold text-zinc-800 text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                    3D
                  </span>
                  <span>3D mockup</span>
                </button>
              </div>
            </div>

            {/* CARD 3: MANUFACTURE & INNER CUT SIZE READOUTS */}
            <div className="pointer-events-auto grid grid-cols-2 gap-3 mt-auto">
              <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col gap-1.5">
                <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-wider">Manufacture Cut Size</span>
                <span className="font-mono font-bold text-zinc-900 text-[12px]">
                  {unit === 'in'
                    ? `${(store.L * 1.0).toFixed(3)} × ${(store.W * 1.01).toFixed(3)} × ${(store.H * 1.31).toFixed(3)} in`
                    : `${(store.L * 25.4).toFixed(1)} × ${(store.W * 1.01 * 25.4).toFixed(1)} × ${(store.H * 1.31 * 25.4).toFixed(1)} mm`
                  }
                </span>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col gap-1.5">
                <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-wider">Inner Cavity Size</span>
                <span className="font-mono font-bold text-zinc-900 text-[12px]">
                  {unit === 'in'
                    ? `${(store.L - 2*store.T).toFixed(3)} × ${(store.W - 2*store.T).toFixed(3)} × ${(store.H - 2*store.T).toFixed(3)} in`
                    : `${((store.L - 2*store.T) * 25.4).toFixed(1)} × ${((store.W - 2*store.T) * 25.4).toFixed(1)} × ${((store.H - 2*store.T) * 25.4).toFixed(1)} mm`
                  }
                </span>
              </div>
            </div>

          </div>
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
