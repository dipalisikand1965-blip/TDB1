/**
 * MiraHeaderShell.jsx
 * 
 * MIRA OS Header Navigation Shell
 * 7 Tabs: Mojo | Today | Picks | Services | Insights | Learn | Concierge®
 * 
 * Each tab contains components mapped by their "dimension"
 * This is a SHELL - it doesn't replace components, it organizes them
 */

import React, { useState, memo } from 'react';
import { 
  PawPrint, Calendar, Sparkles, MessageCircle, 
  TrendingUp, BookOpen, Users, ChevronLeft, ChevronRight
} from 'lucide-react';

// Tab definitions with icons and dimensions
const HEADER_TABS = [
  { 
    id: 'mojo', 
    label: 'Mojo', 
    icon: PawPrint, 
    dimension: 'context',
    description: 'Who are we talking about?',
    color: '#F472B6' // Pink
  },
  { 
    id: 'today', 
    label: 'Today', 
    icon: Calendar, 
    dimension: 'time',
    description: 'What matters now?',
    color: '#FBBF24' // Yellow
  },
  { 
    id: 'picks', 
    label: 'Picks', 
    icon: Sparkles, 
    dimension: 'intelligence',
    description: 'What should we do next?',
    color: '#A78BFA' // Purple
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: MessageCircle, 
    dimension: 'execution',
    description: 'What are we arranging?',
    color: '#60A5FA' // Blue
  },
  { 
    id: 'insights', 
    label: 'Insights', 
    icon: TrendingUp, 
    dimension: 'pattern',
    description: 'What patterns exist?',
    color: '#34D399' // Green
  },
  { 
    id: 'learn', 
    label: 'Learn', 
    icon: BookOpen, 
    dimension: 'knowledge',
    description: 'What do we understand?',
    color: '#FB923C' // Orange
  },
  { 
    id: 'concierge', 
    label: 'Concierge®', 
    icon: Users, 
    dimension: 'human',
    description: 'When humans step in?',
    color: '#EC4899' // Hot pink
  }
];

// Component dimension registry - declares which dimension each component belongs to
export const COMPONENT_DIMENSIONS = {
  // Context dimension (Mojo)
  PetSelector: { dimension: 'context', surface: ['desktop', 'mobile'] },
  SoulKnowledgeTicker: { dimension: 'context', surface: ['desktop', 'mobile'] },
  MemoryWhisper: { dimension: 'context', surface: ['desktop', 'mobile'] },
  SoulFormModal: { dimension: 'context', surface: ['desktop', 'mobile'] },
  HealthVaultWizard: { dimension: 'context', surface: ['desktop', 'mobile'] },
  
  // Time dimension (Today)
  NotificationBell: { dimension: 'time', surface: ['desktop', 'mobile'] },
  ProactiveAlertsBanner: { dimension: 'time', surface: ['desktop', 'mobile'] },
  WelcomeHero: { dimension: 'time', surface: ['desktop', 'mobile'] },
  
  // Intelligence dimension (Picks)
  QuickReplies: { dimension: 'intelligence', surface: ['desktop', 'mobile'] },
  UnifiedPicksVault: { dimension: 'intelligence', surface: ['desktop', 'mobile'] },
  PersonalizedPicksPanel: { dimension: 'intelligence', surface: ['desktop', 'mobile'] },
  MiraTray: { dimension: 'intelligence', surface: ['desktop', 'mobile'] },
  VaultManager: { dimension: 'intelligence', surface: ['desktop', 'mobile'] },
  
  // Execution dimension (Services)
  ChatMessage: { dimension: 'execution', surface: ['desktop', 'mobile'] },
  ChatInputBar: { dimension: 'execution', surface: ['desktop', 'mobile'] },
  ServiceRequestModal: { dimension: 'execution', surface: ['desktop', 'mobile'] },
  ConciergeConfirmation: { dimension: 'execution', surface: ['desktop', 'mobile'] },
  MiraLoader: { dimension: 'execution', surface: ['desktop', 'mobile'] },
  
  // Pattern dimension (Insights)
  InsightsPanel: { dimension: 'pattern', surface: ['desktop', 'mobile'] },
  PastChatsPanel: { dimension: 'pattern', surface: ['desktop', 'mobile'] },
  
  // Knowledge dimension (Learn)
  LearnModal: { dimension: 'knowledge', surface: ['desktop', 'mobile'] },
  HelpModal: { dimension: 'knowledge', surface: ['desktop', 'mobile'] },
  
  // Human dimension (Concierge®)
  ConciergePanel: { dimension: 'human', surface: ['desktop', 'mobile'] },
  HandoffSummary: { dimension: 'human', surface: ['desktop', 'mobile'] }
};

