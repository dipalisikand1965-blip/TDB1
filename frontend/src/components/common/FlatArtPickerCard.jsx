import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getBlankTemplate } from '../../utils/blankTemplates';
import { useCart } from '../../context/CartContext';
import { X } from 'lucide-react';

const FLAT_ART_PRICES = {
  mug:499, bowl:599, travel_bowl:599, bandana:399, play_bandana:399,
  tote_bag:699, blanket:999, cushion_cover:799, frame:799, keychain:299,
  collar_tag:299, luggage_tag:299, id_tag:299, medical_alert_tag:299,
  party_hat:349, memorial_candle:599, pet_journal:449, milestone_book:449,
  training_log:449, pet_profile_book:449, medical_file:449, care_guide:449,
  learning_cards:449, adoption_folder:349, document_holder:349, passport_holder:349,
  vaccine_folder:349, breed_checklist:349, birthday_card:199, remembrance_card:199,
  playdate_card:199, emergency_card:199, treat_jar:499, food_container:499,
  feeding_mat:449, placemat:449, welcome_mat:449, lick_mat:449, enrichment_mat:449,
  car_seat_protector:449, cake_topper:299, birthday_cake:299, party_banner:449,
  room_sign:449, pouch:449, treat_pouch:449, grooming_pouch:449, emergency_pouch:449,
  travel_pouch:449, poop_bag_holder:449, rain_jacket:999, pet_robe:999,
  grooming_apron:999, breed_plush:549, activity_toy:549, personalized_toy:549,
  rope_toy:449, fetch_toy_set:449, personalized_lead:799, walking_set:799,
  training_kit:799, first_aid_kit:699, starter_kit:699, welcome_kit:699,
  keepsake_box:799, paw_print_kit:699, memorial_ornament:699, pet_towel:449, first_bed:999,
};

const variantLabel = (ill) => {
  const n = (ill?.name || '').toLowerCase();
  if (n.includes('ginger'))  return 'Ginger';
  if (n.includes('light'))   return 'Light';
  if (n.includes('dark'))    return 'Dark';
  if (n.includes('cream'))   return 'Cream';
  if (n.includes('natural')) return 'Natural';
  if (n.includes('patchy'))  return 'Patchy';
  if (n.includes('brindle')) return 'Brindle';
  if (n.includes('fawn'))    return 'Fawn';
  if (n.includes('black'))   return 'Black';
  const parts = (ill?.name || '').split('—').pop()?.trim() || '';
  return parts || 'Style 1';
};

