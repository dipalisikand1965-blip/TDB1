import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { API_URL } from '../utils/api';
import { Star, Check, X, MessageSquare, Filter } from 'lucide-react';

const ReviewsManager = ({ getAuthHeader }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' 
        ? `${API_URL}/api/admin/reviews`
        : `${API_URL}/api/admin/reviews?status=${statusFilter}`;
        
      const response = await fetch(url, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      
      const response = await fetch(`${API_URL}/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Failed to update review:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Reviews & Ratings</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            className="border rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pending Approval</option>
            <option value="approved">Published</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Reviews</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-500 border rounded-xl border-dashed">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          No reviews found in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{review.title || 'Untitled Review'}</h3>
                  <Badge variant={
                    review.status === 'approved' ? 'success' :
                    review.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {review.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">by {review.author_name}</span>
                  <span className="text-xs text-gray-400">• {new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{review.content}</p>
                <p className="text-xs text-purple-600 font-medium">Product: {review.product_name || review.product_id}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {review.status !== 'approved' && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus(review.id, 'approved')}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                )}
                {review.status !== 'rejected' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => updateStatus(review.id, 'rejected')}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsManager;
