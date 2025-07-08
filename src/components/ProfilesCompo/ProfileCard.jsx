import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

function ProfileCard({ profile, onClick }) {
  return (
    <Box sx={{ 
        position: 'relative', 
        width: 180,  // Reduce width to fit 6 cards
        m: 1,
        mb: 4,
    }}>
      {/* עיגול של הפרופיל - צף מעל הכרטיס */}
      <div
        style={{
          position: 'absolute',
          top: -45,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: profile.profileImage ? 'transparent' : '#dbeafe',
          fontSize: '1.3rem',
          fontWeight: 'bold',
          zIndex: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '2px solid #fff',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {profile.profileImage ? (
          <img 
            src={profile.profileImage} 
            alt={profile.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <span style={{ 
            color: '#1976d2', 
            fontSize: '1.3rem',
            fontWeight: 'bold'
          }}>
            {profile.initials || profile.name.charAt(0)}
          </span>
        )}
      </div>

      {/* כרטיס פרופיל */}
      <Card
        onClick={() => onClick(profile)}
        sx={{
          pt: 6,  // Increase top padding to make room for larger circle
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