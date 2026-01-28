import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { SlidersHorizontal, Loader2, ChevronDown, Sparkles, PawPrint, Cake, Gift, Star, Heart, MapPin } from 'lucide-react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { API_URL, getApiUrl } from '../utils/api';
import MiraContextPanel from '../components/MiraContextPanel';
import CelebrateConcierePicker from '../components/CelebrateConcierePicker';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/SEOHead';

const PRODUCTS_PER_PAGE = 20;

// Hero images for different categories
const CATEGORY_HERO_IMAGES = {
  cakes: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
  'breed-cakes': 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=1200&q=80',
  treats: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
  hampers: 'https://images.unsplash.com/photo-1530041539828-114de669390e?w=1200&q=80',
  desi: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
  'frozen-treats': 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=1200&q=80',
  'mini-cakes': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
  dognuts: 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=1200&q=80',
  valentine: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&q=80',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80',
  'cat-treats': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80'
};

// Hero content for different categories
const CATEGORY_HERO_CONTENT = {
  cakes: {
    badge: 'Celebrate with Love',
    title: 'Birthday Cakes',
    highlight: 'Made with Joy',
    subtitle: 'Freshly baked, 100% pet-safe cakes for your furry friend\'s special day',
    color: 'from-pink-600 via-rose-500 to-orange-500'
  },
  'breed-cakes': {
    badge: 'Custom Designs',
    title: 'Breed-Specific',
    highlight: 'Cakes',
    subtitle: 'Cakes shaped like your beloved breed - from Labradors to Pugs!',
    color: 'from-purple-600 via-violet-500 to-pink-500'
  },
  treats: {
    badge: 'Healthy & Delicious',
    title: 'Treats &',
    highlight: 'Snacks',
    subtitle: 'Training treats, healthy bites, and everyday rewards your pet will love',
    color: 'from-amber-600 via-orange-500 to-yellow-500'
  },
  hampers: {
    badge: 'Perfect Gifts',
    title: 'Celebration',
    highlight: 'Hampers',
    subtitle: 'Complete party boxes with cakes, treats, bandanas, and toys!',
    color: 'from-emerald-600 via-teal-500 to-cyan-500'
  },
  desi: {
    badge: 'Indian Flavors',
    title: 'Desi Doggy',
    highlight: 'Treats 🪔',
    subtitle: 'Traditional Indian sweets made pet-friendly - perfect for festivals!',
    color: 'from-orange-600 via-amber-500 to-yellow-500'
  },
  'desi-treats': {
    badge: 'Indian Flavors',
    title: 'Desi Doggy',
    highlight: 'Treats 🪔',
    subtitle: 'Traditional Indian sweets made pet-friendly - perfect for festivals!',
    color: 'from-orange-600 via-amber-500 to-yellow-500'
  },
  'frozen-treats': {
    badge: 'Beat the Heat',
    title: 'Frozen',
    highlight: 'Delights',
    subtitle: 'Cool, refreshing ice creams and frozen treats for hot days',
    color: 'from-cyan-600 via-blue-500 to-indigo-500'
  },
  'mini-cakes': {
    badge: 'Bite-Sized Joy',
    title: 'Bowto',
    highlight: 'Cakes',
    subtitle: 'Mini celebration cakes perfect for any occasion',
    color: 'from-rose-600 via-pink-500 to-purple-500'
  },
  dognuts: {
    badge: 'Fun Shapes',
    title: 'Pupcakes &',
    highlight: 'Dognuts',
    subtitle: 'Adorable mini baked treats - cupcakes and donuts for dogs!',
    color: 'from-pink-600 via-rose-500 to-red-500'
  },
  valentine: {
    badge: 'Share the Love',
    title: 'Valentine',
    highlight: 'Collection 💕',
    subtitle: 'Show your pet how much you love them with our special collection',
    color: 'from-red-600 via-rose-500 to-pink-500'
  },
  cat: {
    badge: 'For Felines',
    title: 'Cat',
    highlight: 'Treats 🐱',
    subtitle: 'Special treats crafted for our feline friends',
    color: 'from-violet-600 via-purple-500 to-indigo-500'
  },
  'cat-treats': {
    badge: 'For Felines',
    title: 'Cat',
    highlight: 'Treats 🐱',
    subtitle: 'Special treats crafted for our feline friends',
    color: 'from-violet-600 via-purple-500 to-indigo-500'
  },
  default: {
    badge: 'Celebrate Every Moment',
    title: 'Celebrate',
    highlight: 'With Your Pet 🎉',
    subtitle: 'Cakes, treats, and celebration essentials for your furry family',
    color: 'from-purple-600 via-pink-500 to-rose-500'
  }
};

