import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Star, MessageSquare, X, Edit2, Trash2, Loader2 } from 'lucide-react';

const ReviewsTab = ({ 
  reviews, 
  reviewableProducts, 
  user,
  token,
  API_URL,
  onReviewsUpdate
}) => {
  const navigate = useNavigate();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', name: '' });
  const [editingReview, setEditingReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setReviewLoading(true);
    try {
      const reviewData = {
        product_id: selectedProduct.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        reviewer_name: reviewForm.name || user.name,
        reviewer_email: user.email
      };
      
      if (editingReview) {
        await fetch(`${API_URL}/api/reviews/${editingReview.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(reviewData)
        });
      } else {
        await fetch(`${API_URL}/api/reviews`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(reviewData)
        });
      }
      
      // Reset form and trigger parent refresh
      setShowReviewForm(false);
      setSelectedProduct(null);
      setEditingReview(null);
      setReviewForm({ rating: 5, comment: '', name: '' });
      if (onReviewsUpdate) onReviewsUpdate();
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setSelectedProduct({ id: review.product_id, name: review.product_name, image: review.product_image });
    setReviewForm({
      rating: review.rating,
      comment: review.comment,
      name: review.reviewer_name
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onReviewsUpdate) onReviewsUpdate();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const startNewReview = (product) => {
    setSelectedProduct(product);
    setEditingReview(null);
    setReviewForm({ rating: 5, comment: '', name: user.name || '' });
    setShowReviewForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">My Reviews</h3>
        <Badge variant="outline">{reviews.length} Reviews</Badge>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedProduct && (
        <Card className="p-6 border-2 border-purple-200 bg-purple-50/50">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {selectedProduct.image && (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div>
                <h4 className="font-semibold">{editingReview ? 'Edit Review' : 'Write a Review'}</h4>
                <p className="text-sm text-gray-600">{selectedProduct.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setShowReviewForm(false); setEditingReview(null); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Display Name</label>
              <Input
                value={reviewForm.name}
                onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name (as shown on review)"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Your Review</label>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience with this product..."
                rows={4}
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={reviewLoading} className="bg-purple-600 hover:bg-purple-700">
                {reviewLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : editingReview ? 'Update Review' : 'Submit Review'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowReviewForm(false); setEditingReview(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Products to Review */}
      {reviewableProducts.length > 0 && !showReviewForm && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Products You Can Review
          </h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviewableProducts.slice(0, 6).map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {(product.image_url || product.image) && (
                  <img src={product.image_url || product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <Button
                    size="sm"
                    variant="link"
                    className="p-0 h-auto text-purple-600"
                    onClick={() => startNewReview(product)}
                  >
                    Write Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Existing Reviews */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-semibold">Your Reviews</h4>
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start gap-4">
                {review.product_image && (
                  <img src={review.product_image} alt={review.product_name} className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{review.product_name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditReview(review)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteReview(review.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">{review.comment}</p>
                  {review.status === 'pending' && (
                    <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-300">Pending Approval</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : reviewableProducts.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-700">No Reviews Yet</h4>
          <p className="text-gray-500 mt-1">
            Place an order to leave reviews for products you&apos;ve purchased!
          </p>
          <Button onClick={() => navigate('/all')} className="mt-4 bg-purple-600 hover:bg-purple-700">
            Start Shopping
          </Button>
        </Card>
      )}
    </div>
  );
};

export default ReviewsTab;
