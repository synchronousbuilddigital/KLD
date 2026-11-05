export function generatePanelHitboxes(L, W, H, T, dimensions, glueFlapWidth, boxModel = 'rte') {
  const nT = Math.max(0.015, Number(T) || 0.0197);
  const { x1, x2, x3, x4, x5, yTop, yBot } = dimensions;
  
  const rect = (x, y, w, h) => `M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h} L ${x} ${y+h} Z`;

  if (boxModel === 'sipper_water_bottle' || boxModel === 'water_bottle_handle' || boxModel === 'sipper_bottle') {
    return [
      { id: "p1-label", name: "Sipper Bottle Wrap Label", path: rect(x1, yTop, L, W) },
      { id: "glue-flap", name: "Glue Overlap", path: rect(0, yTop, glueFlapWidth || 0.25, W) }
    ];
  }

  if (boxModel === 'water_bottle') {
    return [
      { id: "p1-label", name: "Bottle Wrap Label", path: rect(x1, yTop, L, W) },
      { id: "glue-flap", name: "Glue Overlap", path: rect(0, yTop, glueFlapWidth || 0.25, W) }
    ];
  }

  if (boxModel === 'can' || boxModel === 'soda_can' || boxModel === 'beverage_can') {
    return [
      { id: "p1-label", name: "Can Wrap Label", path: rect(x1, yTop, L, W) },
      { id: "glue-flap", name: "Glue Overlap", path: rect(0, yTop, glueFlapWidth || 0.25, W) }
    ];
  }

    if (boxModel === 'pizza_box' || boxModel === 'fefco_0426' || boxModel === 'pizza') {
    const d = dimensions || {};
    const p = [];
    if (d.floor) p.push({ id: "base-floor", name: "Tray Bottom Floor", path: rect(d.floor.x, d.floor.y, d.floor.w, d.floor.h) });
    if (d.lid) p.push({ id: "lid-top", name: "Lid Top (Cover)", path: rect(d.lid.x, d.lid.y, d.lid.w, d.lid.h) });
    if (d.front) p.push({ id: "front-wall", name: "Front Wall", path: rect(d.front.x, d.front.y, d.front.w, d.front.h) });
    if (d.back) p.push({ id: "back-wall", name: "Rear Hinge Wall", path: rect(d.back.x, d.back.y, d.back.w, d.back.h) });
    if (d.leftWall) p.push({ id: "left-wall", name: "Left Wall", path: rect(d.leftWall.x, d.leftWall.y, d.leftWall.w, d.leftWall.h) });
    if (d.rightWall) p.push({ id: "right-wall", name: "Right Wall", path: rect(d.rightWall.x, d.rightWall.y, d.rightWall.w, d.rightWall.h) });
    return p;
  }

  if (boxModel === 'fefco_0300' || boxModel === 'shoe_box_with_lid') {
    const b = dimensions?.base || {};
    const l = dimensions?.lid || {};
    const p = [];
    if (b.floor) p.push({ id: "base-floor", name: "Base Floor", path: rect(b.floor.x, b.floor.y, b.floor.w, b.floor.h) });
    if (b.wallTop) p.push({ id: "base-front", name: "Base Front Wall", path: rect(b.wallTop.x, b.wallTop.y, b.wallTop.w, b.wallTop.h) });
    if (b.wallBot) p.push({ id: "base-back", name: "Base Back Wall", path: rect(b.wallBot.x, b.wallBot.y, b.wallBot.w, b.wallBot.h) });
    if (b.wallLeft) p.push({ id: "base-left", name: "Base Left Wall", path: rect(b.wallLeft.x, b.wallLeft.y, b.wallLeft.w, b.wallLeft.h) });
    if (b.wallRight) p.push({ id: "base-right", name: "Base Right Wall", path: rect(b.wallRight.x, b.wallRight.y, b.wallRight.w, b.wallRight.h) });

    if (l.roof) p.push({ id: "lid-top", name: "Lid Top (Roof)", path: rect(l.roof.x, l.roof.y, l.roof.w, l.roof.h) });
    if (l.wallTop) p.push({ id: "lid-front", name: "Lid Front Wall", path: rect(l.wallTop.x, l.wallTop.y, l.wallTop.w, l.wallTop.h) });
    if (l.wallBot) p.push({ id: "lid-back", name: "Lid Back Wall", path: rect(l.wallBot.x, l.wallBot.y, l.wallBot.w, l.wallBot.h) });
    if (l.wallLeft) p.push({ id: "lid-left", name: "Lid Left Wall", path: rect(l.wallLeft.x, l.wallLeft.y, l.wallLeft.w, l.wallLeft.h) });
    if (l.wallRight) p.push({ id: "lid-right", name: "Lid Right Wall", path: rect(l.wallRight.x, l.wallRight.y, l.wallRight.w, l.wallRight.h) });
    return p;
  }

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
    
  } else if (boxModel === 'button_hole') {
    // Button Hole / Snap Lock Bottom
    panels.push({ id: "top-tuck", name: "Top Tuck Flap", path: getTuckFlap(x1, L, true) });
    panels.push({ id: "top-dust-1", name: "Top Dust Flap", path: getDustFlap(x2, W, true, 'right') });
    panels.push({ id: "top-dust-2", name: "Top Dust Flap", path: getDustFlap(x4, W, true, 'left') });

    const lockD = W * 0.75; 
    panels.push({ id: "bot-lock-1", name: "Bottom Lock Flap 1", path: rect(x1, yBot, L, lockD) });
    panels.push({ id: "bot-lock-2", name: "Bottom Lock Flap 2", path: rect(x2, yBot, W, lockD * 0.6) });
    panels.push({ id: "bot-lock-3", name: "Bottom Lock Flap 3", path: rect(x3, yBot, L, lockD) });
    panels.push({ id: "bot-lock-4", name: "Bottom Lock Flap 4", path: rect(x4, yBot, W, lockD * 0.6) });
    
  } else if (boxModel === 'rsc') {
    // Square Shipping Box (RSC)
    const flapH = W / 2;
    panels.push({ id: "top-flap-1", name: "Top Front Flap", path: rect(x1, yTop - flapH, L, flapH) });
    panels.push({ id: "top-flap-2", name: "Top Right Flap", path: rect(x2, yTop - flapH, W, flapH) });
    panels.push({ id: "top-flap-3", name: "Top Back Flap", path: rect(x3, yTop - flapH, L, flapH) });
    panels.push({ id: "top-flap-4", name: "Top Left Flap", path: rect(x4, yTop - flapH, W, flapH) });

    panels.push({ id: "bot-flap-1", name: "Bottom Front Flap", path: rect(x1, yBot, L, flapH) });
    panels.push({ id: "bot-flap-2", name: "Bottom Right Flap", path: rect(x2, yBot, W, flapH) });
    panels.push({ id: "bot-flap-3", name: "Bottom Back Flap", path: rect(x3, yBot, L, flapH) });
    panels.push({ id: "bot-flap-4", name: "Bottom Left Flap", path: rect(x4, yBot, W, flapH) });

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
