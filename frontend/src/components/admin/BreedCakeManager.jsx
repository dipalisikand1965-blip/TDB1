/**
 * BreedCakeManager.jsx
 * Admin panel for Breed Cake Illustrations (Yappy-style)
 * Same capability as SoulProductsManager — generate, view, edit, upload, regenerate
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Play, Square, RefreshCw, Image, Trash2, Download, Search } from 'lucide-react';
import CloudinaryUploader from './CloudinaryUploader';

const API_URL   = process.env.REACT_APP_BACKEND_URL || '';
const AUTH      = { Authorization: `Basic ${btoa('aditya:lola4304')}`, 'Content-Type': 'application/json' };

const BREEDS_WITH_VARIANTS = {
  indie: ['Ginger','Black','Fawn','Brindle','Patchy'],
  labrador: ['Yellow','Black','Chocolate','Fox Red'],
  golden_retriever: ['Light Golden','Dark Golden','Cream','Red'],
  beagle: ['Tricolour','Lemon','Red & White','Chocolate Tri'],
  husky: ['Blue Eyes','Hetero Eyes','White','Agouti'],
  pug: ['Fawn','Black','Silver'],
  german_shepherd: ['Black & Tan','Sable','Black','White'],
  poodle: ['White','Apricot','Silver','Black'],
  cocker_spaniel: ['Golden','Black','Blue Roan','Chocolate'],
  dachshund: ['Chocolate','Red','Black & Tan','Dapple'],
};

export default function BreedCakeManager() {
  const [activeTab,    setActiveTab]    = useState('gallery');
  const [status,       setStatus]       = useState(null);
  const [illustrations,setIllustrations]= useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [editItem,     setEditItem]     = useState(null);
  const [regenerating, setRegenerating] = useState(new Set());
  const pollRef = useRef(null);

  // ── Fetch all cake illustrations ──────────────────────────────────────────
  const fetchIllustrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mockups/breed-products?product_type=birthday_cake&limit=500`, { headers: AUTH });
      if (res.ok) {
        const data = await res.json();
        setIllustrations(data.products || data || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  // ── Poll generation status ────────────────────────────────────────────────
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/mockup-gen-status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.running) {
          pollRef.current = setTimeout(pollStatus, 4000);
        } else {
          fetchIllustrations();
        }
      }
    } catch { /* silent */ }
  }, [fetchIllustrations]);

  useEffect(() => {
    fetchIllustrations();
    pollStatus();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [fetchIllustrations, pollStatus]);

  // ── Start full generation ─────────────────────────────────────────────────
  const startGeneration = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/generate-breed-cakes`, { method: 'POST', headers: AUTH });
      if (res.ok) {
        const data = await res.json();
        toast.success(`🎂 Generation started — ${data.total_variants} variants across ${data.breeds} breeds`);
        pollStatus();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to start');
      }
    } catch { toast.error('Failed to start generation'); }
  };

  // ── Stop generation ───────────────────────────────────────────────────────
  const stopGeneration = async () => {
    await fetch(`${API_URL}/api/mockups/stop-mockup-gen`, { method: 'POST' });
    toast.info('Stopping after current item…');
  };

  // ── Regenerate a single variant ───────────────────────────────────────────
  const regenerateVariant = async (item) => {
    setRegenerating(p => new Set([...p, item.id]));
    try {
      const res = await fetch(`${API_URL}/api/mockups/generate`, {
        method: 'POST',
        headers: AUTH,
        body: JSON.stringify({
          breed:        item.breed,
          product_type: 'birthday_cake',
          product_id:   item.id,
          name:         item.name,
          colour_variant: item.colour_variant || '',
          force:        true,
        }),
      });
      if (res.ok) {
        toast.success(`Regenerating ${item.name}…`);
        setTimeout(fetchIllustrations, 8000);
      } else toast.error('Regeneration failed');
    } catch { toast.error('Regeneration failed'); }
    setRegenerating(p => { const n = new Set(p); n.delete(item.id); return n; });
  };

  // ── Delete a variant ──────────────────────────────────────────────────────
  const deleteVariant = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/breed-products/${item.id}`, { method: 'DELETE', headers: AUTH });
      if (res.ok) {
        setIllustrations(p => p.filter(i => i.id !== item.id));
        toast.success('Deleted');
      }
    } catch { toast.error('Delete failed'); }
  };

  // ── Grouped by breed ──────────────────────────────────────────────────────
  const filtered = illustrations.filter(i =>
    !search || i.breed?.includes(search.toLowerCase()) || i.name?.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = filtered.reduce((acc, item) => {
    const b = item.breed || 'unknown';
    if (!acc[b]) acc[b] = [];
    acc[b].push(item);
    return acc;
  }, {});

  const pct = status?.total > 0 ? Math.round((status.generated / status.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🎂 Breed Cake Illustrations</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Yappy-style flat face portraits for cake printing · {illustrations.length} variants generated
          </p>
        </div>
        <div className="flex gap-2">
          {status?.running ? (
            <Button onClick={stopGeneration} variant="destructive" size="sm">
              <Square className="w-3 h-3 mr-1" /> Stop
            </Button>
          ) : (
            <Button onClick={startGeneration} className="bg-purple-600 hover:bg-purple-700" size="sm">
              <Play className="w-3 h-3 mr-1" /> Generate All Breeds
            </Button>
          )}
          <Button onClick={fetchIllustrations} variant="outline" size="sm">
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Generation progress bar */}
      {status?.running && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-800">
              Generating: {status.current || '…'}
            </span>
            <span className="text-sm text-purple-600">{status.generated}/{status.total} ({pct}%)</span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-purple-500 mt-1">
            Failed: {status.failed || 0} · Skipped: {status.skipped || 0}
          </p>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gallery">Gallery ({illustrations.length})</TabsTrigger>
          <TabsTrigger value="generation">Generation</TabsTrigger>
        </TabsList>

        {/* ── GALLERY TAB ────────────────────────────────────────────── */}
        <TabsContent value="gallery" className="space-y-6 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search breed or variant…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({length:12}).map((_,i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No illustrations yet</p>
              <p className="text-sm mt-1">Click "Generate All Breeds" to start</p>
            </div>
          ) : (
            Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([breed, items]) => (
              <div key={breed}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold text-gray-800 capitalize">{breed.replace(/_/g,' ')}</h3>
                  <Badge variant="outline" className="text-xs">{items.length} variants</Badge>
                  {BREEDS_WITH_VARIANTS[breed] && (
                    <span className="text-xs text-gray-400">
                      ({BREEDS_WITH_VARIANTS[breed].length} expected)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3">
                  {items.map(item => (
                    <Card
                      key={item.id}
                      className={`overflow-hidden hover:shadow-md transition-all ${editItem?.id===item.id?'ring-2 ring-purple-500':''}`}
                    >
                      {/* Image */}
                      <div
                        className="aspect-square bg-gray-50 cursor-pointer relative group"
                        onClick={() => setEditItem(editItem?.id===item.id ? null : item)}
                      >
                        {item.mockup_url || item.cloudinary_url ? (
                          <img
                            src={item.cloudinary_url || item.mockup_url}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                      </div>
                      {/* Info */}
                      <div className="p-2">
                        <Badge
                          className={`text-[10px] mb-1 ${item.mockup_url ? 'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}
                        >
                          {item.colour_label || item.product_type}
                        </Badge>
                        <p className="text-[11px] font-medium text-gray-700 truncate">{item.name}</p>
                        {/* Actions */}
                        <div className="flex gap-1 mt-1.5">
                          <button
                            onClick={() => regenerateVariant(item)}
                            disabled={regenerating.has(item.id)}
                            title="Regenerate with AI"
                            className="flex-1 p-1 rounded bg-purple-50 hover:bg-purple-100 disabled:opacity-40 transition-colors"
                          >
                            <RefreshCw className={`w-3 h-3 mx-auto text-purple-600 ${regenerating.has(item.id)?'animate-spin':''}`} />
                          </button>
                          {(item.mockup_url || item.cloudinary_url) && (
                            <a
                              href={item.cloudinary_url || item.mockup_url}
                              target="_blank" rel="noopener noreferrer"
                              title="Open full image"
                              className="flex-1 p-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              <Download className="w-3 h-3 mx-auto text-blue-600" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteVariant(item)}
                            title="Delete"
                            className="p-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Edit panel (inline) */}
                {editItem && items.find(i=>i.id===editItem.id) && (
                  <div className="mt-3 p-4 border border-purple-200 rounded-xl bg-purple-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-purple-800">{editItem.name}</h4>
                      <button onClick={()=>setEditItem(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                    </div>
                    {/* Cloudinary uploader for manual image replacement */}
                    <div>
                      <p className="text-xs font-semibold text-purple-700 mb-2">Replace illustration (upload custom image)</p>
                      <CloudinaryUploader
                        productId={editItem.id}
                        currentImageUrl={editItem.cloudinary_url || editItem.mockup_url}
                        onUploadSuccess={(url) => {
                          setIllustrations(p => p.map(i =>
                            i.id === editItem.id ? {...i, mockup_url:url, cloudinary_url:url} : i
                          ));
                          setEditItem(p => ({...p, mockup_url:url, cloudinary_url:url}));
                          toast.success('Image updated!');
                        }}
                      />
                    </div>
                    {/* Prompt preview */}
                    {editItem.mockup_prompt && (
                      <div>
                        <p className="text-xs font-semibold text-purple-700 mb-1">Generation prompt</p>
                        <p className="text-xs text-gray-600 bg-white rounded-lg p-2 border">
                          {editItem.mockup_prompt}
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={() => regenerateVariant(editItem)}
                      disabled={regenerating.has(editItem.id)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1.5 ${regenerating.has(editItem.id)?'animate-spin':''}`} />
                      Regenerate with AI
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* ── GENERATION TAB ─────────────────────────────────────────── */}
        <TabsContent value="generation" className="mt-4 space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-gray-800 mb-1">Yappy-Style Flat Face Generation</h3>
            <p className="text-sm text-gray-500 mb-4">
              Generates head-only flat vector illustrations per breed colour variant.
              Indie gets 5 variants, most breeds get 3–4. 161 total variants across 50 breeds.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Total variants</p>
                <p className="font-bold text-2xl text-gray-800">161</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Generated so far</p>
                <p className="font-bold text-2xl text-green-700">{illustrations.length}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {status?.running ? (
                <Button onClick={stopGeneration} variant="destructive">
                  <Square className="w-4 h-4 mr-2" /> Stop Generation
                </Button>
              ) : (
                <Button onClick={startGeneration} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="w-4 h-4 mr-2" />
                  {illustrations.length > 0 ? 'Resume / Regenerate Missing' : 'Start Generation'}
                </Button>
              )}
            </div>
          </Card>

          {/* Per-breed expected variants */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Expected variants per breed</h4>
            <div className="space-y-2">
              {Object.entries(BREEDS_WITH_VARIANTS).map(([breed, variants]) => {
                const generated = illustrations.filter(i => i.breed === breed).length;
                return (
                  <div key={breed} className="flex items-center gap-3">
                    <span className="text-sm w-36 capitalize text-gray-700">{breed.replace(/_/g,' ')}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (generated/variants.length)*100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{generated}/{variants.length}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Cloudinary config status */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-1">☁️ Cloudinary Auto-Upload</h4>
            <p className="text-sm text-blue-700">
              All generated images are automatically uploaded to Cloudinary and stored as <code>cloudinary_url</code>.
              The cake modal fetches <code>cloudinary_url → mockup_url → image_url</code> in order —
              so images appear in the user-facing modal as soon as they are generated.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
