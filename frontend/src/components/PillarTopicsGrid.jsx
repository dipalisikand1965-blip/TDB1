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
    { id: 'exercise', slug: 'exercise', title: 'Exercise Plans', description: 'Daily activity routines', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/6fcd92ccd999c2460f7310eef95cbec74168d59d4ad4a1cc03fffa272f81e16e.png' },
    { id: 'weight', slug: 'weight', title: 'Weight Management', description: 'Maintaining healthy weight', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/9a3cb8382f23c8e29f792d57058a7e09e91e3d624452236a50472fb5db0372ad.png' },
    { id: 'agility', slug: 'agility', title: 'Agility Training', description: 'Fun obstacle courses', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/c326f47935a3b2efe27dcf3c865e51dd45530bf2586585a0c0f626033dfce404.png' },
    { id: 'swimming', slug: 'swimming', title: 'Swimming', description: 'Low-impact water exercise', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/cf291b205fc37bfa84ab7710b64bf28e74d3bb874cddc6bb7aba3695727eef6d.png' },
  ],
  travel: [
    { id: 'flights', slug: 'flights', title: 'Air Travel', description: 'Flying with your pet', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/a41361b08552ae4c13f8ddb80afef4ab7c2c824dfe9627f732b671518308753c.png' },
    { id: 'road', slug: 'road', title: 'Road Trips', description: 'Car travel essentials', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/b7531862349e7f6386697541e3f76ecd23191b35234206b2cfe17e38a30a9e0f.png' },
    { id: 'destinations', slug: 'destinations', title: 'Destinations', description: 'Pet-friendly places', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/144c0e6c6f25b110ceb698e20fe2d0191d30f7e76a4c9420197231881538b8ce.png' },
    { id: 'gear', slug: 'gear', title: 'Travel Gear', description: 'Carriers & accessories', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/868cd2b215c2f27193052318ed26959f1c59ba7b61e3253bec50009569b7a934.png' },
  ],
  dine: [
    { id: 'fresh', slug: 'fresh', title: 'Fresh Food', description: 'Home-cooked & fresh meals', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/907aee31faf44728369da5232e45f2f9ee61b4d2ac3b2ac1bb6cba18a71ad8f3.png' },
    { id: 'dry', slug: 'dry', title: 'Dry Food', description: 'Kibble & dry options', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/89329adb30f22f2309975333780f957fa96a79957b09643fa7e8aaac39e6c529.png' },
    { id: 'treats', slug: 'treats', title: 'Treats', description: 'Healthy snacks & rewards', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/358e8c3521a2830229923fa048260c20399664836876c0197421c93031368342.png' },
    { id: 'special', slug: 'special', title: 'Special Diets', description: 'Allergies & sensitivities', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/7a3dc7e39db0ef34e8558c7f9b64b8d62e96e569aa5b4a4d63d46787cd98e16b.png' },
  ],
  enjoy: [
    { id: 'events', slug: 'events', title: 'Pet Events', description: 'Fun activities & gatherings', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/28ba65929c4ee164b01fbca69a0b4ed62d81f5ae84cb9c91ff977a54414c30d7.png' },
    { id: 'playdates', slug: 'playdates', title: 'Playdates', description: 'Socializing with other dogs', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/24aeed8a3338a698db1f3c675e79f394b6e171d348ac839e9d100dcb1f46c9f6.png' },
    { id: 'toys', slug: 'toys', title: 'Toys & Games', description: 'Interactive play', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/835fdefb55936e7f519663feef1c11ca638af716324b7c0b1a26e5726527e624.png' },
    { id: 'enrichment', slug: 'enrichment', title: 'Enrichment', description: 'Mental stimulation', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/086d15f1ae4d1a1a967b08e05f688b70a162d325691fe8a239e0f1ceb7904044.png' },
  ],
  celebrate: [
    { id: 'birthdays', slug: 'birthdays', title: 'Birthdays', description: 'Celebrate your pet\'s special day', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/13c7b2d2b51385bde1f27c2ced6ca9e44a92f02179639a3ad688aba08d2a9bf6.png' },
    { id: 'gotcha', slug: 'gotcha', title: 'Gotcha Day', description: 'Adoption anniversaries', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/7b45772c1ba4d19309753cde49630549d5e08941e02546ea007415ff709050ea.png' },
    { id: 'gifts', slug: 'gifts', title: 'Gifts', description: 'Perfect presents for pets', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/bc548f917301bf35992cf5a5fa7d3a4102395cd1b666e80d4748868180b4ce72.png' },
    { id: 'photoshoots', slug: 'photoshoots', title: 'Photoshoots', description: 'Professional pet photography', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/e4f170abdc55f90322e1f1188f3f64ae52551973c39b4cacc6c148449c53acf2.png' },
  ],
  emergency: [
    { id: 'vet', slug: 'vet', title: 'Emergency Vet', description: '24/7 emergency care', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/7606b1abccf6671a09cdd2cd72c32558dfba1200fc7b8309d64ed5f9b35dc1e3.png' },
    { id: 'firstaid', slug: 'firstaid', title: 'First Aid', description: 'Basic emergency care', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/f4ed7acc0116f9185282dacd80a642ccca274039226748b09948f6a9228381db.png' },
    { id: 'poison', slug: 'poison', title: 'Poison Control', description: 'Toxin exposure help', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/b3ebc38d2141a671bc045cdb76295c717caa078223386d90d7d357c42862d548.png' },
    { id: 'lost', slug: 'lost', title: 'Lost Pet', description: 'Finding lost pets', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/6e1d71db8fe9a3a2d15b1d7781fabc48766a7836436731da13910ad331f58a3b.png' },
  ],
  advisory: [
    { id: 'behavior', slug: 'behavior', title: 'Behavior', description: 'Expert behavior guidance', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/3d4bfc159710671ae8e3739103028028578b92e909a9b3a97081c5832d895c4f.png' },
    { id: 'nutrition', slug: 'nutrition', title: 'Nutrition', description: 'Diet & feeding advice', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/e1536fad2370369232457a3555c6936f5928dee7226b316d3507fb343e3f12b9.png' },
    { id: 'training', slug: 'training', title: 'Training', description: 'Professional training help', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/f0f824a0fe7340d0108782accaf513ae233645c10dfaad354d3d9e71020a7968.png' },
    { id: 'health', slug: 'health', title: 'Health', description: 'Medical guidance', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/6fbaf1ab815782291b3ed85d06c26e20edf8a0c49c56be95a82607181f035afc.png' },
  ],
  farewell: [
    { id: 'endoflife', slug: 'endoflife', title: 'End-of-Life Care', description: 'Compassionate senior care', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/069a635e37895fc3e213a277b7fe7f16dbc0649b88073c3e11ec338699eede3a.png' },
    { id: 'cremation', slug: 'cremation', title: 'Cremation', description: 'Cremation services', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/d4ec68910d8fdb482cfed45b8c5f35f19188ca32c739a092c9e16cc2afb1dcfa.png' },
    { id: 'memorial', slug: 'memorial', title: 'Memorials', description: 'Honoring their memory', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/b9900bd8ab4f5c4037ec599025ac28affac90a21e29c0437f9e9f2ffe3db6b16.png' },
    { id: 'grief', slug: 'grief', title: 'Grief Support', description: 'Coping with loss', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/7057ebb356526a14765fc33344f9fa499ee80c36df9e1281efcf8d5c7f97b824.png' },
  ],
  adopt: [
    { id: 'dogs', slug: 'dogs', title: 'Adopt a Dog', description: 'Find your perfect match', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/5e9cfe6ea4be9df09ad60b2e37ae4cfde4ef8cd8655943bd3bcea338b4cd1416.png' },
    { id: 'foster', slug: 'foster', title: 'Foster', description: 'Temporary care', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/07490f116ab6b8b5ccb1a01459382073e0b036c0d1f724bbb8ffffb0acc3da29.png' },
    { id: 'shelters', slug: 'shelters', title: 'Shelters', description: 'Support local shelters', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/fecccf5351c4726cc58afc6dea0bccb05a186ef8615cd2b76b4798688bf7ac65.png' },
    { id: 'prep', slug: 'prep', title: 'Adoption Prep', description: 'Prepare for new family', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/ffb749dca08f2c890b0653a8a9475cc21b0bd9b7a943802a865fc4d2efd3e029.png' },
  ],
  shop: [
    { id: 'essentials', slug: 'essentials', title: 'Essentials', description: 'Must-have items', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/654874532e988ab54fa909a425fa1feb072d28694208cd6aea9f51f1d8b833f7.png' },
    { id: 'new', slug: 'new', title: 'New Arrivals', description: 'Latest products', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/a274edd5b137bbdc8279246d0fbc31506f07955b116c8d66129561e0d18cc947.png' },
    { id: 'bestsellers', slug: 'bestsellers', title: 'Bestsellers', description: 'Most loved products', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/03d78b56829892cdac28350c433d44503668f8c990cbce31030f67195349e702.png' },
    { id: 'deals', slug: 'deals', title: 'Deals', description: 'Special offers', image: 'https://static.prod-images.emergentagent.com/jobs/bfdd58b0-9e29-4bbc-bfa6-923e1f6827da/images/b2dd2030b8b9a968250331d892749999bb54338a96149efc864b6459da4b53f7.png' },
  ],
};

export default PillarTopicsGrid;
