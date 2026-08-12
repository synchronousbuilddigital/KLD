import { dxfTemplate } from "./teDxfTemplate";
import ClipperLib from "clipper-lib";

/**
 * High-fidelity Parametric DXF Dieline Generator for BoxCraft Pro.
 * Parses the static template exported from Pacdora and maps its coordinates
 * dynamically to accommodate any custom L, W, H, thickness T, glue flap, and bleed.
 * 
 * Input dimensions (L, W, H, T, glueFlapWidth, bleed) are in inches.
 * Template coordinates (dxfTemplate) are in millimeters.
 * This generator converts template coordinates to inches and performs all mapping in inches.
 */
export function generateTEDielineDXF({ L, W, H, T = 0.018, glueFlapWidth = 0.625, bleed = 0.125, windowDecals }) {
  const nL = Number(L);
  const nW = Number(W);
  const nH = Number(H);
  const nGlue = Number(glueFlapWidth);
  const nBleed = Number(bleed);
  const nT = Number(T);

  const MM_TO_IN = 25.4;

  // Convert template baseline parameters to inches
  const L_tpl = 120.0 / MM_TO_IN;
  const W_tpl = 60.0 / MM_TO_IN;
  const H_tpl = 160.0 / MM_TO_IN;
  const T_tpl = 0.5 / MM_TO_IN;
  const glueFlapWidth_tpl = 16.0 / MM_TO_IN;
  const bleed_tpl = 5.0 / MM_TO_IN;

  // --- Anchors on the X-axis (in inches) ---
  const x1_new = nGlue;
  const x2_new = x1_new + nL;
  const x3_new = x2_new + nW;
  const x4_new = x3_new + nL;
  const x5_new = x4_new + nW;

  // --- Baseline anchors on the Y-axis (in inches) ---
  const yTop_base_new = nW + (15.0 / MM_TO_IN) + nBleed;
  const yBot_base_new = yTop_base_new + nH;

  // Dust flap depth for the new box (in inches)
  const dustD_new = (nW + (15.0 / MM_TO_IN)) / 2.0;

  // Helper to deform X coordinate segment-by-segment (keeps curves/locks undistorted, in inches)
  function deformX(x) {
    const x1_tpl = 46.0 / MM_TO_IN;
    const x2_tpl = 166.0 / MM_TO_IN;
    const x3_tpl = 226.0 / MM_TO_IN;
    const x4_tpl = 346.0 / MM_TO_IN;
    const x5_tpl = 406.0 / MM_TO_IN;
    
    if (x <= x1_tpl) {
      // Glue flap
      // Anchor at x1_new (which is nGlue). The width in template is (46 - 30) = 16mm.
      const w_tpl_glue = 16.0 / MM_TO_IN;
      const dx = x1_tpl - x; 
      return x1_new - dx * (nGlue / w_tpl_glue);
    } else if (x < x2_tpl) {
      // Panel 1 (L)
      const w_tpl = x2_tpl - x1_tpl;
      const dx = x - x1_tpl;
      if (nL >= (50.0 / MM_TO_IN)) {
        if (dx < w_tpl / 2) {
          return x1_new + dx;
        } else {
          return x2_new - (w_tpl - dx);
        }
      } else {
        return x1_new + dx * (nL / w_tpl);
      }
    } else if (x < x3_tpl) {
      // Panel 2 (W)
      const w_tpl = x3_tpl - x2_tpl;
      const dx = x - x2_tpl;
      if (nW >= (50.0 / MM_TO_IN)) {
        if (dx < w_tpl / 2) {
          return x2_new + dx;
        } else {
          return x3_new - (w_tpl - dx);
        }
      } else {
        return x2_new + dx * (nW / w_tpl);
      }
    } else if (x < x4_tpl) {
      // Panel 3 (L)
      const w_tpl = x4_tpl - x3_tpl;
      const dx = x - x3_tpl;
      if (nL >= (50.0 / MM_TO_IN)) {
        if (dx < w_tpl / 2) {
          return x3_new + dx;
        } else {
          return x4_new - (w_tpl - dx);
        }
      } else {
        return x3_new + dx * (nL / w_tpl);
      }
    } else {
      // Panel 4 (W)
      const w_tpl = x5_tpl - x4_tpl;
      const dx = x - x4_tpl;
      if (nW >= (50.0 / MM_TO_IN)) {
        if (dx < w_tpl / 2) {
          return x4_new + dx;
        } else {
          return x5_new - (w_tpl - dx);
        }
      } else {
        return x4_new + dx * (nW / w_tpl);
      }
    }
  }

  // Helper to determine template panel region for Y mapping (in inches)
  function getTemplatePanel(x) {
    const x1_tpl = 46.0 / MM_TO_IN;
    const x2_tpl = 166.0 / MM_TO_IN;
    const x3_tpl = 226.0 / MM_TO_IN;
    const x4_tpl = 346.0 / MM_TO_IN;
    
    if (x < x1_tpl) {
      return { index: 0, yTop_tpl: 300.0 / MM_TO_IN, yBot_tpl: 140.0 / MM_TO_IN, type: 'glue' };
    } else if (x < x2_tpl) {
      return { index: 1, yTop_tpl: 300.0 / MM_TO_IN, yBot_tpl: 140.0 / MM_TO_IN, type: 'L' };
    } else if (x < x3_tpl) {
      return { index: 2, yTop_tpl: 300.0 / MM_TO_IN, yBot_tpl: 140.0 / MM_TO_IN, type: 'W' };
    } else if (x < x4_tpl) {
      return { index: 3, yTop_tpl: 300.0 / MM_TO_IN, yBot_tpl: 140.0 / MM_TO_IN, type: 'L' };
    } else {
      return { index: 4, yTop_tpl: 300.0 / MM_TO_IN, yBot_tpl: 140.0 / MM_TO_IN, type: 'W' };
    }
  }

  // Helper to deform Y coordinate with cardboard thickness adjustments (in inches)
  function deformY(x, y) {
    const panel = getTemplatePanel(x);
    
    let yTop_new = yTop_base_new;
    let yBot_new = yBot_base_new;

    if (y >= panel.yBot_tpl && y <= panel.yTop_tpl) {
      // Body Region (yBot_tpl=140 is bottom of box, yTop_tpl=300 is top of box)
      const h_tpl = panel.yTop_tpl - panel.yBot_tpl;
      if (panel.index === 0) {
        // Glue flap body: preserve angle lengths from top/bot folds
        if (y > (panel.yTop_tpl + panel.yBot_tpl) / 2) {
          return yTop_new + (panel.yTop_tpl - y);
        } else {
          return yBot_new - (y - panel.yBot_tpl);
        }
      }
      return yBot_new - (y - panel.yBot_tpl) * (nH / h_tpl);
    } else if (y > panel.yTop_tpl) {
      // Top Flap Region (DXF Y > 300)
      if (panel.type === 'L' || panel.type === 'glue') {
        // Panel 3 top tuck flap
        const yTuck_tpl = 359.25 / MM_TO_IN;
        const coverD_tpl = yTuck_tpl - panel.yTop_tpl;
        if (y <= yTuck_tpl) {
          // On cover
          return yTop_new - (y - panel.yTop_tpl) * (nW / coverD_tpl);
        } else {
          // On lip or bleed
          const yTuck_new = yTop_new - nW;
          if (y <= 374.25 / MM_TO_IN) {
            // On lip
            return yTuck_new - (y - yTuck_tpl);
          } else {
            // In bleed
            return yTuck_new - (15.0 / MM_TO_IN) - (y - (374.25 / MM_TO_IN)) * (nBleed / bleed_tpl);
          }
        }
      } else {
        // Panel 2/4 top dust flap
        const dustHeight_tpl = (337.5 / MM_TO_IN) - panel.yTop_tpl;
        if (y <= 337.5 / MM_TO_IN) {
          // On dust flap
          return yTop_new - (y - panel.yTop_tpl) * (dustD_new / dustHeight_tpl);
        } else {
          // In bleed
          return yTop_new - dustD_new - (y - (337.5 / MM_TO_IN)) * (nBleed / bleed_tpl);
        }
      }
    } else {
      // Bottom Flap Region (DXF Y < 140)
      if (panel.type === 'L' || panel.type === 'glue') {
        // Panel 3 bottom tuck flap
        const yTuck_tpl = 80.0 / MM_TO_IN;
        const coverD_tpl = panel.yBot_tpl - yTuck_tpl;
        if (y >= yTuck_tpl) {
          // On cover
          return yBot_new + (panel.yBot_tpl - y) * (nW / coverD_tpl);
        } else {
          // On lip or bleed
          const yTuck_new = yBot_new + nW;
          if (y >= 65.0 / MM_TO_IN) {
            // On lip
            return yTuck_new + (yTuck_tpl - y);
          } else {
            // In bleed
            return yTuck_new + (15.0 / MM_TO_IN) + ((65.0 / MM_TO_IN) - y) * (nBleed / bleed_tpl);
          }
        }
      } else if (panel.type === 'W') {
        // Panel 2/4 bottom dust flap
        const dustHeight_tpl = panel.yBot_tpl - (102.5 / MM_TO_IN);
        if (y >= 102.5 / MM_TO_IN) {
          // On dust flap
          return yBot_new + (panel.yBot_tpl - y) * (dustD_new / dustHeight_tpl);
        } else {
          // In bleed
          return yBot_new + dustD_new + ((102.5 / MM_TO_IN) - y) * (nBleed / bleed_tpl);
        }
      } else {
        // Other bottom flaps
        return yBot_new + (panel.yBot_tpl - y);
      }
    }
  }

  // --- GLOBAL Y MAPPING FOR BLEED ---
  // The bleed contour crosses panel boundaries. Using per-panel Y mapping
  // causes discontinuities at boundary crossings. Instead, use a smooth
  // piecewise-linear mapping based on the overall template vertical structure.
  function deformY_global(y) {
    // Template vertical landmarks (in inches)
    const yBleedBot_tpl = 60.0 / MM_TO_IN;
    const yLipBot_tpl = 65.0 / MM_TO_IN;
    const yTuckBot_tpl = 80.0 / MM_TO_IN;
    const yDustBot_tpl = 97.5 / MM_TO_IN;
    const yDustBodyBot_tpl = 102.5 / MM_TO_IN;
    const yBodyBleedBot_tpl = 135.0 / MM_TO_IN;
    const yBodyBot_tpl = 140.0 / MM_TO_IN;
    const yBodyTop_tpl = 300.0 / MM_TO_IN;
    const yBodyBleedTop_tpl = 305.0 / MM_TO_IN;
    const yDustBodyTop_tpl = 337.5 / MM_TO_IN;
    const yDustTop_tpl = 342.5 / MM_TO_IN;
    const yTuckTop_tpl = 359.25 / MM_TO_IN;
    const yLipTop_tpl = 374.25 / MM_TO_IN;
    const yBleedTop_tpl = 379.25 / MM_TO_IN;

    // New vertical landmarks (in inches, increasing downwards)
    const lipHeight = 15.0 / MM_TO_IN;
    const yBleedBot_new = yBot_base_new + nW + lipHeight + nBleed;
    const yLipBot_new = yBot_base_new + nW + lipHeight;
    const yTuckBot_new = yBot_base_new + nW;
    const yDustBot_new = yBot_base_new + dustD_new + nBleed;
    const yDustBodyBot_new = yBot_base_new + dustD_new;
    const yBodyBleedBot_new = yBot_base_new + nBleed;
    const yBodyBot_new = yBot_base_new;
    const yBodyTop_new = yTop_base_new;
    const yBodyBleedTop_new = yTop_base_new - nBleed;
    const yDustBodyTop_new = yTop_base_new - dustD_new;
    const yDustTop_new = yTop_base_new - dustD_new - nBleed;
    const yTuckTop_new = yTop_base_new - nW;
    const yLipTop_new = yTop_base_new - nW - lipHeight;
    const yBleedTop_new = yTop_base_new - nW - lipHeight - nBleed;

    const tplAnchors = [
      yBleedBot_tpl, yLipBot_tpl, yTuckBot_tpl, yDustBot_tpl, yDustBodyBot_tpl,
      yBodyBleedBot_tpl, yBodyBot_tpl, yBodyTop_tpl, yBodyBleedTop_tpl,
      yDustBodyTop_tpl, yDustTop_tpl, yTuckTop_tpl, yLipTop_tpl, yBleedTop_tpl
    ];
    const newAnchors = [
      yBleedBot_new, yLipBot_new, yTuckBot_new, yDustBot_new, yDustBodyBot_new,
      yBodyBleedBot_new, yBodyBot_new, yBodyTop_new, yBodyBleedTop_new,
      yDustBodyTop_new, yDustTop_new, yTuckTop_new, yLipTop_new, yBleedTop_new
    ];

    if (y <= tplAnchors[0]) return newAnchors[0];
    if (y >= tplAnchors[tplAnchors.length - 1]) return newAnchors[newAnchors.length - 1];

    for (let i = 0; i < tplAnchors.length - 1; i++) {
      if (y >= tplAnchors[i] && y <= tplAnchors[i + 1]) {
        const range_tpl = tplAnchors[i + 1] - tplAnchors[i];
        if (range_tpl < 0.0001) return newAnchors[i];
        const t = (y - tplAnchors[i]) / range_tpl;
        return newAnchors[i] + t * (newAnchors[i + 1] - newAnchors[i]);
      }
    }
    return y;
  }

  function deformPoint([x_mm, y_mm]) {
    const x = x_mm / MM_TO_IN;
    const y = y_mm / MM_TO_IN;
    return [deformX(x), deformY_global(y)];
  }

  function deformPointBleed([x_mm, y_mm]) {
    const x = x_mm / MM_TO_IN;
    const y = y_mm / MM_TO_IN;
    return [deformX(x), deformY_global(y)];
  }

  // --- SEGMENT CHAINING ENGINE ---
  // Chains adjacent segments into continuous SVG paths instead of
  // emitting each entity as a disconnected <path>. This produces
  // smooth continuous contours matching Pacdora's rendering.
  
  function nearlyEqual(a, b, tol = 0.0005) {
    return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
  }

  // Collect deformed segments per layer
  const segmentsByLayer = { cuts: [], bleeds: [] };
  const foldLines = [];

  dxfTemplate.forEach(entity => {
    if (entity.layer === 'folds' && entity.type === 'LINE') {
      const [nx1, ny1] = deformPoint([entity.x1, entity.y1]);
      const [nx2, ny2] = deformPoint([entity.x2, entity.y2]);
      foldLines.push({ x1: nx1, y1: ny1, x2: nx2, y2: ny2 });
      return;
    }

    const layer = entity.layer;
    if (layer !== 'cuts' && layer !== 'bleeds') return;

    // Use global Y mapping for bleed, per-panel Y mapping for cuts
    if (entity.type === 'LINE') {
      const p1 = (layer === 'bleeds' ? deformPointBleed : deformPoint)([entity.x1, entity.y1]);
      const p2 = (layer === 'bleeds' ? deformPointBleed : deformPoint)([entity.x2, entity.y2]);
      segmentsByLayer[layer].push({ type: 'LINE', pts: [p1, p2] });
    } else if (entity.type === 'LWPOLYLINE') {
      const pts = entity.vertices.map(pt => (layer === 'bleeds' ? deformPointBleed : deformPoint)(pt));
      if (pts.length < 2) return;
      segmentsByLayer[layer].push({ type: 'POLYLINE', pts: pts, closed: entity.closed });
    } else if (entity.type === 'SPLINE') {
      const pts = entity.controlPoints.map(pt => (layer === 'bleeds' ? deformPointBleed : deformPoint)(pt));
      if (pts.length < 4) return;
      segmentsByLayer[layer].push({ type: 'SPLINE', pts: pts });
    }
  });

  // Chain segments into continuous SVG paths
  function chainSegments(segments) {
    if (!segments || segments.length === 0) return [];

    function nearlyEqual(a, b, tol = 0.2) {
      return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
    }

    function reverseSegment(seg) {
      if (seg.type === 'LINE' || seg.type === 'POLYLINE') {
        return { ...seg, pts: [...seg.pts].reverse() };
      } else if (seg.type === 'SPLINE') {
        return { 
          type: 'SPLINE', 
          pts: [seg.pts[3], seg.pts[2], seg.pts[1], seg.pts[0]] 
        };
      }
      return seg;
    }

    let pool = [...segments];
    let chains = [];

    while (pool.length > 0) {
      let chain = [pool.shift()];
      let changed = true;

      while (changed) {
        changed = false;
        let head = chain[0].pts[0];
        let tail = chain[chain.length - 1].pts[chain[chain.length - 1].pts.length - 1];

        for (let i = 0; i < pool.length; i++) {
          let cand = pool[i];
          let candHead = cand.pts[0];
          let candTail = cand.pts[cand.pts.length - 1];

          if (nearlyEqual(tail, candHead)) {
            chain.push(cand);
            pool.splice(i, 1);
            changed = true;
            break;
          } else if (nearlyEqual(tail, candTail)) {
            chain.push(reverseSegment(cand));
            pool.splice(i, 1);
            changed = true;
            break;
          } else if (nearlyEqual(head, candTail)) {
            chain.unshift(cand);
            pool.splice(i, 1);
            changed = true;
            break;
          } else if (nearlyEqual(head, candHead)) {
            chain.unshift(reverseSegment(cand));
            pool.splice(i, 1);
            changed = true;
            break;
          }
        }
      }
      chains.push(chain);
    }

    const svgPaths = chains.map(chain => {
      let d = `M ${chain[0].pts[0][0].toFixed(5)},${chain[0].pts[0][1].toFixed(5)}`;
      
      chain.forEach(seg => {
        // Explicitly draw a line to the start of the next segment to bridge any gap
        d += ` L ${seg.pts[0][0].toFixed(5)},${seg.pts[0][1].toFixed(5)}`;
        
        if (seg.type === 'LINE') {
          d += ` L ${seg.pts[1][0].toFixed(5)},${seg.pts[1][1].toFixed(5)}`;
        } else if (seg.type === 'POLYLINE') {
          for (let i = 1; i < seg.pts.length; i++) {
            d += ` L ${seg.pts[i][0].toFixed(5)},${seg.pts[i][1].toFixed(5)}`;
          }
        } else if (seg.type === 'SPLINE') {
          d += ` C ${seg.pts[1][0].toFixed(5)},${seg.pts[1][1].toFixed(5)} ${seg.pts[2][0].toFixed(5)},${seg.pts[2][1].toFixed(5)} ${seg.pts[3][0].toFixed(5)},${seg.pts[3][1].toFixed(5)}`;
        }
      });
      return d;
    });

    return { svgPaths, chains };
  }

  const { svgPaths: cutPaths, chains: cutChains } = chainSegments(segmentsByLayer.cuts);

  // --- GEOMETRIC BLEED OFFSET GENERATOR ---
  const SCALE = 100000;
  
  function sampleBezier(p0, p1, p2, p3, steps = 15) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0];
      const y = mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1];
      pts.push({ X: x, Y: y });
    }
    return pts;
  }

  const co = new ClipperLib.ClipperOffset();
  const pathsToOffset = [];

  cutChains.forEach(chain => {
    let clipperPath = [];
    chain.forEach((seg, index) => {
      let ptsToAdd = seg.pts;
      if (index > 0) {
        ptsToAdd = ptsToAdd.slice(1);
      }
      
      if (seg.type === 'LINE' || seg.type === 'POLYLINE') {
        ptsToAdd.forEach(p => clipperPath.push({ X: Math.round(p[0] * SCALE), Y: Math.round(p[1] * SCALE) }));
      } else if (seg.type === 'SPLINE') {
        let bezierPts = sampleBezier(seg.pts[0], seg.pts[1], seg.pts[2], seg.pts[3], 15);
        if (index > 0) bezierPts = bezierPts.slice(1);
        bezierPts.forEach(p => clipperPath.push({ X: Math.round(p.X * SCALE), Y: Math.round(p.Y * SCALE) }));
      }
    });
    pathsToOffset.push(clipperPath);
  });

  co.AddPaths(pathsToOffset, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenRound);

  const solution = new ClipperLib.Paths();
  co.Execute(solution, nBleed * SCALE);

  // Find the largest polygon (the outer envelope)
  let maxArea = -1;
  let outerBleed = null;
  solution.forEach(path => {
    const area = Math.abs(ClipperLib.Clipper.Area(path));
    if (area > maxArea) {
      maxArea = area;
      outerBleed = path;
    }
  });

  let bleedPaths = [];
  if (outerBleed && outerBleed.length > 0) {
    let d = `M ${(outerBleed[0].X / SCALE).toFixed(5)},${(outerBleed[0].Y / SCALE).toFixed(5)}`;
    for (let i = 1; i < outerBleed.length; i++) {
      d += ` L ${(outerBleed[i].X / SCALE).toFixed(5)},${(outerBleed[i].Y / SCALE).toFixed(5)}`;
    }
    d += " Z";
    bleedPaths.push(d);
  }

  const width = x5_new;
  const height = yBot_base_new + nW + (15.0 / MM_TO_IN) + nBleed;

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

  const dimensions = {
    L: nL,
    W: nW,
    H: nH,
    x1: x1_new,
    x2: x2_new,
    x3: x3_new,
    x4: x4_new,
    x5: x5_new,
    yTop: yTop_base_new,
    yBot: yBot_base_new
  };

  return {
    width,
    height,
    cutPaths,
    bleedPaths,
    foldLines,
    dimensions
  };
}
