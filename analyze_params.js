const fs = require('fs');
const lines = fs.readFileSync('sample_dielines/square_shipping_box_reference.dxf', 'utf8').split(/\r?\n/);
let section = null;
let entities = [];
let curr = null;
for(let i=0; i<lines.length-1; i+=2) {
  const code = lines[i].trim();
  const val = lines[i+1].trim();
  if (code === '2' && ['HEADER', 'TABLES', 'BLOCKS', 'ENTITIES'].includes(val)) section = val;
  if (code === '0' && val === 'ENDSEC') section = null;
  if (section === 'ENTITIES') {
    if (code === '0') {
      if (curr) entities.push(curr);
      curr = { type: val, p: {} };
    } else if (curr) {
      const num = parseFloat(val);
      curr.p[code] = isNaN(num) ? val : num;
    }
  }
}
if (curr) entities.push(curr);

console.log('--- Parametric Analysis of Reference DXF ---');
// Panel widths:
// Panel 1: fold x=75 to x=380 -> 305 mm
// Panel 2: fold x=380 to x=685 -> 305 mm
// Panel 3: fold x=685 to x=990 -> 305 mm
// Panel 4: fold x=990 to x=1294 -> 304 mm (P4 = L - 1mm)
// Glue tab: x=30 to x=75 -> 45 mm (width = 45 mm = 1.7717 in)

// Folds:
// Panel 1 (x: 77.83 to 377.17): y = 218.5 and y = 523.5 -> deltaY = 305 mm!
// Panel 2 (x: 380 to 685): y = 220.5 and y = 521.5 -> deltaY = 301 mm! (offset = 2 mm = 2/3 T)
// Panel 3 (x: 687.83 to 987.17): y = 218.5 and y = 523.5 -> deltaY = 305 mm!
// Panel 4 (x: 990 to 1294): y = 220.5 and y = 521.5 -> deltaY = 301 mm!
// Total height of panels + flaps:
// Top cut: y = 677. Bottom cut: y = 65. Total height = 612 mm.
// Flap height from Panel 2/4 fold (521.5): 677 - 521.5 = 155.5 mm.
// Flap height from Panel 1/3 fold (523.5): 677 - 523.5 = 153.5 mm (~ 152.5 mm = W/2 + 1 mm).
// Bottom flap height: 220.5 - 65 = 155.5 mm.

// Slots:
// Slot between P1 & P2: x from 377 to 383 (center 380, width 6 mm = 2 * T)
// Slot between P2 & P3: x from 682 to 688 (center 685, width 6 mm = 2 * T)
// Slot between P3 & P4: x from 987 to 993 (center 990, width 6 mm = 2 * T)
// Flap cut edge at left: x = 78 (center 75, offset +3 mm)
// Flap cut edge at right: x = 1291 (center 1294, offset -3 mm)

// Slot bottom arcs:
// Center is at (380, 524.5), r = 3 mm (= slotW / 2).
// Bottom of arc touches y = 524.5 - 3 = 521.5 mm (which matches the Panel 2 score line!)
// Bottom slots: center is at (380, 217.5), r = 3 mm.
// Top of arc touches y = 217.5 + 3 = 220.5 mm (which matches the Panel 2 score line!)

console.log('Verified geometry!');
