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
  // Images
  url?: string;
  // Text
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
  // Shapes & Symbols
  shapeType?: 'rect' | 'rounded-rectangle' | 'circle' | 'triangle' | 'star' | 'pill' | 'line' | 'dashed-line' | 'custom-svg';
  svgContent?: string;
  svgString?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface SipperWaterBottle3DProps {
  decals?: CanvasDecal[];
  labelColor?: string;
  capColor?: string;
  bottleTint?: string;
  materialType?: 'metal_glossy' | 'metal_matte' | 'metal_matt' | 'powder_coated';
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  interactive?: boolean;
  showWatermark?: boolean;
  cameraDistance?: number;
  isMini?: boolean;
  showPlaceholder?: boolean;
}

export interface SipperWaterBottle3DRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  getScreenshot: () => string | null;
  toggleAutoRotate: () => boolean;
}

/**
 * Ultra-Realistic Sipper Water Bottle with Handle & Carabiner Clip Hook
 * - Exact replica of the aluminum sports canteen water bottle
 * - Perfect stocky proportions: 0.88 diameter, 1.24 cylinder height, 2.00 total height
 * - Smooth conical tapered shoulder leading to collar groove and neck
 * - Black molded plastic screw cap featuring an arched top loop with large open finger hole
 * - Silver metallic split ring and large outdoor carabiner hook angled outward to the top-right
 * - Full front-facing 949 × 858 wrap label with Keyline Design watermark and bold typography
 */
