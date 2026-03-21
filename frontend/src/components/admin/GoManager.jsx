import React from 'react';
import PillarManager from './PillarManager';

export default function GoManager({ token }) {
  return (
    <PillarManager
      token={token}
      pillar="go"
      pillarLabel="Go"
      pillarEmoji="✈️"
      pillarColor="#1ABC9C"
      pillarDescription="Travel products, pet-friendly hotels, transport carriers, adventure gear"
      categories={[
        'Pet Carriers', 'Travel Accessories', 'Pet-Friendly Hotels',
        'Flight Essentials', 'Car Travel', 'Adventure Gear',
        'Travel Documents', 'Insurance', 'Destination Guides',
      ]}
    />
  );
}
