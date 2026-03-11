/**
 * ProductImageManager.jsx
 * Admin component for managing product images
 * - View products with missing images
 * - Generate AI images for products
 * - Bulk update product images
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { API_URL } from '../../utils/api';
import {
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Check,
  X,
  Wand2,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const ProductImageManager = ({ authHeader }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [missingProducts, setMissingProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalMissing, setTotalMissing] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const ITEMS_PER_PAGE = 20;

  // Fetch image stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/image-stats`, {
        headers: authHeader
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch products with missing images
  const fetchMissingProducts = async (page = 0) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/products/missing-images?skip=${page * ITEMS_PER_PAGE}&limit=${ITEMS_PER_PAGE}`,
        { headers: authHeader }
      );
      if (res.ok) {
        const data = await res.json();
        setMissingProducts(data.products);
        setTotalMissing(data.total_missing);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMissingProducts(0);
  }, []);

  // Update a product's image
  const updateProductImage = async (productId, imageUrl) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/update-image`, {
        method: 'PUT',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId, image_url: imageUrl })
      });
      
      if (res.ok) {
        toast.success('Image updated successfully');
        fetchStats();
        fetchMissingProducts(currentPage);
      } else {
        toast.error('Failed to update image');
      }
    } catch (err) {
      toast.error('Error updating image');
    }
  };

  // Generate prompt for a product
  const getImagePrompt = (productName) => {
    const name = productName.toLowerCase();
    
    // Category-specific prompts
    if (name.includes('treat') || name.includes('snack') || name.includes('biscuit')) {
      return `Dog treats pack, ${productName}, premium packaging with happy dog illustration, natural ingredients, clean white background, product photography, realistic`;
    }
    if (name.includes('food') || name.includes('meal') || name.includes('kibble')) {
      return `Premium dog food bag, ${productName}, nutritious formula, attractive packaging design, clean white background, product photography, realistic`;
    }
    if (name.includes('toy') || name.includes('ball') || name.includes('chew')) {
      return `Dog toy, ${productName}, durable and colorful, pet-safe materials, clean white background, product photography, realistic`;
    }
    if (name.includes('bed') || name.includes('mat') || name.includes('blanket')) {
      return `Cozy dog bed or blanket, ${productName}, soft and comfortable, premium quality, clean white background, product photography, realistic`;
    }
    if (name.includes('collar') || name.includes('leash') || name.includes('harness')) {
      return `Dog collar or leash, ${productName}, adjustable and durable, stylish design, clean white background, product photography, realistic`;
    }
    if (name.includes('bowl') || name.includes('feeder') || name.includes('water')) {
      return `Dog bowl or feeder, ${productName}, modern design, pet-safe materials, clean white background, product photography, realistic`;
    }
    if (name.includes('shampoo') || name.includes('grooming') || name.includes('brush')) {
      return `Dog grooming product, ${productName}, professional quality, clean white background, product photography, realistic`;
    }
    if (name.includes('folder') || name.includes('document') || name.includes('adoption')) {
      return `Elegant pet document folder, ${productName}, premium leather-look cover with paw print emboss, professional organizer for pet papers, clean white background, product photography, realistic`;
    }
    if (name.includes('supplement') || name.includes('vitamin') || name.includes('health')) {
      return `Pet health supplement bottle, ${productName}, veterinary grade, professional packaging, clean white background, product photography, realistic`;
    }
    if (name.includes('carrier') || name.includes('crate') || name.includes('travel')) {
      return `Pet carrier or crate, ${productName}, comfortable and secure, travel-friendly design, clean white background, product photography, realistic`;
    }
    
    // Default prompt
    return `Premium pet product, ${productName}, high quality, attractive packaging, clean white background, product photography, realistic`;
  };

  const filteredProducts = searchQuery
    ? missingProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : missingProducts;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-700">{stats?.total_products || 0}</p>
            </div>
            <ImageIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Images</p>
              <p className="text-2xl font-bold text-green-700">{stats?.with_images || 0}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Missing Images</p>
              <p className="text-2xl font-bold text-red-700">{stats?.missing_images || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI Generated</p>
              <p className="text-2xl font-bold text-purple-700">{stats?.ai_generated_images || 0}</p>
            </div>
            <Wand2 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>
      
      {/* Coverage Progress */}
      {stats && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Image Coverage</span>
            <span className="text-sm text-gray-600">{stats.coverage_percentage}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500"
              style={{ width: `${stats.coverage_percentage}%` }}
            />
          </div>
        </Card>
      )}
      
      {/* Search and Actions */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => fetchMissingProducts(currentPage)} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Products List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold">Products Missing Images ({totalMissing})</h3>
          <p className="text-sm text-gray-500">Generate AI images or manually add URLs</p>
        </div>
        
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="divide-y">
            {filteredProducts.map((product, idx) => (
              <div key={product.id || idx} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <div className="flex gap-2 mt-1">
                    {product.category && (
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    )}
                    {product.pillar && (
                      <Badge variant="secondary" className="text-xs">{product.pillar}</Badge>
                    )}
                    {product.price && (
                      <span className="text-xs text-gray-500">₹{product.price}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const prompt = getImagePrompt(product.name);
                      navigator.clipboard.writeText(prompt);
                      toast.success('Prompt copied to clipboard');
                    }}
                  >
                    Copy Prompt
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const url = prompt('Enter image URL:');
                      if (url) {
                        updateProductImage(product.id, url);
                      }
                    }}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Add URL
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalMissing)} of {totalMissing}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => fetchMissingProducts(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={(currentPage + 1) * ITEMS_PER_PAGE >= totalMissing}
              onClick={() => fetchMissingProducts(currentPage + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Generated Images Library */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Recently Generated AI Images</h3>
        <p className="text-sm text-gray-500 mb-4">
          These images were generated using AI. Click to copy URL and assign to products.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Add generated images here - this would be populated from state/props */}
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            No images yet
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductImageManager;
