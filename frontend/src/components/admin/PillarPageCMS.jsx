/**
 * PillarPageCMS.jsx
 * UNIVERSAL CMS COMPONENT for ALL Pillar Pages
 * 
 * This is the GOLDEN STANDARD template that can be configured for any pillar:
 * Care, Fit, Travel, Stay, Dine, Enjoy, Celebrate, Emergency, Advisory, Farewell, Adopt, Shop
 * 
 * Usage: <PillarPageCMS pillar="care" config={careConfig} />
 * 
 * STANDARD TABS FOR ALL PILLARS:
 * 1. Page Settings (Title, Subtitle, Hero, Theme)
 * 2. Ask Mira Bar (Search configuration)
 * 3. Topics/Categories (Pillar-specific content sections)
 * 4. Products (Featured products for this pillar)
 * 5. Bundles (Curated bundles)
 * 6. Services (Related services)
 * 7. Personalized (Breed/archetype/soul picks)
 * 8. Concierge (Premium assistance)
 * 9. Mira Prompts (AI suggestions)
 * 10. Custom Tab (Pillar-specific features)
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
  Settings, FileText, Shield, Heart, Plane, Sparkles, Scale,
  Save, Loader2, ChevronDown, ChevronRight, Plus, Trash2,
  GripVertical, Image, Package, Briefcase, Eye, EyeOff,
  Search, Check, X, ArrowUp, ArrowDown, Bell, Calendar,
  MessageCircle, Star, Users, Clock, DollarSign, Tag,
  Folder, CheckCircle, AlertCircle, Brain, PawPrint,
  RefreshCw, Zap, Award, Gift, Crown, HelpCircle,
  Home, Utensils, Car, Bed, Dumbbell, PartyPopper,
  AlertTriangle, BookOpen, Flower2, Dog, ShoppingBag
} from 'lucide-react';

// ============== PILLAR CONFIGURATIONS ==============
export const PILLAR_CONFIGS = {
  care: {
    name: 'Care',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bgColor: 'from-rose-50 to-pink-50',
    borderColor: 'border-rose-100',
    defaultTitle: "Everything {petName} needs to feel loved",
    defaultSubtitle: "Grooming, health, wellness & daily care essentials",
    categories: [
      { id: 'grooming', name: 'Grooming', icon: 'Sparkles', color: 'from-pink-500 to-rose-500' },
      { id: 'health', name: 'Health & Wellness', icon: 'Heart', color: 'from-red-500 to-rose-500' },
      { id: 'hygiene', name: 'Hygiene', icon: 'Shield', color: 'from-blue-500 to-cyan-500' },
      { id: 'dental', name: 'Dental Care', icon: 'Star', color: 'from-purple-500 to-violet-500' },
      { id: 'skin-coat', name: 'Skin & Coat', icon: 'Sparkles', color: 'from-amber-500 to-orange-500' },
      { id: 'senior', name: 'Senior Care', icon: 'Heart', color: 'from-teal-500 to-emerald-500' }
    ],
    askMiraPlaceholder: "Grooming tips for {breedName}... best shampoo for sensitive skin"
  },
  fit: {
    name: 'Fit',
    icon: Dumbbell,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-100',
    defaultTitle: "Keep {petName} active & healthy",
    defaultSubtitle: "Exercise, fitness routines & activity tracking",
    categories: [
      { id: 'exercise', name: 'Exercise & Activity', icon: 'Dumbbell', color: 'from-green-500 to-emerald-500' },
      { id: 'weight', name: 'Weight Management', icon: 'Scale', color: 'from-blue-500 to-indigo-500' },
      { id: 'agility', name: 'Agility & Sports', icon: 'Zap', color: 'from-amber-500 to-orange-500' },
      { id: 'swimming', name: 'Swimming', icon: 'Waves', color: 'from-cyan-500 to-blue-500' },
      { id: 'walks', name: 'Walks & Hikes', icon: 'MapPin', color: 'from-teal-500 to-green-500' },
      { id: 'recovery', name: 'Rest & Recovery', icon: 'Moon', color: 'from-purple-500 to-violet-500' }
    ],
    askMiraPlaceholder: "Exercise routine for {breedName}... how much activity does my dog need"
  },
  travel: {
    name: 'Travel',
    icon: Plane,
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'from-cyan-50 to-blue-50',
    borderColor: 'border-cyan-100',
    defaultTitle: "Adventures await {petName}",
    defaultSubtitle: "Travel gear, pet-friendly destinations & travel planning",
    categories: [
      { id: 'air-travel', name: 'Air Travel', icon: 'Plane', color: 'from-blue-500 to-indigo-500' },
      { id: 'road-trips', name: 'Road Trips', icon: 'Car', color: 'from-green-500 to-teal-500' },
      { id: 'destinations', name: 'Pet-Friendly Destinations', icon: 'MapPin', color: 'from-amber-500 to-orange-500' },
      { id: 'gear', name: 'Travel Gear', icon: 'Briefcase', color: 'from-purple-500 to-violet-500' },
      { id: 'documents', name: 'Travel Documents', icon: 'FileText', color: 'from-cyan-500 to-blue-500' },
      { id: 'safety', name: 'Travel Safety', icon: 'Shield', color: 'from-red-500 to-rose-500' }
    ],
    askMiraPlaceholder: "Pet-friendly hotels in Goa... airline requirements for {breedName}"
  },
  stay: {
    name: 'Stay',
    icon: Bed,
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'from-indigo-50 to-purple-50',
    borderColor: 'border-indigo-100',
    defaultTitle: "A home away from home for {petName}",
    defaultSubtitle: "Boarding, pet hotels & daycare services",
    categories: [
      { id: 'boarding', name: 'Pet Boarding', icon: 'Home', color: 'from-indigo-500 to-purple-500' },
      { id: 'daycare', name: 'Daycare', icon: 'Sun', color: 'from-amber-500 to-orange-500' },
      { id: 'pet-hotels', name: 'Pet Hotels', icon: 'Star', color: 'from-purple-500 to-pink-500' },
      { id: 'home-sitting', name: 'Home Sitting', icon: 'Home', color: 'from-teal-500 to-emerald-500' },
      { id: 'overnight', name: 'Overnight Care', icon: 'Moon', color: 'from-blue-500 to-indigo-500' },
      { id: 'special-needs', name: 'Special Needs Boarding', icon: 'Heart', color: 'from-rose-500 to-pink-500' }
    ],
    askMiraPlaceholder: "Best boarding near me... daycare for anxious dogs"
  },
  dine: {
    name: 'Dine',
    icon: Utensils,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'from-orange-50 to-amber-50',
    borderColor: 'border-orange-100',
    defaultTitle: "Delicious meals for {petName}",
    defaultSubtitle: "Fresh food, nutrition plans & feeding essentials",
    categories: [
      { id: 'fresh-food', name: 'Fresh Food', icon: 'Utensils', color: 'from-green-500 to-emerald-500' },
      { id: 'dry-food', name: 'Dry Food & Kibble', icon: 'Package', color: 'from-amber-500 to-orange-500' },
      { id: 'treats', name: 'Treats & Snacks', icon: 'Star', color: 'from-pink-500 to-rose-500' },
      { id: 'supplements', name: 'Supplements', icon: 'Sparkles', color: 'from-purple-500 to-violet-500' },
      { id: 'special-diet', name: 'Special Diets', icon: 'Heart', color: 'from-red-500 to-rose-500' },
      { id: 'meal-plans', name: 'Meal Plans', icon: 'Calendar', color: 'from-blue-500 to-indigo-500' }
    ],
    askMiraPlaceholder: "Best food for {breedName}... homemade treats recipe"
  },
  enjoy: {
    name: 'Enjoy',
    icon: PartyPopper,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'from-pink-50 to-rose-50',
    borderColor: 'border-pink-100',
    defaultTitle: "Fun times with {petName}",
    defaultSubtitle: "Activities, events & experiences for pet parents",
    categories: [
      { id: 'events', name: 'Pet Events', icon: 'Calendar', color: 'from-pink-500 to-rose-500' },
      { id: 'activities', name: 'Activities', icon: 'Sparkles', color: 'from-purple-500 to-violet-500' },
      { id: 'playdates', name: 'Playdates', icon: 'Users', color: 'from-blue-500 to-indigo-500' },
      { id: 'toys', name: 'Toys & Games', icon: 'Star', color: 'from-amber-500 to-orange-500' },
      { id: 'enrichment', name: 'Enrichment', icon: 'Brain', color: 'from-teal-500 to-emerald-500' },
      { id: 'experiences', name: 'Experiences', icon: 'Heart', color: 'from-rose-500 to-pink-500' }
    ],
    askMiraPlaceholder: "Pet-friendly cafes near me... fun activities for {breedName}"
  },
  celebrate: {
    name: 'Celebrate',
    icon: PartyPopper,
    color: 'from-purple-500 to-pink-600',
    bgColor: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-100',
    defaultTitle: "Celebrate {petName}'s special moments",
    defaultSubtitle: "Birthdays, gotcha days & milestone celebrations",
    categories: [
      { id: 'birthdays', name: 'Birthdays', icon: 'Cake', color: 'from-pink-500 to-rose-500' },
      { id: 'gotcha-day', name: 'Gotcha Day', icon: 'Heart', color: 'from-red-500 to-rose-500' },
      { id: 'occasions', name: 'Special Occasions', icon: 'Star', color: 'from-amber-500 to-orange-500' },
      { id: 'gifts', name: 'Gifts & Surprises', icon: 'Gift', color: 'from-purple-500 to-violet-500' },
      { id: 'cakes', name: 'Pet Cakes & Treats', icon: 'Cake', color: 'from-pink-500 to-rose-500' },
      { id: 'photoshoots', name: 'Photoshoots', icon: 'Camera', color: 'from-blue-500 to-indigo-500' }
    ],
    askMiraPlaceholder: "Birthday cake for dogs... gotcha day gift ideas"
  },
  emergency: {
    name: 'Emergency',
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-600',
    bgColor: 'from-red-50 to-rose-50',
    borderColor: 'border-red-100',
    defaultTitle: "Emergency help for {petName}",
    defaultSubtitle: "24/7 emergency services, first aid & urgent care",
    categories: [
      { id: 'emergency-vet', name: 'Emergency Vet', icon: 'AlertTriangle', color: 'from-red-500 to-rose-500' },
      { id: 'first-aid', name: 'First Aid', icon: 'Heart', color: 'from-blue-500 to-indigo-500' },
      { id: 'poison-control', name: 'Poison Control', icon: 'AlertCircle', color: 'from-amber-500 to-orange-500' },
      { id: 'lost-pet', name: 'Lost Pet Help', icon: 'Search', color: 'from-purple-500 to-violet-500' },
      { id: 'urgent-care', name: 'Urgent Care', icon: 'Clock', color: 'from-teal-500 to-emerald-500' },
      { id: 'insurance', name: 'Emergency Insurance', icon: 'Shield', color: 'from-green-500 to-emerald-500' }
    ],
    askMiraPlaceholder: "24/7 vet near me... what to do if dog ate chocolate"
  },
  advisory: {
    name: 'Advisory',
    icon: BookOpen,
    color: 'from-teal-500 to-emerald-600',
    bgColor: 'from-teal-50 to-emerald-50',
    borderColor: 'border-teal-100',
    defaultTitle: "Expert advice for {petName}",
    defaultSubtitle: "Consultations, expert guidance & personalized recommendations",
    categories: [
      { id: 'nutrition', name: 'Nutrition Advisory', icon: 'Utensils', color: 'from-green-500 to-emerald-500' },
      { id: 'behavior', name: 'Behavior Consultation', icon: 'Brain', color: 'from-purple-500 to-violet-500' },
      { id: 'training', name: 'Training Guidance', icon: 'Award', color: 'from-amber-500 to-orange-500' },
      { id: 'health', name: 'Health Advisory', icon: 'Heart', color: 'from-red-500 to-rose-500' },
      { id: 'breed', name: 'Breed Expert', icon: 'Star', color: 'from-blue-500 to-indigo-500' },
      { id: 'lifestyle', name: 'Lifestyle Planning', icon: 'Calendar', color: 'from-teal-500 to-emerald-500' }
    ],
    askMiraPlaceholder: "Nutrition plan for {breedName}... behavior consultant near me"
  },
  farewell: {
    name: 'Farewell',
    icon: Flower2,
    color: 'from-slate-500 to-gray-600',
    bgColor: 'from-slate-50 to-gray-50',
    borderColor: 'border-slate-100',
    defaultTitle: "Honoring {petName}'s memory",
    defaultSubtitle: "End-of-life care, memorials & grief support",
    categories: [
      { id: 'end-of-life', name: 'End-of-Life Care', icon: 'Heart', color: 'from-slate-500 to-gray-500' },
      { id: 'cremation', name: 'Cremation Services', icon: 'Flame', color: 'from-amber-500 to-orange-500' },
      { id: 'memorials', name: 'Memorials', icon: 'Star', color: 'from-purple-500 to-violet-500' },
      { id: 'urns', name: 'Urns & Keepsakes', icon: 'Package', color: 'from-blue-500 to-indigo-500' },
      { id: 'grief', name: 'Grief Support', icon: 'Heart', color: 'from-rose-500 to-pink-500' },
      { id: 'rainbow-bridge', name: 'Rainbow Bridge', icon: 'Cloud', color: 'from-cyan-500 to-blue-500' }
    ],
    askMiraPlaceholder: "Pet cremation services... grief support resources"
  },
  adopt: {
    name: 'Adopt',
    icon: Dog,
    color: 'from-amber-500 to-yellow-600',
    bgColor: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-100',
    defaultTitle: "Find your perfect companion",
    defaultSubtitle: "Adoption, fostering & rescue support",
    categories: [
      { id: 'adopt-dog', name: 'Adopt a Dog', icon: 'Dog', color: 'from-amber-500 to-orange-500' },
      { id: 'foster', name: 'Foster', icon: 'Home', color: 'from-pink-500 to-rose-500' },
      { id: 'rescue', name: 'Rescue Support', icon: 'Heart', color: 'from-red-500 to-rose-500' },
      { id: 'shelters', name: 'Shelters Near You', icon: 'MapPin', color: 'from-blue-500 to-indigo-500' },
      { id: 'rehome', name: 'Rehoming', icon: 'Users', color: 'from-purple-500 to-violet-500' },
      { id: 'adoption-prep', name: 'Adoption Prep', icon: 'CheckCircle', color: 'from-green-500 to-emerald-500' }
    ],
    askMiraPlaceholder: "Dogs available for adoption... fostering requirements"
  },
  shop: {
    name: 'Shop',
    icon: ShoppingBag,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'from-violet-50 to-purple-50',
    borderColor: 'border-violet-100',
    defaultTitle: "Everything for {petName}",
    defaultSubtitle: "Curated products, exclusive collections & pet essentials",
    categories: [
      { id: 'essentials', name: 'Essentials', icon: 'Star', color: 'from-amber-500 to-orange-500' },
      { id: 'collections', name: 'Collections', icon: 'Sparkles', color: 'from-purple-500 to-violet-500' },
      { id: 'new-arrivals', name: 'New Arrivals', icon: 'Zap', color: 'from-pink-500 to-rose-500' },
      { id: 'bestsellers', name: 'Bestsellers', icon: 'Award', color: 'from-green-500 to-emerald-500' },
      { id: 'deals', name: 'Deals & Offers', icon: 'Tag', color: 'from-red-500 to-rose-500' },
      { id: 'subscriptions', name: 'Subscriptions', icon: 'RefreshCw', color: 'from-blue-500 to-indigo-500' }
    ],
    askMiraPlaceholder: "Best products for {breedName}... subscription boxes"
  }
};

// ============== CATEGORY EDITOR COMPONENT ==============
const CategoryEditor = ({ category, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [newSubcat, setNewSubcat] = useState('');

  const colorOptions = [
    { value: 'from-blue-500 to-indigo-500', label: 'Blue' },
    { value: 'from-red-500 to-rose-500', label: 'Red' },
    { value: 'from-green-500 to-emerald-500', label: 'Green' },
    { value: 'from-purple-500 to-violet-500', label: 'Purple' },
    { value: 'from-amber-500 to-orange-500', label: 'Amber' },
    { value: 'from-pink-500 to-rose-500', label: 'Pink' },
    { value: 'from-teal-500 to-emerald-500', label: 'Teal' },
    { value: 'from-cyan-500 to-blue-500', label: 'Cyan' },
  ];

  const addSubcategory = () => {
    if (!newSubcat.trim()) return;
    const subcats = [...(category.subcategories || []), {
      id: newSubcat.toLowerCase().replace(/\s+/g, '-'),
      name: newSubcat
    }];
    onUpdate({ ...category, subcategories: subcats });
    setNewSubcat('');
  };

  return (
    <Card className="p-4 mb-3 border-2 border-gray-200 hover:border-blue-300 transition-all">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color || 'from-blue-500 to-indigo-500'} flex items-center justify-center`}>
                <Folder className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-500">{(category.subcategories || []).length} subcategories</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
              {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category Name</Label>
              <Input 
                value={category.name}
                onChange={(e) => onUpdate({ ...category, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Color Theme</Label>
              <Select value={category.color} onValueChange={(v) => onUpdate({ ...category, color: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea 
              value={category.description || ''}
              onChange={(e) => onUpdate({ ...category, description: e.target.value })}
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Image</Label>
            <CloudinaryUploader
              currentImageUrl={category.image}
              onUploadComplete={(url) => onUpdate({ ...category, image: url })}
              folder={`pillar-categories`}
            />
          </div>

          {/* Subcategories */}
          <div className="bg-gray-50 rounded-lg p-3">
            <Label className="text-xs mb-2 block">Subcategories</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {(category.subcategories || []).map((sub, idx) => (
                <div key={sub.id || idx} className="flex items-center gap-2 bg-white p-2 rounded border text-sm">
                  <span className="flex-1">{sub.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const subcats = (category.subcategories || []).filter((_, i) => i !== idx);
                    onUpdate({ ...category, subcategories: subcats });
                  }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input 
                value={newSubcat}
                onChange={(e) => setNewSubcat(e.target.value)}
                placeholder="Add subcategory..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addSubcategory()}
              />
              <Button onClick={addSubcategory} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// ============== CONCIERGE SERVICE EDITOR ==============
const ConciergeServiceEditor = ({ service, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4 mb-3 border-2 border-gray-200 hover:border-purple-300">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{service.name || 'New Service'}</p>
                <p className="text-xs text-gray-500">
                  {service.price === 0 ? 'Free' : service.price ? `₹${service.price}` : 'Contact for quote'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
              {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Service Name</Label>
              <Input 
                value={service.name || ''}
                onChange={(e) => onUpdate({ ...service, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Price (₹)</Label>
              <Input 
                type="number"
                value={service.price || ''}
                onChange={(e) => onUpdate({ ...service, price: parseInt(e.target.value) || 0 })}
                placeholder="0 for free"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea 
              value={service.description || ''}
              onChange={(e) => onUpdate({ ...service, description: e.target.value })}
              rows={2}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Turnaround Time</Label>
              <Input 
                value={service.turnaround || ''}
                onChange={(e) => onUpdate({ ...service, turnaround: e.target.value })}
                placeholder="e.g., 24 hours"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">CTA Button Text</Label>
              <Input 
                value={service.cta_text || ''}
                onChange={(e) => onUpdate({ ...service, cta_text: e.target.value })}
                placeholder="e.g., Book Now"
                className="mt-1"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// ============== MIRA PROMPT EDITOR ==============
const MiraPromptEditor = ({ prompts, onUpdate }) => {
  const [newPrompt, setNewPrompt] = useState({ trigger: '', message: '', type: 'tip' });

  const promptTypes = [
    { value: 'tip', label: 'Contextual Tip', color: 'bg-blue-100 text-blue-700' },
    { value: 'reminder', label: 'Proactive Reminder', color: 'bg-amber-100 text-amber-700' },
    { value: 'suggestion', label: 'Suggestion', color: 'bg-green-100 text-green-700' },
    { value: 'nudge', label: 'Concierge Nudge', color: 'bg-purple-100 text-purple-700' },
  ];

  const addPrompt = () => {
    if (!newPrompt.message.trim()) return;
    onUpdate([...prompts, { ...newPrompt, id: Date.now().toString() }]);
    setNewPrompt({ trigger: '', message: '', type: 'tip' });
  };

  return (
    <div className="space-y-3">
      {prompts.map(prompt => {
        const typeConfig = promptTypes.find(t => t.value === prompt.type) || promptTypes[0];
        return (
          <div key={prompt.id} className="p-3 rounded-lg border bg-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                <p className="text-sm mt-1 text-gray-700">{prompt.message}</p>
                {prompt.trigger && (
                  <p className="text-xs text-gray-400 mt-1">Trigger: {prompt.trigger}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onUpdate(prompts.filter(p => p.id !== prompt.id))}>
                <X className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        );
      })}
      
      <div className="border-t pt-3 space-y-2">
        <div className="flex gap-2">
          <Select value={newPrompt.type} onValueChange={(v) => setNewPrompt(p => ({ ...p, type: v }))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {promptTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input 
            value={newPrompt.trigger}
            onChange={(e) => setNewPrompt(p => ({ ...p, trigger: e.target.value }))}
            placeholder="Trigger (optional)"
            className="flex-1"
          />
        </div>
        <div className="flex gap-2">
          <Textarea 
            value={newPrompt.message}
            onChange={(e) => setNewPrompt(p => ({ ...p, message: e.target.value }))}
            placeholder="Mira's message... use {petName}, {breedName}"
            rows={2}
            className="flex-1"
          />
          <Button onClick={addPrompt} className="bg-purple-500 hover:bg-purple-600 self-end">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============== MAIN PILLAR CMS COMPONENT ==============
const PillarPageCMS = ({ pillar }) => {
  const config = PILLAR_CONFIGS[pillar];
  const PillarIcon = config?.icon || Folder;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Page configuration state
  const [pageConfig, setPageConfig] = useState({
    pillar,
    title: config?.defaultTitle || '',
    subtitle: config?.defaultSubtitle || '',
    heroImage: '',
    themeColor: '',
    askMira: {
      enabled: true,
      placeholder: config?.askMiraPlaceholder || '',
      buttonColor: 'bg-teal-500',
      suggestions: []
    },
    sections: {
      askMira: { enabled: true },
      categories: { enabled: true },
      products: { enabled: true },
      bundles: { enabled: true },
      services: { enabled: true },
      personalized: { enabled: true },
      concierge: { enabled: true },
      miraPrompts: { enabled: true }
    }
  });

  // Categories
  const [categories, setCategories] = useState(config?.categories || []);
  
  // Concierge services
  const [conciergeServices, setConciergeServices] = useState([]);
  
  // Mira prompts
  const [miraPrompts, setMiraPrompts] = useState([]);
  
  // Selected items
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Available items
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableBundles, setAvailableBundles] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  // Personalization config
  const [personalizationConfig, setPersonalizationConfig] = useState({
    breedSmart: { enabled: true },
    lifeStage: { enabled: true },
    archetypePicks: { enabled: true },
    soulCollection: { enabled: true }
  });

  useEffect(() => {
    if (config) {
      loadPageData();
      loadCatalogData();
    }
  }, [pillar]);

  // Early return after hooks - check for valid config
  if (!config) {
    return <div className="text-red-500 p-8">Unknown pillar: {pillar}</div>;
  }

  const loadPageData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/${pillar}/page-config`);
      if (res.ok) {
        const data = await res.json();
        if (data.config && Object.keys(data.config).length > 0) {
          setPageConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.categories?.length > 0) setCategories(data.categories);
        if (data.conciergeServices?.length > 0) setConciergeServices(data.conciergeServices);
        if (data.miraPrompts?.length > 0) setMiraPrompts(data.miraPrompts);
        if (data.selectedProducts) setSelectedProducts(data.selectedProducts);
        if (data.selectedBundles) setSelectedBundles(data.selectedBundles);
        if (data.selectedServices) setSelectedServices(data.selectedServices);
        if (data.personalizationConfig) setPersonalizationConfig(data.personalizationConfig);
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
      const prodRes = await fetch(`${API_URL}/api/product-box/products?pillar=${pillar}&limit=100`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setAvailableProducts(data.products || []);
      }
      
      // Load bundles
      const bundleRes = await fetch(`${API_URL}/api/bundles?pillar=${pillar}&limit=50`);
      if (bundleRes.ok) {
        const data = await bundleRes.json();
        setAvailableBundles(data.bundles || []);
      }
      
      // Load services
      const svcRes = await fetch(`${API_URL}/api/services?pillar=${pillar}&limit=50`);
      if (svcRes.ok) {
        const data = await svcRes.json();
        setAvailableServices(data.services || []);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    }
  };

  const savePageConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/${pillar}/page-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: pageConfig,
          categories,
          conciergeServices,
          miraPrompts,
          selectedProducts,
          selectedBundles,
          selectedServices,
          personalizationConfig
        })
      });
      
      if (res.ok) {
        toast.success(`${config.name} Page CMS saved!`);
      } else {
        toast.error('Failed to save');
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    setCategories(prev => [...prev, {
      id: Date.now().toString(),
      name: 'New Category',
      icon: 'Folder',
      color: 'from-blue-500 to-indigo-500',
      description: '',
      subcategories: []
    }]);
  };

  const addConciergeService = () => {
    setConciergeServices(prev => [...prev, {
      id: Date.now().toString(),
      name: 'New Concierge Service',
      description: '',
      price: null,
      turnaround: '',
      cta_text: 'Learn More'
    }]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3">Loading {config.name} Page CMS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between bg-gradient-to-r ${config.bgColor} p-6 rounded-xl border ${config.borderColor}`}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
              <PillarIcon className="w-5 h-5 text-white" />
            </div>
            {config.name} Page CMS
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Control all content, products, services & personalization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadPageData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button 
            onClick={savePageConfig} 
            disabled={saving}
            className={`bg-gradient-to-r ${config.color} text-white`}
            size="lg"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full bg-gray-100 p-1 rounded-lg mb-2">
          <TabsTrigger value="settings" className="text-xs"><Settings className="w-3.5 h-3.5 mr-1" /> Settings</TabsTrigger>
          <TabsTrigger value="askmira" className="text-xs"><MessageCircle className="w-3.5 h-3.5 mr-1" /> Ask Mira</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs"><Folder className="w-3.5 h-3.5 mr-1" /> Categories</TabsTrigger>
          <TabsTrigger value="products" className="text-xs"><Package className="w-3.5 h-3.5 mr-1" /> Products</TabsTrigger>
          <TabsTrigger value="bundles" className="text-xs"><Gift className="w-3.5 h-3.5 mr-1" /> Bundles</TabsTrigger>
        </TabsList>
        <TabsList className="grid grid-cols-4 w-full bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="services" className="text-xs"><Briefcase className="w-3.5 h-3.5 mr-1" /> Services</TabsTrigger>
          <TabsTrigger value="personalized" className="text-xs"><PawPrint className="w-3.5 h-3.5 mr-1" /> Personalized</TabsTrigger>
          <TabsTrigger value="concierge" className="text-xs"><Crown className="w-3.5 h-3.5 mr-1" /> Concierge</TabsTrigger>
          <TabsTrigger value="miraprompts" className="text-xs"><Brain className="w-3.5 h-3.5 mr-1" /> Mira Prompts</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Page Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input 
                    value={pageConfig.title}
                    onChange={(e) => setPageConfig(p => ({ ...p, title: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{petName}'}, {'{breedName}'} for personalization</p>
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input 
                    value={pageConfig.subtitle}
                    onChange={(e) => setPageConfig(p => ({ ...p, subtitle: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" /> Hero Image
              </h2>
              <CloudinaryUploader
                currentImageUrl={pageConfig.heroImage}
                onUploadComplete={(url) => setPageConfig(p => ({ ...p, heroImage: url }))}
                folder={`${pillar}-hero`}
              />
            </Card>
          </div>

          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" /> Section Visibility
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(pageConfig.sections).map(([key, section]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
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
              <MessageCircle className="w-5 h-5" /> Ask Mira Bar
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
                <div>
                  <p className="font-medium">Enable Ask Mira Bar</p>
                  <p className="text-sm text-gray-500">Show AI search at top of page</p>
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
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Folder className="w-5 h-5" /> Categories ({categories.length})
              </h2>
              <Button onClick={addCategory}>
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            </div>
            {categories.map((cat, idx) => (
              <CategoryEditor
                key={cat.id || idx}
                category={cat}
                onUpdate={(updated) => {
                  const newCats = [...categories];
                  newCats[idx] = updated;
                  setCategories(newCats);
                }}
                onDelete={() => setCategories(categories.filter((_, i) => i !== idx))}
              />
            ))}
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Featured Products</h2>
            <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
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
                    className={`p-3 rounded-lg cursor-pointer border ${
                      isSelected ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        isSelected ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-green-600">₹{product.price}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <strong>Selected:</strong> {selectedProducts.length} products
            </div>
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Featured Bundles</h2>
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
                    className={`p-4 rounded-lg cursor-pointer border-2 ${
                      isSelected ? 'border-rose-400 bg-rose-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{bundle.name}</p>
                        <p className="text-sm text-rose-600">₹{bundle.price}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Featured Services</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
                    className={`p-4 rounded-lg cursor-pointer border ${
                      isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                      </div>
                      <span className="text-indigo-600 font-semibold">₹{service.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Personalized Tab */}
        <TabsContent value="personalized" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Personalization Settings</h2>
            <div className="space-y-4">
              {[
                { key: 'breedSmart', label: 'Breed-Smart Recommendations', desc: 'Products matched to breed' },
                { key: 'lifeStage', label: 'Life Stage Products', desc: 'Puppy, Adult, Senior' },
                { key: 'archetypePicks', label: 'Archetype-Based Picks', desc: 'Based on personality' },
                { key: 'soulCollection', label: 'Soul-Made Collection', desc: 'Pet soul profile' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <Switch
                    checked={personalizationConfig[item.key]?.enabled}
                    onCheckedChange={(checked) => setPersonalizationConfig(p => ({
                      ...p,
                      [item.key]: { ...p[item.key], enabled: checked }
                    }))}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Concierge Tab */}
        <TabsContent value="concierge" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Concierge Services ({conciergeServices.length})</h2>
              <Button onClick={addConciergeService} className="bg-purple-500 hover:bg-purple-600">
                <Plus className="w-4 h-4 mr-2" /> Add Service
              </Button>
            </div>
            {conciergeServices.map((service, idx) => (
              <ConciergeServiceEditor
                key={service.id}
                service={service}
                onUpdate={(updated) => {
                  const newServices = [...conciergeServices];
                  newServices[idx] = updated;
                  setConciergeServices(newServices);
                }}
                onDelete={() => setConciergeServices(conciergeServices.filter((_, i) => i !== idx))}
              />
            ))}
          </Card>
        </TabsContent>

        {/* Mira Prompts Tab */}
        <TabsContent value="miraprompts" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Mira's Smart Prompts</h2>
            <MiraPromptEditor 
              prompts={miraPrompts}
              onUpdate={setMiraPrompts}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PillarPageCMS;
