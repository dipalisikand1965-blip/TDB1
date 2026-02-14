/**
 * TraitGraphVisualization.jsx
 * 
 * Visualizes how Mira "learns" about a pet through the Trait Graph.
 * Per MOJO Bible Part 1 §13 - The intelligence layer powering everything.
 * 
 * Shows:
 * - Total traits tracked
 * - Traits by source (soul form, chat, services, purchases, observations)
 * - Confidence levels
 * - Evidence counts
 * - Visual graph of trait learning over time
 */

import React, { useState, useEffect, memo } from 'react';
import { 
  Brain, Sparkles, MessageSquare, ShoppingBag, Clipboard, 
  User, TrendingUp, BarChart2, Eye, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

// Source configuration with icons and colors
const SOURCE_CONFIG = {
  'direct': { 
    label: 'Direct Input', 
    icon: User, 
    color: 'purple',
    description: 'Set by you in MOJO editor'
  },
  'soul_form': { 
    label: 'Soul Form', 
    icon: Sparkles, 
    color: 'pink',
    description: 'From personality questionnaire'
  },
  'mira_chat': { 
    label: 'Conversations', 
    icon: MessageSquare, 
    color: 'blue',
    description: 'Learned from chat with Mira'
  },
  'mira': { 
    label: 'Mira Chat', 
    icon: MessageSquare, 
    color: 'blue',
    description: 'Learned from conversations'
  },
  'service_outcome': { 
    label: 'Services', 
    icon: Clipboard, 
    color: 'green',
    description: 'From grooming, vet visits, training'
  },
  'purchase_history': { 
    label: 'Purchases', 
    icon: ShoppingBag, 
    color: 'orange',
    description: 'From products you bought'
  },
  'behaviour_observation': { 
    label: 'Observations', 
    icon: Eye, 
    color: 'teal',
    description: 'From service provider feedback'
  },
};

// Color styles for each source
const COLOR_STYLES = {
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  teal: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

// Confidence meter component
const ConfidenceMeter = memo(({ value, label }) => (
  <div className="trait-graph-confidence-meter">
    <div className="meter-label">
      <span>{label}</span>
      <span className="meter-value">{value}%</span>
    </div>
    <div className="meter-bar">
      <div 
        className="meter-fill"
        style={{ 
          width: `${value}%`,
          backgroundColor: value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'
        }}
      />
    </div>
  </div>
));

// Source breakdown bar
const SourceBar = memo(({ source, count, total, onClick, isExpanded }) => {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG['direct'];
  const Icon = config.icon;
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <button 
      className={`trait-source-bar ${COLOR_STYLES[config.color]} ${isExpanded ? 'expanded' : ''}`}
      onClick={onClick}
      data-testid={`source-bar-${source}`}
    >
      <div className="source-bar-header">
        <div className="source-info">
          <Icon className="w-4 h-4" />
          <span className="source-label">{config.label}</span>
        </div>
        <div className="source-stats">
          <span className="source-count">{count}</span>
          <span className="source-percent">{percentage}%</span>
        </div>
      </div>
      <div className="source-bar-progress">
        <div 
          className="source-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isExpanded && (
        <div className="source-description">
          <p>{config.description}</p>
        </div>
      )}
    </button>
  );
});

