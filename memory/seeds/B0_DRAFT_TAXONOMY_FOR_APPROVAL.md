# B0 DRAFT TAXONOMY - FOR APPROVAL
## seed_version: 1.0.0
## source_doc_version: Mira_OS_Taxonomy_Routing_Picks_Spec_v1_2

---

## ROUTING RULE (Hardcoded Priority)

```
1. EMERGENCY GATE (hard override) → if safety_level = "emergency" → Emergency pillar
2. CAUTION FLAG → if safety_level = "caution" → Add warning, continue routing
3. BUY INTENT → if intent = purchase/product/shop → Shop cluster (under relevant pillar)
4. BOOK/ARRANGE INTENT → if intent = book/schedule/arrange → Services layer (cross-pillar)
5. ELSE → Route to matching pillar by tag
```

---

## LOCKED PILLAR SET (13 Life Domains)

| # | pillar | pillar_display | description |
|---|--------|----------------|-------------|
| 1 | care | Care | Physical wellbeing, grooming, preventive health (non-diagnostic) |
| 2 | dine | Dine | Nutrition, feeding, diet (not shopping) |
| 3 | stay | Stay | Boarding, sitting, habitat, sleep |
| 4 | travel | Travel | Movement, transport, documentation |
| 5 | enjoy | Enjoy | Play, enrichment, social, outings |
| 6 | fit | Fit | Exercise, mobility, physical activity |
| 7 | learn | Learn | Training, education, behaviour shaping |
| 8 | celebrate | Celebrate | Milestones, events, memories |
| 9 | adopt | Adopt | Adoption, fostering, integration |
| 10 | advisory | Advisory | Expert guidance, second opinions |
| 11 | paperwork | Paperwork | Documents, certificates, compliance |
| 12 | emergency | Emergency | Acute risk, immediate response (HARD OVERRIDE) |
| 13 | farewell | Farewell | End-of-life, memorial, grief |

**NOT PILLARS:**
- `shop` → Cluster under relevant pillars (buy intent routing)
- `services` → Cross-pillar fulfilment layer (book intent routing)
- `health` → Lives inside `care` (non-diagnostic)

---

## CANONICAL TAGS BY PILLAR

### 1. CARE (25 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| grooming | grooming | Grooming | Full grooming service | safe | medium |
| grooming | bath | Bath | Bathing service | safe | medium |
| grooming | haircut | Haircut | Hair/fur cutting | safe | medium |
| grooming | nail_trim | Nail Trim | Nail clipping | safe | medium |
| grooming | ear_cleaning | Ear Cleaning | Ear cleaning service | safe | medium |
| grooming | dental_hygiene | Dental Hygiene | Teeth cleaning (non-medical) | safe | medium |
| grooming | deshedding | De-shedding | Coat de-shedding | safe | low |
| grooming | paw_care | Paw Care | Paw pad care | safe | low |
| grooming | tick_bath | Tick Bath | Anti-tick treatment bath | safe | medium |
| preventive | vaccination | Vaccination | Vaccine scheduling | safe | high |
| preventive | deworming | Deworming | Deworming schedule | safe | high |
| preventive | flea_tick_prevention | Flea & Tick Prevention | Parasite prevention | safe | high |
| wellness | supplements | Supplements | Supplement guidance | safe | medium |
| wellness | weight_program | Weight Program | Weight management plan | safe | medium |
| wellness | skin_coat_care | Skin & Coat Care | Skin/coat wellness | safe | medium |
| wellness | joint_care | Joint Care | Joint support guidance | safe | medium |
| routine | hygiene | Hygiene | General hygiene maintenance | safe | medium |
| routine | potty_support | Potty Support | House training support | safe | medium |
| routine | sleep_routine | Sleep Routine | Sleep pattern guidance | safe | low |
| medical_routing | vet_visit | Vet Visit | Vet appointment routing | safe | high |
| medical_routing | specialist_referral | Specialist Referral | Route to specialist | safe | high |
| medical_routing | diagnostics | Diagnostics | Route to diagnostic services | safe | high |
| symptoms | mild_vomiting | Mild Vomiting | Occasional vomiting | caution | high |
| symptoms | diarrhea | Diarrhea | Loose stools | caution | high |
| symptoms | lethargy | Lethargy | Unusual tiredness | caution | high |
| symptoms | loss_appetite | Loss of Appetite | Not eating normally | caution | high |
| symptoms | limping | Limping | Mobility issue | caution | high |
| symptoms | excessive_scratching | Excessive Scratching | Skin irritation | caution | medium |
| symptoms | eye_discharge | Eye Discharge | Eye issues | caution | medium |

---

### 2. DINE (22 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| food_types | meals | Meals | Regular meal planning | safe | high |
| food_types | treats | Treats | Treat selection/guidance | safe | medium |
| food_types | chews | Chews | Chew products guidance | safe | medium |
| food_types | toppers | Toppers | Food toppers | safe | low |
| food_types | hydration | Hydration | Water/fluid intake | safe | medium |
| diet_styles | home_cooked | Home Cooked | Home-prepared meals | safe | medium |
| diet_styles | raw_diet | Raw Diet | Raw feeding guidance | safe | medium |
| diet_styles | grain_free | Grain Free | Grain-free diet | safe | medium |
| diet_styles | limited_ingredient | Limited Ingredient | LID guidance | safe | medium |
| nutrition_goals | weight_loss_diet | Weight Loss Diet | Diet for weight loss | safe | medium |
| nutrition_goals | weight_gain_diet | Weight Gain Diet | Diet for weight gain | safe | medium |
| nutrition_goals | puppy_nutrition | Puppy Nutrition | Puppy feeding guidance | safe | high |
| nutrition_goals | senior_nutrition | Senior Nutrition | Senior dog nutrition | safe | high |
| health_diet | sensitive_stomach | Sensitive Stomach | Digestive sensitivity | safe | high |
| health_diet | allergy_safe | Allergy Safe | Allergy-friendly diet | safe | high |
| health_diet | skin_coat_diet | Skin & Coat Diet | Diet for skin/coat | safe | medium |
| behaviour_diet | picky_eater | Picky Eater | Picky eating guidance | safe | medium |
| behaviour_diet | food_transition | Food Transition | Diet transition plan | safe | medium |
| behaviour_diet | appetite_support | Appetite Support | Appetite improvement | safe | medium |
| safety | toxic_avoidance | Toxic Avoidance | Foods to avoid | safe | critical |
| safety | label_check | Label Check | Ingredient screening | safe | medium |
| ordering | subscription_food | Food Subscription | Recurring food delivery | safe | low |

