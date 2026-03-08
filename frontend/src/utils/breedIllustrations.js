/**
 * breedIllustrations.js
 * 
 * Soulful watercolor breed illustrations for TheDoggyCompany
 * Used for breed-specific cakes and products
 * 
 * These elegant portraits replace generic/mismatched product images
 * when a breed is detected in the product name.
 */

// Breed illustration mappings - soulful watercolor style
export const BREED_ILLUSTRATIONS = {
  labrador: {
    name: "Labrador Retriever",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/befcce7b86d5aa33c9d5da0f97d613f5468872e8a87fb2a4129a83f3466780d9.png",
    aliases: ["labrador", "lab", "labrador retriever"]
  },
  golden_retriever: {
    name: "Golden Retriever",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7942b3c9b87be19f0fbadc7f300411a59366423f72b58c3583011a9618296b17.png",
    aliases: ["golden retriever", "golden", "goldie"]
  },
  german_shepherd: {
    name: "German Shepherd",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/fb76d88360331e40d1177c31e52281d1346846430de1734dc4f1c6bfad7625a2.png",
    aliases: ["german shepherd", "gsd", "alsatian", "german shepard"]
  },
  indie: {
    name: "Indie / Desi Dog",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/2625d385af8758f7b7c5ac8e02e71cc9a29371d1f3a42be84bb6cb73499ceb90.png",
    aliases: ["indie", "desi", "indian pariah", "pariah", "desi dog", "street dog", "native"]
  },
  beagle: {
    name: "Beagle",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7f73bb9db0b3695ae71d79ed275821d6213018d6704b9566a01d4b0333165506.png",
    aliases: ["beagle"]
  },
  pug: {
    name: "Pug",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/4b3623ff10f0a8026378da5d3341a1627fc9b4bff0731d0339a6681f29268246.png",
    aliases: ["pug", "pugs"]
  },
  shih_tzu: {
    name: "Shih Tzu",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7ff330dc977ff0dcc2ade119e2d038463778a968c7fc19f975080c71d7eafdc1.png",
    aliases: ["shih tzu", "shihtzu", "shitzu", "shih-tzu"]
  },
  chihuahua: {
    name: "Chihuahua",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/98431d5927af586d1b8c5ebfaaed6cf14eaaa568899d7be9c26e171633130465.png",
    aliases: ["chihuahua", "chi"]
  },
  pomeranian: {
    name: "Pomeranian",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/b732cb4a515afbafefc77d04060c9d3cbc21df97612d41eae2744baefb2f8622.png",
    aliases: ["pomeranian", "pom", "spitz"]
  },
  rottweiler: {
    name: "Rottweiler",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/b1da9286f1a395b9347890675a9f34c5f8f04707d7fa437983b1ff3a1653bac2.png",
    aliases: ["rottweiler", "rottie", "rott"]
  },
  husky: {
    name: "Siberian Husky",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/50de93729e8c7da73e41d0101d8364b5ecc3cb18c5217aa02de916722d8d2e71.png",
    aliases: ["husky", "siberian husky", "siberian"]
  },
  french_bulldog: {
    name: "French Bulldog",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/30dc6314fc9a14dc118b8571f3e22d092f1a696fe31fed9495441a7b13934f36.png",
    aliases: ["french bulldog", "frenchie", "french bull"]
  },
  cocker_spaniel: {
    name: "Cocker Spaniel",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/76b028ba1c61d82ca7aebce2d6d95052113abe2d8da0b58b4fdc0a805efaf71a.png",
    aliases: ["cocker spaniel", "cocker", "spaniel"]
  },
  doberman: {
    name: "Doberman Pinscher",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/48c7d527493c05786750bf9cff0493a06300713641b21c154c7d5f5045463526.png",
    aliases: ["doberman", "doberman pinscher", "dobie"]
  },
  boxer: {
    name: "Boxer",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/ac39d70330032f5e401b9d459718227618c6c02929ec9709f1ffe51a9d2a6a99.png",
    aliases: ["boxer"]
  },
  dachshund: {
    name: "Dachshund",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/1696279e20e7ec36effe13afe3504901f23732d5797d3e5df308b7fee362093f.png",
    aliases: ["dachshund", "doxie", "wiener dog", "sausage dog"]
  },
  poodle: {
    name: "Poodle",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/01524ac24d45015990f7fb44dec73b24ae678f17fcc82ab7385c8db943672665.png",
    aliases: ["poodle", "toy poodle", "standard poodle", "miniature poodle"]
  },
  yorkshire: {
    name: "Yorkshire Terrier",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/3888e6f2de400d7cdb257952bb6db439eb177f3093bdcf6cb2b8647e6e197761.png",
    aliases: ["yorkshire", "yorkie", "yorkshire terrier"]
  },
  maltese: {
    name: "Maltese",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/954569cfdfb85edc1e3738628b74000158b580befc1652794ca894268cfa4fdf.png",
    aliases: ["maltese", "malti"]
  },
  bulldog: {
    name: "English Bulldog",
    imageUrl: "https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/7d9eedd105043076b80954aa20d93de8b78599ff1d0ba368770bec7e7810426a.png",
    aliases: ["bulldog", "english bulldog", "british bulldog"]
  }
};

