const mongoose = require('mongoose');
require('dotenv').config();
const CatalogItem = require('../models/CatalogItem');

const initialModels = [
  {
    itemId: 'box-mockups',
    title: 'Box Mockups',
    subtitle: 'Straight & Reverse Tuck Folding Boxes',
    img: '/images/catalog/box-mockups.png',
    group: 'boxes',
    badge: '🔥 MOST POPULAR',
    tag: '3D & DXF Ready',
    isFeatured: true,
    order: 1,
  },
  {
    itemId: 'pouch-bag-mockups',
    title: 'Pouch / Bag Mockups',
    subtitle: 'Stand-Up Foil Pouches & Kraft Bags',
    img: '/images/catalog/pouch-bag-mockups.png',
    group: 'pouches',
    badge: '📐 DXF READY',
    tag: 'Customizable',
    isFeatured: false,
    order: 2,
  },
  {
    itemId: 'bottle-mockups',
    title: 'Bottle Mockups',
    subtitle: 'Beverage, Essential Oil & Wine Bottles',
    img: '/images/catalog/bottle-mockups.png',
    group: 'bottles',
    badge: '⭐ FEATURED',
    tag: 'Glass & Plastic',
    isFeatured: true,
    order: 3,
  },
  {
    itemId: 'can-mockups',
    title: 'Can Mockups',
    subtitle: 'Sleek & Standard Aluminum Drink Cans',
    img: '/images/catalog/can-mockups.png',
    group: 'bottles',
    badge: '',
    tag: 'Metallic Finish',
    isFeatured: false,
    order: 4,
  },
  {
    itemId: 'tube-mockups',
    title: 'Tube Mockups',
    subtitle: 'Cosmetic & Skincare Squeeze Tubes',
    img: '/images/catalog/tube-mockups.png',
    group: 'containers',
    badge: '',
    tag: 'Cosmetic Grade',
    isFeatured: false,
    order: 5,
  },
  {
    itemId: 'cup-container-mockups',
    title: 'Cup / Container Mockups',
    subtitle: 'Eco Paper Coffee Cups & Tubs',
    img: '/images/catalog/cup-container-mockups.png',
    group: 'containers',
    badge: '',
    tag: 'Eco Kraft',
    isFeatured: false,
    order: 6,
  },
  {
    itemId: 'food-packaging-mockups',
    title: 'Food Packaging Mockups',
    subtitle: 'Takeout, Noodle & Fast Food Boxes',
    img: '/images/catalog/food-packaging-mockups.png',
    group: 'containers',
    badge: '⚡ HOT',
    tag: 'Fast Food',
    isFeatured: false,
    order: 7,
  },
  {
    itemId: 'water-bottle-mockups',
    title: 'Water Bottle Mockups',
    subtitle: 'Sport PET & Mineral Water Bottles',
    img: '/images/catalog/water-bottle-mockups.png',
    group: 'bottles',
    badge: '',
    tag: 'Hydration',
    isFeatured: false,
    order: 8,
  },
  {
    itemId: 'gift-box-mockups',
    title: 'Gift Box Mockups',
    subtitle: 'Rigid Luxury & Magnetic Lid Boxes',
    img: '/images/catalog/gift-box-mockups.png',
    group: 'boxes',
    badge: '👑 PREMIUM',
    tag: 'Luxury Rigid',
    isFeatured: true,
    order: 9,
  },
  {
    itemId: 'paper-bag-mockups',
    title: 'Paper Bag Mockups',
    subtitle: 'Retail Shopping Bags with Handles',
    img: '/images/catalog/paper-bag-mockups.png',
    group: 'pouches',
    badge: '',
    tag: 'Retail & Gift',
    isFeatured: false,
    order: 10,
  },
];

async function seedModels() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI missing in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding models...');

    for (const model of initialModels) {
      await CatalogItem.findOneAndUpdate(
        { itemId: model.itemId },
        model,
        { upsert: true, new: true }
      );
    }

    console.log(`🎉 Successfully seeded ${initialModels.length} packaging models into MongoDB!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding packaging models:', err);
    process.exit(1);
  }
}

seedModels();
