/**
 * Can3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3D viewer component for the 12 oz Aluminum Beverage Can / Soda Can.
 * Bridges into Box3DViewer router so WorkshopPage and EditorModal preview cards
 * can render the photorealistic Pacdora-quality aluminum can natively.
 * Model ID: 550034
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";
import React, { useRef, useMemo } from "react";
import { BeverageCan3D } from "../../app/components/3d/BeverageCan3D";
import { useBoxStore } from "../../lib/useBoxStore";
import { useDebouncedDecals } from "./sharedUtils";

export default function Can3DViewer({
  useStore = useBoxStore,
  decals: propDecals,
  packageColor: propPackageColor,
  activeAnimation = "none",
  showWatermark = false,
  ...props
}) {
  const store = useStore();
  const canRef = useRef(null);

  // Extract decals specifically for can model or fall back to passed decals
  const decals = useMemo(() => {
    if (propDecals && propDecals.length > 0) return propDecals;
    if (store.decalsByModel && store.decalsByModel.can) {
      return store.decalsByModel.can;
    }
    return [];
  }, [propDecals, store.decalsByModel]);

  // Debounce rapid drag moves by 35ms to ensure buttery smooth dieline interactions
  const debouncedDecals = useDebouncedDecals(decals, 35);

  const packageColor = propPackageColor || store.packageColor || "#ffffff";
  const materialType = (store.materialType || "").toLowerCase().includes("gloss")
    ? "metal_gloss"
    : "metal_matt";

  const labelWidthInches = Number(props.L || store.L) || (207 / 25.4);
  const labelHeightInches = Number(props.W || store.W) || (125 / 25.4);
  const glueFlapWidth = Number(props.glueFlapWidth || store.glueFlapWidth) || 0.25;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "180px", overflow: "hidden" }}>
      <BeverageCan3D
        ref={canRef}
        decals={debouncedDecals}
        packageColor={packageColor}
        materialType={materialType}
        autoRotate={activeAnimation === "rotate"}
        interactive={true}
        showPlaceholder={debouncedDecals.length === 0}
        labelWidthInches={labelWidthInches}
        labelHeightInches={labelHeightInches}
        glueFlapWidth={glueFlapWidth}
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
          Pacdora Studio Can 550034
        </div>
      )}
    </div>
  );
}
