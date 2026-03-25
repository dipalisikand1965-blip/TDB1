import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * AIImagePromptField — reusable AI image generation widget for admin editors.
 * Props:
 *   entityType: 'product' | 'service' | 'bundle' | 'breed_product'
 *   entityId:   string (saved ID of the entity)
 *   currentPrompt: initial prompt value
 *   onImageGenerated(url, prompt): callback when image is ready
 *   onPromptChange(prompt): callback when prompt text changes
 */
export default function AIImagePromptField({ entityType, entityId, currentPrompt = '', onImageGenerated, onPromptChange }) {
  const [prompt, setPrompt] = useState(currentPrompt);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPrompt(currentPrompt || '');
  }, [currentPrompt]);

  const handleChange = (val) => {
    setPrompt(val);
    onPromptChange?.(val);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const adminAuth = (() => { try { return 'Basic ' + localStorage.getItem('adminAuth'); } catch { return ''; } })();
      const res = await fetch(`${API_URL}/api/admin/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': adminAuth },
        body: JSON.stringify({ prompt: prompt.trim(), entity_type: entityType, entity_id: entityId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Generation failed');
      }
      const data = await res.json();
      setResult(data.url);
      onImageGenerated?.(data.url, prompt.trim());
    } catch (e) {
      setError(e.message || 'Failed to generate. Try a more descriptive prompt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 p-3 rounded-xl border border-purple-100 bg-purple-50/40">
      <Label className="text-xs font-bold flex items-center gap-1.5 text-purple-700">
        <Sparkles className="w-3.5 h-3.5" /> AI Image Prompt
      </Label>
      <textarea
        placeholder="Describe the image… e.g. 'Labrador wearing a premium bandana, flat-lay, clean white background, vibrant colours'"
        value={prompt}
        onChange={e => handleChange(e.target.value)}
        rows={3}
        className="w-full text-sm px-3 py-2 border border-purple-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white placeholder:text-gray-400"
        data-testid="ai-image-prompt-input"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          size="sm"
          disabled={loading || !prompt.trim()}
          onClick={handleGenerate}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
          data-testid="ai-generate-image-btn"
        >
          {loading
            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating…</>
            : <><Sparkles className="w-3 h-3 mr-1" /> Generate with AI</>}
        </Button>
        {result && <span className="text-xs text-green-600 font-semibold">✓ Image generated &amp; saved</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      {result && (
        <div className="flex items-start gap-2 mt-1">
          <div className="rounded-lg overflow-hidden border w-20 h-20 flex-shrink-0">
            <img src={result} alt="AI generated preview" className="w-full h-full object-cover" />
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed pt-1">
            Image generated &amp; saved to {entityType} record. It is also copied to the image URL field above.
          </p>
        </div>
      )}
    </div>
  );
}
