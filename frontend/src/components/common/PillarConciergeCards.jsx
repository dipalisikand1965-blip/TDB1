import { useState } from 'react';
import ConciergeRequestBuilder from '../services/ConciergeRequestBuilder';

const PILLAR_CARDS = {
  care:      { color:'#40916C', intro:'Not sure what your dog needs? Start here.', cards:[
    { icon:'🪮', title:'Help me choose the right grooming products', sub:'Tell us your dog\'s coat and we\'ll shortlist what works.' },
    { icon:'📅', title:'Build a care routine for my dog',            sub:'A practical daily routine for your dog\'s age and lifestyle.' },
    { icon:'🧴', title:'Help me with coat and skin issues',          sub:'We\'ll recommend the right products for your dog\'s skin.' },
    { icon:'🐕', title:'Guide me for my senior dog',                 sub:'Comfort, mobility, feeding and support — all covered.' },
    { icon:'📍', title:'Find a groomer near me',                     sub:'We\'ll shortlist verified groomers in your area.' },
    { icon:'🦷', title:'Help me with dental and paw care',           sub:'The right tools and routine for teeth and paws.' },
    { icon:'💊', title:'Recommend supplements for my dog',           sub:'Based on breed, age and health — we\'ll guide you.' },
    { icon:'🏥', title:'Find a vet near me',                         sub:'Trusted vets near you, recommended by Mira.' },
  ]},
  dine:      { color:'#E76F51', intro:'Not sure what to feed your dog? Start here.', cards:[
    { icon:'🍖', title:'Help me choose the right food',              sub:'Tell us about your dog and we\'ll shortlist what suits them.' },
    { icon:'🍽️', title:'Build a meal plan for my dog',               sub:'A practical feeding routine for your dog\'s age and weight.' },
    { icon:'🐣', title:'Guide me for my puppy\'s nutrition',         sub:'From weaning to adult — we\'ll help you get it right.' },
    { icon:'⚠️', title:'Help me with allergies and sensitivities',   sub:'We\'ll identify triggers and find safe alternatives.' },
    { icon:'🦴', title:'Find healthy treat options',                  sub:'Safe, nutritious treats matched to your dog\'s profile.' },
    { icon:'⚖️', title:'Recommend portions for my dog\'s weight',    sub:'Right portions prevent obesity and underfeeding.' },
    { icon:'🥘', title:'Help me with a homemade diet',               sub:'Safe recipes and ingredient guides for home cooking.' },
    { icon:'👨‍⚕️', title:'Find a nutrition expert',                  sub:'Connect with a canine nutritionist near you.' },
  ]},
  celebrate: { color:'#9B59B6', intro:'Planning something special? Start here.', cards:[
    { icon:'🎂', title:'Plan my dog\'s birthday party',              sub:'We handle the cake, decor, guests and every detail.' },
    { icon:'🍰', title:'Help me choose a celebration cake',          sub:'Custom cakes from The Doggy Bakery — breed-specific.' },
    { icon:'📸', title:'Find a photographer for my dog',             sub:'Professional pet photographers near you.' },
    { icon:'📦', title:'Help me create a memory box',                sub:'A curated keepsake of your dog\'s best moments.' },
    { icon:'🎉', title:'Recommend party decorations',                sub:'Everything for a beautiful celebration.' },
    { icon:'🎁', title:'Build a custom gift for my dog',             sub:'Soul Made™ — personalised just for your breed.' },
    { icon:'📍', title:'Find a celebration venue near me',           sub:'Pet-friendly venues for parties and photoshoots.' },
    { icon:'🌟', title:'Plan a milestone celebration',               sub:'Gotcha day, adoption anniversary, recovery — we plan it.' },
  ]},
  go:        { color:'#0D9488', intro:'Planning a trip with your dog? Start here.', cards:[
    { icon:'✈️', title:'Help me prepare for travel',                 sub:'Build a travel checklist, products list and service support.' },
    { icon:'📋', title:'Help with airline paperwork',                sub:'Rules, approvals, crate sizing — all handled.' },
    { icon:'🏨', title:'Find pet-friendly stays near me',            sub:'Verified hotels and homestays that welcome dogs.' },
    { icon:'🚗', title:'Help me with car travel safety',             sub:'The right carrier, harness and comfort setup.' },
    { icon:'🎒', title:'Recommend a travel carrier',                 sub:'Matched to your dog\'s size and airline rules.' },
    { icon:'🏥', title:'Find emergency vet at destination',          sub:'Backup vet contacts before you leave.' },
    { icon:'🏡', title:'Find a boarding facility near me',           sub:'Trusted boarding while you\'re away.' },
    { icon:'🗺️', title:'Plan a road trip with my dog',               sub:'Route planning, stops and pet-safe destinations.' },
  ]},
  play:      { color:'#E76F51', intro:'Want to enrich your dog\'s play life? Start here.', cards:[
    { icon:'🎾', title:'Help me find the right toys',                sub:'Matched to breed, jaw strength and energy level.' },
    { icon:'🧩', title:'Build an enrichment routine',                sub:'30 minutes of mental enrichment changes everything.' },
    { icon:'🦮', title:'Find a dog walker near me',                  sub:'Trusted walkers in your area, verified by Mira.' },
    { icon:'🐾', title:'Help me plan playdates',                     sub:'We coordinate the right match for your dog\'s personality.' },
    { icon:'🌳', title:'Find a dog park near me',                    sub:'Off-leash parks and play spots near you.' },
    { icon:'💪', title:'Build a fitness plan for my dog',            sub:'Activities matched to energy, age and breed.' },
    { icon:'🏊', title:'Find a hydrotherapy centre',                 sub:'The best low-impact exercise for dogs.' },
    { icon:'🎯', title:'Recommend activities for my breed',          sub:'Breed-specific play and enrichment ideas.' },
  ]},
  learn:     { color:'#7C3AED', intro:'Need training or learning support? Start here.', cards:[
    { icon:'🏆', title:'Find the right trainer near me',             sub:'We match the right trainer to your dog\'s behaviour.' },
    { icon:'🦮', title:'Help me with pulling on leash',              sub:'The right technique and tools for your dog.' },
    { icon:'🐣', title:'Guide me for my puppy\'s training',          sub:'From day one — commands, socialisation and routine.' },
    { icon:'😰', title:'Help me with barking and anxiety',           sub:'We\'ll identify the cause and find the right support.' },
    { icon:'📅', title:'Build a training routine',                   sub:'A structured plan matched to your dog\'s pace.' },
    { icon:'🧠', title:'Recommend enrichment activities',            sub:'Mental stimulation prevents boredom and behaviour issues.' },
    { icon:'🐕', title:'Help me with socialisation',                 sub:'Playdates, exposure and confidence building.' },
    { icon:'🎓', title:'Find an obedience class near me',            sub:'Group or private classes near you.' },
  ]},
  paperwork: { color:'#0D9488', intro:'Need help with documents or admin? Start here.', cards:[
    { icon:'📁', title:'Help me organise my dog\'s documents',       sub:'All records stored, indexed and accessible.' },
    { icon:'🪪', title:'Guide me through microchipping',             sub:'Requirements, registration and what to expect.' },
    { icon:'🛡️', title:'Help me with pet insurance',                 sub:'Which policy? What\'s covered? We simplify it.' },
    { icon:'📋', title:'Build my dog\'s health file',                sub:'Vaccinations, vet visits and medical history — sorted.' },
    { icon:'✈️', title:'Help me with travel documents',              sub:'Passports, health certificates and destination rules.' },
    { icon:'⚖️', title:'Find a legal advisor for pet matters',       sub:'Pet ownership laws and housing rights — plain language.' },
    { icon:'💉', title:'Help me with vaccination records',           sub:'Track, store and share vaccination history.' },
    { icon:'💰', title:'Recommend the right insurance plan',         sub:'Matched to your dog\'s breed, age and health.' },
  ]},
  emergency: { color:'#DC2626', intro:'Need urgent help? Start here.', cards:[
    { icon:'🚨', title:'Find an emergency vet now',                  sub:'Nearest 24-hour vet — we find, confirm and guide you.' },
    { icon:'🩺', title:'Help me with first aid guidance',            sub:'Step-by-step for accidents, wounds and sudden illness.' },
    { icon:'📦', title:'Build my emergency kit',                     sub:'Everything you need before an emergency happens.' },
    { icon:'☠️', title:'Help me with poisoning response',            sub:'Immediate steps for toxic ingestion.' },
    { icon:'📍', title:'Find a 24-hour vet near me',                 sub:'Emergency vets open right now near you.' },
    { icon:'🔍', title:'Help me if my dog is lost',                  sub:'Immediate protocol — posts, alerts, microchip tracing.' },
    { icon:'📞', title:'Build an emergency contact list',            sub:'Vet, backup vet, poison helpline — all saved.' },
    { icon:'🌙', title:'Get guidance on after-hours care',           sub:'What to do, whether to go now or wait.' },
  ]},
  farewell:  { color:'#6366F1', intro:'We hold every detail gently. Start here.', cards:[
    { icon:'🖼️', title:'Help me create a memory tribute',           sub:'Paw prints, portraits and keepsakes — crafted with love.' },
    { icon:'🕊️', title:'Guide me through end-of-life care',         sub:'Quality of life conversations and dignity planning.' },
    { icon:'🌿', title:'Help me arrange a cremation',                sub:'Collection, service and return of remains — with care.' },
    { icon:'🐾', title:'Create a paw print keepsake',                sub:'A permanent impression of your dog\'s paw.' },
    { icon:'💜', title:'Find grief counselling support',             sub:'Your grief is real — we connect you with the right support.' },
    { icon:'📖', title:'Help me write a memorial',                   sub:'A tribute as unique as they were.' },
    { icon:'📷', title:'Create a photo memory book',                 sub:'Their story in your words — kept forever.' },
    { icon:'🕯️', title:'Plan a farewell ceremony',                   sub:'A gentle send-off with readings, flowers and space to grieve.' },
  ]},
  adopt:     { color:'#D4537E', intro:'Every dog is adopted. Start your journey here.', cards:[
    { icon:'📚', title:'Help me choose the right breed',             sub:'Energy, size, temperament and lifestyle — Mira matches.' },
    { icon:'🏠', title:'Guide me through my first week',             sub:'From day one — settling in, routine and what to expect.' },
    { icon:'📦', title:'Build my new dog\'s starter kit',            sub:'Everything ready before they arrive home.' },
    { icon:'🐕', title:'Help me introduce a new dog to my home',     sub:'Safe introductions — to people, pets and spaces.' },
    { icon:'📍', title:'Find adoption support near me',              sub:'Rescues, breeders and street dog networks — verified.' },
    { icon:'📋', title:'Help me with adoption paperwork',            sub:'Forms, microchipping, registration — all handled.' },
    { icon:'❤️', title:'Guide me for a rescue dog settling in',      sub:'Patience, routine and the right products.' },
    { icon:'🐾', title:'Recommend what my breed needs',              sub:'Products, care tips and services based on breed.' },
  ]},
  shop:      { color:'#C9973A', intro:'Can\'t find what you need? Start here.', cards:[
    { icon:'🛍️', title:'Help me find the right products',           sub:'Tell us about your dog and we\'ll shortlist what suits them.' },
    { icon:'🐾', title:'Recommend what suits my breed',              sub:'Breed-specific products — not generic picks.' },
    { icon:'📋', title:'Build a starter shopping list',              sub:'Everything your dog needs — nothing unnecessary.' },
    { icon:'✦',  title:'Find Soul Made products for my dog',         sub:'Personalised bandanas, mugs, tags and more.' },
    { icon:'🔍', title:'Help me find a specific product',            sub:'Can\'t find it? We source it from any city.' },
    { icon:'🎁', title:'Recommend gifts for a dog parent',           sub:'The most thoughtful gifts for pet parents.' },
    { icon:'🎂', title:'Build a birthday shopping list',             sub:'Everything for a perfect celebration.' },
    { icon:'💌', title:'Tell us what you need — we find it',        sub:'Anything at all. We figure it out and get it done.' },
  ]},
  services:  { color:'#2563EB', intro:'Not sure where to start? Tell us what you need.', cards:[
    { icon:'🤝', title:'Help me choose the right service',           sub:'We match the right expert to your dog\'s needs.' },
    { icon:'📍', title:'Find an expert near me',                     sub:'Groomers, trainers, vets, stores — all near you.' },
    { icon:'📅', title:'Build a care plan for my dog',               sub:'A full year plan — health, grooming, training and more.' },
    { icon:'🚨', title:'Help me with an urgent need',                sub:'We respond within 2 hours. Emergency within 15 minutes.' },
    { icon:'🐾', title:'Recommend services for my breed',            sub:'Breed-specific service recommendations.' },
    { icon:'👨‍⚕️', title:'Find a specialist for my dog\'s issue',   sub:'The right expert for the specific problem.' },
    { icon:'💙', title:'Help me plan ongoing care',                  sub:'Reminders, check-ins and seasonal advice.' },
    { icon:'✍️', title:'Tell us what you need — we figure it out',  sub:'Anything at all. One message and it\'s arranged.' },
  ]},
};

