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
        const response = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,city,query');
        const data = await response.json();

        const countryCode = data.countryCode || 'US';
        const flag = countryCode
          .toUpperCase()
          .split('')
          .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
          .join('');

        setLocation({
          ip: data.query || 'Unknown',
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
          countryCode,
          flag,
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