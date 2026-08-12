/**
 * Export Utility Engine for BoxCraft Pro
 * Generates and downloads production-ready CAD vector files directly from the browser.
 */

export function exportSVG(svgElement, filename = "dieline.svg") {
  if (!svgElement) {
    console.error("Export aborted: The target SVG element could not be found in the DOM.");
    return;
  }

  // 1. Clone the live element so we don't disrupt the user's interactive panning/zooming view
  const svgClone = svgElement.cloneNode(true);

  // 2. Enforce standard, absolute XML vector compliance namespaces
  svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // 3. Strip away any responsive scaling classes so it opens at a true 1:1 printable scale in Illustrator
  svgClone.removeAttribute("class");
  svgClone.style.background = "transparent"; 

  // 4. Convert the live DOM node structural tree into a clean raw XML string stream
  const XMLContentSerializer = new XMLSerializer();
  const rawXMLString = XMLContentSerializer.serializeToString(svgClone);

  // 5. Wrap the string buffer inside an immutable binary blob configured for high-fidelity vector data
  const exportBlob = new Blob(
    [
      '<?xml version="1.0" encoding="utf-8"?>\n',
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n',
      rawXMLString
    ],
    { type: "image/svg+xml;charset=utf-8" }
  );

  // 6. Trigger a clean, reliable browser-native link down-stream trigger
  const linkAnchor = document.createElement("a");
  const uniqueBlobObjectURL = URL.createObjectURL(exportBlob);

  linkAnchor.href = uniqueBlobObjectURL;
  linkAnchor.download = filename;
  
  document.body.appendChild(linkAnchor);
  linkAnchor.click();
  
  // 7. Thoroughly scrub the garbage collector variables to keep RAM performance light and clean
  document.body.removeChild(linkAnchor);
  URL.revokeObjectURL(uniqueBlobObjectURL);
}

export async function exportPDF(svgElement, filename = "dieline.pdf", colorMode = "RGB") {
  if (!svgElement) {
    console.error("Export aborted: SVG element missing.");
    return;
  }
  
  try {
    // Dynamically import to avoid Next.js SSR issues
    const { jsPDF } = await import("jspdf");
    await import("svg2pdf.js");

    // Extract precise viewBox dimensions (these are in inches for our app)
    let width = 11;
    let height = 8.5;
    
    if (svgElement.viewBox && svgElement.viewBox.baseVal && svgElement.viewBox.baseVal.width > 0) {
      width = svgElement.viewBox.baseVal.width;
      height = svgElement.viewBox.baseVal.height;
    } else {
      width = parseFloat(svgElement.getAttribute("width")) || width;
      height = parseFloat(svgElement.getAttribute("height")) || height;
    }

    // Initialize high-fidelity PDF document in INCHES
    const doc = new jsPDF({
      orientation: width > height ? "l" : "p",
      unit: "in",
      format: [width, height]
    });

    // Clone and sanitize SVG to ensure flawless conversion
    const svgClone = svgElement.cloneNode(true);
    svgClone.removeAttribute("class");
    svgClone.style.background = "transparent";
    
    // 1. Remove unsupported elements that crash svg2pdf, as well as UI-only elements
    // Note: 'image' is supported by svg2pdf if it uses data URLs or accessible links, so we don't remove it.
    const unsupported = svgClone.querySelectorAll("defs, filter, pattern, foreignObject, .editor-measurements");
    unsupported.forEach(el => el.remove());
    
    // 2. Remove comment nodes (React often inserts these and they crash svg2pdf)
    const iterator = document.createNodeIterator(svgClone, NodeFilter.SHOW_COMMENT, null, false);
    let currNode;
    const comments = [];
    while (currNode = iterator.nextNode()) comments.push(currNode);
    comments.forEach(c => c.parentNode.removeChild(c));
    
    // 3. Remove attributes that reference deleted defs or crash the parser
    const allElements = svgClone.querySelectorAll("*");
    allElements.forEach(el => {
      el.removeAttribute("marker-start");
      el.removeAttribute("marker-end");
      el.removeAttribute("marker");
      el.removeAttribute("filter");
    });
    
    // Explicitly embed styling for svg2pdf if needed (inline styles)
    const pathsAndGroups = svgClone.querySelectorAll("path, line, rect, circle, polyline, g");
    pathsAndGroups.forEach(p => {
      // Ensure stroke values are explicit for PDF conversion
      if (p.getAttribute("stroke") === "currentColor") p.setAttribute("stroke", "#000000");
      
      // Remove url() fills since defs/patterns were deleted, otherwise svg2pdf defaults to black
      const fill = p.getAttribute("fill");
      if (fill && fill.startsWith("url(")) {
        p.setAttribute("fill", "none");
      }
    });

    await doc.svg(svgClone, {
      x: 0,
      y: 0,
      width: width,
      height: height
    });

    // Save with the requested extension (.pdf or .ai)
    doc.save(filename);
  } catch (error) {
    console.error("Failed to generate PDF/AI file:", error);
    alert("There was an error generating the file. Check console for details.");
  }
}

