import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  PawPrint, Plus, Calendar, Gift, Edit, Trash2, 
  Search, Crown, Moon, Mountain, Sofa, Users, 
  Utensils, Zap, Smile, ChevronRight, Heart, Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Persona icons mapping
const PERSONA_ICONS = {
  royal: Crown,
  shadow: Moon,
  adventurer: Mountain,
  couch_potato: Sofa,
  social_butterfly: Users,
  foodie: Utensils,
  athlete: Zap,
  mischief_maker: Smile
};

const PetSoulEmbed = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [personas, setPersonas] = useState({});
  const [upcomingCelebrations, setUpcomingCelebrations] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch personas
        const personasRes = await fetch(`${API_URL}/api/pets/personas`);
        if (personasRes.ok) {
          const data = await personasRes.json();
          setPersonas(data.personas || {});
        }

        // Fetch all pets
        const petsRes = await fetch(`${API_URL}/api/pets?limit=100`);
        if (petsRes.ok) {
          const data = await petsRes.json();
          setPets(data.pets || []);
        }

        // Fetch upcoming celebrations
        const celebRes = await fetch(`${API_URL}/api/celebrations/upcoming?days=30`);
        if (celebRes.ok) {
          const data = await celebRes.json();
          setUpcomingCelebrations(data.celebrations || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPets = pets.filter(pet => 
    pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to remove this pet profile?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/pets/${petId}`, { method: 'DELETE' });
      if (res.ok) {
        setPets(pets.filter(p => p.id !== petId));
      }
    } catch (error) {
      console.error('Failed to delete pet:', error);
    }
  };

  const getPersonaInfo = (pet) => {
    const persona = pet.soul?.persona || 'shadow';
    return personas[persona] || { name: 'Unknown', emoji: '🐕' };
  };

  // Open pet profile in new tab (on main site)
  const openPetProfile = (editId = null) => {
    const url = editId 
      ? `https://thedoggybakery.com/pages/pet-profile?edit=${editId}`
      : `https://thedoggybakery.com/pages/pet-profile`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-12 h-12 text-purple-600 animate-bounce mx-auto" />
          <p className="mt-4 text-gray-600">Loading your furry family...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            My Furry Family 🐾
          </h1>
          <p className="text-lg text-gray-600">
            {pets.length === 0 
              ? "Let's add your first fur baby!" 
              : `${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} in your family`
            }
          </p>
        </div>

        {/* Upcoming Celebrations Alert */}
        {upcomingCelebrations.length > 0 && (
          <Card className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-800">Upcoming Celebrations!</h3>
            </div>
            <div className="space-y-2">
              {upcomingCelebrations.slice(0, 3).map((celeb, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{celeb.emoji}</span>
                    <div>
                      <p className="font-medium text-amber-900 text-sm">
                        {celeb.pet_name}'s {celeb.occasion_name}
                      </p>
                      <p className="text-xs text-amber-700">
                        {celeb.days_until === 0 ? '🎉 TODAY!' : 
                         celeb.days_until === 1 ? 'Tomorrow!' : 
                         `In ${celeb.days_until} days`}
                      </p>
                    </div>
                  </div>
                  <a href={`https://thedoggybakery.com/collections/${celeb.recommended_collection}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 text-xs">
                      <Gift className="w-3 h-3 mr-1" />
                      Shop
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search your pets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <a href="https://thedoggybakery.com/pages/pet-profile" target="_blank" rel="noopener noreferrer">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add New Pet
            </Button>
          </a>
        </div>

        {/* Pets Grid */}
        {filteredPets.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <PawPrint className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No pets yet!</h3>
            <p className="text-gray-500 mb-5 text-sm">
              Create a profile for your furry friend and unlock personalized celebrations
            </p>
            <a href="https://thedoggybakery.com/pages/pet-profile" target="_blank" rel="noopener noreferrer">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Pet
              </Button>
            </a>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPets.map((pet) => {
              const personaInfo = getPersonaInfo(pet);
              const PersonaIcon = PERSONA_ICONS[pet.soul?.persona] || PawPrint;
              
              return (
                <Card 
                  key={pet.id} 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Pet Image/Avatar */}
                  <div className="relative h-40 bg-gradient-to-br from-purple-100 to-pink-100">
                    {pet.photo_url ? (
                      <img 
                        src={pet.photo_url} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint className="w-16 h-16 text-purple-300" />
                      </div>
                    )}
                    
                    {/* Persona Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-purple-700 shadow-sm text-xs">
                        {personaInfo.emoji} {personaInfo.name}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button 
                        className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100"
                        onClick={() => window.open(`https://thedoggybakery.com/pages/pet-profile?edit=${pet.id}`, '_blank')}
                      >
                        <Edit className="w-3 h-3 text-gray-600" />
                      </button>
                      <button 
                        className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                        onClick={() => deletePet(pet.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Pet Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{pet.name}</h3>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        pet.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                      }`}>
                        {pet.gender === 'male' ? '♂️' : '♀️'}
                      </div>
                    </div>
                    
                    <p className="text-gray-500 text-xs mb-2">
                      {pet.breed || 'Adorable Furball'} • {pet.species === 'cat' ? '🐱' : '🐕'}
                    </p>

                    {/* Soul Tag */}
                    {pet.soul?.personality_tag && (
                      <p className="text-purple-600 text-xs font-medium italic mb-2">
                        "{pet.soul.personality_tag}"
                      </p>
                    )}

                    {/* Special Move */}
                    {pet.soul?.special_move && (
                      <div className="bg-purple-50 rounded-lg p-2 mb-2">
                        <p className="text-xs text-purple-600 font-semibold mb-0.5">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          Special Move
                        </p>
                        <p className="text-xs text-purple-800">{pet.soul.special_move}</p>
                      </div>
                    )}

                    {/* Celebrations Count */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {pet.celebrations?.length || 0} celebrations
                      </div>
                      <a href="https://thedoggybakery.com/collections/cakes" target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700 text-xs h-7 px-2">
                          Shop <ChevronRight className="w-3 h-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Add New Pet Card */}
            <a href="https://thedoggybakery.com/pages/pet-profile" target="_blank" rel="noopener noreferrer">
              <Card className="h-full min-h-[320px] border-2 border-dashed border-purple-200 hover:border-purple-400 transition-all flex items-center justify-center group cursor-pointer hover:bg-purple-50/50">
                <div className="text-center p-5">
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="w-7 h-7 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-purple-700 mb-1 text-sm">Add Another Pet</h3>
                  <p className="text-xs text-gray-500">
                    Create a profile for your next furry friend
                  </p>
                </div>
              </Card>
            </a>
          </div>
        )}

        {/* Fun Fact */}
        {pets.length > 0 && (
          <div className="mt-8 text-center">
            <Card className="inline-block p-4 bg-gradient-to-r from-purple-100 to-pink-100">
              <p className="text-purple-800 text-sm">
                <Heart className="w-4 h-4 inline mr-1 text-pink-500" />
                <strong>{pets.length} furry {pets.length === 1 ? 'soul' : 'souls'}</strong> counting on you for celebrations! 
                🎂
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetSoulEmbed;
