/**
 * CakeBox.jsx
 * The Doggy Company — Admin CakeBox
 * Complete cake management system — 5 tabs
 *
 * Tab 1: 🎂 Cake Orders    — all orders, status pipeline, filter
 * Tab 2: 📦 Catalogue      — 163 breed cakes + 40 TDB physical cakes
 * Tab 3: 🏪 TDB Products   — pupcakes, treats, hampers, frozen
 * Tab 4: ⚙️ Config         — flavours, bases, shapes, sizes, cities
 * Tab 5: 🎨 Illustrations  — breed portraits (BreedCakeManager)
 */

import { useState, useEffect, useCallback } from 'react';
import ProductBoxEditor from './ProductBoxEditor';
import BreedCakeManager from './BreedCakeManager';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ── Admin token helper ────────────────────────────────────────────────────────
// Mirrors the exact pattern in Admin.jsx (lines 1156-1164):
// Try localStorage first, fall back to hardcoded credentials so the browser
// never gets a bare 401 and shows its native Basic Auth popup.
function getAdminHeaders() {
  const auth = localStorage.getItem('adminAuth') || btoa('aditya:lola4304');
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  };
}

// ── Colour palette ────────────────────────────────────────────────────────────
const P = {
  purple:  '#4A1B6D',
  purpleL: '#9B59B6',
  purpleXL:'#C39BD3',
  pink:    '#E91E8C',
  gold:    '#C9973A',
  goldL:   '#F0C060',
  dark:    '#1A0A2E',
  cream:   '#FAF7FF',
  border:  '#E8D5F5',
  muted:   '#7A6890',
  red:     '#EF4444',
  green:   '#22C55E',
  amber:   '#F59E0B',
};

// ── STATUS CONFIG ─────────────────────────────────────────────────────────────
const ORDER_STATUSES = [
  { id: 'pending',          label: 'Pending',          color: P.amber,  bg: '#FEF3C7' },
  { id: 'confirmed',        label: 'Confirmed',        color: P.purpleL,bg: '#F5EEFF' },
  { id: 'baking',           label: 'Baking',           color: P.pink,   bg: '#FCE4F4' },
  { id: 'out_for_delivery', label: 'Out for Delivery', color: P.gold,   bg: '#FEF9EC' },
  { id: 'delivered',        label: 'Delivered',        color: P.green,  bg: '#DCFCE7' },
  { id: 'cancelled',        label: 'Cancelled',        color: P.red,    bg: '#FEE2E2' },
];

const SHAPES    = ['Circle', 'Bone', 'Heart', 'Square', 'Star', 'Paw'];
const SEASONS   = ['Birthday', 'Diwali', 'Valentine', 'Christmas', 'Holi', 'Easter', 'Pride'];
const CITIES    = ['Bangalore', 'Mumbai', 'Gurgaon', 'Delhi'];
const FLAVOURS  = [
  'Banana', 'Carrot', 'Chicken', 'Mutton', 'Peanut Butter',
  'Blueberry', 'Coconut Cream', 'Strawberry', 'Fish & Salmon', 'Pumpkin',
];
const BASES     = ['Oats', 'Ragi'];
const ALLERGENS = ['Chicken', 'Beef', 'Fish', 'Dairy', 'Gluten', 'Egg', 'Nuts'];

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = ORDER_STATUSES.find(s => s.id === status) || ORDER_STATUSES[0];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
    }}>
      {cfg.label}
    </span>
  );
}

