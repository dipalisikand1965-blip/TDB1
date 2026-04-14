import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Sparkles, Heart, Shield, Plane, Home, Scissors, 
  GraduationCap, Stethoscope, ShoppingBag, PartyPopper, BookOpen,
  Users, FileText, Dumbbell, PawPrint, Send, Brain, Zap, Eye, 
  Clock, Star, TrendingUp, Mail, Calendar, Building2, CreditCard, Check, Play
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Demo Pet: Dollar the Poodle
const DEMO_PET = {
  id: "demo-dollar-poodle",
  name: "Dollar",
  breed: "Poodle",
  type: "dog",
  age: "4 years",
  birth_date: "2022-03-15",
  weight: "8.5 kg",
  color: "Apricot",
  gender: "Male",
  personality: ["Playful", "Intelligent", "Affectionate"],
  allergies: ["Chicken"],
  favorite_treats: ["Peanut butter biscuits", "Lamb jerky"],
  vaccination_status: "Up to date",
  last_grooming: "2 weeks ago",
  soul_score: 78,
  owner: "DreamFolks Member"
};

// 14 Pillars with demo content
const PILLARS = [
  { id: "shop", name: "Shop", icon: ShoppingBag, color: "from-pink-500 to-rose-500", 
    description: "Curated products for poodles", 
    sample: "Show me hypoallergenic food for Dollar",
    preview: "AI recommends grain-free, lamb-based food avoiding chicken allergy" },
  { id: "care", name: "Care", icon: Stethoscope, color: "from-red-500 to-pink-500",
    description: "Health & wellness management",
    sample: "Dollar has been scratching a lot",
    preview: "Detects skin issue → Recommends vet dermatology visit" },
  { id: "groom", name: "Groom", icon: Scissors, color: "from-purple-500 to-violet-500",
    description: "Grooming services & booking",
    sample: "Book a grooming appointment",
    preview: "Shows poodle-specific grooming packages with pricing" },
  { id: "learn", name: "Learn", icon: GraduationCap, color: "from-blue-500 to-indigo-500",
    description: "Training & behavior",
    sample: "Dollar keeps jumping on guests",
    preview: "Routes to behavior training → Suggests trainer consultation" },
  { id: "travel", name: "Travel", icon: Plane, color: "from-cyan-500 to-blue-500",
    description: "Pet-friendly travel planning",
    sample: "I'm flying to Goa with Dollar",
    preview: "Pet airline policies, pet-friendly hotels in Goa" },
  { id: "stay", name: "Stay", icon: Home, color: "from-amber-500 to-orange-500",
    description: "Boarding & pet sitting",
    sample: "I need boarding for next weekend",
    preview: "Shows nearby boarding options with availability" },
  { id: "celebrate", name: "Celebrate", icon: PartyPopper, color: "from-yellow-500 to-amber-500",
    description: "Birthday parties & milestones",
    sample: "Dollar's birthday is coming up",
    preview: "Birthday party packages, custom cakes, photo shoots" },
  { id: "protect", name: "Protect", icon: Shield, color: "from-emerald-500 to-green-500",
    description: "Insurance & safety",
    sample: "Tell me about pet insurance",
    preview: "Compares pet insurance plans with coverage details" },
  { id: "feed", name: "Feed", icon: Heart, color: "from-rose-500 to-red-500",
    description: "Nutrition & meal planning",
    sample: "What should I feed Dollar?",
    preview: "Personalized meal plan considering chicken allergy" },
  { id: "fit", name: "Fit", icon: Dumbbell, color: "from-lime-500 to-green-500",
    description: "Exercise & fitness",
    sample: "How much exercise does Dollar need?",
    preview: "Poodle-specific exercise recommendations" },
  { id: "adopt", name: "Adopt", icon: Users, color: "from-teal-500 to-cyan-500",
    description: "Adoption support",
    sample: "I want to adopt a companion for Dollar",
    preview: "Shelter partnerships, compatibility matching" },
  { id: "farewell", name: "Farewell", icon: Heart, color: "from-slate-500 to-gray-500",
    description: "End-of-life care & memorial",
    sample: "I need grief support",
    preview: "Compassionate support, memorial services" },
  { id: "enjoy", name: "Enjoy", icon: Star, color: "from-orange-500 to-red-500",
    description: "Activities & enrichment",
    sample: "Fun activities for Dollar",
    preview: "Dog parks, play dates, enrichment toys" },
  { id: "paperwork", name: "Paperwork", icon: FileText, color: "from-indigo-500 to-purple-500",
    description: "Documents & records",
    sample: "I need Dollar's vaccination records",
    preview: "Digital pet passport, document storage" },
];

