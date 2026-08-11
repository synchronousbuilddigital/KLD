export function generateAutoLockDieline({ L, W, H, T = 0.018, glueFlapWidth = 0.625, bleed = 0.125, windowDecals }) {
  const nL = Number(L);
  const nW = Number(W);
  const nH = Number(H);
  const nGlue = Number(glueFlapWidth);
  const nBleed = Number(bleed);

  const x0 = 0;
  const x1 = nGlue;
  const x2 = x1 + nL;
  const x3 = x2 + nW;
  const x4 = x3 + nL;
  const x5 = x4 + nW;

  const yTop = nW * 1.3; 
  const yBot = yTop + nH;

  const glueStepY = Math.min(0.25 * nW, 0.25 * nH, 0.5 * nGlue, 0.25);
  const outerR = Math.min(0.125, nGlue * 0.25);
  const innerR = Math.min(0.125, nGlue * 0.25);

  // --- MANUFACTURER'S JOINT (Stepped Flap, same as RTE) ---
  function gluePath() {
    return `M ${x1},${yTop} ` +
           `L ${x1},${yTop + glueStepY - innerR} ` +
           `A ${innerR} ${innerR} 0 0 1 ${x1 - innerR},${yTop + glueStepY} ` +
           `L ${x0 + outerR},${yTop + glueStepY} ` +
           `A ${outerR} ${outerR} 0 0 0 ${x0},${yTop + glueStepY + outerR} ` +
           `L ${x0},${yBot - glueStepY - outerR} ` +
           `A ${outerR} ${outerR} 0 0 0 ${x0 + outerR},${yBot - glueStepY} ` +
           `L ${x1 - innerR},${yBot - glueStepY} ` +
           `A ${innerR} ${innerR} 0 0 1 ${x1},${yBot - glueStepY + innerR} ` +
           `L ${x1},${yBot}`;
  }

  // --- BIG TUCK FLAP (Clean rectangle with large rounded corners, no taper) ---
  const lipD = 0.625;
  const hTopPanel = nW;
  const topFlapH = hTopPanel + lipD;
  const tuckCornerR = Math.min(0.25, nW * 0.12, nL * 0.12);

  function topTuckPath() {
    return `M ${x1},${yTop} ` +
           `L ${x1},${yTop - topFlapH + tuckCornerR} ` +
           `A ${tuckCornerR} ${tuckCornerR} 0 0 1 ${x1 + tuckCornerR},${yTop - topFlapH} ` +
           `L ${x2 - tuckCornerR},${yTop - topFlapH} ` +
           `A ${tuckCornerR} ${tuckCornerR} 0 0 1 ${x2},${yTop - topFlapH + tuckCornerR} ` +
           `L ${x2},${yTop}`;
  }

  // --- DUST FLAPS (half tuck height, pentagon with chamfered top corners) ---
  const dustH = topFlapH / 2;
  const chamferOuter = Math.min(0.25, nW * 0.12);  // smaller chamfer on outer edge (away from Panel 3)
  const chamferInner = Math.min(0.35, nW * 0.20);  // larger chamfer on inner edge (toward Panel 3)

  function topDustPathP2() {
    // Pentagon: straight up both sides, 45° chamfer on both top corners
    // Left (outer, x2 side): smaller chamfer
    // Right (inner, x3 side): larger chamfer
    return `M ${x2},${yTop} ` +
           `L ${x2},${yTop - dustH + chamferOuter} ` +
           `L ${x2 + chamferOuter},${yTop - dustH} ` +
           `L ${x3 - chamferInner},${yTop - dustH} ` +
           `L ${x3},${yTop - dustH + chamferInner} ` +
           `L ${x3},${yTop}`;
  }

  function topDustPathP4() {
    // Pentagon: mirror of P2
    // Left (inner, x4 side): larger chamfer
    // Right (outer, x5 side): smaller chamfer
    return `M ${x4},${yTop} ` +
           `L ${x4},${yTop - dustH + chamferInner} ` +
           `L ${x4 + chamferInner},${yTop - dustH} ` +
           `L ${x5 - chamferOuter},${yTop - dustH} ` +
           `L ${x5},${yTop - dustH + chamferOuter} ` +
           `L ${x5},${yTop}`;
  }

  // --- CRASH LOCK BOTTOM FLAPS (Identical P1 and P3, matching standard layout) ---
  const hookD = nW * 0.75;
  const midD = nW * 0.5;

  function makeMainBottom(xStart, width) {
    const xEnd = xStart + width;
    
    // Proportional dimensions to ensure it fits even if L is small
    const hDrop1 = nW * 0.15;
    const hDrop2 = nW * 0.3;
    const inX = xStart + Math.min(nW * 0.15, width * 0.25);
    const hookX = xStart + Math.min(nW * 0.35, width * 0.6);
    const hookUpX = xStart + Math.min(nW * 0.45, width * 0.7);
    
    return `M ${xStart},${yBot} ` +
           `L ${xStart},${yBot + hDrop1} ` + 
           `L ${inX},${yBot + hDrop2} ` +     
           `L ${inX},${yBot + hookD} ` +
           `L ${hookX},${yBot + hookD} ` +
           `L ${hookUpX},${yBot + midD} ` + 
           `L ${xEnd - Math.min(0.05 * nW, width * 0.1)},${yBot + midD} ` +
           `L ${xEnd - Math.min(0.01 * nW, width * 0.02)},${yBot + 0.02 * nW} ` + 
           `L ${xEnd},${yBot}`;
  }

  function makeGusset(xStart, width) {
    const xEnd = xStart + width;
    const depth = nW * 0.45; // slightly shorter than midD so it doesn't collide
    const inset = Math.min(nW * 0.15, width * 0.2);
    
    return `M ${xStart},${yBot} ` +
           `L ${xStart + inset},${yBot + depth} ` +
           `L ${xEnd - inset},${yBot + depth} ` +
           `L ${xEnd},${yBot}`;
  }

  function buildContinuousBleed(b) {
    if (b === 0) return [];
    
    // Top envelope: wraps tuck flap (P1) and dust flaps (P2, P4)
    let pb = `M ${x1},${yTop - b} ` +
             `L ${x1 - b},${yTop - b} ` +
             `L ${x1 - b},${yTop - topFlapH - b} ` +
             `L ${x2 + b},${yTop - topFlapH - b} ` +
             `L ${x3 + b},${yTop - dustH - b} ` + 
             `L ${x3 + b},${yTop - b} ` +
             `L ${x4 - b},${yTop - b} ` +
             `L ${x4 - b},${yTop - dustH - b} ` +
             `L ${x5 + b},${yTop - dustH - b} ` +
             `L ${x5 + b},${yTop - b} `;
             
    // Right Edge
    pb += `L ${x5 + b},${yBot + b} `;
    
    // Bottom Envelope
    pb += `L ${x5 + b},${yBot + hookD + b} `;
    pb += `L ${x1 - b},${yBot + hookD + b} `;
    
    // Glue Flap Edge (stepped)
    pb += `L ${x1 - b},${yBot - glueStepY + b} `;
    pb += `L ${x0 - b},${yBot - glueStepY + b} `;
    pb += `L ${x0 - b},${yTop + glueStepY - b} `;
    pb += `L ${x1 - b},${yTop + glueStepY - b} `;
    pb += `L ${x1},${yTop - b} Z`;
    
    return [pb];
  }

  const cutPaths = [
    gluePath(),
    topTuckPath(),
    topDustPathP2(),
    `M ${x3},${yTop} L ${x4},${yTop}`, // Panel 3 has no top flap, so it's a straight cut line
    topDustPathP4(),
    
    `M ${x5},${yTop} L ${x5},${yBot}`, // Right edge vertical cut line

    makeMainBottom(x1, nL),
    makeGusset(x2, nW),
    makeMainBottom(x3, nL),
    makeGusset(x4, nW),
  ];

  if (windowDecals && windowDecals.length > 0) {
    windowDecals.forEach((windowDecal) => {
      const cx = windowDecal.x;
      const cy = windowDecal.y;
      const w = windowDecal.width;
      const h = windowDecal.height;
      
      let path = "";
      if (windowDecal.shapeType === "circle") {
        const r = Math.min(w, h) / 2;
        path = `M ${cx - r},${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy}`;
      } else if (windowDecal.shapeType === "triangle") {
        path = `M ${cx},${cy - h/2} L ${cx + w/2},${cy + h/2} L ${cx - w/2},${cy + h/2} Z`;
      } else if (windowDecal.shapeType === "star") {
        const outerR = Math.min(w, h) / 2;
        const innerR = outerR * 0.382;
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
          const ptX = cx + radius * Math.cos(angle);
          const ptY = cy + radius * Math.sin(angle);
          if (i === 0) path += `M ${ptX},${ptY} `;
          else path += `L ${ptX},${ptY} `;
        }
        path += "Z";
      } else if (windowDecal.shapeType === "heart") {
        const size = Math.min(w, h) / 2;
        path = `M ${cx},${cy - size * 0.2} C ${cx + size*0.5},${cy - size*0.8} ${cx + size},${cy - size*0.5} ${cx + size},${cy} C ${cx + size},${cy + size*1.5} ${cx},${cy + size*1.5} ${cx},${cy + size*1.5} C ${cx},${cy + size*1.5} ${cx - size},${cy + size*1.5} ${cx - size},${cy} C ${cx - size},${cy - size*0.5} ${cx - size*0.5},${cy - size*0.8} ${cx},${cy - size * 0.2} Z`;
      } else {
        path = `M ${cx - w/2},${cy - h/2} L ${cx + w/2},${cy - h/2} L ${cx + w/2},${cy + h/2} L ${cx - w/2},${cy + h/2} Z`;
      }
      cutPaths.push(path);
    });
  }

  const foldLines = [
    // Vertical creases (all go from yTop to yBot cleanly)
    { x1: x1, y1: yTop, x2: x1, y2: yBot },
    { x1: x2, y1: yTop, x2: x2, y2: yBot },
    { x1: x3, y1: yTop, x2: x3, y2: yBot },
    { x1: x4, y1: yTop, x2: x4, y2: yBot },
    
    // Horizontal Panel Folds (Top)
    { x1: x1, y1: yTop, x2: x2, y2: yTop }, // Panel 1 top flap fold
    { x1: x2, y1: yTop, x2: x3, y2: yTop }, // Panel 2 top dust fold
    // Note: Panel 3 has NO top fold because there's no flap, it's a cut line!
    { x1: x4, y1: yTop, x2: x5, y2: yTop }, // Panel 4 top dust fold
    
    // Bottom Horizontal Creases (All panels have bottom flaps)
    { x1: x1, y1: yBot, x2: x5, y2: yBot },
    
    // Tuck lip crease (separates the cover panel from the tuck lip)
    { x1: x1, y1: yTop - hTopPanel, x2: x2, y2: yTop - hTopPanel }, 
    
    // Auto-bottom 45-degree creases (Right sides of MAIN panels, down-left)
    { x1: x2, y1: yBot, x2: x2 - 0.5 * nW, y2: yBot + 0.5 * nW },
    { x1: x4, y1: yBot, x2: x4 - 0.5 * nW, y2: yBot + 0.5 * nW }
  ];

  return {
    width: x5, 
    height: yBot + hookD, 
    cutPaths,
    bleedPaths: buildContinuousBleed(nBleed), 
    foldLines,
    dimensions: { L: nL, W: nW, H: nH, x1, x2, x3, x4, x5, yTop, yBot }
  };
}
