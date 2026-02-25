/**
 * LearnPanel.jsx
 * ==============
 * LEARN = Knowledge Layer - "Confusion → Clarity → Action in 2 minutes"
 * 
 * A curated library of tiny guides + wrapped YouTube videos.
 * Every item ends in: Do it myself | Let Mira do it | Ask Mira
 * 
 * Features:
 * - Search bar with typeahead
 * - Topic chips (horizontal scroll)
 * - 3 content shelves: Start Here, 2-min Guides, Watch & Learn
 * - Mobile: List → Detail flow
 * - Desktop: 3-pane layout (future)
 * 
 * Per LEARN Bible spec - "Not a feed. A library with intent."
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Search, Bookmark, BookOpen, Play, Clock, ChevronRight, 
  Scissors, Heart, UtensilsCrossed, Brain, Plane, Home,
  Baby, Timer, Sun, X, ArrowLeft, AlertTriangle
} from 'lucide-react';
import LearnReader from './LearnReader';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Topic icon mapping
const TOPIC_ICONS = {
  grooming: Scissors,
  health: Heart,
  food: UtensilsCrossed,
  behaviour: Brain,
  travel: Plane,
  boarding: Home,
  puppies: Baby,
  senior: Timer,
  seasonal: Sun,
};

// Topic color mapping
const TOPIC_COLORS = {
  grooming: 'purple',
  health: 'rose',
  food: 'amber',
  behaviour: 'blue',
  travel: 'cyan',
  boarding: 'emerald',
  puppies: 'pink',
  senior: 'slate',
  seasonal: 'orange',
};

const getTopicColor = (color) => {
  const colors = {
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
    slate: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    gray: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  };
  return colors[color] || colors.gray;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ContentCard = memo(({ item, onClick, onSave }) => {
  const isVideo = item.item_type === 'video';
  const TopicIcon = TOPIC_ICONS[item.topic] || BookOpen;
  const colorClass = getTopicColor(item.topic_color || TOPIC_COLORS[item.topic]);
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[LEARN CARD] Clicked:', item.title);
    onClick(item);
  };
  
  return (
    <button
      className="learn-content-card"
      onClick={handleClick}
      data-testid={`learn-card-${item.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        background: item.is_personalized ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.08)',
        border: item.is_personalized ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        marginBottom: '8px',
        position: 'relative'
      }}
    >
      {/* Personalization badge */}
      {item.relevance_badge && (
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '12px',
          background: item.from_recent_chat 
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'  // Warm amber for "Timely"
            : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',  // Purple for pet personalization
          color: 'white',
          fontSize: '10px',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '8px',
          boxShadow: item.from_recent_chat 
            ? '0 2px 8px rgba(245, 158, 11, 0.4)'
            : '0 2px 8px rgba(168, 85, 247, 0.4)'
        }}>
          {item.relevance_badge}
        </span>
      )}
      
      {/* Card Content */}
      <div className="learn-card-content">
        {/* Icon & Type Badge */}
        <div className="learn-card-header">
          <div className={`learn-card-icon ${colorClass.bg} ${colorClass.text}`}>
            {isVideo ? <Play size={16} /> : <TopicIcon size={16} />}
          </div>
          <span className={`learn-card-badge ${colorClass.bg} ${colorClass.text}`}>
            {item.time_display}
          </span>
          {item.is_personalized && !item.relevance_badge && (
            <span style={{
              background: item.from_recent_chat 
                ? 'rgba(245, 158, 11, 0.2)'  // Amber for timely
                : 'rgba(168, 85, 247, 0.2)',
              color: item.from_recent_chat ? '#f59e0b' : '#a855f7',
              fontSize: '10px',
              fontWeight: 500,
              padding: '2px 6px',
              borderRadius: '4px',
              marginLeft: '4px'
            }}>
              {item.from_recent_chat ? 'Timely' : 'For you'}
            </span>
          )}
        </div>
        
        {/* Title */}
        <h4 className="learn-card-title">{item.title}</h4>
        
        {/* Summary/Payoff */}
        <p className="learn-card-summary">
          {item.summary || item.bullets_before?.[0] || 'Tap to learn more'}
        </p>
        
        {/* Footer */}
        <div className="learn-card-footer">
          <span className={`learn-card-topic ${colorClass.text}`}>
            {item.topic_label}
          </span>
          {item.is_saved && (
            <Bookmark size={14} className="text-purple-400 fill-purple-400" />
          )}
          {item.risk_level === 'high' && (
            <AlertTriangle size={14} className="text-amber-400" />
          )}
        </div>
      </div>
      
      {/* Chevron */}
      <ChevronRight size={18} className="learn-card-chevron" />
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TOPIC CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TopicChip = memo(({ topic, isActive, onClick }) => {
  const TopicIcon = TOPIC_ICONS[topic.id] || BookOpen;
  const colorClass = getTopicColor(topic.color);
  
  return (
    <button
      className={`learn-topic-chip ${isActive ? 'active' : ''}`}
      onClick={() => onClick(topic)}
      data-testid={`learn-topic-${topic.id}`}
    >
      <TopicIcon size={16} className={isActive ? 'text-white' : colorClass.text} />
      <span>{topic.label}</span>
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHELF COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ContentShelf = memo(({ title, items, icon: Icon, onItemClick, emptyMessage }) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="learn-shelf" data-testid={`learn-shelf-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="learn-shelf-header">
        {Icon && <Icon size={18} className="text-purple-400" />}
        <h3>{title}</h3>
        <span className="learn-shelf-count">{items.length}</span>
      </div>
      <div className="learn-shelf-content">
        {items.map((item) => (
          <ContentCard 
            key={item.id} 
            item={item} 
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const SearchBar = memo(({ value, onChange, onClear, onSearch, placeholder }) => {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (localValue.trim().length >= 2) {
      onSearch(localValue.trim());
    }
  };
  
  return (
    <form className="learn-search-bar" onSubmit={handleSubmit}>
      <Search size={18} className="learn-search-icon" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder || "What do you want help with?"}
        className="learn-search-input"
        data-testid="learn-search-input"
      />
      {localValue && (
        <button 
          type="button" 
          className="learn-search-clear"
          onClick={() => {
            setLocalValue('');
            onClear();
          }}
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LEARN PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const LearnPanel = ({ 
  isOpen, 
  onClose, 
  pet,
  token,
  conversationContext,  // Context from chat (e.g., { topic: "birthday", pillar: "celebrate" })
  conversationPicks,    // Learn picks from chat response
  onOpenServices,
  onOpenConcierge 
}) => {
  // State
  const [view, setView] = useState('home'); // 'home' | 'topic' | 'search' | 'saved' | 'detail' | 'conversation'
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [homeData, setHomeData] = useState({ start_here: [], for_your_pet: [], from_your_chat: [], topics: [] });
  const [topicData, setTopicData] = useState({ shelves: {}, topic: {} });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [savedItems, setSavedItems] = useState({ guides: [], videos: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get pet ID for personalization
  const petId = pet?.id && pet.id !== 'demo-pet' ? pet.id : null;
  const petName = pet?.name || 'your pet';
  
  // Check if we have conversation-specific content
  const hasConversationContent = conversationPicks?.length > 0 || conversationContext?.topic;
  
  // Fetch home data on mount or when pet changes
  useEffect(() => {
    if (isOpen) {
      // If we have conversation picks, show them first
      if (hasConversationContent) {
        setView('conversation');
      } else {
        fetchHomeData();
      }
    }
  }, [isOpen, petId, hasConversationContent]);
  
  const fetchHomeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Pass pet_id for personalization
      const url = petId 
        ? `${API_BASE}/api/os/learn/home?pet_id=${encodeURIComponent(petId)}`
        : `${API_BASE}/api/os/learn/home`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (data.success) {
        setHomeData(data);
        setTopics(data.topics || []);
        console.log('[LEARN] Home loaded, personalization:', data.personalization);
        if (data.conversation_context?.enabled) {
          console.log('[LEARN] Conversation context active, recent topics:', data.conversation_context.recent_topics);
        }
      }
    } catch (err) {
      console.error('[LEARN] Error fetching home:', err);
      setError('Could not load Learn. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTopicContent = async (topicId) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Pass pet_id for personalization
      const url = petId
        ? `${API_BASE}/api/os/learn/topic/${topicId}?pet_id=${encodeURIComponent(petId)}`
        : `${API_BASE}/api/os/learn/topic/${topicId}`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (data.success) {
        setTopicData(data);
        setActiveTopic(data.topic);
        setView('topic');
      }
    } catch (err) {
      console.error('[LEARN] Error fetching topic:', err);
      setError('Could not load topic. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSearchResults = async (query) => {
    if (query.length < 2) return;
    setIsLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE}/api/os/learn/search?q=${encodeURIComponent(query)}`, { headers });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results || []);
        setView('search');
      }
    } catch (err) {
      console.error('[LEARN] Error searching:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSavedItems = async () => {
    setIsLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE}/api/os/learn/saved`, { headers });
      const data = await response.json();
      if (data.success) {
        setSavedItems(data.saved || { guides: [], videos: [] });
        setView('saved');
      }
    } catch (err) {
      console.error('[LEARN] Error fetching saved:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchItemDetail = async (item) => {
    setIsLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE}/api/os/learn/item/${item.item_type}/${item.id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setSelectedItem(data.item);
        setView('detail');
      }
    } catch (err) {
      console.error('[LEARN] Error fetching item:', err);
      // Fallback to passed item
      setSelectedItem(item);
      setView('detail');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveItem = async (item, action = 'save') => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/os/learn/saved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item_id: item.id,
          item_type: item.item_type,
          action
        })
      });
      const data = await response.json();
      if (data.success) {
        // Update local state
        if (selectedItem && selectedItem.id === item.id) {
          setSelectedItem({ ...selectedItem, is_saved: action === 'save' });
        }
        // Refresh home data to update save counts
        fetchHomeData();
        
        // Record learn event for TODAY nudge system
        if (action === 'save') {
          try {
            await fetch(
              `${API_BASE}/api/os/learn/event?item_id=${item.id}&item_type=${item.item_type || 'guide'}&event_type=saved&pet_id=${petId || ''}`,
              { 
                method: 'POST', 
                headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}` 
                }
              }
            );
            console.log(`[LEARN] Recorded saved event for ${item.id}`);
          } catch (evtErr) {
            console.log('[LEARN] Could not record saved event:', evtErr.message);
          }
        }
      }
    } catch (err) {
      console.error('[LEARN] Error saving item:', err);
    }
  };
  
  const handleBack = () => {
    if (view === 'detail') {
      // Go back to previous view
      if (activeTopic) {
        setView('topic');
      } else if (searchQuery) {
        setView('search');
      } else {
        setView('home');
      }
      setSelectedItem(null);
    } else if (view === 'topic' || view === 'search' || view === 'saved') {
      setView('home');
      setActiveTopic(null);
      setSearchQuery('');
    }
  };
  
  const handleTopicClick = (topic) => {
    fetchTopicContent(topic.id);
  };
  
  const handleItemClick = (item) => {
    fetchItemDetail(item);
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchSearchResults(query);
  };
  
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('body-scroll-lock');
    } else {
      document.body.classList.remove('body-scroll-lock');
    }
    return () => document.body.classList.remove('body-scroll-lock');
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Render detail view
  if (view === 'detail' && selectedItem) {
    return (
      <LearnReader
        item={selectedItem}
        onBack={handleBack}
        onSave={() => handleSaveItem(selectedItem, selectedItem.is_saved ? 'unsave' : 'save')}
        onOpenServices={onOpenServices}
        onOpenConcierge={onOpenConcierge}
        pet={pet}
        token={token}
      />
    );
  }
  
  return (
    <div className="learn-panel" data-testid="learn-panel" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      background: 'linear-gradient(180deg, #1a1625 0%, #0f0d15 50%, #0a0810 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="learn-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        minHeight: '56px'
      }}>
        {view !== 'home' ? (
          <button className="learn-back-btn" onClick={handleBack} data-testid="learn-back-btn" style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer'
          }}>
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#a78bfa" />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>Learn</h2>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={fetchSavedItems}
            data-testid="learn-saved-btn"
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <Bookmark size={18} />
            {homeData.saved_count > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px',
                background: '#8b5cf6',
                borderRadius: '9px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>{homeData.saved_count}</span>
            )}
          </button>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            data-testid="learn-close-btn"
            aria-label="Close Learn"
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="learn-search-container">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => {
            setSearchQuery('');
            setView('home');
          }}
          onSearch={handleSearch}
        />
      </div>
      
      {/* Topic Chips */}
      {view === 'home' && (
        <div className="learn-topics-scroll">
          {topics.map((topic) => (
            <TopicChip
              key={topic.id}
              topic={topic}
              isActive={activeTopic?.id === topic.id}
              onClick={handleTopicClick}
            />
          ))}
        </div>
      )}
      
      {/* Content Area */}
      <div className="learn-content-area" style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '0 16px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        {isLoading ? (
          <div className="learn-loading">
            <div className="learn-loading-spinner" />
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="learn-error">
            <p>{error}</p>
            <button onClick={fetchHomeData}>Retry</button>
          </div>
        ) : view === 'home' ? (
          // Home View
          <>
            {/* Timely for Pet - Contextual shelf (Mira knows what's relevant right now) */}
            {homeData.from_your_chat?.length > 0 && (
              <ContentShelf
                title={`${homeData.pet_name || petName} might need this`}
                items={homeData.from_your_chat}
                icon={Heart}
                onItemClick={handleItemClick}
              />
            )}
            
            {/* For Your Pet - Personalized shelf (Pet First doctrine) */}
            {homeData.for_your_pet?.length > 0 && (
              <ContentShelf
                title={`For ${homeData.pet_name || petName}`}
                items={homeData.for_your_pet}
                icon={Heart}
                onItemClick={handleItemClick}
              />
            )}
            
            {/* Start Here - Featured content */}
            {homeData.start_here?.length > 0 && (
              <ContentShelf
                title="Start Here"
                items={homeData.start_here}
                icon={BookOpen}
                onItemClick={handleItemClick}
              />
            )}
            
            {/* Topic Quick Access */}
            <div className="learn-topics-grid">
              {topics.map((topic) => {
                const TopicIcon = TOPIC_ICONS[topic.id] || BookOpen;
                const colorClass = getTopicColor(topic.color);
                return (
                  <button
                    key={topic.id}
                    className={`learn-topic-card ${colorClass.bg} ${colorClass.border}`}
                    onClick={() => handleTopicClick(topic)}
                    data-testid={`learn-topic-card-${topic.id}`}
                  >
                    <TopicIcon size={24} className={colorClass.text} />
                    <span className="learn-topic-card-label">{topic.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : view === 'topic' ? (
          // Topic View - 3 Shelves
          <>
            <div className="learn-topic-header">
              <h3>{activeTopic?.label || 'Topic'}</h3>
              <p>{activeTopic?.description}</p>
            </div>
            
            {/* For Your Pet - Personalized shelf for this topic */}
            {topicData.shelves?.for_your_pet?.length > 0 && (
              <ContentShelf
                title={`For ${topicData.pet_name || petName}`}
                items={topicData.shelves.for_your_pet}
                icon={Heart}
                onItemClick={handleItemClick}
              />
            )}
            
            <ContentShelf
              title="Start Here"
              items={topicData.shelves?.start_here || []}
              icon={BookOpen}
              onItemClick={handleItemClick}
            />
            
            <ContentShelf
              title="2-Minute Guides"
              items={topicData.shelves?.guides || []}
              icon={Clock}
              onItemClick={handleItemClick}
            />
            
            <ContentShelf
              title="Watch & Learn"
              items={topicData.shelves?.videos || []}
              icon={Play}
              onItemClick={handleItemClick}
            />
          </>
        ) : view === 'search' ? (
          // Search Results
          <>
            <div className="learn-search-header">
              <p>Results for "{searchQuery}"</p>
              <span>{searchResults.length} items</span>
            </div>
            {searchResults.length > 0 ? (
              <div className="learn-search-results">
                {searchResults.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            ) : (
              <div className="learn-empty">
                <p>No results found for "{searchQuery}"</p>
                <button onClick={() => { setSearchQuery(''); setView('home'); }}>
                  Browse topics
                </button>
              </div>
            )}
          </>
        ) : view === 'saved' ? (
          // Saved Items
          <>
            <div className="learn-saved-header">
              <h3>Saved</h3>
            </div>
            
            {savedItems.guides?.length > 0 && (
              <ContentShelf
                title="Saved Guides"
                items={savedItems.guides.map(s => ({ ...s, item_type: 'guide' }))}
                icon={BookOpen}
                onItemClick={handleItemClick}
              />
            )}
            
            {savedItems.videos?.length > 0 && (
              <ContentShelf
                title="Saved Videos"
                items={savedItems.videos.map(s => ({ ...s, item_type: 'video' }))}
                icon={Play}
                onItemClick={handleItemClick}
              />
            )}
            
            {savedItems.guides?.length === 0 && savedItems.videos?.length === 0 && (
              <div className="learn-empty">
                <Bookmark size={32} className="text-gray-500" />
                <p>No saved items yet</p>
                <button onClick={() => setView('home')}>
                  Browse Learn
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default LearnPanel;
