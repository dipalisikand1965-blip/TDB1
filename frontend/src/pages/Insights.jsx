import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, User, ArrowRight, Clock, Eye } from 'lucide-react';

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
