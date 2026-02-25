/**
 * OccasionBoxPage - Standalone page for building occasion boxes
 * Accessible via /occasion-box/:type route
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { API_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import {
  Gift, ChevronLeft, ChevronRight, Check, ShoppingCart,
  Loader2, Sparkles, PartyPopper, ArrowLeft, Plus, Minus
} from 'lucide-react';
import SEOHead from '../components/SEOHead';

const OccasionBoxPage = () => {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const occasionType = type || searchParams.get('occasion') || 'birthday';
  const petName = searchParams.get('pet') || 'your pet';
  
  const [template, setTemplate] = useState(null);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  // Fetch template and products
  const fetchTemplateData = useCallback(async () => {
    try {
      setLoading(true);
      
      // First try to get by occasion type
      const byOccasionUrl = `${API_URL}/api/occasion-boxes/by-occasion/${occasionType}`;
      let response = await fetch(byOccasionUrl);
      
      if (!response.ok) {
        // Try with slug format
        const slug = `${occasionType}-box`;
        const slugUrl = `${API_URL}/api/occasion-boxes/${slug}`;
        response = await fetch(slugUrl);
        
        if (!response.ok) {
          throw new Error('Template not found');
        }
      }
      
      const templateData = await response.json();
      setTemplate(templateData);
      
      // Fetch products for this template
      const productsUrl = `${API_URL}/api/occasion-boxes/${templateData.slug}/products`;
      const productsResponse = await fetch(productsUrl);
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || {});
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Could not load occasion box template');
    } finally {
      setLoading(false);
    }
  }, [occasionType]);

  useEffect(() => {
    fetchTemplateData();
  }, [fetchTemplateData]);

  // Get categories from template
  const categories = template?.categories || [];
  const currentCategory = categories[currentStep];
  const currentProducts = currentCategory ? (products[currentCategory.id] || []) : [];

  // Handle item selection
  const toggleItem = (productId, product) => {
    setSelectedItems(prev => {
      const categoryItems = prev[currentCategory?.id] || [];
      const exists = categoryItems.find(item => item.id === productId);
      
      if (exists) {
        return {
          ...prev,
          [currentCategory.id]: categoryItems.filter(item => item.id !== productId)
        };
      } else {
        return {
          ...prev,
          [currentCategory.id]: [...categoryItems, { ...product, quantity: 1 }]
        };
      }
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    let total = 0;
    let itemCount = 0;
    
    Object.values(selectedItems).forEach(categoryItems => {
      categoryItems.forEach(item => {
        total += (item.price || 0) * (item.quantity || 1);
        itemCount += item.quantity || 1;
      });
    });
    
    return { total, itemCount };
  };

  const { total, itemCount } = calculateTotals();

  // Add all to cart
  const handleAddAllToCart = () => {
    Object.values(selectedItems).forEach(categoryItems => {
      categoryItems.forEach(item => {
        addToCart({
          id: item.id,
          title: item.name || item.title,
          price: item.price,
          image: item.images?.[0] || item.image_url,
          quantity: item.quantity || 1
        });
      });
    });
    
    toast.success(`Added ${itemCount} items to cart!`, {
      description: `Total: ₹${total.toLocaleString()}`
    });
    
    navigate('/shop');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your {occasionType} box builder...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Template Not Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find a template for "{occasionType}"</p>
          <Button onClick={() => navigate('/celebrate')}>
            Browse Celebrations
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead page="celebrate" />
      
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              
              <div className="text-center">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 justify-center">
                  <PartyPopper className="w-5 h-5 text-pink-500" />
                  {template.name}
                </h1>
                <p className="text-sm text-gray-500">for {petName}</p>
              </div>
              
              <div className="text-right">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {itemCount} items • ₹{total.toLocaleString()}
                </Badge>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex gap-1">
                {categories.map((cat, idx) => (
                  <div 
                    key={cat.id}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                      idx < currentStep ? 'bg-green-500' :
                      idx === currentStep ? 'bg-purple-500' :
                      'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Step {currentStep + 1} of {categories.length}: {currentCategory?.name || 'Summary'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {!showSummary ? (
            <>
              {/* Category Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{currentCategory?.name}</h2>
                <p className="text-gray-600">{currentCategory?.description || `Choose items for ${petName}'s ${occasionType}`}</p>
                {currentCategory?.required && (
                  <Badge className="mt-2 bg-pink-100 text-pink-700">Required</Badge>
                )}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {currentProducts.map((product) => {
                  const isSelected = (selectedItems[currentCategory?.id] || []).find(
                    item => item.id === product.id
                  );
                  
                  return (
                    <Card 
                      key={product.id}
                      className={`p-3 cursor-pointer transition-all hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                      }`}
                      onClick={() => toggleItem(product.id, product)}
                    >
                      <div className="relative aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={product.images?.[0] || product.image_url || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm text-gray-900 truncate">{product.name}</h3>
                      <p className="text-purple-600 font-bold">₹{product.price?.toLocaleString()}</p>
                    </Card>
                  );
                })}
              </div>

              {currentProducts.length === 0 && (
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No products available in this category</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setCurrentStep(prev => Math.min(prev + 1, categories.length))}
                  >
                    Skip to Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Summary View */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-gray-900">Your {template.name} is Ready!</h2>
                <p className="text-gray-600">Review your selections for {petName}</p>
              </div>
              
              <Card className="p-6 mb-6">
                {Object.entries(selectedItems).map(([categoryId, items]) => {
                  if (items.length === 0) return null;
                  const category = categories.find(c => c.id === categoryId);
                  
                  return (
                    <div key={categoryId} className="mb-4 last:mb-0">
                      <h3 className="font-medium text-gray-700 mb-2">{category?.name}</h3>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span>{item.name || item.title}</span>
                            <span className="font-medium">₹{(item.price * (item.quantity || 1)).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
              
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 text-lg"
                onClick={handleAddAllToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add All to Cart
              </Button>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        {!showSummary && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">{itemCount} items selected</p>
                <p className="font-bold text-purple-600">₹{total.toLocaleString()}</p>
              </div>
              
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  if (currentStep >= categories.length - 1) {
                    setShowSummary(true);
                  } else {
                    setCurrentStep(prev => prev + 1);
                  }
                }}
              >
                {currentStep >= categories.length - 1 ? 'Review Box' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OccasionBoxPage;
