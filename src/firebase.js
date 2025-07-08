import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { calculateAvailableSeatsByDay } from './utils/transportUtils';
import { runTransaction } from "firebase/firestore";


// Configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyByiLjQUyWVEUcApza0f6yXjnkxckBqwoo",
  authDomain: "projectmatey.firebaseapp.com",
  projectId: "projectmatey",
  storageBucket: "projectmatey.appspot.com",
  messagingSenderId: "151220406291",
  appId: "1:151220406291:web:c3d8aab13b033de65357e6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);  // export db
export const storage = getStorage(app);  // Initialize Firebase Storage


// read the profiles and show in the attendance table
export const fetchAllProfiles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
};


// add profile
export const addProfile = async (profile) => {
  try {
    const profileRef = doc(db, 'profiles', profile.id);
    await setDoc(profileRef, profile);
    console.log('Profile added successfully');
    return true;
  } catch (error) {
    console.error('Error adding profile: ', error);
    throw error;
  }
};

export const deleteProfile = async (profileId) => {
  try {
    await deleteDoc(doc(db, 'profiles', profileId)); // ✅ This deletes from Firestore
    console.log("Deleted user with ID:", profileId);
  } catch (error) {
    console.error("Error deleting profile:", error);
  }
};


// Save attendance for a specific day
export const saveAttendanceForDate = async (dateStr, attendanceList) => {
  try {
    await setDoc(doc(db, 'attendance', dateStr), {
      date: dateStr,
      attendanceList: attendanceList,
      timestamp: new Date()
    });

    console.log("Attendance saved for date:", dateStr);
  } catch (error) {
    console.error("Error saving attendance:", error);
  }
};

export const fetchAttendanceByDate = async (dateStr) => {
  try {
    const docRef = doc(db, "attendance", dateStr);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data(); // returns the object with attendanceList and date
    } else {
      console.log("No attendance for this date");
      return null;
    }
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return null;
  }
};

// Fetch schedule from document
export const fetchSchedule = async () => {
  try {
    const docRef = doc(db, 'schedules', 'weeklySchedule'); // collection 'schedules', doc 'weeklySchedule'
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return {}; // if no document - returns empty object
    }
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return {};
  }
};

// Save schedule to document
export const saveSchedule = async (schedule) => {
  try {
    const docRef = doc(db, 'schedules', 'weeklySchedule');
    await setDoc(docRef, schedule);
    console.log("Schedule saved successfully");
  } catch (error) {
    console.error("Error saving schedule:", error);
  }
};

