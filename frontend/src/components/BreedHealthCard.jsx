import React, { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Heart, AlertTriangle, Sparkles, Activity, Scissors, 
  Thermometer, ChevronDown, ChevronUp, Stethoscope,
  Clock, Calendar, Shield, PawPrint, Sun, Info
} from 'lucide-react';
import { 
  getBreedHealthData, 
  getTopHealthConcerns,
  getPrioritizedCareTips,
  getClimateSuitability,
  SEVERITY_CONFIG,
  EXERCISE_LEVELS,
  GROOMING_LEVELS
} from '../utils/breedHealth';

const BreedHealthCard = ({ breed, petName, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const healthData = getBreedHealthData(breed);
  const topConcerns = getTopHealthConcerns(breed);
  const careTips = getPrioritizedCareTips(breed);
  const climateSuitability = getClimateSuitability(breed);
  
  if (!healthData || healthData === getBreedHealthData('unknown')) {
    return null; // Don't show for unknown breeds
  }

  const exerciseInfo = EXERCISE_LEVELS[healthData.exerciseLevel] || EXERCISE_LEVELS['medium'];
  const groomingInfo = GROOMING_LEVELS[healthData.groomingLevel] || GROOMING_LEVELS['medium'];

  if (compact) {
    return (
      <Card className="p-4 bg-gradient-to-r from-teal-50 to-white border-teal-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Breed Health Tips</h4>
              <p className="text-sm text-gray-500">{breed}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-teal-600 border-teal-200">
            {healthData.lifeExpectancy}
          </Badge>
        </div>
        
        {/* Top concern */}
        {topConcerns[0] && (
          <div className={`mt-3 p-3 rounded-lg ${SEVERITY_CONFIG[topConcerns[0].severity].color} border`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">{topConcerns[0].name}</span>
            </div>
            <p className="text-xs mt-1 opacity-80">{topConcerns[0].description}</p>
          </div>
        )}
        
        {/* Quick tip */}
        {careTips[0] && (
          <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>{careTips[0].tip}</span>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-100" data-testid="breed-health-card">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">
              {healthData.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold capitalize">{breed} Health Guide</h3>
              <p className="text-teal-100 text-sm">
                Personalized care tips for {petName || 'your pet'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{healthData.lifeExpectancy}</div>
            <div className="text-teal-200 text-xs">Life Expectancy</div>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <Activity className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xs text-teal-100">Exercise</div>
            <div className="font-semibold text-sm">{exerciseInfo.label.split(' ')[0]}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <Scissors className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xs text-teal-100">Grooming</div>
            <div className="font-semibold text-sm">{groomingInfo.label.split(' ')[0]}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <Thermometer className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xs text-teal-100">Indian Climate</div>
            <div className="font-semibold text-sm">{climateSuitability.rating}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Temperament */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            Temperament
          </h4>
          <div className="flex flex-wrap gap-2">
            {healthData.temperament.map((trait, i) => (
              <Badge key={i} variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        {/* Health Concerns */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Health Watch Areas
          </h4>
          <div className="space-y-2">
            {healthData.healthConcerns.slice(0, expanded ? undefined : 3).map((concern, i) => {
              const severityConfig = SEVERITY_CONFIG[concern.severity];
              return (
                <div 
                  key={i} 
                  className={`p-3 rounded-lg border ${severityConfig.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{concern.name}</span>
                    <Badge variant="outline" className={severityConfig.color}>
                      {severityConfig.icon} {severityConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1 opacity-80">{concern.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Care Tips */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-500" />
            Care Tips
          </h4>
          <div className="grid gap-3">
            {careTips.slice(0, expanded ? undefined : 4).map((tip, i) => {
              const icons = {
                grooming: Scissors,
                exercise: Activity,
                dental: Sparkles,
                health: Stethoscope,
                nutrition: Heart,
                temperature: Sun,
                training: PawPrint,
                eyes: Shield,
                ears: Shield,
                weight: Activity,
                mental: Sparkles,
                back: Shield,
                handling: PawPrint,
                safety: Shield,
                tick: Shield,
                socialization: Heart,
                lumps: AlertTriangle,
                containment: Shield,
                travel: Activity
              };
              const Icon = icons[tip.category] || Info;
              
              const frequencyColors = {
                always: 'bg-red-50 text-red-600 border-red-200',
                daily: 'bg-orange-50 text-orange-600 border-orange-200',
                weekly: 'bg-amber-50 text-amber-600 border-amber-200',
                monthly: 'bg-blue-50 text-blue-600 border-blue-200',
                yearly: 'bg-green-50 text-green-600 border-green-200',
                once: 'bg-gray-50 text-gray-600 border-gray-200'
              };

              return (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{tip.tip}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 text-xs capitalize ${frequencyColors[tip.frequency]}`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {tip.frequency}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vaccinations */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Recommended Vaccinations
          </h4>
          <div className="flex flex-wrap gap-2">
            {healthData.vaccinations.map((vax, i) => (
              <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {vax}
              </Badge>
            ))}
          </div>
        </div>

        {/* Dietary Needs */}
        {expanded && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-green-500" />
              Dietary Recommendations
            </h4>
            <ul className="space-y-2">
              {healthData.dietaryNeeds.map((need, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {need}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Climate Note */}
        {climateSuitability.note && (
          <div className={`p-4 rounded-lg border ${
            climateSuitability.suitable ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <Sun className={`w-5 h-5 ${climateSuitability.color}`} />
              <span className={`font-medium ${climateSuitability.color}`}>
                Indian Climate: {climateSuitability.rating}
              </span>
            </div>
            <p className="text-sm mt-1 text-gray-600">{climateSuitability.note}</p>
          </div>
        )}

        {/* Expand/Collapse Button */}
        {(healthData.healthConcerns.length > 3 || careTips.length > 4) && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show All Health Information
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BreedHealthCard;