// --- DXF EXPORTER ENGINE ---

function svgArcToSegments(cx, cy, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, tx, ty) {
  const rX = Math.abs(rx);
  const rY = Math.abs(ry);
  if (rX === 0 || rY === 0) return [{ x1: cx, y1: cy, x2: tx, y2: ty }];

  const dx2 = (cx - tx) / 2.0;
  const dy2 = (cy - ty) / 2.0;
  const phi = (xAxisRotation * Math.PI) / 180.0;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  let rxSq = rX * rX;
  let rySq = rY * rY;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  const lambda = x1pSq / rxSq + y1pSq / rySq;
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rxSq *= scale;
    rySq *= scale;
  }

  const sign = (largeArcFlag === sweepFlag) ? -1 : 1;
  const sq = Math.max(0, (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq));
  const coef = sign * Math.sqrt(sq);
  const cxp = coef * ((rX * y1p) / rY);
  const cyp = coef * -((rY * x1p) / rX);

  const centerX = cosPhi * cxp - sinPhi * cyp + (cx + tx) / 2.0;
  const centerY = sinPhi * cxp + cosPhi * cyp + (cy + ty) / 2.0;

  const ux = (x1p - cxp) / rX;
  const uy = (y1p - cyp) / rY;
  const vx = (-x1p - cxp) / rX;
  const vy = (-y1p - cyp) / rY;

  const uLength = Math.sqrt(ux * ux + uy * uy);
  const vLength = Math.sqrt(vx * vx + vy * vy);

  let dot = ux * vx + uy * vy;
  let theta = Math.acos(Math.max(-1, Math.min(1, dot / (uLength * vLength))));
  if (ux * vy - uy * vx < 0) theta = -theta;

  let startAngle = Math.atan2(uy, ux);
  let deltaAngle = theta;

  if (!sweepFlag && deltaAngle > 0) deltaAngle -= 2 * Math.PI;
  if (sweepFlag && deltaAngle < 0) deltaAngle += 2 * Math.PI;

  const numSegments = 8;
  const segments = [];
  let lastX = cx;
  let lastY = cy;

  for (let i = 1; i <= numSegments; i++) {
    const angle = startAngle + (deltaAngle * i) / numSegments;
    const nextX = centerX + rX * Math.cos(angle);
    const nextY = centerY + rY * Math.sin(angle);
    segments.push({ x1: lastX, y1: lastY, x2: nextX, y2: nextY });
    lastX = nextX;
    lastY = nextY;
  }
  return segments;
}

function quadraticBezierToSegments(x0, y0, x1, y1, x2, y2) {
  const numSegments = 8;
  const segments = [];
  let lastX = x0;
  let lastY = y0;
  for (let i = 1; i <= numSegments; i++) {
    const t = i / numSegments;
    const mt = 1 - t;
    const nextX = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
    const nextY = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
    segments.push({ x1: lastX, y1: lastY, x2: nextX, y2: nextY });
    lastX = nextX;
    lastY = nextY;
  }
  return segments;
}

