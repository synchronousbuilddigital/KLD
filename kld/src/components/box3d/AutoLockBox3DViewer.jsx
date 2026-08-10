import React, { useMemo } from "react";
import { Canvas }         from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE         from "three";
import SceneAnimator      from "./SceneAnimator";

import { useBoxStore }          from "../../lib/useBoxStore";
import { generateAutoLockDieline } from "../../lib/autoLockDielineGenerator";

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
// GEOMETRY BUILDER — matched EXACTLY to autoLockDielineGenerator.js
// ─────────────────────────────────────────────────────────────────────────────
function buildAutoLockGeometries(L, W, H, nT, decals, manuL, manuW, manuH, dims) {
  const extrude = { depth: nT, bevelEnabled: false };

  // Template reference
  const L_tpl = 120.6;
  const W_tpl =  60.6;

  // ── MAIN PANELS ────────────────────────────────────────────────────────────
  const p1Shape = new THREE.Shape();
  p1Shape.moveTo(-L / 2, -H / 2);
  p1Shape.lineTo( L / 2, -H / 2);
  p1Shape.lineTo( L / 2,  H / 2);
  p1Shape.lineTo(-L / 2,  H / 2);
  p1Shape.closePath();

  const p3Shape = new THREE.Shape();
  p3Shape.moveTo(-L / 2, -H / 2);
  p3Shape.lineTo( L / 2, -H / 2);
  p3Shape.lineTo( L / 2,  H / 2);
  p3Shape.lineTo(-L / 2,  H / 2);
  p3Shape.closePath();

  let windowFilmGeomP1 = null;
  const p1Holes = getPanelWindowHoles("p1", decals, p1Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (p1Holes.length > 0) {
    p1Shape.holes.push(...p1Holes);
    windowFilmGeomP1 = new THREE.ShapeGeometry(p1Holes);
  }

  let windowFilmGeomP3 = null;
  const p3Holes = getPanelWindowHoles("p3", decals, p3Shape, L, W, H, manuL, manuW, manuH, dims, nT);
  if (p3Holes.length > 0) {
    p3Shape.holes.push(...p3Holes);
    windowFilmGeomP3 = new THREE.ShapeGeometry(p3Holes);
  }

  const p2Shape = new THREE.Shape();
  p2Shape.moveTo(0,  -H / 2 + nT);
  p2Shape.lineTo(W,  -H / 2 + nT);
  p2Shape.lineTo(W,   H / 2 - nT);
  p2Shape.lineTo(0,   H / 2 - nT);
  p2Shape.closePath();

  const p4Shape = new THREE.Shape();
  p4Shape.moveTo(0,  -H / 2 + nT);
  p4Shape.lineTo(W,  -H / 2 + nT);
  p4Shape.lineTo(W,   H / 2 - nT);
  p4Shape.lineTo(0,   H / 2 - nT);
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

  // ── PARAMETRIC PROPORTIONS (Matching the Pacdora brown box) ────────────────
  const dH = W * 0.6;
  const coverH = W * 0.98;
  const lipH = W * 0.25;
  const gW = L * 0.15;
  const depth = W * 0.75;

  // ── GLUE FLAP ──────────────────────────────────────────────────────────────
  const chamferTop = H * 0.03;
  const chamferBot = H * 0.09;
  const glueShape = new THREE.Shape();
  glueShape.moveTo(0,   H / 2);
  glueShape.lineTo(-gW, H / 2 - chamferTop);
  glueShape.lineTo(-gW, -H / 2 + chamferBot);
  glueShape.lineTo(0,   -H / 2);
  glueShape.closePath();

  // ── TOP TUCK COVER ─────────────────────────────────────────────────────────
  const coverShape = new THREE.Shape();
  coverShape.moveTo(-L / 2, 0);
  coverShape.lineTo(-L / 2, coverH);
  coverShape.lineTo( L / 2, coverH);
  coverShape.lineTo( L / 2, 0);
  coverShape.closePath();

  // ── TOP LIP ────────────────────────────────────────────────────────────────
  const lipShape = new THREE.Shape();
  lipShape.moveTo(-L / 2, 0);
  lipShape.lineTo(-L / 2 + L * 0.05, 0);
  lipShape.lineTo(-L / 2 + L * 0.05, lipH - L * 0.05);
  lipShape.quadraticCurveTo(-L / 2 + L * 0.05, lipH, -L / 2 + L * 0.1, lipH);
  lipShape.lineTo( L / 2 - L * 0.1, lipH);
  lipShape.quadraticCurveTo( L / 2 - L * 0.05, lipH, L / 2 - L * 0.05, lipH - L * 0.05);
  lipShape.lineTo( L / 2 - L * 0.05, 0);
  lipShape.lineTo( L / 2, 0);
  lipShape.closePath();

  // ── TOP DUST FLAPS (ASYMMETRICAL) ──────────────────────────────────────────
  const dustShape = new THREE.Shape();
  dustShape.moveTo(0, 0);
  dustShape.lineTo(W * 0.15, dH);
  dustShape.lineTo(W, dH);
  dustShape.lineTo(W, 0);
  dustShape.closePath();

  // ── BOTTOM CRASH-LOCK FLAPS (P1 & P3) ──────────────────────────────────────
  const makeP1Shape = () => {
    const s = new THREE.Shape();
    s.moveTo(-L / 2, 0);
    s.lineTo(-L / 2 + L * 0.15, -depth);
    s.lineTo(-L / 2 + L * 0.6, -depth);
    s.lineTo(-L / 2 + L * 0.6, -depth * 0.4);
    s.lineTo(-L / 2 + L * 0.8, -depth * 0.4);
    s.lineTo(-L / 2 + L * 0.8, -depth * 0.1);
    s.lineTo( L / 2, 0);
    s.closePath();
    return s;
  };

  const makeP3Shape = () => {
    const s = new THREE.Shape();
    s.moveTo(-L / 2, 0);
    s.lineTo(-L / 2 + L * 0.2, -depth * 0.1);
    s.lineTo(-L / 2 + L * 0.2, -depth * 0.4);
    s.lineTo(-L / 2 + L * 0.4, -depth * 0.4);
    s.lineTo(-L / 2 + L * 0.4, -depth);
    s.lineTo(-L / 2 + L * 0.85, -depth);
    s.lineTo( L / 2, 0);
    s.closePath();
    return s;
  };

  // ── BOTTOM GUSSETS (P2 & P4) ───────────────────────────────────────────────
  const makeGussetShape = () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(W * 0.2, -depth * 0.8);
    s.lineTo(W * 0.6, -depth * 0.8);
    s.lineTo(W, 0);
    s.closePath();
    return s;
  };

  const geoms = {
    p1Geom:    new THREE.ExtrudeGeometry(p1Shape,      extrude),
    p3Geom:    new THREE.ExtrudeGeometry(p3Shape,      extrude),
    p2Geom:    new THREE.ExtrudeGeometry(p2Shape,      extrude),
    p4Geom:    new THREE.ExtrudeGeometry(p4Shape,      extrude),
    glueGeom:  new THREE.ExtrudeGeometry(glueShape,    extrude),
    coverGeom: new THREE.ExtrudeGeometry(coverShape,   extrude),
    lipGeom:   new THREE.ExtrudeGeometry(lipShape,     extrude),
    dustGeom:  new THREE.ExtrudeGeometry(dustShape,    extrude),
    p1BotGeom: new THREE.ExtrudeGeometry(makeP1Shape(), extrude),
    p3BotGeom: new THREE.ExtrudeGeometry(makeP3Shape(), extrude),
    p2BotGeom: new THREE.ExtrudeGeometry(makeGussetShape(), extrude),
    p4BotGeom: new THREE.ExtrudeGeometry(makeGussetShape(), extrude),
    windowFilmGeomP1, windowFilmGeomP2, windowFilmGeomP3, windowFilmGeomP4
  };

  Object.values(geoms).forEach(g => {
    if (g instanceof THREE.ExtrudeGeometry) assignMaterialGroups(g, nT);
  });
  return { ...geoms, coverH };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AutoLockBox3DViewer({
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

  let manuL = L, manuW = W, manuH = H;
  if (store.sizeMode === "inner") {
    manuL = L + 2 * T; manuW = W + 2 * T; manuH = H + 2 * T;
  } else if (store.sizeMode === "outer") {
    manuL = L - 2 * T; manuW = W - 2 * T; manuH = H - 2 * T;
  }

  const dieline = useMemo(() =>
    generateAutoLockDieline({
      L: manuL, W: manuW, H: manuH, T,
      glueFlapWidth: store.glueFlapWidth,
      bleed: store.bleed,
    }),
    [manuL, manuW, manuH, T, store.glueFlapWidth, store.bleed]
  );
  const dims = dieline.dimensions;

  // ─────────────────────────────────────────────────────────────────────────────
  // KINEMATICS
  // ─────────────────────────────────────────────────────────────────────────────
  const tubeAngle   = stageProgress(progress, 0.00, 0.20) * (Math.PI / 2);
  const p1BotAngle  = stageProgress(progress, 0.20, 0.45) * (Math.PI / 2);
  const p3BotAngle  = stageProgress(progress, 0.20, 0.45) * (Math.PI / 2 + 5 * Math.PI / 180);
  const p24BotAngle = stageProgress(progress, 0.25, 0.48) * (Math.PI / 2);
  const tdAngle     = stageProgress(progress, 0.48, 0.65) * (Math.PI / 2);
  const coverAngle  = stageProgress(progress, 0.65, 0.83) * (Math.PI / 2);
  const lipAngle    = stageProgress(progress, 0.83, 1.00) * (105 * Math.PI / 180);

  const debouncedDecals = useDebouncedDecals(decals, 150);
  const geoms = useMemo(() => buildAutoLockGeometries(L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims), [L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims]);
  const { glueGeom, coverGeom, lipGeom,
          dustGeom, p1BotGeom, p3BotGeom, p2BotGeom, p4BotGeom, coverH } = geoms;

  const texture = useMemo(
    () => createProceduralTexture(store.materialCategory, store.packageColor),
    [store.materialCategory, store.packageColor]
  );
  
  const mats = useMemo(
    () => buildMaterials(store.materialCategory, texture, store.insideColor, store.packageColor),
    [store.materialCategory, texture, store.insideColor, store.packageColor]
  );
  const flap = mats.flap;

  const layout = overrideLayout || store.sceneLayout || "single";
  const sceneInstances = useMemo(
    () => buildSceneInstances(layout, L, W, H),
    [layout, L, W, H]
  );

  const D = (panel) => (
    <MappedDecals
      panel={panel} decals={debouncedDecals}
      L={L} W={W} H={H}
      manuL={manuL} manuW={manuW} manuH={manuH}
      dims={dims} T={T}
    />
  );

  const renderBoxInstance = (key, pos, rot) => (
    <group key={key} position={pos} rotation={rot}>

      {/* ── P1  FRONT PANEL ─────────────────────────────────────────────── */}
      <group position={[0, 0, -nT]}>
        <mesh geometry={geoms.p1Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
          {D("p1")}
        </mesh>
        
        {geoms.windowFilmGeomP1 && (
          <mesh geometry={geoms.windowFilmGeomP1} position={[0, 0, nT / 2]}>
            <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
        )}

        <group position={[0, -H / 2, 0]} rotation={[p1BotAngle, 0, 0]}>
          <mesh geometry={p1BotGeom} material={flap}>{D("p1_bot_auto")}</mesh>
        </group>
      </group>

      {/* ── GLUE FLAP ───────────────────────────────────────────────────── */}
      <group position={[-L / 2 + nT, 0, -nT]} rotation={[0, -tubeAngle * 0.98, 0]}>
        <mesh geometry={glueGeom} material={flap}>{D("p1_glue")}</mesh>
      </group>

      {/* ── TOP COVER & LIP ─────────────────────────────────────────────── */}
      <group position={[0, H / 2 - nT, 0]} rotation={[coverAngle, 0, 0]}>
        <mesh geometry={coverGeom} material={flap}>{D("p1_cover")}</mesh>
        <group position={[0, coverH, 0]} rotation={[lipAngle, 0, 0]}>
          <mesh geometry={lipGeom} material={flap}>{D("p1_lip")}</mesh>
        </group>
      </group>

      {/* ── P2  RIGHT SIDE PANEL ────────────────────────────────────────── */}
      <group position={[L / 2, 0, 0]} rotation={[0, tubeAngle, 0]}>
        <mesh geometry={geoms.p2Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
          {D("p2")}
        </mesh>
        {geoms.windowFilmGeomP2 && (
          <mesh geometry={geoms.windowFilmGeomP2} position={[W / 2, 0, nT / 2]}>
            <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
        )}

        <group position={[W / 2, H / 2 - nT, 0]} rotation={[-tdAngle, 0, 0]}>
          <mesh geometry={dustGeom} material={flap}>{D("p2_top_dust")}</mesh>
        </group>

        {/* P2 BOTTOM GUSSET — note the Math.PI rotation so it folds INTO the box */}
        <group position={[W / 2, -H / 2 + nT, 0]} rotation={[p24BotAngle, 0, 0]}>
          <mesh geometry={p2BotGeom} rotation={[0, 0, Math.PI]} material={flap}>{D("p2_bot_auto")}</mesh>
        </group>

        {/* ── P3  BACK PANEL ────────────────────────────────────────────── */}
        <group position={[W, 0, 0]} rotation={[0, tubeAngle, 0]}>
          <mesh geometry={geoms.p3Geom} position={[L / 2, 0, -nT]} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
            {D("p3")}
          </mesh>
          {geoms.windowFilmGeomP3 && (
            <mesh geometry={geoms.windowFilmGeomP3} position={[L/2, 0, nT / 2]}>
              <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* P3 BOTTOM LOCK FLAP — folds to 95° to tuck UNDER P1 */}
          <group position={[L / 2, -H / 2, -nT]} rotation={[p3BotAngle, 0, 0]}>
            <mesh geometry={p3BotGeom} position={[0, 0, nT * 2]} material={flap}>
              {D("p3_bot_auto")}
            </mesh>
          </group>

          {/* ── P4  LEFT SIDE PANEL ───────────────────────────────────── */}
          <group position={[L, 0, 0]} rotation={[0, tubeAngle, 0]}>
            <mesh geometry={geoms.p4Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
              {D("p4")}
            </mesh>
            {geoms.windowFilmGeomP4 && (
              <mesh geometry={geoms.windowFilmGeomP4} position={[W / 2, 0, nT / 2]}>
                <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
              </mesh>
            )}

            <group position={[W / 2, H / 2 - nT, 0]} rotation={[-tdAngle, 0, 0]}>
              <mesh geometry={dustGeom} rotation={[0, Math.PI, 0]} material={flap}>
                {D("p4_top_dust")}
              </mesh>
            </group>

            {/* P4 BOTTOM GUSSET */}
            <group position={[W / 2, -H / 2 + nT, 0]} rotation={[p24BotAngle, 0, 0]}>
              <mesh geometry={p4BotGeom} rotation={[0, 0, Math.PI]} material={flap}>{D("p4_bot_auto")}</mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );

  const boxCenterZ = -W / 2;
  const camPos     = [L * 1.1, H * 1.2, W * 1.8];
  const camTarget  = [0, 0, boxCenterZ];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas camera={{ position: camPos, fov: 40, zoom }} gl={{ preserveDrawingBuffer: true, antialias: true }} shadows>
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
          maxDistance={Math.max(L, H) * 6}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.92}
          target={camTarget}
        />
      </Canvas>
    </div>
  );
}

