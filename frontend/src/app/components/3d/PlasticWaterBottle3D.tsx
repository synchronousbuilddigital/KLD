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

export interface PlasticWaterBottle3DProps {
  decals?: CanvasDecal[];
  labelColor?: string;
  capColor?: string;
  bottleTint?: string;
  materialType?: 'plastic_glossy' | 'frosted' | 'tinted';
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  interactive?: boolean;
}

export interface PlasticWaterBottle3DRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  getScreenshot: () => string | null;
  toggleAutoRotate: () => boolean;
}

/**
 * Ultra-Realistic Pacdora-Quality Plastic Mineral Water Bottle (PET)
 * - Crystal-clear optical PET transmission (IOR 1.52, 98% transmission, razor-sharp specular streaks)
 * - Pure white 28mm plastic ribbed cap with tamper collar & break notches
 * - Blow-molding neck support ring & finish threads
 * - Conical shoulder transitioning into cylindrical label section
 * - 5 horizontal corrugated grip wave rings with 8 pillowed vertical fluting columns
 * - Contoured 5-point petaloid standing base with recessed center push-up dome
 * - High-contrast studio softbox reflections matching Pacdora studio render
 * - High performance image caching & RAF throttling to eliminate UI lag
 * - sRGB color space & studio lighting calibration for rich, vivid label quality
 */
