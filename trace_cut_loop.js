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

const cuts = entities.filter(e => e.p['8'] === 'cuts');

// Convert ARC to start and end points
function arcEndpoints(arc) {
  const cx = arc.p['10'], cy = arc.p['20'], r = arc.p['40'];
  const a1 = (arc.p['50'] * Math.PI) / 180;
  const a2 = (arc.p['51'] * Math.PI) / 180;
  return {
    cx, cy, r, a1: arc.p['50'], a2: arc.p['51'],
    x1: cx + r * Math.cos(a1), y1: cy + r * Math.sin(a1),
    x2: cx + r * Math.cos(a2), y2: cy + r * Math.sin(a2)
  };
}

const segments = [];
cuts.forEach(e => {
  if (e.type === 'LINE') {
    segments.push({ type: 'LINE', x1: e.p['10'], y1: e.p['20'], x2: e.p['11'], y2: e.p['21'] });
  } else if (e.type === 'ARC') {
    const ep = arcEndpoints(e);
    segments.push({ type: 'ARC', ...ep });
  }
});

console.log('Total cut segments:', segments.length);

// Let's chain them into a continuous path starting at glue flap: (75, 521.5)
let currentPoint = { x: 75, y: 521.5 };
let ordered = [];
let remaining = [...segments];

while (remaining.length > 0) {
  let foundIdx = -1;
  let reverse = false;
  for (let i = 0; i < remaining.length; i++) {
    const s = remaining[i];
    const d1 = Math.hypot(s.x1 - currentPoint.x, s.y1 - currentPoint.y);
    const d2 = Math.hypot(s.x2 - currentPoint.x, s.y2 - currentPoint.y);
    if (d1 < 0.1) {
      foundIdx = i;
      reverse = false;
      break;
    } else if (d2 < 0.1) {
      foundIdx = i;
      reverse = true;
      break;
    }
  }
  if (foundIdx === -1) {
    console.log('Broken chain at', currentPoint, 'remaining:', remaining.length);
    break;
  }
  const s = remaining.splice(foundIdx, 1)[0];
  ordered.push({ s, reverse });
  currentPoint = reverse ? { x: s.x1, y: s.y1 } : { x: s.x2, y: s.y2 };
}

console.log('Ordered segments count:', ordered.length);
ordered.forEach(({ s, reverse }, idx) => {
  if (s.type === 'LINE') {
    const x1 = reverse ? s.x2 : s.x1, y1 = reverse ? s.y2 : s.y1;
    const x2 = reverse ? s.x1 : s.x2, y2 = reverse ? s.y1 : s.y2;
    console.log(`${idx}: LINE (${x1.toFixed(2)}, ${y1.toFixed(2)}) -> (${x2.toFixed(2)}, ${y2.toFixed(2)})`);
  } else {
    console.log(`${idx}: ARC center=(${s.cx.toFixed(2)}, ${s.cy.toFixed(2)}), r=${s.r}, a1=${s.a1.toFixed(1)}, a2=${s.a2.toFixed(1)}, rev=${reverse}`);
  }
});
