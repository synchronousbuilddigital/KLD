// Shared Geometry Engine for Keyline Design Box Dielines

// Top tuck flap path (Right-to-Left tracing)
export function getTopTuckPath(xStart, L, y2, flapH, tuck) {
  const fw = L * 0.96;
  const ox = (L - fw) / 2;
  const fw2 = fw * 0.99;
  const ox2 = (L - fw2) / 2;
  const cr = Math.min(10, fw2 * 0.15, tuck * 0.4);
  return [
    `L ${xStart + L - ox},${y2}`,
    `L ${xStart + L - ox},${y2 - flapH}`,
    `L ${xStart + L - ox2},${y2 - flapH}`,
    `L ${xStart + L - ox2},${y2 - flapH - tuck + cr}`,
    `Q ${xStart + L - ox2},${y2 - flapH - tuck} ${xStart + L - ox2 - cr},${y2 - flapH - tuck}`,
    `L ${xStart + ox2 + cr},${y2 - flapH - tuck}`,
    `Q ${xStart + ox2},${y2 - flapH - tuck} ${xStart + ox2},${y2 - flapH - tuck + cr}`,
    `L ${xStart + ox2},${y2 - flapH}`,
    `L ${xStart + ox},${y2 - flapH}`,
    `L ${xStart + ox},${y2}`
  ].join(' ');
}

// Top dust flap path (Right-to-Left tracing)
export function getTopDustPath(xStart, W, y2) {
  const fw = W * 0.96;
  const ox = (W - fw) / 2;
  const dh = W * 0.5;
  const di = fw * 0.075;
  const dr = Math.min(10, fw * 0.2, dh * 0.3);
  return [
    `L ${xStart + W - ox},${y2}`,
    `L ${xStart + W - ox - di},${y2 - dh + dr}`,
    `Q ${xStart + W - ox - di},${y2 - dh} ${xStart + W - ox - di - dr},${y2 - dh}`,
    `L ${xStart + ox + di + dr},${y2 - dh}`,
    `Q ${xStart + ox + di},${y2 - dh} ${xStart + ox + di},${y2 - dh + dr}`,
    `L ${xStart + ox},${y2}`
  ].join(' ');
}

// Bottom tuck flap path (Left-to-Right tracing)
export function getBottomTuckPath(xStart, L, y3, flapH, tuck) {
  const fw = L * 0.96;
  const ox = (L - fw) / 2;
  const fw2 = fw * 0.99;
  const ox2 = (L - fw2) / 2;
  const cr = Math.min(10, fw2 * 0.15, tuck * 0.4);
  return [
    `L ${xStart + ox},${y3}`,
    `L ${xStart + ox},${y3 + flapH}`,
    `L ${xStart + ox2},${y3 + flapH}`,
    `L ${xStart + ox2},${y3 + flapH + tuck - cr}`,
    `Q ${xStart + ox2},${y3 + flapH + tuck} ${xStart + ox2 + cr},${y3 + flapH + tuck}`,
    `L ${xStart + L - ox2 - cr},${y3 + flapH + tuck}`,
    `Q ${xStart + L - ox2},${y3 + flapH + tuck} ${xStart + L - ox2},${y3 + flapH + tuck - cr}`,
    `L ${xStart + L - ox2},${y3 + flapH}`,
    `L ${xStart + L - ox},${y3 + flapH}`,
    `L ${xStart + L - ox},${y3}`
  ].join(' ');
}

// Bottom dust flap path (Left-to-Right tracing)
export function getBottomDustPath(xStart, W, y3) {
  const fw = W * 0.96;
  const ox = (W - fw) / 2;
  const dh = W * 0.5;
  const di = fw * 0.075;
  const dr = Math.min(10, fw * 0.2, dh * 0.3);
  return [
    `L ${xStart + ox},${y3}`,
    `L ${xStart + ox + di},${y3 + dh - dr}`,
    `Q ${xStart + ox + di},${y3 + dh} ${xStart + ox + di + dr},${y3 + dh}`,
    `L ${xStart + W - ox - di - dr},${y3 + dh}`,
    `Q ${xStart + W - ox - di},${y3 + dh} ${xStart + W - ox - di},${y3 + dh - dr}`,
    `L ${xStart + W - ox},${y3}`
  ].join(' ');
}

