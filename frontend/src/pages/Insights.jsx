import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, User, ArrowRight, Clock, Eye, X } from 'lucide-react';

// Full article content for each insight
const articleContent = {
  1: `
    <h2>The 5 Flavors That Make Every Tail Wag</h2>
    <p>When it comes to celebrating your furry friend's special day, nothing beats a delicious, dog-safe birthday cake. After baking thousands of cakes for our four-legged customers, we've discovered the flavors that consistently make tails wag the hardest!</p>
    
    <h3>1. Peanut Butter - The Undisputed Champion 🥜</h3>
    <p>It's no surprise that peanut butter takes the top spot! This creamy, protein-rich flavor is irresistible to most dogs. Our peanut butter cakes are made with 100% natural, xylitol-free peanut butter, ensuring they're both delicious and safe.</p>
    
    <h3>2. Chicken & Oats - The Savory Delight 🍗</h3>
    <p>For pups who prefer savory over sweet, our chicken and oats flavor is a winner. Made with real shredded chicken breast and wholesome oats, it's like a gourmet meal in cake form!</p>
    
    <h3>3. Banana & Honey - Nature's Sweetness 🍌</h3>
    <p>This naturally sweet combination is perfect for dogs who love fruit. The potassium from bananas and the antioxidants from raw honey make this a healthy and tasty choice.</p>
    
    <h3>4. Carrot & Apple - The Healthy Choice 🥕</h3>
    <p>Packed with vitamins and fiber, our carrot and apple cake is the choice for health-conscious pet parents. Dogs love the natural sweetness, and you'll love knowing you're giving them something nutritious.</p>
    
    <h3>5. Mutton & Veggies - The Premium Pick 🍖</h3>
    <p>For those extra special celebrations, our mutton cake with mixed vegetables is a luxurious treat. It's like a Sunday roast, but in cake form!</p>
    
    <h3>Tips for Choosing the Right Flavor</h3>
    <ul>
      <li>Consider your dog's dietary restrictions and allergies</li>
      <li>If your dog is a picky eater, start with peanut butter - it's almost universally loved</li>
      <li>For senior dogs, softer flavors like banana & honey work great</li>
      <li>Active dogs might prefer the protein-rich chicken or mutton options</li>
    </ul>
    
    <p><strong>Ready to order?</strong> Check out our full range of birthday cakes and find the perfect flavor for your pup's next celebration!</p>
  `,
  2: `
    <h2>Your Complete Guide to an Unforgettable Puppy Party</h2>
    <p>Planning a birthday party for your dog might sound over the top, but trust us - it's one of the most rewarding experiences for any pet parent. Here's everything you need to know!</p>
    
    <h3>Step 1: Set the Date and Guest List 📅</h3>
    <p>Choose a date that works for you and your dog's friends (and their humans!). Keep the guest list manageable - 4-6 dogs is usually perfect for a backyard party. Make sure all attending dogs are vaccinated and socialized.</p>
    
    <h3>Step 2: Choose a Theme 🎨</h3>
    <p>Popular themes include: Paw Patrol, Doggy Spa Day, Puppy Pool Party, or simply their favorite color. This helps guide your decoration and activity choices.</p>
    
    <h3>Step 3: Decorations That Wow 🎈</h3>
    <p>Use dog-safe decorations - avoid small items that could be swallowed. Our favorites include:</p>
    <ul>
      <li>Paw print balloons (keep them secured)</li>
      <li>Bandana bunting in your theme colors</li>
      <li>A "Happy Barkday" banner</li>
      <li>Photo booth props for Instagram-worthy pics!</li>
    </ul>
    
    <h3>Step 4: Plan Fun Activities 🎾</h3>
    <p>Keep dogs entertained with:</p>
    <ul>
      <li>A treasure hunt with treats hidden around the yard</li>
      <li>Musical sits (like musical chairs, but for pups!)</li>
      <li>Bubble chasing with dog-safe bubbles</li>
      <li>A splash pool for summer parties</li>
    </ul>
    
    <h3>Step 5: The Star of the Show - The Cake! 🎂</h3>
    <p>Order your dog-safe birthday cake at least 2-3 days in advance. Don't forget pupcakes for the guests! We offer party packages that include everything you need.</p>
    
    <h3>Step 6: Party Favors 🎁</h3>
    <p>Send guests home with a small bag containing:</p>
    <ul>
      <li>A few treats</li>
      <li>A small toy</li>
      <li>A thank you note (for the humans!)</li>
    </ul>
    
    <p><strong>Pro tip:</strong> Keep the party short - 1-2 hours is plenty. Dogs can get overwhelmed with too much excitement!</p>
  `,
  3: `
    <h2>A Pet Parent's Essential Guide to Safe Ingredients</h2>
    <p>As pet parents, we want to give our dogs the very best. Understanding which ingredients are safe and which to avoid is crucial for their health and happiness.</p>
    
    <h3>Safe Ingredients We Love ✅</h3>
    
    <h4>Proteins</h4>
    <ul>
      <li><strong>Chicken:</strong> Lean, easy to digest, packed with protein</li>
      <li><strong>Turkey:</strong> Low-fat alternative to chicken</li>
      <li><strong>Fish:</strong> Great source of omega-3 fatty acids</li>
      <li><strong>Eggs:</strong> Complete protein, excellent for coat health</li>
    </ul>
    
    <h4>Fruits & Vegetables</h4>
    <ul>
      <li><strong>Carrots:</strong> Low-calorie, great for teeth</li>
      <li><strong>Apples:</strong> Vitamin A & C (remove seeds!)</li>
      <li><strong>Bananas:</strong> Potassium-rich, natural sweetness</li>
      <li><strong>Blueberries:</strong> Antioxidant powerhouse</li>
      <li><strong>Pumpkin:</strong> Excellent for digestion</li>
    </ul>
    
    <h4>Grains & Others</h4>
    <ul>
      <li><strong>Oats:</strong> Fiber-rich, gentle on stomach</li>
      <li><strong>Rice:</strong> Easy to digest carbohydrate</li>
      <li><strong>Natural Peanut Butter:</strong> Must be xylitol-free!</li>
      <li><strong>Honey:</strong> Natural antibacterial (in moderation)</li>
    </ul>
    
    <h3>Ingredients to AVOID ❌</h3>
    <ul>
      <li><strong>Chocolate:</strong> Contains theobromine, toxic to dogs</li>
      <li><strong>Xylitol:</strong> Artificial sweetener, extremely dangerous</li>
      <li><strong>Grapes & Raisins:</strong> Can cause kidney failure</li>
      <li><strong>Onions & Garlic:</strong> Damage red blood cells</li>
      <li><strong>Macadamia Nuts:</strong> Can cause weakness and tremors</li>
      <li><strong>Avocado:</strong> Contains persin, harmful to dogs</li>
      <li><strong>Caffeine:</strong> Can be fatal in large amounts</li>
    </ul>
    
    <h3>Reading Labels Like a Pro</h3>
    <p>When buying treats, always check:</p>
    <ul>
      <li>Ingredients list (fewer is usually better)</li>
      <li>Country of origin</li>
      <li>Expiry dates</li>
      <li>Any artificial preservatives or colors</li>
    </ul>
    
    <p><strong>At The Doggy Bakery, we use only human-grade, vet-approved ingredients. No preservatives, no artificial colors, just pure love in every bite!</strong></p>
  `,
  4: `
    <h2>Heartwarming Stories from Our TDB Family</h2>
    <p>At The Doggy Bakery, we're not just making treats - we're creating memories. Here are some beautiful stories from our incredible community of pet parents.</p>
    
    <h3>Bruno's Surprise Party 🎉</h3>
    <p><em>"When Bruno turned 7, we wanted to do something special. We ordered a custom Golden Retriever cake from TDB, and the moment Bruno saw it, his tail wouldn't stop wagging! The cake was not only beautiful but he devoured every bite. Thank you for making his day so special!"</em><br/>- Priya, Mumbai</p>
    
    <h3>Coco's First Birthday 🐕</h3>
    <p><em>"Coco is our first dog, and we wanted her first birthday to be perfect. TDB helped us with everything - from the cake to party treats for her doggy friends. The photos we got are absolutely precious!"</em><br/>- Rahul & Sneha, Bangalore</p>
    
    <h3>A Gotcha Day Celebration 💕</h3>
    <p><em>"We adopted Max when he was 3, and we celebrate his 'Gotcha Day' every year. TDB's cakes have become a tradition. Max knows exactly what that pink box means - pure happiness!"</em><br/>- The Sharma Family, Gurgaon</p>
    
    <h3>Monthly Subscribers Love Us 📦</h3>
    <p><em>"As a Pawsome member, I get monthly treats delivered. My two Labs wait by the door when they smell the TDB box. It's become our special bonding time!"</em><br/>- Anita, Mumbai</p>
    
    <h3>Join Our Pawsome Panel</h3>
    <p>Want to be featured on our wall of fame? Share your TDB moments with us on Instagram using #TheDoggyBakery or email us your photos and stories!</p>
    
    <p><strong>Every pup is special to us. Thank you for being part of our journey! 🐾</strong></p>
  `,
  5: `
    <h2>Beat the Heat: Summer Treats Your Dog Will Love</h2>
    <p>Indian summers can be tough on our furry friends. Here's how to keep them cool, happy, and healthy during the hot months!</p>
    
    <h3>Frozen Treat Ideas 🧊</h3>
    
    <h4>1. Frozen Kong Classics</h4>
    <p>Stuff a Kong toy with peanut butter mixed with mashed banana, then freeze overnight. Your dog will spend hours trying to lick out every bit!</p>
    
    <h4>2. Watermelon Popsicles</h4>
    <p>Blend seedless watermelon with a little yogurt, pour into ice cube trays, and freeze. A hydrating, refreshing treat!</p>
    
    <h4>3. Chicken Broth Ice Cubes</h4>
    <p>Make your own low-sodium chicken broth, freeze in cubes, and add to your dog's water bowl. They'll love the flavor!</p>
    
    <h4>4. TDB Fro-Yo Cups</h4>
    <p>Our signature frozen yogurt cups come in peanut butter and berry flavors. Pre-made and ready to serve!</p>
    
    <h3>Summer Safety Tips 🌞</h3>
    <ul>
      <li><strong>Hydration:</strong> Always have fresh water available, consider adding ice cubes</li>
      <li><strong>Walk timing:</strong> Early morning or after sunset to avoid hot pavement</li>
      <li><strong>Paw protection:</strong> Test pavement with your hand - if it's too hot for you, it's too hot for their paws</li>
      <li><strong>Never leave in car:</strong> Even 5 minutes can be dangerous</li>
      <li><strong>Shade:</strong> Ensure they have a cool, shaded spot to rest</li>
    </ul>
    
    <h3>Signs of Overheating 🚨</h3>
    <p>Watch for:</p>
    <ul>
      <li>Excessive panting</li>
      <li>Drooling more than usual</li>
      <li>Red gums</li>
      <li>Lethargy</li>
      <li>Vomiting</li>
    </ul>
    <p><strong>If you notice these signs, move your dog to a cool area and contact your vet immediately.</strong></p>
    
    <p>Stay cool, stay safe, and enjoy the summer with your furry best friend! 🐕</p>
  `,
  6: `
    <h2>Welcome to Our Kitchen: Where Magic Happens</h2>
    <p>Ever wondered how we create our delicious treats? Come along for an exclusive behind-the-scenes tour of The Doggy Bakery!</p>
    
    <h3>Our Morning Routine 🌅</h3>
    <p>Every day at TDB starts at 6 AM. Our bakers arrive, put on their aprons, and begin the day's preparations. The first task? Making sure all our ingredients are fresh and ready.</p>
    
    <h3>Ingredient Sourcing 🥕</h3>
    <p>We're incredibly particular about our ingredients:</p>
    <ul>
      <li>Fresh chicken from local farms, never frozen</li>
      <li>Organic peanut butter from trusted suppliers</li>
      <li>Fresh fruits and vegetables from morning markets</li>
      <li>Whole grain flours - no refined ingredients here!</li>
    </ul>
    
    <h3>The Baking Process 🍰</h3>
    <p>Each cake is made to order. Here's how:</p>
    <ol>
      <li><strong>Mixing:</strong> All ingredients are carefully measured and mixed by hand</li>
      <li><strong>Baking:</strong> Low temperature, longer baking time for moist cakes</li>
      <li><strong>Cooling:</strong> Every cake rests for at least an hour before decoration</li>
      <li><strong>Decorating:</strong> Our artists use only dog-safe colors and toppings</li>
      <li><strong>Quality Check:</strong> Every product is inspected before packaging</li>
    </ol>
    
    <h3>Meet Our Team 👨‍🍳</h3>
    <p>Our team includes certified pet nutritionists, experienced bakers, and most importantly - dog lovers! Everyone here has at least one furry friend at home, so we understand exactly what pet parents want.</p>
    
    <h3>Quality Promise</h3>
    <p>Every product that leaves our kitchen is:</p>
    <ul>
      <li>Made with 100% human-grade ingredients</li>
      <li>Free from preservatives and artificial additives</li>
      <li>Tested for freshness and quality</li>
      <li>Packaged with love and care</li>
    </ul>
    
    <p><strong>From our kitchen to your dog's bowl - that's the TDB promise! 🐾</strong></p>
  `
};

