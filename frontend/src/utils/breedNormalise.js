/**
 * Breed normalisation utility — shared across ALL pillar pages.
 * Rule: Known breed → exact products. Unknown/mixed → Indie (most common in India).
 * Mira always uses the pet's ACTUAL breed name — never overrides in conversation.
 */

export const KNOWN_BREEDS = [
  'akita','alaskan malamute','american bully','australian shepherd','basenji',
  'beagle','bernese mountain','bichon frise','border collie','boston terrier',
  'boxer','bulldog','cavalier','chihuahua','chow chow','cocker spaniel',
  'corgi','dachshund','dalmatian','doberman','french bulldog','german shepherd',
  'golden retriever','great dane','havanese','husky','indian spitz','indie',
  'irish setter','italian greyhound','jack russell','labradoodle','labrador',
  'lhasa apso','maltese','maltipoo','pomeranian','poodle','pug','rottweiler',
  'samoyed','schnoodle','scottish terrier','shetland sheepdog','shih tzu',
  'st bernard','vizsla','weimaraner','yorkshire'
];

const BREED_ALIASES = {
  'indian pariah': 'indie',
  'indian street dog': 'indie',
  'desi': 'indie',
  'desi dog': 'indie',
  'street dog': 'indie',
  'stray': 'indie',
  'mixed': 'indie',
  'mixed breed': 'indie',
  'crossbreed': 'indie',
  'cross breed': 'indie',
  'mutt': 'indie',
  'unknown': 'indie',
  'other': 'indie',
  '': 'indie',
};

/**
 * Normalise a breed string to a known breed for product matching.
 * @param {string} breed - Raw breed string from pet profile
 * @returns {string} Normalised breed key (always lowercase)
 */
export function normaliseBreed(breed) {
  if (!breed) return 'indie';
  const clean = breed.toLowerCase().trim().replace(/_/g, ' ');

  // Direct alias match
  if (BREED_ALIASES[clean]) return BREED_ALIASES[clean];

  // Exact known breed match
  if (KNOWN_BREEDS.includes(clean)) return clean;

  // Partial match — breed contains a known breed or vice versa
  for (const known of KNOWN_BREEDS) {
    if (clean.includes(known) || known.includes(clean)) return known;
  }

  // Default to indie — most common Indian dog, safest fallback
  return 'indie';
}

/**
 * Filter products that contain breed-specific names.
 * Shows: generic products + products matching THIS pet's breed only.
 * Hides: products for OTHER breeds.
 */
export function filterBreedProducts(products, petBreed) {
  const petLower = normaliseBreed(petBreed);
  const petWords = petLower.split(' ');

  return products.filter(p => {
    const nm = (p.name || '').toLowerCase();
    const sub = (p.sub_category || '').toLowerCase();
    const combined = nm + ' ' + sub;

    // Check if product mentions ANY known breed
    for (const b of KNOWN_BREEDS) {
      if (combined.includes(b)) {
        // It's a breed-specific product — only show if it's THIS pet's breed
        if (combined.includes(petLower)) return true;
        if (petWords.some(w => w.length > 2 && combined.includes(w))) return true;
        return false; // Different breed's product — hide
      }
    }
    // Generic product (no breed in name) — always show
    return true;
  });
}
