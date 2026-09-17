import React, { useState } from "react";
import Box3DViewer from "../../components/Box3DViewer";
import { useBoxStore } from "../../lib/useBoxStore";
import BoxStudioModal from "./BoxStudioModal";
import EditorModal from "./EditorModal";
import MockupSignInModal from "../components/modals/MockupSignInModal";
import { API_BASE_URL } from "../../config/api";
import { generateRTEDielineDXF } from "../../lib/rteDielineGenerator";
import { generateTEDielineDXF } from "../../lib/teDielineGenerator";
import { generateAutoLockDieline } from "../../lib/autoLockDielineGenerator";
import { generateCosmeticBoxDieline } from "../../lib/cosmeticBoxDielineGenerator";
import { generateCosmeticBoxBDieline } from "../../lib/cosmeticBoxBDielineGenerator";
import { generateDXFString } from "../../lib/exportUtils";
import { Printer, Sparkles } from "lucide-react";
import AiPackagingAssistant from "../components/AiPackagingAssistant";
import { setLargeData } from "../../lib/idbStorage";

const themes: Record<string, any> = {
  dark: {
    bgApp: "#18181b",
    bgCanvas: "#09090b",
    bgPanel: "#18181b",
    border: "rgba(255, 255, 255, 0.1)",
    textMain: "#ffffff",
    textMuted: "#a1a1aa",
    cyan: "#3b82f6", // blue-500
    inputBg: "#27272a",
    gridColor: "rgba(255, 255, 255, 0.05)",
    activeBg: "rgba(59, 130, 246, 0.12)"
  },
  light: {
    bgApp: "#f4f4f5", // zinc-100
    bgCanvas: "#fafafa", // zinc-50
    bgPanel: "#ffffff",
    border: "rgba(0, 0, 0, 0.1)",
    textMain: "#18181b", // zinc-900
    textMuted: "#71717a", // zinc-500
    cyan: "#2563eb", // blue-600
    inputBg: "#ffffff",
    gridColor: "rgba(37, 99, 235, 0.08)",
    activeBg: "rgba(37, 99, 235, 0.12)"
  }
};

const IconNav = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>;
const IconCloud = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.89-1.78-3.5-3.5-3.5a5.5 5.5 0 0 0-5.38 4.41c-2 .19-3.62 1.63-3.62 3.59A3.5 3.5 0 0 0 7 19Z" /></svg>;

// New pacdora-style sidebar icons
const IconEdit = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconModels = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconLayout2 = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconImage = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconVideo = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
const IconMore = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
const IconUploadLarge = () => <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconSparkles = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4M3 5h4"/></svg>;

