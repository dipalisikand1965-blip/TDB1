/**
 * MiraImaginesCard.jsx — Shared Mira Imagines card for ALL pillars
 * The Doggy Company
 *
 * Shows watercolour illustration (from Cloudinary cache) with pillar-colour
 * gradient fallback. Consistent card shape across all pillars.
 *
 * Usage:
 *   <MiraImaginesCard item={item} pet={pet} token={token} pillar="care" />
 *
 * item shape: { id, emoji, name, description }
 * Pillar colours match each pillar's accent system.
 */
import { useState, useEffect } from "react";
import { API_URL } from "../../utils/api";

// Pillar-specific fallback gradient + accent colour
const PILLAR_STYLE = {
  care:      { bg:"linear-gradient(135deg,#1B4332,#2D6A4F)", accent:"#40916C", badge:"#40916C" },
  dine:      { bg:"linear-gradient(135deg,#7C2D12,#C44400)", accent:"#FF8C42", badge:"#FF8C42" },
  go:        { bg:"linear-gradient(135deg,#0D2B22,#1A4A3A)", accent:"#1ABC9C", badge:"#1ABC9C" },
  play:      { bg:"linear-gradient(135deg,#1F2937,#374151)", accent:"#E76F51", badge:"#E76F51" },
  learn:     { bg:"linear-gradient(135deg,#0A0A3C,#1A1363)", accent:"#7C3AED", badge:"#7C3AED" },
  celebrate: { bg:"linear-gradient(135deg,#3B0764,#5B21B6)", accent:"#A855F7", badge:"#A855F7" },
  enjoy:     { bg:"linear-gradient(135deg,#1E1B4B,#312E81)", accent:"#6366F1", badge:"#6366F1" },
  default:   { bg:"linear-gradient(135deg,#1F2937,#111827)", accent:"#6B7280", badge:"#6B7280" },
};

export default function MiraImaginesCard({ item, pet, token, pillar = "learn", style: outerStyle = {} }) {
  const [state,  setState]  = useState("idle");
  const [imgUrl, setImgUrl] = useState(null);

  const petName  = pet?.name || "your dog";
  const breedKey = (pet?.breed || "indie")
    .toLowerCase()
    .replace(/\s*\(.*\)/, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  const style = PILLAR_STYLE[pillar] || PILLAR_STYLE.default;

  // Fetch cached Cloudinary watercolour — triggers background generation if missing
  useEffect(() => {
    if (!pillar || !breedKey) return;
    fetch(`${API_URL}/api/ai-images/pipeline/mira-imagines/${pillar}/${breedKey}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.url) {
          setImgUrl(d.url);
        } else {
          // Silently trigger generation for this pillar+breed combo
          fetch(`${API_URL}/api/ai-images/pipeline/mira-imagines?pillar=${pillar}&breed=${breedKey}&limit=1`, {
            method: "POST"
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, [pillar, breedKey]);

  const send = async () => {
    setState("sending");
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          parent_id:     storedUser?.id || storedUser?.email || "guest",
          pet_id:        pet?.id || "unknown",
          pillar,
          intent_primary: "mira_imagines_request",
          channel:       `${pillar}_mira_picks_imagines`,
          initial_message: {
            sender: "parent",
            text: `I'd love "${item.name}" for ${petName}. Mira imagined this — please help source it!`,
          },
        }),
      });
    } catch {}
    setState("sent");
  };

  return (
    <div
      data-testid={`mira-imagines-card-${item.id}`}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        background: style.bg,
        border: `1.5px solid rgba(255,255,255,0.12)`,
        display: "flex",
        flexDirection: "column",
        minHeight: 220,
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
        flexShrink: 0,
        width: 190,
        ...outerStyle,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.30)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Image / watercolour area */}
      <div style={{
        position: "relative",
        height: 140,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: `${style.bg}CC`,
      }}>
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={item.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
            onError={() => setImgUrl(null)}
          />
        ) : (
          <span style={{ fontSize: 44, zIndex: 2 }}>{item.emoji || "✦"}</span>
        )}
        {imgUrl && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)", zIndex: 2 }} />
        )}
        {/* Badge */}
        <div style={{
          position: "absolute", top: 8, left: 8, zIndex: 3,
          background: style.badge, color: "#fff",
          fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
        }}>
          Mira Imagines
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "10px 12px 4px" }}>
        <p style={{
          fontWeight: 800, color: "#fff", fontSize: 12,
          lineHeight: 1.3, marginBottom: 4,
        }}>
          {item.name}
        </p>
        <p style={{
          color: "rgba(255,255,255,0.55)", fontSize: 10,
          lineHeight: 1.4, margin: 0, fontStyle: "italic",
        }}>
          {item.description}
        </p>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 12px 12px" }}>
        {state === "sent" ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: style.accent }}>
            ✓ Sent to Concierge®!
          </div>
        ) : (
          <button
            onClick={send}
            disabled={state === "sending"}
            style={{
              width: "100%",
              background: `linear-gradient(135deg,${style.accent},rgba(255,255,255,0.10))`,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "9px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              opacity: state === "sending" ? 0.7 : 1,
            }}
          >
            {state === "sending" ? "Sending…" : "Tap — Concierge® →"}
          </button>
        )}
      </div>
    </div>
  );
}
