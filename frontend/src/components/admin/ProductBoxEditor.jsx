/**
 * Product Box Editor - Comprehensive 6-Tab Editor
 * Handles all product configuration in a structured manner
 */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { 
  Package, Save, X, Loader2, Sparkles, AlertTriangle, Check,
  ImagePlus, DollarSign, Truck, Shield, Bot, Tag, Gift, Eye, RefreshCw
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import {
  ALL_PILLARS, PRODUCT_TYPES, LIFE_STAGES, SIZE_OPTIONS, ENERGY_LEVELS,
  CHEW_STRENGTHS, PLAY_TYPES, COAT_TYPES, COMMON_AVOIDS, MATERIAL_SAFETY_FLAGS,
  OCCASIONS, USE_CASE_TAGS, QUALITY_TIERS, INVENTORY_STATUS, DELIVERY_TYPES,
  APPROVAL_STATUS, CITIES, MAIN_CATEGORIES
} from './ProductBoxConfig';

// Multi-select checkbox component
const MultiSelect = ({ options, selected = [], onChange, columns = 3 }) => (
  <div className={`grid grid-cols-${columns} gap-2`}>
    {options.map(opt => (
      <label key={opt.id || opt} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
        <input
          type="checkbox"
          checked={selected.includes(opt.id || opt)}
          onChange={(e) => {
            const id = opt.id || opt;
            if (e.target.checked) {
              onChange([...selected, id]);
            } else {
              onChange(selected.filter(s => s !== id));
            }
          }}
          className="rounded border-gray-300"
        />
        <span className="text-sm">{opt.icon || ''} {opt.name || opt}</span>
      </label>
    ))}
  </div>
);

// Breed Auto-Suggest Multi-Select with search
const BreedAutoSuggest = ({ breeds, selected = [], onChange }) => {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  // Filter breeds based on search
  const filteredBreeds = search 
    ? breeds.filter(b => 
        (b.name || b).toLowerCase().includes(search.toLowerCase())
      )
    : breeds;
  
  // Show limited results unless expanded
  const displayBreeds = showAll ? filteredBreeds : filteredBreeds.slice(0, 20);
  
  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search breeds... (e.g., Labrador, Corgi)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Selected Breeds Pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-purple-50 rounded-lg">
          {selected.map(breed => (
            <span 
              key={breed}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
            >
              {breed}
              <button 
                onClick={() => onChange(selected.filter(s => s !== breed))}
                className="hover:text-purple-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Breed Grid */}
      <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
        <div className="grid grid-cols-3 gap-1">
          {displayBreeds.map(breed => {
            const breedName = breed.name || breed;
            const isSelected = selected.includes(breedName);
            return (
              <label 
                key={breedName}
                className={`flex items-center gap-2 cursor-pointer p-1.5 rounded text-sm ${
                  isSelected ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selected, breedName]);
                    } else {
                      onChange(selected.filter(s => s !== breedName));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="truncate">{breedName}</span>
              </label>
            );
          })}
        </div>
        
        {filteredBreeds.length > 20 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-2 py-1 text-sm text-purple-600 hover:text-purple-700"
          >
            Show all {filteredBreeds.length} breeds...
          </button>
        )}
        
        {filteredBreeds.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">
            No breeds found matching &quot;{search}&quot;
          </p>
        )}
      </div>
    </div>
  );
};

// Section header
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b">
    {Icon && <Icon className="w-4 h-4 text-purple-500" />}
    <div>
      <h4 className="font-medium text-gray-900">{title}</h4>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

const ProductBoxEditor = ({ 
  product, 
  setProduct, 
  open, 
  onClose, 
  onSave, 
  saving,
  onGenerateMiraHint 
}) => {
  const [activeTab, setActiveTab] = useState('basics');
  const [dogBreeds, setDogBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Handle image upload to Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, or WebP images');
      return;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const isExistingProduct = product?.id && !product.id.startsWith('NEW-');
      const uploadUrl = isExistingProduct
        ? `${API_URL}/api/admin/product/${product.id}/upload-image`
        : `${API_URL}/api/upload/product-image`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the product with the new Cloudinary URL
        updateField('media.primary_image', data.url);
        updateField('media.images', [data.url]);
        updateField('image', data.url);
        updateField('image_url', data.url);
        updateField('images', [data.url]);
        updateField('thumbnail', data.url);
        alert(isExistingProduct
          ? 'Image uploaded to Cloudinary successfully! Image is now linked to this product and will persist.'
          : 'Image uploaded to Cloudinary successfully! Save the product to keep this image linked.');
      } else {
        const err = await response.json();
        alert('Upload failed: ' + (err.detail || 'Unknown error'));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Fetch breeds dynamically from breed manager
  useEffect(() => {
    const fetchBreeds = async () => {
      setLoadingBreeds(true);
      try {
        const response = await fetch(`${API_URL}/api/admin/breed-tags/options`);
        if (response.ok) {
          const data = await response.json();
          setDogBreeds(data.breeds || []);
        }
      } catch (err) {
        console.error('Failed to fetch breeds:', err);
      } finally {
        setLoadingBreeds(false);
      }
    };
    
    if (open) {
      fetchBreeds();
    }
  }, [open]);
  
  if (!product) return null;
  
  // Helper to update nested fields
  const updateField = (path, value) => {
    const keys = path.split('.');
    const newProduct = JSON.parse(JSON.stringify(product));
    let current = newProduct;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setProduct(newProduct);
  };
  
  // Get nested value
  const getValue = (path, defaultValue = '') => {
    const keys = path.split('.');
    let current = product;
    for (const key of keys) {
      if (current === undefined || current === null) return defaultValue;
      current = current[key];
    }
    return current ?? defaultValue;
  };
  
  // Calculate margin
  const calculateMargin = () => {
    const selling = getValue('commerce_ops.pricing.selling_price', 0);
    const cost = getValue('commerce_ops.pricing.cost_price', 0);
    if (cost > 0) {
      const margin = ((selling - cost) / cost) * 100;
      updateField('commerce_ops.pricing.margin_percent', Math.round(margin * 100) / 100);
      
      let band = 'unknown';
      if (margin < 20) band = 'low';
      else if (margin < 40) band = 'medium';
      else if (margin < 60) band = 'high';
      else band = 'premium';
      updateField('commerce_ops.pricing.margin_band', band);
    }
  };
  
  const isNew = !product.id || product.id?.startsWith('NEW-');
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            {isNew ? 'Create New Product' : 'Edit Product'}
            {product.basics?.name && (
              <Badge variant="outline" className="ml-2">{product.basics.name}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="basics" className="text-xs">
              <Package className="w-3 h-3 mr-1" /> Basics
            </TabsTrigger>
            <TabsTrigger value="suitability" className="text-xs">
              <Shield className="w-3 h-3 mr-1" /> Suitability
            </TabsTrigger>
            <TabsTrigger value="pillars" className="text-xs">
              <Tag className="w-3 h-3 mr-1" /> Pillars
            </TabsTrigger>
            <TabsTrigger value="commerce" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" /> Commerce
            </TabsTrigger>
            <TabsTrigger value="media" className="text-xs">
              <ImagePlus className="w-3 h-3 mr-1" /> Media
            </TabsTrigger>
            <TabsTrigger value="mira" className="text-xs">
              <Bot className="w-3 h-3 mr-1" /> Mira AI
            </TabsTrigger>
          </TabsList>
          
          {/* TAB 1: BASICS */}
          <TabsContent value="basics" className="space-y-4 mt-4">
            <SectionHeader icon={Package} title="Product Identity" subtitle="Basic product information" />
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input 
                  value={getValue('basics.name', '') || getValue('name', '')}
                  onChange={(e) => {
                    updateField('basics.name', e.target.value);
                    updateField('name', e.target.value);
                  }}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input 
                  value={getValue('basics.display_name', '')}
                  onChange={(e) => updateField('basics.display_name', e.target.value)}
                  placeholder="Short name for cards"
                />
              </div>
              <div>
                <Label>Product Type</Label>
                <select 
                  value={getValue('basics.product_type', 'physical') || getValue('product_type', 'physical')}
                  onChange={(e) => {
                    updateField('basics.product_type', e.target.value);
                    updateField('product_type', e.target.value);
                  }}
                  className="w-full h-10 px-3 rounded-md border border-gray-200"
                >
                  {PRODUCT_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>SKU</Label>
                <Input 
                  value={getValue('basics.sku', '') || getValue('sku', '')}
                  onChange={(e) => {
                    updateField('basics.sku', e.target.value);
                    updateField('sku', e.target.value);
                  }}
                  placeholder="SKU-XXX-001"
                />
              </div>
              <div>
                <Label>Barcode (UPC/EAN)</Label>
                <Input 
                  value={getValue('basics.barcode', '')}
                  onChange={(e) => updateField('basics.barcode', e.target.value)}
                  placeholder="Barcode"
                />
              </div>
              <div>
                <Label>Brand</Label>
                <Input 
                  value={getValue('basics.brand', '') || getValue('brand', '')}
                  onChange={(e) => updateField('basics.brand', e.target.value)}
                  placeholder="Brand name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vendor / Supplier</Label>
                <Input 
                  value={getValue('basics.vendor', '')}
                  onChange={(e) => updateField('basics.vendor', e.target.value)}
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <Label>Country of Origin</Label>
                <Input 
                  value={getValue('basics.country_of_origin', 'India')}
                  onChange={(e) => updateField('basics.country_of_origin', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
            
            <div>
              <Label>Short Description (for cards)</Label>
              <Input 
                value={getValue('basics.short_description', '') || getValue('short_description', '')}
                onChange={(e) => updateField('basics.short_description', e.target.value)}
                placeholder="100-140 characters for product cards"
                maxLength={140}
              />
              <p className="text-xs text-gray-400 mt-1">
                {(getValue('basics.short_description', '') || '').length}/140
              </p>
            </div>
            
            <div>
              <Label>Full Description</Label>
              <Textarea 
                value={getValue('basics.long_description', '') || getValue('description', '')}
                onChange={(e) => {
                  updateField('basics.long_description', e.target.value);
                  updateField('description', e.target.value);
                }}
                placeholder="Detailed product description"
                rows={4}
              />
            </div>
            
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2">
                <Switch 
                  checked={getValue('basics.is_bakery_product', false) || getValue('is_bakery_product', false)}
                  onCheckedChange={(v) => {
                    updateField('basics.is_bakery_product', v);
                    updateField('is_bakery_product', v);
                  }}
                />
                <span className="text-sm">🎂 Bakery Division Product</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch 
                  checked={getValue('basics.is_service', false)}
                  onCheckedChange={(v) => updateField('basics.is_service', v)}
                />
                <span className="text-sm">🛠️ Is Service</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch 
                  checked={getValue('basics.is_bundle', false)}
                  onCheckedChange={(v) => updateField('basics.is_bundle', v)}
                />
                <span className="text-sm">📦 Is Bundle</span>
              </label>
            </div>
          </TabsContent>
          
          {/* TAB 2: SUITABILITY */}
          <TabsContent value="suitability" className="space-y-6 mt-4">
            {/* Pet Filters */}
            <Card className="p-4">
              <SectionHeader icon={Shield} title="Pet Filters" subtitle="Who is this product for?" />
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Life Stages</Label>
                  <MultiSelect 
                    options={LIFE_STAGES}
                    selected={getValue('suitability.pet_filters.life_stages', ['all'])}
                    onChange={(v) => updateField('suitability.pet_filters.life_stages', v)}
                    columns={4}
                  />
                </div>
                
                <div>
                  <Label className="mb-2 block">Size Suitability</Label>
                  <MultiSelect 
                    options={SIZE_OPTIONS}
                    selected={getValue('suitability.pet_filters.size_options', ['all'])}
                    onChange={(v) => updateField('suitability.pet_filters.size_options', v)}
                    columns={6}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Weight Range (kg)</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number"
                        value={getValue('suitability.pet_filters.weight_range_min_kg', '')}
                        onChange={(e) => updateField('suitability.pet_filters.weight_range_min_kg', parseFloat(e.target.value) || null)}
                        placeholder="Min"
                        className="w-24"
                      />
                      <span>to</span>
                      <Input 
                        type="number"
                        value={getValue('suitability.pet_filters.weight_range_max_kg', '')}
                        onChange={(e) => updateField('suitability.pet_filters.weight_range_max_kg', parseFloat(e.target.value) || null)}
                        placeholder="Max"
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">kg</span>
                    </div>
                  </div>
                  <div>
                    <Label>Breed Applicability</Label>
                    <select 
                      value={getValue('suitability.pet_filters.breed_applicability', 'all')}
                      onChange={(e) => updateField('suitability.pet_filters.breed_applicability', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-200"
                    >
                      <option value="all">All Breeds</option>
                      <option value="selected">Selected Breeds Only</option>
                    </select>
                  </div>
                </div>
                
                {getValue('suitability.pet_filters.breed_applicability') === 'selected' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Applicable Breeds</Label>
                      {loadingBreeds && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
                      <span className="text-xs text-gray-500">{dogBreeds.length} breeds available</span>
                    </div>
                    <BreedAutoSuggest 
                      breeds={dogBreeds}
                      selected={getValue('suitability.pet_filters.applicable_breeds', [])}
                      onChange={(v) => updateField('suitability.pet_filters.applicable_breeds', v)}
                    />
                  </div>
                )}
              </div>
            </Card>
            
            {/* Behavior & Play */}
            <Card className="p-4">
              <SectionHeader title="Behavior & Play Style" subtitle="Activity and behavior matching" />
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Energy Level Match</Label>
                  <MultiSelect 
                    options={ENERGY_LEVELS}
                    selected={getValue('suitability.behavior.energy_level_match', ['all'])}
                    onChange={(v) => updateField('suitability.behavior.energy_level_match', v)}
                    columns={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Chew Strength (for toys)</Label>
                    <select 
                      value={getValue('suitability.behavior.chew_strength', '')}
                      onChange={(e) => updateField('suitability.behavior.chew_strength', e.target.value || null)}
                      className="w-full h-10 px-3 rounded-md border border-gray-200"
                    >
                      <option value="">Not applicable</option>
                      {CHEW_STRENGTHS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Play Types</Label>
                  <MultiSelect 
                    options={PLAY_TYPES}
                    selected={getValue('suitability.behavior.play_types', [])}
                    onChange={(v) => updateField('suitability.behavior.play_types', v)}
                    columns={4}
                  />
                </div>
                
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.behavior.indoor_suitable', true)}
                      onCheckedChange={(v) => updateField('suitability.behavior.indoor_suitable', v)}
                    />
                    <span className="text-sm">🏠 Indoor Suitable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.behavior.outdoor_suitable', true)}
                      onCheckedChange={(v) => updateField('suitability.behavior.outdoor_suitable', v)}
                    />
                    <span className="text-sm">🌳 Outdoor Suitable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.behavior.water_safe', false)}
                      onCheckedChange={(v) => updateField('suitability.behavior.water_safe', v)}
                    />
                    <span className="text-sm">💧 Water Safe</span>
                  </label>
                </div>
              </div>
            </Card>
            
            {/* Physical Traits */}
            <Card className="p-4">
              <SectionHeader title="Physical Traits" subtitle="Body type and special needs" />
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Coat Type Match</Label>
                  <MultiSelect 
                    options={COAT_TYPES}
                    selected={getValue('suitability.physical_traits.coat_type_match', [])}
                    onChange={(v) => updateField('suitability.physical_traits.coat_type_match', v)}
                    columns={6}
                  />
                </div>
                
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.physical_traits.brachycephalic_friendly', true)}
                      onCheckedChange={(v) => updateField('suitability.physical_traits.brachycephalic_friendly', v)}
                    />
                    <span className="text-sm">🐕 Flat-face friendly</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.physical_traits.senior_friendly', true)}
                      onCheckedChange={(v) => updateField('suitability.physical_traits.senior_friendly', v)}
                    />
                    <span className="text-sm">👴 Senior Friendly</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.physical_traits.puppy_safe', true)}
                      onCheckedChange={(v) => updateField('suitability.physical_traits.puppy_safe', v)}
                    />
                    <span className="text-sm">🐶 Puppy Safe</span>
                  </label>
                </div>
              </div>
            </Card>
            
            {/* Safety & Allergies */}
            <Card className="p-4">
              <SectionHeader icon={AlertTriangle} title="Safety & Allergies" subtitle="Important safety information" />
              
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('suitability.safety.allergy_aware', false)}
                    onCheckedChange={(v) => updateField('suitability.safety.allergy_aware', v)}
                  />
                  <span className="text-sm font-medium">⚠️ This product is allergy-aware</span>
                </label>
                
                <div>
                  <Label className="mb-2 block">Common Avoids (Allergens)</Label>
                  <MultiSelect 
                    options={COMMON_AVOIDS}
                    selected={getValue('suitability.safety.common_avoids', [])}
                    onChange={(v) => updateField('suitability.safety.common_avoids', v)}
                    columns={4}
                  />
                </div>
                
                <div>
                  <Label className="mb-2 block">Material Safety Flags</Label>
                  <MultiSelect 
                    options={MATERIAL_SAFETY_FLAGS}
                    selected={getValue('suitability.safety.material_safety_flags', [])}
                    onChange={(v) => updateField('suitability.safety.material_safety_flags', v)}
                    columns={4}
                  />
                </div>
                
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.safety.is_grain_free', false)}
                      onCheckedChange={(v) => updateField('suitability.safety.is_grain_free', v)}
                    />
                    <span className="text-sm">🌾 Grain Free</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.safety.is_single_protein', false)}
                      onCheckedChange={(v) => updateField('suitability.safety.is_single_protein', v)}
                    />
                    <span className="text-sm">🥩 Single Protein</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.safety.is_vegetarian', false)}
                      onCheckedChange={(v) => updateField('suitability.safety.is_vegetarian', v)}
                    />
                    <span className="text-sm">🥬 Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('suitability.safety.is_human_grade', false)}
                      onCheckedChange={(v) => updateField('suitability.safety.is_human_grade', v)}
                    />
                    <span className="text-sm">✨ Human Grade</span>
                  </label>
                </div>
                
                <div>
                  <Label>Safety Notes</Label>
                  <Textarea 
                    value={getValue('suitability.safety.safety_notes', '')}
                    onChange={(e) => updateField('suitability.safety.safety_notes', e.target.value)}
                    placeholder="Any special safety instructions..."
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* TAB 3: PILLARS & OCCASIONS */}
          <TabsContent value="pillars" className="space-y-6 mt-4">
            <Card className="p-4">
              <SectionHeader icon={Tag} title="Pillar Mapping" subtitle="Which pillars does this product belong to?" />
              
              <div className="space-y-4">
                <div>
                  <Label>Primary Pillar *</Label>
                  <select 
                    value={getValue('pillars_occasions.pillar.primary_pillar', 'shop') || getValue('primary_pillar', 'shop')}
                    onChange={(e) => {
                      updateField('pillars_occasions.pillar.primary_pillar', e.target.value);
                      updateField('primary_pillar', e.target.value);
                    }}
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                  >
                    {ALL_PILLARS.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label className="mb-2 block">Secondary Pillars (Cross-pillar applicability)</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {ALL_PILLARS.map(p => (
                      <label 
                        key={p.id}
                        className={`flex flex-col items-center p-2 rounded-lg cursor-pointer border-2 transition-all ${
                          getValue('pillars_occasions.pillar.secondary_pillars', []).includes(p.id) || getValue('pillars', []).includes(p.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={getValue('pillars_occasions.pillar.secondary_pillars', []).includes(p.id) || getValue('pillars', []).includes(p.id)}
                          onChange={(e) => {
                            const current = getValue('pillars_occasions.pillar.secondary_pillars', []) || getValue('pillars', []);
                            const newVal = e.target.checked 
                              ? [...current, p.id]
                              : current.filter(x => x !== p.id);
                            updateField('pillars_occasions.pillar.secondary_pillars', newVal);
                            updateField('pillars', newVal);
                          }}
                        />
                        <span className="text-xl">{p.icon}</span>
                        <span className="text-xs mt-1">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <SectionHeader title="Occasions" subtitle="When is this product relevant?" />
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Applicable Occasions</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {OCCASIONS.map(o => (
                      <label 
                        key={o.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-all ${
                          getValue('pillars_occasions.occasion.occasions', []).includes(o.id)
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={getValue('pillars_occasions.occasion.occasions', []).includes(o.id)}
                          onChange={(e) => {
                            const current = getValue('pillars_occasions.occasion.occasions', []);
                            const newVal = e.target.checked 
                              ? [...current, o.id]
                              : current.filter(x => x !== o.id);
                            updateField('pillars_occasions.occasion.occasions', newVal);
                          }}
                        />
                        <span>{o.icon}</span>
                        <span className="text-sm">{o.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <SectionHeader title="Use Cases" subtitle="How is this product used?" />
              
              <div className="grid grid-cols-3 gap-2">
                {USE_CASE_TAGS.map(u => (
                  <label 
                    key={u.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-all ${
                      getValue('pillars_occasions.use_case.use_case_tags', []).includes(u.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={getValue('pillars_occasions.use_case.use_case_tags', []).includes(u.id)}
                      onChange={(e) => {
                        const current = getValue('pillars_occasions.use_case.use_case_tags', []);
                        const newVal = e.target.checked 
                          ? [...current, u.id]
                          : current.filter(x => x !== u.id);
                        updateField('pillars_occasions.use_case.use_case_tags', newVal);
                      }}
                    />
                    <span>{u.icon}</span>
                    <span className="text-sm">{u.name}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('pillars_occasions.use_case.is_giftable', false)}
                    onCheckedChange={(v) => updateField('pillars_occasions.use_case.is_giftable', v)}
                  />
                  <span className="text-sm">🎁 Giftable</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('pillars_occasions.use_case.gift_wrap_available', false)}
                    onCheckedChange={(v) => updateField('pillars_occasions.use_case.gift_wrap_available', v)}
                  />
                  <span className="text-sm">🎀 Gift Wrap Available</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('pillars_occasions.use_case.subscription_friendly', false)}
                    onCheckedChange={(v) => updateField('pillars_occasions.use_case.subscription_friendly', v)}
                  />
                  <span className="text-sm">🔄 Subscription Friendly</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('pillars_occasions.use_case.travel_friendly', false)}
                    onCheckedChange={(v) => updateField('pillars_occasions.use_case.travel_friendly', v)}
                  />
                  <span className="text-sm">✈️ Travel Friendly</span>
                </label>
              </div>
            </Card>
            
            {/* 🎂 Cake/Bakery Config - Shape for Celebrate filters */}
            <Card className="p-4 bg-pink-50/50 border-pink-200">
              <SectionHeader 
                title="🎂 Cake & Bakery Config" 
                subtitle="Shape and customization options (used for Celebrate page filters)" 
              />
              
              <div className="space-y-4">
                <div>
                  <Label className="text-pink-700 font-medium">Cake Shape</Label>
                  <select
                    value={getValue('pillars_occasions.cake_bakery.shape', '') || getValue('shape', '')}
                    onChange={(e) => {
                      updateField('pillars_occasions.cake_bakery.shape', e.target.value);
                      updateField('shape', e.target.value);
                    }}
                    className="w-full h-10 px-3 rounded-md border border-pink-200 bg-white"
                  >
                    <option value="">-- Select Shape --</option>
                    <option value="paw">🐾 Paw Shape</option>
                    <option value="bone">🦴 Bone Shape</option>
                    <option value="heart">💜 Heart Shape</option>
                    <option value="round">⭕ Round/Circle</option>
                    <option value="square">⬜ Square</option>
                    <option value="star">⭐ Star Shape</option>
                    <option value="number">🔢 Number Cake</option>
                    <option value="donut">🍩 Donut Shape</option>
                    <option value="silhouette">🐕 Breed Silhouette</option>
                    <option value="custom">✨ Custom Shape</option>
                  </select>
                  <p className="text-xs text-pink-500 mt-1">
                    Used for shape filters on the Celebrate page (paw, bone, heart, etc.)
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('pillars_occasions.cake_bakery.photo_printable', false)}
                      onCheckedChange={(v) => updateField('pillars_occasions.cake_bakery.photo_printable', v)}
                    />
                    <span className="text-sm">📸 Photo Printable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('pillars_occasions.cake_bakery.name_printable', true)}
                      onCheckedChange={(v) => updateField('pillars_occasions.cake_bakery.name_printable', v)}
                    />
                    <span className="text-sm">✏️ Name Printable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('pillars_occasions.cake_bakery.is_breed_cake', false)}
                      onCheckedChange={(v) => updateField('pillars_occasions.cake_bakery.is_breed_cake', v)}
                    />
                    <span className="text-sm">🐕 Breed-Specific Cake</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('pillars_occasions.cake_bakery.shape_customizable', false)}
                      onCheckedChange={(v) => updateField('pillars_occasions.cake_bakery.shape_customizable', v)}
                    />
                    <span className="text-sm">✨ Custom Shape Available</span>
                  </label>
                </div>
                
                {getValue('pillars_occasions.cake_bakery.is_breed_cake', false) && (
                  <div>
                    <Label className="text-pink-700">Breed For (if breed cake)</Label>
                    <Input 
                      value={getValue('pillars_occasions.cake_bakery.breed_for', '')}
                      onChange={(e) => updateField('pillars_occasions.cake_bakery.breed_for', e.target.value)}
                      placeholder="e.g., Shih Tzu, Labrador, Golden Retriever"
                      className="border-pink-200"
                    />
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
          
          {/* TAB 4: COMMERCE & OPS */}
          <TabsContent value="commerce" className="space-y-6 mt-4">
            {/* Categorization */}
            <Card className="p-4">
              <SectionHeader title="Categorization" />
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <select 
                    value={getValue('commerce_ops.category', '') || getValue('category', '')}
                    onChange={(e) => {
                      updateField('commerce_ops.category', e.target.value);
                      updateField('category', e.target.value);
                    }}
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                  >
                    <option value="">Select category</option>
                    {MAIN_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Subcategory</Label>
                  <Input 
                    value={getValue('commerce_ops.subcategory', '') || getValue('subcategory', '')}
                    onChange={(e) => updateField('commerce_ops.subcategory', e.target.value)}
                    placeholder="Subcategory"
                  />
                </div>
                <div>
                  <Label>Quality Tier</Label>
                  <select 
                    value={getValue('commerce_ops.quality_tier', 'standard')}
                    onChange={(e) => updateField('commerce_ops.quality_tier', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                  >
                    {QUALITY_TIERS.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
            
            {/* Pricing */}
            <Card className="p-4">
              <SectionHeader icon={DollarSign} title="Pricing" subtitle="Price configuration and margins" />
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>MRP (₹) *</Label>
                  <Input 
                    type="number"
                    value={getValue('commerce_ops.pricing.mrp', 0) || getValue('mrp', 0)}
                    onChange={(e) => {
                      updateField('commerce_ops.pricing.mrp', parseFloat(e.target.value) || 0);
                      updateField('mrp', parseFloat(e.target.value) || 0);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Selling Price (₹) *</Label>
                  <Input 
                    type="number"
                    value={getValue('commerce_ops.pricing.selling_price', 0) || getValue('price', 0)}
                    onChange={(e) => {
                      updateField('commerce_ops.pricing.selling_price', parseFloat(e.target.value) || 0);
                      updateField('price', parseFloat(e.target.value) || 0);
                      setTimeout(calculateMargin, 100);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Cost Price (₹)</Label>
                  <Input 
                    type="number"
                    value={getValue('commerce_ops.pricing.cost_price', '')}
                    onChange={(e) => {
                      updateField('commerce_ops.pricing.cost_price', parseFloat(e.target.value) || null);
                      setTimeout(calculateMargin, 100);
                    }}
                    placeholder="For margin calc"
                  />
                </div>
                <div>
                  <Label>Margin</Label>
                  <div className="h-10 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-between">
                    <span>{getValue('commerce_ops.pricing.margin_percent', '-')}%</span>
                    <Badge className={
                      getValue('commerce_ops.pricing.margin_band') === 'premium' ? 'bg-purple-100 text-purple-700' :
                      getValue('commerce_ops.pricing.margin_band') === 'high' ? 'bg-green-100 text-green-700' :
                      getValue('commerce_ops.pricing.margin_band') === 'medium' ? 'bg-blue-100 text-blue-700' :
                      getValue('commerce_ops.pricing.margin_band') === 'low' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }>
                      {getValue('commerce_ops.pricing.margin_band', 'unknown')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <Label>Compare At Price</Label>
                  <Input 
                    type="number"
                    value={getValue('commerce_ops.pricing.compare_at_price', '')}
                    onChange={(e) => updateField('commerce_ops.pricing.compare_at_price', parseFloat(e.target.value) || null)}
                    placeholder="Strike-through price"
                  />
                </div>
                <div>
                  <Label>GST Rate (%)</Label>
                  <select 
                    value={getValue('commerce_ops.pricing.gst_rate', 18)}
                    onChange={(e) => updateField('commerce_ops.pricing.gst_rate', parseFloat(e.target.value))}
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div>
                  <Label>HSN Code</Label>
                  <Input 
                    value={getValue('commerce_ops.pricing.hsn_code', '')}
                    onChange={(e) => updateField('commerce_ops.pricing.hsn_code', e.target.value)}
                    placeholder="HSN/SAC Code"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('commerce_ops.pricing.price_includes_gst', false)}
                      onCheckedChange={(v) => updateField('commerce_ops.pricing.price_includes_gst', v)}
                    />
                    <span className="text-sm">Price includes GST</span>
                  </label>
                </div>
              </div>
            </Card>
            
            {/* Inventory */}
            <Card className="p-4">
              <SectionHeader title="Inventory" subtitle="Stock management" />
              
              {/* Active Status Toggle - PROMINENT */}
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-purple-800 font-medium">Product Active Status</Label>
                    <p className="text-xs text-purple-600">Inactive products won't appear on the site</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${getValue('is_active', true) ? 'text-green-600' : 'text-red-500'}`}>
                      {getValue('is_active', true) ? '✓ Active' : '✗ Inactive'}
                    </span>
                    <Switch 
                      checked={getValue('is_active', true)}
                      onCheckedChange={(v) => updateField('is_active', v)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Status</Label>
                  <select 
                    value={getValue('commerce_ops.inventory.inventory_status', 'in_stock')}
                    onChange={(e) => {
                      updateField('commerce_ops.inventory.inventory_status', e.target.value);
                      updateField('in_stock', e.target.value === 'in_stock');
                    }}
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                  >
                    {INVENTORY_STATUS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input 
                    type="number"
                    value={getValue('commerce_ops.inventory.stock_quantity', '')}
                    onChange={(e) => updateField('commerce_ops.inventory.stock_quantity', parseInt(e.target.value) || null)}
                    placeholder="Quantity"
                  />
                </div>
                <div>
                  <Label>Low Stock Threshold</Label>
                  <Input 
                    type="number"
                    value={getValue('commerce_ops.inventory.low_stock_threshold', 5)}
                    onChange={(e) => updateField('commerce_ops.inventory.low_stock_threshold', parseInt(e.target.value) || 5)}
                    placeholder="5"
                  />
                </div>
                <div className="flex items-end pb-2 gap-4">
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('commerce_ops.inventory.track_inventory', false)}
                      onCheckedChange={(v) => updateField('commerce_ops.inventory.track_inventory', v)}
                    />
                    <span className="text-sm">Track Inventory</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-6 mt-3">
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('commerce_ops.inventory.is_perishable', false)}
                    onCheckedChange={(v) => updateField('commerce_ops.inventory.is_perishable', v)}
                  />
                  <span className="text-sm">🥛 Perishable</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('commerce_ops.inventory.allow_backorder', false)}
                    onCheckedChange={(v) => updateField('commerce_ops.inventory.allow_backorder', v)}
                  />
                  <span className="text-sm">Allow Backorder</span>
                </label>
              </div>
            </Card>
            
            {/* Fulfillment */}
            <Card className="p-4">
              <SectionHeader icon={Truck} title="Fulfillment" subtitle="Shipping and delivery" />
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Delivery Type</Label>
                  <select 
                    value={getValue('commerce_ops.fulfillment.delivery_type', 'ship')}
                    onChange={(e) => updateField('commerce_ops.fulfillment.delivery_type', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                  >
                    {DELIVERY_TYPES.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Return Window (days)</Label>
                  <Input 
                    type="number"
                    value={getValue('commerce_ops.fulfillment.return_window_days', 7)}
                    onChange={(e) => updateField('commerce_ops.fulfillment.return_window_days', parseInt(e.target.value) || 0)}
                    placeholder="7"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label className="mb-2 block">Available Cities</Label>
                <MultiSelect 
                  options={CITIES}
                  selected={getValue('commerce_ops.fulfillment.available_cities', [])}
                  onChange={(v) => {
                    updateField('commerce_ops.fulfillment.available_cities', v);
                    updateField('commerce_ops.fulfillment.is_pan_india', v.includes('pan_india'));
                  }}
                  columns={4}
                />
              </div>
              
              <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('commerce_ops.fulfillment.returnable', true)}
                    onCheckedChange={(v) => updateField('commerce_ops.fulfillment.returnable', v)}
                  />
                  <span className="text-sm">↩️ Returnable</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('commerce_ops.fulfillment.cold_chain_required', false)}
                    onCheckedChange={(v) => updateField('commerce_ops.fulfillment.cold_chain_required', v)}
                  />
                  <span className="text-sm">❄️ Cold Chain</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('commerce_ops.fulfillment.fragile', false)}
                    onCheckedChange={(v) => updateField('commerce_ops.fulfillment.fragile', v)}
                  />
                  <span className="text-sm">⚠️ Fragile</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch 
                    checked={getValue('commerce_ops.fulfillment.temperature_sensitive', false)}
                    onCheckedChange={(v) => updateField('commerce_ops.fulfillment.temperature_sensitive', v)}
                  />
                  <span className="text-sm">🌡️ Temp Sensitive</span>
                </label>
              </div>
            </Card>
            
            {/* Approval Status */}
            <Card className="p-4">
              <SectionHeader title="Approval & Visibility" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Approval Status</Label>
                  <select 
                    value={getValue('commerce_ops.approval_status', 'draft')}
                    onChange={(e) => updateField('commerce_ops.approval_status', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                  >
                    {APPROVAL_STATUS.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* TAB 5: MEDIA */}
          <TabsContent value="media" className="space-y-6 mt-4">
            <Card className="p-4">
              <SectionHeader icon={ImagePlus} title="Product Images" />
              
              {/* CLOUDINARY FILE UPLOAD - PRIMARY OPTION */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                <Label className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Upload Image File (Recommended - Persists through Deployments!)
                </Label>
                <p className="text-sm text-purple-600 mb-3">
                  Images uploaded here are stored in Cloudinary and will NOT be lost during redeployment.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-editor-image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="product-editor-image-upload"
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer transition-all text-white font-medium ${
                      uploadingImage
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Uploading to Cloudinary...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5" />
                        Choose Image File
                      </>
                    )}
                  </label>
                  <span className="text-sm text-gray-500">JPG, PNG, WebP (max 10MB)</span>
                </div>
                {(!product?.id || product?.id?.startsWith('NEW-')) && (
                  <p className="text-amber-600 text-sm mt-2 font-medium">
                    Upload now if you want — just save the product afterwards to keep the new image linked
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Image URL (or paste URL manually)</Label>
                  <Input 
                    value={getValue('media.primary_image', '') || getValue('image', '') || getValue('image_url', '')}
                    onChange={(e) => {
                      updateField('media.primary_image', e.target.value);
                      updateField('image', e.target.value);
                      updateField('image_url', e.target.value);
                      updateField('thumbnail', e.target.value);
                    }}
                    placeholder="https://..."
                  />
                  {(getValue('media.primary_image') || getValue('image') || getValue('image_url')) && (
                    <img 
                      src={getValue('media.primary_image') || getValue('image') || getValue('image_url')} 
                      alt="Primary"
                      className="mt-2 w-32 h-32 object-cover rounded border"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>
                <div>
                  <Label>Image Alt Text</Label>
                  <Input 
                    value={getValue('media.primary_image_alt', '')}
                    onChange={(e) => updateField('media.primary_image_alt', e.target.value)}
                    placeholder="Alt text for accessibility"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label>Additional Images (comma-separated URLs)</Label>
                <Textarea 
                  value={(getValue('media.images', []) || getValue('images', [])).join('\n')}
                  onChange={(e) => {
                    const urls = e.target.value.split('\n').filter(u => u.trim());
                    updateField('media.images', urls);
                    updateField('images', urls);
                  }}
                  placeholder="One URL per line"
                  rows={3}
                />
              </div>
              
              <div className="mt-4">
                <Label>Video URL</Label>
                <Input 
                  value={getValue('media.video_url', '')}
                  onChange={(e) => updateField('media.video_url', e.target.value)}
                  placeholder="YouTube or Vimeo URL"
                />
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Image Status:</span>{' '}
                  <Badge className={
                    getValue('media.image_completeness') === 'complete' ? 'bg-green-100 text-green-700' :
                    getValue('media.image_completeness') === 'partial' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {getValue('media.image_completeness', 'incomplete')} ({getValue('media.image_count', 0)} images)
                  </Badge>
                </p>
              </div>
            </Card>
          </TabsContent>
          
          {/* TAB 6: MIRA & AI */}
          <TabsContent value="mira" className="space-y-6 mt-4">
            <Card className="p-4">
              <SectionHeader icon={Bot} title="Mira Configuration" subtitle="AI recommendation settings" />
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('mira_ai.mira.mira_recommendable', true)}
                      onCheckedChange={(v) => updateField('mira_ai.mira.mira_recommendable', v)}
                    />
                    <span className="text-sm font-medium">🟢 Mira Recommendable (Kill Switch)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('mira_ai.mira.can_reference', true)}
                      onCheckedChange={(v) => updateField('mira_ai.mira.can_reference', v)}
                    />
                    <span className="text-sm">Can Reference</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('mira_ai.mira.can_suggest_proactively', false)}
                      onCheckedChange={(v) => updateField('mira_ai.mira.can_suggest_proactively', v)}
                    />
                    <span className="text-sm">Proactive Suggestions</span>
                  </label>
                </div>
                
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('mira_ai.mira.handled_by_mira', false)}
                      onCheckedChange={(v) => updateField('mira_ai.mira.handled_by_mira', v)}
                    />
                    <span className="text-sm">🤖 Handled by Mira (Service-like)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch 
                      checked={getValue('mira_ai.mira.requires_concierge', false)}
                      onCheckedChange={(v) => updateField('mira_ai.mira.requires_concierge', v)}
                    />
                    <span className="text-sm">🛎️ Requires Concierge</span>
                  </label>
                </div>
                
                <div>
                  <Label>Knowledge Confidence</Label>
                  <select 
                    value={getValue('mira_ai.mira.knowledge_confidence', 'high')}
                    onChange={(e) => updateField('mira_ai.mira.knowledge_confidence', e.target.value)}
                    className="w-48 h-10 px-3 rounded-md border border-gray-200"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <SectionHeader icon={Sparkles} title="AI Enrichment" subtitle="AI-generated content" />
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Mira Hint ✨</Label>
                    {onGenerateMiraHint && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onGenerateMiraHint(product)}
                        className="text-purple-600"
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Generate
                      </Button>
                    )}
                  </div>
                  <Textarea 
                    value={getValue('mira_ai.ai_enrichment.mira_hint', '') || getValue('mira_hint', '')}
                    onChange={(e) => {
                      updateField('mira_ai.ai_enrichment.mira_hint', e.target.value);
                      updateField('mira_hint', e.target.value);
                    }}
                    placeholder="✨ AI-generated soulful tip for this product..."
                    rows={2}
                  />
                  {getValue('mira_ai.ai_enrichment.mira_hint_generated_at') && (
                    <p className="text-xs text-gray-400 mt-1">
                      Generated: {new Date(getValue('mira_ai.ai_enrichment.mira_hint_generated_at')).toLocaleString()}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>Intelligent Tags (comma-separated)</Label>
                  <Input 
                    value={(getValue('mira_ai.ai_enrichment.intelligent_tags', []) || getValue('intelligent_tags', [])).join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                      updateField('mira_ai.ai_enrichment.intelligent_tags', tags);
                      updateField('intelligent_tags', tags);
                    }}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                
                <div>
                  <Label>Search Keywords</Label>
                  <Input 
                    value={(getValue('mira_ai.ai_enrichment.search_keywords', []) || getValue('search_keywords', [])).join(', ')}
                    onChange={(e) => {
                      const keywords = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                      updateField('mira_ai.ai_enrichment.search_keywords', keywords);
                      updateField('search_keywords', keywords);
                    }}
                    placeholder="keyword1, keyword2"
                  />
                </div>
              </div>
            </Card>
            
            {/* Breed Metadata Display */}
            {(getValue('mira_ai.ai_enrichment.breed_metadata') || getValue('breed_metadata')) && (
              <Card className="p-4">
                <SectionHeader title="Breed Metadata (AI-seeded)" />
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(getValue('mira_ai.ai_enrichment.breed_metadata') || getValue('breed_metadata'), null, 2)}
                </pre>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button onClick={onSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductBoxEditor;
