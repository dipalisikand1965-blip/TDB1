/**
 * BundleBox.jsx — TDC Admin
 * Manage all bundles across pillars
 * Uses ProductBoxEditor for rich multi-tab editing (Cloudinary, AI images, tabs)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const name = b.name || '';
  const pillar = b.pillar || 'care';
  const aiPrompt = b.ai_image_prompt || b.ai_prompt ||
    `Soulful watercolor illustration of "${name}" dog bundle, beautifully curated pet items arranged together, warm painterly brushstrokes, soft layered watercolor pigments, premium editorial composition, ivory background, no text`;
  return {
    id: b.id || b._id,
    name,
    basics: {
      name,
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
    primary_pillar: pillar,
    pillar,
    category: b.category || '',
    sub_category: '',
    soul_tier: b.is_soul_made ? 'soul_made' : '',
    // approval_status drives the "Status in Pillar" dropdown in ProductBoxEditor
    approval_status: b.approval_status || (b.is_active !== false ? 'live' : 'paused'),
    commerce_ops: { approval_status: b.approval_status || (b.is_active !== false ? 'live' : 'paused') },
    visibility: { is_active: b.is_active !== false, status: b.is_active !== false ? 'active' : 'inactive' },
    image_url: b.image_url || b.image || b.watercolor_image || '',
    image: b.image_url || b.image || '',
    media: { primary_image: b.image_url || b.image || b.watercolor_image || '' },
    product_type: 'bundle',
    tags: b.tags || [],
    items: b.items || '',
    ai_image_prompt: aiPrompt,
    ai_prompt: aiPrompt,
    _bundleId: b.id || b._id,
  };
}

// Extract bundle-relevant fields from ProductBoxEditor state
function productToBundlePatch(p) {
  const approvalStatus = p.commerce_ops?.approval_status || p.approval_status || 'live';
  const isActive = ['live', 'active'].includes(approvalStatus);
  return {
    name: p.basics?.name || p.name || '',
    price: Number(p.commerce_ops?.pricing?.selling_price || p.original_price || 0),
    pillar: p.primary_pillar || p.pillar || '',
    description: p.basics?.description || p.description || '',
    is_active: isActive,
    approval_status: approvalStatus,
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);
  const [pillarFilter, setPillarFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [importingCSV, setImportingCSV] = useState(false);

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

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  const openEditor = (b) => { setEditProduct(bundleToProduct(b)); setShowEditor(true); };

  // ─── Create new blank bundle ──────────────────────────────────────────────
  const createBundle = () => {
    setEditProduct(bundleToProduct({
      id: `bun-${Date.now()}`, name: 'New Bundle',
      pillar: pillarFilter !== 'all' ? pillarFilter : 'care',
      price: 0, description: '', is_active: true, is_soul_made: false,
    }));
    setShowEditor(true);
  };

  const saveBundle = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      const bundleId = editProduct._bundleId || editProduct.id;
      const payload = productToBundlePatch(editProduct);
      const isNew = !bundles.find(b => (b.id || b._id) === bundleId);
      const method = isNew ? 'POST' : 'PATCH';
      const url = isNew
        ? `${API_URL}/api/admin/bundles/all`
        : `${API_URL}/api/admin/bundles/all/${bundleId}`;
      const res = await fetch(url, { method, headers: getAdminHeaders(), body: JSON.stringify({ ...payload, id: bundleId }) });
      if (res.ok) {
        setShowEditor(false); setEditProduct(null); fetchBundles();
        setToast(isNew ? '✅ Bundle created' : '✅ Bundle saved');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Save failed: ' + (err.detail || res.status));
      }
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const handleToggleActive = async (bundle) => {
    const bId = bundle._bundleId || bundle.id || bundle._id;
    setTogglingId(bId);
    try {
      const res = await fetch(`${API_URL}/api/admin/bundles/all/${bId}/toggle`, { method:'POST', headers:getAdminHeaders() });
      if (res.ok) {
        const newStatus = bundle.is_active !== false ? false : true;
        setBundles(prev => prev.map(b => (b._bundleId || b.id || b._id) === bId ? { ...b, is_active: newStatus } : b));
        setToast(newStatus ? `✅ ${bundle.name} Active` : `⏸ ${bundle.name} Inactive`);
      } else setToast('❌ Toggle failed');
    } catch { setToast('❌ Toggle failed'); }
    finally { setTogglingId(null); }
  };

  // ─── Delete bundle ────────────────────────────────────────────────────────
  const deleteBundle = async (bundle) => {
    const bId = bundle.id || bundle._id;
    if (!window.confirm(`Delete "${bundle.name}"?\n\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/bundles/all/${bId}`, { method:'DELETE', headers:getAdminHeaders() });
      if (res.ok) {
        setBundles(prev => prev.filter(b => (b.id || b._id) !== bId));
        setToast(`🗑️ "${bundle.name}" deleted`);
      } else {
        const err = await res.json().catch(() => ({}));
        setToast('❌ Delete failed: ' + (err.detail || res.status));
      }
    } catch (e) { setToast('❌ Delete failed: ' + e.message); }
  };

  // ─── Export CSV: ALL fields ───────────────────────────────────────────────
  const exportCSV = async () => {
    setExportingCSV(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/bundles/all/export-csv`, { headers: getAdminHeaders() });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bundles_${pillarFilter}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast(`✅ Bundles exported (all fields)`);
    } catch (err) { setToast('❌ Export failed: ' + err.message); }
    finally { setExportingCSV(false); }
  };

  // ─── Proper CSV parser (handles quoted fields) ────────────────────────────
  const parseCSVText = (text) => {
    const lines = []; let cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') { if (inQ && text[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === '\n' && !inQ) { if (cur.trim()) lines.push(cur); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) lines.push(cur);
    const parseRow = (line) => {
      const vals = []; let cell = '', q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (q && line[i+1] === '"') { cell += '"'; i++; } else q = !q; }
        else if (ch === ',' && !q) { vals.push(cell); cell = ''; }
        else cell += ch;
      }
      vals.push(cell); return vals;
    };
    if (lines.length < 2) return [];
    const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map(line => {
      const vals = parseRow(line); const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    }).filter(row => row.name || row.bundle_name);
  };

  // ─── Import CSV: full field mapping ──────────────────────────────────────
  const handleImportCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImportingCSV(true);
    try {
      const text = await file.text();
      const rows = parseCSVText(text);
      if (!rows.length) { setToast('❌ No valid rows'); return; }
      const toList = v => v ? v.split(';').map(x => x.trim()).filter(Boolean) : [];
      const toBool = v => String(v).toLowerCase() === 'true';
      const toNum  = (v, def=0) => parseFloat(v) || def;
      const bundles = rows.map(r => ({
        id: r.id || undefined,
        name: r.name || r.bundle_name || '',
        pillar: r.pillar || 'care',
        price: toNum(r.price),
        discount_percent: toNum(r.discount_percent),
        is_active: r.is_active !== undefined ? toBool(r.is_active) : true,
        is_soul_made: toBool(r.is_soul_made),
        description: r.description || '',
        category: r.category || '',
        items: r.items || '',
        tags: toList(r.tags),
        image_url: r.image_url || r.image || '',
        image: r.image_url || r.image || '',
        approval_status: r.approval_status || 'live',
        paw_points_eligible: toBool(r.paw_points_eligible),
        paw_points_value: toNum(r.paw_points_value),
        mira_hint: r.mira_hint || '',
      })).filter(b => b.name);
      const res = await fetch(`${API_URL}/api/admin/bundles/all/import-csv`, {
        method:'POST', headers:getAdminHeaders(), body:JSON.stringify(bundles),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const d = await res.json();
      setToast(`✅ Imported ${d.imported || bundles.length} bundles`);
      fetchBundles();
    } catch (err) { setToast('❌ Import failed: ' + err.message); }
    finally { setImportingCSV(false); e.target.value = ''; }
  };

  // Multi-field search with relevance sort
  const filtered = (() => {
    const q = debouncedSearch.toLowerCase();
    const matched = bundles.filter(b => {
      const matchSearch = !debouncedSearch ||
        (b.id || '').toLowerCase().includes(q) ||
        (b.name || '').toLowerCase().includes(q) ||
        (b.pillar || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q);
      const matchPillar = pillarFilter === 'all' || b.pillar === pillarFilter;
      return matchSearch && matchPillar;
    });
    if (!debouncedSearch) return matched;
    return matched.sort((a, b) => {
      const aStart = (a.name || '').toLowerCase().startsWith(q);
      const bStart = (b.name || '').toLowerCase().startsWith(q);
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return 0;
    });
  })();

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
        <button onClick={createBundle} data-testid="add-bundle-btn"
          style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #7c3aed', background:'#7c3aed', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          + Add Bundle
        </button>
        <button onClick={exportCSV} disabled={exportingCSV}
          style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${P.border}`, background: exportingCSV ? '#f5f5f5' : '#fff', cursor: exportingCSV ? 'wait' : 'pointer', fontSize:12, fontWeight:600, opacity: exportingCSV ? 0.7 : 1 }}>
          {exportingCSV ? '⏳ Exporting…' : '↓ Export CSV'}
        </button>
        <label style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${P.border}`, background: importingCSV ? '#f5f5f5' : '#fff', cursor: importingCSV ? 'wait' : 'pointer', fontSize:12, fontWeight:600, opacity: importingCSV ? 0.7 : 1 }}>
          {importingCSV ? '⏳ Importing…' : '↑ Import CSV'}
          <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display:'none' }} disabled={importingCSV} />
        </label>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:P.muted }}>Loading bundles…</div>
      ) : (
        <div style={{ background:'#fff', border:`1px solid ${P.border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 80px 80px 80px 120px', gap:12, padding:'10px 16px', background:P.cream, borderBottom:`1px solid ${P.border}`, fontSize:11, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            <div>Bundle</div><div>Pillar</div><div>Price</div><div>Soul Made</div><div>Status</div><div>Actions</div>
          </div>
          {filtered.map((b, i) => (
            <div key={b.id||b._id||i} style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 80px 80px 80px 120px', gap:12, padding:'10px 16px', borderBottom:i<filtered.length-1?`1px solid ${P.border}`:'none', alignItems:'center' }}>
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
                  <button
                    data-testid={`toggle-bundle-${b.id||i}`}
                    onClick={() => handleToggleActive(b)}
                    disabled={togglingId === (b._bundleId || b.id || b._id)}
                    style={{
                      padding: '4px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 11,
                      background: b.is_active !== false ? '#D1FAE5' : '#FEE2E2',
                      color: b.is_active !== false ? '#065F46' : '#991B1B',
                      opacity: togglingId === (b._bundleId || b.id || b._id) ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                      minWidth: 64
                    }}>
                    {togglingId === (b._bundleId || b.id || b._id) ? '…' : b.is_active !== false ? '✓ Active' : '✗ Off'}
                  </button>
                </div>
              <div style={{ display:'flex', gap:6 }}>
                <button
                  data-testid={`edit-bundle-${b.id||i}`}
                  onClick={() => openEditor(b)}
                  style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${P.purple}`, background:P.purple, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                  ✏ Edit
                </button>
                <button
                  data-testid={`delete-bundle-${b.id||i}`}
                  onClick={() => deleteBundle(b)}
                  title="Delete this bundle"
                  style={{ padding:'5px 10px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff5f5', color:'#b91c1c', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                  🗑
                </button>
              </div>
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
