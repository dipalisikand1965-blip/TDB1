import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../utils/api';

const PILLARS = ['','dine','celebrate','go','care','play','learn','farewell','paperwork','emergency','shop','adopt'];
const BREEDS = [
  '','akita','alaskan_malamute','american_bully','australian_shepherd','basenji','beagle',
  'bernese_mountain','bichon_frise','border_collie','boston_terrier','boxer','bulldog',
  'cavalier','cavalier_king_charles','chihuahua','chow_chow','cocker_spaniel','corgi',
  'dachshund','dalmatian','doberman','english_bulldog','french_bulldog','german_shepherd',
  'golden_retriever','great_dane','greyhound','havanese','husky','indian_pariah',
  'indian_spitz','indie','irish_setter','jack_russell','labradoodle','labrador',
  'lhasa_apso','maltese','maltipoo','newfoundland','pomeranian','poodle','pug',
  'rottweiler','saint_bernard','samoyed','schnoodle','scottish_terrier','shetland_sheepdog',
  'shih_tzu','siberian_husky','st_bernard','vizsla','weimaraner','yorkshire','yorkshire_terrier'
];

const ADMIN_AUTH = 'Basic ' + btoa('aditya:lola4304');

export default function SoulBox() {
  const [products, setProducts]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(0);
  const [pillar, setPillar]           = useState('');
  const [breed, setBreed]             = useState('');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('all');   // all | active | archived
  const [actionMsg, setActionMsg]     = useState('');
  const [generatingId, setGenerating] = useState(null);

  const LIMIT = 50;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        soul_made: 'true',
        status: statusFilter,
        limit: LIMIT,
        skip: page * LIMIT,
      });
      if (pillar)  params.set('pillar', pillar);
      if (breed)   params.set('breed', breed);
      if (search)  params.set('search', search);

      const res = await fetch(`${API_URL}/api/product-box/products?${params}`, {
        headers: { Authorization: ADMIN_AUTH }
      });
      const data = res.ok ? await res.json() : {};
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, pillar, breed, search, statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(0); }, [pillar, breed, search, statusFilter]);

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const toggleActive = async (product) => {
    const res = await fetch(`${API_URL}/api/admin/products/${product.id}/toggle-active`, {
      method: 'PATCH',
      headers: { Authorization: ADMIN_AUTH }
    });
    if (res.ok) {
      flash(`✓ ${product.name} toggled`);
      fetchProducts();
    }
  };

  const archiveProduct = async (product) => {
    if (!window.confirm(`Archive "${product.name}"? It will be hidden from all frontend views.`)) return;
    const res = await fetch(`${API_URL}/api/product-box/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_AUTH },
      body: JSON.stringify({ visibility: { status: 'archived' }, is_active: false })
    });
    if (res.ok) {
      flash(`✓ Archived: ${product.name}`);
      fetchProducts();
    }
  };

  const restoreProduct = async (product) => {
    const res = await fetch(`${API_URL}/api/product-box/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_AUTH },
      body: JSON.stringify({ visibility: { status: 'active' }, is_active: true })
    });
    if (res.ok) {
      flash(`✓ Restored: ${product.name}`);
      fetchProducts();
    }
  };

  const generateMockup = async (product) => {
    setGenerating(product.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: ADMIN_AUTH },
        body: JSON.stringify({ product_id: product.id, product_name: product.name, breed: product.breed })
      });
      const data = res.ok ? await res.json() : {};
      if (data.image_url || data.cloudinary_url) {
        flash(`✓ Image generated for ${product.name}`);
        fetchProducts();
      } else {
        flash(`⚠ Generation queued for ${product.name}`);
      }
    } catch (e) {
      flash(`✗ Error generating for ${product.name}`);
    } finally {
      setGenerating(null);
    }
  };

  const getImage = (p) =>
    p.cloudinary_url || p.mockup_url || p.watercolor_image || p.image_url || p.primary_image || null;

  const isArchived = (p) => p.visibility?.status === 'archived' || p.is_active === false;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '24px', background: '#f9fafb', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Soul Box</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            {total.toLocaleString()} soul_made products · manage images, archive & toggle per breed
          </p>
        </div>
        {actionMsg && (
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            {actionMsg}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <select value={pillar} onChange={e => setPillar(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}>
          <option value="">All Pillars</option>
          {PILLARS.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={breed} onChange={e => setBreed(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}>
          <option value="">All Breeds</option>
          {BREEDS.filter(Boolean).map(b => <option key={b} value={b}>{b.replace(/_/g,' ')}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}>
          <option value="all">Active + Draft</option>
          <option value="active">Active only</option>
          <option value="archived">Archived only</option>
        </select>

        <input
          placeholder="Search name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, minWidth: 200 }}
        />

        <button onClick={fetchProducts}
          style={{ padding: '7px 16px', borderRadius: 8, background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
              <th style={th}>Image</th>
              <th style={th}>Breed</th>
              <th style={{ ...th, textAlign: 'left', minWidth: 220 }}>Name</th>
              <th style={th}>Pillar</th>
              <th style={th}>Category</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No products found</td></tr>
            ) : products.map((p, i) => {
              const img = getImage(p);
              const archived = isArchived(p);
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', background: archived ? '#fef2f2' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  {/* Thumbnail */}
                  <td style={{ ...td, width: 90 }}>
                    {img
                      ? <img src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      : <div style={{ width: 80, height: 80, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11, border: '1px dashed #d1d5db' }}>no image</div>
                    }
                  </td>

                  {/* Breed */}
                  <td style={td}>
                    <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      {(p.breed || p.breed_tags?.[0] || '—').replace(/_/g,' ')}
                    </span>
                  </td>

                  {/* Name */}
                  <td style={{ ...td, textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#111' }}>{p.name}</div>
                    <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>{p.id}</div>
                  </td>

                  {/* Pillar */}
                  <td style={td}>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      {p.pillar || '—'}
                    </span>
                  </td>

                  {/* Category */}
                  <td style={{ ...td, color: '#6b7280', fontSize: 12 }}>
                    {p.category || p.product_type || '—'}
                  </td>

                  {/* Status */}
                  <td style={td}>
                    {archived
                      ? <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>Archived</span>
                      : p.is_active !== false
                        ? <span style={{ color: '#10b981', fontWeight: 600, fontSize: 12 }}>Active</span>
                        : <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12 }}>Off</span>
                    }
                  </td>

                  {/* Actions */}
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {/* Toggle Active */}
                      {!archived && (
                        <button onClick={() => toggleActive(p)}
                          style={{ ...btn, background: p.is_active !== false ? '#fef3c7' : '#d1fae5', color: p.is_active !== false ? '#92400e' : '#065f46' }}>
                          {p.is_active !== false ? 'Turn Off' : 'Turn On'}
                        </button>
                      )}

                      {/* Archive / Restore */}
                      {archived
                        ? <button onClick={() => restoreProduct(p)} style={{ ...btn, background: '#d1fae5', color: '#065f46' }}>Restore</button>
                        : <button onClick={() => archiveProduct(p)} style={{ ...btn, background: '#fee2e2', color: '#991b1b' }}>Archive</button>
                      }

                      {/* Generate Mockup */}
                      <button
                        onClick={() => generateMockup(p)}
                        disabled={generatingId === p.id}
                        style={{ ...btn, background: '#ede9fe', color: '#5b21b6', opacity: generatingId === p.id ? 0.6 : 1 }}>
                        {generatingId === p.id ? '⏳' : '✨ Gen'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ ...btn, background: '#f3f4f6', color: '#374151' }}>← Prev</button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Page {page + 1} of {totalPages} ({total} total)</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ ...btn, background: '#f3f4f6', color: '#374151' }}>Next →</button>
        </div>
      )}
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' };
const td = { padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' };
const btn = { padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
