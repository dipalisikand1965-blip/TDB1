# The Doggy Company /celebrate Complete Copy & Content Specification
## For Aditya — Ready to Build
## Version 1.0 | March 13, 2026

---

## How to Read This Document

- **Gold labels** = copy that goes into the UI exactly as written (with {petName} replaced dynamically)
- **Purple italic notes** = developer instructions, not visible copy
- **{petName}** = dynamic variable pulled from pet soul profile
- **{petPersonality}** = e.g. Social Butterfly, Gentle Soul, Adventure Seeker
- **{petFavourite}** = pet's top favourite thing (salmon, tennis balls, walks, etc.)
- **{petAllergy}** = pet's known allergen(s)
- **{userCity}** = pet parent's city for location-aware content

---

## THE PAGE SPINE (Complete Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│  1. THE ARRIVAL (Hero)                                      │
│     Mojo · Soul 89% · Soul Chips · Mira's Voice             │
├─────────────────────────────────────────────────────────────┤
│  2. CATEGORY STRIP (for direct shoppers)                    │
│     All | Birthday Cakes | Breed Cakes | Pupcakes | ...     │
├─────────────────────────────────────────────────────────────┤
│  3. "HOW WOULD {petName} LOVE TO CELEBRATE?"                │
│     8 Soul Pillars (glowing, dim, or incomplete states)     │
│     ┌──────────┬──────────┬──────────┬──────────┐          │
│     │ Food &   │ Play &   │ Social & │Adventure │          │
│     │ Flavour  │ Joy      │ Friends  │ & Move   │          │
│     ├──────────┼──────────┼──────────┼──────────┤          │
│     │Grooming &│Learning &│ Health & │ Love &   │          │
│     │ Beauty   │ Mind     │ Wellness │ Memory   │          │
│     └──────────┴──────────┴──────────┴──────────┘          │
│     [CLICK] → Pillar expands with tabs inside               │
├─────────────────────────────────────────────────────────────┤
│  4. MIRA'S BIRTHDAY BOX (Build it yourself)                 │
│     Dark purple · "The {petName} Birthday Box"              │
│     Curated items · [Build {petName}'s Box]                 │
├─────────────────────────────────────────────────────────────┤
│  5. CELEBRATE CONCIERGE® (Hand it over)                     │
│     Gold/Purple · "Want us to handle everything?"           │
│     100% handled for you · [Talk to your Concierge]         │
├─────────────────────────────────────────────────────────────┤
│  6. GUIDED CELEBRATION PATHS (Follow a path)                │
│     Birthday Party | Gotcha Day | Pet Photoshoot            │
├─────────────────────────────────────────────────────────────┤
│  7. CELEBRATION WALL (Share the joy)                        │
│     Community moments · Real dogs · Real celebrations       │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. THE ARRIVAL — Hero Component
**◆ CelebrateHero.jsx**

### 1.1 Announcement Bar (top of page)
```
✦ The World's First Pet Life Operating System — Your Pet Concierge®
```
*[DEV NOTE] This is global — same across all pages. Do not change.*

### 1.2 Soul Progress Eyebrow
*[DEV NOTE] Appears above the hero title. Pulls from soul completion API.*

- **When soul < 100%:**
  ```
  👑 {petName}'s soul is {soulScore}% discovered — keep going!
  ```
- **When soul = 100%:**
  ```
  ✦ {petName}'s soul is fully known. Mira knows everything.
  ```

### 1.3 Hero Title
```
Celebrations for {petName}
```
*[DEV NOTE] {petName} renders in pink (#ff8ec7). Background is deep purple gradient.*

### 1.4 Hero Subtitle
```
Mark the moments that matter — the way {petName} actually lives
```
*[DEV NOTE] This line is key. It signals this is not a generic shop.*

### 1.5 Soul Chips (3 chips below subtitle)
*[DEV NOTE] Chips are dynamic from pet soul data. Show max 3. Priority order: allergy first (safety), then loves, then personality.*

- **Chip 1 — Allergy (always show if present):**
  ```
  🚫 Allergy: {petAllergy}
  ```
  *[DEV NOTE] If no allergy: skip this chip. Never show 'Allergy: none'.*

- **Chip 2 — Loves:**
  ```
  ⭐ Loves: {petFavourite1} · {petFavourite2} · {petFavourite3}
  ```
  *[DEV NOTE] Pull top 3 favourites. Separator is · (middle dot). If fewer than 3, show what's available.*

- **Chip 3 — Personality:**
  ```
  ✦ {trait1} · {trait2} · {petPersonality}
  ```
  *[DEV NOTE] Pull top 2 personality traits + soul archetype. E.g. 'Playful · Loyal · Social Butterfly'*

### 1.6 Mira's Quote Card
*[DEV NOTE] Sits at the bottom of the hero. This is Mira's voice — warm, knowing, personal.*

- **Default (celebration context):**
  ```
  "Every day with {petName} is worth celebrating — especially the ones with {petFavourite1} and {petFavourite2}!"
  ♥ Mira knows {petName}
  ```

- **If upcoming birthday detected:**
  ```
  {petName}'s birthday is in {daysUntilBirthday} days. Mira is already thinking about how to make it perfect.
  ```

- **If today is birthday:**
  ```
  "Today is the most important day of the year. Happy birthday, {petName}. You are so loved."
  ```

---

## 2. CATEGORY STRIP
**◆ CategoryStrip.jsx — existing component, repositioned**

*[DEV NOTE] Sits between hero and pillars. For direct shoppers who know what they want. No copy changes needed — this is a visual navigation element.*

**Categories (left to right):**
```
All | Celebrate (active state — purple gradient pill) | Birthday Cakes 🎂 | Breed Cakes 🐾 | Pupcakes & Dognuts 🧁 | Desi Treats 🍖 | Gift Hampers 🎁 | Party Items 🎀 | Premium 👑
```

*[DEV NOTE] Category strip does NOT personalise. It's a browse mode for users who skip the pillar flow.*

---

## 3. SOUL CELEBRATION PILLARS
**◆ SoulCelebrationPillars.jsx + SoulPillarExpanded.jsx**

### 3.0 Section Header
- **Heading:** `How would {petName} love to celebrate?`
- **Subheading:** `Choose a pillar — everything inside is personalised to {petName}'s soul profile. Glowing ones match who {petName} is.`

### 3.1 Pillar States — THREE States per Card

| State | Visual | Badge | Behaviour |
|-------|--------|-------|-----------|
| **GLOW** | Full opacity, coloured dot top-right | Personality-matched label | Expands to show products |
| **DIM** | 60% opacity, no dot | "Explore" | Still expands to show products |
| **INCOMPLETE** | 50% opacity, lock icon | "Tell Mira more" | Opens soul builder for that pillar |

*[DEV NOTE] INCOMPLETE state is the new third state — turns empty data into a soul-building moment.*

---

### 3.2 THE 8 PILLARS — Complete Specification

---

#### 🍰 PILLAR 1: Food & Flavour
| Field | Value |
|-------|-------|
| **Color** | Yellow (#FEF3C7) |
| **Icon** | 🍰 |
| **Tagline** | Salmon cake, allergy-safe treats, birthday feast |
| **Glow badge** | Mojo loves this |
| **Glow when** | Pet has defined food preferences OR favourite protein in soul profile |
| **Dim badge** | Explore |
| **Incomplete badge** | Complete {petName}'s food preferences to unlock |
| **Mira says (expanded)** | "We know {petName} loves {petFavourite1} and can't have {petAllergy}. Every item here is checked. Nothing that would hurt them, everything that makes them happy." |
| **Tabs inside** | Birthday Cakes \| Breed Cakes \| Pupcakes \| Desi Treats \| Gift Hampers \| Treat Boxes |
| **Sample products** | Salmon Birthday Cake ₹999 · Indie Breed Cupcake ₹549 · Salmon Treat Box ₹449 · Birthday Hamper ₹1,499 |

---

#### 🎾 PILLAR 2: Play & Joy
| Field | Value |
|-------|-------|
| **Color** | Green (#D1FAE5) |
| **Icon** | 🎾 |
| **Tagline** | Toys, enrichment, activity kits — the language {petName} speaks |
| **Glow badge** | Top soul pillar |
| **Glow when** | Pet energy level is high OR pet has listed favourite toys in soul profile |
| **Dim badge** | Explore |
| **Incomplete badge** | Tell Mira what {petName} loves to play with |
| **Mira says (expanded)** | "{petName} is at their best when they're playing. This isn't just a gift — it's speaking their language. We picked everything based on their energy and what makes them come alive." |
| **Tabs inside** | Toys & Enrichment \| Activity Kits \| Gift Wrap a Toy \| Outdoor Play |
| **Sample products** | Birthday Tennis Ball Set ₹349 · Puzzle Enrichment Box ₹699 · Play Birthday Kit ₹899 · Activity Adventure Box ₹1,199 |

---

#### 🦋 PILLAR 3: Social & Friends
| Field | Value |
|-------|-------|
| **Color** | Pink (#FCE7F3) |
| **Icon** | 🦋 |
| **Tagline** | Pawty planning, playdate magic, the full celebration |
| **Glow badge** | {petPersonality} |
| **Glow when** | Pet soul archetype includes Social Butterfly OR behaviour with dogs = Loves all dogs |
| **Dim badge** | Explore |
| **Incomplete badge** | Tell Mira how {petName} is with other dogs |
| **Mira says (expanded)** | "{petName} is a {petPersonality} — they shine when they're surrounded by the dogs and people they love. Invite Bruno and Cookie. Make this a day everyone remembers." |
| **Tabs inside** | Pawty Packages \| Playdate Planning \| Party Accessories \| Digital Invitations |
| **Sample products** | Ultimate Pawty Package ₹2,999 · Party Starter Kit ₹449 · Playdate Gift Box ₹799 · Digital Pawty Invite ₹199 |

---

#### 🌅 PILLAR 4: Adventure & Move
| Field | Value |
|-------|-------|
| **Color** | Blue (#DBEAFE) |
| **Icon** | 🌅 |
| **Tagline** | Sunrise walks, trail outings, the celebrations that move |
| **Glow badge** | {petName}'s happy place |
| **Glow when** | Pet loves walks OR car rides OR outdoor activities in soul profile |
| **Dim badge** | Explore |
| **Incomplete badge** | Tell Mira if {petName} loves adventures |
| **Mira says (expanded)** | "Some dogs celebrate best with a cake. {petName} celebrates best with movement. A new trail. A sunrise walk. An outing to somewhere they've never been. That's the gift." |
| **Tabs inside** | Experiences \| Adventure Gear \| Trail Kits \| Dog-Friendly Places |
| **Sample products** | Sunrise Birthday Walk ₹1,499 · Adventure Birthday Kit ₹899 · Indie Trail Harness ₹1,299 · Dog-Friendly Outing Guide Free |

---

#### ✨ PILLAR 5: Grooming & Beauty
| Field | Value |
|-------|-------|
| **Color** | Lavender (#EDE9FE) |
| **Icon** | ✨ |
| **Tagline** | Birthday pamper, bandanas, spa — looking the part |
| **Glow badge** | Pamper day |
| **Glow when** | Pet has grooming preferences OR coat type defined in soul profile |
| **Dim badge** | Explore |
| **Incomplete badge** | Tell Mira about {petName}'s coat and grooming routine |
| **Mira says (expanded)** | "Every celebration deserves a moment of beauty. {petName} doesn't just deserve a good day — they deserve to look exactly how they feel on the inside." |
| **Tabs inside** | Pamper Sessions \| Birthday Bandanas \| Spa Kits \| At-Home Grooming |
| **Sample products** | Birthday Grooming Session ₹999 · Custom Name Bandana ₹299 · At-Home Spa Kit ₹649 · Birthday Crown Set ₹199 |

---

#### 🧠 PILLAR 6: Learning & Mind
| Field | Value |
|-------|-------|
| **Color** | Rose (#FECDD3) |
| **Icon** | 🧠 |
| **Tagline** | New skills, puzzle toys, the celebration that grows {petName} |
| **Glow badge** | Bright mind |
| **Glow when** | Pet intelligence level is high OR pet has mastered basic training in soul profile |
| **Dim badge** | Explore |
| **Incomplete badge** | Tell Mira about {petName}'s learning style |
| **Mira says (expanded)** | "The best birthday gift isn't always the biggest one. Sometimes it's a new thing to figure out. A puzzle. A trick. A skill they'll carry their whole life." |
| **Tabs inside** | Enrichment \| Training Gifts \| Puzzle Toys \| New Skill Kits |
| **Sample products** | Snuffle Mat ₹549 · Training Session Gift ₹799 · Puzzle Toy Set ₹699 · New Trick Kit ₹399 |

---

#### 💚 PILLAR 7: Health & Wellness
| Field | Value |
|-------|-------|
| **Color** | Mint (#D1FAE5) |
| **Icon** | 💚 |
| **Tagline** | Wellness gifts, supplements, the most loving thing you can give |
| **Glow badge** | Long healthy life |
| **Glow when** | Pet has health conditions noted OR pet is senior (7+ years) in soul profile |
| **Dim badge** | Explore |
| **Incomplete badge** | Tell Mira about {petName}'s health history |
| **Mira says (expanded)** | "The most loving celebration for {petName} is one that protects their tomorrows. This is not a clinical gift. It is the deepest kind of love." |
| **Tabs inside** | Wellness Gifts \| Supplements \| Vet Gift Cards \| Annual Care Plans |
| **Sample products** | Wellness Hamper ₹1,299 · Vet Check Gift Card ₹999 · Calming Kit ₹549 · Annual Health Plan ₹2,499 |

---

#### 📸 PILLAR 8: Love & Memory
| Field | Value |
|-------|-------|
| **Color** | Blush (#FECDD3) |
| **Icon** | 📸 |
| **Tagline** | Photoshoots, portraits, the birthday that lives forever |
| **Glow badge** | Keep them forever |
| **Glow when** | Pet has a birthday registered OR gotcha day in soul profile |
| **Dim badge** | Explore |
| **Incomplete badge** | Add {petName}'s birthday to unlock memory gifts |
| **Mira says (expanded)** | "One day you will look at a photo from this birthday and it will hold you. Let's make sure that photo exists. Let's make sure this day is captured the way {petName} deserves." |
| **Tabs inside** | Photoshoots \| Watercolour Portraits \| Memory Books \| Keepsakes |
| **Sample products** | Birthday Photoshoot ₹2,999 · Watercolour Portrait ₹1,799 · Birthday Memory Book ₹1,299 · Custom Keychain ₹299 |

---

## 4. MIRA'S CURATED BOX
**◆ MiraCuratedBox.jsx**

*[DEV NOTE] Dark purple gradient card. Sits between pillars and Concierge. One curated suggestion — not a grid. Mira's voice, active and personal.*

### 4.1 Badge
```
✦ Mira's pick for {petName}'s birthday
```

### 4.2 Title
```
The {petName} Birthday Box
```

### 4.3 Description
```
Mira has built one celebration that covers who {petName} actually is — {miraCuratedItem1}, {miraCuratedItem2}, a birthday bandana, and a memory card. Everything {petName} loves. Nothing they can't have.
```
*[DEV NOTE] {miraCuratedItem1} = their favourite food (e.g. 'a salmon cake'). {miraCuratedItem2} = their favourite toy gift-wrapped (e.g. 'a tennis ball gift-wrapped'). Dynamically generated from soul data.*

### 4.4 Item Tags
*[DEV NOTE] Show 4 items + '+ N more' if curated box has more.*
```
🎂 Salmon birthday cake · 🎾 Birthday tennis ball · 🎀 Custom bandana · 💌 Memory card · + 2 more
```

### 4.5 CTA Button
```
🎉 Build {petName}'s Box
```
*[DEV NOTE] Opens box builder modal or flow. Box is pre-populated with Mira's choices. User can swap items.*

### 4.6 Right Side Panel
- **Icon:** ✦ (Mira star, gradient circle)
- **Label below icon:** `Mira knows {petName}`

---

## 5. CELEBRATE CONCIERGE®
**◆ CelebrateConcierge.jsx**

*[DEV NOTE] This is not a product section. It is a door. One card. Dark background with gold. Sits between Mira's Box and Guided Paths.*
*[DEV NOTE] Design: left side = copy + services + CTA. Right side = crown icon, stat, promise. Two-column layout.*

### 5.1 Gold Badge
```
👑 Celebrate Concierge®
```

### 5.2 Headline
```
Want us to handle everything?
```

### 5.3 Body Copy
```
You tell us what {petName} deserves. We plan, source, coordinate and deliver the entire celebration — the cake, the venue, the photographer, the guest treats, the surprise moment. You just show up and love them.
```

### 5.4 Service Tags
```
🎂 Custom cake design | 📸 Professional photography | 🎉 Venue & decoration | 🐾 Guest treat bags | 💌 Invitations | + anything {petName} needs
```

### 5.5 CTA Button
```
👑 Talk to your Concierge
```
*[DEV NOTE] Gold button (#C9973A text, gold border). This leads to concierge intake flow — not a generic contact form.*

### 5.6 Right Panel
- **Crown icon** (gold circle)
- **Stat:** `100%`
- **Stat label:** `handled for you`
- **Promise copy (5 lines):**
  ```
  One concierge.
  Every detail.
  Nothing forgotten.
  {petName} at the centre of everything.
  ```

---

## 6. GUIDED CELEBRATION PATHS
**◆ GuidedPaths.jsx — existing, simplified**

### 6.0 Section Header
- **Heading:** `Guided celebration paths`
- **Subheading:** `Follow a structured journey — Mira walks you through every step.`

### 6.1 Birthday Party Path
| Field | Value |
|-------|-------|
| **Icon** | 🎂 |
| **Background** | warm amber |
| **Title** | Birthday party path |
| **Description** | From theme to cake to guest list — plan {petName}'s full birthday in one guided flow. |
| **Steps shown** | Choose theme · Order cake · Guest list · + 2 more |

### 6.2 Gotcha Day Path
| Field | Value |
|-------|-------|
| **Icon** | 🏠 |
| **Background** | soft green |
| **Title** | Gotcha day path |
| **Description** | Celebrate the day {petName} chose you. A quieter, more personal kind of celebration. |
| **Steps shown** | Find the date · Memory book · + 2 more |

### 6.3 Pet Photoshoot Path
| Field | Value |
|-------|-------|
| **Icon** | 📸 |
| **Background** | soft pink |
| **Title** | Pet photoshoot path |
| **Description** | From outfit to location to photographer — capture {petName} at their most beautiful. |
| **Steps shown** | Choose location · Plan outfit · + 2 more |

---

## 7. CELEBRATION WALL
**◆ CelebrationWall.jsx — existing, kept**

### 7.1 Section Header
- **Heading:** `Celebration wall`
- **Subheading:** `Real moments of joy from our pet parent community 💕`

### 7.2 Action Buttons
- **Button 1:** `✦ Create album`
- **Button 2:** `📷 Share your story`

### 7.3 Add Photo Card (first card, always)
- **Icon:** 📷 (purple gradient square)
- **Title:** Share your story
- **Body:** Celebrate your pet's special moments with our community
- **Button:** ✦ Add photo

### 7.4 Community Cards
*[DEV NOTE] Pulls from community database. Each card shows: dog name, city, occasion badge, caption, heart count.*

**Occasion badge options:** 🎂 Birthday · 🏠 Gotcha Day · 🎉 Party · 📸 Photoshoot

---

## 8. EMPTY STATES & EDGE CASES

### 8.1 No Pet Registered
- **Hero title:** `Celebrations for your pet`
- **Hero subtitle:** `Add your pet to unlock a personalised celebration experience.`
- **CTA:** `✦ Add your pet to begin`
- *[DEV NOTE] Soul chips do not show. Mira quote does not show. Pillars show in dim state, all with 'Add your pet' badge.*

### 8.2 Soul Profile Very Incomplete (< 40%)
- **Eyebrow:** `✦ Help Mira know {petName} better`
- **Mira quote:** `"I'm still getting to know {petName}. The more you tell me, the better I can celebrate them."`
- *[DEV NOTE] Show 'Tell Mira more' badge on most pillars. Max 2 pillars can glow at this stage.*

### 8.3 Birthday Not Set
- **Mira quote variant:** `"I'd love to know when {petName}'s birthday is — so I can start planning something special."`
- **CTA inside quote:** `Add {petName}'s birthday →`

### 8.4 Multiple Pets
*[DEV NOTE] Pet selector appears at top right (existing My Pets dropdown). Hero personalises to whichever pet is selected. All pillars, Mira box, and Concierge copy update dynamically when pet is switched.*

### 8.5 Pillar — No Products Available
- **Empty state inside expanded pillar:** `We're curating the perfect {pillarName} items for {petName}. Ask Mira for personalised suggestions while we get these ready.`
- **CTA:** `✦ Ask Mira`

---

## 9. MIRA'S VOICE — TONE GUIDE FOR CELEBRATE
*For Aditya — for any AI-generated or dynamic copy*

*[DEV NOTE] Mira speaks throughout /celebrate. This section captures her voice so all dynamic copy stays consistent.*

### 9.1 Mira's Personality on /celebrate
- **Warm, not saccharine** — she loves these animals genuinely
- **Specific, not generic** — she uses pet names, actual preferences, real details
- **Confident, not pushy** — she suggests, she doesn't sell
- **Grief-aware** — she knows some pet parents are celebrating while carrying loss
- **Joyful** — celebrate pages are the lightest pages; Mira can be a little more playful here

### 9.2 Dos
- Use {petName} in every Mira quote — never say 'your pet'
- Reference specific soul data — allergy, favourite food, personality archetype
- Short sentences in Mira quotes — she speaks like she knows you
- End Mira quotes on warmth — not on a CTA

### 9.3 Don'ts
- Never say 'your fur baby' — too generic
- Never use the word 'purchase' — use 'add', 'get', 'book', 'gift'
- Never say 'we think you'll love' — Mira knows, she doesn't guess
- Never write Mira in third person on the page — she speaks as herself

### 9.4 Sample Mira Lines by Context
| Context | Mira Says |
|---------|-----------|
| **When pet loves food** | "{petName} lives for {petFavourite1}. Everything in this pillar is built around that. No {petAllergy}. All {petFavourite1}." |
| **When pet is a Social Butterfly** | "This dog was born to be celebrated in a room full of friends. Invite everyone. {petName} will do the rest." |
| **When pet is a senior** | "Every birthday at this age is a gift. Celebrate {petName} like you mean it. Because you do." |
| **When today is the birthday** | "Today is the day. Everything else can wait. {petName} first." |

---

## MOBILE CONSIDERATION

*[DEV NOTE] On mobile, when pillar expands, consider:*
- **Option A:** Expanded content slides down inline (current mockup behaviour)
- **Option B:** Expanded content opens as full-screen drawer from bottom
- **Recommendation:** Use Option B on mobile (< 768px) for better thumb reach and less scroll confusion

---

## FILES TO CREATE

| File | Purpose |
|------|---------|
| `components/celebrate/CelebrateHero.jsx` | Hero with soul chips and Mira's quote |
| `components/celebrate/SoulCelebrationPillars.jsx` | 8 pillar cards with glow/dim/incomplete states |
| `components/celebrate/SoulPillarExpanded.jsx` | Expanded view with tabs and filtered products |
| `components/celebrate/MiraCuratedBox.jsx` | "The {petName} Birthday Box" |
| `components/celebrate/CelebrateConcierge.jsx` | Gold/purple Concierge handoff section |
| `pages/CelebratePage.jsx` | Refactored page using new spine |

---

*The Doggy Company · /celebrate copy spec · For Aditya*
*Version 1.0 · March 13, 2026*
