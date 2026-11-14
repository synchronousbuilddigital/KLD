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
  ScanLine
} from 'lucide-react';
import { useBoxStore } from '../../../lib/useBoxStore';
import { sendAiChatMessageV2, detectDielineFile } from '../../../services/ai';
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

export const MobileAiTab: React.FC<MobileAiTabProps> = ({ onOpenInStudio, onNavigateTab }) => {
  const store = useBoxStore();
  const [activeModel, setActiveModel] = useState<string>(store.boxModel || 'rte');
  const [activeSubstrate, setActiveSubstrate] = useState<'white' | 'kraft' | 'metal'>('white');
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your KLD AI Packaging Assistant. Describe any product or upload a dieline/package photo to generate custom 3D packaging and CAD dielines.',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filePreviewUrl = URL.createObjectURL(file);
    const userMsg: Message = {
      id: `user-file-${Date.now()}`,
      sender: 'user',
      text: `Uploaded "${file.name}" for structural AI dieline detection.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      filePreview: { name: file.name, url: filePreviewUrl }
    };

    setMessages(prev => [...prev, userMsg]);
    setIsScanning(true);

    try {
      const result = await detectDielineFile(file);
      
      let detectedKey = 'rte';
      if (result.model) {
        detectedKey = result.model;
        setActiveModel(detectedKey);
        useBoxStore.setState({ boxModel: detectedKey });
      }
      if (result.dimensions) {
        useBoxStore.setState({
          L: result.dimensions.L,
          W: result.dimensions.W,
          H: result.dimensions.H
        });
      }

      const assistantMsg: Message = {
        id: `ai-scan-${Date.now()}`,
        sender: 'assistant',
        text: `Detected: ${result.name || MODEL_NAMES[detectedKey] || 'Packaging Model'}. ${result.explanation || 'Analyzed structural geometry and configured optimal 3D dieline.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelKey: detectedKey,
        detectedName: result.name || MODEL_NAMES[detectedKey],
        dimensions: result.dimensions
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('File detection error:', err);
      const errorMsg: Message = {
        id: `ai-scan-err-${Date.now()}`,
        sender: 'assistant',
        text: `Unable to detect structure in "${file.name}". Please ensure the file is an SVG, DXF, or clean photo of a packaging dieline.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
          }}
          className="w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-500 flex items-center justify-center active:scale-95 transition-all"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
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
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-3.5 flex flex-col space-y-3 max-h-[300px] overflow-y-auto">
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

        {isScanning && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs py-1">
            <ScanLine className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="font-semibold text-indigo-700">Analyzing packaging geometry & crease vectors...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Prompt Input Bar with Image/Camera Upload */}
      <div className="relative bg-white rounded-2xl border border-zinc-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] p-1.5 flex items-center gap-1.5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
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
  );
};

export default MobileAiTab;
