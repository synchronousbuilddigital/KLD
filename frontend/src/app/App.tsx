// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Package, ChevronRight, ChevronDown, Check, Sliders, RefreshCw, Layers, Image as ImageIcon, Printer } from 'lucide-react';
import NewHomeLanding from './pages/NewHomeLanding';
import PackagingCollections from './pages/PackagingCollections';
import MockupDetails from './pages/MockupDetails';
import BackgroundCanvas from './components/layout/BackgroundCanvas';
import ElasticFooter from './components/layout/ElasticFooter';
import TopDielineTemplates from './pages/TopDielineTemplates';
import TemplateLibraryPage from './pages/TemplateLibraryPage';
import PricingPage from './pages/PricingPage';
import UserProfilePage from './pages/UserProfilePage';
import ModelsPage from './pages/ModelsPage';
import DielinesPage from './pages/DielinesPage';
import AboutUsPage from './pages/AboutUsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import RSCBoxPrototype, { SealState } from './pages/RSCBoxPrototype';
import { getRscGeometry } from '../geometry';

const slideUpVariant = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.15 } },
  viewport: { once: true }
};

// Hero Box Dimensions
const W = 260;  // Width
const D = 180;  // Depth (Length)
const H = 140;   // Height

const steps = ["initial", "appear", "openLid", "openDust", "flat", "facing", "expand", "hero"];

// Premium snappier motion transitions (25-35% faster)
const spring = { type: 'spring', bounce: 0.2, duration: 0.7 };
const smooth = { duration: 0.6, ease: [0.32, 0.72, 0, 1] };
const smoothSlow = { duration: 0.9, ease: [0.32, 0.72, 0, 1] };

// Realistic Kraft Cardboard Styling
const kraftStyle = {
  backgroundColor: '#C89A63',
  borderColor: '#B58556',
  boxShadow: 'inset 0 0 20px rgba(90,60,20,0.12), 0 25px 60px rgba(0,0,0,0.12)',
  borderWidth: '1px',
  borderStyle: 'solid',
};

// Expanded Invisible State (matches white background)
const expandStyle = {
  backgroundColor: '#ffffff',
  borderColor: 'rgba(255,255,255,0)',
  boxShadow: 'inset 0 0 0px rgba(120, 80, 40, 0)',
};

// Container variants with subtle premium rotation through states
const containerVariants = {
  initial: { rotateX: 8, rotateZ: 45, scale: 0 },
  appear: { rotateX: 8, rotateZ: 45, scale: 1, transition: spring },
  openLid: { rotateX: 58, rotateZ: 90, scale: 1, transition: smooth },
  openDust: { rotateX: 55, rotateZ: 35, scale: 1, transition: smooth },
  flat: { rotateX: 50, rotateZ: 30, scale: 1, transition: smooth },
  facing: { rotateX: 0, rotateZ: 0, scale: 1, transition: smoothSlow },
  expand: { rotateX: 0, rotateZ: 0, scale: 30, transition: smoothSlow },
  hero: { rotateX: 0, rotateZ: 0, scale: 30 }
};

// Shared Panel Variants
const centerVariants = {
  initial: { ...kraftStyle },
  appear: { ...kraftStyle },
  openLid: { ...kraftStyle },
  openDust: { ...kraftStyle },
  flat: { ...kraftStyle },
  facing: { ...kraftStyle },
  expand: { ...expandStyle, transition: smoothSlow },
  hero: { ...expandStyle }
};

const frontVariants = {
  initial: { rotateX: 90, ...kraftStyle },
  appear: { rotateX: 90, ...kraftStyle },
  openLid: { rotateX: 90, ...kraftStyle },
  openDust: { rotateX: 90, ...kraftStyle },
  flat: { rotateX: 0, ...kraftStyle, transition: smooth },
  facing: { rotateX: 0, ...kraftStyle },
  expand: { rotateX: 0, ...expandStyle, transition: smoothSlow },
  hero: { rotateX: 0, ...expandStyle }
};

const backVariants = {
  initial: { rotateX: -90, ...kraftStyle },
  appear: { rotateX: -90, ...kraftStyle },
  openLid: { rotateX: -90, ...kraftStyle },
  openDust: { rotateX: -90, ...kraftStyle },
  flat: { rotateX: 0, ...kraftStyle, transition: smooth },
  facing: { rotateX: 0, ...kraftStyle },
  expand: { rotateX: 0, ...expandStyle, transition: smoothSlow },
  hero: { rotateX: 0, ...expandStyle }
};

const leftVariants = {
  initial: { rotateY: 90, ...kraftStyle },
  appear: { rotateY: 90, ...kraftStyle },
  openLid: { rotateY: 90, ...kraftStyle },
  openDust: { rotateY: 90, ...kraftStyle },
  flat: { rotateY: 0, ...kraftStyle, transition: smooth },
  facing: { rotateY: 0, ...kraftStyle },
  expand: { rotateY: 0, ...expandStyle, transition: smoothSlow },
  hero: { rotateX: 0, ...expandStyle }
};

const rightVariants = {
  initial: { rotateY: -90, ...kraftStyle },
  appear: { rotateY: -90, ...kraftStyle },
  openLid: { rotateY: -90, ...kraftStyle },
  openDust: { rotateY: -90, ...kraftStyle },
  flat: { rotateY: 0, ...kraftStyle, transition: smooth },
  facing: { rotateY: 0, ...kraftStyle },
  expand: { rotateY: 0, ...expandStyle, transition: smoothSlow },
  hero: { rotateX: 0, ...expandStyle }
};

const lidVariants = {
  initial: { rotateX: -90, ...kraftStyle },
  appear: { rotateX: -90, ...kraftStyle },
  openLid: { rotateX: 45, ...kraftStyle, transition: smooth },
  openDust: { rotateX: 45, ...kraftStyle },
  flat: { rotateX: 0, ...kraftStyle },
  facing: { rotateX: 0, ...kraftStyle },
  expand: { rotateX: 0, ...expandStyle, transition: smoothSlow },
  hero: { rotateX: 0, ...expandStyle }
};