---

### 3. STAY (20 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| boarding | kennel | Kennel | Kennel boarding | safe | high |
| boarding | premium_boarding | Premium Boarding | Luxury boarding | safe | medium |
| boarding | cage_free | Cage Free | Cage-free boarding | safe | medium |
| boarding | vet_boarding | Vet Boarding | Medical boarding | safe | high |
| boarding | senior_boarding | Senior Boarding | Senior-friendly boarding | safe | high |
| boarding | puppy_boarding | Puppy Boarding | Puppy-safe boarding | safe | high |
| daycare | daycare | Daycare | Daytime daycare | safe | high |
| at_home | pet_sitting | Pet Sitting | In-home sitting | safe | high |
| at_home | overnight_sitter | Overnight Sitter | Overnight home sitting | safe | high |
| at_home | drop_in_visits | Drop-in Visits | Check-in visits | safe | medium |
| at_home | house_sitting | House Sitting | Full house sitting | safe | medium |
| comfort | separation_anxiety_stay | Separation Anxiety | Anxiety-aware boarding | safe | high |
| comfort | routine_matching | Routine Matching | Routine-matched care | safe | medium |
| comfort | senior_friendly_stay | Senior Friendly | Senior accommodations | safe | high |
| comfort | puppy_safe_stay | Puppy Safe | Puppy-safe environment | safe | high |
| comfort | multi_pet_stay | Multi-Pet Stay | Multiple pet boarding | safe | medium |
| trust | trial_night | Trial Night | Trial boarding | safe | medium |
| trust | daily_updates | Daily Updates | Photo/video updates | safe | medium |
| trust | webcam_access | Webcam Access | Live camera access | safe | low |
| logistics | pickup_drop | Pickup & Drop | Transport to/from | safe | medium |

---

### 4. TRAVEL (22 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| mode | car_travel | Car Travel | Road travel guidance | safe | medium |
| mode | train_travel | Train Travel | Train travel guidance | safe | medium |
| mode | air_travel | Air Travel | Flight travel guidance | safe | high |
| mode | international_travel | International Travel | Cross-border travel | safe | high |
| docs | vaccination_records | Vaccination Records | Vaccine documentation | safe | high |
| docs | health_certificate | Health Certificate | Health cert for travel | safe | high |
| docs | fit_to_fly | Fit to Fly | Flight fitness cert | safe | high |
| docs | import_export | Import/Export | Country regulations | safe | high |
| docs | pet_passport | Pet Passport | Passport documentation | safe | high |
| carrier | crate_selection | Crate Selection | Travel crate guidance | safe | medium |
| carrier | crate_training | Crate Training | Crate comfort training | safe | medium |
| carrier | airline_policy | Airline Policy | Airline rules lookup | safe | high |
| carrier | cargo_vs_cabin | Cargo vs Cabin | Flight placement | safe | high |
| comfort | motion_sickness | Motion Sickness | Travel sickness support | safe | medium |
| comfort | anxiety_travel | Travel Anxiety | Travel stress support | safe | medium |
| comfort | temperature_risk | Temperature Risk | Heat/cold travel risk | caution | high |
| routing | pet_friendly_routes | Pet-Friendly Routes | Route planning | safe | medium |
| routing | pit_stops | Pit Stops | Rest stop planning | safe | medium |
| routing | destination_stays | Destination Stays | Pet-friendly stays | safe | medium |
| transport | pet_taxi | Pet Taxi | Pet taxi booking | safe | high |
| transport | airport_transfer | Airport Transfer | Airport transport | safe | high |
| operational | travel_kit | Travel Kit | Packing checklist | safe | medium |

---

### 5. ENJOY (18 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| outdoors | parks | Parks | Park recommendations | safe | medium |
| outdoors | dog_parks | Dog Parks | Off-leash dog parks | safe | medium |
| outdoors | hikes | Hikes | Pet-friendly hikes | safe | medium |
| outdoors | beaches | Beaches | Pet-friendly beaches | safe | medium |
| outdoors | picnic | Picnic | Outdoor picnic spots | safe | low |
| social | playdates | Playdates | Arrange playdates | safe | medium |
| social | pet_meetups | Pet Meetups | Community meetups | safe | medium |
| social | temperament_matching | Temperament Matching | Play partner matching | safe | medium |
| experiences | cafes | Pet Cafes | Pet-friendly cafes | safe | medium |
| experiences | pet_friendly_restaurants | Pet Restaurants | Pet-friendly dining | safe | medium |
| experiences | weekend_getaway | Weekend Getaway | Short trip planning | safe | medium |
| enrichment | toys | Toys | Toy recommendations | safe | medium |
| enrichment | enrichment_games | Enrichment Games | Mental stimulation | safe | medium |
| enrichment | puzzle_feeders | Puzzle Feeders | Puzzle toy guidance | safe | medium |
| enrichment | sniff_work | Sniff Work | Nose work activities | safe | medium |
| calm | soothing_rituals | Soothing Rituals | Calming activities | safe | medium |
| calm | noise_phobia_support | Noise Phobia | Noise anxiety support | safe | high |
| calm | separation_anxiety_play | Separation Anxiety | Anxiety through play | safe | high |

---

