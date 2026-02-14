/**
 * MojoSectionEditors.jsx
 * 
 * Inline edit forms for each MOJO section.
 * Allows drill-in editing without leaving the modal.
 * 
 * AUTO-SAVE FEATURE:
 * - Changes are automatically saved after 1.5s of inactivity
 * - No manual "Save" button required
 * - Subtle indicator shows saving/saved status
 */

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { 
  Save, X, Plus, Trash2, Check, Loader2,
  Calendar, Upload, AlertCircle, CloudUpload
} from 'lucide-react';

// Custom hook for debounced auto-save
const useAutoSave = (data, onSave, delay = 1500) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const timeoutRef = useRef(null);
  const initialDataRef = useRef(null);
  const hasChangedRef = useRef(false);
  // Store onSave in a ref to avoid stale closure and dependency issues
  const onSaveRef = useRef(onSave);
  
  // Keep onSave ref updated
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);
  
  // Store initial data on first render
  useEffect(() => {
    if (initialDataRef.current === null) {
      initialDataRef.current = JSON.stringify(data);
    }
  }, []);
  
  // Check if data has changed from initial
  useEffect(() => {
    const currentData = JSON.stringify(data);
    const hasChanged = currentData !== initialDataRef.current;
    
    if (hasChanged && !hasChangedRef.current) {
      hasChangedRef.current = true;
    }
    
    // Only trigger auto-save if data has actually changed
    if (hasChanged && hasChangedRef.current) {
      setSaveStatus('pending');
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          // Use ref to get latest onSave function
          await onSaveRef.current(data);
          setSaveStatus('saved');
          initialDataRef.current = currentData; // Update baseline after successful save
          // Reset to idle after showing "saved" briefly
          setTimeout(() => setSaveStatus('idle'), 1500);
        } catch (err) {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      }, delay);
    }
    
    // Only clear timeout on data change, not on every render
    return () => {
      // Don't clear timeout here - let it run
    };
  }, [data, delay]); // Removed onSave from dependencies since we use ref
  
  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return saveStatus;
};

// Predefined options for dropdowns
const OPTIONS = {
  // Soul Profile
  temperament: ['Calm', 'Playful', 'Energetic', 'Anxious', 'Friendly', 'Shy', 'Independent', 'Affectionate'],
  energy_level: ['Low', 'Medium', 'High', 'Very High'],
  play_style: ['Fetch', 'Tug', 'Chase', 'Wrestling', 'Independent play', 'Puzzle toys', 'Water play'],
  social_with_dogs: ['Very friendly', 'Friendly', 'Selective', 'Nervous', 'Reactive', 'Prefers humans'],
  social_with_people: ['Loves everyone', 'Friendly', 'Shy at first', 'Selective', 'Nervous with strangers'],
  social_with_children: ['Great with kids', 'Good with supervision', 'Nervous around children', 'Not recommended', 'Unknown'],
  general_nature: ['Gentle', 'Protective', 'Curious', 'Laid-back', 'Alert', 'Mischievous'],
  anxiety_level: ['None', 'Mild', 'Moderate', 'Severe'],
  
  // Diet & Food
  diet_type: ['Dry kibble', 'Wet food', 'Raw diet', 'Home-cooked', 'Mixed', 'Prescription diet'],
  feeding_schedule: ['Once daily', 'Twice daily', 'Three times daily', 'Free feeding', 'Scheduled meals'],
  favorite_flavors: ['Chicken', 'Beef', 'Lamb', 'Fish', 'Duck', 'Turkey', 'Pork', 'Vegetarian'],
  portion_size: ['Small', 'Medium', 'Large', 'Extra Large', 'As per vet recommendation'],
  appetite_level: ['Picky eater', 'Normal', 'Always hungry', 'Varies'],
  digestive_health: ['No issues', 'Occasional upset', 'Sensitive stomach', 'Requires special diet'],
  
  // Behaviour & Training
  training_level: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Professional'],
  commands_known: ['Sit', 'Stay', 'Come', 'Down', 'Heel', 'Leave it', 'Drop it', 'Shake', 'Roll over', 'Fetch'],
  leash_behavior: ['Perfect heel', 'Walks well', 'Pulls sometimes', 'Pulls a lot', 'Reactive on leash'],
  behavioral_issues: ['None', 'Separation anxiety', 'Barking', 'Jumping', 'Leash reactivity', 'Food guarding', 'Fear-based'],
  training_style: ['Treat-motivated', 'Praise-motivated', 'Play-motivated', 'Clicker trained', 'Mixed'],
  response_to_correction: ['Very responsive', 'Responds well', 'Needs patience', 'Sensitive', 'Stubborn'],
  
  // Grooming & Care
  coat_type: ['Short', 'Medium', 'Long', 'Double coat', 'Wiry', 'Curly', 'Hairless'],
  grooming_frequency: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'As needed'],
  skin_sensitivity: ['Normal', 'Sensitive', 'Very sensitive', 'Allergies present'],
  bath_frequency: ['Weekly', 'Bi-weekly', 'Monthly', 'Every 2-3 months', 'As needed'],
  shedding_level: ['Minimal', 'Low', 'Moderate', 'Heavy', 'Seasonal'],
  nail_trim_frequency: ['Weekly', 'Bi-weekly', 'Monthly', 'Professional only', 'Self-wearing'],
  ear_care_needs: ['No special care', 'Regular cleaning', 'Prone to infections', 'Requires vet attention'],
  grooming_tolerance: ['Loves it', 'Tolerates well', 'Gets anxious', 'Needs muzzle', 'Sedation required'],
  
  // Routine
  walk_frequency: ['Multiple times daily', 'Twice daily', 'Once daily', 'Few times a week'],
  exercise_needs: ['Low (short walks)', 'Moderate (30-60 min)', 'High (1-2 hours)', 'Very high (2+ hours)'],
  sleep_pattern: ['Sleeps through night', 'Light sleeper', 'Naps frequently', 'Night owl', 'Early riser'],
  preferred_walk_time: ['Early morning', 'Mid-morning', 'Afternoon', 'Evening', 'Any time'],
  bathroom_schedule: ['Very regular', 'Somewhat regular', 'Unpredictable', 'Needs frequent breaks'],
  alone_time_comfort: ['Comfortable for hours', 'Ok for a few hours', 'Gets anxious', 'Cannot be left alone'],
  
  // Preferences & Constraints
  fear_triggers: ['Thunder', 'Fireworks', 'Vacuum', 'Strangers', 'Other dogs', 'Loud noises', 'Car rides', 'Vet visits'],
  likes: ['Belly rubs', 'Treats', 'Car rides', 'Swimming', 'Fetch', 'Cuddles', 'Running', 'Other dogs'],
  dislikes: ['Baths', 'Nail trimming', 'Loud noises', 'Being alone', 'Grooming', 'Strangers', 'Other dogs'],
  handling_comfort: ['Very comfortable', 'Mostly comfortable', 'Sensitive areas', 'Dislikes handling'],
  carrier_comfort: ['Loves it', 'Tolerates', 'Anxious', 'Won\'t use'],
  
  // Environment
  home_type: ['Apartment', 'House with yard', 'Farm/Rural', 'Condo', 'Other'],
  living_space: ['Small', 'Medium', 'Large', 'Very spacious'],
  family_structure: ['Single', 'Couple', 'Family with kids', 'Multi-generational', 'Roommates'],
  climate: ['Hot & Humid', 'Hot & Dry', 'Temperate', 'Cold', 'Variable'],
  travel_frequency: ['Rarely', 'Few times a year', 'Monthly', 'Frequently'],
  
  // Health
  vaccination_status: ['Up to date', 'Due soon', 'Overdue', 'Unknown'],
  insurance_status: ['Fully insured', 'Basic coverage', 'No insurance', 'Considering'],
  size_class: ['Toy (<4kg)', 'Small (4-10kg)', 'Medium (10-25kg)', 'Large (25-45kg)', 'Giant (>45kg)'],
  species: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'],
};

