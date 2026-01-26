import React from 'react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Edit3 } from 'lucide-react';

/**
 * AdminQuickEdit - A floating button for admins to quickly edit pillar page content
 * Only visible to admin users
 * 
 * Usage:
 * <AdminQuickEdit pillar="celebrate" />
 * <AdminQuickEdit pillar="advisory" position="bottom-right" />
 */
const AdminQuickEdit = ({ pillar, position = 'top-right' }) => {
  const { user } = useAuth();
  
  // Only show for admin users (check for admin role or specific admin emails)
  const isAdmin = user?.role === 'admin' || 
                  user?.email?.includes('admin') || 
                  user?.email === 'aditya@thedoggycompany.in' ||
                  user?.email === 'dipali@clubconcierge.in';
  
  if (!isAdmin) return null;
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  const handleClick = () => {
    // Open admin page CMS in new tab with the pillar pre-selected
    window.open(`/admin?tab=page-cms&page=${pillar}`, '_blank');
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Button
        onClick={handleClick}
        size="sm"
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg flex items-center gap-2"
        title={`Edit ${pillar} page content`}
        data-testid={`admin-quick-edit-${pillar}`}
      >
        <Edit3 className="w-4 h-4" />
        <span className="hidden sm:inline">Quick Edit</span>
      </Button>
    </div>
  );
};

export default AdminQuickEdit;
