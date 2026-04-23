/**
 * NearMeBadges.jsx — shared rating + TDC Verified badge helpers for ALL pillar NearMe surfaces.
 *
 * Canonical display format: "4.8 ★ (127 reviews) · ✦ TDC Verified"
 *
 * Place object contract (from Google Places or our backend shim):
 *   place.rating                — number (e.g. 4.8)
 *   place.user_ratings_total    — number (preferred)
 *   place.review_count          — number (alias used by celebrate/paperwork)
 *   place.total_ratings         — number (alias used by nearby_places_routes)
 *   place.tdc_verified          — bool
 *
 * Usage:
 *   import { RatingReviewsLine, TDCVerifiedBadge, sortByTDCVerified } from '../common/NearMeBadges';
 *   <RatingReviewsLine place={place} />
 *   <TDCVerifiedBadge verified={place.tdc_verified} />
 *   {results.sort(sortByTDCVerified).map(...)}
 */

export function getReviewCount(place) {
  if (!place) return 0;
  return (
    place.user_ratings_total ??
    place.review_count ??
    place.total_ratings ??
    0
  );
}

/**
 * Inline rating + review line — drop-in replacement for ad-hoc "★ 4.8" snippets.
 * Renders nothing when no rating is available.
 */
export function RatingReviewsLine({ place, size = 12, showReviews = true }) {
  const rating = place?.rating;
  if (!rating) return null;
  const count = getReviewCount(place);
  return (
    <span
      data-testid="nearme-rating-line"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: size,
        fontWeight: 600,
        color: '#B45309', // amber-700 — matches most pillar palettes
        whiteSpace: 'nowrap',
      }}
    >
      <span>{Number(rating).toFixed(1)}</span>
      <span style={{ color: '#F59E0B' }}>★</span>
      {showReviews && count > 0 && (
        <span style={{ color: '#64748B', fontWeight: 400 }}>
          ({count.toLocaleString()} reviews)
        </span>
      )}
    </span>
  );
}

/**
 * ✦ TDC Verified badge. Renders only when verified is truthy.
 * `bakery` variant: "✦ TDC Bakery Verified" — used on Celebrate pillar for in-house bakery items.
 */
export function TDCVerifiedBadge({ verified, variant = 'default', size = 11 }) {
  if (!verified) return null;
  const label = variant === 'bakery' ? '✦ TDC Bakery Verified' : '✦ TDC Verified';
  const testid = variant === 'bakery' ? 'tdc-bakery-verified-badge' : 'tdc-verified-badge';
  return (
    <span
      data-testid={testid}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: size,
        fontWeight: 700,
        background: variant === 'bakery' ? '#FEF3C7' : '#ECFDF5',
        color: variant === 'bakery' ? '#92400E' : '#047857',
        border: variant === 'bakery' ? '1px solid rgba(146,64,14,0.18)' : '1px solid rgba(4,120,87,0.18)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

/**
 * Combined one-liner: rating + · + TDC badge. Most NearMe card headers want exactly this.
 */
export function NearMeResultBadges({ place, bakery = false }) {
  const hasRating = !!place?.rating;
  const verified = !!place?.tdc_verified;
  if (!hasRating && !verified) return null;
  return (
    <div
      data-testid="nearme-result-badges"
      style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
    >
      <RatingReviewsLine place={place} />
      {hasRating && verified && (
        <span style={{ color: '#94A3B8', fontSize: 12 }}>·</span>
      )}
      <TDCVerifiedBadge verified={verified} variant={bakery ? 'bakery' : 'default'} />
    </div>
  );
}

/**
 * Array sort comparator: TDC-verified places first, then by rating desc.
 * Usage: results.slice().sort(sortByTDCVerified).
 */
export function sortByTDCVerified(a, b) {
  const av = a?.tdc_verified ? 1 : 0;
  const bv = b?.tdc_verified ? 1 : 0;
  if (av !== bv) return bv - av;
  return (b?.rating || 0) - (a?.rating || 0);
}
