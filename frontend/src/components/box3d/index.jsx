/**
 * index.js  —  Box3D Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin router: picks the correct viewer based on the boxModel prop (or store).
 * All existing imports of "../components/Box3DViewer" continue to work via
 * the re-export in Box3DViewer.jsx, which points here.
 *
 * Usage (direct):
 *   import Box3DViewer from '../src/components/box3d';
 *   <Box3DViewer boxModelOverride="rte" ... />
 *   <Box3DViewer boxModelOverride="te"  ... />
 *   <Box3DViewer ... />   // falls back to store.boxModel
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";
import React, { useState, useEffect } from 'react';
import { useBoxStore }     from "../../lib/useBoxStore";
import RTEBox3DViewer      from "./RTEBox3DViewer";
import TEBox3DViewer       from "./TEBox3DViewer";
import AutoLockBox3DViewer from "./AutoLockBox3DViewer";

import CosmeticBox3DViewer  from "./CosmeticBox3DViewer";
import CosmeticBBox3DViewer from "./CosmeticBBox3DViewer";
import ButtonHoleBox3DViewer from "./ButtonHoleBox3DViewer";
import WaterBottle3DViewer from "./WaterBottle3DViewer";
import Can3DViewer         from "./Can3DViewer";
import SlimCan3DViewer     from "./SlimCan3DViewer";
import Tube3DViewer        from "./Tube3DViewer";

export { RTEBox3DViewer, TEBox3DViewer, AutoLockBox3DViewer, CosmeticBox3DViewer, CosmeticBBox3DViewer, ButtonHoleBox3DViewer, WaterBottle3DViewer, Can3DViewer, SlimCan3DViewer, Tube3DViewer };

export default function Box3DViewer({ boxModelOverride = null, activeAnimation = 'none', useStore = useBoxStore, ...props }) {
  const store = useStore();
  const model = boxModelOverride || props.boxModel || store?.boxModel || "rte";
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('isLoggedIn') === 'true';
    return false;
  });

  useEffect(() => {
    const handleAuthChange = () => setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const showWatermark = props.showWatermark !== undefined ? props.showWatermark : !isLoggedIn;

  if (model === "slim_can" || model === "slim_355ml_can") return <SlimCan3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  if (model === "can" || model === "soda_can" || model === "beverage_can") return <Can3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  if (model === "water_bottle") return <WaterBottle3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  if (model === "tube" || model === "toothpaste_tube") return <Tube3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  if (model === "te") return <TEBox3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  if (model === "auto_lock") return <AutoLockBox3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  if (model === "cosmetic") return <CosmeticBox3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  if (model === "cosmetic_b") return <CosmeticBBox3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  if (model === "button_hole") return <ButtonHoleBox3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
  return <RTEBox3DViewer activeAnimation={activeAnimation} useStore={useStore} showWatermark={showWatermark} {...props} />;
}
