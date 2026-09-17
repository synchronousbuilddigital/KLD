const CatalogItem = require('../../models/CatalogItem');

const DEFAULT_CATALOG_ITEMS = [
  {
    itemId: 'box-mockups',
    title: 'Box Mockups',
    subtitle: 'Straight & Reverse Tuck Folding Boxes',
    img: '/images/catalog/box-mockups.jpg',
    group: 'boxes',
    badge: '🔥 MOST POPULAR',
    tag: '3D & DXF Ready',
    isFeatured: true,
    active: true,
    order: 1,
    boxModelKey: 'rte',
    variants: [
      { id: 1, name: 'Reverse Tuck End Box', animation: 'Flaps fold in opposite directions', imageUrl: '/images/boxes/rte_white.jpg', whiteImageUrl: '/images/boxes/rte_white.jpg', kraftImageUrl: '/images/boxes/rte_kraft.jpg', boxModelKey: 'rte', gridSize: 'large' },
      { id: 2, name: 'Tuck End Box', animation: 'Flaps fold in same direction', imageUrl: '/images/boxes/ste_white.jpg', whiteImageUrl: '/images/boxes/ste_white.jpg', kraftImageUrl: '/images/boxes/ste_kraft.jpg', boxModelKey: 'te', gridSize: 'large' },
      { id: 3, name: 'Auto Lock Bottom Box', animation: 'Bottom flaps lock automatically', imageUrl: '/images/boxes/auto_white.jpg', whiteImageUrl: '/images/boxes/auto_white.jpg', kraftImageUrl: '/images/boxes/auto_kraft.jpg', boxModelKey: 'auto_lock', gridSize: 'large' },
      { id: 4, name: 'Cosmetic Box', animation: 'Internal platform flaps fold securely', imageUrl: '/images/boxes/cosmetic_white.jpg', whiteImageUrl: '/images/boxes/cosmetic_white.jpg', kraftImageUrl: '/images/boxes/cosmetic_kraft.jpg', boxModelKey: 'cosmetic', gridSize: 'large' },
      { id: 5, name: 'Cosmetic Box B (Mailer/Tray Style)', animation: 'Roll end tray and tuck front closure', imageUrl: '/images/boxes/cosmetic_b_white.jpg', whiteImageUrl: '/images/boxes/cosmetic_b_white.jpg', kraftImageUrl: '/images/boxes/cosmetic_b_kraft.jpg', boxModelKey: 'cosmetic_b', gridSize: 'large' },
    ],
  },
  {
    itemId: 'pouch-bag-mockups',
    title: 'Pouch / Bag Mockups',
    subtitle: 'Stand-Up Foil Pouches & Kraft Bags',
    img: '/images/catalog/pouch-bag-mockups.jpg',
    group: 'pouches',
    badge: '⚡ HIGH REVENUE',
    tag: '3D Visualizer',
    isFeatured: true,
    active: true,
    order: 2,
    boxModelKey: 'rte',
    variants: [
      { id: 1, name: 'Stand-Up Pouch', animation: 'Expands from flat', imageUrl: '/images/pouch.png' },
      { id: 2, name: 'Zip Lock Pouch', animation: 'Zipper opens', imageUrl: '/images/pouch.png' },
      { id: 3, name: 'Doypack Pouch', animation: 'Inflates', imageUrl: '/images/pouch.png' },
      { id: 4, name: 'Kraft Food Bag', animation: 'Top unfolds', imageUrl: '/images/pouch.png' },
      { id: 5, name: 'Vacuum Pack', animation: 'Expands', imageUrl: '/images/pouch.png' },
      { id: 6, name: 'Coffee Pouch', animation: 'Valve reveal', imageUrl: '/images/pouch.png' },
      { id: 7, name: 'Metallic Pouch', animation: 'Dynamic reflections', imageUrl: '/images/pouch.png' },
      { id: 8, name: 'Window Pouch', animation: 'Inner contents appear', imageUrl: '/images/pouch.png' },
      { id: 9, name: 'Side Gusset Bag', animation: 'Side expansion', imageUrl: '/images/pouch.png' },
      { id: 10, name: 'Flat Sachet', animation: 'Opens like envelope', imageUrl: '/images/pouch.png' },
      { id: 11, name: 'Cosmetic Refill Pouch', animation: 'Spout reveal', imageUrl: '/images/pouch.png' },
      { id: 12, name: 'Hanging Retail Pouch', animation: 'Rotates', imageUrl: '/images/pouch.png' },
      { id: 13, name: 'Protein Bag', animation: 'Expands vertically', imageUrl: '/images/pouch.png' },
      { id: 14, name: 'Fold Over Pouch', animation: 'Fold unwraps', imageUrl: '/images/pouch.png' },
      { id: 15, name: 'Luxury Fabric Pouch', animation: 'Drawstring animation', imageUrl: '/images/pouch.png' },
      { id: 16, name: 'Eco Paper Pouch', animation: 'Organic unfolding', imageUrl: '/images/pouch.png' },
      { id: 17, name: 'Tea Packaging Bag', animation: 'Accordion expansion', imageUrl: '/images/pouch.png' },
      { id: 18, name: 'Gift Pouch', animation: 'Ribbon unties', imageUrl: '/images/pouch.png' },
      { id: 19, name: 'Holographic Pouch', animation: 'Light shift effect', imageUrl: '/images/pouch.png' },
      { id: 20, name: 'Floating Soft Pack', animation: 'Shape morphing', imageUrl: '/images/pouch.png' },
    ],
  },
  {
    itemId: 'bottle-mockups',
    title: 'Bottle Mockups',
    subtitle: 'Beverage, Essential Oil & Wine Bottles',
    img: '/images/catalog/bottle-mockups.jpg',
    group: 'bottles',
    badge: '✦ PREMIUM GLASS',
    tag: 'Pro CAD Dieline',
    isFeatured: true,
    active: true,
    order: 3,
    boxModelKey: 'rte',
    variants: [
      { id: 1, name: 'Cosmetic Serum Bottle', animation: 'Pipette extracts liquid', imageUrl: '/images/bottle.png' },
      { id: 2, name: 'Dropper Bottle', animation: 'Dropper lifts and squeezes', imageUrl: '/images/bottle.png' },
      { id: 3, name: 'Pump Bottle', animation: 'Pump depresses and pops up', imageUrl: '/images/bottle.png' },
      { id: 4, name: 'Spray Bottle', animation: 'Mist spray animation', imageUrl: '/images/bottle.png' },
      { id: 5, name: 'Perfume Bottle', animation: 'Cap levitates and turns', imageUrl: '/images/bottle.png' },
      { id: 6, name: 'Luxury Glass Bottle', animation: 'Reflective shine sweep', imageUrl: '/images/bottle.png' },
      { id: 7, name: 'Energy Drink Bottle', animation: 'Condensation drips', imageUrl: '/images/bottle.png' },
      { id: 8, name: 'Milk Bottle', animation: 'Foil peels off', imageUrl: '/images/bottle.png' },
      { id: 9, name: 'Vintage Apothecary Bottle', animation: 'Cork pops out', imageUrl: '/images/bottle.png' },
      { id: 10, name: 'Wine Bottle', animation: 'Corkscrew uncorks', imageUrl: '/images/bottle.png' },
      { id: 11, name: 'Olive Oil Bottle', animation: 'Pouring motion', imageUrl: '/images/bottle.png' },
      { id: 12, name: 'Shampoo Bottle', animation: 'Flip cap clicks open', imageUrl: '/images/bottle.png' },
      { id: 13, name: 'Body Wash Bottle', animation: 'Squeeze compression', imageUrl: '/images/bottle.png' },
      { id: 14, name: 'Beverage Bottle', animation: 'Liquid sloshes inside', imageUrl: '/images/bottle.png' },
      { id: 15, name: 'Flask Bottle', animation: 'Metal screw cap twists', imageUrl: '/images/bottle.png' },
      { id: 16, name: 'Minimal Cylindrical Bottle', animation: 'Sleek rotation', imageUrl: '/images/bottle.png' },
      { id: 17, name: 'Square Bottle', animation: '360 degree spin', imageUrl: '/images/bottle.png' },
      { id: 18, name: 'Amber Medicine Bottle', animation: 'Safety cap pushes down', imageUrl: '/images/bottle.png' },
      { id: 19, name: 'Frosted Glass Bottle', animation: 'Opacity transitions', imageUrl: '/images/bottle.png' },
      { id: 20, name: 'Smart Bottle', animation: 'Cap unscrews and floats', imageUrl: '/images/bottle.png' },
    ],
  },
  {
    itemId: 'can-mockups',
    title: 'Can Mockups',
    subtitle: 'Sleek & Standard Aluminum Drink Cans',
    img: '/images/catalog/can-mockups.jpg',
    group: 'bottles',
    tag: '3D Studio',
    isFeatured: true,
    active: true,
    order: 4,
    boxModelKey: 'rte',
    variants: [
      { id: 1, name: 'Soda Can', animation: 'Tab pops open', imageUrl: '/images/can.png' },
      { id: 2, name: 'Slim Energy Can', animation: 'Condensation forms', imageUrl: '/images/can.png' },
      { id: 3, name: 'Coffee Can', animation: 'Foil seal peels back', imageUrl: '/images/can.png' },
      { id: 4, name: 'Beer Can', animation: 'Frosted chill effect', imageUrl: '/images/can.png' },
      { id: 5, name: 'Nitro Can', animation: 'Micro-bubble cascade', imageUrl: '/images/can.png' },
      { id: 6, name: 'Sparkling Water Can', animation: 'Frizz and pop sound visual', imageUrl: '/images/can.png' },
      { id: 7, name: 'Mini Can', animation: 'Playful jump', imageUrl: '/images/can.png' },
      { id: 8, name: 'Tallboy Can', animation: 'Dynamic scale up', imageUrl: '/images/can.png' },
      { id: 9, name: 'Matte Can', animation: 'Soft light sweep', imageUrl: '/images/can.png' },
      { id: 10, name: 'Gloss Can', animation: 'High-contrast reflection', imageUrl: '/images/can.png' },
      { id: 11, name: 'Textured Can', animation: 'Tactile bump mapping reveal', imageUrl: '/images/can.png' },
      { id: 12, name: 'Premium Metal Can', animation: 'Golden glint', imageUrl: '/images/can.png' },
      { id: 13, name: 'Paint Can', animation: 'Lid pries open', imageUrl: '/images/can.png' },
      { id: 14, name: 'Protein Drink Can', animation: 'Heavy drop impact', imageUrl: '/images/can.png' },
      { id: 15, name: 'Juice Can', animation: 'Splash surround', imageUrl: '/images/can.png' },
      { id: 16, name: 'Cold Brew Can', animation: 'Ice frost melting', imageUrl: '/images/can.png' },
      { id: 17, name: 'Retro Can', animation: 'Vintage grain filter applies', imageUrl: '/images/can.png' },
      { id: 18, name: 'Futuristic Can', animation: 'Neon edge glow', imageUrl: '/images/can.png' },
      { id: 19, name: 'Aluminum Bottle Can', animation: 'Screw cap spins off', imageUrl: '/images/can.png' },
      { id: 20, name: 'Collectible Can', animation: 'Showcase pedestal spin', imageUrl: '/images/can.png' },
    ],
  },
  {
    itemId: 'tube-mockups',
    title: 'Tube Mockups',
    subtitle: 'Cosmetic & Skincare Squeeze Tubes',
    img: '/images/catalog/tube-mockups.jpg',
    group: 'containers',
    tag: '3D Studio',
    active: true,
    order: 5,
    boxModelKey: 'cosmetic',
    variants: [
      { id: 1, name: 'Toothpaste Tube', animation: 'Tube squeezes and flexes', imageUrl: '/images/tube.png' },
      { id: 2, name: 'Cosmetic Cream Tube', animation: 'Metallic shine passes', imageUrl: '/images/tube.png' },
      { id: 3, name: 'Sunscreen Tube', animation: 'Flip cap snaps open', imageUrl: '/images/tube.png' },
      { id: 4, name: 'Hand Cream Tube', animation: 'Smooth compression', imageUrl: '/images/tube.png' },
      { id: 5, name: 'Paint Tube', animation: 'Bottom fold unwinds', imageUrl: '/images/tube.png' },
      { id: 6, name: 'Gel Tube', animation: 'Translucent liquid morphs', imageUrl: '/images/tube.png' },
      { id: 7, name: 'Metallic Tube', animation: 'Crinkle physics applied', imageUrl: '/images/tube.png' },
      { id: 8, name: 'Matte Tube', animation: 'Soft velvet texture reveal', imageUrl: '/images/tube.png' },
      { id: 9, name: 'Travel Tube', animation: 'Miniature scale bounce', imageUrl: '/images/tube.png' },
      { id: 10, name: 'Pharmaceutical Tube', animation: 'Pointed cap punctures seal', imageUrl: '/images/tube.png' },
      { id: 11, name: 'Eco Tube', animation: 'Paper texture flattens', imageUrl: '/images/tube.png' },
      { id: 12, name: 'Soft Plastic Tube', animation: 'Elastic rebound', imageUrl: '/images/tube.png' },
      { id: 13, name: 'Aluminum Tube', animation: 'Dent and crease mechanics', imageUrl: '/images/tube.png' },
      { id: 14, name: 'Luxury Beauty Tube', animation: 'Gold foil stamp glints', imageUrl: '/images/tube.png' },
      { id: 15, name: 'Sport Gel Tube', animation: 'Tear-away top rips', imageUrl: '/images/tube.png' },
      { id: 16, name: 'Protein Paste Tube', animation: 'Heavy duty squeeze', imageUrl: '/images/tube.png' },
      { id: 17, name: 'Folded End Tube', animation: 'Crimp end folds down', imageUrl: '/images/tube.png' },
      { id: 18, name: 'Flip Cap Tube', animation: 'Cap swings back 180 degrees', imageUrl: '/images/tube.png' },
      { id: 19, name: 'Pump Tube', animation: 'Airless pump depresses', imageUrl: '/images/tube.png' },
      { id: 20, name: 'Floating Morph Tube', animation: 'Shape dynamically shifts', imageUrl: '/images/tube.png' },
    ],
  },
  {
    itemId: 'cup-container-mockups',
    title: 'Cup / Container Mockups',
    subtitle: 'Eco Paper Coffee Cups & Tubs',
    img: '/images/catalog/cup-container-mockups.jpg',
    group: 'containers',
    tag: 'Vector Dieline',
    active: true,
    order: 6,
    boxModelKey: 'rte',
    variants: [
      { id: 1, name: 'Coffee Cup', animation: 'Steam rises from lid', imageUrl: '/images/cup.png' },
      { id: 2, name: 'Ice Cream Cup', animation: 'Lid lifts off', imageUrl: '/images/cup.png' },
      { id: 3, name: 'Yogurt Cup', animation: 'Foil lid peels back', imageUrl: '/images/cup.png' },
      { id: 4, name: 'Noodle Cup', animation: 'Paper lid folds halfway', imageUrl: '/images/cup.png' },
      { id: 5, name: 'Smoothie Cup', animation: 'Dome lid attaches', imageUrl: '/images/cup.png' },
      { id: 6, name: 'Bubble Tea Cup', animation: 'Straw punctures seal', imageUrl: '/images/cup.png' },
      { id: 7, name: 'Paper Cup', animation: 'Cardboard sleeve slides on', imageUrl: '/images/cup.png' },
      { id: 8, name: 'Plastic Cup', animation: 'Condensation forms', imageUrl: '/images/cup.png' },
      { id: 9, name: 'Reusable Cup', animation: 'Silicone band stretches', imageUrl: '/images/cup.png' },
      { id: 10, name: 'Dessert Cup', animation: 'Transparent layers reveal', imageUrl: '/images/cup.png' },
      { id: 11, name: 'Frozen Yogurt Cup', animation: 'Frost crystalizes', imageUrl: '/images/cup.png' },
      { id: 12, name: 'Soup Container', animation: 'Vented lid releases air', imageUrl: '/images/cup.png' },
      { id: 13, name: 'Sauce Container', animation: 'Snap lid pops open', imageUrl: '/images/cup.png' },
      { id: 14, name: 'Meal Prep Container', animation: 'Compartments separate', imageUrl: '/images/cup.png' },
      { id: 15, name: 'Luxury Beverage Cup', animation: 'Embossed logo shines', imageUrl: '/images/cup.png' },
      { id: 16, name: 'Transparent Cup', animation: 'Liquid fills up', imageUrl: '/images/cup.png' },
      { id: 17, name: 'Double Wall Cup', animation: 'Inner wall floats', imageUrl: '/images/cup.png' },
      { id: 18, name: 'Eco Container', animation: 'Molded pulp texture reveals', imageUrl: '/images/cup.png' },
      { id: 19, name: 'Smart Lid Cup', animation: 'Digital temperature displays', imageUrl: '/images/cup.png' },
      { id: 20, name: 'Floating Container', animation: 'Anti-gravity rotation', imageUrl: '/images/cup.png' },
    ],
  },
  {
    itemId: 'food-packaging-mockups',
    title: 'Food Packaging Mockups',
    subtitle: 'Takeout, Noodle & Fast Food Boxes',
    img: '/images/pizza_box.png',
    group: 'boxes',
    tag: 'Auto-Lock Dieline',
    active: true,
    order: 7,
    boxModelKey: 'auto_lock',
    variants: [
      { id: 1, name: 'Sandwich Pack', animation: 'Triangular window opens', imageUrl: '/images/pizza_box.png' },
      { id: 2, name: 'Sushi Tray', animation: 'Clear lid lifts off', imageUrl: '/images/pizza_box.png' },
      { id: 3, name: 'Burger Box', animation: 'Clamshell hinges open', imageUrl: '/images/pizza_box.png' },
      { id: 4, name: 'Meal Box', animation: 'Flaps fold out flat', imageUrl: '/images/pizza_box.png' },
      { id: 5, name: 'Chocolate Carton', animation: 'Tray slides from sleeve', imageUrl: '/images/pizza_box.png' },
      { id: 6, name: 'Snack Box', animation: 'Tear strip rips away', imageUrl: '/images/pizza_box.png' },
      { id: 7, name: 'Cookie Box', animation: 'Top window reveals treats', imageUrl: '/images/pizza_box.png' },
      { id: 8, name: 'Cereal Box', animation: 'Top tabs unseal', imageUrl: '/images/pizza_box.png' },
      { id: 9, name: 'Frozen Food Pack', animation: 'Frost dissipates', imageUrl: '/images/pizza_box.png' },
      { id: 10, name: 'Bakery Tray', animation: 'Paper wrap unfolds', imageUrl: '/images/pizza_box.png' },
      { id: 11, name: 'Salad Bowl', animation: 'Dome lid snaps off', imageUrl: '/images/pizza_box.png' },
      { id: 12, name: 'Wrap Box', animation: 'Peel back opening', imageUrl: '/images/pizza_box.png' },
      { id: 13, name: 'Donut Box', animation: 'Front panel drops down', imageUrl: '/images/pizza_box.png' },
      { id: 14, name: 'Macaron Box', animation: 'Drawer pulls out smoothly', imageUrl: '/images/pizza_box.png' },
      { id: 15, name: 'Candy Pack', animation: 'Pouch inflates and pops', imageUrl: '/images/pizza_box.png' },
      { id: 16, name: 'Energy Bar Carton', animation: 'Display box folds up', imageUrl: '/images/pizza_box.png' },
      { id: 17, name: 'Tea Box', animation: 'Perforated dispenser opens', imageUrl: '/images/pizza_box.png' },
      { id: 18, name: 'Chocolate Sleeve', animation: 'Foil unwraps inside', imageUrl: '/images/pizza_box.png' },
      { id: 19, name: 'Gourmet Food Carton', animation: 'Magnetic flap releases', imageUrl: '/images/pizza_box.png' },
      { id: 20, name: 'Premium Food Kit', animation: 'Multi-tiered box expands', imageUrl: '/images/pizza_box.png' },
    ],
  },
  {
    itemId: 'water-bottle-mockups',
    title: 'Water Bottle Mockups',
    subtitle: 'Sport PET & Mineral Water Bottles',
    img: '/images/bottle.png',
    group: 'bottles',
    tag: '3D Visualizer',
    active: true,
    order: 8,
    boxModelKey: 'rte',
    variants: [
      { id: 1, name: 'Sports Bottle', animation: 'Squeeze nozzle pops up', imageUrl: '/images/bottle.png' },
      { id: 2, name: 'Gym Bottle', animation: 'Shaker ball bounces inside', imageUrl: '/images/bottle.png' },
      { id: 3, name: 'Stainless Bottle', animation: 'Metallic reflection sweep', imageUrl: '/images/bottle.png' },
      { id: 4, name: 'Vacuum Flask', animation: 'Double wall cross-section', imageUrl: '/images/bottle.png' },
      { id: 5, name: 'Glass Water Bottle', animation: 'Silicone sleeve stretches', imageUrl: '/images/bottle.png' },
      { id: 6, name: 'Hiking Bottle', animation: 'Carabiner clips onto lid', imageUrl: '/images/bottle.png' },
      { id: 7, name: 'Smart Bottle', animation: 'LED ring pulses', imageUrl: '/images/bottle.png' },
      { id: 8, name: 'Filter Bottle', animation: 'Water purifies visually', imageUrl: '/images/bottle.png' },
      { id: 9, name: 'Cycling Bottle', animation: 'Aerodynamic shape morph', imageUrl: '/images/bottle.png' },
      { id: 10, name: 'Protein Shaker', animation: 'Powder mixes with liquid', imageUrl: '/images/bottle.png' },
      { id: 11, name: 'Squeeze Bottle', animation: 'Bottle compresses rapidly', imageUrl: '/images/bottle.png' },
      { id: 12, name: 'Wide Mouth Bottle', animation: 'Large cap unscrews', imageUrl: '/images/bottle.png' },
      { id: 13, name: 'Thermal Bottle', animation: 'Heat waves radiate', imageUrl: '/images/bottle.png' },
      { id: 14, name: 'Luxury Bottle', animation: 'Crystal clear light refraction', imageUrl: '/images/bottle.png' },
      { id: 15, name: 'Eco Bottle', animation: 'Bamboo lid twists off', imageUrl: '/images/bottle.png' },
      { id: 16, name: 'Travel Bottle', animation: 'Collapses into compact disc', imageUrl: '/images/bottle.png' },
      { id: 17, name: 'Infuser Bottle', animation: 'Fruit basket drops in', imageUrl: '/images/bottle.png' },
      { id: 18, name: 'Tritan Bottle', animation: 'Shatterproof bounce impact', imageUrl: '/images/bottle.png' },
      { id: 19, name: 'Kids Bottle', animation: 'Pop-up straw activates', imageUrl: '/images/bottle.png' },
      { id: 20, name: 'Futuristic Bottle', animation: 'Holographic label projection', imageUrl: '/images/bottle.png' },
    ],
  },
  {
    itemId: 'gift-box-mockups',
    title: 'Gift Box Mockups',
    subtitle: 'Rigid Magnetic Closure & Lid-Base Boxes',
    img: '/images/gift_box.png',
    group: 'boxes',
    tag: '3D Studio',
    active: true,
    order: 9,
    boxModelKey: 'te',
    variants: [
      { id: 1, name: 'Luxury Magnetic Box', animation: 'Snap closure releases', imageUrl: '/images/gift_box.png' },
      { id: 2, name: 'Jewelry Box', animation: 'Ring velvet rises', imageUrl: '/images/gift_box.png' },
      { id: 3, name: 'Flower Box', animation: 'Cylindrical lid lifts', imageUrl: '/images/gift_box.png' },
      { id: 4, name: 'Ribbon Gift Box', animation: 'Satin ribbon unties', imageUrl: '/images/gift_box.png' },
      { id: 5, name: 'Drawer Gift Box', animation: 'Ribbon pull slides tray', imageUrl: '/images/gift_box.png' },
      { id: 6, name: 'Book Style Gift Box', animation: 'Spine hinges open', imageUrl: '/images/gift_box.png' },
      { id: 7, name: 'Hexagon Gift Box', animation: 'Lid lifts, sides bloom', imageUrl: '/images/gift_box.png' },
      { id: 8, name: 'Heart Gift Box', animation: 'Two halves separate', imageUrl: '/images/gift_box.png' },
      { id: 9, name: 'Premium Chocolate Box', animation: 'Divider grid reveals', imageUrl: '/images/gift_box.png' },
      { id: 10, name: 'Surprise Explosion Box', animation: 'Four walls drop flat', imageUrl: '/images/gift_box.png' },
      { id: 11, name: 'Floating Lid Box', animation: 'Lid hovers mid-air', imageUrl: '/images/gift_box.png' },
      { id: 12, name: 'Wedding Gift Box', animation: 'Foil stamping glimmers', imageUrl: '/images/gift_box.png' },
      { id: 13, name: 'Luxury Watch Box', animation: 'Cushion elevates watch', imageUrl: '/images/gift_box.png' },
      { id: 14, name: 'Perfume Gift Box', animation: 'Platform pedestal rises', imageUrl: '/images/gift_box.png' },
      { id: 15, name: 'Origami Gift Box', animation: 'Intricate paper un-folding', imageUrl: '/images/gift_box.png' },
      { id: 16, name: 'Tiered Gift Box', animation: 'Multiple layers swing out', imageUrl: '/images/gift_box.png' },
      { id: 17, name: 'Double Door Gift Box', animation: 'Doors open from center', imageUrl: '/images/gift_box.png' },
      { id: 18, name: 'Smart Reveal Gift Box', animation: 'Hidden compartment opens', imageUrl: '/images/gift_box.png' },
      { id: 19, name: 'Nested Gift Boxes', animation: 'Boxes stack out of each other', imageUrl: '/images/gift_box.png' },
      { id: 20, name: 'Mechanical Puzzle Gift Box', animation: 'Gears turn and unlock', imageUrl: '/images/gift_box.png' },
    ],
  },
  {
    itemId: 'paper-bag-mockups',
    title: 'Paper Bag Mockups',
    subtitle: 'Twisted Handle Retail Shopping Bags',
    img: '/images/paper_bag.png',
    group: 'pouches',
    tag: 'Vector Blueprint',
    active: true,
    order: 10,
    boxModelKey: 'rte',
    variants: [
      { id: 1, name: 'Luxury Shopping Bag', animation: 'Stands up and opens', imageUrl: '/images/paper_bag.png' },
      { id: 2, name: 'Kraft Bag', animation: 'Top folds over twice', imageUrl: '/images/paper_bag.png' },
      { id: 3, name: 'Boutique Bag', animation: 'Ribbon handles sway', imageUrl: '/images/paper_bag.png' },
      { id: 4, name: 'Rope Handle Bag', animation: 'Cotton rope tightens', imageUrl: '/images/paper_bag.png' },
      { id: 5, name: 'Die Cut Handle Bag', animation: 'Flat folds pop open', imageUrl: '/images/paper_bag.png' },
      { id: 6, name: 'Matte Shopping Bag', animation: 'Soft lighting passes over', imageUrl: '/images/paper_bag.png' },
      { id: 7, name: 'Gloss Shopping Bag', animation: 'Sharp reflections move', imageUrl: '/images/paper_bag.png' },
      { id: 8, name: 'Fashion Retail Bag', animation: 'Tissue paper blooms out', imageUrl: '/images/paper_bag.png' },
      { id: 9, name: 'Bakery Bag', animation: 'Window clear film shines', imageUrl: '/images/paper_bag.png' },
      { id: 10, name: 'Grocery Bag', animation: 'Bottom gusset expands', imageUrl: '/images/paper_bag.png' },
      { id: 11, name: 'Wine Bag', animation: 'Tall profile unfolds', imageUrl: '/images/paper_bag.png' },
      { id: 12, name: 'Gift Bag', animation: 'Gift tag flips', imageUrl: '/images/paper_bag.png' },
      { id: 13, name: 'Eco Bag', animation: 'Recycled texture zoom', imageUrl: '/images/paper_bag.png' },
      { id: 14, name: 'Premium Paper Tote', animation: 'Stiff structure stands firm', imageUrl: '/images/paper_bag.png' },
      { id: 15, name: 'Foldable Bag', animation: 'Collapses completely flat', imageUrl: '/images/paper_bag.png' },
      { id: 16, name: 'Large Retail Bag', animation: 'Wide base expands', imageUrl: '/images/paper_bag.png' },
      { id: 17, name: 'Minimal White Bag', animation: 'Drop shadow softly appears', imageUrl: '/images/paper_bag.png' },
      { id: 18, name: 'Luxury Black Bag', animation: 'Foil logo shines brightly', imageUrl: '/images/paper_bag.png' },
      { id: 19, name: 'Embossed Bag', animation: '3D texture pops out', imageUrl: '/images/paper_bag.png' },
      { id: 20, name: 'Floating Paper Bag', animation: 'Anti-gravity gentle float', imageUrl: '/images/paper_bag.png' },
    ],
  },
  {
    itemId: 'pizza-box-mockups',
    title: 'Pizza Box Mockups',
    subtitle: 'Corrugated Square Takeout Pizza Boxes',
    img: '/images/pizza_box.png',
    group: 'boxes',
    tag: '3D Studio',
    active: true,
    order: 11,
    boxModelKey: 'auto_lock',
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
    itemId: 'supplement-jar-mockups',
    title: 'Supplement Jar Mockups',
    subtitle: 'Wide-Mouth Protein & Vitamin Jars',
    img: '/images/supplement.png',
    group: 'containers',
    tag: '3D Studio',
    active: true,
    order: 12,
    boxModelKey: 'cosmetic',
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

let isCatalogSeeded = false;
let cachedPublicCatalog = null;

const invalidateCatalogCache = () => {
  cachedPublicCatalog = null;
};

// Helper to seed default catalog items once if collection is completely empty, and ensure cosmetic_b is present
const ensureCatalogSeeded = async () => {
  if (isCatalogSeeded) return;
  try {
    const count = await CatalogItem.countDocuments();
    if (count === 0) {
      await CatalogItem.insertMany(DEFAULT_CATALOG_ITEMS);
      console.log('🌱 Default 3D Model catalog items seeded successfully');
    } else {
      const boxItem = await CatalogItem.findOne({ itemId: 'box-mockups' });
      if (boxItem) {
        const hasCosmeticB = boxItem.variants && boxItem.variants.some(v => v.boxModelKey === 'cosmetic_b' || (v.name && v.name.includes('Cosmetic Box B')));
        if (!hasCosmeticB) {
          boxItem.variants.push({
            id: 5,
            name: 'Cosmetic Box B (Mailer/Tray Style)',
            animation: 'Roll end tray and tuck front closure',
            imageUrl: '/images/boxes/cosmetic_b_white.jpg',
            whiteImageUrl: '/images/boxes/cosmetic_b_white.jpg',
            kraftImageUrl: '/images/boxes/cosmetic_b_kraft.jpg',
            boxModelKey: 'cosmetic_b',
            gridSize: 'large'
          });
          await boxItem.save();
          invalidateCatalogCache();
          console.log('🌱 Added Cosmetic Box B (Mailer/Tray Style) to box-mockups in database');
        }
      }
    }
    isCatalogSeeded = true;
  } catch (err) {
    console.error('Error seeding default catalog items:', err);
  }
};

/**
 * Public: Get active catalog items (with instant in-memory cache)
 */
const getPublicCatalog = async (req, res) => {
  try {
    await ensureCatalogSeeded();

    if (cachedPublicCatalog && cachedPublicCatalog.length > 0) {
      return res.json({
        success: true,
        data: cachedPublicCatalog,
        cached: true,
      });
    }

    const items = await CatalogItem.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
    
    // Ensure box-mockups has cosmetic_b variant
    const boxMockup = items.find(i => i.itemId === 'box-mockups');
    if (boxMockup && boxMockup.variants && !boxMockup.variants.some(v => v.boxModelKey === 'cosmetic_b')) {
      boxMockup.variants.push({
        id: 5,
        name: 'Cosmetic Box B (Mailer/Tray Style)',
        animation: 'Roll end tray and tuck front closure',
        imageUrl: '/images/boxes/cosmetic_b_white.jpg',
        whiteImageUrl: '/images/boxes/cosmetic_b_white.jpg',
        kraftImageUrl: '/images/boxes/cosmetic_b_kraft.jpg',
        boxModelKey: 'cosmetic_b',
        gridSize: 'large'
      });
    }

    cachedPublicCatalog = items;

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Get public catalog error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch 3D model catalog.' });
  }
};

/**
 * Admin: Get all catalog items (including inactive)
 */
const getAdminCatalog = async (req, res) => {
  try {
    await ensureCatalogSeeded();
    const items = await CatalogItem.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Get admin catalog error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch catalog management data.' });
  }
};

/**
 * Admin: Create a new catalog item
 */
const createCatalogItem = async (req, res) => {
  try {
    const { title, subtitle, img, group, badge, tag, isFeatured, active, order, boxModelKey, variants } = req.body;

    if (!title || !img) {
      return res.status(400).json({ success: false, message: 'Product title and image are required.' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const itemId = req.body.itemId || `${slug}-${Date.now()}`;

    const maxOrderDoc = await CatalogItem.findOne().sort({ order: -1 });
    const nextOrder = order !== undefined ? Number(order) : (maxOrderDoc ? maxOrderDoc.order + 1 : 1);

    const newItem = await CatalogItem.create({
      itemId,
      title,
      subtitle: subtitle || '',
      img,
      group: group || 'boxes',
      badge: badge || '',
      tag: tag || '',
      isFeatured: Boolean(isFeatured),
      showInMarquee: req.body.showInMarquee !== undefined ? Boolean(req.body.showInMarquee) : true,
      active: active !== undefined ? Boolean(active) : true,
      order: nextOrder,
      boxModelKey: boxModelKey || 'rte',
      variants: Array.isArray(variants) ? variants : [],
    });

    invalidateCatalogCache();

    res.status(201).json({
      success: true,
      message: '3D Model Catalog product created successfully.',
      data: newItem,
    });
  } catch (error) {
    console.error('Create catalog item error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create catalog product.' });
  }
};

/**
 * Admin: Update an existing catalog item
 */
const updateCatalogItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await CatalogItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Catalog product not found.' });
    }

    // Apply allowed field updates
    ['title', 'subtitle', 'img', 'group', 'badge', 'tag', 'isFeatured', 'showInMarquee', 'active', 'order', 'boxModelKey', 'variants'].forEach((field) => {
      if (updates[field] !== undefined) {
        item[field] = updates[field];
      }
    });

    await item.save();

    invalidateCatalogCache();

    res.json({
      success: true,
      message: '3D Model Catalog product updated successfully.',
      data: item,
    });
  } catch (error) {
    console.error('Update catalog item error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update catalog product.' });
  }
};

