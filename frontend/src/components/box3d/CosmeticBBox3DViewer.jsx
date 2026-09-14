/**
 * CosmeticBBox3DViewer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3D viewer for Cosmetic Box B (Mailer / Tray Style - Roll End Tuck Front).
 * Reconstructed with realistic packaging kinematic hierarchy:
 *
 *   Tray Base (Y=0, Z=0) is stationary ground anchor.
 *   Phase 1 (0.00–0.30): Tray outer walls (Front, Back, Left, Right) fold UP (90°)
 *   Phase 2 (0.15–0.35): Corner dust flaps fold IN (90°) along side walls
 *   Phase 3 (0.30–0.55): Left & Right inner walls roll OVER & DOWN (180°) into tray floor
 *   Phase 4 (0.50–0.70): Lid ear flaps & tuck wings fold IN (90°)
 *   Phase 5 (0.65–0.90): Lid folds FORWARD (90°) across the top of the tray
 *   Phase 6 (0.85–1.00): Front tuck flap folds DOWN (90°) into front slot
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import SceneAnimator from "./SceneAnimator";

import { useBoxStore } from "../../lib/useBoxStore";
import {
  createProceduralTexture,
  buildMaterials,
  LightingPreset,
  buildSceneInstances,
  useDebouncedDecals,
  DecalItem
} from "./sharedUtils";

const SVG_W = 551.0;
const SVG_H = 716.0;

const BASE_W = 270.0; // mm (Lid and inner box nominal length)
const BASE_D = 260.0; // mm (Tray base and lid nominal width)
const BASE_H = 62.0;  // mm (Side wall height)

function inverseTransformPoint(dynX, dynY, L_UI = 270.0, W_UI = 260.0, H_UI = 62.0) {
  const BASE_L = 270.0;
  const BASE_W = 260.0;
  const BASE_H = 62.0;

  const sH = H_UI / BASE_H;
  const sL = L_UI / BASE_L;
  const sW = W_UI / BASE_W;

  let origX = dynX;
  const x_b1 = 68.5 * sH;
  const x_b2 = x_b1 + 5.0;
  const x_b3 = x_b2 + 62.0 * sH;
  const x_b4 = x_b3 + 5.0;
  const x_b5 = x_b4 + 270.0 * sL;
  const x_b6 = x_b5 + 5.0;
  const x_b7 = x_b6 + 62.0 * sH;
  const x_b8 = x_b7 + 5.0;

  if (dynX <= x_b1) {
    origX = dynX / sH;
  } else if (dynX <= x_b2) {
    origX = 68.5 + (dynX - x_b1);
  } else if (dynX <= x_b3) {
    origX = 73.5 + (dynX - x_b2) / sH;
  } else if (dynX <= x_b4) {
    origX = 135.5 + (dynX - x_b3);
  } else if (dynX <= x_b5) {
    origX = 140.5 + (dynX - x_b4) / sL;
  } else if (dynX <= x_b6) {
    origX = 410.5 + (dynX - x_b5);
  } else if (dynX <= x_b7) {
    origX = 415.5 + (dynX - x_b6) / sH;
  } else if (dynX <= x_b8) {
    origX = 477.5 + (dynX - x_b7);
  } else {
    origX = 482.5 + (dynX - x_b8) / sH;
  }

  let origY = dynY;
  const y_b1 = 67.0 * sH;
  const y_b2 = y_b1 + 261.5 * sW;
  const y_b3 = y_b2 + 62.0 * sH;
  const y_b4 = y_b3 + 260.0 * sW;

  if (dynY <= y_b1) {
    origY = dynY / sH;
  } else if (dynY <= y_b2) {
    origY = 67.0 + (dynY - y_b1) / sW;
  } else if (dynY <= y_b3) {
    origY = 328.5 + (dynY - y_b2) / sH;
  } else if (dynY <= y_b4) {
    origY = 390.5 + (dynY - y_b3) / sW;
  } else {
    origY = 650.5 + (dynY - y_b4) / sH;
  }

  return { origX, origY };
}

function createUVGeometry(physWidth, physHeight, svgX, svgY, svgW, svgH, pivotX, pivotY) {
  const geo = new THREE.PlaneGeometry(physWidth, physHeight);
  const uvs = geo.attributes.uv;

  const u0 = svgX / SVG_W;
  const u1 = (svgX + svgW) / SVG_W;
  const v1 = 1.0 - (svgY / SVG_H);
  const v0 = 1.0 - ((svgY + svgH) / SVG_H);

  uvs.setXY(0, u0, v1);
  uvs.setXY(1, u1, v1);
  uvs.setXY(2, u0, v0);
  uvs.setXY(3, u1, v0);
  uvs.needsUpdate = true;

  geo.translate(physWidth / 2 - pivotX, physHeight / 2 - pivotY, 0);
  geo.userData = { physWidth, physHeight, svgX, svgY, svgW, svgH, pivotX, pivotY };
  return geo;
}

function CosmeticBDecals({ geom, decals, panelName, nL, nW, nH, thickness, dynScaleFactor, uSX, uSY, uSZ, T }) {
  if (!decals || decals.length === 0) return null;
  const { physWidth, physHeight, svgX, svgY, svgW, svgH, pivotX, pivotY } = geom.userData;

  return decals.map((decal, i) => {
    // 1. Convert decal from scaled UI space back to raw mm space
    const dynX = decal.x / dynScaleFactor;
    const dynY = decal.y / dynScaleFactor;

    // 2. Inverse map the dynamic mm coordinates BACK to the hardcoded template coordinates
    const { origX: cx_svg, origY: cy_svg } = inverseTransformPoint(dynX, dynY, nL, nW, nH);

    if (
      cx_svg < svgX ||
      cx_svg > svgX + svgW ||
      cy_svg < svgY ||
      cy_svg > svgY + svgH
    ) {
      return null;
    }

    const localX = (cx_svg - svgX) / svgW * physWidth;
    const localY = (cy_svg - svgY) / svgH * physHeight;
    const cx = localX - pivotX;
    const cy = physHeight - localY - pivotY;

    const dynW = decal.width / dynScaleFactor;
    const dynH = decal.height / dynScaleFactor;

    const modifiedDecal = {
      ...decal,
      custom: true,
      x: cx,
      y: cy,
      rotation: -(decal.rotation || 0),
      width: dynW,
      height: dynH,
      panel: panelName
    };

    return (
      <DecalItem
        key={decal.id || i}
        decal={modifiedDecal}
        index={i}
        panel={panelName}
        T={T}
        isFlatGeometry={decal.surface === "Outside"}
      />
    );
  });
}

function buildCosmeticBGeometries(sX, sZ, sY) {
  return {
    // 1. Tray Base (Stationary bottom of the box)
    trayBaseGeom: createUVGeometry(280.0 * sX, 260.0 * sZ, 135.5, 390.5, 280.0, 260.0, 140.0 * sX, 130.0 * sZ),

    // 2. Tray Front Wall
    trayFrontGeom: createUVGeometry(275.0 * sX, 60.5 * sY, 138.0, 650.5, 275.0, 60.5, 137.5 * sX, 60.5 * sY),

    // 3. Tray Back Wall
    trayBackGeom: createUVGeometry(270.0 * sX, 62.0 * sY, 140.5, 328.5, 270.0, 62.0, 135.0 * sX, 0),

    // 4. Tray Left Roll-Over Assembly
    trayLeftOuterGeom: createUVGeometry(62.0 * sY, 260.0 * sZ, 73.5, 390.5, 62.0, 260.0, 62.0 * sY, 130.0 * sZ),
    trayLeftRimGeom: createUVGeometry(5.0 * sX, 260.0 * sZ, 68.5, 390.5, 5.0, 260.0, 5.0 * sX, 130.0 * sZ),
    trayLeftInnerGeom: createUVGeometry(63.5 * sY, 260.0 * sZ, 5.0, 390.5, 63.5, 260.0, 63.5 * sY, 130.0 * sZ),

    // 5. Tray Right Roll-Over Assembly
    trayRightOuterGeom: createUVGeometry(62.0 * sY, 260.0 * sZ, 415.5, 390.5, 62.0, 260.0, 0, 130.0 * sZ),
    trayRightRimGeom: createUVGeometry(5.0 * sX, 260.0 * sZ, 477.5, 390.5, 5.0, 260.0, 0, 130.0 * sZ),
    trayRightInnerGeom: createUVGeometry(63.5 * sY, 260.0 * sZ, 482.5, 390.5, 63.5, 260.0, 0, 130.0 * sZ),

    // Dust Flaps (attached to Left/Right outer walls)
    frontLeftDustGeom: createUVGeometry(104.0 * sZ, 57.5 * sY, 34.0, 653.5, 104.0, 57.5, 104.0 * sZ, 57.5 * sY),
    frontRightDustGeom: createUVGeometry(104.0 * sZ, 57.5 * sY, 413.0, 653.5, 104.0, 57.5, 0, 57.5 * sY),
    backLeftDustGeom: createUVGeometry(104.0 * sZ, 58.0 * sY, 33.0, 329.5, 104.0, 58.0, 104.0 * sZ, 0),
    backRightDustGeom: createUVGeometry(104.0 * sZ, 58.0 * sY, 414.0, 329.5, 104.0, 58.0, 0, 0),

    // 6. Top Lid & Side Flaps
    topLidGeom: createUVGeometry(270.0 * sX, 261.5 * sZ, 140.5, 67.0, 270.0, 261.5, 135.0 * sX, 0),
    lidLeftDustGeom: createUVGeometry(60.5 * sX, 261.5 * sZ, 80.0, 67.0, 60.5, 261.5, 60.5 * sX, 0),
    lidRightDustGeom: createUVGeometry(60.5 * sX, 261.5 * sZ, 410.5, 67.0, 60.5, 261.5, 0, 0),

    // 7. Front Tuck Flap & Side Ear Locks (Cherry Locks)
    frontTuckGeom: createUVGeometry(277.0 * sX, 62.0 * sY, 137.0, 5.0, 277.0, 62.0, 138.5 * sX, 0),
    tuckLeftEarGeom: createUVGeometry(52.0 * sX, 61.0 * sY, 85.0, 5.0, 52.0, 61.0, 52.0 * sX, 0),
    tuckRightEarGeom: createUVGeometry(52.0 * sX, 61.0 * sY, 414.0, 5.0, 52.0, 61.0, 0, 0),
  };
}

export default function CosmeticBBox3DViewer({
  L = 11.0236,
  W = 10.2362,
  H = 2.4409,
  T = 0.0197,
  progress = 0,
  lightingPreset = "studio",
  decals = [],
  overrideLayout = null,
  zoom = 1,
  activeAnimation = "none",
  colorOverride = null,
  disableZoom = false,
  useStore = useBoxStore
}) {
  const store = useStore();

  const scaleFactor = 1 / 25.4;
  const userScaleX = (L / (BASE_W * scaleFactor)) || 1;
  const userScaleZ = (W / (BASE_D * scaleFactor)) || 1;
  const userScaleY = (H / (BASE_H * scaleFactor)) || 1;

  const nL = L < 50 ? L * 25.4 : L;
  const nW = W < 50 ? W * 25.4 : W;
  const nH = H < 50 ? H * 25.4 : H;
  const thickness = (L < 50 ? (T || 0.0197) * 25.4 : (T || 0.5));
  const dynScaleFactor = (L < 50) ? (1 / 25.4) : 1;

  const geoms = useMemo(() => buildCosmeticBGeometries(userScaleX, userScaleZ, userScaleY), [userScaleX, userScaleZ, userScaleY]);

  const isKraft = store.materialCategory === 'kraft_cardboard' ||
    store.materialCategory === 'kraft_paperboard' ||
    (store.materialType || '').toLowerCase().includes('kraft');
  const materialCategoryToUse = isKraft ? 'kraft_paperboard' : (store.materialCategory || 'white_paperboard');

  const packageColorToUse = colorOverride || store.packageColor;

  // Standard procedural paperboard texture matching all KLD boxes
  const texture = useMemo(
    () => createProceduralTexture(materialCategoryToUse, packageColorToUse),
    [materialCategoryToUse, packageColorToUse]
  );

  const mats = useMemo(
    () => buildMaterials(materialCategoryToUse, texture, store.insideColor, packageColorToUse),
    [materialCategoryToUse, texture, store.insideColor, packageColorToUse]
  );

  const alphaMap = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const map = loader.load('/images/boxes/cosmetic_b_mask.png');
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);

  // Exterior Carton Material
  const outsideMaterial = useMemo(() => {
    const mat = mats.outside.clone();
    mat.alphaMap = alphaMap;
    mat.transparent = true;
    mat.alphaTest = 0.5;
    mat.side = THREE.DoubleSide;
    mat.shadowSide = THREE.DoubleSide;
    return mat;
  }, [mats.outside]);

  // Exterior Carton Material (BackSide)
  const outsideBackMaterial = useMemo(() => {
    const mat = mats.outside.clone();
    mat.alphaMap = alphaMap;
    mat.transparent = true;
    mat.alphaTest = 0.5;
    mat.side = THREE.DoubleSide;
    mat.shadowSide = THREE.DoubleSide;
    return mat;
  }, [mats.outside]);

  // Interior Carton Liner Material
  const insideMaterial = useMemo(() => {
    const mat = mats.inside.clone();
    if (isKraft || materialCategoryToUse === 'corrugated') {
      mat.map = texture;
    }
    mat.alphaMap = alphaMap;
    mat.transparent = true;
    mat.alphaTest = 0.5;
    mat.side = THREE.DoubleSide;
    mat.shadowSide = THREE.DoubleSide;
    return mat;
  }, [mats.inside, isKraft, materialCategoryToUse, texture]);

  // Interior Carton Liner Material (BackSide)
  const insideBackMaterial = useMemo(() => {
    const mat = mats.inside.clone();
    if (isKraft || materialCategoryToUse === 'corrugated') {
      mat.map = texture;
    }
    mat.alphaMap = alphaMap;
    mat.transparent = true;
    mat.alphaTest = 0.5;
    mat.side = THREE.DoubleSide;
    mat.shadowSide = THREE.DoubleSide;
    return mat;
  }, [mats.inside, isKraft, materialCategoryToUse, texture]);

  // ── Kinematics Calculation (0 to 1) ────────────────────────────────────────
  const t = Math.min(Math.max(progress, 0), 1);

  // Phase 1 (0.00 -> 0.15): Front and Back walls stand UP 90°
  const tFrontBackUp = Math.min(Math.max(t / 0.15, 0), 1);
  const angleFrontBack = tFrontBackUp * (Math.PI / 2);

  // Phase 2 (0.15 -> 0.30): Corner dust flaps fold IN 90°
  const tDust = Math.min(Math.max((t - 0.15) / 0.15, 0), 1);
  const angleDust = tDust * (Math.PI / 2);

  // Phase 3 (0.30 -> 0.45): Left and Right outer walls stand UP 90°
  const tLeftRightUp = Math.min(Math.max((t - 0.30) / 0.15, 0), 1);
  const angleLeftRight = tLeftRightUp * (Math.PI / 2);

  // Phase 4 (0.45 -> 0.60): Roll-over rims & inner walls roll OVER & DOWN (180°) into tray
  const tRollOver = Math.min(Math.max((t - 0.45) / 0.15, 0), 1);
  const angleSideRim = tRollOver * (Math.PI / 2);
  const angleSideInner = tRollOver * (Math.PI / 2);

  // Phase 5 (0.60 -> 0.75): Lid ear flaps fold IN 90°
  const tLidFlaps = Math.min(Math.max((t - 0.60) / 0.15, 0), 1);
  const angleLidFlap = tLidFlaps * (Math.PI / 2);

  // Phase 6 (0.75 -> 0.90): Lid folds FORWARD 90° across the top of the tray
  const tLidClose = Math.min(Math.max((t - 0.75) / 0.15, 0), 1);
  const angleLidClose = tLidClose * (Math.PI / 2);

  // Phase 7 (0.85 -> 1.00): Front tuck flap folds DOWN 90° into front slot
  const tTuck = Math.min(Math.max((t - 0.85) / 0.15, 0), 1);
  const angleTuck = tTuck * (Math.PI / 2);

  const debouncedDecals = useDebouncedDecals(decals, 150);

  const layout = overrideLayout || store.sceneLayout || "single";
  const sceneInstances = useMemo(
    () => buildSceneInstances(layout, L, W, H),
    [layout, L, W, H]
  );

  const renderPanel = (geom, panelName, skipInside = false) => {
    return (
      <group>
        <mesh
          geometry={geom}
          material={outsideMaterial}
          castShadow
          receiveShadow
        />
        {!skipInside && (
          <mesh
            geometry={geom}
            material={insideBackMaterial}
            receiveShadow
          />
        )}
        <CosmeticBDecals
          geom={geom}
          decals={debouncedDecals}
          panelName={panelName}
          nL={nL}
          nW={nW}
          nH={nH}
          thickness={thickness}
          dynScaleFactor={dynScaleFactor}
          uSX={userScaleX}
          uSY={userScaleY}
          uSZ={userScaleZ}
          T={T}
        />
      </group>
    );
  };

  const renderBoxInstance = (key, pos, rot) => (
    <group key={key} position={pos} rotation={rot}>
      <group scale={[scaleFactor, scaleFactor, scaleFactor]}>
        {/* Tray Base - Stationary anchor on the floor */}
        <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {renderPanel(geoms.trayBaseGeom, "trayBase")}

          {/* Tray Front Wall */}
          <group position={[0, -130.0 * userScaleZ, 0]} rotation={[-angleFrontBack, 0, 0]}>
            {renderPanel(geoms.trayFrontGeom, "trayFront")}
            {/* Front Left Dust Flap (folds in along left wall) */}
            <group position={[-137.5 * userScaleX, 0, 0]} rotation={[0, angleDust, 0]}>
              {renderPanel(geoms.frontLeftDustGeom, "frontLeftDust")}
            </group>
            {/* Front Right Dust Flap (folds in along right wall) */}
            <group position={[137.5 * userScaleX, 0, 0]} rotation={[0, -angleDust, 0]}>
              {renderPanel(geoms.frontRightDustGeom, "frontRightDust")}
            </group>
          </group>

          {/* Tray Back Wall */}
          <group position={[0, 130.0 * userScaleZ, 0]} rotation={[angleFrontBack, 0, 0]}>
            {renderPanel(geoms.trayBackGeom, "trayBack")}
            {/* Back Left Dust Flap (folds in along left wall) */}
            <group position={[-135.0 * userScaleX, 0, 0]} rotation={[0, angleDust, 0]}>
              {renderPanel(geoms.backLeftDustGeom, "backLeftDust")}
            </group>
            {/* Back Right Dust Flap (folds in along right wall) */}
            <group position={[135.0 * userScaleX, 0, 0]} rotation={[0, -angleDust, 0]}>
              {renderPanel(geoms.backRightDustGeom, "backRightDust")}
            </group>

            {/* Top Lid Panel (Hinged at top edge of Back Wall, folds FORWARD over the tray) */}
            <group position={[0, 62.0 * userScaleY, 0]} rotation={[angleLidClose, 0, 0]}>
              {renderPanel(geoms.topLidGeom, "topLid")}

              {/* Lid Left Dust Flap (folds IN) */}
              <group position={[-135.0 * userScaleX, 0, 0]} rotation={[0, angleLidFlap, 0]}>
                {renderPanel(geoms.lidLeftDustGeom, "lidLeftDust")}
              </group>

              {/* Lid Right Dust Flap (folds IN) */}
              <group position={[135.0 * userScaleX, 0, 0]} rotation={[0, -angleLidFlap, 0]}>
                {renderPanel(geoms.lidRightDustGeom, "lidRightDust")}
              </group>

              {/* Front Tuck Flap (Hinged at front edge of Lid, folds DOWN into front slot) */}
              <group position={[0, 261.5 * userScaleZ, 0]} rotation={[angleTuck, 0, 0]}>
                {renderPanel(geoms.frontTuckGeom, "frontTuck")}
                
                {/* Left Ear Lock (Cherry lock) - attached to left side of front tuck */}
                <group position={[-138.5 * userScaleX, 0, 0]} rotation={[0, angleLidFlap, 0]}>
                  {renderPanel(geoms.tuckLeftEarGeom, "tuckLeftEar")}
                </group>

                {/* Right Ear Lock (Cherry lock) - attached to right side of front tuck */}
                <group position={[138.5 * userScaleX, 0, 0]} rotation={[0, -angleLidFlap, 0]}>
                  {renderPanel(geoms.tuckRightEarGeom, "tuckRightEar")}
                </group>
              </group>
            </group>
          </group>

          {/* Tray Left Roll-Over Double Wall */}
          <group position={[-140.0 * userScaleX, 0, 0]} rotation={[0, angleLeftRight, 0]}>
            {renderPanel(geoms.trayLeftOuterGeom, "trayLeft")}

            <group position={[-62.0 * userScaleY, 0, 0]} rotation={[0, angleSideRim, 0]}>
              {renderPanel(geoms.trayLeftRimGeom, "trayLeftRim")}
              <group position={[-5.0 * userScaleX, 0, 0]} rotation={[0, angleSideInner, 0]}>
                {renderPanel(geoms.trayLeftInnerGeom, "trayLeftInner")}
              </group>
            </group>
          </group>

          {/* Tray Right Roll-Over Double Wall */}
          <group position={[140.0 * userScaleX, 0, 0]} rotation={[0, -angleLeftRight, 0]}>
            {renderPanel(geoms.trayRightOuterGeom, "trayRight")}

            <group position={[62.0 * userScaleY, 0, 0]} rotation={[0, -angleSideRim, 0]}>
              {renderPanel(geoms.trayRightRimGeom, "trayRightRim")}
              <group position={[5.0 * userScaleX, 0, 0]} rotation={[0, -angleSideInner, 0]}>
                {renderPanel(geoms.trayRightInnerGeom, "trayRightInner")}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );

  const camPos = disableZoom
    ? [L * 0.4, H * 0.5, Math.max(L, W) * 2.2]
    : [L * 1.15, H * 1.8 + 2.5, W * 1.85];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: camPos, fov: 38, zoom }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        shadows
        dpr={[1, 2]}
      >
        <Environment preset="city" />
        <LightingPreset preset={lightingPreset} />
        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.5}
          scale={Math.max(L, W) * 4}
          blur={2.5}
          far={4}
        />

        <SceneAnimator activeAnimation={activeAnimation}>
          <group rotation={layout !== "single" ? [Math.PI / 6, -Math.PI / 4, 0] : [0, 0, 0]}>
            {sceneInstances.map(inst => renderBoxInstance(inst.key, inst.pos, inst.rot))}
          </group>
        </SceneAnimator>

        <OrbitControls
          enableZoom={!disableZoom}
          enablePan={false}
          minDistance={Math.max(W, H) * 0.8}
          maxDistance={Math.max(L, W, H) * 5}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.88}
          target={[0, H * 0.4, 0]}
        />
      </Canvas>
    </div>
  );
}
