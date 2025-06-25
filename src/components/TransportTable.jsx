import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton,
  Tooltip, Chip, Typography, Paper, TableSortLabel
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { collection, getDocs } from 'firebase/firestore';
import { db, saveTransportDate, fetchTransportsByDate } from '../firebase';
import CustomDialog from './CustomDialog';
import TempReservationDialog from './TempTransportDialog';

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

  // מיון
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  // הוסף state להודעות דיאלוג
  const [dialog, setDialog] = useState({ open: false, message: '', type: 'info' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  const [reservationType, setReservationType] = useState('add');

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
    const dateDoc = await fetchTransportsByDate(dateStr);
    const transportsList = dateDoc?.transports || [];
    const map = {};
    for (const t of transportsList) {
      if (t.tempReservations && t.tempReservations.length > 0) {
        map[t.id.toString()] = t.tempReservations;
      }
    }

    setTempReservationsByTransport(map);
  };

  useEffect(() => {
    fetchTempReservations();
  }, [selectedDate]);

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
    setSelectedTransport(transport);
    setTempReservationDialog({
      open: true,
      transport,
      reservationType: 'add'
    });
    setReservationType('add');
    // Set the reservationDate to the selectedDate from props if available
    if (selectedDate) {
      setReservationDate(selectedDate.toDate ? selectedDate.toDate() : new Date(selectedDate));
    }
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
      setDialog({ open: true, message: 'יש למלא את כל השדות', type: 'error' });
      return;
    }

    const dateStr = reservationDate.toISOString().slice(0, 10);
    const transport = selectedTransport;
    const totalSeats = transport.type === 'מונית' ? 4 : 14;
    // קביעת היום בשבוע של התאריך שנבחר להזמנה
    const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const reservationDayIdx = reservationDate.getDay();
    const reservationHebDay = daysMap[reservationDayIdx];

    // בדיקה: האם יום ההסעה בתוקף להסעה זו
    if (!transport.days || !transport.days.includes(reservationHebDay)) {
      setDialog({ open: true, message: 'אי אפשר לשריין ליום זה – ההסעה לא פועלת ביום הזה', type: 'error' });
      return;
    }

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
        setDialog({ open: true, message: 'הנוסע הוסר בהצלחה מהשיריון הזמני', type: 'success' });
      } catch (error) {
        console.error('Error removing temporary reservation:', error && error.message, error);
        setDialog({ open: true, message: 'אירעה שגיאה בהסרת הנוסע', type: 'error' });
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
      setDialog({ open: true, message: 'אין מקום פנוי בהסעה!', type: 'error' });
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
      setDialog({ open: true, message: 'שיריון זמני נשמר בהצלחה', type: 'success' });
    } catch (error) {
      console.error('Error saving temporary reservation:', error && error.message, error);
      setDialog({ open: true, message: 'אירעה שגיאה בשמירת השינויים', type: 'error' });
    }
  };

  const addTempReservationForDate = async (transport, reservation, dateStr) => {  
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

  const handleDelete = () => {
    // Implement the delete logic here
    console.log('Deleting item:', deleteDialog.item);
    // Close the dialog
    setDeleteDialog({ open: false, item: null });
  };

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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {selectedHebDay && (row.days || []).includes(selectedHebDay) ? (
                        <Tooltip title={`מקומות פנויים: ${availableSeats}`}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            backgroundColor: availableSeats > 0 ? '#4caf50' : '#f44336',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            minWidth: '80px',
                            justifyContent: 'center'
                          }}>
                            <EventSeatIcon sx={{ fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                              {availableSeats}
                            </Typography>
                          </Box>
                        </Tooltip>
                      ) : (
                        <Tooltip title="אין הסעה ביום זה">
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            backgroundColor: '#9e9e9e',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            minWidth: '80px',
                            justifyContent: 'center'
                          }}>
                            <EventSeatIcon sx={{ fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                              —
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
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

        {/* דיאלוג שיריון זמני */}
        <TempReservationDialog
          open={tempReservationDialog.open}
          onClose={handleTempReservationClose}
          transport={tempReservationDialog.transport}
          reservationType={reservationType}
          setReservationType={setReservationType}
          profiles={profiles}
          selectedProfile={selectedProfile}
          setSelectedProfile={setSelectedProfile}
          reservationDate={reservationDate}
          setReservationDate={setReservationDate}
          selectedDate={selectedDate}
          selectedHebDay={selectedHebDay}
          fetchTransportsByDate={fetchTransportsByDate}
          onSave={handleTempReservationSave}
          loading={false}
        />
      </Paper>

      {/* דיאלוג הודעה גנרי */}
      <CustomDialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        title={dialog.type === 'error' ? 'שגיאה' : dialog.type === 'success' ? 'הצלחה' : 'הודעה'}
        actions={
          <Button onClick={() => setDialog({ ...dialog, open: false })} variant="contained" color="primary">
            סגור
          </Button>
        }
      >
        {dialog.message}
      </CustomDialog>

      <CustomDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        title="אישור מחיקה"
        dialogContentSx={{ mt: 2 }}
        actions={[
          <Button
            key="cancel"
            onClick={() => setDeleteDialog({ open: false, item: null })}
            variant="outlined"
            sx={{
              borderColor: 'white',
              color: 'black',
              '&:hover': {
                borderColor: 'black',
                color: 'black'
              },
              minWidth: '100px'
            }}
          >
            ביטול
          </Button>,
            <Button
            key="confirm"
            onClick={handleDelete}
              variant="contained"
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': {
                backgroundColor: '#aa2424'
              },
              minWidth: '100px'
            }}
          >
            אישור
            </Button>
        ]}
      >
        <Typography variant="body1" sx={{
          textAlign: 'right',
          color: 'black',
          fontSize: '1.1rem',
          fontWeight: 500
        }}>
          האם אתה בטוח שברצונך למחוק את {deleteDialog.item?.name}?
        </Typography>
      </CustomDialog>

    </Box>
  );
}

export default TransportTable; 