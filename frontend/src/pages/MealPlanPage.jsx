/**
 * MealPlanPage.jsx
 * Personalized meal plan based on pet profile - NOT a form or product listing
 * Reads from existing Dog Profile and auto-generates recommendations
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Dog, Sparkles, Clock, Calendar, Truck, CheckCircle, 
  ChevronRight, PawPrint, Heart, AlertCircle, RefreshCw,
  Leaf, UtensilsCrossed, Package, Plus, Minus, Edit3,
  Sun, Moon, Coffee, MessageCircle
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// Meal plan logic based on pet profile
const generateMealPlan = (pet) => {
  if (!pet) return null;
  
  const identity = pet.identity || {};
  const age = pet.age || calculateAgeFromBirthday(pet.birthday);
  const breed = identity.breed || pet.breed || 'Mixed';
  const weight = identity.weight || 'Medium';
  const activityLevel = identity.activity_level || 'Moderate';
  const allergies = pet.health?.allergies || [];
  const preferences = pet.doggy_soul_answers?.favorite_treats || 'Chicken';
  
  // Determine life stage
  let lifeStage = 'Adult';
  if (age !== null) {
    const ageNum = typeof age === 'string' ? parseInt(age) : age;
    if (ageNum < 1) lifeStage = 'Puppy';
    else if (ageNum > 7) lifeStage = 'Senior';
  }
  
  // Determine size category
  let sizeCategory = 'Medium';
  if (weight) {
    const weightStr = weight.toString().toLowerCase();
    if (weightStr.includes('small') || weightStr.includes('toy') || parseInt(weightStr) < 10) {
      sizeCategory = 'Small';
    } else if (weightStr.includes('large') || weightStr.includes('giant') || parseInt(weightStr) > 25) {
      sizeCategory = 'Large';
    }
  }
  
  // Determine portion size
  let portionSize = 'Regular';
  if (sizeCategory === 'Small') portionSize = 'Small';
  else if (sizeCategory === 'Large') portionSize = 'Generous';
  if (activityLevel?.toLowerCase().includes('high') || activityLevel?.toLowerCase().includes('very')) {
    portionSize = portionSize === 'Small' ? 'Regular' : 'Generous';
  }
  
  // Determine meal frequency
  let mealsPerDay = 2;
  if (lifeStage === 'Puppy') mealsPerDay = 3;
  else if (lifeStage === 'Senior') mealsPerDay = 2;
  
  // Determine protein preference (excluding allergies)
  const proteins = ['Chicken', 'Lamb', 'Fish', 'Turkey', 'Beef'];
  const safeProteins = proteins.filter(p => 
    !allergies.some(a => a.toLowerCase().includes(p.toLowerCase()))
  );
  const recommendedProtein = safeProteins[0] || 'Chicken';
  
  return {
    petName: pet.name,
    lifeStage,
    sizeCategory,
    activityLevel: activityLevel || 'Moderate',
    portionSize,
    mealsPerDay,
    preferences: preferences || 'Balanced',
    allergies,
    recommendedProtein,
    mealCategory: 'Fresh & Baked Mix',
    whyThisPlan: `This plan is designed for ${lifeStage === 'Puppy' ? 'a growing puppy' : lifeStage === 'Senior' ? 'a senior dog' : 'an adult dog'}, ${sizeCategory.toLowerCase()}-sized with ${activityLevel?.toLowerCase() || 'moderate'} activity levels${preferences ? ` and a preference for ${preferences.toLowerCase()}-based meals` : ''}.`
  };
};

const calculateAgeFromBirthday = (birthday) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  return Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
};

const MealPlanPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  
  // Autoship state
  const [autoshipFrequency, setAutoshipFrequency] = useState('biweekly');
  const [autoshipPaused, setAutoshipPaused] = useState(false);
  const [nextDelivery, setNextDelivery] = useState(null);
  
  // Fetch pets and products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user's pets
        if (token) {
          const petsRes = await fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (petsRes.ok) {
            const petsData = await petsRes.json();
            setPets(petsData.pets || []);
            if (petsData.pets?.length > 0) {
              setSelectedPet(petsData.pets[0]);
              setMealPlan(generateMealPlan(petsData.pets[0]));
            }
          }
        }
        
        // Fetch fresh meal products
        const productsRes = await fetch(`${API_URL}/api/products?pillar=feed&limit=20`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
        }
        
        // Set next delivery date
        const today = new Date();
        const nextDel = new Date(today);
        nextDel.setDate(today.getDate() + (autoshipFrequency === 'weekly' ? 7 : autoshipFrequency === 'biweekly' ? 14 : 30));
        setNextDelivery(nextDel);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, autoshipFrequency]);
  
  // Update meal plan when pet changes
  useEffect(() => {
    if (selectedPet) {
      setMealPlan(generateMealPlan(selectedPet));
    }
  }, [selectedPet]);
  
  // Filter products based on meal plan
  const getRecommendedProducts = () => {
    if (!mealPlan || !products.length) return { dailyMeals: [], treats: [], celebrationItems: [] };
    
    const safeProducts = products.filter(p => {
      // Check if product contains any allergens
      const productText = `${p.name} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
      return !mealPlan.allergies.some(a => productText.includes(a.toLowerCase()));
    });
    
    return {
      dailyMeals: safeProducts.filter(p => 
        p.name?.toLowerCase().includes('meal') || 
        p.name?.toLowerCase().includes('fresh') ||
        p.category?.toLowerCase().includes('meal')
      ).slice(0, 3),
      treats: safeProducts.filter(p => 
        p.name?.toLowerCase().includes('treat') || 
        p.name?.toLowerCase().includes('biscuit') ||
        p.category?.toLowerCase().includes('treat')
      ).slice(0, 2),
      celebrationItems: safeProducts.filter(p => 
        p.name?.toLowerCase().includes('cake') || 
        p.name?.toLowerCase().includes('pupcake') ||
        p.name?.toLowerCase().includes('special')
      ).slice(0, 2)
    };
  };
  
  const recommendedProducts = getRecommendedProducts();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-700">Preparing your meal plan...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Dog className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign in to view your meal plan</h1>
          <p className="text-gray-600 mb-6">Your personalized meal plan is built from your pet's profile.</p>
          <Button onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600">
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <PawPrint className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Add your pet to get started</h1>
          <p className="text-gray-600 mb-6">We'll create a personalized meal plan based on your pet's profile.</p>
          <Button onClick={() => navigate('/my-pets')} className="bg-amber-500 hover:bg-amber-600">
            Add Your Pet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      <Helmet>
        <title>{mealPlan?.petName}'s Meal Plan | The Doggy Company</title>
      </Helmet>
      
      {/* Header - Dynamic */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Pet Selector (if multiple pets) */}
          {pets.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedPet?.id === pet.id 
                      ? 'bg-white text-amber-600' 
                      : 'bg-amber-500/30 text-white hover:bg-amber-500/50'
                  }`}
                >
                  🐕 {pet.name}
                </button>
              ))}
            </div>
          )}
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {mealPlan?.petName}'s Meal Plan
          </h1>
          <p className="text-amber-100 text-lg">
            Based on age, breed size, activity level, preferences and sensitivities already on file.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Why This Plan Section */}
        <Card className="p-6 border-2 border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-800 mb-2">Why this plan?</h2>
              <p className="text-amber-700">{mealPlan?.whyThisPlan}</p>
              
              {/* Profile Summary */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  {mealPlan?.lifeStage}
                </Badge>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  {mealPlan?.sizeCategory} breed
                </Badge>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  {mealPlan?.activityLevel} activity
                </Badge>
                {mealPlan?.allergies?.length > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    Avoids: {mealPlan.allergies.join(', ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Meal Structure Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            Meal Structure
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-50 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{mealPlan?.mealsPerDay}</div>
              <div className="text-sm text-gray-600">Meals per day</div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600 capitalize">{mealPlan?.portionSize}</div>
              <div className="text-sm text-gray-600">Portion size</div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <Leaf className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-purple-600">{mealPlan?.mealCategory}</div>
              <div className="text-sm text-gray-600">Meal type</div>
            </div>
          </div>
          
          {/* Meal Times */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-700 mb-3">Suggested Meal Times</h3>
            <div className="flex flex-wrap gap-3">
              {mealPlan?.mealsPerDay >= 1 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Morning: 7-9 AM</span>
                </div>
              )}
              {mealPlan?.mealsPerDay >= 2 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm">Evening: 5-7 PM</span>
                </div>
              )}
              {mealPlan?.mealsPerDay >= 3 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                  <Coffee className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Midday: 12-2 PM</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Included Items Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            What's Included
          </h2>
          
          {/* Daily Meals */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Daily Meals
            </h3>
            {recommendedProducts.dailyMeals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommendedProducts.dailyMeals.map((product, idx) => (
                  <Link key={product.id || idx} to={`/product/${product.slug || product.id}`} className="block">
                    <div className="p-3 border rounded-xl hover:shadow-md transition-shadow bg-white">
                      <img 
                        src={product.image_url || product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=200'} 
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                      <h4 className="font-medium text-sm text-gray-800 line-clamp-2">{product.name}</h4>
                      <p className="text-amber-600 font-semibold text-sm mt-1">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Fresh meal products will be recommended based on availability.</p>
            )}
          </div>
          
          {/* Occasional Treats */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              Occasional Treat Pairings
            </h3>
            {recommendedProducts.treats.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recommendedProducts.treats.map((product, idx) => (
                  <Link key={product.id || idx} to={`/product/${product.slug || product.id}`} className="block flex-shrink-0 w-40">
                    <div className="p-3 border rounded-xl hover:shadow-md transition-shadow bg-white">
                      <img 
                        src={product.image_url || product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1582798358481-d199fb7347bb?w=200'} 
                        alt={product.name}
                        className="w-full h-20 object-cover rounded-lg mb-2"
                      />
                      <h4 className="font-medium text-xs text-gray-800 line-clamp-2">{product.name}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Healthy treat options will be suggested.</p>
            )}
          </div>
          
          {/* Celebration Items */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-pink-500" />
              Celebration & Enrichment Add-ons
              <Badge className="bg-gray-100 text-gray-600 text-xs">Optional</Badge>
            </h3>
            {recommendedProducts.celebrationItems.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recommendedProducts.celebrationItems.map((product, idx) => (
                  <Link key={product.id || idx} to={`/product/${product.slug || product.id}`} className="block flex-shrink-0 w-40">
                    <div className="p-3 border rounded-xl hover:shadow-md transition-shadow bg-white">
                      <img 
                        src={product.image_url || product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200'} 
                        alt={product.name}
                        className="w-full h-20 object-cover rounded-lg mb-2"
                      />
                      <h4 className="font-medium text-xs text-gray-800 line-clamp-2">{product.name}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Special occasion treats available for birthdays and celebrations.</p>
            )}
          </div>
        </Card>

        {/* Autoship & Schedule Section */}
        <Card className="p-6 border-2 border-green-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            Autoship & Schedule
          </h2>
          
          <div className="space-y-4">
            {/* Delivery Frequency */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Delivery Frequency</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'biweekly', label: 'Every 2 weeks' },
                  { value: 'monthly', label: 'Monthly' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setAutoshipFrequency(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      autoshipFrequency === option.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Next Delivery */}
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Next delivery</p>
                  <p className="text-lg font-bold text-green-800">
                    {nextDelivery?.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAutoshipPaused(!autoshipPaused)}
                    className={autoshipPaused ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : ''}
                  >
                    {autoshipPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button variant="outline" size="sm">
                    Skip Next
                  </Button>
                </div>
              </div>
              {autoshipPaused && (
                <p className="text-sm text-yellow-700 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Autoship is paused. Resume to continue deliveries.
                </p>
              )}
            </div>
            
            {/* Savings */}
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>You're saving <strong>15%</strong> with Autoship on every order!</span>
            </div>
          </div>
        </Card>

        {/* Adjustment Trigger */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800">Need to adjust this plan?</h3>
                <p className="text-sm text-purple-600">Changes to your pet's profile will update recommendations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
                onClick={() => navigate(`/my-pets`)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
              <Button 
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask Mira
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer Reassurance */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            This meal plan evolves as {mealPlan?.petName} grows. We'll update recommendations when profile changes are made.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MealPlanPage;
