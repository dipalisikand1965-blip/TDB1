/**
 * PillarServicesTab - Reusable component for showing services in pillar managers
 * Fetches services from Service Box filtered by pillar
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Briefcase, Search, Plus, Edit, Trash2, RefreshCw, 
  Loader2, Eye, EyeOff, DollarSign, Clock, Check,
  Phone, Star, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

const PillarServicesTab = ({ pillar, pillarName, pillarIcon, pillarColor = 'bg-purple-500' }) => {
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showInactive, setShowInactive] = useState(true); // show inactive by default
  const [togglingId, setTogglingId] = useState(null);

  // Toggle active/inactive for a service
  const toggleServiceActive = async (service) => {
    setTogglingId(service.id);
    try {
      const newIsActive = !(service.is_active !== false);
      const serviceData = { ...service, is_active: newIsActive };
      // Remove MongoDB internals
      delete serviceData._id;
      const res = await fetch(`${API_URL}/api/service-box/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (res.ok) {
        // Update local state immediately
        setServices(prev => prev.map(s =>
          s.id === service.id ? { ...s, is_active: newIsActive } : s
        ));
        toast({ title: newIsActive ? 'Service Activated' : 'Service Deactivated', description: service.name });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.detail || 'Failed to update status', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };
  
  // Fetch services assigned to this pillar (exact pillar match only)
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ONLY services with this exact pillar assignment
      const response = await fetch(
        `${API_URL}/api/service-box/services?limit=500&pillar=${encodeURIComponent(pillar)}`
      );
      if (response.ok) {
        const data = await response.json();
        const pillarServices = data.services || [];
        setServices(pillarServices);
        setAllServices(pillarServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({ title: 'Error', description: 'Failed to load services', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [pillar]);
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  // Filter services by search term
  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm === '' || 
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = service.is_active !== false && service.active !== false;
    const matchesActive = showInactive ? true : isActive;
    return matchesSearch && matchesActive;
  });
  
  // Assign service to this pillar
  const assignToPillar = async (service) => {
    try {
      // Get the full service data first
      const serviceData = {
        ...service,
        pillar: pillar,  // Set the new pillar
        description: service.description || '',
        base_price: service.base_price || service.price || 0,
        duration_minutes: service.duration_minutes || 60,
        city_pricing: service.city_pricing || {},
        pet_size_pricing: service.pet_size_pricing || {},
        pet_count_pricing: service.pet_count_pricing || {},
        deposit_percentage: service.deposit_percentage || 20,
        payment_timing: service.payment_timing || 'configurable',
        available_cities: service.available_cities || [],
        available_days: service.available_days || [],
        available_time_slots: service.available_time_slots || [],
        includes: service.includes || [],
        add_ons: service.add_ons || [],
        image_url: service.image_url || service.image || '',
        paw_points_eligible: service.paw_points_eligible !== false,
        paw_points_value: service.paw_points_value || 10,
        is_active: service.is_active !== false,
        is_bookable: service.is_bookable !== false,
        requires_consultation: service.requires_consultation || false,
        is_free: service.is_free || false,
        is_24x7: service.is_24x7 || false
      };
      
      const response = await fetch(`${API_URL}/api/service-box/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      if (response.ok) {
        toast({ title: 'Success', description: `Service assigned to ${pillarName}` });
        fetchServices();
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.detail || 'Failed to assign service', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to assign service', variant: 'destructive' });
    }
  };
  
  // Render service card
  const ServiceCard = ({ service }) => {
    const isActive = service.is_active || service.active;
    const isFree = service.free || (service.price === 0 && service.base_price === 0);
    const isBookable = service.bookable;
    const is24x7 = service.available_24x7;
    
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          {/* Service Image */}
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
            {(service.image_url || service.watercolor_image || service.image) ? (
              <img
                src={service.image_url || service.watercolor_image || service.image}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${pillarColor} flex items-center justify-center`}>
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          
          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate">{service.name}</h4>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {service.description || 'No description'}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {isFree && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                  Free
                </Badge>
              )}
              {isBookable && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                  Bookable
                </Badge>
              )}
              {is24x7 && (
                <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                  24×7
                </Badge>
              )}
              {service.provider && (
                <Badge variant="outline" className="text-xs text-gray-600">
                  {service.provider}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Price & Actions */}
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
            <div className="text-lg font-bold text-gray-900">
              {isFree ? 'Free' : `₹${service.price || service.base_price || 0}`}
            </div>
            {/* Active/Inactive toggle */}
            <button
              onClick={() => toggleServiceActive(service)}
              disabled={togglingId === service.id}
              title={isActive ? 'Click to deactivate' : 'Click to activate'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {togglingId === service.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isActive ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {isActive ? 'Active' : 'Inactive'}
            </button>
            {service.pillar !== pillar && (
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs"
                onClick={() => assignToPillar(service)}
              >
                Assign to {pillarName}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading services...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>{pillarIcon}</span> {pillarName} Services
          </h3>
          <p className="text-sm text-gray-500">
            {filteredServices.length} services found
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchServices}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={!showInactive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
          className={!showInactive ? "bg-green-600 hover:bg-green-700 text-white" : ""}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          {showInactive ? 'Active Only' : 'Show All'}
        </Button>
      </div>
      
      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="font-medium text-gray-900 mb-1">No {pillarName} services yet</h4>
          <p className="text-sm text-gray-500 mb-4">
            Services from the Service Box that match "{pillar}" will appear here
          </p>
          <Button variant="outline" size="sm" onClick={fetchServices}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
      
      {/* Info about unassigned services */}
      {allServices.length > 0 && services.length < allServices.length && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> There are {allServices.length - services.length} more services in the Service Box. 
            Visit the Service Box to assign them to {pillarName}.
          </p>
        </Card>
      )}
    </div>
  );
};

export default PillarServicesTab;
