import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RotateCw, ArrowRight, Image as ImageIcon, Search, X, Check, MousePointer2 } from 'lucide-react';
import { Live3DStage } from './Live3DStage';
import './LiveCategoryBanner.css';

export interface CategoryBannerConfig {
  bgColor: string;
  borderColor: string;
  accentColor: string;
  breadcrumb: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  chips: string[];
  items: {
    id: string;
    label: string;
    image: string;
    brandText: string;
    subText: string;
    badgeText?: string;
    theme: 'kraft' | 'white' | 'dark' | 'metallic' | 'clean';
    size: { w: number; h: number };
    offset: { x: number; y: number; zIndex: number };
  }[];
}

const CATEGORY_CONFIGS: Record<string, CategoryBannerConfig> = {
  'box-mockups': {
    bgColor: '#F3F2FD',
    borderColor: '#18181b',
    accentColor: '#6366f1',
    breadcrumb: 'Boxes',
    title: 'Customize & download box mockups',
    description: 'Boxes are everywhere—shipping, gift, pizza, mailer boxes, and more. Unique designs attract more customers. Choose a box mockup and create your design online with Keyline Studio!',
    searchPlaceholder: 'Try 4+ words to describe (e.g. kraft mailer box with foil logo)...',
    chips: ['Square Shipping (RSC)', 'Mailer / Tray Box', 'Auto-Lock Bottom', 'Reverse Tuck End', 'Cosmetic Box', 'Button Hole'],
    items: [
      {
        id: 'box-center',
        label: 'Shipping Carton',
        image: '/images/box.png',
        brandText: 'KEYLINE CRAFT',
        subText: '100% RECYCLED CORRUGATED',
        badgeText: 'Eco Kraft',
        theme: 'kraft',
        size: { w: 160, h: 160 },
        offset: { x: 45, y: -10, zIndex: 2 }
      },
      {
        id: 'box-left',
        label: 'Mailer / Tray Box',
        image: '/images/pizza_box.png',
        brandText: 'ARTISAN SPECIALTY',
        subText: 'BAKERY & COFFEE ROASTERS',
        badgeText: 'Foil Stamp',
        theme: 'white',
        size: { w: 175, h: 145 },
        offset: { x: -35, y: 35, zIndex: 3 }
      },
      {
        id: 'box-right',
        label: 'Tuck End Carton',
        image: '/images/gift_box.png',
        brandText: 'SERUM BOTANICALS',
        subText: 'LUXURY DROPPER EDITION',
        badgeText: 'Matte Finish',
        theme: 'dark',
        size: { w: 130, h: 155 },
        offset: { x: 130, y: 15, zIndex: 1 }
      }
    ]
  },
  'bottle-mockups': {
    bgColor: '#F1F5FD',
    borderColor: '#18181b',
    accentColor: '#2563eb',
    breadcrumb: 'Bottles',
    title: 'Customize & download bottle mockups',
    description: 'Whether you want to design a plastic mineral water bottle with ribbed grip or an aluminum sports sipper bottle with loop handle. Find your branding design on Keyline Design.',
    searchPlaceholder: 'Try 4+ words (e.g. plastic mineral water bottle or sports sipper)...',
    chips: ['Plastic Water Bottle', 'Sipper Water Bottle', 'Wrap Label', 'Aluminum Finish'],
    items: [
      {
        id: 'bottle-center',
        label: 'Mineral Water Bottle',
        image: '/images/water_bottle.png',
        brandText: 'KLD PURE SPRING',
        subText: 'NATURAL ARTESIAN WATER',
        badgeText: 'Clear Wrap',
        theme: 'clean',
        size: { w: 90, h: 180 },
        offset: { x: 45, y: -10, zIndex: 2 }
      },
      {
        id: 'bottle-left',
        label: 'Sipper Sports Bottle',
        image: '/images/sipper_water_bottle.png',
        brandText: 'KLD HYDRO SPORT',
        subText: 'ALUMINUM SPORTS BOTTLE',
        badgeText: 'Loop Handle',
        theme: 'white',
        size: { w: 95, h: 185 },
        offset: { x: -35, y: 20, zIndex: 3 }
      }
    ]
  },
  'can-mockups': {
    bgColor: '#FAF4EA',
    borderColor: '#18181b',
    accentColor: '#d97706',
    breadcrumb: 'Cans',
    title: 'Customize & download can mockups',
    description: 'Keyline Design offers 12 oz soda cans and 355mL slim beverage cans with realistic metallic reflections and parametric vector dielines.',
    searchPlaceholder: 'Try 4+ words (e.g. 12 oz soda can or 355ml slim can)...',
    chips: ['12 oz Soda Can', '355mL Slim Can', 'Aluminum Finish', 'Pull-Tab'],
    items: [
      {
        id: 'can-center',
        label: '355mL Slim Can',
        image: '/images/kld_slim_can_mockup.png',
        brandText: 'KLD SPARKLING',
        subText: 'ORGANIC BOTANICAL TONIC',
        badgeText: 'Metallic Sheen',
        theme: 'metallic',
        size: { w: 100, h: 185 },
        offset: { x: 35, y: -10, zIndex: 3 }
      },
      {
        id: 'can-left',
        label: '12 oz Standard Can',
        image: '/images/can.png',
        brandText: 'CRISP CITRUS SODA',
        subText: 'ZERO SUGAR • REFRESHING',
        badgeText: 'Aluminum Finish',
        theme: 'white',
        size: { w: 110, h: 165 },
        offset: { x: -45, y: 15, zIndex: 2 }
      }
    ]
  },
  'tube-mockups': {
    bgColor: '#FDF5EC',
    borderColor: '#18181b',
    accentColor: '#ea580c',
    breadcrumb: 'Tubes',
    title: 'Customize & download tube mockups',
    description: 'Design striking 75ml toothpaste and squeeze tube packaging to promote your brand with instant 3D rendering and vector dielines.',
    searchPlaceholder: 'Try 4+ words (e.g. 75ml toothpaste squeeze tube ribbed cap)...',
    chips: ['Toothpaste Tube', '75ml Squeeze Tube', 'Ribbed Cap', 'Crimp Seal'],
    items: [
      {
        id: 'tube-center',
        label: '75ml Squeeze Tube',
        image: '/images/toothpaste_tube_mockup.png',
        brandText: 'LUMINOUS CARE',
        subText: 'HERBAL BOTANICAL FORMULA',
        badgeText: 'Soft Touch',
        theme: 'white',
        size: { w: 110, h: 195 },
        offset: { x: 10, y: -10, zIndex: 3 }
      }
    ]
  },
  'pouch-bag-mockups': {
    bgColor: '#F0FDF4',
    borderColor: '#18181b',
    accentColor: '#16a34a',
    breadcrumb: 'Pouches & Bags',
    title: 'Customize & download pouch & bag mockups',
    description: 'Discover versatile stand-up pouches, zipper bags, and kraft paper shopping bags with realistic gussets, zipper seals, and eco-friendly textures.',
    searchPlaceholder: 'Try 4+ words (e.g. stand-up coffee pouch with tear notch)...',
    chips: ['Stand-Up Pouch', 'Kraft Food Bag', 'Coffee Pouch', 'Zip Lock', 'Retail Shopping Bag'],
    items: [
      {
        id: 'pouch-center',
        label: 'Stand-Up Pouch',
        image: '/images/pouch.png',
        brandText: 'ORGANIC MATCHA',
        subText: 'CEREMONIAL GRADE • 250G',
        badgeText: 'Kraft Paper',
        theme: 'kraft',
        size: { w: 145, h: 180 },
        offset: { x: 20, y: -5, zIndex: 2 }
      },
      {
        id: 'pouch-right',
        label: 'Retail Paper Bag',
        image: '/images/paper_bag.png',
        brandText: 'KEYLINE APPAREL',
        subText: 'SUSTAINABLE GOODS',
        badgeText: 'Twisted Handle',
        theme: 'white',
        size: { w: 150, h: 190 },
        offset: { x: 125, y: 10, zIndex: 3 }
      }
    ]
  },
  'cup-container-mockups': {
    bgColor: '#FDF8F3',
    borderColor: '#18181b',
    accentColor: '#b45309',
    breadcrumb: 'Cups & Containers',
    title: 'Customize & download cup & container mockups',
    description: 'Paper coffee cups with sleeves, double-wall tumblers, smoothie dome cups, and food containers with customizable print surfaces and live 3D models.',
    searchPlaceholder: 'Try 4+ words (e.g. paper coffee cup with cardboard sleeve)...',
    chips: ['Coffee Cup', 'Double Wall Cup', 'Smoothie Cup', 'Ice Cream Cup', 'Meal Prep Box'],
    items: [
      {
        id: 'cup-center',
        label: 'Coffee Cup with Lid',
        image: '/images/cup.png',
        brandText: 'SPECIALTY ROAST',
        subText: 'SINGLE ORIGIN ETHIOPIA',
        badgeText: 'Embossed Sleeve',
        theme: 'white',
        size: { w: 135, h: 185 },
        offset: { x: 25, y: -10, zIndex: 2 }
      },
      {
        id: 'cup-right',
        label: 'Takeout Container',
        image: '/images/food.png',
        brandText: 'FRESH HARVEST',
        subText: 'ORGANIC KITCHEN',
        badgeText: 'Eco Fiber',
        theme: 'kraft',
        size: { w: 155, h: 145 },
        offset: { x: 120, y: 25, zIndex: 1 }
      }
    ]
  },
  'food-packaging-mockups': {
    bgColor: '#FFF7ED',
    borderColor: '#18181b',
    accentColor: '#ea580c',
    breadcrumb: 'Food Packaging',
    title: 'Customize & download food packaging mockups',
    description: 'Food cartons, pizza boxes, clamshell burger boxes, takeout trays, and bakery boxes engineered for food safety and eye-catching branding.',
    searchPlaceholder: 'Try 4+ words (e.g. corrugated pizza box clamshell takeout)...',
    chips: ['Pizza Box', 'Takeout Tray', 'Burger Box', 'Bakery Carton', 'Sandwich Pack'],
    items: [
      {
        id: 'food-center',
        label: 'Pizza Box Clamshell',
        image: '/images/pizza_box.png',
        brandText: 'BRICK OVEN PIZZA',
        subText: 'AUTHENTIC NAPOLI PIZZERIA',
        badgeText: 'Kraft Flute',
        theme: 'kraft',
        size: { w: 180, h: 145 },
        offset: { x: 20, y: 15, zIndex: 2 }
      },
      {
        id: 'food-right',
        label: 'Food Takeout Box',
        image: '/images/food.png',
        brandText: 'GOURMET STREET',
        subText: 'ARTISAN FAST FOOD',
        badgeText: 'Leak Proof',
        theme: 'white',
        size: { w: 150, h: 145 },
        offset: { x: 125, y: -10, zIndex: 1 }
      }
    ]
  }
};

