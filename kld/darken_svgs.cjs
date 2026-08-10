const fs = require('fs');

const files = [
  'public/images/dielines/folding.svg',
  'public/images/dielines/tuck_end.svg',
  'public/images/dielines/paper_bag.svg',
  'public/images/dielines/box_lid.svg',
  'public/images/dielines/display_box.svg',
  'public/images/dielines/tray_box.svg',
  'public/images/dielines/rigid_box.svg',
  'public/images/dielines/envelope.svg'
];

for (const file of files) {
  try {
    let data = fs.readFileSync(file, 'utf8');

    // Replace stroke-width="1" (or similar small values) with stroke-width="5" to make them thicker
    // We'll just replace stroke-width="1" with stroke-width="5" 
    // and also catch stroke-width="0.something" if it exists.
    data = data.replace(/stroke-width="[0-9.]+"/g, 'stroke-width="5"');
    
    // Some SVGs might not explicitly declare stroke-width but just use stroke="black".
    // We can inject a style tag right before the closing </svg> to force all strokes to be thicker.
    const styleInject = `
    <style>
      * {
        stroke-width: 10px !important;
      }
    </style>
    `;
    
    if (!data.includes('<style>')) {
      const styleInject = `
      <style>
        * {
          stroke-width: 2px !important;
        }
        svg {
          overflow: visible !important;
        }
      </style>
      `;
      data = data.replace('</svg>', `${styleInject}\n</svg>`);
    } else {
      data = data.replace(/stroke-width:\s*4px\s*!important;/g, 'stroke-width: 2px !important;');
      if (!data.includes('overflow: visible')) {
        data = data.replace('</style>', '  svg { overflow: visible !important; }\n      </style>');
      }
    }

    fs.writeFileSync(file, data);
    console.log(`Made ${file} darker (thicker strokes)`);
  } catch (err) {
    console.log(`Skipping or failed ${file}: ${err.message}`);
  }
}
