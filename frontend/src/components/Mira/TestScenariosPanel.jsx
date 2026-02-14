/**
 * TestScenariosPanel - Test Scenario Chips Panel
 * ==============================================
 * Shows quick test scenarios for demo purposes
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

// Test scenarios for demo - dynamic pet name replacement
const getTestScenarios = (petName = 'your pet') => [
  { id: 'birthday', label: '🎂 Birthday Party', query: `It's ${petName}'s birthday! Help me plan something special` },
  { id: 'grooming', label: '✂️ Grooming', query: `${petName} needs a haircut and spa day` },
  { id: 'food', label: '🍖 Food Recs', query: `What food is best for ${petName}?` },
  { id: 'health', label: '💊 Health Check', query: `When is ${petName}'s next vaccine due?` },
  { id: 'travel', label: '✈️ Travel', query: `I'm planning a trip to Goa with ${petName}` },
  { id: 'training', label: '🎓 Training', query: `How do I train ${petName} to stop barking?` },
  { id: 'places', label: '📍 Places', query: 'Find pet-friendly cafes near me' },
  { id: 'emergency', label: '🚨 Emergency', query: `${petName} ate something they shouldn't have` },
];

/**
 * TestScenariosPanel Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is visible
 * @param {Function} props.onClose - Called when panel is closed
 * @param {string} props.activeScenario - Currently active scenario ID
 * @param {Function} props.onScenarioClick - Called when a scenario is clicked
 * @param {string} props.petName - Active pet's name for dynamic queries
 */
const TestScenariosPanel = ({
  isOpen,
  onClose,
  activeScenario,
  onScenarioClick,
  petName = 'your pet'
}) => {
  if (!isOpen) return null;
  
  // Get scenarios with dynamic pet name
  const TEST_SCENARIOS = getTestScenarios(petName);
  
  const handleClose = () => {
    localStorage.setItem('mira_test_scenarios_dismissed', 'true');
    onClose();
  };
  
  const handleScenarioClick = (scenario) => {
    hapticFeedback.chipTap();
    if (onScenarioClick) {
      onScenarioClick(scenario.id, scenario.query);
    }
  };
  
  return (
    <div className="mp-test-panel" data-testid="test-scenarios-panel">
      <div className="mp-test-header">
        <span className="mp-test-title">
          <Sparkles /> Test Scenarios
        </span>
        <button className="mp-test-close" onClick={handleClose}>
          <X />
        </button>
      </div>
      <div className="mp-test-grid">
        {TEST_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleScenarioClick(scenario)}
            data-testid={`scenario-${scenario.id}`}
            className={`mp-test-chip ${activeScenario === scenario.id ? 'active' : ''}`}
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TestScenariosPanel;
export { getTestScenarios };
