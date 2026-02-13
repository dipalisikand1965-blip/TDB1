/**
 * MojoSectionEditors.jsx
 * 
 * Inline edit forms for each MOJO section.
 * Allows drill-in editing without leaving the modal.
 */

import React, { useState, useCallback, memo } from 'react';
import { 
  Save, X, Plus, Trash2, Check, Loader2,
  Calendar, Upload, AlertCircle
} from 'lucide-react';

// Predefined options for dropdowns
const OPTIONS = {
  temperament: ['Calm', 'Playful', 'Energetic', 'Anxious', 'Friendly', 'Shy', 'Independent', 'Affectionate'],
  energy_level: ['Low', 'Medium', 'High', 'Very High'],
  play_style: ['Fetch', 'Tug', 'Chase', 'Wrestling', 'Independent play', 'Puzzle toys', 'Water play'],
  social_with_dogs: ['Very friendly', 'Friendly', 'Selective', 'Nervous', 'Reactive', 'Prefers humans'],
  social_with_people: ['Loves everyone', 'Friendly', 'Shy at first', 'Selective', 'Nervous with strangers'],
  general_nature: ['Gentle', 'Protective', 'Curious', 'Laid-back', 'Alert', 'Mischievous'],
  
  diet_type: ['Dry kibble', 'Wet food', 'Raw diet', 'Home-cooked', 'Mixed', 'Prescription diet'],
  feeding_schedule: ['Once daily', 'Twice daily', 'Three times daily', 'Free feeding', 'Scheduled meals'],
  favorite_flavors: ['Chicken', 'Beef', 'Lamb', 'Fish', 'Duck', 'Turkey', 'Pork', 'Vegetarian'],
  
  training_level: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Professional'],
  commands_known: ['Sit', 'Stay', 'Come', 'Down', 'Heel', 'Leave it', 'Drop it', 'Shake', 'Roll over', 'Fetch'],
  leash_behavior: ['Perfect heel', 'Walks well', 'Pulls sometimes', 'Pulls a lot', 'Reactive on leash'],
  behavioral_issues: ['None', 'Separation anxiety', 'Barking', 'Jumping', 'Leash reactivity', 'Food guarding', 'Fear-based'],
  
  coat_type: ['Short', 'Medium', 'Long', 'Double coat', 'Wiry', 'Curly', 'Hairless'],
  grooming_frequency: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'As needed'],
  skin_sensitivity: ['Normal', 'Sensitive', 'Very sensitive', 'Allergies present'],
  bath_frequency: ['Weekly', 'Bi-weekly', 'Monthly', 'Every 2-3 months', 'As needed'],
  
  walk_frequency: ['Multiple times daily', 'Twice daily', 'Once daily', 'Few times a week'],
  exercise_needs: ['Low (short walks)', 'Moderate (30-60 min)', 'High (1-2 hours)', 'Very high (2+ hours)'],
  sleep_pattern: ['Sleeps through night', 'Light sleeper', 'Naps frequently', 'Night owl', 'Early riser'],
  
  fear_triggers: ['Thunder', 'Fireworks', 'Vacuum', 'Strangers', 'Other dogs', 'Loud noises', 'Car rides', 'Vet visits'],
  likes: ['Belly rubs', 'Treats', 'Car rides', 'Swimming', 'Fetch', 'Cuddles', 'Running', 'Other dogs'],
  dislikes: ['Baths', 'Nail trimming', 'Loud noises', 'Being alone', 'Grooming', 'Strangers', 'Other dogs'],
};

// Base Editor Wrapper Component
const EditorWrapper = memo(({ title, onSave, onCancel, saving, children }) => (
  <div className="mojo-editor-wrapper">
    <div className="editor-header">
      <span className="editor-title">Edit {title}</span>
      <div className="editor-actions">
        <button 
          className="editor-cancel-btn"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="w-4 h-4" />
        </button>
        <button 
          className="editor-save-btn"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
    <div className="editor-content">
      {children}
    </div>
  </div>
));

// Dropdown Select Component
const SelectField = memo(({ label, value, options, onChange, multiple = false }) => (
  <div className="editor-field">
    <label className="field-label">{label}</label>
    {multiple ? (
      <div className="multi-select-grid">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            className={`multi-select-chip ${(value || []).includes(opt) ? 'selected' : ''}`}
            onClick={() => {
              const current = value || [];
              const newValue = current.includes(opt)
                ? current.filter(v => v !== opt)
                : [...current, opt];
              onChange(newValue);
            }}
          >
            {(value || []).includes(opt) && <Check className="w-3 h-3" />}
            {opt}
          </button>
        ))}
      </div>
    ) : (
      <select 
        className="field-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )}
  </div>
));