// Auto-save status indicator component
const AutoSaveIndicator = memo(({ status }) => {
  if (status === 'idle') return null;
  
  return (
    <div className={`auto-save-indicator ${status}`}>
      {status === 'pending' && (
        <>
          <div className="auto-save-dot pending" />
          <span>Unsaved changes</span>
        </>
      )}
      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3 h-3" />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3" />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
});

// Base Editor Wrapper Component - Now with auto-save indicator
const EditorWrapper = memo(({ title, onCancel, saveStatus, children }) => (
  <div className="mojo-editor-wrapper">
    <div className="editor-header">
      <span className="editor-title">Edit {title}</span>
      <div className="editor-actions">
        <AutoSaveIndicator status={saveStatus} />
        <button 
          className="editor-cancel-btn"
          onClick={onCancel}
          title="Done editing"
          data-testid="editor-done-btn"
        >
          <Check className="w-4 h-4" />
          <span>Done</span>
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

// Soul Profile Editor - With Auto-Save (ENHANCED for 100% MOJO)
export const SoulProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    temperament: pet?.doggy_soul_answers?.temperament || '',
    general_nature: pet?.doggy_soul_answers?.general_nature || '',
    energy_level: pet?.doggy_soul_answers?.energy_level || '',
    play_style: pet?.doggy_soul_answers?.play_style || [],
    social_with_dogs: pet?.doggy_soul_answers?.social_with_dogs || '',
    social_with_people: pet?.doggy_soul_answers?.social_with_people || '',
    social_with_children: pet?.doggy_soul_answers?.social_with_children || '',
    anxiety_level: pet?.doggy_soul_answers?.anxiety_level || '',
    confidence_level: pet?.doggy_soul_answers?.confidence_level || '',
    attention_needs: pet?.doggy_soul_answers?.attention_needs || '',
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Soul Profile" onCancel={onCancel} saveStatus={saveStatus}>
      <div className="editor-section-header">Personality</div>
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
      
      <div className="editor-section-header">Social Profile</div>
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
      <SelectField 
        label="With Children" 
        value={data.social_with_children} 
        options={OPTIONS.social_with_children}
        onChange={(v) => setData(prev => ({ ...prev, social_with_children: v }))}
      />
      
      <div className="editor-section-header">Emotional Profile</div>
      <SelectField 
        label="Anxiety Level" 
        value={data.anxiety_level} 
        options={OPTIONS.anxiety_level}
        onChange={(v) => setData(prev => ({ ...prev, anxiety_level: v }))}
      />
      <SelectField 
        label="Confidence Level" 
        value={data.confidence_level} 
        options={['Very confident', 'Confident', 'Moderate', 'Somewhat shy', 'Very shy']}
        onChange={(v) => setData(prev => ({ ...prev, confidence_level: v }))}
      />
      <SelectField 
        label="Attention Needs" 
        value={data.attention_needs} 
        options={['Independent', 'Moderate', 'Needs regular attention', 'Very needy', 'Velcro dog']}
        onChange={(v) => setData(prev => ({ ...prev, attention_needs: v }))}
      />
    </EditorWrapper>
  );
});

