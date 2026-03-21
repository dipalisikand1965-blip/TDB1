/**
 * CareNearMe.jsx — /care NearMe tab
 * Finds: groomers, vets, pet spas, dog walkers, daycare, boarding
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';
import { tdc } from '../../utils/tdc_intent';
import NearMeConciergeModal from '../common/NearMeConciergeModal';

const G = { forest:"#40916C", sage:"#52B788", paleGreen:"#F0FFF4", border:"rgba(64,145,108,0.2)" };

const SEARCH_TYPES = [
  { id:"groomer",  label:"Grooming",     emoji:"✂️",  query:"pet grooming salon dog groomer" },
  { id:"vet",      label:"Vet Clinic",   emoji:"🏥",  query:"veterinary clinic animal hospital" },
  { id:"spa",      label:"Pet Spa",      emoji:"🛁",  query:"pet spa wellness dog bath" },
  { id:"walker",   label:"Dog Walker",   emoji:"🦮",  query:"dog walker pet walking service" },
  { id:"daycare",  label:"Daycare",      emoji:"🐾",  query:"dog daycare pet daycare centre" },
  { id:"boarding", label:"Boarding",     emoji:"🏠",  query:"dog boarding kennel pet hotel" },
];

export default function CareNearMe({ currentPet, setConciergeToast }) {
  const { token } = useAuth();
  const [query,         setQuery]         = useState('');
  const [searchType,    setSearchType]    = useState('groomer');
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searched,      setSearched]      = useState(false);

  const petName  = currentPet?.name  || 'your dog';
  const breed    = currentPet?.breed || '';
  const soul     = currentPet?.doggy_soul_answers || {};
  const coatType = soul.coat_type || '';
  const groomingComfort = soul.grooming_comfort || '';

  // Mira's care tip based on soul profile
  const getMiraTip = () => {
    if (searchType === 'groomer') {
      if (coatType === 'long')   return `${petName} has a long coat — look for groomers who specialise in breed-specific cuts. Book every 4–6 weeks.`;
      if (coatType === 'double') return `${petName} has a double coat — needs a groomer experienced with deshedding. Avoid shaving.`;
      if (groomingComfort === 'anxious') return `${petName} gets anxious during grooming — ask for a calm, patient groomer. A first visit just for a treat and a sniff helps.`;
      if (breed === 'Poodle' || breed === 'Shih Tzu' || breed === 'Maltese') return `${breed} coats need professional grooming every 4–6 weeks. Make sure the groomer knows the breed standard.`;
    }
    if (searchType === 'vet') return `Regular wellness checks keep ${petName} healthy. Mira tracks your vet schedule and will remind you.`;
    if (searchType === 'daycare') return `${petName} ${soul.social_with_dogs === 'reactive' ? 'can be reactive with dogs — ask about small group or solo play options.' : 'loves other dogs — a good daycare will keep them stimulated all day.'}`;
    if (searchType === 'boarding') return `When choosing boarding for ${petName}, ask about their daily routine, staff ratio, and whether dogs sleep in individual spaces.`;
    return `Mira knows what ${petName} needs. Our Concierge® team can vet (pun intended) any provider before you book.`;
  };

  const handleSearch = async (customQuery) => {
    const q = customQuery || query.trim();
    if (!q) return;
    setLoading(true); setSearched(true);

    const type = SEARCH_TYPES.find(t => t.id === searchType);
    const fullQuery = `${type?.query || 'pet grooming'} ${q}`;

    tdc.search({ query: fullQuery, pillar: 'care', pet: currentPet, channel: 'care_nearme' });

    try {
      const res = await fetch(
        `${API_URL}/api/places/care-providers?city=${encodeURIComponent(city || searchCity || q)}&type=all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.places || []);
      }
    } catch { setResults([]); }
    setLoading(false);
  };

  return (
    <div style={{ padding: '16px 0' }}>

      {/* Mira tip */}
      <div style={{
        background: G.paleGreen, border: `1px solid ${G.border}`,
        borderRadius: 12, padding: '14px 16px', marginBottom: 20,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg,#9B59B6,#E91E8C)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 12,
          color: '#fff', flexShrink: 0,
        }}>✦</div>
        <div style={{ fontSize: 13, color: '#1B4332', lineHeight: 1.6, fontStyle: 'italic' }}>
          {getMiraTip()}
        </div>
      </div>

      {/* Search type pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {SEARCH_TYPES.map(t => (
          <button key={t.id} onClick={() => setSearchType(t.id)} style={{
            padding: '7px 14px', borderRadius: 999,
            border: `1.5px solid ${searchType === t.id ? G.forest : 'rgba(0,0,0,0.1)'}`,
            background: searchType === t.id ? G.forest : '#fff',
            color:      searchType === t.id ? '#fff' : '#475569',
            fontSize: 13, fontWeight: searchType === t.id ? 700 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Enter your city or area..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 12,
            border: `1.5px solid ${G.border}`,
            fontSize: 14, outline: 'none', color: '#1A1A2E',
          }}
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          style={{
            padding: '12px 20px', borderRadius: 12, border: 'none',
            background: loading || !query.trim() ? 'rgba(64,145,108,0.15)' : G.forest,
            color: loading || !query.trim() ? G.forest : '#fff',
            fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Searching...' : 'Find →'}
        </button>
      </div>

      {/* Quick cities */}
      {!searched && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata'].map(city => (
            <button key={city} onClick={() => { setQuery(city); handleSearch(city); }} style={{
              padding: '5px 12px', borderRadius: 999,
              border: `1px solid ${G.border}`,
              background: G.paleGreen, color: G.forest,
              fontSize: 12, cursor: 'pointer',
            }}>
              {city}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748B', fontSize: 14 }}>
          Finding {SEARCH_TYPES.find(t => t.id === searchType)?.label.toLowerCase()} near you...
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>
            No results found. Our Concierge® can find and vet the right provider for {petName}.
          </div>
          <button onClick={() => {
            tdc.request({
              text:    `Find ${SEARCH_TYPES.find(t=>t.id===searchType)?.label} near ${query} for ${petName}`,
              pillar:  'care',
              pet:     currentPet,
              channel: 'care_nearme_concierge',
            });
            if (setConciergeToast) setConciergeToast({
              visible: true, petName,
              serviceName: SEARCH_TYPES.find(t=>t.id===searchType)?.label,
              message: `Concierge® will find the best option for ${petName} and get back to you on WhatsApp.`,
            });
          }} style={{
            padding: '11px 24px', borderRadius: 999,
            border: `1px solid ${G.forest}`, background: '#fff',
            color: G.forest, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Ask Concierge® to find one →
          </button>
        </div>
      )}

      {/* Results */}
      {results.map((place, i) => (
        <div key={i}
          style={{
            background: '#fff', border: `1px solid ${G.border}`,
            borderRadius: 14, padding: '16px', marginBottom: 10,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G.forest; e.currentTarget.style.background = G.paleGreen; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = '#fff'; }}
          onClick={() => setSelectedPlace(place)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', marginBottom: 3 }}>
                {place.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                {place.formatted_address || place.vicinity}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {place.rating && (
                  <span style={{ fontSize: 11, color: G.forest, fontWeight: 600 }}>
                    ★ {place.rating} {place.user_ratings_total ? `(${place.user_ratings_total})` : ''}
                  </span>
                )}
                {place.opening_hours?.open_now !== undefined && (
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: place.opening_hours.open_now ? '#16A34A' : '#DC2626',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}/>
                    {place.opening_hours.open_now ? 'Open now' : 'Closed'}
                  </span>
                )}
                {place.formatted_phone_number && (
                  <a href={`tel:${place.formatted_phone_number}`}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: 11, color: G.forest, textDecoration: 'none', fontWeight: 600 }}>
                    📞 {place.formatted_phone_number}
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setSelectedPlace(place); }}
              style={{
                padding: '8px 16px', borderRadius: 20, border: 'none',
                background: G.forest, color: '#fff',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                flexShrink: 0, marginLeft: 12,
              }}
            >
              Book via Concierge →
            </button>
          </div>
        </div>
      ))}

      {/* Concierge Modal */}
      {selectedPlace && (
        <NearMeConciergeModal
          place={selectedPlace}
          pillar="care"
          pet={currentPet}
          onClose={() => setSelectedPlace(null)}
          setConciergeToast={setConciergeToast}
        />
      )}

    </div>
  );
}
