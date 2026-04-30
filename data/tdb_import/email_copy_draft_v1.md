# Founding Member Launch Emails — Copy Draft for Dipali

**Tone:** Mira's voice. Soft. Specific. No marketing jargon. Built in memory of Mystique.
**Length:** Short. The page does the heavy lifting.
**Goal:** They click. They land on `/founding-member/:token`. They feel seen.

---

## TIER 1 — COMPLETE (Birthday + Pet Name + Intelligence)

For parents like Balaji (Shakti, Nov), Renuka (Halla), Ronan (Nirvana, Oct).
Records: ~5,203

**Subject:**
```
[Pet]'s birthday is [Month] — we remembered. 🌷
```
*Example: Shakti's birthday is November — we remembered. 🌷*

**Preheader (preview text):**
```
Your founding place is held. Free until May 2027.
```

**Body:**
```
Hi [FirstName],

We remembered [Pet]'s birthday.
We remembered [Pet] loves [favourite_protein].
We remembered the [last_cake_flavour] cake we made for you.

For [years_with_tdb] years, you trusted us with the small things —
[total_cakes] cakes, [total_orders] orders, [city] to here.

The Doggy Bakery is now The Doggy Company.
Same hands. Bigger home. Pet Life OS.

We saved [Pet]'s founding place.
Free until May 2027 · Founding discount, forever · No card needed.

→ Claim [Pet]'s place
[CTA button → /founding-member/:token]

With care,
Dipali, Aditya, Roji & Mira
The Doggy Company

⚘ Built in memory of Mystique.
```

---

## TIER 2 — HIGH (Pet Name known, no birthday)

For parents we know the pet but not their full birthday/intelligence.
Records: ~18,233 + 1,022 (HIGH + MEDIUM)

**Subject:**
```
We remembered [Pet]. 🐾
```
*Example: We remembered Mac. 🐾*

**Preheader:**
```
From The Doggy Bakery to The Doggy Company — your founding place is held.
```

**Body:**
```
Hi [FirstName],

We remembered [Pet].

[total_orders] orders. [total_cakes] cakes.
[years_with_tdb] years. [city].

The small things you've trusted us with — they built this.

The Doggy Bakery is now The Doggy Company.
Same hands. Bigger home. Pet Life OS.

[Pet]'s founding place is saved.
Free until May 2027 · Founding discount, forever · No card needed.

→ Claim [Pet]'s place
[CTA button → /founding-member/:token]

With care,
Dipali, Aditya, Roji & Mira
The Doggy Company

⚘ Built in memory of Mystique.
```

---

## TIER 3 — MINIMAL (No pet name, sparse intelligence)

For older customers, never-ordered prospects, partial records.
Records: ~12,868 + 2,699 (MINIMAL + LOW)

**Subject:**
```
From The Doggy Bakery to The Doggy Company — your founding place. 🌷
```

**Preheader:**
```
You were here before we were here. We saved you a place.
```

**Body:**
```
Hi [FirstName],

You were here before we were here.

The Doggy Bakery — Bangalore, 2023 to today —
is now The Doggy Company.
Same hands. Bigger home.
A Pet Life OS for the way you actually live with your dog.

Your founding place is held.
Free until May 2027 · Founding discount, forever · No card needed.

→ Claim your founding place
[CTA button → /founding-member/:token]

If your pet's name is missing here,
we'll get to know them when you arrive.
That's the whole idea.

With care,
Dipali, Aditya, Roji & Mira
The Doggy Company

⚘ Built in memory of Mystique.
```

---

## VARIABLE TOKENS (auto-substituted by orchestrator)

| Token | Source | Fallback |
|---|---|---|
| `[FirstName]` | `parent.first_name` | "Friend" |
| `[Pet]` | `primary_pet.name` or `parent.primary_pet_name` | (skipped — uses MINIMAL template) |
| `[Month]` | `MONTH_NAMES[primary_pet.birthday_month - 1]` | (skipped — uses HIGH template) |
| `[favourite_protein]` | `parent.favourite_protein` (titlecased, snake→space) | omit line |
| `[last_cake_flavour]` | `parent.last_cake_flavour` | omit line |
| `[years_with_tdb]` | `round(parent.years_with_tdb, 1)` | omit line |
| `[total_cakes]` | `parent.total_cakes` | omit line |
| `[total_orders]` | `parent.total_orders` | "many" |
| `[city]` | `parent.city` | omit |
| `[invite_token]` | `parent.invite_token` | required |

**Sanity rules:**
- If `total_cakes == 0`, drop the cakes line.
- If `years_with_tdb < 0.5`, write "Less than a year" instead of "0.4 years".
- If `total_orders < 3`, drop the "X orders, Y cakes" stats line entirely.
- If `last_cake_flavour` is generic ("Custom") or missing, drop it.
- If parent has multiple pets in `pets_staging_ids`, use primary's name in subject + add "(and the rest of your home)" inline.

---

## RHYTHM & SEND DETAILS

| Wave | Date | Audience | Volume |
|---|---|---|---|
| **Soft launch** | Wed, May 14 | 10 VIPs (Balaji, Renuka, Anupama, Aanchal, Sumana, Halla, +4) + Shreesha + Ronan personally by Dipali on WhatsApp | ~12 |
| **Full launch — Day 1** | Thu, May 15 | First 2,000 (sorted by `intelligence_tier=COMPLETE` first, then by `last_order_date desc`) | 2,000 |
| **Daily** | May 16–21 | 2,000/day in waves | ~12,000 over 6 days |
| **Tail** | May 22+ | Remainder (mostly MINIMAL tier, never-ordered) | ~26,000 |

**Send window:** 10:00–10:30 AM IST (Mira's morning hour).
**Auto-pause trigger:** Bounce rate > 5% on any 1,000-message window.
**Resend retry:** 2 attempts, 24h apart, soft-bounce only.

---

## FROM / REPLY-TO

```
From:     Dipali at The Doggy Company <hello@thedoggycompany.com>
Reply-To: hello@thedoggycompany.com
List-Unsubscribe: <mailto:unsub@thedoggycompany.com?subject=unsub-[customer_key]>
                  <https://thedoggycompany.com/unsubscribe?token=[invite_token]>
```

---

## ONE TINY EXTRA THING

Each email's footer carries a **micro-signal** based on tier:

- **COMPLETE** → "P.S. — [Pet]'s next birthday nudge will land 7 days before. We'll be there."
- **HIGH** → "P.S. — Tell us [Pet]'s birthday and we'll remember it forever."
- **MINIMAL** → "P.S. — When you claim your place, we start listening. That's the only difference."

These are deliberate, not filler. Each one tees up the next interaction.
