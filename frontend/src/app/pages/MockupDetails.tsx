import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Bookmark, Check, Star, Box, Rotate3d } from 'lucide-react';
import '../../styles/new-home.css';
import { mockupCategories, MockupCategory, MockupVariant } from '../data/mockupData';
import { catalogService } from '../../services/catalog';
import { useBoxStore } from '../../lib/useBoxStore';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import Header from '../components/layout/Header';
import HoverBoxAnimation from '../animations/HoverBoxAnimation';
import MagneticRigidBoxAnimation from '../animations/MagneticRigidBoxAnimation';
import DrawerSleeveBoxAnimation from '../animations/DrawerSleeveBoxAnimation';
import DoubleDoorBoxAnimation from '../animations/DoubleDoorBoxAnimation';
import TelescopeBoxAnimation from '../animations/TelescopeBoxAnimation';
import HoverPouchAnimation from '../animations/HoverPouchAnimation';
import HoverBottleAnimation from '../animations/HoverBottleAnimation';
import HoverCanAnimation from '../animations/HoverCanAnimation';
import HoverTubeAnimation from '../animations/HoverTubeAnimation';
import PlasticWaterBottle3D from '../components/3d/PlasticWaterBottle3D';

interface MockupDetailsProps {
  initialCategoryId: string;
  onBack: () => void;
}

const BOX_MOCKUP_IMAGES: Record<string, { white: string; kraft: string }> = {
  rte: {
    white: '/images/boxes/rte_white.jpg',
    kraft: '/images/boxes/rte_kraft.jpg',
  },
  te: {
    white: '/images/boxes/ste_white.jpg',
    kraft: '/images/boxes/ste_kraft.jpg',
  },
  auto_lock: {
    white: '/images/boxes/auto_white.jpg',
    kraft: '/images/boxes/auto_kraft.jpg',
  },
  cosmetic: {
    white: '/images/boxes/cosmetic_white.jpg',
    kraft: '/images/boxes/cosmetic_kraft.jpg',
  },
  cosmetic_b: {
    white: '/images/boxes/cosmetic_b_white.jpg',
    kraft: '/images/boxes/cosmetic_b_kraft.jpg',
  },
  button_hole: {
    white: '/images/boxes/button_hole_white.jpg',
    kraft: '/images/boxes/button_hole_kraft.jpg',
  },
};

