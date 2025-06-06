import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

function ProfileCard({ profile, onClick }) {
  return (
    <Box sx={{ 
        position: 'relative', 
        width: 180,  // הקטנת הרוחב כדי שיכנסו 6 כרטיסים
        m: 1,
        mb: 4,
    }}>
      {/* עיגול של הפרופיל - צף מעל הכרטיס */}
      <Box
        sx={{
          position: 'absolute',
          top: -45,  // הגדלת המרחק מהכרטיס בגלל העיגול הגדול יותר
          left: '50%',
          transform: 'translateX(-50%)',
          width: 100,  // הגדלת גודל העיגול
          height: 100,
          bgcolor: '#ffffffcc',
          borderRadius: '50%',
          backgroundColor: '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.3rem',  // הגדלת גודל הפונט
          zIndex: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '2px solid #fff'
        }}
      >
        {profile.initials || profile.name.charAt(0)}
      </Box>

      {/* כרטיס פרופיל */}
      <Card
        onClick={() => onClick(profile)}
        sx={{
          pt: 6,  // הגדלת הריווח העליון כדי לפנות מקום לעיגול הגדול יותר
          textAlign: 'center',
          height: 120,
          cursor: 'pointer',
          borderRadius: 2,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }
        }}
      >
        <CardContent>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '1rem',
              fontWeight: 'bold',
              mb: 1
            }}
          >
            {profile.name}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.85rem',
              color: 'text.secondary'
            }}
          >
            יישוב: {profile.city}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfileCard;