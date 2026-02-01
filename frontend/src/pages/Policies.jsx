import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  Shield, 
  ScrollText, 
  Truck,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Sparkles,
  Brain
} from 'lucide-react';

const Policies = () => {
  const [activePolicy, setActivePolicy] = useState('refund');

  const policies = [
    { id: 'refund', name: 'Refund Policy', icon: FileText },
    { id: 'privacy', name: 'Privacy Policy', icon: Shield },
    { id: 'terms', name: 'Terms of Service', icon: ScrollText },
    { id: 'shipping', name: 'Shipping Policy', icon: Truck },
    { id: 'ai', name: 'AI Disclaimer', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Policies & Terms
          </h1>
          <p className="text-gray-600">
            Please read our policies carefully before making a purchase.
          </p>
        </div>

        {/* Policy Navigation */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {policies.map((policy) => {
            const Icon = policy.icon;
            return (
              <button
                key={policy.id}
                onClick={() => setActivePolicy(policy.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  activePolicy === policy.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-purple-50 border'
                }`}
                data-testid={`policy-tab-${policy.id}`}
              >
                <Icon className="w-4 h-4" />
                {policy.name}
              </button>
            );
          })}
        </div>

        {/* Policy Content */}
        <Card className="p-6 md:p-10">
          {/* Refund Policy */}
          {activePolicy === 'refund' && (
            <div className="prose max-w-none" data-testid="refund-policy">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Refund Policy
              </h2>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                <p className="text-yellow-800">
                  <strong>Important:</strong> We do not accept refunds or cancellations of orders after they have been delivered.
                </p>
              </div>

              <p className="text-gray-700 mb-4">
                Due to the perishable nature of our products (freshly baked cakes and treats), 
                we are unable to offer refunds or accept returns once an order has been delivered.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Discrepancies in Order</h3>
              <p className="text-gray-700 mb-4">
                In case of any discrepancies in your order (wrong item, damaged product, missing items), 
                please contact us within 24 hours of delivery with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Your order number</li>
                <li>Clear photos of the issue</li>
                <li>Detailed description of the problem</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Contact Us</h3>
              <p className="text-gray-700">
                For any order-related concerns, please email us at{' '}
                <a href="mailto:woof@thedoggybakery.in" className="text-purple-600 hover:underline">
                  woof@thedoggybakery.in
                </a>
              </p>
            </div>
          )}

          {/* Privacy Policy */}
          {activePolicy === 'privacy' && (
            <div className="prose max-w-none" data-testid="privacy-policy">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                Privacy Policy
              </h2>

              <p className="text-gray-700 mb-4">
                This policy explains our privacy practices for The Doggy Company website and services.
                By using our services, you accept the terms of this privacy policy.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">What Personal Data We Collect</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Contact details (name, phone number, email)</li>
                <li>Personal information (date of birth, nationality)</li>
                <li>Delivery address and payment details</li>
                <li>Device information (IP address, browser type)</li>
                <li>Communication preferences and history</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">How We Use Personal Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Meeting our obligations to customers</li>
                <li>Making our products and services available to you</li>
                <li>Personalizing your shopping experience</li>
                <li>Improving our service</li>
                <li>Managing customer relationships</li>
                <li>Securing your use of our website</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Sharing Personal Data</h3>
              <p className="text-gray-700 mb-4">
                We do not sell your personal data. We may share information with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Affiliated businesses to improve services</li>
                <li>Service providers who help deliver our services</li>
                <li>Legal authorities when required by law</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Security</h3>
              <p className="text-gray-700 mb-4">
                Your account is password-protected. We implement security procedures 
                to protect your information. Credit card information is always encrypted 
                during transfer over networks.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Communication & Marketing</h3>
              <p className="text-gray-700 mb-4">
                As a registered member, you may receive promotional emails. 
                You can opt-out anytime by emailing us at{' '}
                <a href="mailto:woof@thedoggybakery.in" className="text-purple-600 hover:underline">
                  woof@thedoggybakery.in
                </a>
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Privacy Inquiries</h3>
              <p className="text-gray-700">
                For privacy-related concerns, contact us at{' '}
                <a href="mailto:woof@thedoggybakery.in" className="text-purple-600 hover:underline">
                  woof@thedoggybakery.in
                </a>
              </p>
            </div>
          )}

          {/* Terms of Service */}
          {activePolicy === 'terms' && (
            <div className="prose max-w-none" data-testid="terms-policy">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ScrollText className="w-6 h-6 text-purple-600" />
                Terms of Service
              </h2>

              <p className="text-gray-700 mb-4">
                This website is operated by The Doggy Company. By visiting our site and/or 
                purchasing something from us, you engage in our "Service" and agree to be 
                bound by the following terms and conditions.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">1. Online Store Terms</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years old to use this site. You may not use our 
                products for any illegal purpose. A breach of any Terms will result in 
                immediate termination of Services.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">2. General Conditions</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to refuse service to anyone. Credit card information 
                is always encrypted during transfer. You agree not to reproduce or exploit 
                any portion of the Service without written permission.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">3. Accuracy of Information</h3>
              <p className="text-gray-700 mb-4">
                We are not responsible if information on this site is not accurate or current. 
                The material is provided for general information only. We reserve the right 
                to modify contents at any time.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">4. Products & Services</h3>
              <p className="text-gray-700 mb-4">
                Products may have limited quantities. We have made every effort to display 
                colors and images accurately. We reserve the right to limit sales, discontinue 
                products, or change pricing at any time.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">5. Billing & Account</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to refuse any order. You agree to provide accurate 
                purchase and account information. We may limit or cancel orders that appear 
                to be placed by dealers or resellers.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">6. Third-Party Links</h3>
              <p className="text-gray-700 mb-4">
                Third-party links may direct you to websites not affiliated with us. 
                We are not responsible for third-party content or practices.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">7. Prohibited Uses</h3>
              <p className="text-gray-700 mb-4">
                You are prohibited from using the site for unlawful purposes, to violate 
                regulations, infringe intellectual property, harass others, submit false 
                information, or interfere with security features.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">8. Disclaimer & Liability</h3>
              <p className="text-gray-700 mb-4">
                We do not guarantee uninterrupted or error-free service. The service is 
                provided 'as is'. We shall not be liable for any damages arising from 
                your use of the service.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">9. Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by the laws of India with jurisdiction 
                in Jaipur, Rajasthan.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Contact</h3>
              <p className="text-gray-700">
                Questions about Terms of Service:{' '}
                <a href="mailto:woof@thedoggybakery.in" className="text-purple-600 hover:underline">
                  woof@thedoggybakery.in
                </a>
              </p>
            </div>
          )}

          {/* Shipping Policy */}
          {activePolicy === 'shipping' && (
            <div className="prose max-w-none" data-testid="shipping-policy">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Truck className="w-6 h-6 text-purple-600" />
                Shipping Policy
              </h2>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p className="text-green-800">
                  <strong>Same Day Delivery!</strong> Available in Mumbai, Bangalore & Gurgaon 
                  for all orders placed by 6:00 PM.
                </p>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3">Delivery Options</h3>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Local Delivery (Mumbai, Bangalore, Gurgaon)</h4>
                  <ul className="list-disc pl-6 text-gray-700 mt-2">
                    <li>Same-day delivery for orders before 6:00 PM</li>
                    <li>Delivery fee: ₹75</li>
                    <li>Free delivery for Premium & VIP members</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Pan-India Delivery</h4>
                  <ul className="list-disc pl-6 text-gray-700 mt-2">
                    <li>Standard shipping across India</li>
                    <li>Delivery fee: ₹150</li>
                    <li>Delivery time: 2-5 business days</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Pickup from Bakery</h4>
                  <ul className="list-disc pl-6 text-gray-700 mt-2">
                    <li>Available at our bakery locations</li>
                    <li>No delivery charges</li>
                    <li>Call to arrange pickup time</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3">Payment on Delivery</h3>
              <p className="text-gray-700 mb-4">
                For Payment on Delivery, please call us on{' '}
                <a href="tel:+919663185747" className="text-purple-600 hover:underline">
                  9663185747
                </a>
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Important Notes</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>All cakes and fresh items are made to order</li>
                <li>Please provide accurate delivery address and contact number</li>
                <li>Someone must be available to receive the order</li>
                <li>Products are perishable - consume within recommended time</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Contact for Delivery</h3>
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <a href="tel:+919663185747" className="hover:text-purple-600">+91 96631 85747</a>
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <a href="mailto:woof@thedoggybakery.in" className="hover:text-purple-600">woof@thedoggybakery.in</a>
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Last Updated */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Last updated: January 2025
        </p>
      </div>
    </div>
  );
};

export default Policies;
