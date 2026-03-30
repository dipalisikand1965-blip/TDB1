import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, User, ArrowRight, Clock, Eye, X, Loader2 } from 'lucide-react';
import { API_URL } from '../utils/api';

const Insights = () => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch blog posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/blog-posts`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        } else {
          setError('Failed to load blog posts');
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Default placeholder image for posts without images
  const getImageUrl = (post) => {
    if (post.image_url) return post.image_url;
    // Default images based on category
    const categoryImages = {
      'Celebrate': '',
      'Dine': '',
      'Stay': '',
      'Travel': '',
      'Health': '',
      'Care': '',
    };
    return categoryImages[post.category] || '';
  };

  // Article Modal Component
  const ArticleModal = ({ article, onClose }) => {
    if (!article) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
        data-testid="article-modal"
      >
        <div 
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Image */}
          <div className="relative h-64 md:h-80">
            <img 
              src={getImageUrl(article)} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              data-testid="close-article-modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <span className="text-sm text-purple-300 font-semibold">{article.category}</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">{article.title}</h2>
            </div>
          </div>
          
          {/* Article Content */}
          <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-320px)]">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b flex-wrap">
              <span className="flex items-center gap-1"><User className="w-4 h-4" />{article.author || 'TDB Team'}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(article.published_at || article.created_at)}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{article.views || 0} views</span>
            </div>
            
            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-lg text-gray-700 mb-6 italic border-l-4 border-purple-500 pl-4">
                {article.excerpt}
              </p>
            )}
            
            {/* Full Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-purple-600"
            >
              {article.content ? (
                article.content.split('\n').map((paragraph, idx) => (
                  paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
                ))
              ) : (
                <p>Full content coming soon...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">TDB Insights</h1>
          <p className="text-xl text-gray-600 mb-8">Tips, stories, and everything you need to know about celebrating your furry friends</p>
          <Card className="p-8">
            <p className="text-gray-500">{error}. Please try again later.</p>
          </Card>
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">TDB Insights</h1>
          <p className="text-xl text-gray-600 mb-8">Tips, stories, and everything you need to know about celebrating your furry friends</p>
          <Card className="p-8">
            <p className="text-gray-500">No blog posts yet. Check back soon!</p>
          </Card>
        </div>
      </div>
    );
  }

  // Get featured post (first one or one marked as featured)
  const featuredPost = posts.find(p => p.is_featured) || posts[0];
  const otherPosts = posts.filter(p => p.id !== featuredPost.id);

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
        {featuredPost && (
          <Card className="mb-12 overflow-hidden" data-testid="featured-post">
            <div className="grid md:grid-cols-2">
              <div className="h-64 md:h-auto">
                <img 
                  src={getImageUrl(featuredPost)} 
                  alt={featuredPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <span className="text-sm text-purple-600 font-semibold mb-2">{featuredPost.category}</span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{featuredPost.title}</h2>
                <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 flex-wrap">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" />{featuredPost.author || 'TDB Team'}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 w-fit"
                  onClick={() => setSelectedArticle(featuredPost)}
                  data-testid="read-more-featured"
                >
                  Read More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* All Posts Grid */}
        {otherPosts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post) => (
              <Card 
                key={post.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedArticle(post)}
                data-testid={`insight-card-${post.id}`}
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={getImageUrl(post)} 
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs text-purple-600 font-semibold">{post.category}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.published_at || post.created_at)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views || 0} views</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Newsletter Signup */}
        <Card className="mt-16 p-8 md:p-12 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Subscribe to Our Newsletter</h3>
          <p className="mb-6 max-w-xl mx-auto">Get the latest tips, recipes, and exclusive offers delivered to your inbox!</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              data-testid="newsletter-email"
            />
            <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 rounded-full" data-testid="newsletter-subscribe">
              Subscribe
            </Button>
          </div>
        </Card>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}
    </div>
  );
};

export default Insights;
