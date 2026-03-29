import React, { useState, useEffect, useCallback } from 'react';
import AIImagePromptField from './AIImagePromptField';

// ─── ServicesManager.jsx ─────────────────────────────────────────────────────
// Admin component for the Services pillar
// Path: /app/frontend/src/components/admin/ServicesManager.jsx
//
// Architecture: follows universal PillarProductsTab pattern per ARCHITECTURE.md
// All data from services_master collection with pillar='services'
// Never creates a separate services collection — uses master with pillar field
//
// Wiring in AdminDashboard.jsx:
//   import ServicesManager from '../components/admin/ServicesManager';
//   case 'services': return <ServicesManager token={token} />;

const API = (path) => `/api${path}`;

const SERVICE_CATEGORIES = [
  'Grooming & Spa', 'Veterinary', 'Training', 'Pet Sitting',
  'Dog Walking', 'Boarding', 'Photography', 'Transport',
  'Nutrition Consulting', 'Behavioural', 'Dental Care', 'Other',
];

const EMPTY_FORM = {
  name: '', description: '', category: 'Grooming & Spa',
  price: '', price_unit: 'per session', duration_mins: '',
  is_active: true, tags: '', image_url: '', ai_image_prompt: '',
};

export default function ServicesManager({ token }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // ── Fetch ──
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all services across all pillars (no pillar filter — services pillar has no DB data)
      const res = await fetch(
        API(`/service-box/services?limit=500`),
        { headers }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : data.services || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ── Filtered + paginated ──
  const filtered = services.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase())
      || s.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    const matchPillar = pillarFilter === 'all' || s.pillar === pillarFilter;
    return matchSearch && matchCat && matchPillar;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Save (create or update) ──
  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        pillar: 'services',
        price: parseFloat(form.price) || 0,
        duration_mins: parseInt(form.duration_mins) || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      const url = editId
        ? API(`/service-box/services/${editId}`)
        : API(`/service-box/services`);
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchServices();
      closeModal();
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ──
  const toggleActive = async (service) => {
    try {
      await fetch(API(`/service-box/services/${service._id || service.id}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...service, is_active: !service.is_active }),
      });
      setServices(prev => prev.map(s =>
        (s._id || s.id) === (service._id || service.id)
          ? { ...s, is_active: !s.is_active } : s
      ));
    } catch (e) {
      alert(`Toggle failed: ${e.message}`);
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service? This cannot be undone.')) return;
    try {
      await fetch(API(`/service-box/services/${id}`), { method: 'DELETE', headers });
      await fetchServices();
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  // ── Modal helpers ──
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add'); };
  const openEdit = (s) => {
    setForm({
      name: s.name || '', description: s.description || '',
      category: s.category || 'Other', price: s.price || '',
      price_unit: s.price_unit || 'per session',
      duration_mins: s.duration_mins || '',
      is_active: s.is_active !== false,
      tags: Array.isArray(s.tags) ? s.tags.join(', ') : (s.tags || ''),
      image_url: s.image_url || s.watercolor_image || '',
    });
    setEditId(s._id || s.id);
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null); };

  // ── Styles ──
  const s = {
    wrap: { fontFamily: 'system-ui, sans-serif', padding: '24px', minHeight: '400px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '20px', fontWeight: 600, color: '#1a1a2e' },
    stats: { fontSize: '13px', color: '#666', marginTop: '3px' },
    btnPrimary: { padding: '9px 20px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
    toolbar: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchInput: { flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px' },
    select: { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', background: 'white' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '10px 12px', background: '#f8f7ff', borderBottom: '2px solid #e9d5ff', textAlign: 'left', fontWeight: 600, color: '#5b21b6', fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' },
    td: { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
    badge: (active) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: active ? '#d1fae5' : '#fee2e2', color: active ? '#065f46' : '#991b1b' }),
    btnSm: (color) => ({ padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: color === 'purple' ? '#ede9fe' : color === 'red' ? '#fee2e2' : '#f0fdf4', color: color === 'purple' ? '#5b21b6' : color === 'red' ? '#dc2626' : '#16a34a' }),
    pagination: { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '20px' },
    pageBtn: (active) => ({ padding: '6px 12px', border: `1px solid ${active ? '#7c3aed' : '#e0e0e0'}`, borderRadius: '6px', background: active ? '#7c3aed' : 'white', color: active ? 'white' : '#333', cursor: 'pointer', fontSize: '13px' }),
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalBox: { background: 'white', borderRadius: '16px', padding: '32px', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontSize: '18px', fontWeight: 700, color: '#1a1a2e', marginBottom: '24px' },
    field: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' },
    input: { width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    modalFooter: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' },
    btnCancel: { padding: '10px 20px', background: '#f5f5f5', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
    btnSave: { padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 },
    errorBox: { padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af' },
    thumb: { width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', background: '#f0e9ff' },
  };

  if (loading) return <div style={s.wrap}><div style={{ color: '#7c3aed', padding: '40px', textAlign: 'center' }}>Loading services...</div></div>;

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>🤝 Services Manager</div>
          <div style={s.stats}>{filtered.length} of {services.length} services · all pillars · services_master</div>
        </div>
        <button style={s.btnPrimary} onClick={openAdd}>+ Add Service</button>
      </div>

      {error && <div style={s.errorBox}>Error loading services: {error} — <button onClick={fetchServices} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>Retry</button></div>}

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          style={s.searchInput}
          placeholder="Search services..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select style={s.select} value={pillarFilter} onChange={e => { setPillarFilter(e.target.value); setPage(1); }}>
          <option value="all">All pillars</option>
          {['care','dine','celebrate','go','play','learn','paperwork','emergency','farewell','adopt','shop'].map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <select style={s.select} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="all">All categories</option>
          {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤝</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No services found</div>
          <div style={{ fontSize: '13px' }}>{search || categoryFilter !== 'all' ? 'Try adjusting filters' : 'Add your first service to get started'}</div>
        </div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Service</th>
              <th style={s.th}>Category</th>
              <th style={s.th}>Price</th>
              <th style={s.th}>Duration</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(svc => (
              <tr key={svc._id || svc.id} style={{ transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#faf5ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {svc.image_url || svc.watercolor_image ? (
                      <img src={svc.image_url || svc.watercolor_image} alt="" style={s.thumb} onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div style={{ ...s.thumb, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤝</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{svc.name}</div>
                      {svc.description && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.description}</div>}
                    </div>
                  </div>
                </td>
                <td style={s.td}><span style={{ fontSize: '12px', color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '10px' }}>{svc.category || '—'}</span></td>
                <td style={s.td}>
                  {svc.price ? (
                    <span style={{ fontWeight: 600 }}>₹{Number(svc.price).toLocaleString('en-IN')}</span>
                  ) : '—'}
                  {svc.price_unit && <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px' }}>{svc.price_unit}</span>}
                </td>
                <td style={s.td}>{svc.duration_mins ? `${svc.duration_mins} min` : '—'}</td>
                <td style={s.td}>
                  <span style={s.badge(svc.is_active !== false)}>{svc.is_active !== false ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={s.btnSm('purple')} onClick={() => openEdit(svc)}>Edit</button>
                    <button style={s.btnSm(svc.is_active !== false ? 'red' : 'green')} onClick={() => toggleActive(svc)}>
                      {svc.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button style={s.btnSm('red')} onClick={() => handleDelete(svc._id || svc.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn(false)} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
            return <button key={p} style={s.pageBtn(p === page)} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button style={s.pageBtn(false)} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={s.modalBox}>
            <div style={s.modalTitle}>{modal === 'add' ? '+ Add Service' : 'Edit Service'}</div>

            <div style={s.field}>
              <label style={s.label}>Service Name *</label>
              <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Dog Grooming" />
            </div>

            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What this service includes..." />
            </div>

            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Category</label>
                <select style={{ ...s.input }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Price (₹)</label>
                <input style={s.input} type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
              </div>
            </div>

            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Price Unit</label>
                <select style={{ ...s.input }} value={form.price_unit} onChange={e => setForm(f => ({ ...f, price_unit: e.target.value }))}>
                  {['per session', 'per hour', 'per day', 'per month', 'per visit', 'per km'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Duration (minutes)</label>
                <input style={s.input} type="number" min="0" value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: e.target.value }))} placeholder="e.g. 60" />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Tags (comma-separated)</label>
              <input style={s.input} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="grooming, spa, premium" />
            </div>

            <div style={s.field}>
              <label style={s.label}>Image URL (Cloudinary preferred)</label>
              <input style={s.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://res.cloudinary.com/duoapcx1p/..." />
              {form.image_url && <img src={form.image_url} alt="" style={{ marginTop: '8px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
            </div>

            <AIImagePromptField
              entityType="service"
              entityId={modal === 'edit' ? editId : undefined}
              currentPrompt={form.ai_image_prompt || ''}
              onPromptChange={val => setForm(f => ({ ...f, ai_image_prompt: val }))}
              onImageGenerated={(url, prompt) => setForm(f => ({ ...f, image_url: url, ai_image_prompt: prompt }))}
            />

            <div style={s.field}>
              <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Active (visible to members)
              </label>
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnCancel} onClick={closeModal}>Cancel</button>
              <button style={s.btnSave} onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : modal === 'add' ? 'Add Service' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
