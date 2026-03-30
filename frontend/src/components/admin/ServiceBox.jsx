/**
 * ServiceBox.jsx — TDC Admin
 * Manage all 1,025 services across 11 pillars
 * Uses ProductBoxEditor for rich multi-tab editing (Cloudinary, AI images, tabs)
 */
import { useState, useEffect, useCallback } from 'react';
import ProductBoxEditor from './ProductBoxEditor';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
function getAdminHeaders() {
  const auth = localStorage.getItem('adminAuth') || btoa('aditya:lola4304');
  return { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` };
}

const PILLARS = [
  { id:'care',      label:'💊 Care',       count:31  },
  { id:'dine',      label:'🍽️ Dine',       count:23  },
  { id:'celebrate', label:'🎂 Celebrate',  count:33  },
  { id:'go',        label:'✈️ Go',         count:42  },
  { id:'play',      label:'🎾 Play',       count:125 },
  { id:'learn',     label:'🎓 Learn',      count:33  },
  { id:'paperwork', label:'📄 Paperwork',  count:257 },
  { id:'emergency', label:'🚨 Emergency',  count:27  },
  { id:'farewell',  label:'🌈 Farewell',   count:22  },
  { id:'adopt',     label:'🐾 Adopt',      count:31  },
  { id:'shop',      label:'🛒 Shop',       count:424 },
];

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

// Transform service DB record → ProductBoxEditor schema
function serviceToProduct(s) {
  const name = s.name || '';
  const pillar = s.pillar || 'care';
  // Pre-populate ai_image_prompt so it shows as real editable value (not greyed placeholder)
  const aiPrompt = s.ai_image_prompt || s.ai_prompt ||
    `Soulful watercolor illustration of "${name}" pet service, caring handler with a golden retriever dog, warm amber and cream palette, soft elegant brushwork, premium editorial composition, oval composition, no text, white background`;
  return {
    id: s.id || s._id,
    name,
    basics: {
      name,
      description: s.description || s.long_description || '',
      brand: s.brand || '',
    },
    commerce_ops: {
      pricing: {
        selling_price: Number(s.price) || 0,
        original_price: Number(s.price) || 0,
        discount_percent: 0,
      },
    },
    original_price: Number(s.price) || 0,
    primary_pillar: pillar,
    pillar,
    category: s.category || '',
    sub_category: s.sub_category || '',
    // approval_status drives the "Status in Pillar" dropdown in ProductBoxEditor
    approval_status: s.approval_status || (s.is_active !== false ? 'live' : 'paused'),
    commerce_ops: { approval_status: s.approval_status || (s.is_active !== false ? 'live' : 'paused') },
    visibility: { is_active: s.is_active !== false, status: s.is_active !== false ? 'active' : 'inactive' },
    image_url: s.image_url || s.image || s.watercolor_image || '',
    image: s.image_url || s.image || '',
    media: { primary_image: s.image_url || s.image || s.watercolor_image || '' },
    product_type: 'service',
    tags: s.tags || [],
    description: s.description || '',
    ai_image_prompt: aiPrompt,
    ai_prompt: aiPrompt,
    _serviceId: s.id || s._id,
  };
}

// Extract service-relevant fields from ProductBoxEditor state
function productToServicePatch(p) {
  // Resolve status: approval_status is the source of truth from the dropdown
  const approvalStatus = p.approval_status || p.commerce_ops?.approval_status || 'live';
  const isActive = ['live', 'active'].includes(approvalStatus);
  return {
    name: p.basics?.name || p.name || '',
    base_price: Number(p.commerce_ops?.pricing?.selling_price || p.original_price || 0),
    price: Number(p.commerce_ops?.pricing?.selling_price || p.original_price || 0), // legacy alias
    category: p.category || '',
    sub_category: p.sub_category || '',
    pillar: p.primary_pillar || p.pillar || '',
    description: p.basics?.description || p.description || '',
    long_description: p.basics?.description || p.description || '',
    is_active: isActive,
    approval_status: approvalStatus,
    tags: p.tags || [],
    image_url: p.image_url || p.media?.primary_image || '',
    image: p.image_url || p.media?.primary_image || '',
    watercolor_image: p.image_url || p.media?.primary_image || '',
  };
}

const SERVICE_ENTITY_CONFIG = {
  prefix: 'services',
  uploadPrefix: 'service',
  entityLabel: 'Service',
  // Points to the dedicated service-box generate-image endpoint (synchronous, returns image_url directly)
  generateImageBasePath: `${API_URL}/api/service-box/services`,
};

export default function ServiceBox() {
  const [activePillar, setActivePillar] = useState('care');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const [totals, setTotals] = useState({});

  // ProductBoxEditor state
  const [editProduct, setEditProduct] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const PER_PAGE = 20;

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/services?pillar=${activePillar}&limit=200`, { headers: getAdminHeaders() });
      const data = res.ok ? await res.json() : {};
      setServices(data.services || data.items || []);
    } catch { setServices([]); }
    setLoading(false);
  }, [activePillar]);

  useEffect(() => { fetchServices(); setPage(1); setSearch(''); }, [fetchServices]);

  useEffect(() => {
    const t = {};
    PILLARS.forEach(p => { t[p.id] = p.count; });
    setTotals(t);
  }, []);

  const filtered = services.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // Open editor for a service
  const openEditor = (s) => {
    setEditProduct(serviceToProduct(s));
    setShowEditor(true);
  };

  // Save via ProductBoxEditor onSave callback
  const saveService = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      const serviceId = editProduct._serviceId || editProduct.id;
      const payload = productToServicePatch(editProduct);
      const res = await fetch(`${API_URL}/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowEditor(false);
        setEditProduct(null);
        fetchServices();
        setToast('✅ Service saved');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Save failed: ' + (err.detail || res.status));
      }
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const exportCSV = () => {
    const headers = ['Name','Category','Sub-Category','Price','Pillar','Status'];
    const rows = services.map(s => [
      `"${s.name||''}"`, s.category||'', s.sub_category||'',
      s.price||0, s.pillar||activePillar,
      s.is_active!==false ? 'Active' : 'Inactive'
    ]);
    const csv = [headers,...rows].map(r=>r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `services-${activePillar}.csv`;
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
      return { name:obj.Name||obj.name, category:obj.Category||obj.category||'', price:parseFloat(obj.Price||obj.price)||0, pillar:obj.Pillar||obj.pillar||activePillar, is_active:true };
    }).filter(r => r.name);
    try {
      const res = await fetch(`${API_URL}/api/admin/services/import-csv`, {
        method:'POST', headers:getAdminHeaders(), body:JSON.stringify(rows)
      });
      const d = res.ok ? await res.json() : {};
      setToast(`✅ Imported ${d.imported||rows.length} services`);
      fetchServices();
    } catch { setToast('❌ Import failed'); }
    e.target.value = '';
  };

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color:P.dark }}>
      <Toast msg={toast} onClose={() => setToast('')} />

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <span style={{ fontSize:28 }}>🛎️</span>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800 }}>Service Box</h2>
          <p style={{ margin:0, fontSize:13, color:P.muted }}>Manage all 1,025 services across 11 pillars</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {PILLARS.map(p => (
          <button key={p.id} onClick={() => setActivePillar(p.id)}
            style={{ padding:'8px 14px', borderRadius:20, border:`1.5px solid ${activePillar===p.id?P.purple:P.border}`,
              background:activePillar===p.id?P.purple:'#fff', color:activePillar===p.id?'#fff':P.muted,
              fontSize:12, fontWeight:700, cursor:'pointer' }}>
            {p.label} <span style={{ opacity:0.7 }}>({p.count})</span>
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search services…"
          style={{ padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13, minWidth:220 }} />
        <span style={{ fontSize:12, color:P.muted }}>{filtered.length} services</span>
        <button onClick={exportCSV} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, marginLeft:'auto' }}>
          ↓ Export CSV
        </button>
        <label style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
          ↑ Import CSV
          <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display:'none' }} />
        </label>
        <button onClick={fetchServices} style={{ padding:'7px 12px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:12 }}>↻</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:P.muted }}>Loading services…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🛎️</div>
          <div style={{ color:P.muted }}>No services found for {activePillar}</div>
        </div>
      ) : (
        <>
          <div style={{ background:'#fff', border:`1px solid ${P.border}`, borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 80px 80px 80px', gap:12, padding:'10px 16px', background:P.cream, borderBottom:`1px solid ${P.border}`, fontSize:11, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              <div>Service</div><div>Category</div><div>Pillar</div><div>Price</div><div>Status</div><div>Actions</div>
            </div>
            {paginated.map((s, i) => (
              <div key={s.id||s._id||i} style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 80px 80px 80px', gap:12, padding:'10px 16px', borderBottom:i<paginated.length-1?`1px solid ${P.border}`:'none', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {(s.image_url || s.image || s.watercolor_image) && (
                    <img src={s.image_url || s.image || s.watercolor_image} alt={s.name}
                      style={{ width:32, height:32, borderRadius:6, objectFit:'cover', flexShrink:0, border:`1px solid ${P.border}` }} />
                  )}
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:P.dark }}>{s.name}</div>
                    <div style={{ fontSize:11, color:P.muted }}>{s.sub_category || ''}</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:P.muted }}>{s.category || '—'}</div>
                <div style={{ fontSize:11, fontWeight:600, color:P.purpleL }}>{s.pillar || activePillar}</div>
                <div style={{ fontSize:13, fontWeight:700, color:P.purple }}>
                  {s.price ? `₹${Number(s.price).toLocaleString('en-IN')}` : <span style={{ color:P.amber }}>₹0</span>}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:s.is_active!==false?P.green:P.red }}>
                  {s.is_active!==false ? '✓ Active' : '✗ Off'}
                </div>
                <button
                  data-testid={`edit-service-${s.id||i}`}
                  onClick={() => openEditor(s)}
                  style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${P.purple}`, background:P.purple, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                  ✏ Edit
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:16 }}>
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${P.border}`, background:page===1?'#f5f5f5':'#fff', cursor:page===1?'default':'pointer', fontSize:12 }}>← Prev</button>
              <span style={{ padding:'6px 12px', fontSize:12, color:P.muted }}>Page {page} of {totalPages} · {filtered.length} services</span>
              <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${P.border}`, background:page===totalPages?'#f5f5f5':'#fff', cursor:page===totalPages?'default':'pointer', fontSize:12 }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Rich 6-Tab Editor for services */}
      <ProductBoxEditor
        product={editProduct}
        setProduct={setEditProduct}
        open={showEditor}
        onClose={() => { setShowEditor(false); setEditProduct(null); }}
        onSave={saveService}
        saving={saving}
        entityConfig={SERVICE_ENTITY_CONFIG}
      />
    </div>
  );
}
