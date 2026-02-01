// Dashboard Tab Components - Lazy loaded to improve performance
import React from 'react';

// Export all tabs as lazy-loaded components
export const OverviewTab = React.lazy(() => import('./OverviewTab'));
export const ServicesTab = React.lazy(() => import('./ServicesTab'));
export const OrdersTab = React.lazy(() => import('./OrdersTab'));
export const PetsTab = React.lazy(() => import('./PetsTab'));
export const RequestsTab = React.lazy(() => import('./RequestsTab'));
export const SettingsTab = React.lazy(() => import('./SettingsTab'));
export const DiningTab = React.lazy(() => import('./DiningTab'));
export const CelebrationsTab = React.lazy(() => import('./CelebrationsTab'));
export const StayTab = React.lazy(() => import('./StayTab'));
export const TravelTab = React.lazy(() => import('./TravelTab'));
export const AutoshipTab = React.lazy(() => import('./AutoshipTab'));
export const ReviewsTab = React.lazy(() => import('./ReviewsTab'));
export const AddressesTab = React.lazy(() => import('./AddressesTab'));

// Tab loading fallback component
export const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
  </div>
);