// Health Profile Editor - With Auto-Save (ENHANCED for 100% MOJO)
export const HealthProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    weight: pet?.doggy_soul_answers?.weight || '',
    size_class: pet?.doggy_soul_answers?.size_class || '',
    food_allergies: pet?.doggy_soul_answers?.food_allergies || [],
    spayed_neutered: pet?.doggy_soul_answers?.spayed_neutered || '',
    vaccination_status: pet?.doggy_soul_answers?.vaccination_status || '',
    medical_conditions: pet?.doggy_soul_answers?.medical_conditions || [],
    current_medications: pet?.doggy_soul_answers?.current_medications || [],
    vet_name: pet?.doggy_soul_answers?.vet_name || '',
    vet_clinic: pet?.doggy_soul_answers?.vet_clinic || '',
    vet_phone: pet?.doggy_soul_answers?.vet_phone || '',
    microchip_number: pet?.doggy_soul_answers?.microchip_number || '',
    insurance_provider: pet?.doggy_soul_answers?.insurance_provider || '',
    insurance_status: pet?.doggy_soul_answers?.insurance_status || '',
    emergency_contact: pet?.doggy_soul_answers?.emergency_contact || '',
    last_vet_visit: pet?.doggy_soul_answers?.last_vet_visit || '',
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Health Vault" onCancel={onCancel} saveStatus={saveStatus}>
      <div className="editor-section-header">Basic Health</div>
      <TextField 
        label="Current Weight" 
        value={data.weight}
        onChange={(v) => setData(prev => ({ ...prev, weight: v }))}
        placeholder="e.g., 12 kg or 25 lbs"
      />
      <SelectField 
        label="Size Class" 
        value={data.size_class} 
        options={OPTIONS.size_class}
        onChange={(v) => setData(prev => ({ ...prev, size_class: v }))}
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
        options={OPTIONS.vaccination_status}
        onChange={(v) => setData(prev => ({ ...prev, vaccination_status: v }))}
      />
      <TextField 
        label="Last Vet Visit" 
        type="date"
        value={data.last_vet_visit}
        onChange={(v) => setData(prev => ({ ...prev, last_vet_visit: v }))}
      />
      
      <div className="editor-section-header">Medical History</div>
      <TagsField 
        label="Allergies & Sensitivities" 
        value={data.food_allergies}
        onChange={(v) => setData(prev => ({ ...prev, food_allergies: v }))}
        suggestions={['Chicken', 'Beef', 'Wheat', 'Dairy', 'Soy', 'Corn', 'Eggs', 'Fish', 'Grass', 'Dust']}
      />
      <TagsField 
        label="Chronic Conditions" 
        value={data.medical_conditions}
        onChange={(v) => setData(prev => ({ ...prev, medical_conditions: v }))}
        suggestions={['Arthritis', 'Diabetes', 'Heart condition', 'Hip dysplasia', 'Epilepsy', 'Skin allergies', 'Thyroid', 'Kidney disease']}
      />
      <TagsField 
        label="Current Medications" 
        value={data.current_medications}
        onChange={(v) => setData(prev => ({ ...prev, current_medications: v }))}
        suggestions={['Apoquel', 'Rimadyl', 'Galliprant', 'Insulin', 'Thyroid meds', 'Heart meds', 'Supplements']}
      />
      
      <div className="editor-section-header">Vet & Emergency</div>
      <TextField 
        label="Vet's Name" 
        value={data.vet_name}
        onChange={(v) => setData(prev => ({ ...prev, vet_name: v }))}
        placeholder="Dr. Smith"
      />
      <TextField 
        label="Vet Clinic" 
        value={data.vet_clinic}
        onChange={(v) => setData(prev => ({ ...prev, vet_clinic: v }))}
        placeholder="Happy Paws Clinic"
      />
      <TextField 
        label="Vet Phone" 
        value={data.vet_phone}
        onChange={(v) => setData(prev => ({ ...prev, vet_phone: v }))}
        placeholder="+91 98765 43210"
      />
      <TextField 
        label="Emergency Contact" 
        value={data.emergency_contact}
        onChange={(v) => setData(prev => ({ ...prev, emergency_contact: v }))}
        placeholder="Name & phone for emergencies"
      />
      
      <div className="editor-section-header">Insurance & ID</div>
      <TextField 
        label="Microchip Number" 
        value={data.microchip_number}
        onChange={(v) => setData(prev => ({ ...prev, microchip_number: v }))}
        placeholder="15-digit microchip ID"
      />
      <TextField 
        label="Insurance Provider" 
        value={data.insurance_provider}
        onChange={(v) => setData(prev => ({ ...prev, insurance_provider: v }))}
        placeholder="e.g., Bajaj Allianz Pet Insurance"
      />
      <SelectField 
        label="Insurance Status" 
        value={data.insurance_status} 
        options={OPTIONS.insurance_status}
        onChange={(v) => setData(prev => ({ ...prev, insurance_status: v }))}
      />
    </EditorWrapper>
  );
});