// Straight Tuck End Geometry (Tuck End)
export function getStraightTuckGeometry(L, W, H, glueTab, tuck, flapH) {
  const g = glueTab;
  const x0 = 0, x1 = g, x2 = x1 + L, x3 = x2 + W, x4 = x3 + L, x5 = x4 + W;
  const y0 = 0, y1 = tuck, y2 = y1 + flapH, y3 = y2 + H, y4 = y3 + flapH, y5 = y4 + tuck;

  const tc = Math.min(4, tuck * 0.35);
  const fw = L * 0.96;
  const ox = (L - fw) / 2;

  const cutPathCommands = [
    `M ${x0},${y3 - tc}`,
    `Q ${x0},${y3} ${x0 + tc},${y3}`,
    `L ${x1 - tc},${y3}`,
    `Q ${x1},${y3} ${x1},${y3 - tc}`,
    `L ${x1},${y3}`,
    `L ${x2},${y3}`,
    getBottomDustPath(x2, W, y3),
    getBottomTuckPath(x3, L, y3, flapH, tuck),
    getBottomDustPath(x4, W, y3),
    `L ${x5},${y2}`,
    getTopDustPath(x4, W, y2),
    getTopTuckPath(x3, L, y2, flapH, tuck),
    getTopDustPath(x2, W, y2),
    `L ${x1},${y2}`,
    `L ${x1},${y2 + tc}`,
    `Q ${x1},${y2} ${x1 - tc},${y2}`,
    `L ${x0 + tc},${y2}`,
    `Q ${x0},${y2} ${x0},${y2 + tc}`,
    `Z`
  ];

  const creaseLines = [
    { x1: x1, y1: y2, x2: x5, y2: y2, layer: 'CREASE' },
    { x1: x1, y1: y3, x2: x5, y2: y3, layer: 'CREASE' },
    { x1: x1, y1: y2, x2: x1, y2: y3, layer: 'CREASE' },
    { x1: x2, y1: y2, x2: x2, y2: y3, layer: 'CREASE' },
    { x1: x3, y1: y2, x2: x3, y2: y3, layer: 'CREASE' },
    { x1: x4, y1: y2, x2: x4, y2: y3, layer: 'CREASE' },
    { x1: x3 + ox, y1: y2 - flapH, x2: x3 + L - ox, y2: y2 - flapH, layer: 'CREASE' },
    { x1: x3 + ox, y1: y3 + flapH, x2: x3 + L - ox, y2: y3 + flapH, layer: 'CREASE' }
  ];

  const b = 3;
  const bleedPathCommands = [
    `M ${x0 - b},${y3 + b}`,
    `L ${x0 - b},${y2 - b}`,
    `L ${x1 - b},${y2 - b}`,
    `L ${x1 - b},${y0 - b}`,
    `L ${x5 + b},${y0 - b}`,
    `L ${x5 + b},${y5 + b}`,
    `L ${x1 - b},${y5 + b}`,
    `L ${x1 - b},${y3 + b}`,
    `Z`
  ];

  return {
    flatW: x5,
    flatH: y5,
    cutPath: cutPathCommands.join(' '),
    bleedPath: bleedPathCommands.join(' '),
    creaseLines: creaseLines,
    x0, x1, x2, x3, x4, x5,
    y0, y1, y2, y3, y4, y5,
    tuck, flapH, tc
  };
}

