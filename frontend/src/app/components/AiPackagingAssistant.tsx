// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useBoxStore } from '../../lib/useBoxStore';
import { sendAiChatMessage, sendAiChatMessageV2 } from '../../services/ai';
import { generateRTEDielineDXF } from '../../lib/rteDielineGenerator';
import { generateTEDielineDXF } from '../../lib/teDielineGenerator';
import { generateAutoLockDieline } from '../../lib/autoLockDielineGenerator';
import { generateCosmeticBoxDieline } from '../../lib/cosmeticBoxDielineGenerator';
import { generateDXFString } from '../../lib/exportUtils';
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
  ChevronRight
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  directions?: any[];
  variations?: any[];
  actionsApplied?: string[];
}

interface AiPackagingAssistantProps {
  onClose?: () => void;
  isOpen?: boolean;
  useStore?: any;
  onApplyVariation?: (variation: any) => void;
}

export default function AiPackagingAssistant({ onClose, isOpen = true, useStore: customStore, onApplyVariation }: AiPackagingAssistantProps) {
  const storeHook = customStore || useBoxStore;
  const store = storeHook((state: any) => state);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('kld_ai_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load AI history");
    }
    return [];
  });
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBoxModelOverride, setSelectedBoxModelOverride] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'v1' | 'v2'>('v2');
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('pacdora_ai_chat_history');
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  // Save current thread to history
  const handleNewChat = () => {
    if (messages.length > 0) {
      const title = messages.find(m => m.sender === 'user')?.text || 'New Design Chat';
      const historyItem = {
        id: 'hist-' + Date.now(),
        title: title.length > 40 ? title.substring(0, 40) + '...' : title,
        date: new Date().toLocaleDateString(),
        messages: [...messages]
      };
      const updatedHistory = [historyItem, ...chatHistory].slice(0, 10); // Keep last 10
      setChatHistory(updatedHistory);
      localStorage.setItem('pacdora_ai_chat_history', JSON.stringify(updatedHistory));
    }
    setMessages([]);
    setShowHistory(false);
  };

  const handleRestoreChat = (historyItem: any) => {
    setMessages(historyItem.messages);
    setShowHistory(false);
  };

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem('kld_ai_history', JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to save AI history");
    }
  }, [messages]);

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

    try {
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

      const res = generationMode === 'v2' 
        ? await sendAiChatMessageV2(prompt, boxContext)
        : await sendAiChatMessage(prompt, boxContext);

      if (res.actions) {
        applyActionsToStore(res.actions);
      }

      // Removed destructive store.setDecals block to preserve Workshop state
      
      const aiMsg: Message = {
        id: 'msg-ai-' + Date.now(),
        sender: 'assistant',
        text: res.reply || res.outputsSummary || 'Design generated successfully.',
        directions: res.directions || [],
        variations: res.renderVariations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Let MockupDetails handle the renders
      if (res.renderVariations && res.renderVariations.length > 0) {
        useBoxStore.setState({ generatedRenders: res.renderVariations });
      }
    } catch (err: any) {
      console.error('AI assistant error:', err);
      const errorMsg: Message = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: `Oops! Request failed: ${err.message || 'Unknown error'}. Please verify you are logged in and the backend is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    };
  };

  const handleDownloadDielineDXF = () => {
    try {
      const params = {
        L: store.L || 4.7244,
        W: store.W || 2.3622,
        H: store.H || 6.2992,
        T: store.T || 0.0197,
        glueFlapWidth: store.glueFlapWidth || 0.625,
        bleed: store.bleed || (2 / 25.4)
      };

      let dielineData;
      if (store.boxModel === 'te') dielineData = generateTEDielineDXF(params);
      else if (store.boxModel === 'auto_lock') dielineData = generateAutoLockDieline(params);
      else if (store.boxModel === 'cosmetic') dielineData = generateCosmeticBoxDieline(params);
      else dielineData = generateRTEDielineDXF(params);

      const dxfString = generateDXFString(dielineData);
      const blob = new Blob([dxfString], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Keyline_Dieline_${store.boxModel || 'box'}.dxf`;
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
    <div className={`ai-assistant-container ${isDark ? 'dark-theme' : ''}`}>
      {/* --- HEADER --- */}
      <div className="ai-header">
        <div className="ai-header-title">
          <Sparkles style={{ width: '16px', height: '16px', color: '#2563eb' }} />
          <span>AI packaging design</span>
        </div>
        
        {/* V1 / V2 Mode Toggle */}
        <div style={{ display: 'flex', background: '#f4f4f5', borderRadius: '8px', padding: '2px', marginRight: 'auto', marginLeft: '12px' }}>
          <button 
            onClick={() => setGenerationMode('v1')}
            style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: generationMode === 'v1' ? '#fff' : 'transparent', color: generationMode === 'v1' ? '#2563eb' : '#a1a1aa', boxShadow: generationMode === 'v1' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            V1: Abstract
          </button>
          <button 
            onClick={() => setGenerationMode('v2')}
            style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: generationMode === 'v2' ? '#fff' : 'transparent', color: generationMode === 'v2' ? '#2563eb' : '#a1a1aa', boxShadow: generationMode === 'v2' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            V2: Precision
          </button>
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

            <div className="ai-chips-grid">
              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Remove background from package scene")}>
                <Scissors style={{ width: '13px', height: '13px' }} />
                <span>Remove Background</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Generate elegant 3D studio background for packaging")}>
                <ImageIcon style={{ width: '13px', height: '13px' }} />
                <span>Generate Background</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Search 3D packaging models and dieline templates")}>
                <Box style={{ width: '13px', height: '13px' }} />
                <span>Search 3D Model</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Create a perfume box with dimensions 50x50x120 mm in matte navy blue")}>
                <LayoutGrid style={{ width: '13px', height: '13px' }} />
                <span>Create Package Design</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Generate 3D box unboxing video animation")}>
                <Video style={{ width: '13px', height: '13px' }} />
                <span>Generate Video</span>
              </button>

              <button className="ai-chip-btn" onClick={() => handleSendPrompt("Design modern luxury logo for my package front panel")}>
                <Palette style={{ width: '13px', height: '13px' }} />
                <span>Logo Design</span>
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
                        onClick={handleDownloadDielineDXF}
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

            {isLoading && (
              <div className="chat-bubble-row assistant">
                <div className="ai-avatar">✦</div>
                <div className="chat-bubble assistant">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a' }}>
                    <Sparkles className="animate-spin" style={{ width: '14px', height: '14px' }} />
                    <span>Processing custom prompt, generating 3D textures & dielines...</span>
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
            { id: 'cosmetic', label: 'Cosmetic Box' },
            { id: 'auto_lock', label: 'Auto-Lock' }
          ].map(tag => (
            <button
              key={tag.id || 'auto'}
              onClick={() => setSelectedBoxModelOverride(tag.id)}
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
            placeholder="Describe your product, brand, and style. e.g., a fun, vibrant juice for Pacdora."
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
              <button className="ai-subtool-btn" title="Attach image reference">
                <ImageIcon style={{ width: '15px', height: '15px' }} />
              </button>
              <button className="ai-subtool-btn" title="Browse prompt templates">
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
