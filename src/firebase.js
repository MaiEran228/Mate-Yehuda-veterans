import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { calculateAvailableSeatsByDay } from './utils/transportUtils';

// קונפיגורציה ואתחול
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
export const db = getFirestore(app);  // חשוב! ייצוא של db
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
    console.error("שגיאה בשליפת פרופילים:", error);
    return [];
  }
};


// פונקציה להוספת פרופיל
export const addProfile = async (profile) => {
  try {
    await setDoc(doc(db, "profiles", profile.id), profile); // ❗ שימוש בתעודת זהות כ־Document ID
    console.log("Document saved with ID:", profile.id);
  } catch (e) {
    console.error("Error saving profile:", e);
  }
};

export const deleteProfile = async (profileId) => {
  try {
    await deleteDoc(doc(db, 'profiles', profileId)); // ✅ זה מוחק מ-Firestore
    console.log("Deleted user with ID:", profileId);
  } catch (error) {
    console.error("Error deleting profile:", error);
  }
};


// שמירת נוכחות ליום מסוים
export const saveAttendanceForDate = async (dateStr, attendanceList) => {
  try {
    await setDoc(doc(db, 'attendance', dateStr), {
      date: dateStr,
      attendanceList: attendanceList,
      timestamp: new Date()
    });

    console.log("נוכחות נשמרה לתאריך:", dateStr);
  } catch (error) {
    console.error("שגיאה בשמירת נוכחות:", error);
  }
};

export const fetchAttendanceByDate = async (dateStr) => {
  try {
    const docRef = doc(db, "attendance", dateStr);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data(); // מחזיר את האובייקט עם attendanceList ו־date
    } else {
      console.log("אין נוכחות לתאריך הזה");
      return null;
    }
  } catch (error) {
    console.error("שגיאה בשליפת נוכחות:", error);
    return null;
  }
};

// פונקציה לעדכון פרופיל קיים
export const updateProfile = async (profileId, updatedData) => {
  try {
    // יצירת רפרנס למסמך
    const profileRef = doc(db, 'profiles', profileId);
    
    // עדכון המסמך
    await updateDoc(profileRef, updatedData);
    
    console.log('Profile updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating profile: ', error);
    throw error;
  }
};


// טען מערכת שעות מהמסמך
export const fetchSchedule = async () => {
  try {
    const docRef = doc(db, 'schedules', 'weeklySchedule'); // collection 'schedules', doc 'weeklySchedule'
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return {}; // אם אין מסמך - מחזיר אובייקט ריק
    }
  } catch (error) {
    console.error("שגיאה בשליפת מערכת השעות:", error);
    return {};
  }
};

// שמור מערכת שעות למסמך
export const saveSchedule = async (schedule) => {
  try {
    const docRef = doc(db, 'schedules', 'weeklySchedule');
    await setDoc(docRef, schedule);
    console.log("מערכת השעות נשמרה בהצלחה");
  } catch (error) {
    console.error("שגיאה בשמירת מערכת השעות:", error);
  }
};

// פונקציות עבור הסעות
export const transportService = {
  // הבאת כל ההסעות והאזנה לשינויים
  subscribeToTransports: (onUpdate, onError) => {
    const transportCollection = collection(db, 'transport');
    return onSnapshot(transportCollection, 
      (snapshot) => {
        const transportList = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          serialNumber: index + 1,  // מוסיף מספר סידורי
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

  // הוספת הסעה חדשה
  addTransport: async (transportData) => {
    try {
      const transportCollection = collection(db, 'transport');
      const docRef = await addDoc(transportCollection, {
        ...transportData,
        createdAt: serverTimestamp(),
        passengers: []
      });
      return { id: docRef.id, ...transportData };
    } catch (error) {
      console.error("Error adding transport:", error);
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