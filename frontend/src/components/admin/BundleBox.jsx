/**
 * BundleBox.jsx — TDC Admin
 * Manage all 27 care bundles
 */
import { useState, useEffect, useCallback } from 'react';

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

function EditBundleModal({ bundle, onClose, onSave }) {
  const [form, setForm] = useState({ ...bundle });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/bundles/${form.id || form._id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price) || 0,
          pillar: form.pillar,
          description: form.description,
          is_active: form.is_active,
          is_soul_made: form.is_soul_made,
          discount_percent: Number(form.discount_percent) || 0,
        }),
      });
      if (res.ok) onSave();
      else alert('Save failed');
    } catch { alert('Save failed'); }
    setSaving(false);
  };

  const PILLARS = ['care','dine','celebrate','go','play','learn','paperwork','emergency','farewell','adopt','shop'];

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:28, width:500, maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#999' }}>✕</button>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>📦 Edit Bundle</div>

        {[['Bundle Name','name','text'],['Price (₹)','price','number'],['Discount %','discount_percent','number']].map(([label,key,type]) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, display:'block', marginBottom:4, color:P.muted }}>{label}</label>
            <input type={type} value={form[key]||''} onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
              style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13 }} />
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, display:'block', marginBottom:4, color:P.muted }}>Pillar</label>
          <select value={form.pillar||''} onChange={e => setForm(f=>({...f,pillar:e.target.value}))}
            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13 }}>
            {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, display:'block', marginBottom:4, color:P.muted }}>Description</label>
          <textarea value={form.description||''} onChange={e => setForm(f=>({...f,description:e.target.value}))}
            rows={3} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
        </div>

        <div style={{ display:'flex', gap:20, marginBottom:20 }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <input type="checkbox" checked={form.is_active!==false} onChange={e => setForm(f=>({...f,is_active:e.target.checked}))} />
            Active
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <input type="checkbox" checked={!!form.is_soul_made} onChange={e => setForm(f=>({...f,is_soul_made:e.target.checked}))} />
            ✦ Soul Made™
          </label>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:'10px', borderRadius:8, background:`linear-gradient(135deg,${P.purple},${P.purpleL})`, color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Saving…' : '💾 Save Bundle'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BundleBox() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [editBundle, setEditBundle] = useState(null);
  const [toast, setToast] = useState('');

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/bundles?limit=100`, { headers: getAdminHeaders() });
      const data = res.ok ? await res.json() : {};
      setBundles(data.bundles || data.items || []);
    } catch { setBundles([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

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
          <div key={p} style={{ background:'#fff', border:`1px solid ${P.border}`, borderRadius:12, padding:'14px 16px', cursor:'pointer' }} onClick={() => setPillarFilter(p)}>
            <div style={{ fontSize:22, fontWeight:800, color:P.purpleL }}>{c}</div>
            <div style={{ fontSize:11, color:P.muted }}>{p}</div>
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
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{b.name}</div>
                <div style={{ fontSize:11, color:P.muted }}>{b.description?.slice(0,60) || '—'}</div>
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
              <button onClick={() => setEditBundle(b)}
                style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${P.border}`, background:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                ✏ Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {editBundle && (
        <EditBundleModal
          bundle={editBundle}
          onClose={() => setEditBundle(null)}
          onSave={() => { setEditBundle(null); fetchBundles(); setToast('✅ Bundle saved'); }}
        />
      )}
    </div>
  );
}