// Diet & Food Editor - With Auto-Save (ENHANCED for 100% MOJO)
export const DietProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    diet_type: pet?.doggy_soul_answers?.diet_type || '',
    feeding_schedule: pet?.doggy_soul_answers?.feeding_schedule || '',
    favorite_flavors: pet?.doggy_soul_answers?.favorite_flavors || [],
    treat_preferences: pet?.doggy_soul_answers?.treat_preferences || [],
    food_brand: pet?.doggy_soul_answers?.food_brand || '',
    portion_size: pet?.doggy_soul_answers?.portion_size || '',
    appetite_level: pet?.doggy_soul_answers?.appetite_level || '',
    digestive_health: pet?.doggy_soul_answers?.digestive_health || '',
    foods_to_avoid: pet?.doggy_soul_answers?.foods_to_avoid || [],
    water_intake: pet?.doggy_soul_answers?.water_intake || '',
    food_motivation: pet?.doggy_soul_answers?.food_motivation || '',
    successful_foods: pet?.doggy_soul_answers?.successful_foods || [],
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Diet & Food" onCancel={onCancel} saveStatus={saveStatus}>
      <div className="editor-section-header">Current Diet</div>
      <SelectField 
        label="Diet Type" 
        value={data.diet_type} 
        options={OPTIONS.diet_type}
        onChange={(v) => setData(prev => ({ ...prev, diet_type: v }))}
      />
      <TextField 
        label="Current Food Brand" 
        value={data.food_brand}
        onChange={(v) => setData(prev => ({ ...prev, food_brand: v }))}
        placeholder="e.g., Royal Canin, Pedigree..."
      />
      <SelectField 
        label="Portion Size" 
        value={data.portion_size} 
        options={OPTIONS.portion_size}
        onChange={(v) => setData(prev => ({ ...prev, portion_size: v }))}
      />
      <SelectField 
        label="Feeding Schedule" 
        value={data.feeding_schedule} 
        options={OPTIONS.feeding_schedule}
        onChange={(v) => setData(prev => ({ ...prev, feeding_schedule: v }))}
      />
      
      <div className="editor-section-header">Preferences</div>
      <SelectField 
        label="Favorite Proteins" 
        value={data.favorite_flavors} 
        options={OPTIONS.favorite_flavors}
        onChange={(v) => setData(prev => ({ ...prev, favorite_flavors: v }))}
        multiple
      />
      <TagsField 
        label="Treat Preferences" 
        value={data.treat_preferences}
        onChange={(v) => setData(prev => ({ ...prev, treat_preferences: v }))}
        suggestions={['Dental chews', 'Training treats', 'Jerky', 'Biscuits', 'Freeze-dried', 'Natural chews', 'Fruits']}
      />
      <SelectField 
        label="Food Motivation" 
        value={data.food_motivation} 
        options={['Very high - will do anything', 'Moderately food driven', 'Somewhat interested', 'Not very food motivated']}
        onChange={(v) => setData(prev => ({ ...prev, food_motivation: v }))}
      />
      
      <div className="editor-section-header">Digestive Health</div>
      <SelectField 
        label="Appetite Level" 
        value={data.appetite_level} 
        options={OPTIONS.appetite_level}
        onChange={(v) => setData(prev => ({ ...prev, appetite_level: v }))}
      />
      <SelectField 
        label="Digestive Health" 
        value={data.digestive_health} 
        options={OPTIONS.digestive_health}
        onChange={(v) => setData(prev => ({ ...prev, digestive_health: v }))}
      />
      <TagsField 
        label="Foods to Avoid" 
        value={data.foods_to_avoid}
        onChange={(v) => setData(prev => ({ ...prev, foods_to_avoid: v }))}
        suggestions={['Chicken', 'Beef', 'Grains', 'Dairy', 'Rich foods', 'Fatty foods', 'Table scraps']}
      />
      <SelectField 
        label="Water Intake" 
        value={data.water_intake} 
        options={['Normal', 'Drinks a lot', 'Needs encouragement', 'Monitored due to health']}
        onChange={(v) => setData(prev => ({ ...prev, water_intake: v }))}
      />
      
      <div className="editor-section-header">Diet History</div>
      <TagsField 
        label="Foods That Worked Well" 
        value={data.successful_foods}
        onChange={(v) => setData(prev => ({ ...prev, successful_foods: v }))}
        suggestions={['Royal Canin', 'Hills Science', 'Orijen', 'Farmina', 'Home cooked rice & chicken', 'Raw diet']}
      />
    </EditorWrapper>
  );
});

// Behaviour & Training Editor - With Auto-Save (ENHANCED for 100% MOJO)
export const BehaviourProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    training_level: pet?.doggy_soul_answers?.training_level || '',
    commands_known: pet?.doggy_soul_answers?.commands_known || [],
    leash_behavior: pet?.doggy_soul_answers?.leash_behavior || '',
    behavioral_issues: pet?.doggy_soul_answers?.behavioral_issues || [],
    training_style: pet?.doggy_soul_answers?.training_style || '',
    response_to_correction: pet?.doggy_soul_answers?.response_to_correction || '',
    socialization_level: pet?.doggy_soul_answers?.socialization_level || '',
    training_history: pet?.doggy_soul_answers?.training_history || '',
    behavior_notes: pet?.doggy_soul_answers?.behavior_notes || '',
    working_on: pet?.doggy_soul_answers?.working_on || [],
    training_goals: pet?.doggy_soul_answers?.training_goals || [],
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Behaviour & Training" onCancel={onCancel} saveStatus={saveStatus}>
      <div className="editor-section-header">Training Status</div>
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
      <TextField 
        label="Training History" 
        value={data.training_history}
        onChange={(v) => setData(prev => ({ ...prev, training_history: v }))}
        placeholder="e.g., Puppy class at 3 months, private trainer..."
      />
      
      <div className="editor-section-header">Learning Style</div>
      <SelectField 
        label="Training Style" 
        value={data.training_style} 
        options={OPTIONS.training_style}
        onChange={(v) => setData(prev => ({ ...prev, training_style: v }))}
      />
      <SelectField 
        label="Response to Correction" 
        value={data.response_to_correction} 
        options={OPTIONS.response_to_correction}
        onChange={(v) => setData(prev => ({ ...prev, response_to_correction: v }))}
      />
      
      <div className="editor-section-header">Behaviour Profile</div>
      <SelectField 
        label="Leash Behavior" 
        value={data.leash_behavior} 
        options={OPTIONS.leash_behavior}
        onChange={(v) => setData(prev => ({ ...prev, leash_behavior: v }))}
      />
      <SelectField 
        label="Socialization Level" 
        value={data.socialization_level} 
        options={['Highly social', 'Moderately social', 'Selective', 'Prefers solitude', 'In training']}
        onChange={(v) => setData(prev => ({ ...prev, socialization_level: v }))}
      />
      <SelectField 
        label="Behavioral Challenges" 
        value={data.behavioral_issues} 
        options={OPTIONS.behavioral_issues}
        onChange={(v) => setData(prev => ({ ...prev, behavioral_issues: v }))}
        multiple
      />
      
      <div className="editor-section-header">Goals & Progress</div>
      <TagsField 
        label="Currently Working On" 
        value={data.working_on}
        onChange={(v) => setData(prev => ({ ...prev, working_on: v }))}
        suggestions={['Recall', 'Loose leash walking', 'Reactivity', 'Separation anxiety', 'Barking', 'Jumping', 'Impulse control']}
      />
      <TagsField 
        label="Training Goals" 
        value={data.training_goals}
        onChange={(v) => setData(prev => ({ ...prev, training_goals: v }))}
        suggestions={['CGC certification', 'Therapy dog', 'Off-leash reliability', 'Dog sports', 'Better manners']}
      />
      <TextField 
        label="Behaviour Notes" 
        value={data.behavior_notes}
        onChange={(v) => setData(prev => ({ ...prev, behavior_notes: v }))}
        placeholder="Any important behaviour observations..."
      />
    </EditorWrapper>
  );
});

