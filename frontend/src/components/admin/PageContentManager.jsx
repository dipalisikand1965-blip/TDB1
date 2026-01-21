import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, Save, RefreshCw, Plus, Trash2, Edit2, X, Check,
  Eye, EyeOff, ChevronDown, ChevronUp, Globe, Sparkles
} from 'lucide-react';
import { API_URL } from '../../utils/api';

const PageContentManager = ({ getAuthHeader }) => {
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState('about');
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const PAGE_CONFIGS = {
    about: { name: 'About Us', icon: '🏢' },
    membership: { name: 'Membership', icon: '👑' },
    terms: { name: 'Terms & Conditions', icon: '📜' },
    privacy: { name: 'Privacy Policy', icon: '🔒' }
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
      }
    } catch (error) {
      console.error('Failed to fetch page content:', error);
    } finally {
      setLoading(false);
    }
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

  const seedDefaultContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pages/seed`, {
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
    }
  };

  const updateContent = (path, value) => {
    setPageContent(prev => {
      const newContent = { ...prev };
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

  const renderEditor = () => {
    if (!pageContent || !pageContent.content) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No content found for this page.</p>
          <Button onClick={seedDefaultContent} className="mt-4">
            <Sparkles className="w-4 h-4 mr-2" /> Seed Default Content
          </Button>
        </div>
      );
    }

    const content = pageContent.content;

    return (
      <div className="space-y-6">
        {/* Hero Section */}
        {content.hero && (
          <Card className="p-4">
            <button 
              onClick={() => toggleSection('hero')}
              className="w-full flex items-center justify-between text-left font-semibold mb-2"
            >
              <span>🎯 Hero Section</span>
              {expandedSections.hero ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.hero !== false && (
              <div className="space-y-3 mt-4">
                {content.hero.badge !== undefined && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Badge Text</label>
                    <Input
                      value={content.hero.badge || ''}
                      onChange={(e) => updateContent('content.hero.badge', e.target.value)}
                      placeholder="Badge text"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 uppercase">Title</label>
                  <Input
                    value={content.hero.title || ''}
                    onChange={(e) => updateContent('content.hero.title', e.target.value)}
                    placeholder="Main title"
                  />
                </div>
                {content.hero.highlight !== undefined && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Highlight Text</label>
                    <Input
                      value={content.hero.highlight || ''}
                      onChange={(e) => updateContent('content.hero.highlight', e.target.value)}
                      placeholder="Highlighted text"
                    />
                  </div>
                )}
                {content.hero.subtitle !== undefined && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Subtitle</label>
                    <Input
                      value={content.hero.subtitle || ''}
                      onChange={(e) => updateContent('content.hero.subtitle', e.target.value)}
                      placeholder="Subtitle"
                    />
                  </div>
                )}
                {content.hero.description !== undefined && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Description</label>
                    <textarea
                      value={content.hero.description || ''}
                      onChange={(e) => updateContent('content.hero.description', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                      rows={3}
                      placeholder="Description text"
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Mission Section */}
        {content.mission && (
          <Card className="p-4">
            <button 
              onClick={() => toggleSection('mission')}
              className="w-full flex items-center justify-between text-left font-semibold mb-2"
            >
              <span>🎯 Mission</span>
              {expandedSections.mission ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.mission !== false && (
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Title</label>
                  <Input
                    value={content.mission.title || ''}
                    onChange={(e) => updateContent('content.mission.title', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Text</label>
                  <textarea
                    value={content.mission.text || ''}
                    onChange={(e) => updateContent('content.mission.text', e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Pillars Section */}
        {content.pillars && (
          <Card className="p-4">
            <button 
              onClick={() => toggleSection('pillars')}
              className="w-full flex items-center justify-between text-left font-semibold mb-2"
            >
              <span>🏛️ Pillars ({content.pillars.length})</span>
              {expandedSections.pillars ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.pillars && (
              <div className="space-y-3 mt-4">
                {content.pillars.map((pillar, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={pillar.name || ''}
                        onChange={(e) => {
                          const newPillars = [...content.pillars];
                          newPillars[idx] = { ...pillar, name: e.target.value };
                          updateContent('content.pillars', newPillars);
                        }}
                        placeholder="Name"
                      />
                      <Input
                        value={pillar.description || ''}
                        onChange={(e) => {
                          const newPillars = [...content.pillars];
                          newPillars[idx] = { ...pillar, description: e.target.value };
                          updateContent('content.pillars', newPillars);
                        }}
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Benefits Section */}
        {content.benefits && (
          <Card className="p-4">
            <button 
              onClick={() => toggleSection('benefits')}
              className="w-full flex items-center justify-between text-left font-semibold mb-2"
            >
              <span>✨ Benefits ({content.benefits.length})</span>
              {expandedSections.benefits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.benefits && (
              <div className="space-y-3 mt-4">
                {content.benefits.map((benefit, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={benefit.title || ''}
                        onChange={(e) => {
                          const newBenefits = [...content.benefits];
                          newBenefits[idx] = { ...benefit, title: e.target.value };
                          updateContent('content.benefits', newBenefits);
                        }}
                        placeholder="Title"
                      />
                      <Input
                        value={benefit.description || ''}
                        onChange={(e) => {
                          const newBenefits = [...content.benefits];
                          newBenefits[idx] = { ...benefit, description: e.target.value };
                          updateContent('content.benefits', newBenefits);
                        }}
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Pricing Section */}
        {content.pricing && (
          <Card className="p-4">
            <button 
              onClick={() => toggleSection('pricing')}
              className="w-full flex items-center justify-between text-left font-semibold mb-2"
            >
              <span>💰 Pricing</span>
              {expandedSections.pricing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.pricing !== false && (
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Heading</label>
                  <Input
                    value={content.pricing.heading || ''}
                    onChange={(e) => updateContent('content.pricing.heading', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Annual Price (₹)</label>
                    <Input
                      type="number"
                      value={content.pricing.annual?.price || 999}
                      onChange={(e) => updateContent('content.pricing.annual.price', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Monthly Price (₹)</label>
                    <Input
                      type="number"
                      value={content.pricing.monthly?.price || 99}
                      onChange={(e) => updateContent('content.pricing.monthly.price', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* CTA Section */}
        {content.cta && (
          <Card className="p-4">
            <button 
              onClick={() => toggleSection('cta')}
              className="w-full flex items-center justify-between text-left font-semibold mb-2"
            >
              <span>🚀 Call to Action</span>
              {expandedSections.cta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.cta !== false && (
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Heading</label>
                  <Input
                    value={content.cta.heading || ''}
                    onChange={(e) => updateContent('content.cta.heading', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Subheading</label>
                  <Input
                    value={content.cta.subheading || ''}
                    onChange={(e) => updateContent('content.cta.subheading', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Button Text</label>
                  <Input
                    value={content.cta.button_text || ''}
                    onChange={(e) => updateContent('content.cta.button_text', e.target.value)}
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Sections (for Terms/Privacy) */}
        {content.sections && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">📄 Sections ({content.sections.length})</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newSections = [...content.sections, { title: '', text: '' }];
                  updateContent('content.sections', newSections);
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Section
              </Button>
            </div>
            <div className="space-y-4">
              {content.sections.map((section, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg relative">
                  <button
                    onClick={() => {
                      const newSections = content.sections.filter((_, i) => i !== idx);
                      updateContent('content.sections', newSections);
                    }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-2">
                    <Input
                      value={section.title || ''}
                      onChange={(e) => {
                        const newSections = [...content.sections];
                        newSections[idx] = { ...section, title: e.target.value };
                        updateContent('content.sections', newSections);
                      }}
                      placeholder="Section Title"
                      className="font-medium"
                    />
                    <textarea
                      value={section.text || ''}
                      onChange={(e) => {
                        const newSections = [...content.sections];
                        newSections[idx] = { ...section, text: e.target.value };
                        updateContent('content.sections', newSections);
                      }}
                      placeholder="Section content..."
                      className="w-full p-2 border rounded-md text-sm"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Values Section */}
        {content.values && (
          <Card className="p-4">
            <button 
              onClick={() => toggleSection('values')}
              className="w-full flex items-center justify-between text-left font-semibold mb-2"
            >
              <span>💎 Values ({content.values.length})</span>
              {expandedSections.values ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.values && (
              <div className="space-y-3 mt-4">
                {content.values.map((value, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={value.title || ''}
                        onChange={(e) => {
                          const newValues = [...content.values];
                          newValues[idx] = { ...value, title: e.target.value };
                          updateContent('content.values', newValues);
                        }}
                        placeholder="Title"
                      />
                      <Input
                        value={value.description || ''}
                        onChange={(e) => {
                          const newValues = [...content.values];
                          newValues[idx] = { ...value, description: e.target.value };
                          updateContent('content.values', newValues);
                        }}
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Page Content Manager</h2>
          <p className="text-gray-500 text-sm">Edit content for About, Membership, Terms, Privacy pages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seedDefaultContent}>
            <Sparkles className="w-4 h-4 mr-2" /> Seed Defaults
          </Button>
          <Button variant="outline" onClick={() => fetchPageContent(activePage)}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Page Tabs */}
      <Card className="p-4">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PAGE_CONFIGS).map(([slug, config]) => (
            <button
              key={slug}
              onClick={() => setActivePage(slug)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activePage === slug
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Editor */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <Card className="p-8 text-center">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
              <p className="mt-2 text-gray-500">Loading content...</p>
            </Card>
          ) : (
            renderEditor()
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Page Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Page Title</label>
                <Input
                  value={pageContent?.title || ''}
                  onChange={(e) => setPageContent(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Published</span>
                <button
                  onClick={() => setPageContent(prev => ({ ...prev, is_published: !prev?.is_published }))}
                  className={`p-2 rounded-full ${pageContent?.is_published ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  {pageContent?.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                onClick={savePageContent}
                disabled={saving}
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(`/${activePage}`, '_blank')}
              >
                <Globe className="w-4 h-4 mr-2" /> Preview Page
              </Button>
            </div>
          </Card>

          {pageContent?.updated_at && (
            <Card className="p-4 bg-gray-50">
              <p className="text-xs text-gray-500">
                Last updated: {new Date(pageContent.updated_at).toLocaleString()}
                {pageContent.updated_by && ` by ${pageContent.updated_by}`}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageContentManager;