// 30 Curated Perfect Responses for Dollar Demo
const CURATED_RESPONSES = {
  // CARE / HEALTH (8 responses)
  "scratching": {
    response: `I'm concerned about Dollar's scratching. For a Poodle, this could be:

**Possible Causes:**
• Skin allergies (environmental or food-related)
• Dry skin from grooming products
• Parasites (fleas/mites)
• Seasonal irritation

**My Recommendation:**
Since Dollar is allergic to chicken, let's first rule out any food-related triggers. I'd suggest:

1. **Immediate:** Anti-itch oatmeal bath (₹450 at Pawsome Spa)
2. **This week:** Vet dermatology check-up

📅 **Available Appointments:**
• Dr. Sharma, PetCare Clinic - Tomorrow 11 AM
• VetDerm Specialists - Thursday 3 PM

Should I book one of these?`,
    intent: "Implicit: skin_issue",
    pillar: "Care",
    urgency: "Medium"
  },
  
  "not eating|won't eat|appetite|refusing food": {
    response: `I'm worried about Dollar not eating well. This isn't like him — he usually loves his meals!

**Possible Reasons:**
• Digestive upset
• Dental discomfort
• Stress or environmental change
• Underlying health issue

**Immediate Steps:**
1. Try warming his food slightly (enhances aroma)
2. Offer his favorite: peanut butter biscuits as a test
3. Monitor water intake

⚠️ **If he hasn't eaten for 24+ hours, we should see a vet.**

📅 **Quick Vet Availability:**
• Dr. Mehta, Happy Paws - Today 5 PM (₹500)
• PetCare 24/7 - Walk-in available

Want me to book an appointment?`,
    intent: "Implicit: appetite_loss",
    pillar: "Care",
    urgency: "High"
  },

  "vomit|throwing up|vomiting": {
    response: `⚠️ **This needs immediate attention!**

Vomiting can indicate several things — from simple stomach upset to something more serious.

**Right Now:**
1. **No food** for 4-6 hours
2. **Small sips of water** only (ice cubes work great)
3. **Monitor** for blood, lethargy, or continued vomiting

**Warning Signs (Go to ER immediately):**
• Blood in vomit
• Repeated vomiting (3+ times in an hour)
• Extreme lethargy
• Bloated stomach

🚨 **Emergency Vets Near You:**
• **24/7 PetCare Emergency** - 2.3 km (Open NOW)
  📞 +91 98765 43210
• **City Vet Hospital** - 4.1 km
  📞 +91 98765 43211

Should I call them for you right now?`,
    intent: "Emergency: digestive",
    pillar: "Emergency",
    urgency: "Critical"
  },

  "vaccine|vaccination|shots|due": {
    response: `Let me check Dollar's vaccination records! 📋

**Dollar's Vaccination Status:**
✅ Rabies - Up to date (Next: March 2026)
✅ DHPP - Up to date (Next: August 2025)
⚠️ Bordetella - Due in 2 weeks!
✅ Leptospirosis - Up to date

**Upcoming:**
The Bordetella (kennel cough) vaccine is due soon — especially important if Dollar goes to daycare or grooming.

📅 **Vaccination Appointments:**
• Dr. Sharma, PetCare - Saturday 10 AM (₹800)
• Happy Tails Clinic - Monday 2 PM (₹750)

Want me to schedule the Bordetella booster?`,
    intent: "Vaccination check",
    pillar: "Care",
    urgency: "Medium"
  },

  // GROOMING (4 responses)
  "groom|grooming|haircut|bath|spa": {
    response: `Time for Dollar's grooming! 🛁✂️

As a Poodle, Dollar needs professional grooming every 4-6 weeks to prevent matting and keep his coat healthy.

**Poodle Grooming Packages:**

🌟 **Basic Groom** - ₹1,200
Bath, blow-dry, brush, nail trim, ear cleaning

✨ **Full Groom** - ₹1,800
Everything above + haircut (your choice of style)

💎 **Spa Day** - ₹2,500
Full groom + teeth brushing + paw massage + aromatherapy

**Dollar's Preferences (I remember!):**
• Prefers the "teddy bear" cut
• Gets anxious with loud dryers — needs quiet drying
• Loves the lavender shampoo

📅 **Available This Week:**
• Pawsome Spa - Tomorrow 10 AM ⭐ (Dollar's favorite!)
• Fluffy Tails - Thursday 2 PM
• PetStyle Studio - Saturday 11 AM

Which one should I book?`,
    intent: "Grooming booking",
    pillar: "Groom",
    urgency: "Normal"
  },

  // FOOD & NUTRITION (4 responses)
  "food|feed|diet|eat|nutrition|kibble": {
    response: `Let me find the perfect food for Dollar! 🍽️

**Important: Dollar is allergic to chicken** — so I'm only showing chicken-free options.

**Top Picks for Poodles (Chicken-Free):**

🥇 **Royal Canin Poodle Adult** - ₹4,200/3kg
Breed-specific, supports coat health
⭐ 4.8/5 (1,200 reviews)

🥈 **Farmina N&D Lamb & Blueberry** - ₹3,800/2.5kg
Grain-free, high protein
⭐ 4.7/5 (890 reviews)

🥉 **Acana Singles Lamb & Apple** - ₹5,100/2kg
Limited ingredient, great for allergies
⭐ 4.9/5 (650 reviews)

**Dollar's Current Food:** Royal Canin Poodle
**Last Ordered:** 3 weeks ago (might be running low!)

Would you like me to:
1. Reorder Royal Canin (arrives tomorrow)
2. Try one of the other options
3. Get a nutrition consultation`,
    intent: "Food recommendation",
    pillar: "Shop + Feed",
    urgency: "Normal"
  },

  "treat|treats|snack|biscuit": {
    response: `Treat time for Dollar! 🦴

**Dollar's Favorites (I remember!):**
1. Peanut butter biscuits 🥜
2. Lamb jerky strips 🐑

**Safe Treats for Dollar (No Chicken!):**

🥜 **Peanut Butter Delights** - ₹320
Crunchy biscuits, all-natural
*Dollar's #1 favorite!*

🐑 **Lamb Jerky Strips** - ₹450
High protein, single ingredient

🍠 **Sweet Potato Chews** - ₹280
Grain-free, good for digestion

🧀 **Cheese Bites Training Treats** - ₹220
Perfect for training sessions

🎂 **Birthday Pupcake** - ₹350
Special occasion treat!

**Quick Add to Cart:**
□ Peanut Butter Biscuits (₹320)
□ Lamb Jerky (₹450)
□ Sweet Potato Chews (₹280)

Which ones should I add?`,
    intent: "Treat shopping",
    pillar: "Shop",
    urgency: "Low"
  },

  "allergy|allergic|chicken": {
    response: `Yes, I always remember — **Dollar is allergic to chicken!** 🚫🐔

This means I automatically filter out:
• Chicken-based kibble
• Chicken treats and jerky
• Foods with chicken meal/fat

**Safe Proteins for Dollar:**
✅ Lamb
✅ Fish (salmon, whitefish)
✅ Duck
✅ Beef
✅ Turkey (if tolerated)

**Currently Safe Products Dollar Uses:**
• Royal Canin Poodle (chicken-free formula)
• Lamb jerky treats
• Peanut butter biscuits

**Want me to:**
1. Show all chicken-free products
2. Book an allergy test for other sensitivities
3. Get a veterinary nutritionist consultation

I'll always protect Dollar from chicken! 💚`,
    intent: "Allergy management",
    pillar: "Care + Feed",
    urgency: "Normal"
  },

  // TRAVEL (3 responses)
  "travel|trip|flying|flight|goa|mumbai|delhi|vacation": {
    response: `Exciting! Let's plan Dollar's trip! ✈️🐩

**Pet Travel Checklist for Dollar:**

📋 **Documents Needed:**
• Health certificate (within 10 days of travel)
• Vaccination records (I have these!)
• Pet passport (if traveling internationally)

✈️ **Airlines That Allow Pets in Cabin:**
• **IndiGo** - ₹3,500 pet fee (cabin, under 7kg ✅)
• **Vistara** - ₹4,000 pet fee (cabin, under 5kg)
• **Air India** - ₹5,000 pet fee (cabin)

*Dollar is 8.5kg — may need to go in cargo on some airlines*

🏨 **Pet-Friendly Hotels:**
• Taj properties (most locations)
• ITC Hotels (select properties)
• Airbnb pet-friendly stays

🧳 **Travel Essentials:**
• Airline-approved carrier (₹2,500-4,000)
• Portable water bowl
• Familiar blanket/toy
• Motion sickness meds (if needed)

Where are you planning to go? I'll find specific options!`,
    intent: "Travel planning",
    pillar: "Travel",
    urgency: "Normal"
  },

  "boarding|pet sitter|pet sitting|leaving|going away": {
    response: `Need someone to care for Dollar while you're away? 🏠

**Boarding Options Near You:**

🏨 **Luxury Boarding:**
**Paws Resort** - ₹1,500/night
• Private suite, AC, webcam access
• 2 walks + playtime daily
• Grooming included
⭐ 4.9/5 • 3.2 km away

🏠 **Home Boarding:**
**Priya's Pet Haven** - ₹800/night
• Home environment, 1-2 dogs only
• Constant supervision
• Daily photo updates
⭐ 4.8/5 • 5 km away

👤 **Pet Sitter (comes to you):**
**Rahul** - ₹600/visit (2 visits/day)
• Experienced with Poodles
• Feeding, walking, playtime
• Stays overnight available (+₹400)
⭐ 5.0/5 • Background verified

**Dollar's Notes:**
• Needs quiet environment
• Anxious first day, warms up quickly
• Must avoid chicken treats!

When are you traveling? I'll check availability!`,
    intent: "Boarding search",
    pillar: "Stay",
    urgency: "Normal"
  },

  // CELEBRATION (2 responses)
  "birthday|party|celebrate|celebration|turning": {
    response: `🎂 Dollar's birthday is coming up — March 15th! He's turning 4!

**Birthday Party Packages:**

🎈 **Basic Pawty** - ₹2,500
• Custom pup-cake (chicken-free!)
• Birthday bandana
• Professional photoshoot (10 photos)

🎉 **Premium Pawty** - ₹5,500
• Everything above PLUS
• Venue decoration
• 5 doggy friends invited
• Treat bags for guests
• 25 edited photos + video

👑 **Royal Celebration** - ₹12,000
• Private venue booking
• Catering for dogs AND humans
• Professional photography + videography
• Custom birthday outfit
• Paw-print keepsake

**Special Touches I Remember Dollar Loves:**
• Peanut butter frosting on cake
• His friend Bruno should be invited!
• Prefers morning parties (more energy)

Which package sounds perfect? I'll start planning! 🎊`,
    intent: "Birthday planning",
    pillar: "Celebrate",
    urgency: "Low"
  },

  // TRAINING (2 responses)
  "training|trainer|behave|behavior|jumping|barking|pulling": {
    response: `Let's work on Dollar's training! 🎓

**What's the challenge?**
• Jumping on guests
• Pulling on leash
• Excessive barking
• Basic obedience
• Something else?

**Training Options:**

🏠 **Private Training (Home)** - ₹1,500/session
• One-on-one attention
• Customised to Dollar's needs
• Trainer: Anjali (Poodle specialist)
⭐ 4.9/5 • 50+ dogs trained

👥 **Group Classes** - ₹4,000 (6 sessions)
• Socialization included
• Sunday mornings, Cubbon Park
• Max 6 dogs per batch

📱 **Online Consultation** - ₹500/session
• Video call with behaviorist
• Good for quick questions

**Dollar's Training Notes:**
• Very intelligent (Poodles learn fast!)
• Food-motivated (lamb treats work best)
• Responds well to positive reinforcement

What behavior would you like to work on?`,
    intent: "Training inquiry",
    pillar: "Learn",
    urgency: "Normal"
  },

  // EXERCISE & FITNESS (2 responses)
  "exercise|walk|walking|fitness|weight|overweight|active": {
    response: `Let's keep Dollar fit and active! 🏃‍♂️🐩

**Poodle Exercise Guidelines:**
Standard Poodles need 60-90 minutes of activity daily.

**Dollar's Current Stats:**
• Weight: 8.5 kg (healthy range!)
• Age: 4 years (prime activity years)
• Energy level: High

**Activity Recommendations:**

🚶 **Daily Walks:**
• Morning: 30-40 minutes (brisk)
• Evening: 20-30 minutes (leisurely)

🏊 **Swimming** (Poodles love water!)
• Great low-impact exercise
• Canine Pool - ₹500/session

🧩 **Mental Stimulation:**
• Puzzle toys
• Hide & seek with treats
• Training games

👥 **Social Exercise:**
• Dog park playdates
• Doggy daycare (2-3x/week)

**Dog Walker Services:**
• **Ravi** - ₹300/walk, morning available
• **PawWalks** - ₹250/walk, flexible timing

Would you like me to set up a fitness routine for Dollar?`,
    intent: "Fitness planning",
    pillar: "Fit",
    urgency: "Low"
  },

  // PRODUCTS & SHOPPING (3 responses)
  "toy|toys|play|playing|bored": {
    response: `Let's find fun toys for Dollar! 🎾

**Poodle-Perfect Toys:**

🧩 **Puzzle Toys** (Mental stimulation)
• Kong Classic - ₹650
• Nina Ottosson Puzzle - ₹1,200
• Snuffle Mat - ₹550

🎾 **Fetch Toys**
• Chuck-It Ball - ₹450
• Squeaky Tennis Balls (3-pack) - ₹320
• Rope Frisbee - ₹380

🦷 **Chew Toys** (Dental health)
• Nylabone Dental - ₹520
• Benebone Wishbone - ₹680
• Natural Yak Chew - ₹350

🤗 **Comfort Toys**
• Plush Squeaky Toy - ₹420
• Heartbeat Puppy (for anxious times) - ₹1,100

**Dollar's Favorites:**
• Loves squeaky toys!
• Destroys plush toys quickly 😅
• Prefers medium-sized balls

Add to cart?`,
    intent: "Toy shopping",
    pillar: "Shop + Enjoy",
    urgency: "Low"
  },

  "buy|order|shop|need|get me|purchase": {
    response: `I'd be happy to help you shop for Dollar! 🛒

**Quick Reorders (Based on Dollar's history):**
• Royal Canin Poodle Food (3kg) - ₹4,200
  *Last ordered 3 weeks ago*
• Peanut Butter Biscuits - ₹320
• Lamb Jerky Treats - ₹450

**Popular Categories:**
🍽️ Food & Nutrition
🦴 Treats & Chews  
🧴 Grooming Supplies
🧸 Toys & Enrichment
🛏️ Beds & Comfort
👕 Clothing & Accessories
💊 Health & Supplements

**Remember:** All products I show are verified chicken-free for Dollar!

What would you like to shop for today?`,
    intent: "Shopping",
    pillar: "Shop",
    urgency: "Low"
  },

  // INSURANCE & PROTECTION (1 response)
  "insurance|protect|coverage|medical": {
    response: `Great thinking! Let's protect Dollar with pet insurance. 🛡️

**Pet Insurance Options:**

🥇 **Bajaj Allianz Pet Insurance**
• Premium: ₹5,500/year
• Coverage: ₹50,000
• Includes: Accidents, illness, surgery
• Waiting period: 14 days

🥈 **New India Assurance**
• Premium: ₹4,200/year
• Coverage: ₹40,000
• Includes: Accidents, hospitalization
• Waiting period: 30 days

🥉 **ICICI Lombard Pet Cover**
• Premium: ₹6,800/year
• Coverage: ₹75,000
• Includes: Comprehensive + OPD
• Waiting period: 14 days

**Dollar's Risk Factors:**
• Poodles prone to: Hip dysplasia, eye issues, skin allergies
• Age 4: Good time to get coverage (pre-existing exclusions apply later)

**My Recommendation:**
ICICI Lombard for comprehensive coverage, especially given Dollar's skin sensitivity.

Want me to get detailed quotes?`,
    intent: "Insurance inquiry",
    pillar: "Protect",
    urgency: "Low"
  },

  // EMERGENCY (2 responses)
  "emergency|urgent|help|hurt|accident|bleeding|poisoned": {
    response: `🚨 **EMERGENCY RESPONSE ACTIVATED**

**Stay calm. I'm here to help.**

**Nearest Emergency Vets (Open 24/7):**

📍 **24/7 PetCare Emergency**
• Distance: 2.3 km
• 📞 +91 98765 43210
• Wait time: ~10 mins

📍 **City Vet Hospital**
• Distance: 4.1 km  
• 📞 +91 98765 43211
• Full surgical facility

📍 **CGVH Emergency**
• Distance: 6.5 km
• 📞 +91 98765 43212
• Specialist on call

**While You're on the Way:**
• Keep Dollar calm and still
• Don't give food or water
• Note the time symptoms started
• Bring any suspected toxins/objects

**Do you want me to:**
1. 📞 Call the nearest vet NOW
2. 🚗 Get directions
3. 📋 Share Dollar's medical history with them

What happened? I can provide specific first-aid guidance.`,
    intent: "Emergency",
    pillar: "Emergency",
    urgency: "Critical"
  },

  // TOXIC FOODS & SAFETY (Critical knowledge!)
  "chocolate|cocoa|choco": {
    response: `🚫 **NO! Chocolate is TOXIC to dogs!**

**Never give Dollar chocolate.** It contains theobromine and caffeine, which dogs cannot metabolize.

**Toxicity Levels (most to least dangerous):**
☠️ Baking chocolate - MOST toxic
☠️ Dark chocolate - Very toxic
⚠️ Milk chocolate - Toxic
⚠️ White chocolate - Least toxic (still avoid)

**Toxic dose for Dollar (8.5 kg):**
• Dark chocolate: ~40g can be dangerous
• Milk chocolate: ~100g can be dangerous

**Symptoms of chocolate poisoning:**
• Vomiting, diarrhea
• Rapid breathing, restlessness
• Muscle tremors
• Seizures (severe cases)

**If Dollar ate chocolate:**
1. Note WHAT type and HOW MUCH
2. Call poison control: +91 98765 00000
3. Or rush to emergency vet

🍫➡️🐕 = ❌ **NEVER**

**Safe alternatives Dollar can enjoy:**
✅ Carob treats (chocolate-like, dog-safe!)
✅ Peanut butter (his favorite!)
✅ Sweet potato chews`,
    intent: "Toxic food inquiry",
    pillar: "Care/Emergency",
    urgency: "High"
  },

  "grape|raisin|grapes|raisins": {
    response: `🚫 **NO! Grapes and raisins are HIGHLY TOXIC to dogs!**

Even small amounts can cause **acute kidney failure** in dogs.

**There is NO safe amount** - even 1-2 grapes can be dangerous for Dollar.

**Symptoms (within 6-12 hours):**
• Vomiting, diarrhea
• Lethargy, weakness
• Loss of appetite
• Decreased urination
• Abdominal pain

**If Dollar ate grapes/raisins:**
🚨 **This is an emergency!**
1. Call vet or poison control IMMEDIATELY
2. They may induce vomiting if recent
3. Kidney function monitoring needed

**Emergency Contacts:**
• 24/7 PetCare: +91 98765 43210
• Poison Helpline: +91 98765 00000

**Safe fruit alternatives:**
✅ Blueberries
✅ Watermelon (seedless)
✅ Apple slices (no seeds)
✅ Bananas`,
    intent: "Toxic food inquiry",
    pillar: "Emergency",
    urgency: "Critical"
  },

  "onion|garlic|onions": {
    response: `🚫 **NO! Onions and garlic are TOXIC to dogs!**

All members of the allium family are dangerous:
• Onions (raw, cooked, powder)
• Garlic
• Leeks, chives, shallots

**Why it's dangerous:**
Damages red blood cells → causes anemia

**Toxic amount for Dollar:**
• Onion: ~100g can be dangerous
• Garlic: Smaller amounts needed

**Symptoms (may take days to appear):**
• Weakness, lethargy
• Pale gums
• Rapid breathing
• Dark-colored urine
• Vomiting

**If Dollar ate onion/garlic:**
Monitor closely. If large amount, contact vet.

**Watch out for hidden sources:**
• Baby food
• Seasonings
• Prepared foods
• Pizza, pasta sauces

**Safe flavor alternatives:**
✅ Plain cooked meat
✅ Dog-safe broths (no onion/garlic)`,
    intent: "Toxic food inquiry",
    pillar: "Care",
    urgency: "High"
  },

  "xylitol|sugar free|sugarfree": {
    response: `🚫 **EXTREMELY DANGEROUS! Xylitol is highly toxic to dogs!**

Xylitol is an artificial sweetener that can be **fatal** to dogs even in small amounts.

**Where xylitol hides:**
• Sugar-free gum
• Sugar-free candy
• Peanut butter (some brands!)
• Toothpaste
• Baked goods
• Vitamins/supplements

⚠️ **Always check peanut butter labels!** Dollar loves peanut butter, so make sure yours is xylitol-free.

**Why it's so dangerous:**
Causes rapid insulin release → severe hypoglycemia (low blood sugar) → liver failure

**Symptoms (within 15-30 mins):**
• Vomiting
• Weakness, collapse
• Seizures
• Coma

**If Dollar ingested xylitol:**
🚨 **EMERGENCY - Go to vet IMMEDIATELY!**
Time is critical. Don't wait for symptoms.

**Safe peanut butter brands:**
✅ Regular Skippy/Jif (check label)
✅ 365 Organic
✅ Teddie All Natural`,
    intent: "Toxic food inquiry",
    pillar: "Emergency",
    urgency: "Critical"
  },

  "can dog eat|can dogs eat|safe for dog|ok for dog|good for dog": {
    response: `Great question! Let me help you know what's safe for Dollar.

**🚫 TOXIC - Never give to dogs:**
• Chocolate (all types)
• Grapes & raisins
• Onions & garlic
• Xylitol (artificial sweetener)
• Macadamia nuts
• Alcohol
• Caffeine
• Avocado (persin toxin)

**⚠️ CAUTION - Small amounts only:**
• Cheese (lactose)
• Milk
• Nuts (except macadamia - those are toxic)
• Salt
• Fatty foods

**✅ SAFE - Good for dogs:**
• Carrots
• Blueberries
• Watermelon (seedless)
• Apple (no seeds)
• Bananas
• Pumpkin (plain)
• Cooked chicken, lamb, fish
• Rice, oatmeal
• Peanut butter (xylitol-free!)

**For Dollar specifically:**
Remember he's allergic to chicken! Stick to lamb, fish, or beef.

What specific food were you wondering about?`,
    intent: "Food safety inquiry",
    pillar: "Care + Feed",
    urgency: "Normal"
  },

  // MULTI-INTENT (2 responses)
  "and also|and order|and book|and get": {
    response: `I can help with multiple things at once! Let me break this down:

**Request 1:** [Processing first request...]
**Request 2:** [Processing second request...]

I'll handle both for you. Which would you like me to start with?

*This is Mira's multi-intent capability — I can understand and process multiple requests in a single conversation!*`,
    intent: "Multi-intent detected",
    pillar: "Multiple",
    urgency: "Normal"
  },

  // DEFAULT / FALLBACK
  "default": {
    response: `I'm here to help with anything for Dollar! 

**I can assist with:**
🏥 **Health & Care** - Vet appointments, symptoms, medications
🛁 **Grooming** - Spa bookings, haircuts, at-home care
🍽️ **Food & Nutrition** - Diet plans, treats, allergies
✈️ **Travel & Stay** - Pet-friendly trips, boarding
🎉 **Celebrations** - Birthday parties, special occasions
🎓 **Training** - Behavior, obedience, socialization
🛒 **Shopping** - Products, toys, supplies
🛡️ **Protection** - Insurance, safety, emergencies

**Quick Info About Dollar:**
• 4-year-old Apricot Poodle
• Allergic to chicken 🚫
• Loves peanut butter treats
• Soul Score: 78%

What would you like help with today?`,
    intent: "General inquiry",
    pillar: "General",
    urgency: "Low"
  }
};

