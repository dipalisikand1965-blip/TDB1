# MIRA OS - VOICE & CONVERSATION RULES
## MANDATORY for all agents - Read before making changes

---

## 1. PET DESCRIPTION RULE

### The Problem
Mira was repeating pet traits (breed, preferences, allergies) in EVERY response:
- "From what I know about Luna, she's a Golden Retriever who loves peanut butter..."
- This happened on every single message, even follow-ups

### The Fix (Implemented Feb 9, 2026)
Added instruction in `mira_routes.py` system prompt (line ~6985):
```
PET DESCRIPTION RULE:
- ONLY describe pet traits on the FIRST message of a conversation
- On follow-up messages, DO NOT repeat pet descriptions
- Just reference the pet by name and get to the point
- Current conversation length: {len(request.history or [])} messages
```

### Expected Behavior
| Message # | Should Include Pet Description? |
|-----------|--------------------------------|
| 1st message | ✅ Yes - "Luna is a lovely Golden Retriever..." |
| 2nd message | ❌ No - Just "For Luna, I suggest..." |
| 3rd+ messages | ❌ No - Reference by name only |

---

## 2. VOICE SYNC RULES

### The Problem
When tiles were clicked rapidly:
1. Tile click triggers new query
2. Old voice still playing
3. New response comes with new voice
4. **Result: Voice overlap/chaos**

### The Fix (Implemented Feb 9, 2026)

#### A. Skip Voice on Tile Clicks
Location: `MiraDemoPage.jsx`

```javascript
// Ref to track if voice should be skipped
const skipVoiceOnNextResponseRef = useRef(false);

// In handleQuickReply():
skipVoiceOnNextResponseRef.current = true; // Mark to skip voice

// In response handler (line ~3279):
if (skipVoiceOnNextResponseRef.current) {
  skipVoiceOnNextResponseRef.current = false; // Reset
  // Voice skipped - no speakWithMira() call
} else {
  speakWithMira(miraResponseText); // Normal voice
}
```

#### B. Cancel Voice on User Action
Added in 3 places:
1. **handleQuickReply()** - When tile clicked
2. **handleSubmit()** - When message sent
3. **Input onChange** - When user starts typing

```javascript
// Cancel pending voice
if (voiceTimeoutRef.current) {
  clearTimeout(voiceTimeoutRef.current);
  voiceTimeoutRef.current = null;
}
stopSpeaking(); // Stop current voice
```

### Expected Behavior
| Action | Voice Plays? |
|--------|-------------|
| User types message and sends | ✅ Yes |
| User clicks tile/suggestion | ❌ No |
| User clicks tile while voice playing | Voice stops immediately |
| User starts typing while voice playing | Voice stops immediately |

---

## 3. VOICE ARCHITECTURE

### Files Involved
| File | Purpose |
|------|---------|
| `MiraDemoPage.jsx` | Voice UI, triggers, refs |
| `tts_routes.py` | TTS API (ElevenLabs + OpenAI fallback) |
| `haptic.js` | Haptic feedback for voice actions |

### Key Refs
```javascript
const audioRef = useRef(null);           // Audio element
const voiceTimeoutRef = useRef(null);    // Pending voice timeout
const skipVoiceOnNextResponseRef = useRef(false); // Skip on tile click
```

### Voice Flow
```
User Action
    ↓
handleSubmit() or handleQuickReply()
    ↓
[If tile clicked: skipVoiceOnNextResponseRef = true]
    ↓
API Response received
    ↓
Check skipVoiceOnNextResponseRef
    ↓
If false → speakWithMira() after typing animation
If true → Skip voice, reset flag
```

---

## 4. TTS FALLBACK SYSTEM

### Primary: ElevenLabs
- Voice ID: Configured in `.env`
- Model: `eleven_multilingual_v2`

### Fallback: OpenAI (when ElevenLabs quota exceeded)
- Voice: `shimmer` (British-style, feminine)
- Model: `tts-1-hd`
- Key: Uses EMERGENT_LLM_KEY

### Code Location
`tts_routes.py` line ~190:
```python
# Try ElevenLabs first
try:
    # ElevenLabs code...
except Exception:
    # Fallback to OpenAI
    from emergentintegrations.llm.openai import OpenAITextToSpeech
    tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
```

---

## 5. DO NOT BREAK THESE

### Critical Functions
- `handleQuickReply()` - Must include voice cancellation
- `handleSubmit()` - Must include voice cancellation
- `speakWithMira()` - Must check skipVoiceOnNextResponseRef
- Input `onChange` - Must stop voice when typing

### Critical Refs
- `voiceTimeoutRef` - MUST be cleared before new voice
- `skipVoiceOnNextResponseRef` - MUST be checked before speaking
- `audioRef` - MUST be stopped on user action

---

## 6. TESTING CHECKLIST

Before finishing any voice-related changes:
- [ ] Type message → Voice plays ✅
- [ ] Click tile → Voice does NOT play ✅
- [ ] Click tile while voice playing → Voice stops ✅
- [ ] Type while voice playing → Voice stops ✅
- [ ] Rapid tile clicks → No overlap ✅
- [ ] ElevenLabs quota exceeded → OpenAI fallback works ✅

---

*Document created: Feb 9, 2026*
*Last updated: Feb 9, 2026*
