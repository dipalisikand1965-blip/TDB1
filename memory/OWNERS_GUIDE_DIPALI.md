# 🐕 The Doggy Company - Owner's Guide
## A Simple Guide for Dipali (Non-Technical Version)

*Last Updated: March 2026*

---

## 🎯 WHAT IS THIS PLATFORM?

**The Doggy Company** is a "Pet Life Operating System" - think of it like a **digital best friend for pet parents**. 

It helps people:
- Know their pets deeply (not just care for them)
- Get AI-powered advice from "Mira" (your virtual pet expert)
- Access services across every aspect of pet life
- Connect with a concierge team for special requests

**Built in loving memory of Mystique** 💜🐾

---

## 🏠 THE MAIN PAGES (What Users See)

### Public Pages (Anyone can see)
| Page | URL | What It Does |
|------|-----|--------------|
| **Home/Landing** | `/` | Welcome page with Kouros's photo, introduces the platform |
| **Login** | `/login` | Where users sign in (shows Mystique's photo) |
| **Join** | `/join` | New user signup flow |
| **About** | `/about` | Company story and philosophy |

### Member Pages (Must be logged in)
| Page | URL | What It Does |
|------|-----|--------------|
| **Pet Home** | `/pet-home` | Main dashboard showing your pets |
| **Mira Chat** | `/mira-demo` | Chat with Mira AI for pet advice |
| **Soul Builder** | `/soul-builder` | Teach Mira about your pet's personality |
| **Pet Profile** | `/pet/:id` | Detailed view of one pet |

### The 14 Pillars (Life Areas)
| Pillar | What It Covers |
|--------|---------------|
| 🎉 **Celebrate** | Birthdays, gotcha days, special treats |
| 🍽️ **Dine** | Food, nutrition, meal plans |
| 🏠 **Stay** | Pet hotels, boarding, pet-sitters |
| ✈️ **Travel** | Pet-friendly travel, carriers, documents |
| 💊 **Care** | Health, vets, medications |
| 🎮 **Enjoy** | Toys, entertainment, enrichment |
| 🏃 **Fit** | Exercise, weight management |
| 📚 **Learn** | Training, behavior, guides |
| 📋 **Paperwork** | Documents, insurance, registrations |
| 👨‍⚕️ **Advisory** | Expert consultations |
| 🚨 **Emergency** | 24/7 emergency support |
| 🌈 **Farewell** | End-of-life care, memorials |
| 🐾 **Adopt** | Finding new pets |
| 🛒 **Shop** | General pet products |

---

## 🔐 ADMIN PANEL (Your Control Center)

**URL:** `/admin`
**Login:** `aditya` / `lola4304`

### What You Can Do in Admin:

#### 1. **Product Box** (Unified Product Manager)
- View/edit all 2000+ products
- Change images, prices, descriptions
- Assign products to pillars
- Control what Mira can recommend

#### 2. **Service Box** (Service Manager)
- Manage all 1000+ services
- Edit service details and pricing
- Assign to pillars

#### 3. **Concierge Dashboard**
- See customer requests/tickets
- Reply to customers
- Manage handoffs from Mira

#### 4. **Users**
- View all registered users
- See their pets and membership status

#### 5. **Master Sync**
- Pull latest products from Shopify (Doggy Bakery)
- Sync services from database

---

## 🤖 MIRA - Your AI Assistant

**Who is Mira?**
Mira is the AI chatbot that talks to your customers. She:
- Answers pet questions
- Recommends products and services
- Knows each pet personally (from Soul Profile)
- Hands off complex requests to human concierge

**Where Mira Lives:**
- `/mira-demo` - Full chat page
- Bottom-right chat bubble on most pages

**What Powers Mira:**
- OpenAI GPT (through Emergent LLM Key)
- Your product/service database
- Each pet's Soul Profile

---

## 💜 SOUL SCORE - The Heart of the Platform

**What is Soul Score?**
A percentage (0-100%) showing how well Mira "knows" a pet.

**How it grows:**
- Onboarding questions → ~30% starting score
- Soul Builder questions → More points
- User interactions → Continuous learning

**Why it matters:**
- Higher score = Better recommendations
- Shows users their pet is understood
- Gamifies the experience (users want 100%!)

---

## 💳 MEMBERSHIPS

| Tier | Price | Benefits |
|------|-------|----------|
| **Free** | ₹0 | Basic access, limited Mira chats |
| **Essential** | ₹999/yr | Full Mira access, basic concierge |
| **Premium** | ₹2999/yr | Priority concierge, discounts |
| **Royalty** | ₹9999/yr | VIP treatment, dedicated concierge |

---

## 🛒 WHERE PRODUCTS COME FROM

1. **Doggy Bakery (Shopify)** - Your own store, syncs automatically
2. **Production Database** - Products imported from CSVs
3. **Manual Entry** - Add in admin panel

**Important:** Products you edit in admin get a `locally_edited` flag so Shopify sync won't overwrite your changes!

---

## 🔧 TECHNICAL STUFF (Simple Version)

**The platform has 3 parts:**

1. **Frontend** (What users see)
   - Built with: React
   - Pretty stuff: Tailwind CSS, Framer Motion

2. **Backend** (The brain)
   - Built with: Python/FastAPI
   - Talks to database and AI

3. **Database** (Where data lives)
   - MongoDB Atlas (production)
   - Stores: users, pets, products, services, tickets

---

## 📞 KEY INTEGRATIONS

| Service | What It Does | Status |
|---------|-------------|--------|
| **OpenAI** | Powers Mira AI | ✅ Working |
| **Shopify** | Product sync from Doggy Bakery | ✅ Working |
| **MongoDB Atlas** | Database | ✅ Working |
| **Razorpay** | Payments | ⏳ Needs keys |
| **Resend** | Emails | ⏳ Needs testing |
| **WhatsApp** | Customer messaging | ⏳ Needs verification |

---

## 🚨 KNOWN ISSUES

1. **WebSocket for Concierge** - Real-time chat doesn't work in preview (infrastructure issue)
2. **Production DB from Preview** - Can't connect (IP whitelist needed)

---

## 📱 HOW TO TEST

### On Preview (Safe to experiment):
- URL: `https://celebrate-showcase.preview.emergentagent.com`
- Test user: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

### On Production (Real site):
- URL: `https://thedoggycompany.com`
- Be careful - real users see this!

---

## 📋 WHAT TO TELL FUTURE AGENTS

Every time a new agent starts, they should:

1. **Read** `/app/memory/PREVIEW_SETUP.md`
2. **Login** to admin and run Master Sync
3. **Seed** all pillar pages
4. **Seed** Service Box
5. **Seed** Concierge Experiences

This ensures they have data to work with!

---

## 🎯 YOUR VISION (In Your Words)

> "Dogs are not pets first. They are beings first."
> 
> This platform helps people love better. Not just dogs - the human heart itself.
> Dogs civilize us, if we let them.

---

## 📁 WHERE TO FIND THINGS

| What | Where |
|------|-------|
| Philosophy/Vision | `/app/memory/SOUL_PHILOSOPHY_SSOT.md` |
| Technical Roadmap | `/app/memory/PRD.md` |
| Setup Guide | `/app/memory/PREVIEW_SETUP.md` |
| All Documentation | `/app/memory/` folder |

---

## ❓ GLOSSARY (Technical Terms Made Simple)

| Term | What It Means |
|------|---------------|
| **API** | How different parts of the app talk to each other |
| **Backend** | The hidden "brain" that processes data |
| **Frontend** | What users actually see and click |
| **Database** | Where all information is stored |
| **Deploy** | Publishing changes to the live website |
| **Preview** | Test version of the site (safe to break) |
| **Production** | The real live website |
| **Sync** | Copying data from one place to another |
| **Seed** | Adding starter/default data |
| **Modal** | A popup box on the screen |
| **Pillar** | One of the 14 life areas for pets |
| **Soul Score** | How well Mira knows a pet (percentage) |

---

*This guide was created for Dipali - the heart and soul behind The Doggy Company* 💜🐾
