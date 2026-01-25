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

// High-quality breed-specific stock photos from Unsplash
const BREED_PHOTOS = {
  // Small breeds
  'pomeranian': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  'chihuahua': 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&h=400&fit=crop&q=80',
  'maltese': 'https://images.unsplash.com/photo-1587559045816-8b0a54d1d99d?w=400&h=400&fit=crop&q=80',
  'pug': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop&q=80',
  'shih tzu': 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=400&h=400&fit=crop&q=80',
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
 * @param {Object} pet - Pet object with photo_url, breed, name, id
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
  
  // 1. Check if member uploaded a photo
  if (pet.photo_url) {
    let photoUrl = pet.photo_url;
    
    // Handle relative URLs
    if (photoUrl.startsWith('/')) {
      photoUrl = `${API_URL}${photoUrl}`;
    } else if (!photoUrl.startsWith('http')) {
      photoUrl = `${API_URL}/${photoUrl}`;
    }
    
    return {
      photoUrl,
      needsUpload: false,
      uploadPrompt: null,
      isBreedPhoto: false
    };
  }
  
  // 2. Try to find breed-matched photo
  const breed = (pet.breed || '').toLowerCase().trim();
  let breedPhoto = null;
  
  // Direct match
  if (BREED_PHOTOS[breed]) {
    breedPhoto = BREED_PHOTOS[breed];
  } else {
    // Partial match (e.g., "Golden Retriever Mix" → "golden retriever")
    for (const [breedKey, url] of Object.entries(BREED_PHOTOS)) {
      if (breed.includes(breedKey) || breedKey.includes(breed)) {
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

// Export breed photos for reference
export { BREED_PHOTOS };

export default resolvePetAvatar;
