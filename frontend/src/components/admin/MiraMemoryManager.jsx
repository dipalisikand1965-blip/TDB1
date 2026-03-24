import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, Calendar, Heart, ShoppingBag, MessageCircle, 
  Flag, EyeOff, Trash2, Search, Plus, RefreshCw,
  AlertCircle, Clock, User, PawPrint
} from 'lucide-react';
import { API_URL } from '../../utils/api';

const MEMORY_TYPES = {
  event: { name: 'Events & Milestones', icon: Calendar, color: 'blue' },
  health: { name: 'Health & Medical', icon: Heart, color: 'red' },
  shopping: { name: 'Shopping & Preferences', icon: ShoppingBag, color: 'green' },
  general: { name: 'Life Context', icon: MessageCircle, color: 'purple' }
};

const MiraMemoryManager = ({ authHeaders = {} }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [memberMemories, setMemberMemories] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemory, setNewMemory] = useState({
    content: '',
    memory_type: 'general',
    pet_name: ''
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mira/memory/stats`, { headers: authHeaders });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const searchMember = async () => {
    if (!searchEmail.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/mira/memory/admin/member/${encodeURIComponent(searchEmail)}?include_inactive=true`,
        { headers: authHeaders }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMemberMemories(data);
      } else {
        setMemberMemories({ error: 'Member not found or no memories' });
      }
    } catch (error) {
      console.error('Error searching member:', error);
      setMemberMemories({ error: 'Failed to load memories' });
    } finally {
      setLoading(false);
    }
  };

  const handleFlagCritical = async (memoryId) => {
    try {
      const response = await fetch(`${API_URL}/api/mira/memory/admin/${memoryId}/flag-critical`, {
        method: 'PUT',
        headers: authHeaders
      });
      
      if (response.ok) {
        searchMember(); // Refresh
      }
    } catch (error) {
      console.error('Error flagging memory:', error);
    }
  };

  const handleSuppress = async (memoryId, suppress = true) => {
    try {
      const endpoint = suppress ? 'suppress' : 'unsuppress';
      const response = await fetch(`${API_URL}/api/mira/memory/admin/${memoryId}/${endpoint}`, {
        method: 'PUT',
        headers: authHeaders
      });
      
      if (response.ok) {
        searchMember(); // Refresh
      }
    } catch (error) {
      console.error('Error suppressing memory:', error);
    }
  };

  const handleDelete = async (memoryId) => {
    if (!window.confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/mira/memory/admin/bulk`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memory_ids: [memoryId],
          action: 'delete'
        })
      });
      
      if (response.ok) {
        searchMember(); // Refresh
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemory.content.trim() || !searchEmail) return;
    
    try {
      const response = await fetch(`${API_URL}/api/mira/memory/admin/member/${encodeURIComponent(searchEmail)}`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setNewMemory({ content: '', memory_type: 'general', pet_name: '' });
        searchMember(); // Refresh
      }
    } catch (error) {
      console.error('Error adding memory:', error);
    }
  };

  const MemoryCard = ({ memory }) => {
    const TypeIcon = MEMORY_TYPES[memory.memory_type]?.icon || MessageCircle;
    const typeColor = MEMORY_TYPES[memory.memory_type]?.color || 'gray';
    
    return (
      <div 
        className={`p-4 rounded-lg border ${
          memory.is_critical ? 'border-red-500 bg-red-50' : 
          memory.suppress_auto_recall ? 'border-gray-300 bg-gray-50 opacity-60' :
          !memory.is_active ? 'border-gray-200 bg-gray-100 opacity-40' :
          'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-full bg-${typeColor}-100`}>
              <TypeIcon className={`w-4 h-4 text-${typeColor}-600`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{memory.content}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {memory.pet_name && (
                  <Badge variant="outline" className="text-xs">
                    <PawPrint className="w-3 h-3 mr-1" />
                    {memory.pet_name}
                  </Badge>
                )}
                {memory.is_critical && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    CRITICAL
                  </Badge>
                )}
                {memory.suppress_auto_recall && (
                  <Badge variant="secondary" className="text-xs">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Suppressed
                  </Badge>
                )}
                {!memory.is_active && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    Deleted
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs text-gray-500">
                  {memory.source}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(memory.created_at).toLocaleDateString()}
                </span>
                {memory.surface_count > 0 && (
                  <span>Surfaced {memory.surface_count}x</span>
                )}
                {memory.confidence && (
                  <span className="capitalize">{memory.confidence} confidence</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-1">
            {memory.is_active && !memory.is_critical && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleFlagCritical(memory.memory_id)}
                title="Flag as Critical"
              >
                <Flag className="w-4 h-4 text-red-500" />
              </Button>
            )}
            {memory.is_active && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleSuppress(memory.memory_id, !memory.suppress_auto_recall)}
                title={memory.suppress_auto_recall ? "Enable auto-recall" : "Suppress auto-recall"}
              >
                <EyeOff className={`w-4 h-4 ${memory.suppress_auto_recall ? 'text-gray-400' : 'text-gray-600'}`} />
              </Button>
            )}
            {memory.is_active && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleDelete(memory.memory_id)}
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-gray-500" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Mira's Relationship Memory
          </h2>
          <p className="text-gray-600 mt-1">
            "Store forever. Surface selectively." — Memory is available context, not forced recall.
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total_memories}</div>
              <div className="text-sm text-gray-600">Total Memories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.members_with_memories}</div>
              <div className="text-sm text-gray-600">Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.critical_memories}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-400">{stats.suppressed_memories}</div>
              <div className="text-sm text-gray-600">Suppressed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                {Object.entries(stats.by_type || {}).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-1">By Type</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Member Memories
          </CardTitle>
          <CardDescription>
            Enter a member's email to view their relationship memory profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter member email (e.g., dipali@clubconcierge.in)"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMember()}
              className="flex-1"
            />
            <Button onClick={searchMember} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Member Memories View */}
      {memberMemories && !memberMemories.error && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {memberMemories.member_id}
                </CardTitle>
                <CardDescription>
                  {memberMemories.total_memories} memories stored
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Memory
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="event">
              <TabsList className="grid grid-cols-4 mb-4">
                {Object.entries(MEMORY_TYPES).map(([type, info]) => {
                  const Icon = info.icon;
                  const count = memberMemories.by_type?.[type]?.count || 0;
                  return (
                    <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{info.name}</span>
                      <Badge variant="secondary" className="ml-1">{count}</Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {Object.entries(MEMORY_TYPES).map(([type, info]) => (
                <TabsContent key={type} value={type} className="space-y-3">
                  <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
                    <strong>{info.name}:</strong> {
                      type === 'event' ? 'Identity-level memories. Resurface when temporally relevant.' :
                      type === 'health' ? 'Longitudinal health history. Never auto-delete. Surface for care context.' :
                      type === 'shopping' ? 'Weighted by recency. Old preferences remain but with lower priority.' :
                      'Life context. Surface only when genuinely relevant.'
                    }
                  </div>
                  
                  {memberMemories.by_type?.[type]?.memories?.length > 0 ? (
                    memberMemories.by_type[type].memories.map((memory) => (
                      <MemoryCard key={memory.memory_id} memory={memory} />
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No {info.name.toLowerCase()} memories yet
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {memberMemories?.error && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {memberMemories.error}
          </CardContent>
        </Card>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Concierge Note</CardTitle>
              <CardDescription>
                Add a memory note for {searchEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Memory Type</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={newMemory.memory_type}
                  onChange={(e) => setNewMemory({...newMemory, memory_type: e.target.value})}
                >
                  {Object.entries(MEMORY_TYPES).map(([type, info]) => (
                    <option key={type} value={type}>{info.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Pet Name (optional)</label>
                <Input
                  placeholder="e.g., Luna, Mojo"
                  value={newMemory.pet_name}
                  onChange={(e) => setNewMemory({...newMemory, pet_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Memory Content</label>
                <textarea
                  className="w-full mt-1 p-2 border rounded-md min-h-[100px]"
                  placeholder="What should Mira remember about this family?"
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({...newMemory, content: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMemory}>
                  Add Memory
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MiraMemoryManager;
