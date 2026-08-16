import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Bookmark, Check } from 'lucide-react';
import '../../styles/new-home.css';
import { mockupCategories, MockupVariant } from '../data/mockupData';
import { useBoxStore } from '../../lib/useBoxStore';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import Header from '../components/layout/Header';
import SignInModal from '../components/modals/SignInModal';
import HoverBoxAnimation from '../animations/HoverBoxAnimation';
import MagneticRigidBoxAnimation from '../animations/MagneticRigidBoxAnimation';
import DrawerSleeveBoxAnimation from '../animations/DrawerSleeveBoxAnimation';
import DoubleDoorBoxAnimation from '../animations/DoubleDoorBoxAnimation';
import TelescopeBoxAnimation from '../animations/TelescopeBoxAnimation';
import HoverPouchAnimation from '../animations/HoverPouchAnimation';
import HoverBottleAnimation from '../animations/HoverBottleAnimation';
import HoverCanAnimation from '../animations/HoverCanAnimation';
import HoverTubeAnimation from '../animations/HoverTubeAnimation';

interface MockupDetailsProps {
  initialCategoryId: string;
  onBack: () => void;
}

import Box3DViewer from '../../components/box3d';

const AnimatedBox3DViewer = ({ boxType, isHovered, color, decals }: any) => {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    let animationFrameId: number;
    const targetProgress = isHovered ? 0.3 : 1.0;

    const animate = () => {
      setProgress(prev => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.01) return targetProgress;
        return prev + diff * 0.1; // Ease towards target
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  return (
    <Box3DViewer
      boxModelOverride={boxType}
      activeAnimation="none"
      disableZoom={true}
      colorOverride={color}
      progress={progress}
      zoom={0.8}
      overrideLayout="single"
      decals={decals}
    />
  );
};

const rteDecals = [
  // Huge blue background covering the whole front
  { id: 'r_bg', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rectangle', fillColor: '#2B35AF', strokeColor: 'transparent', strokeWidth: 0, x: 0, y: 0, width: 100, height: 150, rotation: 0 },
  // Rotated black background at top
  { id: 'r0', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rectangle', fillColor: '#11131A', strokeColor: 'transparent', strokeWidth: 0, x: 0, y: 40, width: 110, height: 100, rotation: -0.15 },
  // Text
  { id: 'r1', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'SOFTWARE', fontSize: 7.5, color: '#ffffff', x: 0, y: 35, width: 100, height: 100, rotation: 0, bold: true },
  { id: 'r2', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'EDITION', fontSize: 7.5, color: '#ffffff', x: 0, y: 20, width: 100, height: 100, rotation: 0, bold: true },
  { id: 'r3', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'Professional License', fontSize: 2.5, color: '#6366f1', x: 0, y: 5, width: 100, height: 100, rotation: 0, bold: false },
  // Cyan circle (centered at x:0)
  { id: 'r4', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'circle', fillColor: 'transparent', strokeColor: '#06b6d4', strokeWidth: 50, x: 0, y: -25, width: 20, height: 20, rotation: 0 },
  { id: 'r5', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'circle', fillColor: '#06b6d4', strokeColor: 'transparent', strokeWidth: 0, x: 0, y: -25, width: 6, height: 6, rotation: 0 }
];

const teDecals = [
  // Gold arch (shifted far down so the bottom rounded corners are entirely clipped by the panel geometry)
  { id: 't1', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rounded-rectangle', borderRadius: 2160, fillColor: 'transparent', strokeColor: '#d4af37', strokeWidth: 100, x: 0, y: -30, width: 60, height: 160, rotation: 0 },
  // Text inside arch
  { id: 't2', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'TUCK END\nBOX', fontSize: 5, color: '#333333', x: 0, y: 15, width: 100, height: 100, rotation: 0, bold: true, textAlign: 'center' },
  // Small gold dash
  { id: 't4', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rectangle', fillColor: '#d4af37', strokeColor: 'transparent', strokeWidth: 0, x: 0, y: 32, width: 6, height: 1.5, rotation: 0 }
];

const autoDecals = [
  // A minimalist frame
  { id: 'a1', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rectangle', fillColor: 'transparent', strokeColor: '#1f2937', strokeWidth: 40, x: 0, y: 0, width: 80, height: 140, rotation: 0 },
  // Text inside
  { id: 'a2', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'AUTO LOCK\nBOTTOM BOX', fontSize: 5.5, color: '#1f2937', x: 0, y: 5, width: 100, height: 100, rotation: 0, bold: true, textAlign: 'center' },
  // Accent dot
  { id: 'a3', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'circle', fillColor: '#1f2937', strokeColor: 'transparent', strokeWidth: 0, x: 0, y: 35, width: 3, height: 3, rotation: 0 }
];

const MockupCard = ({ variant, activeCategoryId, setHoveredVariant, hoveredVariant }: any) => {
  const isHovered = hoveredVariant?.id === variant.id;
  const setBoxModel = useBoxStore((state: any) => state.setBoxModel);

  const isTE = variant.name === 'Tuck End Box';
  const isRTE = variant.name === 'Reverse Tuck End Box';
  const isAuto = variant.name === 'Auto Lock Bottom Box';
  const is3DBox = isTE || isRTE || isAuto;
  const boxType = isTE ? 'te' : isRTE ? 'rte' : 'auto_lock';

  const defaultColor = isRTE ? '#ffffff' : isTE ? '#e2e8f0' : '#e5e7eb';
  const [color, setColor] = useState(defaultColor);

  const handleClick = () => {
    if (isRTE) {
      setBoxModel('rte');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'workshop' }));
    } else if (isTE) {
      setBoxModel('te');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'workshop' }));
    } else if (isAuto) {
      setBoxModel('auto_lock');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'workshop' }));
    }
  };

  return (
    <div
      className="flex flex-col gap-3 group/detail cursor-pointer"
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHoveredVariant(variant)}
      onMouseLeave={() => setHoveredVariant(null)}
      onClick={handleClick}
    >
      <div
        className="relative rounded-[16px] h-[260px] p-6 flex flex-col items-center justify-center transition-all duration-300 group-hover/detail:-translate-y-1 overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--shadow-rest)'
        }}
      >
        {is3DBox ? (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <AnimatedBox3DViewer
              boxType={boxType}
              isHovered={isHovered}
              color={color}
              decals={isRTE ? rteDecals : isTE ? teDecals : isAuto ? autoDecals : []}
            />
          </div>
        ) : isHovered ? (
          <div className="w-full h-full flex items-center justify-center transform scale-110">
            {activeCategoryId === 'box-mockups' && (
              <>
                {variant.name === 'Magnetic Rigid Box' && <MagneticRigidBoxAnimation isHovered={true} />}
                {variant.name === 'Drawer Sleeve Box' && <DrawerSleeveBoxAnimation isHovered={true} />}
                {variant.name === 'Double Door Box' && <DoubleDoorBoxAnimation isHovered={true} />}
                {variant.name === 'Telescope Box' && <TelescopeBoxAnimation isHovered={true} />}
                {!['Magnetic Rigid Box', 'Drawer Sleeve Box', 'Double Door Box', 'Telescope Box'].includes(variant.name) && <HoverBoxAnimation isHovered={true} />}
              </>
            )}
            {activeCategoryId === 'pouch-bag-mockups' && <HoverPouchAnimation isHovered={true} />}
            {activeCategoryId === 'bottle-mockups' && <HoverBottleAnimation isHovered={true} />}
            {activeCategoryId === 'can-mockups' && <HoverCanAnimation isHovered={true} />}
            {activeCategoryId === 'tube-mockups' && <HoverTubeAnimation isHovered={true} />}
          </div>
        ) : (
          variant.imageUrl ? (
            <motion.img
              src={variant.imageUrl}
              alt={variant.name}
              className="w-full h-full object-contain drop-shadow-md mix-blend-multiply"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ) : (
            <div className="w-16 h-16 bg-black/5 rounded-xl"></div>
          )
        )}
      </div>
      <div className="flex flex-col">
        <h4 className="text-[17px] font-medium pl-2 group-hover/detail:text-[var(--accent)] transition-colors" style={{ color: 'var(--ink)' }}>{variant.name}</h4>
        <p className="text-[13px] pl-2 opacity-60 mt-1" style={{ color: 'var(--ink)' }}>{is3DBox ? (isRTE ? 'Flaps fold in opposite directions' : isTE ? 'Flaps fold in same direction' : 'Bottom flaps lock automatically') : variant.animation || 'Standard reveal'}</p>

        {/* Color Swatches for 3D boxes */}
        {is3DBox && (
          <div className="flex gap-2 mt-3 pl-2" onClick={(e) => e.preventDefault()}>
            <button
              className={`w-6 h-6 rounded-full border-2 ${color === defaultColor ? 'border-blue-500' : 'border-zinc-200'} shadow-sm`}
              style={{ backgroundColor: defaultColor }}
              onClick={(e) => { e.stopPropagation(); setColor(defaultColor); }}
            />
            <button
              className={`w-6 h-6 rounded-full border-2 ${color === '#c19a6b' ? 'border-blue-500' : 'border-zinc-200'} shadow-sm`}
              style={{ backgroundColor: '#c19a6b' }}
              onClick={(e) => { e.stopPropagation(); setColor('#c19a6b'); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};


export default function MockupDetails({ initialCategoryId, onBack }: MockupDetailsProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(initialCategoryId);
  const [hoveredVariant, setHoveredVariant] = useState<MockupVariant | null>(null);

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const activeCategory = mockupCategories.find(c => c.id === activeCategoryId) || mockupCategories[0];

  return (
    <div className="new-home-landing min-h-screen font-sans flex flex-col relative z-0">
      <BackgroundCanvas position="fixed" zIndex={-1} />
      <Header activeNav="models" onNavigate={onBack} />

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar Index */}
        <aside className="w-[320px] shrink-0 border-r overflow-y-auto py-8 px-6" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-primary)' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-6 px-4" style={{ color: 'var(--ink)', opacity: 0.5 }}>Categories</h2>
          <nav className="flex flex-col gap-1">
            {mockupCategories.map((cat) => {
              const isActive = cat.id === activeCategoryId;
              const isExpanded = cat.id === expandedCategoryId;
              return (
                <div key={cat.id} className="flex flex-col">
                  <button
                    onClick={() => {
                      if (activeCategoryId !== cat.id) {
                        setActiveCategoryId(cat.id);
                        setExpandedCategoryId(cat.id);
                      } else {
                        setExpandedCategoryId(isExpanded ? null : cat.id);
                      }
                    }}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 text-left ${isActive ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
                  >
                    <span className={`text-[15px] ${isActive ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-600'}`}>
                      {cat.name.replace(' Mockups', '')}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-medium">{cat.variants.length}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} style={{ color: isActive ? 'var(--ink)' : 'inherit', opacity: isActive ? 1 : 0.5 }} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-1 px-4 py-2 ml-4 border-l-2 border-zinc-200">
                          {cat.variants.map((v) => (
                            <button key={v.id} className="text-left py-2 px-3 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 truncate">
                              {v.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-12 bg-transparent">
          <div className="max-w-[1200px] mx-auto">
            <h1 className="text-[40px] font-bold mb-4 tracking-tight" style={{ color: 'var(--ink)' }}>{activeCategory.name}</h1>
            <p className="text-lg mb-12 max-w-2xl" style={{ color: 'var(--ink)', opacity: 0.7 }}>
              Discover our wide range of packaging variants, designed to elevate your brand and experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeCategory.variants.map((variant) => (
                <MockupCard
                  key={variant.id}
                  variant={variant}
                  activeCategoryId={activeCategoryId}
                  setHoveredVariant={setHoveredVariant}
                  hoveredVariant={hoveredVariant}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {isSignInModalOpen && (
        <SignInModal onClose={() => setIsSignInModalOpen(false)} />
      )}
    </div>
  );
}
