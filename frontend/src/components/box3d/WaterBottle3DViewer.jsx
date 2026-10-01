/**
 * WaterBottle3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3D viewer component for the Plastic Mineral Water Bottle (PET).
 * Bridges into Box3DViewer router so WorkshopPage and EditorModal preview cards
 * can render the photorealistic Pacdora-quality bottle natively.
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";
import React, { useRef, useMemo } from "react";
import { PlasticWaterBottle3D } from "../../app/components/3d/PlasticWaterBottle3D";
import { useBoxStore } from "../../lib/useBoxStore";
import { useDebouncedDecals } from "./sharedUtils";

export default function WaterBottle3DViewer({
  useStore = useBoxStore,
  decals: propDecals,
  packageColor: propPackageColor,
  activeAnimation = "none",
  showWatermark = false,
  ...props
}) {
  const store = useStore();
  const bottleRef = useRef(null);

  // Extract decals specifically for water_bottle model or fall back to passed decals
  const decals = useMemo(() => {
    if (propDecals && propDecals.length > 0) return propDecals;
    if (store.decalsByModel && store.decalsByModel.water_bottle) {
      return store.decalsByModel.water_bottle;
    }
    return [];
  }, [propDecals, store.decalsByModel]);

  // Debounce rapid drag moves by 35ms to ensure buttery smooth dieline interactions
  const debouncedDecals = useDebouncedDecals(decals, 35);

  const labelColor = propPackageColor || store.packageColor || "#ffffff";
  const materialType = (store.materialType || "").toLowerCase().includes("frosted")
    ? "frosted"
    : (store.materialType || "").toLowerCase().includes("tinted")
    ? "tinted"
    : "plastic_glossy";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "180px", overflow: "hidden" }}>
      <PlasticWaterBottle3D
        ref={bottleRef}
        decals={debouncedDecals}
        labelColor={labelColor}
        capColor="#ffffff"
        materialType={materialType}
        autoRotate={activeAnimation === "rotate"}
        interactive={true}
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
          Pacdora Studio PET 530040
        </div>
      )}
    </div>
  );
}
