import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import PetSoulEnhanced from '../components/PetSoulEnhanced';

const PetSoulPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  
  const handleComplete = () => {
    navigate('/my-pets');
  };
  
  return (
    <>
      <Helmet>
        <title>Pet Soul - Build Your Dog's Profile | The Doggy Company</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/my-pets" className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
              <ChevronLeft className="w-5 h-5" />
              <span>Back to My Pets</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <span className="font-bold text-purple-900">Doggy Soul</span>
            </div>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" /> Home
              </Button>
            </Link>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4">
          <PetSoulEnhanced petId={petId} onComplete={handleComplete} />
        </main>
        
        {/* Footer */}
        <footer className="mt-16 py-8 border-t bg-white/50">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-gray-500 text-sm">
              🐕 Building the world's most accurate personalized pet profile
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Your data helps us personalize every experience across all pillars
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PetSoulPage;
