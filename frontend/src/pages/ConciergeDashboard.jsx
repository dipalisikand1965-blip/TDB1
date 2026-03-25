/**
 * ConciergeDashboard.jsx
 * Admin view for managing Mira → Concierge® handoff tickets
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Inbox, Clock, CheckCircle, AlertTriangle, 
  MessageCircle, PawPrint, Calendar, User,
  ChevronRight, Filter, RefreshCw, Phone, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

const ConciergeDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState({ category: '', urgency: '', status: 'open' });
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.urgency) params.append('urgency', filter.urgency);
      
      const response = await fetch(`${API_URL}/api/mira/concierge/tasks/open?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        
        // Calculate stats
        const open = data.tasks.filter(t => t.status === 'open').length;
        const inProgress = data.tasks.filter(t => t.status === 'in_progress').length;
        setStats({ open, inProgress, resolved: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (ticketId, newStatus, resolution = null) => {
    try {
      const params = new URLSearchParams({ status: newStatus });
      if (resolution) params.append('resolution', resolution);
      
      const response = await fetch(`${API_URL}/api/mira/concierge/task/${ticketId}/status?${params}`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        fetchTasks();
        if (selectedTask?.ticket_id === ticketId) {
          setSelectedTask({ ...selectedTask, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'normal': return '#8b5cf6';
      case 'low': return '#6b7280';
      default: return '#8b5cf6';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'boarding': return '🏠';
      case 'grooming': return '✂️';
      case 'travel': return '✈️';
      case 'celebration': return '🎂';
      case 'health': return '🏥';
      default: return '💬';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now - date) / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 700, margin: 0 }}>
              Concierge® Dashboard
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0' }}>
              Manage Mira → Concierge® handoff tickets
            </p>
          </div>
          <button
            onClick={fetchTasks}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              padding: '10px 20px', borderRadius: '8px',
              color: 'white', cursor: 'pointer'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Inbox className="w-8 h-8" style={{ color: '#8b5cf6' }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Open</div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{stats.open}</div>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock className="w-8 h-8" style={{ color: '#f97316' }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>In Progress</div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{stats.inProgress}</div>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle className="w-8 h-8" style={{ color: '#ef4444' }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Urgent</div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>
                  {tasks.filter(t => t.urgency === 'urgent' || t.urgency === 'high').length}
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle className="w-8 h-8" style={{ color: '#22c55e' }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Resolved Today</div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{stats.resolved}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', padding: '10px 16px', color: 'white'
            }}
          >
            <option value="">All Categories</option>
            <option value="boarding">🏠 Boarding</option>
            <option value="grooming">✂️ Grooming</option>
            <option value="travel">✈️ Travel</option>
            <option value="celebration">🎂 Celebration</option>
            <option value="health">🏥 Health</option>
          </select>
          <select
            value={filter.urgency}
            onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', padding: '10px 16px', color: 'white'
            }}
          >
            <option value="">All Urgency</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="normal">🟣 Normal</option>
            <option value="low">⚪ Low</option>
          </select>
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Task List */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                Open Tasks ({tasks.length})
              </h2>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  Loading...
                </div>
              ) : tasks.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  No open tasks
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.ticket_id}
                    onClick={() => setSelectedTask(task)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      background: selectedTask?.ticket_id === task.ticket_id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{getCategoryIcon(task.category)}</span>
                        <span style={{ color: 'white', fontWeight: 600 }}>{task.pet_name}</span>
                        <span style={{
                          background: getUrgencyColor(task.urgency),
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {task.urgency?.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                        {formatDate(task.created_at)}
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0, lineHeight: 1.4 }}>
                      {task.summary}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                        {task.ticket_id}
                      </span>
                      {task.member_name && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User className="w-3 h-3" /> {task.member_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Task Detail */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
            {selectedTask ? (
              <>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                      {selectedTask.ticket_id}
                    </h2>
                    <span style={{
                      background: getUrgencyColor(selectedTask.urgency),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {selectedTask.urgency?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '20px', maxHeight: '500px', overflowY: 'auto' }}>
                  {/* Pet Info */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Pet
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <PawPrint className="w-6 h-6" style={{ color: 'white' }} />
                      </div>
                      <div>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>{selectedTask.pet_name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{selectedTask.pet_breed}</div>
                      </div>
                    </div>
                  </div>

                  {/* Member Info */}
                  {selectedTask.member_name && (
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Member
                      </h3>
                      <div style={{ color: 'white', marginBottom: '4px' }}>{selectedTask.member_name}</div>
                      {selectedTask.member_email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                          <Mail className="w-4 h-4" /> {selectedTask.member_email}
                        </div>
                      )}
                      {selectedTask.member_phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' }}>
                          <Phone className="w-4 h-4" /> {selectedTask.member_phone}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Summary
                    </h3>
                    <p style={{ color: 'white', lineHeight: 1.6, margin: 0 }}>{selectedTask.summary}</p>
                  </div>

                  {/* Key Requirements */}
                  {selectedTask.key_requirements?.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Key Requirements
                      </h3>
                      <ul style={{ margin: 0, padding: '0 0 0 20px', color: 'rgba(255,255,255,0.8)' }}>
                        {selectedTask.key_requirements.map((req, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Action */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Recommended Action
                    </h3>
                    <p style={{ color: '#a78bfa', fontWeight: 500, margin: 0 }}>{selectedTask.recommended_action}</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button
                      onClick={() => updateTaskStatus(selectedTask.ticket_id, 'in_progress')}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                        background: '#f97316', color: 'white', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Start Working
                    </button>
                    <button
                      onClick={() => updateTaskStatus(selectedTask.ticket_id, 'resolved', 'Completed by concierge')}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                        background: '#22c55e', color: 'white', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '60px 40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                <MessageCircle className="w-12 h-12" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Select a task to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConciergeDashboard;
