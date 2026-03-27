// useMiraTicket.js
// Fires a service desk ticket whenever Mira detects something important
// Import and call this from MiraChatWidget, useChatSubmit, and PillarAskMiraHero

import { API_URL } from '../../utils/api';

const CONCERN_TRIGGERS = {
  health:      ['infection','sick','fever','vomit','diarrhea','itch','wound','surgery','pain','limp','allergy','reaction','medication','vet'],
  behaviour:   ['anxious','aggressive','fearful','biting','barking','scared','nervous','destructive'],
  nutrition:   ['not eating','stopped eating','weight','diet','food','allergy','supplement','meal'],
  grief:       ['passed','died','loss','rainbow','miss','cremation','farewell'],
  milestone:   ['birthday','gotcha','anniversary','first','learned','graduated'],
  emergency:   ['emergency','urgent','help','poison','toxic','bleeding','accident','hurt badly'],
};

const EMERGENCY_URGENCY = 'critical';

export function detectConcernType(message) {
  if (!message) return null;
  const msg = message.toLowerCase();
  for (const [type, keywords] of Object.entries(CONCERN_TRIGGERS)) {
    if (keywords.some(k => msg.includes(k))) return type;
  }
  return null;
}

export async function fireMiraTicket({ pet, pillar, userMessage, miraResponse, concernType, token }) {
  if (!concernType || !pet?.id) return;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const urgency = concernType === 'emergency' ? EMERGENCY_URGENCY : 'normal';

    await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        parent_id: user?.id || user?.email || 'guest',
        pet_id: pet.id,
        pillar: pillar || 'care',
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
