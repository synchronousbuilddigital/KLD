import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Photorealistic 3D Stand-Up Zipper Pouch (Doypack)
 * - Authentic puffed pillow volume with side heat-seal crimps
 * - Top heat-seal bar with corrugated grip ridges, tear notches & zipper line
 * - Aroma degassing valve on upper right
 * - Bottom oval stand-up gusset with contact shadow
 * - Rich matte kraft / soft-touch foil texture with crisp typography
 * - Smooth 60fps turntable rotation with zero lag
 */
export default function Pouch3D() {
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
    camera.position.set(0, 0.1, 4.4);

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
    const ambientLight = new THREE.AmbientLight(0xfff8f0, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 4, 3.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.6);
    fillLight.position.set(-3, 2, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffedd5, 0.8);
    rimLight.position.set(0, 3, -3.5);
    scene.add(rimLight);

    // 4. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 15, 128, 128, 110);
      grad.addColorStop(0, 'rgba(30, 20, 15, 0.45)');
      grad.addColorStop(0.35, 'rgba(30, 20, 15, 0.2)');
      grad.addColorStop(0.7, 'rgba(30, 20, 15, 0.05)');
      grad.addColorStop(1, 'rgba(30, 20, 15, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.02;
    scene.add(shadowMesh);

    // 5. Pouch Root Group
    const pouchGroup = new THREE.Group();
    pouchGroup.position.y = -0.05;
    scene.add(pouchGroup);

    // 6. High-Res Pouch Label & Kraft Surface Canvas Texture
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 1024;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      // Natural textured kraft/aluminized matte background
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
      bgGrad.addColorStop(0, '#f5ede3');
      bgGrad.addColorStop(0.5, '#ede1d2');
      bgGrad.addColorStop(1, '#e2d3be');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Subtle paper fiber grain
      ctx.fillStyle = 'rgba(120, 80, 40, 0.025)';
      for (let i = 0; i < 600; i++) {
        const gx = Math.random() * 1024;
        const gy = Math.random() * 1024;
        ctx.fillRect(gx, gy, Math.random() * 3 + 1, Math.random() * 2 + 1);
      }

      // Elegant organic arch illustration
      ctx.strokeStyle = 'rgba(180, 140, 90, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(512, 420, 240, Math.PI, 0);
      ctx.stroke();

      // Brand Typography
      ctx.textAlign = 'center';

      // Eyebrow
      ctx.font = '700 19px "Inter", sans-serif';
      ctx.fillStyle = '#8c6239';
      ctx.letterSpacing = '5px';
      ctx.fillText('ORIGIN RESERVE', 512, 330);

      // Divider line
      ctx.fillStyle = '#b3824d';
      ctx.fillRect(440, 350, 144, 2);

      // Main Brand Name
      ctx.font = '900 62px "Inter", sans-serif';
      ctx.fillStyle = '#2c1808';
      ctx.letterSpacing = '3px';
      ctx.fillText('KLD COFFEE', 512, 430);

      // Subtitle
      ctx.font = '600 24px "Inter", sans-serif';
      ctx.fillStyle = '#6e4720';
      ctx.letterSpacing = '2px';
      ctx.fillText('SPECIALTY ROASTERS', 512, 475);

      // Flavor profile box
      ctx.strokeStyle = 'rgba(140, 98, 57, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(300, 525, 424, 60);

      ctx.font = '700 19px "Inter", sans-serif';
      ctx.fillStyle = '#3d220a';
      ctx.letterSpacing = '2px';
      ctx.fillText('JASMINE • PEACH • WILD HONEY', 512, 562);

      // Origin Details
      ctx.font = '500 20px "Inter", sans-serif';
      ctx.fillStyle = '#5c3815';
      ctx.fillText('Single Origin • Yirgacheffe, Ethiopia', 512, 635);
      ctx.fillText('Hand-harvested at 2,100m elevation', 512, 668);

      // Bottom specs
      ctx.font = 'bold 22px "Inter", monospace';
      ctx.fillStyle = '#2c1808';
      ctx.fillText('250G / 8.8 OZ', 512, 770);
      ctx.font = '600 16px "Inter", sans-serif';
      ctx.fillStyle = '#8c6239';
      ctx.fillText('WHOLE BEAN COFFEE • NITROGEN FLUSHED', 512, 805);
    }

    const pouchTexture = new THREE.CanvasTexture(labelCanvas);
    pouchTexture.colorSpace = THREE.SRGBColorSpace;

    // Normal map for authentic foil wrinkles & paper texture
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, 512, 512);
      // Soft organic crease lines
      bCtx.strokeStyle = '#505050';
      bCtx.lineWidth = 4;
      bCtx.filter = 'blur(6px)';
      bCtx.beginPath();
      bCtx.moveTo(80, 300);
      bCtx.quadraticCurveTo(240, 340, 430, 310);
      bCtx.moveTo(100, 420);
      bCtx.quadraticCurveTo(260, 460, 410, 430);
      bCtx.stroke();
    }
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);

    const pouchMaterial = new THREE.MeshStandardMaterial({
      map: pouchTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.015,
      roughness: 0.42,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // 7. Parametric Pouch Body Geometry (Smooth, Natural Doypack Pillowing)
    const rows = 48;
    const cols = 48;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const pouchH = 1.55;
    const yBottom = -0.92;
    const yTop = yBottom + pouchH; // 0.63

    // Generate Front & Back Surfaces
    const createPouchSide = (isFront: boolean, baseVertexOffset: number) => {
      const zSign = isFront ? 1 : -1;

      for (let r = 0; r <= rows; r++) {
        const v = r / rows;
        const y = yBottom + v * pouchH;

        // Width tapers slightly: narrower at bottom (0.92), widest at middle-top (1.08)
        const currentW = 0.92 + Math.sin(v * Math.PI * 0.85) * 0.16;

        // Depth (pillow expansion): expands at bottom/belly, pinches tightly to 0 at top seal
        // Authentic standup pouch profile: bottom gusset pushes base out, top seals flat
        const gussetExpansion = Math.sin((1 - v) * Math.PI * 0.95);
        const maxDepth = Math.max(0.01, 0.24 * gussetExpansion);

        for (let c = 0; c <= cols; c++) {
          const u = c / cols;
          const normX = (u - 0.5) * 2; // -1 to +1
          const x = normX * (currentW / 2);

          // Parabolic pillow curve across width: 0 at sealed edges, maxDepth in center
          const edgeSeamFactor = Math.max(0, 1 - Math.pow(Math.abs(normX), 2.2));
          let z = zSign * maxDepth * edgeSeamFactor;

          // Subtle organic side-crease puff
          const sideCrinkle = Math.sin(normX * Math.PI * 3 + v * 8) * 0.004 * (1 - v);
          z += sideCrinkle;

          positions.push(x, y, z);
          uvs.push(isFront ? u : 1 - u, v);
        }
      }

      // Generate Quads
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i0 = baseVertexOffset + r * (cols + 1) + c;
          const i1 = i0 + 1;
          const i2 = baseVertexOffset + (r + 1) * (cols + 1) + c;
          const i3 = i2 + 1;

          if (isFront) {
            indices.push(i0, i2, i1);
            indices.push(i1, i2, i3);
          } else {
            indices.push(i0, i1, i2);
            indices.push(i1, i3, i2);
          }
        }
      }
    };

    const frontOffset = 0;
    createPouchSide(true, frontOffset);
    const backOffset = (rows + 1) * (cols + 1);
    createPouchSide(false, backOffset);

    // Close the Left & Right Heat-Sealed Edge Seams
    for (let r = 0; r < rows; r++) {
      // Left seam (col = 0)
      const f0L = r * (cols + 1);
      const f1L = (r + 1) * (cols + 1);
      const b0L = backOffset + r * (cols + 1);
      const b1L = backOffset + (r + 1) * (cols + 1);
      indices.push(f0L, b0L, f1L);
      indices.push(b0L, b1L, f1L);

      // Right seam (col = cols)
      const f0R = r * (cols + 1) + cols;
      const f1R = (r + 1) * (cols + 1) + cols;
      const b0R = backOffset + r * (cols + 1) + cols;
      const b1R = backOffset + (r + 1) * (cols + 1) + cols;
      indices.push(f0R, f1R, b0R);
      indices.push(f1R, b1R, b0R);
    }

    const pouchGeo = new THREE.BufferGeometry();
    pouchGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    pouchGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    pouchGeo.setIndex(indices);
    pouchGeo.computeVertexNormals();

    const pouchMesh = new THREE.Mesh(pouchGeo, pouchMaterial);
    pouchMesh.castShadow = true;
    pouchGroup.add(pouchMesh);

    // 8. Top Heat-Seal Bar with Grip Ridges & Tear Notches
    const sealH = 0.32;
    const sealW = 1.08;
    const sealD = 0.025;
    const sealGeo = new THREE.BoxGeometry(sealW, sealH, sealD, 32, 8, 1);

    // Apply crimp ridges to seal bar
    const sPos = sealGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      const sy = sPos.getY(i);
      const sz = sPos.getZ(i);
      if (Math.abs(sz) > 0.005) {
        // Vertical micro-ribbing
        const sx = sPos.getX(i);
        const rib = Math.sin(sx * 90) * 0.003;
        sPos.setZ(i, sz + rib);
      }
    }
    sealGeo.computeVertexNormals();

    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.35,
      metalness: 0.15,
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.y = yTop + sealH / 2 - 0.01;
    pouchGroup.add(sealMesh);

    // Tear notches (Left & Right)
    const notchGeo = new THREE.ConeGeometry(0.024, 0.04, 3);
    const notchMat = new THREE.MeshBasicMaterial({ color: 0x2b1606 });

    const leftNotch = new THREE.Mesh(notchGeo, notchMat);
    leftNotch.rotation.z = Math.PI / 2;
    leftNotch.position.set(-sealW / 2 + 0.008, sealMesh.position.y + 0.04, 0);
    pouchGroup.add(leftNotch);

    const rightNotch = new THREE.Mesh(notchGeo, notchMat);
    rightNotch.rotation.z = -Math.PI / 2;
    rightNotch.position.set(sealW / 2 - 0.008, sealMesh.position.y + 0.04, 0);
    pouchGroup.add(rightNotch);

    // Zipper impression line
    const zipGeo = new THREE.BoxGeometry(sealW * 0.94, 0.012, sealD + 0.004);
    const zipMat = new THREE.MeshStandardMaterial({ color: 0xc89e6c, roughness: 0.5 });
    const zipMesh = new THREE.Mesh(zipGeo, zipMat);
    zipMesh.position.set(0, sealMesh.position.y - 0.08, 0);
    pouchGroup.add(zipMesh);

    // 9. Aroma Degassing Valve (upper right)
    const valveGroup = new THREE.Group();
    valveGroup.position.set(0.24, 0.32, 0.165);

    const valveOuterGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.016, 24);
    const valveMat = new THREE.MeshStandardMaterial({ color: 0xb58b5a, roughness: 0.35, metalness: 0.2 });
    const valveOuter = new THREE.Mesh(valveOuterGeo, valveMat);
    valveOuter.rotation.x = Math.PI / 2;
    valveGroup.add(valveOuter);

    const valveInnerGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.02, 16);
    const valveInnerMat = new THREE.MeshBasicMaterial({ color: 0x3d2008 });
    const valveInner = new THREE.Mesh(valveInnerGeo, valveInnerMat);
    valveInner.rotation.x = Math.PI / 2;
    valveGroup.add(valveInner);

    pouchGroup.add(valveGroup);

    // 10. Bottom Inverted Gusset Rim
    const gussetGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.04, 32, 1, false);
    gussetGeo.scale(1.0, 1.0, 0.42);
    const gussetMat = new THREE.MeshStandardMaterial({ color: 0xbfa07a, roughness: 0.6 });
    const gussetMesh = new THREE.Mesh(gussetGeo, gussetMat);
    gussetMesh.position.y = yBottom + 0.01;
    pouchGroup.add(gussetMesh);

    // 11. Smooth Turntable Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      pouchGroup.rotation.y += 0.009;
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
      pouchGeo.dispose();
      sealGeo.dispose();
      notchGeo.dispose();
      zipGeo.dispose();
      valveOuterGeo.dispose();
      valveInnerGeo.dispose();
      gussetGeo.dispose();
      shadowGeo.dispose();
      pouchMaterial.dispose();
      sealMat.dispose();
      notchMat.dispose();
      zipMat.dispose();
      valveMat.dispose();
      valveInnerMat.dispose();
      gussetMat.dispose();
      shadowMat.dispose();
      pouchTexture.dispose();
      bumpTexture.dispose();
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
