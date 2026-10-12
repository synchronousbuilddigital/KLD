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
  ArrowRight,
  Trash2
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
  filePreview?: {
    type: 'image' | 'svg' | 'dxf' | 'other';
    name: string;
    sizeFormatted: string;
    url?: string;
    svgPreview?: string;
  };
}

function generateDxfWireframeSvg(dxfText: string): string {
  const lines = dxfText.split(/\r?\n/);
  const entities: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let cur: any = null;
  let code: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (i % 2 === 0) {
      code = parseInt(line, 10);
    } else {
      if (code === 0) {
        if (cur && cur.x1 !== undefined && cur.y1 !== undefined && cur.x2 !== undefined && cur.y2 !== undefined) {
          entities.push(cur);
        }
        cur = line.toUpperCase() === 'LINE' ? {} : null;
      } else if (cur) {
        if (code === 10) cur.x1 = parseFloat(line);
        else if (code === 20) cur.y1 = parseFloat(line);
        else if (code === 11) cur.x2 = parseFloat(line);
        else if (code === 21) cur.y2 = parseFloat(line);
      }
    }
  }
  if (cur && cur.x1 !== undefined && cur.y1 !== undefined && cur.x2 !== undefined && cur.y2 !== undefined) {
    entities.push(cur);
  }

  if (entities.length === 0) return '';

  const xs = entities.flatMap(e => [e.x1, e.x2]).filter(n => !isNaN(n));
  const ys = entities.flatMap(e => [e.y1, e.y2]).filter(n => !isNaN(n));
  if (xs.length === 0 || ys.length === 0) return '';

  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const pad = Math.max(w, h) * 0.05;
  const strokeW = Math.max(0.6, w / 350);

  const lineTags = entities.slice(0, 1000).map(e => {
    const y1 = maxY - (e.y1 - minY);
    const y2 = maxY - (e.y2 - minY);
    return `<line x1="${e.x1}" y1="${y1}" x2="${e.x2}" y2="${y2}" stroke="#38bdf8" stroke-width="${strokeW}" stroke-linecap="round"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}" style="width:100%;height:100%;">${lineTags}</svg>`;
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
  const [appliedVariationUrl, setAppliedVariationUrl] = useState<string | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<any>(null);

  // Automatically start a fresh chat and archive old chat when AI Creation navigation is clicked
  useEffect(() => {
    const handleAiCreationEvent = () => {
      handleNewChat();
    };
    window.addEventListener('ai-creation-click', handleAiCreationEvent);
    return () => {
      window.removeEventListener('ai-creation-click', handleAiCreationEvent);
    };
  }, [messages, chatHistory]);

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
            // Decals are strictly independent: do NOT auto-apply to the 3D box model
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
      const updatedHistory = [historyItem, ...chatHistory].slice(0, 20);
      setChatHistory(updatedHistory);
      try {
        localStorage.setItem('pacdora_ai_chat_history', JSON.stringify(updatedHistory));
      } catch (e) {}
    }

    // Clear active chat to reveal clean canvas and hero screen
    setMessages([]);
    localStorage.removeItem('kld_ai_history');
    setLargeData('kld_ai_history', []);
    setShowHistory(false);
    setInputPrompt('');

    // Independent decal rule: clear decals on fresh chat
    if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
    else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
    if (typeof store.setDecals === 'function') store.setDecals([]);
    setAppliedVariationUrl(null);
    if (onApplyVariation) onApplyVariation(null);
    else applyWrapToStore(null);
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

  // Delete a single saved chat session from history
  const handleDeleteHistoryItem = (histId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chatHistory.filter(h => h.id !== histId);
    setChatHistory(updated);
    try {
      localStorage.setItem('pacdora_ai_chat_history', JSON.stringify(updated));
    } catch (e) {}
  };

  // Clear all saved chat history
  const handleClearAllHistory = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setChatHistory([]);
    try {
      localStorage.removeItem('pacdora_ai_chat_history');
    } catch (e) {}
  };

  // Clear the current active conversation
  const handleDeleteCurrentChat = () => {
    if (messages.length === 0) return;
    setMessages([]);
    localStorage.removeItem('kld_ai_history');
    setLargeData('kld_ai_history', []);
    if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
    else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
    if (typeof store.setDecals === 'function') store.setDecals([]);
    setAppliedVariationUrl(null);
    if (onApplyVariation) onApplyVariation(null);
    else applyWrapToStore(null);
    setInputPrompt('');
  };

  const applyWrapToStore = (variation: any) => {
    const s = customStore ? customStore.getState() : useBoxStore.getState();
    if (!variation) {
      if (typeof s.setDecals === 'function') s.setDecals([]);
      if (typeof s.setAiDecals === 'function') s.setAiDecals([]);
      return;
    }
    const bgUrl = variation?.backgroundUrl || variation?.url;
    if (!bgUrl) return;
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
          if (action.model) {
            setAppliedVariationUrl(null);
            if (onApplyVariation) onApplyVariation(null);
            else applyWrapToStore(null);
            if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
            else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
            if (typeof store.setDecals === 'function') store.setDecals([]);
            if (onApplyBoxModel) {
              onApplyBoxModel(action.model);
            } else if (typeof store.setBoxModel === 'function') {
              store.setBoxModel(action.model);
            }
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

    // Any new prompt starts with a clean/blank box: decals are strictly opt-in via 3D Studio button!
    setAppliedVariationUrl(null);
    if (onApplyVariation) onApplyVariation(null);
    else applyWrapToStore(null);
    if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
    else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
    if (typeof store.setDecals === 'function') store.setDecals([]);

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
        // Decals are strictly independent: do NOT auto-apply to the 3D box model
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

    // Reset decals immediately when uploading so the box is clean
    setAppliedVariationUrl(null);
    if (onApplyVariation) onApplyVariation(null);
    else applyWrapToStore(null);
    if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
    else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
    if (typeof store.setDecals === 'function') store.setDecals([]);

    let filePreview: any = null;
    const lowerName = file.name.toLowerCase();

    if (file.type.startsWith('image/') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp')) {
      const url = URL.createObjectURL(file);
      filePreview = {
        type: 'image',
        name: file.name,
        sizeFormatted: (file.size / 1024).toFixed(1) + ' KB',
        url
      };
    } else if (file.type === 'image/svg+xml' || lowerName.endsWith('.svg')) {
      const url = URL.createObjectURL(file);
      filePreview = {
        type: 'svg',
        name: file.name,
        sizeFormatted: (file.size / 1024).toFixed(1) + ' KB',
        url
      };
    } else if (lowerName.endsWith('.dxf')) {
      try {
        const text = await file.text();
        const svgPreview = generateDxfWireframeSvg(text);
        filePreview = {
          type: 'dxf',
          name: file.name,
          sizeFormatted: (file.size / 1024).toFixed(1) + ' KB',
          svgPreview
        };
      } catch (e) {
        filePreview = {
          type: 'dxf',
          name: file.name,
          sizeFormatted: (file.size / 1024).toFixed(1) + ' KB'
        };
      }
    } else {
      filePreview = {
        type: 'other',
        name: file.name,
        sizeFormatted: (file.size / 1024).toFixed(1) + ' KB'
      };
    }

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: `Uploaded dieline file: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`,
      filePreview,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsDetectingFile(true);

    try {
      const result = await detectDielineFile(file);
      if (result) {
        result.uploadedFilePreview = filePreview;
        result.uploadedFileName = file.name;
      }

      // Decals are strictly independent: clear existing decals so detected box starts clean
      setAppliedVariationUrl(null);
      if (onApplyVariation) onApplyVariation(null);
      else applyWrapToStore(null);
      if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
      else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
      if (typeof store.setDecals === 'function') store.setDecals([]);

      // Auto-apply to store so the 3D model immediately syncs with the detected box
      if (result.matchedModelKey) {
        if (onApplyBoxModel) {
          onApplyBoxModel(result.matchedModelKey, result.dimensionsIn, result.dimensions);
        } else if (typeof store.setBoxModel === 'function') {
          store.setBoxModel(result.matchedModelKey);
        }
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
  const handleDownloadDielineDXF = (modelOverride?: string, dimsOverride?: any) => {
    try {
      const activeModel = modelOverride || store.boxModel || 'rte';
      const params = {
        L: dimsOverride?.L || store.L || 4.7244,
        W: dimsOverride?.W || store.W || 2.3622,
        H: dimsOverride?.H || store.H || 6.2992,
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
          {messages.length > 0 && (
            <button 
              className="ai-icon-btn" 
              onClick={handleDeleteCurrentChat} 
              title="Delete / Clear Active Chat"
              style={{ color: '#ef4444' }}
            >
              <Trash2 style={{ width: '15px', height: '15px' }} />
            </button>
          )}

          <button className="ai-icon-btn" onClick={handleNewChat} title="New Chat">
            <Plus style={{ width: '18px', height: '18px' }} />
          </button>

          <div style={{ position: 'relative' }}>
            <button className={`ai-icon-btn ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory(!showHistory)} title="Chat History">
              <History style={{ width: '15px', height: '15px' }} />
            </button>
            {showHistory && (
              <div style={{ position: 'absolute', top: '34px', right: '0', width: '280px', background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', boxShadow: '0 10px 35px rgba(0,0,0,0.12)', zIndex: 50, padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f4f4f5', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#71717a', textTransform: 'uppercase' }}>Recent Chats</span>
                  {chatHistory.length > 0 && (
                    <button
                      onClick={handleClearAllHistory}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Clear all saved chats"
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {chatHistory.length === 0 ? (
                  <div style={{ padding: '16px 8px', fontSize: '12px', color: '#a1a1aa', textAlign: 'center' }}>No saved chats.</div>
                ) : (
                  <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {chatHistory.map(hist => (
                      <div 
                        key={hist.id} 
                        onClick={() => handleRestoreChat(hist)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f4f4f5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#27272a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {hist.title}
                          </span>
                          <span style={{ fontSize: '10px', color: '#a1a1aa' }}>{hist.date}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(hist.id, e)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
                          title="Delete this chat"
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
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
                  
                  {/* Uploaded File Preview Card */}
                  {msg.filePreview && (
                    <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                      {/* Image Preview */}
                      {msg.filePreview.type === 'image' && msg.filePreview.url && (
                        <div style={{ position: 'relative', width: '100%', maxHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '10px' }}>
                          <img 
                            src={msg.filePreview.url} 
                            alt={msg.filePreview.name} 
                            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                        </div>
                      )}

                      {/* SVG Preview */}
                      {msg.filePreview.type === 'svg' && msg.filePreview.url && (
                        <div style={{ position: 'relative', width: '100%', maxHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', padding: '10px' }}>
                          <img 
                            src={msg.filePreview.url} 
                            alt={msg.filePreview.name} 
                            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                          />
                        </div>
                      )}

                      {/* DXF CAD Blueprint Wireframe */}
                      {msg.filePreview.type === 'dxf' && msg.filePreview.svgPreview && (
                        <div 
                          style={{ width: '100%', height: '190px', background: '#090d16', padding: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          dangerouslySetInnerHTML={{ __html: msg.filePreview.svgPreview }}
                        />
                      )}

                      {/* Footer Badge with filename & size */}
                      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '10px', fontWeight: '900', background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: '5px', textTransform: 'uppercase' }}>
                            {msg.filePreview.type}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {msg.filePreview.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>
                          {msg.filePreview.sizeFormatted}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Dieline Detection Result Card - 2 Box Recommendations */}
                  {msg.dielineMatch && (() => {
                    const match = msg.dielineMatch;

                    // Compute Primary Recommendation (Most Accurate Dieline - Highest Score)
                    const rec1 = match.primaryRecommendation || {
                      rank: 1,
                      matchedModelKey: match.matchedModelKey,
                      matchedTitle: match.matchedTitle,
                      subtitle: match.matchedBox?.subtitle || match.subtitle || 'Standard Folding Carton Structure',
                      confidence: match.confidence || 94,
                      isExactMatch: match.isExactMatch !== false,
                      dimensions: match.dimensions || { L: 120, W: 60, H: 160 },
                      dimensionsIn: match.dimensionsIn,
                      detectedFeatures: match.detectedFeatures || [],
                      dieline2DImg: match.dieline2DImg || '/images/dielines/ste_real.png',
                      box3DImg: match.box3DImg || '/images/boxes/ste_white.jpg',
                      badgeText: 'Most Accurate Dieline'
                    };

                    // Compute Secondary Recommendation (Runner-up Box - Lower Score)
                    let rec2 = match.secondaryRecommendation;
                    if (!rec2) {
                      const altKey = match.matchedModelKey === 'te' ? 'rte' : (match.matchedModelKey === 'rte' ? 'te' : 'rte');
                      const altBox = match.suggestions?.find((s: any) => s.key === altKey) || match.suggestions?.[0] || {
                        key: altKey,
                        name: altKey === 'rte' ? 'Reverse Tuck End Box (RTE)' : 'Straight Tuck End Box (STE)',
                        subtitle: altKey === 'rte' ? 'Standard Folding Carton • Opposite Tuck Flaps' : 'Clean Front Display • Same-Direction Tuck Flaps',
                        dieline2DImg: altKey === 'rte' ? '/images/dielines/rte_real.png' : '/images/dielines/ste_real.png',
                        box3DImg: altKey === 'rte' ? '/images/boxes/rte_white.jpg' : '/images/boxes/ste_white.jpg'
                      };
                      const lowerScore = Math.max(68, Math.min((rec1.confidence || 92) - 12, Math.round((rec1.confidence || 92) * 0.83)));
                      rec2 = {
                        rank: 2,
                        matchedModelKey: altBox.key,
                        matchedTitle: altBox.name,
                        subtitle: altBox.subtitle,
                        confidence: lowerScore,
                        isExactMatch: false,
                        dimensions: rec1.dimensions,
                        dimensionsIn: rec1.dimensionsIn,
                        detectedFeatures: [
                          altBox.key === 'rte' ? 'Top and bottom tuck flaps fold in reverse/opposite directions' : 'Top and bottom flaps fold towards same front face',
                          'Alternative 4-panel folding carton profile'
                        ],
                        dieline2DImg: altBox.dieline2DImg,
                        box3DImg: altBox.box3DImg,
                        badgeText: 'Alternative Recommendation'
                      };
                    }

                    const recommendations = [rec1, rec2];

                    const handleApplyRec = (rec: any) => {
                      setAppliedVariationUrl(null);
                      if (onApplyVariation) onApplyVariation(null);
                      else applyWrapToStore(null);
                      if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
                      else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
                      if (typeof store.setDecals === 'function') store.setDecals([]);

                      if (onApplyBoxModel) {
                        onApplyBoxModel(rec.matchedModelKey, rec.dimensionsIn, rec.dimensions);
                      } else {
                        if (store.setBoxModel) store.setBoxModel(rec.matchedModelKey);
                        if (rec.dimensionsIn && store.setDim) {
                          store.setDim('L', rec.dimensionsIn.L);
                          store.setDim('W', rec.dimensionsIn.W);
                          store.setDim('H', rec.dimensionsIn.H);
                        }
                      }
                    };

                    return (
                      <div className="ai-dieline-card">
                        <div className="ai-dieline-card-header">
                          <div className="ai-dieline-header-left">
                            <div className="ai-dieline-header-icon">
                              <ScanLine style={{ width: '16px', height: '16px' }} />
                            </div>
                            <div>
                              <div className="ai-dieline-header-title">CAD Structural Topology Scan</div>
                              <div className="ai-dieline-header-subtitle">2 box models matched from our parametric directory</div>
                            </div>
                          </div>
                          <div className="ai-match-count-badge">
                            2 Box Fits
                          </div>
                        </div>

                        {/* Uploaded File Reference Preview Banner */}
                        {match.uploadedFilePreview && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', margin: '0 0 12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {match.uploadedFilePreview.type === 'image' || match.uploadedFilePreview.type === 'svg' ? (
                                <img src={match.uploadedFilePreview.url} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : match.uploadedFilePreview.type === 'dxf' && match.uploadedFilePreview.svgPreview ? (
                                <div style={{ width: '100%', height: '100%', background: '#090d16' }} dangerouslySetInnerHTML={{ __html: match.uploadedFilePreview.svgPreview }} />
                              ) : (
                                <FileCheck style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Uploaded: {match.uploadedFilePreview.name}
                              </div>
                              <div style={{ fontSize: '10px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                                <span>CAD topology matched with our directory box</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2 Recommendations Stacked Vertically */}
                        <div className="ai-recommendations-list">
                          {recommendations.map((rec: any, idx: number) => {
                            const isPrimary = (idx === 0);
                            const isApplied = (store?.boxModel === rec.matchedModelKey);

                            return (
                              <div 
                                key={rec.matchedModelKey + '-' + idx} 
                                className={`ai-rec-card ${isPrimary ? 'primary' : 'secondary'} ${isApplied ? 'is-active' : ''}`}
                              >
                                {/* Header with Rank and Score */}
                                <div className="ai-rec-header">
                                  <div className="ai-rec-title-group">
                                    <div className={`ai-rec-rank-pill ${isPrimary ? 'primary' : 'secondary'}`}>
                                      {isPrimary ? (
                                        <>
                                          <Sparkles style={{ width: '10px', height: '10px', color: '#059669' }} />
                                          <span>#1 Best Match • Most Accurate</span>
                                        </>
                                      ) : (
                                        <>
                                          <Layers style={{ width: '10px', height: '10px', color: '#2563eb' }} />
                                          <span>#2 Alternative Fit • Runner-Up</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="ai-rec-box-name">
                                      <span>{rec.matchedTitle}</span>
                                      <span className="ai-rec-code-tag">{rec.matchedModelKey}</span>
                                    </div>
                                    {rec.subtitle && (
                                      <div className="ai-rec-subtitle">{rec.subtitle}</div>
                                    )}
                                  </div>

                                  <div className={`ai-rec-score-badge ${isPrimary ? 'primary' : 'secondary'}`}>
                                    <span className="ai-score-dot" />
                                    <span>{rec.confidence}% Match</span>
                                  </div>
                                </div>

                                {/* Dual Previews: 2D CAD & 3D Fold */}
                                <div className="ai-rec-preview-grid">
                                  <div className="ai-rec-preview-card">
                                    <img 
                                      src={rec.dieline2DImg} 
                                      alt={`${rec.matchedTitle} 2D Dieline`}
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <span className="ai-rec-preview-label">
                                      <span>📐 2D Dieline</span>
                                    </span>
                                  </div>
                                  <div className="ai-rec-preview-card">
                                    <img 
                                      src={rec.box3DImg} 
                                      alt={`${rec.matchedTitle} 3D Fold`}
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <span className="ai-rec-preview-label">
                                      <span>📦 3D Fold</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Dimensions & Structural Specifications */}
                                <div className="ai-rec-specs-box">
                                  {rec.dimensions && (
                                    <div className="ai-rec-dims-row">
                                      <span style={{ fontWeight: '700', color: '#64748b' }}>Dimensions:</span>
                                      <span className="ai-rec-dim-tag">
                                        <span>📏 {rec.dimensions.L} × {rec.dimensions.W} × {rec.dimensions.H} mm</span>
                                      </span>
                                    </div>
                                  )}

                                  {rec.detectedFeatures && rec.detectedFeatures.length > 0 && (
                                    <div className="ai-rec-features-list">
                                      {rec.detectedFeatures.map((feat: string, fIdx: number) => (
                                        <div key={fIdx} className="ai-rec-feature-item">
                                          <span style={{ color: isPrimary ? '#059669' : '#2563eb', fontWeight: '800' }}>•</span>
                                          <span>{feat}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Active canvas banner */}
                                {isApplied && (
                                  <div className="ai-rec-active-status">
                                    <CheckCircle2 style={{ width: '13px', height: '13px', color: '#059669', flexShrink: 0 }} />
                                    <span>Active in 3D Canvas Studio</span>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="ai-rec-actions">
                                  <button 
                                    className={`ai-rec-btn ${isApplied ? 'active' : 'primary'}`}
                                    onClick={() => handleApplyRec(rec)}
                                  >
                                    {isApplied ? (
                                      <>
                                        <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                                        <span>Applied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Box style={{ width: '13px', height: '13px' }} />
                                        <span>{isPrimary ? 'Apply to 3D Studio' : 'Switch to This Box'}</span>
                                      </>
                                    )}
                                  </button>

                                  <button 
                                    className="ai-rec-btn secondary"
                                    onClick={() => handleDownloadDielineDXF(rec.matchedModelKey, rec.dimensionsIn)}
                                  >
                                    <Download style={{ width: '13px', height: '13px' }} />
                                    <span>Export DXF</span>
                                  </button>

                                  <button 
                                    className="ai-rec-btn sparkle"
                                    onClick={() => handleSendPrompt(`Design packaging for ${rec.matchedTitle} with dimensions ${rec.dimensions?.L || 120}x${rec.dimensions?.W || 60}x${rec.dimensions?.H || 160} mm`)}
                                  >
                                    <Sparkles style={{ width: '13px', height: '13px' }} />
                                    <span>AI Design</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Collapsible remaining directory alternatives */}
                        {match.suggestions && match.suggestions.length > 0 && (
                          <details style={{ marginTop: '4px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                            <summary style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#64748b',
                              cursor: 'pointer',
                              userSelect: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '2px 0'
                            }}>
                              <span>Other Packaging Directory Models</span>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>▾</span>
                            </summary>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                              {match.suggestions.map((sug: any) => {
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
                                      border: isSugActive ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <img 
                                        src={sug.box3DImg} 
                                        alt={sug.name} 
                                        style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} 
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                      />
                                      <div>
                                        <div style={{ fontSize: '11px', fontWeight: '700' }}>{sug.name}</div>
                                        {sug.defaultDims && (
                                          <div style={{ fontSize: '9px', color: '#64748b' }}>{sug.defaultDims.L}×{sug.defaultDims.W}×{sug.defaultDims.H} mm</div>
                                        )}
                                      </div>
                                    </div>
                                    <span style={{ fontSize: '10px', color: isSugActive ? '#2563eb' : '#64748b', fontWeight: '700' }}>
                                      {isSugActive ? '✓ Active' : 'Select Box →'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}

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

                  {/* Generated Artwork Variations — Strictly Independent & Opt-in */}
                  {msg.variations && msg.variations.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Artwork Variations (Click 3D Studio to View)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                        {msg.variations.map((v: any, idx: number) => {
                          const vUrl = v.backgroundUrl || v.url;
                          const isApplied = (appliedVariationUrl === vUrl);
                          return (
                            <div 
                              key={v.id || idx} 
                              style={{
                                background: '#ffffff',
                                border: isApplied ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                boxShadow: isApplied ? '0 4px 14px rgba(37,99,235,0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
                                <img 
                                  src={vUrl} 
                                  alt={v.title || `Variation ${idx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                                      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#18181b"/><text x="150" y="150" font-family="sans-serif" font-size="14" fill="#2563eb" text-anchor="middle">KLD AI RENDER</text></svg>`
                                    )}`;
                                  }}
                                />
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {v.title || `Variation ${idx + 1}`}
                              </div>
                              <button
                                onClick={() => {
                                  if (isApplied) {
                                    // Remove decal from 3D studio
                                    setAppliedVariationUrl(null);
                                    if (onApplyVariation) onApplyVariation(null);
                                    else applyWrapToStore(null);
                                  } else {
                                    // Apply ONLY this specific decal to 3D studio
                                    setAppliedVariationUrl(vUrl);
                                    if (onApplyVariation) onApplyVariation(v);
                                    else applyWrapToStore(v);
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  borderRadius: '7px',
                                  border: 'none',
                                  background: isApplied ? '#059669' : '#2563eb',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s ease'
                                }}
                                title={isApplied ? 'Click to remove decal from 3D studio' : 'Apply this decal to 3D studio'}
                              >
                                {isApplied ? (
                                  <>
                                    <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                                    <span>3D Active</span>
                                  </>
                                ) : (
                                  <>
                                    <Box style={{ width: '12px', height: '12px' }} />
                                    <span>3D Studio</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button 
                        onClick={() => handleDownloadDielineDXF()}
                        style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
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
                // Independent decal rule: clear decals when switching box models
                setAppliedVariationUrl(null);
                if (onApplyVariation) onApplyVariation(null);
                else applyWrapToStore(null);
                if (typeof store.clearAllAiDecals === 'function') store.clearAllAiDecals();
                else if (typeof store.setAiDecals === 'function') store.setAiDecals([]);
                if (typeof store.setDecals === 'function') store.setDecals([]);
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
