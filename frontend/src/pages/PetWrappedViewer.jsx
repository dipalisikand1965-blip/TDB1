/**
 * Pet Wrapped Viewer Page
 * Displays all 6 cards for a pet's year in review
 * Route: /wrapped/:petId
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Download, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { CoverCard, SoulScoreCard, MiraMomentsCard, PillarsCard, ClosingCard } from '../components/wrapped/WrappedCards';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const PetWrappedViewer = () => {
  const { petId } = useParams();
  const [wrappedData, setWrappedData] = useState(null);
  const [memory, setMemory] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentCard, setCurrentCard] = useState(0);
  const [error, setError] = useState(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    if (petId) {
      loadWrappedData();
    }
  }, [petId]);

  const loadWrappedData = async () => {
    setLoading(true);
    try {
      // Fetch wrapped data
      const res = await fetch(`${API_URL}/api/wrapped/generate/${petId}`);
      if (!res.ok) throw new Error('Failed to load Pet Wrapped');
      const data = await res.json();
      setWrappedData(data);

      // Fetch Mira's memory
      const memRes = await fetch(`${API_URL}/api/wrapped/memory/${petId}`);
      if (memRes.ok) {
        const memData = await memRes.json();
        if (memData.memory) {
          setMemory(memData.memory);
        }
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/api/wrapped/download/${petId}`;
    const shareText = `${wrappedData?.pet_name}'s Pet Wrapped ${wrappedData?.year} - See their soul journey! 🐾`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wrappedData?.pet_name}'s Pet Wrapped`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const openShareCard = () => {
    window.open(`${API_URL}/api/wrapped/share/${petId}`, '_blank');
  };

  const cards = wrappedData ? [
    { id: 'cover', component: CoverCard, props: { 
      data: wrappedData.cards?.cover, 
      petName: wrappedData.pet_name,
      breed: wrappedData.cards?.cover?.breed,
      year: wrappedData.year,
      rainbowBridge: wrappedData.cards?.cover?.rainbow_bridge
    }},
    { id: 'soul', component: SoulScoreCard, props: { 
      data: wrappedData.cards?.soul_score,
      petName: wrappedData.pet_name
    }},
    { id: 'mira', component: MiraMomentsCard, props: { 
      data: wrappedData.cards?.mira_moments,
      petName: wrappedData.pet_name,
      memory: memory
    }},
    { id: 'pillars', component: PillarsCard, props: { 
      data: wrappedData.cards?.pillars,
      petName: wrappedData.pet_name
    }},
    { id: 'closing', component: ClosingCard, props: { 
      petName: wrappedData.pet_name,
      parentName: wrappedData.cards?.closing?.parent_name || 'Pet Parent',
      rainbowBridge: wrappedData.cards?.closing?.rainbow_bridge,
      onShare: handleShare
    }},
  ] : [];

  const nextCard = () => {
    setCurrentCard((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const prevCard = () => {
    setCurrentCard((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0618] flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-purple-200 text-lg">Loading Pet Wrapped...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0618] flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 text-lg mb-4">{error}</p>
          <Link to="/" className="text-amber-400 underline">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0618] overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0618]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-amber-400 font-serif text-lg">
            The Doggy Company
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={openShareCard}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm transition"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-md mx-auto">
          {/* Card Navigation Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentCard(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentCard 
                    ? 'bg-amber-400 w-6' 
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Card Display */}
          <div className="relative" ref={cardsRef}>
            {cards.map((card, i) => {
              const CardComponent = card.component;
              return (
                <div
                  key={card.id}
                  className={`transition-all duration-500 ${
                    i === currentCard 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
                  }`}
                >
                  <div className="flex justify-center">
                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                      <CardComponent {...card.props} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={prevCard}
              disabled={currentCard === 0}
              className="flex items-center gap-2 px-4 py-2 text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <span className="text-purple-400 text-sm">
              {currentCard + 1} / {cards.length}
            </span>
            <button
              onClick={nextCard}
              disabled={currentCard === cards.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0618] to-transparent pt-12 pb-6 px-4">
        <div className="max-w-md mx-auto text-center">
          <p className="text-purple-300 text-sm mb-3">
            Does your dog have a Soul Profile yet?
          </p>
          <Link
            to="/wrapped-welcome"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-[#120826] font-semibold rounded-full transition"
          >
            🐾 Create theirs now
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default PetWrappedViewer;
