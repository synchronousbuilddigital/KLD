import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu, Eye, Share2, MousePointer2, Hand, MessageSquare, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize2, Plus, Minus, Download, Upload, X,
  LayoutTemplate, Wand2, Grid, Image as ImageIcon, Sparkles, ChevronRight,
  Info, Crown, Layers, Type, SlidersHorizontal, Check, RefreshCw,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Trash2, ArrowUp, ArrowDown
} from 'lucide-react';
import PlasticWaterBottle3D, { PlasticWaterBottle3DRef, CanvasDecal } from './components/3d/PlasticWaterBottle3D';
import WaterBottleLabelCanvas from './components/3d/WaterBottleLabelCanvas';
import { packagingSymbols } from '../lib/packagingSymbols';
import './MockupGenerator.css';

interface MockupGeneratorProps {
  onBack: () => void;
  initialModel?: string;
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

// Social Media Icons matching EditorModal
const ALL_SOCIAL_MEDIA = [
  { name: 'Instagram', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' },
  { name: 'YouTube', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" fill="currentColor"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg>' },
  { name: 'WhatsApp', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 2C6.486 2 1.986 6.497 1.986 12.041c0 1.765.459 3.491 1.332 5.011L1.93 21.932l4.981-1.306a10.06 10.06 0 0 0 5.12 1.391h.004c5.542 0 10.043-4.498 10.043-10.042 0-2.686-1.045-5.211-2.943-7.11a10.007 10.007 0 0 0-7.104-2.865zm0 18.358h-.002a8.375 8.375 0 0 1-4.27-1.166l-.307-.182-3.175.832.846-3.096-.2-.317A8.347 8.347 0 0 1 3.666 12.04c0-4.618 3.759-8.378 8.379-8.377 2.238 0 4.34.872 5.922 2.455a8.337 8.337 0 0 1 2.453 5.918c-.001 4.619-3.762 8.378-8.389 8.38z"/></svg>' },
  { name: 'TikTok', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.63-.52 3.25-1.55 4.48-1.08 1.3-2.6 2.07-4.26 2.22-1.67.14-3.37-.2-4.75-1.17-1.4-1.01-2.33-2.58-2.53-4.27-.22-1.74.2-3.53 1.16-5 1-1.5 2.58-2.56 4.34-2.92.17-.03.35-.06.52-.08v4.13c-.15.02-.3.04-.45.08-.85.22-1.62.77-2.11 1.48-.48.72-.65 1.65-.46 2.5.18.84.73 1.58 1.45 2 .7.42 1.55.54 2.33.36.81-.19 1.48-.7 1.88-1.42.36-.66.52-1.44.52-2.19V.02h-.01z"/></svg>' },
  { name: 'X', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>' },
  { name: 'Facebook', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.325V1.325C24 .597 23.403 0 22.675 0z"/></svg>' }
];

const PACKAGE_COLORS = [
  { id: 'wheel', label: 'Custom', color: '#ffffff', isWheel: true },
  { id: 'transparent', label: 'Clear Film', color: 'transparent', isChecker: true },
  { id: 'white', label: 'Pure White', color: '#ffffff' },
  { id: 'green', label: 'Mineral Green', color: '#006b2b' },
  { id: 'kraft', label: 'Beige Kraft', color: '#c2a078' },
  { id: 'dark-green', label: 'Forest Green', color: '#064e3b' },
  { id: 'charcoal', label: 'Charcoal', color: '#1e293b' },
  { id: 'brown', label: 'Amber Brown', color: '#78350f' },
];

export default function MockupGenerator({ onBack }: MockupGeneratorProps) {
  // Navigation step: 'landing' (Image 1) or 'editor' (Image 2)
  const [step, setStep] = useState<'landing' | 'editor'>('landing');

  // Bottle parameters
  const [packageColor, setPackageColor] = useState<string>('#ffffff'); // Pure White Pacdora default
  const [materialType, setMaterialType] = useState<'plastic_glossy' | 'frosted' | 'tinted'>('plastic_glossy');
  const [capColor, setCapColor] = useState<string>('#ffffff');
  const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);

  // Editor Tabs: 'Uploads' | 'Elements' | 'Text' | 'Layers' | 'Tools'
  const [activeTab, setActiveTab] = useState<'Uploads' | 'Elements' | 'Text' | 'Layers' | 'Tools'>('Uploads');
  const [expandedElementSection, setExpandedElementSection] = useState<'Shape' | 'Packaging Symbols' | 'Social Media' | null>(null);

  // Decals on Label Canvas
  const [decals, setDecals] = useState<CanvasDecal[]>([]);
  const [selectedDecalId, setSelectedDecalId] = useState<string | null>(null);

  // History for Undo / Redo
  const [history, setHistory] = useState<CanvasDecal[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Uploaded images gallery
  const [galleryImages, setGalleryImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  ]);

  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainBottleRef = useRef<PlasticWaterBottle3DRef>(null);
  const previewBottleRef = useRef<PlasticWaterBottle3DRef>(null);

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
      x: 390 + (Math.random() * 40 - 20),
      y: 18,
      width: 138,
      height: 138,
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
      x: 410,
      y: 35,
      width: shapeType === 'line' || shapeType === 'dashed-line' ? 140 : 100,
      height: shapeType === 'line' || shapeType === 'dashed-line' ? 20 : 100,
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
      x: 420,
      y: 45,
      width: 75,
      height: 75,
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
      text: preset === 'heading' ? 'PURE MINERAL' : preset === 'subheading' ? 'NATURAL ARTESIAN WATER' : '500 ML • RECYCLABLE PET',
      fontSize: preset === 'heading' ? 32 : preset === 'subheading' ? 20 : 14,
      fontFamily: 'Inter',
      fontWeight: preset === 'heading' ? 'bold' : preset === 'subheading' ? '600' : 'normal',
      fillColor: '#0f172a',
      textAlign: 'center',
      x: 300,
      y: preset === 'heading' ? 30 : preset === 'subheading' ? 75 : 120,
      width: 320,
      height: 40,
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
    if (mainBottleRef.current) {
      const dataUrl = mainBottleRef.current.getScreenshot();
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = 'pacdora_plastic_mineral_water_bottle.png';
        link.href = dataUrl;
        link.click();
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: MOCKUP GENERATOR LANDING (Matching Image 1 with Pacdora Realism)
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
              onClick={() => setStep('editor')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700 cursor-pointer"
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

          {/* Left Configuration Panel */}
          <div className="w-[320px] p-5 shrink-0 flex flex-col h-full overflow-y-auto bg-transparent z-10">
            <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-4 border border-gray-100">
              <h2 className="font-bold text-[16px] text-gray-900 tracking-tight">Upload images</h2>

              {/* Upload Box */}
              <div
                onClick={() => setStep('editor')}
                className="border-2 border-dashed border-purple-200 bg-[#faf5ff] rounded-2xl p-7 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-400 hover:bg-purple-50/80 transition-all group"
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
                  918 × 174 px
                </span>
              </div>

              {/* Material Dropdown */}
              <div
                onClick={() => {
                  setMaterialType(prev => prev === 'plastic_glossy' ? 'frosted' : 'plastic_glossy');
                }}
                className="border border-gray-200 rounded-xl p-3.5 cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-400 font-medium">Custom material</span>
                  <span className="text-[13px] font-semibold text-gray-800 capitalize">
                    {materialType === 'plastic_glossy' ? 'Plastic Glossy' : 'Frosted PET Plastic'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Customize this model */}
              <div
                onClick={() => setStep('editor')}
                className="border border-gray-200 rounded-xl p-3.5 cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors"
              >
                <span className="text-[13px] font-medium text-gray-800">Customize this model</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Find similar with AI */}
              <div
                onClick={() => setStep('editor')}
                className="border border-gray-200 rounded-xl p-3.5 cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors"
              >
                <span className="text-[13px] font-medium text-gray-800">Find similar with AI</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pt-1">
                <Info className="w-3.5 h-3.5" />
                <span>Model ID: 530040 (PET Mineral Water Bottle)</span>
              </div>
            </div>
          </div>

          {/* Central 3D Interactive Viewport with Pacdora Realism */}
          <div className="flex-1 relative overflow-hidden bg-[#e2e8f0] flex items-center justify-center">
            {/* Pacdora Studio Neutral Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#f8fafc_0%,_#cbd5e1_100%)] pointer-events-none" />

            {/* 3D Bottle Canvas */}
            <div className="relative w-full h-full flex items-center justify-center">
              <PlasticWaterBottle3D
                ref={mainBottleRef}
                decals={decals}
                labelColor={packageColor}
                capColor={capColor}
                materialType={materialType}
                interactive={true}
                autoRotate={false}
                className="w-full h-full"
              />
            </div>

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200/80 px-4 py-2 flex items-center gap-3 z-30">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => mainBottleRef.current?.zoomOut()}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => mainBottleRef.current?.zoomIn()}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="w-[1px] h-5 bg-gray-200" />

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

              <div className="w-[1px] h-5 bg-gray-200" />

              <div className="flex items-center gap-1.5 text-amber-600 text-[12px] font-bold px-2 py-0.5 bg-amber-50/80 rounded-md">
                <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Watermark free</span>
              </div>
            </div>

            {/* Right Floating Vertical Toolbar */}
            <div className="absolute right-6 top-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200/80 p-2 flex flex-col gap-2 z-30">
              <button className="p-2 text-[#8b5cf6] bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer">
                <MousePointer2 className="w-4.5 h-4.5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                <Hand className="w-4.5 h-4.5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                <MessageSquare className="w-4.5 h-4.5" />
              </button>
              <div className="h-[1px] w-5 bg-gray-200 mx-auto" />
              <button
                onClick={() => mainBottleRef.current?.resetCamera()}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Reset Camera"
              >
                <Undo2 className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => mainBottleRef.current?.toggleAutoRotate()}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Rotate 360°"
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: UPLOAD & DESIGN 2D/3D STUDIO (Matching EditorModal features)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f4f5] font-sans flex flex-col select-none text-zinc-900">
      {/* Top Header: Logo, Undo/Redo, All changes saved, Save */}
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
            <span className="text-[12px] text-zinc-400">• PET Mineral Water Bottle</span>
          </div>
        </div>

        {/* Center: Undo / Redo & Save status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-zinc-200 pr-3">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-md ${historyIndex > 0 ? 'text-zinc-700 hover:bg-zinc-100 cursor-pointer' : 'text-zinc-300'}`}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-md ${historyIndex < history.length - 1 ? 'text-zinc-700 hover:bg-zinc-100 cursor-pointer' : 'text-zinc-300'}`}
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>All changes saved</span>
          </div>
        </div>

        <button
          onClick={() => setStep('landing')}
          className="px-6 py-2 bg-[#8b5cf6] text-white text-[13px] font-semibold rounded-lg hover:bg-[#7c3aed] transition-colors shadow-sm cursor-pointer"
        >
          Save
        </button>
      </header>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Column: Vertical Toolbar (Uploads, Elements, Text, Layers, Tools) */}
        <div className="flex h-full border-r border-zinc-200 z-10 shadow-xs shrink-0 bg-white">
          <aside className="w-[80px] bg-white flex flex-col items-center py-4 border-r border-zinc-100 gap-5">
            {[
              { id: 'Uploads', label: 'Uploads', icon: <Upload className="w-5 h-5" /> },
              { id: 'Elements', label: 'Elements', icon: <Layers className="w-5 h-5" /> },
              { id: 'Text', label: 'Text', icon: <Type className="w-5 h-5" /> },
              { id: 'Layers', label: 'Layers', icon: <Grid className="w-5 h-5" /> },
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

            <div className="mt-auto">
              <button
                onClick={() => handleAddTextDecal('heading')}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-400 flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                title="AI Packaging Assistant"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </aside>

          {/* Subpanel Content matching EditorModal */}
          <div className="w-[320px] bg-white flex flex-col justify-between overflow-y-auto p-5 border-r border-zinc-100">
            {/* 1. UPLOADS TAB */}
            {activeTab === 'Uploads' && (
              <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h3 className="font-bold text-[15px] text-zinc-900">Upload images</h3>
                  <span className="text-[11px] text-zinc-400 font-medium">918 × 174 px</span>
                </div>

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

                <span className="text-[12px] text-zinc-400">Click to place onto the 2D label:</span>

                <div className="grid grid-cols-2 gap-2.5 overflow-y-auto max-h-[380px] pr-1">
                  {galleryImages.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => handleAddImageDecal(url)}
                      className="w-full aspect-square border border-zinc-200 rounded-xl overflow-hidden hover:border-[#8b5cf6] transition-all relative group cursor-pointer bg-zinc-50 shadow-xs"
                      title="Add to label"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Plus className="w-6 h-6 text-white stroke-[2.5]" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-1.5">
                  <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full w-[25%]" />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {galleryImages.length} / 10000 Uploaded
                  </span>
                </div>
              </div>
            )}

            {/* 2. ELEMENTS TAB (Shapes, Packaging Symbols, Social Media) */}
            {activeTab === 'Elements' && (
              <div className="flex flex-col gap-4 h-full">
                {expandedElementSection ? (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setExpandedElementSection(null)}
                      className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 text-[13px] font-semibold cursor-pointer pb-2 border-b border-zinc-100"
                    >
                      <span>← Back to Elements</span>
                    </button>
                    <h4 className="font-bold text-[14px] text-zinc-900">{expandedElementSection}</h4>

                    {expandedElementSection === 'Shape' && (
                      <div className="grid grid-cols-3 gap-2">
                        {ALL_SHAPES.map(shape => (
                          <div
                            key={shape.name}
                            onClick={() => handleAddShapeDecal(shape.type)}
                            className="aspect-square bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer hover:border-[#8b5cf6] hover:bg-purple-50/50 transition-all text-zinc-700"
                            title={shape.name}
                          >
                            {shape.render()}
                            <span className="text-[9px] text-zinc-500 mt-1 truncate">{shape.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {expandedElementSection === 'Packaging Symbols' && (
                      <div className="grid grid-cols-3 gap-2">
                        {packagingSymbols.map(sym => (
                          <div
                            key={sym.name}
                            onClick={() => handleAddSymbolDecal(sym.svg)}
                            className="aspect-square bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center p-3 cursor-pointer hover:border-[#8b5cf6] hover:bg-purple-50/50 transition-all text-zinc-700 [&>svg]:w-full [&>svg]:h-full"
                            title={sym.name}
                            dangerouslySetInnerHTML={{ __html: sym.svg }}
                          />
                        ))}
                      </div>
                    )}

                    {expandedElementSection === 'Social Media' && (
                      <div className="grid grid-cols-3 gap-2">
                        {ALL_SOCIAL_MEDIA.map(sm => (
                          <div
                            key={sm.name}
                            onClick={() => handleAddSymbolDecal(sm.svg)}
                            className="aspect-square bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center p-2.5 cursor-pointer hover:border-[#8b5cf6] hover:bg-purple-50/50 transition-all text-zinc-700 [&>svg]:w-6 [&>svg]:h-6"
                            title={sm.name}
                          >
                            <div dangerouslySetInnerHTML={{ __html: sm.svg }} />
                            <span className="text-[9px] text-zinc-500 mt-1 truncate">{sm.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 overflow-y-auto pr-1">
                    {/* Shapes Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[14px] text-zinc-800">Shapes</span>
                        <button
                          onClick={() => setExpandedElementSection('Shape')}
                          className="text-[12px] text-[#8b5cf6] font-semibold hover:underline cursor-pointer"
                        >
                          More
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {ALL_SHAPES.slice(0, 4).map(shape => (
                          <div
                            key={shape.name}
                            onClick={() => handleAddShapeDecal(shape.type)}
                            className="aspect-square bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#8b5cf6] hover:bg-purple-50/50 transition-all text-zinc-700"
                            title={shape.name}
                          >
                            {shape.render()}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Packaging Symbols Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[14px] text-zinc-800">Packaging Symbols</span>
                        <button
                          onClick={() => setExpandedElementSection('Packaging Symbols')}
                          className="text-[12px] text-[#8b5cf6] font-semibold hover:underline cursor-pointer"
                        >
                          More
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {packagingSymbols.slice(0, 4).map(sym => (
                          <div
                            key={sym.name}
                            onClick={() => handleAddSymbolDecal(sym.svg)}
                            className="aspect-square bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center p-2.5 cursor-pointer hover:border-[#8b5cf6] hover:bg-purple-50/50 transition-all text-zinc-700 [&>svg]:w-full [&>svg]:h-full"
                            title={sym.name}
                            dangerouslySetInnerHTML={{ __html: sym.svg }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Social Media Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[14px] text-zinc-800">Social Media</span>
                        <button
                          onClick={() => setExpandedElementSection('Social Media')}
                          className="text-[12px] text-[#8b5cf6] font-semibold hover:underline cursor-pointer"
                        >
                          More
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {ALL_SOCIAL_MEDIA.slice(0, 4).map(sm => (
                          <div
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

                {/* If text decal is selected, show rich formatting controls */}
                {selectedDecal && selectedDecal.type === 'text' && (
                  <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-zinc-100">
                    <span className="text-[12px] font-bold text-zinc-700">Text Settings</span>

                    {/* Edit text content */}
                    <input
                      type="text"
                      value={selectedDecal.text || ''}
                      onChange={(e) => handleUpdateDecal(selectedDecal.id, { text: e.target.value })}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-[#8b5cf6]"
                    />

                    {/* Font family */}
                    <select
                      value={selectedDecal.fontFamily || 'Inter'}
                      onChange={(e) => handleUpdateDecal(selectedDecal.id, { fontFamily: e.target.value })}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-[13px] bg-white outline-none cursor-pointer"
                    >
                      <option value="Inter">Inter (Sans-Serif)</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Playfair Display">Playfair Display (Serif)</option>
                      <option value="Courier New">Courier New (Mono)</option>
                    </select>

                    {/* Size and Style */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        max="72"
                        value={selectedDecal.fontSize || 24}
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

            {/* 4. LAYERS TAB */}
            {activeTab === 'Layers' && (
              <div className="flex flex-col gap-3 h-full">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h3 className="font-bold text-[15px] text-zinc-900">Layers</h3>
                  <span className="text-[11px] text-zinc-400 font-medium">{decals.length} elements</span>
                </div>

                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[420px] pr-1">
                  {decals.length === 0 ? (
                    <span className="text-[12px] text-zinc-400 py-6 text-center">No layers placed yet</span>
                  ) : (
                    decals.map((d, index) => {
                      const isSelected = selectedDecalId === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDecalId(d.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected ? 'bg-purple-50 border-purple-300' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          <span className="text-[12px] font-semibold text-zinc-700 capitalize truncate max-w-[150px]">
                            {d.type === 'text' ? d.text || 'Text' : d.type === 'shape' ? d.shapeType : d.type}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (index > 0) {
                                  const updated = [...decals];
                                  const temp = updated[index];
                                  updated[index] = updated[index - 1];
                                  updated[index - 1] = temp;
                                  pushHistory(updated);
                                }
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-700"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (index < decals.length - 1) {
                                  const updated = [...decals];
                                  const temp = updated[index];
                                  updated[index] = updated[index + 1];
                                  updated[index + 1] = temp;
                                  pushHistory(updated);
                                }
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-700"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDecal(d.id);
                              }}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Delete Layer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 5. TOOLS TAB */}
            {activeTab === 'Tools' && (
              <div className="flex flex-col gap-4 h-full">
                <h3 className="font-bold text-[15px] text-zinc-900 pb-2 border-b border-zinc-100">Bottle Options</h3>

                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-semibold text-zinc-700">Material Finish</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMaterialType('plastic_glossy')}
                      className={`py-2 px-3 rounded-xl border text-[12px] font-medium cursor-pointer ${
                        materialType === 'plastic_glossy' ? 'bg-purple-50 border-purple-400 text-purple-700 font-semibold' : 'border-zinc-200'
                      }`}
                    >
                      Plastic Glossy
                    </button>
                    <button
                      onClick={() => setMaterialType('frosted')}
                      className={`py-2 px-3 rounded-xl border text-[12px] font-medium cursor-pointer ${
                        materialType === 'frosted' ? 'bg-purple-50 border-purple-400 text-purple-700 font-semibold' : 'border-zinc-200'
                      }`}
                    >
                      Frosted PET
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-semibold text-zinc-700">Cap Color</span>
                  <div className="flex gap-2">
                    {['#ffffff', '#0284c7', '#006b2b', '#1e293b', '#dc2626'].map(color => (
                      <button
                        key={color}
                        onClick={() => setCapColor(color)}
                        className={`w-7 h-7 rounded-full border border-zinc-300 shadow-xs cursor-pointer ${
                          capColor === color ? 'ring-2 ring-purple-600 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Workspace: 2D Unwrapped Label Canvas */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-[#fdfdfd]">
          <div className="flex-1 relative overflow-hidden">
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
          </div>

          {/* Bottom Floating Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center px-3 py-1.5 gap-2 border border-zinc-100 z-30">
            <button className="p-1.5 text-[#8b5cf6] bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer">
              <MousePointer2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg cursor-pointer">
              <Hand className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-lg ${historyIndex > 0 ? 'text-zinc-600 hover:bg-zinc-50 cursor-pointer' : 'text-zinc-300'}`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-lg ${historyIndex < history.length - 1 ? 'text-zinc-600 hover:bg-zinc-50 cursor-pointer' : 'text-zinc-300'}`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <button
              onClick={() => setCanvasZoom((prev) => Math.max(0.5, prev - 0.1))}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[12px] font-semibold text-zinc-600 px-1 min-w-[42px] text-center">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              onClick={() => setCanvasZoom((prev) => Math.min(2.0, prev + 0.1))}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <div className="flex items-center gap-1 text-amber-500 font-bold text-[12px] bg-amber-50 px-2 py-0.5 rounded-md">
              <span>✦</span> 10
            </div>
          </div>
        </div>

        {/* Right Sidebar: 3D Water Bottle Preview & Package Color */}
        <div className="w-[340px] bg-white border-l border-zinc-200 shadow-[-4px_0_20px_rgba(0,0,0,0.02)] flex flex-col p-6 overflow-y-auto gap-6 z-10">
          {/* Top 3D Live Preview Window */}
          <div className="bg-[#e9eaee] rounded-[24px] p-2 flex flex-col relative h-[360px] overflow-hidden shadow-inner group">
            <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-zinc-700 flex items-center gap-1 shadow-xs border border-white/60">
              <span>3D</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </div>

            <div className="w-full h-full relative">
              <PlasticWaterBottle3D
                ref={previewBottleRef}
                decals={decals}
                labelColor={packageColor}
                capColor={capColor}
                materialType={materialType}
                interactive={true}
                autoRotate={true}
                autoRotateSpeed={0.8}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Package Color Palette */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs flex flex-col gap-3">
            <span className="text-[14px] font-bold text-zinc-900 tracking-tight">Package Color</span>

            <div className="flex items-center gap-2 flex-wrap">
              {PACKAGE_COLORS.map((c) => {
                const isSelected = packageColor === c.color;

                if (c.isWheel) {
                  return (
                    <label
                      key={c.id}
                      className={`w-7 h-7 rounded-full cursor-pointer relative shadow-xs flex items-center justify-center border border-zinc-200 transition-transform hover:scale-110 ${
                        isSelected ? 'ring-2 ring-purple-600 ring-offset-2' : ''
                      }`}
                      style={{
                        background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                      }}
                      title="Custom Color"
                    >
                      <input
                        type="color"
                        value={packageColor === 'transparent' ? '#ffffff' : packageColor}
                        onChange={(e) => setPackageColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  );
                }

                if (c.isChecker) {
                  return (
                    <button
                      key={c.id}
                      onClick={() => setPackageColor('transparent')}
                      className={`w-7 h-7 rounded-full cursor-pointer relative shadow-xs border border-zinc-300 transition-transform hover:scale-110 ${
                        isSelected ? 'ring-2 ring-purple-600 ring-offset-2' : ''
                      }`}
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                      }}
                      title="Clear Transparent Film"
                    />
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

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setStep('landing')}
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