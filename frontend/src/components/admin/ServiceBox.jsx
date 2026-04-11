/**
 * ServiceBox.jsx — TDC Admin
 * Manage all 1,025 services across 11 pillars
 * Uses ProductBoxEditor for rich multi-tab editing (Cloudinary, AI images, tabs)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import ProductBoxEditor from './ProductBoxEditor';
import BatchImageButton from './BatchImageButton';

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
  // Prefer base_price (canonical field), fall back to price for legacy data
  const basePrice = Number(s.base_price ?? s.price ?? 0);
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
        selling_price: basePrice,
        original_price: basePrice,
        discount_percent: 0,
      },
      approval_status: s.approval_status || (s.is_active !== false ? 'live' : 'paused'),
    },
    original_price: basePrice,
    primary_pillar: pillar,
    pillar,
    category: s.category || '',
    sub_category: s.sub_category || '',
    // approval_status drives the "Status in Pillar" dropdown in ProductBoxEditor
    approval_status: s.approval_status || (s.is_active !== false ? 'live' : 'paused'),
    visibility: { is_active: s.is_active !== false, status: s.is_active !== false ? 'active' : 'inactive' },
    image_url: s.image_url || s.image || s.watercolor_image || '',
    image: s.image_url || s.image || '',
    media: { primary_image: s.image_url || s.image || s.watercolor_image || '' },
    product_type: 'service',
    tags: s.tags || [],
    description: s.description || '',
    ai_image_prompt: aiPrompt,
    ai_prompt: aiPrompt,
    target_breed: s.target_breed || '',  // used by AIImagePromptField for breed-specific image gen
    _serviceId: s.id || s._id,
  };
}

// Extract service-relevant fields from ProductBoxEditor state
function productToServicePatch(p) {
  // Resolve status: commerce_ops.approval_status is what ProductBoxEditor dropdown updates
  // Top-level approval_status is the initial value from serviceToProduct — check commerce_ops FIRST
  const approvalStatus = p.commerce_ops?.approval_status || p.approval_status || 'live';
  const isActive = ['live', 'active'].includes(approvalStatus);
  // Use ?? (nullish coalescing) so price=0 is preserved — never fall back on a valid 0
  const rawSelling = p.commerce_ops?.pricing?.selling_price;
  const resolvedPrice = Number(rawSelling != null ? rawSelling : (p.original_price ?? 0));
  return {
    name: p.basics?.name || p.name || '',
    base_price: resolvedPrice,
    price: resolvedPrice, // legacy alias
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
    target_breed: p.target_breed || '',
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const [totals, setTotals] = useState({});
  const [togglingId, setTogglingId] = useState(null); // track which row is toggling
  const [exportingCSV, setExportingCSV] = useState(false);
  const [importingCSV, setImportingCSV] = useState(false);

  // ProductBoxEditor state
  const [editProduct, setEditProduct] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const PER_PAGE = 20;

  const [showArchived, setShowArchived] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      // When showing archived, fetch from the dedicated archive endpoint
      const endpoint = showArchived
        ? `${API_URL}/api/service-box/services/archived?pillar=${activePillar}&limit=500`
        : `${API_URL}/api/admin/services?pillar=${activePillar}&limit=500`;
      const res = await fetch(endpoint, { headers: getAdminHeaders() });
      const data = res.ok ? await res.json() : {};
      setServices(data.services || data.items || []);
    } catch { setServices([]); }
    setLoading(false);
  }, [activePillar, showArchived]);

  useEffect(() => { fetchServices(); setPage(1); setSearch(''); setDebouncedSearch(''); }, [fetchServices]);
  useEffect(() => { setPage(1); setSearch(''); setDebouncedSearch(''); setShowArchived(false); }, [activePillar]);

  // Debounce search — 350ms delay before filtering
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  useEffect(() => {
    const t = {};
    PILLARS.forEach(p => { t[p.id] = p.count; });
    setTotals(t);
  }, []);

  // Multi-field search with relevance sort — name-match first
  const filtered = (() => {
    if (!debouncedSearch) return services;
    const q = debouncedSearch.toLowerCase();
    const matched = services.filter(s =>
      (s.id || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.sub_category || '').toLowerCase().includes(q) ||
      (s.pillar || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
    return matched.sort((a, b) => {
      const aStart = (a.name || '').toLowerCase().startsWith(q);
      const bStart = (b.name || '').toLowerCase().startsWith(q);
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return 0;
    });
  })();
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
    // If no _serviceId, this is a create
    const serviceId = editProduct._serviceId || editProduct.id;
    if (!serviceId) {
      return createService();
    }
    setSaving(true);
    try {
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

  // ─── Proper CSV parser (handles quoted fields with commas/newlines) ────────
  const parseCSVText = (text) => {
    const lines = [];
    let cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') { if (inQ && text[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === '\n' && !inQ) { if (cur.trim()) lines.push(cur); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) lines.push(cur);
    const parseRow = (line) => {
      const vals = [], len = line.length; let cell = '', q = false;
      for (let i = 0; i < len; i++) {
        const ch = line[i];
        if (ch === '"') { if (q && line[i+1] === '"') { cell += '"'; i++; } else q = !q; }
        else if (ch === ',' && !q) { vals.push(cell); cell = ''; }
        else cell += ch;
      }
      vals.push(cell);
      return vals;
    };
    if (lines.length < 2) return [];
    const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map(line => {
      const vals = parseRow(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    }).filter(row => row.name || row.service_name);
  };

  // ─── Export CSV: calls backend for ALL fields ─────────────────────────────
  const exportCSV = async () => {
    setExportingCSV(true);
    try {
      // Fetch ALL services with every field via the service-box export endpoint
      const res = await fetch(`${API_URL}/api/service-box/export-csv?pillar=${activePillar}`, { headers: getAdminHeaders() });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();   // Returns {services:[...]}
      const svcs = Array.isArray(data) ? data : (data.services || data.items || services);
      if (!svcs.length) { setToast('No services to export'); return; }

      // All columns
      const COLS = ['id','name','pillar','category','sub_category','description','base_price','price',
        'duration','is_active','is_bookable','is_free','approval_status','image_url','image',
        'mira_whisper','includes','tags','available_cities','paw_points_eligible','paw_points_value',
        'whisper_default','whisper_golden_retriever','whisper_labrador','whisper_pug',
        'whisper_beagle','whisper_shih_tzu','whisper_german_shepherd'];

      const esc = (v) => {
        if (v == null) return '';
        if (Array.isArray(v)) v = v.join(';');
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s;
      };

      // Build whispers from breed_whispers object if present
      const rows = svcs.map(s => {
        const bw = s.breed_whispers || {};
        const row = { ...s,
          includes: Array.isArray(s.includes) ? s.includes.join(';') : (s.includes || ''),
          tags: Array.isArray(s.tags) ? s.tags.join(';') : (s.tags || ''),
          available_cities: Array.isArray(s.available_cities) ? s.available_cities.join(';') : (s.available_cities || ''),
          whisper_default: bw.default || s.whisper_default || s.mira_whisper || '',
          whisper_golden_retriever: bw.golden_retriever || s.whisper_golden_retriever || '',
          whisper_labrador: bw.labrador || s.whisper_labrador || '',
          whisper_pug: bw.pug || s.whisper_pug || '',
          whisper_beagle: bw.beagle || s.whisper_beagle || '',
          whisper_shih_tzu: bw.shih_tzu || s.whisper_shih_tzu || '',
          whisper_german_shepherd: bw.german_shepherd || s.whisper_german_shepherd || '',
        };
        return COLS.map(c => esc(row[c])).join(',');
      });

      const csv = [COLS.join(','), ...rows].join('\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      link.download = `services_${activePillar}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setToast(`✅ Exported ${svcs.length} services (${COLS.length} columns)`);
    } catch (err) {
      console.error('Service export error:', err);
      setToast('❌ Export failed: ' + err.message);
    } finally { setExportingCSV(false); }
  };

  // ─── Import CSV: full field mapping + proper parser ───────────────────────
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportingCSV(true);
    try {
      const text = await file.text();
      const rows = parseCSVText(text);
      if (!rows.length) { setToast('❌ No valid rows found'); return; }

      const toList = v => v ? v.split(';').map(x => x.trim()).filter(Boolean) : [];
      const toBool = v => String(v).toLowerCase() === 'true';
      const toNum  = (v, def=0) => parseFloat(v) || def;

      const services = rows.map(r => ({
        id: r.id || undefined,
        name: r.name || r.service_name || '',
        pillar: r.pillar || activePillar,
        category: r.category || '',
        sub_category: r.sub_category || r.subcategory || '',
        description: r.description || '',
        base_price: toNum(r.base_price || r.price),
        price: toNum(r.price || r.base_price),
        duration: r.duration || '',
        is_active: r.is_active !== undefined ? toBool(r.is_active) : true,
        is_bookable: r.is_bookable !== undefined ? toBool(r.is_bookable) : true,
        is_free: r.is_free !== undefined ? toBool(r.is_free) : false,
        approval_status: r.approval_status || 'live',
        image_url: r.image_url || r.image || '',
        mira_whisper: r.mira_whisper || r.whisper_default || '',
        includes: toList(r.includes),
        tags: toList(r.tags),
        available_cities: toList(r.available_cities),
        paw_points_eligible: toBool(r.paw_points_eligible),
        paw_points_value: toNum(r.paw_points_value),
        breed_whispers: {
          default: r.whisper_default || '',
          golden_retriever: r.whisper_golden_retriever || '',
          labrador: r.whisper_labrador || '',
          pug: r.whisper_pug || '',
          beagle: r.whisper_beagle || '',
          shih_tzu: r.whisper_shih_tzu || '',
          german_shepherd: r.whisper_german_shepherd || '',
        },
      })).filter(s => s.name);

      const res = await fetch(`${API_URL}/api/admin/services/import-csv`, {
        method: 'POST', headers: getAdminHeaders(), body: JSON.stringify(services),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const d = await res.json();
      setToast(`✅ Imported ${d.imported || services.length} services`);
      fetchServices();
    } catch (err) {
      console.error('Service import error:', err);
      setToast('❌ Import failed: ' + err.message);
    } finally {
      setImportingCSV(false);
      e.target.value = '';
    }
  };

  // ─── Delete a service (soft archive) ─────────────────────────────────────────
  const deleteService = async (svc) => {
    const svcId = svc.id || svc._id;
    if (!window.confirm(`Archive "${svc.name}"?\n\nThis service will be hidden but can be restored later.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/service-box/services/${svcId}`, {
        method: 'DELETE', headers: getAdminHeaders(),
      });
      if (res.ok) {
        setServices(prev => prev.filter(s => (s.id || s._id) !== svcId));
        setToast(`📦 "${svc.name}" archived`);
      } else {
        const err = await res.json().catch(() => ({}));
        setToast('❌ Archive failed: ' + (err.detail || res.status));
      }
    } catch (e) { setToast('❌ Archive failed: ' + e.message); }
  };

  // ─── Restore an archived service ─────────────────────────────────────────────
  const restoreService = async (svc) => {
    const svcId = svc.id || svc._id;
    try {
      const res = await fetch(`${API_URL}/api/service-box/services/${svcId}/restore`, {
        method: 'PATCH', headers: getAdminHeaders(),
      });
      if (res.ok) {
        setServices(prev => prev.filter(s => (s.id || s._id) !== svcId));
        setToast(`✅ "${svc.name}" restored`);
      } else {
        const err = await res.json().catch(() => ({}));
        setToast('❌ Restore failed: ' + (err.detail || res.status));
      }
    } catch (e) { setToast('❌ Restore failed: ' + e.message); }
  };

  const bulkResetPrices = async () => {
    if (!window.confirm(`Reset ALL service prices to ₹0?\n\nThis will update every service in the database. This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/services/bulk-reset-prices`, {
        method: 'POST', headers: getAdminHeaders()
      });
      const d = res.ok ? await res.json() : {};
      setToast(`✅ ${d.modified || 0} services reset to ₹0`);
      fetchServices();
    } catch { setToast('❌ Bulk reset failed'); }
  };

  const handleToggleActive = async (svc) => {
    const svcId = svc.id || svc._id;
    setTogglingId(svcId);
    try {
      const res = await fetch(`${API_URL}/api/service-box/services/${svcId}/toggle`, {
        method: 'POST', headers: getAdminHeaders()
      });
      if (res.ok) {
        const newStatus = svc.is_active !== false ? false : true;
        setServices(prev => prev.map(s => (s.id || s._id) === svcId ? { ...s, is_active: newStatus } : s));
        setToast(newStatus ? `✅ ${svc.name} set Active` : `⏸ ${svc.name} set Inactive`);
      } else {
        setToast('❌ Toggle failed');
      }
    } catch {
      setToast('❌ Toggle failed');
    } finally {
      setTogglingId(null);
    }
  };

  // Open editor for a brand-new service
  const openCreateService = () => {
    setEditProduct(serviceToProduct({
      id: '',
      name: '',
      pillar: activePillar,
      description: '',
      category: '',
      sub_category: '',
      is_active: true,
      base_price: 0,
      price: 0,
    }));
    setShowEditor(true);
  };

  // Create a new service via POST
  const createService = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      const payload = productToServicePatch(editProduct);
      // Use the basics.name as the canonical name
      const name = editProduct.basics?.name || editProduct.name || '';
      if (!name.trim()) { alert('Service name is required'); setSaving(false); return; }
      const res = await fetch(`${API_URL}/api/service-box/services`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name,
          pillar: payload.pillar || activePillar,
          description: payload.description || '',
          category: payload.category || '',
          sub_category: payload.sub_category || '',
          base_price: 0,
          is_active: payload.is_active,
          approval_status: payload.approval_status || 'live',
          image_url: payload.image_url || '',
        }),
      });
      if (res.ok) {
        setShowEditor(false);
        setEditProduct(null);
        fetchServices();
        setToast('✅ Service created');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Create failed: ' + (err.detail || res.status));
      }
    } catch (e) { alert('Create failed: ' + e.message); }
    setSaving(false);
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
        <span style={{ fontSize:12, color:P.muted }}>{filtered.length} services{showArchived ? ' (archived)' : ''}</span>
        <button
          data-testid="show-archived-services-btn"
          onClick={() => setShowArchived(a => !a)}
          style={{ padding:'7px 14px', borderRadius:8, border:`1.5px solid ${showArchived ? P.amber : P.border}`, background:showArchived ? '#fef3c7' : '#fff', color:showArchived ? '#92400e' : P.muted, cursor:'pointer', fontSize:12, fontWeight:700 }}>
          {showArchived ? '← Back to Active' : '📦 Show Archived'}
        </button>
        <button onClick={exportCSV} disabled={exportingCSV}
          style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${P.border}`, background: exportingCSV ? '#f5f5f5' : '#fff', cursor: exportingCSV ? 'wait' : 'pointer', fontSize:12, fontWeight:600, marginLeft:'auto', opacity: exportingCSV ? 0.7 : 1 }}>
          {exportingCSV ? '⏳ Exporting…' : '↓ Export CSV'}
        </button>
        <label style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${P.border}`, background: importingCSV ? '#f5f5f5' : '#fff', cursor: importingCSV ? 'wait' : 'pointer', fontSize:12, fontWeight:600, opacity: importingCSV ? 0.7 : 1 }}>
          {importingCSV ? '⏳ Importing…' : '↑ Import CSV'}
          <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display:'none' }} disabled={importingCSV} />
        </label>
        <BatchImageButton target="services" label="Auto-Generate Service Images" />
        <button onClick={bulkResetPrices}
          data-testid="bulk-reset-prices-btn"
          style={{ padding:'7px 14px', borderRadius:8, border:`1.5px solid #ef4444`, background:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, color:'#ef4444' }}>
          Reset All Prices to ₹0
        </button>
        <button onClick={fetchServices} style={{ padding:'7px 12px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:12 }}>↻</button>
        <button
          data-testid="add-service-btn"
          onClick={openCreateService}
          style={{ padding:'7px 16px', borderRadius:8, border:`1.5px solid ${P.purple}`, background:P.purple, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          + Add Service
        </button>
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
            <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 80px 80px 120px', gap:12, padding:'10px 16px', background:P.cream, borderBottom:`1px solid ${P.border}`, fontSize:11, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              <div>Service</div><div>Category</div><div>Pillar</div><div>Price</div><div>Status</div><div>Actions</div>
            </div>
            {paginated.map((s, i) => (
              <div key={s.id||s._id||i} style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 80px 80px 120px', gap:12, padding:'10px 16px', borderBottom:i<paginated.length-1?`1px solid ${P.border}`:'none', alignItems:'center' }}>
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
                  <button
                    data-testid={`toggle-service-${s.id||i}`}
                    onClick={() => handleToggleActive(s)}
                    disabled={togglingId === (s.id||s._id)}
                    style={{
                      padding: '4px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 11,
                      background: s.is_active !== false ? '#D1FAE5' : '#FEE2E2',
                      color: s.is_active !== false ? '#065F46' : '#991B1B',
                      opacity: togglingId === (s.id||s._id) ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                      minWidth: 64
                    }}>
                    {togglingId === (s.id||s._id) ? '…' : s.is_active !== false ? '✓ Active' : '✗ Off'}
                  </button>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {showArchived ? (
                    <button
                      data-testid={`restore-service-${s.id||i}`}
                      onClick={() => restoreService(s)}
                      title="Restore this service"
                      style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${P.green}`, background:'#f0fdf4', color:'#065f46', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                      ↩ Restore
                    </button>
                  ) : (
                    <>
                      <button
                        data-testid={`edit-service-${s.id||i}`}
                        onClick={() => openEditor(s)}
                        style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${P.purple}`, background:P.purple, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                        ✏ Edit
                      </button>
                      <button
                        data-testid={`delete-service-${s.id||i}`}
                        onClick={() => deleteService(s)}
                        title="Archive this service"
                        style={{ padding:'5px 10px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff5f5', color:'#b91c1c', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                        🗑
                      </button>
                    </>
                  )}
                </div>
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
