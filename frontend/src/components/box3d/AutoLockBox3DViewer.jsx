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

function buildAutoLockGeometries(L, W, H, nT, decals, manuL, manuW, manuH, dims) {
    const SVG_WIDTH = 387.9;
    const SVG_HEIGHT = 295.25;

    const orig_d = 60.6;
    const TUCK_FLAP_H = 14.7 * (W / orig_d);
    const DUST_H = 38.0 * (W / orig_d);
    const botH = 48.35 * (W / orig_d);
    const GLUE_W = 16.0 * (W / orig_d);

    function createUVGeometry(baseShape, physWidth, physHeight, svgX, svgY, svgW, svgH, pivotX, pivotY, holes = []) {
        if (holes && holes.length > 0) {
            baseShape.holes.push(...holes);
        }

        const extrude = { depth: 0.015, bevelEnabled: false };
        const geo = new THREE.ExtrudeGeometry(baseShape, extrude);
        
        // assign UVs for the front face
        const pos = geo.attributes.position;
        const uvs = new Float32Array(pos.count * 2);
        const u0 = svgX / SVG_WIDTH;
        const u1 = (svgX + svgW) / SVG_WIDTH;
        const v1 = 1.0 - (svgY / SVG_HEIGHT);
        const v0 = 1.0 - ((svgY + svgH) / SVG_HEIGHT);

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const nx = (x + physWidth / 2) / physWidth;
            const ny = (y + physHeight / 2) / physHeight;
            uvs[i * 2] = u0 + nx * (u1 - u0);
            uvs[i * 2 + 1] = v0 + ny * (v1 - v0);
        }

        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geo.translate(physWidth / 2 - pivotX, physHeight / 2 - pivotY, -0.015);
        assignMaterialGroups(geo, 0.015);
        
        const filmGeom = (holes && holes.length > 0) ? new THREE.ShapeGeometry(holes) : null;
        if (filmGeom) filmGeom.translate(physWidth / 2 - pivotX, physHeight / 2 - pivotY, 0);
        
        return { geo, filmGeom };
    }

    function createRectShape(w, h) {
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2, -h / 2);
        shape.lineTo(w / 2, -h / 2);
        shape.lineTo(w / 2, h / 2);
        shape.lineTo(-w / 2, h / 2);
        shape.closePath();
        return shape;
    }

    function createWideBotShape(w, h) {
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2, h / 2);
        shape.lineTo(w / 2, h / 2);
        shape.lineTo(w * 0.483, h / 2 - h * 0.9);
        shape.lineTo(w * 0.45, -h / 2);
        shape.lineTo(w * 0.397, -h / 2);
        shape.lineTo(w * 0.248, -h * 0.13);
        shape.lineTo(0, -h * 0.13);
        shape.lineTo(-w * 0.116, -h / 2);
        shape.lineTo(-w * 0.46, -h / 2);
        shape.closePath();
        return shape;
    }

    function createNarrowBotShape(w, h) {
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2, h / 2);
        shape.lineTo(w / 2, h / 2);
        shape.lineTo(0, h / 2 - w / 2);
        shape.lineTo(-w * 0.31, h / 2 - w / 2);
        shape.closePath();
        return shape;
    }

    const p1Holes = getPanelWindowHoles("p1", decals, createRectShape(L, H), L, W, H, manuL, manuW, manuH, dims, nT, 0, 0);
    const p1Res = createUVGeometry(createRectShape(L, H), L, H, 21.0, 80.3, 120.6, 161.5, L / 2, H / 2, p1Holes);
    const p1Geom = p1Res.geo;
    const windowFilmGeomP1 = p1Res.filmGeom;

    const coverHoles = getPanelWindowHoles("p1_top_cover", decals, createRectShape(L, W), L, W, H, manuL, manuW, manuH, dims, nT, 0, -W/2);
    const coverRes = createUVGeometry(createRectShape(L, W), L, W, 21.0, 19.7, 120.6, 60.6, L / 2, 0, coverHoles);
    const coverGeom = coverRes.geo;
    const windowFilmCover = coverRes.filmGeom;

    const lipHoles = getPanelWindowHoles("p1_top_lip", decals, createRectShape(L, TUCK_FLAP_H), L, W, H, manuL, manuW, manuH, dims, nT, 0, -TUCK_FLAP_H/2);
    const lipRes = createUVGeometry(createRectShape(L, TUCK_FLAP_H), L, TUCK_FLAP_H, 21.0, 5.0, 120.6, 14.7, L / 2, 0, lipHoles);
    const lipGeom = lipRes.geo;
    const windowFilmLip = lipRes.filmGeom;

    const p1BotHoles = getPanelWindowHoles("p1_bot_auto", decals, createWideBotShape(L, botH), L, W, H, manuL, manuW, manuH, dims, nT, 0, botH/2);
    const p1BotRes = createUVGeometry(createWideBotShape(L, botH), L, botH, 21.0, 241.8, 120.6, 48.35, L / 2, botH, p1BotHoles);
    const p1BotGeom = p1BotRes.geo;
    const windowFilmP1Bot = p1BotRes.filmGeom;

    const glueHoles = getPanelWindowHoles("p1_glue", decals, createRectShape(GLUE_W, H), L, W, H, manuL, manuW, manuH, dims, nT, -GLUE_W/2, 0);
    const glueRes = createUVGeometry(createRectShape(GLUE_W, H), GLUE_W, H, 5.0, 80.3, 16.0, 161.5, GLUE_W, H / 2, glueHoles);
    const glueGeom = glueRes.geo;
    const windowFilmGlue = glueRes.filmGeom;

    const p2Holes = getPanelWindowHoles("p2", decals, createRectShape(W, H), L, W, H, manuL, manuW, manuH, dims, nT, -W/2, 0);
    const p2Res = createUVGeometry(createRectShape(W, H), W, H, 141.6, 80.3, 60.6, 161.5, 0, H / 2, p2Holes);
    const p2Geom = p2Res.geo;
    const windowFilmGeomP2 = p2Res.filmGeom;
    
    const p2DustHoles = getPanelWindowHoles("p2_top_dust", decals, createRectShape(W, DUST_H), L, W, H, manuL, manuW, manuH, dims, nT, 0, -DUST_H/2);
    const p2DustRes = createUVGeometry(createRectShape(W, DUST_H), W, DUST_H, 141.6, 42.35, 60.6, 38.0, W / 2, 0, p2DustHoles);
    const p2DustGeom = p2DustRes.geo;
    const windowFilmP2Dust = p2DustRes.filmGeom;

    const p2BotHoles = getPanelWindowHoles("p2_bot_auto", decals, createNarrowBotShape(W, botH), L, W, H, manuL, manuW, manuH, dims, nT, 0, botH/2);
    const p2BotRes = createUVGeometry(createNarrowBotShape(W, botH), W, botH, 141.6, 241.8, 60.6, 48.35, W / 2, botH, p2BotHoles);
    const p2BotGeom = p2BotRes.geo;
    const windowFilmP2Bot = p2BotRes.filmGeom;

    const p3Holes = getPanelWindowHoles("p3", decals, createRectShape(L, H), L, W, H, manuL, manuW, manuH, dims, nT, 0, 0);
    const p3Res = createUVGeometry(createRectShape(L, H), L, H, 202.2, 80.3, 120.6, 161.5, L / 2, H / 2, p3Holes);
    const p3Geom = p3Res.geo;
    const windowFilmGeomP3 = p3Res.filmGeom;

    const p3BotHoles = getPanelWindowHoles("p3_bot_auto", decals, createWideBotShape(L, botH), L, W, H, manuL, manuW, manuH, dims, nT, 0, botH/2);
    const p3BotRes = createUVGeometry(createWideBotShape(L, botH), L, botH, 202.2, 241.8, 120.6, 48.35, L / 2, botH, p3BotHoles);
    const p3BotGeom = p3BotRes.geo;
    const windowFilmP3Bot = p3BotRes.filmGeom;

    const p4Holes = getPanelWindowHoles("p4", decals, createRectShape(W, H), L, W, H, manuL, manuW, manuH, dims, nT, -W/2, 0);
    const p4Res = createUVGeometry(createRectShape(W, H), W, H, 322.8, 80.3, 60.6, 161.5, 0, H / 2, p4Holes);
    const p4Geom = p4Res.geo;
    const windowFilmGeomP4 = p4Res.filmGeom;
    
    const p4DustHoles = getPanelWindowHoles("p4_top_dust", decals, createRectShape(W, DUST_H), L, W, H, manuL, manuW, manuH, dims, nT, 0, -DUST_H/2);
    const p4DustRes = createUVGeometry(createRectShape(W, DUST_H), W, DUST_H, 322.8, 42.35, 60.6, 38.0, W / 2, 0, p4DustHoles);
    const p4DustGeom = p4DustRes.geo;
    const windowFilmP4Dust = p4DustRes.filmGeom;

    const p4BotHoles = getPanelWindowHoles("p4_bot_auto", decals, createNarrowBotShape(W, botH), L, W, H, manuL, manuW, manuH, dims, nT, 0, botH/2);
    const p4BotRes = createUVGeometry(createNarrowBotShape(W, botH), W, botH, 322.8, 241.8, 60.6, 48.35, W / 2, botH, p4BotHoles);
    const p4BotGeom = p4BotRes.geo;
    const windowFilmP4Bot = p4BotRes.filmGeom;

    return {
        p1Geom, coverGeom, lipGeom, p1BotGeom, glueGeom,
        p2Geom, p2DustGeom, p2BotGeom,
        p3Geom, p3BotGeom,
        p4Geom, p4DustGeom, p4BotGeom,
        coverH: W,
        windowFilmGeomP1, windowFilmGeomP2, windowFilmGeomP3, windowFilmGeomP4,
        windowFilmCover, windowFilmLip, windowFilmP1Bot, windowFilmGlue,
        windowFilmP2Dust, windowFilmP2Bot, windowFilmP3Bot, windowFilmP4Dust, windowFilmP4Bot
    };
}

