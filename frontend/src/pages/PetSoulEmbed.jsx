import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { 
  PawPrint, Heart, Calendar, Sparkles, ChevronRight, 
  ChevronLeft, Check, Camera, Plus
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PetSoulEmbed = () => {
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    birthday: '',
    gotchaDay: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    favoriteFood: '',
    favoriteActivity: '',
    personality: '',
    allergies: '',
    specialNeeds: '',
    photoUrl: ''
  });

  // Soul questions for pet personality
  const soulQuestions = [
    { id: 'favoriteFood', question: "What's their favorite treat?", icon: '🍖' },
    { id: 'favoriteActivity', question: "Favorite activity?", icon: '🎾' },
    { id: 'personality', question: "Describe their personality in 3 words", icon: '✨' },
  ];

  useEffect(() => {
    // Check if user has existing pets via email in localStorage
    const savedEmail = localStorage.getItem('tdb_pet_email');
    if (savedEmail) {
      fetchPets(savedEmail);
    }
  }, []);

  const fetchPets = async (email) => {
    try {
      const res = await fetch(`${API_URL}/api/pets?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setPets(data.pets || []);
      }
    } catch (err) {
      console.error('Failed to fetch pets:', err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.parentEmail) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'shopify_embed'
        })
      });
      
      if (res.ok) {
        localStorage.setItem('tdb_pet_email', formData.parentEmail);
        setSubmitted(true);
        fetchPets(formData.parentEmail);
      }
    } catch (err) {
      console.error('Failed to save pet:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white p-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Family! 🎉</h2>
          <p className="text-gray-600 mb-6">
            {formData.name}'s profile has been created. We'll send you special treats and reminders for their celebrations!
          </p>
          <Button 
            onClick={() => { setSubmitted(false); setShowForm(false); setStep(1); setFormData({...formData, name: '', breed: '', birthday: '', gotchaDay: ''}); }}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Pet
          </Button>
        </Card>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PawPrint className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Pet Soul</h1>
        </div>
        <p className="text-purple-100 text-sm">Create a profile for your furry friend</p>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Existing Pets */}
        {pets.length > 0 && !showForm && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Your Pets</h3>
            <div className="space-y-2">
              {pets.map((pet, idx) => (
                <Card key={idx} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl">
                    🐕
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{pet.name}</p>
                    <p className="text-sm text-gray-500">{pet.breed}</p>
                  </div>
                </Card>
              ))}
            </div>
            <Button 
              onClick={() => setShowForm(true)} 
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Pet
            </Button>
          </div>
        )}

        {/* Form Steps */}
        {(showForm || pets.length === 0) && (
          <Card className="p-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-purple-600" />
                  Basic Info
                </h2>
                
                <div>
                  <Label>Pet's Name *</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Bruno"
                  />
                </div>
                
                <div>
                  <Label>Breed</Label>
                  <Input 
                    value={formData.breed}
                    onChange={(e) => setFormData({...formData, breed: e.target.value})}
                    placeholder="e.g., Golden Retriever"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Birthday 🎂</Label>
                    <Input 
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Gotcha Day 🏠</Label>
                    <Input 
                      type="date"
                      value={formData.gotchaDay}
                      onChange={(e) => setFormData({...formData, gotchaDay: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Soul Questions */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Pet Soul Questions
                </h2>
                <p className="text-sm text-gray-500">Help us understand your pet better!</p>
                
                {soulQuestions.map((q) => (
                  <div key={q.id}>
                    <Label>{q.icon} {q.question}</Label>
                    <Input 
                      value={formData[q.id]}
                      onChange={(e) => setFormData({...formData, [q.id]: e.target.value})}
                      placeholder="Type your answer..."
                    />
                  </div>
                ))}
                
                <div>
                  <Label>Any allergies or dietary restrictions?</Label>
                  <Input 
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    placeholder="e.g., Chicken allergy"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Parent Info */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-600" />
                  Pet Parent Info
                </h2>
                <p className="text-sm text-gray-500">So we can send you celebration reminders!</p>
                
                <div>
                  <Label>Your Name</Label>
                  <Input 
                    value={formData.parentName}
                    onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <Label>WhatsApp Number</Label>
                  <Input 
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !formData.name}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.parentEmail || isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {isSubmitting ? 'Saving...' : 'Create Profile'}
                  <Check className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Benefits */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="mb-2">✨ Benefits of Pet Soul Profile:</p>
          <ul className="space-y-1">
            <li>🎂 Birthday & Gotcha Day reminders</li>
            <li>🎁 Special treats on celebrations</li>
            <li>💜 Personalized recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PetSoulEmbed;
