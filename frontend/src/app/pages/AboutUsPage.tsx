import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Sparkles, 
  Sliders, 
  Layers, 
  Printer, 
  ShieldCheck, 
  Cpu, 
  ChevronDown, 
  ArrowRight,
  Globe,
  Award,
  Zap,
  Users,
  MessageSquare
} from 'lucide-react';
import Header from '../components/layout/Header';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import ElasticFooter from '../components/layout/ElasticFooter';
import '../../styles/new-home.css';

interface AboutUsPageProps {
  onNavigate: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => void;
}

export default function AboutUsPage({ onNavigate }: AboutUsPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.zoom = '1';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.zoom = '';
      document.body.style.width = '';
    };
  }, []);

  const stats = [
    { label: "Dielines Generated", value: "50,000+", sub: "Print-ready structural vector files" },
    { label: "Active Brands & Agencies", value: "15,000+", sub: "Worldwide design professionals" },
    { label: "Box & Bottle Templates", value: "120+", sub: "Parametric customizable structures" },
    { label: "Factory Print Accuracy", value: "99.8%", sub: "Verified structural tolerances" },
  ];

  const features = [
    {
      icon: Cpu,
      title: "Real-Time 3D Assembly",
      desc: "Instant 3D folding animation allowing you to inspect box closures, dust flaps, and tuck tabs from every angle."
    },
    {
      icon: Sliders,
      title: "Parametric Dieline Generator",
      desc: "Customize Width, Depth, and Height in millimeters. Our geometry engine recalculates crease lines and glue flaps live."
    },
    {
      icon: Layers,
      title: "Realistic Material Shaders",
      desc: "Switch between kraft cardboard, matte virgin fiber, gloss, textured paper, metallic foil, and custom color finishes."
    },
    {
      icon: Printer,
      title: "Production PDF & SVG Export",
      desc: "Export vector dielines compatible with Illustrator, CAD, and laser cutting machines without resolution loss."
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Select Structure",
      desc: "Choose from Mailer boxes, Tuck end, Rigid boxes, Pouches, Cans or Bottles."
    },
    {
      step: "02",
      title: "Input Dimensions",
      desc: "Set exact Width, Depth, and Height dimensions in millimeters or inches."
    },
    {
      step: "03",
      title: "Apply Artwork & Finish",
      desc: "Upload logo graphics, test materials, and simulate fold sequences in real time."
    },
    {
      step: "04",
      title: "Export & Print",
      desc: "Download high-res 3D renders or print-ready PDF vector dieline blueprints."
    }
  ];

  const faqs = [
    {
      q: "What is Keyline Design / Keline Tools?",
      a: "Keyline Design is an all-in-one web platform for packaging designers, agencies, and manufacturers. It combines interactive 3D mockup rendering with accurate parametric vector dieline generation."
    },
    {
      q: "Are the exported dielines suitable for actual manufacturing?",
      a: "Yes! All dielines generated on Keyline Design follow strict structural standards with designated cut lines (solid red/blue) and crease/fold lines (dashed), ready for Adobe Illustrator, CAD, or die-cutting equipment."
    },
    {
      q: "Can I upload my own artwork and brand logos?",
      a: "Absolutely. Our Interactive Design Lab lets you upload brand graphics, apply decals, adjust material colors, and preview the artwork mapped directly onto the 3D box surfaces."
    },
    {
      q: "Do I need to install any software or plugins?",
      a: "No installation is required. Everything runs smoothly in your web browser with high-performance 3D rendering."
    }
  ];

  return (
    <div className="new-home-landing min-h-screen font-sans flex flex-col relative z-0 bg-white">
      <BackgroundCanvas position="fixed" zIndex={0} />

      {/* Header */}
      <Header activeNav="about" onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 text-center max-w-5xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/90 border border-amber-200 text-amber-900 text-xs font-bold mb-6 shadow-sm uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          About Keline Design Studio
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-zinc-900 mb-6 uppercase leading-tight"
        >
          Empowering Packaging<br />Designers Worldwide
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-2xl text-zinc-600 max-w-3xl mx-auto mb-10 font-normal leading-relaxed"
        >
          We are bridging the gap between structural engineering and high-end 3D visualization. Create, animate, and export production-ready packaging in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button 
            onClick={() => onNavigate('models')} 
            className="px-8 py-4 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            Explore 3D Library <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onNavigate('dielines')} 
            className="px-8 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-2xl transition-all border border-zinc-200 flex items-center gap-2"
          >
            View Vector Dielines
          </button>
        </motion.div>
      </section>

      {/* Stats Counter Section */}
      <section className="relative z-10 py-12 px-6 bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center p-4"
            >
              <div className="text-3xl md:text-5xl font-black text-amber-400 mb-2 tracking-tight">{item.value}</div>
              <div className="text-sm font-bold text-white uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-xs text-zinc-400">{item.sub}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Key Features Showcase Grid */}
      <section className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4">
            Built for Precision & Speed
          </h2>
          <p className="text-zinc-600 text-lg max-w-2xl mx-auto">
            Everything you need to conceptualize, pitch, and manufacture custom packaging without expensive physical prototyping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-8 md:p-10 border border-zinc-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-3">{feat.title}</h3>
                  <p className="text-zinc-600 text-base leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="relative z-10 py-20 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-extrabold tracking-widest uppercase text-amber-600">Workflow</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mt-2">How Keyline Studio Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <span className="text-5xl font-black text-zinc-200 absolute top-4 right-4 select-none">{step.step}</span>
                <div className="relative z-10">
                  <h4 className="text-xl font-bold text-zinc-900 mb-3">{step.title}</h4>
                  <p className="text-sm text-zinc-600 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-zinc-600 text-base">Have questions about our dielines or 3D mockups? We've got answers.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left font-bold text-lg text-zinc-900 flex justify-between items-center gap-4 hover:bg-zinc-50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-6 text-zinc-600 text-base leading-relaxed border-t border-zinc-100 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="relative z-10 py-16 px-6 max-w-5xl mx-auto mb-20 w-full">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-10 md:p-14 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Ready to Create Packaging Visuals?</h2>
          <p className="text-zinc-300 text-lg max-w-xl mx-auto mb-8 font-medium">Start designing photorealistic 3D mockups and exporting production dielines now.</p>
          <button 
            onClick={() => onNavigate('pricing')} 
            className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-2xl text-lg transition-all shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <ElasticFooter />
    </div>
  );
}
