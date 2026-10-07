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
  surface?: string;
  isWindow?: boolean;
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

export interface BeverageCan3DProps {
  decals?: CanvasDecal[];
  packageColor?: string;
  materialType?: 'metal_matt' | 'metal_gloss';
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  showPlaceholder?: boolean;
  showWatermark?: boolean;
  labelWidthInches?: number;
  labelHeightInches?: number;
  glueFlapWidth?: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export interface BeverageCan3DRef {
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

/**
 * Ultra-Realistic Pacdora-Quality 12 oz Aluminum Beverage Can (Soda Can)
 * Model ID: 550034
 * - Photorealistic brushed/matte aluminum PBR metalness and studio reflections
 * - Precise 12 oz can lathe profile: recessed push-up base, chime, shoulder taper, double-seam rim
 * - Recessed top lid with stamped score line and stay-on aluminum pull tab with rivet & finger loop
 * - Exact 784 x 472 px aspect wrap label area
 * - High-contrast studio softboxes for crisp specular highlights
 * - Real-time canvas texture sync with sRGB color calibration
 */
export const BeverageCan3D = forwardRef<BeverageCan3DRef, BeverageCan3DProps>(({
  decals = [],
  packageColor = '#ffffff',
  materialType = 'metal_matt',
  autoRotate = false,
  autoRotateSpeed = 1.0,
  className = '',
  style = {},
  interactive = true,
  showPlaceholder = true,
  showWatermark,
  labelWidthInches = 207 / 25.4,
  labelHeightInches = 125 / 25.4,
  glueFlapWidth = 0.25,
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

  // Update material roughness based on metal_matt vs metal_gloss
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

  // Imperative handle
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (cameraRef.current) {
        cameraRef.current.position.multiplyScalar(0.85);
        requestRenderRef.current?.();
      }
    },
    zoomOut: () => {
      if (cameraRef.current) {
        cameraRef.current.position.multiplyScalar(1.15);
        requestRenderRef.current?.();
      }
    },
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 0.15, 3.8);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        requestRenderRef.current?.();
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
      isRotatingRef.current = next;
      requestRenderRef.current?.();
      return next;
    },
  }));

  // Render Label Canvas Texture
  const renderCanvasNow = useCallback(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      // 3x resolution of 784 x 472 for razor sharp render
      offscreenCanvasRef.current.width = 2352;
      offscreenCanvasRef.current.height = 1416;
    }

    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const w = canvas.width;  // 2352
    const h = canvas.height; // 1416

    ctx.clearRect(0, 0, w, h);

    const isCustomTint = Boolean(
      packageColor &&
      packageColor !== '#ffffff' &&
      packageColor !== 'transparent' &&
      packageColor.toLowerCase() !== '#fff'
    );

    // Background fill: Default is transparent on aluminum cans so raw brushed metal shines through!
    if (isCustomTint) {
      ctx.fillStyle = packageColor;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    // 1. Subtle watermark diamond grid lines & repeated "KLD" text (Visible ONLY when not logged in)
    if (effectiveShowWatermark) {
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

      // Repeated subtle watermark text "KLD"
      ctx.font = 'italic 700 24px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(100, 116, 139, 0.22)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let gy = 70; gy < h; gy += 150) {
        for (let gx = 60; gx < w; gx += 190) {
          ctx.fillText('KLD', gx, gy);
        }
      }
      ctx.restore();
    }

    // 2. Default placeholder guide when no decals are present
    const hasDecals = decals && decals.length > 0;
    if (!hasDecals && showPlaceholder) {
      ctx.save();
      // Centered front-panel guide
      const centerX = w * 0.50;
      const centerY = h * 0.50;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Heading
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 54px "Inter", -apple-system, sans-serif';
      ctx.fillText('Upload your image', centerX, centerY - 45);

      // Subtitle
      ctx.fillStyle = '#475569';
      ctx.font = '500 36px "Inter", -apple-system, sans-serif';
      ctx.fillText('or create with AI', centerX, centerY + 10);

      // Aspect tag
      ctx.fillStyle = '#334155';
      ctx.font = '600 32px "Inter", monospace';
      ctx.fillText('784 × 472 px', centerX, centerY + 65);

      ctx.restore();
    }

    // Render Custom Decals
    const visibleDecals = Array.isArray(decals) ? decals.filter(d => !d.surface || d.surface === 'Outside') : [];
    if (visibleDecals.length > 0) {
      visibleDecals.forEach((decal) => {
        // Detect coordinate system: if width > 20 or x > 15 or y > 15, assume pixel coords (0..784, 0..472); otherwise inches
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
          // Pixel coords from 784 x 472 2D label canvas (decal.x and decal.y are top-left)
          const scaleX = w / 784;
          const scaleY = h / 472;
          dw = (decal.width || 100) * scaleX;
          dh = (decal.height || 100) * scaleY;
          x = (decal.x || 0) * scaleX;
          y = (decal.y || 0) * scaleY;
          cx = x + dw / 2;
          cy = y + dh / 2;
        } else {
          // Physical inch coordinates from DielineSVG (decal.x and decal.y are center-based)
          // Label is labelWidthInches wide x labelHeightInches high with glueFlapWidth seam tab on left
          const safeLabelL = Number(labelWidthInches) || (207 / 25.4);
          const safeLabelW = Number(labelHeightInches) || (125 / 25.4);
          const safeGlue = Number(glueFlapWidth) || 0.25;

          const normCx = ((decal.x ?? 0) - safeGlue) / safeLabelL;
          const normCy = (decal.y ?? 0) / safeLabelW;
          const normW = (decal.width ?? 1) / safeLabelL;
          const normH = (decal.height ?? 1) / safeLabelW;

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
              scheduleCanvasRedraw();
            };
            img.onerror = () => {
              imageCacheRef.current.set(decal.url!, img);
            };
            img.src = decal.url;
            imageCacheRef.current.set(decal.url, img);
          }
        } else if (decal.type === 'text' || decal.content) {
          const textContent = decal.text || decal.content || '';
          const textColor = decal.color || decal.fillColor || '#000000';
          const fontSz = isPixelCoord
            ? (decal.fontSize || 28) * 3
            : Math.max(24, (decal.fontSize || 0.45) * (h / (Number(labelHeightInches) || (125 / 25.4))));
          const fWeight = decal.bold ? 'bold' : (decal.fontWeight || 'normal');
          const fStyle = decal.italic ? 'italic' : (decal.fontStyle || 'normal');

          ctx.font = `${fStyle} ${fWeight} ${fontSz}px ${decal.fontFamily || 'Inter'}, sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = (decal.textAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          let textX = cx;
          if (decal.textAlign === 'left') textX = x;
          else if (decal.textAlign === 'right') textX = x + dw;
          ctx.fillText(textContent, textX, cy);
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
          ctx.lineWidth = isPixelCoord ? (decal.strokeWidth || 0) * 3 : ((decal.strokeWidth || 0) / 72) * (h / (Number(labelHeightInches) || (125 / 25.4)));

          if (decal.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(dw, dh) / 2, 0, Math.PI * 2);
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'rounded-rectangle' || decal.shapeType === 'pill') {
            const radius = decal.shapeType === 'pill' ? dh / 2 : Math.min(24 * 3, dh / 4);
            ctx.beginPath();
            ctx.roundRect(x, y, dw, dh, radius);
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(cx, y);
            ctx.lineTo(x + dw, y + dh);
            ctx.lineTo(x, y + dh);
            ctx.closePath();
            ctx.fill();
            if (decal.strokeWidth) ctx.stroke();
          } else if (decal.shapeType === 'star') {
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
            ctx.lineWidth = isPixelCoord ? (decal.strokeWidth || 3) * 3 : 5;
            if (decal.shapeType === 'dashed-line') {
              ctx.setLineDash([20, 14]);
            }
            ctx.beginPath();
            ctx.moveTo(x, cy);
            ctx.lineTo(x + dw, cy);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // Rectangle
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
  }, [decals, packageColor, showPlaceholder, labelWidthInches, labelHeightInches, glueFlapWidth, effectiveShowWatermark]);

  // RequestAnimationFrame throttled scheduler
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

  // Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0.35, 0.55, 4.2);
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
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    if (onCanvasReady) {
      onCanvasReady(renderer.domElement);
    }

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.8;
    controls.maxDistance = 7.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.25;
    controls.minPolarAngle = 0.15;
    controls.target.set(0, 0, 0);
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
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 15, 128, 128, 120);
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
    shadowMesh.position.y = -1.25;
    scene.add(shadowMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // PACDORA 3D 12 OZ ALUMINUM BEVERAGE CAN
    // ─────────────────────────────────────────────────────────────────────────
    const canGroup = new THREE.Group();
    canGroupRef.current = canGroup;
    scene.add(canGroup);
    canGroup.position.y = 0.0;

    // Procedural brushed textures
    const brushedTexture = createBrushedMetalTexture();
    const radialBrushedTexture = createRadialBrushedTexture();

    // 1. Brushed Aluminum Metal Material
    const isGloss = materialType === 'metal_gloss';
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd0d5dc),
      roughness: isGloss ? 0.12 : 0.25,
      metalness: isGloss ? 0.98 : 0.95,
      bumpMap: brushedTexture,
      bumpScale: 0.003,
      side: THREE.FrontSide,
    });
    metalMaterialRef.current = metalMaterial;

    // 2. Can Lid & Tab Aluminum Material
    const lidMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xcbd1d8),
      roughness: 0.22,
      metalness: 0.94,
      bumpMap: radialBrushedTexture,
      bumpScale: 0.002,
      side: THREE.DoubleSide,
    });
    lidMaterialRef.current = lidMaterial;

    // 3. Label Material with Canvas Texture
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

    // Construct Accurate 12 oz Beverage Can Lathe Profile
    // Standard 12 oz can: ~66mm diameter (r ~ 0.62), ~122mm height (h ~ 2.30)
    const points: THREE.Vector2[] = [];

    // Recessed dome base (bottom push-up dome)
    points.push(new THREE.Vector2(0.001, -1.14));
    points.push(new THREE.Vector2(0.15, -1.15));
    points.push(new THREE.Vector2(0.32, -1.18));
    points.push(new THREE.Vector2(0.42, -1.21));

    // Standing chime ring (contact foot)
    points.push(new THREE.Vector2(0.46, -1.24));
    points.push(new THREE.Vector2(0.50, -1.23));
    points.push(new THREE.Vector2(0.53, -1.18));

    // Lower chime taper into main cylindrical body
    points.push(new THREE.Vector2(0.55, -1.12));
    points.push(new THREE.Vector2(0.585, -1.02));
    points.push(new THREE.Vector2(0.612, -0.92));
    points.push(new THREE.Vector2(0.620, -0.84)); // Start of cylinder

    // Main straight cylindrical body: y = -0.84 to y = 0.84
    points.push(new THREE.Vector2(0.620, 0.84)); // End of cylinder

    // Shoulder transition & neck taper
    points.push(new THREE.Vector2(0.612, 0.90));
    points.push(new THREE.Vector2(0.585, 0.98));
    points.push(new THREE.Vector2(0.545, 1.07));
    points.push(new THREE.Vector2(0.520, 1.13));

    // Neck crimp groove & double-seam top rim
    points.push(new THREE.Vector2(0.514, 1.15));
    points.push(new THREE.Vector2(0.528, 1.17)); // Outer rim ledge
    points.push(new THREE.Vector2(0.538, 1.20)); // Top of rim lip
    points.push(new THREE.Vector2(0.528, 1.22)); // Rim crest
    points.push(new THREE.Vector2(0.512, 1.22)); // Inner lip turn
    points.push(new THREE.Vector2(0.500, 1.19)); // Recessed lid wall down
    points.push(new THREE.Vector2(0.488, 1.15)); // Inner lid seam junction

    // Recessed top lid surface sloping toward center
    points.push(new THREE.Vector2(0.38, 1.145));
    points.push(new THREE.Vector2(0.20, 1.14));
    points.push(new THREE.Vector2(0.001, 1.14));

    // Generate Lathe Geometry with 72 smooth circumference segments
    const canBodyGeo = new THREE.LatheGeometry(points, 72);
    canBodyGeo.computeVertexNormals();

    const canBodyMesh = new THREE.Mesh(canBodyGeo, metalMaterial);
    canBodyMesh.castShadow = true;
    canGroup.add(canBodyMesh);

    // Label Cylinder (Flush on the straight cylinder body: y = -0.84 to 0.84)
    const labelHeight = 1.68;
    const labelRadius = 0.622;
    const labelGeo = new THREE.CylinderGeometry(
      labelRadius,
      labelRadius,
      labelHeight,
      72,
      1,
      true
    );
    labelGeo.rotateY(Math.PI); // align front facing (texture center u=0.50 faces +Z camera)
    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.y = 0.0;
    canGroup.add(labelMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // Detailed Aluminum Pull Tab & Lid Stamped Scoring
    // ─────────────────────────────────────────────────────────────────────────
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 1.145, 0);

    // 1. Stamped Opening Tear Score Line
    const scorePoints: THREE.Vector2[] = [];
    const scoreR = 0.16;
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 1.65 - Math.PI * 0.82;
      scorePoints.push(new THREE.Vector2(Math.sin(a) * scoreR * 0.75, Math.cos(a) * scoreR + 0.12));
    }
    const scoreShape = new THREE.Shape(scorePoints);
    const scoreGeo = new THREE.ShapeGeometry(scoreShape);
    const scoreMat = new THREE.MeshBasicMaterial({ color: 0x9ca3af, side: THREE.DoubleSide });
    const scoreMesh = new THREE.Mesh(scoreGeo, scoreMat);
    scoreMesh.rotation.x = -Math.PI / 2;
    scoreMesh.position.y = 0.003;
    lidGroup.add(scoreMesh);

    // 2. Aluminum Stay-on Pull Tab
    const tabGroup = new THREE.Group();
    tabGroup.position.set(0, 0.005, -0.04);

    // Center Mounting Rivet
    const rivetGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.015, 24);
    const rivetMesh = new THREE.Mesh(rivetGeo, lidMaterial);
    rivetMesh.position.set(0, 0.008, 0.04);
    tabGroup.add(rivetMesh);

    // Tab Body (Lever with finger loop & puncturing nose)
    const tabShape = new THREE.Shape();
    // Tab outer outline: rounded lever
    tabShape.moveTo(-0.065, -0.22);
    tabShape.lineTo(0.065, -0.22);
    tabShape.quadraticCurveTo(0.085, -0.20, 0.085, -0.06);
    tabShape.lineTo(0.075, 0.12);
    tabShape.quadraticCurveTo(0.065, 0.19, 0, 0.22);
    tabShape.quadraticCurveTo(-0.065, 0.19, -0.075, 0.12);
    tabShape.lineTo(-0.085, -0.06);
    tabShape.quadraticCurveTo(-0.085, -0.20, -0.065, -0.22);

    // Tab finger hole cutout
    const holePath = new THREE.Path();
    holePath.moveTo(-0.045, -0.16);
    holePath.lineTo(0.045, -0.16);
    holePath.quadraticCurveTo(0.055, -0.15, 0.055, -0.05);
    holePath.quadraticCurveTo(0.055, 0.04, 0, 0.05);
    holePath.quadraticCurveTo(-0.055, 0.04, -0.055, -0.05);
    holePath.quadraticCurveTo(-0.055, -0.15, -0.045, -0.16);
    tabShape.holes.push(holePath);

    const tabExtrudeSettings = {
      depth: 0.012,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    };
    const tabGeo = new THREE.ExtrudeGeometry(tabShape, tabExtrudeSettings);
    const tabMesh = new THREE.Mesh(tabGeo, lidMaterial);
    tabMesh.rotation.x = -Math.PI / 2;
    tabMesh.position.set(0, 0.005, 0);
    tabMesh.castShadow = true;
    tabGroup.add(tabMesh);

    lidGroup.add(tabGroup);
    canGroup.add(lidGroup);

    // Demand-Driven Animation Loop: only renders when rotating or controls move
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
      if (isRotatingRef.current && canGroupRef.current) {
        canGroupRef.current.rotation.y += 0.008 * autoRotateSpeedRef.current;
        didUpdate = true;
      }

      const controlsDamping = controls.update();
      if (controlsDamping || didUpdate || needsRender) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    };
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
        requestRender();
      }
    });
    resizeObserver.observe(container);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      brushedTexture.dispose();
      radialBrushedTexture.dispose();
      envBgTexture.dispose();
      shadowTexture.dispose();
      renderer.dispose();
      pmremGenerator.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [renderCanvasNow, interactive, materialType, onCanvasReady]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={style}
    />
  );
});

BeverageCan3D.displayName = 'BeverageCan3D';
export default BeverageCan3D;
