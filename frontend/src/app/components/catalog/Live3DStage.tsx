import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

export interface Live3DStageProps {
  categoryId: string;
  isUserHovering: boolean;
  onUserInteract?: () => void;
}

// Procedural studio environment map generator for photorealistic softbox reflections & specular sheens
function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();

  // Neutral studio backdrop sphere
  const envBgGeo = new THREE.SphereGeometry(15, 32, 16);
  const envBgCanvas = document.createElement('canvas');
  envBgCanvas.width = 512;
  envBgCanvas.height = 256;
  const envBgCtx = envBgCanvas.getContext('2d')!;
  const grad = envBgCtx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#f8fafc');   // Soft white-blue ceiling light
  grad.addColorStop(0.5, '#94a3b8'); // Neutral silver horizon
  grad.addColorStop(1, '#475569');   // Soft floor tone
  envBgCtx.fillStyle = grad;
  envBgCtx.fillRect(0, 0, 512, 256);

  const envBgTexture = new THREE.CanvasTexture(envBgCanvas);
  const envBgMat = new THREE.MeshBasicMaterial({ map: envBgTexture, side: THREE.BackSide });
  envScene.add(new THREE.Mesh(envBgGeo, envBgMat));

  // Key Studio Softbox (creates the crisp, sleek vertical highlight seen on high-end packaging)
  const keySoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 18),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  keySoftbox.position.set(5.0, 2.0, 4.0);
  keySoftbox.lookAt(0, 0, 0);
  envScene.add(keySoftbox);

  // Left Soft Fill Strip
  const leftSoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 16),
    new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide })
  );
  leftSoftbox.position.set(-5.5, 1.5, 3.5);
  leftSoftbox.lookAt(0, 0, 0);
  envScene.add(leftSoftbox);

  // Top Light for rim, lid and shoulder highlights
  const topSoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  topSoftbox.position.set(0, 9.0, 1.0);
  topSoftbox.lookAt(0, 0, 0);
  envScene.add(topSoftbox);

  const envMap = pmremGenerator.fromScene(envScene).texture;
  pmremGenerator.dispose();
  return envMap;
}

