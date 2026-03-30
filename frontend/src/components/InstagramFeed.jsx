import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

const InstagramFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock Instagram posts - In production, use Instagram Basic Display API
  const mockPosts = [
    {
      id: '1',
      imageUrl: '',
      caption: '🎂 Bruno\'s 3rd birthday celebration! Custom Golden Retriever cake made with love 💕 #DoggyBakery #DogBirthday',
      likes: 245,
      comments: 18,
      timestamp: '2 days ago',
      permalink: 'https://www.instagram.com/the_doggy_bakery/'
    },
    {
      id: '2',
      imageUrl: '',
      caption: '🐕 Behind the scenes at our Bangalore kitchen! Fresh ingredients, baked with love every single day 🥰',
      likes: 189,
      comments: 12,
      timestamp: '4 days ago',
      permalink: 'https://www.instagram.com/the_doggy_bakery/'
    },
    {
      id: '3',
      imageUrl: '',
      caption: '🎉 Pawty time! Our Floral Fido cake bringing joy to celebrations across Mumbai 🌸',
      likes: 312,
      comments: 24,
      timestamp: '5 days ago',
      permalink: 'https://www.instagram.com/the_doggy_bakery/'
    },
    {
      id: '4',
      imageUrl: '',
      caption: '🦴 Healthy treats, happy pups! 100% natural ingredients, zero preservatives. That\'s our promise 💚',
      likes: 198,
      comments: 15,
      timestamp: '1 week ago',
      permalink: 'https://www.instagram.com/the_doggy_bakery/'
    },
    {
      id: '5',
      imageUrl: '',
      caption: '🎨 Custom breed cakes that look almost too good to eat! (But they do anyway 😋)',
      likes: 276,
      comments: 21,
      timestamp: '1 week ago',
      permalink: 'https://www.instagram.com/the_doggy_bakery/'
    },
    {
      id: '6',
      imageUrl: '',
      caption: '☀️ Sunny days and birthday celebrations! Thank you for trusting us with your special moments 🌟',
      likes: 234,
      comments: 19,
      timestamp: '2 weeks ago',
      permalink: 'https://www.instagram.com/the_doggy_bakery/'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Card key={post.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={post.imageUrl}
              alt="Instagram post"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <p className="text-white text-sm mb-3 line-clamp-2">{post.caption}</p>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-white" />
                    <span className="text-sm">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.comments}</span>
                  </div>
                </div>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs hover:text-pink-300 transition-colors"
                >
                  View
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default InstagramFeed;