/**
 * Admin: Delete a catalog item
 */
const deleteCatalogItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CatalogItem.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Catalog product not found.' });
    }

    invalidateCatalogCache();

    res.json({
      success: true,
      message: 'Catalog product deleted successfully.',
      data: { id },
    });
  } catch (error) {
    console.error('Delete catalog item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete catalog product.' });
  }
};

/**
 * Admin: Add sub-variant to a category
 */
const addVariantToCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, animation, imageUrl, whiteImageUrl, kraftImageUrl, boxModelKey, description, dimensions, material, finishing, printing, moq, isFeatured, gridSize } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Sub-model variant name is required.' });
    }

    const item = await CatalogItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Catalog category product not found.' });
    }

    const nextId = item.variants && item.variants.length > 0
      ? Math.max(...item.variants.map((v) => v.id || 0)) + 1
      : 1;

    const newVariant = {
      id: nextId,
      name,
      animation: animation || '',
      imageUrl: imageUrl || whiteImageUrl || item.img || '/mockups/generated_box.png',
      whiteImageUrl: whiteImageUrl || imageUrl || '',
      kraftImageUrl: kraftImageUrl || '',
      boxModelKey: boxModelKey || 'rte',
      description: description || '',
      dimensions: dimensions || '',
      material: material || '',
      finishing: finishing || '',
      printing: printing || '',
      moq: moq || '',
      isFeatured: Boolean(isFeatured),
      gridSize: gridSize || 'large',
    };

    item.variants.push(newVariant);
    await item.save();

    invalidateCatalogCache();

    res.status(201).json({
      success: true,
      message: `Sub-model "${name}" added to ${item.title}.`,
      data: item,
    });
  } catch (error) {
    console.error('Add sub-variant error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add sub-model.' });
  }
};

