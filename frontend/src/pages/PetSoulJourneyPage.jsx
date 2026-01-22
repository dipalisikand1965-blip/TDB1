import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, PawPrint, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import PetSoulJourney from '../components/PetSoulJourney';

const PetSoulJourneyPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getApiUrl()}/api/pets/${petId}`);
        if (!response.ok) {
          throw new Error('Pet not found');
        }
        const data = await response.json();
        setPet(data.pet || data);
      } catch (err) {
        console.error('Error fetching pet:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (petId) {
      fetchPet();
    }
  }, [petId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-12 h-12 animate-bounce mx-auto text-purple-500 mb-4" />
          <p className="text-gray-600">Loading Pet Soul...</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pet Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load this pet\'s profile'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  // Create a mock user and pets array for PetSoulJourney component
  const mockUser = { name: 'Admin View', email: '' };
  const pets = [pet];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Admin Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <span className="text-sm text-gray-500">Admin View</span>
          <span className="text-sm font-medium text-purple-600">{pet.name}'s Pet Soul Journey</span>
        </div>
      </div>

      {/* Pet Soul Journey Component */}
      <PetSoulJourney 
        user={mockUser} 
        pets={pets}
        onOpenMira={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
      />
    </div>
  );
};

export default PetSoulJourneyPage;
