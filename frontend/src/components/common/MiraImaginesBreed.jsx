/**
 * MiraImaginesBreed.jsx
 * The Doggy Company
 *
 * Shown when Mira has no scored products for a dog's breed yet.
 * Instead of showing nothing or generic products, Mira imagines
 * what this breed needs — based on known breed traits — and routes
 * to Concierge to source them.
 *
 * USAGE — drop into any *SoulPage.jsx MiraPicksSection:
 *
 *   import MiraImaginesBreed from "../components/common/MiraImaginesBreed";
 *
 *   // In MiraPicksSection, when picks.length === 0:
 *   if (!loading && picks.length === 0) {
 *     return (
 *       <MiraImaginesBreed
 *         pet={petData}
 *         pillar="care"
 *         onConcierge={handleConcierge}
 *       />
 *     );
 *   }
 *
 * PROPS:
 *   pet         — pet object (name, breed, doggy_soul_answers, overall_score)
 *   pillar      — current pillar string ("care","dine","shop","celebrate" etc.)
 *   onConcierge — fn(imagineCard) called when parent taps "Ask Concierge"
 *   colour      — optional pillar accent colour (defaults to Mira purple)
 *
 * HOW IT WORKS:
 *   1. Looks up breed traits from BREED_TRAITS map
 *   2. If breed unknown, falls back to soul answers (energy, coat, allergies)
 *   3. Generates 3 contextual imagine cards per pillar
 *   4. Triggers Cloudinary watercolour generation in background
 *   5. Each card → Concierge ticket when tapped
 *   6. Also triggers POST /api/mira/score-for-pet to queue scoring
 *      so next visit has real picks
 *
 * BACKEND SIDE EFFECT:
 *   Fires POST /api/mira/score-for-pet in background (no await)
 *   so Mira starts learning this breed for next session.
 */

