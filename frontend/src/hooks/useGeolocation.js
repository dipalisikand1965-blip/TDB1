/**
 * useGeolocation - Auto-detect and save user location on login
 * 
 * Uses browser Geolocation API with Google reverse geocoding fallback.
 * Saves location to user profile for location-aware concierge services.
 */
import { useCallback, useEffect, useRef } from 'react';
import { API_URL } from '../utils/api';

const useGeolocation = (token, isAuthenticated) => {
  const hasDetectedRef = useRef(false);
  
  const detectAndSaveLocation = useCallback(async () => {
    if (!token || !isAuthenticated || hasDetectedRef.current) return;
    
    hasDetectedRef.current = true;
    console.log('[GEO] 🌍 Starting location detection...');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log('[GEO] Browser does not support geolocation');
      return;
    }
    
    try {
      // Get position from browser
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 mins
        });
      });
      
      const { latitude, longitude } = position.coords;
      console.log(`[GEO] 📍 Got coordinates: ${latitude}, ${longitude}`);
      
      // Reverse geocode using our backend (uses Google API)
      let city = null, state = null, country = null;
      
      try {
        const geoResponse = await fetch(
          `${API_URL}/api/geo/reverse?lat=${latitude}&lng=${longitude}`
        );
        const geoData = await geoResponse.json();
        
        if (geoData.success) {
          city = geoData.city;
          state = geoData.state;
          country = geoData.country;
          console.log(`[GEO] ✅ Reverse geocoded via ${geoData.source}: ${city}, ${state}`);
        }
      } catch (geoError) {
        console.log('[GEO] Reverse geocode failed, saving coords only');
      }
      
      // Save to user profile
      const saveResponse = await fetch(`${API_URL}/api/member/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude,
          longitude,
          city,
          state,
          country,
          source: 'auto'
        })
      });
      
      const saveData = await saveResponse.json();
      
      if (saveData.success) {
        console.log(`[GEO] ✅ Location saved to profile: ${city || 'Unknown'}`);
      }
      
    } catch (error) {
      if (error.code === 1) {
        console.log('[GEO] User denied location permission');
      } else if (error.code === 2) {
        console.log('[GEO] Position unavailable');
      } else if (error.code === 3) {
        console.log('[GEO] Location timeout');
      } else {
        console.log('[GEO] Error:', error.message);
      }
      
      // Fallback: Try IP-based geolocation
      try {
        const ipResponse = await fetch('https://ipapi.co/json/', { timeout: 5000 });
        const ipData = await ipResponse.json();
        
        if (ipData.city) {
          console.log(`[GEO] 📍 IP-based location: ${ipData.city}, ${ipData.region}`);
          
          // Save IP-based location
          await fetch(`${API_URL}/api/member/location`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              latitude: ipData.latitude,
              longitude: ipData.longitude,
              city: ipData.city,
              state: ipData.region,
              country: ipData.country_name,
              source: 'ip'
            })
          });
          
          console.log('[GEO] ✅ IP location saved');
        }
      } catch (ipError) {
        console.log('[GEO] IP geolocation also failed');
      }
    }
  }, [token, isAuthenticated]);
  
  // Detect location when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      // Slight delay to not block login UX
      const timer = setTimeout(() => {
        detectAndSaveLocation();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token, detectAndSaveLocation]);
  
  return { detectAndSaveLocation };
};

export default useGeolocation;
