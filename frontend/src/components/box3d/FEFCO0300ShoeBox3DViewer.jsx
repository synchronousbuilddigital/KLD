/**
 * FEFCO0300ShoeBox3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * High-fidelity 3D Viewer & Kinematic Fold Simulation for:
 * FEFCO 0300 Shoe Box with Lid Mockup (Telescope Box).
 *
 * Exact Kinematic & Texture Mapping:
 *   - Outside faces (Z = nT) strictly face OUTWARD for all walls, roof, and floor.
 *   - Inside faces (Z = 0) strictly face INWARD into the box cavity.
 *   - Correct decal projection: 'lid-top' on the top of the box facing UP,
 *     'base-floor' on the bottom facing DOWN (or inside if looking in),
 *     'lid-front' / 'base-front' facing FRONT (+Z),
 *     'lid-back' / 'base-back' facing BACK (-Z),
 *     'lid-left' / 'base-left' facing LEFT (-X),
 *     'lid-right' / 'base-right' facing RIGHT (+X).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import SceneAnimator from "./SceneAnimator";
import { useBoxStore } from "../../lib/useBoxStore";
import { generateFEFCO0300Dieline } from "../../lib/fefco0300DielineGenerator";

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
// GEOMETRIES BUILDER FOR FEFCO 0300
// ─────────────────────────────────────────────────────────────────────────────
function buildFEFCO0300Geometries(L, W, H, nT) {
  const extrudeSettings = { depth: nT, bevelEnabled: false };

  // Lid dimensions: slight clearance so it telescopes snugly over base
  const lidL = L + (2 * nT) + (4.0 / 25.4);
  const lidW = W + (2 * nT) + (3.5 / 25.4);
  const lidH = H + (0.8 / 25.4);

  const baseTabW = Math.min(H * 0.92, 2.5);
  const lidTabW  = Math.min(lidH * 0.92, 2.5);

  const makeTrayGeometries = (tL, tW, tH, tabW) => {
    // 1. Floor / Roof (X in [-tL/2, tL/2], Y in [-tW/2, tW/2])
    const floorShape = new THREE.Shape();
    floorShape.moveTo(-tL / 2, -tW / 2);
    floorShape.lineTo( tL / 2, -tW / 2);
    floorShape.lineTo( tL / 2,  tW / 2);
    floorShape.lineTo(-tL / 2,  tW / 2);
    floorShape.closePath();
    const floorGeom = new THREE.ExtrudeGeometry(floorShape, extrudeSettings);
    assignMaterialGroups(floorGeom, nT);

    // 2. Side Walls (X in [0, tH], Y in [-tW/2, tW/2])
    const sideWallShape = new THREE.Shape();
    sideWallShape.moveTo(0, -tW / 2);
    sideWallShape.lineTo(tH, -tW / 2);
    sideWallShape.lineTo(tH,  tW / 2);
    sideWallShape.lineTo(0,   tW / 2);
    sideWallShape.closePath();
    const sideWallGeom = new THREE.ExtrudeGeometry(sideWallShape, extrudeSettings);
    assignMaterialGroups(sideWallGeom, nT);

    // 3. Front & Back Walls (X in [-tL/2, tL/2], Y in [0, tH])
    const frontWallShape = new THREE.Shape();
    frontWallShape.moveTo(-tL / 2, 0);
    frontWallShape.lineTo( tL / 2, 0);
    frontWallShape.lineTo( tL / 2, tH);
    frontWallShape.lineTo(-tL / 2, tH);
    frontWallShape.closePath();
    const frontWallGeom = new THREE.ExtrudeGeometry(frontWallShape, extrudeSettings);
    assignMaterialGroups(frontWallGeom, nT);

    const backWallGeom = new THREE.ExtrudeGeometry(frontWallShape, extrudeSettings);
    assignMaterialGroups(backWallGeom, nT);

    // 4. Left Tabs (X in [-tabW, 0], Y in [0, tH])
    const leftTabShape = new THREE.Shape();
    leftTabShape.moveTo(-tabW, 0);
    leftTabShape.lineTo(0, 0);
    leftTabShape.lineTo(0, tH);
    leftTabShape.lineTo(-tabW + 0.2, tH);
    leftTabShape.lineTo(-tabW, Math.max(0.1, tH - 0.2));
    leftTabShape.closePath();
    const leftTabGeom = new THREE.ExtrudeGeometry(leftTabShape, extrudeSettings);
    assignMaterialGroups(leftTabGeom, nT);

    // 5. Right Tabs (X in [0, tabW], Y in [0, tH])
    const rightTabShape = new THREE.Shape();
    rightTabShape.moveTo(0, 0);
    rightTabShape.lineTo(tabW, 0);
    rightTabShape.lineTo(tabW, Math.max(0.1, tH - 0.2));
    rightTabShape.lineTo(Math.max(0.1, tabW - 0.2), tH);
    rightTabShape.lineTo(0, tH);
    rightTabShape.closePath();
    const rightTabGeom = new THREE.ExtrudeGeometry(rightTabShape, extrudeSettings);
    assignMaterialGroups(rightTabGeom, nT);

    return {
      floorGeom,
      sideWallGeom,
      frontWallGeom,
      backWallGeom,
      leftTabGeom,
      rightTabGeom
    };
  };

  return {
    lidL, lidW, lidH,
    base: makeTrayGeometries(L, W, H, baseTabW),
    lid:  makeTrayGeometries(lidL, lidW, lidH, lidTabW)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCURATE FOLDING TRAY COMPONENT WITH PERFECT NORMAL ORIENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
function FoldingTray({
  isLid = false,
  length,
  width,
  height,
  nT,
  flapAngle,      // Phase 1 (0 to PI/2)
  sideAngle,      // Phase 2 (0 to PI/2)
  frontBackAngle, // Phase 3 (0 to PI/2)
  trayGeoms,
  matArray,
  D
}) {
  // Panel names:
  // For the Base: left is at -X, right is at +X
  // For the Lid: when the Lid inverts 180° around Z, local +X becomes world -X (Left),
  // and local -X becomes world +X (Right)! So we map decals to their true world side!
  const floorPanelName = isLid ? "lid-top"   : "base-floor";
  const frontPanelName = isLid ? "lid-front" : "base-front";
  const backPanelName  = isLid ? "lid-back"  : "base-back";
  const leftPanelName  = isLid ? "lid-right" : "base-left";
  const rightPanelName = isLid ? "lid-left"  : "base-right";

  return (
    <group>
      {/* 1. Floor / Roof Panel (outside face Z=nT points down on Base, up when Lid flips) */}
      <mesh
        geometry={trayGeoms.floorGeom}
        material={matArray}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        {D(floorPanelName)}
      </mesh>

      {/* 2. Left Wall Hinge (at X = -length/2) */}
      <group position={[-length / 2, 0, 0]} rotation={[0, 0, -sideAngle]}>
        <mesh
          geometry={trayGeoms.sideWallGeom}
          material={matArray}
          rotation={[Math.PI / 2, 0, Math.PI]}
          castShadow
          receiveShadow
        >
          {D(leftPanelName)}
        </mesh>

        {/* Front-Left Glue Tab (at Z = +width/2) */}
        <group position={[0, 0, width / 2]} rotation={[-flapAngle, 0, 0]}>
          <mesh
            geometry={trayGeoms.leftTabGeom}
            material={matArray}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          />
        </group>

        {/* Back-Left Glue Tab (at Z = -width/2) */}
        <group position={[0, 0, -width / 2]} rotation={[flapAngle, 0, 0]}>
          <mesh
            geometry={trayGeoms.leftTabGeom}
            material={matArray}
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          />
        </group>
      </group>

      {/* 3. Right Wall Hinge (at X = +length/2) */}
      <group position={[length / 2, 0, 0]} rotation={[0, 0, sideAngle]}>
        <mesh
          geometry={trayGeoms.sideWallGeom}
          material={matArray}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          {D(rightPanelName)}
        </mesh>

        {/* Front-Right Glue Tab (at Z = +width/2) */}
        <group position={[0, 0, width / 2]} rotation={[-flapAngle, 0, 0]}>
          <mesh
            geometry={trayGeoms.rightTabGeom}
            material={matArray}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          />
        </group>

        {/* Back-Right Glue Tab (at Z = -width/2) */}
        <group position={[0, 0, -width / 2]} rotation={[flapAngle, 0, 0]}>
          <mesh
            geometry={trayGeoms.rightTabGeom}
            material={matArray}
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          />
        </group>
      </group>

      {/* 4. Front Wall Hinge (at Z = +width/2) */}
      <group position={[0, 0, width / 2 + nT * 0.5]} rotation={[-frontBackAngle, 0, 0]}>
        <mesh
          geometry={trayGeoms.frontWallGeom}
          material={matArray}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          {D(frontPanelName)}
        </mesh>
      </group>

      {/* 5. Back Wall Hinge (at Z = -width/2) */}
      <group position={[0, 0, -width / 2 - nT * 0.5]} rotation={[frontBackAngle, 0, 0]}>
        <mesh
          geometry={trayGeoms.backWallGeom}
          material={matArray}
          rotation={[-Math.PI / 2, Math.PI, 0]}
          castShadow
          receiveShadow
        >
          {D(backPanelName)}
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KINEMATIC TELESCOPE LID CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
function TelescopeLidKinematics({
  children,
  L,
  H,
  lidL,
  lidH,
  nT,
  progress,
  isLifted,
  isPlayingAnim
}) {
  const groupRef = useRef();

  // Position of Lid when flat on floor beside base
  const gap = 0.5;
  const xFlatLid = -(L / 2 + H + gap + lidH + lidL / 2);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetRotZ = 0;
    let targetRotX = 0;

    const hoverY = H + 2.2;
    const closedY = H + nT * 1.2;
    const arcLift = 4.2;

    if (progress < 0.45) {
      // ── STAGE 1: Flat & Tray Forming on Floor (Matching Video 0.0s – 2.7s) ─
      targetX = xFlatLid;
      targetY = 0;
      targetZ = 0;
      targetRotZ = 0;
    } else if (progress < 0.75) {
      // ── STAGE 2: 180° Flip Arc from Side to Center (Matching Video 2.7s – 3.8s) ─
      const u = stageProgress(progress, 0.45, 0.75); // 0.0 to 1.0
      targetX = xFlatLid * (1 - u);
      targetY = u * hoverY + Math.sin(u * Math.PI) * arcLift;
      targetZ = 0;
      targetRotZ = -u * Math.PI; // Inverts 180° around Z
    } else {
      // ── STAGE 3: Telescoping Down onto Base Tray (Matching Video 3.8s – 5.3s) ─
      const v = stageProgress(progress, 0.75, 1.00); // 0.0 to 1.0
      targetX = 0;
      targetY = hoverY * (1 - v) + closedY * v;
      targetZ = 0;
      targetRotZ = -Math.PI; // Inverted, fully seated over base
    }

    // Interactive Lift / Product Showcase Reveal Mode
    if (progress >= 0.95) {
      if (isPlayingAnim) {
        const cycle = (t % 4.0) / 4.0;
        let lift = 0;
        let tilt = 0;
        if (cycle < 0.4) {
          const p = cycle / 0.4;
          lift = Math.sin(p * Math.PI * 0.5) * 3.6;
          tilt = Math.sin(p * Math.PI) * 0.14;
        } else if (cycle < 0.6) {
          lift = 3.6;
          tilt = 0.12;
        } else {
          const p = (cycle - 0.6) / 0.4;
          lift = (1 - Math.sin(p * Math.PI * 0.5)) * 3.6;
          tilt = (1 - p) * 0.12;
        }
        targetY = Math.max(targetY, closedY + lift);
        targetRotX = tilt;
      } else if (isLifted) {
        targetY = closedY + 3.6;
        targetRotX = 0.12;
      }
    }

    // Buttery smooth lerp
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.16);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.16);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.16);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.16);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.16);
  });

  return <group ref={groupRef}>{children}</group>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMOOTH AUTO-FRAMING CAMERA RIG
