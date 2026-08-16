// @ts-nocheck
import React, { useState, useRef, useMemo, useDeferredValue, useCallback, useEffect } from "react";
import Box3DViewer from "../../components/Box3DViewer";
import DielineSVG from "../../components/DielineSVG";
import { useBoxStore } from "../../lib/useBoxStore";
import { generateRTEDieline } from "../../lib/rteDielineGenerator";
import { packagingSymbols } from "../../lib/packagingSymbols";
import { exportPDF } from "../../lib/exportUtils";

// --- Simple SVG Icons ---
const IconUpload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconLayers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const IconSparkles = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>;
const IconLayout = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;

const IconPointer = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>;
const IconHand = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-4 0v4"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V5a2 2 0 0 0-4 0v9"/><path d="M6 14v1a6 6 0 0 0 6 6h1a6 6 0 0 0 6-6V9a2 2 0 0 0-4 0v2"/></svg>;
const IconUndo = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>;
const IconRedo = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>;

const themes = {
  dark: {
    bgApp: "#18181b",
    bgCanvas: "#09090b",
    bgPanel: "#18181b",
    border: "rgba(255, 255, 255, 0.1)",
    textMain: "#ffffff",
    textMuted: "#a1a1aa",
    cyan: "#10b981",
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
    gridColor: "rgba(0, 0, 0, 0.05)",
    activeBg: "rgba(16, 185, 129, 0.1)"
  }
};

