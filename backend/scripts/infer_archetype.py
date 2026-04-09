"""
Soul Archetype Inference Script
Evaluates doggy_soul_answers for all pets and assigns primary_archetype.

10 Archetypes:
1. Velcro Baby       — attachment + separation anxiety
2. Social Butterfly  — loves other dogs + high energy + people-seeking
3. Wild Explorer     — high energy + outdoor + pulls leash + adventurous
4. Drama Queen       — vocal + noise-sensitive + stranger-reactive
5. Lone Wolf         — independent + low energy + not food/social-driven
6. Foodie            — food motivated + treat responsive
7. Gentle Soul       — shy + calm + non-reactive + gentle
8. Guardian          — protective + cautious + attached to one person
9. Playful Spirit    — playful + moderate-high energy + social + fun
10. Curious Mind     — curious + learns well + moderate energy
"""

import asyncio
import os
import json
import gzip
from motor.motor_asyncio import AsyncIOMotorClient


# ─── Normalisation helpers ───────────────────────────────────────────────────

def _norm(val) -> str:
    """Lower-case string from any raw field value."""
    if val is None:
        return ""
    if isinstance(val, list):
        return " ".join(str(v) for v in val).lower()
    return str(val).lower().strip()


def _has(val, *keywords) -> bool:
    """True if any keyword appears anywhere in the normalised value."""
    text = _norm(val)
    return any(k in text for k in keywords)


# ─── Archetype scorer ────────────────────────────────────────────────────────

