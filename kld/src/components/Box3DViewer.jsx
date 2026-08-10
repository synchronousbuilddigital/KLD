/**
 * Box3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-export shim — keeps all existing page imports working without any changes.
 *
 * The actual 3D viewers now live in:
 *   src/components/box3d/RTEBox3DViewer.jsx  — Reverse Tuck End
 *   src/components/box3d/TEBox3DViewer.jsx   — Tuck End
 *   src/components/box3d/sharedUtils.jsx     — shared helpers
 *   src/components/box3d/index.js            — router (picks viewer by boxModel)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export { default, RTEBox3DViewer, TEBox3DViewer } from "./box3d/index";
