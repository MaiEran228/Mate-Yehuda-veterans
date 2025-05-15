import React, { useEffect, useState } from 'react';
import { fetchAllProfiles, addProfile, deleteProfile } from '../firebase';
import ProfileCard from '../components/ProfileCard';
import ProfileWindow from '../components/ProfileWindow';
import AddProfileWindow from '../components/AddProfileWindow';
import { Grid, Typography, Button, TextField, Box } from '@mui/material';

function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // 🔍 חדש

  useEffect(() => {
    const loadProfiles = async () => {
      const data = await fetchAllProfiles();
      setProfiles(data);
    };
    loadProfiles();
  }, []);

  const handleAddProfile = async (newProfile) => {
    await addProfile(newProfile);
    const data = await fetchAllProfiles();
    setProfiles(data);
  };

  const handleDeleteProfile = async (profileId) => {
    await deleteProfile(profileId);
    const data = await fetchAllProfiles(); // טען מחדש את הפרופילים אחרי מחיקה
    setProfiles(data);
    setSelectedProfile(null); // סגור את החלונית
  };

  // 🔍 סינון לפי שם או יישוב
  const filteredProfiles = profiles.filter(profile => {
    const term = searchTerm.toLowerCase();
    return (
      profile.name?.toLowerCase().includes(term) ||
      profile.city?.toLowerCase().includes(term)
    );
  });


  // בתוך return:
  return (
    <Box sx={{ p: 2 }}>
      {/* חלק עליון - חיפוש וכפתור */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="חיפוש לפי שם או יישוב"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          dir="rtl"
          sx={{ width: { xs: '100%', sm: '300px' } }}
        />

      </Box>

      <Button
        variant="contained"
        onClick={() => setAddDialogOpen(true)}
        sx={{ height: 40, mb: 5 }}
      >
        הוספת פרופיל
      </Button>

      {/* אזור הפרופילים בלבד */}
      <Box sx={{ minHeight: 400 }}> {/* שמור על גובה קבוע פחות או יותר */}
        <Grid container spacing={0}>
          {filteredProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onClick={() => setSelectedProfile(profile)}
            />
          ))}

          {filteredProfiles.length === 0 && (
            <Typography variant="body1" sx={{ mt: 3, mx: 'auto', textAlign: 'center', width: '100%' }}>
              לא נמצאו פרופילים מתאימים
            </Typography>
          )}
        </Grid>
      </Box>

      {/* חלונות דיאלוג */}
      <ProfileWindow
        open={!!selectedProfile}
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onDelete={handleDeleteProfile}
      />

      <AddProfileWindow
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleAddProfile}
      />
    </Box>
  );

}

export default Profiles;
