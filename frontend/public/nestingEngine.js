// WARNING: This file is a TEMPORARY transitional legacy compatibility layer for standalone HTML box editors.
// The single AUTHORITATIVE source of truth for the nesting engine is:
//   src/geometry/nesting.js
// This file will be deleted once the legacy editors are ported to React.

(function () {
  function getBoxStrips(bx, by, rot, L, W, H, glueTab, geom) {
    const g = glueTab;
    const x5 = geom ? geom.flatW : 2 * (L + W) + g;
    const y5 = geom ? geom.flatH : H + W;
    const flapH = geom ? (geom.flapH !== undefined ? geom.flapH : W / 2) : W / 2;

    const x0 = 0, x1 = g, x2 = x1 + L, x3 = x2 + W, x4 = x3 + L;
    const y0 = 0, y1 = flapH, y2 = geom && geom.y2 !== undefined ? geom.y2 : y1 + H;

    const cx = x5 / 2;
    const cy = y5 / 2;

    const rotW = (rot === 90 || rot === 270) ? y5 : x5;
    const rotH = (rot === 90 || rot === 270) ? x5 : y5;

    const tx = bx + rotW / 2;
    const ty = by + rotH / 2;

    const localStrips = [
      { x1: x0, x2: x1, y1: y1, y2: y2 },
      { x1: x1, x2: x2, y1: y0, y2: y5 },
      { x1: x2, x2: x3, y1: y0, y2: y5 },
      { x1: x3, x2: x4, y1: y0, y2: y5 },
      { x1: x4, x2: x5, y1: y0, y2: y5 }
    ];

    return localStrips.map(s => {
      const sx1 = s.x1 - cx, sx2 = s.x2 - cx;
      const sy1 = s.y1 - cy, sy2 = s.y2 - cy;

      let rx1 = 0, rx2 = 0, ry1 = 0, ry2 = 0;
      if (rot === 0) {
        rx1 = sx1; rx2 = sx2;
        ry1 = sy1; ry2 = sy2;
      } else if (rot === 90) {
        rx1 = -sy2; rx2 = -sy1;
        ry1 = sx1; ry2 = sx2;
      } else if (rot === 180) {
        rx1 = -sx2; rx2 = -sx1;
        ry1 = -sy2; ry2 = -sy1;
      } else if (rot === 270) {
        rx1 = sy1; rx2 = sy2;
        ry1 = -sx2; ry2 = -sx1;
      }

      return {
        x1: rx1 + tx,
        x2: rx2 + tx,
        y1: ry1 + ty,
        y2: ry2 + ty
      };
    });
  }

  function boxesOverlap(boxAStrips, boxBStrips, spacing) {
    for (const sA of boxAStrips) {
      for (const sB of boxBStrips) {
        const overlapX = sA.x1 < sB.x2 + spacing && sA.x2 > sB.x1 - spacing;
        const overlapY = sA.y1 < sB.y2 + spacing && sA.y2 > sB.y1 - spacing;
        if (overlapX && overlapY) {
          return true;
        }
      }
    }
    return false;
  }

  function getMinSeparationX(rotA, rotB, L, W, H, glueTab, spacing, geom) {
    const x5 = geom ? geom.flatW : 2 * (L + W) + glueTab;
    const y5 = geom ? geom.flatH : H + W;
    const rotW_A = (rotA === 90 || rotA === 270) ? y5 : x5;

    const stripsA = getBoxStrips(0, 0, rotA, L, W, H, glueTab, geom);
    const stripsB_rel = getBoxStrips(0, 0, rotB, L, W, H, glueTab, geom);

    let max_dx = 0;
    for (const sA of stripsA) {
      for (const sB of stripsB_rel) {
        const overlapY = sA.y1 < sB.y2 + spacing && sA.y2 > sB.y1 - spacing;
        if (overlapY) {
          const req_dx = sA.x2 - sB.x1 + spacing;
          if (req_dx > max_dx) {
            max_dx = req_dx;
          }
        }
      }
    }
    return Math.max(max_dx, rotW_A * 0.1);
  }

  function getMinSeparationY(rotA, rotB, dx_offset, L, W, H, glueTab, spacing, geom) {
    const stripsA = getBoxStrips(0, 0, rotA, L, W, H, glueTab, geom);
    const stripsB_rel = getBoxStrips(dx_offset, 0, rotB, L, W, H, glueTab, geom);

    let max_dy = 0;
    for (const sA of stripsA) {
      for (const sB of stripsB_rel) {
        const overlapX = sA.x1 < sB.x2 + spacing && sA.x2 > sB.x1 - spacing;
        if (overlapX) {
          const req_dy = sA.y2 - sB.y1 + spacing;
          if (req_dy > max_dy) {
            max_dy = req_dy;
          }
        }
      }
    }
    return max_dy;
  }

  function packInterlockedRowMajorStaggered(
    rotPattern,
    staggerPattern,
    L, W, H, glueTab,
    sheetW, sheetH, margin, spacing,
    geom
  ) {
    const x5 = geom ? geom.flatW : 2 * (L + W) + glueTab;
    const y5 = geom ? geom.flatH : H + W;

    const boxes = [];
    let id = 0;
    let cy = margin;
    let rowIdx = 0;
    let prevRowY = margin;

    while (true) {
      const pattern = rotPattern[rowIdx % rotPattern.length];
      const shift = staggerPattern ? staggerPattern[rowIdx % staggerPattern.length] : 0;
      const rowBoxes = [];
      let cx = margin + shift;
      let colIdx = 0;

      while (true) {
        const rot = pattern[colIdx % pattern.length];
        const rW = (rot === 90 || rot === 270) ? y5 : x5;
        const rH = (rot === 90 || rot === 270) ? x5 : y5;

        let nextX = cx;
        if (colIdx > 0) {
          const prevBox = rowBoxes[colIdx - 1];
          const sepX = getMinSeparationX(prevBox.rot, rot, L, W, H, glueTab, spacing, geom);
          nextX = prevBox.x + sepX;
        }

        if (nextX + rW > sheetW - margin) {
          break;
        }

        rowBoxes.push({ id: id++, x: nextX, y: cy, rot, width: rW, height: rH });
        colIdx++;
      }

      if (rowBoxes.length === 0) {
        break;
      }

      if (boxes.length > 0) {
        const prevRowBoxes = boxes.filter(b => b.y === prevRowY);

        for (const box of rowBoxes) {
          let max_box_y = margin;
          for (const prevBox of prevRowBoxes) {
            const sepY = getMinSeparationY(prevBox.rot, box.rot, box.x - prevBox.x, L, W, H, glueTab, spacing, geom);
            const reqY = prevBox.y + sepY;
            if (reqY > max_box_y) {
              max_box_y = reqY;
            }
          }
          box.y = max_box_y;
        }

        const alignedY = Math.max(...rowBoxes.map(b => b.y));
        const exceeds = rowBoxes.some(b => alignedY + b.height > sheetH - margin);
        if (exceeds) {
          break;
        }

        rowBoxes.forEach(b => b.y = alignedY);
        cy = alignedY;
        prevRowY = alignedY;
      } else {
        const exceeds = rowBoxes.some(b => b.y + b.height > sheetH - margin);
        if (exceeds) {
          break;
        }
        prevRowY = cy;
      }

      boxes.push(...rowBoxes);
      rowIdx++;
    }
    return boxes;
  }

  function solveNestingLayout(
    L, W, H, glueTab,
    sheetW, sheetH, margin, spacing,
    forceRot,
    geom
  ) {
    const x5 = geom ? geom.flatW : 2 * (L + W) + glueTab;
    const y5 = geom ? geom.flatH : H + W;

    const strategies = [];

    if (forceRot === 'auto' || forceRot === '0') {
      strategies.push({
        name: 'Standard Grid (0°)',
        run: () => packInterlockedRowMajorStaggered([[0]], [0], L, W, H, glueTab, sheetW, sheetH, margin, spacing, geom)
      });
      strategies.push({
        name: 'Staggered Grid (0°)',
        run: () => packInterlockedRowMajorStaggered([[0]], [0, x5 / 2], L, W, H, glueTab, sheetW, sheetH, margin, spacing, geom)
      });
    }

    if (forceRot === 'auto' || forceRot === '90') {
      strategies.push({
        name: 'Standard Grid (90°)',
        run: () => packInterlockedRowMajorStaggered([[90]], [0], L, W, H, glueTab, sheetW, sheetH, margin, spacing, geom)
      });
      strategies.push({
        name: 'Staggered Grid (90°)',
        run: () => packInterlockedRowMajorStaggered([[90]], [0, y5 / 2], L, W, H, glueTab, sheetW, sheetH, margin, spacing, geom)
      });
    }

    if (forceRot === 'auto') {
      strategies.push({
        name: '✨ Interlocking (0°/180°)',
        run: () => packInterlockedRowMajorStaggered([[0, 180], [180, 0]], [0], L, W, H, glueTab, sheetW, sheetH, margin, spacing, geom)
      });
      strategies.push({
        name: '✨ Interlocking (90°/270°)',
        run: () => packInterlockedRowMajorStaggered([[90, 270], [270, 90]], [0], L, W, H, glueTab, sheetW, sheetH, margin, spacing, geom)
      });
    }

    if (forceRot === '180') {
      strategies.push({
        name: 'Standard Grid (180°)',
        run: () => packInterlockedRowMajorStaggered([[180]], [0], L, W, H, glueTab, sheetW, sheetH, margin, spacing, geom)
      });
    }
    if (forceRot === '270') {
      strategies.push({
        name: 'Standard Grid (270°)',
        run: () => packInterlockedRowMajorStaggered([[270]], [0], L, W, H, glueTab, sheetW, sheetH, margin, spacing, geom)
      });
    }

    let bestBoxes = [];
    let bestStrategyName = 'None';
    let maxCount = -1;
    let maxAreaPct = -1;

    for (const strat of strategies) {
      const boxes = strat.run();
      const count = boxes.length;

      const totalArea = count * (x5 * y5);
      const sheetArea = sheetW * sheetH;
      const yieldPct = (totalArea / sheetArea) * 100;

      if (count > maxCount || (count === maxCount && yieldPct > maxAreaPct)) {
        maxCount = count;
        maxAreaPct = yieldPct;
        bestBoxes = boxes;
        bestStrategyName = strat.name;
      }
    }

    return { boxes: bestBoxes, strategyName: bestStrategyName };
  }

  if (typeof window !== 'undefined') {
    window.NestingEngine = {
      getBoxStrips,
      boxesOverlap,
      getMinSeparationX,
      getMinSeparationY,
      packInterlockedRowMajorStaggered,
      solveNestingLayout
    };
  }
})();
