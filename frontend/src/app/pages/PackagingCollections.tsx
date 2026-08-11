import React from 'react';
import { ArrowRight } from 'lucide-react';
import './PackagingCollections.css';

const categories = [
  { id: "box-mockups", title: "Box Mockups", img: "/images/box.png" },
  { id: "pouch-bag-mockups", title: "Pouch / Bag Mockups", img: "/images/pouch.png" },
  { id: "bottle-mockups", title: "Bottle Mockups", img: "/images/bottle.png" },
  { id: "can-mockups", title: "Can Mockups", img: "/images/can.png" },
  { id: "tube-mockups", title: "Tube Mockups", img: "/images/tube.png" },
  { id: "cup-container-mockups", title: "Cup / Container Mockups", img: "/images/cup.png" },
  { id: "food-packaging-mockups", title: "Food Packaging Mockups", img: "/images/pizza_box.png" },
  { id: "water-bottle-mockups", title: "Water Bottle Mockups", img: "/images/supplement.png" },
  { id: "gift-box-mockups", title: "Gift Box Mockups", img: "/images/gift_box.png" },
  { id: "paper-bag-mockups", title: "Paper Bag Mockups", img: "/images/paper_bag.png" },
  { id: "pizza-packaging-mockups", title: "Pizza Packaging Mockups", img: "/images/pizza_box.png" },
  { id: "supplement-bottle-mockups", title: "Supplement Bottle Mockups", img: "/images/supplement.png" },
];

interface Props {
  onCategorySelect?: (id: string) => void;
  showExploreButton?: boolean;
}

export default function PackagingCollections({ onCategorySelect, showExploreButton = false }: Props) {
  const handleExploreClick = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'models' }));
    if (onCategorySelect) {
      onCategorySelect('models');
    }
  };

  return (
    <section className="packaging-collections-section" id="packaging-collections">
      <div className="packaging-collections-container">
        <header className="packaging-collections-header">
          <div>
            <h2 className="packaging-collections-title">Packaging Collections</h2>
            <p className="packaging-collections-subtitle">
              Browse production-ready 3D packaging structures and dielines
            </p>
          </div>
        </header>

        <div className="packaging-collections-grid">
          {categories.map((cat) => (
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
