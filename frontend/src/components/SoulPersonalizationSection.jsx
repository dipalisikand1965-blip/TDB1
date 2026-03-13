/**
 * SoulPersonalizationSection.jsx
 * 
 * THE CENTERPIECE - The deeply personalized "Pet Operating System layer" 
 * that shows pillar-specific insights based on the pet's full soul profile.
 * 
 * This is what makes The Doggy Company different from HUFT or any other pet platform.
 * Not generic advice, but personalized recommendations shaped around the pet's:
 * - Soul archetype (social butterfly, couch commander, etc.)
 * - Personality traits (calm, drama-queen, food-motivated)
 * - Health data (allergies, sensitivities)
 * - Preferences (favorite treats, activity level)
 * - Relationships (dog friends, human favorites)
 * - Learned facts from Mira conversations
 * 
 * WHERE IT APPEARS: Celebrate, Care, Dine, Stay, Fit, Learn, Enjoy, Travel, Shop, Advisory, Adopt
 * EXCLUDED FROM: Farewell, Emergency, Paperwork
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Sparkles, Heart, Home, Package, Utensils, PawPrint, 
  Plane, Bed, Dumbbell, GraduationCap, PartyPopper, 
  ShoppingBag, Shield, Gift
} from 'lucide-react';
import { usePillarContext } from '../context/PillarContext';
import SoulScoreArc from './SoulScoreArc';
import MiraLoveNote from './MiraLoveNote';

// Pillar-specific configuration
const PILLAR_CONFIG = {
  celebrate: {
    title: (petName) => `A celebration made for ${petName}`,
    subtitle: (petName, breed) => `Not generic party ideas — a celebration shaped around ${petName}'s personality, favorite things, and the people who love them.`,
    icon: PartyPopper,
    color: 'pink',
    gradient: 'from-pink-50/80 to-white',
    cardGradient: 'from-slate-900 via-pink-950 to-rose-900',
    badgeColor: 'bg-pink-100 text-pink-700',
    borderColor: 'border-pink-100',
    buttonColor: 'bg-pink-600 hover:bg-pink-700',
    getInsights: (pet, soulData) => {
      const archetype = pet?.soul_archetype?.primary_archetype || 'social_butterfly';
      const archetypeName = pet?.soul_archetype?.archetype_name || 'Social Butterfly';
      const celebrationStyle = pet?.soul_archetype?.celebration_style || 'fun party';
      const dogFriends = pet?.relationships?.dog_friends || [];
      const favoriteTreats = pet?.preferences?.favorite_treats || pet?.soul_enrichments?.favorite_treats || [];
      const personality = pet?.doggy_soul_answers?.describe_3_words || pet?.soul_data?.personality?.join(', ') || 'loving';
      
      return [
        {
          title: `${pet?.name}'s celebration style`,
          body: `As a ${archetypeName} ${pet?.soul_archetype?.archetype_emoji || '🎉'}, ${pet?.name} loves ${celebrationStyle}. ${dogFriends.length > 0 ? `Invite ${dogFriends.slice(0, 2).join(' and ')} for the perfect pawty!` : 'Make it memorable with their favorite activities.'}`,
          icon: PartyPopper
        },
        {
          title: `Treats ${pet?.name} will love`,
          body: favoriteTreats.length > 0 
            ? `${pet?.name} goes crazy for ${favoriteTreats.join(', ')}. Skip the ${pet?.health_data?.allergies?.length > 0 ? pet.health_data.allergies.join(', ') + ' (allergy!)' : 'boring treats'} and celebrate with what they truly love.`
            : `Tell Mira about ${pet?.name}'s favorite treats to get personalized cake and snack recommendations.`,
          icon: Gift
        },
        {
          title: `Perfect party personality`,
          body: `${pet?.name} is ${personality}. ${pet?.doggy_soul_answers?.social_preference === 'Being around people' ? 'They love being the center of attention!' : pet?.doggy_soul_answers?.general_nature === 'Curious' ? 'Set up fun surprises for them to discover.' : 'Keep the celebration cozy and personal.'}`,
          icon: Sparkles
        }
      ];
    }
  },
  care: {
    title: (petName) => `Personalized care for ${petName}`,
    subtitle: (petName, breed) => `Not generic grooming tips — care recommendations shaped around ${petName}'s ${breed || 'unique'} coat, sensitivities, and comfort preferences.`,
    icon: Heart,
    color: 'teal',
    gradient: 'from-teal-50/80 to-white',
    cardGradient: 'from-slate-900 via-teal-950 to-cyan-900',
    badgeColor: 'bg-teal-100 text-teal-700',
    borderColor: 'border-teal-100',
    buttonColor: 'bg-teal-600 hover:bg-teal-700',
    getInsights: (pet, soulData) => {
      const sensitivities = pet?.health_data?.sensitivities || [];
      const groomingPref = pet?.service_history?.grooming_preference || 'gentle care';
      const handlingComfort = pet?.doggy_soul_answers?.handling_comfort || pet?.care?.handling_sensitivity || 'comfortable';
      const coatType = pet?.coat_type || 'standard';
      const personality = pet?.doggy_soul_answers?.describe_3_words?.split(',')[0] || pet?.soul_data?.personality?.[0] || 'calm';
      
      return [
        {
          title: `${pet?.name}'s grooming needs`,
          body: `With a ${coatType} coat, ${pet?.name} needs ${coatType.includes('long') || coatType.includes('silky') ? 'regular brushing to prevent matting' : coatType.includes('double') ? 'seasonal deshedding and undercoat care' : 'routine maintenance grooming'}. ${groomingPref ? `Preference: ${groomingPref}.` : ''}`,
          icon: PawPrint
        },
        {
          title: `Sensitivities to know`,
          body: sensitivities.length > 0 
            ? `${pet?.name} has ${sensitivities.join(', ')}. We recommend gentle, hypoallergenic products and extra patience during grooming sessions.`
            : `No known sensitivities recorded. ${pet?.name} seems ready for regular care routines.`,
          icon: Shield
        },
        {
          title: `Handling ${pet?.name} right`,
          body: `${pet?.name} is ${handlingComfort.toLowerCase().includes('very') ? 'very comfortable with handling — great for grooming!' : handlingComfort.toLowerCase().includes('needs') ? 'building confidence with handling. Go slow, use treats, and keep sessions short.' : 'comfortable being handled'}. ${personality.toLowerCase().includes('drama') ? 'As a drama-queen, expect some flair during nail trims!' : ''}`,
          icon: Heart
        }
      ];
    }
  },
  dine: {
    title: (petName) => `Meals crafted for ${petName}`,
    subtitle: (petName, breed) => `Not generic food recommendations — nutrition guidance shaped around ${petName}'s taste preferences, allergies, and energy needs.`,
    icon: Utensils,
    color: 'amber',
    gradient: 'from-amber-50/80 to-white',
    cardGradient: 'from-slate-900 via-amber-950 to-orange-900',
    badgeColor: 'bg-amber-100 text-amber-700',
    borderColor: 'border-amber-100',
    buttonColor: 'bg-amber-600 hover:bg-amber-700',
    getInsights: (pet, soulData) => {
      const favoriteTreats = pet?.preferences?.favorite_treats || pet?.soul_enrichments?.favorite_treats || [];
      const allergies = pet?.health_data?.allergies || pet?.health?.allergies || [];
      const activityLevel = pet?.preferences?.activity_level || 'moderate';
      const learnedFacts = pet?.learned_facts?.filter(f => f.category === 'food' || f.type === 'loves' || f.type === 'prefers') || [];
      const isFoodMotivated = pet?.soul_data?.personality?.includes('food-motivated') || pet?.doggy_soul_answers?.describe_3_words?.toLowerCase().includes('food');
      
      return [
        {
          title: `${pet?.name}'s taste profile`,
          body: favoriteTreats.length > 0 
            ? `${pet?.name} ${isFoodMotivated ? 'is super food-motivated and ' : ''}loves ${favoriteTreats.join(', ')}. ${learnedFacts.length > 0 ? `Mira also learned they ${learnedFacts[0]?.value || 'enjoy meal time'}.` : 'Look for meals and treats featuring these flavors.'}`
            : `Tell Mira what ${pet?.name} loves to eat — we'll personalize every food recommendation.`,
          icon: Utensils
        },
        {
          title: `Foods to avoid`,
          body: allergies.length > 0 
            ? `Important: ${pet?.name} is allergic to ${allergies.join(', ')}. All our recommendations will exclude these ingredients.`
            : `No known allergies recorded. Still, we'll flag any common irritants in recommendations.`,
          icon: Shield
        },
        {
          title: `Energy & nutrition`,
          body: `Based on ${pet?.name}'s ${activityLevel || 'activity'} lifestyle${pet?.size_class ? ` and ${pet.size_class} size` : ''}, we'll recommend the right calorie balance. ${pet?.health_data?.chronic_conditions?.length > 0 ? `Note: special diet considerations for ${pet.health_data.chronic_conditions[0]}.` : ''}`,
          icon: Sparkles
        }
      ];
    }
  },
  stay: {
    title: (petName) => `Stays perfect for ${petName}`,
    subtitle: (petName, breed) => `Not random hotels — stays matched to ${petName}'s settling rhythm, social needs, and comfort preferences.`,
    icon: Bed,
    color: 'indigo',
    gradient: 'from-indigo-50/80 to-white',
    cardGradient: 'from-slate-900 via-indigo-950 to-purple-900',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    borderColor: 'border-indigo-100',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    getInsights: (pet, soulData) => {
      const archetype = pet?.soul_archetype?.primary_archetype || '';
      const behaviorWithDogs = pet?.doggy_soul_answers?.behavior_with_dogs || pet?.personality?.behavior_with_dogs || '';
      const dogFriends = pet?.relationships?.dog_friends || [];
      const travelHistory = pet?.service_history?.travel_history || [];
      const anxietyTriggers = pet?.personality?.anxiety_triggers || [];
      
      const settlingStyle = archetype.includes('social') ? 'loves being around other dogs' : 
                           archetype.includes('couch') ? 'prefers quiet, cozy spaces' :
                           'adapts to new environments well';
      
      return [
        {
          title: `${pet?.name}'s settling rhythm`,
          body: `${pet?.name} ${settlingStyle}. ${behaviorWithDogs.toLowerCase().includes('love') ? 'Dog-friendly properties will be a hit!' : anxietyTriggers.length > 0 ? `Best with quieter stays — avoid ${anxietyTriggers.join(', ')}.` : 'A calm introduction to the space helps.'}`,
          icon: Bed
        },
        {
          title: `Social compatibility`,
          body: dogFriends.length > 0 
            ? `${pet?.name}'s best friends are ${dogFriends.slice(0, 3).join(', ')}. Properties with social doggy areas will feel like home!`
            : behaviorWithDogs.toLowerCase().includes('love') 
              ? `${pet?.name} loves all dogs — perfect for social boarding or dog-friendly resorts.`
              : `${pet?.name} may prefer a private suite or one-on-one attention.`,
          icon: Heart
        },
        {
          title: `Travel experience`,
          body: travelHistory.length > 0 
            ? `${pet?.name} has stayed at ${travelHistory.slice(0, 2).join(', ')}. We know what works — similar vibes recommended.`
            : `First trip with us? We'll match ${pet?.name} with beginner-friendly, high-rated stays.`,
          icon: Plane
        }
      ];
    }
  },
  fit: {
    title: (petName) => `Fitness tailored for ${petName}`,
    subtitle: (petName, breed) => `Not generic exercise — activity recommendations shaped around ${petName}'s energy level, breed needs, and social style.`,
    icon: Dumbbell,
    color: 'green',
    gradient: 'from-green-50/80 to-white',
    cardGradient: 'from-slate-900 via-green-950 to-emerald-900',
    badgeColor: 'bg-green-100 text-green-700',
    borderColor: 'border-green-100',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    getInsights: (pet, soulData) => {
      const activityLevel = pet?.preferences?.activity_level || 'moderate';
      const dogFriends = pet?.relationships?.dog_friends || [];
      const learnedFacts = pet?.learned_facts?.filter(f => f.content?.toLowerCase().includes('walk') || f.value?.toLowerCase().includes('walk')) || [];
      const archetype = pet?.soul_archetype?.primary_archetype || '';
      
      return [
        {
          title: `${pet?.name}'s activity style`,
          body: `${pet?.name} has ${activityLevel} energy. ${archetype.includes('social') ? 'Group activities and playdates are perfect!' : archetype.includes('adventurer') ? 'Loves exploring new trails and spaces.' : 'Consistent, routine exercise works best.'}`,
          icon: Dumbbell
        },
        {
          title: `Social exercise`,
          body: dogFriends.length > 0 
            ? `${pet?.name}'s workout buddies: ${dogFriends.join(', ')}. Schedule playdates for maximum fun!`
            : `${pet?.name} ${archetype.includes('social') ? 'loves making new dog friends during walks' : 'enjoys focused one-on-one activity time'}.`,
          icon: Heart
        },
        {
          title: `Best activity times`,
          body: learnedFacts.length > 0 && learnedFacts[0]?.value
            ? `Mira learned ${pet?.name} prefers ${learnedFacts[0].value}. We'll schedule recommendations accordingly.`
            : `Tell Mira when ${pet?.name} is most energetic — morning, afternoon, or evening walks?`,
          icon: Sparkles
        }
      ];
    }
  },
  learn: {
    title: (petName) => `Training designed for ${petName}`,
    subtitle: (petName, breed) => `Not one-size-fits-all training — learning approaches shaped around ${petName}'s personality, attention style, and motivations.`,
    icon: GraduationCap,
    color: 'blue',
    gradient: 'from-blue-50/80 to-white',
    cardGradient: 'from-slate-900 via-blue-950 to-sky-900',
    badgeColor: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-100',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    getInsights: (pet, soulData) => {
      const generalNature = pet?.doggy_soul_answers?.general_nature || 'curious';
      const personality = pet?.doggy_soul_answers?.describe_3_words || '';
      const favoriteTreats = pet?.preferences?.favorite_treats || pet?.soul_enrichments?.favorite_treats || [];
      const isFoodMotivated = pet?.soul_data?.personality?.includes('food-motivated');
      
      return [
        {
          title: `How ${pet?.name} learns best`,
          body: `${pet?.name} is ${generalNature.toLowerCase()}. ${generalNature.toLowerCase().includes('curious') ? 'Use curiosity-driven training with exploration rewards.' : generalNature.toLowerCase().includes('calm') ? 'Steady, patient sessions work best.' : 'Keep training varied and engaging.'}`,
          icon: GraduationCap
        },
        {
          title: `Training motivation`,
          body: isFoodMotivated || favoriteTreats.length > 0
            ? `${pet?.name} is ${isFoodMotivated ? 'super food-motivated!' : 'treat-driven.'} Use ${favoriteTreats.length > 0 ? favoriteTreats[0] : 'high-value treats'} for best results.`
            : `${personality.toLowerCase().includes('playful') ? 'Play and praise may motivate more than treats.' : 'Find what motivates — treats, toys, or praise.'}`,
          icon: Gift
        },
        {
          title: `Session style`,
          body: `${personality.toLowerCase().includes('drama') ? 'Drama-queen tendencies mean short, positive sessions prevent frustration.' : personality.toLowerCase().includes('energetic') ? 'Active training games keep engagement high.' : 'Consistent, calm sessions build confidence.'}`,
          icon: Sparkles
        }
      ];
    }
  },
  enjoy: {
    title: (petName) => `Fun picked for ${petName}`,
    subtitle: (petName, breed) => `Not random toys — enrichment matched to ${petName}'s play style, energy level, and social preferences.`,
    icon: Gift,
    color: 'purple',
    gradient: 'from-purple-50/80 to-white',
    cardGradient: 'from-slate-900 via-purple-950 to-fuchsia-900',
    badgeColor: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-100',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    getInsights: (pet, soulData) => {
      const archetype = pet?.soul_archetype?.primary_archetype || '';
      const productAffinity = pet?.soul_archetype?.product_affinity || [];
      const dogFriends = pet?.relationships?.dog_friends || [];
      
      return [
        {
          title: `${pet?.name}'s play personality`,
          body: `${archetype.includes('social') ? `Social butterfly ${pet?.name} loves interactive toys and group play.` : archetype.includes('adventurer') ? `Explorer ${pet?.name} needs stimulating puzzle toys and outdoor gear.` : archetype.includes('couch') ? `Cozy ${pet?.name} enjoys gentle chew toys and comfort items.` : `${pet?.name} enjoys a mix of active and calm play.`}`,
          icon: Gift
        },
        {
          title: `Toy recommendations`,
          body: productAffinity.length > 0 
            ? `Based on ${pet?.name}'s archetype, try: ${productAffinity.slice(0, 3).join(', ')}.`
            : `Tell Mira what toys ${pet?.name} loves — fetch? Puzzles? Squeaky toys? We'll curate the perfect collection.`,
          icon: Sparkles
        },
        {
          title: `Social playtime`,
          body: dogFriends.length > 0 
            ? `${pet?.name} has playmates: ${dogFriends.join(', ')}. Get matching toys for the ultimate doggy hangout!`
            : `${archetype.includes('social') ? 'Social toys that encourage interaction will be a hit.' : 'Solo toys for independent play recommended.'}`,
          icon: Heart
        }
      ];
    }
  },
  travel: {
    title: (petName) => `Travel planned for ${petName}`,
    subtitle: (petName, breed) => `Not generic travel tips — journey planning shaped around ${petName}'s comfort needs, crate training, and travel experience.`,
    icon: Plane,
    color: 'sky',
    gradient: 'from-sky-50/80 to-white',
    cardGradient: 'from-slate-900 via-sky-950 to-cyan-900',
    badgeColor: 'bg-sky-100 text-sky-700',
    borderColor: 'border-sky-100',
    buttonColor: 'bg-sky-600 hover:bg-sky-700',
    getInsights: (pet, soulData) => {
      const crateTrained = pet?.travel?.crate_trained || '';
      const travelHistory = pet?.service_history?.travel_history || [];
      const favoriteTreats = pet?.preferences?.favorite_treats || [];
      const allergies = pet?.health_data?.allergies || [];
      
      return [
        {
          title: `${pet?.name}'s travel readiness`,
          body: `${crateTrained?.toLowerCase().includes('yes') ? `${pet?.name} is crate trained — perfect for car and air travel!` : `${pet?.name} may need crate training before longer trips.`} ${travelHistory.length > 0 ? `Experienced traveler: ${travelHistory[0]}.` : 'First big trip? We\'ll guide you every step.'}`,
          icon: Plane
        },
        {
          title: `Travel snacks`,
          body: favoriteTreats.length > 0 
            ? `Pack ${favoriteTreats.join(', ')} for the journey. ${allergies.length > 0 ? `Avoid ${allergies.join(', ')} at rest stops!` : 'These will keep spirits high during travel breaks.'}`
            : `Pack ${pet?.name}'s favorite treats for comfort during the journey. Familiar tastes help ease travel anxiety.`,
          icon: Gift
        },
        {
          title: `Comfort essentials`,
          body: `${pet?.name}'s travel kit should include their familiar blanket, favorite toy, and ${favoriteTreats.length > 0 ? favoriteTreats[0] + ' treats' : 'high-value treats'}. ${pet?.personality?.anxiety_triggers?.length > 0 ? `Note: ${pet.name} is sensitive to ${pet.personality.anxiety_triggers[0]}.` : ''}`,
          icon: Heart
        }
      ];
    }
  },
  shop: {
    title: (petName) => `Products picked for ${petName}`,
    subtitle: (petName, breed) => `Not random shopping — curated products shaped around ${petName}'s size, coat type, sensitivities, and preferences.`,
    icon: ShoppingBag,
    color: 'rose',
    gradient: 'from-rose-50/80 to-white',
    cardGradient: 'from-slate-900 via-rose-950 to-pink-900',
    badgeColor: 'bg-rose-100 text-rose-700',
    borderColor: 'border-rose-100',
    buttonColor: 'bg-rose-600 hover:bg-rose-700',
    getInsights: (pet, soulData) => {
      const sizeClass = pet?.size_class || 'medium';
      const coatType = pet?.coat_type || '';
      const sensitivities = pet?.health_data?.sensitivities || [];
      const favorites = pet?.favorites || [];
      
      return [
        {
          title: `${pet?.name}'s size & fit`,
          body: `As a ${sizeClass} ${pet?.breed || 'dog'}, ${pet?.name} needs ${sizeClass}-appropriate gear. We'll filter all recommendations to fit perfectly.`,
          icon: ShoppingBag
        },
        {
          title: `Product considerations`,
          body: sensitivities.length > 0 
            ? `${pet?.name} has ${sensitivities.join(', ')}. We prioritize gentle, hypoallergenic products in every category.`
            : coatType 
              ? `With a ${coatType} coat, ${pet?.name} benefits from specific grooming products. We'll recommend the best.`
              : `We'll match products to ${pet?.name}'s specific needs as we learn more.`,
          icon: Shield
        },
        {
          title: `${pet?.name}'s wishlist`,
          body: favorites.length > 0 
            ? `${pet?.name} has ${favorites.length} favorites saved. Keep building the perfect collection!`
            : `Start adding favorites and we'll learn ${pet?.name}'s preferences for smarter recommendations.`,
          icon: Heart
        }
      ];
    }
  },
  advisory: {
    title: (petName) => `Guidance tailored for ${petName}`,
    subtitle: (petName, breed) => `Not generic pet advice — expert guidance shaped around ${petName}'s health profile, life stage, and specific needs.`,
    icon: Shield,
    color: 'slate',
    gradient: 'from-slate-50/80 to-white',
    cardGradient: 'from-slate-900 via-slate-800 to-zinc-900',
    badgeColor: 'bg-slate-100 text-slate-700',
    borderColor: 'border-slate-100',
    buttonColor: 'bg-slate-600 hover:bg-slate-700',
    getInsights: (pet, soulData) => {
      const chronicConditions = pet?.health_data?.chronic_conditions || [];
      const allergies = pet?.health_data?.allergies || [];
      const vetName = pet?.health_data?.vet_name || '';
      const vaccinationStatus = pet?.health_data?.vaccination_status || '';
      const ageMonths = pet?.age_months || 0;
      const lifeStage = ageMonths < 12 ? 'puppy' : ageMonths >= 96 ? 'senior' : 'adult';
      
      return [
        {
          title: `${pet?.name}'s health profile`,
          body: chronicConditions.length > 0 
            ? `${pet?.name} has ${chronicConditions.join(', ')}. Our advisory services account for these specific needs in all recommendations.`
            : `${pet?.name}'s health profile is looking good! We'll help maintain this through preventive care guidance.`,
          icon: Shield
        },
        {
          title: `Life stage considerations`,
          body: `As ${lifeStage === 'puppy' ? 'a growing puppy' : lifeStage === 'senior' ? 'a senior companion' : 'an adult dog'}, ${pet?.name} has specific ${lifeStage === 'puppy' ? 'vaccination and development' : lifeStage === 'senior' ? 'comfort and health monitoring' : 'maintenance and wellness'} needs.`,
          icon: Heart
        },
        {
          title: `Insurance & care planning`,
          body: allergies.length > 0 || chronicConditions.length > 0
            ? `With ${allergies.length > 0 ? `allergies (${allergies.join(', ')})` : ''} ${chronicConditions.length > 0 ? `and ${chronicConditions.join(', ')}` : ''}, ensure ${pet?.name}'s insurance covers these conditions.`
            : `${pet?.name} is healthy — the perfect time to lock in good insurance rates!`,
          icon: Sparkles
        }
      ];
    }
  },
  adopt: {
    title: (petName) => `A better adoption plan for ${petName}`,
    subtitle: (petName, breed) => `This is the Pet Operating System layer: not generic adoption advice, but a calmer transition plan shaped around ${petName}'s breed, life stage, and soul profile.`,
    icon: Home,
    color: 'orange',
    gradient: 'from-orange-50/80 to-white',
    cardGradient: 'from-slate-900 via-orange-950 to-amber-900',
    badgeColor: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-100',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
    getInsights: (pet, soulData) => {
      const soulScore = pet?.soul_score || pet?.overall_score || 0;
      const breed = pet?.breed || 'your dog';
      const ageMonths = pet?.age_months || 0;
      const lifeStage = ageMonths < 12 ? 'puppy' : ageMonths >= 96 ? 'senior' : 'adult';
      
      return [
        {
          title: `${pet?.name}'s settling rhythm`,
          body: lifeStage === 'puppy'
            ? `${pet?.name} will benefit from very short, reassuring routines in the first week. Keep sleep, meals, and potty timing gentle and predictable.`
            : lifeStage === 'senior'
              ? `A quieter entry matters more for ${pet?.name}. Build in soft bedding, easy-to-reach water, and a low-stimulation corner from day one.`
              : `${pet?.name} is likely to settle best with a calm decompression zone, one trusted routine, and a slower introduction to the whole home.`,
          icon: Home
        },
        {
          title: `Home setup for a ${breed}`,
          body: `${breed} needs a welcome setup that matches real temperament, not just looks — comfort, safe walking gear, chew outlets, and a retreat space matter most.`,
          icon: Package
        },
        {
          title: soulScore > 0 ? `Grow ${pet?.name}'s soul profile` : `Start ${pet?.name}'s soul profile`,
          body: soulScore > 0
            ? `Mira already knows ${pet?.name} at ${Math.round(soulScore)}%. A few more answers will sharpen food, comfort, training, and transition recommendations.`
            : `Answer a few soul questions and this page becomes far more personal — from the first-week checklist to product picks matched to ${pet?.name}.`,
          icon: Sparkles
        }
      ];
    }
  }
};

// Helper to get pet photo URL
const getPetPhotoUrl = (pet) => {
  if (pet?.photo_url) return pet.photo_url;
  if (pet?.photo_base64) return `data:${pet.photo_content_type || 'image/png'};base64,${pet.photo_base64}`;
  return '/placeholder-pet.png';
};

const SoulPersonalizationSection = ({ pillar, className = '' }) => {
  const navigate = useNavigate();
  const { currentPet, pets, soulData } = usePillarContext();
  const activePet = currentPet || pets?.[0] || null;
  
  // Get pillar config
  const config = PILLAR_CONFIG[pillar?.toLowerCase()];
  
  // Don't render for excluded pillars or if no config
  if (!config || ['farewell', 'emergency', 'paperwork'].includes(pillar?.toLowerCase())) {
    return null;
  }
  
  // Don't render if no active pet
  if (!activePet) {
    return null;
  }
  
  const soulScore = activePet?.overall_score || activePet?.soul_score || soulData?.overall_score || 0;
  const insights = config.getInsights(activePet, soulData);
  const Icon = config.icon;
  
  return (
    <section 
      className={`py-10 px-4 bg-gradient-to-b ${config.gradient} ${className}`}
      data-testid={`${pillar}-soul-personalization-section`}
    >
      <div className="max-w-6xl mx-auto">
        <Card className={`overflow-hidden ${config.borderColor} shadow-lg`}>
          <div className="grid gap-8 lg:grid-cols-[320px_1fr] p-6 md:p-8">
            {/* Left Column - Pet Card */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Badge className={config.badgeColor} data-testid={`${pillar}-pet-os-badge`}>
                  Made for {activePet.name}
                </Badge>
                <Badge variant="outline" className={`${config.borderColor} ${config.badgeColor.replace('bg-', 'text-').replace('-100', '-700')}`} data-testid={`${pillar}-pet-os-soul-badge`}>
                  Pet Soul™ {Math.round(soulScore)}%
                </Badge>
              </div>

              <div className={`flex flex-col items-center rounded-3xl bg-gradient-to-br ${config.cardGradient} p-6 text-center text-white`}>
                <SoulScoreArc
                  score={soulScore}
                  petId={activePet.id}
                  petName={activePet.name}
                  size={140}
                  strokeWidth={6}
                  showLabel={false}
                  showCTA={false}
                  className="mb-4"
                >
                  <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white/15 shadow-2xl">
                    <img
                      src={getPetPhotoUrl(activePet)}
                      alt={activePet.name}
                      className="h-full w-full object-cover"
                      data-testid={`${pillar}-active-pet-photo`}
                    />
                  </div>
                </SoulScoreArc>

                <h2 className="text-2xl font-semibold" data-testid={`${pillar}-active-pet-name`}>
                  {activePet.name}
                </h2>
                <p className="mt-1 text-sm text-white/70" data-testid={`${pillar}-active-pet-breed`}>
                  {activePet.breed || 'Beloved companion'}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/85">
                    {activePet.breed || 'Unique soul'}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/85">
                    {activePet.age_months < 12 ? 'Puppy energy' : activePet.age_months >= 96 ? 'Senior comfort' : 'Adult rhythm'}
                  </span>
                  {activePet.soul_archetype?.archetype_emoji && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/85">
                      {activePet.soul_archetype.archetype_emoji} {activePet.soul_archetype.archetype_name?.replace('The ', '')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900" data-testid={`${pillar}-personalized-heading`}>
                  {config.title(activePet.name)}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base" data-testid={`${pillar}-personalized-subheading`}>
                  {config.subtitle(activePet.name, activePet.breed)}
                </p>
              </div>

              {/* Mira Love Note */}
              <MiraLoveNote pet={activePet} variant="card" />

              {/* Soul Insight Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {insights.map((insight, index) => {
                  const InsightIcon = insight.icon || Sparkles;
                  return (
                    <Card 
                      key={insight.title} 
                      className={`${config.borderColor} bg-gradient-to-br from-white to-${config.color}-50/70 p-4`}
                      data-testid={`${pillar}-soul-note-${index}`}
                    >
                      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${config.badgeColor}`}>
                        <InsightIcon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{insight.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{insight.body}</p>
                    </Card>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className={config.buttonColor}
                  data-testid={`${pillar}-personalized-ask-mira-button`}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openMiraAI', {
                      detail: {
                        message: `Help me with personalized ${pillar} recommendations for ${activePet.name}${activePet.breed ? `, a ${activePet.breed}` : ''}.`,
                        context: pillar,
                        pillar: pillar,
                        pet_name: activePet.name,
                        pet_breed: activePet.breed
                      }
                    }));
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ask Mira about {activePet.name}
                </Button>
                <Button
                  variant="outline"
                  className={`${config.borderColor} ${config.badgeColor.replace('bg-', 'text-').replace('-100', '-700')} hover:bg-${config.color}-50`}
                  data-testid={`${pillar}-personalized-soul-button`}
                  onClick={() => navigate('/my-pets')}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {activePet.name}'s Dashboard
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default SoulPersonalizationSection;
