import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Plus, Trash2, Edit, Save, X, Image, Eye, EyeOff,
  GripVertical, ChevronUp, ChevronDown, RefreshCw
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

const LandingPageManager = ({ getAuthHeader }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [editMode, setEditMode] = useState(null); // 'hero' | 'gallery' | 'text'
  const [newImage, setNewImage] = useState({ image_url: '', alt_text: '', caption: '' });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/landing-page`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch landing page config:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateConfig = async (updates) => {
    setSaving(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/landing-page`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        await fetchConfig();
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    }
    setSaving(false);
  };

  const addHeroImage = async () => {
    if (!newImage.image_url) return;
    setSaving(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/landing-page/hero-images`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: newImage.image_url,
          alt_text: newImage.alt_text || 'Beloved pet',
          order: config?.hero_images?.length || 0,
          is_active: true
        })
      });
      if (response.ok) {
        setNewImage({ image_url: '', alt_text: '', caption: '' });
        await fetchConfig();
      }
    } catch (error) {
      console.error('Failed to add hero image:', error);
    }
    setSaving(false);
  };

  const deleteHeroImage = async (imageId) => {
    if (!confirm('Delete this hero image?')) return;
    setSaving(true);
    try {
      await fetch(`${getApiUrl()}/api/admin/landing-page/hero-images/${imageId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      await fetchConfig();
    } catch (error) {
      console.error('Failed to delete hero image:', error);
    }
    setSaving(false);
  };

  const toggleHeroImageActive = async (image) => {
    setSaving(true);
    try {
      await fetch(`${getApiUrl()}/api/admin/landing-page/hero-images/${image.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...image, is_active: !image.is_active })
      });
      await fetchConfig();
    } catch (error) {
      console.error('Failed to toggle image:', error);
    }
    setSaving(false);
  };

  const addBondImage = async () => {
    if (!newImage.image_url) return;
    setSaving(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/landing-page/bond-gallery`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: newImage.image_url,
          caption: newImage.caption || '',
          is_tall: false,
          is_wide: false,
          order: config?.bond_gallery?.length || 0,
          is_active: true
        })
      });
      if (response.ok) {
        setNewImage({ image_url: '', alt_text: '', caption: '' });
        await fetchConfig();
      }
    } catch (error) {
      console.error('Failed to add bond image:', error);
    }
    setSaving(false);
  };

  const deleteBondImage = async (imageId) => {
    if (!confirm('Delete this gallery image?')) return;
    setSaving(true);
    try {
      await fetch(`${getApiUrl()}/api/admin/landing-page/bond-gallery/${imageId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      await fetchConfig();
    } catch (error) {
      console.error('Failed to delete bond image:', error);
    }
    setSaving(false);
  };

  const toggleBondImageActive = async (image) => {
    setSaving(true);
    try {
      await fetch(`${getApiUrl()}/api/admin/landing-page/bond-gallery/${image.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...image, is_active: !image.is_active })
      });
      await fetchConfig();
    } catch (error) {
      console.error('Failed to toggle image:', error);
    }
    setSaving(false);
  };

  const updateBondImageLayout = async (image, layout) => {
    setSaving(true);
    try {
      await fetch(`${getApiUrl()}/api/admin/landing-page/bond-gallery/${image.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...image, 
          is_tall: layout === 'tall',
          is_wide: layout === 'wide'
        })
      });
      await fetchConfig();
    } catch (error) {
      console.error('Failed to update layout:', error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="landing-page-manager">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Landing Page CMS</h3>
          <p className="text-sm text-gray-500">Manage hero images, bond gallery, and page content</p>
        </div>
        <Button variant="outline" onClick={fetchConfig} disabled={saving}>
          <RefreshCw className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Page Text Content */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Edit className="w-5 h-5 text-purple-600" />
          Page Headlines
        </h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Main Headline</label>
            <Input 
              value={config?.headline || ''} 
              onChange={(e) => setConfig({...config, headline: e.target.value})}
              placeholder="Every Pet Has a Soul"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Subheadline</label>
            <Input 
              value={config?.subheadline || ''} 
              onChange={(e) => setConfig({...config, subheadline: e.target.value})}
              placeholder="We don't just manage pet services..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">CTA Button Text</label>
            <Input 
              value={config?.cta_text || ''} 
              onChange={(e) => setConfig({...config, cta_text: e.target.value})}
              placeholder="Discover Your Pet's Soul"
            />
          </div>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => updateConfig({ 
              headline: config?.headline, 
              subheadline: config?.subheadline, 
              cta_text: config?.cta_text 
            })}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Headlines
          </Button>
        </div>
      </Card>

      {/* Hero Images Section */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-purple-600" />
          Hero Background Images ({config?.hero_images?.length || 0})
          <Badge variant="outline" className="ml-2">Rotates every 5 seconds</Badge>
        </h4>
        
        {/* Add New Hero Image */}
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="Paste image URL here..."
            value={newImage.image_url}
            onChange={(e) => setNewImage({...newImage, image_url: e.target.value})}
            className="flex-1"
          />
          <Input 
            placeholder="Alt text (optional)"
            value={newImage.alt_text}
            onChange={(e) => setNewImage({...newImage, alt_text: e.target.value})}
            className="w-48"
          />
          <Button onClick={addHeroImage} disabled={!newImage.image_url || saving} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {/* Hero Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {config?.hero_images?.map((image, idx) => (
            <div key={image.id} className={`relative group rounded-lg overflow-hidden border-2 ${image.is_active ? 'border-green-500' : 'border-gray-300 opacity-50'}`}>
              <img 
                src={image.image_url} 
                alt={image.alt_text || 'Hero image'} 
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                  onClick={() => toggleHeroImageActive(image)}
                >
                  {image.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-red-400 hover:bg-red-500/20"
                  onClick={() => deleteHeroImage(image.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                #{idx + 1} {image.is_active ? '✓' : '○'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bond Gallery Section */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-pink-600" />
          Bond Gallery ({config?.bond_gallery?.length || 0})
          <Badge variant="outline" className="ml-2">"More Than Pets" Section</Badge>
        </h4>
        
        {/* Add New Gallery Image */}
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="Paste image URL here..."
            value={newImage.image_url}
            onChange={(e) => setNewImage({...newImage, image_url: e.target.value})}
            className="flex-1"
          />
          <Input 
            placeholder="Caption (optional)"
            value={newImage.caption}
            onChange={(e) => setNewImage({...newImage, caption: e.target.value})}
            className="w-48"
          />
          <Button onClick={addBondImage} disabled={!newImage.image_url || saving} className="bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {/* Gallery Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {config?.bond_gallery?.map((image, idx) => (
            <div key={image.id} className={`relative group rounded-lg overflow-hidden border-2 ${image.is_active ? 'border-pink-500' : 'border-gray-300 opacity-50'}`}>
              <img 
                src={image.image_url} 
                alt={image.caption || 'Gallery image'} 
                className="w-full h-28 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20 h-7 w-7"
                    onClick={() => toggleBondImageActive(image)}
                    title={image.is_active ? 'Hide' : 'Show'}
                  >
                    {image.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-red-400 hover:bg-red-500/20 h-7 w-7"
                    onClick={() => deleteBondImage(image.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant={image.is_tall ? 'default' : 'ghost'}
                    className={`text-xs px-2 h-6 ${image.is_tall ? 'bg-blue-600' : 'text-white hover:bg-white/20'}`}
                    onClick={() => updateBondImageLayout(image, image.is_tall ? 'normal' : 'tall')}
                  >
                    Tall
                  </Button>
                  <Button 
                    size="sm" 
                    variant={image.is_wide ? 'default' : 'ghost'}
                    className={`text-xs px-2 h-6 ${image.is_wide ? 'bg-blue-600' : 'text-white hover:bg-white/20'}`}
                    onClick={() => updateBondImageLayout(image, image.is_wide ? 'normal' : 'wide')}
                  >
                    Wide
                  </Button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                {image.caption || `#${idx + 1}`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Preview Link */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-purple-900">Preview Changes</h4>
            <p className="text-sm text-purple-700">View your landing page with the latest images</p>
          </div>
          <Button 
            variant="outline" 
            className="border-purple-300 text-purple-700 hover:bg-purple-100"
            onClick={() => window.open('/', '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Open Landing Page
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LandingPageManager;
