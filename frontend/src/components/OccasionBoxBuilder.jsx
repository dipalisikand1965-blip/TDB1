/**
 * OccasionBoxBuilder - Member-facing component for building occasion boxes
 * Step-by-step guided experience to build celebration boxes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { API_URL } from '../utils/api';
import {
  Gift, ChevronLeft, ChevronRight, Check, ShoppingCart,
  Loader2, Sparkles, PartyPopper
} from 'lucide-react';

const OccasionBoxBuilder = ({ 
  isOpen, 
  onClose, 
  occasionType = 'birthday',
  petName = 'your pet',
  onAddToCart 
}) => {
  const [template, setTemplate] = useState(null);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  // Fetch template and products
  const fetchTemplateData = useCallback(async () => {
    if (!occasionType) {
      console.log('No occasion type provided');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching template for occasion:', occasionType);
      
      // First try to get by occasion type
      let response = await fetch(`${API_URL}/api/occasion-boxes/by-occasion/${occasionType}`);
      console.log('By-occasion response:', response.status);
      
      if (!response.ok) {
        // Fallback to slug
        const slug = `${occasionType}-box`.replace('_', '-');
        console.log('Trying fallback slug:', slug);
        response = await fetch(`${API_URL}/api/occasion-boxes/${slug}`);
      }
      
      if (!response.ok) {
        throw new Error('Template not found');
      }
      
      const templateData = await response.json();
      console.log('Template loaded:', templateData.name);
      setTemplate(templateData);
      
      // Now fetch products for this template
      const productsResponse = await fetch(
        `${API_URL}/api/occasion-boxes/${templateData.slug}/products`
      );
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || {});
        console.log('Products loaded:', Object.keys(productsData.products || {}).length, 'categories');
      }
      
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load occasion box. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [occasionType]);

  useEffect(() => {
    if (isOpen && occasionType) {
      fetchTemplateData();
      setCurrentStep(0);
      setSelectedItems({});
      setShowSummary(false);
    }
  }, [isOpen, fetchTemplateData, occasionType]);

  const categories = template?.categories || [];
  const currentCategory = categories[currentStep];

  const toggleItem = (categoryId, product) => {
    setSelectedItems(prev => {
      const categoryItems = prev[categoryId] || [];
      const existingIndex = categoryItems.findIndex(p => p.id === product.id);
      
      const category = categories.find(c => c.id === categoryId);
      const maxItems = category?.max_items || 5;
      
      if (existingIndex >= 0) {
        // Remove item
        return {
          ...prev,
          [categoryId]: categoryItems.filter(p => p.id !== product.id)
        };
      } else if (categoryItems.length < maxItems) {
        // Add item
        return {
          ...prev,
          [categoryId]: [...categoryItems, product]
        };
      } else {
        toast.error(`Maximum ${maxItems} items allowed in this category`);
        return prev;
      }
    });
  };

  const isItemSelected = (categoryId, productId) => {
    return (selectedItems[categoryId] || []).some(p => p.id === productId);
  };

  const getCategoryItemCount = (categoryId) => {
    return (selectedItems[categoryId] || []).length;
  };

  const canProceed = () => {
    if (!currentCategory) return false;
    const itemCount = getCategoryItemCount(currentCategory.id);
    
    if (currentCategory.required && itemCount < (currentCategory.min_items || 1)) {
      return false;
    }
    return true;
  };

  const calculateTotal = () => {
    let subtotal = 0;
    Object.values(selectedItems).forEach(items => {
      items.forEach(item => {
        subtotal += item.price || 0;
      });
    });
    
    const discount = template?.bundle_discount_percent || 0;
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;
    
    return { subtotal, discountAmount, total, discount };
  };

  const getAllSelectedItems = () => {
    const allItems = [];
    Object.values(selectedItems).forEach(items => {
      allItems.push(...items);
    });
    return allItems;
  };

  const handleAddAllToCart = () => {
    const allItems = getAllSelectedItems();
    if (allItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    
    if (onAddToCart) {
      onAddToCart(allItems);
    }
    
    toast.success(`Added ${allItems.length} items to cart!`, {
      description: template?.bundle_discount_percent > 0 
        ? `You saved ${template.bundle_discount_percent}% with the bundle discount!`
        : undefined
    });
    
    onClose();
  };

  const goToNext = () => {
    if (currentStep < categories.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goToPrev = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isOpen) {
    return null;
  }

  if (!template) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Box Not Available</h3>
            <p className="text-gray-500">
              This occasion box template is not available yet. Please try again later.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { subtotal, discountAmount, total, discount } = calculateTotal();
  const totalItems = getAllSelectedItems().length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div 
          className="p-6 text-white"
          style={{ backgroundColor: template.theme_color }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-2xl flex items-center gap-3">
              <span className="text-3xl">{template.icon}</span>
              {petName}&apos;s {template.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 mt-2">{template.description}</p>
          
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentStep && !showSummary
                    ? 'w-8 bg-white'
                    : idx < currentStep || showSummary
                    ? 'bg-white/80'
                    : 'bg-white/30'
                }`}
              />
            ))}
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                showSummary ? 'w-8 bg-white' : 'bg-white/30'
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {showSummary ? (
            /* Summary View */
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <PartyPopper className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold">Your Box Summary</h3>
              </div>
              
              {categories.map((cat) => {
                const items = selectedItems[cat.id] || [];
                if (items.length === 0) return null;
                
                return (
                  <div key={cat.id} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <span>{cat.icon}</span> {cat.name}
                    </h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span className="text-sm">{item.title || item.name}</span>
                          <span className="font-medium">₹{item.price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Pricing Summary */}
              <Card className="p-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Bundle Discount ({discount}%)</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span style={{ color: template.theme_color }}>
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            /* Category Step View */
            <div>
              {currentCategory && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-2xl">{currentCategory.icon}</span>
                        {currentCategory.name}
                        {currentCategory.required && (
                          <Badge variant="secondary" className="ml-2">Required</Badge>
                        )}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        {currentCategory.description}
                        <span className="ml-2 text-purple-600">
                          (Select {currentCategory.min_items}-{currentCategory.max_items} items)
                        </span>
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-lg px-3 py-1"
                      style={{ borderColor: template.theme_color, color: template.theme_color }}
                    >
                      {getCategoryItemCount(currentCategory.id)} selected
                    </Badge>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(products[currentCategory.id] || []).map((product) => {
                      const isSelected = isItemSelected(currentCategory.id, product.id);
                      
                      return (
                        <Card
                          key={product.id}
                          className={`cursor-pointer transition-all overflow-hidden ${
                            isSelected 
                              ? 'ring-2 ring-offset-2' 
                              : 'hover:shadow-md'
                          }`}
                          style={isSelected ? { ringColor: template.theme_color } : {}}
                          onClick={() => toggleItem(currentCategory.id, product)}
                        >
                          <div className="relative">
                            <img
                              src={product.image_url || product.images?.[0] || 'https://via.placeholder.com/200'}
                              alt={product.title || product.name}
                              className="w-full h-32 object-cover"
                            />
                            {isSelected && (
                              <div 
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: template.theme_color }}
                              >
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                            {product.is_featured && (
                              <Badge className="absolute top-2 left-2 bg-yellow-500">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {product.title || product.name}
                            </h4>
                            <p className="font-bold mt-1" style={{ color: template.theme_color }}>
                              ₹{product.price?.toLocaleString()}
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                    
                    {(products[currentCategory.id] || []).length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No products available in this category yet.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrev}
            disabled={currentStep === 0 && !showSummary}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              {totalItems} items • ₹{total.toLocaleString()}
            </p>
            {discount > 0 && totalItems > 0 && (
              <p className="text-xs text-green-600">
                Saving ₹{discountAmount.toLocaleString()} with bundle!
              </p>
            )}
          </div>

          {showSummary ? (
            <Button
              onClick={handleAddAllToCart}
              className="text-white"
              style={{ backgroundColor: template.theme_color }}
              disabled={totalItems === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add All to Cart
            </Button>
          ) : (
            <Button
              onClick={goToNext}
              className="text-white"
              style={{ backgroundColor: template.theme_color }}
              disabled={currentCategory?.required && !canProceed()}
            >
              {currentStep === categories.length - 1 ? 'Review Box' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OccasionBoxBuilder;
