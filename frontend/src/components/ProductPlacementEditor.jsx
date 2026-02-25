import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Card } from './ui/card';
import { API_URL } from '../utils/api';
import {
  Plus, Trash2, Star, Eye, EyeOff, GripVertical, Loader2,
  ChevronDown, Check
} from 'lucide-react';

const ProductPlacementEditor = ({ productId, getAuthHeader, onSave }) => {
  const [pillars, setPillars] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dropdown states
  const [openPillarDropdown, setOpenPillarDropdown] = useState(null);
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch pillars with categories
        const pillarsRes = await fetch(`${API_URL}/api/admin/pillars`, {
          headers: getAuthHeader()
        });
        if (pillarsRes.ok) {
          const data = await pillarsRes.json();
          setPillars(data.pillars || []);
        }
        
        // Fetch current placements if productId exists
        if (productId) {
          const placementsRes = await fetch(
            `${API_URL}/api/admin/pillars/products/${productId}/placements`,
            { headers: getAuthHeader() }
          );
          if (placementsRes.ok) {
            const data = await placementsRes.json();
            setPlacements(data.placements || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [productId]);

  const addPlacement = () => {
    const newPlacement = {
      pillar_id: '',
      pillar_name: '',
      category_id: '',
      category_name: '',
      is_primary: placements.length === 0, // First one is primary by default
      visible_in_listings: true,
      display_order: placements.length
    };
    setPlacements([...placements, newPlacement]);
  };

  const removePlacement = (index) => {
    const newPlacements = placements.filter((_, i) => i !== index);
    // If we removed the primary, make the first one primary
    if (placements[index].is_primary && newPlacements.length > 0) {
      newPlacements[0].is_primary = true;
    }
    setPlacements(newPlacements);
  };

  const updatePlacement = (index, field, value) => {
    const newPlacements = [...placements];
    newPlacements[index] = { ...newPlacements[index], [field]: value };
    
    // If setting this as primary, unset others
    if (field === 'is_primary' && value) {
      newPlacements.forEach((p, i) => {
        if (i !== index) p.is_primary = false;
      });
    }
    
    setPlacements(newPlacements);
  };

  const selectPillar = (index, pillar) => {
    const newPlacements = [...placements];
    newPlacements[index] = {
      ...newPlacements[index],
      pillar_id: pillar.id,
      pillar_name: pillar.name,
      pillar_slug: pillar.slug,
      category_id: '',
      category_name: '',
      category_slug: ''
    };
    setPlacements(newPlacements);
    setOpenPillarDropdown(null);
  };

  const selectCategory = (index, category) => {
    const newPlacements = [...placements];
    newPlacements[index] = {
      ...newPlacements[index],
      category_id: category.id,
      category_name: category.name,
      category_slug: category.slug
    };
    setPlacements(newPlacements);
    setOpenCategoryDropdown(null);
  };

  const savePlacements = async () => {
    if (!productId) return;
    
    // Validate: each placement needs pillar and category
    const invalid = placements.some(p => !p.pillar_id || !p.category_id);
    if (invalid) {
      alert('Each placement must have both a pillar and category selected');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/pillars/products/${productId}/placements`,
        {
          method: 'PUT',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ placements })
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setPlacements(data.placements);
        onSave?.(data.placements);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save placements');
      }
    } catch (error) {
      console.error('Failed to save placements:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCategoriesForPillar = (pillarId) => {
    const pillar = pillars.find(p => p.id === pillarId);
    return pillar?.categories || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Pillar Placements</Label>
          <p className="text-xs text-gray-500">Assign this product to multiple pillars and categories</p>
        </div>
        <Button size="sm" variant="outline" onClick={addPlacement}>
          <Plus className="w-4 h-4 mr-1" /> Add Placement
        </Button>
      </div>

      {placements.length === 0 ? (
        <Card className="p-6 text-center border-dashed">
          <p className="text-gray-500 mb-3">No placements yet</p>
          <Button size="sm" onClick={addPlacement}>
            <Plus className="w-4 h-4 mr-1" /> Add First Placement
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {placements.map((placement, index) => (
            <Card key={index} className={`p-3 ${placement.is_primary ? 'ring-2 ring-purple-500' : ''}`}>
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div className="pt-2 cursor-move text-gray-400">
                  <GripVertical className="w-4 h-4" />
                </div>
                
                {/* Pillar & Category Selection */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {/* Pillar Dropdown */}
                  <div className="relative">
                    <Label className="text-xs text-gray-500 mb-1 block">Pillar</Label>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                      onClick={() => setOpenPillarDropdown(openPillarDropdown === index ? null : index)}
                    >
                      <span className={placement.pillar_name ? '' : 'text-gray-400'}>
                        {placement.pillar_name || 'Select pillar...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {openPillarDropdown === index && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                        {pillars.map(pillar => (
                          <button
                            key={pillar.id}
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
                            onClick={() => selectPillar(index, pillar)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: pillar.color }}
                            />
                            {pillar.name}
                            {placement.pillar_id === pillar.id && (
                              <Check className="w-4 h-4 ml-auto text-green-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Category Dropdown */}
                  <div className="relative">
                    <Label className="text-xs text-gray-500 mb-1 block">Category</Label>
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm hover:bg-gray-50 ${!placement.pillar_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => placement.pillar_id && setOpenCategoryDropdown(openCategoryDropdown === index ? null : index)}
                      disabled={!placement.pillar_id}
                    >
                      <span className={placement.category_name ? '' : 'text-gray-400'}>
                        {placement.category_name || 'Select category...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {openCategoryDropdown === index && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                        {getCategoriesForPillar(placement.pillar_id).map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
                            onClick={() => selectCategory(index, cat)}
                          >
                            {cat.name}
                            {placement.category_id === cat.id && (
                              <Check className="w-4 h-4 ml-auto text-green-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Options */}
                <div className="flex items-center gap-2 pt-6">
                  {/* Primary Badge */}
                  <button
                    type="button"
                    onClick={() => updatePlacement(index, 'is_primary', !placement.is_primary)}
                    className={`p-1.5 rounded ${placement.is_primary ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                    title={placement.is_primary ? 'Primary placement' : 'Set as primary'}
                  >
                    <Star className={`w-4 h-4 ${placement.is_primary ? 'fill-current' : ''}`} />
                  </button>
                  
                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => updatePlacement(index, 'visible_in_listings', !placement.visible_in_listings)}
                    className={`p-1.5 rounded ${placement.visible_in_listings ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    title={placement.visible_in_listings ? 'Visible in listings' : 'Hidden from listings'}
                  >
                    {placement.visible_in_listings ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removePlacement(index)}
                    className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
                    title="Remove placement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Placement Info */}
              <div className="mt-2 ml-7 flex items-center gap-2 text-xs">
                {placement.is_primary && (
                  <Badge className="bg-purple-100 text-purple-700">Primary</Badge>
                )}
                {!placement.visible_in_listings && (
                  <Badge variant="outline" className="text-gray-500">Hidden from listings</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Save Button */}
      {productId && placements.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button onClick={savePlacements} disabled={saving} className="bg-purple-600">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Placements
          </Button>
        </div>
      )}
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-purple-600 text-purple-600" /> Primary placement (used for breadcrumbs)
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-green-600" /> Visible in pillar/category listings
        </span>
        <span className="flex items-center gap-1">
          <EyeOff className="w-3 h-3 text-gray-400" /> Hidden (internal mapping only)
        </span>
      </div>
    </div>
  );
};

export default ProductPlacementEditor;
