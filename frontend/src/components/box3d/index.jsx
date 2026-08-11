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
import { useBoxStore }     from "../../lib/useBoxStore";
import RTEBox3DViewer      from "./RTEBox3DViewer";
import TEBox3DViewer       from "./TEBox3DViewer";
import AutoLockBox3DViewer from "./AutoLockBox3DViewer";
import CakeBox3DViewer     from "./CakeBox3DViewer";

export { RTEBox3DViewer, TEBox3DViewer, AutoLockBox3DViewer, CakeBox3DViewer };

export default function Box3DViewer({ boxModelOverride = null, activeAnimation = 'none', ...props }) {
  const store = useBoxStore();
  const model = boxModelOverride || store.boxModel || "rte";
  if (model === "te") return <TEBox3DViewer activeAnimation={activeAnimation} {...props} />;
  if (model === "auto_lock") return <AutoLockBox3DViewer activeAnimation={activeAnimation} {...props} />;
  if (model === "cake") return <CakeBox3DViewer activeAnimation={activeAnimation} {...props} />;
  return <RTEBox3DViewer activeAnimation={activeAnimation} {...props} />;
}