// Procedural seamless packaging artwork texture (Clean typography & graphics with NO ugly outer frames)
function createPackagingTexture(
  type: 'box_kraft' | 'box_white' | 'bottle_wine' | 'can_soda' | 'can_slim' | 'tube_cosmetic',
  hasDesign: boolean,
  printProgress: number = 1.0
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Base Unprinted Substrate Fill
  if (type === 'box_kraft') {
    // Warm natural corrugated kraft cardboard with organic fiber grain
    ctx.fillStyle = '#C69963';
    ctx.fillRect(0, 0, 1024, 1024);

    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, 'rgba(238, 202, 155, 0.22)');
    grad.addColorStop(1, 'rgba(155, 110, 58, 0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle cardboard fiber flecks
    ctx.fillStyle = 'rgba(90, 60, 25, 0.06)';
    for (let i = 0; i < 300; i++) {
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1.5 + Math.random() * 3, 2 + Math.random() * 5);
    }
  } else if (type === 'bottle_wine') {
    // Elegant warm ivory matte label paper
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, 1024, 1024);

    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(240, 235, 226, 0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
  } else if (type === 'can_soda' || type === 'can_slim') {
    // Pure clean wrap
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1024, 1024);
  } else {
    // Premium coated white paperboard
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1024, 1024);
  }

  // 2. Printed Design Layer (Clean, Modern Packaging Design without Clunky Frames)
  if (hasDesign && printProgress > 0) {
    ctx.save();

    // Smooth progressive print sweep
    if (printProgress < 1.0) {
      ctx.beginPath();
      ctx.rect(0, 0, 1024, 1024 * printProgress);
      ctx.clip();
    }

    if (type === 'box_kraft') {
      // Clean modern kraft typography with subtle dieline marks (NO border frames)
      ctx.fillStyle = '#1C1917';
      ctx.textAlign = 'center';

      // Subtle registration crosshairs in top corners
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2;
      // top-left cross
      ctx.beginPath(); ctx.moveTo(90, 80); ctx.lineTo(90, 100); ctx.moveTo(80, 90); ctx.lineTo(100, 90); ctx.stroke();
      // top-right cross
      ctx.beginPath(); ctx.moveTo(934, 80); ctx.lineTo(934, 100); ctx.moveTo(924, 90); ctx.lineTo(944, 90); ctx.stroke();

      ctx.font = '800 28px "Inter", "DM Sans", sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('KEYLINE CRAFT PACKAGING', 512, 220);

      ctx.font = '900 102px "Inter", "DM Sans", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('PAPER BOX', 512, 360);

      ctx.font = '300 74px "Inter", "DM Sans", sans-serif';
      ctx.fillText('MOCKUP', 512, 445);

      // Minimalist accent rule
      ctx.fillStyle = '#78350F';
      ctx.fillRect(432, 490, 160, 6);

      ctx.fillStyle = '#292524';
      ctx.font = '600 32px "Inter", sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText('100% RECYCLED CORRUGATED', 512, 570);

      ctx.font = '400 24px "Inter", sans-serif';
      ctx.fillStyle = '#57534E';
      ctx.fillText('FLUTE B • CRUSH TEST 200 LB/IN', 512, 620);

      // Authentic clean barcode
      ctx.fillStyle = '#1C1917';
      let bx = 320;
      const bH = 80;
      const bars = [4, 2, 7, 3, 10, 4, 3, 8, 4, 12, 3, 8, 4, 9, 6, 3, 11, 4, 7, 4, 12, 3, 6, 7, 4, 10];
      for (const b of bars) {
        ctx.fillRect(bx, 730, b, bH);
        bx += b + 6;
      }
      ctx.font = '500 20px monospace';
      ctx.fillText('0 72918 40192 4', 512, 845);

    } else if (type === 'bottle_wine') {
      // Luxury Estate Wine Label (NO white border or outer sticker frame)
      // Elegant Charcoal / Midnight Blue central field
      ctx.fillStyle = '#171E2B';
      ctx.fillRect(40, 40, 944, 944);

      // Fine gold hairline rule (delicate, not a thick box)
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(70, 70, 884, 884);

      ctx.fillStyle = '#D4AF37';
      ctx.textAlign = 'center';
      ctx.font = '600 28px "Inter", serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('✦  CHÂTEAU KEYLINE  ✦', 512, 230);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 84px "Cinzel", "Playfair Display", serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('RESERVE', 512, 380);

      ctx.fillStyle = '#D4AF37';
      ctx.font = '400 38px "Cinzel", serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('ESTATE CABERNET', 512, 465);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '400 28px "Inter", sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('NAPA VALLEY • VINTAGE 2024', 512, 590);
      ctx.fillText('750 ML • 14.5% ALC. BY VOL.', 512, 650);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 22px "Inter", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('ESTATE BOTTLED & PRODUCED', 512, 780);

    } else if (type === 'can_soda') {
      // Vibrant contemporary gradient beverage can wrap
      const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
      grad.addColorStop(0, '#0284C7'); // Cyan
      grad.addColorStop(0.5, '#0F766E'); // Deep Teal
      grad.addColorStop(1, '#059669'); // Emerald
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Soft light curved ripples
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 14;
      for (let y = 140; y < 900; y += 180) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(300, y - 50, 700, y + 50, 1024, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = '900 115px "Inter", "DM Sans", sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('KLD', 512, 360);

      ctx.font = '800 46px "Inter", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('SPARKLING TONIC', 512, 450);

      ctx.font = '500 30px "Inter", sans-serif';
      ctx.fillStyle = '#FEF08A';
      ctx.fillText('YUZU BOTANICALS • ZERO SUGAR', 512, 530);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 26px "Inter", sans-serif';
      ctx.fillText('355 ML (12 FL. OZ)', 512, 700);

    } else if (type === 'tube_cosmetic') {
      // Clean modern Scandinavian skincare
      ctx.fillStyle = '#18181B';
      ctx.textAlign = 'center';
      ctx.font = '900 32px "Inter", sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('KEYLINE LABS', 512, 300);

      ctx.font = '300 72px "Inter", sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('PEPTIDE', 512, 420);
      ctx.font = '800 72px "Inter", sans-serif';
      ctx.fillText('REPAIR GEL', 512, 500);

      ctx.fillStyle = '#52525B';
      ctx.font = '500 26px "Inter", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('CERAMIDES + NIACINAMIDE 5%', 512, 630);
      ctx.fillText('75 ML / 2.5 FL. OZ', 512, 780);

    } else {
      // Clean minimal white box
      ctx.fillStyle = '#18181B';
      ctx.textAlign = 'center';
      ctx.font = '800 30px "Inter", sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('STUDIO EDITION', 512, 280);

      ctx.font = '900 86px "Inter", sans-serif';
      ctx.fillText('KEYLINE', 512, 420);
      ctx.font = '400 52px "Inter", sans-serif';
      ctx.fillStyle = '#71717A';
      ctx.fillText('CUSTOM PACKAGING', 512, 500);
    }

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export const Live3DStage: React.FC<Live3DStageProps> = ({
  categoryId,
  isUserHovering,
  onUserInteract,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active design toggles
  const [activeDesigns, setActiveDesigns] = useState<Record<string, boolean>>({
    itemA: false,
    itemB: false,
  });
  const [cursorScreenPos, setCursorScreenPos] = useState<{ x: number; y: number }>({ x: 260, y: 180 });
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const threeRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    models: {
      itemA?: THREE.Object3D;
      itemB?: THREE.Object3D;
      itemC?: THREE.Object3D;
    };
    materials: {
      itemA?: THREE.MeshStandardMaterial;
      itemB?: THREE.MeshStandardMaterial;
    };
    designState: {
      itemA: boolean;
      itemB: boolean;
      progressA: number;
      progressB: number;
    };
    animFrameId: number;
    clock: THREE.Clock;
  } | null>(null);

  useEffect(() => {
    if (!threeRefs.current) return;
    const { designState } = threeRefs.current;
    designState.itemA = !!activeDesigns.itemA;
    designState.itemB = !!activeDesigns.itemB;
  }, [activeDesigns]);

  // Master Scene Initialization with High-End Lathe Geometries & PMREM Studio Lighting
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0.2, 1.4, 5.0);
    camera.lookAt(0, 0.1, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // PMREM Studio Softbox Lighting for Realistic Specular Highlights & Metals
    const envMap = createStudioEnvironment(renderer);
    scene.environment = envMap;

    // Direct Key & Rim Lights
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(3.8, 5.5, 4.0);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.55);
    fillLight.position.set(-4.5, 2.5, 3.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
    rimLight.position.set(0, 4.0, -4.5);
    scene.add(rimLight);

    // Realistic Contact Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(6.5, 4.0);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(256, 256, 30, 256, 256, 230);
    sGrad.addColorStop(0, 'rgba(15, 23, 42, 0.32)');
    sGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.12)');
    sGrad.addColorStop(0.75, 'rgba(15, 23, 42, 0.02)');
    sGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(shadowCanvas),
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.0;
    scene.add(shadowMesh);

    const models: { itemA?: THREE.Object3D; itemB?: THREE.Object3D; itemC?: THREE.Object3D } = {};
    const materials: { itemA?: THREE.MeshStandardMaterial; itemB?: THREE.MeshStandardMaterial } = {};

    const isBox = categoryId === 'box-mockups' || categoryId === 'box' || !categoryId;
    const isBottle = categoryId === 'bottle-mockups' || categoryId === 'bottle' || categoryId.includes('bottle');
    const isCan = categoryId === 'can-mockups' || categoryId === 'can';

    if (isBox) {
      // ───────────────────────────────────────────────────────────────────────
      // BOXES: 1. Kraft Carton (Center)  2. Open Mailer Box (Front-Left)  3. Tuck Carton (Right)
      // ───────────────────────────────────────────────────────────────────────

      // 1. Center Kraft Corrugated Carton (Realistic Beveled & Textured)
      const boxGeo = new THREE.BoxGeometry(1.65, 1.85, 1.25);
      const texA = createPackagingTexture('box_kraft', false);
      const matA = new THREE.MeshStandardMaterial({
        map: texA,
        roughness: 0.88,
        metalness: 0.04,
      });
      materials.itemA = matA;

      const mainBox = new THREE.Mesh(boxGeo, matA);
      mainBox.position.set(0.2, 0.02, 0.2);
      mainBox.rotation.set(0.18, -0.42, 0.05);
      mainBox.castShadow = true;
      scene.add(mainBox);
      models.itemA = mainBox;

      // 2. Front-Left Realistic OPEN MAILER / PIZZA BOX
      const mailerGroup = new THREE.Group();
      // Base Tray
      const trayGeo = new THREE.BoxGeometry(1.5, 0.38, 1.35);
      const trayMat = new THREE.MeshStandardMaterial({
        color: 0xE8DFD5,
        roughness: 0.65,
        metalness: 0.05,
      });
      const trayMesh = new THREE.Mesh(trayGeo, trayMat);
      trayMesh.position.y = -0.19;
      mailerGroup.add(trayMesh);

      // Open Hinged Lid (angled upwards at 45 degrees revealing interior)
      const lidGeo = new THREE.BoxGeometry(1.52, 0.06, 1.38);
      const texB = createPackagingTexture('box_white', false);
      const matB = new THREE.MeshStandardMaterial({
        map: texB,
        roughness: 0.55,
        metalness: 0.08,
      });
      materials.itemB = matB;
      const lidMesh = new THREE.Mesh(lidGeo, matB);
      // Pivot at the back edge of the tray
      lidMesh.position.set(0, 0.45, -0.45);
      lidMesh.rotation.x = -Math.PI / 3.4; // Tilted open!
      mailerGroup.add(lidMesh);

      mailerGroup.position.set(-1.25, -0.7, 0.85);
      mailerGroup.rotation.set(0.12, 0.45, -0.05);
      scene.add(mailerGroup);
      models.itemB = mailerGroup;

      // 3. Right White Tuck Carton (Sleek Coated Paperboard Sheen)
      const tuckGeo = new THREE.BoxGeometry(0.95, 1.65, 0.85);
      const tuckMat = new THREE.MeshStandardMaterial({
        color: 0xFAF9F6,
        roughness: 0.38,
        metalness: 0.08,
      });
      const tuckMesh = new THREE.Mesh(tuckGeo, tuckMat);
      tuckMesh.position.set(1.6, -0.12, -0.35);
      tuckMesh.rotation.set(0.12, -0.22, 0);
      scene.add(tuckMesh);
      models.itemC = tuckMesh;

    } else if (isBottle) {
      // ───────────────────────────────────────────────────────────────────────
      // BOTTLES: 1. Tall Wine Bottle (Center)  2. Amber Dropper Bottle (Left)  3. Cosmetic Jar (Right)
      // ───────────────────────────────────────────────────────────────────────

      // 1. Center Tall Wine Bottle with Smooth Curvature Lathe Profile
      const wineGroup = new THREE.Group();

      const winePoints: THREE.Vector2[] = [];
      winePoints.push(new THREE.Vector2(0, -1.0));
      winePoints.push(new THREE.Vector2(0.66, -1.0));
      winePoints.push(new THREE.Vector2(0.68, -0.92));
      winePoints.push(new THREE.Vector2(0.68, 0.45)); // Body
      winePoints.push(new THREE.Vector2(0.65, 0.65)); // Shoulder
      winePoints.push(new THREE.Vector2(0.50, 0.95));
      winePoints.push(new THREE.Vector2(0.24, 1.25)); // Neck start
      winePoints.push(new THREE.Vector2(0.21, 1.65));
      winePoints.push(new THREE.Vector2(0.24, 1.70)); // Lip collar
      winePoints.push(new THREE.Vector2(0.23, 1.76));
      winePoints.push(new THREE.Vector2(0.16, 1.76));

      const wineGeo = new THREE.LatheGeometry(winePoints, 48);
      const wineMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x132219),
        roughness: 0.06,
        metalness: 0.12,
        transmission: 0.68,
        transparent: true,
        thickness: 0.6,
        ior: 1.52,
      });
      const wineMesh = new THREE.Mesh(wineGeo, wineMat);
      wineGroup.add(wineMesh);

      // Gold Foil Capsule Neck Wrap
      const foilGeo = new THREE.CylinderGeometry(0.225, 0.235, 0.55, 36);
      const foilMat = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        metalness: 0.88,
        roughness: 0.22,
      });
      const foilMesh = new THREE.Mesh(foilGeo, foilMat);
      foilMesh.position.y = 1.45;
      wineGroup.add(foilMesh);

      // Seamless Cylindrical Front Label
      const labelGeo = new THREE.CylinderGeometry(0.686, 0.686, 1.05, 48, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
      const texA = createPackagingTexture('bottle_wine', false);
      const matA = new THREE.MeshStandardMaterial({
        map: texA,
        roughness: 0.65,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      materials.itemA = matA;
      const labelMesh = new THREE.Mesh(labelGeo, matA);
      labelMesh.position.y = -0.2;
      wineGroup.add(labelMesh);

      wineGroup.position.set(0.35, -0.05, 0.2);
      wineGroup.rotation.set(0.06, -0.25, 0);
      scene.add(wineGroup);
      models.itemA = wineGroup;

      // 2. Left Amber Cosmetic Dropper Bottle
      const dropGroup = new THREE.Group();
      const dropPoints: THREE.Vector2[] = [];
      dropPoints.push(new THREE.Vector2(0, -0.6));
      dropPoints.push(new THREE.Vector2(0.42, -0.6));
      dropPoints.push(new THREE.Vector2(0.44, -0.54));
      dropPoints.push(new THREE.Vector2(0.44, 0.3));
      dropPoints.push(new THREE.Vector2(0.38, 0.45));
      dropPoints.push(new THREE.Vector2(0.20, 0.55));
      dropPoints.push(new THREE.Vector2(0.20, 0.7));

      const dropGeo = new THREE.LatheGeometry(dropPoints, 36);
      const dropMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x733816), // Rich amber glass
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.65,
        transparent: true,
        thickness: 0.4,
      });
      const dropMesh = new THREE.Mesh(dropGeo, dropMat);
      dropGroup.add(dropMesh);

      // Dropper Cap & Pipette Bulb
      const capGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.35, 32);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 0.85;
      dropGroup.add(capMesh);

      const bulbGeo = new THREE.SphereGeometry(0.18, 24, 16);
      bulbGeo.scale(1, 1.4, 1);
      const bulbMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6 });
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      bulbMesh.position.y = 1.15;
      dropGroup.add(bulbMesh);

      // Dropper Bottle Label
      const dLabelGeo = new THREE.CylinderGeometry(0.446, 0.446, 0.65, 36, 1, true, -Math.PI * 0.4, Math.PI * 0.8);
      const texB = createPackagingTexture('box_white', false);
      const matB = new THREE.MeshStandardMaterial({ map: texB, roughness: 0.6, side: THREE.DoubleSide });
      materials.itemB = matB;
      const dLabelMesh = new THREE.Mesh(dLabelGeo, matB);
      dLabelMesh.position.y = -0.15;
      dropGroup.add(dLabelMesh);

      dropGroup.position.set(-1.25, -0.38, 0.7);
      dropGroup.rotation.set(0.15, 0.42, -0.06);
      scene.add(dropGroup);
      models.itemB = dropGroup;

      // 3. Right White Cosmetic Cream Jar
      const jarGroup = new THREE.Group();
      const jarBodyGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.75, 36);
      const jarBodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
      jarGroup.add(new THREE.Mesh(jarBodyGeo, jarBodyMat));

      const jarLidGeo = new THREE.CylinderGeometry(0.60, 0.60, 0.22, 36);
      const jarLidMat = new THREE.MeshStandardMaterial({ color: 0xd4d8dc, metalness: 0.85, roughness: 0.2 });
      const jarLid = new THREE.Mesh(jarLidGeo, jarLidMat);
      jarLid.position.y = 0.45;
      jarGroup.add(jarLid);

      jarGroup.position.set(1.58, -0.45, -0.35);
      jarGroup.rotation.set(0.1, -0.2, 0);
      scene.add(jarGroup);
      models.itemC = jarGroup;

    } else if (isCan) {
      // ───────────────────────────────────────────────────────────────────────
      // CANS: 1. 12oz Aluminum Can (Center)  2. Tin Food Can (Left)  3. Slim Can (Right)
      // ───────────────────────────────────────────────────────────────────────

      // 1. Center Realistic 12oz Aluminum Beverage Can with Countersunk Rim & Pull Tab
      const canGroup = new THREE.Group();

      const canPoints: THREE.Vector2[] = [];
      canPoints.push(new THREE.Vector2(0, -0.9));
      canPoints.push(new THREE.Vector2(0.52, -0.88));
      canPoints.push(new THREE.Vector2(0.62, -0.80)); // Bottom dome
      canPoints.push(new THREE.Vector2(0.70, -0.65));
      canPoints.push(new THREE.Vector2(0.70, 0.65));  // Straight body
      canPoints.push(new THREE.Vector2(0.68, 0.76));  // Shoulder taper
      canPoints.push(new THREE.Vector2(0.60, 0.86));
      canPoints.push(new THREE.Vector2(0.61, 0.92));  // Rolled rim
      canPoints.push(new THREE.Vector2(0.57, 0.92));
      canPoints.push(new THREE.Vector2(0.55, 0.87));  // Countersunk lid
      canPoints.push(new THREE.Vector2(0, 0.87));

      const canGeo = new THREE.LatheGeometry(canPoints, 48);
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0xE2E8F0,
        metalness: 0.94,
        roughness: 0.18,
      });
      const canBodyMesh = new THREE.Mesh(canGeo, metalMat);
      canGroup.add(canBodyMesh);

      // Aluminum Pull-Tab on top
      const tabGeo = new THREE.BoxGeometry(0.14, 0.02, 0.32);
      const tabMesh = new THREE.Mesh(tabGeo, metalMat);
      tabMesh.position.set(0, 0.88, 0.08);
      tabMesh.rotation.y = 0.3;
      canGroup.add(tabMesh);

      // Cylindrical Body Printed Graphic Wrap
      const wrapGeo = new THREE.CylinderGeometry(0.705, 0.705, 1.25, 48, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
      const texA = createPackagingTexture('can_soda', false);
      const matA = new THREE.MeshStandardMaterial({
        map: texA,
        metalness: 0.82,
        roughness: 0.22,
        side: THREE.DoubleSide,
      });
      materials.itemA = matA;
      const wrapMesh = new THREE.Mesh(wrapGeo, matA);
      wrapMesh.position.y = 0.0;
      canGroup.add(wrapMesh);

      canGroup.position.set(0.3, -0.05, 0.2);
      canGroup.rotation.set(0.12, -0.28, 0);
      scene.add(canGroup);
      models.itemA = canGroup;

      // 2. Left Tin / Tuna Food Can with Stamped Metal Rings
      const tinGroup = new THREE.Group();
      const tinGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.65, 40);
      const tinMat = new THREE.MeshStandardMaterial({
        color: 0xD1D5DB,
        metalness: 0.88,
        roughness: 0.28,
      });
      tinGroup.add(new THREE.Mesh(tinGeo, tinMat));

      // Tin label wrap
      const tinLabelGeo = new THREE.CylinderGeometry(0.825, 0.825, 0.45, 40, 1, true, -Math.PI * 0.4, Math.PI * 0.8);
      const texB = createPackagingTexture('box_white', false);
      const matB = new THREE.MeshStandardMaterial({ map: texB, roughness: 0.5, side: THREE.DoubleSide });
      materials.itemB = matB;
      const tinLabel = new THREE.Mesh(tinLabelGeo, matB);
      tinGroup.add(tinLabel);

      tinGroup.position.set(-1.25, -0.65, 0.7);
      tinGroup.rotation.set(0.18, 0.35, 0);
      scene.add(tinGroup);
      models.itemB = tinGroup;

      // 3. Right Sleek Tall Slim Can
      const slimGeo = new THREE.CylinderGeometry(0.48, 0.48, 2.2, 40);
      const slimMesh = new THREE.Mesh(slimGeo, metalMat);
      slimMesh.position.set(1.5, 0.02, -0.35);
      slimMesh.rotation.set(0.1, -0.2, 0);
      scene.add(slimMesh);
      models.itemC = slimMesh;

    } else {
      // ───────────────────────────────────────────────────────────────────────
      // DEFAULT / TUBES: Squeeze Tube, Jar & Topical Tube
      // ───────────────────────────────────────────────────────────────────────
      const tubeGroup = new THREE.Group();
      const tubePoints: THREE.Vector2[] = [];
      tubePoints.push(new THREE.Vector2(0, -0.8));
      tubePoints.push(new THREE.Vector2(0.42, -0.8)); // Base cap rim
      tubePoints.push(new THREE.Vector2(0.45, -0.65));
      tubePoints.push(new THREE.Vector2(0.52, 0.4));  // Body
      tubePoints.push(new THREE.Vector2(0.50, 0.9));
      tubePoints.push(new THREE.Vector2(0.08, 1.05)); // Crimped flat top
      tubePoints.push(new THREE.Vector2(0, 1.05));

      const tubeGeo = new THREE.LatheGeometry(tubePoints, 36);
      const texA = createPackagingTexture('tube_cosmetic', false);
      const matA = new THREE.MeshStandardMaterial({ map: texA, roughness: 0.38, metalness: 0.08 });
      materials.itemA = matA;
      const tubeMesh = new THREE.Mesh(tubeGeo, matA);
      tubeGroup.add(tubeMesh);

      const capGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 32);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = -0.95;
      tubeGroup.add(cap);

      tubeGroup.position.set(0.25, 0.1, 0.2);
      tubeGroup.rotation.set(0.12, -0.28, 0.04);
      scene.add(tubeGroup);
      models.itemA = tubeGroup;

      const jarGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.8, 36);
      const texB = createPackagingTexture('box_white', false);
      const matB = new THREE.MeshStandardMaterial({ map: texB, roughness: 0.35 });
      materials.itemB = matB;
      const jar = new THREE.Mesh(jarGeo, matB);
      jar.position.set(-1.25, -0.55, 0.8);
      jar.rotation.set(0.18, 0.35, 0);
      scene.add(jar);
      models.itemB = jar;
    }

    const designState = {
      itemA: false,
      itemB: false,
      progressA: 0.0,
      progressB: 0.0,
    };

    const clock = new THREE.Clock();

    // 60FPS Render Loop with Organic Idle Float & Design Printing Transition
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Gentle organic breathing float
      if (models.itemA) {
        models.itemA.position.y += Math.sin(elapsedTime * 1.8) * 0.0006;
        models.itemA.rotation.y += 0.0016;
      }
      if (models.itemB) {
        models.itemB.position.y += Math.cos(elapsedTime * 1.5) * 0.0005;
      }

      // Smooth Print Texture Progress
      if (designState.itemA && designState.progressA < 1.0) {
        designState.progressA = Math.min(1.0, designState.progressA + 0.07);
        if (materials.itemA) {
          const texType = isBox ? 'box_kraft' : isBottle ? 'bottle_wine' : isCan ? 'can_soda' : 'tube_cosmetic';
          materials.itemA.map = createPackagingTexture(texType, true, designState.progressA);
          materials.itemA.needsUpdate = true;
        }
      } else if (!designState.itemA && designState.progressA > 0.0) {
        designState.progressA = 0.0;
        if (materials.itemA) {
          const texType = isBox ? 'box_kraft' : isBottle ? 'bottle_wine' : isCan ? 'can_soda' : 'tube_cosmetic';
          materials.itemA.map = createPackagingTexture(texType, false);
          materials.itemA.needsUpdate = true;
        }
      }

      if (designState.itemB && designState.progressB < 1.0) {
        designState.progressB = Math.min(1.0, designState.progressB + 0.07);
        if (materials.itemB) {
          materials.itemB.map = createPackagingTexture('box_white', true, designState.progressB);
          materials.itemB.needsUpdate = true;
        }
      } else if (!designState.itemB && designState.progressB > 0.0) {
        designState.progressB = 0.0;
        if (materials.itemB) {
          materials.itemB.map = createPackagingTexture('box_white', false);
          materials.itemB.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
      threeRefs.current!.animFrameId = requestAnimationFrame(animate);
    };

    threeRefs.current = {
      scene,
      camera,
      renderer,
      models,
      materials,
      designState,
      animFrameId: requestAnimationFrame(animate),
      clock,
    };

    const handleResize = () => {
      if (!container || !threeRefs.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      threeRefs.current.camera.aspect = w / h;
      threeRefs.current.camera.updateProjectionMatrix();
      threeRefs.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeRefs.current) {
        cancelAnimationFrame(threeRefs.current.animFrameId);
        threeRefs.current.renderer.dispose();
      }
    };
  }, [categoryId]);

  // Project 3D Model Positions to Exact Screen Coordinates
  const getScreenCoordinates = useCallback((modelKey: 'itemA' | 'itemB') => {
    if (!threeRefs.current || !containerRef.current) return { x: 260, y: 150 };
    const { camera, models } = threeRefs.current;
    const model = models[modelKey];
    if (!model) return { x: 260, y: 150 };

    const pos = new THREE.Vector3();
    model.getWorldPosition(pos);
    pos.y += 0.05;
    pos.project(camera);

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    return {
      x: Math.round((pos.x * 0.5 + 0.5) * w),
      y: Math.round((-(pos.y) * 0.5 + 0.5) * h),
    };
  }, []);

  // 10s Choreographed Autonomous Live Demo Loop
  useEffect(() => {
    if (isUserHovering) {
      setCursorVisible(false);
      return;
    }
    setCursorVisible(true);

    let timeouts: NodeJS.Timeout[] = [];
    let isCancelled = false;

    const runStep = (step: number) => {
      if (isCancelled) return;

      if (step === 0) {
        setActiveDesigns({ itemA: false, itemB: false });
        setIsPressing(false);
        setCursorScreenPos({ x: 340, y: 220 });
        timeouts.push(setTimeout(() => runStep(1), 600));

      } else if (step === 1) {
        const targetA = getScreenCoordinates('itemA');
        setCursorScreenPos(targetA);
        timeouts.push(setTimeout(() => runStep(2), 1400));

      } else if (step === 2) {
        const targetA = getScreenCoordinates('itemA');
        setIsPressing(true);
        setClickRipple({ x: targetA.x, y: targetA.y, id: Date.now() });
        setActiveDesigns(prev => ({ ...prev, itemA: true }));

        // Elastic micro-bounce on 3D mesh
        if (threeRefs.current?.models.itemA) {
          const mesh = threeRefs.current.models.itemA;
          mesh.scale.set(1.06, 0.95, 1.06);
          setTimeout(() => mesh.scale.set(1.0, 1.0, 1.0), 220);
        }

        timeouts.push(setTimeout(() => {
          setIsPressing(false);
          runStep(3);
        }, 1200));

      } else if (step === 3) {
        const targetB = getScreenCoordinates('itemB');
        setCursorScreenPos(targetB);
        timeouts.push(setTimeout(() => runStep(4), 1400));

      } else if (step === 4) {
        const targetB = getScreenCoordinates('itemB');
        setIsPressing(true);
        setClickRipple({ x: targetB.x, y: targetB.y, id: Date.now() });
        setActiveDesigns(prev => ({ ...prev, itemB: true }));

        if (threeRefs.current?.models.itemB) {
          const mesh = threeRefs.current.models.itemB;
          mesh.scale.set(1.06, 0.94, 1.06);
          setTimeout(() => mesh.scale.set(1.0, 1.0, 1.0), 220);
        }

        timeouts.push(setTimeout(() => {
          setIsPressing(false);
          runStep(5);
        }, 1200));

      } else if (step === 5) {
        setCursorScreenPos({ x: 320, y: 210 });
        timeouts.push(setTimeout(() => runStep(0), 4000));
      }
    };

    runStep(0);

    return () => {
      isCancelled = true;
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [categoryId, isUserHovering, getScreenCoordinates]);

  const handleStageClick = () => {
    onUserInteract?.();
    setActiveDesigns(prev => {
      const nextA = !prev.itemA;
      return { itemA: nextA, itemB: nextA };
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleStageClick}
      className="relative w-full h-[290px] flex items-center justify-center select-none cursor-pointer overflow-hidden rounded-2xl"
      title="Click anywhere to toggle live designs"
    >
      {/* Real Three.js WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Autonomous Virtual Cursor with Dynamic Bezier Glide */}
      {cursorVisible && (
        <div
          className={`absolute pointer-events-none z-30 transition-all duration-700 ease-out ${isPressing ? 'scale-90' : 'scale-100'}`}
          style={{
            transform: `translate3d(${cursorScreenPos.x}px, ${cursorScreenPos.y}px, 0)`,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="relative">
            <svg
              className={`w-7 h-7 drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] transition-transform duration-150 ${isPressing ? 'scale-90 rotate-[-8deg]' : 'rotate-[-5deg]'}`}
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="#18181B"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -inset-1 rounded-full bg-indigo-500/20 blur-sm pointer-events-none" />
          </div>
        </div>
      )}

      {/* Tactile Click Pulse Ripple */}
      {clickRipple && (
        <div
          key={clickRipple.id}
          className="absolute pointer-events-none z-20 rounded-full border-2 border-indigo-500 bg-indigo-500/20 animate-ping"
          style={{
            left: clickRipple.x - 24,
            top: clickRipple.y - 24,
            width: 48,
            height: 48,
            animationDuration: '650ms',
            animationIterationCount: 1,
          }}
        />
      )}
    </div>
  );
};

export default Live3DStage;