### 6. FIT (16 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| movement | daily_walks | Daily Walks | Walk scheduling | safe | high |
| movement | stamina_build | Stamina Building | Endurance training | safe | medium |
| movement | weight_management_activity | Weight Activity | Exercise for weight | safe | medium |
| movement | senior_mobility | Senior Mobility | Senior exercise | safe | high |
| movement | puppy_energy | Puppy Energy | Puppy exercise plan | safe | high |
| training | basic_obedience | Basic Obedience | Obedience training | safe | high |
| training | leash_training | Leash Training | Leash manners | safe | high |
| training | recall | Recall | Come command | safe | high |
| training | socialisation | Socialisation | Social training | safe | high |
| training | reactivity | Reactivity | Reactive dog training | safe | high |
| sports | agility | Agility | Agility training | safe | medium |
| sports | swimming | Swimming | Swim exercise | safe | medium |
| sports | fetch_program | Fetch Program | Fetch training | safe | low |
| tracking | activity_tracking | Activity Tracking | Activity monitoring | safe | medium |
| tracking | progress_plan | Progress Plan | Fitness plan | safe | medium |
| gear | harnesses | Harnesses | Harness guidance | safe | medium |

---

### 7. LEARN (14 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| guides | new_pet_parenting | New Pet Parenting | First-time owner guide | safe | high |
| guides | breed_guide | Breed Guide | Breed-specific guidance | safe | medium |
| guides | nutrition_education | Nutrition Education | Food label education | safe | high |
| guides | training_basics_education | Training Basics | Training fundamentals | safe | high |
| guides | socialisation_education | Socialisation Education | Social training guide | safe | high |
| guides | health_preventive_education | Preventive Health | Vaccine/health guide | safe | high |
| guides | first_aid_education | First Aid Basics | First aid knowledge | safe | high |
| classes | trainer_class | Trainer Class | Book trainer session | safe | medium |
| classes | webinar_workshop | Webinar/Workshop | Online learning | safe | low |
| content | video_library | Video Library | Curated videos | safe | medium |
| content | checklists | Checklists | Printable checklists | safe | high |
| content | breed_content | Breed Content | Breed-specific content | safe | medium |
| support | qa_with_expert | Q&A Expert | Expert Q&A | safe | high |
| support | behaviour_consult | Behaviour Consult | Behaviour guidance | safe | high |

---

### 8. CELEBRATE (18 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| occasions | birthday | Birthday | Birthday celebration | safe | high |
| occasions | gotcha_day | Gotcha Day | Adoption anniversary | safe | high |
| occasions | adoption_day | Adoption Day | Adoption celebration | safe | high |
| occasions | new_pet_welcome | New Pet Welcome | Welcome celebration | safe | high |
| occasions | puppy_milestone | Puppy Milestone | Puppy achievements | safe | medium |
| occasions | senior_milestone | Senior Milestone | Senior celebrations | safe | medium |
| occasions | recovery_milestone | Recovery Milestone | Health recovery | safe | medium |
| experiences | pawty | Pawty | Pet party planning | safe | medium |
| experiences | photo_shoot | Photo Shoot | Pet photography | safe | medium |
| experiences | themed_setup | Themed Setup | Party theming | safe | low |
| experiences | hosted_event | Hosted Event | Event coordination | safe | medium |
| gifting | cakes | Cakes | Pet-safe cakes | safe | medium |
| gifting | treats_box | Treats Box | Treat hampers | safe | medium |
| gifting | personalised_hamper | Personalised Hamper | Custom gift box | safe | medium |
| gifting | toys_gifts | Toys & Gifts | Gift recommendations | safe | medium |
| memories | paw_print | Paw Print | Paw print keepsake | safe | medium |
| memories | custom_portrait | Custom Portrait | Pet portrait art | safe | low |
| memories | tribute_video | Tribute Video | Memory video | safe | medium |

---

### 9. ADOPT (12 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| discovery | where_to_adopt | Where to Adopt | Find shelters/rescues | safe | high |
| discovery | breed_match_adoption | Breed Match | Lifestyle matching | safe | high |
| screening | rescue_screening | Rescue Screening | Shelter evaluation | safe | high |
| screening | health_check_pre_adopt | Pre-Adopt Health | Health screening | safe | high |
| process | adoption_paperwork | Adoption Paperwork | Documentation | safe | high |
| onboarding | home_setup_adoption | Home Setup | Prepare home | safe | high |
| onboarding | first_week_plan | First Week Plan | Day-by-day plan | safe | high |
| integration | introduce_to_family | Introduce to Family | Family introductions | safe | medium |
| integration | introduce_to_pets | Introduce to Pets | Pet introductions | safe | high |
| support | post_adoption_support | Post-Adopt Support | Settling-in support | safe | high |
| support | foster_to_adopt | Foster to Adopt | Trial adoption | safe | medium |
| ethics | ethical_adoption | Ethical Adoption | Avoid puppy mills | safe | high |

---

### 10. ADVISORY (8 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| decision | what_to_choose | What to Choose | Decision support | safe | medium |
| decision | pros_cons | Pros & Cons | Option comparison | safe | medium |
| decision | safest_option | Safest Option | Safety-first advice | safe | high |
| decision | best_value | Best Value | Value optimization | safe | medium |
| decision | timeline_planning | Timeline Planning | Schedule planning | safe | medium |
| ethical | welfare_first | Welfare First | Pet welfare guidance | safe | high |
| ethical | vet_first | Vet First | Route to vet advice | safe | high |
| ethical | escalation_required | Escalation Required | Needs professional | safe | high |

---

### 11. PAPERWORK (12 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| pet_docs | vaccination_records_doc | Vaccination Records | Vaccine paperwork | safe | high |
| pet_docs | microchip_docs | Microchip Docs | Microchip registration | safe | high |
| pet_docs | licence_docs | License Docs | Pet licensing | safe | medium |
| pet_docs | health_certificate_doc | Health Certificate | Health documentation | safe | high |
| pet_docs | travel_permits | Travel Permits | Travel documentation | safe | high |
| claims | insurance_claim | Insurance Claim | Insurance paperwork | safe | medium |
| claims | vet_letters | Vet Letters | Vet documentation | safe | medium |
| claims | fit_to_fly_letters | Fit to Fly Letter | Flight certification | safe | high |
| claims | boarding_forms | Boarding Forms | Boarding paperwork | safe | medium |
| storage | document_vault | Document Vault | Document storage | safe | medium |
| storage | shareable_pack | Shareable Pack | Document sharing | safe | low |
| storage | expiry_tracking | Expiry Tracking | Document expiry alerts | safe | medium |

