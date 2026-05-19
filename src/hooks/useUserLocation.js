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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch('https://ipapi.co/json/', { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        const countryCode = data.country_code || 'US';
        const flag = countryCode
          .toUpperCase()
          .split('')
          .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
          .join('');

        setLocation({
          ip: data.ip || 'Unknown',
          country: data.country_name || 'Unknown',
          city: data.city || 'Unknown',
          countryCode,
          flag,
          loading: false,
        });
      } catch (error) {
        setLocation({
          ip: null,
          country: null,
          countryCode: 'US',
          flag: '🇺🇸',
          loading: false,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    fetchLocation();
  }, []);

  return location;
}