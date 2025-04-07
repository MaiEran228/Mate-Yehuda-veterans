import React, { useState, useEffect } from 'react';
import { addProfile, getProfilesOver25 } from './firebase';

const App = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [filteredProfiles, setFilteredProfiles] = useState([]);

  useEffect(() => {
    const fetchFiltered = async () => {
      const results = await getProfilesOver25();
      setFilteredProfiles(results);
    };

    fetchFiltered();
  }, []);

  const handleAddProfile = () => {
    if (!name || !age || !email) {
      alert("נא למלא את כל השדות");
      return;
    }

    const newProfile = {
      name,
      age: parseInt(age),
      email,
    };

    addProfile(newProfile);
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

      <hr />

      <h2>פרופילים שגילם מעל 25:</h2>
      <ul>
        {filteredProfiles.map((profile) => (
          <li key={profile.id}>
            {profile.name} ({profile.age}) - {profile.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