---

### 12. EMERGENCY (15 tags) - HARD OVERRIDE

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| triage | poison_ingestion | Poison Ingestion | Toxic substance consumed | emergency | critical |
| triage | breathing_distress | Breathing Distress | Difficulty breathing | emergency | critical |
| triage | seizure | Seizure | Active/recent seizure | emergency | critical |
| triage | collapse | Collapse | Pet has collapsed | emergency | critical |
| triage | severe_vomiting | Severe Vomiting | Bloody/repeated vomiting | emergency | critical |
| triage | severe_diarrhea | Severe Diarrhea | Bloody diarrhea | emergency | critical |
| triage | bleeding_severe | Severe Bleeding | Uncontrolled bleeding | emergency | critical |
| triage | unconscious | Unconscious | Not responsive | emergency | critical |
| triage | choking | Choking | Active choking | emergency | critical |
| triage | heatstroke | Heatstroke | Heat exhaustion | emergency | critical |
| triage | eye_injury | Eye Injury | Eye trauma | emergency | critical |
| triage | fracture_suspected | Suspected Fracture | Broken bone signs | emergency | critical |
| response | emergency_vet | Emergency Vet | Find 24hr vet | emergency | critical |
| response | poison_response | Poison Response | Poison first steps | emergency | critical |
| response | nearest_options | Nearest Options | Closest emergency care | emergency | critical |

---

### 13. FAREWELL (10 tags)

| cluster | tag | tag_display | definition | safety_level | priority |
|---------|-----|-------------|------------|--------------|----------|
| quality_of_life | quality_of_life | Quality of Life | Comfort assessment | safe | critical |
| palliative | palliative_care | Palliative Care | Comfort care planning | safe | critical |
| palliative | pain_management | Pain Management | Pain control guidance | safe | critical |
| decisions | euthanasia_support | Euthanasia Support | End-of-life guidance | safe | critical |
| aftercare | cremation_burial | Cremation/Burial | Aftercare options | safe | high |
| aftercare | memorial_keepsakes | Memorial Keepsakes | Memory items | safe | high |
| aftercare | tribute_media | Tribute Media | Tribute video/photos | safe | medium |
| support | grief_support | Grief Support | Pet parent support | safe | high |
| support | children_support | Children Support | Explain to children | safe | high |
| planning | farewell_ritual | Farewell Ritual | Goodbye ceremony | safe | medium |

---

## TAG SYNONYMS (300+ entries)

### EMERGENCY SYNONYMS (CRITICAL - Safety Gate)

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| ate poison | poison_ingestion | 0.95 | |
| ate chocolate | poison_ingestion | 0.95 | |
| swallowed something | poison_ingestion | 0.85 | |
| toxic | poison_ingestion | 0.90 | |
| poisoned | poison_ingestion | 0.95 | |
| ate grapes | poison_ingestion | 0.95 | |
| ate onion | poison_ingestion | 0.95 | |
| ate xylitol | poison_ingestion | 0.95 | |
| can't breathe | breathing_distress | 0.95 | |
| difficulty breathing | breathing_distress | 0.95 | |
| gasping | breathing_distress | 0.90 | |
| struggling to breathe | breathing_distress | 0.95 | |
| choking | choking | 0.95 | |
| something stuck | choking | 0.85 | |
| seizure | seizure | 0.95 | |
| convulsing | seizure | 0.90 | |
| fitting | seizure | 0.85 | |
| shaking uncontrollably | seizure | 0.85 | |
| collapsed | collapse | 0.95 | |
| fainted | collapse | 0.90 | |
| fell down | collapse | 0.80 | |
| not moving | collapse | 0.85 | |
| unconscious | unconscious | 0.95 | |
| not responding | unconscious | 0.85 | |
| won't wake up | unconscious | 0.90 | |
| bleeding heavily | bleeding_severe | 0.95 | |
| won't stop bleeding | bleeding_severe | 0.90 | |
| blood everywhere | bleeding_severe | 0.90 | |
| vomiting blood | severe_vomiting | 0.95 | |
| keeps vomiting | severe_vomiting | 0.85 | |
| vomiting non-stop | severe_vomiting | 0.90 | |
| bloody stool | severe_diarrhea | 0.95 | |
| blood in poop | severe_diarrhea | 0.95 | |
| heatstroke | heatstroke | 0.95 | |
| overheating | heatstroke | 0.85 | |
| too hot | heatstroke | 0.75 | |
| panting excessively | heatstroke | 0.80 | |
| hit by car | emergency_vet | 0.95 | |
| accident | emergency_vet | 0.80 | |
| emergency | emergency_vet | 0.95 | |
| urgent | emergency_vet | 0.85 | |
| 24 hour vet | emergency_vet | 0.95 | |
| er vet | emergency_vet | 0.90 | |
| eye hurt | eye_injury | 0.90 | |
| eye bleeding | eye_injury | 0.95 | |
| broken leg | fracture_suspected | 0.90 | |
| broken bone | fracture_suspected | 0.95 | |
| limping badly | fracture_suspected | 0.80 | |

