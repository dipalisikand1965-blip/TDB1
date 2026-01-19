import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Heart, ChevronRight, ChevronLeft, Check, Sparkles, 
  Camera, Calendar, Scale, Dog, AlertCircle, Plus,
  Home, Plane, Utensils, GraduationCap, Sunset, Users,
  Clock, Shield, Star, Gift, Trophy, Zap, Crown
} from 'lucide-react';
import { API_URL } from '../utils/api';
import BreedAutocomplete from './BreedAutocomplete';

// GAMIFICATION CONFIG
const GAMIFICATION = {
  pointsPerAnswer: 10,
  bonusPerFolder: 25,
  milestones: [
    { percent: 25, name: "Explorer 🐾", points: 100, reward: "Unlock personalized product recommendations", color: "from-blue-400 to-blue-600" },
    { percent: 50, name: "Adventurer 🌟", points: 250, reward: "10% off your next purchase", color: "from-purple-400 to-purple-600" },
    { percent: 75, name: "Champion 🏆", points: 500, reward: "Free treat on your pet's birthday", color: "from-amber-400 to-orange-500" },
    { percent: 100, name: "Soul Master 👑", points: 1000, reward: "VIP status + Priority support", color: "from-pink-500 to-rose-600" }
  ]
};

// Confetti Animation Component
const Confetti = ({ active }) => {
  if (!active) return null;
  
  const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 8
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
};

// Milestone Badge Component
const MilestoneBadge = ({ milestone, achieved, current }) => {
  const isNext = !achieved && current < milestone.percent;
  
  return (
    <div className={`relative p-3 rounded-xl border-2 transition-all ${
      achieved 
        ? `bg-gradient-to-r ${milestone.color} text-white border-transparent shadow-lg` 
        : isNext
          ? 'border-dashed border-purple-300 bg-purple-50'
          : 'border-gray-200 bg-gray-50 opacity-60'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          achieved ? 'bg-white/20' : 'bg-white'
        }`}>
          {achieved ? (
            <Check className="w-5 h-5" />
          ) : (
            <span className="text-lg">{milestone.name.split(' ')[1]}</span>
          )}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${achieved ? 'text-white' : 'text-gray-900'}`}>
            {milestone.name}
          </p>
          <p className={`text-xs ${achieved ? 'text-white/80' : 'text-gray-500'}`}>
            {milestone.percent}% Complete • {milestone.points} pts
          </p>
        </div>
        {achieved && (
          <Badge className="bg-white/20 text-white border-0 text-xs">
            Unlocked!
          </Badge>
        )}
      </div>
      {!achieved && (
        <p className="text-xs mt-2 text-gray-600">🎁 {milestone.reward}</p>
      )}
    </div>
  );
};

// Points Display Component  
const PointsDisplay = ({ points, newPoints }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  
  useEffect(() => {
    if (newPoints > 0) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1000);
    }
  }, [newPoints]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full border border-amber-200">
      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
      <span className="font-bold text-amber-700">{points}</span>
      <span className="text-xs text-amber-600">Soul Points</span>
      {showAnimation && (
        <span className="absolute ml-16 text-green-600 font-bold text-sm animate-bounce">
          +{newPoints}
        </span>
      )}
    </div>
  );
};

// Rewards Preview Modal
const RewardsModal = ({ isOpen, onClose, currentProgress, totalPoints }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Your Paw Rewards 🐾</h2>
          <p className="text-gray-500 mt-1">Complete Pet Soul to unlock amazing rewards!</p>
        </div>
        
        <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
          <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
          <div>
            <p className="text-3xl font-bold text-amber-700">{totalPoints}</p>
            <p className="text-sm text-amber-600">Total Soul Points</p>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          {GAMIFICATION.milestones.map((milestone) => (
            <MilestoneBadge 
              key={milestone.percent}
              milestone={milestone}
              achieved={currentProgress >= milestone.percent}
              current={currentProgress}
            />
          ))}
        </div>
        
        <Button onClick={onClose} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          Keep Earning Points!
        </Button>
      </div>
    </div>
  );
};

// Folder icon mapping
const FOLDER_ICONS = {
  identity_temperament: '🎭',
  family_pack: '👨‍👩‍👧‍👦',
  rhythm_routine: '⏰',
  home_comforts: '🏠',
  travel_style: '✈️',
  taste_treat: '🍖',
  training_behaviour: '🎓',
  long_horizon: '🌅'
};

// Score Ring Component
const ScoreRing = ({ score, size = 80, strokeWidth = 8, color = "#8B5CF6" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{Math.round(score)}%</span>
      </div>
    </div>
  );
};

// Folder Card Component
const FolderCard = ({ folder, score, questionsAnswered, questionsTotal, onClick, isActive }) => {
  return (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
        isActive ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{folder.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{folder.name}</h3>
          <p className="text-xs text-gray-500">{questionsAnswered}/{questionsTotal} answered</p>
        </div>
        <ScoreRing score={score} size={50} strokeWidth={5} />
      </div>
      <Progress value={score} className="mt-3 h-1.5" />
    </Card>
  );
};

// Single Question Component
const QuestionCard = ({ question, answer, onAnswer, onSkip, onBack, isFirst }) => {
  const [localAnswer, setLocalAnswer] = useState(answer || (question.type === 'multi_select' ? [] : ''));
  
  useEffect(() => {
    setLocalAnswer(answer || (question.type === 'multi_select' ? [] : ''));
  }, [question.id, answer]);
  
  const handleSelect = (value) => {
    if (question.type === 'multi_select') {
      const newAnswer = localAnswer.includes(value)
        ? localAnswer.filter(v => v !== value)
        : [...localAnswer, value];
      setLocalAnswer(newAnswer);
    } else {
      setLocalAnswer(value);
      // Auto-advance for single select
      setTimeout(() => onAnswer(value), 300);
    }
  };
  
  const handleSubmit = () => {
    if (localAnswer && (Array.isArray(localAnswer) ? localAnswer.length > 0 : true)) {
      onAnswer(localAnswer);
    }
  };
  
  return (
    <div className="max-w-xl mx-auto">
      {/* Folder badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{question.folder_icon}</span>
        <Badge variant="outline" className="text-purple-700">{question.folder_name}</Badge>
      </div>
      
      {/* Question */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{question.question}</h2>
      
      {/* Answer options */}
      {question.type === 'select' && (
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                localAnswer === option
                  ? 'border-purple-500 bg-purple-50 text-purple-900'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option}</span>
                {localAnswer === option && <Check className="w-5 h-5 text-purple-600" />}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {question.type === 'multi_select' && (
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                localAnswer.includes(option)
                  ? 'border-purple-500 bg-purple-50 text-purple-900'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option}</span>
                {localAnswer.includes(option) && <Check className="w-5 h-5 text-purple-600" />}
              </div>
            </button>
          ))}
          <Button 
            onClick={handleSubmit} 
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
            disabled={localAnswer.length === 0}
          >
            Continue <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
      
      {question.type === 'text' && (
        <div className="space-y-4">
          <textarea
            value={localAnswer}
            onChange={(e) => setLocalAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 min-h-[120px] text-lg"
          />
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!localAnswer.trim()}
          >
            Continue <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {!isFirst ? (
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        ) : <div />}
        <Button variant="ghost" onClick={onSkip} className="text-gray-500">
          Skip for now
        </Button>
      </div>
    </div>
  );
};

// Identity Form Component
const IdentityForm = ({ identity, onSave, onNext }) => {
  const [form, setForm] = useState(identity || {
    name: '',
    breed: '',
    birth_date: '',
    gotcha_date: '',
    weight: '',
    weight_unit: 'kg',
    gender: '',
    is_neutered: null,
    photo_url: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.birth_date && !form.gotcha_date) newErrors.dates = 'Please provide either birth date or gotcha day';
    if (!form.weight) newErrors.weight = 'Weight is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validate()) {
      onSave(form);
      onNext();
    }
  };
  
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Dog className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Let's start with the basics</h2>
        <p className="text-gray-500 mt-2">Tell us about your furry friend</p>
      </div>
      
      {/* Photo Upload */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
            {form.photo_url ? (
              <img src={form.photo_url} alt="Pet" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pet's Name *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          placeholder="What do you call them?"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      
      {/* Breed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
        <BreedAutocomplete
          value={form.breed}
          onChange={(e) => setForm({...form, breed: e.target.value})}
          placeholder="e.g., Golden Retriever, Indie Mix"
          name="breed"
        />
      </div>
      
      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" /> Birth Date
          </label>
          <Input
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm({...form, birth_date: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Heart className="w-4 h-4 inline mr-1" /> Gotcha Day
          </label>
          <Input
            type="date"
            value={form.gotcha_date}
            onChange={(e) => setForm({...form, gotcha_date: e.target.value})}
          />
        </div>
      </div>
      {errors.dates && <p className="text-red-500 text-xs">{errors.dates}</p>}
      
      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Scale className="w-4 h-4 inline mr-1" /> Weight *
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={form.weight}
            onChange={(e) => setForm({...form, weight: e.target.value})}
            placeholder="Current weight"
            className={`flex-1 ${errors.weight ? 'border-red-500' : ''}`}
          />
          <select
            value={form.weight_unit}
            onChange={(e) => setForm({...form, weight_unit: e.target.value})}
            className="px-3 py-2 border rounded-md"
          >
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
        </div>
        {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
      </div>
      
      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
        <div className="flex gap-3">
          {['male', 'female'].map((g) => (
            <button
              key={g}
              onClick={() => setForm({...form, gender: g})}
              className={`flex-1 p-3 rounded-xl border-2 capitalize transition-all ${
                form.gender === g
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {g === 'male' ? '♂️' : '♀️'} {g}
            </button>
          ))}
        </div>
      </div>
      
      {/* Neutered */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Neutered/Spayed?</label>
        <div className="flex gap-3">
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
            { value: null, label: 'Not yet' }
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setForm({...form, is_neutered: opt.value})}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                form.is_neutered === opt.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      <Button onClick={handleSubmit} className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg">
        Continue to Doggy Soul <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
};

