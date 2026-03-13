/**
 * GuidedCelebrationPaths.jsx
 * 
 * "Follow a structured journey — Mira walks you through every step."
 * Birthday Party | Gotcha Day | Pet Photoshoot
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const PATHS = [
  {
    id: 'birthday',
    icon: '🎂',
    name: 'Birthday party path',
    color: '#FEF3C7',
    borderColor: '#F59E0B',
    description: (petName) => `From theme to cake to guest list — plan ${petName}'s full birthday in one guided flow.`,
    steps: ['Choose theme', 'Order cake', 'Guest list'],
    extraSteps: 2
  },
  {
    id: 'gotcha',
    icon: '🏠',
    name: 'Gotcha day path',
    color: '#D1FAE5',
    borderColor: '#10B981',
    description: (petName) => `Celebrate the day ${petName} chose you. A quieter, more personal kind of celebration.`,
    steps: ['Find the date', 'Memory book'],
    extraSteps: 2
  },
  {
    id: 'photoshoot',
    icon: '📸',
    name: 'Pet photoshoot path',
    color: '#FCE7F3',
    borderColor: '#EC4899',
    description: (petName) => `From outfit to location to photographer — capture ${petName} at their most beautiful.`,
    steps: ['Choose location', 'Plan outfit'],
    extraSteps: 2
  }
];

const PathCard = ({ path, pet, onSelect }) => {
  const petName = pet?.name || 'your pet';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onSelect && onSelect(path)}
      className="cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: path.color,
        borderColor: 'transparent'
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = path.borderColor}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
      data-testid={`path-card-${path.id}`}
    >
      {/* Icon */}
      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4"
        style={{ backgroundColor: `${path.borderColor}20` }}
      >
        {path.icon}
      </div>

      {/* Name */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{path.name}</h3>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {path.description(petName)}
      </p>

      {/* Steps */}
      <div className="flex flex-wrap gap-2">
        {path.steps.map((step, idx) => (
          <span 
            key={idx}
            className="text-xs px-3 py-1 rounded-full text-gray-600"
            style={{ backgroundColor: `${path.borderColor}15` }}
          >
            {step}
          </span>
        ))}
        {path.extraSteps > 0 && (
          <span 
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: `${path.borderColor}25`, color: path.borderColor }}
          >
            +{path.extraSteps} more
          </span>
        )}
      </div>

      {/* Chevron indicator */}
      <div className="flex justify-end mt-4">
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </motion.div>
  );
};

const GuidedCelebrationPaths = ({ pet, onSelectPath }) => {
  return (
    <section className="py-12 px-4 bg-white" data-testid="guided-celebration-paths">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Guided celebration paths
          </h2>
          <p className="text-gray-600 text-lg">
            Follow a structured journey — Mira walks you through every step.
          </p>
        </div>

        {/* Paths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PATHS.map((path) => (
            <PathCard 
              key={path.id} 
              path={path} 
              pet={pet}
              onSelect={onSelectPath}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GuidedCelebrationPaths;
