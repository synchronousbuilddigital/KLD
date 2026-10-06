import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type DecalType = 'image' | 'text' | 'shape' | 'symbol';

export interface CanvasDecal {
  id: string;
  type: DecalType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  url?: string;
  text?: string;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  fillColor?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  shapeType?: 'rect' | 'rounded-rectangle' | 'circle' | 'triangle' | 'star' | 'pill' | 'line' | 'dashed-line' | 'custom-svg';
  svgContent?: string;
  svgString?: string;
  strokeColor?: string;
  strokeWidth?: number;
  isWindow?: boolean;
}

export interface ToothpasteTube3DProps {
  decals?: CanvasDecal[];
  packageColor?: string;
  capColor?: string;
  materialType?: 'plastic_glossy' | 'matte' | 'metallic';
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  interactive?: boolean;
  cameraDistance?: number;
  showPlaceholder?: boolean;
}

export interface ToothpasteTube3DRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  getScreenshot: () => string | null;
  toggleAutoRotate: () => boolean;
}

export const ToothpasteTube3D = forwardRef<ToothpasteTube3DRef, ToothpasteTube3DProps>(({
  decals = [],
  packageColor = '#ffffff',
  capColor = '#ffffff',
  materialType = 'plastic_glossy',
  autoRotate = false,
  autoRotateSpeed = 1.4,
  className = '',
  style = {},
  interactive = true,
  cameraDistance = 4.3,
  showPlaceholder = true,
  onCanvasReady,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const tubeGroupRef = useRef<THREE.Group | null>(null);
  const bodyTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const capMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const [isRotating, setIsRotating] = useState(autoRotate);
  const isRotatingRef = useRef(autoRotate);
  const autoRotateSpeedRef = useRef(autoRotateSpeed);

  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsRotating(autoRotate);
    isRotatingRef.current = autoRotate;
    requestRenderRef.current?.();
  }, [autoRotate]);

  useEffect(() => {
    isRotatingRef.current = isRotating;
    requestRenderRef.current?.();
  }, [isRotating]);

  useEffect(() => {
    autoRotateSpeedRef.current = autoRotateSpeed;
    requestRenderRef.current?.();
  }, [autoRotateSpeed]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = interactive;
    }
  }, [interactive]);

  // Material finish updates
  useEffect(() => {
    if (bodyMaterialRef.current) {
      if (materialType === 'matte') {
        bodyMaterialRef.current.roughness = 0.55;
        bodyMaterialRef.current.metalness = 0.02;
      } else if (materialType === 'metallic') {
        bodyMaterialRef.current.roughness = 0.22;
        bodyMaterialRef.current.metalness = 0.65;
      } else {
        // Plastic glossy (Default - matching Model 602620)
        bodyMaterialRef.current.roughness = 0.16;
        bodyMaterialRef.current.metalness = 0.03;
      }
      bodyMaterialRef.current.needsUpdate = true;
      requestRenderRef.current?.();
    }
  }, [materialType]);

  // Cap color updates
  useEffect(() => {
    if (capMaterialRef.current) {
      capMaterialRef.current.color.set(capColor || '#ffffff');
      capMaterialRef.current.needsUpdate = true;
      requestRenderRef.current?.();
    }
  }, [capColor]);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (cameraRef.current) {
        cameraRef.current.position.multiplyScalar(0.85);
        controlsRef.current?.update();
        requestRenderRef.current?.();
      }
    },
    zoomOut: () => {
      if (cameraRef.current) {
        cameraRef.current.position.multiplyScalar(1.15);
        controlsRef.current?.update();
        requestRenderRef.current?.();
      }
    },
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 0.25, cameraDistance || 4.3);
        controlsRef.current.target.set(0, 0.05, 0);
        controlsRef.current.update();
        requestRenderRef.current?.();
      }
    },
    getScreenshot: () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      return rendererRef.current.domElement.toDataURL('image/png');
    },
    toggleAutoRotate: () => {
      const next = !isRotatingRef.current;
      setIsRotating(next);
      isRotatingRef.current = next;
      requestRenderRef.current?.();
      return next;
    }
  }));

  // Canvas texture generation (1020 x 1509 px - high-res 6x scale of 170 x 503)
  const drawTubeTexture = useCallback(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = 1020;
      offscreenCanvasRef.current.height = 1509;
    }

    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const isTransparent = packageColor === 'transparent';
    if (!isTransparent) {
      ctx.fillStyle = packageColor || '#ffffff';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 0, w, h);
    }

    const hasDecals = decals && decals.length > 0;
    if (!hasDecals && showPlaceholder) {
      // 1. Subtle watermark diamond grid lines matching Image 2
      ctx.save();
      ctx.strokeStyle = 'rgba(160, 174, 192, 0.22)';
      ctx.lineWidth = 1.8;

      const step = 85;
      for (let x = -h; x < w + h; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + h, 0);
        ctx.stroke();
      }

      // Repeated subtle watermark text "Pacdora" matching Image 2
      ctx.font = 'italic 500 20px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.26)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let gy = 60; gy < h; gy += 140) {
        for (let gx = 45; gx < w; gx += 170) {
          ctx.fillText('Pacdora', gx, gy);
        }
      }

      // 2. Centered front-panel guide matching Screenshot 1 & 2:
      // In 360 wrap texture (w x h), Front panel is u: 0 to 0.5, centered at w * 0.25
      const centerX = w * 0.25;
      const centerY = h * 0.51;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Heading
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 36px "Inter", -apple-system, sans-serif';
      ctx.fillText('Upload your images', centerX, centerY - 32);

      // Subtitle
      ctx.fillStyle = '#64748b';
      ctx.font = '500 24px "Inter", -apple-system, sans-serif';
      ctx.fillText('or create with AI', centerX, centerY + 8);

      // Aspect tag
      ctx.fillStyle = '#334155';
      ctx.font = '600 22px "Inter", monospace';
      ctx.fillText('170 × 503 px', centerX, centerY + 46);

      ctx.restore();
    }

    // Render placed decals
    const visibleDecals = decals.filter(d => !d.isWindow);
    if (visibleDecals.length > 0) {
      visibleDecals.forEach((decal) => {
        const isPixelCoord = Boolean(
          (decal.width && decal.width > 20) ||
          (decal.height && decal.height > 20) ||
          (decal.x && decal.x > 15) ||
          (decal.y && decal.y > 15)
        );

        let x = 0;
        let y = 0;
        let dw = 0;
        let dh = 0;
        let cx = 0;
        let cy = 0;

        if (isPixelCoord) {
          // Pixel coords from 170 x 503 canvas mapped onto front panel (u: 0 to 0.5)
          const scaleX = (w * 0.5) / 170;
          const scaleY = h / 503;
          dw = (decal.width || 60) * scaleX;
          dh = (decal.height || 60) * scaleY;
          x = (decal.x || 0) * scaleX;
          y = (decal.y || 0) * scaleY;
          cx = x + dw / 2;
          cy = y + dh / 2;
        } else {
          // Physical inch coordinates from DielineSVG (90mm x 133mm flat label)
          const labelL = 90 / 25.4;  // ~3.543 in
          const labelW = 133 / 25.4; // ~5.236 in

          const normCx = (decal.x ?? 0) / labelL;
          const normCy = (decal.y ?? 0) / labelW;
          const normW = (decal.width ?? 1) / labelL;
          const normH = (decal.height ?? 1) / labelW;

          cx = normCx * w;
          cy = normCy * h;
          dw = normW * w;
          dh = normH * h;
          x = cx - dw / 2;
          y = cy - dh / 2;
        }

        ctx.save();

        if (decal.rotation) {
          ctx.translate(cx, cy);
          ctx.rotate((decal.rotation * Math.PI) / 180);
          ctx.translate(-cx, -cy);
        }

        if (decal.type === 'image' && decal.url) {
          const cachedImg = imageCacheRef.current.get(decal.url);
          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            ctx.drawImage(cachedImg, x, y, dw, dh);
          } else if (!cachedImg) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              imageCacheRef.current.set(decal.url!, img);
              drawTubeTexture();
              requestRenderRef.current?.();
            };
            img.src = decal.url;
            imageCacheRef.current.set(decal.url, img);
          }
        } else if (decal.type === 'text' || decal.content) {
          const textContent = decal.text || decal.content || '';
          const textColor = decal.color || decal.fillColor || '#000000';
          const fontSz = isPixelCoord
            ? (decal.fontSize || 24) * 3
            : Math.max(22, (decal.fontSize || 0.4) * (h / (133 / 25.4)));
          const fWeight = decal.bold ? 'bold' : (decal.fontWeight || 'normal');
          const fStyle = decal.italic ? 'italic' : (decal.fontStyle || 'normal');

          ctx.font = `${fStyle} ${fWeight} ${Math.round(fontSz)}px "${decal.fontFamily || 'Inter'}", sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = (decal.textAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(textContent, cx, cy);
        } else if (decal.type === 'shape') {
          ctx.fillStyle = decal.fillColor || '#3b82f6';
          if (decal.strokeColor) {
            ctx.strokeStyle = decal.strokeColor;
            ctx.lineWidth = (decal.strokeWidth || 1) * 3;
          }
          if (decal.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(dw, dh) / 2, 0, Math.PI * 2);
            ctx.fill();
            if (decal.strokeColor) ctx.stroke();
          } else if (decal.shapeType === 'rounded-rectangle') {
            const radius = 16;
            ctx.beginPath();
            ctx.roundRect(x, y, dw, dh, radius);
            ctx.fill();
            if (decal.strokeColor) ctx.stroke();
          } else {
            ctx.fillRect(x, y, dw, dh);
            if (decal.strokeColor) ctx.strokeRect(x, y, dw, dh);
          }
        }

        ctx.restore();
      });
    }

    if (bodyTextureRef.current) {
      bodyTextureRef.current.needsUpdate = true;
    }

    onCanvasReady?.(canvas);
  }, [decals, packageColor, showPlaceholder, onCanvasReady]);

  useEffect(() => {
    drawTubeTexture();
    requestRenderRef.current?.();
  }, [drawTubeTexture]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera (Slender vertical framing matching Image 2)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 4.3);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = interactive;
    controls.minDistance = 2.0;
    controls.maxDistance = 8.0;
    controls.target.set(0, 0.05, 0);
    controlsRef.current = controls;

    // 4. Studio Lighting Rig (Glossy highlights along left/right shoulders)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.84);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(3, 4, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.8);
    fillLight.position.set(-3.5, 1.5, 2.5);
    scene.add(fillLight);

    const backRimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backRimLight.position.set(0, 3.5, -3.5);
    scene.add(backRimLight);

    const bottomReflect = new THREE.DirectionalLight(0xffffff, 0.45);
    bottomReflect.position.set(0, -3, 2);
    scene.add(bottomReflect);

    // 5. Ground Contact Shadow underneath cap base at y = -1.43
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 110);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.20)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.04)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.44;
    scene.add(shadowMesh);

    // 6. Toothpaste Tube Group (standing upright on cap base)
    const tubeGroup = new THREE.Group();
    tubeGroup.position.y = 0;
    scene.add(tubeGroup);
    tubeGroupRef.current = tubeGroup;

    // Body Texture & Material
    drawTubeTexture();
    const bodyTex = new THREE.CanvasTexture(offscreenCanvasRef.current!);
    bodyTex.colorSpace = THREE.SRGBColorSpace;
    bodyTex.wrapS = THREE.ClampToEdgeWrapping;
    bodyTex.wrapT = THREE.ClampToEdgeWrapping;
    bodyTex.generateMipmaps = false;
    bodyTex.minFilter = THREE.LinearFilter;
    bodyTex.magFilter = THREE.LinearFilter;
    bodyTextureRef.current = bodyTex;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      map: bodyTex,
      roughness: 0.16,
      metalness: 0.02,
      side: THREE.FrontSide,
    });
    bodyMaterialRef.current = bodyMaterial;

    // 7. Lofted Squeeze Tube Body Geometry (Model 602620: 75 ml upright tube)
    // Standing upright matching user's Image 2:
    // Cap at bottom: y = -1.41 to y = -0.92
    // Shoulder neck: y = -0.92 to y = -0.78
    // Body morphs from round base (y = -0.78) to wide flat crimp (y = 1.32)
    // Crimp top bar: y = 1.32 to y = 1.50
    const rings = 60;
    const segments = 64;
    const bodyPositions: number[] = [];
    const bodyUvs: number[] = [];
    const bodyIndices: number[] = [];

    const yStart = -0.78;
    const yEnd = 1.32;
    const totalH = yEnd - yStart; // 2.10 slender height!
    const baseR = 0.215; // 75ml tube base radius

    for (let r = 0; r <= rings; r++) {
      const t = r / rings; // 0 (bottom near shoulder) to 1 (top crimp)
      const y = yStart + t * totalH;

      // Morphing profile:
      // Cylindrical at bottom, expanding horizontally (xRadius) and flattening (zRadius) towards crimp
      const flattenFactor = Math.pow(Math.max(0, (t - 0.12) / 0.88), 1.25);
      const xRadius = baseR * (1.0 + 0.82 * Math.pow(t, 1.15));
      const zRadius = Math.max(0.015, baseR * (1.0 - 0.93 * flattenFactor));

      for (let s = 0; s <= segments; s++) {
        const u = s / segments;
        // u = 0.25 is front center (facing camera at +z)
        // u increases -> x goes left to right (no mirroring!)
        const angle = (u - 0.25) * Math.PI * 2;

        const x = xRadius * Math.sin(angle);
        const z = zRadius * Math.cos(angle);

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

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    tubeGroup.add(bodyMesh);

    // 8. Top Heat-Sealed Crimp Seal Bar (with fine vertical ridges matching Image 2)
    const crimpH = 0.18;
    const crimpW = baseR * 1.82 * 2; // ~0.783 width
    const crimpD = 0.024;
    const crimpGeo = new THREE.BoxGeometry(crimpW, crimpH, crimpD, 48, 4, 1);

    const cPos = crimpGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const cz = cPos.getZ(i);
      if (Math.abs(cz) > 0.004) {
        const cx = cPos.getX(i);
        const rib = Math.sin(cx * 150) * 0.0028;
        cPos.setZ(i, cz + rib);
      }
    }
    crimpGeo.computeVertexNormals();

    const crimpMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.22,
      metalness: 0.03,
    });
    const crimpMesh = new THREE.Mesh(crimpGeo, crimpMat);
    crimpMesh.position.y = yEnd + crimpH / 2 - 0.005;
    crimpMesh.castShadow = true;
    tubeGroup.add(crimpMesh);

    // 9. Conical Shoulder Neck Transition (above the cap)
    const shoulderGeo = new THREE.CylinderGeometry(baseR, baseR * 0.68, 0.14, 48);
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.16,
      metalness: 0.02,
    });
    const shoulderMesh = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderMesh.position.y = yStart - 0.07;
    tubeGroup.add(shoulderMesh);

    // 10. Ribbed White Screw Cap Assembly (standing upright on table matching Image 2)
    const capGroup = new THREE.Group();
    const capH = 0.48;
    const capRTop = baseR * 0.68; // ~0.146
    const capRBot = baseR * 0.72; // ~0.155
    capGroup.position.y = yStart - 0.14; // Base of shoulder

    // Ribbed fluted cylinder for the cap (28 sharp vertical ribs)
    const capGeo = new THREE.CylinderGeometry(capRTop, capRBot, capH, 64, 8);
    const capPos = capGeo.attributes.position;
    for (let i = 0; i < capPos.count; i++) {
      const cy = capPos.getY(i);
      if (Math.abs(cy) < capH * 0.46) {
        const cx = capPos.getX(i);
        const cz = capPos.getZ(i);
        const angle = Math.atan2(cz, cx);
        const flute = Math.sin(angle * 28) * 0.0065;
        const currentR = Math.sqrt(cx * cx + cz * cz);
        const newR = currentR + flute;
        capPos.setX(i, Math.cos(angle) * newR);
        capPos.setZ(i, Math.sin(angle) * newR);
      }
    }
    capGeo.computeVertexNormals();

    const capMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(capColor || '#ffffff'),
      roughness: 0.28,
      metalness: 0.03,
    });
    capMaterialRef.current = capMaterial;

    const capMesh = new THREE.Mesh(capGeo, capMaterial);
    capMesh.position.y = -capH / 2;
    capMesh.castShadow = true;
    capGroup.add(capMesh);

    // Cap bottom rim base sitting flat on ground
    const capBaseGeo = new THREE.CylinderGeometry(capRBot, capRBot * 0.98, 0.03, 48);
    const capBase = new THREE.Mesh(capBaseGeo, capMaterial);
    capBase.position.y = -capH - 0.015;
    capBase.castShadow = true;
    capGroup.add(capBase);

    tubeGroup.add(capGroup);

    // Render loop
    const renderScene = () => {
      renderer.render(scene, camera);
    };
    requestRenderRef.current = renderScene;

    const animate = () => {
      rafIdRef.current = requestAnimationFrame(animate);
      if (document.hidden) return;

      if (isRotatingRef.current && tubeGroupRef.current) {
        tubeGroupRef.current.rotation.y += 0.006 * autoRotateSpeedRef.current;
      }

      controls.update();
      renderScene();
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
      renderScene();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      bodyGeo.dispose();
      crimpGeo.dispose();
      shoulderGeo.dispose();
      capGeo.dispose();
      capBaseGeo.dispose();
      shadowGeo.dispose();
      bodyMaterial.dispose();
      crimpMat.dispose();
      shoulderMat.dispose();
      capMaterial.dispose();
      shadowMat.dispose();
      bodyTex.dispose();
      shadowTex.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cameraDistance, interactive, drawTubeTexture]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none ${className}`}
      style={{
        minHeight: '200px',
        touchAction: 'none',
        ...style,
      }}
    />
  );
});

ToothpasteTube3D.displayName = 'ToothpasteTube3D';
export default ToothpasteTube3D;
