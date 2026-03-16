# 🚨 START HERE - NEW AGENT 🚨

## YOU MUST READ THESE FILES BEFORE WRITING ANY CODE:

### 1. CRITICAL HANDOVER (MOST IMPORTANT)
```
/app/memory/CRITICAL_HANDOVER_20260210.md
```
Contains: ALL fixes, ALL bugs, ALL rules, test commands, user's exact words

### 2. Master Doctrine
```
/app/memory/MASTER_DOCTRINE.md
```
Contains: Core philosophy of Mira OS

### 3. Conversation Architecture
```
/app/memory/CONVERSATION_ARCHITECTURE.md
```
Contains: State machine, conversation flows

---

## QUICK RULES (But still read the full handover!)

1. **NO PRODUCTS for meal plans/diet/advice** → Return empty, use tip card
2. **NO MEMORY PREFIX** in messages → Disabled, user wants it as "whisper"
3. **CONCIERGE BANNER** only on explicit "send to concierge" phrases
4. **PILLAR-FIRST SEARCH** → Always filter by pillar to prevent wrong products
5. **HANDOFF SUMMARY** shows BEFORE sending to Concierge

---

## TEST BEFORE CHANGING ANYTHING

```bash
# Test meal plan returns NO products
curl -s -X POST "https://mojo-personalized.preview.emergentagent.com/api/mira/os/understand-with-products" \
  -H "Content-Type: application/json" \
  -d '{"input": "Create a healthy meal plan for Mojo", "pet_context": {"name": "Mojo", "breed": "Indie"}}' \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print('Products:', len(r.get('response',{}).get('products',[])))"
```
Expected: Products: 0

---

## CREDENTIALS
- Member: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

---

## The user said:
> "Please detail every single bit to the next agent as they always forget what you have said and my heart breaks"

**Don't break their heart. Read the handover.**
