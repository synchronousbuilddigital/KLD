const fs = require('fs');
const file = 'cosmeticBoxBDielineGenerator.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/"M140\.49999978,328\.49999966[^"]+L140\.5,66\.9999995"/g, '"M 140.5 328.5 L 140.5 147.0 Q 113.5 147.0 113.5 67.0 L 140.5 67.0"');

c = c.replace(/"M410\.50000022,66\.99999934[^"]+L410\.5,328\.4999995"/g, '"M 410.5 67.0 L 437.5 67.0 Q 437.5 147.0 410.5 147.0 L 410.5 328.5"');

fs.writeFileSync(file, c);
console.log('Done replacing strings.');
