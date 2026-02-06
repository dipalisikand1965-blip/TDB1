import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Calendar, Heart, ShoppingBag, MessageCircle, MapPin,
  Cake, Stethoscope, PawPrint, Star, Gift, Plane,
  ChevronDown, ChevronUp, Clock, Brain, Sparkles
} from 'lucide-react';
import { API_URL } from '../utils/api';

// Memory type icons and colors
const MEMORY_CONFIG = {
  event: { 
    icon: Calendar, 
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  health: { 
    icon: Heart, 
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700'
  },
  shopping: { 
    icon: ShoppingBag, 
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  },
  general: { 
    icon: MessageCircle, 
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700'
  }
};

// Timeline event icons based on content
const getEventIcon = (memory) => {
  const content = memory.content?.toLowerCase() || '';
  
  if (content.includes('birthday')) return Cake;
  if (content.includes('trip') || content.includes('travel') || content.includes('vacation')) return Plane;
  if (content.includes('vet') || content.includes('vaccine') || content.includes('health')) return Stethoscope;
  if (content.includes('adopted') || content.includes('gotcha')) return Gift;
  if (content.includes('moved') || content.includes('apartment') || content.includes('house')) return MapPin;
  
  return MEMORY_CONFIG[memory.memory_type]?.icon || MessageCircle;
};

/**
 * MemoryTimeline Component
 * Shows a family's journey with The Doggy Company over time
 * 
 * Props:
 * - memberId: string - The member's email or ID
 * - token: string - Auth token for API calls (optional, for member view)
 * - isAdmin: boolean - Whether this is admin view
 * - compact: boolean - Compact view mode
 * - maxItems: number - Maximum items to show
 */
const MemoryTimeline = ({ 
  memberId, 
  token = null, 
  isAdmin = false, 
  compact = false,
  maxItems = 10 
}) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [groupedByMonth, setGroupedByMonth] = useState({});

  useEffect(() => {
    if (memberId) {
      loadMemories();
    }
  }, [memberId]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin 
        ? `${API_URL}/api/mira/memory/admin/member/${encodeURIComponent(memberId)}`
        : `${API_URL}/api/mira/memory/me`;
      
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        
        // Flatten all memories into a single array
        const allMemories = [];
        Object.values(data.by_type || {}).forEach(typeData => {
          (typeData.memories || []).forEach(m => allMemories.push(m));
        });
        
        // Sort by created_at descending
        allMemories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setMemories(allMemories);
        
        // Group by month for timeline view
        const grouped = {};
        allMemories.forEach(memory => {
          const date = new Date(memory.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          
          if (!grouped[monthKey]) {
            grouped[monthKey] = { label: monthLabel, memories: [] };
          }
          grouped[monthKey].memories.push(memory);
        });
        
        setGroupedByMonth(grouped);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayMemories = expanded ? memories : memories.slice(0, maxItems);
  const sortedMonths = Object.keys(groupedByMonth).sort().reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-500">Loading memories...</span>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">No memories yet</p>
        <p className="text-sm mt-1">Mira will remember important moments from your conversations</p>
      </div>
    );
  }

  // Compact view - just a summary
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Brain className="w-4 h-4 text-purple-500" />
          <span className="font-medium">{memories.length} memories stored</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Object.entries(MEMORY_CONFIG).map(([type, config]) => {
            const count = memories.filter(m => m.memory_type === type).length;
            if (count === 0) return null;
            
            const Icon = config.icon;
            return (
              <Badge key={type} variant="outline" className={`${config.bgColor} ${config.borderColor}`}>
                <Icon className={`w-3 h-3 mr-1 ${config.textColor}`} />
                {count}
              </Badge>
            );
          })}
        </div>
        
        {/* Show latest 3 memories */}
        <div className="mt-3 space-y-2">
          {memories.slice(0, 3).map((memory) => {
            const config = MEMORY_CONFIG[memory.memory_type] || MEMORY_CONFIG.general;
            const Icon = config.icon;
            
            return (
              <div key={memory.memory_id} className={`p-2 rounded-lg ${config.bgColor} text-sm`}>
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 ${config.textColor}`} />
                  <div className="flex-1">
                    <p className="text-gray-700">{memory.content}</p>
                    {memory.pet_name && (
                      <span className="text-xs text-gray-500">
                        <PawPrint className="w-3 h-3 inline mr-1" />
                        {memory.pet_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full timeline view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-800">Memory Timeline</span>
          <Badge variant="secondary">{memories.length} memories</Badge>
        </div>
        
        <div className="flex gap-2">
          {Object.entries(MEMORY_CONFIG).map(([type, config]) => {
            const count = memories.filter(m => m.memory_type === type).length;
            if (count === 0) return null;
            
            const Icon = config.icon;
            return (
              <Badge key={type} variant="outline" className={`${config.bgColor} ${config.borderColor}`}>
                <Icon className={`w-3 h-3 mr-1 ${config.textColor}`} />
                {count}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-purple-200 to-transparent"></div>
        
        {sortedMonths.slice(0, expanded ? sortedMonths.length : 3).map((monthKey) => {
          const { label, memories: monthMemories } = groupedByMonth[monthKey];
          
          return (
            <div key={monthKey} className="mb-6">
              {/* Month header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center z-10">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium text-gray-700">{label}</span>
              </div>
              
              {/* Month's memories */}
              <div className="ml-12 space-y-3">
                {monthMemories.map((memory) => {
                  const config = MEMORY_CONFIG[memory.memory_type] || MEMORY_CONFIG.general;
                  const EventIcon = getEventIcon(memory);
                  
                  return (
                    <div 
                      key={memory.memory_id}
                      className={`relative p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                    >
                      {/* Connection to timeline */}
                      <div className="absolute -left-8 top-4 w-4 h-0.5 bg-purple-200"></div>
                      
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${config.bgColor} border ${config.borderColor}`}>
                          <EventIcon className={`w-4 h-4 ${config.textColor}`} />
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-gray-800">{memory.content}</p>
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {memory.pet_name && (
                              <span className="flex items-center gap-1">
                                <PawPrint className="w-3 h-3" />
                                {memory.pet_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(memory.created_at).toLocaleDateString()}
                            </span>
                            {memory.is_critical && (
                              <Badge variant="destructive" className="text-xs">Critical</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {sortedMonths.length > 3 && (
        <Button 
          variant="ghost" 
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
              Show {sortedMonths.length - 3} More Months
            </>
          )}
        </Button>
      )}
    </div>
  );
};

/**
 * MemorySummary Component
 * A compact summary of memories for embedding in other views
 */
export const MemorySummary = ({ memberId, token, isAdmin = false }) => {
  const [stats, setStats] = useState(null);
  const [recentMemories, setRecentMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberId) {
      loadData();
    }
  }, [memberId]);

  const loadData = async () => {
    try {
      const endpoint = isAdmin 
        ? `${API_URL}/api/mira/memory/admin/member/${encodeURIComponent(memberId)}`
        : `${API_URL}/api/mira/memory/me`;
      
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        
        // Calculate stats
        const byType = {};
        const allMemories = [];
        
        Object.entries(data.by_type || {}).forEach(([type, typeData]) => {
          byType[type] = typeData.count || 0;
          (typeData.memories || []).forEach(m => allMemories.push(m));
        });
        
        // Sort and get recent
        allMemories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setStats({
          total: data.total_memories || 0,
          byType
        });
        setRecentMemories(allMemories.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading memory summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-full"></div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Brain className="w-4 h-4" />
        <span>No memories yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium text-gray-700">{stats.total} Memories</span>
        <div className="flex gap-1">
          {Object.entries(stats.byType).map(([type, count]) => {
            if (count === 0) return null;
            const config = MEMORY_CONFIG[type];
            return (
              <Badge key={type} variant="outline" className="text-xs px-1.5 py-0">
                {config?.icon && <config.icon className="w-2.5 h-2.5 mr-0.5" />}
                {count}
              </Badge>
            );
          })}
        </div>
      </div>
      
      {recentMemories.length > 0 && (
        <div className="text-xs text-gray-500 pl-6">
          Latest: {recentMemories[0]?.content?.slice(0, 50)}...
        </div>
      )}
    </div>
  );
};

export default MemoryTimeline;
