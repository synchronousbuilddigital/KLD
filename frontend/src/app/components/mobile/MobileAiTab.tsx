import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
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
  Layers,
  Wand2,
  FileCheck,
  ScanLine,
  Check,
  RefreshCw,
  FolderOpen,
  Info
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
}

const QUICK_PROMPTS = [
  { label: '🧴 Skincare Box', text: 'Design a sleek matte white cosmetic box for premium serum' },
  { label: '🍕 Pizza Box', text: 'Create an eco-friendly FEFCO 0426 kraft pizza box with locking tabs' },
  { label: '👟 Shoe Box with Lid', text: 'Generate a FEFCO 0300 shoe box with removable telescope lid' },
  { label: '🥤 12oz Craft Can', text: 'Create an aluminum beverage can with organic botanical branding' },
  { label: '📦 Shipping Carton', text: 'Generate a heavy duty RSC shipping box with structural CAD net' }
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
  
  // Navigation sub-tab: 'prompt' (AI Prompt Studio) | 'detector' (AI Dieline Detector)
  const [subTab, setSubTab] = useState<'prompt' | 'detector'>('prompt');
  
  const [activeModel, setActiveModel] = useState<string>(store.boxModel || 'rte');
  const [activeSubstrate, setActiveSubstrate] = useState<'white' | 'kraft' | 'metal'>('white');
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
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
      text: 'Hello! I am your KLD AI Packaging Assistant. You can describe any product to generate 3D packaging, or switch to the AI Dieline Detector to auto-detect CAD vector nets and box structures.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelKey: 'rte'
    }
  ]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
      if (aiResponse.actionsApplied && aiResponse.actionsApplied.length > 0) {
        for (const action of aiResponse.actionsApplied) {
          if (action.type === 'SET_BOX_MODEL' && action.payload?.boxModel) {
            newModelKey = action.payload.boxModel;
            setActiveModel(newModelKey);
            useBoxStore.setState({ boxModel: newModelKey });
          }
          if (action.type === 'SET_DIMENSIONS' && action.payload) {
            newDimensions = action.payload;
            useBoxStore.setState(action.payload);
          }
        }
      }

      if (aiResponse.dielineMatch?.model) {
        newModelKey = aiResponse.dielineMatch.model;
        detectedName = aiResponse.dielineMatch.name || MODEL_NAMES[newModelKey];
        setActiveModel(newModelKey);
        useBoxStore.setState({ boxModel: newModelKey });
      }

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: aiResponse.reply || aiResponse.text || 'I updated your 3D packaging model according to your prompt.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelKey: newModelKey,
        dimensions: newDimensions,
        detectedName
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
      {/* Top AI Studio Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-zinc-900 leading-tight">AI Packaging Studio</h2>
              <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold uppercase tracking-wider">
                Gemini 2.0
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">Text-to-3D Packaging & Vector Dieline Engine</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([{
              id: 'welcome',
              sender: 'assistant',
              text: 'Conversation reset. What packaging structure would you like to design next?',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            setDetectorResult(null);
            setDetectorFile(null);
          }}
          className="w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-500 flex items-center justify-center active:scale-95 transition-all"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary Sub-Tab Switcher: AI Prompt Studio VS AI Dieline Detector */}
      <div className="grid grid-cols-2 p-1 bg-zinc-200/70 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <button
          onClick={() => setSubTab('prompt')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'prompt'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${subTab === 'prompt' ? 'text-purple-600' : 'text-zinc-400'}`} />
          <span>AI Prompt Studio</span>
        </button>
        
        <button
          onClick={() => setSubTab('detector')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
            subTab === 'detector'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <ScanLine className={`w-3.5 h-3.5 ${subTab === 'detector' ? 'text-indigo-600' : 'text-zinc-400'}`} />
          <span>AI Dieline Detector</span>
          <span className="px-1.5 py-0.2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[8px] font-black rounded-full uppercase tracking-wider shadow-2xs">
            NEW
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW A: AI DIELINE DETECTOR & SCANNER (HIGH VISIBILITY) */}
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

          {/* Dieline Detector Hero Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 text-white shadow-xl shadow-indigo-950/20 border border-indigo-800/50 flex flex-col space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-indigo-300">
                <ScanLine className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">AI Dieline & CAD Detector</h3>
                <p className="text-[10px] text-indigo-200">Neural CAD geometry recognition for 8 packaging families</p>
              </div>
            </div>

            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Upload any CAD vector file (<span className="text-white font-bold">.DXF</span>, <span className="text-white font-bold">.SVG</span>, <span className="text-white font-bold">.PDF</span>) or flat photo. Our AI identifies fold lines, matches box topology, and creates a live 3D fold simulation.
            </p>

            {/* Upload Zone */}
            <div
              onClick={() => !isScanning && detectorFileInputRef.current?.click()}
              className="mt-1 border-2 border-dashed border-indigo-400/40 hover:border-indigo-300 bg-white/5 hover:bg-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mb-2">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>
              <span className="text-xs font-bold text-white">
                Tap to Upload Dieline or CAD Net
              </span>
              <span className="text-[10px] text-indigo-300 mt-0.5">
                Supports DXF, SVG, PDF, PNG & JPG
              </span>

              {/* Supported Format Badges */}
              <div className="flex items-center gap-1 mt-3">
                {['DXF CAD', 'SVG Vector', 'PDF Sheet', 'Image Scan'].map(b => (
                  <span key={b} className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-bold text-indigo-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Test Samples */}
            <div className="flex flex-col space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                Or test with sample dielines:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_DIELINES.map(sample => (
                  <button
                    key={sample.key}
                    onClick={() => handleApplySampleDieline(sample)}
                    disabled={isScanning}
                    className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-left text-white text-[10px] font-semibold flex items-center justify-between transition-all active:scale-95"
                  >
                    <span className="truncate">{sample.name}</span>
                    <ArrowRight className="w-3 h-3 text-indigo-300 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <ScanLine className="w-5 h-5 animate-pulse text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-indigo-900">Neural CAD Analysis</span>
                  <span className="text-[10px] font-bold text-indigo-600 animate-pulse">Scanning...</span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-3/4" />
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
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">AI CAD Match</span>
                    <h4 className="text-sm font-extrabold text-zinc-900 leading-tight">
                      {detectorResult.matchedTitle || MODEL_NAMES[detectorResult.matchedModelKey] || 'Custom Box Model'}
                    </h4>
                  </div>
                </div>

                <div className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black">
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
                    Detected Structural Features:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {detectorResult.detectedFeatures.map((feat, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100">
                        <Check className="w-2.5 h-2.5 text-indigo-600" />
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
                    Live 3D Folded Inspection
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced with Dieline
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
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-extrabold text-zinc-900">Supported Packaging Formats</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Our AI detector recognizes standard ECMA, FEFCO, and custom packaging structures:
            </p>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-700 font-medium pt-1">
              <div className="p-1.5 rounded-lg bg-zinc-50">• FEFCO 0426 Pizza Box</div>
              <div className="p-1.5 rounded-lg bg-zinc-50">• FEFCO 0300 Shoe Box</div>
              <div className="p-1.5 rounded-lg bg-zinc-50">• Reverse Tuck End (RTE)</div>
              <div className="p-1.5 rounded-lg bg-zinc-50">• Straight Tuck End (STE)</div>
              <div className="p-1.5 rounded-lg bg-zinc-50">• Auto Lock Bottom</div>
              <div className="p-1.5 rounded-lg bg-zinc-50">• Square Shipping (RSC)</div>
              <div className="p-1.5 rounded-lg bg-zinc-50">• Mailer & Tray Boxes</div>
              <div className="p-1.5 rounded-lg bg-zinc-50">• Beverage Cans & Tubes</div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW B: AI PROMPT STUDIO (TEXT-TO-3D & PACKAGING CHAT)  */}
      {/* ======================================================== */}
      {subTab === 'prompt' && (
        <div className="flex flex-col space-y-4">
          {/* Prominent Link Banner to AI Dieline Detector */}
          <div 
            onClick={() => setSubTab('detector')}
            className="p-3 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-pink-50/50 rounded-2xl border border-indigo-200/70 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <ScanLine className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-zinc-900 flex items-center gap-1.5">
                  <span>AI Dieline & CAD Detector</span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.2 rounded-full">NEW</span>
                </div>
                <p className="text-[10px] text-zinc-600 font-medium">Upload DXF, SVG or photos to auto-detect box family & dimensions</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>

          {/* Real Interactive 3D Canvas Card */}
          <div className="bg-[#121316] text-white rounded-3xl p-4 shadow-xl shadow-zinc-950/15 border border-zinc-800 flex flex-col relative overflow-hidden">
            {/* Top Stage Header */}
            <div className="flex items-center justify-between mb-2 z-10">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-semibold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span>AI 3D STAGE</span>
              </div>

              {/* Substrate Pill Switcher */}
              <div className="flex items-center gap-0.5 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-full">
                {(['white', 'kraft', 'metal'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveSubstrate(s)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] capitalize transition-all ${
                      activeSubstrate === s 
                        ? 'bg-white text-zinc-950 font-bold shadow-xs' 
                        : 'text-zinc-400 hover:text-white font-medium'
                    }`}
                  >
                    {s}
                  </button>
                ))}
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
                <span className="text-xs font-bold text-white leading-tight">
                  {MODEL_NAMES[activeModel] || 'Custom Box Model'}
                </span>
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

          {/* Preset Quick Prompt Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.text)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white border border-zinc-200/80 hover:border-purple-300 text-zinc-700 text-[11px] font-semibold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
              >
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-3.5 flex flex-col space-y-3 max-h-[280px] overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-zinc-900 text-white rounded-br-xs'
                      : 'bg-zinc-100/90 text-zinc-900 rounded-bl-xs border border-zinc-200/50'
                  }`}
                >
                  {m.filePreview && (
                    <div className="mb-2 p-1.5 bg-black/20 rounded-lg flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-bold truncate">{m.filePreview.name}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  
                  {m.modelKey && m.sender === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-700">
                        Model: {MODEL_NAMES[m.modelKey] || m.modelKey}
                      </span>
                      <button
                        onClick={() => {
                          setActiveModel(m.modelKey!);
                          onOpenInStudio(m.modelKey!);
                        }}
                        className="text-[10px] font-bold text-zinc-900 bg-white border border-zinc-300 rounded-md px-2 py-0.5 flex items-center gap-0.5 hover:bg-zinc-50"
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
              <div className="flex items-center gap-2 text-zinc-500 text-xs py-1">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold text-purple-700">AI is engineering structure & dielines...</span>
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
              placeholder="Describe your packaging or product..."
              disabled={isLoading || isScanning}
              className="flex-1 bg-transparent text-xs text-zinc-900 placeholder-zinc-400 outline-none px-1"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!promptInput.trim() || isLoading || isScanning}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer ${
                promptInput.trim() && !isLoading && !isScanning
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
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
