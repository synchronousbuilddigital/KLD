/**
 * canDielineGenerator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dieline generator for 12 oz Aluminum Beverage / Soda Can wrap-around label.
 * Standard 12 oz can circumference: ~207 mm (8.15 in), label height: ~125 mm (4.92 in).
 * 784 x 472 px aspect ratio (1.661:1).
 * Produces clean 2D cut paths, bleed border, seam overlap line, and dimension
 * markers for the label canvas in EditorModal.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function generateCanDieline({
  L = 207 / 25.4, // circumference / label width in inches (~8.15 in / 207 mm)
  W = 125 / 25.4, // label height in inches (~4.92 in / 125 mm)
  H = 122 / 25.4, // total can height in inches (~4.80 in / 122 mm)
  T = 0.008,
  glueFlapWidth = 0.25, // 1/4" seam overlap tab (~6.35 mm)
  bleed = 2 / 25.4      // 2mm bleed allowance
}) {
  const nL = Number(L) || (207 / 25.4);
  const nW = Number(W) || (125 / 25.4);
  const nH = Number(H) || (122 / 25.4);
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
