/**
 * SoulMadeModal.jsx — Soul Made™ Custom Order
 * The Doggy Company
 *
 * Parent picks a real soul product from the pillar,
 * uploads their pet's photo, writes a message.
 * Concierge® reviews and prices it via WhatsApp.
 * No price shown. No payment now.
 *
 * Usage:
 *   <SoulMadeModal
 *     pet={currentPet}
 *     pillar="celebrate"
 *     pillarColor="#A855F7"
 *     pillarLabel="Celebration"
 *     onClose={() => setSoulMadeOpen(false)}
 *   />
 *
 * Drop in: /app/frontend/src/components/SoulMadeModal.jsx
 *
 * Add trigger button to every pillar page:
 *   <button onClick={() => setSoulMadeOpen(true)}>
 *     ✦ Soul Made™ — Make it personal
 *   </button>
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConcierge } from '../hooks/useConcierge';
import { API_URL } from '../utils/api';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const CSS = `
  .sm-opt {
    display:flex; align-items:center; gap:10px;
    padding:10px 14px; border-radius:12px;
    border:1.5px solid rgba(255,255,255,0.08);
    background:rgba(255,255,255,0.04);
    cursor:pointer; transition:all 0.15s;
    text-align:left; width:100%;
    font-family:'DM Sans',sans-serif;
    color:#F5F0E8;
  }
  .sm-opt:hover { background:rgba(255,255,255,0.08); }
  .sm-opt.sel { border-color:var(--sm-color); background:rgba(var(--sm-rgb),0.12); }
  .sm-upload {
    border:2px dashed rgba(201,151,58,0.3);
    border-radius:16px; padding:28px 20px;
    text-align:center; cursor:pointer;
    background:rgba(201,151,58,0.04);
    transition:all 0.2s;
  }
  .sm-upload:hover { border-color:rgba(201,151,58,0.6); background:rgba(201,151,58,0.08); }
  .sm-textarea {
    width:100%; min-height:90px;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:12px; padding:12px 14px;
    color:#F5F0E8; font-size:13px;
    font-family:'DM Sans',sans-serif;
    resize:none; outline:none; line-height:1.6;
    box-sizing:border-box;
  }
  .sm-textarea::placeholder { color:rgba(245,240,232,0.25); }
  .sm-textarea:focus { border-color:rgba(201,151,58,0.4); }
  @keyframes sm-slide { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes sm-fade  { from{opacity:0} to{opacity:1} }
  @keyframes sm-pts   {
    0%   { opacity:1; transform:translateX(-50%) translateY(0)   scale(1); }
    60%  { opacity:1; transform:translateX(-50%) translateY(-24px) scale(1.1); }
    100% { opacity:0; transform:translateX(-50%) translateY(-48px) scale(0.9); }
  }
`;

// Upload photo to Cloudinary via backend
async function uploadToCloudinary(file, token) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'tdc_custom_orders');

  try {
    // Try backend upload endpoint first
    const res = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      return data.url || data.secure_url || data.cloudinary_url;
    }
  } catch {}

  // Fallback: direct Cloudinary upload
  try {
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'thedoggycompany';
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      return data.secure_url;
    }
  } catch {}

  return null;
}

export default function SoulMadeModal({
  pet,
  pillar        = 'celebrate',
  pillarColor   = '#C9973A',
  pillarLabel   = 'Celebration',
  onClose,
}) {
  const { token } = useAuth();
  const { request, toast } = useConcierge({ pet, pillar });

  const [step,          setStep]         = useState(1);   // 1=product 2=photo 3=message 4=done
  const [products,      setProducts]     = useState([]);
  const [loadingProds,  setLoadingProds] = useState(true);
  const [selected,      setSelected]     = useState(null);
  const [photo,         setPhoto]        = useState(null); // { file, preview, url }
  const [uploading,     setUploading]    = useState(false);
  const [message,       setMessage]      = useState('');
  const [sending,       setSending]      = useState(false);
  const [showPts,       setShowPts]      = useState(false);

  const fileRef = useRef();

  const petName  = pet?.name  || 'your dog';
  const breed    = pet?.breed || '';
  const allergies = (() => {
    const soul = pet?.doggy_soul_answers || {};
    const raw  = soul.food_allergies || pet?.allergies || '';
    if (!raw || ['none','no','unknown'].includes(String(raw).toLowerCase())) return null;
    const items = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
    return items.map(a => a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ') || null;
  })();

  // ── Load real soul products for this pillar ───────────────────────────
  useEffect(() => {
    setLoadingProds(true);
    const breedParam = breed ? `&breed=${encodeURIComponent(breed.toLowerCase())}` : '';
    fetch(
      `${API_URL}/api/mockups/breed-products?pillar=${pillar}&limit=12${breedParam}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const prods = data?.products || data?.results || data || [];
        setProducts(Array.isArray(prods) ? prods.slice(0, 12) : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProds(false));
  }, [pillar, breed, token]);

  // ── Handle file select ────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhoto({ file, preview, url: null });
    setStep(3);
  }, []);

  // ── Upload photo ──────────────────────────────────────────────────────
  const uploadPhoto = useCallback(async () => {
    if (!photo?.file || photo.url) return photo?.url;
    setUploading(true);
    const url = await uploadToCloudinary(photo.file, token);
    setUploading(false);
    if (url) {
      setPhoto(prev => ({ ...prev, url }));
      return url;
    }
    return null;
  }, [photo, token]);

  // ── Send to Concierge ─────────────────────────────────────────────────
  const handleSend = async () => {
    if (!selected) return;
    setSending(true);

    // Upload photo if not done yet
    let photoUrl = photo?.url;
    if (photo?.file && !photoUrl) {
      photoUrl = await uploadPhoto();
    }

    const productName = selected.name || selected.product_name || 'Custom item';
    const allergyNote = allergies
      ? `⚠️ ALLERGY: No ${allergies} — critical`
      : 'No known allergies';

    const briefText =
      `Soul Made™ custom order for ${petName}\n` +
      `Product: ${productName}\n` +
      `Pillar: ${pillarLabel}\n` +
      `Breed: ${breed || 'not specified'}\n` +
      `${allergyNote}\n` +
      (photoUrl ? `Photo: ${photoUrl}\n` : 'No photo uploaded\n') +
      (message ? `Message: "${message}"\n` : '') +
      `\nPlease review, price this, and confirm via WhatsApp.`;

    await request(briefText, {
      channel:  `soul_made_${pillar}`,
      urgency:  'normal',
      metadata: {
        soul_made:    true,
        product_name: productName,
        product_id:   selected.id || selected._id,
        pillar,
        breed,
        photo_url:    photoUrl,
        message,
        allergies,
      },
    });

    setSending(false);
    setStep(4);

    // Points celebration
    setShowPts(true);
    setTimeout(() => setShowPts(false), 1500);
  };

  // ── RGB from hex for CSS var ──────────────────────────────────────────
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  };

  const canProceed = {
    1: !!selected,
    2: !!photo,
    3: true,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.72)',
        zIndex:2000,
        display:'flex', alignItems:'center',
        justifyContent:'center',
        animation:'sm-fade 0.2s ease',
        padding:'16px',
      }}
    >
      <style>{`${FONTS}${CSS}`}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:520,
          maxHeight:'85vh', overflowY:'auto',
          background:'#0F0A1E',
          borderRadius:24,
          border:`1px solid ${pillarColor}30`,
          animation:'sm-slide 0.3s cubic-bezier(0.16,1,0.3,1)',
          '--sm-color': pillarColor,
          '--sm-rgb': hexToRgb(pillarColor),
          fontFamily:"'DM Sans',sans-serif",
          position:'relative',
        }}
      >
        {/* Points pop */}
        {showPts && (
          <div style={{
            position:'fixed', top:'30%', left:'50%',
            background:pillarColor, color:'#0A0A0F',
            fontWeight:700, fontSize:18,
            padding:'8px 24px', borderRadius:999,
            animation:'sm-pts 1.2s ease forwards',
            pointerEvents:'none', zIndex:9999,
          }}>
            ✦ Sent to Concierge®!
          </div>
        )}

        {/* ── Header ── */}
        <div style={{
          padding:'20px 20px 16px',
          background:`linear-gradient(135deg,#0F0A1E,${pillarColor}15)`,
          borderBottom:`1px solid ${pillarColor}20`,
          position:'sticky', top:0, zIndex:10,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:pillarColor, letterSpacing:'0.14em', marginBottom:4 }}>
                SOUL MADE™ · {pillarLabel.toUpperCase()}
              </div>
              <div style={{
                fontFamily:"'Cormorant Garamond',Georgia,serif",
                fontSize:'1.5rem', fontWeight:300, color:'#F5F0E8',
              }}>
                Made for <em style={{ color:pillarColor }}>{petName}.</em>
              </div>
            </div>
            <button onClick={onClose} style={{
              width:32, height:32, borderRadius:'50%',
              background:'rgba(255,255,255,0.06)',
              border:'1px solid rgba(255,255,255,0.1)',
              color:'rgba(245,240,232,0.5)',
              cursor:'pointer', fontSize:16,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>✕</button>
          </div>

          {/* Step indicators */}
          {step < 4 && (
            <div style={{ display:'flex', gap:6 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{
                  height:3, flex:1, borderRadius:999,
                  background: s <= step ? pillarColor : 'rgba(255,255,255,0.1)',
                  transition:'all 0.3s ease',
                }}/>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding:'20px 20px 32px' }}>

          {/* ── STEP 1: Pick a product ── */}
          {step === 1 && (
            <>
              <div style={{ fontSize:12, fontWeight:600, color:'rgba(245,240,232,0.5)', marginBottom:14 }}>
                What would you like made for {petName}?
              </div>

              {loadingProds ? (
                <div style={{ textAlign:'center', padding:'32px', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
                  Loading {pillarLabel.toLowerCase()} products for {petName}…
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign:'center', padding:'32px', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
                  Our Concierge® team can make almost anything for {petName}.
                  <br/>Describe what you'd like below.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                  {products.map((p, i) => {
                    const name = p.name || p.product_name || `Item ${i+1}`;
                    const isSel = selected?.id === (p.id || p._id) || selected?.name === name;
                    return (
                      <button
                        key={i}
                        className={`sm-opt${isSel ? ' sel' : ''}`}
                        onClick={() => setSelected({ ...p, id: p.id || p._id, name })}
                      >
                        {/* Product image or emoji */}
                        <div style={{
                          width:44, height:44, borderRadius:10,
                          overflow:'hidden', flexShrink:0,
                          background:`${pillarColor}15`,
                          display:'flex', alignItems:'center',
                          justifyContent:'center',
                        }}>
                          {p.cloudinary_url || p.mockup_url || p.image_url ? (
                            <img
                              src={p.cloudinary_url || p.mockup_url || p.image_url}
                              alt={name}
                              style={{ width:'100%', height:'100%', objectFit:'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize:20 }}>🐾</span>
                          )}
                        </div>

                        <div style={{ flex:1, textAlign:'left' }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', marginBottom:2 }}>
                            {name}
                          </div>
                          {p.sub_category && (
                            <div style={{ fontSize:11, color:'rgba(245,240,232,0.4)' }}>
                              {p.sub_category.replace(/_/g,' ').replace(/-/g,' ')}
                            </div>
                          )}
                        </div>

                        {isSel && (
                          <div style={{
                            width:22, height:22, borderRadius:'50%',
                            background:pillarColor, flexShrink:0,
                            display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:11, color:'#fff',
                          }}>✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Something else option */}
              <button
                className={`sm-opt${selected?.id === 'custom' ? ' sel' : ''}`}
                onClick={() => setSelected({ id:'custom', name:'Something custom — I\'ll describe it' })}
                style={{ marginBottom: selected?.id === 'custom' ? 8 : 20 }}
              >
                <span style={{ fontSize:20 }}>✦</span>
                <span style={{ fontSize:13, fontWeight:600 }}>Something else — I'll describe it</span>
              </button>

              {/* Custom description textarea */}
              {selected?.id === 'custom' && (
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Describe what you'd like made for ${petName}... e.g. "A custom portrait on a mug with Mojo wearing a bow tie"`}
                  style={{
                    width:'100%', minHeight:100, padding:'14px', borderRadius:12,
                    border:`1px solid ${pillarColor}40`, background:'rgba(255,255,255,0.05)',
                    color:'#F5F0E8', fontSize:14, fontFamily:'inherit', resize:'vertical',
                    outline:'none', marginBottom:20, lineHeight:1.5,
                  }}
                  onFocus={e => e.target.style.borderColor = pillarColor}
                  onBlur={e => e.target.style.borderColor = `${pillarColor}40`}
                />
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!selected}
                style={{
                  width:'100%', padding:'14px', borderRadius:12, border:'none',
                  background: selected ? `linear-gradient(135deg,${pillarColor},${pillarColor}CC)` : 'rgba(255,255,255,0.06)',
                  color: selected ? '#fff' : 'rgba(245,240,232,0.3)',
                  fontSize:15, fontWeight:700,
                  cursor: selected ? 'pointer' : 'not-allowed',
                  fontFamily:'inherit', transition:'all 0.2s',
                }}
              >
                {selected ? `Next — add ${petName}'s photo →` : 'Pick a product first'}
              </button>
            </>
          )}

          {/* ── STEP 2: Upload photo ── */}
          {step === 2 && (
            <>
              <div style={{ fontSize:12, fontWeight:600, color:'rgba(245,240,232,0.5)', marginBottom:6 }}>
                Selected: <span style={{ color:pillarColor }}>{selected?.name}</span>
              </div>

              <div style={{ fontSize:12, fontWeight:600, color:'rgba(245,240,232,0.5)', marginBottom:14, marginTop:16 }}>
                Upload a photo of {petName}
              </div>

              {photo ? (
                <div style={{
                  borderRadius:16, overflow:'hidden',
                  border:`2px solid ${pillarColor}40`,
                  marginBottom:16, position:'relative',
                }}>
                  <img src={photo.preview} alt={petName}
                    style={{ width:'100%', maxHeight:260, objectFit:'cover', display:'block' }}/>
                  <button
                    onClick={() => { setPhoto(null); }}
                    style={{
                      position:'absolute', top:10, right:10,
                      background:'rgba(0,0,0,0.6)', border:'none',
                      color:'#fff', borderRadius:'50%',
                      width:28, height:28, cursor:'pointer', fontSize:14,
                    }}
                  >✕</button>
                </div>
              ) : (
                <div
                  className="sm-upload"
                  onClick={() => fileRef.current?.click()}
                  style={{ marginBottom:16 }}
                >
                  <div style={{ fontSize:36, marginBottom:10 }}>📸</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'rgba(245,240,232,0.7)', marginBottom:4 }}>
                    Tap to upload {petName}'s photo
                  </div>
                  <div style={{ fontSize:11, color:'rgba(245,240,232,0.3)' }}>
                    JPG, PNG · Max 10MB · The clearer the better
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display:'none' }}
                    onChange={e => handleFile(e.target.files?.[0])}
                  />
                </div>
              )}

              <div style={{
                background:'rgba(155,89,182,0.08)',
                border:'1px solid rgba(155,89,182,0.2)',
                borderRadius:12, padding:'12px 14px',
                fontSize:12, color:'rgba(245,240,232,0.6)',
                fontStyle:'italic', lineHeight:1.6,
                marginBottom:20,
                display:'flex', gap:8, alignItems:'flex-start',
              }}>
                <span style={{ flexShrink:0 }}>✦</span>
                <span>
                  {allergies
                    ? `I've noted ${petName}'s ${allergies} allergy — Concierge® will make sure nothing with ${allergies} is used.`
                    : `I know ${petName} well. Concierge® will create something perfect for ${pet?.gender === 'female' ? 'her' : pet?.gender === 'male' ? 'him' : 'them'}.`
                  }
                </span>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(1)} style={{
                  flex:1, padding:'13px', borderRadius:12,
                  border:'1px solid rgba(255,255,255,0.1)',
                  background:'rgba(255,255,255,0.04)',
                  color:'rgba(245,240,232,0.6)',
                  fontSize:14, cursor:'pointer', fontFamily:'inherit',
                }}>
                  ← Back
                </button>
                <button
                  onClick={() => photo ? setStep(3) : fileRef.current?.click()}
                  style={{
                    flex:2, padding:'13px', borderRadius:12, border:'none',
                    background:`linear-gradient(135deg,${pillarColor},${pillarColor}CC)`,
                    color:'#fff', fontSize:14, fontWeight:700,
                    cursor:'pointer', fontFamily:'inherit',
                  }}
                >
                  {photo ? 'Next — add your message →' : 'Choose a photo →'}
                </button>
              </div>

              {photo && (
                <button onClick={() => setStep(3)} style={{
                  width:'100%', marginTop:8, padding:'10px',
                  background:'none', border:'none',
                  color:'rgba(245,240,232,0.3)', fontSize:12,
                  cursor:'pointer', fontFamily:'inherit',
                }}>
                  Skip photo — continue without
                </button>
              )}
            </>
          )}

          {/* ── STEP 3: Message + send ── */}
          {step === 3 && (
            <>
              <div style={{ fontSize:12, fontWeight:600, color:'rgba(245,240,232,0.5)', marginBottom:4 }}>
                Selected: <span style={{ color:pillarColor }}>{selected?.name}</span>
              </div>
              {photo && (
                <div style={{ marginBottom:16, marginTop:12 }}>
                  <img src={photo.preview} alt={petName}
                    style={{ width:64, height:64, borderRadius:12, objectFit:'cover',
                      border:`2px solid ${pillarColor}40` }}/>
                </div>
              )}

              <div style={{ fontSize:12, fontWeight:600, color:'rgba(245,240,232,0.5)', marginBottom:8, marginTop:16 }}>
                Your message or brief (optional)
              </div>

              <textarea
                className="sm-textarea"
                placeholder={`e.g. "Happy 3rd birthday ${petName}! From your humans who love you to the moon 🐾"\n\nOr describe any special requests...`}
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ marginBottom:16 }}
              />

              {/* Allergy reminder */}
              {allergies && (
                <div style={{
                  background:'rgba(220,38,38,0.08)',
                  border:'1px solid rgba(220,38,38,0.2)',
                  borderRadius:10, padding:'10px 12px',
                  fontSize:12, color:'#FCA5A5',
                  marginBottom:16, display:'flex', gap:8,
                }}>
                  <span>⚠️</span>
                  <span>Mira has noted: <strong>No {allergies}</strong> — included in your brief to Concierge®.</span>
                </div>
              )}

              {/* What happens next */}
              <div style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:12, padding:'14px 16px',
                marginBottom:20, fontSize:12,
                color:'rgba(245,240,232,0.5)', lineHeight:1.8,
              }}>
                <div style={{ fontWeight:700, color:'rgba(245,240,232,0.7)', marginBottom:6 }}>
                  What happens next:
                </div>
                1. Concierge® reviews your request<br/>
                2. They'll confirm the price via WhatsApp within 2–4 hours<br/>
                3. You approve and pay — then they make it<br/>
                4. Delivered to your door 🐾
              </div>

              <button
                onClick={handleSend}
                disabled={sending || uploading}
                style={{
                  width:'100%', padding:'16px', borderRadius:14, border:'none',
                  background: sending
                    ? `${pillarColor}60`
                    : `linear-gradient(135deg,${pillarColor},${pillarColor}CC)`,
                  color:'#fff', fontSize:15, fontWeight:700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit', marginBottom:10,
                  transition:'all 0.2s',
                }}
              >
                {uploading ? 'Uploading photo…'
                 : sending  ? 'Sending to Concierge®…'
                 : `Send to Concierge® →`}
              </button>
              <div style={{ textAlign:'center', fontSize:11, color:'rgba(245,240,232,0.25)' }}>
                No payment now · Concierge® will WhatsApp you a price
              </div>

              <button onClick={() => setStep(2)} style={{
                width:'100%', marginTop:10, padding:'10px',
                background:'none', border:'none',
                color:'rgba(245,240,232,0.3)', fontSize:12,
                cursor:'pointer', fontFamily:'inherit',
              }}>
                ← Back
              </button>
            </>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 4 && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🌷</div>

              <div style={{
                fontFamily:"'Cormorant Garamond',Georgia,serif",
                fontSize:'1.6rem', fontWeight:300, color:'#F5F0E8',
                marginBottom:12, lineHeight:1.3,
              }}>
                Sent. <em style={{ color:pillarColor }}>Concierge® is on it.</em>
              </div>

              <p style={{ fontSize:13, color:'rgba(245,240,232,0.55)', lineHeight:1.7, marginBottom:24 }}>
                Your request for <strong style={{ color:'#F5F0E8' }}>{selected?.name}</strong> for {petName} has been received.
                Concierge® will review it and send you a price on WhatsApp within 2–4 hours.
              </p>

              {/* Glass orb */}
              <div style={{
                width:56, height:56, borderRadius:'50%', margin:'0 auto 16px',
                background:'radial-gradient(circle at 35% 35%,rgba(255,255,255,0.55) 0%,rgba(200,150,255,0.35) 35%,rgba(155,89,182,0.6) 65%,rgba(100,40,140,0.8) 100%)',
                boxShadow:'inset 0 -3px 8px rgba(0,0,0,0.25),inset 0 2px 4px rgba(255,255,255,0.6),0 4px 24px rgba(155,89,182,0.5)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, color:'rgba(255,255,255,0.95)',
                position:'relative',
              }}>
                ✦
              </div>

              <div style={{
                background:'rgba(155,89,182,0.08)',
                border:'1px solid rgba(155,89,182,0.2)',
                borderRadius:12, padding:'12px 14px',
                fontSize:12, fontStyle:'italic',
                color:'rgba(245,240,232,0.65)', lineHeight:1.6,
                marginBottom:24,
              }}>
                "I've briefed Concierge® on everything —
                {allergies ? ` including ${petName}'s ${allergies} allergy.` : ''}
                {' '}They'll make something {petName} will love. 🌷"
              </div>

              <button onClick={onClose} style={{
                width:'100%', padding:'14px', borderRadius:12, border:'none',
                background:`linear-gradient(135deg,${pillarColor},${pillarColor}CC)`,
                color:'#fff', fontSize:15, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
              }}>
                Back to {pillarLabel} →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