const insights = [
  {
    id: 1,
    title: 'Top 5 Birthday Cake Flavors Dogs Absolutely Love',
    excerpt: 'Discover the most popular cake flavors that make tails wag! From peanut butter to chicken, find out what your pup will love.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop',
    author: 'The Doggy Bakery Team',
    date: 'January 10, 2025',
    readTime: '5 min read',
    views: 1234,
    category: 'Tips & Tricks'
  },
  {
    id: 2,
    title: 'How to Plan the Perfect Puppy Birthday Party',
    excerpt: 'A complete guide to throwing an unforgettable celebration for your furry friend. Invites, decorations, games, and more!',
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop',
    author: 'The Doggy Bakery Team',
    date: 'January 8, 2025',
    readTime: '8 min read',
    views: 892,
    category: 'Party Planning'
  },
  {
    id: 3,
    title: 'Understanding Dog-Safe Ingredients: What to Look For',
    excerpt: 'Learn about ingredients that are healthy for dogs and which ones to avoid. A must-read for all pet parents!',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop',
    author: 'Dr. Priya Sharma',
    date: 'January 5, 2025',
    readTime: '6 min read',
    views: 2156,
    category: 'Health & Nutrition'
  },
  {
    id: 4,
    title: 'Meet Our Pawsome Panel: Stories from Our Loyal Customers',
    excerpt: 'Heartwarming stories from pet parents who have celebrated countless moments with The Doggy Bakery.',
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=600&h=400&fit=crop',
    author: 'The Doggy Bakery Team',
    date: 'January 3, 2025',
    readTime: '4 min read',
    views: 567,
    category: 'Community'
  },
  {
    id: 5,
    title: 'Summer Treats: Keeping Your Dog Cool and Happy',
    excerpt: 'Beat the heat with our frozen treat recipes and tips for keeping your pup comfortable during hot days.',
    image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600&h=400&fit=crop',
    author: 'The Doggy Bakery Team',
    date: 'December 28, 2024',
    readTime: '5 min read',
    views: 1890,
    category: 'Seasonal'
  },
  {
    id: 6,
    title: 'From Our Kitchen: Behind the Scenes at The Doggy Bakery',
    excerpt: 'Take a peek into our bakery! See how we craft each treat with love and the freshest ingredients.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    author: 'The Doggy Bakery Team',
    date: 'December 20, 2024',
    readTime: '7 min read',
    views: 3421,
    category: 'Behind the Scenes'
  }
];

const Insights = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            TDB Insights
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tips, stories, and everything you need to know about celebrating your furry friends
          </p>
        </div>

        {/* Featured Post */}
        <Card className="mb-12 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="h-64 md:h-auto">
              <img 
                src={insights[0].image} 
                alt={insights[0].title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <span className="text-sm text-purple-600 font-semibold mb-2">{insights[0].category}</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{insights[0].title}</h2>
              <p className="text-gray-600 mb-6">{insights[0].excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1"><User className="w-4 h-4" />{insights[0].author}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{insights[0].date}</span>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700 w-fit">
                Read More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>

        {/* All Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {insights.slice(1).map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <span className="text-xs text-purple-600 font-semibold">{post.category}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views} views</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <Card className="mt-16 p-8 md:p-12 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Subscribe to Our Newsletter</h3>
          <p className="mb-6 max-w-xl mx-auto">Get the latest tips, recipes, and exclusive offers delivered to your inbox!</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 rounded-full">
              Subscribe
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
