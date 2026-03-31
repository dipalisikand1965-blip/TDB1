/**
 * useMiraFilter.js  — v2 (Breed + Size + Life Stage + Dietary + Semantic Intelligence)
 *
 * Filters, ranks, and annotates products against a pet's full soul profile.
 * Rule: DEPRIORITISE — never hide. Wrong breed/size still shows but ranks lower.
 *
 * Rank scale (lower = higher priority):
 *   0  — breed match + loved food
 *   1  — loved food / favourite treat
 *   2  — breed-specific match
 *   3  — health-safe (treatment-safe tag)
 *   4  — allergy-safe (explicitly marked free-from)
 *   5  — size match
 *   6  — life stage match
 *   7  — dietary flag match (grain-free, single-protein, etc.)
 *   8  — sensitivity match (sensitive stomach, joint care)
 *   10 — neutral / universal (all_breeds, no constraints)
 *   11 — wrong life stage
 *   12 — mira_can_suggest = false
 *   13 — wrong size
 *   14 — wrong breed (specific breed, not this pet's)
 *   15 — conflicts nutrition goal (dimmed at 55% opacity)
 */

// ── Allergen synonym map ──────────────────────────────────────────────────────
const ALLERGEN_MAP = {
  chicken:   ['chicken', 'poultry', 'fowl'],
  soy:       ['soy', 'soya', 'tofu', 'edamame'],
  wheat:     ['wheat', 'gluten', 'flour', 'barley'],
  dairy:     ['milk', 'cheese', 'butter', 'lactose', 'whey', 'dairy'],
  eggs:      ['egg', 'eggs'],
  beef:      ['beef', 'bovine'],
  pork:      ['pork', 'ham', 'bacon'],
  lamb:      ['lamb', 'mutton'],
  fish:      ['fish', 'salmon', 'tuna', 'cod', 'anchovy'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish'],
};

// ── Nutrition goal conflict map ───────────────────────────────────────────────
const GOAL_CONFLICTS = {
  'weight loss':   ['high-calorie', 'high-fat', 'energy-dense', 'high calorie'],
  'weight gain':   ['low-calorie', 'light', 'low calorie'],
  'senior health': ['puppy', 'high-energy'],
  'puppy growth':  ['senior', 'weight management'],
};

// ── Breed normalisation (tag → canonical key) ─────────────────────────────────
const BREED_SYNONYMS = {
  labrador:         ['labrador', 'lab', 'labrador retriever'],
  golden:           ['golden', 'golden retriever'],
  german_shepherd:  ['german shepherd', 'german_shepherd', 'gsd', 'alsatian'],
  indie:            ['indie', 'indian pariah', 'desi', 'indie dog', 'street dog', 'mixed', 'desi dog'],
  poodle:           ['poodle', 'toy poodle', 'miniature poodle', 'standard poodle'],
  beagle:           ['beagle'],
  bulldog:          ['bulldog', 'english bulldog', 'french bulldog', 'frenchie'],
  boxer:            ['boxer'],
  rottweiler:       ['rottweiler', 'rottie'],
  doberman:         ['doberman', 'dobermann', 'doberman pinscher'],
  husky:            ['husky', 'siberian husky', 'siberian_husky', 'grey husky', 'black husky', 'white husky'],
  pomeranian:       ['pomeranian', 'pom'],
  shih_tzu:         ['shih tzu', 'shih_tzu'],
  maltese:          ['maltese'],
  chihuahua:        ['chihuahua'],
  yorkshire:        ['yorkshire', 'yorkshire terrier', 'yorkie', 'york'],
  pug:              ['pug'],
  cocker_spaniel:   ['cocker spaniel', 'cocker_spaniel', 'spaniel'],
  dachshund:        ['dachshund', 'doxie'],
  lhasa_apso:       ['lhasa', 'lhasa apso'],
  cavalier:         ['cavalier', 'cavalier king charles', 'cavalier king charles spaniel', 'king charles'],
  border_collie:    ['border collie', 'border_collie'],
  schnoodle:        ['schnoodle', 'shnoodle'],
  saint_bernard:    ['saint bernard', 'st bernard', 'st. bernard', 'st_bernard'],
  jack_russell:     ['jack russell', 'jack russell terrier', 'jack_russell'],
  alaskan_malamute: ['alaskan malamute', 'malamute', 'alaskan_malamute'],
  indian_spitz:     ['indian spitz', 'indian_spitz'],
};

// Breeds with no product catalog match → treat as universal (show for all pets)
// These are valid breeds but we don't have breed-specific products for them
const UNIVERSAL_FALLBACK_BREEDS = new Set([
  'scottish terrier', 'scottish_terrier', 'scotty',
  'vizsla',
  'weimaraner',
  'bernese mountain', 'bernese mountain dog', 'bernese',
  'havanese',
  'boston terrier', 'boston_terrier',
  'akita',
  'american bully', 'american_bully',
  'samoyed',
  'dalmatian',
  'great dane',
  'mastiff',
  'greyhound',
  'basenji',
  'basset hound', 'basset_hound',
  'bichon frise', 'bichon_frise',
  'chow chow', 'chow_chow',
  'maltipoo',
  'pekingese',
  'springer spaniel', 'springer_spaniel',
]);

// ── Size weight ranges (kg) ───────────────────────────────────────────────────
const SIZE_COMPAT = {
  xs:     ['xs', 'xsmall', 'extra_small', 'toy', 'small_breed', 'small', 'mini'],
  small:  ['small', 'small_breed', 'small_medium', 'xs', 'xsmall', 'toy'],
  medium: ['medium', 'medium_breed', 'small_medium'],
  large:  ['large', 'large_breed', 'xlarge', 'big', 'giant'],
};

// Breed → default size heuristic (when weight is unknown)
const BREED_DEFAULT_SIZE = {
  chihuahua: 'xs', maltese: 'xs', pomeranian: 'xs', yorkshire: 'xs', toy_poodle: 'xs',
  beagle: 'small', shih_tzu: 'small', indie: 'small', dachshund: 'small', cocker_spaniel: 'small',
  lhasa_apso: 'small', cavalier: 'small', pug: 'small',
  labrador: 'large', golden: 'large', german_shepherd: 'large', boxer: 'large',
  rottweiler: 'large', doberman: 'large', husky: 'large',
};

const CLEAN_NONE = /^(no|none|none_confirmed|no_allergies|no allergies|nil|n\/a|unknown|na)$/i;

// ── Pet data extractors ───────────────────────────────────────────────────────
function extractAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) {
      v.forEach(x => { if (x && !CLEAN_NONE.test(String(x).trim())) s.add(String(x).trim().toLowerCase()); });
    } else if (v && !CLEAN_NONE.test(String(v).trim())) {
      String(v).split(',').forEach(a => {
        const t = a.trim().toLowerCase();
        if (t && !CLEAN_NONE.test(t)) s.add(t);
      });
    }
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  add(pet?.allergies);
  return [...s].filter(a => a && !CLEAN_NONE.test(a));
}

