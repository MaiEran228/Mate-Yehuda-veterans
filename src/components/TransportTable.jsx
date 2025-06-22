import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Select, MenuItem, InputLabel, FormControl,
  Button, IconButton, Tooltip, Chip, Stack,
  Popover, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, Autocomplete, Paper, ToggleButton, ToggleButtonGroup,
  TableSortLabel
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { he } from 'date-fns/locale';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { calculateAvailableSeatsByDay } from '../utils/transportUtils';
import { collection, getDocs } from 'firebase/firestore';
import { db, saveTransportDate, fetchTransportsByDate } from '../firebase';

// Mapping from Hebrew days to א-ב-ג
const dayMap = {
  'ראשון': 'א',
  'שני': 'ב',
  'שלישי': 'ג',
  'רביעי': 'ד',
  'חמישי': 'ה',
};
const dayOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

const dayShortMap = {
  'ראשון': 'א',
  'שני': 'ב',
  'שלישי': 'ג',
  'רביעי': 'ד',
  'חמישי': 'ה',
  'שישי': 'ו',
  'שבת': 'ש'
};

function TransportTable({
  data,
  searchTerm,
  sortField,
  onViewPassengers,
  onEditClick,
  onDeleteClick,
  selectedDate
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [tempReservationDialog, setTempReservationDialog] = useState({
    open: false,
    transport: null,
    reservationType: 'add'
  });
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [reservationDate, setReservationDate] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [tempReservationsByTransport, setTempReservationsByTransport] = useState({});
  const [tempReservationsForDialogDate, setTempReservationsForDialogDate] = useState({});

  // מיון
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Fetch profiles when dialog opens
  React.useEffect(() => {
    if (tempReservationDialog.open) {
      const fetchProfiles = async () => {
        const profilesRef = collection(db, 'profiles');
        const snapshot = await getDocs(profilesRef);
        const profilesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProfiles(profilesList);
      };
      fetchProfiles();
    }
  }, [tempReservationDialog.open]);

  // Fetch temp reservations for selected date
  const fetchTempReservations = async () => {
    if (!selectedDate) {
      setTempReservationsByTransport({});
      return;
    }
    const dateStr = selectedDate.format ? selectedDate.format('YYYY-MM-DD') : selectedDate.toISOString().slice(0, 10);
    console.log('🔍 בודק שיריונות זמניים לתאריך:', dateStr);

    const dateDoc = await fetchTransportsByDate(dateStr);
    console.log('📦 תוצאה מ-fetchTransportsByDate:', dateDoc);

    const transportsList = dateDoc?.transports || [];

    const map = {};
    for (const t of transportsList) {
      if (t.tempReservations && t.tempReservations.length > 0) {
        map[t.id.toString()] = t.tempReservations;
      }
    }

    console.log('✅ מפה של שיריונות זמניים לפי הסעה:', map);

    setTempReservationsByTransport(map);
  };

  useEffect(() => {
    fetchTempReservations();
  }, [selectedDate]);

  const handleSeatsClick = (event, transport) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransport(transport);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedTransport(null);
  };

  const open = Boolean(anchorEl);

  // Helper: get selected day in Hebrew and date string
  let selectedHebDay = null;
  let selectedDateStr = null;
  if (selectedDate) {
    const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    selectedHebDay = daysMap[selectedDate.day ? selectedDate.day() : new Date(selectedDate).getDay()];
    selectedDateStr = selectedDate.format ? selectedDate.format('YYYY-MM-DD') : selectedDate.toISOString().slice(0, 10);
  }

  const filteredData = [...data]
    .filter((row) =>
      (row.cities || []).some(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!orderBy) return 0;
      if (orderBy === 'days') {
        const aIdx = dayOrder.indexOf((a.days || [])[0]);
        const bIdx = dayOrder.indexOf((b.days || [])[0]);
        return order === 'asc' ? aIdx - bIdx : bIdx - aIdx;
      }
      if (orderBy === 'cities') {
        const aCity = (a.cities?.[0] || '').toLowerCase();
        const bCity = (b.cities?.[0] || '').toLowerCase();
        if (aCity < bCity) return order === 'asc' ? -1 : 1;
        if (aCity > bCity) return order === 'asc' ? 1 : -1;
        return 0;
      }
      if ((a[orderBy] || '') < (b[orderBy] || '')) return order === 'asc' ? -1 : 1;
      if ((a[orderBy] || '') > (b[orderBy] || '')) return order === 'asc' ? 1 : -1;
      return 0;
    });

  const handleTempReservationClick = (transport) => {
    setSelectedTransport(transport); // הוסף שורה זו
    setTempReservationDialog({
      open: true,
      transport,
      reservationType: 'add'
    });
  };

  const handleTempReservationClose = () => {
    setTempReservationDialog({ open: false, transport: null, reservationType: 'add' });
    setSelectedProfile(null);
    setSelectedDay('');
    setReservationDate(new Date());
    setSearchText('');
  };

  // Helper: get merged passengers for selected day (regular + temp)
  function getPassengersForDay(row, selectedHebDay, dateStr) {
    let regular = (row.passengers || []).filter(p => (p.arrivalDays || []).includes(selectedHebDay));
    let temp = tempReservationsByTransport[row.id.toString()] || [];
    // Only for this date
    temp = temp.filter(r => r.date === dateStr);
    // Avoid duplicates (by id)
    const ids = new Set(regular.map(p => p.id));
    const merged = [...regular, ...temp.filter(t => !ids.has(t.id))];
    return merged;
  }

  // Helper: get available seats for selected day (regular + temp)
  function getAvailableSeats(row, selectedHebDay, dateStr) {
    // Count regular + temp for this date
    const regular = (row.passengers || []).filter(p => (p.arrivalDays || []).includes(selectedHebDay));
    const temp = (tempReservationsByTransport[row.id.toString()] || []).filter(r => r.date === dateStr);
    const all = [...regular, ...temp];
    const totalSeats = row.type === 'מונית' ? 4 : 14;
    // ודא שכל נוסע זמני עם hasCaregiver=true תופס 2 מקומות
    const seatsNeeded = all.reduce((total, p) => total + (p.hasCaregiver ? 2 : 1), 0);
    return totalSeats - seatsNeeded;
  }

  const handleTempReservationSave = async () => {
    if (!selectedProfile || !reservationDate) {
      alert('יש למלא את כל השדות');
      return;
    }

    const dateStr = reservationDate.toISOString().slice(0, 10);
    const transport = selectedTransport;
    const totalSeats = transport.type === 'מונית' ? 4 : 14;
    // קביעת היום בשבוע של התאריך שנבחר להזמנה
    const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const reservationDayIdx = reservationDate.getDay();
    const reservationHebDay = daysMap[reservationDayIdx];

    if (tempReservationDialog.reservationType === 'remove') {
      // הורדת נוסע זמני
      const tempList = (tempReservationsByTransport[transport.id?.toString()] || []);
      const exists = tempList.some(r => r.id === selectedProfile.id && r.date === dateStr);
      try {
        // ניצור אובייקט שיריון להסרה (לפי id ותאריך)
        const tempReservation = {
          id: selectedProfile.id,
          date: dateStr
        };
        await removeTempReservationForDate(transport, tempReservation, dateStr);
        await fetchTempReservations();
        handleTempReservationClose();
        alert('הנוסע הוסר בהצלחה מהשיריון הזמני');
      } catch (error) {
        console.error('Error removing temporary reservation:', error && error.message, error);
        alert('אירעה שגיאה בהסרת הנוסע');
      }
      return;
    }

    // בדיקת מקומות פנויים לפני שמירה
    // נוסעים קבועים שמגיעים ביום הזה
    const regular = (transport.passengers || []).filter(p => (p.arrivalDays || []).includes(reservationHebDay));
    // נוסעים זמניים עם שיריון לאותו תאריך (מהסטייט החדש)
    const tempList = (tempReservationsForDialogDate[transport.id?.toString()] || []).filter(r => r.date === dateStr);
    // מיזוג כל הנוסעים (ללא כפילויות)
    const ids = new Set();
    const all = [];
    for (const p of regular) {
      if (!ids.has(p.id)) {
        all.push(p);
        ids.add(p.id);
      }
    }
    for (const t of tempList) {
      if (!ids.has(t.id)) {
        all.push(t);
        ids.add(t.id);
      }
    }
    // חישוב מקומות
    const usedSeats = all.reduce((total, p) => total + (p.hasCaregiver ? 2 : 1), 0);
    const availableSeats = totalSeats - usedSeats;
    if (availableSeats < (selectedProfile.hasCaregiver ? 2 : 1)) {
      alert('אין מקום פנוי בהסעה!');
      return;
    }

    try {
      const updatedTransport = { ...transport };
      // יצירת שיריון זמני
      const tempReservation = {
        id: selectedProfile.id,
        name: selectedProfile.name,
        hasCaregiver: selectedProfile.hasCaregiver || false,
        date: dateStr,
      };
      // שמירה ל-transport_dates
      await addTempReservationForDate(updatedTransport, tempReservation, dateStr);
      await fetchTempReservations(); // רענון מיידי אחרי שמירה
      handleTempReservationClose();
      alert('שיריון זמני נשמר בהצלחה');
    } catch (error) {
      console.error('Error saving temporary reservation:', error && error.message, error);
      alert('אירעה שגיאה בשמירת השינויים');
    }
  };

  const addTempReservationForDate = async (transport, reservation, dateStr) => {
    console.log('--- addTempReservationForDate ---');
    console.log('selectedTransport:', transport);
    console.log('reservation:', reservation);
    console.log('dateStr:', dateStr);
  
    // בדיקת תקינות transport
    if (!transport) {
      throw new Error('Transport is undefined or null');
    }
  
    // מצא מזהה הסעה תקין
    const transportIdRaw = transport.id ?? transport.transportId ?? null;
    if (transportIdRaw === null || transportIdRaw === undefined) {
      throw new Error('Transport id is missing');
    }
    const transportId = transportIdRaw.toString();
  
    let dateDoc = await fetchTransportsByDate(dateStr);
    let transportsList = dateDoc?.transports || [];
    console.log('transportsList before:', transportsList);
  
    const idx = transportsList.findIndex(t => {
      const tIdRaw = t.id ?? t.transportId ?? null;
      if (tIdRaw === null || tIdRaw === undefined) return false;
      const tId = tIdRaw.toString();
      return tId === transportId;
    });
  
    console.log('idx:', idx);
  
    if (idx === -1) {
      // יצירת אובייקט הסעה חדש לשמירה
      const newTransport = {
        id: transportId,
        tempReservations: [reservation],
      };
      if (typeof transport.type === 'string') newTransport.type = transport.type;
      if (Array.isArray(transport.days)) newTransport.days = transport.days;
      if (Array.isArray(transport.cities)) newTransport.cities = transport.cities;
  
      console.log('newTransport:', JSON.stringify(newTransport));
      transportsList.push(newTransport);
    } else {
      // עדכון הסעה קיימת
      const t = transportsList[idx];
      if (!Array.isArray(t.tempReservations)) t.tempReservations = [];
  
      // הסר שיריון קיים עם אותו id אם קיים
      t.tempReservations = t.tempReservations.filter(r => r.id !== reservation.id);
  
      // הוסף שיריון חדש
      t.tempReservations.push(reservation);
  
      transportsList[idx] = t;
    }
  
    // בדיקה שאין ערכים undefined ב-reservation
    Object.entries(reservation).forEach(([k, v]) => {
      if (v === undefined) {
        console.error('reservation has undefined field:', k);
      }
    });
  
    // בדיקה שאין ערכים undefined ב-transportsList
    transportsList.forEach(t => {
      Object.entries(t).forEach(([key, val]) => {
        if (val === undefined) {
          console.error(`🚨 הסעה עם id ${t.id} מכילה undefined בשדה:`, key);
        }
      });
      (t.tempReservations || []).forEach((r, idx) => {
        Object.entries(r).forEach(([key, val]) => {
          if (val === undefined) {
            console.error(`🚨 שיריון זמני ${idx} בהסעה ${t.id} מכיל undefined בשדה:`, key);
          }
        });
      });
    });
  
    try {
      await saveTransportDate(dateStr, transportsList);
    } catch (error) {
      console.error('Error saving temporary reservation:', error && error.message, error);
      throw error;
    }
  };
  
  // הוספת פונקציה חדשה להסרת שיריון זמני
  const removeTempReservationForDate = async (transport, reservation, dateStr) => {
    // בדומה ל-addTempReservationForDate, אך מסיר את השיריון
    const transportIdRaw = transport.id ?? transport.transportId ?? null;
    if (transportIdRaw === null || transportIdRaw === undefined) {
      throw new Error('Transport id is missing');
    }
    const transportId = transportIdRaw.toString();
    let dateDoc = await fetchTransportsByDate(dateStr);
    let transportsList = dateDoc?.transports || [];
    const idx = transportsList.findIndex(t => {
      const tIdRaw = t.id ?? t.transportId ?? null;
      if (tIdRaw === null || tIdRaw === undefined) return false;
      const tId = tIdRaw.toString();
      return tId === transportId;
    });
    if (idx === -1) {
      // אין הסעה כזו בתאריך הזה
      throw new Error('Transport not found for this date');
    }
    const t = transportsList[idx];
    if (!Array.isArray(t.tempReservations)) t.tempReservations = [];
    // הסר את השיריון לפי id ותאריך
    t.tempReservations = t.tempReservations.filter(r => !(r.id === reservation.id && r.date === dateStr));
    transportsList[idx] = t;
    await saveTransportDate(dateStr, transportsList);
  };

  // אפס את הנוסע הנבחר בכל שינוי תאריך/הסעה/סוג פעולה
  useEffect(() => {
    setSelectedProfile(null);
  }, [reservationDate, tempReservationDialog.transport, tempReservationDialog.reservationType]);

  // רענון שיריונות זמניים עבור התאריך שנבחר בדיאלוג
  useEffect(() => {
    if (!tempReservationDialog.open || !reservationDate) {
      setTempReservationsForDialogDate({});
      return;
    }
    const dateStr = reservationDate.toISOString().slice(0, 10);
    fetchTransportsByDate(dateStr).then(dateDoc => {
      const transportsList = dateDoc?.transports || [];
      const map = {};
      for (const t of transportsList) {
        if (t.tempReservations && t.tempReservations.length > 0) {
          map[t.id.toString()] = t.tempReservations;
        }
      }
      setTempReservationsForDialogDate(map);
    });
  }, [reservationDate, tempReservationDialog.open]);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        sx={{
          width: '100%',
          borderRadius: '12px 12px 8px 8px',
          boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.27)',
          overflow: 'hidden',
          border: '1px solid rgb(118, 126, 136)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Table
          size="small"
          sx={{
            direction: 'rtl',
            borderCollapse: 'collapse',
            width: '100%',
            tableLayout: 'fixed',
            fontSize: '1.1rem',
            '& th, & td': {
              py: 0.5,
              px: 1,
              fontSize: '1rem',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', width: '60px', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>מס׳</TableCell>
              <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>ימים</TableCell>
              <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>
                <TableSortLabel
                  active={orderBy === 'cities'}
                  direction={orderBy === 'cities' ? order : 'asc'}
                  onClick={() => handleSort('cities')}
                  // showSortIcon
                  sx={{ '& .MuiTableSortLabel-icon': { opacity: 1 }, flexDirection: 'row-reverse' }}
                >
                  יישובים
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>מקומות פנויים</TableCell>
              <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>שיריון זמני</TableCell>
              <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>
                <TableSortLabel
                  active={orderBy === 'type'}
                  direction={orderBy === 'type' ? order : 'asc'}
                  onClick={() => handleSort('type')}
                  sx={{ '& .MuiTableSortLabel-icon': { opacity: 1 }, flexDirection: 'row-reverse' }}
                >
                  סוג הסעה
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>רשימת נוסעים</TableCell>
              <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1 }}>פעולה</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row, index) => {
              // Calculate available seats for selected day only (merged)
              let availableSeats = '-';
              if (selectedHebDay && (row.days || []).includes(selectedHebDay)) {
                availableSeats = getAvailableSeats(row, selectedHebDay, selectedDateStr);
              } else if (selectedHebDay) {
                availableSeats = 0;
              }

              // Passengers for selected day only (merged)
              let passengersForDay = row.passengers || [];
              if (selectedHebDay) {
                passengersForDay = getPassengersForDay(row, selectedHebDay, selectedDateStr);
              }

              return (
                <TableRow key={row.id || index} sx={{ fontSize: '1.1rem', borderBottom: 'none', borderTop: 'none' }}>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>{index + 1}</TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'center', flexWrap: 'nowrap' }}>
                      {row.days?.slice().sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)).map(day => (
                        <Box
                          key={day}
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            backgroundColor: '#f1f1f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 500,
                            fontSize: '0.95rem',
                            color: '#222',
                          }}
                        >
                          {dayShortMap[day] || day}
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {(row.cities || []).map((city, i) => (
                        <Chip
                          key={i}
                          label={city}
                          size="small"
                          sx={{
                            minWidth: 70,
                            minHeight: 26,
                            borderRadius: '13px',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            backgroundColor: '#f1f1f1',
                            mx: 0.5
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>
                    <Tooltip title="לחץ לפירוט מקומות פנויים">
                      <IconButton onClick={(e) => handleSeatsClick(e, row)} sx={{ p: 0, background: 'none', boxShadow: 'none', border: 'none', '&:hover': { background: 'none', boxShadow: 'none', border: 'none' } }}>
                        <EventSeatIcon sx={{ fontSize: 25, color: availableSeats > 0 ? 'success.main' : 'error.main' }} />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{availableSeats}</Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>
                    <Tooltip title="שיריון זמני">
                      <IconButton onClick={() => handleTempReservationClick(row)} sx={{ p: 0, background: 'none', boxShadow: 'none', border: 'none', '&:hover': { background: 'none', boxShadow: 'none', border: 'none' } }}>
                        <AccessTimeIcon sx={{ fontSize: 25, color: 'primary.main' }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0', fontSize: '1.08rem', fontWeight: 500 }}>{row.type}</TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>
                    <Tooltip title="צפייה באנשים">
                      <IconButton onClick={() => onViewPassengers(passengersForDay, [selectedHebDay])}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="עריכה">
                        <IconButton onClick={() => onEditClick(index)}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="מחק">
                        <IconButton onClick={() => onDeleteClick(index)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <Box sx={{ p: 2, minWidth: 200 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              מקומות פנויים לפי יום:
            </Typography>
            {selectedTransport && selectedTransport.days?.slice().sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)).map((day) => {
              // חישוב עם tempReservationsByTransport
              let seats = '-';
              if (selectedTransport) {
                // נשתמש בפונקציה שמחשבת גם זמניים
                seats = getAvailableSeats(selectedTransport, day, selectedDateStr);
              }
              return (
                <Typography key={day} sx={{ mb: 0.5 }}>
                  {(dayMap[day] || day)}: {seats} מקומות פנויים
                </Typography>
              );
            })}
          </Box>
        </Popover>

        {/* דיאלוג שיריון זמני */}
        <Dialog
          open={tempReservationDialog.open}
          onClose={handleTempReservationClose}
          maxWidth="sm"
          fullWidth
          dir="rtl"
        >
          <DialogTitle>שיריון מקום זמני</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="בחר תאריך"
                  value={reservationDate}
                  onChange={(newDate) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (newDate >= today) {
                      setReservationDate(newDate);
                    } else {
                      alert('לא ניתן לבחור תאריך בעבר');
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
                value={tempReservationDialog.reservationType}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) {
                    setTempReservationDialog(prev => ({
                      ...prev,
                      reservationType: newValue
                    }));
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
              {tempReservationDialog.reservationType === 'add' ? (
                <Autocomplete
                  options={[...profiles].sort((a, b) => a.name.localeCompare(b.name, 'he'))}
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
                (() => {
                  const dateStr = reservationDate.toISOString().slice(0, 10);
                  const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
                  const reservationDayIdx = reservationDate.getDay();
                  const reservationHebDay = daysMap[reservationDayIdx];
                  // נוסעים קבועים שמגיעים ביום הזה
                  const regular = (tempReservationDialog.transport?.passengers || []).filter(p => (p.arrivalDays || []).includes(reservationHebDay));
                  // נוסעים זמניים עם שיריון לאותו תאריך (מהסטייט החדש)
                  const tempList = (tempReservationsForDialogDate[tempReservationDialog.transport?.id?.toString()] || []).filter(r => r.date === dateStr);
                  // מיזוג ללא כפילויות (לפי id)
                  const ids = new Set();
                  const merged = [];
                  for (const p of regular) {
                    if (!ids.has(p.id)) {
                      merged.push(p);
                      ids.add(p.id);
                    }
                  }
                  for (const t of tempList) {
                    if (!ids.has(t.id)) {
                      merged.push(t);
                      ids.add(t.id);
                    }
                  }
                  // מיון לפי שם (א-ב)
                  merged.sort((a, b) => a.name.localeCompare(b.name, 'he'));
                  return (
                    <Autocomplete
                      options={merged}
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
                  );
                })()
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleTempReservationClose}>ביטול</Button>
            <Button
              onClick={handleTempReservationSave}
              variant="contained"
              disabled={!selectedProfile || !reservationDate}
            >
              שמור
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}

export default TransportTable; 