const MockupCard = ({ variant, activeCategoryId, setHoveredVariant, hoveredVariant }: any) => {
  const isHovered = hoveredVariant?.id === variant.id;
  const setBoxModel = useBoxStore((state: any) => state.setBoxModel);

  const isWaterBottle = variant.boxModelKey === 'water_bottle' || variant.name.toLowerCase().includes('water bottle');
  const isBottle = isWaterBottle || variant.boxModelKey === 'bottle' || variant.name.toLowerCase().includes('bottle') || activeCategoryId?.includes('bottle');
  const isCan = variant.boxModelKey === 'can' || variant.name.toLowerCase().includes('can') || (activeCategoryId?.includes('can') && variant.id === 1);

  const isTE = !isBottle && !isCan && (variant.name === 'Tuck End Box' || variant.name === 'Straight Tuck End Box' || variant.boxModelKey === 'te');
  const isRTE = !isBottle && !isCan && (variant.name === 'Reverse Tuck End Box' || variant.boxModelKey === 'rte');
  const isAuto = !isBottle && !isCan && (variant.name === 'Auto Lock Bottom Box' || variant.boxModelKey === 'auto_lock');
  const isCosmetic = !isBottle && !isCan && (variant.name === 'Cosmetic Box' || variant.boxModelKey === 'cosmetic');
  const isCosmeticB = !isBottle && !isCan && (variant.name === 'Cosmetic Box B (Mailer/Tray Style)' || variant.boxModelKey === 'cosmetic_b');
  const isButtonHole = !isBottle && !isCan && (variant.name === 'Button Hole Box' || variant.boxModelKey === 'button_hole');
  const isBox = isTE || isRTE || isAuto || isCosmetic || isCosmeticB || isButtonHole;
  const boxType = variant.boxModelKey || (isTE ? 'te' : isRTE ? 'rte' : isAuto ? 'auto_lock' : isCosmeticB ? 'cosmetic_b' : isButtonHole ? 'button_hole' : isCosmetic ? 'cosmetic' : 'rte');

  const [material, setMaterial] = useState<'white' | 'kraft'>('white');

  let defaultImage = variant.imageUrl;
  if (!defaultImage || defaultImage === '/mockups/generated_box.png' || defaultImage.includes('box')) {
    if (isCan) {
      defaultImage = '/images/can.png';
    } else if (isWaterBottle) {
      defaultImage = '/images/water_bottle.png';
    } else if (isBottle) {
      defaultImage = '/images/bottle.png';
    } else {
      defaultImage = '/images/boxes/rte_white.jpg';
    }
  }

  const currentImage = isCan
    ? '/images/can.png'
    : isWaterBottle
    ? '/images/water_bottle.png'
    : isBottle
    ? '/images/bottle.png'
    : (material === 'kraft'
      ? (variant.kraftImageUrl || (isBox && BOX_MOCKUP_IMAGES[boxType]?.kraft) || defaultImage)
      : (variant.whiteImageUrl || (isBox && BOX_MOCKUP_IMAGES[boxType]?.white) || defaultImage));

  const handleClick = () => {
    if (isCan) {
      useBoxStore.setState({
        boxModel: 'can',
        activeProjectId: null,
        activeProjectName: null,
        L: 207 / 25.4,
        W: 125 / 25.4,
        H: 122 / 25.4,
        T: 0.008,
        glueFlapWidth: 0.25,
        bleed: 2 / 25.4,
        sizeMode: "manufacture",
        materialType: "metal_matt",
        materialName: "Metal Matt (Aluminum)",
        isCustomMaterial: false,
        materialColor: "#ffffff",
        materialCategory: "metal",
        packageColor: "#ffffff",
        insideColor: "#ffffff",
        decalsByModel: { ...useBoxStore.getState().decalsByModel, can: useBoxStore.getState().decalsByModel?.can || [] }
      });
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'workshop' }));
      return;
    }

    if (isWaterBottle || variant.name.toLowerCase().includes('water bottle')) {
      useBoxStore.setState({
        boxModel: 'water_bottle',
        activeProjectId: null,
        activeProjectName: null,
        L: 243 / 25.4,
        W: 46 / 25.4,
        H: 240 / 25.4,
        T: 0.005,
        glueFlapWidth: 0.25,
        bleed: 2 / 25.4,
        sizeMode: "manufacture",
        materialType: "plastic_glossy",
        materialName: "Plastic Glossy (Clear PET)",
        isCustomMaterial: false,
        materialColor: "#ffffff",
        materialCategory: "plastic",
        packageColor: "#ffffff",
        insideColor: "#ffffff",
        decalsByModel: { ...useBoxStore.getState().decalsByModel, water_bottle: useBoxStore.getState().decalsByModel?.water_bottle || [] }
      });
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'workshop' }));
      return;
    }

    const isKraft = material === 'kraft';
    const cleanDefaultState = {
      L: isButtonHole ? 75 / 25.4 : (isCosmeticB ? 270 / 25.4 : (isCosmetic ? 1.4016 : 4.7244)),
      W: isButtonHole ? 75 / 25.4 : (isCosmeticB ? 260 / 25.4 : (isCosmetic ? 1.4016 : 2.3622)),
      H: isButtonHole ? 60 / 25.4 : (isCosmeticB ? 62 / 25.4 : (isCosmetic ? 4.7874 : 6.2992)),
      T: 0.0197,
      glueFlapWidth: isButtonHole ? 16 / 25.4 : 0.625,
      bleed: 2 / 25.4,
      sizeMode: "manufacture",
      materialType: isKraft ? "corrugated" : "paperboard",
      materialName: isKraft ? "Natural Kraft Cardboard" : "350g white paperboard(0.5mm)",
      isCustomMaterial: false,
      materialColor: isKraft ? "#c19a6b" : "#fdfbf7",
      materialCategory: isKraft ? "kraft_cardboard" : "white_paperboard",
      packageColor: null,
      insideColor: null,
      decalsByModel: { rte: [], te: [], auto_lock: [], cosmetic: [], cosmetic_b: [], button_hole: [], water_bottle: [] }
    };

    const targetModel = variant.boxModelKey || (isRTE ? 'rte' : isTE ? 'te' : isAuto ? 'auto_lock' : isCosmeticB ? 'cosmetic_b' : isButtonHole ? 'button_hole' : isCosmetic ? 'cosmetic' : 'rte');

    useBoxStore.setState({ 
      boxModel: targetModel, 
      activeProjectId: null,
      activeProjectName: null,
      ...cleanDefaultState 
    });

    window.dispatchEvent(new CustomEvent('navigate', { detail: 'workshop' }));
  };

  return (
    <>
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
               <img src={currentImage} alt="thumbnail" className="w-full h-full object-contain" />
            </div>
          </div>
          
          {/* Bottom Buttons */}
          <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-3 w-full">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="pointer-events-auto px-6 py-2.5 bg-white text-zinc-900 font-medium rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow text-[15px] cursor-pointer"
            >
              Custom
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="pointer-events-auto px-6 py-2.5 bg-white text-zinc-900 font-medium rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow text-[15px] cursor-pointer"
            >
              3D design
            </button>
          </div>
        </div>

        {/* Box / Bottle Image / Animation Container */}
        <div className="w-full h-[260px] relative flex items-center justify-center overflow-hidden rounded-lg mb-4">
          {isHovered && isWaterBottle ? (
            <div className="w-full h-full flex items-center justify-center p-2">
              <PlasticWaterBottle3D
                labelColor="#006b2b"
                autoRotate={true}
                autoRotateSpeed={1.6}
                interactive={false}
                className="w-full h-full pointer-events-none"
              />
            </div>
          ) : isBox ? (
            <motion.div
              className="w-full h-full flex items-center justify-center p-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <img
                src={currentImage}
                alt={variant.name}
                className="w-full h-full object-contain drop-shadow-md rounded-lg select-none"
                loading="eager"
              />
            </motion.div>
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
              {(activeCategoryId === 'bottle-mockups' || activeCategoryId === 'bottle' || activeCategoryId?.includes('bottle')) && <HoverBottleAnimation isHovered={true} />}
              {activeCategoryId === 'can-mockups' && <HoverCanAnimation isHovered={true} />}
              {activeCategoryId === 'tube-mockups' && <HoverTubeAnimation isHovered={true} />}
            </div>
          ) : (
            <motion.div
              className="w-full h-full flex items-center justify-center p-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <img
                src={currentImage}
                alt={variant.name}
                className="w-full h-full object-contain drop-shadow-md rounded-lg select-none"
                loading="eager"
              />
            </motion.div>
          )}
        </div>

        {/* Text and Swatches */}
        <div className="flex flex-col items-center text-center relative z-10">
          <h4 className={`text-[17px] font-bold transition-colors text-center ${isHovered ? 'text-black' : ''}`} style={!isHovered ? { color: 'var(--ink)' } : {}}>{variant.name}</h4>
          <p className={`text-[13px] mt-1 text-center ${isHovered ? 'text-zinc-600 opacity-100' : 'opacity-60'}`} style={!isHovered ? { color: 'var(--ink)' } : {}}>{variant.animation || 'Standard reveal'}</p>

          {isWaterBottle && (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-2.5">
              3D PET Plastic • 243×46mm Wrap Label
            </span>
          )}

          {/* Color / Material Swatches for boxes */}
          {isBox && (
            <div className="flex gap-2.5 mt-4 justify-center items-center" onClick={(e) => e.preventDefault()}>
              <button
                type="button"
                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${material === 'white' ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-200' : 'border-zinc-300 hover:scale-105'}`}
                style={{ backgroundColor: '#ffffff' }}
                title="White Board"
                onClick={(e) => { e.stopPropagation(); setMaterial('white'); }}
              />
              <button
                type="button"
                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${material === 'kraft' ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-200' : 'border-zinc-300 hover:scale-105'}`}
                style={{ backgroundColor: '#c19a6b' }}
                title="Kraft Cardboard"
                onClick={(e) => { e.stopPropagation(); setMaterial('kraft'); }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);
};


const ensureAllMockupsComplete = (cats: MockupCategory[]): MockupCategory[] => {
  return cats.map((cat) => {
    if (cat.id === 'box-mockups') {
      const defaultBoxCategory = mockupCategories.find(c => c.id === 'box-mockups');
      const defaultVariants = defaultBoxCategory?.variants || [];
      const currentVariants = [...(cat.variants || [])];
      for (const defV of defaultVariants) {
        const exists = currentVariants.some(v => 
          (v.boxModelKey && defV.boxModelKey && v.boxModelKey === defV.boxModelKey) ||
          (v.name && defV.name && v.name.toLowerCase().trim() === defV.name.toLowerCase().trim())
        );
        if (!exists) {
          currentVariants.push(defV);
        }
      }
      return {
        ...cat,
        variants: currentVariants
      };
    }

    const isBottleCategory = cat.id === 'bottle-mockups' || cat.id === 'bottle' || cat.name?.toLowerCase().includes('bottle');
    if (isBottleCategory) {
      const defaultBottleCat = mockupCategories.find(c => c.id === 'bottle-mockups' || c.id === 'bottle');
      const currentVariants = [...(cat.variants || (defaultBottleCat?.variants || []))];

      const waterBottleVariant: MockupVariant = {
        id: 101,
        name: 'Plastic Mineral Water Bottle',
        animation: 'Realistic PET plastic with ribbed grip & 243x46mm wrap label',
        imageUrl: '/images/water_bottle.png',
        whiteImageUrl: '/images/water_bottle.png',
        kraftImageUrl: '/images/water_bottle.png',
        boxModelKey: 'water_bottle',
        isFeatured: true,
        gridSize: 'large'
      };

      const hasWaterBottle = currentVariants.some(v => 
        v.boxModelKey === 'water_bottle' || v.name.toLowerCase().includes('mineral water bottle')
      );

      if (!hasWaterBottle) {
        currentVariants.unshift(waterBottleVariant);
      }

      // Ensure proper bottle images instead of generated_box.png
      const updatedVariants = currentVariants.map(v => {
        const isW = v.boxModelKey === 'water_bottle' || v.name.toLowerCase().includes('water bottle');
        if (!v.imageUrl || v.imageUrl.includes('generated_box.png') || v.imageUrl.includes('boxes')) {
          return {
            ...v,
            imageUrl: isW ? '/images/water_bottle.png' : '/images/bottle.png',
            whiteImageUrl: isW ? '/images/water_bottle.png' : '/images/bottle.png',
            kraftImageUrl: isW ? '/images/water_bottle.png' : '/images/bottle.png',
          };
        }
        return v;
      });

      return {
        ...cat,
        variants: updatedVariants
      };
    }

    const isCanCategory = cat.id === 'can-mockups' || cat.id === 'can' || cat.name?.toLowerCase().includes('can');
    if (isCanCategory) {
      const defaultCanCat = mockupCategories.find(c => c.id === 'can-mockups' || c.id === 'can');
      const currentVariants = [...(cat.variants || (defaultCanCat?.variants || []))];

      const canVariant: MockupVariant = {
        id: 1,
        name: '12 oz Soda Can',
        animation: 'Realistic 12 oz aluminum can with metal finish & pull-tab',
        imageUrl: '/images/can.png',
        whiteImageUrl: '/images/can.png',
        kraftImageUrl: '/images/can.png',
        boxModelKey: 'can',
        isFeatured: true,
        gridSize: 'large'
      };

      const hasCan = currentVariants.some(v => 
        v.boxModelKey === 'can' || v.name.toLowerCase().includes('soda can')
      );

      if (!hasCan) {
        currentVariants.unshift(canVariant);
      } else {
        const idx = currentVariants.findIndex(v => v.boxModelKey === 'can' || v.name.toLowerCase().includes('soda can'));
        if (idx !== -1) {
          currentVariants[idx] = { ...currentVariants[idx], ...canVariant };
        }
      }

      const updatedVariants = currentVariants.map(v => {
        if (!v.imageUrl || v.imageUrl.includes('generated_box.png') || v.imageUrl.includes('boxes')) {
          return {
            ...v,
            imageUrl: '/images/can.png',
            whiteImageUrl: '/images/can.png',
            kraftImageUrl: '/images/can.png',
          };
        }
        return v;
      });

      return {
        ...cat,
        variants: updatedVariants
      };
    }

    return cat;
  });
};

export default function MockupDetails({ initialCategoryId, onBack }: MockupDetailsProps) {
  const [categories, setCategories] = useState<MockupCategory[]>(() => {
    const cached = catalogService.getCachedCatalog();
    if (cached && cached.length > 0) {
      const mapped = cached.map((item) => ({
        id: item.itemId || item._id || '',
        name: item.title,
        variants: item.variants && item.variants.length > 0
          ? item.variants
          : [
              { id: 1, name: item.title, animation: item.subtitle, imageUrl: item.img }
            ],
      }));
      return ensureAllMockupsComplete(mapped);
    }
    return ensureAllMockupsComplete(mockupCategories);
  });
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(initialCategoryId);
  const [hoveredVariant, setHoveredVariant] = useState<MockupVariant | null>(null);

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
          setCategories(ensureAllMockupsComplete(mapped));
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
    </div>
  );
}
