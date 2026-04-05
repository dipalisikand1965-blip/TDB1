import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../utils/api';
import ProductBoxEditor from './ProductBoxEditor';
import { toast } from '../../hooks/use-toast';

const BREEDS = [
  '','akita','alaskan_malamute','american_bully','australian_shepherd','basenji','beagle',
  'bernese_mountain','bichon_frise','border_collie','boston_terrier','boxer','bulldog',
  'cavalier','chihuahua','chow_chow','cocker_spaniel','corgi','dachshund','dalmatian',
  'doberman','french_bulldog','german_shepherd','golden_retriever','great_dane','greyhound',
  'havanese','husky','indian_pariah','indian_spitz','indie','irish_setter','jack_russell',
  'labradoodle','labrador','lhasa_apso','maltese','maltipoo','newfoundland','pomeranian',
  'poodle','pug','rottweiler','saint_bernard','samoyed','schnoodle','scottish_terrier',
  'shetland_sheepdog','shih_tzu','st_bernard','vizsla','weimaraner','yorkshire',
];

const SHOP_TYPES = [
  '','tshirts','hoodies','socks','calendars','cushions','rain_jacket',
  'Custom Portrait','Phone Case','Framed Wall Art','Canvas Print',
  'Ceramic Mug','Designer Bandana','Breed Keychain','Breed Ceramic Bowl',
  'bandana','portrait','mug','keychain','tote_bag','welcome_mat','frame','blanket','bowl',
];

const ADMIN_AUTH = 'Basic ' + btoa('aditya:lola4304');
const LIMIT = 50;