const allShapes = [
  { name: 'line', type: 'line', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2"/></svg> },
  { name: 'dashed-line', type: 'dashed-line', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/></svg> },
  { name: 'square', type: 'rect', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { name: 'rounded-square', type: 'rounded-rectangle', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" stroke="none" strokeWidth="2"/></svg> },
  { name: 'pill', type: 'pill', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="6" fill="currentColor" stroke="none" strokeWidth="2"/></svg> },
  { name: 'circle', type: 'circle', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor" stroke="none" strokeWidth="2"/></svg> },
  { name: 'triangle', type: 'triangle', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,4 4,20 20,20" fill="currentColor" stroke="none" strokeWidth="2"/></svg> },
  { name: 'star', type: 'star', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor" stroke="none" strokeWidth="2"/></svg> }
];

const allSocialMedia = [
  { name: 'YouTube', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" fill="currentColor"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg>' },
  { name: 'X', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>' },
  { name: 'WhatsApp', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 2C6.486 2 1.986 6.497 1.986 12.041c0 1.765.459 3.491 1.332 5.011L1.93 21.932l4.981-1.306a10.06 10.06 0 0 0 5.12 1.391h.004c5.542 0 10.043-4.498 10.043-10.042 0-2.686-1.045-5.211-2.943-7.11a10.007 10.007 0 0 0-7.104-2.865zm0 18.358h-.002a8.375 8.375 0 0 1-4.27-1.166l-.307-.182-3.175.832.846-3.096-.2-.317A8.347 8.347 0 0 1 3.666 12.04c0-4.618 3.759-8.378 8.379-8.377 2.238 0 4.34.872 5.922 2.455a8.337 8.337 0 0 1 2.453 5.918c-.001 4.619-3.762 8.378-8.389 8.38zM16.63 13.91c-.252-.126-1.492-.736-1.722-.82-.23-.084-.397-.126-.565.126-.167.251-.649.82-.796.988-.146.167-.293.188-.545.062-1.077-.542-1.89-1.218-2.617-2.476-.147-.253.148-.236.394-.728.084-.167.042-.314-.021-.44-.063-.126-.565-1.36-.774-1.862-.204-.493-.41-.426-.565-.434-.146-.008-.313-.008-.48-.008a.922.922 0 0 0-.671.314c-.23.251-.88 .858-.88 2.094 0 1.235.9 2.428 1.026 2.595.126.167 1.77 2.702 4.288 3.791.6.258 1.066.413 1.431.528.601.191 1.15.163 1.583.099.486-.072 1.492-.61 1.701-1.198.21-.588.21-1.093.147-1.198-.063-.105-.23-.168-.482-.294z"/></svg>' },
  { name: 'TikTok', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.63-.52 3.25-1.55 4.48-1.08 1.3-2.6 2.07-4.26 2.22-1.67.14-3.37-.2-4.75-1.17-1.4-1.01-2.33-2.58-2.53-4.27-.22-1.74.2-3.53 1.16-5 1-1.5 2.58-2.56 4.34-2.92.17-.03.35-.06.52-.08v4.13c-.15.02-.3.04-.45.08-.85.22-1.62.77-2.11 1.48-.48.72-.65 1.65-.46 2.5.18.84.73 1.58 1.45 2 .7.42 1.55.54 2.33.36.81-.19 1.48-.7 1.88-1.42.36-.66.52-1.44.52-2.19V.02h-.01z"/></svg>' },
  { name: 'Threads', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 2c-3.153 0-5.32 1.393-6.525 2.924C4.303 6.643 3.731 8.878 3.731 12c0 3.167.618 5.378 1.956 6.949 1.258 1.472 3.42 2.896 6.666 2.896 4.417 0 7.37-2.566 7.643-6.626h-2.138c-.378 2.651-2.502 4.542-5.505 4.542-2.636 0-4.321-1.171-5.267-2.39-1.036-1.332-1.493-3.08-1.493-5.371 0-2.392.42-4.246 1.464-5.617C8.077 5.048 9.771 4.025 12.186 4.025c2.31 0 3.99 1.135 4.863 2.774.82 1.542 1.131 3.513.916 5.615h-1.928c-.015-1.932-.232-3.415-.826-4.498-.59-1.074-1.666-1.76-3.109-1.76-1.544 0-2.73.743-3.439 1.956-.708 1.213-1.025 2.92-1.025 4.888 0 1.952.321 3.593.991 4.792.671 1.2 1.83 1.968 3.328 1.968 1.341 0 2.457-.655 3.125-1.716l.245-.39v-3.864c0-.756-.232-1.334-.672-1.68-.458-.36-1.072-.51-1.782-.422a2.805 2.805 0 0 0-2.228 1.42 5.093 5.093 0 0 0-.693 2.645c0 1.255.228 2.302.662 3.033.432.727 1.096 1.127 1.921 1.127.842 0 1.573-.393 2.052-1.036V13.88c0-1.185.344-2.12.983-2.664.654-.555 1.564-.816 2.65-.758.12 0 .237.006.353.02C18.667 7.07 16.326 2 12.186 2zm1.758 10.74c-.58.077-1.082.356-1.467.818-.382.46-.575 1.097-.575 1.897 0 .807.198 1.439.58 1.9.38.46.883.747 1.464.832v-5.447z"/></svg>' },
  { name: 'Instagram', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' },
  { name: 'Facebook', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.325V1.325C24 .597 23.403 0 22.675 0z"/></svg>' }
];

export default function EditorModal({ isOpen, onClose, contextType = "mockup" }: { isOpen: boolean; onClose: () => void; contextType?: string }) {
  const store = useBoxStore();

  useEffect(() => {
    if (isOpen) {
      store.setContextAndModel(contextType, store.boxModel);
    }
  }, [isOpen, contextType]);

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Uploads");

  const [foldProgress, setFoldProgress] = useState(1);
  const [galleryImages, setGalleryImages] = useState([]);
  const decals = store.decalsByModel[store.boxModel] || [];
  const setDecals = store.setDecals;
  const [activeSurface, setActiveSurface] = useState("Outside");
  const t = themes[store.theme || 'light'];

  const deferredDecals = useDeferredValue(decals);
  const isRendering3D = deferredDecals !== decals;

  // Toolbar State
  const [activeTool, setActiveTool] = useState("pointer"); 
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [show3D, setShow3D] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDecalId, setActiveDecalId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const activeDecal = useMemo(() => decals.find(d => d.id === activeDecalId), [decals, activeDecalId]);

  const [expandedSection, setExpandedSection] = useState(null);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState('artwork');
  const [exportColorMode, setExportColorMode] = useState('CMYK');
  const [exportFormat, setExportFormat] = useState('PDF');

  const handleExport = async (fileType, colorMode, format) => {
    const svgElement = document.querySelector('#export-preview-container svg');
    if (!svgElement) {
      alert('Could not find SVG to export');
      return;
    }
    
    // We clone the SVG so we can manipulate it without affecting the live UI
    const clonedSvg = svgElement.cloneNode(true);
    
    // If dieline only, remove the decals/artwork
    if (fileType === 'dieline') {
      const decals = clonedSvg.querySelectorAll('.decal-group');
      decals.forEach(d => d.remove());
    }

    // Apply the user's selected package color to the background
    const bgGroup = Array.from(clonedSvg.querySelectorAll('g')).find(g => g.getAttribute('fill') === 'url(#kraft-pattern)');
    if (bgGroup) {
      if (fileType === 'artwork' && store.packageColor && store.packageColor !== 'transparent') {
        bgGroup.setAttribute('fill', store.packageColor);
      } else {
        bgGroup.setAttribute('fill', 'none');
      }
    }

    const ext = format === 'AI' ? 'ai' : 'pdf';
    const filename = `boxcraft_${fileType}_${colorMode}_${ext}.${ext}`;
    
    // exportPDF generates a real PDF document using jsPDF & svg2pdf, saving with the chosen extension.
    await exportPDF(clonedSvg, filename, colorMode);
    
    setIsExportModalOpen(false);
  };


  const pushHistory = (newDecals) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newDecals);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setDecals(newDecals);
  };

  const commitHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(decals);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const surfaceDecals = useMemo(() => decals.filter(d => d.surface === activeSurface), [decals, activeSurface]);
  const handleDeleteDecal = useCallback((id) => pushHistory(decals.filter(d => d.id !== id)), [decals, history, historyIndex]);


  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDecals(history[historyIndex - 1]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setDecals([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDecals(history[historyIndex + 1]);
    }
  };

  const handlePointerDown = (e) => {
    if (activeTool === "hand") {
      setIsPanning(true);
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (isPanning && activeTool === "hand") {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  };

  const handlePointerUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const activeColor = activeSurface === "Outside" ? store.packageColor : store.insideColor;
  const handleColorSelect = (color) => {
    if (activeSurface === "Outside") store.setPackageColor(color);
    else store.setInsideColor(color);
  };

  const packageColors = [
    { type: "picker" },
    { type: "transparent" },
    { type: "color", value: "#ffffff" },
    { type: "color", value: "#f1e5d6" },
    { type: "color", value: "#ecc950" },
    { type: "color", value: "#f6dbe6" },
    { type: "color", value: "#8d5e35" },
    { type: "color", value: "#146814" },
  ];

  const handleAddDecal = (url) => {
    const newDecals = [...decals, { 
      id: Date.now().toString(), 
      type: 'image',
      url, 
      x: 0, 
      y: 0, 
      width: 5, 
      height: 5,
      surface: activeSurface 
    }];
    pushHistory(newDecals);
  };

  const handleAddTextDecal = () => {
    const newDecals = [...decals, { 
      id: Date.now().toString(), 
      type: 'text',
      content: 'Your text here',
      fontFamily: 'Inter',
      fontSize: 0.8,
      color: '#000000',
      bold: false,
      italic: false,
      textAlign: 'center',
      x: 0, 
      y: 0, 
      width: 5, 
      height: 2, 
      surface: activeSurface 
    }];
    pushHistory(newDecals);
  };

  const handleAddShapeDecal = (shapeType) => {
    const newDecals = [...decals, { 
      id: Date.now().toString(), 
      type: 'shape',
      shapeType: shapeType,
      x: 0, 
      y: 0, 
      width: 5, 
      height: 5, 
      strokeColor: '#000000',
      strokeWidth: 5,
      surface: activeSurface 
    }];
    pushHistory(newDecals);
  };

  const handleAddWindowDecal = (shapeType) => {
    const newDecals = [...decals, { 
      id: Date.now().toString(), 
      type: 'shape',
      shapeType: shapeType,
      x: 0, 
      y: 0, 
      width: 5, 
      height: 5, 
      strokeColor: store.trimColor || '#0055ff', // Blue cutline
      strokeWidth: 2,
      fillColor: 'transparent',
      isWindow: true,
      surface: activeSurface 
    }];
    pushHistory(newDecals);
  };

  const handleAddSymbolDecal = (svgString) => {
    const newDecals = [...decals, { 
      id: Date.now().toString(), 
      type: 'shape',
      shapeType: 'custom-svg',
      svgString: svgString,
      fillColor: '#000000',
      x: 0, 
      y: 0, 
      width: 5, 
      height: 5, 
      surface: activeSurface 
    }];
    pushHistory(newDecals);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target.result;
      setGalleryImages(prev => [...prev, url]);
      handleAddDecal(url);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Removed early return to prevent hooks violation

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
      `}} />
      <div style={{ display: "flex", height: "100vh", width: "100vw", backgroundColor: t.bgCanvas, color: t.textMain, fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      
      <div style={{ width: "80px", backgroundColor: t.bgPanel, borderRight: `2px solid ${t.border}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "20px" }}>
        {[
          { name: "Uploads", icon: <IconUpload /> },
          { name: "Elements", icon: <IconLayers /> },
          { name: "AI Creation", icon: <IconSparkles /> },
          { name: "Templates", icon: <IconLayout /> },
          { name: "AI Logo", icon: <IconSparkles /> },
        ].map(tab => (
          <div 
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            style={{ 
              display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", width: "100%", cursor: "pointer",
              color: activeTab === tab.name ? t.cyan : t.textMuted,
              borderLeft: activeTab === tab.name ? `3px solid ${t.cyan}` : "3px solid transparent"
            }}
          >
            {tab.icon}
            <span style={{ fontSize: "10px", marginTop: "4px", fontWeight: activeTab === tab.name ? "600" : "400", textAlign: "center" }}>{tab.name}</span>
          </div>
        ))}
      </div>

      <div style={{ width: "280px", backgroundColor: t.bgPanel, borderRight: `2px solid ${t.border}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", display: "flex", alignItems: "center", borderBottom: `2px solid ${t.border}` }}>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", marginRight: "12px", color: t.textMuted }}>✕</button>
          <span style={{ fontWeight: "400", fontSize: "18px", fontFamily: "Georgia, 'Times New Roman', serif" }}>{activeTab === "Elements" ? "Elements" : "Upload & Design"}</span>
        </div>
        
        <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>
          {activeTab === "Uploads" ? (
            <>
              <input 
                type="file" 
                accept=".jpg,.jpeg,.png,.svg" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={handleFileUpload} 
              />
              <button onClick={() => fileInputRef.current?.click()} style={{ width: "100%", padding: "12px", backgroundColor: t.inputBg, color: t.textMain, border: `2px solid ${t.border}`, borderRadius: "12px 8px 14px 10px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px", boxShadow: `2px 3px 0px ${t.border}` }}>
                <IconUpload /> JPG, PNG, SVG
              </button>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {galleryImages.map((url, i) => (
                  <div key={i} onClick={() => handleAddDecal(url)} style={{ aspectRatio: "1", backgroundColor: t.inputBg, borderRadius: "12px 10px 14px 8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", border: `2px solid ${t.border}` }}>
                    <img src={url} alt={`upload-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === "Elements" ? (
            expandedSection ? (
              <div>
                <div 
                  onClick={() => setExpandedSection(null)} 
                  style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: t.textMain, fontWeight: "500", marginBottom: "20px", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "16px" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  {expandedSection}
                </div>
                
                {expandedSection === "Shape" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {allShapes.map((shape) => (
                      <div key={shape.name} onClick={() => { handleAddShapeDecal(shape.type); setExpandedSection(null); }} style={{ aspectRatio: "1", backgroundColor: t.inputBg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px ${t.border}`, color: t.textMain }}>
                        {shape.render()}
                      </div>
                    ))}
                  </div>
                )}

                {expandedSection === "Packaging Symbols" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {packagingSymbols.map((sym, idx) => (
                      <div key={idx} onClick={() => { handleAddSymbolDecal(sym.svg); setExpandedSection(null); }} style={{ aspectRatio: "1", backgroundColor: t.inputBg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px ${t.border}` }} title={sym.name} dangerouslySetInnerHTML={{ __html: sym.svg.replace(/width="[^"]+"/, 'width="48"').replace(/height="[^"]+"/, 'height="48"') }} />
                    ))}
                  </div>
                )}

                {expandedSection === "Social Media" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {allSocialMedia.map((sm) => (
                      <div key={sm.name} onClick={() => { handleAddSymbolDecal(sm.svg); setExpandedSection(null); }} style={{ aspectRatio: "1", backgroundColor: t.inputBg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px ${t.border}`, color: t.textMain }} title={sm.name} dangerouslySetInnerHTML={{ __html: sm.svg.replace(/width="[^"]+"/, 'width="48"').replace(/height="[^"]+"/, 'height="48"').replace('<svg ', '<svg width="48" height="48" ') }} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "12px", fontFamily: "Georgia, 'Times New Roman', serif" }}>Text</div>
                <div 
                  onClick={handleAddTextDecal}
                  style={{ width: "100px", height: "100px", backgroundColor: t.inputBg, border: `2px solid ${t.border}`, borderRadius: "14px 10px 8px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: `2px 3px 0px ${t.border}` }}
                >
                  <span style={{ fontSize: "24px", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: "bold", color: t.textMain }}>T</span>
                  <span style={{ fontSize: "13px", color: t.textMuted }}>Add text</span>
                </div>
                
                <div style={{ marginTop: "32px", borderTop: `2px solid ${t.border}`, paddingTop: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "400", fontFamily: "Georgia, 'Times New Roman', serif" }}>Shape</div>
                    <div style={{ fontSize: "12px", color: t.textMain, cursor: "pointer" }} onClick={() => setExpandedSection("Shape")}>More</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {allShapes.slice(0, 3).map((shape) => (
                      <div key={shape.name} onClick={() => handleAddShapeDecal(shape.type)} style={{ aspectRatio: "1", backgroundColor: t.inputBg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px ${t.border}`, color: t.textMain }}>
                        {shape.render()}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "32px", borderTop: `2px solid ${t.border}`, paddingTop: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "400", fontFamily: "Georgia, 'Times New Roman', serif" }}>Packaging Symbols</div>
                    <div style={{ fontSize: "12px", color: t.textMain, cursor: "pointer" }} onClick={() => setExpandedSection("Packaging Symbols")}>More</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {packagingSymbols.slice(0, 3).map((sym, idx) => (
                      <div key={idx} onClick={() => handleAddSymbolDecal(sym.svg)} style={{ aspectRatio: "1", backgroundColor: t.inputBg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px ${t.border}` }} title={sym.name} dangerouslySetInnerHTML={{ __html: sym.svg.replace('width="1em"', 'width="32"').replace('height="1em"', 'height="32"') }}>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "32px", borderTop: `2px solid ${t.border}`, paddingTop: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "400", fontFamily: "Georgia, 'Times New Roman', serif" }}>Social Media</div>
                    <div style={{ fontSize: "12px", color: t.textMain, cursor: "pointer" }} onClick={() => setExpandedSection("Social Media")}>More</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {allSocialMedia.slice(0, 3).map((sm) => (
                      <div key={sm.name} onClick={() => handleAddSymbolDecal(sm.svg)} style={{ aspectRatio: "1", backgroundColor: t.inputBg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px ${t.border}`, color: t.textMain }} title={sm.name} dangerouslySetInnerHTML={{ __html: sm.svg.replace('<svg ', '<svg width="32" height="32" ') }}>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "32px", borderTop: `2px solid ${t.border}`, paddingTop: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "400", fontFamily: "Georgia, 'Times New Roman', serif" }}>Window Cutouts</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {allShapes.filter(s => ['square', 'rounded-square', 'circle', 'triangle', 'star'].includes(s.name)).map((shape) => (
                      <div key={`window-${shape.name}`} onClick={() => handleAddWindowDecal(shape.type)} style={{ aspectRatio: "1", backgroundColor: t.inputBg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px ${t.border}`, color: store.trimColor || '#0055ff' }}>
                        {shape.render()}
                      </div>
                    ))}
                  </div>
                </div>

              {activeDecal && (activeDecal.type === 'shape' || activeDecal.type === 'custom-svg') && !activeDecal.isWindow && (
                <div style={{ marginTop: "32px", borderTop: `2px solid ${t.border}`, paddingTop: "20px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "12px", fontFamily: "Georgia, 'Times New Roman', serif" }}>Shape Colors</div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                      <label style={{ fontSize: "12px", color: t.textMuted }}>Fill</label>
                      <input 
                        type="color" 
                        value={activeDecal.fillColor || "#000000"} 
                        onChange={(e) => {
                          const val = e.target.value;
                          pushHistory(decals.map(d => d.id === activeDecal.id ? { ...d, fillColor: val } : d));
                        }}
                        style={{ width: "40px", height: "40px", padding: "0", border: `2px solid ${t.border}`, borderRadius: "8px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                      <label style={{ fontSize: "12px", color: t.textMuted }}>Border</label>
                      <input 
                        type="color" 
                        value={activeDecal.strokeColor || "#000000"} 
                        onChange={(e) => {
                          const val = e.target.value;
                          pushHistory(decals.map(d => d.id === activeDecal.id ? { ...d, strokeColor: val } : d));
                        }}
                        style={{ width: "40px", height: "40px", padding: "0", border: `2px solid ${t.border}`, borderRadius: "8px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: "32px", borderTop: `2px solid ${t.border}`, paddingTop: "20px" }}>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "12px", fontFamily: "Georgia, 'Times New Roman', serif" }}>Your Elements</div>
                {decals.length === 0 ? (
                  <div style={{ color: t.textMuted, fontSize: "12px", fontStyle: "italic" }}>No elements added yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {decals.map((decal, idx) => (
                      <div key={decal.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: t.inputBg, padding: "8px 12px", borderRadius: "8px", border: `2px solid ${t.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                          {decal.type === 'image' ? (
                            <img src={decal.url} style={{ width: "24px", height: "24px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: t.activeBg, borderRadius: "4px", flexShrink: 0 }}>
                              <span style={{ fontSize: "14px", fontWeight: "bold", color: t.cyan }}>T</span>
                            </div>
                          )}
                          <span style={{ fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                            {decal.type === 'image' ? `Image ${idx + 1}` : decal.isWindow ? `Window Cutout` : `Text: ${decal.content || 'Shape'}`}
                          </span>
                        </div>
                        <button 
                          onClick={() => pushHistory(decals.filter(d => d.id !== decal.id))}
                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px" }}
                          onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                          onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                          title="Delete element"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )
          ) : (
            <div style={{ textAlign: "center", color: t.textMuted, fontSize: "13px", marginTop: "20px" }}>Coming soon...</div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        <div 
          style={{ flex: 1, padding: "40px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: activeTool === "hand" ? (isPanning ? "grabbing" : "grab") : "default" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div style={{ width: "100%", height: "100%", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center", transition: isPanning ? "none" : "transform 0.2s ease-out" }}>
            {useMemo(() => (
              <DielineSVG 
                L={store.L} W={store.W} H={store.H} T={store.T} 
                materialType={store.materialType} 
                isEditorMode={true} 
                colorDieline={true}
                activeColor={activeColor}
                activeSurface={activeSurface}
                decals={surfaceDecals}
                setDecals={setDecals}
                onDragEnd={commitHistory}
                activeDecalId={activeDecalId}
                setActiveDecalId={setActiveDecalId}
                onDeleteDecal={handleDeleteDecal}
                disableInteractions={activeTool === "hand"}
              />
            ), [store.L, store.W, store.H, store.T, store.materialType, activeColor, activeSurface, surfaceDecals, setDecals, commitHistory, activeDecalId, setActiveDecalId, handleDeleteDecal, activeTool])}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "16px", background: t.bgPanel, padding: "8px 16px", borderRadius: "12px 14px 10px 12px", border: `2px solid ${t.border}`, boxShadow: `2px 3px 0px rgba(58,46,38,0.1)` }}>
          <div style={{ display: "flex", gap: "12px", borderRight: `2px solid ${t.border}`, paddingRight: "16px" }}>
            <button onClick={() => setActiveTool("pointer")} style={{ background: "none", border: "none", cursor: "pointer", color: activeTool === "pointer" ? t.cyan : t.textMuted }}><IconPointer /></button>
            <button onClick={() => setActiveTool("hand")} style={{ background: "none", border: "none", cursor: "pointer", color: activeTool === "hand" ? t.cyan : t.textMuted }}><IconHand /></button>
          </div>
          <div style={{ display: "flex", gap: "12px", borderRight: `2px solid ${t.border}`, paddingRight: "16px" }}>
            <button onClick={handleUndo} style={{ background: "none", border: "none", cursor: historyIndex > -1 ? "pointer" : "default", color: t.textMuted, opacity: historyIndex > -1 ? 1 : 0.3 }}><IconUndo /></button>
            <button onClick={handleRedo} style={{ background: "none", border: "none", cursor: historyIndex < history.length - 1 ? "pointer" : "default", color: t.textMuted, opacity: historyIndex < history.length - 1 ? 1 : 0.3 }}><IconRedo /></button>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", borderRight: `2px solid ${t.border}`, paddingRight: "16px" }}>
            <button onClick={() => setZoom(Math.max(0.1, zoom - 0.2))} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>−</button>
            <span onClick={() => { setZoom(1); setPan({x:0, y:0}); }} style={{ cursor: "pointer", fontSize: "13px", fontWeight: "500", color: t.textMain }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(5, zoom + 0.2))} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>+</button>
          </div>
          <div style={{ display: "flex", gap: "12px", color: t.textMuted, alignItems: "center" }}>
            <button onClick={() => store.toggleTheme()} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>
              {store.theme === 'dark' ? 
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg> :
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              }
            </button>
            <span onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: "pointer", fontSize: "18px", color: isExpanded ? t.cyan : t.textMuted }}>⛶</span>
            <span onClick={() => setShow3D(!show3D)} style={{ cursor: "pointer", fontSize: "18px", color: show3D ? t.cyan : t.textMuted }}>👁</span>
          </div>
        </div>
      </div>

      {!isExpanded && (
      <div style={{ width: "320px", backgroundColor: t.bgPanel, borderLeft: `2px solid ${t.border}`, display: "flex", flexDirection: "column", padding: "16px", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button style={{ flex: 1, padding: "12px", backgroundColor: t.activeBg, color: t.textMain, border: `2px solid ${t.border}`, borderRadius: "14px 10px 12px 16px", fontWeight: "600", cursor: "pointer", boxShadow: `2px 3px 0px ${t.border}` }}>
            Save
          </button>
          <button onClick={() => setIsExportModalOpen(true)} style={{ flex: 1, padding: "12px", backgroundColor: t.cyan, color: (store.theme === 'dark' ? '#3a2e26' : '#fff'), border: `2px solid ${t.border}`, borderRadius: "10px 14px 16px 12px", fontWeight: "600", cursor: "pointer", boxShadow: `2px 3px 0px ${t.border}` }}>
            Super Export
          </button>
        </div>

        {/* 3D Box Preview Component */}
        {show3D && (
        <div style={{ width: "100%", height: "260px", background: t.inputBg, border: `2px solid ${t.border}`, borderRadius: "12px 14px 10px 16px", position: "relative", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ position: "absolute", top: "8px", right: "8px", background: t.bgApp, padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "700", zIndex: 10, border: `1px solid ${t.border}`, color: t.textMain }}>3D</div>
          {isRendering3D && (
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, fontSize: "14px", fontWeight: "bold", backdropFilter: "blur(2px)" }}>
              Rendering...
            </div>
          )}
          <Box3DViewer 
            L={store.L} W={store.W} H={store.H} T={store.T}
            progress={foldProgress}
            materialPreset={
              (store.materialType || "").toLowerCase().includes("corrugated") ? "corrugated-kraft" :
              (store.materialType || "").toLowerCase().includes("kraft")      ? "natural-kraft" :
              "white-kraft"
            }
            packageColor={activeColor}
            lightingPreset="studio"
            decals={deferredDecals}
          />
        </div>
        )}
        
        {/* Dimensions Box */}
        <div style={{ background: t.inputBg, border: `2px solid ${t.border}`, borderRadius: "16px 14px 18px 16px", padding: "16px", marginBottom: "16px", boxShadow: `2px 3px 0px rgba(58,46,38,0.05)` }}>
          <div style={{ fontSize: "11px", color: t.textMuted, fontWeight: "700", marginBottom: "12px", letterSpacing: "0.5px" }}>DIMENSIONS (IN)</div>
          
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {[
              { label: 'LENGTH', key: 'L', val: store.L },
              { label: 'WIDTH', key: 'W', val: store.W },
              { label: 'HEIGHT', key: 'H', val: store.H }
            ].map((dim) => (
              <div key={dim.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <input 
                  type="number" step="0.0001" value={dim.val} 
                  onChange={(e) => store.setDim(dim.key, e.target.value)}
                  style={{ 
                    width: "100%", background: store.theme === 'dark' ? t.bgApp : t.activeBg, border: `2px solid ${t.border}`, 
                    color: t.textMain, fontSize: "15px", fontWeight: "700", textAlign: "center", 
                    padding: "8px 4px", borderRadius: "8px", marginBottom: "6px", outline: "none",
                    fontFamily: "'Inter', sans-serif"
                  }}
                  onFocus={(e) => e.target.style.borderColor = t.cyan}
                  onBlur={(e) => e.target.style.borderColor = t.border}
                />
                <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: "600" }}>{dim.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", background: store.theme === 'dark' ? t.bgApp : t.activeBg, padding: "12px 16px", borderRadius: "10px", border: `2px solid ${t.border}` }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: "700", marginBottom: "4px" }}>VOL (IN³)</span>
              <span style={{ fontSize: "16px", color: t.cyan, fontWeight: "700" }}>{(store.L * store.W * store.H).toFixed(1)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: "700", marginBottom: "4px" }}>AREA (IN²)</span>
              <span style={{ fontSize: "16px", color: t.cyan, fontWeight: "700" }}>{(2 * (store.L * store.W + store.L * store.H + store.W * store.H)).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Fold Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", background: t.inputBg, border: `2px solid ${t.border}`, padding: "8px 12px", borderRadius: "14px 12px 16px 10px" }}>
          <span style={{ fontSize: "12px", color: t.textMuted }}>Open</span>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={foldProgress} onChange={(e) => setFoldProgress(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: t.cyan }}
          />
          <span style={{ fontSize: "12px", color: t.textMuted }}>Close</span>
        </div>

        {/* Outside / Inside Toggle */}
        <div style={{ display: "flex", border: `2px solid ${t.border}`, borderRadius: "10px 14px 8px 12px", overflow: "hidden", marginBottom: "24px", background: t.inputBg }}>
          <button 
            onClick={() => setActiveSurface("Outside")}
            style={{ flex: 1, padding: "8px", border: "none", background: activeSurface === "Outside" ? t.activeBg : "transparent", fontWeight: activeSurface === "Outside" ? "600" : "400", cursor: "pointer", color: activeSurface === "Outside" ? t.textMain : t.textMuted }}
          >Outside</button>
          <div style={{ width: "2px", background: t.border }}></div>
          <button 
            onClick={() => setActiveSurface("Inside")}
            style={{ flex: 1, padding: "8px", border: "none", background: activeSurface === "Inside" ? t.activeBg : "transparent", fontWeight: activeSurface === "Inside" ? "600" : "400", cursor: "pointer", color: activeSurface === "Inside" ? t.textMain : t.textMuted }}
          >Inside</button>
        </div>


        {/* Package Color */}
        <div>
          <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "12px", color: t.textMain, fontFamily: "Georgia, 'Times New Roman', serif" }}>Package Color</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {packageColors.map((item, idx) => {
              const isSelected = activeColor === item.value || (item.type === "transparent" && activeColor === "transparent");
              
              if (item.type === "picker") {
                return (
                  <div key={`color-${idx}`} style={{ position: "relative", width: "28px", height: "28px" }}>
                    <div style={{
                      width: "100%", height: "100%", borderRadius: "4px 10px 8px 12px", cursor: "pointer",
                      background: "linear-gradient(white, white) padding-box, conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000) border-box",
                      border: "2.5px solid transparent",
                      boxShadow: `1px 2px 0px ${t.border}`,
                      pointerEvents: "none", position: "absolute", zIndex: 2
                    }} />
                    <input 
                      type="color"
                      value={activeColor && activeColor !== "transparent" ? activeColor : "#ffffff"}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      style={{ 
                        position: "absolute", top: 0, left: 0, width: "100%", height: "100%", 
                        opacity: 0, cursor: "pointer", zIndex: 3 
                      }}
                    />
                  </div>
                );
              }

              if (item.type === "transparent") {
                return (
                  <div 
                    key={`color-${idx}`}
                    onClick={() => handleColorSelect("transparent")}
                    style={{
                      width: "28px", height: "28px", borderRadius: "10px 12px 14px 8px", cursor: "pointer",
                      background: "repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%) 50% / 10px 10px",
                      border: isSelected ? `2.5px solid ${t.cyan}` : `2px solid ${t.border}`,
                      boxShadow: isSelected ? `2px 3px 0px ${t.border}` : `1px 2px 0px rgba(58,46,38,0.05)`
                    }}
                  />
                );
              }

              return (
                <div 
                  key={`color-${idx}`}
                  onClick={() => handleColorSelect(item.value)}
                  style={{
                    width: "28px", height: "28px", borderRadius: "50%", backgroundColor: item.value, cursor: "pointer",
                    border: isSelected ? `2.5px solid ${t.cyan}` : `2px solid ${t.border}`,
                    boxShadow: isSelected ? `0 0 0 2px ${t.bgPanel} inset, 2px 3px 0px ${t.border}` : `1px 2px 0px rgba(58,46,38,0.05)`,
                    boxSizing: "border-box"
                  }}
                />
              );
            })}
          </div>
        </div>
        
      </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "900px", height: "600px", backgroundColor: t.bgPanel, borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", border: `2px solid ${t.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: `2px solid ${t.border}` }}>
              <div style={{ display: "flex", gap: "24px", fontSize: "16px", fontWeight: "600", alignItems: "center" }}>
                <span style={{ color: t.textMuted, cursor: "pointer" }}>Mockup</span>
                <span style={{ color: t.textMain, borderBottom: `3px solid #8b5cf6`, paddingBottom: "16px", marginBottom: "-18px" }}>Dieline</span>
                <span style={{ color: t.textMuted, cursor: "pointer" }}>Videos</span>
                <span style={{ color: t.textMuted, cursor: "pointer" }}>Code</span>
                <span style={{ color: t.textMuted, cursor: "pointer" }}>Share</span>
                <span style={{ color: t.textMuted, cursor: "pointer" }}>Collaborate</span>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: t.textMain, fontWeight: "bold" }}>✕</button>
            </div>
            
            {/* Content */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* Left Preview */}
              <div style={{ flex: 1, backgroundColor: store.theme === 'dark' ? '#201c18' : '#e5e5e5', display: "flex", alignItems: "center", justifyContent: "center", padding: "32px", overflow: "hidden", position: "relative" }}>
                <div id="export-preview-container" style={{ width: "100%", height: "100%", transform: "scale(0.85)", transformOrigin: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DielineSVG 
                    L={store.L} W={store.W} H={store.H} T={store.T} 
                    materialType={store.materialType} 
                    isEditorMode={true} 
                    colorDieline={true}
                    activeColor={activeColor}
                    activeSurface={activeSurface}
                    decals={exportFileType === 'dieline' ? [] : surfaceDecals}
                    disableInteractions={true}
                  />
                </div>
              </div>
              
              {/* Right Controls */}
              <div style={{ width: "350px", padding: "32px", display: "flex", flexDirection: "column", overflowY: "auto", borderLeft: `2px solid ${t.border}` }}>
                
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", color: t.textMain }}>File type</div>
                  
                  <div 
                    onClick={() => setExportFileType('artwork')}
                    style={{ border: exportFileType === 'artwork' ? `2px solid #8b5cf6` : `1px solid ${t.border}`, borderRadius: "8px", padding: "16px", marginBottom: "12px", cursor: "pointer", backgroundColor: exportFileType === 'artwork' ? (store.theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : '#f9f5ff') : 'transparent', transition: "all 0.2s ease" }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: "600", color: t.textMain, marginBottom: "4px" }}>Artwork file</div>
                    <div style={{ fontSize: "12px", color: t.textMuted, lineHeight: "1.4" }}>Includes dieline and artwork, ready for printing.</div>
                  </div>
                  
                  <div 
                    onClick={() => setExportFileType('dieline')}
                    style={{ border: exportFileType === 'dieline' ? `2px solid #8b5cf6` : `1px solid ${t.border}`, borderRadius: "8px", padding: "16px", cursor: "pointer", backgroundColor: exportFileType === 'dieline' ? (store.theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : '#f9f5ff') : 'transparent', transition: "all 0.2s ease" }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: "600", color: t.textMain, marginBottom: "4px" }}>Dieline file</div>
                    <div style={{ fontSize: "12px", color: t.textMuted, lineHeight: "1.4" }}>Artwork is not included, open the dieline in your favorite application and complete the design.</div>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", color: t.textMain, display: "flex", alignItems: "center", gap: "6px" }}>Color mode <span style={{ fontSize: "12px", color: t.textMuted, cursor: "help" }}>ⓘ</span></div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div 
                      onClick={() => setExportColorMode('CMYK')}
                      style={{ flex: 1, border: exportColorMode === 'CMYK' ? `2px solid #8b5cf6` : `1px solid ${t.border}`, borderRadius: "8px", padding: "10px", textAlign: "center", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: exportColorMode === 'CMYK' ? '#8b5cf6' : t.textMain, backgroundColor: exportColorMode === 'CMYK' ? (store.theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : '#f9f5ff') : 'transparent', transition: "all 0.2s ease" }}
                    >CMYK</div>
                    <div 
                      onClick={() => setExportColorMode('RGB')}
                      style={{ flex: 1, border: exportColorMode === 'RGB' ? `2px solid #8b5cf6` : `1px solid ${t.border}`, borderRadius: "8px", padding: "10px", textAlign: "center", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: exportColorMode === 'RGB' ? '#8b5cf6' : t.textMain, backgroundColor: exportColorMode === 'RGB' ? (store.theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : '#f9f5ff') : 'transparent', transition: "all 0.2s ease" }}
                    >RGB</div>
                  </div>
                </div>

                <div style={{ marginBottom: "auto" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", color: t.textMain }}>Format</div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div 
                      onClick={() => setExportFormat('AI')}
                      style={{ flex: 1, border: exportFormat === 'AI' ? `2px solid #8b5cf6` : `1px solid ${t.border}`, borderRadius: "8px", padding: "10px", textAlign: "center", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: exportFormat === 'AI' ? '#8b5cf6' : t.textMain, backgroundColor: exportFormat === 'AI' ? (store.theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : '#f9f5ff') : 'transparent', transition: "all 0.2s ease" }}
                    ><span style={{ backgroundColor: "#ff8a00", color: "white", padding: "2px 5px", borderRadius: "3px", fontSize: "10px", fontWeight: "bold" }}>Ai</span> AI</div>
                    <div 
                      onClick={() => setExportFormat('PDF')}
                      style={{ flex: 1, border: exportFormat === 'PDF' ? `2px solid #8b5cf6` : `1px solid ${t.border}`, borderRadius: "8px", padding: "10px", textAlign: "center", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: exportFormat === 'PDF' ? '#8b5cf6' : t.textMain, backgroundColor: exportFormat === 'PDF' ? (store.theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : '#f9f5ff') : 'transparent', transition: "all 0.2s ease" }}
                    ><span style={{ backgroundColor: "#e22828", color: "white", padding: "2px 5px", borderRadius: "3px", fontSize: "10px", fontWeight: "bold" }}>PDF</span> PDF</div>
                  </div>
                </div>

                <button 
                  onClick={() => handleExport(exportFileType, exportColorMode, exportFormat)}
                  style={{ width: "100%", padding: "16px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "16px", cursor: "pointer", marginTop: "32px", transition: "opacity 0.2s ease" }}
                  onMouseOver={(e) => e.target.style.opacity = "0.9"}
                  onMouseOut={(e) => e.target.style.opacity = "1"}
                >
                  Export now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
