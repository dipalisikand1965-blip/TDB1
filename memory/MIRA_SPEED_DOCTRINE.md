# MIRA SPEED & FEEL DOCTRINE
## How Mira Responds - Timing, Animation, Voice

---

## 1. TYPING / STREAMING (On-Screen Text)

### 1a. Time to First Response
| Threshold | Action |
|-----------|--------|
| **300-800ms** | Show first content (skeleton or real text) |
| **2 seconds** | Show loader: "Mira is getting her thoughts together for {Pet}..." |

**Goal:** Parent should feel Mira is "there" almost immediately.

### 1b. Streaming Animation Speed

| Mode | Chars/Sec | Feel |
|------|-----------|------|
| **Normal** | 30-45 | Comfortable, natural reading pace |
| **Comfort/Grief** | 15-25 | Slow, gentle, more breathing room |
| **Emergency** | 25-35 | Clear, controlled, not frantic |
| **Celebration** | 35-45 | Warm, upbeat but readable |

**Rules:**
- Text should "type" in, not just pop
- Max ~3-4 seconds to render a full Mira paragraph
- If backend responds instantly, still throttle animation for readability
- More line breaks and white space in Comfort mode

---

## 2. VOICE SPEED (Eloise - ElevenLabs TTS)

### 2a. Speaking Rate (Words Per Minute)

```python
MODE_SPEEDS = {
    "default": 170,      # Warm, conversational
    "celebration": 180,  # Upbeat, joyful
    "adventure": 175,    # Encouraging, helpful
    "informative": 165,  # Clear, knowledgeable
    "caring": 165,       # Warm, professional
    "health": 160,       # Calm, reassuring
    "comfort": 140,      # Slow, gentle, empathetic
    "emergency": 155,    # Clear, steady, controlled
    "urgent": 155,       # Alert but calm
}
```

### 2b. Pause Timing

| Location | Normal | Comfort Mode |
|----------|--------|--------------|
| Between sentences | 200-300ms | 300-400ms |
| Between paragraphs | 400-600ms | 600-800ms |

**In Comfort mode:** Bias toward longer pauses, more breathing room.

---

## 3. TEXT ↔ VOICE SYNC

### Sync Rules

1. **Render text first** - Complete streaming animation
2. **Then start TTS** - Voice plays after text is visible
3. **One-to-one mapping** - One user input → One Mira reply → One voice playback
4. **Interrupt handling:**
   - If user scrolls → Pause voice
   - If user types → Stop voice
   - If user taps mic off → Stop immediately

### Never Do:
- ❌ Overlap typing animation with voice playback
- ❌ Start voice before text is visible
- ❌ Continue voice if user has moved on

---

## 4. MODE-SPECIFIC FEEL

### Normal Conversation
```
Typing: 30-45 chars/sec
Voice: 160-180 wpm
Feel: Immediate but thoughtful
```

### Comfort / Grief
```
Typing: 15-25 chars/sec
Voice: 130-150 wpm
Pauses: Longer between sentences
Feel: Gentle, unhurried, spacious
```

### Emergency
```
Typing: 25-35 chars/sec
Voice: 150-165 wpm
Sentences: Short, clear
Feel: Calm authority, not panic
```

### Celebration / Light Topics
```
Typing: 35-45 chars/sec
Voice: 170-190 wpm
Feel: Warm, upbeat, never shrill
```

---

## 5. LOADER MESSAGES

When response takes >2 seconds, show contextual loaders:

| Context | Loader Text |
|---------|-------------|
| General | "Mira is thinking about {Pet}..." |
| Travel | "Mira is planning {Pet}'s journey..." |
| Health | "Mira is checking on {Pet}..." |
| Celebration | "Mira is getting ready to celebrate {Pet}..." |
| Products | "Mira is finding the perfect picks for {Pet}..." |

---

## 6. IMPLEMENTATION CHECKLIST

### Frontend
- [ ] Implement streaming animation with mode-based speed
- [ ] Show loader after 2 second threshold
- [ ] Sync text completion → voice start
- [ ] Handle user interrupts (scroll, type, mute)

### Backend (TTS)
- [ ] Pass mode to TTS endpoint
- [ ] Adjust speaking rate per mode
- [ ] Add appropriate pauses in SSML or post-processing

### Testing
- [ ] Verify first response < 800ms
- [ ] Verify loader appears at 2s
- [ ] Verify voice starts after text completes
- [ ] Verify interrupt handling works

---

## 7. GOAL

> **Mira should feel immediate but thoughtful – never laggy, never rushed.**

The parent should feel:
- Mira is present and attentive
- Mira takes time to think (not instant machine output)
- Mira matches the emotional moment (fast when helpful, slow when gentle)
- Voice and text work together, never fighting

---

*Last Updated: February 8, 2026*
*Part of MIRA DOCTRINE Series*
