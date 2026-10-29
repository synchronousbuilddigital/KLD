/**
 * RSCBox3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3D viewer for Square Shipping Box (RSC).
 * Standard corrugated shipping container with 4 body panels, glue flap,
 * and 4 top and bottom flaps that meet in the center when folded.
 *
 * Kinematics (3 stages):
 *   Stage 1 (0.00–0.40): Sleeve tube forms (Right, Back, Left & Glue fold 90°)
 *   Stage 2 (0.40–0.70): Minor flaps fold inward (Side panels P2 & P4 top/bot)
 *   Stage 3 (0.70–1.00): Major flaps fold inward to seal (Front & Back P1 & P3)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import SceneAnimator from "./SceneAnimator";

import { useBoxStore } from "../../lib/useBoxStore";
import { generateRSCDielineDXF } from "../../lib/rscDielineGenerator";

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
// RSC GEOMETRY BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildRSCGeometries(L, W, H, nT, decals, manuL, manuW, manuH, dims) {
  const extrude = { depth: nT, bevelEnabled: false };
  const flapH = W / 2;
  const flapExtrude = { depth: nT, bevelEnabled: false };

  // ── Panel 1 (Front, L × H) ──────────────────────────────────────
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

  // ── Panel 3 (Back, L × H) ───────────────────────────────────────
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

  // ── Panel 2 (Right, W × H) & Panel 4 (Left, W × H) ─────────────
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

  // ── Glue Flap ──────────────────────────────────────────────────
  const glueFlapW = Math.max(0.75, Math.min(1.5, W * 0.2));
  const glueChamfer = Math.min(glueFlapW * 0.4, H * 0.08);
  const glueShape = new THREE.Shape();
  glueShape.moveTo(0,          H / 2);
  glueShape.lineTo(-glueFlapW, H / 2 - glueChamfer);
  glueShape.lineTo(-glueFlapW, -H / 2 + glueChamfer);
  glueShape.lineTo(0,          -H / 2);
  glueShape.closePath();

  // ── Major Flaps (Front P1 & Back P3, width L, height flapH) ───
  function createMajorFlapShape() {
    const s = new THREE.Shape();
    const slotPad = Math.max(0.02, nT * 0.5);
    const hw = L / 2 - slotPad;
    s.moveTo(-hw, 0);
    s.lineTo( hw, 0);
    s.lineTo( hw, flapH);
    s.lineTo(-hw, flapH);
    s.closePath();
    return s;
  }

  // ── Minor Flaps (Sides P2 & P4, width W, height flapH) ─────────
  function createMinorFlapShape() {
    const s = new THREE.Shape();
    const slotPad = Math.max(0.04, nT);
    const hw = W / 2 - slotPad;
    s.moveTo(-hw, 0);
    s.lineTo( hw, 0);
    s.lineTo( hw, flapH);
    s.lineTo(-hw, flapH);
    s.closePath();
    return s;
  }

  const p1TopFlapShape = createMajorFlapShape();
  const p1BotFlapShape = createMajorFlapShape();
  const p3TopFlapShape = createMajorFlapShape();
  const p3BotFlapShape = createMajorFlapShape();

  const p2TopFlapShape = createMinorFlapShape();
  const p2BotFlapShape = createMinorFlapShape();
  const p4TopFlapShape = createMinorFlapShape();
  const p4BotFlapShape = createMinorFlapShape();

  const geoms = {
    p1Geom: new THREE.ExtrudeGeometry(p1Shape, extrude),
    p2Geom: new THREE.ExtrudeGeometry(p2Shape, extrude),
    p3Geom: new THREE.ExtrudeGeometry(p3Shape, extrude),
    p4Geom: new THREE.ExtrudeGeometry(p4Shape, extrude),
    glueGeom: new THREE.ExtrudeGeometry(glueShape, extrude),

    p1TopFlapGeom: new THREE.ExtrudeGeometry(p1TopFlapShape, flapExtrude),
    p1BotFlapGeom: new THREE.ExtrudeGeometry(p1BotFlapShape, flapExtrude),
    p3TopFlapGeom: new THREE.ExtrudeGeometry(p3TopFlapShape, flapExtrude),
    p3BotFlapGeom: new THREE.ExtrudeGeometry(p3BotFlapShape, flapExtrude),

    p2TopFlapGeom: new THREE.ExtrudeGeometry(p2TopFlapShape, flapExtrude),
    p2BotFlapGeom: new THREE.ExtrudeGeometry(p2BotFlapShape, flapExtrude),
    p4TopFlapGeom: new THREE.ExtrudeGeometry(p4TopFlapShape, flapExtrude),
    p4BotFlapGeom: new THREE.ExtrudeGeometry(p4BotFlapShape, flapExtrude),

    windowFilmGeomP1, windowFilmGeomP2, windowFilmGeomP3, windowFilmGeomP4
  };

  Object.values(geoms).forEach(g => {
    if (g instanceof THREE.ExtrudeGeometry) assignMaterialGroups(g, nT);
  });

  return { ...geoms, flapH };
}

// ─────────────────────────────────────────────────────────────────────────────
// RSC BOX 3D VIEWER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RSCBox3DViewer({
  L = 12.0079,
  W = 12.0079,
  H = 12.0079,
  T = 0.1181,
  progress = 1,
  zoom = 1,
  lightingPreset = "studio",
  decals = [],
  overrideLayout = null,
  activeAnimation = "none",
  colorOverride = null,
  disableZoom = false,
  useStore = useBoxStore,
  showWatermark = false
}) {
  const store = useStore();
  const nT = Math.max(0.02, Number(T) || 0.1181);

  // Match 2D SVG dims exactly
  let manuL = L, manuW = W, manuH = H;
  if (store.sizeMode === "inner") {
    manuL = L + 2 * T; manuW = W + 2 * T; manuH = H + 2 * T;
  } else if (store.sizeMode === "outer") {
    manuL = L - 2 * T; manuW = W - 2 * T; manuH = H - 2 * T;
  }

  const dieline = useMemo(() =>
    generateRSCDielineDXF({
      L: manuL, W: manuW, H: manuH, T,
      glueFlapWidth: store.glueFlapWidth || 1.25,
      bleed: store.bleed || 0.125
    }),
    [manuL, manuW, manuH, T, store.glueFlapWidth, store.bleed]
  );
  const dims = dieline.dimensions;

  // ── RSC Kinematics (3 stages) ─────────────────────────────────────────────
  // Stage 1 (0.00–0.40): Tube forms
  const tubeAngle = stageProgress(progress, 0.00, 0.40) * (Math.PI / 2);

  // Stage 2 (0.40–0.70): Minor flaps fold in (Side panels P2 & P4)
  const minorAngle = stageProgress(progress, 0.40, 0.70) * (Math.PI / 2);

  // Stage 3 (0.70–1.00): Major flaps fold in (Front & Back panels P1 & P3)
  const majorAngle = stageProgress(progress, 0.70, 1.00) * (Math.PI / 2);

  // ── Geometry ──────────────────────────────────────────────────────────────
  const debouncedDecals = useDebouncedDecals(decals, 150);
  const geoms = useMemo(
    () => buildRSCGeometries(L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims),
    [L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims]
  );
  const { flapH } = geoms;

  // ── Texture & Materials ───────────────────────────────────────────────────
  const packageColorToUse = colorOverride || store.packageColor;
  // Default RSC box to kraft cardboard material
  const catToUse = store.materialCategory || "corrugated";

  const texture = useMemo(
    () => createProceduralTexture(catToUse, packageColorToUse, showWatermark),
    [catToUse, packageColorToUse, showWatermark]
  );

  const mats = useMemo(
    () => buildMaterials(catToUse, texture, store.insideColor, packageColorToUse),
    [catToUse, texture, store.insideColor, packageColorToUse]
  );
  const flap = mats.flap;

  // ── Scene layout ──────────────────────────────────────────────────────────
  const layout = overrideLayout || store.sceneLayout || "single";
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

  // Slightly lift major flaps at full closure to sit over minor flaps
  const majorFlapOffset = progress > 0.7 ? nT * 1.02 : 0;

  // ── Single box instance ───────────────────────────────────────────────────
  const renderBoxInstance = (key, pos, rot) => (
    <group key={key} position={pos} rotation={rot}>
      {/* ── PANEL 1 (FRONT, L × H) ── */}
      <group position={[0, 0, -nT]}>
        <mesh geometry={geoms.p1Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
          {D("p1")}
        </mesh>

        {geoms.windowFilmGeomP1 && (
          <mesh geometry={geoms.windowFilmGeomP1} position={[0, 0, nT / 2]}>
            <meshStandardMaterial
              transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} depthWrite={false}
            />
          </mesh>
        )}

        {/* P1 TOP FLAP (Major) */}
        <group position={[0, H / 2, majorFlapOffset]} rotation={[-majorAngle, 0, 0]}>
          <mesh geometry={geoms.p1TopFlapGeom} material={flap}>{D("top-flap-1")}</mesh>
        </group>

        {/* P1 BOTTOM FLAP (Major) */}
        <group position={[0, -H / 2, majorFlapOffset]} rotation={[majorAngle, 0, 0]}>
          <group rotation={[0, 0, Math.PI]}>
            <mesh geometry={geoms.p1BotFlapGeom} material={flap}>{D("bot-flap-1")}</mesh>
          </group>
        </group>
      </group>

      {/* ── GLUE FLAP ── */}
      <group position={[-L / 2 + nT, 0, -nT]} rotation={[0, -tubeAngle * 0.98, 0]}>
        <mesh geometry={geoms.glueGeom} material={flap}>{D("glue-flap")}</mesh>
      </group>

      {/* ── PANEL 2 (RIGHT SIDE, W × H) ── */}
      <group position={[L / 2, 0, 0]} rotation={[0, tubeAngle, 0]}>
        <mesh geometry={geoms.p2Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
          {D("p2")}
        </mesh>
        {geoms.windowFilmGeomP2 && (
          <mesh geometry={geoms.windowFilmGeomP2} position={[W / 2, 0, nT / 2]}>
            <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}

        {/* P2 TOP FLAP (Minor) */}
        <group position={[W / 2, H / 2 - nT, 0]} rotation={[-minorAngle, 0, 0]}>
          <mesh geometry={geoms.p2TopFlapGeom} material={flap}>{D("top-flap-2")}</mesh>
        </group>

        {/* P2 BOTTOM FLAP (Minor) */}
        <group position={[W / 2, -H / 2 + nT, 0]} rotation={[minorAngle, 0, 0]}>
          <group rotation={[0, 0, Math.PI]}>
            <mesh geometry={geoms.p2BotFlapGeom} material={flap}>{D("bot-flap-2")}</mesh>
          </group>
        </group>

        {/* ── PANEL 3 (BACK, L × H) ── */}
        <group position={[W, 0, -nT]} rotation={[0, tubeAngle, 0]}>
          <group position={[L / 2, 0, 0]}>
            <mesh geometry={geoms.p3Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
              {D("p3")}
            </mesh>
            {geoms.windowFilmGeomP3 && (
              <mesh geometry={geoms.windowFilmGeomP3} position={[0, 0, nT / 2]}>
                <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            )}

            {/* P3 TOP FLAP (Major) */}
            <group position={[0, H / 2, majorFlapOffset]} rotation={[-majorAngle, 0, 0]}>
              <mesh geometry={geoms.p3TopFlapGeom} material={flap}>{D("top-flap-3")}</mesh>
            </group>

            {/* P3 BOTTOM FLAP (Major) */}
            <group position={[0, -H / 2, majorFlapOffset]} rotation={[majorAngle, 0, 0]}>
              <group rotation={[0, 0, Math.PI]}>
                <mesh geometry={geoms.p3BotFlapGeom} material={flap}>{D("bot-flap-3")}</mesh>
              </group>
            </group>
          </group>

          {/* ── PANEL 4 (LEFT SIDE, W × H) ── */}
          <group position={[L, 0, 0]} rotation={[0, tubeAngle, 0]}>
            <mesh geometry={geoms.p4Geom} material={[mats.outside, mats.inside, mats.edge]} castShadow receiveShadow>
              {D("p4")}
            </mesh>
            {geoms.windowFilmGeomP4 && (
              <mesh geometry={geoms.windowFilmGeomP4} position={[W / 2, 0, nT / 2]}>
                <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            )}

            {/* P4 TOP FLAP (Minor) */}
            <group position={[W / 2, H / 2 - nT, 0]} rotation={[-minorAngle, 0, 0]}>
              <mesh geometry={geoms.p4TopFlapGeom} material={flap}>{D("top-flap-4")}</mesh>
            </group>

            {/* P4 BOTTOM FLAP (Minor) */}
            <group position={[W / 2, -H / 2 + nT, 0]} rotation={[minorAngle, 0, 0]}>
              <group rotation={[0, 0, Math.PI]}>
                <mesh geometry={geoms.p4BotFlapGeom} material={flap}>{D("bot-flap-4")}</mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );

  const maxDimension = Math.max(L, W, H, 1);
  const cameraZ = (maxDimension * 2.5) / Math.max(zoom, 0.1);

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        shadows
        camera={{ position: [cameraZ * 0.4, cameraZ * 0.35, cameraZ * 0.9], fov: 42 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <LightingPreset preset={lightingPreset} />
        <Environment preset="studio" environmentIntensity={0.35} />

        <group position={[0, -H * 0.1, 0]}>
          {sceneInstances.map((inst, idx) =>
            renderBoxInstance(idx, inst.position, inst.rotation)
          )}
          <SceneAnimator activeAnimation={activeAnimation} />
        </group>

        <ContactShadows
          position={[0, -H * 0.55 - nT * 2, 0]}
          opacity={0.5}
          scale={maxDimension * 3.5}
          blur={1.8}
          far={maxDimension * 2}
        />

        <OrbitControls
          enableZoom={!disableZoom}
          enablePan={false}
          minDistance={maxDimension * 0.5}
          maxDistance={maxDimension * 6}
          dampingFactor={0.06}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
