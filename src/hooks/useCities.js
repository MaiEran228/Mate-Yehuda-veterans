import { useState, useEffect } from 'react';
import { citiesService } from '../firebase';

export const useCities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load the list of cities
  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const citiesList = await citiesService.fetchCities();
      setCities(citiesList);
    } catch (err) {
      setError(err.message);
      console.error('Error loading cities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add a new city
  const addCity = async (cityName) => {
    try {
      setError(null);
      await citiesService.addCity(cityName);
      await loadCities(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete a city
  const deleteCity = async (cityName) => {
    try {
      setError(null);
      await citiesService.deleteCity(cityName);
      await loadCities(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update a city
  const updateCity = async (oldCityName, newCityName) => {
    try {
      setError(null);
      await citiesService.updateCity(oldCityName, newCityName);
      await loadCities(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Listen for changes in the list of cities
  useEffect(() => {
    const unsubscribe = citiesService.subscribeToCities(
      (updatedCities) => {
        setCities(updatedCities);
        setError(null);
      },
      (err) => {
        setError(err.message);
        console.error('Error listening to cities:', err);
      }
    );

    // Initial load
    loadCities();

    return unsubscribe;
  }, []);

  return {
    cities,
    loading,
    error,
    addCity,
    deleteCity,
    updateCity,
    loadCities
  };
}; 