import React from 'react';
import { Badge } from './ui/badge';
import PersonalizedPicks from './PersonalizedPicks';
import SoulMadeCollection from './SoulMadeCollection';
import PillarPicksSection from './PillarPicksSection';

export const PillarSoulLayer = ({
  pillar,
  activePet,
  title,
  subtitle,
  showSoulMade = false,
  maxProducts = 6,
  maxSoulMadeItems = 8,
}) => {
  if (!activePet) return null;

  return (
    <section
      className="py-10 bg-gradient-to-b from-white to-stone-50/80"
      data-testid={`${pillar}-soul-layer`}
    >
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <Badge className="bg-slate-100 text-slate-700" data-testid={`${pillar}-soul-layer-badge`}>
            Made for {activePet.name}
          </Badge>
          <h2 className="mt-3 text-3xl font-bold text-slate-900" data-testid={`${pillar}-soul-layer-title`}>
            {title || `Personalized for ${activePet.name}`}
          </h2>
          <p className="mt-2 text-sm text-slate-600 md:text-base" data-testid={`${pillar}-soul-layer-subtitle`}>
            {subtitle || `A soul-aware layer shaped around ${activePet.name}'s breed, temperament, and lived context.`}
          </p>
        </div>

        <PersonalizedPicks pillar={pillar} maxProducts={maxProducts} />

        {showSoulMade && (
          <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-6">
            <SoulMadeCollection pillar={pillar} maxItems={maxSoulMadeItems} showTitle={true} />
          </div>
        )}

        <PillarPicksSection pillar={pillar} pet={activePet} />
      </div>
    </section>
  );
};