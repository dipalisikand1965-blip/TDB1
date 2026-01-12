// Mock data for The Doggy Bakery

export const products = [
  {
    id: '1',
    name: 'Pawsome 2.0',
    category: 'cakes',
    price: 699,
    originalPrice: 699,
    image: 'https://images.unsplash.com/photo-1644732649135-5926c0945d2d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxkb2clMjBiaXJ0aGRheSUyMGNha2V8ZW58MHx8fHwxNzY4MTgwOTEyfDA&ixlib=rb-4.1.0&q=85',
    description: 'A classic favorite with fresh ingredients, perfect for celebrating your pup\'s special day',
    sizes: ['Small (500g)', 'Medium (1kg)', 'Large (1.5kg)'],
    flavors: ['Chicken & Oats', 'Banana & Honey', 'Peanut Butter'],
    isNew: true,
    rating: 4.8,
    reviews: 234
  },
  {
    id: '2',
    name: 'Floral Fido',
    category: 'cakes',
    price: 649,
    originalPrice: 649,
    image: 'https://images.unsplash.com/photo-1641029902225-f2a0907ee22d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxkb2clMjBiaXJ0aGRheSUyMGNha2V8ZW58MHx8fHwxNzY4MTgwOTEyfDA&ixlib=rb-4.1.0&q=85',
    description: 'Beautiful floral design with healthy ingredients your dog will love',
    sizes: ['Small (500g)', 'Medium (1kg)', 'Large (1.5kg)'],
    flavors: ['Berry & Chicken', 'Apple & Oats', 'Carrot & Honey'],
    rating: 4.9,
    reviews: 189
  },
  {
    id: '3',
    name: 'Dog Cake Party Box',
    category: 'cakes',
    price: 999,
    originalPrice: 999,
    image: 'https://images.unsplash.com/photo-1641029894827-2964c9889bec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxkb2clMjBiaXJ0aGRheSUyMGNha2V8ZW58MHx8fHwxNzY4MTgwOTEyfDA&ixlib=rb-4.1.0&q=85',
    description: 'Complete party package with cake, treats, and decorations',
    sizes: ['Party Pack'],
    flavors: ['Mixed Flavors'],
    isBestseller: true,
    rating: 5.0,
    reviews: 456
  },
  {
    id: '4',
    name: 'Golden Retriever Breed Cake',
    category: 'custom',
    price: 950,
    originalPrice: 950,
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxkb2clMjB0cmVhdHN8ZW58MHx8fHwxNzY4MTgwOTE4fDA&ixlib=rb-4.1.0&q=85',
    description: 'Custom cake shaped like your dog\'s breed',
    sizes: ['Medium (1kg)', 'Large (1.5kg)'],
    flavors: ['Mutton & Veggies', 'Chicken & Rice'],
    rating: 4.9,
    reviews: 145
  },
  {
    id: '5',
    name: 'Woof Dognuts',
    category: 'treats',
    price: 450,
    originalPrice: 450,
    image: 'https://images.unsplash.com/photo-1592468257342-8375cb556a69?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxkb2clMjB0cmVhdHN8ZW58MHx8fHwxNzY4MTgwOTE4fDA&ixlib=rb-4.1.0&q=85',
    description: 'Mini donut-shaped treats packed with nutrition',
    sizes: ['6 Pack', '12 Pack'],
    flavors: ['Chicken & Oats', 'Peanut Butter', 'Berry Mix'],
    rating: 4.7,
    reviews: 678
  },
  {
    id: '6',
    name: 'Chicken Jerky',
    category: 'treats',
    price: 420,
    originalPrice: 475,
    image: 'https://images.unsplash.com/photo-1662973544396-2885509b1d90?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxkb2clMjB0cmVhdHN8ZW58MHx8fHwxNzY4MTgwOTE4fDA&ixlib=rb-4.1.0&q=85',
    description: 'Premium chicken jerky, slowly dried to perfection',
    sizes: ['100g', '250g', '500g'],
    flavors: ['Plain Chicken'],
    onSale: true,
    rating: 4.9,
    reviews: 892
  },
  {
    id: '7',
    name: 'Pupcakes Variety Box',
    category: 'treats',
    price: 550,
    originalPrice: 550,
    image: 'https://images.pexels.com/photos/230785/pexels-photo-230785.jpeg',
    description: 'Assorted mini cupcakes perfect for sharing',
    sizes: ['6 Pack', '12 Pack'],
    flavors: ['Mixed Flavors'],
    rating: 4.8,
    reviews: 345
  },
  {
    id: '8',
    name: 'Chicken & Veggies Meal',
    category: 'meals',
    price: 199,
    originalPrice: 199,
    image: 'https://images.pexels.com/photos/933498/pexels-photo-933498.jpeg',
    description: 'Fresh, nutritious meal made with real chicken and vegetables',
    sizes: ['250g', '500g', '1kg'],
    flavors: ['Chicken & Veggies'],
    isNew: true,
    rating: 4.9,
    reviews: 567
  }
];

export const testimonials = [
  {
    id: '1',
    name: 'Arjun V',
    location: 'Bengaluru',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    rating: 5,
    text: 'Ordering from The Doggy Bakery was seamless. Every bite was savored, and I felt at ease knowing he was enjoying a treat made with natural, dog-friendly ingredients.',
    date: '2024-12-15'
  },
  {
    id: '2',
    name: 'Priya S',
    location: 'Mumbai',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    rating: 5,
    text: 'Bhadra loves The Doggy Bakery\'s chicken and oat Woof Dognuts! It\'s our go-to treat to brighten her day. Thank you for these healthy delights!',
    date: '2024-12-10'
  },
  {
    id: '3',
    name: 'Rahul Joshi',
    location: 'Mumbai',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    rating: 5,
    text: 'Wanted to make Archie\'s birthday special, so I ordered the Floral Fido Cake. The banana flavor was a hit—Archie enjoyed his cake very much.',
    date: '2024-11-28'
  },
  {
    id: '4',
    name: 'Shreya Reddy',
    location: 'Bengaluru',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shreya',
    rating: 5,
    text: 'For Leo\'s birthday, I ordered a custom Chow Chow mutton-flavored cake. The resemblance was spot-on, and Leo thoroughly enjoyed the celebration. Thanks for making his day so special!',
    date: '2024-11-20'
  }
];

