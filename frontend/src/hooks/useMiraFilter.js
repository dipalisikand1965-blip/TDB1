/**
 * useMiraFilter.js
 *
 * Shared Mira Intelligence filter — filters, ranks, and annotates products
 * based on a pet's soul profile (allergies, loves, health, nutrition goal).
 *
 * Use applyMiraFilter() in any pillar page product grid.
 * SharedProductCard automatically renders product.mira_hint when set.
 *
 * Returns products enriched with:
 *   mira_hint    {string}   — "Why Mira picked this" (shown by SharedProductCard)
 *   _loved       {boolean}  — matches pet's favourite food/flavour
 *   _healthSafe  {boolean}  — safe for health condition
 *   _dimmed      {boolean}  — conflicts with nutrition goal (render at 55% opacity)
 *   miraPick     {boolean}  — true = Mira's #1 recommendation (amber callout)
 */

// ── Allergen ingredient synonym map ──────────────────────────────────────────
// Add new synonyms as the catalogue grows — filtering updates everywhere automatically
const ALLERGEN_MAP = {
  chicken:  ['chicken', 'poultry', 'fowl'],
  soy:      ['soy', 'soya', 'tofu', 'edamame'],
  wheat:    ['wheat', 'gluten', 'flour', 'barley'],
  dairy:    ['milk', 'cheese', 'butter', 'lactose', 'whey', 'dairy'],
  eggs:     ['egg', 'eggs'],
  beef:     ['beef', 'bovine'],
  pork:     ['pork', 'ham', 'bacon'],
  lamb:     ['lamb', 'mutton'],
  fish:     ['fish', 'salmon', 'tuna', 'cod', 'anchovy'],
  shellfish:['shrimp', 'prawn', 'crab', 'lobster', 'shellfish'],
};

// ── Nutrition goal conflict map ───────────────────────────────────────────────
const GOAL_CONFLICTS = {
  'weight loss':   ['high-calorie', 'high-fat', 'energy-dense', 'high calorie'],
  'weight gain':   ['low-calorie', 'light', 'low calorie'],
  'senior health': ['puppy', 'high-energy'],
  'puppy growth':  ['senior', 'weight management'],
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

  // Explicitly marked free from this allergen → safe to show
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
 * @param {Array}  products  - Raw products from API
 * @param {Object} pet       - Full pet soul profile (from usePillarContext)
 * @returns {Array}          - Filtered + ranked products with Mira metadata
 */
export function applyMiraFilter(products, pet) {
  if (!products?.length) return [];

  const petName = pet?.name || 'your dog';
  const allergies = extractAllergies(pet);
  const loves = extractLoves(pet);
  const healthCondition = extractHealthCondition(pet);
  const nutritionGoal = extractNutritionGoal(pet);
  const conflictTags = GOAL_CONFLICTS[nutritionGoal] || [];

  const filtered = products
    // Step 1 — remove allergen-containing products
    .filter(product => {
      if (!allergies.length) return true;
      return !allergies.some(allergen => productContainsAllergen(product, allergen));
    })
    // Step 2 — enrich with Mira flags + "why I picked this"
    .map(product => {
      const productText = [
        product.name || '',
        product.description || product.desc || '',
        product.mira_tag || '',
        product.sub_category || '',
      ].join(' ').toLowerCase();
      const freeFrom = (product.allergy_free || '').toLowerCase();

      const matchedLove = loves.find(l => productText.includes(l));
      const isHealthSafe = !!(healthCondition && (
        productText.includes('treatment-safe') ||
        productText.includes('recovery') ||
        (product.mira_tag || '').toLowerCase().includes('treatment')
      ));
      const isAllergySafe = allergies.length > 0 &&
        allergies.every(a => freeFrom.includes(`${a}-free`) || freeFrom.includes(`${a} free`));
      const conflictsGoal = conflictTags.some(tag => productText.includes(tag));

      // Priority rank (lower = higher priority)
      let rank = 10;
      if (matchedLove) rank = 0;
      else if (isHealthSafe) rank = 1;
      else if (isAllergySafe) rank = 2;
      if (conflictsGoal) rank = 15;

      // Build mira_hint — use existing DB value if present, otherwise generate
      let mira_hint = product.mira_hint || null;
      if (!mira_hint) {
        if (matchedLove) {
          mira_hint = `${petName} loves ${matchedLove.charAt(0).toUpperCase() + matchedLove.slice(1)}`;
        } else if (isHealthSafe) {
          mira_hint = `Safe during ${petName}'s treatment`;
        } else if (isAllergySafe) {
          mira_hint = `Free from ${allergies.join(' & ')} — safe for ${petName}`;
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
        _loved: !!matchedLove,
        _healthSafe: isHealthSafe,
        _dimmed: !!conflictsGoal,
        miraPick: false,
        _miraRank: rank,
      };
    })
    // Step 3 — sort: loved → health-safe → allergy-safe → rest → dimmed last
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

// React hook alias — can be called inside components
export function useMiraFilter(products, pet) {
  return applyMiraFilter(products, pet);
}

// Helper for hero allergy badges — exported so pages can import instead of duplicating
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
