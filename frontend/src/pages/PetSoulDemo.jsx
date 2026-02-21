/**
 * Demo page to showcase Pet Soul Answers component
 * This can be removed after testing
 */

import React from 'react';
import PetSoulAnswers from '../components/PetSoulAnswers';

// Mock pet data for demo
const mockPet = {
  id: 'demo-pet-123',
  name: 'Mojo',
  breed: 'Golden Retriever',
  dob: '2020-03-15',
  age: '4 years',
  gender: 'male',
  weight: '32 kg',
  size: 'Large',
  overall_score: 45,
  
  // Identity data
  identity: {
    general_nature: 'Calm but playful',
    describe_3_words: 'Loyal, Gentle, Playful',
    stranger_reaction: 'Very friendly',
    handling_comfort: 'Very comfortable',
    loud_sounds: 'A bit anxious'
  },
  
  // Soul answers from onboarding and Mira chats
  doggy_soul_answers: {
    most_attached_to: 'Mom (Dipali)',
    behavior_with_dogs: 'Loves all dogs',
    behavior_with_humans: 'Super friendly',
    other_pets: 'One cat sister - Mystique',
    
    walks_per_day: '3 walks',
    energetic_time: 'Morning and evening',
    separation_anxiety: 'Sometimes anxious',
    
    sleeping_spot: 'At the foot of the bed',
    crate_trained: 'Yes, very comfortable',
    favorite_spot: 'The sunny spot near the window',
    
    car_rides: 'Loves them!',
    travel_style: 'Prefers car travel',
    
    food_allergies: ['Chicken', 'Wheat'],
    favorite_treats: ['Cheese', 'Peanut butter', 'Carrots'],
    dislikes: ['Fish'],
    diet_type: 'Home-cooked with kibble',
    sensitive_stomach: 'No',
    
    training_level: 'Well trained',
    commands_known: ['Sit', 'Stay', 'Come', 'Paw', 'Down', 'Leave it'],
    leash_behavior: 'Good, occasional pulling',
    
    medical_conditions: ['Hip dysplasia - mild'],
    medications: ['Joint supplements'],
    vet_name: 'Dr. Sharma at PetCare Clinic',
    vaccination_status: 'Up to date',
    spayed_neutered: true
  }
};

const PetSoulDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pet Soul Answers Demo</h1>
          <p className="text-gray-500">Click on any section to expand and see questions + answers</p>
        </div>
        
        <PetSoulAnswers 
          pet={mockPet}
          onEdit={(questionId) => alert(`Edit: ${questionId}`)}
          showUnanswered={true}
        />
      </div>
    </div>
  );
};

export default PetSoulDemo;
