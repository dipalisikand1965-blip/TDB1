"""
Round 2: rewrite proposals with positive-only commercial language.
No defensive denials ("no rev share", "no commissions") — just confident,
forward-leaning per-member pricing copy.
"""
import requests
from requests.auth import HTTPBasicAuth

PROD = "https://thedoggycompany.com"
AUTH = HTTPBasicAuth("aditya", "lola4304")

UPDATES = {
    # ───────────────────────── HDFC ─────────────────────────
    "hdfc-bank": {
        "partnership_angle": (
            "Sponsor Pet Pass membership for every Regalia and Infinia cardholder at a flat per-member annual fee — "
            "predictable ARR for HDFC, an instant differentiator against ICICI Sapphiro and Axis Magnus, "
            "and a daily-touchpoint benefit your competitors will spend years trying to copy."
        ),
        "pitch_copy": (
            "Your premium cardholders spend ₹47,200 annually on their pets — yet 73% report friction in booking vets, "
            "sourcing quality food, and managing emergencies. Every unmet need is a moment they turn to competitors. "
            "Today's premium cards win on lounges and dining; tomorrow's win on the things that wake their customers up at 2 AM.\n\n"
            "Mira OS integrates directly into your cardholder app, turning HDFC into the command centre for pet life. "
            "One conversational interface handles everything: emergency vet triage at 2 AM, booking groomers, allergy-aware "
            "food orders, celebration planning, even legal paperwork. Backed by 30 years of concierge DNA from "
            "LesConcierges® and Club Concierge®, now scaled through Mira to serve 50,000+ pets.\n\n"
            "The commercial model is refreshingly simple: HDFC sponsors Pet Pass membership for Regalia and Infinia "
            "cardholders at a **flat per-member annual fee**. Predictable ARR you can budget to the rupee. Co-branded "
            "white-label in 4 weeks. Cardholders get unlimited Concierge® access; HDFC gets a daily-life touchpoint that "
            "transforms a transactional card relationship into an emotional one. The cleanest premium-tier benefit you'll ever launch."
        ),
    },

    # ───────────────────────── FEDERAL BANK ─────────────────────────
    "federal-bank": {
        "partnership_angle": (
            "Sponsor 'FedPet Concierge' membership for Imperia and Celeste customers at a flat per-member annual fee — "
            "transforming relationship banking into a daily-touchpoint loyalty engine that compounds across 18 months "
            "of longer customer tenure and 2.1× higher cross-sell."
        ),
        "pitch_copy": (
            "Your premium customers spend ₹7,000 monthly on their pets — yet most banks still treat pet care like a niche. "
            "They're juggling five apps for grooming, three for vets, two for food delivery, and none of them know their pet. "
            "When their Labrador vomits at midnight or they need a last-minute pet sitter, your competitors are silent and so are you. "
            "That's a relationship gap that compounds quietly until they switch.\n\n"
            "Mira OS is the only pet life platform that Federal Bank can white-label at the relationship level. "
            "One conversation handles emergency vet routing, automated vaccination reminders, in-home grooming, travel "
            "coordination, and even tax-receipt management for pet expenses. Sterling — and every other Imperia pet — "
            "gets a 24/7 service layer branded as 'FedPet Concierge'.\n\n"
            "The commercial model is built for clean partnerships. Federal Bank **sponsors Pet Pass membership at a flat "
            "per-member annual fee** — predictable ARR you can plan against, white-labelled and co-branded in weeks. "
            "Customers with pets stay 18 months longer and cross-buy 2.1 more products. We handle every interaction; you own the loyalty."
        ),
    },

    # ───────────────────────── KIWI INSURANCE ─────────────────────────
    "kiwi-insurance": {
        "partnership_angle": (
            "Bundle Pet Pass into every Kiwi policy at a flat per-policy annual fee — a daily preventive-care layer "
            "that drives down claims frequency by 30%+ while building an underwriting data moat no competitor can match."
        ),
        "pitch_copy": (
            "Kiwi's policyholders file claims after problems happen. But 63% of pet emergencies are preventable with the right "
            "daily guidance — guidance buried in apps they never open or vets they can't afford to visit weekly. "
            "Every preventable claim is margin you don't recover, and every silent month between renewals is a relationship that quietly cools.\n\n"
            "Mira OS becomes Kiwi's proactive care layer. She learns Karma's allergy to soy, reminds about vaccinations before "
            "coverage lapses, triages that limp at 11 PM, and surfaces preventive routines tailored to breed-specific risks. "
            "Every interaction generates longitudinal health data — the kind of underwriting intelligence no competitor has, "
            "enabling smarter renewal pricing and lower loss ratios.\n\n"
            "The commercial model is elegant. Kiwi **bundles Pet Pass into every policy at a flat per-policy annual fee**. "
            "Your policyholders get a premium benefit they actually use daily; Kiwi gets predictable cost, dramatically lower "
            "claims frequency, and a defensible data moat. It's the only pet insurance partnership in India where the benefit "
            "improves your underwriting math from day one."
        ),
    },

    # ───────────────────────── REDBERYL ─────────────────────────
    "redberyl": {
        "partnership_angle": (
            "Add Pet Pass as RedBeryl's exclusive 13th lifestyle pillar at a flat per-member annual fee — instant "
            "differentiation against every UHNI concierge in India, deployed as a fully white-labelled experience in 4 weeks."
        ),
        "pitch_copy": (
            "Your members expect seamless service across every aspect of their lives — yet pet care remains fragmented, "
            "unreliable, and beneath their standards. When a Labrador ingests toxins at midnight or a member needs a "
            "last-minute pet-friendly villa in Lonavala, your concierge team is improvising on Google. That's a service gap "
            "your members notice, even if they don't say it out loud.\n\n"
            "Mira OS plugs in as your 13th lifestyle pillar — fully white-labelled inside the RedBeryl experience. 30 years "
            "of concierge DNA, now scaled through Mira: emergency triage in under 90 seconds, premium service coordination "
            "across 12 life pillars, and the kind of pet-specific judgement no global concierge software can replicate.\n\n"
            "The commercial model is built for clean partnerships. RedBeryl **sponsors Pet Pass membership for its UHNI "
            "clients at a flat per-member annual fee** — predictable cost per member, instant pet-pillar capability without "
            "building anything, and a daily touchpoint that keeps RedBeryl present in members' lives in the most emotional "
            "category they have. Co-branded launch in 4 weeks; the only lifestyle concierge in India addressing the UHNI pet-care gap."
        ),
    },

    # ───────────────────────── JAGUAR LAND ROVER ─────────────────────────
    "jaguar-land-rover-india": {
        "partnership_angle": (
            "Gift Pet Pass to every Range Rover and Jaguar buyer as a one-time, flat per-vehicle membership — "
            "making JLR the only luxury automotive brand in India that extends ownership privilege to the four-legged family member."
        ),
        "pitch_copy": (
            "Your customers don't just drive vehicles — they curate lifestyles. Yet when their Labrador vomits at midnight or "
            "they're planning a Shimla road trip with their German Shepherd, they're left scrolling through ten apps that "
            "don't talk to each other. That's a moment of friction in a brand experience built entirely around effortless luxury.\n\n"
            "Mira OS solves this with the same systems thinking JLR applies to terrain response. One conversational "
            "interface handles emergencies, pet-friendly trip planning, nutrition science, breed-specific health guidance, "
            "and even paperwork for international travel. Rover — and every other JLR pet — gets a 24/7 concierge layer "
            "co-branded with the JLR mark. The drive becomes part of a complete lifestyle, not just a destination.\n\n"
            "The commercial model fits luxury automotive perfectly. JLR **gifts Pet Pass membership to every new Range Rover "
            "and Jaguar buyer at a one-time, flat per-vehicle fee**. Your buyers receive a tangible post-purchase benefit "
            "that lasts well beyond the showroom; you capture high-intent lifestyle data from India's most affluent pet-owning "
            "segment; we handle every interaction end-to-end. The only luxury car brand where ownership truly extends to the family."
        ),
    },
}

for slug, patch in UPDATES.items():
    r = requests.get(f"{PROD}/api/admin/partner-demos/{slug}", auth=AUTH, timeout=15)
    r.raise_for_status()
    current = r.json()["demo"]["generated"]
    current.update(patch)

    res = requests.put(
        f"{PROD}/api/admin/partner-demos/{slug}",
        json={"generated": current},
        auth=AUTH,
        timeout=15,
    )
    res.raise_for_status()
    print(f"✓ {slug}")

print()
print("All 5 proposals — positive-only, confident commercial language. ✨")
