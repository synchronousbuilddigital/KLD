import React, { useState } from "react";
import Box3DViewer from "../../components/Box3DViewer";
import { useBoxStore } from "../../lib/useBoxStore";
import BoxStudioModal from "./BoxStudioModal";
import EditorModal from "./EditorModal";

const themes: Record<string, any> = {
  dark: {
    bgApp: "#18181b",
    bgCanvas: "#09090b",
    bgPanel: "#18181b",
    border: "rgba(255, 255, 255, 0.1)",
    textMain: "#ffffff",
    textMuted: "#a1a1aa",
    cyan: "#10b981", // emerald-500
    inputBg: "#27272a",
    gridColor: "rgba(255, 255, 255, 0.05)",
    activeBg: "rgba(16, 185, 129, 0.1)"
  },
  light: {
    bgApp: "#f4f4f5", // zinc-100
    bgCanvas: "#fafafa", // zinc-50
    bgPanel: "#ffffff",
    border: "rgba(0, 0, 0, 0.1)",
    textMain: "#18181b", // zinc-900
    textMuted: "#71717a", // zinc-500
    cyan: "#10b981", // emerald-500
    inputBg: "#ffffff",
    gridColor: "rgba(169, 179, 150, 0.15)",
    activeBg: "rgba(16, 185, 129, 0.1)"
  }
};

const IconNav = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>;
const IconCloud = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.89-1.78-3.5-3.5-3.5a5.5 5.5 0 0 0-5.38 4.41c-2 .19-3.62 1.63-3.62 3.59A3.5 3.5 0 0 0 7 19Z" /></svg>;

