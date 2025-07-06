// שינויים שצריך לעשות בקובץ TempReservationDialog.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Autocomplete, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { he } from 'date-fns/locale';
import CustomDialog from '../CustomDialog';

const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// 1. החלף את ה-props של הקומפוננטה:
const TempReservationDialog = ({
  open,
  onClose,
  transport,
  reservationType,
  setReservationType,
  profiles,
  selectedProfile,
  setSelectedProfile,
  reservationDate,
  setReservationDate,
  selectedDate,        // חדש
  selectedHebDay,      // חדש
  fetchTransportsByDate, // חדש
  onSave,
  loading
}) => {
  
  // 2. הוסף state מקומי לטיפול ברשימות:
  const [availableProfilesForAdd, setAvailableProfilesForAdd] = useState([]);
  const [availableProfilesForRemove, setAvailableProfilesForRemove] = useState([]);
  const [tempReservationsForDialogDate, setTempReservationsForDialogDate] = useState({});

  // 3. הוסף useEffect לרענון הנתונים כאשר התאריך משתנה:
  useEffect(() => {
    if (!open || !reservationDate || !transport || !fetchTransportsByDate) {
      setTempReservationsForDialogDate({});
      setAvailableProfilesForAdd([]);
      setAvailableProfilesForRemove([]);
      return;
    }
  
    const fetchAndCalculateProfiles = async () => {
      const dateStr = reservationDate.toISOString().slice(0, 10);
      const reservationDayIdx = reservationDate.getDay();
      const reservationHebDay = daysMap[reservationDayIdx];
  
      try {
        // שלוף נתונים עבור התאריך
        const dateDoc = await fetchTransportsByDate(dateStr);
        const transportsList = dateDoc?.transports || [];
        const map = {};
        for (const t of transportsList) {
          if (t.tempReservations && t.tempReservations.length > 0) {
            map[t.id.toString()] = t.tempReservations;
          }
        }
        setTempReservationsForDialogDate(map);
  
        // חשב את הנוסעים הנוכחיים בהסעה (עם הגיון כמו ב-TransportTable)
        const regular = (transport.passengers || []).filter(p => 
          (p.arrivalDays || []).includes(reservationHebDay)
        );
        const tempList = (map[transport.id?.toString()] || []).filter(r => r.date === dateStr);
        
        const tempAdditions = tempList.filter(t => t.type !== 'removal');
        const tempRemovals = tempList.filter(t => t.type === 'removal');
        
        // הסר נוסעים קבועים שמופיעים ברשימת ההוצאות הזמניות
        const removalIds = new Set(tempRemovals.map(r => r.id));
        const filteredRegular = regular.filter(p => !removalIds.has(p.id));
        
        // הוסף נוסעים זמניים (רק הוספות) שלא קיימים כבר
        const regularIds = new Set(filteredRegular.map(p => p.id));
        const newTempPassengers = tempAdditions.filter(t => !regularIds.has(t.id));
        
        const currentPassengers = [...filteredRegular, ...newTempPassengers];
        
        // זמינים להוספה: כל הפרופילים מינוס הנוסעים הנוכחיים
        const currentPassengerIds = new Set(currentPassengers.map(p => String(p.id)));
        const forAdd = profiles
          .filter(p => !currentPassengerIds.has(String(p.id)))
          .sort((a, b) => a.name.localeCompare(b.name, 'he'));
        
        // זמינים להורדה: רק הנוסעים הנוכחיים
        const forRemove = currentPassengers
          .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  
        setAvailableProfilesForAdd(forAdd);
        setAvailableProfilesForRemove(forRemove);
  
      } catch (error) {
        console.error('Error fetching transport data:', error);
        setAvailableProfilesForAdd([]);
        setAvailableProfilesForRemove([]);
      }
    };
  
    fetchAndCalculateProfiles();
  }, [open, reservationDate, transport, profiles, fetchTransportsByDate]);

  useEffect(() => {
    setSelectedProfile(null);
  }, [reservationType, reservationDate, availableProfilesForAdd, availableProfilesForRemove]);

  // 4. החלף את החלק של ה-Autocomplete ב-JSX:
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="שיריון מקום זמני"
      maxWidth="xs"
      PaperProps={{ sx: { minWidth: 400, maxWidth: 400 } }}
      dialogContentSx={{ mt: 4 }}
      actions={[
        <Button
          key="cancel"
          variant="outlined"
          onClick={onClose}
          sx={{
            color: 'rgba(64, 99, 112, 0.72)',
            border: '1.7px solid rgba(64, 99, 112, 0.72)',
            '&:focus': { outline: 'none', border: 'none' },
            '&:active': { outline: 'none', border: 'none' },
            ':hover': {
              borderColor: '#7b8f99',
              color: '#5a676e',
              outline: 'none'
            },
            gap: 2,
            ml: 1
          }}
        >
          ביטול
        </Button>,
        <Button
          key="save"
          onClick={onSave}
          variant="contained"
          disabled={!selectedProfile || !reservationDate || loading}
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
          }}
        >
          שמור
        </Button>
      ]}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2,  }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
          <DatePicker
            label="בחר תאריך"
            value={reservationDate}
            onChange={(newDate) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (newDate >= today) {
                setReservationDate(newDate);
              }
            }}
            minDate={new Date()}
            slotProps={{
              textField: {
                sx: {
                  width: 220,
                  mr: 0,
                  ml: 'auto',
                  '& .MuiInputAdornment-root .MuiIconButton-root': {
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  },
                  '& .MuiInputAdornment-root .MuiIconButton-root:focus': {
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  },
                  '& .MuiInputAdornment-root .MuiIconButton-root:active': {
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  },
                  '& .MuiInputAdornment-root .MuiIconButton-root:hover': {
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  },
                },
                InputLabelProps: {
                  sx: {
                    overflow: 'visible',
                    maxWidth: 'unset',
                    textAlign: 'right',
                    minWidth: 80,
                    pr: 0.5,
                    minHeight: 24,
                    pt: 0.5,
                  }
                }
              },
              actionBar: {
                actions: ['accept'],
                sx: {
                  padding: '0px 8px',
                  margin: '-70px 0 0 0',
                  minHeight: '22px',
                  '& .MuiButton-root': {
                    minWidth: 40,
                    padding: '0px 8px',
                    margin: '0 2px',
                    mb: 1,
                    ml: 2,
                    fontSize: '0.875rem',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    height: '28px',
                    borderRadius: '3px',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                  }
                }
              }
            }}
          />
        </LocalizationProvider>
        <ToggleButtonGroup
          value={reservationType}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setReservationType(newValue);
              setSelectedProfile(null);
            }
          }}
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              minWidth: 0,
              width: 180,
              px: 0,
              justifyContent: 'center',
              textAlign: 'center',
              marginLeft: 1,
              borderRadius: '8px !important',
              boxShadow: 'none',
              mb:1
            },
            '& .MuiToggleButton-root:focus': {
              outline: 'none',
              border: 'none',
              boxShadow: 'none',
            },
            '& .MuiToggleButton-root:active': {
              outline: 'none',
              border: 'none',
              boxShadow: 'none',
            },
            '& .MuiToggleButton-root:hover': {
              outline: 'none',
              border: 'none',
              boxShadow: 'none',
            },
        
          }}
        >
          <ToggleButton value="add">
            הוספת נוסע
          </ToggleButton>
          <ToggleButton value="remove">
            הורדת נוסע
          </ToggleButton>
        </ToggleButtonGroup>
        
        {/* החלף את כל החלק הזה */}
        {reservationType === 'add' ? (
          <Autocomplete
            options={availableProfilesForAdd}
            getOptionLabel={(option) => option.name}
            value={selectedProfile}
            onChange={(event, newValue) => setSelectedProfile(newValue)}
            sx={{ width: 220, mr: 0, ml: 'auto' }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={selectedProfile ? "" : "בחר נוסע"}
                placeholder="הקלד שם לחיפוש"
                sx={{ width: 220, mr: 0, ml: 'auto' }}
                InputLabelProps={{
                  sx: {
                    right: 37,
                    left: 'unset',
                    transformOrigin: 'top right',
                    direction: 'rtl',
                    px: 0.5,
                    backgroundColor: 'white',
                  }
                }}
              />
            )}
          />
        ) : (
          <Autocomplete
            options={availableProfilesForRemove}
            getOptionLabel={(option) => option.name}
            value={selectedProfile}
            onChange={(event, newValue) => setSelectedProfile(newValue)}
            sx={{ width: 220, mr: 0, ml: 'auto' }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={selectedProfile ? "" : "בחר נוסע להורדה"}
                placeholder="הקלד שם לחיפוש"
                sx={{ width: 220, mr: 0, ml: 'auto' }}
                InputLabelProps={{
                  sx: {
                    right: 37,
                    left: 'unset',
                    transformOrigin: 'top right',
                    direction: 'rtl',
                    px: 0.5,
                    backgroundColor: 'white',
                  }
                }}
              />
            )}
          />
        )}
      </Box>
    </CustomDialog>
  );
};

export default TempReservationDialog;