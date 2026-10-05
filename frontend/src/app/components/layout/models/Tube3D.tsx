import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Photorealistic 3D Cosmetic Squeeze Tube
 * - Authentic lofted geometry transitioning from round base to wide flat crimped top
 * - Fine vertical heat-seal crimp texture with stamped lot code
 * - Luxury rose-gold metallic cosmetic screw cap with bevels & knurled rim
 * - Silky smooth satin cosmetic finish with crisp botanical typography
 * - Smooth 60fps turntable rotation
 */
export default function Tube3D() {
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
    camera.position.set(0, 0.05, 4.3);

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
    const ambientLight = new THREE.AmbientLight(0xfff5f0, 0.75);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(3, 4, 3.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfce7f3, 0.65);
    fillLight.position.set(-3, 1.5, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffedd5, 0.85);
    rimLight.position.set(0, 3, -3.5);
    scene.add(rimLight);

    // 4. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.2, 2.2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 105);
      grad.addColorStop(0, 'rgba(40, 25, 20, 0.45)');
      grad.addColorStop(0.35, 'rgba(40, 25, 20, 0.2)');
      grad.addColorStop(0.7, 'rgba(40, 25, 20, 0.05)');
      grad.addColorStop(1, 'rgba(40, 25, 20, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.02;
    scene.add(shadowMesh);

    // 5. Tube Root Group
    const tubeGroup = new THREE.Group();
    tubeGroup.position.y = -0.05;
    scene.add(tubeGroup);

    // 6. Label Texture Canvas (High-Res Cosmetic Serum Artwork)
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 1024;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      // Soft luxury peach-blush gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
      bgGrad.addColorStop(0, '#f9ede4');
      bgGrad.addColorStop(0.5, '#f4e2d5');
      bgGrad.addColorStop(1, '#ebd0bf');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Fine golden decorative perimeter line
      ctx.strokeStyle = 'rgba(184, 122, 94, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(300, 260, 424, 520);

      // Center Typography
      ctx.textAlign = 'center';

      // Brand Eyebrow
      ctx.font = '700 18px "Inter", sans-serif';
      ctx.fillStyle = '#9e6246';
      ctx.letterSpacing = '5px';
      ctx.fillText('KLD DERMA LAB', 512, 335);

      // Divider Line
      ctx.fillStyle = '#b87a5e';
      ctx.fillRect(450, 355, 124, 2);

      // Main Product Title
      ctx.font = '900 48px "Inter", sans-serif';
      ctx.fillStyle = '#2d1810';
      ctx.letterSpacing = '3px';
      ctx.fillText('BOTANICAL', 512, 430);
      ctx.fillText('SERUM', 512, 485);

      // Subtitle
      ctx.font = '600 20px "Inter", sans-serif';
      ctx.fillStyle = '#7a4a35';
      ctx.letterSpacing = '2px';
      ctx.fillText('PEPTIDE REPAIR + HYDRATE', 512, 545);

      // Ingredient highlights
      ctx.font = '500 17px "Inter", sans-serif';
      ctx.fillStyle = '#8f5c45';
      ctx.fillText('Niacinamide 5% • Hyaluronic Acid • Ceramides', 512, 610);
      ctx.fillText('Dermatologist Tested • Clean Formula', 512, 642);

      // Volume & Origin
      ctx.font = 'bold 22px "Inter", monospace';
      ctx.fillStyle = '#2d1810';
      ctx.fillText('50 ML ℮ 1.7 FL. OZ.', 512, 725);
    }

    const tubeTexture = new THREE.CanvasTexture(labelCanvas);
    tubeTexture.colorSpace = THREE.SRGBColorSpace;

    const tubeMaterial = new THREE.MeshStandardMaterial({
      map: tubeTexture,
      roughness: 0.28, // Satin cosmetic plastic
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // 7. Lofted Squeeze Tube Body Geometry
    // Morphs smoothly from round circular base (y = -0.65) to flat crimp top (y = 0.85)
    const rings = 48;
    const segments = 48;
    const bodyPositions: number[] = [];
    const bodyUvs: number[] = [];
    const bodyIndices: number[] = [];

    const yStart = -0.65;
    const yEnd = 0.85;
    const totalH = yEnd - yStart;
    const baseR = 0.44;

    for (let r = 0; r <= rings; r++) {
      const t = r / rings; // 0 to 1
      const y = yStart + t * totalH;

      // Morph factors:
      // Width expands by ~36% as it flattens
      const xRadius = baseR * (1.0 + 0.36 * Math.pow(t, 0.9));
      // Depth pinches down to ~0.025 at the top seal
      const zRadius = baseR * (1.0 - 0.94 * Math.pow(t, 0.92));

      for (let s = 0; s <= segments; s++) {
        const u = s / segments;
        const angle = u * Math.PI * 2;

        const x = xRadius * Math.cos(angle);
        const z = zRadius * Math.sin(angle);

        bodyPositions.push(x, y, z);
        bodyUvs.push(u, t);
      }
    }

    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const i0 = r * (segments + 1) + s;
        const i1 = i0 + 1;
        const i2 = (r + 1) * (segments + 1) + s;
        const i3 = i2 + 1;

        bodyIndices.push(i0, i1, i2);
        bodyIndices.push(i1, i3, i2);
      }
    }

    const bodyGeo = new THREE.BufferGeometry();
    bodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(bodyPositions, 3));
    bodyGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bodyUvs, 2));
    bodyGeo.setIndex(bodyIndices);
    bodyGeo.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeo, tubeMaterial);
    bodyMesh.castShadow = true;
    tubeGroup.add(bodyMesh);

    // 8. Top Heat-Sealed Crimp Bar
    const crimpH = 0.22;
    const crimpW = baseR * 1.36 * 2; // ~1.20
    const crimpD = 0.026;
    const crimpGeo = new THREE.BoxGeometry(crimpW, crimpH, crimpD, 36, 6, 1);

    // Add crimp ridges
    const cPos = crimpGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const cz = cPos.getZ(i);
      if (Math.abs(cz) > 0.005) {
        const cx = cPos.getX(i);
        const rib = Math.sin(cx * 110) * 0.0025;
        cPos.setZ(i, cz + rib);
      }
    }
    crimpGeo.computeVertexNormals();

    const crimpMat = new THREE.MeshStandardMaterial({
      color: 0xebd0bf,
      roughness: 0.38,
      metalness: 0.08,
    });
    const crimpMesh = new THREE.Mesh(crimpGeo, crimpMat);
    crimpMesh.position.y = yEnd + crimpH / 2 - 0.01;
    tubeGroup.add(crimpMesh);

    // 9. Rose-Gold Metallic Screw Cap Assembly
    const capGroup = new THREE.Group();
    capGroup.position.y = yStart;

    const capH = 0.36;
    const capR = 0.42;

    const capGeo = new THREE.CylinderGeometry(capR * 0.98, capR, capH, 48);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xb87a5e, // Rose gold / warm metallic bronze
      metalness: 0.72,
      roughness: 0.22,
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = -capH / 2;
    capMesh.castShadow = true;
    capGroup.add(capMesh);

    // Cap bottom bevel disk
    const capBottomGeo = new THREE.CylinderGeometry(capR, capR * 0.95, 0.03, 48);
    const capBottom = new THREE.Mesh(capBottomGeo, capMat);
    capBottom.position.y = -capH - 0.015;
    capGroup.add(capBottom);

    tubeGroup.add(capGroup);

    // 10. Smooth Turntable Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      tubeGroup.rotation.y += 0.009;
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
      bodyGeo.dispose();
      crimpGeo.dispose();
      capGeo.dispose();
      capBottomGeo.dispose();
      shadowGeo.dispose();
      tubeMaterial.dispose();
      crimpMat.dispose();
      capMat.dispose();
      shadowMat.dispose();
      tubeTexture.dispose();
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
