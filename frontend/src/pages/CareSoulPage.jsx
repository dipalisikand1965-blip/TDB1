/**
 * CareSoulPage.jsx
 * The Doggy Company — /care page
 *
 * HOW TO USE:
 * 1. Drop into pages/CareSoulPage.jsx
 * 2. Add route: <Route path="/care" element={<CareSoulPage/>}/>
 * 3. Replace MOCK_PET with real pet from context/auth
 * 4. Replace MOCK_DIMS product data with live API calls
 * 5. Wire Add/Book buttons to real cart/Concierge intake
 *
 * COLOUR WORLD: Sage green — distinct from
 *   /celebrate (deep purple) and /dine (amber/terracotta)
 * TEMPLATE: Mirrors /dine architecture exactly
 * DATA SPINE: WellnessProfile — everything flows from it
 */

import { useState, useEffect, useCallback } from "react";
import GuidedCarePaths from "./GuidedCarePaths";
import { usePillarContext } from "../context/PillarContext";
import { API_URL } from "../utils/api";

// ─────────────────────────────────────────────────────────────
// COLOUR SYSTEM — Sage Green
// ─────────────────────────────────────────────────────────────
const G = {
  // Hero / dark surfaces
  deep:        "#1B4332",
  deepMid:     "#2D6A4F",
  sage:        "#40916C",
  // Light surfaces
  light:       "#74C69D",
  pale:        "#D8F3DC",
  cream:       "#F0FFF4",
  // Page background
  pageBg:      "#F0FFF4",
  // Cards
  card:        "#FFFFFF",
  cardBg:      "#F7FFF9",
  border:      "rgba(45,106,79,0.18)",
  borderLight: "rgba(45,106,79,0.10)",
  // Text
  darkText:    "#1B4332",
  mutedText:   "#52796F",
  hintText:    "#84A98C",
  whiteText:   "#FFFFFF",
  whiteDim:    "rgba(255,255,255,0.65)",
  whiteFaint:  "rgba(255,255,255,0.12)",
  // Accent
  accent:      "#2D6A4F",
  accentLight: "rgba(45,106,79,0.12)",
  accentBorder:"rgba(45,106,79,0.35)",
  // Green variants
  greenBg:     "rgba(64,145,108,0.12)",
  greenBorder: "rgba(64,145,108,0.30)",
};

// ─────────────────────────────────────────────────────────────
// MOCK DATA — replace with real API calls
// ─────────────────────────────────────────────────────────────

/**
 * MOCK_PET — mirrors real pet schema from Soul Builder.
 * WellnessProfile fields come from Soul Builder chapters 3, 5, 8.
 *
 * coatType        → Ch3 Q3.2  "What type of coat does {pet} have?"
 * groomingFreq    → Ch3 Q3.3  "How often is {pet} groomed?"
 * skinSensitive   → Ch3 Q3.4  "Any known skin sensitivities?"
 * groomingComfort → Ch5 Q5.4  "How does {pet} feel about being handled?"
 * dentalHealth    → Ch8 Q8.4  "How is {pet}'s dental health?"
 * anxietyTriggers → Ch5 Q5.5  "What makes {pet} anxious?"
 * lastVetVisit    → Ch8 Q8.1  "When was {pet}'s last vet visit?"
 * vaccinated      → Ch8 Q8.2  "Are vaccinations up to date?"
 */
const MOCK_PET = {
  name:            "Mystique",
  breed:           "Shih Tzu",
  age:             6,
  soulPercent:     94,
  avatar:          "🐕",
  avatarUrl:       null,          // ← set to photo URL from storage

  // WellnessProfile fields
  coatType:        "Long silky",  // Q3.2
  groomingFreq:    "Monthly",     // Q3.3
  skinSensitive:   null,          // Q3.4 — null = none known
  groomingComfort: "Comfortable", // Q5.4
  dentalHealth:    "Good",        // Q8.4
  anxietyTriggers: ["Loud noises"], // Q5.5
  lastVetVisit:    "3 months ago",  // Q8.1
  vaccinated:      true,            // Q8.2
  healthCondition: null,            // Q8.3
  city:            "Mumbai",
};

// WellnessProfile questions (Soul Builder Chapter 3 & 8)
const WELLNESS_QUESTIONS = [
  {
    id: "q3_2",
    chapter: "Chapter 3 · Body",
    question: "What type of coat does {petName} have?",
    pts: 3,
    type: "single",
    options: ["Short & smooth", "Long silky", "Wiry & rough", "Curly & dense", "Double coat", "Fluffy & thick"],
  },
  {
    id: "q3_4",
    chapter: "Chapter 3 · Body",
    question: "Any known skin sensitivities for {petName}?",
    pts: 4,
    type: "multi",
    options: ["Dry skin", "Allergic reactions", "Hot spots", "Sensitive paws", "None known"],
  },
  {
    id: "q5_4",
    chapter: "Chapter 5 · Personality",
    question: "How does {petName} feel about being groomed?",
    pts: 3,
    type: "single",
    options: ["Loves it", "Comfortable", "Tolerates it", "Anxious", "Very resistant"],
  },
  {
    id: "q8_4",
    chapter: "Chapter 8 · Long Horizon",
    question: "How is {petName}'s dental health?",
    pts: 3,
    type: "single",
    options: ["Excellent", "Good", "Needs attention", "Has dental issues", "Not sure"],
  },
];

// Mira Imagines care products (shown in WellnessProfile drawer)
const MIRA_IMAGINES_CARE = [
  {
    id: "mi-c1",
    badge: "✦ Coat match",
    icon: "🛁",
    bg: "linear-gradient(135deg,#2D6A4F,#1B4332)",
    name: "Silk & Shine Shampoo",
    desc: "Formulated for {petName}'s long silky coat",
    reason: "Mira matched this to {petName}'s coat type",
    cta: "Add to care kit →",
  },
  {
    id: "mi-c2",
    badge: "✦ Dental pick",
    icon: "🦷",
    bg: "linear-gradient(135deg,#40916C,#2D6A4F)",
    name: "Enzymatic Dental Gel",
    desc: "Daily dental care for {petName}'s good dental health",
    reason: "Mira wants {petName}'s smile to stay beautiful",
    cta: "Add to care kit →",
  },
];