// Grooming & Care Editor - With Auto-Save (ENHANCED for 100% MOJO)
export const GroomingProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    coat_type: pet?.doggy_soul_answers?.coat_type || '',
    grooming_frequency: pet?.doggy_soul_answers?.grooming_frequency || '',
    skin_sensitivity: pet?.doggy_soul_answers?.skin_sensitivity || '',
    bath_frequency: pet?.doggy_soul_answers?.bath_frequency || '',
    shedding_level: pet?.doggy_soul_answers?.shedding_level || '',
    nail_trim_frequency: pet?.doggy_soul_answers?.nail_trim_frequency || '',
    ear_care_needs: pet?.doggy_soul_answers?.ear_care_needs || '',
    grooming_tolerance: pet?.doggy_soul_answers?.grooming_tolerance || '',
    preferred_groomer: pet?.doggy_soul_answers?.preferred_groomer || '',
    grooming_notes: pet?.doggy_soul_answers?.grooming_notes || '',
    dental_care: pet?.doggy_soul_answers?.dental_care || '',
    coat_products: pet?.doggy_soul_answers?.coat_products || [],
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Grooming & Care" onCancel={onCancel} saveStatus={saveStatus}>
      <div className="editor-section-header">Coat & Skin</div>
      <SelectField 
        label="Coat Type" 
        value={data.coat_type} 
        options={OPTIONS.coat_type}
        onChange={(v) => setData(prev => ({ ...prev, coat_type: v }))}
      />
      <SelectField 
        label="Shedding Level" 
        value={data.shedding_level} 
        options={OPTIONS.shedding_level}
        onChange={(v) => setData(prev => ({ ...prev, shedding_level: v }))}
      />
      <SelectField 
        label="Skin Sensitivity" 
        value={data.skin_sensitivity} 
        options={OPTIONS.skin_sensitivity}
        onChange={(v) => setData(prev => ({ ...prev, skin_sensitivity: v }))}
      />
      <TagsField 
        label="Coat Products Used" 
        value={data.coat_products}
        onChange={(v) => setData(prev => ({ ...prev, coat_products: v }))}
        suggestions={['Oatmeal shampoo', 'Medicated shampoo', 'Conditioner', 'Detangler', 'Coat oil', 'Flea shampoo']}
      />
      
      <div className="editor-section-header">Grooming Schedule</div>
      <SelectField 
        label="Grooming Frequency" 
        value={data.grooming_frequency} 
        options={OPTIONS.grooming_frequency}
        onChange={(v) => setData(prev => ({ ...prev, grooming_frequency: v }))}
      />
      <SelectField 
        label="Bath Frequency" 
        value={data.bath_frequency} 
        options={OPTIONS.bath_frequency}
        onChange={(v) => setData(prev => ({ ...prev, bath_frequency: v }))}
      />
      <SelectField 
        label="Nail Trim Frequency" 
        value={data.nail_trim_frequency} 
        options={OPTIONS.nail_trim_frequency}
        onChange={(v) => setData(prev => ({ ...prev, nail_trim_frequency: v }))}
      />
      <SelectField 
        label="Ear Care Needs" 
        value={data.ear_care_needs} 
        options={OPTIONS.ear_care_needs}
        onChange={(v) => setData(prev => ({ ...prev, ear_care_needs: v }))}
      />
      
      <div className="editor-section-header">Grooming Experience</div>
      <SelectField 
        label="Grooming Tolerance" 
        value={data.grooming_tolerance} 
        options={OPTIONS.grooming_tolerance}
        onChange={(v) => setData(prev => ({ ...prev, grooming_tolerance: v }))}
      />
      <SelectField 
        label="Dental Care" 
        value={data.dental_care} 
        options={['Daily brushing', 'Weekly brushing', 'Dental chews only', 'Professional cleaning', 'None']}
        onChange={(v) => setData(prev => ({ ...prev, dental_care: v }))}
      />
      <TextField 
        label="Preferred Groomer/Salon" 
        value={data.preferred_groomer}
        onChange={(v) => setData(prev => ({ ...prev, preferred_groomer: v }))}
        placeholder="e.g., Happy Paws Grooming"
      />
      <TextField 
        label="Grooming Notes" 
        value={data.grooming_notes}
        onChange={(v) => setData(prev => ({ ...prev, grooming_notes: v }))}
        placeholder="Any special grooming requirements..."
      />
    </EditorWrapper>
  );
});