export default function AutoLockBox3DViewer({
  zoom = 1,
  overrideL, overrideW, overrideH,
  overrideLayout, activeAnimation,
  progress = 0,
  decals = [],
  colorOverride = null,
  disableZoom = false
}) {
  const store = useBoxStore();
  const L = overrideL || store.L;
  const W = overrideW || store.W;
  const H = overrideH || store.H;
  const nT = store.T;
  let manuL = L, manuW = W, manuH = H;
  if (store.sizeMode === "inner") {
    manuL = L + 2 * nT; manuW = W + 2 * nT; manuH = H + 2 * nT;
  } else if (store.sizeMode === "outer") {
    manuL = L - 2 * nT; manuW = W - 2 * nT; manuH = H - 2 * nT;
  }
  const dims = useMemo(() => {
    const nGlue = Number(store.glueFlapWidth) || 16.0/25.4;
    const nManuL = Number(manuL);
    const nManuW = Number(manuW);
    const nManuH = Number(manuH);
    const x1 = nGlue;
    const x2 = x1 + nManuL;
    const x3 = x2 + nManuW;
    const x4 = x3 + nManuL;
    const x5 = x4 + nManuW;
    const yTop = nManuW * 1.3;
    const yBot = yTop + nManuH;
    return { L: Number(L), W: Number(W), H: Number(H), x1, x2, x3, x4, x5, yTop, yBot };
  }, [L, W, H, manuL, manuW, manuH, store.glueFlapWidth]);

  const debouncedDecals = useDebouncedDecals(decals, 100);
  const lightingPreset = store.lightingPreset || "studio";

  // In main.js, 0 is fully closed and 1 is fully open/flat. 
  // In our UI, progress is 0 (flat) to 1 (closed). So we reverse it:
  const val = 1.0 - progress;

  let t3 = 0;
  if (val <= 0.1) t3 = 1.0 - (val / 0.1);

  let t2 = 0;
  if (val <= 0.1) t2 = 1.0;
  else if (val <= 0.2) t2 = 1.0 - ((val - 0.1) / 0.1);

  let A = Math.PI / 2;
  if (val > 0.2 && val <= 0.4) {
      const sq = (val - 0.2) / 0.2;
      A = (Math.PI / 2) + sq * (Math.PI / 2);
  } else if (val > 0.4 && val <= 0.6) {
      const unsq = (val - 0.4) / 0.2;
      A = Math.PI - unsq * (Math.PI / 2);
  }

  let baseBotAngle = Math.PI / 2;
  if (val <= 0.2) baseBotAngle = Math.PI / 2;
  else if (val > 0.2 && val <= 0.4) {
      const sq = (val - 0.2) / 0.2;
      baseBotAngle = (Math.PI / 2) + sq * (Math.PI / 2);
  } else if (val > 0.4 && val <= 0.6) {
      baseBotAngle = Math.PI;
  } else {
      baseBotAngle = Math.PI;
  }

  let botAngleFront = baseBotAngle;
  let botAngleRight = baseBotAngle;
  let botAngleBack = baseBotAngle;
  let botAngleLeft = baseBotAngle;

  if (val > 0.6) {
      let tF = Math.min(Math.max((val - 0.60) / 0.05, 0), 1);
      botAngleFront = Math.PI * (1 - tF);
      let tR = Math.min(Math.max((val - 0.65) / 0.05, 0), 1);
      botAngleRight = Math.PI * (1 - tR);
      let tB = Math.min(Math.max((val - 0.70) / 0.05, 0), 1);
      botAngleBack = Math.PI * (1 - tB);
      let tL = Math.min(Math.max((val - 0.75) / 0.05, 0), 1);
      botAngleLeft = Math.PI * (1 - tL);
  }

  let t4 = 0;
  if (val > 0.80) t4 = (val - 0.80) / 0.20;

  const p2RotY = A * (1 - t4);
  const p3RotY = (Math.PI - A) * (1 - t4);
  const p4RotY = A * (1 - t4);

  let glueAngle = A - Math.PI;
  if (val <= 0.2) glueAngle -= 0.05;
  const glueRotY = glueAngle * (1 - t4);
  const gluePosX = -L / 2 + ((1 - t4) * 0.5);

  const bF = botAngleFront / Math.PI;
  const botFrontPos = [0, -H / 2 + bF * 0.01, 0];

  const bB = botAngleBack / Math.PI;
  const botBackPos = [0, -H / 2 + bB * 0.02, 0];

  const bR = botAngleRight / Math.PI;
  const botRightPos = [0, -H / 2 + bR * 0.03, 0];

  const bL = botAngleLeft / Math.PI;
  const botLeftPos = [0, -H / 2 + bL * 0.04, 0];

  const td2Pos = [0, H / 2 - t2 * 0.01, 0];
  const td4Pos = [0, H / 2 - t2 * 0.02, 0];
  const tdRotX = t2 * (-Math.PI / 2);

  const topLidRotX = t3 * -Math.PI / 2;
  const topTuckRotX = t3 * (-Math.PI / 2 - 0.05);
  const topTuckScaleX = 1.0 - (t3 * 0.02);

  const orig_d = 60.6;
  const botH = 48.35 * (W / orig_d);

  const geoms = useMemo(() => buildAutoLockGeometries(L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims), [L, W, H, nT, debouncedDecals, manuL, manuW, manuH, dims]);

  const [autoTexture, setAutoTexture] = React.useState(null);
  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/auto.svg", (tex) => {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      setAutoTexture(tex);
    });
  }, []);

  const mats = useMemo(() => {
    const packageColorToUse = colorOverride || store.packageColor;
    const baseParams = {
      color: packageColorToUse,
      map: autoTexture,
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide
    };
    return {
      outside: new THREE.MeshStandardMaterial(baseParams),
      inside: new THREE.MeshStandardMaterial({ ...baseParams, color: store.insideColor }),
      flap: new THREE.MeshStandardMaterial(baseParams),
      windowFilm: new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        transmission: 0.9,
        opacity: 1,
        metalness: 0,
        roughness: 0,
        ior: 1.5,
        thickness: 0.01,
        transparent: true,
        side: THREE.DoubleSide
      })
    };
  }, [store.packageColor, store.insideColor, autoTexture, colorOverride]);

  const layout = overrideLayout || store.sceneLayout || "single";
  const sceneInstances = useMemo(() => buildSceneInstances(layout, L, W, H), [layout, L, W, H]);

  const D = (panel, clipMask) => (
    <MappedDecals panel={panel} decals={debouncedDecals} L={L} W={W} H={H} manuL={manuL} manuW={manuW} manuH={manuH} dims={dims} T={nT} isFlatGeometry={true} clipMask={clipMask} />
  );

  const renderBoxInstance = (key, pos, rot) => (
    <group key={key} position={pos} rotation={rot}>
      <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
        
        <mesh geometry={geoms.p1Geom} material={[mats.outside, mats.inside, mats.flap]} castShadow receiveShadow>
            {D("p1")}
        </mesh>
        {geoms.windowFilmGeomP1 && (
            <mesh geometry={geoms.windowFilmGeomP1} material={mats.windowFilm} />
        )}
        <group position={[0, H/2, 0]} rotation={[topLidRotX, 0, 0]}>
            <mesh geometry={geoms.coverGeom} material={[mats.flap, mats.inside, mats.flap]}>
                {D("p1_top_cover")}
            </mesh>
            {geoms.windowFilmCover && <mesh geometry={geoms.windowFilmCover} material={mats.windowFilm} />}
            <group position={[0, geoms.coverH, 0]} rotation={[topTuckRotX, 0, 0]} scale={[topTuckScaleX, 1, 1]}>
                <mesh geometry={geoms.lipGeom} material={[mats.flap, mats.inside, mats.flap]}>
                    {D("p1_top_lip")}
                </mesh>
                {geoms.windowFilmLip && <mesh geometry={geoms.windowFilmLip} material={mats.windowFilm} />}
            </group>
        </group>

        <group position={botLeftPos} rotation={[botAngleLeft, 0, 0]}>
            <mesh geometry={geoms.p1BotGeom} material={[mats.flap, mats.inside, mats.flap]}>
                {D("p1_bot_auto", { tex: autoTexture, w: L, h: botH, sx: 21.0, sy: 241.8, sw: 120.6, sh: 48.35, px: L/2, py: botH })}
            </mesh>
            {geoms.windowFilmP1Bot && <mesh geometry={geoms.windowFilmP1Bot} material={mats.windowFilm} />}
        </group>

        <group position={[gluePosX, 0, 0]} rotation={[0, glueRotY, 0]}>
            <mesh geometry={geoms.glueGeom} material={[mats.flap, mats.inside, mats.flap]}>
                {D("p1_glue")}
            </mesh>
            {geoms.windowFilmGlue && <mesh geometry={geoms.windowFilmGlue} material={mats.windowFilm} />}
        </group>

        <group position={[L/2, 0, 0]} rotation={[0, p2RotY, 0]}>
            <mesh geometry={geoms.p2Geom} material={[mats.outside, mats.inside, mats.flap]} castShadow receiveShadow>
                {D("p2")}
            </mesh>
            {geoms.windowFilmGeomP2 && (
                <mesh geometry={geoms.windowFilmGeomP2} material={mats.windowFilm} />
            )}
            
            <group position={td2Pos} rotation={[tdRotX, 0, 0]}>
                <mesh geometry={geoms.p2DustGeom} position={[W/2, 0, 0]} material={[mats.flap, mats.inside, mats.flap]}>
                    {D("p2_top_dust")}
                </mesh>
                {geoms.windowFilmP2Dust && <mesh geometry={geoms.windowFilmP2Dust} position={[W/2, 0, 0]} material={mats.windowFilm} />}
            </group>

            <group position={botFrontPos} rotation={[botAngleFront, 0, 0]}>
                <mesh geometry={geoms.p2BotGeom} position={[W/2, 0, 0]} material={[mats.flap, mats.inside, mats.flap]}>
                    {D("p2_bot_auto", { tex: autoTexture, w: W, h: botH, sx: 141.6, sy: 241.8, sw: 60.6, sh: 48.35, px: W/2, py: botH })}
                </mesh>
                {geoms.windowFilmP2Bot && <mesh geometry={geoms.windowFilmP2Bot} position={[W/2, 0, 0]} material={mats.windowFilm} />}
            </group>

            <group position={[W, 0, 0]} rotation={[0, p3RotY, 0]}>
                <mesh geometry={geoms.p3Geom} position={[L/2, 0, 0]} material={[mats.outside, mats.inside, mats.flap]} castShadow receiveShadow>
                    {D("p3")}
                </mesh>
                {geoms.windowFilmGeomP3 && (
                    <mesh geometry={geoms.windowFilmGeomP3} position={[L/2, 0, 0]} material={mats.windowFilm} />
                )}
                
                <group position={botRightPos} rotation={[botAngleRight, 0, 0]}>
                    <mesh geometry={geoms.p3BotGeom} position={[L/2, 0, 0]} material={[mats.flap, mats.inside, mats.flap]}>
                        {D("p3_bot_auto", { tex: autoTexture, w: L, h: botH, sx: 202.2, sy: 241.8, sw: 120.6, sh: 48.35, px: L/2, py: botH })}
                    </mesh>
                    {geoms.windowFilmP3Bot && <mesh geometry={geoms.windowFilmP3Bot} position={[L/2, 0, 0]} material={mats.windowFilm} />}
                </group>

                <group position={[L, 0, 0]} rotation={[0, p4RotY, 0]}>
                    <mesh geometry={geoms.p4Geom} material={[mats.outside, mats.inside, mats.flap]} castShadow receiveShadow>
                        {D("p4")}
                    </mesh>
                    {geoms.windowFilmGeomP4 && (
                        <mesh geometry={geoms.windowFilmGeomP4} material={mats.windowFilm} />
                    )}
                    
                    <group position={td4Pos} rotation={[tdRotX, 0, 0]}>
                        <mesh geometry={geoms.p4DustGeom} position={[W/2, 0, 0]} material={[mats.flap, mats.inside, mats.flap]}>
                            {D("p4_top_dust")}
                        </mesh>
                        {geoms.windowFilmP4Dust && <mesh geometry={geoms.windowFilmP4Dust} position={[W/2, 0, 0]} material={mats.windowFilm} />}
                    </group>

                    <group position={botBackPos} rotation={[botAngleBack, 0, 0]}>
                        <mesh geometry={geoms.p4BotGeom} position={[W/2, 0, 0]} material={[mats.flap, mats.inside, mats.flap]}>
                            {D("p4_bot_auto", { tex: autoTexture, w: W, h: botH, sx: 322.8, sy: 241.8, sw: 60.6, sh: 48.35, px: W/2, py: botH })}
                        </mesh>
                        {geoms.windowFilmP4Bot && <mesh geometry={geoms.windowFilmP4Bot} position={[W/2, 0, 0]} material={mats.windowFilm} />}
                    </group>
                </group>
            </group>
        </group>
      </group>
    </group>
  );

  const boxCenterZ = 0; 
  const camPos     = [L * 1.5, H * 1.2, W * 2.5];
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
          enableZoom={!disableZoom}
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
