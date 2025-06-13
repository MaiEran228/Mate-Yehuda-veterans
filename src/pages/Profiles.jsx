import React, { useEffect, useState } from 'react';
import { fetchAllProfiles, addProfile, deleteProfile, updateProfile } from '../firebase';
import { transportService } from '../firebase';
import ProfileCard from '../components/ProfileCard';
import ProfileWindow from '../components/ProfileWindow';
import AddProfileWindow from '../components/AddProfileWindow';
import { Grid, Typography, Button, TextField, Box, AppBar, Toolbar, IconButton } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

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
      
      // סגירת החלון
      setSelectedProfile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // סינון לפי שם או יישוב
  const filteredProfiles = profiles
    .filter(profile => {
      const term = searchTerm.toLowerCase();
      return (
        profile.name?.toLowerCase().includes(term) ||
        profile.city?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      // מיון לפי הא"ב בעברית
      return a.name.localeCompare(b.name, 'he');
    });

  return (
    <Box sx={{ p: 1.5 }}>
      <AppBar 
        position="fixed" 
        color="transparent" 
        elevation={0}
        sx={{ 
          top: 'auto', 
          bottom: 'auto',
          backgroundColor: 'transparent'
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'flex-start', 
          minHeight: '64px !important',
          padding: '0 24px',
          gap: 2
        }}>
          <TextField
            placeholder="חיפוש לפי שם או יישוב"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            dir="rtl"
            inputProps={{
              style: { textAlign: 'right' }
            }}
            InputLabelProps={{
              sx: {
                right: 14,
                left: 'unset',
                textAlign: 'right',
                transformOrigin: 'top right',
                direction: 'rtl'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ ml: 0.5 }} />
                </InputAdornment>
              ),
              endAdornment: (
                searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      edge="end"
                      aria-label="נקה חיפוש"
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                )
              )
            }}
            sx={{ 
              width: '300px',
              '& .MuiOutlinedInput-root': {
                height: 40,
                fontSize: '0.9rem',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#888',
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.9rem',
                transform: 'translate(14px, 8px) scale(1)'
              },
              '& .MuiInputLabel-root.Mui-focused, & .MuiInputLabel-root.MuiFormLabel-filled': {
                transform: 'translate(14px, -9px) scale(0.75)'
              },
              '& .MuiInputBase-input': {
                textAlign: 'right'
              }
            }}
          />
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            onClick={() => setAddDialogOpen(true)}
            sx={{ 
              height: 40,
              fontSize: '0.9rem',
              minWidth: '120px',
              
            }}
          >
            הוספת פרופיל
          </Button>
        </Toolbar>
      </AppBar>
      <Toolbar sx={{ mb: 12 }} />

      {/* אזור הפרופילים */}
      <Box sx={{ 
        minHeight: 400,
        '& .MuiGrid-container': {
          margin: 0,
          width: '100%',
          justifyContent: 'center'
        }
      }}>
        <Grid container spacing={0.5} rowSpacing={2}>
          {filteredProfiles.map(profile => (
            <Grid item xs={12} sm={6} md={4} lg={1.5} key={profile.id}>
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