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

const mapCatalogItems = (items: any[]): CategoryItem[] => {
  return items.map((item) => ({
    id: item.itemId || item._id || item.title.toLowerCase().replace(/\s+/g, '-'),
    title: item.title,
    count: item.variants && item.variants.length > 0 
      ? `${item.variants.length} Models` 
      : (item.subtitle || 'Active'),
    img: item.img || '/images/box.png',
  }));
};

const containerVariants = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  whileInView: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  }
};

interface Props {
  onCategorySelect?: (id: string) => void;
  showExploreButton?: boolean;
}

export default function PackagingCollections({ onCategorySelect, showExploreButton }: Props) {
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const cached = catalogService.getCachedCatalog();
    return cached && cached.length > 0 ? mapCatalogItems(cached.filter(item => item.group !== 'dielines')) : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(categories.length === 0);

  useEffect(() => {
    let isMounted = true;

    const fetchCatalog = async () => {
      try {
        const publicCatalog = await catalogService.getPublicCatalog();
        if (isMounted) {
          if (publicCatalog && publicCatalog.length > 0) {
            setCategories(mapCatalogItems(publicCatalog.filter(item => item.group !== 'dielines')));
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("Failed to fetch catalog for packaging collections", err);
        if (isMounted) setIsLoading(false);
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

        {isLoading && categories.length === 0 ? (
          <div className="pkg-collections-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="pkg-collections-card"
                style={{
                  minHeight: '165px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              >
                <div className="pkg-card-left" style={{ justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <div style={{ height: '18px', width: '120px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '8px' }}></div>
                    <div style={{ height: '14px', width: '60px', background: '#cbd5e1', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                </div>
                <div className="pkg-card-visual" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: '#e2e8f0', borderRadius: '12px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
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
        ) : null}
      </div>
    </section>
  );
}