// Get dimension for a component
export const getComponentDimension = (componentName) => {
  return COMPONENT_DIMENSIONS[componentName]?.dimension || 'execution';
};

// Check if component should show on current surface
export const shouldShowOnSurface = (componentName, isMobile) => {
  const config = COMPONENT_DIMENSIONS[componentName];
  if (!config) return true;
  const surface = isMobile ? 'mobile' : 'desktop';
  return config.surface.includes(surface);
};

/**
 * MiraHeaderShell - The navigation shell component
 * Renders horizontal tabs that filter which components are shown
 */
const MiraHeaderShell = memo(({ 
  activeTab = 'services', 
  onTabChange,
  badges = {},
  className = ''
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = React.useRef(null);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 120;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;
    scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  return (
    <div className={`mira-header-shell ${className}`}>
      {/* Scroll Left Button (desktop only) */}
      <button 
        className="header-scroll-btn header-scroll-left hidden md:flex"
        onClick={() => handleScroll('left')}
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Tabs Container */}
      <div 
        ref={scrollRef}
        className="header-tabs-container"
        data-testid="mira-header-tabs"
      >
        {HEADER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = badges[tab.id] || 0;
          
          return (
            <button
              key={tab.id}
              className={`header-tab ${isActive ? 'header-tab-active' : ''}`}
              onClick={() => onTabChange?.(tab.id)}
              style={{
                '--tab-color': tab.color,
                '--tab-bg': isActive ? `${tab.color}20` : 'transparent'
              }}
              data-testid={`header-tab-${tab.id}`}
              title={tab.description}
            >
              <Icon 
                size={18} 
                className="header-tab-icon"
                style={{ color: isActive ? tab.color : 'rgba(255,255,255,0.6)' }}
              />
              <span className="header-tab-label">{tab.label}</span>
              {badgeCount > 0 && (
                <span className="header-tab-badge">{badgeCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button (desktop only) */}
      <button 
        className="header-scroll-btn header-scroll-right hidden md:flex"
        onClick={() => handleScroll('right')}
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
});

MiraHeaderShell.displayName = 'MiraHeaderShell';

/**
 * TabContent - Wrapper for content within each tab
 * Shows/hides based on active tab
 */
export const TabContent = memo(({ 
  tabId, 
  activeTab, 
  children, 
  className = '' 
}) => {
  const isActive = activeTab === tabId;
  
  if (!isActive) return null;
  
  return (
    <div 
      className={`tab-content tab-content-${tabId} ${className}`}
      data-testid={`tab-content-${tabId}`}
    >
      {children}
    </div>
  );
});

TabContent.displayName = 'TabContent';

/**
 * DimensionWrapper - Wraps components with their dimension info
 * Useful for debugging and ensuring proper placement
 */
export const DimensionWrapper = memo(({ 
  componentName, 
  dimension, 
  children 
}) => {
  return (
    <div 
      className="dimension-wrapper"
      data-dimension={dimension || getComponentDimension(componentName)}
      data-component={componentName}
    >
      {children}
    </div>
  );
});

DimensionWrapper.displayName = 'DimensionWrapper';

export { HEADER_TABS };
export default MiraHeaderShell;
