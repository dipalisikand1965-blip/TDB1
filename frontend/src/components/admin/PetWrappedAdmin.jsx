/**
 * Pet Wrapped Admin Component
 * Manage Pet Wrapped generation, previews, and sharing
 */
import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Share2, RefreshCw, Eye, Download, Calendar } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const PetWrappedAdmin = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [wrappedData, setWrappedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingMemory, setGeneratingMemory] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pets`);
      if (res.ok) {
        const data = await res.json();
        setPets(Array.isArray(data) ? data : data.pets || []);
      }
    } catch (err) {
      console.error('Failed to fetch pets:', err);
    }
  };

  const backfillSoulScores = async () => {
    setBackfilling(true);
    try {
      const res = await fetch(`${API_URL}/api/wrapped/admin/backfill-soul-scores`, {
        method: 'POST'
      });
      const data = await res.json();
      setMessage(`✅ Backfilled ${data.backfilled} pets with soul score history`);
    } catch (err) {
      setMessage('❌ Failed to backfill soul scores');
    }
    setBackfilling(false);
  };

  const generateWrapped = async (petId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wrapped/generate/${petId}`);
      const data = await res.json();
      setWrappedData(data);
      setMessage(`✅ Generated Pet Wrapped for ${data.pet_name}`);
    } catch (err) {
      setMessage('❌ Failed to generate wrapped');
    }
    setLoading(false);
  };

  const generateMemory = async (petId) => {
    setGeneratingMemory(true);
    try {
      const res = await fetch(`${API_URL}/api/wrapped/generate-memory/${petId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Mira's memory: "${data.memory}"`);
        // Refresh wrapped data
        await generateWrapped(petId);
      } else {
        setMessage(`⚠️ Using fallback: ${data.fallback_memory}`);
      }
    } catch (err) {
      setMessage('❌ Failed to generate memory');
    }
    setGeneratingMemory(false);
  };

  const openShareCard = (petId) => {
    window.open(`${API_URL}/api/wrapped/share/${petId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Gift className="w-10 h-10 text-amber-400" />
            <h1 className="text-4xl font-serif text-white">Pet Wrapped</h1>
          </div>
          <p className="text-purple-200">Generate beautiful year-in-review cards for each pet</p>
          <p className="text-amber-400 text-sm mt-2">🚀 Launch Date: May 20, 2026 — Mystique's Birthday</p>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4 mb-6 text-white">
            {message}
          </div>
        )}

        {/* Soul Score Backfill */}
        <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Soul Score History
          </h2>
          <p className="text-purple-200 text-sm mb-4">
            Initialize soul score tracking for all pets. This creates the journey arc (42 → 68 → 94).
          </p>
          <button
            onClick={backfillSoulScores}
            disabled={backfilling}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {backfilling ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Backfilling...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Backfill All Pets</>
            )}
          </button>
        </div>

        {/* Pet List */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pet Selection */}
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-purple-300 mb-4">Select Pet</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pets.map(pet => (
                <button
                  key={pet._id || pet.id}
                  onClick={() => {
                    setSelectedPet(pet);
                    generateWrapped(pet._id || pet.id);
                  }}
                  className={`w-full p-4 rounded-lg text-left transition ${
                    selectedPet?._id === pet._id 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{pet.name}</span>
                      <span className="text-sm opacity-70 ml-2">{pet.breed}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-400">{pet.soul_score || 0}%</div>
                      <div className="text-xs opacity-60">Soul Score</div>
                    </div>
                  </div>
                  {pet.rainbow_bridge && (
                    <span className="text-xs text-rose-300 mt-1 block">🌈 Rainbow Bridge</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Wrapped Preview */}
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-purple-300 mb-4">Generated Wrapped</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                <p className="text-purple-200">Generating Pet Wrapped...</p>
              </div>
            ) : wrappedData ? (
              <div className="space-y-4">
                {/* Cover Card Preview */}
                <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-xl p-6 border border-amber-500/20">
                  <div className="text-amber-400 text-xs uppercase tracking-wider mb-2">
                    Pet Wrapped · {wrappedData.year}
                  </div>
                  <h3 className="text-3xl font-serif text-white mb-1">
                    <em className="text-amber-300">{wrappedData.pet_name}</em>
                  </h3>
                  <p className="text-purple-300 text-sm">{wrappedData.cards?.cover?.breed}</p>
                  
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-serif text-amber-400">
                      {wrappedData.cards?.soul_score?.current_score}
                    </span>
                    <span className="text-purple-300 text-sm">Soul Score</span>
                  </div>
                  
                  <p className="mt-4 text-purple-200 italic text-sm border-l-2 border-amber-500 pl-3">
                    {wrappedData.cards?.cover?.tagline}
                  </p>
                </div>

                {/* Mira Moments */}
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <h4 className="text-rose-300 text-sm uppercase tracking-wider mb-2">Mira Moments</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-rose-300">
                        {wrappedData.cards?.mira_moments?.conversation_count}
                      </div>
                      <div className="text-xs text-purple-300">Conversations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-rose-300">
                        {wrappedData.cards?.mira_moments?.questions_answered}
                      </div>
                      <div className="text-xs text-purple-300">Questions Answered</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => generateMemory(selectedPet._id || selectedPet.id)}
                    disabled={generatingMemory}
                    className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingMemory ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate AI Memory</>
                    )}
                  </button>
                  <button
                    onClick={() => openShareCard(selectedPet._id || selectedPet.id)}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> View Share Card
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-purple-300">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a pet to generate their Pet Wrapped</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center space-x-4">
          <a 
            href="/pet-wrapped-mystique.html" 
            target="_blank"
            className="text-purple-300 hover:text-white underline"
          >
            View Design Template →
          </a>
          <a 
            href={`${API_URL}/api/wrapped/share/699fa0a513e44c977327ad57`}
            target="_blank"
            className="text-amber-300 hover:text-white underline"
          >
            Mystique's Share Card →
          </a>
        </div>
      </div>
    </div>
  );
};

export default PetWrappedAdmin;
