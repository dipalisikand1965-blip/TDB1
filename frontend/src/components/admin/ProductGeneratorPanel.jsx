/**
 * ProductGeneratorPanel.jsx
 * Admin UI for the AI Celebrate Product Generator
 *
 * Features:
 *  - Start/Stop AI generation for all 8 celebrate pillars
 *  - Live progress: phase indicator, progress bar, current item
 *  - Live product image grid (last 20 images as they generate)
 *  - Category breakdown stats
 *  - Per-product image regenerate button
 *
 * Route: Available in CelebrateManager as "Generate" tab
 */

import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../utils/api';
import {
  Sparkles, PlayCircle, StopCircle, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, ImagePlus, Package
} from 'lucide-react';

const PILLAR_CATEGORIES = [
  { pillar: 'Food & Flavour',   cats: ['cakes', 'treats', 'desi-treats', 'nut-butters'],     icon: '🍰' },
  { pillar: 'Play & Joy',       cats: ['toys'],                                               icon: '🎾' },
  { pillar: 'Social & Friends', cats: ['party_kits', 'pawty_kits', 'party_accessories'],      icon: '🦋' },
  { pillar: 'Adventure & Move', cats: ['accessories'],                                        icon: '🌅' },
  { pillar: 'Grooming',         cats: ['grooming'],                                           icon: '✨' },
  { pillar: 'Learning & Mind',  cats: ['puzzle_toys', 'training'],                            icon: '🧠' },
  { pillar: 'Health & Wellness',cats: ['supplements', 'health', 'wellness_birthday'],         icon: '💚' },
  { pillar: 'Love & Memory',    cats: ['memory_books', 'portraits'],                          icon: '📸' },
];

const PHASE_LABELS = {
  idle:    { label: 'Ready to generate', color: '#888' },
  seeding: { label: 'Seeding products into database...', color: '#C44DFF' },
  imaging: { label: 'Generating AI images via Cloudinary...', color: '#FF6B9D' },
  done:    { label: 'Generation complete', color: '#22C55E' },
  error:   { label: 'Error — check logs', color: '#EF4444' },
};

