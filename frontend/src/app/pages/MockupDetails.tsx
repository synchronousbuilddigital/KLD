import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Bookmark, Check, Star, Box, Rotate3d } from 'lucide-react';
import '../../styles/new-home.css';
import { mockupCategories, MockupCategory, MockupVariant } from '../data/mockupData';
import { catalogService } from '../../services/catalog';
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
      zoom={0.78}
      overrideLayout="single"
      decals={decals}
      lightingPreset="studio"
      L={50} W={30} H={80}
      overrideL={50} overrideW={30} overrideH={80}
    />
  );
};

const rteDecals = [
  { id: 'logo', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'KLD', fontSize: 3.5, color: '#111827', x: 3, y: 30, width: 38, height: 8, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'left' },
  { id: 'badge', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'circle', fillColor: '#f3f4f6', strokeColor: '#d1d5db', strokeWidth: 1, x: 15, y: 28, width: 12, height: 12, rotation: 0 },
  { id: 'badge_txt', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'KLD\nPRO', fontSize: 2, color: '#374151', x: 15, y: 28, width: 12, height: 12, rotation: 0, bold: true, textAlign: 'center', fontFamily: 'sans-serif' },
  { id: 'pill', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rounded-rectangle', borderRadius: 100, fillColor: '#06b6d4', strokeColor: 'transparent', strokeWidth: 0, x: -7, y: 10, width: 18, height: 4.5, rotation: 0 },
  { id: 'pill_txt', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'HIGH QUALITY', fontSize: 1.5, color: '#ffffff', x: -7, y: 10, width: 18, height: 4.5, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'center' },
  { id: 'title', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'REVERSE TUCK\nEND BOXES\nMOCKUP', fontSize: 4, color: '#111827', x: 3, y: -5, width: 38, height: 20, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'left' },
  { id: 'desc', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'Customize design your 3D\nmockup online. Render the\n3D scene to view the effect.', fontSize: 1.4, color: '#6b7280', x: 3, y: -25, width: 38, height: 12, rotation: 0, bold: false, fontFamily: 'sans-serif', textAlign: 'left' }
];

const teDecals = [
  { id: 'logo', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'KLD', fontSize: 3.5, color: '#111827', x: 3, y: 30, width: 38, height: 8, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'left' },
  { id: 'badge', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'circle', fillColor: '#f3f4f6', strokeColor: '#d1d5db', strokeWidth: 1, x: 15, y: 28, width: 12, height: 12, rotation: 0 },
  { id: 'badge_txt', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'KLD\nPRO', fontSize: 2, color: '#374151', x: 15, y: 28, width: 12, height: 12, rotation: 0, bold: true, textAlign: 'center', fontFamily: 'sans-serif' },
  { id: 'pill', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rounded-rectangle', borderRadius: 100, fillColor: '#06b6d4', strokeColor: 'transparent', strokeWidth: 0, x: -7, y: 10, width: 18, height: 4.5, rotation: 0 },
  { id: 'pill_txt', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'HIGH QUALITY', fontSize: 1.5, color: '#ffffff', x: -7, y: 10, width: 18, height: 4.5, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'center' },
  { id: 'title', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'TUCK END\nBOXES\nMOCKUP', fontSize: 4, color: '#111827', x: 3, y: -5, width: 38, height: 20, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'left' },
  { id: 'desc', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'Customize design your 3D\nmockup online. Render the\n3D scene to view the effect.', fontSize: 1.4, color: '#6b7280', x: 3, y: -25, width: 38, height: 12, rotation: 0, bold: false, fontFamily: 'sans-serif', textAlign: 'left' }
];

const autoDecals = [
  { id: 'logo', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'KLD', fontSize: 3.5, color: '#111827', x: 3, y: 30, width: 38, height: 8, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'left' },
  { id: 'badge', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'circle', fillColor: '#f3f4f6', strokeColor: '#d1d5db', strokeWidth: 1, x: 15, y: 28, width: 12, height: 12, rotation: 0 },
  { id: 'badge_txt', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'KLD\nPRO', fontSize: 2, color: '#374151', x: 15, y: 28, width: 12, height: 12, rotation: 0, bold: true, textAlign: 'center', fontFamily: 'sans-serif' },
  { id: 'pill', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rounded-rectangle', borderRadius: 100, fillColor: '#06b6d4', strokeColor: 'transparent', strokeWidth: 0, x: -7, y: 10, width: 18, height: 4.5, rotation: 0 },
  { id: 'pill_txt', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'HIGH QUALITY', fontSize: 1.5, color: '#ffffff', x: -7, y: 10, width: 18, height: 4.5, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'center' },
  { id: 'title', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'AUTO LOCK\nBOTTOM BOXES\nMOCKUP', fontSize: 4, color: '#111827', x: 3, y: -5, width: 38, height: 20, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'left' },
  { id: 'desc', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'Customize design your 3D\nmockup online. Render the\n3D scene to view the effect.', fontSize: 1.4, color: '#6b7280', x: 3, y: -25, width: 38, height: 12, rotation: 0, bold: false, fontFamily: 'sans-serif', textAlign: 'left' }
];

const cosmeticDecals = [
  { id: 'logo', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'KLD', fontSize: 3.5, color: '#111827', x: 3, y: 30, width: 38, height: 8, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'left' },
  { id: 'badge', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'circle', fillColor: '#f3f4f6', strokeColor: '#d1d5db', strokeWidth: 1, x: 15, y: 28, width: 12, height: 12, rotation: 0 },
  { id: 'badge_txt', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'KLD\nPRO', fontSize: 2, color: '#374151', x: 15, y: 28, width: 12, height: 12, rotation: 0, bold: true, textAlign: 'center', fontFamily: 'sans-serif' },
  { id: 'pill', custom: true, panel: 'p1', type: 'shape', surface: 'Outside', shapeType: 'rounded-rectangle', borderRadius: 100, fillColor: '#06b6d4', strokeColor: 'transparent', strokeWidth: 0, x: -7, y: 10, width: 18, height: 4.5, rotation: 0 },
  { id: 'pill_txt', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'HIGH QUALITY', fontSize: 1.5, color: '#ffffff', x: -7, y: 10, width: 18, height: 4.5, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'center' },
  { id: 'title', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'COSMETIC\nBOXES\nMOCKUP', fontSize: 4, color: '#111827', x: 3, y: -5, width: 38, height: 20, rotation: 0, bold: true, fontFamily: 'sans-serif', textAlign: 'left' },
  { id: 'desc', custom: true, panel: 'p1', type: 'text', surface: 'Outside', content: 'Customize design your 3D\nmockup online. Render the\n3D scene to view the effect.', fontSize: 1.4, color: '#6b7280', x: 3, y: -25, width: 38, height: 12, rotation: 0, bold: false, fontFamily: 'sans-serif', textAlign: 'left' }
];

const MockupCard = ({ variant, activeCategoryId, setHoveredVariant, hoveredVariant }: any) => {
  const isHovered = hoveredVariant?.id === variant.id;
  const setBoxModel = useBoxStore((state: any) => state.setBoxModel);

  const isTE = variant.name === 'Tuck End Box';
  const isRTE = variant.name === 'Reverse Tuck End Box';
  const isAuto = variant.name === 'Auto Lock Bottom Box';
  const isCosmetic = variant.name === 'Cosmetic Box';
  const is3DBox = isTE || isRTE || isAuto || isCosmetic;
  const boxType = isTE ? 'te' : isRTE ? 'rte' : isAuto ? 'auto_lock' : isCosmetic ? 'cosmetic' : 'te';

  const defaultColor = isRTE ? '#ffffff' : isTE ? '#e2e8f0' : isAuto ? '#e5e7eb' : '#fdf2f8'; // very light pink for cosmetic
  const [color, setColor] = useState(defaultColor);

  const handleClick = () => {
    // Reset to clean pristine default dimensions & EMPTY decals for fresh blank studio session
    const cleanDefaultState = {
      L: 4.7244,
      W: 2.3622,
      H: 6.2992,
      T: 0.0197,
      glueFlapWidth: 0.625,
      bleed: 2 / 25.4,
      sizeMode: "manufacture",
      materialType: "paperboard",
      materialName: "350g white paperboard(0.5mm)",
      isCustomMaterial: false,
      materialColor: "#fdfbf7",
      materialCategory: "white_paperboard",
      packageColor: null,
      insideColor: null,
      decalsByModel: { rte: [], te: [], auto_lock: [], cosmetic: [] }
    };

    const targetModel = isRTE ? 'rte' : isTE ? 'te' : isAuto ? 'auto_lock' : isCosmetic ? 'cosmetic' : 'rte';

    useBoxStore.setState({ 
      boxModel: targetModel, 
      activeProjectId: null,
      activeProjectName: null,
      ...cleanDefaultState 
    });

    window.dispatchEvent(new CustomEvent('navigate', { detail: 'workshop' }));
  };

  return (
    <div
      className="flex flex-col group/detail cursor-pointer transition-all duration-300"
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHoveredVariant(variant)}
      onMouseLeave={() => setHoveredVariant(null)}
      onClick={handleClick}
    >
      <div
        className={`relative rounded-[16px] p-4 pb-6 flex flex-col items-center justify-center transition-all duration-300 group-hover/detail:-translate-y-2 ${isHovered ? 'border-2 border-black bg-white shadow-[6px_6px_0px_#000]' : ''}`}
        style={!isHovered ? {
          background: 'var(--card-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--shadow-rest)'
        } : {}}
      >
        {/* Hover UI Overlay */}
        <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 p-4 flex flex-col justify-between ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Top Icons */}
          <div className="flex justify-between items-start w-full">
            <div className="flex gap-2 text-zinc-500">
              <Rotate3d className="w-6 h-6 stroke-[1.5]" />
              <Star className="w-6 h-6 stroke-[1.5]" />
            </div>
            {/* Top Right Thumbnail */}
            <div className="w-12 h-12 bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden flex items-center justify-center p-1">
               {variant.imageUrl ? (
                 <img src={variant.imageUrl} alt="thumbnail" className="w-full h-full object-contain" />
               ) : (
                 <Box className="w-6 h-6 text-zinc-300" />
               )}
            </div>
          </div>
          
          {/* Bottom Buttons (Moved slightly up to avoid text) */}
          <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-3 w-full">
            <button className="pointer-events-auto px-6 py-2.5 bg-white text-zinc-900 font-medium rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow text-[15px]">
              Custom
            </button>
            <button className="pointer-events-auto px-6 py-2.5 bg-white text-zinc-900 font-medium rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow text-[15px]">
              3D design
            </button>
          </div>
        </div>

        {/* 3D Box / Image Container */}
        <div className="w-full h-[260px] relative flex items-center justify-center overflow-hidden rounded-lg mb-4">
          {is3DBox ? (
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <AnimatedBox3DViewer
                boxType={boxType}
                isHovered={isHovered}
                color={color}
                decals={isRTE ? rteDecals : isTE ? teDecals : isAuto ? autoDecals : isCosmetic ? cosmeticDecals : []}
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

        {/* Text and Swatches */}
        <div className="flex flex-col items-center text-center relative z-10">
          <h4 className={`text-[17px] font-bold transition-colors text-center ${isHovered ? 'text-black' : ''}`} style={!isHovered ? { color: 'var(--ink)' } : {}}>{variant.name}</h4>
          <p className={`text-[13px] mt-1 text-center ${isHovered ? 'text-zinc-600 opacity-100' : 'opacity-60'}`} style={!isHovered ? { color: 'var(--ink)' } : {}}>{variant.animation || 'Standard reveal'}</p>

          {/* Color Swatches for 3D boxes */}
          {is3DBox && (
            <div className="flex gap-2 mt-4 justify-center" onClick={(e) => e.preventDefault()}>
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
    </div>
  );
};


export default function MockupDetails({ initialCategoryId, onBack }: MockupDetailsProps) {
  const [categories, setCategories] = useState<MockupCategory[]>(mockupCategories);
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(initialCategoryId);
  const [hoveredVariant, setHoveredVariant] = useState<MockupVariant | null>(null);

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');

  useEffect(() => {
    window.scrollTo(0, 0);

    let isMounted = true;
    const fetchCatalogCategories = () => {
      catalogService.getPublicCatalog().then((items) => {
        if (isMounted && items && items.length > 0) {
          const mapped: MockupCategory[] = items.map((item) => ({
            id: item.itemId || item._id || '',
            name: item.title,
            variants: item.variants && item.variants.length > 0
              ? item.variants
              : [
                  { id: 1, name: item.title, animation: item.subtitle, imageUrl: item.img }
                ],
          }));
          setCategories(mapped);
        }
      });
    };

    fetchCatalogCategories();
    window.addEventListener('catalog-updated', fetchCatalogCategories);
    return () => {
      isMounted = false;
      window.removeEventListener('catalog-updated', fetchCatalogCategories);
    };
  }, []);

  useEffect(() => {
    if (initialCategoryId) {
      setActiveCategoryId(initialCategoryId);
      setExpandedCategoryId(initialCategoryId);
    }
  }, [initialCategoryId]);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const activeCategory = categories.find(c => c.id === activeCategoryId) || categories.find(c => c.id === initialCategoryId) || mockupCategories.find(c => c.id === activeCategoryId) || mockupCategories[0];

  return (
    <div className="new-home-landing min-h-screen font-sans flex flex-col relative z-0">
      <BackgroundCanvas position="fixed" zIndex={-1} />
      <Header activeNav="models" onNavigate={onBack} />

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar Index */}
        <aside className="w-[300px] shrink-0 border-r overflow-y-auto py-8 px-6" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-primary)' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-6 px-4" style={{ color: 'var(--ink)', opacity: 0.5 }}>Categories</h2>
          <nav className="flex flex-col gap-1">
            {categories.map((cat) => {
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

        {/* Main Content Pane - Centered Layout */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-12 bg-transparent flex flex-col items-center">
          <div className="w-full max-w-[1200px] flex flex-col items-center">
            <h1 className="text-[40px] font-bold mb-3 tracking-tight text-center" style={{ color: 'var(--ink)' }}>{activeCategory.name}</h1>
            <p className="text-lg mb-10 max-w-2xl text-center" style={{ color: 'var(--ink)', opacity: 0.7 }}>
              Discover our wide range of packaging variants, designed to elevate your brand and experience.
            </p>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              {activeCategory.variants.map((variant) => (
                <div key={variant.id} className="w-full max-w-[360px]">
                  <MockupCard
                    variant={variant}
                    activeCategoryId={activeCategoryId}
                    setHoveredVariant={setHoveredVariant}
                    hoveredVariant={hoveredVariant}
                  />
                </div>
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
