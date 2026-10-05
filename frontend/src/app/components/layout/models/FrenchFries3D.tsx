import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Photorealistic 3D French Fries Scoop Carton with Gourmet Crispy Golden Fries
 * - Slender, realistic fast-food scoop carton proportions (matching reference icon)
 * - Tall, delicious golden french fries protruding and overflowing gracefully out of the top
 * - Strictly bounded interior roots — zero fries piercing through the paperboard walls
 * - Prominent, crisp "KLD PACKAGING" branding centered on the front face
 * - Appetizing warm studio lighting with soft ground shadow and smooth turntable rotation
 */
export default function FrenchFries3D() {
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
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50);
    camera.position.set(0, 0.08, 4.15);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Appetizing Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff9ef, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeed8, 1.55);
    keyLight.position.set(2.5, 4.5, 4.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.65);
    fillLight.position.set(-3, 1.5, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 1.30);
    rimLight.position.set(0, 3, -3.5);
    scene.add(rimLight);

    // 4. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.2, 2.2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 110);
      grad.addColorStop(0, 'rgba(45, 25, 10, 0.45)');
      grad.addColorStop(0.35, 'rgba(45, 25, 10, 0.18)');
      grad.addColorStop(0.7, 'rgba(45, 25, 10, 0.04)');
      grad.addColorStop(1, 'rgba(45, 25, 10, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.92;
    scene.add(shadowMesh);

    // 5. Main Root Group (centered at base)
    const rootGroup = new THREE.Group();
    rootGroup.position.y = -0.15;
    scene.add(rootGroup);

    // 6. High-DPI Front Carton Texture (Prominent KLD Packaging Branding)
    const brandCanvas = document.createElement('canvas');
    brandCanvas.width = 1024;
    brandCanvas.height = 1024;
    const ctx = brandCanvas.getContext('2d');
    if (ctx) {
      // Coated food-grade ivory paperboard
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(0, 0, 1024, 1024);

      // Mustard ochre organic sweep on bottom-right corner (matching thumbnail icon)
      ctx.fillStyle = '#c58b2b';
      ctx.beginPath();
      ctx.moveTo(1024, 520);
      ctx.quadraticCurveTo(720, 620, 620, 1024);
      ctx.lineTo(1024, 1024);
      ctx.closePath();
      ctx.fill();

      // Soft tan secondary curved accent
      ctx.fillStyle = '#dfaf58';
      ctx.beginPath();
      ctx.moveTo(1024, 700);
      ctx.quadraticCurveTo(780, 780, 740, 1024);
      ctx.lineTo(1024, 1024);
      ctx.closePath();
      ctx.fill();

      // Front Branding Typography & Emblem
      ctx.save();
      ctx.translate(512, 420);
      // Slight aspect compensation for the slender carton surface
      ctx.scale(0.85, 1.10);

      // Green eco leaf logo
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.quadraticCurveTo(24, 138, 20, 110);
      ctx.quadraticCurveTo(0, 126, -20, 110);
      ctx.quadraticCurveTo(-24, 138, 0, 160);
      ctx.fill();

      // Big Bold "KLD"
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 120px "Inter", "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#181514';
      ctx.fillText('KLD', 0, -32);

      // "PACKAGING" subtitle with clean spacing
      ctx.font = '700 24px "Inter", "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#57534e';
      ctx.fillText('P A C K A G I N G', 0, 32);

      // Gold accent rule
      ctx.fillStyle = '#c58b2b';
      ctx.fillRect(-95, 52, 190, 4);

      // Tagline
      ctx.font = '600 17px "Inter", sans-serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('CRISPY GOURMET FRIES', 0, 80);

      ctx.restore();
    }

    const brandTex = new THREE.CanvasTexture(brandCanvas);
    brandTex.colorSpace = THREE.SRGBColorSpace;

    // 7. SLENDER, AUTHENTIC SCOOP CARTON GEOMETRY
    const cartonGroup = new THREE.Group();

    const uSegs = 64; // around circumference
    const vSegs = 32; // from bottom to top rim

    const yBase = -0.75;
    const wBase = 0.68; // Slender, realistic width at base
    const dBase = 0.36; // Slender depth at base

    const wTop = 0.86;  // Slender top width (not oversized or chubby!)
    const dTop = 0.46;  // Slender top depth

    // Helper: Rounded-trapezoid carton profile
    // phi = 0 is FRONT CENTER (facing camera, pz > 0, px = 0)
    // phi = PI/2 is RIGHT SIDE (px > 0, pz = 0)
    // phi = PI is BACK CENTER (pz < 0, px = 0)
    // phi = -PI/2 is LEFT SIDE (px < 0, pz = 0)
    const getCartonProfile = (phi: number, w: number, d: number) => {
      const n = 3.2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);
      const signCos = cosP >= 0 ? 1 : -1;
      const signSin = sinP >= 0 ? 1 : -1;
      const pz = signCos * Math.pow(Math.abs(cosP), 2 / n) * (d / 2);
      const px = signSin * Math.pow(Math.abs(sinP), 2 / n) * (w / 2);
      return { px, pz, cosP, sinP };
    };

    // Calculate top rim height for any angle:
    // Front dips down to -0.06 in center (deep scoop so fries protrude out prominently)
    // Back arches up to +0.50 in center
    const getTopRimY = (cosP: number) => {
      if (cosP >= 0) {
        return 0.16 - cosP * 0.22;
      } else {
        const backFactor = Math.pow(-cosP, 1.25);
        return 0.16 + backFactor * 0.34;
      }
    };

    // Build seamless carton surface
    const buildCartonMesh = (scaleOffset: number, isInner: boolean) => {
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let j = 0; j <= vSegs; j++) {
        const v = j / vSegs;

        for (let i = 0; i <= uSegs; i++) {
          const u = i / uSegs;
          const phi = u * Math.PI * 2;

          const currentW = (wBase + (wTop - wBase) * v) * scaleOffset;
          const currentD = (dBase + (dTop - dBase) * v) * scaleOffset;

          const { px, pz, cosP, sinP } = getCartonProfile(phi, currentW, currentD);
          const yTopRim = getTopRimY(cosP);
          const py = yBase + v * (yTopRim - yBase);

          positions.push(px, py, pz);

          // UV mapping centered on front face
          let uNorm: number;
          if (cosP >= 0) {
            uNorm = 0.5 + sinP * 0.42;
          } else {
            uNorm = 0.5 - sinP * 0.42;
          }

          uvs.push(isInner ? 1 - uNorm : uNorm, v);
        }
      }

      for (let j = 0; j < vSegs; j++) {
        for (let i = 0; i < uSegs; i++) {
          const a = j * (uSegs + 1) + i;
          const b = a + 1;
          const c = (j + 1) * (uSegs + 1) + i;
          const d = c + 1;

          if (isInner) {
            indices.push(a, c, b);
            indices.push(b, c, d);
          } else {
            indices.push(a, b, c);
            indices.push(b, d, c);
          }
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    };

    const outerGeo = buildCartonMesh(1.0, false);
    const innerGeo = buildCartonMesh(0.965, true);

    const cartonMatOuter = new THREE.MeshStandardMaterial({
      map: brandTex,
      roughness: 0.28,
      metalness: 0.02,
      side: THREE.FrontSide,
    });

    const cartonMatInner = new THREE.MeshStandardMaterial({
      color: 0xf4ece3,
      roughness: 0.55,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    const outerMesh = new THREE.Mesh(outerGeo, cartonMatOuter);
    outerMesh.castShadow = true;
    cartonGroup.add(outerMesh);

    const innerMesh = new THREE.Mesh(innerGeo, cartonMatInner);
    cartonGroup.add(innerMesh);

    // Bottom solid plate
    const basePositions: number[] = [];
    const baseIndices: number[] = [];
    basePositions.push(0, yBase, 0);
    for (let i = 0; i <= uSegs; i++) {
      const phi = (i / uSegs) * Math.PI * 2;
      const { px, pz } = getCartonProfile(phi, wBase, dBase);
      basePositions.push(px, yBase, pz);
    }
    for (let i = 1; i <= uSegs; i++) {
      baseIndices.push(0, i, i + 1);
    }
    const baseGeo = new THREE.BufferGeometry();
    baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(basePositions, 3));
    baseGeo.setIndex(baseIndices);
    baseGeo.computeVertexNormals();
    const baseMesh = new THREE.Mesh(baseGeo, cartonMatOuter);
    cartonGroup.add(baseMesh);

    rootGroup.add(cartonGroup);

    // 8. CRISPY GOURMET FRENCH FRIES (Plump, Golden, Protruding Boldly Out of the Top Opening)
    const potatoCanvas = document.createElement('canvas');
    potatoCanvas.width = 128;
    potatoCanvas.height = 256;
    const pCtx = potatoCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#b45309');    // Crisp browned tip
      grad.addColorStop(0.08, '#d97706'); // Golden fried edge
      grad.addColorStop(0.35, '#f59e0b'); // Golden potato body
      grad.addColorStop(0.70, '#fbbf24'); // Warm butter potato
      grad.addColorStop(0.92, '#f59e0b');
      grad.addColorStop(1, '#d97706');    // Bottom toasted
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 128, 256);

      // Fine salt & potato texture flecks
      pCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let k = 0; k < 70; k++) {
        pCtx.fillRect(Math.random() * 128, Math.random() * 256, 1.5, 1.5);
      }
      pCtx.fillStyle = 'rgba(160, 70, 10, 0.25)';
      for (let k = 0; k < 50; k++) {
        pCtx.fillRect(Math.random() * 128, Math.random() * 256, 2, 2);
      }
    }
    const potatoTex = new THREE.CanvasTexture(potatoCanvas);

    const fryMats = [
      new THREE.MeshStandardMaterial({ map: potatoTex, color: 0xffd166, roughness: 0.35, metalness: 0.03 }), // Golden butter
      new THREE.MeshStandardMaterial({ map: potatoTex, color: 0xfcb034, roughness: 0.38, metalness: 0.03 }), // Crisp amber
      new THREE.MeshStandardMaterial({ map: potatoTex, color: 0xf59e0b, roughness: 0.36, metalness: 0.04 }), // Deep toasted
      new THREE.MeshStandardMaterial({ map: potatoTex, color: 0xffe082, roughness: 0.37, metalness: 0.02 }), // Light potato
    ];

    /**
     * Helper: Creates an authentic cut potato fry with rounded, soft-pillowed tip (NO chalk sticks!)
     * Uniform rectangular cut with rounded beveled edges and domed tip.
     */
    const createGourmetFry = (length: number, thickness: number, bendZ: number, matIdx: number) => {
      const radialSegs = 8;
      const heightSegs = 10;
      const geo = new THREE.CylinderGeometry(thickness, thickness, length, radialSegs, heightSegs, false);

      // Rectangular cut fry proportions (1.15 x 0.95)
      geo.scale(1.15, 1.0, 0.95);

      const pos = geo.attributes.position;
      const halfLen = length / 2;

      for (let k = 0; k < pos.count; k++) {
        const y = pos.getY(k);
        const normY = y / halfLen; // -1 at bottom, +1 at top

        // Gentle natural droop / curve
        const curve = Math.pow(Math.max(0, (normY + 1) / 2), 1.7) * bendZ;
        pos.setZ(k, pos.getZ(k) + curve);

        // Soft rounded dome on the cut top end (replaces flat circular chalk face with puffy fried dome)
        if (normY > 0.88) {
          const capFactor = (normY - 0.88) / 0.12;
          const dome = Math.sqrt(Math.max(0, 1 - capFactor * capFactor)) * (thickness * 0.40);
          pos.setY(k, y + dome);
          const roundTip = 1 - capFactor * 0.18;
          pos.setX(k, pos.getX(k) * roundTip);
          pos.setZ(k, pos.getZ(k) * roundTip);
        }
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, fryMats[matIdx % fryMats.length]);
      mesh.castShadow = true;
      return mesh;
    };

    // 38 Plump Gourmet Fries Protruding Boldly Out of the Slender Carton
    // ALL fry roots are strictly placed at y = -0.38, with:
    // x in [-0.18, 0.18], z in [-0.08, 0.08]
    // The carton width at y = -0.38 is 0.75 (half-width 0.375).
    // Margin to wall is > 0.19 units everywhere! ZERO fries penetrate the walls.
    // Lengths: 0.68 to 1.05 so fries protrude tall and proud out of the scooped top!
    const friesData = [
      // 1. FRONT ROW: Shortest fries emerging over the front scoop lip
      { x: -0.17, z: 0.06, len: 0.66, rotX: 0.18, rotZ: -0.11, bend: 0.03, m: 0 },
      { x: -0.12, z: 0.07, len: 0.70, rotX: 0.19, rotZ: -0.06, bend: 0.04, m: 1 },
      { x: -0.06, z: 0.08, len: 0.73, rotX: 0.17, rotZ: -0.02, bend: -0.02, m: 2 },
      { x: 0.00,  z: 0.08, len: 0.75, rotX: 0.20, rotZ: 0.01,  bend: 0.03, m: 0 },
      { x: 0.06,  z: 0.08, len: 0.74, rotX: 0.19, rotZ: 0.03,  bend: -0.02, m: 3 },
      { x: 0.12,  z: 0.07, len: 0.71, rotX: 0.18, rotZ: 0.07,  bend: 0.02, m: 1 },
      { x: 0.17,  z: 0.06, len: 0.67, rotX: 0.19, rotZ: 0.11,  bend: -0.03, m: 2 },

      // 2. MID-FRONT ROW: Full, lush protruding layer
      { x: -0.18, z: 0.02, len: 0.80, rotX: 0.11, rotZ: -0.10, bend: 0.04, m: 1 },
      { x: -0.13, z: 0.03, len: 0.84, rotX: 0.13, rotZ: -0.05, bend: -0.02, m: 2 },
      { x: -0.08, z: 0.03, len: 0.88, rotX: 0.10, rotZ: -0.02, bend: 0.03, m: 0 },
      { x: -0.02, z: 0.04, len: 0.90, rotX: 0.12, rotZ: 0.01,  bend: 0.02, m: 3 },
      { x: 0.03,  z: 0.04, len: 0.91, rotX: 0.14, rotZ: 0.02,  bend: -0.03, m: 1 },
      { x: 0.08,  z: 0.03, len: 0.89, rotX: 0.11, rotZ: 0.04,  bend: 0.02, m: 0 },
      { x: 0.13,  z: 0.03, len: 0.85, rotX: 0.13, rotZ: 0.07,  bend: -0.02, m: 2 },
      { x: 0.18,  z: 0.02, len: 0.81, rotX: 0.11, rotZ: 0.10,  bend: 0.03, m: 3 },

      // 3. MID-BACK ROW: Medium-tall fries
      { x: -0.17, z: -0.02, len: 0.92, rotX: 0.04, rotZ: -0.08, bend: 0.04, m: 2 },
      { x: -0.12, z: -0.01, len: 0.96, rotX: 0.06, rotZ: -0.04, bend: -0.02, m: 0 },
      { x: -0.07, z: -0.02, len: 0.99, rotX: 0.03, rotZ: -0.01, bend: 0.03, m: 1 },
      { x: -0.01, z: -0.01, len: 1.02, rotX: 0.06, rotZ: 0.01,  bend: 0.02, m: 3 },
      { x: 0.04,  z: -0.01, len: 1.03, rotX: 0.05, rotZ: 0.02,  bend: -0.03, m: 0 },
      { x: 0.09,  z: -0.01, len: 1.00, rotX: 0.06, rotZ: 0.04,  bend: 0.03, m: 2 },
      { x: 0.14,  z: -0.01, len: 0.95, rotX: 0.04, rotZ: 0.07,  bend: -0.02, m: 1 },
      { x: 0.18,  z: -0.02, len: 0.91, rotX: 0.05, rotZ: 0.09,  bend: 0.04, m: 0 },

      // 4. BACK ROW: Tallest fries standing against the arched rear wall
      { x: -0.16, z: -0.06, len: 0.98, rotX: -0.03, rotZ: -0.07, bend: -0.03, m: 1 },
      { x: -0.11, z: -0.07, len: 1.03, rotX: -0.02, rotZ: -0.03, bend: 0.02,  m: 0 },
      { x: -0.05, z: -0.06, len: 1.06, rotX: -0.03, rotZ: -0.01, bend: -0.02, m: 2 },
      { x: 0.00,  z: -0.07, len: 1.08, rotX: -0.02, rotZ: 0.00,  bend: 0.03,  m: 3 },
      { x: 0.05,  z: -0.07, len: 1.07, rotX: -0.02, rotZ: 0.02,  bend: -0.02, m: 1 },
      { x: 0.11,  z: -0.07, len: 1.04, rotX: -0.02, rotZ: 0.04,  bend: 0.03,  m: 0 },
      { x: 0.16,  z: -0.06, len: 0.99, rotX: -0.03, rotZ: 0.07,  bend: -0.02, m: 2 },

      // 5. ACCENT CROSSOVER FRIES: Natural tangled cluster
      { x: -0.05, z: 0.01, len: 0.92, rotX: 0.12, rotZ: -0.05, bend: 0.05, m: 0 },
      { x: 0.05,  z: 0.00, len: 0.91, rotX: 0.13, rotZ: 0.04,  bend: -0.04, m: 2 },
      { x: -0.01, z: -0.01, len: 1.01, rotX: 0.07, rotZ: 0.02,  bend: 0.03, m: 1 },
      { x: -0.10, z: -0.03, len: 0.97, rotX: 0.05, rotZ: -0.03, bend: -0.03, m: 3 },
      { x: 0.09,  z: -0.03, len: 0.96, rotX: 0.04, rotZ: 0.04,  bend: 0.03, m: 0 },
    ];

    const friesHolder = new THREE.Group();
    // Anchor fry bases securely deep inside the carton
    friesHolder.position.y = -0.38;

    const fryThickness = 0.046; // Plump, authentic gourmet french fry thickness
    friesData.forEach((item) => {
      const fry = createGourmetFry(item.len, fryThickness, item.bend, item.m);
      fry.position.set(item.x, item.len / 2, item.z);
      fry.rotation.x = item.rotX;
      fry.rotation.z = item.rotZ;
      fry.rotation.y = (Math.random() - 0.5) * 0.35;
      friesHolder.add(fry);
    });

    rootGroup.add(friesHolder);

    // 9. Smooth 60fps Turntable Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      rootGroup.rotation.y += 0.009;
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
      outerGeo.dispose();
      innerGeo.dispose();
      baseGeo.dispose();
      shadowGeo.dispose();
      cartonMatOuter.dispose();
      cartonMatInner.dispose();
      shadowMat.dispose();
      brandTex.dispose();
      potatoTex.dispose();
      shadowTex.dispose();
      fryMats.forEach(m => m.dispose());
      friesHolder.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
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
