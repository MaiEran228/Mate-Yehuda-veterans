import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
} from '@mui/material';

const hours = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

const SchedulePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('schedule');
    return saved ? JSON.parse(saved) : {};
  });

  const handleChange = (key, value) => {
    setActivities((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('schedule', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <Box
      sx={{
        direction: 'rtl',
        width: '100vw',
        height: '100vh',
        bgcolor: '#f0f4f8',
        p: 2,
        boxSizing: 'border-box',
        overflowX: 'auto',
      }}
    >
      {/* 🔘 כותרת + כפתור עריכה בצד שמאל */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="#5b3c11">
          מערכת שעות שבועית
        </Typography>

        <Button
          variant={isEditing ? 'outlined' : 'contained'}
          color="primary"
          onClick={() => setIsEditing((prev) => !prev)}
        >
          {isEditing ? 'סיים עריכה' : 'ערוך מערכת שעות'}
        </Button>
      </Box>

      {/* טבלה */}
      <Box sx={{ display: 'flex', height: 'calc(100vh - 130px)' }}>
        {/* עמודת שעות */}
        <Box
          sx={{
            width: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            borderRadius: 2,
            mx: 0.5,
          }}
        >
          <Box
            sx={{
              py: 1,
              width: '100%',
              textAlign: 'center',
              fontWeight: 'bold',
              borderBottom: '1px solid #ddd',
              backgroundColor: '#f8f8f8',
            }}
          >
            שעות
          </Box>
          <Box
            sx={{
              flex: 1,
              width: '100%',
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
            }}
          >
            {hours.map((hour, index) => (
              <Box
                key={index}
                sx={{
                  mb: 1,
                  textAlign: 'center',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  backgroundColor: '#fff',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography>{hour}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* עמודות ימים */}
        {days.map((day) => (
          <Box
            key={day}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              borderRadius: 2,
              mx: 0.5,
              minWidth: '140px',
            }}
          >
            {/* כותרת יום */}
            <Box
              sx={{
                py: 0.5,
                width: '100%',
                textAlign: 'center',
                fontSize: '1.3rem', 
                fontWeight: 'bold',
                borderBottom: '1px solid #ddd',
              }}
            >
              {day}
            </Box>

            {/* שורות פעילות */}
            <Box sx={{ flex: 1, width: '100%', p: 1 }}>
              {hours.map((hour) => {
                const key = `${day}-${hour}`;
                const value = activities[key] || '';

                return (
                  <Box
                    key={key}
                    sx={{
                      height: '50px',
                      mb: 1,
                      px: 1,
                      display: 'flex',
                      alignItems: 'center',

                    }}
                  >
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    ) : (
                      <Typography
                        variant="body1"
                        sx={{
                          width: '100%',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          lineHeight: '50px', // גובה התא
                        }}
                      >
                        {value}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SchedulePage;