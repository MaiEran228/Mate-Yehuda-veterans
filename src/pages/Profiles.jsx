import React, { useEffect, useState } from 'react';
import { fetchAllProfiles, addProfile, deleteProfile, updateProfile } from '../firebase';
import ProfileCard from '../components/ProfileCard';
import ProfileWindow from '../components/ProfileWindow';
import AddProfileWindow from '../components/AddProfileWindow';
import { Grid, Typography, Button, TextField, Box } from '@mui/material';

function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    const data = await fetchAllProfiles();
    setProfiles(data);
    setSelectedProfile(null);
  };

  // פונקציה חדשה לעדכון פרופיל
  const handleUpdateProfile = async (updatedProfile) => {
    await updateProfile(updatedProfile.id, updatedProfile);
    const data = await fetchAllProfiles();
    setProfiles(data);
    // עדכון הפרופיל הנבחר כדי שהחלון יציג את הנתונים החדשים
    setSelectedProfile(updatedProfile);
  };

  // סינון לפי שם או יישוב
  const filteredProfiles = profiles.filter(profile => {
    const term = searchTerm.toLowerCase();
    return (
      profile.name?.toLowerCase().includes(term) ||
      profile.city?.toLowerCase().includes(term)
    );
  });

  return (
    <Box sx={{ p: 2 }}>
      {/* חלק עליון - חיפוש וכפתור */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 6,
        }}
      >
        <TextField
          label="חיפוש לפי שם או יישוב"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          dir="rtl"
          sx={{ width: '300px', ml: '700px' }}
        />

        <Button
          variant="contained"
          onClick={() => setAddDialogOpen(true)}
          sx={{ height: 40 }}
        >
          הוספת פרופיל
        </Button>
      </Box>

      {/* אזור הפרופילים בלבד */}
      <Box sx={{ minHeight: 400 }}>
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
        onSave={handleUpdateProfile}
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