/** Modal component rendered via portal */
function FlatArtModal({ product, illustrations, pet, pillar, onClose }) {
  const [selected, setSelected] = useState(null);
  const [added, setAdded]       = useState(false);
  const { addToCart }           = useCart();

  const petName   = pet?.name   || 'your pet';
  const breedName = (pet?.breed || '').replace(/_/g, ' ');
  const blankUrl  = getBlankTemplate(product.product_type);
  const price     = FLAT_ART_PRICES[product.product_type] || product.price || 499;
  const displayImg = selected
    ? (selected.mockup_url || selected.cloudinary_url)
    : blankUrl;

  const handleAdd = () => {
    if (!selected) return;
    const illUrl = selected.mockup_url || selected.cloudinary_url;
    const label  = variantLabel(selected);
    addToCart({
      id: `flat-art-flat_art_${product.product_type}-template`,
      name: `${product.name || product.product_type.replace(/_/g,' ')} — ${label}`,
      price,
      image: illUrl,
      image_url: blankUrl,
      product_type: `flat_art_${product.product_type}`,
      category: 'flat_art',
      soul_tier: 'flat_art',
      pillar,
      customDetails: {
        illustration_url: illUrl,
        variant: label,
        breed: pet?.breed,
        breed_display: breedName,
        pet_name: petName,
        note: `Flat Art · ${label} · Print on ${product.product_type.replace(/_/g,' ')}`,
      },
    }, null, label, 1);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1800);
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:99999,
        background:'rgba(0,0,0,0.65)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'#fff', borderRadius:20, width:'100%', maxWidth:460,
          maxHeight:'88vh', overflowY:'auto',
          boxShadow:'0 24px 80px rgba(0,0,0,0.25)',
          animation:'fadeInScale 0.2s ease',
        }}
      >
        <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 18px 0' }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#C9973A', textTransform:'uppercase', letterSpacing:'0.06em' }}>🐾 Flat Art</p>
            <h2 style={{ fontSize:17, fontWeight:800, color:'#1a1a1a', margin:'2px 0 0' }}>
              {product.name || product.product_type?.replace(/_/g,' ')}
            </h2>
          </div>
          <button onClick={onClose} style={{ background:'#f5f5f5', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Product image */}
        <div style={{ margin:'14px 18px 0', borderRadius:14, overflow:'hidden', background:'#FAFAFA', aspectRatio:'4/3', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img
            src={displayImg}
            alt={product.name}
            style={{ width:'100%', height:'100%', objectFit:'contain', padding:12, transition:'opacity 0.3s' }}
            onError={e => { e.target.src = blankUrl; }}
          />
        </div>

        {/* Subtitle */}
        <div style={{ padding:'10px 18px 0' }}>
          <p style={{ fontSize:12, color:'#888' }}>Custom flat art print · Made to order for {petName}</p>
          <p style={{ fontSize:18, fontWeight:800, color:'#1a1a1a', margin:'6px 0 0' }}>
            ₹{price.toLocaleString('en-IN')}
            <span style={{ fontSize:11, fontWeight:400, color:'#aaa', marginLeft:6 }}>Made to order</span>
          </p>
        </div>

        {/* Illustration picker */}
        {illustrations.length > 0 && (
          <div style={{ padding:'14px 18px 0' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
              Pick your illustration:
            </p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {illustrations.map((ill, i) => {
                const url = ill.mockup_url || ill.cloudinary_url;
                const isSel = selected?.id === ill.id;
                return (
                  <button key={ill.id || i}
                    onClick={() => setSelected(isSel ? null : ill)}
                    title={variantLabel(ill)}
                    data-testid={`flat-art-modal-variant-${i}`}
                    style={{
                      width:56, height:56, borderRadius:10, padding:0, background:'#f8f8f8',
                      border: isSel ? '2.5px solid #C9973A' : '2px solid #e5e5e5',
                      cursor:'pointer', overflow:'hidden', flexShrink:0,
                      transform: isSel ? 'scale(1.1)' : 'scale(1)', transition:'all 0.15s',
                      boxShadow: isSel ? '0 0 0 3px rgba(201,151,58,0.25)' : 'none',
                    }}
                  >
                    <img src={url} alt={variantLabel(ill)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                  </button>
                );
              })}
            </div>
            {selected ? (
              <p style={{ fontSize:11, color:'#C9973A', fontWeight:600, marginTop:8 }}>✓ {variantLabel(selected)} selected</p>
            ) : (
              <p style={{ fontSize:11, color:'#bbb', marginTop:8 }}>Tap an illustration to select it</p>
            )}
          </div>
        )}

        {/* Add to Cart */}
        <div style={{ padding:'14px 18px 20px' }}>
          <button
            onClick={handleAdd}
            disabled={!selected}
            data-testid="flat-art-modal-add-btn"
            style={{
              width:'100%', padding:'13px 0', borderRadius:12, border:'none',
              fontSize:14, fontWeight:700,
              cursor: selected ? 'pointer' : 'not-allowed',
              background: added ? '#E8F5E9' : selected ? 'linear-gradient(135deg,#C9973A,#E8B84B)' : '#f0f0f0',
              color: added ? '#2E7D32' : selected ? '#fff' : '#bbb',
              transition:'all 0.2s',
            }}
          >
            {added ? '✓ Added to Cart!' : selected ? `Add to Cart — ${variantLabel(selected)}` : 'Select an illustration above'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * FlatArtPickerCard — looks like a normal ProductCard, opens a modal on click.
 */
export default function FlatArtPickerCard({ product, illustrations = [], pet, pillar }) {
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState(null); // captured at click — stable ref

  const blankUrl = getBlankTemplate(product.product_type);
  const price    = FLAT_ART_PRICES[product.product_type] || product.price || 499;

  const handleOpen = () => {
    setModalProduct({ ...product }); // snapshot current product at click time
    setShowModal(true);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        style={{
          background:'#fff', borderRadius:16, overflow:'hidden', cursor:'pointer',
          boxShadow:'0 2px 10px rgba(0,0,0,0.07)',
          transition:'box-shadow 0.2s, transform 0.2s',
          display:'flex', flexDirection:'column',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform='translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.07)'; e.currentTarget.style.transform='translateY(0)'; }}
        data-testid={`flat-art-card-${product.id}`}
      >
        {/* Image */}
        <div style={{ position:'relative', aspectRatio:'1/1', background:'#FAFAFA', overflow:'hidden' }}>
          <img
            src={blankUrl}
            alt={product.name}
            style={{ width:'100%', height:'100%', objectFit:'contain', padding:8 }}
            onError={e => { e.target.src = blankUrl; }}
          />
          <div style={{
            position:'absolute', bottom:8, left:8,
            background:'rgba(0,0,0,0.65)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderRadius:999,
            padding:'3px 9px', fontSize:9, fontWeight:700, color:'#fff',
          }}>
            🐾 Flat Art
          </div>
          {illustrations.length > 0 && (
            <div style={{
              position:'absolute', top:8, right:8,
              background:'#C9973A', borderRadius:999,
              padding:'2px 8px', fontSize:9, fontWeight:700, color:'#fff',
            }}>
              {illustrations.length} styles
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding:'10px 12px 12px', flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', gap:6 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#1a1a1a', margin:0, lineHeight:1.3 }}>
            {product.name || product.product_type?.replace(/_/g,' ')}
          </p>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontSize:13, fontWeight:800, color:'#1a1a1a', margin:0 }}>₹{price.toLocaleString('en-IN')}</p>
            <button
              style={{
                background:'#FFF3E0', color:'#C9973A', border:'none',
                borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:700, cursor:'pointer',
              }}
            >
              Choose style →
            </button>
          </div>
        </div>
      </div>

      {showModal && modalProduct && (
        <FlatArtModal
          product={modalProduct}
          illustrations={illustrations}
          pet={pet}
          pillar={pillar}
          onClose={() => { setShowModal(false); setModalProduct(null); }}
        />
      )}
    </>
  );
}
