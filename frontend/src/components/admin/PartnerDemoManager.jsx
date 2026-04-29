/**
 * PartnerDemoManager.jsx — Admin tab for AI-Powered Partner Proposal Generator
 *
 * Form → Generate with Claude → Preview → Edit → Publish → Share link
 * Lists all proposals with view counts, viewer emails, copy/edit/delete.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sparkles, Copy, Trash2, Edit3, RefreshCw, ExternalLink, Plus,
  Eye, Mail, Calendar, ChevronDown, ChevronUp, Save, X, Wand2,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const INDUSTRIES = [
  { value: 'bank', label: 'Bank / Financial Services' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'pet_store', label: 'Pet Store' },
  { value: 'grooming', label: 'Grooming Chain' },
  { value: 'vet_hospital', label: 'Vet Hospital' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'airline', label: 'Airline' },
  { value: 'other', label: 'Other' },
];

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

const PartnerDemoManager = ({ authHeaders }) => {
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expandedSlug, setExpandedSlug] = useState(null);
  const [editingSlug, setEditingSlug] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  const [form, setForm] = useState({
    partner_name: '',
    industry: 'bank',
    target_audience: '',
    partner_logo: '',
    contact_email: '',
  });

  const headers = { 'Content-Type': 'application/json', ...(authHeaders || {}) };

  const loadDemos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/admin/partner-demos`, { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDemos(data.demos || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => { loadDemos(); }, [loadDemos]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.partner_name.trim() || !form.target_audience.trim()) {
      setError('Partner name and target audience are required');
      return;
    }
    setGenerating(true); setError('');
    try {
      const res = await fetch(`${API}/api/admin/partner-demos/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          partner_name: form.partner_name.trim(),
          industry: form.industry,
          target_audience: form.target_audience.trim(),
          partner_logo: form.partner_logo.trim() || null,
          contact_email: form.contact_email.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Generation failed');
      setForm({ partner_name: '', industry: 'bank', target_audience: '', partner_logo: '', contact_email: '' });
      await loadDemos();
      setExpandedSlug(data.slug);
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm(`Soft-delete proposal "${slug}"? It will be hidden from public view.`)) return;
    try {
      const res = await fetch(`${API}/api/admin/partner-demos/${slug}`, {
        method: 'DELETE', headers: authHeaders,
      });
      if (!res.ok) throw new Error('Delete failed');
      await loadDemos();
    } catch (e) { setError(e.message); }
  };

  const handleRegenerate = async (slug, section) => {
    if (!window.confirm(`Regenerate "${section}" with Mira? Current content will be replaced.`)) return;
    try {
      const res = await fetch(`${API}/api/admin/partner-demos/${slug}/regenerate-section?section=${section}`, {
        method: 'POST', headers,
      });
      if (!res.ok) throw new Error('Regen failed');
      await loadDemos();
    } catch (e) { setError(e.message); }
  };

  const handleSaveEdit = async () => {
    if (!editingSlug || !editDraft) return;
    try {
      const res = await fetch(`${API}/api/admin/partner-demos/${editingSlug}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ generated: editDraft }),
      });
      if (!res.ok) throw new Error('Save failed');
      setEditingSlug(null); setEditDraft(null);
      await loadDemos();
    } catch (e) { setError(e.message); }
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/proposal/${slug}`;
    navigator.clipboard.writeText(url);
    // Lightweight feedback; toast lib isn't imported here
    setError('');
    const el = document.getElementById(`copy-${slug}`);
    if (el) {
      const orig = el.innerText;
      el.innerText = '✓ Copied!';
      setTimeout(() => { el.innerText = orig; }, 1400);
    }
  };

  return (
    <div className="space-y-6" data-testid="partner-demo-manager">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-600" />
            Partner Proposals
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            AI-generate tailored B2B proposal pages. Each lives at <code className="text-xs bg-gray-100 px-1 rounded">/proposal/&#123;slug&#125;</code> · email-gated · lead-tracked.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDemos} data-testid="reload-demos-btn">
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Reload
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* GENERATE FORM */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-900">
          <Sparkles className="w-5 h-5" /> Generate New Proposal
        </h3>
        <form onSubmit={handleGenerate} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Partner name *</label>
            <input
              type="text"
              value={form.partner_name}
              onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
              placeholder="e.g. HDFC Bank"
              required
              data-testid="form-partner-name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Industry *</label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              data-testid="form-industry"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 bg-white"
            >
              {INDUSTRIES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Target audience *</label>
            <input
              type="text"
              value={form.target_audience}
              onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
              placeholder="e.g. Premium credit cardholders"
              required
              data-testid="form-target-audience"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Partner logo URL (optional)</label>
            <input
              type="url"
              value={form.partner_logo}
              onChange={(e) => setForm({ ...form, partner_logo: e.target.value })}
              placeholder="https://…/logo.png"
              data-testid="form-logo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Contact email (CTA)</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="partnerships@…"
              data-testid="form-contact-email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={generating}
              data-testid="generate-demo-btn"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Mira is writing your proposal…</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate with Mira (Claude Sonnet 4.5)</>
              )}
            </Button>
            {generating && (
              <p className="text-xs text-purple-600 mt-2">This takes 15–30 seconds. Claude is crafting industry-specific stats, scenarios, and a demo pet.</p>
            )}
          </div>
        </form>
      </Card>

      {/* DEMOS LIST */}
      <div>
        <h3 className="font-bold text-lg mb-3 text-gray-900">All Proposals ({demos.length})</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
        ) : demos.length === 0 ? (
          <Card className="p-8 text-center">
            <Plus className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No proposals yet. Generate your first one above.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {demos.map((demo) => {
              const isExpanded = expandedSlug === demo.slug;
              const isEditing = editingSlug === demo.slug;
              return (
                <Card key={demo.slug} className={`overflow-hidden ${!demo.is_active ? 'opacity-60' : ''}`}>
                  <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {demo.partner_logo ? (
                        <img src={demo.partner_logo} alt="" className="w-10 h-10 object-contain rounded" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {demo.partner_name.slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                          {demo.partner_name}
                          {!demo.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                          <Badge variant="secondary" className="text-xs">{demo.industry}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{demo.target_audience}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(demo.created_at)}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {demo.view_count || 0} view{demo.view_count === 1 ? '' : 's'}</span>
                          {demo.last_viewed_at && <span className="text-purple-600">Last: {fmtDate(demo.last_viewed_at)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => copyLink(demo.slug)}
                        data-testid={`copy-link-${demo.slug}`}
                      >
                        <span id={`copy-${demo.slug}`} className="flex items-center"><Copy className="w-3 h-3 mr-1" /> Copy link</span>
                      </Button>
                      <a href={`/proposal/${demo.slug}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" data-testid={`open-${demo.slug}`}>
                          <ExternalLink className="w-3 h-3 mr-1" /> Open
                        </Button>
                      </a>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setExpandedSlug(isExpanded ? null : demo.slug)}
                        data-testid={`toggle-${demo.slug}`}
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                        {isExpanded ? 'Hide' : 'Details'}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleDelete(demo.slug)}
                        className="text-red-600 hover:bg-red-50 hover:border-red-300"
                        data-testid={`delete-${demo.slug}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">Public URL: <code className="bg-white px-2 py-0.5 rounded border">{`${window.location.origin}/proposal/${demo.slug}`}</code></div>
                        {!isEditing ? (
                          <Button size="sm" variant="ghost" onClick={() => { setEditingSlug(demo.slug); setEditDraft(JSON.parse(JSON.stringify(demo.generated))); }}>
                            <Edit3 className="w-3 h-3 mr-1" /> Edit content
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700"><Save className="w-3 h-3 mr-1" /> Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingSlug(null); setEditDraft(null); }}><X className="w-3 h-3" /></Button>
                          </div>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Hero headline" value={isEditing ? editDraft.hero_headline : demo.generated.hero_headline}
                          onChange={isEditing ? (v) => setEditDraft({ ...editDraft, hero_headline: v }) : null}
                          onRegen={() => handleRegenerate(demo.slug, 'hero')} />
                        <Field label="Hero subtext" value={isEditing ? editDraft.hero_subtext : demo.generated.hero_subtext}
                          onChange={isEditing ? (v) => setEditDraft({ ...editDraft, hero_subtext: v }) : null}
                          onRegen={() => handleRegenerate(demo.slug, 'hero')} multiline />
                      </div>

                      <Section title="Stats" onRegen={() => handleRegenerate(demo.slug, 'stats')}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {demo.generated.stats.map((s, i) => (
                            <div key={i} className="bg-white border rounded p-2">
                              <div className="font-bold text-purple-700">{s.value}</div>
                              <div className="text-[11px] text-gray-500">{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </Section>

                      <Section title={`Demo pet — ${demo.generated.demo_pet.name}`} onRegen={() => handleRegenerate(demo.slug, 'demo_pet')}>
                        <div className="text-xs text-gray-700">
                          {demo.generated.demo_pet.breed} · {demo.generated.demo_pet.age_years}y · Soul {demo.generated.demo_pet.soul_score}% · Allergy: {demo.generated.demo_pet.allergy} · Loves: {demo.generated.demo_pet.favorite_treat}
                          {demo.generated.demo_pet.personality && (
                            <div className="text-gray-500 mt-1">Personality: {demo.generated.demo_pet.personality.join(', ')}</div>
                          )}
                        </div>
                      </Section>

                      <Section title={`Demo scenarios (${demo.generated.demo_scenarios.length})`} onRegen={() => handleRegenerate(demo.slug, 'demo_scenarios')}>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {demo.generated.demo_scenarios.map((s, i) => (
                            <div key={i} className="bg-white border rounded p-2 text-xs">
                              <span className="mr-1">{s.emoji}</span> {s.text}
                              <div className="text-gray-400 text-[10px] mt-0.5">{s.intent}</div>
                            </div>
                          ))}
                        </div>
                      </Section>

                      <Section title="Pitch copy" onRegen={() => handleRegenerate(demo.slug, 'pitch_copy')}>
                        {isEditing ? (
                          <textarea
                            value={editDraft.pitch_copy}
                            onChange={(e) => setEditDraft({ ...editDraft, pitch_copy: e.target.value })}
                            rows={6}
                            className="w-full text-xs border rounded p-2"
                          />
                        ) : (
                          <div className="text-xs text-gray-700 whitespace-pre-wrap">{demo.generated.pitch_copy}</div>
                        )}
                      </Section>

                      <Section title="Partnership angle">
                        {isEditing ? (
                          <textarea
                            value={editDraft.partnership_angle}
                            onChange={(e) => setEditDraft({ ...editDraft, partnership_angle: e.target.value })}
                            rows={2}
                            className="w-full text-xs border rounded p-2"
                          />
                        ) : (
                          <div className="text-xs italic text-amber-700">{demo.generated.partnership_angle}</div>
                        )}
                      </Section>

                      {demo.viewers && demo.viewers.length > 0 && (
                        <Section title={`Viewers (${demo.viewers.length})`}>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {demo.viewers.slice(-10).reverse().map((v, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px] bg-white border rounded px-2 py-1">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {v.email}{v.name ? ` (${v.name})` : ''}</span>
                                <span className="text-gray-400">{fmtDate(v.at)}</span>
                              </div>
                            ))}
                          </div>
                        </Section>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, onRegen, multiline }) => (
  <div className="bg-white border rounded p-2">
    <div className="flex items-center justify-between mb-1">
      <div className="text-[11px] uppercase text-gray-500 font-medium">{label}</div>
      {onRegen && (
        <button onClick={onRegen} className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Regen
        </button>
      )}
    </div>
    {onChange ? (
      multiline ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full text-xs border rounded p-1.5" />
      ) : (
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full text-xs border rounded p-1.5" />
      )
    ) : (
      <div className="text-xs text-gray-800">{value}</div>
    )}
  </div>
);

const Section = ({ title, onRegen, children }) => (
  <div className="bg-gray-100 rounded p-3">
    <div className="flex items-center justify-between mb-2">
      <div className="text-xs font-semibold uppercase text-gray-600">{title}</div>
      {onRegen && (
        <button onClick={onRegen} className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Regenerate this section
        </button>
      )}
    </div>
    {children}
  </div>
);

export default PartnerDemoManager;
