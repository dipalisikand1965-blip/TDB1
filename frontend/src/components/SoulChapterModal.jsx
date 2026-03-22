/**
 * SoulChapterModal.jsx
 * Shows chapter-specific answered data + unanswered questions
 * Allows inline answering with live score recalculation
 */
import { useState, useCallback } from "react";
import { Check, X, ChevronRight, Sparkles } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Map 6 dashboard chapters → backend folder keys + question definitions
const CHAPTER_FOLDERS = {
  identity: {
    folders: ["identity_temperament"],
    questions: [
      { id:"describe_3_words", label:"Personality", question:"How would you describe {name} in three words?", type:"text", weight:3 },
      { id:"general_nature", label:"Nature", question:"Is {name} generally:", type:"select", options:["Calm","Curious","Playful","Shy","Guarded","Fearful","Highly energetic"], weight:4 },
      { id:"stranger_reaction", label:"Stranger Reaction", question:"How does {name} react to strangers?", type:"select", options:["Friendly","Cautious","Indifferent","Nervous","Protective"], weight:3 },
      { id:"social_with_people", label:"People Comfort", question:"How comfortable is {name} with new people?", type:"select", options:["Very social - loves everyone","Friendly after warming up","Selective - only certain people","Shy with most people","Anxious around strangers"], weight:4 },
      { id:"loud_sounds", label:"Sound Sensitivity", question:"How does {name} react to loud sounds?", type:"select", options:["Completely fine","Mildly anxious","Very anxious","Needs comfort"], weight:4 },
      { id:"social_preference", label:"Social Preference", question:"Does {name} prefer:", type:"select", options:["Being around people","Being around other dogs","Being mostly with you","Being mostly independent"], weight:3 },
      { id:"handling_comfort", label:"Handling Comfort", question:"Is {name} comfortable being handled?", type:"select", options:["Very comfortable","Sometimes uncomfortable","Highly sensitive"], weight:3 },
      { id:"life_stage", label:"Life Stage", question:"What life stage is {name} in?", type:"select", options:["Puppy (0-1 year)","Young adult (1-3 years)","Adult (3-7 years)","Senior (7+ years)"], weight:5 },
    ],
  },
  behaviour: {
    folders: ["rhythm_routine", "home_comforts"],
    questions: [
      { id:"morning_routine", label:"Morning Routine", question:"What does {name}'s morning look like?", type:"select", options:["Early riser, ready to go","Slow starter, needs time to wake","Excited for breakfast first","Morning walk is priority"], weight:4 },
      { id:"feeding_times", label:"Feeding Times", question:"When do you feed {name}?", type:"select", options:["Once a day","Twice a day (morning & evening)","Three times a day","Free feeding / grazing"], weight:4 },
      { id:"exercise_needs", label:"Exercise Needs", question:"How much daily exercise does {name} need?", type:"select", options:["Light (15-30 mins)","Moderate (30-60 mins)","Active (1-2 hours)","Very active (2+ hours)"], weight:4 },
      { id:"walks_per_day", label:"Daily Walks", question:"How many walks per day?", type:"select", options:["1","2","3+"], weight:3 },
      { id:"energetic_time", label:"Peak Energy", question:"When is {name} most energetic?", type:"select", options:["Morning","Afternoon","Evening","Night"], weight:2 },
      { id:"sleep_location", label:"Sleep Spot", question:"Where does {name} usually sleep?", type:"select", options:["Your bed","Their own bed","Crate","Sofa / floor"], weight:2 },
      { id:"alone_comfort", label:"Alone Comfort", question:"Is {name} okay being left alone?", type:"select", options:["Yes, comfortably","Sometimes anxious","Not at all"], weight:4 },
      { id:"separation_anxiety", label:"Separation Anxiety", question:"Does {name} have separation anxiety?", type:"select", options:["No","Mild","Moderate","Severe"], weight:5 },
      { id:"favorite_spot", label:"Favourite Spot", question:"Where is {name}'s favourite spot at home?", type:"select", options:["On the couch/sofa","Their own bed","Sunny window spot","Near family members","Under furniture","Outdoors/garden"], weight:3 },
      { id:"favorite_item", label:"Favourite Item", question:"Does {name} have a favourite item?", type:"select", options:["Toy","Blanket","Bed","None"], weight:2 },
      { id:"space_preference", label:"Space Preference", question:"Does {name} prefer:", type:"select", options:["Quiet spaces","Busy spaces","Outdoor time","Indoor time"], weight:3 },
      { id:"crate_trained", label:"Crate Trained", question:"Is {name} crate-trained?", type:"select", options:["Yes","No","In training"], weight:4 },
      { id:"car_rides", label:"Car Rides", question:"Does {name} like car rides?", type:"select", options:["Loves them","Neutral","Anxious","Gets motion sickness"], weight:4 },
    ],
  },
  health: {
    folders: ["long_horizon"],
    questions: [
      { id:"health_conditions", label:"Health Conditions", question:"Does {name} have any health conditions?", type:"multi_select", options:["None","Arthritis","Diabetes","Heart condition","Skin allergies","Hip dysplasia","Eye problems","Other chronic condition"], weight:5 },
      { id:"vet_comfort", label:"Vet Comfort", question:"How comfortable is {name} at the vet?", type:"select", options:["Very comfortable - no issues","Slightly nervous but manageable","Anxious - needs extra handling","Very stressed - requires sedation"], weight:5 },
      { id:"grooming_tolerance", label:"Grooming", question:"How does {name} handle grooming?", type:"select", options:["Loves it","Tolerates it well","Gets anxious","Very difficult"], weight:4 },
      { id:"main_wish", label:"Your Wish", question:"What do you want most for {name}?", type:"multi_select", options:["Good health","More training","More travel experiences","More social time with other dogs"], weight:2 },
      { id:"help_needed", label:"Help Needed", question:"Would you like help with:", type:"multi_select", options:["Behaviour training","Travel planning","Grooming routines","Diet planning"], weight:2 },
      { id:"dream_life", label:"Dream Life", question:"What kind of life do you want {name} to have?", type:"text", weight:3 },
      { id:"celebration_preferences", label:"Celebrations", question:"Which celebrations for {name}?", type:"multi_select", options:["Birthday","Gotcha Day (Adoption Anniversary)","Diwali","Holi","Christmas","New Year","Valentine's Day"], weight:3 },
    ],
  },
  social: {
    folders: ["family_pack"],
    questions: [
      { id:"lives_with", label:"Lives With", question:"Does {name} live with:", type:"multi_select", options:["Adults only","Children","Other dogs","Other pets (cats, birds, etc.)"], weight:3 },
      { id:"kids_at_home", label:"Kids at Home", question:"Are there children in your household?", type:"select", options:["Yes, young children (0-5)","Yes, older children (6-12)","Yes, teenagers","No children"], weight:3 },
      { id:"other_pets", label:"Other Pets", question:"Other pets at home?", type:"select", options:["Yes, other dogs","Yes, cats","Yes, other animals","Multiple pets","No other pets"], weight:3 },
      { id:"behavior_with_dogs", label:"With Other Dogs", question:"How does {name} behave with other dogs?", type:"select", options:["Loves all dogs","Selective friends","Nervous","Reactive"], weight:4 },
      { id:"most_attached_to", label:"Most Attached To", question:"Who is {name} most attached to?", type:"select", options:["Me","Partner","Children","Everyone equally"], weight:2 },
      { id:"attention_seeking", label:"Attention Seeker", question:"Does {name} like being the centre of attention?", type:"select", options:["Yes","Sometimes","No"], weight:2 },
    ],
  },
  nutrition: {
    folders: ["taste_treat"],
    questions: [
      { id:"food_motivation", label:"Food Motivation", question:"How food-motivated is {name}?", type:"select", options:["Very - will do anything for food","Moderately food motivated","Somewhat interested","Not very food motivated"], weight:3 },
      { id:"favorite_protein", label:"Favourite Protein", question:"What is {name}'s favourite protein?", type:"select", options:["Chicken","Beef","Lamb","Fish","Pork","Vegetarian/Plant-based","No preference"], weight:3 },
      { id:"treat_preference", label:"Treat Type", question:"What treats does {name} prefer?", type:"select", options:["Soft/chewy treats","Crunchy treats","Freeze-dried","Fresh/real meat","Dental chews","Fruits/vegetables"], weight:3 },
      { id:"diet_type", label:"Diet Type", question:"Is {name}'s diet:", type:"select", options:["Vegetarian","Non-vegetarian","Mixed"], weight:4 },
      { id:"food_allergies", label:"Food Allergies", question:"Does {name} have food allergies?", type:"multi_select", options:["No","Chicken","Beef","Grains","Dairy","Other"], weight:5 },
      { id:"favorite_treats", label:"Favourite Treats", question:"What treats does {name} love?", type:"multi_select", options:["Biscuits","Jerky","Cakes","Homemade food","Fresh fruits"], weight:3 },
      { id:"sensitive_stomach", label:"Stomach Sensitivity", question:"Does {name} have a sensitive stomach?", type:"select", options:["Yes","No","Sometimes"], weight:4 },
    ],
  },
  learning: {
    folders: ["training_behaviour", "travel_style"],
    questions: [
      { id:"training_level", label:"Training Level", question:"Is {name} trained?", type:"select", options:["Fully trained","Partially trained","Not trained"], weight:3 },
      { id:"motivation_type", label:"Training Motivation", question:"What motivates {name} during training?", type:"select", options:["Treats/food","Praise and attention","Toys/play","A mix of everything"], weight:3 },
      { id:"behavior_issues", label:"Behaviour Issues", question:"Does {name} have behavioural issues?", type:"multi_select", options:["None","Excessive barking","Jumping on people","Pulling on leash","Resource guarding","Aggression","Fear-based issues","Destructive behavior"], weight:4 },
      { id:"training_response", label:"Training Response", question:"How does {name} respond to training?", type:"select", options:["Treats","Praise","Toys","Play"], weight:3 },
      { id:"leash_behavior", label:"Leash Behaviour", question:"Does {name} pull on the leash?", type:"select", options:["Always","Sometimes","Rarely"], weight:2 },
      { id:"barking", label:"Barking", question:"Does {name} bark often?", type:"select", options:["Yes","Occasionally","Rarely"], weight:2 },
      { id:"usual_travel", label:"Travel Mode", question:"How does {name} usually travel?", type:"select", options:["Car","Train","Flight (occasionally)","Never travels"], weight:3 },
      { id:"hotel_experience", label:"Hotel Experience", question:"Has {name} stayed in a hotel?", type:"select", options:["Yes, loved it","Yes, but was anxious","No"], weight:3 },
      { id:"stay_preference", label:"Stay Preference", question:"What stay suits {name}?", type:"select", options:["Quiet, nature hotel","Pet-friendly resort","City hotel","Homestay / villa"], weight:3 },
      { id:"travel_social", label:"Travel Social", question:"During stays, does {name} prefer:", type:"select", options:["Private spaces","Social pet areas"], weight:2 },
    ],
  },
};

