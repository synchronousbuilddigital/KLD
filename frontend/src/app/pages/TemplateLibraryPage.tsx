// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, ChevronDown, Bookmark, Check } from 'lucide-react';
import '../../styles/new-home.css';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import Header from '../components/layout/Header';
import SignInModal from '../components/modals/SignInModal';
import BoxStudioModal from './BoxStudioModal';

const categories = [
  { id: 'folding', title: 'Folding Box Templates' },
  { id: 'tuck_end', title: 'Tuck End Box Templates' },
  { id: 'paper_bag', title: 'Paper Bag Templates' },
  { id: 'box_lid', title: 'Box with Lid Templates' },
  { id: 'display_box', title: 'Display Box Templates' },
  { id: 'tray_box', title: 'Tray Box Templates' },
  { id: 'rigid_box', title: 'Rigid Box Templates' },
  { id: 'envelope', title: 'Envelope Templates' }
];

export const TemplateDetailCard = ({ 
  title, 
  type, 
  href, 
  onClick 
}: { 
  title: string, 
  type: 'straight' | 'reverse' | 'auto_lock' | 'cosmetic', 
  href?: string, 
  onClick?: () => void 
}) => {
  return (
    <a 
      href={href || '#'} 
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }} 
      className="group/detail block bg-white rounded-2xl border border-zinc-200/90 shadow-sm hover:shadow-xl hover:border-zinc-900 transition-all duration-300 overflow-hidden cursor-pointer p-5" 
      style={{ textDecoration: 'none' }}
    >
      {/* Top Preview Canvas Box */}
      <div className="relative rounded-xl h-[190px] p-4 bg-gradient-to-b from-zinc-50 to-zinc-100/60 border border-zinc-100 flex items-center justify-between overflow-hidden mb-4 group-hover/detail:bg-indigo-50/30 transition-colors">
        
        {/* Badges Top Right */}
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <span className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-zinc-600 border border-zinc-200/80 shadow-xs">
            Printable
          </span>
          <span className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-zinc-600 border border-zinc-200/80 shadow-xs">
            Downloadable
          </span>
        </div>

        {/* Dieline 2D Vector Left */}
        <div className="w-1/2 h-full flex items-center justify-center relative pr-2">
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[135px] transition-transform duration-300 group-hover/detail:scale-105">
            {type === 'straight' && (
              <g strokeWidth="0.8" fill="none">
                <path d="M25,25 h50 M25,75 h50 M40,20 v60 M60,20 v60 M75,25 v50 M25,25 v50" stroke="#EF4444" strokeDasharray="1.5 1.5" />
                <path d="M40,25 v-10 c0,-1 1,-2 2,-2 h16 c1,0 2,1 2,2 v10 M40,75 v10 c0,1 1,2 2,2 h16 c1,0 2,-1 2,-2 v-10" stroke="#4F46E5" />
                <path d="M25,25 v-5 h15 M60,25 v-5 h15 M25,75 v5 h15 M60,75 v5 h15" stroke="#4F46E5" />
                <path d="M25,25 h-5 v50 h5 M75,25 h5 v50 h-5" stroke="#4F46E5" />
              </g>
            )}
            {type === 'reverse' && (
              <g strokeWidth="0.8" fill="none">
                <path d="M25,25 h50 M25,75 h50 M40,20 v60 M60,20 v60 M75,25 v50 M25,25 v50" stroke="#EF4444" strokeDasharray="1.5 1.5" />
                <path d="M40,25 v-10 c0,-1 1,-2 2,-2 h16 c1,0 2,1 2,2 v10 M25,75 v10 c0,1 1,2 2,2 h11 c1,0 2,-1 2,-2 v-10" stroke="#4F46E5" />
                <path d="M25,25 v-5 h15 M60,25 v-5 h15 M40,75 v5 h20 M60,75 v5 h15" stroke="#4F46E5" />
                <path d="M25,25 h-5 v50 h5 M75,25 h5 v50 h-5" stroke="#4F46E5" />
              </g>
            )}
            {type === 'auto_lock' && (
              <g strokeWidth="0.8" fill="none">
                <path d="M25,25 h50 M25,65 h50 M40,20 v60 M60,20 v60 M75,25 v50 M25,25 v50" stroke="#EF4444" strokeDasharray="1.5 1.5" />
                <path d="M40,25 v-10 c0,-1 1,-2 2,-2 h16 c1,0 2,1 2,2 v10" stroke="#4F46E5" />
                <path d="M25,25 v-5 h15 M60,25 v-5 h15 M75,25 h5 v40 h-5 M25,25 h-5 v40 h5" stroke="#4F46E5" />
                <path d="M25,65 l7,15 h8 v-15 M40,65 v15 h20 v-15 M60,65 l7,15 h8 v-15" stroke="#4F46E5" />
              </g>
            )}
            {type === 'cosmetic' && (
              <g strokeWidth="0.8" fill="none">
                <path d="M20,35 h60 M20,75 h60 M35,20 v55 M55,20 v55 M75,35 v40 M20,35 v40" stroke="#EF4444" strokeDasharray="1.5 1.5" />
                <path d="M35,35 L45,15 h10 L65,35" stroke="#4F46E5" />
                <path d="M45,20 h10" stroke="#4F46E5" />
                <rect x="40" y="45" width="20" height="15" rx="3" stroke="#059669" strokeDasharray="2 2" />
                <path d="M20,35 h-5 v40 h5 M75,35 h5 v40 h-5" stroke="#4F46E5" />
              </g>
            )}
          </svg>
        </div>

        {/* 3D Box Right */}
        <div className="w-1/2 h-full flex items-center justify-center pl-2 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[135px] drop-shadow-md transition-transform duration-300 group-hover/detail:-translate-y-1.5 group-hover/detail:scale-105">
            <ellipse cx="60" cy="88" rx="20" ry="4" fill="rgba(0,0,0,0.1)" />
            {type === 'cosmetic' ? (
              <>
                <path d="M35,35 L65,30 L65,18 L35,22 Z" fill="#D97706" />
                <path d="M35,22 L50,10 L65,18 Z" fill="#F59E0B" />
                <path d="M25,37 L60,31 L60,83 L25,87 Z" fill="#FFFFFF" />
                <rect x="35" y="48" width="16" height="20" rx="3" fill="#38BDF8" opacity="0.5" stroke="#0284C7" strokeWidth="0.8" />
                <path d="M60,31 L75,27 L75,79 L60,83 Z" fill="#E2E8F0" />
              </>
            ) : (
              <>
                <path d="M35,35 L65,30 L65,18 L35,22 Z" fill="#B78F66" />
                <path d="M35,35 L65,30 L65,33 L35,38 Z" fill="#A07952" />
                <path d="M25,37 L35,35 L35,25 L28,26 Z" fill="#A07952" />
                <path d="M25,37 L60,31 L60,83 L25,87 Z" fill="#FFFFFF" />
                <path d="M60,31 L75,27 L75,79 L60,83 Z" fill="#E2E8F0" />
                <path d="M35,22 L65,18 L65,15 L35,20 Z" fill="#F8FAFC" />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Title & Action Widget Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="min-w-0 flex-1 pr-2">
          <h4 className="text-base font-bold text-zinc-900 group-hover/detail:text-indigo-600 transition-colors leading-snug truncate">
            {title} card game box dieline
          </h4>
          <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
            Vector CAD Blueprint • 3D Studio
          </p>
        </div>

        {/* Hover Arrow Action Badge */}
        <div className="w-8 h-8 rounded-xl bg-zinc-100 group-hover/detail:bg-zinc-900 group-hover/detail:text-white text-zinc-600 flex items-center justify-center transition-all shrink-0 ml-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </a>
  );
};

