import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../utils/api';
import {
  ArrowLeft, Send, CheckCircle, Loader2, Building2, Utensils, Home,
  Scissors, Stethoscope, GraduationCap, Sun, Truck, Camera, Footprints, Star,
  MapPin, Phone, Mail, Globe, Instagram, Clock, Users
} from 'lucide-react';

const PARTNER_TYPES = [
  { id: 'restaurant', name: 'Restaurant / Café', icon: Utensils, color: '#F97316' },
  { id: 'pet_hotel', name: 'Pet Hotel', icon: Home, color: '#10B981' },
  { id: 'pet_boarding', name: 'Pet Boarding', icon: Home, color: '#059669' },
  { id: 'groomer', name: 'Grooming Salon', icon: Scissors, color: '#EC4899' },
  { id: 'vet', name: 'Veterinary Clinic', icon: Stethoscope, color: '#3B82F6' },
  { id: 'trainer', name: 'Pet Trainer', icon: GraduationCap, color: '#8B5CF6' },
  { id: 'daycare', name: 'Pet Daycare', icon: Sun, color: '#EAB308' },
  { id: 'transport', name: 'Pet Transport', icon: Truck, color: '#6366F1' },
  { id: 'photographer', name: 'Pet Photographer', icon: Camera, color: '#14B8A6' },
  { id: 'walker', name: 'Dog Walker', icon: Footprints, color: '#F43F5E' },
  { id: 'other', name: 'Other', icon: Star, color: '#64748B' }
];

const PET_FEATURES = [
  'Pet menu available',
  'Water bowls provided',
  'Outdoor seating',
  'Indoor pet area',
  'Pet treats on arrival',
  'Pet-friendly staff',
  'Secure fenced area',
  'Air-conditioned',
  'Webcam access',
  '24/7 supervision',
  'Veterinary on-call',
  'Pick-up & drop-off'
];

const STEP_TITLES = [
  'Business Type',
  'Business Details', 
  'Features & Services',
  'Documents',
  'Agreement'
];

