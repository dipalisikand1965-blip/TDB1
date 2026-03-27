/**
 * CakeBox.jsx
 * Admin panel for all cake-related management
 * Architecture mirrors UnifiedProductBox.jsx
 *
 * Tab 1: Cake Orders       — cake_orders collection
 * Tab 2: Birthday Catalogue — 185 products (Shopify) with shape-tag editing
 * Tab 3: Flavours & Config  — manage flavours, bases, shape chips
 * Tab 4: Breed Illustrations — BreedCakeManager (existing component)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import {
  Search, RefreshCw, ChevronDown, Loader2, Package,
  ClipboardList, Settings, Image, Check, X, Plus, Trash2,
  Calendar, Tag, ShoppingBag,
} from 'lucide-react';
import BreedCakeManager from './BreedCakeManager';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const ADMIN_AUTH = `Basic ${btoa('aditya:lola4304')}`;
const ADMIN_HEADERS = { Authorization: ADMIN_AUTH };

const STATUS_COLORS = {
  pending:           'bg-yellow-100 text-yellow-800',
  confirmed:         'bg-blue-100 text-blue-800',
  baking:            'bg-orange-100 text-orange-800',
  out_for_delivery:  'bg-purple-100 text-purple-800',
  delivered:         'bg-green-100 text-green-800',
  cancelled:         'bg-red-100 text-red-800',
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'baking', 'out_for_delivery', 'delivered', 'cancelled'];
const SHAPE_OPTS = ['all', 'circle', 'bone', 'heart', 'square', 'star', 'paw'];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (s) => {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return s; }
};

// ── Tab 1: Cake Orders ─────────────────────────────────────────────────────────
function CakeOrdersTab() {
  const [orders,   setOrders]   = useState([]);
  const [stats,    setStats]    = useState({ pending: 0, confirmed: 0, delivered: 0, total: 0 });
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState('');  // status filter
  const [page,     setPage]     = useState(0);
  const [total,    setTotal]    = useState(0);
  const [saving,   setSaving]   = useState(null); // order_id being saved
  const [editStatus, setEditStatus] = useState({}); // { [orderId]: newStatus }
  const LIMIT = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, skip: page * LIMIT });
      if (filter) params.set('status', filter);
      const res = await fetch(`${API_URL}/api/admin/cake-orders?${params}`, {
        headers: ADMIN_HEADERS,
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setStats({ pending: data.pending || 0, confirmed: data.confirmed || 0, delivered: data.delivered || 0, total: data.total || 0 });
    } catch (e) { toast.error('Failed to load cake orders'); }
    setLoading(false);
  }, [filter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const saveStatus = async (orderId) => {
    const newStatus = editStatus[orderId];
    if (!newStatus) return;
    setSaving(orderId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/cake-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { ...ADMIN_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Order updated to ${newStatus}`);
      setEditStatus(p => { const n = { ...p }; delete n[orderId]; return n; });
      fetchOrders();
    } catch { toast.error('Update failed'); }
    setSaving(null);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending',   val: stats.pending,   color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Confirmed', val: stats.confirmed, color: 'bg-blue-50 border-blue-200' },
          { label: 'Delivered', val: stats.delivered, color: 'bg-green-50 border-green-200' },
          { label: 'Total',     val: stats.total,     color: 'bg-gray-50 border-gray-200' },
        ].map(s => (
          <Card key={s.label} className={`p-4 border ${s.color}`}>
            <div className="text-2xl font-bold">{s.val}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={() => fetchOrders()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
        <span className="text-sm text-gray-500 ml-auto">{total} orders</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-purple-500" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No cake orders found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-purple-50">
              <tr>
                {['Order', 'Pet', 'Flavour', 'Base', 'Shape', 'Delivery', 'Message', 'Price', 'Status', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold text-purple-900 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-3 font-mono text-xs text-gray-400">{String(o.id || '').slice(-6)}</td>
                  <td className="px-3 py-3 font-medium">{o.pet_name || '—'}</td>
                  <td className="px-3 py-3">{o.flavour || '—'}</td>
                  <td className="px-3 py-3">{o.base || '—'}</td>
                  <td className="px-3 py-3 capitalize">{o.shape || '—'}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmtDate(o.delivery_date)}</td>
                  <td className="px-3 py-3 max-w-[140px] truncate text-gray-500" title={o.message_on_cake}>
                    {o.message_on_cake || '—'}
                  </td>
                  <td className="px-3 py-3 font-semibold">{fmt(o.total_price)}</td>
                  <td className="px-3 py-3">
                    <select
                      value={editStatus[o.id] ?? o.status}
                      onChange={e => setEditStatus(p => ({ ...p, [o.id]: e.target.value }))}
                      className={`border rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[editStatus[o.id] ?? o.status] || ''}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    {editStatus[o.id] && editStatus[o.id] !== o.status && (
                      <Button size="sm" onClick={() => saveStatus(o.id)} disabled={saving === o.id}>
                        {saving === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="px-3 py-1 text-sm">Page {page + 1} / {Math.ceil(total / LIMIT)}</span>
          <Button size="sm" variant="outline" disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Birthday Catalogue ──────────────────────────────────────────────────
function BirthdayCatalogueTab() {
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(false);
  const [search,   setSearch]     = useState('');
  const [shapeFilter, setShapeFilter] = useState('all');
  const [editTag,  setEditTag]    = useState({}); // { [pid]: shape }
  const [saving,   setSaving]     = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/products?category=cakes&limit=200`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch { toast.error('Failed to load products'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const getShapeTag = (p) => {
    const tags = (p.tags || []).map(t => String(t).toLowerCase());
    return SHAPE_OPTS.find(s => tags.includes(s)) || '';
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || (p.name || '').toLowerCase().includes(search.toLowerCase());
    const matchShape  = shapeFilter === 'all' || getShapeTag(p) === shapeFilter;
    return matchSearch && matchShape;
  });

  const saveShapeTag = async (productId) => {
    const shape = editTag[productId] ?? '';
    setSaving(productId);
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/shape-tag`, {
        method: 'PATCH',
        headers: { ...ADMIN_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ shape_tag: shape }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Shape tag updated');
      setEditTag(p => { const n = { ...p }; delete n[productId]; return n; });
      fetchProducts();
    } catch { toast.error('Update failed'); }
    setSaving(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cakes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SHAPE_OPTS.map(s => (
            <button
              key={s}
              onClick={() => setShapeFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                shapeFilter === s ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={fetchProducts}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} / {products.length} cakes</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-purple-500" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map(p => {
            const currentShape = getShapeTag(p);
            const pendingShape = editTag[p.id];
            const displayShape = pendingShape !== undefined ? pendingShape : currentShape;
            return (
              <Card key={p.id} className="overflow-hidden flex flex-col border hover:border-purple-300 transition-colors">
                <div className="aspect-square bg-gray-100 relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎂</div>
                  )}
                  {currentShape && (
                    <span className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium capitalize">
                      {currentShape}
                    </span>
                  )}
                </div>
                <div className="p-2 flex flex-col gap-1.5 flex-1">
                  <div className="text-xs font-semibold leading-tight line-clamp-2">{p.name}</div>
                  {p.original_price > 0 && (
                    <div className="text-xs text-purple-700 font-bold">{fmt(p.original_price)}</div>
                  )}
                  {/* Shape tag editor */}
                  <div className="flex items-center gap-1 mt-auto">
                    <select
                      value={displayShape}
                      onChange={e => setEditTag(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="border rounded text-xs px-1.5 py-1 flex-1 bg-white"
                    >
                      <option value="">No shape</option>
                      {SHAPE_OPTS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {pendingShape !== undefined && pendingShape !== currentShape && (
                      <button
                        onClick={() => saveShapeTag(p.id)}
                        disabled={saving === p.id}
                        className="bg-purple-600 text-white rounded p-1 hover:bg-purple-700"
                      >
                        {saving === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Flavours & Config ───────────────────────────────────────────────────
function FlavoursConfigTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cake-config`, {
        headers: ADMIN_HEADERS,
      });
      if (!res.ok) throw new Error('Failed');
      setConfig(await res.json());
    } catch { toast.error('Failed to load config'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cake-config`, {
        method: 'PUT',
        headers: { ...ADMIN_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Cake config saved');
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const updateFlavour = (i, field, val) => setConfig(c => ({
    ...c,
    flavours: c.flavours.map((f, idx) => idx === i ? { ...f, [field]: val } : f),
  }));
  const removeFlavour = (i) => setConfig(c => ({ ...c, flavours: c.flavours.filter((_, idx) => idx !== i) }));
  const addFlavour = () => setConfig(c => ({ ...c, flavours: [...c.flavours, { name: '', emoji: '🎂', is_allergen: false }] }));

  const updateBase = (i, field, val) => setConfig(c => ({
    ...c,
    bases: c.bases.map((b, idx) => idx === i ? { ...b, [field]: val } : b),
  }));
  const removeBase = (i) => setConfig(c => ({ ...c, bases: c.bases.filter((_, idx) => idx !== i) }));
  const addBase = () => setConfig(c => ({ ...c, bases: [...c.bases, { name: '', description: '' }] }));

  const updateShape = (i, val) => setConfig(c => ({ ...c, shapes: c.shapes.map((s, idx) => idx === i ? val : s) }));
  const removeShape = (i) => setConfig(c => ({ ...c, shapes: c.shapes.filter((_, idx) => idx !== i) }));
  const addShape = () => setConfig(c => ({ ...c, shapes: [...c.shapes, ''] }));

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-purple-500" /></div>;
  if (!config) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Flavours */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Cake Flavours</h3>
          <Button size="sm" variant="outline" onClick={addFlavour}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
        </div>
        <div className="space-y-2">
          {config.flavours.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={f.emoji} onChange={e => updateFlavour(i, 'emoji', e.target.value)} className="w-14 text-center text-lg" />
              <Input value={f.name} onChange={e => updateFlavour(i, 'name', e.target.value)} placeholder="Flavour name" className="flex-1" />
              <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={!!f.is_allergen}
                  onChange={e => updateFlavour(i, 'is_allergen', e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                Allergen
              </label>
              <button onClick={() => removeFlavour(i)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Bases */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Cake Bases</h3>
          <Button size="sm" variant="outline" onClick={addBase}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
        </div>
        <div className="space-y-2">
          {config.bases.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={b.name} onChange={e => updateBase(i, 'name', e.target.value)} placeholder="Base name (e.g. Oats)" className="w-40" />
              <Input value={b.description} onChange={e => updateBase(i, 'description', e.target.value)} placeholder="Description (e.g. Light & wholesome)" className="flex-1" />
              <button onClick={() => removeBase(i)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Shapes */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Shape Chips</h3>
          <Button size="sm" variant="outline" onClick={addShape}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.shapes.map((s, i) => (
            <div key={i} className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-full px-3 py-1">
              <Input
                value={s}
                onChange={e => updateShape(i, e.target.value)}
                className="border-none bg-transparent p-0 w-20 text-sm focus:ring-0 h-auto"
              />
              <button onClick={() => removeShape(i)} className="text-red-400 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Save */}
      <Button onClick={saveConfig} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
        Save Configuration
      </Button>
    </div>
  );
}

// ── Main CakeBox Component ─────────────────────────────────────────────────────
export default function CakeBox() {
  const [tab, setTab] = useState('orders');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="text-2xl">🎂</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cake Box</h2>
          <p className="text-sm text-gray-500">Manage orders, catalogue, config and breed illustrations</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 bg-purple-50 p-1 rounded-lg">
          <TabsTrigger value="orders" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Cake Orders</span>
            <span className="sm:hidden">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="catalogue" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Catalogue</span>
            <span className="sm:hidden">Catalogue</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Flavours & Config</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          <TabsTrigger value="breeds" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Breed Illustrations</span>
            <span className="sm:hidden">Breeds</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <CakeOrdersTab />
        </TabsContent>

        <TabsContent value="catalogue" className="mt-4">
          <BirthdayCatalogueTab />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <FlavoursConfigTab />
        </TabsContent>

        <TabsContent value="breeds" className="mt-4">
          <BreedCakeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
