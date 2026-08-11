export function generatePanelHitboxes(L, W, H, T, dimensions, glueFlapWidth, boxModel = 'rte') {
  const nT = Math.max(0.015, Number(T) || 0.0197);
  const { x1, x2, x3, x4, x5, yTop, yBot } = dimensions;
  
  const rect = (x, y, w, h) => `M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h} L ${x} ${y+h} Z`;

  const panels = [];
  
  // Main Panels
  panels.push({ id: "p1-front", name: "Front Panel", path: rect(x1, yTop, L, H) });
  panels.push({ id: "p2-right", name: "Right Side Panel", path: rect(x2, yTop, W, H) });
  panels.push({ id: "p3-back", name: "Back Panel", path: rect(x3, yTop, L, H) });
  panels.push({ id: "p4-left", name: "Left Side Panel", path: rect(x4, yTop, W, H) });

  // Glue Flap
  const glueFlapW = glueFlapWidth || W * (16 / 60);
  const glueStep = Math.max(0.125, nT * 1.2);
  const gluePath = `M ${x1} ${yTop} L ${x1 - glueFlapW} ${yTop + glueStep} L ${x1 - glueFlapW} ${yBot - glueStep} L ${x1} ${yBot} Z`;
  panels.push({ id: "glue-flap", name: "Glue Flap", path: gluePath });

  // Perfectly smooth Tuck Flap matching Pacdora visual bounding
  function getTuckFlap(xL, width, isTop) {
    const xR = xL + width;
    const coverD = W;
    const lipD = 15 / 25.4; 
    const dY = isTop ? -1 : 1;
    const yBase = isTop ? yTop : yBot;
    const yEdge = yBase + dY * (coverD + lipD);
    
    const lockH = 12 / 25.4;
    const lockW = width * 0.03;
    const r = 8 / 25.4; 
    
    if (isTop) {
      return `M ${xL} ${yBase}
              L ${xL} ${yBase - lockH}
              L ${xL + lockW} ${yBase - lockH}
              L ${xL + lockW} ${yEdge + r}
              Q ${xL + lockW} ${yEdge} ${xL + lockW + r} ${yEdge}
              L ${xR - lockW - r} ${yEdge}
              Q ${xR - lockW} ${yEdge} ${xR - lockW} ${yEdge + r}
              L ${xR - lockW} ${yBase - lockH}
              L ${xR} ${yBase - lockH}
              L ${xR} ${yBase} Z`;
    } else {
      return `M ${xL} ${yBase}
              L ${xL} ${yBase + lockH}
              L ${xL + lockW} ${yBase + lockH}
              L ${xL + lockW} ${yEdge - r}
              Q ${xL + lockW} ${yEdge} ${xL + lockW + r} ${yEdge}
              L ${xR - lockW - r} ${yEdge}
              Q ${xR - lockW} ${yEdge} ${xR - lockW} ${yEdge - r}
              L ${xR - lockW} ${yBase + lockH}
              L ${xR} ${yBase + lockH}
              L ${xR} ${yBase} Z`;
    }
  }

  // Perfectly smooth Dust Flap matching Pacdora visual bounding
  function getDustFlap(xL, width, isTop, sweepSide = 'both') {
    const xR = xL + width;
    const dustD = (W + 15/25.4) / 2;
    const dY = isTop ? -1 : 1;
    const yBase = isTop ? yTop : yBot;
    const yEdge = yBase + dY * dustD;
    
    const bigSlant = width * 0.25; 
    const slant = width * 0.03; // slight inward slant for non-sweeping side
    const r = 5 / 25.4;
    const straightH = dustD * 0.2; 
    
    let path = `M ${xL} ${yBase} `;
    
    // Left edge
    if (sweepSide === 'left' || sweepSide === 'both') {
      path += `L ${xL} ${yBase + dY * straightH} `;
      path += `C ${xL} ${yBase + dY * dustD * 0.6} ${xL + bigSlant} ${yBase + dY * dustD * 0.8} ${xL + bigSlant} ${yEdge - dY * r} `;
      path += `Q ${xL + bigSlant} ${yEdge} ${xL + bigSlant + r} ${yEdge} `;
    } else {
      path += `L ${xL} ${yBase + dY * straightH} `;
      path += `L ${xL + slant} ${yEdge - dY * r} `;
      path += `Q ${xL + slant} ${yEdge} ${xL + slant + r} ${yEdge} `;
    }
    
    // Right edge
    if (sweepSide === 'right' || sweepSide === 'both') {
      path += `L ${xR - bigSlant - r} ${yEdge} `;
      path += `Q ${xR - bigSlant} ${yEdge} ${xR - bigSlant} ${yEdge - dY * r} `;
      path += `C ${xR - bigSlant} ${yBase + dY * dustD * 0.8} ${xR} ${yBase + dY * dustD * 0.6} ${xR} ${yBase + dY * straightH} `;
      path += `L ${xR} ${yBase} Z`;
    } else {
      path += `L ${xR - slant - r} ${yEdge} `;
      path += `Q ${xR - slant} ${yEdge} ${xR - slant} ${yEdge - dY * r} `;
      path += `L ${xR} ${yBase + dY * straightH} `;
      path += `L ${xR} ${yBase} Z`;
    }
    
    return path;
  }

  // --- Dynamic Layout based on Box Model ---
  if (boxModel === 'te') {
    // Straight Tuck End
    panels.push({ id: "top-tuck", name: "Top Tuck Flap", path: getTuckFlap(x3, L, true) });
    panels.push({ id: "top-dust-1", name: "Top Dust Flap", path: getDustFlap(x2, W, true, 'right') });
    panels.push({ id: "top-dust-2", name: "Top Dust Flap", path: getDustFlap(x4, W, true, 'left') });

    panels.push({ id: "bot-tuck", name: "Bottom Tuck Flap", path: getTuckFlap(x3, L, false) });
    panels.push({ id: "bot-dust-1", name: "Bottom Dust Flap", path: getDustFlap(x2, W, false, 'right') });
    panels.push({ id: "bot-dust-2", name: "Bottom Dust Flap", path: getDustFlap(x4, W, false, 'left') });
    
  } else if (boxModel === 'auto_lock') {
    // Auto Lock Bottom
    panels.push({ id: "top-tuck", name: "Top Tuck Flap", path: getTuckFlap(x1, L, true) });
    panels.push({ id: "top-dust-1", name: "Top Dust Flap", path: getDustFlap(x2, W, true, 'right') });
    panels.push({ id: "top-dust-2", name: "Top Dust Flap", path: getDustFlap(x4, W, true, 'left') });

    const lockD = W * 0.7; 
    panels.push({ id: "bot-lock-1", name: "Bottom Lock Flap 1", path: rect(x1, yBot, L, lockD) });
    panels.push({ id: "bot-lock-2", name: "Bottom Lock Flap 2", path: rect(x2, yBot, W, lockD) });
    panels.push({ id: "bot-lock-3", name: "Bottom Lock Flap 3", path: rect(x3, yBot, L, lockD) });
    panels.push({ id: "bot-lock-4", name: "Bottom Lock Flap 4", path: rect(x4, yBot, W, lockD) });
    
  } else {
    // Reverse Tuck End (Default)
    panels.push({ id: "top-tuck", name: "Top Tuck Flap", path: getTuckFlap(x1, L, true) });
    panels.push({ id: "top-dust-1", name: "Top Dust Flap", path: getDustFlap(x2, W, true, 'right') });
    panels.push({ id: "top-dust-2", name: "Top Dust Flap", path: getDustFlap(x4, W, true, 'left') });

    panels.push({ id: "bot-tuck", name: "Bottom Tuck Flap", path: getTuckFlap(x3, L, false) });
    panels.push({ id: "bot-dust-1", name: "Bottom Dust Flap", path: getDustFlap(x2, W, false, 'left') });
    panels.push({ id: "bot-dust-2", name: "Bottom Dust Flap", path: getDustFlap(x4, W, false, 'right') });
  }

  return panels;
}