const PartnerOnboarding = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  const [formData, setFormData] = useState({
    partner_type: '',
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    city: '',
    additional_cities: '', // For multi-city presence
    address: '',
    website: '',
    instagram: '',
    description: '',
    pet_friendly_features: [],
    operating_hours: '',
    seating_capacity: '',
    room_capacity: '',
    services_offered: [],
    price_range: '',
    how_heard_about_us: '',
    additional_notes: '',
    // Document fields
    gst_number: '',
    pan_number: '',
    company_turnover: '', // Annual turnover
    gst_document: null,
    pan_document: null,
    business_license: null,
    // Agreement fields
    agreement_accepted: false,
    signature_name: '',
    signature_date: new Date().toISOString().split('T')[0]
  });

  const updateForm = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleFeature = (feature) => {
    const current = formData.pet_friendly_features;
    if (current.includes(feature)) {
      updateForm('pet_friendly_features', current.filter(f => f !== feature));
    } else {
      updateForm('pet_friendly_features', [...current, feature]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/partners/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
          room_capacity: formData.room_capacity ? parseInt(formData.room_capacity) : null,
          // Document info (actual files would be uploaded separately)
          documents: {
            gst_number: formData.gst_number,
            pan_number: formData.pan_number,
            has_gst_doc: !!formData.gst_document,
            has_pan_doc: !!formData.pan_document,
            has_business_license: !!formData.business_license
          },
          agreement: {
            accepted: formData.agreement_accepted,
            signature_name: formData.signature_name,
            signature_date: formData.signature_date,
            signed_at: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplicationId(data.application_id);
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = PARTNER_TYPES.find(t => t.id === formData.partner_type);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your interest in partnering with The Doggy Company. 
            Our team will review your application and contact you within 3-5 business days.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Application ID: <strong>{applicationId}</strong>
          </p>
          <Link to="/">
            <Button className="bg-purple-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Become a Partner</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join India's growing pet ecosystem. Partner with The Doggy Company and reach 
            thousands of pet parents looking for pet-friendly services.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 overflow-x-auto pb-2">
          {STEP_TITLES.map((title, idx) => {
            const s = idx + 1;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                  </div>
                  <span className={`text-xs mt-1 whitespace-nowrap ${step >= s ? 'text-purple-600' : 'text-gray-400'}`}>
                    {title}
                  </span>
                </div>
                {s < 5 && (
                  <div className={`w-12 md:w-20 h-1 mx-1 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <Card className="p-8">
          {/* Step 1: Partner Type */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What type of partner are you?</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {PARTNER_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.partner_type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => updateForm('partner_type', type.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 shadow-lg' 
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div 
                        className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                        style={{ backgroundColor: type.color + '20', color: type.color }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium">{type.name}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="flex justify-end pt-6">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!formData.partner_type}
                  className="bg-purple-600"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                {selectedType && (
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedType.color + '20', color: selectedType.color }}
                  >
                    <selectedType.icon className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Business Details</h2>
                  <p className="text-gray-500">{selectedType?.name}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Business Name *</Label>
                  <Input 
                    value={formData.business_name}
                    onChange={(e) => updateForm('business_name', e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div>
                  <Label>Contact Person *</Label>
                  <Input 
                    value={formData.contact_name}
                    onChange={(e) => updateForm('contact_name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="business@email.com"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input 
                    value={formData.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input 
                    value={formData.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    placeholder="e.g. Bangalore, Mumbai"
                  />
                </div>
                <div>
                  <Label>Full Address</Label>
                  <Input 
                    value={formData.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input 
                    value={formData.website}
                    onChange={(e) => updateForm('website', e.target.value)}
                    placeholder="https://www.yoursite.com"
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input 
                    value={formData.instagram}
                    onChange={(e) => updateForm('instagram', e.target.value)}
                    placeholder="@yourbusiness"
                  />
                </div>
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Tell us about your business and what makes it special for pets..."
                  rows={4}
                />
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!formData.business_name || !formData.email || !formData.phone || !formData.city}
                  className="bg-purple-600"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Pet-Friendly Features */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pet-Friendly Features</h2>

              <div>
                <Label className="mb-3 block">Select all that apply:</Label>
                <div className="flex flex-wrap gap-2">
                  {PET_FEATURES.map((feature) => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        formData.pet_friendly_features.includes(feature)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Operating Hours</Label>
                  <Input 
                    value={formData.operating_hours}
                    onChange={(e) => updateForm('operating_hours', e.target.value)}
                    placeholder="e.g. 10 AM - 10 PM"
                  />
                </div>
                <div>
                  <Label>Price Range</Label>
                  <select 
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.price_range}
                    onChange={(e) => updateForm('price_range', e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="budget">Budget-friendly</option>
                    <option value="mid">Mid-range</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                
                {formData.partner_type === 'restaurant' && (
                  <div>
                    <Label>Seating Capacity</Label>
                    <Input 
                      type="number"
                      value={formData.seating_capacity}
                      onChange={(e) => updateForm('seating_capacity', e.target.value)}
                      placeholder="e.g. 50"
                    />
                  </div>
                )}
                
                {formData.partner_type === 'stay' && (
                  <div>
                    <Label>Room/Kennel Capacity</Label>
                    <Input 
                      type="number"
                      value={formData.room_capacity}
                      onChange={(e) => updateForm('room_capacity', e.target.value)}
                      placeholder="e.g. 20"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>How did you hear about us?</Label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.how_heard_about_us}
                  onChange={(e) => updateForm('how_heard_about_us', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="google">Google Search</option>
                  <option value="social">Social Media</option>
                  <option value="friend">Friend/Referral</option>
                  <option value="customer">I'm a customer</option>
                  <option value="event">Event/Exhibition</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea 
                  value={formData.additional_notes}
                  onChange={(e) => updateForm('additional_notes', e.target.value)}
                  placeholder="Anything else you'd like us to know..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  className="bg-purple-600"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Documents</h2>
              <p className="text-gray-600 mb-6">
                Upload your business documents for verification. This helps us ensure trust and safety for all users.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>📝 Note:</strong> Document upload is optional at this stage. You can also submit these later during the verification process.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>GST Number</Label>
                  <Input 
                    value={formData.gst_number}
                    onChange={(e) => updateForm('gst_number', e.target.value.toUpperCase())}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500 mt-1">15-character GST Identification Number</p>
                </div>
                <div>
                  <Label>PAN Number</Label>
                  <Input 
                    value={formData.pan_number}
                    onChange={(e) => updateForm('pan_number', e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">10-character PAN Card Number</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    id="gst_doc"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => updateForm('gst_document', e.target.files[0])}
                  />
                  <label htmlFor="gst_doc" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      {formData.gst_document ? (
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                      ) : (
                        <Building2 className="w-8 h-8 mx-auto" />
                      )}
                    </div>
                    <p className="font-medium text-gray-700">
                      {formData.gst_document ? formData.gst_document.name : 'Upload GST Certificate'}
                    </p>
                    <p className="text-sm text-gray-500">PDF, JPG or PNG (max 5MB)</p>
                  </label>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    id="pan_doc"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => updateForm('pan_document', e.target.files[0])}
                  />
                  <label htmlFor="pan_doc" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      {formData.pan_document ? (
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                      ) : (
                        <Building2 className="w-8 h-8 mx-auto" />
                      )}
                    </div>
                    <p className="font-medium text-gray-700">
                      {formData.pan_document ? formData.pan_document.name : 'Upload PAN Card'}
                    </p>
                    <p className="text-sm text-gray-500">PDF, JPG or PNG (max 5MB)</p>
                  </label>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    id="license_doc"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => updateForm('business_license', e.target.files[0])}
                  />
                  <label htmlFor="license_doc" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      {formData.business_license ? (
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                      ) : (
                        <Building2 className="w-8 h-8 mx-auto" />
                      )}
                    </div>
                    <p className="font-medium text-gray-700">
                      {formData.business_license ? formData.business_license.name : 'Upload Business License / FSSAI (Optional)'}
                    </p>
                    <p className="text-sm text-gray-500">Trade license, FSSAI, or registration certificate</p>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button onClick={() => setStep(5)} className="bg-purple-600">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Agreement */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner Agreement</h2>
              <p className="text-gray-600 mb-6">
                Please review and accept our partner terms to complete your application.
              </p>

              <div className="bg-gray-50 border rounded-lg p-6 max-h-64 overflow-y-auto text-sm text-gray-700 space-y-4">
                <h3 className="font-bold text-lg">The Doggy Company Partner Agreement</h3>
                
                <p><strong>1. Partnership Terms</strong></p>
                <p>By registering as a partner, you agree to provide pet-friendly services that meet our quality standards. You will maintain accurate business information and respond to customer inquiries promptly.</p>
                
                <p><strong>2. Listing & Visibility</strong></p>
                <p>Your business will be listed on The Doggy Company platform upon approval. We reserve the right to feature, promote, or adjust listing visibility based on performance and customer feedback.</p>
                
                <p><strong>3. Service Standards</strong></p>
                <p>Partners agree to maintain pet-safe environments, provide accurate service descriptions, honor published prices, and ensure staff are trained in pet handling.</p>
                
                <p><strong>4. Commission & Payments</strong></p>
                <p>Commission rates will be communicated during the approval process. Payments will be processed according to the agreed schedule.</p>
                
                <p><strong>5. Reviews & Feedback</strong></p>
                <p>Customers may leave reviews about their experience. Partners should address feedback professionally and constructively.</p>
                
                <p><strong>6. Termination</strong></p>
                <p>Either party may terminate this partnership with 30 days written notice. Violations of terms may result in immediate suspension.</p>
                
                <p><strong>7. Data Protection</strong></p>
                <p>Both parties agree to handle customer data in accordance with applicable privacy laws and not share sensitive information with third parties.</p>
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={formData.agreement_accepted}
                    onChange={(e) => updateForm('agreement_accepted', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="agreement" className="text-sm text-gray-700">
                    I have read and agree to the Partner Agreement terms and conditions. I confirm that all information provided is accurate and I am authorized to represent this business.
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Digital Signature (Full Name) *</Label>
                    <Input 
                      value={formData.signature_name}
                      onChange={(e) => updateForm('signature_name', e.target.value)}
                      placeholder="Type your full legal name"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      value={formData.signature_date}
                      onChange={(e) => updateForm('signature_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setStep(4)}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || !formData.agreement_accepted || !formData.signature_name}
                  className="bg-purple-600"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Submit Application</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Benefits Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Reach Pet Parents</h3>
            <p className="text-gray-600 text-sm">Connect with thousands of pet parents actively looking for pet-friendly services.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Grow Your Business</h3>
            <p className="text-gray-600 text-sm">Get listed on India's leading pet lifestyle platform with verified reviews.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Premium Support</h3>
            <p className="text-gray-600 text-sm">Dedicated partner success team to help you succeed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerOnboarding;
