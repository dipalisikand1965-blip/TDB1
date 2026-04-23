/**
 * GoNearMe.jsx — /go pillar
 * Find pet-friendly hotels, boarding kennels, pet taxis, vets abroad.
 * Mirrors CareNearMe.jsx pattern.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';
import { tdc } from '../../utils/tdc_intent';
import NearMeConciergeModal from '../common/NearMeConciergeModal';

const G = { teal:'#1ABC9C', deep:'#0E4D45', pale:'#F0FDFA', border:'rgba(26,188,156,0.2)', dark:'#0A2D2A', muted:'#475569' };

const SEARCH_TYPES = [
  { id:'hotel',    label:'Pet Hotels',  emoji:'🏨', query:'pet friendly hotel resort dog allowed' },
  { id:'boarding', label:'Boarding',    emoji:'🐾', query:'dog boarding kennel pet hotel' },
  { id:'walker',   label:'Dog Walker',  emoji:'🦮', query:'dog walker pet walking service' },
  { id:'taxi',     label:'Pet Taxi',    emoji:'🚖', query:'pet taxi dog transport animal transport' },
  { id:'airport',  label:'Travel Vet', emoji:'✈️', query:'travel certificate vet health certificate dog' },
  { id:'daycare',  label:'Day Care',   emoji:'☀️', query:'dog daycare pet daycare centre' },
  { id:'park',     label:'Dog Parks',  emoji:'🌿', query:'off leash dog park pet friendly park' },
  { id:'hydro',    label:'Hydrotherapy', emoji:'🏊', query:'dog hydrotherapy canine pool rehab physiotherapy' },
];

export default function GoNearMe({ currentPet, setConciergeToast }) {
  const { token } = useAuth();
  const [query,         setQuery]         = useState('');
  const [searchType,    setSearchType]    = useState('hotel');
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searched,      setSearched]      = useState(false);

  const petName = currentPet?.name  || 'your dog';
  const breed   = currentPet?.breed || '';

  const getMiraTip = () => {
    const s = SEARCH_TYPES.find(t => t.id === searchType);
    if (searchType === 'hotel')    return `When booking a pet-friendly hotel for ${petName}, confirm their pet weight/breed policy. Many hotels have size restrictions. Mira will verify for you.`;
    if (searchType === 'boarding') return `${breed ? `${breed}s` : 'Dogs'} in boarding need their vaccination records. Mira can prepare ${petName}'s health folder for the facility.`;
    if (searchType === 'taxi')     return `A safe pet taxi should have a secured carrier space and a calm driver. Ask if they've transported ${breed || 'dogs'} before.`;
    if (searchType === 'airport')  return `International travel requires a health certificate 10 days before departure. Mira handles all documentation for ${petName}.`;
    return `Mira knows what ${petName} needs for a great travel experience. Our Concierge® can vet (pun intended) any provider.`;
  };

  const doSearch = async () => {
    const loc = query.trim();
    if (!loc) return;
    setLoading(true);
    setSearched(true);
    try {
      const type = SEARCH_TYPES.find(t => t.id === searchType);
      const q = encodeURIComponent(`${type.query} ${loc}`);
      const resp = await fetch(`${API_URL}/api/places/care-providers?query=${q}&type=${searchType}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = resp.ok ? await resp.json() : { places: [] };
      setResults(data.places || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const bookViaConc = (place) => {
    tdc.book({ service:`${searchType} — ${place.name}`, pillar:'go', pet:currentPet, channel:'go_nearme' });
    setSelectedPlace(place);
  };

  return (
    <div style={{ padding:'16px' }}>
      {/* Mira tip */}
      <div style={{ background:G.dark, borderRadius:20, padding:'14px 16px', marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:G.teal, marginBottom:6 }}>
          ✦ MIRA ON {petName.toUpperCase()}'S TRAVEL
        </div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.85)', lineHeight:1.6 }}>{getMiraTip()}</div>
      </div>

      {/* Type grid — 3 cols × 2 rows, no horizontal scroll */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:14 }}>
        {SEARCH_TYPES.map(t => (
          <button key={t.id}
            onClick={() => { setSearchType(t.id); setResults([]); setSearched(false); }}
            style={{
              padding:'10px 6px', borderRadius:14, border:'none', cursor:'pointer',
              textAlign:'center', lineHeight:1.3,
              background: searchType === t.id ? G.teal : `${G.teal}15`,
              color:       searchType === t.id ? '#fff' : G.teal,
              transition:'all 0.2s',
            }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{t.emoji}</div>
            <div style={{ fontSize:11, fontWeight:600 }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder={`Search city or area…`}
          style={{
            flex:1, padding:'11px 16px', borderRadius:14, border:`1.5px solid ${G.border}`,
            fontSize:16, color:G.dark, background:'#fff', outline:'none',
          }}
        />
        <button onClick={doSearch}
          style={{ padding:'11px 18px', borderRadius:14, background:G.teal, border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
          Find
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div style={{ textAlign:'center', padding:'24px', color:G.teal, fontSize:14 }}>
          Finding {SEARCH_TYPES.find(t=>t.id===searchType)?.label.toLowerCase()} near you…
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign:'center', padding:'24px 0', color:G.muted, fontSize:14 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
          <div>No results found. Try a different city or let Concierge® search for you.</div>
          <button
            onClick={() => tdc.book({ service:`Go NearMe search for ${petName}`, pillar:'go', pet:currentPet, channel:'go_nearme_fallback' })}
            style={{ marginTop:12, padding:'10px 20px', borderRadius:14, background:G.teal, border:'none', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Ask Concierge® →
          </button>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {results.map((place, i) => (
            <div key={place.place_id || i}
              style={{ background:'#fff', borderRadius:16, border:`1px solid ${G.border}`, overflow:'hidden', boxShadow:'0 2px 8px rgba(26,188,156,0.08)' }}>
              {place.photo_url && (
                <img src={place.photo_url} alt={place.name} style={{ width:'100%', height:120, objectFit:'cover' }} />
              )}
              <div style={{ padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:G.dark, flex:1 }}>{place.name}</div>
                  {place.rating && (
                    <div style={{ fontSize:12, fontWeight:700, color:'#F59E0B', flexShrink:0, marginLeft:8 }}>
                      ★ {place.rating}
                    </div>
                  )}
                </div>
                {place.vicinity && (
                  <div style={{ fontSize:13, color:G.muted, marginBottom:8, lineHeight:1.4 }}>{place.vicinity}</div>
                )}
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {place.open_now !== undefined && (
                    <span style={{ fontSize:12, fontWeight:600, color: place.open_now ? '#22C55E' : '#EF4444' }}>
                      {place.open_now ? '● Open' : '● Closed'}
                    </span>
                  )}
                  <button onClick={() => bookViaConc(place)}
                    style={{ marginLeft:'auto', padding:'7px 16px', borderRadius:14, background:G.teal, border:'none', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                    Book via Concierge® →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPlace && (
        <NearMeConciergeModal
          place={selectedPlace}
          pet={currentPet}
          serviceType={searchType}
          onClose={() => setSelectedPlace(null)}
          accentColor={G.teal}
        />
      )}
    </div>
  );
}