export const PlasticWaterBottle3D = forwardRef<PlasticWaterBottle3DRef, PlasticWaterBottle3DProps>(({
  decals = [],
  labelColor = '#ffffff',
  capColor = '#ffffff',
  bottleTint = '#ffffff',
  materialType = 'plastic_glossy',
  autoRotate = false,
  autoRotateSpeed = 1.0,
  className = '',
  style = {},
  onCanvasReady,
  interactive = true,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const bottleGroupRef = useRef<THREE.Group | null>(null);
  const labelTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const petMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const capMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const [isRotating, setIsRotating] = useState(autoRotate);
  const isRotatingRef = useRef(autoRotate);
  const autoRotateSpeedRef = useRef(autoRotateSpeed);

  // High performance caches to eliminate lag while dragging or typing
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
    if (petMaterialRef.current) {
      petMaterialRef.current.color.set(bottleTint);
      petMaterialRef.current.roughness = materialType === 'frosted' ? 0.28 : 0.03;
      petMaterialRef.current.transmission = materialType === 'frosted' ? 0.84 : 0.98;
      requestRenderRef.current?.();
    }
  }, [bottleTint, materialType]);

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
        cameraRef.current.position.set(0, 0.35, 5.0);
        controlsRef.current.target.set(0, 0.05, 0);
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
      setIsRotating(prev => {
        const next = !prev;
        isRotatingRef.current = next;
        return next;
      });
      return !isRotatingRef.current;
    }
  }));

  // Synchronous canvas render from cached assets
  const renderCanvasNow = useCallback(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = 1836; // 2x of 918 for retina sharpness
      offscreenCanvasRef.current.height = 348;  // 2x of 174
    }

    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background color
    const isTransparent = labelColor === 'transparent' || !labelColor;
    if (!isTransparent) {
      ctx.fillStyle = labelColor;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(0, 0, w, h);
    }

    // Default Pacdora placeholder when empty
    if (decals.length === 0 && (!labelColor || labelColor === '#ffffff' || labelColor === 'transparent')) {
      ctx.save();

      // Subtle diagonal Pacdora-style watermark lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.035)';
      ctx.lineWidth = 1;
      for (let x = -w; x < w * 2; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }

      // Subtle repeating brand watermarks
      ctx.font = 'italic 16px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.textAlign = 'center';
      for (let x = 120; x < w; x += 340) {
        ctx.fillText('Keyline Design', x, 40);
        ctx.fillText('Pacdora Style', x + 170, h - 30);
      }

      // Front Center Guide (centered at 50% width)
      const cx = w * 0.5;
      const cy = h * 0.5;

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 36px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Upload your images', cx, cy - 32);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 24px "Inter", sans-serif';
      ctx.fillText('or create with AI', cx, cy + 12);

      ctx.fillStyle = '#8b5cf6';
      ctx.font = 'bold 22px "Inter", monospace';
      ctx.fillText('918 × 174 px', cx, cy + 54);

      ctx.restore();
    }

    // Render placed decals in order
    if (decals.length > 0) {
      decals.forEach((decal: any) => {
        ctx.save();

        const isPixelCoord = (decal.x > 30 || decal.y > 30 || decal.width > 30);
        let x = 0;
        let y = 0;
        let dw = 0;
        let dh = 0;

        if (isPixelCoord) {
          // Pixel coordinates from 918x174 canvas
          const scale = 2; // to 1836x348
          x = decal.x * scale;
          y = decal.y * scale;
          dw = decal.width * scale;
          dh = decal.height * scale;
        } else {
          // Physical inch coordinates from DielineSVG (center-based)
          // Label is 9.567 in wide x 1.811 in high with 0.25 in left glue flap
          const labelL = 9.567;
          const labelW = 1.811;
          const xOffset = 0.25;

          const normCx = (decal.x - xOffset) / labelL;
          const normCy = decal.y / labelW;
          const normW = decal.width / labelL;
          const normH = decal.height / labelW;

          const cx = normCx * w;
          const cy = normCy * h;
          dw = normW * w;
          dh = normH * h;
          x = cx - dw / 2;
          y = cy - dh / 2;
        }

        if (decal.rotation) {
          ctx.translate(x + dw / 2, y + dh / 2);
          ctx.rotate((decal.rotation * Math.PI) / 180);
          ctx.translate(-(x + dw / 2), -(y + dh / 2));
        }

        if (decal.type === 'image' && decal.url) {
          const cachedImg = imageCacheRef.current.get(decal.url);
          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            // Draw INSTANTLY from memory without decoding overhead
            ctx.drawImage(cachedImg, x, y, dw, dh);
          } else if (!cachedImg) {
            // Start decoding once and cache it
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              imageCacheRef.current.set(decal.url, img);
              scheduleCanvasRedraw();
            };
            img.onerror = () => {
              imageCacheRef.current.set(decal.url, img);
            };
            img.src = decal.url;
            imageCacheRef.current.set(decal.url, img);
          }
        } else if (decal.type === 'text' || decal.content) {
          const textContent = decal.text || decal.content || '';
          const textColor = decal.color || decal.fillColor || '#000000';
          const fontSz = isPixelCoord
            ? (decal.fontSize || 24) * 2
            : Math.max(16, (decal.fontSize || 0.8) * 120);
          const fWeight = decal.bold ? 'bold' : (decal.fontWeight || 'normal');
          const fStyle = decal.italic ? 'italic' : (decal.fontStyle || 'normal');

          ctx.font = `${fStyle} ${fWeight} ${fontSz}px ${decal.fontFamily || 'Inter'}, sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = (decal.textAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(textContent, x + dw / 2, y + dh / 2);
        } else if ((decal.type === 'shape' && decal.shapeType === 'custom-svg') || decal.type === 'symbol' || decal.svgString || decal.svgContent) {
          const rawSvg = decal.svgString || decal.svgContent || '';
          if (rawSvg) {
            const svgKey = `svg_${decal.id || 'sym'}_${decal.fillColor || decal.color || '#000'}_${Math.round(dw)}_${Math.round(dh)}`;
            const cachedSvg = svgCacheRef.current.get(svgKey);
            if (cachedSvg && cachedSvg.complete && cachedSvg.naturalWidth > 0) {
              ctx.drawImage(cachedSvg, x, y, dw, dh);
            } else if (!cachedSvg) {
              let cleanSvg = rawSvg
                .replace(/currentColor/g, decal.fillColor || decal.color || '#000000')
                .replace(/\s+width=["'][^"']*["']/gi, '')
                .replace(/\s+height=["'][^"']*["']/gi, '');
              if (!cleanSvg.includes('viewBox') && !cleanSvg.includes('viewbox')) {
                cleanSvg = cleanSvg.replace(/<svg/i, '<svg viewBox="0 0 24 24"');
              }
              cleanSvg = cleanSvg.replace(/<svg/i, `<svg width="${Math.round(dw)}" height="${Math.round(dh)}"`);

              const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
              const blobUrl = URL.createObjectURL(svgBlob);
              const img = new Image();
              img.onload = () => {
                svgCacheRef.current.set(svgKey, img);
                URL.revokeObjectURL(blobUrl);
                scheduleCanvasRedraw();
              };
              img.onerror = () => {
                URL.revokeObjectURL(blobUrl);
              };
              img.src = blobUrl;
              svgCacheRef.current.set(svgKey, img);
            }
          }
        } else if (decal.type === 'shape') {
          ctx.fillStyle = decal.fillColor || '#3b82f6';
          ctx.strokeStyle = decal.strokeColor || 'transparent';
          ctx.lineWidth = isPixelCoord ? (decal.strokeWidth || 0) * 2 : (decal.strokeWidth || 0);

          if (decal.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(x + dw / 2, y + dh / 2, Math.min(dw, dh) / 2, 0, Math.PI * 2);
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'rounded-rectangle' || decal.shapeType === 'pill') {
            const radius = decal.shapeType === 'pill' ? dh / 2 : Math.min(16 * 2, dh / 4);
            ctx.beginPath();
            ctx.roundRect(x, y, dw, dh, radius);
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(x + dw / 2, y);
            ctx.lineTo(x + dw, y + dh);
            ctx.lineTo(x, y + dh);
            ctx.closePath();
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'star') {
            const cx = x + dw / 2;
            const cy = y + dh / 2;
            const spikes = 5;
            const outerRadius = Math.min(dw, dh) / 2;
            const innerRadius = outerRadius * 0.45;
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
              let px = cx + Math.cos(rot) * outerRadius;
              let py = cy + Math.sin(rot) * outerRadius;
              ctx.lineTo(px, py);
              rot += step;

              px = cx + Math.cos(rot) * innerRadius;
              py = cy + Math.sin(rot) * innerRadius;
              ctx.lineTo(px, py);
              rot += step;
            }
            ctx.closePath();
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'line' || decal.shapeType === 'dashed-line') {
            ctx.strokeStyle = decal.strokeColor || decal.fillColor || '#000000';
            ctx.lineWidth = isPixelCoord ? (decal.strokeWidth || 3) * 2 : 4;
            if (decal.shapeType === 'dashed-line') {
              ctx.setLineDash([16, 12]);
            }
            ctx.beginPath();
            ctx.moveTo(x, y + dh / 2);
            ctx.lineTo(x + dw, y + dh / 2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // Standard rectangle
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
  }, [decals, labelColor]);

  // RequestAnimationFrame throttled scheduler — eliminates lag and stutter
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

  // Main Three.js Scene Setup (Mounts once for peak performance)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 5.0);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95; // Balanced, natural exposure — no overblown whites
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    if (onCanvasReady) onCanvasReady(renderer.domElement);

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 8.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.18;
    controls.minPolarAngle = 0.2;
    controls.target.set(0, 0.05, 0);
    controls.enabled = interactive;
    controlsRef.current = controls;

    // 4. Studio Environment & High-Contrast Pacdora Reflection Softboxes
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x181e28); // Neutral dark studio ambient — allows crystal-clear transmission

    // Sharp left vertical strip softbox (produces razor-sharp specular rim line on bottle left edge)
    const leftSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 18),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    leftSoftbox.position.set(-6, 1, 3.5);
    leftSoftbox.lookAt(0, 0, 0);
    envScene.add(leftSoftbox);

    // Sharp right vertical strip softbox (produces razor-sharp specular rim line on bottle right edge)
    const rightSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 18),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    rightSoftbox.position.set(6, 1, 3.5);
    rightSoftbox.lookAt(0, 0, 0);
    envScene.add(rightSoftbox);

    // Top broad softbox for shoulder curve highlight
    const topSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    topSoftbox.position.set(0, 7, 4);
    topSoftbox.lookAt(0, 0, 0);
    envScene.add(topSoftbox);

    // Back rim softbox for edge transparency definition
    const backSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    backSoftbox.position.set(0, 0, -7);
    backSoftbox.lookAt(0, 0, 0);
    envScene.add(backSoftbox);

    const envMap = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envMap;

    // Balanced Direct Lights — natural contrast and rich color depth without washout
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(3.5, 4.5, 4.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
    fillLight.position.set(-3.5, 2.5, 3.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
    rimLight.position.set(0, 3, -4.5);
    scene.add(rimLight);

    // Contact Soft Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
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
    shadowMesh.position.y = -1.61;
    scene.add(shadowMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // PACDORA 3D PET MINERAL WATER BOTTLE
    // ─────────────────────────────────────────────────────────────────────────
    const bottleGroup = new THREE.Group();
    bottleGroupRef.current = bottleGroup;
    scene.add(bottleGroup);
    bottleGroup.position.y = 0.0;

    // 1. Crystal-Clear Optical PET Transmission Material
    const petMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(bottleTint),
      roughness: materialType === 'frosted' ? 0.28 : 0.03, // Mirror-smooth gloss!
      metalness: 0.0,
      transmission: materialType === 'frosted' ? 0.84 : 0.98, // 98% crystal transmission
      ior: 1.52, // Pure PET Polyethylene Terephthalate
      thickness: 0.35, // Thin, realistic plastic bottle wall
      specularIntensity: 0.9,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 0.85,
      clearcoatRoughness: 0.02,
      attenuationDistance: 120,
      attenuationColor: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    petMaterialRef.current = petMaterial;

    // 2. White Plastic Cap Material
    const capMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(capColor),
      roughness: 0.32,
      metalness: 0.02,
    });
    capMaterialRef.current = capMaterial;

    // 3. Label Material with Canvas Texture (sRGB Color Space configured)
    renderCanvasNow();
    const labelTexture = new THREE.CanvasTexture(offscreenCanvasRef.current!);
    labelTexture.colorSpace = THREE.SRGBColorSpace; // CRITICAL: Fixes double gamma bleaching!
    labelTexture.wrapS = THREE.RepeatWrapping;
    labelTexture.wrapT = THREE.ClampToEdgeWrapping;
    labelTexture.generateMipmaps = true;
    labelTexture.minFilter = THREE.LinearMipmapLinearFilter;
    labelTexture.magFilter = THREE.LinearFilter;
    labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 8;
    labelTextureRef.current = labelTexture;

    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.38, // Satin printed label finish — eliminates specular hotspot wash-out
      metalness: 0.0,
      side: THREE.FrontSide, // FrontSide only: eliminates double-sided backface accumulation
      transparent: true,
      depthWrite: true,
    });

    // Construct Pacdora-style Lathe Profile
    const points: THREE.Vector2[] = [];

    // Base push-up dome
    points.push(new THREE.Vector2(0.001, -1.60));
    points.push(new THREE.Vector2(0.12, -1.51));
    points.push(new THREE.Vector2(0.26, -1.54));
    // Standing foot contact ring
    points.push(new THREE.Vector2(0.44, -1.60));
    points.push(new THREE.Vector2(0.52, -1.56));
    points.push(new THREE.Vector2(0.56, -1.48));
    points.push(new THREE.Vector2(0.575, -1.34));

    // 5 Corrugated Horizontal Grip Wave Rings
    const ribBottom = -1.34;
    const ribTop = -0.32;
    const ribCount = 5;
    const ribSpacing = (ribTop - ribBottom) / ribCount;

    for (let r = 0; r < ribCount; r++) {
      const y0 = ribBottom + r * ribSpacing;
      const y1 = y0 + ribSpacing * 0.32;
      const y2 = y0 + ribSpacing * 0.68;
      const y3 = y0 + ribSpacing;

      points.push(new THREE.Vector2(0.575, y0));
      points.push(new THREE.Vector2(0.528, y1)); // recessed groove
      points.push(new THREE.Vector2(0.528, y2));
      points.push(new THREE.Vector2(0.575, y3));
    }

    // Inset to cylindrical label panel
    points.push(new THREE.Vector2(0.57, -0.30));
    points.push(new THREE.Vector2(0.562, -0.27));

    // Cylindrical Label Panel: y = -0.27 to y = 0.45 (height = 0.72)
    points.push(new THREE.Vector2(0.562, 0.45));

    // Shoulder transition & conical taper
    points.push(new THREE.Vector2(0.57, 0.48));
    points.push(new THREE.Vector2(0.565, 0.54));
    points.push(new THREE.Vector2(0.54, 0.68));
    points.push(new THREE.Vector2(0.485, 0.82));
    points.push(new THREE.Vector2(0.405, 0.96));
    points.push(new THREE.Vector2(0.31, 1.10));
    points.push(new THREE.Vector2(0.22, 1.20));

    // Neck & blow-mold flange ring
    points.push(new THREE.Vector2(0.19, 1.25));
    points.push(new THREE.Vector2(0.23, 1.26)); // Support ring outer ledge
    points.push(new THREE.Vector2(0.23, 1.29));
    points.push(new THREE.Vector2(0.19, 1.30)); // Inset above ring

    // Screw Thread Finish
    points.push(new THREE.Vector2(0.19, 1.33));
    points.push(new THREE.Vector2(0.205, 1.36)); // Lower thread
    points.push(new THREE.Vector2(0.19, 1.39));
    points.push(new THREE.Vector2(0.205, 1.42)); // Upper thread
    points.push(new THREE.Vector2(0.19, 1.45));

    // Lip & mouth opening
    points.push(new THREE.Vector2(0.19, 1.48));
    points.push(new THREE.Vector2(0.165, 1.48));
    points.push(new THREE.Vector2(0.165, 1.30));

    // Generate Lathe Geometry with 72 smooth circumference segments
    const bottleGeo = new THREE.LatheGeometry(points, 72);

    // Apply 3D wave pillows to the grip ribs & 5-foot petaloid contours
    const pos = bottleGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);

      // Pillowed panels on lower body ribs
      if (y >= ribBottom && y <= ribTop) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const currentR = Math.sqrt(x * x + z * z);

        const rIndex = (y - ribBottom) / ribSpacing;
        const ribPhase = rIndex - Math.floor(rIndex); // 0 to 1 inside each rib

        // 8 vertical pillowed columns around bottle
        const pillow = Math.pow(Math.cos(angle * 8), 2) * Math.sin(ribPhase * Math.PI) * 0.016;
        const newR = currentR + pillow;
        pos.setX(i, Math.cos(angle) * newR);
        pos.setZ(i, Math.sin(angle) * newR);
      }

      // Petaloid 5-foot contour on base
      if (y < -1.45) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const petal = Math.cos(angle * 5) * 0.014 * ((-1.45 - y) / 0.15);
        pos.setY(i, y + petal * 0.5);
      }
    }
    bottleGeo.computeVertexNormals();

    const bottleMesh = new THREE.Mesh(bottleGeo, petMaterial);
    bottleMesh.castShadow = true;
    bottleGroup.add(bottleMesh);

    // Label Cylinder (flush on bottle surface)
    const labelHeight = 0.72;
    const labelRadius = 0.565;
    const labelGeo = new THREE.CylinderGeometry(
      labelRadius,
      labelRadius,
      labelHeight,
      72,
      1,
      true
    );
    labelGeo.rotateY(-Math.PI / 2); // align front facing
    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.y = 0.09;
    bottleGroup.add(labelMesh);

    // 28mm Pure White Ribbed Cap
    const capGroup = new THREE.Group();
    capGroup.position.y = 1.48;

    const capHeight = 0.22;
    const capRadius = 0.21;
    const capFlutes = 48;
    const capGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, capFlutes, 1);

    const capPos = capGeo.attributes.position;
    for (let i = 0; i < capPos.count; i++) {
      const cy = capPos.getY(i);
      if (Math.abs(cy) < capHeight * 0.48) {
        const cx = capPos.getX(i);
        const cz = capPos.getZ(i);
        const angle = Math.atan2(cz, cx);
        const r = Math.sqrt(cx * cx + cz * cz);
        const rib = (Math.cos(angle * capFlutes) + 1) * 0.004;
        capPos.setX(i, Math.cos(angle) * (r + rib));
        capPos.setZ(i, Math.sin(angle) * (r + rib));
      }
    }
    capGeo.computeVertexNormals();

    const capMesh = new THREE.Mesh(capGeo, capMaterial);
    capMesh.castShadow = true;
    capGroup.add(capMesh);

    // Cap top beveled rim
    const capTopGeo = new THREE.CylinderGeometry(capRadius * 0.98, capRadius, 0.03, 48);
    const capTopMesh = new THREE.Mesh(capTopGeo, capMaterial);
    capTopMesh.position.y = capHeight / 2 + 0.015;
    capGroup.add(capTopMesh);

    // Tamper evident ring
    const tamperGeo = new THREE.CylinderGeometry(capRadius * 0.98, capRadius * 0.98, 0.04, 48);
    const tamperMesh = new THREE.Mesh(tamperGeo, capMaterial);
    tamperMesh.position.y = -capHeight / 2 - 0.03;
    capGroup.add(tamperMesh);

    bottleGroup.add(capGroup);

    // Demand-Driven Animation Loop: only renders when rotating, moving controls, or on update
    let animationFrameId: number;
    let needsRender = true;

    const requestRender = () => {
      needsRender = true;
    };
    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        requestRender();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (document.hidden) return;

      let didUpdate = false;
      if (isRotatingRef.current && bottleGroupRef.current) {
        bottleGroupRef.current.rotation.y += 0.008 * autoRotateSpeedRef.current;
        didUpdate = true;
      }

      const controlsDamping = controls.update();
      if (controlsDamping || didUpdate || needsRender) {
        renderer.render(scene, camera);
        needsRender = false;
      }
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
      requestRender();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      controls.removeEventListener('change', requestRender);
      requestRenderRef.current = null;
      cancelAnimationFrame(animationFrameId);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      controls.dispose();
      renderer.dispose();
      bottleGeo.dispose();
      labelGeo.dispose();
      capGeo.dispose();
      capTopGeo.dispose();
      tamperGeo.dispose();
      shadowGeo.dispose();
      petMaterial.dispose();
      capMaterial.dispose();
      labelMaterial.dispose();
      shadowMat.dispose();
      if (labelTextureRef.current) labelTextureRef.current.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Run ONCE — keeps WebGL context alive for buttery smooth 60fps interaction

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ touchAction: 'none', ...style }}
    />
  );
});

PlasticWaterBottle3D.displayName = 'PlasticWaterBottle3D';
export default PlasticWaterBottle3D;