// ─────────────────────────────────────────────────────────────
// MOCK DIMENSIONS
// Replace tabs/products with real Shopify/API data
// ─────────────────────────────────────────────────────────────
const MOCK_DIMS = [
  {
    id: "grooming",
    icon: "✂️",
    label: "Grooming",
    sub: "Coat, bath & salon",
    badge: "Mira's top pick",
    badgeBg: G.sage,
    glowColor: "rgba(64,145,108,0.25)",
    tabs: ["Shampoo & Conditioner", "Brushes & Combs", "At-Home Kits", "Salon Services", "Ear & Eye Care"],
    products: {
      "Shampoo & Conditioner": [
        { id:"GR-001", icon:"🧴", bg:"#E8F5E9", tag:"Coat match", name:"Silk & Shine Shampoo", desc:"Long silky coat formula, pH balanced", price:"₹549" },
        { id:"GR-002", icon:"💧", bg:"#E8F5E9", tag:"Moisturising", name:"Oatmeal Conditioner", desc:"Detangles and softens, no parabens", price:"₹499" },
        { id:"GR-003", icon:"🌿", bg:"#E8F5E9", tag:"Sensitive skin", name:"Aloe & Neem Shampoo", desc:"Gentle, anti-itch, skin-soothing", price:"₹449" },
      ],
      "Brushes & Combs": [
        { id:"GR-004", icon:"🪮", bg:"#F1F8E9", tag:"Coat match", name:"Slicker Brush — Long Coat", desc:"Prevents matting, gentle pins", price:"₹399" },
        { id:"GR-005", icon:"🪮", bg:"#F1F8E9", tag:"Detangling", name:"Wide-Tooth Stainless Comb", desc:"For silky coats, rust-proof", price:"₹299" },
        { id:"GR-006", icon:"✂️", bg:"#F1F8E9", tag:"Finishing", name:"Finishing Brush", desc:"Adds shine, removes fine debris", price:"₹349" },
      ],
      "At-Home Kits": [
        { id:"GR-007", icon:"🧰", bg:"#E8F5E9", tag:"Complete kit", name:"Home Grooming Starter Kit", desc:"Brush, comb, shampoo, conditioner", price:"₹1,299" },
        { id:"GR-008", icon:"🛁", bg:"#E8F5E9", tag:"Bath essential", name:"Non-Slip Bath Mat", desc:"Reduces grooming anxiety", price:"₹399" },
        { id:"GR-008b", icon:"🪥", bg:"#E8F5E9", tag:"Nail care", name:"Nail Grinder — Quiet Motor", desc:"Low vibration, USB rechargeable, anxiety-friendly", price:"₹799" },
      ],
      "Salon Services": [
        { id:"GR-009", icon:"💇", bg:"#F3E5F5", tag:"Concierge arranged", name:"Full Grooming Session", desc:"Bath, cut, nail trim, ear cleaning", price:"₹1,499" },
        { id:"GR-010", icon:"🏠", bg:"#F3E5F5", tag:"Home visit", name:"Mobile Groomer Visit", desc:"Groomer comes to you", price:"₹1,200" },
        { id:"GR-011", icon:"✨", bg:"#F3E5F5", tag:"Pamper day", name:"Luxury Spa Session", desc:"Full spa with massage and aromatherapy", price:"₹2,499" },
      ],
      "Ear & Eye Care": [
        { id:"GR-012", icon:"👂", bg:"#E8F5E9", tag:"Ear care", name:"Ear Cleaning Solution — 120ml", desc:"Removes wax and debris, vet-recommended", price:"₹449" },
        { id:"GR-013", icon:"👁️", bg:"#E8F5E9", tag:"Eye care", name:"Tear Stain Remover", desc:"Safe around eyes, pH balanced — for Shih Tzus, Maltese", price:"₹299" },
      ],
    },
  },
  {
    id: "dental",
    icon: "🦷",
    label: "Dental & Paw",
    sub: "Oral care & paw health",
    badge: null,
    badgeBg: "#00695C",
    glowColor: "rgba(0,105,92,0.22)",
    tabs: ["Dental Care", "Paw Care", "Nail Care"],
    products: {
      "Dental Care": [
        { id:"DP-001", icon:"🦷", bg:"#E0F2F1", tag:"Daily essential", name:"Enzymatic Dental Gel", desc:"Removes plaque, freshens breath", price:"₹449" },
        { id:"DP-002", icon:"🪥", bg:"#E0F2F1", tag:"Starter kit", name:"Dental Kit — Brush + Gel", desc:"Finger brush + enzymatic toothpaste", price:"₹599" },
        { id:"DP-002b", icon:"💧", bg:"#E0F2F1", tag:"No-brush care", name:"Water Additive — Dental", desc:"Tasteless, passive plaque control in water bowl", price:"₹349" },
        { id:"DP-003", icon:"🦴", bg:"#E0F2F1", tag:"Daily chew", name:"Dental Chews — Salmon", desc:"Soy-free, supports gum health", price:"₹349" },
      ],
      "Paw Care": [
        { id:"DP-004", icon:"🐾", bg:"#F1F8E9", tag:"Paw balm", name:"Organic Paw Butter", desc:"Shea butter, coconut oil, vitamin E", price:"₹349" },
        { id:"DP-005", icon:"🧤", bg:"#F1F8E9", tag:"Protective", name:"Paw Wax Protector", desc:"Weather and surface protection", price:"₹299" },
      ],
      "Nail Care": [
        { id:"DP-006", icon:"✂️", bg:"#FFF3E0", tag:"Precision cut", name:"Safety Nail Clipper Set", desc:"Spring-loaded, sensor guard", price:"₹499" },
        { id:"DP-007", icon:"📋", bg:"#E8F5E9", tag:"Free from Mira", name:"At-Home Nail Care Guide", desc:"Step-by-step for anxious dogs", price:"Free" },
      ],
    },
  },
  {
    id: "coat",
    icon: "🌿",
    label: "Coat & Skin",
    sub: "Health from inside out",
    badge: null,
    badgeBg: "#388E3C",
    glowColor: "rgba(56,142,60,0.22)",
    tabs: ["Skin Supplements", "Coat Oils", "Topical Care"],
    products: {
      "Skin Supplements": [
        { id:"CS-001", icon:"🐟", bg:"#E8F5E9", tag:"Coat shine", name:"Salmon Oil — Omega 3 & 6", desc:"Cold-pressed, coat + skin health", price:"₹699" },
        { id:"CS-002", icon:"🌻", bg:"#E8F5E9", tag:"Anti-itch", name:"Evening Primrose Oil", desc:"GLA-rich, reduces skin inflammation", price:"₹549" },
        { id:"CS-003", icon:"🧪", bg:"#E8F5E9", tag:"Biotin boost", name:"Biotin & Zinc Supplement", desc:"Strengthens coat and reduces shedding", price:"₹449" },
      ],
      "Coat Oils": [
        { id:"CS-004", icon:"🥥", bg:"#FFF8E1", tag:"Antifungal", name:"Coconut Oil", desc:"Topical and edible, antibacterial", price:"₹349" },
        { id:"CS-005", icon:"🌿", bg:"#FFF8E1", tag:"Detangling", name:"Argan Coat Serum", desc:"Shine and manageability for long coats", price:"₹499" },
      ],
      "Topical Care": [
        { id:"CS-006", icon:"🧴", bg:"#E3F2FD", tag:"Hot spots", name:"Calendula Soothing Spray", desc:"Natural antiseptic, anti-itch", price:"₹399" },
        { id:"CS-007", icon:"🩹", bg:"#E3F2FD", tag:"Wound care", name:"Pet-Safe Antiseptic Gel", desc:"Minor cuts and irritations", price:"₹299" },
        { id:"CS-008", icon:"💦", bg:"#E3F2FD", tag:"Daily use", name:"Leave-In Conditioner Spray", desc:"Detangles and adds shine between baths", price:"₹349" },
        { id:"CS-009", icon:"🌀", bg:"#E3F2FD", tag:"Shedding control", name:"Deshedding Supplement", desc:"Omega-3, biotin, vitamin E — reduces shedding in 4–6 weeks", price:"₹549" },
      ],
    },
  },
  {
    id: "wellness",
    icon: "🏥",
    label: "Wellness Visits",
    sub: "Vet discovery & booking",
    badge: null,
    badgeBg: "#1565C0",
    glowColor: "rgba(21,101,192,0.20)",
    tabs: ["Vet Discovery", "Vaccination", "Health Certificates"],
    products: {
      "Vet Discovery": [
        { id:"WV-001", icon:"🔍", bg:"#E3F2FD", tag:"Concierge finds", name:"Vet Discovery Service", desc:"We find trusted vets near you", price:"Free" },
        { id:"WV-002", icon:"🏠", bg:"#E3F2FD", tag:"Home visit", name:"Vet Home Visit Coordination", desc:"Vet comes to you — less stress", price:"₹1,200" },
        { id:"WV-003", icon:"💻", bg:"#E3F2FD", tag:"Video consult", name:"Online Vet Consultation", desc:"Expert advice from home", price:"₹600" },
      ],
      "Vaccination": [
        { id:"WV-004", icon:"💉", bg:"#E8F5E9", tag:"Core vaccines", name:"Core Vaccination Package", desc:"Rabies, DHPPi — coordinated by us", price:"₹1,299" },
        { id:"WV-005", icon:"📋", bg:"#E8F5E9", tag:"Free record", name:"Vaccination Record Book", desc:"Digital + physical, always ready", price:"Free" },
      ],
      "Health Certificates": [
        { id:"WV-006", icon:"📄", bg:"#FFF3E0", tag:"Travel ready", name:"Health Certificate Service", desc:"For travel, boarding, or official use", price:"₹500" },
        { id:"WV-007", icon:"📱", bg:"#E8F5E9", tag:"Free from Mira", name:"Digital Health Record Wallet", desc:"All records in one place, shareable via QR code", price:"Free" },
      ],
    },
  },
  {
    id: "senior",
    icon: "🌸",
    label: "Senior Care",
    sub: "Comfort & mobility",
    badge: null,
    badgeBg: "#AD1457",
    glowColor: "rgba(173,20,87,0.18)",
    tabs: ["Mobility Aids", "Comfort Products", "Senior Supplements"],
    products: {
      "Mobility Aids": [
        { id:"SC-001", icon:"🛏️", bg:"#FCE4EC", tag:"Joint relief", name:"Orthopaedic Memory Foam Bed", desc:"Pressure-relieving, senior-grade foam", price:"₹2,499" },
        { id:"SC-002", icon:"🪜", bg:"#FCE4EC", tag:"Joint-friendly", name:"Pet Ramp — Foldable", desc:"Reduces joint strain on stairs", price:"₹1,499" },
        { id:"SC-003", icon:"🦽", bg:"#FCE4EC", tag:"Mobility support", name:"Rear Support Harness", desc:"Assists dogs with hip issues", price:"₹899" },
      ],
      "Comfort Products": [
        { id:"SC-004", icon:"🌡️", bg:"#FFF8E1", tag:"Warming", name:"Self-Warming Blanket", desc:"Reflects body heat, no electricity", price:"₹799" },
        { id:"SC-005", icon:"🍼", bg:"#FFF8E1", tag:"Dental-friendly", name:"Raised Feeding Station", desc:"Reduces neck strain for seniors", price:"₹699" },
      ],
      "Senior Supplements": [
        { id:"SC-006", icon:"🦴", bg:"#E8F5E9", tag:"Joint support", name:"Glucosamine & Chondroitin", desc:"Cartilage and mobility support", price:"₹799" },
        { id:"SC-007", icon:"🐟", bg:"#E8F5E9", tag:"Brain health", name:"Omega 3 Senior Formula", desc:"Cognitive support for senior dogs", price:"₹699" },
        { id:"SC-008", icon:"🌿", bg:"#E8F5E9", tag:"Anti-inflammatory", name:"Turmeric & Black Pepper", desc:"Natural joint and inflammation support", price:"₹549" },
      ],
    },
  },
  {
    id: "supplements",
    icon: "💊",
    label: "Supplements",
    sub: "Filtered for Mystique",
    badge: null,
    badgeBg: "#6A1B9A",
    glowColor: "rgba(106,27,154,0.18)",
    tabs: ["Immunity", "Digestive", "Coat & Skin", "Joint & Mobility", "Calming", "Energy & Vitality"],
    products: {
      "Immunity": [
        { id:"SU-001", icon:"🛡️", bg:"#F3E5F5", tag:"Daily immune", name:"Canine Immunity Booster", desc:"Antioxidants, vitamin C and E complex", price:"₹899" },
        { id:"SU-002", icon:"🍄", bg:"#F3E5F5", tag:"Functional mushroom", name:"Reishi & Turkey Tail", desc:"Adaptogen blend for immunity", price:"₹1,099" },
      ],
      "Digestive": [
        { id:"SU-003", icon:"🌱", bg:"#E8F5E9", tag:"Daily gut", name:"Probiotic Powder", desc:"10 billion CFU, daily gut health", price:"₹549" },
        { id:"SU-004", icon:"🔬", bg:"#E8F5E9", tag:"Absorption", name:"Digestive Enzyme Blend", desc:"Supports nutrient absorption", price:"₹699" },
        { id:"SU-004b", icon:"🍃", bg:"#E8F5E9", tag:"Gut soother", name:"Slippery Elm Gut Soother", desc:"Coats and soothes inflamed gut lining", price:"₹449" },
        { id:"SU-004c", icon:"🥛", bg:"#E8F5E9", tag:"Recovery support", name:"Colostrum Supplement", desc:"Immune and gut barrier support post-surgery or illness", price:"₹799" },
      ],
      "Coat & Skin": [
        { id:"SU-005", icon:"🐟", bg:"#E3F2FD", tag:"Shine", name:"Salmon Oil — Omega 3 & 6", desc:"Cold-pressed, anti-inflammatory", price:"₹699" },
        { id:"SU-006", icon:"🌻", bg:"#E3F2FD", tag:"Anti-itch", name:"Evening Primrose Oil", desc:"GLA-rich, skin and coat", price:"₹549" },
      ],
      "Joint & Mobility": [
        { id:"SU-007", icon:"🦴", bg:"#FFF8E1", tag:"Joint support", name:"Glucosamine & Chondroitin", desc:"Salmon-flavoured chewable", price:"₹799" },
        { id:"SU-008", icon:"🐚", bg:"#FFF8E1", tag:"Premium joint", name:"Green-Lipped Mussel Powder", desc:"Natural omega-3 + joint nutrients", price:"₹999" },
        { id:"SU-008b", icon:"💆", bg:"#FFF8E1", tag:"Topical relief", name:"Joint Massage Balm", desc:"Arnica, camphor, peppermint — apply around joints", price:"₹399" },
      ],
      "Calming": [
        { id:"SU-009", icon:"😌", bg:"#FCE4EC", tag:"Natural calming", name:"Zylkene — Milk Protein", desc:"Non-sedating, alpha-casozepine — safe long-term", price:"₹799" },
        { id:"SU-010", icon:"🍵", bg:"#FCE4EC", tag:"Calming", name:"L-Theanine Calming Supplement", desc:"From green tea — promotes calm without drowsiness", price:"₹549" },
      ],
      "Energy & Vitality": [
        { id:"SU-011", icon:"⚡", bg:"#FFF3E0", tag:"Energy support", name:"Vitamin B Complex", desc:"B1–B12 complex, energy and nervous system support", price:"₹649" },
        { id:"SU-012", icon:"🌟", bg:"#FFF3E0", tag:"Complete support", name:"Senior Multivitamin", desc:"Comprehensive multivitamin for dogs 7+ — soft chew", price:"₹699" },
      ],
    },
  },
  {
    id: "soul",
    icon: "✨",
    label: "Soul Care Products",
    sub: "Made for Mystique",
    badge: "Soul Made",
    badgeBg: G.deepMid,
    glowColor: "rgba(45,106,79,0.30)",
    tabs: ["Breed Collection", "Personalised", "Care Essentials"],
    products: {
      "Breed Collection": [
        { id:"SP-001", icon:"🛁", bg:"#E8F5E9", tag:"Shih Tzu", name:"Mystique's Bath Towel", desc:"Absorbent, quick-dry, breed-sized", price:"₹699" },
        { id:"SP-002", icon:"👘", bg:"#E8F5E9", tag:"Shih Tzu", name:"Mystique's Drying Robe", desc:"Post-bath comfort, fleece-lined", price:"₹899" },
        { id:"SP-003", icon:"🛋️", bg:"#E8F5E9", tag:"Shih Tzu", name:"Mystique's Cozy Blanket", desc:"Designed for closeness and comfort", price:"₹999" },
      ],
      "Personalised": [
        { id:"SP-004", icon:"🏷️", bg:"#F3E5F5", tag:"Engraved", name:"Mystique's ID Tag", desc:"Bone-shaped, engraved name + number", price:"₹349" },
        { id:"SP-005", icon:"🧴", bg:"#F3E5F5", tag:"Named bottle", name:"Mystique's Shampoo Set", desc:"Custom-labelled, coat-matched formula", price:"₹749" },
      ],
      "Care Essentials": [
        { id:"SP-006", icon:"🧰", bg:"#FFF3E0", tag:"Complete kit", name:"Mystique's Grooming Apron", desc:"For the groomer who comes to you", price:"₹599" },
        { id:"SP-007", icon:"📁", bg:"#FFF3E0", tag:"Record keeping", name:"Mystique's Health File", desc:"All records, vaccinations, vet notes", price:"₹299" },
        { id:"SP-008", icon:"🩺", bg:"#FFF3E0", tag:"Safety essential", name:"Pet First Aid Kit", desc:"Antiseptic, bandage, tick remover, styptic powder, guide", price:"₹899" },
        { id:"SP-009", icon:"🖼️", bg:"#FFF3E0", tag:"Bespoke art", name:"Custom Breed Portrait Print — A4", desc:"Hand-style watercolour portrait, 300gsm card stock, A4", price:"₹999" },
      ],
    },
  },
  {
    id: "mira",
    icon: "🪄",
    label: "Mira's Care Picks",
    sub: "Curated for Mystique",
    badge: "✦ Mira Pick",
    badgeBg: "linear-gradient(135deg,#2D6A4F,#40916C)",
    glowColor: "rgba(45,106,79,0.35)",
    tabs: ["Mira's Top 5", "Mira Imagines", "Seasonal"],
    products: {
      "Mira's Top 5": [
        { id:"MP-001", icon:"🥇", bg:"#E8F5E9", tag:"✦ #1 pick", name:"Silk & Shine Shampoo", desc:"Coat-matched, pH balanced, bestseller", price:"₹549", mira:true },
        { id:"MP-002", icon:"🥈", bg:"#E8F5E9", tag:"✦ #2 pick", name:"Enzymatic Dental Gel", desc:"Daily dental — Mira says this is non-negotiable", price:"₹449", mira:true },
        { id:"MP-003", icon:"🥉", bg:"#E8F5E9", tag:"✦ #3 pick", name:"Salmon Oil Omega 3", desc:"Coat, skin, and brain — one bottle", price:"₹699", mira:true },
        { id:"MP-004", icon:"✦", bg:"#E8F5E9", tag:"✦ #4 pick", name:"Probiotic Powder", desc:"Gut health underpins everything else", price:"₹549", mira:true },
        { id:"MP-005", icon:"✦", bg:"#E8F5E9", tag:"✦ #5 pick", name:"Slicker Brush — Long Coat", desc:"For Mystique's silky coat specifically", price:"₹399", mira:true },
      ],
      "Mira Imagines": [
        { id:"MP-006", icon:"🛁", bg:"#1B4332", tag:"Mira Imagines", name:"Custom Spa Kit for Shih Tzus", desc:"A full spa box built for Mystique's coat type — not yet in catalogue", price:"Request a Quote", mira:true, imagines:true },
        { id:"MP-007", icon:"🦷", bg:"#1B4332", tag:"Mira Imagines", name:"Dental + Coat Monthly Bundle", desc:"Everything for Mystique's two biggest care needs, delivered monthly", price:"Request a Quote", mira:true, imagines:true },
      ],
      "Seasonal": [
        { id:"MP-008", icon:"☀️", bg:"#FFF8E1", tag:"Summer care", name:"Cooling Paw Wax", desc:"Protects paws from hot surfaces", price:"₹299" },
        { id:"MP-009", icon:"🌧️", bg:"#E3F2FD", tag:"Monsoon care", name:"Anti-Fungal Ear Drops", desc:"Prevents moisture-related ear infections", price:"₹349" },
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────────
// WELLNESS PROFILE DRAWER
// ─────────────────────────────────────────────────────────────
function WellnessProfileDrawer({ pet, onClose }) {
  const [answers, setAnswers] = useState({});
  const [saved, setSaved]     = useState({});

  const answered  = Object.keys(answers).filter(k => (answers[k]||[]).length > 0).length;
  const remaining = WELLNESS_QUESTIONS.length - Object.keys(saved).length;
  const wellnessPct = Math.round((Object.keys(saved).length / WELLNESS_QUESTIONS.length) * 100);

  const toggle = (qId, val, single) => {
    setAnswers(prev => {
      const cur = prev[qId] || [];
      if (single) return { ...prev, [qId]: cur[0] === val ? [] : [val] };
      return { ...prev, [qId]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
    });
  };

  const save = (qId) => {
    if ((answers[qId]||[]).length === 0) return;
    setSaved(prev => ({ ...prev, [qId]: true }));
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div onClick={e => e.stopPropagation()} style={{ width:"min(780px,100%)", maxHeight:"90vh", background:"#0A1F12", zIndex:201, overflowY:"auto", borderRadius:20, boxShadow:"0 32px 80px rgba(0,0,0,0.60)", display:"flex", flexDirection:"column" }}>

          {/* Header */}
          <div style={{ padding:"18px 24px 16px", borderBottom:`1px solid ${G.greenBorder}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16, color:G.light }}>✦</span>
                <span style={{ fontSize:17, fontWeight:800, color:"#FFFFFF", fontFamily:"Georgia,serif" }}>Mira's Wellness Picks</span>
              </div>
              <div style={{ fontSize:12, color:G.whiteDim, marginTop:2, marginLeft:24 }}>For <span style={{ color:G.light, fontWeight:700 }}>{pet.name}</span></div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"rgba(255,255,255,0.35)", cursor:"pointer", lineHeight:1, padding:"0 4px" }}>✕</button>
          </div>

          {/* Soul score */}
          <div style={{ margin:"16px 24px", background:`linear-gradient(135deg,${G.deep},${G.deepMid})`, borderRadius:16, padding:"18px 22px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:G.light, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>✦ Grow {pet.name}'s Wellness Profile</div>
              <div style={{ fontSize:13, color:G.whiteDim }}>Answer quick questions · {remaining > 0 ? `${remaining} remaining` : "All done!"}</div>
              <div style={{ marginTop:10, width:180, height:4, background:"rgba(255,255,255,0.15)", borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.max(wellnessPct, 8)}%`, background:`linear-gradient(90deg,${G.light},#74C69D)`, borderRadius:4, transition:"width 0.4s" }} />
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <span style={{ fontSize:48, fontWeight:900, color:G.light, lineHeight:1 }}>{pet.soulPercent}</span>
              <span style={{ fontSize:16, color:G.light, fontWeight:700 }}>%</span>
            </div>
          </div>

          {/* Questions */}
          <div style={{ padding:"0 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {WELLNESS_QUESTIONS.map(q => {
              const qAnswers = answers[q.id] || [];
              const isSaved  = saved[q.id];
              const label    = q.question.replace("{petName}", pet.name);
              return (
                <div key={q.id} style={{ background:"#152A1E", borderRadius:16, padding:"16px 16px 14px", border: isSaved ? `1.5px solid ${G.accentBorder}` : "1.5px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ fontSize:11, color:G.light, fontWeight:600 }}>{q.chapter}</span>
                    <span style={{ background:"rgba(116,198,157,0.20)", borderRadius:20, padding:"2px 8px", fontSize:10, color:G.light, fontWeight:700 }}>+{q.pts} pts</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#FFFFFF", marginBottom:12, lineHeight:1.3 }}>{label}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                    {q.options.map(opt => {
                      const selected = qAnswers.includes(opt);
                      return (
                        <button key={opt} onClick={() => toggle(q.id, opt, q.type === "single")} style={{ background: selected ? "rgba(116,198,157,0.25)" : "rgba(255,255,255,0.07)", border:`1px solid ${selected ? G.light : "rgba(255,255,255,0.14)"}`, borderRadius:20, padding:"5px 12px", fontSize:12, color: selected ? "#B7E4C7" : "rgba(255,255,255,0.70)", cursor:"pointer", fontWeight: selected ? 600 : 400, transition:"all 0.12s" }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => save(q.id)} disabled={qAnswers.length === 0} style={{ width:"100%", borderRadius:10, padding:"9px", fontSize:13, fontWeight:700, cursor: qAnswers.length > 0 ? "pointer" : "not-allowed", background: isSaved ? "rgba(116,198,157,0.22)" : qAnswers.length > 0 ? `linear-gradient(135deg,${G.sage},${G.deepMid})` : "rgba(255,255,255,0.07)", color: isSaved ? "#74C69D" : "#fff", border: isSaved ? `1px solid ${G.greenBorder}` : "none", transition:"all 0.15s" }}>
                    {isSaved ? "✓ Saved" : `✓ Save +${q.pts} pts`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Mira Imagines */}
          <div style={{ padding:"0 24px 28px" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#FFFFFF", marginBottom:12 }}>Mira Imagines for {pet.name}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {MIRA_IMAGINES_CARE.map(item => (
                <div key={item.id} style={{ background:item.bg, borderRadius:16, padding:"20px 16px 16px", position:"relative" }}>
                  <div style={{ position:"absolute", top:12, left:12, background:"linear-gradient(135deg,#74C69D,#2D6A4F)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, color:"#fff" }}>{item.badge}</div>
                  <div style={{ fontSize:44, textAlign:"center", marginTop:20, marginBottom:12 }}>{item.icon}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff", textAlign:"center", marginBottom:5 }}>{item.name}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.60)", textAlign:"center", marginBottom:4 }}>{item.desc.replace("{petName}", pet.name)}</div>
                  <div style={{ fontSize:11, color:G.light, fontStyle:"italic", textAlign:"center", marginBottom:14 }}>{item.reason.replace("{petName}", pet.name)}</div>
                  <button style={{ width:"100%", background:`linear-gradient(135deg,${G.sage},${G.deep})`, color:"#fff", border:"none", borderRadius:10, padding:"9px", fontSize:12, fontWeight:700, cursor:"pointer" }}>{item.cta}</button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop:"auto", padding:"14px 24px", borderTop:`1px solid ${G.greenBorder}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:"#0D1F14", flexShrink:0 }}>
            <div style={{ fontSize:13, color:G.whiteDim }}>✦ Everything here is personalised for <strong style={{ color:"#FFFFFF" }}>{pet.name}</strong></div>
            <button style={{ background:`linear-gradient(135deg,${G.sage},${G.deepMid})`, color:"#fff", border:"none", borderRadius:20, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Explore More for {pet.name}</button>
          </div>

        </div>
      </div>
    </>
  );
}

// WellnessProfile compact bar
function WellnessProfile({ pet, onOpen }) {
  return (
    <div onClick={onOpen} style={{ background:"#fff", border:`2px solid ${G.pale}`, borderRadius:16, padding:"12px 18px", marginBottom:24, display:"flex", alignItems:"center", gap:14, cursor:"pointer", transition:"background 0.12s" }} onMouseEnter={e => e.currentTarget.style.background = G.cream} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
      <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🌿</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:G.darkText, marginBottom:5 }}>{pet.name}'s Wellness Profile</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {pet.coatType && <span style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:20, padding:"2px 10px", fontSize:11, color:"#2E7D32", fontWeight:500 }}>🌿 {pet.coatType}</span>}
          {pet.groomingComfort && <span style={{ background:"#E3F2FD", border:"1px solid #90CAF9", borderRadius:20, padding:"2px 10px", fontSize:11, color:"#1565C0", fontWeight:500 }}>✓ {pet.groomingComfort} with grooming</span>}
          {pet.vaccinated && <span style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:20, padding:"2px 10px", fontSize:11, color:"#2E7D32", fontWeight:500 }}>💉 Vaccinated</span>}
          {pet.lastVetVisit && <span style={{ background:"#FFF8E1", border:"1px solid #FFE082", borderRadius:20, padding:"2px 10px", fontSize:11, color:"#F57F17", fontWeight:500 }}>🏥 Vet: {pet.lastVetVisit}</span>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        <span style={{ fontSize:12, color:G.sage, fontWeight:600 }}>See full profile</span>
        <span style={{ fontSize:16, color:G.sage }}>→</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  const [added, setAdded] = useState(false);
  const isFree      = product.price === "Free";
  const isQuote     = product.price === "Request a Quote";
  const isImagines  = product.imagines;

  return (
    <div onClick={onClick} style={{ borderRadius:14, border: product.mira ? `2px solid ${G.light}` : `1px solid ${G.borderLight}`, background: isImagines ? "#1B4332" : "#fff", overflow:"hidden", cursor:"pointer", display:"flex", flexDirection:"column", transition:"transform 0.12s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
      <div style={{ height:110, display:"flex", alignItems:"center", justifyContent:"center", background: product.bg || G.pale, position:"relative", overflow:"hidden" }}>
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize:36 }}>{product.icon}</span>
        }
        <div style={{ position:"absolute", top:8, left:8, background: product.mira ? `linear-gradient(135deg,${G.sage},${G.deepMid})` : `linear-gradient(135deg,rgba(64,145,108,0.90),rgba(45,106,79,0.80))`, borderRadius:6, padding:"2px 7px", fontSize:9, color:"#fff", fontWeight:700 }}>
          {product.mira ? "✦ Mira's pick" : product.tag}
        </div>
      </div>
      <div style={{ padding:"10px 10px 12px", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:12, fontWeight:700, color: isImagines ? "#FFFFFF" : G.darkText, marginBottom:2, lineHeight:1.3 }}>{product.name}</div>
        <div style={{ fontSize:11, color: isImagines ? "rgba(255,255,255,0.55)" : G.mutedText, lineHeight:1.4, marginBottom:"auto" }}>{product.desc}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color: isFree ? "#27AE60" : isQuote ? G.sage : G.darkText }}>
            {isFree ? "Free" : isQuote ? "Request Quote" : `₹${product.price.replace("₹","")}`}
          </span>
          <button onClick={e => { e.stopPropagation(); setAdded(true); }} style={{ background: added ? "#E8F5E9" : `linear-gradient(135deg,${G.sage},${G.deepMid})`, color: added ? "#27AE60" : "#fff", border: added ? "1px solid #B2DFC4" : "none", borderRadius:8, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
            {added ? "✓ Added" : isQuote ? "Request →" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DIM EXPANDED PANEL
// ─────────────────────────────────────────────────────────────
function DimExpanded({ dim, pet, onClose }) {
  const [activeTab, setActiveTab] = useState(dim.tabs[0]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const products  = dim.products[activeTab] || [];
  const totalItems = Object.values(dim.products).reduce((s,a) => s + a.length, 0);

  return (
    <div style={{ background:"#fff", border:`1.5px solid ${G.border}`, borderRadius:"0 0 20px 20px", padding:"20px 20px 24px", marginTop:-2 }}>

      {/* Mira bar */}
      <div style={{ background:G.greenBg, border:`1px solid ${G.greenBorder}`, borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${G.sage},${G.deepMid})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>✦</div>
        <div style={{ fontSize:13, color:G.darkText, fontStyle:"italic", flex:1 }}>
          "Everything here is filtered for <span style={{ color:G.sage, fontWeight:700 }}>{pet.name}</span>'s coat type, sensitivities, and grooming comfort."
        </div>
        <div style={{ fontSize:11, color:G.sage, fontWeight:600 }}>♥ Mira knows {pet.name}</div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {dim.tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding:"6px 16px", borderRadius:20, border:`1.5px solid ${activeTab === tab ? G.sage : G.border}`, background: activeTab === tab ? G.greenBg : "#fff", color: activeTab === tab ? G.sage : G.mutedText, fontSize:12, fontWeight: activeTab === tab ? 700 : 400, cursor:"pointer", transition:"all 0.12s" }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Products */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        {products.map(p => (
          <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${G.borderLight}`, paddingTop:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:12, color:G.hintText, fontStyle:"italic" }}>
          {products.length} items · filtered for {pet.name}
          {pet.coatType ? ` · ${pet.coatType} coat` : ""}
        </div>
        <button style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:20, padding:"5px 14px", fontSize:11, fontWeight:600, color:G.sage, cursor:"pointer" }}>Explore More →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// CARE SERVICES — 8 services, each with full booking flow
// Mirrors Aditya's existing grooming 5-step architecture
// ─────────────────────────────────────────────────────────────
const CARE_SERVICES = [
  {
    id: "grooming",
    icon: "✂️",
    illustrationUrl: null,       // ← "/assets/watercolour/grooming.png"
    illustrationBg: `linear-gradient(135deg,${G.pale},${G.light})`,
    free: false,
    name: "Grooming",
    tagline: "Hygiene, coat care, bath, nail trim",
    desc: "We find the right groomer for {petName}'s coat type, book, and follow up.",
    accentColor: "#C2185B",
    steps: 5,
  },
  {
    id: "vet",
    icon: "🏥",
    illustrationUrl: null,       // ← "/assets/watercolour/vet-visit.png"
    illustrationBg: "linear-gradient(135deg,#E3F2FD,#BBDEFB)",
    free: false,
    name: "Vet Visits",
    tagline: "Clinic discovery, booking & follow-up",
    desc: "Trusted vets near you — clinic or home visit. Bookings confirmed, records collected.",
    accentColor: "#1565C0",
    steps: 4,
  },
  {
    id: "boarding",
    icon: "🏡",
    illustrationUrl: null,       // ← "/assets/watercolour/boarding.png"
    illustrationBg: "linear-gradient(135deg,#E8F5E9,#C8E6C9)",
    free: false,
    name: "Boarding & Daycare",
    tagline: "Overnight boarding & daytime supervision",
    desc: "We find the right boarding for {petName} — vetted, reviewed, and booked by your Concierge.",
    accentColor: "#2D6A4F",
    steps: 4,
  },
  {
    id: "sitting",
    icon: "🏠",
    illustrationUrl: null,       // ← "/assets/watercolour/pet-sitting.png"
    illustrationBg: "linear-gradient(135deg,#FFF8E1,#FFE082)",
    free: false,
    name: "Pet Sitting",
    tagline: "In-home care, feeding & companionship",
    desc: "Someone comes to {petName}'s home. A few hours or overnight — whichever {petName} needs.",
    accentColor: "#E65100",
    steps: 4,
  },
  {
    id: "behaviour",
    icon: "💜",
    illustrationUrl: null,       // ← "/assets/watercolour/behaviour.png"
    illustrationBg: "linear-gradient(135deg,#F3E5F5,#E1BEE7)",
    free: false,
    name: "Behaviour Support",
    tagline: "Anxiety, fear & stress support",
    desc: "Certified behaviourists and trainers — matched to {petName}'s specific triggers and needs.",
    accentColor: "#6A1B9A",
    steps: 5,
  },
  {
    id: "senior",
    icon: "🌸",
    illustrationUrl: null,       // ← "/assets/watercolour/senior-care.png"
    illustrationBg: "linear-gradient(135deg,#FCE4EC,#F8BBD9)",
    free: false,
    name: "Senior & Special Needs",
    tagline: "Comfort, mobility & special handling",
    desc: "Gentle, specialised care for {petName}'s golden years — or any special needs.",
    accentColor: "#AD1457",
    steps: 4,
  },
  {
    id: "nutrition",
    icon: "🥗",
    illustrationUrl: null,       // ← "/assets/watercolour/nutrition.png"
    illustrationBg: "linear-gradient(135deg,#FFF3E0,#FFE0B2)",
    free: false,
    name: "Nutrition Consults",
    tagline: "Diet consults & allergy support",
    desc: "One-on-one with a vet nutritionist — {petName}'s allergies and preferences already loaded.",
    accentColor: "#E65100",
    steps: 4,
  },
  {
    id: "emergency",
    icon: "🚨",
    illustrationUrl: null,       // ← "/assets/watercolour/emergency.png"
    illustrationBg: "linear-gradient(135deg,#FFEBEE,#FFCDD2)",
    free: true,
    name: "Emergency Help",
    tagline: "Urgent care routing & coordination",
    desc: "Tell us what's happening. We route you to the nearest emergency vet immediately.",
    accentColor: "#C62828",
    steps: 2,
    urgent: true,
  },
];

// ─────────────────────────────────────────────────────────────
// SERVICE BOOKING MODAL
// Full step-by-step booking flow for each service.
// Mirrors Aditya's grooming flow architecture exactly:
//   - Teal/colour header with pet avatar + "Mira knows:" bar
//   - Step X of Y progress
//   - Step content (select, multi-select, input, date, time)
//   - Back + Continue / Send to Concierge® buttons
//   - Confirmation screen: "Request Sent to Concierge®"
//
// WIRING:
//   POST /api/concierge/care-booking
//   body: { petId, serviceId, steps: { ...all step selections } }
// ─────────────────────────────────────────────────────────────

// ── Shared step components ───────────────────────────────────

function StepCard({ label, selected, onClick, sub, icon }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `1.5px solid ${selected ? "#2D6A4F" : "#E8E0D8"}`,
        borderRadius: 12, padding: "14px 16px",
        background: selected ? G.cream : "#fff",
        cursor: "pointer", transition: "all 0.12s",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}
    >
      {icon && <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: G.mutedText, marginTop: 2 }}>{sub}</div>}
      </div>
      {selected && (
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: G.sage, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✓</div>
      )}
    </div>
  );
}

function ChipSelect({ options, selected, onToggle, single = false, accentColor = G.sage }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.label;
        const sel = Array.isArray(selected) ? selected.includes(val) : selected === val;
        return (
          <button
            key={val}
            onClick={() => onToggle(val)}
            style={{
              border: `1.5px solid ${sel ? accentColor : "#E8E0D8"}`,
              borderRadius: 20, padding: "8px 16px",
              background: sel ? `${accentColor}15` : "#fff",
              color: sel ? accentColor : "#555",
              fontSize: 13, fontWeight: sel ? 600 : 400,
              cursor: "pointer", transition: "all 0.12s",
            }}
          >
            {sel ? "✓ " : ""}{val}
          </button>
        );
      })}
    </div>
  );
}

function MiraKnows({ text }) {
  return (
    <div style={{ background: `${G.pale}`, border: `1px solid ${G.greenBorder}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 20 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>ⓘ</span>
      <div style={{ fontSize: 13, color: G.deepMid }}>
        <strong style={{ color: G.deepMid }}>Mira knows:</strong>{" "}{text}
      </div>
    </div>
  );
}

function ProgressBar({ step, total, accentColor }) {
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
      <div style={{ height: "100%", width: `${(step / total) * 100}%`, background: "#fff", borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

function BookingHeader({ service, step, totalSteps, pet, onClose }) {
  return (
    <div style={{ background: `linear-gradient(135deg,${service.accentColor},${service.accentColor}CC)`, padding: "20px 24px 16px", borderRadius: "16px 16px 0 0", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.20)", borderRadius: 20, padding: "3px 10px" }}>
          <span style={{ fontSize: 14 }}>{service.icon}</span>
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{service.name}</span>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.20)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Georgia,serif", marginBottom: 4 }}>
        {service.name} for {pet.name}
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>
        Arranged around {pet.name}'s comfort and {pet.breed} needs
      </div>
      <ProgressBar step={step} total={totalSteps} accentColor={service.accentColor} />
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Step {step} of {totalSteps}</div>
    </div>
  );
}

function PetBadge({ pet }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", marginBottom: 16, borderBottom: `1px solid ${G.borderLight}` }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${G.pale},${G.light})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, overflow: "hidden", flexShrink: 0 }}>
        {pet.avatarUrl ? <img src={pet.avatarUrl} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{pet.avatar || "🐕"}</span>}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: G.darkText }}>For {pet.name}</div>
        <div style={{ fontSize: 13, color: G.mutedText }}>{pet.breed}</div>
      </div>
    </div>
  );
}

function NavButtons({ onBack, onNext, onSend, nextDisabled, isLast, accentColor, sending }) {
  return (
    <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: `1px solid ${G.borderLight}` }}>
      {onBack && (
        <button onClick={onBack} style={{ flex: 1, background: "#fff", border: `1.5px solid ${G.border}`, borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 600, color: G.mutedText, cursor: "pointer" }}>
          ← Back
        </button>
      )}
      <button
        onClick={isLast ? onSend : onNext}
        disabled={nextDisabled}
        style={{
          flex: 2, background: nextDisabled ? "#E8E0D8" : isLast ? `linear-gradient(135deg,${accentColor},${accentColor}99)` : `linear-gradient(135deg,${G.sage},${G.light})`,
          color: nextDisabled ? "#999" : isLast ? "#fff" : G.deep,
          border: "none", borderRadius: 12, padding: "12px",
          fontSize: 14, fontWeight: 800, cursor: nextDisabled ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.15s",
        }}
      >
        {sending ? "Sending…" : isLast ? `✦ Send to Concierge®` : "Continue →"}
      </button>
    </div>
  );
}

// ── Confirmation screen ──────────────────────────────────────
function BookingConfirmed({ service, pet, onClose }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 32px" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${service.accentColor},${G.light})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>
        {service.urgent ? "🚨" : "✦"}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: G.darkText, fontFamily: "Georgia,serif", marginBottom: 8 }}>
        Request Sent to Concierge®
      </div>
      <div style={{ fontSize: 14, color: G.mutedText, lineHeight: 1.7, marginBottom: 8 }}>
        Your {service.name.toLowerCase()} request for {pet.name} has been received.
      </div>
      <div style={{ fontSize: 13, color: G.mutedText, lineHeight: 1.7, marginBottom: 24 }}>
        {service.urgent
          ? "Our Concierge® team will call you within 5 minutes."
          : "Our Concierge® team will review and get back to you shortly with the best options for " + pet.name + "."
        }
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: G.cream, border: `1px solid ${G.border}`, borderRadius: 20, padding: "6px 16px", fontSize: 13, color: G.sage, fontWeight: 600, marginBottom: 24 }}>
        📥 Added to your Inbox
      </div>
      <div>
        <button onClick={onClose} style={{ background: G.sage, color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          View in Concierge® Inbox
        </button>
      </div>
    </div>
  );
}

// ── GROOMING FLOW (5 steps) ──────────────────────────────────
function GroomingFlow({ pet, service, onClose }) {
  const [step, setStep]     = useState(1);
  const [mode, setMode]     = useState(null);
  const [format, setFormat] = useState(null);
  const [svcs, setSvcs]     = useState([]);
  const [comfort, setComfort] = useState({ strangers: null, nervous: null });
  const [location, setLocation] = useState({ area: "", water: null, time: null });
  const [sent, setSent]     = useState(false);

  const toggleSvc = v => setSvcs(p => p.includes(v) ? p.filter(x=>x!==v) : [...p,v]);

  const canNext = [
    !!mode,
    !!format,
    svcs.length > 0,
    comfort.strangers && comfort.nervous,
    location.water && location.time,
  ][step - 1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;

  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={5} pet={pet} onClose={onClose} />
      <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.coatType || "Long silky"} coat — regular brushing prevents matting. ${pet.groomingComfort === "Comfortable" ? pet.name + " is comfortable being groomed." : "Gentle handling recommended."}`} />

        {step === 1 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 12 }}>How would you like grooming arranged?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[{v:"home",icon:"🏠",l:"At Home",s:"Groomer comes to you"},{v:"salon",icon:"💇",l:"At Salon",s:"Visit a grooming salon"},{v:"mira",icon:"✦",l:"Let Mira Recommend",s:"Based on your pet's needs"},{v:"myself",icon:"🛁",l:"I Groom at Home",s:"Help me do it right"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={mode===o.v} onClick={()=>setMode(o.v)} />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 12 }}>Select service format</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[{v:"individual",l:"Individual Services",s:"Pick specific services"},{v:"full",l:"Full Groom",s:"Complete grooming session"},{v:"bundle",l:"Bundle / Plan",s:"Multi-session packages"},{v:"maintenance",l:"Maintenance",s:"Regular upkeep"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} selected={format===o.v} onClick={()=>setFormat(o.v)} />
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 12 }}>Choose services for {pet.name}</div>
            <ChipSelect
              options={["Bath + Blow Dry","Haircut / Trim","Nail Clipping","Ear Cleaning","Paw Care / Paw Trim","Hygiene Trim","Deshedding","Detangling / De-matting","Coat Styling","Teeth Cleaning"]}
              selected={svcs}
              onToggle={toggleSvc}
              accentColor={service.accentColor}
            />
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 12 }}>Comfortable with strangers?</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["Yes","Sometimes","No"].map(v=>(
                <StepCard key={v} label={v} selected={comfort.strangers===v} onClick={()=>setComfort(p=>({...p,strangers:v}))} />
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 12 }}>Nervous during grooming?</div>
            <div style={{ display: "flex", gap: 10 }}>
              {["Yes","No","Not sure"].map(v=>(
                <StepCard key={v} label={v} selected={comfort.nervous===v} onClick={()=>setComfort(p=>({...p,nervous:v}))} />
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            {mode === "home" && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 8 }}>Area / Landmark</div>
                <input
                  type="text"
                  placeholder="Nearby landmark for easy navigation"
                  value={location.area}
                  onChange={e => setLocation(p => ({...p, area: e.target.value}))}
                  style={{ width: "100%", border: `1.5px solid ${G.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, color: G.darkText, outline: "none", marginBottom: 16, boxSizing: "border-box" }}
                />
                <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 12 }}>Water access available?</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  {["Yes","No"].map(v=>(
                    <StepCard key={v} label={v} selected={location.water===v} onClick={()=>setLocation(p=>({...p,water:v}))} />
                  ))}
                </div>
              </>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 12 }}>Preferred time window</div>
            <div style={{ display: "flex", gap: 10 }}>
              {["Morning (8am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–8pm)"].map(v=>(
                <StepCard key={v} label={v} selected={location.time===v} onClick={()=>setLocation(p=>({...p,time:v,water:p.water||"Yes"}))} />
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ padding: "0 24px 20px", flexShrink: 0 }}>
        <NavButtons
          onBack={step > 1 ? () => setStep(s => s-1) : null}
          onNext={() => setStep(s => s+1)}
          onSend={() => { setSent(true); /* TODO: POST /api/concierge/care-booking */ }}
          nextDisabled={!canNext}
          isLast={step === 5}
          accentColor={service.accentColor}
        />
      </div>
    </>
  );
}

// ── VET VISITS FLOW (4 steps) ────────────────────────────────
function VetFlow({ pet, service, onClose }) {
  const [step, setStep]   = useState(1);
  const [reason, setReason] = useState(null);
  const [pref, setPref]   = useState(null);
  const [urgency, setUrgency] = useState(null);
  const [notes, setNotes] = useState("");
  const [sent, setSent]   = useState(false);

  const canNext = [!!reason, !!pref, !!urgency, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;

  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Last vet visit: ${pet.lastVetVisit || "not recorded"}. Vaccinations: ${pet.vaccinated ? "up to date" : "needs checking"}. ${pet.healthCondition ? "Health condition on file: " + pet.healthCondition + "." : ""}`} />

        {step === 1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What's the main reason for this vet visit?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"checkup",icon:"🏥",l:"Routine check-up",s:"Annual wellness exam"},{v:"vaccination",icon:"💉",l:"Vaccination",s:"Vaccines and boosters"},{v:"concern",icon:"🔍",l:"Specific concern",s:"Something has changed"},{v:"followup",icon:"📋",l:"Follow-up visit",s:"Continuing treatment"},{v:"ear",icon:"👂",l:"Ear problem",s:"Infection, discharge, or discomfort"},{v:"skin",icon:"🔬",l:"Skin / Itchiness check",s:"Rashes, allergies, or coat issues"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={reason===o.v} onClick={()=>setReason(o.v)} />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Vet visit preference</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"clinic",icon:"🏥",l:"Clinic near me",s:"We find and book the right vet"},{v:"home",icon:"🏠",l:"Home visit",s:"Vet comes to you — less stress"},{v:"video",icon:"💻",l:"Video consult",s:"Expert advice from home"},{v:"haveone",icon:"📋",l:"I have a vet",s:"Just help me book with them"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={pref===o.v} onClick={()=>setPref(o.v)} />
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>How urgent is this?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[{v:"today",l:"Today",s:"Need it today"},{v:"week",l:"This week",s:"Within 7 days"},{v:"flexible",l:"Flexible",s:"Whenever works"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} selected={urgency===o.v} onClick={()=>setUrgency(o.v)} />
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Anything the vet should know? <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea
              rows={5}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={`Symptoms, recent changes, medications, or anything else about ${pet.name}…`}
              style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }}
            />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={()=>setSent(true)} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── BOARDING & DAYCARE FLOW (4 steps) ────────────────────────
function BoardingFlow({ pet, service, onClose }) {
  const [step, setStep]       = useState(1);
  const [type, setType]       = useState(null);
  const [dates, setDates]     = useState({ from:"", to:"", flexible:false });
  const [reqs, setReqs]       = useState([]);
  const [prefs, setPrefs]     = useState([]);
  const [sent, setSent]       = useState(false);

  const toggleReq  = v => setReqs(p => p.includes(v) ? p.filter(x=>x!==v) : [...p,v]);
  const togglePref = v => setPrefs(p => p.includes(v) ? p.filter(x=>x!==v) : [...p,v]);
  const canNext    = [!!type, dates.flexible||(dates.from&&dates.to), true, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;

  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name}'s allergies and health profile are already shared with all vetted boarding facilities we recommend.`} />

        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What type of boarding does {pet.name} need?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"overnight",icon:"🌙",l:"Overnight boarding",s:"One or more nights"},{v:"daycare",icon:"☀️",l:"Daycare only",s:"Daytime supervision"},{v:"multiday",icon:"📅",l:"Multi-day stay",s:"Extended stay"},{v:"emergency",icon:"🚨",l:"Emergency boarding",s:"Needed urgently"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={type===o.v} onClick={()=>setType(o.v)} />
              ))}
            </div>
          </>
        )}

        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>When?</div>
            {!dates.flexible && (
              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:G.mutedText, marginBottom:4 }}>From</div>
                  <input type="date" value={dates.from} onChange={e=>setDates(p=>({...p,from:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 12px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box" }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:G.mutedText, marginBottom:4 }}>To</div>
                  <input type="date" value={dates.to} onChange={e=>setDates(p=>({...p,to:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 12px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box" }} />
                </div>
              </div>
            )}
            <button onClick={()=>setDates(p=>({...p,flexible:!p.flexible}))} style={{ border:`1.5px solid ${dates.flexible?G.sage:"#E8E0D8"}`, borderRadius:20, padding:"8px 16px", background:dates.flexible?G.cream:"#fff", color:dates.flexible?G.deepMid:"#555", fontSize:13, fontWeight:dates.flexible?600:400, cursor:"pointer" }}>
              {dates.flexible?"✓ Dates are flexible":"Dates are flexible"}
            </button>
          </>
        )}

        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Any special requirements?</div>
            <ChipSelect options={["Medication administration","Special diet","Separation anxiety","Breed-specific handling","Senior care needed","Post-surgery recovery","Highly active dog","Shy / needs slow introduction"]} selected={reqs} onToggle={toggleReq} accentColor={service.accentColor} />
          </>
        )}

        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Preferences for the facility</div>
            <ChipSelect options={["Near my home","Near my vet","Luxury / premium suite","Standard accommodation","Outdoor run available","Indoor only","Small dogs only","24/7 vet on site"]} selected={prefs} onToggle={togglePref} accentColor={service.accentColor} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={()=>setSent(true)} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── PET SITTING FLOW (4 steps) ───────────────────────────────
function SittingFlow({ pet, service, onClose }) {
  const [step, setStep]     = useState(1);
  const [type, setType]     = useState(null);
  const [when, setWhen]     = useState({ date:"", time:null, recurring:null });
  const [needs, setNeeds]   = useState([]);
  const [access, setAccess] = useState({ notes:"" });
  const [sent, setSent]     = useState(false);

  const toggleNeed = v => setNeeds(p => p.includes(v) ? p.filter(x=>x!==v) : [...p,v]);
  const canNext    = [!!type, when.time&&(when.date||when.recurring), needs.length>0, true][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;

  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name}'s feeding routine and medication needs are already on file with your Concierge.`} />

        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What type of pet sitting does {pet.name} need?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"hourly",icon:"⏰",l:"A few hours",s:"While you're out"},{v:"fullday",icon:"☀️",l:"Full day",s:"Morning to evening"},{v:"overnight",icon:"🌙",l:"Overnight",s:"Sitter stays the night"},{v:"regular",icon:"📅",l:"Regular / weekly",s:"Ongoing schedule"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={type===o.v} onClick={()=>setType(o.v)} />
              ))}
            </div>
          </>
        )}

        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>When?</div>
            <input type="date" value={when.date} onChange={e=>setWhen(p=>({...p,date:e.target.value}))} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", marginBottom:14, boxSizing:"border-box" }} />
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10 }}>Preferred time</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
              {["Morning (8am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–9pm)","Flexible"].map(v=>(
                <button key={v} onClick={()=>setWhen(p=>({...p,time:v}))} style={{ border:`1.5px solid ${when.time===v?G.sage:"#E8E0D8"}`, borderRadius:20, padding:"7px 14px", background:when.time===v?G.cream:"#fff", color:when.time===v?G.deepMid:"#555", fontSize:12, fontWeight:when.time===v?600:400, cursor:"pointer" }}>{when.time===v?"✓ ":""}{v}</button>
              ))}
            </div>
            {type==="regular" && (
              <>
                <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:10 }}>How often?</div>
                <ChipSelect options={["Daily","3x per week","Weekdays only","Weekends only","As needed"]} selected={when.recurring} onToggle={v=>setWhen(p=>({...p,recurring:v}))} accentColor={service.accentColor} />
              </>
            )}
          </>
        )}

        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What does {pet.name} need during the sitting?</div>
            <ChipSelect options={["Feeding","Fresh water","Walks","Playtime","Medication administration","Companionship (lap dog)","Potty breaks","Training reinforcement"]} selected={needs} onToggle={toggleNeed} accentColor={service.accentColor} />
          </>
        )}

        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Home access & special notes <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea
              rows={5}
              value={access.notes}
              onChange={e=>setAccess({notes:e.target.value})}
              placeholder={`Key safe location, gate code, emergency contact, any quirks the sitter should know about ${pet.name}…`}
              style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }}
            />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={()=>setSent(true)} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── BEHAVIOUR SUPPORT FLOW (5 steps) ────────────────────────
