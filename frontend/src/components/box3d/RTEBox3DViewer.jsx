/**
 * RTEBox3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3D viewer exclusively for Reverse Tuck End (RTE) boxes.
 *
 * RTE kinematics (5 stages):
 *   Stage 1 (0.00–0.20): Sleeve tube forms
 *   Stage 2 (0.20–0.40): Bottom dust flaps fold inward
 *   Stage 3 (0.40–0.60): Bottom tuck cover (P3) folds + lip inserts
 *   Stage 4 (0.60–0.80): Top dust flaps fold inward
 *   Stage 5 (0.80–1.00): Top tuck cover (P1) folds + lip inserts
 *
 * Geometry owned by this file:
 *   - p13Shape   (front/back panels)
 *   - p24Shape   (side panels)
 *   - glueShape  (glue flap)
 *   - coverShape (tuck cover — used for BOTH top P1 and bottom P3)
 *   - lipShape   (tuck insert lip)
 *   - dustP2Shape / dustP4Shape  (RTE-specific asymmetric dust flap profiles)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo } from "react";
import { Canvas }         from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE         from "three";
import SceneAnimator      from "./SceneAnimator";

import { useBoxStore }         from "../../lib/useBoxStore";
import { generateRTEDieline }  from "../../lib/rteDielineGenerator";

import {
  stageProgress,
  assignMaterialGroups,
  createProceduralTexture,
  buildMaterials,
  LightingPreset,
  buildSceneInstances,
  MappedDecals,
  getPanelWindowHoles,
  useDebouncedDecals
} from "./sharedUtils";

// ─────────────────────────────────────────────────────────────────────────────
// RTE GEOMETRY BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildRTEGeometries(L, W, H, nT, decals, manuL, manuW, manuH, dims) {
  const extrude    = { depth: nT, bevelEnabled: false };
  const coverDepth = W - 2 * nT;
  const lipDepth   = W * (14.25 / 60);

  // ── Panel 1 (front, L × H) ─────────────────────────────────────
  const p1Shape = new THREE.Shape();
  p1Shape.moveTo(-L / 2 - nT, -H / 2);
  p1Shape.lineTo( L / 2 + nT, -H / 2);
  p1Shape.lineTo( L / 2 + nT,  H / 2);
  p1Shape.lineTo(-L / 2 - nT,  H / 2);
  p1Shape.closePath();

  let windowFilmGeomP1 = null;
  const p1Holes = getPanelWindowHoles("p1", decals, p1Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (p1Holes.length > 0) {
    p1Shape.holes.push(...p1Holes);
    windowFilmGeomP1 = new THREE.ShapeGeometry(p1Holes);
  }

  // ── Panel 3 (back, L × H) ──────────────────────────────────────
  const p3Shape = new THREE.Shape();
  p3Shape.moveTo(-L / 2 - nT, -H / 2);
  p3Shape.lineTo( L / 2 + nT, -H / 2);
  p3Shape.lineTo( L / 2 + nT,  H / 2);
  p3Shape.lineTo(-L / 2 - nT,  H / 2);
  p3Shape.closePath();

  let windowFilmGeomP3 = null;
  const p3Holes = getPanelWindowHoles("p3", decals, p3Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (p3Holes.length > 0) {
    p3Shape.holes.push(...p3Holes);
    windowFilmGeomP3 = new THREE.ShapeGeometry(p3Holes);
  }

  // ── Panel 2 & 4 (sides, W × (H−2nT)) ────────────────────────────────────
  const p2Shape = new THREE.Shape();
  p2Shape.moveTo(0, -H / 2 + nT);
  p2Shape.lineTo(W, -H / 2 + nT);
  p2Shape.lineTo(W,  H / 2 - nT);
  p2Shape.lineTo(0,  H / 2 - nT);
  p2Shape.closePath();

  const p4Shape = new THREE.Shape();
  p4Shape.moveTo(0, -H / 2 + nT);
  p4Shape.lineTo(W, -H / 2 + nT);
  p4Shape.lineTo(W,  H / 2 - nT);
  p4Shape.lineTo(0,  H / 2 - nT);
  p4Shape.closePath();

  let windowFilmGeomP2 = null;
  const p2Holes = getPanelWindowHoles("p2", decals, p2Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (p2Holes.length > 0) {
    p2Shape.holes.push(...p2Holes);
    windowFilmGeomP2 = new THREE.ShapeGeometry(p2Holes);
  }

  let windowFilmGeomP4 = null;
  const p4Holes = getPanelWindowHoles("p4", decals, p4Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (p4Holes.length > 0) {
    p4Shape.holes.push(...p4Holes);
    windowFilmGeomP4 = new THREE.ShapeGeometry(p4Holes);
  }

  // ── Glue Flap ─────────────────────────────────────────────────────────────
  const glueFlapW = W * (16 / 60);
  const glueStep  = H * (4.287 / 160);
  const glueShape = new THREE.Shape();
  glueShape.moveTo(0,          H / 2);
  glueShape.lineTo(-glueFlapW, H / 2 - glueStep);
  glueShape.lineTo(-glueFlapW, -H / 2 + glueStep);
  glueShape.lineTo(0,          -H / 2);
  glueShape.closePath();

  let windowFilmGlue = null;
  const glueHoles = getPanelWindowHoles("p1_glue", decals, glueShape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (glueHoles.length > 0) {
    glueShape.holes.push(...glueHoles);
    windowFilmGlue = new THREE.ShapeGeometry(glueHoles);
  }

  // ── Tuck Cover (rectangle) ────────────────────────────────────────────────
  const hw = L / 2;
  function createCoverShape() {
    const s = new THREE.Shape();
    s.moveTo(-hw, 0);
    s.lineTo(-hw, coverDepth);
    s.lineTo( hw, coverDepth);
    s.lineTo( hw, 0);
    s.closePath();
    return s;
  }

  // ── Tuck Insert Lip ───────────────────────────────────────────────────────
  const lipW         = L - 2 * (L * (0.5 / 120));
  const lipStraightH = W * (6.25 / 60);
  const tipR         = W * (8.0 / 60);
  function createLipShape() {
    const s = new THREE.Shape();
    s.moveTo(-lipW / 2, 0);
    s.lineTo(-lipW / 2, lipStraightH);
    s.quadraticCurveTo(-lipW / 2, lipDepth, -lipW / 2 + tipR, lipDepth);
    s.lineTo(lipW / 2 - tipR, lipDepth);
    s.quadraticCurveTo(lipW / 2, lipDepth, lipW / 2, lipStraightH);
    s.lineTo(lipW / 2, 0);
    s.closePath();
    return s;
  }

  // ── RTE Dust Flap Profiles ────────────────────────────────────────────────
  const dW = W;
  const dH = dW * (38 / 60);
  const cStartX = dW / 2 - dW * (17.154 / 60);
  const cEndX = cStartX + dW * (8.769 / 60);
  const cEndY = dH      - dW * (6.975 / 60);

  function createDustP2Shape() {
    const s = new THREE.Shape();
    s.moveTo(-dW / 2 + dW * (1.065 / 60), 0);
    s.lineTo(-dW / 2 + dW * (3.5  / 60), dW * (3.5 / 60));
    s.lineTo(-dW / 2 + dW * (4.5  / 60), dH);
    s.lineTo(cStartX, dH);
    s.quadraticCurveTo(cEndX, dH, cEndX, cEndY);
    s.lineTo(cEndX + dW * (5.085 / 60), cEndY - dW * (22.025 / 60));
    s.lineTo(cEndX + dW * (8.085 / 60), cEndY - dW * (25.025 / 60));
    s.lineTo(dW / 2 - dW * (0.3 / 60),  0);
    s.closePath();
    return s;
  }

  function createDustP4Shape() {
    const s = new THREE.Shape();
    s.moveTo( dW / 2 - dW * (1.065 / 60), 0);
    s.lineTo( dW / 2 - dW * (3.5  / 60), dW * (3.5 / 60));
    s.lineTo( dW / 2 - dW * (4.5  / 60), dH);
    s.lineTo(-cStartX, dH);
    s.quadraticCurveTo(-cEndX, dH, -cEndX, cEndY);
    s.lineTo(-cEndX - dW * (5.085 / 60), cEndY - dW * (22.025 / 60));
    s.lineTo(-cEndX - dW * (8.085 / 60), cEndY - dW * (25.025 / 60));
    s.lineTo(-dW / 2 + dW * (0.3 / 60),  0);
    s.closePath();
    return s;
  }

  const topCoverShape = createCoverShape();
  let windowFilmTopCover = null;
  const topCoverHoles = getPanelWindowHoles("p1_top_cover", decals, topCoverShape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (topCoverHoles.length > 0) { topCoverShape.holes.push(...topCoverHoles); windowFilmTopCover = new THREE.ShapeGeometry(topCoverHoles); }

  const botCoverShape = createCoverShape();
  let windowFilmBotCover = null;
  const botCoverHoles = getPanelWindowHoles("p3_bot_cover", decals, botCoverShape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (botCoverHoles.length > 0) { botCoverShape.holes.push(...botCoverHoles); windowFilmBotCover = new THREE.ShapeGeometry(botCoverHoles); }

  const topLipShape = createLipShape();
  let windowFilmTopLip = null;
  const topLipHoles = getPanelWindowHoles("p1_top_lip", decals, topLipShape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (topLipHoles.length > 0) { topLipShape.holes.push(...topLipHoles); windowFilmTopLip = new THREE.ShapeGeometry(topLipHoles); }

  const botLipShape = createLipShape();
  let windowFilmBotLip = null;
  const botLipHoles = getPanelWindowHoles("p3_bot_lip", decals, botLipShape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (botLipHoles.length > 0) { botLipShape.holes.push(...botLipHoles); windowFilmBotLip = new THREE.ShapeGeometry(botLipHoles); }

  const topDustP2Shape = createDustP2Shape();
  let windowFilmTopDustP2 = null;
  const topDustP2Holes = getPanelWindowHoles("p2_top_dust", decals, topDustP2Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (topDustP2Holes.length > 0) { topDustP2Shape.holes.push(...topDustP2Holes); windowFilmTopDustP2 = new THREE.ShapeGeometry(topDustP2Holes); }

  const botDustP2Shape = createDustP4Shape(); 
  let windowFilmBotDustP2 = null;
  const botDustP2Holes = getPanelWindowHoles("p2_bot_dust", decals, botDustP2Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (botDustP2Holes.length > 0) { botDustP2Shape.holes.push(...botDustP2Holes); windowFilmBotDustP2 = new THREE.ShapeGeometry(botDustP2Holes); }

  const topDustP4Shape = createDustP4Shape();
  let windowFilmTopDustP4 = null;
  const topDustP4Holes = getPanelWindowHoles("p4_top_dust", decals, topDustP4Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (topDustP4Holes.length > 0) { topDustP4Shape.holes.push(...topDustP4Holes); windowFilmTopDustP4 = new THREE.ShapeGeometry(topDustP4Holes); }

  const botDustP4Shape = createDustP2Shape();
  let windowFilmBotDustP4 = null;
  const botDustP4Holes = getPanelWindowHoles("p4_bot_dust", decals, botDustP4Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (botDustP4Holes.length > 0) { botDustP4Shape.holes.push(...botDustP4Holes); windowFilmBotDustP4 = new THREE.ShapeGeometry(botDustP4Holes); }

  const geoms = {
    p1Geom:     new THREE.ExtrudeGeometry(p1Shape,     extrude),
    p3Geom:     new THREE.ExtrudeGeometry(p3Shape,     extrude),
    p2Geom:     new THREE.ExtrudeGeometry(p2Shape,     extrude),
    p4Geom:     new THREE.ExtrudeGeometry(p4Shape,     extrude),
    glueGeom:   new THREE.ExtrudeGeometry(glueShape,   extrude),
    topCoverGeom:  new THREE.ExtrudeGeometry(topCoverShape,  extrude),
    botCoverGeom:  new THREE.ExtrudeGeometry(botCoverShape,  extrude),
    topLipGeom:    new THREE.ExtrudeGeometry(topLipShape,    extrude),
    botLipGeom:    new THREE.ExtrudeGeometry(botLipShape,    extrude),
    topDustP2Geom: new THREE.ExtrudeGeometry(topDustP2Shape, extrude),
    botDustP2Geom: new THREE.ExtrudeGeometry(botDustP2Shape, extrude),
    topDustP4Geom: new THREE.ExtrudeGeometry(topDustP4Shape, extrude),
    botDustP4Geom: new THREE.ExtrudeGeometry(botDustP4Shape, extrude),
    
    windowFilmGeomP1, windowFilmGeomP2, windowFilmGeomP3, windowFilmGeomP4,
    windowFilmTopCover, windowFilmBotCover,
    windowFilmTopLip, windowFilmBotLip,
    windowFilmTopDustP2, windowFilmBotDustP2,
    windowFilmTopDustP4, windowFilmBotDustP4,
    windowFilmGlue
  };

  Object.values(geoms).forEach(g => {
    if (g instanceof THREE.ExtrudeGeometry) assignMaterialGroups(g, nT);
  });

  return { ...geoms, coverDepth, lipDepth };
}

// ─────────────────────────────────────────────────────────────────────────────
// RTE BOX 3D VIEWER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RTEBox3DViewer({
  L = 50,
  W = 30,
  H = 80,
  T = 1,
  progress = 0,
  lightingPreset = "studio",
  decals = [],
  overrideLayout = null,
  zoom = 1,
  activeAnimation = "none",
  colorOverride = null,
  disableZoom = false
}) {
  const store = useBoxStore();
  const nT    = Math.max(0.015, Number(T) || 0.0197);

  // Match 2D SVG dims exactly
  let manuL = L, manuW = W, manuH = H;
  if (store.sizeMode === "inner") {
    manuL = L + 2 * T; manuW = W + 2 * T; manuH = H + 2 * T;
  } else if (store.sizeMode === "outer") {
    manuL = L - 2 * T; manuW = W - 2 * T; manuH = H - 2 * T;
  }

  const dieline = useMemo(() =>
    generateRTEDieline({
      L: manuL, W: manuW, H: manuH, T,
      glueFlapWidth: store.glueFlapWidth,
      bleed: store.bleed,
      method: store.generatorMethod,
    }),
    [manuL, manuW, manuH, T, store.glueFlapWidth, store.bleed, store.generatorMethod]
  );
  const dims = dieline.dimensions;

  // ── 5-stage RTE kinematics ────────────────────────────────────────────────
  const tubeAngle  = stageProgress(progress, 0.00, 0.20) * (Math.PI / 2);
  const bdAngle    = stageProgress(progress, 0.20, 0.40) * (Math.PI / 2);
  const btAngle    = stageProgress(progress, 0.40, 0.60) * (Math.PI / 2);
  const btLipAngle = stageProgress(progress, 0.40, 0.60) * (105 * Math.PI / 180);
  const tdAngle    = stageProgress(progress, 0.60, 0.80) * (Math.PI / 2);
  const ttAngle    = stageProgress(progress, 0.80, 1.00) * (Math.PI / 2);
  const ttLipAngle = stageProgress(progress, 0.80, 1.00) * (105 * Math.PI / 180);

  // ── Geometry ──────────────────────────────────────────────────────────────
  const debouncedDecals = useDebouncedDecals(decals, 150);
  const geoms = useMemo(() => buildRTEGeometries(L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims), [L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims]);
  const { coverDepth } = geoms;

  // ── Texture & Materials ───────────────────────────────────────────────────
  const packageColorToUse = colorOverride || store.packageColor;

  const texture = useMemo(
    () => createProceduralTexture(store.materialCategory, packageColorToUse),
    [store.materialCategory, packageColorToUse]
  );
  const mats = useMemo(
    () => buildMaterials(store.materialCategory, texture, store.insideColor, packageColorToUse),
    [store.materialCategory, texture, store.insideColor, packageColorToUse]
  );
  const flap = mats.flap;
  
  const windowFilmMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#ffffff", transmission: 0.9, opacity: 1, metalness: 0, roughness: 0, ior: 1.5, thickness: 0.01, transparent: true, side: THREE.DoubleSide
  }), []);

  // ── Scene layout ──────────────────────────────────────────────────────────
  const layout         = overrideLayout || store.sceneLayout || "single";
  const sceneInstances = useMemo(
    () => buildSceneInstances(layout, L, W, H),
    [layout, L, W, H]
  );

  // ── Decal shorthand ───────────────────────────────────────────────────────
  const D = (panel) => (
    <MappedDecals
      panel={panel} decals={debouncedDecals}
      L={L} W={W} H={H}
      manuL={manuL} manuW={manuW} manuH={manuH}
      dims={dims} T={T}
    />
  );

  // ── Single box instance ───────────────────────────────────────────────────
  const renderBoxInstance = (key, pos, rot) => (
    <group key={key} position={pos} rotation={rot}>

      {/* ── PANEL 1 (FRONT, L × H) ── */}
      <group name="p1-root" position={[0, 0, -nT]} rotation={[0, 0, 0]}>
        <mesh geometry={geoms.p1Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
          {D("p1")}
        </mesh>
        
        {geoms.windowFilmGeomP1 && (
          <mesh geometry={geoms.windowFilmGeomP1} position={[0, 0, nT / 2]}>
            <meshStandardMaterial 
              transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} 
            />
          </mesh>
        )}

        {/* RTE TOP TUCK: comes from Panel 1 (front) */}
        <group position={[0, H / 2, 0]} rotation={[-ttAngle, 0, 0]}>
          <mesh geometry={geoms.topCoverGeom} material={flap}>{D("p1_top_cover")}</mesh>
          {geoms.windowFilmTopCover && <mesh geometry={geoms.windowFilmTopCover} material={windowFilmMat} />}
          <group position={[0, coverDepth, 0]} rotation={[-ttLipAngle, 0, 0]}>
            <mesh geometry={geoms.topLipGeom} position={[0, 0, -nT]} material={flap}>
              {D("p1_top_lip")}
            </mesh>
            {geoms.windowFilmTopLip && <mesh geometry={geoms.windowFilmTopLip} position={[0, 0, -nT]} material={windowFilmMat} />}
          </group>
        </group>
      </group>

      {/* ── GLUE FLAP ── */}
      <group position={[-L / 2 + nT, 0, -nT]} rotation={[0, -tubeAngle * 0.98, 0]}>
        <mesh geometry={geoms.glueGeom} material={flap}>{D("p1_glue")}</mesh>
        {geoms.windowFilmGlue && <mesh geometry={geoms.windowFilmGlue} material={windowFilmMat} />}
      </group>

      {/* ── PANEL 2 & 4 (RIGHT & LEFT SIDES) ── */}
      <group position={[L / 2, 0, 0]} rotation={[0, tubeAngle, 0]}>
        {/* Panel 2 */}
        <group name="p2-root" position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <mesh geometry={geoms.p2Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
            {D("p2")}
          </mesh>
          {geoms.windowFilmGeomP2 && (
             <mesh geometry={geoms.windowFilmGeomP2} position={[W / 2, 0, nT / 2]}>
               <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
             </mesh>
          )}
          {/* P2 TOP DUST FLAP */}
          <group position={[W / 2, H / 2 - nT, 0]} rotation={[-tdAngle, 0, 0]}>
            <mesh geometry={geoms.topDustP2Geom} material={flap}>{D("p2_top_dust")}</mesh>
            {geoms.windowFilmTopDustP2 && <mesh geometry={geoms.windowFilmTopDustP2} material={windowFilmMat} />}
          </group>
          {/* P2 BOTTOM DUST FLAP */}
          <group position={[W / 2, -H / 2 + nT, 0]} rotation={[bdAngle, 0, 0]}>
            <mesh geometry={geoms.botDustP2Geom} rotation={[0, 0, Math.PI]} material={flap}>
              {D("p2_bot_dust")}
            </mesh>
            {geoms.windowFilmBotDustP2 && <mesh geometry={geoms.windowFilmBotDustP2} rotation={[0, 0, Math.PI]} material={windowFilmMat} />}
          </group>
        </group>

        {/* ── PANEL 3 (BACK, L × H) ── */}
        <group position={[W, 0, 0]} rotation={[0, tubeAngle, 0]}>
          <mesh geometry={geoms.p3Geom} position={[L / 2, 0, -nT]} material={[mats.outside, mats.inside, mats.edge]}>
            {D("p3")}
          </mesh>
          {geoms.windowFilmGeomP3 && (
            <mesh geometry={geoms.windowFilmGeomP3} position={[L/2, 0, nT / 2]}>
              <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* RTE BOTTOM TUCK: comes from Panel 3 (back) */}
          <group position={[L / 2, -H / 2, -nT]} rotation={[btAngle, 0, 0]}>
            <mesh geometry={geoms.botCoverGeom} rotation={[0, 0, Math.PI]} material={flap}>
              {D("p3_bot_cover")}
            </mesh>
            {geoms.windowFilmBotCover && <mesh geometry={geoms.windowFilmBotCover} rotation={[0, 0, Math.PI]} material={windowFilmMat} />}
            <group position={[0, -coverDepth, 0]} rotation={[btLipAngle, 0, 0]}>
              <mesh geometry={geoms.botLipGeom} position={[0, 0, -nT]} rotation={[0, 0, Math.PI]} material={flap}>
                {D("p3_bot_lip")}
              </mesh>
              {geoms.windowFilmBotLip && <mesh geometry={geoms.windowFilmBotLip} position={[0, 0, -nT]} rotation={[0, 0, Math.PI]} material={windowFilmMat} />}
            </group>
          </group>

          {/* ── PANEL 4 (LEFT SIDE, W × H) ── */}
          <group position={[L, 0, 0]} rotation={[0, tubeAngle, 0]}>
            <mesh geometry={geoms.p4Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
              {D("p4")}
            </mesh>
            {geoms.windowFilmGeomP4 && (
              <mesh geometry={geoms.windowFilmGeomP4} position={[W / 2, 0, nT / 2]}>
                <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* P4 TOP DUST FLAP */}
            <group position={[W / 2, H / 2 - nT, 0]} rotation={[-tdAngle, 0, 0]}>
              <mesh geometry={geoms.topDustP4Geom} material={flap}>{D("p4_top_dust")}</mesh>
              {geoms.windowFilmTopDustP4 && <mesh geometry={geoms.windowFilmTopDustP4} material={windowFilmMat} />}
            </group>

            {/* P4 BOTTOM DUST FLAP */}
            <group position={[W / 2, -H / 2 + nT, 0]} rotation={[bdAngle, 0, 0]}>
              <mesh geometry={geoms.botDustP4Geom} rotation={[0, 0, Math.PI]} material={flap}>
                {D("p4_bot_dust")}
              </mesh>
              {geoms.windowFilmBotDustP4 && <mesh geometry={geoms.windowFilmBotDustP4} rotation={[0, 0, Math.PI]} material={windowFilmMat} />}
            </group>
          </group>
        </group>
      </group>

    </group>
  );

  // ── Camera ────────────────────────────────────────────────────────────────
  const camPos = [L * 1.15, H * 0.55, W * 3.2];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: camPos, fov: 38, zoom }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        shadows
      >
        <Environment preset="city" />
        <LightingPreset preset={lightingPreset} />
        <ContactShadows position={[0, -H/2 - 0.02, 0]} opacity={0.5} scale={Math.max(L, W) * 4} blur={2.5} far={4} />

        <SceneAnimator activeAnimation={activeAnimation}>
          <group rotation={layout !== "single" ? [Math.PI / 6, -Math.PI / 4, 0] : [0, 0, 0]}>
            {sceneInstances.map(inst => renderBoxInstance(inst.key, inst.pos, inst.rot))}
          </group>
        </SceneAnimator>

        <OrbitControls
          enableZoom={!disableZoom}
          enablePan={false}
          minDistance={W * 1.5}
          maxDistance={Math.max(L, H) * 5}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.88}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