// Routine Tracker Editor - With Auto-Save (ENHANCED for 100% MOJO)
export const RoutineProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    walk_frequency: pet?.doggy_soul_answers?.walk_frequency || '',
    exercise_needs: pet?.doggy_soul_answers?.exercise_needs || '',
    sleep_pattern: pet?.doggy_soul_answers?.sleep_pattern || '',
    daily_routine: pet?.doggy_soul_answers?.daily_routine || '',
    preferred_walk_time: pet?.doggy_soul_answers?.preferred_walk_time || '',
    bathroom_schedule: pet?.doggy_soul_answers?.bathroom_schedule || '',
    alone_time_comfort: pet?.doggy_soul_answers?.alone_time_comfort || '',
    wake_time: pet?.doggy_soul_answers?.wake_time || '',
    bed_time: pet?.doggy_soul_answers?.bed_time || '',
    nap_habits: pet?.doggy_soul_answers?.nap_habits || '',
    activity_peaks: pet?.doggy_soul_answers?.activity_peaks || [],
    routine_flexibility: pet?.doggy_soul_answers?.routine_flexibility || '',
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Routine Tracker" onCancel={onCancel} saveStatus={saveStatus}>
      <div className="editor-section-header">Exercise & Walks</div>
      <SelectField 
        label="Walk Frequency" 
        value={data.walk_frequency} 
        options={OPTIONS.walk_frequency}
        onChange={(v) => setData(prev => ({ ...prev, walk_frequency: v }))}
      />
      <SelectField 
        label="Preferred Walk Time" 
        value={data.preferred_walk_time} 
        options={OPTIONS.preferred_walk_time}
        onChange={(v) => setData(prev => ({ ...prev, preferred_walk_time: v }))}
      />
      <SelectField 
        label="Exercise Needs" 
        value={data.exercise_needs} 
        options={OPTIONS.exercise_needs}
        onChange={(v) => setData(prev => ({ ...prev, exercise_needs: v }))}
      />
      <SelectField 
        label="Bathroom Schedule" 
        value={data.bathroom_schedule} 
        options={OPTIONS.bathroom_schedule}
        onChange={(v) => setData(prev => ({ ...prev, bathroom_schedule: v }))}
      />
      
      <div className="editor-section-header">Sleep & Rest</div>
      <SelectField 
        label="Sleep Pattern" 
        value={data.sleep_pattern} 
        options={OPTIONS.sleep_pattern}
        onChange={(v) => setData(prev => ({ ...prev, sleep_pattern: v }))}
      />
      <TextField 
        label="Usual Wake Time" 
        type="time"
        value={data.wake_time}
        onChange={(v) => setData(prev => ({ ...prev, wake_time: v }))}
      />
      <TextField 
        label="Usual Bed Time" 
        type="time"
        value={data.bed_time}
        onChange={(v) => setData(prev => ({ ...prev, bed_time: v }))}
      />
      <SelectField 
        label="Nap Habits" 
        value={data.nap_habits} 
        options={['Short naps throughout day', 'One long afternoon nap', 'Sleeps most of day', 'Rarely naps', 'Naps after meals']}
        onChange={(v) => setData(prev => ({ ...prev, nap_habits: v }))}
      />
      
      <div className="editor-section-header">Daily Rhythm</div>
      <SelectField 
        label="Activity Peaks" 
        value={data.activity_peaks} 
        options={['Early morning', 'Mid-morning', 'Noon', 'Afternoon', 'Evening', 'Night']}
        onChange={(v) => setData(prev => ({ ...prev, activity_peaks: v }))}
        multiple
      />
      <SelectField 
        label="Alone Time Comfort" 
        value={data.alone_time_comfort} 
        options={OPTIONS.alone_time_comfort}
        onChange={(v) => setData(prev => ({ ...prev, alone_time_comfort: v }))}
      />
      <SelectField 
        label="Routine Flexibility" 
        value={data.routine_flexibility} 
        options={['Very flexible', 'Somewhat flexible', 'Prefers routine', 'Strict routine needed']}
        onChange={(v) => setData(prev => ({ ...prev, routine_flexibility: v }))}
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