// Reverse Tuck End Geometry
export function getReverseTuckGeometry(L, W, H, glueTab, tuck, flapH) {
  const g = glueTab;
  const x0 = 0, x1 = g, x2 = x1 + L, x3 = x2 + W, x4 = x3 + L, x5 = x4 + W;
  const y0 = 0, y1 = tuck, y2 = y1 + flapH, y3 = y2 + H, y4 = y3 + flapH, y5 = y4 + tuck;

  const tc = Math.min(4, tuck * 0.35);
  const fw = L * 0.96;
  const ox = (L - fw) / 2;

  const cutPathCommands = [
    `M ${x0},${y3 - tc}`,
    `Q ${x0},${y3} ${x0 + tc},${y3}`,
    `L ${x1 - tc},${y3}`,
    `Q ${x1},${y3} ${x1},${y3 - tc}`,
    `L ${x1},${y3}`,
    `L ${x2},${y3}`,
    getBottomDustPath(x2, W, y3),
    getBottomTuckPath(x3, L, y3, flapH, tuck),
    getBottomDustPath(x4, W, y3),
    `L ${x5},${y2}`,
    getTopDustPath(x4, W, y2),
    `L ${x3},${y2}`,
    getTopDustPath(x2, W, y2),
    getTopTuckPath(x1, L, y2, flapH, tuck),
    `L ${x1},${y2}`,
    `L ${x1},${y2 + tc}`,
    `Q ${x1},${y2} ${x1 - tc},${y2}`,
    `L ${x0 + tc},${y2}`,
    `Q ${x0},${y2} ${x0},${y2 + tc}`,
    `Z`
  ];

  const creaseLines = [
    { x1: x1, y1: y2, x2: x5, y2: y2, layer: 'CREASE' },
    { x1: x1, y1: y3, x2: x5, y2: y3, layer: 'CREASE' },
    { x1: x1, y1: y2, x2: x1, y2: y3, layer: 'CREASE' },
    { x1: x2, y1: y2, x2: x2, y2: y3, layer: 'CREASE' },
    { x1: x3, y1: y2, x2: x3, y2: y3, layer: 'CREASE' },
    { x1: x4, y1: y2, x2: x4, y2: y3, layer: 'CREASE' },
    { x1: x1 + ox, y1: y2 - flapH, x2: x2 - ox, y2: y2 - flapH, layer: 'CREASE' },
    { x1: x3 + ox, y1: y3 + flapH, x2: x4 - ox, y2: y3 + flapH, layer: 'CREASE' }
  ];

  const b = 3;
  const bleedPathCommands = [
    `M ${x0 - b},${y3 + b}`,
    `L ${x0 - b},${y2 - b}`,
    `L ${x1 - b},${y2 - b}`,
    `L ${x1 - b},${y0 - b}`,
    `L ${x5 + b},${y0 - b}`,
    `L ${x5 + b},${y5 + b}`,
    `L ${x1 - b},${y5 + b}`,
    `L ${x1 - b},${y3 + b}`,
    `Z`
  ];

  return {
    flatW: x5,
    flatH: y5,
    cutPath: cutPathCommands.join(' '),
    bleedPath: bleedPathCommands.join(' '),
    creaseLines: creaseLines,
    x0, x1, x2, x3, x4, x5,
    y0, y1, y2, y3, y4, y5,
    tuck, flapH, tc
  };
}

// Auto Lock Bottom Geometry
export function getAutoLockBottomGeometry(L, W, H, glueTab) {
  const g = glueTab;
  const tuck = 18;
  const flapH = W;

  const x0 = 0, x1 = g, x2 = x1 + L, x3 = x2 + W, x4 = x3 + L, x5 = x4 + W;
  const y0 = 0, y1 = tuck, y2 = y1 + flapH, y3 = y2 + H, y4 = y3 + flapH, y5 = y4 + tuck;

  const tc = Math.min(4, tuck * 0.35);

  const cutPathCommands = [
    `M ${x0},${y3 - tc}`,
    `Q ${x0},${y3} ${x0 + tc},${y3}`,
    `L ${x1 - tc},${y3}`,
    `Q ${x1},${y3} ${x1},${y3 - tc}`,
    `L ${x1},${y3}`,
    `L ${x1},${y3}`,
    `L ${x1 + L * 0.15},${y3 + flapH * 0.85}`,
    `L ${x1 + L * 0.75},${y3 + flapH * 0.85}`,
    `L ${x1 + L * 0.85},${y3 + flapH * 0.5}`,
    `L ${x2},${y3 + flapH * 0.5}`,
    `L ${x2},${y3}`,
    `L ${x2},${y3 + flapH * 0.8}`,
    `L ${x2 + W * 0.4},${y3 + flapH * 0.8}`,
    `L ${x3},${y3 + flapH * 0.3}`,
    `L ${x3},${y3}`,
    `L ${x3 + L * 0.15},${y3 + flapH * 0.85}`,
    `L ${x3 + L * 0.75},${y3 + flapH * 0.85}`,
    `L ${x3 + L * 0.85},${y3 + flapH * 0.5}`,
    `L ${x4},${y3 + flapH * 0.5}`,
    `L ${x4},${y3}`,
    `L ${x4},${y3 + flapH * 0.8}`,
    `L ${x4 + W * 0.4},${y3 + flapH * 0.8}`,
    `L ${x5},${y3 + flapH * 0.3}`,
    `L ${x5},${y3}`,
    `L ${x5},${y2}`,
    getTopDustPath(x4, W, y2),
    getTopTuckPath(x3, L, y2, flapH, tuck),
    getTopDustPath(x2, W, y2),
    `L ${x1},${y2}`,
    `L ${x1},${y2 + tc}`,
    `Q ${x1},${y2} ${x1 - tc},${y2}`,
    `L ${x0 + tc},${y2}`,
    `Q ${x0},${y2} ${x0},${y2 + tc}`,
    `Z`
  ];

  const creaseLines = [
    { x1: x1, y1: y2, x2: x5, y2: y2, layer: 'CREASE' },
    { x1: x1, y1: y3, x2: x5, y2: y3, layer: 'CREASE' },
    { x1: x1, y1: y2, x2: x1, y2: y3, layer: 'CREASE' },
    { x1: x2, y1: y2, x2: x2, y2: y3, layer: 'CREASE' },
    { x1: x3, y1: y2, x2: x3, y2: y3, layer: 'CREASE' },
    { x1: x4, y1: y2, x2: x4, y2: y3, layer: 'CREASE' },
    { x1: x3 + L * 0.02, y1: y2 - flapH, x2: x4 - L * 0.02, y2: y2 - flapH, layer: 'CREASE' },
    { x1: x1, y1: y3, x2: x1 + L * 0.15, y2: y3 + flapH * 0.85, layer: 'CREASE' },
    { x1: x3, y1: y3, x2: x3 + L * 0.15, y2: y3 + flapH * 0.85, layer: 'CREASE' }
  ];

  const b = 3;
  const bleedPathCommands = [
    `M ${x0 - b},${y3 + b}`,
    `L ${x0 - b},${y2 - b}`,
    `L ${x1 - b},${y2 - b}`,
    `L ${x1 - b},${y0 - b}`,
    `L ${x5 + b},${y0 - b}`,
    `L ${x5 + b},${y5 + b}`,
    `L ${x1 - b},${y5 + b}`,
    `L ${x1 - b},${y3 + b}`,
    `Z`
  ];

  return {
    flatW: 2 * (L + W) + g + 0.7,
    flatH: H + 1.85 * flapH + tuck + 2.5,
    cutPath: cutPathCommands.join(' '),
    bleedPath: bleedPathCommands.join(' '),
    creaseLines: creaseLines,
    x0, x1, x2, x3, x4, x5,
    y0, y1, y2, y3, y4, y5,
    tuck, flapH, tc
  };
}

