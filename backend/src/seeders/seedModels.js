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
  {
    itemId: 'pizza-packaging-mockups',
    title: 'Pizza Box Mockups',
    subtitle: 'Takeout, Delivery & Corrugated Pizza Cartons',
    img: '/images/catalog/pizza-packaging-mockups.png',
    group: 'boxes',
    badge: '🍕 HOT',
    tag: '3D Studio',
    isFeatured: true,
    order: 11,
    variants: [
      { id: 1, name: 'Classic Pizza Box', animation: 'Lid flips up 90 degrees', imageUrl: '/images/pizza_box.png' },
      { id: 2, name: 'Slice Box', animation: 'Triangular lid opens', imageUrl: '/images/pizza_box.png' },
      { id: 3, name: 'Hexagonal Pizza Box', animation: 'Six-sided fold unfolds', imageUrl: '/images/pizza_box.png' },
      { id: 4, name: 'Window Pizza Box', animation: 'Clear plastic window shines', imageUrl: '/images/pizza_box.png' },
      { id: 5, name: 'Premium Pizza Carton', animation: 'Tear-away corner rips', imageUrl: '/images/pizza_box.png' },
      { id: 6, name: 'Deep Dish Box', animation: 'Tall walls assemble', imageUrl: '/images/pizza_box.png' },
      { id: 7, name: 'Delivery Box', animation: 'Steam escapes from vents', imageUrl: '/images/pizza_box.png' },
      { id: 8, name: 'Fold Flat Pizza Box', animation: 'Collapses into 2D sheet', imageUrl: '/images/pizza_box.png' },
      { id: 9, name: 'Eco Pizza Box', animation: 'Molded fiber texture reveals', imageUrl: '/images/pizza_box.png' },
      { id: 10, name: 'Carry Handle Pizza Box', animation: 'Handle pops up from top', imageUrl: '/images/pizza_box.png' },
      { id: 11, name: 'Family Pack Box', animation: 'Double tier separates', imageUrl: '/images/pizza_box.png' },
      { id: 12, name: 'Smart Vent Box', animation: 'Vents pop open dynamically', imageUrl: '/images/pizza_box.png' },
      { id: 13, name: 'Gourmet Pizza Box', animation: 'Magnetic flap opens', imageUrl: '/images/pizza_box.png' },
      { id: 14, name: 'Sleeve Pizza Box', animation: 'Tray slides out from sleeve', imageUrl: '/images/pizza_box.png' },
      { id: 15, name: 'Magnetic Pizza Box', animation: 'Lid snaps shut', imageUrl: '/images/pizza_box.png' },
      { id: 16, name: 'Dual Compartment Box', animation: 'Center divider pops up', imageUrl: '/images/pizza_box.png' },
      { id: 17, name: 'Luxury Pizza Box', animation: 'Gold foil shines on lid', imageUrl: '/images/pizza_box.png' },
      { id: 18, name: 'Hinged Pizza Box', animation: 'Smooth back hinge pivot', imageUrl: '/images/pizza_box.png' },
      { id: 19, name: 'Floating Pizza Box', animation: 'Hovering box opening', imageUrl: '/images/pizza_box.png' },
      { id: 20, name: 'Animated Opening Pizza Box', animation: 'Full breakdown animation', imageUrl: '/images/pizza_box.png' },
    ],
  },
  {
    itemId: 'supplement-bottle-mockups',
    title: 'Supplement Box Mockups',
    subtitle: 'Pharma, Health & Vitamin Packaging',
    img: '/images/catalog/supplement-bottle-mockups.png',
    group: 'containers',
    badge: '💊 POPULAR',
    tag: '3D Studio',
    isFeatured: true,
    order: 12,
    variants: [
      { id: 1, name: 'Protein Jar', animation: 'Massive lid unscrews', imageUrl: '/images/supplement.png' },
      { id: 2, name: 'Vitamin Bottle', animation: 'Cotton plug removes', imageUrl: '/images/supplement.png' },
      { id: 3, name: 'Omega Bottle', animation: 'Amber plastic shines', imageUrl: '/images/supplement.png' },
      { id: 4, name: 'Capsule Container', animation: 'Pills tumble inside', imageUrl: '/images/supplement.png' },
      { id: 5, name: 'Powder Tub', animation: 'Scoop levitates out', imageUrl: '/images/supplement.png' },
      { id: 6, name: 'Sports Nutrition Jar', animation: 'Metallic label gleams', imageUrl: '/images/supplement.png' },
      { id: 7, name: 'Black Matte Supplement Bottle', animation: 'Sleek texture reveal', imageUrl: '/images/supplement.png' },
      { id: 8, name: 'White Clinical Bottle', animation: 'Safety seal peels off', imageUrl: '/images/supplement.png' },
      { id: 9, name: 'Transparent Supplement Bottle', animation: 'Capsules visibly bounce', imageUrl: '/images/supplement.png' },
      { id: 10, name: 'Luxury Wellness Bottle', animation: 'Glass reflection shines', imageUrl: '/images/supplement.png' },
      { id: 11, name: 'Eco Supplement Bottle', animation: 'Cardboard tube opens', imageUrl: '/images/supplement.png' },
      { id: 12, name: 'Glass Wellness Bottle', animation: 'Metal cap spins off', imageUrl: '/images/supplement.png' },
      { id: 13, name: 'Functional Mushroom Bottle', animation: 'Earthy texture maps on', imageUrl: '/images/supplement.png' },
      { id: 14, name: 'Creatine Jar', animation: 'Shrink wrap tears away', imageUrl: '/images/supplement.png' },
      { id: 15, name: 'Electrolyte Container', animation: 'Vibrant color pop', imageUrl: '/images/supplement.png' },
      { id: 16, name: 'Energy Supplement Bottle', animation: 'Dynamic glow effect', imageUrl: '/images/supplement.png' },
      { id: 17, name: 'Stackable Supplement Containers', animation: 'Multiple layers lock', imageUrl: '/images/supplement.png' },
      { id: 18, name: 'Smart Cap Bottle', animation: 'LED cap tracks usage', imageUrl: '/images/supplement.png' },
      { id: 19, name: 'Premium Gold Accent Bottle', animation: 'Gold rim sparkles', imageUrl: '/images/supplement.png' },
      { id: 20, name: 'Floating Supplement Bottle', animation: 'Zero-G lid separation', imageUrl: '/images/supplement.png' },
    ],
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
