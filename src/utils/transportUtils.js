import { collection, query, where, getDocs, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * מחשב את מספר המקומות הפנויים בהסעה
 * @param {string} type - סוג ההסעה (מיניבוס/מונית)
 * @param {Array} passengers - רשימת הנוסעים
 * @returns {number} - מספר המקומות הפנויים
 */
const calculateAvailableSeats = (type, passengers = []) => {
  const totalSeats = type === 'מיניבוס' ? 14 : 4;
  const occupiedSeats = passengers.reduce((total, passenger) => {
    // כל נוסע תופס מקום אחד, ואם יש לו מטפל אז עוד מקום
    return total + (passenger.hasCaregiver ? 2 : 1);
  }, 0);
  return totalSeats - occupiedSeats;
};

/**
 * מחשב את מספר המקומות הפנויים בהסעה לפי יום
 * @param {string} type - סוג ההסעה (מיניבוס/מונית)
 * @param {Array} passengers - רשימת הנוסעים
 * @param {Array} days - ימי ההסעה
 * @returns {Object} - אובייקט עם מספר המקומות הפנויים לכל יום
 */
export const calculateAvailableSeatsByDay = (transportType, passengers, days) => {
  // מתקן את סוגי ההסעות להתאים לממשק
  const totalSeats = transportType === 'מונית' ? 4 : 14; // מונית = 4, מיניבוס = 14
  const availableSeatsByDay = {};

  days.forEach(day => {
    const passengersForDay = passengers.filter(p => p.arrivalDays.includes(day));
    const seatsNeeded = passengersForDay.reduce((total, p) => total + (p.hasCaregiver ? 2 : 1), 0);
    availableSeatsByDay[day] = totalSeats - seatsNeeded;
  });

  return availableSeatsByDay;
};

/**
 * מחפש הסעות מתאימות לפי ימים ועיר
 * @param {string[]} arrivalDays - ימי ההגעה של המשתמש
 * @param {string} city - עיר המגורים
 * @param {string} needsTransport - סוג ההסעה (מיניבוס/מונית)
 * @param {boolean} hasCaregiver - האם יש מטפל
 * @returns {Promise<Array<{id: string, cities: string[], days: string[], type: string, passengers: any[]}>>}
 */
export const findMatchingTransports = async (arrivalDays, city, needsTransport, hasCaregiver = false) => {
  if (!needsTransport || !city || !arrivalDays || arrivalDays.length === 0) {
    return [];
  }

  try {
    const transportsRef = collection(db, 'transport');
    const querySnapshot = await getDocs(transportsRef);
    
    // קודם ממפה את כל ההסעות עם מספר סידורי
    const allTransports = querySnapshot.docs.map((doc, index) => ({
      id: doc.id,
      serialNumber: index + 1,
      ...doc.data()
    }));
    
    // אז מסנן את ההסעות המתאימות
    const matchingTransports = allTransports.filter(transport => {
      // בודק אם סוג ההסעה מתאים
      if (transport.type !== needsTransport) {
        return false;
      }

      // בודק אם יש חפיפה בימים
      const hasMatchingDays = arrivalDays.some(day => transport.days.includes(day));
      
      // בודק אם היישוב נמצא במסלול ההסעה
      const isInRoute = transport.cities.includes(city);
      
      // בודק אם יש מקום פנוי בהסעה בימים הרלוונטיים
      const hasAvailableSeats = arrivalDays.every(day => {
        const availableSeats = transport.availableSeatsByDay?.[day] ?? transport.seats;
        const seatsNeeded = hasCaregiver ? 2 : 1;
        return availableSeats >= seatsNeeded;
      });

      return hasMatchingDays && isInRoute && hasAvailableSeats;
    });

    return matchingTransports;
  } catch (error) {
    console.error('Error finding matching transports:', error);
    throw error;
  }
};

/**
 * מעדכן הסעה עם נוסע חדש
 * @param {string} transportId - מזהה ההסעה
 * @param {Object} passengerData - פרטי הנוסע
 */
export const addPassengerToTransport = async (transportId, passengerData) => {
  try {
    const transportRef = doc(db, 'transport', transportId);
    const transportDoc = await getDoc(transportRef);
    
    if (!transportDoc.exists()) {
      throw new Error('Transport not found');
    }

    const transport = transportDoc.data();
    
    // בודק אם הנוסע כבר קיים בהסעה
    const existingPassenger = transport.passengers?.find(p => p.id === passengerData.id);
    if (existingPassenger) {
      // אם הנוסע קיים, מעדכן את הפרטים שלו
      const updatedPassengers = transport.passengers.map(p =>
        p.id === passengerData.id ? { ...p, ...passengerData } : p
      );
      
      await updateDoc(transportRef, {
        passengers: updatedPassengers,
        availableSeatsByDay: calculateAvailableSeatsByDay(
          transport.type,
          updatedPassengers,
          transport.days
        )
      });
    } else {
      // אם הנוסע חדש, מוסיף אותו להסעה
      await updateDoc(transportRef, {
        passengers: arrayUnion(passengerData),
        availableSeatsByDay: calculateAvailableSeatsByDay(
          transport.type,
          [...(transport.passengers || []), passengerData],
          transport.days
        )
      });
    }
  } catch (error) {
    console.error('Error adding passenger to transport:', error);
    throw error;
  }
};

/**
 * מוחק נוסע מכל ההסעות שהוא משובץ בהן
 * @param {string} passengerId - מזהה הנוסע למחיקה
 */
export const removePassengerFromTransports = async (passengerId) => {
  try {
    const transportsRef = collection(db, 'transport');
    const transportsSnapshot = await getDocs(transportsRef);
    
    // עובר על כל ההסעות ומחפש את הנוסע
    const updatePromises = transportsSnapshot.docs
      .filter(doc => {
        const transport = doc.data();
        return transport.passengers?.some(p => p.id === passengerId);
      })
      .map(async doc => {
        const transport = doc.data();
        const newPassengers = transport.passengers.filter(p => p.id !== passengerId);
        const availableSeats = calculateAvailableSeats(transport.type, newPassengers);
        
        return updateDoc(doc.ref, {
          passengers: newPassengers,
          availableSeats: availableSeats
        });
      });

    // מחכה שכל העדכונים יסתיימו
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error removing passenger from transports:', error);
    throw error;
  }
};

/**
 * מחזיר את פרטי ההסעה של נוסע מסוים
 * @param {string} passengerId - מזהה הנוסע
 * @returns {Promise<{id: string, serialNumber: number, cities: string[]} | null>}
 */
export const getPassengerTransport = async (passengerId) => {
  try {
    const transportsRef = collection(db, 'transport');
    const querySnapshot = await getDocs(transportsRef);
    
    // מוסיף מספר סידורי לכל ההסעות
    const transports = querySnapshot.docs.map((doc, index) => ({
      id: doc.id,
      serialNumber: index + 1,
      ...doc.data()
    }));

    // מחפש את ההסעה של הנוסע
    const transport = transports.find(t => t.passengers?.some(p => p.id === passengerId));
    return transport || null;
  } catch (error) {
    console.error('Error getting passenger transport:', error);
    throw error;
  }
}; 