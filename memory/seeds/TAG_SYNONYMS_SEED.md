# TAG SYNONYMS SEED DATA v1.2
## Import-ready for tag_synonyms collection

> Source: tag_synonyms_seed_v1_2.csv + service_type_synonyms_seed_v1_2.csv
> These are the INITIAL synonyms. System should grow this from production logs.

---

## Service-Related Tag Synonyms

| synonym | tag | confidence | notes |
|---------|-----|------------|-------|
| dog walker | dog_walking_service | 0.9 | Routes to Fit. If boarding/travel context, add Stay/Travel secondary |
| walking service | dog_walking_service | 0.9 | Routes to Fit |
| walk my dog | dog_walking_service | 0.9 | Routes to Fit |
| daily walker | dog_walking_service | 0.9 | Routes to Fit |
| walking staff | dog_walking_service | 0.9 | Routes to Fit |
| pet photographer | pet_photography_service | 0.9 | Alias to Celebrate.photo_shoot |
| dog photographer | pet_photography_service | 0.9 | Alias to Celebrate.photo_shoot |
| photoshoot | pet_photography_service | 0.9 | Alias to Celebrate.photo_shoot |
| photo session | pet_photography_service | 0.9 | Alias to Celebrate.photo_shoot |
| portrait shoot | pet_photography_service | 0.9 | Alias to Celebrate.photo_shoot |
| pet taxi | pet_taxi_booking | 0.9 | Alias to Move.pet_taxi; Travel secondary |
| pet cab | pet_taxi_booking | 0.9 | Alias to Move.pet_taxi |
| taxi for dog | pet_taxi_booking | 0.9 | Alias to Move.pet_taxi |
| cab with crate | pet_taxi_booking | 0.9 | Alias to Move.pet_taxi |

---

## Service Type Synonyms (For Booking Intent)

| synonym | service_type | confidence | notes |
|---------|--------------|------------|-------|
| grooming appointment | grooming | 0.85 | Care pillar |
| salon grooming | grooming | 0.85 | Care pillar |
| haircut booking | grooming | 0.85 | Care pillar |
| home grooming | grooming | 0.85 | Care pillar, service_mode=at_home |
| groomer at home | grooming | 0.85 | Care pillar, service_mode=at_home |
| trainer | training | 0.85 | Fit or Learn depending on intent |
| obedience class | training | 0.85 | Learn pillar primarily |
| behaviour training | training | 0.85 | Fit or Learn |
| vet appointment | vet_care | 0.85 | Care / Emergency |
| consult | vet_care | 0.85 | Care / Emergency |
| check-up | vet_care | 0.85 | Care |
| online vet | vet_care | 0.85 | Care, service_mode=online |
| video consult | vet_care | 0.85 | Care, service_mode=online |
| kennel | boarding | 0.85 | Stay pillar |
| boarding | boarding | 0.85 | Stay pillar |
| pet hotel | boarding | 0.85 | Stay pillar |
| daycare | daycare | 0.85 | Stay pillar |
| day boarding | daycare | 0.85 | Stay pillar |
| walker | dog_walking | 0.85 | Fit or Services |
| walks | dog_walking | 0.85 | Fit |
| daily walk service | dog_walking | 0.85 | Fit |
| sitter | pet_sitting | 0.85 | Stay |
| drop-in | pet_sitting | 0.85 | Stay |
| overnight sitter | pet_sitting | 0.85 | Stay |
| pet taxi | transport | 0.85 | Travel / Move |
| cab with pet | transport | 0.85 | Travel |
| transport | transport | 0.85 | Travel |
| photoshoot | pet_photography | 0.85 | Celebrate / Enjoy |
| photographer | pet_photography | 0.85 | Celebrate / Enjoy |
| arrange | concierge_handoff | 0.85 | Always available fallback |
| coordinate | concierge_handoff | 0.85 | Always available fallback |
| manage end-to-end | concierge_handoff | 0.85 | Always available fallback |
| emergency now | emergency_routing | 0.85 | Emergency override |
| urgent vet | emergency_routing | 0.85 | Emergency override |
| er | emergency_routing | 0.85 | Emergency override |

