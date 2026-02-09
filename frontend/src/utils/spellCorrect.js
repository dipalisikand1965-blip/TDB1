/**
 * Intelligent Spelling Correction for Mira OS
 * Handles common misspellings and typos in pet-related queries
 */

// Common pet-related terms and their misspellings
const SPELLING_CORRECTIONS = {
  // Pets
  'dogg': 'dog',
  'dgo': 'dog',
  'og': 'dog',
  'pupy': 'puppy',
  'pupyy': 'puppy',
  'pupppy': 'puppy',
  'pupp': 'puppy',
  'catt': 'cat',
  'cta': 'cat',
  'kitten': 'kitten',
  'kiten': 'kitten',
  'kittn': 'kitten',
  
  // Actions
  'fid': 'find',
  'fidn': 'find',
  'finf': 'find',
  'serach': 'search',
  'seach': 'search',
  'searh': 'search',
  'lokk': 'look',
  'lok': 'look',
  'loook': 'look',
  'shwo': 'show',
  'hsow': 'show',
  'sohw': 'show',
  'hwo': 'how',
  'whta': 'what',
  'waht': 'what',
  'wht': 'what',
  'wheer': 'where',
  'wher': 'where',
  'wehre': 'where',
  'nedd': 'need',
  'ned': 'need',
  'neeed': 'need',
  'hlep': 'help',
  'hep': 'help',
  'hepl': 'help',
  'wnat': 'want',
  'wnt': 'want',
  'wan': 'want',
  'gett': 'get',
  'gt': 'get',
  'geet': 'get',
  'bookk': 'book',
  'boo': 'book',
  'boook': 'book',
  
  // Places
  'vett': 'vet',
  'vt': 'vet',
  'vetenary': 'veterinary',
  'vetinary': 'veterinary',
  'veternary': 'veterinary',
  'vetrinarian': 'veterinarian',
  'vetranarian': 'veterinarian',
  'hopsital': 'hospital',
  'hosptial': 'hospital',
  'hospitl': 'hospital',
  'clinc': 'clinic',
  'clnic': 'clinic',
  'clinci': 'clinic',
  'prk': 'park',
  'pakr': 'park',
  'aprk': 'park',
  'stor': 'store',
  'sotre': 'store',
  'stroe': 'store',
  'resturant': 'restaurant',
  'restarant': 'restaurant',
  'restraunt': 'restaurant',
  'restuarant': 'restaurant',
  'hotl': 'hotel',
  'hoel': 'hotel',
  'hotle': 'hotel',
  'gromer': 'groomer',
  'grommer': 'groomer',
  'groommer': 'groomer',
  
  // Health
  'vacine': 'vaccine',
  'vaccien': 'vaccine',
  'vacination': 'vaccination',
  'vacinaton': 'vaccination',
  'checkp': 'checkup',
  'chekup': 'checkup',
  'check up': 'checkup',
  'medicne': 'medicine',
  'medicin': 'medicine',
  'medcine': 'medicine',
  'treatmnt': 'treatment',
  'treatement': 'treatment',
  'emergncy': 'emergency',
  'emergancy': 'emergency',
  'emergecny': 'emergency',
  'alergy': 'allergy',
  'alergies': 'allergies',
  'allergie': 'allergy',
  
  // Food
  'fod': 'food',
  'foood': 'food',
  'foof': 'food',
  'tret': 'treat',
  'treet': 'treat',
  'treeat': 'treat',
  'treates': 'treats',
  'trets': 'treats',
  'snaks': 'snacks',
  'snakcs': 'snacks',
  
  // Activities
  'wlak': 'walk',
  'wakl': 'walk',
  'walsk': 'walks',
  'plya': 'play',
  'paly': 'play',
  'palying': 'playing',
  'trian': 'train',
  'trianing': 'training',
  'trainng': 'training',
  'groming': 'grooming',
  'groomnig': 'grooming',
  'grroming': 'grooming',
  'bathing': 'bathing',
  'bathign': 'bathing',
  
  // Breeds
  'labraodr': 'labrador',
  'labredor': 'labrador',
  'labradro': 'labrador',
  'goldan': 'golden',
  'golen': 'golden',
  'retreiver': 'retriever',
  'retriever': 'retriever',
  'retriver': 'retriever',
  'german shepard': 'german shepherd',
  'german sheperd': 'german shepherd',
  'germn': 'german',
  'shpeherd': 'shepherd',
  'bullodg': 'bulldog',
  'buldog': 'bulldog',
  'poodl': 'poodle',
  'poodel': 'poodle',
  'beagl': 'beagle',
  'beaglr': 'beagle',
  'huskie': 'husky',
  'huksy': 'husky',
  'huskey': 'husky',
  
  // Cities (Indian)
  'mumabi': 'mumbai',
  'mubmai': 'mumbai',
  'bombay': 'mumbai',
  'dlehi': 'delhi',
  'dehli': 'delhi',
  'delih': 'delhi',
  'banglore': 'bangalore',
  'bangalor': 'bangalore',
  'bengaluru': 'bangalore',
  'banglaore': 'bangalore',
  'hyderbad': 'hyderabad',
  'hydrabad': 'hyderabad',
  'hydreabad': 'hyderabad',
  'chenai': 'chennai',
  'chennia': 'chennai',
  'madras': 'chennai',
  'kolkatta': 'kolkata',
  'kolkta': 'kolkata',
  'calcutta': 'kolkata',
  'punee': 'pune',
  'puen': 'pune',
  'puna': 'pune',
  'japiur': 'jaipur',
  'jaiour': 'jaipur',
  'goaa': 'goa',
  'kochii': 'kochi',
  'cochin': 'kochi',
  
  // Common words
  'nera': 'near',
  'naer': 'near',
  'ner': 'near',
  'neaby': 'nearby',
  'nearvy': 'nearby',
  'teh': 'the',
  'hte': 'the',
  'adn': 'and',
  'annd': 'and',
  'fo': 'for',
  'fro': 'for',
  'frm': 'from',
  'fom': 'from',
  'wiht': 'with',
  'wtih': 'with',
  'wth': 'with',
  'abut': 'about',
  'abuot': 'about',
  'baout': 'about',
  'ot': 'to',
  'toi': 'to',
  'mye': 'my',
  'mmy': 'my',
  'yor': 'your',
  'yuor': 'your',
  'youe': 'your',
  'cna': 'can',
  'acn': 'can',
  'plase': 'please',
  'pleae': 'please',
  'pls': 'please',
  'plz': 'please',
  'thanku': 'thank you',
  'thnks': 'thanks',
  'thx': 'thanks',
};

