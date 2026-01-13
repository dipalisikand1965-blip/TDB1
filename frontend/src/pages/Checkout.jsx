import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, CreditCard, Truck, MapPin, Phone, MessageCircle, CheckCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '919663185747';
const BUSINESS_EMAIL = 'woof@thedoggybakery.com';

const addOns = [
  { id: 'ao-1', name: 'Birthday Bandana', price: 299 },
  { id: 'ao-2', name: 'Party Hat', price: 199 },
  { id: 'ao-3', name: 'Paw Balm', price: 350 },
  { id: 'ao-4', name: 'Treat Pack (100g)', price: 150 }
];

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, addToCart } = useCart();
  const navigate = useNavigate();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
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

  const handleAddOn = (addOn) => {
    addToCart({
      ...addOn,
      image: 'https://placehold.co/100x100?text=Add+On',
      description: 'Quick add-on item'
    }, 'Standard', 'Standard');
    toast({ title: "Added!", description: `${addOn.name} added to order.` });
  };

  // Generate order summary for WhatsApp
  const generateWhatsAppUrl = (orderData) => {
    const deliveryFee = 75;
    const total = getCartTotal() + deliveryFee;
    
    const message = `🐕 *New Order Request - The Doggy Bakery*
    
*Status:* Pending Payment
*GST:* Applicable on final invoice

*Customer Details:*
Name: ${orderData.name}
Phone: ${orderData.phone}
Email: ${orderData.email}

*Order Details:*
${cartItems.map(item => `
• *${item.name}*
  - Variant: ${item.selectedSize}, ${item.selectedFlavor}
  - Qty: ${item.quantity}
  - Price: ₹${item.price * item.quantity}
  ${item.customDetails ? `- Details: ${item.customDetails.petName || ''} ${item.customDetails.age ? `(Age: ${item.customDetails.age})` : ''} ${item.customDetails.date ? `| Del: ${new Date(item.customDetails.date).toDateString()}` : ''}` : ''}
`).join('')}

*Summary:*
Subtotal: ₹${getCartTotal()}
Delivery: ₹${deliveryFee}
*Total Est: ₹${total}*

_Please send payment link to confirm order._`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const deliveryFee = 75;
    const total = getCartTotal() + deliveryFee;
    
    // Generate WhatsApp URL before clearing cart
    const waUrl = generateWhatsAppUrl(formData);
    setWhatsappUrl(waUrl);
    
    // Store order details for confirmation screen
    setOrderDetails({
      items: [...cartItems],
      customer: { ...formData },
      total,
      orderId: `TDB-${Date.now().toString(36).toUpperCase()}`
    });
    
    // Show order placed
    setIsOrderPlaced(true);
    
    toast({
      title: 'Order placed successfully! 🎉',
      description: 'Please confirm your order on WhatsApp to complete.',
    });
    
    clearCart();
  };

  // Order confirmation screen with WhatsApp CTA
  if (isOrderPlaced && orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Order Received! 🎉
            </h1>
            
            <p className="text-gray-600 mb-2">Order ID: <span className="font-mono font-bold text-purple-600">{orderDetails.orderId}</span></p>
            <p className="text-gray-600 mb-8">
              Thank you, {orderDetails.customer.name}! Your pawsome treats are being prepared.
            </p>

            {/* WhatsApp Confirmation CTA */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Confirm on WhatsApp</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                To complete your order and get real-time updates, please confirm via WhatsApp. 
                Our team will respond within minutes!
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold text-lg inline-flex items-center gap-2"
                data-testid="whatsapp-confirm-btn"
              >
                <MessageCircle className="w-5 h-5" />
                Confirm on WhatsApp
              </a>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                {orderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} x{item.quantity}</span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-bold text-purple-600">
                  <span>Total</span>
                  <span>₹{orderDetails.total}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-sm text-gray-500 space-y-2">
              <p>Questions? Contact us:</p>
              <p className="font-medium">📧 {BUSINESS_EMAIL}</p>
              <p className="font-medium">📱 +91 96631 85747</p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="mt-8"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

              {/* Add-ons Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">🎉 Last Minute Add-ons?</h3>
                <div className="space-y-2">
                  {addOns.map(addon => (
                    <div key={addon.id} className="flex justify-between items-center bg-white p-2 rounded border border-yellow-100">
                      <span className="text-sm font-medium">{addon.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">₹{addon.price}</span>
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleAddOn(addon)}>Add</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST & Payment Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-xs text-blue-800">
                <p><strong>Note:</strong> GST will be applicable on the final invoice. A secure payment link including taxes will be sent to your WhatsApp/Email upon order confirmation.</p>
                <p className="mt-1">Once payment is made, we start the baking! 🧁</p>
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
