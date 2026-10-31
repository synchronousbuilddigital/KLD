/**
 * FEFCO 0300 Shoe Box with Lid Parametric Dieline Generator
 * ─────────────────────────────────────────────────────────────────────────────
 * Two-piece telescope box:
 * 1. Base Tray (Bottom piece): Stationary floor + 4 walls + 4 corner glue tabs
 * 2. Lid Tray (Top piece): Telescoping roof + 4 walls + 4 corner glue tabs
 * 
 * Input dimensions (L, W, H, T, bleed) in inches (converted to mm internally).
 * Default nominal size: 11.8898" × 8.0315" × 2.4016" (302 × 204 × 61 mm).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MM_TO_IN = 25.4;

export function generateFEFCO0300Dieline({
  L = 11.8898, // Base length in inches
  W = 8.0315,  // Base width in inches
  H = 2.4016,  // Base height in inches
  T = 0.059,   // Board thickness (E-flute ~1.5mm)
  bleed = 0.125
}) {
  const nL = Number(L);
  const nW = Number(W);
  const nH = Number(H);
  const nT = Number(T) || 0.059;
  const nBleed = Number(bleed) || 0.125;

  // Convert to mm for precision geometry
  const bL = nL * MM_TO_IN; // e.g. 302 mm
  const bW = nW * MM_TO_IN; // e.g. 204 mm
  const bH = nH * MM_TO_IN; // e.g. 61 mm
  const bT = nT * MM_TO_IN; // e.g. 1.5 mm
  const bBleed = nBleed * MM_TO_IN; // e.g. 3.175 mm

  // Telescope clearances (from FEFCO standard & CAD):
  // Lid is slightly larger to telescope smoothly over base
  const lidL = bL + 6.0;   // e.g. 308 mm
  const lidW = bW + 5.5;   // e.g. 209.5 mm
  const lidH = bH + 1.5;   // e.g. 62.5 mm

  const slit = Math.max(2.5, bT * 2.0); // 3mm slit between flap and wall
  const gapBetweenPieces = 15.0; // 15mm gap between Base and Lid

  // ── 1. BASE TRAY GEOMETRY (LEFT PIECE) ─────────────────────────
  // Offset margin from 0
  const baseX0 = 25.0;
  const baseY0 = 65.0;

  // Key X coordinates of Base:
  // Left wall outer edge: baseX0 + (gap / margin) -> let's say base Left Wall is at baseX0 + 5
  const b_xLeft = baseX0 + 5.0;            // e.g. 30.0 mm
  const b_xFloorL = b_xLeft + bH;          // e.g. 91.0 mm (fold line)
  const b_xFloorR = b_xFloorL + bL;        // e.g. 393.0 mm (fold line)
  const b_xRight = b_xFloorR + bH;         // e.g. 454.0 mm

  // Key Y coordinates of Base:
  const b_yBot = baseY0 + 5.25;            // e.g. 70.25 mm
  const b_yFloorB = b_yBot + bH;           // e.g. 131.25 mm (fold line)
  const b_yFloorT = b_yFloorB + bW;        // e.g. 335.25 mm (fold line)
  const b_yTop = b_yFloorT + bH;           // e.g. 396.25 mm

  // Base Glue Flap cuts (chamfered corner flaps on Left & Right walls)
  const b_flapChamfer = Math.min(bH * 0.15, 6.0);

  // Base Cut Path
  const baseCutCmds = [
    `M ${b_xLeft.toFixed(3)},${b_yTop.toFixed(3)}`,
    // Top-left glue flap top edge
    `L ${(b_xFloorL - slit / 2).toFixed(3)},${b_yTop.toFixed(3)}`,
    // Slit down
    `L ${(b_xFloorL - slit / 2).toFixed(3)},${(b_yFloorT + 0.5).toFixed(3)}`,
    // Slit up to top wall
    `L ${(b_xFloorL + slit / 2).toFixed(3)},${(b_yFloorT + 0.5).toFixed(3)}`,
    `L ${(b_xFloorL + slit / 2).toFixed(3)},${b_yTop.toFixed(3)}`,
    // Top wall top edge
    `L ${(b_xFloorR - slit / 2).toFixed(3)},${b_yTop.toFixed(3)}`,
    // Slit down
    `L ${(b_xFloorR - slit / 2).toFixed(3)},${(b_yFloorT + 0.5).toFixed(3)}`,
    // Slit up to top-right flap
    `L ${(b_xFloorR + slit / 2).toFixed(3)},${(b_yFloorT + 0.5).toFixed(3)}`,
    `L ${(b_xFloorR + slit / 2).toFixed(3)},${b_yTop.toFixed(3)}`,
    // Top-right glue flap
    `L ${b_xRight.toFixed(3)},${b_yTop.toFixed(3)}`,
    // Right wall right edge
    `L ${b_xRight.toFixed(3)},${b_yBot.toFixed(3)}`,
    // Bot-right glue flap
    `L ${(b_xFloorR + slit / 2).toFixed(3)},${b_yBot.toFixed(3)}`,
    // Slit up
    `L ${(b_xFloorR + slit / 2).toFixed(3)},${(b_yFloorB - 0.5).toFixed(3)}`,
    // Slit down to bottom wall
    `L ${(b_xFloorR - slit / 2).toFixed(3)},${(b_yFloorB - 0.5).toFixed(3)}`,
    `L ${(b_xFloorR - slit / 2).toFixed(3)},${b_yBot.toFixed(3)}`,
    // Bottom wall bottom edge
    `L ${(b_xFloorL + slit / 2).toFixed(3)},${b_yBot.toFixed(3)}`,
    // Slit up
    `L ${(b_xFloorL + slit / 2).toFixed(3)},${(b_yFloorB - 0.5).toFixed(3)}`,
    // Slit down to bot-left flap
    `L ${(b_xFloorL - slit / 2).toFixed(3)},${(b_yFloorB - 0.5).toFixed(3)}`,
    `L ${(b_xFloorL - slit / 2).toFixed(3)},${b_yBot.toFixed(3)}`,
    // Bot-left glue flap
    `L ${b_xLeft.toFixed(3)},${b_yBot.toFixed(3)}`,
    `Z`
  ];

  // Base Fold Lines
  const baseFolds = [
    // Left wall fold
    { x1: b_xFloorL, y1: b_yFloorB, x2: b_xFloorL, y2: b_yFloorT },
    // Right wall fold
    { x1: b_xFloorR, y1: b_yFloorB, x2: b_xFloorR, y2: b_yFloorT },
    // Top wall fold
    { x1: b_xFloorL + 1.4, y1: b_yFloorT, x2: b_xFloorR - 1.4, y2: b_yFloorT },
    // Bottom wall fold
    { x1: b_xFloorL + 1.4, y1: b_yFloorB, x2: b_xFloorR - 1.4, y2: b_yFloorB },
    // 4 glue flap fold lines (attached to Left and Right walls)
    { x1: b_xLeft, y1: b_yFloorT - 1.0, x2: b_xFloorL, y2: b_yFloorT - 1.0 }, // Top-Left flap
    { x1: b_xLeft, y1: b_yFloorB + 1.0, x2: b_xFloorL, y2: b_yFloorB + 1.0 }, // Bot-Left flap
    { x1: b_xFloorR, y1: b_yFloorT - 1.0, x2: b_xRight, y2: b_yFloorT - 1.0 }, // Top-Right flap
    { x1: b_xFloorR, y1: b_yFloorB + 1.0, x2: b_xRight, y2: b_yFloorB + 1.0 }, // Bot-Right flap
  ];

  // ── 2. LID TRAY GEOMETRY (RIGHT PIECE) ──────────────────────────
  const lidX0 = b_xRight + gapBetweenPieces; // e.g. 454 + 15 = 469 mm
  const l_xLeft = lidX0;                    // e.g. 469.0 mm
  const l_xFloorL = l_xLeft + lidH;         // e.g. 531.5 mm (fold line)
  const l_xFloorR = l_xFloorL + lidL;       // e.g. 839.5 mm (fold line)
  const l_xRight = l_xFloorR + lidH;        // e.g. 902.0 mm

  // Center vertically with Base
  const l_yFloorB = b_yFloorB - (lidW - bW) / 2; // e.g. 128.5 mm
  const l_yFloorT = l_yFloorB + lidW;            // e.g. 338.0 mm
  const l_yBot = l_yFloorB - lidH;               // e.g. 66.0 mm
  const l_yTop = l_yFloorT + lidH;               // e.g. 400.5 mm

  // Lid Cut Path
  const lidCutCmds = [
    `M ${l_xLeft.toFixed(3)},${l_yTop.toFixed(3)}`,
    // Top-left glue flap top edge
    `L ${(l_xFloorL - slit / 2).toFixed(3)},${l_yTop.toFixed(3)}`,
    // Slit down
    `L ${(l_xFloorL - slit / 2).toFixed(3)},${(l_yFloorT + 0.5).toFixed(3)}`,
    // Slit up to top wall
    `L ${(l_xFloorL + slit / 2).toFixed(3)},${(l_yFloorT + 0.5).toFixed(3)}`,
    `L ${(l_xFloorL + slit / 2).toFixed(3)},${l_yTop.toFixed(3)}`,
    // Top wall top edge
    `L ${(l_xFloorR - slit / 2).toFixed(3)},${l_yTop.toFixed(3)}`,
    // Slit down
    `L ${(l_xFloorR - slit / 2).toFixed(3)},${(l_yFloorT + 0.5).toFixed(3)}`,
    // Slit up to top-right flap
    `L ${(l_xFloorR + slit / 2).toFixed(3)},${(l_yFloorT + 0.5).toFixed(3)}`,
    `L ${(l_xFloorR + slit / 2).toFixed(3)},${l_yTop.toFixed(3)}`,
    // Top-right glue flap
    `L ${l_xRight.toFixed(3)},${l_yTop.toFixed(3)}`,
    // Right wall right edge
    `L ${l_xRight.toFixed(3)},${l_yBot.toFixed(3)}`,
    // Bot-right glue flap
    `L ${(l_xFloorR + slit / 2).toFixed(3)},${l_yBot.toFixed(3)}`,
    // Slit up
    `L ${(l_xFloorR + slit / 2).toFixed(3)},${(l_yFloorB - 0.5).toFixed(3)}`,
    // Slit down to bottom wall
    `L ${(l_xFloorR - slit / 2).toFixed(3)},${(l_yFloorB - 0.5).toFixed(3)}`,
    `L ${(l_xFloorR - slit / 2).toFixed(3)},${l_yBot.toFixed(3)}`,
    // Bottom wall bottom edge
    `L ${(l_xFloorL + slit / 2).toFixed(3)},${l_yBot.toFixed(3)}`,
    // Slit up
    `L ${(l_xFloorL + slit / 2).toFixed(3)},${(l_yFloorB - 0.5).toFixed(3)}`,
    // Slit down to bot-left flap
    `L ${(l_xFloorL - slit / 2).toFixed(3)},${(l_yFloorB - 0.5).toFixed(3)}`,
    `L ${(l_xFloorL - slit / 2).toFixed(3)},${l_yBot.toFixed(3)}`,
    // Bot-left glue flap
    `L ${l_xLeft.toFixed(3)},${l_yBot.toFixed(3)}`,
    `Z`
  ];

  // Lid Fold Lines
  const lidFolds = [
    // Left wall fold
    { x1: l_xFloorL, y1: l_yFloorB, x2: l_xFloorL, y2: l_yFloorT },
    // Right wall fold
    { x1: l_xFloorR, y1: l_yFloorB, x2: l_xFloorR, y2: l_yFloorT },
    // Top wall fold
    { x1: l_xFloorL + 1.4, y1: l_yFloorT, x2: l_xFloorR - 1.4, y2: l_yFloorT },
    // Bottom wall fold
    { x1: l_xFloorL + 1.4, y1: l_yFloorB, x2: l_xFloorR - 1.4, y2: l_yFloorB },
    // 4 glue flap fold lines
    { x1: l_xLeft, y1: l_yFloorT - 1.0, x2: l_xFloorL, y2: l_yFloorT - 1.0 }, // Top-Left flap
    { x1: l_xLeft, y1: l_yFloorB + 1.0, x2: l_xFloorL, y2: l_yFloorB + 1.0 }, // Bot-Left flap
    { x1: l_xFloorR, y1: l_yFloorT - 1.0, x2: l_xRight, y2: l_yFloorT - 1.0 }, // Top-Right flap
    { x1: l_xFloorR, y1: l_yFloorB + 1.0, x2: l_xRight, y2: l_yFloorB + 1.0 }, // Bot-Right flap
  ];

  // ── 3. BLEED BOUNDARIES ────────────────────────────────────────
  const baseBleedPath = `M ${(b_xLeft - bBleed).toFixed(3)},${(b_yTop + bBleed).toFixed(3)} ` +
    `L ${(b_xRight + bBleed).toFixed(3)},${(b_yTop + bBleed).toFixed(3)} ` +
    `L ${(b_xRight + bBleed).toFixed(3)},${(b_yBot - bBleed).toFixed(3)} ` +
    `L ${(b_xLeft - bBleed).toFixed(3)},${(b_yBot - bBleed).toFixed(3)} Z`;

  const lidBleedPath = `M ${(l_xLeft - bBleed).toFixed(3)},${(l_yTop + bBleed).toFixed(3)} ` +
    `L ${(l_xRight + bBleed).toFixed(3)},${(l_yTop + bBleed).toFixed(3)} ` +
    `L ${(l_xRight + bBleed).toFixed(3)},${(l_yBot - bBleed).toFixed(3)} ` +
    `L ${(l_xLeft - bBleed).toFixed(3)},${(l_yBot - bBleed).toFixed(3)} Z`;

  // Total bounds in inches
  const minX_mm = b_xLeft - bBleed;
  const maxX_mm = l_xRight + bBleed;
  const minY_mm = Math.min(b_yBot, l_yBot) - bBleed;
  const maxY_mm = Math.max(b_yTop, l_yTop) + bBleed;

  const totalWidth_in = (maxX_mm - minX_mm) / MM_TO_IN;
  const totalHeight_in = (maxY_mm - minY_mm) / MM_TO_IN;

  // Convert mm paths to inches for SVG & 3D decal scale consistency
  const scale = 1 / MM_TO_IN;

  const cutPaths = [
    scalePathString(baseCutCmds.join(' '), scale),
    scalePathString(lidCutCmds.join(' '), scale)
  ];

  const bleedPaths = [
    scalePathString(baseBleedPath, scale),
    scalePathString(lidBleedPath, scale)
  ];

  const allFolds = [...baseFolds, ...lidFolds].map(f => ({
    x1: f.x1 * scale,
    y1: f.y1 * scale,
    x2: f.x2 * scale,
    y2: f.y2 * scale
  }));

  return {
    width: totalWidth_in,
    height: totalHeight_in,
    minX: minX_mm * scale,
    minY: minY_mm * scale,
    cutPaths,
    bleedPaths,
    foldLines: allFolds,
    dimensions: {
      L: nL,
      W: nW,
      H: nH,
      T: nT,
      x0: minX_mm * scale,
      x1: b_xFloorL * scale,
      x2: b_xFloorR * scale,
      x3: l_xFloorL * scale,
      x4: l_xFloorR * scale,
      x5: l_xRight * scale,
      yTop: b_yFloorT * scale,
      yBot: b_yFloorB * scale,
      // Base panel coordinates (in inches)
      base: {
        floor: { x: b_xFloorL * scale, y: b_yFloorB * scale, w: bL * scale, h: bW * scale },
        wallTop: { x: (b_xFloorL + slit / 2) * scale, y: b_yFloorT * scale, w: (bL - slit) * scale, h: bH * scale },
        wallBot: { x: (b_xFloorL + slit / 2) * scale, y: b_yBot * scale, w: (bL - slit) * scale, h: bH * scale },
        wallLeft: { x: b_xLeft * scale, y: b_yFloorB * scale, w: bH * scale, h: bW * scale },
        wallRight: { x: b_xFloorR * scale, y: b_yFloorB * scale, w: bH * scale, h: bW * scale }
      },
      // Lid panel coordinates (in inches)
      lid: {
        roof: { x: l_xFloorL * scale, y: l_yFloorB * scale, w: lidL * scale, h: lidW * scale },
        wallTop: { x: (l_xFloorL + slit / 2) * scale, y: l_yFloorT * scale, w: (lidL - slit) * scale, h: lidH * scale },
        wallBot: { x: (l_xFloorL + slit / 2) * scale, y: l_yBot * scale, w: (lidL - slit) * scale, h: lidH * scale },
        wallLeft: { x: l_xLeft * scale, y: l_yFloorB * scale, w: lidH * scale, h: lidW * scale },
        wallRight: { x: l_xFloorR * scale, y: l_yFloorB * scale, w: lidH * scale, h: lidW * scale }
      },
      template: {
        L: 11.8898,
        W: 8.0315,
        H: 2.4016
      }
    }
  };
}

function scalePathString(pathStr, scale) {
  return pathStr.replace(/([A-Za-z])([^A-Za-z]*)/g, (match, cmd, args) => {
    if (cmd.toUpperCase() === 'Z') return cmd;
    const nums = args.match(/-?\d*\.?\d+/g);
    if (!nums) return match;
    const newNums = nums.map(n => (parseFloat(n) * scale).toFixed(5));
    let reconstructed = '';
    for (let i = 0; i < newNums.length; i += 2) {
      if (newNums[i] !== undefined && newNums[i + 1] !== undefined) {
        reconstructed += (i > 0 ? ' ' : '') + newNums[i] + ',' + newNums[i + 1];
      } else if (newNums[i] !== undefined) {
        reconstructed += (i > 0 ? ' ' : '') + newNums[i];
      }
    }
    return cmd + ' ' + reconstructed + ' ';
  });
}

if (typeof window !== "undefined") {
  window.generateFEFCO0300Dieline = generateFEFCO0300Dieline;
}