// Functions for transports
export const transportService = {
  // Fetch all transports and listen for changes
  subscribeToTransports: (onUpdate, onError) => {
    const transportCollection = collection(db, 'transport');
    return onSnapshot(transportCollection, 
      (snapshot) => {
        const transportList = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          serialNumber: index + 1,  // adds serial number
          ...doc.data()
        }));
        onUpdate(transportList);
      },
      (error) => {
        console.error("Error fetching transports:", error);
        if (onError) onError(error);
      }
    );
  },

  addTemporaryReservation: async (transportId, reservation) => {
    try {
      const transportDocRef = doc(db, 'transport', transportId);
      
      // Fetches the document to update the array
      const transportSnap = await getDoc(transportDocRef);
      if (!transportSnap.exists()) {
        throw new Error("Transport not found");
      }

      const transportData = transportSnap.data();
      const currentReservations = transportData.tempReservations || [];

      // Adds the new reservation to the array
      const updatedReservations = [...currentReservations, reservation];

      // Updates the document with the new array
      await updateDoc(transportDocRef, {
        tempReservations: updatedReservations
      });

      return true;
    } catch (error) {
      console.error("Error adding temporary reservation:", error);
      throw error;
    }
  },

  // Add new transport
  addTransport: async (transportData) => {
    try {
      const counterRef = doc(db, 'counters', 'transportIdCounter');
  
      const newTransport = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let current = 0;
  
        if (counterSnap.exists()) {
          current = counterSnap.data().current || 0;
          transaction.update(counterRef, { current: current + 1 });
        } else {
          // Create counter for the first time
          transaction.set(counterRef, { current: 1 });
        }
  
        const nextId = current + 1;
        const newDocId = nextId.toString();  // מזהה כ־string
  
        const newDocRef = doc(db, 'transport', newDocId);  // ✅ מזהה המסמך = nextId
  
        transaction.set(newDocRef, {
          ...transportData,
          id: newDocId,             // מזהה בתוך המסמך
          transportId: nextId,      // שדה נוסף אם תרצי
          createdAt: serverTimestamp(),
          passengers: []
        });
  
        return {
          id: newDocId,
          transportId: nextId,
          ...transportData,
          passengers: []
        };
      });
  
      return newTransport;
  
    } catch (error) {
      console.error("שגיאה בהוספת הסעה עם מזהה עולה:", error);
      throw error;
    }
  },
  
  

  // עדכון הסעה קיימת
  updateTransport: async (transportId, updatedTransport) => {
    try {
      const transportDoc = doc(db, 'transport', transportId);
      
      // מביא את המידע הנוכחי של ההסעה כדי לשמור על הנוסעים
      const currentTransportDoc = await getDoc(transportDoc);
      const currentTransport = currentTransportDoc.data();
      
      // מיזוג המידע המעודכן עם המידע הקיים, שמירה על הנוסעים
      const mergedTransport = {
        ...updatedTransport,
        passengers: currentTransport.passengers || [],
        // חישוב מחדש של המקומות הפנויים לפי יום
        availableSeatsByDay: calculateAvailableSeatsByDay(
          updatedTransport.type,
          currentTransport.passengers || [],
          updatedTransport.days
        )
      };

      await updateDoc(transportDoc, mergedTransport);
      return mergedTransport;
    } catch (error) {
      console.error("Error updating transport:", error);
      throw error;
    }
  },

  // מחיקת הסעה
  deleteTransport: async (transportId) => {
    try {
      console.log("Deleting transport with ID:", transportId);

      await deleteDoc(doc(db, 'transport', transportId));
      return transportId;
    } catch (error) {
      console.error("Error deleting transport:", error);
      throw error;
    }
  },

  // עדכון נוסע בהסעה כאשר הפרופיל שלו משתנה
  updatePassengerInTransports: async (passengerId, updatedPassengerData) => {
    try {
      const transportsRef = collection(db, 'transport');
      const transportsSnapshot = await getDocs(transportsRef);
      
      const updatePromises = transportsSnapshot.docs
        .filter(doc => {
          const transport = doc.data();
          return transport.passengers?.some(p => p.id === passengerId);
        })
        .map(async doc => {
          const transport = doc.data();
          const updatedPassengers = transport.passengers.map(p => 
            p.id === passengerId 
              ? { ...p, ...updatedPassengerData }
              : p
          );

          // מעדכן את המקומות הפנויים לפי יום
          const availableSeatsByDay = calculateAvailableSeatsByDay(
            transport.type,
            updatedPassengers,
            transport.days
          );

          return updateDoc(doc.ref, {
            passengers: updatedPassengers,
            availableSeatsByDay
          });
        });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error updating passenger in transports:", error);
      throw error;
    }
  }
};

// פונקציות עבור transport_dates (הסעות לפי תאריך)
export const fetchTransportDates = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'transport_dates'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('שגיאה בשליפת transport_dates:', error);
    return [];
  }
};

export const fetchTransportsByDate = async (dateStr) => {
  try {
    const docRef = doc(db, 'transport_dates', dateStr);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data(); // מחזיר את האובייקט עם transports ו־date
    } else {
      console.log('אין הסעות לתאריך הזה');
      return null;
    }
  } catch (error) {
    console.error('שגיאה בשליפת הסעות לפי תאריך:', error);
    return null;
  }
};

