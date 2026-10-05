import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Photorealistic 3D Amber Glass Apothecary Dropper Bottle
 * - Lathe-turned optical amber glass bottle with realistic transmission & IOR (1.52)
 * - Inner visible glass pipette tube with fluid
 * - Matte black ribbed dropper collar and curved rubber squeeze bulb
 * - High-DPI apothecary botanical elixir label wrap
 * - Studio softbox reflections and smooth 60fps turntable spin
 */
export default function Bottle3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 280;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 50);
    camera.position.set(0, 0.12, 4.4);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(3, 4, 3.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.6);
    fillLight.position.set(-3, 1.5, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef3c7, 1.1);
    rimLight.position.set(0, 3, -3.5);
    scene.add(rimLight);

    // 4. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.2, 2.2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 105);
      grad.addColorStop(0, 'rgba(35, 18, 5, 0.48)');
      grad.addColorStop(0.35, 'rgba(35, 18, 5, 0.22)');
      grad.addColorStop(0.7, 'rgba(35, 18, 5, 0.05)');
      grad.addColorStop(1, 'rgba(35, 18, 5, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.0;
    scene.add(shadowMesh);

    // 5. Bottle Root Group
    const bottleGroup = new THREE.Group();
    bottleGroup.position.y = -0.05;
    scene.add(bottleGroup);

    // 6. Amber Glass Material (Rich Translucent Pharmaceutical Glass)
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x994812), // Deep caramel amber
      roughness: 0.05,
      metalness: 0.02,
      transmission: 0.88, // Authentic translucent glass look
      ior: 1.52,
      thickness: 0.12,
      clearcoat: 0.95,
      clearcoatRoughness: 0.03,
      attenuationDistance: 12,
      attenuationColor: new THREE.Color(0xf59e0b),
      transparent: true,
      opacity: 1.0,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    // Construct Smooth Amber Glass Lathe Profile
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0.001, -0.96));
    points.push(new THREE.Vector2(0.16, -0.91));
    points.push(new THREE.Vector2(0.38, -0.95)); // Standing rim
    points.push(new THREE.Vector2(0.46, -0.92));
    points.push(new THREE.Vector2(0.48, -0.84));
    // Main cylindrical body
    points.push(new THREE.Vector2(0.48, 0.28));
    // Shoulder curve
    points.push(new THREE.Vector2(0.47, 0.36));
    points.push(new THREE.Vector2(0.43, 0.44));
    points.push(new THREE.Vector2(0.35, 0.52));
    points.push(new THREE.Vector2(0.25, 0.58));
    points.push(new THREE.Vector2(0.20, 0.62));
    // Neck
    points.push(new THREE.Vector2(0.19, 0.76));
    // Thread rim
    points.push(new THREE.Vector2(0.205, 0.80));
    points.push(new THREE.Vector2(0.18, 0.84));

    const bottleGeo = new THREE.LatheGeometry(points, 64);
    const bottleMesh = new THREE.Mesh(bottleGeo, glassMaterial);
    bottleMesh.castShadow = true;
    bottleMesh.renderOrder = 1;
    bottleGroup.add(bottleMesh);

    // 7. Inner Pipette Tube (Visible through Amber Glass)
    const pipetteGeo = new THREE.CylinderGeometry(0.035, 0.032, 1.25, 24);
    const pipetteMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      ior: 1.48,
      roughness: 0.05,
      transparent: true,
      opacity: 0.75,
    });
    const pipetteMesh = new THREE.Mesh(pipetteGeo, pipetteMat);
    pipetteMesh.position.y = -0.15;
    bottleGroup.add(pipetteMesh);

    // Fluid inside pipette tip
    const fluidGeo = new THREE.CylinderGeometry(0.026, 0.024, 0.45, 16);
    const fluidMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.1,
      metalness: 0.0,
      transparent: true,
      opacity: 0.85,
    });
    const fluidMesh = new THREE.Mesh(fluidGeo, fluidMat);
    fluidMesh.position.y = -0.55;
    bottleGroup.add(fluidMesh);

    // 8. Apothecary Label Wrap
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 768;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      // Natural textured parchment/ivory background
      ctx.fillStyle = '#fcf8f2';
      ctx.fillRect(0, 0, 1024, 768);

      // Fine golden double border frame
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 3;
      ctx.strokeRect(180, 50, 664, 668);
      ctx.lineWidth = 1;
      ctx.strokeRect(188, 58, 648, 652);

      // Typography
      ctx.textAlign = 'center';

      // Header Eyebrow
      ctx.font = '700 17px "Inter", sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.letterSpacing = '4px';
      ctx.fillText('EST. 2024 • CRAFT BOTANICALS', 512, 130);

      // Brand Title
      ctx.font = '900 68px "Inter", serif';
      ctx.fillStyle = '#1c1917';
      ctx.letterSpacing = '4px';
      ctx.fillText('KLD LABS', 512, 235);

      // Gold Divider with Diamond
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(360, 265, 304, 2);
      ctx.beginPath();
      ctx.arc(512, 266, 6, 0, Math.PI * 2);
      ctx.fill();

      // Product Name
      ctx.font = '800 38px "Inter", sans-serif';
      ctx.fillStyle = '#451a03';
      ctx.letterSpacing = '3px';
      ctx.fillText('RADIANCE ELIXIR', 512, 350);

      // Subtitle
      ctx.font = '600 20px "Inter", sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.letterSpacing = '2px';
      ctx.fillText('COLD-PRESSED EXTRACT COMPLEX', 512, 400);

      // Botanical Specs
      ctx.font = '500 18px "Inter", sans-serif';
      ctx.fillStyle = '#57534e';
      ctx.fillText('Bakuchiol 2% • Rosehip Seed • Squalane', 512, 470);
      ctx.fillText('Pure Active Concentrate • 100% Organic', 512, 505);

      // Volume & Dosage
      ctx.font = 'bold 24px "Inter", monospace';
      ctx.fillStyle = '#1c1917';
      ctx.fillText('30 ML ℮ 1.0 FL. OZ.', 512, 605);

      ctx.font = '600 15px "Inter", sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.fillText('APOTHECARY GRADE PACKAGING', 512, 645);
    }

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.colorSpace = THREE.SRGBColorSpace;

    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTex,
      roughness: 0.45,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    const labelH = 0.85;
    const labelR = 0.485;
    const labelGeo = new THREE.CylinderGeometry(labelR, labelR, labelH, 64, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.y = -0.22;
    labelMesh.renderOrder = 2;
    bottleGroup.add(labelMesh);

    // 9. Dropper Cap Assembly (Matte Black Collar + Soft Rubber Bulb)
    const dropperGroup = new THREE.Group();
    dropperGroup.position.y = 0.76;
    dropperGroup.renderOrder = 2;

    // Ribbed collar
    const collarH = 0.28;
    const collarR = 0.24;
    const collarFlutes = 36;
    const collarGeo = new THREE.CylinderGeometry(collarR, collarR, collarH, collarFlutes);
    const cPos = collarGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const cy = cPos.getY(i);
      if (Math.abs(cy) < collarH * 0.45) {
        const cx = cPos.getX(i);
        const cz = cPos.getZ(i);
        const angle = Math.atan2(cz, cx);
        const r = Math.sqrt(cx * cx + cz * cz);
        const rib = (Math.cos(angle * collarFlutes) + 1) * 0.005;
        cPos.setX(i, Math.cos(angle) * (r + rib));
        cPos.setZ(i, Math.sin(angle) * (r + rib));
      }
    }
    collarGeo.computeVertexNormals();

    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.55,
      metalness: 0.12,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.y = collarH / 2;
    dropperGroup.add(collarMesh);

    // Smooth rubber squeeze bulb
    const bulbPoints: THREE.Vector2[] = [];
    bulbPoints.push(new THREE.Vector2(0.001, 0.62));
    bulbPoints.push(new THREE.Vector2(0.08, 0.60));
    bulbPoints.push(new THREE.Vector2(0.14, 0.54));
    bulbPoints.push(new THREE.Vector2(0.18, 0.44));
    bulbPoints.push(new THREE.Vector2(0.19, 0.32));
    bulbPoints.push(new THREE.Vector2(0.17, 0.22));
    bulbPoints.push(new THREE.Vector2(0.14, 0.14));
    bulbPoints.push(new THREE.Vector2(0.12, 0.08));

    const bulbGeo = new THREE.LatheGeometry(bulbPoints, 48);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.78, // Matte rubber finish
      metalness: 0.02,
    });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.y = collarH;
    dropperGroup.add(bulbMesh);

    bottleGroup.add(dropperGroup);

    // 10. Smooth Turntable Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      bottleGroup.rotation.y += 0.009;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      bottleGeo.dispose();
      pipetteGeo.dispose();
      fluidGeo.dispose();
      labelGeo.dispose();
      collarGeo.dispose();
      bulbGeo.dispose();
      shadowGeo.dispose();
      glassMaterial.dispose();
      pipetteMat.dispose();
      fluidMat.dispose();
      labelMat.dispose();
      collarMat.dispose();
      bulbMat.dispose();
      shadowMat.dispose();
      labelTex.dispose();
      shadowTex.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '230px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
}
