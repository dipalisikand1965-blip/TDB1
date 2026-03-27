// useMiraTicket.js
// Fires a service desk ticket whenever Mira detects something important
// Import and call this from MiraChatWidget, useChatSubmit, and PillarAskMiraHero

import { API_URL } from '../../utils/api';

const CONCERN_TRIGGERS = {
  // CARE pillar
  health:      ['infection','sick','fever','vomit','diarrhea','itch','wound',
                 'surgery','pain','limp','allergy','reaction','medication','vet',
                 'grooming','dental','coat','skin','supplement','wellness'],
  // DINE pillar
  nutrition:   ['not eating','stopped eating','weight','diet','food','meal',
                 'hungry','treats','feed','nutrition','recipe','allergy','supplement'],
  // CELEBRATE pillar
  celebration: ['party','celebrate','birthday','cake','venue','photographer',
                 'gotcha','anniversary','milestone','decoration','invite'],
  // LEARN pillar
  behaviour:   ['anxious','aggressive','fearful','biting','barking','scared',
                 'nervous','destructive','training','trick','command','pull','jump'],
  // GO pillar
  travel:      ['boarding','daycare','travel','trip','holiday','sitter','kennel',
                 'flight','hotel','pet friendly','cab','carry'],
  // PLAY pillar
  play:        ['walk','run','exercise','play','fetch','swim','park','energy',
                 'tired','lazy','active','playdate','toy'],
  // PAPERWORK pillar
  paperwork:   ['insurance','document','certificate','microchip','registration',
                 'passport','permit','legal','licence','tag','identity'],
  // FAREWELL pillar
  grief:       ['passed','died','loss','rainbow','miss','cremation','farewell',
                 'ashes','memorial','urn','grief','mourn'],
  // EMERGENCY pillar
  emergency:   ['emergency','urgent','poisoned','toxic','bleeding','accident',
                 'collapsed','unconscious','seizure','attack','choke','help now'],
  // ADOPT pillar
  adopt:       ['adopt','rescue','new dog','second dog','rehome','foster',
                 'shelter','breed','puppy','kitten'],
  // SHOP pillar
  shop:        ['buy','order','purchase','product','shop','delivery','stock',
                 'available','price','cost','recommend'],
  // SERVICES pillar
  services:    ['book','appointment','booking','reservation','schedule',
                 'concierge','arrange','service','groomer','trainer',
                 'vet appointment','session','slot','availability','provider'],
};

const CONCERN_TO_PILLAR = {
  health:      'care',
  nutrition:   'dine',
  celebration: 'celebrate',
  behaviour:   'learn',
  travel:      'go',
  play:        'play',
  paperwork:   'paperwork',
  grief:       'farewell',
  emergency:   'emergency',
  adopt:       'adopt',
  shop:        'shop',
  services:    'services',
};

// Priority order — emergency always wins
const PRIORITY_ORDER = [
  'emergency','grief','health','behaviour',
  'nutrition','celebration','travel','play',
  'paperwork','adopt','shop','services',
];

export function detectConcernType(message) {
  if (!message) return null;
  const msg = message.toLowerCase();
  for (const type of PRIORITY_ORDER) {
    const keywords = CONCERN_TRIGGERS[type] || [];
    if (keywords.some(k => msg.includes(k))) return type;
  }
  return null;
}

export async function fireMiraTicket({ pet, pillar, userMessage, miraResponse, concernType, token }) {
  if (!concernType || !pet?.id) return;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const urgency = concernType === 'emergency' ? 'critical' : 'normal';
    const resolvedPillar = CONCERN_TO_PILLAR[concernType] || pillar || 'care';

    await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        parent_id: user?.id || user?.email || 'guest',
        pet_id: pet.id,
        pillar: resolvedPillar,
        intent_primary: `mira_${concernType}_concern`,
        life_state: 'ACTIVE',
        urgency,
        channel: 'mira_chat_intelligence',
        initial_message: {
          sender: 'mira',
          text: `Mira detected: ${concernType} concern for ${pet.name} (${pet.breed || 'unknown breed'}).
User said: "${userMessage?.slice(0, 200)}"
Mira responded: "${miraResponse?.slice(0, 300)}"`,
        },
      }),
    });
  } catch (e) {
    console.debug('[MiraTicket] Silent fail:', e);
  }
}
