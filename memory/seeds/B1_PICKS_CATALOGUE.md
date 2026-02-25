# B1 PICKS CATALOGUE - MIRA OS
## seed_version: 1.0.0
## source_doc_version: Mira_OS_Taxonomy_Routing_Picks_Spec_v1_2

---

## PICK SCHEMA

```json
{
  "pick_id": "string (unique)",
  "pillar": "string (lowercase)",
  "canonical_tags": ["array of tag strings"],
  "pick_type": "guide | booking | product | checklist | concierge | emergency",
  "title": "string",
  "cta": "string (call to action)",
  "reason_template": "string with {pet_name}, {breed}, {age_stage}, {city}, {allergies}, {coat_type}, {last_service_date} etc.",
  "constraints": {
    "species": ["dog", "cat", "both"],
    "age_stage": ["puppy", "adult", "senior", null],
    "exclude_health_flags": ["array of flags to exclude"],
    "required_profile_fields": ["array of fields needed for personalization"]
  },
  "service_vertical": "string (for booking picks)",
  "service_types": ["array of allowed service types"],
  "base_score": "number (0-100)",
  "concierge_complexity": "low | medium | high",
  "safety_level": "normal | caution | emergency",
  "seed_version": "string",
  "source_doc_version": "string",
  "created_at": "datetime"
}
```

---

## ROUTING RULES

1. **safety_level = emergency** → Only emergency picks, suppress everything else
2. **safety_level = caution** → Allow education + vet routing, suppress shopping pushes
3. **pick_type = booking** → Must have `service_vertical` + `service_types` mapping
4. **Concierge-always** → Keep one concierge pick when complexity is medium/high or confidence low

---

## PICK DISTRIBUTION (100 Total)

| Pillar | Target | Actual |
|--------|--------|--------|
| care | 18 | 18 |
| dine | 12 | 12 |
| stay | 10 | 10 |
| travel | 10 | 10 |
| enjoy | 8 | 8 |
| fit | 8 | 8 |
| learn | 8 | 8 |
| celebrate | 8 | 8 |
| adopt | 6 | 6 |
| advisory | 6 | 6 |
| paperwork | 6 | 6 |
| emergency | 6 | 6 |
| farewell | 4 | 4 |
| **TOTAL** | **100** | **100** |

---

## PICKS BY PILLAR

### CARE (18 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| care_grooming_book | booking | Book Grooming Session | Book Now | grooming |
| care_grooming_home | booking | At-Home Grooming | Book Home Visit | grooming |
| care_bath_book | booking | Schedule Bath | Book Bath | bath |
| care_nail_trim_book | booking | Nail Trim Appointment | Book Nail Trim | nail_trim |
| care_dental_book | booking | Dental Cleaning | Book Dental | dental_hygiene |
| care_vet_checkup | booking | Vet Check-up | Book Vet Visit | vet_appointment |
| care_vaccination_book | booking | Vaccination Appointment | Schedule Vaccine | vaccination_schedule |
| care_coat_guide | guide | Coat Care Guide | Learn More | grooming, skin_coat_guidance |
| care_dental_guide | guide | Dental Health Guide | Read Guide | dental_hygiene |
| care_puppy_care_checklist | checklist | Puppy Care Checklist | View Checklist | hygiene_routine |
| care_senior_wellness | guide | Senior Dog Wellness | Learn More | joint_support_guidance |
| care_flea_tick_guide | guide | Flea & Tick Prevention Guide | Read Guide | flea_tick_prevention |
| care_grooming_products | product | Grooming Essentials | Shop Now | grooming |
| care_supplements_shop | product | Recommended Supplements | Shop Now | supplements_guidance |
| care_vomiting_vet | guide | Vomiting - When to See Vet | Read Now | mild_vomiting |
| care_diarrhea_vet | guide | Diarrhea - Vet Guidance | Read Now | diarrhea |
| care_lethargy_vet | guide | Low Energy - What to Watch | Read Now | lethargy |
| care_concierge | concierge | Arrange Care Services | Let Us Help | vet_appointment, grooming |