interface LiveCategoryBannerProps {
  categoryId: string;
  categoryName: string;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectChip?: (chipText: string) => void;
  onOpenCustomizer?: () => void;
}

export const LiveCategoryBanner: React.FC<LiveCategoryBannerProps> = ({
  categoryId,
  categoryName,
  totalCount,
  searchQuery,
  onSearchChange,
  onSelectChip,
  onOpenCustomizer,
}) => {
  const config = CATEGORY_CONFIGS[categoryId] || {
    bgColor: '#F3F2FD',
    borderColor: '#18181b',
    accentColor: '#6366f1',
    breadcrumb: categoryName.replace(' Mockups', ''),
    title: `Customize & download ${categoryName.toLowerCase().replace(' mockups', '')} mockups`,
    description: `Discover our wide range of ${categoryName.toLowerCase()} packaging variants, designed to elevate your brand and experience with CAD dielines and live 3D models.`,
    searchPlaceholder: 'Try 4+ words to describe packaging...',
    chips: ['Popular Models', 'Trending', 'Custom Dieline', 'Eco-Friendly'],
    items: CATEGORY_CONFIGS['box-mockups'].items
  };

  // State for user manual interaction over the 3D stage
  const [isUserHovering, setIsUserHovering] = useState<boolean>(false);

  return (
    <div className="live-banner-wrapper w-full max-w-[1200px] mb-8">
      {/* --- THE MAIN LIVE CARD --- */}
      <div 
        className="live-banner-card"
        style={{
          backgroundColor: config.bgColor,
        }}
      >
        {/* Ambient background particles / grid */}
        <div className="live-banner-grid-overlay" />

        <div className="live-banner-content">
          {/* Left Column: Breadcrumbs, Title, Description, Prompt Bar, Chips */}
          <div className="live-banner-text-col">
            {/* Breadcrumb Navigation */}
            <div className="live-banner-breadcrumbs">
              <span 
                className="live-crumb-link" 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'landing' }))}
                style={{ cursor: 'pointer' }}
                title="Go to Keyline Design Home"
              >
                Home
              </span>
              <span className="live-crumb-sep">/</span>
              <span 
                className="live-crumb-link" 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'models' }))}
                style={{ cursor: 'pointer' }}
                title="Browse 3D Packaging Models"
              >
                3D Mockups
              </span>
              <span className="live-crumb-sep">/</span>
              <span className="live-crumb-active">{config.breadcrumb}</span>
            </div>

            {/* Title with Arrow Icon */}
            <h1 className="live-banner-title">
              <span 
                className="live-banner-arrow" 
                style={{ backgroundColor: config.accentColor, cursor: 'pointer' }}
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'models' }))}
                title="Back to 3D Models"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </span>
              <span>{config.title}</span>
            </h1>

            {/* Description */}
            <p className="live-banner-desc">
              {config.description}
            </p>

            {/* Interactive Prompt / Search Bar */}
            <div className="live-banner-search-box">
              <div className="live-search-icon-wrap">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={config.searchPlaceholder}
                className="live-search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="live-search-clear"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-700" />
                </button>
              )}
              <button 
                className="live-search-btn"
                title="Search or prompt mockups"
                onClick={() => {
                  if (!searchQuery && config.chips.length > 0) {
                    onSearchChange(config.chips[0]);
                  }
                }}
              >
                <ImageIcon className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            {/* Quick Filter Tag Chips */}
            {config.chips && config.chips.length > 0 && (
              <div className="live-banner-chips-row">
                <span className="live-chips-label">Quick Filters:</span>
                {config.chips.slice(0, 4).map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (onSelectChip) onSelectChip(chip);
                      else onSearchChange(chip);
                    }}
                    className={`live-chip-pill ${searchQuery.toLowerCase() === chip.toLowerCase() ? 'active' : ''}`}
                  >
                    <span>{chip}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Real Three.js WebGL 3D Packaging Stage with Dynamic Designs */}
          <div 
            className="live-banner-stage-col"
            onMouseEnter={() => setIsUserHovering(true)}
            onMouseLeave={() => setIsUserHovering(false)}
          >
            <Live3DStage
              categoryId={categoryId}
              isUserHovering={isUserHovering}
              onUserInteract={() => setIsUserHovering(true)}
            />
          </div>
        </div>
      </div>

      {/* --- SUB-BAR (Under Banner: Counts, Sort) --- */}
      <div className="live-subbar-row">
        {/* Left: Dynamic Mockup Count */}
        <div className="live-subbar-count">
          <span className="font-bold text-zinc-900">{totalCount}</span>
          <span className="text-zinc-600 ml-1">{config.breadcrumb} Mockups</span>
        </div>

        {/* Right: Sort Indicator / Quick Toggle */}
        <div className="live-subbar-sort">
          <span className="text-xs text-zinc-500 font-medium mr-1.5">Sort by:</span>
          <span className="live-sort-pill">Popular</span>
        </div>
      </div>
    </div>
  );
};

export default LiveCategoryBanner;
