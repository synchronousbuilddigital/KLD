const mongoose = require('mongoose');
require('dotenv').config();
const PackagingModel = require('../models/PackagingModel');

const initialModels = [
  {
    modelId: 'box-mockups',
    title: 'Box Mockups',
    subtitle: 'Straight & Reverse Tuck Folding Boxes',
    img: '/images/box.png',
    group: 'boxes',
    badge: '🔥 MOST POPULAR',
    tag: '3D & DXF Ready',
    isFeatured: true,
    order: 1,
  },
  {
    modelId: 'pouch-bag-mockups',
    title: 'Pouch / Bag Mockups',
    subtitle: 'Stand-Up Foil Pouches & Kraft Bags',
    img: '/images/pouch.png',
    group: 'pouches',
    badge: '📐 DXF READY',
    tag: 'Customizable',
    isFeatured: false,
    order: 2,
  },
  {
    modelId: 'bottle-mockups',
    title: 'Bottle Mockups',
    subtitle: 'Beverage, Essential Oil & Wine Bottles',
    img: '/images/bottle.png',
    group: 'bottles',
    badge: '⭐ FEATURED',
    tag: 'Glass & Plastic',
    isFeatured: true,
    order: 3,
  },
  {
    modelId: 'can-mockups',
    title: 'Can Mockups',
    subtitle: 'Sleek & Standard Aluminum Drink Cans',
    img: '/images/can.png',
    group: 'bottles',
    badge: '',
    tag: 'Metallic Finish',
    isFeatured: false,
    order: 4,
  },
  {
    modelId: 'tube-mockups',
    title: 'Tube Mockups',
    subtitle: 'Cosmetic & Skincare Squeeze Tubes',
    img: '/images/tube.png',
    group: 'containers',
    badge: '',
    tag: 'Cosmetic Grade',
    isFeatured: false,
    order: 5,
  },
  {
    modelId: 'cup-container-mockups',
    title: 'Cup / Container Mockups',
    subtitle: 'Eco Paper Coffee Cups & Tubs',
    img: '/images/cup.png',
    group: 'containers',
    badge: '',
    tag: 'Eco Kraft',
    isFeatured: false,
    order: 6,
  },
  {
    modelId: 'food-packaging-mockups',
    title: 'Food Packaging Mockups',
    subtitle: 'Takeout, Noodle & Fast Food Boxes',
    img: '/images/pizza_box.png',
    group: 'containers',
    badge: '⚡ HOT',
    tag: 'Fast Food',
    isFeatured: false,
    order: 7,
  },
  {
    modelId: 'water-bottle-mockups',
    title: 'Water Bottle Mockups',
    subtitle: 'Sport PET & Mineral Water Bottles',
    img: '/images/supplement.png',
    group: 'bottles',
    badge: '',
    tag: 'Hydration',
    isFeatured: false,
    order: 8,
  },
  {
    modelId: 'gift-box-mockups',
    title: 'Gift Box Mockups',
    subtitle: 'Rigid Luxury & Magnetic Lid Boxes',
    img: '/images/gift_box.png',
    group: 'boxes',
    badge: '👑 PREMIUM',
    tag: 'Luxury Rigid',
    isFeatured: true,
    order: 9,
  },
  {
    modelId: 'paper-bag-mockups',
    title: 'Paper Bag Mockups',
    subtitle: 'Retail Shopping Bags with Handles',
    img: '/images/paper_bag.png',
    group: 'pouches',
    badge: '',
    tag: 'Retail & Gift',
    isFeatured: false,
    order: 10,
  },
  {
    modelId: 'pizza-packaging-mockups',
    title: 'Pizza Packaging Mockups',
    subtitle: 'E-Flute Corrugated Folding Pizza Boxes',
    img: '/images/pizza_box.png',
    group: 'boxes',
    badge: '',
    tag: 'E-Flute Kraft',
    isFeatured: false,
    order: 11,
  },
  {
    modelId: 'supplement-bottle-mockups',
    title: 'Supplement Bottle Mockups',
    subtitle: 'Pharma & Vitamin Pill Containers',
    img: '/images/supplement.png',
    group: 'bottles',
    badge: '',
    tag: 'Pharma Grade',
    isFeatured: false,
    order: 12,
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
      await PackagingModel.findOneAndUpdate(
        { modelId: model.modelId },
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