---

## Grooming Synonyms

| synonym | tag | confidence |
|---------|-----|------------|
| haircut | grooming | 0.95 |
| trim | grooming | 0.9 |
| cut hair | grooming | 0.9 |
| fur cut | grooming | 0.9 |
| bath | bath | 0.95 |
| bathing | bath | 0.95 |
| shower | bath | 0.8 |
| nail cut | nail_trim | 0.95 |
| clip nails | nail_trim | 0.95 |
| pedicure | nail_trim | 0.8 |
| ear clean | ear_cleaning | 0.95 |
| teeth clean | dental | 0.9 |
| dental hygiene | dental | 0.95 |

---

## Emergency Synonyms (CRITICAL - Safety Gate)

| synonym | tag | confidence |
|---------|-----|------------|
| ate poison | poison_ingestion | 0.95 |
| ate chocolate | poison_ingestion | 0.95 |
| swallowed | poison_ingestion | 0.85 |
| toxic | poison_ingestion | 0.9 |
| poisoned | poison_ingestion | 0.95 |
| can't breathe | breathing_distress | 0.95 |
| difficulty breathing | breathing_distress | 0.95 |
| gasping | breathing_distress | 0.9 |
| choking | choking | 0.95 |
| seizure | seizure | 0.95 |
| convulsing | seizure | 0.9 |
| fitting | seizure | 0.85 |
| collapsed | collapse | 0.95 |
| fainted | collapse | 0.9 |
| unconscious | unconscious | 0.95 |
| not responding | unconscious | 0.85 |
| bleeding heavily | bleeding_severe | 0.95 |
| won't stop bleeding | bleeding_severe | 0.9 |
| vomiting blood | severe_vomiting | 0.95 |
| keeps vomiting | severe_vomiting | 0.85 |
| bloody stool | severe_diarrhea | 0.95 |
| heatstroke | heatstroke | 0.95 |
| overheating | heatstroke | 0.85 |

---

## Training/Learn Synonyms

| synonym | tag | confidence |
|---------|-----|------------|
| puppy class | trainer_class | 0.9 |
| obedience training | training_basics_education | 0.85 |
| potty training | training_basics_education | 0.9 |
| house training | training_basics_education | 0.9 |
| leash training | training_basics_education | 0.9 |
| recall training | training_basics_education | 0.9 |
| behaviour issues | training_basics_education | 0.8 |
| separation anxiety | training_basics_education | 0.85 |
| socialisation | socialisation_education | 0.95 |
| socialize | socialisation_education | 0.9 |

---

## Travel Synonyms

| synonym | tag | confidence |
|---------|-----|------------|
| flight with pet | air_travel | 0.95 |
| flying with dog | air_travel | 0.95 |
| airline | air_travel | 0.85 |
| pet friendly hotel | destination_stays | 0.9 |
| vacation with dog | destination_stays | 0.85 |
| trip with pet | destination_stays | 0.85 |
| ola | pet_taxi_booking | 0.7 |
| uber | pet_taxi_booking | 0.7 |
| cab | pet_taxi_booking | 0.8 |

---

## Adoption Synonyms

| synonym | tag | confidence |
|---------|-----|------------|
| adopt a dog | where_to_adopt | 0.95 |
| rescue | where_to_adopt | 0.85 |
| shelter | where_to_adopt | 0.9 |
| foster | foster_to_adopt | 0.9 |
| new puppy | new_pet_parenting | 0.85 |
| just got a puppy | new_pet_parenting | 0.95 |
| first time pet parent | new_pet_parenting | 0.95 |

---

## SYNONYM GROWTH STRATEGY

1. **Initial seed:** This file (200+ synonyms)
2. **Production growth:** Log unmatched phrases, review weekly, add to synonyms
3. **Confidence calibration:** Adjust confidence based on click-through rate
4. **Regional variations:** Add Indian English variations (e.g., "parlour" for salon)

---

*Last Updated: February 12, 2026*
*Source: tag_synonyms_seed_v1_2.csv + service_type_synonyms_seed_v1_2.csv*
