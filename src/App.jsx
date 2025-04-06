// src/App.jsx
import React, { useState, useEffect } from 'react';
import { addProfile, getProfiles } from './firebase'; // פונקציות מקובץ firebase.js

const App = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // קריאת כל הפרופילים ברגע שהקומפוננטה נטענת
    getProfiles();
  }, []);

  const handleAddProfile = () => {
    // בדיקה אם כל השדות מלאים
    if (!name || !age || !email) {
      alert("נא למלא את כל השדות");
      return;
    }

    const newProfile = {
      name,
      age: parseInt(age), // המרת גיל למספר
      email,
    };
    addProfile(newProfile);
    // ניקוי השדות אחרי הוספת פרופיל
    setName('');
    setAge('');
    setEmail('');
  };

  return (
    <div>
      <h1>ברוך הבא לאפליקציה שלי</h1>
      
      <div>
        <label>שם:</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="הכנס שם"
        />
      </div>

      <div>
        <label>גיל:</label>
        <input 
          type="number" 
          value={age} 
          onChange={(e) => setAge(e.target.value)} 
          placeholder="הכנס גיל"
        />
      </div>

      <div>
        <label>אימייל:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="הכנס אימייל"
        />
      </div>

      <button onClick={handleAddProfile}>הוסף פרופיל</button>
    </div>
  );
};

export default App;
