import React, { useState, useEffect, useCallback } from 'react';

// ─── PillarManager.jsx ────────────────────────────────────────────────────────
// Path: /app/frontend/src/components/admin/PillarManager.jsx
//
// Universal pillar admin component — used by GoManager, PlayManager, and any
// future pillar that doesn't need a specialised UI.
//
// Architecture per ARCHITECTURE.md:
//   products_master  → pillar field = 'go' | 'play' | etc.
//   services_master  → pillar field = 'go' | 'play' | etc.
//   bundles          → pillar field = 'go' | 'play' | etc.
//
// Props:
//   token          — JWT auth token
//   pillar         — pillar id string e.g. 'go', 'play'
//   pillarLabel    — display name e.g. 'Go', 'Play'
//   pillarEmoji    — emoji icon e.g. '✈️', '🎾'
//   pillarColor    — accent hex color
//   pillarDescription — short description shown in header
//   categories     — string[] for the category filter dropdown
//   noteText       — optional warning/note shown below header

const API = (path) => `/api${path}`;

export default function PillarManager({
  token,
  pillar,
  pillarLabel,
  pillarEmoji = '🐾',
  pillarColor = '#7c3aed',
  pillarDescription = '',
  categories = [],
  noteText = null,
}) {
  const [tab, setTab] = useState('products'); // 'products' | 'services' | 'bundles'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url;
      if (tab === 'products') {
        url = API(`/admin/pillar-products?pillar=${pillar}&limit=500`);
      } else if (tab === 'services') {
        url = API(`/service-box/services?pillar=${pillar}&limit=500`);
      } else {
        url = API(`/bundles?pillar=${pillar}`);
      }
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.products || data.services || data.bundles || [];
      setItems(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, pillar, tab]);

  useEffect(() => { fetchItems(); setPage(1); }, [fetchItems]);

  const filtered = items.filter(item => {
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter || item.sub_category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleActive = async (item) => {
    const id = item._id || item.id;
    const endpoint = tab === 'products' ? `/admin/products/${id}` : `/service-box/services/${id}`;
    try {
      await fetch(API(endpoint), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...item, is_active: !item.is_active, locally_edited: true }),
      });
      setItems(prev => prev.map(i => (i._id || i.id) === id ? { ...i, is_active: !i.is_active } : i));
    } catch (e) {
      alert(`Failed: ${e.message}`);
    }
  };

  const s = {
    wrap: { fontFamily: 'system-ui, sans-serif', padding: '24px' },
    header: { marginBottom: '20px' },
    titleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
    emoji: { fontSize: '28px' },
    title: { fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
    desc: { fontSize: '13px', color: '#666', marginBottom: '4px' },
    note: { fontSize: '12px', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '6px 12px', borderRadius: '6px', marginBottom: '12px' },
    tabs: { display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #f0f0f0', paddingBottom: '0' },
    tabBtn: (active) => ({
      padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
      fontSize: '13px', fontWeight: active ? 700 : 400,
      color: active ? pillarColor : '#666',
      borderBottom: active ? `2px solid ${pillarColor}` : '2px solid transparent',
      marginBottom: '-2px', transition: 'all 0.15s',
    }),
    toolbar: { display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' },
    input: { flex: 1, minWidth: '180px', padding: '7px 11px', border: '1px solid #e0e0e0', borderRadius: '7px', fontSize: '13px' },
    select: { padding: '7px 11px', border: '1px solid #e0e0e0', borderRadius: '7px', fontSize: '13px', background: 'white' },
    stats: { fontSize: '12px', color: '#888', marginBottom: '10px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '9px 10px', background: '#faf5ff', borderBottom: `2px solid ${pillarColor}20`, textAlign: 'left', fontWeight: 600, fontSize: '11px', color: pillarColor, textTransform: 'uppercase', letterSpacing: '0.04em' },
    td: { padding: '9px 10px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
    activeBadge: (active) => ({ display: 'inline-block', padding: '2px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: active ? '#d1fae5' : '#fee2e2', color: active ? '#065f46' : '#991b1b' }),
    toggleBtn: (active) => ({ padding: '3px 9px', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: active ? '#fee2e2' : '#d1fae5', color: active ? '#dc2626' : '#16a34a' }),
    thumb: { width: '36px', height: '36px', borderRadius: '5px', objectFit: 'cover', background: '#f0e9ff', flexShrink: 0 },
    pagination: { display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', marginTop: '16px' },
    pageBtn: (active) => ({ padding: '5px 10px', border: `1px solid ${active ? pillarColor : '#e0e0e0'}`, borderRadius: '5px', background: active ? pillarColor : 'white', color: active ? 'white' : '#333', cursor: 'pointer', fontSize: '12px' }),
    empty: { textAlign: 'center', padding: '48px', color: '#9ca3af' },
    errorBox: { padding: '10px 14px', background: '#fee2e2', borderRadius: '7px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' },
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.titleRow}>
          <span style={s.emoji}>{pillarEmoji}</span>
          <div style={s.title}>{pillarLabel} Manager</div>
        </div>
        {pillarDescription && <div style={s.desc}>{pillarDescription}</div>}
        {noteText && <div style={s.note}>ℹ️ {noteText}</div>}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[
          { key: 'products', label: 'Products' },
          { key: 'services', label: 'Services' },
          { key: 'bundles', label: 'Bundles' },
        ].map(t => (
          <button key={t.key} style={s.tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div style={s.errorBox}>Error: {error} — <button onClick={fetchItems} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>Retry</button></div>}

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input style={s.input} placeholder={`Search ${pillarLabel.toLowerCase()} ${tab}...`}
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        {categories.length > 0 && (
          <select style={s.select} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div style={s.stats}>
        Showing {paginated.length} of {filtered.length} {tab}
        {filtered.length !== items.length && ` (${items.length} total)`}
        {' · '}pillar=<strong>{pillar}</strong>
      </div>

      {/* Table */}
      {loading ? (
        <div style={s.empty}>Loading {tab}...</div>
      ) : paginated.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>{pillarEmoji}</div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>No {tab} found</div>
          <div style={{ fontSize: '12px' }}>{search ? 'Try adjusting your search' : `No ${tab} tagged with pillar=${pillar} yet`}</div>
        </div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Item</th>
              <th style={s.th}>Category</th>
              {tab !== 'bundles' && <th style={s.th}>Price</th>}
              {tab === 'products' && <th style={s.th}>Brand</th>}
              <th style={s.th}>Status</th>
              {tab !== 'bundles' && <th style={s.th}>Toggle</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map(item => {
              const id = item._id || item.id;
              const active = item.is_active !== false;
              const img = item.image_url || item.watercolor_image || item.image;
              return (
                <tr key={id}
                  onMouseEnter={e => e.currentTarget.style.background = `${pillarColor}08`}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {img ? (
                        <img src={img} alt="" style={s.thumb} onError={e => e.target.style.display = 'none'} />
                      ) : (
                        <div style={{ ...s.thumb, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{pillarEmoji}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e' }}>{item.name || item.title}</div>
                        {item.sku && <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>{item.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: '11px', color: pillarColor, background: `${pillarColor}15`, padding: '2px 8px', borderRadius: '10px' }}>
                      {item.category || item.sub_category || '—'}
                    </span>
                  </td>
                  {tab !== 'bundles' && (
                    <td style={s.td}>
                      {item.price ? <span style={{ fontWeight: 600 }}>₹{Number(item.price).toLocaleString('en-IN')}</span> : '—'}
                    </td>
                  )}
                  {tab === 'products' && (
                    <td style={s.td}><span style={{ fontSize: '12px', color: '#666' }}>{item.brand || '—'}</span></td>
                  )}
                  <td style={s.td}><span style={s.activeBadge(active)}>{active ? 'Active' : 'Inactive'}</span></td>
                  {tab !== 'bundles' && (
                    <td style={s.td}>
                      <button style={s.toggleBtn(active)} onClick={() => toggleActive(item)}>
                        {active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn(false)} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return <button key={p} style={s.pageBtn(p === page)} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button style={s.pageBtn(false)} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
        </div>
      )}
    </div>
  );
}
