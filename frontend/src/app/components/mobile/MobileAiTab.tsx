import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  Send, 
  Upload, 
  Camera, 
  Box, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Sliders, 
  Scissors, 
  ChevronDown, 
  FileCheck,
  ScanLine,
  Check,
  RefreshCw,
  FolderOpen,
  Info,
  Compass,
  Cpu,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { useBoxStore } from '../../../lib/useBoxStore';
import { sendAiChatMessageV2, detectDielineFile, DielineDetectionResult } from '../../../services/ai';
import { Mobile3DViewer } from './Mobile3DViewer';
import { MobileTab } from './MobileTabBar';

interface MobileAiTabProps {
  onOpenInStudio: (modelKey: string) => void;
  onNavigateTab: (tab: MobileTab) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelKey?: string;
  dimensions?: { L: number; W: number; H: number };
  detectedName?: string;
  filePreview?: { name: string; url?: string };
  variations?: any[];
  directions?: any[];
  expandedBrief?: string;
}

const QUICK_PROMPTS = [
  { label: '🍵 Matcha Tea Box', text: 'Design a luxury ceremonial matcha tea folding carton in deep forest green with gold foil logo and minimal botanical pattern' },
  { label: '🧴 Botanical Serum', text: 'Create an organic skincare dropper box in matte off-white with delicate sage green botanical accents and clean typography' },
  { label: '🍕 Artisan Pizza Box', text: 'Design an authentic Italian artisan pizza box in natural kraft with bold woodblock typography and red tomato stamp artwork' },
  { label: '👟 Streetwear Shoe Box', text: 'Create a high-fashion streetwear shoe box in matte black with metallic silver foil geometric pattern and neon orange highlights' },
  { label: '🥤 12oz Craft Beverage', text: 'Create an aluminum beverage can with organic citrus botanical branding and vibrant gradients' }
];

const MODEL_NAMES: Record<string, string> = {
  rte: 'Reverse Tuck End Box',
  te: 'Straight Tuck End Box',
  rsc: 'Square Shipping Box',
  auto_lock: 'Auto Lock Bottom Box',
  cosmetic: 'Cosmetic Box',
  cosmetic_b: 'Mailer / Tray Box',
  button_hole: 'Button Hole Box',
  fefco_0300: 'FEFCO 0300 Shoe Box with Lid',
  pizza_box: 'FEFCO 0426 Pizza Box',
  can: '12oz Beverage Can',
  slim_can: '355ml Slim Can',
  tube: 'Cosmetic Tube',
  sipper_water_bottle: 'Sipper Water Bottle',
  water_bottle: 'Mineral Water Bottle'
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
  }
];

