import React, { useState } from 'react';
import { cakeDesignerOptions } from '../mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import { Check, Sparkles, Info } from 'lucide-react';

const CustomCakeDesigner = () => {
  const { addToCart } = useCart();
  const [design, setDesign] = useState({
    shape: cakeDesignerOptions.shapes[0],
    size: cakeDesignerOptions.sizes[0],
    flavor: cakeDesignerOptions.flavors[0],
    topping: cakeDesignerOptions.toppings[0],
    decoration: cakeDesignerOptions.decorations[0],
    customName: '',
    specialInstructions: ''
  });

  const calculateTotal = () => {
    return (
      design.shape.price +
      design.size.price +
      design.flavor.price +
      design.topping.price +
      design.decoration.price
    );
  };

  const handleAddToCart = () => {
    const customCake = {
      id: 'custom-' + Date.now(),
      name: 'Custom Designed Cake',
      category: 'custom',
      price: calculateTotal(),
      image: 'https://images.unsplash.com/photo-1641029902225-f2a0907ee22d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxkb2clMjBiaXJ0aGRheSUyMGNha2V8ZW58MHx8fHwxNzY4MTgwOTEyfDA&ixlib=rb-4.1.0&q=85',
      description: `Custom ${design.shape.name} - ${design.flavor.name}`,
      sizes: [design.size.name],
      flavors: [design.flavor.name]
    };

    addToCart(customCake, design.size.name, design.flavor.name);
    toast({
      title: 'Custom cake added! 🎉',
      description: 'Your custom design has been added to cart',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md mb-4">
            <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-sm font-semibold text-gray-900">Custom Cake Designer</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Design Your Perfect Cake
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create a one-of-a-kind cake tailored to your pup's taste and your celebration style
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Designer Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shape Selection */}
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-4 block">1. Choose Shape</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cakeDesignerOptions.shapes.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => setDesign({ ...design, shape })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      design.shape.id === shape.id
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">
                      {shape.id === 'round' && '🎂'}
                      {shape.id === 'bone' && '🦴'}
                      {shape.id === 'paw' && '🐾'}
                      {shape.id === 'heart' && '❤️'}
                    </div>
                    <p className="font-medium text-sm">{shape.name}</p>
                    {shape.price > 0 && (
                      <p className="text-xs text-gray-600">+₹{shape.price}</p>
                    )}
                    {design.shape.id === shape.id && (
                      <div className="mt-2">
                        <Check className="w-5 h-5 text-purple-600 mx-auto" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Size Selection */}
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-4 block">2. Choose Size</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cakeDesignerOptions.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setDesign({ ...design, size })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      design.size.id === size.id
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold">{size.name}</p>
                      {design.size.id === size.id && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Serves: {size.serves}</p>
                    <p className="text-lg font-bold text-purple-600">₹{size.price}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Flavor Selection */}
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-4 block">3. Choose Flavor</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cakeDesignerOptions.flavors.map((flavor) => (
                  <button
                    key={flavor.id}
                    onClick={() => setDesign({ ...design, flavor })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      design.flavor.id === flavor.id
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm mb-1">{flavor.name}</p>
                    {flavor.price > 0 && (
                      <p className="text-xs text-gray-600">+₹{flavor.price}</p>
                    )}
                    {design.flavor.id === flavor.id && (
                      <div className="mt-2">
                        <Check className="w-5 h-5 text-purple-600 mx-auto" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Topping Selection */}
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-4 block">4. Choose Topping</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cakeDesignerOptions.toppings.map((topping) => (
                  <button
                    key={topping.id}
                    onClick={() => setDesign({ ...design, topping })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      design.topping.id === topping.id
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm mb-1">{topping.name}</p>
                    {topping.price > 0 && (
                      <p className="text-xs text-gray-600">+₹{topping.price}</p>
                    )}
                    {design.topping.id === topping.id && (
                      <div className="mt-2">
                        <Check className="w-5 h-5 text-purple-600 mx-auto" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Decoration Selection */}
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-4 block">5. Choose Decoration</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cakeDesignerOptions.decorations.map((decoration) => (
                  <button
                    key={decoration.id}
                    onClick={() => setDesign({ ...design, decoration })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      design.decoration.id === decoration.id
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium mb-1">{decoration.name}</p>
                        {decoration.price > 0 && (
                          <p className="text-sm text-gray-600">+₹{decoration.price}</p>
                        )}
                      </div>
                      {design.decoration.id === decoration.id && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Custom Details */}
            <Card className="p-6">
              <Label className="text-lg font-semibold mb-4 block">6. Add Personal Touch</Label>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customName">Pet's Name (Optional)</Label>
                  <Input
                    id="customName"
                    placeholder="Enter your pet's name"
                    value={design.customName}
                    onChange={(e) => setDesign({ ...design, customName: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                  <Textarea
                    id="specialInstructions"
                    placeholder="Any allergies or special requests?"
                    value={design.specialInstructions}
                    onChange={(e) => setDesign({ ...design, specialInstructions: e.target.value })}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Design</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shape:</span>
                  <span className="font-medium">{design.shape.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{design.size.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Flavor:</span>
                  <span className="font-medium">{design.flavor.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Topping:</span>
                  <span className="font-medium">{design.topping.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Decoration:</span>
                  <span className="font-medium">{design.decoration.name}</span>
                </div>
                {design.customName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pet Name:</span>
                    <span className="font-medium">{design.customName}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium">₹{design.size.price}</span>
                </div>
                {(design.shape.price + design.flavor.price + design.topping.price + design.decoration.price) > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Add-ons:</span>
                    <span className="font-medium">
                      ₹{design.shape.price + design.flavor.price + design.topping.price + design.decoration.price}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xl font-bold text-purple-600 mt-4">
                  <span>Total:</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 mb-4"
                size="lg"
              >
                Add to Cart
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Custom Order Notice</p>
                    <p className="text-xs">Custom cakes require 2-3 days advance notice. We'll contact you to confirm design details.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCakeDesigner;
