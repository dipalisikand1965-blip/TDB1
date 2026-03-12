/**
 * PaperworkPageCMS.jsx
 * COMPREHENSIVE CMS for the Paperwork Page - Control EVERY section
 * Following the Learn Page CMS golden standard
 * 
 * TABS COVERED:
 * 1. Page Settings (Title, Subtitle, Hero, Theme)
 * 2. Ask Mira Bar (Search configuration)
 * 3. Document Categories (6 folder types)
 * 4. Document Checklist (Essential/recommended docs)
 * 5. Reminder Templates (Notification settings)
 * 6. Paperwork Products (Product selection)
 * 7. Paperwork Bundles (Bundle configuration)
 * 8. Services (Document services)
 * 9. Personalized Products (Breed/archetype picks)
 * 10. Concierge Services (Premium assistance)
 * 11. Mira's Smart Prompts (AI suggestions)
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
  RefreshCw, Zap, Award, Gift, Crown, HelpCircle
} from 'lucide-react';

// ============== DOCUMENT CATEGORY EDITOR ==============
const DocumentCategoryEditor = ({ category, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [newSubcat, setNewSubcat] = useState({ name: '', required: false, has_reminder: false });

  const iconOptions = ['Shield', 'Heart', 'Plane', 'FileText', 'Sparkles', 'Scale', 'Folder', 'Star'];
  const colorOptions = [
    { value: 'from-blue-600 to-indigo-700', label: 'Blue/Indigo' },
    { value: 'from-red-500 to-rose-600', label: 'Red/Rose' },
    { value: 'from-cyan-500 to-blue-600', label: 'Cyan/Blue' },
    { value: 'from-emerald-500 to-green-600', label: 'Emerald/Green' },
    { value: 'from-purple-500 to-violet-600', label: 'Purple/Violet' },
    { value: 'from-amber-500 to-orange-600', label: 'Amber/Orange' },
  ];

  const addSubcategory = () => {
    if (!newSubcat.name.trim()) return;
    const subcats = [...(category.subcategories || []), {
      id: newSubcat.name.toLowerCase().replace(/\s+/g, '_'),
      ...newSubcat
    }];
    onUpdate({ ...category, subcategories: subcats });
    setNewSubcat({ name: '', required: false, has_reminder: false });
  };

  const updateSubcat = (idx, field, value) => {
    const subcats = [...category.subcategories];
    subcats[idx] = { ...subcats[idx], [field]: value };
    onUpdate({ ...category, subcategories: subcats });
  };

  const removeSubcat = (idx) => {
    const subcats = category.subcategories.filter((_, i) => i !== idx);
    onUpdate({ ...category, subcategories: subcats });
  };

  return (
    <Card className="p-4 mb-3 border-2 border-gray-200 hover:border-blue-300 transition-all">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                <Folder className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-500">{(category.subcategories || []).length} document types</p>
              </div>
            </div>
            {expanded ? <ChevronDown className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          {/* Subcategories */}
          <div className="bg-gray-50 rounded-lg p-3">
            <Label className="text-xs mb-2 block">Document Types</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(category.subcategories || []).map((sub, idx) => (
                <div key={sub.id || idx} className="flex items-center gap-2 bg-white p-2 rounded border">
                  <Input 
                    value={sub.name}
                    onChange={(e) => updateSubcat(idx, 'name', e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 text-xs">
                      <input 
                        type="checkbox" 
                        checked={sub.required}
                        onChange={(e) => updateSubcat(idx, 'required', e.target.checked)}
                        className="w-3 h-3"
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input 
                        type="checkbox" 
                        checked={sub.has_reminder}
                        onChange={(e) => updateSubcat(idx, 'has_reminder', e.target.checked)}
                        className="w-3 h-3"
                      />
                      Reminder
                    </label>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeSubcat(idx)}>
                    <X className="w-3 h-3 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input 
                value={newSubcat.name}
                onChange={(e) => setNewSubcat(s => ({ ...s, name: e.target.value }))}
                placeholder="New document type..."
                className="flex-1"
              />
              <Button onClick={addSubcategory} size="sm" className="bg-blue-500">
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
                placeholder="0 for free, empty for quote"
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
                placeholder="e.g., 24 hours, 3-5 days"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">CTA Button Text</Label>
              <Input 
                value={service.cta_text || ''}
                onChange={(e) => onUpdate({ ...service, cta_text: e.target.value })}
                placeholder="e.g., Book Now, Request Quote"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Includes (comma-separated)</Label>
            <Input 
              value={(service.includes || []).join(', ')}
              onChange={(e) => onUpdate({ ...service, includes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="Document digitization, Reminder setup, Expert review"
              className="mt-1"
            />
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
    { value: 'suggestion', label: 'Document Suggestion', color: 'bg-green-100 text-green-700' },
    { value: 'nudge', label: 'Concierge Nudge', color: 'bg-purple-100 text-purple-700' },
  ];

  const addPrompt = () => {
    if (!newPrompt.message.trim()) return;
    onUpdate([...prompts, { ...newPrompt, id: Date.now().toString() }]);
    setNewPrompt({ trigger: '', message: '', type: 'tip' });
  };

  const removePrompt = (id) => {
    onUpdate(prompts.filter(p => p.id !== id));
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
              <Button variant="ghost" size="sm" onClick={() => removePrompt(prompt.id)}>
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
            placeholder="Trigger condition (optional)"
            className="flex-1"
          />
        </div>
        <div className="flex gap-2">
          <Textarea 
            value={newPrompt.message}
            onChange={(e) => setNewPrompt(p => ({ ...p, message: e.target.value }))}
            placeholder="Mira's message..."
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

// ============== MAIN CMS COMPONENT ==============
const PaperworkPageCMS = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Page configuration state
  const [pageConfig, setPageConfig] = useState({
    pillar: 'paperwork',
    title: "Keep {petName}'s world in order",
    subtitle: 'Your secure vault for all pet documents, records & reminders',
    heroImage: '',
    themeColor: '#3b82f6',
    
    askMira: {
      enabled: true,
      placeholder: 'Find vaccination records... insurance renewal dates',
      buttonColor: 'bg-blue-500',
      showSuggestions: true,
      suggestions: [
        'Upload microchip certificate',
        'Set vaccination reminder',
        'Find insurance documents'
      ]
    },
    
    sections: {
      askMira: { enabled: true },
      documentVault: { enabled: true, title: "{petName}'s Document Vault" },
      documentChecklist: { enabled: true, title: 'Essential Documents' },
      reminders: { enabled: true, title: 'Upcoming Reminders' },
      bundles: { enabled: true, title: 'Paperwork Kits' },
      products: { enabled: true, title: 'Document Essentials' },
      services: { enabled: true, title: 'Document Services' },
      personalizedPicks: { enabled: true, title: 'Recommended for {petName}' },
      conciergeServices: { enabled: true, title: 'Concierge Assistance' },
      miraPrompts: { enabled: true }
    }
  });

  // Document categories
  const [documentCategories, setDocumentCategories] = useState([]);
  
  // Checklist items
  const [checklistItems, setChecklistItems] = useState([]);
  
  // Reminder templates
  const [reminderTemplates, setReminderTemplates] = useState([]);
  
  // Concierge services
  const [conciergeServices, setConciergeServices] = useState([]);
  
  // Mira prompts
  const [miraPrompts, setMiraPrompts] = useState([]);
  
  // Selected products, bundles, services
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Available items
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableBundles, setAvailableBundles] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  // Personalization settings
  const [personalizationConfig, setPersonalizationConfig] = useState({
    breedSmart: { enabled: true, title: 'Perfect for {breedName}' },
    lifeStage: { enabled: true },
    archetypePicks: { enabled: true },
    soulCollection: { enabled: true }
  });

  useEffect(() => {
    loadPageData();
    loadCatalogData();
  }, []);

  const loadPageData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/paperwork/page-config`);
      if (res.ok) {
        const data = await res.json();
        if (data.config && Object.keys(data.config).length > 0) {
          setPageConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.documentCategories?.length > 0) {
          setDocumentCategories(data.documentCategories);
        } else {
          setDocumentCategories(getDefaultCategories());
        }
        if (data.checklistItems) setChecklistItems(data.checklistItems);
        if (data.reminderTemplates) setReminderTemplates(data.reminderTemplates);
        if (data.conciergeServices) setConciergeServices(data.conciergeServices);
        if (data.miraPrompts) setMiraPrompts(data.miraPrompts);
        if (data.selectedProducts) setSelectedProducts(data.selectedProducts);
        if (data.selectedBundles) setSelectedBundles(data.selectedBundles);
        if (data.selectedServices) setSelectedServices(data.selectedServices);
        if (data.personalizationConfig) setPersonalizationConfig(data.personalizationConfig);
      } else {
        // Load defaults
        setDocumentCategories(getDefaultCategories());
        setConciergeServices(getDefaultConciergeServices());
        setMiraPrompts(getDefaultMiraPrompts());
        setChecklistItems(getDefaultChecklist());
        setReminderTemplates(getDefaultReminderTemplates());
      }
    } catch (err) {
      console.error('Failed to load page config:', err);
      setDocumentCategories(getDefaultCategories());
      setConciergeServices(getDefaultConciergeServices());
      setMiraPrompts(getDefaultMiraPrompts());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCategories = () => [
    { id: 'identity', name: 'Identity & Safety', icon: 'Shield', color: 'from-blue-600 to-indigo-700', description: 'Core identity documents for your pet', subcategories: [
      { id: 'adoption', name: 'Adoption Papers', required: true },
      { id: 'registration', name: 'Registration Certificate', required: false },
      { id: 'microchip', name: 'Microchip Certificate', required: true },
      { id: 'passport', name: 'Pet Passport', required: false },
      { id: 'ownership', name: 'Proof of Ownership', required: false }
    ]},
    { id: 'medical', name: 'Medical & Health', icon: 'Heart', color: 'from-red-500 to-rose-600', description: 'Health records, vaccinations & medical history', subcategories: [
      { id: 'vaccination', name: 'Vaccination Records', required: true, has_reminder: true },
      { id: 'deworming', name: 'Deworming History', required: false, has_reminder: true },
      { id: 'health_checkup', name: 'Annual Health Check-up', required: false, has_reminder: true },
      { id: 'sterilisation', name: 'Sterilisation Certificate', required: false },
      { id: 'vet_notes', name: 'Vet Consultation Notes', required: false },
      { id: 'lab_reports', name: 'Lab Reports', required: false },
      { id: 'prescriptions', name: 'Prescriptions', required: false }
    ]},
    { id: 'travel', name: 'Travel Documents', icon: 'Plane', color: 'from-cyan-500 to-blue-600', description: 'Travel certificates and relocation papers', subcategories: [
      { id: 'airline_cert', name: 'Airline Travel Certificate', required: false },
      { id: 'health_cert_travel', name: 'Health Certificate for Travel', required: false, has_reminder: true },
      { id: 'relocation', name: 'Pet Relocation Documents', required: false },
      { id: 'import_export', name: 'Import/Export Papers', required: false }
    ]},
    { id: 'insurance', name: 'Insurance & Financial', icon: 'FileText', color: 'from-emerald-500 to-green-600', description: 'Insurance policies and financial records', subcategories: [
      { id: 'policy', name: 'Insurance Policy Document', required: false, has_reminder: true },
      { id: 'claims', name: 'Claims History', required: false },
      { id: 'premium_receipts', name: 'Premium Payment Receipts', required: false }
    ]},
    { id: 'care', name: 'Care & Training', icon: 'Sparkles', color: 'from-purple-500 to-violet-600', description: 'Grooming, training and care records', subcategories: [
      { id: 'grooming', name: 'Grooming History', required: false },
      { id: 'training_cert', name: 'Training Certificates', required: false },
      { id: 'behaviour', name: 'Behaviour Assessment Reports', required: false }
    ]},
    { id: 'legal', name: 'Legal & Compliance', icon: 'Scale', color: 'from-amber-500 to-orange-600', description: 'Legal documents and compliance records', subcategories: [
      { id: 'license', name: 'Pet License', required: false, has_reminder: true },
      { id: 'breeding_permit', name: 'Breeding Permit', required: false },
      { id: 'housing_approval', name: 'Society/Housing Approval', required: false },
      { id: 'liability', name: 'Liability Documents', required: false }
    ]}
  ];

  const getDefaultConciergeServices = () => [
    { id: 'doc-assist', name: 'Document Assistance', description: 'Help organizing, digitizing, and setting up reminders for all your pet documents', price: 499, turnaround: '24-48 hours', cta_text: 'Get Help', includes: ['Document review', 'Digital organization', 'Reminder setup', 'Expert guidance'] },
    { id: 'passport-service', name: 'Pet Passport Service', description: 'Full-service pet passport processing for international travel', price: 2999, turnaround: '5-7 days', cta_text: 'Start Process', includes: ['Document collection', 'Vet coordination', 'Application filing', 'Status tracking'] },
    { id: 'microchip-coord', name: 'Microchipping Coordination', description: 'Schedule microchipping with our verified partner vets', price: 799, turnaround: 'Same day booking', cta_text: 'Schedule Now', includes: ['Vet booking', 'Certificate delivery', 'Database registration'] },
    { id: 'insurance-advisory', name: 'Insurance Advisory', description: 'Expert help comparing and choosing the right pet insurance', price: 0, turnaround: '1-2 days', cta_text: 'Get Free Advice', includes: ['Policy comparison', 'Coverage analysis', 'Claim guidance', 'Renewal reminders'] },
    { id: 'emergency-kit', name: 'Emergency Document Kit', description: 'Rush service to prepare all essential documents for emergencies or travel', price: 1499, turnaround: '24 hours', cta_text: 'Rush Order', includes: ['Priority processing', 'All essential docs', 'Digital & physical copies', '24/7 support'] },
    { id: 'renewal-mgmt', name: 'Renewal Management', description: 'Never miss a renewal - we manage all your document expiry dates', price: 199, turnaround: 'Ongoing', cta_text: 'Setup Reminders', includes: ['Expiry tracking', 'Multi-channel reminders', 'Renewal assistance', 'Annual report'] }
  ];

  const getDefaultMiraPrompts = () => [
    { id: '1', type: 'tip', trigger: 'no_microchip', message: "{petName} doesn't have microchip records yet. This is essential for identification and safety." },
    { id: '2', type: 'reminder', trigger: 'vaccination_due', message: "Vaccination is due in {days} days. Would you like me to remind you closer to the date?" },
    { id: '3', type: 'suggestion', trigger: 'breed_specific', message: "Most {breedName} parents also keep grooming records. Would you like to add one?" },
    { id: '4', type: 'nudge', trigger: 'incomplete_vault', message: "Your document vault is {percent}% complete. Our concierge team can help you organize the rest!" },
    { id: '5', type: 'tip', trigger: 'travel_intent', message: "Planning to travel? Make sure you have a health certificate - it's required by most airlines." },
    { id: '6', type: 'suggestion', trigger: 'insurance_missing', message: "Consider adding pet insurance. It can save thousands in unexpected vet bills." }
  ];

  const getDefaultChecklist = () => [
    { id: 'microchip', name: 'Microchip Certificate', category: 'identity', essential: true, description: 'Permanent identification for your pet' },
    { id: 'vaccination', name: 'Vaccination Records', category: 'medical', essential: true, description: 'Up-to-date vaccination history' },
    { id: 'adoption', name: 'Adoption/Purchase Papers', category: 'identity', essential: true, description: 'Proof of ownership' },
    { id: 'insurance', name: 'Pet Insurance Policy', category: 'insurance', essential: false, description: 'Financial protection for health emergencies' },
    { id: 'license', name: 'Pet License', category: 'legal', essential: false, description: 'Local registration if required' },
    { id: 'health_cert', name: 'Health Certificate', category: 'travel', essential: false, description: 'Required for travel' }
  ];

  const getDefaultReminderTemplates = () => [
    { id: 'vaccination', name: 'Vaccination Due', defaultDays: 30, message: "{petName}'s vaccination is due on {date}. Book an appointment soon!", channels: ['email', 'push'] },
    { id: 'insurance_renewal', name: 'Insurance Renewal', defaultDays: 14, message: "Your pet insurance policy expires on {date}. Renew to maintain coverage.", channels: ['email', 'sms'] },
    { id: 'license_renewal', name: 'License Renewal', defaultDays: 30, message: "{petName}'s license expires on {date}. Renew to stay compliant.", channels: ['email'] },
    { id: 'health_checkup', name: 'Annual Health Checkup', defaultDays: 365, message: "Time for {petName}'s annual health checkup! Regular checkups keep your pet healthy.", channels: ['email', 'push'] },
    { id: 'deworming', name: 'Deworming Due', defaultDays: 90, message: "{petName} is due for deworming. Keep those parasites away!", channels: ['email', 'push'] }
  ];

  const loadCatalogData = async () => {
    try {
      // Load products
      const prodRes = await fetch(`${API_URL}/api/paperwork/products`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setAvailableProducts(data.products || []);
      }
      
      // Load bundles
      const bundleRes = await fetch(`${API_URL}/api/paperwork/bundles`);
      if (bundleRes.ok) {
        const data = await bundleRes.json();
        setAvailableBundles(data.bundles || []);
      }
      
      // Load services
      const svcRes = await fetch(`${API_URL}/api/services?pillar=paperwork&limit=50`);
      if (svcRes.ok) {
        const data = await svcRes.json();
        setAvailableServices(data.services || []);
      }
    } catch (err) {
      console.error('Failed to load catalog data:', err);
    }
  };

  const savePageConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/paperwork/page-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: pageConfig,
          documentCategories,
          checklistItems,
          reminderTemplates,
          conciergeServices,
          miraPrompts,
          selectedProducts,
          selectedBundles,
          selectedServices,
          personalizationConfig
        })
      });
      
      if (res.ok) {
        toast.success('Paperwork Page CMS saved successfully!');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addConciergeService = () => {
    setConciergeServices(prev => [...prev, {
      id: Date.now().toString(),
      name: 'New Concierge Service',
      description: '',
      price: null,
      turnaround: '',
      cta_text: 'Learn More',
      includes: []
    }]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Loading Paperwork Page CMS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Paperwork Page CMS
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Control documents, reminders, products, and concierge services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadPageData} className="border-blue-200">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button 
            onClick={savePageConfig} 
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
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
        <TabsList className="grid grid-cols-6 w-full bg-gray-100 p-1 rounded-lg mb-2">
          <TabsTrigger value="settings" className="flex items-center gap-1 text-xs">
            <Settings className="w-3.5 h-3.5" /> Settings
          </TabsTrigger>
          <TabsTrigger value="askmira" className="flex items-center gap-1 text-xs">
            <MessageCircle className="w-3.5 h-3.5" /> Ask Mira
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1 text-xs">
            <Folder className="w-3.5 h-3.5" /> Categories
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-1 text-xs">
            <CheckCircle className="w-3.5 h-3.5" /> Checklist
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-1 text-xs">
            <Bell className="w-3.5 h-3.5" /> Reminders
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1 text-xs">
            <Package className="w-3.5 h-3.5" /> Products
          </TabsTrigger>
        </TabsList>
        <TabsList className="grid grid-cols-5 w-full bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="bundles" className="flex items-center gap-1 text-xs">
            <Gift className="w-3.5 h-3.5" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-1 text-xs">
            <Briefcase className="w-3.5 h-3.5" /> Services
          </TabsTrigger>
          <TabsTrigger value="personalized" className="flex items-center gap-1 text-xs">
            <PawPrint className="w-3.5 h-3.5" /> Personalized
          </TabsTrigger>
          <TabsTrigger value="concierge" className="flex items-center gap-1 text-xs">
            <Crown className="w-3.5 h-3.5" /> Concierge
          </TabsTrigger>
          <TabsTrigger value="miraprompts" className="flex items-center gap-1 text-xs">
            <Brain className="w-3.5 h-3.5" /> Mira Prompts
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" /> Page Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input 
                    value={pageConfig.title}
                    onChange={(e) => setPageConfig(p => ({ ...p, title: e.target.value }))}
                    placeholder="Keep {petName}'s world in order"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{petName}'} for dynamic pet name</p>
                </div>
                
                <div>
                  <Label>Subtitle</Label>
                  <Input 
                    value={pageConfig.subtitle}
                    onChange={(e) => setPageConfig(p => ({ ...p, subtitle: e.target.value }))}
                    placeholder="Your secure vault for all pet documents"
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
                <Image className="w-5 h-5 text-blue-500" /> Hero Image
              </h2>
              <CloudinaryUploader
                currentImageUrl={pageConfig.heroImage}
                onUploadComplete={(url) => setPageConfig(p => ({ ...p, heroImage: url }))}
                folder="paperwork-hero"
              />
            </Card>
          </div>

          {/* Section Visibility */}
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" /> Section Visibility
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(pageConfig.sections).map(([key, section]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
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
              <MessageCircle className="w-5 h-5 text-blue-500" /> Ask Mira Bar Configuration
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Enable Ask Mira Bar</p>
                  <p className="text-sm text-gray-500">Show the AI-powered search bar</p>
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
                  placeholder="Find vaccination records... insurance renewal dates"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Quick Suggestions</Label>
                <div className="space-y-2 mt-2">
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
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Document Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-500" /> Document Categories ({documentCategories.length})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure the 6 document folders and their subcategories
            </p>
            
            {documentCategories.map((cat, idx) => (
              <DocumentCategoryEditor
                key={cat.id}
                category={cat}
                onUpdate={(updated) => {
                  const newCats = [...documentCategories];
                  newCats[idx] = updated;
                  setDocumentCategories(newCats);
                }}
              />
            ))}
          </Card>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Document Checklist
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Define essential and recommended documents for the completion tracker
            </p>
            
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg ${item.essential ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.essential ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    {item.essential ? <Check className="w-4 h-4" /> : <span className="text-xs">{idx + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <Input 
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...checklistItems];
                        newItems[idx] = { ...item, name: e.target.value };
                        setChecklistItems(newItems);
                      }}
                      className="font-medium"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox"
                      checked={item.essential}
                      onChange={(e) => {
                        const newItems = [...checklistItems];
                        newItems[idx] = { ...item, essential: e.target.checked };
                        setChecklistItems(newItems);
                      }}
                    />
                    Essential
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setChecklistItems(checklistItems.filter((_, i) => i !== idx));
                  }}>
                    <X className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => {
                setChecklistItems([...checklistItems, {
                  id: Date.now().toString(),
                  name: 'New Document',
                  category: 'identity',
                  essential: false,
                  description: ''
                }]);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add Checklist Item
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" /> Reminder Templates
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure automatic reminder messages and timing
            </p>
            
            <div className="space-y-3">
              {reminderTemplates.map((template, idx) => (
                <Card key={template.id} className="p-4 bg-amber-50 border-amber-100">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Reminder Name</Label>
                      <Input 
                        value={template.name}
                        onChange={(e) => {
                          const newTemplates = [...reminderTemplates];
                          newTemplates[idx] = { ...template, name: e.target.value };
                          setReminderTemplates(newTemplates);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Days Before</Label>
                      <Input 
                        type="number"
                        value={template.defaultDays}
                        onChange={(e) => {
                          const newTemplates = [...reminderTemplates];
                          newTemplates[idx] = { ...template, defaultDays: parseInt(e.target.value) };
                          setReminderTemplates(newTemplates);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Channels</Label>
                      <Input 
                        value={(template.channels || []).join(', ')}
                        onChange={(e) => {
                          const newTemplates = [...reminderTemplates];
                          newTemplates[idx] = { ...template, channels: e.target.value.split(',').map(s => s.trim()) };
                          setReminderTemplates(newTemplates);
                        }}
                        placeholder="email, sms, push"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-xs">Message Template</Label>
                    <Textarea 
                      value={template.message}
                      onChange={(e) => {
                        const newTemplates = [...reminderTemplates];
                        newTemplates[idx] = { ...template, message: e.target.value };
                        setReminderTemplates(newTemplates);
                      }}
                      rows={2}
                      className="mt-1"
                      placeholder="Use {petName}, {date} as placeholders"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-500" /> Featured Products
            </h2>
            
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
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
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
              <p className="text-sm text-green-700">
                <strong>Selected:</strong> {selectedProducts.length} products
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-rose-500" /> Featured Bundles
            </h2>
            
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
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{bundle.name}</p>
                        <p className="text-sm text-rose-600">₹{bundle.price}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {availableBundles.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Gift className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No bundles available</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" /> Document Services
            </h2>
            
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
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500 truncate">{service.description?.slice(0, 60)}...</p>
                      </div>
                      <span className="text-indigo-600 font-semibold">₹{service.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Personalized Products Tab */}
        <TabsContent value="personalized" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-pink-500" /> Personalization Settings
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure how products are personalized based on pet profile
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                <div>
                  <p className="font-medium">Breed-Smart Recommendations</p>
                  <p className="text-sm text-gray-500">Show products matched to pet's breed</p>
                </div>
                <Switch
                  checked={personalizationConfig.breedSmart?.enabled}
                  onCheckedChange={(checked) => setPersonalizationConfig(p => ({
                    ...p,
                    breedSmart: { ...p.breedSmart, enabled: checked }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium">Life Stage Products</p>
                  <p className="text-sm text-gray-500">Puppy starter kits, senior organizers</p>
                </div>
                <Switch
                  checked={personalizationConfig.lifeStage?.enabled}
                  onCheckedChange={(checked) => setPersonalizationConfig(p => ({
                    ...p,
                    lifeStage: { ...p.lifeStage, enabled: checked }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium">Archetype-Based Picks</p>
                  <p className="text-sm text-gray-500">Products based on personality type</p>
                </div>
                <Switch
                  checked={personalizationConfig.archetypePicks?.enabled}
                  onCheckedChange={(checked) => setPersonalizationConfig(p => ({
                    ...p,
                    archetypePicks: { ...p.archetypePicks, enabled: checked }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
                <div>
                  <p className="font-medium">Soul-Made Collection</p>
                  <p className="text-sm text-gray-500">Curated based on pet's soul profile</p>
                </div>
                <Switch
                  checked={personalizationConfig.soulCollection?.enabled}
                  onCheckedChange={(checked) => setPersonalizationConfig(p => ({
                    ...p,
                    soulCollection: { ...p.soulCollection, enabled: checked }
                  }))}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Concierge Services Tab */}
        <TabsContent value="concierge" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-500" /> Concierge Services ({conciergeServices.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Premium assistance options for document management
                </p>
              </div>
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
                onDelete={() => {
                  setConciergeServices(conciergeServices.filter((_, i) => i !== idx));
                }}
              />
            ))}
          </Card>
        </TabsContent>

        {/* Mira Prompts Tab */}
        <TabsContent value="miraprompts" className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" /> Mira's Smart Prompts
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure contextual tips, reminders, and suggestions Mira shows to users
            </p>
            
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

export default PaperworkPageCMS;
