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
const CELLS_PER_DAY_ROWS = 5;
const CELLS_PER_DAY_COLS = 2;
const CELLS_PER_DAY = CELLS_PER_DAY_ROWS * CELLS_PER_DAY_COLS;

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
        width: '95vw',
        height: '100vh',
        bgcolor: '#ebf1f5',
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
        <Typography variant="h4" fontWeight="bold" color="Black">
          לוח פעילויות
        </Typography>

        <Button
          variant={isEditing ? 'outlined' : 'contained'}
          color="primary"
          onClick={() => setIsEditing(prev => !prev)}
          sx={{
            minWidth: '120px',
            height: '40px',
            fontWeight: 'bold',
            fontSize: '1rem',
            px: 2,
            bgcolor: 'rgb(85, 105, 125)',
            border: '2px solid rgb(53, 45, 45)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgb(65, 85, 105)',
              border: '2px solid rgb(68, 63, 63)'
            }
          }}
        >
          {isEditing ? 'סיים עריכה' : 'ערוך מערכת שעות'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 130px)' }}>
        {/* עמודות ימים בלבד */}
        {days.map((day) => (
          <Box
            key={day}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '2px solid #ddd',
              backgroundColor: '#fff',
              borderRadius: 2,
              height: '685px',
              mx: 0.3,
              p: 1,
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
                mb: 1,
              }}
            >
              {day}
            </Box>
            <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[...Array(CELLS_PER_DAY_ROWS)].map((_, rowIdx) => (
                <Box key={rowIdx} sx={{ display: 'flex', flexDirection: 'row', gap: 1, mb: 1 }}>
                  {[...Array(CELLS_PER_DAY_COLS)].map((_, colIdx) => {
                    const cellIdx = rowIdx * CELLS_PER_DAY_COLS + colIdx;
                    const key = `${day}-cell${cellIdx}`;
                    const value = activities[key] || { activity: '', instructor: '', location: '', time: '' };
                    // בדיקה אם כל התאים מלאים
                    const allFilled = false; // לא צריך להקטין פונט כי אין גרירה
                    const fontSize = allFilled ? '0.85rem' : '1rem';
                    return (
                      <Box
                        key={key}
                        sx={{
                          height: '100px',
                          width: '100px',
                          minHeight: '45px',
                          flex: 1,
                          border: '4px solid #eee',
                          borderRadius: 1,
                          p: 0.5,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          bgcolor: '#f7fafc',
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
                              sx={{ mb: 0.3, fontSize }}
                              inputProps={{ style: { fontSize } }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              variant="outlined"
                              placeholder="שם מדריך"
                              value={value.instructor}
                              onChange={(e) => handleChange(key, 'instructor', e.target.value)}
                              sx={{ mb: 0.3, fontSize }}
                              inputProps={{ style: { fontSize } }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              variant="outlined"
                              placeholder="מיקום"
                              value={value.location}
                              onChange={(e) => handleChange(key, 'location', e.target.value)}
                              sx={{ mb: 0.3, fontSize }}
                              inputProps={{ style: { fontSize } }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              variant="outlined"
                              placeholder="שעה"
                              value={value.time}
                              onChange={(e) => handleChange(key, 'time', e.target.value)}
                              sx={{ mb: 0.3, fontSize }}
                              inputProps={{ style: { fontSize } }}
                            />
                          </>
                        ) : (
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography fontWeight="bold" fontSize={fontSize}>{value.activity}</Typography>
                            <Typography fontSize={fontSize} color="text.secondary">
                              {value.instructor}
                            </Typography>
                            <Typography fontSize={fontSize} color="text.secondary">
                              {value.location}
                            </Typography>
                            <Typography fontSize={fontSize} color="text.secondary">
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
  );
};

export default SchedulePage;