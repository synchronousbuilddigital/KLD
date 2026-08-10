/**
 * TEBox3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3D viewer exclusively for Tuck End (TE) boxes.
 *
 * TE kinematics (5 stages):
 *   Stage 1 (0.00–0.20): Sleeve tube forms
 *   Stage 2 (0.20–0.40): Bottom dust flaps fold inward
 *   Stage 3 (0.40–0.60): Bottom tuck cover (P3) folds + lip inserts
 *   Stage 4 (0.60–0.80): Top dust flaps fold inward
 *   Stage 5 (0.80–1.00): Top tuck cover (P3) folds + lip inserts
 *
 * Key TE difference from RTE:
 *   - BOTH tuck covers (top AND bottom) come from Panel 3 (back panel).
 *   - Panel 1 (front) has NO tuck panel — it is a plain face panel.
 *   - Dust flap geometry uses a clean symmetric trapezoid (no asymmetric notch
 *     needed because both tuck covers approach from the same direction — P3).
 *
 * Geometry owned by this file:
 *   - p13Shape    (front/back panels)
 *   - p24Shape    (side panels)
 *   - glueShape   (glue flap)
 *   - coverShape  (tuck cover, used for both top and bottom on P3)
 *   - lipShape    (tuck insert lip)
 *   - teDustShape (TE symmetric dust flap — corner clips at free edge)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo } from "react";
import { Canvas }          from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE          from "three";
import SceneAnimator       from "./SceneAnimator";

import { useBoxStore }           from "../../lib/useBoxStore";
import { generateTEDielineDXF }  from "../../lib/teDielineGenerator";

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
// TE GEOMETRY BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildTEGeometries(L, W, H, nT, decals, manuL, manuW, manuH, dims) {
  const extrude    = { depth: nT, bevelEnabled: false };
  const coverDepth = W - 2 * nT;
  const lipDepth   = W * (14.25 / 60);

  // ── Panel 1 (front, L × H) ──────────────────────────────────────
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
  glueShape.moveTo(0,         H / 2);
  glueShape.lineTo(-glueFlapW, H / 2 - glueStep);
  glueShape.lineTo(-glueFlapW, -H / 2 + glueStep);
  glueShape.lineTo(0,         -H / 2);
  glueShape.closePath();

  // ── Tuck Cover (rectangle, same for top & bottom) ────────────────────────
  const hw = L / 2;
  const coverShape = new THREE.Shape();
  coverShape.moveTo(-hw, 0);
  coverShape.lineTo(-hw, coverDepth);
  coverShape.lineTo( hw, coverDepth);
  coverShape.lineTo( hw, 0);
  coverShape.closePath();

  // ── Tuck Insert Lip ───────────────────────────────────────────────────────
  const lipW         = L - 2 * (L * (0.5 / 120));
  const lipStraightH = W * (6.25 / 60);
  const tipR         = W * (8.0 / 60);
  const lipShape     = new THREE.Shape();
  lipShape.moveTo(-lipW / 2, 0);
  lipShape.lineTo(-lipW / 2, lipStraightH);
  lipShape.quadraticCurveTo(-lipW / 2, lipDepth, -lipW / 2 + tipR, lipDepth);
  lipShape.lineTo(lipW / 2 - tipR, lipDepth);
  lipShape.quadraticCurveTo(lipW / 2, lipDepth, lipW / 2, lipStraightH);
  lipShape.lineTo(lipW / 2, 0);
  lipShape.closePath();

  // ── TE Dust Flap — SAME asymmetric profile as RTE (Pacdora uses identical shape) ──
  // Both TE and RTE use the same dust flap profile. The only TE difference is
  // that BOTH tuck covers come from P3, not from P1 (top) and P3 (bottom).
  const dustP2Shape = new THREE.Shape();
  const dW = W;
  const dH = dW * (38 / 60);

  dustP2Shape.moveTo(-dW / 2 + dW * (1.065 / 60), 0);
  dustP2Shape.lineTo(-dW / 2 + dW * (3.5  / 60), dW * (3.5 / 60));
  dustP2Shape.lineTo(-dW / 2 + dW * (4.5  / 60), dH);

  const cStartX = dW / 2 - dW * (17.154 / 60);
  dustP2Shape.lineTo(cStartX, dH);

  const cEndX = cStartX + dW * (8.769 / 60);
  const cEndY = dH      - dW * (6.975 / 60);
  dustP2Shape.quadraticCurveTo(cEndX, dH, cEndX, cEndY);

  dustP2Shape.lineTo(cEndX + dW * (5.085 / 60), cEndY - dW * (22.025 / 60));
  dustP2Shape.lineTo(cEndX + dW * (8.085 / 60), cEndY - dW * (25.025 / 60));
  dustP2Shape.lineTo(dW / 2 - dW * (0.3 / 60),  0);
  dustP2Shape.closePath();

  // Exact X-mirror for Panel 4 side
  const dustP4Shape = new THREE.Shape();
  dustP4Shape.moveTo( dW / 2 - dW * (1.065 / 60), 0);
  dustP4Shape.lineTo( dW / 2 - dW * (3.5  / 60), dW * (3.5 / 60));
  dustP4Shape.lineTo( dW / 2 - dW * (4.5  / 60), dH);
  dustP4Shape.lineTo(-cStartX, dH);
  dustP4Shape.quadraticCurveTo(-cEndX, dH, -cEndX, cEndY);
  dustP4Shape.lineTo(-cEndX - dW * (5.085 / 60), cEndY - dW * (22.025 / 60));
  dustP4Shape.lineTo(-cEndX - dW * (8.085 / 60), cEndY - dW * (25.025 / 60));
  dustP4Shape.lineTo(-dW / 2 + dW * (0.3 / 60),  0);
  dustP4Shape.closePath();

  const geoms = {
    p1Geom:     new THREE.ExtrudeGeometry(p1Shape,     extrude),
    p3Geom:     new THREE.ExtrudeGeometry(p3Shape,     extrude),
    p2Geom:     new THREE.ExtrudeGeometry(p2Shape,     extrude),
    p4Geom:     new THREE.ExtrudeGeometry(p4Shape,     extrude),
    glueGeom:   new THREE.ExtrudeGeometry(glueShape,   extrude),
    coverGeom:  new THREE.ExtrudeGeometry(coverShape,  extrude),
    lipGeom:    new THREE.ExtrudeGeometry(lipShape,    extrude),
    dustP2Geom: new THREE.ExtrudeGeometry(dustP2Shape, extrude),
    dustP4Geom: new THREE.ExtrudeGeometry(dustP4Shape, extrude),
    windowFilmGeomP1, windowFilmGeomP2, windowFilmGeomP3, windowFilmGeomP4
  };

  Object.values(geoms).forEach(g => {
    if (g instanceof THREE.ExtrudeGeometry) assignMaterialGroups(g, nT);
  });

  return { ...geoms, coverDepth, lipDepth };
}

// ─────────────────────────────────────────────────────────────────────────────
// TE BOX 3D VIEWER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TEBox3DViewer({
  L = 100,
  W = 50,
  H = 150,
  T = 1.5,
  progress = 1,
  zoom = 1,
  lightingPreset = "studio",
  decals = [],
  overrideLayout = null,
  activeAnimation = "none"
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
    generateTEDielineDXF({
      L: manuL, W: manuW, H: manuH, T,
      glueFlapWidth: store.glueFlapWidth,
      bleed: store.bleed,
    }),
    [manuL, manuW, manuH, T, store.glueFlapWidth, store.bleed]
  );
  const dims = dieline.dimensions;

  // ── 5-stage TE kinematics ─────────────────────────────────────────────────
  // Stage 1 (0.00–0.20): Sleeve tube forms
  const tubeAngle  = stageProgress(progress, 0.00, 0.20) * (Math.PI / 2);
  // Stage 2 (0.20–0.40): Bottom dust flaps
  const bdAngle    = stageProgress(progress, 0.20, 0.40) * (Math.PI / 2);
  // Stage 3 (0.40–0.60): Bottom tuck cover (P3) + lip
  const btAngle    = stageProgress(progress, 0.40, 0.60) * (Math.PI / 2);
  const btLipAngle = stageProgress(progress, 0.40, 0.60) * (105 * Math.PI / 180);
  // Stage 4 (0.60–0.80): Top dust flaps
  const tdAngle    = stageProgress(progress, 0.60, 0.80) * (Math.PI / 2);
  // Stage 5 (0.80–1.00): Top tuck cover (P3) + lip
  const ttAngle    = stageProgress(progress, 0.80, 1.00) * (Math.PI / 2);
  const ttLipAngle = stageProgress(progress, 0.80, 1.00) * (105 * Math.PI / 180);

  // ── Geometry ──────────────────────────────────────────────────────────────
  const debouncedDecals = useDebouncedDecals(decals, 150);
  const geoms = useMemo(() => buildTEGeometries(L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims), [L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims]);
  const { coverGeom, lipGeom, coverDepth } = geoms;

  // ── Texture & Materials ───────────────────────────────────────────────────
  const texture = useMemo(
    () => createProceduralTexture(store.materialCategory, store.packageColor),
    [store.materialCategory, store.packageColor]
  );
  
  const mats = useMemo(
    () => buildMaterials(store.materialCategory, texture, store.insideColor, store.packageColor),
    [store.materialCategory, texture, store.insideColor, store.packageColor]
  );
  const flap = mats.flap;

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

      {/* ── PANEL 1 (FRONT, L × H) — TE: plain face, no tuck panel ── */}
      <group position={[0, 0, -nT]}>
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
      </group>

      {/* ── GLUE FLAP ── */}
      <group position={[-L / 2 + nT, 0, -nT]} rotation={[0, -tubeAngle * 0.98, 0]}>
        <mesh geometry={geoms.glueGeom} material={flap}>{D("p1_glue")}</mesh>
      </group>

      {/* ── PANEL 2 (RIGHT SIDE, W × H) ── */}
      <group position={[L / 2, 0, 0]} rotation={[0, tubeAngle, 0]}>
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
          <mesh geometry={geoms.dustP4Geom} material={flap}>{D("p2_top_dust")}</mesh>
        </group>

        {/* P2 BOTTOM DUST FLAP */}
        <group position={[W / 2, -H / 2 + nT, 0]} rotation={[bdAngle, 0, 0]}>
          <mesh geometry={geoms.dustP2Geom} rotation={[0, 0, Math.PI]} material={flap}>
            {D("p2_bot_dust")}
          </mesh>
        </group>

        {/* ── PANEL 3 (BACK, L × H) — TE: owns BOTH top and bottom tuck ── */}
        <group position={[W, 0, 0]} rotation={[0, tubeAngle, 0]}>
          <mesh geometry={geoms.p3Geom} position={[L / 2, 0, -nT]} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
            {D("p3")}
          </mesh>
          {geoms.windowFilmGeomP3 && (
            <mesh geometry={geoms.windowFilmGeomP3} position={[L/2, 0, nT / 2]}>
              <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* TE BOTTOM TUCK (from P3) */}
          <group position={[L / 2, -H / 2, -nT]} rotation={[btAngle, 0, 0]}>
            <mesh geometry={coverGeom} rotation={[0, 0, Math.PI]} material={flap}>
              {D("p3_bot_cover")}
            </mesh>
            <group position={[0, -coverDepth, 0]} rotation={[btLipAngle, 0, 0]}>
              <mesh geometry={lipGeom} position={[0, 0, -nT]} rotation={[0, 0, Math.PI]} material={flap}>
                {D("p3_bot_lip")}
              </mesh>
            </group>
          </group>

          {/* TE TOP TUCK (from P3) */}
          <group position={[L / 2, H / 2, -nT]} rotation={[-ttAngle, 0, 0]}>
            <mesh geometry={coverGeom} material={flap}>{D("p3_top_cover")}</mesh>
            <group position={[0, coverDepth, 0]} rotation={[-ttLipAngle, 0, 0]}>
              <mesh geometry={lipGeom} position={[0, 0, -nT]} material={flap}>
                {D("p3_top_lip")}
              </mesh>
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
              <mesh geometry={geoms.dustP2Geom} material={flap}>{D("p4_top_dust")}</mesh>
            </group>

            {/* P4 BOTTOM DUST FLAP */}
            <group position={[W / 2, -H / 2 + nT, 0]} rotation={[bdAngle, 0, 0]}>
              <mesh geometry={geoms.dustP4Geom} rotation={[0, 0, Math.PI]} material={flap}>
                {D("p4_bot_dust")}
              </mesh>
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
