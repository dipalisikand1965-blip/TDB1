import React from 'react';
import PillarManager from './PillarManager';

export default function PlayManager({ token }) {
  return (
    <PillarManager
      token={token}
      pillar="play"
      pillarLabel="Play"
      pillarEmoji="🎾"
      pillarColor="#E76F51"
      pillarDescription="Toys, enrichment, activities, play sessions, training equipment"
      categories={[
        'Toys', 'Enrichment', 'Interactive Games', 'Fetch & Outdoor',
        'Puzzle Toys', 'Training Equipment', 'Play Sessions',
        'Agility & Sports', 'Swimming',
      ]}
    />
  );
}
