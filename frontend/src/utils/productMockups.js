/**
 * productMockups.js
 * 
 * Pre-generated product mockups with soulful watercolor breed illustrations
 * These are actual product visualization images showing breeds ON the products
 * 
 * Used for: Product cards, product details, personalization previews
 * 
 * Structure:
 * - Product type → Breed → Mockup URL
 * - Each mockup shows the breed illustration printed/embroidered on the actual product
 */

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT MOCKUP LIBRARY
// ═══════════════════════════════════════════════════════════════════════════

export const PRODUCT_MOCKUPS = {
  // ─────────────────────────────────────────────────────────────────────────
  // BANDANAS - Breed illustration printed on cotton bandana
  // ─────────────────────────────────────────────────────────────────────────
  bandana: {
    labrador: {
      name: "Labrador Bandana",
      mockupUrl: "https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/52f9dd45e1396df1a234bf04168e038e598abd236ed34cbf59d3e7ccfacf1198.png",
      description: "Premium white cotton bandana with soulful Labrador watercolor"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MUGS - Breed illustration printed on ceramic mug
  // ─────────────────────────────────────────────────────────────────────────
  mug: {
    golden_retriever: {
      name: "Golden Retriever Mug",
      mockupUrl: "https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/5fda07d915de44befc32bfbdac210125b50d02df9f961e853ffeff772f44fffc.png",
      description: "Premium ceramic mug with soulful Golden Retriever watercolor"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KEYCHAINS - Breed illustration in metal pendant
  // ─────────────────────────────────────────────────────────────────────────
  keychain: {
    beagle: {
      name: "Beagle Keychain",
      mockupUrl: "https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/04829434fe81993b845c310a46f812971287759a5db4074726ce16d59f1d8e6f.png",
      description: "Premium silver keychain with soulful Beagle watercolor"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WELCOME MATS - Breed illustration with "WELCOME" text
  // ─────────────────────────────────────────────────────────────────────────
  welcome_mat: {
    german_shepherd: {
      name: "German Shepherd Welcome Mat",
      mockupUrl: "https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/c98be36b80db466eb4a345c37eefde1c46ce763368b006280587db7ac8247035.png",
      description: "Premium coir doormat with German Shepherd watercolor + WELCOME"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BOWLS - Breed illustration printed inside bowl
  // ─────────────────────────────────────────────────────────────────────────
  bowl: {
    pug: {
      name: "Pug Bowl",
      mockupUrl: "https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/d77bbfb80c70573ef21644b98a2ad918f8e8bf0a009a1e5fcbb22e38772b4f46.png",
      description: "Premium stainless steel bowl with soulful Pug watercolor inside"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FRAMED PORTRAITS - Breed illustration in elegant frame with pet name
  // ─────────────────────────────────────────────────────────────────────────
  framed_portrait: {
    indie: {
      name: "Indie Framed Portrait",
      mockupUrl: "https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/73d0a0f28ceb2f4f875d211f40790c2c5ba2714f677454e1b69bb9867aec52e8.png",
      description: "Elegant framed portrait with soulful Indie watercolor + 'Mojo' name"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TOTE BAGS - Breed illustration with "Dog Mom/Dad" text
  // ─────────────────────────────────────────────────────────────────────────
  tote_bag: {
    husky: {
      name: "Husky Tote Bag",
      mockupUrl: "https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/0969f7cea74048859883596e3126e9883d5c1cca5f09967b7a81466e76caa123.png",
      description: "Premium canvas tote with soulful Husky watercolor + 'Dog Mom' text"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BIRTHDAY CAKES - Breed illustration as cake topper with birthday text
  // ─────────────────────────────────────────────────────────────────────────
  birthday_cake: {
    shih_tzu: {
      name: "Shih Tzu Birthday Cake",
      mockupUrl: "https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/4b425e629050d4582426787426b19bf7e6b234fd88bee7e1bc3d751f2461ad74.png",
      description: "Artisan birthday cake with Shih Tzu topper + 'Happy Birthday Luna'"
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT TYPES AVAILABLE FOR MOCKUPS
// ═══════════════════════════════════════════════════════════════════════════

export const MOCKUP_PRODUCT_TYPES = [
  { type: 'bandana', name: 'Bandana', description: 'Pet bandana with breed illustration' },
  { type: 'mug', name: 'Mug', description: 'Ceramic mug with breed illustration' },
  { type: 'keychain', name: 'Keychain', description: 'Metal keychain with breed illustration' },
  { type: 'welcome_mat', name: 'Welcome Mat', description: 'Doormat with breed + WELCOME' },
  { type: 'bowl', name: 'Food Bowl', description: 'Pet bowl with breed illustration' },
  { type: 'framed_portrait', name: 'Framed Portrait', description: 'Art print with breed + name' },
  { type: 'tote_bag', name: 'Tote Bag', description: 'Canvas bag with breed + text' },
  { type: 'birthday_cake', name: 'Birthday Cake', description: 'Cake with breed topper + name' }
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get mockup for a specific product type and breed
 * @param {string} productType - e.g., 'bandana', 'mug', 'bowl'
 * @param {string} breed - e.g., 'labrador', 'indie', 'pug'
 * @returns {object|null} Mockup data or null
 */
export const getMockup = (productType, breed) => {
  const breedKey = breed?.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
  return PRODUCT_MOCKUPS[productType]?.[breedKey] || null;
};

/**
 * Get all mockups for a specific breed
 * @param {string} breed - e.g., 'labrador'
 * @returns {array} Array of available mockups for this breed
 */
export const getMockupsForBreed = (breed) => {
  const breedKey = breed?.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
  const mockups = [];
  
  for (const [productType, breeds] of Object.entries(PRODUCT_MOCKUPS)) {
    if (breeds[breedKey]) {
      mockups.push({
        productType,
        ...breeds[breedKey]
      });
    }
  }
  
  return mockups;
};

/**
 * Get all mockups for a specific product type
 * @param {string} productType - e.g., 'bandana'
 * @returns {array} Array of breed mockups for this product type
 */
export const getMockupsForProductType = (productType) => {
  const breeds = PRODUCT_MOCKUPS[productType];
  if (!breeds) return [];
  
  return Object.entries(breeds).map(([breedKey, data]) => ({
    breed: breedKey,
    ...data
  }));
};

/**
 * Detect product type from product name
 * @param {string} productName - e.g., "Labrador Bandana", "Custom Mug"
 * @returns {string|null} Product type or null
 */
export const detectProductType = (productName) => {
  const name = (productName || '').toLowerCase();
  
  if (name.includes('bandana') || name.includes('scarf')) return 'bandana';
  if (name.includes('mug') || name.includes('cup')) return 'mug';
  if (name.includes('keychain') || name.includes('key chain') || name.includes('key ring')) return 'keychain';
  if (name.includes('welcome') || name.includes('doormat') || name.includes('mat')) return 'welcome_mat';
  if (name.includes('bowl') || name.includes('feeder')) return 'bowl';
  if (name.includes('frame') || name.includes('portrait') || name.includes('print')) return 'framed_portrait';
  if (name.includes('tote') || name.includes('bag')) return 'tote_bag';
  if (name.includes('cake') || name.includes('birthday')) return 'birthday_cake';
  
  return null;
};

/**
 * Detect breed from product name
 * @param {string} productName - e.g., "Labrador Bandana"
 * @returns {string|null} Breed key or null
 */
export const detectBreedFromProductName = (productName) => {
  const name = (productName || '').toLowerCase();
  
  const breeds = [
    'labrador', 'golden retriever', 'german shepherd', 'beagle', 'pug',
    'shih tzu', 'husky', 'poodle', 'rottweiler', 'boxer', 'bulldog',
    'chihuahua', 'dachshund', 'indie', 'pomeranian', 'doberman',
    'border collie', 'cocker spaniel', 'great dane', 'maltese'
  ];
  
  for (const breed of breeds) {
    if (name.includes(breed)) {
      return breed.replace(/ /g, '_');
    }
  }
  
  return null;
};

/**
 * Get appropriate mockup for a product (auto-detect type and breed)
 * @param {object} product - Product object with name/title
 * @param {string} petBreed - Optional override breed from pet profile
 * @returns {object|null} Mockup data or null
 */
export const getProductMockup = (product, petBreed = null) => {
  const productName = product?.name || product?.title || '';
  
  const productType = detectProductType(productName);
  if (!productType) return null;
  
  // Use pet breed if provided, otherwise detect from product name
  const breed = petBreed 
    ? petBreed.toLowerCase().replace(/ /g, '_').replace(/-/g, '_')
    : detectBreedFromProductName(productName);
  
  if (!breed) return null;
  
  return getMockup(productType, breed);
};

export default {
  PRODUCT_MOCKUPS,
  MOCKUP_PRODUCT_TYPES,
  getMockup,
  getMockupsForBreed,
  getMockupsForProductType,
  detectProductType,
  detectBreedFromProductName,
  getProductMockup
};
