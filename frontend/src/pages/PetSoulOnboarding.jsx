/**
 * PetSoulOnboarding.jsx — /onboarding
 * The Doggy Company
 *
 * The moment a new parent adds their dog and Mira begins to know them.
 * 10 steps. Never feels like a form. Always feels like a conversation.
 *
 * PHILOSOPHY:
 *   - Progress shown as "Mira is learning about {petName}" not "Step X of Y"
 *   - Chips > dropdowns > free text
 *   - Every answer shows +pts earned instantly
 *   - Photo upload: drag/drop OR camera on mobile
 *   - Breed selector: search-as-you-type
 *   - Skip always available — adds to incomplete for later
 *
 * SOUL SCORE:
 *   welcome(0) photo(15) age(5) personality(15) health(20)
 *   social(10) comfort(10) food(15) training(10) home(5) = 105pts possible
 *
 * API:
 *   POST /api/pets                              — create pet
 *   POST /api/pet-soul/profile/{petId}/answer   — save each answer
 *   POST /api/mira/score-for-pet                — trigger scoring (background)
 *   POST /api/ai-images/pipeline/mira-imagines  — trigger watercolours (background)
 *
 * ROUTE: /onboarding (ProtectedRoute)
 * POST-ONBOARDING: navigate("/pet-home")
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import { API_URL } from "../utils/api";

// ── Colour system ──────────────────────────────────────────────────────
const G = {
  deep:     "#0F0A1E",
  mid:      "#1A1363",
  purple:   "#9B59B6",
  pink:     "#E91E8C",
  gold:     "#C9973A",
  light:    "#DDD6FE",
  pale:     "#F5F3FF",
  muted:    "#6B46C1",
  text:     "#1A1A2E",
  sub:      "#64748B",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ── Breed list (search-as-you-type) ────────────────────────────────────
const BREEDS = [
  "Labrador Retriever","Golden Retriever","German Shepherd","French Bulldog",
  "Bulldog","Poodle","Beagle","Rottweiler","German Shorthaired Pointer",
  "Pembroke Welsh Corgi","Australian Shepherd","Dachshund","Yorkshire Terrier",
  "Boxer","Siberian Husky","Cavalier King Charles Spaniel","Great Dane",
  "Miniature Schnauzer","Shih Tzu","Doberman Pinscher","Border Collie",
  "Bernese Mountain Dog","Pomeranian","Havanese","Shetland Sheepdog",
  "Cocker Spaniel","Maltese","Chihuahua","Pug","Boston Terrier",
  "Maltipoo","Goldendoodle","Labradoodle","Cockapoo","Cavapoo",
  "Sheepadoodle","Bernedoodle","Schnoodle","Puggle","Morkie",
  "Indian Pariah Dog (Indie)","Rajapalayam","Mudhol Hound","Chippiparai",
  "Kombai","Bakharwal","Rampur Greyhound","Gaddi Kutta","Spitz",
  "Lhasa Apso","Tibetan Mastiff","Bichon Frise","Samoyed",
  "Dalmatian","Weimaraner","Vizsla","Irish Setter","Bloodhound",
  "Saint Bernard","Newfoundland","Great Pyrenees","Akita","Shiba Inu",
  "Mixed Breed / Other",
];

// ── Step config ────────────────────────────────────────────────────────
const STEPS = [
  { id:"welcome",     pts:0,  chapter:"Identity",   label:"Let's meet them" },
  { id:"photo",       pts:15, chapter:"Identity",   label:"A face to the name" },
  { id:"age",         pts:5,  chapter:"Identity",   label:"Life stage" },
  { id:"personality", pts:15, chapter:"Behaviour",  label:"Who they are" },
  { id:"health",      pts:20, chapter:"Health",     label:"Health & care" },
  { id:"social",      pts:10, chapter:"Social",     label:"Their world" },
  { id:"comfort",     pts:10, chapter:"Behaviour",  label:"What they love" },
  { id:"food",        pts:15, chapter:"Nutrition",  label:"How they eat" },
  { id:"training",    pts:10, chapter:"Learning",   label:"What they know" },
  { id:"home",        pts:5,  chapter:"Identity",   label:"Where they live" },
];

// ── Chip component ─────────────────────────────────────────────────────
function Chip({ label, selected, onToggle, colour = G.purple, emoji }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: `1.5px solid ${selected ? colour : "rgba(107,70,193,0.25)"}`,
        background: selected ? colour : "#fff",
        color: selected ? "#fff" : G.text,
        fontSize: 13, fontWeight: selected ? 700 : 400,
        cursor: "pointer", transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 6,
      }}
    >
      {emoji && <span style={{ fontSize: 15 }}>{emoji}</span>}
      {label}
    </button>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────
function MiraProgress({ step, totalSteps, petName, ptsEarned }) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 8,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: G.muted }}>
          ✦ Mira is learning about <span style={{ color: G.purple }}>{petName || "your dog"}</span>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700,
          background: MIRA_ORB, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {ptsEarned} soul pts
        </div>
      </div>
      <div style={{
        height: 6, borderRadius: 999,
        background: "rgba(155,89,182,0.15)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 999,
          background: MIRA_ORB,
          width: `${pct}%`,
          transition: "width 0.4s ease",
        }}/>
      </div>
    </div>
  );
}

// ── +pts flash ─────────────────────────────────────────────────────────
function PtsFlash({ pts, show }) {
  if (!show || !pts) return null;
  return (
    <div style={{
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%,-50%)",
      background: MIRA_ORB,
      borderRadius: 20, padding: "10px 24px",
      fontSize: 20, fontWeight: 900, color: "#fff",
      zIndex: 9999,
      animation: "fadeUp 0.8s ease forwards",
      pointerEvents: "none",
    }}>
      +{pts} pts
      <style>{`
        @keyframes fadeUp {
          0%   { opacity:1; transform:translate(-50%,-50%) scale(1); }
          100% { opacity:0; transform:translate(-50%,-80%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ── Breed selector ─────────────────────────────────────────────────────
function BreedSelector({ value, onChange }) {
  const [query, setQuery]       = useState(value || "");
  const [open,  setOpen]        = useState(false);
  const [results, setResults]   = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (query.length < 1) { setResults([]); return; }
    const q = query.toLowerCase().replace(/\s+/g, '');
    const scored = BREEDS.map(b => {
      const bn = b.toLowerCase();
      const bnc = bn.replace(/\s+/g, '');
      // Tiered smart matching
      if (bn === q || bnc === q) return { b, s: 100 };
      if (bn.startsWith(query.toLowerCase()) || bnc.startsWith(q)) return { b, s: 95 };
      if (bn.includes(query.toLowerCase()) || bnc.includes(q)) return { b, s: 80 };
      // Word-start: "frenchbull" → "French Bulldog", "german" → "German Shepherd"
      const words = bn.split(' ');
      if (words.some(w => w.startsWith(q.slice(0, Math.min(4, q.length))))) return { b, s: 65 };
      // Typo tolerance: allow 1 char off for queries ≥4 chars
      if (q.length >= 4) {
        for (let i = 0; i < bnc.length - q.length + 1; i++) {
          const chunk = bnc.slice(i, i + q.length);
          let diffs = 0;
          for (let j = 0; j < q.length; j++) if (chunk[j] !== q[j]) diffs++;
          if (diffs <= 1) return { b, s: 50 };
        }
      }
      return { b, s: 0 };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    setResults(scored.slice(0, 8).map(x => x.b));
  }, [query]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
        onFocus={() => setOpen(true)}
        placeholder="Search breed… e.g. Labrador, Indie, Maltipoo"
        style={{
          width: "100%", padding: "14px 16px",
          borderRadius: 12, fontSize: 15,
          border: `2px solid ${query ? G.purple : "rgba(107,70,193,0.25)"}`,
          outline: "none", boxSizing: "border-box",
          color: G.text, background: "#fff",
        }}
      />
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          zIndex: 100, background: "#fff",
          border: `1.5px solid rgba(107,70,193,0.2)`,
          borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          marginTop: 4, overflow: "hidden",
        }}>
          {results.map(b => (
            <div
              key={b}
              onClick={() => { setQuery(b); onChange(b); setOpen(false); }}
              style={{
                padding: "12px 16px", fontSize: 14,
                cursor: "pointer", color: G.text,
                borderBottom: "1px solid rgba(107,70,193,0.08)",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = G.pale}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              🐾 {b}
            </div>
          ))}
        </div>
      )}
      {value && (
        <div style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 8,
          background: G.pale, borderRadius: 10, padding: "8px 12px",
        }}>
          <span style={{ fontSize: 13, color: G.purple, fontWeight: 600 }}>
            ✓ {value}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Photo uploader ─────────────────────────────────────────────────────
function PhotoUploader({ petName, onPhoto }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/upload/pet-photo`, {
        method: "POST", body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onPhoto(data.url || data.photo_url);
      }
    } catch(e) {
      // Still show preview even if upload fails
      onPhoto(preview);
    }
    setUploading(false);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{
          border: `2px dashed ${dragOver ? G.purple : "rgba(107,70,193,0.30)"}`,
          borderRadius: 16,
          padding: preview ? "0" : "40px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? G.pale : "#fafafa",
          transition: "all 0.2s",
          overflow: "hidden",
          minHeight: preview ? 220 : "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {preview ? (
          <img src={preview} alt={petName}
            style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 14 }}/>
        ) : (
          <div>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 6 }}>
              Upload {petName ? `${petName}'s` : "a"} photo
            </div>
            <div style={{ fontSize: 13, color: G.sub }}>
              Drag & drop or tap to choose
            </div>
            <div style={{ fontSize: 12, color: G.sub, marginTop: 4 }}>
              or use your camera on mobile
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])}
      />
      {uploading && (
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: G.muted }}>
          Uploading…
        </div>
      )}
      {preview && (
        <button
          onClick={() => { setPreview(null); onPhoto(null); }}
          style={{
            marginTop: 10, width: "100%", padding: "8px",
            borderRadius: 10, background: "none",
            border: "1px solid rgba(107,70,193,0.25)",
            color: G.muted, fontSize: 12, cursor: "pointer",
          }}
        >
          Choose a different photo
        </button>
      )}
    </div>
  );
}

// ── Individual step renderers ──────────────────────────────────────────

function StepWelcome({ data, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: G.muted, display: "block", marginBottom: 8 }}>
          What's their name?
        </label>
        <input
          value={data.name || ""}
          onChange={e => onChange({ ...data, name: e.target.value })}
          placeholder="e.g. Mojo, Luna, Bruno…"
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 12,
            fontSize: 18, fontWeight: 600,
            border: `2px solid ${data.name ? G.purple : "rgba(107,70,193,0.25)"}`,
            outline: "none", boxSizing: "border-box", color: G.text,
          }}
        />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: G.muted, display: "block", marginBottom: 8 }}>
          What breed are they?
        </label>
        <BreedSelector value={data.breed || ""} onChange={breed => onChange({ ...data, breed })}/>
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: G.muted, display: "block", marginBottom: 8 }}>
          Date of birth (or approximate)
        </label>
        <input
          type="date"
          value={data.dob || ""}
          onChange={e => onChange({ ...data, dob: e.target.value })}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 12,
            fontSize: 14, border: `2px solid ${data.dob ? G.purple : "rgba(107,70,193,0.25)"}`,
            outline: "none", boxSizing: "border-box", color: G.text,
          }}
        />
        <div style={{ fontSize: 12, color: G.sub, marginTop: 6 }}>
          Don't know exactly? Just pick a rough date — Mira uses this for life stage, not birthdays.
        </div>
      </div>
    </div>
  );
}

function StepPhoto({ data, onChange, petName }) {
  return (
    <div>
      <div style={{
        background: G.pale, borderRadius: 12, padding: "12px 16px",
        marginBottom: 20, fontSize: 13, color: G.muted, lineHeight: 1.6,
        fontStyle: "italic",
      }}>
        ✦ A photo adds 15 soul points — Mira uses it to personalise {petName || "their"} profile and generate breed-specific illustrations.
      </div>
      <PhotoUploader petName={petName} onPhoto={url => onChange({ ...data, photo_url: url })}/>
    </div>
  );
}

function StepAge({ data, onChange, petName }) {
  const AGE_OPTIONS = [
    { id:"puppy",  label:"Puppy",  sub:"Under 1 year",     emoji:"🐶" },
    { id:"young",  label:"Young",  sub:"1–3 years",         emoji:"⚡" },
    { id:"adult",  label:"Adult",  sub:"3–7 years",         emoji:"🌿" },
    { id:"senior", label:"Senior", sub:"7+ years",          emoji:"🌷" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {AGE_OPTIONS.map(opt => (
        <div
          key={opt.id}
          onClick={() => onChange({ ...data, age_stage: opt.id })}
          style={{
            borderRadius: 14, padding: "20px 16px", textAlign: "center",
            border: `2px solid ${data.age_stage === opt.id ? G.purple : "rgba(107,70,193,0.20)"}`,
            background: data.age_stage === opt.id ? G.pale : "#fff",
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>{opt.emoji}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 4 }}>{opt.label}</div>
          <div style={{ fontSize: 12, color: G.sub }}>{opt.sub}</div>
          {opt.id === "senior" && (
            <div style={{ fontSize: 10, color: G.purple, marginTop: 6, fontStyle: "italic" }}>
              Mira gives extra care to seniors 🌷
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StepPersonality({ data, onChange, petName }) {
  const ENERGY = [
    { id:"couch",    label:"Couch potato",     emoji:"🛋️" },
    { id:"moderate", label:"Moderate",          emoji:"🚶" },
    { id:"active",   label:"Active & playful",  emoji:"🎾" },
    { id:"intense",  label:"Non-stop energy",   emoji:"⚡" },
  ];
  const PERSONALITY = [
    { id:"loyal",      label:"Deeply loyal",     emoji:"💛" },
    { id:"social",     label:"Social butterfly",  emoji:"🦋" },
    { id:"shy",        label:"Shy & gentle",      emoji:"🌸" },
    { id:"curious",    label:"Always curious",    emoji:"🔍" },
    { id:"stubborn",   label:"Strong-willed",     emoji:"💪" },
    { id:"gentle",     label:"Calm & gentle",     emoji:"🕊️" },
    { id:"playful",    label:"Loves to play",     emoji:"🎉" },
    { id:"protective", label:"Protective",        emoji:"🛡️" },
  ];

  const togglePersonality = (id) => {
    const current = data.personality || [];
    const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ ...data, personality: updated });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          How would you describe {petName || "their"} energy?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ENERGY.map(opt => (
            <div
              key={opt.id}
              onClick={() => onChange({ ...data, energy: opt.id })}
              style={{
                borderRadius: 12, padding: "14px 16px",
                border: `2px solid ${data.energy === opt.id ? G.purple : "rgba(107,70,193,0.20)"}`,
                background: data.energy === opt.id ? G.pale : "#fff",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>{opt.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: data.energy === opt.id ? 700 : 400, color: G.text }}>
                {opt.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 4 }}>
          Their personality (pick all that fit)
        </div>
        <div style={{ fontSize: 12, color: G.sub, marginBottom: 12 }}>
          Mira uses this to personalise her tone and recommendations.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PERSONALITY.map(opt => (
            <Chip
              key={opt.id}
              label={opt.label}
              emoji={opt.emoji}
              selected={(data.personality || []).includes(opt.id)}
              onToggle={() => togglePersonality(opt.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHealth({ data, onChange, petName }) {
  const CONDITIONS = [
    { id:"none",       label:"All healthy",         emoji:"✅" },
    { id:"allergies",  label:"Skin allergies",       emoji:"🌿" },
    { id:"food_allergy",label:"Food allergies",      emoji:"🍖" },
    { id:"joint",      label:"Joint / mobility",     emoji:"🦴" },
    { id:"heart",      label:"Heart condition",      emoji:"❤️" },
    { id:"dental",     label:"Dental issues",        emoji:"🦷" },
    { id:"eyes",       label:"Eye condition",        emoji:"👁️" },
    { id:"anxiety",    label:"Anxiety / fear",       emoji:"🌸" },
    { id:"digestive",  label:"Digestive sensitivity",emoji:"🥗" },
    { id:"weight",     label:"Weight management",    emoji:"⚖️" },
    { id:"senior_care",label:"Senior care needs",    emoji:"🌷" },
    { id:"other",      label:"Other condition",      emoji:"📋" },
  ];
  const ALLERGIES = [
    "Chicken","Beef","Soy","Wheat/Gluten","Dairy","Eggs",
    "Fish","Corn","None known",
  ];

  const toggleCondition = (id) => {
    if (id === "none") { onChange({ ...data, conditions: ["none"] }); return; }
    const current = (data.conditions || []).filter(x => x !== "none");
    const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ ...data, conditions: updated });
  };
  const toggleAllergy = (a) => {
    const current = data.food_allergies || [];
    const updated = current.includes(a) ? current.filter(x => x !== a) : [...current, a];
    onChange({ ...data, food_allergies: updated });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 4 }}>
          Any health conditions? (select all that apply)
        </div>
        <div style={{ fontSize: 12, color: G.sub, marginBottom: 12 }}>
          Mira uses this to filter products and flag what to avoid.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CONDITIONS.map(opt => (
            <Chip
              key={opt.id}
              label={opt.label}
              emoji={opt.emoji}
              selected={(data.conditions || []).includes(opt.id)}
              onToggle={() => toggleCondition(opt.id)}
              colour={opt.id === "none" ? "#16A34A" : G.purple}
            />
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          Any known food allergies?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALLERGIES.map(a => (
            <Chip
              key={a} label={a}
              selected={(data.food_allergies || []).includes(a)}
              onToggle={() => toggleAllergy(a)}
              colour={a === "None known" ? "#16A34A" : "#DC2626"}
            />
          ))}
        </div>
      </div>
      <div style={{
        background: "#FFF8E7", border: "1px solid rgba(201,151,58,0.30)",
        borderRadius: 10, padding: "10px 14px",
        fontSize: 12, color: "#7B3F00", lineHeight: 1.5,
      }}>
        ✦ Mira will never suggest products containing {petName || "their"}'s allergens — ever.
      </div>
    </div>
  );
}

function StepSocial({ data, onChange, petName }) {
  const OTHERS = [
    { id:"only_dog",    label:`${petName || "They"}'re the only dog`, emoji:"👑" },
    { id:"multi_dog",   label:"Lives with other dogs",                 emoji:"🐕🐕" },
    { id:"cats_too",    label:"Lives with cats too",                   emoji:"🐕🐈" },
    { id:"kids_home",   label:"Kids at home",                          emoji:"👶" },
    { id:"calm_home",   label:"Calm, quiet household",                 emoji:"🏠" },
  ];
  const SOCIAL = [
    { id:"loves_all",  label:"Loves everyone",    emoji:"🤗" },
    { id:"selective",  label:"Selective with dogs",emoji:"🤔" },
    { id:"shy_people", label:"Shy with strangers", emoji:"😶" },
    { id:"reactive",   label:"Can be reactive",    emoji:"⚡" },
    { id:"confident",  label:"Confident & social", emoji:"💪" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          Who else is in {petName || "their"}'s world?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {OTHERS.map(opt => (
            <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
              selected={(data.household || []).includes(opt.id)}
              onToggle={() => {
                const c = data.household || [];
                onChange({ ...data, household: c.includes(opt.id) ? c.filter(x=>x!==opt.id) : [...c, opt.id] });
              }}/>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          How do they behave socially?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SOCIAL.map(opt => (
            <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
              selected={data.social_style === opt.id}
              onToggle={() => onChange({ ...data, social_style: opt.id })}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepComfort({ data, onChange, petName }) {
  const ACTIVITIES = [
    { id:"fetch",    label:"Fetch",          emoji:"🎾" },
    { id:"walks",    label:"Long walks",     emoji:"🚶" },
    { id:"swim",     label:"Swimming",       emoji:"🏊" },
    { id:"cuddles",  label:"Cuddles",        emoji:"🤗" },
    { id:"toys",     label:"Chewing toys",   emoji:"🦴" },
    { id:"training", label:"Learning tricks",emoji:"🎓" },
    { id:"sniffing", label:"Sniff walks",    emoji:"👃" },
    { id:"car",      label:"Car rides",      emoji:"🚗" },
    { id:"people",   label:"Meeting people", emoji:"👋" },
  ];
  const FEARS = [
    { id:"none",      label:"No major fears",   emoji:"✅" },
    { id:"loud",      label:"Loud sounds",       emoji:"🔊" },
    { id:"strangers", label:"Strangers",         emoji:"👤" },
    { id:"vet",       label:"Vet visits",        emoji:"🏥" },
    { id:"car",       label:"Car rides",         emoji:"🚗" },
    { id:"alone",     label:"Being left alone",  emoji:"😢" },
    { id:"other_dogs",label:"Other dogs",        emoji:"🐕" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          What does {petName || "your dog"} absolutely love?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ACTIVITIES.map(opt => (
            <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
              selected={(data.loves || []).includes(opt.id)}
              onToggle={() => {
                const c = data.loves || [];
                onChange({ ...data, loves: c.includes(opt.id) ? c.filter(x=>x!==opt.id) : [...c, opt.id] });
              }}/>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          Any fears or anxieties?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FEARS.map(opt => (
            <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
              selected={(data.fears || []).includes(opt.id)}
              onToggle={() => {
                const c = (data.fears || []).filter(x => x !== "none");
                if (opt.id === "none") { onChange({ ...data, fears: ["none"] }); return; }
                onChange({ ...data, fears: c.includes(opt.id) ? c.filter(x=>x!==opt.id) : [...c, opt.id] });
              }}
              colour={opt.id === "none" ? "#16A34A" : G.purple}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepFood({ data, onChange, petName }) {
  const DIET = [
    { id:"dry",      label:"Dry kibble",      emoji:"🥣" },
    { id:"wet",      label:"Wet food",        emoji:"🥫" },
    { id:"fresh",    label:"Fresh/cooked",    emoji:"🍖" },
    { id:"raw",      label:"Raw diet",        emoji:"🥩" },
    { id:"mixed",    label:"Mixed",           emoji:"🍽️" },
    { id:"homemade", label:"Home cooked",     emoji:"👩‍🍳" },
  ];
  const PORTION = [
    { id:"small",  label:"Small (< 5kg dog)",   emoji:"🤏" },
    { id:"medium", label:"Medium (5–20kg)",      emoji:"🖐️" },
    { id:"large",  label:"Large (20kg+)",        emoji:"✋" },
  ];
  const TREAT_PREF = [
    { id:"soft",   label:"Soft treats",    emoji:"🍪" },
    { id:"crunchy",label:"Crunchy treats", emoji:"🦴" },
    { id:"meat",   label:"Meat-based",     emoji:"🥩" },
    { id:"veggie", label:"Veggie treats",  emoji:"🥕" },
    { id:"bakery", label:"Bakery style",   emoji:"🎂" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          Current diet
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DIET.map(opt => (
            <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
              selected={data.diet_type === opt.id}
              onToggle={() => onChange({ ...data, diet_type: opt.id })}/>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          Portion size (by weight)
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {PORTION.map(opt => (
            <div key={opt.id}
              onClick={() => onChange({ ...data, portion_size: opt.id })}
              style={{
                flex: 1, borderRadius: 12, padding: "14px 10px", textAlign: "center",
                border: `2px solid ${data.portion_size === opt.id ? G.purple : "rgba(107,70,193,0.20)"}`,
                background: data.portion_size === opt.id ? G.pale : "#fff",
                cursor: "pointer", transition: "all 0.15s",
              }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{opt.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: data.portion_size === opt.id ? 700 : 400 }}>{opt.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          Treat preferences
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TREAT_PREF.map(opt => (
            <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
              selected={(data.treat_pref || []).includes(opt.id)}
              onToggle={() => {
                const c = data.treat_pref || [];
                onChange({ ...data, treat_pref: c.includes(opt.id) ? c.filter(x=>x!==opt.id) : [...c, opt.id] });
              }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepTraining({ data, onChange, petName }) {
  const LEVELS = [
    { id:"none",     label:"Just starting out",  sub:"No formal training yet",     emoji:"🌱" },
    { id:"basic",    label:"Basic commands",      sub:"Sit, stay, come",            emoji:"⭐" },
    { id:"good",     label:"Well trained",        sub:"Multiple commands, leash manners", emoji:"⭐⭐" },
    { id:"advanced", label:"Advanced",            sub:"Complex commands, agility etc",    emoji:"⭐⭐⭐" },
  ];
  const GOALS = [
    { id:"basic_obedience", label:"Basic obedience",  emoji:"🎯" },
    { id:"socialisation",   label:"Socialisation",    emoji:"🤝" },
    { id:"anxiety",         label:"Reduce anxiety",   emoji:"🌸" },
    { id:"tricks",          label:"Fun tricks",       emoji:"🎪" },
    { id:"agility",         label:"Agility / sport",  emoji:"🏃" },
    { id:"none",            label:"Just maintaining", emoji:"✅" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          {petName || "Their"}'s training level
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LEVELS.map(opt => (
            <div key={opt.id}
              onClick={() => onChange({ ...data, training_level: opt.id })}
              style={{
                borderRadius: 12, padding: "14px 16px",
                border: `2px solid ${data.training_level === opt.id ? G.purple : "rgba(107,70,193,0.20)"}`,
                background: data.training_level === opt.id ? G.pale : "#fff",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 14,
              }}>
              <span style={{ fontSize: 22, minWidth: 28 }}>{opt.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: data.training_level === opt.id ? 700 : 500, color: G.text }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: G.sub }}>{opt.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          Training goals (optional)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GOALS.map(opt => (
            <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
              selected={(data.training_goals || []).includes(opt.id)}
              onToggle={() => {
                const c = data.training_goals || [];
                onChange({ ...data, training_goals: c.includes(opt.id) ? c.filter(x=>x!==opt.id) : [...c, opt.id] });
              }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHome({ data, onChange, petName }) {
  const HOME = [
    { id:"apartment",  label:"Apartment",          sub:"No garden",         emoji:"🏢" },
    { id:"house_small",label:"House with garden",  sub:"Small outdoor space",emoji:"🏡" },
    { id:"house_large",label:"House with big yard", sub:"Lots of space",     emoji:"🌳" },
    { id:"farm",       label:"Farm / rural",        sub:"Open land",         emoji:"🌾" },
  ];
  const OUTDOOR = [
    { id:"1x",  label:"Once a day",     emoji:"☀️" },
    { id:"2x",  label:"Twice a day",    emoji:"🌅" },
    { id:"3x+", label:"3+ times a day", emoji:"⚡" },
    { id:"free",label:"Free access",    emoji:"🌳" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          Where does {petName || "your dog"} live?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {HOME.map(opt => (
            <div key={opt.id}
              onClick={() => onChange({ ...data, home_type: opt.id })}
              style={{
                borderRadius: 12, padding: "16px", textAlign: "center",
                border: `2px solid ${data.home_type === opt.id ? G.purple : "rgba(107,70,193,0.20)"}`,
                background: data.home_type === opt.id ? G.pale : "#fff",
                cursor: "pointer", transition: "all 0.15s",
              }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{opt.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: G.sub }}>{opt.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginBottom: 12 }}>
          How often do they go outside?
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {OUTDOOR.map(opt => (
            <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
              selected={data.outdoor_frequency === opt.id}
              onToggle={() => onChange({ ...data, outdoor_frequency: opt.id })}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Completion screen ──────────────────────────────────────────────────
function CompletionScreen({ petName, totalPts, onDone, existingPetCount, existingPetNames }) {
  const packSize = existingPetCount + 1; // including this new pet

  // Headline — pack-aware
  const headline = packSize === 1
    ? `Mira knows ${petName} now`
    : packSize <= 3
    ? `Another soul in your pack. Mira knows ${petName} now.`
    : packSize === 12
    ? `Twelve souls. Mira knows every one of them now.`
    : `${petName} is home. Mira has your whole pack now.`;

  // Subtitle — pack-aware
  const subtitle = packSize === 1
    ? `${totalPts} soul points earned. ${petName}'s profile is live.`
    : `${totalPts} soul points earned. Your pack now has ${packSize} souls in Mira's care.`;

  // Mira quote — pack-aware
  const quote = packSize === 1
    ? `"Mira will remember everything you've shared — and get to know ${petName} better with every visit."`
    : existingPetNames.length > 0
    ? `"${petName} joins ${existingPetNames.slice(0,2).join(", ")}${existingPetNames.length > 2 ? ` and ${existingPetNames.length - 2} more` : ""}. Mira knows your whole pack now."`
    : `"Every soul in your pack is known to Mira. She'll take care of all of them."`;

  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: MIRA_ORB,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, margin: "0 auto 20px",
        boxShadow: "0 8px 32px rgba(155,89,182,0.4)",
      }}>
        ✦
      </div>
      <h2 style={{
        fontSize: "clamp(1.3rem,4vw,1.75rem)",
        fontWeight: 800, color: G.text,
        fontFamily: "Georgia, serif",
        margin: "0 0 10px",
        lineHeight: 1.3,
      }}>
        {headline}
      </h2>
      <p style={{ fontSize: 15, color: G.sub, lineHeight: 1.7, margin: "0 0 8px" }}>
        {subtitle}
      </p>
      <p style={{ fontSize: 13, color: G.muted, fontStyle: "italic", margin: "0 0 32px", lineHeight: 1.6 }}>
        {quote}
      </p>

      <div style={{
        background: G.pale, borderRadius: 14,
        padding: "16px 20px", marginBottom: 28, textAlign: "left",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: G.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          What Mira now knows about {petName}
        </div>
        {[
          "Breed, age and life stage",
          "Energy level and personality",
          "Health conditions and allergies",
          "Diet preferences and treat loves",
          "Social world and any fears",
          "Training level and goals",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#16A34A", fontSize: 14 }}>✓</span>
            <span style={{ fontSize: 13, color: G.text }}>{item}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onDone}
        style={{
          width: "100%", padding: "16px",
          borderRadius: 14, border: "none",
          background: MIRA_ORB,
          color: "#fff", fontSize: 16, fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(155,89,182,0.35)",
        }}
      >
        Meet Mira → {petName}'s world
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export default function PetSoulOnboarding() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { setCurrentPet } = usePillarContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [stepData,    setStepData]    = useState({});
  const [petId,            setPetId]            = useState(null);
  const [totalPts,         setTotalPts]         = useState(0);
  const [showPts,          setShowPts]          = useState(false);
  const [ptsToFlash,       setPtsToFlash]       = useState(0);
  const [saving,           setSaving]           = useState(false);
  const [done,             setDone]             = useState(false);
  const [existingPetCount, setExistingPetCount] = useState(0);
  const [existingPetNames, setExistingPetNames] = useState([]);

  const petName = stepData.name || "your dog";
  const step    = STEPS[currentStep];

  // Fetch how many pets this parent already has — drives completion message
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/pets/my-pets`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { pets: [] })
      .then(data => {
        const pets = data.pets || data || [];
        setExistingPetCount(pets.length);
        setExistingPetNames(pets.map(p => p.name).filter(Boolean));
      })
      .catch(() => {});
  }, [token]);

  // Create pet after welcome step
  const createPet = useCallback(async () => {
    if (petId) return petId;
    try {
      const res = await fetch(`${API_URL}/api/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          name:          stepData.name,
          breed:         stepData.breed || "",
          date_of_birth: stepData.dob || null,
          species:       "dog",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const id = data.pet?.id || data.pet?._id || data.id;
        setPetId(id);
        return id;
      }
    } catch(e) {}
    return null;
  }, [stepData, token, petId]);

  // Save answer to soul profile
  const saveAnswer = useCallback(async (pid, questionId, answers) => {
    if (!pid) return;
    try {
      await fetch(`${API_URL}/api/pet-soul/profile/${pid}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ question_id: questionId, answer: Array.isArray(answers) ? answers : [answers] }),
      });
    } catch(e) {}
  }, [token]);

  const flashPts = (pts) => {
    if (!pts) return;
    setPtsToFlash(pts);
    setShowPts(true);
    setTimeout(() => setShowPts(false), 900);
    setTotalPts(prev => prev + pts);
  };

  const handleNext = async () => {
    setSaving(true);

    // Create pet on first step completion
    let pid = petId;
    if (currentStep === 0) {
      pid = await createPet();
    }

    // Save this step's answers
    if (pid && step) {
      const answers = stepData;
      const questionId = step.id;

      // Build answer payload per step
      let payload = [];
      switch(step.id) {
        case "welcome":
          if (stepData.breed)  await saveAnswer(pid, "breed",         [stepData.breed]);
          if (stepData.dob)    await saveAnswer(pid, "date_of_birth", [stepData.dob]);
          break;
        case "photo":
          if (stepData.photo_url) await saveAnswer(pid, "photo_url", [stepData.photo_url]);
          break;
        case "age":
          if (stepData.age_stage) await saveAnswer(pid, "age_stage", [stepData.age_stage]);
          break;
        case "personality":
          if (stepData.energy)      await saveAnswer(pid, "energy_level",    [stepData.energy]);
          if (stepData.personality) await saveAnswer(pid, "personality",     stepData.personality);
          break;
        case "health":
          if (stepData.conditions)    await saveAnswer(pid, "health_conditions", stepData.conditions);
          if (stepData.food_allergies)await saveAnswer(pid, "food_allergies",   stepData.food_allergies);
          break;
        case "social":
          if (stepData.household)   await saveAnswer(pid, "household",    stepData.household);
          if (stepData.social_style)await saveAnswer(pid, "social_style", [stepData.social_style]);
          break;
        case "comfort":
          if (stepData.loves) await saveAnswer(pid, "favourite_activities", stepData.loves);
          if (stepData.fears) await saveAnswer(pid, "anxiety_triggers",     stepData.fears);
          break;
        case "food":
          if (stepData.diet_type)   await saveAnswer(pid, "diet_type",   [stepData.diet_type]);
          if (stepData.treat_pref)  await saveAnswer(pid, "treat_pref",  stepData.treat_pref);
          if (stepData.portion_size)await saveAnswer(pid, "portion_size",[stepData.portion_size]);
          break;
        case "training":
          if (stepData.training_level) await saveAnswer(pid, "training_level", [stepData.training_level]);
          if (stepData.training_goals) await saveAnswer(pid, "training_goals", stepData.training_goals);
          break;
        case "home":
          if (stepData.home_type)         await saveAnswer(pid, "home_type",         [stepData.home_type]);
          if (stepData.outdoor_frequency) await saveAnswer(pid, "outdoor_frequency", [stepData.outdoor_frequency]);
          break;
      }
    }

    flashPts(step.pts);

    if (currentStep >= STEPS.length - 1) {
      // Background: trigger Mira scoring
      if (pid) {
        fetch(`${API_URL}/api/mira/score-for-pet`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ pet_id: pid, pillar: "all" }),
        }).catch(()=>{});
      }
      setDone(true);
    } else {
      setCurrentStep(s => s + 1);
    }
    setSaving(false);
  };

  const handleSkip = () => {
    if (currentStep >= STEPS.length - 1) { setDone(true); return; }
    setCurrentStep(s => s + 1);
  };

  const handleDone = () => {
    if (petId) {
      setCurrentPet({
        id:            petId,
        _id:           petId,
        name:          stepData.name,
        breed:         stepData.breed || "",
        photo_url:     stepData.photo_url || null,
        overall_score: totalPts,
        soul_score:    totalPts,
        doggy_soul_answers: {
          breed:             stepData.breed,
          age_stage:         stepData.age_stage,
          energy_level:      stepData.energy,
          health_conditions: stepData.conditions,
          food_allergies:    stepData.food_allergies,
          diet_type:         stepData.diet_type,
          home_type:         stepData.home_type,
        },
      });
    }
    navigate("/pet-home");
  };

  // Step content
  const renderStep = () => {
    switch(step?.id) {
      case "welcome":     return <StepWelcome data={stepData} onChange={setStepData}/>;
      case "photo":       return <StepPhoto data={stepData} onChange={setStepData} petName={petName}/>;
      case "age":         return <StepAge data={stepData} onChange={setStepData} petName={petName}/>;
      case "personality": return <StepPersonality data={stepData} onChange={setStepData} petName={petName}/>;
      case "health":      return <StepHealth data={stepData} onChange={setStepData} petName={petName}/>;
      case "social":      return <StepSocial data={stepData} onChange={setStepData} petName={petName}/>;
      case "comfort":     return <StepComfort data={stepData} onChange={setStepData} petName={petName}/>;
      case "food":        return <StepFood data={stepData} onChange={setStepData} petName={petName}/>;
      case "training":    return <StepTraining data={stepData} onChange={setStepData} petName={petName}/>;
      case "home":        return <StepHome data={stepData} onChange={setStepData} petName={petName}/>;
      default: return null;
    }
  };

  // Step header text — always Mira's voice, never "Step X of Y"
  const stepHeaders = {
    welcome:     { title: "Tell Mira about your dog", sub: "Every great friendship starts with a name." },
    photo:       { title: `A face to go with ${petName}'s name`, sub: "Mira uses this to personalise everything she shows you." },
    age:         { title: `How old is ${petName}?`, sub: `Life stage changes what ${petName} needs.` },
    personality: { title: `Who is ${petName}?`, sub: "This is how Mira will understand their energy and temperament." },
    health:      { title: `${petName}'s health`, sub: "Mira will never recommend anything that isn't right for them." },
    social:      { title: `${petName}'s world`, sub: "Who they live with shapes what they need." },
    comfort:     { title: `What ${petName} loves`, sub: "And what makes them nervous. Mira remembers both." },
    food:        { title: `How ${petName} eats`, sub: "Mira will never suggest anything with allergens." },
    training:    { title: `What ${petName} knows`, sub: "Mira matches recommendations to where they are." },
    home:        { title: `Where ${petName} lives`, sub: "Almost done. Mira is nearly ready." },
  };

  const header = stepHeaders[step?.id] || { title: "", sub: "" };

  if (done) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${G.deep} 0%, ${G.mid} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}>
        <div style={{
          background: "#fff", borderRadius: 24,
          padding: "32px 28px", maxWidth: 480, width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}>
          <CompletionScreen
            petName={petName}
            totalPts={totalPts}
            onDone={handleDone}
            existingPetCount={existingPetCount}
            existingPetNames={existingPetNames}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${G.deep} 0%, ${G.mid} 100%)`,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px 48px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24,
        padding: "28px 24px", maxWidth: 520, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
      }}>

        {/* Mira orb + branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: MIRA_ORB,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#fff", flexShrink: 0,
          }}>✦</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.muted }}>
            The Doggy Company · Mira
          </div>
        </div>

        {/* Progress */}
        <MiraProgress
          step={currentStep}
          totalSteps={STEPS.length}
          petName={petName}
          ptsEarned={totalPts}
        />

        {/* Step header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontSize: "clamp(1.25rem,3vw,1.5rem)",
            fontWeight: 800, color: G.text,
            fontFamily: "Georgia, serif",
            margin: "0 0 6px",
            lineHeight: 1.3,
          }}>
            {header.title}
          </h2>
          <p style={{ fontSize: 13, color: G.sub, margin: 0, lineHeight: 1.5 }}>
            {header.sub}
          </p>
        </div>

        {/* Chapter badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: `${G.purple}18`,
          border: `1px solid ${G.purple}30`,
          borderRadius: 20, padding: "3px 12px",
          fontSize: 11, fontWeight: 600, color: G.purple,
          marginBottom: 20,
        }}>
          {step?.chapter} chapter
          {step?.pts > 0 && (
            <span style={{ color: G.gold, fontWeight: 700 }}>· +{step.pts} pts</span>
          )}
        </div>

        {/* Step content */}
        <div style={{ marginBottom: 28 }}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={handleNext}
            disabled={saving || (currentStep === 0 && !stepData.name)}
            style={{
              flex: 1, padding: "14px",
              borderRadius: 12, border: "none",
              background: (saving || (currentStep === 0 && !stepData.name))
                ? "rgba(107,70,193,0.2)"
                : MIRA_ORB,
              color: (saving || (currentStep === 0 && !stepData.name)) ? G.muted : "#fff",
              fontSize: 15, fontWeight: 700,
              cursor: (saving || (currentStep === 0 && !stepData.name)) ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saving…" : currentStep >= STEPS.length - 1 ? `Mira is ready ✦` : "Next →"}
          </button>
          <button
            onClick={handleSkip}
            style={{
              padding: "14px 20px",
              borderRadius: 12,
              background: "none",
              border: "1px solid rgba(107,70,193,0.25)",
              color: G.sub, fontSize: 14,
              cursor: "pointer",
            }}
          >
            Skip
          </button>
        </div>

        {/* Step dots */}
        <div style={{
          display: "flex", justifyContent: "center",
          gap: 6, marginTop: 20,
        }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              width: i === currentStep ? 20 : 6,
              height: 6, borderRadius: 999,
              background: i < currentStep
                ? G.purple
                : i === currentStep
                ? MIRA_ORB
                : "rgba(107,70,193,0.20)",
              transition: "all 0.3s",
            }}/>
          ))}
        </div>

      </div>

      {/* +pts flash */}
      <PtsFlash pts={ptsToFlash} show={showPts}/>
    </div>
  );
}
