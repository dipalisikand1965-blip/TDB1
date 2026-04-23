/**
 * PlacesVerifiedManager.jsx — Admin → Places
 *
 * Concierge-curated TDC-verified places registry.
 * One-click "Mark as Verified" toggle → upserts into places_tdc_verified.
 * Marking a place verified makes it sort first in ALL NearMe results with
 * the ✦ TDC Verified badge (see /app/frontend/src/components/common/NearMeBadges.jsx).
 *
 * Also shows the "Top 5 most-booked unverified places per pillar" preview —
 * the same data that powers the nightly outreach digest email.
 */
import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../utils/api";

const PILLARS = ["care","go","play","learn","dine","celebrate","paperwork","emergency","farewell","adopt"];
const PILLAR_LABELS = {
  care: "🩺 Care", go: "✈️ Go", play: "🎾 Play", learn: "🎓 Learn",
  dine: "🍽️ Dine", celebrate: "🎂 Celebrate", paperwork: "📋 Paperwork",
  emergency: "🚨 Emergency", farewell: "🕊️ Farewell", adopt: "🐾 Adopt",
  general: "General",
};

export default function PlacesVerifiedManager() {
  const [verifiedList, setVerifiedList] = useState([]);
  const [topUnverified, setTopUnverified] = useState({});
  const [search, setSearch] = useState("");
  const [filterPillar, setFilterPillar] = useState("");
  const [loading, setLoading] = useState(false);
  const [digestSending, setDigestSending] = useState(false);
  const [digestResult, setDigestResult] = useState(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formPillar, setFormPillar] = useState("care");
  const [formPlaceId, setFormPlaceId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterPillar) params.set("pillar", filterPillar);
      const [vRes, tRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/places/verified?${params.toString()}`),
        fetch(`${API_URL}/api/admin/places/top-unverified?days=30&top_n=5`),
      ]);
      const v = await vRes.json();
      const t = await tRes.json();
      setVerifiedList(v.places || []);
      setTopUnverified(t.pillars || {});
    } catch (e) {
      console.error("[PlacesVerifiedManager] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [search, filterPillar]);

  useEffect(() => { load(); }, [load]);

  const addPlace = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setFormSaving(true); setFormMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/places/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          city: formCity.trim() || null,
          pillar: formPillar,
          place_id: formPlaceId.trim() || null,
          notes: formNotes.trim() || null,
          tdc_verified: true,
        }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        setFormMessage({ ok: true, text: `✦ Verified: ${formName}` });
        setFormName(""); setFormCity(""); setFormPlaceId(""); setFormNotes("");
        load();
      } else {
        setFormMessage({ ok: false, text: body.detail || "Failed to save" });
      }
    } catch (err) {
      setFormMessage({ ok: false, text: err.message });
    } finally {
      setFormSaving(false);
    }
  };

  const verifyFromTopList = async (row, pillar) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/places/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: row.name,
          city: row.city || null,
          pillar: pillar,
          place_id: row.place_id || null,
          tdc_verified: true,
        }),
      });
      if (res.ok) load();
    } catch (e) {
      console.error("verify failed", e);
    }
  };

  const toggleOff = async (place) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/places/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: place.name,
          city: place.city,
          pillar: place.pillar,
          place_id: place.place_id,
          notes: place.notes,
          tdc_verified: false,
        }),
      });
      if (res.ok) load();
    } catch (e) {
      console.error("toggle failed", e);
    }
  };

  const sendDigestNow = async () => {
    setDigestSending(true); setDigestResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/places/send-outreach-digest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      setDigestResult(body);
    } catch (e) {
      setDigestResult({ success: false, error: e.message });
    } finally {
      setDigestSending(false);
    }
  };

  const totalUnverified = Object.values(topUnverified).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <div className="space-y-6" data-testid="places-verified-manager">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-emerald-700 mb-1">
              ✦ Concierge Outreach Pipeline
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Places — TDC Verified Registry</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              One-click mark a Google Place as verified → it instantly sorts first in every pillar's NearMe results
              with the ✦ TDC Verified badge. Your concierge team can verify places in 10 seconds without touching code.
            </p>
          </div>
          <button
            onClick={sendDigestNow}
            disabled={digestSending}
            data-testid="places-send-digest-btn"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 flex-shrink-0"
          >
            {digestSending ? "Sending…" : "📧 Send outreach digest now"}
          </button>
        </div>
        {digestResult && (
          <div className={`mt-3 text-sm ${digestResult.success ? "text-emerald-700" : "text-rose-700"}`}>
            {digestResult.success
              ? `Digest sent — ${digestResult.total_unverified || 0} unverified places sent to ${(digestResult.recipients||[]).join(", ")}`
              : `Failed: ${digestResult.error}`}
          </div>
        )}
      </div>

      {/* Add new verified place form */}
      <form onSubmit={addPlace} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3" data-testid="places-verify-form">
        <div className="text-sm font-bold text-slate-800">Mark a place as ✦ TDC Verified</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text" placeholder="Place name (required)"
            value={formName} onChange={e=>setFormName(e.target.value)} required
            data-testid="places-form-name"
            className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <input
            type="text" placeholder="City"
            value={formCity} onChange={e=>setFormCity(e.target.value)}
            data-testid="places-form-city"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <select
            value={formPillar} onChange={e=>setFormPillar(e.target.value)}
            data-testid="places-form-pillar"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            {PILLARS.map(p => <option key={p} value={p}>{PILLAR_LABELS[p]}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text" placeholder="Google place_id (optional, but preferred)"
            value={formPlaceId} onChange={e=>setFormPlaceId(e.target.value)}
            data-testid="places-form-place-id"
            className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
          />
          <input
            type="text" placeholder="Notes (optional)"
            value={formNotes} onChange={e=>setFormNotes(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={formSaving || !formName.trim()}
            data-testid="places-form-submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
          >
            {formSaving ? "Saving…" : "✦ Mark Verified"}
          </button>
          {formMessage && (
            <span className={`text-sm ${formMessage.ok ? "text-emerald-700" : "text-rose-700"}`}>
              {formMessage.text}
            </span>
          )}
        </div>
      </form>

      {/* Top-booked unverified panel — outreach pipeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5" data-testid="places-top-unverified">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <div className="text-sm font-bold text-slate-800">Top-booked unverified places (last 30 days)</div>
            <div className="text-xs text-slate-500">Sorted by booking count. Verify in one click — they'll stop appearing here.</div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            {totalUnverified} open leads
          </span>
        </div>
        {totalUnverified === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center">No unverified bookings in the last 30 days.</div>
        ) : (
          <div className="space-y-4">
            {Object.keys(topUnverified).sort().map(pillar => (
              <div key={pillar}>
                <div className="text-xs font-bold text-slate-600 mb-1">{PILLAR_LABELS[pillar] || pillar}</div>
                <div className="space-y-1">
                  {topUnverified[pillar].map((row, i) => (
                    <div key={`${pillar}-${i}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50"
                      data-testid={`places-top-row-${pillar}-${i}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{row.name}</div>
                        <div className="text-xs text-slate-500">{row.city || "—"} · last booked {(row.last_booked||"").slice(0,10)}</div>
                      </div>
                      <div className="text-sm font-bold text-emerald-700 flex-shrink-0">{row.booking_count} bookings</div>
                      <button
                        onClick={() => verifyFromTopList(row, pillar)}
                        data-testid={`places-top-verify-${pillar}-${i}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex-shrink-0"
                      >
                        ✦ Verify
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current verified list */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5" data-testid="places-verified-list">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="text-sm font-bold text-slate-800">Currently verified places ({verifiedList.length})</div>
          <div className="flex gap-2">
            <input
              type="text" placeholder="Search name…"
              value={search} onChange={e=>setSearch(e.target.value)}
              data-testid="places-search-input"
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
            />
            <select
              value={filterPillar} onChange={e=>setFilterPillar(e.target.value)}
              data-testid="places-filter-pillar"
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
            >
              <option value="">All pillars</option>
              {PILLARS.map(p => <option key={p} value={p}>{PILLAR_LABELS[p]}</option>)}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500 py-4 text-center">Loading…</div>
        ) : verifiedList.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center">No verified places yet. Add one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">City</th>
                  <th className="py-2 pr-4">Pillar</th>
                  <th className="py-2 pr-4">Place ID</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {verifiedList.map((p, i) => (
                  <tr key={p.place_id || p.name_lower || i} className="border-b border-slate-100" data-testid={`places-verified-row-${i}`}>
                    <td className="py-2 pr-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2 pr-4 text-slate-600">{p.city || "—"}</td>
                    <td className="py-2 pr-4 text-slate-600">{PILLAR_LABELS[p.pillar] || p.pillar || "—"}</td>
                    <td className="py-2 pr-4 text-slate-500 font-mono text-xs">{p.place_id ? p.place_id.slice(0,16)+"…" : "—"}</td>
                    <td className="py-2 pr-4 text-slate-500 text-xs">{(p.updated_at || p.created_at || "").slice(0,10)}</td>
                    <td className="py-2">
                      <button
                        onClick={() => toggleOff(p)}
                        data-testid={`places-toggle-off-${i}`}
                        className="px-2.5 py-1 rounded-md text-xs font-bold text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
