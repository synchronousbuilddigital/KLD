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
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useBoxStore }     from "../../lib/useBoxStore";

const RTEBox3DViewer = lazy(() => import("./RTEBox3DViewer"));
const TEBox3DViewer = lazy(() => import("./TEBox3DViewer"));
const AutoLockBox3DViewer = lazy(() => import("./AutoLockBox3DViewer"));
const RSCBox3DViewer = lazy(() => import("./RSCBox3DViewer"));
const CosmeticBox3DViewer = lazy(() => import("./CosmeticBox3DViewer"));
const CosmeticBBox3DViewer = lazy(() => import("./CosmeticBBox3DViewer"));
const ButtonHoleBox3DViewer = lazy(() => import("./ButtonHoleBox3DViewer"));
const WaterBottle3DViewer = lazy(() => import("./WaterBottle3DViewer"));
const SipperWaterBottle3DViewer = lazy(() => import("./SipperWaterBottle3DViewer"));
const Can3DViewer = lazy(() => import("./Can3DViewer"));
const SlimCan3DViewer = lazy(() => import("./SlimCan3DViewer"));
const Tube3DViewer = lazy(() => import("./Tube3DViewer"));
const FEFCO0300ShoeBox3DViewer = lazy(() => import("./FEFCO0300ShoeBox3DViewer"));
const PizzaBox3DViewer = lazy(() => import("./PizzaBox3DViewer"));

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

  const renderViewer = () => {
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
  };

  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">Loading 3D preview...</div>}>
      {renderViewer()}
    </Suspense>
  );
}