// Text Input Component
const TextField = memo(({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="editor-field">
    <label className="field-label">{label}</label>
    <input
      type={type}
      className="field-input"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
));

// Tags Input Component
const TagsField = memo(({ label, value, onChange, suggestions = [] }) => {
  const [input, setInput] = useState('');
  const tags = value || [];
  
  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  };
  
  const removeTag = (tag) => {
    onChange(tags.filter(t => t !== tag));
  };
  
  return (
    <div className="editor-field">
      <label className="field-label">{label}</label>
      <div className="tags-container">
        {tags.map(tag => (
          <span key={tag} className="tag-chip">
            {tag}
            <button type="button" onClick={() => removeTag(tag)}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          className="tag-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              addTag(input.trim());
            }
          }}
          placeholder="Type and press Enter..."
        />
      </div>
      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.filter(s => !tags.includes(s)).slice(0, 5).map(s => (
            <button key={s} type="button" className="suggestion-chip" onClick={() => addTag(s)}>
              <Plus className="w-3 h-3" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ========== SECTION EDITORS ==========

// Soul Profile Editor
export const SoulProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    temperament: pet?.doggy_soul_answers?.temperament || '',
    general_nature: pet?.doggy_soul_answers?.general_nature || '',
    energy_level: pet?.doggy_soul_answers?.energy_level || '',
    play_style: pet?.doggy_soul_answers?.play_style || [],
    social_with_dogs: pet?.doggy_soul_answers?.social_with_dogs || '',
    social_with_people: pet?.doggy_soul_answers?.social_with_people || '',
  });
  
  const handleSave = () => onSave(data);
  
  return (
    <EditorWrapper title="Soul Profile" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <SelectField 
        label="Temperament" 
        value={data.temperament} 
        options={OPTIONS.temperament}
        onChange={(v) => setData(prev => ({ ...prev, temperament: v }))}
      />
      <SelectField 
        label="General Nature" 
        value={data.general_nature} 
        options={OPTIONS.general_nature}
        onChange={(v) => setData(prev => ({ ...prev, general_nature: v }))}
      />
      <SelectField 
        label="Energy Level" 
        value={data.energy_level} 
        options={OPTIONS.energy_level}
        onChange={(v) => setData(prev => ({ ...prev, energy_level: v }))}
      />
      <SelectField 
        label="Play Style" 
        value={data.play_style} 
        options={OPTIONS.play_style}
        onChange={(v) => setData(prev => ({ ...prev, play_style: v }))}
        multiple
      />
      <SelectField 
        label="With Other Dogs" 
        value={data.social_with_dogs} 
        options={OPTIONS.social_with_dogs}
        onChange={(v) => setData(prev => ({ ...prev, social_with_dogs: v }))}
      />
      <SelectField 
        label="With People" 
        value={data.social_with_people} 
        options={OPTIONS.social_with_people}
        onChange={(v) => setData(prev => ({ ...prev, social_with_people: v }))}
      />
    </EditorWrapper>
  );
});

// Health Profile Editor
export const HealthProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    weight: pet?.doggy_soul_answers?.weight || '',
    food_allergies: pet?.doggy_soul_answers?.food_allergies || [],
    spayed_neutered: pet?.doggy_soul_answers?.spayed_neutered || '',
    vaccination_status: pet?.doggy_soul_answers?.vaccination_status || '',
    medical_conditions: pet?.doggy_soul_answers?.medical_conditions || [],
  });
  
  const handleSave = () => onSave(data);
  
  return (
    <EditorWrapper title="Health Profile" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <TextField 
        label="Weight" 
        value={data.weight}
        onChange={(v) => setData(prev => ({ ...prev, weight: v }))}
        placeholder="e.g., 12 kg or 25 lbs"
      />
      <TagsField 
        label="Allergies" 
        value={data.food_allergies}
        onChange={(v) => setData(prev => ({ ...prev, food_allergies: v }))}
        suggestions={['Chicken', 'Beef', 'Wheat', 'Dairy', 'Soy', 'Corn', 'Eggs', 'Fish']}
      />
      <SelectField 
        label="Spayed/Neutered" 
        value={data.spayed_neutered} 
        options={['Yes', 'No', 'Unknown']}
        onChange={(v) => setData(prev => ({ ...prev, spayed_neutered: v }))}
      />
      <SelectField 
        label="Vaccination Status" 
        value={data.vaccination_status} 
        options={['Up to date', 'Due soon', 'Overdue', 'Unknown']}
        onChange={(v) => setData(prev => ({ ...prev, vaccination_status: v }))}
      />
      <TagsField 
        label="Medical Conditions" 
        value={data.medical_conditions}
        onChange={(v) => setData(prev => ({ ...prev, medical_conditions: v }))}
        suggestions={['Arthritis', 'Diabetes', 'Heart condition', 'Hip dysplasia', 'Epilepsy', 'Skin allergies']}
      />
    </EditorWrapper>
  );
});

