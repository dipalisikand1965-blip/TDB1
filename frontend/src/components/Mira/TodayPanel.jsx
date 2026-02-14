/**
 * TodayPanel.jsx
 * 
 * TODAY = Time Layer
 * "What matters now" - Surfaces time-sensitive items that need attention.
 * 
 * Components:
 * 1. Today Summary Header
 * 2. Urgent Stack (overdue items)
 * 3. Due Soon Cards (upcoming reminders)
 * 4. Season + Environment Alerts
 * 5. Active Tasks Watchlist
 * 6. Documents + Compliance
 * 
 * Per MOJO Bible Part 2: "TODAY is proactive awareness, not shopping."
 */

import React, { useState, useEffect, memo } from 'react';
import { 
  Calendar, Clock, AlertTriangle, AlertCircle, Bell, 
  Syringe, Scissors, Cake, FileText, CheckCircle, 
  Sun, Cloud, Thermometer, Heart, Shield, Activity,
  ChevronRight, X, Loader2, RefreshCw
} from 'lucide-react';

// Calculate days until a date
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  return diff;
};

// Calculate days since a date
const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
  return diff;
};

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Urgent Item Card
const UrgentCard = memo(({ icon: Icon, title, description, action, onAction, variant = 'warning' }) => (
  <div className={`today-urgent-card ${variant}`} data-testid="urgent-card">
    <div className="urgent-icon">
      <Icon className="w-5 h-5" />
    </div>
    <div className="urgent-content">
      <span className="urgent-title">{title}</span>
      <span className="urgent-description">{description}</span>
    </div>
    {action && (
      <button className="urgent-action" onClick={onAction}>
        {action}
        <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
));

// Due Soon Card
const DueSoonCard = memo(({ icon: Icon, title, dueIn, pet, onAction }) => {
  const urgency = dueIn <= 0 ? 'overdue' : dueIn <= 7 ? 'soon' : 'upcoming';
  
  return (
    <div className={`today-due-card ${urgency}`} data-testid="due-soon-card">
      <div className="due-icon">
        <Icon className="w-5 h-5" />
      </div>
      <div className="due-content">
        <span className="due-title">{title}</span>
        <span className="due-pet">for {pet}</span>
      </div>
      <div className="due-timing">
        {dueIn <= 0 ? (
          <span className="overdue-badge">Overdue</span>
        ) : dueIn === 1 ? (
          <span className="tomorrow-badge">Tomorrow</span>
        ) : (
          <span className="days-badge">in {dueIn} days</span>
        )}
      </div>
      <button className="due-action" onClick={onAction}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});

// Weather Alert Card
const WeatherAlertCard = memo(({ weather, petName }) => {
  if (!weather) return null;
  
  const getWeatherAdvice = () => {
    const temp = weather.temperature;
    if (temp > 35) return { level: 'danger', message: 'Too hot for walks. Keep indoors.' };
    if (temp > 30) return { level: 'warning', message: 'Walk early morning or late evening only.' };
    if (temp < 5) return { level: 'warning', message: 'Very cold. Short walks recommended.' };
    if (temp < 10) return { level: 'caution', message: 'Keep walks short if cold-sensitive.' };
    return { level: 'safe', message: 'Great weather for outdoor activities!' };
  };
  
  const advice = getWeatherAdvice();
  
  return (
    <div className={`today-weather-card ${advice.level}`} data-testid="weather-alert">
      <div className="weather-icon">
        {advice.level === 'danger' ? <AlertTriangle className="w-5 h-5" /> :
         advice.level === 'warning' ? <Sun className="w-5 h-5" /> :
         <Cloud className="w-5 h-5" />}
      </div>
      <div className="weather-content">
        <span className="weather-temp">{weather.temperature}°C in {weather.city}</span>
        <span className="weather-advice">{advice.message}</span>
      </div>
      <span className={`weather-badge ${advice.level}`}>
        {advice.level === 'safe' ? 'SAFE' : advice.level.toUpperCase()}
      </span>
    </div>
  );
});

// Task Status Card
const TaskCard = memo(({ task, onView }) => (
  <div className="today-task-card" data-testid="task-card">
    <div className="task-status">
      {task.status === 'pending' ? <Clock className="w-4 h-4 text-amber-400" /> :
       task.status === 'confirmed' ? <CheckCircle className="w-4 h-4 text-green-400" /> :
       <Activity className="w-4 h-4 text-blue-400" />}
    </div>
    <div className="task-content">
      <span className="task-title">{task.title}</span>
      <span className="task-status-text">{task.statusText}</span>
    </div>
    <button className="task-view" onClick={onView}>
      View
    </button>
  </div>
));

// Birthday Countdown
const BirthdayCountdown = memo(({ pet, daysUntilBirthday }) => {
  if (daysUntilBirthday === null || daysUntilBirthday > 30) return null;
  
  return (
    <div className="today-birthday-card" data-testid="birthday-countdown">
      <div className="birthday-icon">
        <Cake className="w-6 h-6" />
      </div>
      <div className="birthday-content">
        <span className="birthday-title">
          {daysUntilBirthday === 0 ? `Happy Birthday, ${pet.name}! 🎉` :
           daysUntilBirthday === 1 ? `${pet.name}'s birthday is tomorrow!` :
           `${pet.name}'s birthday in ${daysUntilBirthday} days`}
        </span>
        {daysUntilBirthday > 0 && (
          <span className="birthday-hint">Plan something special?</span>
        )}
      </div>
      {daysUntilBirthday > 0 && (
        <span className="birthday-countdown">{daysUntilBirthday}</span>
      )}
    </div>
  );
});

// Main TODAY Panel Component
const TodayPanel = ({
  isOpen,
  onClose,
  pet,
  allPets = [],
  weather = null,
  apiUrl,
  token,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(false);
  const [todayItems, setTodayItems] = useState({
    urgent: [],
    dueSoon: [],
    tasks: [],
    documents: [],
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Calculate reminders from pet data
  useEffect(() => {
    if (!pet) return;
    
    const calculateReminders = () => {
      const soulAnswers = pet.doggy_soul_answers || {};
      const healthVault = pet.health_vault || {};
      const urgent = [];
      const dueSoon = [];
      
      // 1. Vaccination Status
      if (soulAnswers.vaccination_status === 'Overdue' || soulAnswers.vaccination_status === 'Due soon') {
        urgent.push({
          icon: Syringe,
          title: 'Vaccination Due',
          description: `${pet.name}'s vaccinations need attention`,
          action: 'Schedule',
          variant: soulAnswers.vaccination_status === 'Overdue' ? 'danger' : 'warning',
        });
      }
      
      // 2. Last Vet Visit
      const lastVetVisit = soulAnswers.last_vet_visit;
      if (lastVetVisit) {
        const daysSinceVet = daysSince(lastVetVisit);
        if (daysSinceVet > 365) {
          urgent.push({
            icon: Heart,
            title: 'Annual Checkup Overdue',
            description: `Last vet visit was ${Math.floor(daysSinceVet / 30)} months ago`,
            action: 'Book Now',
            variant: 'warning',
          });
        } else if (daysSinceVet > 300) {
          dueSoon.push({
            icon: Heart,
            title: 'Annual Checkup Coming Up',
            dueIn: 365 - daysSinceVet,
            pet: pet.name,
          });
        }
      }
      
      // 3. Grooming Cadence
      const groomingFreq = soulAnswers.grooming_frequency;
      const lastGrooming = soulAnswers.last_grooming_date;
      if (groomingFreq && lastGrooming) {
        const freqDays = {
          'Weekly': 7,
          'Bi-weekly': 14,
          'Monthly': 30,
          'Every 6 weeks': 42,
          'Every 2 months': 60,
          'Quarterly': 90,
        };
        const interval = freqDays[groomingFreq] || 30;
        const daysSinceGrooming = daysSince(lastGrooming);
        const daysUntilDue = interval - daysSinceGrooming;
        
        if (daysUntilDue <= 0) {
          urgent.push({
            icon: Scissors,
            title: 'Grooming Overdue',
            description: `${pet.name} is due for grooming`,
            action: 'Book',
            variant: 'warning',
          });
        } else if (daysUntilDue <= 7) {
          dueSoon.push({
            icon: Scissors,
            title: 'Grooming Session',
            dueIn: daysUntilDue,
            pet: pet.name,
          });
        }
      }
      
      // 4. Birthday
      const birthday = pet.birthday || pet.dob || soulAnswers.dob;
      let birthdayDaysUntil = null;
      if (birthday) {
        const bday = new Date(birthday);
        const today = new Date();
        const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        if (thisYearBday < today) {
          thisYearBday.setFullYear(today.getFullYear() + 1);
        }
        birthdayDaysUntil = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
      }
      
      // 5. Document Expiry
      const documents = pet.documents || [];
      documents.forEach(doc => {
        if (doc.expiry_date) {
          const daysToExpiry = daysUntil(doc.expiry_date);
          if (daysToExpiry !== null && daysToExpiry <= 30) {
            if (daysToExpiry <= 0) {
              urgent.push({
                icon: FileText,
                title: `${doc.name || 'Document'} Expired`,
                description: 'Needs renewal',
                action: 'Renew',
                variant: 'danger',
              });
            } else {
              dueSoon.push({
                icon: FileText,
                title: `${doc.name || 'Document'} Expiring`,
                dueIn: daysToExpiry,
                pet: pet.name,
              });
            }
          }
        }
      });
      
      setTodayItems({
        urgent,
        dueSoon,
        tasks: [],
        documents: [],
        birthdayDaysUntil,
      });
      setLastUpdated(new Date());
    };
    
    calculateReminders();
  }, [pet]);
  
  // Fetch active tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!pet?.id || !apiUrl) return;
      
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        // Fetch service tickets for this pet
        const response = await fetch(`${apiUrl}/api/service-desk/tickets?pet_id=${pet.id}&status=active`, {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          const tasks = (data.tickets || []).slice(0, 3).map(ticket => ({
            id: ticket._id || ticket.id,
            title: ticket.subject || ticket.type,
            status: ticket.status,
            statusText: ticket.status === 'pending' ? 'Awaiting confirmation' :
                       ticket.status === 'confirmed' ? 'Scheduled' :
                       ticket.status === 'in_progress' ? 'In progress' : ticket.status,
          }));
          
          setTodayItems(prev => ({ ...prev, tasks }));
        }
      } catch (err) {
        console.error('[TODAY] Error fetching tasks:', err);
      }
    };
    
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, pet?.id, apiUrl, token]);
  
  if (!isOpen) return null;
  
  const totalCount = todayItems.urgent.length + todayItems.dueSoon.length + todayItems.tasks.length;
  
  return (
    <div className="today-panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="today-panel" data-testid="today-panel">
        {/* Header */}
        <div className="today-header">
          <div className="today-header-left">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h2>Today</h2>
            {totalCount > 0 && (
              <span className="today-count">{totalCount}</span>
            )}
          </div>
          <div className="today-header-right">
            {lastUpdated && (
              <span className="today-updated">
                Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            <button className="today-close" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="today-content">
          {/* Weather Alert */}
          {weather && (
            <WeatherAlertCard weather={weather} petName={pet?.name} />
          )}
          
          {/* Birthday Countdown */}
          {todayItems.birthdayDaysUntil !== null && todayItems.birthdayDaysUntil <= 30 && (
            <BirthdayCountdown pet={pet} daysUntilBirthday={todayItems.birthdayDaysUntil} />
          )}
          
          {/* Urgent Stack */}
          {todayItems.urgent.length > 0 && (
            <div className="today-section">
              <h3 className="today-section-title">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Needs Attention
              </h3>
              <div className="today-urgent-stack">
                {todayItems.urgent.map((item, i) => (
                  <UrgentCard
                    key={i}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    action={item.action}
                    variant={item.variant}
                    onAction={() => onNavigate?.(item.navigateTo || '/care')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Due Soon */}
          {todayItems.dueSoon.length > 0 && (
            <div className="today-section">
              <h3 className="today-section-title">
                <Clock className="w-4 h-4 text-amber-400" />
                Coming Up
              </h3>
              <div className="today-due-list">
                {todayItems.dueSoon.map((item, i) => (
                  <DueSoonCard
                    key={i}
                    icon={item.icon}
                    title={item.title}
                    dueIn={item.dueIn}
                    pet={item.pet}
                    onAction={() => onNavigate?.('/care')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Active Tasks */}
          {todayItems.tasks.length > 0 && (
            <div className="today-section">
              <h3 className="today-section-title">
                <Activity className="w-4 h-4 text-blue-400" />
                Active Requests
              </h3>
              <div className="today-tasks-list">
                {todayItems.tasks.map((task, i) => (
                  <TaskCard
                    key={i}
                    task={task}
                    onView={() => onNavigate?.(`/my-tickets?id=${task.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {totalCount === 0 && !weather && (
            <div className="today-empty">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <h3>All caught up!</h3>
              <p>No urgent items for {pet?.name || 'your pet'} today.</p>
            </div>
          )}
          
          {/* Other Pets Summary (if multiple pets) */}
          {allPets.length > 1 && (
            <div className="today-other-pets">
              <h3 className="today-section-title">
                <Heart className="w-4 h-4 text-pink-400" />
                Other Pets
              </h3>
              <div className="other-pets-summary">
                {allPets.filter(p => p.id !== pet?.id).slice(0, 3).map((otherPet, i) => (
                  <div key={i} className="other-pet-item">
                    <span className="other-pet-name">{otherPet.name}</span>
                    <span className="other-pet-status">No urgent items</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayPanel;

// Export the styles
export const todayPanelStyles = `
/* TODAY Panel Styles */
.today-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 80px;
  animation: fadeIn 0.2s ease-out;
}

.today-panel {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 120px);
  background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%);
  border-radius: 20px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(139, 92, 246, 0.1);
}

.today-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.today-header-left h2 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.today-count {
  background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.today-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.today-updated {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.today-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
}

.today-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Content */
.today-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Section */
.today-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.today-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

/* Weather Card */
.today-weather-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.today-weather-card.safe {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.1);
}

.today-weather-card.caution {
  border-color: rgba(250, 204, 21, 0.3);
  background: rgba(250, 204, 21, 0.1);
}

.today-weather-card.warning {
  border-color: rgba(249, 115, 22, 0.3);
  background: rgba(249, 115, 22, 0.1);
}

.today-weather-card.danger {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
}

.weather-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
}

.today-weather-card.danger .weather-icon { color: #EF4444; }
.today-weather-card.warning .weather-icon { color: #F97316; }
.today-weather-card.safe .weather-icon { color: #22C55E; }

.weather-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weather-temp {
  font-size: 15px;
  font-weight: 600;
  color: white;
}

.weather-advice {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.weather-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.weather-badge.safe { background: rgba(34, 197, 94, 0.2); color: #22C55E; }
.weather-badge.caution { background: rgba(250, 204, 21, 0.2); color: #FACC15; }
.weather-badge.warning { background: rgba(249, 115, 22, 0.2); color: #F97316; }
.weather-badge.danger { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

/* Birthday Card */
.today-birthday-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
  border: 1px solid rgba(236, 72, 153, 0.3);
}

.birthday-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #EC4899 0%, #A855F7 100%);
  color: white;
}

.birthday-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.birthday-title {
  font-size: 15px;
  font-weight: 600;
  color: white;
}

.birthday-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.birthday-countdown {
  font-size: 24px;
  font-weight: 700;
  color: #EC4899;
}

/* Urgent Card */
.today-urgent-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.today-urgent-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.today-urgent-card.warning {
  background: rgba(249, 115, 22, 0.1);
  border-color: rgba(249, 115, 22, 0.3);
}

.today-urgent-card.danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.urgent-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.today-urgent-card.warning .urgent-icon {
  background: rgba(249, 115, 22, 0.2);
  color: #F97316;
}

.urgent-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.urgent-title {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.urgent-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.urgent-action {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.urgent-action:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Due Soon Card */
.today-due-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.today-due-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.due-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.2);
  color: #A78BFA;
}

.due-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.due-title {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.due-pet {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.due-timing {
  display: flex;
  align-items: center;
}

.days-badge, .tomorrow-badge, .overdue-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
}

.days-badge {
  background: rgba(139, 92, 246, 0.2);
  color: #A78BFA;
}

.tomorrow-badge {
  background: rgba(250, 204, 21, 0.2);
  color: #FACC15;
}

.overdue-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.due-action {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  padding: 6px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.due-action:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Task Card */
.today-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.today-task-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.task-status {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.task-status-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.task-view {
  font-size: 12px;
  font-weight: 500;
  color: #A78BFA;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
}

.task-view:hover {
  color: #C4B5FD;
}

/* Empty State */
.today-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.today-empty h3 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 16px 0 4px;
}

.today-empty p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* Other Pets */
.today-other-pets {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.other-pets-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.other-pet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.other-pet-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.other-pet-status {
  font-size: 12px;
  color: rgba(34, 197, 94, 0.8);
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .today-panel-overlay {
    padding: 0;
    align-items: flex-end;
  }
  
  .today-panel {
    max-width: 100%;
    max-height: 85vh;
    border-radius: 20px 20px 0 0;
  }
}
`;
