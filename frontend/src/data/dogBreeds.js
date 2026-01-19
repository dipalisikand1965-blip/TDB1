/**
 * Dog Breeds Database with Common Misspellings
 * Used for autocomplete suggestions
 */

const DOG_BREEDS = [
  // Popular breeds with common misspellings
  { name: "Shih Tzu", aliases: ["shizu", "shitzu", "shihtzu", "shih-tzu", "shitsu", "shihtsu", "shih tsu"] },
  { name: "Labrador Retriever", aliases: ["lab", "labrador", "labradore", "labrodor", "labrodar", "labrador retriver"] },
  { name: "Golden Retriever", aliases: ["golden", "goldenretriever", "golden retriver", "goldun retriever"] },
  { name: "German Shepherd", aliases: ["gsd", "german shepard", "german sheperd", "german sheppard", "alsatian"] },
  { name: "Beagle", aliases: ["beagel", "beagl", "begle"] },
  { name: "Poodle", aliases: ["puddle", "poodl", "poodel"] },
  { name: "Bulldog", aliases: ["bull dog", "buldog", "bulldog english"] },
  { name: "French Bulldog", aliases: ["frenchie", "french buldog", "french bull dog", "frenchbulldog"] },
  { name: "Rottweiler", aliases: ["rotweiler", "rottweiller", "rottwiler", "rotti", "rotty", "rottie"] },
  { name: "Yorkshire Terrier", aliases: ["yorkie", "yorkshire", "yorky", "yorkshir terrier"] },
  { name: "Boxer", aliases: ["boxor", "boxser"] },
  { name: "Dachshund", aliases: ["doxie", "daschund", "dachsund", "dashund", "sausage dog", "wiener dog", "doxen"] },
  { name: "Siberian Husky", aliases: ["husky", "huskie", "siberian huskie", "huskee"] },
  { name: "Doberman Pinscher", aliases: ["doberman", "dobermann", "dobbie", "dobie", "dobermen"] },
  { name: "Great Dane", aliases: ["greatdane", "dane", "great dan"] },
  { name: "Miniature Schnauzer", aliases: ["schnauzer", "mini schnauzer", "schnauser", "schnowzer", "snauzer"] },
  { name: "Shiba Inu", aliases: ["shiba", "shibainu", "sheba inu", "shibe", "doge"] },
  { name: "Cavalier King Charles Spaniel", aliases: ["cavalier", "king charles", "ckcs", "cavelier", "cavaleer"] },
  { name: "Pomeranian", aliases: ["pom", "pomerian", "pomeranean", "pomranian", "pomeranion"] },
  { name: "Boston Terrier", aliases: ["boston", "boston terror", "bostonterrier"] },
  { name: "Pembroke Welsh Corgi", aliases: ["corgi", "corgii", "corgy", "welsh corgi", "pembroke corgi"] },
  { name: "Australian Shepherd", aliases: ["aussie", "australian shepard", "australian sheperd", "aussie shepherd"] },
  { name: "Cocker Spaniel", aliases: ["cocker", "cockerspaniel", "coker spaniel", "american cocker"] },
  { name: "English Springer Spaniel", aliases: ["springer", "springer spaniel", "english springer"] },
  { name: "Pug", aliases: ["pugg", "puge", "pugs"] },
  { name: "Maltese", aliases: ["maltees", "maltse", "malteese", "maltize"] },
  { name: "Chihuahua", aliases: ["chiuahua", "chiuaua", "chiwawa", "chiwahua", "chiwawah", "chihuhua"] },
  { name: "Border Collie", aliases: ["bordercollie", "border colllie", "collie", "border colie"] },
  { name: "Bernese Mountain Dog", aliases: ["bernese", "berner", "berneese mountain", "burnese mountain dog"] },
  { name: "Samoyed", aliases: ["sammy", "sammie", "samoid", "samoied", "samoyede"] },
  { name: "Akita", aliases: ["akita inu", "japanese akita", "american akita"] },
  { name: "Lhasa Apso", aliases: ["lhasa", "lasa apso", "lahsa apso", "lhasaapso"] },
  { name: "Bichon Frise", aliases: ["bichon", "bishon frise", "bishon", "bichon frisee"] },
  { name: "English Cocker Spaniel", aliases: ["english cocker", "cocker english"] },
  { name: "Weimaraner", aliases: ["weimeraner", "wiemaraner", "weimareiner", "grey ghost"] },
  { name: "Belgian Malinois", aliases: ["malinois", "malinwa", "belgian shepard", "mali"] },
  { name: "Basset Hound", aliases: ["basset", "bassett hound", "baset hound"] },
  { name: "Vizsla", aliases: ["viszla", "visla", "hungarian vizsla"] },
  { name: "English Mastiff", aliases: ["mastiff", "mastif", "english mastif"] },
  { name: "Bullmastiff", aliases: ["bull mastiff", "bullmastif"] },
  { name: "Cane Corso", aliases: ["corso", "cane korso", "italian mastiff"] },
  { name: "Alaskan Malamute", aliases: ["malamute", "malamut", "alaskan malamut"] },
  { name: "Bloodhound", aliases: ["blood hound", "bloodhoud"] },
  { name: "Papillon", aliases: ["papillion", "papilon", "pappilon"] },
  { name: "Shetland Sheepdog", aliases: ["sheltie", "shelty", "shetland"] },
  { name: "Brittany", aliases: ["brittany spaniel", "britanny"] },
  { name: "West Highland White Terrier", aliases: ["westie", "west highland", "westy"] },
  { name: "Irish Setter", aliases: ["irish seter", "red setter"] },
  { name: "Havanese", aliases: ["havanees", "havaneese", "havnese"] },
  { name: "Scottish Terrier", aliases: ["scottie", "scotty", "scottish terror"] },
  { name: "Saint Bernard", aliases: ["st bernard", "st. bernard", "saint bernhard", "saintt bernard"] },
  { name: "Newfoundland", aliases: ["newfi", "newfie", "newfoundlan"] },
  { name: "Rhodesian Ridgeback", aliases: ["ridgeback", "rhodesian", "rhodesian ridge back"] },
  { name: "Airedale Terrier", aliases: ["airedale", "airdale terrier"] },
  { name: "Portuguese Water Dog", aliases: ["portie", "pwd", "portugese water dog"] },
  { name: "Collie", aliases: ["colllie", "rough collie", "colly"] },
  { name: "Dalmatian", aliases: ["dalmation", "dalmatien", "dalmation dog", "dalmetian"] },
  { name: "Bull Terrier", aliases: ["bullterrier", "bull terror", "english bull terrier"] },
  { name: "Whippet", aliases: ["whipet", "whippett", "wippit"] },
  { name: "Chinese Shar-Pei", aliases: ["shar pei", "sharpei", "shar-pei", "sharpay"] },
  { name: "Soft Coated Wheaten Terrier", aliases: ["wheaten", "wheaten terrier", "wheaton terrier"] },
  { name: "Australian Cattle Dog", aliases: ["cattle dog", "heeler", "blue heeler", "red heeler"] },
  { name: "American Staffordshire Terrier", aliases: ["amstaff", "am staff", "staffie", "staffy"] },
  { name: "Staffordshire Bull Terrier", aliases: ["stafford", "staffie", "staffy", "staff bull"] },
  { name: "Toy Poodle", aliases: ["toy puddle", "toypoodle"] },
  { name: "Miniature Poodle", aliases: ["mini poodle", "minipoodle"] },
  { name: "Standard Poodle", aliases: ["std poodle", "standardpoodle"] },
  { name: "Italian Greyhound", aliases: ["iggy", "italian grey hound"] },
  { name: "Greyhound", aliases: ["grey hound", "grayhound"] },
  { name: "Jack Russell Terrier", aliases: ["jack russell", "jrt", "jackrussell", "jack russel"] },
  { name: "Rat Terrier", aliases: ["ratty", "ratterrier"] },
  { name: "Miniature Pinscher", aliases: ["min pin", "minpin", "miniature pincher"] },
  { name: "Brussels Griffon", aliases: ["griff", "griffon", "brussel griffon"] },
  { name: "American Bulldog", aliases: ["american buldog", "am bulldog"] },
  { name: "English Bulldog", aliases: ["english buldog", "british bulldog"] },
  { name: "Chow Chow", aliases: ["chow", "chowchow"] },
  { name: "Great Pyrenees", aliases: ["pyr", "pyrenees", "great pyr"] },
  { name: "Giant Schnauzer", aliases: ["giant schnauser", "giantschnauzer"] },
  { name: "Afghan Hound", aliases: ["afghan", "afgahn hound"] },
  { name: "Irish Wolfhound", aliases: ["wolfhound", "irish wolf hound"] },
  { name: "Scottish Deerhound", aliases: ["deerhound", "deer hound"] },
  { name: "Keeshond", aliases: ["keeshound", "keeshon"] },
  { name: "Norwegian Elkhound", aliases: ["elkhound", "elk hound"] },
  { name: "Old English Sheepdog", aliases: ["oes", "old english", "bobtail"] },
  { name: "Bouvier des Flandres", aliases: ["bouvier", "bovier"] },
  { name: "Goldendoodle", aliases: ["golden doodle", "goldendoodl", "groodle"] },
  { name: "Labradoodle", aliases: ["labradoodl", "labra doodle"] },
  { name: "Cockapoo", aliases: ["cockerpoo", "cocka poo", "cock-a-poo"] },
  { name: "Cavapoo", aliases: ["cavoodle", "cavipoo"] },
  { name: "Maltipoo", aliases: ["malti poo", "maltepoo"] },
  { name: "Pomsky", aliases: ["pom husky", "pomski"] },
  { name: "Puggle", aliases: ["pugle", "pug beagle"] },
  { name: "Indie", aliases: ["indian dog", "desi dog", "street dog", "indian pariah", "pariah dog", "indy"] },
  { name: "Mixed Breed", aliases: ["mix", "mutt", "mixed", "crossbreed", "cross breed", "mix breed"] },
];

