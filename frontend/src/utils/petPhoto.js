/**
 * Pet Photo Utility
 * Provides consistent pet photos across the app with smart fallbacks
 */

import { API_URL } from './api';

// Breed-specific stock photos (using high-quality Unsplash URLs)
const BREED_STOCK_PHOTOS = {
  // Small breeds
  'pomeranian': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
  'chihuahua': 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&h=400&fit=crop',
  'maltese': 'https://images.unsplash.com/photo-1587559045816-8b0a54d1d99d?w=400&h=400&fit=crop',
  'pug': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop',
  'shih tzu': 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=400&h=400&fit=crop',
  'yorkshire terrier': 'https://images.unsplash.com/photo-1587559045816-8b0a54d1d99d?w=400&h=400&fit=crop',
  'french bulldog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop',
  'dachshund': 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&h=400&fit=crop',
  'beagle': 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400&h=400&fit=crop',
  
  // Medium breeds
  'cocker spaniel': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
  'border collie': 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=400&h=400&fit=crop',
  'australian shepherd': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
  'bulldog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop',
  
  // Large breeds
  'golden retriever': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
  'labrador': 'https://images.unsplash.com/photo-1579213838058-1c09c7c6d13e?w=400&h=400&fit=crop',
  'labrador retriever': 'https://images.unsplash.com/photo-1579213838058-1c09c7c6d13e?w=400&h=400&fit=crop',
  'german shepherd': 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=400&fit=crop',
  'husky': 'https://images.unsplash.com/photo-1547407139-3c921a66005c?w=400&h=400&fit=crop',
  'siberian husky': 'https://images.unsplash.com/photo-1547407139-3c921a66005c?w=400&h=400&fit=crop',
  'rottweiler': 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=400&h=400&fit=crop',
  'doberman': 'https://images.unsplash.com/photo-1571475995424-d07de9e5e5e9?w=400&h=400&fit=crop',
  'great dane': 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&h=400&fit=crop',
  
  // Indian breeds
  'indie': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop',
  'indian pariah': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop',
  'rajapalayam': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
  
  // Default/Generic
  'default': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
  'mixed': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop',
  'unknown': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop'
};

/**
 * Get the appropriate photo URL for a pet
 * Priority: 1. User uploaded photo → 2. Breed stock photo → 3. Default dog photo
 * 
 * @param {Object} pet - The pet object
 * @param {string} pet.photo_url - User uploaded photo URL (may be relative)
 * @param {string} pet.breed - Pet breed for stock photo fallback
 * @returns {string} The best available photo URL
 */
export function getPetPhotoUrl(pet) {
  if (!pet) return BREED_STOCK_PHOTOS.default;
  
  // 1. If user has uploaded a photo, use it
  if (pet.photo_url) {
    // Handle relative URLs
    if (pet.photo_url.startsWith('/')) {
      return `${API_URL}${pet.photo_url}`;
    }
    // Already absolute URL
    if (pet.photo_url.startsWith('http')) {
      return pet.photo_url;
    }
    // Assume it needs the API URL prefix
    return `${API_URL}/${pet.photo_url}`;
  }
  
  // 2. Try to match breed to stock photo
  if (pet.breed) {
    const breedLower = pet.breed.toLowerCase().trim();
    
    // Direct match
    if (BREED_STOCK_PHOTOS[breedLower]) {
      return BREED_STOCK_PHOTOS[breedLower];
    }
    
    // Partial match (e.g., "Golden Retriever Mix" → "golden retriever")
    for (const [breed, url] of Object.entries(BREED_STOCK_PHOTOS)) {
      if (breedLower.includes(breed) || breed.includes(breedLower)) {
        return url;
      }
    }
  }
  
  // 3. Default dog photo
  return BREED_STOCK_PHOTOS.default;
}

/**
 * Get a placeholder/fallback icon color based on pet name
 * Used when showing a paw icon instead of photo
 */
export function getPetColor(petName) {
  if (!petName) return 'purple';
  
  const colors = ['purple', 'pink', 'blue', 'green', 'orange', 'teal', 'rose', 'amber'];
  const index = petName.charCodeAt(0) % colors.length;
  return colors[index];
}

export default {
  getPetPhotoUrl,
  getPetColor,
  BREED_STOCK_PHOTOS
};