function cubicBezierToSegments(x0, y0, x1, y1, x2, y2, x3, y3) {
  const numSegments = 8;
  const segments = [];
  let lastX = x0;
  let lastY = y0;
  for (let i = 1; i <= numSegments; i++) {
    const t = i / numSegments;
    const mt = 1 - t;
    const nextX = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
    const nextY = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
    segments.push({ x1: lastX, y1: lastY, x2: nextX, y2: nextY });
    lastX = nextX;
    lastY = nextY;
  }
  return segments;
}

function parsePathToLines(pathStr) {
  const lines = [];
  const tokens = pathStr.match(/[MLAZmlazQCqc]|-?\d+(\.\d+)?/g) || [];
  let cx = 0, cy = 0;
  let startX = 0, startY = 0;

  let idx = 0;
  while (idx < tokens.length) {
    const cmd = tokens[idx];
    if (cmd === 'M' || cmd === 'm') {
      const x = parseFloat(tokens[idx + 1]);
      const y = parseFloat(tokens[idx + 2]);
      cx = x;
      cy = y;
      startX = x;
      startY = y;
      idx += 3;
    } else if (cmd === 'L' || cmd === 'l') {
      const x = parseFloat(tokens[idx + 1]);
      const y = parseFloat(tokens[idx + 2]);
      lines.push({ x1: cx, y1: cy, x2: x, y2: y });
      cx = x;
      cy = y;
      idx += 3;
    } else if (cmd === 'A' || cmd === 'a') {
      const rx = parseFloat(tokens[idx + 1]);
      const ry = parseFloat(tokens[idx + 2]);
      const xAxisRot = parseFloat(tokens[idx + 3]);
      const largeArc = parseInt(tokens[idx + 4], 10);
      const sweep = parseInt(tokens[idx + 5], 10);
      const tx = parseFloat(tokens[idx + 6]);
      const ty = parseFloat(tokens[idx + 7]);

      const segments = svgArcToSegments(cx, cy, rx, ry, xAxisRot, largeArc, sweep, tx, ty);
      lines.push(...segments);
      cx = tx;
      cy = ty;
      idx += 8;
    } else if (cmd === 'Q' || cmd === 'q') {
      const isRelative = (cmd === 'q');
      const x1_rel = parseFloat(tokens[idx + 1]);
      const y1_rel = parseFloat(tokens[idx + 2]);
      const x2_rel = parseFloat(tokens[idx + 3]);
      const y2_rel = parseFloat(tokens[idx + 4]);
      
      const x1 = isRelative ? cx + x1_rel : x1_rel;
      const y1 = isRelative ? cy + y1_rel : y1_rel;
      const x2 = isRelative ? cx + x2_rel : x2_rel;
      const y2 = isRelative ? cy + y2_rel : y2_rel;

      const segments = quadraticBezierToSegments(cx, cy, x1, y1, x2, y2);
      lines.push(...segments);
      cx = x2;
      cy = y2;
      idx += 5;
    } else if (cmd === 'C' || cmd === 'c') {
      const isRelative = (cmd === 'c');
      const x1_rel = parseFloat(tokens[idx + 1]);
      const y1_rel = parseFloat(tokens[idx + 2]);
      const x2_rel = parseFloat(tokens[idx + 3]);
      const y2_rel = parseFloat(tokens[idx + 4]);
      const x3_rel = parseFloat(tokens[idx + 5]);
      const y3_rel = parseFloat(tokens[idx + 6]);

      const x1 = isRelative ? cx + x1_rel : x1_rel;
      const y1 = isRelative ? cy + y1_rel : y1_rel;
      const x2 = isRelative ? cx + x2_rel : x2_rel;
      const y2 = isRelative ? cy + y2_rel : y2_rel;
      const x3 = isRelative ? cx + x3_rel : x3_rel;
      const y3 = isRelative ? cy + y3_rel : y3_rel;

      const segments = cubicBezierToSegments(cx, cy, x1, y1, x2, y2, x3, y3);
      lines.push(...segments);
      cx = x3;
      cy = y3;
      idx += 7;
    } else if (cmd === 'Z' || cmd === 'z') {
      if (cx !== startX || cy !== startY) {
        lines.push({ x1: cx, y1: cy, x2: startX, y2: startY });
      }
      cx = startX;
      cy = startY;
      idx += 1;
    } else {
      const x = parseFloat(tokens[idx]);
      const y = parseFloat(tokens[idx + 1]);
      if (!isNaN(x) && !isNaN(y)) {
        lines.push({ x1: cx, y1: cy, x2: x, y2: y });
        cx = x;
        cy = y;
        idx += 2;
      } else {
        idx++;
      }
    }
  }
  return lines;
}

