import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import ProductBoxEditor from './ProductBoxEditor';
import { 
  Sparkles, Heart, Gift, Search, Filter, Check, X, RefreshCw,
  PawPrint, Palette, Crown, Star, Package, Eye, Image, Play,
  Square, Loader2, Cloud, Upload, Edit, DollarSign, Boxes, Tag,
  Download, FileUp, Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import CloudinaryUploader from './CloudinaryUploader';

const PILLARS = ['celebrate','play','go','care','dine','learn','farewell','emergency','paperwork','adopt','shop','advisory'];
const AUTH_HEADER = { 'Authorization': `Basic ${btoa('aditya:lola4304')}`, 'Content-Type': 'application/json' };

/**
 * SoulProductsManager
 * 
 * Admin panel for managing Soul-Level Personalization:
 * - Tag products as Soul Made / Soul Selected / Soul Gifted
 * - View and manage Soul Archetypes
 * - Preview personalization settings
 */

const PRODUCT_TIERS = {
  soul_made: {
    label: 'Soul Made',
    emoji: '✨',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    description: 'Fully personalized with name + breed illustration'
  },
  soul_selected: {
    label: 'Soul Selected',
    emoji: '🎯',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Recommended based on Soul Profile'
  },
  soul_gifted: {
    label: 'Soul Gifted',
    emoji: '🎁',
    color: 'bg-pink-100 text-pink-700 border-pink-300',
    description: 'Occasion-led products for pet parents'
  },
  standard: {
    label: 'Standard',
    emoji: '📦',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    description: 'Regular product without personalization'
  }
};

const SoulProductsManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [archetypes, setArchetypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkTier, setBulkTier] = useState('');
  const [computingArchetypes, setComputingArchetypes] = useState(false);
  
  // Mockup generation state
  const [mockupStats, setMockupStats] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [breedProducts, setBreedProducts] = useState([]);
  const [loadingMockups, setLoadingMockups] = useState(false);
  const [generationLimit, setGenerationLimit] = useState(10);
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('');
  const [hasImageFilter, setHasImageFilter] = useState('all');

  // Export state
  const [exportingCsv, setExportingCsv] = useState(false);

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const importFileRef = useRef(null);

  // Breed Products CRUD state
  const [crudProducts, setCrudProducts] = useState([]);
  const [crudTotal, setCrudTotal] = useState(0);
  const [crudPage, setCrudPage] = useState(1);
  const [crudLoading, setCrudLoading] = useState(false);
  const [crudSearch, setCrudSearch] = useState('');
  const [crudBreed, setCrudBreed] = useState('');
  const [crudPillar, setCrudPillar] = useState('');
  const [crudType, setCrudType] = useState('');
  const [crudHasImage, setCrudHasImage] = useState('all');
  const [editBreedProd, setEditBreedProd] = useState(null);
  const [editBreedProdOpen, setEditBreedProdOpen] = useState(false);
  const [savingBreedProd, setSavingBreedProd] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const CRUD_PAGE_SIZE = 20;

  // New Product Type state
  const [newTypeModal, setNewTypeModal] = useState(false);
  const [newTypeData, setNewTypeData] = useState({
    product_type: '', name_template: '{breed} {product_type}',
    price: 0, pillars: [], breeds: 'all', description: '', generate_mockups: false
  });
  const [creatingType, setCreatingType] = useState(false);

  // Add Single Product state
  const [addProductModal, setAddProductModal] = useState(false);
  const [addProductData, setAddProductData] = useState({ name:'', breed:'', pillar:'', product_type:'', price:0, description:'', image_url:'', active:true });
  const [savingSingleProduct, setSavingSingleProduct] = useState(false);

  // AI Mockup Generation status
  const [mockupGenStatus, setMockupGenStatus] = useState(null);

  // Cloud storage state
  const [cloudStatus, setCloudStatus] = useState(null);
  const [convertingToCloud, setConvertingToCloud] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Open edit modal for a product
  const openEditModal = (product) => {
    setEditingProduct({
      ...product,
      stock: product.stock || 0,
      variants: product.variants || [],
      sale_price: product.sale_price || null,
      description: product.description || '',
      soul_tier: product.soul_tier || 'standard'
    });
    setEditModalOpen(true);
  };

  // Save product changes
  const saveProductChanges = async () => {
    if (!editingProduct) return;
    
    setSavingProduct(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/soul-made/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('aditya:lola4304')}`
        },
        body: JSON.stringify({
          stock: editingProduct.stock,
          variants: editingProduct.variants,
          sale_price: editingProduct.sale_price,
          description: editingProduct.description,
          soul_tier: editingProduct.soul_tier,
          price: editingProduct.price
        })
      });
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Product updated successfully!' });
        setEditModalOpen(false);
        // Refresh products list
        if (activeSubTab === 'products') {
          fetchProducts();
        } else {
          fetchBreedProducts(true);
        }
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' });
    }
    setSavingProduct(false);
  };

  // Add variant
  const addVariant = () => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      variants: [...(editingProduct.variants || []), { name: '', price_modifier: 0 }]
    });
  };

  // Remove variant
  const removeVariant = (index) => {
    if (!editingProduct) return;
    const newVariants = [...editingProduct.variants];
    newVariants.splice(index, 1);
    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  // Update variant
  const updateVariant = (index, field, value) => {
    if (!editingProduct) return;
    const newVariants = [...editingProduct.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  // ── Export CSV ───────────────────────────────────────────────────────────
  const exportMockupsCsv = async (pendingOnly = false) => {
    setExportingCsv(true);
    try {
      const params = new URLSearchParams({ limit: 5000 });
      if (selectedBreed)       params.append('breed', selectedBreed);
      if (selectedProductType) params.append('category', selectedProductType);
      if (selectedPillar)      params.append('pillar', selectedPillar);
      if (pendingOnly) params.append('has_mockup', 'false');
      else if (hasImageFilter === 'yes') params.append('has_mockup', 'true');
      else if (hasImageFilter === 'no')  params.append('has_mockup', 'false');

      const res  = await fetch(`${API_URL}/api/admin/breed-products?${params}`);
      const data = await res.json();
      const rows = data.products || [];

      const headers = ['breed','product_name','product_type','pillar','all_pillars','sub_category','category','price','has_image','image_url','is_mockup'];
      const csv = [
        headers.join(','),
        ...rows.map(p => [
          p.breed||'', `"${(p.name||'').replace(/"/g,'""')}"`,
          p.product_type||'', p.pillar||'',
          `"${(p.pillars||[]).join('|')}"`,
          p.sub_category||'', p.category||'',
          p.price||0,
          (p.cloudinary_url||p.mockup_url) ? 'YES':'NO',
          p.cloudinary_url||p.mockup_url||'',
          p.is_mockup ? 'true':'false'
        ].join(','))
      ].join('\n');

      const fname = `soul_${pendingOnly?'pending':'products'}${selectedBreed?'_'+selectedBreed:''}${selectedPillar?'_'+selectedPillar:''}.csv`;
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([csv], {type:'text/csv'})), download: fname
      });
      a.click(); URL.revokeObjectURL(a.href);
      toast({ title: `Downloaded ${rows.length} rows` });
    } catch { toast({ title:'Export failed', variant:'destructive' }); }
    setExportingCsv(false);
  };

  // ── Import CSV ───────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResults(null);
    try {
      const text = await importFile.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
      const rows = lines.slice(1).map(line => {
        const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
        const obj = {};
        headers.forEach((h,i) => { obj[h] = (vals[i]||'').replace(/^"|"$/g,'').trim(); });
        return obj;
      }).filter(r => r.breed || r.product_type);

      const res = await fetch(`${API_URL}/api/admin/breed-products/import`, {
        method: 'POST', headers: AUTH_HEADER,
        body: JSON.stringify({ rows })
      });
      const result = await res.json();
      setImportResults(result);
      if (result.success) {
        toast({ title: `Import complete: ${result.inserted} new, ${result.updated} updated` });
        fetchCrudProducts();
      }
    } catch (e) {
      toast({ title: 'Import failed', description: e.message, variant: 'destructive' });
    }
    setImportLoading(false);
  };

  // ── CRUD: fetch breed products ───────────────────────────────────────────
  const fetchCrudProducts = useCallback(async (page = crudPage) => {
    setCrudLoading(true);
    try {
      const params = new URLSearchParams({
        limit: CRUD_PAGE_SIZE,
        skip: (page - 1) * CRUD_PAGE_SIZE,
      });
      if (crudBreed)  params.append('breed', crudBreed);
      if (crudType)   params.append('category', crudType);
      if (crudPillar) params.append('pillar', crudPillar);
      if (crudSearch) params.append('search', crudSearch);
      if (crudHasImage === 'yes') params.append('has_mockup', 'true');
      if (crudHasImage === 'no')  params.append('has_mockup', 'false');

      const res  = await fetch(`${API_URL}/api/admin/breed-products?${params}`);
      const data = await res.json();
      setCrudProducts(data.products || []);
      setCrudTotal(data.total || 0);
    } catch { /* silent */ }
    setCrudLoading(false);
  }, [crudPage, crudBreed, crudType, crudPillar, crudSearch, crudHasImage]);

  useEffect(() => { if (activeSubTab === 'crud') fetchCrudProducts(crudPage); }, [activeSubTab, crudPage, crudBreed, crudType, crudPillar, crudSearch, crudHasImage]);

  const saveBreedProd = async () => {
    if (!editBreedProd) return;
    setSavingBreedProd(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/breed-products/${editBreedProd.id || editBreedProd._id}`, {
        method: 'PUT', headers: AUTH_HEADER,
        body: JSON.stringify(editBreedProd)
      });
      if (res.ok) {
        toast({ title: 'Saved!' });
        setEditBreedProdOpen(false);
        setEditBreedProd(null);
        fetchCrudProducts(crudPage);
      } else throw new Error('Save failed');
    } catch { toast({ title: 'Save failed', variant: 'destructive' }); }
    setSavingBreedProd(false);
  };

  const deleteBreedProd = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/breed-products/${id}`, {
        method: 'DELETE', headers: AUTH_HEADER
      });
      if (res.ok) { toast({ title: 'Deleted' }); fetchCrudProducts(crudPage); }
      else throw new Error();
    } catch { toast({ title: 'Delete failed', variant: 'destructive' }); }
    setDeletingId(null);
  };

  // ── Add Single Breed Product ──────────────────────────────────────────────
  const createSingleProduct = async () => {
    if (!addProductData.name || !addProductData.breed || !addProductData.pillar || !addProductData.product_type) {
      toast({ title: 'Name, Breed, Pillar and Product Type are required', variant: 'destructive' }); return;
    }
    setSavingSingleProduct(true);
    try {
      const id = `breed-${addProductData.breed.toLowerCase().replace(/\s+/g,'_')}-${addProductData.product_type.toLowerCase().replace(/\s+/g,'_')}`;
      const row = { ...addProductData, id, is_mockup: true, active: true, created_at: new Date().toISOString() };
      const res = await fetch(`${API_URL}/api/admin/breed-products/import`, {
        method: 'POST', headers: AUTH_HEADER,
        body: JSON.stringify({ rows: [row] })
      });
      const data = await res.json();
      if (data.upserted !== undefined || data.success) {
        toast({ title: `Product "${addProductData.name}" added to Soul Picks!` });
        setAddProductModal(false);
        setAddProductData({ name:'', breed:'', pillar:'', product_type:'', price:0, description:'', image_url:'', active:true });
        fetchBreedProducts(true);
        fetchMockupStats();
      } else throw new Error(data.error || 'Failed');
    } catch (e) { toast({ title: e.message, variant: 'destructive' }); }
    setSavingSingleProduct(false);
  };

  // ── New Product Type ─────────────────────────────────────────────────────
  const createNewProductType = async () => {
    if (!newTypeData.product_type || newTypeData.pillars.length === 0) {
      toast({ title: 'Fill in product type and at least one pillar', variant: 'destructive' }); return;
    }
    setCreatingType(true);
    try {
      // Step 1: Seed the product entries across breeds
      const res = await fetch(`${API_URL}/api/admin/breed-products/seed-type`, {
        method: 'POST', headers: AUTH_HEADER,
        body: JSON.stringify(newTypeData)
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: `Created ${data.seeded} new products across ${data.total_breeds} breeds!` });

        // Step 2: If generate_mockups is checked, trigger AI image generation
        if (newTypeData.generate_mockups) {
          try {
            const genRes = await fetch(`${API_URL}/api/mockups/generate-product-type`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_type: newTypeData.product_type,
                breeds: newTypeData.breeds === 'all' ? null : [newTypeData.breeds],
                pillars: newTypeData.pillars,
                price: newTypeData.price,
                name_template: newTypeData.name_template,
                description: newTypeData.description
              })
            });
            const genData = await genRes.json();
            toast({ title: `AI mockup generation started for ${genData.breeds} breeds`, description: 'This runs in the background. Check status in the AI Mockups tab.' });
            pollMockupGenStatus();
          } catch (e) {
            toast({ title: 'Seeded but mockup generation failed', description: e.message, variant: 'destructive' });
          }
        }

        setNewTypeModal(false);
        setNewTypeData({ product_type:'', name_template:'{breed} {product_type}', price:0, pillars:[], breeds:'all', description:'', generate_mockups: false });
        fetchMockupStats();
      } else throw new Error(data.error || 'Failed');
    } catch (e) { toast({ title: e.message, variant: 'destructive' }); }
    setCreatingType(false);
  };

  // Poll mockup generation status
  const pollMockupGenStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/mockups/mockup-gen-status`);
        if (res.ok) {
          const status = await res.json();
          setMockupGenStatus(status);
          if (!status.running && status.completed_at) {
            clearInterval(interval);
            fetchMockupStats();
            toast({ title: 'AI Mockup Generation Complete', description: `Generated ${status.generated} mockups (${status.failed} failed)` });
          }
        }
      } catch {}
    }, 5000);
    setTimeout(() => clearInterval(interval), 60 * 60 * 1000);
  };

  // Fetch products
  useEffect(() => {
    fetchProducts();
    fetchArchetypes();
    fetchCategories();
    fetchMockupStats(); // Fetch mockup stats on mount
    fetchCloudStatus(); // Fetch cloud status
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/products?limit=500`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchArchetypes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/soul-archetype/archetypes`);
      if (res.ok) {
        const data = await res.json();
        setArchetypes(data.archetypes || []);
      }
    } catch (error) {
      console.error('Failed to fetch archetypes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      // Fallback categories
      setCategories(['cakes', 'breed-cakes', 'accessories', 'treats', 'hampers', 'dognuts', 'frozen-treats']);
    }
  };

  // Mockup functions
  const fetchMockupStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/stats`);
      if (res.ok) {
        const data = await res.json();
        setMockupStats(data);
        setGenerationStatus(data.generation_status);
      }
    } catch (error) {
      console.error('Failed to fetch mockup stats:', error);
    }
  }, []);

  const fetchBreedProducts = useCallback(async (hasMockup = null) => {
    setLoadingMockups(true);
    try {
      let url = `${API_URL}/api/mockups/breed-products?limit=50`; // Reduced for faster loading
      if (selectedBreed) url += `&breed=${selectedBreed}`;
      if (selectedProductType) url += `&product_type=${selectedProductType}`;
      if (hasMockup !== null) url += `&has_mockup=${hasMockup}`;
      
      console.log('[SoulProducts] Fetching breed products:', url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[SoulProducts] Got breed products:', data.products?.length || 0);
        setBreedProducts(data.products || []);
      } else {
        console.error('[SoulProducts] API error:', res.status);
        setBreedProducts([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[SoulProducts] Request timed out');
      } else {
        console.error('[SoulProducts] Failed to fetch breed products:', error);
      }
      setBreedProducts([]);
    } finally {
      setLoadingMockups(false);
    }
  }, [selectedBreed, selectedProductType]);

  const seedBreedProducts = async () => {
    try {
      console.log('[SoulProducts] Seeding breed products...');
      const res = await fetch(`${API_URL}/api/mockups/seed-products`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        console.log('[SoulProducts] Seed result:', data);
        toast({ title: 'Products Seeded', description: `Created ${data.total || data.seeded || 0} breed products` });
        // Refresh both stats and products list
        await fetchMockupStats();
        await fetchBreedProducts(true);
      } else {
        const error = await res.json();
        console.error('[SoulProducts] Seed error:', error);
        toast({ title: 'Error', description: error.detail || 'Failed to seed products', variant: 'destructive' });
      }
    } catch (error) {
      console.error('[SoulProducts] Seed exception:', error);
      toast({ title: 'Error', description: 'Failed to seed products', variant: 'destructive' });
    }
  };

  const startMockupGeneration = async () => {
    try {
      console.log('[SoulProducts] Starting mockup generation...');
      const body = {
        limit: generationLimit > 0 ? generationLimit : null,
        breed_filter: selectedBreed || null,
        product_type_filter: selectedProductType || null,
        pillar: selectedPillar || null,    // ← pillar-aware
        tag_pillar: selectedPillar || null, // ← tags generated products with pillar
      };
      
      const res = await fetch(`${API_URL}/api/mockups/generate-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[SoulProducts] Generation started:', data);
        toast({ title: 'Generation Started', description: data.message || 'Starting mockup generation...' });
        // Start polling for status
        pollGenerationStatus();
      } else {
        const err = await res.json();
        console.error('[SoulProducts] Generation error:', err);
        toast({ title: 'Error', description: err.detail || 'Failed to start generation', variant: 'destructive' });
      }
    } catch (error) {
      console.error('[SoulProducts] Generation exception:', error);
      toast({ title: 'Error', description: 'Failed to start generation', variant: 'destructive' });
    }
  };

  const stopMockupGeneration = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/stop-generation`, { method: 'POST' });
      if (res.ok) {
        toast({ title: 'Stopping', description: 'Generation will stop after current item' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to stop generation', variant: 'destructive' });
    }
  };

  const generateBreedCakes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/generate-breed-cakes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: '🎂 Breed Cake Art Started', description: `Generating flat-vector illustrations for ${data.breeds?.length || '?'} breeds. Check status below.` });
        pollGenerationStatus();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.detail || 'Failed to start breed cake generation', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start breed cake generation', variant: 'destructive' });
    }
  };

  const pollGenerationStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/mockups/status`);
        if (res.ok) {
          const status = await res.json();
          setGenerationStatus(status);
          
          // Stop polling when generation is complete
          if (!status.running && status.completed_at) {
            clearInterval(interval);
            fetchMockupStats();
            fetchBreedProducts(true);
            toast({ 
              title: 'Generation Complete', 
              description: `Generated ${status.generated} mockups` 
            });
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 3000);
    
    // Clear interval after 30 minutes max
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  // Load mockup data when switching to mockups tab
  useEffect(() => {
    if (activeSubTab === 'mockups') {
      console.log('[SoulProducts] Mockups tab active, fetching data...');
      fetchMockupStats();
      fetchBreedProducts(true); // Fetch products with mockups
      fetchCloudStatus(); // Check cloud storage status
      
      // Auto-refresh stats every 30 seconds when on mockups tab
      const refreshInterval = setInterval(() => {
        fetchMockupStats();
      }, 30000);
      
      return () => clearInterval(refreshInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]); // Only trigger on tab change

  // Fetch cloud storage status
  const fetchCloudStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/cloud-status`);
      if (res.ok) {
        const data = await res.json();
        setCloudStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch cloud status:', error);
    }
  };

  // Convert mockups to cloud storage (Cloudinary)
  const convertToCloud = async () => {
    setConvertingToCloud(true);
    try {
      const res = await fetch(`${API_URL}/api/mockups/batch-convert-to-cloud?limit=10`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: '☁️ Cloud Conversion',
          description: `Converted ${data.converted} mockups. ${data.remaining} remaining.`,
          duration: 5000
        });
        fetchCloudStatus();
        fetchBreedProducts(true);
      } else {
        toast({
          title: 'Error',
          description: data.detail || 'Failed to convert',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert to cloud',
        variant: 'destructive'
      });
    }
    setConvertingToCloud(false);
  };

  const updateProductTier = async (productId, tier) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}/soul-tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soul_tier: tier })
      });
      
      if (res.ok) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, soul_tier: tier } : p
        ));
        toast({ title: 'Updated', description: `Product tier set to ${PRODUCT_TIERS[tier]?.label}` });
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update product tier', variant: 'destructive' });
    }
  };

  const bulkUpdateTier = async () => {
    if (!bulkTier || selectedProducts.length === 0) return;
    
    try {
      const res = await fetch(`${API_URL}/api/products/bulk-soul-tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_ids: selectedProducts,
          soul_tier: bulkTier 
        })
      });
      
      if (res.ok) {
        setProducts(prev => prev.map(p => 
          selectedProducts.includes(p.id) ? { ...p, soul_tier: bulkTier } : p
        ));
        setSelectedProducts([]);
        setBulkTier('');
        toast({ title: 'Bulk Update Complete', description: `${selectedProducts.length} products updated` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Bulk update failed', variant: 'destructive' });
    }
  };

  const computeAllArchetypes = async () => {
    setComputingArchetypes(true);
    try {
      const res = await fetch(`${API_URL}/api/soul-archetype/compute-all`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: 'Archetypes Computed', 
          description: `${data.successful} pets processed` 
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to compute archetypes', variant: 'destructive' });
    }
    setComputingArchetypes(false);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || p.soul_tier === tierFilter;
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesTier && matchesCategory;
  });

  // Stats
  const tierStats = {
    soul_made: products.filter(p => p.soul_tier === 'soul_made').length,
    soul_selected: products.filter(p => p.soul_tier === 'soul_selected').length,
    soul_gifted: products.filter(p => p.soul_tier === 'soul_gifted').length,
    standard: products.filter(p => !p.soul_tier || p.soul_tier === 'standard').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Soul Products
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage Soul-Level Personalization tiers and archetypes
          </p>
        </div>
        <Button 
          onClick={() => {
            fetchProducts();
            if (activeSubTab === 'mockups') {
              fetchMockupStats();
              fetchBreedProducts(true);
            }
          }} 
          variant="outline" 
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {[
          { id: 'products', label: 'Product Tiers', icon: Package },
          { id: 'archetypes', label: 'Soul Archetypes', icon: Crown },
          { id: 'mockups', label: 'AI Mockups', icon: Image },
          { id: 'crud', label: 'Breed Products', icon: Boxes },
          { id: 'preview', label: 'Preview', icon: Eye }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? 'default' : 'ghost'}
            className={activeSubTab === tab.id ? 'bg-purple-600' : ''}
            onClick={() => setActiveSubTab(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
            {tab.id === 'mockups' && mockupStats && (
              <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                {mockupStats.products_with_mockups || 0}/{mockupStats.total_products}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Product Tiers Tab */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(PRODUCT_TIERS).map(([key, tier]) => (
              <Card 
                key={key}
                className={`p-4 cursor-pointer transition-all ${tierFilter === key ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => setTierFilter(tierFilter === key ? 'all' : key)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{tier.emoji}</span>
                  <span className="text-2xl font-bold">{tierStats[key]}</span>
                </div>
                <p className="text-sm font-medium mt-2">{tier.label}</p>
                <p className="text-xs text-gray-500">{tier.description}</p>
              </Card>
            ))}
          </div>

          {/* Filters & Bulk Actions */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-purple-700 font-medium">
                  {selectedProducts.length} selected
                </span>
                <select
                  value={bulkTier}
                  onChange={(e) => setBulkTier(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="">Set tier...</option>
                  {Object.entries(PRODUCT_TIERS).map(([key, tier]) => (
                    <option key={key} value={key}>{tier.emoji} {tier.label}</option>
                  ))}
                </select>
                <Button size="sm" onClick={bulkUpdateTier} disabled={!bulkTier}>
                  Apply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedProducts([])}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Products List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
              <p className="mt-2 text-gray-500">Loading products...</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(filteredProducts.map(p => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Soul Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.slice(0, 50).map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, product.id]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/40'} 
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{product.category || 'uncategorized'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">₹{product.price || 0}</td>
                      <td className="px-4 py-3">
                        <Badge className={PRODUCT_TIERS[product.soul_tier]?.color || PRODUCT_TIERS.standard.color}>
                          {PRODUCT_TIERS[product.soul_tier]?.emoji || '📦'} {PRODUCT_TIERS[product.soul_tier]?.label || 'Standard'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={product.soul_tier || 'standard'}
                          onChange={(e) => updateProductTier(product.id, e.target.value)}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          {Object.entries(PRODUCT_TIERS).map(([key, tier]) => (
                            <option key={key} value={key}>{tier.emoji} {tier.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEditModal(product)}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length > 50 && (
                <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
                  Showing 50 of {filteredProducts.length} products. Use filters to narrow results.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Soul Archetypes Tab */}
      {activeSubTab === 'archetypes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Soul Archetypes</h3>
              <p className="text-sm text-gray-500">
                Archetypes are derived from existing Soul Profile data - no new questions needed
              </p>
            </div>
            <Button 
              onClick={computeAllArchetypes} 
              disabled={computingArchetypes}
              className="bg-purple-600"
            >
              {computingArchetypes ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Compute All Archetypes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archetypes.map((archetype) => (
              <Card key={archetype.key} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{archetype.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{archetype.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{archetype.description}</p>
                    
                    <div className="mt-3 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Copy Tone:</span>
                        <p className="text-xs text-gray-700">{archetype.copy_tone}</p>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-gray-500">Celebration Style:</span>
                        <p className="text-xs text-gray-700">{archetype.celebration_style}</p>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-gray-500">Color Palette:</span>
                        <div className="flex gap-1 mt-1">
                          {archetype.color_palette?.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {archetypes.length === 0 && (
            <Card className="p-8 text-center">
              <Crown className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No archetypes loaded</p>
              <Button onClick={fetchArchetypes} variant="outline" className="mt-4">
                Load Archetypes
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Preview Tab - SHOW ACTUAL PRODUCT MOCKUPS */}
      {/* ── BREED PRODUCTS CRUD TAB ─────────────────────────────────── */}
      {activeSubTab === 'crud' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Boxes className="w-5 h-5 text-purple-600"/>Breed Products — Full CRUD</h3>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => exportMockupsCsv(false)} disabled={exportingCsv} variant="outline" size="sm" className="border-blue-500 text-blue-700">
                  {exportingCsv ? <Loader2 className="w-3 h-3 mr-1 animate-spin"/> : <Download className="w-3 h-3 mr-1"/>} Export CSV
                </Button>
                <Button onClick={() => { setImportModalOpen(true); setImportResults(null); }} variant="outline" size="sm" className="border-green-500 text-green-700">
                  <FileUp className="w-3 h-3 mr-1"/> Import CSV
                </Button>
                <Button onClick={() => setAddProductModal(true)} size="sm" variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
                  <Plus className="w-3 h-3 mr-1"/> Add Single Product
                </Button>
                <Button onClick={() => setNewTypeModal(true)} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-3 h-3 mr-1"/> New Product Type
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              <Input placeholder="Search name..." value={crudSearch} onChange={e => { setCrudSearch(e.target.value); setCrudPage(1); }} className="text-sm"/>
              <select value={crudBreed} onChange={e => { setCrudBreed(e.target.value); setCrudPage(1); }} className="px-2 py-1 border rounded text-sm">
                <option value="">All Breeds</option>
                {mockupStats?.by_breed && Object.keys(mockupStats.by_breed).sort().map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={crudPillar} onChange={e => { setCrudPillar(e.target.value); setCrudPage(1); }} className="px-2 py-1 border rounded text-sm">
                <option value="">All Pillars</option>
                {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={crudType} onChange={e => { setCrudType(e.target.value); setCrudPage(1); }} className="px-2 py-1 border rounded text-sm">
                <option value="">All Types</option>
                {mockupStats?.by_product_type && Object.keys(mockupStats.by_product_type).sort().map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={crudHasImage} onChange={e => { setCrudHasImage(e.target.value); setCrudPage(1); }} className="px-2 py-1 border rounded text-sm">
                <option value="all">All Images</option>
                <option value="yes">Has Image</option>
                <option value="no">No Image</option>
              </select>
            </div>

            {/* Table */}
            {crudLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600"/></div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Image','Breed','Name','Type','Pillar','Price','Active','Actions'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {crudProducts.map((p, i) => {
                        const img = p.cloudinary_url || p.mockup_url || '';
                        const isValid = img && img.split('/').pop().startsWith('breed-');
                        return (
                          <tr key={p.id || i} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              {img ? (
                                <div className={`w-10 h-10 rounded overflow-hidden border-2 ${isValid ? 'border-green-300' : 'border-amber-300'}`}>
                                  <img src={img} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'}/>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                                  <AlertCircle className="w-4 h-4 text-gray-400"/>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium">{p.breed}</td>
                            <td className="px-3 py-2 max-w-[160px] truncate">{p.name}</td>
                            <td className="px-3 py-2 text-gray-500">{p.product_type}</td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">{(p.pillars||[p.pillar]||[]).join('|')}</span>
                            </td>
                            <td className="px-3 py-2">₹{p.price||0}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${p.is_active||p.active ? 'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                                {p.is_active||p.active ? 'Active':'Off'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                <button onClick={() => { setEditBreedProd({...p}); setEditBreedProdOpen(true); }}
                                  className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Edit">
                                  <Edit className="w-3.5 h-3.5"/>
                                </button>
                                <button onClick={() => deleteBreedProd(p.id||p._id)}
                                  disabled={deletingId === (p.id||p._id)}
                                  className="p-1 rounded hover:bg-red-50 text-red-500" title="Delete">
                                  {deletingId === (p.id||p._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {crudProducts.length === 0 && (
                        <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No products found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                  <span>{crudTotal} total • page {crudPage} of {Math.max(1, Math.ceil(crudTotal/CRUD_PAGE_SIZE))}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setCrudPage(p => Math.max(1, p-1))} disabled={crudPage <= 1}
                      className="p-1 rounded border disabled:opacity-40 hover:bg-gray-50">
                      <ChevronLeft className="w-4 h-4"/>
                    </button>
                    <button onClick={() => setCrudPage(p => p+1)} disabled={crudPage >= Math.ceil(crudTotal/CRUD_PAGE_SIZE)}
                      className="p-1 rounded border disabled:opacity-40 hover:bg-gray-50">
                      <ChevronRight className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── PREVIEW TAB ─────────────────────────────────────────────── */}
      {activeSubTab === 'preview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Product Mockup Gallery</h3>
            <p className="text-sm text-gray-500 mb-6">
              Pre-generated product mockups with soulful watercolor breed illustrations ON the products
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Labrador Bandana */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/52f9dd45e1396df1a234bf04168e038e598abd236ed34cbf59d3e7ccfacf1198.png"
                    alt="Labrador Bandana"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-purple-100 text-purple-700 text-xs mb-2">✨ Bandana</Badge>
                  <h5 className="font-semibold text-sm">Labrador Bandana</h5>
                </div>
              </Card>

              {/* Golden Retriever Mug */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/5fda07d915de44befc32bfbdac210125b50d02df9f961e853ffeff772f44fffc.png"
                    alt="Golden Retriever Mug"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-amber-100 text-amber-700 text-xs mb-2">☕ Mug</Badge>
                  <h5 className="font-semibold text-sm">Golden Retriever Mug</h5>
                </div>
              </Card>

              {/* Beagle Keychain */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/04829434fe81993b845c310a46f812971287759a5db4074726ce16d59f1d8e6f.png"
                    alt="Beagle Keychain"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-gray-100 text-gray-700 text-xs mb-2">🔑 Keychain</Badge>
                  <h5 className="font-semibold text-sm">Beagle Keychain</h5>
                </div>
              </Card>

              {/* German Shepherd Welcome Mat */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/c98be36b80db466eb4a345c37eefde1c46ce763368b006280587db7ac8247035.png"
                    alt="German Shepherd Welcome Mat"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-green-100 text-green-700 text-xs mb-2">🚪 Welcome Mat</Badge>
                  <h5 className="font-semibold text-sm">German Shepherd Mat</h5>
                </div>
              </Card>

              {/* Pug Bowl */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/d77bbfb80c70573ef21644b98a2ad918f8e8bf0a009a1e5fcbb22e38772b4f46.png"
                    alt="Pug Bowl"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-blue-100 text-blue-700 text-xs mb-2">🥣 Bowl</Badge>
                  <h5 className="font-semibold text-sm">Pug Food Bowl</h5>
                </div>
              </Card>

              {/* Indie Framed Portrait */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/73d0a0f28ceb2f4f875d211f40790c2c5ba2714f677454e1b69bb9867aec52e8.png"
                    alt="Indie Framed Portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-pink-100 text-pink-700 text-xs mb-2">🖼️ Portrait</Badge>
                  <h5 className="font-semibold text-sm">Indie Portrait "Mojo"</h5>
                </div>
              </Card>

              {/* Husky Tote Bag */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/0969f7cea74048859883596e3126e9883d5c1cca5f09967b7a81466e76caa123.png"
                    alt="Husky Tote Bag"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-indigo-100 text-indigo-700 text-xs mb-2">👜 Tote Bag</Badge>
                  <h5 className="font-semibold text-sm">Husky "Dog Mom" Bag</h5>
                </div>
              </Card>

              {/* Shih Tzu Birthday Cake */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/4b425e629050d4582426787426b19bf7e6b234fd88bee7e1bc3d751f2461ad74.png"
                    alt="Shih Tzu Birthday Cake"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-rose-100 text-rose-700 text-xs mb-2">🎂 Birthday Cake</Badge>
                  <h5 className="font-semibold text-sm">Shih Tzu "Luna" Cake</h5>
                </div>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>✨ How it works:</strong> When a customer is logged in and their pet's breed matches a product, 
                these mockups automatically show on product cards - giving them a preview of their personalized product.
              </p>
            </div>
          </Card>

          {/* Logged-in Experience Preview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Logged-In Experience</h3>
            <div className="bg-gray-900 text-white rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <PawPrint className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-purple-300">Shopping for</p>
                  <p className="text-lg font-bold">Mojo</p>
                </div>
                <Badge className="bg-purple-500/30 text-purple-200 ml-auto">
                  🦋 Social Butterfly
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">✨ Products personalized for Mojo</p>
                <p className="text-gray-300">🎯 Recommendations based on Soul Profile</p>
                <p className="text-gray-300">🎁 Gift suggestions for Mojo's humans</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI Mockups Tab */}
      {activeSubTab === 'mockups' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          {mockupStats ? (
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-3xl font-bold text-purple-700">{mockupStats.total_products}</div>
                <div className="text-sm text-gray-600">Total Breed Products</div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="text-3xl font-bold text-green-700">{mockupStats.products_with_mockups || 0}</div>
                <div className="text-sm text-gray-600">With Mockups</div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="text-3xl font-bold text-amber-700">{mockupStats.products_without_mockups || 0}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-3xl font-bold text-blue-700">{mockupStats.completion_percentage?.toFixed(1) || 0}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <Card key={i} className="p-4 bg-gray-50 animate-pulse">
                  <div className="h-9 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </Card>
              ))}
            </div>
          )}

          {/* Generation Controls */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Mockup Generation
            </h3>
            
            {/* Generation Status */}
            {generationStatus?.running && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-800 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generation in Progress
                  </span>
                  <Button size="sm" variant="outline" onClick={stopMockupGeneration}>
                    <Square className="w-3 h-3 mr-1" /> Stop
                  </Button>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(generationStatus.progress / generationStatus.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-blue-700 mt-1">
                  <span>Progress: {generationStatus.progress}/{generationStatus.total}</span>
                  <span>Generated: {generationStatus.generated} | Failed: {generationStatus.failed}</span>
                </div>
                {generationStatus.current_product && (
                  <div className="text-xs text-blue-600 mt-1">
                    Current: {generationStatus.current_product}
                  </div>
                )}
              </div>
            )}

            {/* New Product Type Mockup Generation Status */}
            {mockupGenStatus?.running && (
              <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-purple-800 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI Mockup Image Generation
                  </span>
                  <Button size="sm" variant="outline" onClick={async () => {
                    await fetch(`${API_URL}/api/mockups/stop-mockup-gen`, { method: 'POST' });
                    toast({ title: 'Stopping generation...' });
                  }}>
                    <Square className="w-3 h-3 mr-1" /> Stop
                  </Button>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${mockupGenStatus.total > 0 ? (mockupGenStatus.generated + mockupGenStatus.failed) / mockupGenStatus.total * 100 : 0}%` }}/>
                </div>
                <div className="flex justify-between text-xs text-purple-700 mt-1">
                  <span>{mockupGenStatus.current || 'Processing...'}</span>
                  <span>Done: {mockupGenStatus.generated} | Failed: {mockupGenStatus.failed} / {mockupGenStatus.total}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Limit (0 = all)</label>
                <Input 
                  type="number" 
                  value={generationLimit}
                  onChange={(e) => setGenerationLimit(parseInt(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Filter by Breed</label>
                <select 
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Breeds</option>
                  {mockupStats?.by_breed && Object.keys(mockupStats.by_breed).sort().map(breed => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Filter by Type</label>
                <select 
                  value={selectedProductType}
                  onChange={(e) => setSelectedProductType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Types</option>
                  {mockupStats?.by_product_type && Object.keys(mockupStats.by_product_type).sort().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {/* ── PILLAR SELECTOR ── */}
              <div>
                <label className="text-xs font-medium text-purple-600 block mb-1">🎯 Target Pillar</label>
                <select
                  value={selectedPillar}
                  onChange={e => setSelectedPillar(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-sm font-medium"
                >
                  <option value="">All Pillars</option>
                  {PILLARS.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                  ))}
                </select>
                {selectedPillar && (
                  <p className="text-xs text-purple-500 mt-1">
                    ✦ Generated products tagged with pillar="{selectedPillar}"
                  </p>
                )}
              </div>
              {/* ── HAS IMAGE FILTER ── */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Has Image</label>
                <select
                  value={hasImageFilter}
                  onChange={e => setHasImageFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">Yes — with image</option>
                  <option value="no">No — pending</option>
                </select>
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <Button onClick={startMockupGeneration} disabled={generationStatus?.running} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="w-4 h-4 mr-2" />
                  {selectedPillar ? `Generate → ${selectedPillar.charAt(0).toUpperCase()+selectedPillar.slice(1)}` : 'Generate'}
                </Button>
                <Button
                  onClick={generateBreedCakes}
                  disabled={generationStatus?.running}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  title="Generate flat-vector yappy-style cake illustrations for all breeds"
                >
                  <span className="mr-1">🎂</span> Breed Cake Art
                </Button>
                <Button onClick={seedBreedProducts} variant="outline">Seed Products</Button>
                <Button onClick={() => setNewTypeModal(true)} variant="outline" className="border-green-500 text-green-700">
                  <Plus className="w-4 h-4 mr-1" /> New Type
                </Button>
                <Button onClick={() => exportMockupsCsv(false)} disabled={exportingCsv} variant="outline" className="border-blue-500 text-blue-700">
                  {exportingCsv ? <Loader2 className="w-4 h-4 mr-1 animate-spin"/> : <Download className="w-4 h-4 mr-1"/>}
                  Export CSV
                </Button>
                <Button onClick={() => exportMockupsCsv(true)} disabled={exportingCsv} variant="outline" className="border-amber-500 text-amber-700">
                  <Download className="w-4 h-4 mr-1"/> Pending 705
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Note:</strong> Soul Made products are auto-seeded on deployment via MasterSync.
              <br />Mockup generation takes ~30-60 seconds per image. Click Generate to start batch processing.
              <br /><strong>Filters apply to both Export CSV and Generate.</strong>
            </div>
            
            {/* Cloud Storage Status */}
            {cloudStatus && (
              <div className={`mt-4 p-4 rounded-lg border ${cloudStatus.cloudinary_configured ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Cloud className="w-4 h-4" />
                      Cloud Storage (Cloudinary)
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {cloudStatus.cloudinary_configured 
                        ? `Connected to ${cloudStatus.cloud_name}` 
                        : '⚠️ Not configured - Set CLOUDINARY env vars'}
                    </p>
                    {cloudStatus.mockup_stats && (
                      <div className="text-xs mt-2 space-x-4">
                        <span className="text-blue-600">☁️ Cloud: {cloudStatus.mockup_stats.cloudinary_stored}</span>
                        <span className="text-amber-600">📦 Base64: {cloudStatus.mockup_stats.base64_stored}</span>
                        <span className="text-gray-600">Total: {cloudStatus.mockup_stats.total_with_mockups}</span>
                      </div>
                    )}
                  </div>
                  {cloudStatus.cloudinary_configured && cloudStatus.mockup_stats?.base64_stored > 0 && (
                    <Button 
                      onClick={convertToCloud}
                      disabled={convertingToCloud}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {convertingToCloud ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Converting...</>
                      ) : (
                        <><Upload className="w-4 h-4 mr-2" /> Convert to Cloud (10)</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Generated Mockups Gallery */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Mockups</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fetchBreedProducts(true)}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
                <Button size="sm" variant="ghost" onClick={() => fetchBreedProducts(false)}>
                  Show Pending
                </Button>
              </div>
            </div>

            {loadingMockups ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                <p className="mt-2 text-gray-500">Loading mockups...</p>
              </div>
            ) : breedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No mockups generated yet</p>
                <p className="text-sm">Click "Generate" to start creating AI mockups</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {breedProducts.map(product => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100">
                      {product.mockup_url ? (
                        <div className="relative group">
                          <img 
                            src={product.mockup_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Download button on hover */}
                          <a
                            href={(product.cloudinary_url || product.mockup_url || '').replace('/upload/', '/upload/fl_attachment/')}
                            download={`${product.breed_name || product.product_type}.webp`}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded p-1 shadow"
                            title="Download illustration"
                            onClick={e => e.stopPropagation()}
                          >
                            <Download className="w-3 h-3 text-gray-700" />
                          </a>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <Badge className={`text-[10px] mb-1 ${product.mockup_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.product_type}
                      </Badge>
                      <h5 className="font-medium text-xs truncate">{product.breed_name}</h5>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SOUL PRODUCT EDITOR — Full ProductBoxEditor with tabs, media upload */}
      {editingProduct && (
        <ProductBoxEditor
          product={{ ...editingProduct, id: editingProduct.id||editingProduct._id, collection:'breed_products' }}
          open={editModalOpen}
          onClose={() => { setEditModalOpen(false); setEditingProduct(null); }}
          onSave={async () => { setEditModalOpen(false); await fetchProducts(); }}
        />
      )}

      {/* ── EDIT BREED PRODUCT MODAL ───────────────────────────── */}
      <Dialog open={editBreedProdOpen} onOpenChange={setEditBreedProdOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="w-4 h-4"/>Edit Breed Product</DialogTitle></DialogHeader>
          {editBreedProd && (
            <div className="space-y-3 py-2">
              {[
                {label:'Name',       field:'name',         type:'text'},
                {label:'Breed',      field:'breed',        type:'text'},
                {label:'Product Type',field:'product_type',type:'text'},
                {label:'Price (₹)',  field:'price',        type:'number'},
                {label:'Image URL',  field:'cloudinary_url',type:'text'},
                {label:'Sub Category',field:'sub_category',type:'text'},
              ].map(({label,field,type}) => (
                <div key={field}>
                  <Label className="text-xs">{label}</Label>
                  <Input type={type} value={editBreedProd[field]||''} className="text-sm mt-1"
                    onChange={e => setEditBreedProd(p => ({...p, [field]: type==='number'?parseFloat(e.target.value)||0 : e.target.value}))}/>
                </div>
              ))}
              <div>
                <Label className="text-xs">Pillar</Label>
                <select value={editBreedProd.pillar||''} onChange={e => setEditBreedProd(p => ({...p, pillar: e.target.value}))}
                  className="w-full mt-1 px-3 py-2 border rounded text-sm">
                  <option value="">— none —</option>
                  {PILLARS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ep-active" checked={!!(editBreedProd.is_active||editBreedProd.active)}
                  onChange={e => setEditBreedProd(p => ({...p, is_active: e.target.checked, active: e.target.checked}))}/>
                <label htmlFor="ep-active" className="text-sm">Active</label>
                <input type="checkbox" id="ep-mockup" className="ml-4" checked={!!editBreedProd.is_mockup}
                  onChange={e => setEditBreedProd(p => ({...p, is_mockup: e.target.checked}))}/>
                <label htmlFor="ep-mockup" className="text-sm">Is Mockup</label>
              </div>
              {editBreedProd.cloudinary_url && (
                <div className="rounded-lg overflow-hidden border w-24 h-24">
                  <img src={editBreedProd.cloudinary_url} alt="" className="w-full h-full object-cover"/>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditBreedProdOpen(false)}>Cancel</Button>
            <Button onClick={saveBreedProd} disabled={savingBreedProd} className="bg-purple-600 hover:bg-purple-700">
              {savingBreedProd ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Check className="w-4 h-4 mr-2"/>}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── IMPORT CSV MODAL ───────────────────────────────────── */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileUp className="w-4 h-4"/>Import Breed Products CSV</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">Upload a CSV with columns: <code className="bg-gray-100 px-1 rounded text-xs">breed, product_type, name, pillar, price, cloudinary_url, active</code></p>
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors"
              onClick={() => importFileRef.current?.click()}>
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2"/>
              <p className="text-sm text-gray-600">{importFile ? importFile.name : 'Click to select CSV file'}</p>
              <input ref={importFileRef} type="file" accept=".csv" className="hidden"
                onChange={e => setImportFile(e.target.files[0])}/>
            </div>
            {importResults && (
              <div className={`p-3 rounded-lg text-sm ${importResults.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {importResults.success
                  ? `✅ ${importResults.inserted} inserted, ${importResults.updated} updated (${importResults.total} total)`
                  : `❌ ${importResults.error}`}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={!importFile||importLoading} className="bg-green-600 hover:bg-green-700">
              {importLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <FileUp className="w-4 h-4 mr-2"/>}Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD SINGLE SOUL PRODUCT MODAL ────────────────────────── */}
      <Dialog open={addProductModal} onOpenChange={setAddProductModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4 text-green-600"/>Add Single Soul Product</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500 pb-1">Add one product directly to a breed + pillar. It will appear in Soul Picks immediately.</p>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Product Name *</Label>
                <Input placeholder="e.g. Indie Rain Jacket" value={addProductData.name} className="mt-1 text-sm"
                  onChange={e => setAddProductData(d => ({...d, name: e.target.value}))}/>
              </div>
              <div>
                <Label className="text-xs">Breed * (snake_case)</Label>
                <Input placeholder="e.g. indie, labrador" value={addProductData.breed} className="mt-1 text-sm"
                  onChange={e => setAddProductData(d => ({...d, breed: e.target.value.toLowerCase().replace(/\s+/g,'_')}))}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Pillar *</Label>
                <select value={addProductData.pillar} onChange={e => setAddProductData(d => ({...d, pillar: e.target.value}))}
                  className="w-full mt-1 px-3 py-2 border rounded text-sm">
                  <option value="">Select pillar…</option>
                  {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Product Type * (snake_case)</Label>
                <Input placeholder="e.g. rain_jacket" value={addProductData.product_type} className="mt-1 text-sm"
                  onChange={e => setAddProductData(d => ({...d, product_type: e.target.value.toLowerCase().replace(/\s+/g,'_')}))}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Price (₹)</Label>
                <Input type="number" value={addProductData.price} className="mt-1 text-sm"
                  onChange={e => setAddProductData(d => ({...d, price: parseFloat(e.target.value)||0}))}/>
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={addProductData.active}
                    onChange={e => setAddProductData(d => ({...d, active: e.target.checked}))}
                    className="rounded"/>
                  <span className="text-sm font-medium">Active (visible in Soul Picks)</span>
                </label>
              </div>
            </div>
            <div>
              <Label className="text-xs">Image URL (Cloudinary)</Label>
              <Input placeholder="https://res.cloudinary.com/duoapcx1p/image/upload/..." value={addProductData.image_url} className="mt-1 text-sm"
                onChange={e => setAddProductData(d => ({...d, image_url: e.target.value}))}/>
              {addProductData.image_url && <img src={addProductData.image_url} alt="preview" className="mt-2 w-20 h-20 object-cover rounded border"/>}
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Brief product description…" value={addProductData.description} className="mt-1 text-sm" rows={2}
                onChange={e => setAddProductData(d => ({...d, description: e.target.value}))}/>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddProductModal(false)}>Cancel</Button>
            <Button onClick={createSingleProduct} disabled={savingSingleProduct||!addProductData.name||!addProductData.breed||!addProductData.pillar||!addProductData.product_type}
              className="bg-green-600 hover:bg-green-700">
              {savingSingleProduct ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Plus className="w-4 h-4 mr-2"/>}
              Add to Soul Picks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NEW PRODUCT TYPE MODAL ─────────────────────────────── */}
      <Dialog open={newTypeModal} onOpenChange={setNewTypeModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4 text-purple-600"/>Create New Product Type</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">This will seed the new product type across selected breeds. Optionally generate AI mockup images.</p>
            <div>
              <Label className="text-xs">Product Type ID (snake_case)</Label>
              <Input placeholder="e.g. rain_jacket" value={newTypeData.product_type} className="mt-1 text-sm"
                onChange={e => setNewTypeData(d => ({...d, product_type: e.target.value.toLowerCase().replace(/\s+/g,'_')}))}/>
            </div>
            <div>
              <Label className="text-xs">Name Template</Label>
              <Input placeholder="{breed} {product_type}" value={newTypeData.name_template} className="mt-1 text-sm"
                onChange={e => setNewTypeData(d => ({...d, name_template: e.target.value}))}/>
              <p className="text-xs text-gray-400 mt-0.5">Use {"{"+"breed}"} and {"{"+"product_type}"} as placeholders</p>
            </div>
            <div>
              <Label className="text-xs">Price (₹)</Label>
              <Input type="number" value={newTypeData.price} className="mt-1 text-sm"
                onChange={e => setNewTypeData(d => ({...d, price: parseFloat(e.target.value)||0}))}/>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Brief description of this product type" value={newTypeData.description} className="mt-1 text-sm"
                onChange={e => setNewTypeData(d => ({...d, description: e.target.value}))}/>
            </div>
            <div>
              <Label className="text-xs">Pillars (select one or more)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PILLARS.map(p => (
                  <button key={p} type="button"
                    onClick={() => setNewTypeData(d => ({...d, pillars: d.pillars.includes(p) ? d.pillars.filter(x=>x!==p) : [...d.pillars, p]}))}
                    className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${newTypeData.pillars.includes(p) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Breeds</Label>
              <select value={typeof newTypeData.breeds === 'string' ? newTypeData.breeds : 'custom'}
                onChange={e => setNewTypeData(d => ({...d, breeds: e.target.value}))}
                className="w-full mt-1 px-3 py-2 border rounded text-sm">
                <option value="all">All Breeds (50 breeds)</option>
                {mockupStats?.by_breed && Object.keys(mockupStats.by_breed).sort().map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newTypeData.generate_mockups}
                  onChange={e => setNewTypeData(d => ({...d, generate_mockups: e.target.checked}))}
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"/>
                <div>
                  <span className="text-sm font-medium text-purple-800">Generate AI Mockup Images</span>
                  <p className="text-xs text-purple-600 mt-0.5">AI will create professional product mockups for each breed. Runs in background.</p>
                </div>
              </label>
            </div>

            {/* Mockup generation status */}
            {mockupGenStatus?.running && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600"/>
                  <span className="text-xs font-medium text-blue-800">Generating mockups...</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${mockupGenStatus.total > 0 ? (mockupGenStatus.generated + mockupGenStatus.failed) / mockupGenStatus.total * 100 : 0}%` }}/>
                </div>
                <p className="text-xs text-blue-600 mt-1">{mockupGenStatus.current || `${mockupGenStatus.generated}/${mockupGenStatus.total} done`}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewTypeModal(false)}>Cancel</Button>
            <Button onClick={createNewProductType} disabled={creatingType||!newTypeData.product_type||newTypeData.pillars.length===0}
              className="bg-purple-600 hover:bg-purple-700">
              {creatingType ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2"/>}
              {newTypeData.generate_mockups ? 'Create & Generate' : 'Seed Across Breeds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoulProductsManager;
