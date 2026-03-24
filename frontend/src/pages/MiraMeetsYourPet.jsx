/**
 * MiraMeetsYourPet.jsx — /join
 * The Doggy Company
 *
 * The first thing a new parent sees. Four screens:
 *
 *   Screen 1 — "How many furry friends?" (pet count 1–8+)
 *   Screen 2 — Per-pet profile (name + photo + breed) — repeats per pet
 *   Screen 3 — Soul snapshot (5 quick questions for all pets)
 *   Screen 4 — Parent account (name, email, phone, WhatsApp, password)
 *
 * On completion → navigate('/soul-builder') for deep 10-step per-pet onboarding.
 *
 * PHILOSOPHY:
 *   - Mira responds personally on every screen
 *   - No generic form labels — always Mira's voice
 *   - Breed search is fuzzy (5-tier matching) — no grid of initials
 *   - WhatsApp opt-in framed as Mira keeping you informed, not marketing
 *   - "8+" triggers the pack response: "A whole pack — Mira can't wait to meet them all 🌷"
 *
 * API:
 *   POST /api/auth/register  — creates parent account
 *   POST /api/pets           — creates each pet
 *   POST /api/upload/pet-photo — Cloudinary upload
 *
 * ROUTE: /join (public, no auth required)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../utils/api";

// ── Colour system ──────────────────────────────────────────────────────
const G = {
  deep:    "#0F0A1E",
  mid:     "#1A1363",
  purple:  "#9B59B6",
  pink:    "#E91E8C",
  gold:    "#C9973A",
  pale:    "#F5F3FF",
  light:   "#DDD6FE",
  muted:   "#6B46C1",
  text:    "#1A1A2E",
  sub:     "#64748B",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";
const MIRA_BTN = "linear-gradient(135deg,#9B59B6,#E91E8C)";

// ── Breed list (fuzzy search) ──────────────────────────────────────────
const BREEDS = [
  "Labrador Retriever","Golden Retriever","German Shepherd","French Bulldog",
  "Bulldog","Poodle","Beagle","Rottweiler","Boxer","Doberman Pinscher",
  "Pembroke Welsh Corgi","Australian Shepherd","Dachshund","Yorkshire Terrier",
  "Siberian Husky","Cavalier King Charles Spaniel","Great Dane",
  "Miniature Schnauzer","Shih Tzu","Border Collie","Bernese Mountain Dog",
  "Pomeranian","Havanese","Shetland Sheepdog","Cocker Spaniel","Maltese",
  "Chihuahua","Pug","Boston Terrier","Bichon Frise","Lhasa Apso",
  "Maltipoo","Goldendoodle","Labradoodle","Cockapoo","Cavapoo","Morkie",
  "Indian Pariah Dog (Indie)","Rajapalayam","Mudhol Hound","Chippiparai",
  "Spitz","Tibetan Mastiff","Samoyed","Dalmatian","Weimaraner",
  "Irish Setter","Saint Bernard","Newfoundland","Great Pyrenees",
  "Akita","Shiba Inu","Mixed Breed / Other",
];

// ── Mira's count responses ─────────────────────────────────────────────
const MIRA_COUNT = {
  1: "Just the one — Mira will know them completely.",
  2: "Two dogs — twice the love. Mira will know them both.",
  3: "A beautiful trio. Mira will build a profile for each one.",
  4: "A proper pack! Mira is already excited to meet all four.",
  5: "Five dogs — you are a true pack parent. Mira is ready.",
  6: "Six souls to know. Mira takes this seriously.",
  7: "Seven! Your home must be full of joy. Mira will know every one.",
  8: "A whole pack — Mira can't wait to meet them all. 🌷",
};

// ── Fuzzy breed search ─────────────────────────────────────────────────
function searchBreeds(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase().replace(/\s+/g, "");
  return BREEDS.map(b => {
    const bn = b.toLowerCase(), bnc = bn.replace(/\s+/g, "");
    let score = 0;
    if (bn.startsWith(query.toLowerCase()) || bnc.startsWith(q))   score = 100;
    else if (bn.includes(query.toLowerCase()) || bnc.includes(q))  score = 80;
    else if (bn.split(" ").some(w => w.startsWith(q.slice(0, 4)))) score = 60;
    else {
      let m = 0;
      for (let i = 0; i < Math.min(q.length, 5); i++) if (bnc.includes(q[i])) m++;
      score = m >= 4 ? 30 : 0;
    }
    return { b, score };
  })
  .filter(x => x.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 6)
  .map(x => x.b);
}

// ── Progress dots ──────────────────────────────────────────────────────
function Dots({ total, current }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 6, borderRadius: 999,
          width: i === current ? 20 : 6,
          background: i < current ? G.purple : i === current ? MIRA_BTN : "rgba(107,70,193,0.2)",
          transition: "all 0.3s",
        }}/>
      ))}
    </div>
  );
}

// ── Mira orb bar ──────────────────────────────────────────────────────
function MiraBar({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22 }}>
      <div style={{
        width:34, height:34, borderRadius:"50%", background:MIRA_ORB,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:15, color:"#fff", flexShrink:0,
      }}>✦</div>
      <div style={{ fontSize:13, fontWeight:700, color:G.muted }}>
        The Doggy Company · Mira
      </div>
      {label && (
        <div style={{ marginLeft:"auto", fontSize:11, color:"rgba(107,70,193,0.5)", fontWeight:600 }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ── Chip component ─────────────────────────────────────────────────────
function Chip({ label, emoji, selected, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      padding:"8px 14px", borderRadius:999, margin:3,
      border:`1.5px solid ${selected ? G.purple : "rgba(107,70,193,0.2)"}`,
      background: selected ? G.purple : "#fff",
      color: selected ? "#fff" : G.text,
      fontSize:12, fontWeight: selected ? 700 : 400,
      cursor:"pointer", transition:"all 0.15s",
      display:"inline-flex", alignItems:"center", gap:5,
    }}>
      {emoji && <span style={{ fontSize:14 }}>{emoji}</span>}
      {label}
    </button>
  );
}

// ── Next button ────────────────────────────────────────────────────────
function NextBtn({ label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"100%", padding:"15px",
      borderRadius:12, border:"none",
      background: disabled ? "rgba(107,70,193,0.15)" : MIRA_BTN,
      color: disabled ? G.muted : "#fff",
      fontSize:15, fontWeight:700,
      cursor: disabled ? "not-allowed" : "pointer",
      marginTop:18, transition:"all 0.2s",
    }}>
      {label}
    </button>
  );
}

// ── Divider ────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height:1, background:"rgba(107,70,193,0.1)", margin:"18px 0" }}/>;
}

// ── Section heading ────────────────────────────────────────────────────
function SectionHead({ title, sub }) {
  return (
    <>
      <div style={{ fontSize:14, fontWeight:700, color:G.text, margin:"0 0 4px" }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:G.sub, margin:"0 0 10px", lineHeight:1.5 }}>{sub}</div>}
    </>
  );
}

// ── Breed selector ─────────────────────────────────────────────────────
function BreedSelector({ value, onChange, petName }) {
  const [query,   setQuery]   = useState(value || "");
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setResults(query.length > 0 ? searchBreeds(query) : []);
  }, [query]);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref}>
      <SectionHead
        title={petName ? `What breed is ${petName}?` : "What breed are they?"}
        sub="Mira uses this to personalise everything — from food to farewell."
      />
      <div style={{ position:"relative" }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
          onFocus={() => setOpen(true)}
          placeholder="Search… Indie, Labrador, Maltipoo"
          style={{
            width:"100%", padding:"14px 16px", borderRadius:12, fontSize:15,
            border:`2px solid ${query ? G.purple : "rgba(107,70,193,0.2)"}`,
            outline:"none", boxSizing:"border-box", color:G.text,
            fontFamily:"inherit",
          }}
        />
        {open && results.length > 0 && (
          <div style={{
            position:"absolute", top:"100%", left:0, right:0, zIndex:200,
            background:"#fff", border:"1.5px solid rgba(107,70,193,0.2)",
            borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.1)",
            marginTop:4, overflow:"hidden",
          }}>
            {results.map(b => (
              <div key={b} onClick={() => { setQuery(b); onChange(b); setOpen(false); }}
                style={{
                  padding:"11px 16px", fontSize:14, cursor:"pointer",
                  color:G.text, borderBottom:"1px solid rgba(107,70,193,0.07)",
                  display:"flex", alignItems:"center", gap:8,
                }}
                onMouseEnter={e => e.currentTarget.style.background = G.pale}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                🐾 {b}
              </div>
            ))}
          </div>
        )}
      </div>
      {value && (
        <div style={{
          background:G.pale, border:"1.5px solid rgba(107,70,193,0.25)",
          borderRadius:10, padding:"10px 14px",
          display:"flex", alignItems:"center", gap:8, marginTop:8,
        }}>
          <span style={{ fontSize:16 }}>🐾</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:G.muted }}>{value}</div>
            <div style={{ fontSize:11, color:G.sub }}>Mira knows this breed ✓</div>
          </div>
        </div>
      )}
      <div style={{ fontSize:11, color:G.sub, marginTop:8, fontStyle:"italic" }}>
        Don't see your breed? Type it — Mira is always learning.
      </div>
    </div>
  );
}

// ── Photo uploader ─────────────────────────────────────────────────────
function PhotoUploader({ petName, onPhoto }) {
  const [preview,   setPreview]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [skipped,   setSkipped]   = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/upload/pet-photo-noop`, { method:"POST", body:form });
      if (res.ok) {
        const data = await res.json();
        onPhoto(data.url || data.photo_url, rawFile);
      } else {
        onPhoto(null);
      }
    } catch { onPhoto(null); }
    setUploading(false);
  };

  const name = petName || "your dog";

  if (skipped) return (
    <div style={{ fontSize:11, color:G.sub, fontStyle:"italic", marginBottom:4 }}>
      Photo skipped — you can add one any time from the profile page.
    </div>
  );

  return (
    <div>
      <SectionHead
        title={petName ? `Add ${petName}'s photo` : "Add a photo"}
        sub="Mira loves to see who she's helping"
      />
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border:`2px dashed ${preview ? G.purple : "rgba(107,70,193,0.25)"}`,
          borderRadius:14, padding: preview ? 0 : "22px 16px",
          textAlign:"center", cursor:"pointer",
          background: preview ? G.pale : "#fafafa",
          overflow:"hidden", transition:"all 0.2s",
          minHeight: preview ? 160 : "auto",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
      >
        {preview ? (
          <img src={preview} alt={name}
            style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:12 }}/>
        ) : (
          <div>
            <div style={{ fontSize:28, marginBottom:8 }}>📸</div>
            <div style={{ fontSize:13, fontWeight:600, color:G.text, marginBottom:4 }}>
              Add {petName ? `${petName}'s` : "a"} photo
            </div>
            <div style={{ fontSize:11, color:G.sub }}>Tap to choose · use camera on mobile</div>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
      {uploading && (
        <div style={{ fontSize:11, color:G.muted, textAlign:"center", marginTop:6 }}>Uploading…</div>
      )}
      {preview && !uploading && (
        <div style={{ fontSize:11, color:G.purple, textAlign:"center", marginTop:6, fontStyle:"italic" }}>
          Perfect. Mira will always recognise {name} now ♥
        </div>
      )}
      {!preview && (
        <div style={{ textAlign:"center", marginTop:8 }}>
          <span onClick={() => setSkipped(true)}
            style={{ fontSize:12, color:G.purple, cursor:"pointer", textDecoration:"underline" }}>
            Skip for now →
          </span>
        </div>
      )}
      {preview && (
        <button onClick={() => { setPreview(null); onPhoto(null); }}
          style={{
            marginTop:8, width:"100%", padding:"7px",
            borderRadius:8, background:"none",
            border:"1px solid rgba(107,70,193,0.2)",
            color:G.sub, fontSize:12, cursor:"pointer",
          }}>
          Choose a different photo
        </button>
      )}
    </div>
  );
}

// ── SCREEN 1: Pet count ────────────────────────────────────────────────
function Screen1({ onNext }) {
  const [count, setCount] = useState(0);

  const counts = [1,2,3,4,5,6,7,8];

  return (
    <div>
      <MiraBar/>
      <h2 style={{ fontSize:"clamp(1.3rem,3vw,1.6rem)", fontWeight:800, color:G.text, fontFamily:"Georgia,serif", margin:"0 0 6px", lineHeight:1.3 }}>
        How many furry friends do you have?
      </h2>
      <p style={{ fontSize:13, color:G.sub, margin:"0 0 20px", lineHeight:1.5 }}>
        Mira will get to know each one personally.
      </p>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
        {counts.map(n => (
          <button key={n} onClick={() => setCount(n)} style={{
            width:52, height:52, borderRadius:12,
            border:`2px solid ${count === n ? G.purple : "rgba(107,70,193,0.2)"}`,
            background: count === n ? G.pale : "#fff",
            fontSize: n === 8 ? 13 : 18,
            fontWeight:700, color: count === n ? G.purple : G.text,
            cursor:"pointer", transition:"all 0.15s",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {n === 8 ? "8+" : n}
          </button>
        ))}
      </div>

      {count > 0 && (
        <div style={{
          background:"linear-gradient(135deg,#1A0530,#2D1B69)",
          borderRadius:12, padding:"14px 16px",
          display:"flex", gap:10, alignItems:"flex-start",
          marginBottom:4,
        }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#fff", flexShrink:0 }}>✦</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontStyle:"italic", lineHeight:1.6 }}>
            {MIRA_COUNT[count] || MIRA_COUNT[8]}
          </div>
        </div>
      )}

      <NextBtn label="Let's meet them →" disabled={!count} onClick={() => onNext(count)}/>
      <Dots total={4} current={0}/>
    </div>
  );
}

// ── SCREEN 2: Per-pet profile ──────────────────────────────────────────
function Screen2({ petCount, onNext }) {
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [pets, setPets] = useState(
    Array.from({ length: Math.min(petCount, 8) }, () => ({
      name: "", breed: "", photo_url: null, photo_file: null,
    }))
  );

  const pet = pets[currentPetIndex];
  const updatePet = (field, value) => {
    const updated = [...pets];
    updated[currentPetIndex] = { ...updated[currentPetIndex], [field]: value };
    setPets(updated);
  };

  const isLast = currentPetIndex >= pets.length - 1;
  const btnLabel = pet.name
    ? isLast ? `Mira, meet ${pet.name} — next step →` : `Next — tell Mira about dog ${currentPetIndex + 2} →`
    : isLast ? "Next step →" : `Next dog →`;

  const handleNext = () => {
    if (isLast) {
      onNext(pets);
    } else {
      setCurrentPetIndex(i => i + 1);
    }
  };

  return (
    <div>
      <MiraBar label={pets.length > 1 ? `Dog ${currentPetIndex + 1} of ${pets.length}` : null}/>

      <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.4rem)", fontWeight:800, color:G.text, fontFamily:"Georgia,serif", margin:"0 0 6px", lineHeight:1.3 }}>
        {pet.name ? `Tell Mira about ${pet.name}` : `Tell Mira about your ${currentPetIndex === 0 ? "first" : `dog ${currentPetIndex + 1}`}`}
      </h2>
      <p style={{ fontSize:13, color:G.sub, margin:"0 0 20px", lineHeight:1.5 }}>
        Mira will remember everything you share.
      </p>

      {/* Name */}
      <div style={{ marginBottom:16 }}>
        <input
          value={pet.name}
          onChange={e => updatePet("name", e.target.value)}
          placeholder="What do you call them?"
          style={{
            width:"100%", padding:"15px 16px", borderRadius:12,
            fontSize:20, fontWeight:600,
            border:`2px solid ${pet.name ? G.purple : "rgba(107,70,193,0.2)"}`,
            outline:"none", boxSizing:"border-box", color:G.text,
            fontFamily:"inherit",
          }}
        />
        <div style={{ fontSize:11, color:G.sub, marginTop:5 }}>
          This is how Mira will always address your dog
        </div>
      </div>

      <Divider/>

      {/* Photo */}
      <div style={{ marginBottom:16 }}>
        <PhotoUploader petName={pet.name} onPhoto={(url, file) => { updatePet("photo_url", url); updatePet("photo_file", file || null); }}/>
      </div>

      <Divider/>

      {/* Breed */}
      <BreedSelector
        value={pet.breed}
        petName={pet.name}
        onChange={breed => updatePet("breed", breed)}
      />

      <NextBtn label={btnLabel} onClick={handleNext}/>
      <Dots total={4} current={1}/>
    </div>
  );
}

