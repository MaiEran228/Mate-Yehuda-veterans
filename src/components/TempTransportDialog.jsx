// שינויים שצריך לעשות בקובץ TempReservationDialog.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Autocomplete, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { he } from 'date-fns/locale';
import CustomDialog from './CustomDialog';

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

        // חשב נוסעים זמינים להוספה
        const regular = (transport.passengers || []).filter(p => 
          (p.arrivalDays || []).includes(reservationHebDay)
        );
        const tempList = (map[transport.id?.toString()] || []).filter(r => r.date === dateStr);
        
        // איחוד כל המשוריינים (ללא כפילויות)
        const assignedIds = new Set([
          ...regular.map(p => String(p.id)),
          ...tempList.map(t => String(t.id))
        ]);
        
        // זמינים להוספה: כל הפרופילים מינוס המשוריינים
        const forAdd = [...profiles]
          .filter(p => !assignedIds.has(String(p.id)))
          .sort((a, b) => a.name.localeCompare(b.name, 'he'));
        
        // זמינים להורדה: רק המשוריינים
        const ids = new Set();
        const forRemove = [];
        for (const p of regular) {
          if (!ids.has(p.id)) {
            forRemove.push(p);
            ids.add(p.id);
          }
        }
        for (const t of tempList) {
          if (!ids.has(t.id)) {
            forRemove.push(t);
            ids.add(t.id);
          }
        }
        forRemove.sort((a, b) => a.name.localeCompare(b.name, 'he'));

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

  // 4. החלף את החלק של ה-Autocomplete ב-JSX:
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="שיריון מקום זמני"
      dialogContentSx={{ mt: 2 }}
      actions={[
        <Button key="cancel" onClick={onClose}>ביטול</Button>,
        <Button
          key="save"
          onClick={onSave}
          variant="contained"
          disabled={!selectedProfile || !reservationDate || loading}
        >
          שמור
        </Button>
      ]}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                fullWidth: true,
                InputLabelProps: {
                  shrink: true,
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
            renderInput={(params) => (
              <TextField
                {...params}
                label="בחר נוסע"
                placeholder="הקלד שם לחיפוש"
              />
            )}
          />
        ) : (
          <Autocomplete
            options={availableProfilesForRemove}
            getOptionLabel={(option) => option.name}
            value={selectedProfile}
            onChange={(event, newValue) => setSelectedProfile(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="בחר נוסע להורדה"
                placeholder="הקלד שם לחיפוש"
              />
            )}
          />
        )}
      </Box>
    </CustomDialog>
  );
};

export default TempReservationDialog;