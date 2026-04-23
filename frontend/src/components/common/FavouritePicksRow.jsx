/**
 * FavouritePicksRow.jsx
 * The Doggy Company
 *
 * Shows products matching the pet's known favourite treats / flavours /
 * ingredients. E.g. "Mojo loves coconut" → coconut products appear.
 *
 * Backend: GET /api/breed-catalogue/favourites?pet_id=…&pillar=…&limit=…
 *
 * Hidden silently when:
 *   - Pet has no favourite_treats recorded (nothing to show)
 *   - Backend returns 0 products (nothing matched)
 *
 * Props:
 *   pet       — pet object (must have pet.id)
 *   pillar    — optional pillar filter ("dine", "celebrate", etc.)
 *   limit     — max products to show (default 12)
 *   onView    — optional product-click handler; defaults to navigating to
 *               /product/{id} via window.location
 */
import { useEffect, useState } from "react";
import { API_URL } from "../../utils/api";
import { getProductImage } from "../ProductCard";
import { useAuth } from "../../context/AuthContext";

const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

export default function FavouritePicksRow({ pet, pillar, limit = 12, onView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [newFav, setNewFav] = useState("");
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!pet?.id) { setLoading(false); return; }
    let cancelled = false;
    const qs = new URLSearchParams({ pet_id: pet.id, limit: String(limit) });
    if (pillar) qs.set("pillar", pillar);
    fetch(`${API_URL}/api/breed-catalogue/favourites?${qs.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pet?.id, pillar, limit, reloadTick]);

  // Persist a newly-added favourite via the existing save-answers endpoint.
  // Merges with existing favorite_treats so nothing is overwritten.
  const handleAddFavourite = async () => {
    const raw = newFav.trim();
    if (!raw || !pet?.id) return;
    setSaving(true);
    try {
      // Merge new tokens with whatever the pet already had
      const existing = Array.isArray(pet?.doggy_soul_answers?.favorite_treats)
        ? pet.doggy_soul_answers.favorite_treats
        : (pet?.doggy_soul_answers?.favorite_treats
            ? [pet.doggy_soul_answers.favorite_treats]
            : []);
      // Split on commas/slashes/';' so "mango, papaya" both get saved
      const additions = raw.split(/[,/;]/).map(s => s.trim()).filter(Boolean);
      const merged = [...existing, ...additions.filter(a =>
        !existing.some(e => String(e).toLowerCase() === a.toLowerCase())
      )];
      const r = await fetch(`${API_URL}/api/pet-soul/save-answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pet_id: pet.id,
          pet_name: pet.name,
          soul_answers: { favorite_treats: merged },
          pet_data: { breed: pet.breed },
          answered_question_ids: ["favorite_treats"],
        }),
      });
      if (r.ok) {
        // Mutate local pet doc so the match-query logic upstream sees new tokens
        if (pet && pet.doggy_soul_answers) {
          pet.doggy_soul_answers.favorite_treats = merged;
        }
        setNewFav("");
        setEditing(false);
        setReloadTick(t => t + 1); // refetch with new favourites
      }
    } catch (_) { /* silent — UI stays open for retry */ }
    finally { setSaving(false); }
  };

  // Silently hide when data not loaded. Render an invitation card when the pet
  // has no favourites recorded yet — so parents see an obvious way to TEACH Mira.
  if (loading) return null;
  if (!data) return null;
  const hasPrefs = (data.preferences || []).length > 0;
  const hasProducts = (data.products || []).length > 0;

  // Empty-state invitation — only rendered when the pet has no favourites at all.
  // Tapping ✎ opens the inline editor so "Mojo also loves mango" can be added in-place.
  if (!hasPrefs && !editing) {
    return (
      <div data-testid="favourite-picks-invite" style={{ padding: "0 16px 20px" }}>
        <button
          data-testid="fav-add-first-btn"
          onClick={() => setEditing(true)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px",
            background: "linear-gradient(135deg,rgba(155,89,182,0.08),rgba(233,30,140,0.06))",
            border: "1px dashed rgba(233,30,140,0.35)",
            borderRadius: 14, cursor: "pointer",
            fontFamily: "inherit", textAlign: "left", color: "#1A1A2E",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: MIRA_ORB,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "#fff", flexShrink: 0,
          }}>✦</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
              Tell Mira what {pet?.name || "your dog"} loves
            </div>
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.35, fontStyle: "italic" }}>
              Coconut? Peanut butter? Salmon? She'll remember and surface matching picks.
            </div>
          </div>
          <div style={{ fontSize: 18, color: "#E91E8C" }}>✎</div>
        </button>
      </div>
    );
  }

  if (!hasProducts && !editing) {
    // Pet has preferences but no matching products AND we're not in editor mode.
    // Hide silently — the preference chip badge is already visible elsewhere and
    // we don't want to clutter the pillar page with "no matches" empty states.
    return null;
  }

  const petName = data.pet_name || pet?.name || "your dog";
  const prefs = data.preferences || [];
  const products = data.products || [];

  const handleClick = (p) => {
    if (onView) { onView(p); return; }
    if (typeof window !== "undefined" && p?.id) {
      window.location.href = `/product/${p.id}`;
    }
  };

  return (
    <div data-testid="favourite-picks-row" style={{ padding: "0 16px 24px" }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.92)",
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 12,
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        border: "1px solid rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: MIRA_ORB,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, color: "#fff", flexShrink: 0,
        }}>✦</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 800, color: "#1A1A2E",
            fontFamily: "Georgia, serif", marginBottom: 2,
          }}>
            {petName}'s Favourites
          </div>
          <div style={{ fontSize: 11, color: "#555", lineHeight: 1.4, fontStyle: "italic" }}>
            {data.mira_note || `Picks matched to what ${petName} loves.`}
          </div>
        </div>
      </div>

      {/* Preference chips */}
      {(prefs.length > 0 || editing) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          {prefs.map(pref => (
            <span
              key={pref}
              data-testid={`fav-pref-chip-${pref.replace(/\s+/g, "-")}`}
              style={{
                background: "rgba(233,30,140,0.10)",
                border: "1px solid rgba(233,30,140,0.35)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 10, fontWeight: 700,
                color: "#E91E8C",
                textTransform: "capitalize",
              }}
            >
              {pref}
              {data.matches_by_preference?.[pref] ? (
                <span style={{ opacity: 0.6, marginLeft: 4 }}>· {data.matches_by_preference[pref]}</span>
              ) : null}
            </span>
          ))}
          {/* ✎ Add-favourite chip / inline input */}
          {!editing ? (
            <button
              data-testid="fav-add-chip"
              onClick={() => setEditing(true)}
              style={{
                background: "transparent",
                border: "1px dashed rgba(155,89,182,0.45)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 10, fontWeight: 700,
                color: "#9B59B6",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✎ Add favourite
            </button>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                data-testid="fav-add-input"
                autoFocus
                value={newFav}
                onChange={e => setNewFav(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleAddFavourite();
                  if (e.key === "Escape") { setEditing(false); setNewFav(""); }
                }}
                placeholder={`${pet?.name || "your dog"} also loves…`}
                disabled={saving}
                style={{
                  border: "1px solid rgba(155,89,182,0.45)",
                  borderRadius: 20,
                  padding: "3px 10px",
                  fontSize: 11,
                  minWidth: 160,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                data-testid="fav-add-save"
                onClick={handleAddFavourite}
                disabled={saving || !newFav.trim()}
                style={{
                  background: "#E91E8C", color: "#fff", border: "none",
                  borderRadius: 20, padding: "3px 10px",
                  fontSize: 10, fontWeight: 700,
                  cursor: saving || !newFav.trim() ? "not-allowed" : "pointer",
                  opacity: saving || !newFav.trim() ? 0.5 : 1,
                  fontFamily: "inherit",
                }}
              >
                {saving ? "..." : "Save"}
              </button>
              <button
                data-testid="fav-add-cancel"
                onClick={() => { setEditing(false); setNewFav(""); }}
                disabled={saving}
                style={{
                  background: "transparent", color: "#555",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 20, padding: "3px 10px",
                  fontSize: 10, fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Horizontal scroll product row */}
      <div style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 8,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}>
        {products.map((p) => {
          const img = getProductImage?.(p) || p.primary_image || p.image_url || p.images?.[0];
          return (
            <div
              key={p.id || p.name}
              data-testid={`favourite-pick-${p.id || p.name}`}
              onClick={() => handleClick(p)}
              style={{
                flexShrink: 0,
                width: 160,
                background: "#fff",
                borderRadius: 14,
                overflow: "hidden",
                cursor: "pointer",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{
                height: 110,
                background: "linear-gradient(135deg,#FFF8EE,#FFE9C9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {img
                  ? <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                         onError={e => { e.target.style.display = "none"; }} />
                  : <span style={{ fontSize: 32 }}>✦</span>}
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "#E91E8C", fontWeight: 700, marginBottom: 4, textTransform: "capitalize" }}>
                  {p._matched_preference ? `✦ ${p._matched_preference}` : "✦ favourite"}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: "#1A1A2E",
                  lineHeight: 1.3, marginBottom: 6,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}>
                  {p.name}
                </div>
                {p.price != null && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#C9973A" }}>
                    ₹{Number(p.price).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