// Main Pet Soul Component
const PetSoulEnhanced = ({ petId, onComplete }) => {
  const [step, setStep] = useState('loading'); // loading, welcome, identity, questions, complete
  const [pet, setPet] = useState(null);
  const [progress, setProgress] = useState(null);
  const [questionBank, setQuestionBank] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState([]);
  
  // Gamification state
  const [soulPoints, setSoulPoints] = useState(0);
  const [newPointsEarned, setNewPointsEarned] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);
  
  // Calculate total points based on progress
  const calculatePoints = (progressScore) => {
    const answeredCount = Math.floor((progressScore / 100) * 50); // Assuming ~50 total questions
    let points = answeredCount * GAMIFICATION.pointsPerAnswer;
    
    // Add milestone bonuses
    GAMIFICATION.milestones.forEach(m => {
      if (progressScore >= m.percent) {
        points += GAMIFICATION.bonusPerFolder;
      }
    });
    
    return points;
  };
  
  // Check for milestone achievement
  const checkMilestone = (newProgress) => {
    const currentMilestoneIndex = GAMIFICATION.milestones.findIndex(m => m.percent > lastMilestone && newProgress >= m.percent);
    if (currentMilestoneIndex !== -1) {
      const milestone = GAMIFICATION.milestones[currentMilestoneIndex];
      setLastMilestone(milestone.percent);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      return milestone;
    }
    return null;
  };
  
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get question bank
        const qRes = await fetch(`${API_URL}/api/pet-soul/questions`);
        const qData = await qRes.json();
        setQuestionBank(qData);
        
        if (petId) {
          // Get existing profile
          const pRes = await fetch(`${API_URL}/api/pet-soul/profile/${petId}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            setPet(pData.pet);
            setProgress(pData.scores);
            setAnswers(pData.pet.doggy_soul_answers || {});
            setCurrentQuestion(pData.next_question);
            
            // Determine starting step - check both identity.name and top-level name
            const petName = pData.pet.identity?.name || pData.pet.name;
            if (!petName) {
              // New pet - show welcome first
              setStep('welcome');
            } else if (pData.scores.overall < 100) {
              // Has some progress - show welcome if score is 0, else continue
              if (pData.scores.overall === 0) {
                setStep('welcome');
              } else {
                setStep('questions');
              }
            } else {
              setStep('complete');
            }
          } else {
            setStep('welcome');
          }
        } else {
          setStep('welcome');
        }
      } catch (error) {
        console.error('Error loading pet soul:', error);
        setStep('welcome');
      }
    };
    
    fetchData();
  }, [petId]);
  
  // Save identity
  const saveIdentity = async (identity) => {
    try {
      if (petId) {
        await fetch(`${API_URL}/api/pet-soul/profile/${petId}/identity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(identity)
        });
      }
      setPet(prev => ({ ...prev, identity }));
    } catch (error) {
      console.error('Error saving identity:', error);
    }
  };
  
  // Save answer
  const saveAnswer = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    setHistory([...history, currentQuestion]);
    
    // Award points for answering
    if (answer !== null) {
      setNewPointsEarned(GAMIFICATION.pointsPerAnswer);
      setSoulPoints(prev => prev + GAMIFICATION.pointsPerAnswer);
      setTimeout(() => setNewPointsEarned(0), 1500);
    }
    
    try {
      if (petId) {
        const res = await fetch(`${API_URL}/api/pet-soul/profile/${petId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: questionId,
            folder: currentQuestion.folder,
            answer: answer,
            source: 'direct'
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          const newProgress = data.scores?.overall || 0;
          
          // Check for milestone achievement
          const milestone = checkMilestone(newProgress);
          if (milestone) {
            // Award bonus points for milestone
            setSoulPoints(prev => prev + GAMIFICATION.bonusPerFolder);
          }
          
          setProgress(data.scores);
          setCurrentQuestion(data.next_question);
          
          if (!data.next_question) {
            setShowConfetti(true);
            setTimeout(() => {
              setShowConfetti(false);
              setStep('complete');
            }, 2000);
          }
        }
      } else {
        // Find next unanswered question
        const folders = questionBank.folder_order;
        for (const folderKey of folders) {
          const folder = questionBank.folders[folderKey];
          for (const q of folder.questions) {
            if (!newAnswers[q.id]) {
              setCurrentQuestion({
                ...q,
                folder: folderKey,
                folder_name: folder.name,
                folder_icon: folder.icon
              });
              return;
            }
          }
        }
        setStep('complete');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };
  
  // Go back to previous question
  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentQuestion(prev);
    }
  };
  
  // Skip question
  const skipQuestion = () => {
    saveAnswer(currentQuestion.id, null);
  };
  
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading Pet Soul...</p>
        </div>
      </div>
    );
  }
  
  // Welcome/Onboarding Screen
  if (step === 'welcome') {
    const petName = pet?.name || pet?.identity?.name || 'your furry friend';
    return (
      <div className="py-8 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {/* Animated paw prints */}
          <div className="flex justify-center gap-2 mb-6">
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0ms' }}>🐾</span>
            <span className="text-4xl animate-bounce" style={{ animationDelay: '150ms' }}>🐾</span>
            <span className="text-4xl animate-bounce" style={{ animationDelay: '300ms' }}>🐾</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent mb-4">
            Welcome to Pet Soul
          </h1>
          
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Help us understand {petName} better so we can provide the most personalized experience
          </p>
        </div>
        
        {/* Rewards Preview - NEW GAMIFICATION */}
        <Card className="p-5 mb-8 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Earn Soul Points & Unlock Rewards!</h3>
              <p className="text-sm text-amber-700">Complete the journey to become a Soul Master</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {GAMIFICATION.milestones.map((m, idx) => (
              <div key={idx} className="p-2 bg-white/60 rounded-lg text-center border border-amber-200/50">
                <span className="text-xl">{m.name.split(' ')[1]}</span>
                <p className="text-xs font-medium text-gray-700">{m.name.split(' ')[0]}</p>
                <p className="text-[10px] text-amber-600">{m.points} pts</p>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-center text-amber-600 mt-3">
            🎁 Unlock discounts, free treats, and VIP status as you progress!
          </p>
        </Card>
        
        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl shrink-0">
                🎯
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Personalized Recommendations</h3>
                <p className="text-sm text-gray-600">Get treats, food, and products tailored to your pet's unique preferences</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-pink-50 to-white border-pink-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-xl shrink-0">
                🎂
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Perfect Celebrations</h3>
                <p className="text-sm text-gray-600">We'll know exactly what makes your pet happy on their special days</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl shrink-0">
                🏨
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Better Stays & Experiences</h3>
                <p className="text-sm text-gray-600">Our team will know their comfort needs, anxieties, and routines</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl shrink-0">
                💚
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">We Remember Everything</h3>
                <p className="text-sm text-gray-600">Allergies, preferences, quirks - we'll never forget what matters</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* What to Expect */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            What to Expect
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">8</div>
              <span>Categories covering everything about your pet's life</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">~5</div>
              <span>Minutes to complete (answer at your own pace)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="w-5 h-5 text-green-500" />
              <span>Skip any question - come back anytime to complete</span>
            </div>
          </div>
        </Card>
        
        {/* 8 Folders Preview */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">We'll Learn About</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(FOLDER_ICONS).map(([key, icon]) => (
              <div 
                key={key}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm flex items-center gap-1.5 hover:bg-gray-50"
              >
                <span>{icon}</span>
                <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="text-center">
          <Button
            onClick={() => setStep('identity')}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Heart className="w-5 h-5 mr-2" />
            Let's Build {petName}'s Soul
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-xs text-gray-400 mt-4">
            Your answers help us serve {petName} better across all our services
          </p>
        </div>
      </div>
    );
  }
  
  if (step === 'identity') {
    return (
      <div className="py-8 px-4">
        <IdentityForm
          identity={pet?.identity}
          onSave={saveIdentity}
          onNext={() => setStep('questions')}
        />
      </div>
    );
  }
  
  if (step === 'complete') {
    const achievedMilestones = GAMIFICATION.milestones.filter(m => (progress?.overall || 100) >= m.percent);
    const highestMilestone = achievedMilestones[achievedMilestones.length - 1];
    
    return (
      <div className="py-8 px-4 max-w-xl mx-auto text-center">
        <Confetti active={showConfetti} />
        
        {/* Celebration Header */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 left-0 right-0 flex justify-center">
            <span className="text-4xl animate-bounce">🎉</span>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
          {highestMilestone?.name || 'Soul Master 👑'}
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {pet?.identity?.name || 'Your pet'}'s Soul is complete!
        </p>
        
        {/* Points Earned */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 mb-6 border border-amber-200">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
            <span className="text-4xl font-bold text-amber-700">{soulPoints || calculatePoints(100)}</span>
          </div>
          <p className="text-amber-600 font-medium">Soul Points Earned!</p>
        </div>
        
        {/* Rewards Unlocked */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Rewards Unlocked
          </h3>
          <div className="space-y-2">
            {achievedMilestones.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">{m.reward}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Score Ring */}
        <div className="flex justify-center mb-6">
          <ScoreRing score={progress?.overall || 100} size={100} strokeWidth={8} color="#8B5CF6" />
        </div>
        
        <Button onClick={onComplete} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3">
          View Full Profile
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    );
  }
  
  // Questions step
  return (
    <div className="py-8 px-4">
      <Confetti active={showConfetti} />
      <RewardsModal 
        isOpen={showRewardsModal} 
        onClose={() => setShowRewardsModal(false)}
        currentProgress={progress?.overall || 0}
        totalPoints={soulPoints}
      />
      
      {/* Gamified Progress Header */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Building {pet?.identity?.name || 'pet'}'s soul</span>
          </div>
          <div className="flex items-center gap-2">
            <PointsDisplay points={soulPoints} newPoints={newPointsEarned} />
            <button 
              onClick={() => setShowRewardsModal(true)}
              className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
            >
              <Trophy className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar with Milestones */}
        <div className="relative">
          <Progress value={progress?.overall || 0} className="h-3 bg-gray-100" />
          <div className="absolute top-0 left-0 right-0 h-3 flex justify-between pointer-events-none">
            {GAMIFICATION.milestones.map((m) => (
              <div 
                key={m.percent}
                className="relative"
                style={{ left: `${m.percent}%`, position: 'absolute', transform: 'translateX(-50%)' }}
              >
                <div className={`w-4 h-4 rounded-full border-2 ${
                  (progress?.overall || 0) >= m.percent 
                    ? 'bg-purple-600 border-purple-600' 
                    : 'bg-white border-gray-300'
                } -mt-0.5`}>
                  {(progress?.overall || 0) >= m.percent && (
                    <Check className="w-3 h-3 text-white" style={{ marginTop: '-1px', marginLeft: '1px' }} />
                  )}
                </div>
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">
                  {m.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between mt-6 text-xs">
          <span className="text-gray-400">🐾 Explorer</span>
          <span className="text-gray-400">🌟 Adventurer</span>
          <span className="text-gray-400">🏆 Champion</span>
          <span className="text-gray-400">👑 Master</span>
        </div>
      </div>
      
      {/* Current Question */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onAnswer={(answer) => saveAnswer(currentQuestion.id, answer)}
          onSkip={skipQuestion}
          onBack={goBack}
          isFirst={history.length === 0}
        />
      )}
      
      {/* Folder Overview */}
      {questionBank && progress?.folders && (
        <div className="max-w-xl mx-auto mt-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Soul Folders</h3>
          <div className="grid grid-cols-2 gap-3">
            {questionBank.folder_order.map((folderKey) => {
              const folder = questionBank.folders[folderKey];
              const score = progress.folders[folderKey] || 0;
              return (
                <div
                  key={folderKey}
                  className={`p-3 rounded-lg border ${
                    currentQuestion?.folder === folderKey
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{folder.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{folder.name}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetSoulEnhanced;
