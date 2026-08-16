import React, { useMemo } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from 'three';
import SceneAnimator from './SceneAnimator';
import { useBoxStore } from '../../lib/useBoxStore';
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
} from './sharedUtils';

export default function CakeBox3DViewer({ L, W, H, progress = 1, zoom = 1, lightingPreset = "studio", decals = [], overrideLayout = null, activeAnimation = "none" }) {
  const store = useBoxStore();
  
  // Use props if provided, otherwise fallback to store
  const w = W || parseFloat(store.W) || 120;
  const l = L || parseFloat(store.L) || 110;
  const h = H || parseFloat(store.H) || 220;
  const T = store.T || 0.0197;
  const nT = Math.max(0.015, Number(T));
  const manuL = l, manuW = w, manuH = h;
  const dims = { L: l, W: w, H: h, x1: 0, x2: l, x3: l + w, x4: 2 * l + w, x5: 2 * l + 2 * w, yTop: 0, yBot: h };
  
  // Also get animationProgress from props if present, otherwise store
  const animationProgress = progress !== undefined ? progress : store.animationProgress;

  // Derived dimensions matching dieline
  const roofH = l * 0.7; 
  const handleH = 40;
  const bottomDeep = l * 0.8;
  const bottomMid = l * 0.4;
  
  // Window dimensions
  const winW = w * 0.7;
  const winH = Math.min(80, h * 0.6);
  const winYOffset = winH * 0.3; // How much it goes above fold line

  // The 3D geometries
  const debouncedDecals = useDebouncedDecals(decals, 150);
  const geometries = useMemo(() => {
    const extrude = { depth: nT, bevelEnabled: false };
    
    // Standard solid panels
    const makeRect = (rw, rh, pName) => {
      const s = new THREE.Shape();
      s.moveTo(-rw/2, 0);
      s.lineTo(rw/2, 0);
      s.lineTo(rw/2, rh);
      s.lineTo(-rw/2, rh);
      s.closePath();

      const holes = getPanelWindowHoles(pName, debouncedDecals, s, l, w, h, manuL, manuW, manuH, dims, nT);
      if (holes.length > 0) {
        s.holes.push(...holes);
      }

      const geom = new THREE.ExtrudeGeometry(s, extrude);
      assignMaterialGroups(geom, nT);
      const filmGeom = holes.length > 0 ? new THREE.ShapeGeometry(holes) : null;
      return { geom, filmGeom };
    };
    
    const p1 = makeRect(l, h, "p1");
    const p3 = makeRect(l, h, "p3");
    const p4 = makeRect(w, h, "p4");
    
    // Panel 2 has the window cutout
    const p2Path = new THREE.Shape();
    p2Path.moveTo(-w/2, 0);
    p2Path.lineTo(w/2, 0);
    p2Path.lineTo(w/2, h);
    p2Path.lineTo(-w/2, h);
    
    const winPath = new THREE.Path();
    const wx = -winW/2;
    const wy = h - winH + winYOffset; 
    const wr = 8;
    
    winPath.moveTo(wx + wr, wy);
    winPath.lineTo(wx + winW - wr, wy);
    winPath.quadraticCurveTo(wx + winW, wy, wx + winW, wy + wr);
    winPath.lineTo(wx + winW, wy + winH - wr);
    winPath.quadraticCurveTo(wx + winW, wy + winH, wx + winW - wr, wy + winH);
    winPath.lineTo(wx + wr, wy + winH);
    winPath.quadraticCurveTo(wx, wy + winH, wx, wy + winH - wr);
    winPath.lineTo(wx, wy + wr);
    winPath.quadraticCurveTo(wx, wy, wx + wr, wy);
    
    const p2Holes = getPanelWindowHoles("p2", debouncedDecals, p2Path, l, w, h, manuL, manuW, manuH, dims, nT);
    if (p2Holes.length > 0) {
      p2Path.holes.push(...p2Holes);
    }
    const p2FilmGeom = p2Holes.length > 0 ? new THREE.ShapeGeometry(p2Holes) : null;
    
    const p2 = new THREE.ExtrudeGeometry(p2Path, extrude);
    assignMaterialGroups(p2, nT);

    // Roof side gussets (on P1 and P3)
    function createRoofGussetShape() {
      const s = new THREE.Shape();
      s.moveTo(-l/2, 0);
      s.lineTo(l/2, 0);
      s.lineTo(0, roofH - 10);
      s.closePath();
      return s;
    }
    const roofGussetP1Shape = createRoofGussetShape();
    let windowFilmRoofP1 = null;
    const roofP1Holes = getPanelWindowHoles("p1_top_cover", debouncedDecals, roofGussetP1Shape, l, w, h, manuL, manuW, manuH, dims, nT);
    if (roofP1Holes.length > 0) { roofGussetP1Shape.holes.push(...roofP1Holes); windowFilmRoofP1 = new THREE.ShapeGeometry(roofP1Holes); }
    const roofGussetP1 = new THREE.ExtrudeGeometry(roofGussetP1Shape, extrude);
    assignMaterialGroups(roofGussetP1, nT);

    const roofGussetP3Shape = createRoofGussetShape();
    let windowFilmRoofP3 = null;
    const roofP3Holes = getPanelWindowHoles("p3_top_cover", debouncedDecals, roofGussetP3Shape, l, w, h, manuL, manuW, manuH, dims, nT);
    if (roofP3Holes.length > 0) { roofGussetP3Shape.holes.push(...roofP3Holes); windowFilmRoofP3 = new THREE.ShapeGeometry(roofP3Holes); }
    const roofGussetP3 = new THREE.ExtrudeGeometry(roofGussetP3Shape, extrude);
    assignMaterialGroups(roofGussetP3, nT);

    // Handle panels
    function createHandleShape() {
      const s = new THREE.Shape();
      const taper = 15;
      const cr = 5;
      s.moveTo(-w/2, 0);
      s.lineTo(w/2, 0);
      s.lineTo(w/2, roofH);
      s.lineTo(w/2 - taper, roofH + handleH - cr);
      s.quadraticCurveTo(w/2 - taper, roofH + handleH, w/2 - taper - cr, roofH + handleH);
      s.lineTo(-w/2 + taper + cr, roofH + handleH);
      s.quadraticCurveTo(-w/2 + taper, roofH + handleH, -w/2 + taper, roofH + handleH - cr);
      s.lineTo(-w/2, roofH);
      s.closePath();
      
      const slotW = w * 0.4;
      const slotH2 = 12;
      const slotY = roofH + handleH * 0.5 - slotH2/2;
      const slotPath = new THREE.Path();
      slotPath.moveTo(-slotW/2, slotY);
      slotPath.lineTo(slotW/2, slotY);
      slotPath.quadraticCurveTo(slotW/2 + slotH2/2, slotY + slotH2/2, slotW/2, slotY + slotH2);
      slotPath.lineTo(-slotW/2, slotY + slotH2);
      slotPath.quadraticCurveTo(-slotW/2 - slotH2/2, slotY + slotH2/2, -slotW/2, slotY);
      s.holes.push(slotPath);
      return s;
    }

    const handleP4Shape = createHandleShape();
    let windowFilmHandleP4 = null;
    const handleP4Holes = getPanelWindowHoles("p4_top_dust", debouncedDecals, handleP4Shape, l, w, h, manuL, manuW, manuH, dims, nT);
    if (handleP4Holes.length > 0) { handleP4Shape.holes.push(...handleP4Holes); windowFilmHandleP4 = new THREE.ShapeGeometry(handleP4Holes); }
    const handlePanelP4 = new THREE.ExtrudeGeometry(handleP4Shape, extrude);
    assignMaterialGroups(handlePanelP4, nT);

    const handleFrontShape = createHandleShape();
    if (winYOffset > 0) {
      const topWinPath = new THREE.Path();
      topWinPath.moveTo(wx + wr, 0);
      topWinPath.lineTo(wx + winW - wr, 0);
      topWinPath.lineTo(wx + winW, 0);
      topWinPath.lineTo(wx + winW, winYOffset - wr);
      topWinPath.quadraticCurveTo(wx + winW, winYOffset, wx + winW - wr, winYOffset);
      topWinPath.lineTo(wx + wr, winYOffset);
      topWinPath.quadraticCurveTo(wx, winYOffset, wx, winYOffset - wr);
      topWinPath.lineTo(wx, 0);
      handleFrontShape.holes.push(topWinPath);
    }
    let windowFilmHandleFront = null;
    const handleFrontHoles = getPanelWindowHoles("p2_top_dust", debouncedDecals, handleFrontShape, l, w, h, manuL, manuW, manuH, dims, nT);
    if (handleFrontHoles.length > 0) { handleFrontShape.holes.push(...handleFrontHoles); windowFilmHandleFront = new THREE.ShapeGeometry(handleFrontHoles); }
    const handleFrontPanel = new THREE.ExtrudeGeometry(handleFrontShape, extrude);
    assignMaterialGroups(handleFrontPanel, nT);

    const deepD = w * 0.6;
    function createBMainShape() {
      const s = new THREE.Shape();
      const r = 5;
      s.moveTo(-l/2, 0);
      s.lineTo(-l/2 + 10, -deepD);
      s.lineTo(-10, -deepD);
      s.quadraticCurveTo(-10 + r, -deepD, 0, -bottomMid - r);
      s.lineTo(0, -bottomMid);
      s.lineTo(20, -bottomMid);
      s.quadraticCurveTo(20 + r, -bottomMid, 20 + 2*r, -bottomMid - 2*r);
      s.lineTo(l/2 - 10, -deepD);
      s.lineTo(l/2, 0);
      s.closePath();
      return s;
    }

    const bMainP1Shape = createBMainShape();
    let windowFilmBMainP1 = null;
    const bMainP1Holes = getPanelWindowHoles("p1_bot_auto", debouncedDecals, bMainP1Shape, l, w, h, manuL, manuW, manuH, dims, nT);
    if (bMainP1Holes.length > 0) { bMainP1Shape.holes.push(...bMainP1Holes); windowFilmBMainP1 = new THREE.ShapeGeometry(bMainP1Holes); }
    const bMainP1 = new THREE.ExtrudeGeometry(bMainP1Shape, extrude);
    assignMaterialGroups(bMainP1, nT);

    const bMainP3Shape = createBMainShape();
    let windowFilmBMainP3 = null;
    const bMainP3Holes = getPanelWindowHoles("p3_bot_auto", debouncedDecals, bMainP3Shape, l, w, h, manuL, manuW, manuH, dims, nT);
    if (bMainP3Holes.length > 0) { bMainP3Shape.holes.push(...bMainP3Holes); windowFilmBMainP3 = new THREE.ShapeGeometry(bMainP3Holes); }
    const bMainP3 = new THREE.ExtrudeGeometry(bMainP3Shape, extrude);
    assignMaterialGroups(bMainP3, nT);

    function createBGussetShape() {
      const s = new THREE.Shape();
      s.moveTo(-w/2, 0);
      s.lineTo(-w/2 + 15, -bottomMid);
      s.lineTo(w/2 - w*0.5, -bottomMid);
      s.lineTo(w/2, 0);
      s.closePath();
      return s;
    }

    const bGussetP2Shape = createBGussetShape();
    let windowFilmBGussetP2 = null;
    const bGussetP2Holes = getPanelWindowHoles("p2_bot_auto", debouncedDecals, bGussetP2Shape, l, w, h, manuL, manuW, manuH, dims, nT);
    if (bGussetP2Holes.length > 0) { bGussetP2Shape.holes.push(...bGussetP2Holes); windowFilmBGussetP2 = new THREE.ShapeGeometry(bGussetP2Holes); }
    const bGussetP2 = new THREE.ExtrudeGeometry(bGussetP2Shape, extrude);
    assignMaterialGroups(bGussetP2, nT);

    const bGussetP4Shape = createBGussetShape();
    let windowFilmBGussetP4 = null;
    const bGussetP4Holes = getPanelWindowHoles("p4_bot_auto", debouncedDecals, bGussetP4Shape, l, w, h, manuL, manuW, manuH, dims, nT);
    if (bGussetP4Holes.length > 0) { bGussetP4Shape.holes.push(...bGussetP4Holes); windowFilmBGussetP4 = new THREE.ShapeGeometry(bGussetP4Holes); }
    const bGussetP4 = new THREE.ExtrudeGeometry(bGussetP4Shape, extrude);
    assignMaterialGroups(bGussetP4, nT);

    const glueGeomRes = makeRect(15, h, "p1_glue");
    const glue = glueGeomRes.geom;
    const windowFilmGlue = glueGeomRes.filmGeom;
    // translate glue so origin is on right edge
    glue.translate(-15/2, 0, 0);
    if (windowFilmGlue) windowFilmGlue.translate(-15/2, 0, 0);

    return { 
      p1, p2, p3, p4, 
      p2FilmGeom, 
      roofGussetP1, roofGussetP3, 
      handlePanelP4, handleFrontPanel, 
      bMainP1, bMainP3, 
      bGussetP2, bGussetP4, 
      glue,
      windowFilmRoofP1, windowFilmRoofP3,
      windowFilmHandleP4, windowFilmHandleFront,
      windowFilmBMainP1, windowFilmBMainP3,
      windowFilmBGussetP2, windowFilmBGussetP4,
      windowFilmGlue
    };
  }, [w, l, h, nT, debouncedDecals, manuL, manuW, manuH, dims]);

  const texture = useMemo(() => createProceduralTexture(store.materialCategory, store.packageColor), [store.materialCategory, store.packageColor]);
  const { outside, inside, edge, flap } = useMemo(() => buildMaterials(store.materialCategory, texture, store.insideColor, store.packageColor), [store.materialCategory, texture, store.insideColor, store.packageColor]);
  const panelMats = [outside, inside, edge];

  const windowFilmMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#ffffff", transmission: 0.9, opacity: 1, metalness: 0, roughness: 0, ior: 1.5, thickness: 0.01, transparent: true, side: THREE.DoubleSide
  }), []);

  // ANIMATION KINEMATICS
  const aBoxFold = Math.min(animationProgress * 2.5, 1);
  const p1Angle = aBoxFold * (Math.PI / 2);
  const p3Angle = aBoxFold * (Math.PI / 2);
  const p4Angle = aBoxFold * (Math.PI / 2);
  const glueAngle = aBoxFold * (Math.PI / 2);

  const aBottom = Math.max(0, Math.min((animationProgress - 0.4) * 3, 1));
  const bGussetAngle = aBottom * (Math.PI / 2);
  const bMainAngle = Math.max(0, aBottom - 0.2) * (Math.PI / 2);

  const aTop = Math.max(0, Math.min((animationProgress - 0.6) * 2.5, 1));
  const tiltTarget = Math.asin((l / 2) / roofH);
  const handleTilt = aTop * tiltTarget;
  const gussetTilt = aTop * (Math.PI / 2);

  const renderBox = () => (
    <SceneAnimator activeAnimation={activeAnimation}>
      <group position={[0, -h/2, l/2 - nT/2]}>
        
        {/* PANEL 2 */}
        <group position={[0, 0, -nT]}>
          <mesh geometry={geometries.p2} material={panelMats} castShadow receiveShadow />
          {geometries.p2FilmGeom && (
            <mesh geometry={geometries.p2FilmGeom} position={[0, 0, nT / 2]}>
              <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          )}
          <group position={[0, h, 0]} rotation={[-handleTilt, 0, 0]}>
            <mesh geometry={geometries.handleFrontPanel} material={flap} />
            {geometries.windowFilmHandleFront && <mesh geometry={geometries.windowFilmHandleFront} material={windowFilmMat} />}
          </group>
          <group position={[0, 0, 0]} rotation={[bGussetAngle, 0, 0]}>
            <mesh geometry={geometries.bGussetP2} material={flap} />
            {geometries.windowFilmBGussetP2 && <mesh geometry={geometries.windowFilmBGussetP2} material={windowFilmMat} />}
          </group>
        </group>

        {/* PANEL 1 */}
        <group position={[-w/2, 0, -nT]} rotation={[0, -p1Angle, 0]}>
          <mesh geometry={geometries.p1.geom} material={panelMats} position={[-l/2, 0, 0]} castShadow receiveShadow />
          {geometries.p1.filmGeom && (
            <mesh geometry={geometries.p1.filmGeom} position={[-l/2, 0, nT / 2]}>
              <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          )}
          
          <group position={[-l, 0, 0]} rotation={[0, -glueAngle, 0]}>
            <mesh geometry={geometries.glue} material={flap} />
            {geometries.windowFilmGlue && <mesh geometry={geometries.windowFilmGlue} material={windowFilmMat} />}
          </group>
          <group position={[-l/2, h, 0]} rotation={[gussetTilt, 0, 0]}>
            <mesh geometry={geometries.roofGussetP1} material={flap} />
            {geometries.windowFilmRoofP1 && <mesh geometry={geometries.windowFilmRoofP1} material={windowFilmMat} />}
          </group>
          <group position={[-l/2, 0, 0]} rotation={[-bMainAngle, 0, 0]}>
            <mesh geometry={geometries.bMainP1} material={flap} />
            {geometries.windowFilmBMainP1 && <mesh geometry={geometries.windowFilmBMainP1} material={windowFilmMat} />}
          </group>
        </group>

        {/* PANEL 3 */}
        <group position={[w/2, 0, -nT]} rotation={[0, p3Angle, 0]}>
          <mesh geometry={geometries.p3.geom} material={panelMats} position={[l/2, 0, 0]} castShadow receiveShadow />
          {geometries.p3.filmGeom && (
            <mesh geometry={geometries.p3.filmGeom} position={[l/2, 0, nT / 2]}>
              <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          )}

          <group position={[l, 0, 0]} rotation={[0, p4Angle, 0]}>
            <mesh geometry={geometries.p4.geom} material={panelMats} position={[w/2, 0, 0]} castShadow receiveShadow />
            {geometries.p4.filmGeom && (
              <mesh geometry={geometries.p4.filmGeom} position={[w/2, 0, nT / 2]}>
                <meshStandardMaterial transparent opacity={0.3} roughness={0.1} metalness={0.1} color="#ffffff" side={THREE.DoubleSide} />
              </mesh>
            )}
            <group position={[w/2, h, 0]} rotation={[handleTilt, 0, 0]}>
              <mesh geometry={geometries.handlePanelP4} material={flap} />
              {geometries.windowFilmHandleP4 && <mesh geometry={geometries.windowFilmHandleP4} material={windowFilmMat} />}
            </group>
            <group position={[w/2, 0, 0]} rotation={[bGussetAngle, 0, 0]}>
              <mesh geometry={geometries.bGussetP4} material={flap} />
              {geometries.windowFilmBGussetP4 && <mesh geometry={geometries.windowFilmBGussetP4} material={windowFilmMat} />}
            </group>
          </group>

          <group position={[l/2, h, 0]} rotation={[gussetTilt, 0, 0]}>
            <mesh geometry={geometries.roofGussetP3} material={flap} />
            {geometries.windowFilmRoofP3 && <mesh geometry={geometries.windowFilmRoofP3} material={windowFilmMat} />}
          </group>
          <group position={[l/2, 0, 0]} rotation={[-bMainAngle, 0, 0]}>
            <mesh geometry={geometries.bMainP3} material={flap} />
            {geometries.windowFilmBMainP3 && <mesh geometry={geometries.windowFilmBMainP3} material={windowFilmMat} />}
          </group>
        </group>
      </group>
    </SceneAnimator>
  );

  const sceneInstances = useMemo(() => buildSceneInstances(overrideLayout || store.sceneLayout || "single", L, W, H), [overrideLayout, store.sceneLayout, L, W, H]);

  return (
    <Canvas
      shadows
      camera={{ position: [250 / zoom, 250 / zoom, 350 / zoom], fov: 45, near: 0.1, far: 2000 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <LightingPreset preset={lightingPreset} />
      <Environment preset="city" intensity={0.5} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} autoRotate={activeAnimation === 'rotation'} autoRotateSpeed={2} />
      
      {sceneInstances.map(inst => (
        <group key={inst.key} position={inst.pos} rotation={inst.rot}>
          {renderBox()}
        </group>
      ))}

      <ContactShadows position={[0, -H/2 - 2, 0]} opacity={0.6} scale={500} blur={2.5} far={100} resolution={512} color="#000000" />
    </Canvas>
  );
}

