// @ts-nocheck
import React, { useState } from 'react';
import { ArrowRight, Search, CheckCircle2 } from 'lucide-react';
import './PackagingCollections.css';

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  img: string;
  group: 'boxes' | 'bottles' | 'pouches' | 'containers';
  badge?: string;
  tag?: string;
  isFeatured?: boolean;
}

const categories: CategoryItem[] = [
  { 
    id: "box-mockups", 
    title: "Box Mockups", 
    subtitle: "Straight & Reverse Tuck Folding Boxes",
    img: "/images/box.png", 
    group: "boxes",
    badge: "🔥 MOST POPULAR",
    tag: "3D & DXF Ready",
    isFeatured: true
  },
  { 
    id: "pouch-bag-mockups", 
    title: "Pouch / Bag Mockups", 
    subtitle: "Stand-Up Foil Pouches & Kraft Bags",
    img: "/images/pouch.png", 
    group: "pouches",
    badge: "📐 DXF READY",
    tag: "Customizable"
  },
  { 
    id: "bottle-mockups", 
    title: "Bottle Mockups", 
    subtitle: "Beverage, Essential Oil & Wine Bottles",
    img: "/images/bottle.png", 
    group: "bottles",
    badge: "⭐ FEATURED",
    tag: "Glass & Plastic",
    isFeatured: true
  },
  { 
    id: "can-mockups", 
    title: "Can Mockups", 
    subtitle: "Sleek & Standard Aluminum Drink Cans",
    img: "/images/can.png", 
    group: "bottles",
    tag: "Metallic Finish"
  },
  { 
    id: "tube-mockups", 
    title: "Tube Mockups", 
    subtitle: "Cosmetic & Skincare Squeeze Tubes",
    img: "/images/tube.png", 
    group: "containers",
    tag: "Cosmetic Grade"
  },
  { 
    id: "cup-container-mockups", 
    title: "Cup / Container Mockups", 
    subtitle: "Eco Paper Coffee Cups & Tubs",
    img: "/images/cup.png", 
    group: "containers",
    tag: "Eco Kraft"
  },
  { 
    id: "food-packaging-mockups", 
    title: "Food Packaging Mockups", 
    subtitle: "Takeout, Noodle & Fast Food Boxes",
    img: "/images/pizza_box.png", 
    group: "containers",
    badge: "⚡ HOT",
    tag: "Fast Food"
  },
  { 
    id: "water-bottle-mockups", 
    title: "Water Bottle Mockups", 
    subtitle: "Sport PET & Mineral Water Bottles",
    img: "/images/supplement.png", 
    group: "bottles",
    tag: "Hydration"
  },
  { 
    id: "gift-box-mockups", 
    title: "Gift Box Mockups", 
    subtitle: "Rigid Luxury & Magnetic Lid Boxes",
    img: "/images/gift_box.png", 
    group: "boxes",
    badge: "👑 PREMIUM",
    tag: "Luxury Rigid",
    isFeatured: true
  },
  { 
    id: "paper-bag-mockups", 
    title: "Paper Bag Mockups", 
    subtitle: "Retail Shopping Bags with Handles",
    img: "/images/paper_bag.png", 
    group: "pouches",
    tag: "Retail & Gift"
  },
  { 
    id: "pizza-packaging-mockups", 
    title: "Pizza Packaging Mockups", 
    subtitle: "E-Flute Corrugated Folding Pizza Boxes",
    img: "/images/pizza_box.png", 
    group: "boxes",
    tag: "E-Flute Kraft"
  },
  { 
    id: "supplement-bottle-mockups", 
    title: "Supplement Bottle Mockups", 
    subtitle: "Pharma & Vitamin Pill Containers",
    img: "/images/supplement.png", 
    group: "bottles",
    tag: "Pharma Grade"
  },
];

const filterTabs = [
  { id: 'all', label: 'All Models', count: 12 },
  { id: 'boxes', label: 'Boxes', count: 4 },
  { id: 'bottles', label: 'Bottles & Cans', count: 4 },
  { id: 'pouches', label: 'Pouches & Bags', count: 2 },
  { id: 'containers', label: 'Containers & Food', count: 3 },
];

const shortcutTags = [
  { label: '#Boxes', value: 'boxes' },
  { label: '#Bottles', value: 'bottles' },
  { label: '#Pouches', value: 'pouches' },
  { label: '#Containers', value: 'containers' },
];

