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
const CELLS_PER_DAY_ROWS = 10;
const CELLS_PER_DAY_COLS = 1;
const CELLS_PER_DAY = CELLS_PER_DAY_ROWS * CELLS_PER_DAY_COLS;

//return color according to location
const getLocationColor = (location) => {
  const loc = (location || '').trim().replace(/\s+/g, '').toLowerCase();
  if (loc.includes('הרצאות')) return 'rgba(173, 203, 228, 0.88)'; // כחול
  if (loc.includes('לובי')) return 'rgba(181, 227, 202, 0.8)'; // ירוק
  if (loc.includes('אומנות') || loc.includes('אמנות')) return 'rgba(228, 201, 138, 0.93)'; // צהוב
  if (loc.includes('תעסוקה')) return 'rgba(209, 177, 202, 0.77)'; // ורוד
  if (loc.includes('מדרש')) return 'rgba(211, 147, 147, 0.89)'; // אדום
  if (loc.includes('פיזותרפיה')) return 'rgba(199, 196, 187, 0.88)'; // אפור בהיר
  return '#rgba(199, 196, 187, 0.88)'; // לבן
};

const SchedulePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activities, setActivities] = useState({});

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await fetchSchedule();
        console.log("Loaded schedule from Firebase:", data);
        setActivities(data || {});  // no data
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
    <>
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: '#ebf1f5',
        zIndex: 0,
      }} />
      <Box
        sx={{
          direction: 'rtl',
          width: '94vw',
          height: '150vh',
          p: 0,
          m: 0,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mb: 1, mt: 5
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsEditing(prev => !prev)}
            sx={{
              backgroundColor: 'rgba(142, 172, 183, 0.72)',
              border: 'none',
              outline: 'none',
              ':hover': {
                backgroundColor: 'rgb(185, 205, 220)',
                border: 'none',
                outline: 'none'
              },
              fontWeight: 'bold',
              color: 'black',
              '&:focus': {
                border: 'none',
                outline: 'none'
              },
              '&:active': {
                border: 'none',
                outline: 'none'
              },
              minWidth: '120px',
              ml: 2,
              height: '40px',
              fontSize: '0.9rem',
              px: 2,
              boxShadow: 'none',
            }}
          >
            {isEditing ? 'סיים עריכה' : 'ערוך לוח פעילויות'}
          </Button>
        </Box>

        {/* color book*/}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2, mt: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(173, 203, 228, 0.88)', border: '1.5px solid #b0c4de', mr: 1 }} />
            <Typography fontSize="1rem">הרצאות</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(181, 227, 202, 0.8)', border: '1.5px solid #a2d5c6', mr: 1 }} />
            <Typography fontSize="1rem">לובי</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(228, 201, 138, 0.93)', border: '1.5px solid #e6c07b', mr: 1 }} />
            <Typography fontSize="1rem">אומנות</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(209, 177, 202, 0.77)', border: '1.5px solid #c9a0c9', mr: 1 }} />
            <Typography fontSize="1rem">תעסוקה</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(211, 147, 147, 0.89)', border: '1.5px solid #d38d8d', mr: 1 }} />
            <Typography fontSize="1rem">מדרש</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(199, 196, 187, 0.88)', border: '1.5px solid #bdbdbd', mr: 1 }} />
            <Typography fontSize="1rem">פיזיותרפיה</Typography>
          </Box>
        </Box>

        <Box sx={{
          display: 'flex',
          flex: 1,
          gap: '4px',
          width: '95vm',
          m: 0,
        }}>
          {days.map((day) => (
            <Box
              key={day}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: '2.5px solid rgba(142, 172, 183, 0.72)',
                backgroundColor: '#fff',
                borderRadius: 2,
                p: 1,
              }}
            >
              <Box
                sx={{
                  py: 0.5,
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  borderBottom: '1.5px solid rgba(142, 172, 183, 0.72)',
                  mb: 1,
                }}
              >
                {day}
              </Box>
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {[...Array(CELLS_PER_DAY_ROWS)].map((_, rowIdx) => (
                  <Box key={rowIdx} sx={{
                    display: 'flex',
                    gap: '4px',
                    flex: 1
                  }}>
                    {[...Array(CELLS_PER_DAY_COLS)].map((_, colIdx) => {
                      const cellIdx = rowIdx * CELLS_PER_DAY_COLS + colIdx;
                      const key = `${day}-cell${cellIdx}`;
                      const value = activities[key] || { activity: '', instructor: '', location: '', time: '' };

                      return (
                        <Box
                          key={key}
                          sx={{
                            flex: 1,
                            border: '1.5px solid rgba(153, 169, 173, 0.72)',
                            borderRadius: 1,
                            p: 0.5,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            bgcolor: getLocationColor(value.location),
                            minHeight: 0,
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
                                sx={{ mb: 0.3, fontSize: '1.1rem', color: 'black' }}
                                inputProps={{ style: { fontSize: '1.1rem', color: 'black' } }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                placeholder="שם מדריך"
                                value={value.instructor}
                                onChange={(e) => handleChange(key, 'instructor', e.target.value)}
                                sx={{ mb: 0.3, fontSize: '1.05rem', color: 'black' }}
                                inputProps={{ style: { fontSize: '1rem', color: 'black' } }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                placeholder="מיקום"
                                value={value.location}
                                onChange={(e) => handleChange(key, 'location', e.target.value)}
                                sx={{ mb: 0.3, fontSize: '1.05rem', color: 'black' }}
                                inputProps={{ style: { fontSize: '1rem', color: 'black' } }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                placeholder="שעה"
                                value={value.time}
                                onChange={(e) => handleChange(key, 'time', e.target.value)}
                                inputProps={{ style: { fontSize: '1rem', color: 'black' } }}
                              />
                            </>
                          ) : (
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography fontWeight="bold" fontSize="1.2rem" sx={{ color: 'black' }}>
                                {value.activity}
                              </Typography>
                              <Typography fontSize="1rem" color="text.secondary" sx={{ color: 'black' }}>
                                {value.instructor}
                              </Typography>
                              <Typography fontSize="1rem" sx={{ color: 'black', fontWeight: 'bold' }}>
                                {value.location}
                              </Typography>
                              <Typography fontSize="1rem" color="text.secondary" sx={{ color: 'black' }}>
                                {value.time}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
};

export default SchedulePage;