export function generateDXFString(dielineData) {
  const { cutPaths, bleedPaths, foldLines } = dielineData;

  let dxf = "";
  // 1. Header Section
  dxf += "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n";

  // 2. Tables Section
  dxf += "0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLTYPE\n70\n2\n";
  dxf += "0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n";
  dxf += "0\nLTYPE\n2\nDASHED\n70\n0\n3\nDashed line\n72\n65\n73\n2\n40\n24.0\n49\n12.0\n49\n-12.0\n";
  dxf += "0\nENDTAB\n";
  
  dxf += "0\nTABLE\n2\nLAYER\n70\n3\n";
  // Layer CUT (Red, color code 1)
  dxf += "0\nLAYER\n2\nCUT\n70\n0\n62\n1\n6\nCONTINUOUS\n";
  // Layer CREASE (Blue, color code 5)
  dxf += "0\nLAYER\n2\nCREASE\n70\n0\n62\n5\n6\nDASHED\n";
  // Layer BLEED (Green, color code 3)
  dxf += "0\nLAYER\n2\nBLEED\n70\n0\n62\n3\n6\nCONTINUOUS\n";
  dxf += "0\nENDTAB\n0\nENDSEC\n";

  // 3. Blocks Section (Empty)
  dxf += "0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n";

  // 4. Entities Section
  dxf += "0\nSECTION\n2\nENTITIES\n";

  const SCALE = 72.0; // Export in Points (72 pts = 1 inch) so Illustrator imports it at the perfect physical size natively.
  
  function writeLine(x1, y1, x2, y2, layer) {
    // In DXF, positive Y goes upwards.
    // In SVG, positive Y goes downwards.
    // We flip the Y coordinates here to make it render right-side up in CAD.
    const sx1 = (x1 * SCALE).toFixed(4);
    const sy1 = (y1 * SCALE).toFixed(4);
    const sx2 = (x2 * SCALE).toFixed(4);
    const sy2 = (y2 * SCALE).toFixed(4);
    return `0\nLINE\n8\n${layer}\n10\n${sx1}\n20\n${-sy1}\n30\n0.0\n11\n${sx2}\n21\n${-sy2}\n31\n0.0\n`;
  }

  // Export CUT elements
  if (cutPaths) {
    cutPaths.forEach(pathStr => {
      const lines = parsePathToLines(pathStr);
      lines.forEach(l => {
        dxf += writeLine(l.x1, l.y1, l.x2, l.y2, "CUT");
      });
    });
  }

  // Export BLEED elements
  if (bleedPaths) {
    bleedPaths.forEach(pathStr => {
      const lines = parsePathToLines(pathStr);
      lines.forEach(l => {
        dxf += writeLine(l.x1, l.y1, l.x2, l.y2, "BLEED");
      });
    });
  }

  // Export CREASE elements
  if (foldLines) {
    foldLines.forEach(l => {
      dxf += writeLine(l.x1, l.y1, l.x2, l.y2, "CREASE");
    });
  }

  dxf += "0\nENDSEC\n0\nEOF\n";
  return dxf;
}

export function exportDXF(dielineData, filename = "dieline.dxf") {
  const dxf = generateDXFString(dielineData);

  // Trigger browser file download
  const blob = new Blob([dxf], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}