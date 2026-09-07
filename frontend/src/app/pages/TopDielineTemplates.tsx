import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import './TopDielineTemplates.css';

const slideUpVariant = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true, margin: "-50px" }
};

const categories = [
  {
    id: 'folding',
    title: <>Folding Box<br />Templates</>,
    icon: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="32" y="26" width="36" height="48" fill="currentColor" fillOpacity="0.03" />
        <path d="M32,26 h36 M32,42 h36 M32,58 h36 M32,74 h36" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M32,26 v48 M68,26 v48" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M32,26 h-7 v48 h7" />
        <path d="M68,26 h7 v48 h-7" />
        <path d="M32,26 v-12 c0,-2 2,-4 4,-4 h28 c2,0 4,2 4,4 v12" />
        <path d="M32,74 v12 c0,2 2,4 4,4 h28 c2,0 4,-2 4,-4 v-12" />
        <path d="M25,26 l-4,6 v36 l4,6" />
        <path d="M75,26 l4,6 v36 l-4,6" />
      </svg>
    )
  },
  {
    id: 'tuck_end',
    title: <>Tuck End Box<br />Templates</>,
    icon: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="22" y="24" width="56" height="52" fill="currentColor" fillOpacity="0.03" />
        <path d="M22,24 v52 M36,24 v52 M58,24 v52 M72,24 v52" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M22,24 h56 M22,76 h56" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M22,28 h-6 v44 h6" />
        <path d="M36,24 v-10 c0,-2 2,-3 3,-3 h16 c1,0 3,1 3,3 v10" />
        <path d="M22,24 v-7 h14 v7 M58,24 v-7 h14 v7" />
        <path d="M58,76 v10 c0,2 -2,3 -3,3 h-16 c-1,0 -3,-1 -3,-3 v-10" />
        <path d="M22,76 v7 h14 v-7 M58,76 v7 h14 v-7" />
        <path d="M78,24 v52" />
      </svg>
    )
  },
  {
    id: 'paper_bag',
    title: <>Paper Bag<br />Templates</>,
    icon: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="14" y="20" width="72" height="60" fill="currentColor" fillOpacity="0.03" />
        <path d="M14,20 v60 M32,20 v60 M50,20 v60 M68,20 v60 M86,20 v60" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M14,28 h72 M14,68 h72 M14,76 h72" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M32,68 l9,8 M50,68 l-9,8 M68,68 l9,8 M86,68 l-9,8" strokeDasharray="2 2" opacity="0.65" />
        <rect x="14" y="20" width="72" height="60" />
        <path d="M86,28 h6 v40 h-6" />
        <circle cx="23" cy="24" r="1.8" fill="currentColor" opacity="0.6" />
        <circle cx="41" cy="24" r="1.8" fill="currentColor" opacity="0.6" />
        <circle cx="59" cy="24" r="1.8" fill="currentColor" opacity="0.6" />
        <circle cx="77" cy="24" r="1.8" fill="currentColor" opacity="0.6" />
      </svg>
    )
  },
  {
    id: 'box_lid',
    title: <>Box with Lid<br />Templates</>,
    icon: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        {/* Base dieline */}
        <g transform="translate(12, 12)">
          <rect x="12" y="12" width="30" height="30" fill="currentColor" fillOpacity="0.03" />
          <rect x="12" y="12" width="30" height="30" strokeDasharray="2.5 2" opacity="0.65" />
          <path d="M12,12 v-10 h30 v10 h10 v30 h-10 v10 h-30 v-10 h-10 v-30 h10 z" />
          <path d="M12,2 h-4 v10 M42,2 h4 v10 M12,52 h-4 v-10 M42,52 h4 v-10" strokeDasharray="1.5 1.5" opacity="0.5" />
        </g>
        {/* Lid dieline (offset miniature companion) */}
        <g transform="translate(48, 48)">
          <rect x="8" y="8" width="24" height="24" fill="currentColor" fillOpacity="0.04" />
          <rect x="8" y="8" width="24" height="24" strokeDasharray="2 2" opacity="0.65" />
          <path d="M8,8 v-7 h24 v7 h7 v24 h-7 v7 h-24 v-7 h-7 v-24 h7 z" />
        </g>
      </svg>
    )
  },
  {
    id: 'display_box',
    title: <>Display Box<br />Templates</>,
    icon: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="26" y="28" width="48" height="46" fill="currentColor" fillOpacity="0.03" />
        <path d="M26,28 h48 M26,50 h48 M26,74 h48" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M26,28 v46 M74,28 v46" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M26,28 v-15 c0,-2 3,-4 6,-4 h36 c3,0 6,2 6,4 v15" />
        <path d="M38,14 c6,5 18,5 24,0" strokeDasharray="2 2" opacity="0.75" />
        <path d="M26,28 h-12 l-4,22 h16 M74,28 h12 l4,22 h-16" />
        <path d="M26,74 v10 h48 v-10" />
        <rect x="26" y="28" width="48" height="46" />
      </svg>
    )
  },
  {
    id: 'tray_box',
    title: <>Tray Box<br />Templates</>,
    icon: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="26" y="26" width="48" height="48" fill="currentColor" fillOpacity="0.03" />
        <rect x="26" y="26" width="48" height="48" strokeDasharray="2.5 2" opacity="0.65" />
        <rect x="16" y="16" width="68" height="68" strokeDasharray="2.5 2" opacity="0.4" />
        <path d="M8,16 h84 v68 h-84 z" />
        <path d="M26,16 v-8 M74,16 v-8 M26,84 v8 M74,84 v8" />
        <path d="M16,26 h-8 M16,74 h-8 M84,26 h8 M84,74 h8" />
      </svg>
    )
  },
  {
    id: 'rigid_box',
    title: <>Rigid Box<br />Templates</>,
    icon: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        {/* Rigid Box Lid Tray & Wrap */}
        <g transform="translate(18, 10)">
          <rect x="14" y="9" width="36" height="22" fill="currentColor" fillOpacity="0.03" />
          <rect x="14" y="9" width="36" height="22" strokeDasharray="2.5 2" opacity="0.65" />
          <path d="M14,9 v-7 l3,-2 h30 l3,2 v7 h7 l2,3 v16 l-2,3 h-7 v7 l-3,2 h-30 l-3,-2 v-7 h-7 l-2,-3 v-16 l2,-3 z" />
          <path d="M14,2 h-4 v7 M50,2 h4 v7 M14,31 h-4 v-7 M50,31 h4 v-7" strokeDasharray="1.5 1.5" opacity="0.5" />
        </g>
        {/* Rigid Box Base Tray & Wrap */}
        <g transform="translate(18, 52)">
          <rect x="14" y="9" width="36" height="22" fill="currentColor" fillOpacity="0.03" />
          <rect x="14" y="9" width="36" height="22" strokeDasharray="2.5 2" opacity="0.65" />
          <path d="M14,9 v-7 l3,-2 h30 l3,2 v7 h7 l2,3 v16 l-2,3 h-7 v7 l-3,2 h-30 l-3,-2 v-7 h-7 l-2,-3 v-16 l2,-3 z" />
          <path d="M14,2 h-4 v7 M50,2 h4 v7 M14,31 h-4 v-7 M50,31 h4 v-7" strokeDasharray="1.5 1.5" opacity="0.5" />
        </g>
      </svg>
    )
  },
  {
    id: 'envelope',
    title: <>Envelope<br />Templates</>,
    icon: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="20" y="30" width="60" height="40" fill="currentColor" fillOpacity="0.03" />
        <rect x="20" y="30" width="60" height="40" strokeDasharray="2.5 2" opacity="0.65" />
        <path d="M20,30 l30,-18 l30,18" />
        <path d="M20,70 l30,18 l30,-18" />
        <path d="M20,30 l-14,20 l14,20" />
        <path d="M80,30 l14,20 l-14,20" />
        <circle cx="50" cy="50" r="2.2" fill="currentColor" opacity="0.6" />
        <path d="M46,60 c0,2 8,2 8,0" />
      </svg>
    )
  }
];

