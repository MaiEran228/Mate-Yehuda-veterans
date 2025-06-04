import React, { useState, useEffect } from 'react';
import { fetchSchedule, saveSchedule } from '../firebase'; // הנתיב לקובץ שלך

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
  const [activities, setActivities] = useState({});

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await fetchSchedule();
        console.log("Loaded schedule from Firebase:", data);
        setActivities(data || {});  // למקרה שאין נתונים
      } catch (err) {
        console.error("Error loading schedule:", err);
      }
    };
    loadSchedule();
  }, []);

  const handleChange = (key, field, value) => {
    const prevEntry = activities[key] || {};
    const updated = { ...activities, [key]: { ...prevEntry, [field]: value } };
    setActivities(updated);
    saveSchedule(updated).catch(err => {
      console.error("Error saving schedule:", err);
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
          onClick={() => setIsEditing(prev => !prev)}
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
        >שעות
         <Box sx={{ flex: 1, width: '100%' }}></Box>
          <Box
            sx={{
              flex: 1,
              width: '100%',
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
          
            }}
          >
            {hours.map((hour) => (
              <Box//תאי השעות
                key={hour}
                sx={{
                  height: '130px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '3px solid #eee',
                }}
              >
             
                <Typography variant="h7" fontWeight="bold">
                  {hour}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        {/* עמודת מיקום קבועה */}
        <Box
          sx={{
            width: '120px',
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
              py: 0.5,
              width: '100%',
              textAlign: 'center',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderBottom: '1px solid #ddd',
            }}
          >
            מיקום
          </Box>
          <Box sx={{ flex: 1, width: '100%' }}>
            {[
              'חדר הרצאות',
              'לובי',
              'חדר אומנות',
              'חדר תעסוקה',
              'בית מדרש',
              'חדר פיזיותרפיה',
            ].map((location, index) => (
              <Box
                key={index}
                sx={{
                  height: '130px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '3px solid #eee',
                }}
              >
                <Typography variant="body1">{location}</Typography>
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

            <Box sx={{ flex: 1, width: '100%' }}>
              {hours.map((hour) => {
                const key = `${day}-${hour}`;
                const value = activities[key] || {
                  activity: '',
                  instructor: '',
                  location: '',
                  time: '',
                };

                return (
                  <Box
                    key={key}
                    sx={{
                      height: isEditing ? '130px' : '130px',
                      px: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: isEditing ? 'flex-start' : 'center',
                      borderBottom: '3px solid #eee',
                      ...(isEditing && { mb: 2 }),
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
                          sx={{ mb: 0.3, height: '25px', '& .MuiInputBase-root': { height: '25px' } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          placeholder="שם מדריך"
                          value={value.instructor}
                          onChange={(e) => handleChange(key, 'instructor', e.target.value)}
                          sx={{ mb: 0.3, height: '25px', '& .MuiInputBase-root': { height: '25px' } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          placeholder="מיקום"
                          value={value.location}
                          onChange={(e) => handleChange(key, 'location', e.target.value)}
                          sx={{ mb: 0.3, height: '25px', '& .MuiInputBase-root': { height: '25px' } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          placeholder="שעה"
                          value={value.time}
                          onChange={(e) => handleChange(key, 'time', e.target.value)}
                          sx={{ mb: 0.3, height: '25px', '& .MuiInputBase-root': { height: '25px' } }}
                        />
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography fontWeight="bold">{value.activity}</Typography>
                        <Typography fontSize="1rem" color="text.secondary">
                          {value.instructor}
                        </Typography>
                        <Typography fontSize="1rem" color="text.secondary">
                          {value.location}
                        </Typography>
                        <Typography fontSize="1rem" color="text.secondary">
                          {value.time}
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