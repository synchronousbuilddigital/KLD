/**
 * sharedUtils.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilities shared by RTEBox3DViewer and TEBox3DViewer.
 * Import from here — never duplicate in each viewer file.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo, useState, useEffect } from "react";
import { Decal, useTexture } from "@react-three/drei";
import * as THREE from "three";

export function useDebouncedDecals(decals, delay = 150) {
  const [debounced, setDebounced] = useState(decals);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(decals), delay);
    return () => clearTimeout(handler);
  }, [decals, delay]);
  return debounced;
}

// ─────────────────────────────────────────────────────────────────────────────
// EASING
// ─────────────────────────────────────────────────────────────────────────────
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

export function stageProgress(progress, start, end) {
  return easeInOut(Math.max(0, Math.min(1, (progress - start) / (end - start))));
}

// ─────────────────────────────────────────────────────────────────────────────
// WINDOW HOLE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function buildWindowHole(shapeType, w, h, ox, oy) {
  const path = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  
  switch (shapeType) {
    case 'circle':
      path.absarc(ox, oy, Math.min(hw, hh), 0, Math.PI * 2, false);
      break;
    case 'triangle':
      path.moveTo(ox, oy + hh);
      path.lineTo(ox - hw, oy - hh);
      path.lineTo(ox + hw, oy - hh);
      path.closePath();
      break;
    case 'star': {
      const outerR = Math.min(hw, hh);
      const innerR = outerR * 0.382;
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const ptY = oy + radius * Math.sin(-angle);
        if (i === 0) path.moveTo(ptX, ptY);
        else path.lineTo(ptX, ptY);
      }
      path.closePath();
      break;
    }
    case 'heart': {
      const x = ox;
      const y = oy + hh / 4;
      const size = Math.min(hw, hh);
      
      path.moveTo(x, y - size * 0.2);
      path.bezierCurveTo(x + size * 0.5, y + size * 0.8, x + size, y + size * 0.5, x + size, y);
      path.bezierCurveTo(x + size, y - size, x, y - size * 1.5, x, y - size * 1.5);
      path.bezierCurveTo(x, y - size * 1.5, x - size, y - size, x - size, y);
      path.bezierCurveTo(x - size, y + size * 0.8, x - size * 0.5, y + size * 0.8, x, y - size * 0.2);
      break;
    }
    case 'rectangle':
    default:
      path.moveTo(ox - hw, oy - hh);
      path.lineTo(ox - hw, oy + hh);
      path.lineTo(ox + hw, oy + hh);
      path.lineTo(ox + hw, oy - hh);
      path.closePath();
      break;
  }
  return path;
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOMETRY HELPER — assigns outside / inside / edge material groups
// ─────────────────────────────────────────────────────────────────────────────
export function assignMaterialGroups(geom, nT) {
  if (!geom.index) return;
  geom.computeBoundingBox();
  const maxZ = geom.boundingBox.max.z;
  const minZ = geom.boundingBox.min.z;

  const pos   = geom.attributes.position;
  const index = geom.index.array;

  const groups = [];
  let currentGroup = { start: 0, count: 0, materialIndex: -1 };

  for (let i = 0; i < index.length; i += 3) {
    const a = index[i], b = index[i + 1], c = index[i + 2];
    const zA = pos.getZ(a), zB = pos.getZ(b), zC = pos.getZ(c);
    let mat = 2;
    const isOutside = Math.abs(zA - maxZ) < 0.001 && Math.abs(zB - maxZ) < 0.001 && Math.abs(zC - maxZ) < 0.001;
    const isInside  = Math.abs(zA - minZ) < 0.001 && Math.abs(zB - minZ) < 0.001 && Math.abs(zC - minZ) < 0.001;
    if (isOutside) mat = 0;
    else if (isInside) mat = 1;

    if (mat === currentGroup.materialIndex) {
      currentGroup.count += 3;
    } else {
      if (currentGroup.count > 0) groups.push(currentGroup);
      currentGroup = { start: i, count: 3, materialIndex: mat };
    }
  }
  if (currentGroup.count > 0) groups.push(currentGroup);
  geom.groups = groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL TEXTURE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL TEXTURE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function createProceduralTexture(materialCategory, packageColor) {
  if (typeof window === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width  = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  let r, g, b;
  switch (materialCategory) {
    case "kraft_paperboard": r = 203; g = 171; b = 125; break; // Warm natural tan (matches Pacdora)
    case "corrugated":       r = 188; g = 149; b = 104; break; // Classic corrugated brown
    case "art_paper":        r = 255; g = 255; b = 255; break;
    case "white_paperboard": 
    default:                 r = 253; g = 251; b = 247; break;
  }

  if (packageColor && packageColor !== "transparent") {
    const hex = packageColor.replace(/^#/, "");
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }

  // Use a higher resolution noise map for softer grain
  const noiseSize   = 512;
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = noiseSize;
  noiseCanvas.height = noiseSize;
  const noiseCtx = noiseCanvas.getContext("2d");
  const imgData  = noiseCtx.createImageData(noiseSize, noiseSize);
  const data     = imgData.data;

  let noiseMultiplier = 0;
  if (materialCategory === "kraft_paperboard" || materialCategory === "corrugated") {
    noiseMultiplier = 12; // Softer multiplier
  } else if (materialCategory === "white_paperboard") {
    noiseMultiplier = 1;
  } else if (materialCategory === "art_paper") {
    noiseMultiplier = 0;
  }

  for (let i = 0; i < data.length; i += 4) {
    const noiseVal = Math.random();
    let intensity = 0;
    if (noiseMultiplier > 0) {
      intensity = (noiseVal - 0.5) * noiseMultiplier;
      // Removed the harsh 0.02 random specks to ensure smooth kraft texture
    }
    data[i]     = Math.min(255, Math.max(0, r + intensity));
    data[i + 1] = Math.min(255, Math.max(0, g + intensity));
    data[i + 2] = Math.min(255, Math.max(0, b + intensity));
    data[i + 3] = 255;
  }
  noiseCtx.putImageData(imgData, 0, 0);

  // Leave imageSmoothingEnabled = true (default) to create soft fibrous blur when scaling up
  ctx.imageSmoothingEnabled = true; 
  ctx.drawImage(noiseCanvas, 0, 0, 1024, 1024);

  if (materialCategory === "corrugated") {
    // Generate soft rolling gradients for flutes
    const fluteWidth = 22; // Pixel width of each flute
    for (let x = 0; x < 1024; x++) {
      // Sine wave from -1 to 1 based on x position
      const wave = Math.sin((x / fluteWidth) * Math.PI * 2);
      
      // Shade based on wave (negative = valley, positive = peak)
      const alpha = Math.abs(wave) * 0.12; 
      if (wave < 0) {
        ctx.fillStyle = `rgba(0,0,0,${alpha * 0.9})`; // Shadow in the valley
      } else {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`; // Highlight on the peak
      }
      ctx.fillRect(x, 0, 1, 1024);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy  = 16;
  tex.colorSpace  = THREE.SRGBColorSpace;
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL FACTORY
// ─────────────────────────────────────────────────────────────────────────────
export function buildMaterials(materialCategory, texture, insideColor, packageColor) {
  let roughness = 0.85; // Default matte
  let metalness = 0.0;
  let bumpScale = 0.0;
  
  if (materialCategory === "kraft_paperboard") {
    roughness = 0.92; // Slightly softer reflection
    bumpScale = 0.002; // Very subtle bump, matching soft fibrous kraft
  } else if (materialCategory === "corrugated") {
    roughness = 0.90;
    bumpScale = 0.009;
  } else if (materialCategory === "white_paperboard") {
    roughness = 0.70; // Soft smooth finish
    bumpScale = 0.0005; // Almost perfectly flat
  } else if (materialCategory === "art_paper") {
    roughness = 0.60; // Coated/Satin finish (not too glossy/plastic)
    bumpScale = 0.0;
  }

  const texProps = texture ? { map: texture, bumpMap: texture, bumpScale } : {};

  const outside = new THREE.MeshStandardMaterial({
    roughness, metalness, side: THREE.FrontSide, ...texProps,
  });

  let insideHex = "#fdfbf7";
  if (materialCategory === "kraft_paperboard") insideHex = "#dcb98e";
  if (materialCategory === "corrugated")       insideHex = "#c19a6b";
  if (materialCategory === "art_paper")        insideHex = "#ffffff";
  if (insideColor && insideColor !== "transparent") insideHex = insideColor;

  const inside = new THREE.MeshStandardMaterial({
    color: insideHex, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide,
  });

  let edgeHex = "#ebe5dc";
  if (materialCategory === "kraft_paperboard") edgeHex = "#bfa079";
  if (materialCategory === "corrugated")       edgeHex = "#a8865c";
  if (materialCategory === "art_paper")        edgeHex = "#f5f5f5";
  if (packageColor && packageColor !== "transparent") edgeHex = packageColor;
  
  let edgeMap = null;
  if (materialCategory === "corrugated" && typeof document !== "undefined") {
    const eCanvas = document.createElement("canvas");
    eCanvas.width = 256;
    eCanvas.height = 32;
    const eCtx = eCanvas.getContext("2d");
    
    // Base color
    eCtx.fillStyle = edgeHex;
    eCtx.fillRect(0, 0, 256, 32);
    
    // Top and bottom liners
    eCtx.fillStyle = "rgba(0,0,0,0.15)";
    eCtx.fillRect(0, 0, 256, 4);
    eCtx.fillRect(0, 28, 256, 4);
    
    // Wavy inner flute
    eCtx.strokeStyle = "rgba(0,0,0,0.25)";
    eCtx.lineWidth = 3;
    eCtx.beginPath();
    for (let x = 0; x <= 256; x++) {
      const y = 16 + Math.sin(x * 0.3) * 9;
      if (x === 0) eCtx.moveTo(x, y);
      else eCtx.lineTo(x, y);
    }
    eCtx.stroke();
    
    edgeMap = new THREE.CanvasTexture(eCanvas);
    edgeMap.wrapS = THREE.RepeatWrapping;
    edgeMap.wrapT = THREE.RepeatWrapping;
    edgeMap.repeat.set(10, 1);
  }

  const edgeProps = edgeMap ? { map: edgeMap } : {};
  const edge = new THREE.MeshStandardMaterial({
    color: edgeHex, roughness: 0.9, metalness: 0.0, ...edgeProps
  });
  
  const flap = new THREE.MeshStandardMaterial({
    roughness, metalness, side: THREE.DoubleSide, ...texProps,
  });

  return { outside, inside, edge, flap };
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTING PRESETS (JSX component)
// ─────────────────────────────────────────────────────────────────────────────
export function LightingPreset({ preset }) {
  if (preset === "warm") {
    return (
      <>
        <ambientLight intensity={0.80} color="#fff6e8" />
        <directionalLight position={[10, 14, 10]} intensity={1.1} color="#fff0d8" castShadow />
        <directionalLight position={[-5, 6, -4]}  intensity={0.25} color="#c8d8ff" />
      </>
    );
  }
  if (preset === "dramatic") {
    return (
      <>
        <ambientLight intensity={0.15} />
        <spotLight position={[6, 14, 8]} intensity={2.0} angle={0.28} penumbra={0.9} castShadow />
        <pointLight position={[-4, -6, 4]} intensity={0.3} color="#4488ff" />
      </>
    );
  }
  // default: studio
  return (
    <>
      <ambientLight intensity={0.60} color="#ffffff" />
      <directionalLight position={[8, 12, 12]}  intensity={0.40} castShadow />
      <directionalLight position={[-8, 6, 8]}   intensity={0.15} color="#f0f5ff" />
      <directionalLight position={[0, 10, -15]} intensity={0.35} color="#ffffff" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE LAYOUT — returns array of { key, pos, rot } instances
// ─────────────────────────────────────────────────────────────────────────────
export function buildSceneInstances(layout, L, W, H) {
  const gap = 0.05;
  if (layout === "stacked2") return [
    { key: "box1", pos: [0, -H / 2 - gap, 0], rot: [0, 0, 0] },
    { key: "box2", pos: [0,  H / 2 + gap, 0], rot: [0, 0, 0] },
  ];
  if (layout === "stacked3") return [
    { key: "box1", pos: [0, -H - gap * 2, 0],  rot: [0, 0, 0] },
    { key: "box2", pos: [0, 0, 0],              rot: [0, 0, 0] },
    { key: "box3", pos: [0,  H + gap * 2, 0],  rot: [0, 0, 0] },
  ];
  if (layout === "sidebyside") return [
    { key: "box1", pos: [-L / 2 - gap, 0, 0], rot: [0, 0, 0] },
    { key: "box2", pos: [ L / 2 + gap, 0, 0], rot: [0, 0, 0] },
  ];
  if (layout === "offset") return [
    { key: "box1", pos: [-L / 4, -H / 2 - gap,  0],    rot: [0, 0, 0] },
    { key: "box2", pos: [ L / 4,  H / 2 + gap, -W / 2], rot: [0, -Math.PI / 12, 0] },
  ];
  if (layout === "cascade") return [
    { key: "box1", pos: [-L / 2, -H / 2 - gap,  W / 2], rot: [0, 0, 0] },
    { key: "box2", pos: [0,       H / 2 + gap,  -W / 4], rot: [0, -Math.PI / 16, 0] },
    { key: "box3", pos: [ L / 2,  H * 1.5 + gap * 3, -W], rot: [0, -Math.PI / 8, 0] },
  ];
  return [{ key: "box1", pos: [0, 0, 0], rot: [0, 0, 0] }];
}

// ─────────────────────────────────────────────────────────────────────────────
// DECAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function createTextTextureURL(decal) {
  if (typeof window === "undefined") return "";
  
  const canvas = document.createElement("canvas");
  const aspect = (decal.height || 1) / (decal.width || 1);
  canvas.width = 2048;
  canvas.height = 2048 * aspect;
  const ctx = canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const fontWeight = decal.bold ? "bold" : "normal";
  const fontStyle = decal.italic ? "italic" : "normal";
  const fontSize = (decal.fontSize ?? 0.8) / (decal.height || 1) * canvas.height;
  
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${decal.fontFamily || "Inter"}`;
  ctx.fillStyle = decal.color || "#000000";
  ctx.textAlign = decal.textAlign || "center";
  ctx.textBaseline = "middle";
  
  let x = canvas.width / 2;
  if (ctx.textAlign === "left") x = 0;
  if (ctx.textAlign === "right") x = canvas.width;
  
  const explicitLines = (decal.content ?? "Your text here").split("\n");
  const finalLines = [];
  
  explicitLines.forEach(expLine => {
     if (expLine.trim() === '') {
         finalLines.push('');
         return;
     }
     const words = expLine.split(' ');
     let currentLine = '';
     for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        if (ctx.measureText(testLine).width > canvas.width && i > 0) {
            finalLines.push(currentLine.trim());
            currentLine = words[i] + ' ';
        } else {
            currentLine = testLine;
        }
     }
     finalLines.push(currentLine.trim());
  });
  
  const lineH = fontSize * 1.2;
  const totalTextHeight = (finalLines.length - 1) * lineH;
  let startY = (canvas.height / 2) - (totalTextHeight / 2);
  
  finalLines.forEach((line) => {
      ctx.fillText(line, x, startY);
      startY += lineH;
  });
  
  return canvas.toDataURL("image/png");
}

function createShapeTextureURL(decal) {
  if (typeof window === "undefined") return "";

  if (decal.shapeType === 'custom-svg' && decal.svgString) {
    // Inject width/height to avoid blurry rasters in Three.js and apply the color
    // Must remove existing width/height to avoid duplicate attributes in XML parser
    let cleanSvg = decal.svgString.replace(/fill="currentColor"/g, `fill="${decal.fillColor}"`);
    // Remove existing width="xyz" and height="xyz" from the main <svg> tag
    cleanSvg = cleanSvg.replace(/(<svg[^>]*?)\s+width="[^"]*"/, '$1');
    cleanSvg = cleanSvg.replace(/(<svg[^>]*?)\s+height="[^"]*"/, '$1');
    cleanSvg = cleanSvg.replace(/<svg/, `<svg width="1024" height="1024"`);
    // Safe base64 encoding for SVG string
    const base64 = btoa(unescape(encodeURIComponent(cleanSvg)));
    return `data:image/svg+xml;base64,${base64}`;
  }

  const canvas = document.createElement("canvas");
  const aspect = (decal.height || 1) / (decal.width || 1);
  canvas.width = 1024;
  canvas.height = Math.round(1024 * aspect);
  const ctx = canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  
  const strokeW_in = (decal.strokeWidth || 0) / 72;
  const maxDim = Math.max(decal.width || 1, decal.height || 1);
  const sw = (strokeW_in / maxDim) * Math.max(canvas.width, canvas.height);
  
  ctx.fillStyle = decal.fillColor || "transparent";
  ctx.strokeStyle = decal.strokeColor || "transparent";
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  
  const tlx = sw / 2;
  const tly = sw / 2;
  const rw = canvas.width - sw;
  const rh = canvas.height - sw;

  if (decal.borderStyle === 'dashed') {
    ctx.setLineDash([Math.max(10, sw*2), Math.max(10, sw*2)]);
  } else {
    ctx.setLineDash([]);
  }
  
  ctx.beginPath();
  
  switch (decal.shapeType) {
    case 'line':
    case 'dashed-line':
      ctx.moveTo(tlx, cy);
      ctx.lineTo(tlx + rw, cy);
      break;
    case 'rect':
    case 'square':
    case 'rectangle':
      ctx.rect(tlx, tly, rw, rh);
      break;
    case 'rounded-rectangle':
      const r_in = (decal.borderRadius || 36) / 72;
      const r_px = (r_in / maxDim) * Math.max(canvas.width, canvas.height);
      if (ctx.roundRect) {
        ctx.roundRect(tlx, tly, rw, rh, r_px);
      } else {
        ctx.rect(tlx, tly, rw, rh);
      }
      break;
    case 'oval':
    case 'circle':
      ctx.arc(cx, cy, Math.min(rw, rh) / 2, 0, 2 * Math.PI);
      break;
    case 'triangle':
      ctx.moveTo(cx, tly);
      ctx.lineTo(tlx, tly + rh);
      ctx.lineTo(tlx + rw, tly + rh);
      ctx.closePath();
      break;
    case 'star':
      const outerRadius = rw/2;
      const innerRadius = outerRadius * 0.382;
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const ptX = cx + radius * Math.cos(angle);
        const ptY = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(ptX, ptY);
        else ctx.lineTo(ptX, ptY);
      }
      ctx.closePath();
      break;
  }
  
  if (decal.shapeType !== 'line' && decal.shapeType !== 'dashed-line' && decal.fillColor !== 'transparent') {
    ctx.fill();
  }
  if (sw > 0 && decal.strokeColor !== 'transparent') {
    ctx.stroke();
  }
  
  return canvas.toDataURL("image/png");
}

export function mapDecalToPanel(decal, panel, L, W, H, manuL, manuW, manuH, dims, T) {
  let cx = 0, cy = 0, rotZ = 0, scaleX = 1, scaleY_sign = 1;
  let scaleY = H / manuH;
  const { x1, x2, x3, x4, yTop, yBot } = dims;
  const nT = Math.max(0.015, Number(T) || 0.0197);
  const coverDepth = W - 2 * nT;

  if (decal.custom) {
    cx = decal.x;
    cy = decal.y;
    rotZ = decal.rotation || 0;
    return { cx, cy, rotZ, scaleX: 1, scaleY_sign: 1, scaleY: 1 };
  }

  // The main panels are scaled vertically by H / manuH.
  // The top and bottom flaps are proportional to the box depth (W), so they scale vertically by W / manuW.
  if (panel.includes("top") || panel.includes("bot")) {
    scaleY = W / manuW;
  }

  if      (panel === "p1")          { scaleX = L/manuL; cx = (decal.x-x1)*scaleX - L/2; cy = (yTop-decal.y)*scaleY + H/2; }
  else if (panel === "p2")          { scaleX = W/manuW; cx = (decal.x-x2)*scaleX;        cy = (yTop-decal.y)*scaleY + H/2; }
  else if (panel === "p3")          { scaleX = L/manuL; cx = (decal.x-x3)*scaleX - L/2; cy = (yTop-decal.y)*scaleY + H/2; }
  else if (panel === "p4")          { scaleX = W/manuW; cx = (decal.x-x4)*scaleX;        cy = (yTop-decal.y)*scaleY + H/2; }
  else if (panel === "p1_top_cover"){ scaleX = L/manuL; cx = (decal.x-x1)*scaleX - L/2; cy = (yTop-decal.y)*scaleY; }
  else if (panel === "p1_top_lip")  { scaleX = L/manuL; cx = (decal.x-x1)*scaleX - L/2; cy = (yTop-coverDepth-decal.y)*scaleY; }
  else if (panel === "p3_top_cover"){ scaleX = L/manuL; cx = (decal.x-x3)*scaleX - L/2; cy = (yTop-decal.y)*scaleY; }
  else if (panel === "p3_top_lip")  { scaleX = L/manuL; cx = (decal.x-x3)*scaleX - L/2; cy = (yTop-coverDepth-decal.y)*scaleY; }
  else if (panel === "p3_bot_cover"){ scaleX = L/manuL; cx = -((decal.x-x3)*scaleX - L/2); cy = (decal.y-yBot)*scaleY; rotZ = Math.PI; }
  else if (panel === "p3_bot_lip")  { scaleX = L/manuL; cx = -((decal.x-x3)*scaleX - L/2); cy = (decal.y-(yBot+coverDepth))*scaleY; rotZ = Math.PI; }
  else if (panel === "p2_top_dust") { scaleX = W/manuW; cx = (decal.x-x2)*scaleX - W/2; cy = (yTop-decal.y)*scaleY; }
  else if (panel === "p2_bot_dust") { scaleX = W/manuW; cx = -((decal.x-x2)*scaleX - W/2); cy = (decal.y-yBot)*scaleY; rotZ = Math.PI; }
  else if (panel === "p4_top_dust") { scaleX = W/manuW; cx = (decal.x-x4)*scaleX - W/2; cy = (yTop-decal.y)*scaleY; }
  else if (panel === "p4_bot_dust") { scaleX = W/manuW; cx = -((decal.x-x4)*scaleX - W/2); cy = (decal.y-yBot)*scaleY; rotZ = Math.PI; }
  else if (panel === "p1_bot_auto") { scaleX = L/manuL; cx = (decal.x-x1)*scaleX - L/2; cy = -((decal.y-yBot)*scaleY); }
  else if (panel === "p2_bot_auto") { scaleX = W/manuW; cx = (decal.x-x2)*scaleX - W/2; cy = -((decal.y-yBot)*scaleY); }
  else if (panel === "p3_bot_auto") { scaleX = L/manuL; cx = (decal.x-x3)*scaleX - L/2; cy = -((decal.y-yBot)*scaleY); }
  else if (panel === "p4_bot_auto") { scaleX = W/manuW; cx = (decal.x-x4)*scaleX - W/2; cy = -((decal.y-yBot)*scaleY); }
  else if (panel === "p1_glue")     { scaleX = L/manuL; cx = (decal.x-x1)*scaleX;        cy = (yTop-decal.y)*scaleY + H/2; }
  
  return { cx, cy, rotZ, scaleX, scaleY_sign, scaleY };
}

export function DecalItem({ decal, index = 0, L, W, H, manuL, manuW, manuH, dims, panel, T, isFlatGeometry = false, clipMask }) {
  const { cx, cy, rotZ, scaleX, scaleY_sign, scaleY } = mapDecalToPanel(decal, panel, L, W, H, manuL, manuW, manuH, dims, T);

  const decalW = Math.max(0.001, decal.width  * scaleX);
  const decalH = Math.max(0.001, decal.height * scaleY) * scaleY_sign;

  const isText  = decal.type === "text";
  const isShape = decal.type === "shape";
  const textureUrl = useMemo(() => {
    if (isText) return createTextTextureURL(decal);
    if (isShape) return createShapeTextureURL(decal);
    return decal.url;
  }, [decal]);
  const texture = useTexture(textureUrl);

  React.useEffect(() => {
    if (texture) {
      texture.anisotropy      = 16;
      texture.colorSpace      = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter       = THREE.LinearMipmapLinearFilter;
      texture.needsUpdate     = true;
    }
  }, [texture]);

  const isInside    = decal.surface === "Inside";
  let   rotY        = 0;
  let   finalDecalW = decalW;
  if (isInside) { rotY = Math.PI; finalDecalW = -decalW; }

  const nT = Math.max(0.015, Number(T) || 0.0197);
  const depth = nT * 1.5; // Restrict projection depth so it only intersects one surface
  const zPos  = isFlatGeometry ? (isInside ? -nT : 0) : (isInside ? 0 : nT);

  return (
    <Decal position={[cx, cy, zPos]} rotation={[0, rotY, rotZ]} scale={[finalDecalW, decalH, depth]} renderOrder={index + 1}>
      <meshStandardMaterial
        map={texture} transparent depthTest depthWrite={false}
        alphaTest={0.01} roughness={0.4} metalness={0.1}
        polygonOffset polygonOffsetFactor={-(index + 1)} 
        side={THREE.FrontSide}
        onBeforeCompile={(shader) => {
          if (clipMask && clipMask.tex) {
            shader.uniforms.maskTex = { value: clipMask.tex };
            
            const u0 = clipMask.sx / 387.9;
            const u1 = (clipMask.sx + clipMask.sw) / 387.9;
            const v1 = 1.0 - (clipMask.sy / 295.25);
            const v0 = 1.0 - ((clipMask.sy + clipMask.sh) / 295.25);
            
            shader.uniforms.maskBox = { value: new THREE.Vector4(clipMask.px, clipMask.py, clipMask.w, clipMask.h) };
            shader.uniforms.maskUVBox = { value: new THREE.Vector4(u0, u1, v0, v1) };
            
            shader.vertexShader = `
              varying vec2 vMaskUV;
              uniform vec4 maskBox;
              uniform vec4 maskUVBox;
              ${shader.vertexShader}
            `.replace(
              `#include <begin_vertex>`,
              `#include <begin_vertex>
               float nx = (position.x + maskBox.x) / maskBox.z;
               float ny = (position.y + maskBox.y) / maskBox.w;
               vMaskUV = vec2(
                 mix(maskUVBox.x, maskUVBox.y, nx),
                 mix(maskUVBox.z, maskUVBox.w, ny)
               );
              `
            );
            
            shader.fragmentShader = `
              uniform sampler2D maskTex;
              varying vec2 vMaskUV;
              ${shader.fragmentShader}
            `.replace(
              `#include <alphatest_fragment>`,
              `#include <alphatest_fragment>
               vec4 maskColor = texture2D(maskTex, vMaskUV);
               if (maskColor.a < 0.5) discard;
              `
            );
          }
        }}
      />
    </Decal>
  );
}

export function getOverlappingDecals(panel, decals, dims, W, T) {
  if (!decals || decals.length === 0) return [];
  const { x1, x2, x3, x4, x5, yTop, yBot } = dims;
  const nT = Math.max(0.015, Number(T) || 0.0197);
  const coverDepth = W - 2 * nT;
  const lipDepth = W * (14.25 / 60);
  const dustH = W * (38 / 60);

  const ov = (d, px1, px2, py1, py2) => {
    const minX = d.x - d.width / 2, maxX = d.x + d.width / 2;
    const minY = d.y - d.height / 2, maxY = d.y + d.height / 2;
    return maxX > px1 && minX < px2 && maxY > py1 && minY < py2;
  };

  return decals.filter(d => {
    if (panel === "p1")           return ov(d, x1, x2, yTop, yBot);
    if (panel === "p2")           return ov(d, x2, x3, yTop, yBot);
    if (panel === "p3")           return ov(d, x3, x4, yTop, yBot);
    if (panel === "p4")           return ov(d, x4, x5, yTop, yBot);
    if (panel === "p1_top_cover") return ov(d, x1, x2, yTop - coverDepth, yTop);
    if (panel === "p1_top_lip")   return ov(d, x1, x2, yTop - coverDepth - lipDepth, yTop - coverDepth);
    if (panel === "p3_top_cover") return ov(d, x3, x4, yTop - coverDepth, yTop);
    if (panel === "p3_top_lip")   return ov(d, x3, x4, yTop - coverDepth - lipDepth, yTop - coverDepth);
    if (panel === "p3_bot_cover") return ov(d, x3, x4, yBot, yBot + coverDepth);
    if (panel === "p3_bot_lip")   return ov(d, x3, x4, yBot + coverDepth, yBot + coverDepth + lipDepth);
    if (panel === "p2_top_dust")  return ov(d, x2, x3, yTop - dustH, yTop);
    if (panel === "p2_bot_dust")  return ov(d, x2, x3, yBot, yBot + dustH);
    if (panel === "p4_top_dust")  return ov(d, x4, x5, yTop - dustH, yTop);
    if (panel === "p4_bot_dust")  return ov(d, x4, x5, yBot, yBot + dustH);
    if (panel === "p1_bot_auto")  return ov(d, x1, x2, yBot, yBot + W * 0.75);
    if (panel === "p2_bot_auto")  return ov(d, x2, x3, yBot, yBot + W * 0.75);
    if (panel === "p3_bot_auto")  return ov(d, x3, x4, yBot, yBot + W * 0.75);
    if (panel === "p4_bot_auto")  return ov(d, x4, x5, yBot, yBot + W * 0.75);
    if (panel === "p1_glue")      return ov(d, x1 - W * (16 / 60), x1, yTop, yBot);
    return false;
  });
}

export function getPanelWindowHoles(panel, decals, panelShape, L, W, H, manuL, manuW, manuH, dims, T, offsetX = 0, offsetY = 0) {
  if (!decals || decals.length === 0) return [];
  const windowDecals = decals.filter(d => d.isWindow);
  if (windowDecals.length === 0) return [];
  
  const overlappingWindows = getOverlappingDecals(panel, windowDecals, dims, W, T);
  
  // Compute panel bounding box to prevent earcut triangulation failure
  const pts = panelShape.getPoints();
  const box = new THREE.Box2().setFromPoints(pts);
  const margin = 0.02; // Keep hole slightly inside the outer boundary
  
  return overlappingWindows.map(d => {
    let { cx, cy, scaleX, scaleY } = mapDecalToPanel(d, panel, L, W, H, manuL, manuW, manuH, dims, T);
    cx += offsetX;
    cy += offsetY;
    let windowW = Math.max(0.001, d.width * scaleX);
    let windowH = Math.max(0.001, d.height * scaleY);
    
    // Clamp to panel bounds
    let hw = windowW / 2;
    let hh = windowH / 2;
    
    if (cx - hw < box.min.x + margin) {
      const diff = (box.min.x + margin) - (cx - hw);
      hw -= diff / 2;
      cx += diff / 2;
    }
    if (cx + hw > box.max.x - margin) {
      const diff = (cx + hw) - (box.max.x - margin);
      hw -= diff / 2;
      cx -= diff / 2;
    }
    if (cy - hh < box.min.y + margin) {
      const diff = (box.min.y + margin) - (cy - hh);
      hh -= diff / 2;
      cy += diff / 2;
    }
    if (cy + hh > box.max.y - margin) {
      const diff = (cy + hh) - (box.max.y - margin);
      hh -= diff / 2;
      cy -= diff / 2;
    }
    
    windowW = Math.max(0.001, hw * 2);
    windowH = Math.max(0.001, hh * 2);

    return buildWindowHole(d.shapeType || 'rectangle', windowW, windowH, cx, cy);
  });
}

export function MappedDecals({ panel, decals, L, W, H, manuL, manuW, manuH, dims, T, isFlatGeometry = false, clipMask }) {
  if (!decals || decals.length === 0) return null;
  // Filter out window decals so they don't render as solid shapes
  const printableDecals = decals.filter(d => !d.isWindow);
  if (printableDecals.length === 0) return null;
  
  const panelDecals = printableDecals.filter(d => {
    if (d.custom) return d.panel === panel;
    return getOverlappingDecals(panel, [d], dims, W, T).length > 0;
  });

  return (
    <>
      {panelDecals.map((d, i) => (
        <React.Suspense fallback={null} key={`${d.id}-${i}`}>
          <DecalItem
            decal={d} L={L} W={W} H={H}
            manuL={manuL} manuW={manuW} manuH={manuH}
            dims={dims} panel={panel} T={T}
            index={decals.findIndex(dec => dec.id === d.id)}
            isFlatGeometry={isFlatGeometry}
            clipMask={clipMask}
          />
        </React.Suspense>
      ))}
    </>
  );
}
