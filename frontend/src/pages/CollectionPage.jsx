import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../utils/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import {
  ArrowLeft, ShoppingBag, Calendar, Clock, ChevronLeft, ChevronRight,
  Heart, Gift, Cake, Loader2
} from 'lucide-react';

const CollectionPage = () => {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carouselIndexes, setCarouselIndexes] = useState({});

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/campaign/collections/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setCollection(data.collection);
        } else if (res.status === 404) {
          setError('Collection not found');
        } else {
          setError('Failed to load collection');
        }
      } catch (err) {
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [slug]);

  const scrollCarousel = (sectionId, direction) => {
    const currentIndex = carouselIndexes[sectionId] || 0;
    const section = collection.sections.find(s => s.id === sectionId);
    const maxIndex = Math.max(0, (section?.items?.length || 0) - 4);
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    newIndex = Math.max(0, Math.min(newIndex, maxIndex));
    
    setCarouselIndexes({ ...carouselIndexes, [sectionId]: newIndex });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!collection) return null;

  const themeColor = collection.theme_color || '#EC4899';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Banner */}
      <div 
        className="relative h-[400px] md:h-[500px] overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${themeColor}20 0%, ${themeColor}40 100%)`
        }}
      >
        {collection.banner_image && (
          <img 
            src={collection.banner_image} 
            alt={collection.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-12">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-4 w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
          </Link>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {collection.name}
          </h1>
          
          <p className="text-xl text-white/90 max-w-2xl mb-6">
            {collection.description}
          </p>
          
          {collection.visibility?.end_date && (
            <div className="flex items-center gap-2 text-white/80">
              <Clock className="w-4 h-4" />
              <span>Available until {new Date(collection.visibility.end_date).toLocaleDateString('en-IN', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {collection.sections?.map((section, sectionIndex) => (
          <section key={section.id || sectionIndex} className="relative">
            {/* Section Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="text-lg text-gray-600">{section.subtitle}</p>
              )}
            </div>

            {/* Items Grid/Carousel */}
            {section.layout === 'carousel' ? (
              <div className="relative">
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-out gap-6"
                    style={{ 
                      transform: `translateX(-${(carouselIndexes[section.id] || 0) * 25}%)` 
                    }}
                  >
                    {section.items?.map((item, idx) => (
                      <div key={idx} className="w-full md:w-1/4 flex-shrink-0">
                        <ProductCard item={item} themeColor={themeColor} />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Carousel Controls */}
                {section.items?.length > 4 && (
                  <>
                    <button
                      onClick={() => scrollCarousel(section.id, 'prev')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                      disabled={(carouselIndexes[section.id] || 0) === 0}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => scrollCarousel(section.id, 'next')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            ) : section.layout === 'featured' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {section.items?.map((item, idx) => (
                  <div key={idx} className={idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}>
                    <ProductCard 
                      item={item} 
                      themeColor={themeColor} 
                      featured={idx === 0}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-6 ${
                section.columns === 3 
                  ? 'md:grid-cols-2 lg:grid-cols-3' 
                  : 'md:grid-cols-2 lg:grid-cols-4'
              }`}>
                {section.items?.map((item, idx) => (
                  <ProductCard key={idx} item={item} themeColor={themeColor} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Footer CTA */}
      <div 
        className="py-16 text-center"
        style={{ background: `linear-gradient(135deg, ${themeColor}10 0%, ${themeColor}20 100%)` }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Make This Valentine's Special 💕
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Order now and give your furry best friend the love they deserve!
        </p>
        <Link to="/celebrate">
          <Button 
            size="lg" 
            className="text-white"
            style={{ backgroundColor: themeColor }}
          >
            <ShoppingBag className="w-5 h-5 mr-2" /> Shop All Products
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ item, themeColor, featured = false }) => {
  const data = item.actual_data || {};
  const name = item.display_name || data.name || 'Product';
  const image = item.display_image || data.image;
  const price = data.price;
  const link = item.button_link || data.link || '#';
  const buttonText = item.button_text || 'View';

  return (
    <Card className={`group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col ${featured ? 'min-h-[400px]' : ''}`}>
      <div className={`relative overflow-hidden bg-gray-100 ${featured ? 'h-64' : 'h-48'}`}>
        {image ? (
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Link to={link}>
            <Button 
              className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform"
              style={{ backgroundColor: themeColor }}
            >
              {buttonText}
            </Button>
          </Link>
        </div>
        
        {/* Heart Badge */}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
          <Heart className="w-4 h-4 text-gray-400 hover:text-pink-500 transition-colors" />
        </button>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className={`font-semibold text-gray-900 mb-2 line-clamp-2 ${featured ? 'text-xl' : 'text-base'}`}>
          {name}
        </h3>
        
        {price && (
          <p className="text-lg font-bold mt-auto" style={{ color: themeColor }}>
            ₹{price.toLocaleString('en-IN')}
          </p>
        )}
        
        <Link to={link} className="mt-3">
          <Button 
            variant="outline" 
            className="w-full hover:text-white transition-colors"
            style={{ 
              borderColor: themeColor,
              color: themeColor,
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = themeColor;
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = themeColor;
            }}
          >
            {buttonText}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default CollectionPage;