/**
 * Search breeds by name or alias
 * @param {string} query - Search query
 * @param {number} limit - Max results to return
 * @returns {Array} - Matching breeds
 */
export function searchBreeds(query, limit = 8) {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const results = [];
  
  for (const breed of DOG_BREEDS) {
    // Check main name
    const nameMatch = breed.name.toLowerCase().includes(searchTerm);
    const startsWithName = breed.name.toLowerCase().startsWith(searchTerm);
    
    // Check aliases
    const aliasMatch = breed.aliases.some(alias => 
      alias.toLowerCase().includes(searchTerm)
    );
    const startsWithAlias = breed.aliases.some(alias =>
      alias.toLowerCase().startsWith(searchTerm)
    );
    
    if (nameMatch || aliasMatch) {
      // Calculate relevance score
      let score = 0;
      if (startsWithName) score += 100;
      else if (nameMatch) score += 50;
      if (startsWithAlias) score += 75;
      else if (aliasMatch) score += 25;
      
      // Exact match bonus
      if (breed.name.toLowerCase() === searchTerm) score += 200;
      if (breed.aliases.some(a => a.toLowerCase() === searchTerm)) score += 150;
      
      results.push({ ...breed, score });
    }
  }
  
  // Sort by score and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ name }) => name);
}

export default DOG_BREEDS;
