/**
 * CrossSellSection - Shows related products after service booking
 * "Complete Your Care" product recommendations with bundle discount
 */
import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ShoppingBag, Sparkles, ChevronRight, Loader2, Check, Gift
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';

const CrossSellSection = ({ 
  serviceId, 
  serviceName, 
  pillar,
  onAddToCart,
  maxProducts = 4 
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');
  const [addedProducts, setAddedProducts] = useState(new Set());

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!serviceId && !serviceName && !pillar) return;
      
      try {
        const response = await fetch(`${API_URL}/api/cross-sell/recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: serviceId || '',
            service_name: serviceName || '',
            pillar: pillar || '',
            limit: maxProducts
          })
        });
        
        const data = await response.json();
        setProducts(data.products || []);
        setDiscount(data.discount_percent || 0);
        setMessage(data.message || 'Recommended for you');
      } catch (err) {
        console.error('Error fetching cross-sell:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [serviceId, serviceName, pillar, maxProducts]);

  const handleAddToCart = async (product) => {
    const productId = product.id || product.product_id;
    
    // Record conversion
    try {
      await fetch(`${API_URL}/api/cross-sell/record-conversion?service_id=${serviceId || pillar}&product_id=${productId}`, {
        method: 'POST'
      });
    } catch (err) {
      // Silent fail for analytics
    }

    // Call parent handler
    if (onAddToCart) {
      onAddToCart({
        ...product,
        price: product.discounted_price || product.price,
        cross_sell_discount: discount
      });
    }

    setAddedProducts(prev => new Set([...prev, productId]));
    toast({ 
      title: 'Added to Cart!', 
      description: `${product.name} added with ${discount}% bundle discount` 
    });
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-6 bg-gradient-to-b from-rose-50 to-white rounded-xl">
      <div className="px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
              <Gift className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">{message}</h3>
              <p className="text-xs text-gray-500">Bundle & save {discount}%</p>
            </div>
          </div>
          <Badge className="bg-rose-500 text-white text-xs">
            {discount}% OFF
          </Badge>
        </div>

        {/* Products Grid - 2x2 on mobile */}
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => {
            const productId = product.id || product.product_id;
            const isAdded = addedProducts.has(productId);
            
            return (
              <Card 
                key={productId}
                className="overflow-hidden border hover:shadow-md transition-all"
              >
                {/* Product Image */}
                {product.image_url || product.images?.[0] ? (
                  <div className="h-20 sm:h-28 bg-gray-100">
                    <img 
                      src={product.image_url || product.images?.[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 sm:h-28 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-rose-300" />
                  </div>
                )}
                
                <div className="p-2 sm:p-3">
                  {/* Product Name */}
                  <h4 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h4>
                  
                  {/* Price */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-sm sm:text-base font-bold text-rose-600">
                      ₹{(product.discounted_price || product.price || 0).toLocaleString()}
                    </span>
                    {product.original_price && product.original_price !== product.discounted_price && (
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                        ₹{product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Add Button */}
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={isAdded}
                    className={`w-full h-7 text-xs ${
                      isAdded 
                        ? 'bg-emerald-500 hover:bg-emerald-500' 
                        : 'bg-rose-500 hover:bg-rose-600'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CrossSellSection;
