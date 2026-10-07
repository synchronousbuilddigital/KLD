/**
 * Tube3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3D viewer component for the 75 ml Plastic Toothpaste / Squeeze Tube.
 * Bridges into Box3DViewer router so WorkshopPage and EditorModal preview cards
 * can render the photorealistic Pacdora-quality squeeze tube natively.
 * Model ID: 602620
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";
import React, { useRef, useMemo } from "react";
import { ToothpasteTube3D } from "../../app/components/3d/ToothpasteTube3D";
import { useBoxStore } from "../../lib/useBoxStore";
import { useDebouncedDecals } from "./sharedUtils";

export default function Tube3DViewer({
  useStore = useBoxStore,
  decals: propDecals,
  packageColor: propPackageColor,
  activeAnimation = "none",
  showWatermark = false,
  ...props
}) {
  const store = useStore();
  const tubeRef = useRef(null);

  // Extract decals specifically for tube model or fall back to passed decals
  const decals = useMemo(() => {
    if (propDecals && propDecals.length > 0) return propDecals;
    if (store.decalsByModel && (store.decalsByModel.tube || store.decalsByModel.toothpaste_tube)) {
      return store.decalsByModel.tube || store.decalsByModel.toothpaste_tube || [];
    }
    return [];
  }, [propDecals, store.decalsByModel]);

  // Debounce rapid drag moves by 35ms to ensure buttery smooth dieline interactions
  const debouncedDecals = useDebouncedDecals(decals, 35);

  const packageColor = propPackageColor || store.packageColor || "#ffffff";
  const capColor = props.capColor || store.capColor || "#ffffff";
  const materialType = (store.materialType || "").toLowerCase().includes("matte")
    ? "matte"
    : (store.materialType || "").toLowerCase().includes("metallic")
    ? "metallic"
    : "plastic_glossy";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "180px", overflow: "hidden" }}>
      <ToothpasteTube3D
        ref={tubeRef}
        decals={debouncedDecals}
        packageColor={packageColor}
        capColor={capColor}
        materialType={materialType}
        autoRotate={activeAnimation === "rotate"}
        interactive={true}
        showPlaceholder={debouncedDecals.length === 0}
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
          KLD Studio Tube 602620
        </div>
      )}
    </div>
  );
}