/**
 * Find breed illustration from product name or description
 * @param {string} text - Product name or description to search
 * @returns {object|null} - Breed data with imageUrl or null if not found
 */
export const findBreedIllustration = (text) => {
  if (!text) return null;
  
  const textLower = text.toLowerCase();
  
  // First pass: exact/partial alias matches
  for (const [breedKey, breedData] of Object.entries(BREED_ILLUSTRATIONS)) {
    for (const alias of breedData.aliases) {
      if (textLower.includes(alias)) {
        return {
          breedKey,
          breedName: breedData.name,
          imageUrl: breedData.imageUrl
        };
      }
    }
  }
  
  // Second pass: creative/partial breed name patterns
  const breedPatterns = {
    labrador: /lab(ow|ra|by|s)?|retriev/i,
    golden_retriever: /gold(en|ie)/i,
    german_shepherd: /german|shepherd|alsatian|gsd/i,
    indie: /indie|desi|pariah|native|street\s*dog/i,
    beagle: /beagl/i,
    pug: /pug(s|gy)?/i,
    shih_tzu: /shih|tzu|shiht/i,
    chihuahua: /chi(hua)?|chiwa/i,
    pomeranian: /pom(eranian|s)?|spitz/i,
    rottweiler: /rott(ie|y|weiler)?/i,
    husky: /husk(y|ie)?|siberian/i,
    french_bulldog: /french|frenchie|bull(dog)?/i,
    cocker_spaniel: /cocker|spaniel/i,
    doberman: /dob(erman|ie|y)?/i,
    boxer: /boxer/i,
    dachshund: /dach(shund)?|doxie|wiener|sausage/i,
    poodle: /poodl/i,
    maltese: /malt(ese)?/i,
    yorkshire: /york(ie|shire)?/i,
    bulldog: /bulldog/i
  };
  
  for (const [breedKey, pattern] of Object.entries(breedPatterns)) {
    if (pattern.test(textLower) && BREED_ILLUSTRATIONS[breedKey]) {
      return {
        breedKey,
        breedName: BREED_ILLUSTRATIONS[breedKey].name,
        imageUrl: BREED_ILLUSTRATIONS[breedKey].imageUrl
      };
    }
  }
  
  return null;
};

/**
 * Get product image - uses breed illustration if breed detected, otherwise original image
 * @param {object} product - Product object with name and image_url
 * @returns {string} - Image URL (breed illustration or original)
 */
export const getProductImage = (product) => {
  if (!product) return '/placeholder-product.png';
  
  // Check if product name contains a breed
  const breedMatch = findBreedIllustration(product.name || product.title || '');
  
  if (breedMatch) {
    // For breed-specific products (cakes), use the breed illustration
    const productName = (product.name || product.title || '').toLowerCase();
    if (productName.includes('cake') || productName.includes('birthday')) {
      return breedMatch.imageUrl;
    }
  }
  
  // Return original product image
  return product.image_url || product.image || product.images?.[0] || '/placeholder-product.png';
};

/**
 * Get breed illustration by key
 * @param {string} breedKey - Breed key (e.g., 'labrador', 'german_shepherd')
 * @returns {object|null} - Breed data or null
 */
export const getBreedByKey = (breedKey) => {
  const key = breedKey?.toLowerCase().replace(/-/g, '_').replace(/ /g, '_');
  return BREED_ILLUSTRATIONS[key] || null;
};

/**
 * Get all available breeds
 * @returns {array} - Array of breed objects
 */
export const getAllBreeds = () => {
  return Object.entries(BREED_ILLUSTRATIONS).map(([key, data]) => ({
    key,
    name: data.name,
    imageUrl: data.imageUrl
  }));
};

export default {
  BREED_ILLUSTRATIONS,
  findBreedIllustration,
  getProductImage,
  getBreedByKey,
  getAllBreeds
};