// ── SCREEN 3: Soul snapshot ────────────────────────────────────────────
function Screen3({ pets, onNext }) {
  const [allergies,    setAllergies]    = useState(["none"]);
  const [conditions,   setConditions]   = useState(["healthy"]);
  const [carRide,      setCarRide]      = useState("");
  const [dogFriendly,  setDogFriendly]  = useState("");
  const [lifestyle,    setLifestyle]    = useState("");

  const toggleAllergy = id => {
    if (id === "none") { setAllergies(["none"]); return; }
    const cur = allergies.filter(x => x !== "none");
    setAllergies(cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  };
  const toggleCondition = id => {
    if (id === "healthy") { setConditions(["healthy"]); return; }
    const cur = conditions.filter(x => x !== "healthy");
    setConditions(cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  };

  const petLabel = pets.length > 1 ? "your dogs" : (pets[0]?.name || "your dog");

  return (
    <div>
      <MiraBar/>
      <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.4rem)", fontWeight:800, color:G.text, fontFamily:"Georgia,serif", margin:"0 0 6px", lineHeight:1.3 }}>
        Quick soul snapshot
      </h2>
      <p style={{ fontSize:13, color:G.sub, margin:"0 0 20px", lineHeight:1.5 }}>
        5 questions for {petLabel} — takes 60 seconds. Mira starts learning straight away.
      </p>

      {/* Allergies */}
      <SectionHead
        title="Any food allergies to know about? 🍖"
        sub="Mira will never suggest food containing these"
      />
      <div style={{ display:"flex", flexWrap:"wrap", margin:"-3px 0 16px" }}>
        {[
          {id:"none",    label:"None known",   emoji:"✅"},
          {id:"chicken", label:"Chicken",       emoji:"🍗"},
          {id:"beef",    label:"Beef",          emoji:"🥩"},
          {id:"grain",   label:"Grain / wheat", emoji:"🌾"},
          {id:"dairy",   label:"Dairy",         emoji:"🥛"},
          {id:"fish",    label:"Fish",          emoji:"🐟"},
          {id:"soy",     label:"Soy",           emoji:"🫘"},
          {id:"eggs",    label:"Eggs",          emoji:"🥚"},
        ].map(opt => (
          <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
            selected={allergies.includes(opt.id)}
            onToggle={() => toggleAllergy(opt.id)}/>
        ))}
      </div>

      <Divider/>

      {/* Health conditions */}
      <SectionHead
        title="Any health conditions? 🏥"
        sub="Mira filters recommendations accordingly"
      />
      <div style={{ display:"flex", flexWrap:"wrap", margin:"-3px 0 16px" }}>
        {[
          {id:"healthy",   label:"All healthy",   emoji:"✅"},
          {id:"joint",     label:"Joint issues",   emoji:"🦴"},
          {id:"anxiety",   label:"Anxiety",        emoji:"🌸"},
          {id:"dental",    label:"Dental",         emoji:"🦷"},
          {id:"weight",    label:"Weight",         emoji:"⚖️"},
          {id:"heart",     label:"Heart",          emoji:"❤️"},
          {id:"digestive", label:"Digestive",      emoji:"🥗"},
          {id:"senior",    label:"Senior care",    emoji:"🌷"},
        ].map(opt => (
          <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
            selected={conditions.includes(opt.id)}
            onToggle={() => toggleCondition(opt.id)}/>
        ))}
      </div>

      <Divider/>

      {/* Car rides */}
      <SectionHead
        title="How do they feel about car rides? 🚗"
        sub="Helps Mira with travel and Go recommendations"
      />
      <div style={{ display:"flex", flexWrap:"wrap", margin:"-3px 0 16px" }}>
        {[
          {id:"love",     label:"Love it",     emoji:"😍"},
          {id:"okay",     label:"Okay with it", emoji:"😐"},
          {id:"nervous",  label:"Nervous",      emoji:"😰"},
          {id:"refuses",  label:"Refuses",      emoji:"🚫"},
        ].map(opt => (
          <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
            selected={carRide === opt.id}
            onToggle={() => setCarRide(opt.id)}/>
        ))}
      </div>

      <Divider/>

      {/* Dog friendly */}
      <SectionHead
        title={`How ${pets.length > 1 ? "are they" : `is ${pets[0]?.name || "your dog"}`} with other dogs?`}
        sub="Mira uses this for social and play recommendations"
      />
      <div style={{ display:"flex", flexWrap:"wrap", margin:"-3px 0 16px" }}>
        {[
          {id:"loves",     label:"Loves everyone",  emoji:"🤗"},
          {id:"selective", label:"Selective",        emoji:"🤔"},
          {id:"shy",       label:"Shy",              emoji:"🌸"},
          {id:"reactive",  label:"Can be reactive",  emoji:"⚡"},
        ].map(opt => (
          <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
            selected={dogFriendly === opt.id}
            onToggle={() => setDogFriendly(opt.id)}/>
        ))}
      </div>

      <Divider/>

      {/* Lifestyle */}
      <SectionHead
        title="What's the home vibe? 🏠"
        sub="Helps Mira understand daily life"
      />
      <div style={{ display:"flex", flexWrap:"wrap", margin:"-3px 0 4px" }}>
        {[
          {id:"apartment",  label:"Apartment life",   emoji:"🏢"},
          {id:"house",      label:"House + garden",   emoji:"🏡"},
          {id:"farm",       label:"Farm / rural",     emoji:"🌾"},
          {id:"travel",     label:"Always travelling", emoji:"✈️"},
        ].map(opt => (
          <Chip key={opt.id} label={opt.label} emoji={opt.emoji}
            selected={lifestyle === opt.id}
            onToggle={() => setLifestyle(opt.id)}/>
        ))}
      </div>

      <NextBtn
        label="Almost there →"
        onClick={() => onNext({ allergies, conditions, carRide, dogFriendly, lifestyle })}
      />
      <Dots total={4} current={2}/>
    </div>
  );
}

// ── SCREEN 4: Parent account ───────────────────────────────────────────
function Screen4({ pets, snapshot, onComplete, loading }) {
  const [form, setForm] = useState({
    name:"", email:"", phone:"", whatsapp:"", password:"", wa_updates:true,
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const ready = form.name && form.email && form.phone && form.password;

  const firstPetName = pets[0]?.name;

  return (
    <div>
      <MiraBar/>
      <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.4rem)", fontWeight:800, color:G.text, fontFamily:"Georgia,serif", margin:"0 0 6px", lineHeight:1.3 }}>
        Last step — it's about you
      </h2>
      <p style={{ fontSize:13, color:G.sub, margin:"0 0 20px", lineHeight:1.5 }}>
        So Mira can reach you on WhatsApp with updates about your pack.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {[
          { field:"name",     placeholder:"What should we call you?",    type:"text",     label:"Your name" },
          { field:"email",    placeholder:"your@email.com",              type:"email",    label:"Email" },
          { field:"phone",    placeholder:"10-digit mobile number",      type:"tel",      label:"Mobile" },
        ].map(f => (
          <div key={f.field}>
            <label style={{ fontSize:12, fontWeight:700, color:G.muted, display:"block", marginBottom:5 }}>
              {f.label}
            </label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={form[f.field]}
              onChange={e => set(f.field, e.target.value)}
              style={{
                width:"100%", padding:"13px 14px", borderRadius:10,
                fontSize:14, border:`1.5px solid ${form[f.field] ? G.purple : "rgba(107,70,193,0.2)"}`,
                outline:"none", boxSizing:"border-box", color:G.text, fontFamily:"inherit",
              }}
            />
          </div>
        ))}

        {/* WhatsApp — only if different */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:G.muted, display:"block", marginBottom:5 }}>
            WhatsApp <span style={{ fontWeight:400, color:G.sub }}>(leave blank if same as mobile)</span>
          </label>
          <input
            type="tel" placeholder="Different WhatsApp number?"
            value={form.whatsapp}
            onChange={e => set("whatsapp", e.target.value)}
            style={{
              width:"100%", padding:"13px 14px", borderRadius:10,
              fontSize:14, border:"1.5px solid rgba(107,70,193,0.2)",
              outline:"none", boxSizing:"border-box", color:G.text, fontFamily:"inherit",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize:12, fontWeight:700, color:G.muted, display:"block", marginBottom:5 }}>
            Password
          </label>
          <input
            type="password" placeholder="Choose a password"
            value={form.password}
            onChange={e => set("password", e.target.value)}
            style={{
              width:"100%", padding:"13px 14px", borderRadius:10,
              fontSize:14, border:`1.5px solid ${form.password ? G.purple : "rgba(107,70,193,0.2)"}`,
              outline:"none", boxSizing:"border-box", color:G.text, fontFamily:"inherit",
            }}
          />
        </div>

        {/* WhatsApp opt-in */}
        <div style={{
          background:G.pale, borderRadius:10, padding:"12px 14px",
          display:"flex", alignItems:"flex-start", gap:10,
        }}>
          <input type="checkbox" id="wa-opt"
            checked={form.wa_updates}
            onChange={e => set("wa_updates", e.target.checked)}
            style={{ marginTop:2, accentColor:G.purple, cursor:"pointer" }}
          />
          <label htmlFor="wa-opt" style={{ fontSize:12, color:G.text, lineHeight:1.6, cursor:"pointer" }}>
            Send me updates about {pets.length > 1 ? "my dogs" : firstPetName || "my dog"} on WhatsApp — Mira will keep me informed about bookings, recommendations and care reminders
          </label>
        </div>
      </div>

      <NextBtn
        label={loading ? "Setting up your pack…" : "Mira is ready to meet your pack →"}
        disabled={!ready || loading}
        onClick={() => onComplete(form)}
      />
      <Dots total={4} current={3}/>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────
export default function MiraMeetsYourPet() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [screen,   setScreen]   = useState(1);
  const [petCount, setPetCount] = useState(0);
  const [pets,     setPets]     = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleCount = (count) => {
    setPetCount(count);
    setScreen(2);
  };

  const handlePets = (petData) => {
    setPets(petData);
    setScreen(3);
  };

  const handleSnapshot = (snap) => {
    setSnapshot(snap);
    setScreen(4);
  };

  const handleComplete = async (form) => {
    setLoading(true);
    setError("");
    try {
      // Register parent — matches MembershipOnboardModel schema exactly
      const regRes = await fetch(`${API_URL}/api/auth/membership/onboard`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          parent: {
            name:               form.name,
            email:              form.email,
            password:           form.password,
            phone:              form.phone,
            whatsapp:           form.whatsapp || form.phone,
            city:               form.city || "Mumbai",
            pincode:            form.pincode || "400001",
            accepted_terms:     true,
            accepted_privacy:   true,
            preferred_contact:  "whatsapp",
          },
          pets: pets.filter(p => p.name).map(p => ({
            name:    p.name,
            breed:   p.breed || "Indie",
            species: "dog",
          })),
          plan_type: "annual",
          pet_count: pets.filter(p => p.name).length || 1,
        }),
      });

      if (!regRes.ok) {
        const err = await regRes.json();
        setError(err.detail || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const { access_token, user, pet_ids = [] } = await regRes.json();
      localStorage.setItem("tdb_auth_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      // Refresh auth context in background; local token is already set.
      login(form.email, form.password).catch(() => {
        // If login refresh fails, manual token is still set — proceed
      });

      // Membership onboarding already creates pets server-side and returns pet_ids.
      const createdPets = pets
        .filter(p => p.name)
        .map((pet, idx) => ({ ...pet, id: pet_ids[idx] }))
        .filter(p => p.id);

      // Upload photos against the newly created pet IDs
      for (let i = 0; i < createdPets.length; i++) {
        const pet = createdPets[i];
        const petId = createdPets[i]?.id;
        if (pet.photo_file && petId && access_token) {
          try {
            const photoForm = new FormData();
            photoForm.append("photo", pet.photo_file);
            await fetch(`${API_URL}/api/pets/${petId}/photo`, {
              method: "POST",
              headers: { Authorization: `Bearer ${access_token}` },
              body: photoForm,
            });
          } catch(e) { console.warn("Photo upload failed for", petId, e); }
        }
      }
      const firstPetId = createdPets[0]?.id || pet_ids[0];
      window.location.href = firstPetId ? `/soul-builder?pet_id=${firstPetId}` : "/soul-builder";
    } catch {
      setError("Could not connect. Please check your connection and try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:`linear-gradient(135deg,${G.deep} 0%,${G.mid} 100%)`,
      display:"flex", alignItems:"flex-start", justifyContent:"center",
      padding:"24px 16px 60px",
    }}>
      <div style={{
        background:"#fff", borderRadius:24,
        padding:"28px 24px", maxWidth:460, width:"100%",
        boxShadow:"0 24px 80px rgba(0,0,0,0.35)",
      }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <div style={{ fontSize:11, color:G.sub, fontWeight:600 }}>
            Existing member?
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                border:'none', background:'transparent', color:G.purple,
                fontSize:12, fontWeight:700, cursor:'pointer', textDecoration:'underline',
                padding:0,
              }}
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/forgot-password')}
              style={{
                border:'none', background:'transparent', color:G.sub,
                fontSize:12, fontWeight:600, cursor:'pointer', textDecoration:'underline',
                padding:0,
              }}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background:"#FEF2F2", border:"1px solid #FECACA",
            borderRadius:10, padding:"10px 14px",
            fontSize:13, color:"#B91C1C", marginBottom:16,
          }}>
            {error}
          </div>
        )}

        {screen === 1 && <Screen1 onNext={handleCount}/>}
        {screen === 2 && <Screen2 petCount={petCount} onNext={handlePets}/>}
        {screen === 3 && <Screen3 pets={pets} onNext={handleSnapshot}/>}
        {screen === 4 && (
          <Screen4
            pets={pets}
            snapshot={snapshot}
            onComplete={handleComplete}
            loading={loading}
          />
        )}

      </div>
    </div>
  );
}
