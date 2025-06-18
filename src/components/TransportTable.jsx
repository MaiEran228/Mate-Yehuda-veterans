import React, { useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Select, MenuItem, InputLabel, FormControl,
  Button, IconButton, Tooltip, Chip, Stack,
  Popover, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, Autocomplete, Paper, ToggleButton, ToggleButtonGroup
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
import { db } from '../firebase';

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
  onDeleteClick
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

  const handleSeatsClick = (event, transport) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransport(transport);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedTransport(null);
  };

  const open = Boolean(anchorEl);

  const filteredData = [...data]
    .filter((row) =>
      (row.cities || []).some(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      if (sortField === 'days') {
        // Sort by first day in order
        const aIdx = dayOrder.indexOf((a.days || [])[0]);
        const bIdx = dayOrder.indexOf((b.days || [])[0]);
        return aIdx - bIdx;
      }
      if (sortField === 'cities') {
        return (a.cities?.[0] || '') < (b.cities?.[0] || '') ? -1 : (a.cities?.[0] || '') > (b.cities?.[0] || '') ? 1 : 0;
      }
      if ((a[sortField] || '') < (b[sortField] || '')) return -1;
      if ((a[sortField] || '') > (b[sortField] || '')) return 1;
      return 0;
    });

  const handleTempReservationClick = (transport) => {
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

  const handleTempReservationSave = async () => {
    if (!selectedProfile || !selectedDay || !reservationDate) {
      alert('יש למלא את כל השדות');
      return;
    }

    try {
      const updatedTransport = { ...selectedTransport };

      // אם זו הוספת נוסע
      if (tempReservationDialog.reservationType === 'add') {
        // בדיקה אם יש מקום פנוי
        const availableSeats = calculateAvailableSeatsByDay(
          updatedTransport.type,
          updatedTransport.passengers || [],
          updatedTransport.days,
          updatedTransport.tempReservations
        );

        if (availableSeats[selectedDay] <= 0) {
          alert('אין מקומות פנויים ביום זה');
          return;
        }

        // הוספת הנוסע לרשימת הנוסעים
        const newPassenger = {
          id: selectedProfile.id,
          name: selectedProfile.name,
          hasCaregiver: selectedProfile.hasCaregiver || false,
          arrivalDays: [selectedDay]
        };

        updatedTransport.passengers = [...(updatedTransport.passengers || []), newPassenger];
      }
      // אם זו הסרת נוסע
      else if (tempReservationDialog.reservationType === 'remove') {
        // מציאת הנוסע ברשימה
        const passengerIndex = (updatedTransport.passengers || []).findIndex(p => p.id === selectedProfile.id);
        if (passengerIndex === -1) {
          alert('הנוסע לא נמצא ברשימה');
          return;
        }

        // הסרת הנוסע מהרשימה
        updatedTransport.passengers = updatedTransport.passengers.filter(p => p.id !== selectedProfile.id);
      }

      // עדכון המקומות הפנויים
      updatedTransport.availableSeatsByDay = calculateAvailableSeatsByDay(
        updatedTransport.type,
        updatedTransport.passengers || [],
        updatedTransport.days,
        updatedTransport.tempReservations
      );

      // שמירת השינויים
      onEditClick(updatedTransport);
      handleTempReservationClose();
    } catch (error) {
      console.error('Error saving temporary reservation:', error);
      alert('אירעה שגיאה בשמירת השינויים');
    }
  };

  return (
    <Box sx={{
      backgroundColor: '#fff',
      borderRadius: 2,
      boxShadow: 1,
      overflow: 'hidden'
    }}>
      <Table sx={{ minWidth: '800px', tableLayout: 'fixed', fontSize: '1.1rem' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', width: '60px', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0' }}>מס׳</TableCell>
            <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0' }}>ימים</TableCell>
            <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0' }}>יישובים</TableCell>
            <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0' }}>מקומות פנויים</TableCell>
            <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0' }}>שיריון זמני</TableCell>
            <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0' }}>סוג הסעה</TableCell>
            <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem', borderRight: '1px solid #e0e0e0' }}>רשימת נוסעים</TableCell>
            <TableCell sx={{ textAlign: 'center', fontSize: '1.15rem' , borderRight: '1px solid #e0e0e0' }}>פעולה</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((row, index) => {
            const availableSeatsByDay = calculateAvailableSeatsByDay(row.type, row.passengers, row.days);
            const hasAvailableSeats = Object.values(availableSeatsByDay).some(seats => seats > 0);
            // Sort days by order
            const sortedDays = (row.days || []).slice().sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

            return (
              <TableRow key={row.id || index} sx={{ fontSize: '1.1rem', borderBottom: 'none', borderTop: 'none' }}>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>{index + 1}</TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'center', flexWrap: 'nowrap' }}>
                    {sortedDays.map(day => (
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
                      <EventSeatIcon sx={{ fontSize: 25, color: hasAvailableSeats ? 'success.main' : 'error.main' }} />
                    </IconButton>
                  </Tooltip>
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
                    <IconButton onClick={() => onViewPassengers(row.passengers || [], row.days || [])}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' , borderRight: '1px solid #e0e0e0' }}>
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
            const seats = calculateAvailableSeatsByDay(
              selectedTransport.type,
              selectedTransport.passengers,
              [day]
            )[day];
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
                options={profiles}
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
                options={tempReservationDialog.transport?.passengers || []}
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
    </Box>
  );
}

export default TransportTable; 