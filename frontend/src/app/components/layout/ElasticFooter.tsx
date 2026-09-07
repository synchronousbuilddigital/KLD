import React from 'react';
import { motion } from 'motion/react';
import { Package } from 'lucide-react';
import KraftBoxAnimation from './KraftBoxAnimation';

export default function ElasticFooter() {
  return (
    <>
      <style>
        {`
          @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
          
          .footer-grid-bg {
            background-color: #FAF9F6;
            background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.2px, transparent 1.2px);
            background-size: 32px 32px;
          }
        `}
      </style>
      
      <footer className="w-full relative z-20 footer-grid-bg border-t border-zinc-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(200, 154, 99, 0.06) 0%, transparent 65%)'
          }}
        />
        
        {/* Animated Inner Content */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'Satoshi', sans-serif" }}
          className="relative z-10 w-full"
        >
          <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 pt-16 pb-12 flex flex-col justify-between">
            
            {/* Top Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* Left Column: Pure Animated 3D Kraft Box Folding & Packing Scene */}
              <div className="md:col-span-4 flex items-center justify-center md:justify-start">
                <KraftBoxAnimation />
              </div>

              {/* Center Column (Brand + Desc + Status + Socials) */}
              <div className="md:col-span-4 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
                    <Package size={22} strokeWidth={2.2} />
                  </div>
                  <span className="text-zinc-900 font-extrabold tracking-wider text-2xl">
                    KEYLINE DESIGN
                  </span>
                </div>
                
                <p className="text-zinc-500 text-sm leading-relaxed font-normal">
                  The ultimate web-based 3D packaging design studio. 
                  Reimagining structural CAD prototyping, real-time materials, and dielines for modern designers.
                </p>

                {/* System Status Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 text-xs font-medium text-emerald-800 w-fit shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>CAD Engine Operational • v2.4</span>
                </div>

                {/* Social Icons */}
                <div className="flex items-center gap-2.5 mt-1">
                  {[
                    {
                      name: 'X (Twitter)',
                      icon: (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      )
                    },
                    {
                      name: 'GitHub',
                      icon: (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      )
                    },
                    {
                      name: 'LinkedIn',
                      icon: (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.97 0 1.75-.79 1.75-1.76s-.78-1.75-1.75-1.75a1.75 1.75 0 0 0 0 3.51m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                        </svg>
                      )
                    },
                    {
                      name: 'Instagram',
                      icon: (
                        <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      )
                    }
                  ].map(item => (
                    <a 
                      key={item.name} 
                      href="#" 
                      title={item.name}
                      aria-label={item.name}
                      className="w-9 h-9 rounded-lg bg-white hover:bg-zinc-900 border border-zinc-200/90 hover:border-zinc-900 transition-all duration-200 flex items-center justify-center text-zinc-600 hover:text-white shadow-xs hover:-translate-y-0.5"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Right Columns (Links) */}
              <div className="md:col-span-4 grid grid-cols-3 gap-4 lg:gap-6">
                
                {/* Product */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-zinc-900 font-bold tracking-wider text-xs uppercase">Product</h4>
                  <div className="flex flex-col gap-2.5">
                    {['3D Generator', 'Dieline Library', 'Folding Studio', 'Material Engine', 'Print Optimizer'].map(link => (
                      <a 
                        key={link} 
                        href="#" 
                        onClick={(e) => {
                          if (link === 'Dieline Library') {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent('navigate', { detail: 'library' }));
                          }
                        }}
                        className="text-zinc-500 hover:text-zinc-900 font-normal transition-colors text-sm flex items-center gap-1 group cursor-pointer"
                      >
                        <span>{link}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-zinc-900 font-bold tracking-wider text-xs uppercase">Resources</h4>
                  <div className="flex flex-col gap-2.5">
                    {['Help Center', 'Dieline Templates', 'CAD Guidelines', 'Material Specs', 'API Documentation'].map(link => (
                      <a 
                        key={link} 
                        href="#" 
                        onClick={(e) => {
                          if (link === 'Dieline Templates') {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent('navigate', { detail: 'library' }));
                          }
                        }}
                        className="text-zinc-500 hover:text-zinc-900 font-normal transition-colors text-sm flex items-center gap-1 group cursor-pointer"
                      >
                        <span>{link}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Company */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-zinc-900 font-bold tracking-wider text-xs uppercase">Company</h4>
                  <div className="flex flex-col gap-2.5">
                    {['About Us', 'Pricing Plans', 'Careers', 'Privacy Policy', 'Terms of Service'].map(link => (
                      <a key={link} href="#" className="text-zinc-500 hover:text-zinc-900 font-normal transition-colors text-sm flex items-center gap-1 group">
                        <span>{link}</span>
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            </div>
                

                


            {/* Bottom Section */}
            <div className="border-t border-zinc-200/80 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-zinc-400 font-normal text-xs">
                &copy; {new Date().getFullYear()} Keyline Design Inc. All rights reserved. Precision Packaging CAD & Prototyping.
              </p>
              <div className="flex items-center gap-6">
                {['Security', 'Status', 'Contact Support', 'Cookie Settings'].map(link => (
                  <a key={link} href="#" className="text-zinc-400 hover:text-zinc-700 font-normal transition-colors text-xs">
                    {link}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </footer>
    </>
  );
}
