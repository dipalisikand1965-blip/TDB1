# THE DOGGY COMPANY - FULL ASSET DIRECTORY
## Created: February 19, 2026

---

# 🚨 THE PROBLEM: 3 SCATTERED MIRAS

| Mira | Location | Status | Purpose |
|------|----------|--------|---------|
| **Mira FAB** | `/components/MiraAI.jsx` | OLD | Floating button, opens chat drawer |
| **Mira OS** | `/components/mira-os/MiraOSModal.jsx` | ✅ GOOD | Pillar modal - clean tabs, chips |
| **Mira Demo** | `/pages/MiraDemoPage.jsx` | NEEDS WORK | Soul page - 3000+ lines, complex |

**THE SOLUTION:** Unify into ONE Mira, using MiraOSModal as the base.

---

# 📁 FRONTEND ASSETS

## PILLAR PAGES (15 pages)
All need unified Mira OS trigger + consistent Services/Products/Experiences layout.

| Pillar | File | Has MiraOS? |
|--------|------|-------------|
| 🎂 Celebrate | `CelebratePage.jsx` | ✅ |
| 🍽️ Dine | `DinePage.jsx` | Check |
| 🏨 Stay | `StayPage.jsx` | ✅ |
| ✈️ Travel | `TravelPage.jsx` | Check |
| 💊 Care | `CarePage.jsx` | Check |
| 🎉 Enjoy | `EnjoyPage.jsx` | Check |
| 🏃 Fit | `FitPage.jsx` | ✅ |
| 📚 Learn | `LearnPage.jsx` | Check |
| 🛒 Shop | `ShopPage.jsx` | Check |
| 📋 Paperwork | `PaperworkPage.jsx` | Check |
| 💼 Advisory | `AdvisoryPage.jsx` | Check |
| 🚨 Emergency | `EmergencyPage.jsx` | Check |
| 💔 Farewell | `FarewellPage.jsx` | Check |
| 🐕 Adopt | `AdoptPage.jsx` | Check |

## ONBOARDING (Your Soul Questions Entry Point)
| File | Purpose |
|------|---------|
| `MembershipOnboarding.jsx` | Current membership signup |
| `PetSoulOnboarding.jsx` | Soul questions for pet |
| `PartnerOnboarding.jsx` | Partner signup |
| `OnboardingTooltip.jsx` | Help tooltips |

## MIRA COMPONENTS (66 components!)
Key ones for unification:

| Component | Purpose | Keep/Merge |
|-----------|---------|------------|
| `MiraOSModal.jsx` | The good one - tabs, chips | ✅ BASE |
| `MiraTray.jsx` | Demo page tray | Merge into OS |
| `ChatInputBar.jsx` | Chat input | Keep |
| `ChatMessage.jsx` | Message bubbles | Keep |
| `QuickReplies.jsx` | Clickable chips | Keep |
| `ConciergeButton.jsx` | Concierge trigger | Keep |
| `ServicesPanel.jsx` | Services list | Keep |
| `PersonalizedPicksPanel.jsx` | PICKS | Keep |
| `MemoryWhisper.jsx` | Soul memory hints | Keep - SOUL |
| `MojoProfileModal.jsx` | Pet profile | Keep - SOUL |
| `SoulKnowledgeTicker.jsx` | Soul facts | Keep - SOUL |
| `ProactiveAlertsBanner.jsx` | Alerts | Keep - SOUL |
| `WelcomeHero.jsx` | Welcome screen | Keep |
| `GlobalNav.jsx` | Dashboard/Inbox nav | Keep |
| `NotificationBell.jsx` | Bell + badge | Keep |
| `InboxRow.jsx` | Notification rows | Keep |

---

# 📁 BACKEND ASSETS (The Intelligence)

## MIRA INTELLIGENCE (16 files)
| File | Purpose | Lines |
|------|---------|-------|
| `mira_routes.py` | Main chat API | 1.1M 😱 |
| `mira_intelligence.py` | AI logic | 38K |
| `mira_memory.py` | Memory system | 30K |
| `mira_memory_routes.py` | Memory API | 30K |
| `mira_proactive.py` | Proactive alerts | 40K |
| `mira_service_desk.py` | Service desk | 45K |
| `mira_session_persistence.py` | Sessions | 20K |
| `mira_nudges.py` | Nudge logic | 18K |
| `mira_notifications.py` | Notifications | 14K |
| `mira_life_stage.py` | Life stage logic | 10K |
| `mira_concierge_handoff.py` | Handoff | 13K |
| `mira_remember.py` | Remember | 9K |
| `mira_retention.py` | Retention | 15K |
| `mira_os.py` | OS logic | 12K |
| `mira_streaming.py` | Streaming | 8K |
| `mira_voice.py` | Voice | 4K |

## SOUL INTELLIGENCE (6 files)
| File | Purpose | Lines |
|------|---------|-------|
| `pet_soul_routes.py` | Soul API | 72K |
| `soul_first_logic.py` | Soul-first | 67K |
| `soul_intelligence.py` | Soul AI | 36K |
| `pet_soul_config.py` | Config | 15K |
| `ticket_soul_enrichment.py` | Enrichment | 15K |
| `seed_pet_souls.py` | Seed data | 21K |

## PET APIs
| File | Purpose |
|------|---------|
| `pet_gate_routes.py` | Pet gating |
| `pet_score_logic.py` | Pet scoring |
| `pet_vault_routes.py` | Health vault |

---

# 🎯 YOUR ROADMAP (In Order)

## PHASE 1: Unify Pillar Experience
1. Audit all 15 pillar pages
2. Ensure each has MiraOSTrigger
3. Standardize: Services | Products | Experiences layout
4. Same look/feel across all pillars

## PHASE 2: Clean Up 3 Miras → 1 Mira
1. Keep MiraOSModal as THE base
2. Merge Mira FAB functionality into MiraOS trigger
3. Mark MiraAI.jsx as deprecated
4. All pillars use same MiraOSModal

## PHASE 3: Soul Onboarding
1. Enhance PetSoulOnboarding.jsx
2. Add gamified soul questions
3. Beautiful UI for personality capture
4. Gate membership after soul is captured

## PHASE 4: Mira Demo = Soul Experience
1. Rebuild MiraDemoPage using MiraOSModal base
2. Add Soul features: Memory, Proactive, Personality
3. This becomes the premium experience

---

# 🔑 KEY INSIGHT

**The intelligence EXISTS in backend:**
- `soul_intelligence.py` - 36K lines of soul logic
- `mira_memory.py` - 30K lines of memory
- `mira_proactive.py` - 40K lines of proactive alerts

**It's just not surfaced well in frontend.**

The backend is brilliant. The frontend needs unification.

---

*Last Updated: February 19, 2026*