// Calculate Levenshtein distance between two strings
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
};

// Find closest match using Levenshtein distance
const findClosestMatch = (word, dictionary, maxDistance = 2) => {
  let bestMatch = null;
  let bestDistance = maxDistance + 1;

  for (const [key, value] of Object.entries(dictionary)) {
    const distance = levenshteinDistance(word.toLowerCase(), key);
    if (distance <= maxDistance && distance < bestDistance) {
      bestMatch = value;
      bestDistance = distance;
    }
  }

  return bestMatch;
};

/**
 * Correct spelling in a text query
 * @param {string} text - Input text with potential misspellings
 * @returns {object} - { corrected: string, corrections: array, hasCorrestions: boolean }
 */
export const correctSpelling = (text) => {
  if (!text || typeof text !== 'string') {
    return { corrected: text || '', corrections: [], hasCorrections: false };
  }

  const words = text.split(/\s+/);
  const corrections = [];
  let correctedWords = [];

  for (const word of words) {
    const lowerWord = word.toLowerCase();
    
    // Check direct match in corrections dictionary
    if (SPELLING_CORRECTIONS[lowerWord]) {
      const corrected = SPELLING_CORRECTIONS[lowerWord];
      corrections.push({ original: word, corrected });
      // Preserve original case if first letter was uppercase
      correctedWords.push(
        word[0] === word[0].toUpperCase() 
          ? corrected.charAt(0).toUpperCase() + corrected.slice(1)
          : corrected
      );
    } 
    // Try fuzzy matching for longer words
    else if (word.length >= 4) {
      const fuzzyMatch = findClosestMatch(word, SPELLING_CORRECTIONS, 2);
      if (fuzzyMatch) {
        corrections.push({ original: word, corrected: fuzzyMatch });
        correctedWords.push(
          word[0] === word[0].toUpperCase()
            ? fuzzyMatch.charAt(0).toUpperCase() + fuzzyMatch.slice(1)
            : fuzzyMatch
        );
      } else {
        correctedWords.push(word);
      }
    } else {
      correctedWords.push(word);
    }
  }

  return {
    corrected: correctedWords.join(' '),
    corrections,
    hasCorrections: corrections.length > 0
  };
};

/**
 * Get spelling suggestions for a word
 * @param {string} word - Word to get suggestions for
 * @returns {string[]} - Array of suggestions
 */
export const getSpellingSuggestions = (word) => {
  if (!word || word.length < 3) return [];
  
  const suggestions = [];
  const lowerWord = word.toLowerCase();
  
  // Check direct corrections
  if (SPELLING_CORRECTIONS[lowerWord]) {
    suggestions.push(SPELLING_CORRECTIONS[lowerWord]);
  }
  
  // Find similar words
  for (const [key, value] of Object.entries(SPELLING_CORRECTIONS)) {
    const distance = levenshteinDistance(lowerWord, key);
    if (distance <= 2 && !suggestions.includes(value)) {
      suggestions.push(value);
    }
    if (suggestions.length >= 3) break;
  }
  
  return suggestions;
};

export default correctSpelling;
