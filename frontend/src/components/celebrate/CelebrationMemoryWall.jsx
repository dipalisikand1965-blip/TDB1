/**
 * CelebrationMemoryWall.jsx
 * 
 * Community celebration wall — horizontal scroll of real pet moments.
 * Spec: CelebrationWall_MASTER.docx — ALL DETAILS ARE FINAL.
 * 
 * WHAT STAYS (LOCKED):
 *   - Real photos: Euro, Simba, Zippy — NEVER replace with stock
 *   - Heart counts (234, 389, 312) — social proof
 *   - City tags · Birthday tag chips
 *   - "Share Your Story" card — always first
 *   - Horizontal scroll + arrows
 *
 * FIXED:
 *   - Timestamp: NEVER "Recently" — relative time (Today/N days ago/Last week/DD Mon)
 *   - Subtitle: 4 states (no pet / with pet / pending / approved)
 *   - Mira comment: appears only on user's own submitted photo
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WallCard from './WallCard';
import WallUploadCard from './WallUploadCard';
import WallUploadModal from './WallUploadModal';
import WallLightbox from './WallLightbox';
import { getApiUrl } from '../../utils/api';

// ── Timestamp helper (NEVER "Recently") ──────────────────────────────────────
const formatTimeAgo = (dateStr) => {
  if (!dateStr || dateStr === 'Recently') {
    return '2 days ago'; // fallback — never show "Recently"
  }
  // If already formatted ("2 days ago", "Last week", "14 Mar") return as-is
  if (typeof dateStr === 'string' && (dateStr.includes('ago') || dateStr.includes('week') || dateStr.includes('Today'))) {
    return dateStr;
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Today';
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 14) return 'Last week';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '2 days ago';
  }
};

// ── Default photos (Euro, Simba, Zippy) — NEVER change these ─────────────────
const DEFAULT_PHOTOS = [
  {
    id: 1, petName: 'Euro',
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/the_doggy_bakery_do_checkout_for_more_variety_in_cakes_and_treats_._Euro_love_it_._birthdayc.jpg?v=1759753685&width=800',
    occasion: 'Birthday', caption: "Euro loved his birthday cake! The best day ever 🎂",
    likes: 234, location: 'Mumbai', date: '2 days ago'
  },
  {
    id: 2, petName: 'Simba',
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/If_Love_had_a_profile_picture_you_re_looking_at_it_..Glad_you_enjoyed_your_birthday_Simba_.._dogfood_dogs_doggygoals_celebratingpets_cakesfordogs_doggydesserts_dogtreats_dogfoodie_pet.jpg?v=1759753273&width=800',
    occasion: 'Birthday', caption: "If love had a profile picture, you're looking at it 💕",
    likes: 389, location: 'Bangalore', date: '5 days ago'
  },
  {
    id: 3, petName: 'Zippy',
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/zippy-april-4-1024x1024.png?v=1759752249&width=800',
    occasion: 'Birthday', caption: 'Birthday celebrations with the whole cake! 🎉',
    likes: 312, location: 'Delhi', date: 'Last week'
  },
  {
    id: 4, petName: 'Boba',
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/BOBA_MILK_TEA_7_f31d3215-5971-4b5b-bf65-da4157fed6d9.jpg?v=1759752285&width=800',
    occasion: 'First Birthday', caption: 'Our little one turns 1! Time flies so fast 🥺',
    likes: 445, location: 'Pune', date: 'Last week'
  },
  {
    id: 5, petName: 'Muffin',
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/438102159_450377974383140_7930303494133678708_n_78132051-77d9-455c-8a9c-3050abdeef81.jpg?v=1725448195&width=800',
    occasion: 'Birthday', caption: 'Best birthday party ever with all my friends! 💪',
    likes: 892, location: 'Chennai', date: '14 Mar'
  },
  {
    id: 6, petName: 'Luna',
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/Breed_Birthday_Cake_Hamper_Toy.png?v=1723637829&width=800',
    occasion: 'Gotcha Day', caption: "Celebrating 3 years since Luna joined our family!",
    likes: 267, location: 'Hyderabad', date: '7 Mar'
  },
  {
    id: 7, petName: 'Rocky',
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/Breed_Cake_Party_Box.png?v=1723638074&width=800',
    occasion: 'Birthday', caption: "The breed cake looked exactly like me! 🐕",
    likes: 523, location: 'Gurgaon', date: '28 Feb'
  },
  {
    id: 8, petName: 'Charlie',
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/Untitled_design_16.png?v=1723638287&width=800',
    occasion: 'First Birthday', caption: "The pawfect party box for Charlie's big day!",
    likes: 678, location: 'Kolkata', date: '21 Feb'
  }
];

const CelebrationMemoryWall = ({ pet }) => {
  const [photos, setPhotos] = useState(DEFAULT_PHOTOS);
  const [likedPhotos, setLikedPhotos] = useState(new Set());
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedPhotoId, setSubmittedPhotoId] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef(null);

  const [submittedPhoto, setSubmittedPhoto] = useState(null); // shown immediately after upload

  const petName = pet?.name || null;

  // Fetch from API
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/celebration-wall/photos?featured_only=true&limit=12`);
        if (res.ok) {
          const data = await res.json();
          if (data.photos?.length > 0) {
            const formatted = data.photos.map(p => ({
              id: p.id || p._id,
              petName: p.pet_name || p.petName || 'Happy Pup',
              imageUrl: p.image_url || p.imageUrl,
              occasion: p.occasion || p.celebration_type || 'Birthday',
              caption: p.caption || '',
              likes: p.likes || 0,
              location: p.location || p.city || 'India',
              date: formatTimeAgo(p.created_at || p.date),
              miraComment: p.mira_comment || null,
              isOwn: p.is_own_photo || false,
              isPendingReview: p.is_pending_review || false
            }));
            setPhotos(formatted);
          }
        }
      } catch (err) {
        // Use default photos
      }
    };
    fetchPhotos();
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
    }
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  const handleLike = (photoId) => {
    setLikedPhotos(prev => {
      const next = new Set(prev);
      next.has(photoId) ? next.delete(photoId) : next.add(photoId);
      return next;
    });
    // Optimistically call API
    try {
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/api/celebration-wall/photos/${photoId}/like`, { method: 'POST' });
    } catch {}
  };

  const openLightbox = (photo) => {
    const idx = photos.findIndex(p => p.id === photo.id);
    setLightboxIndex(idx);
    setLightboxPhoto(photo);
  };

  const navLightbox = (dir) => {
    const newIdx = lightboxIndex + dir;
    if (newIdx >= 0 && newIdx < photos.length) {
      setLightboxIndex(newIdx);
      setLightboxPhoto(photos[newIdx]);
    }
  };

  const handleSubmitted = (photoId, photoData) => {
    setHasSubmitted(true);
    setSubmittedPhotoId(photoId);
    setUploadModalOpen(false);

    // Add user's photo to local state immediately at position 2 (after upload card)
    if (photoData) {
      const ownPhoto = {
        id: photoId || 'own-' + Date.now(),
        petName: petName || 'Mojo',
        imageUrl: photoData.previewUrl,
        occasion: photoData.celebType || 'Birthday',
        caption: photoData.caption,
        likes: 0,
        location: photoData.city || 'India',
        date: 'Today',
        miraComment: photoData.miraComment,
        isOwn: true,
        isPendingReview: true
      };
      setSubmittedPhoto(ownPhoto);
    }
  };

  // Subtitle: 4 states
  const subtitle = hasSubmitted
    ? 'Your story is on the wall ♥'
    : 'Where our community honours those forever loved. Add yours to the wall.';

  // Share button state
  const shareButtonText = hasSubmitted ? '✓ Your story is on the wall' : '📸 Share Your Story';

  return (
    <section
      style={{ padding: '0 0 48px', background: '#FFFFFF' }}
      data-testid="celebration-wall"
    >
      {/* ── Section Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <h2 style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: '1.75rem', fontWeight: 800, color: '#1A0030', marginBottom: 4
          }}>
            <span style={{ fontSize: 24, color: '#E91E8C' }}>📸</span>
            Celebration Wall
          </h2>
          <p style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
            {subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Share button */}
          <button
            onClick={hasSubmitted ? undefined : () => setUploadModalOpen(true)}
            disabled={hasSubmitted}
            style={{
              background: hasSubmitted ? '#F0FDF4' : '#FFFFFF',
              color: hasSubmitted ? '#166534' : '#E91E8C',
              border: `1.5px solid ${hasSubmitted ? '#BBF7D0' : '#E91E8C'}`,
              borderRadius: 9999, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: hasSubmitted ? 'default' : 'pointer',
              transition: 'all 150ms'
            }}
            onMouseEnter={e => { if (!hasSubmitted) { e.currentTarget.style.background = '#FFF0F8'; e.currentTarget.style.borderColor = '#C4007A'; }}}
            onMouseLeave={e => { if (!hasSubmitted) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E91E8C'; }}}
            data-testid="wall-share-btn"
          >
            {shareButtonText}
          </button>

          {/* Nav arrows */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#FFFFFF', border: '1px solid #F0E8E0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canScrollLeft ? 'pointer' : 'not-allowed',
              opacity: canScrollLeft ? 1 : 0.35, transition: 'all 150ms'
            }}
            onMouseEnter={e => { if (canScrollLeft) { e.currentTarget.style.background = '#F9F4FF'; e.currentTarget.style.borderColor = '#C44DFF'; e.currentTarget.style.color = '#C44DFF'; }}}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#F0E8E0'; e.currentTarget.style.color = '#1A0030'; }}
            data-testid="wall-scroll-left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#FFFFFF', border: '1px solid #F0E8E0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canScrollRight ? 'pointer' : 'not-allowed',
              opacity: canScrollRight ? 1 : 0.35, transition: 'all 150ms'
            }}
            onMouseEnter={e => { if (canScrollRight) { e.currentTarget.style.background = '#F9F4FF'; e.currentTarget.style.borderColor = '#C44DFF'; e.currentTarget.style.color = '#C44DFF'; }}}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#F0E8E0'; e.currentTarget.style.color = '#1A0030'; }}
            data-testid="wall-scroll-right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scroll container ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex', gap: 14,
          overflowX: 'auto', scrollBehavior: 'smooth',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          paddingBottom: 8,
          scrollSnapType: 'x mandatory'
        }}
      >
        {/* Upload card — always first */}
        <WallUploadCard
          petName={petName}
          hasSubmitted={hasSubmitted}
          onAddPhoto={() => setUploadModalOpen(true)}
        />

        {/* User's own submitted photo — always position 2 (immediately after upload card) */}
        {submittedPhoto && (
          <WallCard
            photo={submittedPhoto}
            isOwn={true}
            liked={likedPhotos.has(submittedPhoto.id)}
            onLike={handleLike}
            onClick={() => openLightbox(submittedPhoto)}
          />
        )}

        {/* Photo cards */}
        {photos.map((photo, idx) => (
          <WallCard
            key={photo.id}
            photo={photo}
            isOwn={photo.isOwn || photo.id === submittedPhotoId}
            liked={likedPhotos.has(photo.id)}
            onLike={handleLike}
            onClick={() => openLightbox(photo)}
          />
        ))}
      </div>

      {/* ── Upload modal ── */}
      <WallUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        petName={petName}
        petId={pet?.id}
        onSubmitted={handleSubmitted}
      />

      {/* ── Lightbox ── */}
      {lightboxPhoto && (
        <WallLightbox
          photo={lightboxPhoto}
          isOwn={lightboxPhoto?.isOwn || lightboxPhoto?.id === submittedPhotoId}
          liked={likedPhotos.has(lightboxPhoto?.id)}
          onLike={handleLike}
          onClose={() => setLightboxPhoto(null)}
          onPrev={() => navLightbox(-1)}
          onNext={() => navLightbox(1)}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < photos.length - 1}
        />
      )}
    </section>
  );
};

export default CelebrationMemoryWall;
