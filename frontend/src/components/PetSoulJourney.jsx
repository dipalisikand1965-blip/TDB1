/**
 * PetSoulJourney - A Living Portrait, Not a Dashboard
 * 
 * THE DOCTRINE: 
 * "The Pet Soul Journey should feel like someone quietly paying attention — 
 * not like a system asking for information."
 * 
 * CORE PRINCIPLES:
 * - This is a confidence-of-understanding system, NOT a profile completion system
 * - Fewer questions over time, better recognition over time
 * - Less visible "system", more visible care
 * 
 * STAGES:
 * - 0-20%: "We&apos;ve just met" - Minimal data, early trust
 * - 20-50%: "Patterns are emerging" - Early preferences visible
 * - 50-80%: "We know [Pet]" - Strong confidence, clear preferences  
 * - 80-100%: "This system knows my pet" - Deep trust, longitudinal memory
 */

import React, { useState, useEffect } from &apos;react&apos;;
import { Link } from &apos;react-router-dom&apos;;
import { Button } from &apos;./ui/button&apos;;
import { Card } from &apos;./ui/card&apos;;
import { Badge } from &apos;./ui/badge&apos;;
import { 
  Brain, Heart, PawPrint, Sparkles, 
  Home, Calendar, Plane, ChevronRight,
  Clock, ArrowRight, Star
} from &apos;lucide-react&apos;;
import { getApiUrl } from &apos;../utils/api&apos;;

// 8 Soul Pillars - Visual representation
const SOUL_PILLARS = [
  { key: &apos;identity_temperament&apos;, name: &apos;Identity &amp; Temperament&apos;, icon: &apos;🎭&apos;, color: &apos;purple&apos; },
  { key: &apos;family_pack&apos;, name: &apos;Family &amp; Pack&apos;, icon: &apos;👨‍👩‍👧‍👦&apos;, color: &apos;blue&apos; },
  { key: &apos;rhythm_routine&apos;, name: &apos;Rhythm &amp; Routine&apos;, icon: &apos;⏰&apos;, color: &apos;green&apos; },
  { key: &apos;home_comforts&apos;, name: &apos;Home Comforts&apos;, icon: &apos;🏠&apos;, color: &apos;amber&apos; },
  { key: &apos;travel_style&apos;, name: &apos;Travel Style&apos;, icon: &apos;✈️&apos;, color: &apos;sky&apos; },
  { key: &apos;taste_treat&apos;, name: &apos;Taste &amp; Treat&apos;, icon: &apos;🍖&apos;, color: &apos;orange&apos; },
  { key: &apos;training_behaviour&apos;, name: &apos;Training &amp; Behaviour&apos;, icon: &apos;🎓&apos;, color: &apos;indigo&apos; },
  { key: &apos;long_horizon&apos;, name: &apos;Long Horizon&apos;, icon: &apos;🌅&apos;, color: &apos;rose&apos; }
];

// Generate pillar insight text based on soul data
const getPillarInsight = (pillarKey, soulData, petName) =&gt; {
  const answers = soulData?.doggy_soul_answers || {};
  const insights = soulData?.insights?.folder_summaries || {};
  
  // Map pillar key to insight text
  const insightMap = {
    identity_temperament: answers.describe_3_words 
      ? `${petName} is ${answers.describe_3_words.toLowerCase()}`
      : answers.general_nature 
        ? `Generally ${answers.general_nature.toLowerCase()}`
        : null,
    family_pack: answers.most_attached_to
      ? `Most attached to ${answers.most_attached_to.toLowerCase()}`
      : answers.behavior_with_dogs
        ? `${answers.behavior_with_dogs} with other dogs`
        : null,
    rhythm_routine: answers.walks_per_day
      ? `${answers.walks_per_day} walks daily, most energetic in the ${(answers.energetic_time || &apos;day&apos;).toLowerCase()}`
      : null,
    home_comforts: answers.space_preference
      ? `Prefers ${answers.space_preference.toLowerCase()}`
      : answers.crate_trained === &apos;Yes&apos;
        ? &apos;Comfortable with crate training&apos;
        : null,
    travel_style: answers.car_rides
      ? answers.car_rides.toLowerCase().includes(&apos;love&apos;) 
        ? &apos;Enjoys car rides&apos;
        : answers.car_rides.toLowerCase().includes(&apos;anxi&apos;)
          ? &apos;Gets anxious during travel&apos;
          : `Travel comfort: ${answers.car_rides}`
      : null,
    taste_treat: answers.favorite_treats?.length
      ? `Loves ${answers.favorite_treats.join(&apos;, &apos;).toLowerCase()}`
      : answers.food_allergies?.length
        ? `Sensitive to ${answers.food_allergies.join(&apos;, &apos;).toLowerCase()}`
        : null,
    training_behaviour: answers.training_level
      ? `${answers.training_level}`
      : null,
    long_horizon: null // Usually empty in early stages
  };
  
  return insightMap[pillarKey];
};