const clientLogos = [
  { name: 'IBM', className: 'client-logo-ibm' },
  { name: 'NETFLIX', className: 'client-logo-netflix' },
  { name: 'amazon', className: 'client-logo-amazon' },
  { name: 'Google', className: 'client-logo-google' },
  { name: 'Canva', className: 'client-logo-canva' },
  { name: 'Apple', className: 'client-logo-apple' },
  { name: 'TESLA', className: 'client-logo-tesla' },
  { name: 'STARBUCKS', className: 'client-logo-starbucks' },
  { name: 'HUAWEI', className: 'client-logo-huawei' }
];

export default function TopDielineTemplates({ onNavigate }: { onNavigate?: (category: string) => void }) {

  return (
    <section id="top-dielines" className="py-24 overflow-hidden font-sans relative">
      <div className="max-w-[1300px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-12"
        >
          <ArrowRight className="w-8 h-8 text-zinc-900" />
          <h2 className="text-[32px] md:text-[40px] font-semibold tracking-tight text-zinc-900">
            Top dieline template categories
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-50px" }}
        >
          {categories.map((cat, i) => (
            <motion.a
              href="#"
              key={i}
              variants={slideUpVariant}
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'library' }));
              }}
              className="dieline-card"
            >
              <div className="dieline-card-content">
                <h3 className="dieline-card-title">
                  {cat.title}
                </h3>
                <div className="dieline-card-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                </div>
              </div>
              <div className="dieline-card-icon">
                {cat.icon}
              </div>
            </motion.a>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex"
        >
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'library' }))}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[12px] text-[15px] font-semibold transition-all hover:scale-105 duration-200 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10 cursor-pointer"
          >
            <span>View 3000+ dieline templates</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.div
          className="client-logo-strip"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, delay: 0.2 }}
          aria-label="Trusted by leading brands"
        >
          <div className="client-logo-track">
            {[...clientLogos, ...clientLogos].map((logo, index) => (
              <span className={`client-logo ${logo.className}`} key={`${logo.name}-${index}`} aria-hidden={index >= clientLogos.length}>
                {logo.name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