const tuckVariants = {
  initial: { rotateX: 89, ...kraftStyle },
  appear: { rotateX: 89, ...kraftStyle },
  openLid: { rotateX: 0, ...kraftStyle, transition: smooth },
  openDust: { rotateX: 0, ...kraftStyle },
  flat: { rotateX: 0, ...kraftStyle },
  facing: { rotateX: 0, ...kraftStyle },
  expand: { rotateX: 0, ...expandStyle, transition: smoothSlow },
  hero: { rotateX: 0, ...expandStyle }
};

const leftDustVariants = {
  initial: { rotateY: 89, ...kraftStyle },
  appear: { rotateY: 89, ...kraftStyle },
  openLid: { rotateY: 89, ...kraftStyle },
  openDust: { rotateY: 0, ...kraftStyle, transition: smooth },
  flat: { rotateY: 0, ...kraftStyle },
  facing: { rotateY: 0, ...kraftStyle },
  expand: { rotateY: 0, ...expandStyle, transition: smoothSlow },
  hero: { rotateX: 0, ...expandStyle }
};

const rightDustVariants = {
  initial: { rotateY: -89, ...kraftStyle },
  appear: { rotateY: -89, ...kraftStyle },
  openLid: { rotateY: -89, ...kraftStyle },
  openDust: { rotateY: 0, ...kraftStyle, transition: smooth },
  flat: { rotateY: 0, ...kraftStyle },
  facing: { rotateY: 0, ...kraftStyle },
  expand: { rotateY: 0, ...expandStyle, transition: smoothSlow },
  hero: { rotateX: 0, ...expandStyle }
};

// CSS styles specifically for the category card mocks
const categoriesStyles = ``;

function AboutKelineTools() {
  return (
    <section id="about-us" className="py-32 bg-[#F5EBDD] overflow-hidden font-sans">
      <div className="max-w-[1300px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-20 pl-2">
          <div className="flex items-center gap-4 mb-2">
            <Package className="w-9 h-9 text-zinc-900" />
            <div>
              <h2 className="text-[26px] font-black tracking-tight leading-none text-zinc-900 uppercase">Keline Design</h2>
              <p className="text-[11px] font-extrabold tracking-[0.3em] text-zinc-600 uppercase mt-1">Tools</p>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <motion.div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: "-50px" }}>

          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 rounded-[24px] bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-300 ease-out flex flex-col"
          >
            <div className="h-[400px] overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1698376621004-70ce754157d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNrYWdpbmclMjBtb2NrdXAlMjBib3glMjB0dWJlJTIwY2FufGVufDF8fHx8MTc4MjI5MjM5Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Packaging Mockup" className="w-full h-full object-cover" />
              {/* Subtle Keline Branding Overlay */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                <Package className="w-4 h-4 text-zinc-800" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-800">Keline</span>
              </div>
            </div>
            <div className="p-10 flex-1 flex flex-col justify-center">
              <h3 className="text-3xl font-bold text-zinc-900 mb-4">Online Mockup Generator</h3>
              <p className="text-zinc-500 text-lg leading-relaxed">Create realistic packaging mockups directly from dielines, cans, tubes, pouches and boxes.</p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 rounded-[24px] bg-[#E8D5B7] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-300 ease-out flex flex-col justify-center relative overflow-hidden"
          >
            {/* Decorative background element */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-[32px] md:text-4xl font-bold text-zinc-900 mb-6 leading-[1.1]">Create Professional<br />Packaging Visuals</h3>
            <p className="text-[#8B6B4A] text-xl leading-relaxed font-medium">Transform simple packaging structures into realistic product presentations in seconds. Perfect for designers, agencies and manufacturers.</p>
          </motion.div>

          {/* Card 4 (Text) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 rounded-[24px] bg-[#D7B98E] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-300 ease-out flex flex-col justify-center relative overflow-hidden"
          >
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-black/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-[32px] md:text-4xl font-bold text-[#4A3824] mb-6 leading-[1.1]">Professional<br />Dieline Templates</h3>
            <p className="text-[#755A3D] text-xl leading-relaxed font-medium">Access accurate print-ready dielines designed for packaging production and structural design workflows.</p>
          </motion.div>

          {/* Card 3 (Image) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 rounded-[24px] bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-300 ease-out relative h-[500px]"
          >
            <img src="https://images.unsplash.com/photo-1721244654392-9c912a6eb236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobmljYWwlMjBibHVlcHJpbnQlMjBib3glMjB0ZW1wbGF0ZXxlbnwxfHx8fDE3ODIyOTIzOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Dieline Templates" className="w-full h-full object-cover mix-blend-multiply opacity-80" />

            {/* Draw-on effect for dieline lines */}
            <motion.svg
              className="absolute inset-0 w-full h-full pointer-events-none p-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M10,10 L90,10 L90,90 L10,90 Z M30,10 L30,90 M70,10 L70,90 M10,30 L90,30 M10,70 L90,70"
                fill="none"
                stroke="#C89A63"
                strokeWidth="0.5"
                strokeDasharray="2"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.8 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.6, ease: "easeInOut" }}
              />
            </motion.svg>
          </motion.div>

          {/* Card 5 (Image) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-8 rounded-[24px] bg-zinc-900 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.2)] hover:-translate-y-2 transition-all duration-300 ease-out relative h-[550px]"
          >
            <img src="https://images.unsplash.com/photo-1547194936-28214bd75193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzRCUyMGRlc2lnbiUyMHNvZnR3YXJlJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc4MjI5MjM5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="3D Software Interface" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity" />

            {/* Faux UI overlay for "stagger in" */}
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-10 pointer-events-none">

              <div className="flex justify-between items-start">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 shadow-xl">
                  <Package className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-bold tracking-widest text-white uppercase">Keline Editor</span>
                </div>

                <motion.div
                  variants={slideUpVariant}
                  className="w-48 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl flex items-center px-4"
                >
                  <div className="w-4 h-4 rounded-full bg-green-400 mr-2 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                  <div className="h-2 w-24 bg-white/20 rounded-full" />
                </motion.div>
              </div>

              <div className="flex justify-end gap-4 mt-auto">
                <motion.div
                  variants={slideUpVariant}
                  className="w-64 h-40 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 flex flex-col justify-between"
                >
                  <div className="h-3 w-32 bg-white/10 rounded-full" />
                  <div className="space-y-3">
                    <div className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />
                    <div className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />
                  </div>
                </motion.div>

                <motion.div
                  variants={slideUpVariant}
                  className="w-32 h-40 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-amber-500/50 border-t-amber-500" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Card 6 */}
          <motion.div
            variants={slideUpVariant}
            className="md:col-span-4 rounded-[24px] bg-white p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-300 ease-out flex flex-col justify-center border border-zinc-100"
          >
            <h3 className="text-[32px] font-bold text-zinc-900 mb-6 leading-tight">User-Friendly<br />3D Modelling</h3>
            <p className="text-zinc-500 text-lg leading-relaxed">Visualize packaging instantly with intuitive 3D tools, realistic materials and high-quality exports.</p>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}