export default function TemplateLibraryPage({ onBack, hideHeader }: { onBack: () => void; hideHeader?: boolean }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('tuck_end');
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [selectedBoxModel, setSelectedBoxModel] = useState<"rte" | "te" | "auto_lock" | "cosmetic" | null>(null);

  React.useEffect(() => {
    document.body.style.zoom = '1';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';

    return () => {
      document.body.style.zoom = '';
      document.body.style.width = '';
    };
  }, []);

  React.useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  return (
    <div className={`new-home-landing font-sans flex flex-col relative z-0 ${hideHeader ? 'w-full flex-1' : 'min-h-screen'}`}>
      <BackgroundCanvas position="absolute" zIndex={-1} />
      
      {/* Header */}
      {!hideHeader && <Header activeNav="dielines" onNavigate={onBack} />}

      <div className="flex flex-1 relative z-10 min-h-[600px]">

        {/* Sidebar Index */}
        <aside className="w-[320px] shrink-0 border-r overflow-y-auto py-4 px-6" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-primary)' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 px-4" style={{ color: 'var(--ink)', opacity: 0.5 }}>Categories</h2>
          <nav className="flex flex-col gap-1">
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-col">
                <button
                  onClick={() => {
                    if (cat.id === 'tuck_end' || cat.id === 'folding') {
                      setExpandedCategory(expandedCategory === cat.id ? null : cat.id);
                      setSelectedBoxModel('rte');
                    } else if (cat.id === 'paper_bag' || cat.id === 'envelope') {
                      setSelectedBoxModel('cosmetic');
                    } else if (cat.id === 'box_lid' || cat.id === 'rigid_box') {
                      setSelectedBoxModel('auto_lock');
                    } else {
                      setSelectedBoxModel('te');
                    }
                  }}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 text-left hover:bg-zinc-100 cursor-pointer"
                >
                  <span className={`text-[15px] ${expandedCategory === cat.id ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-600'}`}>
                    {cat.title}
                  </span>

                  <div className={`transition-transform duration-200 ${expandedCategory === cat.id ? 'rotate-90' : ''}`} style={{ color: expandedCategory === cat.id ? 'var(--ink)' : 'inherit', opacity: expandedCategory === cat.id ? 1 : 0.5 }}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {cat.id === 'tuck_end' && expandedCategory === 'tuck_end' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 px-4 py-2 ml-4 border-l-2 border-zinc-200">
                        <button onClick={() => setSelectedBoxModel('te')} className="text-left py-1.5 px-3 rounded-lg text-xs font-medium text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50">Straight Tuck End Box</button>
                        <button onClick={() => setSelectedBoxModel('rte')} className="text-left py-1.5 px-3 rounded-lg text-xs font-medium text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50">Reverse Tuck End Box</button>
                        <button onClick={() => setSelectedBoxModel('auto_lock')} className="text-left py-1.5 px-3 rounded-lg text-xs font-medium text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50">Auto Lock Bottom Box</button>
                        <button onClick={() => setSelectedBoxModel('cosmetic')} className="text-left py-1.5 px-3 rounded-lg text-xs font-medium text-indigo-600 font-semibold hover:bg-indigo-50">Cosmetic Box</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-transparent">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-[32px] md:text-[36px] font-bold tracking-tight" style={{ color: 'var(--ink)' }}>Dieline & Box Templates</h1>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold border border-indigo-200">
                4 Box Designs Available
              </span>
            </div>
            <p className="text-sm md:text-base mb-6 max-w-2xl" style={{ color: 'var(--ink)', opacity: 0.7 }}>
              Browse our complete collection of 4 production-ready dieline templates for standard tuck end, auto-lock, and custom handle boxes with live 3D studio previewers.
            </p>

            {/* GRID OF 4 ACTIVE BOX CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <TemplateDetailCard title="Straight Tuck End Box" type="straight" onClick={() => setSelectedBoxModel('te')} />
              <TemplateDetailCard title="Reverse Tuck End Box" type="reverse" onClick={() => setSelectedBoxModel('rte')} />
              <TemplateDetailCard title="Auto Lock Bottom Box" type="auto_lock" onClick={() => setSelectedBoxModel('auto_lock')} />
              <TemplateDetailCard title="Cosmetic Box" type="cosmetic" onClick={() => setSelectedBoxModel('cosmetic')} />
            </div>
          </div>

        </main>
      </div>

      {/* Studio Modal */}
      {selectedBoxModel && (
        <BoxStudioModal
          isOpen={!!selectedBoxModel}
          onClose={() => setSelectedBoxModel(null)}
          initialModel={selectedBoxModel}
        />
      )}

      {isSignInModalOpen && (
        <SignInModal onClose={() => setIsSignInModalOpen(false)} />
      )}
    </div>
  );
}