function BehaviourFlow({ pet, service, onClose }) {
  const [step, setStep]       = useState(1);
  const [concern, setConcern] = useState(null);
  const [when, setWhen]       = useState(null);
  const [triggers, setTriggers] = useState(pet.anxietyTriggers || []);
  const [tried, setTried]     = useState([]);
  const [approach, setApproach] = useState(null);
  const [sent, setSent]       = useState(false);

  const toggleTrig = v => setTriggers(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const toggleTried = v => setTried(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!concern, !!when, triggers.length>0, true, !!approach][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;

  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={5} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`Known triggers for ${pet.name}: ${(pet.anxietyTriggers||[]).join(", ")||"none recorded yet"}. Personality profile already loaded.`} />

        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What is the primary concern?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"aggression",icon:"⚠️",l:"Aggression",s:"Towards people or other dogs"},{v:"separation",icon:"🏠",l:"Separation anxiety",s:"Distress when left alone"},{v:"fear",icon:"😨",l:"Fear / Phobia",s:"Specific fears causing distress"},{v:"reactivity",icon:"🐕",l:"Reactivity",s:"Overreaction to triggers"},{v:"barking",icon:"🔊",l:"Excessive barking",s:"Constant or triggered barking"},{v:"destructive",icon:"💥",l:"Destructive behaviour",s:"Chewing, digging, destroying"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={concern===o.v} onClick={()=>setConcern(o.v)} />
              ))}
            </div>
          </>
        )}

        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>When does it happen?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"always",l:"Always",s:"Constant or near-constant"},{v:"triggers",l:"Specific triggers",s:"When certain things happen"},{v:"new",l:"Recently started",s:"New behaviour change"},{v:"worsening",l:"Getting worse",s:"Ongoing but escalating"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} selected={when===o.v} onClick={()=>setWhen(o.v)} />
              ))}
            </div>
          </>
        )}

        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4 }}>Confirm {pet.name}'s triggers</div>
            <div style={{ fontSize:13, color:G.mutedText, marginBottom:12 }}>Pre-filled from soul profile. Add or remove as needed.</div>
            <ChipSelect options={["Loud noises","Car travel","Strangers / crowds","Vet visits","Being left alone","Storms","Other dogs","Fireworks","New environments","Sudden movements"]} selected={triggers} onToggle={toggleTrig} accentColor={service.accentColor} />
          </>
        )}

        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What has been tried so far?</div>
            <ChipSelect options={["Nothing yet","Basic training","Professional training","Calming supplements","Medication (vet prescribed)","Pheromone diffuser","Compression wrap","Behaviour modification plan"]} selected={tried} onToggle={toggleTried} accentColor={service.accentColor} />
          </>
        )}

        {step===5 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Preferred approach</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"behaviourist",icon:"👩‍⚕️",l:"Certified behaviourist",s:"Specialist assessment and plan"},{v:"trainer",icon:"🎓",l:"Positive trainer",s:"Training-based approach"},{v:"products",icon:"🌿",l:"Products first",s:"Calming supplements and tools"},{v:"vet",icon:"🏥",l:"Vet referral",s:"Medical assessment needed"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={approach===o.v} onClick={()=>setApproach(o.v)} />
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={()=>setSent(true)} nextDisabled={!canNext} isLast={step===5} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── SENIOR & SPECIAL NEEDS FLOW (4 steps) ────────────────────
function SeniorFlow({ pet, service, onClose }) {
  const [step, setStep]     = useState(1);
  const [need, setNeed]     = useState(null);
  const [situation, setSituation] = useState("");
  const [setup, setSetup]   = useState([]);
  const [vetInvolv, setVetInvolv] = useState(null);
  const [sent, setSent]     = useState(false);

  const toggleSetup = v => setSetup(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!need, true, setup.length>0, !!vetInvolv][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;

  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name} is ${pet.age} years old. ${pet.healthCondition ? "Health condition on file: " + pet.healthCondition + "." : "No health conditions recorded."} Senior care recommendations are tailored to their breed.`} />

        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What does {pet.name} need most right now?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"mobility",icon:"🦽",l:"Mobility support",s:"Arthritis, stiffness, difficulty getting up"},{v:"pain",icon:"💊",l:"Pain management",s:"Chronic or acute pain support"},{v:"cognitive",icon:"🧠",l:"Cognitive decline",s:"Confusion, disorientation, night waking"},{v:"surgery",icon:"🏥",l:"Post-surgery recovery",s:"Wound care and restricted movement"},{v:"palliative",icon:"💜",l:"Palliative care",s:"End-of-life comfort and dignity"},{v:"special",icon:"🌸",l:"Special handling",s:"Physical disability or unusual needs"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={need===o.v} onClick={()=>setNeed(o.v)} />
              ))}
            </div>
          </>
        )}

        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Tell us what's changed recently <span style={{ fontSize:12, color:"#BBB", fontWeight:400 }}>Optional</span></div>
            <textarea rows={5} value={situation} onChange={e=>setSituation(e.target.value)} placeholder={`What have you noticed? When did it start? What has been tried?`} style={{ width:"100%", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
          </>
        )}

        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What does the home setup need?</div>
            <ChipSelect options={["Orthopaedic bed","Ramp or steps","Raised feeding station","Non-slip mats","Self-warming blanket","Baby gate to restrict stairs","Night light","Mobility harness"]} selected={setup} onToggle={toggleSetup} accentColor={service.accentColor} />
          </>
        )}

        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>Vet involvement?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:10 }}>
              {[{v:"have",icon:"✅",l:"I have a vet managing this",s:"Concierge coordinates alongside existing vet"},{v:"need",icon:"🔍",l:"I need a vet first",s:"Help me find the right specialist"},{v:"second",icon:"💬",l:"I want a second opinion",s:"Not confident in current treatment plan"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={vetInvolv===o.v} onClick={()=>setVetInvolv(o.v)} />
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={()=>setSent(true)} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── NUTRITION CONSULTS FLOW (4 steps) ────────────────────────
function NutritionFlow({ pet, service, onClose }) {
  const [step, setStep]     = useState(1);
  const [reason, setReason] = useState(null);
  const [currentDiet, setCurrentDiet] = useState(null);
  const [issues, setIssues] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [sent, setSent]     = useState(false);

  const toggleIssue = v => setIssues(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
  const canNext = [!!reason, !!currentDiet, true, !!outcome][step-1];

  if (sent) return <BookingConfirmed service={service} pet={pet} onClose={onClose} />;

  return (
    <>
      <BookingHeader service={service} step={step} totalSteps={4} pet={pet} onClose={onClose} />
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />
        <MiraKnows text={`${pet.name}'s allergies (${(pet.allergies||[]).join(", ")||"none recorded"}) and food preferences are pre-loaded. The nutritionist will have everything before the consult.`} />

        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What is the reason for this consultation?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"general",icon:"🥗",l:"General diet review",s:"Is what I'm feeding right?"},{v:"allergy",icon:"🛡️",l:"Allergy diet planning",s:"Safe food after allergen discovery"},{v:"weight",icon:"⚖️",l:"Weight management",s:"Safe weight loss or gain"},{v:"medical",icon:"💊",l:"Medical diet",s:"Prescribed or condition-specific"},{v:"puppy",icon:"🐶",l:"Puppy nutrition",s:"Getting the foundations right"},{v:"senior",icon:"🌸",l:"Senior nutrition",s:"Adapting diet for older dogs"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={reason===o.v} onClick={()=>setReason(o.v)} />
              ))}
            </div>
          </>
        )}

        {step===2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What is {pet.name} eating right now?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"kibble",icon:"🥣",l:"Commercial kibble",s:"Dry food from a bag"},{v:"wet",icon:"🥫",l:"Wet / canned food",s:"Pouches or tins"},{v:"raw",icon:"🥩",l:"Raw diet",s:"BARF or prey model"},{v:"homecooked",icon:"🍲",l:"Home-cooked",s:"Fresh meals made at home"},{v:"mixed",icon:"🔀",l:"Mixed / combination",s:"Multiple types"},{v:"unsure",icon:"❓",l:"Not sure / varies",s:"Inconsistent or changing"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={currentDiet===o.v} onClick={()=>setCurrentDiet(o.v)} />
              ))}
            </div>
          </>
        )}

        {step===3 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4 }}>Known issues to address</div>
            <div style={{ fontSize:13, color:G.mutedText, marginBottom:12 }}>Pre-filled from soul profile. Add anything else.</div>
            <ChipSelect options={[...(pet.allergies||[]).map(a=>a.charAt(0).toUpperCase()+a.slice(1)+" allergy"),"Weight management","Digestive issues","Skin / coat problems","Dental health","Low energy","Picky eater","Sensitive stomach"]} selected={issues} onToggle={toggleIssue} accentColor={service.accentColor} />
          </>
        )}

        {step===4 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What would you like from this consultation?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:10 }}>
              {[{v:"mealplan",icon:"📋",l:"A complete meal plan",s:"Day-by-day guide matched to "+pet.name+"'s needs"},{v:"products",icon:"🛒",l:"Product recommendations",s:"Best food brands and supplements for "+pet.name},{v:"vet",icon:"🏥",l:"Vet nutritionist referral",s:"Medical-grade nutrition assessment"},{v:"transition",icon:"🔄",l:"Diet transition support",s:"How to safely switch "+pet.name+"'s food"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={outcome===o.v} onClick={()=>setOutcome(o.v)} />
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons onBack={step>1?()=>setStep(s=>s-1):null} onNext={()=>setStep(s=>s+1)} onSend={()=>setSent(true)} nextDisabled={!canNext} isLast={step===4} accentColor={service.accentColor} />
      </div>
    </>
  );
}

// ── EMERGENCY FLOW (2 steps — fast) ─────────────────────────
function EmergencyFlow({ pet, service, onClose }) {
  const [step, setStep]       = useState(1);
  const [situation, setSituation] = useState(null);
  const [location, setLocation]   = useState("");
  const [sent, setSent]       = useState(false);

  const canNext = [!!situation, true][step-1];

  if (sent) return (
    <div style={{ textAlign:"center", padding:"40px 32px" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"#C62828", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>🚨</div>
      <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>Request Sent to Concierge®</div>
      <div style={{ fontSize:15, color:"#C62828", fontWeight:700, marginBottom:8 }}>We will call you within 5 minutes.</div>
      <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:24 }}>Your emergency request for {pet.name} has been received.<br/>Our Concierge® team is routing you to the nearest emergency vet now.</div>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#FFEBEE", border:"1px solid #FFCDD2", borderRadius:20, padding:"6px 16px", fontSize:13, color:"#C62828", fontWeight:600, marginBottom:24 }}>📥 Added to your Inbox</div>
      <div><button onClick={onClose} style={{ background:"#C62828", color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>View in Concierge® Inbox</button></div>
    </div>
  );

  return (
    <>
      <div style={{ background:"linear-gradient(135deg,#C62828,#B71C1C)", padding:"20px 24px 16px", borderRadius:"16px 16px 0 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.20)", borderRadius:20, padding:"3px 10px" }}>
            <span style={{ fontSize:14 }}>🚨</span>
            <span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>Emergency Help</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.20)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:4 }}>Emergency for {pet.name}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:10 }}>Tell us what's happening. We'll route you immediately.</div>
        <ProgressBar step={step} total={2} accentColor="#C62828" />
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>Step {step} of 2</div>
      </div>
      <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
        <PetBadge pet={pet} />

        {step===1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What's happening?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:"injury",icon:"🩹",l:"Injury / accident",s:"Cut, fracture, trauma"},{v:"poison",icon:"☠️",l:"Poisoning / ingestion",s:"Ate something dangerous"},{v:"breathing",icon:"😮‍💨",l:"Breathing difficulty",s:"Struggling to breathe"},{v:"seizure",icon:"⚡",l:"Seizure",s:"Convulsions or collapse"},{v:"collapse",icon:"💔",l:"Collapse / unconscious",s:"Can't get up or unresponsive"},{v:"lost",icon:"🔍",l:"Lost pet",s:"Missing and can't locate them"}].map(o=>(
                <StepCard key={o.v} label={o.l} sub={o.s} icon={o.icon} selected={situation===o.v} onClick={()=>setSituation(o.v)} />
              ))}
            </div>
          </>
        )}

        {step===2 && (
          <>
            <div style={{ background:"#FFEBEE", border:"1px solid #FFCDD2", borderRadius:12, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#B71C1C", fontWeight:600 }}>
              🚨 We will call you within 5 minutes of receiving this.
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:8 }}>Your location</div>
            <input type="text" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Address or nearest landmark" style={{ width:"100%", border:`1.5px solid #FFCDD2`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.darkText, outline:"none", boxSizing:"border-box" }} />
          </>
        )}
      </div>
      <div style={{ padding:"0 24px 20px", flexShrink:0 }}>
        <NavButtons
          onBack={step>1?()=>setStep(s=>s-1):null}
          onNext={()=>setStep(s=>s+1)}
          onSend={()=>setSent(true)}
          nextDisabled={!canNext}
          isLast={step===2}
          accentColor="#C62828"
        />
      </div>
    </>
  );
}

