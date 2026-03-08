import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Sparkles, 
  Download,
  Edit2,
  Check,
  Palette,
  Type,
  Image as ImageIcon
} from 'lucide-react';

/**
 * PersonalizationPreview
 * 
 * Shows a real-time preview of how products look with personalization:
 * - Pet name overlaid on product
 * - Breed illustration integrated
 * - Style toggle (Watercolor vs Line Art)
 */

const PersonalizationPreview = ({ 
  productImage, 
  productName,
  breedIllustration,
  petName = "Mojo",
  archetypeColors = ["#9333ea", "#ec4899"],
  onCustomize,
  showNameOnProduct = true
}) => {
  const canvasRef = useRef(null);
  const [displayName, setDisplayName] = useState(petName);
  const [isEditing, setIsEditing] = useState(false);
  const [artStyle, setArtStyle] = useState('watercolor'); // watercolor or lineart
  const [namePosition, setNamePosition] = useState('bottom'); // bottom, center, top
  const [fontSize, setFontSize] = useState(24);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Generate preview with name overlay
  useEffect(() => {
    if (!productImage || !showNameOnProduct) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw product image
      ctx.drawImage(img, 0, 0);
      
      // Add name overlay
      if (displayName && showNameOnProduct) {
        // Semi-transparent background for name
        const bgHeight = 60;
        let yPosition;
        
        if (namePosition === 'bottom') {
          yPosition = canvas.height - bgHeight - 20;
        } else if (namePosition === 'center') {
          yPosition = (canvas.height - bgHeight) / 2;
        } else {
          yPosition = 20;
        }
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, yPosition, canvas.width, yPosition);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
        
        ctx.fillStyle = gradient;
        ctx.roundRect(20, yPosition, canvas.width - 40, bgHeight, 12);
        ctx.fill();
        
        // Add subtle border
        ctx.strokeStyle = archetypeColors[0] || '#9333ea';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw name text
        ctx.font = `bold ${fontSize}px 'Playfair Display', Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Text with gradient
        ctx.fillStyle = archetypeColors[0] || '#7c3aed';
        ctx.fillText(displayName, canvas.width / 2, yPosition + bgHeight / 2);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
      }
      
      // Convert to URL
      setPreviewUrl(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      console.error('Failed to load product image');
    };
    
    img.src = productImage;
  }, [productImage, displayName, namePosition, fontSize, archetypeColors, showNameOnProduct]);

  const handleDownload = () => {
    if (!previewUrl) return;
    
    const link = document.createElement('a');
    link.download = `${productName || 'product'}-${displayName}.png`;
    link.href = previewUrl;
    link.click();
  };

  return (
    <Card className="overflow-hidden">
      {/* Preview Image */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Display preview */}
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt={`${productName} for ${displayName}`}
            className="w-full h-full object-cover"
          />
        ) : productImage ? (
          <img 
            src={productImage} 
            alt={productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* Soul Made Badge */}
        <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
          <Sparkles className="w-3 h-3 mr-1" />
          Soul Made
        </Badge>
        
        {/* Art Style Toggle */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => setArtStyle('watercolor')}
            className={`px-2 py-1 text-xs rounded ${artStyle === 'watercolor' ? 'bg-purple-600 text-white' : 'bg-white/80'}`}
          >
            Watercolor
          </button>
          <button
            onClick={() => setArtStyle('lineart')}
            className={`px-2 py-1 text-xs rounded ${artStyle === 'lineart' ? 'bg-purple-600 text-white' : 'bg-white/80'}`}
          >
            Line Art
          </button>
        </div>
      </div>
      
      {/* Customization Controls */}
      <div className="p-4 space-y-4">
        {/* Product Name */}
        <div>
          <h3 className="font-semibold text-gray-900">{productName}</h3>
          <p className="text-sm text-purple-600">Personalized for {displayName}</p>
        </div>
        
        {/* Name Editor */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500">Pet Name on Product</label>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1"
                  placeholder="Enter pet name"
                  maxLength={20}
                />
                <Button size="sm" onClick={() => setIsEditing(false)}>
                  <Check className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg flex items-center">
                  <Type className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">{displayName}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Position Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500">Name Position</label>
          <div className="flex gap-2">
            {['top', 'center', 'bottom'].map(pos => (
              <button
                key={pos}
                onClick={() => setNamePosition(pos)}
                className={`flex-1 py-1 px-2 text-xs rounded capitalize ${
                  namePosition === pos 
                    ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
        
        {/* Color Palette */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Palette className="w-3 h-3" />
            Soul Color Palette
          </label>
          <div className="flex gap-2">
            {archetypeColors.map((color, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={onCustomize}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Customize More
          </Button>
          <Button 
            variant="outline"
            onClick={handleDownload}
            disabled={!previewUrl}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PersonalizationPreview;