export default function WorkshopPage() {
  const store = useBoxStore((state: any) => state);
  const [foldProgress, setFoldProgress] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playDirection, setPlayDirection] = useState(-1);
  const [activeSidebarTab, setActiveSidebarTab] = useState("Assets");
  const [activeAnimation, setActiveAnimation] = useState("none");
  const [contextMenu, setContextMenu] = useState<any>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  
  const themeKey = store.theme || 'light';
  const t = themes[themeKey] || themes.light;

  React.useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    
    if (isPlaying) {
      const animate = (time: number) => {
        const delta = time - lastTime;
        lastTime = time;
        setFoldProgress((prev: number) => {
          let next = prev + 0.0005 * delta * playDirection;
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
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: t.textMain }}>
              <span style={{ fontWeight: "400", fontSize: "20px", fontFamily: "Georgia, 'Times New Roman', serif" }}>Mockup Generator</span>
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}><IconNav /></button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}><IconCloud /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button style={{ background: t.inputBg, border: `2px solid ${t.border}`, color: t.textMain, padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", boxShadow: `2px 3px 0px rgba(58,46,38,0.05)` }}>
              <span style={{ color: t.cyan }}>✦</span> 50 credits <span style={{ background: t.textMain, color: t.bgPanel, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>+</span>
            </button>
            <button style={{ background: t.inputBg, border: `2px solid ${t.border}`, color: t.textMain, padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: `2px 3px 0px rgba(58,46,38,0.05)` }}>
              3D Design ↗
            </button>
            <button onClick={() => store.toggleTheme && store.toggleTheme()} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>
              {store.theme === 'dark' ?
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" /></svg> :
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              }
            </button>
            <button style={{ background: t.cyan, color: store.theme === 'dark' ? '#3a2e26' : '#fff', border: "none", padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: `2px 3px 0px rgba(58,46,38,0.15)` }}>
              Super export
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* --- LEFT TOOLBAR (ORIGINAL 3 TABS WITH ROUNDED BOX STYLING) --- */}
          <div style={{ width: "76px", background: t.bgPanel, borderRight: `2px solid ${t.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: "20px", zIndex: 10, overflowY: "auto" }}>
            {[
              { id: 'Assets', label: 'ASSETS', icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg> },
              { id: 'Layout', label: 'LAYOUT', icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3" ry="3" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg> },
              { id: 'Video', label: 'VIDEO', icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="3" ry="3" /></svg> }
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
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", color: isActive ? t.cyan : t.textMuted }}
                >
                  <div style={{ 
                    width: "52px", 
                    height: "52px", 
                    borderRadius: "18px", 
                    background: isActive ? t.activeBg : "transparent", 
                    border: isActive ? `1.5px solid ${t.cyan}` : "1.5px solid transparent",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: isActive ? "800" : "600", letterSpacing: "0.5px" }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* --- LEFT PANEL (ORIGINAL WORKSHOP CONTENT WITH MODERN BOX STYLING) --- */}
          <div style={{ width: "320px", background: t.bgPanel, padding: "24px", display: "flex", flexDirection: "column", overflowY: "auto", zIndex: 10, borderRight: `2px solid ${t.border}` }}>

            {activeSidebarTab === "Assets" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: t.textMuted, letterSpacing: "1px", marginBottom: "16px" }}>GRAPHICS & ASSETS</div>
                  <button 
                    onClick={() => setIsStudioOpen(true)}
                    style={{ width: "100%", background: t.cyan, color: '#fff', border: "none", padding: "14px 20px", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", boxShadow: `0 4px 12px rgba(16, 185, 129, 0.3)`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Design Editor
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: t.textMuted, letterSpacing: "1px", marginBottom: "16px" }}>ASSETS LIBRARY</div>
                  <div style={{ color: t.textMuted, fontSize: "13px", padding: '20px', background: t.inputBg, borderRadius: '8px', border: `1px solid ${t.border}`, textAlign: 'center' }}>No assets available.</div>
                </div>
              </div>
            )}

            {activeSidebarTab === "Layout" && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: t.textMuted, letterSpacing: "1px", marginBottom: "16px" }}>SCENE LAYOUT</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { id: 'single', label: 'Single', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'single' ? t.cyan : t.textMuted}><polygon points="12,8 4,12 12,16 20,12" /></svg> },
                    { id: 'stacked2', label: 'Stacked (2)', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'stacked2' ? t.cyan : t.textMuted}><polygon points="12,4 4,8 12,12 20,8" opacity="0.6" /><polygon points="12,12 4,16 12,20 20,16" /></svg> },
                    { id: 'stacked3', label: 'Stacked (3)', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'stacked3' ? t.cyan : t.textMuted}><polygon points="12,2 5,5 12,8 19,5" opacity="0.4" /><polygon points="12,9 5,12 12,15 19,12" opacity="0.7" /><polygon points="12,16 5,19 12,22 19,19" /></svg> },
                    { id: 'sidebyside', label: 'Side by Side', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'sidebyside' ? t.cyan : t.textMuted}><polygon points="8,10 2,13 8,16 14,13" /><polygon points="16,10 10,13 16,16 22,13" opacity="0.7" /></svg> },
                    { id: 'offset', label: 'Offset', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'offset' ? t.cyan : t.textMuted}><polygon points="12,6 5,10 12,14 19,10" opacity="0.6" /><polygon points="16,13 9,17 16,21 23,17" /></svg> },
                    { id: 'cascade', label: 'Cascade', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill={store.sceneLayout === 'cascade' ? t.cyan : t.textMuted}><polygon points="7,4 1,7 7,10 13,7" opacity="0.4" /><polygon points="12,9 6,12 12,15 18,12" opacity="0.7" /><polygon points="17,14 11,17 17,20 23,17" /></svg> },
                  ].map(l => (
                    <div key={l.id} onClick={() => store.setSceneLayout && store.setSceneLayout(l.id)} style={{ cursor: "pointer", background: t.inputBg, border: store.sceneLayout === l.id ? `2px solid ${t.cyan}` : `2px solid ${t.border}`, borderRadius: "16px", padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", boxShadow: store.sceneLayout === l.id ? `2px 3px 0px rgba(212, 140, 112, 0.2)` : `2px 3px 0px rgba(58,46,38,0.05)` }}>
                      {l.icon}
                      <div style={{ fontSize: "11px", fontWeight: "600", color: store.sceneLayout === l.id ? t.cyan : t.textMain, textAlign: "center" }}>{l.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSidebarTab === "Video" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", background: t.inputBg, border: `2px solid ${t.border}`, borderRadius: "12px", overflow: "hidden", padding: "4px" }}>
                  <div style={{ flex: 1, textAlign: "center", padding: "8px", fontSize: "12px", fontWeight: "600", borderRadius: "8px", background: t.activeBg, color: t.textMain, cursor: "pointer" }}>Animation</div>
                  <div style={{ flex: 1, textAlign: "center", padding: "8px", fontSize: "12px", fontWeight: "600", color: t.textMuted, cursor: "pointer" }}>AI Video</div>
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
                      <div style={{ fontSize: "14px", fontWeight: "500", color: t.textMain }}>{vid.label}</div>
                      
                      <div 
                        style={{ position: "relative", width: "100%", height: "200px", borderRadius: "12px", background: t.inputBg, border: activeAnimation === vid.id ? `2px solid ${t.cyan}` : `2px solid ${t.border}`, overflow: "hidden", cursor: "pointer", boxShadow: activeAnimation === vid.id ? `2px 3px 0px rgba(212, 140, 112, 0.2)` : `2px 3px 0px rgba(58,46,38,0.05)` }}
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
                        
                        <a 
                          href={vid.src}
                          download={`${vid.label} Animation.mp4`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.5)", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "background 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.7)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
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
                      onClick={() => { setContextMenu(null); setIsStudioOpen(true); }} 
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

          {/* --- RIGHT TOOLBAR --- */}
          <div style={{ width: "64px", background: "transparent", position: "absolute", right: "24px", top: "24px", zIndex: 10, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: t.bgPanel, border: `2px solid ${t.border}`, borderRadius: "12px", padding: "8px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", boxShadow: `2px 3px 0px rgba(58,46,38,0.05)` }}>
              <button style={{ width: "32px", height: "32px", borderRadius: "8px", background: t.activeBg, color: t.cyan, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
              </button>
              <button style={{ width: "32px", height: "32px", borderRadius: "8px", background: "transparent", color: t.textMuted, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-4 0v4M14 10V4a2 2 0 0 0-4 0v6M10 10.5V5a2 2 0 0 0-4 0v9M6 14v1a6 6 0 0 0 6 6h1a6 6 0 0 0 6-6V9a2 2 0 0 0-4 0v2" /></svg>
              </button>
              <div style={{ width: "24px", height: "2px", background: t.border }} />
              <button style={{ width: "32px", height: "32px", borderRadius: "8px", background: "transparent", color: t.textMuted, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l5 5M3 10l5-5" /></svg>
              </button>
              <button style={{ width: "32px", height: "32px", borderRadius: "8px", background: "transparent", color: t.textMuted, opacity: 0.5, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10h-10a5 5 0 0 0-5 5v2M21 10l-5 5M21 10l-5-5" /></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
      {isStudioOpen && <EditorModal isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} />}
    </>
  );
}
