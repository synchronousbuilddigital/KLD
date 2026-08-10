import React, { useRef } from 'react';
import { motion, useScroll, useTransform, cubicBezier } from 'motion/react';
import { Package } from 'lucide-react'; // Or a custom hexagon if preferred

interface ElasticFooterProps {
  variant?: 'light' | 'kraft';
  onNavigate?: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => void;
}

export default function ElasticFooter({ variant = 'kraft', onNavigate }: ElasticFooterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const ease = cubicBezier(0.22, 1, 0.36, 1);
  const contentY = useTransform(scrollYProgress, [0, 1], [40, 0], { ease });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1], { ease });

  const isLight = variant === 'light';

  const textColorMain = isLight ? 'text-zinc-900' : 'text-[#4A3824]';
  const textColorSub = isLight ? 'text-zinc-500' : 'text-[#755A3D]';
  const linkColor = isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-[#755A3D] hover:text-[#4A3824]';
  const socialBg = isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700' : 'bg-[#4A3824]/5 hover:bg-[#4A3824]/10 border-[#4A3824]/10 text-[#755A3D]';
  const borderDiv = isLight ? 'border-zinc-200' : 'border-[#4A3824]/15';

  return (
    <>
      <style>
        {`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');`}
      </style>
      
      {/* 1. Transparent Spacer */}
      <div 
        ref={containerRef} 
        className="w-full pointer-events-none"
        style={{ height: '500px' }}
      />

      {/* 2. Natively Fixed Footer */}
      <footer className="fixed bottom-0 left-0 w-full h-[500px] -z-10">
        <div 
          className={`absolute inset-0 w-full h-full ${
            isLight 
              ? 'bg-white border-t border-zinc-200' 
              : 'bg-gradient-to-br from-[#F5EBDD] via-[#E8D5B7] to-[#C89A63]'
          }`} 
        />
        
        {/* Animated Inner Content (Parallax + Fade) */}
        <motion.div 
          style={{ 
            y: contentY, 
            opacity,
            fontFamily: "'Satoshi', sans-serif"
          }}
          className="relative z-10 w-full h-full flex flex-col justify-between"
        >
          <div className="max-w-7xl mx-auto w-full px-8 pt-24 pb-8 flex-grow flex flex-col justify-between">
            
            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              
              {/* Left Column (Brand + Desc + Socials) */}
              <div className="md:col-span-5 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className={textColorMain}>
                    <Package size={32} strokeWidth={2.5} />
                  </div>
                  <span className={`${textColorMain} font-black tracking-widest text-2xl`}>KEYLINE DESIGN</span>
                </div>
                
                <p className={`${textColorSub} text-base leading-relaxed max-w-sm font-medium`}>
                  The ultimate web-based 3D packaging design studio. 
                  Reimagining structural prototyping, real-time materials, and dielines for modern designers.
                </p>

                {/* Social Icons */}
                <div className="flex items-center gap-3 mt-4">
                  {['f', 't', 'in', 'ig'].map(icon => (
                    <button 
                      key={icon} 
                      className={`w-10 h-10 rounded-full border transition-colors flex items-center justify-center ${socialBg}`}
                    >
                      <span className="text-sm font-bold">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Columns (Links) */}
              <div className="md:col-span-7 grid grid-cols-3 gap-8">
                
                {/* Product */}
                <div className="flex flex-col gap-5">
                  <h4 className={`${textColorMain} font-black tracking-widest text-sm uppercase`}>Product</h4>
                  <div className="flex flex-col gap-3">
                    <a href="/3d-models" onClick={(e) => { e.preventDefault(); onNavigate?.('models'); }} className={`${linkColor} font-medium transition-colors text-base`}>
                      3D Generator
                    </a>
                    <a href="/dielines" onClick={(e) => { e.preventDefault(); onNavigate?.('dielines'); }} className={`${linkColor} font-medium transition-colors text-base`}>
                      Dieline Library
                    </a>
                    <a href="/workspace" onClick={(e) => { e.preventDefault(); onNavigate?.('workspace'); }} className={`${linkColor} font-medium transition-colors text-base`}>
                      My Workspace
                    </a>
                    <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate?.('pricing'); }} className={`${linkColor} font-medium transition-colors text-base`}>
                      Pricing Plans
                    </a>
                  </div>
                </div>

                {/* Resources */}
                <div className="flex flex-col gap-5">
                  <h4 className={`${textColorMain} font-black tracking-widest text-sm uppercase`}>Resources</h4>
                  <div className="flex flex-col gap-3">
                    {['Help Center', 'Dieline Templates', 'Material Guide', 'API Docs'].map(link => (
                      <a key={link} href="#" className={`${linkColor} font-medium transition-colors text-base`}>
                        {link}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Company */}
                <div className="flex flex-col gap-5">
                  <h4 className={`${textColorMain} font-black tracking-widest text-sm uppercase`}>Company</h4>
                  <div className="flex flex-col gap-3">
                    <a href="/about-us" onClick={(e) => { e.preventDefault(); onNavigate?.('about'); }} className={`${linkColor} font-medium transition-colors text-base`}>
                      About Us
                    </a>
                    {['Careers', 'Privacy Policy', 'Terms of Service'].map(link => (
                      <a key={link} href="#" className={`${linkColor} font-medium transition-colors text-base`}>
                        {link}
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Section */}
            <div className={`border-t ${borderDiv} mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4`}>
              <p className={`${textColorSub} font-medium text-base`}>
                &copy; 2026 Keyline Design. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                {['Status', 'Security', 'Contact'].map(link => (
                  <a key={link} href="#" className={`${linkColor} font-medium transition-colors text-base`}>
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