// Diet & Food Editor
export const DietProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    diet_type: pet?.doggy_soul_answers?.diet_type || '',
    feeding_schedule: pet?.doggy_soul_answers?.feeding_schedule || '',
    favorite_flavors: pet?.doggy_soul_answers?.favorite_flavors || [],
    treat_preferences: pet?.doggy_soul_answers?.treat_preferences || [],
    food_brand: pet?.doggy_soul_answers?.food_brand || '',
  });
  
  const handleSave = () => onSave(data);
  
  return (
    <EditorWrapper title="Diet & Food" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <SelectField 
        label="Diet Type" 
        value={data.diet_type} 
        options={OPTIONS.diet_type}
        onChange={(v) => setData(prev => ({ ...prev, diet_type: v }))}
      />
      <SelectField 
        label="Feeding Schedule" 
        value={data.feeding_schedule} 
        options={OPTIONS.feeding_schedule}
        onChange={(v) => setData(prev => ({ ...prev, feeding_schedule: v }))}
      />
      <SelectField 
        label="Favorite Flavors" 
        value={data.favorite_flavors} 
        options={OPTIONS.favorite_flavors}
        onChange={(v) => setData(prev => ({ ...prev, favorite_flavors: v }))}
        multiple
      />
      <TextField 
        label="Current Food Brand" 
        value={data.food_brand}
        onChange={(v) => setData(prev => ({ ...prev, food_brand: v }))}
        placeholder="e.g., Royal Canin, Pedigree..."
      />
      <TagsField 
        label="Treat Preferences" 
        value={data.treat_preferences}
        onChange={(v) => setData(prev => ({ ...prev, treat_preferences: v }))}
        suggestions={['Dental chews', 'Training treats', 'Jerky', 'Biscuits', 'Freeze-dried', 'Natural chews']}
      />
    </EditorWrapper>
  );
});

// Behaviour & Training Editor
export const BehaviourProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    training_level: pet?.doggy_soul_answers?.training_level || '',
    commands_known: pet?.doggy_soul_answers?.commands_known || [],
    leash_behavior: pet?.doggy_soul_answers?.leash_behavior || '',
    behavioral_issues: pet?.doggy_soul_answers?.behavioral_issues || [],
  });
  
  const handleSave = () => onSave(data);
  
  return (
    <EditorWrapper title="Behaviour & Training" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <SelectField 
        label="Training Level" 
        value={data.training_level} 
        options={OPTIONS.training_level}
        onChange={(v) => setData(prev => ({ ...prev, training_level: v }))}
      />
      <SelectField 
        label="Commands Known" 
        value={data.commands_known} 
        options={OPTIONS.commands_known}
        onChange={(v) => setData(prev => ({ ...prev, commands_known: v }))}
        multiple
      />
      <SelectField 
        label="Leash Behavior" 
        value={data.leash_behavior} 
        options={OPTIONS.leash_behavior}
        onChange={(v) => setData(prev => ({ ...prev, leash_behavior: v }))}
      />
      <SelectField 
        label="Working On (Issues)" 
        value={data.behavioral_issues} 
        options={OPTIONS.behavioral_issues}
        onChange={(v) => setData(prev => ({ ...prev, behavioral_issues: v }))}
        multiple
      />
    </EditorWrapper>
  );
});

// Grooming & Care Editor
export const GroomingProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    coat_type: pet?.doggy_soul_answers?.coat_type || '',
    grooming_frequency: pet?.doggy_soul_answers?.grooming_frequency || '',
    skin_sensitivity: pet?.doggy_soul_answers?.skin_sensitivity || '',
    bath_frequency: pet?.doggy_soul_answers?.bath_frequency || '',
  });
  
  const handleSave = () => onSave(data);
  
  return (
    <EditorWrapper title="Grooming & Care" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <SelectField 
        label="Coat Type" 
        value={data.coat_type} 
        options={OPTIONS.coat_type}
        onChange={(v) => setData(prev => ({ ...prev, coat_type: v }))}
      />
      <SelectField 
        label="Grooming Frequency" 
        value={data.grooming_frequency} 
        options={OPTIONS.grooming_frequency}
        onChange={(v) => setData(prev => ({ ...prev, grooming_frequency: v }))}
      />
      <SelectField 
        label="Skin Sensitivity" 
        value={data.skin_sensitivity} 
        options={OPTIONS.skin_sensitivity}
        onChange={(v) => setData(prev => ({ ...prev, skin_sensitivity: v }))}
      />
      <SelectField 
        label="Bath Frequency" 
        value={data.bath_frequency} 
        options={OPTIONS.bath_frequency}
        onChange={(v) => setData(prev => ({ ...prev, bath_frequency: v }))}
      />
    </EditorWrapper>
  );
});

