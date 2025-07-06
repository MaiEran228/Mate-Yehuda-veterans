import { useState, useEffect } from 'react';
import { citiesService } from '../firebase';

export const useCities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // טעינת רשימת היישובים
  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const citiesList = await citiesService.fetchCities();
      setCities(citiesList);
    } catch (err) {
      setError(err.message);
      console.error('שגיאה בטעינת יישובים:', err);
    } finally {
      setLoading(false);
    }
  };

  // הוספת יישוב חדש
  const addCity = async (cityName) => {
    try {
      setError(null);
      await citiesService.addCity(cityName);
      await loadCities(); // רענון הרשימה
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // מחיקת יישוב
  const deleteCity = async (cityName) => {
    try {
      setError(null);
      await citiesService.deleteCity(cityName);
      await loadCities(); // רענון הרשימה
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // עדכון יישוב
  const updateCity = async (oldCityName, newCityName) => {
    try {
      setError(null);
      await citiesService.updateCity(oldCityName, newCityName);
      await loadCities(); // רענון הרשימה
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // האזנה לשינויים ברשימת היישובים
  useEffect(() => {
    const unsubscribe = citiesService.subscribeToCities(
      (updatedCities) => {
        setCities(updatedCities);
        setError(null);
      },
      (err) => {
        setError(err.message);
        console.error('שגיאה בהאזנה ליישובים:', err);
      }
    );

    // טעינה ראשונית
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