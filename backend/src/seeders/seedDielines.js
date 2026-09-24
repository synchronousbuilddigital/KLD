const mongoose = require('mongoose');
require('dotenv').config();
const CatalogItem = require('../models/CatalogItem');

const dielineModels = [
  {
    itemId: 'te',
    title: 'Straight Tuck End Box',
    subtitle: 'Vector CAD Blueprint • 3D Studio',
    img: '/images/boxes/ste_white.jpg',
    dieline2DImg: '/images/dielines/ste_real.png',
    box3DImg: '/images/boxes/ste_white.jpg',
    group: 'dielines',
    boxModelKey: 'te',
    active: true,
    order: 1,
  },
  {
    itemId: 'rte',
    title: 'Reverse Tuck End Box',
    subtitle: 'Vector CAD Blueprint • 3D Studio',
    img: '/images/boxes/rte_white.jpg',
    dieline2DImg: '/images/dielines/rte_real.png',
    box3DImg: '/images/boxes/rte_white.jpg',
    group: 'dielines',
    boxModelKey: 'rte',
    active: true,
    order: 2,
  },
  {
    itemId: 'auto_lock',
    title: 'Auto Lock Bottom Box',
    subtitle: 'Vector CAD Blueprint • 3D Studio',
    img: '/images/boxes/auto_white.jpg',
    dieline2DImg: '/images/dielines/auto.svg',
    box3DImg: '/images/boxes/auto_white.jpg',
    group: 'dielines',
    boxModelKey: 'auto_lock',
    active: true,
    order: 3,
  },
  {
    itemId: 'cosmetic',
    title: 'Cosmetic Box',
    subtitle: 'Vector CAD Blueprint • 3D Studio',
    img: '/images/boxes/cosmetic_white.jpg',
    dieline2DImg: '/images/dielines/cosmetic_real.png',
    box3DImg: '/images/boxes/cosmetic_white.jpg',
    group: 'dielines',
    boxModelKey: 'cosmetic',
    active: true,
    order: 4,
  },
  {
    itemId: 'cosmetic_b',
    title: 'Cosmetic Box B (Mailer/Tray)',
    subtitle: 'Vector CAD Blueprint • 3D Studio',
    img: '/images/boxes/cosmetic_b_white.jpg',
    dieline2DImg: '/images/dielines/cosmetic_b.svg',
    box3DImg: '/images/boxes/cosmetic_b_white.jpg',
    group: 'dielines',
    boxModelKey: 'cosmetic_b',
    active: true,
    order: 5,
  },
  {
    itemId: 'button_hole',
    title: 'Button Hole Box',
    subtitle: 'Vector CAD Blueprint • 3D Studio',
    img: '/images/box.png',
    dieline2DImg: '/images/boxes/3_button_hole_box.svg',
    box3DImg: '/images/box.png',
    group: 'dielines',
    boxModelKey: 'button_hole',
    active: true,
    order: 6,
  }
];

async function seedDielines() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kld';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding dielines...');

    for (const model of dielineModels) {
      await CatalogItem.findOneAndUpdate(
        { itemId: model.itemId },
        model,
        { upsert: true, new: true }
      );
    }

    console.log(`🎉 Successfully seeded ${dielineModels.length} dieline models into CatalogItems!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding dieline models:', err);
    process.exit(1);
  }
}

seedDielines();
