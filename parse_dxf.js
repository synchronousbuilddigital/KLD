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

console.log('Entities count:', entities.length);
entities.forEach((e) => {
  const layer = e.p['8'];
  if (layer === 'cuts') {
    if (e.type === 'LINE') {
      console.log(`CUT LINE: (${e.p['10']}, ${e.p['20']}) -> (${e.p['11']}, ${e.p['21']})`);
    } else if (e.type === 'ARC') {
      console.log(`CUT ARC: center=(${e.p['10']}, ${e.p['20']}), r=${e.p['40']}, angles=(${e.p['50']}, ${e.p['51']})`);
    }
  } else if (layer === 'folds') {
    console.log(`FOLD LINE: (${e.p['10']}, ${e.p['20']}) -> (${e.p['11']}, ${e.p['21']})`);
  } else if (layer === 'bleeds') {
    console.log(`BLEED LINE: (${e.p['10']}, ${e.p['20']}) -> (${e.p['11']}, ${e.p['21']})`);
  }
});