export const saveTransportDate = async (dateStr, transportsList) => {
  try {
    await setDoc(doc(db, 'transport_dates', dateStr), {
      date: dateStr,
      transports: transportsList,
      timestamp: new Date()
    });
    console.log('הסעות נשמרו לתאריך:', dateStr);
  } catch (error) {
    console.error('שגיאה בשמירת הסעות לתאריך:', error);
  }
};

// פונקציות לניהול יישובים
export const citiesService = {
  // הבאת כל היישובים מהדאטהבייס
  fetchCities: async () => {
    try {
      const citiesRef = doc(db, 'settings', 'cities');
      const citiesSnap = await getDoc(citiesRef);
      
      if (citiesSnap.exists()) {
        return citiesSnap.data().cities || [];
      } else {
        // אם אין מסמך, יצירת אחד עם רשימת היישובים הראשונית
        const initialCities = [
          "צלפון","בקוע","טל שחר","כפר אוריה","תעוז","תרום","מסילת ציון","אשתאול","זנוח",
          "מחסיה","נחם","עג'ור"
        ];
        await setDoc(citiesRef, { cities: initialCities });
        return initialCities;
      }
    } catch (error) {
      console.error("שגיאה בשליפת יישובים:", error);
      return [];
    }
  },

  // האזנה לשינויים ברשימת היישובים
  subscribeToCities: (onUpdate, onError) => {
    const citiesRef = doc(db, 'settings', 'cities');
    return onSnapshot(citiesRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const cities = snapshot.data().cities || [];
          onUpdate(cities);
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        console.error("Error fetching cities:", error);
        if (onError) onError(error);
      }
    );
  },

  // הוספת יישוב חדש
  addCity: async (cityName) => {
    try {
      const citiesRef = doc(db, 'settings', 'cities');
      const citiesSnap = await getDoc(citiesRef);
      
      let currentCities = [];
      if (citiesSnap.exists()) {
        currentCities = citiesSnap.data().cities || [];
      }
      
      // בדיקה אם היישוב כבר קיים
      if (currentCities.includes(cityName)) {
        throw new Error('היישוב כבר קיים ברשימה');
      }
      
      // הוספת היישוב החדש
      const updatedCities = [...currentCities, cityName];
      await setDoc(citiesRef, { cities: updatedCities });
      
      return updatedCities;
    } catch (error) {
      console.error("שגיאה בהוספת יישוב:", error);
      throw error;
    }
  },

  // מחיקת יישוב
  deleteCity: async (cityName) => {
    try {
      const citiesRef = doc(db, 'settings', 'cities');
      const citiesSnap = await getDoc(citiesRef);
      
      if (!citiesSnap.exists()) {
        throw new Error('לא נמצאו יישובים');
      }
      
      const currentCities = citiesSnap.data().cities || [];
      const updatedCities = currentCities.filter(city => city !== cityName);
      
      await setDoc(citiesRef, { cities: updatedCities });
      
      return updatedCities;
    } catch (error) {
      console.error("שגיאה במחיקת יישוב:", error);
      throw error;
    }
  },

  // עדכון יישוב
  updateCity: async (oldCityName, newCityName) => {
    try {
      const citiesRef = doc(db, 'settings', 'cities');
      const citiesSnap = await getDoc(citiesRef);
      
      if (!citiesSnap.exists()) {
        throw new Error('לא נמצאו יישובים');
      }
      
      const currentCities = citiesSnap.data().cities || [];
      
      // בדיקה אם השם החדש כבר קיים
      if (currentCities.includes(newCityName) && oldCityName !== newCityName) {
        throw new Error('היישוב כבר קיים ברשימה');
      }
      
      const updatedCities = currentCities.map(city => 
        city === oldCityName ? newCityName : city
      );
      
      await setDoc(citiesRef, { cities: updatedCities });
      
      return updatedCities;
    } catch (error) {
      console.error("שגיאה בעדכון יישוב:", error);
      throw error;
    }
  }
};

