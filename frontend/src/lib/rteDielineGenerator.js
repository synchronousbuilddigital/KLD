export function generateRTEDielineLegacy({ L, W, H, T = 0.018, glueFlapWidth = 0.625, bleed = 0.125 }) {
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

  const coverD = nW; 
  const lipD = 0.625; 
  const flap1D = coverD + lipD; 
  
  // DYNAMIC THICKNESS OFFSETS
  const actualDustD = (coverD + lipD) / 2; 
  const glueStepBack = Math.max(0.125, T * 1.2);
  
  // FLAP PROPORTIONS
  const tR     = Math.max(0.03, Math.min(0.125, nL * 0.15));
  const tIns   = Math.max(0.0625, Math.min(T * 2, nL * 0.12)); 
  const tDraft = Math.max(0.03, Math.min(0.0625, nL * 0.08));
  
  const gap = Math.max(0.0625, T * 1.5);
  const vRoot = 0.03125;
  const vDrop = 0.125;

  const lockW = 0.08;
  const lockH = 0.06;

  const yTop = coverD + lipD; 
  const yBot = yTop + nH;

  const glueStepY = Math.min(0.25 * nW, 0.25 * nH, 0.5 * nGlue, 0.25);
  const outerR = Math.min(0.125, nGlue * 0.25);
  const innerR = Math.min(0.125, nGlue * 0.25);

  // --- MANUFACTURER'S JOINT ---
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

  // --- BIG TUCK FLAP (Friction Lock Tabs matching Pacdora exactly) ---
  function tuckPath(xL, xR, yBase, dir) {
    const dY = dir === 1 ? -1 : 1;
    const yCrease = yBase + dY * coverD;
    
    if (dir === 1) { 
      // Top Tuck (Panel 1) - Left to Right
      return `M ${xL},${yBase} ` +
             `L ${xL + tIns},${yBase} ` +
             `L ${xL + tIns},${yCrease + lockH} ` +
             `L ${xL + tIns + lockW},${yCrease + lockH} ` +
             `L ${xL + tIns + lockW},${yCrease - lockH} ` +
             `L ${xL + tIns},${yCrease - lockH} ` +
             `L ${xL + tIns + tDraft},${yCrease - lipD + tR} ` +
             `A ${tR} ${tR} 0 0 1 ${xL + tIns + tDraft + tR} ${yCrease - lipD} ` +
             `L ${xR - tIns - tDraft - tR},${yCrease - lipD} ` +
             `A ${tR} ${tR} 0 0 1 ${xR - tIns - tDraft} ${yCrease - lipD + tR} ` +
             `L ${xR - tIns},${yCrease - lockH} ` +
             `L ${xR - tIns - lockW},${yCrease - lockH} ` +
             `L ${xR - tIns - lockW},${yCrease + lockH} ` +
             `L ${xR - tIns},${yCrease + lockH} ` +
             `L ${xR - tIns},${yBase} ` +
             `L ${xR},${yBase}`;
    } else { 
      // Bottom Tuck (Panel 3) - Right to Left
      return `M ${xR},${yBase} ` +
             `L ${xR - tIns},${yBase} ` +
             `L ${xR - tIns},${yCrease - lockH} ` +
             `L ${xR - tIns - lockW},${yCrease - lockH} ` +
             `L ${xR - tIns - lockW},${yCrease + lockH} ` +
             `L ${xR - tIns},${yCrease + lockH} ` +
             `L ${xR - tIns - tDraft},${yCrease + lipD - tR} ` +
             `A ${tR} ${tR} 0 0 1 ${xR - tIns - tDraft - tR} ${yCrease + lipD} ` +
             `L ${xL + tIns + tDraft + tR},${yCrease + lipD} ` +
             `A ${tR} ${tR} 0 0 1 ${xL + tIns + tDraft} ${yCrease + lipD - tR} ` +
             `L ${xL + tIns},${yCrease + lockH} ` +
             `L ${xL + tIns + lockW},${yCrease + lockH} ` +
             `L ${xL + tIns + lockW},${yCrease + lockH} ` +
             `L ${xL + tIns + lockW},${yCrease - lockH} ` +
             `L ${xL + tIns},${yCrease - lockH} ` +
             `L ${xL + tIns},${yBase} ` +
             `L ${xL},${yBase}`;
    }
  }

  // --- SMALL DUST FLAP (Smooth curves and custom slants to match CAD) ---
  function dustPath(xL, xR, yBase, dir, sweepSide, isFarRight = false) {
    const dY = dir === 1 ? -1 : 1;
    const w = xR - xL;
    
    const topR = Math.min(0.125, w * 0.1);
    const slant = Math.min(0.25, w * 0.15);

    if (dir === 1) { 
      if (sweepSide === 'both') {
        const rSlant = isFarRight ? 0 : slant; 
        const rGap = isFarRight ? 0 : gap;
        const rDrop = isFarRight ? 0 : vDrop;

        return `M ${xL},${yBase} ` +
               `Q ${xL + gap * 0.5},${yBase + dY * vDrop} ${xL + gap + slant},${yBase + dY * (actualDustD - topR)} ` +
               `A ${topR} ${topR} 0 0 1 ${xL + gap + slant + topR} ${yBase + dY * actualDustD} ` +
               `L ${xR - rGap - rSlant - topR},${yBase + dY * actualDustD} ` + 
               `A ${topR} ${topR} 0 0 1 ${xR - rGap - rSlant} ${yBase + dY * (actualDustD - topR)} ` + 
               (isFarRight ? `L ${xR},${yBase}` : `Q ${xR - rGap * 0.5},${yBase + dY * rDrop} ${xR},${yBase}`);                                                                 
      } else if (sweepSide === 'right') { 
        const rSlant = isFarRight ? 0 : slant; 
        const rGap = isFarRight ? 0 : gap;
        const rDrop = isFarRight ? 0 : vDrop;

        return `M ${xL},${yBase} ` +
               `L ${xL},${yBase + dY * actualDustD} ` + 
               `L ${xR - rGap - rSlant - topR},${yBase + dY * actualDustD} ` + 
               `A ${topR} ${topR} 0 0 1 ${xR - rGap - rSlant} ${yBase + dY * (actualDustD - topR)} ` + 
               (isFarRight ? `L ${xR},${yBase}` : `Q ${xR - rGap * 0.5},${yBase + dY * rDrop} ${xR},${yBase}`);                                                                 
      } else { 
        return `M ${xL},${yBase} ` +
               `Q ${xL + gap * 0.5},${yBase + dY * vDrop} ${xL + gap + slant},${yBase + dY * (actualDustD - topR)} ` +
               `A ${topR} ${topR} 0 0 1 ${xL + gap + slant + topR} ${yBase + dY * actualDustD} ` +
               `L ${xR},${yBase + dY * actualDustD} ` + 
               `L ${xR},${yBase}`;
      }
    } else { 
      if (sweepSide === 'both') {
        const rSlant = isFarRight ? 0 : slant; 
        const rGap = isFarRight ? 0 : gap;
        const rDrop = isFarRight ? 0 : vDrop;

        return `M ${xR},${yBase} ` +
               (isFarRight ? `L ${xR},${yBase + dY * (actualDustD - topR)} ` : `Q ${xR - rGap * 0.5},${yBase + dY * rDrop} ${xR - rGap - rSlant},${yBase + dY * (actualDustD - topR)} `) +
               `A ${topR} ${topR} 0 0 1 ${xR - rGap - rSlant - topR} ${yBase + dY * actualDustD} ` +
               `L ${xL + gap + slant + topR},${yBase + dY * actualDustD} ` +
               `A ${topR} ${topR} 0 0 1 ${xL + gap + slant} ${yBase + dY * (actualDustD - topR)} ` +
               `Q ${xL + gap * 0.5},${yBase + dY * vDrop} ${xL},${yBase}`;
      } else if (sweepSide === 'right') { 
        const rSlant = isFarRight ? 0 : slant; 
        const rGap = isFarRight ? 0 : gap;
        const rDrop = isFarRight ? 0 : vDrop;

        return `M ${xR},${yBase} ` +
               (isFarRight ? `L ${xR},${yBase + dY * (actualDustD - topR)} ` : `Q ${xR - rGap * 0.5},${yBase + dY * rDrop} ${xR - rGap - rSlant},${yBase + dY * (actualDustD - topR)} `) +
               `A ${topR} ${topR} 0 0 1 ${xR - rGap - rSlant - topR} ${yBase + dY * actualDustD} ` +
               `L ${xL},${yBase + dY * actualDustD} ` +
               `L ${xL},${yBase}`;
      } else { 
        return `M ${xR},${yBase} ` +
               `L ${xR},${yBase + dY * actualDustD} ` + 
               `L ${xL + gap + slant + topR},${yBase + dY * actualDustD} ` +
               `A ${topR} ${topR} 0 0 1 ${xL + gap + slant} ${yBase + dY * (actualDustD - topR)} ` +
               `Q ${xL + gap * 0.5},${yBase + dY * vDrop} ${xL},${yBase}`;
      }
    }
  }

  // --- DYNAMIC THICKNESS-COMPENSATING BLEED PATH (perfect parallel contour) ---
  function buildContinuousBleed(b) {
    if (b === 0) return [];
    const tb = tR + b;
    let p = `M ${x1},${yTop - b} `;

    // 1. Panel 1 Top Tuck (Left to Right)
    const slnx = Math.abs((-lipD + tR + lockH) / Math.sqrt(tDraft*tDraft + (-lipD + tR + lockH)**2));
    const slny = Math.abs(tDraft / Math.sqrt(tDraft*tDraft + (-lipD + tR + lockH)**2));
    
    p += `L ${x1 + tIns - b},${yTop - b} `;
    p += `L ${x1 + tIns - b},${yTop - coverD + lockH} `;
    p += `L ${x1 + tIns + lockW - b},${yTop - coverD + lockH - b} `;
    p += `L ${x1 + tIns + lockW - b},${yTop - coverD - lockH + b} `;
    p += `L ${x1 + tIns - b},${yTop - coverD - lockH + b} `;
    p += `L ${x1 + tIns - b*slnx},${yTop - coverD - lockH - b*slny} `; // LEFT, UP
    p += `L ${x1 + tIns + tDraft - b*slnx},${yTop - coverD - lipD + tR - b*slny} `;
    p += `A ${tb} ${tb} 0 0 1 ${x1 + tIns + tDraft + tR} ${yTop - coverD - lipD - b} `;
    p += `L ${x2 - tIns - tDraft - tR},${yTop - coverD - lipD - b} `;
    p += `A ${tb} ${tb} 0 0 1 ${x2 - tIns - tDraft + b*slnx} ${yTop - coverD - lipD + tR - b*slny} `; // RIGHT, UP
    p += `L ${x2 - tIns + b*slnx},${yTop - coverD - lockH - b*slny} `;
    p += `L ${x2 - tIns + b},${yTop - coverD - lockH + b} `;
    p += `L ${x2 - tIns - lockW + b},${yTop - coverD - lockH - b} `;
    p += `L ${x2 - tIns - lockW + b},${yTop - coverD + lockH + b} `;
    p += `L ${x2 - tIns + b},${yTop - coverD + lockH + b} `;
    p += `L ${x2 - tIns + b},${yTop - coverD + lockH + b} `;
    
    // Intersection between Tuck (Panel 1) and Dust (Panel 2)
    const cx1 = Math.min(x2 + b, x2 + gap - b);
    p += `L ${cx1},${yTop - b} `;

    // 2. Panel 2 Top Dust Flap
    const dW2 = x3 - x2;
    const dTopR2 = Math.min(0.125, dW2 * 0.1);
    const dSlant2 = Math.min(0.25, dW2 * 0.15);
    const dtb2 = dTopR2 + b;
    
    // 2. Panel 2 Top Dust Flap
    p += `L ${cx1},${yTop + T - actualDustD + dTopR2 - b} `;
    p += `A ${dtb2} ${dtb2} 0 0 1 ${x2 + gap + dSlant2 + dTopR2} ${yTop + T - actualDustD - b} `;
    p += `L ${x3 - gap - dSlant2 - dTopR2},${yTop + T - actualDustD - b} `;
    p += `A ${dtb2} ${dtb2} 0 0 1 ${x3 - gap + b} ${yTop + T - actualDustD + dTopR2 - b} `;
    
    // 3. Panel 3 Top Straight
    const cx2 = Math.min(x3 + b, x4 - b, x4 + gap - b); 
    p += `L ${cx2},${yTop - b} `;
    
    // 4. Panel 4 Top Dust Flap
    const dW4 = x5 - x4;
    const dTopR4 = Math.min(0.125, dW4 * 0.1);
    const dSlant4 = Math.min(0.25, dW4 * 0.15);
    const dtb4 = dTopR4 + b;
    
    // 4. Panel 4 Top Dust Flap
    p += `L ${cx2},${yTop + T - actualDustD + dTopR4 - b} `;
    p += `A ${dtb4} ${dtb4} 0 0 1 ${x4 + gap + dSlant4 + dTopR4} ${yTop + T - actualDustD - b} `;
    p += `L ${x5 - dTopR4},${yTop + T - actualDustD - b} `;
    p += `A ${dtb4} ${dtb4} 0 0 1 ${x5 + b} ${yTop + T - actualDustD + dTopR4 - b} `;
    p += `L ${x5 + b},${yTop - b} `;
    
    // 5. Right Edge
    p += `L ${x5 + b},${yBot + b} `;
    
    // 6. Panel 4 Bottom Dust Flap
    p += `L ${x5 + b},${yBot - T + actualDustD - dTopR4 + b} `;
    p += `A ${dtb4} ${dtb4} 0 0 1 ${x5 - dTopR4} ${yBot - T + actualDustD + b} `;
    p += `L ${x4 + gap + dSlant4 + dTopR4},${yBot - T + actualDustD + b} `;
    p += `A ${dtb4} ${dtb4} 0 0 1 ${x4 + gap - b} ${yBot - T + actualDustD - dTopR4 + b} `;
    
    // Intersection between Dust (Panel 4) and Tuck (Panel 3)
    const cx3 = Math.max(x4 + gap - b, x4 + b);
    p += `L ${cx3},${yBot + b} `;
    
    // 7. Panel 3 Bottom Tuck
    p += `L ${cx3},${yBot + coverD - lockH} `;
    p += `L ${x4 - tIns - lockW + b},${yBot + coverD - lockH + b} `;
    p += `L ${x4 - tIns - lockW + b},${yBot + coverD + lockH - b} `;
    p += `L ${x4 - tIns + b},${yBot + coverD + lockH - b} `;
    p += `L ${x4 - tIns + b*slnx},${yBot + coverD + lockH + b*slny} `; // RIGHT, DOWN
    p += `L ${x4 - tIns - tDraft + b*slnx},${yBot + coverD + lipD - tR + b*slny} `;
    p += `A ${tb} ${tb} 0 0 1 ${x4 - tIns - tDraft - tR} ${yBot + coverD + lipD + b} `;
    p += `L ${x3 + tIns + tDraft + tR},${yBot + coverD + lipD + b} `;
    p += `A ${tb} ${tb} 0 0 1 ${x3 + tIns + tDraft - b*slnx} ${yBot + coverD + lipD - tR + b*slny} `; // LEFT, DOWN
    p += `L ${x3 + tIns - b*slnx},${yBot + coverD + lockH + b*slny} `;
    p += `L ${x3 + tIns - b},${yBot + coverD + lockH - b} `;
    p += `L ${x3 + tIns + lockW - b},${yBot + coverD + lockH - b} `;
    p += `L ${x3 + tIns + lockW - b},${yBot + coverD - lockH + b} `;
    p += `L ${x3 + tIns - b},${yBot + coverD - lockH + b} `;
    p += `L ${x3 + tIns - b},${yBot + coverD - lockH + b} `;
    
    // Intersection between Tuck (Panel 3) and Dust (Panel 2)
    const cx4 = Math.max(x3 - b, x3 - gap + b);
    p += `L ${cx4},${yBot + b} `;

    // 8. Panel 2 Bottom Dust Flap
    p += `L ${cx4},${yBot - T + actualDustD - dTopR2 + b} `;
    p += `A ${dtb2} ${dtb2} 0 0 1 ${x3 - gap - dSlant2 - dTopR2} ${yBot - T + actualDustD + b} `;
    p += `L ${x2 + gap + dSlant2 + dTopR2},${yBot - T + actualDustD + b} `;
    p += `A ${dtb2} ${dtb2} 0 0 1 ${x2 + gap - b} ${yBot - T + actualDustD - dTopR2 + b} `;
    p += `L ${x2 + gap - b},${yBot + b} `;
    
    // 9. Panel 1 Bottom straight
    p += `L ${x1},${yBot + b} `;
    
    // 10. Glue Flap Edge
    p += `L ${x1 - b},${yBot - glueStepY + b} `;
    p += `L ${x0 - b},${yBot - glueStepY + b} `;
    p += `L ${x0 - b},${yTop + glueStepY - b} `;
    p += `L ${x1 - b},${yTop + glueStepY - b} `;
    p += `L ${x1},${yTop - b} `;
    p += `Z`;

    return [p];
  }

  const cutPaths = [
    gluePath(),
    
    // Top Profile (Left to Right)
    tuckPath(x1, x2, yTop, 1),
    
    `M ${x2},${yTop} L ${x2},${yTop + T}`,
    dustPath(x2, x3, yTop + T, 1, 'both', false),
    `M ${x3},${yTop + T} L ${x3},${yTop}`,
    
    `M ${x3},${yTop} L ${x4},${yTop}`,
    
    `M ${x4},${yTop} L ${x4},${yTop + T}`,
    dustPath(x4, x5, yTop + T, 1, 'left', true),
    
    // Right Edge
    `M ${x5},${yTop + T} L ${x5},${yBot - T}`, 
    
    // Bottom Profile (Drawn Right to Left)
    dustPath(x4, x5, yBot - T, -1, 'left', true), 
    `M ${x4},${yBot - T} L ${x4},${yBot}`, 
    tuckPath(x3, x4, yBot, -1), 
    `M ${x3},${yBot} L ${x3},${yBot - T}`, 
    dustPath(x2, x3, yBot - T, -1, 'both', false), 
    `M ${x2},${yBot - T} L ${x2},${yBot}`, 
    `M ${x2},${yBot} L ${x1},${yBot}` 
  ];

  // The horizontal folds mapped to perfectly accommodate thickness steps
  const foldLines = [
    // Vertical Folds 
    { x1: x1, y1: yTop, x2: x1, y2: yBot }, 
    { x1: x2, y1: yTop + T, x2: x2, y2: yBot - T },
    { x1: x3, y1: yTop + T, x2: x3, y2: yBot - T }, 
    { x1: x4, y1: yTop + T, x2: x4, y2: yBot - T },
    
    // Horizontal Panel Folds
    { x1: x1, y1: yTop, x2: x2, y2: yTop },           
    { x1: x2, y1: yTop + T, x2: x3, y2: yTop + T },   
    { x1: x3, y1: yTop, x2: x4, y2: yTop },           
    { x1: x4, y1: yTop + T, x2: x5, y2: yTop + T },   
    
    { x1: x1, y1: yBot, x2: x2, y2: yBot },           
    { x1: x2, y1: yBot - T, x2: x3, y2: yBot - T },   
    { x1: x3, y1: yBot, x2: x4, y2: yBot },           
    { x1: x4, y1: yBot - T, x2: x5, y2: yBot - T },   
    
    // Tuck Lip Folds (friction-lock bounded)
    { x1: x1 + tIns + lockW, y1: yTop - coverD, x2: x2 - tIns - lockW, y2: yTop - coverD }, 
    { x1: x3 + tIns + lockW, y1: yBot + coverD, x2: x4 - tIns - lockW, y2: yBot + coverD }  
  ];

  return {
    width: x5, height: yBot + coverD + lipD, cutPaths,
    bleedPaths: buildContinuousBleed(nBleed), foldLines,
    dimensions: { L: nL, W: nW, H: nH, x1, x2, x3, x4, x5, yTop, yBot, dustD: actualDustD }
  };
}

import { generateRTEDielineDXF } from "./dxfDielineGenerator";
export { generateRTEDielineDXF };

export function generateRTEDieline(params) {
  const { method = "dxf" } = params;
  if (method === "legacy") {
    return generateRTEDielineLegacy(params);
  }
  return generateRTEDielineDXF(params);
}