function extractLoves(pet) {
  const loves = [];
  const addLove = item => {
    if (!item) return;
    const v = typeof item === 'string' ? item : (item?.name || item?.value || null);
    if (v && !CLEAN_NONE.test(v)) loves.push(v.toLowerCase().trim());
  };
  addLove(pet?.doggy_soul_answers?.favorite_treats);
  addLove(pet?.doggy_soul_answers?.favorite_protein);
  if (pet?.preferences?.favorite_flavors?.length) addLove(pet.preferences.favorite_flavors[0]);
  return [...new Set(loves)].slice(0, 3);
}

function extractHealthCondition(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw.join(', ') : String(raw);
  return (str.toLowerCase() === 'none' || !str.trim()) ? null : str;
}

function extractNutritionGoal(pet) {
  return (pet?.doggy_soul_answers?.nutrition_goal || pet?.doggy_soul_answers?.weight_goal || '').toLowerCase();
}

// ── Breed extraction ──────────────────────────────────────────────────────────
function extractBreedKey(pet) {
  const raw = (pet?.breed || '').toLowerCase().trim();
  if (!raw) return null;
  // Check if it's a universal fallback breed first
  if (UNIVERSAL_FALLBACK_BREEDS.has(raw)) return '__universal__';
  for (const [key, synonyms] of Object.entries(BREED_SYNONYMS)) {
    if (synonyms.some(s => raw.includes(s) || s.includes(raw))) return key;
  }
  // Check all synonyms for partial matches
  for (const [key, synonyms] of Object.entries(BREED_SYNONYMS)) {
    if (synonyms.some(s => {
      const sWords = s.split(' ');
      return sWords.some(sw => sw.length > 3 && raw.includes(sw));
    })) return key;
  }
  // If raw breed is in universal fallback set (any variant)
  for (const ub of UNIVERSAL_FALLBACK_BREEDS) {
    if (raw.includes(ub) || ub.includes(raw)) return '__universal__';
  }
  // Fallback: use first word of breed as key
  return raw.split(' ')[0].replace(/[^a-z]/g, '');
}