function HeroSlideshow({ visible }: { visible: boolean }) {
  const [current, setCurrent] = useState(0);
  const images = [
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1920&q=80',   // Elegant packaging boxes
    'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1920&q=80',   // Branded packaging design
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1920&q=80',      // Minimal white boxes
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1920&q=80',   // Premium packaging layout
  ];

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [visible, images.length]);

  return (
    <motion.div
      className="absolute inset-0 z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
      {images.map((src, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <img
            src={src}
            alt={`Packaging showcase ${i + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/70" />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function App() {
  const getViewFromUrl = (): 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'library' | 'admin' => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const route = path || hash;
    if (route === 'admin') return 'admin';
    if (route === 'workspace') return 'workspace';
    if (route === 'profile') return 'profile';
    if (route === 'pricing') return 'pricing';
    if (route === 'dielines' || route === 'library') return 'dielines';
    if (route === '3d-models' || route === 'models') return 'models';
    if (route === 'about-us' || route === 'about') return 'about';
    return 'landing';
  };

  const [currentView, setCurrentView] = useState<'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'library' | 'admin' | 'workspace'>(getViewFromUrl);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(() => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    if (path.startsWith('mockup/')) {
      return path.split('/')[1] || null;
    }
    return null;
  });
  const [stepIndex, setStepIndex] = useState(0);

  const handleCategorySelect = (id: string | null) => {
    setActiveCategoryId(id);
    if (id) {
      window.history.pushState(null, '', `/mockup/${id}`);
    } else {
      const targetPath = currentView === 'models' ? '/3d-models' : '/';
      window.history.pushState(null, '', targetPath);
    }
  };

  const navigateTo = (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'library' | 'admin' | 'workspace', extra?: any) => {
    setCurrentView(view);
    setActiveCategoryId(null);
    let targetPath = '/';
    if (view === 'admin') targetPath = '/admin';
    else if (view === 'workspace') targetPath = '/workspace';
    else if (view === 'models') targetPath = '/3d-models';
    else if (view === 'dielines') targetPath = '/dielines';
    else if (view === 'pricing') targetPath = '/pricing';
    else if (view === 'about') targetPath = '/about-us';
    else if (view === 'profile') targetPath = '/profile';
    window.history.pushState(null, '', targetPath);

    if (extra && extra.boxConfig) {
      if (extra.boxConfig.dimensions) {
        if (extra.boxConfig.dimensions.L) setWidth(extra.boxConfig.dimensions.L);
        if (extra.boxConfig.dimensions.W) setDepth(extra.boxConfig.dimensions.W);
        if (extra.boxConfig.dimensions.H) setHeight(extra.boxConfig.dimensions.H);
      }
    }
  };

  useEffect(() => {
    const handleNavigate = (e: Event | CustomEvent) => {
      if ('detail' in e && e.detail) {
        if (typeof e.detail === 'object' && e.detail.view) {
          navigateTo(e.detail.view, e.detail.extra);
        } else if (typeof e.detail === 'string') {
          navigateTo(e.detail as any);
        }
      }
    };
    const handleHashChange = () => {
      setCurrentView(getViewFromUrl());
      const path = window.location.pathname.replace('/', '').toLowerCase();
      if (path.startsWith('mockup/')) {
        setActiveCategoryId(path.split('/')[1] || null);
      } else {
        setActiveCategoryId(null);
      }
    };

    window.addEventListener('navigate', handleNavigate);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('navigate', handleNavigate);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Design Lab Interactive Workspace States
  const [activeTab, setActiveTab] = useState('dimensions');
  const [isStudioDropdownOpen, setIsStudioDropdownOpen] = useState(false);
  const [width, setWidth] = useState(305);
  const [height, setHeight] = useState(305);
  const [depth, setDepth] = useState(305);

  const [foldProgress, setFoldProgress] = useState(0);
  const [material, setMaterial] = useState('kraft');
  const [artwork, setArtwork] = useState('keyline');
  const [customColor, setCustomColor] = useState('#A7F3D0'); // Custom color finish
  const [customLogoUrl, setCustomLogoUrl] = useState<string | ArrayBuffer | null>(null); // Custom brand logo uploader
  const [sealState, setSealState] = useState<SealState>('unsealed');

  // Handle custom navigate events across components
  useEffect(() => {
    const handleCustomNavigate = (e: any) => {
      const targetView = e.detail;
      if (targetView) {
        setCurrentView(targetView);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('navigate', handleCustomNavigate);
    return () => window.removeEventListener('navigate', handleCustomNavigate);
  }, []);

  // Auto-save active box session to workspace drafts in localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem('kld_workspace_items');
        let items = stored ? JSON.parse(stored) : [];
        
        const activeDraftIndex = items.findIndex((i: any) => i.id === 'active-session-draft');
        const draftObj = {
          id: 'active-session-draft',
          name: `Current Custom Box (${width} × ${depth} × ${height} mm)`,
          category: 'Tuck End Box',
          tabCategory: 'projects',
          dimensions: { L: width, W: depth, H: height },
          updatedAt: new Date().toISOString(),
          isDraft: true,
          isFavorite: activeDraftIndex >= 0 ? items[activeDraftIndex].isFavorite : false
        };

        if (activeDraftIndex >= 0) {
          items[activeDraftIndex] = draftObj;
        } else {
          items.unshift(draftObj);
        }
        localStorage.setItem('kld_workspace_items', JSON.stringify(items));
      } catch (err) {
        console.log('Error auto-saving session draft:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [width, depth, height]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      await new Promise(r => setTimeout(r, 200));
      if (!mounted) return; setStepIndex(1); // appear

      await new Promise(r => setTimeout(r, 800));
      if (!mounted) return; setStepIndex(2); // openLid

      await new Promise(r => setTimeout(r, 500));
      if (!mounted) return; setStepIndex(3); // openDust

      await new Promise(r => setTimeout(r, 500));
      if (!mounted) return; setStepIndex(4); // flat

      await new Promise(r => setTimeout(r, 700));
      if (!mounted) return; setStepIndex(5); // facing

      await new Promise(r => setTimeout(r, 800));
      if (!mounted) return; setStepIndex(6); // expand

      await new Promise(r => setTimeout(r, 800));
      if (!mounted) return; setStepIndex(7); // hero
    };
    run();
    return () => { mounted = false; };
  }, []);

  // Emulate flawless "Fit to Screen" scaling
  useEffect(() => {
    const handleResize = () => {
      const BASE_WIDTH = 1440;
      const BASE_HEIGHT = 900;
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      // Calculate scale to perfectly fit both the height and width of the screen without clipping
      const scale = Math.min(currentWidth / BASE_WIDTH, currentHeight / BASE_HEIGHT);

      // Apply zoom to body so the entire document scales
      document.body.style.zoom = scale.toString();
      document.documentElement.style.setProperty('--app-scale', scale.toString());

      // Crucial fix: Make the body wide enough to fill the entire screen after zoom is applied.
      // This completely eliminates "pillar-boxing" (extra space on the sides).
      document.body.style.width = `${currentWidth / scale}px`;

      document.body.style.overflowX = 'hidden';
      document.body.style.margin = '0 auto';
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial setup

    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.zoom = '';
      document.body.style.width = '';
      document.body.style.overflowX = '';
      document.body.style.margin = '';
    };
  }, []);

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem('maintenanceMode') === 'true';
  });

  useEffect(() => {
    const handleMaintenanceChange = () => {
      setIsMaintenanceMode(localStorage.getItem('maintenanceMode') === 'true');
    };
    window.addEventListener('maintenance-mode-change', handleMaintenanceChange);
    return () => window.removeEventListener('maintenance-mode-change', handleMaintenanceChange);
  }, []);

  if (activeCategoryId) {
    return <MockupDetails initialCategoryId={activeCategoryId} onBack={() => handleCategorySelect(null)} />;
  }

  if (currentView === 'models') {
    return <ModelsPage onNavigate={navigateTo} onCategorySelect={(id) => handleCategorySelect(id)} />;
  }

  if (currentView === 'dielines' || currentView === 'library') {
    return <DielinesPage onNavigate={navigateTo} />;
  }

  if (currentView === 'pricing') {
    return <PricingPage onNavigate={navigateTo} onBack={() => navigateTo('landing')} />;
  }

  if (currentView === 'admin') {
    const storedUserRaw = localStorage.getItem('user');
    let userRole = 'USER';
    if (storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw);
        if (parsed.role) userRole = parsed.role;
      } catch {}
    }

    if (userRole !== 'ADMIN') {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#09090b',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: '#ef4444'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 12px 0' }}>
            Admin Access Restricted
          </h1>
          <p style={{ maxWidth: '460px', color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            Please sign in with Admin credentials to access the KLD Control Center.
          </p>
          <button 
            onClick={() => navigateTo('landing')}
            style={{
              padding: '11px 22px',
              borderRadius: '10px',
              background: '#C89A63',
              color: '#09090b',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            Back to Packaging Studio
          </button>
        </div>
      );
    }

    return <AdminDashboardPage onBack={() => navigateTo('landing')} />;
  }

  if (currentView === 'profile') {
    const storedUserRaw = localStorage.getItem('user');
    let userRole = 'USER';
    if (storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw);
        if (parsed.role) userRole = parsed.role;
      } catch {}
    }

    if (userRole === 'ADMIN') {
      return <AdminDashboardPage onBack={() => navigateTo('landing')} />;
    }

    return <UserProfilePage onBack={() => navigateTo('landing')} />;
  }

  if (currentView === 'about') {
    return <AboutUsPage onNavigate={navigateTo} />;
  }

  // System Maintenance Mode Guard for non-admin views
  const storedUserRaw = localStorage.getItem('user');
  let loggedInUserRole = 'USER';
  if (storedUserRaw) {
    try {
      const parsedUser = JSON.parse(storedUserRaw);
      if (parsedUser.role) loggedInUserRole = parsedUser.role;
    } catch {}
  }

  if (isMaintenanceMode && loggedInUserRole !== 'ADMIN') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#09090b',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          color: '#d97706',
          boxShadow: '0 8px 32px rgba(217, 119, 6, 0.15)'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          color: '#d97706',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: '8px'
        }}>SYSTEM MAINTENANCE MODE</span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 12px 0', color: '#ffffff' }}>
          Keyline Design Studio is Under Scheduled Maintenance
        </h1>
        <p style={{ maxWidth: '520px', color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 28px 0' }}>
          We are currently upgrading our 3D packaging engine & dieline algorithms for maximum performance. We will be back live shortly!
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => navigateTo('admin')} 
            style={{
              padding: '11px 22px',
              borderRadius: '10px',
              background: '#C89A63',
              color: '#09090b',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            Admin Control Center Access
          </button>
        </div>
      </div>
    );
  }

  const current = steps[stepIndex];

  // Materials details
  const materialStyles = {
    kraft: {
      backgroundColor: '#C89A63',
      borderColor: '#B58556',
      backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)',
      boxShadow: 'inset 0 0 15px rgba(90,60,20,0.15), 0 10px 20px rgba(0,0,0,0.1)',
      textColor: 'text-amber-950/70',
      logoInvert: false
    },
    white: {
      backgroundColor: '#F8FAFC',
      borderColor: '#E2E8F0',
      backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)',
      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.02), 0 10px 20px rgba(0,0,0,0.05)',
      textColor: 'text-zinc-600',
      logoInvert: false
    },
    black: {
      backgroundColor: '#1E293B',
      borderColor: '#0F172A',
      backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05) 0%, transparent 60%)',
      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.2)',
      textColor: 'text-zinc-400',
      logoInvert: true
    },
    gold: {
      backgroundColor: '#D4AF37',
      borderColor: '#AA7C11',
      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
      boxShadow: 'inset 0 0 12px rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.15)',
      textColor: 'text-amber-900',
      logoInvert: false
    },
    custom: {
      backgroundColor: customColor,
      borderColor: 'rgba(0, 0, 0, 0.15)',
      backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)',
      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
      textColor: 'text-zinc-800',
      logoInvert: false
    }
  };

  const getAngle = (progress: number, startP: number, endP: number, startA: number, endA: number) => {
    if (progress <= startP) return startA;
    if (progress >= endP) return endA;
    const ratio = (progress - startP) / (endP - startP);
    return startA + ratio * (endA - startA);
  };

  const rightLeftFold = getAngle(foldProgress, 10, 45, 0, 90);
  const frontBackFold = getAngle(foldProgress, 35, 70, 0, 90);
  const lidFold = getAngle(foldProgress, 60, 90, 0, -90);
  // Corrected tuckFold so it bends inward (-90deg) relative to lid cover, closing inside the box perfectly
  const tuckFold = getAngle(foldProgress, 80, 100, 0, -90);

  const renderArtwork = () => {
    const activeMaterialStyle = (materialStyles as Record<string, any>)[material] || materialStyles.kraft;
    const isDark = activeMaterialStyle.logoInvert;
    const colorClass = isDark ? 'text-white border-white/20' : 'text-zinc-800 border-zinc-800/20';

    switch (artwork) {
      case 'custom':
        return customLogoUrl ? (
          <img src={customLogoUrl as string} alt="Custom Logo" className="max-w-[70%] max-h-[70%] object-contain select-none pointer-events-none" />
        ) : (
          <div className="text-[9px] opacity-40 select-none">No logo uploaded</div>
        );
      case 'keyline':
        return (
          <div className={`flex flex-col items-center justify-center h-full ${colorClass} p-2 text-center select-none`}>
            <Package className="w-5 h-5 mb-1.5 opacity-90" />
            <div className="text-[10px] tracking-widest font-black uppercase leading-none">KEYLINE</div>
            <div className="text-[6px] tracking-wider mt-1 opacity-70">3D DESIGN STUDIO</div>
          </div>
        );
      case 'coffee':
        return (
          <div className={`flex flex-col items-center justify-center h-full ${colorClass} p-2 text-center select-none`}>
            <div className="border rounded-full p-1 mb-1 flex items-center justify-center">
              <span className="text-[10px]">☕</span>
            </div>
            <div className="text-[9px] uppercase tracking-widest font-black leading-none">Roast & Co.</div>
            <div className="text-[6px] tracking-wider mt-0.5 opacity-70">ORGANIC BEANS</div>
          </div>
        );
      case 'tech':
        return (
          <div className={`flex flex-col items-start justify-between h-full ${colorClass} p-2.5 text-left w-full select-none`}>
            <span className="text-[10px] font-bold leading-none">❖</span>
            <div className="mt-auto">
              <div className="text-[9px] font-mono leading-none tracking-tight font-black">NEXUS v.4</div>
              <div className="text-[5px] tracking-wide mt-0.5 opacity-60">MINIMAL CONTROLLER</div>
            </div>
          </div>
        );
      case 'eco':
        return (
          <div className={`flex flex-col items-center justify-center h-full ${colorClass} p-2 text-center select-none`}>
            <div className="text-xs leading-none mb-0.5">🌿</div>
            <div className="text-[8px] font-sans font-bold tracking-tight uppercase">PURE EARTH</div>
            <div className="text-[5px] italic opacity-80 mt-0.5">Biodegradable</div>
          </div>
        );
      default:
        return null;
    }
  };

  if (currentView === 'models') {
    return <ModelsPage onNavigate={navigateTo} onCategorySelect={(id) => handleCategorySelect(id)} />;
  }

  if (currentView === 'dielines' || currentView === 'library') {
    return <DielinesPage onNavigate={navigateTo} />;
  }

  if (currentView === 'pricing') {
    return <PricingPage onNavigate={navigateTo} onBack={() => navigateTo('landing')} />;
  }

  if (currentView === 'profile') {
    return <UserProfilePage onBack={() => navigateTo('landing')} />;
  }

  if (currentView === 'workspace') {
    return (
      <WorkspacePage 
        onNavigate={(v, extra) => navigateTo(v as any, extra)} 
        onBack={() => navigateTo('landing')} 
        onOpenStudioWithBox={(box) => {
          if (box && box.dimensions) {
            if (box.dimensions.L) setWidth(box.dimensions.L);
            if (box.dimensions.W) setDepth(box.dimensions.W);
            if (box.dimensions.H) setHeight(box.dimensions.H);
          }
          navigateTo('landing');
        }} 
      />
    );
  }

  return (
    <>
      {stepIndex >= 7 && (
        <style>{`
        body { background-color: #C89A63; }
      `}</style>
      )}
      <div className={`relative w-full bg-white text-zinc-900 font-sans z-10 shadow-[0_30px_60px_rgba(0,0,0,0.15)] ${stepIndex >= 7 ? 'min-h-[900px]' : 'h-[900px] overflow-hidden'}`}>
        <BackgroundCanvas />
        <div className="relative w-full h-[900px] overflow-hidden bg-white">
          <HeroSlideshow visible={stepIndex >= 7} />
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" initial={{ opacity: 1 }} animate={{ opacity: stepIndex >= 7 ? 0 : 1 }} transition={{ duration: 0.6 }}><h1 className="text-[18vw] font-black tracking-[-0.1em] text-zinc-500 select-none uppercase leading-none">KEYLINE DESIGN</h1></motion.div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{ perspective: 'calc(1400px * var(--app-scale, 1))' }}><motion.div variants={containerVariants} initial="initial" animate={steps[stepIndex] || 'initial'} style={{ width: W, height: D, transformStyle: 'preserve-3d' }} className="relative"><motion.div variants={centerVariants} className="absolute inset-0" /><motion.div variants={frontVariants} style={{ top: '100%', left: 0, width: W, height: H, transformOrigin: 'top', transformStyle: 'preserve-3d' }} className="absolute" /><motion.div variants={backVariants} style={{ bottom: '100%', left: 0, width: W, height: H, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }} className="absolute"><motion.div variants={lidVariants} style={{ bottom: '100%', left: 0, width: W, height: D, transformOrigin: 'bottom', transformStyle: 'preserve-3d' }} className="absolute"><motion.div variants={tuckVariants} style={{ bottom: '100%', left: 1, width: W - 2, height: 30, transformOrigin: 'bottom' }} className="absolute" /></motion.div></motion.div><motion.div variants={leftVariants} style={{ right: '100%', top: 0, width: H, height: D, transformOrigin: 'right', transformStyle: 'preserve-3d' }} className="absolute"><motion.div variants={leftDustVariants} style={{ right: '100%', top: 1, width: 60, height: D - 2, transformOrigin: 'right' }} className="absolute" /></motion.div><motion.div variants={rightVariants} style={{ left: '100%', top: 0, width: H, height: D, transformOrigin: 'left', transformStyle: 'preserve-3d' }} className="absolute"><motion.div variants={rightDustVariants} style={{ left: '100%', top: 1, width: 60, height: D - 2, transformOrigin: 'left' }} className="absolute" /></motion.div></motion.div></div>
          <motion.div className="absolute inset-0 z-50 flex flex-col pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: stepIndex >= 7 ? 1 : 0 }} transition={{ duration: 0.8 }} style={{ pointerEvents: stepIndex >= 7 ? 'auto' : 'none' }}>
            <div className="w-full h-full bg-white relative"><NewHomeLanding /></div>
          </motion.div>
        </div>
        {stepIndex >= 7 && (
          <>
            {/* Interactive Design Lab Section */}
            <section className="bg-zinc-950 text-white py-24 px-8 border-t border-zinc-900">
              <motion.div className="max-w-6xl mx-auto mb-16 text-left" variants={slideUpVariant} initial="initial" whileInView="whileInView" viewport={{ once: true }}>
                <span className="text-amber-500 font-mono text-sm tracking-wider uppercase">Interactive Design Lab</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-2 text-white">
                  Prototype in 3D Real-Time
                </h2>
                <p className="text-zinc-400 text-lg mt-4 max-w-2xl">
                  Experiment with dimensions, adjust assembly fold states, switch materials, and apply artwork decals directly in your browser.
                </p>
              </motion.div>

              {/* Design Lab Container */}
              <motion.div className="w-full max-w-6xl mx-auto bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[560px]" variants={slideUpVariant} initial="initial" whileInView="whileInView" viewport={{ once: true }}>

                {/* Controls Column (Left) */}
                <div className="lg:col-span-5 border-r border-zinc-800/80 p-8 flex flex-col justify-between bg-zinc-900/20">
                  <div className="space-y-6">

                    {/* Selector Dropdown */}
                    <div className="relative w-full z-30">
                      <button
                        type="button"
                        onClick={() => setIsStudioDropdownOpen(!isStudioDropdownOpen)}
                        className="w-full flex items-center justify-between bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-white rounded-xl px-4 py-3 shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold">
                            {activeTab === 'dimensions' && <Sliders className="w-4 h-4 text-black" />}
                            {activeTab === 'folding' && <RefreshCw className="w-4 h-4 text-black" />}
                            {activeTab === 'materials' && <Layers className="w-4 h-4 text-black" />}
                            {activeTab === 'artwork' && <ImageIcon className="w-4 h-4 text-black" />}
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-white uppercase tracking-wider">
                              {activeTab === 'dimensions' && 'Size & Dimensions'}
                              {activeTab === 'folding' && 'Assembly & Fold States'}
                              {activeTab === 'materials' && 'Material & Finish Simulator'}
                              {activeTab === 'artwork' && 'Brand & Artwork Decal'}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-medium">
                              {activeTab === 'dimensions' && 'Customize Box Width, Depth & Height'}
                              {activeTab === 'folding' && 'Animate Lid & Flap Fold Sequences'}
                              {activeTab === 'materials' && 'Kraft, Matte, Gloss & Gold Foil'}
                              {activeTab === 'artwork' && 'Apply Packaging Design Decal & Texture'}
                            </div>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isStudioDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isStudioDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700/90 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/80">
                          {[
                            { id: 'dimensions', label: 'Size & Dimensions', icon: Sliders, desc: 'Customize Box Width, Depth & Height' },
                            { id: 'folding', label: 'Assembly & Fold States', icon: RefreshCw, desc: 'Animate Lid & Flap Fold Sequences' },
                            { id: 'materials', label: 'Material & Finish Simulator', icon: Layers, desc: 'Kraft, Matte, Gloss & Gold Foil' },
                            { id: 'artwork', label: 'Brand & Artwork Decal', icon: ImageIcon, desc: 'Apply Packaging Design Decal & Texture' },
                          ].map((opt) => {
                            const IconComp = opt.icon;
                            const isSelected = activeTab === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setActiveTab(opt.id);
                                  setIsStudioDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${
                                  isSelected ? 'bg-zinc-800 text-white font-bold' : 'hover:bg-zinc-800/60 text-zinc-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <IconComp className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-zinc-400'}`} />
                                  <div>
                                    <div className="text-xs font-bold">{opt.label}</div>
                                    <div className="text-[10px] text-zinc-400">{opt.desc}</div>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* TAB 1: Dimensions Controls */}
                    {activeTab === 'dimensions' && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1 font-mono">
                              <span className="text-zinc-500">Width (X)</span>
                              <span className="text-white">{width}px</span>
                            </div>
                            <input
                              type="range" min="50" max="600" value={width}
                              onChange={(e) => setWidth(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1 font-mono">
                              <span className="text-zinc-500">Depth (Y)</span>
                              <span className="text-white">{depth}px</span>
                            </div>
                            <input
                              type="range" min="50" max="600" value={depth}
                              onChange={(e) => setDepth(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1 font-mono">
                              <span className="text-zinc-500">Height (Z)</span>
                              <span className="text-white">{height}px</span>
                            </div>
                            <input
                              type="range" min="50" max="600" value={height}
                              onChange={(e) => setHeight(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 font-mono block mb-2 uppercase tracking-wider">Dynamic 2D Dieline Blueprint</span>
                          <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 flex items-center justify-center h-44 overflow-hidden relative" style={{ '--w': `${width}px`, '--h': `${height}px`, '--d': `${depth}px`, '--slot': '6px' } as React.CSSProperties}>
                            <div className="blueprint-rsc scale-[0.18] sm:scale-[0.2] md:scale-[0.22] origin-top-left absolute top-4 left-4">
                              <div className="bp-glue"></div>

                              <div className="bp-col">
                                <div className="bp-flap-top bp-d"></div>
                                <div className="bp-panel bp-left"></div>
                                <div className="bp-flap-bottom bp-d"></div>
                              </div>

                              <div className="bp-col">
                                <div className="bp-flap-top bp-w"></div>
                                <div className="bp-panel bp-back"></div>
                                <div className="bp-flap-bottom bp-w"></div>
                              </div>

                              <div className="bp-col">
                                <div className="bp-flap-top bp-d"></div>
                                <div className="bp-panel bp-right"></div>
                                <div className="bp-flap-bottom bp-d"></div>
                              </div>

                              <div className="bp-col">
                                <div className="bp-flap-top bp-w"></div>
                                <div className="bp-panel bp-front"></div>
                                <div className="bp-flap-bottom bp-w"></div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* TAB 2: Folding Scrubber */}
                    {activeTab === 'folding' && (
                      <div className="space-y-6">
                        <div className="bg-zinc-950/50 p-4 border border-zinc-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 font-semibold">Assembly Progress</span>
                            <span className="text-amber-500 font-bold font-mono">{foldProgress}%</span>
                          </div>
                          <input
                            type="range" min="0" max="100" value={foldProgress}
                            onChange={(e) => {
                              if (sealState !== 'unsealed') return;
                              setFoldProgress(Number(e.target.value));
                            }}
                            disabled={sealState !== 'unsealed'}
                            className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 ${sealState !== 'unsealed' ? 'opacity-40 cursor-not-allowed' : ''}`}
                          />
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className={`flex justify-between p-2.5 rounded-lg ${foldProgress < 10 ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>
                            <span>1. Flat Dieline Sheet</span>
                            <span className="font-mono">0% - 10%</span>
                          </div>
                          <div className={`flex justify-between p-2.5 rounded-lg ${foldProgress >= 10 && foldProgress < 45 ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>
                            <span>2. Dust Flaps Fold In</span>
                            <span className="font-mono">10% - 45%</span>
                          </div>
                          <div className={`flex justify-between p-2.5 rounded-lg ${foldProgress >= 45 && foldProgress < 80 ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>
                            <span>3. Side Panels Assemble</span>
                            <span className="font-mono">45% - 80%</span>
                          </div>
                          <div className={`flex justify-between p-2.5 rounded-lg ${foldProgress >= 80 ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>
                            <span>4. Lid Tucks In (Complete)</span>
                            <span className="font-mono">80% - 100%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Material & Finish Simulator */}
                    {activeTab === 'materials' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setMaterial('kraft')}
                            className={`p-3 rounded-xl border flex flex-col items-start gap-2 transition-all ${material === 'kraft' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
                              }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-[#C89A63] border border-[#B58556]"></span>
                            <div className="text-left">
                              <div className="text-xs font-bold">Kraft Cardboard</div>
                              <div className="text-[10px] text-zinc-500">Natural Eco-kraft</div>
                            </div>
                          </button>

                          <button
                            onClick={() => setMaterial('white')}
                            className={`p-3 rounded-xl border flex flex-col items-start gap-2 transition-all ${material === 'white' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
                              }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]"></span>
                            <div className="text-left">
                              <div className="text-xs font-bold">Matte White</div>
                              <div className="text-[10px] text-zinc-500">Bleached Minimalism</div>
                            </div>
                          </button>

                          <button
                            onClick={() => setMaterial('black')}
                            className={`p-3 rounded-xl border flex flex-col items-start gap-2 transition-all ${material === 'black' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
                              }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-[#1E293B] border border-[#0F172A]"></span>
                            <div className="text-left">
                              <div className="text-xs font-bold">Slate Black</div>
                              <div className="text-[10px] text-zinc-500">Premium Finish</div>
                            </div>
                          </button>

                          <button
                            onClick={() => setMaterial('gold')}
                            className={`p-3 rounded-xl border flex flex-col items-start gap-2 transition-all ${material === 'gold' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
                              }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-[#D4AF37] border border-[#AA7C11]"></span>
                            <div className="text-left">
                              <div className="text-xs font-bold">Gold Foil</div>
                              <div className="text-[10px] text-zinc-500">Reflective Coating</div>
                            </div>
                          </button>
                        </div>

                        {/* Custom Color Selector */}
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full border border-zinc-700 relative overflow-hidden cursor-pointer shadow-inner flex items-center justify-center"
                              style={{ backgroundColor: customColor }}
                              onClick={() => {
                                setMaterial('custom');
                                document.getElementById('custom-color-picker')?.click();
                              }}
                            >
                              <input
                                type="color"
                                id="custom-color-picker"
                                value={customColor}
                                onChange={(e) => {
                                  setCustomColor(e.target.value);
                                  setMaterial('custom');
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                              />
                              <div className="w-2.5 h-2.5 rounded-full bg-white/40 pointer-events-none"></div>
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-bold">Custom Finish Color</div>
                              <div className="text-[10px] text-zinc-500">Pick any custom shade</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setMaterial('custom')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${material === 'custom' ? 'bg-white text-black border-white' : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                              }`}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: Artwork Decals */}
                    {activeTab === 'artwork' && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Decal Branding Designs</span>
                          <div className="space-y-2">
                            <button
                              onClick={() => setArtwork('keyline')}
                              className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${artwork === 'keyline' ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                            >
                              <span>📦 KEYLINE Design (Site Logo)</span>
                              {artwork === 'keyline' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                            </button>

                            <button
                              onClick={() => setArtwork('coffee')}
                              className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${artwork === 'coffee' ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                            >
                              <span>☕ Roast & Co. Label</span>
                              {artwork === 'coffee' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                            </button>

                            <button
                              onClick={() => setArtwork('tech')}
                              className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${artwork === 'tech' ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                            >
                              <span>❖ Nexus IoT Plate</span>
                              {artwork === 'tech' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                            </button>

                            <button
                              onClick={() => setArtwork('eco')}
                              className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${artwork === 'eco' ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                            >
                              <span>🌿 Pure Earth Label</span>
                              {artwork === 'eco' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                            </button>
                          </div>
                        </div>

                        {/* Custom Logo Upload Section */}
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Or Upload Custom Logo</span>
                          <div className="flex items-center gap-3">
                            <label
                              htmlFor="logo-uploader"
                              className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/50 hover:bg-zinc-950/80 rounded-xl p-4 cursor-pointer transition-all"
                            >
                              <span className="text-zinc-500 text-xs font-medium">Click to upload JPG/PNG</span>
                              <input
                                type="file"
                                id="logo-uploader"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target && event.target.result) {
                                        setCustomLogoUrl(event.target.result);
                                        setArtwork('custom');
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {customLogoUrl && (
                            <div className="flex items-center justify-between text-xs p-2 bg-zinc-950/40 border border-zinc-800/80 rounded-lg">
                              <span className="text-zinc-400 truncate max-w-[150px]">Custom logo loaded</span>
                              <button
                                onClick={() => {
                                  setCustomLogoUrl(null);
                                  setArtwork('keyline');
                                }}
                                className="text-red-500 hover:text-red-400 font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* viewport column (Right) */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 bg-black/50 relative overflow-hidden min-h-[400px]">

                  {/* Viewport Header Actions (Tape/Blade) */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const isAnimating = sealState === 'sealing' || sealState === 'cutting';
                        if (isAnimating) return;

                        if (sealState === 'unsealed') {
                          setFoldProgress(100);
                          setSealState('sealing');
                          setTimeout(() => {
                            setSealState('sealed');
                          }, 1500);
                        } else if (sealState === 'sealed') {
                          setSealState('cutting');
                          setTimeout(() => {
                            setSealState('unsealed');
                          }, 1500);
                        }
                      }}
                      className="bg-zinc-900 border border-zinc-800 text-amber-500 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
                      title={sealState === 'sealed' ? 'Cut Tape to Open' : 'Seal Box'}
                    >
                      {sealState === 'unsealed' || sealState === 'sealing' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                          <circle cx="12" cy="12" r="7" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M12 19h8" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                          <path d="M18.5 3.5l-15 15a2 2 0 0 0 2.8 2.8l15-15a2 2 0 0 0-2.8-2.8z" />
                          <path d="M13 10l-4 4" />
                          <path d="M9 14l-2 2" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Blueprint grid lines background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                  {/* 3D Box scene viewport */}
                  <div className="w-full h-full flex-1 flex items-center justify-center absolute inset-0" style={{ perspective: 2000 }}>
                    <RSCBoxPrototype
                      width={width}
                      depth={depth}
                      height={height}
                      foldProgress={foldProgress}
                      material={material}
                      baseStyle={(materialStyles as Record<string, any>)[material]}
                      renderArtwork={renderArtwork}
                      sealState={sealState}
                    />
                  </div>

                </div>

              </motion.div>
            </section>

            <PackagingCollections onCategorySelect={handleCategorySelect} showExploreButton={true} />

            <TopDielineTemplates onNavigate={(cat) => setCurrentView('library')} showExploreButton={true} />

            <AboutKelineTools />
          </>
        )}

      </div>

      {/* Elastic Footer FX - Portaled natively outside main wrapper */}
      {stepIndex >= 7 && <ElasticFooter />}
    </>
  );
}
