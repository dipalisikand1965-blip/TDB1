/**
 * ConciergeToast.jsx
 * Slides up from the bottom when user taps "Book via Concierge"
 * on any Google Places card (Stays, Spots, PlayNearMe, CareNearMe).
 *
 * Usage:
 *   <ConciergeToast toast={conciergeToast} onClose={() => setConciergeToast(null)} />
 *
 *   toast = { name, type, ticketId, pillar } | null
 */
import { useEffect } from "react";

const PILLAR_COLOR = {
  go:         "#1ABC9C",
  dine:       "#FF8C42",
  care:       "#4CAF8D",
  play:       "#E76F51",
  learn:      "#7C3AED",
  paperwork:  "#0D9488",
  emergency:  "#DC2626",
  adopt:      "#D4537E",
  farewell:   "#6366F1",
  celebrate:  "#A855F7",
  shop:       "#C9973A",
  services:   "#334155",
};

export default function ConciergeToast({ toast, onClose }) {
  // Auto-dismiss after 5 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const accent = PILLAR_COLOR[toast.pillar] || "#FF8C42";

  return (
    <div
      data-testid="concierge-toast"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "min(400px, calc(100vw - 32px))",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.20)",
        border: `2px solid ${accent}`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        animation: "ctSlideUp 0.3s ease",
      }}
    >
      <style>{`@keyframes ctSlideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Check icon */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `linear-gradient(135deg,${accent},${accent}cc)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, color: "#fff", flexShrink: 0,
      }}>✓</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A", marginBottom: 2 }}>
          Sent to Concierge!
        </div>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4, marginBottom: toast.ticketId ? 4 : 0 }}>
          {toast.name
            ? <>We're on it — enquiry raised for <strong style={{ color: accent }}>{toast.name}</strong></>
            : "Your concierge enquiry has been raised."}
        </div>
        {toast.ticketId && (
          <div style={{ fontSize: 11, color: "#999", fontFamily: "monospace" }}>
            {toast.ticketId}
          </div>
        )}
      </div>

      <button
        data-testid="concierge-toast-close"
        onClick={onClose}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 16, color: "#aaa", padding: 2, flexShrink: 0,
          lineHeight: 1,
        }}
      >✕</button>
    </div>
  );
}