function breedTagMatchesPet(tag, petBreedKey) {
  if (!tag) return null;
  const norm = tag.toLowerCase().replace(/[_-]/g, ' ').trim();
  if (norm === 'all breeds' || norm === 'all' || norm === 'all_breeds') return true;
  if (!petBreedKey) return null;
  // Check synonyms for this pet's breed
  const synonyms = BREED_SYNONYMS[petBreedKey] || [petBreedKey];
  return synonyms.some(s => norm.includes(s) || s.includes(norm));
}

function productBreedScore(product, petBreedKey) {
  const tags = Array.isArray(product.breed_tags) ? product.breed_tags : [];
  const metaBreeds = product.breed_metadata?.breeds || [];
  const allTags = [...tags, ...metaBreeds];

  if (!allTags.length) return 'neutral';

  // all_breeds → neutral
  const isUniversal = allTags.every(t =>
    (t || '').toLowerCase().replace(/[_-]/g, ' ').trim().startsWith('all')
  );
  if (isUniversal) return 'neutral';

  if (!petBreedKey) return 'neutral';

  // Check if any tag matches pet breed
  const matched = allTags.some(t => breedTagMatchesPet(t, petBreedKey));
  return matched ? 'match' : 'mismatch';
}

// ── Size extraction ───────────────────────────────────────────────────────────
function extractSizeCategory(pet) {
  const weight = parseFloat(
    pet?.weight || pet?.weight_kg || pet?.doggy_soul_answers?.weight || 0
  );
  if (weight > 0) {
    if (weight < 5)  return 'xs';
    if (weight < 15) return 'small';
    if (weight < 30) return 'medium';
    return 'large';
  }
  // Fallback from breed
  const breedKey = extractBreedKey(pet);
  return BREED_DEFAULT_SIZE[breedKey] || null;
}

function productSizeScore(product, petSize) {
  if (!petSize) return 'neutral';
  const tags = [
    ...(Array.isArray(product.size_tags) ? product.size_tags : []),
    ...(Array.isArray(product.breed_metadata?.sizes) ? product.breed_metadata.sizes : []),
  ].map(t => (t || '').toLowerCase().replace(/[_-]/g, ''));

  if (!tags.length) return 'neutral';

  const compatible = (SIZE_COMPAT[petSize] || []).map(c => c.replace(/[_-]/g, ''));
  const matches = tags.some(tag => compatible.some(c => tag.includes(c) || c.includes(tag)));
  return matches ? 'match' : 'mismatch';
}

// ── Life stage extraction ─────────────────────────────────────────────────────
function extractLifeStage(pet) {
  const age = parseFloat(
    pet?.age || pet?.age_years || pet?.doggy_soul_answers?.age || 0
  );
  if (!age) return null;
  if (age < 1)  return 'puppy';
  if (age < 8)  return 'adult';
  return 'senior';
}