// Main visualization component
const TraitGraphVisualization = memo(({ petId, petName, apiUrl, token, isOpen = true }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSource, setExpandedSource] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch trait graph stats
  const fetchStats = async () => {
    const baseUrl = apiUrl || process.env.REACT_APP_BACKEND_URL || '';
    
    if (!petId || !baseUrl) {
      console.log('[TRAIT-GRAPH-VIZ] Missing petId or apiUrl:', { petId, apiUrl: baseUrl });
      return;
    }
    
    console.log('[TRAIT-GRAPH-VIZ] Fetching stats for pet:', petId);
    setLoading(true);
    setError(null);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(
        `${baseUrl}/api/pet-soul/profile/${petId}/trait-graph`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch trait graph');
      }
      
      const data = await response.json();
      console.log('[TRAIT-GRAPH-VIZ] Received stats:', data);
      setStats(data);
    } catch (err) {
      console.error('[TRAIT-GRAPH-VIZ] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const baseUrl = apiUrl || process.env.REACT_APP_BACKEND_URL || '';
    console.log('[TRAIT-GRAPH-VIZ] useEffect triggered:', { isOpen, petId, hasApiUrl: !!baseUrl });
    if (isOpen && petId) {
      fetchStats();
    }
  }, [isOpen, petId, apiUrl]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="trait-graph-loading" data-testid="trait-graph-loading">
        <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
        <span>Loading intelligence data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trait-graph-error" data-testid="trait-graph-error">
        <p className="text-red-400">Could not load trait data</p>
        <button onClick={fetchStats} className="retry-btn">
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="trait-graph-empty" data-testid="trait-graph-empty">
        <Brain className="w-8 h-8 text-gray-500 mb-2" />
        <p>No trait data available yet</p>
        <p className="text-xs text-gray-500">Start chatting with Mira to build intelligence</p>
      </div>
    );
  }

  const { total_traits, by_source, avg_confidence, total_evidence, high_confidence_traits } = stats;

  return (
    <div className="trait-graph-visualization" data-testid="trait-graph-visualization">
      {/* Header with title */}
      <div className="trait-graph-header">
        <div className="trait-graph-title">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3>How Mira Knows {petName || 'Your Pet'}</h3>
        </div>
        <button 
          className="trait-graph-toggle"
          onClick={() => setShowDetails(!showDetails)}
          data-testid="trait-graph-toggle"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="trait-graph-summary">
        <div className="stat-card" data-testid="stat-total-traits">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <div className="stat-content">
            <span className="stat-value">{total_traits}</span>
            <span className="stat-label">Traits Tracked</span>
          </div>
        </div>
        
        <div className="stat-card" data-testid="stat-evidence">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <div className="stat-content">
            <span className="stat-value">{total_evidence}</span>
            <span className="stat-label">Evidence Points</span>
          </div>
        </div>
        
        <div className="stat-card" data-testid="stat-high-confidence">
          <Sparkles className="w-5 h-5 text-green-400" />
          <div className="stat-content">
            <span className="stat-value">{high_confidence_traits}</span>
            <span className="stat-label">High Confidence</span>
          </div>
        </div>
      </div>

      {/* Average Confidence Meter */}
      <ConfidenceMeter 
        value={avg_confidence || 0} 
        label="Average Confidence" 
      />

      {/* Sources Breakdown */}
      {showDetails && by_source && Object.keys(by_source).length > 0 && (
        <div className="trait-sources-section">
          <h4 className="sources-title">Intelligence Sources</h4>
          <div className="trait-sources-list">
            {Object.entries(by_source)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <SourceBar
                  key={source}
                  source={source}
                  count={count}
                  total={total_traits}
                  isExpanded={expandedSource === source}
                  onClick={() => setExpandedSource(
                    expandedSource === source ? null : source
                  )}
                />
              ))}
          </div>
        </div>
      )}

      {/* Learning Indicator */}
      <div className="trait-learning-indicator">
        <div className="learning-pulse"></div>
        <span>Mira learns with every interaction</span>
      </div>

      {/* Styles */}
      <style jsx>{`
        .trait-graph-visualization {
          background: rgba(30, 20, 50, 0.5);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .trait-graph-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .trait-graph-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .trait-graph-title h3 {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .trait-graph-toggle {
          background: rgba(139, 92, 246, 0.2);
          border: none;
          border-radius: 8px;
          padding: 6px;
          color: #a78bfa;
          cursor: pointer;
          transition: background 0.2s;
        }

        .trait-graph-toggle:hover {
          background: rgba(139, 92, 246, 0.3);
        }

        .trait-graph-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: rgba(15, 10, 30, 0.6);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .stat-label {
          font-size: 10px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .trait-graph-confidence-meter {
          margin-bottom: 16px;
        }

        .meter-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 12px;
        }

        .meter-label span:first-child {
          color: #9ca3af;
        }

        .meter-value {
          color: white;
          font-weight: 600;
        }

        .meter-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .meter-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease-out;
        }

        .trait-sources-section {
          margin-top: 16px;
        }

        .sources-title {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .trait-sources-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .trait-source-bar {
          width: 100%;
          border: 1px solid;
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .trait-source-bar:hover {
          transform: translateY(-1px);
        }

        .trait-source-bar.expanded {
          padding-bottom: 8px;
        }

        .source-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .source-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .source-label {
          font-size: 12px;
          font-weight: 500;
        }

        .source-stats {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .source-count {
          font-size: 14px;
          font-weight: 700;
          color: white;
        }

        .source-percent {
          font-size: 11px;
          opacity: 0.7;
        }

        .source-bar-progress {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .source-bar-fill {
          height: 100%;
          background: currentColor;
          opacity: 0.6;
          border-radius: 2px;
          transition: width 0.3s ease-out;
        }

        .source-description {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .source-description p {
          font-size: 11px;
          color: #9ca3af;
          margin: 0;
        }

        .trait-learning-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(139, 92, 246, 0.2);
        }

        .learning-pulse {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .trait-learning-indicator span {
          font-size: 11px;
          color: #9ca3af;
        }

        .trait-graph-loading,
        .trait-graph-error,
        .trait-graph-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          gap: 8px;
        }

        .trait-graph-loading span,
        .trait-graph-empty p {
          color: #9ca3af;
          font-size: 12px;
        }

        .retry-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(139, 92, 246, 0.2);
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          color: #a78bfa;
          cursor: pointer;
          font-size: 12px;
          margin-top: 8px;
        }

        .retry-btn:hover {
          background: rgba(139, 92, 246, 0.3);
        }

        /* Mobile adjustments */
        @media (max-width: 480px) {
          .trait-graph-summary {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .stat-card {
            padding: 8px;
          }

          .stat-value {
            font-size: 16px;
          }

          .stat-label {
            font-size: 8px;
          }
        }
      `}</style>
    </div>
  );
});

TraitGraphVisualization.displayName = 'TraitGraphVisualization';

export default TraitGraphVisualization;
