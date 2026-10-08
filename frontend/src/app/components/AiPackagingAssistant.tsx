// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useBoxStore } from '../../lib/useBoxStore';
import { 
  sendAiChatMessageV2, 
  startAiPrecisionJob, 
  pollAiJob, 
  detectDielineFile 
} from '../../services/ai';
import { generateRTEDielineDXF } from '../../lib/rteDielineGenerator';
import { generateTEDielineDXF } from '../../lib/teDielineGenerator';
import { generateAutoLockDieline } from '../../lib/autoLockDielineGenerator';
import { generateCosmeticBoxDieline } from '../../lib/cosmeticBoxDielineGenerator';
import { generateCosmeticBoxBDieline } from '../../lib/cosmeticBoxBDielineGenerator';
import { generateButtonHoleDieline } from '../../lib/buttonHoleDielineGenerator';
import { generateDXFString } from '../../lib/exportUtils';
import { setLargeData, getLargeData } from '../../lib/idbStorage';
import './AiPackagingAssistant.css';
import { 
  Sparkles, 
  Send, 
  Plus, 
  History, 
  X, 
  Image as ImageIcon, 
  LayoutGrid, 
  Scissors, 
  Box, 
  Video, 
  Palette, 
  CheckCircle2, 
  Download, 
  ChevronRight,
  Upload,
  FileCheck,
  ScanLine,
  Layers,
  ArrowRight
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  directions?: any[];
  variations?: any[];
  actionsApplied?: string[];
  dielineMatch?: any;
}

interface AiPackagingAssistantProps {
  onClose?: () => void;
  isOpen?: boolean;
  useStore?: any;
  onApplyVariation?: (variation: any) => void;
  onApplyBoxModel?: (model: string, dimsIn?: any, dimsMm?: any) => void;
}

