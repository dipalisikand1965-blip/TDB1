/**
 * ConflictResolutionCard.jsx
 * ==========================
 * MOJO Conflict Resolution UI
 * 
 * Shows when a health restriction conflicts with a preference on the same entity.
 * Example: "Lola is allergic to chicken" + "Lola loves chicken treats"
 * 
 * RULES:
 * - Health wins by default
 * - Preference is suppressed everywhere until user explicitly resolves
 * - User can override with clear confirmation
 * 
 * UX COPY (from design spec):
 * Title: "Conflict detected"
 * Body: "I have two different signals about {petName}. To keep {petName} safe, I need you to confirm what's true."
 * Safety note: "Until you confirm, I'll avoid {entity} to stay on the safe side."
 */

import React, { useState, useEffect, memo } from 'react';
import { AlertTriangle, Shield, Heart, Check, Loader2, HelpCircle } from 'lucide-react';

const ConflictResolutionCard = memo(({ 
  pet, 
  apiUrl, 
  token, 
  onConflictResolved 
}) => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingEntity, setProcessingEntity] = useState(null);
  const [resolved, setResolved] = useState({});
  
  const petName = pet?.name || 'your pet';
  const petId = pet?.id;
  
  // Fetch conflicts on mount
  useEffect(() => {
    const fetchConflicts = async () => {
      if (!petId || !apiUrl || !token) return;
      
      try {
        const response = await fetch(
          `${apiUrl}/api/os/concierge/conflicts/${petId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setConflicts(data.conflicts || []);
          console.log('[MOJO-CONFLICT] Fetched conflicts:', data.conflicts?.length || 0);
        }
      } catch (error) {
        console.error('[MOJO-CONFLICT] Failed to fetch conflicts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConflicts();
  }, [petId, apiUrl, token]);
  
  // Handle conflict resolution
  const handleResolve = async (entity, resolution) => {
    setProcessingEntity(entity);
    
    try {
      const response = await fetch(
        `${apiUrl}/api/os/concierge/conflicts/${petId}/resolve?entity=${encodeURIComponent(entity)}&resolution=${resolution}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('[MOJO-CONFLICT] Resolved:', result);
        
        // Mark as resolved in local state
        setResolved(prev => ({
          ...prev,
          [entity]: { resolution, message: result.message }
        }));
        
        // Notify parent to refresh pet data
        onConflictResolved?.(entity, resolution);
        
        // Remove from conflicts list after animation
        setTimeout(() => {
          setConflicts(prev => prev.filter(c => c.entity !== entity));
        }, 2000);
      }
    } catch (error) {
      console.error('[MOJO-CONFLICT] Failed to resolve:', error);
    } finally {
      setProcessingEntity(null);
    }
  };
  
  // Don't render if no conflicts
  if (loading) {
    return null;
  }
  
  if (conflicts.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="mojo-conflict-section"
      style={{ marginBottom: 20 }}
      data-testid="conflict-resolution-section"
    >
      {conflicts.map((conflict) => {
        const entity = conflict.entity;
        const isProcessing = processingEntity === entity;
        const isResolved = resolved[entity];
        
        // Get fact details
        const healthFact = conflict.health_fact;
        const prefFact = conflict.preference_fact;
        
        // Format content for display
        const healthContent = healthFact?.content || entity;
        const prefContent = prefFact?.content || entity;
        
        return (
          <div
            key={entity}
            data-testid={`conflict-card-${entity}`}
            style={{
              background: isResolved 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
                : 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
              border: isResolved 
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              transition: 'all 0.3s ease',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginBottom: 12 
            }}>
              {isResolved ? (
                <Check size={18} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={18} className="text-amber-400" />
              )}
              <span style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: isResolved ? 'rgb(52, 211, 153)' : 'rgb(251, 191, 36)'
              }}>
                {isResolved ? 'Resolved' : 'Conflict detected'}
              </span>
            </div>
            
            {/* Resolved Message */}
            {isResolved && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 8,
                marginBottom: 8
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: 13, 
                  color: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Shield size={14} className="text-emerald-400" />
                  {isResolved.message}
                </p>
                <button
                  onClick={() => setResolved(prev => {
                    const newState = {...prev};
                    delete newState[entity];
                    return newState;
                  })}
                  style={{
                    marginTop: 8,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Change decision
                </button>
              </div>
            )}
            
            {/* Conflict Body (only show if not resolved) */}
            {!isResolved && (
              <>
                {/* Body text */}
                <p style={{ 
                  margin: '0 0 12px', 
                  fontSize: 13, 
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.5
                }}>
                  I have two different signals about {petName}. To keep {petName} safe, I need you to confirm what's true.
                </p>
                
                {/* The two conflicting facts */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 8, 
                  marginBottom: 16,
                  padding: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 8
                }}>
                  {/* Health fact */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={16} className="text-red-400" style={{ flexShrink: 0 }} />
                    <span style={{ 
                      fontSize: 13, 
                      color: 'rgba(255,255,255,0.9)' 
                    }}>
                      {petName} is allergic to <strong>{entity}</strong>
                    </span>
                  </div>
                  
                  {/* Preference fact */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Heart size={16} className="text-pink-400" style={{ flexShrink: 0 }} />
                    <span style={{ 
                      fontSize: 13, 
                      color: 'rgba(255,255,255,0.9)' 
                    }}>
                      {petName} loves <strong>{prefContent}</strong>
                    </span>
                  </div>
                </div>
                
                {/* Question */}
                <p style={{ 
                  margin: '0 0 12px', 
                  fontSize: 13, 
                  color: 'rgba(255,255,255,0.7)',
                  fontStyle: 'italic'
                }}>
                  Which should I treat as true going forward?
                </p>
                
                {/* Resolution Buttons */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 8 
                }}>
                  {/* Health wins (recommended) */}
                  <button
                    onClick={() => handleResolve(entity, 'health_wins')}
                    disabled={isProcessing}
                    data-testid={`resolve-health-${entity}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 8,
                      border: 'none',
                      cursor: isProcessing ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isProcessing ? 0.7 : 1
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Shield size={16} />
                    )}
                    Allergic to {entity} (avoid)
                  </button>
                  
                  {/* Preference wins */}
                  <button
                    onClick={() => handleResolve(entity, 'preference_wins')}
                    disabled={isProcessing}
                    data-testid={`resolve-preference-${entity}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: 13,
                      fontWeight: 500,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: isProcessing ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Heart size={16} />
                    Loves {entity} (it's fine now)
                  </button>
                  
                  {/* Not sure */}
                  <button
                    onClick={() => handleResolve(entity, 'not_sure')}
                    disabled={isProcessing}
                    data-testid={`resolve-unsure-${entity}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 8,
                      border: 'none',
                      cursor: isProcessing ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <HelpCircle size={14} />
                    Not sure yet
                  </button>
                </div>
                
                {/* Safety note */}
                <p style={{ 
                  margin: '12px 0 0', 
                  fontSize: 11, 
                  color: 'rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Shield size={12} />
                  Until you confirm, I'll avoid {entity} to stay on the safe side.
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
});

ConflictResolutionCard.displayName = 'ConflictResolutionCard';

export default ConflictResolutionCard;