// ─────────────────────────────────────────────────────────────────────────────
function CameraRig({ progress, L, W, H }) {
  const { camera, controls } = useThree();
  const lastProgressRef = useRef(progress);

  const maxDim = Math.max(L, W, H);
  const closedDist = maxDim * 2.2;
  const openDist = maxDim * 4.2;
  const getTargetDist = (p) => THREE.MathUtils.lerp(openDist, closedDist, p);

  const targetDistRef = useRef(getTargetDist(progress));

  useEffect(() => {
    if (Math.abs(progress - lastProgressRef.current) > 0.001) {
      lastProgressRef.current = progress;
      targetDistRef.current = getTargetDist(progress);
    }
  }, [progress, L, W, H]);

  useFrame(() => {
    const targetY = (H / 2) * stageProgress(progress, 0.35, 0.85);
    const targetVec = new THREE.Vector3(0, targetY, 0);

    if (controls) {
      controls.target.copy(targetVec);
    }

    if (targetDistRef.current !== null) {
      const offset = camera.position.clone().sub(targetVec);
      const currentDist = offset.length();
      if (Math.abs(currentDist - targetDistRef.current) > 0.1) {
        const dir = offset.normalize();
        const newDist = THREE.MathUtils.lerp(currentDist, targetDistRef.current, 0.08);
        camera.position.copy(targetVec.clone().add(dir.multiplyScalar(newDist)));
      } else {
        targetDistRef.current = null;
      }
    }
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN 3D VIEWER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function FEFCO0300ShoeBox3DViewer({
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

  // Dimensions (defaulting to 302 × 204 × 61 mm in inches)
  const L = store?.L || 11.8898;
  const W = store?.W || 8.0315;
  const H = store?.H || 2.4016;
  const nT = Math.max(0.02, store?.T || 0.059);

  const manuL = 11.8898;
  const manuW = 8.0315;
  const manuH = 2.4016;

  const resolvedDecals = decals !== null 
    ? decals 
    : (store?.decalsByModel?.fefco_0300 || store?.decalsByModel?.shoe_box_with_lid || store?.decals || []);
  const debouncedDecals = useDebouncedDecals(resolvedDecals);

  // Generate 2D dieline data for decal mapping
  const dielineData = useMemo(() => {
    return generateFEFCO0300Dieline({ L, W, H, T: nT });
  }, [L, W, H, nT]);

  const dims = dielineData.dimensions;

  // Folding progress (0.0 = flat dielines side-by-side, 1.0 = folded closed box)
  const progress = progressOverride !== null 
    ? progressOverride 
    : (props.progress !== undefined ? props.progress : 1.0);

  // Kinematic folding angles matching the video:
  // Phase 1 (0.00 – 0.15): Corner glue tabs fold UP 90°
  const flapAngle = stageProgress(progress, 0.00, 0.15) * (Math.PI / 2);

  // Phase 2 (0.15 – 0.32): Side walls fold UP 90° (carrying corner tabs)
  const sideAngle = stageProgress(progress, 0.15, 0.32) * (Math.PI / 2);

  // Phase 3 (0.30 – 0.45): Front & Back walls fold UP 90° wrapping corner tabs
  const frontBackAngle = stageProgress(progress, 0.30, 0.45) * (Math.PI / 2);

  // Geometries
  const geoms = useMemo(
    () => buildFEFCO0300Geometries(L, W, H, nT),
    [L, W, H, nT]
  );

  // Materials & Textures
  const packageColorToUse = colorOverride || store.packageColor;
  const catToUse = store.materialCategory || "corrugated";

  const texture = useMemo(
    () => createProceduralTexture(catToUse, packageColorToUse, showWatermark),
    [catToUse, packageColorToUse, showWatermark]
  );

  const mats = useMemo(
    () => buildMaterials(catToUse, texture, store.insideColor, packageColorToUse),
    [catToUse, texture, store.insideColor, packageColorToUse]
  );

  const matOutside = mats.outside;
  const matInside  = mats.inside;
  const matEdge    = mats.edge;
  const matArray   = [matOutside, matInside, matEdge];

  // Decal mapping helper
  const D = (panelName) => (
    <MappedDecals
      panel={panelName}
      decals={debouncedDecals}
      L={L} W={W} H={H}
      manuL={manuL} manuW={manuW} manuH={manuH}
      dims={dims} T={nT}
    />
  );

  // Scene layout
  const layout = overrideLayout || store.sceneLayout || "single";
  const sceneInstances = useMemo(
    () => buildSceneInstances(layout, L, W, H),
    [layout, L, W, H]
  );

  const isPlayingAnim = (props.isPlaying || activeAnimation === 'open' || activeAnimation === 'rotation');

  const xFlatLid = -(L / 2 + H + 0.5 + geoms.lidH + geoms.lidL / 2);
  const midX = (xFlatLid / 2) * (1 - stageProgress(progress, 0.40, 0.80));
  const targetY = (H / 2) * stageProgress(progress, 0.35, 0.85);

  const maxDim = Math.max(L, W, H);
  const initialDist = THREE.MathUtils.lerp(maxDim * 4.2, maxDim * 2.2, progress);
  const initialDir = useMemo(() => new THREE.Vector3(18, 26, 40).normalize(), []);
  const initialCamPos = useMemo(() => {
    return [
      initialDir.x * initialDist,
      targetY + initialDir.y * initialDist,
      initialDir.z * initialDist,
    ];
  }, [initialDist, initialDir, targetY]);

  // Single shoe box instance rendering
  const renderShoeBox = (key, pos, rot) => (
    <group key={key} position={pos} rotation={rot}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. BASE TRAY (Stationary on floor at X = 0)                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <group position={[0, 0, 0]}>
        <FoldingTray
          isLid={false}
          length={L}
          width={W}
          height={H}
          nT={nT}
          flapAngle={flapAngle}
          sideAngle={sideAngle}
          frontBackAngle={frontBackAngle}
          trayGeoms={geoms.base}
          matArray={matArray}
          D={D}
        />
      </group>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. TELESCOPE LID TRAY (Flat beside base → 180° arc flip → closes)  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <TelescopeLidKinematics
        L={L}
        H={H}
        lidL={geoms.lidL}
        lidH={geoms.lidH}
        nT={nT}
        progress={progress}
        isLifted={isLidLifted}
        isPlayingAnim={isPlayingAnim}
      >
        <FoldingTray
          isLid={true}
          length={geoms.lidL}
          width={geoms.lidW}
          height={geoms.lidH}
          nT={nT}
          flapAngle={flapAngle}
          sideAngle={sideAngle}
          frontBackAngle={frontBackAngle}
          trayGeoms={geoms.lid}
          matArray={matArray}
          D={D}
        />
      </TelescopeLidKinematics>
    </group>
  );

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
            title="Telescope the lid up to inspect shoe box inside"
          >
            {isLidLifted ? "Close Lid" : "Open Lid (Lift)"}
          </button>
        </div>
      )}

      <Canvas
        camera={{ position: initialCamPos, fov: 40 }}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={Math.max(2, maxDim * 0.5)}
          maxDistance={maxDim * 8}
          target={[0, targetY, 0]}
        />

        <LightingPreset preset={store.lightingPreset || "studio"} />

        <CameraRig progress={progress} L={L} W={W} H={H} />

        <SceneAnimator activeAnimation={activeAnimation}>
          <group position={[-midX, 0, 0]}>
            {sceneInstances.map((inst, i) =>
              renderShoeBox(`box-${i}`, inst.pos || inst.position || [0, 0, 0], inst.rot || inst.rotation || [0, 0, 0])
            )}
          </group>
        </SceneAnimator>

        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.45}
          scale={55}
          blur={1.8}
          far={14}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
