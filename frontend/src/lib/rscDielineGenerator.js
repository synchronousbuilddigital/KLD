/**
 * Regular Slotted Carton (RSC) Parametric DXF Dieline Generator for BoxCraft Pro.
 * Generates CAD-standard cut paths, crease lines, and bleed boundary for RSC boxes.
 * Input dimensions (L, W, H, T, glueFlapWidth, bleed) are in inches.
 */
export function generateRSCDielineDXF({
  L,
  W,
  H,
  T = 0.0197,
  glueFlapWidth = 1.25,
  bleed = 0.125,
  windowDecals = []
}) {
  const nL = Number(L);
  const nW = Number(W);
  const nH = Number(H);
  const nGlue = Number(glueFlapWidth) || 1.25;
  const nBleed = Number(bleed) || 0.125;
  const nT = Number(T) || 0.0197;

  // RSC flap depth is half of box width (W / 2)
  const flapH = nW / 2;
  const slotW = Math.max(0.0625, Math.min(0.25, nT * 4)); // slot cut width

  const x0 = 0;
  const x1 = nGlue;
  const x2 = x1 + nL;
  const x3 = x2 + nW;
  const x4 = x3 + nL;
  const x5 = x4 + nW;

  const y0 = 0;
  const y1 = flapH;
  const y2 = y1 + nH;
  const y3 = y2 + flapH;

  const glueChamfer = Math.min(nGlue * 0.4, flapH * 0.5);

  // Outer cut path
  // Start at glue flap top chamfer: (x0, y1 + glueChamfer)
  const cutCmds = [
    `M ${x0.toFixed(4)},${(y1 + glueChamfer).toFixed(4)}`,
    `L ${x1.toFixed(4)},${y1.toFixed(4)}`,
    // Top Flap 1 (L)
    `L ${x1.toFixed(4)},${y0.toFixed(4)}`,
    `L ${(x2 - slotW / 2).toFixed(4)},${y0.toFixed(4)}`,
    `L ${(x2 - slotW / 2).toFixed(4)},${y1.toFixed(4)}`,
    `L ${(x2 + slotW / 2).toFixed(4)},${y1.toFixed(4)}`,
    // Top Flap 2 (W)
    `L ${(x2 + slotW / 2).toFixed(4)},${y0.toFixed(4)}`,
    `L ${(x3 - slotW / 2).toFixed(4)},${y0.toFixed(4)}`,
    `L ${(x3 - slotW / 2).toFixed(4)},${y1.toFixed(4)}`,
    `L ${(x3 + slotW / 2).toFixed(4)},${y1.toFixed(4)}`,
    // Top Flap 3 (L)
    `L ${(x3 + slotW / 2).toFixed(4)},${y0.toFixed(4)}`,
    `L ${(x4 - slotW / 2).toFixed(4)},${y0.toFixed(4)}`,
    `L ${(x4 - slotW / 2).toFixed(4)},${y1.toFixed(4)}`,
    `L ${(x4 + slotW / 2).toFixed(4)},${y1.toFixed(4)}`,
    // Top Flap 4 (W)
    `L ${(x4 + slotW / 2).toFixed(4)},${y0.toFixed(4)}`,
    `L ${x5.toFixed(4)},${y0.toFixed(4)}`,
    // Right Edge
    `L ${x5.toFixed(4)},${y3.toFixed(4)}`,
    // Bottom Flap 4 (W)
    `L ${(x4 + slotW / 2).toFixed(4)},${y3.toFixed(4)}`,
    `L ${(x4 + slotW / 2).toFixed(4)},${y2.toFixed(4)}`,
    `L ${(x4 - slotW / 2).toFixed(4)},${y2.toFixed(4)}`,
    // Bottom Flap 3 (L)
    `L ${(x4 - slotW / 2).toFixed(4)},${y3.toFixed(4)}`,
    `L ${(x3 + slotW / 2).toFixed(4)},${y3.toFixed(4)}`,
    `L ${(x3 + slotW / 2).toFixed(4)},${y2.toFixed(4)}`,
    `L ${(x3 - slotW / 2).toFixed(4)},${y2.toFixed(4)}`,
    // Bottom Flap 2 (W)
    `L ${(x3 - slotW / 2).toFixed(4)},${y3.toFixed(4)}`,
    `L ${(x2 + slotW / 2).toFixed(4)},${y3.toFixed(4)}`,
    `L ${(x2 + slotW / 2).toFixed(4)},${y2.toFixed(4)}`,
    `L ${(x2 - slotW / 2).toFixed(4)},${y2.toFixed(4)}`,
    // Bottom Flap 1 (L)
    `L ${(x2 - slotW / 2).toFixed(4)},${y3.toFixed(4)}`,
    `L ${x1.toFixed(4)},${y3.toFixed(4)}`,
    `L ${x1.toFixed(4)},${y2.toFixed(4)}`,
    // Glue Flap Bottom Chamfer
    `L ${x0.toFixed(4)},${(y2 - glueChamfer).toFixed(4)}`,
    `Z`
  ];

  const cutPaths = [cutCmds.join(' ')];

  // Window decals
  if (windowDecals && windowDecals.length > 0) {
    windowDecals.forEach((wd) => {
      const cx = wd.x;
      const cy = wd.y;
      const w = wd.width;
      const h = wd.height;
      if (wd.shapeType === "circle") {
        const r = Math.min(w, h) / 2;
        cutPaths.push(`M ${(cx - r).toFixed(4)},${cy.toFixed(4)} A ${r},${r} 0 1,0 ${(cx + r).toFixed(4)},${cy.toFixed(4)} A ${r},${r} 0 1,0 ${(cx - r).toFixed(4)},${cy.toFixed(4)}`);
      } else {
        cutPaths.push(`M ${(cx - w/2).toFixed(4)},${(cy - h/2).toFixed(4)} L ${(cx + w/2).toFixed(4)},${(cy - h/2).toFixed(4)} L ${(cx + w/2).toFixed(4)},${(cy + h/2).toFixed(4)} L ${(cx - w/2).toFixed(4)},${(cy + h/2).toFixed(4)} Z`);
      }
    });
  }

  // Fold lines (Creases)
  const foldLines = [
    // Horizontal body scores
    { x1: x1, y1: y1, x2: x5, y2: y1 },
    { x1: x1, y1: y2, x2: x5, y2: y2 },
    // Vertical panel scores
    { x1: x1, y1: y1, x2: x1, y2: y2 }, // Glue tab crease
    { x1: x2, y1: y1, x2: x2, y2: y2 },
    { x1: x3, y1: y1, x2: x3, y2: y2 },
    { x1: x4, y1: y1, x2: x4, y2: y2 }
  ];

  // Bleed paths
  const bx0 = x0 - nBleed;
  const by0 = y0 - nBleed;
  const bx1 = x5 + nBleed;
  const by1 = y3 + nBleed;
  const bleedPaths = [
    `M ${bx0.toFixed(4)},${by0.toFixed(4)} L ${bx1.toFixed(4)},${by0.toFixed(4)} L ${bx1.toFixed(4)},${by1.toFixed(4)} L ${bx0.toFixed(4)},${by1.toFixed(4)} Z`
  ];

  return {
    width: x5,
    height: y3,
    cutPaths,
    bleedPaths,
    foldLines,
    dimensions: {
      L: nL,
      W: nW,
      H: nH,
      x1, x2, x3, x4, x5,
      yTop: y1,
      yBot: y2
    }
  };
}