### DINE (12 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| dine_meal_plan | guide | Custom Meal Plan | Get Plan | meals |
| dine_puppy_nutrition | guide | Puppy Nutrition Guide | Learn More | puppy_nutrition |
| dine_senior_nutrition | guide | Senior Dog Diet Guide | Learn More | senior_nutrition |
| dine_allergy_safe | guide | Allergy-Safe Foods | View Options | allergy_safe |
| dine_picky_eater | guide | Picky Eater Solutions | Get Tips | picky_eater |
| dine_weight_loss | guide | Weight Loss Diet Plan | Start Plan | weight_loss_diet |
| dine_food_transition | guide | Food Transition Guide | Read Guide | food_transition |
| dine_treats_shop | product | Healthy Treats | Shop Treats | treats |
| dine_food_subscription | product | Food Subscription | Subscribe | subscription_food |
| dine_toxic_foods | checklist | Toxic Foods Checklist | View List | toxic_avoidance |
| dine_raw_diet_guide | guide | Raw Diet Starter Guide | Learn More | raw_diet |
| dine_concierge | concierge | Custom Diet Planning | Get Help | meals, allergy_safe |

### STAY (10 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| stay_boarding_book | booking | Book Boarding | Find Boarding | kennel |
| stay_premium_boarding | booking | Premium Boarding | Book Luxury | premium_boarding |
| stay_daycare_book | booking | Book Daycare | Find Daycare | daycare |
| stay_pet_sitter | booking | Find Pet Sitter | Book Sitter | pet_sitting |
| stay_overnight_sitter | booking | Overnight Sitter | Book Overnight | overnight_sitter |
| stay_boarding_checklist | checklist | Boarding Checklist | View Checklist | kennel |
| stay_separation_anxiety | guide | Separation Anxiety Guide | Read Guide | separation_anxiety_stay |
| stay_first_boarding | guide | First Boarding Tips | Learn More | trial_night |
| stay_senior_boarding | guide | Senior Pet Boarding Guide | Read Guide | senior_boarding |
| stay_concierge | concierge | Arrange Boarding | Let Us Help | kennel, daycare |

### TRAVEL (10 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| travel_air_guide | guide | Flying with Your Pet | Read Guide | air_travel |
| travel_car_guide | guide | Road Trip Guide | Get Tips | car_travel |
| travel_pet_taxi | booking | Book Pet Taxi | Book Now | pet_taxi |
| travel_airport_transfer | booking | Airport Transfer | Book Transfer | airport_transfer |
| travel_fit_to_fly | guide | Fit-to-Fly Requirements | Learn More | fit_to_fly |
| travel_international | guide | International Travel Guide | Read Guide | international_travel |
| travel_crate_guide | guide | Crate Selection Guide | Find Crate | crate_selection |
| travel_motion_sickness | guide | Motion Sickness Tips | Get Tips | motion_sickness |
| travel_checklist | checklist | Travel Packing Checklist | View List | travel_kit |
| travel_concierge | concierge | Plan Pet Travel | Get Help | air_travel, pet_taxi |

### ENJOY (8 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| enjoy_dog_parks | guide | Dog Parks Near You | Find Parks | dog_parks |
| enjoy_pet_cafes | guide | Pet-Friendly Cafes | Explore | cafes |
| enjoy_playdates | guide | Arrange Playdates | Find Friends | playdates |
| enjoy_enrichment | guide | Enrichment Activities | Get Ideas | enrichment_games |
| enjoy_toys_shop | product | Interactive Toys | Shop Toys | toys |
| enjoy_noise_phobia | guide | Noise Anxiety Guide | Read Guide | noise_phobia_support |
| enjoy_weekend_getaway | guide | Pet-Friendly Getaways | Explore | weekend_getaway |
| enjoy_concierge | concierge | Plan Pet Activities | Get Help | playdates, weekend_getaway |

