/**
 * tubeDielineGenerator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dieline generator for 75 ml Plastic Toothpaste / Cosmetic Squeeze Tube.
 * Standard 75 ml tube printable artwork dimensions (Model ID: 602620):
 * - Flat width: 90 mm (3.543 in), divided into Front (45 mm) & Back (45 mm)
 * - Height: 133 mm (5.236 in)
 * - Ratio: ~170 x 503 px aspect (retina 2x/3x for sharp WebGL texture)
 * Produces clean 2D cut paths, bleed border, center dividing line, and dimension
 * markers for the label canvas in EditorModal.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function generateTubeDieline({
  L = 90 / 25.4,  // total flat width in inches (~3.543 in / 90 mm)
  W = 133 / 25.4, // total height in inches (~5.236 in / 133 mm)
  H = 155 / 25.4, // overall physical tube height with cap (~6.10 in / 155 mm)
  T = 0.015,
  glueFlapWidth = 0,
  bleed = 2 / 25.4 // 2 mm bleed allowance
} = {}) {
  const nL = Number(L) || (90 / 25.4);
  const nW = Number(W) || (133 / 25.4);
  const nH = Number(H) || (155 / 25.4);
  const nBleed = Number(bleed) || (2 / 25.4);

  const x0 = 0;
  const xMid = nL / 2; // 45 mm centerline separating Front and Back panels
  const xEnd = nL;     // 90 mm total width
  const totalWidth = xEnd;
  const totalHeight = nW;

  const yTop = 0;
  const yBot = totalHeight;

  // Outer cut path: perimeter of the 90 x 133 mm flat squeeze tube artwork
  const cutPaths = [
    `M ${x0},${yTop} L ${xEnd},${yTop} L ${xEnd},${yBot} L ${x0},${yBot} Z`
  ];

  // Fold/Center guide line: dashed line dividing front and back panels
  const foldLines = [
    { x1: xMid, y1: yTop, x2: xMid, y2: yBot }
  ];

  // Bleed paths: 2mm extended boundary around outer perimeter
  const bleedPaths = [
    `M ${x0 - nBleed},${yTop - nBleed} L ${xEnd + nBleed},${yTop - nBleed} L ${xEnd + nBleed},${yBot + nBleed} L ${x0 - nBleed},${yBot + nBleed} Z`
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
      x1: xMid,
      x2: xEnd,
      x3: xEnd,
      x4: xEnd,
      x5: xEnd,
      yTop,
      yBot,
      frontWidth: xMid,
      backWidth: xEnd - xMid,
      modelId: 602620,
      capacity: '75 ml'
    }
  };
}
