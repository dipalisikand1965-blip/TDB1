import React from 'react';
import { Card } from './ui/card';
import { ChevronRight } from 'lucide-react';

/**
 * PillarTopicsGrid - Reusable topic cards component for any pillar
 * Similar to Learn page's topic grid but configurable for any pillar
 */
const PillarTopicsGrid = ({ 
  pillar,
  topics = [], 
  onTopicClick,
  columns = 4,
  className = ''
}) => {
  if (!topics || topics.length === 0) return null;

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <section className={`py-8 px-4 bg-white ${className}`} data-testid={`${pillar}-topics-grid`}>
      <div className="max-w-5xl mx-auto">
        <div className={`grid ${gridCols[columns] || gridCols[4]} gap-4`}>
          {topics.map((topic) => (
            <Card
              key={topic.slug || topic.id}
              className="p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
              onClick={() => onTopicClick?.(topic)}
              data-testid={`topic-${topic.slug || topic.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                  {topic.title || topic.name}
                </h3>
                {topic.image && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ml-2">
                    <img 
                      src={topic.image} 
                      alt={topic.title || topic.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {topic.description || topic.desc}
              </p>
              <button className="flex items-center gap-1 text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                Explore <ChevronRight className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Default topics for each pillar (can be overridden by CMS)
export const DEFAULT_PILLAR_TOPICS = {
  stay: [
    { id: 'boarding', slug: 'boarding', title: 'Pet Boarding', description: 'Safe overnight stays for your pet', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/223dae71d548b1c78aa3beb69557fabde32ed86192d64c0c6a246a7b67ac6776.png' },
    { id: 'daycare', slug: 'daycare', title: 'Pet Daycare', description: 'Fun and socialization while you work', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/560f7256acace0a73e3ed3a1b8d0a8f8c9d8d665dfab6b884e76f4012f8bf650.png' },
    { id: 'hotels', slug: 'hotels', title: 'Pet-Friendly Hotels', description: 'Travel stays that welcome pets', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/f58c26edc49f7e458711f3fff7c2b7b771b5799824403c7ebec826219778dabc.png' },
    { id: 'sitting', slug: 'sitting', title: 'Pet Sitting', description: 'In-home care while you\'re away', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/d14ab16504e86c1cf3ed6566416bb0be20888775823ce2395a45ec03a72ceb3c.png' },
  ],
  care: [
    { id: 'grooming', slug: 'grooming', title: 'Grooming', description: 'Bathing, brushing & coat care', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/b3fadc3b468a0086269a3c93a886b5aca3fda875bc56a267a15dcf08dc24a233.png' },
    { id: 'health', slug: 'health', title: 'Health & Wellness', description: 'Preventive care & checkups', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/0dd0f4cc534f2469ead15a5c3d2182a2d3c6035522046be55bc9d7d692d98a62.png' },
    { id: 'dental', slug: 'dental', title: 'Dental Care', description: 'Teeth cleaning & oral health', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/184cc84060758b19cb89a1e1edede9fb8ac1512144b7fbea10d1e6b94a0bec98.png' },
    { id: 'skin', slug: 'skin', title: 'Skin & Coat', description: 'Addressing skin issues', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/819db193575b5c227b2a548ebbfa3956d3d9021d4a108e66b84cde5d37844bd4.png' },
  ],
  fit: [
    { id: 'exercise', slug: 'exercise', title: 'Exercise Plans', description: 'Daily activity routines', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/1fe2fada2637158b9f3e4484188e659e717b3c4c2edd2530602035aea4da2bab.png' },
    { id: 'weight', slug: 'weight', title: 'Weight Management', description: 'Healthy weight goals', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/c17d7338afbe7d0038b4bfe4edcb32a818325c8704ecfe2f49466301b5e8deae.png' },
    { id: 'agility', slug: 'agility', title: 'Agility Training', description: 'Sports & activities', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/af2169f950ba347e9f0846a694d7eb7b738f86c5a202383d66fb7352a9fb22b6.png' },
    { id: 'swimming', slug: 'swimming', title: 'Swimming', description: 'Water exercises & therapy', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/85d0416e8f45df816db34250015a52505cbea174c4818cda4aadb8786d3b3cb2.png' },
  ],
  travel: [
    { id: 'flights', slug: 'flights', title: 'Air Travel', description: 'Flying with your pet', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/68593d265f9d94bbd894c2dd2baf52462e9ef95d85a1c27b0b57f908b2473db6.png' },
    { id: 'road', slug: 'road', title: 'Road Trips', description: 'Car travel essentials', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/8aad1707b37b9c4305b7cf9b6a955dd5cc5884c9efdc310896144a13157e6f56.png' },
    { id: 'destinations', slug: 'destinations', title: 'Destinations', description: 'Pet-friendly places', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/dec8c792db0d9a397da38ae43149b695ac8ae891e95d75ec0135a746bdbd3607.png' },
    { id: 'gear', slug: 'gear', title: 'Travel Gear', description: 'Carriers & accessories', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/58aafa0ae1aa3e5a4727b5741e986868c383acf09df172a3f64f5a7c57438b8d.png' },
  ],
  dine: [
    { id: 'fresh', slug: 'fresh', title: 'Fresh Food', description: 'Home-cooked & fresh meals', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/79d880551f873a8564f737ee917a60be8aa1fae25f995b4f0db5dead61640d42.png' },
    { id: 'dry', slug: 'dry', title: 'Dry Food', description: 'Kibble & dry options', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/6b3c13873ee50e1f7dbceb21a5d83f3b2b6f14e8c7877e35b145aaa4d2df2152.png' },
    { id: 'treats', slug: 'treats', title: 'Treats', description: 'Healthy snacks & rewards', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/9bebc90e9e1a574e2983ffaa78062e22a3487f36364b6ab4a933735be959e037.png' },
    { id: 'special', slug: 'special', title: 'Special Diets', description: 'Allergies & sensitivities', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/37f65443c38fa2782d98c83161bb23a584e5679fe4be903d47d670aeb18283a1.png' },
  ],
  enjoy: [
    { id: 'events', slug: 'events', title: 'Pet Events', description: 'Local gatherings & shows', image: '' },
    { id: 'playdates', slug: 'playdates', title: 'Playdates', description: 'Social time with other pets', image: '' },
    { id: 'toys', slug: 'toys', title: 'Toys & Games', description: 'Interactive playtime', image: '' },
    { id: 'enrichment', slug: 'enrichment', title: 'Enrichment', description: 'Mental stimulation', image: '' },
  ],
  celebrate: [
    { id: 'birthdays', slug: 'birthdays', title: 'Birthdays', description: 'Birthday party planning', image: '' },
    { id: 'gotcha', slug: 'gotcha', title: 'Gotcha Day', description: 'Adoption anniversaries', image: '' },
    { id: 'gifts', slug: 'gifts', title: 'Gifts', description: 'Special treats & presents', image: '' },
    { id: 'photoshoots', slug: 'photoshoots', title: 'Photoshoots', description: 'Professional pet photos', image: '' },
  ],
  emergency: [
    { id: 'vet', slug: 'vet', title: 'Emergency Vet', description: '24/7 veterinary care', image: '' },
    { id: 'firstaid', slug: 'firstaid', title: 'First Aid', description: 'Immediate care tips', image: '' },
    { id: 'poison', slug: 'poison', title: 'Poison Control', description: 'Toxic substance help', image: '' },
    { id: 'lost', slug: 'lost', title: 'Lost Pet', description: 'Finding your pet', image: '' },
  ],
  advisory: [
    { id: 'behavior', slug: 'behavior', title: 'Behavior', description: 'Behavioral consultations', image: '' },
    { id: 'nutrition', slug: 'nutrition', title: 'Nutrition', description: 'Diet & feeding advice', image: '' },
    { id: 'training', slug: 'training', title: 'Training', description: 'Professional guidance', image: '' },
    { id: 'health', slug: 'health', title: 'Health', description: 'Wellness consultations', image: '' },
  ],
  farewell: [
    { id: 'endoflife', slug: 'endoflife', title: 'End-of-Life Care', description: 'Compassionate support', image: '' },
    { id: 'cremation', slug: 'cremation', title: 'Cremation', description: 'Dignified arrangements', image: '' },
    { id: 'memorial', slug: 'memorial', title: 'Memorials', description: 'Honoring their memory', image: '' },
    { id: 'grief', slug: 'grief', title: 'Grief Support', description: 'Healing resources', image: '' },
  ],
  adopt: [
    { id: 'dogs', slug: 'dogs', title: 'Adopt a Dog', description: 'Find your companion', image: '' },
    { id: 'foster', slug: 'foster', title: 'Foster', description: 'Temporary care program', image: '' },
    { id: 'shelters', slug: 'shelters', title: 'Shelters', description: 'Local rescues & shelters', image: '' },
    { id: 'prep', slug: 'prep', title: 'Adoption Prep', description: 'Get ready for your pet', image: '' },
  ],
  shop: [
    { id: 'essentials', slug: 'essentials', title: 'Essentials', description: 'Must-have basics', image: '' },
    { id: 'new', slug: 'new', title: 'New Arrivals', description: 'Latest products', image: '' },
    { id: 'bestsellers', slug: 'bestsellers', title: 'Bestsellers', description: 'Popular picks', image: '' },
    { id: 'deals', slug: 'deals', title: 'Deals', description: 'Special offers', image: '' },
  ]
};

export default PillarTopicsGrid;
