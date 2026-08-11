// WARNING: This file is a TEMPORARY transitional legacy compatibility layer for standalone HTML box editors.
// The single AUTHORITATIVE source of truth for the DXF exporter is:
//   src/exporters/dxf.js
// This file will be deleted once the legacy editors are ported to React.

(function() {
  function generateDxf(geom, activeBoxes, options) {
    options = options || {};
    const bezierSteps = options.bezierSteps !== undefined ? options.bezierSteps : 8;
    const decimalPlaces = options.decimalPlaces !== undefined ? options.decimalPlaces : 3;

    const dxfLines = [];
    const addCutLine = (x1, y1, x2, y2) => dxfLines.push({ layer: 'CUT', x1, y1, x2, y2 });
    const addCreaseLine = (x1, y1, x2, y2) => dxfLines.push({ layer: 'CREASE', x1, y1, x2, y2 });

    const dieNatW = geom.flatW;
    const dieNatH = geom.flatH;
    const cutPath = (geom.cutPath || '').match(/[MLQZ][^MLQZ]*/g) || [];

    activeBoxes.forEach(function(box) {
      const bx = box.x;
      const by = box.y;
      const rot = box.rot;

      const isBoxRot = rot === 90 || rot === 270;
      const viewW = isBoxRot ? dieNatH : dieNatW;
      const viewH = isBoxRot ? dieNatW : dieNatH;

      const tx = bx + viewW / 2;
      const ty = by + viewH / 2;

      const rad = (rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const transformPoint = function(lx, ly) {
        const dx = lx - dieNatW / 2;
        const dy = ly - dieNatH / 2;
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        return {
          x: tx + rx,
          y: ty + ry
        };
      };

      (geom.creaseLines || []).forEach(function(lc) {
        const pt1 = transformPoint(lc.x1, lc.y1);
        const pt2 = transformPoint(lc.x2, lc.y2);
        addCreaseLine(pt1.x, pt1.y, pt2.x, pt2.y);
      });

      let localCurX = 0, localCurY = 0;
      let localStartX = 0, localStartY = 0;

      cutPath.forEach(function(cmd) {
        const tokens = cmd.trim().split(/[\s,]+/);
        const type = tokens[0];
        if (type === 'M') {
          const x = parseFloat(tokens[1]);
          const y = parseFloat(tokens[2]);
          localCurX = x;
          localCurY = y;
          localStartX = x;
          localStartY = y;
        } else if (type === 'L') {
          const x = parseFloat(tokens[1]);
          const y = parseFloat(tokens[2]);
          const pt1 = transformPoint(localCurX, localCurY);
          const pt2 = transformPoint(x, y);
          addCutLine(pt1.x, pt1.y, pt2.x, pt2.y);
          localCurX = x;
          localCurY = y;
        } else if (type === 'Q') {
          const x1_val = parseFloat(tokens[1]);
          const y1_val = parseFloat(tokens[2]);
          const x2_val = parseFloat(tokens[3]);
          const y2_val = parseFloat(tokens[4]);

          let prevX = localCurX;
          let prevY = localCurY;
          for (let i = 1; i <= bezierSteps; i++) {
            const t = i / bezierSteps;
            const mt = 1 - t;
            const lx = mt * mt * localCurX + 2 * mt * t * x1_val + t * t * x2_val;
            const ly = mt * mt * localCurY + 2 * mt * t * y1_val + t * t * y2_val;

            const pt1 = transformPoint(prevX, prevY);
            const pt2 = transformPoint(lx, ly);
            addCutLine(pt1.x, pt1.y, pt2.x, pt2.y);

            prevX = lx;
            prevY = ly;
          }
          localCurX = x2_val;
          localCurY = y2_val;
        } else if (type === 'Z') {
          const pt1 = transformPoint(localCurX, localCurY);
          const pt2 = transformPoint(localStartX, localStartY);
          addCutLine(pt1.x, pt1.y, pt2.x, pt2.y);
          localCurX = localStartX;
          localCurY = localStartY;
        }
      });
    });

    const dxf = [];
    dxf.push("  0", "SECTION", "  2", "HEADER", "  0", "ENDSEC");
    dxf.push("  0", "SECTION", "  2", "TABLES", "  0", "TABLE", "  2", "LAYER");
    dxf.push("  0", "LAYER", "  2", "CUT", " 70", "0", " 62", "5", "  6", "CONTINUOUS");
    dxf.push("  0", "LAYER", "  2", "CREASE", " 70", "0", " 62", "1", "  6", "DASHED");
    dxf.push("  0", "ENDTAB", "  0", "ENDSEC");
    dxf.push("  0", "SECTION", "  2", "ENTITIES");

    dxfLines.forEach(function(line) {
      dxf.push(
        "  0", "LINE",
        "  8", line.layer,
        " 10", line.x1.toFixed(decimalPlaces),
        " 20", line.y1.toFixed(decimalPlaces),
        " 30", "0.0",
        " 11", line.x2.toFixed(decimalPlaces),
        " 21", line.y2.toFixed(decimalPlaces),
        " 31", "0.0"
      );
    });

    dxf.push("  0", "ENDSEC", "  0", "EOF");

    return dxf.join("\n");
  }

  if (typeof window !== 'undefined') {
    window.DxfExporter = {
      generateDxf: generateDxf
    };
  }
})();