function productLifeStageScore(product, petStage) {
  if (!petStage) return 'neutral';
  const stages = [
    ...(Array.isArray(product.life_stages) ? product.life_stages : []),
    ...(Array.isArray(product.age_groups) ? product.age_groups : []),
  ].map(s => (s || '').toLowerCase());

  if (!stages.length) return 'neutral';
  const matches = stages.some(s => s.includes(petStage) || petStage.includes(s));
  return matches ? 'match' : 'mismatch';
}

// ── Dietary flags ─────────────────────────────────────────────────────────────
function extractDietaryPrefs(pet) {
  const prefs = [];
  if (pet?.doggy_soul_answers?.prefers_grain_free) prefs.push('grain_free');
  if (pet?.doggy_soul_answers?.prefers_vegetarian) prefs.push('vegetarian');
  if (pet?.doggy_soul_answers?.prefers_single_protein) prefs.push('single_protein');
  const extras = pet?.preferences?.dietary_flags || [];
  extras.forEach(f => prefs.push(f.toLowerCase().replace(/[^a-z_]/g, '_')));
  return [...new Set(prefs)];
}

function dietaryFlagMatch(product, petDietaryPrefs) {
  if (!petDietaryPrefs?.length) return false;
  const flags = (Array.isArray(product.dietary_flags) ? product.dietary_flags : [])
    .map(f => (f || '').toLowerCase().replace(/[^a-z_]/g, '_'));
  return petDietaryPrefs.some(pref => flags.some(f => f.includes(pref) || pref.includes(f)));
}

// ── Sensitivities ─────────────────────────────────────────────────────────────
function sensitivityMatch(product, petHealthCondition) {
  if (!petHealthCondition) return false;
  const senses = (product.breed_metadata?.sensitivities || [])
    .map(s => (s || '').toLowerCase());
  const health = petHealthCondition.toLowerCase();
  return senses.some(s => health.includes(s) || s.includes('sensitive') || s.includes('joint'));
}

// ── Allergen helpers ──────────────────────────────────────────────────────────
function productContainsAllergen(product, allergen) {
  const synonyms = ALLERGEN_MAP[allergen] || [allergen];
  const haystack = [
    product.name || '',
    product.description || product.desc || '',
    product.mira_tag || '',
    ...(Array.isArray(product.ingredients) ? product.ingredients : []),
  ].join(' ').toLowerCase();
  const freeFrom = (product.allergy_free || '').toLowerCase();

  if (synonyms.some(syn => freeFrom.includes(`${syn}-free`) || freeFrom.includes(`${syn} free`))) return false;
  if (freeFrom.includes(`${allergen}-free`) || freeFrom.includes(`${allergen} free`)) return false;

  return synonyms.some(syn => {
    const cleaned = haystack.replace(new RegExp(`${syn}[- ]free`, 'gi'), '');
    return cleaned.includes(syn);
  });
}

// ── Main filter ───────────────────────────────────────────────────────────────
/**
 * applyMiraFilter(products, pet)
 *
 * @param {Array}  products  — Raw products from API
 * @param {Object} pet       — Full pet soul profile
 * @returns {Array}          — Filtered + ranked products with Mira metadata
 */