import { useState, useEffect } from "react";
import { API_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { tdc } from "../../utils/tdc_intent";

const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ── Breed trait knowledge base ─────────────────────────────────────────
// Maps breed → { traits, coat, energy, size, sensitivities, personality }
// Used to generate contextual imagine cards.
// Add breeds as parents onboard them — this grows over time.
const BREED_TRAITS = {
  // Small breeds
  "maltipoo":        { traits:["gentle","social","low-shedding"], coat:"curly-soft", energy:"medium", size:"small", sensitivities:["skin","dental"], personality:"affectionate lap dog" },
  "maltese":         { traits:["silky-coat","gentle","playful"], coat:"long-silky", energy:"low-medium", size:"small", sensitivities:["tear-staining","skin"], personality:"elegant and playful" },
  "shih tzu":        { traits:["silky-coat","friendly","adaptable"], coat:"long-silky", energy:"low", size:"small", sensitivities:["eye","dental"], personality:"loyal companion" },
  "pomeranian":      { traits:["fluffy","energetic","alert"], coat:"double-thick", energy:"high", size:"small", sensitivities:["dental","joint"], personality:"bold and curious" },
  "chihuahua":       { traits:["loyal","alert","bold"], coat:"short-smooth", energy:"medium", size:"tiny", sensitivities:["cold","dental"], personality:"fierce loyalty in small body" },
  "toy poodle":      { traits:["intelligent","low-shedding","agile"], coat:"curly-dense", energy:"high", size:"small", sensitivities:["skin","ear"], personality:"highly trainable and social" },
  "miniature poodle":{ traits:["intelligent","active","low-shedding"], coat:"curly-dense", energy:"high", size:"medium-small", sensitivities:["ear","skin"], personality:"athletic and clever" },
  "cocker spaniel":  { traits:["gentle","playful","affectionate"], coat:"wavy-medium", energy:"medium", size:"medium", sensitivities:["ear","eye"], personality:"sweet-natured family dog" },
  "cavalier king charles":{ traits:["gentle","social","adaptable"], coat:"silky-wavy", energy:"low-medium", size:"small", sensitivities:["heart","ear"], personality:"born lap dog" },
  "bichon frise":    { traits:["cheerful","low-shedding","gentle"], coat:"curly-fluffy", energy:"medium", size:"small", sensitivities:["skin","eye"], personality:"happy and social" },
  "lhasa apso":      { traits:["independent","protective","long-coat"], coat:"long-straight", energy:"low", size:"small", sensitivities:["eye","dental"], personality:"ancient sentinel dog" },
  "yorkshire terrier":{ traits:["bold","silky-coat","feisty"], coat:"long-silky", energy:"medium", size:"tiny", sensitivities:["dental","digestive"], personality:"terrier spirit in tiny body" },
  "dachshund":       { traits:["curious","stubborn","loyal"], coat:"short-smooth", energy:"medium", size:"small", sensitivities:["back","joint"], personality:"hound with a big personality" },
  "french bulldog":  { traits:["adaptable","playful","low-energy"], coat:"short-smooth", energy:"low", size:"small-medium", sensitivities:["breathing","skin-fold","joint"], personality:"charming city dog" },
  "pug":             { traits:["sociable","charming","low-energy"], coat:"short-smooth", energy:"low", size:"small", sensitivities:["breathing","eye","skin-fold"], personality:"comedian with a heart of gold" },
  "boston terrier":  { traits:["friendly","intelligent","compact"], coat:"short-smooth", energy:"medium", size:"small", sensitivities:["eye","breathing"], personality:"the American gentleman" },
  // Medium breeds
  "labrador":        { traits:["friendly","active","food-motivated"], coat:"short-double", energy:"high", size:"large", sensitivities:["joint","weight"], personality:"golden-hearted family dog" },
  "labrador retriever":{ traits:["friendly","active","food-motivated"], coat:"short-double", energy:"high", size:"large", sensitivities:["joint","weight"], personality:"golden-hearted family dog" },
  "golden retriever":{ traits:["gentle","intelligent","social"], coat:"long-double", energy:"high", size:"large", sensitivities:["joint","skin"], personality:"eternally optimistic" },
  "beagle":          { traits:["curious","scent-driven","social"], coat:"short-smooth", energy:"high", size:"medium", sensitivities:["ear","weight"], personality:"nose-led adventurer" },
  "indie":           { traits:["resilient","intelligent","loyal"], coat:"short-smooth", energy:"high", size:"medium", sensitivities:["none-significant"], personality:"India's original dog" },
  "indian pariah":   { traits:["resilient","intelligent","loyal"], coat:"short-smooth", energy:"high", size:"medium", sensitivities:["none-significant"], personality:"India's original dog" },
  "border collie":   { traits:["highly-intelligent","energetic","herding-instinct"], coat:"medium-double", energy:"very-high", size:"medium", sensitivities:["mental-stimulation","joint"], personality:"the world's smartest dog" },
  "australian shepherd":{ traits:["intelligent","active","herding"], coat:"medium-wavy", energy:"very-high", size:"medium", sensitivities:["joint","eye"], personality:"born to work and play" },
  "siberian husky":  { traits:["energetic","independent","vocal"], coat:"thick-double", energy:"very-high", size:"large", sensitivities:["heat","joint"], personality:"wolf spirit in a dog body" },
  "german shepherd": { traits:["loyal","intelligent","protective"], coat:"medium-double", energy:"high", size:"large", sensitivities:["joint","digestive"], personality:"noble protector" },
  "doberman":        { traits:["loyal","alert","athletic"], coat:"short-smooth", energy:"high", size:"large", sensitivities:["heart","joint"], personality:"elegant guardian" },
  "rottweiler":      { traits:["loyal","confident","calm"], coat:"short-double", energy:"medium-high", size:"large", sensitivities:["joint","weight"], personality:"gentle giant with family" },
  "boxer":           { traits:["playful","loyal","energetic"], coat:"short-smooth", energy:"high", size:"large", sensitivities:["breathing","joint","heart"], personality:"eternal puppy spirit" },
  "dalmatian":       { traits:["energetic","loyal","athletic"], coat:"short-smooth", energy:"very-high", size:"large", sensitivities:["urinary","deafness-risk"], personality:"born to run" },
};

// ── Pillar-specific imagine card generators ────────────────────────────
// Returns 3 cards per pillar, personalised to breed traits
function generateImagineCards(petName, breed, traits, pillar) {
  const coat       = traits?.coat || "medium";
  const energy     = traits?.energy || "medium";
  const sensit     = traits?.sensitivities || [];
  const size       = traits?.size || "medium";
  const personality= traits?.personality || "wonderful dog";
  const breedLabel = breed ? breed.split("(")[0].trim() : "your dog";

  const CARDS = {
    care: [
      {
        icon: "🧴",
        bg: "linear-gradient(135deg,#1B4332,#2D6A4F)",
        name: `${breedLabel} Coat Care Kit`,
        desc: `A grooming set matched to ${petName}'s ${coat} coat — shampoo, brush and conditioner`,
        reason: `${breedLabel}s need specific coat care. Mira would build this around ${petName}'s coat type.`,
        cta: "Source this for me →",
      },
      {
        icon: sensit.includes("dental") ? "🦷" : "🐾",
        bg: "linear-gradient(135deg,#1B4332,#40916C)",
        name: sensit.includes("dental") ? `${breedLabel} Dental Care Set` : `${breedLabel} Paw Care Kit`,
        desc: sensit.includes("dental")
          ? `${breedLabel}s are prone to dental issues — enzymatic toothpaste + finger brush`
          : `Paw balm, nail file and massage mitt sized for ${size} breeds`,
        reason: `Mira flagged ${sensit[0] || "general care"} as a priority for ${breedLabel}s.`,
        cta: "Source this for me →",
      },
      {
        icon: "🌿",
        bg: "linear-gradient(135deg,#2D6A4F,#1B4332)",
        name: `${petName}'s Monthly Wellness Box`,
        desc: `Supplements, grooming essentials and seasonal care — curated for ${breedLabel}s monthly`,
        reason: `A subscription box built around ${petName}'s breed needs. Mira would curate this every month.`,
        cta: "Ask Concierge →",
      },
    ],
    dine: [
      {
        icon: "🐟",
        bg: "linear-gradient(135deg,#4A2000,#8B4513)",
        name: `${breedLabel} Nutrition Plan`,
        desc: `Breed-specific meal plan — portion sizes, protein ratio and supplements for ${size} ${energy}-energy dogs`,
        reason: `${breedLabel}s have specific dietary needs. Mira would design ${petName}'s plan around breed + age.`,
        cta: "Source this for me →",
      },
      {
        icon: sensit.includes("weight") ? "⚖️" : "🥗",
        bg: "linear-gradient(135deg,#6B3000,#A0522D)",
        name: sensit.includes("weight") ? `Weight-Managed Meal Box` : `Fresh Meal Box for ${breedLabel}s`,
        desc: sensit.includes("weight")
          ? `Portion-controlled, vet-guided meals for ${petName} — delivered fresh weekly`
          : `Human-grade fresh meals matched to ${petName}'s breed size and energy`,
        reason: sensit.includes("weight")
          ? `${breedLabel}s can be weight-sensitive. Mira would manage ${petName}'s portions carefully.`
          : `Fresh food makes the biggest difference for ${energy}-energy dogs like ${petName}.`,
        cta: "Source this for me →",
      },
      {
        icon: "🍖",
        bg: "linear-gradient(135deg,#3D1F00,#7B3F00)",
        name: `${petName}'s Treat Collection`,
        desc: `Dog-safe treats curated for ${breedLabel} size, chew strength and any known sensitivities`,
        reason: `The Doggy Bakery can make ${petName}-specific treats. Mira would select the right ones.`,
        cta: "Ask Concierge →",
      },
    ],
    shop: [
      {
        icon: "🛍️",
        bg: "linear-gradient(135deg,#3D1F00,#7B3F00)",
        name: `${breedLabel} Essentials Bundle`,
        desc: `Everything a ${breedLabel} parent needs — grooming, feeding, play and comfort essentials`,
        reason: `Mira would curate a starter bundle specifically for ${petName}'s size and coat type.`,
        cta: "Source this for me →",
      },
      {
        icon: "🎀",
        bg: "linear-gradient(135deg,#7B3F00,#C9973A)",
        name: `${petName}'s Breed Collection`,
        desc: `Personalised merch — bandana, mug, keychain and frame — all with ${breedLabel} art`,
        reason: `Your breed, your dog, your collection. Mira imagines ${petName}'s name on all of it.`,
        cta: "Source this for me →",
      },
      {
        icon: "🎂",
        bg: "linear-gradient(135deg,#5D2E00,#8B4513)",
        name: `${petName}'s Birthday Cake`,
        desc: `Custom ${breedLabel}-breed birthday cake — dog-safe, handmade by The Doggy Bakery`,
        reason: `The Doggy Bakery makes breed-specific cakes. Mira would design one for ${petName}.`,
        cta: "Order from Bakery →",
      },
    ],
    celebrate: [
      {
        icon: "🎂",
        bg: "linear-gradient(135deg,#2D1B69,#4A2C8F)",
        name: `${petName}'s Birthday Cake`,
        desc: `Custom ${breedLabel}-breed birthday cake — dog-safe, handmade by The Doggy Bakery`,
        reason: `The Doggy Bakery makes breed-specific cakes. Mira would design one just for ${petName}.`,
        cta: "Order from Bakery →",
      },
      {
        icon: "📸",
        bg: "linear-gradient(135deg,#4A2C8F,#7B3F00)",
        name: `${petName}'s Birthday Photoshoot`,
        desc: `A professional pet photographer who knows how to capture ${breedLabel}s at their best`,
        reason: `${personality.charAt(0).toUpperCase() + personality.slice(1)} — that personality deserves to be captured forever.`,
        cta: "Book via Concierge →",
      },
      {
        icon: "🎁",
        bg: "linear-gradient(135deg,#2D1B69,#9B59B6)",
        name: `${petName}'s Celebration Box`,
        desc: `Birthday bandana, party hat, treats and decorations — all personalised for ${breedLabel}s`,
        reason: `Mira imagines a complete celebration box designed around ${petName}'s breed and personality.`,
        cta: "Source this for me →",
      },
    ],
    learn: [
      {
        icon: "🎓",
        bg: "linear-gradient(135deg,#1A0A5E,#3730A3)",
        name: `${breedLabel} Training Programme`,
        desc: energy === "very-high" || energy === "high"
          ? `High-energy ${breedLabel}s thrive with structured training — 8-week programme for ${petName}`
          : `Positive reinforcement training tailored to ${breedLabel} temperament and learning style`,
        reason: `${breedLabel}s respond best to ${energy === "very-high" ? "structured, mentally stimulating" : "gentle, consistent"} training. Mira would match ${petName} to the right trainer.`,
        cta: "Book via Concierge →",
      },
      {
        icon: "🧠",
        bg: "linear-gradient(135deg,#3730A3,#1A0A5E)",
        name: `${petName}'s Enrichment Kit`,
        desc: `Puzzle toys, scent games and enrichment activities matched to ${breedLabel} intelligence level`,
        reason: `Mental stimulation is as important as physical exercise for ${breedLabel}s like ${petName}.`,
        cta: "Source this for me →",
      },
      {
        icon: "📚",
        bg: "linear-gradient(135deg,#1A0A5E,#4A2C8F)",
        name: `${breedLabel} Parent Guide`,
        desc: `Everything you need to know about raising a ${breedLabel} — breed-specific advice from Mira`,
        reason: `Every breed has quirks. Mira would build a personalised guide for ${petName}'s parent.`,
        cta: "Ask Mira →",
      },
    ],
    fit: [
      {
        icon: "🏃",
        bg: "linear-gradient(135deg,#7C1D1D,#DC2626)",
        name: `${petName}'s Fitness Plan`,
        desc: energy === "very-high" || energy === "high"
          ? `${breedLabel}s need serious activity — personalised plan: walks, runs and mental exercise`
          : `Gentle fitness plan for ${petName} — walks, play sessions and age-appropriate activity`,
        reason: `${breedLabel}s are ${energy}-energy dogs. Mira would build ${petName}'s plan around that.`,
        cta: "Book via Concierge →",
      },
      {
        icon: "🎾",
        bg: "linear-gradient(135deg,#991B1B,#B91C1C)",
        name: `${petName}'s Play Kit`,
        desc: `Toys and equipment matched to ${breedLabel} play style — fetch, tug, chase or puzzle`,
        reason: `The right toys matter. Mira would choose based on ${petName}'s size and energy.`,
        cta: "Source this for me →",
      },
      {
        icon: sensit.includes("joint") ? "💊" : "🌊",
        bg: "linear-gradient(135deg,#7C1D1D,#991B1B)",
        name: sensit.includes("joint") ? `Joint Support Supplement` : `Hydrotherapy Session`,
        desc: sensit.includes("joint")
          ? `${breedLabel}s can be joint-sensitive — glucosamine + omega 3 for ${petName}`
          : `Swimming is ideal low-impact exercise for ${breedLabel}s — Mira would find a pool near you`,
        reason: sensit.includes("joint")
          ? `Mira flagged joint health as a priority for ${breedLabel}s.`
          : `Water exercise builds fitness without joint stress.`,
        cta: "Source this for me →",
      },
    ],
    farewell: [
      {
        icon: "🌷",
        bg: "linear-gradient(135deg,#1A1A2E,#2D1B4E)",
        name: `${petName}'s Memory Portrait`,
        desc: `A watercolour portrait of ${petName} — painted from your favourite photo`,
        reason: `The most personal tribute Mira can imagine. A piece of ${petName} that stays with you.`,
        cta: "Commission via Concierge →",
      },
      {
        icon: "🌱",
        bg: "linear-gradient(135deg,#1A1A2E,#1B4332)",
        name: `Memorial Tree — ${petName}'s Garden`,
        desc: `A biodegradable urn that grows into a tree — ${petName} becomes part of the earth`,
        reason: `The love doesn't end. It becomes something that grows.`,
        cta: "Source this for me →",
      },
      {
        icon: "📖",
        bg: "linear-gradient(135deg,#2D1B4E,#1A1A2E)",
        name: `${petName}'s Memory Book`,
        desc: `A printed photo book of ${petName}'s life — designed and printed by Concierge`,
        reason: `Every moment with ${petName} deserves to be kept. Mira imagines every page.`,
        cta: "Create via Concierge →",
      },
    ],
  };

  // Default cards for any pillar not listed above
  const defaultCards = [
    {
      icon: "✦",
      bg: `linear-gradient(135deg,#1A0530,#2D1B69)`,
      name: `${breedLabel} Essentials`,
      desc: `Products matched to ${petName}'s breed size, coat type and energy level`,
      reason: `Mira doesn't have scored picks for ${breedLabel}s yet — but she knows what this breed needs.`,
      cta: "Ask Concierge →",
    },
    {
      icon: "🐾",
      bg: `linear-gradient(135deg,#2D1B69,#4A2C8F)`,
      name: `${petName}'s Personalised Kit`,
      desc: `A curated collection built specifically for ${petName} — sourced by Concierge`,
      reason: `Concierge will source exactly the right products for ${petName}'s breed and profile.`,
      cta: "Ask Concierge →",
    },
    {
      icon: "💜",
      bg: `linear-gradient(135deg,#4A2C8F,#2D1B69)`,
      name: `Mira is Learning ${petName}`,
      desc: `Mira is building her knowledge of ${breedLabel}s — your picks will get better each visit`,
      reason: `Every session helps Mira know ${petName} better. Real picks are coming.`,
      cta: "Complete Soul Profile →",
    },
  ];

  return CARDS[pillar] || defaultCards;
}

// ── Imagine Card ───────────────────────────────────────────────────────
function ImagineCard({ card, petName, index, onConcierge, colour, pet, pillar, token }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [hovered,  setHovered]  = useState(false);
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);

  const handleSource = async (e) => {
    e.stopPropagation();
    if (sending || sent) return;
    // Fire tdc.imagine — tracks every "Source this for me" tap
    tdc.imagine({ name: card.name, service: card.desc, pillar, pet, channel: "mira_imagines_breed" });
    // Call parent handler first (for pillar-specific modals like /celebrate)
    if (onConcierge) onConcierge(card);
    // Direct ticket creation + toast
    setSending(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tdbSession = JSON.parse(localStorage.getItem('tdb_auth_token') ? JSON.stringify({id: localStorage.getItem('tdb_user_id'), email: localStorage.getItem('tdb_user_email')}) : '{}');
        await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({
          parent_id:     user?.id || user?.email || user?.user_id || tdbSession?.id || tdbSession?.email || 'guest',
          pet_id:        pet?.id || 'unknown',
          pillar,
          intent_primary:'mira_imagines_request',
          channel:       `${pillar}_mira_imagines`,
          life_state:    pillar,
          initial_message: { sender:'parent', text:`I'd love "${card.name}" for ${petName}. Mira imagined this — please help source it.` },
        }),
      });
      setSent(true);
    } catch { setSent(true); } // still show success even if offline
    finally { setSending(false); }
  };

  return (
    <div
      style={{
        borderRadius: 16, overflow: "hidden", background: card.bg,
        cursor: "pointer", transition: "transform 0.15s",
        transform: hovered ? "translateY(-4px)" : "none", position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleSource}
    >
      {/* Watercolour image or icon */}
      <div style={{
        height: 140,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {imageUrl
          ? <img src={imageUrl} alt={card.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}/>
          : <span style={{ fontSize: 48, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}>
              {card.icon}
            </span>
        }

        {/* Mira Imagines badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(8px)",
          borderRadius: 20,
          padding: "3px 10px",
          fontSize: 9, fontWeight: 700, color: "#fff",
          letterSpacing: "0.06em",
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          ✦ Mira Imagines
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: "#fff",
          marginBottom: 6, lineHeight: 1.3,
        }}>
          {card.name}
        </div>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.65)",
          lineHeight: 1.5, marginBottom: 10,
        }}>
          {card.desc}
        </div>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.85)",
          fontStyle: "italic", lineHeight: 1.4, marginBottom: 14,
          borderLeft: "2px solid rgba(255,255,255,0.25)",
          paddingLeft: 8,
        }}>
          {card.reason}
        </div>
        <button
          onClick={handleSource}
          disabled={sending || sent}
          style={{
            width: "100%",
            background: sent ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.30)",
            borderRadius: 20,
            padding: "8px",
            fontSize: 12, fontWeight: 700, color: "#fff",
            cursor: sent ? "default" : "pointer",
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sent ? "✓ Sent to Concierge!" : sending ? "Sending…" : card.cta}
        </button>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────
export default function MiraImaginesBreed({
  pet,
  pillar = "shop",
  onConcierge,
  colour = "#9B59B6",
}) {
  const petName    = pet?.name || "your dog";
  const rawBreed   = (pet?.breed || pet?.doggy_soul_answers?.breed || "").toLowerCase().trim();
  const breedKey   = Object.keys(BREED_TRAITS).find(k =>
    rawBreed.includes(k) || k.includes(rawBreed.split(" ")[0])
  );
  const traits     = BREED_TRAITS[breedKey] || null;
  const breedDisplay = (pet?.breed || "").split("(")[0].trim();
  const isKnown    = !!traits;
  const { token }  = useAuth();

  const cards = generateImagineCards(petName, breedDisplay, traits, pillar);

  // Fire background scoring so next visit has real picks
  useEffect(() => {
    if (!pet?.id) return;
    if (!pet?.overall_score || pet.overall_score <= 0) { fetch(`${API_URL}/api/mira/score-for-pet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pet_id: pet.id, pillar }),
    }).catch(() => {}); } // silent — this is background work
  }, [pet?.id, pillar]);

  const handleConcierge = (card) => {
    onConcierge?.({
      ...card,
      pet_name: petName,
      breed: breedDisplay,
      pillar,
      intent: "mira_imagines_request",
      message: `Mira imagined "${card.name}" for ${petName} (${breedDisplay}). Please source or arrange this.`,
    });
  };

  return (
    <div style={{ marginBottom: 32 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: MIRA_ORB,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#fff", flexShrink: 0,
          }}>✦</div>
          <div>
            <div style={{
              fontSize: "clamp(1rem,2.5vw,1.25rem)",
              fontWeight: 800, color: "#1A1A2E",
              fontFamily: "Georgia, serif",
            }}>
              Mira Imagines for <span style={{ color: colour }}>{petName}</span>
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              {isKnown
                ? `Mira knows ${breedDisplay}s. She's imagining what ${petName} needs while she scores your picks.`
                : `Mira hasn't met many ${breedDisplay || "dogs of this breed"} yet — but she's already thinking about ${petName}.`
              }
            </div>
          </div>
        </div>

        {/* Breed trait chips — shown if breed is known */}
        {isKnown && traits && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {traits.traits.map(t => (
              <span key={t} style={{
                background: `${colour}18`,
                border: `1px solid ${colour}40`,
                borderRadius: 20, padding: "3px 10px",
                fontSize: 10, fontWeight: 600,
                color: colour,
              }}>
                {t}
              </span>
            ))}
            <span style={{
              background: "#f0f0f0", borderRadius: 20,
              padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#666",
            }}>
              {traits.coat} coat
            </span>
            <span style={{
              background: "#f0f0f0", borderRadius: 20,
              padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#666",
            }}>
              {traits.energy} energy
            </span>
          </div>
        )}
      </div>

      {/* Imagine cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(min(240px,100%),1fr))",
        gap: 16,
        marginBottom: 20,
      }}>
        {cards.map((card, i) => (
          <ImagineCard
            key={i}
            card={card}
            petName={petName}
            index={i}
            onConcierge={handleConcierge}
            colour={colour}
            pet={pet}
            pillar={pillar}
            token={token}
          />
        ))}
      </div>

      {/* Mira learning note */}
      <div style={{
        background: `linear-gradient(135deg,#1A0530,#2D1B69)`,
        borderRadius: 12, padding: "14px 18px",
        display: "flex", gap: 12, alignItems: "center",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: MIRA_ORB,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#fff", flexShrink: 0,
        }}>✦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
            Mira is learning {petName}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", lineHeight: 1.5 }}>
            Complete {petName}'s Soul Profile to get real scored picks.
            {isKnown
              ? ` Mira already knows ${breedDisplay} traits — your profile adds the personal layer.`
              : ` Every answer helps Mira understand ${petName} better.`
            }
          </div>
        </div>
        <button
          onClick={() => {
            // Navigate to Pet Home to complete soul profile
            if (typeof window !== "undefined") window.location.href = "/pet-home";
          }}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 20, padding: "8px 16px",
            fontSize: 11, fontWeight: 700, color: "#fff",
            cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          Complete Profile →
        </button>
      </div>
    </div>
  );
}