// Map category to pillar for Mira panel
const CATEGORY_TO_PILLAR = {
  'cakes': 'celebrate',
  'custom': 'celebrate',
  'breed-cakes': 'celebrate',
  'treats': 'celebrate',
  'desi': 'celebrate',
  'desi-treats': 'celebrate',
  'hampers': 'celebrate',
  'meals': 'dine',
  'fresh-meals': 'dine',
  'frozen': 'celebrate',
  'frozen-treats': 'celebrate',
  'mini-cakes': 'celebrate',
  'dognuts': 'celebrate',
  'pizzas-burgers': 'dine',
  'merchandise': 'shop',
  'accessories': 'shop',
  'nut-butters': 'shop',
  'pan-india': 'shop',
  'cat': 'shop',
  'cat-treats': 'shop',
  'valentine': 'celebrate',
  'autoship': 'shop',
  'all': 'shop'
};

const ProductListing = ({ category = 'all' }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const searchQuery = searchParams.get('search');
  const { user, token } = useAuth();
  
  // Determine the SEO page type based on category and path
  const getSeoPage = () => {
    const path = location.pathname;
    if (path.includes('/celebrate') || category === 'cakes') return 'celebrate';
    if (path.includes('/cakes')) return 'cakes';
    if (path.includes('/treats')) return 'treats';
    return 'shop';
  };
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petRecommendations, setPetRecommendations] = useState([]);
  const [personalizedMessage, setPersonalizedMessage] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('all'); // For cake availability filter
  const [detectedCity, setDetectedCity] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Additional filters for Celebrate products
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedShape, setSelectedShape] = useState('all');
  const [availableBreeds, setAvailableBreeds] = useState([]);
  const [availableShapes, setAvailableShapes] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  // Check if this is a cake category that needs availability filter
  const isCakeCategory = ['cakes', 'breed-cakes', 'custom', 'birthday-cakes', 'pupcakes', 'dognuts', 'mini-cakes'].includes(category);
  
  // Check if this is breed cakes - needs breed filter
  const isBreedCakeCategory = category === 'breed-cakes';
  
  // Check if this needs shape filter (birthday cakes, cakes)
  const needsShapeFilter = ['cakes', 'birthday-cakes', 'Birthdays'].includes(category);

  // Available cities for fresh delivery
  const FRESH_DELIVERY_CITIES = [
    { value: 'all', label: 'All Availability' },
    { value: 'bangalore', label: '🏙️ Bangalore (Fresh)' },
    { value: 'mumbai', label: '🏙️ Mumbai (Fresh)' },
    { value: 'delhi ncr', label: '🏙️ Delhi NCR (Fresh)' },
    { value: 'pan-india', label: '📦 Pan-India Only' },
  ];

  // Location detection function
  const detectLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }
    
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get city
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          // Extract city from address
          const city = data.address?.city || data.address?.town || data.address?.state_district || '';
          const cityLower = city.toLowerCase();
          
          // Match to our delivery cities
          let matchedCity = null;
          if (cityLower.includes('bangalore') || cityLower.includes('bengaluru')) {
            matchedCity = 'bangalore';
          } else if (cityLower.includes('mumbai')) {
            matchedCity = 'mumbai';
          } else if (cityLower.includes('delhi') || cityLower.includes('noida') || cityLower.includes('gurgaon') || cityLower.includes('gurugram')) {
            matchedCity = 'delhi ncr';
          }
          
          if (matchedCity) {
            setDetectedCity(matchedCity);
            setDeliveryCity(matchedCity);
          } else {
            setDetectedCity('other');
          }
        } catch (err) {
          console.error('Failed to detect location:', err);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // Auto-detect location on mount for cake categories
  useEffect(() => {
    if (isCakeCategory && !detectedCity) {
      detectLocation();
    }
  }, [isCakeCategory]);

  // Get the pillar for this category
  const pillar = CATEGORY_TO_PILLAR[category] || 'shop';

  // Fetch user's pets for personalization
  useEffect(() => {
    const fetchPets = async () => {
      if (token) {
        try {
          const res = await fetch(`${getApiUrl()}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserPets(data.pets || []);
            
            // Set first pet as selected and generate message
            if (data.pets && data.pets.length > 0) {
              const pet = data.pets[0];
              setSelectedPet(pet);
              
              const messages = [
                `🎂 Perfect picks for ${pet.name}!`,
                `${pet.name} would love these! 🐾`,
                `${pet.name}'s tail will wag for these! 🎉`,
                `Made with love for ${pet.name}! 💕`,
              ];
              setPersonalizedMessage(messages[Math.floor(Math.random() * messages.length)]);
              
              // Fetch personalized recommendations for this pet
              try {
                const recRes = await fetch(`${getApiUrl()}/api/products/recommendations/for-pet/${pet.id}?limit=8`);
                if (recRes.ok) {
                  const recData = await recRes.json();
                  setPetRecommendations(recData.recommendations || []);
                }
              } catch (recErr) {
                console.debug('Could not fetch recommendations:', recErr);
              }
            }
          }
        } catch (err) {
          console.debug('Failed to fetch pets:', err);
        }
      }
    };
    fetchPets();
  }, [token]);
  
  // Fetch recommendations when pet changes
  const handlePetChange = async (petId) => {
    const pet = userPets.find(p => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setPersonalizedMessage(`🎂 Perfect picks for ${pet.name}!`);
      
      try {
        const recRes = await fetch(`${getApiUrl()}/api/products/recommendations/for-pet/${pet.id}?limit=8`);
        if (recRes.ok) {
          const recData = await recRes.json();
          setPetRecommendations(recData.recommendations || []);
        }
      } catch (err) {
        console.debug('Could not fetch recommendations:', err);
      }
    }
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // For pan-india, fetch multiple categories that can be shipped pan-india
        if (category === 'pan-india') {
          const categories = ['pan-india', 'treats', 'desi-treats', 'nut-butters'];
          const allProducts = [];
          
          for (const cat of categories) {
            try {
              const response = await fetch(`${getApiUrl()}/api/products?limit=500&category=${cat}`);
              if (response.ok) {
                const data = await response.json();
                allProducts.push(...(data.products || []));
              }
            } catch (fetchError) {
              console.warn(`Failed to fetch ${cat} products:`, fetchError);
            }
          }
          
          // Remove duplicates based on id
          const uniqueProducts = allProducts.filter((product, index, self) =>
            product && product.id && index === self.findIndex((p) => p && p.id === product.id)
          );
          
          setProducts(uniqueProducts);
        } else if (category === 'autoship') {
          // For autoship, fetch all products and filter by autoship_enabled
          const response = await fetch(`${getApiUrl()}/api/products?limit=500&autoship_enabled=true`);
          if (response.ok) {
            const data = await response.json();
            // Filter client-side in case API doesn't support the filter
            const autoshipProducts = (data.products || []).filter(p => p && p.autoship_enabled === true);
            setProducts(autoshipProducts);
          } else {
            setProducts([]);
          }
        } else {
          let url = `${API_URL}/api/products?limit=500`;
          if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
          } else if (category && category !== 'all') {
            // Use collection parameter for special collections like valentine
            const collectionCategories = ['valentine', 'seasonal', 'bestsellers'];
            if (collectionCategories.includes(category.toLowerCase())) {
              url += `&collection=${category}`;
            } else {
              url += `&category=${category}`;
            }
          }
          
          // Add fresh delivery city filter for cake categories
          if (isCakeCategory && deliveryCity && deliveryCity !== 'all') {
            if (deliveryCity === 'pan-india') {
              url += `&availability=pan-india`;
            } else {
              url += `&fresh_delivery_city=${encodeURIComponent(deliveryCity)}`;
            }
          }
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            // Ensure we always have an array, even if API returns unexpected data
            const productsArray = Array.isArray(data.products) ? data.products : [];
            const validProducts = productsArray.filter(p => p !== null && p !== undefined);
            setProducts(validProducts);
            
            // Extract unique breeds and shapes from products for filters
            const breeds = new Set();
            const shapes = new Set();
            
            validProducts.forEach(product => {
              // Extract breeds from tags, name, or category
              const productTags = product.tags || [];
              const productName = (product.name || '').toLowerCase();
              
              // Common dog breeds to look for
              const breedPatterns = ['labrador', 'golden retriever', 'pug', 'beagle', 'husky', 'german shepherd', 
                'bulldog', 'poodle', 'rottweiler', 'dachshund', 'shih tzu', 'boxer', 'doberman', 
                'great dane', 'chihuahua', 'corgi', 'dalmatian', 'pomeranian', 'indie', 'spitz'];
              
              breedPatterns.forEach(breed => {
                if (productName.includes(breed) || productTags.some(t => (t || '').toLowerCase().includes(breed))) {
                  breeds.add(breed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
                }
              });
              
              // Extract shapes from tags or name
              const shapePatterns = ['round', 'square', 'heart', 'bone', 'paw', 'star', 'number', 'letter', 'custom'];
              
              shapePatterns.forEach(shape => {
                if (productName.includes(shape) || productTags.some(t => (t || '').toLowerCase().includes(shape))) {
                  shapes.add(shape.charAt(0).toUpperCase() + shape.slice(1));
                }
              });
            });
            
            setAvailableBreeds(['all', ...Array.from(breeds).sort()]);
            setAvailableShapes(['all', ...Array.from(shapes).sort()]);
          } else {
            console.error('Failed to fetch products, status:', response.status);
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]); // Set empty array on error to prevent crashes
      }
      setLoading(false);
    };
    fetchProducts();
  }, [category, searchQuery, deliveryCity, isCakeCategory]);

  // Use a key-based approach to reset visible count
  const filterKey = `${category}-${searchQuery}-${priceRange}-${sortBy}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  
  // Reset visible count when filters change
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PRODUCTS_PER_PAGE);
  }

  let filteredProducts = [...products].filter(p => p !== null && p !== undefined);

  // PET SOUL FILTERING - Filter out products based on pet's allergies/restrictions
  // This implements the doctrine: "Commerce obeys Pet Soul"
  const activePet = userPets?.[0]; // Use first pet for filtering (safe access)
  const petAllergies = activePet?.doggy_soul_answers?.food_allergies || 
                       activePet?.preferences?.allergies || 
                       activePet?.health?.allergies || [];
  
  if (Array.isArray(petAllergies) && petAllergies.length > 0 && !petAllergies.includes('No') && !petAllergies.includes('None')) {
    const allergyKeywords = petAllergies.map(a => (a || '').toLowerCase()).filter(a => a && a !== 'no' && a !== 'none' && a !== 'other');
    
    if (allergyKeywords.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        if (!product) return false;
        const productName = (product.name || product.title || '').toLowerCase();
        const productDesc = (product.description || '').toLowerCase();
        const productIngredients = (product.ingredients || '').toLowerCase();
        const productTags = Array.isArray(product.tags) ? product.tags.map(t => (t || '').toLowerCase()).join(' ') : '';
        
        // Check if product contains any allergen
        const hasAllergen = allergyKeywords.some(allergen => 
          productName.includes(allergen) || 
          productDesc.includes(allergen) || 
          productIngredients.includes(allergen) ||
          productTags.includes(allergen)
        );
        
        return !hasAllergen; // Keep products that DON'T have allergens
      });
    }
  }

  // Filter by price range
  if (priceRange === 'under500') {
    filteredProducts = filteredProducts.filter(p => (p.price || p.minPrice || 0) < 500);
  } else if (priceRange === '500-1000') {
    filteredProducts = filteredProducts.filter(p => {
      const price = p.price || p.minPrice || 0;
      return price >= 500 && price <= 1000;
    });
  } else if (priceRange === 'over1000') {
    filteredProducts = filteredProducts.filter(p => (p.price || p.minPrice || 0) > 1000);
  }
  
  // Filter by breed (for breed-cakes category)
  if (selectedBreed !== 'all' && isBreedCakeCategory) {
    const breedLower = selectedBreed.toLowerCase();
    filteredProducts = filteredProducts.filter(p => {
      const productName = (p.name || '').toLowerCase();
      const productTags = Array.isArray(p.tags) ? p.tags.map(t => (t || '').toLowerCase()) : [];
      return productName.includes(breedLower) || productTags.some(t => t.includes(breedLower));
    });
  }
  
  // Filter by shape (for birthday cakes)
  if (selectedShape !== 'all' && needsShapeFilter) {
    const shapeLower = selectedShape.toLowerCase();
    filteredProducts = filteredProducts.filter(p => {
      const productName = (p.name || '').toLowerCase();
      const productTags = Array.isArray(p.tags) ? p.tags.map(t => (t || '').toLowerCase()) : [];
      return productName.includes(shapeLower) || productTags.some(t => t.includes(shapeLower));
    });
  }
  
  // Filter by search input (local search within loaded products)
  if (searchInput.trim()) {
    const searchLower = searchInput.toLowerCase().trim();
    filteredProducts = filteredProducts.filter(p => {
      const productName = (p.name || '').toLowerCase();
      const productTags = Array.isArray(p.tags) ? p.tags.map(t => (t || '').toLowerCase()).join(' ') : '';
      const productDesc = (p.description || '').toLowerCase();
      return productName.includes(searchLower) || productTags.includes(searchLower) || productDesc.includes(searchLower);
    });
  }

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => (a.price || a.minPrice || 0) - (b.price || b.minPrice || 0));
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.price || b.minPrice || 0) - (a.price || a.minPrice || 0));
  } else if (sortBy === 'rating') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const getCategoryTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    switch (category) {
      case 'cakes': return 'Dog Cakes';
      case 'custom': return 'Breed-Specific Cakes';
      case 'breed-cakes': return 'Breed-Specific Cakes';
      case 'treats': return 'Treats & Snacks';
      case 'desi': return 'Desi Doggy Treats 🪔';
      case 'desi-treats': return 'Desi Doggy Treats 🪔';
      case 'merchandise': return 'Merchandise';
      case 'hampers': return 'Gift Hampers & Party Boxes 🎁';
      case 'meals': return 'Fresh Meals & Pizzas';
      case 'fresh-meals': return 'Fresh Meals';
      case 'frozen': return 'Frozen Treats';
      case 'frozen-treats': return 'Frozen Treats';
      case 'accessories': return 'Accessories & Toys';
      case 'pan-india': return 'Pan India Delivery';
      case 'mini-cakes': return 'Bowto Cakes';
      case 'cat': return 'Cat Treats';
      case 'cat-treats': return 'Cat Treats 🐱';
      case 'pizzas-burgers': return 'Pizzas & Burgers';
      case 'dognuts': return 'Pupcakes & Dognuts';
      case 'nut-butters': return 'Nut Butters';
      case 'autoship': return 'Autoship Products 🔄';
      case 'valentine': return 'Valentine Collection 💕';
      case 'other': return 'More Products';
      default: return 'All Products';
    }
  };

  const getCategoryDescription = () => {
    switch (category) {
      case 'cakes': return 'Freshly baked cakes for birthdays and special celebrations';
      case 'custom': 
      case 'breed-cakes': return 'Custom cakes shaped like your beloved breed';
      case 'treats': return 'Healthy treats for everyday joy and training';
      case 'desi': 
      case 'desi-treats': return 'Traditional Indian sweets made pet-friendly!';
      case 'merchandise': return 'Branded merchandise and gift items';
      case 'hampers': return 'Complete celebration packages with cakes, treats, bandanas, and toys!';
      case 'meals':
      case 'fresh-meals': return 'Nutritious fresh meals for your furry friend';
      case 'frozen':
      case 'frozen-treats': return 'Cool treats for hot days';
      case 'accessories': return 'Bandanas, toys, and celebration gear';
      case 'pan-india': return 'Treats and cakes delivered across India';
      case 'mini-cakes': return 'Bowto celebration cakes for any occasion';
      case 'cat':
      case 'cat-treats': return 'Special treats for our feline friends';
      case 'dognuts': return 'Mini baked treats for dog celebrations - pupcakes and dognuts!';
      case 'nut-butters': return 'Delicious and healthy nut butter treats';
      case 'other': return 'More amazing products for your pets';
      default: return 'Explore our complete range of pet treats and cakes';
    }
  };

  // Get hero content for current category
  const heroContent = CATEGORY_HERO_CONTENT[category] || CATEGORY_HERO_CONTENT.default;
  const heroImage = CATEGORY_HERO_IMAGES[category] || CATEGORY_HERO_IMAGES.default;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <SEOHead page={getSeoPage()} path={location.pathname} />
      
      {/* === HERO SECTION === */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${heroContent.color} text-white`}>
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt={getCategoryTitle()} 
            className="w-full h-full object-cover opacity-25"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${heroContent.color} opacity-90`} />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">{heroContent.badge}</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {heroContent.title}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                {heroContent.highlight}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg">
              {heroContent.subtitle}
            </p>
            
            {/* Quick Stats - Pet-friendly messaging */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <PawPrint className="w-5 h-5 text-pink-300" />
                <span className="text-sm">100% Pet-Friendly</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Heart className="w-5 h-5 text-red-300" />
                <span className="text-sm">Loved by 45,000+ Pets</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="text-sm">Chemical-Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* === CELEBRATE CONCIERGE PICKER === */}
      {/* Show on all Celebrate pillar pages (cakes, treats, hampers, etc.) */}
      {pillar === 'celebrate' && !searchQuery && (
        <CelebrateConcierePicker category={category} />
      )}
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Results Title (only for search) */}
        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Search Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            <p className="text-gray-600 mt-1">Found {filteredProducts.length} products</p>
          </div>
        )}

        {/* Location Detection Banner - Only for cake categories */}
        {isCakeCategory && detectedCity && detectedCity !== 'other' && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3" data-testid="location-detected-banner">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                📍 Detected: {detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1)} - Showing fresh delivery cakes!
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-700 hover:text-green-800"
              onClick={() => { setDetectedCity(null); setDeliveryCity('all'); }}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters:</span>
          </div>
          
          {/* Delivery City Filter - Only for cake categories */}
          {isCakeCategory && (
            <div className="flex items-center gap-2">
              <Select value={deliveryCity} onValueChange={setDeliveryCity} data-testid="delivery-city-filter">
                <SelectTrigger className="w-[180px] border-purple-200 bg-purple-50">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {FRESH_DELIVERY_CITIES.map(city => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!detectedCity && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-purple-600 border-purple-200"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-1" />
                      Detect Location
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under500">Under ₹500</SelectItem>
              <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
              <SelectItem value="over1000">Over ₹1000</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
          
          <p className="ml-auto text-purple-600 text-sm">
            Showing {filteredProducts.length} products
          </p>
        </div>

        {/* Pet Soul Filtering Banner - Show when allergies are being filtered */}
        {activePet && petAllergies.length > 0 && !petAllergies.includes('No') && !petAllergies.includes('None') && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl flex items-center gap-3" data-testid="pet-soul-filter-banner">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-900">
                Filtered for {activePet.name}&apos;s safety
              </p>
              <p className="text-xs text-purple-600">
                Hiding products with: {petAllergies.filter(a => a !== 'No' && a !== 'None' && a !== 'Other').join(', ')}
              </p>
            </div>
            <PawPrint className="w-5 h-5 text-purple-400" />
          </div>
        )}

        {/* ==================== PET PERSONALIZED RECOMMENDATIONS ==================== */}
        {selectedPet && petRecommendations.length > 0 && isCakeCategory && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-white text-xl">
                  🎂
                </div>
                <div>
                  <h3 className="font-bold text-lg text-amber-900">{personalizedMessage}</h3>
                  <p className="text-sm text-amber-700">
                    Based on {selectedPet.name}&apos;s profile • {selectedPet.breed || 'Mixed'} • {selectedPet.age || 'Age unknown'}
                  </p>
                </div>
              </div>
              
              {/* Pet Selector (if multiple pets) */}
              {userPets.length > 1 && (
                <select 
                  value={selectedPet?.id || ''}
                  onChange={(e) => handlePetChange(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm"
                >
                  {userPets.map(pet => (
                    <option key={pet.id} value={pet.id}>🐕 {pet.name}</option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Recommended Products Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {petRecommendations.slice(0, 6).map(product => (
                <div key={product.id} className="flex-shrink-0 w-40">
                  <a href={`/shop/${product.handle || product.id}`} className="block group">
                    <div className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                      <div className="aspect-square bg-gray-100">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate">{product.title}</p>
                        <p className="text-xs text-amber-600 font-bold">₹{product.price || product.minPrice}</p>
                      </div>
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        For {selectedPet.name}
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
            
            {/* Shopping for someone else? */}
            <div className="mt-4 pt-4 border-t border-amber-200 flex items-center justify-between">
              <p className="text-sm text-amber-700">
                <Gift className="w-4 h-4 inline mr-1" />
                Shopping for another dog? 
              </p>
              <div className="flex items-center gap-3">
                <a 
                  href="/shop?pillar=celebrate" 
                  className="text-sm font-medium text-amber-600 hover:text-amber-800 underline"
                >
                  Browse Full Collection →
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPet(null);
                    setPetRecommendations([]);
                    setFilterByAllergies(false);
                  }}
                  className="text-xs border-amber-300 hover:bg-amber-100"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found in this category.</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or browse other categories</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} pillar={pillar} />
              ))}
            </div>
            
            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="text-center mt-12">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8"
                  onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
                  data-testid="load-more-btn"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More ({filteredProducts.length - visibleCount} remaining)
                </Button>
              </div>
            )}
            
            {/* Showing count */}
            <p className="text-center text-gray-500 text-sm mt-4">
              Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} products
            </p>
          </>
        )}
      </div>
      
      {/* Mira Context Panel - Fixed on right side for desktop */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar={pillar} category={category} />
      </div>
      
      {/* Mira Context Panel - Bottom slide-up for mobile */}
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30">
        <MiraContextPanel pillar={pillar} category={category} position="bottom" />
      </div>
    </div>
  );
};

export default ProductListing;