export const SipperWaterBottle3D = forwardRef<SipperWaterBottle3DRef, SipperWaterBottle3DProps>(({
  decals = [],
  labelColor = '#ffffff',
  capColor = '#18181b',
  bottleTint = '#ffffff',
  materialType = 'metal_glossy',
  autoRotate = false,
  autoRotateSpeed = 1.0,
  className = '',
  style = {},
  onCanvasReady,
  interactive = true,
  showWatermark,
  cameraDistance,
  isMini = false,
  showPlaceholder = true,
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
  const bottleGroupRef = useRef<THREE.Group | null>(null);
  const labelTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const bottleMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const capMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const [isRotating, setIsRotating] = useState(autoRotate);
  const isRotatingRef = useRef(autoRotate);
  const autoRotateSpeedRef = useRef(autoRotateSpeed);

  // Performance caches
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const svgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
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

  useEffect(() => {
    if (capMaterialRef.current) {
      capMaterialRef.current.color.set(capColor);
      requestRenderRef.current?.();
    }
  }, [capColor]);

  useEffect(() => {
    if (bottleMaterialRef.current) {
      bottleMaterialRef.current.color.set(bottleTint || labelColor);
      bottleMaterialRef.current.roughness = materialType === 'powder_coated' ? 0.45 : (materialType === 'metal_matte' || materialType === 'metal_matt') ? 0.34 : 0.22;
      bottleMaterialRef.current.metalness = materialType === 'powder_coated' ? 0.15 : (materialType === 'metal_matte' || materialType === 'metal_matt') ? 0.38 : 0.40;
      requestRenderRef.current?.();
    }
  }, [bottleTint, labelColor, materialType]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.multiplyScalar(0.85);
        controlsRef.current.update();
      }
    },
    zoomOut: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.multiplyScalar(1.15);
        controlsRef.current.update();
      }
    },
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 0.28, cameraDistance || (isMini ? 6.4 : 5.6));
        controlsRef.current.target.set(0, 0.24, 0);
        controlsRef.current.update();
      }
    },
    getScreenshot: () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png');
      }
      return null;
    },
    toggleAutoRotate: () => {
      const next = !isRotatingRef.current;
      setIsRotating(next);
      return next;
    },
  }));

  // Render Label Canvas Texture: 2048 x 1852 (exact 949 x 858 ratio)
  const renderCanvasNow = useCallback(() => {
    let canvas = offscreenCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1852;
      offscreenCanvasRef.current = canvas;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Background fill
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = labelColor || '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 2. Default placeholder matching the Pacdora screenshot (with Keyline Design branding)
    const hasUserDecals = decals && decals.length > 0;
    if (!hasUserDecals && showPlaceholder) {
      ctx.save();

      // Delicate 45-degree diamond grid lines across the bottle (matching Pacdora screenshot)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1.5;
      const gridSize = 140;

      // Diagonal lines 45 deg
      for (let x = -h * 2; x < w * 2; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + h, 0);
        ctx.stroke();
      }

      // Subtle diagonal repeating "Keyline Design" watermark in each cell
      ctx.fillStyle = 'rgba(0, 0, 0, 0.045)';
      ctx.font = '500 24px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const stepX = 280;
      const stepY = 140;
      for (let y = 0; y < h + stepY; y += stepY) {
        for (let x = 0; x < w + stepX; x += stepX) {
          ctx.save();
          ctx.translate(x + ((y / stepY) % 2 === 0 ? 0 : stepX / 2), y);
          ctx.rotate(-Math.PI / 10);
          ctx.fillText('Keyline Design', 0, 0);
          ctx.restore();
        }
      }

      // Bold, clean, prominent center typography matching Photo 2
      const centerX = w / 2;
      const centerY = h / 2 - 25;

      ctx.fillStyle = '#111827';
      ctx.font = '700 84px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Upload your image', centerX, centerY - 82);

      ctx.font = '500 66px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = '#374151';
      ctx.fillText('or create with', centerX, centerY);

      ctx.font = '800 96px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('949 × 858', centerX, centerY + 96);

      ctx.restore();
    }

    // 3. User Decals Rendering
    const visibleDecals = Array.isArray(decals) ? decals.filter(d => !d.surface || d.surface === 'Outside') : [];
    if (visibleDecals.length > 0) {
      visibleDecals.forEach(decal => {
        // Detect coordinate system: if width > 20 or x > 15 or y > 15, assume pixel coords (0..949, 0..858); otherwise inches
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

        if (decal.isWrap) {
          // Full-wrap coverage across entire 1000 ml bottle cylinder
          x = 0;
          y = 0;
          dw = w;
          dh = h;
          cx = w / 2;
          cy = h / 2;
        } else if (isPixelCoord) {
          // Pixel coordinates from 949 x 858 2D label canvas
          const scaleX = w / 949;
          const scaleY = h / 858;
          dw = (decal.width || 200) * scaleX;
          dh = (decal.height || 200) * scaleY;
          x = (decal.x || 0) * scaleX;
          y = (decal.y || 0) * scaleY;
          cx = x + dw / 2;
          cy = y + dh / 2;
        } else {
          // Physical inch coordinates from DielineSVG / EditorModal (center-based)
          // 1000 ml wrap dieline: 251 mm (9.8819 in) circumference x 227 mm (8.9370 in) height
          const safeLabelL = 251 / 25.4; // 9.881889 in
          const safeLabelW = 227 / 25.4; // 8.937007 in
          const safeGlue = 0.25;

          const rawX = decal.x !== undefined ? decal.x : (safeGlue + safeLabelL / 2);
          const rawY = decal.y !== undefined ? decal.y : (safeLabelW / 2);

          const normCx = (rawX - safeGlue) / safeLabelL;
          const normCy = rawY / safeLabelW;
          const normW = (decal.width || 3.0) / safeLabelL;
          const normH = (decal.height || 3.0) / safeLabelW;

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

        if (decal.type === 'text') {
          const fontSize = isPixelCoord
            ? (decal.fontSize || 36) * (h / 858)
            : ((decal.fontSize || 0.6) / (227 / 25.4)) * h;
          const fontWeight = decal.bold || decal.fontWeight === 'bold' || decal.fontWeight === '700' || decal.fontWeight === '800' ? 'bold' : 'normal';
          const fontStyle = decal.italic || decal.fontStyle === 'italic' ? 'italic' : 'normal';
          const fontFamily = decal.fontFamily || 'Inter, sans-serif';

          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.fillStyle = decal.color || decal.fillColor || '#000000';
          ctx.textAlign = (decal.textAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';

          const textX = decal.textAlign === 'left' ? x : decal.textAlign === 'right' ? x + dw : cx;
          const textY = cy;
          ctx.fillText(decal.text || decal.content || '', textX, textY);
        } else if ((decal.type === 'image' || decal.type === 'upload' || (!decal.type && (decal.url || decal.src || decal.image || decal.preview || decal.dataUrl))) && (decal.url || decal.src || decal.image || decal.preview || decal.dataUrl)) {
          const imgUrl = (decal.url || decal.src || decal.image || decal.preview || decal.dataUrl)!;
          if (decal.opacity !== undefined) ctx.globalAlpha = Number(decal.opacity);
          
          let cachedImg = imageCacheRef.current.get(imgUrl);
          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            ctx.drawImage(cachedImg, x, y, dw, dh);
          } else if (!cachedImg) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              imageCacheRef.current.set(imgUrl, img);
              scheduleCanvasRedraw();
            };
            img.onerror = () => {
              console.warn('Failed to load decal image:', imgUrl);
            };
            img.src = imgUrl;
            imageCacheRef.current.set(imgUrl, img);
            // If already complete (e.g. data URL or memory cache)
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, x, y, dw, dh);
            }
          } else if (!cachedImg.complete) {
            cachedImg.onload = () => {
              scheduleCanvasRedraw();
            };
          }
        } else if (decal.type === 'symbol') {
          const svgRaw = decal.svgString || decal.svgContent;
          if (svgRaw) {
            const svgKey = decal.id + '_' + (decal.fillColor || '#000');
            let img = svgCacheRef.current.get(svgKey);
            if (img && img.complete && img.naturalWidth !== 0) {
              ctx.drawImage(img, x, y, dw, dh);
            } else if (!img) {
              let processedSvg = svgRaw;
              if (decal.fillColor && !processedSvg.includes('fill="currentColor"')) {
                processedSvg = processedSvg.replace(/<svg([^>]+)>/i, `<svg$1 fill="${decal.fillColor}">`);
              }
              const blob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
              const blobUrl = URL.createObjectURL(blob);
              img = new Image();
              img.onload = () => {
                svgCacheRef.current.set(svgKey, img!);
                URL.revokeObjectURL(blobUrl);
                scheduleCanvasRedraw();
              };
              img.src = blobUrl;
              svgCacheRef.current.set(svgKey, img);
            }
          }
        } else if (decal.type === 'shape') {
          ctx.fillStyle = decal.fillColor || '#3b82f6';
          ctx.strokeStyle = decal.strokeColor || 'transparent';
          ctx.lineWidth = isPixelCoord ? (decal.strokeWidth || 0) * 2 : ((decal.strokeWidth || 0) / (227 / 25.4)) * h;

          if (decal.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(dw, dh) / 2, 0, Math.PI * 2);
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'rounded-rectangle' || decal.shapeType === 'pill') {
            const radius = decal.shapeType === 'pill' ? dh / 2 : Math.min(24, dh / 4);
            ctx.beginPath();
            ctx.roundRect(x, y, dw, dh, radius);
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else {
            ctx.fillRect(x, y, dw, dh);
            if (decal.strokeWidth) ctx.strokeRect(x, y, dw, dh);
          }
        }

        ctx.restore();
      });
    }

    if (labelTextureRef.current) {
      labelTextureRef.current.needsUpdate = true;
      requestRenderRef.current?.();
    }
  }, [decals, labelColor, showPlaceholder]);

  const scheduleCanvasRedraw = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      renderCanvasNow();
    });
  }, [renderCanvasNow]);

  useEffect(() => {
    scheduleCanvasRedraw();
  }, [scheduleCanvasRedraw]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Balanced perspective matching Pacdora studio FOV
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 0.28, cameraDistance || (isMini ? 6.4 : 5.6));
    cameraRef.current = camera;

    // 2. Renderer with Antialiasing & sRGB Output
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
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    if (onCanvasReady) onCanvasReady(renderer.domElement);

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = isMini ? 3.0 : 2.2;
    controls.maxDistance = isMini ? 14.0 : 12.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.14;
    controls.minPolarAngle = 0.2;
    controls.target.set(0, 0.24, 0);
    controls.enabled = interactive;
    controlsRef.current = controls;

    // 4. Studio Environment & Softboxes for Razor-Sharp Pacdora Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x1e242c);

    // Left vertical strip softbox
    const leftSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 14),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    leftSoftbox.position.set(-5.0, 1, 3.5);
    leftSoftbox.lookAt(0, 0, 0);
    envScene.add(leftSoftbox);

    // Right vertical strip softbox
    const rightSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 14),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    rightSoftbox.position.set(5.0, 1, 3.5);
    rightSoftbox.lookAt(0, 0, 0);
    envScene.add(rightSoftbox);

    // Top broad softbox
    const topSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    topSoftbox.position.set(0, 6.5, 3.5);
    topSoftbox.lookAt(0, 0, 0);
    envScene.add(topSoftbox);

    // Back rim softbox
    const backSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    backSoftbox.position.set(0, 0, -6.0);
    backSoftbox.lookAt(0, 0, 0);
    envScene.add(backSoftbox);

    const envMap = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envMap;

    // Direct Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.70);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(3.5, 4.5, 4.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.50);
    fillLight.position.set(-3.5, 2.5, 3.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
    rimLight.position.set(0, 3.5, -4.0);
    scene.add(rimLight);

    // Ground Contact Drop Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.18)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.04)');
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
    shadowMesh.position.y = -1.15;
    scene.add(shadowMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // SIPPER WATER BOTTLE 3D MESH HIERARCHY
    // Exact Pacdora 1000 ml proportions: Diameter = 0.70, Height = 2.82
    // ─────────────────────────────────────────────────────────────────────────
    const bottleGroup = new THREE.Group();
    bottleGroupRef.current = bottleGroup;
    scene.add(bottleGroup);
    bottleGroup.position.y = 0.0;

    // Materials
    // 1. Semi-gloss / Metal matt aluminum body material (matching Pacdora Metal matt)
    const bottleMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bottleTint || labelColor),
      metalness: materialType === 'powder_coated' ? 0.15 : materialType === 'metal_matte' || materialType === 'metal_matt' ? 0.38 : 0.35,
      roughness: materialType === 'powder_coated' ? 0.45 : materialType === 'metal_matte' || materialType === 'metal_matt' ? 0.34 : 0.22,
    });
    bottleMaterialRef.current = bottleMaterial;

    // 2. Black molded cap material
    const capMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(capColor),
      metalness: 0.12,
      roughness: 0.38,
    });
    capMaterialRef.current = capMaterial;

    // 3. Silver chrome carabiner clip & split-ring material
    const carabinerMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      metalness: 0.98,
      roughness: 0.10,
    });

    // 4. Label Material with Canvas Texture (sRGB calibrated)
    renderCanvasNow();
    const labelTexture = new THREE.CanvasTexture(offscreenCanvasRef.current!);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    labelTexture.wrapS = THREE.RepeatWrapping;
    labelTexture.wrapT = THREE.ClampToEdgeWrapping;
    labelTexture.generateMipmaps = true;
    labelTexture.minFilter = THREE.LinearMipmapLinearFilter;
    labelTexture.magFilter = THREE.LinearFilter;
    labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 8;
    labelTextureRef.current = labelTexture;

    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: true,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BOTTLE LATHE BODY (1000 ml Tall Canteen: Base + Chamfer + Shoulder + Collar + Neck)
    // Diameter = 0.70, Cylinder Height = 1.989 (251mm x 227mm 1:1 Aspect)
    // ─────────────────────────────────────────────────────────────────────────
    const R_BODY = 0.35; // Diameter = 0.70 (1000 ml sports bottle)
    const Y_BASE = -1.145;
    const Y_CYL_BOT = -1.095;
    const Y_CYL_TOP = 0.895;
    const CYL_HEIGHT = Y_CYL_TOP - Y_CYL_BOT; // 1.99 units (exact 2.84 ratio)

    const points: THREE.Vector2[] = [];
    // Base bottom center with subtle push-up
    points.push(new THREE.Vector2(0.001, Y_BASE + 0.015));
    points.push(new THREE.Vector2(0.30, Y_BASE));
    // Base contact chamfer bevel
    points.push(new THREE.Vector2(0.335, Y_BASE + 0.018));
    points.push(new THREE.Vector2(0.348, Y_BASE + 0.038));
    points.push(new THREE.Vector2(R_BODY, Y_CYL_BOT));

    // Straight cylindrical body (tall 1000 ml column)
    points.push(new THREE.Vector2(R_BODY, Y_CYL_TOP));

    // Conical Tapered Shoulder (matching Pacdora 1000ml reference)
    points.push(new THREE.Vector2(0.348, Y_CYL_TOP + 0.04));
    points.push(new THREE.Vector2(0.336, Y_CYL_TOP + 0.09));
    points.push(new THREE.Vector2(0.308, Y_CYL_TOP + 0.15));
    points.push(new THREE.Vector2(0.262, Y_CYL_TOP + 0.21));
    points.push(new THREE.Vector2(0.208, Y_CYL_TOP + 0.26));
    points.push(new THREE.Vector2(0.160, Y_CYL_TOP + 0.30));
    points.push(new THREE.Vector2(0.138, Y_CYL_TOP + 0.325));

    // Collar step ring and groove (authentic sports bottle collar)
    points.push(new THREE.Vector2(0.138, Y_CYL_TOP + 0.335));
    points.push(new THREE.Vector2(0.152, Y_CYL_TOP + 0.345));
    points.push(new THREE.Vector2(0.152, Y_CYL_TOP + 0.365));
    points.push(new THREE.Vector2(0.135, Y_CYL_TOP + 0.375));

    // Threaded neck cylinder
    points.push(new THREE.Vector2(0.135, Y_CYL_TOP + 0.455));
    // Top mouth lip & inner cavity
    points.push(new THREE.Vector2(0.115, Y_CYL_TOP + 0.455));
    points.push(new THREE.Vector2(0.115, Y_CYL_TOP + 0.335));

    const bottleLatheGeo = new THREE.LatheGeometry(points, 72);
    const bottleMesh = new THREE.Mesh(bottleLatheGeo, bottleMaterial);
    bottleGroup.add(bottleMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // WRAP-AROUND PRINTABLE LABEL CYLINDER (251 mm x 227 mm aspect)
    // 1:1 mapping with ZERO distortion, centered facing camera (+Z)
    // ─────────────────────────────────────────────────────────────────────────
    const labelCylinderGeo = new THREE.CylinderGeometry(
      R_BODY + 0.0006, // Microscopic offset eliminates Z-fighting
      R_BODY + 0.0006,
      CYL_HEIGHT,
      72,
      1,
      true
    );
    // Rotate geometry so the center of canvas (U=0.5) faces camera (+Z)
    labelCylinderGeo.rotateY(Math.PI);
    const labelMesh = new THREE.Mesh(labelCylinderGeo, labelMaterial);
    labelMesh.position.y = (Y_CYL_BOT + Y_CYL_TOP) / 2; // y = -0.10
    bottleGroup.add(labelMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // BLACK SCREW CAP WITH INTEGRATED ARCHED LOOP HANDLE
    // Large, clear circular finger through-hole matching Photo 1 (1000 ml cap)
    // ─────────────────────────────────────────────────────────────────────────
    const capGroup = new THREE.Group();
    bottleGroup.add(capGroup);

    const capBaseY = Y_CYL_TOP + 0.375; // y = 1.27

    // Cap base cylindrical collar (screws onto bottle neck)
    const capBaseGeo = new THREE.CylinderGeometry(0.150, 0.150, 0.08, 48);
    const capBaseMesh = new THREE.Mesh(capBaseGeo, capMaterial);
    capBaseMesh.position.y = capBaseY + 0.04;
    capGroup.add(capBaseMesh);

    // Lower grip ring
    const capRingGeo = new THREE.TorusGeometry(0.150, 0.007, 16, 48);
    capRingGeo.rotateX(Math.PI / 2);
    const capRingMesh = new THREE.Mesh(capRingGeo, capMaterial);
    capRingMesh.position.y = capBaseY + 0.015;
    capGroup.add(capRingMesh);

    // Arched Handle with Open Circular Through-Hole (ExtrudeGeometry with Hole)
    const handleShape = new THREE.Shape();
    const hBaseW = 0.135;
    const hStartH = capBaseY + 0.08; // y = 1.35
    const hPeakH = capBaseY + 0.32;  // y = 1.59
    const holeCenterY = capBaseY + 0.195; // y = 1.465
    const holeR = 0.070; // Large circular opening matching Photo 1

    // Outer contour
    handleShape.moveTo(-hBaseW, hStartH);
    handleShape.lineTo(-hBaseW, holeCenterY);
    handleShape.quadraticCurveTo(-hBaseW, hPeakH, 0, hPeakH);
    handleShape.quadraticCurveTo(hBaseW, hPeakH, hBaseW, holeCenterY);
    handleShape.lineTo(hBaseW, hStartH);
    handleShape.closePath();

    // Large Inner Circular Through-Hole (Finger loop eyelet)
    const holePath = new THREE.Path();
    holePath.absarc(0, holeCenterY, holeR, 0, Math.PI * 2, true);
    handleShape.holes.push(holePath);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.115,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    };
    const handleGeo = new THREE.ExtrudeGeometry(handleShape, extrudeSettings);
    handleGeo.center();
    const handleMesh = new THREE.Mesh(handleGeo, capMaterial);
    handleMesh.position.set(0, holeCenterY, 0);
    capGroup.add(handleMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // SILVER METALLIC SPLIT RING & OUTDOOR SLENDER CARABINER CLIP
    // Angled upward and outward to the top-right matching Photo 1
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Silver Split Ring passing through the cap eyelet
    const splitRingGeo = new THREE.TorusGeometry(0.040, 0.0055, 16, 48);
    const splitRingMesh = new THREE.Mesh(splitRingGeo, carabinerMaterial);
    splitRingMesh.position.set(0.038, holeCenterY + 0.018, 0.005);
    splitRingMesh.rotation.y = 0.45;
    splitRingMesh.rotation.x = 0.18;
    capGroup.add(splitRingMesh);

    // 2. Outdoor Slender Carabiner Hook (connected to split ring, angled up-right)
    const carabinerGroup = new THREE.Group();
    bottleGroup.add(carabinerGroup);

    // Anchored at split ring, extended out to the top right at ~42 degree tilt
    carabinerGroup.position.set(0.058, holeCenterY + 0.035, 0.010);
    carabinerGroup.rotation.z = -0.73; // ~41.8 deg angle outward-upward
    carabinerGroup.rotation.y = 0.22;
    carabinerGroup.rotation.x = 0.08;

    // Authentic Outdoor Slender Pear Carabiner Curve Path
    const carabinerCurve = new THREE.CurvePath<THREE.Vector3>();
    const cWidth = 0.165;
    const cLength = 0.38;

    const cPts: THREE.Vector3[] = [
      // Narrow top nose hooked through split ring
      new THREE.Vector3(0, 0.005, 0),
      new THREE.Vector3(-0.024, 0.025, 0),
      // Left straight spine extending out
      new THREE.Vector3(-0.038, cLength * 0.25, 0),
      new THREE.Vector3(-0.044, cLength * 0.55, 0),
      new THREE.Vector3(-0.040, cLength * 0.78, 0),
      // Wide top bow curve
      new THREE.Vector3(-0.015, cLength * 0.94, 0),
      new THREE.Vector3(cWidth * 0.32, cLength, 0),
      new THREE.Vector3(cWidth * 0.75, cLength * 0.94, 0),
      new THREE.Vector3(cWidth, cLength * 0.78, 0),
      // Right gate arm
      new THREE.Vector3(cWidth * 0.88, cLength * 0.52, 0),
      new THREE.Vector3(cWidth * 0.65, cLength * 0.25, 0),
      new THREE.Vector3(cWidth * 0.35, 0.05, 0),
      // Closing back to nose
      new THREE.Vector3(0, 0.005, 0),
    ];
    carabinerCurve.add(new THREE.CatmullRomCurve3(cPts, true, 'centripetal', 0.25));

    const carabinerGeo = new THREE.TubeGeometry(carabinerCurve, 96, 0.0075, 16, true);
    const carabinerMesh = new THREE.Mesh(carabinerGeo, carabinerMaterial);
    carabinerGroup.add(carabinerMesh);

    // Spring gate collar on the right arm
    const gateCollarGeo = new THREE.CylinderGeometry(0.0105, 0.0105, 0.065, 16);
    const gateCollarMesh = new THREE.Mesh(gateCollarGeo, carabinerMaterial);
    gateCollarMesh.position.set(cWidth * 0.78, cLength * 0.48, 0);
    gateCollarMesh.rotation.z = 0.28;
    carabinerGroup.add(gateCollarMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // ANIMATION & RESIZE LOOP
    // ─────────────────────────────────────────────────────────────────────────
    let animationFrameId: number;

    const render = () => {
      if (isRotatingRef.current && bottleGroupRef.current) {
        bottleGroupRef.current.rotation.y += 0.008 * autoRotateSpeedRef.current;
      }
      controls.update();
      renderer.render(scene, camera);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      render();
    };
    animate();

    requestRenderRef.current = render;

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw === 0 || nh === 0) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      render();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cameraDistance, interactive, isMini, onCanvasReady, renderCanvasNow]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none ${className}`}
      style={{ minHeight: isMini ? '160px' : '280px', ...style }}
    >
      {effectiveShowWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#6b7280',
            pointerEvents: 'none',
            userSelect: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
        >
          Keyline Design 3D Studio
        </div>
      )}
    </div>
  );
});

export default SipperWaterBottle3D;