// Function to find best matching response
const findBestResponse = (query) => {
  const queryLower = query.toLowerCase();
  
  for (const [pattern, data] of Object.entries(CURATED_RESPONSES)) {
    if (pattern === 'default') continue;
    
    const patterns = pattern.split('|');
    for (const p of patterns) {
      if (queryLower.includes(p.toLowerCase())) {
        return data;
      }
    }
  }
  
  return CURATED_RESPONSES['default'];
};

// Pre-built test scenarios
const TEST_SCENARIOS = [
  { id: 1, query: "Dollar hasn't been eating well lately", 
    intent: "Implicit: appetite_loss", pillar: "Care", urgency: "High",
    icon: "🍽️",
    tourHighlight: "Watch how Mira detects health concerns from everyday language" },
  { id: 2, query: "Book grooming and order some treats", 
    intent: "Multi-intent: grooming + shop", pillar: "Groom + Shop", urgency: "Normal",
    icon: "✂️🦴",
    tourHighlight: "Multi-intent: Mira handles two requests in one message" },
  { id: 3, query: "I'm traveling to Goa next week with Dollar", 
    intent: "Travel planning", pillar: "Travel", urgency: "Normal",
    icon: "✈️",
    tourHighlight: "Travel planning with pet-specific recommendations" },
  { id: 4, query: "Dollar's birthday is on March 15th", 
    intent: "Celebration planning", pillar: "Celebrate", urgency: "Low",
    icon: "🎂",
    tourHighlight: "Mira remembers dates and plans celebrations" },
  { id: 5, query: "He's been vomiting since morning", 
    intent: "Emergency detection", pillar: "Emergency", urgency: "Critical",
    icon: "🚨",
    tourHighlight: "Emergency detection with immediate vet recommendations" },
  { id: 6, query: "Show me chicken-free food options", 
    intent: "Product search + allergy aware", pillar: "Shop", urgency: "Normal",
    icon: "🥗",
    tourHighlight: "Allergy-aware shopping that remembers Dollar's sensitivities" },
  { id: 7, query: "Dollar is scratching a lot lately",
    intent: "Implicit: skin_issue", pillar: "Care", urgency: "Medium",
    icon: "🐾",
    tourHighlight: "Implicit intent: understands scratching = potential skin issue" },
  { id: 8, query: "I need pet insurance for Dollar",
    intent: "Insurance inquiry", pillar: "Protect", urgency: "Low",
    icon: "🛡️",
    tourHighlight: "Insurance comparison tailored to breed-specific risks" },
];

