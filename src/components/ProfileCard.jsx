import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

function ProfileCard({ profile, onClick }) {
  return (
    <Box sx={{ position: 'relative', width: 159, m: 2, mb: 5 }}>
      {/* עיגול של הפרופיל - צף מעל הכרטיס */}
      <Box
        sx={{
          position: 'absolute',
          top: -35,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80,
          height: 80,
          borderRadius: '60%',
          backgroundColor: '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 18,
          zIndex: 1,
        }}
      >
        {profile.initials || profile.name.charAt(0)}
      </Box>

      {/* כרטיס פרופיל */}
      <Card
        onClick={() => onClick(profile)}
        sx={{
          pt: 4, // רווח למעלה כדי לפנות מקום לעיגול
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: 2,
        }}
      >
        <CardContent>
          <Typography variant="h6">{profile.name}</Typography>
          <Typography variant="body2">יישוב: {profile.city}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfileCard;