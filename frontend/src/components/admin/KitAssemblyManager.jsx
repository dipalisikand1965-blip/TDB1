/**
 * KitAssemblyManager - Admin panel for managing kit templates and Mira picks
 * 
 * Features:
 * - Create/Edit/Delete kit templates
 * - Manage products in each kit
 * - Preview voice narration before publishing
 * - Control what Mira says vs displays
 * - Mira Picks management with voice scripts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Package, Plus, Edit2, Trash2, Play, Pause, Volume2, VolumeX,
  Save, X, Eye, Sparkles, ShoppingBag, Clock, ChevronRight,
  GripVertical, ArrowUp, ArrowDown, Search, Loader2, Check,
  AlertCircle, RefreshCw, Mic, FileText
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

const KitAssemblyManager = () => {
  const [activeTab, setActiveTab] = useState('kits');
  const [kitTemplates, setKitTemplates] = useState([]);
  const [miraPicks, setMiraPicks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit states
  const [editingKit, setEditingKit] = useState(null);
  const [editingPick, setEditingPick] = useState(null);
  const [showKitEditor, setShowKitEditor] = useState(false);
  const [showPickEditor, setShowPickEditor] = useState(false);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [previewScripts, setPreviewScripts] = useState([]);
  
  // Voice preview
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const synthRef = useRef(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kitsRes, picksRes, categoriesRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/kits/templates?active_only=false`),
        fetch(`${API_URL}/api/admin/kits/mira-picks?active_only=false`),
        fetch(`${API_URL}/api/admin/kits/categories`),
        fetch(`${API_URL}/api/products?limit=500`)
      ]);

      if (kitsRes.ok) {
        const kitsData = await kitsRes.json();
        setKitTemplates(kitsData.templates || []);
      }

      if (picksRes.ok) {
        const picksData = await picksRes.json();
        setMiraPicks(picksData.picks || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Voice preview function
  const speakText = useCallback((text, onEnd) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    const voices = synthRef.current.getVoices();
    const preferredVoices = ['Samantha', 'Victoria', 'Karen', 'Google UK English Female'];
    
    let selectedVoice = null;
    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(v => v.name.includes(voiceName));
      if (selectedVoice) break;
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Preview all voice scripts for a kit
  const handleVoicePreview = async (templateId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/kits/voice-scripts/${templateId}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewScripts(data.scripts || []);
        setCurrentScriptIndex(0);
        setShowVoicePreview(true);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load voice scripts', variant: 'destructive' });
    }
  };

  // Play all scripts sequentially
  const playAllScripts = useCallback(() => {
    if (previewScripts.length === 0) return;
    
    const playNext = (index) => {
      if (index >= previewScripts.length) {
        setIsSpeaking(false);
        setCurrentScriptIndex(0);
        return;
      }
      
      setCurrentScriptIndex(index);
      speakText(previewScripts[index].script, () => playNext(index + 1));
    };
    
    playNext(0);
  }, [previewScripts, speakText]);

  // Save kit template
  const handleSaveKit = async (kit) => {
    try {
      const method = kit.id ? 'PUT' : 'POST';
      const url = kit.id 
        ? `${API_URL}/api/admin/kits/templates/${kit.id}`
        : `${API_URL}/api/admin/kits/templates`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kit)
      });

      if (res.ok) {
        toast({ title: 'Success', description: `Kit template ${kit.id ? 'updated' : 'created'}` });
        fetchData();
        setShowKitEditor(false);
        setEditingKit(null);
      } else {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to save');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Delete kit template
  const handleDeleteKit = async (templateId) => {
    if (!confirm('Are you sure you want to delete this kit template?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/kits/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: 'Deleted', description: 'Kit template removed' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  // Save Mira pick
  const handleSavePick = async (pick) => {
    try {
      const method = pick.id ? 'PUT' : 'POST';
      const url = pick.id 
        ? `${API_URL}/api/admin/kits/mira-picks/${pick.id}`
        : `${API_URL}/api/admin/kits/mira-picks`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pick)
      });

      if (res.ok) {
        toast({ title: 'Success', description: `Mira pick ${pick.id ? 'updated' : 'created'}` });
        fetchData();
        setShowPickEditor(false);
        setEditingPick(null);
      } else {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to save');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Delete Mira pick
  const handleDeletePick = async (pickId) => {
    if (!confirm('Are you sure you want to delete this Mira pick?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/kits/mira-picks/${pickId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: 'Deleted', description: 'Mira pick removed' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="kit-assembly-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-purple-600" />
            Kit Assembly & Mira Picks
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage kit templates and control what Mira recommends
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="kits" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Kit Templates ({kitTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="picks" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Mira Picks ({miraPicks.length})
          </TabsTrigger>
        </TabsList>

        {/* Kit Templates Tab */}
        <TabsContent value="kits">
          <div className="flex justify-between items-center mb-4">
            <Input 
              placeholder="Search kits..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={() => {
              setEditingKit({
                name: '',
                slug: '',
                description: '',
                category: 'travel',
                items: [],
                intro_narration: "Hi! I'm Mira, your pet concierge. Let me show you this amazing kit!",
                outro_narration: "And that's your complete kit! All items hand-picked with love.",
                is_active: true,
                priority: 0
              });
              setShowKitEditor(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Kit Template
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kitTemplates
              .filter(kit => kit.name?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((kit) => (
                <Card key={kit.id} className={`p-4 ${!kit.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{kit.name}</h3>
                      <p className="text-sm text-gray-500">{kit.category}</p>
                    </div>
                    <Badge variant={kit.is_active ? "default" : "secondary"}>
                      {kit.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{kit.description}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <ShoppingBag className="w-3 h-3" />
                    {kit.items?.length || 0} items
                    <span className="mx-1">•</span>
                    Priority: {kit.priority}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleVoicePreview(kit.id)}
                      className="flex-1"
                    >
                      <Volume2 className="w-3 h-3 mr-1" />
                      Preview Voice
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingKit(kit);
                        setShowKitEditor(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteKit(kit.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
          </div>

          {kitTemplates.length === 0 && (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Kit Templates Yet</h3>
              <p className="text-gray-500 mb-4">Create your first kit template to get started</p>
              <Button onClick={() => {
                setEditingKit({
                  name: '',
                  slug: '',
                  description: '',
                  category: 'travel',
                  items: [],
                  intro_narration: "Hi! I'm Mira, your pet concierge. Let me show you this amazing kit!",
                  outro_narration: "And that's your complete kit! All items hand-picked with love.",
                  is_active: true,
                  priority: 0
                });
                setShowKitEditor(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Kit
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Mira Picks Tab */}
        <TabsContent value="picks">
          <div className="flex justify-between items-center mb-4">
            <Input 
              placeholder="Search picks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={() => {
              setEditingPick({
                product_id: '',
                reason: '',
                voice_script: '',
                display_tagline: '',
                priority: 0,
                is_active: true,
                target_categories: []
              });
              setShowPickEditor(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Mira Pick
            </Button>
          </div>

          <div className="space-y-3">
            {miraPicks.map((pick) => (
              <Card key={pick.id} className={`p-4 ${!pick.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {pick.product?.images?.[0] || pick.product?.image ? (
                      <img 
                        src={pick.product?.images?.[0] || pick.product?.image} 
                        alt={pick.product?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {pick.product?.title || pick.product?.name || 'Unknown Product'}
                        </h3>
                        <p className="text-sm text-purple-600 font-medium">{pick.display_tagline}</p>
                      </div>
                      <Badge variant={pick.is_active ? "default" : "secondary"}>
                        {pick.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">{pick.reason}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => speakText(pick.voice_script)}
                        className="h-7 px-2"
                      >
                        <Volume2 className="w-3 h-3 mr-1" />
                        Test Voice
                      </Button>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">Priority: {pick.priority}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingPick(pick);
                        setShowPickEditor(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeletePick(pick.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Voice Script Preview */}
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 text-xs text-purple-600 font-medium mb-1">
                    <Mic className="w-3 h-3" />
                    What Mira Says:
                  </div>
                  <p className="text-sm text-gray-700 italic">&ldquo;{pick.voice_script}&rdquo;</p>
                </div>
              </Card>
            ))}
          </div>

          {miraPicks.length === 0 && (
            <Card className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Mira Picks Yet</h3>
              <p className="text-gray-500 mb-4">Add products for Mira to recommend</p>
              <Button onClick={() => {
                setEditingPick({
                  product_id: '',
                  reason: '',
                  voice_script: '',
                  display_tagline: '',
                  priority: 0,
                  is_active: true,
                  target_categories: []
                });
                setShowPickEditor(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Pick
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Kit Editor Dialog */}
      <KitEditorDialog 
        open={showKitEditor}
        kit={editingKit}
        categories={categories}
        products={products}
        onSave={handleSaveKit}
        onClose={() => {
          setShowKitEditor(false);
          setEditingKit(null);
        }}
        onTestVoice={speakText}
      />

      {/* Pick Editor Dialog */}
      <PickEditorDialog
        open={showPickEditor}
        pick={editingPick}
        products={products}
        onSave={handleSavePick}
        onClose={() => {
          setShowPickEditor(false);
          setEditingPick(null);
        }}
        onTestVoice={speakText}
      />

      {/* Voice Preview Dialog */}
      <Dialog open={showVoicePreview} onOpenChange={setShowVoicePreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-600" />
              Voice Preview
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {previewScripts.map((script, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border transition-all ${
                  currentScriptIndex === idx && isSpeaking 
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={script.type === 'intro' ? 'default' : script.type === 'outro' ? 'secondary' : 'outline'}>
                    {script.type === 'intro' ? '🎬 Intro' : script.type === 'outro' ? '🎉 Outro' : `📦 Item ${script.position}`}
                  </Badge>
                  {script.product_name && (
                    <span className="text-sm text-gray-600">{script.product_name}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 italic">&ldquo;{script.script}&rdquo;</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setCurrentScriptIndex(idx);
                      speakText(script.script);
                    }}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                  <span className="text-xs text-gray-400">
                    ~{Math.round(script.script.split(' ').length * 0.4)}s
                  </span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={stopSpeaking} disabled={!isSpeaking}>
              <Pause className="w-4 h-4 mr-2" />
              Stop
            </Button>
            <Button onClick={playAllScripts} disabled={isSpeaking}>
              <Play className="w-4 h-4 mr-2" />
              Play All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Kit Editor Dialog Component
const KitEditorDialog = ({ open, kit, categories, products, onSave, onClose, onTestVoice }) => {
  const [formData, setFormData] = useState(kit || {});
  const [productSearch, setProductSearch] = useState('');

  // Update form data when kit changes (controlled sync)
  const kitRef = React.useRef(kit);
  if (kit !== kitRef.current) {
    kitRef.current = kit;
    if (kit) setFormData(kit);
  }

  if (!open || !kit) return null;

  const filteredProducts = products.filter(p => 
    (p.title || p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 20);

  const handleAddItem = (product) => {
    const newItem = {
      product_id: product.id,
      position: (formData.items?.length || 0) + 1,
      custom_narration: '',
      product: product
    };
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItemNarration = (index, narration) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, custom_narration: narration } : item
      )
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit Kit Template' : 'Create Kit Template'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Kit Name</Label>
              <Input 
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Cinema Night Kit"
              />
            </div>
            <div>
              <Label>Slug (URL-friendly)</Label>
              <Input 
                value={formData.slug || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="e.g., cinema-night-kit"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this kit includes..."
              rows={2}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Category</Label>
              <Select 
                value={formData.category || 'travel'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Input 
                type="number"
                value={formData.priority || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          {/* Voice Scripts */}
          <Card className="p-4 bg-purple-50 border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Narration
            </h4>
            
            <div className="space-y-4">
              <div>
                <Label>Intro Narration (What Mira says at the start)</Label>
                <div className="flex gap-2">
                  <Textarea 
                    value={formData.intro_narration || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, intro_narration: e.target.value }))}
                    placeholder="Hi! I'm Mira, your pet concierge..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onTestVoice(formData.intro_narration)}
                    className="h-auto"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Outro Narration (What Mira says at the end)</Label>
                <div className="flex gap-2">
                  <Textarea 
                    value={formData.outro_narration || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, outro_narration: e.target.value }))}
                    placeholder="And that's your complete kit!..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onTestVoice(formData.outro_narration)}
                    className="h-auto"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Products */}
          <div>
            <Label className="mb-2 block">Kit Items ({formData.items?.length || 0})</Label>
            
            {/* Search Products */}
            <div className="mb-3">
              <Input 
                placeholder="Search products to add..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              {productSearch && (
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg bg-white">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        handleAddItem(product);
                        setProductSearch('');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden">
                          {(product.images?.[0] || product.image) && (
                            <img src={product.images?.[0] || product.image} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="text-sm">{product.title || product.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">₹{product.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Items */}
            <div className="space-y-2">
              {(formData.items || []).map((item, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                      {(item.product?.images?.[0] || item.product?.image) && (
                        <img src={item.product?.images?.[0] || item.product?.image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.product?.title || item.product?.name || item.product_id}</p>
                      <div className="mt-2">
                        <Label className="text-xs">Custom Voice Script (optional)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            value={item.custom_narration || ''}
                            onChange={(e) => handleUpdateItemNarration(idx, e.target.value)}
                            placeholder="Leave empty for auto-generated narration"
                            className="text-sm h-8"
                          />
                          {item.custom_narration && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onTestVoice(item.custom_narration)}
                              className="h-8 px-2"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 h-8 w-8 p-0"
                      onClick={() => handleRemoveItem(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(formData)}>
            <Save className="w-4 h-4 mr-2" />
            Save Kit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Pick Editor Dialog Component
const PickEditorDialog = ({ open, pick, products, onSave, onClose, onTestVoice }) => {
  const [formData, setFormData] = useState(pick || {});
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    if (pick) setFormData(pick);
  }, [pick]);

  if (!open || !pick) return null;

  const filteredProducts = products.filter(p => 
    (p.title || p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

  const selectedProduct = products.find(p => p.id === formData.product_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit Mira Pick' : 'Create Mira Pick'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Product Selection */}
          <div>
            <Label>Product</Label>
            <Input 
              placeholder="Search for a product..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            {productSearch && (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg bg-white">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, product_id: product.id }));
                      setProductSearch('');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden">
                        {(product.images?.[0] || product.image) && (
                          <img src={product.images?.[0] || product.image} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-sm">{product.title || product.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">₹{product.price}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedProduct && (
              <Card className="mt-2 p-3 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden">
                    {(selectedProduct.images?.[0] || selectedProduct.image) && (
                      <img src={selectedProduct.images?.[0] || selectedProduct.image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedProduct.title || selectedProduct.name}</p>
                    <p className="text-sm text-purple-600">₹{selectedProduct.price}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div>
            <Label>Display Tagline (shown in UI)</Label>
            <Input 
              value={formData.display_tagline || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, display_tagline: e.target.value }))}
              placeholder="e.g., Perfect for movie nights!"
            />
          </div>

          <div>
            <Label>Reason (why Mira recommends this)</Label>
            <Textarea 
              value={formData.reason || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., Great for pets who love interactive toys..."
              rows={2}
            />
          </div>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-600" />
                Voice Script (what Mira says)
              </Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onTestVoice(formData.voice_script)}
                disabled={!formData.voice_script}
              >
                <Play className="w-3 h-3 mr-1" />
                Test Voice
              </Button>
            </div>
            <Textarea 
              value={formData.voice_script || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, voice_script: e.target.value }))}
              placeholder="e.g., I absolutely love this product for your furry friend! It's perfect for..."
              rows={3}
            />
            <p className="text-xs text-purple-600 mt-2">
              Estimated duration: ~{Math.round((formData.voice_script || '').split(' ').length * 0.4)}s
            </p>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Input 
                type="number"
                value={formData.priority || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(formData)} disabled={!formData.product_id}>
            <Save className="w-4 h-4 mr-2" />
            Save Pick
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KitAssemblyManager;