export function applyMiraFilter(products, pet) {
  if (!products?.length) return [];

  const petName        = pet?.name || 'your dog';
  const allergies      = extractAllergies(pet);
  const loves          = extractLoves(pet);
  const healthCond     = extractHealthCondition(pet);
  const nutritionGoal  = extractNutritionGoal(pet);
  const conflictTags   = GOAL_CONFLICTS[nutritionGoal] || [];
  const petBreedKey    = extractBreedKey(pet);
  const petSize        = extractSizeCategory(pet);
  const petStage       = extractLifeStage(pet);
  const petDietary     = extractDietaryPrefs(pet);

  const filtered = products
    // Step 1 — remove allergen-containing products
    .filter(product => {
      if (!allergies.length) return true;
      return !allergies.some(allergen => productContainsAllergen(product, allergen));
    })
    // Step 1c — life stage HARD filter: puppy-named products ONLY for puppies
    .filter(product => {
      if (!petStage || petStage === 'puppy') return true; // puppy or unknown age → show all
      const productText = [
        product.name || '',
        ...(Array.isArray(product.tags) ? product.tags : []),
        ...(Array.isArray(product.life_stages) ? product.life_stages : []),
        ...(Array.isArray(product.age_groups) ? product.age_groups : []),
        product.sub_category || '',
        product.category || '',
      ].join(' ').toLowerCase();
      // Hard block: if product is explicitly puppy-only, hide from adult/senior dogs
      const isPuppyProduct = /\bpuppy\b|\bpuppies\b|\bpup\b/.test(productText);
      if (isPuppyProduct) return false; // never show puppy products to adult/senior dogs
      // Hard block: senior products only for seniors
      if (petStage === 'adult') {
        const isSeniorOnly = /\bsenior only\b|\bfor seniors\b/.test(productText);
        if (isSeniorOnly) return false;
      }
      return true;
    })
    // Step 1b — remove products with specific breed tags that don't match this pet
    .filter(product => {
      // If pet breed is a universal fallback → show all products (no breed filtering)
      if (petBreedKey === '__universal__') return true;

      const tags = [
        ...(Array.isArray(product.breed_tags) ? product.breed_tags : []),
        ...(product.breed_metadata?.breeds || []),
      ];
      if (!tags.length) return true; // no breed tags → universal, keep

      // All tags are "all_breeds" → universal, keep
      const isUniversal = tags.every(t => {
        const norm = (t || '').toLowerCase().replace(/[_-]/g, ' ').trim();
        return norm === 'all breeds' || norm === 'all' || norm === 'all_breeds' || norm.startsWith('all breed');
      });
      if (isUniversal) return true;

      // Check if any tag maps to a KNOWN breed (otherwise treat as universal)
      const hasKnownBreedTag = tags.some(t => {
        const norm = (t || '').toLowerCase().replace(/[_-]/g, ' ').trim();
        return KNOWN_BREEDS.some(b => norm === b || norm.includes(b) || b.includes(norm));
      });
      if (!hasKnownBreedTag) return true; // unrecognised breed tags → universal fallback, keep

      // Has known specific breed tags → only keep if matches pet's breed
      if (!petBreedKey) return false; // no pet breed → hide all breed-specific products
      return tags.some(t => {
        const norm = (t || '').toLowerCase().replace(/[_-]/g, ' ').trim();
        const syns = BREED_SYNONYMS[petBreedKey] || [petBreedKey];
        return syns.some(s => norm === s || norm.includes(s) || s.includes(norm));
      });
    })
    // Step 2 — enrich with Mira flags + ranking
    .map(product => {
      // Skip products Mira is explicitly told not to suggest
      const canSuggest = product.mira_can_suggest !== false;

      const productText = [
        product.name || '',
        product.description || product.desc || '',
        product.mira_tag || '',
        product.sub_category || '',
        ...(Array.isArray(product.semantic_intents) ? product.semantic_intents : []),
        ...(Array.isArray(product.dietary_flags) ? product.dietary_flags : []),
      ].join(' ').toLowerCase();

      const freeFrom = (product.allergy_free || '').toLowerCase();

      // ── Core signals ──────────────────────────────────────────────────────
      const matchedLove = loves.find(l => productText.includes(l));

      const isHealthSafe = !!(healthCond && (
        productText.includes('treatment-safe') ||
        productText.includes('recovery') ||
        (product.mira_tag || '').toLowerCase().includes('treatment')
      ));

      const isAllergySafe = allergies.length > 0 &&
        allergies.every(a => freeFrom.includes(`${a}-free`) || freeFrom.includes(`${a} free`));

      const conflictsGoal = conflictTags.some(tag => productText.includes(tag));

      // ── New intelligence signals ──────────────────────────────────────────
      const breedScore     = productBreedScore(product, petBreedKey);
      const sizeScore      = productSizeScore(product, petSize);
      const lifeScore      = productLifeStageScore(product, petStage);
      const dietaryMatches = dietaryFlagMatch(product, petDietary);
      const sensMatches    = sensitivityMatch(product, healthCond);

      // ── Compute rank ──────────────────────────────────────────────────────
      let rank = 10; // neutral/universal default

      if (matchedLove && breedScore === 'match') rank = 0;
      else if (matchedLove)               rank = 1;
      else if (breedScore === 'match')    rank = 2;
      else if (isHealthSafe)              rank = 3;
      else if (isAllergySafe)             rank = 4;
      else if (sizeScore === 'match')     rank = 5;
      else if (lifeScore === 'match')     rank = 6;
      else if (dietaryMatches)            rank = 7;
      else if (sensMatches)               rank = 8;

      // Deprioritisation signals (rank worse than neutral)
      if (lifeScore === 'mismatch' && rank >= 10)  rank = 11;
      if (!canSuggest && rank >= 10)               rank = Math.max(rank, 12);
      if (sizeScore === 'mismatch' && rank >= 10)  rank = 13;
      if (breedScore === 'mismatch' && rank >= 10) rank = 14;
      if (conflictsGoal)                           rank = 15;

      // ── Build mira_hint ───────────────────────────────────────────────────
      let mira_hint = product.mira_hint || null;
      if (!mira_hint) {
        if (matchedLove && breedScore === 'match') {
          mira_hint = `${petName} loves ${matchedLove.charAt(0).toUpperCase() + matchedLove.slice(1)} — made for their breed`;
        } else if (matchedLove) {
          mira_hint = `${petName} loves ${matchedLove.charAt(0).toUpperCase() + matchedLove.slice(1)}`;
        } else if (breedScore === 'match') {
          mira_hint = `Made for ${pet?.breed || petName}'s breed`;
        } else if (isHealthSafe) {
          mira_hint = `Safe during ${petName}'s treatment`;
        } else if (isAllergySafe) {
          mira_hint = `Free from ${allergies.join(' & ')} — safe for ${petName}`;
        } else if (sizeScore === 'match') {
          mira_hint = `Right size for ${petName}`;
        } else if (lifeScore === 'match') {
          mira_hint = `Made for ${petStage} dogs`;
        } else if (dietaryMatches) {
          mira_hint = `Matches ${petName}'s dietary preferences`;
        } else if (sensMatches) {
          mira_hint = `Gentle on ${petName}'s sensitivities`;
        } else if (breedScore === 'mismatch') {
          // Deprioritised breed mismatch — do NOT label as "Chosen for X"
          mira_hint = `For specific breeds`;
        } else if (product.mira_tag) {
          mira_hint = product.mira_tag;
        } else if (allergies.length > 0) {
          mira_hint = `Allergen-safe for ${petName}`;
        } else {
          mira_hint = `Chosen for ${petName} by Mira`;
        }
      }

      return {
        ...product,
        mira_hint,
        _loved:       !!matchedLove,
        _healthSafe:  isHealthSafe,
        _breedMatch:  breedScore === 'match',
        _sizeMatch:   sizeScore === 'match',
        _stageMatch:  lifeScore === 'match',
        _dimmed:      !!conflictsGoal,
        miraPick:     false,
        _miraRank:    rank,
        _canSuggest:  canSuggest,
      };
    })
    // Step 3 — sort: best matches first, goal-conflicts last
    .sort((a, b) => {
      if (a._dimmed && !b._dimmed) return 1;
      if (!a._dimmed && b._dimmed) return -1;
      return (a._miraRank || 10) - (b._miraRank || 10);
    });

  // Mark the top result as Mira's pick
  if (filtered.length > 0) {
    filtered[0] = { ...filtered[0], miraPick: true };
  }

  return filtered;
}