### FIT (8 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| fit_walker_book | booking | Book Dog Walker | Find Walker | daily_walks |
| fit_training_book | booking | Book Trainer | Find Trainer | basic_obedience |
| fit_puppy_exercise | guide | Puppy Exercise Guide | Read Guide | puppy_energy |
| fit_senior_mobility | guide | Senior Mobility Tips | Learn More | senior_mobility |
| fit_leash_training | guide | Leash Training Guide | Get Tips | leash_training |
| fit_reactivity_guide | guide | Reactivity Training | Read Guide | reactivity |
| fit_harness_shop | product | Find the Right Harness | Shop Now | harnesses |
| fit_concierge | concierge | Arrange Training | Get Help | basic_obedience, socialisation |

### LEARN (8 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| learn_new_pet | guide | New Pet Parent Guide | Start Here | new_pet_parenting |
| learn_breed_guide | guide | Breed-Specific Guide | Learn More | breed_guide |
| learn_potty_training | guide | Potty Training 101 | Read Guide | training_basics_education |
| learn_first_aid | guide | Pet First Aid Basics | Learn Now | first_aid_education |
| learn_trainer_class | booking | Book Trainer Class | Find Class | trainer_class |
| learn_video_library | guide | Training Videos | Watch Now | video_library |
| learn_socialisation | guide | Socialisation Guide | Read Guide | socialisation_education |
| learn_concierge | concierge | Expert Consultation | Get Help | qa_with_expert |

### CELEBRATE (8 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| celebrate_birthday | guide | Plan Birthday Party | Start Planning | birthday |
| celebrate_cake_order | product | Order Pet-Safe Cake | Order Now | cakes |
| celebrate_photo_shoot | booking | Book Photo Shoot | Book Now | photo_shoot |
| celebrate_gotcha_day | guide | Gotcha Day Ideas | Get Ideas | gotcha_day |
| celebrate_hamper | product | Gift Hamper | Shop Now | personalised_hamper |
| celebrate_paw_print | product | Paw Print Keepsake | Order Now | paw_print |
| celebrate_pawty_guide | guide | Pawty Planning Guide | Read Guide | pawty |
| celebrate_concierge | concierge | Plan Celebration | Get Help | birthday, pawty |

### ADOPT (6 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| adopt_where | guide | Where to Adopt | Find Shelters | where_to_adopt |
| adopt_breed_match | guide | Find Your Match | Take Quiz | breed_match_adoption |
| adopt_first_week | checklist | First Week Checklist | View List | first_week_plan |
| adopt_home_setup | guide | Home Setup Guide | Prepare Home | home_setup_adoption |
| adopt_intro_pets | guide | Introduce to Other Pets | Read Guide | introduce_to_pets |
| adopt_concierge | concierge | Adoption Support | Get Help | post_adoption_support |

### ADVISORY (6 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| advisory_choose | guide | Help Me Choose | Get Advice | what_to_choose |
| advisory_compare | guide | Compare Options | See Comparison | pros_cons |
| advisory_nutrition | booking | Nutrition Consultation | Book Consult | nutrition_consult |
| advisory_behaviour | booking | Behaviour Consultation | Book Consult | behaviour_expert |
| advisory_vet_first | guide | Should I See a Vet? | Check Now | vet_first |
| advisory_concierge | concierge | Expert Guidance | Get Help | escalation_required |

### PAPERWORK (6 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| paperwork_vaccine_records | guide | Get Vaccine Records | Learn How | vaccination_records_doc |
| paperwork_microchip | guide | Microchip Registration | Register Now | microchip_docs |
| paperwork_fit_to_fly | guide | Fit-to-Fly Letter | Get Letter | fit_to_fly_letters |
| paperwork_insurance | guide | Pet Insurance Guide | Learn More | insurance_claim |
| paperwork_document_vault | guide | Store Pet Documents | Save Docs | document_vault |
| paperwork_concierge | concierge | Paperwork Assistance | Get Help | travel_permits |

### EMERGENCY (6 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| emergency_vet_now | emergency | Find Emergency Vet | Call Now | emergency_vet |
| emergency_poison | emergency | Poison Emergency | Get Help Now | poison_ingestion |
| emergency_choking | emergency | Choking First Aid | View Steps | choking |
| emergency_breathing | emergency | Breathing Emergency | Get Help Now | breathing_distress |
| emergency_heatstroke | emergency | Heatstroke Response | View Steps | heatstroke |
| emergency_concierge | emergency | Emergency Routing | Get Help Now | nearest_emergency |

