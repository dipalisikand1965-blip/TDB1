/**
 * DineTabBar.jsx — Tab navigation for /dine
 * Tab 1: Eat & Nourish | Tab 2: Dine Out
 */
import React from 'react';
import { Utensils, MapPin } from 'lucide-react';

const TABS = [
  { id: 'eat', label: 'Eat & Nourish', Icon: Utensils },
  { id: 'dine-out', label: 'Dine Out', Icon: MapPin },
];

const DineTabBar = ({ activeTab, onChange }) => (
  <div
    style={{
      display: 'flex',
      borderBottom: '1.5px solid #F0E0D0',
      background: '#FFFFFF',
      gap: 0,
      marginBottom: 24,
    }}
    data-testid="dine-tab-bar"
  >
    {TABS.map(({ id, label, Icon }) => {
      const active = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          data-testid={`dine-tab-${id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '14px 20px',
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: active ? 700 : 500,
            color: active ? '#C44400' : '#888',
            borderBottom: active ? '3px solid #C44400' : '3px solid transparent',
            marginBottom: -1.5,
            transition: 'color 0.2s, border-color 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          <Icon size={15} />
          {label}
        </button>
      );
    })}
  </div>
);

export default DineTabBar;