// Format display value for answered questions
function formatValue(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const filtered = val.filter(v => v && v !== "None" && v !== "No");
    return filtered.length > 0 ? filtered.join(", ") : null;
  }
  return String(val);
}

export default function SoulChapterModal({ chapter, pet, token, onClose, onScoreUpdated }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [textInputs, setTextInputs] = useState({});
  const [totalPtsAdded, setTotalPtsAdded] = useState(0);

  if (!chapter || !pet) return null;

  const chapterConfig = CHAPTER_FOLDERS[chapter.id];
  if (!chapterConfig) return null;

  const soul = pet.doggy_soul_answers || {};
  const petName = pet.name || "your dog";

  // Split into answered and unanswered
  const allQuestions = chapterConfig.questions;
  const answeredQs = allQuestions.filter(q => {
    const val = soul[q.id];
    return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
  });
  const unansweredQs = allQuestions.filter(q => {
    if (submitted[q.id]) return false;
    const val = soul[q.id];
    return val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
  });

  const score = allQuestions.length > 0
    ? Math.round((answeredQs.length + Object.keys(submitted).length) / allQuestions.length * 100)
    : 0;

  const handleSelect = (qId, val, type) => {
    if (type === "multi_select") {
      setAnswers(prev => {
        const cur = prev[qId] || [];
        return { ...prev, [qId]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
      });
    } else {
      setAnswers(prev => ({ ...prev, [qId]: val }));
    }
  };

  const handleSubmit = async (q) => {
    const answer = q.type === "text" ? textInputs[q.id] : answers[q.id];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    setSubmitting(prev => ({ ...prev, [q.id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ question_id: q.id, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitted(prev => ({ ...prev, [q.id]: answer }));
        setTotalPtsAdded(prev => prev + (q.weight || 2));
        if (data.scores?.overall !== undefined && onScoreUpdated) {
          onScoreUpdated(data.scores.overall);
        }
        // Dispatch global score update event
        window.dispatchEvent(new CustomEvent("soulScoreUpdated", { detail: { petId: pet.id, score: data.scores?.overall } }));
      }
    } catch (err) {
      console.error("[SoulChapter submit]", err);
    } finally {
      setSubmitting(prev => ({ ...prev, [q.id]: false }));
    }
  };

  return (
    <div
      onClick={onClose}
      data-testid={`soul-chapter-modal-${chapter.id}`}
      style={{ position:"fixed", inset:0, zIndex:50001, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width:"min(680px,100%)", maxHeight:"90vh", overflowY:"auto", borderRadius:20, background:"#111016", border:`1.5px solid ${chapter.color}40`, boxShadow:`0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${chapter.color}15` }}
      >
        {/* Header */}
        <div style={{ padding:"20px 24px 16px", background:`linear-gradient(135deg, #111016 0%, ${chapter.color}12 100%)`, borderRadius:"20px 20px 0 0", position:"sticky", top:0, zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:24 }}>{chapter.emoji}</span>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:chapter.color }}>{chapter.label}</div>
                <div style={{ fontSize:11, color:"rgba(245,240,232,0.45)" }}>
                  {answeredQs.length + Object.keys(submitted).length}/{allQuestions.length} answered
                </div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:28, fontWeight:900, color: score >= 80 ? chapter.color : "rgba(245,240,232,0.6)" }}>{score}</span>
                <span style={{ fontSize:14, color:"rgba(245,240,232,0.3)" }}>%</span>
              </div>
              <button onClick={onClose} data-testid="soul-chapter-modal-close"
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(245,240,232,0.5)" }}>
                <X size={16} />
              </button>
            </div>
          </div>
          {/* Score bar */}
          <div style={{ height:4, borderRadius:999, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:999, background:chapter.color, width:`${score}%`, transition:"width 0.8s ease" }} />
          </div>
          {totalPtsAdded > 0 && (
            <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6, fontSize:11, color:chapter.color, fontWeight:600 }}>
              <Sparkles size={12} /> +{totalPtsAdded} pts added
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding:"16px 24px 24px" }}>

          {/* Answered questions — readable display */}
          {(answeredQs.length > 0 || Object.keys(submitted).length > 0) && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"rgba(245,240,232,0.3)", marginBottom:10 }}>
                What Mira knows
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                {answeredQs.map(q => {
                  const val = formatValue(soul[q.id]);
                  if (!val) return null;
                  return (
                    <div key={q.id} data-testid={`chapter-answer-${q.id}`}
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"10px 12px" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:chapter.color, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.05em" }}>{q.label}</div>
                      <div style={{ fontSize:13, color:"rgba(245,240,232,0.75)", lineHeight:1.4 }}>{val}</div>
                    </div>
                  );
                })}
                {/* Just-submitted answers */}
                {Object.entries(submitted).map(([qId, val]) => {
                  const q = allQuestions.find(x => x.id === qId);
                  return (
                    <div key={qId} data-testid={`chapter-answer-${qId}`}
                      style={{ background:`${chapter.color}10`, border:`1px solid ${chapter.color}30`, borderRadius:12, padding:"10px 12px" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:chapter.color, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.05em" }}>{q?.label || qId}</div>
                      <div style={{ fontSize:13, color:"rgba(245,240,232,0.75)", lineHeight:1.4, display:"flex", alignItems:"center", gap:4 }}>
                        <Check size={12} style={{ color:chapter.color }} />
                        {Array.isArray(val) ? val.join(", ") : String(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unanswered questions — interactive */}
          {unansweredQs.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"rgba(245,240,232,0.3)", marginBottom:10 }}>
                Tell Mira more
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {unansweredQs.map(q => {
                  const isSend = submitting[q.id];
                  const ans = q.type === "text" ? textInputs[q.id] : answers[q.id];
                  const hasAns = ans && (Array.isArray(ans) ? ans.length > 0 : ans !== "");

                  return (
                    <div key={q.id} data-testid={`chapter-question-${q.id}`}
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px 16px" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"rgba(245,240,232,0.8)", marginBottom:10, lineHeight:1.4 }}>
                        {q.question.replace(/{name}/g, petName)}
                      </div>

                      {q.type === "text" ? (
                        <input
                          type="text"
                          value={textInputs[q.id] || ""}
                          onChange={e => setTextInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder={`Type your answer...`}
                          data-testid={`chapter-input-${q.id}`}
                          style={{ width:"100%", padding:"8px 12px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(245,240,232,0.8)", fontSize:13, outline:"none" }}
                        />
                      ) : (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {(q.options || []).map(opt => {
                            const isSelected = q.type === "multi_select"
                              ? (answers[q.id] || []).includes(opt)
                              : answers[q.id] === opt;
                            return (
                              <button key={opt}
                                onClick={() => handleSelect(q.id, opt, q.type)}
                                data-testid={`chapter-opt-${q.id}-${opt.replace(/\s+/g,'-').toLowerCase()}`}
                                style={{
                                  padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer",
                                  border: isSelected ? `1.5px solid ${chapter.color}` : "1px solid rgba(255,255,255,0.1)",
                                  background: isSelected ? `${chapter.color}20` : "rgba(255,255,255,0.03)",
                                  color: isSelected ? chapter.color : "rgba(245,240,232,0.55)",
                                  transition: "all 0.15s",
                                }}>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Submit button */}
                      {hasAns && (
                        <button onClick={() => handleSubmit(q)} disabled={isSend}
                          data-testid={`chapter-submit-${q.id}`}
                          style={{
                            marginTop:10, display:"flex", alignItems:"center", gap:6,
                            padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
                            background: chapter.color, color:"#fff", border:"none", cursor:"pointer",
                            opacity: isSend ? 0.6 : 1, transition:"all 0.15s",
                          }}>
                          {isSend ? "Saving..." : <><Check size={12} /> Save answer</>}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All complete state */}
          {unansweredQs.length === 0 && answeredQs.length > 0 && Object.keys(submitted).length === 0 && (
            <div style={{ textAlign:"center", padding:"16px 0 8px" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{chapter.emoji}</div>
              <p style={{ fontSize:14, fontWeight:700, color:chapter.color, marginBottom:4 }}>
                {petName}'s {chapter.label.toLowerCase()} profile is complete
              </p>
              <p style={{ fontSize:12, color:"rgba(245,240,232,0.35)" }}>
                Mira uses this to personalise every recommendation
              </p>
            </div>
          )}

          {/* Link to full soul builder */}
          <button onClick={() => { onClose(); window.location.href = `/soul-builder?chapter=${chapter.id}`; }}
            data-testid="soul-chapter-full-builder-link"
            style={{ marginTop:16, width:"100%", padding:"10px", borderRadius:12, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(245,240,232,0.4)", fontSize:12, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.15s" }}>
            See full Soul Builder <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