### CARE SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| haircut | grooming | 0.95 | |
| trim | grooming | 0.90 | |
| cut hair | grooming | 0.90 | |
| fur cut | grooming | 0.90 | |
| groom | grooming | 0.95 | |
| groomer | grooming | 0.95 | |
| salon | grooming | 0.85 | |
| parlour | grooming | 0.85 | Indian English |
| spa | grooming | 0.80 | |
| bath | bath | 0.95 | |
| bathing | bath | 0.95 | |
| shower | bath | 0.80 | |
| wash | bath | 0.85 | |
| clean my dog | bath | 0.80 | |
| nail cut | nail_trim | 0.95 | |
| clip nails | nail_trim | 0.95 | |
| nails too long | nail_trim | 0.90 | |
| pedicure | nail_trim | 0.80 | |
| ear clean | ear_cleaning | 0.95 | |
| clean ears | ear_cleaning | 0.95 | |
| teeth clean | dental_hygiene | 0.90 | |
| dental | dental_hygiene | 0.95 | |
| brush teeth | dental_hygiene | 0.85 | |
| bad breath | dental_hygiene | 0.80 | |
| vaccine | vaccination | 0.95 | |
| vaccination | vaccination | 0.95 | |
| shots | vaccination | 0.85 | |
| jab | vaccination | 0.80 | |
| booster | vaccination | 0.85 | |
| deworming | deworming | 0.95 | |
| worm medicine | deworming | 0.90 | |
| deworm | deworming | 0.95 | |
| tick medicine | flea_tick_prevention | 0.90 | |
| flea treatment | flea_tick_prevention | 0.95 | |
| tick prevention | flea_tick_prevention | 0.95 | |
| itching | excessive_scratching | 0.85 | |
| scratching a lot | excessive_scratching | 0.90 | |
| keeps scratching | excessive_scratching | 0.90 | |
| not eating | loss_appetite | 0.90 | |
| won't eat | loss_appetite | 0.90 | |
| off food | loss_appetite | 0.85 | |
| tired | lethargy | 0.75 | |
| no energy | lethargy | 0.85 | |
| sleeping too much | lethargy | 0.80 | |
| vomiting | mild_vomiting | 0.80 | Caution tag |
| threw up | mild_vomiting | 0.85 | |
| puking | mild_vomiting | 0.85 | |
| loose motion | diarrhea | 0.90 | Indian English |
| loose stool | diarrhea | 0.90 | |
| runny poop | diarrhea | 0.85 | |
| limping | limping | 0.95 | |
| leg pain | limping | 0.85 | |
| can't walk properly | limping | 0.85 | |
| vet | vet_visit | 0.90 | |
| doctor | vet_visit | 0.80 | |
| checkup | vet_visit | 0.90 | |
| check-up | vet_visit | 0.90 | |
| appointment | vet_visit | 0.75 | |

### DINE SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| food | meals | 0.85 | |
| meal | meals | 0.95 | |
| what to feed | meals | 0.90 | |
| feeding | meals | 0.90 | |
| kibble | meals | 0.85 | |
| wet food | meals | 0.85 | |
| dry food | meals | 0.85 | |
| snack | treats | 0.90 | |
| treat | treats | 0.95 | |
| biscuit | treats | 0.85 | |
| reward | treats | 0.80 | |
| chewies | chews | 0.90 | |
| chew stick | chews | 0.90 | |
| bones | chews | 0.85 | |
| water | hydration | 0.85 | |
| drinking | hydration | 0.80 | |
| not drinking | hydration | 0.85 | |
| home food | home_cooked | 0.90 | |
| homemade | home_cooked | 0.90 | |
| cook for dog | home_cooked | 0.85 | |
| raw food | raw_diet | 0.95 | |
| barf | raw_diet | 0.90 | |
| no grains | grain_free | 0.90 | |
| without grain | grain_free | 0.90 | |
| allergic | allergy_safe | 0.85 | |
| food allergy | allergy_safe | 0.95 | |
| sensitive tummy | sensitive_stomach | 0.90 | |
| upset stomach | sensitive_stomach | 0.85 | |
| digestion | sensitive_stomach | 0.80 | |
| fussy eater | picky_eater | 0.95 | |
| won't eat food | picky_eater | 0.85 | |
| choosy | picky_eater | 0.85 | |
| change food | food_transition | 0.90 | |
| switch food | food_transition | 0.90 | |
| new food | food_transition | 0.85 | |
| puppy food | puppy_nutrition | 0.95 | |
| what to feed puppy | puppy_nutrition | 0.95 | |
| old dog food | senior_nutrition | 0.90 | |
| senior diet | senior_nutrition | 0.95 | |
| lose weight | weight_loss_diet | 0.85 | |
| overweight | weight_loss_diet | 0.85 | |
| fat dog | weight_loss_diet | 0.80 | |
| gain weight | weight_gain_diet | 0.90 | |
| too thin | weight_gain_diet | 0.85 | |
| underweight | weight_gain_diet | 0.90 | |
| chocolate toxic | toxic_avoidance | 0.95 | |
| can dogs eat | toxic_avoidance | 0.85 | |
| safe to eat | toxic_avoidance | 0.85 | |

### STAY SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| boarding | kennel | 0.90 | |
| kennels | kennel | 0.95 | |
| pet hotel | kennel | 0.90 | |
| board my dog | kennel | 0.95 | |
| leave my dog | kennel | 0.80 | |
| going on vacation | kennel | 0.75 | |
| luxury boarding | premium_boarding | 0.95 | |
| best boarding | premium_boarding | 0.85 | |
| no cages | cage_free | 0.90 | |
| cage free | cage_free | 0.95 | |
| daycare | daycare | 0.95 | |
| day care | daycare | 0.95 | |
| daytime care | daycare | 0.90 | |
| creche | daycare | 0.85 | Indian English |
| sitter | pet_sitting | 0.95 | |
| pet sitter | pet_sitting | 0.95 | |
| someone to watch | pet_sitting | 0.80 | |
| babysitter | pet_sitting | 0.75 | |
| overnight | overnight_sitter | 0.85 | |
| stay overnight | overnight_sitter | 0.90 | |
| night sitter | overnight_sitter | 0.95 | |
| drop in | drop_in_visits | 0.90 | |
| check on dog | drop_in_visits | 0.85 | |
| visit my dog | drop_in_visits | 0.85 | |
| separation anxiety | separation_anxiety_stay | 0.90 | |
| anxious when alone | separation_anxiety_stay | 0.85 | |
| hates being alone | separation_anxiety_stay | 0.85 | |
| old dog boarding | senior_boarding | 0.90 | |
| senior dog stay | senior_boarding | 0.90 | |
| puppy boarding | puppy_boarding | 0.95 | |
| young puppy | puppy_boarding | 0.80 | |
| trial stay | trial_night | 0.90 | |
| test night | trial_night | 0.85 | |
| updates | daily_updates | 0.80 | |
| photo updates | daily_updates | 0.90 | |
| pick up drop | pickup_drop | 0.90 | |
| transport to boarding | pickup_drop | 0.85 | |

