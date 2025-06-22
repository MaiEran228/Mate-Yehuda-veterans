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
import { collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
    try {
      // Delete the profile
      await deleteProfile(profileId);

      // Delete attendance records for the deleted profile
      const attendanceRef = collection(db, 'attendance');
      const attendanceSnapshot = await getDocs(attendanceRef);
      attendanceSnapshot.forEach(async (doc) => {
        const attendanceData = doc.data();
        const attendanceList = attendanceData.attendanceList || [];
        const updatedAttendanceList = attendanceList.filter(person => person.id !== profileId);
        if (updatedAttendanceList.length !== attendanceList.length) {
          await updateDoc(doc.ref, { attendanceList: updatedAttendanceList });
        }
      });

      // Update the local profiles list
      const data = await fetchAllProfiles();
      setProfiles(data);
      setSelectedProfile(null);
    } catch (error) {
      console.error('Error deleting profile and attendance records:', error);
    }
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
    <Box sx={{ p: 1.5, mt:2}}>
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
            fullWidth
            placeholder="חיפוש לפי שם או אזור מגורים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    edge="end"
                    sx={{ mr: -0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#fff',
                '&:hover': {
                  backgroundColor: '#fff',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(118, 126, 136, 0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(118, 126, 136, 0.4)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(118, 126, 136, 0.6)',
                },
              },
            }}
            sx={{
              maxWidth: '400px',
              '& .MuiInputBase-root': {
                height: '40px',
              },
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

      {/* סכום הפרופילים */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'rgba(64, 99, 112, 0.72)', fontSize: '2rem'}}>
          סך הכל פרופילים: {filteredProfiles.length}
        </Typography>
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
