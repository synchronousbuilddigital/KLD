import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu, Eye, Share2, MousePointer2, Hand, MessageSquare, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize2, Plus, Minus, Download, Upload, X,
  LayoutTemplate, Wand2, Grid, Image as ImageIcon, Sparkles, ChevronRight,
  Info, Crown, Layers, Type, SlidersHorizontal, Check, RefreshCw,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Trash2, ArrowUp, ArrowDown,
  MessageCircle, EyeOff, ShieldCheck
} from 'lucide-react';
import BeverageCan3D, { BeverageCan3DRef, CanvasDecal } from './components/3d/BeverageCan3D';
import CanLabelCanvas from './components/3d/CanLabelCanvas';
import PlasticWaterBottle3D, { PlasticWaterBottle3DRef } from './components/3d/PlasticWaterBottle3D';
import WaterBottleLabelCanvas from './components/3d/WaterBottleLabelCanvas';
import { packagingSymbols } from '../lib/packagingSymbols';
import { useBoxStore } from '../lib/useBoxStore';
import { mockupService } from '../services/mockups';
import './MockupGenerator.css';

interface MockupGeneratorProps {
  onBack: () => void;
  initialModel?: string; // 'can' | 'water_bottle'
}

// Vector Shapes matching EditorModal
const ALL_SHAPES = [
  { name: 'Square', type: 'rect', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" fill="currentColor" /></svg> },
  { name: 'Rounded Square', type: 'rounded-rectangle', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" /></svg> },
  { name: 'Circle', type: 'circle', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor" /></svg> },
  { name: 'Pill', type: 'pill', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="6" fill="currentColor" /></svg> },
  { name: 'Triangle', type: 'triangle', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,4 4,20 20,20" fill="currentColor" /></svg> },
  { name: 'Star', type: 'star', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor" /></svg> },
  { name: 'Line', type: 'line', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="3" /></svg> },
  { name: 'Dashed Line', type: 'dashed-line', render: () => <svg width="24" height="24" viewBox="0 0 24 24"><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="3" strokeDasharray="4 4" /></svg> },
];

// Social Media Icons
const ALL_SOCIAL_MEDIA = [
  { name: 'Instagram', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' },
  { name: 'YouTube', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" fill="currentColor"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg>' },
  { name: 'WhatsApp', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 2C6.486 2 1.986 6.497 1.986 12.041c0 1.765.459 3.491 1.332 5.011L1.93 21.932l4.981-1.306a10.06 10.06 0 0 0 5.12 1.391h.004c5.542 0 10.043-4.498 10.043-10.042 0-2.686-1.045-5.211-2.943-7.11a10.007 10.007 0 0 0-7.104-2.865zm0 18.358h-.002a8.375 8.375 0 0 1-4.27-1.166l-.307-.182-3.175.832.846-3.096-.2-.317A8.347 8.347 0 0 1 3.666 12.04c0-4.618 3.759-8.378 8.379-8.377 2.238 0 4.34.872 5.922 2.455a8.337 8.337 0 0 1 2.453 5.918c-.001 4.619-3.762 8.378-8.389 8.38z"/></svg>' },
  { name: 'TikTok', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.63-.52 3.25-1.55 4.48-1.08 1.3-2.6 2.07-4.26 2.22-1.67.14-3.37-.2-4.75-1.17-1.4-1.01-2.33-2.58-2.53-4.27-.22-1.74.2-3.53 1.16-5 1-1.5 2.58-2.56 4.34-2.92.17-.03.35-.06.52-.08v4.13c-.15.02-.3.04-.45.08-.85.22-1.62.77-2.11 1.48-.48.72-.65 1.65-.46 2.5.18.84.73 1.58 1.45 2 .7.42 1.55.54 2.33.36.81-.19 1.48-.7 1.88-1.42.36-.66.52-1.44.52-2.19V.02h-.01z"/></svg>' },
  { name: 'X', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>' },
  { name: 'Facebook', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.325V1.325C24 .597 23.403 0 22.675 0z"/></svg>' }
];

// Package Colors matching Screenshot 2
const CAN_PACKAGE_COLORS = [
  { id: 'picker', label: 'Color Picker', color: '#ffffff', isPicker: true },
  { id: 'custom-ring', label: 'Custom Tint', color: '#f3f4f6', isCustomRing: true },
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'skin', label: 'Beige Cream', color: '#faeedd' },
  { id: 'black', label: 'Charcoal Black', color: '#262626' },
  { id: 'brown', label: 'Amber Brown', color: '#7c4a27' },
  { id: 'grey', label: 'Metallic Grey', color: '#71717a' },
  { id: 'olive', label: 'Olive Green', color: '#3f5546' },
];

export default function MockupGenerator({ onBack, initialModel = 'can' }: MockupGeneratorProps) {
  // Model state: 'can' or 'water_bottle'
  const [activeModel, setActiveModel] = useState<'can' | 'water_bottle'>(
    initialModel === 'water_bottle' ? 'water_bottle' : 'can'
  );

  // Navigation step: 'landing' (Image 1) or 'editor' (Image 2)
  const [step, setStep] = useState<'landing' | 'editor'>('landing');

  // Can / Bottle Material parameters
  const [packageColor, setPackageColor] = useState<string>('#ffffff');
  const [canMaterialType, setCanMaterialType] = useState<'metal_matt' | 'metal_gloss'>('metal_matt');
  const [bottleMaterialType, setBottleMaterialType] = useState<'plastic_glossy' | 'frosted'>('plastic_glossy');
  const [capColor, setCapColor] = useState<string>('#ffffff');

  // Editor Tabs: 'Uploads' | 'Elements' | 'Text' | 'Tools'
  const [activeTab, setActiveTab] = useState<'Uploads' | 'Elements' | 'Text' | 'Tools'>('Uploads');
  const [expandedElementSection, setExpandedElementSection] = useState<'Shape' | 'Packaging Symbols' | 'Social Media' | null>(null);

  // Decals on Label Canvas
  const [decals, setDecals] = useState<CanvasDecal[]>([]);
  const [selectedDecalId, setSelectedDecalId] = useState<string | null>(null);

  // History for Undo / Redo
  const [history, setHistory] = useState<CanvasDecal[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Uploaded images gallery (with 4 default thumbnails matching Screenshot 2)
  const [galleryImages, setGalleryImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  ]);

  const [canvasZoom, setCanvasZoom] = useState<number>(0.89);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'pointer' | 'hand'>('pointer');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainCanRef = useRef<BeverageCan3DRef>(null);
  const previewCanRef = useRef<BeverageCan3DRef>(null);
  const mainBottleRef = useRef<PlasticWaterBottle3DRef>(null);
  const previewBottleRef = useRef<PlasticWaterBottle3DRef>(null);

  const isCan = activeModel === 'can';
  const labelWidth = isCan ? 784 : 918;
  const labelHeight = isCan ? 472 : 174;

  // Selected Decal for Editing
  const selectedDecal = decals.find(d => d.id === selectedDecalId);

  // Commit to history
  const pushHistory = useCallback((newDecals: CanvasDecal[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newDecals);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setDecals(newDecals);
  }, [history, historyIndex]);

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

  // Add Image Decal
  const handleAddImageDecal = (url: string) => {
    const newDecal: CanvasDecal = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'image',
      url,
      x: isCan ? 180 + (Math.random() * 40 - 20) : 390 + (Math.random() * 40 - 20),
      y: isCan ? 80 : 18,
      width: isCan ? 320 : 138,
      height: isCan ? 320 : 138,
      rotation: 0,
    };
    pushHistory([...decals, newDecal]);
    setSelectedDecalId(newDecal.id);
  };

  // Add Shape Decal
  const handleAddShapeDecal = (shapeType: any) => {
    const newDecal: CanvasDecal = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'shape',
      shapeType,
      x: isCan ? 290 : 410,
      y: isCan ? 150 : 35,
      width: shapeType === 'line' || shapeType === 'dashed-line' ? 240 : 180,
      height: shapeType === 'line' || shapeType === 'dashed-line' ? 30 : 180,
      rotation: 0,
      fillColor: '#3b82f6',
      strokeColor: '#1d4ed8',
      strokeWidth: 0,
    };
    pushHistory([...decals, newDecal]);
    setSelectedDecalId(newDecal.id);
  };

  // Add Symbol / Social Media Decal
  const handleAddSymbolDecal = (svgContent: string) => {
    const newDecal: CanvasDecal = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'symbol',
      svgContent,
      x: isCan ? 320 : 420,
      y: isCan ? 160 : 45,
      width: 120,
      height: 120,
      rotation: 0,
      fillColor: '#0f172a',
    };
    pushHistory([...decals, newDecal]);
    setSelectedDecalId(newDecal.id);
  };

  // Add Text Decal
  const handleAddTextDecal = (preset: 'heading' | 'subheading' | 'body') => {
    const newDecal: CanvasDecal = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'text',
      text: preset === 'heading' ? 'COLD BREW SODA' : preset === 'subheading' ? '100% NATURAL SPARKLING' : '12 FL OZ (355 ML) • RECYCLE',
      fontSize: preset === 'heading' ? 36 : preset === 'subheading' ? 22 : 15,
      fontFamily: 'Inter',
      fontWeight: preset === 'heading' ? 'bold' : preset === 'subheading' ? '600' : 'normal',
      fillColor: '#0f172a',
      textAlign: 'center',
      x: isCan ? 180 : 300,
      y: isCan ? (preset === 'heading' ? 140 : preset === 'subheading' ? 210 : 280) : (preset === 'heading' ? 30 : preset === 'subheading' ? 75 : 120),
      width: isCan ? 420 : 320,
      height: 50,
      rotation: 0,
    };
    pushHistory([...decals, newDecal]);
    setSelectedDecalId(newDecal.id);
  };

  // Update Decal
  const handleUpdateDecal = (id: string, updates: Partial<CanvasDecal>) => {
    const updated = decals.map(d => d.id === id ? { ...d, ...updates } : d);
    setDecals(updated);
  };

  // Remove Decal
  const handleRemoveDecal = (id: string) => {
    pushHistory(decals.filter(d => d.id !== id));
    if (selectedDecalId === id) setSelectedDecalId(null);
  };

  // Duplicate Decal
  const handleDuplicateDecal = (id: string) => {
    const original = decals.find(d => d.id === id);
    if (!original) return;
    const duplicated: CanvasDecal = {
      ...original,
      id: Math.random().toString(36).substring(2, 9),
      x: original.x + 20,
      y: original.y + 15,
    };
    pushHistory([...decals, duplicated]);
    setSelectedDecalId(duplicated.id);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          setGalleryImages(prev => [url, ...prev]);
          handleAddImageDecal(url);
          setStep('editor');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // High-res export
  const handleExport = () => {
    const screenshot = isCan
      ? mainCanRef.current?.getScreenshot()
      : mainBottleRef.current?.getScreenshot();

    if (screenshot) {
      const link = document.createElement('a');
      link.download = isCan ? 'kld_12oz_soda_can.png' : 'kld_water_bottle.png';
      link.href = screenshot;
      link.click();
    }
  };

  // Save to global workspace store
  const handleSaveToWorkspace = async () => {
    const currentModel = isCan ? 'can' : 'water_bottle';
    const categoryName = isCan ? '12 oz Aluminum Soda Can' : 'Plastic Mineral Water Bottle';
    const dimL = isCan ? 207 : 243;
    const dimW = isCan ? 125 : 46;
    const dimH = isCan ? 122 : 46;
    const targetId = 'saved-' + Date.now();
    const targetName = `${categoryName} (${dimL}×${dimW}×${dimH}mm)`;

    if (isCan) {
      useBoxStore.setState({
        boxModel: 'can',
        L: 207 / 25.4,
        W: 125 / 25.4,
        H: 122 / 25.4,
        packageColor: packageColor,
        materialType: canMaterialType,
        decalsByModel: {
          ...useBoxStore.getState().decalsByModel,
          can: decals,
        }
      });
    } else {
      useBoxStore.setState({
        boxModel: 'water_bottle',
        L: 9.567,
        W: 1.811,
        H: 1.811,
        packageColor: packageColor,
        capColor: capColor,
        materialType: bottleMaterialType,
        decalsByModel: {
          ...useBoxStore.getState().decalsByModel,
          water_bottle: decals,
        }
      });
    }

    const savedItem = {
      id: targetId,
      _id: targetId,
      name: targetName,
      type: "MOCKUP",
      category: categoryName,
      boxModel: currentModel,
      variantId: 1,
      dimensions: {
        L: dimL,
        W: dimW,
        H: dimH,
        length: dimL / 25.4,
        width: dimW / 25.4,
        height: dimH / 25.4,
        glueTab: 15,
        tuck: 18,
        flapH: 35
      },
      packageColor: packageColor || null,
      insideColor: null,
      capColor: isCan ? undefined : (capColor || '#ffffff'),
      materialType: isCan ? canMaterialType : bottleMaterialType,
      decals: decals || [],
      tabCategory: "projects",
      isDraft: false,
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately persist to localStorage for instant workspace access
    try {
      const stored = localStorage.getItem('kld_workspace_items');
      const existing = stored ? JSON.parse(stored) : [];
      let updatedList = [];
      if (Array.isArray(existing)) {
        updatedList = [savedItem, ...existing.filter((i: any) => i.id !== targetId && i._id !== targetId)];
      } else {
        updatedList = [savedItem];
      }
      localStorage.setItem('kld_workspace_items', JSON.stringify(updatedList));
    } catch (e) {
      console.error("Failed to save to local storage:", e);
    }

    // 2. Also sync to backend API if available
    try {
      const res = await mockupService.saveDesign(savedItem as any);
      if (res && res.data && res.data.design && res.data.design._id) {
        const mongoId = res.data.design._id;
        savedItem.id = mongoId;
        savedItem._id = mongoId;
        const stored = localStorage.getItem('kld_workspace_items');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const updated = list.map((i: any) => (i.id === targetId || i._id === targetId) ? savedItem : i);
            localStorage.setItem('kld_workspace_items', JSON.stringify(updated));
          }
        }
      }
    } catch (err) {
      console.warn("Backend save skipped or failed, local copy preserved:", err);
    }

    window.dispatchEvent(new CustomEvent('project-saved', { detail: savedItem }));
    setStep('landing');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: MOCKUP GENERATOR LANDING (Matching Screenshot 1)
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-[#e5e5e5] font-sans flex flex-col select-none text-zinc-900">
        {/* Header */}
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2.5 font-bold text-gray-900 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onBack}
            >
              <div className="w-8 h-8 bg-zinc-950 rounded-full flex items-center justify-center text-white shadow-xs">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-[17px] tracking-tight">Mockup Generator</span>
            </div>
            <Menu className="w-5 h-5 text-gray-400 ml-1 cursor-pointer hover:text-gray-700" />
            <Eye className="w-5 h-5 text-gray-400 ml-1 cursor-pointer hover:text-gray-700" />
          </div>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setStep('editor')}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span>3D Design</span>
              <span className="text-gray-400">↗</span>
            </button>

            {/* User Avatar Circle */}
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center border border-amber-300">
                L
              </div>
              <span className="text-gray-400 text-xs font-semibold">+</span>
            </div>

            <button className="p-2 text-gray-500 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
              <Share2 className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={handleExport}
              className="px-5 py-2 bg-[#8b5cf6] text-white rounded-lg text-[13px] font-medium hover:bg-[#7c3aed] transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>Super export</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Vertical Icon Bar */}
          <aside className="w-[70px] bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-6 z-10 shrink-0">
            <button
              onClick={() => setStep('editor')}
              className="flex flex-col items-center gap-1 text-[#8b5cf6] cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-purple-50">
                <Wand2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">Edit</span>
            </button>

            <button
              onClick={() => {
                setActiveModel(prev => prev === 'can' ? 'water_bottle' : 'can');
              }}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              title="Switch Model (Can / Bottle)"
            >
              <div className="p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21 16-9 5-9-5V8l9-5 9 5v8z" />
                </svg>
              </div>
              <span className="text-[10px] font-medium">Models</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700 cursor-pointer">
              <div className="p-2">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">Layout</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700 cursor-pointer">
              <div className="p-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">AI<br />Background</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700 cursor-pointer">
              <div className="p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <span className="text-[10px] font-medium">Video</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700 cursor-pointer">
              <div className="p-2">
                <span className="font-bold text-[16px] leading-none">•••</span>
              </div>
              <span className="text-[10px] font-medium">More</span>
            </button>

            <div className="mt-auto">
              <button
                onClick={() => handleAddTextDecal('heading')}
                className="flex flex-col items-center gap-1 text-[#8b5cf6] cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-[10px] font-medium">AI Design</span>
              </button>
            </div>
          </aside>

          {/* Left Configuration Panel matching Screenshot 1 */}
          <div className="w-[320px] p-5 shrink-0 flex flex-col h-full overflow-y-auto bg-transparent z-10">
            <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-4 border border-gray-100">
              <h2 className="font-bold text-[16px] text-gray-900 tracking-tight">Upload images</h2>

              {/* Upload Box with Purple Dashed Border */}
              <div
                onClick={() => setStep('editor')}
                className="border-2 border-dashed border-purple-300 bg-[#faf5ff] rounded-2xl p-7 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-400 hover:bg-purple-50/80 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100/70 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl text-[13px] font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                  multiple
                />

                <span className="text-[11px] font-medium text-purple-400 tracking-wide">
                  {isCan ? '784 x 472 px' : '918 x 174 px'}
                </span>
              </div>

              {/* Custom Material Dropdown */}
              <div
                onClick={() => {
                  if (isCan) {
                    setCanMaterialType(prev => prev === 'metal_matt' ? 'metal_gloss' : 'metal_matt');
                  } else {
                    setBottleMaterialType(prev => prev === 'plastic_glossy' ? 'frosted' : 'plastic_glossy');
                  }
                }}
                className="border border-gray-200 rounded-xl p-3.5 cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-400 font-medium">Custom material</span>
                  <span className="text-[13px] font-semibold text-gray-800 capitalize">
                    {isCan
                      ? (canMaterialType === 'metal_matt' ? 'Metal matt' : 'Metal gloss')
                      : (bottleMaterialType === 'plastic_glossy' ? 'Plastic Glossy' : 'Frosted PET')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Size Card */}
              <div className="border border-gray-200 rounded-xl p-3.5 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-400 font-medium">Size</span>
                  <span className="text-[13px] font-semibold text-gray-800">
                    {isCan ? '12 oz' : '500 ml'}
                  </span>
                </div>
              </div>

              {/* Find similar with AI */}
              <div
                onClick={() => setStep('editor')}
                className="border border-gray-200 rounded-xl p-3.5 cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors"
              >
                <span className="text-[13px] font-medium text-gray-800">Find similar with AI</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Model ID info footer */}
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pt-1">
                <Info className="w-3.5 h-3.5" />
                <span>
                  Model ID: {isCan ? '550034' : '530040'}
                </span>
              </div>
            </div>
          </div>

          {/* Central 3D Interactive Viewport with Pacdora Realism */}
          <div className="flex-1 relative overflow-hidden bg-[#e2e8f0] flex items-center justify-center">
            {/* Pacdora Studio Neutral Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#f8fafc_0%,_#cbd5e1_100%)] pointer-events-none" />

            {/* 3D Model Canvas */}
            <div className="relative w-full h-full flex items-center justify-center">
              {isCan ? (
                <BeverageCan3D
                  ref={mainCanRef}
                  decals={decals}
                  packageColor={packageColor}
                  materialType={canMaterialType}
                  interactive={true}
                  autoRotate={false}
                  showPlaceholder={decals.length === 0}
                  className="w-full h-full"
                />
              ) : (
                <PlasticWaterBottle3D
                  ref={mainBottleRef}
                  decals={decals}
                  labelColor={packageColor}
                  capColor={capColor}
                  materialType={bottleMaterialType}
                  interactive={true}
                  autoRotate={false}
                  className="w-full h-full"
                />
              )}
            </div>

            {/* Bottom Floating Control Bar matching Screenshot 1 */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200/80 px-4 py-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => isCan ? mainCanRef.current?.zoomOut() : mainBottleRef.current?.zoomOut()}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => isCan ? mainCanRef.current?.zoomIn() : mainBottleRef.current?.zoomIn()}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-[1px] h-5 bg-gray-200" />

                {/* 3D Can wireframe / unwrap icon */}
                <button
                  onClick={() => setStep('editor')}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Unwrap 2D Label / 3D Design"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    if (isCan) mainCanRef.current?.resetCamera();
                    else mainBottleRef.current?.resetCamera();
                  }}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Reset View"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Watermark Free Crown Badge */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200/80 px-4 py-2.5 flex items-center gap-2">
                <Crown className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-[12px] font-semibold text-zinc-800">Watermark free</span>
              </div>
            </div>

            {/* Right Bottom Black Circle Chat Button */}
            <div className="absolute right-6 bottom-6 z-30">
              <button className="w-11 h-11 bg-zinc-950 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: UPLOAD & DESIGN 2D/3D STUDIO (Matching Screenshot 2)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f4f5] font-sans flex flex-col select-none text-zinc-900">
      {/* Top Header: ✕ Upload & Design, Save */}
      <header className="h-[60px] bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep('landing')}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[16px] text-zinc-900">Upload & Design</span>
            <span className="text-[12px] text-zinc-400">
              {isCan ? '• 12 oz Aluminum Can' : '• PET Mineral Water Bottle'}
            </span>
          </div>
        </div>

        {/* Right Purple Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSaveToWorkspace}
            className="px-7 py-2 bg-[#8b5cf6] text-white text-[13px] font-semibold rounded-lg hover:bg-[#7c3aed] transition-colors shadow-sm cursor-pointer"
          >
            Save
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Column: Vertical Toolbar (Uploads, Elements, Text, Tools) matching Screenshot 2 */}
        <div className="flex h-full border-r border-zinc-200 z-10 shadow-xs shrink-0 bg-white">
          <aside className="w-[80px] bg-white flex flex-col items-center py-4 border-r border-zinc-100 gap-5">
            {[
              { id: 'Uploads', label: 'Uploads', icon: <Upload className="w-5 h-5" /> },
              { id: 'Elements', label: 'Elements', icon: <Layers className="w-5 h-5" /> },
              { id: 'Text', label: 'Text', icon: <Type className="w-5 h-5" /> },
              { id: 'Tools', label: 'Tools', icon: <SlidersHorizontal className="w-5 h-5" /> },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setExpandedElementSection(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer w-full py-1.5 transition-colors ${
                    isActive ? 'text-[#8b5cf6]' : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-purple-50 text-[#8b5cf6]' : ''}`}>
                    {tab.icon}
                  </div>
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Subpanel Content */}
          <div className="w-[300px] bg-white flex flex-col justify-between overflow-y-auto p-5 border-r border-zinc-100">
            {/* 1. UPLOADS TAB matching Screenshot 2 */}
            {activeTab === 'Uploads' && (
              <div className="flex flex-col gap-4 h-full">
                {/* Black rounded upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-black text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>JPG, PNG, SVG</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.svg"
                  multiple
                />

                {/* 2-column image gallery matching Screenshot 2 */}
                <div className="grid grid-cols-2 gap-2.5 overflow-y-auto max-h-[460px] pr-1">
                  {galleryImages.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => handleAddImageDecal(url)}
                      className="aspect-square bg-zinc-100 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#8b5cf6] transition-all group relative border border-zinc-200"
                    >
                      <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload progress indicator matching Screenshot 2 */}
                <div className="mt-auto pt-3 border-t border-zinc-100 flex flex-col gap-1.5">
                  <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="w-[20%] h-full bg-zinc-400 rounded-full" />
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {galleryImages.length} / 10000 Uploaded
                  </span>
                </div>
              </div>
            )}

            {/* 2. ELEMENTS TAB */}
            {activeTab === 'Elements' && (
              <div className="flex flex-col gap-4 h-full">
                <h3 className="font-bold text-[15px] text-zinc-900 pb-2 border-b border-zinc-100">Elements</h3>

                {/* Shapes */}
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-zinc-700">Shapes</span>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_SHAPES.map(s => (
                      <button
                        key={s.name}
                        onClick={() => handleAddShapeDecal(s.type)}
                        className="aspect-square bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center p-2 cursor-pointer hover:border-[#8b5cf6] hover:bg-purple-50/50 transition-all text-zinc-700"
                        title={s.name}
                      >
                        {s.render()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Packaging Symbols */}
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
                  <span className="text-[12px] font-bold text-zinc-700">Packaging Symbols</span>
                  <div className="grid grid-cols-4 gap-2">
                    {packagingSymbols.slice(0, 8).map(sym => (
                      <button
                        key={sym.id}
                        onClick={() => handleAddSymbolDecal(sym.svg)}
                        className="aspect-square bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center p-2.5 cursor-pointer hover:border-[#8b5cf6] hover:bg-purple-50/50 transition-all text-zinc-700 [&>svg]:w-6 [&>svg]:h-6"
                        title={sym.name}
                        dangerouslySetInnerHTML={{ __html: sym.svg }}
                      />
                    ))}
                  </div>
                </div>

                {/* Social Media */}
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
                  <span className="text-[12px] font-bold text-zinc-700">Social Media</span>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_SOCIAL_MEDIA.map(sm => (
                      <button
                        key={sm.name}
                        onClick={() => handleAddSymbolDecal(sm.svg)}
                        className="aspect-square bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center p-2.5 cursor-pointer hover:border-[#8b5cf6] hover:bg-purple-50/50 transition-all text-zinc-700 [&>svg]:w-6 [&>svg]:h-6"
                        title={sm.name}
                        dangerouslySetInnerHTML={{ __html: sm.svg }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. TEXT TAB */}
            {activeTab === 'Text' && (
              <div className="flex flex-col gap-4 h-full">
                <h3 className="font-bold text-[15px] text-zinc-900 pb-2 border-b border-zinc-100">Add Text</h3>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleAddTextDecal('heading')}
                    className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[16px] font-bold text-zinc-900 transition-colors text-left px-4 cursor-pointer"
                  >
                    Add a heading
                  </button>
                  <button
                    onClick={() => handleAddTextDecal('subheading')}
                    className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[14px] font-semibold text-zinc-800 transition-colors text-left px-4 cursor-pointer"
                  >
                    Add a subheading
                  </button>
                  <button
                    onClick={() => handleAddTextDecal('body')}
                    className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[12px] font-normal text-zinc-600 transition-colors text-left px-4 cursor-pointer"
                  >
                    Add body text
                  </button>
                </div>

                {selectedDecal && selectedDecal.type === 'text' && (
                  <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-zinc-100">
                    <span className="text-[12px] font-bold text-zinc-700">Text Settings</span>
                    <input
                      type="text"
                      value={selectedDecal.text || ''}
                      onChange={(e) => handleUpdateDecal(selectedDecal.id, { text: e.target.value })}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-[#8b5cf6]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="12"
                        max="96"
                        value={selectedDecal.fontSize || 36}
                        onChange={(e) => handleUpdateDecal(selectedDecal.id, { fontSize: Number(e.target.value) })}
                        className="w-20 px-2 py-1 border border-zinc-200 rounded-lg text-[13px] text-center"
                      />
                      <button
                        onClick={() => handleUpdateDecal(selectedDecal.id, {
                          fontWeight: selectedDecal.fontWeight === 'bold' ? 'normal' : 'bold'
                        })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${selectedDecal.fontWeight === 'bold' ? 'bg-purple-50 border-purple-300 text-purple-600' : 'border-zinc-200'}`}
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateDecal(selectedDecal.id, {
                          fontStyle: selectedDecal.fontStyle === 'italic' ? 'normal' : 'italic'
                        })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${selectedDecal.fontStyle === 'italic' ? 'bg-purple-50 border-purple-300 text-purple-600' : 'border-zinc-200'}`}
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <input
                        type="color"
                        value={selectedDecal.fillColor || '#000000'}
                        onChange={(e) => handleUpdateDecal(selectedDecal.id, { fillColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-zinc-200 cursor-pointer p-0.5"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. TOOLS TAB */}
            {activeTab === 'Tools' && (
              <div className="flex flex-col gap-4 h-full">
                <h3 className="font-bold text-[15px] text-zinc-900 pb-2 border-b border-zinc-100">Can Options</h3>

                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-semibold text-zinc-700">Material Finish</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCanMaterialType('metal_matt')}
                      className={`py-2 px-3 rounded-xl border text-[12px] font-medium cursor-pointer ${
                        canMaterialType === 'metal_matt' ? 'bg-purple-50 border-purple-400 text-purple-700 font-semibold' : 'border-zinc-200'
                      }`}
                    >
                      Metal Matt
                    </button>
                    <button
                      onClick={() => setCanMaterialType('metal_gloss')}
                      className={`py-2 px-3 rounded-xl border text-[12px] font-medium cursor-pointer ${
                        canMaterialType === 'metal_gloss' ? 'bg-purple-50 border-purple-400 text-purple-700 font-semibold' : 'border-zinc-200'
                      }`}
                    >
                      Metal Gloss
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
                  <span className="text-[12px] font-semibold text-zinc-700">Size Preset</span>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] font-medium text-zinc-800">
                    Standard 12 oz (355 ml)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Workspace: 2D Unwrapped Label Canvas matching Screenshot 2 */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-[#f4f4f6]">
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6">
            {isCan ? (
              <CanLabelCanvas
                labelWidthPx={784}
                labelHeightPx={472}
                decals={decals}
                packageColor={packageColor}
                onUpdateDecal={handleUpdateDecal}
                onRemoveDecal={handleRemoveDecal}
                onDuplicateDecal={handleDuplicateDecal}
                selectedId={selectedDecalId}
                onSelectDecal={setSelectedDecalId}
                zoom={canvasZoom}
                showGuides={showGuides}
              />
            ) : (
              <WaterBottleLabelCanvas
                labelWidthMm={243}
                labelHeightMm={46}
                decals={decals}
                labelColor={packageColor}
                onUpdateDecal={handleUpdateDecal}
                onRemoveDecal={handleRemoveDecal}
                onDuplicateDecal={handleDuplicateDecal}
                selectedId={selectedDecalId}
                onSelectDecal={setSelectedDecalId}
                zoom={canvasZoom}
              />
            )}
          </div>

          {/* Bottom Floating Toolbar matching Screenshot 2 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center px-3 py-1.5 gap-2 border border-zinc-200 z-30">
            <button
              onClick={() => setActiveTool('pointer')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                activeTool === 'pointer' ? 'text-[#8b5cf6] bg-purple-50' : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <MousePointer2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('hand')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                activeTool === 'hand' ? 'text-[#8b5cf6] bg-purple-50' : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <Hand className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-lg ${historyIndex > 0 ? 'text-zinc-600 hover:bg-zinc-50 cursor-pointer' : 'text-zinc-300'}`}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-lg ${historyIndex < history.length - 1 ? 'text-zinc-600 hover:bg-zinc-50 cursor-pointer' : 'text-zinc-300'}`}
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer" title="Comment">
              <MessageSquare className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <button
              onClick={() => setCanvasZoom((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[12px] font-semibold text-zinc-600 px-1 min-w-[42px] text-center">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              onClick={() => setCanvasZoom((prev) => Math.min(2.0, Number((prev + 0.1).toFixed(2))))}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <button
              onClick={() => setShowGuides(prev => !prev)}
              className={`p-1.5 rounded-lg cursor-pointer ${showGuides ? 'text-[#8b5cf6]' : 'text-zinc-400'}`}
              title="Toggle Guidelines"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer" title="Toggle Visibility">
              <Eye className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <div className="flex items-center gap-1 text-amber-500 font-bold text-[12px] bg-amber-50 px-2 py-0.5 rounded-md">
              <span>✦</span> 10
            </div>
          </div>
        </div>

        {/* Right Sidebar: 3D Live Preview & Package Color matching Screenshot 2 */}
        <div className="w-[340px] bg-white border-l border-zinc-200 shadow-[-4px_0_20px_rgba(0,0,0,0.02)] flex flex-col p-6 overflow-y-auto gap-6 z-10">
          {/* Top 3D Live Preview Window with 3D badge */}
          <div className="bg-[#e9eaee] rounded-[24px] p-2 flex flex-col relative h-[360px] overflow-hidden shadow-inner group">
            <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-zinc-700 flex items-center gap-1 shadow-xs border border-white/60">
              <span>3D</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </div>

            <div className="w-full h-full relative">
              {isCan ? (
                <BeverageCan3D
                  ref={previewCanRef}
                  decals={decals}
                  packageColor={packageColor}
                  materialType={canMaterialType}
                  interactive={true}
                  autoRotate={true}
                  autoRotateSpeed={0.8}
                  showPlaceholder={decals.length === 0}
                  className="w-full h-full"
                />
              ) : (
                <PlasticWaterBottle3D
                  ref={previewBottleRef}
                  decals={decals}
                  labelColor={packageColor}
                  capColor={capColor}
                  materialType={bottleMaterialType}
                  interactive={true}
                  autoRotate={true}
                  autoRotateSpeed={0.8}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>

          {/* Package Color Palette matching Screenshot 2 */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs flex flex-col gap-3">
            <span className="text-[14px] font-bold text-zinc-900 tracking-tight">Package Color</span>

            <div className="flex items-center gap-2 flex-wrap">
              {CAN_PACKAGE_COLORS.map((c) => {
                const isSelected = packageColor === c.color;

                if (c.isPicker) {
                  return (
                    <label
                      key={c.id}
                      className="w-7 h-7 rounded-full cursor-pointer relative shadow-xs flex items-center justify-center border border-zinc-300 hover:border-purple-500 transition-all hover:scale-110"
                      title="Custom Color Picker"
                    >
                      <Plus className="w-3.5 h-3.5 text-zinc-600" />
                      <input
                        type="color"
                        value={packageColor}
                        onChange={(e) => setPackageColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  );
                }

                if (c.isCustomRing) {
                  return (
                    <button
                      key={c.id}
                      onClick={() => setPackageColor('#ffffff')}
                      className="w-7 h-7 rounded-full cursor-pointer relative shadow-xs border-2 border-purple-500 flex items-center justify-center transition-transform hover:scale-110"
                      title="Default Aluminum Base"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    </button>
                  );
                }

                return (
                  <button
                    key={c.id}
                    onClick={() => setPackageColor(c.color)}
                    className={`w-7 h-7 rounded-full cursor-pointer shadow-xs border border-zinc-200 transition-transform hover:scale-110 ${
                      isSelected ? 'ring-2 ring-purple-600 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>

          {/* Cap Color Palette (when Water Bottle is active) */}
          {!isCan && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-zinc-900 tracking-tight">Bottle Cap Color</span>
                <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase">{capColor}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Custom Color Picker */}
                <label
                  className="w-7 h-7 rounded-full cursor-pointer relative shadow-xs flex items-center justify-center border border-zinc-300 hover:border-purple-500 transition-all hover:scale-110"
                  title="Custom Cap Color Picker"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-600" />
                  <input
                    type="color"
                    value={capColor}
                    onChange={(e) => setCapColor(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>

                {/* Preset Cap Colors */}
                {[
                  { name: 'Pure White', color: '#ffffff' },
                  { name: 'Sky Blue', color: '#38bdf8' },
                  { name: 'Royal Blue', color: '#2563eb' },
                  { name: 'Emerald', color: '#16a34a' },
                  { name: 'Red', color: '#dc2626' },
                  { name: 'Yellow', color: '#eab308' },
                  { name: 'Black', color: '#18181b' },
                ].map((c) => {
                  const isSelected = capColor.toLowerCase() === c.color.toLowerCase();
                  return (
                    <button
                      key={c.color}
                      onClick={() => setCapColor(c.color)}
                      className={`w-7 h-7 rounded-full cursor-pointer shadow-xs border border-zinc-200 transition-transform hover:scale-110 ${
                        isSelected ? 'ring-2 ring-purple-600 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSaveToWorkspace}
              className="w-full py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl text-[13px] font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Apply to 3D Mockup
            </button>
            <button
              onClick={() => setDecals([])}
              className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl text-[12px] font-medium transition-colors cursor-pointer border border-zinc-200"
            >
              Clear Label Artwork
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}