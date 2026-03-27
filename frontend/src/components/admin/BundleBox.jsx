/**
 * BundleBox.jsx — TDC Admin
 * Manage all bundles across pillars
 * Uses ProductBoxEditor for rich multi-tab editing (Cloudinary, AI images, tabs)
 */
import { useState, useEffect, useCallback } from 'react';
import ProductBoxEditor from './ProductBoxEditor';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
function getAdminHeaders() {
  const auth = localStorage.getItem('adminAuth') || btoa('aditya:lola4304');
  return { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` };
}

const P = {
  purple:'#4A1B6D', purpleL:'#9B59B6', dark:'#1A0A2E',
  cream:'#FAF7FF', border:'#E8D5F5', muted:'#7A6890',
  red:'#EF4444', green:'#22C55E', amber:'#F59E0B',
};

function Toast({ msg, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:P.dark, color:'#fff', borderRadius:20, padding:'10px 20px', fontSize:13, fontWeight:700, zIndex:99999, whiteSpace:'nowrap' }}>
      {msg}
    </div>
  );
}

// Transform bundle DB record → ProductBoxEditor schema
function bundleToProduct(b) {
  return {
    id: b.id || b._id,
    name: b.name || '',
    basics: {
      name: b.name || '',
      description: b.description || '',
      brand: '',
    },
    commerce_ops: {
      pricing: {
        selling_price: Number(b.price) || 0,
        original_price: Number(b.price) || 0,
        discount_percent: Number(b.discount_percent) || 0,
      },
    },
    original_price: Number(b.price) || 0,
    primary_pillar: b.pillar || '',
    pillar: b.pillar || '',
    category: b.category || '',
    sub_category: '',
    soul_tier: b.is_soul_made ? 'soul_made' : '',
    visibility: { is_active: b.is_active !== false, status: b.is_active !== false ? 'active' : 'inactive' },
    image_url: b.image_url || b.image || b.watercolor_image || '',
    image: b.image_url || b.image || '',
    media: { primary_image: b.image_url || b.image || b.watercolor_image || '' },
    product_type: 'bundle',
    tags: b.tags || [],
    items: b.items || '',
    _bundleId: b.id || b._id,
  };
}

// Extract bundle-relevant fields from ProductBoxEditor state
function productToBundlePatch(p) {
  return {
    name: p.basics?.name || p.name || '',
    price: Number(p.commerce_ops?.pricing?.selling_price || p.original_price || 0),
    pillar: p.primary_pillar || p.pillar || '',
    description: p.basics?.description || p.description || '',
    is_active: p.visibility?.is_active !== false,
    is_soul_made: p.soul_tier === 'soul_made',
    discount_percent: Number(p.commerce_ops?.pricing?.discount_percent || 0),
    tags: p.tags || [],
    image_url: p.image_url || p.media?.primary_image || '',
    image: p.image_url || p.media?.primary_image || '',
    watercolor_image: p.image_url || p.media?.primary_image || '',
  };
}

const BUNDLE_ENTITY_CONFIG = {
  prefix: 'bundles',
  uploadPrefix: 'bundle',
  entityLabel: 'Bundle',
};

export default function BundleBox() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [toast, setToast] = useState('');

  // ProductBoxEditor state
  const [editProduct, setEditProduct] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const url = pillarFilter && pillarFilter !== 'all'
        ? `${API_URL}/api/admin/bundles/all?pillar=${pillarFilter}&limit=200`
        : `${API_URL}/api/admin/bundles/all?limit=200`;
      const res = await fetch(url, { headers: getAdminHeaders() });
      const data = res.ok ? await res.json() : {};
      setBundles(data.bundles || []);
    } catch { setBundles([]); }
    setLoading(false);
  }, [pillarFilter]);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  // Open editor for a bundle
  const openEditor = (b) => {
    setEditProduct(bundleToProduct(b));
    setShowEditor(true);
  };

  // Save via ProductBoxEditor onSave callback
  const saveBundle = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      const bundleId = editProduct._bundleId || editProduct.id;
      const payload = productToBundlePatch(editProduct);
      const res = await fetch(`${API_URL}/api/admin/bundles/all/${bundleId}`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowEditor(false);
        setEditProduct(null);
        fetchBundles();
        setToast('✅ Bundle saved');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Save failed: ' + (err.detail || res.status));
      }
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const exportCSV = () => {
    const headers = ['ID','Name','Pillar','Price','Discount %','Soul Made','Status'];
    const rows = bundles.map(b => [
      b.id||'', `"${b.name||''}"`, b.pillar||'', b.price||0,
      b.discount_percent||0, b.is_soul_made?'Yes':'No',
      b.is_active!==false?'Active':'Inactive'
    ]);
    const csv = [headers,...rows].map(r=>r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `bundles-${pillarFilter}.csv`;
    a.click();
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(Boolean);
    const hdrs = lines[0].split(',');
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj = {};
      hdrs.forEach((h,i) => { obj[h.trim()] = (vals[i]||'').trim().replace(/^"|"$/g,''); });
      return { name:obj.Name||obj.name, pillar:obj.Pillar||obj.pillar, price:parseFloat(obj.Price||obj.price)||0, id:obj.ID||obj.id||undefined };
    }).filter(r => r.name);
    try {
      const res = await fetch(`${API_URL}/api/admin/bundles/all/import-csv`, {
        method:'POST', headers:getAdminHeaders(), body:JSON.stringify(rows)
      });
      const d = res.ok ? await res.json() : {};
      setToast(`✅ Imported ${d.imported||rows.length} bundles`);
      fetchBundles();
    } catch { setToast('❌ Import failed'); }
    e.target.value = '';
  };

  const filtered = bundles.filter(b => {
    const matchSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase());
    const matchPillar = pillarFilter === 'all' || b.pillar === pillarFilter;
    return matchSearch && matchPillar;
  });

  const PILLARS = ['care','dine','celebrate','go','play','learn','paperwork','emergency','farewell','adopt','shop'];
  const pillarCounts = {};
  bundles.forEach(b => { pillarCounts[b.pillar] = (pillarCounts[b.pillar]||0)+1; });

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color:P.dark }}>
      <Toast msg={toast} onClose={() => setToast('')} />

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <span style={{ fontSize:28 }}>📦</span>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800 }}>Bundle Box</h2>
          <p style={{ margin:0, fontSize:13, color:P.muted }}>Manage all {bundles.length} bundles across pillars</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        <div style={{ background:'#fff', border:`1px solid ${P.border}`, borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:22, fontWeight:800, color:P.purple }}>{bundles.length}</div>
          <div style={{ fontSize:11, color:P.muted }}>Total Bundles</div>
        </div>
        {Object.entries(pillarCounts).map(([p,c]) => (
          <div key={p} style={{ background:pillarFilter===p?P.purple:'#fff', border:`1px solid ${pillarFilter===p?P.purple:P.border}`, borderRadius:12, padding:'14px 16px', cursor:'pointer' }}
            onClick={() => setPillarFilter(pillarFilter===p?'all':p)}>
            <div style={{ fontSize:22, fontWeight:800, color:pillarFilter===p?'#fff':P.purpleL }}>{c}</div>
            <div style={{ fontSize:11, color:pillarFilter===p?'rgba(255,255,255,0.8)':P.muted }}>{p}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bundles…"
          style={{ padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13, minWidth:200 }} />
        <select value={pillarFilter} onChange={e => setPillarFilter(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13 }}>
          <option value="all">All Pillars</option>
          {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={fetchBundles} style={{ padding:'7px 12px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:12 }}>↻</button>
        <button onClick={exportCSV} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>↓ Export CSV</button>
        <label style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
          ↑ Import CSV
          <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display:'none' }} />
        </label>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:P.muted }}>Loading bundles…</div>
      ) : (
        <div style={{ background:'#fff', border:`1px solid ${P.border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 80px 80px 80px 80px', gap:12, padding:'10px 16px', background:P.cream, borderBottom:`1px solid ${P.border}`, fontSize:11, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            <div>Bundle</div><div>Pillar</div><div>Price</div><div>Soul Made</div><div>Status</div><div>Actions</div>
          </div>
          {filtered.map((b, i) => (
            <div key={b.id||b._id||i} style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 80px 80px 80px 80px', gap:12, padding:'10px 16px', borderBottom:i<filtered.length-1?`1px solid ${P.border}`:'none', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {(b.image_url || b.image || b.watercolor_image) && (
                  <img src={b.image_url || b.image || b.watercolor_image} alt={b.name}
                    style={{ width:32, height:32, borderRadius:6, objectFit:'cover', flexShrink:0, border:`1px solid ${P.border}` }} />
                )}
                <div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{b.name}</div>
                  <div style={{ fontSize:11, color:P.muted }}>{b.description?.slice(0,60) || '—'}</div>
                </div>
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:P.purpleL }}>{b.pillar || '—'}</div>
              <div style={{ fontSize:13, fontWeight:700, color:P.purple }}>
                {b.price ? `₹${Number(b.price).toLocaleString('en-IN')}` : <span style={{ color:P.amber }}>₹0</span>}
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:b.is_soul_made?P.purpleL:P.muted }}>
                {b.is_soul_made ? '✦ Yes' : '—'}
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:b.is_active!==false?P.green:P.red }}>
                {b.is_active!==false ? '✓ Active' : '✗ Off'}
              </div>
              <button
                data-testid={`edit-bundle-${b.id||i}`}
                onClick={() => openEditor(b)}
                style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${P.purple}`, background:P.purple, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                ✏ Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rich 6-Tab Editor for bundles */}
      <ProductBoxEditor
        product={editProduct}
        setProduct={setEditProduct}
        open={showEditor}
        onClose={() => { setShowEditor(false); setEditProduct(null); }}
        onSave={saveBundle}
        saving={saving}
        entityConfig={BUNDLE_ENTITY_CONFIG}
      />
    </div>
  );
}
