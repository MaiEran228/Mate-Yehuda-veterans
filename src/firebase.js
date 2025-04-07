// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";


// הגדרת קונפיגורציה של Firebase
const firebaseConfig = {
  apiKey: "AIzaSyByiLjQUyWVEUcApza0f6yXjnkxckBqwoo",
  authDomain: "projectmatey.firebaseapp.com",
  projectId: "projectmatey",
  storageBucket: "projectmatey.firebasestorage.app",
  messagingSenderId: "151220406291",
  appId: "1:151220406291:web:c3d8aab13b033de65357e6"
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// פונקציה להוספת פרופיל
export const addProfile = async (profile) => {
  try {
    const docRef = await addDoc(collection(db, "profiles"), profile);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

// פונקציה לקרוא את כל הפרופילים
export const getProfiles = async () => {
  const querySnapshot = await getDocs(collection(db, "profiles"));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
};

 
// פונקציה להבאת פרופילים בגיל מעל 25
export const getProfilesOver24 = async () => {
  const q = query(
    collection(db, "profiles"),
    where("age", ">=", 24)
  );

  const querySnapshot = await getDocs(q);
  const results = [];

  querySnapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() });
  });

  
  return results;
};

export const getProfilesunder25 = async () => {
  const q = query(
    collection(db, "profiles"),
    where("age", "<=", 24)
  );

  const querySnapshot = await getDocs(q);
  const results = [];

  querySnapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() });
  });

  
  return results;
};