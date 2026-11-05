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

import RSCBox3DViewer      from "./RSCBox3DViewer";
import CosmeticBox3DViewer  from "./CosmeticBox3DViewer";
import CosmeticBBox3DViewer from "./CosmeticBBox3DViewer";
import ButtonHoleBox3DViewer from "./ButtonHoleBox3DViewer";
import WaterBottle3DViewer from "./WaterBottle3DViewer";
import SipperWaterBottle3DViewer from "./SipperWaterBottle3DViewer";
import Can3DViewer         from "./Can3DViewer";
import SlimCan3DViewer     from "./SlimCan3DViewer";
import Tube3DViewer        from "./Tube3DViewer";
import FEFCO0300ShoeBox3DViewer from "./FEFCO0300ShoeBox3DViewer";
import PizzaBox3DViewer from "./PizzaBox3DViewer";

export { RTEBox3DViewer, TEBox3DViewer, RSCBox3DViewer, AutoLockBox3DViewer, CosmeticBox3DViewer, CosmeticBBox3DViewer, ButtonHoleBox3DViewer, WaterBottle3DViewer, SipperWaterBottle3DViewer, Can3DViewer, SlimCan3DViewer, Tube3DViewer, FEFCO0300ShoeBox3DViewer, PizzaBox3DViewer };

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
  const resolvedDecals = props.decals !== undefined 
    ? props.decals 
    : (store?.decalsByModel?.[model] || store?.decals || []);

  const commonProps = {
    activeAnimation,
    useStore,
    showWatermark,
    decals: resolvedDecals,
    ...props
  };

  if (model === "rsc") return <RSCBox3DViewer {...commonProps} />;
  if (model === "slim_can" || model === "slim_355ml_can") return <SlimCan3DViewer {...commonProps} />;
  if (model === "can" || model === "soda_can" || model === "beverage_can") return <Can3DViewer {...commonProps} />;
  if (model === "sipper_water_bottle" || model === "water_bottle_handle" || model === "sipper_bottle") return <SipperWaterBottle3DViewer {...commonProps} />;
  if (model === "water_bottle") return <WaterBottle3DViewer {...commonProps} />;
  if (model === "tube" || model === "toothpaste_tube") return <Tube3DViewer {...commonProps} />;
  if (model === "te") return <TEBox3DViewer {...commonProps} />;
  if (model === "auto_lock") return <AutoLockBox3DViewer {...commonProps} />;
  if (model === "cosmetic") return <CosmeticBox3DViewer {...commonProps} />;
  if (model === "cosmetic_b") return <CosmeticBBox3DViewer {...commonProps} />;
  if (model === "button_hole") return <ButtonHoleBox3DViewer {...commonProps} />;
  if (model === "fefco_0300" || model === "shoe_box_with_lid" || model === "shoebox") return <FEFCO0300ShoeBox3DViewer {...commonProps} />;
  if (model === "pizza_box" || model === "fefco_0426" || model === "pizza") return <PizzaBox3DViewer {...commonProps} />;
  return <RTEBox3DViewer {...commonProps} />;
}
