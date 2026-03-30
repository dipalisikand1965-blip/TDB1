import React from 'react';

/**
 * ProductMockupGenerator
 * 
 * Generates personalized product mockups by:
 * - CSS overlay of pet name ON the product image
 * - Optional breed illustration overlay
 * 
 * Uses CSS overlays instead of canvas to avoid CORS issues.
 */

// Product templates with positions for text and illustrations
const PRODUCT_TEMPLATES = {
  // Cake - name goes in center-bottom
  cake: {
    namePosition: { top: '60%', left: '50%', transform: 'translate(-50%, -50%)' },
    nameFontSize: '1.5rem',
    nameColor: '#6B21A8',
    bgStyle: 'bg-white/90 backdrop-blur-sm border border-purple-200',
    showIllustration: false
  },
  // Mug - name centered
  mug: {
    namePosition: { top: '70%', left: '50%', transform: 'translate(-50%, -50%)' },
    nameFontSize: '1.2rem',
    nameColor: '#7C3AED',
    bgStyle: 'bg-white/95 backdrop-blur-sm border border-purple-200',
    illustrationPosition: { top: '30%', left: '50%', transform: 'translate(-50%, -50%)', size: '40%' },
    showIllustration: true
  },
  // Bowl - name near top
  bowl: {
    namePosition: { top: '25%', left: '50%', transform: 'translate(-50%, -50%)' },
    nameFontSize: '1.3rem',
    nameColor: '#BE185D',
    bgStyle: 'bg-white/90 backdrop-blur-sm border border-pink-200',
    illustrationPosition: { top: '60%', left: '50%', transform: 'translate(-50%, -50%)', size: '50%' },
    showIllustration: true
  },
  // Bandana - name in corner
  bandana: {
    namePosition: { top: '30%', right: '15%', transform: 'rotate(15deg)' },
    nameFontSize: '1rem',
    nameColor: '#7C3AED',
    bgStyle: 'bg-white/95 backdrop-blur-sm border border-purple-200',
    illustrationPosition: { top: '50%', left: '30%', transform: 'translate(-50%, -50%)', size: '45%' },
    showIllustration: true
  },
  // Treat box - name at top
  treatbox: {
    namePosition: { top: '15%', left: '50%', transform: 'translate(-50%, -50%)' },
    nameFontSize: '1rem',
    nameColor: '#9333EA',
    bgStyle: 'bg-white/95 backdrop-blur-sm border border-purple-200',
    showIllustration: false
  },
  // Default template
  default: {
    namePosition: { bottom: '12%', left: '50%', transform: 'translateX(-50%)' },
    nameFontSize: '1.2rem',
    nameColor: '#7C3AED',
    bgStyle: 'bg-white/95 backdrop-blur-sm border border-purple-200',
    showIllustration: false
  }
};

// Detect product type from name
const detectProductType = (productName) => {
  const name = (productName || '').toLowerCase();
  
  if (name.includes('cake') || name.includes('birthday')) return 'cake';
  if (name.includes('mug') || name.includes('cup')) return 'mug';
  if (name.includes('bowl') || name.includes('feeder')) return 'bowl';
  if (name.includes('bandana') || name.includes('scarf')) return 'bandana';
  if (name.includes('treat') || name.includes('box') || name.includes('hamper')) return 'treatbox';
  
  return 'default';
};

const ProductMockupGenerator = ({
  productImage,
  productName,
  petName,
  breedIllustration,
  className = '',
  showName = true,
  showIllustration = true
}) => {
  const productType = detectProductType(productName);
  const template = PRODUCT_TEMPLATES[productType];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Product Image */}
      <img
        src={productImage}
        alt={productName}
        className="w-full h-full object-cover"
        onError={(e) => { 
          e.target.src = ''; 
        }}
      />
      
      {/* Pet Name Overlay - THE KEY PERSONALIZATION */}
      {showName && petName && (
        <div 
          className={`absolute px-4 py-2 rounded-xl shadow-lg ${template.bgStyle}`}
          style={template.namePosition}
        >
          <span 
            className="font-bold tracking-wide whitespace-nowrap"
            style={{ 
              color: template.nameColor,
              fontSize: template.nameFontSize,
              fontFamily: "'Playfair Display', Georgia, serif",
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {petName}
          </span>
        </div>
      )}
      
      {/* Breed Illustration Overlay (for applicable products like mugs, bowls) */}
      {showIllustration && breedIllustration && template.showIllustration && template.illustrationPosition && (
        <div 
          className="absolute rounded-full overflow-hidden border-4 border-white shadow-xl"
          style={{
            ...template.illustrationPosition,
            width: template.illustrationPosition.size,
            height: template.illustrationPosition.size
          }}
        >
          <img
            src={breedIllustration}
            alt="Breed illustration"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default ProductMockupGenerator;
export { PRODUCT_TEMPLATES, detectProductType };
