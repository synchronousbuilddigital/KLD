import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { catalogService } from '../../services/catalog';
import './PackagingCollections.css';

interface CategoryItem {
  id: string;
  title: string;
  count: number | string;
  img: string;
}

export const DEFAULT_PACKAGING_COLLECTIONS: CategoryItem[] = [
  {
    id: 'box-mockups',
    title: 'Box Mockups',
    count: '7 Models',
    img: '/images/catalog/box-mockups.png',
  },
  {
    id: 'pouch-bag-mockups',
    title: 'Pouch / Bag Mockups',
    count: 'Stand-Up Foil Pouches & Kraft Bags',
    img: '/images/catalog/pouch-bag-mockups.png',
  },
  {
    id: 'bottle-mockups',
    title: 'Bottle Mockups',
    count: '2 Models',
    img: '/images/catalog/bottle-mockups.png',
  },
  {
    id: 'can-mockups',
    title: 'Can Mockups',
    count: '2 Models',
    img: '/images/catalog/can-mockups.png',
  },
  {
    id: 'tube-mockups',
    title: 'Tube Mockups',
    count: '1 Models',
    img: '/images/catalog/tube-mockups.png',
  },
  {
    id: 'cup-container-mockups',
    title: 'Cup / Container Mockups',
    count: 'Eco Paper Coffee Cups & Tubs',
    img: '/images/catalog/cup-container-mockups.png',
  },
  {
    id: 'food-packaging-mockups',
    title: 'Food Packaging Mockups',
    count: 'Takeout, Noodle & Fast Food Boxes',
    img: '/images/catalog/food-packaging-mockups.png',
  },
  {
    id: 'water-bottle-mockups',
    title: 'Water Bottle Mockups',
    count: 'Sport PET & Mineral Water Bottles',
    img: '/images/catalog/water-bottle-mockups.png',
  },
  {
    id: 'gift-box-mockups',
    title: 'Gift Box Mockups',
    count: 'Rigid Luxury & Magnetic Lid Boxes',
    img: '/images/catalog/gift-box-mockups.png',
  },
  {
    id: 'paper-bag-mockups',
    title: 'Paper Bag Mockups',
    count: 'Retail Shopping Bags with Handles',
    img: '/images/catalog/paper-bag-mockups.png',
  },
  {
    id: 'pizza-packaging-mockups',
    title: 'Pizza Box Mockups',
    count: '1 Model',
    img: '/images/catalog/pizza-packaging-mockups.png',
  },
  {
    id: 'supplement-bottle-mockups',
    title: 'Supplement Box Mockups',
    count: '20 Models',
    img: '/images/catalog/supplement-bottle-mockups.png',
  },
];

const mapCatalogItems = (items: any[]): CategoryItem[] => {
  return items.map((item) => {
    const itemId = item.itemId || item._id || item.title.toLowerCase().replace(/\s+/g, '-');
    const isPizza = itemId === 'pizza-packaging-mockups' || itemId === 'pizza-box-mockups' || item.title?.toLowerCase().includes('pizza');
    const defaultMatch = DEFAULT_PACKAGING_COLLECTIONS.find(d => d.id === itemId);
    
    let count = defaultMatch?.count;
    if (!count) {
      if (isPizza) {
        count = '1 Model';
      } else if (item.variants && item.variants.length > 0) {
        count = `${item.variants.length} Models`;
      } else {
        count = item.subtitle || 'Active';
      }
    }

    return {
      id: itemId,
      title: isPizza ? 'Pizza Box Mockups' : item.title,
      count: count,
      img: isPizza ? '/images/catalog/pizza-packaging-mockups.png' : (item.img || defaultMatch?.img || '/images/box.png'),
    };
  });
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
  }
};

interface Props {
  onCategorySelect?: (id: string) => void;
  showExploreButton?: boolean;
  isModelsPage?: boolean;
}

export default function PackagingCollections({ onCategorySelect, showExploreButton, isModelsPage }: Props) {
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const cached = catalogService.getCachedCatalog();
    if (cached && cached.length > 0) {
      const mapped = mapCatalogItems(cached.filter(item => item.group !== 'dielines'));
      if (mapped.length > 0) return mapped;
    }
    return DEFAULT_PACKAGING_COLLECTIONS;
  });

  useEffect(() => {
    let isMounted = true;

    const fetchCatalog = async () => {
      try {
        const publicCatalog = await catalogService.getPublicCatalog();
        if (isMounted && publicCatalog && publicCatalog.length > 0) {
          const validItems = mapCatalogItems(publicCatalog.filter(item => item.group !== 'dielines'));
          if (validItems.length > 0) {
            setCategories(validItems);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch catalog for packaging collections", err);
      }
    };

    fetchCatalog();

    const handleUpdate = () => {
      catalogService.clearCache();
      fetchCatalog();
    };

    window.addEventListener('catalog-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('catalog-updated', handleUpdate);
    };
  }, []);

  const displayCategories = categories.length > 0 ? categories : DEFAULT_PACKAGING_COLLECTIONS;

  return (
    <section 
      className={`pkg-collections-section ${isModelsPage ? 'pkg-collections-models-page' : ''}`} 
      id="packaging-collections"
    >
      <div className="pkg-collections-container">
        <motion.div 
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="pkg-collections-header"
        >
          <div className="flex items-center gap-3">
            <ArrowRight className="w-7 h-7 text-zinc-900" />
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-zinc-900">
              Packaging Collections
            </h2>
          </div>
        </motion.div>

        <motion.div 
          className="pkg-collections-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {displayCategories.map((cat) => (
            <motion.div
              key={cat.id}
              variants={cardVariants}
              onClick={() => onCategorySelect && onCategorySelect(cat.id)}
              className="pkg-collections-card group"
              tabIndex={0}
              role="button"
            >
              {/* Left Column: Title, Count, Arrow */}
              <div className="pkg-card-left">
                <div>
                  <h3 className="pkg-card-title">
                    {cat.title}
                  </h3>
                  <span className="pkg-card-count">
                    {cat.count}
                  </span>
                </div>
                
                <div className="pkg-card-arrow">
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>

              {/* Right Column: 3D Mockup Visual */}
              <div className="pkg-card-visual">
                <img 
                  src={cat.img} 
                  alt={cat.title} 
                  className="pkg-card-img"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to default catalog image if specific path fails to load
                    const target = e.currentTarget;
                    if (!target.src.includes('box-mockups.png')) {
                      target.src = '/images/catalog/box-mockups.png';
                    }
                  }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
