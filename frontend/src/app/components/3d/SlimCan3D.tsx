/**
 * SlimCan3D.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Ultra-Realistic Pacdora-Grade 355 mL (12 oz Slim) Aluminum Beverage Can.
 * Model ID: 550035
 * - Precise 355 mL slim can geometry: slender 57.4 mm diameter, 156 mm height
 * - Authentic 202 double-seam rolled rim, countersink bead, recessed center panel
 * - High-detail stay-on pull tab with finger loop, center rivet, and stamped score line
 * - PMREM studio environment with softbox specular highlights (NO pitch-black shading)
 * - 661 × 548 px retina texture canvas with diamond watermark and front-facing decals
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface CanvasDecal {
  id: string | number;
  type?: 'image' | 'text' | 'shape';
  url?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  text?: string;
  content?: string;
  color?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  shapeType?: string;
  isWindow?: boolean;
  bold?: boolean;
  italic?: boolean;
}

export interface SlimCan3DProps {
  decals?: CanvasDecal[];
  packageColor?: string;
  materialType?: 'metal_matt' | 'metal_gloss';
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  showPlaceholder?: boolean;
  labelWidthInches?: number;
  labelHeightInches?: number;
  glueFlapWidth?: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export interface SlimCan3DRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  getScreenshot: () => string | null;
  toggleAutoRotate: () => boolean;
}

// Procedural seamless vertical brushed aluminum texture (cylindrical anisotropic grain)
function createBrushedMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;

  // Vertical streaks: random column offsets that run down the cylinder
  const columns = new Float32Array(512);
  for (let x = 0; x < 512; x++) {
    columns[x] = (Math.random() - 0.5) * 46;
  }

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      const grain = (Math.random() - 0.5) * 12;
      const val = Math.min(255, Math.max(0, 128 + columns[x] + grain));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 2);
  return texture;
}

// Procedural concentric radial brushed grain for stamped can lid
function createRadialBrushedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  for (let r = 2; r < 254; r += 2) {
    const alpha = 0.04 + Math.random() * 0.08;
    ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 1.0 + Math.random();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export const SlimCan3D = forwardRef<SlimCan3DRef, SlimCan3DProps>(({
  decals = [],
  packageColor = '#ffffff',
  materialType = 'metal_matt',
  autoRotate = false,
  autoRotateSpeed = 1.0,
  className = '',
  style = {},
  interactive = true,
  showPlaceholder = true,
  labelWidthInches = 175 / 25.4,
  labelHeightInches = 145 / 25.4,
  glueFlapWidth = 0.25,
  onCanvasReady,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const canGroupRef = useRef<THREE.Group | null>(null);
  const labelTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const metalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lidMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const labelMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

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

  // Update material finish
  useEffect(() => {
    const isGloss = materialType === 'metal_gloss';
    if (metalMaterialRef.current) {
      metalMaterialRef.current.roughness = isGloss ? 0.12 : 0.25;
      metalMaterialRef.current.metalness = isGloss ? 0.98 : 0.95;
      metalMaterialRef.current.needsUpdate = true;
    }
    if (labelMaterialRef.current) {
      labelMaterialRef.current.roughness = isGloss ? 0.12 : 0.25;
      labelMaterialRef.current.metalness = isGloss ? 0.96 : 0.92;
      labelMaterialRef.current.needsUpdate = true;
    }
    requestRenderRef.current?.();
  }, [materialType]);

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
        cameraRef.current.position.set(0.70, 1.25, 5.25);
        controlsRef.current.target.set(0, -0.05, 0);
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

  // Render 661 × 548 px Aspect Texture (Retina 1322 × 1096 px)
  const renderCanvasNow = useCallback(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = 1322;
      offscreenCanvasRef.current.height = 1096;
    }

    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const isCustomTint = Boolean(
      packageColor &&
      packageColor !== '#ffffff' &&
      packageColor !== 'transparent' &&
      packageColor.toLowerCase() !== '#fff'
    );

    if (isCustomTint) {
      ctx.fillStyle = packageColor;
      ctx.fillRect(0, 0, w, h);
    } else {
      // For aluminum cans, default is transparent so raw brushed aluminum shines through!
      ctx.clearRect(0, 0, w, h);
    }

    const hasDecals = decals && decals.length > 0;
    if (!hasDecals && showPlaceholder) {
      // 1. Subtle watermark diamond grid lines matching Pacdora (Screenshot 3)
      ctx.save();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.22)';
      ctx.lineWidth = 1.6;

      const step = 88;
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

      // Repeated subtle watermark text "Pacdora"
      ctx.font = 'italic 500 22px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(100, 116, 139, 0.20)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let gy = 70; gy < h; gy += 150) {
        for (let gx = 60; gx < w; gx += 190) {
          ctx.fillText('Pacdora', gx, gy);
        }
      }

      // 2. Centered front-panel guide matching Screenshot 3:
      // In 360 wrap texture (w x h), Front panel is centered at w * 0.5 when rotated Math.PI
      const centerX = w * 0.50;
      const centerY = h * 0.50;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Heading
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 44px "Inter", -apple-system, sans-serif';
      ctx.fillText('Upload your image', centerX, centerY - 36);

      // Subtitle
      ctx.fillStyle = '#475569';
      ctx.font = '500 28px "Inter", -apple-system, sans-serif';
      ctx.fillText('or create with AI', centerX, centerY + 8);

      // Aspect tag (matching 661 × 548 px in Screenshot 3!)
      ctx.fillStyle = '#334155';
      ctx.font = '600 26px "Inter", monospace';
      ctx.fillText('661 × 548 px', centerX, centerY + 52);

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
          // Front panel (180 deg) corresponds to u: 0.25 to 0.75 in texture
          const scaleX = (w * 0.5) / 661;
          const scaleY = h / 548;
          dw = (decal.width || 80) * scaleX;
          dh = (decal.height || 80) * scaleY;
          x = (w * 0.25) + (decal.x || 0) * scaleX;
          y = (decal.y || 0) * scaleY;
          cx = x + dw / 2;
          cy = y + dh / 2;
        } else {
          // Physical inch coordinates from DielineSVG (175mm x 145mm flat label)
          const labelL = 175 / 25.4;  // ~6.890 in
          const labelW = 145 / 25.4;  // ~5.709 in

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
              renderCanvasNow();
              requestRenderRef.current?.();
            };
            img.src = decal.url;
            imageCacheRef.current.set(decal.url, img);
          }
        } else if (decal.type === 'text' || decal.content) {
          const textContent = decal.text || decal.content || '';
          const textColor = decal.color || decal.fillColor || '#000000';
          const fontSz = isPixelCoord
            ? (decal.fontSize || 24) * 2
            : Math.max(22, (decal.fontSize || 0.4) * (h / (145 / 25.4)));
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
            ctx.lineWidth = (decal.strokeWidth || 1) * 2;
          }
          if (decal.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(dw, dh) / 2, 0, Math.PI * 2);
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

    if (labelTextureRef.current) {
      labelTextureRef.current.needsUpdate = true;
      requestRenderRef.current?.();
    }
  }, [decals, packageColor, showPlaceholder, labelWidthInches, labelHeightInches, glueFlapWidth]);

  useEffect(() => {
    renderCanvasNow();
    requestRenderRef.current?.();
  }, [renderCanvasNow]);

  // Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    // Authentic Pacdora perspective matching Image 3 with clean vertical framing
    camera.position.set(0.40, 0.65, 5.0);
    cameraRef.current = camera;

    // 2. WebGL Renderer with High-DPI & Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    if (onCanvasReady) {
      onCanvasReady(renderer.domElement);
    }

    // 3. Orbit Controls (Allow full top-down inspection matching Screenshot 2)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.8;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
    controls.minPolarAngle = 0.02; // Allows looking straight down at lid
    controls.target.set(0, 0.05, 0);
    controls.enabled = interactive;
    controlsRef.current = controls;

    // 4. Studio Environment for Natural Satin Specular Highlights & High-End Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();

    // Studio backdrop gradient dome
    const envBgGeo = new THREE.SphereGeometry(20, 32, 16);
    const envBgCanvas = document.createElement('canvas');
    envBgCanvas.width = 256;
    envBgCanvas.height = 256;
    const envBgCtx = envBgCanvas.getContext('2d');
    if (envBgCtx) {
      const grad = envBgCtx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#e8eef6');   // soft sky light
      grad.addColorStop(0.5, '#848f9e'); // neutral horizon
      grad.addColorStop(1, '#535b67');   // floor tone
      envBgCtx.fillStyle = grad;
      envBgCtx.fillRect(0, 0, 256, 256);
    }
    const envBgTexture = new THREE.CanvasTexture(envBgCanvas);
    const envBgMat = new THREE.MeshBasicMaterial({ map: envBgTexture, side: THREE.BackSide });
    envScene.add(new THREE.Mesh(envBgGeo, envBgMat));

    // Left vertical strip softbox (creates the left specular vertical band seen in Image 3)
    const leftSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    leftSoftbox.position.set(-5.0, 1.0, 3.2);
    leftSoftbox.lookAt(0, 0, 0);
    envScene.add(leftSoftbox);

    // Right primary vertical strip softbox (creates the main specular bar on the right in Image 3)
    const rightSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    rightSoftbox.position.set(4.8, 1.2, 3.5);
    rightSoftbox.lookAt(0, 0, 0);
    envScene.add(rightSoftbox);

    // Top ceiling softbox (soft illumination for rolled rim and pull tab in Image 2)
    const topSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({ color: 0xf4f7fa, side: THREE.DoubleSide })
    );
    topSoftbox.position.set(0, 8.0, 1.5);
    topSoftbox.lookAt(0, 1.2, 0);
    envScene.add(topSoftbox);

    const envMap = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envMap;

    // Studio Lights - Tuned for realistic metallic reflection without blowing out highlights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35); // Soft fill ambient
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85); // Main key light
    keyLight.position.set(3.0, 4.0, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8edf4, 0.40); // Left fill
    fillLight.position.set(-3.5, 2.0, 3.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.65); // Back edge rim
    rimLight.position.set(0, 3.5, -4.0);
    scene.add(rimLight);

    const lidGlint = new THREE.DirectionalLight(0xffffff, 0.38); // Soft angled lid glint
    lidGlint.position.set(-1.5, 4.5, 2.0);
    scene.add(lidGlint);

    const bottomBounce = new THREE.DirectionalLight(0xd4dce6, 0.25); // Subtle ground bounce
    bottomBounce.position.set(0, -3.0, 1.5);
    scene.add(bottomBounce);

    // Soft Contact Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 14, 128, 128, 115);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.32)');
      grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.12)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.02)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.365;
    scene.add(shadowMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // PACDORA 3D 355 ML SLIM ALUMINUM BEVERAGE CAN
    // ─────────────────────────────────────────────────────────────────────────
    const canGroup = new THREE.Group();
    canGroupRef.current = canGroup;
    scene.add(canGroup);
    canGroup.position.y = 0.0;

    // Procedural brushed textures
    const brushedTexture = createBrushedMetalTexture();
    const radialBrushedTexture = createRadialBrushedTexture();

    // 1. Brushed Aluminum Metal Material (Satin Silver Aluminum)
    const isGloss = materialType === 'metal_gloss';
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd0d5dc), // Authentic aluminum alloy
      roughness: isGloss ? 0.12 : 0.25,
      metalness: isGloss ? 0.98 : 0.95,
      bumpMap: brushedTexture,
      bumpScale: 0.003,
      side: THREE.FrontSide,
    });
    metalMaterialRef.current = metalMaterial;

    // 2. Can Lid & Rim Aluminum Material (Radial grain)
    const lidMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xcbd1d8),
      roughness: 0.22,
      metalness: 0.94,
      bumpMap: radialBrushedTexture,
      bumpScale: 0.002,
      side: THREE.DoubleSide,
    });
    lidMaterialRef.current = lidMaterial;

    // 3. Stamped Deboss Material for Beads and Score Line
    const debossMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x9aa4b2),
      roughness: 0.38,
      metalness: 0.88,
      side: THREE.DoubleSide,
    });

    // 4. Shiny Aluminum Tab Material
    const tabMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xdce2ec),
      roughness: 0.16,
      metalness: 0.94,
      side: THREE.DoubleSide,
    });

    // 5. Label Material with Canvas Texture (Metallic so brushed aluminum shows through!)
    renderCanvasNow();
    const labelTexture = new THREE.CanvasTexture(offscreenCanvasRef.current!);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    labelTexture.wrapS = THREE.RepeatWrapping;
    labelTexture.wrapT = THREE.ClampToEdgeWrapping;
    labelTexture.generateMipmaps = false;
    labelTexture.minFilter = THREE.LinearFilter;
    labelTexture.magFilter = THREE.LinearFilter;
    labelTextureRef.current = labelTexture;

    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: isGloss ? 0.12 : 0.25,
      metalness: isGloss ? 0.96 : 0.92,
      bumpMap: brushedTexture,
      bumpScale: 0.003,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: true,
    });
    labelMaterialRef.current = labelMaterial;

    // ─────────────────────────────────────────────────────────────────────────
    // Authentic Lathe Profile for 355 mL Slim Can (Matching Screenshot 3)
    // Slender 57.4 mm diameter (radius 0.50), 156 mm physical height
    // ─────────────────────────────────────────────────────────────────────────
    const points: THREE.Vector2[] = [];
    const baseR = 0.50; // Body radius

    // 1. Recessed push-up dome base (concave internal dome)
    points.push(new THREE.Vector2(0.001, -1.24));
    points.push(new THREE.Vector2(0.15, -1.25));
    points.push(new THREE.Vector2(0.30, -1.28));
    points.push(new THREE.Vector2(0.38, -1.32));

    // 2. Chime contact foot ring (bottom resting ring)
    points.push(new THREE.Vector2(0.435, -1.359));
    points.push(new THREE.Vector2(0.450, -1.359));
    points.push(new THREE.Vector2(0.465, -1.345));

    // 3. Lower chime taper into straight cylindrical body (short realistic taper)
    points.push(new THREE.Vector2(0.485, -1.28));
    points.push(new THREE.Vector2(0.495, -1.22));
    points.push(new THREE.Vector2(baseR, -1.18)); // Start of straight cylinder

    // 4. Main cylindrical body (straight vertical wall: -1.18 to +1.10)
    points.push(new THREE.Vector2(baseR, 1.10)); // End of cylinder

    // 5. Shoulder transition & elegant conical neck taper (matching 202 lid neck)
    points.push(new THREE.Vector2(0.495, 1.15));
    points.push(new THREE.Vector2(0.478, 1.22));
    points.push(new THREE.Vector2(0.455, 1.27));
    points.push(new THREE.Vector2(0.448, 1.29)); // Neck groove base

    // 6. Double-seam 202 rim (the rolled aluminum lip)
    points.push(new THREE.Vector2(0.456, 1.31)); // Rim outward flare
    points.push(new THREE.Vector2(0.462, 1.34)); // Top rim outer apex
    points.push(new THREE.Vector2(0.464, 1.36)); // Outer rim crest
    points.push(new THREE.Vector2(0.454, 1.36)); // Inner rim crest
    points.push(new THREE.Vector2(0.444, 1.34)); // Inner rim turn
    points.push(new THREE.Vector2(0.435, 1.30)); // Inner seam wall descending

    // 7. Countersink groove (U-channel bead around lid perimeter)
    points.push(new THREE.Vector2(0.424, 1.255)); // Bottom of countersink wall
    points.push(new THREE.Vector2(0.414, 1.245)); // Bottom of countersink trough
    points.push(new THREE.Vector2(0.402, 1.265)); // Rising onto lid center panel

    // 8. Stamped center lid panel
    points.push(new THREE.Vector2(0.385, 1.275));
    points.push(new THREE.Vector2(0.20, 1.278));
    points.push(new THREE.Vector2(0.001, 1.28));

    // Lathe Geometry with 72 smooth circumference segments
    const canBodyGeo = new THREE.LatheGeometry(points, 72);
    canBodyGeo.computeVertexNormals();

    const canBodyMesh = new THREE.Mesh(canBodyGeo, metalMaterial);
    canBodyMesh.castShadow = true;
    canBodyMesh.receiveShadow = true;
    canGroup.add(canBodyMesh);

    // Label Cylinder (Flush on the straight cylinder body: y = -1.18 to +1.10)
    const labelHeight = 2.28;
    const labelRadius = baseR + 0.0012;
    const labelGeo = new THREE.CylinderGeometry(
      labelRadius,
      labelRadius,
      labelHeight,
      72,
      1,
      true
    );
    // Align texture center facing camera (+Z)
    labelGeo.rotateY(Math.PI);
    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.y = -0.04;
    canGroup.add(labelMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // Detailed Aluminum Pull Tab & Lid Stamped Scoring (Matching Screenshot 4)
    // ─────────────────────────────────────────────────────────────────────────
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 1.281, 0);
    canGroup.add(lidGroup);

    // 1. Concentric stamped bead rings on lid panel
    const ringGeo = new THREE.RingGeometry(0.395, 0.406, 64);
    const ringMesh = new THREE.Mesh(ringGeo, debossMaterial);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.001;
    ringMesh.receiveShadow = true;
    lidGroup.add(ringMesh);

    const innerRingGeo = new THREE.RingGeometry(0.355, 0.366, 64);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, debossMaterial);
    innerRingMesh.rotation.x = -Math.PI / 2;
    innerRingMesh.position.y = 0.0012;
    innerRingMesh.receiveShadow = true;
    lidGroup.add(innerRingMesh);

    // 2. Curved Embossed Stiffening Swages (Double Horseshoe Beads matching Screenshot 4)
    // Left inner swage
    const leftSwageCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.08, 0.0025, 0.19),
      new THREE.Vector3(-0.16, 0.0025, 0.08),
      new THREE.Vector3(-0.16, 0.0025, -0.08),
      new THREE.Vector3(-0.08, 0.0025, -0.18)
    );
    const leftSwageGeo = new THREE.TubeGeometry(leftSwageCurve, 32, 0.006, 8, false);
    const leftSwageMesh = new THREE.Mesh(leftSwageGeo, lidMaterial);
    leftSwageMesh.castShadow = true;
    leftSwageMesh.receiveShadow = true;
    lidGroup.add(leftSwageMesh);

    // Left outer swage
    const leftOuterCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.10, 0.0022, 0.22),
      new THREE.Vector3(-0.19, 0.0022, 0.08),
      new THREE.Vector3(-0.19, 0.0022, -0.08),
      new THREE.Vector3(-0.10, 0.0022, -0.21)
    );
    const leftOuterGeo = new THREE.TubeGeometry(leftOuterCurve, 32, 0.0045, 8, false);
    const leftOuterMesh = new THREE.Mesh(leftOuterGeo, debossMaterial);
    leftOuterMesh.receiveShadow = true;
    lidGroup.add(leftOuterMesh);

    // Right inner swage
    const rightSwageCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.08, 0.0025, 0.19),
      new THREE.Vector3(0.16, 0.0025, 0.08),
      new THREE.Vector3(0.16, 0.0025, -0.08),
      new THREE.Vector3(0.08, 0.0025, -0.18)
    );
    const rightSwageGeo = new THREE.TubeGeometry(rightSwageCurve, 32, 0.006, 8, false);
    const rightSwageMesh = new THREE.Mesh(rightSwageGeo, lidMaterial);
    rightSwageMesh.castShadow = true;
    rightSwageMesh.receiveShadow = true;
    lidGroup.add(rightSwageMesh);

    // Right outer swage
    const rightOuterCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.10, 0.0022, 0.22),
      new THREE.Vector3(0.19, 0.0022, 0.08),
      new THREE.Vector3(0.19, 0.0022, -0.08),
      new THREE.Vector3(0.10, 0.0022, -0.21)
    );
    const rightOuterGeo = new THREE.TubeGeometry(rightOuterCurve, 32, 0.0045, 8, false);
    const rightOuterMesh = new THREE.Mesh(rightOuterGeo, debossMaterial);
    rightOuterMesh.receiveShadow = true;
    lidGroup.add(rightOuterMesh);

    // Bottom transverse debossed slot bead
    const bottomSlotCurve = new THREE.LineCurve3(
      new THREE.Vector3(-0.09, 0.002, -0.235),
      new THREE.Vector3(0.09, 0.002, -0.235)
    );
    const bottomSlotGeo = new THREE.TubeGeometry(bottomSlotCurve, 16, 0.0055, 8, false);
    const bottomSlotMesh = new THREE.Mesh(bottomSlotGeo, debossMaterial);
    bottomSlotMesh.receiveShadow = true;
    lidGroup.add(bottomSlotMesh);

    // 3. Stamped Opening Tear Score Line (where mouth opens)
    const scorePoints: THREE.Vector2[] = [];
    const scoreRx = 0.105;
    const scoreRy = 0.135;
    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const rMod = 1.0 + 0.16 * Math.cos(a);
      scorePoints.push(new THREE.Vector2(Math.sin(a) * scoreRx * rMod, Math.cos(a) * scoreRy + 0.13));
    }
    const scoreShape = new THREE.Shape(scorePoints);
    const scoreGeo = new THREE.ShapeGeometry(scoreShape);
    const scoreMesh = new THREE.Mesh(scoreGeo, debossMaterial);
    scoreMesh.rotation.x = -Math.PI / 2;
    scoreMesh.position.y = 0.002;
    scoreMesh.receiveShadow = true;
    lidGroup.add(scoreMesh);

    // Scored outline border line
    const scoreOutlinePts = scoreShape.getPoints();
    const scoreLineGeo = new THREE.BufferGeometry().setFromPoints(
      scoreOutlinePts.map(p => new THREE.Vector3(p.x, 0.003, -p.y))
    );
    const scoreLineMat = new THREE.LineBasicMaterial({ color: 0x6e7b8c, linewidth: 2 });
    const scoreLineMesh = new THREE.LineLoop(scoreLineGeo, scoreLineMat);
    lidGroup.add(scoreLineMesh);

    // 4. Center Mounting Rivet (stamped button in lid center)
    const rivetGeo = new THREE.CylinderGeometry(0.034, 0.038, 0.020, 32);
    const rivetMesh = new THREE.Mesh(rivetGeo, tabMaterial);
    rivetMesh.position.set(0, 0.010, 0.0);
    rivetMesh.castShadow = true;
    lidGroup.add(rivetMesh);

    // 5. Aluminum Stay-on Pull Tab (Matching Screenshot 4)
    const tabGroup = new THREE.Group();
    tabGroup.position.set(0, 0.012, 0.0);

    // Tab outer shape matching authentic beverage pull tab:
    // Lever arm with finger loop at bottom (-Z) and puncturing nose over scoreline (+Z)
    const tabShape = new THREE.Shape();
    tabShape.moveTo(0, -0.22);
    tabShape.quadraticCurveTo(0.082, -0.22, 0.088, -0.12);
    tabShape.quadraticCurveTo(0.090, -0.02, 0.076, 0.08);
    tabShape.quadraticCurveTo(0.065, 0.16, 0.044, 0.19);
    tabShape.quadraticCurveTo(0.02, 0.21, 0, 0.215); // Nose tip
    tabShape.quadraticCurveTo(-0.02, 0.21, -0.044, 0.19);
    tabShape.quadraticCurveTo(-0.065, 0.16, -0.076, 0.08);
    tabShape.quadraticCurveTo(-0.090, -0.02, -0.088, -0.12);
    tabShape.quadraticCurveTo(-0.082, -0.22, 0, -0.22);

    // Inner Finger Ring Cutout (Screenshot 4)
    const ringHole = new THREE.Path();
    ringHole.moveTo(0, -0.19);
    ringHole.quadraticCurveTo(-0.055, -0.19, -0.055, -0.12);
    ringHole.quadraticCurveTo(-0.055, -0.06, 0, -0.05);
    ringHole.quadraticCurveTo(0.055, -0.06, 0.055, -0.12);
    ringHole.quadraticCurveTo(0.055, -0.19, 0, -0.19);
    tabShape.holes.push(ringHole);

    // Center Rivet Mounting Slot
    const rivetSlot = new THREE.Path();
    rivetSlot.moveTo(0, -0.03);
    rivetSlot.quadraticCurveTo(-0.025, -0.03, -0.025, 0.02);
    rivetSlot.quadraticCurveTo(-0.025, 0.045, 0, 0.045);
    rivetSlot.quadraticCurveTo(0.025, 0.045, 0.025, 0.02);
    rivetSlot.quadraticCurveTo(0.025, -0.03, 0, -0.03);
    tabShape.holes.push(rivetSlot);

    const tabExtrudeSettings = {
      depth: 0.016,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.0045,
      bevelThickness: 0.005,
    };
    const tabGeo = new THREE.ExtrudeGeometry(tabShape, tabExtrudeSettings);
    tabGeo.computeVertexNormals();

    const tabMesh = new THREE.Mesh(tabGeo, tabMaterial);
    tabMesh.rotation.x = -Math.PI / 2;
    tabMesh.castShadow = true;
    tabGroup.add(tabMesh);
    lidGroup.add(tabGroup);

    // Render loop
    const renderScene = () => {
      renderer.render(scene, camera);
    };
    requestRenderRef.current = renderScene;

    const animate = () => {
      rafIdRef.current = requestAnimationFrame(animate);
      if (document.hidden) return;

      if (isRotatingRef.current && canGroupRef.current) {
        canGroupRef.current.rotation.y += 0.006 * autoRotateSpeedRef.current;
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
      pmremGenerator.dispose();
      envMap.dispose();
      canBodyGeo.dispose();
      labelGeo.dispose();
      ringGeo.dispose();
      innerRingGeo.dispose();
      leftSwageGeo.dispose();
      leftOuterGeo.dispose();
      rightSwageGeo.dispose();
      rightOuterGeo.dispose();
      bottomSlotGeo.dispose();
      scoreGeo.dispose();
      scoreLineGeo.dispose();
      rivetGeo.dispose();
      tabGeo.dispose();
      shadowGeo.dispose();
      metalMaterial.dispose();
      lidMaterial.dispose();
      tabMaterial.dispose();
      debossMaterial.dispose();
      labelMaterial.dispose();
      scoreLineMat.dispose();
      shadowMat.dispose();
      labelTexture.dispose();
      shadowTexture.dispose();
      brushedTexture.dispose();
      radialBrushedTexture.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, renderCanvasNow]);

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

SlimCan3D.displayName = 'SlimCan3D';
export default SlimCan3D;