export default function ShopBox() {
  const [products, setProducts]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [page, setPage]                 = useState(0);
  const [breed, setBreed]               = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatus]       = useState('all');
  const [generatingId, setGenerating]   = useState(null);
  const [selectedProduct, setSelected]  = useState(null);
  const [showEditor, setShowEditor]     = useState(false);
  const [saving, setSaving]             = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pillar: 'shop',
        include_all: 'true',
        limit: LIMIT,
        skip: page * LIMIT,
      });
      if (breed)       params.set('breed', breed);
      if (typeFilter)  params.set('category', typeFilter);
      if (search)      params.set('search', search);
      if (statusFilter === 'active')   params.set('is_active', 'true');
      if (statusFilter === 'inactive') params.set('is_active', 'false');

      const res = await fetch(`${API_URL}/api/admin/breed-products?${params}`, {
        headers: { Authorization: ADMIN_AUTH },
      });
      const data = res.ok ? await res.json() : {};
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, breed, typeFilter, search, statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(0); }, [breed, typeFilter, search, statusFilter]);

  const openEditor = (p) => { setSelected({ ...p }); setShowEditor(true); };

  const saveProduct = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      // Shop products live in breed_products — update via breed-products patch endpoint
      const res = await fetch(`${API_URL}/api/admin/breed-products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: ADMIN_AUTH },
        body: JSON.stringify({
          name: selectedProduct.name,
          product_type: selectedProduct.product_type,
          cloudinary_url: selectedProduct.cloudinary_url,
          mockup_url: selectedProduct.mockup_url,
          watercolor_image: selectedProduct.watercolor_image,
          pillar: selectedProduct.pillar,
          pillars: selectedProduct.pillars,
          breed: selectedProduct.breed,
          is_active: selectedProduct.is_active,
          mockup_prompt: selectedProduct.mockup_prompt,
          description: selectedProduct.description,
        }),
      });
      if (res.ok) {
        toast({ title: 'Saved!', description: `${selectedProduct.name} updated` });
        setShowEditor(false);
        fetchProducts();
      } else {
        toast({ title: 'Save failed', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggleActive = async (e, p) => {
    e.stopPropagation();
    await fetch(`${API_URL}/api/admin/breed-products/${p.id}/toggle-active`, {
      method: 'PATCH', headers: { Authorization: ADMIN_AUTH },
    });
    fetchProducts();
  };

  const archiveProduct = async (e, p) => {
    e.stopPropagation();
    if (!window.confirm(`Archive "${p.name}"?`)) return;
    await fetch(`${API_URL}/api/admin/breed-products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ADMIN_AUTH },
      body: JSON.stringify({ visibility: { status: 'archived' }, is_active: false }),
    });
    toast({ title: `Archived: ${p.name}` });
    fetchProducts();
  };

  const generateMockup = async (e, p) => {
    e.stopPropagation();
    setGenerating(p.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: ADMIN_AUTH },
        body: JSON.stringify({ product_id: p.id, product_name: p.name, breed: p.breed }),
      });
      const data = res.ok ? await res.json() : {};
      toast({ title: data.image_url ? `Image generated!` : `Generation queued for ${p.name}` });
      if (data.image_url) fetchProducts();
    } catch { toast({ title: 'Generation error', variant: 'destructive' }); }
    finally { setGenerating(null); }
  };

  const getImage = (p) => p.cloudinary_url || p.mockup_url || p.watercolor_image || p.image_url || null;
  const isArchived = (p) => p.visibility?.status === 'archived' || p.is_active === false;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', padding: 24, background: '#f9fafb', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Shop Box</h2>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
          Manage breed merch — hoodies, tshirts, socks, calendars, portraits &amp; more ({total} total)
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minWidth: 180 }}
        />
        <select value={breed} onChange={e => setBreed(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
          <option value="">All Breeds</option>
          {BREEDS.filter(Boolean).map(b => <option key={b} value={b}>{b.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
          <option value="">All Types</option>
          {SHOP_TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={fetchProducts}
          style={{ padding: '6px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ marginBottom: 12, fontSize: 13, color: '#374151' }}>
        Showing {products.length} of {total} shop products
        {breed && ` · ${breed}`}
        {typeFilter && ` · ${typeFilter}`}
      </div>

      {/* Product grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>No shop products found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
          {products.map(p => {
            const img = getImage(p);
            const archived = isArchived(p);
            return (
              <div
                key={p.id}
                onClick={() => openEditor(p)}
                style={{
                  background: '#fff', border: `2px solid ${archived ? '#fca5a5' : '#e5e7eb'}`,
                  borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                  opacity: archived ? 0.65 : 1,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Image */}
                <div style={{ width: '100%', height: 150, background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
                  {img ? (
                    <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                      No image
                    </div>
                  )}
                  {archived && (
                    <div style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>
                      ARCHIVED
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '10px 10px 6px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: 1.3, marginBottom: 3 }}
                    title={p.name}>{p.name?.length > 40 ? p.name.slice(0,40)+'…' : p.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{p.product_type || p.category || '—'}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.breed || 'all'}</div>
                </div>

                {/* Actions */}
                <div style={{ padding: '0 8px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                  <button onClick={e => toggleActive(e, p)}
                    style={{ flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 4, border: '1px solid #d1d5db', background: p.is_active !== false ? '#d1fae5' : '#fff', cursor: 'pointer' }}>
                    {p.is_active !== false ? '✓ On' : '○ Off'}
                  </button>
                  <button onClick={e => generateMockup(e, p)}
                    disabled={generatingId === p.id}
                    style={{ flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 4, border: '1px solid #a78bfa', background: '#ede9fe', cursor: 'pointer' }}>
                    {generatingId === p.id ? '...' : '✦ Gen'}
                  </button>
                  {!archived ? (
                    <button onClick={e => archiveProduct(e, p)}
                      style={{ flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 4, border: '1px solid #fca5a5', background: '#fff', color: '#ef4444', cursor: 'pointer' }}>
                      Archive
                    </button>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); fetch(`${API_URL}/api/admin/breed-products/${p.id}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:ADMIN_AUTH},body:JSON.stringify({visibility:{status:'active'},is_active:true})}).then(()=>fetchProducts()); }}
                      style={{ flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 4, border: '1px solid #6ee7b7', background: '#fff', color: '#10b981', cursor: 'pointer' }}>
                      Restore
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}>
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: '#374151' }}>Page {page+1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: page >= totalPages-1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages-1 ? 0.5 : 1 }}>
            Next →
          </button>
        </div>
      )}

      {/* Editor modal — reuses ProductBoxEditor */}
      {showEditor && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowEditor(false)}>
          <div style={{ background: '#fff', borderRadius: 12, maxWidth: 700, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <ProductBoxEditor
              product={selectedProduct}
              onChange={setSelected}
              onSave={saveProduct}
              onCancel={() => setShowEditor(false)}
              saving={saving}
              onGenerateMiraHint={async () => {}}
              adminAuth={ADMIN_AUTH}
            />
          </div>
        </div>
      )}
    </div>
  );
}
