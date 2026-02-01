/**
 * SEOHead.jsx
 * Dynamic SEO meta tags for each page/pillar
 * Includes canonical URLs, Open Graph, Twitter Cards
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

// Base domain - always use non-www version (canonical)
const SITE_URL = 'https://thedoggycompany.in';
const SITE_NAME = 'The Doggy Company';
const BRAND_TAGLINE = 'Your Pet\'s Life, Thoughtfully Orchestrated.';
const DEFAULT_IMAGE = 'https://thedoggycompany.in/logo-new.png';

// SEO data for each pillar/page
const SEO_DATA = {
  // Homepage
  home: {
    title: "The Doggy Company | Pet Concierge® | Your Pet's Life, Thoughtfully Orchestrated",
    description: "India's first Pet Concierge® service. Premium dog cakes, pet-friendly dining, stays, travel & 14 life pillars. Same-day delivery in Mumbai, Bangalore & Delhi. 45,000+ happy pet parents!",
    keywords: "pet concierge, dog cakes, pet services india, dog birthday, pet platform, the doggy company, pet life",
    image: DEFAULT_IMAGE,
  },
  
  // 14 Pillars
  celebrate: {
    title: "Celebrate | Dog Birthday Cakes & Party Planning | The Doggy Company",
    description: "Make your pet's birthday unforgettable! Custom dog cakes, pupcakes, party decorations & celebration packages. Same-day delivery in Mumbai, Bangalore & Delhi. Order now!",
    keywords: "dog birthday cake, dog party, pet celebration, custom dog cake, pupcakes, dog birthday party, pet bakery india",
    image: DEFAULT_IMAGE,
  },
  
  dine: {
    title: "Dine | Pet-Friendly Restaurants & Chef Services | The Doggy Company",
    description: "Discover pet-friendly restaurants, private chef experiences & gourmet pet dining. Chef's table, home dining, catering for pet parties. Book your culinary experience!",
    keywords: "pet friendly restaurants, dog friendly cafe, pet dining, chef table pets, pet party catering, dog restaurant india",
    image: DEFAULT_IMAGE,
  },
  
  stay: {
    title: "Stay | Premium Pet Boarding & Hotels | The Doggy Company",
    description: "Luxury pet boarding, dog hotels & home stays. Vetted facilities with 24/7 care, webcam access & daily updates. Book safe, comfortable stays for your furry friend!",
    keywords: "pet boarding, dog hotel, pet hostel, dog daycare, pet sitting, dog boarding near me, pet hotel india",
    image: DEFAULT_IMAGE,
  },
  
  travel: {
    title: "Travel | Pet Travel Services & Pet-Friendly Vacations | The Doggy Company",
    description: "Travel with your pet stress-free! Pet relocation, pet-friendly hotels, flight bookings & travel essentials. Plan your perfect pet vacation today!",
    keywords: "pet travel, dog travel, pet relocation, pet friendly hotels, traveling with pets, pet vacation, pet transport india",
    image: DEFAULT_IMAGE,
  },
  
  care: {
    title: "Care | Veterinary Services & Pet Healthcare | The Doggy Company",
    description: "Complete pet healthcare - vet consultations, vaccinations, grooming, dental care & wellness packages. Expert vets, doorstep services available. Book now!",
    keywords: "pet vet, dog grooming, pet vaccination, vet near me, pet healthcare, dog doctor, pet wellness india",
    image: DEFAULT_IMAGE,
  },
  
  enjoy: {
    title: "Enjoy | Pet Activities, Parks & Entertainment | The Doggy Company",
    description: "Fun activities for your pet! Dog parks, pet events, playdates, swimming & adventure activities. Find pet-friendly entertainment near you!",
    keywords: "dog park, pet activities, dog swimming, pet events, dog playdates, pet entertainment, dog fun activities",
    image: DEFAULT_IMAGE,
  },
  
  fit: {
    title: "Fit | Pet Fitness & Exercise Programs | The Doggy Company",
    description: "Keep your pet healthy & active! Dog fitness training, weight management, agility courses & exercise programs. Expert trainers, personalized plans!",
    keywords: "dog fitness, pet exercise, dog training, pet weight loss, agility training, dog workout, pet health program",
    image: DEFAULT_IMAGE,
  },
  
  learn: {
    title: "Learn | Dog Training & Pet Education | The Doggy Company",
    description: "Professional dog training - obedience, behavioral training, puppy classes & certification courses. Expert trainers, proven methods. Enroll today!",
    keywords: "dog training, puppy training, pet obedience, behavioral training, dog classes, pet education, dog trainer india",
    image: DEFAULT_IMAGE,
  },
  
  paperwork: {
    title: "Paperwork | Pet Documentation & Registration | The Doggy Company",
    description: "Hassle-free pet paperwork - KCI registration, microchipping, pet insurance, health certificates & travel documents. We handle all your pet documentation!",
    keywords: "pet registration, KCI registration, pet microchip, pet insurance, dog license, pet documents, pet certification",
    image: DEFAULT_IMAGE,
  },
  
  advisory: {
    title: "Advisory | Pet Expert Consultation | The Doggy Company",
    description: "Expert pet advice - nutrition consultation, behavior specialists, breed guidance & pet parenting tips. Connect with certified pet experts!",
    keywords: "pet consultant, dog expert, pet nutrition advice, pet behaviorist, pet parenting, dog breed advice",
    image: DEFAULT_IMAGE,
  },
  
  emergency: {
    title: "Emergency | 24/7 Pet Emergency Services | The Doggy Company",
    description: "24/7 pet emergency support - emergency vets, ambulance services, poison helpline & critical care. Quick response when your pet needs it most!",
    keywords: "pet emergency, dog emergency, 24 hour vet, pet ambulance, emergency animal hospital, pet poison helpline",
    image: DEFAULT_IMAGE,
  },
  
  farewell: {
    title: "Farewell | Pet Memorial & End-of-Life Services | The Doggy Company",
    description: "Compassionate end-of-life care - pet cremation, memorial services, grief support & remembrance products. Honor your beloved companion with dignity.",
    keywords: "pet cremation, pet memorial, dog funeral, pet remembrance, pet loss support, pet farewell services",
    image: DEFAULT_IMAGE,
  },
  
  adopt: {
    title: "Adopt | Pet Adoption & Rescue | The Doggy Company",
    description: "Find your perfect furry companion! Verified pet adoptions, rescue partnerships & adoption support. Give a pet a loving forever home!",
    keywords: "pet adoption, dog adoption, adopt a dog, rescue dog, pet shelter, adopt dont shop, dog rescue india",
    image: DEFAULT_IMAGE,
  },
  
  shop: {
    title: "Shop | Premium Pet Products & Supplies | The Doggy Company",
    description: "Shop premium pet products - food, treats, toys, accessories & essentials. Curated quality products for dogs & cats. Fast delivery across India!",
    keywords: "pet shop, dog supplies, pet products, dog food, pet accessories, dog toys, pet store online india",
    image: DEFAULT_IMAGE,
  },
  
  // Other important pages
  membership: {
    title: "Club Concierge Membership | Exclusive Pet Benefits | The Doggy Company",
    description: "Join Club Concierge for exclusive pet benefits - priority bookings, member discounts, free deliveries & VIP services. Elevate your pet parenting!",
    keywords: "pet membership, club concierge, pet club, dog membership, pet rewards, exclusive pet benefits",
    image: DEFAULT_IMAGE,
  },
  
  mira: {
    title: "Mira AI | Your Personal Pet Concierge | The Doggy Company",
    description: "Meet Mira - your AI-powered pet concierge®! Get instant help with bookings, recommendations & pet advice. Chat now for personalized assistance!",
    keywords: "pet AI, mira concierge, pet assistant, AI pet help, pet chatbot, virtual pet concierge®",
    image: DEFAULT_IMAGE,
  },
  
  cakes: {
    title: "Dog Birthday Cakes | Custom Pet Cakes | The Doggy Company",
    description: "Delicious dog birthday cakes made with love! Custom designs, healthy ingredients, same-day delivery. Celebrate your furry friend's special day!",
    keywords: "dog birthday cake, custom dog cake, pet cake, dog cake delivery, puppy cake, dog safe cake, dog bakery",
    image: "https://thedoggybakery.com/cdn/shop/files/TDB_cakes_6_6c84dc0e-24b7-49f0-a5f9-0027610924db.png",
  },
  
  treats: {
    title: "Healthy Dog Treats | Premium Pet Snacks | The Doggy Company",
    description: "Premium healthy dog treats - training treats, dental chews, jerky & biscuits. Made with natural ingredients. Shop now for happy, healthy pets!",
    keywords: "dog treats, healthy dog snacks, training treats, dog biscuits, pet treats, natural dog treats",
    image: DEFAULT_IMAGE,
  },
};

/**
 * SEOHead Component
 * @param {string} page - Page identifier (pillar name or page type)
 * @param {string} customTitle - Override title
 * @param {string} customDescription - Override description
 * @param {string} customImage - Override OG image
 * @param {string} path - Current path for canonical URL
 */
const SEOHead = ({ 
  page = 'home', 
  customTitle, 
  customDescription, 
  customImage,
  path = '/',
  noindex = false 
}) => {
  // Get SEO data for this page, fallback to home
  const seo = SEO_DATA[page] || SEO_DATA.home;
  
  const title = customTitle || seo.title;
  const description = customDescription || seo.description;
  const image = customImage || seo.image;
  const keywords = seo.keywords;
  
  // Build canonical URL (always non-www)
  const canonicalUrl = `${SITE_URL}${path === '/' ? '' : path}`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL - Always use non-www */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <meta name="author" content="The Doggy Company" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      
      {/* Structured Data - Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "The Doggy Company",
          "url": SITE_URL,
          "logo": `${SITE_URL}/logo-new.png`,
          "description": "India's first Pet Life Operating System",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
          },
          "sameAs": [
            "https://www.instagram.com/thedoggycompany",
            "https://www.facebook.com/thedoggycompany"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
export { SEO_DATA, SITE_URL };
