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
  Clock, Shield
} from 'lucide-react';
import { API_URL } from '../utils/api';

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
        <Input
          value={form.breed}
          onChange={(e) => setForm({...form, breed: e.target.value})}
          placeholder="e.g., Golden Retriever, Indie Mix"
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
  const [step, setStep] = useState('loading'); // loading, identity, questions, complete
  const [pet, setPet] = useState(null);
  const [progress, setProgress] = useState(null);
  const [questionBank, setQuestionBank] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState([]);
  
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
            
            // Determine starting step
            if (!pData.pet.identity || !pData.pet.identity.name) {
              setStep('identity');
            } else if (pData.scores.overall < 100) {
              setStep('questions');
            } else {
              setStep('complete');
            }
          } else {
            setStep('identity');
          }
        } else {
          setStep('identity');
        }
      } catch (error) {
        console.error('Error loading pet soul:', error);
        setStep('identity');
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
          setProgress(data.scores);
          setCurrentQuestion(data.next_question);
          
          if (!data.next_question) {
            setStep('complete');
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
    return (
      <div className="py-8 px-4 max-w-xl mx-auto text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Doggy Soul Complete! 🎉</h2>
        <p className="text-gray-600 mb-8">
          We now know {pet?.identity?.name || 'your pet'} so much better. This helps us personalize every experience.
        </p>
        <div className="flex justify-center mb-8">
          <ScoreRing score={progress?.overall || 100} size={120} strokeWidth={10} />
        </div>
        <Button onClick={onComplete} className="bg-purple-600 hover:bg-purple-700">
          View Full Profile
        </Button>
      </div>
    );
  }
  
  // Questions step
  return (
    <div className="py-8 px-4">
      {/* Progress Header */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Building {pet?.identity?.name || 'pet'}'s soul</span>
          <span className="text-sm font-semibold text-purple-600">{Math.round(progress?.overall || 0)}% complete</span>
        </div>
        <Progress value={progress?.overall || 0} className="h-2" />
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