// React hook alias
export function useMiraFilter(products, pet) {
  return applyMiraFilter(products, pet);
}

/**
 * excludeCakeProducts — removes cake/birthday-cake products
 * Cakes belong ONLY in the Celebrate pillar.
 * Call this before applyMiraFilter on every non-Celebrate pillar page.
 */
const CAKE_CATEGORY_KEYS = new Set([
  'cakes', 'cake', 'breed-cakes', 'breed_cakes',
  'birthday-cakes', 'birthday_cakes',
  'cake_decorations', 'cake-decorations',
  'dognuts',
]);

export function excludeCakeProducts(products) {
  return products.filter(p => {
    const cat    = (p.category    || '').toLowerCase().replace(/_/g, '-').trim();
    const subCat = (p.sub_category || '').toLowerCase().replace(/_/g, '-').trim();
    // Exact match against known cake category keys
    if (CAKE_CATEGORY_KEYS.has(cat) || CAKE_CATEGORY_KEYS.has(subCat)) return false;
    // Broad name check: any product whose name starts with a known breed + "cake" / "birthday cake"
    const name = (p.name || '').toLowerCase();
    if (name.includes('birthday cake') || name.includes('breed cake') || subCat.includes('cake') || cat.includes('cake')) return false;
    return true;
  });
}

