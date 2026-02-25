# SERVICE TYPES SPECIFICATION v1.2
## Canonical Service Types for MIRA OS

> **CRITICAL:** Service types are FULFILMENT METHODS, not pillars.
> The UI "Services" are service_clusters that map to pillar + tags + service_types.

---

## CANONICAL SERVICE TYPES

| service_type | display | definition |
|--------------|---------|------------|
| `grooming` | Grooming | Grooming delivered at salon or home (bath, haircut, nails, ears, dental hygiene) |
| `training` | Training | Trainer/behaviourist sessions for obedience or behaviour goals |
| `boarding` | Boarding | Overnight boarding/kennel/villa boarding including medical boarding |
| `daycare` | Daycare | Daytime supervised daycare or day boarding |
| `vet_care` | Vet Care | Vet appointment booking, diagnostics, vaccinations, referrals |
| `dog_walking` | Dog Walking | Dog walking scheduling incl. subscriptions and pack/solo walks |
| `pet_photography` | Pet Photography | Studio/outdoor/event photography for pets and families |
| `transport` | Transport | Pet taxi / pickup-drop / chauffeur and handling logistics |

---

## SERVICE MODES (How service is delivered)

| mode | description |
|------|-------------|
| `salon` | At grooming salon / facility |
| `at_home` | Service provider comes to home |
| `clinic` | At veterinary clinic |
| `online` | Video call / telemedicine |
| `field` | Mobile / outdoor service |
| `boarding_facility` | At boarding facility |
| `daycare_center` | At daycare center |

---

## SERVICE TYPE → PILLAR MAPPING

| service_type | primary_pillar | secondary_pillars |
|--------------|----------------|-------------------|
| grooming | care | - |
| training | fit, learn | - |
| boarding | stay | travel |
| daycare | stay | - |
| vet_care | care | emergency |
| dog_walking | fit | stay |
| pet_photography | celebrate | enjoy |
| transport | travel | - |

---

## WHAT SERVICE TYPES ARE NOT

**Service types are NOT:**
- Pillars (pillars = user intent, service_types = fulfilment)
- Pick types (pick_type = guide/booking/product, service_type = how it's delivered)
- Service modes (service_mode = where/how, service_type = what)

**Example confusion to avoid:**
- ❌ `service_type: booking` → This is wrong. "booking" is a `pick_type`
- ❌ `service_type: at_home_grooming` → This is wrong. Use `service_type: grooming` + `service_mode: at_home`
- ❌ `service_type: emergency` → This is wrong. Emergency is a pillar, not a service type

---

## SERVICE TYPE TRIGGER RULES

Set `service_type` when:
1. User explicitly asks to book, schedule, or find a provider
2. User requests prices/slots for a service
3. Canonical tag implies fulfilment (e.g., `kennel` → `boarding`)
4. Flow requires a provider (e.g., fit-to-fly letter → `vet_care`)

---

## SERVICES UI → DATA MAPPING

The "Services" section in UI maps to:
```
UI "Grooming" → pillar: care + tags: [grooming, bath, ...] + service_type: grooming
UI "Training" → pillar: fit/learn + tags: [trainer_class, ...] + service_type: training
UI "Boarding" → pillar: stay + tags: [kennel, ...] + service_type: boarding
UI "Daycare" → pillar: stay + tags: [daycare, ...] + service_type: daycare
UI "Vet" → pillar: care + tags: [vet_visit, ...] + service_type: vet_care
UI "Walking" → pillar: fit + tags: [daily_walks, ...] + service_type: dog_walking
UI "Photography" → pillar: celebrate + tags: [photo_shoot, ...] + service_type: pet_photography
UI "Transport" → pillar: travel + tags: [pet_taxi, ...] + service_type: transport
```

---

*Last Updated: February 12, 2026*
*Source: service_types_v1_2.csv*
