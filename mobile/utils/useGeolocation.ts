import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLocation(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const errorMsg = 'Location permission is required';
        setError(errorMsg);
        Alert.alert('Permission Denied', errorMsg);
        return null;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = currentLocation.coords;

        let address: string;
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          address = reverseGeocode[0]
            ? `${reverseGeocode[0].city}, ${reverseGeocode[0].region}`
            : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } catch (err) {
          address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        const locationData = { latitude, longitude, address };
        setLocation(locationData);
        return locationData;
      } catch (err) {
        const errorMsg = 'Failed to get location';
        setError(errorMsg);
        Alert.alert('Error', errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = 'Failed to request location permission';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    requestLocation,
  };
};
