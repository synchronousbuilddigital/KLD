/**
 * slimCanDielineGenerator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dieline generator for 355 mL (12 oz Slim) Aluminum Can wrap label.
 * Standard 355 mL Slim Can (Model ID: 550035):
 * - Flat wrap width: 175 mm (6.8898 in), divided down the middle into Front (87.5 mm) & Back (87.5 mm)
 * - Printable label height: 145 mm (5.7087 in)
 * - Top neck margin guides matching Pacdora dieline tool specifications
 * - Aspect: 661 × 548 px (175 × 145 mm equivalent)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function generateSlimCanDieline({
  L = 175 / 25.4, // total flat width in inches (~6.890 in / 175 mm)
  W = 145 / 25.4, // total height in inches (~5.709 in / 145 mm)
  H = 156 / 25.4, // total can physical height (~6.142 in / 156 mm)
  T = 0.008,
  glueFlapWidth = 0.25,
  bleed = 2 / 25.4 // 2 mm bleed
} = {}) {
  const nL = Number(L) || (175 / 25.4);
  const nW = Number(W) || (145 / 25.4);
  const nH = Number(H) || (156 / 25.4);
  const nBleed = Number(bleed) || (2 / 25.4);

  const x0 = 0;
  const xMid = nL / 2; // 87.5 mm center dividing line
  const xEnd = nL;     // 175 mm total width
  const totalWidth = xEnd;
  const totalHeight = nW;

  const yTop = 0;
  const yBot = totalHeight;

  // Neck margin lines near the top of the can label (matching Screenshot 4)
  const neckY1 = 8 / 25.4;  // ~8mm from top
  const neckY2 = 14 / 25.4; // ~14mm from top

  // Outer cut path: perimeter of the 175 x 145 mm flat wrap label
  const cutPaths = [
    `M ${x0},${yTop} L ${xEnd},${yTop} L ${xEnd},${yBot} L ${x0},${yBot} Z`
  ];

  // Fold / center guide lines: vertical center split + top neck guide lines
  const foldLines = [
    { x1: xMid, y1: yTop, x2: xMid, y2: yBot },
    { x1: x0, y1: neckY1, x2: xEnd, y2: neckY1 },
    { x1: x0, y1: neckY2, x2: xEnd, y2: neckY2 }
  ];

  // Bleed paths: 2mm extended boundary
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
      backWidth: xEnd - xMid
    }
  };
}
