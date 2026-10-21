/**
 * SipperWaterBottle3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3D viewer component for the Sipper Water Bottle with Handle.
 * Bridges into Box3DViewer router so WorkshopPage and EditorModal preview cards
 * can render the photorealistic sports water bottle with handle & carabiner clip.
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";
import React, { useRef, useMemo } from "react";
import { SipperWaterBottle3D } from "../../app/components/3d/SipperWaterBottle3D";
import { useBoxStore } from "../../lib/useBoxStore";
import { useDebouncedDecals } from "./sharedUtils";

export default function SipperWaterBottle3DViewer({
  useStore = useBoxStore,
  decals: propDecals,
  packageColor: propPackageColor,
  activeAnimation = "none",
  showWatermark = false,
  ...props
}) {
  const store = useStore();
  const bottleRef = useRef(null);

  // Extract decals specifically for sipper_water_bottle model or fall back to passed decals
  const decals = useMemo(() => {
    if (propDecals && propDecals.length > 0) return propDecals;
    const modelKey = store.boxModel || "sipper_water_bottle";
    if (store.decalsByModel?.[modelKey] && store.decalsByModel[modelKey].length > 0) {
      return store.decalsByModel[modelKey];
    }
    if (store.decalsByModel?.sipper_water_bottle && store.decalsByModel.sipper_water_bottle.length > 0) {
      return store.decalsByModel.sipper_water_bottle;
    }
    if (store.decalsByModel?.water_bottle_handle && store.decalsByModel.water_bottle_handle.length > 0) {
      return store.decalsByModel.water_bottle_handle;
    }
    if (store.decalsByModel?.sipper_bottle && store.decalsByModel.sipper_bottle.length > 0) {
      return store.decalsByModel.sipper_bottle;
    }
    if (store.aiDecalsByModel?.[modelKey] && store.aiDecalsByModel[modelKey].length > 0) {
      return store.aiDecalsByModel[modelKey];
    }
    if (store.aiDecalsByModel?.sipper_water_bottle && store.aiDecalsByModel.sipper_water_bottle.length > 0) {
      return store.aiDecalsByModel.sipper_water_bottle;
    }
    if (Array.isArray(store.decals) && store.decals.length > 0) {
      return store.decals;
    }
    return [];
  }, [propDecals, store.boxModel, store.decalsByModel, store.aiDecalsByModel, store.decals]);

  // Debounce rapid drag moves by 35ms to ensure buttery smooth dieline interactions
  const debouncedDecals = useDebouncedDecals(decals, 35);

  const labelColor = propPackageColor || store.packageColor || "#ffffff";
  const capColor = props.capColor || store.capColor || "#18181b";
  const materialType = (store.materialType || "").toLowerCase().includes("powder")
    ? "powder_coated"
    : (store.materialType || "").toLowerCase().includes("matte")
    ? "metal_matte"
    : "metal_glossy";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "180px", overflow: "hidden" }}>
      <SipperWaterBottle3D
        ref={bottleRef}
        decals={debouncedDecals}
        labelColor={labelColor}
        capColor={capColor}
        materialType={materialType}
        autoRotate={activeAnimation === "rotate"}
        interactive={true}
        showWatermark={showWatermark}
        className="w-full h-full"
      />

      {showWatermark && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(6px)",
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#6b7280",
            pointerEvents: "none",
            userSelect: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
          }}
        >
          KLD Studio 516050
        </div>
      )}
    </div>
  );
}
