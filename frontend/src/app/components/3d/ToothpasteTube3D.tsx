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
  showWatermark?: boolean;
}

export interface ToothpasteTube3DRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  getScreenshot: () => string | null;
  toggleAutoRotate: () => boolean;
}

// Procedural studio environment map for photorealistic softbox reflections
function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envCanvas = document.createElement('canvas');
  envCanvas.width = 1024;
  envCanvas.height = 512;
  const ctx = envCanvas.getContext('2d')!;

  // Neutral studio background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
  bgGrad.addColorStop(0, '#717d8e');
  bgGrad.addColorStop(0.5, '#a8b2c0');
  bgGrad.addColorStop(1, '#555f6e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Left studio strip softbox (gentle specular sheen, non-glaring)
  const leftSoftbox = ctx.createLinearGradient(160, 0, 310, 0);
  leftSoftbox.addColorStop(0, 'rgba(255, 255, 255, 0)');
  leftSoftbox.addColorStop(0.45, 'rgba(255, 255, 255, 0.30)');
  leftSoftbox.addColorStop(0.55, 'rgba(255, 255, 255, 0.30)');
  leftSoftbox.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = leftSoftbox;
  ctx.fillRect(160, 40, 150, 440);

  // Right edge rim softbox
  const rightSoftbox = ctx.createLinearGradient(720, 0, 860, 0);
  rightSoftbox.addColorStop(0, 'rgba(255, 255, 255, 0)');
  rightSoftbox.addColorStop(0.5, 'rgba(255, 255, 255, 0.20)');
  rightSoftbox.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = rightSoftbox;
  ctx.fillRect(720, 60, 140, 400);

  // Overhead softbox for top seal & shoulder sheen
  const topSoftbox = ctx.createRadialGradient(512, 110, 10, 512, 110, 240);
  topSoftbox.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  topSoftbox.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
  topSoftbox.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = topSoftbox;
  ctx.fillRect(250, 0, 524, 240);

  const envTex = new THREE.CanvasTexture(envCanvas);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  const envTarget = pmremGenerator.fromEquirectangular(envTex);

  envTex.dispose();
  pmremGenerator.dispose();

  return envTarget;
}

