/**
 * MiraConversationHistory Component
 * Shows member's past conversations with Mira AI
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MessageCircle, Clock, ChevronRight, Sparkles, 
  Search, Calendar, ExternalLink, Bot
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { API_URL } from '../utils/api';

const PILLAR_ICONS = {
  advisory: '📋',
  celebrate: '🎂',
  feed: '🍖',
  dine: '🍽️',
  stay: '🏨',
  travel: '✈️',
  care: '🩺',
  groom: '✂️',
  play: '🎾',
  train: '🎓',
  shop: '🛒',
  general: '💬'
};

const MiraConversationHistory = ({ token, limit = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [fullConversation, setFullConversation] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);
  
  useEffect(() => {
    fetchHistory();
  }, [token]);
  
  const fetchHistory = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/mira/history?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch Mira history:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadFullConversation = async (sessionId) => {
    setLoadingFull(true);
    try {
      const response = await fetch(`${API_URL}/api/mira/session/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFullConversation(data);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoadingFull(false);
    }
  };
  
  const handleViewConversation = (convo) => {
    setSelectedConvo(convo);
    loadFullConversation(convo.session_id);
  };
  
  const startNewChat = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };
  
  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden" data-testid="mira-history">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Mira AI Conversations</h3>
              <p className="text-xs text-white/70">{conversations.length} past conversations</p>
            </div>
          </div>
          <Button 
            onClick={startNewChat}
            className="bg-white text-purple-600 hover:bg-white/90 text-sm"
            size="sm"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            New Chat
          </Button>
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="divide-y max-h-96 overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map((convo) => (
            <div 
              key={convo.session_id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleViewConversation(convo)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {PILLAR_ICONS[convo.pillar] || '💬'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">
                      {convo.preview || 'Conversation with Mira'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(convo.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {convo.message_count} messages
                    </span>
                    {convo.pillar && (
                      <Badge variant="outline" className="text-xs py-0">
                        {convo.pillar}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No conversations yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Ask Mira anything about your pet&apos;s care, food recommendations, or get help planning celebrations!
            </p>
            <Button onClick={startNewChat} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Your First Chat
            </Button>
          </div>
        )}
      </div>
      
      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConvo} onOpenChange={() => setSelectedConvo(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{PILLAR_ICONS[selectedConvo?.pillar] || '💬'}</span>
              Conversation with Mira
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {loadingFull ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : fullConversation?.messages?.length > 0 ? (
              fullConversation.messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.sender === 'member' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender === 'member' 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.sender !== 'member' && (
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="text-xs font-medium text-purple-600">Mira</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${
                      msg.sender === 'member' ? 'text-white/60' : 'text-gray-400'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No messages found</p>
            )}
          </div>
          
          <div className="border-t pt-4">
            <Button 
              onClick={() => {
                setSelectedConvo(null);
                startNewChat();
              }}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Continue with New Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MiraConversationHistory;