// ── SERVICE BOOKING MODAL ROUTER ─────────────────────────────
function ServiceBookingModal({ service, pet, onClose }) {
  const flowProps = { pet, service, onClose };
  const FlowComponent = {
    grooming:   GroomingFlow,
    vet:        VetFlow,
    boarding:   BoardingFlow,
    sitting:    SittingFlow,
    behaviour:  BehaviourFlow,
    senior:     SeniorFlow,
    nutrition:  NutritionFlow,
    emergency:  EmergencyFlow,
  }[service.id];

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"min(580px,100%)", maxHeight:"90vh",
          background:"#fff", borderRadius:16,
          display:"flex", flexDirection:"column",
          overflow:"hidden",
          boxShadow:"0 32px 80px rgba(0,0,0,0.30)",
        }}
      >
        {FlowComponent ? <FlowComponent {...flowProps} /> : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARE CONCIERGE SECTION
// ─────────────────────────────────────────────────────────────
function CareConcierge({ pet }) {
  const [activeService, setActiveService] = useState(null);

  return (
    <div style={{ background:`linear-gradient(135deg,${G.cream},#E8F8EE)`, borderRadius:20, border:`1px solid ${G.border}`, padding:24, marginBottom:32 }}>

      {/* Service booking modal */}
      {activeService && (
        <ServiceBookingModal
          service={CARE_SERVICES.find(s => s.id === activeService)}
          pet={pet}
          onClose={() => setActiveService(null)}
        />
      )}

      <div style={{ fontSize:20, fontWeight:800, color:G.darkText, marginBottom:4, fontFamily:"Georgia,serif" }}>Care Concierge Services</div>
      <div style={{ fontSize:13, color:G.mutedText, marginBottom:20 }}>Concierge-led care coordination — from finding the right groomer to making sure {pet.name} is comfortable every step of the way.</div>

      {/* 8 service cards — 4 per row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {CARE_SERVICES.map(svc => (
          <div
            key={svc.id}
            style={{ background:"#fff", borderRadius:16, border:`1px solid ${svc.urgent ? "#FFCDD2" : G.borderLight}`, overflow:"hidden", transition:"transform 0.15s, box-shadow 0.15s", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ height:110, overflow:"hidden", background:svc.illustrationBg, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
              {svc.illustrationUrl
                ? <img src={svc.illustrationUrl} alt={svc.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:40 }}>{svc.icon}</span>
              }
              {svc.urgent && (
                <div style={{ position:"absolute", top:8, right:8, background:"#C62828", color:"#fff", fontSize:9, fontWeight:700, borderRadius:20, padding:"2px 7px" }}>URGENT</div>
              )}
            </div>
            <div style={{ padding:"12px 14px 14px" }}>
              {svc.free && <div style={{ display:"inline-block", background:"#E8F5E9", color:"#2E7D32", fontSize:10, fontWeight:700, borderRadius:8, padding:"2px 8px", marginBottom:6 }}>Complimentary</div>}
              <div style={{ fontSize:12, color:G.hintText, marginBottom:3 }}>{svc.tagline}</div>
              <div style={{ fontSize:13, fontWeight:700, color: svc.urgent ? "#C62828" : G.darkText, marginBottom:5, lineHeight:1.3 }}>{svc.name}</div>
              <div style={{ fontSize:11, color:G.mutedText, lineHeight:1.5, marginBottom:10 }}>{svc.desc.replace("{petName}", pet.name)}</div>
              <button
                style={{ fontSize:12, color: svc.urgent ? "#C62828" : G.sage, fontWeight:700, background:"none", border:"none", padding:0, cursor:"pointer" }}
                onClick={() => setActiveService(svc.id)}
              >
                {svc.urgent ? "Get help now →" : `Book ${svc.steps}-step flow →`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dark CTA card */}
      <div style={{ background:G.deep, borderRadius:20, padding:28, display:"flex", alignItems:"flex-start", gap:24 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(116,198,157,0.20)", border:"1px solid rgba(116,198,157,0.40)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600, marginBottom:12 }}>
            🌿 Care Concierge®
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:10, fontFamily:"Georgia,serif", lineHeight:1.2 }}>
            Care for <span style={{ color:G.light }}>{pet.name}</span> the way only you know how.
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
            {["Grooming","Vet Visits","Boarding & Daycare","Pet Sitting","Behaviour Support","Senior Care","Nutrition","Emergency"].map(chip => (
              <span key={chip} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:20, padding:"4px 12px", color:"#fff", fontSize:11 }}>{chip}</span>
            ))}
          </div>
          <div style={{ fontSize:13, color:G.whiteDim, lineHeight:1.7, marginBottom:20 }}>
            You tell us what {pet.name} needs. We find the right person, make the booking, follow up after, and keep the records. Every time.
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div>
              <span style={{ fontSize:26, fontWeight:900, color:G.light }}>45,000+</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.50)", marginLeft:6 }}>care moments arranged</span>
            </div>
            <button
              onClick={() => setActiveService("grooming")}
              style={{ display:"inline-flex", alignItems:"center", gap:8, background:`linear-gradient(135deg,${G.sage},${G.light})`, color:G.deep, border:"none", borderRadius:10, padding:"12px 22px", fontSize:14, fontWeight:800, cursor:"pointer" }}
            >
              🌿 Talk to your Care Concierge
            </button>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.40)" }}>48h response promise · Emergency: 5 min</span>
          </div>
        </div>
        <div style={{ flexShrink:0, textAlign:"center", minWidth:100 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(116,198,157,0.20)", border:`2px solid rgba(116,198,157,0.40)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, margin:"0 auto 8px" }}>🌿</div>
          <div style={{ fontSize:22, fontWeight:900, color:G.light }}>100%</div>
          <div style={{ fontSize:11, color:G.whiteDim, marginBottom:6 }}>handled for you</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.30)", lineHeight:1.5 }}>Every call.<br/>Every detail.</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function CareSoulPage() {
  const { currentPet: contextPet } = usePillarContext();

  // Merge real pet with wellness-profile defaults (wellness fields come from Soul Builder)
  const pet = contextPet ? {
    name: contextPet.name || "your dog",
    breed: contextPet.breed || "",
    age: contextPet.age || null,
    avatar: contextPet.avatar || "🐕",
    avatarUrl: contextPet.photo_url || contextPet.avatar_url || null,
    soulPercent: contextPet.soul_percent || contextPet.profile_completion || 70,
    // WellnessProfile fields — from soul answers or defaults
    coatType: contextPet.coat_type || contextPet.wellness?.coatType || null,
    groomingFreq: contextPet.grooming_frequency || contextPet.wellness?.groomingFreq || "Monthly",
    skinSensitive: contextPet.skin_sensitivities || contextPet.wellness?.skinSensitive || null,
    groomingComfort: contextPet.grooming_comfort || contextPet.wellness?.groomingComfort || "Comfortable",
    dentalHealth: contextPet.dental_health || contextPet.wellness?.dentalHealth || "Good",
    anxietyTriggers: contextPet.anxiety_triggers || contextPet.wellness?.anxietyTriggers || [],
    lastVetVisit: contextPet.last_vet_visit || contextPet.wellness?.lastVetVisit || null,
    vaccinated: contextPet.vaccinated ?? contextPet.wellness?.vaccinated ?? true,
    healthCondition: contextPet.health_conditions?.[0] || null,
    city: contextPet.city || "India",
    favoriteFoods: contextPet.favorite_foods || contextPet.loves || [],
  } : MOCK_PET;

  // Live dimension products — fetched per dimension on open
  const [dimProducts, setDimProducts] = useState({});
  const [loadingDim, setLoadingDim] = useState({});

  const fetchDimProducts = useCallback(async (dimId) => {
    if (dimProducts[dimId] || loadingDim[dimId]) return;
    // Map dimId → dimension label in DB
    const dimLabelMap = {
      grooming: "Grooming",
      dental_paw: "Dental & Paw",
      coat_skin: "Coat & Skin",
      wellness: "Wellness Visits",
      senior: "Senior Care",
      supplements: "Supplements",
      soul_care: "Soul Care Products",
    };
    const dbDim = dimLabelMap[dimId];
    if (!dbDim) return;
    setLoadingDim(prev => ({ ...prev, [dimId]: true }));
    try {
      const res = await fetch(`${API_URL}/api/care/products?dimension=${encodeURIComponent(dbDim)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setDimProducts(prev => ({ ...prev, [dimId]: data.products || [] }));
      }
    } catch (e) { /* silent — page works fine with MOCK_DIMS */ }
    finally { setLoadingDim(prev => ({ ...prev, [dimId]: false })); }
  }, [dimProducts, loadingDim]);

  // Merge live products into dims — replaces MOCK_DIMS products where available
  const dims = MOCK_DIMS.map(dim => ({
    ...dim,
    tabs: dim.tabs.map(tab => {
      const live = (dimProducts[dim.id] || []).filter(p =>
        !tab.label || p.sub_category === tab.label || !p.sub_category
      );
      if (!live.length) return tab; // fall back to mock products
      return {
        ...tab,
        products: live.map(p => ({
          id: p.id,
          name: p.name,
          desc: p.short_description || p.description || "",
          price: p.price > 0 ? `₹${p.price}` : "Free",
          img: p.image_url || "",
          tag: p.mira_pick ? "✦ Mira Pick" : (p.tag || ""),
          badge: p.mira_pick ? "Mira Pick" : null,
          inStock: p.in_stock !== false,
        })),
      };
    }),
  }));

  const [activeTab,   setActiveTab]   = useState("care");
  const [openDim,     setOpenDim]     = useState(null);
  const [wellnessOpen, setWellnessOpen] = useState(false);

  const handleDimClick = (dimId) => {
    const next = openDim === dimId ? null : dimId;
    setOpenDim(next);
    if (next) fetchDimProducts(next);
  };

  const safeLoves = (pet.favoriteFoods || []);

  // Today's care tip — rotates daily
  const CARE_TIPS = [
    { category:"Dental", tip:`Brush ${pet.name}'s teeth daily with dog-specific toothpaste. If daily isn't possible, aim for at least 3 times a week. Dental chews help but don't replace brushing.` },
    { category:"Grooming", tip:`${pet.breed} coats need brushing every 2-3 days to prevent matting. Always brush before bathing — wet mats tighten and become much harder to remove.` },
    { category:"Coat", tip:`A dull coat often signals a nutritional gap. Adding omega-3 (salmon oil) to ${pet.name}'s meals for 4 weeks can visibly improve shine and skin health.` },
    { category:"Paws", tip:`Check ${pet.name}'s paws weekly. Look between the toes for redness, debris, or small cuts. Mumbai summers mean hot pavements — paw wax before walks is worth it.` },
  ];
  const todayTip = CARE_TIPS[new Date().getDay() % CARE_TIPS.length];

  return (
    <div style={{ background:G.pageBg, minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ── WELLNESS PROFILE DRAWER ──────────────────────────── */}
      {wellnessOpen && <WellnessProfileDrawer pet={pet} onClose={() => setWellnessOpen(false)} />}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg,${G.deep} 0%,${G.deepMid} 50%,${G.sage} 100%)`, padding:"32px 32px 0", position:"relative", overflow:"hidden" }}>
        {/* Glow orb */}
        <div style={{ position:"absolute", top:-60, right:-60, width:280, height:280, background:"radial-gradient(circle,rgba(116,198,157,0.18) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />

        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:28, marginBottom:24 }}>

            {/* Avatar */}
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{ width:96, height:96, borderRadius:"50%", background:`linear-gradient(135deg,${G.light},${G.sage})`, border:"3px solid rgba(255,255,255,0.30)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44 }}>
                {pet.avatarUrl ? <img src={pet.avatarUrl} alt={pet.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span>{pet.avatar}</span>}
              </div>
              <div style={{ position:"absolute", bottom:-4, right:-4, background:G.light, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:G.deep, border:"2px solid #fff" }}>
                {pet.soulPercent}%
              </div>
            </div>

            {/* Hero text */}
            <div style={{ flex:1 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(116,198,157,0.18)", border:"1px solid rgba(116,198,157,0.42)", borderRadius:20, padding:"4px 12px", color:G.light, fontSize:11, fontWeight:600, marginBottom:12 }}>
                🌿 Care for {pet.name}
              </div>
              <div style={{ fontSize:34, fontWeight:900, color:"#FFFFFF", fontFamily:"Georgia,serif", marginBottom:10, lineHeight:1.1 }}>
                How would <span style={{ color:G.light }}>{pet.name}</span> love to be cared for?
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
                {pet.coatType && <SoulChip>🌿 {pet.coatType} coat</SoulChip>}
                {pet.groomingComfort && <SoulChip>✓ {pet.groomingComfort} with grooming</SoulChip>}
                {pet.vaccinated && <SoulChip>💉 Vaccinated</SoulChip>}
                {pet.lastVetVisit && <SoulChip>🏥 Vet: {pet.lastVetVisit}</SoulChip>}
                {pet.dentalHealth && <SoulChip>🦷 Dental: {pet.dentalHealth}</SoulChip>}
              </div>

              {/* Mira quote */}
              <div style={{ background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:8, marginBottom:0 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${G.light},${G.sage})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:G.deep, flexShrink:0, marginTop:1 }}>✦</div>
                <div>
                  <p style={{ fontSize:13, color:"#fff", lineHeight:1.55, fontStyle:"italic", margin:0 }}>
                    "{pet.name}'s {pet.coatType?.toLowerCase() || "beautiful"} coat deserves nothing but the finest care. {pet.groomingComfort === "Comfortable" ? `And the good news — ${pet.name} is comfortable being groomed.` : `We'll make every grooming moment as gentle as possible for ${pet.name}.`}"
                  </p>
                  <span style={{ fontSize:10, color:G.light, display:"block", marginTop:4, fontWeight:600 }}>♥ Mira knows {pet.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ background:"#fff", borderBottom:`1px solid ${G.borderLight}`, display:"flex", padding:"0 0px", overflowX:"auto" }}>
            {[
              { id:"care", label:"🌿 Care at Home" },
              { id:"services", label:"✂️ Services" },
              { id:"wellness", label:"🏥 Wellness" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:"14px 20px", background:"none", border:"none", borderBottom: activeTab === tab.id ? `2.5px solid ${G.sage}` : "2.5px solid transparent", color: activeTab === tab.id ? G.sage : G.mutedText, fontSize:13, fontWeight: activeTab === tab.id ? 700 : 400, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.12s" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAGE BODY ─────────────────────────────────────────── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 32px 0" }}>

        {/* Today's Care Tip */}
        <div style={{ background:"#fff", border:`1px solid ${G.borderLight}`, borderRadius:14, padding:"12px 18px", marginBottom:24, display:"flex", alignItems:"flex-start", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:G.pale, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>💚</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:700, background:G.pale, color:G.sage, borderRadius:20, padding:"2px 8px" }}>Today's Care Tip</span>
              <span style={{ fontSize:11, color:G.hintText }}>{todayTip.category}</span>
            </div>
            <div style={{ fontSize:13, color:G.darkText, lineHeight:1.6 }}>{todayTip.tip}</div>
          </div>
        </div>

        {/* WellnessProfile compact bar */}
        <WellnessProfile pet={pet} onOpen={() => setWellnessOpen(true)} />

        {/* Section header */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:4 }}>
            How would <span style={{ color:G.sage }}>{pet.name}</span> love to be cared for?
          </div>
          <div style={{ fontSize:13, color:G.mutedText, lineHeight:1.6 }}>
            Choose a dimension — everything inside is personalised to {pet.name}'s coat, sensitivities, and comfort.{" "}
            <span style={{ color:G.sage, fontWeight:600 }}>Glowing ones match what {pet.name} needs most right now.</span>
          </div>
        </div>

        {/* Dimension pill cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:8 }}>
          {dims.map(dim => {
            const isOpen  = openDim === dim.id;
            const isGlow  = ["grooming","dental","coat"].includes(dim.id);
            return (
              <div key={dim.id}>
                <div
                  onClick={() => handleDimClick(dim.id)}
                  style={{
                    background: isOpen ? G.greenBg : "#fff",
                    border: isOpen ? `2px solid ${G.sage}` : `1.5px solid ${G.borderLight}`,
                    borderRadius: isOpen ? "14px 14px 0 0" : 14,
                    padding:"16px 12px", cursor:"pointer",
                    textAlign:"center", transition:"all 0.15s",
                    minHeight:160,
                    boxShadow: isGlow && !isOpen ? `0 4px 20px ${dim.glowColor}` : "none",
                    position:"relative",
                  }}
                >
                  {isGlow && !isOpen && (
                    <div style={{ position:"absolute", top:8, right:8, width:8, height:8, borderRadius:"50%", background:G.light, boxShadow:`0 0 6px ${G.light}` }} />
                  )}
                  <div style={{ fontSize:28, marginBottom:10 }}>{dim.icon}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:G.darkText, marginBottom:4 }}>{dim.label}</div>
                  <div style={{ fontSize:12, color:G.mutedText, marginBottom:8 }}>{dim.sub}</div>
                  {dim.badge && (
                    <div style={{ display:"inline-flex", alignItems:"center", gap:4, background: dim.badgeBg, color:"#fff", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700 }}>
                      {dim.badge}
                    </div>
                  )}
                </div>
                {isOpen && <DimExpanded dim={dim} pet={pet} onClose={() => setOpenDim(null)} />}
              </div>
            );
          })}
        </div>

        {/* Guided Care Paths */}
        <div style={{ marginTop:32 }}>
          <GuidedCarePaths pet={pet} />
        </div>

        {/* Care Concierge */}
        <CareConcierge pet={pet} />

      </div>

      {/* ── MIRA FLOATING BUTTON ─────────────────────────────── */}
      <div style={{ position:"fixed", bottom:20, right:20, zIndex:100, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background:`linear-gradient(135deg,${G.sage},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:G.deep, boxShadow:`0 4px 20px rgba(64,145,108,0.50)`, cursor:"pointer" }} onClick={() => {}}>
          ✦
        </div>
        <div style={{ background:`linear-gradient(135deg,${G.deepMid},${G.sage})`, color:"#fff", borderRadius:20, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5, boxShadow:`0 4px 20px rgba(45,106,79,0.40)` }} onClick={() => {}}>
          ✦ Ask Mira
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────
function SoulChip({ children }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:4, borderRadius:20, padding:"4px 10px", fontSize:11, color:"#fff", border:"1px solid rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.10)" }}>
      {children}
    </div>
  );
}