// Preferences & Constraints Editor - With Auto-Save (ENHANCED for 100% MOJO)
export const PreferencesProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    likes: pet?.doggy_soul_answers?.likes || [],
    dislikes: pet?.doggy_soul_answers?.dislikes || [],
    fear_triggers: pet?.doggy_soul_answers?.fear_triggers || [],
    special_needs: pet?.doggy_soul_answers?.special_needs || [],
    handling_comfort: pet?.doggy_soul_answers?.handling_comfort || '',
    carrier_comfort: pet?.doggy_soul_answers?.carrier_comfort || '',
    sensitive_areas: pet?.doggy_soul_answers?.sensitive_areas || [],
    comfort_items: pet?.doggy_soul_answers?.comfort_items || [],
    calming_techniques: pet?.doggy_soul_answers?.calming_techniques || [],
    care_constraints: pet?.doggy_soul_answers?.care_constraints || [],
    service_restrictions: pet?.doggy_soul_answers?.service_restrictions || [],
    parent_preferences: pet?.doggy_soul_answers?.parent_preferences || '',
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Preferences & Constraints" onCancel={onCancel} saveStatus={saveStatus}>
      <div className="editor-section-header">Likes & Dislikes</div>
      <SelectField 
        label="Things They Love" 
        value={data.likes} 
        options={OPTIONS.likes}
        onChange={(v) => setData(prev => ({ ...prev, likes: v }))}
        multiple
      />
      <SelectField 
        label="Things They Dislike" 
        value={data.dislikes} 
        options={OPTIONS.dislikes}
        onChange={(v) => setData(prev => ({ ...prev, dislikes: v }))}
        multiple
      />
      <TagsField 
        label="Comfort Items" 
        value={data.comfort_items}
        onChange={(v) => setData(prev => ({ ...prev, comfort_items: v }))}
        suggestions={['Favorite toy', 'Blanket', 'Stuffed animal', 'Kong', 'Chew toy', 'T-shirt with owner scent']}
      />
      
      <div className="editor-section-header">Handling & Comfort</div>
      <SelectField 
        label="Handling Comfort" 
        value={data.handling_comfort} 
        options={OPTIONS.handling_comfort}
        onChange={(v) => setData(prev => ({ ...prev, handling_comfort: v }))}
      />
      <TagsField 
        label="Sensitive Areas (Avoid touching)" 
        value={data.sensitive_areas}
        onChange={(v) => setData(prev => ({ ...prev, sensitive_areas: v }))}
        suggestions={['Paws', 'Ears', 'Tail', 'Belly', 'Hind legs', 'Face', 'Mouth']}
      />
      <SelectField 
        label="Carrier/Crate Comfort" 
        value={data.carrier_comfort} 
        options={OPTIONS.carrier_comfort}
        onChange={(v) => setData(prev => ({ ...prev, carrier_comfort: v }))}
      />
      
      <div className="editor-section-header">Fears & Anxiety</div>
      <SelectField 
        label="Fear Triggers" 
        value={data.fear_triggers} 
        options={OPTIONS.fear_triggers}
        onChange={(v) => setData(prev => ({ ...prev, fear_triggers: v }))}
        multiple
      />
      <TagsField 
        label="Calming Techniques That Work" 
        value={data.calming_techniques}
        onChange={(v) => setData(prev => ({ ...prev, calming_techniques: v }))}
        suggestions={['Thundershirt', 'Calming treats', 'Music', 'Crate as safe space', 'Distraction with treats', 'Pressure wrap', 'Pheromone diffuser']}
      />
      
      <div className="editor-section-header">Care Requirements</div>
      <TagsField 
        label="Special Needs" 
        value={data.special_needs}
        onChange={(v) => setData(prev => ({ ...prev, special_needs: v }))}
        suggestions={['Mobility assistance', 'Visual impairment', 'Hearing impairment', 'Anxiety medication', 'Special diet', 'Frequent potty breaks']}
      />
      <TagsField 
        label="Care Constraints (Things to avoid)" 
        value={data.care_constraints}
        onChange={(v) => setData(prev => ({ ...prev, care_constraints: v }))}
        suggestions={['No male handlers', 'No loud environments', 'No group play', 'Needs individual attention', 'Cannot be crated', 'No off-leash']}
      />
      <TagsField 
        label="Service Restrictions" 
        value={data.service_restrictions}
        onChange={(v) => setData(prev => ({ ...prev, service_restrictions: v }))}
        suggestions={['No boarding', 'Day care only', 'Needs home environment', 'Cannot fly', 'Requires 1-on-1 grooming']}
      />
      <TextField 
        label="Pet Parent Preferences" 
        value={data.parent_preferences}
        onChange={(v) => setData(prev => ({ ...prev, parent_preferences: v }))}
        placeholder="Any specific preferences from the pet parent..."
      />
    </EditorWrapper>
  );
});

// Environment Profile Editor - NEW for 100% MOJO
export const EnvironmentProfileEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    city: pet?.city || pet?.doggy_soul_answers?.city || '',
    climate: pet?.doggy_soul_answers?.climate || '',
    home_type: pet?.doggy_soul_answers?.home_type || '',
    living_space: pet?.doggy_soul_answers?.living_space || '',
    family_structure: pet?.doggy_soul_answers?.family_structure || '',
    other_pets: pet?.doggy_soul_answers?.other_pets || '',
    other_pets_details: pet?.doggy_soul_answers?.other_pets_details || '',
    has_yard: pet?.doggy_soul_answers?.has_yard || '',
    neighborhood_type: pet?.doggy_soul_answers?.neighborhood_type || '',
    travel_frequency: pet?.doggy_soul_answers?.travel_frequency || '',
    seasonal_concerns: pet?.doggy_soul_answers?.seasonal_concerns || [],
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Environment" onCancel={onCancel} saveStatus={saveStatus}>
      <div className="editor-section-header">Location</div>
      <TextField 
        label="City" 
        value={data.city}
        onChange={(v) => setData(prev => ({ ...prev, city: v }))}
        placeholder="e.g., Mumbai, Bangalore"
      />
      <SelectField 
        label="Climate" 
        value={data.climate} 
        options={OPTIONS.climate}
        onChange={(v) => setData(prev => ({ ...prev, climate: v }))}
      />
      <SelectField 
        label="Neighborhood Type" 
        value={data.neighborhood_type} 
        options={['Urban/City', 'Suburban', 'Rural/Countryside', 'Beach area', 'Hill station']}
        onChange={(v) => setData(prev => ({ ...prev, neighborhood_type: v }))}
      />
      
      <div className="editor-section-header">Home</div>
      <SelectField 
        label="Home Type" 
        value={data.home_type} 
        options={OPTIONS.home_type}
        onChange={(v) => setData(prev => ({ ...prev, home_type: v }))}
      />
      <SelectField 
        label="Living Space" 
        value={data.living_space} 
        options={OPTIONS.living_space}
        onChange={(v) => setData(prev => ({ ...prev, living_space: v }))}
      />
      <SelectField 
        label="Has Yard/Garden" 
        value={data.has_yard} 
        options={['Yes - large', 'Yes - small', 'Balcony only', 'No outdoor space']}
        onChange={(v) => setData(prev => ({ ...prev, has_yard: v }))}
      />
      
      <div className="editor-section-header">Household</div>
      <SelectField 
        label="Family Structure" 
        value={data.family_structure} 
        options={OPTIONS.family_structure}
        onChange={(v) => setData(prev => ({ ...prev, family_structure: v }))}
      />
      <SelectField 
        label="Other Pets" 
        value={data.other_pets} 
        options={['No other pets', 'One other dog', 'Multiple dogs', 'Cat(s)', 'Other animals', 'Multiple species']}
        onChange={(v) => setData(prev => ({ ...prev, other_pets: v }))}
      />
      <TextField 
        label="Other Pets Details" 
        value={data.other_pets_details}
        onChange={(v) => setData(prev => ({ ...prev, other_pets_details: v }))}
        placeholder="Names, breeds, ages of other pets..."
      />
      
      <div className="editor-section-header">Lifestyle</div>
      <SelectField 
        label="Travel Frequency" 
        value={data.travel_frequency} 
        options={OPTIONS.travel_frequency}
        onChange={(v) => setData(prev => ({ ...prev, travel_frequency: v }))}
      />
      <TagsField 
        label="Seasonal Concerns" 
        value={data.seasonal_concerns}
        onChange={(v) => setData(prev => ({ ...prev, seasonal_concerns: v }))}
        suggestions={['Monsoon flooding', 'Summer heat', 'Winter cold', 'Pollution season', 'Fireworks (Diwali)', 'Tick season']}
      />
    </EditorWrapper>
  );
});

