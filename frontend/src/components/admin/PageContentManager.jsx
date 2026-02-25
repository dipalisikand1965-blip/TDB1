import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, Save, RefreshCw, Plus, Trash2, Edit2, X, Check,
  Eye, ChevronDown, ChevronUp, Globe, Sparkles, Upload, Download,
  Home, Info, CreditCard, Shield, FileCheck, Gift, Utensils, Plane,
  Hotel, Heart, Dumbbell, Brain, Phone, BookOpen, ShoppingBag, Users, Star
} from 'lucide-react';
import { API_URL } from '../../utils/api';

const PageContentManager = ({ getAuthHeader }) => {
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState('home');
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('pages');
  const fileInputRef = useRef(null);

  // Comprehensive page configurations covering ALL pages
  const PAGE_CONFIGS = {
    // Core Pages
    home: { name: 'Homepage', icon: <Home className="w-4 h-4" />, category: 'core' },
    about: { name: 'About Us', icon: <Info className="w-4 h-4" />, category: 'core' },
    membership: { name: 'Pet Life Pass', icon: <CreditCard className="w-4 h-4" />, category: 'core' },
    
    // Legal Pages
    terms: { name: 'Terms & Conditions', icon: <FileCheck className="w-4 h-4" />, category: 'legal' },
    privacy: { name: 'Privacy Policy', icon: <Shield className="w-4 h-4" />, category: 'legal' },
    refund: { name: 'Refund Policy', icon: <FileText className="w-4 h-4" />, category: 'legal' },
    
    // Pillar Pages
    celebrate: { name: 'Celebrate', icon: <Gift className="w-4 h-4" />, category: 'pillar' },
    dine: { name: 'Dine', icon: <Utensils className="w-4 h-4" />, category: 'pillar' },
    travel: { name: 'Travel', icon: <Plane className="w-4 h-4" />, category: 'pillar' },
    stay: { name: 'Stay', icon: <Hotel className="w-4 h-4" />, category: 'pillar' },
    care: { name: 'Care', icon: <Heart className="w-4 h-4" />, category: 'pillar' },
    enjoy: { name: 'Enjoy', icon: <Star className="w-4 h-4" />, category: 'pillar' },
    fit: { name: 'Fit', icon: <Dumbbell className="w-4 h-4" />, category: 'pillar' },
    advisory: { name: 'Advisory', icon: <Brain className="w-4 h-4" />, category: 'pillar' },
    emergency: { name: 'Emergency', icon: <Phone className="w-4 h-4" />, category: 'pillar' },
    paperwork: { name: 'Paperwork', icon: <BookOpen className="w-4 h-4" />, category: 'pillar' },
    shop: { name: 'Shop Assist', icon: <ShoppingBag className="w-4 h-4" />, category: 'pillar' },
    club: { name: 'Club', icon: <Users className="w-4 h-4" />, category: 'pillar' },
    
    // Other Pages
    faqs: { name: 'FAQs', icon: <FileText className="w-4 h-4" />, category: 'other' },
    contact: { name: 'Contact', icon: <Phone className="w-4 h-4" />, category: 'other' },
  };

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (activePage) {
      fetchPageContent(activePage);
    }
  }, [activePage]);

  const fetchPages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pages`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  };

  const fetchPageContent = async (slug) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/pages/${slug}`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setPageContent(data);
      } else {
        // Create default content for new page
        setPageContent(getDefaultPageContent(slug));
      }
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      setPageContent(getDefaultPageContent(slug));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPageContent = (slug) => {
    const config = PAGE_CONFIGS[slug];
    const isPillar = config?.category === 'pillar';
    
    return {
      slug,
      title: config?.name || slug,
      content: {
        hero: {
          badge: isPillar ? `${config?.name} Pillar` : '',
          title: config?.name || 'Page Title',
          highlight: 'Your Highlight Text Here',
          subtitle: 'Describe what this page is about.',
          cta_primary: 'Get Started',
          cta_secondary: 'Learn More'
        },
        sections: [],
        seo: {
          meta_title: `${config?.name} | The Doggy Company®`,
          meta_description: `${config?.name} services for your pet at The Doggy Company.`,
          keywords: ['pet', 'dog', slug]
        }
      },
      is_published: false,
      updated_at: new Date().toISOString()
    };
  };

  const savePageContent = async () => {
    if (!pageContent) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/pages/${activePage}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pageContent)
      });
      if (response.ok) {
        alert('Page saved successfully!');
        fetchPages();
      } else {
        alert('Failed to save page');
      }
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Error saving page');
    } finally {
      setSaving(false);
    }
  };

  const seedAllDefaultContent = async () => {
    if (!confirm('This will seed default content for ALL pages. Continue?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/pages/seed-all`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Seeded ${data.seeded} pages!`);
        fetchPages();
        fetchPageContent(activePage);
      }
    } catch (error) {
      console.error('Failed to seed content:', error);
      alert('Failed to seed content');
    }
  };

  const exportContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pages/export`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `page-content-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const importContent = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await fetch(`${API_URL}/api/admin/pages/import`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Imported ${result.imported} pages!`);
        fetchPages();
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import: Invalid JSON format');
    }
    
    event.target.value = '';
  };

  const updateContent = (path, value) => {
    setPageContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newContent;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newContent;
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      content: '',
      type: 'text'
    };
    
    setPageContent(prev => ({
      ...prev,
      content: {
        ...prev.content,
        sections: [...(prev.content?.sections || []), newSection]
      }
    }));
  };

  const removeSection = (index) => {
    setPageContent(prev => ({
      ...prev,
      content: {
        ...prev.content,
        sections: prev.content.sections.filter((_, i) => i !== index)
      }
    }));
  };

  const renderEditor = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      );
    }

    if (!pageContent) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a page to edit</p>
        </div>
      );
    }

    const content = pageContent.content || {};

    return (
      <div className="space-y-4">
        {/* Page Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold">{PAGE_CONFIGS[activePage]?.name || activePage}</h3>
            <p className="text-sm text-gray-500">Last updated: {new Date(pageContent.updated_at || Date.now()).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={pageContent.is_published ? 'default' : 'secondary'}>
              {pageContent.is_published ? 'Published' : 'Draft'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPageContent(prev => ({ ...prev, is_published: !prev.is_published }))}
            >
              {pageContent.is_published ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="p-4">
          <button 
            onClick={() => toggleSection('hero')}
            className="w-full flex items-center justify-between text-left font-semibold mb-2"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">🎯</span> Hero Section
            </span>
            {expandedSections.hero ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.hero !== false && (
            <div className="space-y-3 mt-4 pl-6 border-l-2 border-purple-200">
              <div>
                <label className="text-xs text-gray-500 uppercase">Badge Text</label>
                <Input
                  value={content.hero?.badge || ''}
                  onChange={(e) => updateContent('content.hero.badge', e.target.value)}
                  placeholder="e.g., Pet Life Operating System"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Main Title</label>
                <Input
                  value={content.hero?.title || ''}
                  onChange={(e) => updateContent('content.hero.title', e.target.value)}
                  placeholder="Main headline"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Highlight (Colored text)</label>
                <Input
                  value={content.hero?.highlight || ''}
                  onChange={(e) => updateContent('content.hero.highlight', e.target.value)}
                  placeholder="Highlighted portion"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Subtitle</label>
                <textarea
                  value={content.hero?.subtitle || ''}
                  onChange={(e) => updateContent('content.hero.subtitle', e.target.value)}
                  placeholder="Description paragraph"
                  className="w-full p-2 border rounded-md text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Primary CTA</label>
                  <Input
                    value={content.hero?.cta_primary || ''}
                    onChange={(e) => updateContent('content.hero.cta_primary', e.target.value)}
                    placeholder="Button text"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Secondary CTA</label>
                  <Input
                    value={content.hero?.cta_secondary || ''}
                    onChange={(e) => updateContent('content.hero.cta_secondary', e.target.value)}
                    placeholder="Button text"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Custom Sections */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold flex items-center gap-2">
              <span className="text-lg">📝</span> Content Sections
            </span>
            <Button size="sm" onClick={addSection}>
              <Plus className="w-4 h-4 mr-1" /> Add Section
            </Button>
          </div>
          
          {(content.sections || []).map((section, idx) => (
            <div key={section.id || idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Input
                  value={section.title || ''}
                  onChange={(e) => {
                    const newSections = [...content.sections];
                    newSections[idx].title = e.target.value;
                    updateContent('content.sections', newSections);
                  }}
                  placeholder="Section title"
                  className="font-medium"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => removeSection(idx)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <textarea
                value={section.content || ''}
                onChange={(e) => {
                  const newSections = [...content.sections];
                  newSections[idx].content = e.target.value;
                  updateContent('content.sections', newSections);
                }}
                placeholder="Section content (supports markdown)"
                className="w-full p-2 border rounded-md text-sm"
                rows={4}
              />
            </div>
          ))}
          
          {(!content.sections || content.sections.length === 0) && (
            <p className="text-center text-gray-400 py-4">No custom sections yet. Click "Add Section" to create one.</p>
          )}
        </Card>

        {/* SEO Settings */}
        <Card className="p-4">
          <button 
            onClick={() => toggleSection('seo')}
            className="w-full flex items-center justify-between text-left font-semibold mb-2"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" /> SEO Settings
            </span>
            {expandedSections.seo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.seo && (
            <div className="space-y-3 mt-4 pl-6 border-l-2 border-blue-200">
              <div>
                <label className="text-xs text-gray-500 uppercase">Meta Title</label>
                <Input
                  value={content.seo?.meta_title || ''}
                  onChange={(e) => updateContent('content.seo.meta_title', e.target.value)}
                  placeholder="Page title for search engines"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Meta Description</label>
                <textarea
                  value={content.seo?.meta_description || ''}
                  onChange={(e) => updateContent('content.seo.meta_description', e.target.value)}
                  placeholder="Description for search results"
                  className="w-full p-2 border rounded-md text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Keywords (comma-separated)</label>
                <Input
                  value={(content.seo?.keywords || []).join(', ')}
                  onChange={(e) => updateContent('content.seo.keywords', e.target.value.split(',').map(k => k.trim()))}
                  placeholder="pet, dog, care, etc."
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderPageList = (category) => {
    const categoryPages = Object.entries(PAGE_CONFIGS).filter(([_, cfg]) => cfg.category === category);
    
    return (
      <div className="space-y-1">
        {categoryPages.map(([slug, config]) => {
          const isActive = activePage === slug;
          const pageExists = pages.some(p => p.slug === slug);
          
          return (
            <button
              key={slug}
              onClick={() => setActivePage(slug)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                isActive 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {config.icon}
              <span className="flex-1">{config.name}</span>
              {!pageExists && (
                <Badge variant="outline" className="text-xs">New</Badge>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="page-content-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Manager</h2>
          <p className="text-gray-500">Edit all page content across your site</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importContent}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={exportContent}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={seedAllDefaultContent}>
            <Sparkles className="w-4 h-4 mr-2" /> Seed All Defaults
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Page Navigation */}
        <div className="col-span-1 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3">Core Pages</h3>
            {renderPageList('core')}
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3">12 Pillars</h3>
            {renderPageList('pillar')}
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3">Legal</h3>
            {renderPageList('legal')}
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3">Other</h3>
            {renderPageList('other')}
          </Card>
        </div>

        {/* Editor */}
        <div className="col-span-3">
          <Card className="p-6">
            {renderEditor()}
            
            {pageContent && (
              <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => fetchPageContent(activePage)}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button onClick={savePageContent} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PageContentManager;