/**
 * Admin: Update sub-variant in a category
 */
const updateCategoryVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;
    const updates = req.body;

    const item = await CatalogItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Catalog category product not found.' });
    }

    const variant = item.variants.find((v) => String(v._id) === String(variantId) || String(v.id) === String(variantId));
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Sub-model variant not found.' });
    }

    ['name', 'animation', 'imageUrl', 'whiteImageUrl', 'kraftImageUrl', 'boxModelKey', 'description', 'dimensions', 'material', 'finishing', 'printing', 'moq', 'isFeatured', 'gridSize'].forEach((field) => {
      if (updates[field] !== undefined) {
        variant[field] = updates[field];
      }
    });

    await item.save();

    invalidateCatalogCache();

    res.json({
      success: true,
      message: `Sub-model "${variant.name}" updated successfully.`,
      data: item,
    });
  } catch (error) {
    console.error('Update sub-variant error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update sub-model.' });
  }
};

/**
 * Admin: Delete sub-variant from a category
 */
const deleteCategoryVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;

    const item = await CatalogItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Catalog category product not found.' });
    }

    item.variants = item.variants.filter((v) => String(v._id) !== String(variantId) && String(v.id) !== String(variantId));
    await item.save();

    invalidateCatalogCache();

    res.json({
      success: true,
      message: 'Sub-model deleted successfully.',
      data: item,
    });
  } catch (error) {
    console.error('Delete sub-variant error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete sub-model.' });
  }
};

module.exports = {
  getPublicCatalog,
  getAdminCatalog,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  addVariantToCategory,
  updateCategoryVariant,
  deleteCategoryVariant,
};