interface Props {
  onCategorySelect?: (id: string) => void;
  showExploreButton?: boolean;
  isModelsPage?: boolean;
}

export default function PackagingCollections({ onCategorySelect, showExploreButton = false, isModelsPage = false }: Props) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleExploreClick = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'models' }));
  };

  const handleShortcutClick = (val: string) => {
    setActiveTab(val);
    setSearchQuery('');
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesTab = activeTab === 'all' || cat.group === activeTab;
    const matchesSearch = searchQuery.trim() === '' || 
      cat.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      cat.subtitle.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesTab && matchesSearch;
  });

  return (
    <section className={`packaging-collections-section ${isModelsPage ? 'packaging-collections-section--models' : 'packaging-collections-section--home'}`} id="packaging-collections">
      {/* Background Ambient Orbs (Models Page Only) */}
      {isModelsPage && (
        <>
          <div className="ambient-orb ambient-orb-1"></div>
          <div className="ambient-orb ambient-orb-2"></div>
        </>
      )}

      <div className="packaging-collections-container">

        {/* HOME PAGE HEADER */}
        {!isModelsPage && (
          <header className="packaging-collections-header">
            <div>
              <h2 className="packaging-collections-title">Packaging Collections</h2>
              <p className="packaging-collections-subtitle">
                Browse production-ready 3D packaging structures and dielines
              </p>
            </div>
          </header>
        )}

        {/* CONTROL BAR (MODELS PAGE ONLY) */}
        {isModelsPage && (
          <div className="models-control-bar">
            {/* Filter Pills */}
            <div className="models-filter-pills">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                  className={`models-pill-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span>{tab.label}</span>
                  <span className="models-pill-count">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Search Input & Shortcuts */}
            <div className="models-search-block">
              <div className="models-search-wrapper">
                <Search className="models-search-icon" />
                <input
                  type="text"
                  placeholder="Filter 3D models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="models-search-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="models-search-clear">
                    ✕
                  </button>
                )}
              </div>

              <div className="models-shortcut-tags">
                <span className="shortcut-label">Quick:</span>
                {shortcutTags.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => handleShortcutClick(tag.value)}
                    className={`shortcut-tag-btn ${activeTab === tag.value ? 'active' : ''}`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GRID LAYOUT */}
        <div className={`packaging-collections-grid ${isModelsPage ? 'packaging-collections-grid--models' : 'packaging-collections-grid--home'}`}>
          {filteredCategories.map((cat) => (
            isModelsPage ? (
              /* DEDICATED MODELS PAGE VERTICAL RICH CARD */
              <div
                key={cat.id}
                className={`packaging-collections-card ${cat.isFeatured ? 'packaging-collections-card--featured' : ''}`}
                onClick={() => onCategorySelect && onCategorySelect(cat.id)}
              >
                <div className="packaging-collections-card__top">
                  <div className="img-ambient-glow"></div>
                  <img className="packaging-collections-card__img" src={cat.img} alt={cat.title} />
                </div>

                <div className="packaging-collections-card__body">
                  <div>
                    <div className="card-meta-row">
                      <span className="packaging-card-tag">{cat.tag || '3D Model'}</span>
                    </div>
                    <h3 className="packaging-collections-card__title">{cat.title}</h3>
                    <p className="packaging-collections-card__sub">{cat.subtitle}</p>
                  </div>
                  
                  <div className="packaging-collections-card__action">
                    <span>Open in 3D Studio</span>
                    <div className="packaging-collections-card__arrow">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* EXACT HOME PAGE HORIZONTAL CARD */
              <div
                key={cat.id}
                className="packaging-home-card"
                onClick={() => onCategorySelect && onCategorySelect(cat.id)}
              >
                <div className="packaging-home-card__left">
                  <h3 className="packaging-home-card__title">{cat.title}</h3>
                  <div className="packaging-home-card__arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="packaging-home-card__right">
                  <img className="packaging-home-card__img" src={cat.img} alt={cat.title} />
                </div>
              </div>
            )
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="models-empty-state">
            <p>No 3D models matched your search "<strong>{searchQuery}</strong>".</p>
            <button onClick={() => { setSearchQuery(''); setActiveTab('all'); }} className="models-empty-reset">
              Reset All Filters
            </button>
          </div>
        )}

        {showExploreButton && (
          <div className="packaging-collections-explore-wrapper">
            <button
              onClick={handleExploreClick}
              className="packaging-collections-explore-btn"
            >
              <span>Explore All 3D Models & Dielines</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