### TRAVEL SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| flight | air_travel | 0.95 | |
| flying | air_travel | 0.95 | |
| airplane | air_travel | 0.95 | |
| plane | air_travel | 0.90 | |
| fly with dog | air_travel | 0.95 | |
| air india | air_travel | 0.85 | |
| indigo | air_travel | 0.85 | |
| road trip | car_travel | 0.95 | |
| car | car_travel | 0.85 | |
| drive | car_travel | 0.85 | |
| driving with dog | car_travel | 0.95 | |
| train | train_travel | 0.95 | |
| rajdhani | train_travel | 0.85 | Indian train |
| shatabdi | train_travel | 0.85 | Indian train |
| abroad | international_travel | 0.85 | |
| overseas | international_travel | 0.90 | |
| relocating | international_travel | 0.85 | |
| moving countries | international_travel | 0.90 | |
| vaccine papers | vaccination_records | 0.90 | |
| vaccination certificate | vaccination_records | 0.95 | |
| health cert | health_certificate | 0.95 | |
| fit to fly | fit_to_fly | 0.95 | |
| can dog fly | fit_to_fly | 0.85 | |
| import permit | import_export | 0.90 | |
| export | import_export | 0.90 | |
| crate | crate_selection | 0.85 | |
| carrier | crate_selection | 0.85 | |
| travel box | crate_selection | 0.85 | |
| airline rules | airline_policy | 0.95 | |
| cargo | cargo_vs_cabin | 0.90 | |
| cabin | cargo_vs_cabin | 0.90 | |
| car sick | motion_sickness | 0.95 | |
| vomits in car | motion_sickness | 0.90 | |
| travel anxiety | anxiety_travel | 0.95 | |
| nervous traveler | anxiety_travel | 0.85 | |
| pet taxi | pet_taxi | 0.95 | |
| cab for dog | pet_taxi | 0.90 | |
| ola pet | pet_taxi | 0.85 | Indian |
| uber pet | pet_taxi | 0.85 | |
| airport drop | airport_transfer | 0.95 | |
| airport pickup | airport_transfer | 0.95 | |
| packing list | travel_kit | 0.90 | |
| what to pack | travel_kit | 0.85 | |

### ENJOY SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| park | parks | 0.90 | |
| parks nearby | parks | 0.95 | |
| where to go | parks | 0.75 | |
| dog park | dog_parks | 0.95 | |
| off leash | dog_parks | 0.90 | |
| hike | hikes | 0.95 | |
| hiking | hikes | 0.95 | |
| trek | hikes | 0.90 | |
| beach | beaches | 0.95 | |
| seaside | beaches | 0.85 | |
| playdate | playdates | 0.95 | |
| play date | playdates | 0.95 | |
| dog friends | playdates | 0.85 | |
| meetup | pet_meetups | 0.90 | |
| dog meetup | pet_meetups | 0.95 | |
| cafe | cafes | 0.90 | |
| coffee with dog | cafes | 0.85 | |
| restaurant | pet_friendly_restaurants | 0.85 | |
| eat out with dog | pet_friendly_restaurants | 0.90 | |
| weekend trip | weekend_getaway | 0.90 | |
| short trip | weekend_getaway | 0.85 | |
| toy | toys | 0.95 | |
| toys | toys | 0.95 | |
| play thing | toys | 0.85 | |
| games | enrichment_games | 0.85 | |
| mental stimulation | enrichment_games | 0.90 | |
| bored dog | enrichment_games | 0.80 | |
| puzzle | puzzle_feeders | 0.90 | |
| slow feeder | puzzle_feeders | 0.90 | |
| sniff | sniff_work | 0.85 | |
| nose games | sniff_work | 0.90 | |
| scared of thunder | noise_phobia_support | 0.90 | |
| fireworks fear | noise_phobia_support | 0.95 | |
| diwali anxiety | noise_phobia_support | 0.95 | Indian |
| crackers fear | noise_phobia_support | 0.90 | Indian |

### FIT SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| walk | daily_walks | 0.90 | |
| walks | daily_walks | 0.90 | |
| walking | daily_walks | 0.90 | |
| walker | daily_walks | 0.85 | |
| dog walker | daily_walks | 0.95 | |
| exercise | stamina_build | 0.85 | |
| fitness | stamina_build | 0.85 | |
| overweight | weight_management_activity | 0.80 | |
| lose weight exercise | weight_management_activity | 0.90 | |
| old dog exercise | senior_mobility | 0.90 | |
| senior exercise | senior_mobility | 0.95 | |
| puppy exercise | puppy_energy | 0.95 | |
| how much exercise puppy | puppy_energy | 0.90 | |
| obedience | basic_obedience | 0.95 | |
| basic training | basic_obedience | 0.90 | |
| sit stay | basic_obedience | 0.85 | |
| leash pulling | leash_training | 0.95 | |
| pulls on leash | leash_training | 0.95 | |
| loose leash | leash_training | 0.90 | |
| come when called | recall | 0.95 | |
| doesn't come back | recall | 0.90 | |
| recall | recall | 0.95 | |
| socializing | socialisation | 0.95 | |
| socialization | socialisation | 0.95 | |
| meet other dogs | socialisation | 0.85 | |
| reactive | reactivity | 0.95 | |
| barks at dogs | reactivity | 0.85 | |
| lunges | reactivity | 0.90 | |
| agility | agility | 0.95 | |
| obstacle course | agility | 0.85 | |
| swimming | swimming | 0.95 | |
| swim | swimming | 0.95 | |
| pool | swimming | 0.80 | |
| harness | harnesses | 0.95 | |
| which harness | harnesses | 0.90 | |

