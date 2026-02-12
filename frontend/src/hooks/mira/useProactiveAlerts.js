/**
 * useProactiveAlerts Hook - Proactive Alerts & Greeting Management
 * 
 * Extracted from MiraDemoPage.jsx - Phase 2C Refactoring
 * Manages proactive alerts, greetings, and weather data
 * 
 * States managed:
 * - proactiveAlerts: celebrations, healthReminders, smartAlerts
 * - proactiveGreeting: time-based contextual greeting
 * - currentWeather: weather data for location-aware features
 */

import { useState, useEffect } from 'react';

/**
 * useProactiveAlerts Hook
 * @param {Object} pet - Current pet object for context
 * @returns {Object} Proactive alerts state and handlers
 */
const useProactiveAlerts = (pet) => {
  // ═══════════════════════════════════════════════════════════════════════════════
  // PROACTIVE ALERTS - Birthday/Health Reminders
  // ═══════════════════════════════════════════════════════════════════════════════
  const [proactiveAlerts, setProactiveAlerts] = useState({
    celebrations: [],
    healthReminders: [],
    smartAlerts: [],
    criticalCount: 0,
    hasUrgent: false
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PROACTIVE GREETING - Time-based and context-aware
  // ═══════════════════════════════════════════════════════════════════════════════
  const [proactiveGreeting, setProactiveGreeting] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // WEATHER DATA - For weather-aware features
  // ═══════════════════════════════════════════════════════════════════════════════
  const [currentWeather, setCurrentWeather] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // Generate proactive greeting based on time and pet context
  // ═══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!pet?.name) return;
    
    const hour = new Date().getHours();
    let greeting = '';
    let icon = '';
    let hasAlert = false;
    
    // Time-based greeting
    if (hour >= 5 && hour < 12) {
      greeting = `Good morning! How's ${pet.name} today?`;
      icon = '🌅';
    } else if (hour >= 12 && hour < 17) {
      greeting = `Good afternoon! What can I help with for ${pet.name}?`;
      icon = '☀️';
    } else if (hour >= 17 && hour < 21) {
      greeting = `Good evening! How was ${pet.name}'s day?`;
      icon = '🌆';
    } else {
      greeting = `Hello! ${pet.name} keeping you up? 😄`;
      icon = '🌙';
    }
    
    // Check for upcoming celebrations
    if (proactiveAlerts.celebrations.length > 0) {
      const upcoming = proactiveAlerts.celebrations.find(c => c.is_upcoming);
      if (upcoming) {
        greeting = `${upcoming.event} is coming up! Let's plan something special for ${pet.name}! 🎉`;
        icon = '🎂';
        hasAlert = true;
      }
    }
    
    // Check for health reminders
    if (proactiveAlerts.healthReminders.some(r => r.needs_attention)) {
      const urgent = proactiveAlerts.healthReminders.find(r => r.needs_attention);
      if (urgent && !hasAlert) {
        const reminderTitle = urgent.title || urgent.name || 'health checkup';
        greeting = `Reminder: ${reminderTitle} for ${pet.name}. Shall I help schedule?`;
        icon = '💊';
        hasAlert = true;
      }
    }
    
    setProactiveGreeting({ text: greeting, icon, hasAlert });
  }, [pet?.name, proactiveAlerts]);
  
  /**
   * Update proactive alerts with new data
   * @param {Object} alerts - New alerts data
   */
  const updateAlerts = (alerts) => {
    setProactiveAlerts(prev => ({
      ...prev,
      ...alerts
    }));
  };
  
  /**
   * Add a celebration alert
   * @param {Object} celebration - Celebration data
   */
  const addCelebration = (celebration) => {
    setProactiveAlerts(prev => ({
      ...prev,
      celebrations: [...prev.celebrations, celebration]
    }));
  };
  
  /**
   * Add a health reminder
   * @param {Object} reminder - Health reminder data
   */
  const addHealthReminder = (reminder) => {
    setProactiveAlerts(prev => ({
      ...prev,
      healthReminders: [...prev.healthReminders, reminder]
    }));
  };
  
  /**
   * Clear all alerts
   */
  const clearAlerts = () => {
    setProactiveAlerts({
      celebrations: [],
      healthReminders: [],
      smartAlerts: [],
      criticalCount: 0,
      hasUrgent: false
    });
  };
  
  /**
   * Update weather data
   * @param {Object} weather - Weather data
   */
  const updateWeather = (weather) => {
    setCurrentWeather(weather);
  };
  
  return {
    // State
    proactiveAlerts,
    setProactiveAlerts,
    proactiveGreeting,
    setProactiveGreeting,
    currentWeather,
    setCurrentWeather,
    
    // Helpers
    updateAlerts,
    addCelebration,
    addHealthReminder,
    clearAlerts,
    updateWeather
  };
};

export default useProactiveAlerts;