def _infer_archetype(soul: dict) -> tuple[str, str]:
    """
    Returns (archetype_name, reason_string).
    Uses a point-based scoring system across 10 archetypes.
    """
    if not soul or not isinstance(soul, dict):
        return "Playful Spirit", "Default: no soul profile data available"

    # Convenience reads
    energy        = _norm(soul.get("energy_level") or soul.get("activity_level") or soul.get("exercise_pref") or "")
    food_mot      = _norm(soul.get("food_motivation") or "")
    sep_anxiety   = _norm(soul.get("separation_anxiety") or soul.get("alone_comfort") or soul.get("alone_time_comfort") or "")
    attention     = _norm(soul.get("attention_seeking") or "")
    social_pref   = _norm(soul.get("social_preference") or soul.get("social_with_dogs") or soul.get("other_pets") or "")
    barking       = _norm(soul.get("barking") or "")
    loud_sounds   = _norm(soul.get("loud_sounds") or "")
    stranger      = _norm(soul.get("stranger_reaction") or soul.get("social_with_strangers") or "")
    leash         = _norm(soul.get("leash_behavior") or "")
    behav_issues  = _norm(soul.get("behavior_issues") or soul.get("problematic_behaviors") or soul.get("problem_behaviors") or "")
    temperament   = _norm(soul.get("temperament") or soul.get("personality_primary") or soul.get("personality_tag") or "")
    describe      = _norm(soul.get("describe_3_words") or "")
    fav_spot      = _norm(soul.get("favorite_spot") or soul.get("sleep_spot") or soul.get("sleep_location") or "")
    fav_activity  = _norm(soul.get("favorite_activity") or "")
    general_nat   = _norm(soul.get("general_nature") or "")
    train_resp    = _norm(soul.get("training_response") or soul.get("motivation_type") or "")
    most_attached = _norm(soul.get("most_attached_to") or "")
    curiosity     = _norm(soul.get("curiosity_level") or "")
    learn_level   = _norm(soul.get("learn_level") or soul.get("training_level") or "")
    lives_with    = _norm(soul.get("lives_with") or soul.get("behavior_with_dogs") or "")
    play_style    = _norm(soul.get("play_style") or "")
    fav_treats    = _norm(soul.get("favorite_treats") or soul.get("favourite_treat") or soul.get("treat_preference") or "")

    # Keys are snake_case to match ARCHETYPE_TONES dicts in whatsapp_routes.py + mira_routes.py
    scores = {
        "velcro_baby":      0,
        "social_butterfly": 0,
        "wild_explorer":    0,
        "drama_queen":      0,
        "lone_wolf":        0,
        "foodie":           0,
        "gentle_soul":      0,
        "guardian":         0,
        "playful_spirit":   0,
        "curious_mind":     0,
    }
    # Human-readable display labels
    DISPLAY = {
        "velcro_baby":      "Velcro Baby",
        "social_butterfly": "Social Butterfly",
        "wild_explorer":    "Wild Explorer",
        "drama_queen":      "Drama Queen",
        "lone_wolf":        "Lone Wolf",
        "foodie":           "Foodie",
        "gentle_soul":      "Gentle Soul",
        "guardian":         "Guardian",
        "playful_spirit":   "Playful Spirit",
        "curious_mind":     "Curious Mind",
    }

    reasons = {k: [] for k in scores}

    # ── 1. velcro_baby ─────────────────────────────────────────────────────
    if _has(attention, "yes") or _has(attention, "constant", "very"):
        scores["velcro_baby"] += 3
        reasons["velcro_baby"].append("attention-seeking")
    if _has(sep_anxiety, "moderate", "severe", "high", "anxious", "gets anxious"):
        scores["velcro_baby"] += 3
        reasons["velcro_baby"].append("separation anxiety")
    if _has(most_attached, "me", "family", "everyone"):
        scores["velcro_baby"] += 1
        reasons["velcro_baby"].append("deeply attached")
    if _has(sleep_loc := _norm(soul.get("sleep_location") or soul.get("sleeping_spot") or ""), "bed", "your bed", "human"):
        scores["velcro_baby"] += 1
        reasons["velcro_baby"].append("sleeps with you")

    # ── 2. social_butterfly ────────────────────────────────────────────────
    if _has(lives_with, "loves all dogs", "dog", "friendly") or _has(social_pref, "dog", "other dog"):
        scores["social_butterfly"] += 3
        reasons["social_butterfly"].append("loves other dogs")
    if _has(energy, "high"):
        scores["social_butterfly"] += 2
        reasons["social_butterfly"].append("high energy")
    if _has(general_nat, "friendly", "social", "playful") or _has(describe, "social", "friendly"):
        scores["social_butterfly"] += 2
        reasons["social_butterfly"].append("friendly nature")
    if _has(stranger, "approaches", "loves", "friendly", "very social"):
        scores["social_butterfly"] += 1
        reasons["social_butterfly"].append("loves strangers too")

    # ── 3. wild_explorer ──────────────────────────────────────────────────
    if _has(energy, "high", "very_high", "very high"):
        scores["wild_explorer"] += 2
        reasons["wild_explorer"].append("high energy")
    if _has(fav_spot, "outdoors", "garden", "outside", "park") or _has(fav_activity, "outdoor", "fetch", "swim", "run", "hike"):
        scores["wild_explorer"] += 2
        reasons["wild_explorer"].append("outdoor lover")
    if _has(leash, "pulls", "sometimes") or _has(behav_issues, "pulling", "pull"):
        scores["wild_explorer"] += 3
        reasons["wild_explorer"].append("pulls on leash")
    if _has(describe, "adventurous", "explorer", "energetic", "wild"):
        scores["wild_explorer"] += 1
        reasons["wild_explorer"].append("adventurous spirit")
    if _has(fav_activity, "running", "fetch", "hiking", "swimming"):
        scores["wild_explorer"] += 1
        reasons["wild_explorer"].append("action-oriented")

    # ── 4. drama_queen ────────────────────────────────────────────────────
    if _has(barking, "frequent", "often", "occasionally", "bark"):
        scores["drama_queen"] += 2
        reasons["drama_queen"].append("vocal")
    if _has(loud_sounds, "anxious", "very anxious", "nervous"):
        scores["drama_queen"] += 3
        reasons["drama_queen"].append("noise-sensitive")
    if _has(stranger, "shy", "nervous", "cautious", "anxious"):
        scores["drama_queen"] += 2
        reasons["drama_queen"].append("cautious of strangers")
    if _has(behav_issues, "anxiety", "barking", "fearful"):
        scores["drama_queen"] += 2
        reasons["drama_queen"].append("anxiety behaviours")

    # ── 5. lone_wolf ──────────────────────────────────────────────────────
    if _has(attention, "independent", "no", "low", "moderate") and not _has(attention, "yes"):
        scores["lone_wolf"] += 2
        reasons["lone_wolf"].append("independent")
    if _has(sep_anxiety, "none", "comfortably", "comfortable", "no"):
        scores["lone_wolf"] += 2
        reasons["lone_wolf"].append("no separation anxiety")
    if _has(energy, "low", "calm", "relaxed", "gentle"):
        scores["lone_wolf"] += 2
        reasons["lone_wolf"].append("low energy")
    if _has(general_nat, "independent", "aloof", "calm") or _has(describe, "independent", "aloof"):
        scores["lone_wolf"] += 2
        reasons["lone_wolf"].append("calm and independent")

    # ── 6. foodie ─────────────────────────────────────────────────────────
    if _has(food_mot, "very", "high", "will do anything for food"):
        scores["foodie"] += 4
        reasons["foodie"].append("very food motivated")
    elif _has(food_mot, "moderate", "moderately"):
        scores["foodie"] += 2
        reasons["foodie"].append("moderately food motivated")
    if _has(train_resp, "treat", "food") or _has(fav_treats, ""):
        if soul.get("favorite_treats") or soul.get("favourite_treat"):
            scores["foodie"] += 2
            reasons["foodie"].append("treat responsive")
    if _has(fav_activity, "eat", "food") or _has(describe, "foodie", "greedy"):
        scores["foodie"] += 2
        reasons["foodie"].append("food-focused activities")

    # ── 7. gentle_soul ────────────────────────────────────────────────────
    if _has(temperament, "gentle", "calm", "shy"):
        scores["gentle_soul"] += 3
        reasons["gentle_soul"].append("gentle temperament")
    if _has(energy, "calm", "low", "relaxed"):
        scores["gentle_soul"] += 2
        reasons["gentle_soul"].append("calm energy")
    if _has(describe, "gentle", "calm", "sweet", "soft", "shy"):
        scores["gentle_soul"] += 2
        reasons["gentle_soul"].append("gentle nature")
    if _has(stranger, "cautious", "shy") and not _has(loud_sounds, "very anxious"):
        scores["gentle_soul"] += 1
        reasons["gentle_soul"].append("cautious but calm")

    # ── 8. guardian ───────────────────────────────────────────────────────
    if _has(temperament, "protective", "guard", "alert", "loyal"):
        scores["guardian"] += 4
        reasons["guardian"].append("protective temperament")
    if _has(stranger, "cautious", "alert", "nervous") and _has(most_attached, "me", "family", "one"):
        scores["guardian"] += 2
        reasons["guardian"].append("devoted + cautious")
    if _has(describe, "loyal", "protective", "guard", "alert"):
        scores["guardian"] += 2
        reasons["guardian"].append("loyal guardian")
    if _has(general_nat, "alert", "protective"):
        scores["guardian"] += 2
        reasons["guardian"].append("alert nature")

    # ── 9. playful_spirit ─────────────────────────────────────────────────
    if _has(describe, "playful", "fun", "happy", "joyful", "silly"):
        scores["playful_spirit"] += 3
        reasons["playful_spirit"].append("playful by nature")
    if _has(general_nat, "playful", "curious", "happy"):
        scores["playful_spirit"] += 2
        reasons["playful_spirit"].append("playful general nature")
    if _has(play_style, "human", "fetch", "tug", "play") or _has(fav_activity, "play", "fetch", "tug"):
        scores["playful_spirit"] += 2
        reasons["playful_spirit"].append("active play style")
    if _has(energy, "high", "medium", "moderate"):
        scores["playful_spirit"] += 1
        reasons["playful_spirit"].append("good energy")

    # ── 10. curious_mind ──────────────────────────────────────────────────
    if _has(general_nat, "curious", "intelligent", "smart"):
        scores["curious_mind"] += 3
        reasons["curious_mind"].append("curious nature")
    if _has(curiosity, "high", "very curious"):
        scores["curious_mind"] += 3
        reasons["curious_mind"].append("highly curious")
    if _has(learn_level, "advanced", "fully trained", "obedience", "agility"):
        scores["curious_mind"] += 2
        reasons["curious_mind"].append("highly trainable")
    if _has(describe, "curious", "smart", "intelligent", "clever"):
        scores["curious_mind"] += 2
        reasons["curious_mind"].append("clever spirit")

    # If no signals at all → playful_spirit as warm default
    total_score = sum(scores.values())
    if total_score == 0:
        return "playful_spirit", "Warm default: soul profile too sparse to detect a strong signal"

    winner = max(scores, key=lambda k: scores[k])
    winner_score = scores[winner]

    # Tie-break: if multiple archetypes share winner score, prefer user priority order
    priority_order = ["velcro_baby", "social_butterfly", "wild_explorer", "drama_queen",
                      "lone_wolf", "foodie", "gentle_soul", "guardian", "playful_spirit", "curious_mind"]
    tied = [k for k, v in scores.items() if v == winner_score]
    if len(tied) > 1:
        for p in priority_order:
            if p in tied:
                winner = p
                break

    reason = " + ".join(reasons[winner]) if reasons[winner] else "pattern match"
    display = DISPLAY.get(winner, winner)
    return winner, f"Score {winner_score}: {reason} [{display}]"


