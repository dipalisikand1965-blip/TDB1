/**
 * ServiceBox.jsx — TDC Admin
 * Manage all 1,025 services across 11 pillars
 * Edit name, price, category, pillar, status
 */
import { useState, useEffect, useCallback } from 'react';

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

function EditServiceModal({ service, onClose, onSave }) {
  const [form, setForm] = useState({ ...service });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/services/${form.id || form._id}`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price) || 0,
          category: form.category,
          sub_category: form.sub_category,
          pillar: form.pillar,
          description: form.description,
          is_active: form.is_active,
        }),
      });
      if (res.ok) onSave();
      else alert('Save failed');
    } catch { alert('Save failed'); }
    setSaving(false);
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:28, width:520, maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#999' }}>✕</button>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>🛎️ Edit Service</div>

        {[
          ['Service Name', 'name', 'text'],
          ['Price (₹)', 'price', 'number'],
          ['Category', 'category', 'text'],
          ['Sub-Category', 'sub_category', 'text'],
        ].map(([label, key, type]) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, display:'block', marginBottom:4, color:P.muted }}>{label}</label>
            <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13 }} />
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, display:'block', marginBottom:4, color:P.muted }}>Pillar</label>
          <select value={form.pillar || ''} onChange={e => setForm(f => ({ ...f, pillar: e.target.value }))}
            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13 }}>
            {PILLARS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, display:'block', marginBottom:4, color:P.muted }}>Description</label>
          <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
          <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
          <label style={{ fontSize:13, fontWeight:600 }}>Active (visible on front end)</label>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:'10px', borderRadius:8, background:`linear-gradient(135deg,${P.purple},${P.purpleL})`, color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Saving…' : '💾 Save Service'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceBox() {
  const [activePillar, setActivePillar] = useState('care');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editService, setEditService] = useState(null);
  const [toast, setToast] = useState('');
  const [totals, setTotals] = useState({});
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
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:P.dark }}>{s.name}</div>
                  <div style={{ fontSize:11, color:P.muted }}>{s.sub_category || ''}</div>
                </div>
                <div style={{ fontSize:12, color:P.muted }}>{s.category || '—'}</div>
                <div style={{ fontSize:11, fontWeight:600, color:P.purpleL }}>{s.pillar || activePillar}</div>
                <div style={{ fontSize:13, fontWeight:700, color:P.purple }}>
                  {s.price ? `₹${Number(s.price).toLocaleString('en-IN')}` : <span style={{ color:P.amber }}>₹0</span>}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:s.is_active!==false?P.green:P.red }}>
                  {s.is_active!==false ? '✓ Active' : '✗ Off'}
                </div>
                <button onClick={() => setEditService(s)}
                  style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
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

      {editService && (
        <EditServiceModal
          service={editService}
          onClose={() => setEditService(null)}
          onSave={() => { setEditService(null); fetchServices(); setToast('✅ Service saved'); }}
        />
      )}
    </div>
  );
}
