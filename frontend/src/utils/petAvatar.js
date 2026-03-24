/**
 * Pet Avatar Utility
 * Centralized pet photo resolution used across the entire app
 * 
 * Priority:
 * 1. Member's uploaded photo
 * 2. Breed-matched stock photo (beautiful dog of same breed)
 * 3. Default beautiful dog photo
 * 
 * Usage: const { photoUrl, needsUpload, uploadPrompt } = resolvePetAvatar(pet);
 */

import { API_URL } from './api';

// Breed spelling variations and normalization map
const BREED_VARIATIONS = {
  'shihtzu': 'shih tzu',
  'shitzu': 'shih tzu',
  'shih-tzu': 'shih tzu',
  'shihzu': 'shih tzu',
  'goldenretriever': 'golden retriever',
  'germanshepherd': 'german shepherd',
  'frenchbulldog': 'french bulldog',
  'englishbulldog': 'english bulldog',
  'bordercollie': 'border collie',
  'cockerspaniel': 'cocker spaniel',
  'australianshepherd': 'australian shepherd',
  'yorkshireterrier': 'yorkshire terrier',
  'jackrussell': 'jack russell',
  'siberianhusky': 'siberian husky',
  'cavalierking': 'cavalier king charles',
  'cavalier king charles spaniel': 'cavalier king charles',
  'labradorretreiever': 'labrador retriever',
  'labradorretriever': 'labrador retriever',
  'greatdane': 'great dane',
  'bernese mountain': 'bernese mountain dog',
  'alaskan malamute': 'malamute',
  'dobermanpinscher': 'doberman pinscher',
  'indian pariah dog': 'indian pariah',
  'desi dog': 'desi',
  'indie dog': 'indie',
  'pembrokecorgi': 'pembroke welsh corgi',
  'welsh corgi': 'pembroke welsh corgi',
  'minischnauzer': 'miniature schnauzer',
  'mini schnauzer': 'miniature schnauzer',
  'boston': 'boston terrier',
  'rottweiller': 'rottweiler',
  'rotweiler': 'rottweiler',
  'pomerian': 'pomeranian',
  'pom': 'pomeranian',
};

// Function to normalize breed names
const normalizeBreed = (breed) => {
  if (!breed) return '';
  const cleaned = breed.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Check for direct variation match
  if (BREED_VARIATIONS[cleaned.replace(/\s/g, '')]) {
    return BREED_VARIATIONS[cleaned.replace(/\s/g, '')];
  }
  if (BREED_VARIATIONS[cleaned]) {
    return BREED_VARIATIONS[cleaned];
  }
  
  return cleaned;
};

// High-quality breed-specific stock photos from Unsplash
const BREED_PHOTOS = {
  // Small breeds
  'pomeranian': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'chihuahua': 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&h=400&fit=crop&q=80',
  'maltese': 'https://images.unsplash.com/photo-1587559045816-8b0a54d1d99d?w=400&h=400&fit=crop&q=80',
  'pug': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop&q=80',
  'shih tzu': 'https://images.unsplash.com/photo-1740011962598-73f722075dc1?w=400&h=400&fit=crop&q=80',
  'yorkshire terrier': 'https://images.unsplash.com/photo-1587559045816-8b0a54d1d99d?w=400&h=400&fit=crop&q=80',
  'yorkie': 'https://images.unsplash.com/photo-1587559045816-8b0a54d1d99d?w=400&h=400&fit=crop&q=80',
  'french bulldog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop&q=80',
  'frenchie': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop&q=80',
  'dachshund': 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&h=400&fit=crop&q=80',
  'beagle': 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400&h=400&fit=crop&q=80',
  'boston terrier': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop&q=80',
  'cavalier': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'cavalier king charles': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'jack russell': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'miniature schnauzer': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'shiba inu': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'corgi': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'pembroke welsh corgi': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'lhasa apso': 'https://images.unsplash.com/photo-1765974918658-fbba97cad60d?w=400&h=400&fit=crop&q=80',
  
  // Medium breeds
  'cocker spaniel': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'border collie': 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=400&h=400&fit=crop&q=80',
  'australian shepherd': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'bulldog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop&q=80',
  'english bulldog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop&q=80',
  'springer spaniel': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'boxer': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'dalmatian': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'samoyed': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  
  // Large breeds
  'golden retriever': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&q=80',
  'golden': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&q=80',
  'labrador': 'https://images.unsplash.com/photo-1579213838058-1c09c7c6d13e?w=400&h=400&fit=crop&q=80',
  'labrador retriever': 'https://images.unsplash.com/photo-1579213838058-1c09c7c6d13e?w=400&h=400&fit=crop&q=80',
  'lab': 'https://images.unsplash.com/photo-1579213838058-1c09c7c6d13e?w=400&h=400&fit=crop&q=80',
  'german shepherd': 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=400&fit=crop&q=80',
  'gsd': 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=400&fit=crop&q=80',
  'husky': 'https://images.unsplash.com/photo-1547407139-3c921a66005c?w=400&h=400&fit=crop&q=80',
  'siberian husky': 'https://images.unsplash.com/photo-1547407139-3c921a66005c?w=400&h=400&fit=crop&q=80',
  'rottweiler': 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=400&h=400&fit=crop&q=80',
  'doberman': 'https://images.unsplash.com/photo-1571475995424-d07de9e5e9e9?w=400&h=400&fit=crop&q=80',
  'doberman pinscher': 'https://images.unsplash.com/photo-1571475995424-d07de9e5e9e9?w=400&h=400&fit=crop&q=80',
  'great dane': 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&h=400&fit=crop&q=80',
  'bernese mountain dog': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'bernese': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'saint bernard': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'newfoundland': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'akita': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'malamute': 'https://images.unsplash.com/photo-1547407139-3c921a66005c?w=400&h=400&fit=crop&q=80',
  'alaskan malamute': 'https://images.unsplash.com/photo-1547407139-3c921a66005c?w=400&h=400&fit=crop&q=80',
  
  // Indian breeds
  'indie': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop&q=80',
  'indian pariah': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop&q=80',
  'desi': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop&q=80',
  'rajapalayam': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'mudhol hound': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'kombai': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  
  // Default/Mixed
  'mixed': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop&q=80',
  'mixed breed': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop&q=80',
  'unknown': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'default': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80'
};

