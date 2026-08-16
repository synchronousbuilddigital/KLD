import { rawAutoLockPaths } from './autoLockDielineRaw';

export function generateAutoLockDieline({ L, W, H, glueFlapWidth = 16.0, windowDecals }) {
  const nL = Number(L);
  const nW = Number(W);
  const nH = Number(H);
  const nGlue = Number(glueFlapWidth);

  // Original parameters from auto.svg
  const origL = 120.6;
  const origW = 60.6;
  const origH = 161.5;

  const origYTop = 80.35;
  const origYBot = 241.85;

  const yTop = nW * 1.3;
  const yBot = yTop + nH;

  const origX1 = 21.0;
  const origX2 = origX1 + origL;
  const origX3 = origX2 + origW;
  const origX4 = origX3 + origL;
  const origX5 = origX4 + origW;

  const x1 = nGlue;
  const x2 = x1 + nL;
  const x3 = x2 + nW;
  const x4 = x3 + nL;
  const x5 = x4 + nW;

  function mapX(x) {
    if (x <= origX1) {
      return (x / origX1) * nGlue;
    } else if (x <= origX2) {
      return x1 + ((x - origX1) / origL) * nL;
    } else if (x <= origX3) {
      return x2 + ((x - origX2) / origW) * nW;
    } else if (x <= origX4) {
      return x3 + ((x - origX3) / origL) * nL;
    } else {
      return x4 + ((x - origX4) / origW) * nW;
    }
  }

  function mapY(y) {
    if (y <= origYTop) {
      return yTop - ((origYTop - y) / origW) * nW;
    } else if (y <= origYBot) {
      return yTop + ((y - origYTop) / origH) * nH;
    } else {
      return yBot + ((y - origYBot) / origW) * nW;
    }
  }

  function transformPathStr(d) {
    const tokens = d.match(/[a-zA-Z]+|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
    if (!tokens) return d;
    
    let result = '';
    let cmd = '';
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (/^[a-zA-Z]$/.test(token)) {
        cmd = token.toUpperCase();
        result += token + ' ';
        i++;
      } else {
        if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
          const x = mapX(parseFloat(tokens[i]));
          const y = mapY(parseFloat(tokens[i+1]));
          result += x.toFixed(2) + ',' + y.toFixed(2) + ' ';
          i += 2;
        } else if (cmd === 'C') {
          const x1 = mapX(parseFloat(tokens[i]));
          const y1 = mapY(parseFloat(tokens[i+1]));
          const x2 = mapX(parseFloat(tokens[i+2]));
          const y2 = mapY(parseFloat(tokens[i+3]));
          const x = mapX(parseFloat(tokens[i+4]));
          const y = mapY(parseFloat(tokens[i+5]));
          result += x1.toFixed(2) + ',' + y1.toFixed(2) + ' ' + x2.toFixed(2) + ',' + y2.toFixed(2) + ' ' + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
          i += 6;
        } else if (cmd === 'S' || cmd === 'Q') {
          const x1 = mapX(parseFloat(tokens[i]));
          const y1 = mapY(parseFloat(tokens[i+1]));
          const x = mapX(parseFloat(tokens[i+2]));
          const y = mapY(parseFloat(tokens[i+3]));
          result += x1.toFixed(2) + ',' + y1.toFixed(2) + ' ' + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
          i += 4;
        } else if (cmd === 'A') {
          const origX = parseFloat(tokens[i+5]);
          const origY = parseFloat(tokens[i+6]);
          const rx = parseFloat(tokens[i]);
          const ry = parseFloat(tokens[i+1]);
          const sX = Math.abs(mapX(origX) - mapX(origX - rx));
          const sY = Math.abs(mapY(origY) - mapY(origY - ry));
          result += sX.toFixed(2) + ',' + sY.toFixed(2) + ' ' +
                    tokens[i+2] + ' ' + tokens[i+3] + ' ' + tokens[i+4] + ' ' +
                    mapX(origX).toFixed(2) + ',' + mapY(origY).toFixed(2) + ' ';
          i += 7;
        } else if (cmd === 'H') {
           result += mapX(parseFloat(tokens[i])).toFixed(2) + ' ';
           i++;
        } else if (cmd === 'V') {
           result += mapY(parseFloat(tokens[i])).toFixed(2) + ' ';
           i++;
        } else {
           result += tokens[i] + ' ';
           i++;
        }
      }
    }
    return result.trim();
  }

  function transformItems(items) {
    const res = [];
    for (const item of items) {
      if (item.type === 'line') {
        const d = `M ${mapX(item.x1).toFixed(2)},${mapY(item.y1).toFixed(2)} L ${mapX(item.x2).toFixed(2)},${mapY(item.y2).toFixed(2)}`;
        res.push(d);
      } else if (item.type === 'path') {
        res.push(transformPathStr(item.d));
      }
    }
    return res;
  }

  const cutPaths = transformItems(rawAutoLockPaths.cuts);
  const bleedPaths = transformItems(rawAutoLockPaths.bleeds);
  
  let foldLines = rawAutoLockPaths.folds.map(item => {
    if (item.type === 'line') {
      return { x1: mapX(item.x1), y1: mapY(item.y1), x2: mapX(item.x2), y2: mapY(item.y2) };
    }
    return null;
  }).filter(Boolean);

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

  return {
    width: x5, 
    height: yBot + (mapY(300) - mapY(241.85)), 
    cutPaths,
    bleedPaths, 
    foldLines,
    dimensions: { L: nL, W: nW, H: nH, x1, x2, x3, x4, x5, yTop, yBot }
  };
}