// Tour steps for guided demo
const TOUR_STEPS = [
  { id: 'intro', title: 'Welcome to Mira OS™', description: 'This is a 2-minute guided tour showing Mira\'s intelligence capabilities. Click "Start Tour" to begin!', target: null },
  { id: 'chat', title: 'The Chat Interface', description: 'This is where conversations happen. Mira already knows Dollar - his breed, allergies, preferences, and history.', target: 'chat-interface' },
  { id: 'scenario-1', title: 'Health Detection', description: 'Try this scenario to see how Mira detects health concerns from natural language.', target: 'scenario-0', autoClick: true },
  { id: 'scenario-5', title: 'Emergency Mode', description: 'Watch how Mira immediately recognises emergencies and provides urgent guidance.', target: 'scenario-4', autoClick: true },
  { id: 'scenario-2', title: 'Multi-Intent Handling', description: 'Mira can handle multiple requests in a single message - grooming AND treats.', target: 'scenario-1', autoClick: true },
  { id: 'heritage', title: 'Our Heritage', description: '30 years of concierge expertise combined with AI intelligence. The Soul, The Brains, and The Hands.', target: 'heritage-section' },
  { id: 'complete', title: 'Tour Complete!', description: 'You\'ve seen Mira\'s key capabilities. Ready to discuss a partnership?', target: null },
];