### LEARN SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| new puppy owner | new_pet_parenting | 0.95 | |
| first time pet parent | new_pet_parenting | 0.95 | |
| just got a puppy | new_pet_parenting | 0.95 | |
| new dog owner | new_pet_parenting | 0.90 | |
| breed info | breed_guide | 0.90 | |
| about golden retriever | breed_guide | 0.85 | |
| labrador guide | breed_guide | 0.90 | |
| nutrition guide | nutrition_education | 0.90 | |
| food labels | nutrition_education | 0.85 | |
| what to feed | nutrition_education | 0.80 | |
| training guide | training_basics_education | 0.90 | |
| how to train | training_basics_education | 0.90 | |
| potty training | training_basics_education | 0.95 | |
| house training | training_basics_education | 0.95 | |
| socialisation guide | socialisation_education | 0.95 | |
| how to socialize | socialisation_education | 0.90 | |
| vaccine schedule | health_preventive_education | 0.90 | |
| when to vaccinate | health_preventive_education | 0.90 | |
| first aid | first_aid_education | 0.95 | |
| first aid kit | first_aid_education | 0.95 | |
| trainer | trainer_class | 0.90 | |
| training class | trainer_class | 0.95 | |
| puppy class | trainer_class | 0.95 | |
| obedience class | trainer_class | 0.90 | |
| videos | video_library | 0.85 | |
| youtube | video_library | 0.80 | |
| watch how to | video_library | 0.85 | |
| checklist | checklists | 0.95 | |
| list | checklists | 0.75 | |
| expert advice | qa_with_expert | 0.90 | |
| talk to expert | qa_with_expert | 0.95 | |
| behaviour issue | behaviour_consult | 0.90 | |
| behaviour problem | behaviour_consult | 0.90 | |

### CELEBRATE SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| birthday | birthday | 0.95 | |
| bday | birthday | 0.95 | |
| turning one | birthday | 0.90 | |
| birthday party | birthday | 0.95 | |
| gotcha day | gotcha_day | 0.95 | |
| adoption anniversary | gotcha_day | 0.95 | |
| one year since adoption | gotcha_day | 0.90 | |
| new pet | new_pet_welcome | 0.85 | |
| welcome home | new_pet_welcome | 0.90 | |
| just adopted | new_pet_welcome | 0.85 | |
| party | pawty | 0.85 | |
| dog party | pawty | 0.95 | |
| pet party | pawty | 0.95 | |
| pawty | pawty | 0.95 | |
| photo | photo_shoot | 0.80 | |
| photoshoot | photo_shoot | 0.95 | |
| photographer | photo_shoot | 0.90 | |
| professional photos | photo_shoot | 0.90 | |
| cake | cakes | 0.90 | |
| dog cake | cakes | 0.95 | |
| birthday cake | cakes | 0.95 | |
| gift | toys_gifts | 0.85 | |
| present | toys_gifts | 0.80 | |
| hamper | personalised_hamper | 0.90 | |
| gift box | personalised_hamper | 0.90 | |
| paw print | paw_print | 0.95 | |
| paw impression | paw_print | 0.90 | |
| portrait | custom_portrait | 0.90 | |
| dog portrait | custom_portrait | 0.95 | |
| painting | custom_portrait | 0.80 | |

### ADOPT SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| adopt | where_to_adopt | 0.95 | |
| adoption | where_to_adopt | 0.95 | |
| shelter | where_to_adopt | 0.90 | |
| rescue | where_to_adopt | 0.90 | |
| ngo | where_to_adopt | 0.85 | |
| adopt a dog | where_to_adopt | 0.95 | |
| which breed | breed_match_adoption | 0.85 | |
| which dog | breed_match_adoption | 0.85 | |
| best breed for | breed_match_adoption | 0.90 | |
| apartment dog | breed_match_adoption | 0.85 | |
| first week | first_week_plan | 0.85 | |
| first week plan | first_week_plan | 0.95 | |
| what to do first week | first_week_plan | 0.90 | |
| prepare home | home_setup_adoption | 0.90 | |
| puppy proof | home_setup_adoption | 0.85 | |
| introduce to kids | introduce_to_family | 0.95 | |
| children and dog | introduce_to_family | 0.85 | |
| introduce to cat | introduce_to_pets | 0.95 | |
| second dog | introduce_to_pets | 0.85 | |
| foster | foster_to_adopt | 0.95 | |
| trial adoption | foster_to_adopt | 0.90 | |
| puppy mill | ethical_adoption | 0.90 | |
| backyard breeder | ethical_adoption | 0.90 | |

### ADVISORY SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| which one | what_to_choose | 0.85 | |
| help me choose | what_to_choose | 0.90 | |
| recommendation | what_to_choose | 0.80 | |
| compare | pros_cons | 0.85 | |
| vs | pros_cons | 0.80 | |
| which is better | pros_cons | 0.90 | |
| safest | safest_option | 0.90 | |
| is it safe | safest_option | 0.85 | |
| best value | best_value | 0.90 | |
| affordable | best_value | 0.80 | |
| should I see vet | vet_first | 0.90 | |
| is this serious | vet_first | 0.85 | |
| need vet | vet_first | 0.90 | |

### PAPERWORK SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| vaccine record | vaccination_records_doc | 0.95 | |
| vaccine certificate | vaccination_records_doc | 0.95 | |
| vaccination papers | vaccination_records_doc | 0.95 | |
| microchip | microchip_docs | 0.95 | |
| chip registration | microchip_docs | 0.90 | |
| license | licence_docs | 0.95 | |
| dog license | licence_docs | 0.95 | |
| registration | licence_docs | 0.85 | |
| health cert | health_certificate_doc | 0.95 | |
| fit to fly letter | fit_to_fly_letters | 0.95 | |
| airline letter | fit_to_fly_letters | 0.85 | |
| insurance | insurance_claim | 0.85 | |
| claim | insurance_claim | 0.80 | |
| documents | document_vault | 0.80 | |
| store papers | document_vault | 0.85 | |