// Procedural texture for the corrugated heat-sealed crimp band
function createCrimpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eaedf2';
  ctx.fillRect(0, 0, 512, 128);

  // Fine vertical corrugated seal teeth
  const numTeeth = 52;
  const toothW = 512 / numTeeth;
  for (let i = 0; i < numTeeth; i++) {
    const rx = i * toothW;
    const grad = ctx.createLinearGradient(rx, 0, rx + toothW, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.14)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.65)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.65)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(rx, 0, toothW, 128);
  }

  // Ultrasonic sealer indentation crease line near bottom of crimp band
  ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
  ctx.fillRect(0, 102, 512, 6);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillRect(0, 108, 512, 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
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
  cameraDistance = 4.2,
  showPlaceholder = true,
  showWatermark,
  onCanvasReady,
}, ref) => {
  const [authLoggedIn, setAuthLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('isLoggedIn') === 'true';
    return false;
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthLoggedIn(typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true');
    };
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const effectiveShowWatermark = showWatermark !== undefined ? showWatermark : !authLoggedIn;
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const tubeGroupRef = useRef<THREE.Group | null>(null);
  const bodyTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const bodyMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const capMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

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
        bodyMaterialRef.current.roughness = 0.52;
        bodyMaterialRef.current.metalness = 0.01;
        bodyMaterialRef.current.clearcoat = 0.05;
      } else if (materialType === 'metallic') {
        bodyMaterialRef.current.roughness = 0.22;
        bodyMaterialRef.current.metalness = 0.70;
        bodyMaterialRef.current.clearcoat = 0.40;
      } else {
        // Plastic glossy (Default Pacdora tube finish - smooth satin sheen without glare)
        bodyMaterialRef.current.roughness = 0.22;
        bodyMaterialRef.current.metalness = 0.01;
        bodyMaterialRef.current.clearcoat = 0.35;
        bodyMaterialRef.current.clearcoatRoughness = 0.16;
      }
      bodyMaterialRef.current.needsUpdate = true;
      requestRenderRef.current?.();
    }
  }, [materialType]);

  // Cap color updates
  useEffect(() => {
    if (capMaterialRef.current) {
      const isPureWhite = !capColor || capColor.toLowerCase() === '#ffffff' || capColor.toLowerCase() === '#fff';
      capMaterialRef.current.color.set(isPureWhite ? '#edf0f4' : capColor);
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
        cameraRef.current.position.set(0, 0.18, cameraDistance || 4.2);
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
      const isPureWhite = !packageColor || packageColor.toLowerCase() === '#ffffff' || packageColor.toLowerCase() === '#fff';
      // In PBR physics, real white plastic has ~85% albedo (#f3f4f6), preserving dynamic range for specular highlights
      ctx.fillStyle = isPureWhite ? '#f3f4f6' : (packageColor || '#ffffff');
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 0, w, h);
    }

    // 1. Subtle watermark diamond grid lines & repeated "KLD" text (Visible ONLY when not logged in)
    if (effectiveShowWatermark) {
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

      // Repeated subtle watermark text "KLD"
      ctx.font = 'italic 700 22px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.26)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let gy = 60; gy < h; gy += 140) {
        for (let gx = 45; gx < w; gx += 170) {
          ctx.fillText('KLD', gx, gy);
        }
      }
      ctx.restore();
    }

    // 2. Default placeholder guide when no decals are present (Matching Pacdora reference)
    const hasDecals = decals && decals.length > 0;
    if (!hasDecals && showPlaceholder) {
      ctx.save();
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
          const scaleX = (w * 0.5) / 170;
          const scaleY = h / 503;
          dw = (decal.width || 60) * scaleX;
          dh = (decal.height || 60) * scaleY;
          x = (decal.x || 0) * scaleX;
          y = (decal.y || 0) * scaleY;
          cx = x + dw / 2;
          cy = y + dh / 2;
        } else {
          const labelL = 90 / 25.4;
          const labelW = 133 / 25.4;

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
              if (bodyTextureRef.current) {
                bodyTextureRef.current.needsUpdate = true;
              }
              requestRenderRef.current?.();
            };
            img.src = decal.url;
          }
        } else if (decal.type === 'text') {
          const fontSz = (decal.fontSize || 28) * ((w * 0.5) / 170);
          ctx.font = `${decal.bold ? 'bold ' : ''}${decal.italic ? 'italic ' : ''}${fontSz}px ${decal.fontFamily || 'Inter, sans-serif'}`;
          ctx.fillStyle = decal.color || decal.fillColor || '#1e293b';
          ctx.textAlign = (decal.textAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(decal.text || decal.content || '', cx, cy);
        } else if (decal.type === 'shape') {
          ctx.fillStyle = decal.fillColor || decal.color || '#3b82f6';
          if (decal.strokeColor && decal.strokeWidth) {
            ctx.strokeStyle = decal.strokeColor;
            ctx.lineWidth = decal.strokeWidth * ((w * 0.5) / 170);
          }

          if (decal.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(dw, dh) / 2, 0, Math.PI * 2);
            ctx.fill();
            if (decal.strokeColor && decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'pill') {
            const rad = Math.min(dw, dh) / 2;
            ctx.beginPath();
            ctx.roundRect(x, y, dw, dh, rad);
            ctx.fill();
            if (decal.strokeColor && decal.strokeWidth) ctx.stroke();
          } else {
            ctx.fillRect(x, y, dw, dh);
            if (decal.strokeColor && decal.strokeWidth) ctx.strokeRect(x, y, dw, dh);
          }
        }

        ctx.restore();
      });
    }

    if (bodyTextureRef.current) {
      bodyTextureRef.current.needsUpdate = true;
    }

    onCanvasReady?.(canvas);
  }, [decals, packageColor, showPlaceholder, onCanvasReady, effectiveShowWatermark]);

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

    // 1. Scene & Camera (24° product telephoto lens matching Pacdora framing)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 100);
    camera.position.set(0, 0.16, 4.2);
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
    renderer.toneMappingExposure = 0.88; // Balanced studio exposure — no blinding blown-out highlights
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Studio Environment Map for glossy photorealistic reflections
    const envTarget = createStudioEnvironment(renderer);
    scene.environment = envTarget.texture;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = interactive;
    controls.minDistance = 2.0;
    controls.maxDistance = 8.0;
    controls.target.set(0, 0.06, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting Rig (Calibrated photography intensities for realistic 3D form shading)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.16); // Gentle ambient allows flanks to roll into soft shade
    scene.add(ambientLight);

    // Front-right key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.70);
    keyLight.position.set(2.8, 3.8, 3.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Left vertical strip light (creates elegant specular sheen on the left curvature)
    const leftStripLight = new THREE.DirectionalLight(0xffffff, 0.35);
    leftStripLight.position.set(-3.0, 1.2, 2.5);
    scene.add(leftStripLight);

    // Right rim light for crisp contour edge separation
    const rightRimLight = new THREE.DirectionalLight(0xffffff, 0.28);
    rightRimLight.position.set(3.0, 2.0, -3.0);
    scene.add(rightRimLight);

    // Subtle bottom bounce light
    const bottomReflect = new THREE.DirectionalLight(0xffffff, 0.10);
    bottomReflect.position.set(0, -3.0, 1.5);
    scene.add(bottomReflect);

    // 6. Contact Shadow underneath cap base at y = -1.44
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 115);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.48)');
      grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.22)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.05)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.45;
    scene.add(shadowMesh);

    // 7. Toothpaste Tube Group (standing upright on cap base)
    const tubeGroup = new THREE.Group();
    tubeGroup.position.y = 0;
    scene.add(tubeGroup);
    tubeGroupRef.current = tubeGroup;

    // Body Texture & Physical Material
    drawTubeTexture();
    const bodyTex = new THREE.CanvasTexture(offscreenCanvasRef.current!);
    bodyTex.colorSpace = THREE.SRGBColorSpace;
    bodyTex.wrapS = THREE.ClampToEdgeWrapping;
    bodyTex.wrapT = THREE.ClampToEdgeWrapping;
    bodyTex.generateMipmaps = false;
    bodyTex.minFilter = THREE.LinearFilter;
    bodyTex.magFilter = THREE.LinearFilter;
    bodyTextureRef.current = bodyTex;

    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      map: bodyTex,
      roughness: 0.22,
      metalness: 0.01,
      clearcoat: 0.35,
      clearcoatRoughness: 0.16,
      reflectivity: 0.5,
      side: THREE.FrontSide,
    });
    bodyMaterialRef.current = bodyMaterial;

    // 8. Lofted Squeeze Tube Body Geometry (Organic Squeeze Loft matching Pacdora)
    // Standing upright:
    // Cap at bottom: y = -1.43 to y = -0.95
    // Shoulder dome: y = -0.95 to y = -0.78
    // Body morphs from round base (y = -0.78) to wide flat crimp (y = 1.32)
    // Crimp top bar: y = 1.32 to y = 1.49
    const rings = 80;
    const segments = 80;
    const bodyPositions: number[] = [];
    const bodyUvs: number[] = [];
    const bodyIndices: number[] = [];

    const yStart = -0.78;
    const yEnd = 1.32;
    const totalH = yEnd - yStart; // 2.10 slender height
    const baseR = 0.222; // 75ml tube base radius

    for (let r = 0; r <= rings; r++) {
      const t = r / rings; // 0 (bottom near shoulder) to 1 (top crimp)
      const y = yStart + t * totalH;

      // Realistic volumetric squeeze tube loft:
      // Width expands horizontally, depth flattens while preserving natural cushion volume
      const xRadius = baseR * (1.0 + 0.88 * Math.pow(t, 1.12));
      const flattenFactor = Math.pow(Math.max(0, (t - 0.10) / 0.90), 1.25);
      const zRadius = Math.max(0.018, baseR * (1.0 - 0.92 * flattenFactor));

      // Superellipse exponent p morphs from 2.0 (round cylinder at base) to ~2.75 (plump cushion at top)
      // This eliminates sharp knife-edges and gives the organic filled-tube curvature!
      const p = 2.0 + 0.75 * Math.pow(t, 1.15);

      for (let s = 0; s <= segments; s++) {
        const u = s / segments;
        // u = 0.25 is front center facing camera (+z)
        const angle = (u - 0.25) * Math.PI * 2;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const signCos = Math.sign(cosA) || 1;
        const signSin = Math.sign(sinA) || 1;
        const absCos = Math.pow(Math.abs(cosA), 2 / p);
        const absSin = Math.pow(Math.abs(sinA), 2 / p);

        let x = xRadius * signSin * absSin;
        let z = zRadius * signCos * absCos;

        // Subtle organic heat-seal crinkle impression right beneath the crimp bar (t in [0.82, 0.98])
        if (t > 0.82) {
          const crimpTransition = (t - 0.82) / 0.18;
          const crinkle = Math.sin(x * 50) * 0.0032 * Math.sin(crimpTransition * Math.PI);
          z += crinkle;
        }

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

    // 9. Top Heat-Sealed Crimp Seal Bar (with fine vertical ridges matching Pacdora)
    const crimpH = 0.175;
    const crimpW = baseR * 1.88 * 2; // ~0.835 width
    const crimpD = 0.026;
    const crimpGeo = new THREE.BoxGeometry(crimpW, crimpH, crimpD, 80, 6, 1);

    const cPos = crimpGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const cz = cPos.getZ(i);
      const cx = cPos.getX(i);
      const cy = cPos.getY(i);

      if (Math.abs(cz) > 0.004) {
        // Deep corrugated heat-seal ridges
        const rib = Math.sin(cx * 165) * 0.0042;
        cPos.setZ(i, cz + rib);
      }

      // Slightly round / chamfer top left and right corners of the seal
      if (cy > crimpH * 0.25 && Math.abs(cx) > crimpW * 0.44) {
        const cornerInset = (Math.abs(cx) - crimpW * 0.44) * 0.6;
        cPos.setY(i, cy - cornerInset);
      }
    }
    crimpGeo.computeVertexNormals();

    const crimpTexture = createCrimpTexture();
    const crimpMat = new THREE.MeshPhysicalMaterial({
      map: crimpTexture,
      color: 0xebedf1,
      roughness: 0.30,
      metalness: 0.01,
      clearcoat: 0.20,
      clearcoatRoughness: 0.20,
    });
    const crimpMesh = new THREE.Mesh(crimpGeo, crimpMat);
    crimpMesh.position.y = yEnd + crimpH / 2 - 0.004;
    crimpMesh.castShadow = true;
    tubeGroup.add(crimpMesh);

    // 10. Smooth Curved Dome Shoulder Transition (between body base and cap neck)
    const shoulderPts: THREE.Vector2[] = [];
    const shoulderSteps = 16;
    const neckR = baseR * 0.64; // ~0.142
    for (let i = 0; i <= shoulderSteps; i++) {
      const s = i / shoulderSteps;
      // Smooth convex curve from baseR down to neckR
      const sy = yStart - s * 0.14;
      const sr = baseR - (baseR - neckR) * Math.sin((s * Math.PI) / 2);
      shoulderPts.push(new THREE.Vector2(sr, sy));
    }
    // Neck collar ring
    shoulderPts.push(new THREE.Vector2(neckR * 0.98, yStart - 0.165));

    const shoulderGeo = new THREE.LatheGeometry(shoulderPts, 64);
    shoulderGeo.computeVertexNormals();

    const shoulderMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8ecf0,
      roughness: 0.25,
      metalness: 0.04,
      clearcoat: 0.35,
      clearcoatRoughness: 0.15,
    });
    const shoulderMesh = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderMesh.castShadow = true;
    shoulderMesh.receiveShadow = true;
    tubeGroup.add(shoulderMesh);

    // 11. Ribbed Screw Cap Assembly (Pacdora-style fluted tapered cap)
    const capGroup = new THREE.Group();
    const capH = 0.46;
    // Cap in Pacdora: slightly wider at the top near shoulder (~0.156) and gently tapers to base (~0.138)
    const capRTop = baseR * 0.70; // ~0.155
    const capRBot = baseR * 0.62; // ~0.138
    capGroup.position.y = yStart - 0.165; // Base of neck

    // 24 sharp, deeply-fluted vertical ribs
    const capGeo = new THREE.CylinderGeometry(capRTop, capRBot, capH, 96, 12, false);
    const capPos = capGeo.attributes.position;
    for (let i = 0; i < capPos.count; i++) {
      const cy = capPos.getY(i);
      // Exclude top and bottom edge seams from fluting to maintain clean bevels
      if (Math.abs(cy) < capH * 0.47) {
        const cx = capPos.getX(i);
        const cz = capPos.getZ(i);
        const angle = Math.atan2(cz, cx);

        // Trapezoidal rib profile with crisp crests and shadow grooves
        const cosWave = Math.cos(angle * 24);
        const flute = Math.sign(cosWave) * Math.pow(Math.abs(cosWave), 0.65) * 0.015;

        const currentR = Math.sqrt(cx * cx + cz * cz);
        const newR = currentR + flute;
        capPos.setX(i, Math.cos(angle) * newR);
        capPos.setZ(i, Math.sin(angle) * newR);
      }
    }
    capGeo.computeVertexNormals();

    const isWhiteCap = !capColor || capColor.toLowerCase() === '#ffffff' || capColor.toLowerCase() === '#fff';
    const capMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(isWhiteCap ? '#edf0f4' : capColor),
      roughness: 0.28,
      metalness: 0.01,
      clearcoat: 0.25,
      clearcoatRoughness: 0.18,
    });
    capMaterialRef.current = capMaterial;

    const capMesh = new THREE.Mesh(capGeo, capMaterial);
    capMesh.position.y = -capH / 2;
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    capGroup.add(capMesh);

    // Cap bottom flat base disk (anchors the tube stably on table)
    const capBaseGeo = new THREE.CylinderGeometry(capRBot, capRBot * 0.98, 0.025, 48);
    const capBase = new THREE.Mesh(capBaseGeo, capMaterial);
    capBase.position.y = -capH - 0.012;
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
      envTarget.dispose();
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
      crimpTexture.dispose();
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