// B2B Stats
const B2B_STATS = [
  { value: "38%", label: "Premium cardholders are pet parents", icon: CreditCard },
  { value: "₹18K+", label: "Average monthly pet spend", icon: TrendingUp },
  { value: "73%", label: "Would switch banks for pet benefits", icon: Building2 },
  { value: "4.2x", label: "Higher engagement with lifestyle perks", icon: Star },
];

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Simple markdown renderer for chat messages
const renderMarkdown = (text) => {
  if (!text) return null;
  
  // Split into lines
  const lines = text.split('\n');
  const elements = [];
  let key = 0;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Empty line = spacing
    if (!line.trim()) {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }
    
    // Headers (lines that are **bold** and standalone)
    if (line.match(/^\*\*[^*]+\*\*:?$/) || line.match(/^\*\*[^*]+:\*\*$/)) {
      const headerText = line.replace(/\*\*/g, '').replace(/:$/, '');
      elements.push(
        <div key={key++} className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-3 mb-1 text-base">{headerText}</div>
      );
      continue;
    }
    
    // Emoji bullet points (🥇, 🛁, ✅, ⚠️, etc)
    if (line.match(/^[🥇🥈🥉🛁✨💎📅🚨📍✅⚠️🏨🏠👤🎈🎉👑🧩🎾🦷🤗☠️🚫🍫➡️🐕❌]/)) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 my-1 ml-1">
          <span className="flex-shrink-0">{line.charAt(0)}</span>
          <span className="text-white/80" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(1).trim()) }} />
        </div>
      );
      continue;
    }
    
    // Regular bullet points
    if (line.match(/^[•·-]\s/)) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 my-0.5 ml-2">
          <span className="text-purple-400 mt-1">•</span>
          <span className="text-white/70" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
        </div>
      );
      continue;
    }
    
    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={key++} className="flex items-start gap-2 my-0.5 ml-2">
          <span className="text-purple-400 font-medium w-4">{num}.</span>
          <span className="text-white/70" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.replace(/^\d+\.\s/, '')) }} />
        </div>
      );
      continue;
    }
    
    // Checkbox style
    if (line.match(/^□\s/)) {
      elements.push(
        <div key={key++} className="flex items-center gap-2 my-0.5 ml-2 bg-white/5 rounded px-2 py-1">
          <div className="w-4 h-4 border border-purple-400 rounded" />
          <span className="text-white/80" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
        </div>
      );
      continue;
    }
    
    // Soul Score line
    if (line.includes('[Soul Score') || line.includes('*[Soul')) {
      const match = line.match(/\[Soul Score ([^\]]+)\]/);
      if (match) {
        elements.push(
          <div key={key++} className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-purple-300 text-xs italic">{match[1]}</span>
          </div>
        );
        continue;
      }
    }
    
    // Regular paragraph
    elements.push(
      <p key={key++} className="text-white/80 my-1" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
    );
  }
  
  return <div className="space-y-0">{elements}</div>;
};

