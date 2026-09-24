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
  MappedDecals,
  useDebouncedDecals
} from "./sharedUtils";

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON HOLE 3D GEOMETRY BUILDER (UV Mapped with CAD precision)
// Template reference: 3_button_hole_box.svg (320.5 × 213.75 mm)
// ─────────────────────────────────────────────────────────────────────────────
const SVG_W = 320.5;
const SVG_H = 213.75;
const BASE_L = 75.0; // mm
const BASE_W = 75.0; // mm
const BASE_H = 60.0; // mm

function createUVGeometry(physWidth, physHeight, svgX, svgY, svgW, svgH, pivotX, pivotY, svgTotalW = 320.5, svgTotalH = 213.75) {
  const geo = new THREE.PlaneGeometry(physWidth, physHeight);
  const uvs = geo.attributes.uv;

  const u0 = svgX / svgTotalW;
  const u1 = (svgX + svgW) / svgTotalW;
  const v1 = 1.0 - (svgY / svgTotalH);
  const v0 = 1.0 - ((svgY + svgH) / svgTotalH);

  uvs.setXY(0, u0, v1);
  uvs.setXY(1, u1, v1);
  uvs.setXY(2, u0, v0);
  uvs.setXY(3, u1, v0);
  uvs.needsUpdate = true;

  geo.translate(physWidth / 2 - pivotX, physHeight / 2 - pivotY, 0);
  geo.userData = { physWidth, physHeight, svgX, svgY, svgW, svgH, pivotX, pivotY };

  // Create inside geometry with normal pointing in -Z and inverted winding order
  const insideGeo = geo.clone();
  const insideNormals = insideGeo.attributes.normal;
  for (let i = 0; i < insideNormals.count; i++) {
    insideNormals.setZ(i, -1);
  }
  insideNormals.needsUpdate = true;

  const indices = insideGeo.index.array;
  for (let i = 0; i < indices.length; i += 3) {
    const tmp = indices[i];
    indices[i] = indices[i + 2];
    indices[i + 2] = tmp;
  }
  insideGeo.index.needsUpdate = true;
  insideGeo.userData = { physWidth, physHeight, svgX, svgY, svgW, svgH, pivotX, pivotY };

  return { outer: geo, inner: insideGeo };
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON HOLE 3D VIEWER MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ButtonHoleBox3DViewer({
  zoom = 1,
  overrideL, overrideW, overrideH,
  overrideLayout,
  activeAnimation = "none",
  progress = 0,
  decals: propDecals = null,
  colorOverride = null,
  disableZoom = false,
  useStore = useBoxStore,
  showWatermark = false,
  ...props
}) {
  const store = useStore();
  const decals = (propDecals !== null && propDecals !== undefined)
    ? propDecals
    : (store.decalsByModel ? store.decalsByModel[store.boxModel || "button_hole"] || [] : store.decals || []);
  const L = overrideL || props.L || store.L;
  const W = overrideW || props.W || store.W;
  const H = overrideH || props.H || store.H;
  const nT = store.T || 0.0197;

  let manuL = L, manuW = W, manuH = H;
  if (store.sizeMode === "inner") {
    manuL = L + 2 * nT; manuW = W + 2 * nT; manuH = H + 2 * nT;
  } else if (store.sizeMode === "outer") {
    manuL = L - 2 * nT; manuW = W - 2 * nT; manuH = H - 2 * nT;
  }

  const dims = useMemo(() => {
    const nGlue = Number(store.glueFlapWidth) || (L < 10 ? 16.0 / 25.4 : 16.0);
    const nManuL = Number(manuL);
    const nManuW = Number(manuW);
    const nManuH = Number(manuH);
    const x1 = nGlue;
    const x2 = x1 + nManuL;
    const x3 = x2 + nManuW;
    const x4 = x3 + nManuL;
    const x5 = x4 + nManuW;
    const yTop = nManuW * 1.25;
    const yBot = yTop + nManuH;
    return { L: Number(L), W: Number(W), H: Number(H), x1, x2, x3, x4, x5, yTop, yBot };
  }, [L, W, H, manuL, manuW, manuH, store.glueFlapWidth]);

  // ── Dimension scaling (relative to 75x75x60 mm CAD base) ───────────────────
  const scaleFactor = 1 / 25.4;
  const sW = W / (BASE_W * scaleFactor);

  const w = L; // width of back & front panels
  const d = W; // width of left & right panels, box depth
  const h = H; // height of body panels
  const glueW = Math.max(0.3, (Number(store.glueFlapWidth) || (16.0 * scaleFactor)));
  const topLidH = d;
  const topTuckH = 12.25 * scaleFactor;
  const topDustH = 36.5 * scaleFactor * sW;
  const frontBotH = 61.5 * scaleFactor * sW;
  const sideBotH = 35.0 * scaleFactor * sW;
  const backBotH = 56.5 * scaleFactor * sW;

  const geoms = useMemo(() => {
    const make = (pw, ph, sx, sy, sw, sh, px, py) => createUVGeometry(pw, ph, sx, sy, sw, sh, px, py);
    const back = make(w, h, 16.0, 92.25, 75.0, 60.0, w / 2, h / 2);
    const glue = make(glueW, h, 0.0, 92.25, 16.0, 60.0, glueW, h / 2);
    const left = make(d, h, 91.0, 92.25, 75.0, 60.0, 0, h / 2);
    const front = make(w, h, 166.0, 92.25, 75.0, 60.0, w / 2, h / 2);
    const right = make(d, h, 241.0, 92.25, 74.5, 60.0, 0, h / 2);

    const topLid = make(w, topLidH, 16.0, 17.25, 75.0, 75.0, w / 2, 0);
    const topTuck = make(w, topTuckH, 16.0, 5.0, 75.0, 12.25, w / 2, 0);
    const leftTopDust = make(d, topDustH, 91.0, 55.75, 75.0, 36.5, d / 2, 0);
    const rightTopDust = make(d, topDustH, 241.0, 55.75, 74.5, 36.5, d / 2, 0);

    const frontBotFlap = make(w, frontBotH, 166.0, 152.25, 75.0, 61.5, w / 2, frontBotH);
    const leftBotDust = make(d, sideBotH, 91.0, 152.25, 75.0, 35.0, d / 2, sideBotH);
    const rightBotDust = make(d, sideBotH, 241.0, 152.25, 74.5, 35.0, d / 2, sideBotH);
    const backBotFlap = make(w, backBotH, 16.0, 152.25, 75.0, 56.5, w / 2, backBotH);

    return {
      backGeom: back.outer, backGeomInside: back.inner,
      glueGeom: glue.outer, glueGeomInside: glue.inner,
      leftGeom: left.outer, leftGeomInside: left.inner,
      frontGeom: front.outer, frontGeomInside: front.inner,
      rightGeom: right.outer, rightGeomInside: right.inner,
      topLidGeom: topLid.outer, topLidGeomInside: topLid.inner,
      topTuckGeom: topTuck.outer, topTuckGeomInside: topTuck.inner,
      leftTopDustGeom: leftTopDust.outer, leftTopDustGeomInside: leftTopDust.inner,
      rightTopDustGeom: rightTopDust.outer, rightTopDustGeomInside: rightTopDust.inner,
      frontBotFlapGeom: frontBotFlap.outer, frontBotFlapGeomInside: frontBotFlap.inner,
      leftBotDustGeom: leftBotDust.outer, leftBotDustGeomInside: leftBotDust.inner,
      rightBotDustGeom: rightBotDust.outer, rightBotDustGeomInside: rightBotDust.inner,
      backBotFlapGeom: backBotFlap.outer, backBotFlapGeomInside: backBotFlap.inner,
    };
  }, [w, d, h, glueW, topLidH, topTuckH, topDustH, frontBotH, sideBotH, backBotH]);

  // ── Kinematics (Faithful to button_hole/main.js) ───────────────────────────
  // val = 0 (open/flat), val = 1 (closed)
  const val = Math.min(Math.max(progress, 0), 1);

  // 1. Fold tube (val: 0 - 0.4)
  const bodyAngle = val <= 0.4 ? (val / 0.4) * (Math.PI / 2) : Math.PI / 2;
  const glueAngle = -bodyAngle;

  // 2. Fold Bottom Back Flap (val: 0.4 - 0.5) - Flap 1 folds in
  let backBotAngle = 0;
  if (val > 0.4 && val <= 0.5) {
    backBotAngle = ((val - 0.4) / 0.1) * (Math.PI * 0.75);
  } else if (val > 0.5 && val <= 0.7) {
    backBotAngle = Math.PI * 0.75;
  } else if (val > 0.7 && val <= 0.73) {
    // After 0.7: Flap 1 springs back to flat (90 degrees / Math.PI/2)
    backBotAngle = Math.PI * 0.75 - ((val - 0.7) / 0.03) * (Math.PI * 0.25);
  } else if (val > 0.73) {
    backBotAngle = Math.PI / 2;
  }

  // 3. Fold Bottom Dust Flaps (val: 0.5 - 0.6) - Flaps 2a/2b fold in
  let sideBotAngle = 0;
  if (val > 0.5 && val <= 0.6) {
    sideBotAngle = ((val - 0.5) / 0.1) * (Math.PI * 0.75);
  } else if (val > 0.6 && val <= 0.7) {
    sideBotAngle = Math.PI * 0.75;
  } else if (val > 0.7 && val <= 0.73) {
    // After 0.7: Flap 1 pushes 2a/2b back to flat
    sideBotAngle = Math.PI * 0.75 - ((val - 0.7) / 0.03) * (Math.PI * 0.25);
  } else if (val > 0.73) {
    sideBotAngle = Math.PI / 2;
  }

  // 3.5 Fold Bottom Front Flap (val: 0.6 - 0.7) - Flap 3 folds in
  let frontBotAngle = 0;
  if (val > 0.6 && val <= 0.7) {
    frontBotAngle = ((val - 0.6) / 0.1) * (Math.PI * 0.75);
  } else if (val > 0.7 && val <= 0.73) {
    // After 0.7: Flap 1 pushes Flap 3 back to flat as well
    frontBotAngle = Math.PI * 0.75 - ((val - 0.7) / 0.03) * (Math.PI * 0.25);
  } else if (val > 0.73) {
    frontBotAngle = Math.PI / 2;
  }

  // 4. Top Dust Flaps (val: 0.8 - 0.9)
  let dustAngle = 0;
  if (val > 0.8) {
    dustAngle = val <= 0.9 ? ((val - 0.8) / 0.1) * (Math.PI / 2) : Math.PI / 2;
  }

  // 5. Top Lid & Tuck (val: 0.9 - 1.0)
  let lidAngle = 0;
  if (val > 0.9) {
    lidAngle = ((val - 0.9) / 0.1) * (Math.PI / 2);
  }

  // ── Materials & Mask ─────────────────────────────────────────────────────
  const alphaMap = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const map = loader.load("/images/boxes/3_button_hole_box_mask.png");
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);

  const materialCategoryToUse = store.materialCategory || "white_paperboard";
  const packageColorToUse = colorOverride || store.packageColor;
  const isKraft = materialCategoryToUse === "kraft_cardboard" || materialCategoryToUse === "kraft";

  const texture = useMemo(
    () => createProceduralTexture(materialCategoryToUse, packageColorToUse, showWatermark),
    [materialCategoryToUse, packageColorToUse, showWatermark]
  );

  const mats = useMemo(
    () => buildMaterials(materialCategoryToUse, texture, store.insideColor, packageColorToUse),
    [materialCategoryToUse, texture, store.insideColor, packageColorToUse]
  );

  const outsideMaterial = useMemo(() => {
    const mat = mats.outside.clone();
    mat.alphaMap = alphaMap;
    mat.transparent = false;
    mat.alphaTest = 0.5;
    mat.depthWrite = true;
    mat.depthTest = true;
    mat.side = THREE.FrontSide;
    mat.shadowSide = THREE.FrontSide;
    mat.roughness = 0.4;
    mat.metalness = 0.1;
    if (isKraft || materialCategoryToUse === "corrugated") {
      mat.map = texture;
    }
    return mat;
  }, [mats.outside, alphaMap, isKraft, materialCategoryToUse, texture]);

  const insideMaterial = useMemo(() => {
    const mat = mats.inside.clone();
    mat.alphaMap = alphaMap;
    mat.transparent = false;
    mat.alphaTest = 0.5;
    mat.depthWrite = true;
    mat.depthTest = true;
    mat.side = THREE.FrontSide;
    mat.shadowSide = THREE.FrontSide;
    mat.roughness = 0.5;
    mat.metalness = 0.05;
    if (isKraft || materialCategoryToUse === "corrugated") {
      mat.map = texture;
    }
    return mat;
  }, [mats.inside, alphaMap, isKraft, materialCategoryToUse, texture]);

  // ── Scene layout & lighting ──────────────────────────────────────────────
  const debouncedDecals = useDebouncedDecals(decals, 150);
  const outsideDecals = useMemo(() => debouncedDecals.filter(d => d.surface !== "Inside"), [debouncedDecals]);
  const insideDecals = useMemo(() => debouncedDecals.filter(d => d.surface === "Inside"), [debouncedDecals]);

  const layout = overrideLayout || store.sceneLayout || "single";
  const sceneInstances = useMemo(() => buildSceneInstances(layout, L, W, H), [layout, L, W, H]);
  const lightingPreset = store.lightingPreset || "studio";

  // ── Decal clipMasks (precisely aligns decal projection to CAD mask silhouette) ──
  const clipMasks = useMemo(() => {
    const makeMask = (sx, sy, sw, sh, px, py, pw, ph) => ({
      tex: alphaMap,
      totalW: SVG_W,
      totalH: SVG_H,
      sx, sy, sw, sh,
      px, py,
      w: pw,
      h: ph
    });

    return {
      back: makeMask(16.0, 92.25, 75.0, 60.0, w / 2, h / 2, w, h),
      glue: makeMask(0.0, 92.25, 16.0, 60.0, glueW, h / 2, glueW, h),
      left: makeMask(91.0, 92.25, 75.0, 60.0, 0, h / 2, d, h),
      front: makeMask(166.0, 92.25, 75.0, 60.0, w / 2, h / 2, w, h),
      right: makeMask(241.0, 92.25, 74.5, 60.0, 0, h / 2, d, h),
      topLid: makeMask(16.0, 17.25, 75.0, 75.0, w / 2, 0, w, topLidH),
      topTuck: makeMask(16.0, 5.0, 75.0, 12.25, w / 2, 0, w, topTuckH),
      leftTopDust: makeMask(91.0, 55.75, 75.0, 36.5, d / 2, 0, d, topDustH),
      rightTopDust: makeMask(241.0, 55.75, 74.5, 36.5, d / 2, 0, d, topDustH),
      frontBotFlap: makeMask(166.0, 152.25, 75.0, 61.5, w / 2, frontBotH, w, frontBotH),
      leftBotDust: makeMask(91.0, 152.25, 75.0, 35.0, d / 2, sideBotH, d, sideBotH),
      rightBotDust: makeMask(241.0, 152.25, 74.5, 35.0, d / 2, sideBotH, d, sideBotH),
      backBotFlap: makeMask(16.0, 152.25, 75.0, 56.5, w / 2, backBotH, w, backBotH)
    };
  }, [alphaMap, w, d, h, glueW, topLidH, topTuckH, topDustH, frontBotH, sideBotH, backBotH]);

  // ── Decal helpers ────────────────────────────────────────────────────────
  const D_out = (panel, clipMask) => (
    <MappedDecals
      panel={panel} decals={outsideDecals}
      L={L} W={W} H={H}
      manuL={manuL} manuW={manuW} manuH={manuH}
      dims={dims} T={nT}
      isFlatGeometry={true}
      clipMask={clipMask}
    />
  );

  const D_in = (panel, clipMask) => (
    <MappedDecals
      panel={panel} decals={insideDecals}
      L={L} W={W} H={H}
      manuL={manuL} manuW={manuW} manuH={manuH}
      dims={dims} T={nT}
      isFlatGeometry={true}
      clipMask={clipMask}
    />
  );

  // ── Single box instance ──────────────────────────────────────────────────
  // Hierarchy precisely matching button_hole/main.js
  const zOff = -0.002;

  const renderBoxInstance = (key, pos, rot) => (
    <group key={key} position={pos} rotation={rot}>
      {/* Box centering adjustment: smooth transition from flat (z=0) to closed box center (z=d/2) */}
      <group position={[0, 0, (d / 2) * (bodyAngle / (Math.PI / 2))]}>
        {/* 1. Back Panel (Root, Y centered) */}
        <group name="backRef">
          <mesh geometry={geoms.backGeom} material={outsideMaterial} castShadow receiveShadow>
            {D_out("p1", clipMasks.back)}
          </mesh>
          <mesh geometry={geoms.backGeomInside} position={[0, 0, zOff]} material={insideMaterial} receiveShadow>
            {D_in("p1", clipMasks.back)}
          </mesh>

          {/* Glue Tab (Attached to Back's left edge, x = -w/2) */}
          <group position={[-w / 2, 0, 0]} rotation={[0, glueAngle, 0]}>
            <mesh geometry={geoms.glueGeom} material={outsideMaterial}>
              {D_out("p1_glue", clipMasks.glue)}
            </mesh>
            <mesh geometry={geoms.glueGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
              {D_in("p1_glue", clipMasks.glue)}
            </mesh>
          </group>

          {/* 2. Left Panel (Attached to Back's right edge, x = w/2) */}
          <group position={[w / 2, 0, 0]} rotation={[0, bodyAngle, 0]}>
            <mesh geometry={geoms.leftGeom} material={outsideMaterial} castShadow receiveShadow>
              {D_out("p2", clipMasks.left)}
            </mesh>
            <mesh geometry={geoms.leftGeomInside} position={[0, 0, zOff]} material={insideMaterial} receiveShadow>
              {D_in("p2", clipMasks.left)}
            </mesh>

            {/* Left Top Dust Flap */}
            <group position={[d / 2, h / 2, 0]} rotation={[-dustAngle, 0, 0]}>
              <mesh geometry={geoms.leftTopDustGeom} material={outsideMaterial}>
                {D_out("p2_top_dust", clipMasks.leftTopDust)}
              </mesh>
              <mesh geometry={geoms.leftTopDustGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
                {D_in("p2_top_dust", clipMasks.leftTopDust)}
              </mesh>
            </group>

            {/* Left Bottom Dust Flap */}
            <group position={[d / 2, -h / 2, 0]} rotation={[sideBotAngle, 0, 0]}>
              <mesh geometry={geoms.leftBotDustGeom} material={outsideMaterial}>
                {D_out("p2_bot_auto", clipMasks.leftBotDust)}
              </mesh>
              <mesh geometry={geoms.leftBotDustGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
                {D_in("p2_bot_auto", clipMasks.leftBotDust)}
              </mesh>
            </group>

            {/* 3. Front Panel (Attached to Left's outer edge, x = d) */}
            <group position={[d, 0, 0]} rotation={[0, bodyAngle, 0]}>
              <mesh geometry={geoms.frontGeom} position={[w / 2, 0, 0]} material={outsideMaterial} castShadow receiveShadow>
                {D_out("p3", clipMasks.front)}
              </mesh>
              <mesh geometry={geoms.frontGeomInside} position={[w / 2, 0, zOff]} material={insideMaterial} receiveShadow>
                {D_in("p3", clipMasks.front)}
              </mesh>

              {/* Front Bottom Flap (Large tongue flap) */}
              <group position={[w / 2, -h / 2, 0]} rotation={[frontBotAngle, 0, 0]}>
                <mesh geometry={geoms.frontBotFlapGeom} material={outsideMaterial}>
                  {D_out("p3_bot_auto", clipMasks.frontBotFlap)}
                </mesh>
                <mesh geometry={geoms.frontBotFlapGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
                  {D_in("p3_bot_auto", clipMasks.frontBotFlap)}
                </mesh>
              </group>

              {/* 4. Right Panel (Attached to Front's outer edge, x = w) */}
              <group position={[w, 0, 0]} rotation={[0, bodyAngle, 0]}>
                <mesh geometry={geoms.rightGeom} material={outsideMaterial} castShadow receiveShadow>
                  {D_out("p4", clipMasks.right)}
                </mesh>
                <mesh geometry={geoms.rightGeomInside} position={[0, 0, zOff]} material={insideMaterial} receiveShadow>
                  {D_in("p4", clipMasks.right)}
                </mesh>

                {/* Right Top Dust Flap */}
                <group position={[d / 2, h / 2, 0]} rotation={[-dustAngle, 0, 0]}>
                  <mesh geometry={geoms.rightTopDustGeom} material={outsideMaterial}>
                    {D_out("p4_top_dust", clipMasks.rightTopDust)}
                  </mesh>
                  <mesh geometry={geoms.rightTopDustGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
                    {D_in("p4_top_dust", clipMasks.rightTopDust)}
                  </mesh>
                </group>

                {/* Right Bottom Dust Flap */}
                <group position={[d / 2, -h / 2, 0]} rotation={[sideBotAngle, 0, 0]}>
                  <mesh geometry={geoms.rightBotDustGeom} material={outsideMaterial}>
                    {D_out("p4_bot_auto", clipMasks.rightBotDust)}
                  </mesh>
                  <mesh geometry={geoms.rightBotDustGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
                    {D_in("p4_bot_auto", clipMasks.rightBotDust)}
                  </mesh>
                </group>
              </group>
            </group>
          </group>

          {/* === TOP FLAPS === */}
          {/* Top Lid (Attached to Back's top edge, y = h/2) */}
          <group position={[0, h / 2, 0]} rotation={[-lidAngle, 0, 0]}>
            <mesh geometry={geoms.topLidGeom} material={outsideMaterial}>
              {D_out("p1_top_cover", clipMasks.topLid)}
            </mesh>
            <mesh geometry={geoms.topLidGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
              {D_in("p1_top_cover", clipMasks.topLid)}
            </mesh>

            {/* Top Tuck Tab (Attached to Top Lid's outer edge, y = topLidH) */}
            <group position={[0, topLidH, 0]} rotation={[-lidAngle, 0, 0]}>
              <mesh geometry={geoms.topTuckGeom} material={outsideMaterial}>
                {D_out("p1_top_lip", clipMasks.topTuck)}
              </mesh>
              <mesh geometry={geoms.topTuckGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
                {D_in("p1_top_lip", clipMasks.topTuck)}
              </mesh>
            </group>
          </group>

          {/* === BOTTOM FLAPS === */}
          {/* Back Bottom Flap (Button hole slot flap, attached to Back's bottom edge, y = -h/2) */}
          <group position={[0, -h / 2, 0]} rotation={[backBotAngle, 0, 0]}>
            <mesh geometry={geoms.backBotFlapGeom} material={outsideMaterial}>
              {D_out("p1_bot_auto", clipMasks.backBotFlap)}
            </mesh>
            <mesh geometry={geoms.backBotFlapGeomInside} position={[0, 0, zOff]} material={insideMaterial}>
              {D_in("p1_bot_auto", clipMasks.backBotFlap)}
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );

  const camPos = disableZoom
    ? [L * 0.4, H * 0.25, Math.max(L, H) * 2.0]
    : [L * 1.5, H * 1.2, W * 2.5];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: camPos, fov: 40, zoom }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        shadows
        dpr={[1, 2]}
      >
        <React.Suspense fallback={null}>
          <Environment preset="city" />
        </React.Suspense>
        <LightingPreset preset={lightingPreset} />
        <ContactShadows
          position={[0, -h / 2 - 0.05, 0]}
          opacity={0.5}
          scale={Math.max(L, W) * 4}
          blur={2.5}
          far={4}
          resolution={256}
          frames={1}
        />

        <SceneAnimator activeAnimation={activeAnimation}>
          <group rotation={layout !== "single" ? [Math.PI / 6, -Math.PI / 4, 0] : [0, 0, 0]}>
            {sceneInstances.map(inst => renderBoxInstance(inst.key, inst.pos, inst.rot))}
          </group>
        </SceneAnimator>

        <OrbitControls enableZoom={!disableZoom} enablePan={false} />
      </Canvas>
    </div>
  );
}
