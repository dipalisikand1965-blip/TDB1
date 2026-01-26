/**
 * Breed Health Intelligence
 * Comprehensive breed-specific health information, care tips, and recommendations
 * Used across Pet Soul, Mira AI, and pet profiles
 */

// Breed health data with common concerns, care tips, and life stages
export const BREED_HEALTH_DATA = {
  // Small Breeds
  'shih tzu': {
    category: 'small',
    lifeExpectancy: '10-18 years',
    weight: '4-7 kg',
    temperament: ['Affectionate', 'Playful', 'Outgoing', 'Loyal'],
    healthConcerns: [
      { name: 'Brachycephalic Syndrome', severity: 'high', description: 'Breathing difficulties due to flat face structure' },
      { name: 'Eye Problems', severity: 'medium', description: 'Prone to dry eye, cataracts, and corneal ulcers' },
      { name: 'Hip Dysplasia', severity: 'medium', description: 'Joint issues that can cause mobility problems' },
      { name: 'Dental Issues', severity: 'medium', description: 'Overcrowded teeth prone to decay' },
      { name: 'Allergies', severity: 'low', description: 'Skin allergies and food sensitivities' }
    ],
    careTips: [
      { category: 'grooming', tip: 'Daily brushing required to prevent matting', frequency: 'daily' },
      { category: 'exercise', tip: 'Short walks twice daily - avoid hot weather due to breathing', frequency: 'daily' },
      { category: 'dental', tip: 'Brush teeth 3x weekly, annual dental cleaning recommended', frequency: 'weekly' },
      { category: 'eyes', tip: 'Clean eye area daily to prevent tear staining', frequency: 'daily' },
      { category: 'nutrition', tip: 'Small kibble size, avoid overfeeding (prone to obesity)', frequency: 'always' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Leptospirosis'],
    dietaryNeeds: ['High-quality protein', 'Omega fatty acids for coat', 'Joint supplements after age 7'],
    exerciseLevel: 'low',
    groomingLevel: 'high',
    icon: '🐕'
  },
  
  'golden retriever': {
    category: 'large',
    lifeExpectancy: '10-12 years',
    weight: '25-34 kg',
    temperament: ['Friendly', 'Intelligent', 'Devoted', 'Active'],
    healthConcerns: [
      { name: 'Hip Dysplasia', severity: 'high', description: 'Common genetic condition affecting hip joints' },
      { name: 'Cancer', severity: 'high', description: 'Higher cancer rates than many breeds, regular screening important' },
      { name: 'Heart Disease', severity: 'medium', description: 'Prone to subvalvular aortic stenosis' },
      { name: 'Elbow Dysplasia', severity: 'medium', description: 'Joint malformation causing lameness' },
      { name: 'Skin Allergies', severity: 'medium', description: 'Hot spots and allergic dermatitis common' }
    ],
    careTips: [
      { category: 'exercise', tip: 'Needs 1-2 hours of exercise daily - loves swimming!', frequency: 'daily' },
      { category: 'grooming', tip: 'Brush 2-3 times weekly, more during shedding season', frequency: 'weekly' },
      { category: 'health', tip: 'Annual hip and elbow screening recommended', frequency: 'yearly' },
      { category: 'nutrition', tip: 'Watch weight carefully - prone to obesity', frequency: 'always' },
      { category: 'mental', tip: 'Needs mental stimulation - puzzle toys and training', frequency: 'daily' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Lyme Disease', 'Canine Influenza'],
    dietaryNeeds: ['Joint support supplements', 'Glucosamine', 'Fish oil for coat', 'Controlled portions'],
    exerciseLevel: 'high',
    groomingLevel: 'medium',
    icon: '🦮'
  },
  
  'labrador retriever': {
    category: 'large',
    lifeExpectancy: '10-14 years',
    weight: '25-36 kg',
    temperament: ['Friendly', 'Active', 'Outgoing', 'Gentle'],
    healthConcerns: [
      { name: 'Obesity', severity: 'high', description: 'Extremely prone to weight gain - strict diet needed' },
      { name: 'Hip Dysplasia', severity: 'high', description: 'Common genetic joint condition' },
      { name: 'Exercise-Induced Collapse', severity: 'medium', description: 'Genetic condition causing collapse during intense exercise' },
      { name: 'Ear Infections', severity: 'medium', description: 'Floppy ears trap moisture' },
      { name: 'Bloat', severity: 'medium', description: 'Life-threatening stomach condition' }
    ],
    careTips: [
      { category: 'exercise', tip: 'Minimum 1 hour vigorous exercise daily', frequency: 'daily' },
      { category: 'nutrition', tip: 'Measure food strictly - Labs will overeat', frequency: 'always' },
      { category: 'ears', tip: 'Clean and dry ears weekly, especially after swimming', frequency: 'weekly' },
      { category: 'training', tip: 'Highly trainable - needs mental challenges', frequency: 'daily' },
      { category: 'health', tip: 'Avoid exercise right after meals (bloat prevention)', frequency: 'always' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Leptospirosis'],
    dietaryNeeds: ['Portion-controlled feeding', 'Weight management formula if needed', 'Joint supplements'],
    exerciseLevel: 'very-high',
    groomingLevel: 'medium',
    icon: '🐕‍🦺'
  },
  
  'german shepherd': {
    category: 'large',
    lifeExpectancy: '9-13 years',
    weight: '22-40 kg',
    temperament: ['Loyal', 'Confident', 'Courageous', 'Smart'],
    healthConcerns: [
      { name: 'Hip Dysplasia', severity: 'high', description: 'Very common in the breed - screening essential' },
      { name: 'Degenerative Myelopathy', severity: 'high', description: 'Progressive spinal cord disease' },
      { name: 'Bloat (GDV)', severity: 'high', description: 'Life-threatening stomach condition' },
      { name: 'Elbow Dysplasia', severity: 'medium', description: 'Joint malformation' },
      { name: 'Allergies', severity: 'medium', description: 'Skin and food allergies common' }
    ],
    careTips: [
      { category: 'exercise', tip: 'Needs 2+ hours of physical and mental exercise daily', frequency: 'daily' },
      { category: 'training', tip: 'Thrives with structured training and jobs to do', frequency: 'daily' },
      { category: 'grooming', tip: 'Heavy shedding - brush daily during shed season', frequency: 'daily' },
      { category: 'health', tip: 'Hip/elbow screening before age 2, regular DM testing', frequency: 'yearly' },
      { category: 'nutrition', tip: 'Multiple small meals to prevent bloat', frequency: 'always' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Leptospirosis'],
    dietaryNeeds: ['High-quality protein', 'Joint supplements early', 'Probiotics for digestion'],
    exerciseLevel: 'very-high',
    groomingLevel: 'high',
    icon: '🐕'
  },
  
  'pomeranian': {
    category: 'small',
    lifeExpectancy: '12-16 years',
    weight: '1.5-3 kg',
    temperament: ['Lively', 'Playful', 'Friendly', 'Alert'],
    healthConcerns: [
      { name: 'Luxating Patella', severity: 'high', description: 'Kneecap dislocation - common in toy breeds' },
      { name: 'Dental Disease', severity: 'high', description: 'Small mouth prone to overcrowding and decay' },
      { name: 'Tracheal Collapse', severity: 'medium', description: 'Weakening of windpipe cartilage' },
      { name: 'Alopecia X', severity: 'medium', description: 'Hair loss condition unique to breed' },
      { name: 'Hypoglycemia', severity: 'medium', description: 'Low blood sugar - needs regular meals' }
    ],
    careTips: [
      { category: 'grooming', tip: 'Brush 2-3 times weekly to prevent matting', frequency: 'weekly' },
      { category: 'dental', tip: 'Daily teeth brushing ideal, dental treats help', frequency: 'daily' },
      { category: 'exercise', tip: 'Short walks and indoor play - don\'t over-exercise', frequency: 'daily' },
      { category: 'nutrition', tip: 'Small frequent meals to prevent hypoglycemia', frequency: 'always' },
      { category: 'handling', tip: 'Use harness instead of collar (trachea protection)', frequency: 'always' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella'],
    dietaryNeeds: ['Small kibble size', 'High-quality protein', 'Multiple small meals'],
    exerciseLevel: 'low',
    groomingLevel: 'high',
    icon: '🐕'
  },
  
  'beagle': {
    category: 'small',
    lifeExpectancy: '12-15 years',
    weight: '9-11 kg',
    temperament: ['Merry', 'Friendly', 'Curious', 'Determined'],
    healthConcerns: [
      { name: 'Obesity', severity: 'high', description: 'Extremely food-motivated, prone to overeating' },
      { name: 'Ear Infections', severity: 'high', description: 'Long floppy ears trap moisture' },
      { name: 'Epilepsy', severity: 'medium', description: 'Idiopathic epilepsy relatively common' },
      { name: 'Hypothyroidism', severity: 'medium', description: 'Underactive thyroid gland' },
      { name: 'Cherry Eye', severity: 'low', description: 'Prolapsed third eyelid gland' }
    ],
    careTips: [
      { category: 'exercise', tip: 'Needs 1+ hour daily - loves scent work and tracking', frequency: 'daily' },
      { category: 'ears', tip: 'Check and clean ears weekly to prevent infections', frequency: 'weekly' },
      { category: 'nutrition', tip: 'Strict portion control - will eat anything', frequency: 'always' },
      { category: 'training', tip: 'Food-motivated but can be stubborn - patience needed', frequency: 'daily' },
      { category: 'safety', tip: 'Secure fencing required - will follow scents', frequency: 'always' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Leptospirosis'],
    dietaryNeeds: ['Measured portions', 'Low-calorie treats', 'Puzzle feeders recommended'],
    exerciseLevel: 'high',
    groomingLevel: 'low',
    icon: '🐕'
  },
  
  'french bulldog': {
    category: 'small',
    lifeExpectancy: '10-12 years',
    weight: '8-14 kg',
    temperament: ['Playful', 'Adaptable', 'Smart', 'Affectionate'],
    healthConcerns: [
      { name: 'Brachycephalic Syndrome', severity: 'high', description: 'Severe breathing difficulties' },
      { name: 'Spinal Issues', severity: 'high', description: 'IVDD and hemivertebrae common' },
      { name: 'Heat Intolerance', severity: 'high', description: 'Cannot regulate temperature well' },
      { name: 'Skin Fold Infections', severity: 'medium', description: 'Face folds need regular cleaning' },
      { name: 'Allergies', severity: 'medium', description: 'Food and environmental allergies' }
    ],
    careTips: [
      { category: 'temperature', tip: 'Keep cool - AC essential, avoid heat over 25°C', frequency: 'always' },
      { category: 'exercise', tip: 'Short walks only - watch for breathing distress', frequency: 'daily' },
      { category: 'grooming', tip: 'Clean face folds daily to prevent infections', frequency: 'daily' },
      { category: 'weight', tip: 'Maintain lean weight - extra weight worsens breathing', frequency: 'always' },
      { category: 'travel', tip: 'Never fly in cargo - high risk of respiratory failure', frequency: 'always' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella'],
    dietaryNeeds: ['Easy-to-digest food', 'Limited ingredient diet if allergic', 'Slow feeder bowl'],
    exerciseLevel: 'low',
    groomingLevel: 'medium',
    icon: '🐕'
  },
  
  'indian pariah': {
    category: 'indian',
    lifeExpectancy: '13-16 years',
    weight: '15-30 kg',
    temperament: ['Alert', 'Intelligent', 'Loyal', 'Independent'],
    healthConcerns: [
      { name: 'Generally Healthy', severity: 'low', description: 'One of the healthiest breeds due to natural selection' },
      { name: 'Tick-Borne Diseases', severity: 'medium', description: 'Ehrlichiosis and tick fever in India' },
      { name: 'Skin Issues', severity: 'low', description: 'Occasional mange in strays' },
      { name: 'Hip Dysplasia', severity: 'low', description: 'Rare but possible' }
    ],
    careTips: [
      { category: 'exercise', tip: 'Highly athletic - needs 1-2 hours daily', frequency: 'daily' },
      { category: 'tick', tip: 'Regular tick prevention essential in India', frequency: 'monthly' },
      { category: 'socialization', tip: 'Early socialization important for confident temperament', frequency: 'always' },
      { category: 'nutrition', tip: 'Adapts well to Indian diet, not picky eaters', frequency: 'always' },
      { category: 'grooming', tip: 'Low maintenance - weekly brushing sufficient', frequency: 'weekly' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Leptospirosis', 'Canine Coronavirus'],
    dietaryNeeds: ['Balanced diet', 'Not prone to allergies', 'Does well on home-cooked food'],
    exerciseLevel: 'high',
    groomingLevel: 'low',
    icon: '🐕'
  },
  
  'siberian husky': {
    category: 'large',
    lifeExpectancy: '12-14 years',
    weight: '16-27 kg',
    temperament: ['Outgoing', 'Mischievous', 'Loyal', 'Independent'],
    healthConcerns: [
      { name: 'Eye Problems', severity: 'high', description: 'Cataracts, corneal dystrophy, PRA' },
      { name: 'Hip Dysplasia', severity: 'medium', description: 'Less common than other large breeds' },
      { name: 'Hypothyroidism', severity: 'medium', description: 'Underactive thyroid' },
      { name: 'Zinc Deficiency', severity: 'medium', description: 'Skin issues from zinc malabsorption' }
    ],
    careTips: [
      { category: 'exercise', tip: 'NEEDS 2+ hours vigorous exercise daily - running essential', frequency: 'daily' },
      { category: 'temperature', tip: 'Keep cool - not suited for hot Indian climate without AC', frequency: 'always' },
      { category: 'grooming', tip: 'Heavy shedding twice yearly - daily brushing needed', frequency: 'daily' },
      { category: 'containment', tip: 'Expert escape artists - secure 6ft+ fencing required', frequency: 'always' },
      { category: 'mental', tip: 'Needs jobs and challenges or will become destructive', frequency: 'daily' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Canine Influenza'],
    dietaryNeeds: ['High-protein diet', 'Zinc supplements if deficient', 'Fish oil for coat'],
    exerciseLevel: 'very-high',
    groomingLevel: 'high',
    icon: '🐺'
  },
  
  'pug': {
    category: 'small',
    lifeExpectancy: '12-15 years',
    weight: '6-8 kg',
    temperament: ['Charming', 'Mischievous', 'Loving', 'Sociable'],
    healthConcerns: [
      { name: 'Brachycephalic Syndrome', severity: 'high', description: 'Breathing problems from flat face' },
      { name: 'Eye Problems', severity: 'high', description: 'Protruding eyes prone to injury and ulcers' },
      { name: 'Obesity', severity: 'high', description: 'Very prone to weight gain' },
      { name: 'Skin Fold Infections', severity: 'medium', description: 'Face wrinkles need cleaning' },
      { name: 'Pug Dog Encephalitis', severity: 'medium', description: 'Breed-specific brain inflammation' }
    ],
    careTips: [
      { category: 'temperature', tip: 'Heat intolerant - keep in AC, avoid hot weather', frequency: 'always' },
      { category: 'grooming', tip: 'Clean face folds daily, weekly brushing', frequency: 'daily' },
      { category: 'eyes', tip: 'Check eyes daily for redness or discharge', frequency: 'daily' },
      { category: 'exercise', tip: 'Short gentle walks - avoid overexertion', frequency: 'daily' },
      { category: 'weight', tip: 'Strict diet control - obesity worsens all health issues', frequency: 'always' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella'],
    dietaryNeeds: ['Low-calorie diet', 'Measured portions', 'Avoid table scraps'],
    exerciseLevel: 'low',
    groomingLevel: 'medium',
    icon: '🐕'
  },
  
  'rottweiler': {
    category: 'large',
    lifeExpectancy: '8-10 years',
    weight: '35-60 kg',
    temperament: ['Loyal', 'Confident', 'Protective', 'Calm'],
    healthConcerns: [
      { name: 'Hip Dysplasia', severity: 'high', description: 'Very common - screening essential' },
      { name: 'Elbow Dysplasia', severity: 'high', description: 'Joint malformation' },
      { name: 'Osteosarcoma', severity: 'high', description: 'Bone cancer more common in breed' },
      { name: 'Heart Disease', severity: 'medium', description: 'Aortic stenosis' },
      { name: 'Bloat', severity: 'medium', description: 'GDV risk' }
    ],
    careTips: [
      { category: 'exercise', tip: '1-2 hours daily but avoid over-exercise as puppies', frequency: 'daily' },
      { category: 'training', tip: 'Early socialization and obedience training essential', frequency: 'daily' },
      { category: 'health', tip: 'Annual hip/elbow X-rays, cardiac screening', frequency: 'yearly' },
      { category: 'nutrition', tip: 'Large breed puppy food for slow growth', frequency: 'always' },
      { category: 'weight', tip: 'Keep lean - extra weight stresses joints', frequency: 'always' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Leptospirosis'],
    dietaryNeeds: ['Large breed formula', 'Joint supplements from age 2', 'Controlled calcium for puppies'],
    exerciseLevel: 'high',
    groomingLevel: 'low',
    icon: '🐕'
  },
  
  'dachshund': {
    category: 'small',
    lifeExpectancy: '12-16 years',
    weight: '5-14 kg',
    temperament: ['Clever', 'Devoted', 'Lively', 'Courageous'],
    healthConcerns: [
      { name: 'IVDD', severity: 'high', description: 'Intervertebral disc disease - very common due to long spine' },
      { name: 'Obesity', severity: 'high', description: 'Weight gain severely increases back problems' },
      { name: 'Dental Disease', severity: 'medium', description: 'Prone to tartar buildup' },
      { name: 'PRA', severity: 'medium', description: 'Progressive retinal atrophy' },
      { name: 'Cushings Disease', severity: 'low', description: 'Hormone disorder' }
    ],
    careTips: [
      { category: 'back', tip: 'NO jumping on/off furniture - use ramps!', frequency: 'always' },
      { category: 'weight', tip: 'Keep very lean - obesity is dangerous for spine', frequency: 'always' },
      { category: 'handling', tip: 'Always support back and hindquarters when lifting', frequency: 'always' },
      { category: 'exercise', tip: 'Moderate walks - avoid stairs when possible', frequency: 'daily' },
      { category: 'dental', tip: 'Regular teeth cleaning essential', frequency: 'weekly' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella'],
    dietaryNeeds: ['Weight management food', 'Joint supplements', 'Glucosamine'],
    exerciseLevel: 'medium',
    groomingLevel: 'low',
    icon: '🌭'
  },
  
  'boxer': {
    category: 'large',
    lifeExpectancy: '10-12 years',
    weight: '25-32 kg',
    temperament: ['Fun-loving', 'Bright', 'Active', 'Loyal'],
    healthConcerns: [
      { name: 'Cancer', severity: 'high', description: 'Very high cancer rates - mast cell tumors, lymphoma' },
      { name: 'Heart Disease', severity: 'high', description: 'Boxer cardiomyopathy (ARVC)' },
      { name: 'Hip Dysplasia', severity: 'medium', description: 'Joint issues' },
      { name: 'Hypothyroidism', severity: 'medium', description: 'Thyroid problems' },
      { name: 'Bloat', severity: 'medium', description: 'Deep-chested breed at risk' }
    ],
    careTips: [
      { category: 'exercise', tip: '1-2 hours daily - loves play and agility', frequency: 'daily' },
      { category: 'health', tip: 'Annual cardiac screening recommended', frequency: 'yearly' },
      { category: 'lumps', tip: 'Check for lumps monthly - early cancer detection vital', frequency: 'monthly' },
      { category: 'temperature', tip: 'Heat sensitive - keep cool in summer', frequency: 'always' },
      { category: 'training', tip: 'Puppy-like energy for years - needs patient training', frequency: 'daily' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Canine Influenza'],
    dietaryNeeds: ['High-quality protein', 'Avoid grain-free (DCM concerns)', 'Antioxidant-rich foods'],
    exerciseLevel: 'high',
    groomingLevel: 'low',
    icon: '🐕'
  },
  
  // Default for unknown breeds
  'unknown': {
    category: 'other',
    lifeExpectancy: '10-15 years',
    weight: 'Varies',
    temperament: ['Individual personality varies'],
    healthConcerns: [
      { name: 'General Wellness', severity: 'low', description: 'Regular checkups recommended' }
    ],
    careTips: [
      { category: 'health', tip: 'Annual vet checkups with vaccinations', frequency: 'yearly' },
      { category: 'nutrition', tip: 'Balanced diet appropriate for size and age', frequency: 'always' },
      { category: 'exercise', tip: 'Regular exercise based on energy level', frequency: 'daily' },
      { category: 'dental', tip: 'Regular dental care important', frequency: 'weekly' },
      { category: 'grooming', tip: 'Grooming based on coat type', frequency: 'weekly' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella'],
    dietaryNeeds: ['Age-appropriate food', 'Fresh water always available'],
    exerciseLevel: 'medium',
    groomingLevel: 'medium',
    icon: '🐕'
  },
  
  'mixed breed': {
    category: 'other',
    lifeExpectancy: '10-15 years',
    weight: 'Varies',
    temperament: ['Unique blend of traits'],
    healthConcerns: [
      { name: 'Hybrid Vigor', severity: 'low', description: 'Often healthier than purebreds due to genetic diversity' },
      { name: 'Varies by Mix', severity: 'medium', description: 'Health depends on parent breeds' }
    ],
    careTips: [
      { category: 'health', tip: 'DNA test can reveal breed mix and health risks', frequency: 'once' },
      { category: 'exercise', tip: 'Observe energy level and adjust activity accordingly', frequency: 'daily' },
      { category: 'nutrition', tip: 'Feed based on adult size prediction', frequency: 'always' },
      { category: 'training', tip: 'Adaptable - respond well to positive reinforcement', frequency: 'daily' }
    ],
    vaccinations: ['Rabies', 'DHPP', 'Bordetella', 'Leptospirosis'],
    dietaryNeeds: ['Quality food matched to size', 'Joint supplements if large mix'],
    exerciseLevel: 'medium',
    groomingLevel: 'medium',
    icon: '🐕'
  }
};

// Severity colors and labels
export const SEVERITY_CONFIG = {
  high: { color: 'bg-red-100 text-red-700 border-red-200', label: 'High Priority', icon: '⚠️' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Monitor', icon: '👀' },
  low: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Low Risk', icon: '✓' }
};

// Exercise level labels
export const EXERCISE_LEVELS = {
  'very-high': { label: 'Very High (2+ hrs/day)', color: 'text-red-600', icon: '🏃' },
  'high': { label: 'High (1-2 hrs/day)', color: 'text-orange-600', icon: '🚶' },
  'medium': { label: 'Moderate (30-60 min/day)', color: 'text-yellow-600', icon: '🐕' },
  'low': { label: 'Low (Short walks)', color: 'text-green-600', icon: '🐾' }
};

// Grooming level labels  
export const GROOMING_LEVELS = {
  'high': { label: 'High Maintenance', color: 'text-purple-600', desc: 'Daily brushing required' },
  'medium': { label: 'Moderate', color: 'text-blue-600', desc: 'Weekly grooming' },
  'low': { label: 'Low Maintenance', color: 'text-green-600', desc: 'Occasional brushing' }
};

/**
 * Get health data for a breed (handles spelling variations)
 */
export function getBreedHealthData(breed) {
  if (!breed) return BREED_HEALTH_DATA['unknown'];
  
  const normalized = breed.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Direct match
  if (BREED_HEALTH_DATA[normalized]) {
    return BREED_HEALTH_DATA[normalized];
  }
  
  // Handle variations
  const variations = {
    'shihtzu': 'shih tzu',
    'shitzu': 'shih tzu',
    'golden': 'golden retriever',
    'lab': 'labrador retriever',
    'labrador': 'labrador retriever',
    'gsd': 'german shepherd',
    'alsatian': 'german shepherd',
    'pom': 'pomeranian',
    'frenchie': 'french bulldog',
    'indie': 'indian pariah',
    'desi': 'indian pariah',
    'husky': 'siberian husky',
    'rottie': 'rottweiler',
    'doxie': 'dachshund',
    'wiener': 'dachshund'
  };
  
  const noSpaces = normalized.replace(/\s/g, '');
  if (variations[noSpaces]) {
    return BREED_HEALTH_DATA[variations[noSpaces]];
  }
  if (variations[normalized]) {
    return BREED_HEALTH_DATA[variations[normalized]];
  }
  
  // Partial match
  for (const [key, data] of Object.entries(BREED_HEALTH_DATA)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return data;
    }
  }
  
  return BREED_HEALTH_DATA['unknown'];
}

/**
 * Get top health concerns for a breed
 */
export function getTopHealthConcerns(breed, limit = 3) {
  const data = getBreedHealthData(breed);
  return data.healthConcerns
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, limit);
}

/**
 * Get care tips by category
 */
export function getCareTipsByCategory(breed, category) {
  const data = getBreedHealthData(breed);
  return data.careTips.filter(tip => tip.category === category);
}

/**
 * Get all care tips sorted by frequency importance
 */
export function getPrioritizedCareTips(breed) {
  const data = getBreedHealthData(breed);
  const frequencyOrder = { always: 0, daily: 1, weekly: 2, monthly: 3, yearly: 4, once: 5 };
  return [...data.careTips].sort((a, b) => frequencyOrder[a.frequency] - frequencyOrder[b.frequency]);
}

/**
 * Calculate breed suitability for Indian climate
 */
export function getClimateSuitability(breed) {
  const data = getBreedHealthData(breed);
  
  // Check for heat intolerance
  const heatSensitive = data.careTips.some(tip => 
    tip.category === 'temperature' || 
    tip.tip.toLowerCase().includes('heat') ||
    tip.tip.toLowerCase().includes('cool')
  );
  
  const hasBrachycephalic = data.healthConcerns.some(c => 
    c.name.toLowerCase().includes('brachycephalic')
  );
  
  if (hasBrachycephalic || (heatSensitive && data.category === 'large')) {
    return { 
      suitable: false, 
      rating: 'Challenging',
      color: 'text-red-600',
      note: 'Requires AC and careful temperature management in Indian climate'
    };
  }
  
  if (data.category === 'indian') {
    return {
      suitable: true,
      rating: 'Excellent',
      color: 'text-green-600', 
      note: 'Naturally adapted to Indian climate'
    };
  }
  
  if (heatSensitive) {
    return {
      suitable: true,
      rating: 'Moderate',
      color: 'text-amber-600',
      note: 'Can adapt with proper care and cooling'
    };
  }
  
  return {
    suitable: true,
    rating: 'Good',
    color: 'text-green-600',
    note: 'Generally adapts well to Indian conditions'
  };
}

export default BREED_HEALTH_DATA;
