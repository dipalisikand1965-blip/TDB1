/**
 * Minimal test component for debugging routing
 */
import React from 'react';

const SoulBuilderTest = () => {
  return (
    <div 
      data-testid="soul-builder-test" 
      style={{ 
        minHeight: '100vh', 
        background: '#0f0a19', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <h1 style={{ color: 'white', fontSize: '24px' }}>
        Soul Builder Test - Route Working!
      </h1>
    </div>
  );
};

export default SoulBuilderTest;