# ─── Main runner ─────────────────────────────────────────────────────────────

async def run_inference():
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = client["pet-os-live-test_database"]

    pets = await db.pets.find(
        {"doggy_soul_answers": {"$exists": True}},
        {"_id": 1, "name": 1, "doggy_soul_answers": 1, "primary_archetype": 1}
    ).to_list(None)

    print(f"\n{'='*60}")
    print(f"  Soul Archetype Inference — {len(pets)} pets")
    print(f"{'='*60}\n")
    print(f"{'Pet':<20} {'Archetype (snake_case)':<25} {'Reason'}")
    print(f"{'-'*80}")

    results = []
    archetype_counts = {}

    for pet in pets:
        soul = pet.get("doggy_soul_answers") or {}
        archetype, reason = _infer_archetype(soul)
        archetype_counts[archetype] = archetype_counts.get(archetype, 0) + 1

        # Write to DB — snake_case value so ARCHETYPE_TONES lookup works directly
        await db.pets.update_one(
            {"_id": pet["_id"]},
            {"$set": {
                "primary_archetype": archetype,
                "archetype_inferred_at": "2026-04-10",
                "archetype_reason": reason
            }}
        )

        pet_name = pet.get("name") or "?"
        print(f"{pet_name:<20} {archetype:<25} {reason}")
        results.append({"name": pet_name, "archetype": archetype, "reason": reason})

    print(f"\n{'='*60}")
    print("  Archetype Distribution:")
    for arch, count in sorted(archetype_counts.items(), key=lambda x: -x[1]):
        bar = "█" * count
        print(f"  {arch:<20} {bar} ({count})")
    print(f"{'='*60}\n")

    client.close()
    return results


if __name__ == "__main__":
    asyncio.run(run_inference())
