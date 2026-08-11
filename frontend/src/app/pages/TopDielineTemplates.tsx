import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Grid } from 'lucide-react';
import './TopDielineTemplates.css';

const slideUpVariant = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true, margin: "-50px" }
};

const categories = [
  {
    id: 'folding',
    title: 'Folding Box Templates',
    icon: (
      <img src="/images/dielines/folding.svg" alt="Folding Box Dieline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    id: 'tuck_end',
    title: 'Tuck End Box Templates',
    icon: (
      <img src="/images/dielines/tuck_end.svg" alt="Tuck End Box Dieline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    id: 'paper_bag',
    title: 'Paper Bag Templates',
    icon: (
      <img src="/images/dielines/paper_bag.svg" alt="Paper Bag Dieline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    id: 'box_lid',
    title: 'Box with Lid Templates',
    icon: (
      <img src="/images/dielines/box_lid.svg" alt="Box with Lid Dieline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    id: 'display_box',
    title: 'Display Box Templates',
    icon: (
      <img src="/images/dielines/display_box.svg" alt="Display Box Dieline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    id: 'tray_box',
    title: 'Tray Box Templates',
    icon: (
      <img src="/images/dielines/tray_box.svg" alt="Tray Box Dieline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    id: 'rigid_box',
    title: 'Rigid Box Templates',
    icon: (
      <img src="/images/dielines/rigid_box.svg" alt="Rigid Box Dieline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    id: 'envelope',
    title: 'Envelope Templates',
    icon: (
      <img src="/images/dielines/envelope.svg" alt="Envelope Dieline" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  }
];

export default function TopDielineTemplates({ onNavigate }: { onNavigate?: (category: string) => void }) {
  return (
    <section id="top-dielines" className="py-12 overflow-hidden font-sans bg-white">
      <div className="max-w-[1700px] mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight text-zinc-900">
              Top Dieline Template Categories
            </h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Explore production-ready dieline CAD blueprints by category
            </p>
          </div>
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
                if (onNavigate) {
                  onNavigate(cat.id);
                }
              }}
              className="dieline-card group"
            >
              <div className="dieline-card-header">
                <h3 className="dieline-card-title">
                  {cat.title}
                </h3>
                <div className="dieline-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
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
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex"
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('all');
            }}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all hover:bg-zinc-800 hover:shadow-lg duration-200 bg-zinc-900 text-white"
          >
            View All Dieline Templates <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
