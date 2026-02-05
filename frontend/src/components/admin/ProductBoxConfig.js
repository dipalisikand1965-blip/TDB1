/**
 * Product Box - Configuration Constants
 * All options and constants for the comprehensive product management system
 */

// THE 14 PILLARS
export const ALL_PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂', color: 'pink' },
  { id: 'dine', name: 'Dine', icon: '🍽️', color: 'orange' },
  { id: 'stay', name: 'Stay', icon: '🏨', color: 'blue' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'cyan' },
  { id: 'care', name: 'Care', icon: '💊', color: 'red' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾', color: 'green' },
  { id: 'fit', name: 'Fit', icon: '🏃', color: 'teal' },
  { id: 'learn', name: 'Learn', icon: '🎓', color: 'purple' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄', color: 'gray' },
  { id: 'advisory', name: 'Advisory', icon: '📋', color: 'indigo' },
  { id: 'emergency', name: 'Emergency', icon: '🚨', color: 'red' },
  { id: 'farewell', name: 'Farewell', icon: '🌈', color: 'violet' },
  { id: 'adopt', name: 'Adopt', icon: '🐾', color: 'amber' },
  { id: 'shop', name: 'Shop', icon: '🛒', color: 'emerald' }
];

// ALL 35 BREEDS
export const ALL_BREEDS = [
  'Labrador', 'Golden Retriever', 'Indie', 'German Shepherd', 'Beagle', 'Pug',
  'Shih Tzu', 'Pomeranian', 'Husky', 'Rottweiler', 'Dachshund', 'Cocker Spaniel',
  'French Bulldog', 'Boxer', 'Great Dane', 'Doberman', 'Maltese', 'Yorkshire Terrier',
  'Lhasa Apso', 'Chihuahua', 'Spitz', 'Saint Bernard', 'Shiba Inu', 'Border Collie',
  'Akita', 'Dalmatian', 'Bulldog', 'Poodle', 'Australian Shepherd', 
  'Cavalier King Charles', 'Bernese Mountain Dog', 'Samoyed', 'Corgi', 
  'Jack Russell', 'Weimaraner'
];

// Product Types
export const PRODUCT_TYPES = [
  { id: 'physical', name: 'Physical Product', icon: '📦' },
  { id: 'service', name: 'Service', icon: '🛠️' },
  { id: 'experience', name: 'Experience', icon: '✨' },
  { id: 'bundle', name: 'Bundle', icon: '📦✨' },
  { id: 'reward', name: 'Reward Item', icon: '🎁' },
  { id: 'digital', name: 'Digital Product', icon: '💻' }
];

// Life Stages
export const LIFE_STAGES = [
  { id: 'puppy', name: 'Puppy (0-1 yr)' },
  { id: 'adult', name: 'Adult (1-7 yr)' },
  { id: 'senior', name: 'Senior (7+ yr)' },
  { id: 'all', name: 'All Ages' }
];

// Size Options
export const SIZE_OPTIONS = [
  { id: 'XS', name: 'Extra Small (<5 kg)' },
  { id: 'S', name: 'Small (5-10 kg)' },
  { id: 'M', name: 'Medium (10-25 kg)' },
  { id: 'L', name: 'Large (25-40 kg)' },
  { id: 'XL', name: 'Extra Large (40+ kg)' },
  { id: 'all', name: 'All Sizes' }
];

// Energy Levels
export const ENERGY_LEVELS = [
  { id: 'low', name: 'Low Energy' },
  { id: 'medium', name: 'Medium Energy' },
  { id: 'high', name: 'High Energy' },
  { id: 'all', name: 'All Energy Levels' }
];

// Chew Strength
export const CHEW_STRENGTHS = [
  { id: 'gentle', name: 'Gentle Chewer' },
  { id: 'moderate', name: 'Moderate Chewer' },
  { id: 'power_chewer', name: 'Power Chewer' },
  { id: 'indestructible', name: 'Indestructible' }
];

// Play Types
export const PLAY_TYPES = [
  { id: 'fetch', name: 'Fetch' },
  { id: 'tug', name: 'Tug' },
  { id: 'chew', name: 'Chew' },
  { id: 'puzzle', name: 'Puzzle' },
  { id: 'comfort', name: 'Comfort/Cuddle' },
  { id: 'training', name: 'Training' },
  { id: 'water', name: 'Water Play' },
  { id: 'interactive', name: 'Interactive' }
];

// Coat Types
export const COAT_TYPES = [
  { id: 'short', name: 'Short Coat' },
  { id: 'medium', name: 'Medium Coat' },
  { id: 'long', name: 'Long Coat' },
  { id: 'double_coat', name: 'Double Coat' },
  { id: 'curly', name: 'Curly/Wire' },
  { id: 'hairless', name: 'Hairless' }
];

// Common Allergens/Avoids
export const COMMON_AVOIDS = [
  { id: 'chicken', name: 'Chicken' },
  { id: 'beef', name: 'Beef' },
  { id: 'dairy', name: 'Dairy' },
  { id: 'gluten', name: 'Gluten' },
  { id: 'fish', name: 'Fish' },
  { id: 'eggs', name: 'Eggs' },
  { id: 'soy', name: 'Soy' },
  { id: 'corn', name: 'Corn' },
  { id: 'wheat', name: 'Wheat' },
  { id: 'pork', name: 'Pork' },
  { id: 'artificial_dyes', name: 'Artificial Dyes' },
  { id: 'preservatives', name: 'Preservatives' }
];

// Material Safety Flags
export const MATERIAL_SAFETY_FLAGS = [
  { id: 'non_toxic', name: 'Non-Toxic' },
  { id: 'bpa_free', name: 'BPA-Free' },
  { id: 'food_grade', name: 'Food Grade' },
  { id: 'organic', name: 'Organic' },
  { id: 'eco_friendly', name: 'Eco-Friendly' },
  { id: 'hypoallergenic', name: 'Hypoallergenic' },
  { id: 'latex_free', name: 'Latex-Free' },
  { id: 'phthalate_free', name: 'Phthalate-Free' }
];

// Occasions
export const OCCASIONS = [
  { id: 'birthday', name: 'Birthday', icon: '🎂' },
  { id: 'gotcha_day', name: 'Gotcha Day', icon: '🏠' },
  { id: 'new_puppy', name: 'New Puppy', icon: '🐶' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'recovery', name: 'Recovery', icon: '💊' },
  { id: 'monsoon', name: 'Monsoon', icon: '🌧️' },
  { id: 'winter', name: 'Winter', icon: '❄️' },
  { id: 'summer', name: 'Summer', icon: '☀️' },
  { id: 'first_groom', name: 'First Groom', icon: '✂️' },
  { id: 'training_start', name: 'Training Start', icon: '🎓' },
  { id: 'senior_comfort', name: 'Senior Comfort', icon: '🛋️' },
  { id: 'party', name: 'Party', icon: '🎉' },
  { id: 'holiday', name: 'Holiday', icon: '🎄' },
  { id: 'valentine', name: "Valentine's", icon: '❤️' },
  { id: 'diwali', name: 'Diwali', icon: '🪔' }
];

// Use Case Tags
export const USE_CASE_TAGS = [
  { id: 'giftable', name: 'Giftable', icon: '🎁' },
  { id: 'subscription_friendly', name: 'Subscription Friendly', icon: '🔄' },
  { id: 'travel_friendly', name: 'Travel Friendly', icon: '✈️' },
  { id: 'indoor', name: 'Indoor', icon: '🏠' },
  { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
  { id: 'quick_fix', name: 'Quick Fix', icon: '⚡' },
  { id: 'routine_essential', name: 'Routine Essential', icon: '📅' },
  { id: 'impulse_buy', name: 'Impulse Buy', icon: '💫' },
  { id: 'premium_gift', name: 'Premium Gift', icon: '💎' }
];

// Quality Tiers
export const QUALITY_TIERS = [
  { id: 'standard', name: 'Standard', color: 'gray' },
  { id: 'premium', name: 'Premium', color: 'blue' },
  { id: 'veterinary', name: 'Veterinary Grade', color: 'green' },
  { id: 'handcrafted', name: 'Handcrafted', color: 'purple' },
  { id: 'artisan', name: 'Artisan', color: 'amber' },
  { id: 'luxury', name: 'Luxury', color: 'gold' }
];

// Inventory Status
export const INVENTORY_STATUS = [
  { id: 'in_stock', name: 'In Stock', color: 'green' },
  { id: 'low_stock', name: 'Low Stock', color: 'amber' },
  { id: 'out_of_stock', name: 'Out of Stock', color: 'red' },
  { id: 'preorder', name: 'Pre-order', color: 'blue' },
  { id: 'discontinued', name: 'Discontinued', color: 'gray' }
];

// Delivery Types
export const DELIVERY_TYPES = [
  { id: 'ship', name: 'Standard Shipping' },
  { id: 'same_day', name: 'Same Day Delivery' },
  { id: 'local_partner', name: 'Local Partner' },
  { id: 'pickup_only', name: 'Pickup Only' },
  { id: 'digital', name: 'Digital Delivery' }
];

// Approval Status
export const APPROVAL_STATUS = [
  { id: 'draft', name: 'Draft', color: 'gray', icon: '📝' },
  { id: 'pending_review', name: 'Pending Review', color: 'amber', icon: '⏳' },
  { id: 'approved', name: 'Approved', color: 'blue', icon: '✓' },
  { id: 'live', name: 'Live', color: 'green', icon: '🟢' },
  { id: 'paused', name: 'Paused', color: 'orange', icon: '⏸️' },
  { id: 'archived', name: 'Archived', color: 'slate', icon: '📦' }
];

// Cities
export const CITIES = [
  { id: 'bangalore', name: 'Bangalore' },
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'delhi', name: 'Delhi NCR' },
  { id: 'chennai', name: 'Chennai' },
  { id: 'hyderabad', name: 'Hyderabad' },
  { id: 'pune', name: 'Pune' },
  { id: 'kolkata', name: 'Kolkata' },
  { id: 'pan_india', name: 'Pan India (Shippable)' }
];

// Popular Dog Breeds
export const DOG_BREEDS = [
  'Labrador', 'Golden Retriever', 'German Shepherd', 'Indie/Indian Pariah',
  'Beagle', 'Pug', 'Shih Tzu', 'Pomeranian', 'Husky', 'Rottweiler',
  'Doberman', 'Boxer', 'Cocker Spaniel', 'Dachshund', 'Chihuahua',
  'Bulldog', 'French Bulldog', 'Great Dane', 'Border Collie', 'Dalmatian',
  'Lhasa Apso', 'Maltese', 'Yorkshire Terrier', 'Pit Bull', 'Saint Bernard',
  'Samoyed', 'Akita', 'Bernese Mountain Dog', 'Cavalier King Charles'
];

// Main Categories
export const MAIN_CATEGORIES = [
  { id: 'cakes', name: 'Cakes', pillar: 'celebrate' },
  { id: 'breed-cakes', name: 'Breed Cakes', pillar: 'celebrate' },
  { id: 'pupcakes', name: 'Pupcakes', pillar: 'celebrate' },
  { id: 'treats', name: 'Treats', pillar: 'shop' },
  { id: 'toys', name: 'Toys', pillar: 'shop' },
  { id: 'accessories', name: 'Accessories', pillar: 'shop' },
  { id: 'apparel', name: 'Apparel', pillar: 'shop' },
  { id: 'grooming', name: 'Grooming', pillar: 'care' },
  { id: 'food', name: 'Food', pillar: 'dine' },
  { id: 'supplements', name: 'Supplements', pillar: 'fit' },
  { id: 'training', name: 'Training', pillar: 'learn' },
  { id: 'travel-gear', name: 'Travel Gear', pillar: 'travel' },
  { id: 'beds', name: 'Beds', pillar: 'stay' },
  { id: 'bowls', name: 'Bowls', pillar: 'dine' },
  { id: 'healthcare', name: 'Healthcare', pillar: 'care' },
  { id: 'hampers', name: 'Gift Hampers', pillar: 'celebrate' }
];

// Default new product template
export const DEFAULT_PRODUCT = {
  // Basics
  basics: {
    id: null,
    sku: '',
    barcode: '',
    name: '',
    display_name: '',
    short_description: '',
    long_description: '',
    brand: '',
    vendor: '',
    manufacturer: '',
    country_of_origin: 'India',
    shopify_id: '',
    external_source: 'manual',
    product_type: 'physical',
    is_service: false,
    is_bundle: false,
    is_bakery_product: false
  },
  
  // Suitability
  suitability: {
    pet_filters: {
      species: ['dog'],
      life_stages: ['all'],
      size_options: ['all'],
      weight_range_min_kg: null,
      weight_range_max_kg: null,
      breed_applicability: 'all',
      applicable_breeds: [],
      excluded_breeds: []
    },
    behavior: {
      energy_level_match: ['all'],
      chew_strength: null,
      play_types: [],
      indoor_suitable: true,
      outdoor_suitable: true,
      water_safe: false
    },
    physical_traits: {
      coat_type_match: [],
      brachycephalic_friendly: true,
      senior_friendly: true,
      puppy_safe: true,
      easy_grip: false,
      low_impact: false,
      soft_texture: false
    },
    safety: {
      allergy_aware: false,
      common_avoids: [],
      material_safety_flags: [],
      is_grain_free: false,
      is_single_protein: false,
      is_vegetarian: false,
      is_human_grade: false,
      ingredients: [],
      main_protein: '',
      supervision_required: false,
      safety_notes: ''
    }
  },
  
  // Pillars & Occasions
  pillars_occasions: {
    pillar: {
      primary_pillar: 'shop',
      secondary_pillars: [],
      is_cross_pillar: false
    },
    occasion: {
      occasions: [],
      seasonality: [],
      is_birthday_relevant: false,
      is_gotcha_day_relevant: false,
      is_holiday_special: false
    },
    use_case: {
      use_case_tags: [],
      is_giftable: false,
      gift_wrap_available: false,
      subscription_friendly: false,
      autoship_eligible: false,
      travel_friendly: false,
      tsa_approved: false
    }
  },
  
  // Commerce & Ops
  commerce_ops: {
    category: '',
    subcategory: '',
    taxonomy_path: '',
    quality_tier: 'standard',
    approval_status: 'draft',
    pricing: {
      mrp: 0,
      selling_price: 0,
      cost_price: null,
      margin_percent: null,
      margin_band: 'unknown',
      compare_at_price: null,
      discount_percent: null,
      gst_applicable: true,
      gst_rate: 18,
      hsn_code: '',
      price_includes_gst: false,
      currency: 'INR'
    },
    inventory: {
      inventory_status: 'in_stock',
      track_inventory: false,
      stock_quantity: null,
      low_stock_threshold: 5,
      allow_backorder: false,
      is_perishable: false,
      shelf_life_days: null
    },
    fulfillment: {
      delivery_type: 'ship',
      requires_shipping: true,
      is_pan_india: false,
      available_cities: [],
      cold_chain_required: false,
      fragile: false,
      temperature_sensitive: false,
      returnable: true,
      return_window_days: 7
    },
    tags: [],
    internal_tags: []
  },
  
  // Media
  media: {
    primary_image: '',
    primary_image_alt: '',
    images: [],
    thumbnail: '',
    video_url: '',
    image_count: 0,
    image_completeness: 'incomplete'
  },
  
  // Mira & AI
  mira_ai: {
    mira: {
      mira_recommendable: true,
      can_reference: true,
      can_suggest_proactively: false,
      handled_by_mira: false,
      requires_concierge: false,
      suggestion_contexts: [],
      exclusion_reasons: [],
      knowledge_confidence: 'high',
      upsell_items: [],
      cross_sell_items: []
    },
    ai_enrichment: {
      mira_hint: '',
      mira_hint_generated_at: null,
      breed_metadata: null,
      intelligent_tags: [],
      search_keywords: []
    }
  },
  
  // Variants
  has_variants: false,
  options: [],
  variants: [],
  
  // Paw Rewards
  paw_rewards: {
    points_per_rupee: 1,
    bonus_points: 0,
    is_redeemable: false,
    points_required: null,
    is_reward_only: false
  }
};
