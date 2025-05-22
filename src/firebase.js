import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
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
    const docRef = await addDoc(collection(db, "profiles"), profile);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
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