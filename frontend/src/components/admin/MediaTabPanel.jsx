/**
 * MediaTabPanel.jsx
 * Reusable full media panel for all admin edit modals.
 * Provides: file upload → Cloudinary, manual URL paste, AI generate, image preview.
 */
import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Upload, Link, Image, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function getAdminAuth() {
  const basic = localStorage.getItem('adminAuth');
  if (basic && basic !== 'null' && basic.length > 5) return `Basic ${basic}`;
  if (sessionStorage.getItem('admin_authenticated') === 'true') {
    const user = sessionStorage.getItem('admin_username') || 'aditya';
    const pwd  = sessionStorage.getItem('admin_password') || 'lola4304';
    return `Basic ${btoa(`${user}:${pwd}`)}`;
  }
  const bearer = localStorage.getItem('adminToken') || localStorage.getItem('tdb_admin_token');
  if (bearer && bearer !== 'null') return `Bearer ${bearer}`;
  return `Basic ${btoa('aditya:lola4304')}`;
}

/**
 * Auto-generate a contextual AI prompt from entity data + type
 */
export function buildAutoPrompt(entityType, name = '', breed = '', description = '') {
  const n = name || 'product';
  const b = breed || '';
  switch (entityType) {
    case 'service':
      return `Watercolor illustration of ${n} pet care service, soft pastel tones, artistic brushstrokes, white background, NO text, NO words`;
    case 'bundle':
      return `Watercolor illustration of ${n} gift bundle for dogs, soft pastel colors, ribbon tied box, white background, NO text`;
    case 'soul_product':
    case 'breed_product':
      return `Realistic product mockup of ${b ? b + ' dog' : 'dog'} using ${n}, product photography, clean white studio background, no text`;
    case 'breed_cake':
      return `Flat lay photography of custom birthday cake designed for ${b || 'dog'}, ${n}, pastel background, top-down shot, bakery style, no text`;
    case 'product':
    default:
      return `Realistic product photo of ${n}, professional product photography, clean white background, natural lighting, no text, no words`;
  }
}

/**
 * MediaTabPanel props:
 *   imageUrl:         current image URL (string)
 *   onImageChange:    (url: string) => void — called on any image change
 *   entityType:       'product' | 'service' | 'bundle' | 'soul_product' | 'breed_product' | 'breed_cake'
 *   entityId:         string (saved entity id — for auto-saving generated image)
 *   entityName:       string (for auto-prompt)
 *   breed:            string (for auto-prompt)
 *   uploadEndpoint:   string (optional custom upload endpoint)
 */
export default function MediaTabPanel({
  imageUrl = '',
  onImageChange,
  entityType = 'product',
  entityId = '',
  entityName = '',
  breed = '',
  uploadEndpoint,
}) {
  const [url, setUrl]           = useState(imageUrl);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGen]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Keep in sync if parent changes url
  React.useEffect(() => { setUrl(imageUrl || ''); }, [imageUrl]);

  // Build auto-prompt when name/breed changes
  React.useEffect(() => {
    setAiPrompt(buildAutoPrompt(entityType, entityName, breed));
  }, [entityType, entityName, breed]);

  const notify = (newUrl) => {
    setUrl(newUrl);
    onImageChange?.(newUrl);
  };

  // ── File upload → Cloudinary ───────────────────────────────────────────────
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const endpoint = uploadEndpoint || `${API_URL}/api/upload/product-image`;
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'omit',
        headers: { Authorization: getAdminAuth() },
        body: fd,
      });
      const data = await res.json();
      const savedUrl = data.url || data.image_url || data.cloudinary_url;
      if (savedUrl) {
        notify(savedUrl);
        toast({ title: 'Image uploaded' });
      } else {
        toast({ title: 'Upload failed', description: data.detail || 'No URL returned', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Upload error', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // ── AI generate ────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGen(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/generate-image`, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json', Authorization: getAdminAuth() },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          entity_type: entityType,
          entity_id: entityId || '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Generation failed (${res.status})`);
      }
      const data = await res.json();
      if (data.url) {
        notify(data.url);
        toast({ title: 'Image generated' });
      }
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGen(false);
    }
  };

  return (
    <div className="space-y-5 py-2">
      {/* 1. File upload */}
      <div>
        <Label className="text-sm font-semibold">Choose Image File</Label>
        <p className="text-xs text-gray-500 mb-2">Uploads to Cloudinary — persists through deployments</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
          data-testid="media-upload-btn"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            : <><Upload className="w-4 h-4" /> Choose Image File</>}
        </Button>
      </div>

      {/* 2. Manual URL */}
      <div>
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5" /> Primary Image URL
        </Label>
        <Input
          placeholder="https://res.cloudinary.com/…"
          value={url}
          onChange={e => notify(e.target.value)}
          className="mt-1 text-sm font-mono"
          data-testid="media-url-input"
        />
      </div>

      {/* 3. AI Generate */}
      <div className="space-y-2 p-3 rounded-xl border border-purple-100 bg-purple-50/40">
        <Label className="text-xs font-bold flex items-center gap-1.5 text-purple-700">
          <Sparkles className="w-3.5 h-3.5" /> Generate AI Image
        </Label>
        <p className="text-[10px] text-gray-500">
          {entityType === 'service' ? 'Watercolor illustration' :
           entityType === 'bundle'  ? 'Watercolor illustration' :
           entityType === 'soul_product' || entityType === 'breed_product' ? 'Realistic mockup with breed' :
           entityType === 'breed_cake' ? 'Flat lay photography' :
           'Realistic product photo'} — no text, no words on image
        </p>
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          rows={3}
          placeholder="Describe the image…"
          className="w-full text-sm px-3 py-2 border border-purple-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          data-testid="media-ai-prompt-input"
        />
        <Button
          type="button"
          size="sm"
          disabled={generating || !aiPrompt.trim()}
          onClick={handleGenerate}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
          data-testid="media-ai-generate-btn"
        >
          {generating
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
            : <><Sparkles className="w-3 h-3" /> Generate with AI</>}
        </Button>
      </div>

      {/* 4. Image preview */}
      {url && (
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Image className="w-3.5 h-3.5" /> Preview
          </Label>
          <div className="relative inline-block">
            <img
              src={url}
              alt="preview"
              className="w-40 h-40 object-cover rounded-xl border shadow-sm"
              data-testid="media-image-preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
