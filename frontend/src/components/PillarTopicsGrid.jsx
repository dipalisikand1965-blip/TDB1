import React, { useState } from 'react';
import { Card } from './ui/card';
import { ChevronRight } from 'lucide-react';
import PillarTopicModal from './PillarTopicModal';

/**
 * PillarTopicsGrid - Reusable topic cards component for any pillar
 * Includes built-in modal functionality (same experience as Learn page)
 */
const PillarTopicsGrid = ({ 
  pillar,
  topics = [], 
  onTopicClick, // Optional - if provided, uses custom handler instead of modal
  columns = 4,
  className = ''
}) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  if (!topics || topics.length === 0) return null;

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  const handleTopicClick = (topic) => {
    if (onTopicClick) {
      // Use custom handler if provided
      onTopicClick(topic);
    } else {
      // Default: open modal
      setSelectedTopic(topic.slug || topic.id);
    }
  };

  return (
    <>
      <section className={`py-8 px-4 bg-white ${className}`} data-testid={`${pillar}-topics-grid`}>
        <div className="max-w-5xl mx-auto">
          <div className={`grid ${gridCols[columns] || gridCols[4]} gap-4`}>
            {topics.map((topic) => (
              <Card
                key={topic.slug || topic.id}
                className="p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
                onClick={() => handleTopicClick(topic)}
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
      
      {/* Topic Modal - Opens when clicking a topic card */}
      <PillarTopicModal
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        pillar={pillar}
        topicSlug={selectedTopic}
      />
    </>
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
    { id: 'grooming', slug: 'grooming', title: 'Grooming', description: 'Bathing, brushing & coat care', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/ac244e936762d5167e08003826cc212675edb4681160ab0e623ac427b2eab48b.png' },
    { id: 'health', slug: 'health', title: 'Health & Wellness', description: 'Preventive care & checkups', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/ca83e28df7d4b5d0a20b026170ebdf5877e4e4af30c34b3d51d24eb3be141afc.png' },
    { id: 'dental', slug: 'dental', title: 'Dental Care', description: 'Teeth cleaning & oral health', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/de501f8bdf811377aeea9412f9b7ff6fb5e443ab900da010dd6a687f2fc0c816.png' },
    { id: 'skin', slug: 'skin', title: 'Skin & Coat', description: 'Addressing skin issues', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/ce13cb96affa028566a1a81358f797d00b0ccd1536b26b6e8c38e18d8cf415d2.png' },
  ],
  fit: [
    { id: 'exercise', slug: 'exercise', title: 'Exercise Plans', description: 'Daily activity routines', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/1fe2fada2637158b9f3e4484188e659e717b3c4c2edd2530602035aea4da2bab.png' },
    { id: 'weight', slug: 'weight', title: 'Weight Management', description: 'Maintaining healthy weight', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/8d43f06d83a8d2a3bcf87ea0f20b8c7c7c57ebe2bc0e4a839ae85091c4c98a7e.png' },
    { id: 'agility', slug: 'agility', title: 'Agility Training', description: 'Fun obstacle courses', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/c689b75c7f0a9f1d3b2e8a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e.png' },
    { id: 'swimming', slug: 'swimming', title: 'Swimming', description: 'Low-impact water exercise', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/f1e2d3c4b5a6978869f0e1d2c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a.png' },
  ],
  travel: [
    { id: 'flights', slug: 'flights', title: 'Air Travel', description: 'Flying with your pet', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/4f5e6d7c8b9a0f1e2d3c4b5a6978869f0e1d2c3b4a596877869f0a1b2c3d4e5f.png' },
    { id: 'road', slug: 'road', title: 'Road Trips', description: 'Car travel essentials', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b.png' },
    { id: 'destinations', slug: 'destinations', title: 'Destinations', description: 'Pet-friendly places', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c.png' },
    { id: 'gear', slug: 'gear', title: 'Travel Gear', description: 'Carriers & accessories', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d.png' },
  ],
  dine: [
    { id: 'fresh', slug: 'fresh', title: 'Fresh Food', description: 'Home-cooked & fresh meals', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6.png' },
    { id: 'dry', slug: 'dry', title: 'Dry Food', description: 'Kibble & dry options', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2.png' },
    { id: 'treats', slug: 'treats', title: 'Treats', description: 'Healthy snacks & rewards', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4.png' },
    { id: 'special', slug: 'special', title: 'Special Diets', description: 'Allergies & sensitivities', image: 'https://static.prod-images.emergentagent.com/jobs/23796d06-9635-4357-82d4-7f09345d06dc/images/d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6.png' },
  ],
  enjoy: [
    { id: 'events', slug: 'events', title: 'Pet Events', description: 'Fun activities & gatherings', image: '' },
    { id: 'playdates', slug: 'playdates', title: 'Playdates', description: 'Socializing with other dogs', image: '' },
    { id: 'toys', slug: 'toys', title: 'Toys & Games', description: 'Interactive play', image: '' },
    { id: 'enrichment', slug: 'enrichment', title: 'Enrichment', description: 'Mental stimulation', image: '' },
  ],
  celebrate: [
    { id: 'birthdays', slug: 'birthdays', title: 'Birthdays', description: 'Celebrate your pet\'s special day', image: '' },
    { id: 'gotcha', slug: 'gotcha', title: 'Gotcha Day', description: 'Adoption anniversaries', image: '' },
    { id: 'gifts', slug: 'gifts', title: 'Gifts', description: 'Perfect presents for pets', image: '' },
    { id: 'photoshoots', slug: 'photoshoots', title: 'Photoshoots', description: 'Professional pet photography', image: '' },
  ],
  emergency: [
    { id: 'vet', slug: 'vet', title: 'Emergency Vet', description: '24/7 emergency care', image: '' },
    { id: 'firstaid', slug: 'firstaid', title: 'First Aid', description: 'Basic emergency care', image: '' },
    { id: 'poison', slug: 'poison', title: 'Poison Control', description: 'Toxin exposure help', image: '' },
    { id: 'lost', slug: 'lost', title: 'Lost Pet', description: 'Finding lost pets', image: '' },
  ],
  advisory: [
    { id: 'behavior', slug: 'behavior', title: 'Behavior', description: 'Expert behavior guidance', image: '' },
    { id: 'nutrition', slug: 'nutrition', title: 'Nutrition', description: 'Diet & feeding advice', image: '' },
    { id: 'training', slug: 'training', title: 'Training', description: 'Professional training help', image: '' },
    { id: 'health', slug: 'health', title: 'Health', description: 'Medical guidance', image: '' },
  ],
  farewell: [
    { id: 'endoflife', slug: 'endoflife', title: 'End-of-Life Care', description: 'Compassionate senior care', image: '' },
    { id: 'cremation', slug: 'cremation', title: 'Cremation', description: 'Cremation services', image: '' },
    { id: 'memorial', slug: 'memorial', title: 'Memorials', description: 'Honoring their memory', image: '' },
    { id: 'grief', slug: 'grief', title: 'Grief Support', description: 'Coping with loss', image: '' },
  ],
  adopt: [
    { id: 'dogs', slug: 'dogs', title: 'Adopt a Dog', description: 'Find your perfect match', image: '' },
    { id: 'foster', slug: 'foster', title: 'Foster', description: 'Temporary care', image: '' },
    { id: 'shelters', slug: 'shelters', title: 'Shelters', description: 'Support local shelters', image: '' },
    { id: 'prep', slug: 'prep', title: 'Adoption Prep', description: 'Prepare for new family', image: '' },
  ],
  shop: [
    { id: 'essentials', slug: 'essentials', title: 'Essentials', description: 'Must-have items', image: '' },
    { id: 'new', slug: 'new', title: 'New Arrivals', description: 'Latest products', image: '' },
    { id: 'bestsellers', slug: 'bestsellers', title: 'Bestsellers', description: 'Most loved products', image: '' },
    { id: 'deals', slug: 'deals', title: 'Deals', description: 'Special offers', image: '' },
  ],
};

export default PillarTopicsGrid;
