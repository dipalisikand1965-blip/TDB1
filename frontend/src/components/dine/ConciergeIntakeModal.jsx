/*
 * ConciergeIntakeModal.jsx
 * The Doggy Company — /dine page
 *
 * The Dining Concierge intake modal.
 * Opens from:
 *   1. "Talk to your Concierge" CTA button (brown box)
 *   2. "Tap to book →" on each service card
 *   3. "Reserve via Concierge" on pet-friendly spot cards
 *
 * HOW TO USE:
 *   import ConciergeIntakeModal from "../components/dine/ConciergeIntakeModal";
 *
 *   <ConciergeIntakeModal
 *     pet={pet}
 *     onClose={() => setOpen(false)}
 *     prefilledOccasion="Reservation Assistance"   // optional
 *     prefilledVenue="The Doggy Café"              // optional
 *   />
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { API_URL } from "../../utils/api";

// --- Data & Constants ---
const OCCASIONS = [
  "Restaurant Discovery",
  "Reservation Assistance",
  "Dining Etiquette Guidance",
  "Venue Suitability Check",
  "Special Diet Planning",
  "Pet-Friendly Café Hunt",
  "Outdoor Dining",
  "Treat-Safe Menu Review",
  "Just because",
];

// --- Component Definition ---
export default function ConciergeIntakeModal({
  pet,
  onClose,
  prefilledOccasion = null,
  prefilledVenue    = null,
}) {
  const [occasion,    setOccasion]    = useState(prefilledOccasion);
  const [date,        setDate]        = useState("");
  const [notSureDate, setNotSureDate] = useState(false);
  const [notes,       setNotes]       = useState(
    prefilledVenue ? `Venue: ${prefilledVenue}` : ""
  );
  const [sent,     setSent]     = useState(false);
  const [sending,  setSending]  = useState(false);

  const allergies = (pet?.allergies || pet?.preferences?.allergies || []).join(", ");
  const canSend   = occasion !== null;

  // --- TODO: POST /api/concierge/dining-intake ---
  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/api/concierge/dining-intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId:     pet?.id,
          petName:   pet?.name,
          occasion,
          date:      notSureDate ? null : date,
          notes,
          allergies,
        }),
      });
    } catch (err) {
      console.error("[ConciergeIntakeModal] dining-intake error:", err);
    } finally {
      setSending(false);
      setSent(true);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.success(`Sent to your Concierge`, { description: "We'll reach out within 48 hours." });
      }
    }
  };

  // ── SENT CONFIRMATION UI ──────────────────────────────────────────────
  if (sent) {
    return (
      <Backdrop onClick={onClose}>
        <Modal>
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg,#C9973A,#F0C060)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 18px",
            }}>
              👑
            </div>
            <div style={{
              fontSize: 21, fontWeight: 800, color: "#1A0A00",
              fontFamily: "Georgia,serif", marginBottom: 8,
            }}>
              Sent to {pet?.name}'s Concierge.
            </div>
            <div style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 28 }}>
              Everything is in good hands.<br />
              Your Concierge will reach out within 48 hours. ♥<br /><br />
              We already have your contact details —<br />
              you don't need to chase.
            </div>
            <button
              onClick={onClose}
              style={{
                background: "#F5F5F5", border: "none", borderRadius: 20,
                padding: "10px 28px", fontSize: 13, fontWeight: 600,
                color: "#555", cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </Modal>
      </Backdrop>
    );
  }

  // ── INTAKE FORM UI ────────────────────────────────────────────────────
  return (
    <Backdrop onClick={onClose}>
      <Modal>
        {/* Close */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, color: "#BBB", cursor: "pointer", lineHeight: 1 }}
            data-testid="concierge-modal-close"
          >
            ✕
          </button>
        </div>

        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#FFF8E8", border: "1px solid #FFE5A0",
          borderRadius: 20, padding: "4px 12px",
          color: "#C9973A", fontSize: 12, fontWeight: 600,
          marginBottom: 16,
        }}>
          ★ {pet?.name}'s Concierge
        </div>

        {/* Title */}
        <div style={{
          fontSize: 22, fontWeight: 800, color: "#1A0A00",
          fontFamily: "Georgia,serif", lineHeight: 1.2, marginBottom: 6,
        }}>
          What should{" "}
          <span style={{ color: "#C9973A" }}>{pet?.name}</span>'s{" "}
          dining experience feel like?
        </div>
        <div style={{ fontSize: 14, color: "#888", marginBottom: 26 }}>
          Three questions. Then your Concierge takes over.
        </div>

        {/* Q1: Occasion */}
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A0A00", marginBottom: 12 }}>
          What are we planning?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {OCCASIONS.map(o => {
            const sel = occasion === o;
            return (
              <button
                key={o}
                onClick={() => setOccasion(sel ? null : o)}
                data-testid={`occasion-btn-${o.replace(/\s+/g, "-").toLowerCase()}`}
                style={{
                  border: `1.5px solid ${sel ? "#C9973A" : "#E8E0D8"}`,
                  borderRadius: 20, padding: "8px 16px",
                  fontSize: 13, cursor: "pointer", transition: "all 0.12s",
                  background: sel ? "#FFF8E8" : "#fff",
                  color:      sel ? "#8B5E00" : "#555",
                  fontWeight: sel ? 600 : 400,
                }}
              >
                {sel ? "✓ " : ""}{o}
              </button>
            );
          })}
        </div>

        {/* Q2: When */}
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A0A00", marginBottom: 12 }}>
          When?
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <input
            type="date"
            value={date}
            disabled={notSureDate}
            onChange={e => { setDate(e.target.value); setNotSureDate(false); }}
            style={{
              flex: 1,
              border: `1.5px solid ${!notSureDate && date ? "#C9973A" : "#E8E0D8"}`,
              borderRadius: 10, padding: "12px 14px",
              fontSize: 14, color: "#1A0A00", outline: "none",
              opacity: notSureDate ? 0.4 : 1,
            }}
          />
          <button
            onClick={() => { setNotSureDate(!notSureDate); setDate(""); }}
            style={{
              border: `1.5px solid ${notSureDate ? "#C9973A" : "#E8E0D8"}`,
              borderRadius: 10, padding: "12px 16px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: notSureDate ? "#FFF8E8" : "#fff",
              color:      notSureDate ? "#8B5E00" : "#555",
              whiteSpace: "nowrap", transition: "all 0.12s",
            }}
          >
            {notSureDate ? "✓ Not sure yet" : "Not sure yet"}
          </button>
        </div>

        {/* Q3: Notes */}
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A0A00", marginBottom: 6 }}>
          Anything else we should know about{" "}
          <span style={{ color: "#C9973A" }}>{pet?.name}</span>?{" "}
          <span style={{ fontSize: 13, color: "#BBB", fontWeight: 400 }}>Optional</span>
        </div>
        <textarea
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={`Allergies already noted${allergies ? `: ${allergies}` : ""}. Favourite foods, venue preferences, what makes their tail go fastest...`}
          style={{
            width: "100%",
            border: "1.5px solid #E8E0D8", borderRadius: 10,
            padding: "12px 14px", fontSize: 14, color: "#1A0A00",
            outline: "none", resize: "none", fontFamily: "inherit",
            lineHeight: 1.6, marginBottom: 24, boxSizing: "border-box",
          }}
        />

        {/* Send Button */}
        <button
          onClick={canSend ? handleSend : undefined}
          disabled={!canSend || sending}
          data-testid="concierge-intake-send-btn"
          style={{
            width: "100%",
            background: canSend
              ? "linear-gradient(135deg,#C9973A,#F0C060)"
              : "#E8E0D8",
            color:  canSend ? "#1A0A00" : "#999",
            border: "none", borderRadius: 40,
            padding: "15px", fontSize: 16, fontWeight: 800,
            cursor: canSend ? (sending ? "wait" : "pointer") : "not-allowed",
            marginBottom: 10, transition: "all 0.15s",
            opacity: sending ? 0.75 : 1,
          }}
        >
          {sending ? "Sending…" : "Send to my Concierge →"}
        </button>
        <div style={{ fontSize: 12, color: "#888", textAlign: "center", lineHeight: 1.6 }}>
          We already have your contact details.<br />
          Your Concierge will reach out — you don't need to chase.
        </div>
      </Modal>
    </Backdrop>
  );
}

// --- Layout Shells ---
function Backdrop({ onClick, children }) {
  return createPortal(
    <div
      onClick={onClick}
      style={{
        position: "fixed", inset: 0, zIndex: 10002,
        background: "rgba(0,0,0,0.52)",
        display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

function Modal({ children }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "#fff", borderRadius: 20,
        width: "min(640px,100%)",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        padding: "32px 32px 28px",
      }}
    >
      {children}
    </div>
  );
}
