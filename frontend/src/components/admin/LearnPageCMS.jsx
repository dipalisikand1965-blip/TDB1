/**
 * LearnPageCMS.jsx
 * COMPREHENSIVE CMS for the Learn Page - Control EVERY section and sub-part
 * This is the GOLDEN STANDARD template for all pillar page CMS systems
 * 
 * SECTIONS COVERED:
 * 1. Page Settings (Title, Subtitle, Hero Image, Theme)
 * 2. Ask Mira Bar (Search/AI Assistant section)
 * 3. Topics (12 topic boxes with full modal content)
 * 4. Daily Learning Tip Section
 * 5. How Can We Help Section (3 action buckets)
 * 6. Learn For My Dog Section (Personalized tips)
 * 7. Breed Spotlight Section
 * 8. Guided Learning Paths
 * 9. Curated Bundles
 * 10. Training Products
 * 11. Services Section
 * 12. Featured Trainers
 * 13. Personalization Settings
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import CloudinaryUploader from './CloudinaryUploader';
import { API_URL } from '../../utils/api';
import {
  Settings, Layout, BookOpen, Gift, ShoppingBag, Users,
  Save, Loader2, ChevronDown, ChevronRight, Plus, Trash2,
  GripVertical, Image, Video, Package, Briefcase, Eye, EyeOff,
  Search, Check, X, ArrowUp, ArrowDown, Sparkles, Edit2,
  MessageCircle, Heart, Star, Target, Brain, Trophy, Zap, Shield,
  GraduationCap, PawPrint, Activity, Sun, AlertCircle, Palette,
  Lightbulb, HelpCircle, Calendar, MapPin, Award, RefreshCw
} from 'lucide-react';

// ============== TOPIC EDITOR COMPONENT ==============
const TopicEditor = ({ topic, onUpdate, onDelete, availableProducts, availableServices }) => {
  const [expanded, setExpanded] = useState(false);
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

  const updateSubtopic = (id, field, value) => {
    const subtopics = (topic.subtopics || []).map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    updateField('subtopics', subtopics);
  };

  const removeSubtopic = (id) => {
    const subtopics = (topic.subtopics || []).filter(s => s.id !== id);
    updateField('subtopics', subtopics);
  };

  const addVideo = () => {
    if (!newVideo.url.trim()) return;
    // Extract video ID from YouTube URL
    let videoId = newVideo.url;
    if (newVideo.url.includes('youtube.com/watch?v=')) {
      videoId = newVideo.url.split('v=')[1]?.split('&')[0];
    } else if (newVideo.url.includes('youtu.be/')) {
      videoId = newVideo.url.split('youtu.be/')[1]?.split('?')[0];
    }
    
    const videos = [...(topic.videos || []), {
      id: Date.now().toString(),
      videoId,
      title: newVideo.title || 'Untitled Video',
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
    <Card className="p-4 mb-3 border-2 border-gray-200 hover:border-amber-300 transition-all">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
              {topic.image ? (
                <img src={topic.image} alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Image className="w-6 h-6 text-amber-400" />
                </div>
              )}
              <div className="text-left">
                <p className="font-semibold text-gray-900">{topic.title || 'Untitled Topic'}</p>
                <p className="text-xs text-gray-500 flex items-center gap-3">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {(topic.subtopics || []).length}</span>
                  <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {(topic.videos || []).length}</span>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {(topic.products || []).length}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {(topic.services || []).length}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="hover:bg-red-50">
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              {expanded ? <ChevronDown className="w-5 h-5 text-amber-500" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Title</Label>
                <Input 
                  value={topic.title || ''} 
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Puppy Basics"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">URL Slug</Label>
                <Input 
                  value={topic.slug || ''} 
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="e.g., puppy-basics"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">Short Description</Label>
              <Textarea 
                value={topic.description || ''} 
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description shown on the topic card..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          {/* Topic Image */}
          <div className="bg-amber-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" /> Topic Card Image
            </h4>
            <CloudinaryUploader
              currentImageUrl={topic.image}
              onUploadComplete={(url) => updateField('image', url)}
              folder="learn-topics"
            />
          </div>

          {/* Subtopics (Overview Tab Content) */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Subtopics 
              <Badge variant="outline" className="ml-2">{(topic.subtopics || []).length} items</Badge>
              <span className="text-xs text-gray-500 ml-auto">Shows in Overview tab</span>
            </h4>
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {(topic.subtopics || []).map((sub) => (
                <div key={sub.id} className="flex items-start gap-2 bg-white p-3 rounded-lg border">
                  <div className="flex-1">
                    <Input 
                      value={sub.title}
                      onChange={(e) => updateSubtopic(sub.id, 'title', e.target.value)}
                      placeholder="Subtopic title"
                      className="mb-1 text-sm"
                    />
                    <Input 
                      value={sub.tip || ''}
                      onChange={(e) => updateSubtopic(sub.id, 'tip', e.target.value)}
                      placeholder="Quick tip or description (optional)"
                      className="text-xs"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeSubtopic(sub.id)}>
                    <X className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                value={newSubtopic}
                onChange={(e) => setNewSubtopic(e.target.value)}
                placeholder="Add new subtopic..."
                onKeyPress={(e) => e.key === 'Enter' && addSubtopic()}
              />
              <Button onClick={addSubtopic} size="sm" className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Videos */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Video className="w-4 h-4" /> YouTube Videos
              <Badge variant="outline" className="ml-2">{(topic.videos || []).length} videos</Badge>
              <span className="text-xs text-gray-500 ml-auto">Shows in Videos tab</span>
            </h4>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {(topic.videos || []).map((vid) => (
                <div key={vid.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                  <Video className="w-4 h-4 text-purple-500" />
                  <span className="text-sm flex-1 truncate">{vid.title}</span>
                  <span className="text-xs text-gray-400 font-mono">{vid.videoId?.substring(0, 11)}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeVideo(vid.id)}>
                    <X className="w-3 h-3 text-red-400" />
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
                placeholder="YouTube URL (watch?v=... or youtu.be/...)"
                className="flex-1"
              />
              <Button onClick={addVideo} size="sm" className="bg-purple-500 hover:bg-purple-600">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Products */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> Recommended Products
              <Badge variant="outline" className="ml-2 bg-green-100">{(topic.products || []).length} selected</Badge>
              <span className="text-xs text-gray-500 ml-auto">Shows in Products tab</span>
            </h4>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-10"
              />
            </div>
            <div className="max-h-56 overflow-y-auto border rounded-lg bg-white p-2 space-y-1">
              {filteredProducts.slice(0, 30).map(product => {
                const isSelected = (topic.products || []).includes(product.id);
                return (
                  <div 
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                      isSelected ? 'bg-green-100 border border-green-400' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-green-500 text-white' : 'bg-gray-200'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    {(product.image || product.image_url) && (
                      <img src={product.image || product.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                    )}
                    <span className="text-sm flex-1 truncate">{product.name}</span>
                    <span className="text-xs text-green-600 font-medium">Rs.{product.price}</span>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No products found</p>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Related Services
              <Badge variant="outline" className="ml-2 bg-indigo-100">{(topic.services || []).length} selected</Badge>
              <span className="text-xs text-gray-500 ml-auto">Shows in Services tab</span>
            </h4>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services..."
                className="pl-10"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-lg bg-white p-2 space-y-1">
              {filteredServices.slice(0, 20).map(service => {
                const isSelected = (topic.services || []).includes(service.id);
                return (
                  <div 
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                      isSelected ? 'bg-indigo-100 border border-indigo-400' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-200'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm flex-1 truncate">{service.name}</span>
                    <span className="text-xs text-indigo-600 font-medium">Rs.{service.price}</span>
                  </div>
                );
              })}
              {filteredServices.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No services found</p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// ============== DAILY TIP EDITOR ==============
const DailyTipEditor = ({ tips, onUpdate }) => {
  const [newTip, setNewTip] = useState({ tip: '', category: 'Training', color: 'from-blue-500 to-indigo-500' });
  
  const colorOptions = [
    { value: 'from-blue-500 to-indigo-500', label: 'Blue' },
    { value: 'from-purple-500 to-pink-500', label: 'Purple' },
    { value: 'from-teal-500 to-emerald-500', label: 'Teal' },
    { value: 'from-amber-500 to-orange-500', label: 'Amber' },
    { value: 'from-pink-500 to-rose-500', label: 'Pink' },
    { value: 'from-green-500 to-teal-500', label: 'Green' },
    { value: 'from-indigo-500 to-blue-500', label: 'Indigo' },
  ];

  const addTip = () => {
    if (!newTip.tip.trim()) return;
    onUpdate([...tips, { ...newTip, id: Date.now().toString() }]);
    setNewTip({ tip: '', category: 'Training', color: 'from-blue-500 to-indigo-500' });
  };

  const removeTip = (id) => {
    onUpdate(tips.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-3">
      {tips.map((tip, idx) => (
        <div key={tip.id || idx} className={`p-3 rounded-lg bg-gradient-to-r ${tip.color} text-white`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Badge className="bg-white/20 text-white text-xs mb-1">{tip.category}</Badge>
              <p className="text-sm">{tip.tip}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeTip(tip.id)} className="text-white/70 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
      
      <div className="border-t pt-3 space-y-2">
        <div className="flex gap-2">
          <Input 
            value={newTip.category}
            onChange={(e) => setNewTip(t => ({ ...t, category: e.target.value }))}
            placeholder="Category"
            className="w-32"
          />
          <Select value={newTip.color} onValueChange={(v) => setNewTip(t => ({ ...t, color: v }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Textarea 
            value={newTip.tip}
            onChange={(e) => setNewTip(t => ({ ...t, tip: e.target.value }))}
            placeholder="Enter daily tip content..."
            rows={2}
            className="flex-1"
          />
          <Button onClick={addTip} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============== GUIDED PATH EDITOR ==============
const GuidedPathEditor = ({ paths, onUpdate }) => {
  const [expandedPath, setExpandedPath] = useState(null);
  
  const colorOptions = ['pink', 'green', 'purple', 'blue', 'amber', 'indigo', 'teal', 'rose'];
  
  const addPath = () => {
    const newPath = {
      id: Date.now().toString(),
      title: 'New Learning Path',
      topicSlug: '',
      steps: ['Step 1', 'Step 2'],
      color: 'blue'
    };
    onUpdate([...paths, newPath]);
    setExpandedPath(newPath.id);
  };

  const updatePath = (id, field, value) => {
    onUpdate(paths.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePath = (id) => {
    onUpdate(paths.filter(p => p.id !== id));
  };

  const addStep = (pathId) => {
    const path = paths.find(p => p.id === pathId);
    if (path) {
      updatePath(pathId, 'steps', [...path.steps, `Step ${path.steps.length + 1}`]);
    }
  };

  const updateStep = (pathId, stepIdx, value) => {
    const path = paths.find(p => p.id === pathId);
    if (path) {
      const newSteps = [...path.steps];
      newSteps[stepIdx] = value;
      updatePath(pathId, 'steps', newSteps);
    }
  };

  const removeStep = (pathId, stepIdx) => {
    const path = paths.find(p => p.id === pathId);
    if (path && path.steps.length > 1) {
      updatePath(pathId, 'steps', path.steps.filter((_, i) => i !== stepIdx));
    }
  };

  return (
    <div className="space-y-3">
      {paths.map(path => (
        <Card key={path.id} className="p-3">
          <Collapsible open={expandedPath === path.id} onOpenChange={() => setExpandedPath(expandedPath === path.id ? null : path.id)}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${path.color}-500`}></div>
                  <span className="font-medium">{path.title}</span>
                  <Badge variant="outline">{path.steps.length} steps</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removePath(path.id); }}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                  {expandedPath === path.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={path.title} onChange={(e) => updatePath(path.id, 'title', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Topic Slug</Label>
                  <Input value={path.topicSlug} onChange={(e) => updatePath(path.id, 'topicSlug', e.target.value)} placeholder="puppy-basics" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Select value={path.color} onValueChange={(v) => updatePath(path.id, 'color', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Steps</Label>
                <div className="space-y-1 mt-1">
                  {path.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-xs text-gray-400 w-6 pt-2">{idx + 1}.</span>
                      <Input value={step} onChange={(e) => updateStep(path.id, idx, e.target.value)} className="flex-1" />
                      <Button variant="ghost" size="sm" onClick={() => removeStep(path.id, idx)} disabled={path.steps.length <= 1}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => addStep(path.id)} className="mt-2">
                  <Plus className="w-3 h-3 mr-1" /> Add Step
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
      <Button onClick={addPath} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Learning Path
      </Button>
    </div>
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
    title: 'What would you like to learn about {petName} today?',
    subtitle: 'Expert guides, training tips, and resources for every pet parent',
    heroImage: '',
    themeColor: '#f59e0b',
    
    // Ask Mira Bar Configuration
    askMira: {
      enabled: true,
      placeholder: 'Grooming guide for double coats... tips to stop barking',
      buttonColor: 'bg-teal-500',
      showSuggestions: true,
      suggestions: [
        'Puppy training schedule',
        'Stop excessive barking',
        'Leash walking tips'
      ]
    },
    
    // Section configurations
    sections: {
      askMira: { enabled: true, title: 'Ask Mira' },
      topics: { enabled: true, title: 'What would you like to learn?', maxItems: 12 },
      dailyTip: { enabled: true, title: "Today's Learning Tip" },
      helpBuckets: { enabled: true, title: 'How can we help?' },
      learnForPet: { enabled: true, title: 'Learn for {petName}' },
      breedSpotlight: { enabled: true, title: 'Breed Spotlight' },
      guidedPaths: { enabled: true, title: 'Guided Learning Paths', maxItems: 6 },
      bundles: { enabled: true, title: 'Training Bundles', maxItems: 4 },
      products: { enabled: true, title: 'Training Products', maxItems: 10 },
      services: { enabled: true, title: 'Training Services', maxItems: 8 },
      trainers: { enabled: true, title: 'Featured Trainers', maxItems: 3 },
      personalization: { enabled: true, showBreedProducts: true, showArchetype: true }
    }
  });

  // Topics state
  const [topics, setTopics] = useState([]);
  
  // Daily tips
  const [dailyTips, setDailyTips] = useState([]);
  
  // Guided paths
  const [guidedPaths, setGuidedPaths] = useState([]);
  
  // Help buckets
  const [helpBuckets, setHelpBuckets] = useState([
    { id: '1', title: 'Products & Routines', icon: 'Award', color: 'amber', items: ['Help me choose the right products', 'Build a routine for my dog', 'Help me with grooming choices'] },
    { id: '2', title: 'Life Stage & Care', icon: 'PawPrint', color: 'teal', items: ['Guide me for my puppy', 'Help me with senior dog care', 'Recommend what suits my breed'] },
    { id: '3', title: 'Support & Services', icon: 'Users', color: 'violet', items: ['Find the right trainer', 'Help me prepare for travel', 'Find help near me'] }
  ]);
  
  // Selected bundles, products, services
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
      const configRes = await fetch(`${API_URL}/api/learn/page-config`);
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.config && Object.keys(data.config).length > 0) {
          setPageConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.topics && data.topics.length > 0) {
          setTopics(data.topics);
        } else {
          // Load default topics
          setTopics(getDefaultTopics());
        }
        if (data.selectedBundles) setSelectedBundles(data.selectedBundles);
        if (data.selectedProducts) setSelectedProducts(data.selectedProducts);
        if (data.selectedServices) setSelectedServices(data.selectedServices);
        if (data.dailyTips) setDailyTips(data.dailyTips);
        if (data.guidedPaths) setGuidedPaths(data.guidedPaths);
        if (data.helpBuckets) setHelpBuckets(data.helpBuckets);
      }
    } catch (err) {
      console.error('Failed to load page config:', err);
      setTopics(getDefaultTopics());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTopics = () => [
    { id: '1', slug: 'puppy-basics', title: 'Puppy Basics', description: 'New puppy checklists, routines, and training guides', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/93c239031e6456380de0efe5eb0dc4f6c5b0c024dd4773902b6e0c573190b1d8.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '2', slug: 'breed-guides', title: 'Breed Guides', description: 'Understand the unique traits of different dog breeds', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/b19ce463f91811f725efcf22558df9a370147e238e79f810d6f6f25776b03144.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '3', slug: 'food-feeding', title: 'Food & Feeding', description: 'Nutrition advice, feeding schedules, and diet tips', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/5b1a4488a31b3aba09ebc15dd55c6155cee07f252d937530af9763ce6122ed48.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '4', slug: 'grooming', title: 'Grooming', description: 'Grooming tips, coat care, and brushing guides', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/2aeee0fe285e7f4bf9b0695c92778e425922cb62c68d06f1fe8fdc33715f7aac.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '5', slug: 'behavior', title: 'Behavior', description: 'Behavioral issues, training tips, and calming advice', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/22b2a63c7ce6c1bf271784616d997150b922e72b42f23b0b0dea6354151c556b.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '6', slug: 'training-basics', title: 'Training Basics', description: 'Training fundamentals, tips, and obedience guides', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/3e9d2387a56550d68b8a4694f20654d13cb537ecee01b51b0f2cd396ecc09efd.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '7', slug: 'travel-with-dogs', title: 'Travel with Dogs', description: 'Travel tips, safety advice, and gear recommendations', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/9b35a1a9ed5767659671cda04fc117a5abeafb2693411704164c5b37a1062ffe.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '8', slug: 'senior-dog-care', title: 'Senior Dog Care', description: 'Senior dog health, comfort, and activity tips', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/d9d9ebf8fe66ddcef4c455dbe5001f6143ef5b0c6ddf6e61689713ea03d13ec2.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '9', slug: 'health-basics', title: 'Health Basics', description: 'General health care, first aid, and wellness advice', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/c693f115f02adac326f5e6bb07378e3636c4a2774096c30b532317a65464632d.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '10', slug: 'rescue-indie-care', title: 'Rescue / Indie Care', description: 'Adoption, indie-breed tips, and rehabilitation guides', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/87e1b52ec6d6ab336a68adcea43c4a143f8de59d3cd2824e64e2c3fd9614441a.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '11', slug: 'seasonal-care', title: 'Seasonal Care', description: 'Weather care tips for summer, winter, and beyond', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/1e5c1f02a009891fbcef1a3e1004e6f1dfe7201bafd892ee8c1d026697842455.png', subtopics: [], videos: [], products: [], services: [] },
    { id: '12', slug: 'new-pet-parent-guide', title: 'New Pet Parent Guide', description: 'Starting out with a new dog or puppy in your home', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/484b7ec0a72919db7f6137f25033184bea6787c2ccb296ffb23544249b6ae7a4.png', subtopics: [], videos: [], products: [], services: [] }
  ];

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
      
      // Also try bundles collection
      const bundleRes2 = await fetch(`${API_URL}/api/bundles?pillar=learn`);
      if (bundleRes2.ok) {
        const data = await bundleRes2.json();
        setAvailableBundles(prev => {
          const combined = [...prev, ...(data.bundles || [])];
          return combined.filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i);
        });
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
          selectedServices,
          dailyTips,
          guidedPaths,
          helpBuckets
        })
      });
      
      if (res.ok) {
        toast.success('Learn Page CMS saved successfully!');
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
    if (confirm('Delete this topic? This cannot be undone.')) {
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
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            Learn Page CMS
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Control every section, topic, product, and service on the Learn page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadPageData} className="border-amber-200">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button 
            onClick={savePageConfig} 
            disabled={saving}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            size="lg"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save All Changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 w-full bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
            <Settings className="w-3.5 h-3.5" /> Settings
          </TabsTrigger>
          <TabsTrigger value="askmira" className="flex items-center gap-1.5 text-xs">
            <MessageCircle className="w-3.5 h-3.5" /> Ask Mira
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5" /> Topics
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1.5 text-xs">
            <Lightbulb className="w-3.5 h-3.5" /> Content
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center gap-1.5 text-xs">
            <Gift className="w-3.5 h-3.5" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1.5 text-xs">
            <ShoppingBag className="w-3.5 h-3.5" /> Products
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-1.5 text-xs">
            <Briefcase className="w-3.5 h-3.5" /> Services
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-amber-500" /> Page Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input 
                    value={pageConfig.title}
                    onChange={(e) => setPageConfig(p => ({ ...p, title: e.target.value }))}
                    placeholder="What would you like to learn about {petName} today?"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{petName}'} for dynamic pet name</p>
                </div>
                
                <div>
                  <Label>Subtitle</Label>
                  <Input 
                    value={pageConfig.subtitle}
                    onChange={(e) => setPageConfig(p => ({ ...p, subtitle: e.target.value }))}
                    placeholder="Expert guides and tips"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Theme Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      type="color"
                      value={pageConfig.themeColor}
                      onChange={(e) => setPageConfig(p => ({ ...p, themeColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input 
                      value={pageConfig.themeColor}
                      onChange={(e) => setPageConfig(p => ({ ...p, themeColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-amber-500" /> Hero Image
              </h2>
              <CloudinaryUploader
                currentImageUrl={pageConfig.heroImage}
                onUploadComplete={(url) => setPageConfig(p => ({ ...p, heroImage: url }))}
                folder="learn-hero"
              />
            </Card>
          </div>

          {/* Section Visibility */}
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" /> Section Visibility
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(pageConfig.sections).map(([key, section]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    {section.title && <p className="text-xs text-gray-500 truncate max-w-[150px]">{section.title}</p>}
                  </div>
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={(checked) => setPageConfig(p => ({
                      ...p,
                      sections: { ...p.sections, [key]: { ...section, enabled: checked }}
                    }))}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Ask Mira Tab */}
        <TabsContent value="askmira" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-teal-500" /> Ask Mira Bar Configuration
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure the AI search bar that appears at the top of the Learn page
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
                <div>
                  <p className="font-medium">Enable Ask Mira Bar</p>
                  <p className="text-sm text-gray-500">Show the AI-powered search bar at the top of the page</p>
                </div>
                <Switch
                  checked={pageConfig.askMira?.enabled ?? true}
                  onCheckedChange={(checked) => setPageConfig(p => ({
                    ...p,
                    askMira: { ...p.askMira, enabled: checked }
                  }))}
                />
              </div>

              <div>
                <Label>Placeholder Text</Label>
                <Input 
                  value={pageConfig.askMira?.placeholder || ''}
                  onChange={(e) => setPageConfig(p => ({
                    ...p,
                    askMira: { ...p.askMira, placeholder: e.target.value }
                  }))}
                  placeholder="Grooming guide for double coats... tips to stop barking"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Button Color Class</Label>
                <Select 
                  value={pageConfig.askMira?.buttonColor || 'bg-teal-500'}
                  onValueChange={(v) => setPageConfig(p => ({
                    ...p,
                    askMira: { ...p.askMira, buttonColor: v }
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-teal-500">Teal</SelectItem>
                    <SelectItem value="bg-amber-500">Amber</SelectItem>
                    <SelectItem value="bg-blue-500">Blue</SelectItem>
                    <SelectItem value="bg-purple-500">Purple</SelectItem>
                    <SelectItem value="bg-pink-500">Pink</SelectItem>
                    <SelectItem value="bg-green-500">Green</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Quick Suggestions</Label>
                  <Switch
                    checked={pageConfig.askMira?.showSuggestions ?? true}
                    onCheckedChange={(checked) => setPageConfig(p => ({
                      ...p,
                      askMira: { ...p.askMira, showSuggestions: checked }
                    }))}
                  />
                </div>
                {(pageConfig.askMira?.showSuggestions ?? true) && (
                  <div className="space-y-2">
                    {(pageConfig.askMira?.suggestions || []).map((sug, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input 
                          value={sug}
                          onChange={(e) => {
                            const newSugs = [...(pageConfig.askMira?.suggestions || [])];
                            newSugs[idx] = e.target.value;
                            setPageConfig(p => ({
                              ...p,
                              askMira: { ...p.askMira, suggestions: newSugs }
                            }));
                          }}
                        />
                        <Button variant="ghost" size="sm" onClick={() => {
                          const newSugs = (pageConfig.askMira?.suggestions || []).filter((_, i) => i !== idx);
                          setPageConfig(p => ({
                            ...p,
                            askMira: { ...p.askMira, suggestions: newSugs }
                          }));
                        }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => {
                      setPageConfig(p => ({
                        ...p,
                        askMira: { ...p.askMira, suggestions: [...(p.askMira?.suggestions || []), ''] }
                      }));
                    }}>
                      <Plus className="w-4 h-4 mr-1" /> Add Suggestion
                    </Button>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="border-t pt-4">
                <Label className="mb-2 block">Preview</Label>
                <div className="bg-gradient-to-b from-stone-50 to-white p-4 rounded-lg">
                  <div className="max-w-2xl mx-auto">
                    <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 shadow-sm p-1.5 pl-5">
                      <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder={pageConfig.askMira?.placeholder || 'Ask Mira anything...'}
                        className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-gray-400 bg-transparent outline-none"
                        disabled
                      />
                      <button className={`rounded-full ${pageConfig.askMira?.buttonColor || 'bg-teal-500'} h-10 w-10 flex items-center justify-center`}>
                        <Search className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" /> Topics ({topics.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Each topic appears as a clickable card. Configure subtopics, videos, products, and services for each.
                </p>
              </div>
              <Button onClick={addNewTopic} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" /> Add Topic
              </Button>
            </div>

            <div className="space-y-2">
              {topics.map((topic, index) => (
                <div key={topic.id} className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 pt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => moveTopic(index, 'up')}
                      disabled={index === 0}
                      className="h-7 w-7 p-0"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => moveTopic(index, 'down')}
                      disabled={index === topics.length - 1}
                      className="h-7 w-7 p-0"
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
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No topics yet. Click "Add Topic" to create one.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Content Tab (Daily Tips, Guided Paths, Help Buckets) */}
        <TabsContent value="content" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Daily Tips */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" /> Daily Learning Tips
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Tips rotate daily based on the date. Add multiple tips for variety.
              </p>
              <DailyTipEditor 
                tips={dailyTips} 
                onUpdate={setDailyTips} 
              />
            </Card>

            {/* Guided Learning Paths */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-500" /> Guided Learning Paths
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Step-by-step journeys for specific learning goals.
              </p>
              <GuidedPathEditor 
                paths={guidedPaths} 
                onUpdate={setGuidedPaths} 
              />
            </Card>
          </div>

          {/* Help Buckets */}
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-500" /> "How can we help?" Buckets
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Three action cards that guide users to common help topics.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {helpBuckets.map((bucket, idx) => (
                <Card key={bucket.id} className={`p-4 bg-${bucket.color}-50 border-${bucket.color}-100`}>
                  <div className="space-y-3">
                    <Input 
                      value={bucket.title}
                      onChange={(e) => {
                        const newBuckets = [...helpBuckets];
                        newBuckets[idx] = { ...bucket, title: e.target.value };
                        setHelpBuckets(newBuckets);
                      }}
                      placeholder="Bucket title"
                      className="font-medium"
                    />
                    <Select 
                      value={bucket.color}
                      onValueChange={(v) => {
                        const newBuckets = [...helpBuckets];
                        newBuckets[idx] = { ...bucket, color: v };
                        setHelpBuckets(newBuckets);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amber">Amber</SelectItem>
                        <SelectItem value="teal">Teal</SelectItem>
                        <SelectItem value="violet">Violet</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="pink">Pink</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="space-y-1">
                      {bucket.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex gap-1">
                          <Input 
                            value={item}
                            onChange={(e) => {
                              const newBuckets = [...helpBuckets];
                              newBuckets[idx].items[itemIdx] = e.target.value;
                              setHelpBuckets(newBuckets);
                            }}
                            className="text-sm"
                          />
                          <Button variant="ghost" size="sm" onClick={() => {
                            const newBuckets = [...helpBuckets];
                            newBuckets[idx].items = bucket.items.filter((_, i) => i !== itemIdx);
                            setHelpBuckets(newBuckets);
                          }}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full" onClick={() => {
                        const newBuckets = [...helpBuckets];
                        newBuckets[idx].items = [...bucket.items, ''];
                        setHelpBuckets(newBuckets);
                      }}>
                        <Plus className="w-3 h-3 mr-1" /> Add Item
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-rose-500" /> Featured Bundles
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
                      isSelected ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      {(bundle.image_url || bundle.image) && (
                        <img src={bundle.image_url || bundle.image} alt="" className="w-16 h-16 rounded-lg object-contain bg-gray-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{bundle.name}</p>
                        <p className="text-sm text-rose-600 font-semibold">Rs.{bundle.price}</p>
                        {bundle.original_price && (
                          <p className="text-xs text-gray-400 line-through">Rs.{bundle.original_price}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {availableBundles.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Gift className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No bundles available. Create bundles in the Bundles Manager.</p>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-rose-50 rounded-lg">
              <p className="text-sm text-rose-700">
                <strong>Selected:</strong> {selectedBundles.length} bundles
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-green-500" /> Featured Products
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select products to feature in the Products section of the Learn page.
            </p>
            
            <div className="grid grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
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
                    <div className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        {(product.image || product.image_url) && (
                          <img src={product.image || product.image_url} alt="" className="w-full h-20 rounded object-cover mb-2" />
                        )}
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-green-600 font-medium">Rs.{product.price}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center justify-between">
              <p className="text-sm text-green-700">
                <strong>Selected:</strong> {selectedProducts.length} products
              </p>
              <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
                Clear All
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" /> Featured Services
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select services to feature on the Learn page.
            </p>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
                    className={`p-4 rounded-lg cursor-pointer transition-all border ${
                      isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500 truncate">{service.description?.slice(0, 80)}...</p>
                      </div>
                      <div className="text-right">
                        <span className="text-indigo-600 font-semibold">Rs.{service.price}</span>
                        {service.duration && <p className="text-xs text-gray-400">{service.duration}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {availableServices.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No services available for Learn pillar.</p>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
              <p className="text-sm text-indigo-700">
                <strong>Selected:</strong> {selectedServices.length} services
              </p>
              <Button variant="outline" size="sm" onClick={() => setSelectedServices([])}>
                Clear All
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearnPageCMS;