### FAREWELL SYNONYMS

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| is it time | quality_of_life | 0.85 | |
| how do I know | quality_of_life | 0.80 | |
| quality of life | quality_of_life | 0.95 | |
| suffering | quality_of_life | 0.85 | |
| comfort care | palliative_care | 0.90 | |
| hospice | palliative_care | 0.90 | |
| end of life care | palliative_care | 0.95 | |
| pain | pain_management | 0.80 | |
| pain relief | pain_management | 0.90 | |
| euthanasia | euthanasia_support | 0.95 | |
| put to sleep | euthanasia_support | 0.90 | |
| saying goodbye | euthanasia_support | 0.80 | |
| home euthanasia | euthanasia_support | 0.95 | |
| cremation | cremation_burial | 0.95 | |
| burial | cremation_burial | 0.95 | |
| ashes | cremation_burial | 0.90 | |
| memorial | memorial_keepsakes | 0.90 | |
| keepsake | memorial_keepsakes | 0.95 | |
| memory box | memorial_keepsakes | 0.90 | |
| urn | memorial_keepsakes | 0.85 | |
| tribute | tribute_media | 0.90 | |
| tribute video | tribute_media | 0.95 | |
| grieving | grief_support | 0.90 | |
| lost my dog | grief_support | 0.90 | |
| pet loss | grief_support | 0.95 | |
| rainbow bridge | grief_support | 0.90 | |
| tell my child | children_support | 0.90 | |
| explain to kids | children_support | 0.95 | |

---

## SERVICE VERTICALS (UI Grouping - NOT Pillars)

| vertical | vertical_display | definition | maps_to_pillars |
|----------|-----------------|------------|-----------------|
| grooming | Grooming | Grooming services booking | care |
| training | Training | Training session booking | fit, learn |
| boarding | Boarding | Overnight boarding booking | stay |
| daycare | Daycare | Daytime care booking | stay |
| vet_care | Vet Care | Veterinary booking | care, emergency |
| dog_walking | Dog Walking | Walking service booking | fit |
| pet_photography | Pet Photography | Photography booking | celebrate |
| transport | Transport | Pet transport booking | travel |

### SERVICE VERTICAL SYNONYMS

| synonym | vertical | confidence |
|---------|----------|------------|
| groomer | grooming | 0.95 |
| salon | grooming | 0.90 |
| haircut booking | grooming | 0.90 |
| bath appointment | grooming | 0.85 |
| trainer | training | 0.95 |
| obedience class | training | 0.90 |
| behaviour session | training | 0.85 |
| kennel | boarding | 0.90 |
| pet hotel | boarding | 0.90 |
| overnight stay | boarding | 0.85 |
| day boarding | daycare | 0.90 |
| creche | daycare | 0.85 |
| vet appointment | vet_care | 0.95 |
| doctor appointment | vet_care | 0.85 |
| checkup booking | vet_care | 0.85 |
| walker | dog_walking | 0.95 |
| walk service | dog_walking | 0.90 |
| daily walks | dog_walking | 0.85 |
| photoshoot booking | pet_photography | 0.95 |
| photographer | pet_photography | 0.90 |
| pet taxi | transport | 0.95 |
| cab | transport | 0.80 |
| airport transfer | transport | 0.90 |

---

## SERVICE TYPES (Fulfilment Modes)

| type | type_display | definition |
|------|--------------|------------|
| at_home | At Home | Service delivered at customer's home |
| salon | Salon | At grooming salon/facility |
| clinic | Clinic | At veterinary clinic |
| online | Online | Video call / telemedicine |
| pickup_drop | Pickup & Drop | Transport included |
| boarding_facility | Boarding Facility | At boarding location |
| daycare_center | Daycare Center | At daycare location |
| field | Field | Outdoor / mobile service |

### SERVICE TYPE SYNONYMS

| synonym | type | confidence |
|---------|------|------------|
| home visit | at_home | 0.95 |
| come to me | at_home | 0.90 |
| at my place | at_home | 0.90 |
| home grooming | at_home | 0.90 |
| parlour | salon | 0.85 |
| shop | salon | 0.80 |
| facility | salon | 0.80 |
| hospital | clinic | 0.85 |
| vet clinic | clinic | 0.95 |
| video call | online | 0.95 |
| teleconsult | online | 0.90 |
| virtual | online | 0.85 |
| pick up | pickup_drop | 0.90 |
| drop off | pickup_drop | 0.90 |
| they collect | pickup_drop | 0.85 |

---

## SCHEMA FIELDS (Per User Requirements)

### canonical_tags schema:
```json
{
  "pillar": "string (lowercase enum)",
  "pillar_display": "string (Title Case)",
  "cluster": "string",
  "tag": "string (snake_case)",
  "tag_display": "string (Human readable)",
  "definition": "string",
  "example_request": "string (optional)",
  "applies_to": "string (dog|cat|both)",
  "safety_level": "string (safe|caution|emergency)",
  "is_emergency": "boolean",
  "is_caution": "boolean",
  "priority": "string (low|medium|high|critical)",
  "parent_tag": "string (optional)",
  "deprecated": "boolean (default: false)",
  "replaced_by": "string (optional)",
  "seed_version": "string",
  "source_doc_version": "string",
  "created_at": "datetime"
}
```

### tag_synonyms schema:
```json
{
  "synonym": "string (lowercase)",
  "tag": "string (references canonical_tags.tag)",
  "pillar": "string (for faster lookup)",
  "confidence": "float (0-1)",
  "notes": "string (optional)",
  "deprecated": "boolean",
  "replaced_by": "string (optional)",
  "seed_version": "string",
  "source_doc_version": "string",
  "created_at": "datetime"
}
```

---

## COUNTS SUMMARY

| Collection | Count |
|------------|-------|
| canonical_tags | 192 |
| tag_synonyms | 320+ |
| service_verticals | 8 |
| service_vertical_synonyms | 24 |
| service_types | 8 |
| service_type_synonyms | 15 |

**Total: ~570 entries**

---

*Draft created: December 2025*
*seed_version: 1.0.0*
*source_doc_version: Mira_OS_Taxonomy_Routing_Picks_Spec_v1_2*
