/**
 * PizzaBox3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * High-fidelity 3D Viewer & Kinematic Fold Simulation for:
 * FEFCO 0426 Pizza Box / Roll-End Tray with Hinged Lid Mockup.
 *
 * Parametric Dimensions:
 *   L = Tray Width across front (default ~8.0709 in / 205 mm)
 *   W = Tray Depth from front to back hinge (default ~8.1496 in / 207 mm)
 *   H = Tray Wall Depth / Height (default ~2.0472 in / 52 mm)
 *   nT = Board Thickness (default ~0.059 in / 1.5 mm E-flute corrugated)
 *
 * Kinematics:
 *   - Phase 1 (0.00–0.35): Side walls, front wall, and rear wall fold UP (90°).
 *   - Phase 2 (0.20–0.45): Side wall corner tabs fold inward (90°).
 *   - Phase 3 (0.35–0.60): Front rollover locking wall folds 180° over tabs into slots.
 *   - Phase 4 (0.50–0.75): Lid side dust flaps and front tuck flap fold down (90°).
 *   - Phase 5 (0.60–1.00): Hinged lid folds forward (90°) over the top of the box.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import SceneAnimator from "./SceneAnimator";
import { useBoxStore } from "../../lib/useBoxStore";
import { getBoxDieline } from "../../lib/boxDielineDispatcher";

import {
  stageProgress,
  assignMaterialGroups,
  createProceduralTexture,
  buildMaterials,
  LightingPreset,
  buildSceneInstances,
  MappedDecals,
  useDebouncedDecals
} from "./sharedUtils";

// ─────────────────────────────────────────────────────────────────────────────
// GEOMETRIES BUILDER FOR FEFCO 0426 PIZZA BOX
// ─────────────────────────────────────────────────────────────────────────────
function buildPizzaBoxGeometries(L, W, H, nT) {
  const extrudeSettings = { depth: nT, bevelEnabled: false };

  // 1. Floor (Width = L along X, Depth = W along Z)
  const floorShape = new THREE.Shape();
  floorShape.moveTo(-L / 2, -W / 2);
  floorShape.lineTo( L / 2, -W / 2);
  floorShape.lineTo( L / 2,  W / 2);
  floorShape.lineTo(-L / 2,  W / 2);
  floorShape.closePath();
  const floorGeom = new THREE.ExtrudeGeometry(floorShape, extrudeSettings);
  assignMaterialGroups(floorGeom, nT);

  // 2. Side Wall (Length = W, Height = H)
  const sideWallShape = new THREE.Shape();
  sideWallShape.moveTo(-W / 2, 0);
  sideWallShape.lineTo( W / 2, 0);
  sideWallShape.lineTo( W / 2, H);
  sideWallShape.lineTo(-W / 2, H);
  sideWallShape.closePath();
  const sideWallGeom = new THREE.ExtrudeGeometry(sideWallShape, extrudeSettings);
  assignMaterialGroups(sideWallGeom, nT);

  // 3. Side Wall Corner Dust Tabs (Width = min(H * 0.88, 1.8), Height = H)
  const cornerTabW = Math.min(H * 0.88, 1.8);
  const cornerTabShape = new THREE.Shape();
  cornerTabShape.moveTo(0, 0);
  cornerTabShape.lineTo(cornerTabW, 0);
  cornerTabShape.lineTo(cornerTabW, Math.max(0.1, H * 0.85));
  cornerTabShape.lineTo(Math.max(0.1, cornerTabW * 0.8), H);
  cornerTabShape.lineTo(0, H);
  cornerTabShape.closePath();
  const cornerTabGeom = new THREE.ExtrudeGeometry(cornerTabShape, extrudeSettings);
  assignMaterialGroups(cornerTabGeom, nT);

  // 4. Front Outer Wall (Width = L, Height = H)
  const frontWallShape = new THREE.Shape();
  frontWallShape.moveTo(-L / 2, 0);
  frontWallShape.lineTo( L / 2, 0);
  frontWallShape.lineTo( L / 2, H);
  frontWallShape.lineTo(-L / 2, H);
  frontWallShape.closePath();
  const frontWallGeom = new THREE.ExtrudeGeometry(frontWallShape, extrudeSettings);
  assignMaterialGroups(frontWallGeom, nT);

  // 5. Front Inner Rollover Locking Wall (Width = L * 0.985, Height = H)
  const rollW = L * 0.985;
  const rollShape = new THREE.Shape();
  rollShape.moveTo(-rollW / 2, 0);
  rollShape.lineTo( rollW / 2, 0);
  rollShape.lineTo( rollW / 2, H);
  // Add locking tab contours at the top of the rollover wall (flush into floor slots, no bottom protrusion)
  const tabW = Math.min(rollW * 0.16, 1.4);
  const tabGap = rollW * 0.22;
  const tabTipH = H + Math.min(nT * 0.5, 0.02);
  rollShape.lineTo( tabGap + tabW, H);
  rollShape.lineTo( tabGap + tabW * 0.9, tabTipH);
  rollShape.lineTo( tabGap + tabW * 0.1, tabTipH);
  rollShape.lineTo( tabGap, H);
  rollShape.lineTo(-tabGap, H);
  rollShape.lineTo(-tabGap - tabW * 0.1, tabTipH);
  rollShape.lineTo(-tabGap - tabW * 0.9, tabTipH);
  rollShape.lineTo(-tabGap - tabW, H);
  rollShape.lineTo(-rollW / 2, H);
  rollShape.closePath();
  const rolloverGeom = new THREE.ExtrudeGeometry(rollShape, extrudeSettings);
  assignMaterialGroups(rolloverGeom, nT);

  // 6. Rear Hinge Wall (Width = L, Height = H)
  const rearWallGeom = new THREE.ExtrudeGeometry(frontWallShape, extrudeSettings);
  assignMaterialGroups(rearWallGeom, nT);

  // 7. Top Lid (Width = L, Length = W)
  const lidShape = new THREE.Shape();
  lidShape.moveTo(-L / 2, 0);
  lidShape.lineTo( L / 2, 0);
  lidShape.lineTo( L / 2, W);
  lidShape.lineTo(-L / 2, W);
  lidShape.closePath();
  const lidGeom = new THREE.ExtrudeGeometry(lidShape, extrudeSettings);
  assignMaterialGroups(lidGeom, nT);

  // 8. Lid Side Dust Flaps (exact match to 2D dieline: 20° chamfer + smooth convex R15mm fillet)
  const flapL = (7.8543 / 8.1496) * W;
  const flapH = (1.9881 / 2.0472) * H;
  const R_flap = (0.5906 / 2.0472) * H;
  const chamferDx = (0.5822 / 2.0472) * H;
  const chamferDy = (1.5996 / 2.0472) * H;
  const arcDx = (1.1371 / 2.0472) * H;

  const flapShape = new THREE.Shape();
  // Start at hinge end along fold (0, 0)
  flapShape.moveTo(0, 0);
  // Chamfer at 20° out towards outer edge
  flapShape.lineTo(chamferDx, chamferDy);
  // Smooth convex corner fillet tangent to outer edge (clockwise: 160° down to 90°)
  flapShape.absarc(arcDx, flapH - R_flap, R_flap, 160 * Math.PI / 180, 90 * Math.PI / 180, true);
  // Straight outer edge
  flapShape.lineTo(flapL - arcDx, flapH);
  // Smooth convex corner fillet to front chamfer (clockwise: 90° down to 20°)
  flapShape.absarc(flapL - arcDx, flapH - R_flap, R_flap, 90 * Math.PI / 180, 20 * Math.PI / 180, true);
  // Front chamfer down to fold
  flapShape.lineTo(flapL, 0);
  flapShape.closePath();
  const lidSideFlapGeom = new THREE.ExtrudeGeometry(flapShape, extrudeSettings);
  assignMaterialGroups(lidSideFlapGeom, nT);

  // 9. Lid Front Tuck Flap (exact match to 2D dieline: 20° tapered sides + smooth convex R15mm fillets)
  const tuckW = (7.9528 / 8.0709) * L;
  const halfW = tuckW / 2;
  const tuckH = (1.9881 / 2.0472) * H;
  const R_tuck = (0.5906 / 2.0472) * H;

  const tuckShape = new THREE.Shape();
  // Start at left corner along fold line (-halfW, 0)
  tuckShape.moveTo(-halfW, 0);
  // Left chamfer at 20° inward
  tuckShape.lineTo(-halfW + chamferDx, chamferDy);
  // Left corner smooth convex fillet tangent to bottom tip (clockwise: 160° down to 90°)
  tuckShape.absarc(-halfW + arcDx, tuckH - R_tuck, R_tuck, 160 * Math.PI / 180, 90 * Math.PI / 180, true);
  // Straight bottom tip
  tuckShape.lineTo(halfW - arcDx, tuckH);
  // Right corner smooth convex fillet to right chamfer (clockwise: 90° down to 20°)
  tuckShape.absarc(halfW - arcDx, tuckH - R_tuck, R_tuck, 90 * Math.PI / 180, 20 * Math.PI / 180, true);
  // Right chamfer back to fold line
  tuckShape.lineTo(halfW, 0);
  tuckShape.closePath();
  const tuckFlapGeom = new THREE.ExtrudeGeometry(tuckShape, extrudeSettings);
  assignMaterialGroups(tuckFlapGeom, nT);

  return {
    floorGeom,
    sideWallGeom,
    cornerTabGeom,
    cornerTabW,
    frontWallGeom,
    rolloverGeom,
    rearWallGeom,
    lidGeom,
    lidSideFlapGeom,
    tuckFlapGeom
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PIZZA BOX 3D VIEWER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PizzaBox3DViewer({
  boxModelOverride = null,
  activeAnimation = "none",
  useStore = useBoxStore,
  colorOverride = null,
  showWatermark = false,
  progressOverride = null,
  decals = null,
  overrideLayout = null,
  ...props
}) {
  const store = useStore();
  const [isLidLifted, setIsLidLifted] = useState(false);

  // Dimensions (L = width across front, W = depth front-to-back, H = wall height)
  const L = Number(props.L || store?.L || 8.0709);
  const W = Number(props.W || store?.W || 8.1496);
  const H = Number(props.H || store?.H || 2.0472);
  const nT = Math.max(0.02, Number(props.T || store?.T || 0.059));

  const manuL = 8.0709;
  const manuW = 8.1496;
  const manuH = 2.0472;

  const rawProgress = progressOverride !== null 
    ? progressOverride 
    : (props.progress !== undefined 
        ? props.progress 
        : (store?.foldProgress !== undefined ? store.foldProgress : 1.0));
  const progress = Number(rawProgress);

  // Materials setup
  const catToUse = store?.materialCategory || "kraft_cardboard";
  const packageColorToUse = colorOverride || store?.packageColor || null;

  const texture = useMemo(
    () => createProceduralTexture(catToUse, packageColorToUse, showWatermark),
    [catToUse, packageColorToUse, showWatermark]
  );

  const mats = useMemo(
    () => buildMaterials(catToUse, texture, store?.insideColor, packageColorToUse),
    [catToUse, texture, store?.insideColor, packageColorToUse]
  );

  const matOutside = mats.outside;
  const matInside  = mats.inside;
  const matEdge    = mats.edge;
  const matArray   = [matOutside, matInside, matEdge];

  // Geometries builder
  const geoms = useMemo(() => {
    return buildPizzaBoxGeometries(L, W, H, nT);
  }, [L, W, H, nT]);

  // Decal dispatcher
  const resolvedDecals = decals !== null 
    ? decals 
    : (store?.decalsByModel?.pizza_box || store?.decalsByModel?.fefco_0426 || store?.decals || []);
  const debouncedDecals = useDebouncedDecals(resolvedDecals);

  const dielineData = useMemo(() => {
    try {
      return getBoxDieline('pizza_box', { L, W, H, T: nT });
    } catch {
      return null;
    }
  }, [L, W, H, nT]);

  const dims = dielineData?.dimensions || null;

  const D = (panelName) => (
    <MappedDecals
      panel={panelName}
      decals={debouncedDecals}
      L={L} W={W} H={H}
      manuL={manuL} manuW={manuW} manuH={manuH}
      dims={dims} T={nT}
    />
  );

  // Kinematic fold angles matching Pacdora video:
  // Phase 1 (0.00–0.25): Side walls fold UP 90°
  // Phase 2 (0.15–0.35): Corner tabs fold IN 90°
  // Phase 3 (0.25–0.45): Front wall folds UP 90°
  // Phase 4 (0.35–0.55): Rollover wall folds 180° inside over tabs into slots
  // Phase 5 (0.45–0.65): Rear wall folds UP 90°
  // Phase 6 (0.55–0.75): Lid side dust flaps and front tuck flap fold 90°
  // Phase 7 (0.65–0.98): Hinged lid swings closed forward 90° over the tray
  const sideFoldAngle    = stageProgress(progress, 0.00, 0.25) * (Math.PI / 2);
  const cornerTabAngle   = stageProgress(progress, 0.15, 0.35) * (Math.PI / 2);
  const frontWallAngle   = stageProgress(progress, 0.25, 0.45) * (Math.PI / 2);
  const rolloverAngle    = stageProgress(progress, 0.35, 0.55) * Math.PI;

  const rearWallAngle    = stageProgress(progress, 0.45, 0.65) * (Math.PI / 2);
  const lidSideFlapAngle = stageProgress(progress, 0.55, 0.75) * (Math.PI / 2);
  const baseLidHingeAngle = stageProgress(progress, 0.65, 0.98) * (Math.PI / 2);

  // When lifted in closed mode: lid opens back by ~116° (2.02 rad) to expose interior cavity cleanly
  const openOffset = isLidLifted ? 2.02 : 0;
  const effectiveLidAngle = baseLidHingeAngle - openOffset;
  const effectiveLidFlapAngle = Math.max(lidSideFlapAngle, isLidLifted ? Math.PI / 2 : 0);

  // Layout instances
  const layout = overrideLayout || store?.sceneLayout || "single";
  const sceneInstances = useMemo(() => {
    return buildSceneInstances(layout, L, W, H);
  }, [layout, L, W, H]);

  const maxDim = Math.max(L, W, H);
  const initialDist = maxDim * 2.4;
  const initialDir = useMemo(() => new THREE.Vector3(18, 22, 32).normalize(), []);
  const targetY = H / 2;

  const initialCamPos = useMemo(() => {
    return [
      initialDir.x * initialDist,
      targetY + initialDir.y * initialDist,
      initialDir.z * initialDist,
    ];
  }, [initialDist, initialDir, targetY]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Interactive Lid Quick Toggle Pill */}
      {progress >= 0.75 && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            zIndex: 10,
            display: "flex",
            gap: "8px"
          }}
        >
          <button
            onClick={() => setIsLidLifted(!isLidLifted)}
            style={{
              padding: "6px 14px",
              background: isLidLifted ? "#2563eb" : "rgba(255, 255, 255, 0.92)",
              color: isLidLifted ? "#ffffff" : "#1e293b",
              border: "1px solid rgba(0,0,0,0.14)",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Lift or close the hinged lid"
          >
            {isLidLifted ? "Close Lid" : "Open Lid (Lift)"}
          </button>
        </div>
      )}

      <Canvas
        camera={{ position: initialCamPos, fov: 38 }}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={2}
          maxDistance={maxDim * 8}
          target={[0, targetY, 0]}
        />

        <LightingPreset preset={store?.lightingPreset || "studio"} />

        <SceneAnimator activeAnimation={activeAnimation}>
          <group position={[0, 0, 0]}>
            {sceneInstances.map((inst, i) => (
              <group
                key={`pizza-box-${i}`}
                position={inst.pos || inst.position || [0, 0, 0]}
                rotation={inst.rot || inst.rotation || [0, 0, 0]}
              >
                {/* ───────────────────────────────────────────────────────── */}
                {/* 1. FLOOR PANEL (Base horizontal ground anchor at Y=0)    */}
                {/* ───────────────────────────────────────────────────────── */}
                <mesh
                  geometry={geoms.floorGeom}
                  material={matArray}
                  rotation={[Math.PI / 2, 0, 0]}
                  position={[0, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  {D("base-floor")}
                </mesh>

                {/* ───────────────────────────────────────────────────────── */}
                {/* 2. LEFT SIDE WALL (at X = -L/2, folds UP around Z)        */}
                {/* ───────────────────────────────────────────────────────── */}
                <group position={[-L / 2, 0, 0]} rotation={[0, 0, -sideFoldAngle]}>
                  <mesh
                    geometry={geoms.sideWallGeom}
                    material={matArray}
                    rotation={[Math.PI / 2, 0, Math.PI / 2]}
                    position={[0, 0, 0]}
                    castShadow
                    receiveShadow
                  >
                    {D("left-wall")}
                  </mesh>

                  {/* Left Front Corner Dust Tab */}
                  <group position={[0, 0, W / 2]} rotation={[-cornerTabAngle, 0, 0]}>
                    <mesh
                      geometry={geoms.cornerTabGeom}
                      material={matArray}
                      rotation={[-Math.PI / 2, Math.PI, -Math.PI / 2]}
                      castShadow
                      receiveShadow
                    />
                  </group>

                  {/* Left Rear Corner Dust Tab */}
                  <group position={[0, 0, -W / 2]} rotation={[cornerTabAngle, 0, 0]}>
                    <mesh
                      geometry={geoms.cornerTabGeom}
                      material={matArray}
                      rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                      castShadow
                      receiveShadow
                    />
                  </group>
                </group>

                {/* ───────────────────────────────────────────────────────── */}
                {/* 3. RIGHT SIDE WALL (at X = +L/2, folds UP around Z)       */}
                {/* ───────────────────────────────────────────────────────── */}
                <group position={[L / 2, 0, 0]} rotation={[0, 0, sideFoldAngle]}>
                  <mesh
                    geometry={geoms.sideWallGeom}
                    material={matArray}
                    rotation={[Math.PI / 2, 0, -Math.PI / 2]}
                    position={[0, 0, 0]}
                    castShadow
                    receiveShadow
                  >
                    {D("right-wall")}
                  </mesh>

                  {/* Right Front Corner Dust Tab */}
                  <group position={[0, 0, W / 2]} rotation={[-cornerTabAngle, 0, 0]}>
                    <mesh
                      geometry={geoms.cornerTabGeom}
                      material={matArray}
                      rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
                      castShadow
                      receiveShadow
                    />
                  </group>

                  {/* Right Rear Corner Dust Tab */}
                  <group position={[0, 0, -W / 2]} rotation={[cornerTabAngle, 0, 0]}>
                    <mesh
                      geometry={geoms.cornerTabGeom}
                      material={matArray}
                      rotation={[-Math.PI / 2, Math.PI, Math.PI / 2]}
                      castShadow
                      receiveShadow
                    />
                  </group>
                </group>

                {/* ───────────────────────────────────────────────────────── */}
                {/* 4. FRONT OUTER WALL & INNER ROLLOVER LOCKING WALL        */}
                {/* ───────────────────────────────────────────────────────── */}
                <group position={[0, 0, W / 2]} rotation={[-frontWallAngle, 0, 0]}>
                  <mesh
                    geometry={geoms.frontWallGeom}
                    material={matArray}
                    rotation={[Math.PI / 2, 0, 0]}
                    position={[0, 0, 0]}
                    castShadow
                    receiveShadow
                  >
                    {D("front-wall")}
                  </mesh>

                  {/* Inner Rollover Locking Wall: rolls 180° OVER top of front wall */}
                  <group position={[0, 0, H]} rotation={[-rolloverAngle, 0, 0]}>
                    <mesh
                      geometry={geoms.rolloverGeom}
                      material={matArray}
                      rotation={[Math.PI / 2, 0, 0]}
                      position={[0, -nT * 0.9, 0]}
                      castShadow
                      receiveShadow
                    />
                  </group>
                </group>

                {/* ───────────────────────────────────────────────────────── */}
                {/* 5. REAR HINGE WALL (at Z = -W/2, folds UP around X)       */}
                {/* ───────────────────────────────────────────────────────── */}
                <group position={[0, 0, -W / 2]} rotation={[rearWallAngle, 0, 0]}>
                  <mesh
                    geometry={geoms.rearWallGeom}
                    material={matArray}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0, 0]}
                    castShadow
                    receiveShadow
                  >
                    {D("back-wall")}
                  </mesh>

                  {/* ─────────────────────────────────────────────────────── */}
                  {/* 6. HINGED TOP LID (at top of rear wall at [0, 0, -H])   */}
                  {/* ─────────────────────────────────────────────────────── */}
                  <group position={[0, 0, -H]} rotation={[effectiveLidAngle, 0, 0]}>
                    <mesh
                      geometry={geoms.lidGeom}
                      material={matArray}
                      rotation={[-Math.PI / 2, 0, 0]}
                      position={[0, 0, 0]}
                      castShadow
                      receiveShadow
                    >
                      {D("lid-top")}
                    </mesh>

                    {/* Lid Left Dust Flap (folds down inside left wall) */}
                    <group position={[-L / 2 + nT * 1.5, 0, 0]} rotation={[0, 0, -effectiveLidFlapAngle]}>
                      <mesh
                        geometry={geoms.lidSideFlapGeom}
                        material={matArray}
                        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                        castShadow
                        receiveShadow
                      />
                    </group>

                    {/* Lid Right Dust Flap (folds down inside right wall) */}
                    <group position={[L / 2 - nT * 2.5, 0, 0]} rotation={[0, 0, effectiveLidFlapAngle]}>
                      <mesh
                        geometry={geoms.lidSideFlapGeom}
                        material={matArray}
                        rotation={[-Math.PI / 2, Math.PI, Math.PI / 2]}
                        castShadow
                        receiveShadow
                      />
                    </group>

                    {/* Lid Front Tuck Flap (folds down inside front rollover slot) */}
                    <group position={[0, 0, -W + nT * 2.0]} rotation={[effectiveLidFlapAngle, 0, 0]}>
                      <mesh
                        geometry={geoms.tuckFlapGeom}
                        material={matArray}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, 0, 0]}
                        castShadow
                        receiveShadow
                      />
                    </group>
                  </group>
                </group>
              </group>
            ))}
          </group>
        </SceneAnimator>

        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.45}
          scale={maxDim * 4}
          blur={1.8}
          far={14}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
