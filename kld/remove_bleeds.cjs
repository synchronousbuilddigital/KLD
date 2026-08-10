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

    // Remove the bleeds block with contents
    data = data.replace(/<g[^>]*lc:layername="bleeds"[^>]*?(?<!\/)>[\s\S]*?<\/g>/g, '');

    // Remove the self-closing bleeds blocks
    data = data.replace(/<g[^>]*lc:layername="bleeds"[^>]*\/>/g, '');

    fs.writeFileSync(file, data);
    console.log(`Bleeds safely removed from ${file}`);
  } catch (err) {
    console.log(`Skipping or failed ${file}: ${err.message}`);
  }
}