// Timeline Event Editor (Add new event) - With Auto-Save
export const TimelineEventEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    title: '',
    date: '',
    type: 'milestone',
    notes: '',
  });
  
  // Custom save handler for timeline (adds to array rather than replacing)
  const handleTimelineSave = useCallback(async (eventData) => {
    const existingTimeline = pet?.doggy_soul_answers?.timeline_events || [];
    const newEvent = {
      id: Date.now().toString(),
      ...eventData,
      created_at: new Date().toISOString()
    };
    await onSave({ timeline_events: [...existingTimeline, newEvent] });
  }, [pet, onSave]);
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, handleTimelineSave, 2000);
  
  return (
    <EditorWrapper title="Timeline Event" onCancel={onCancel} saveStatus={saveStatus}>
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

// Basic Details Editor (Photo, name, breed, etc) - With Auto-Save (ENHANCED for 100% MOJO)
export const BasicDetailsEditor = memo(({ pet, onSave, onCancel, saving }) => {
  const [data, setData] = useState({
    name: pet?.name || '',
    breed: pet?.breed || '',
    age_years: pet?.age_years || pet?.doggy_soul_answers?.age_years || '',
    gender: pet?.gender || pet?.doggy_soul_answers?.gender || '',
    city: pet?.city || pet?.doggy_soul_answers?.city || '',
    dob: pet?.dob || pet?.doggy_soul_answers?.dob || '',
    species: pet?.species || pet?.doggy_soul_answers?.species || 'Dog',
    size_class: pet?.doggy_soul_answers?.size_class || '',
    color_markings: pet?.doggy_soul_answers?.color_markings || '',
    adoption_date: pet?.doggy_soul_answers?.adoption_date || '',
  });
  
  // Use auto-save hook
  const saveStatus = useAutoSave(data, onSave, 1500);
  
  return (
    <EditorWrapper title="Basic Details" onCancel={onCancel} saveStatus={saveStatus}>
      <TextField 
        label="Name" 
        value={data.name}
        onChange={(v) => setData(prev => ({ ...prev, name: v }))}
        placeholder="Pet's name"
      />
      <SelectField 
        label="Species" 
        value={data.species} 
        options={OPTIONS.species}
        onChange={(v) => setData(prev => ({ ...prev, species: v }))}
      />
      <TextField 
        label="Breed" 
        value={data.breed}
        onChange={(v) => setData(prev => ({ ...prev, breed: v }))}
        placeholder="e.g., Golden Retriever"
      />
      <SelectField 
        label="Size Class" 
        value={data.size_class} 
        options={OPTIONS.size_class}
        onChange={(v) => setData(prev => ({ ...prev, size_class: v }))}
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
      <TextField 
        label="Color/Markings" 
        value={data.color_markings}
        onChange={(v) => setData(prev => ({ ...prev, color_markings: v }))}
        placeholder="e.g., Golden with white chest"
      />
      <TextField 
        label="Adoption/Gotcha Date" 
        type="date"
        value={data.adoption_date}
        onChange={(v) => setData(prev => ({ ...prev, adoption_date: v }))}
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
    align-items: center;
    gap: 12px;
  }
  
  /* Auto-save indicator styles */
  .auto-save-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 12px;
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .auto-save-indicator.pending {
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.1);
  }
  
  .auto-save-indicator.saving {
    color: #a78bfa;
    background: rgba(139, 92, 246, 0.1);
  }
  
  .auto-save-indicator.saved {
    color: #34d399;
    background: rgba(52, 211, 153, 0.1);
  }
  
  .auto-save-indicator.error {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
  }
  
  .auto-save-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  
  .auto-save-dot.pending {
    background: #fbbf24;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  
  .editor-cancel-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    background: rgba(52, 211, 153, 0.1);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.3);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .editor-cancel-btn:hover {
    background: rgba(52, 211, 153, 0.2);
    border-color: #34d399;
  }
  
  .editor-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  /* Section headers within editors */
  .editor-section-header {
    font-size: 11px;
    font-weight: 600;
    color: #8B5CF6;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 8px 0 4px;
    margin-top: 8px;
    border-top: 1px solid rgba(139, 92, 246, 0.15);
  }
  
  .editor-section-header:first-child {
    margin-top: 0;
    border-top: none;
    padding-top: 0;
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
  EnvironmentProfileEditor,
  TimelineEventEditor,
  BasicDetailsEditor,
  editorStyles
};
