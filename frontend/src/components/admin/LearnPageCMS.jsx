/**
 * LearnPageCMS.jsx
 * Complete CMS for the Learn Page - Control EVERY section and sub-part
 * This is the TEMPLATE for all pillar page CMS systems
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { toast } from 'sonner';
import CloudinaryUploader from './CloudinaryUploader';
import { API_URL } from '../../utils/api';
import {
  Settings, Layout, BookOpen, Gift, ShoppingBag, Users,
  Save, Loader2, ChevronDown, ChevronRight, Plus, Trash2,
  GripVertical, Image, Video, Package, Briefcase, Eye, EyeOff,
  Search, Check, X, ArrowUp, ArrowDown, Sparkles, Edit2
} from 'lucide-react';

// ============== SECTION COMPONENTS ==============

// Topic Editor - Edit a single topic and its modal content
const TopicEditor = ({ topic, onUpdate, onDelete, availableProducts, availableServices }) => {
  const [expanded, setExpanded] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState(null);
  const [newSubtopic, setNewSubtopic] = useState('');
  const [newVideo, setNewVideo] = useState({ title: '', url: '' });
  const [productSearch, setProductSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const updateField = (field, value) => {
    onUpdate({ ...topic, [field]: value });
  };

  const addSubtopic = () => {
    if (!newSubtopic.trim()) return;
    const subtopics = [...(topic.subtopics || []), { 
      id: Date.now().toString(),
      title: newSubtopic,
      tip: ''
    }];
    updateField('subtopics', subtopics);
    setNewSubtopic('');
  };

  const removeSubtopic = (id) => {
    const subtopics = (topic.subtopics || []).filter(s => s.id !== id);
    updateField('subtopics', subtopics);
  };

  const addVideo = () => {
    if (!newVideo.url.trim()) return;
    // Extract video ID from YouTube URL
    const videoId = newVideo.url.includes('youtube.com') 
      ? newVideo.url.split('v=')[1]?.split('&')[0]
      : newVideo.url.includes('youtu.be')
        ? newVideo.url.split('/').pop()
        : newVideo.url;
    
    const videos = [...(topic.videos || []), {
      id: Date.now().toString(),
      videoId,
      title: newVideo.title || 'Video',
      url: newVideo.url
    }];
    updateField('videos', videos);
    setNewVideo({ title: '', url: '' });
  };

  const removeVideo = (id) => {
    const videos = (topic.videos || []).filter(v => v.id !== id);
    updateField('videos', videos);
  };

  const toggleProduct = (productId) => {
    const products = topic.products || [];
    if (products.includes(productId)) {
      updateField('products', products.filter(p => p !== productId));
    } else {
      updateField('products', [...products, productId]);
    }
  };

  const toggleService = (serviceId) => {
    const services = topic.services || [];
    if (services.includes(serviceId)) {
      updateField('services', services.filter(s => s !== serviceId));
    } else {
      updateField('services', [...services, serviceId]);
    }
  };

  const filteredProducts = availableProducts.filter(p => 
    !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredServices = availableServices.filter(s =>
    !serviceSearch || (s.name || '').toLowerCase().includes(serviceSearch.toLowerCase())
  );

  return (
    <Card className="p-4 mb-3 border-2 border-gray-200">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
              {topic.image ? (
                <img src={topic.image} alt="" className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                  <Image className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="text-left">
                <p className="font-medium">{topic.title || 'Untitled Topic'}</p>
                <p className="text-xs text-gray-500">
                  {(topic.subtopics || []).length} subtopics · 
                  {(topic.videos || []).length} videos · 
                  {(topic.products || []).length} products · 
                  {(topic.services || []).length} services
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input 
                value={topic.title || ''} 
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Topic title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug</label>
              <Input 
                value={topic.slug || ''} 
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder="topic-slug"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea 
              value={topic.description || ''} 
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          {/* Topic Image */}
          <div>
            <label className="text-sm font-medium mb-2 block">Topic Image</label>
            <CloudinaryUploader
              currentImageUrl={topic.image}
              onUploadComplete={(url) => updateField('image', url)}
              folder="learn-topics"
            />
          </div>

          {/* Subtopics */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Subtopics (shown in Overview tab)
            </label>
            <div className="space-y-2 mb-3">
              {(topic.subtopics || []).map((sub, idx) => (
                <div key={sub.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <span className="text-sm flex-1">{sub.title}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeSubtopic(sub.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                value={newSubtopic}
                onChange={(e) => setNewSubtopic(e.target.value)}
                placeholder="Add subtopic..."
                onKeyPress={(e) => e.key === 'Enter' && addSubtopic()}
              />
              <Button onClick={addSubtopic} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Videos */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Video className="w-4 h-4" /> Videos (shown in Videos tab)
            </label>
            <div className="space-y-2 mb-3">
              {(topic.videos || []).map((vid) => (
                <div key={vid.id} className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                  <Video className="w-4 h-4 text-blue-500" />
                  <span className="text-sm flex-1">{vid.title}</span>
                  <span className="text-xs text-gray-500">{vid.videoId}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeVideo(vid.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                value={newVideo.title}
                onChange={(e) => setNewVideo(v => ({ ...v, title: e.target.value }))}
                placeholder="Video title"
                className="w-1/3"
              />
              <Input 
                value={newVideo.url}
                onChange={(e) => setNewVideo(v => ({ ...v, url: e.target.value }))}
                placeholder="YouTube URL"
                className="flex-1"
              />
              <Button onClick={addVideo} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Products */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Package className="w-4 h-4" /> Products (shown in Products tab) 
              <Badge variant="outline">{(topic.products || []).length} selected</Badge>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-10"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
              {filteredProducts.slice(0, 20).map(product => {
                const isSelected = (topic.products || []).includes(product.id);
                return (
                  <div 
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                      isSelected ? 'bg-green-100 border border-green-400' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      isSelected ? 'bg-green-500 text-white' : 'bg-gray-200'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    {(product.image || product.image_url) && (
                      <img src={product.image || product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                    )}
                    <span className="text-sm flex-1 truncate">{product.name}</span>
                    <span className="text-xs text-gray-500">₹{product.price}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Services */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Services (shown in Services tab)
              <Badge variant="outline">{(topic.services || []).length} selected</Badge>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services..."
                className="pl-10"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
              {filteredServices.slice(0, 20).map(service => {
                const isSelected = (topic.services || []).includes(service.id);
                return (
                  <div 
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                      isSelected ? 'bg-blue-100 border border-blue-400' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm flex-1 truncate">{service.name}</span>
                    <span className="text-xs text-gray-500">₹{service.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// ============== MAIN CMS COMPONENT ==============

const LearnPageCMS = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Page configuration state
  const [pageConfig, setPageConfig] = useState({
    pillar: 'learn',
    title: 'Learning with Your Pet',
    subtitle: 'Expert guides, training tips, and resources',
    heroImage: '',
    themeColor: '#f59e0b', // amber
    sections: {
      topics: { enabled: true, title: 'What would you like to learn?' },
      bundles: { enabled: true, title: "Training Bundles", maxItems: 4 },
      products: { enabled: true, title: 'Training Products', maxItems: 10 },
      services: { enabled: true, title: 'Training Services' },
      personalization: { enabled: true, showBreedProducts: true, showArchetype: true }
    }
  });

  // Topics state
  const [topics, setTopics] = useState([]);
  
  // Selected bundles, products, services for featured sections
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Available items from catalog
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [availableBundles, setAvailableBundles] = useState([]);

  useEffect(() => {
    loadPageData();
    loadCatalogData();
  }, []);

  const loadPageData = async () => {
    try {
      // Load page config
      const configRes = await fetch(`${API_URL}/api/learn/page-config`);
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.config) setPageConfig(prev => ({ ...prev, ...data.config }));
        if (data.topics) setTopics(data.topics);
        if (data.selectedBundles) setSelectedBundles(data.selectedBundles);
        if (data.selectedProducts) setSelectedProducts(data.selectedProducts);
        if (data.selectedServices) setSelectedServices(data.selectedServices);
      }
    } catch (err) {
      console.error('Failed to load page config:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogData = async () => {
    try {
      // Load products
      const prodRes = await fetch(`${API_URL}/api/learn/products`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setAvailableProducts(data.products || []);
      }
      
      // Load more products from product-box
      const boxRes = await fetch(`${API_URL}/api/product-box/products?pillar=learn&limit=100`);
      if (boxRes.ok) {
        const data = await boxRes.json();
        setAvailableProducts(prev => {
          const combined = [...prev, ...(data.products || [])];
          return combined.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
        });
      }
      
      // Load services
      const svcRes = await fetch(`${API_URL}/api/services?pillar=learn&limit=50`);
      if (svcRes.ok) {
        const data = await svcRes.json();
        setAvailableServices(data.services || []);
      }
      
      // Load bundles
      const bundleRes = await fetch(`${API_URL}/api/learn/bundles`);
      if (bundleRes.ok) {
        const data = await bundleRes.json();
        setAvailableBundles(data.bundles || []);
      }
    } catch (err) {
      console.error('Failed to load catalog data:', err);
    }
  };

  const savePageConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/learn/page-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: pageConfig,
          topics,
          selectedBundles,
          selectedProducts,
          selectedServices
        })
      });
      
      if (res.ok) {
        toast.success('Page configuration saved!');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addNewTopic = () => {
    const newTopic = {
      id: Date.now().toString(),
      title: 'New Topic',
      slug: 'new-topic-' + Date.now(),
      description: '',
      image: '',
      subtopics: [],
      videos: [],
      products: [],
      services: []
    };
    setTopics(prev => [...prev, newTopic]);
  };

  const updateTopic = (index, updatedTopic) => {
    setTopics(prev => prev.map((t, i) => i === index ? updatedTopic : t));
  };

  const deleteTopic = (index) => {
    if (confirm('Delete this topic?')) {
      setTopics(prev => prev.filter((_, i) => i !== index));
    }
  };

  const moveTopic = (index, direction) => {
    const newTopics = [...topics];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= topics.length) return;
    [newTopics[index], newTopics[newIndex]] = [newTopics[newIndex], newTopics[index]];
    setTopics(newTopics);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-3 text-gray-600">Loading Learn Page CMS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-amber-500" />
            Learn Page CMS
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Control every section and component of the Learn page
          </p>
        </div>
        <Button 
          onClick={savePageConfig} 
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600"
          size="lg"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save All Changes</>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Topics
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center gap-2">
            <Gift className="w-4 h-4" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Services
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Page Settings
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Page Title</label>
                <Input 
                  value={pageConfig.title}
                  onChange={(e) => setPageConfig(p => ({ ...p, title: e.target.value }))}
                  placeholder="Learning with Your Pet"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Subtitle</label>
                <Input 
                  value={pageConfig.subtitle}
                  onChange={(e) => setPageConfig(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Expert guides and tips"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium mb-2 block">Hero Image</label>
              <CloudinaryUploader
                currentImageUrl={pageConfig.heroImage}
                onUploadComplete={(url) => setPageConfig(p => ({ ...p, heroImage: url }))}
                folder="learn-hero"
              />
            </div>

            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium mb-4">Section Visibility</h3>
              <div className="space-y-3">
                {Object.entries(pageConfig.sections).map(([key, section]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{key} Section</p>
                      {section.title && <p className="text-sm text-gray-500">{section.title}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={section.enabled}
                        onCheckedChange={(checked) => setPageConfig(p => ({
                          ...p,
                          sections: { ...p.sections, [key]: { ...section, enabled: checked }}
                        }))}
                      />
                      {section.enabled ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Topics ({topics.length})
              </h2>
              <Button onClick={addNewTopic} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" /> Add Topic
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Each topic appears as a card on the Learn page. Click to expand and configure subtopics, videos, products, and services.
            </p>

            <div className="space-y-2">
              {topics.map((topic, index) => (
                <div key={topic.id} className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 pt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => moveTopic(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => moveTopic(index, 'down')}
                      disabled={index === topics.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <TopicEditor
                      topic={topic}
                      onUpdate={(updated) => updateTopic(index, updated)}
                      onDelete={() => deleteTopic(index)}
                      availableProducts={availableProducts}
                      availableServices={availableServices}
                    />
                  </div>
                </div>
              ))}
            </div>

            {topics.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No topics yet. Click "Add Topic" to create one.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" /> Featured Bundles
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select which bundles appear in the Bundles section of the Learn page.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {availableBundles.map(bundle => {
                const isSelected = selectedBundles.includes(bundle.id);
                return (
                  <div
                    key={bundle.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedBundles(prev => prev.filter(id => id !== bundle.id));
                      } else {
                        setSelectedBundles(prev => [...prev, bundle.id]);
                      }
                    }}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-amber-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      {bundle.image_url && (
                        <img src={bundle.image_url} alt="" className="w-16 h-16 rounded object-contain bg-gray-100" />
                      )}
                      <div>
                        <p className="font-medium">{bundle.name}</p>
                        <p className="text-sm text-amber-600">₹{bundle.price}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Featured Products
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select products to feature in the Products section of the Learn page.
            </p>
            
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {availableProducts.map(product => {
                const isSelected = selectedProducts.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedProducts(prev => prev.filter(id => id !== product.id));
                      } else {
                        setSelectedProducts(prev => [...prev, product.id]);
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      {(product.image || product.image_url) && (
                        <img src={product.image || product.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-amber-600">₹{product.price}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              Selected: {selectedProducts.length} products
            </div>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> Featured Services
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select services to feature on the Learn page.
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableServices.map(service => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedServices(prev => prev.filter(id => id !== service.id));
                      } else {
                        setSelectedServices(prev => [...prev, service.id]);
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.description?.slice(0, 60)}...</p>
                      </div>
                      <span className="text-amber-600 font-medium">₹{service.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              Selected: {selectedServices.length} services
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearnPageCMS;