function ShapeBadge({ shape }) {
  if (!shape) return <span style={{ color: P.muted, fontSize: 12 }}>—</span>;
  return (
    <span style={{
      background: P.purpleXL + '33', color: P.purple,
      border: `1px solid ${P.purpleXL}`,
      borderRadius: 20, padding: '2px 10px',
      fontSize: 11, fontWeight: 700,
    }}>
      {shape}
    </span>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${P.border}`,
      borderRadius: 12, padding: '14px 16px', minWidth: 80,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || P.purple }}>{value}</div>
      <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Toast({ msg, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: P.dark, color: '#fff', borderRadius: 20,
      padding: '10px 20px', fontSize: 13, fontWeight: 700,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 99999,
      whiteSpace: 'nowrap',
    }}>
      {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — CAKE ORDERS
// ══════════════════════════════════════════════════════════════════════════════
function CakeOrdersTab() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [totals, setTotals]             = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [toast, setToast]               = useState('');
  const PER_PAGE = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/admin/cake-orders?limit=200`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      const res = await fetch(url, { headers: getAdminHeaders() });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotals({
        total: data.total || 0,
        pending: data.pending || 0,
        confirmed: data.confirmed || 0,
        delivered: data.delivered || 0,
      });
    } catch { setOrders([]); }
    setLoading(false);
  }, [statusFilter, dateFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_URL}/api/admin/cake-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      setToast(`✅ Status updated to ${newStatus}`);
      fetchOrders();
    } catch { setToast('❌ Update failed'); }
  };

  const filtered = orders.filter(o =>
    !search ||
    o.pet_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.id?.toLowerCase().includes(search.toLowerCase())
  );

  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div>
      <Toast msg={toast} onClose={() => setToast('')} />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard value={totals.total || 0}     label="Total Orders"  color={P.purple} />
        <StatCard value={totals.pending || 0}   label="Pending"       color={P.amber} />
        <StatCard value={totals.confirmed || 0} label="Confirmed"     color={P.purpleL} />
        <StatCard value={totals.delivered || 0} label="Delivered"     color={P.green} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search orders…"
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13, minWidth: 200 }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13 }}
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13 }}
        />
        <button
          onClick={fetchOrders}
          style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 13 }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: P.muted }}>Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎂</div>
          <div style={{ color: P.muted }}>No cake orders yet</div>
        </div>
      ) : (
        <>
          <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', gap: 12, padding: '10px 16px', background: P.cream, borderBottom: `1px solid ${P.border}`, fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <div>Order</div><div>Pet</div><div>Delivery</div><div>Total</div><div>Status</div><div>Actions</div>
            </div>

            {paginated.map((order, i) => (
              <div key={order.id}>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', gap: 12, padding: '12px 16px', borderBottom: i < paginated.length - 1 ? `1px solid ${P.border}` : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = P.cream}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{order.product_name || '—'}</div>
                    <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{order.id}</div>
                    <div style={{ fontSize: 11, color: P.purple, marginTop: 2 }}>
                      {order.flavour && `${order.flavour} · `}{order.base && `${order.base} base · `}{order.size}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{order.pet_name}</div>
                    <div style={{ fontSize: 11, color: P.muted }}>{order.pet_breed}</div>
                    {order.pet_allergies?.length > 0 && (
                      <div style={{ fontSize: 10, color: P.red, marginTop: 2 }}>⚠ No {order.pet_allergies.join(', ')}</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{order.delivery_date || '—'}</div>
                    <div style={{ fontSize: 11, color: P.muted }}>{order.delivery_time}</div>
                    <div style={{ fontSize: 11, color: P.muted }}>{order.delivery_type}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: P.purple }}>
                    {order.total_price ? `₹${order.total_price.toLocaleString('en-IN')}` : '—'}
                  </div>
                  <div><StatusBadge status={order.status} /></div>
                  <div onClick={e => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      style={{ width: '100%', padding: '5px 6px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 11, cursor: 'pointer' }}
                    >
                      {ORDER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedOrder === order.id && (
                  <div style={{ padding: '12px 16px 16px', background: '#FAF5FF', borderBottom: `1px solid ${P.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        ['Product', order.product_name],
                        ['Flavour', order.flavour],
                        ['Base', order.base],
                        ['Size', order.size],
                        ['Shape', order.shape],
                        ['Name on cake', order.pet_name_on_cake],
                        ['Message', order.message_on_cake || 'None'],
                        ['Delivery date', order.delivery_date],
                        ['Delivery time', order.delivery_time],
                        ['Delivery type', order.delivery_type],
                        ['Customer', order.user_email],
                        ['Order ID', order.id],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 13, color: P.dark }}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: page === 1 ? '#f5f5f5' : '#fff', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>← Prev</button>
              <span style={{ padding: '6px 12px', fontSize: 12, color: P.muted }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: page === totalPages ? '#f5f5f5' : '#fff', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — CATALOGUE
// ══════════════════════════════════════════════════════════════════════════════
function CatalogueTab() {
  const [cakes, setCakes]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [shapeFilter, setShapeFilter]   = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [editProduct, setEditProduct]   = useState(null);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState('');
  const [stats, setStats]               = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const PER_PAGE = 20;

  const fetchCakes = useCallback(async () => {
    setLoading(true);
    try {
      const [masterRes, physicalRes] = await Promise.all([
        fetch(`${API_URL}/api/product-box/products?category=cakes&limit=300`, { headers: getAdminHeaders() }),
        fetch(`${API_URL}/api/admin/products?category=breed-cakes&limit=100`, { headers: getAdminHeaders() }),
      ]);
      const masterData   = masterRes.ok   ? await masterRes.json()   : {};
      const physicalData = physicalRes.ok ? await physicalRes.json() : {};

      const masterCakes   = (masterData.products || []).map(p => ({ ...p, _source: 'master' }));
      const physicalCakes = (physicalData.products || []).map(p => ({ ...p, _source: 'physical' }));
      const all = [...masterCakes, ...physicalCakes];
      setCakes(all);

      const shapeCounts = {};
      all.forEach(c => {
        const shape = c.shape || (c.tags || []).find(t => SHAPES.map(s => s.toLowerCase()).includes(t?.toLowerCase())) || '';
        if (shape) shapeCounts[shape] = (shapeCounts[shape] || 0) + 1;
      });
      setStats({ total: all.length, shapes: shapeCounts });
    } catch { setCakes([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCakes(); }, [fetchCakes]);

  // Fix 1: Archive — PATCH to set archived, not DELETE
  const archiveProduct = async (product) => {
    if (!window.confirm(`Archive "${product.name}"? It will be hidden from the catalogue.`)) return;
    try {
      await fetch(`${API_URL}/api/product-box/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
        body: JSON.stringify({ is_active: false, visibility: { status: 'archived' } }),
      });
      setToast(`✅ "${product.name}" archived`);
      fetchCakes();
    } catch { setToast('❌ Archive failed'); }
  };

  // Fix 2: Proper save — PUT to product-box endpoint with full product data
  const saveProduct = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/product-box/products/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProduct),
      });
      if (res.ok) {
        setToast('✅ Cake saved');
        setEditProduct(null);
        fetchCakes();
      } else {
        setToast('❌ Save failed');
      }
    } catch { setToast('❌ Save failed'); }
    setSaving(false);
  };

  // Fix 8: CSV export
  const exportCSV = () => {
    const headers = ['Name', 'Shape', 'Price', 'Status', 'Category', 'Allergens', 'Cities'];
    const rows = cakes.map(c => [
      `"${c.name || ''}"`,
      c.shape || '',
      c.price || c.original_price || '',
      (c.is_active || c.active) ? 'Active' : 'Archived',
      c.category || '',
      `"${(c.allergens || []).join(';')}"`,
      `"${(c.same_day_cities || []).join(';')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cake-catalogue.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Fix 8: CSV import
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').slice(1).filter(Boolean);
    let added = 0;
    for (const line of lines) {
      const [name, shape, price, , category] = line.split(',').map(s => s.replace(/^"|"$/g, '').trim());
      if (!name) continue;
      await fetch(`${API_URL}/api/product-box/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shape, price: Number(price) || 0, category: category || 'cakes', is_active: true }),
      });
      added++;
    }
    setToast(`✅ Imported ${added} cakes`);
    fetchCakes();
    e.target.value = '';
  };

  // Fix 6: Search — all conditions combined correctly
  const filtered = cakes.filter(c => {
    const shape   = c.shape || (c.tags || []).find(t => SHAPES.map(s => s.toLowerCase()).includes(t?.toLowerCase())) || '';
    const tagStr  = (c.tags || []).join(' ').toLowerCase();
    const nameMatch   = !search || c.name?.toLowerCase().includes(search.toLowerCase());
    const shapeMatch  = shapeFilter === 'all' || shape.toLowerCase() === shapeFilter.toLowerCase();
    const seasonMatch = seasonFilter === 'all' || tagStr.includes(seasonFilter.toLowerCase());
    return nameMatch && shapeMatch && seasonMatch;
  });

  // Fix 4: Split into two sections by source
  const tdbCakes        = filtered.filter(c => c.shopify_id || c.source === 'shopify' || c.source === 'production_csv_import' || c._source === 'physical');
  const collectionCakes = filtered.filter(c => !c.shopify_id && c.source !== 'shopify' && c.source !== 'production_csv_import' && c._source !== 'physical');

  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const CakeRow = ({ cake, i, total }) => {
    const shape = cake.shape || (cake.tags || []).find(t => SHAPES.map(s => s.toLowerCase()).includes(t?.toLowerCase())) || '';
    const img   = cake.image_url || cake.image || cake.mockup_url || '';
    return (
      <div key={cake.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 100px 100px 80px 110px', gap: 12, padding: '10px 16px', borderBottom: i < total - 1 ? `1px solid ${P.border}` : 'none', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: P.cream }}>
            {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎂</div>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{cake.name}</div>
            <div style={{ fontSize: 10, color: P.muted, marginTop: 2 }}>{cake.id}</div>
          </div>
        </div>
        <div><ShapeBadge shape={shape} /></div>
        <div style={{ fontSize: 13, fontWeight: 700, color: P.purple }}>
          {cake.price || cake.original_price ? `₹${cake.price || cake.original_price}` : '—'}
        </div>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: (cake.is_active || cake.active) ? P.green : P.red }}>
            {(cake.is_active || cake.active) ? '✓ Active' : '✗ Off'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setEditProduct(cake)} style={{ padding: '5px 9px', borderRadius: 6, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✏ Edit</button>
          <button onClick={() => archiveProduct(cake)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #FECACA', background: '#FFF5F5', color: P.red, cursor: 'pointer', fontSize: 11 }}>⌫</button>
        </div>
      </div>
    );
  };

  const TableHeader = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 100px 100px 80px 110px', gap: 12, padding: '10px 16px', background: P.cream, borderBottom: `1px solid ${P.border}`, fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      <div>Product</div><div>Shape</div><div>Price</div><div>Status</div><div>Actions</div>
    </div>
  );

  return (
    <div>
      <Toast msg={toast} onClose={() => setToast('')} />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard value={stats.total || 0} label="Total Cakes" color={P.purple} />
        {SHAPES.map(s => stats.shapes?.[s] > 0 && (
          <StatCard key={s} value={stats.shapes[s]} label={s} color={P.purpleL} />
        ))}
      </div>

      {/* Filters + Add + CSV */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search cakes…"
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13, minWidth: 180 }}
        />
        {['all', ...SHAPES].map(s => (
          <button key={s} onClick={() => { setShapeFilter(s); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${shapeFilter === s ? P.purple : P.border}`, background: shapeFilter === s ? P.purple : '#fff', color: shapeFilter === s ? '#fff' : P.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
        <select value={seasonFilter} onChange={e => { setSeasonFilter(e.target.value); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 12 }}>
          <option value="all">All Seasons</option>
          {SEASONS.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
        </select>
        {/* Fix 8: CSV buttons */}
        <button onClick={exportCSV} title="Export CSV" style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>↓ CSV</button>
        <label title="Import CSV" style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          ↑ CSV
          <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
        </label>
        <button onClick={() => setShowAddModal(true)}
          style={{ padding: '8px 16px', borderRadius: 8, background: P.purple, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + Add Cake
        </button>
        <button onClick={fetchCakes} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>↻</button>
        <span style={{ fontSize: 12, color: P.muted }}>{filtered.length} / {cakes.length} cakes</span>
      </div>

      {/* Fix 4: Two sections */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: P.muted }}>Loading catalogue…</div>
      ) : (
        <>
          {/* Section 1: TDB Birthday Cakes */}
          <div style={{ fontSize: 14, fontWeight: 800, color: P.dark, marginBottom: 10, marginTop: 4 }}>
            🎂 TDB Birthday Cakes ({tdbCakes.length})
          </div>
          {tdbCakes.length > 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
              <TableHeader />
              {tdbCakes.map((cake, i) => <CakeRow key={cake.id} cake={cake} i={i} total={tdbCakes.length} />)}
            </div>
          ) : (
            <div style={{ padding: '20px 16px', color: P.muted, fontSize: 13, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, marginBottom: 28 }}>
              No TDB physical cakes found (check Shopify sync)
            </div>
          )}

          {/* Section 2: Birthday Cake Collection */}
          <div style={{ fontSize: 14, fontWeight: 800, color: P.dark, marginBottom: 10 }}>
            🎨 Birthday Cake Collection ({collectionCakes.length})
          </div>
          {collectionCakes.length > 0 ? (
            <>
              <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <TableHeader />
                {paginated.filter(c => !c.shopify_id && c.source !== 'shopify' && c.source !== 'production_csv_import' && c._source !== 'physical')
                  .map((cake, i, arr) => <CakeRow key={cake.id} cake={cake} i={i} total={arr.length} />)}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>← Prev</button>
                  <span style={{ padding: '6px 12px', fontSize: 12, color: P.muted }}>Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Next →</button>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '20px 16px', color: P.muted, fontSize: 13, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12 }}>
              No collection cakes found matching filters
            </div>
          )}
        </>
      )}

      {/* Product Editor Modal — Fix 2: passes saving + proper onSave */}
      {editProduct && (
        <ProductBoxEditor
          open={true}
          product={editProduct}
          setProduct={setEditProduct}
          saving={saving}
          onClose={() => { setEditProduct(null); }}
          onSave={saveProduct}
        />
      )}

      {/* Add Cake Modal */}
      {showAddModal && (
        <AddCakeModal
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); fetchCakes(); setToast('✅ Cake added'); }}
        />
      )}
    </div>
  );
}

// ── Add Cake Modal — Fix 3: image upload, description, X button ───────────────
function AddCakeModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', description: '', long_description: '',
    price: '', shape: '', season: '',
    category: 'cakes', product_type: 'birthday_cake',
    pillar: 'celebrate', is_doggy_bakery: true,
    available_bases: ['Oats', 'Ragi'],
    same_day_cities: ['Bangalore', 'Mumbai'],
    is_active: true, available_flavours: [], allergens: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return '';
    const formData = new FormData();
    formData.append('file', imageFile);
    try {
      const res = await fetch(`${API_URL}/api/admin/upload-image`, {
        method: 'POST',
        headers: { Authorization: getAdminHeaders().Authorization },
        body: formData,
      });
      const data = await res.json();
      return data.url || data.image_url || '';
    } catch { return ''; }
  };

  const save = async () => {
    if (!form.name) return alert('Name is required');
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      await fetch(`${API_URL}/api/product-box/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price) || 0,
          image_url: imageUrl,
          image: imageUrl,
          images: imageUrl ? [imageUrl] : [],
        }),
      });
      onSave();
    } catch { alert('Save failed'); }
    setSaving(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: 560, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        {/* X button */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', lineHeight: 1 }}>✕</button>

        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>🎂 Add New Cake</div>

        {/* Image upload */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: P.muted }}>Cake Image</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {imagePreview && (
              <img src={imagePreview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: `1px solid ${P.border}` }} />
            )}
            <label style={{ padding: '10px 16px', borderRadius: 8, border: `2px dashed ${P.border}`, cursor: 'pointer', fontSize: 13, color: P.muted, background: P.cream }}>
              📷 Upload image
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {[
          ['Name *', 'name', 'input'],
          ['Price (₹)', 'price', 'input-number'],
          ['Short Description (for cards)', 'description', 'input'],
        ].map(([label, key, type]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: P.muted }}>{label}</label>
            <input
              type={type === 'input-number' ? 'number' : 'text'}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: P.muted }}>Full Description</label>
          <textarea value={form.long_description} onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))}
            rows={4} placeholder="Full product description..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: P.muted }}>Shape</label>
          <select value={form.shape} onChange={e => setForm(f => ({ ...f, shape: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13 }}>
            <option value="">— Select shape —</option>
            {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: P.muted }}>Season / Occasion</label>
          <select value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13 }}>
            <option value="">— All year —</option>
            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 8, background: `linear-gradient(135deg,${P.purple},${P.purpleL})`, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : '🎂 Add Cake'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — TDB PRODUCTS (Dognuts, Mini Cakes, Treats, Hampers, Frozen)
