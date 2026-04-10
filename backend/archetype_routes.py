"""
Archetype Routes — Admin endpoint to run soul archetype inference
against the live database. Secured with admin Basic Auth.

POST /api/admin/pets/infer-archetypes
  Reads doggy_soul_answers for all pets, assigns primary_archetype,
  writes back to pets collection. Returns a full report.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets
import os

router = APIRouter()
security = HTTPBasic()


# ─── Auth helper ─────────────────────────────────────────────────────────────

def _verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    correct_user = os.environ.get("ADMIN_USERNAME", "aditya")
    correct_pass = os.environ.get("ADMIN_PASSWORD", "lola4304")
    ok = (
        secrets.compare_digest(credentials.username.encode(), correct_user.encode()) and
        secrets.compare_digest(credentials.password.encode(), correct_pass.encode())
    )
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid admin credentials",
                            headers={"WWW-Authenticate": "Basic"})
    return credentials.username


# ─── Core inference logic (copied from scripts/infer_archetype.py) ────────────

def _norm(val) -> str:
    if val is None:
        return ""
    if isinstance(val, list):
        return " ".join(str(v) for v in val).lower()
    return str(val).lower().strip()


def _has(val, *keywords) -> bool:
    text = _norm(val)
    return any(k in text for k in keywords)


def _infer_archetype(soul: dict) -> tuple[str, str]:
    if not soul or not isinstance(soul, dict):
        return "playful_spirit", "Default: no soul profile data"

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

    scores  = {k: 0 for k in ["velcro_baby","social_butterfly","wild_explorer","drama_queen",
                               "lone_wolf","foodie","gentle_soul","guardian","playful_spirit","curious_mind"]}
    reasons = {k: [] for k in scores}

    # velcro_baby
    if _has(attention, "yes") or _has(attention, "constant", "very"):
        scores["velcro_baby"] += 3; reasons["velcro_baby"].append("attention-seeking")
    if _has(sep_anxiety, "moderate", "severe", "high", "anxious", "gets anxious"):
        scores["velcro_baby"] += 3; reasons["velcro_baby"].append("separation anxiety")
    if _has(most_attached, "me", "family", "everyone"):
        scores["velcro_baby"] += 1; reasons["velcro_baby"].append("deeply attached")
    sleep_loc = _norm(soul.get("sleep_location") or soul.get("sleeping_spot") or "")
    if _has(sleep_loc, "bed", "your bed", "human"):
        scores["velcro_baby"] += 1; reasons["velcro_baby"].append("sleeps with you")

    # social_butterfly
    if _has(lives_with, "loves all dogs", "dog", "friendly") or _has(social_pref, "dog", "other dog"):
        scores["social_butterfly"] += 3; reasons["social_butterfly"].append("loves other dogs")
    if _has(energy, "high"):
        scores["social_butterfly"] += 2; reasons["social_butterfly"].append("high energy")
    if _has(general_nat, "friendly", "social", "playful") or _has(describe, "social", "friendly"):
        scores["social_butterfly"] += 2; reasons["social_butterfly"].append("friendly nature")
    if _has(stranger, "approaches", "loves", "friendly", "very social"):
        scores["social_butterfly"] += 1; reasons["social_butterfly"].append("loves strangers")

    # wild_explorer
    if _has(energy, "high", "very_high", "very high"):
        scores["wild_explorer"] += 2; reasons["wild_explorer"].append("high energy")
    if _has(fav_spot, "outdoors", "garden", "outside", "park") or _has(fav_activity, "outdoor", "fetch", "swim", "run", "hike"):
        scores["wild_explorer"] += 2; reasons["wild_explorer"].append("outdoor lover")
    if _has(leash, "pulls", "sometimes") or _has(behav_issues, "pulling", "pull"):
        scores["wild_explorer"] += 3; reasons["wild_explorer"].append("pulls on leash")
    if _has(describe, "adventurous", "explorer", "energetic", "wild"):
        scores["wild_explorer"] += 1; reasons["wild_explorer"].append("adventurous spirit")
    if _has(fav_activity, "running", "fetch", "hiking", "swimming"):
        scores["wild_explorer"] += 1; reasons["wild_explorer"].append("action-oriented")

    # drama_queen
    if _has(barking, "frequent", "often", "occasionally", "bark"):
        scores["drama_queen"] += 2; reasons["drama_queen"].append("vocal")
    if _has(loud_sounds, "anxious", "very anxious", "nervous"):
        scores["drama_queen"] += 3; reasons["drama_queen"].append("noise-sensitive")
    if _has(stranger, "shy", "nervous", "cautious", "anxious"):
        scores["drama_queen"] += 2; reasons["drama_queen"].append("cautious of strangers")
    if _has(behav_issues, "anxiety", "barking", "fearful"):
        scores["drama_queen"] += 2; reasons["drama_queen"].append("anxiety behaviours")

    # lone_wolf
    if _has(attention, "independent", "no", "low", "moderate") and not _has(attention, "yes"):
        scores["lone_wolf"] += 2; reasons["lone_wolf"].append("independent")
    if _has(sep_anxiety, "none", "comfortably", "comfortable", "no"):
        scores["lone_wolf"] += 2; reasons["lone_wolf"].append("no separation anxiety")
    if _has(energy, "low", "calm", "relaxed", "gentle"):
        scores["lone_wolf"] += 2; reasons["lone_wolf"].append("low energy")
    if _has(general_nat, "independent", "aloof", "calm") or _has(describe, "independent", "aloof"):
        scores["lone_wolf"] += 2; reasons["lone_wolf"].append("calm and independent")

    # foodie
    if _has(food_mot, "very", "high", "will do anything for food"):
        scores["foodie"] += 4; reasons["foodie"].append("very food motivated")
    elif _has(food_mot, "moderate", "moderately"):
        scores["foodie"] += 2; reasons["foodie"].append("moderately food motivated")
    if soul.get("favorite_treats") or soul.get("favourite_treat"):
        scores["foodie"] += 2; reasons["foodie"].append("treat responsive")

    # gentle_soul
    if _has(temperament, "gentle", "calm", "shy"):
        scores["gentle_soul"] += 3; reasons["gentle_soul"].append("gentle temperament")
    if _has(energy, "calm", "low", "relaxed"):
        scores["gentle_soul"] += 2; reasons["gentle_soul"].append("calm energy")
    if _has(describe, "gentle", "calm", "sweet", "soft", "shy"):
        scores["gentle_soul"] += 2; reasons["gentle_soul"].append("gentle nature")

    # guardian
    if _has(temperament, "protective", "guard", "alert", "loyal"):
        scores["guardian"] += 4; reasons["guardian"].append("protective temperament")
    if _has(stranger, "cautious", "alert", "nervous") and _has(most_attached, "me", "family", "one"):
        scores["guardian"] += 2; reasons["guardian"].append("devoted + cautious")
    if _has(describe, "loyal", "protective", "guard", "alert"):
        scores["guardian"] += 2; reasons["guardian"].append("loyal guardian")

    # playful_spirit
    if _has(describe, "playful", "fun", "happy", "joyful", "silly"):
        scores["playful_spirit"] += 3; reasons["playful_spirit"].append("playful by nature")
    if _has(general_nat, "playful", "curious", "happy"):
        scores["playful_spirit"] += 2; reasons["playful_spirit"].append("playful nature")
    if _has(play_style, "human", "fetch", "tug", "play") or _has(fav_activity, "play", "fetch", "tug"):
        scores["playful_spirit"] += 2; reasons["playful_spirit"].append("active play style")
    if _has(energy, "high", "medium", "moderate"):
        scores["playful_spirit"] += 1; reasons["playful_spirit"].append("good energy")

    # curious_mind
    if _has(general_nat, "curious", "intelligent", "smart"):
        scores["curious_mind"] += 3; reasons["curious_mind"].append("curious nature")
    if _has(curiosity, "high", "very curious"):
        scores["curious_mind"] += 3; reasons["curious_mind"].append("highly curious")
    if _has(learn_level, "advanced", "fully trained", "obedience", "agility"):
        scores["curious_mind"] += 2; reasons["curious_mind"].append("highly trainable")
    if _has(describe, "curious", "smart", "intelligent", "clever"):
        scores["curious_mind"] += 2; reasons["curious_mind"].append("clever spirit")

    if sum(scores.values()) == 0:
        return "playful_spirit", "Default: soul profile too sparse"

    priority = ["velcro_baby","social_butterfly","wild_explorer","drama_queen",
                "lone_wolf","foodie","gentle_soul","guardian","playful_spirit","curious_mind"]
    top_score = max(scores.values())
    tied = [k for k, v in scores.items() if v == top_score]
    winner = next((p for p in priority if p in tied), tied[0])
    reason_text = " + ".join(reasons[winner]) or "pattern match"
    return winner, f"Score {top_score}: {reason_text}"


# ─── API endpoint ─────────────────────────────────────────────────────────────

@router.post("/admin/pets/infer-archetypes")
async def run_archetype_inference(_admin: str = Depends(_verify_admin)):
    """
    Admin-only. Runs soul archetype inference for ALL pets in the DB.
    Writes primary_archetype, archetype_reason, archetype_inferred_at to each pet.
    Returns a full report.
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    from datetime import datetime, timezone

    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name   = os.environ.get("DB_NAME", "test_database")
    client    = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000)
    db        = client[db_name]

    pets = await db.pets.find(
        {"doggy_soul_answers": {"$exists": True}},
        {"_id": 1, "name": 1, "doggy_soul_answers": 1}
    ).to_list(None)

    results = []
    counts  = {}
    today   = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for pet in pets:
        soul = pet.get("doggy_soul_answers") or {}
        archetype, reason = _infer_archetype(soul)
        counts[archetype] = counts.get(archetype, 0) + 1

        await db.pets.update_one(
            {"_id": pet["_id"]},
            {"$set": {
                "primary_archetype": archetype,
                "archetype_reason":  reason,
                "archetype_inferred_at": today,
            }}
        )
        results.append({"name": pet.get("name", "?"), "archetype": archetype, "reason": reason})

    client.close()
    return {
        "success": True,
        "total_processed": len(results),
        "distribution": counts,
        "pets": results,
    }