// ── All known breed names that could appear in product names/who_for fields ──
export const KNOWN_BREEDS = [
  // Breeds with product catalogs (properly handled via BREED_SYNONYMS)
  'labrador','golden retriever','german shepherd','indie','poodle',
  'beagle','bulldog','english bulldog','french bulldog',
  'boxer','rottweiler','doberman',
  'husky','siberian husky',
  'pomeranian','shih tzu','maltese','chihuahua',
  'yorkshire','yorkshire terrier',
  'pug','cocker spaniel','dachshund',
  'lhasa apso','cavalier','cavalier king charles',
  'border collie','schnoodle',
  'saint bernard','st bernard','jack russell',
  // Universal-fallback breeds (no dedicated catalog but valid breed names)
  'akita','american bully','australian shepherd',
  'alaskan malamute','malamute',
  'basenji','basset hound','bichon frise','dalmatian',
  'great dane','greyhound','maltipoo','mastiff','pekingese',
  'samoyed','springer spaniel','vizsla','weimaraner',
  'scottish terrier','bernese mountain','havanese','boston terrier',
  'chow chow',
  // Doodle / mixed breeds found in product catalog
  'labradoodle','goldendoodle','cockapoo','cavapoo','schnoodle','maltipoo',
  // Additional breeds found in product catalog — MUST be here to block cross-breed contamination
  'corgi','pembroke corgi','cardigan corgi','welsh corgi',
  'spitz','indian spitz','german spitz',
  'irish setter','english setter','gordon setter',
  'irish terrier','irish wolfhound',
  'bloodhound','rhodesian ridgeback',
  'tibetan mastiff','bull mastiff','staffordshire bull terrier','bull terrier','pit bull',
  'leonberger','newfoundland','coton de tulear','nova scotia',
  // Breeds added to match backend KNOWN_BREED_NAMES (prevent cross-breed contamination)
  'shetland sheepdog','sheltie','whippet','greyhound',
  'west highland terrier','westie','schnauzer','miniature schnauzer',
  'giant schnauzer','flat coated retriever',
  'springer spaniel','english springer spaniel',
  'basset hound','bloodhound','american bully',
];

/**
 * filterBreedProducts — strict breed filter (v2)
 *
 * Rules:
 * 1. Product has breed_tags: ["all_breeds"] or no breed_tags → show for ALL pets
 * 2. Product has specific breed tags (e.g. ["akita"]) → ONLY show for that breed
 * 3. Product has unrecognised breed tags (not in KNOWN_BREEDS) → show for everyone (safe fallback)
 * 4. No breed_tags → fall back to product name / who_for check (legacy)
 *
 * @param {Array}  products  – raw product list
 * @param {string} petBreed  – pet's breed string (from pet.breed)
 * @returns {Array}
 */