### FAREWELL (4 picks)

| pick_id | pick_type | title | cta | tags |
|---------|-----------|-------|-----|------|
| farewell_quality_life | guide | Quality of Life Guide | Read Guide | quality_of_life |
| farewell_memorial | guide | Memorial Options | Explore | cremation_burial, memorial_keepsakes |
| farewell_grief_support | guide | Grief Support Resources | Get Support | grief_support |
| farewell_concierge | concierge | Compassionate Support | Get Help | palliative_care, euthanasia_support |

---

## 20 TEST PROMPTS + EXPECTED TOP 3 PICKS

### Test 1: "Looking for grooming for Mojo"
**Classification:** pillar=care, tags=[grooming], intent=book
**Expected Top 3:**
1. `care_grooming_book` - Book Grooming Session
2. `care_grooming_home` - At-Home Grooming
3. `care_coat_guide` - Coat Care Guide for {breed}

### Test 2: "Mojo ate chocolate"
**Classification:** pillar=emergency, tags=[poison_ingestion], safety_level=emergency
**Expected Top 3:**
1. `emergency_poison` - Poison Emergency (HARD OVERRIDE)
2. `emergency_vet_now` - Find Emergency Vet
3. `emergency_concierge` - Emergency Routing

### Test 3: "Looking for a cake for Mojo's birthday"
**Classification:** pillar=celebrate, tags=[cakes, birthday], intent=buy
**Expected Top 3:**
1. `celebrate_cake_order` - Order Pet-Safe Cake
2. `celebrate_birthday` - Plan Birthday Party
3. `celebrate_pawty_guide` - Pawty Planning Guide

### Test 4: "Mojo keeps vomiting"
**Classification:** pillar=care, tags=[mild_vomiting], safety_level=caution
**Expected Top 3:**
1. `care_vomiting_vet` - Vomiting - When to See Vet (education + vet routing)
2. `care_vet_checkup` - Book Vet Check-up
3. `care_concierge` - Arrange Care Services

### Test 5: "Need boarding for next week"
**Classification:** pillar=stay, tags=[kennel], intent=book
**Expected Top 3:**
1. `stay_boarding_book` - Book Boarding
2. `stay_premium_boarding` - Premium Boarding
3. `stay_boarding_checklist` - Boarding Checklist

### Test 6: "Flying with my dog to Dubai"
**Classification:** pillar=travel, tags=[air_travel, international_travel]
**Expected Top 3:**
1. `travel_air_guide` - Flying with Your Pet
2. `travel_international` - International Travel Guide
3. `travel_fit_to_fly` - Fit-to-Fly Requirements

### Test 7: "Mojo is not eating"
**Classification:** pillar=care, tags=[loss_appetite], safety_level=caution
**Expected Top 3:**
1. `care_lethargy_vet` - Low Energy - What to Watch
2. `care_vet_checkup` - Book Vet Check-up
3. `dine_picky_eater` - Picky Eater Solutions

### Test 8: "Need a dog walker"
**Classification:** pillar=fit, tags=[daily_walks], intent=book, service_vertical=dog_walking
**Expected Top 3:**
1. `fit_walker_book` - Book Dog Walker
2. `fit_puppy_exercise` - Puppy Exercise Guide
3. `fit_concierge` - Arrange Training

### Test 9: "Just adopted a puppy"
**Classification:** pillar=adopt/learn, tags=[new_pet_parenting, first_week_plan]
**Expected Top 3:**
1. `learn_new_pet` - New Pet Parent Guide
2. `adopt_first_week` - First Week Checklist
3. `adopt_home_setup` - Home Setup Guide

### Test 10: "Mojo has seizures"
**Classification:** pillar=emergency, tags=[seizure], safety_level=emergency
**Expected Top 3:**
1. `emergency_vet_now` - Find Emergency Vet (HARD OVERRIDE)
2. `emergency_concierge` - Emergency Routing
3. (suppress all other picks)