export default function WorkshopPage({ onBack }: { onBack?: () => void } = {}) {
  const store = useBoxStore((state: any) => state);
  const [foldProgress, setFoldProgress] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playDirection, setPlayDirection] = useState(-1);
  const [activeSidebarTab, setActiveSidebarTab] = useState("Edit");
  const [activeAnimation, setActiveAnimation] = useState("none");
  const [contextMenu, setContextMenu] = useState<any>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const executeNavigation = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const handleSaveAndExit = async () => {
    setIsSavingAndExiting(true);
    try {
      await handleSaveToWorkspace();
    } catch (err) {
      console.error("Error saving workspace:", err);
    }
    setIsSavingAndExiting(false);
    setShowExitConfirm(false);
    executeNavigation();
  };

  const handleDiscardAndExit = () => {
    setShowExitConfirm(false);
    executeNavigation();
  };

  const handleSaveToWorkspace = async () => {
    const currentModel = store.boxModel || 'rte';
    const categoryName = 
      currentModel === 'rte' ? 'Reverse Tuck End Box' :
      currentModel === 'te' ? 'Straight Tuck End Box' :
      currentModel === 'auto_lock' ? 'Auto Lock Bottom Box' :
      currentModel === 'cosmetic_b' ? 'Cosmetic Box B (Mailer/Tray Style)' :
      currentModel === 'cosmetic' ? 'Cosmetic Box' : 'Custom Packaging Box';

    const dimL_mm = Math.round((store.L || 4.72) * 25.4);
    const dimW_mm = Math.round((store.W || 2.36) * 25.4);
    const dimH_mm = Math.round((store.H || 6.29) * 25.4);

    const isExistingProject = !!store.activeProjectId;
    const targetId = store.activeProjectId || ('saved-' + Date.now());
    const targetName = store.activeProjectName || `${categoryName} (${dimL_mm}×${dimW_mm}×${dimH_mm}mm)`;

    const savedItem = {
      id: targetId,
      _id: targetId,
      name: targetName,
      type: "DIELINE",
      category: categoryName,
      boxModel: currentModel,
      variantId: currentModel === "rte" ? 2 : 1,
      dimensions: { L: dimL_mm, W: dimW_mm, H: dimH_mm, length: store.L, width: store.W, height: store.H, glueTab: 15, tuck: 18, flapH: 35 },
      packageColor: store.packageColor || null,
      insideColor: store.insideColor || null,
      decals: store.decalsByModel ? store.decalsByModel[currentModel] || [] : [],
      tabCategory: "projects",
      isDraft: false,
      updatedAt: new Date().toISOString()
    };

    // Save to LocalStorage immediately in-place (updating existing item if matching ID found)
    try {
      const stored = localStorage.getItem('kld_workspace_items');
      const existing = stored ? JSON.parse(stored) : [];
      let updatedList: any[] = [];
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
      console.log('Error saving local workspace item:', err);
    }

    // Save to API backend if authenticated
    try {
      const token = localStorage.getItem('token');
      if (token) {
        if (isExistingProject && targetId.length === 24) {
          // Update existing saved mockup project in MongoDB
          await fetch(`${API_BASE_URL}/mockups/saved/${targetId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: targetName,
              dimensions: savedItem.dimensions,
              packageColor: savedItem.packageColor,
              insideColor: savedItem.insideColor,
              decals: savedItem.decals
            })
          });
        } else {
          // Create new saved mockup project in MongoDB
          const res = await fetch(`${API_BASE_URL}/mockups/saved`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(savedItem)
          });
          const data = await res.json();
          if (res.ok && data.success && data.data?.design?._id) {
            const mongoId = data.data.design._id;
            savedItem.id = mongoId;
            savedItem._id = mongoId;
            if (store.setActiveProject) {
              store.setActiveProject(mongoId, targetName);
            }
            const stored = localStorage.getItem('kld_workspace_items');
            if (stored) {
              const existing = JSON.parse(stored);
              if (Array.isArray(existing)) {
                const updatedList = existing.map((i: any) => (i.id === targetId || i._id === targetId) ? savedItem : i);
                localStorage.setItem('kld_workspace_items', JSON.stringify(updatedList));
              }
            }
          }
        }
      }
    } catch (err) {
      console.log('Backend save error:', err);
    }

    // Set activeProjectId for any subsequent saves in this session
    if (store.setActiveProject) {
      store.setActiveProject(savedItem.id, targetName);
    }

    window.dispatchEvent(new CustomEvent('project-saved', { detail: savedItem }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
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
  
  const themeKey = store.theme || 'light';
  const t = themes[themeKey] || themes.light;

  React.useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    
    if (isPlaying) {
      const animate = (currentTime: number) => {
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        setFoldProgress((prev: number) => {
          let next = prev + delta * playDirection * 0.4;
          if (next >= 1) {
            next = 1;
            setPlayDirection(-1);
          } else if (next <= 0) {
            next = 0;
            setPlayDirection(1);
          }
          return next;
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, playDirection]);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        body, html, #root { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; }
        * { box-sizing: border-box; }
      `}} />

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", backgroundColor: t.bgCanvas, color: t.textMain, fontFamily: "'Inter', sans-serif" }}>
        {/* --- TOP NAV --- */}
        <div style={{ height: "64px", background: t.bgPanel, borderBottom: `2px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div 
              style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} 
              onClick={() => {
                if (store.activeProjectId) {
                  executeNavigation();
                } else {
                  setShowExitConfirm(true);
                }
              }}
              title="Return to Home"
            >
              {/* Circle K Logo */}
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#000000", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px", letterSpacing: "-0.5px" }}>
                K
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "15px", fontWeight: "700", color: t.textMain, lineHeight: "1.2" }}>Keyline Design</span>
                <span style={{ fontSize: "11px", fontWeight: "500", color: t.textMuted }}>Mockup Generator</span>
              </div>
            </div>

            {/* Editing Project Name Badge (Restored functionality) */}
            {store.activeProjectId && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: store.theme === 'dark' ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '800',
                marginLeft: '4px'
              }}>
                <span>✏️ Editing:</span>
                <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {store.activeProjectName || 'Existing Project'}
                </span>
              </div>
            )}
            
            <button style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: "4px" }} title="Menu"><IconNav /></button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: "4px" }} title="Cloud Storage"><IconCloud /></button>

            <div style={{ width: "1px", height: "24px", backgroundColor: t.border, margin: "0 4px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "4px" }} title="Undo">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" /></svg>
                <span style={{ fontSize: "9px", fontWeight: "500" }}>Undo</span>
              </button>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, opacity: 0.4, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "4px" }} title="Redo">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" /></svg>
                <span style={{ fontSize: "9px", fontWeight: "500" }}>Redo</span>
              </button>
            </div>
          </div>



          {/* Right: Credits, Actions & Export */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", marginRight: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: "12px", fontWeight: "500" }}>All changes saved</span>
            </div>

            <button 
              onClick={handlePrint}
              title="Open in Print & Dieline Imposition Studio"
              style={{ 
                background: "#2563eb", 
                color: "#ffffff", 
                border: "none", 
                padding: "8px 16px", 
                borderRadius: "10px", 
                fontSize: "13px", 
                fontWeight: "700", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: `0 4px 14px rgba(37, 99, 235, 0.35)`,
                transition: "all 0.2s ease"
              }}
            >
              <Printer style={{ width: "15px", height: "15px" }} />
              <span>Print</span>
            </button>

            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              title="Open Pacdora AI Packaging Assistant"
              style={{
                background: isAiOpen ? "linear-gradient(135deg, #2563eb, #7c3aed)" : t.inputBg,
                color: isAiOpen ? "#ffffff" : t.textMain,
                border: `1.5px solid ${isAiOpen ? '#7c3aed' : t.border}`,
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: isAiOpen ? "0 4px 14px rgba(124, 58, 237, 0.35)" : "2px 3px 0px rgba(58,46,38,0.05)",
                transition: "all 0.2s ease"
              }}
            >
              <Sparkles style={{ width: "15px", height: "15px", color: isAiOpen ? "#ffffff" : "#2563eb" }} />
              <span>AI Assistant</span>
            </button>

              <button 
                onClick={handleSaveToWorkspace}
                style={{ background: t.inputBg, border: `1px solid ${t.border}`, color: t.textMain, padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: `0 1px 2px rgba(0,0,0,0.05)` }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save
              </button>
            <button onClick={() => store.toggleTheme && store.toggleTheme()} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: "6px" }} title="Toggle Theme">
              {store.theme === 'dark' ?
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" /></svg> :
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              }
            </button>
            <button style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", color: '#fff', border: "none", padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: `0 2px 8px rgba(79, 70, 229, 0.3)` }}>
              Super export
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", background: "#d1d5db" }}>

          {/* FLOATING SIDEBAR WRAPPER */}
          <div style={{ position: "absolute", left: "24px", top: "24px", bottom: "24px", zIndex: 10, display: "flex", gap: "16px", pointerEvents: "none" }}>
            
            {/* Nav Strip */}
            <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "#ffffff", borderRadius: "32px", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                {[
                  { id: 'Edit', icon: <IconEdit /> },
                  { id: 'Models', icon: <IconModels /> },
                  { id: 'Layout', icon: <IconLayout2 /> },
                  { id: 'AI Background', icon: <IconImage /> },
                  { id: 'Video', icon: <IconVideo /> },
                  { id: 'More', icon: <IconMore /> }
                ].map((item, i) => {
                  const isActive = activeSidebarTab === item.id;
                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        setActiveSidebarTab(item.id);
                        if (item.id !== 'Video') {
                          setIsPlaying(false);
                          setFoldProgress(1);
                        }
                      }} 
                      style={{ 
                        width: "48px", 
                        height: "48px", 
                        borderRadius: "50%", 
                        background: isActive ? "#eff6ff" : "transparent", 
                        color: isActive ? "#2563eb" : "#6b7280",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      title={item.id}
                    >
                      {item.icon}
                    </div>
                  );
                })}
              </div>
              <div 
                style={{ background: "#ffffff", borderRadius: "32px", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", cursor: "pointer", color: "#2563eb", transition: "all 0.2s ease" }}
                onClick={() => setIsAiOpen(!isAiOpen)}
                title="AI Design"
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconSparkles />
                </div>
              </div>
            </div>

            {/* Main Panel */}
            {(activeSidebarTab === "Edit" || activeSidebarTab === "Layout" || activeSidebarTab === "Video") && (
              <div style={{ pointerEvents: "auto", width: "320px", background: "#ffffff", borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflowY: "auto" }}>
                
                {activeSidebarTab === "Edit" && (
                  <>
                    {/* Upload Section */}
                    <div style={{ marginBottom: "24px" }}>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827", marginBottom: "16px" }}>Upload images</div>
                      <div 
                        style={{ border: "2px dashed #93c5fd", borderRadius: "16px", padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", background: "#eff6ff", cursor: "pointer" }}
                        onClick={() => {
                          if (!isLoggedIn) {
                            setIsSignInModalOpen(true);
                          } else {
                            setIsStudioOpen(true);
                          }
                        }}
                      >
                        <div style={{ color: "#3b82f6" }}><IconUploadLarge /></div>
                        <button style={{ background: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "24px", padding: "10px 32px", fontSize: "15px", fontWeight: "600", cursor: "pointer", width: "100%" }}>
                          Upload
                        </button>
                      </div>
                      <div style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                        Download dieline(AI, PDF)
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>

                    <div style={{ width: "100%", height: "1px", background: "#e5e7eb", marginBottom: "24px" }} />

                    {/* Configuration Cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      
                      {/* Custom Material */}
                      <div style={{ background: "#f9fafb", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>Custom material</span>
                          <span style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                            {store.materialType || "Corrugated board"}
                          </span>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>

                      {/* Custom Size */}
                      <div 
                        style={{ background: "#f9fafb", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                        onClick={(e) => {
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({
                            x: rect.right + 12,
                            y: rect.top,
                            view: 'customSize'
                          });
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>Custom size</span>
                          <span style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                            {(store.L * 25.4 / 25.4).toFixed(4)} x {(store.W * 25.4 / 25.4).toFixed(4)} x {(store.H * 25.4 / 25.4).toFixed(4)} in
                          </span>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>

                      {/* Find Similar */}
                      <div style={{ background: "#f9fafb", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                        <span style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>Find similar with AI</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>

                    <div style={{ flex: 1 }} />

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#9ca3af", marginTop: "24px" }}>
                      <span style={{ fontSize: "13px" }}>Model ID: {store.boxModel === "rte" ? "150010" : "150020"}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </div>
                  </>
                )}

                {activeSidebarTab === "Layout" && (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827", marginBottom: "20px" }}>Scene Layout</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {[
                        { id: 'single', label: 'Single', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'single' ? "#3b82f6" : "#9ca3af"}><polygon points="12,8 4,12 12,16 20,12" /></svg> },
                        { id: 'stacked2', label: 'Stacked (2)', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'stacked2' ? "#3b82f6" : "#9ca3af"}><polygon points="12,4 4,8 12,12 20,8" opacity="0.6" /><polygon points="12,12 4,16 12,20 20,16" /></svg> },
                        { id: 'stacked3', label: 'Stacked (3)', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'stacked3' ? "#3b82f6" : "#9ca3af"}><polygon points="12,2 5,5 12,8 19,5" opacity="0.4" /><polygon points="12,9 5,12 12,15 19,12" opacity="0.7" /><polygon points="12,16 5,19 12,22 19,19" /></svg> },
                        { id: 'sidebyside', label: 'Side by Side', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'sidebyside' ? "#3b82f6" : "#9ca3af"}><polygon points="8,10 2,13 8,16 14,13" /><polygon points="16,10 10,13 16,16 22,13" opacity="0.7" /></svg> },
                        { id: 'offset', label: 'Offset', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'offset' ? "#3b82f6" : "#9ca3af"}><polygon points="12,6 5,10 12,14 19,10" opacity="0.6" /><polygon points="16,13 9,17 16,21 23,17" /></svg> },
                        { id: 'cascade', label: 'Cascade', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'cascade' ? "#3b82f6" : "#9ca3af"}><polygon points="7,4 1,7 7,10 13,7" opacity="0.4" /><polygon points="12,9 6,12 12,15 18,12" opacity="0.7" /><polygon points="17,14 11,17 17,20 23,17" /></svg> },
                      ].map(l => (
                        <div key={l.id} onClick={() => store.setSceneLayout && store.setSceneLayout(l.id)} style={{ cursor: "pointer", background: store.sceneLayout === l.id ? "#eff6ff" : "#f9fafb", border: store.sceneLayout === l.id ? `2px solid #93c5fd` : `2px solid transparent`, borderRadius: "16px", padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", transition: "all 0.2s" }}>
                          {l.icon}
                          <div style={{ fontSize: "12px", fontWeight: "600", color: store.sceneLayout === l.id ? "#2563eb" : "#4b5563", textAlign: "center" }}>{l.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSidebarTab === "Video" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>Video Animations</div>
                    <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "12px", overflow: "hidden", padding: "4px" }}>
                      <div style={{ flex: 1, textAlign: "center", padding: "8px", fontSize: "13px", fontWeight: "600", borderRadius: "8px", background: "#ffffff", color: "#111827", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>Animation</div>
                      <div style={{ flex: 1, textAlign: "center", padding: "8px", fontSize: "13px", fontWeight: "600", color: "#6b7280", cursor: "pointer" }}>AI Video</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "8px", paddingBottom: "24px" }}>
                      {[
                        { id: 'folder', label: 'Folder', src: '/videos/folding.mp4', time: '5s' },
                        { id: 'rotation', label: 'Rotation', src: '/videos/rotate.mp4', time: '4s' },
                        { id: 'drop', label: 'Drop', src: '/videos/drop.mp4', time: '3s' },
                        { id: 'scale', label: 'Scale', src: '/videos/emphasis.mp4', time: '4s' },
                        { id: 'emphasis', label: 'Emphasis', src: '/videos/emphasis.mp4', time: '4s' }
                      ].map(vid => (
                        <div key={vid.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>{vid.label}</div>
                          
                          <div 
                            style={{ position: "relative", width: "100%", height: "200px", borderRadius: "16px", background: "#f9fafb", border: activeAnimation === vid.id ? `2px solid #93c5fd` : `2px solid transparent`, overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
                            onClick={() => {
                              setActiveAnimation(vid.id);
                              if (vid.id === 'folder') {
                                setIsPlaying(true);
                              } else {
                                setIsPlaying(false);
                                setFoldProgress(1);
                              }
                            }}
                            onMouseEnter={(e) => {
                              const v = e.currentTarget.querySelector('video');
                              const overlay = e.currentTarget.querySelector('.vid-overlay') as HTMLElement;
                              if (v) v.play().catch(e => console.log(e));
                              if (overlay) overlay.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              const v = e.currentTarget.querySelector('video');
                              const overlay = e.currentTarget.querySelector('.vid-overlay') as HTMLElement;
                              if (v) { v.pause(); v.currentTime = 0; }
                              if (overlay) overlay.style.opacity = '0';
                            }}
                          >
                            <video 
                              src={vid.src} 
                              loop 
                              muted 
                              playsInline 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <div style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "11px", fontWeight: "600", padding: "4px 8px", borderRadius: "6px" }}>{vid.time}</div>
                            
                            <div className="vid-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}>
                              <span style={{ color: "#fff", fontWeight: "600", fontSize: "18px", letterSpacing: "0.5px", textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>Preview</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- MAIN CANVAS --- */}
          <div 
            style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}
            onContextMenu={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              setContextMenu({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                view: 'main'
              });
            }}
            onPointerDown={() => {
              if (contextMenu) setContextMenu(null);
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, backgroundImage: `radial-gradient(${t.gridColor} 1.5px, transparent 1.5px)`, backgroundSize: "32px 32px", backgroundPosition: "center" }} />

            <div style={{ flex: 1, zIndex: 2 }}>
              <Box3DViewer
                L={store.L} W={store.W} H={store.H} T={store.T}
                progress={foldProgress}
                zoom={zoomLevel}
                materialPreset={(store.materialType || "").toLowerCase().includes("corrugated") ? "corrugated-kraft" : (store.materialType || "").toLowerCase().includes("kraft") ? "natural-kraft" : "white-kraft"}
                lightingPreset="studio"
                decals={store.decalsByModel ? store.decalsByModel[store.boxModel] || [] : []}
                overrideLayout={activeSidebarTab === "Layout" ? null : "single"}
                activeAnimation={activeAnimation}
                showWatermark={!isLoggedIn}
              />
            </div>

            {contextMenu && (
              <div 
                onPointerDown={(e) => e.stopPropagation()}
                style={{ 
                  position: "absolute", 
                  top: contextMenu.y, 
                  left: contextMenu.x, 
                  background: "#ffffff", 
                  borderRadius: "16px", 
                  boxShadow: "0px 10px 30px rgba(0,0,0,0.1)", 
                  padding: "8px", 
                  zIndex: 100, 
                  width: "280px",
                  color: "#333",
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                {contextMenu.view === 'main' ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <button 
                      onClick={() => { 
                        setContextMenu(null); 
                        if (!isLoggedIn) {
                          setIsSignInModalOpen(true);
                        } else {
                          setIsStudioOpen(true); 
                        }
                      }} 
                      style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", padding: "12px", cursor: "pointer", fontSize: "15px", fontWeight: "400", borderRadius: "10px", color: "#333", textAlign: "left", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload your images
                    </button>
                    <button 
                      onClick={() => setContextMenu({ ...contextMenu, view: 'customSize' })} 
                      style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", padding: "12px", cursor: "pointer", fontSize: "15px", fontWeight: "400", borderRadius: "10px", color: "#333", textAlign: "left", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Custom size
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "400", fontSize: "17px" }}>Custom size</span>
                      <div style={{ display: "flex", background: "#f5f5f5", borderRadius: "20px", padding: "2px", border: "1px solid #e5e5e5" }}>
                        <button style={{ border: "none", background: "transparent", padding: "4px 12px", borderRadius: "16px", fontSize: "14px", color: "#666" }}>mm</button>
                        <button style={{ border: "1px solid #d48c70", background: "#ffffff", padding: "4px 12px", borderRadius: "16px", fontSize: "14px", color: "#d48c70", fontWeight: "500", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>in</button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "13px", color: "#666" }}>Length</label>
                        <input type="number" step="0.01" defaultValue={store.L} id="ctxL" style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "15px", background: "#e5e7eb" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "13px", color: "#666" }}>Width</label>
                        <input type="number" step="0.01" defaultValue={store.W} id="ctxW" style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "15px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "13px", color: "#666" }}>Height</label>
                        <input type="number" step="0.01" defaultValue={store.H} id="ctxH" style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "15px" }} />
                      </div>
                    </div>
                    <button onClick={() => {
                      const newL = parseFloat((document.getElementById('ctxL') as HTMLInputElement).value);
                      const newW = parseFloat((document.getElementById('ctxW') as HTMLInputElement).value);
                      const newH = parseFloat((document.getElementById('ctxH') as HTMLInputElement).value);
                      if (newL > 0 && store.setDim) store.setDim('L', newL);
                      if (newW > 0 && store.setDim) store.setDim('W', newW);
                      if (newH > 0 && store.setDim) store.setDim('H', newH);
                      setContextMenu(null);
                    }} style={{ width: "100%", padding: "12px", background: t.cyan, color: "white", border: "none", borderRadius: "10px", fontWeight: "600", fontSize: "16px", cursor: "pointer", marginTop: "4px" }}>
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- RIGHT FLOATING TOOLBAR --- */}
            <div style={{ position: "absolute", right: "24px", top: "24px", zIndex: 10, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "#ffffff", border: `1px solid rgba(0,0,0,0.1)`, borderRadius: "16px", padding: "6px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", boxShadow: `0 4px 16px rgba(0,0,0,0.06)` }}>
                <button title="Select Tool" style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ede9fe", color: "#4f46e5", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s ease" }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
                </button>
                <button title="Pan Canvas" style={{ width: "36px", height: "36px", borderRadius: "10px", background: "transparent", color: "#71717a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s ease" }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-4 0v4M14 10V4a2 2 0 0 0-4 0v6M10 10.5V5a2 2 0 0 0-4 0v9M6 14v1a6 6 0 0 0 6 6h1a6 6 0 0 0 6-6V9a2 2 0 0 0-4 0v2" /></svg>
                </button>
                <div style={{ width: "20px", height: "1px", background: "rgba(0,0,0,0.1)", margin: "2px 0" }} />
                <button title="Undo" style={{ width: "36px", height: "36px", borderRadius: "10px", background: "transparent", color: "#71717a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s ease" }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l5 5M3 10l5-5" /></svg>
                </button>
                <button title="Redo" style={{ width: "36px", height: "36px", borderRadius: "10px", background: "transparent", color: "#71717a", opacity: 0.4, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s ease" }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10h-10a5 5 0 0 0-5 5v2M21 10l-5 5M21 10l-5-5" /></svg>
                </button>
              </div>
            </div>

            {/* Bottom Toolbar */}
            <div style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: t.bgPanel, padding: "8px 24px", borderRadius: "12px", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px rgba(58,46,38,0.05)` }}>
                <button onClick={() => setZoomLevel(Math.max(0.2, zoomLevel - 0.1))} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>−</button>
                <button onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.1))} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>+</button>
                <div style={{ width: "2px", height: "16px", background: t.border, margin: "0 4px" }} />
                <span style={{ fontSize: "12px", color: t.textMuted, fontWeight: "600" }}>Open</span>
                <input type="range" min="0" max="1" step="0.01" value={foldProgress} onChange={(e) => { setFoldProgress(parseFloat(e.target.value)); setIsPlaying(false); }} style={{ width: "80px", accentColor: t.cyan }} />
                <span style={{ fontSize: "12px", color: t.textMuted, fontWeight: "600" }}>Close</span>
                <div style={{ width: "2px", height: "16px", background: t.border, margin: "0 4px" }} />
                <button onClick={() => setIsPlaying(false)} style={{ background: "none", border: "none", cursor: "pointer", color: !isPlaying ? t.cyan : t.textMuted }}><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4z" /></svg></button>
                <button onClick={() => setIsPlaying(true)} style={{ background: "none", border: "none", cursor: "pointer", color: isPlaying ? t.cyan : t.textMuted }}><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M4 22V2l16 10L4 22z" /></svg></button>
              </div>
              <button style={{ background: t.inputBg, border: `2px solid ${t.border}`, color: t.textMain, padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: `2px 3px 0px rgba(58,46,38,0.05)` }}>
                <span style={{ color: "#eab308" }}>👑</span> Watermark free
              </button>
            </div>

            {/* Help bubble bottom right */}
            <div style={{ position: "absolute", bottom: "32px", right: "32px", zIndex: 10, width: "48px", height: "48px", borderRadius: "24px", background: t.textMain, color: t.bgApp, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>
          </div>

          {/* --- RIGHT AI PACKAGING DESIGN DRAWER --- */}
          <div 
            style={{ 
              width: isAiOpen ? "380px" : "0px", 
              transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)", 
              height: "100%", 
              zIndex: 15, 
              flexShrink: 0,
              overflow: "hidden"
            }}
          >
            <AiPackagingAssistant onClose={() => setIsAiOpen(false)} isOpen={isAiOpen} />
          </div>

        </div>
      </div>
      {isStudioOpen && <EditorModal isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} />}

      {/* --- SAVE / DISCARD EXIT CONFIRMATION MODAL --- */}
      {showExitConfirm && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setShowExitConfirm(false)}
        >
          <div 
            style={{
              width: "100%",
              maxWidth: "440px",
              background: store.theme === 'dark' ? '#18181b' : '#ffffff',
              border: `1.5px solid ${t.border}`,
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              color: t.textMain,
              animation: "modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Icon + Title */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "rgba(37, 99, 235, 0.12)",
                color: t.cyan,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: `1px solid ${t.cyan}33`
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: t.textMain, lineHeight: 1.3 }}>
                  Save changes before leaving?
                </h3>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={handleSaveAndExit}
                disabled={isSavingAndExiting}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  background: t.cyan,
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: isSavingAndExiting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                  transition: "all 0.15s ease",
                  opacity: isSavingAndExiting ? 0.8 : 1
                }}
              >
                {isSavingAndExiting ? (
                  <span>Saving box to workspace...</span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    <span>{store.activeProjectId ? "Save Changes to Workspace & Exit" : "Save Box to Workspace & Exit"}</span>
                  </>
                )}
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  onClick={handleDiscardAndExit}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: "rgba(239, 68, 68, 0.08)",
                    color: "#ef4444",
                    border: "1.5px solid rgba(239, 68, 68, 0.25)",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ef4444";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                >
                  Discard Changes
                </button>

                <button
                  onClick={() => setShowExitConfirm(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: t.inputBg,
                    color: t.textMain,
                    border: `1.5px solid ${t.border}`,
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSignInModalOpen && (
        <MockupSignInModal onClose={() => setIsSignInModalOpen(false)} />
      )}
    </>
  );
}
