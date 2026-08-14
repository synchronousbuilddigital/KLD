// @ts-nocheck
import React, { useState } from 'react';
import { ArrowRight, Search, CheckCircle2, Sparkles } from 'lucide-react';
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
    isFeatured: true,
  },
  {
    id: "pouch-bag-mockups",
    title: "Pouch / Bag Mockups",
    subtitle: "Stand-Up Foil Pouches & Kraft Bags",
    img: "/images/pouch.png",
    group: "pouches",
    badge: "⚡ HIGH REVENUE",
    tag: "3D Visualizer",
    isFeatured: true,
  },
  {
    id: "bottle-mockups",
    title: "Bottle Mockups",
    subtitle: "Beverage, Essential Oil & Wine Bottles",
    img: "/images/bottle.png",
    group: "bottles",
    badge: "✦ PREMIUM GLASS",
    tag: "Pro CAD Dieline",
    isFeatured: true,
  },
  {
    id: "can-mockups",
    title: "Can Mockups",
    subtitle: "Sleek & Standard Aluminum Drink Cans",
    img: "/images/can.png",
    group: "bottles",
    tag: "3D Studio",
    isFeatured: true,
  },
  {
    id: "tube-mockups",
    title: "Tube Mockups",
    subtitle: "Cosmetic & Skincare Squeeze Tubes",
    img: "/images/tube.png",
    group: "containers",
    tag: "3D Studio",
  },
  {
    id: "cup-container-mockups",
    title: "Cup / Container Mockups",
    subtitle: "Eco Paper Coffee Cups & Tubs",
    img: "/images/cup.png",
    group: "containers",
    tag: "Vector Dieline",
  },
  {
    id: "food-packaging-mockups",
    title: "Food Packaging Mockups",
    subtitle: "Takeout, Noodle & Fast Food Boxes",
    img: "/images/pizza_box.png",
    group: "boxes",
    tag: "Auto-Lock Dieline",
  },
  {
    id: "water-bottle-mockups",
    title: "Water Bottle Mockups",
    subtitle: "Sport PET & Mineral Water Bottles",
    img: "/images/bottle.png",
    group: "bottles",
    tag: "3D Visualizer",
  },
  {
    id: "gift-box-mockups",
    title: "Gift Box Mockups",
    subtitle: "Rigid Magnetic Closure & Lid-Base Boxes",
    img: "/images/gift_box.png",
    group: "boxes",
    tag: "3D Studio",
  },
  {
    id: "paper-bag-mockups",
    title: "Paper Bag Mockups",
    subtitle: "Twisted Handle Retail Shopping Bags",
    img: "/images/paper_bag.png",
    group: "pouches",
    tag: "Vector Blueprint",
  },
  {
    id: "pizza-box-mockups",
    title: "Pizza Box Mockups",
    subtitle: "Corrugated Square Takeout Pizza Boxes",
    img: "/images/pizza_box.png",
    group: "boxes",
    tag: "3D Studio",
  },
  {
    id: "supplement-jar-mockups",
    title: "Supplement Jar Mockups",
    subtitle: "Wide-Mouth Protein & Vitamin Jars",
    img: "/images/supplement.png",
    group: "containers",
    tag: "3D Studio",
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

interface PackagingCollectionsProps {
  onCategorySelect?: (categoryId: string) => void;
  showExploreButton?: boolean;
  isModelsPage?: boolean;
}

export default function PackagingCollections({
  onCategorySelect,
  showExploreButton = true,
  isModelsPage = false
}: PackagingCollectionsProps) {
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
      {isModelsPage && (
        <>
          <div className="ambient-orb ambient-orb-1"></div>
          <div className="ambient-orb ambient-orb-2"></div>
        </>
      )}

      <div className="packaging-collections-container">

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

        {/* PHENOMENAL HERO SEARCH BANNER (MODELS PAGE ONLY) */}
        {isModelsPage && (
          <div className="models-search-hero-banner">
            <div className="models-hero-left">
              <div className="models-hero-breadcrumb">
                <span className="breadcrumb-path">Home</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">3D Mockups Catalog</span>
              </div>

              <h1 className="models-hero-heading">
                <span className="sparkle-icon">✨</span> Customize & Download 3D Mockups
              </h1>
              <p className="models-hero-subtext">
                Explore high-quality production-ready 3D packaging mockups including tuck boxes, foil pouches, glass bottles, drink cans, and food containers.
              </p>

              <div className="models-hero-search-box">
                <div className="models-hero-search-input-wrapper">
                  <Sparkles className="hero-search-sparkle-icon" />
                  <input
                    type="text"
                    placeholder="Try 4+ words e.g. Box, Bottle, Can, Pouch, Tube..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="models-hero-search-input"
                  />
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery('')} className="models-hero-search-clear" title="Clear search">
                      ✕
                    </button>
                  ) : (
                    <div className="models-hero-search-badge">
                      <Search className="w-3.5 h-3.5" /> <span>Search Catalog</span>
                    </div>
                  )}
                </div>

                <div className="models-hero-tags">
                  <span className="hero-tags-label">Popular searches:</span>
                  {shortcutTags.map((tag) => (
                    <button
                      key={tag.value}
                      onClick={() => handleShortcutClick(tag.value)}
                      className={`hero-tag-chip ${activeTab === tag.value ? 'active' : ''}`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="models-hero-visual-right hidden lg:flex">
              <div className="showcase-mockup-stack">
                <img
                  src="/images/pouch.png"
                  alt="3D Bag Mockup"
                  className="showcase-img showcase-img-1"
                />
                <img
                  src="/images/box.png"
                  alt="3D Box Mockup"
                  className="showcase-img showcase-img-2"
                />
                <img
                  src="/images/bottle.png"
                  alt="3D Bottle Mockup"
                  className="showcase-img showcase-img-3"
                />
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY FILTER TABS BAR (MODELS PAGE ONLY) */}
        {isModelsPage && (
          <div className="models-category-bar">
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

        {showExploreButton && !isModelsPage && (
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
