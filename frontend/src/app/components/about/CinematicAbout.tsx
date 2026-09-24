import React, { useRef, useState } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  masterStraightPath,
  masterTotalLength,
  lenD1Start,
  lenD1End,
  lenD2Start,
  lenD2End,
} from "./MasterStraightPath";
import { GLBModel } from "./GLBModel";
import { GiftBoxGLB } from "./GiftBoxGLB";
import type { GiftBoxGLBHandle } from "./GiftBoxGLB";

gsap.registerPlugin(ScrollTrigger);

export default function CinematicAbout({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  const handleStartJourney = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || !!localStorage.getItem('token');
    if (isLoggedIn) {
      if (onNavigate) onNavigate('dielines');
      else window.location.href = '/?view=dielines';
    } else {
      window.dispatchEvent(new CustomEvent('open-sign-in-modal'));
    }
  };

  const container = useRef<HTMLDivElement>(null);
  const scrollWrapper = useRef<HTMLDivElement>(null);
  const giftBoxRef = useRef<GiftBoxGLBHandle>(null);
  const lidProgress = useRef({ value: 0 });
  const zoomProgress = useRef({ value: 0 });

  // Exact continuous stroke window: head (arrow position) and tail (unrolling start)
  const strokeState = useRef({
    head: 0,
    tail: 0,
  });

  useGSAP(
    () => {
      const arrowEl = container.current?.querySelector<HTMLElement>(".master-arrow-el");
      const pathEl = container.current?.querySelector<SVGPathElement>(".master-straight-stroke");

      if (arrowEl) arrowEl.style.offsetPath = `path('${masterStraightPath}')`;

      const updateStroke = () => {
        const h = strokeState.current.head;
        const t = strokeState.current.tail;
        const len = Math.max(0, h - t);

        if (pathEl) {
          pathEl.style.strokeDasharray = `${len} 20000`;
          pathEl.style.strokeDashoffset = `${-t}`;
        }
        if (arrowEl) {
          const pct = (h / masterTotalLength) * 100;
          arrowEl.style.offsetDistance = `${Math.min(100, Math.max(0, pct))}%`;
        }
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollWrapper.current,
          start: "top top",
          end: "+=9000",
          scrub: 1,
          pin: true,
        },
      });

      // ════════════════ SCENE 1: Plain Box Hero ════════════════
      tl.to(".scene-1-wrapper", {
        y: -1000,
        opacity: 0,
        duration: 1.5,
        ease: "power2.in",
      });

      // ════════════════ SCENE 2: 3-Phase Line Transfer ════════════════
      tl.to(".scene-2-wrapper", { opacity: 1, duration: 0.2 });

      // ── PHASE A: Lead-in — arrow enters from left, line draws behind it ──
      // head: 0 → D1Start(380), tail stays at 0 → visible = growing entry line
      tl.fromTo(".master-arrow-el", { opacity: 0 }, { opacity: 1, duration: 0.1 }, "entry");
      tl.to(
        strokeState.current,
        { head: lenD1Start, tail: 0, duration: 1.2, ease: "none", onUpdate: updateStroke },
        "entry"
      );
      // NO separate tail retraction here — that was causing visible length to collapse to 0!

      // ── PHASE A1: Equal-speed entry retract — tail and head move at SAME rate ──
      // head: D1Start(380) → 760    at 253px/s  [first 380px of D1 draws]
      // tail: 0            → D1Start(380) at 253px/s  [entry line retracts at same rate]
      // Visible stays CONSTANT at 380px — entry line vanishes cleanly in 1.5s ✓
      const ENTRY_LEN = lenD1Start; // 380px — length of entry line to retract
      tl.to(
        strokeState.current,
        {
          head: lenD1Start + ENTRY_LEN, // 760
          tail: lenD1Start,              // 380
          duration: 1.5,
          ease: "none",
          onUpdate: updateStroke,
        },
        "drawD1"
      );

      // ── PHASE A2: Tail locked at D1Start, head draws the rest of D1 ──
      // head: 760 → D1End(2528)   [remaining 1768px of D1 draws, visible grows 380→2148px]
      // tail: stays at D1Start(380) — entry line is already GONE, only clean D1 visible
      tl.to(
        strokeState.current,
        { head: lenD1End, tail: lenD1Start, duration: 4.0, ease: "none", onUpdate: updateStroke },
        "finishD1"
      );
      tl.fromTo(".s2-text-1-tag",   { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6 }, "finishD1+=0.3");
      tl.fromTo(".s2-text-1-title", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, "finishD1+=0.7");
      tl.fromTo(".s2-text-1-sub",   { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, "finishD1+=1.2");
      tl.fromTo(".s2-text-1-items > *", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.25 }, "finishD1+=1.7");
      tl.to({}, { duration: 1.2 }, "holdD1");

      // ── PHASE B: Bridge crossing & Line Transfer ──
      // head: D1End(2528) -> D2Start+OVERLAP(3328)  [arrow crosses bridge and enters D2]
      // tail: D1Start(380) -> D2Start(2928)          [D1 and bridge cleanly unroll into D2]
      // By the time arrow enters D2, tail reaches D2Start (2928) -> zero leftover line!
      const OVERLAP = 400;
      tl.to(
        strokeState.current,
        {
          head: lenD2Start + OVERLAP,
          tail: lenD2Start,
          duration: 3.5,
          ease: "none",
          onUpdate: updateStroke,
        },
        "crossBridge"
      );
      tl.to(".s2-text-1-wrapper", { opacity: 0, x: 50, duration: 1.0, ease: "power2.inOut" }, "crossBridge");
      tl.fromTo(
        ".s2-text-2-wrapper",
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 1.0, ease: "power3.out" },
        "crossBridge+=1.8"
      );

      // ── PHASE C: Draw Dieline 2 Cleanly — Tail LOCKED at D2Start ──
      // head: 3328 -> D2End(6095)   [D2 draws to 100% completion]
      // tail: stays locked at D2Start(2928) -> NO leftover line to the left at ANY point!
      tl.to(
        strokeState.current,
        {
          head: lenD2End,
          tail: lenD2Start,
          duration: 5.5,
          ease: "none",
          onUpdate: updateStroke,
        },
        "drawD2"
      );
      tl.fromTo(".s2-text-2-tag",   { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6 }, "drawD2+=0.4");
      tl.fromTo(".s2-text-2-title", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, "drawD2+=0.8");
      tl.fromTo(".s2-text-2-sub",   { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, "drawD2+=1.3");
      tl.fromTo(".s2-text-2-items > *", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.25 }, "drawD2+=1.8");
      tl.to({}, { duration: 1.5 }, "holdD2");


      // ── PHASE EXIT: Arrow carries D2 line offscreen right ──
      tl.to(
        strokeState.current,
        { head: masterTotalLength, tail: masterTotalLength, duration: 3.0, ease: "none", onUpdate: updateStroke },
        "exitRight"
      );
      tl.to(".master-arrow-el", { opacity: 0, duration: 0.3 }, "exitRight+=2.7");

      // Hold briefly then exit Scene 2
      tl.to(".scene-2-wrapper", { y: -800, opacity: 0, duration: 1.5, ease: "expo.inOut" });

      // ════════════════ SCENE 3: Bottle Centre ════════════════
      tl.fromTo(".scene-3-wrapper", { y: 1000, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: "expo.out" })
        .fromTo(".scene-3-left", { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out" }, "<0.3")
        .fromTo(".scene-3-right", { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out" }, "<0.2")
        .fromTo(".scene-3-label", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "<0.3")
        .to(".scene-3-wrapper", { y: -1000, opacity: 0, duration: 1.5, ease: "expo.in" });

      // ════════════════ SCENE 4: Gift Box Plunge ════════════════
      tl.fromTo(".scene-4-wrapper", { y: 1000, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: "expo.out" })
        .fromTo(".scene-4-left", { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out" }, "<0.3")
        .fromTo(".scene-4-right", { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out" }, "<0.2")
        .to(lidProgress.current, {
          value: 1,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: () => giftBoxRef.current?.setLidOpen(lidProgress.current.value),
        })
        .to(zoomProgress.current, {
          value: 1,
          duration: 2.5,
          ease: "power3.inOut",
          onUpdate: () => giftBoxRef.current?.setCameraZoom(zoomProgress.current.value),
        })
        .to([".scene-4-left", ".scene-4-right"], { opacity: 0, duration: 0.8 }, "<")
        .to(".scene-4-cta-overlay", { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.4)" });

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    },
    { scope: container }
  );

  return (
    <div ref={container} className="relative w-full bg-transparent text-[#09090b] font-sans antialiased selection:bg-[#B8956A]/20 selection:text-[#09090b]">
      <div ref={scrollWrapper} className="relative w-full h-screen overflow-hidden z-10">

        {/* ── SCENE 1: Plain Box Hero ─────────────────────────────────── */}
        <div className="scene-1-wrapper absolute inset-0 flex items-center justify-center px-4 sm:px-8 md:px-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 max-w-6xl w-full text-center md:text-left">
            <div className="w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] md:w-[450px] md:h-[450px] flex-shrink-0">
              <GLBModel src="/box.glb" className="w-full h-full" autoRotateSpeed={2} cameraDistance={3.2} />
            </div>
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B8956A]/10 border border-[#B8956A]/30 text-[#9A7446] text-xs font-bold mb-4 sm:mb-6 uppercase tracking-widest">
                ✦ About Keyline Design Studio
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6 uppercase leading-tight text-[#09090b]">
                Empowering Packaging<br className="hidden sm:inline" /> Designers Worldwide
              </h1>
              <p className="text-[#64748b] text-sm sm:text-base md:text-lg leading-relaxed">
                We bridge the gap between structural engineering and high-end 3D visualization. Create, animate, and export production-ready packaging in minutes.
              </p>
            </div>
          </div>
        </div>

        {/* ── SCENE 2: Single Continuous Straight Master Dieline Flow ─────────────────── */}
        <div className="scene-2-wrapper absolute inset-0 opacity-0 overflow-hidden pointer-events-none">

          {/* Master Full-Screen SVG: 1 Single Path, 1 Single Arrow, Zero Disconnections */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible" }}
          >
            <defs>
              <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#B8956A" floodOpacity="0.6" />
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* The Single Continuous Master Stroke in Brand Gold */}
            <path
              className="master-straight-stroke"
              stroke="#B8956A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`0 20000`}
              strokeDashoffset="0"
              d={masterStraightPath}
              style={{ filter: "url(#gold-glow)" }}
            />

            {/* The Single Traveling Arrow */}
            <polygon
              className="master-arrow-el"
              points="-18,-11 -18,11 18,0"
              fill="#B8956A"
              style={{
                offsetPath: `path('${masterStraightPath}')`,
                offsetDistance: "0%",
                offsetRotate: "auto",
                opacity: 0,
                filter: "drop-shadow(0 0 6px rgba(184, 149, 106, 0.7))",
              } as React.CSSProperties}
            />
          </svg>

          {/* Text Overlay 1: On the RIGHT side during Dieline 1 (Workflow) */}
          <div className="s2-text-1-wrapper absolute top-0 bottom-0 right-0 w-1/2 flex items-center justify-start pl-10 lg:pl-16 pr-8 pointer-events-auto">
            <div className="max-w-lg space-y-4">
              <span className="s2-text-1-tag opacity-0 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#B8956A]/10 border border-[#B8956A]/30 text-[#9A7446] text-xs font-bold uppercase tracking-widest">
                ✦ Workflow
              </span>
              <h2 className="s2-text-1-title opacity-0 text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase text-[#09090b]">
                How Keyline<br />Studio Works
              </h2>
              <p className="s2-text-1-sub opacity-0 text-[#64748b] text-sm md:text-base leading-relaxed">
                Streamlined structural packaging workflow from concept to manufacturing.
              </p>
              <div className="s2-text-1-items grid grid-cols-1 gap-3 text-xs md:text-sm">
                <div className="opacity-0 bg-white/90 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-3.5 backdrop-blur-md hover:border-[#B8956A]/50 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#09090b] text-sm">Select Structure</span>
                    <span className="text-[#B8956A] font-mono font-black text-xs">01</span>
                  </div>
                  <p className="text-[#64748b] text-xs leading-relaxed">Choose from Mailer boxes, Tuck end, Rigid boxes, Pouches, Cans or Bottles.</p>
                </div>
                <div className="opacity-0 bg-white/90 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-3.5 backdrop-blur-md hover:border-[#B8956A]/50 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#09090b] text-sm">Input Dimensions</span>
                    <span className="text-[#B8956A] font-mono font-black text-xs">02</span>
                  </div>
                  <p className="text-[#64748b] text-xs leading-relaxed">Set exact Width, Depth, and Height dimensions in millimeters or inches.</p>
                </div>
                <div className="opacity-0 bg-white/90 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-3.5 backdrop-blur-md hover:border-[#B8956A]/50 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#09090b] text-sm">Apply Artwork &amp; Finish</span>
                    <span className="text-[#B8956A] font-mono font-black text-xs">03</span>
                  </div>
                  <p className="text-[#64748b] text-xs leading-relaxed">Upload logo graphics, test materials, and simulate fold sequences in real time.</p>
                </div>
                <div className="opacity-0 bg-white/90 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-3.5 backdrop-blur-md hover:border-[#B8956A]/50 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#09090b] text-sm">Export &amp; Print</span>
                    <span className="text-[#B8956A] font-mono font-black text-xs">04</span>
                  </div>
                  <p className="text-[#64748b] text-xs leading-relaxed">Download high-res 3D renders or print-ready PDF vector dieline blueprints.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Overlay 2: On the LEFT side during Dieline 2 (FAQ) */}
          <div className="s2-text-2-wrapper absolute top-0 bottom-0 left-0 w-1/2 flex items-center justify-end pr-8 lg:pr-14 pl-6 opacity-0 pointer-events-auto z-20">
            <div className="max-w-lg space-y-3.5 text-right w-full">
              <span className="s2-text-2-tag opacity-0 inline-flex items-center justify-end gap-2 px-3.5 py-1 rounded-full bg-[#B8956A]/10 border border-[#B8956A]/30 text-[#9A7446] text-xs font-bold uppercase tracking-widest">
                ✦ FAQ
              </span>
              <h2 className="s2-text-2-title opacity-0 text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase text-[#09090b]">
                Frequently Asked<br />Questions
              </h2>
              <p className="s2-text-2-sub opacity-0 text-[#64748b] text-xs md:text-sm leading-relaxed">
                Have questions about our dielines or 3D mockups? We&apos;ve got answers.
              </p>
              <div className="s2-text-2-items grid grid-cols-1 gap-2 text-xs md:text-sm text-left">
                {/* FAQ 1 */}
                <div
                  onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
                  className={`opacity-0 rounded-2xl p-3.5 backdrop-blur-md transition-all cursor-pointer border ${
                    openFaq === 0
                      ? "bg-white border-[#B8956A] shadow-[0_8px_25px_rgba(184,149,106,0.18)]"
                      : "bg-white/80 border-slate-200/90 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#09090b] text-xs md:text-sm">
                    <span>What is Keyline Design / Keline Tools?</span>
                    <span className="text-[#B8956A] text-xs transition-transform duration-200 font-bold">
                      {openFaq === 0 ? "▲" : "▼"}
                    </span>
                  </div>
                  {openFaq === 0 && (
                    <p className="text-[#52525b] text-xs leading-relaxed mt-2 pt-2 border-t border-slate-100">
                      Keyline Design is an all-in-one web platform for packaging designers, agencies, and manufacturers. It combines interactive 3D mockup rendering with accurate parametric vector dieline generation.
                    </p>
                  )}
                </div>

                {/* FAQ 2 */}
                <div
                  onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                  className={`opacity-0 rounded-2xl p-3.5 backdrop-blur-md transition-all cursor-pointer border ${
                    openFaq === 1
                      ? "bg-white border-[#B8956A] shadow-[0_8px_25px_rgba(184,149,106,0.18)]"
                      : "bg-white/80 border-slate-200/90 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#09090b] text-xs md:text-sm">
                    <span>Are the exported dielines suitable for actual manufacturing?</span>
                    <span className="text-[#B8956A] text-xs transition-transform duration-200 font-bold">
                      {openFaq === 1 ? "▲" : "▼"}
                    </span>
                  </div>
                  {openFaq === 1 && (
                    <p className="text-[#52525b] text-xs leading-relaxed mt-2 pt-2 border-t border-slate-100">
                      Yes! All dielines generated on Keyline Design follow strict structural standards with designated cut lines (solid red/blue) and crease/fold lines (dashed), ready for Adobe Illustrator, CAD, or die-cutting equipment.
                    </p>
                  )}
                </div>

                {/* FAQ 3 */}
                <div
                  onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                  className={`opacity-0 rounded-2xl p-3.5 backdrop-blur-md transition-all cursor-pointer border ${
                    openFaq === 2
                      ? "bg-white border-[#B8956A] shadow-[0_8px_25px_rgba(184,149,106,0.18)]"
                      : "bg-white/80 border-slate-200/90 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#09090b] text-xs md:text-sm">
                    <span>Can I upload my own artwork and brand logos?</span>
                    <span className="text-[#B8956A] text-xs transition-transform duration-200 font-bold">
                      {openFaq === 2 ? "▲" : "▼"}
                    </span>
                  </div>
                  {openFaq === 2 && (
                    <p className="text-[#52525b] text-xs leading-relaxed mt-2 pt-2 border-t border-slate-100">
                      Absolutely. Our Interactive Design Lab lets you upload brand graphics, apply decals, adjust material colors, and preview the artwork mapped directly onto the 3D box surfaces.
                    </p>
                  )}
                </div>

                {/* FAQ 4 */}
                <div
                  onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
                  className={`opacity-0 rounded-2xl p-3.5 backdrop-blur-md transition-all cursor-pointer border ${
                    openFaq === 3
                      ? "bg-white border-[#B8956A] shadow-[0_8px_25px_rgba(184,149,106,0.18)]"
                      : "bg-white/80 border-slate-200/90 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#09090b] text-xs md:text-sm">
                    <span>Do I need to install any software or plugins?</span>
                    <span className="text-[#B8956A] text-xs transition-transform duration-200 font-bold">
                      {openFaq === 3 ? "▲" : "▼"}
                    </span>
                  </div>
                  {openFaq === 3 && (
                    <p className="text-[#52525b] text-xs leading-relaxed mt-2 pt-2 border-t border-slate-100">
                      No installation is required. Everything runs smoothly in your web browser with high-performance 3D rendering.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── SCENE 3: Versatility Bottle ─────────────────────────────────── */}
        <div className="scene-3-wrapper absolute inset-0 flex items-center justify-center px-4 sm:px-8 md:px-12 opacity-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-7xl w-full items-center max-h-[90vh] overflow-y-auto md:overflow-visible py-2">
            <div className="scene-3-left space-y-4 sm:space-y-6 opacity-0 order-2 md:order-1">
              <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md">
                <h3 className="text-base sm:text-lg font-bold text-[#09090b] mb-1.5">Real-Time 3D Assembly</h3>
                <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed">Instant 3D folding animation lets you inspect box closures, dust flaps, and tuck tabs from every angle.</p>
              </div>
              <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md">
                <h3 className="text-base sm:text-lg font-bold text-[#09090b] mb-1.5">Parametric Dieline Generator</h3>
                <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed">Customize Width, Depth, and Height in millimeters. Our geometry engine recalculates crease lines and glue flaps live.</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center order-1 md:order-2">
              <div className="w-full flex items-center justify-center h-[35vh] sm:h-[45vh] md:h-[55vh]">
                <GLBModel src="/bottle.glb" className="w-full h-full" autoRotateSpeed={1.5} cameraDistance={3.0} tilt={-10} modelSize={2.4} />
              </div>
              <div className="scene-3-label text-center mt-2 opacity-0">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8956A]/10 border border-[#B8956A]/30 text-[#9A7446] text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2">
                  ✦ Dynamic Library
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-[#09090b]">Versatility</h2>
                <p className="text-[#64748b] text-xs sm:text-sm mt-0.5 sm:mt-1">Beyond boxes — bottles, cans, pouches, and more.</p>
              </div>
            </div>
            <div className="scene-3-right space-y-4 sm:space-y-6 opacity-0 order-3">
              <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md">
                <h3 className="text-base sm:text-lg font-bold text-[#09090b] mb-1.5">Realistic Material Shaders</h3>
                <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed">Switch between kraft cardboard, matte fiber, gloss, metallic foil, and custom color finishes.</p>
              </div>
              <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md">
                <h3 className="text-base sm:text-lg font-bold text-[#09090b] mb-1.5">Production PDF &amp; SVG Export</h3>
                <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed">Export vector dielines compatible with Illustrator, CAD, and laser cutting machines without resolution loss.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── SCENE 4: Gift Box Plunge & Final CTA ─────────────────────────────────── */}
        <div className="scene-4-wrapper absolute inset-0 flex items-center justify-center opacity-0 overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <GiftBoxGLB ref={giftBoxRef} className="w-full h-full" />
          </div>
          <div className="scene-4-left hidden sm:block absolute left-4 sm:left-8 md:left-24 max-w-xs space-y-4 sm:space-y-6 z-10 pointer-events-none opacity-0">
            <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <div className="text-2xl sm:text-3xl md:text-5xl font-black text-[#B8956A] mb-1 tracking-tight">50,000+</div>
              <div className="text-xs sm:text-sm font-bold text-[#09090b] uppercase tracking-wider mb-1">Dielines Generated</div>
              <p className="text-[#64748b] text-[11px] sm:text-xs">Print-ready structural vector files</p>
            </div>
            <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <div className="text-2xl sm:text-3xl md:text-5xl font-black text-[#B8956A] mb-1 tracking-tight">15,000+</div>
              <div className="text-xs sm:text-sm font-bold text-[#09090b] uppercase tracking-wider mb-1">Active Brands &amp; Agencies</div>
              <p className="text-[#64748b] text-[11px] sm:text-xs">Worldwide design professionals</p>
            </div>
            <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <div className="text-2xl sm:text-3xl md:text-5xl font-black text-[#B8956A] mb-1 tracking-tight">99.8%</div>
              <div className="text-xs sm:text-sm font-bold text-[#09090b] uppercase tracking-wider mb-1">Print Accuracy</div>
              <p className="text-[#64748b] text-[11px] sm:text-xs">Verified structural tolerances</p>
            </div>
          </div>
          <div className="scene-4-right hidden sm:block absolute right-4 sm:right-8 md:right-24 max-w-xs space-y-4 sm:space-y-6 z-10 pointer-events-none opacity-0 text-right">
            <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <div className="text-2xl sm:text-3xl md:text-5xl font-black text-[#B8956A] mb-1 tracking-tight">120+</div>
              <div className="text-xs sm:text-sm font-bold text-[#09090b] uppercase tracking-wider mb-1">Box &amp; Bottle Templates</div>
              <p className="text-[#64748b] text-[11px] sm:text-xs">Parametric customizable structures</p>
            </div>
            <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <div className="text-2xl sm:text-3xl md:text-5xl font-black text-[#B8956A] mb-1 tracking-tight">Zero</div>
              <div className="text-xs sm:text-sm font-bold text-[#09090b] uppercase tracking-wider mb-1">Plugins Required</div>
              <p className="text-[#64748b] text-[11px] sm:text-xs">Runs natively in high-performance WebGL</p>
            </div>
          </div>

          {/* Final CTA Overlay Card */}
          <div className="scene-4-cta-overlay absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 z-20 pointer-events-auto opacity-0 scale-90">
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 max-w-2xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.12),0_10px_25px_rgba(0,0,0,0.04)] flex flex-col items-center">
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#B8956A]/10 border border-[#B8956A]/30 text-[#9A7446] text-[10px] sm:text-xs font-bold mb-3 sm:mb-4 uppercase tracking-widest">
                ✦ Start Your Packaging Journey
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-3 sm:mb-4 uppercase leading-tight text-[#09090b]">
                Ready to Create<br />Packaging Visuals?
              </h2>
              <p className="text-[#64748b] text-sm sm:text-base md:text-lg max-w-lg mb-6 sm:mb-8 leading-relaxed">
                Design photorealistic 3D mockups and export manufacturing-ready vector dielines in seconds.
              </p>
              <button onClick={handleStartJourney} className="px-6 sm:px-10 py-3 sm:py-4 bg-[#0f172a] hover:bg-black text-white font-black rounded-xl sm:rounded-2xl text-sm sm:text-lg transition-all shadow-[0_10px_25px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(15,23,42,0.35)] cursor-pointer inline-flex items-center gap-2 sm:gap-3">
                Start Your Journey Today →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
