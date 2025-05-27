import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
} from '@mui/material';

const hours = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', 
];

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

const SchedulePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('schedule');
    return saved ? JSON.parse(saved) : {};
  });

  const handleChange = (key, field, value) => {
    setActivities((prev) => {
      const prevEntry = prev[key] || {};
      const updated = {
        ...prev,
        [key]: { ...prevEntry, [field]: value },
      };
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

      <Box sx={{ display: 'flex', height: 'calc(100vh - 130px)' }}>
        {/* עמודת שעות */}
        <Box
          sx={{
            width: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '2px solid #ddd',
            backgroundColor: '#fff',
            borderRadius: 2,
            mx: 0.5,
          }}
        >
          <Box
            sx={{
              flex: 1,
              width: '100%',
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              mt: 4,
            }}
          >
            {hours.map((hour) => (
              <Box
                key={hour}
                sx={{
                  height: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '3px solid #eee',
                }}
              >
                <Typography variant="h7" fontWeight="bold"  >{hour}</Typography>
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
            <Box sx={{ flex: 1, width: '100%' }}>
              {hours.map((hour) => {
                const key = `${day}-${hour}`;
                const value = activities[key] || { activity: '', instructor: '' };

                return (
                  <Box
                    key={key}
                    sx={{
                     height: isEditing ? '100px' : '70px',

                      px: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: isEditing ? 'flex-start' : 'center',
                      borderBottom: '3px solid #eee',
                       ...(isEditing && { mb: 2 })
                  
                    }}
                  >
                    {isEditing ? (
                      <>
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          placeholder="פעילות"
                          value={value.activity}
                          onChange={(e) => handleChange(key, 'activity', e.target.value)}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          placeholder="שם מדריך"
                          value={value.instructor}
                          onChange={(e) => handleChange(key, 'instructor', e.target.value)}
                        />
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center' ,

                      }}>
                        <Typography fontWeight="bold">{value.activity}</Typography>
                        <Typography fontSize="0.85rem" color="text.secondary">
                          {value.instructor}
                        </Typography>
                      </Box>
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