export default function PillarConciergeCards({ pillar, pet, token, onSheetClose }) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [preselectedIntent, setPreselectedIntent] = useState('');
  const config = PILLAR_CARDS[pillar] || PILLAR_CARDS.services;
  const { color, intro, cards } = config;
  const petName = pet?.name || 'your dog';

  const handleCard = (card) => {
    setPreselectedIntent(card.title.replace('my dog', petName).replace('My dog', petName));
    // Close the parent sheet first, then open builder
    if (onSheetClose) onSheetClose();
    setBuilderOpen(true);
  };

  return (
    <>
      <div style={{ padding:'0 0 8px' }}>
        <div style={{ fontSize:14, color:'#6B7280', marginBottom:16, lineHeight:1.6, fontStyle:'italic' }}>
          {intro}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {cards.map((card, i) => (
            <button key={i} onClick={() => handleCard(card)}
              style={{ display:'flex', flexDirection:'column', alignItems:'flex-start',
                padding:'14px', borderRadius:16, cursor:'pointer', textAlign:'left',
                background: color + '12', border: '1.5px solid ' + color + '30',
                transition:'all 0.15s', width:'100%' }}>
              <span style={{ fontSize:20, marginBottom:8 }}>{card.icon}</span>
              <div style={{ fontSize:13, fontWeight:700, color:'#1A0A2E', lineHeight:1.3, marginBottom:6 }}>
                {card.title.replace('my dog', petName).replace('My dog', petName)}
              </div>
              <div style={{ fontSize:11, color:'#6B7280', lineHeight:1.4, marginBottom:10 }}>
                {card.sub.replace('your dog', petName)}
              </div>
              <div style={{
                marginTop: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: color,
                background: color + '15',
                borderRadius: 6,
                padding: '3px 8px',
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
                border: `1px solid ${color}30`,
              }}>
                C®
              </div>
            </button>
          ))}
        </div>
      </div>
      <ConciergeRequestBuilder
        pet={pet} token={token}
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        prefilledText={preselectedIntent}
      />
    </>
  );
}