// Format inline markdown (bold, italic, etc)
const formatInlineMarkdown = (text) => {
  return text
    // Bold - now pink/purple gradient effect with inline style
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-pink-400 font-semibold">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em class="text-purple-300">$1</em>')
    // Underline stars (⭐)
    .replace(/⭐/g, '<span class="text-yellow-400">⭐</span>')
    // Keep emojis visible
    .replace(/([\u{1F300}-\u{1F9FF}])/gu, '<span class="inline-block">$1</span>');
};

export default function DreamfolksDemo() {
  const [chatMessages, setChatMessages] = useState([
    { role: 'mira', content: `Hey! I'm Mira 👋

I already know Dollar — your 4-year-old Poodle who's allergic to chicken and loves peanut butter treats.

Ask me anything about him!` }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiThinking, setAiThinking] = useState(null);
  const [showThinkingPanel, setShowThinkingPanel] = useState(true);
  const [streamingText, setStreamingText] = useState('');
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const chatEndRef = useRef(null);
  const heritageRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    // Scroll within the messages container only, not the whole page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages, streamingText]);

  // Tour navigation functions
  const startTour = () => {
    setTourActive(true);
    setTourStep(0);
    // Reset chat to welcome state
    setChatMessages([{
      role: 'mira',
      content: `Hey! I'm Mira 👋

I already know Dollar — your 4-year-old Poodle who's allergic to chicken and loves peanut butter treats.

Ask me anything about him!`
    }]);
  };

  const nextTourStep = async () => {
    const nextStep = tourStep + 1;
    if (nextStep >= TOUR_STEPS.length) {
      setTourActive(false);
      setTourStep(0);
      return;
    }
    
    setTourStep(nextStep);
    const step = TOUR_STEPS[nextStep];
    
    // Auto-scroll to target
    if (step.target === 'heritage-section' && heritageRef.current) {
      heritageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (step.target === 'chat-interface') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Auto-click scenarios during tour
    if (step.autoClick && step.target?.startsWith('scenario-')) {
      const scenarioIndex = parseInt(step.target.split('-')[1]);
      const scenario = TEST_SCENARIOS[scenarioIndex];
      if (scenario) {
        // Small delay for visual effect
        await new Promise(r => setTimeout(r, 800));
        handleSendMessage(scenario.query);
      }
    }
  };

  const exitTour = () => {
    setTourActive(false);
    setTourStep(0);
  };

  // Tour Tooltip Component
  const TourTooltip = ({ step, onNext, onExit }) => {
    const currentStep = TOUR_STEPS[step];
    if (!currentStep) return null;
    
    const isFirst = step === 0;
    const isLast = step === TOUR_STEPS.length - 1;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%]"
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1 shadow-2xl shadow-purple-500/30">
          <div className="bg-[#1a0a2e] rounded-xl p-5">
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-4">
              {TOUR_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === step ? 'bg-pink-400' : i < step ? 'bg-purple-400' : 'bg-white/20'
                  }`} 
                />
              ))}
            </div>
            
            <h4 className="text-white font-bold text-lg mb-2">{currentStep.title}</h4>
            <p className="text-white/70 text-sm mb-4">{currentStep.description}</p>
            
            <div className="flex items-center justify-between">
              <button
                onClick={onExit}
                className="text-white/50 hover:text-white text-sm transition-colors"
              >
                Skip Tour
              </button>
              <Button
                onClick={onNext}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6"
              >
                {isFirst ? 'Start Tour' : isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Call real Mira API
  const callMiraAPI = async (userMessage) => {
    const thinking = {
      query: userMessage,
      steps: [{ step: "Query received", result: "✓", time: "2ms" }]
    };
    setAiThinking(thinking);
    setIsTyping(true);
    setStreamingText('');

    try {
      // Try streaming endpoint first
      const response = await fetch(`${API_URL}/api/mira/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          pet_id: "demo-dollar-dreamfolks",
          pet_name: "Dollar",
          pet_context: {
            name: "Dollar",
            breed: "Poodle", 
            age_years: 4,
            allergies: ["chicken"],
            preferences: { favorite_treats: ["peanut butter", "lamb jerky"] }
          },
          user_email: "demo@dreamfolks.in",
          session_id: `dreamfolks-${Date.now()}`,
          demo_mode: true
        })
      });

      if (response.ok && response.body) {
        thinking.steps.push({ step: "Pet memory loaded", result: "✓ Dollar (Poodle, no chicken)", time: "5ms" });
        setAiThinking({...thinking});

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  setStreamingText(fullText);
                }
                if (parsed.pillar) {
                  thinking.steps.push({ step: "Pillar", result: `✓ ${parsed.pillar}`, time: "3ms" });
                  setAiThinking({...thinking});
                }
              } catch {
                fullText += data;
                setStreamingText(fullText);
              }
            }
          }
        }

        thinking.steps.push({ step: "Complete", result: "✓", time: "done" });
        setAiThinking({...thinking});
        
        if (fullText) {
          setChatMessages(prev => [...prev, { role: 'mira', content: fullText }]);
        } else {
          throw new Error('Empty response');
        }
      } else {
        throw new Error('Streaming not available');
      }
    } catch (error) {
      // Fallback to non-streaming or curated
      console.log('Using fallback:', error.message);
      thinking.steps.push({ step: "Fallback mode", result: "✓", time: "5ms" });
      setAiThinking({...thinking});
      
      const fallback = findBestResponse(userMessage);
      setChatMessages(prev => [...prev, { role: 'mira', content: fallback.response }]);
    }

    setStreamingText('');
    setIsTyping(false);
  };

  const handleSendMessage = async (message) => {
    const query = message || inputMessage;
    if (!query.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', content: query }]);
    setInputMessage('');
    await callMiraAPI(query);
  };

  const handleScenarioClick = (scenario) => {
    // No scroll needed - tiles are now inside the chat container
    // Just send the message directly
    handleSendMessage(scenario.query);
  };

  const clearChat = () => {
    setChatMessages([{
      role: 'mira',
      content: `Fresh start! 🐩 What would you like to know about Dollar?`
    }]);
    setAiThinking(null);
    setStreamingText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* TDC Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <PawPrint className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-sm sm:text-lg">thedoggycompany</span>
                <span className="text-purple-400 text-[10px] sm:text-xs block">Mira OS™ Demo</span>
              </div>
            </div>

            {/* DreamFolks Badge - Hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 rounded-full border border-white/10">
              <span className="text-white/60 text-xs sm:text-sm">Prepared for</span>
              <img 
                src="https://customer-assets.emergentagent.com/job_2dad3d7e-c3ab-4896-a445-d39e2953ce1d/artifacts/omygtrey_image.png" 
                alt="DreamFolks" 
                className="h-5 sm:h-6 object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500/20 border border-orange-500/30 rounded-full">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
              <span className="text-orange-300 text-xs sm:text-sm">Exclusive Partnership</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Your Members Are<br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Pet Parents Too
              </span>
            </h1>
            
            <p className="text-white/60 text-sm sm:text-lg max-w-2xl mx-auto px-4">
              38% of premium cardholders have pets. Give them India's first AI-powered Pet Concierge® service.
            </p>

            {/* B2B Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-6 sm:mt-12 max-w-4xl mx-auto">
              {B2B_STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-4"
                >
                  <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/50 text-[10px] sm:text-xs leading-tight">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Guided Tour Button */}
            {!tourActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <Button
                  onClick={startTour}
                  data-testid="start-tour-btn"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-purple-500/30"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start 2-Minute Demo Tour
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Demo Pet Card */}
      <section className="py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">
                🐩
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Meet Dollar</h3>
                <p className="text-white/60 text-sm">Your demo pet</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3 justify-center sm:justify-start">
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-500/20 text-purple-300 text-[10px] sm:text-sm rounded-full">{DEMO_PET.breed}</span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-pink-500/20 text-pink-300 text-[10px] sm:text-sm rounded-full">{DEMO_PET.age}</span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-red-500/20 text-red-300 text-[10px] sm:text-sm rounded-full">🚫 Chicken</span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/20 text-green-300 text-[10px] sm:text-sm rounded-full">Soul: {DEMO_PET.soul_score}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Demo Area */}
      <section className="py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Chat Interface - No tabs, just chat */}
          <div ref={chatContainerRef} className="bg-[#1a0a2e]/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 sm:p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm sm:text-base">Mira AI</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Chatting with Dollar
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 hover:text-white text-xs transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Scenario Tiles - Inside chat, at top */}
            <div className="p-3 sm:p-4 border-b border-white/10 bg-[#12061f]/50">
              <h3 className="text-white/60 text-xs mb-2">Try asking about:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEST_SCENARIOS.map((scenario) => (
                  <motion.button
                    key={scenario.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleScenarioClick(scenario)}
                    className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg p-2 text-left transition-all"
                  >
                    <div className="text-lg mb-0.5">{scenario.icon}</div>
                    <div className="text-white/80 text-[10px] sm:text-xs line-clamp-2">{scenario.query}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={messagesContainerRef} className="h-[45vh] sm:h-[350px] overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain bg-[#12061f]">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'mira' && (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 flex-shrink-0 shadow-lg shadow-purple-500/30">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl rounded-br-sm px-4 py-3 shadow-lg shadow-pink-500/20'
                      : 'bg-purple-900/50 border border-purple-500/20 rounded-2xl rounded-bl-sm px-4 py-3'
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="text-white font-medium text-sm">{msg.content}</div>
                    ) : (
                      <div className="text-sm">{renderMarkdown(msg.content)}</div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 flex-shrink-0 shadow-lg shadow-purple-500/30 animate-pulse">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="bg-purple-900/50 border border-purple-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
                    {streamingText ? (
                      <div className="text-sm">{renderMarkdown(streamingText)}<span className="animate-pulse text-pink-400">▊</span></div>
                    ) : (
                      <div className="flex items-center gap-2 text-purple-300">
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                        <span className="text-sm italic">Mira is getting her thoughts together for Dollar...</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-[#1a0a2e]/80">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask Mira about Dollar..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl px-4 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage & Soul Section */}
      <section ref={heritageRef} id="heritage-section" className="py-16 px-4 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-4">
              <Heart className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm">Our Heritage</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              The Soul, The Brains & The Hands
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              This isn't just another pet app. It's 30 years of concierge heritage meets AI intelligence.
            </p>
          </div>

          {/* Three Pillars of Heritage */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* The Soul - Mira AI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 text-center"
            >
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-400/30 shadow-lg shadow-purple-500/30 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">The Soul</h3>
              <h4 className="text-white font-medium mb-3">Mira AI</h4>
              <p className="text-white/60 text-sm">
                Named after the quiet force who shaped our philosophy. Mira AI carries that spirit forward — 
                judgment over listing, memory over forgetting. AI that truly understands your pet's world.
              </p>
            </motion.div>

            {/* The Brains */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center">
                <Brain className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">The Brains</h3>
              <h4 className="text-white font-medium mb-3">Pet Soul™ Technology</h4>
              <p className="text-white/60 text-sm">
                AI that truly understands pets. Not just keywords — context, memory, urgency, and emotion. 
                12 life pillars. Implicit intent detection. Multi-intent handling. 
                The most intelligent pet AI in India.
              </p>
            </motion.div>

            {/* The Hands */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/20 flex items-center justify-center">
                <span className="text-4xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-green-300 mb-2">The Hands</h3>
              <h4 className="text-white font-medium mb-3">Human Concierge®</h4>
              <p className="text-white/60 text-sm">
                AI handles discovery. Humans handle execution. Real people book appointments, 
                plan parties, handle emergencies. Available 6:30 AM – 11:30 PM. 
                The perfect hybrid.
              </p>
            </motion.div>
          </div>

          {/* Heritage Timeline */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 text-center">30 Years in the Making</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { year: "1998", title: "LesConcierges®", desc: "Dipali Sikand builds premium concierge services" },
                { year: "2008", title: "Club Concierge®", desc: "Scales to serve 1M+ customers across India" },
                { year: "2020", title: "The Doggy Bakery®", desc: "Aditya launches, celebrates 45,000+ pets" },
                { year: "2026", title: "The Doggy Company®", desc: "AI + Human concierge for pets. India's first." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-purple-400 mb-1">{item.year}</div>
                  <div className="text-white font-medium text-sm mb-1">{item.title}</div>
                  <div className="text-white/50 text-xs">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pet Soul Explanation */}
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                What is Pet Soul™?
              </h3>
              <p className="text-white/70 mb-4">
                It's not a database. It's a living understanding of your pet that grows over time.
              </p>
              <ul className="space-y-2 text-white/60 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span><strong className="text-white">Preferences:</strong> What they love, hate, are allergic to</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span><strong className="text-white">History:</strong> Past purchases, vet visits, grooming</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span><strong className="text-white">Personality:</strong> Playful? Anxious? Social? Mira remembers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span><strong className="text-white">Relationships:</strong> Bonds with family, other pets, routines</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                12 Life Pillars
              </h3>
              <p className="text-white/70 mb-4">
                Every aspect of pet parenting, covered by one intelligent system:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Dine', 'Care', 'Go', 'Play', 'Learn', 'Services', 
                  'Shop', 'Celebrate', 'Emergency', 'Adopt', 'Farewell', 'Paperwork'].map((pillar, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/60">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                    {pillar}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-purple-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why DreamFolks Should Partner</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Pet parenting is a ₹30,000 Cr market growing at 25% YoY. Your premium members are already spending here.
            </p>
          </div>

          {/* Indian Pet Market + Banking Data */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 mb-12">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              🇮🇳 The India Opportunity: Pet Parents × Premium Banking
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Market Stats */}
              <div>
                <h4 className="text-lg font-semibold text-blue-300 mb-4">The Pet Market</h4>
                <div className="space-y-4">
                  {[
                    { stat: "₹30,000 Cr", label: "Indian pet care market (2026)", growth: "+25% YoY" },
                    { stat: "31 Million", label: "Pet dogs in India", growth: "+12% annually" },
                    { stat: "₹18,000+", label: "Monthly spend per pet (urban)", growth: "Premium segment" },
                    { stat: "89%", label: "Pet parents call pets 'family members'", growth: "Emotional bond" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <div className="text-white font-bold text-lg">{item.stat}</div>
                        <div className="text-white/60 text-sm">{item.label}</div>
                      </div>
                      <div className="text-green-400 text-xs font-medium">{item.growth}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Banking Correlation */}
              <div>
                <h4 className="text-lg font-semibold text-purple-300 mb-4">Premium Cardholders & Pets</h4>
                <div className="space-y-4">
                  {[
                    { stat: "38%", label: "Premium cardholders own pets", insight: "Higher than national avg" },
                    { stat: "2.3x", label: "Higher wallet share vs non-pet owners", insight: "Lifestyle spenders" },
                    { stat: "67%", label: "Would pay for pet concierge benefit", insight: "Willingness to pay" },
                    { stat: "73%", label: "Consider pet benefits in card choice", insight: "Differentiation" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <div className="text-white font-bold text-lg">{item.stat}</div>
                        <div className="text-white/60 text-sm">{item.label}</div>
                      </div>
                      <div className="text-purple-400 text-xs font-medium">{item.insight}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Insight Callout */}
            <div className="mt-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-6 text-center">
              <div className="text-amber-300 text-lg font-bold mb-2">
                "Pet parents are 34% less likely to churn when offered lifestyle benefits"
              </div>
              <div className="text-white/60 text-sm">
                — McKinsey Banking Consumer Survey, 2024
              </div>
            </div>
          </div>

          {/* Why Banks Should Care */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Why Banks Should Offer Pet Benefits</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { 
                  icon: Users, 
                  title: "Untapped Segment", 
                  desc: "No Indian bank offers comprehensive pet benefits. First-mover advantage.",
                  color: "text-blue-400"
                },
                { 
                  icon: TrendingUp, 
                  title: "High-Value Customers", 
                  desc: "Pet owners spend 2.3x more on lifestyle. Premium, loyal segment.",
                  color: "text-green-400"
                },
                { 
                  icon: Heart, 
                  title: "Emotional Connection", 
                  desc: "Pets = family. Banks that care for family earn trust & loyalty.",
                  color: "text-pink-400"
                },
                { 
                  icon: CreditCard, 
                  title: "Card Differentiation", 
                  desc: "Beyond cashback & lounge. A benefit that competitors can't copy overnight.",
                  color: "text-purple-400"
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5"
                >
                  <item.icon className={`w-8 h-8 ${item.color} mb-3`} />
                  <h4 className="text-white font-bold mb-2">{item.title}</h4>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* The DreamFolks Pitch */}
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8 mb-12">
            <div className="flex items-start gap-6">
              <div className="hidden md:block">
                <img 
                  src="https://customer-assets.emergentagent.com/job_2dad3d7e-c3ab-4896-a445-d39e2953ce1d/artifacts/omygtrey_image.png" 
                  alt="DreamFolks" 
                  className="w-32 h-auto opacity-80"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-4">The DreamFolks Opportunity</h3>
                <p className="text-white/70 mb-4">
                  You already offer airport lounges, golf, dining, and lifestyle benefits. 
                  <strong className="text-white"> Pet concierge is the next frontier</strong> — and the only one 
                  with 25% annual growth and zero competition in the banking space.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">50+</div>
                    <div className="text-white/60 text-sm">Bank partnerships potential</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">10M+</div>
                    <div className="text-white/60 text-sm">Premium cardholders addressable</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">₹200 Cr</div>
                    <div className="text-white/60 text-sm">Annual GMV opportunity</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Original Partnership Benefits */}
          <h3 className="text-xl font-bold text-white mb-6 text-center">Partnership Model</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Member Retention",
                description: "Lifestyle benefits reduce churn by 34%. Pet services are the highest-engagement lifestyle vertical.",
                icon: Users,
                stat: "34% lower churn"
              },
              {
                title: "Simple Membership",
                description: "Clean, predictable pricing per member. No complex revenue splits. Banks purchase memberships for cardholders.",
                icon: CreditCard,
                stat: "Per-member pricing"
              },
              {
                title: "White-Label Ready",
                description: "We can deploy Mira OS under your brand. Your app, your members, our technology.",
                icon: Building2,
                stat: "4-week integration"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <item.icon className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 mb-4">{item.description}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  <Check className="w-4 h-4" />
                  {item.stat}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Explore?</h2>
            <p className="text-white/60 mb-8">
              Let's discuss how Mira OS can become a member benefit for your cardholders.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+919739908844">
                <Button className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-6 text-lg w-full">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule a Call
                </Button>
              </a>
              <a href="mailto:dipali@clubconcierge.in">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg w-full">
                  <Mail className="w-5 h-5 mr-2" />
                  partnerships@thedoggycompany.in
                </Button>
              </a>
            </div>

            <p className="text-white/40 text-sm mt-6">
              Or call us directly: <a href="tel:+919739908844" className="hover:text-white/60 transition-colors">+91 97399 08844</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold">thedoggycompany</span>
          </div>
          <p className="text-white/40 text-sm">
            © 2026 The Doggy Company®. Mira™ is a trademark of The Doggy Company.
          </p>
        </div>
      </footer>

      {/* Tour Overlay & Tooltip */}
      <AnimatePresence>
        {tourActive && (
          <>
            {/* Semi-transparent overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[90] pointer-events-none"
            />
            {/* Tour Tooltip */}
            <TourTooltip step={tourStep} onNext={nextTourStep} onExit={exitTour} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
