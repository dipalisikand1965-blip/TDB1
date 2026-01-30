import React from 'react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Edit3, Settings } from 'lucide-react';

/**
 * AdminQuickEdit - A floating button for admins to quickly edit pillar page content
 * Positioned at top-right on desktop, hidden on mobile to avoid overlap with Mira/Contact
 * 
 * Usage:
 * <AdminQuickEdit pillar="celebrate" />
 */
const AdminQuickEdit = ({ pillar, position = 'top-right' }) => {
  const { user } = useAuth();
  
  // Only show for admin users
  const isAdmin = user?.role === 'admin' || 
                  user?.email?.includes('admin') || 
                  user?.email === 'aditya@thedoggycompany.in' ||
                  user?.email === 'dipali@clubconcierge.in';
  
  if (!isAdmin) return null;
  
  const handleClick = () => {
    window.open(`/admin?tab=page-cms&page=${pillar}`, '_blank');
  };
  
  return (
    <>
      {/* Desktop: Fixed button at top-right, below navbar */}
      <div className="fixed top-24 right-6 z-40 hidden lg:block">
        <Button
          onClick={handleClick}
          size="sm"
          className="bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-white hover:text-purple-600 shadow-lg flex items-center gap-2 transition-all hover:shadow-xl"
          title={`Edit ${pillar} page content`}
          data-testid={`admin-quick-edit-${pillar}`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Page</span>
        </Button>
      </div>
      
      {/* Tablet: Smaller icon button */}
      <div className="fixed top-24 right-4 z-40 hidden md:block lg:hidden">
        <Button
          onClick={handleClick}
          size="icon"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm shadow-md h-9 w-9"
          title={`Edit ${pillar} page`}
          data-testid={`admin-quick-edit-${pillar}-tablet`}
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </Button>
      </div>
    </>
  );
};

export default AdminQuickEdit;
