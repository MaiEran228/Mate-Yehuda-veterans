import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
  // הבאת כל ההסעות
  getAllTransports: async () => {
    try {
      const transportCollection = collection(db, 'transport');
      const transportSnapshot = await getDocs(transportCollection);
      return transportSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching transports:", error);
      throw error;
    }
  },

  // הוספת הסעה חדשה
  addTransport: async (transportData) => {
    try {
      const transportCollection = collection(db, 'transport');
      const docRef = await addDoc(transportCollection, {
        ...transportData,
        createdAt: serverTimestamp(),
        passengers: [],
        availableSeats: transportData.seats
      });
      return { id: docRef.id, ...transportData };
    } catch (error) {
      console.error("Error adding transport:", error);
      throw error;
    }
  },

  // עדכון הסעה קיימת
  updateTransport: async (transportId, transportData) => {
    try {
      const transportDoc = doc(db, 'transport', transportId);
      await updateDoc(transportDoc, transportData);
      return { id: transportId, ...transportData };
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

  // חיפוש הסעות מתאימות לפרופיל
  findMatchingTransports: async (profileData) => {
    try {
      const transportQuery = query(
        collection(db, 'transport'),
        where('cities', 'array-contains', profileData.city),
        where('type', '==', profileData.transportType),
        where('availableSeats', '>', 0)
      );

      const matchingTransports = await getDocs(transportQuery);
      return matchingTransports.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(transport => 
          transport.days.some(day => profileData.transportDays.includes(day))
        );
    } catch (error) {
      console.error("Error finding matching transports:", error);
      throw error;
    }
  },

  // שיבוץ פרופיל להסעות מתאימות
  assignProfileToTransports: async (profileId) => {
    try {
      // מביאים את פרטי הפרופיל
      const profileDoc = await getDoc(doc(db, 'profiles', profileId));
      const profile = profileDoc.data();

      // מוצאים הסעות מתאימות
      const matchingTransports = await transportService.findMatchingTransports(profile);
      const assignedTransports = [];

      // מוסיפים את הפרופיל לכל הסעה מתאימה
      for (const transport of matchingTransports) {
        // מוסיפים את הנוסע להסעה
        await updateDoc(doc(db, 'transport', transport.id), {
          passengers: arrayUnion({
            profileId: profileId,
            name: profile.name,
            city: profile.city
          }),
          availableSeats: transport.availableSeats - 1
        });

        assignedTransports.push(transport.id);
      }

      // מעדכנים את הפרופיל עם ההסעות שהוקצו
      if (assignedTransports.length > 0) {
        await updateDoc(doc(db, 'profiles', profileId), {
          assignedTransports: arrayUnion(...assignedTransports)
        });
      }

      return assignedTransports;
    } catch (error) {
      console.error("Error assigning profile to transports:", error);
      throw error;
    }
  },

  // הסרת נוסע מהסעה
  removePassengerFromTransport: async (transportId, profileId) => {
    try {
      const transportDoc = doc(db, 'transport', transportId);
      const transport = await getDoc(transportDoc);
      const transportData = transport.data();

      // מסירים את הנוסע מההסעה
      const updatedPassengers = transportData.passengers.filter(
        p => p.profileId !== profileId
      );

      await updateDoc(transportDoc, {
        passengers: updatedPassengers,
        availableSeats: transportData.availableSeats + 1
      });

      // מסירים את ההסעה מהפרופיל
      await updateDoc(doc(db, 'profiles', profileId), {
        assignedTransports: arrayRemove(transportId)
      });

      return { transportId, profileId };
    } catch (error) {
      console.error("Error removing passenger from transport:", error);
      throw error;
    }
  },

  // בדיקה אם פרופיל יכול להצטרף להסעה
  canJoinTransport: async (transportId, profileId) => {
    try {
      const [transport, profile] = await Promise.all([
        getDoc(doc(db, 'transport', transportId)),
        getDoc(doc(db, 'profiles', profileId))
      ]);

      const transportData = transport.data();
      const profileData = profile.data();

      return {
        canJoin: 
          transportData.availableSeats > 0 &&
          transportData.cities.includes(profileData.city) &&
          transportData.type === profileData.transportType &&
          transportData.days.some(day => profileData.transportDays.includes(day)),
        reason: transportData.availableSeats === 0 ? 'אין מקומות פנויים' :
                !transportData.cities.includes(profileData.city) ? 'היישוב לא נמצא במסלול ההסעה' :
                transportData.type !== profileData.transportType ? 'סוג ההסעה לא מתאים' :
                !transportData.days.some(day => profileData.transportDays.includes(day)) ? 'אין התאמה בימים' : ''
      };
    } catch (error) {
      console.error("Error checking if profile can join transport:", error);
      throw error;
    }
  }
};