export function filterBreedProducts(products, petBreed) {
  const pl = (petBreed || '').toLowerCase().trim();
  const petBreedKey = pl ? extractBreedKey({ breed: petBreed }) : null;

  // If pet breed is a known universal fallback → show all products
  if (petBreedKey === '__universal__') return products;

  const synonyms = petBreedKey && petBreedKey !== '__universal__'
    ? (BREED_SYNONYMS[petBreedKey] || [petBreedKey])
    : (pl ? [pl] : []);

  // Sort by length desc so "golden retriever" beats "retriever"
  const sortedBreeds = [...KNOWN_BREEDS].sort((a, b) => b.length - a.length);

  function detectBreedInName(nameText) {
    for (const b of sortedBreeds) {
      if (nameText.includes(b)) return b;
    }
    return null;
  }

  function breedMatchesPet(detectedBreed) {
    if (!pl) return false;
    if (pl === detectedBreed || pl.includes(detectedBreed) || detectedBreed.includes(pl)) return true;
    return synonyms.some(s => s === detectedBreed || s.includes(detectedBreed) || detectedBreed.includes(s));
  }

  return products.filter(p => {
    const nameText = ((p.name || '') + ' ' + (p.who_for || '')).toLowerCase();

    // ── NAME CHECK FIRST (overrides all_breeds tags) ─────────────────────────
    const detectedInName = detectBreedInName(nameText);
    if (detectedInName) {
      // Product name contains a known breed → STRICT: only show for that breed
      if (!pl) return false;
      return breedMatchesPet(detectedInName);
    }

    // ── breed_tags check (only if no breed in name) ───────────────────────────
    const breedTags = Array.isArray(p.breed_tags) ? p.breed_tags : [];
    if (breedTags.length > 0) {
      // All tags are universal?
      const isUniversal = breedTags.every(t => {
        const norm = (t || '').toLowerCase().replace(/[_-]/g, ' ').trim();
        return norm === 'all breeds' || norm === 'all' || norm === 'all_breeds' || norm.startsWith('all breed');
      });
      if (isUniversal) return true; // genuinely universal (name check passed)

      // Has known breed tags → strict match
      const knownTagBreeds = breedTags.reduce((acc, t) => {
        const norm = (t || '').toLowerCase().replace(/[_-]/g, ' ').trim();
        const matched = KNOWN_BREEDS.find(b => norm === b || norm.includes(b) || b.includes(norm));
        if (matched) acc.push(norm);
        return acc;
      }, []);

      if (knownTagBreeds.length === 0) return true; // no known breed in tags → universal
      if (!pl) return false;

      return breedTags.some(t => {
        const norm = (t || '').toLowerCase().replace(/[_-]/g, ' ').trim();
        if (pl && (norm === pl || norm.includes(pl) || pl.includes(norm))) return true;
        return synonyms.some(s => norm === s || norm.includes(s) || s.includes(norm));
      });
    }

    // ── No breed signal → universal ──────────────────────────────────────────
    return true;
  });
}

// ── Helper exports ────────────────────────────────────────────────────────────
const CLEAN_NONE_EXPORT = /^(no|none|none_confirmed|no_allergies|no allergies|nil|n\/a|unknown|na)$/i;

export function getAllergiesFromPet(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !CLEAN_NONE_EXPORT.test(String(x).trim())) s.add(String(x).trim()); });
    else if (v && !CLEAN_NONE_EXPORT.test(String(v).trim())) s.add(String(v).trim());
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  add(pet?.allergies);
  return [...s].filter(a => a && !CLEAN_NONE_EXPORT.test(a));
}

export { extractBreedKey, extractSizeCategory, extractLifeStage };
