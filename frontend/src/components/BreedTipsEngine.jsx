/**
 * BreedTipsEngine Component
 * Smart breed-specific tips based on the pet's breed
 * Features:
 * - Daily rotating tips
 * - Category-based tips (nutrition, exercise, grooming, health)
 * - Breed-specific recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Lightbulb, ChevronRight, RefreshCw, Heart, 
  Apple, Dumbbell, Scissors, Stethoscope 
} from 'lucide-react';
import { API_URL } from '../utils/api';

// Breed tips database (can be expanded or moved to backend)
const BREED_TIPS = {
  'labrador': {
    name: 'Labrador Retriever',
    tips: {
      nutrition: [
        'Labs are prone to obesity - measure food portions carefully',
        'Include omega-3 fatty acids for a healthy coat',
        'Avoid feeding grapes, chocolate, and onions',
        'Split meals into 2-3 portions to prevent bloat'
      ],
      exercise: [
        'Labs need 1-2 hours of exercise daily',
        'Swimming is excellent exercise for Labs',
        'Mental stimulation through puzzle toys is important',
        'Regular fetch games help burn energy'
      ],
      grooming: [
        'Brush weekly to manage shedding',
        'Clean ears regularly - Labs are prone to ear infections',
        'Trim nails every 2-3 weeks',
        'Bathe only when necessary to preserve natural oils'
      ],
      health: [
        'Watch for hip dysplasia symptoms',
        'Annual eye exams are recommended',
        'Labs can be prone to elbow dysplasia',
        'Maintain healthy weight to prevent joint issues'
      ]
    }
  },
  'golden retriever': {
    name: 'Golden Retriever',
    tips: {
      nutrition: [
        'Goldens do well on high-quality protein diets',
        'Include glucosamine for joint health',
        'Monitor calorie intake - they love to eat!',
        'Fresh water should always be available'
      ],
      exercise: [
        'Goldens need at least 60 minutes of exercise daily',
        'They excel at fetch, swimming, and hiking',
        'Puppy exercise should be limited to protect growing joints',
        'Mental games are as important as physical exercise'
      ],
      grooming: [
        'Daily brushing during shedding season',
        'Regular professional grooming every 6-8 weeks',
        'Check and clean ears weekly',
        'Trim feathering on legs and tail as needed'
      ],
      health: [
        'Regular cancer screenings are important',
        'Watch for skin allergies and hot spots',
        'Heart health monitoring recommended',
        'Joint supplements can help prevent issues'
      ]
    }
  },
  'beagle': {
    name: 'Beagle',
    tips: {
      nutrition: [
        'Beagles are food-driven - control portions strictly',
        'Avoid free-feeding to prevent obesity',
        'High-protein diet supports their active lifestyle',
        'Healthy treats work great for training'
      ],
      exercise: [
        'Beagles need 1+ hour of exercise daily',
        'Scent games and tracking activities are ideal',
        'Always keep on leash - they follow their nose!',
        'Secure fencing is essential for yard time'
      ],
      grooming: [
        'Weekly brushing is usually sufficient',
        'Check and clean floppy ears regularly',
        'Nail trimming every 2-3 weeks',
        'Dental care is important - brush teeth regularly'
      ],
      health: [
        'Watch for epilepsy symptoms',
        'Hypothyroidism is common in Beagles',
        'Regular ear checks prevent infections',
        'Maintain healthy weight to prevent back problems'
      ]
    }
  },
  'pug': {
    name: 'Pug',
    tips: {
      nutrition: [
        'Pugs gain weight easily - measure portions',
        'Avoid foods that cause gas and bloating',
        'Small, frequent meals work best',
        'Keep treats to 10% of daily calories'
      ],
      exercise: [
        'Short walks are better than intense exercise',
        'Avoid exercise in hot weather - they overheat easily',
        'Indoor play is great for Pugs',
        '15-20 minutes of activity 2-3 times daily'
      ],
      grooming: [
        'Clean facial wrinkles daily',
        'Brush weekly to manage shedding',
        'Regular nail trimming is essential',
        'Clean ears weekly'
      ],
      health: [
        'Watch for breathing difficulties',
        'Eye care is crucial - clean discharge daily',
        'Keep weight in check to ease breathing',
        'Avoid overheating - watch for signs of distress'
      ]
    }
  },
  'german shepherd': {
    name: 'German Shepherd',
    tips: {
      nutrition: [
        'High-quality protein diet is essential',
        'Joint supplements help prevent hip issues',
        'Avoid overfeeding during growth phase',
        'Probiotics can help with sensitive stomachs'
      ],
      exercise: [
        'GSDs need 2+ hours of exercise daily',
        'Mental stimulation is crucial - they\'re very intelligent',
        'Training sessions count as exercise',
        'Agility and obedience training are ideal'
      ],
      grooming: [
        'Brush several times weekly',
        'Daily brushing during shedding seasons',
        'Regular nail trimming',
        'Check ears for debris weekly'
      ],
      health: [
        'Hip and elbow dysplasia screening recommended',
        'Watch for degenerative myelopathy',
        'Regular dental care is important',
        'Bloat prevention - avoid exercise after eating'
      ]
    }
  },
  'default': {
    name: 'Your Dog',
    tips: {
      nutrition: [
        'Feed high-quality, age-appropriate food',
        'Fresh water should always be available',
        'Avoid table scraps and toxic foods',
        'Measure portions to maintain healthy weight'
      ],
      exercise: [
        'Daily exercise keeps your dog healthy and happy',
        'Combine physical and mental stimulation',
        'Adjust activity based on age and health',
        'Play and training strengthen your bond'
      ],
      grooming: [
        'Regular brushing keeps coat healthy',
        'Check ears, eyes, and teeth weekly',
        'Trim nails every 2-4 weeks',
        'Bathe as needed based on activity'
      ],
      health: [
        'Annual vet checkups are essential',
        'Keep vaccinations up to date',
        'Watch for changes in behavior or appetite',
        'Maintain dental hygiene for overall health'
      ]
    }
  }
};

const CATEGORY_CONFIG = {
  nutrition: { icon: Apple, color: 'text-green-500', bg: 'bg-green-100', label: 'Nutrition' },
  exercise: { icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Exercise' },
  grooming: { icon: Scissors, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Grooming' },
  health: { icon: Stethoscope, color: 'text-red-500', bg: 'bg-red-100', label: 'Health' }
};

const BreedTipsEngine = ({ pet }) => {
  const [currentCategory, setCurrentCategory] = useState('nutrition');
  const [tipIndex, setTipIndex] = useState(0);
  
  // Get breed-specific tips or default
  const breed = (pet?.breed || '').toLowerCase();
  const breedData = BREED_TIPS[breed] || BREED_TIPS['default'];
  const tips = breedData.tips[currentCategory] || [];
  const currentTip = tips[tipIndex] || 'No tips available';
  
  // Rotate tip daily based on date
  useEffect(() => {
    const today = new Date().getDate();
    setTipIndex(today % tips.length);
  }, [currentCategory, tips.length]);
  
  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % tips.length);
  };
  
  const CategoryIcon = CATEGORY_CONFIG[currentCategory].icon;
  
  return (
    <Card className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200" data-testid="breed-tips-engine">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Breed Tips</h3>
            <p className="text-sm text-gray-500">For {breedData.name}</p>
          </div>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-amber-300">
          Daily Tip
        </Badge>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = currentCategory === key;
          return (
            <button
              key={key}
              onClick={() => setCurrentCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? `${config.bg} ${config.color}` 
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </button>
          );
        })}
      </div>
      
      {/* Tip Card */}
      <div className={`p-4 rounded-xl ${CATEGORY_CONFIG[currentCategory].bg} border border-${CATEGORY_CONFIG[currentCategory].color.replace('text-', '')}/20`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${CATEGORY_CONFIG[currentCategory].color}`}>
            <CategoryIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-gray-800 font-medium">{currentTip}</p>
            <p className="text-xs text-gray-500 mt-2">
              Tip {tipIndex + 1} of {tips.length} • {CATEGORY_CONFIG[currentCategory].label}
            </p>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <button 
          onClick={nextTip}
          className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
        >
          <RefreshCw className="w-4 h-4" /> Next Tip
        </button>
        <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100">
          View All Tips <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

export default BreedTipsEngine;
