import React, { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import './PackagingCollections.css';

interface CategoryItem {
  id: string;
  title: string;
  img: string;
  group: 'boxes' | 'bottles' | 'pouches' | 'containers';
}

const categories: CategoryItem[] = [
  { id: "box-mockups", title: "Box Mockups", img: "/images/box.png", group: "boxes" },
  { id: "pouch-bag-mockups", title: "Pouch / Bag Mockups", img: "/images/pouch.png", group: "pouches" },
  { id: "bottle-mockups", title: "Bottle Mockups", img: "/images/bottle.png", group: "bottles" },
  { id: "can-mockups", title: "Can Mockups", img: "/images/can.png", group: "bottles" },
  { id: "tube-mockups", title: "Tube Mockups", img: "/images/tube.png", group: "containers" },
  { id: "cup-container-mockups", title: "Cup / Container Mockups", img: "/images/cup.png", group: "containers" },
  { id: "food-packaging-mockups", title: "Food Packaging Mockups", img: "/images/pizza_box.png", group: "containers" },
  { id: "water-bottle-mockups", title: "Water Bottle Mockups", img: "/images/supplement.png", group: "bottles" },
  { id: "gift-box-mockups", title: "Gift Box Mockups", img: "/images/gift_box.png", group: "boxes" },
  { id: "paper-bag-mockups", title: "Paper Bag Mockups", img: "/images/paper_bag.png", group: "pouches" },
  { id: "pizza-packaging-mockups", title: "Pizza Packaging Mockups", img: "/images/pizza_box.png", group: "boxes" },
  { id: "supplement-bottle-mockups", title: "Supplement Bottle Mockups", img: "/images/supplement.png", group: "bottles" },
];

const filterTabs = [
  { id: 'all', label: 'All Models' },
  { id: 'boxes', label: 'Boxes' },
  { id: 'bottles', label: 'Bottles & Cans' },
  { id: 'pouches', label: 'Pouches & Bags' },
  { id: 'containers', label: 'Containers & Food' },
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

  const filteredCategories = categories.filter((cat) => {
    const matchesTab = activeTab === 'all' || cat.group === activeTab;
    const matchesSearch = searchQuery.trim() === '' || cat.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesTab && matchesSearch;
  });

  return (
    <section className={`packaging-collections-section ${isModelsPage ? 'packaging-collections-section--models' : ''}`} id="packaging-collections">
      <div className="packaging-collections-container">
        
        {/* Minimal Control Bar on Models Page */}
        {isModelsPage && (
          <div className="models-control-bar">
            {/* Filter Pills */}
            <div className="models-filter-pills">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`models-pill-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Search */}
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
          </div>
        )}

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

        {/* Dynamic Card Grid */}
        <div className={`packaging-collections-grid ${isModelsPage ? 'packaging-collections-grid--models' : ''}`}>
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="packaging-collections-card"
              onClick={() => onCategorySelect && onCategorySelect(cat.id)}
            >
              <div className="packaging-collections-card__left">
                <h3 className="packaging-collections-card__title">{cat.title}</h3>
                <div className="packaging-collections-card__arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="packaging-collections-card__right">
                <img className="packaging-collections-card__img" src={cat.img} alt={cat.title} />
              </div>
            </div>
          ))}
        </div>

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

