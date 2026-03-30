import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import { 
  Heart, 
  Circle, 
  Square, 
  Upload, 
  ShoppingCart, 
  Sparkles,
  Check,
  X,
  ImageIcon,
  Cake
} from 'lucide-react';
import { API_URL } from '../utils/api';


// Shape options with pricing (500g)
const SHAPES = [
  { id: 'bone', name: 'Bone', price: 799, icon: '🦴', description: 'Classic dog bone shape' },
  { id: 'heart', name: 'Heart', price: 899, icon: '💜', description: 'Show your love' },
  { id: 'round', name: 'Round', price: 699, icon: '⭕', description: 'Traditional round cake' },
  { id: 'square', name: 'Square', price: 749, icon: '⬜', description: 'Modern square shape' },
];

// Flavor options
const FLAVORS = [
  { id: 'banana', name: 'Banana', price: 0, icon: '🍌', description: 'Sweet & healthy banana base' },
  { id: 'chicken', name: 'Chicken', price: 50, icon: '🍗', description: 'Savoury chicken flavour (+₹50)' },
];

const CustomCakeDesigner = () => {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const fileInputRef = useRef(null);
  
  // State
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [customText, setCustomText] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Calculate total price
  const calculatePrice = () => {
    let total = 0;
    if (selectedShape) {
      total += SHAPES.find(s => s.id === selectedShape)?.price || 0;
    }
    if (selectedFlavor) {
      total += FLAVORS.find(f => f.id === selectedFlavor)?.price || 0;
    }
    return total;
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/upload/cake-reference`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferenceImage(data.url || data.file_path);
        toast({
          title: 'Image uploaded! 📸',
          description: 'Your reference image has been saved.',
        });
      } else {
        // Keep the local preview even if server upload fails
        toast({
          title: 'Image saved locally',
          description: 'Image will be included with your order.',
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      // Still keep the preview even if upload fails
      toast({
        title: 'Image saved',
        description: 'Your reference image is ready.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check if form is complete
  const isComplete = selectedShape && selectedFlavor;

  // Add to cart AND save to backend
  const handleAddToCart = async () => {
    if (!isComplete) return;

    const shape = SHAPES.find(s => s.id === selectedShape);
    const flavor = FLAVORS.find(f => f.id === selectedFlavor);
    
    const customCake = {
      id: `custom-cake-${Date.now()}`,
      name: `Custom ${shape.name} Cake (${flavor.name})`,
      price: calculatePrice(),
      image: referenceImagePreview || '',
      category: 'custom-cakes',
      isCustomCake: true,
      customDetails: {
        shape: shape.name,
        shapeIcon: shape.icon,
        flavor: flavor.name,
        flavorIcon: flavor.icon,
        customText: customText || 'No custom text',
        referenceImage: referenceImage || referenceImagePreview,
        weight: '500g'
      }
    };

    // Save to backend for order tracking
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/custom-cakes/save-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          shape: shape.name,
          shape_icon: shape.icon,
          flavor: flavor.name,
          flavor_icon: flavor.icon,
          custom_text: customText || '',
          reference_image: referenceImage,
          price: calculatePrice(),
          weight: '500g'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        customCake.backendId = data.design_id;
        console.log('[CustomCake] Design saved to backend:', data.design_id);
      }
    } catch (err) {
      console.error('[CustomCake] Failed to save design:', err);
      // Continue anyway - cart is primary
    }

    addToCart(customCake, '500g', flavor.name, 1);
    setAddedToCart(true);
    
    toast({
      title: 'Custom cake added! 🎂',
      description: `${shape.icon} ${shape.name} cake with ${flavor.name} flavour`,
    });
    
    setTimeout(() => {
      setIsCartOpen(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Design Your Dream Cake
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            🎂 Build Your Cake
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Create a personalised cake for your furry friend! Choose shape, flavour, add custom text, 
            and upload a reference image.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Options */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Shape Selection */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-xl font-bold text-gray-900">Choose Shape</h2>
                <span className="text-sm text-gray-500">(500g cake)</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => setSelectedShape(shape.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selectedShape === shape.id
                        ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                    data-testid={`shape-${shape.id}`}
                  >
                    {selectedShape === shape.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-4xl mb-2">{shape.icon}</div>
                    <h3 className="font-semibold text-gray-900">{shape.name}</h3>
                    <p className="text-purple-600 font-bold">₹{shape.price}</p>
                    <p className="text-xs text-gray-500 mt-1">{shape.description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Step 2: Flavor Selection */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="text-xl font-bold text-gray-900">Choose Flavor</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {FLAVORS.map((flavor) => (
                  <button
                    key={flavor.id}
                    onClick={() => setSelectedFlavor(flavor.id)}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                      selectedFlavor === flavor.id
                        ? 'border-purple-600 bg-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                    data-testid={`flavor-${flavor.id}`}
                  >
                    {selectedFlavor === flavor.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-3xl mb-2">{flavor.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-lg">{flavor.name}</h3>
                    <p className="text-purple-600 font-bold">
                      {flavor.price === 0 ? 'Base Price' : `+₹${flavor.price}`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{flavor.description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Step 3: Custom Text */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="text-xl font-bold text-gray-900">Add Custom Text</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">FREE</span>
              </div>
              
              <Input
                placeholder="e.g., Happy Birthday Bruno! 🎉"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={50}
                className="text-lg py-6"
                data-testid="custom-text-input"
              />
              <p className="text-xs text-gray-500 mt-2">{customText.length}/50 characters • Included with your cake at no extra cost</p>
            </Card>

            {/* Step 4: Reference Image */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                <h2 className="text-xl font-bold text-gray-900">Upload Reference Image</h2>
                <span className="text-sm text-gray-500">(Optional)</span>
              </div>
              
              <p className="text-gray-600 mb-4">
                Have a design in mind? Upload a photo and we&apos;ll try to recreate it! 📸
              </p>

              {referenceImagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={referenceImagePreview} 
                    alt="Reference" 
                    className="w-48 h-48 object-cover rounded-xl border-2 border-purple-200"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  data-testid="upload-reference-btn"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-600 font-medium">Click to upload image</span>
                  <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Cake className="w-5 h-5 text-purple-600" />
                  Your Custom Cake
                </h2>

                {/* Preview */}
                <div className="bg-white rounded-xl p-4 mb-4">
                  {referenceImagePreview ? (
                    <img 
                      src={referenceImagePreview} 
                      alt="Your cake design" 
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-3">
                      {selectedShape ? (
                        <span className="text-6xl">{SHAPES.find(s => s.id === selectedShape)?.icon}</span>
                      ) : (
                        <div className="text-center text-gray-400">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Select a shape</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Summary Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-purple-200">
                    <span className="text-gray-600">Shape</span>
                    <span className="font-medium">
                      {selectedShape ? (
                        <span className="flex items-center gap-1">
                          {SHAPES.find(s => s.id === selectedShape)?.icon} {SHAPES.find(s => s.id === selectedShape)?.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not selected</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-purple-200">
                    <span className="text-gray-600">Flavor</span>
                    <span className="font-medium">
                      {selectedFlavor ? (
                        <span className="flex items-center gap-1">
                          {FLAVORS.find(f => f.id === selectedFlavor)?.icon} {FLAVORS.find(f => f.id === selectedFlavor)?.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not selected</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-purple-200">
                    <span className="text-gray-600">Weight</span>
                    <span className="font-medium">500g</span>
                  </div>
                  
                  {customText && (
                    <div className="py-2 border-b border-purple-200">
                      <span className="text-gray-600 block mb-1">Custom Text:</span>
                      <span className="font-medium text-purple-700">&quot;{customText}&quot;</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2 border-b border-purple-200">
                    <span className="text-gray-600">Reference Image</span>
                    <span className="font-medium">
                      {referenceImagePreview ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {selectedShape ? `${SHAPES.find(s => s.id === selectedShape)?.name} Shape` : 'Shape'}
                    </span>
                    <span>₹{selectedShape ? SHAPES.find(s => s.id === selectedShape)?.price : 0}</span>
                  </div>
                  {selectedFlavor && FLAVORS.find(f => f.id === selectedFlavor)?.price > 0 && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-600">Chicken Flavor</span>
                      <span>+₹50</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-purple-600">₹{calculatePrice()}</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!isComplete || addedToCart}
                  className={`w-full py-6 text-lg font-bold transition-all ${
                    addedToCart
                      ? 'bg-green-600 hover:bg-green-600'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}
                  data-testid="add-custom-cake-btn"
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Added to Cart! 🎉
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart - ₹{calculatePrice()}
                    </>
                  )}
                </Button>

                {!isComplete && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    Please select shape and flavor to continue
                  </p>
                )}

                {addedToCart && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/checkout')}
                    className="w-full mt-3"
                  >
                    Proceed to Checkout →
                  </Button>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCakeDesigner;
