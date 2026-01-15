import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  ChevronRight,
  Send
} from 'lucide-react';

const ChatsTab = ({ 
  chatbaseChats,
  chats,
  expandedChat,
  setExpandedChat,
  filterCity,
  setFilterCity,
  filterStatus,
  setFilterStatus,
  syncChatbase,
  syncingChatbase,
  fetchChats,
  setSelectedChat,
  sendNotification
}) => {
  return (
    <div className="space-y-6" data-testid="chats-tab">
      {/* Chatbase Section */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-purple-900">Mira AI (Chatbase)</h3>
            <p className="text-sm text-purple-600">{chatbaseChats.length} conversations synced</p>
          </div>
          <Button 
            onClick={syncChatbase} 
            disabled={syncingChatbase}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="sync-chatbase-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncingChatbase ? 'animate-spin' : ''}`} />
            {syncingChatbase ? 'Syncing...' : 'Sync from Chatbase'}
          </Button>
        </div>
      </Card>

      {/* Chatbase Conversations */}
      {chatbaseChats.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Chatbase Conversations</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {chatbaseChats.map((chat, idx) => (
              <Card 
                key={idx} 
                className="p-4 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setExpandedChat(expandedChat === idx ? null : idx)}
                data-testid={`chatbase-chat-${idx}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {chat.customer_name || 'Guest User'}
                    </h4>
                    <div className="flex flex-col gap-1 mt-1">
                      {chat.customer_phone && (
                        <a href={`https://wa.me/91${chat.customer_phone}`} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-green-600 hover:underline flex items-center gap-1"
                           onClick={(e) => e.stopPropagation()}>
                          <Phone className="w-3 h-3" /> +91 {chat.customer_phone}
                        </a>
                      )}
                      {chat.customer_email && (
                        <a href={`mailto:${chat.customer_email}`} 
                           className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                           onClick={(e) => e.stopPropagation()}>
                          <Mail className="w-3 h-3" /> {chat.customer_email}
                        </a>
                      )}
                      {chat.customer_location && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {chat.customer_location}
                        </span>
                      )}
                      {!chat.customer_phone && !chat.customer_email && (
                        <span className="text-sm text-gray-400">No contact info captured</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-700">Chatbase</Badge>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedChat === idx ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {chat.message_count || chat.messages?.length || 0} messages
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {chat.created_at ? new Date(chat.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                {/* Preview or Full Conversation */}
                {expandedChat === idx ? (
                  <div className="bg-gray-50 rounded p-3 max-h-96 overflow-y-auto space-y-3">
                    <p className="text-xs text-gray-500 font-medium mb-2">Full Conversation:</p>
                    {chat.messages && chat.messages.map((msg, msgIdx) => {
                      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                      return (
                        <div 
                          key={msgIdx} 
                          className={`p-2 rounded-lg text-sm ${
                            msg.role === 'user' 
                              ? 'bg-purple-100 text-purple-900 ml-4' 
                              : 'bg-white border text-gray-700 mr-4'
                          }`}
                        >
                          <span className="text-xs font-medium text-gray-500 block mb-1">
                            {msg.role === 'user' ? '👤 Customer' : '🤖 Mira'}
                          </span>
                          {content}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded p-2 text-sm text-gray-600 line-clamp-3">
                    {chat.message_preview || (chat.messages && chat.messages.length > 0 
                      ? chat.messages.find(m => m.role === 'user')?.content || 'No user messages'
                      : 'No messages')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Legacy Mira Chats Filter */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-3">Legacy Mira Chats</h3>
        <div className="flex gap-4 flex-wrap">
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            data-testid="city-filter"
          >
            <option value="">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Gurgaon">Gurgaon</option>
            <option value="Delhi">Delhi</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            data-testid="status-filter"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <Button variant="outline" onClick={fetchChats} data-testid="refresh-chats-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Legacy Chats Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {chats.map((chat, idx) => (
          <Card 
            key={idx} 
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedChat(chat)}
            data-testid={`legacy-chat-${idx}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{chat.pet_name || 'Unknown Pet'}</h4>
                <p className="text-sm text-gray-500">{chat.pet_breed || 'Unknown'} • {chat.pet_age || 'Age unknown'}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(chat.updated_at || chat.created_at).toLocaleString()}</p>
              </div>
              <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>{chat.status}</Badge>
            </div>
            <div className="flex gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{chat.city || 'N/A'}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{chat.messages?.length || 0} msgs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{chat.service_type || 'General'}</span>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); sendNotification(chat.session_id); }}>
                <Send className="w-3 h-3 mr-1" />Notify
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChatsTab;
