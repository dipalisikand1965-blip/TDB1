/**
 * celebrationPaths.js
 * 
 * All path data for the Guided Celebration Paths section.
 * Source: GuidedCelebrationPaths_MASTER.docx — ALL COPY IS FINAL.
 * 
 * {petName} is a placeholder replaced at render time.
 */

export const CELEBRATION_PATHS = [
  {
    id: 'birthday',
    icon: '🎂',
    title: 'Birthday party path',
    description: "{petName}'s full birthday, planned in one guided flow. From theme to cake to guest list.",
    bg: '#FEFCE8',
    accent: '#F59E0B',
    accentDark: '#92400E',
    accentAlpha15: 'rgba(245,158,11,0.15)',
    accentAlpha20: 'rgba(245,158,11,0.20)',
    accentAlpha12: 'rgba(245,158,11,0.12)',
    accentAlpha50: 'rgba(245,158,11,0.50)',
    miraBarBg: 'linear-gradient(135deg, #FFFBEB, #FEF9C3)',
    miraTextColor: '#92400E',
    miraLine: "Mojo's soul profile is already loaded into every step. The theme suggestions match who Mojo actually is.",
    miraByline: '♥ Mira knows Mojo',
    visibleSteps: ['Choose theme', 'Order cake', 'Guest list'],
    hiddenSteps: ['Plan the day', 'Final birthday plan'],
    expansionTitle: "Plan {petName}'s Birthday",
    expansionSubtitle: '5 steps. One complete birthday plan.',
    deliverableName: 'Birthday Plan',
    deliverableIcon: '🎂',
    deliverableSubtitle: 'Theme · Cake order · Guest list · Day timeline · All details confirmed',
    deliverableCtaText: 'Get my plan →',
    steps: [
      {
        id: 'theme',
        title: 'Choose a theme',
        description: "Mira prepared 6 themes matched to {petName}'s personality. The first one fits best.",
        ctaLabel: 'Choose a theme →',
        ctaType: 'picker',
        options: [
          { id: 'garden', label: '🌸 Garden Party', description: 'For the social butterfly' },
          { id: 'adventure', label: '🏕️ Outdoor Trail Party', description: 'For the adventurer' },
          { id: 'puzzle', label: '🧩 Puzzle Party', description: 'For the thinker' },
          { id: 'beach', label: '🏖️ Beach Day', description: 'For the free spirit' },
          { id: 'cosy', label: '🏠 Cosy Home Party', description: 'For the home lover' },
          { id: 'royal', label: '👑 Royal Banquet', description: 'For the dignified one' },
        ]
      },
      {
        id: 'cake',
        title: 'Order the cake',
        description: "Filtered by {petName}'s allergies. Salmon cake is shown first — that's the favourite. Everything here is soy-free.",
        ctaLabel: 'Add cake to plan →',
        ctaType: 'product',
        options: [
          { id: 'salmon', label: '🐟 Salmon & Pumpkin Cake', description: "Mojo's favourite • Soy-free • Grain-free", recommended: true },
          { id: 'chicken', label: '🍗 Chicken & Sweet Potato', description: 'Classic choice • Grain-free' },
          { id: 'veg', label: '🥕 Carrot & Banana', description: 'Purely vegetarian option' },
        ]
      },
      {
        id: 'guests',
        title: 'Build the guest list',
        description: "Who are {petName}'s friends? Add the dogs that should be there.",
        ctaLabel: 'Add guests →',
        ctaType: 'text_input',
        placeholder: 'e.g. Bruno, Cookie, Luna...',
        defaultValue: ''
      },
      {
        id: 'timeline',
        title: 'Plan the day',
        description: "Mira suggests a full-day timeline. Confirm or adjust it.",
        ctaLabel: 'Build the timeline →',
        ctaType: 'timeline',
        timeline: [
          { time: '9:00 AM', activity: 'Morning walk — {petName} starts the day right' },
          { time: '12:00 PM', activity: 'Lunch feast — special birthday meal' },
          { time: '3:00 PM', activity: 'Afternoon pawty — friends arrive' },
          { time: '6:00 PM', activity: 'Sunset photo — the shot to remember' },
        ]
      },
      {
        id: 'plan',
        title: 'Final birthday plan',
        description: 'Mira assembles everything into one complete plan. All selections, all details, all timings.',
        ctaLabel: 'Get my plan →',
        ctaType: 'deliverable'
      }
    ]
  },

  {
    id: 'gotcha',
    icon: '🏠',
    title: 'Gotcha day path',
    description: "Celebrate the day {petName} chose you. A quieter, more personal kind of celebration.",
    bg: '#DCFCE7',
    accent: '#16A34A',
    accentDark: '#14532D',
    accentAlpha15: 'rgba(22,163,74,0.15)',
    accentAlpha20: 'rgba(22,163,74,0.20)',
    accentAlpha12: 'rgba(22,163,74,0.12)',
    accentAlpha50: 'rgba(22,163,74,0.50)',
    miraBarBg: 'linear-gradient(135deg, #DCFCE7, #D1FAE5)',
    miraTextColor: '#14532D',
    miraLine: "The day {petName} came home is one of the most important days in both your stories. This path helps you honour it the way it deserves.",
    miraByline: '♥ Mira knows what this day means',
    visibleSteps: ['Find the date', 'Memory book', 'A quiet ritual'],
    hiddenSteps: ['A gift for the day', 'Gotcha Day card'],
    expansionTitle: "Celebrate the Day {petName} Chose You",
    expansionSubtitle: '5 steps. One memory card you will keep forever.',
    deliverableName: 'Gotcha Day Memory Card',
    deliverableIcon: '🏠',
    deliverableSubtitle: '3 photos · gotcha date · your caption · a quiet ritual',
    deliverableCtaText: 'Get my card →',
    steps: [
      {
        id: 'date',
        title: "Find the date",
        description: "When did {petName} come home? Enter the exact date and save it permanently to {petName}'s soul profile. Mira will remember it every year.",
        ctaLabel: "Save {petName}'s Gotcha Day →",
        ctaType: 'date_input'
      },
      {
        id: 'photos',
        title: 'Build the memory book',
        description: "Three moments. The day {petName} arrived. Your favourite moment together. {petName} today. Add one caption per photo.",
        ctaLabel: 'Add photos →',
        ctaType: 'photo_labels',
        photoSlots: [
          { id: 'arrival', label: 'The day they arrived', placeholder: 'What was the moment like?' },
          { id: 'favourite', label: 'Your favourite moment together', placeholder: 'The memory you carry...' },
          { id: 'today', label: '{petName} today', placeholder: 'How have they grown...' },
        ]
      },
      {
        id: 'ritual',
        title: 'Choose a quiet ritual',
        description: "Not a party — a moment. Mira's suggestions match how {petName} moves through the world.",
        ctaLabel: 'Choose a ritual →',
        ctaType: 'picker',
        options: [
          { id: 'walk', label: "🐾 {petName}'s favourite walk", description: 'Just the two of you' },
          { id: 'meal', label: '🍖 A special meal together', description: 'Their all-time favourite' },
          { id: 'letter', label: '✉️ Write a letter to {petName}', description: 'Something to keep' },
          { id: 'photo', label: '📷 A quiet photoshoot', description: 'Capture this year' },
        ]
      },
      {
        id: 'gift',
        title: 'A gift for the day',
        description: "One curated, soul-matched gift. Not a grid — Mira picks one thing that is exactly right.",
        ctaLabel: "See Mira's pick →",
        ctaType: 'product',
        options: [
          { id: 'memory_kit', label: '🎁 Soul Memory Kit', description: "Handcrafted for {petName}", recommended: true },
          { id: 'bandana', label: '🎀 Custom Name Bandana', description: "With {petName}'s name" },
          { id: 'toy', label: '🧸 Favourite Toy', description: 'Something they will love' },
        ]
      },
      {
        id: 'card',
        title: 'Gotcha Day Memory Card',
        description: 'Mira assembles the photos, the date, the ritual, and the gift into one beautiful memory card. Saveable. Shareable. Printable.',
        ctaLabel: 'Get my card →',
        ctaType: 'deliverable'
      }
    ]
  },

  {
    id: 'photoshoot',
    icon: '📸',
    title: 'Pet photoshoot path',
    description: "From outfit to location to photographer — capture {petName} at their most beautiful.",
    bg: '#FCE7F3',
    accent: '#DB2777',
    accentDark: '#831843',
    accentAlpha15: 'rgba(219,39,119,0.15)',
    accentAlpha20: 'rgba(219,39,119,0.20)',
    accentAlpha12: 'rgba(219,39,119,0.12)',
    accentAlpha50: 'rgba(219,39,119,0.50)',
    miraBarBg: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)',
    miraTextColor: '#831843',
    miraLine: "I know {petName}'s personality and how they move through the world. The location, outfit, and timing suggestions are all matched to who {petName} actually is.",
    miraByline: '♥ Mira knows Mojo',
    visibleSteps: ['Choose location', 'Plan outfit', 'Find photographer'],
    hiddenSteps: ['Prepare {petName}', 'Shoot Day Brief'],
    expansionTitle: "Capture {petName} at Their Most Beautiful",
    expansionSubtitle: '5 steps. One Shoot Day Brief for your Concierge®.',
    deliverableName: 'Shoot Day Brief',
    deliverableIcon: '📸',
    deliverableSubtitle: 'Location · Outfit · Photographer · Preparation notes',
    deliverableCtaText: 'Get my brief →',
    steps: [
      {
        id: 'location',
        title: 'Choose a location',
        description: "{petName} does best in open outdoor spaces. Filtered for their breed and energy level.",
        ctaLabel: 'Choose a location →',
        ctaType: 'picker',
        options: [
          { id: 'outdoor_park', label: '🌳 Outdoor Park', description: 'Open space, natural light' },
          { id: 'beach', label: '🏖️ Beach or lakeside', description: 'For the adventurous' },
          { id: 'cafe', label: '☕ Pet-friendly café', description: 'Cosy, warm setting' },
          { id: 'studio', label: '📷 Indoor studio', description: 'Controlled, professional' },
          { id: 'home', label: '🏠 At home', description: 'Where {petName} is most relaxed' },
        ]
      },
      {
        id: 'outfit',
        title: 'Plan the look',
        description: "Accessories, bandanas, and props matched to {petName}'s size and personality.",
        ctaLabel: 'Plan the look →',
        ctaType: 'picker',
        options: [
          { id: 'bandana_colourful', label: '🎨 Colourful bandana', description: 'For the social butterfly', recommended: true },
          { id: 'bow', label: '🎀 Soft bow + plush prop', description: 'For the gentle nurturer' },
          { id: 'hat_party', label: '🎩 Party hat + bow tie', description: 'For the dignified one' },
          { id: 'natural', label: '✨ Natural — no accessories', description: 'Just {petName}, as they are' },
        ]
      },
      {
        id: 'photographer',
        title: 'Find a photographer',
        description: "Pet photographers in your city. Filtered by rating, style, and price range.",
        ctaLabel: 'Find a photographer →',
        ctaType: 'photographer_list',
        options: [
          { id: 'ph1', label: '📸 Paws & Portraits', description: '4.9★ · Bengaluru · ₹2,500–4,000 · Outdoor specialist', recommended: true },
          { id: 'ph2', label: '📸 The Pet Lens', description: '4.8★ · Bengaluru · ₹1,800–3,000 · Studio + home' },
          { id: 'ph3', label: '📸 Golden Hour Pets', description: '4.7★ · Bengaluru · ₹3,000–5,000 · Natural light' },
        ]
      },
      {
        id: 'prepare',
        title: "Prepare {petName}",
        description: "Mira's shoot day tips for {petName}.",
        ctaLabel: 'Get {petName} ready →',
        ctaType: 'checklist',
        items: [
          { id: 'timing', label: 'Best time: mid-morning — energy is high but not overwhelming' },
          { id: 'treats', label: 'Bring {petName}\'s favourite high-value treats for focus' },
          { id: 'groom', label: 'Light grooming 1 day before (not day-of — hair needs to settle)' },
          { id: 'warmup', label: '15-minute walk before the session to release energy' },
          { id: 'familiar', label: 'Bring one familiar toy or blanket' },
        ]
      },
      {
        id: 'brief',
        title: 'Shoot Day Brief',
        description: "Location, timing, outfit, photographer, and {petName}'s preparation notes — all in one document. Hand it to the Concierge®.",
        ctaLabel: 'Get my brief →',
        ctaType: 'deliverable'
      }
    ]
  }
];