export const faqs = [
  {
    id: '1',
    question: 'What Ingredients Are Used In Your Dog Cakes?',
    answer: 'At The Doggy Bakery, we believe that ingredients matter when it comes to your pup\'s treats. Our dog cakes are made with healthy, pet-friendly, and FSSAI-approved ingredients. Base: Oats or Ragi. Flavour: Fruits (like bananas), Vegetables (like carrots), or Meat. Enhancers: Egg, Coconut Oil, Honey, or Turmeric. Topping: Homemade Yogurt, Peanut Butter, or Rolled Oats. Our cakes are preservative-free, freshly baked, and crafted with love to keep tails wagging!'
  },
  {
    id: '2',
    question: 'Are Your Dog Cakes Safe For Dogs With Allergies?',
    answer: 'Absolutely! We understand that some dogs have specific dietary needs or allergies. Since our cakes are made to order, we can customize them to be grain-free or adjust ingredients based on your pet\'s needs. Contact us at 9739982582 to discuss any specific concerns before placing your order.'
  },
  {
    id: '3',
    question: 'Can I Customize A Dog Cake?',
    answer: 'Absolutely! Since our cakes are made fresh, we can personalize flavors, sizes, and decorations for birthdays or special occasions. For custom designs, please call or WhatsApp us at 9739982582 / 9663185747 or send us an image on Instagram. We recommend sharing your design at least 2-3 days in advance.'
  },
  {
    id: '4',
    question: 'How Long Do Dog Cakes Stay Fresh & How To Store Them?',
    answer: 'Our dog cakes are baked fresh daily without preservatives. To maintain freshness, store them in an airtight container in the refrigerator. If kept overnight, they can be stored for 2-3 days and should be consumed within this period for the best taste and quality.'
  },
  {
    id: '5',
    question: 'Do you offer same-day delivery?',
    answer: 'Yes! We offer same-day delivery in Mumbai and Bangalore for all orders placed by 6:00 PM. For other locations, standard delivery takes 2-3 business days.'
  }
];

export const cakeDesignerOptions = {
  shapes: [
    { id: 'round', name: 'Round Cake', price: 0 },
    { id: 'bone', name: 'Bone Shape', price: 100 },
    { id: 'paw', name: 'Paw Shape', price: 100 },
    { id: 'heart', name: 'Heart Shape', price: 100 }
  ],
  sizes: [
    { id: 'small', name: 'Small (500g)', price: 649, serves: '1-2 dogs' },
    { id: 'medium', name: 'Medium (1kg)', price: 849, serves: '3-4 dogs' },
    { id: 'large', name: 'Large (1.5kg)', price: 1049, serves: '5-6 dogs' }
  ],
  flavors: [
    { id: 'chicken', name: 'Chicken & Oats', price: 0 },
    { id: 'peanut', name: 'Peanut Butter', price: 0 },
    { id: 'banana', name: 'Banana & Honey', price: 0 },
    { id: 'mutton', name: 'Mutton & Veggies', price: 50 },
    { id: 'fish', name: 'Fish & Rice', price: 50 },
    { id: 'berry', name: 'Berry Mix', price: 50 }
  ],
  toppings: [
    { id: 'yogurt', name: 'Homemade Yogurt', price: 0 },
    { id: 'peanut-topping', name: 'Peanut Butter Drizzle', price: 50 },
    { id: 'treats', name: 'Mini Treats', price: 100 },
    { id: 'none', name: 'No Topping', price: 0 }
  ],
  decorations: [
    { id: 'none', name: 'No Decoration', price: 0 },
    { id: 'paw-prints', name: 'Paw Print Design', price: 100 },
    { id: 'flowers', name: 'Floral Design', price: 150 },
    { id: 'custom-name', name: 'Custom Name', price: 200 },
    { id: 'photo', name: 'Edible Photo', price: 300 }
  ]
};

export const categories = [
  {
    id: 'cakes',
    name: 'Dog Cakes',
    description: 'Freshly baked cakes for special celebrations',
    icon: '🎂',
    image: 'https://images.unsplash.com/photo-1644732649135-5926c0945d2d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxkb2clMjBiaXJ0aGRheSUyMGNha2V8ZW58MHx8fHwxNzY4MTgwOTEyfDA&ixlib=rb-4.1.0&q=85'
  },
  {
    id: 'treats',
    name: 'Treats & Snacks',
    description: 'Healthy treats for everyday joy',
    icon: '🦴',
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxkb2clMjB0cmVhdHN8ZW58MHx8fHwxNzY4MTgwOTE4fDA&ixlib=rb-4.1.0&q=85'
  },
  {
    id: 'meals',
    name: 'Fresh Meals',
    description: 'Nutritious meals made daily',
    icon: '🍖',
    image: 'https://images.pexels.com/photos/933498/pexels-photo-933498.jpeg'
  },
  {
    id: 'custom',
    name: 'Custom Designer',
    description: 'Design your perfect cake',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1641029902225-f2a0907ee22d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxkb2clMjBiaXJ0aGRheSUyMGNha2V8ZW58MHx8fHwxNzY4MTgwOTEyfDA&ixlib=rb-4.1.0&q=85'
  }
];