// Get learning timeline entries from soul data
const getLearningTimeline = (soulData, petName) =&gt; {
  const entries = [];
  const answers = soulData?.doggy_soul_answers || {};
  const pillarInteractions = soulData?.pillar_interactions || [];
  
  // Add entries from behavioral learning
  if (answers.auto_learned_from) {
    entries.push({
      text: &apos;Preferences learned from recent activity&apos;,
      source: &apos;behaviour&apos;,
      date: answers.last_auto_updated
    });
  }
  
  if (answers.food_allergies?.length &amp;&amp; answers.food_allergies[0] !== &apos;None&apos;) {
    entries.push({
      text: `${answers.food_allergies.join(&apos;, &apos;)} sensitivity noted`,
      source: &apos;you&apos;,
      date: null
    });
  }
  
  if (answers.prefers_grain_free) {
    entries.push({
      text: &apos;Prefers grain-free options&apos;,
      source: &apos;behaviour&apos;,
      date: null
    });
  }
  
  if (answers.separation_anxiety &amp;&amp; answers.separation_anxiety !== &apos;None&apos;) {
    entries.push({
      text: `${answers.separation_anxiety} separation comfort`,
      source: &apos;you&apos;,
      date: null
    });
  }
  
  if (answers.car_rides?.toLowerCase().includes(&apos;love&apos;)) {
    entries.push({
      text: `${petName} enjoys car rides`,
      source: &apos;you&apos;,
      date: null
    });
  }
  
  if (answers.crate_trained === &apos;Yes&apos;) {
    entries.push({
      text: &apos;Comfortable with crate&apos;,
      source: &apos;you&apos;,
      date: null
    });
  }
  
  if (answers.loves_celebrations) {
    entries.push({
      text: `${petName} loves celebrations&apos;,
      source: &apos;behaviour&apos;,
      date: null
    });
  }
  
  // Add entries from pillar interactions
  pillarInteractions.forEach(interaction =&gt; {
    if (interaction.learned) {
      Object.entries(interaction.learned).forEach(([key, value]) =&gt; {
        if (key === &apos;favorite_treats&apos; &amp;&amp; value?.length) {
          entries.push({
            text: `Loves ${value.join(&apos;, &apos;)}`,
            source: &apos;behaviour&apos;,
            date: interaction.timestamp
          });
        }
      });
    }
  });
  
  return entries.slice(0, 8); // Max 8 entries
};

// Get achievements based on soul progress
const getAchievements = (soulData, overallScore) =&gt; {
  const achievements = [];
  const folderScores = soulData?.folder_scores || {};
  
  // Only show achievements at 50%+ (Stage 3+)
  if (overallScore &lt; 50) return [];
  
  // Check pillar completion
  if (folderScores.rhythm_routine &gt;= 80) {
    achievements.push({ name: &apos;Routine Understood&apos;, icon: &apos;⏰&apos; });
  }
  if (folderScores.home_comforts &gt;= 80) {
    achievements.push({ name: &apos;Home Preferences Known&apos;, icon: &apos;🏠&apos; });
  }
  if (folderScores.identity_temperament &gt;= 80) {
    achievements.push({ name: &apos;Personality Mapped&apos;, icon: &apos;🎭&apos; });
  }
  if (folderScores.family_pack &gt;= 80) {
    achievements.push({ name: &apos;Pack Dynamics Clear&apos;, icon: &apos;👨‍👩‍👧‍👦&apos; });
  }
  if (folderScores.travel_style &gt;= 50) {
    achievements.push({ name: &apos;Travel-Aware&apos;, icon: &apos;✈️&apos; });
  }
  if (soulData?.vault?.vaccines?.length &gt; 0) {
    achievements.push({ name: &apos;Health Vault Active&apos;, icon: &apos;💉&apos; });
  }
  if (soulData?.doggy_soul_answers?.loves_celebrations) {
    achievements.push({ name: &apos;Celebration Ready&apos;, icon: &apos;🎂&apos; });
  }
  
  return achievements.slice(0, 4); // Max 4 quiet achievements
};

// Get personalized care insights
const getCareInsights = (soulData, petName) =&gt; {
  const insights = [];
  const answers = soulData?.doggy_soul_answers || {};
  
  // These are care insights, NOT product pushes
  if (answers.separation_anxiety === &apos;Moderate&apos; || answers.separation_anxiety === &apos;Severe&apos;) {
    insights.push(`Advance notice helps ${petName} stay calm during changes`);
  }
  
  if (answers.space_preference?.toLowerCase().includes(&apos;busy&apos;)) {
    insights.push(`${petName} does well in lively environments`);
  } else if (answers.space_preference?.toLowerCase().includes(&apos;quiet&apos;)) {
    insights.push(`${petName} prefers calm, quiet spaces`);
  }
  
  if (answers.handling_comfort === &apos;Very comfortable&apos;) {
    insights.push(`${petName} is comfortable with handling and grooming`);
  }
  
  if (answers.car_rides?.toLowerCase().includes(&apos;anxi&apos;)) {
    insights.push(`Short, positive car experiences help build confidence`);
  }
  
  if (answers.food_allergies?.length &amp;&amp; answers.food_allergies[0] !== &apos;None&apos;) {
    insights.push(`Avoid ${answers.food_allergies.join(&apos; and &apos;)} in treats and food`);
  }
  
  if (answers.energetic_time) {
    insights.push(`${petName} is most active in the ${answers.energetic_time.toLowerCase()}`);
  }
  
  return insights.slice(0, 3);
};

// Determine current stage (0-20, 20-50, 50-80, 80-100)
const getStage = (score) =&gt; {
  if (score &lt; 20) return 1;
  if (score &lt; 50) return 2;
  if (score &lt; 80) return 3;
  return 4;
};

// Generate identity line based on stage and data
const getIdentityLine = (stage, soulData, petName) =&gt; {
  const answers = soulData?.doggy_soul_answers || {};
  
  if (stage === 1) {
    return `We&apos;re getting to know ${petName} and their daily rhythm.`;
  }
  
  if (stage === 2) {
    const traits = [];
    if (answers.space_preference) traits.push(answers.space_preference.toLowerCase().includes(&apos;busy&apos;) ? &apos;social&apos; : &apos;calm&apos;);
    if (answers.general_nature) traits.push(answers.general_nature.toLowerCase());
    return traits.length 
      ? `${petName} seems to prefer ${traits.join(&apos; and &apos;)} environments.`
      : `${petName}&apos;s preferences are becoming clearer.`;
  }
  
  if (stage === 3) {
    const personality = answers.describe_3_words || answers.general_nature || &apos;unique&apos;;
    const comfort = answers.space_preference?.toLowerCase().includes(&apos;quiet&apos;) ? &apos;quiet comfort&apos; : &apos;daily rhythm&apos;;
    return `${petName} is a ${personality.toLowerCase()} who thrives on routine and ${comfort}.`;
  }
  
  // Stage 4 - Deep understanding
  const traits = [answers.describe_3_words, answers.general_nature].filter(Boolean).join(&apos;, &apos;).toLowerCase();
  const travel = answers.car_rides?.toLowerCase().includes(&apos;anxi&apos;) ? &apos;especially during travel or change&apos; : &apos;&apos;;
  return `${petName} prefers ${answers.space_preference?.toLowerCase() || &apos;familiar&apos;} spaces, ${traits} ${travel}`;
};

const PetSoulJourney = ({ user, pets = [], onOpenMira }) =&gt; {
  const [selectedPet, setSelectedPet] = useState(pets[0] || null);
  const [soulData, setSoulData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const petName = selectedPet?.name || &apos;your pet&apos;;
  
  // Fetch soul completeness data
  useEffect(() =&gt; {
    const fetchSoulData = async () =&gt; {
      if (!selectedPet?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch both completeness and full pet data
        const [completenessRes, petRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/pet-gate/soul-completeness/${selectedPet.id}`),
          fetch(`${getApiUrl()}/api/pets/${selectedPet.id}`)
        ]);
        
        let data = {};
        if (completenessRes.ok) {
          data = await completenessRes.json();
        }
        if (petRes.ok) {
          const petData = await petRes.json();
          data = { ...data, ...petData };
        }
        setSoulData(data);
      } catch (error) {
        console.error(&apos;Error fetching soul data:&apos;, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSoulData();
  }, [selectedPet?.id]);

  // No pet state
  if (!selectedPet) {
    return (
      &lt;div className=&quot;min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 px-4&quot;&gt;
        &lt;div className=&quot;max-w-2xl mx-auto text-center&quot;&gt;
          &lt;div className=&quot;w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6&quot;&gt;
            &lt;PawPrint className=&quot;w-10 h-10 text-purple-600&quot; /&gt;
          &lt;/div&gt;
          &lt;h1 className=&quot;text-3xl font-bold text-gray-900 mb-4&quot;&gt;
            Start Your Pet Soul Journey
          &lt;/h1&gt;
          &lt;p className=&quot;text-lg text-gray-600 mb-8&quot;&gt;
            Add your first pet to begin building their evolving digital soul.
          &lt;/p&gt;
          &lt;Link to=&quot;/pets/add&quot;&gt;
            &lt;Button size=&quot;lg&quot; className=&quot;bg-gradient-to-r from-purple-600 to-pink-600&quot;&gt;
              &lt;PawPrint className=&quot;w-5 h-5 mr-2&quot; /&gt;
              Add Your Pet
            &lt;/Button&gt;
          &lt;/Link&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    );
  }

  const overallScore = soulData?.overall_score || selectedPet?.overall_score || 0;
  const stage = getStage(overallScore);
  const identityLine = getIdentityLine(stage, soulData, petName);
  const learningTimeline = getLearningTimeline(soulData, petName);
  const achievements = getAchievements(soulData, overallScore);
  const careInsights = getCareInsights(soulData, petName);
  const folderScores = soulData?.folder_scores || {};

  return (
    &lt;div className=&quot;min-h-screen bg-gradient-to-b from-slate-50 to-white&quot; data-testid=&quot;pet-soul-journey&quot;&gt;
      {/* ========== PET IDENTITY HEADER - Always at Top ========== */}
      &lt;section className=&quot;relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white overflow-hidden&quot;&gt;
        &lt;div className=&quot;absolute inset-0 opacity-10&quot;&gt;
          &lt;div className=&quot;absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl&quot;&gt;&lt;/div&gt;
          &lt;div className=&quot;absolute bottom-0 right-0 w-80 h-80 bg-pink-400 rounded-full blur-3xl&quot;&gt;&lt;/div&gt;
        &lt;/div&gt;
        
        &lt;div className=&quot;relative max-w-4xl mx-auto px-4 py-12 md:py-16&quot;&gt;
          &lt;div className=&quot;flex flex-col md:flex-row items-center gap-6 md:gap-10&quot;&gt;
            {/* Pet Photo */}
            &lt;div className=&quot;relative&quot;&gt;
              &lt;div className=&quot;w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl&quot;&gt;
                {selectedPet?.image_url || selectedPet?.photo_url ? (
                  &lt;img 
                    src={selectedPet.image_url || selectedPet.photo_url} 
                    alt={petName} 
                    className=&quot;w-full h-full object-cover&quot; 
                  /&gt;
                ) : (
                  &lt;PawPrint className=&quot;w-14 h-14 text-white/50&quot; /&gt;
                )}
              &lt;/div&gt;
            &lt;/div&gt;
            
            {/* Pet Identity */}
            &lt;div className=&quot;text-center md:text-left flex-1&quot;&gt;
              &lt;h1 className=&quot;text-4xl md:text-5xl font-bold mb-3&quot;&gt;{petName}&lt;/h1&gt;
              
              {/* Mira-generated identity line - evolves with understanding */}
              &lt;p className=&quot;text-lg md:text-xl text-white/90 leading-relaxed max-w-xl&quot;&gt;
                {identityLine}
              &lt;/p&gt;
              
              {selectedPet?.breed &amp;&amp; (
                &lt;p className=&quot;text-white/60 mt-2&quot;&gt;
                  {selectedPet.breed}
                  {selectedPet?.age ? ` • ${selectedPet.age}` : &apos;&apos;}
                &lt;/p&gt;
              )}
            &lt;/div&gt;
          &lt;/div&gt;
          
          {/* Pet Switcher - only if multiple pets */}
          {pets.length &gt; 1 &amp;&amp; (
            &lt;div className=&quot;flex gap-2 mt-8 pt-6 border-t border-white/20 justify-center md:justify-start&quot;&gt;
              {pets.map((pet) =&gt; (
                &lt;button
                  key={pet.id}
                  onClick={() =&gt; setSelectedPet(pet)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedPet?.id === pet.id
                      ? &apos;bg-white text-purple-700 font-semibold shadow-lg&apos;
                      : &apos;bg-white/20 text-white hover:bg-white/30&apos;
                  }`}
                &gt;
                  {pet.name}
                &lt;/button&gt;
              ))}
            &lt;/div&gt;
          )}
        &lt;/div&gt;
      &lt;/section&gt;

      &lt;div className=&quot;max-w-4xl mx-auto px-4 py-8&quot;&gt;
        
        {/* ========== PET SOUL SCORE - Soft, Not Dominant ========== */}
        &lt;section className=&quot;mb-10&quot;&gt;
          &lt;Card className=&quot;p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100&quot;&gt;
            &lt;div className=&quot;flex items-center justify-between&quot;&gt;
              &lt;div className=&quot;flex items-center gap-4&quot;&gt;
                &lt;div className=&quot;relative w-16 h-16&quot;&gt;
                  &lt;svg className=&quot;w-full h-full transform -rotate-90&quot;&gt;
                    &lt;circle
                      cx=&quot;32&quot;
                      cy=&quot;32&quot;
                      r=&quot;28&quot;
                      fill=&quot;none&quot;
                      stroke=&quot;#e9d5ff&quot;
                      strokeWidth=&quot;6&quot;
                    /&gt;
                    &lt;circle
                      cx=&quot;32&quot;
                      cy=&quot;32&quot;
                      r=&quot;28&quot;
                      fill=&quot;none&quot;
                      stroke=&quot;url(#soulGradient)&quot;
                      strokeWidth=&quot;6&quot;
                      strokeLinecap=&quot;round&quot;
                      strokeDasharray={`${overallScore * 1.76} 176`}
                    /&gt;
                    &lt;defs&gt;
                      &lt;linearGradient id=&quot;soulGradient&quot; x1=&quot;0%&quot; y1=&quot;0%&quot; x2=&quot;100%&quot; y2=&quot;0%&quot;&gt;
                        &lt;stop offset=&quot;0%&quot; stopColor=&quot;#9333ea&quot; /&gt;
                        &lt;stop offset=&quot;100%&quot; stopColor=&quot;#ec4899&quot; /&gt;
                      &lt;/linearGradient&gt;
                    &lt;/defs&gt;
                  &lt;/svg&gt;
                  &lt;div className=&quot;absolute inset-0 flex items-center justify-center&quot;&gt;
                    &lt;span className=&quot;text-lg font-bold text-purple-700&quot;&gt;{Math.round(overallScore)}%&lt;/span&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;p className=&quot;text-sm text-purple-600 font-medium&quot;&gt;How well we understand {petName}&lt;/p&gt;
                  &lt;p className=&quot;text-gray-600 text-sm&quot;&gt;
                    {stage === 1 &amp;&amp; &apos;Just getting started&apos;}
                    {stage === 2 &amp;&amp; &apos;Patterns are emerging&apos;}
                    {stage === 3 &amp;&amp; `We know ${petName} well`}
                    {stage === 4 &amp;&amp; &apos;Deep understanding&apos;}
                  &lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              
              {/* Stage 1: Gentle assurance */}
              {stage === 1 &amp;&amp; (
                &lt;p className=&quot;text-sm text-purple-600/80 max-w-xs text-right&quot;&gt;
                  You don&apos;t need to fill anything out. We&apos;ll learn naturally as you go.
                &lt;/p&gt;
              )}
            &lt;/div&gt;
          &lt;/Card&gt;
        &lt;/section&gt;

        {/* ========== THE 8 SOUL PILLARS - Visual, Not Form-Like ========== */}
        &lt;section className=&quot;mb-10&quot;&gt;
          &lt;div className=&quot;flex items-center justify-between mb-6&quot;&gt;
            &lt;h2 className=&quot;text-xl font-bold text-gray-900 flex items-center gap-2&quot;&gt;
              &lt;Brain className=&quot;w-5 h-5 text-purple-600&quot; /&gt;
              What We Know About {petName}
            &lt;/h2&gt;
            &lt;Link to={`/pets/${selectedPet?.id}?tab=soul`}&gt;
              &lt;Button variant=&quot;ghost&quot; size=&quot;sm&quot; className=&quot;text-purple-600&quot;&gt;
                View Full Soul &lt;ChevronRight className=&quot;w-4 h-4 ml-1&quot; /&gt;
              &lt;/Button&gt;
            &lt;/Link&gt;
          &lt;/div&gt;
          
          &lt;div className=&quot;grid grid-cols-2 md:grid-cols-4 gap-3&quot;&gt;
            {SOUL_PILLARS.map((pillar) =&gt; {
              const score = folderScores[pillar.key] || 0;
              const insight = getPillarInsight(pillar.key, soulData, petName);
              const hasContent = score &gt; 0 || insight;
              
              return (
                &lt;Card 
                  key={pillar.key} 
                  className={`p-4 transition-all ${
                    hasContent 
                      ? &apos;bg-white hover:shadow-md&apos; 
                      : &apos;bg-gray-50/50 opacity-60&apos;
                  }`}
                &gt;
                  &lt;div className=&quot;flex items-center gap-2 mb-2&quot;&gt;
                    &lt;span className=&quot;text-xl&quot;&gt;{pillar.icon}&lt;/span&gt;
                    &lt;span className=&quot;text-sm font-medium text-gray-700 truncate&quot;&gt;{pillar.name}&lt;/span&gt;
                  &lt;/div&gt;
                  
                  {/* Soft progress indicator - not percentage */}
                  &lt;div className=&quot;h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2&quot;&gt;
                    &lt;div 
                      className={`h-full rounded-full transition-all bg-gradient-to-r from-${pillar.color}-400 to-${pillar.color}-500`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    /&gt;
                  &lt;/div&gt;
                  
                  {/* Insight line - NOT a percentage */}
                  {insight &amp;&amp; (
                    &lt;p className=&quot;text-xs text-gray-600 line-clamp-2&quot;&gt;{insight}&lt;/p&gt;
                  )}
                &lt;/Card&gt;
              );
            })}
          &lt;/div&gt;
        &lt;/section&gt;

        {/* ========== WHAT WE&apos;VE LEARNED TIMELINE - Stage 2+ ========== */}
        {stage &gt;= 2 &amp;&amp; learningTimeline.length &gt; 0 &amp;&amp; (
          &lt;section className=&quot;mb-10&quot;&gt;
            &lt;h2 className=&quot;text-xl font-bold text-gray-900 flex items-center gap-2 mb-6&quot;&gt;
              &lt;Clock className=&quot;w-5 h-5 text-purple-600&quot; /&gt;
              What We&apos;ve Learned
            &lt;/h2&gt;
            
            &lt;div className=&quot;relative pl-6 border-l-2 border-purple-100 space-y-4&quot;&gt;
              {learningTimeline.map((entry, idx) =&gt; (
                &lt;div key={idx} className=&quot;relative&quot;&gt;
                  &lt;div className=&quot;absolute -left-8 w-4 h-4 rounded-full bg-white border-2 border-purple-300&quot;&gt;&lt;/div&gt;
                  &lt;div className=&quot;flex items-start gap-3&quot;&gt;
                    &lt;div className=&quot;flex-1&quot;&gt;
                      &lt;p className=&quot;text-gray-800&quot;&gt;{entry.text}&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;Badge variant=&quot;outline&quot; className={`text-xs shrink-0 ${
                      entry.source === &apos;behaviour&apos; ? &apos;border-green-300 text-green-700&apos; :
                      entry.source === &apos;mira&apos; ? &apos;border-purple-300 text-purple-700&apos; :
                      &apos;border-blue-300 text-blue-700&apos;
                    }`}&gt;
                      {entry.source === &apos;behaviour&apos; ? &apos;From behaviour&apos; :
                       entry.source === &apos;mira&apos; ? &apos;From Mira&apos; : &apos;From you&apos;}
                    &lt;/Badge&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              ))}
            &lt;/div&gt;
          &lt;/section&gt;
        )}

        {/* ========== ACHIEVEMENTS - Stage 3+ Only, Quiet ========== */}
        {stage &gt;= 3 &amp;&amp; achievements.length &gt; 0 &amp;&amp; (
          &lt;section className=&quot;mb-10&quot;&gt;
            &lt;h2 className=&quot;text-xl font-bold text-gray-900 flex items-center gap-2 mb-6&quot;&gt;
              &lt;Star className=&quot;w-5 h-5 text-amber-500&quot; /&gt;
              {petName}&apos;s Milestones
            &lt;/h2&gt;
            
            &lt;div className=&quot;grid grid-cols-2 md:grid-cols-4 gap-3&quot;&gt;
              {achievements.map((achievement, idx) =&gt; (
                &lt;Card key={idx} className=&quot;p-4 bg-amber-50/50 border-amber-100&quot;&gt;
                  &lt;div className=&quot;flex items-center gap-3&quot;&gt;
                    &lt;span className=&quot;text-2xl&quot;&gt;{achievement.icon}&lt;/span&gt;
                    &lt;p className=&quot;text-sm font-medium text-gray-700&quot;&gt;{achievement.name}&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/Card&gt;
              ))}
            &lt;/div&gt;
          &lt;/section&gt;
        )}

        {/* ========== PERSONALISED CARE INSIGHTS - Stage 3+ ========== */}
        {stage &gt;= 3 &amp;&amp; careInsights.length &gt; 0 &amp;&amp; (
          &lt;section className=&quot;mb-10&quot;&gt;
            &lt;h2 className=&quot;text-xl font-bold text-gray-900 flex items-center gap-2 mb-6&quot;&gt;
              &lt;Heart className=&quot;w-5 h-5 text-rose-500&quot; /&gt;
              What Helps {petName} Most
            &lt;/h2&gt;
            
            &lt;Card className=&quot;p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100&quot;&gt;
              &lt;ul className=&quot;space-y-3&quot;&gt;
                {careInsights.map((insight, idx) =&gt; (
                  &lt;li key={idx} className=&quot;flex items-start gap-3&quot;&gt;
                    &lt;span className=&quot;text-rose-400 mt-0.5&quot;&gt;•&lt;/span&gt;
                    &lt;p className=&quot;text-gray-700&quot;&gt;{insight}&lt;/p&gt;
                  &lt;/li&gt;
                ))}
              &lt;/ul&gt;
            &lt;/Card&gt;
          &lt;/section&gt;
        )}

        {/* ========== MIRA AI - Always Available ========== */}
        &lt;section className=&quot;mb-10&quot;&gt;
          &lt;Card className=&quot;bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden&quot;&gt;
            &lt;div className=&quot;p-6 flex flex-col md:flex-row items-center gap-6&quot;&gt;
              &lt;div className=&quot;w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0&quot;&gt;
                &lt;Sparkles className=&quot;w-7 h-7 text-yellow-300&quot; /&gt;
              &lt;/div&gt;
              &lt;div className=&quot;flex-1 text-center md:text-left&quot;&gt;
                &lt;h3 className=&quot;text-lg font-bold mb-1&quot;&gt;Mira Knows {petName}&lt;/h3&gt;
                &lt;p className=&quot;text-white/80 text-sm&quot;&gt;
                  Ask Mira anything — she already knows {petName}&apos;s preferences and history.
                &lt;/p&gt;
              &lt;/div&gt;
              &lt;Button 
                onClick={onOpenMira}
                className=&quot;bg-white text-purple-600 hover:bg-purple-50 px-6&quot;
                data-testid=&quot;journey-chat-mira-btn&quot;
              &gt;
                &lt;Sparkles className=&quot;w-4 h-4 mr-2&quot; /&gt;
                Chat with Mira
              &lt;/Button&gt;
            &lt;/div&gt;
          &lt;/Card&gt;
        &lt;/section&gt;

        {/* ========== GENTLE NEXT STEP - Stage 2+ Only, ONE question ========== */}
        {stage &gt;= 2 &amp;&amp; stage &lt; 4 &amp;&amp; (
          &lt;section className=&quot;mb-10&quot;&gt;
            &lt;Card className=&quot;p-6 bg-white border-dashed border-2 border-purple-200&quot;&gt;
              &lt;p className=&quot;text-gray-600 text-sm mb-2&quot;&gt;One thing that would help us care better:&lt;/p&gt;
              &lt;p className=&quot;text-gray-900 font-medium mb-4&quot;&gt;
                Does {petName} enjoy being groomed at home or prefer salon visits?
              &lt;/p&gt;
              &lt;div className=&quot;flex gap-2&quot;&gt;
                &lt;Button variant=&quot;outline&quot; size=&quot;sm&quot; className=&quot;text-purple-600 border-purple-200&quot;&gt;
                  At home
                &lt;/Button&gt;
                &lt;Button variant=&quot;outline&quot; size=&quot;sm&quot; className=&quot;text-purple-600 border-purple-200&quot;&gt;
                  Salon visits
                &lt;/Button&gt;
                &lt;Button variant=&quot;ghost&quot; size=&quot;sm&quot; className=&quot;text-gray-400&quot;&gt;
                  Skip for now
                &lt;/Button&gt;
              &lt;/div&gt;
            &lt;/Card&gt;
          &lt;/section&gt;
        )}

        {/* Stage 4: Minimal prompt */}
        {stage === 4 &amp;&amp; (
          &lt;section className=&quot;mb-10&quot;&gt;
            &lt;Card className=&quot;p-6 bg-gray-50 border-gray-100 text-center&quot;&gt;
              &lt;p className=&quot;text-gray-600&quot;&gt;
                If anything changes with {petName}, tell us. We&apos;ll adjust.
              &lt;/p&gt;
            &lt;/Card&gt;
          &lt;/section&gt;
        )}
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

export default PetSoulJourney;
