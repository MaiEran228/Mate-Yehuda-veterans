import { collection, getDocs, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Calculates the number of available seats in the transport
 * @param {string} type - Type of transport (Minibus/Taxi)
 * @param {Array} passengers - List of passengers
 * @returns {number} - Number of available seats
 */
const calculateAvailableSeats = (type, passengers = []) => {
  const totalSeats = type === 'מיניבוס' ? 14 : 4;
  const occupiedSeats = passengers.reduce((total, passenger) => {
    // Each passenger takes one seat, and if they have a caregiver, then one more seat
    return total + (passenger.hasCaregiver ? 2 : 1);
  }, 0);
  return totalSeats - occupiedSeats;
};

/**
 * Calculates the number of available seats in the transport by day
 * @param {string} type - Type of transport (Minibus/Taxi)
 * @param {Array} passengers - List of passengers
 * @param {Array} days - Transport days
 * @returns {Object} - Object with the number of available seats for each day
 */
export const calculateAvailableSeatsByDay = (transportType, passengers, days) => {
  // Fixes the transport types to match the interface
  const totalSeats = transportType === 'מונית' ? 4 : 14; // Taxi = 4, Minibus = 14
  const availableSeatsByDay = {};

  days.forEach(day => {
    const passengersForDay = (passengers || []).filter(p => (p.arrivalDays || []).includes(day));
    const seatsNeeded = passengersForDay.reduce((total, p) => total + (p.hasCaregiver ? 2 : 1), 0);
    availableSeatsByDay[day] = totalSeats - seatsNeeded;
  });
  
  return availableSeatsByDay;
};

/**
 * Finds matching transports by days and city
 * @param {string[]} arrivalDays - User's arrival days
 * @param {string} city - City of residence
 * @param {string} needsTransport - Type of transport (Minibus/Taxi)
 * @param {boolean} hasCaregiver - Whether has a caregiver
 * @returns {Promise<Array<{id: string, cities: string[], days: string[], type: string, passengers: any[]}>>}
 */
export const findMatchingTransports = async (arrivalDays, city, needsTransport, hasCaregiver = false) => {
  if (!needsTransport || !city || !arrivalDays || arrivalDays.length === 0) {
    return [];
  }

  try {
    const transportsRef = collection(db, 'transport');
    const querySnapshot = await getDocs(transportsRef);
    
    // First, map all transports with a serial number
    const allTransports = querySnapshot.docs.map((doc, index) => ({
      id: doc.id,
      serialNumber: index + 1,
      ...doc.data()
    }));
    
    // Then filter the matching transports
    const matchingTransports = allTransports.filter(transport => {
      // Checks if the transport type matches
      if (transport.type !== needsTransport) {
        return false;
      }

      // Checks that all the passenger's arrival days are included in the transport days
      const allDaysIncluded = arrivalDays.every(day => transport.days.includes(day));
      if (!allDaysIncluded) {
        return false;
      }

      // Checks if the city is in the transport route
      const isInRoute = transport.cities.includes(city);
      
      // Checks if there is an available seat in the transport on the relevant days
      const hasAvailableSeats = arrivalDays.every(day => {
        const availableSeats = transport.availableSeatsByDay?.[day] ?? transport.seats;
        const seatsNeeded = hasCaregiver ? 2 : 1;
        return availableSeats >= seatsNeeded;
      });

      return allDaysIncluded && isInRoute && hasAvailableSeats;
    });

    return matchingTransports;
  } catch (error) {
    console.error('Error finding matching transports:', error);
    throw error;
  }
};

/**
 * Updates a transport with a new passenger
 * @param {string} transportId - Transport ID
 * @param {Object} passengerData - Passenger details
 */
export const addPassengerToTransport = async (transportId, passengerData) => {
  try {
    const transportRef = doc(db, 'transport', transportId);
    const transportDoc = await getDoc(transportRef);
    
    if (!transportDoc.exists()) {
      throw new Error('Transport not found');
    }

    const transport = transportDoc.data();
    
    // Checks if the passenger already exists in the transport
    const existingPassenger = transport.passengers?.find(p => p.id === passengerData.id);
    if (existingPassenger) {
      // If the passenger exists, update their details
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
      // If the passenger is new, add them to the transport
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
 * Removes a passenger from all transports they are assigned to
 * @param {string} passengerId - Passenger ID to remove
 */
export const removePassengerFromTransports = async (passengerId) => {
  try {
    const transportsRef = collection(db, 'transport');
    const transportsSnapshot = await getDocs(transportsRef);
    
    // Goes through all transports and looks for the passenger
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

    // Waits for all updates to finish
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error removing passenger from transports:', error);
    throw error;
  }
};

/**
 * Returns the transport details of a specific passenger
 * @param {string} passengerId - Passenger ID
 * @returns {Promise<{id: string, serialNumber: number, cities: string[]} | null>}
 */
export const getPassengerTransport = async (passengerId) => {
  try {
    const transportsRef = collection(db, 'transport');
    const querySnapshot = await getDocs(transportsRef);
    
    // Adds a serial number to all transports
    const transports = querySnapshot.docs.map((doc, index) => ({
      id: doc.id,
      serialNumber: index + 1,
      ...doc.data()
    }));

    // Finds the transport of the passenger
    const transport = transports.find(t => t.passengers?.some(p => p.id === passengerId));
    return transport || null;
  } catch (error) {
    console.error('Error getting passenger transport:', error);
    throw error;
  }
}; 