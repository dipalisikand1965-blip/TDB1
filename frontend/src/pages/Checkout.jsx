import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, CreditCard, Truck, MapPin, Phone } from 'lucide-react';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    petName: '',
    deliveryNotes: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock order placement
    toast({
      title: 'Order placed successfully! 🎉',
      description: `Order total: ₹${getCartTotal()}. We'll contact you shortly to confirm.`,
    });
    clearCart();
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some treats to get started!</p>
          <Button onClick={() => navigate('/cakes')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const deliveryFee = 75;
  const total = getCartTotal() + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Phone className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Contact Information</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="petName">Pet's Name</Label>
                    <Input
                      id="petName"
                      name="petName"
                      value={formData.petName}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>
              </Card>

              {/* Delivery Address */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Delivery Address</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                    <Textarea
                      id="deliveryNotes"
                      name="deliveryNotes"
                      value={formData.deliveryNotes}
                      onChange={handleInputChange}
                      placeholder="Any special delivery instructions?"
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center p-4 border-2 border-purple-600 rounded-lg bg-purple-50">
                    <input
                      type="radio"
                      id="cod"
                      name="payment"
                      defaultChecked
                      className="w-4 h-4 text-purple-600"
                    />
                    <label htmlFor="cod" className="ml-3 flex-1">
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </label>
                  </div>
                  <div className="flex items-center p-4 border rounded-lg opacity-50">
                    <input
                      type="radio"
                      id="online"
                      name="payment"
                      disabled
                      className="w-4 h-4"
                    />
                    <label htmlFor="online" className="ml-3 flex-1">
                      <p className="font-medium">Online Payment (Coming Soon)</p>
                      <p className="text-sm text-gray-600">Credit/Debit Card, UPI, Wallets</p>
                    </label>
                  </div>
                </div>
              </Card>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.itemId} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.selectedSize} | {item.selectedFlavor}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {item.quantity} x ₹{item.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{getCartTotal()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-purple-600 pt-3 border-t">
                  <span>Total:</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full mt-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                size="lg"
              >
                Place Order
              </Button>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Same-day delivery for orders placed by 6 PM in Mumbai & Bangalore</p>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Secure payment options available</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
