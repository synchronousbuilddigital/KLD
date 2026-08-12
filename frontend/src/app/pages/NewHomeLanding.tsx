// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import Header from '../components/layout/Header';
import MarqueeIsolated from '../components/layout/MarqueeIsolated';
import SignInModal from '../components/modals/SignInModal';

/* ---- Motion Variants ---- */
const slideUpVariant = {
  initial: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

const staggerContainer = {
  initial: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const viewportOptions = { once: true, margin: '-50px' } as const;

/**
 * NewHomeLanding - React component that renders the new home landing page
 * with the CSS 3D packaging animation sequencer.
 * Ported from the static HTML/JS in the "new home" folder.
 */
export default function NewHomeLanding() {
  const geomContainerRef = useRef<HTMLDivElement>(null);
  const canvas3DRef = useRef<HTMLDivElement>(null);
  const modelNameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<{ mounted: boolean }>({ mounted: true });
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      try {
        const u = localStorage.getItem('user');
        setCurrentUser(u ? JSON.parse(u) : null);
      } catch { setCurrentUser(null); }
    };
    window.addEventListener('auth-change', handleAuthChange);

    // Initial route check on mount
    const path = window.location.pathname.replace('/', '').toLowerCase();
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const route = path || hash;

    if (route === '3d-models' || route === 'packaging-collections') {
      setTimeout(() => document.getElementById('packaging-collections')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else if (route === 'dielines' || route === 'top-dielines') {
      setTimeout(() => document.getElementById('top-dielines')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else if (route === 'about-us') {
      setTimeout(() => document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const geomContainer = geomContainerRef.current;
    const canvas3D = canvas3DRef.current;
    const modelNameEl = modelNameRef.current;
    if (!geomContainer || !canvas3D || !modelNameEl) return;

    const state = animationRef.current;
    state.mounted = true;
    let currentBoxIndex = 0;

    /* ---- Box Models Configuration ---- */
    const boxModels = [
      { name: "Mailer Box", build: buildMailerBox },
      { name: "Pizza Box", build: buildPizzaBox },
      { name: "Shoebox (Lid & Base)", build: buildShoebox },
      { name: "Slide Box (Drawer & Sleeve)", build: buildSlideBox },
    ];

    /* ---- 1. Mailer Box Builder ---- */
    function buildMailerBox() {
      const W = 270, D = 200, H = 105, F = 30, E = 30;
      const root = document.createElement('div');
      root.className = 'mailer-root';
      root.style.width = `${W}px`;
      root.style.height = `${D}px`;
      root.style.position = 'absolute';
      root.style.transformStyle = 'preserve-3d';
      root.style.left = `calc(50% - ${W / 2}px)`;
      root.style.top = `calc(50% - ${D / 2}px)`;

      const bottom = document.createElement('div');
      bottom.className = 'face bottom inner-side brand-print';
      bottom.style.width = '100%';
      bottom.style.height = '100%';
      root.appendChild(bottom);

      function createNestedFace(className: string, w: number, h: number, parent: HTMLElement, posCSS: Record<string, number>, hinge: string) {
        const face = document.createElement('div');
        face.className = `face ${className}`;
        face.style.width = `${w}px`;
        face.style.height = `${h}px`;
        face.style.transformOrigin = hinge;
        Object.keys(posCSS).forEach(key => { (face.style as Record<string, string>)[key] = `${posCSS[key]}px`; });
        parent.appendChild(face);
        return face;
      }

      const back = createNestedFace('back cut-left cut-right', W, H, bottom, { top: -H }, 'bottom center');
      const topLid = createNestedFace('top cut-left cut-right', W, D, back, { top: -D }, 'bottom center');
      const lidFlap = createNestedFace('lid-flap cut-left cut-right cut-top', W, F, topLid, { top: -F }, 'bottom center');
      const lidLeftEar = createNestedFace('lid-left-ear cut-left cut-top cut-bottom', E, D, topLid, { left: -E, top: 0 }, 'right center');
      const lidRightEar = createNestedFace('lid-right-ear cut-right cut-top cut-bottom', E, D, topLid, { right: -E, top: 0 }, 'left center');
      const front = createNestedFace('front cut-left cut-right', W, H, bottom, { top: D }, 'top center');
      const frontFlap = createNestedFace('front-flap cut-left cut-right cut-bottom', W, F, front, { top: H }, 'top center');
      const left = createNestedFace('left cut-top cut-bottom', H, D, bottom, { left: -H, top: 0 }, 'right center');
      const leftFlapBack = createNestedFace('left-flap-back cut-left cut-top', H, F, left, { top: -F }, 'bottom center');
      const leftFlapFront = createNestedFace('left-flap-front cut-left cut-bottom', H, F, left, { top: D }, 'top center');
      const right = createNestedFace('right cut-top cut-bottom', H, D, bottom, { right: -H, top: 0 }, 'left center');
      const rightFlapBack = createNestedFace('right-flap-back cut-right cut-top', H, F, right, { top: -F }, 'bottom center');
      const rightFlapFront = createNestedFace('right-flap-front cut-right cut-bottom', H, F, right, { top: D }, 'top center');

      return {
        element: root,
        setFoldState: function (s: string) {
          if (s === 'flat') {
            back.style.transform = 'rotateX(0deg)'; topLid.style.transform = 'rotateX(0deg)'; lidFlap.style.transform = 'rotateX(0deg)';
            lidLeftEar.style.transform = 'rotateY(0deg)'; lidRightEar.style.transform = 'rotateY(0deg)';
            front.style.transform = 'rotateX(0deg)'; frontFlap.style.transform = 'rotateX(0deg)';
            left.style.transform = 'rotateY(0deg)'; leftFlapBack.style.transform = 'rotateX(0deg)'; leftFlapFront.style.transform = 'rotateX(0deg)';
            right.style.transform = 'rotateY(0deg)'; rightFlapBack.style.transform = 'rotateX(0deg)'; rightFlapFront.style.transform = 'rotateX(0deg)';
          } else if (s === 'open') {
            back.style.transform = 'rotateX(-90deg)'; topLid.style.transform = 'rotateX(15deg)';
            lidFlap.style.transform = 'rotateX(-90deg) translateZ(1.5px)';
            lidLeftEar.style.transform = 'rotateY(90deg) translateZ(1.5px)'; lidRightEar.style.transform = 'rotateY(-90deg) translateZ(1.5px)';
            front.style.transform = 'rotateX(90deg)'; frontFlap.style.transform = 'rotateX(90deg)';
            left.style.transform = 'rotateY(90deg)'; leftFlapBack.style.transform = 'rotateX(-90deg) translateZ(1px)'; leftFlapFront.style.transform = 'rotateX(90deg) translateZ(1px)';
            right.style.transform = 'rotateY(-90deg)'; rightFlapBack.style.transform = 'rotateX(-90deg) translateZ(1px)'; rightFlapFront.style.transform = 'rotateX(90deg) translateZ(1px)';
          } else if (s === 'closed') {
            back.style.transform = 'rotateX(-90deg)'; topLid.style.transform = 'rotateX(-90deg)';
            lidFlap.style.transform = 'rotateX(-90deg) translateZ(1.5px)';
            lidLeftEar.style.transform = 'rotateY(90deg) translateZ(1.5px)'; lidRightEar.style.transform = 'rotateY(-90deg) translateZ(1.5px)';
            front.style.transform = 'rotateX(90deg)'; frontFlap.style.transform = 'rotateX(90deg)';
            left.style.transform = 'rotateY(90deg)'; leftFlapBack.style.transform = 'rotateX(-90deg) translateZ(1px)'; leftFlapFront.style.transform = 'rotateX(90deg) translateZ(1px)';
            right.style.transform = 'rotateY(-90deg)'; rightFlapBack.style.transform = 'rotateX(-90deg) translateZ(1px)'; rightFlapFront.style.transform = 'rotateX(90deg) translateZ(1px)';
          }
        }
      };
    }

    /* ---- 2. Pizza Box Builder ---- */
    function buildPizzaBox() {
      const W = 270, D = 270, H = 50, F = 25;
      const root = document.createElement('div');
      root.className = 'pizza-root';
      root.style.width = `${W}px`; root.style.height = `${D}px`;
      root.style.position = 'absolute'; root.style.transformStyle = 'preserve-3d';
      root.style.left = `calc(50% - ${W / 2}px)`; root.style.top = `calc(50% - ${D / 2}px)`;

      const bottom = document.createElement('div');
      bottom.className = 'face bottom inner-side brand-print';
      bottom.style.width = '100%'; bottom.style.height = '100%';
      root.appendChild(bottom);

      function createNestedFace(className: string, w: number, h: number, parent: HTMLElement, posCSS: Record<string, number>, hinge: string) {
        const face = document.createElement('div');
        face.className = `face ${className}`;
        face.style.width = `${w}px`; face.style.height = `${h}px`;
        face.style.transformOrigin = hinge;
        Object.keys(posCSS).forEach(key => { (face.style as Record<string, string>)[key] = `${posCSS[key]}px`; });
        parent.appendChild(face);
        return face;
      }

      const back = createNestedFace('back cut-left cut-right', W, H, bottom, { top: -H }, 'bottom center');
      const lid = createNestedFace('top cut-left cut-right', W, D, back, { top: -D }, 'bottom center');
      const lidFront = createNestedFace('lid-front cut-left cut-right cut-top', W, F, lid, { top: -F }, 'bottom center');
      const lidLeft = createNestedFace('lid-left cut-left cut-top cut-bottom', F, D, lid, { left: -F, top: 0 }, 'right center');
      const lidRight = createNestedFace('lid-right cut-right cut-top cut-bottom', F, D, lid, { right: -F, top: 0 }, 'left center');
      const leftSide = createNestedFace('left cut-top cut-bottom', H, D, bottom, { left: -H, top: 0 }, 'right center');
      const leftInner = createNestedFace('left-inner inner-side cut-left cut-top cut-bottom', H - 2, D, leftSide, { left: -H + 2, top: 0 }, 'right center');
      const rightSide = createNestedFace('right cut-top cut-bottom', H, D, bottom, { right: -H, top: 0 }, 'left center');
      const rightInner = createNestedFace('right-inner inner-side cut-right cut-top cut-bottom', H - 2, D, rightSide, { right: -H + 2, top: 0 }, 'left center');
      const front = createNestedFace('front cut-left cut-right cut-bottom', W, H, bottom, { top: D }, 'top center');

      return {
        element: root,
        setFoldState: function (s: string) {
          if (s === 'flat') {
            back.style.transform = 'rotateX(0deg)'; lid.style.transform = 'rotateX(0deg)';
            lidFront.style.transform = 'rotateX(0deg)'; lidLeft.style.transform = 'rotateY(0deg)'; lidRight.style.transform = 'rotateY(0deg)';
            leftSide.style.transform = 'rotateY(0deg)'; leftInner.style.transform = 'rotateY(0deg)';
            rightSide.style.transform = 'rotateY(0deg)'; rightInner.style.transform = 'rotateY(0deg)';
            front.style.transform = 'rotateX(0deg)';
          } else if (s === 'open') {
            back.style.transform = 'rotateX(-90deg)'; lid.style.transform = 'rotateX(8deg)';
            lidFront.style.transform = 'rotateX(-90deg) translateZ(1.5px)';
            lidLeft.style.transform = 'rotateY(90deg) translateZ(1.5px)'; lidRight.style.transform = 'rotateY(-90deg) translateZ(1.5px)';
            leftSide.style.transform = 'rotateY(90deg)'; leftInner.style.transform = 'rotateY(90deg) translateZ(1px)';
            rightSide.style.transform = 'rotateY(-90deg)'; rightInner.style.transform = 'rotateY(-90deg) translateZ(1px)';
            front.style.transform = 'rotateX(90deg)';
          } else if (s === 'closed') {
            back.style.transform = 'rotateX(-90deg)'; lid.style.transform = 'rotateX(-90deg)';
            lidFront.style.transform = 'rotateX(-90deg) translateZ(1.5px)';
            lidLeft.style.transform = 'rotateY(90deg) translateZ(1.5px)'; lidRight.style.transform = 'rotateY(-90deg) translateZ(1.5px)';
            leftSide.style.transform = 'rotateY(90deg)'; leftInner.style.transform = 'rotateY(90deg) translateZ(1px)';
            rightSide.style.transform = 'rotateY(-90deg)'; rightInner.style.transform = 'rotateY(-90deg) translateZ(1px)';
            front.style.transform = 'rotateX(90deg)';
          }
        }
      };
    }

    /* ---- 3. Shoebox Builder ---- */
    function buildShoebox() {
      const W = 250, D = 160, H = 100, L = 25;
      const root = document.createElement('div');
      root.className = 'shoebox-root';
      root.style.width = `${W}px`; root.style.height = `${D}px`;
      root.style.position = 'absolute'; root.style.transformStyle = 'preserve-3d';
      root.style.left = `calc(50% - ${W / 2}px)`; root.style.top = `calc(50% - ${D / 2}px)`;

      const base = document.createElement('div');
      base.className = 'shoebox-base-container';
      base.style.width = '100%'; base.style.height = '100%';
      base.style.position = 'absolute'; base.style.transformStyle = 'preserve-3d';
      root.appendChild(base);

      const baseBottom = document.createElement('div');
      baseBottom.className = 'face bottom inner-side brand-print';
      baseBottom.style.width = '100%'; baseBottom.style.height = '100%';
      base.appendChild(baseBottom);

      function createNestedFace(className: string, w: number, h: number, parent: HTMLElement, posCSS: Record<string, number>, hinge: string) {
        const face = document.createElement('div');
        face.className = `face ${className}`;
        face.style.width = `${w}px`; face.style.height = `${h}px`;
        face.style.transformOrigin = hinge;
        Object.keys(posCSS).forEach(key => { (face.style as Record<string, string>)[key] = `${posCSS[key]}px`; });
        parent.appendChild(face);
        return face;
      }

      const baseBack = createNestedFace('back cut-left cut-right', W, H, baseBottom, { top: -H }, 'bottom center');
      const baseFront = createNestedFace('front cut-left cut-right', W, H, baseBottom, { top: D }, 'top center');
      const baseLeft = createNestedFace('left cut-top cut-bottom', H, D, baseBottom, { left: -H, top: 0 }, 'right center');
      const baseRight = createNestedFace('right cut-top cut-bottom', H, D, baseBottom, { right: -H, top: 0 }, 'left center');

      const lid = document.createElement('div');
      lid.className = 'shoebox-lid-container';
      const lW = W + 6, lD = D + 6;
      lid.style.width = `${lW}px`; lid.style.height = `${lD}px`;
      lid.style.position = 'absolute'; lid.style.transformStyle = 'preserve-3d';
      lid.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
      root.appendChild(lid);

      const lidTop = document.createElement('div');
      lidTop.className = 'face top';
      lidTop.style.width = '100%'; lidTop.style.height = '100%';
      lid.appendChild(lidTop);

      const lidBack = createNestedFace('lid-back cut-left cut-right', lW, L, lidTop, { top: -L }, 'bottom center');
      const lidFront = createNestedFace('lid-front cut-left cut-right', lW, L, lidTop, { top: lD }, 'top center');
      const lidLeft = createNestedFace('lid-left cut-top cut-bottom', L, lD, lidTop, { left: -L, top: 0 }, 'right center');
      const lidRight = createNestedFace('lid-right cut-top cut-bottom', L, lD, lidTop, { right: -L, top: 0 }, 'left center');

      return {
        element: root,
        setFoldState: function (s: string) {
          if (s === 'flat') {
            baseBack.style.transform = 'rotateX(0deg)'; baseFront.style.transform = 'rotateX(0deg)';
            baseLeft.style.transform = 'rotateY(0deg)'; baseRight.style.transform = 'rotateY(0deg)';
            lidBack.style.transform = 'rotateX(0deg)'; lidFront.style.transform = 'rotateX(0deg)';
            lidLeft.style.transform = 'rotateY(0deg)'; lidRight.style.transform = 'rotateY(0deg)';
            lid.style.transform = `translate3d(${W + H + 40}px, 0px, 0px)`;
          } else if (s === 'open') {
            baseBack.style.transform = 'rotateX(-90deg)'; baseFront.style.transform = 'rotateX(90deg)';
            baseLeft.style.transform = 'rotateY(90deg)'; baseRight.style.transform = 'rotateY(-90deg)';
            lidBack.style.transform = 'rotateX(90deg)'; lidFront.style.transform = 'rotateX(-90deg)';
            lidLeft.style.transform = 'rotateY(-90deg)'; lidRight.style.transform = 'rotateY(90deg)';
            lid.style.transform = `translate3d(-3px, -20px, ${H + 70}px) rotateX(-20deg)`;
          } else if (s === 'closed') {
            baseBack.style.transform = 'rotateX(-90deg)'; baseFront.style.transform = 'rotateX(90deg)';
            baseLeft.style.transform = 'rotateY(90deg)'; baseRight.style.transform = 'rotateY(-90deg)';
            lidBack.style.transform = 'rotateX(90deg)'; lidFront.style.transform = 'rotateX(-90deg)';
            lidLeft.style.transform = 'rotateY(-90deg)'; lidRight.style.transform = 'rotateY(90deg)';
            lid.style.transform = `translate3d(-3px, -3px, ${H}px)`;
          }
        }
      };
    }

    /* ---- 4. Slide Box Builder ---- */
    function buildSlideBox() {
      const W = 230, D = 140, H = 100;
      const root = document.createElement('div');
      root.className = 'slidebox-root';
      root.style.width = `${W}px`; root.style.height = `${D}px`;
      root.style.position = 'absolute'; root.style.transformStyle = 'preserve-3d';
      root.style.left = `calc(50% - ${W / 2}px)`; root.style.top = `calc(50% - ${D / 2}px)`;

      const sleeve = document.createElement('div');
      sleeve.className = 'sleeve-container';
      sleeve.style.width = '100%'; sleeve.style.height = '100%';
      sleeve.style.position = 'absolute'; sleeve.style.transformStyle = 'preserve-3d';
      root.appendChild(sleeve);

      const sleeveBottom = document.createElement('div');
      sleeveBottom.className = 'face bottom inner-side brand-print cut-top cut-bottom';
      sleeveBottom.style.width = '100%'; sleeveBottom.style.height = '100%';
      sleeveBottom.style.position = 'absolute'; sleeveBottom.style.left = '0px'; sleeveBottom.style.top = '0px';
      sleeve.appendChild(sleeveBottom);

      function createNestedFace(className: string, w: number, h: number, parent: HTMLElement, posCSS: Record<string, number>, hinge: string) {
        const face = document.createElement('div');
        face.className = `face ${className}`;
        face.style.width = `${w}px`; face.style.height = `${h}px`;
        face.style.transformOrigin = hinge;
        Object.keys(posCSS).forEach(key => { (face.style as Record<string, string>)[key] = `${posCSS[key]}px`; });
        parent.appendChild(face);
        return face;
      }

      const sleeveLeft = createNestedFace('left cut-top cut-bottom', H, D, sleeveBottom, { left: -H, top: 0 }, 'right center');
      const sleeveTop = createNestedFace('top cut-left cut-top cut-bottom', W, D, sleeveLeft, { left: -W, top: 0 }, 'right center');
      const sleeveRight = createNestedFace('right cut-right cut-top cut-bottom', H, D, sleeveBottom, { right: -H, top: 0 }, 'left center');

      const drawer = document.createElement('div');
      drawer.className = 'drawer-container';
      const dW = W - 6, dD = D - 2, dH = H - 4;
      drawer.style.width = `${dW}px`; drawer.style.height = `${dD}px`;
      drawer.style.position = 'absolute'; drawer.style.transformStyle = 'preserve-3d';
      drawer.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
      drawer.style.left = '3px'; drawer.style.top = '1px';
      root.appendChild(drawer);

      const drawerBottom = document.createElement('div');
      drawerBottom.className = 'face bottom inner-side';
      drawerBottom.style.width = '100%'; drawerBottom.style.height = '100%';
      drawerBottom.style.position = 'absolute'; drawerBottom.style.left = '0px'; drawerBottom.style.top = '0px';
      drawer.appendChild(drawerBottom);

      const drawerBack = createNestedFace('back cut-left cut-right', dW, dH, drawerBottom, { top: -dH }, 'bottom center');
      const drawerFront = createNestedFace('front cut-left cut-right', dW, dH, drawerBottom, { top: dD }, 'top center');
      const drawerLeft = createNestedFace('left cut-top cut-bottom', dH, dD, drawerBottom, { left: -dH, top: 0 }, 'right center');
      const drawerRight = createNestedFace('right cut-top cut-bottom', dH, dD, drawerBottom, { right: -dH, top: 0 }, 'left center');

      return {
        element: root,
        setFoldState: function (s: string) {
          if (s === 'flat') {
            sleeveLeft.style.transform = 'rotateY(0deg)'; sleeveTop.style.transform = 'rotateY(0deg)';
            sleeveRight.style.transform = 'rotateY(0deg)';
            drawer.style.transform = `translate3d(0px, ${D + 30}px, 0px)`;
            drawerBack.style.transform = 'rotateX(0deg)'; drawerFront.style.transform = 'rotateX(0deg)';
            drawerLeft.style.transform = 'rotateY(0deg)'; drawerRight.style.transform = 'rotateY(0deg)';
          } else if (s === 'open') {
            sleeveLeft.style.transform = 'rotateY(90deg)'; sleeveTop.style.transform = 'rotateY(90deg)';
            sleeveRight.style.transform = 'rotateY(-90deg)';
            drawer.style.transform = `translate3d(0px, ${D * 0.8}px, 2px)`;
            drawerBack.style.transform = 'rotateX(-90deg)'; drawerFront.style.transform = 'rotateX(90deg)';
            drawerLeft.style.transform = 'rotateY(90deg)'; drawerRight.style.transform = 'rotateY(-90deg)';
          } else if (s === 'closed') {
            sleeveLeft.style.transform = 'rotateY(90deg)'; sleeveTop.style.transform = 'rotateY(90deg)';
            sleeveRight.style.transform = 'rotateY(-90deg)';
            drawer.style.transform = 'translate3d(0px, 0px, 2px)';
            drawerBack.style.transform = 'rotateX(-90deg)'; drawerFront.style.transform = 'rotateX(90deg)';
            drawerLeft.style.transform = 'rotateY(90deg)'; drawerRight.style.transform = 'rotateY(-90deg)';
          }
        }
      };
    }

    /* ---- Floating Name Positioning Helpers ---- */
    interface NamePosition {
      top: string;
      left: string;
      right: string;
      bottom: string;
      baseTransform: string;
      textAlign: string;
    }
    let activeNamePos: NamePosition | null = null;

    function randomizeNamePosition() {
      const namePositions: NamePosition[] = [
        { top: '25px', left: '30px', right: 'auto', bottom: 'auto', baseTransform: '', textAlign: 'left' },
        { top: '25px', left: 'auto', right: '30px', bottom: 'auto', baseTransform: '', textAlign: 'right' },
        { top: '65px', left: '30px', right: 'auto', bottom: 'auto', baseTransform: '', textAlign: 'left' },
        { top: '65px', left: 'auto', right: '30px', bottom: 'auto', baseTransform: '', textAlign: 'right' },
      ];
      activeNamePos = namePositions[Math.floor(Math.random() * namePositions.length)];
      modelNameEl.style.top = activeNamePos.top;
      modelNameEl.style.bottom = activeNamePos.bottom;
      modelNameEl.style.left = activeNamePos.left;
      modelNameEl.style.right = activeNamePos.right;
      modelNameEl.style.textAlign = activeNamePos.textAlign;
      modelNameEl.style.transition = 'none';
      modelNameEl.style.opacity = '0';
      modelNameEl.style.transform = `${activeNamePos.baseTransform} translateY(-20px)`.trim();
      void modelNameEl.offsetHeight; // force reflow
      modelNameEl.style.transition = 'opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    }

    function showName(name: string) {
      if (!activeNamePos) return;
      modelNameEl.innerText = name;
      modelNameEl.style.opacity = '0.95';
      modelNameEl.style.transform = `${activeNamePos.baseTransform} translateY(0)`.trim();
    }

    function hideName() {
      if (!activeNamePos) return;
      modelNameEl.style.opacity = '0';
      modelNameEl.style.transform = `${activeNamePos.baseTransform} translateY(-20px)`.trim();
    }

    /* ---- Core Loop Orchestrator ---- */
    function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function runOrchestrationLoop() {
      if (!state.mounted) return;

      const box = boxModels[currentBoxIndex];
      randomizeNamePosition();

      geomContainer.innerHTML = '';
      const buildResult = box.build();
      const activeBoxElement = buildResult.element;

      buildResult.setFoldState('closed');
      const faces = activeBoxElement.querySelectorAll('.face');
      faces.forEach((f: Element) => f.classList.add('no-transition'));

      canvas3D.classList.add('no-transition');
      canvas3D.className = 'canvas-3d';

      geomContainer.className = 'box-3d sliding-in no-transition';
      geomContainer.appendChild(activeBoxElement);
      void geomContainer.offsetHeight;
      void canvas3D.offsetHeight;

      geomContainer.classList.remove('no-transition', 'sliding-in');
      showName(box.name);

      await sleep(1500);
      if (!state.mounted) return;

      canvas3D.classList.remove('no-transition');
      faces.forEach((f: Element) => f.classList.remove('no-transition'));
      void geomContainer.offsetHeight;

      buildResult.setFoldState('open');
      await sleep(1800);
      if (!state.mounted) return;

      canvas3D.classList.add('flat-mode');
      geomContainer.classList.add('dieline-mode');
      buildResult.setFoldState('flat');
      await sleep(2500);
      if (!state.mounted) return;

      canvas3D.classList.remove('flat-mode');
      geomContainer.classList.remove('dieline-mode');
      buildResult.setFoldState('open');
      await sleep(2500);
      if (!state.mounted) return;

      buildResult.setFoldState('closed');
      await sleep(1800);
      if (!state.mounted) return;

      faces.forEach((f: Element) => f.classList.add('no-transition'));
      hideName();
      geomContainer.className = 'box-3d sliding-out';
      await sleep(1500);
      if (!state.mounted) return;

      geomContainer.innerHTML = '';
      currentBoxIndex = (currentBoxIndex + 1) % boxModels.length;

      setTimeout(runOrchestrationLoop, 400);
    }

    runOrchestrationLoop();

    return () => {
      state.mounted = false;
    };
  }, []);

  return (
    <div className="new-home-landing">
      <BackgroundCanvas position="absolute" zIndex={-1} />
      <Header activeNav="landing" />

      <main className="hero-container">
        {/* Left Hero Column */}
        <motion.section className="hero-content" variants={staggerContainer} initial="initial" whileInView="visible" viewport={viewportOptions}>
          <motion.div className="badge" variants={slideUpVariant}>
            <span className="badge-dot"></span>
            The new standard in packaging
          </motion.div>

          <motion.h1 className="hero-title" variants={slideUpVariant}>
            Design Packaging<br />Without Limits
          </motion.h1>

          <motion.p className="hero-subtitle" variants={slideUpVariant}>
            The modern platform for creating, visualizing, and shipping premium packaging. Everything you need to bring your physical products to life.
          </motion.p>

          <motion.div className="cta-wrapper" variants={slideUpVariant}>
            <div className="cta-group">
              <button className="btn btn-primary">Start Free Trial</button>
              <button className="btn btn-secondary">View Dieline Gallery <span className="arrow">›</span></button>
            </div>
            <div className="demo-group">
              <button className="btn btn-demo">Book a Live Demo <span className="arrow">→</span></button>
            </div>
          </motion.div>
        </motion.section>

        {/* Right Animation Column */}
        <section className="hero-visual">
          <div className="floating-model-name" ref={modelNameRef}>Mailer Box</div>
          <div className="canvas-viewport">
            <div className="canvas-3d" ref={canvas3DRef}>
              <div className="box-3d" ref={geomContainerRef}>
                {/* Dynamically generated by JS */}
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarqueeIsolated />
      {isSignInModalOpen && <SignInModal onClose={() => setIsSignInModalOpen(false)} />}
    </div>
  );
}