const ProductGeneratorPanel = ({ token }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  // Excel seed state
  const [excelStatus, setExcelStatus] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelPolling, setExcelPolling] = useState(false);
  const [activeTab, setActiveTab] = useState('excel'); // 'excel' | 'generator'

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchStatus = useCallback(async () => {
    try {
      const resp = await fetch(`${API_URL}/api/admin/celebrate/generation-status`, { headers });
      if (!resp.ok) return;
      const data = JSON.parse(await resp.text());
      setStatus(data);
      if (!data.running) setPolling(false);
    } catch (e) {
      console.error('[ProductGenerator] Status fetch failed:', e);
    }
  }, [token]);

  const fetchExcelStatus = useCallback(async () => {
    try {
      const resp = await fetch(`${API_URL}/api/admin/celebrate/excel-seed-status`, { headers });
      if (!resp.ok) return;
      const data = JSON.parse(await resp.text());
      setExcelStatus(data);
      if (!data.running) setExcelPolling(false);
    } catch (e) {
      console.error('[ExcelSeed] Status fetch failed:', e);
    }
  }, [token]);

  // Poll every 3s when running
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [polling, fetchStatus]);

  useEffect(() => {
    if (!excelPolling) return;
    const interval = setInterval(fetchExcelStatus, 3000);
    return () => clearInterval(interval);
  }, [excelPolling, fetchExcelStatus]);

  // Initial status load
  useEffect(() => {
    fetchStatus();
    fetchExcelStatus();
  }, [fetchStatus, fetchExcelStatus]);

  const startGeneration = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/admin/celebrate/seed-and-generate`, {
        method: 'POST', headers,
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }
      if (resp.ok) {
        setPolling(true);
        await fetchStatus();
      } else {
        alert(data.detail || data.message || 'Failed to start generation');
      }
    } catch (e) {
      alert(`Generation failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startExcelSeed = async () => {
    setExcelLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/admin/celebrate/seed-from-excel`, {
        method: 'POST', headers,
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }
      if (resp.ok) {
        setExcelPolling(true);
        await fetchExcelStatus();
      } else {
        alert(data.detail || data.message || 'Failed to start Excel seed');
      }
    } catch (e) {
      alert(`Excel seed failed: ${e.message}`);
    } finally {
      setExcelLoading(false);
    }
  };

  const regenerateImage = async (productId, productName) => {
    const resp = await fetch(`${API_URL}/api/admin/products/${productId}/regenerate-image`, {
      method: 'POST', headers,
    });
    if (resp.ok) {
      alert(`Image regeneration started for "${productName}"`);
    }
  };

  const isRunning = status?.running;
  const phase = status?.phase || 'idle';
  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.idle;

  const seeded = status?.seeded || 0;
  const imagesDone = status?.images_done || 0;
  const imagesFailed = status?.images_failed || 0;
  const totalProducts = status?.total_products || 0;
  const recentImages = status?.recent_images || [];
  const catCounts = status?.category_counts || {};

  const progressPct = totalProducts > 0
    ? Math.round((imagesDone / totalProducts) * 100)
    : 0;

  // Excel seed derived state
  const excelRunning = excelStatus?.running;
  const excelPhase = excelStatus?.phase || 'idle';
  const excelPhaseInfo = PHASE_LABELS[excelPhase] || PHASE_LABELS.idle;
  const excelSeeded = excelStatus?.seeded || 0;
  const excelImagesDone = excelStatus?.images_done || 0;
  const excelImagesFailed = excelStatus?.images_failed || 0;
  const excelTotal = excelStatus?.total || 0;
  const excelRecentImages = excelStatus?.recent_images || [];
  const excelPillarCounts = excelStatus?.pillar_counts || {};
  const excelProgressPct = excelTotal > 0 ? Math.round((excelImagesDone / excelTotal) * 100) : 0;

  const EXCEL_PILLARS = [
    { key: 'food', label: 'Food & Flavour', count: 14 },
    { key: 'play', label: 'Play & Joy', count: 14 },
    { key: 'social', label: 'Social & Friends', count: 11 },
    { key: 'adventure', label: 'Adventure & Move', count: 10 },
    { key: 'grooming', label: 'Grooming & Beauty', count: 12 },
    { key: 'learning_memory', label: 'Learning & Memory', count: 21 },
    { key: 'health', label: 'Health & Wellness', count: 11 },
  ];

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[
          { id: 'excel', label: 'Excel Catalog Seed (93 Products)' },
          { id: 'generator', label: 'AI Generator (Legacy)' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700 bg-purple-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ EXCEL CATALOG SEED TAB ═══ */}
      {activeTab === 'excel' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Excel Catalog Seed
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Seeds <strong>93 products</strong> from the <em>Celebrate_ProductCatalogue_SEED.xlsx</em> across all 8 pillars, then generates AI images.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchExcelStatus}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              {!excelRunning ? (
                <button
                  onClick={startExcelSeed}
                  disabled={excelLoading}
                  data-testid="start-excel-seed-btn"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #C44DFF)' }}
                >
                  {excelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {excelLoading ? 'Starting...' : excelPhase === 'done' ? 'Re-seed Excel' : 'Seed 93 Products + AI Images'}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {excelPhase === 'seeding' ? 'Seeding products...' : 'Generating images...'}
                </div>
              )}
            </div>
          </div>

          {/* Status card */}
          {excelStatus && (
            <div className="rounded-2xl p-5 border"
              style={{
                background: excelRunning ? 'linear-gradient(135deg, #FAF5FF, #EEF2FF)' : excelPhase === 'done' ? 'linear-gradient(135deg, #F0FDF4, #ECFDF5)' : '#FAFAFA',
                borderColor: excelRunning ? '#C4B5FD' : excelPhase === 'done' ? '#BBF7D0' : '#E5E7EB',
              }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {excelRunning ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: excelPhaseInfo.color }} /> :
                    excelPhase === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                    excelPhase === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> :
                    <Package className="w-5 h-5 text-gray-400" />}
                  <span className="font-semibold text-sm" style={{ color: excelPhaseInfo.color }}>
                    {excelPhaseInfo.label}
                  </span>
                </div>
                {excelRunning && excelStatus.current_item && (
                  <span className="text-xs text-gray-400 italic">Current: {excelStatus.current_item}</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Products Seeded', value: excelSeeded, icon: '🌱', color: '#7C3AED' },
                  { label: 'Images Generated', value: excelImagesDone, icon: '🖼', color: '#22C55E' },
                  { label: 'Images Failed', value: excelImagesFailed, icon: '⚠️', color: '#EF4444' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
                    <div style={{ fontSize: 22 }}>{stat.icon}</div>
                    <div className="text-2xl font-black mt-1" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {(excelRunning || excelPhase === 'done') && excelTotal > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Image Generation Progress</span>
                    <span>{excelImagesDone}/{excelTotal} ({excelProgressPct}%)</span>
                  </div>
                  <div className="rounded-full overflow-hidden h-2.5 bg-gray-100">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${excelProgressPct}%`, background: 'linear-gradient(90deg, #7C3AED, #C44DFF)' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pillar breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Products per Pillar (Excel Catalog)</h3>
            <div className="grid grid-cols-4 gap-2">
              {EXCEL_PILLARS.map(p => (
                <div key={p.key} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-black" style={{ color: (excelPillarCounts[p.key] || 0) >= p.count ? '#22C55E' : (excelPillarCounts[p.key] || 0) > 0 ? '#C44DFF' : '#D1D5DB' }}>
                    {excelPillarCounts[p.key] ?? '—'}<span className="text-gray-300 text-xs">/{p.count}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 leading-tight">{p.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live image grid */}
          {excelRecentImages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-purple-500" />
                Live Generated Images ({excelRecentImages.length})
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                {[...excelRecentImages].reverse().map((item, idx) => (
                  <div key={item.id || idx} className="group relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={item.url} alt={item.name} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-3 px-2">
                      <p className="text-white text-[9px] text-center font-medium leading-tight mb-2">{item.name}</p>
                      <button onClick={() => regenerateImage(item.id, item.name)}
                        className="text-[9px] bg-white/20 text-white rounded-full px-2 py-1 border border-white/30 hover:bg-white/30">
                        Regen
                      </button>
                    </div>
                    <div className="px-2 pb-2 pt-1">
                      <p className="text-[9px] text-gray-500 font-mono truncate">{item.sku}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ LEGACY AI GENERATOR TAB ═══ */}
      {activeTab === 'generator' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Celebrate Product Generator
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Seeds 60+ products across all 8 celebrate pillars + generates contextual AI images
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchStatus} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              {!isRunning ? (
                <button onClick={startGeneration} disabled={loading} data-testid="start-generation-btn"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  {loading ? 'Starting...' : 'Start Generation'}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </div>
              )}
            </div>
          </div>

      {/* Status Card */}
      {status && (
        <div className="rounded-2xl p-5 border"
          style={{
            background: isRunning
              ? 'linear-gradient(135deg, #FAF5FF, #FDF2F8)'
              : phase === 'done'
                ? 'linear-gradient(135deg, #F0FDF4, #ECFDF5)'
                : '#FAFAFA',
            borderColor: isRunning ? '#E9D5FF' : phase === 'done' ? '#BBF7D0' : '#E5E7EB',
          }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: phaseInfo.color }} />
              ) : phase === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : phase === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Package className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-semibold text-sm" style={{ color: phaseInfo.color }}>
                {phaseInfo.label}
              </span>
            </div>
            {isRunning && status.current_item && (
              <span className="text-xs text-gray-400 italic">
                Current: {status.current_item}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Products Seeded', value: seeded, icon: '🌱', color: '#C44DFF' },
              { label: 'Images Generated', value: imagesDone, icon: '🖼️', color: '#22C55E' },
              { label: 'Images Failed', value: imagesFailed, icon: '⚠️', color: '#EF4444' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
                <div style={{ fontSize: 22 }}>{stat.icon}</div>
                <div className="text-2xl font-black mt-1" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar (imaging phase) */}
          {(isRunning || phase === 'done') && totalProducts > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Image Generation Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="rounded-full overflow-hidden h-2.5 bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, #C44DFF, #FF6B9D)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category breakdown */}
      {Object.keys(catCounts).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">New Category Product Counts</h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(catCounts).map(([cat, count]) => (
              <div key={cat}
                className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                <div className="text-2xl font-black"
                  style={{ color: count > 0 ? '#C44DFF' : '#D1D5DB' }}>
                  {count}
                </div>
                <div className="text-xs text-gray-400 mt-1 leading-tight">{cat}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live image grid */}
      {recentImages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-purple-500" />
            Live Generated Images ({recentImages.length})
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
            {[...recentImages].reverse().map((item, idx) => (
              <div key={item.id || idx} className="group relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-3 px-2">
                  <p className="text-white text-[9px] text-center font-medium leading-tight mb-2">
                    {item.name}
                  </p>
                  <button
                    onClick={() => regenerateImage(item.id, item.name)}
                    className="text-[9px] bg-white/20 text-white rounded-full px-2 py-1 border border-white/30 hover:bg-white/30"
                  >
                    Regen
                  </button>
                </div>
                <div className="px-2 pb-2 pt-1">
                  <p className="text-[9px] text-gray-400 truncate">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pillar breakdown guide */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Products Seeded Per Pillar</h3>
        <div className="space-y-2">
          {PILLAR_CATEGORIES.map(p => (
            <div key={p.pillar} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <span className="text-sm font-medium text-gray-700 flex-1">{p.pillar}</span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {p.cats.map(c => (
                  <span key={c}
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: catCounts[c] > 0 ? '#F3E8FF' : '#F3F4F6',
                      color: catCounts[c] > 0 ? '#7C3AED' : '#9CA3AF',
                    }}>
                    {c}: {catCounts[c] ?? '—'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default ProductGeneratorPanel;
