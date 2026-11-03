/**
 * dielinePathUtils.js
 * Utility to assemble disconnected SVG dieline cut segments (lines, curves, arcs)
 * into continuous closed outer/inner boundary loops that SVG can fill with material textures/colors.
 */

export function chainCutPaths(cutPaths, tol = 0.5) {
  if (!cutPaths || !Array.isArray(cutPaths) || cutPaths.length === 0) {
    return cutPaths || [];
  }

  // If paths already contain a closed loop (ends with Z/z) or are pre-assembled, return as-is
  const hasClosedPath = cutPaths.some(p => {
    if (typeof p !== 'string') return false;
    const t = p.trim();
    return t.endsWith('Z') || t.endsWith('z');
  });
  if (hasClosedPath) {
    return cutPaths;
  }

  // 1. Extract all subpaths/segments from cutPaths
  const segments = [];
  
  for (const pathStr of cutPaths) {
    if (!pathStr || typeof pathStr !== 'string') continue;

    // Match each subpath starting with M or m
    const subpathMatches = pathStr.match(/[Mm]\s*[-+]?[0-9]*\.?[0-9]+[,\s]+[-+]?[0-9]*\.?[0-9]+[^Mm]*/g) || [pathStr];
    
    for (const sub of subpathMatches) {
      const trimmed = sub.trim();
      const nums = trimmed.match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
      if (!nums || nums.length < 4) continue;
      
      const sx = parseFloat(nums[0]);
      const sy = parseFloat(nums[1]);
      const ex = parseFloat(nums[nums.length - 2]);
      const ey = parseFloat(nums[nums.length - 1]);
      
      // Ignore zero length segments
      if (Math.hypot(ex - sx, ey - sy) < 1e-4) continue;
      
      // Extract body (everything after the initial "M sx,sy" or "M sx sy")
      const bodyMatch = trimmed.match(/^[Mm]\s*[-+]?[0-9]*\.?[0-9]+[,\s]+[-+]?[0-9]*\.?[0-9]+([\s\S]*)$/);
      const body = bodyMatch ? bodyMatch[1].trim() : '';
      
      segments.push({
        sx, sy,
        ex, ey,
        body: body || `L ${ex.toFixed(4)},${ey.toFixed(4)}`,
        raw: trimmed
      });
    }
  }

  if (segments.length === 0) return cutPaths;

  // 2. Chaining algorithm:
  const pool = [...segments];
  const chains = [];

  function dist(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  function reverseBody(cand) {
    const pts = cand.raw.match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (!pts || pts.length < 4) return `L ${cand.sx.toFixed(4)},${cand.sy.toFixed(4)}`;
    const pairs = [];
    for (let i = 0; i < pts.length; i += 2) {
      pairs.push(`${parseFloat(pts[i]).toFixed(4)},${parseFloat(pts[i+1]).toFixed(4)}`);
    }
    pairs.reverse();
    return `L ${pairs.slice(1).join(' L ')}`;
  }

  while (pool.length > 0) {
    let chain = [pool.shift()];
    let currStart = { x: chain[0].sx, y: chain[0].sy };
    let currEnd = { x: chain[chain.length - 1].ex, y: chain[chain.length - 1].ey };
    
    let changed = true;
    while (changed && pool.length > 0) {
      changed = false;
      
      // If loop already closed, stop extending this loop
      if (chain.length > 2 && dist(currStart.x, currStart.y, currEnd.x, currEnd.y) < tol) {
        break;
      }

      let bestIdx = -1;
      let bestDist = Infinity;
      let attachMode = 'none';

      for (let i = 0; i < pool.length; i++) {
        const cand = pool[i];
        
        const dEndStart = dist(currEnd.x, currEnd.y, cand.sx, cand.sy);
        if (dEndStart < bestDist && dEndStart < tol) {
          bestDist = dEndStart;
          bestIdx = i;
          attachMode = 'end-start';
        }
        
        const dEndEnd = dist(currEnd.x, currEnd.y, cand.ex, cand.ey);
        if (dEndEnd < bestDist && dEndEnd < tol) {
          bestDist = dEndEnd;
          bestIdx = i;
          attachMode = 'end-end';
        }
        
        const dStartEnd = dist(currStart.x, currStart.y, cand.ex, cand.ey);
        if (dStartEnd < bestDist && dStartEnd < tol) {
          bestDist = dStartEnd;
          bestIdx = i;
          attachMode = 'start-end';
        }
        
        const dStartStart = dist(currStart.x, currStart.y, cand.sx, cand.sy);
        if (dStartStart < bestDist && dStartStart < tol) {
          bestDist = dStartStart;
          bestIdx = i;
          attachMode = 'start-start';
        }
      }

      if (bestIdx !== -1) {
        const cand = pool.splice(bestIdx, 1)[0];
        if (attachMode === 'end-start') {
          chain.push(cand);
          currEnd = { x: cand.ex, y: cand.ey };
        } else if (attachMode === 'end-end') {
          chain.push({
            sx: cand.ex, sy: cand.ey,
            ex: cand.sx, ey: cand.sy,
            body: reverseBody(cand),
            raw: cand.raw
          });
          currEnd = { x: cand.sx, y: cand.sy };
        } else if (attachMode === 'start-end') {
          chain.unshift(cand);
          currStart = { x: cand.sx, y: cand.sy };
        } else if (attachMode === 'start-start') {
          chain.unshift({
            sx: cand.ex, sy: cand.ey,
            ex: cand.sx, ey: cand.sy,
            body: reverseBody(cand),
            raw: cand.raw
          });
          currStart = { x: cand.ex, y: cand.sy };
        }
        changed = true;
      }
    }

    chains.push({ chain, currStart, currEnd });
  }

  // 3. Format each chain as an SVG path string
  const resultPaths = [];

  for (const { chain, currStart, currEnd } of chains) {
    if (chain.length === 0) continue;
    
    let d = `M ${chain[0].sx.toFixed(4)},${chain[0].sy.toFixed(4)}`;
    for (let i = 0; i < chain.length; i++) {
      d += ` ${chain[i].body}`;
    }

    const isClosed = dist(currStart.x, currStart.y, currEnd.x, currEnd.y) < tol;
    if (isClosed && chain.length > 2) {
      d += ` Z`;
    }
    resultPaths.push(d);
  }

  // Put closed paths (the outer perimeter and cutouts) first so fills render as solid backgrounds
  resultPaths.sort((a, b) => {
    const aClosed = a.endsWith('Z') || a.endsWith('z') ? 1 : 0;
    const bClosed = b.endsWith('Z') || b.endsWith('z') ? 1 : 0;
    if (aClosed !== bClosed) return bClosed - aClosed;
    return b.length - a.length;
  });

  return resultPaths;
}