### Test 11: "Book a vet appointment"
**Classification:** pillar=care, tags=[vet_appointment], intent=book, service_vertical=vet_care
**Expected Top 3:**
1. `care_vet_checkup` - Vet Check-up
2. `care_vaccination_book` - Vaccination Appointment
3. `care_concierge` - Arrange Care Services

### Test 12: "Best food for senior dog"
**Classification:** pillar=dine, tags=[senior_nutrition]
**Expected Top 3:**
1. `dine_senior_nutrition` - Senior Dog Diet Guide
2. `dine_meal_plan` - Custom Meal Plan
3. `dine_concierge` - Custom Diet Planning

### Test 13: "Scared of fireworks"
**Classification:** pillar=enjoy, tags=[noise_phobia_support]
**Expected Top 3:**
1. `enjoy_noise_phobia` - Noise Anxiety Guide
2. `enjoy_enrichment` - Enrichment Activities
3. `enjoy_concierge` - Plan Pet Activities

### Test 14: "Pet photography"
**Classification:** pillar=celebrate, tags=[photo_shoot], intent=book, service_vertical=pet_photography
**Expected Top 3:**
1. `celebrate_photo_shoot` - Book Photo Shoot
2. `celebrate_pawty_guide` - Pawty Planning Guide
3. `celebrate_concierge` - Plan Celebration

### Test 15: "Puppy training classes"
**Classification:** pillar=learn/fit, tags=[trainer_class, basic_obedience], intent=book, service_vertical=training
**Expected Top 3:**
1. `learn_trainer_class` - Book Trainer Class
2. `fit_training_book` - Book Trainer
3. `learn_potty_training` - Potty Training 101

### Test 16: "My dog is limping"
**Classification:** pillar=care, tags=[limping], safety_level=caution
**Expected Top 3:**
1. `care_vet_checkup` - Vet Check-up (caution routing)
2. `advisory_vet_first` - Should I See a Vet?
3. `care_concierge` - Arrange Care Services

### Test 17: "Treats for allergic dog"
**Classification:** pillar=dine, tags=[treats, allergy_safe], intent=buy
**Expected Top 3:**
1. `dine_allergy_safe` - Allergy-Safe Foods
2. `dine_treats_shop` - Healthy Treats
3. `dine_concierge` - Custom Diet Planning

### Test 18: "Mojo can't breathe"
**Classification:** pillar=emergency, tags=[breathing_distress], safety_level=emergency
**Expected Top 3:**
1. `emergency_breathing` - Breathing Emergency (HARD OVERRIDE)
2. `emergency_vet_now` - Find Emergency Vet
3. `emergency_concierge` - Emergency Routing

### Test 19: "Memorial for my dog"
**Classification:** pillar=farewell, tags=[memorial_keepsakes, cremation_burial]
**Expected Top 3:**
1. `farewell_memorial` - Memorial Options
2. `farewell_grief_support` - Grief Support Resources
3. `farewell_concierge` - Compassionate Support

### Test 20: "Help me choose between boarding and sitter"
**Classification:** pillar=advisory/stay, tags=[what_to_choose, pros_cons, kennel, pet_sitting]
**Expected Top 3:**
1. `advisory_compare` - Compare Options
2. `stay_boarding_book` - Book Boarding
3. `stay_pet_sitter` - Find Pet Sitter

---

## REASON TEMPLATES (Examples)

### care_grooming_book
```
"{pet_name} is a {breed} with a {coat_type} coat. Regular grooming every 4-6 weeks keeps their coat healthy and prevents matting."
```

### dine_allergy_safe
```
"Based on {pet_name}'s known allergies ({allergies}), here are safe food options that avoid these ingredients."
```

### stay_boarding_book
```
"{pet_name} will be comfortable at a boarding facility that matches their {energy_level} energy level. We recommend places with {temperament}-friendly environments."
```

### emergency_poison
```
"URGENT: If {pet_name} ate something toxic, contact your nearest emergency vet immediately. Do not induce vomiting without vet guidance."
```

### celebrate_birthday
```
"{pet_name} turns {age} on {dob}! Let's plan a special celebration with pet-safe treats and activities."
```

---

*B1 Picks Catalogue - Created December 2025*
*seed_version: 1.0.0*