export const MobileAiTab: React.FC<MobileAiTabProps> = ({ onOpenInStudio, onNavigateTab }) => {
  const store = useBoxStore();
  
  // Navigation sub-tab: 'design' (AI Design Studio) | 'detector' (CAD Dieline Generator)
  const [subTab, setSubTab] = useState<'design' | 'detector'>('design');
  
  const [activeModel, setActiveModel] = useState<string>(store.boxModel || 'rte');
  const [activeSubstrate, setActiveSubstrate] = useState<'white' | 'kraft' | 'metal'>('white');
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // AI Design Variations State (Images & Artwork applied to 3D Box)
  const [appliedVariation, setAppliedVariation] = useState<any | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<any[]>(() => {
    return (store as any)?.generatedRenders || [];
  });
  
  // Dieline Detector State
  const [detectorResult, setDetectorResult] = useState<DielineDetectionResult | null>(null);
  const [detectorFile, setDetectorFile] = useState<{ name: string; size: string; previewUrl?: string } | null>(null);
  const [detectorScanningStep, setDetectorScanningStep] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectorFileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your KLD AI Packaging Studio. You can describe any packaging concept to generate visual artwork & continuous 3D wraps, or use the CAD Dieline Generator to import DXF/SVG nets and extract parametric dimensions.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelKey: 'rte'
    }
  ]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Apply or remove full-bleed AI artwork wrap on the 3D box model
  const applyVariationTo3D = (variation: any | null) => {
    if (!variation) {
      setAppliedVariation(null);
      if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
      else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
      if (typeof store.setDecals === 'function') store.setDecals([]);
      return;
    }

    const bgUrl = variation.backgroundUrl || variation.url;
    if (!bgUrl) return;

    setAppliedVariation(variation);

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
    if (variation.typography && variation.typography.brandName) {
      const frontX = glue + L / 2;
      newDecals.push({
        id: 'ai-typo',
        type: 'text',
        content: variation.typography.brandName,
        fontFamily: variation.typography.fontStyle || 'sans-serif',
        color: variation.typography.color || '#ffffff',
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

    if (typeof store.setAiDecals === 'function') {
      store.setAiDecals(newDecals);
    }
    if (typeof store.setDecals === 'function') {
      store.setDecals(newDecals);
    }

    // Automatically extract dominant color from the design and update package color
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
          if (typeof store.setPackageColor === 'function') {
            store.setPackageColor(hex);
          }
        }
      } catch (e) {}
    };
    img.src = bgUrl;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || promptInput).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setPromptInput('');
    setIsLoading(true);

    try {
      const boxContext = {
        boxModel: activeModel,
        L: store.L || 4.72,
        W: store.W || 2.36,
        H: store.H || 6.29,
        material: activeSubstrate
      };

      const aiResponse = await sendAiChatMessageV2(text, boxContext);
      
      let newModelKey = activeModel;
      let newDimensions = undefined;
      let detectedName = undefined;

      // Extract model or dimensions from AI response if present
      const actionsList = aiResponse.actionsApplied || aiResponse.actions;
      if (actionsList && actionsList.length > 0) {
        for (const action of actionsList) {
          const matchedModel = action.payload?.boxModel || action.model || (action.type === 'SET_BOX_MODEL' ? action.payload?.boxModel : null);
          if (matchedModel) {
            newModelKey = matchedModel;
            setActiveModel(newModelKey);
            useBoxStore.setState({ boxModel: newModelKey });
          }
          if (action.type === 'SET_DIMENSIONS' && action.payload) {
            newDimensions = action.payload;
            useBoxStore.setState(action.payload);
          } else if (action.L || action.W || action.H) {
            newDimensions = { L: action.L || store.L, W: action.W || store.W, H: action.H || store.H };
            useBoxStore.setState(newDimensions);
          }
        }
      }

      if (aiResponse.model) {
        newModelKey = aiResponse.model;
        setActiveModel(newModelKey);
        useBoxStore.setState({ boxModel: newModelKey });
      }

      if (aiResponse.dimensions) {
        newDimensions = aiResponse.dimensions;
        useBoxStore.setState(aiResponse.dimensions);
      }

      if (aiResponse.dielineMatch?.model) {
        newModelKey = aiResponse.dielineMatch.model;
        detectedName = aiResponse.dielineMatch.name || MODEL_NAMES[newModelKey];
        setActiveModel(newModelKey);
        useBoxStore.setState({ boxModel: newModelKey });
      }

      // Handle generated visual artwork variations
      const variations = aiResponse.renderVariations || aiResponse.variations || [];
      if (variations.length > 0) {
        setGeneratedVariations(variations);
        useBoxStore.setState({ generatedRenders: variations });
        // Automatically wrap the first generated variation onto the 3D model!
        applyVariationTo3D(variations[0]);
      }

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: aiResponse.reply || aiResponse.text || 'I generated 4 packaging designs and wrapped the hero artwork onto your 3D box model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelKey: newModelKey,
        dimensions: newDimensions,
        detectedName,
        variations,
        directions: aiResponse.directions,
        expandedBrief: aiResponse.expandedBrief
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue communicating with the AI service. Please check your connection or try another prompt.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run dieline detection from uploaded file
  const processDielineFile = async (file: File) => {
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setDetectorFile({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      previewUrl
    });
    setIsScanning(true);
    setDetectorScanningStep('Scanning crease lines and boundary geometry...');

    try {
      setTimeout(() => setDetectorScanningStep('Matching flap topologies against 8 packaging families...'), 700);
      setTimeout(() => setDetectorScanningStep('Extracting dimensions and locking mechanisms...'), 1400);

      const result = await detectDielineFile(file);
      setDetectorResult(result);

      const targetKey = result.matchedModelKey || (result as any).model || 'rte';
      setActiveModel(targetKey);
      useBoxStore.setState({ boxModel: targetKey });

      if (result.dimensionsIn) {
        useBoxStore.setState({
          L: result.dimensionsIn.L,
          W: result.dimensionsIn.W,
          H: result.dimensionsIn.H
        });
      } else if (result.dimensions) {
        // If mm, convert to inches for store
        const isMm = result.dimensions.unit === 'mm' || result.dimensions.L > 30;
        const scale = isMm ? 1 / 25.4 : 1;
        useBoxStore.setState({
          L: Number((result.dimensions.L * scale).toFixed(2)),
          W: Number((result.dimensions.W * scale).toFixed(2)),
          H: Number((result.dimensions.H * scale).toFixed(2))
        });
      }

      // Add detection record to chat thread as well
      const assistantMsg: Message = {
        id: `ai-scan-${Date.now()}`,
        sender: 'assistant',
        text: `🔍 AI Dieline Detected: ${result.matchedTitle || MODEL_NAMES[targetKey] || 'Custom Box'}.\nConfidence: ${Math.round((result.confidence > 1 ? result.confidence : result.confidence * 100))}%\n${result.explanation || 'Analyzed structural geometry and configured optimal 3D dieline.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelKey: targetKey,
        detectedName: result.matchedTitle || MODEL_NAMES[targetKey],
        dimensions: result.dimensionsIn || result.dimensions
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      console.error('File detection error:', err);
      alert('Unable to analyze dieline file. Please ensure it is a valid DXF, SVG, PDF, or image.');
    } finally {
      setIsScanning(false);
      setDetectorScanningStep('');
    }
  };

  const handleDetectorFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processDielineFile(file);
    }
    if (detectorFileInputRef.current) detectorFileInputRef.current.value = '';
  };

  const handleApplySampleDieline = (sample: typeof SAMPLE_DIELINES[0]) => {
    setIsScanning(true);
    setDetectorScanningStep(`Simulating CAD vector scan for ${sample.name}...`);
    setDetectorFile({
      name: `${sample.key}_dieline_net.dxf`,
      size: '42.8 KB'
    });

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

        setDetectorResult(mockResult);
        setActiveModel(sample.key);
        useBoxStore.setState({
          boxModel: sample.key,
          L: sample.dims.L,
          W: sample.dims.W,
          H: sample.dims.H
        });

        setIsScanning(false);
        setDetectorScanningStep('');
      }, 700);
    }, 700);
  };

  return (
    <div className="flex flex-col space-y-4 pb-28 px-4 pt-2 select-none">
      {/* Top Professional Studio Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-zinc-900 leading-tight">AI Packaging Studio</h2>
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-[9px] font-bold uppercase tracking-wider">
                AI + CAD
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">Design & Image Generation • Precision CAD Dielines</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([{
              id: 'welcome',
              sender: 'assistant',
              text: 'Conversation reset. What packaging concept or dieline would you like to create next?',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            applyVariationTo3D(null);
            setGeneratedVariations([]);
            setDetectorResult(null);
            setDetectorFile(null);
          }}
          className="w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
          title="Reset session & clear artwork"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Segmented Sub-Tab Switcher: AI Design Studio VS CAD Dieline Generator */}
      <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-2xl border border-zinc-200 shadow-2xs">
        <button
          onClick={() => setSubTab('design')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'design'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${subTab === 'design' ? 'text-purple-600' : 'text-zinc-400'}`} />
          <span>AI Design Studio</span>
        </button>
        
        <button
          onClick={() => setSubTab('detector')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
            subTab === 'detector'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <ScanLine className={`w-3.5 h-3.5 ${subTab === 'detector' ? 'text-zinc-950' : 'text-zinc-400'}`} />
          <span>CAD Dieline Generator</span>
          <span className="px-1.5 py-0.2 bg-zinc-900 text-white text-[8px] font-bold rounded-full uppercase tracking-wider">
            CAD
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW A: CAD DIELINE SCANNER & NET INSPECTOR (PROFESSIONAL) */}
      {/* ======================================================== */}
      {subTab === 'detector' && (
        <div className="flex flex-col space-y-4">
          {/* Hidden File Input for Dieline Detector */}
          <input
            type="file"
            ref={detectorFileInputRef}
            onChange={handleDetectorFileInput}
            accept=".dxf,.svg,.pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
          />

          {/* Dieline Detector Hero Banner - High-End Minimalist Dark Architectural Card */}
          <div className="p-4 rounded-3xl bg-[#121316] text-white shadow-xl shadow-zinc-950/10 border border-zinc-800 flex flex-col space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200">
                <ScanLine className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">Vector Dieline & CAD Scanner</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Automated fold topology & parametric dimension extraction</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Upload an AutoCAD <span className="text-white font-bold">.DXF</span>, vector artwork <span className="text-white font-bold">.SVG</span>, technical sheet <span className="text-white font-bold">.PDF</span>, or high-res scan. The CAD engine maps fold axes, determines kinematics, and simulates 3D assembly.
            </p>

            {/* Upload Zone */}
            <div
              onClick={() => !isScanning && detectorFileInputRef.current?.click()}
              className="mt-1 border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/60 hover:bg-zinc-800/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">
                Select Dieline or CAD Net File
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5">
                Supports DXF, SVG, PDF, PNG & High-Res JPG
              </span>

              {/* Supported Format Badges */}
              <div className="flex items-center gap-1 mt-3">
                {['DXF CAD', 'SVG Vector', 'PDF Sheet', 'Physical Scan'].map(b => (
                  <span key={b} className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/70 text-[9px] font-bold text-zinc-300">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Test Samples */}
            <div className="flex flex-col space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Or inspect standard packaging templates:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_DIELINES.map(sample => (
                  <button
                    key={sample.key}
                    onClick={() => handleApplySampleDieline(sample)}
                    disabled={isScanning}
                    className="px-2.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/70 text-left text-zinc-200 hover:text-white text-[10px] font-semibold flex items-center justify-between transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="truncate">{sample.name}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
                <ScanLine className="w-5 h-5 animate-pulse text-zinc-900" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-zinc-900">Parametric CAD Analysis</span>
                  <span className="text-[10px] font-bold text-zinc-600 animate-pulse">Processing...</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-zinc-900 h-1.5 rounded-full animate-pulse w-3/4" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium truncate">
                  {detectorScanningStep || 'Analyzing geometry & crease lines...'}
                </p>
              </div>
            </div>
          )}

          {/* Detection Result Card */}
          {detectorResult && !isScanning && (
            <div className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-xl shadow-zinc-950/5 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">CAD Specification Match</span>
                    <h4 className="text-sm font-extrabold text-zinc-900 leading-tight">
                      {detectorResult.matchedTitle || MODEL_NAMES[detectorResult.matchedModelKey] || 'Custom Box Model'}
                    </h4>
                  </div>
                </div>

                <div className="px-2 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-black">
                  {Math.round((detectorResult.confidence > 1 ? detectorResult.confidence : detectorResult.confidence * 100))}% MATCH
                </div>
              </div>

              {/* Dimensions Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Length (L)</span>
                  <div className="text-xs font-black text-zinc-900">
                    {(detectorResult.dimensionsIn?.L || store.L || 4.72).toFixed(2)}″
                  </div>
                  <span className="text-[9px] text-zinc-400">
                    {Math.round((detectorResult.dimensionsIn?.L || store.L || 4.72) * 25.4)} mm
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Width (W)</span>
                  <div className="text-xs font-black text-zinc-900">
                    {(detectorResult.dimensionsIn?.W || store.W || 2.36).toFixed(2)}″
                  </div>
                  <span className="text-[9px] text-zinc-400">
                    {Math.round((detectorResult.dimensionsIn?.W || store.W || 2.36) * 25.4)} mm
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Height (H)</span>
                  <div className="text-xs font-black text-zinc-900">
                    {(detectorResult.dimensionsIn?.H || store.H || 6.29).toFixed(2)}″
                  </div>
                  <span className="text-[9px] text-zinc-400">
                    {Math.round((detectorResult.dimensionsIn?.H || store.H || 6.29) * 25.4)} mm
                  </span>
                </div>
              </div>

              {/* Detected Structural Features */}
              {detectorResult.detectedFeatures && detectorResult.detectedFeatures.length > 0 && (
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Structural Features Extracted:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {detectorResult.detectedFeatures.map((feat, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 text-[10px] font-semibold border border-zinc-200">
                        <Check className="w-2.5 h-2.5 text-zinc-600" />
                        <span>{feat}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation Note */}
              {detectorResult.explanation && (
                <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 leading-relaxed">
                  {detectorResult.explanation}
                </p>
              )}

              {/* Live 3D Folded Preview */}
              <div className="bg-[#121316] rounded-2xl p-3 border border-zinc-800 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-white">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    3D Kinematic Fold Inspection
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Dieline
                  </span>
                </div>
                <div className="relative w-full h-[180px] rounded-xl overflow-hidden bg-radial from-zinc-800/40 to-zinc-950/90 flex items-center justify-center">
                  <Mobile3DViewer
                    modelType={detectorResult.matchedModelKey || activeModel}
                    substrate={activeSubstrate}
                    height={180}
                    autoRotate={true}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onOpenInStudio(detectorResult.matchedModelKey || activeModel)}
                  className="py-2.5 px-3 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span>Edit in 3D Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setDetectorResult(null);
                    setDetectorFile(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Scan Another</span>
                </button>
              </div>
            </div>
          )}

          {/* Supported Box Families Guide */}
          <div className="bg-white rounded-2xl p-3.5 border border-zinc-200/80 shadow-2xs flex flex-col space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-extrabold text-zinc-900">Supported Industry Standards</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Compatible with ECMA, FEFCO, and bespoke packaging CAD nets:
            </p>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-700 font-medium pt-1">
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">• FEFCO 0426 Pizza Box</div>
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">• FEFCO 0300 Shoe Box</div>
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">• Reverse Tuck End (RTE)</div>
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">• Straight Tuck End (STE)</div>
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">• Auto Lock Bottom</div>
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">• Regular Slotted Carton (RSC)</div>
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">• Mailer & Tray Boxes</div>
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100">• Beverage Cans & Tubes</div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW B: AI DESIGN STUDIO (ARTWORK & 3D WRAP PACKSHOTS)   */}
      {/* ======================================================== */}
      {subTab === 'design' && (
        <div className="flex flex-col space-y-4">
          {/* Quick Access Dieline Scanner CTA Banner */}
          <div 
            onClick={() => setSubTab('detector')}
            className="p-3 bg-zinc-900 text-white rounded-2xl border border-zinc-800 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center shadow-xs">
                <ScanLine className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>Vector Dieline & CAD Scanner</span>
                  <span className="text-[9px] bg-zinc-800 text-zinc-300 font-bold px-1.5 py-0.2 rounded-md border border-zinc-700">CAD IMPORT</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">Import DXF, SVG or scans to extract fold lines & box dimensions</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
          </div>

          {/* Real Interactive 3D Canvas Card with Live AI Wrap */}
          <div className="bg-[#121316] text-white rounded-3xl p-4 shadow-xl shadow-zinc-950/15 border border-zinc-800 flex flex-col relative overflow-hidden">
            {/* Top Stage Header */}
            <div className="flex items-center justify-between mb-2 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] font-semibold tracking-wider">
                <span className={`w-1.5 h-1.5 rounded-full ${appliedVariation ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span>{appliedVariation ? '✨ LIVE 3D AI WRAP' : '3D FOLD SIMULATION'}</span>
              </div>

              {/* Substrate Switcher & Clear Wrap button */}
              <div className="flex items-center gap-1.5">
                {appliedVariation && (
                  <button
                    onClick={() => applyVariationTo3D(null)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold hover:bg-rose-500/30 transition-all cursor-pointer"
                    title="Remove applied artwork and restore plain substrate"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Wrap</span>
                  </button>
                )}

                <div className="flex items-center gap-0.5 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-full">
                  {(['white', 'kraft', 'metal'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setActiveSubstrate(s);
                        if (appliedVariation) applyVariationTo3D(null);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] capitalize transition-all cursor-pointer ${
                        activeSubstrate === s && !appliedVariation
                          ? 'bg-white text-zinc-950 font-bold shadow-xs' 
                          : 'text-zinc-400 hover:text-white font-medium'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3D Viewport */}
            <div className="relative w-full h-[230px] rounded-2xl overflow-hidden bg-radial from-zinc-800/40 to-zinc-950/90 flex items-center justify-center">
              <Mobile3DViewer
                modelType={activeModel}
                substrate={activeSubstrate}
                height={230}
                autoRotate={true}
              />
            </div>

            {/* Bottom Details & Open in Studio Button */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/80">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white leading-tight">
                    {MODEL_NAMES[activeModel] || 'Custom Box Model'}
                  </span>
                  {appliedVariation && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 truncate max-w-[120px]">
                      {appliedVariation.title || 'AI Wrapped'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Dimensions: {(store.L || 4.72).toFixed(2)}″ × {(store.W || 2.36).toFixed(2)}″ × {(store.H || 6.29).toFixed(2)}″
                </span>
              </div>

              <button
                onClick={() => onOpenInStudio(activeModel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>Edit 3D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AI Artwork Variations Carousel (Tap to Wrap on 3D Box) */}
          {generatedVariations.length > 0 && (
            <div className="bg-white rounded-3xl p-3.5 border border-zinc-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-extrabold text-zinc-900 tracking-tight">AI Artwork Variations</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full">
                    {generatedVariations.length} Styles
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">Tap to wrap on 3D box</span>
              </div>

              <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar -mx-1 px-1">
                {generatedVariations.map((v: any, idx: number) => {
                  const vUrl = v.backgroundUrl || v.url;
                  const isApplied = appliedVariation?.id === v.id || (appliedVariation?.backgroundUrl || appliedVariation?.url) === vUrl;
                  return (
                    <div
                      key={v.id || idx}
                      onClick={() => applyVariationTo3D(isApplied ? null : v)}
                      className={`shrink-0 w-36 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isApplied 
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/70 hover:border-zinc-300 shadow-2xs'
                      }`}
                    >
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2">
                        <img
                          src={vUrl}
                          alt={v.title || `Variation ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                              `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#18181b"/><text x="150" y="150" font-family="sans-serif" font-size="14" fill="#2563eb" text-anchor="middle">KLD AI RENDER</text></svg>`
                            )}`;
                          }}
                        />
                        {isApplied && (
                          <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white rounded-full p-0.5 shadow-md">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[11px] font-bold text-zinc-900 truncate leading-tight">
                          {v.title || `Style ${idx + 1}`}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyVariationTo3D(isApplied ? null : v);
                          }}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isApplied
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-zinc-900 text-white hover:bg-zinc-800'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Wrapped</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Wrap on 3D</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preset Quick Prompt Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.text)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white border border-zinc-200/90 hover:border-zinc-400 text-zinc-800 text-[11px] font-semibold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-3.5 flex flex-col space-y-3 max-h-[300px] overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-zinc-900 text-white rounded-br-xs'
                      : 'bg-zinc-50 text-zinc-900 rounded-bl-xs border border-zinc-200/80'
                  }`}
                >
                  {m.filePreview && (
                    <div className="mb-2 p-1.5 bg-black/20 rounded-lg flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-bold truncate">{m.filePreview.name}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Inline Variations inside Assistant Message */}
                  {m.variations && m.variations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-200/80 flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                          Generated Designs ({m.variations.length})
                        </span>
                        <span className="text-[9px] text-zinc-400">Tap to wrap 3D</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {m.variations.map((v: any, vIdx: number) => {
                          const vUrl = v.backgroundUrl || v.url;
                          const isApplied = appliedVariation?.id === v.id || (appliedVariation?.backgroundUrl || appliedVariation?.url) === vUrl;
                          return (
                            <div
                              key={v.id || vIdx}
                              onClick={() => applyVariationTo3D(isApplied ? null : v)}
                              className={`p-1.5 rounded-xl border flex flex-col gap-1.5 cursor-pointer transition-all ${
                                isApplied ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20' : 'border-zinc-200 bg-white hover:border-zinc-300'
                              }`}
                            >
                              <div className="w-full aspect-square rounded-lg overflow-hidden bg-zinc-900">
                                <img src={vUrl} alt={v.title} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] font-semibold text-zinc-800 truncate">
                                {v.title || `Style ${vIdx + 1}`}
                              </span>
                              <button
                                type="button"
                                className={`w-full py-1 rounded-md text-[9px] font-bold flex items-center justify-center gap-1 ${
                                  isApplied ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white'
                                }`}
                              >
                                {isApplied ? '✓ Wrapped' : 'Wrap 3D'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {m.modelKey && m.sender === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-200/80 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-700 bg-zinc-200/60 px-2 py-0.5 rounded-md">
                        {MODEL_NAMES[m.modelKey] || m.modelKey}
                      </span>
                      <button
                        onClick={() => {
                          setActiveModel(m.modelKey!);
                          onOpenInStudio(m.modelKey!);
                        }}
                        className="text-[10px] font-bold text-zinc-900 bg-white border border-zinc-300 rounded-md px-2 py-0.5 flex items-center gap-0.5 hover:bg-zinc-50 cursor-pointer shadow-2xs"
                      >
                        Open <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-zinc-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-600 text-xs py-1">
                <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold text-zinc-800">Generating AI artwork & 3D wrap...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Input Bar with Image/Camera Upload */}
          <div className="relative bg-white rounded-2xl border border-zinc-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] p-1.5 flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSubTab('detector');
                  processDielineFile(file);
                }
              }}
              accept="image/*,.svg,.dxf,.pdf"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isScanning}
              className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
              title="Upload image or dieline vector to detect structure"
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Describe packaging design (e.g. matcha box with gold foil)..."
              disabled={isLoading || isScanning}
              className="flex-1 bg-transparent text-xs text-zinc-900 placeholder-zinc-400 outline-none px-1"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!promptInput.trim() || isLoading || isScanning}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer ${
                promptInput.trim() && !isLoading && !isScanning
                  ? 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAiTab;
