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

const defaultCategories: CategoryItem[] = [
  {
    id: "box-mockups",
    title: "Box Mockups",
    count: "1869",
    img: "/images/pacdora_img_0.png"
  },
  {
    id: "pouch-bag-mockups",
    title: "Pouch / Bag Mockups",
    count: "894",
    img: "/images/pacdora_img_1.png"
  },
  {
    id: "bottle-mockups",
    title: "Bottle Mockups",
    count: "1950",
    img: "/images/pacdora_img_2.png"
  },
  {
    id: "can-mockups",
    title: "Can Mockups",
    count: "678",
    img: "/images/pacdora_img_3.png"
  },
  {
    id: "tube-mockups",
    title: "Tube Mockups",
    count: "206",
    img: "/images/pacdora_img_4.png"
  },
  {
    id: "cup-container-mockups",
    title: "Cup / Container Mockups",
    count: "372",
    img: "/images/pacdora_img_5.png"
  },
  {
    id: "food-packaging-mockups",
    title: "Food Packaging Mockups",
    count: "460",
    img: "/images/pacdora_img_6.png"
  },
  {
    id: "water-bottle-mockups",
    title: "Water Bottle Mockups",
    count: "206",
    img: "/images/pacdora_img_7.png"
  },
  {
    id: "gift-box-mockups",
    title: "Gift Box Mockups",
    count: "154",
    img: "/images/pacdora_img_8.png"
  },
  {
    id: "paper-bag-mockups",
    title: "Paper Bag Mockups",
    count: "86",
    img: "/images/pacdora_img_9.png"
  },
  {
    id: "pizza-packaging-mockups",
    title: "Pizza Packaging Mockups",
    count: "81",
    img: "/images/pacdora_img_10.png"
  },
  {
    id: "supplement-bottle-mockups",
    title: "Supplement Bottle Mockups",
    count: "208",
    img: "/images/pacdora_img_11.png"
  }
];

const containerVariants = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.05
    }
  },
  viewport: { once: true, margin: "-50px" }
};

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  whileInView: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
  viewport: { once: true, margin: "-50px" }
};

interface Props {
  onCategorySelect?: (id: string) => void;
  showExploreButton?: boolean;
}

export default function PackagingCollections({ onCategorySelect, showExploreButton }: Props) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const publicCatalog = await catalogService.getPublicCatalog();
        if (publicCatalog && publicCatalog.length > 0) {
          const mapped: CategoryItem[] = publicCatalog.map(item => ({
            id: item.itemId || item._id || item.title.toLowerCase().replace(/\s+/g, '-'),
            title: item.title,
            count: item.subtitle || "New",
            img: item.img || "/images/pacdora_img_0.png"
          }));
          
          setCategories(mapped);
        } else {
          // Only show defaults if the catalog is completely empty or hasn't been set up yet
          setCategories(defaultCategories);
        }
      } catch (err) {
        console.warn("Failed to fetch catalog for packaging collections", err);
        setCategories(defaultCategories);
      }
    };

    fetchCatalog();

    const handleUpdate = () => fetchCatalog();
    window.addEventListener('catalog-updated', handleUpdate);
    return () => window.removeEventListener('catalog-updated', handleUpdate);
  }, []);

  return (
    <section className="pkg-collections-section" id="packaging-collections">
      <div className="pkg-collections-container">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-50px" }}
        >
          {categories.map((cat, i) => (
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
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
