/**
 * waterBottleDielineGenerator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dieline generator for Plastic Mineral Water Bottle (PET) wrap-around label.
 * Produces clean 2D cut paths, bleed border, seam overlap line, and dimension
 * markers for the label canvas in EditorModal.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function generateWaterBottleDieline({
  L = 243 / 25.4, // circumference / label width in inches (~9.567 in / 243 mm)
  W = 46 / 25.4,  // label height in inches (~1.811 in / 46 mm)
  H = 240 / 25.4, // total bottle height in inches (~9.449 in / 240 mm)
  T = 0.005,
  glueFlapWidth = 0.25, // 1/4" seam overlap tab (~6.35 mm)
  bleed = 2 / 25.4      // 2mm bleed allowance
}) {
  const nL = Number(L) || (243 / 25.4);
  const nW = Number(W) || (46 / 25.4);
  const nH = Number(H) || (240 / 25.4);
  const nGlue = Number(glueFlapWidth) || 0.25;
  const nBleed = Number(bleed) || (2 / 25.4);

  const x0 = 0;
  const x1 = nGlue;
  const x2 = x1 + nL;
  const totalWidth = x2;
  const totalHeight = nW;

  const yTop = 0;
  const yBot = totalHeight;

  // Outer cut path: perimeter of wrap label + overlap flap
  const cutPaths = [
    `M ${x0},${yTop} L ${x2},${yTop} L ${x2},${yBot} L ${x0},${yBot} Z`
  ];

  // Fold lines: dashed seam overlap indication
  const foldLines = [
    { x1: x1, y1: yTop, x2: x1, y2: yBot }
  ];

  // Bleed paths: extended outer boundary
  const bleedPaths = [
    `M ${x0 - nBleed},${yTop - nBleed} L ${x2 + nBleed},${yTop - nBleed} L ${x2 + nBleed},${yBot + nBleed} L ${x0 - nBleed},${yBot + nBleed} Z`
  ];

  return {
    width: totalWidth,
    height: totalHeight,
    cutPaths,
    bleedPaths,
    foldLines,
    dimensions: {
      L: nL,
      W: nW,
      H: nH,
      x0,
      x1,
      x2,
      x3: x2,
      x4: x2,
      x5: x2,
      yTop,
      yBot
    }
  };
}