// Routine Tracker Editor
export const RoutineProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    walk_frequency: pet?.doggy_soul_answers?.walk_frequency || '',
    exercise_needs: pet?.doggy_soul_answers?.exercise_needs || '',
    sleep_pattern: pet?.doggy_soul_answers?.sleep_pattern || '',
    daily_routine: pet?.doggy_soul_answers?.daily_routine || '',
  });
  
  const handleSave = () => onSave(data);
  
  return (
    <EditorWrapper title="Routine Tracker" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <SelectField 
        label="Walk Frequency" 
        value={data.walk_frequency} 
        options={OPTIONS.walk_frequency}
        onChange={(v) => setData(prev => ({ ...prev, walk_frequency: v }))}
      />
      <SelectField 
        label="Exercise Needs" 
        value={data.exercise_needs} 
        options={OPTIONS.exercise_needs}
        onChange={(v) => setData(prev => ({ ...prev, exercise_needs: v }))}
      />
      <SelectField 
        label="Sleep Pattern" 
        value={data.sleep_pattern} 
        options={OPTIONS.sleep_pattern}
        onChange={(v) => setData(prev => ({ ...prev, sleep_pattern: v }))}
      />
      <TextField 
        label="Daily Routine Notes" 
        value={data.daily_routine}
        onChange={(v) => setData(prev => ({ ...prev, daily_routine: v }))}
        placeholder="e.g., Morning walk at 7am, dinner at 6pm..."
      />
    </EditorWrapper>
  );
});

// Preferences & Constraints Editor
export const PreferencesProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    likes: pet?.doggy_soul_answers?.likes || [],
    dislikes: pet?.doggy_soul_answers?.dislikes || [],
    fear_triggers: pet?.doggy_soul_answers?.fear_triggers || [],
    special_needs: pet?.doggy_soul_answers?.special_needs || [],
  });
  
  const handleSave = () => onSave(data);
  
  return (
    <EditorWrapper title="Preferences & Constraints" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <SelectField 
        label="Likes" 
        value={data.likes} 
        options={OPTIONS.likes}
        onChange={(v) => setData(prev => ({ ...prev, likes: v }))}
        multiple
      />
      <SelectField 
        label="Dislikes" 
        value={data.dislikes} 
        options={OPTIONS.dislikes}
        onChange={(v) => setData(prev => ({ ...prev, dislikes: v }))}
        multiple
      />
      <SelectField 
        label="Fear Triggers" 
        value={data.fear_triggers} 
        options={OPTIONS.fear_triggers}
        onChange={(v) => setData(prev => ({ ...prev, fear_triggers: v }))}
        multiple
      />
      <TagsField 
        label="Special Needs" 
        value={data.special_needs}
        onChange={(v) => setData(prev => ({ ...prev, special_needs: v }))}
        suggestions={['Mobility assistance', 'Visual impairment', 'Hearing impairment', 'Anxiety medication', 'Special diet']}
      />
    </EditorWrapper>
  );
});

// Timeline Event Editor (Add new event)
export const TimelineEventEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    title: '',
    date: '',
    type: 'milestone',
    notes: '',
  });
  
  const handleSave = () => {
    // Save as timeline event in doggy_soul_answers
    const existingTimeline = pet?.doggy_soul_answers?.timeline_events || [];
    const newEvent = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    };
    onSave({ timeline_events: [...existingTimeline, newEvent] });
  };
  
  return (
    <EditorWrapper title="Timeline Event" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <TextField 
        label="Event Title" 
        value={data.title}
        onChange={(v) => setData(prev => ({ ...prev, title: v }))}
        placeholder="e.g., First beach visit, Surgery..."
      />
      <TextField 
        label="Date" 
        type="date"
        value={data.date}
        onChange={(v) => setData(prev => ({ ...prev, date: v }))}
      />
      <SelectField 
        label="Event Type" 
        value={data.type} 
        options={['milestone', 'medical', 'adventure', 'training', 'birthday', 'adoption', 'other']}
        onChange={(v) => setData(prev => ({ ...prev, type: v }))}
      />
      <TextField 
        label="Notes" 
        value={data.notes}
        onChange={(v) => setData(prev => ({ ...prev, notes: v }))}
        placeholder="Any additional details..."
      />
    </EditorWrapper>
  );
});