export default function AiPackagingAssistant({ onClose, isOpen = true, useStore: customStore, onApplyVariation, onApplyBoxModel }: AiPackagingAssistantProps) {
  const storeHook = customStore || useBoxStore;
  const store = storeHook((state: any) => state);
  
  // Hydrate initial messages from localStorage synchronously
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('kld_ai_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStepText, setGenerationStepText] = useState('Processing custom prompt, generating 3D textures & dielines...');
  const [selectedBoxModelOverride, setSelectedBoxModelOverride] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDetectingFile, setIsDetectingFile] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<any>(null);

  // 1. Hydrate full history from IndexedDB on mount (bypasses localStorage 5MB limit)
  useEffect(() => {
    getLargeData('kld_ai_history').then((idbMessages) => {
      if (idbMessages && Array.isArray(idbMessages) && idbMessages.length > 0) {
        setMessages(idbMessages);
      }
    });

    const savedChatHistory = localStorage.getItem('pacdora_ai_chat_history');
    if (savedChatHistory) {
      try {
        setChatHistory(JSON.parse(savedChatHistory));
      } catch(e) {}
    }
  }, []);

  // 2. Persist messages both in IndexedDB and localStorage safely
  useEffect(() => {
    if (messages.length > 0) {
      setLargeData('kld_ai_history', messages);
      try {
        localStorage.setItem('kld_ai_history', JSON.stringify(messages));
      } catch (e) {
        // LocalStorage quota may be exceeded by base64 images; IndexedDB handles it safely
      }
    }
  }, [messages]);

  // 3. Scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isLoading, isDetectingFile]);

  // 4. Continuity check: Check if an AI generation was running when page reloaded or unmounted
  useEffect(() => {
    let isMounted = true;
    const resumeActiveJob = async () => {
      try {
        const rawJob = localStorage.getItem('kld_active_ai_job');
        if (!rawJob) return;

        const activeJob = JSON.parse(rawJob);
        // Only resume if started less than 15 minutes ago
        if (!activeJob.jobId || Date.now() - (activeJob.timestamp || 0) > 15 * 60 * 1000) {
          localStorage.removeItem('kld_active_ai_job');
          return;
        }

        // Verify the job is still valid on backend
        try {
          const testCheck = await pollAiJob(activeJob.jobId);
          if (!testCheck || testCheck.status === 'failed') {
            localStorage.removeItem('kld_active_ai_job');
            if (isMounted) setIsLoading(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem('kld_active_ai_job');
          if (isMounted) setIsLoading(false);
          return;
        }

        if (isMounted) {
          setIsLoading(true);
          setGenerationStepText('Resuming precision packaging generation...');
          pollJobUntilComplete(activeJob.jobId, activeJob.boxContext);
        }
      } catch (e) {
        localStorage.removeItem('kld_active_ai_job');
        if (isMounted) setIsLoading(false);
        console.warn("Failed to resume active AI generation job:", e);
      }
    };

    resumeActiveJob();

    return () => {
      isMounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Poll background generation job until finished
  const pollJobUntilComplete = (jobId: string, boxContext: any) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    let consecutiveErrors = 0;
    pollingRef.current = setInterval(async () => {
      try {
        const job = await pollAiJob(jobId);
        consecutiveErrors = 0;
        if (!job) return;

        setGenerationProgress(job.progress || 30);
        if (job.currentStep) {
          setGenerationStepText(job.currentStep);
        }

        if (job.status === 'completed' && job.result) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          localStorage.removeItem('kld_active_ai_job');

          const res = job.result;
          if (res.actions) {
            applyActionsToStore(res.actions);
          }

          const aiMsg: Message = {
            id: 'msg-ai-' + Date.now(),
            sender: 'assistant',
            text: res.reply || res.outputsSummary || 'AI Precision design generated successfully.',
            directions: res.directions || [],
            variations: res.renderVariations || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setMessages(prev => [...prev, aiMsg]);

          if (res.renderVariations && res.renderVariations.length > 0) {
            useBoxStore.setState({ generatedRenders: res.renderVariations });
            if (onApplyVariation) {
              onApplyVariation(res.renderVariations[0]);
            } else {
              applyWrapToStore(res.renderVariations[0]);
            }
          }
          setIsLoading(false);
          setGenerationProgress(100);
        } else if (job.status === 'failed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          localStorage.removeItem('kld_active_ai_job');
          setIsLoading(false);

          const errorMsg: Message = {
            id: 'msg-err-' + Date.now(),
            sender: 'assistant',
            text: `Generation notice: ${job.error || 'Failed to complete packaging generation'}. Please check your connection or try again.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      } catch (err) {
        consecutiveErrors++;
        console.warn(`Polling error for job ${jobId} (attempt ${consecutiveErrors}/3):`, err);
        if (consecutiveErrors >= 3) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          localStorage.removeItem('kld_active_ai_job');
          setIsLoading(false);
        }
      }
    }, 2500);
  };

  // Save current thread to history and open a fresh new chat
  const handleNewChat = () => {
    // Stop any active polling and reset loading
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    localStorage.removeItem('kld_active_ai_job');
    setIsLoading(false);
    setIsDetectingFile(false);
    setGenerationProgress(0);

    // Save previous chat thread if it contains messages
    if (messages.length > 0) {
      const title = messages.find(m => m.sender === 'user')?.text || 'Packaging Design Chat';
      const historyItem = {
        id: 'hist-' + Date.now(),
        title: title.length > 40 ? title.substring(0, 40) + '...' : title,
        date: new Date().toLocaleDateString(),
        messages: [...messages]
      };
      const updatedHistory = [historyItem, ...chatHistory].slice(0, 10);
      setChatHistory(updatedHistory);
      try {
        localStorage.setItem('pacdora_ai_chat_history', JSON.stringify(updatedHistory));
      } catch (e) {}
    }

    // Clear active chat to reveal hero screen
    setMessages([]);
    localStorage.removeItem('kld_ai_history');
    setLargeData('kld_ai_history', []);
    setShowHistory(false);
    setInputPrompt('');
  };

  const handleRestoreChat = (historyItem: any) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    localStorage.removeItem('kld_active_ai_job');
    setIsLoading(false);
    setMessages(historyItem.messages || []);
    setShowHistory(false);
  };

  const applyWrapToStore = (variation: any) => {
    const bgUrl = variation?.backgroundUrl || variation?.url;
    if (!bgUrl) return;

    const s = customStore ? customStore.getState() : useBoxStore.getState();
    const L = s.L || 4.7244;
    const W = s.W || 2.3622;
    const H = s.H || 6.2992;
    const glue = s.glueFlapWidth || 0.625;

    // Full-bleed coverage across all 4 panels and flaps
    const totalW = glue + L * 2 + W * 2;
    const totalH = H + W * 2 + 1.25;
    const xCenter = totalW / 2;
    const yCenter = W + 0.625 + (H / 2);

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

    if (typeof s.setDecals === 'function') {
      s.setDecals([wrapDecal]);
    }
    if (typeof s.setAiDecals === 'function') {
      s.setAiDecals([wrapDecal]);
    }
  };

  const applyActionsToStore = (actions: any[]) => {
    if (!actions || !Array.isArray(actions)) return;

    actions.forEach(action => {
      switch (action.type) {
        case 'SET_BOX_MODEL':
          if (action.model && typeof store.setBoxModel === 'function') {
            store.setBoxModel(action.model);
          }
          break;
        case 'SET_DIMENSIONS':
          if (typeof store.setDim === 'function') {
            if (action.L !== undefined) store.setDim('L', action.L);
            if (action.W !== undefined) store.setDim('W', action.W);
            if (action.H !== undefined) store.setDim('H', action.H);
          }
          if (action.unit && typeof store.setUnit === 'function') {
            store.setUnit(action.unit);
          }
          break;
        case 'SET_PACKAGE_COLOR':
          if (action.color && typeof store.setPackageColor === 'function') {
            store.setPackageColor(action.color);
          }
          break;
        case 'SET_INSIDE_COLOR':
          if (action.color && typeof store.setInsideColor === 'function') {
            store.setInsideColor(action.color);
          }
          break;
        default:
          break;
      }
    });
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);
    setGenerationProgress(10);
    setGenerationStepText('Interpreting box specifications & style...');

    const boxContext = {
      currentBoxModel: store.boxModel,
      requestedBoxModel: selectedBoxModelOverride,
      dimensions: {
        L: store.L,
        W: store.W,
        H: store.H
      },
      packageColor: store.packageColor
    };

    try {
      // 1. Try resilient async job endpoint first
      const jobStart = await startAiPrecisionJob(prompt, boxContext);
      if (jobStart && jobStart.jobId) {
        localStorage.setItem('kld_active_ai_job', JSON.stringify({
          jobId: jobStart.jobId,
          prompt,
          boxContext,
          timestamp: Date.now()
        }));
        pollJobUntilComplete(jobStart.jobId, boxContext);
        return;
      }
    } catch (jobErr) {
      console.warn("Async job start failed, executing direct V2 generation:", jobErr);
    }

    // 2. Direct fallback if async job creation fails
    try {
      const res = await sendAiChatMessageV2(prompt, boxContext);
      if (res.actions) {
        applyActionsToStore(res.actions);
      }

      const aiMsg: Message = {
        id: 'msg-ai-' + Date.now(),
        sender: 'assistant',
        text: res.reply || res.outputsSummary || 'Design generated successfully.',
        directions: res.directions || [],
        variations: res.renderVariations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

      if (res.renderVariations && res.renderVariations.length > 0) {
        useBoxStore.setState({ generatedRenders: res.renderVariations });
        if (onApplyVariation) {
          onApplyVariation(res.renderVariations[0]);
        } else {
          applyWrapToStore(res.renderVariations[0]);
        }
      }
    } catch (err: any) {
      console.error('AI assistant error:', err);
      const errorMsg: Message = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: `Oops! Request failed: ${err.message || 'Unknown error'}. Please verify backend server is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      localStorage.removeItem('kld_active_ai_job');
    }
  };

  // Upload and Detect Dieline Feature (Matches against the 6 directory box models)
  const processUploadedDielineFile = async (file: File) => {
    if (!file) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: `Uploaded dieline file: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsDetectingFile(true);

    try {
      const result = await detectDielineFile(file);

      // Auto-apply to store so the 3D model immediately syncs with the detected box
      if (result.matchedModelKey && typeof store.setBoxModel === 'function') {
        store.setBoxModel(result.matchedModelKey);
      }
      if (result.dimensionsIn && typeof store.setDim === 'function') {
        store.setDim('L', result.dimensionsIn.L);
        store.setDim('W', result.dimensionsIn.W);
        store.setDim('H', result.dimensionsIn.H);
      }

      const matchMsg: Message = {
        id: 'msg-detect-' + Date.now(),
        sender: 'assistant',
        text: result.explanation || `Dieline analyzed. Identified nearest match from our 6 box models: **${result.matchedTitle}** (${result.confidence}% Match).`,
        dielineMatch: result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, matchMsg]);
    } catch (err: any) {
      console.error('Dieline detection error:', err);
      const errorMsg: Message = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: `Could not parse dieline: ${err.message || 'Please upload a valid DXF, SVG, or image file'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsDetectingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedDielineFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedDielineFile(file);
    }
  };

  // Download DXF helper
  const handleDownloadDielineDXF = (modelOverride?: string) => {
    try {
      const activeModel = modelOverride || store.boxModel || 'rte';
      const params = {
        L: store.L || 4.7244,
        W: store.W || 2.3622,
        H: store.H || 6.2992,
        T: store.T || 0.0197,
        glueFlapWidth: store.glueFlapWidth || 0.625,
        bleed: store.bleed || (2 / 25.4)
      };

      let dielineData;
      if (activeModel === 'te') dielineData = generateTEDielineDXF(params);
      else if (activeModel === 'auto_lock') dielineData = generateAutoLockDieline(params);
      else if (activeModel === 'cosmetic') dielineData = generateCosmeticBoxDieline(params);
      else if (activeModel === 'cosmetic_b') dielineData = generateCosmeticBoxBDieline(params);
      else if (activeModel === 'button_hole') dielineData = generateButtonHoleDieline(params);
      else dielineData = generateRTEDielineDXF(params);

      const dxfString = generateDXFString(dielineData);
      const blob = new Blob([dxfString], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Keyline_Dieline_${activeModel}.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DXF export error:', err);
    }
  };

  const isDark = store.theme === 'dark';
  if (!isOpen) return null;

  return (
    <div 
      className={`ai-assistant-container ${isDark ? 'dark-theme' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative' }}
    >
      {/* Hidden File Input for DXF / Dieline Detection */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange}
        accept=".dxf,.svg,.png,.jpg,.jpeg,.webp,.pdf"
        style={{ display: 'none' }}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="ai-drag-overlay">
          <Upload style={{ width: '36px', height: '36px' }} />
          <span style={{ fontSize: '15px', fontWeight: '800' }}>Drop DXF or Dieline File Here</span>
          <span style={{ fontSize: '12px', opacity: 0.85 }}>Detects nearest match from our 6 box directory</span>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="ai-header">
        <div className="ai-header-title">
          <Sparkles style={{ width: '16px', height: '16px', color: '#2563eb' }} />
          <span>AI Packaging Design</span>
        </div>
        
        {/* Sleek V2 Precision Badge (V1 Abstract toggle removed) */}
        <div className="ai-precision-badge" title="AI Precision Mode: Multi-panel 3D packaging layout generation">
          <span className="ai-precision-pulse" />
          <span>V2 Precision</span>
        </div>

        <div className="ai-header-actions">
          <button className="ai-icon-btn" onClick={handleNewChat} title="New Chat">
            <Plus style={{ width: '18px', height: '18px' }} />
          </button>
          <div style={{ position: 'relative' }}>
            <button className={`ai-icon-btn ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory(!showHistory)} title="Chat History">
              <History style={{ width: '15px', height: '15px' }} />
            </button>
            {showHistory && (
              <div style={{ position: 'absolute', top: '30px', right: '0', width: '260px', background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 50, padding: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#a1a1aa', padding: '8px', borderBottom: '1px solid #f4f4f5', marginBottom: '8px' }}>RECENT DESIGNS</div>
                {chatHistory.length === 0 ? (
                  <div style={{ padding: '16px 8px', fontSize: '12px', color: '#a1a1aa', textAlign: 'center' }}>No recent chats.</div>
                ) : (
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {chatHistory.map(hist => (
                      <div 
                        key={hist.id} 
                        onClick={() => handleRestoreChat(hist)}
                        style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f4f4f5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#27272a' }}>{hist.title}</span>
                        <span style={{ fontSize: '10px', color: '#a1a1aa' }}>{hist.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {onClose && (
            <button className="ai-icon-btn" onClick={onClose} title="Close Panel">
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>
      </div>

      {/* --- BODY --- */}
      <div className="ai-body" ref={bodyRef}>
        {messages.length === 0 ? (
          <div className="ai-hero-section">
            <h2 className="ai-hero-title">
              Hi, what would you like to design today?
            </h2>

            {/* Prominent Upload Dieline Card */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                maxWidth: '340px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))',
                border: '1.5px dashed #2563eb',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(37,99,235,0.06)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1d4ed8'; e.currentTarget.style.background = 'rgba(37,99,235,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))'; }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Upload style={{ width: '18px', height: '18px' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1d4ed8' }}>Upload DXF or Dieline File</div>
                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.3' }}>Auto-detects nearest match across our 6 box models</div>
              </div>
            </div>

            <div className="ai-chips-grid">
              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Create a perfume box with dimensions 50x50x120 mm in matte navy blue")}>
                <LayoutGrid style={{ width: '13px', height: '13px' }} />
                <span>Create Package Design</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Design modern luxury logo for my package front panel")}>
                <Palette style={{ width: '13px', height: '13px' }} />
                <span>Logo Design</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Generate elegant 3D studio background for packaging")}>
                <ImageIcon style={{ width: '13px', height: '13px' }} />
                <span>Generate Background</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Remove background from package scene")}>
                <Scissors style={{ width: '13px', height: '13px' }} />
                <span>Remove Background</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Generate 3D box unboxing video animation")}>
                <Video style={{ width: '13px', height: '13px' }} />
                <span>Generate Video</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-thread">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
                {msg.sender === 'assistant' && (
                  <div className="ai-avatar">✦</div>
                )}
                <div className={`chat-bubble ${msg.sender}`}>
                  <div>{msg.text}</div>
                  
                  {/* Dieline Detection Result Card */}
                  {msg.dielineMatch && (
                    <div className="ai-dieline-card">
                      <div className="ai-dieline-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileCheck style={{ width: '16px', height: '16px', color: '#059669' }} />
                          <span style={{ fontSize: '13px', fontWeight: '800' }}>Directory Match Found</span>
                        </div>
                        <div className="ai-match-badge">
                          <span>{msg.dielineMatch.confidence}% Match</span>
                          <span>•</span>
                          <span>{msg.dielineMatch.isExactMatch ? 'Exact Box' : 'Nearest Box'}</span>
                        </div>
                      </div>

                      {/* Side-by-side Blueprint & 3D Render from Directory */}
                      <div className="ai-dieline-preview-grid">
                        <div className="ai-dieline-preview-card">
                          <img 
                            src={msg.dielineMatch.dieline2DImg} 
                            alt={msg.dielineMatch.matchedTitle}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span className="ai-dieline-preview-label">2D CAD Dieline</span>
                        </div>
                        <div className="ai-dieline-preview-card">
                          <img 
                            src={msg.dielineMatch.box3DImg} 
                            alt={msg.dielineMatch.matchedTitle}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span className="ai-dieline-preview-label">3D Studio Fold</span>
                        </div>
                      </div>

                      {/* Box Specifications */}
                      <div style={{ background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Matched Model:</strong> {msg.dielineMatch.matchedTitle} (<code>{msg.dielineMatch.matchedModelKey}</code>)</div>
                        {msg.dielineMatch.dimensions && (
                          <div><strong>Detected Dimensions:</strong> {msg.dielineMatch.dimensions.L} × {msg.dielineMatch.dimensions.W} × {msg.dielineMatch.dimensions.H} mm</div>
                        )}
                        {msg.dielineMatch.detectedFeatures && msg.dielineMatch.detectedFeatures.length > 0 && (
                          <div style={{ marginTop: '2px', color: '#71717a' }}>
                            <strong>Structural Signature:</strong> {msg.dielineMatch.detectedFeatures.join(' • ')}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {(() => {
                        const isModelApplied = (store?.boxModel === msg.dielineMatch.matchedModelKey);
                        return (
                          <>
                            {isModelApplied && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                borderRadius: '8px',
                                color: '#065f46',
                                fontSize: '11px',
                                fontWeight: '700',
                                marginBottom: '8px'
                              }}>
                                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#059669', flexShrink: 0 }} />
                                <span>Active on 3D Canvas: {msg.dielineMatch.matchedTitle}</span>
                              </div>
                            )}

                            <div className="ai-dieline-actions">
                              <button 
                                className={`ai-dieline-btn ${isModelApplied ? 'applied' : 'primary'}`}
                                onClick={() => {
                                  if (onApplyBoxModel) {
                                    onApplyBoxModel(msg.dielineMatch.matchedModelKey, msg.dielineMatch.dimensionsIn, msg.dielineMatch.dimensions);
                                  } else {
                                    if (store.setBoxModel) store.setBoxModel(msg.dielineMatch.matchedModelKey);
                                    if (msg.dielineMatch.dimensionsIn && store.setDim) {
                                      store.setDim('L', msg.dielineMatch.dimensionsIn.L);
                                      store.setDim('W', msg.dielineMatch.dimensionsIn.W);
                                      store.setDim('H', msg.dielineMatch.dimensionsIn.H);
                                    }
                                  }
                                }}
                              >
                                {isModelApplied ? (
                                  <>
                                    <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                                    <span>Applied to 3D Studio</span>
                                  </>
                                ) : (
                                  <>
                                    <Box style={{ width: '13px', height: '13px' }} />
                                    <span>Apply to 3D Studio</span>
                                  </>
                                )}
                              </button>

                              <button 
                                className="ai-dieline-btn secondary"
                                onClick={() => handleDownloadDielineDXF(msg.dielineMatch.matchedModelKey)}
                              >
                                <Download style={{ width: '13px', height: '13px' }} />
                                <span>Export DXF</span>
                              </button>

                              <button 
                                className="ai-dieline-btn secondary"
                                onClick={() => handleSendPrompt(`Design packaging for ${msg.dielineMatch.matchedTitle} with dimensions ${msg.dielineMatch.dimensions.L}x${msg.dielineMatch.dimensions.W}x${msg.dielineMatch.dimensions.H} mm`)}
                              >
                                <Sparkles style={{ width: '13px', height: '13px', color: '#2563eb' }} />
                                <span>AI Design</span>
                              </button>
                            </div>

                            {/* Optional Alternatives Collapsible Section */}
                            {msg.dielineMatch.suggestions && msg.dielineMatch.suggestions.length > 0 && (
                              <details style={{ marginTop: '10px', borderTop: '1px dashed #e4e4e7', paddingTop: '8px' }}>
                                <summary style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#71717a',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '2px 0'
                                }}>
                                  <span>Switch to an alternative box model (Optional)</span>
                                  <span style={{ fontSize: '10px', color: '#a1a1aa' }}>▾</span>
                                </summary>
                                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '6px', marginBottom: '8px', lineHeight: '1.4' }}>
                                  The detected <strong>{msg.dielineMatch.matchedTitle}</strong> is active. You can override it below if desired:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {msg.dielineMatch.suggestions.map((sug: any) => {
                                    const isSugActive = store?.boxModel === sug.key;
                                    return (
                                      <div
                                        key={sug.key}
                                        onClick={() => {
                                          if (onApplyBoxModel) {
                                            onApplyBoxModel(sug.key, sug.defaultDimsIn, sug.defaultDims);
                                          } else {
                                            if (store.setBoxModel) store.setBoxModel(sug.key);
                                            if (sug.defaultDimsIn && store.setDim) {
                                              store.setDim('L', sug.defaultDimsIn.L);
                                              store.setDim('W', sug.defaultDimsIn.W);
                                              store.setDim('H', sug.defaultDimsIn.H);
                                            }
                                          }
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '6px 10px',
                                          background: isSugActive ? '#eff6ff' : 'rgba(0,0,0,0.02)',
                                          border: isSugActive ? '1px solid #3b82f6' : '1px solid #e4e4e7',
                                          borderRadius: '8px',
                                          cursor: 'pointer'
                                        }}
                                        onMouseEnter={e => { if (!isSugActive) e.currentTarget.style.background = '#f4f4f5'; }}
                                        onMouseLeave={e => { if (!isSugActive) e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <img 
                                            src={sug.box3DImg} 
                                            alt={sug.name} 
                                            style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} 
                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                          />
                                          <div>
                                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#18181b' }}>{sug.name}</div>
                                            {sug.defaultDims && (
                                              <div style={{ fontSize: '9px', color: '#71717a' }}>{sug.defaultDims.L}×{sug.defaultDims.W}×{sug.defaultDims.H} mm</div>
                                            )}
                                          </div>
                                        </div>
                                        <span style={{ fontSize: '10px', color: isSugActive ? '#2563eb' : '#71717a', fontWeight: '700' }}>
                                          {isSugActive ? '✓ Active' : 'Select Box →'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </details>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Concept directions if available */}
                  {msg.directions && msg.directions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase' }}>Design Concept Directions:</div>
                      {msg.directions.map((d: any) => (
                        <button
                          key={d.id}
                          onClick={() => handleSendPrompt(`Apply design concept "${d.title}"`)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <span>{d.title}</span>
                          <ChevronRight style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Generated Render Grid */}
                  {msg.variations && msg.variations.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      <div className="ai-render-grid">
                        {msg.variations.map((v: any) => (
                          <div 
                            key={v.id} 
                            className="ai-render-card"
                            onClick={() => {
                              if (onApplyVariation) {
                                onApplyVariation(v);
                              } else {
                                applyWrapToStore(v);
                              }
                            }}
                          >
                            <img 
                              src={v.backgroundUrl || v.url} 
                              alt={v.title}
                              onError={(e) => {
                                e.currentTarget.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                                  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#18181b"/><text x="150" y="150" font-family="sans-serif" font-size="14" fill="#2563eb" text-anchor="middle">KLD AI RENDER</text></svg>`
                                )}`;
                              }}
                            />
                            <div className="ai-render-card-overlay">
                              <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700' }}>Apply to Box</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => handleDownloadDielineDXF()}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
                      >
                        <Download style={{ width: '13px', height: '13px' }} />
                        <span>Export Vector DXF Dieline</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            ))}

            {/* Dieline Detection in Progress */}
            {isDetectingFile && (
              <div className="chat-bubble-row assistant">
                <div className="ai-avatar">✦</div>
                <div className="chat-bubble assistant">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a' }}>
                    <ScanLine className="animate-spin" style={{ width: '15px', height: '15px', color: '#2563eb' }} />
                    <span>Analyzing dieline CAD entities & geometry... Matching across 6 directory box models...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Continuous Background Generation Progress Display */}
            {isLoading && (
              <div className="chat-bubble-row assistant">
                <div className="ai-avatar">✦</div>
                <div className="chat-bubble assistant" style={{ width: '100%', maxWidth: '90%' }}>
                  <div className="ai-progress-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb' }}>
                        <Sparkles className="animate-spin" style={{ width: '14px', height: '14px' }} />
                        <span>Generating in background...</span>
                      </div>
                      <span style={{ color: '#71717a' }}>{generationProgress > 0 ? `${generationProgress}%` : ''}</span>
                    </div>

                    <div className="ai-progress-bar-bg">
                      <div className="ai-progress-bar-fill" style={{ width: `${Math.max(15, generationProgress)}%` }} />
                    </div>

                    <div style={{ fontSize: '11px', color: '#71717a', lineHeight: '1.4' }}>
                      {generationStepText}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- FOOTER INPUT BAR --- */}
      <div className="ai-footer">
        {/* Box Model Tag Selector */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', paddingLeft: '4px', scrollbarWidth: 'none' }}>
          {[
            { id: null, label: 'Auto (AI)' },
            { id: 'rte', label: 'Reverse Tuck' },
            { id: 'te', label: 'Straight Tuck' },
            { id: 'auto_lock', label: 'Auto-Lock' },
            { id: 'cosmetic', label: 'Cosmetic Box' },
            { id: 'cosmetic_b', label: 'Mailer/Tray' },
            { id: 'button_hole', label: 'Button Hole' }
          ].map(tag => (
            <button
              key={tag.id || 'auto'}
              onClick={() => {
                setSelectedBoxModelOverride(tag.id);
                if (tag.id && onApplyBoxModel) {
                  onApplyBoxModel(tag.id);
                }
              }}
              style={{
                background: selectedBoxModelOverride === tag.id ? '#2563eb' : '#f4f4f5',
                color: selectedBoxModelOverride === tag.id ? '#ffffff' : '#71717a',
                border: '1px solid',
                borderColor: selectedBoxModelOverride === tag.id ? '#2563eb' : '#e4e4e7',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <div className="ai-input-wrapper">
          <textarea
            className="ai-textarea"
            placeholder="Describe your product, brand, and style (e.g. matcha cookies box, 120x80x200 mm, sage green)..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
          />
          <div className="ai-input-controls">
            <div className="ai-tool-buttons">
              {/* Dieline Upload & Detection Button */}
              <button 
                type="button"
                className="ai-dieline-upload-pill-btn" 
                onClick={() => fileInputRef.current?.click()} 
                title="Upload DXF / SVG / Image to detect box dieline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Upload style={{ width: '13px', height: '13px' }} />
                <span>Upload Dieline</span>
              </button>

              <button className="ai-subtool-btn" onClick={() => fileInputRef.current?.click()} title="Attach image reference">
                <ImageIcon style={{ width: '15px', height: '15px' }} />
              </button>

              <button className="ai-subtool-btn" title="Browse prompt templates" onClick={() => handleSendPrompt("Create modern luxury perfume box in matte black with gold foil logo")}>
                <LayoutGrid style={{ width: '15px', height: '15px' }} />
              </button>
            </div>

            <button 
              className={`ai-send-btn ${inputPrompt.trim() ? 'active' : ''}`}
              onClick={() => handleSendPrompt()}
              disabled={!inputPrompt.trim() || isLoading}
            >
              <Send style={{ width: '15px', height: '15px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
