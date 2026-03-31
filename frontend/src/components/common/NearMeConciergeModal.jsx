/**
 * NearMeConciergeModal.jsx
 * Shared modal for ALL NearMe "Book via Concierge →" buttons.
 * Opens with the venue name pre-filled — Concierge knows exactly which place.
 * Usage:
 *   <NearMeConciergeModal
 *     isOpen={!!selectedVenue}
 *     venue={selectedVenue}   // { name, vicinity, rating, pillar }
 *     pet={pet}
 *     pillar="celebrate"
 *     onClose={() => setSelectedVenue(null)}
 *   />
 */
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { tdc } from "../../utils/tdc_intent";
import { useConcierge } from "../../hooks/useConcierge";

const PILLAR_COLORS = {
  celebrate:  { gradient: "linear-gradient(135deg,#9C27B0,#E91E63)", light: "#F3E5F5" },
  care:       { gradient: "linear-gradient(135deg,#2E7D32,#66BB6A)", light: "#E8F5E9" },
  go:         { gradient: "linear-gradient(135deg,#1565C0,#42A5F5)", light: "#E3F2FD" },
  play:       { gradient: "linear-gradient(135deg,#E64A19,#FF7043)", light: "#FBE9E7" },
  learn:      { gradient: "linear-gradient(135deg,#283593,#5C6BC0)", light: "#E8EAF6" },
  dine:       { gradient: "linear-gradient(135deg,#BF360C,#FF7043)", light: "#FBE9E7" },
  emergency:  { gradient: "linear-gradient(135deg,#B71C1C,#EF5350)", light: "#FFEBEE" },
  farewell:   { gradient: "linear-gradient(135deg,#4A148C,#7B1FA2)", light: "#F3E5F5" },
  adopt:      { gradient: "linear-gradient(135deg,#880E4F,#E91E63)", light: "#FCE4EC" },
  platform:   { gradient: "linear-gradient(135deg,#37474F,#78909C)", light: "#ECEFF1" },
};

export default function NearMeConciergeModal({ isOpen, venue, place, pet, pillar = "platform", onClose, setConciergeToast }) {
  // Accept either 'venue' or 'place' prop for compatibility
  const actualVenue = venue || place;
  const [date,     setDate]    = useState("");
  const [notSure,  setNotSure] = useState(false);
  const [notes,    setNotes]   = useState("");
  const [sending,  setSending] = useState(false);
  const [sent,     setSent]    = useState(false);

  const { request } = useConcierge({ pet, pillar });
  const petName   = pet?.name || "your pet";
  const venueName = actualVenue?.name || "this venue";
  const colors    = PILLAR_COLORS[pillar] || PILLAR_COLORS.platform;

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    tdc.nearme({ query: venueName, pillar, pet, channel: `${pillar}_nearme_modal` });

    // Build a structured note for the Master Briefing
    const noteLines = [
      `Venue: ${venueName}`,
      (actualVenue?.formatted_address || actualVenue?.vicinity) ? `Address: ${actualVenue.formatted_address || actualVenue.vicinity}` : null,
      actualVenue?.rating ? `Rating: ${actualVenue.rating}★` : null,
      actualVenue?.formatted_phone_number ? `Phone: ${actualVenue.formatted_phone_number}` : null,
      `When: ${notSure ? 'Not sure yet — just enquire' : (date || 'Not specified')}`,
      notes.trim() ? `Notes: ${notes.trim()}` : null,
      `Please contact the venue and arrange for ${petName}.`,
    ].filter(Boolean);

    await request(venueName, {
      channel:  `${pillar}_nearme`,
      urgency:  'normal',
      // Pass structured details so buildMasterBriefing includes them
      details: {
        service_name:   venueName,
        venue_name:     venueName,
        venue_address:  actualVenue?.formatted_address || actualVenue?.vicinity,
        venue_rating:   actualVenue?.rating ? `${actualVenue.rating}★` : null,
        preferred_date: notSure ? 'Not sure yet — just enquire' : (date || 'Not specified'),
        notes:          notes.trim() || null,
        pillar,
      },
      note: noteLines.join('\n'),
      metadata: {
        nearme_booking: true,
        venue_name:     venueName,
        venue_address:  actualVenue?.formatted_address || actualVenue?.vicinity,
        venue_rating:   actualVenue?.rating,
        venue_phone:    actualVenue?.formatted_phone_number,
        preferred_date: notSure ? null : (date || null),
        notes:          notes.trim() || null,
        pillar,
      },
    });

    setSent(true);
    setSending(false);
  };

  if (!isOpen && !actualVenue) return null;
  if (!actualVenue) return null;

  const modal = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500 }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 501, width: "min(480px, 94vw)",
        background: "#fff", borderRadius: 20, overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{ background: colors.gradient, padding: "20px 24px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
                Book via Concierge · {pillar.charAt(0).toUpperCase() + pillar.slice(1)}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.3 }}>
                {venueName}
              </h2>
              {actualVenue?.vicinity && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>
                  📍 {actualVenue.vicinity}
                </p>
              )}
              {actualVenue?.rating && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "2px 0 0" }}>
                  ⭐ {actualVenue.rating}
                </p>
              )}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>

        {sent ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Sent to your Concierge!</h3>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
              We'll reach out within 48 hours to arrange {petName}'s visit to {venueName}.
            </p>
            <p style={{ fontSize: 12, color: "#999" }}>Check /my-requests to track this.</p>
            <button onClick={onClose} style={{ marginTop: 20, padding: "10px 32px", borderRadius: 50, background: colors.gradient, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Done</button>
          </div>
        ) : (
          <div style={{ padding: "20px 24px 24px" }}>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Our Concierge will contact {venueName} and arrange everything for {petName}.
            </p>

            {/* When? */}
            <label style={{ fontSize: 12, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>When?</label>
            <input
              type="date"
              value={notSure ? "" : date}
              onChange={e => setDate(e.target.value)}
              disabled={notSure}
              min={new Date().toISOString().split("T")[0]}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E0E0E0", fontSize: 13, outline: "none", opacity: notSure ? 0.4 : 1, boxSizing: "border-box" }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer", fontSize: 12, color: "#888" }}>
              <input type="checkbox" checked={notSure} onChange={e => setNotSure(e.target.checked)} style={{ cursor: "pointer" }} />
              Not sure yet — just enquire
            </label>

            {/* Notes */}
            <label style={{ fontSize: 12, fontWeight: 700, color: "#444", display: "block", marginTop: 16, marginBottom: 6 }}>
              Anything the Concierge should know? <span style={{ color: "#aaa", fontWeight: 400 }}>Optional</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={`Special requirements for ${petName}, preferred time, etc.`}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E0E0E0", fontSize: 13, resize: "none", outline: "none", boxSizing: "border-box" }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending}
              data-testid="nearme-concierge-send-btn"
              style={{
                marginTop: 18, width: "100%", padding: "14px",
                background: sending ? "#ccc" : colors.gradient,
                color: "#fff", border: "none", borderRadius: 50,
                fontSize: 15, fontWeight: 800, cursor: sending ? "wait" : "pointer",
              }}
            >
              {sending ? "Sending…" : `Send to ${pillar.charAt(0).toUpperCase() + pillar.slice(1)} Concierge →`}
            </button>

            <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 10 }}>
              We already have your contact details — your Concierge will reach out.
            </p>
          </div>
        )}
      </div>
    </>
  );

  return ReactDOM.createPortal(modal, document.body);
}