// Basic Details Editor (Photo, name, breed, etc)
export const BasicDetailsEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    name: pet?.name || '',
    breed: pet?.breed || '',
    age_years: pet?.age_years || pet?.doggy_soul_answers?.age_years || '',
    gender: pet?.gender || pet?.doggy_soul_answers?.gender || '',
    city: pet?.city || pet?.doggy_soul_answers?.city || '',
    dob: pet?.dob || pet?.doggy_soul_answers?.dob || '',
  });
  
  const handleSave = () => onSave(data);
  
  return (
    <EditorWrapper title="Basic Details" onSave={handleSave} onCancel={onCancel} saving={saving}>
      <TextField 
        label="Name" 
        value={data.name}
        onChange={(v) => setData(prev => ({ ...prev, name: v }))}
        placeholder="Pet's name"
      />
      <TextField 
        label="Breed" 
        value={data.breed}
        onChange={(v) => setData(prev => ({ ...prev, breed: v }))}
        placeholder="e.g., Golden Retriever"
      />
      <TextField 
        label="Birthday" 
        type="date"
        value={data.dob}
        onChange={(v) => setData(prev => ({ ...prev, dob: v }))}
      />
      <SelectField 
        label="Gender" 
        value={data.gender} 
        options={['Male', 'Female']}
        onChange={(v) => setData(prev => ({ ...prev, gender: v }))}
      />
      <TextField 
        label="City" 
        value={data.city}
        onChange={(v) => setData(prev => ({ ...prev, city: v }))}
        placeholder="Where does your pet live?"
      />
    </EditorWrapper>
  );
});

// Styles for all editors
export const editorStyles = `
  .mojo-editor-wrapper {
    background: rgba(26, 16, 37, 0.95);
    border-radius: 12px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    overflow: hidden;
    animation: slideIn 0.2s ease-out;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: rgba(139, 92, 246, 0.1);
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  }
  
  .editor-title {
    font-size: 14px;
    font-weight: 600;
    color: #a78bfa;
  }
  
  .editor-actions {
    display: flex;
    gap: 8px;
  }
  
  .editor-cancel-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #9ca3af;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .editor-cancel-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .editor-save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    background: linear-gradient(135deg, #8B5CF6, #7C3AED);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .editor-save-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }
  
  .editor-save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .editor-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .editor-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .field-label {
    font-size: 12px;
    font-weight: 500;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .field-input, .field-select {
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: white;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .field-input:focus, .field-select:focus {
    outline: none;
    border-color: #8B5CF6;
    background: rgba(139, 92, 246, 0.1);
  }
  
  .field-select {
    cursor: pointer;
  }
  
  .field-select option {
    background: #1a1025;
    color: white;
  }
  
  /* Multi-select chips */
  .multi-select-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .multi-select-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #d1d5db;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .multi-select-chip:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.4);
  }
  
  .multi-select-chip.selected {
    background: rgba(139, 92, 246, 0.2);
    border-color: #8B5CF6;
    color: #a78bfa;
  }
  
  /* Tags input */
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(139, 92, 246, 0.2);
    min-height: 44px;
  }
  
  .tag-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 16px;
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    font-size: 13px;
  }
  
  .tag-chip button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #a78bfa;
    cursor: pointer;
    padding: 0;
  }
  
  .tag-chip button:hover {
    background: rgba(239, 68, 68, 0.3);
    color: #f87171;
  }
  
  .tag-input {
    flex: 1;
    min-width: 100px;
    padding: 4px;
    background: transparent;
    border: none;
    color: white;
    font-size: 13px;
    outline: none;
  }
  
  .tag-input::placeholder {
    color: #6b7280;
  }
  
  .tag-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  
  .suggestion-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed rgba(139, 92, 246, 0.3);
    color: #9ca3af;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .suggestion-chip:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: #8B5CF6;
    color: #a78bfa;
  }
`;

export default {
  SoulProfileEditor,
  HealthProfileEditor,
  DietProfileEditor,
  BehaviourProfileEditor,
  GroomingProfileEditor,
  RoutineProfileEditor,
  PreferencesProfileEditor,
  TimelineEventEditor,
  BasicDetailsEditor,
  editorStyles
};