/**
 * Main function to resolve pet avatar
 * @param {Object} pet - Pet object with photo_url, image, breed, name, id
 * @returns {Object} { photoUrl, needsUpload, uploadPrompt, isBreedPhoto }
 */
export function resolvePetAvatar(pet) {
  if (!pet) {
    return {
      photoUrl: BREED_PHOTOS.default,
      needsUpload: true,
      uploadPrompt: 'Add your pet',
      isBreedPhoto: true
    };
  }
  
  const petName = pet.name || 'your pet';
  const petId = pet.id || '';
  
  // 1. Check if member uploaded a photo (check multiple fields)
  const uploadedPhoto = pet.photo_url || pet.image || pet.profile_image || pet.avatar;
  
  if (uploadedPhoto) {
    let photoUrl = uploadedPhoto;

    if (Array.isArray(photoUrl)) {
      photoUrl = photoUrl[0];
    }

    if (photoUrl && typeof photoUrl === 'object') {
      photoUrl = photoUrl.url || photoUrl.secure_url || photoUrl.image_url || photoUrl.src || photoUrl.path || null;
    }

    if (typeof photoUrl !== 'string' || !photoUrl.trim()) {
      photoUrl = null;
    }

    if (!photoUrl) {
      // Fall through to breed/default logic if uploaded photo is malformed
    } else {
    
    // Convert any old formats to new simplified API route
    // Old format 1: /api/pet-photo/petid/filename.jpg
    // Old format 2: /static/uploads/pets/filename.jpg
    // New format: /api/pet-photo/petid
    
    if (photoUrl.includes('/static/uploads/pets/') || 
        (photoUrl.includes('/api/pet-photo/') && photoUrl.split('/').length > 4)) {
      // Use simplified URL with just pet ID
      if (petId) {
        photoUrl = `/api/pet-photo/${petId}`;
      }
    }
    
    // Handle relative URLs (but not external URLs like customer-assets.emergentagent.com)
    if (photoUrl.startsWith('/')) {
      photoUrl = `${API_URL}${photoUrl}`;
    } else if (!photoUrl.startsWith('http')) {
      photoUrl = `${API_URL}/${photoUrl}`;
    }
    // External URLs (https://...) are used as-is
    
    return {
      photoUrl,
      needsUpload: false,
      uploadPrompt: null,
      isBreedPhoto: false
    };
    }
  }
  
  // 2. Try to find breed-matched photo
  const rawBreed = (pet.breed || '').toLowerCase().trim();
  const breed = normalizeBreed(rawBreed); // Normalize spelling variations
  let breedPhoto = null;
  
  // Direct match with normalized breed
  if (BREED_PHOTOS[breed]) {
    breedPhoto = BREED_PHOTOS[breed];
  } else if (BREED_PHOTOS[rawBreed]) {
    // Also try raw breed in case it's already correct
    breedPhoto = BREED_PHOTOS[rawBreed];
  } else {
    // Partial match (e.g., "Golden Retriever Mix" → "golden retriever")
    for (const [breedKey, url] of Object.entries(BREED_PHOTOS)) {
      if (breed.includes(breedKey) || breedKey.includes(breed) ||
          rawBreed.includes(breedKey) || breedKey.includes(rawBreed)) {
        breedPhoto = url;
        break;
      }
    }
  }
  
  if (breedPhoto) {
    return {
      photoUrl: breedPhoto,
      needsUpload: true,
      uploadPrompt: `Upload ${petName}'s photo`,
      isBreedPhoto: true
    };
  }
  
  // 3. Default beautiful dog photo
  return {
    photoUrl: BREED_PHOTOS.default,
    needsUpload: true,
    uploadPrompt: `Upload ${petName}'s photo`,
    isBreedPhoto: true
  };
}

/**
 * Get photo URL only (for simple cases)
 */
export function getPetPhotoUrl(pet) {
  return resolvePetAvatar(pet).photoUrl;
}

/**
 * Check if pet needs photo upload
 */
export function petNeedsPhoto(pet) {
  return resolvePetAvatar(pet).needsUpload;
}

// Export breed photos and normalization for reference
export { BREED_PHOTOS, BREED_VARIATIONS, normalizeBreed };

export default resolvePetAvatar;
