# The Doggy Company - PRD (Product Requirements Document)
**Last Updated:** March 11, 2026 21:15 IST  
**Status:** EMERGENCY 100% ✅ | ADVISORY 100% ✅ | FAREWELL 100% ✅ | ADOPT 100% ✅ | MOBILE 100% ✅ | MIRA ADVISOR 100% ✅ | CELEBRATE 100% ✅ | AI IMAGES 100% ✅ | **LEARN 40% 🔄 IN PROGRESS**

---

## 🚨 CRITICAL HANDOVER - LEARN PILLAR GOLDEN STANDARD

### User Frustration Level: HIGH
- Multiple sessions with incomplete work
- Agent not following user's exact specifications
- User provided detailed mockups that were not matched

---

## 🎯 LEARN PILLAR - WHAT USER WANTS

### The Golden Standard Flow (in order):
```
1️⃣ Ask bar at top (opens Mira AI) ✅ DONE
2️⃣ 12 Topic boxes with watercolor illustrations ✅ DONE (but opens page, user wants POPUP)
3️⃣ Learn for my dog (Bruno) - personalized section ❌ NOT DONE
4️⃣ Watch videos ❌ NOT DONE  
5️⃣ Products that help ❌ NOT DONE (has old section, needs redesign)
6️⃣ Services that help ❌ NOT DONE (has old section, needs redesign)
7️⃣ Near me ✅ EXISTS (NearbyLearnServices component)
8️⃣ Routine suggestions ❌ NOT DONE (component created but not integrated)
9️⃣ Guided paths ✅ EXISTS (needs polish)
🔟 Ask concierge ❌ NOT DONE (component created but not integrated)
```

---

## ❌ CRITICAL UNFINISHED WORK

### 1. Topic Boxes Should Open as POPUP, Not Page
**User's exact words:**
> "Instead of opening as a new page what if it opens as a popup on the same page with everything beautifully laid in tabs with send to concierge for more details at the bottom"

**What exists:**
- `LearnTopicModal.jsx` was created at `/app/frontend/src/components/learn/LearnTopicModal.jsx`
- Has tabs: Overview | Videos | Products | Services
- Has "Send to Concierge" button at bottom
- **NOT CONNECTED** to LearnPage.jsx

**To fix:**
```javascript
// In LearnPage.jsx:
import LearnTopicModal from '../components/learn/LearnTopicModal';

// Add state:
const [selectedTopic, setSelectedTopic] = useState(null);

// Change topic box onClick from:
onClick={() => navigate(`/learn/${topic.slug}`)}
// To:
onClick={() => setSelectedTopic(topic.slug)}

// Add modal at end of component:
<LearnTopicModal 
  isOpen={!!selectedTopic} 
  onClose={() => setSelectedTopic(null)} 
  topicSlug={selectedTopic}
  onSendToConcierge={(data) => {
    setSelectedTopic(null);
    setShowRequestModal(true);
    // pass data to request form
  }}
/>
```

### 2. "Learn for Bruno" Personalized Section
**User provided mockup showing:**
- Pet watercolor illustration on right side
- "Learn for Bruno" header
- Personalized tips based on pet profile:
  - "Joint comfort for senior dogs"
  - "Heat care for Labradors"
  - "Better leash manners"
  - "Summer hydration tips"

**This section should appear AFTER the 12 topic boxes**

### 3. Each Topic Box Content
**When popup opens, user wants:**
- Quick explanation of the topic
- Videos related to topic
- Product suggestions
- Services
- "Send to Concierge" for more details at bottom

**Content for each of 12 topics is defined in:**
- `/app/frontend/src/components/learn/LearnTopicModal.jsx` (TOPIC_CONFIG object)
- `/app/frontend/src/pages/LearnTopicPage.jsx` (TOPIC_CONFIG object)

---

## ✅ WHAT WAS COMPLETED

### 1. Ask Bar Opens Mira AI ✅
- Typing and pressing Enter opens Mira AI panel
- Works like Emergency and Advisory pages
- Code in LearnPage.jsx line ~290

### 2. 12 Topic Boxes with Watercolor Illustrations ✅
All images generated and stored:

| Topic | Image URL |
|-------|-----------|
| Puppy Basics | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/93c239031e6456380de0efe5eb0dc4f6c5b0c024dd4773902b6e0c573190b1d8.png |
| Breed Guides | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/b19ce463f91811f725efcf22558df9a370147e238e79f810d6f6f25776b03144.png |
| Food & Feeding | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/5b1a4488a31b3aba09ebc15dd55c6155cee07f252d937530af9763ce6122ed48.png |
| Grooming | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/2aeee0fe285e7f4bf9b0695c92778e425922cb62c68d06f1fe8fdc33715f7aac.png |
| Behavior | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/22b2a63c7ce6c1bf271784616d997150b922e72b42f23b0b0dea6354151c556b.png |
| Training Basics | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/3e9d2387a56550d68b8a4694f20654d13cb537ecee01b51b0f2cd396ecc09efd.png |
| Travel with Dogs | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/9b35a1a9ed5767659671cda04fc117a5abeafb2693411704164c5b37a1062ffe.png |
| Senior Dog Care | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/d9d9ebf8fe66ddcef4c455dbe5001f6143ef5b0c6ddf6e61689713ea03d13ec2.png |
| Health Basics | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/c693f115f02adac326f5e6bb07378e3636c4a2774096c30b532317a65464632d.png |
| Rescue / Indie Care | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/87e1b52ec6d6ab336a68adcea43c4a143f8de59d3cd2824e64e2c3fd9614441a.png |
| Seasonal Care | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/1e5c1f02a009891fbcef1a3e1004e6f1dfe7201bafd892ee8c1d026697842455.png |
| New Pet Parent Guide | https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/484b7ec0a72919db7f6137f25033184bea6787c2ccb296ffb23544249b6ae7a4.png |

---

## 📁 FILES REFERENCE

### Modified Files:
- `/app/frontend/src/pages/LearnPage.jsx` - Main Learn page (HEAVILY MODIFIED)
- `/app/frontend/src/App.js` - Added route for LearnTopicPage

### New Files Created (this session):
- `/app/frontend/src/pages/LearnTopicPage.jsx` - Standalone topic page (user wants modal instead)
- `/app/frontend/src/components/learn/LearnTopicModal.jsx` - **POPUP MODAL - NOT INTEGRATED**
- `/app/frontend/src/components/learn/LearnTopicIcons.jsx` - Icon configurations
- `/app/frontend/src/components/learn/PetDailyRoutine.jsx` - Daily routine component
- `/app/frontend/src/components/learn/SupportForPet.jsx` - Personalized services
- `/app/frontend/src/components/learn/AskConciergeForPet.jsx` - Concierge action cards

### Existing Files (from previous sessions):
- `/app/frontend/src/components/learn/NearbyLearnServices.jsx` - Google Places API

---

## 🎨 USER'S DESIGN REQUIREMENTS

From user's exact words:
- "Soft, elegant, warm, slightly playful" icons
- "NOT flat generic icons, NOT full cartoon"
- "Icon-led with a lightly illustrated feel"
- "iOS/Android mobile-first quality"
- "Soul brand aesthetic - NOT WordPress"
- "Watercolor illustration style"

---

## 📖 BIBLE REFERENCE

The full "Learn Pillar Bible" with exact specifications is in:
`/app/complete-documentation.html` - search for "Learn Pillar Bible"

Key sections in Bible:
- Function of the 12 Boxes
- What Each Box Opens (detailed content for all 12 topics)
- Learn for My Dog personalization
- Flow of the Learn page

---

## ⚠️ KNOWN ISSUES (from previous sessions)

1. **Paperwork page crash** - was "fixed" but user reported still crashes
2. **Razorpay checkout** - fails with "body error"
3. **Products** - 995 products need realistic images
4. **Services** - 161 services need watercolor illustrations

---

## 🔗 URLS & CREDENTIALS

**Preview URL:** https://learn-golden.preview.emergentagent.com

**Test Credentials:**
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

---

## 📋 PRIORITY ORDER FOR NEXT AGENT

1. **P0:** Integrate LearnTopicModal so topic boxes open as popup (not page navigation)
2. **P1:** Build "Learn for Bruno" personalized section matching user's mockup
3. **P2:** Ensure all sections follow the exact flow user specified
4. **P3:** Test on mobile for iOS quality
5. **P4:** Fix any remaining issues from previous sessions

---

## 🚫 DO NOT DO

- Do not navigate to new pages for topic boxes - use popup modal
- Do not use emojis - use watercolor illustrations
- Do not use generic stock images - use AI-generated or real product images
- Do not add sections without checking the Bible first
- Do not assume - ask user for clarification