// ══════════════════════════════════════════════════════════════════════════════
// Category IDs verified against DB — all live in products_master
const TDB_CATEGORIES = [
  { id: 'dognuts',            label: 'Dognuts / Pupcakes', icon: '🧁' },
  { id: 'mini-cakes',         label: 'Mini Cakes',          icon: '🎂' },
  { id: 'desi-treats',        label: 'Desi Treats',         icon: '🍖' },
  { id: 'frozen-treats',      label: 'Frozen Treats',       icon: '🧊' },
  { id: 'hampers',            label: 'Hampers',             icon: '🎁' },
  { id: 'celebration_addons', label: 'Party Add-Ons',       icon: '🎉' },
  { id: 'breed-cakes',        label: 'Breed Cakes',         icon: '🐾' },
];

function TDBProductsTab() {
  const [activeCategory, setActiveCategory] = useState('dognuts');
  const [products, setProducts]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [editProduct, setEditProduct]       = useState(null);
  const [search, setSearch]                 = useState('');
  const [page, setPage]                     = useState(1);
  const [toast, setToast]                   = useState('');
  const PER_PAGE = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // TDB products live in products_master — use product-box API
      const res = await fetch(
        `${API_URL}/api/product-box/products?category=${activeCategory}&limit=200`,
        { headers: getAdminHeaders() }
      );
      const data = res.ok ? await res.json() : {};
      setProducts(data.products || []);
    } catch { setProducts([]); }
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => { fetchProducts(); setPage(1); }, [fetchProducts]);

  const filtered   = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div>
      <Toast msg={toast} onClose={() => setToast('')} />

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TDB_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
            style={{
              padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              border: `1.5px solid ${activeCategory === cat.id ? P.purple : P.border}`,
              background: activeCategory === cat.id ? P.purple : '#fff',
              color: activeCategory === cat.id ? '#fff' : P.muted,
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Search + count */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search…"
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13, minWidth: 200 }}
        />
        <span style={{ fontSize: 12, color: P.muted }}>{filtered.length} products</span>
        <button onClick={fetchProducts} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>↻</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: P.muted }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{TDB_CATEGORIES.find(c => c.id === activeCategory)?.icon}</div>
          <div style={{ color: P.muted }}>No {activeCategory} products found</div>
        </div>
      ) : (
        <>
          <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 100px 80px 80px', gap: 12, padding: '10px 16px', background: P.cream, borderBottom: `1px solid ${P.border}`, fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <div>Product</div><div>Price</div><div>Status</div><div>Actions</div>
            </div>
            {paginated.map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 100px 80px 80px', gap: 12, padding: '10px 16px', borderBottom: i < paginated.length - 1 ? `1px solid ${P.border}` : 'none', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: P.cream }}>
                    {(p.image_url || p.image) ? <img src={p.image_url || p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎁</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: P.muted }}>{p.id}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: P.purple }}>{(p.price || p.original_price) ? `₹${p.price || p.original_price}` : '—'}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: (p.is_active || p.active) ? P.green : P.red }}>
                  {(p.is_active || p.active) ? '✓ Active' : '✗ Off'}
                </div>
                <button onClick={() => setEditProduct(p)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                  ✏ Edit
                </button>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>← Prev</button>
              <span style={{ padding: '6px 12px', fontSize: 12, color: P.muted }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Next →</button>
            </div>
          )}
        </>
      )}

      {editProduct && (
        <ProductBoxEditor
          open={true}
          product={editProduct}
          setProduct={setEditProduct}
          onClose={() => { setEditProduct(null); fetchProducts(); }}
          onSave={() => { setEditProduct(null); fetchProducts(); setToast('✅ Saved'); }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — CONFIG (Flavours, Bases, Shapes, Sizes, Cities, Lead Times)
// ══════════════════════════════════════════════════════════════════════════════
function ConfigTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ flavour: '', shape: '', city: '', season: '', base: '', allergen: '' });
  const [toast, setToast]    = useState('');
  const [saving, setSaving]  = useState(false);

  const defaultConfig = {
    flavours:  FLAVOURS,
    bases:     BASES,
    shapes:    SHAPES,
    cities:    CITIES,
    seasons:   SEASONS,
    allergens: ALLERGENS,
    sizes: [
      { name: 'Mini',    feeds: '2-4',   price: 450,  weight: '300g', lead_hours: 24 },
      { name: 'Regular', feeds: '6-8',   price: 750,  weight: '500g', lead_hours: 24 },
      { name: 'Large',   feeds: '10-12', price: 1100, weight: '1kg',  lead_hours: 48 },
    ],
  };

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cake-config`, { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        // Normalize: the backend may return flavours/allergens as objects {name, emoji, is_allergen}
        // Convert all array entries to plain strings using .name if they are objects
        const toStrings = arr => (arr || []).map(i => (i && typeof i === 'object') ? (i.name || String(i)) : i);
        const merged = { ...defaultConfig, ...data };
        ['flavours', 'bases', 'shapes', 'cities', 'seasons', 'allergens'].forEach(k => {
          merged[k] = toStrings(merged[k]);
        });
        setConfig(merged);
      } else {
        setConfig(defaultConfig);
      }
    } catch {
      setConfig(defaultConfig);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const addItem = (key, value) => {
    if (!value.trim()) return;
    setConfig(c => ({ ...c, [key]: [...(c[key] || []), value.trim()] }));
    const addKey = key.replace(/s$/, '');
    setNewItem(n => ({ ...n, [addKey]: '' }));
  };

  const removeItem = (key, item) => {
    setConfig(c => ({ ...c, [key]: c[key].filter(x => x !== item) }));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/cake-config`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(config),
      });
      setToast('✅ Config saved');
    } catch { setToast('❌ Save failed — config stored locally'); }
    setSaving(false);
  };

  const updateSize = (i, field, value) => {
    setConfig(c => {
      const sizes = [...c.sizes];
      sizes[i] = { ...sizes[i], [field]: value };
      return { ...c, sizes };
    });
  };

  const ConfigList = ({ title, configKey, addKey, placeholder, color }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: P.dark }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {(config[configKey] || []).map(item => (
          <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: color + '22', border: `1px solid ${color}44`, fontSize: 12, fontWeight: 600, color }}>
            {item}
            <button onClick={() => removeItem(configKey, item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={newItem[addKey] || ''}
          onChange={e => setNewItem(n => ({ ...n, [addKey]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && addItem(configKey, newItem[addKey] || '')}
          placeholder={placeholder}
          style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 12 }}
        />
        <button
          onClick={() => addItem(configKey, newItem[addKey] || '')}
          style={{ padding: '7px 14px', borderRadius: 8, background: color, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
        >
          + Add
        </button>
      </div>
    </div>
  );

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: P.muted }}>Loading config…</div>;
  if (!config) return null;

  return (
    <div>
      <Toast msg={toast} onClose={() => setToast('')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <ConfigList title="🍰 Available Flavours"  configKey="flavours"  addKey="flavour"  placeholder="Add flavour…"  color={P.purpleL} />
          <ConfigList title="🌾 Available Bases"     configKey="bases"     addKey="base"     placeholder="Add base…"     color={P.gold} />
          <ConfigList title="⚠ Allergen Flags"      configKey="allergens" addKey="allergen" placeholder="Add allergen…" color={P.red} />
        </div>
        <div>
          <ConfigList title="🎯 Cake Shapes"         configKey="shapes"  addKey="shape"  placeholder="Add shape…"  color={P.pink} />
          <ConfigList title="📍 Same Day Cities"     configKey="cities"  addKey="city"   placeholder="Add city…"   color={P.green} />
          <ConfigList title="🎉 Seasonal Collections" configKey="seasons" addKey="season" placeholder="Add season…" color={P.amber} />
        </div>
      </div>

      {/* Sizes */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: P.dark }}>📏 Cake Sizes & Pricing</div>
        <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, padding: '10px 16px', background: P.cream, borderBottom: `1px solid ${P.border}`, fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase' }}>
            <div>Name</div><div>Feeds</div><div>Price (₹)</div><div>Weight</div><div>Lead Time (hrs)</div>
          </div>
          {(config.sizes || []).map((size, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, padding: '10px 16px', borderBottom: i < config.sizes.length - 1 ? `1px solid ${P.border}` : 'none' }}>
              {['name', 'feeds', 'price', 'weight', 'lead_hours'].map(field => (
                <input
                  key={field}
                  value={size[field]}
                  onChange={e => updateSize(i, field, field === 'price' || field === 'lead_hours' ? Number(e.target.value) : e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${P.border}`, fontSize: 12 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={saveConfig}
        disabled={saving}
        style={{ padding: '12px 28px', borderRadius: 10, background: `linear-gradient(135deg, ${P.purple}, ${P.purpleL})`, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Saving…' : '💾 Save Config'}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FIX 7 — Illustrations wrapper: Add Breed input above BreedCakeManager
// ══════════════════════════════════════════════════════════════════════════════
function IllustrationsWrapper() {
  const [newBreed, setNewBreed] = useState('');
  const [adding, setAdding]     = useState(false);
  const [toast, setToast]       = useState('');

  const addBreed = async () => {
    const name = newBreed.trim();
    if (!name) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/breed-tags/add`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ breed: name }),
      });
      if (res.ok) {
        setToast(`✅ "${name}" added — now click Generate All Breeds in the Generation tab below`);
        setNewBreed('');
      } else {
        setToast('❌ Failed to add breed');
      }
    } catch { setToast('❌ Error adding breed'); }
    setAdding(false);
  };

  return (
    <div>
      <Toast msg={toast} onClose={() => setToast('')} />
      {/* Quick Add Breed row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: '12px 16px', background: P.cream, borderRadius: 10, border: `1px solid ${P.border}`, alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: P.muted, whiteSpace: 'nowrap' }}>+ Add New Breed:</span>
        <input
          value={newBreed}
          onChange={e => setNewBreed(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addBreed()}
          placeholder="e.g. Alsatian, Cockapoo, Sheepadoodle…"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 13 }}
        />
        <button
          onClick={addBreed}
          disabled={adding || !newBreed.trim()}
          style={{ padding: '8px 16px', borderRadius: 8, background: P.purple, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: (adding || !newBreed.trim()) ? 0.6 : 1 }}
        >
          {adding ? 'Adding…' : '+ Generate Breed'}
        </button>
      </div>
      <BreedCakeManager />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — CakeBox
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'orders',        icon: '🎂', label: 'Cake Orders' },
  { id: 'catalogue',     icon: '📦', label: 'Catalogue' },
  { id: 'tdb',           icon: '🏪', label: 'TDB Products' },
  { id: 'config',        icon: '⚙️', label: 'Config' },
  { id: 'illustrations', icon: '🎨', label: 'Illustrations' },
];

export default function CakeBox() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: P.dark }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>🎂</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: P.dark }}>Cake Box</h2>
            <p style={{ margin: 0, fontSize: 13, color: P.muted }}>Manage orders, catalogue, TDB products, config and breed illustrations</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${P.border}`, marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? P.purple : P.muted,
              borderBottom: activeTab === tab.id ? `2px solid ${P.purple}` : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'orders'        && <CakeOrdersTab />}
      {activeTab === 'catalogue'     && <CatalogueTab />}
      {activeTab === 'tdb'           && <TDBProductsTab />}
      {activeTab === 'config'        && <ConfigTab />}
      {activeTab === 'illustrations' && <IllustrationsWrapper />}
    </div>
  );
}
