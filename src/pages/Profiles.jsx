import React, { useEffect, useState } from 'react';
import { fetchAllProfiles, addProfile, deleteProfile, updateProfile } from '../firebase';
import { transportService } from '../firebase';
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
    try {
      // מעדכן את הפרופיל
      await updateProfile(updatedProfile.id, updatedProfile);
      
      // מעדכן את פרטי הנוסע בהסעות
      await transportService.updatePassengerInTransports(updatedProfile.id, {
        name: updatedProfile.name,
        city: updatedProfile.city,
        hasCaregiver: updatedProfile.hasCaregiver,
        arrivalDays: updatedProfile.arrivalDays
      });

      // מעדכן את הרשימה המקומית
      const data = await fetchAllProfiles();
      setProfiles(data);
      
      // עדכון הפרופיל הנבחר כדי שהחלון יציג את הנתונים החדשים
      setSelectedProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
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
    <Box sx={{ p: 3 }}>
      {/* חלק עליון - חיפוש וכפתור */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 8,
        }}
      >
        <TextField
          label="חיפוש לפי שם או יישוב"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          dir="rtl"
          sx={{ 
            width: '300px',
            '& .MuiOutlinedInput-root': {
              height: 40,
              fontSize: '0.9rem'
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.9rem',
              transform: 'translate(14px, 8px) scale(1)'
            },
            '& .MuiInputLabel-root.Mui-focused, & .MuiInputLabel-root.MuiFormLabel-filled': {
              transform: 'translate(14px, -9px) scale(0.75)'
            }
          }}
        />

        <Button
          variant="contained"
          onClick={() => setAddDialogOpen(true)}
          sx={{ 
            height: 40,
            fontSize: '0.9rem',
            minWidth: '120px'
          }}
        >
          הוספת פרופיל
        </Button>
      </Box>

      {/* אזור הפרופילים */}
      <Box sx={{ 
        minHeight: 400,
        '& .MuiGrid-container': {
          margin: 0,
          width: '100%',
          justifyContent: 'flex-start'
        }
      }}>
        <Grid container spacing={1.5}>
          {filteredProfiles.map(profile => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={profile.id}>
              <ProfileCard
                profile={profile}
                onClick={() => setSelectedProfile(profile)}
              />
            </Grid>
          ))}

          {filteredProfiles.length === 0 && (
            <Typography 
              variant="body1" 
              sx={{ 
                mt: 3, 
                mx: 'auto', 
                textAlign: 'center', 
                width: '100%',
                fontSize: '0.9rem'
              }}
            >
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