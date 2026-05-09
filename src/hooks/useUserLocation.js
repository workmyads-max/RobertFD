import { useState, useEffect } from 'react';

export function useUserLocation() {
  const [location, setLocation] = useState({
    ip: null,
    country: null,
    countryCode: null,
    flag: null,
    loading: true,
  });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Fetch IP and location data from ipapi
        const response = await fetch('https://ipapi.co/json/', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        
        // Get flag emoji from country code
        const countryCode = data.country_code || 'US';
        const flag = countryCode
          .toUpperCase()
          .split('')
          .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
          .join('');
        
        setLocation({
          ip: data.ip || 'Unknown',
          country: data.country_name || 'Unknown',
          countryCode: countryCode,
          flag: flag,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to fetch location:', error);
        setLocation(prev => ({ ...prev, loading: false }));
      }
    };

    fetchLocation();
  }, []);

  return location;
}