// Regular Slotted Carton (RSC) Geometry
export function getRscGeometry(L, W, H, glueTab) {
  const g = glueTab;
  const flapH = W / 2;

  const x0 = 0, x1 = g, x2 = x1 + L, x3 = x2 + W, x4 = x3 + L, x5 = x4 + W;
  const y0 = 0, y1 = flapH, y2 = y1 + H, y3 = y2 + flapH;

  const cutPathCommands = [
    `M ${x0},${y1 + 10}`,
    `L ${x1},${y1}`,
    `L ${x1},${y0}`,
    `L ${x2},${y0}`,
    `L ${x2},${y1}`,
    `L ${x2},${y0}`,
    `L ${x3},${y0}`,
    `L ${x3},${y1}`,
    `L ${x3},${y0}`,
    `L ${x4},${y0}`,
    `L ${x4},${y1}`,
    `L ${x4},${y0}`,
    `L ${x5},${y0}`,
    `L ${x5},${y1}`,
    `L ${x5},${y2}`,
    `L ${x5},${y3}`,
    `L ${x4},${y3}`,
    `L ${x4},${y2}`,
    `L ${x4},${y3}`,
    `L ${x3},${y3}`,
    `L ${x3},${y2}`,
    `L ${x3},${y3}`,
    `L ${x2},${y3}`,
    `L ${x2},${y2}`,
    `L ${x2},${y3}`,
    `L ${x1},${y3}`,
    `L ${x0},${y2 - 10}`,
    `Z`
  ];

  const creaseLines = [
    { x1: x1, y1: y1, x2: x5, y2: y1, layer: 'CREASE' },
    { x1: x1, y1: y2, x2: x5, y2: y2, layer: 'CREASE' },
    { x1: x1, y1: y1, x2: x1, y2: y2, layer: 'CREASE' },
    { x1: x2, y1: y1, x2: x2, y2: y2, layer: 'CREASE' },
    { x1: x3, y1: y1, x2: x3, y2: y2, layer: 'CREASE' },
    { x1: x4, y1: y1, x2: x4, y2: y2, layer: 'CREASE' }
  ];

  return {
    flatW: x5,
    flatH: y3,
    cutPath: cutPathCommands.join(' '),
    creaseLines: creaseLines,
    x0, x1, x2, x3, x4, x5,
    y0, y1, y2, y3,
    tuck: 0, flapH: flapH, tc: 0
  };
}
