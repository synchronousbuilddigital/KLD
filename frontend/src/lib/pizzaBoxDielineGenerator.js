/**
 * pizzaBoxDielineGenerator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * High-precision CAD Dieline Generator for FEFCO 0426 Pizza Box / Roll-End
 * Tray with Hinged Lid.
 *
 * Derived directly from the official FEFCO 0426 CAD vector specification:
 * - Chain 0: Continuous closed outer perimeter (42 CAD line/arc entities)
 * - Chain 5 & 6: Locking tab floor slots (punched holes)
 * - Chain 1..4, 7: Slits & thumb notch
 * - Folds: 17 standard FEFCO 0426 crease lines
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const TEMPLATE_L = 205.0; // mm (Width across front)
export const TEMPLATE_W = 207.0; // mm (Depth front to rear)
export const TEMPLATE_H = 52.0;  // mm (Wall height)

// Compact CAD geometry definition: [type (0=LINE, 1=ARC), sx, sy, ex, ey, rev, (r, sAngle, eAngle)]
const CAD_CHAINS = [[[0,81.25,632.5,81.25,682.25,0],[0,81.25,682.25,122,682.25,0],[0,122,682.25,123.5,686,0],[0,123.5,686,160.5,686,0],[0,160.5,686,162,682.25,0],[0,162,682.25,204,682.25,0],[0,204,682.25,205.5,686,0],[0,205.5,686,242.5,686,0],[0,242.5,686,244,682.25,0],[0,244,682.25,284.75,682.25,0],[0,284.75,682.25,284.75,632.5,0],[0,284.75,632.5,286.25,627.5,0],[0,286.25,627.5,291.25,656,0],[0,291.25,656,336,656,0],[0,336,656,336,574,0],[0,336,574,336,370,0],[0,336,370,336,316.5,0],[0,336,316.5,286.25,316.5,0],[0,286.25,316.5,284,315,0],[0,284,315,324.63030214988504,300.21177940819973,0],[1,334.49999999999994,286.1163900964111,324.630302149885,300.21177940819973,1,15,5.088887490341627e-14,69.99999999999996],[0,334.5,286.1163900964111,334.5,144.38360990358888,0],[1,324.630302149885,130.28822059180024,334.49999999999994,144.38360990358885,1,15,-69.99999999999999,-6.492229350048602e-14],[0,324.63030214988504,130.28822059180027,284,115.5,0],[0,284,115.5,269.21177940819973,74.86969785011502,0],[1,255.1163900964111,65,269.21177940819973,74.869697850115,1,15,-90.00000000000001,-19.999999999999837],[0,255.11639009641112,65,110.88360990358885,65,0],[1,96.78822059180023,74.86969785011502,110.88360990358885,65,1,15,-160.00000000000023,-90.00000000000011],[0,96.78822059180023,74.86969785011502,81.99999999999999,115.5,0],[0,81.99999999999999,115.5,41.36969785011497,130.28822059180027,0],[1,31.5,144.38360990358888,41.369697850114974,130.28822059180024,1,15,-179.99999999999997,-109.99999999999999],[0,31.5,144.38360990358888,31.5,286.1163900964111,0],[1,41.36969785011497,300.21177940819973,31.5,286.1163900964111,1,15,110.00000000000001,179.99999999999994],[0,41.36969785011497,300.21177940819973,82,315,0],[0,82,315,79.75,316.5,0],[0,79.75,316.5,30,316.5,0],[0,30,316.5,30,370,0],[0,30,370,30,574,0],[0,30,574,30,656,0],[0,30,656,74.75,656,0],[0,74.75,656,79.75,627.5,0],[0,79.75,627.5,81.25,632.5,0]],[[0,80.5,574,79.75,575.5,0],[0,79.75,575.5,79.75,627.5,0]],[[0,285.5,574,286.25,575.5,0],[0,286.25,575.5,286.25,627.5,0]],[[0,80.5,370,79.75,368.5,0],[0,79.75,368.5,79.75,316.5,0]],[[0,285.5,370,286.25,368.5,0],[0,286.25,368.5,286.25,316.5,0]],[[0,124,570.5,160,570.5,0],[1,160,570.5,162.5,573,0,2.5,-90.00000000000001,0],[1,162.5,573,160,575.5,0,2.5,0,90],[0,160,575.5,124,575.5,0],[1,124,575.5,121.5,573,0,2.5,90,180],[1,121.5,573,124,570.5,0,2.5,180,-90.00000000000001]],[[0,206,570.5,242,570.5,0],[1,242,570.5,244.5,573,0,2.5,-90.00000000000001,0],[1,244.5,573,242,575.5,0,2.5,0,90],[0,242,575.5,206,575.5,0],[1,206,575.5,203.5,573,0,2.5,90,180],[1,203.5,573,206,570.5,0,2.5,180,-90.00000000000001]],[[1,175.5,115.5,190.5,115.5,0,7.5,180,0]]];
const CAD_FOLDS = [[284.75,632.5,81.25,632.5],[286.25,575.5,242,575.5],[206,575.5,160,575.5],[124,575.5,79.75,575.5],[285.5,574,285.5,370],[286.25,368.5,79.75,368.5],[80.5,370,80.5,574],[286.25,316.5,79.75,316.5],[284,315,284,115.5],[284,115.5,190.5,115.5],[175.5,115.5,82,115.5],[82,115.5,82,315],[30,574,80.5,574],[80.5,370,30,370],[336,370,285.5,370],[285.5,574,336,574],[286.25,627.5,79.75,627.5]];

export function generatePizzaBoxDieline({ L = 8.0709, W = 8.1496, H = 2.0472, T = 0.059 }) {
  const L_mm = Number(L) * 25.4;
  const W_mm = Number(W) * 25.4;
  const H_mm = Number(H) * 25.4;

  const sH = H_mm / TEMPLATE_H;
  const sL = L_mm / TEMPLATE_L;
  const sW = W_mm / TEMPLATE_W;

  // Parametric mapping from DXF template space to target (L, W, H) in mm
  function tx(x) {
    if (x <= 80.5) return (x - 30.0) * sH;
    if (x <= 285.5) return 50.5 * sH + (x - 80.5) * sL;
    return 50.5 * sH + 205.0 * sL + (x - 285.5) * sH;
  }

  function ty(y) {
    if (y <= 115.5) return (y - 65.0) * sH;
    if (y <= 316.5) return 50.5 * sH + (y - 115.5) * sW;
    if (y <= 368.5) return 50.5 * sH + 201.0 * sW + (y - 316.5) * sH;
    if (y <= 575.5) return (50.5 + 52.0) * sH + 201.0 * sW + (y - 368.5) * sW;
    if (y <= 627.5) return (50.5 + 52.0) * sH + (201.0 + 207.0) * sW + (y - 575.5) * sH;
    return (50.5 + 52.0 + 52.0) * sH + (201.0 + 207.0) * sW + (y - 627.5) * sH;
  }

  const maxCAD_Y = ty(686.0);
  const scale = 1 / 25.4; // Convert mm to inches for viewer/dieline units

  function mapPt(x, y) {
    return {
      x: tx(x) * scale,
      y: (maxCAD_Y - ty(y)) * scale
    };
  }

  // Convert CAD chain to SVG path string
  function chainToPath(ch, isClosed = false) {
    let d = '';
    for (let i = 0; i < ch.length; i++) {
      const el = ch[i];
      const isArc = el[0] === 1;
      const sx = el[1], sy = el[2], ex = el[3], ey = el[4];
      const rev = el[5] === 1;

      const sp = mapPt(rev ? ex : sx, rev ? ey : sy);
      const ep = mapPt(rev ? sx : ex, rev ? sy : ey);

      if (i === 0) {
        d += `M ${sp.x.toFixed(4)} ${sp.y.toFixed(4)}`;
      }

      if (!isArc) {
        d += ` L ${ep.x.toFixed(4)} ${ep.y.toFixed(4)}`;
      } else {
        const r = el[6] * scale;
        const sAngle = el[7];
        const eAngle = el[8];
        let sweepAngle = eAngle - sAngle;
        if (sweepAngle < 0) sweepAngle += 360;
        const largeArc = sweepAngle > 180 ? 1 : 0;
        // DXF inverted in Y: CCW in CAD becomes CW in SVG (sweep 1), reversed is sweep 0
        const sweepFlag = rev ? 0 : 1;
        d += ` A ${r.toFixed(4)} ${r.toFixed(4)} 0 ${largeArc} ${sweepFlag} ${ep.x.toFixed(4)} ${ep.y.toFixed(4)}`;
      }
    }
    if (isClosed) d += ' Z';
    return d;
  }

  // 1. Boundary paths
  const outerCutPath = chainToPath(CAD_CHAINS[0], true);
  const slot1Path = chainToPath(CAD_CHAINS[5], true);
  const slot2Path = chainToPath(CAD_CHAINS[6], true);

  // Combined evenodd closed path (outer contour + 2 punched floor slots)
  const combinedClosedCutPath = `${outerCutPath} ${slot1Path} ${slot2Path}`;

  // 2. Internal cut slits (corner tabs + thumb notch)
  const slitCutPaths = [1, 2, 3, 4, 7].map(idx => chainToPath(CAD_CHAINS[idx], false));

  // 3. Fold crease lines
  const foldLines = CAD_FOLDS.map(f => {
    const p1 = mapPt(f[0], f[1]);
    const p2 = mapPt(f[2], f[3]);
    return {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y
    };
  });

  // Calculate bounding box in inches
  const floorTL = mapPt(80.5, 575.5);
  const floorBR = mapPt(285.5, 368.5);
  const frontTop = mapPt(80.5, 627.5);
  const leftWallLeft = mapPt(30.0, 575.5);
  const rightWallRight = mapPt(336.0, 575.5);
  const lidTop = mapPt(80.5, 316.5);
  const lidBottom = mapPt(80.5, 115.5);

  const x1 = floorTL.x;
  const x2 = floorBR.x;
  const yTop = floorTL.y;
  const yBot = floorBR.y;
  const minX = leftWallLeft.x;
  const maxX = rightWallRight.x;
  const minY = mapPt(80.5, 686.0).y;
  const maxY = mapPt(80.5, 65.0).y;

  return {
    width: maxX - minX,
    height: maxY - minY,
    minX,
    minY,
    // First path is the closed filled polygon with slots; subsequent are internal open slits
    cutPaths: [combinedClosedCutPath, ...slitCutPaths],
    bleedPaths: [],
    foldLines,
    dimensions: {
      L: Number(L),
      W: Number(W),
      H: Number(H),
      T: Number(T),
      x0: minX,
      x1,
      x2,
      x3: x2,
      x4: maxX,
      x5: maxX,
      yTop,
      yBot,
      yFrontTop: frontTop.y,
      floor: {
        x: x1,
        y: yTop,
        w: x2 - x1,
        h: yBot - yTop
      },
      lid: {
        x: x1,
        y: lidTop.y,
        w: x2 - x1,
        h: lidBottom.y - lidTop.y
      },
      front: {
        x: x1,
        y: frontTop.y,
        w: x2 - x1,
        h: yTop - frontTop.y
      },
      back: {
        x: x1,
        y: yBot,
        w: x2 - x1,
        h: lidTop.y - yBot
      },
      leftWall: {
        x: minX,
        y: yTop,
        w: x1 - minX,
        h: yBot - yTop
      },
      rightWall: {
        x: x2,
        y: yTop,
        w: maxX - x2,
        h: yBot - yTop
      },
      template: {
        L: TEMPLATE_L * scale,
        W: TEMPLATE_W * scale,
        H: TEMPLATE_H * scale
      }
    }
  };
}

if (typeof window !== "undefined") {
  window.generatePizzaBoxDieline = generatePizzaBoxDieline;
}
