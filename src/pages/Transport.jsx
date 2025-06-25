import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, InputAdornment, IconButton, Autocomplete, FormControl, InputLabel, Select, MenuItem, Stack, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TransportTable from '../components/TransportTable';
import AddTransportDialog from '../components/AddTransportDialog';
import EditTransportDialog from '../components/EditTransportDialog';
import ViewPassengersDialog from '../components/ViewPassengersDialog';
import { transportService, fetchTransportsByDate, fetchAllProfiles, updateProfile } from '../firebase';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import { calculateAvailableSeatsByDay } from '../utils/transportUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { he } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';

// מיפוי ימים לעברית
const daysMap = {
  0: "יום א'",
  1: "יום ב'",
  2: "יום ג'",
  3: "יום ד'",
  4: "יום ה'",
  5: "יום ו'",
  6: "שבת"
};

function Transport() {
  const [tempReservationsByTransport, setTempReservationsByTransport] = useState({});
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [profiles, setProfiles] = useState([]);

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, index: null, data: null });
  const [viewDialog, setViewDialog] = useState({ open: false, passengers: [], days: [] });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, index: null });
  const [seatsDialogOpen, setSeatsDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ open: false, message: '' });

  // New: fetch transports by date
  useEffect(() => {
    setLoading(true);
    const unsubscribe = transportService.subscribeToTransports(
      (transports) => {
        setData(transports);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching transports:", error);
        setLoading(false);
      }
    );
    // טען את כל הפרופילים
    fetchAllProfiles().then(setProfiles);
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    async function fetchTempReservations() {
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
    }
  
    fetchTempReservations();
  }, [selectedDate]);
  

  // Add handlers
  const handleAddOpen = () => setAddDialog(true);
  const handleAddClose = () => setAddDialog(false);
  const handleAddSave = async (newTransport) => {
    try {
      await transportService.addTransport(newTransport);
      setAddDialog(false);
    } catch (error) {
      console.error("Error adding transport:", error);
    }
  };

  // Edit handlers
  const handleEditOpen = (index) => {
    setEditDialog({ open: true, index, data: data[index] });
  };
  const handleEditClose = () => {
    setEditDialog({ open: false, index: null, data: null });
  };
  const handleEditSave = async (updatedTransport) => {
    try {
      if (updatedTransport.tempReservations && updatedTransport.tempReservations.length > 0) {
        const lastIndex = updatedTransport.tempReservations.length - 1;
        const lastReservation = updatedTransport.tempReservations[lastIndex];
  
        // בודק אם השריון האחרון עדיין לא קיבל מזהה
        if (lastReservation && !lastReservation.id) {
          // שולף את כל ה-id הקיימים שהינם מספרים
          const existingIds = updatedTransport.tempReservations
            .map(r => Number(r.id))
            .filter(id => !isNaN(id));
  
          // מחשב את ה-id הבא: מקסימום קיים + 1 או מתחיל מ-0
          const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0;
  
          // מוסיף את השריון החדש עם id תקין במסד הנתונים
          await transportService.addTemporaryReservation(updatedTransport.id, {
            ...lastReservation,
            id: nextId.toString()
          });
  
          // מעדכן גם את האובייקט המקומי כדי לשמור על ה-id החדש
          updatedTransport.tempReservations[lastIndex].id = nextId.toString();
        }
      }
  
      // מעדכן את ההסעה במסד הנתונים עם השריונות המעודכנים
      await transportService.updateTransport(updatedTransport.id, updatedTransport);
      handleEditClose();
  
    } catch (error) {
      console.error("Error updating transport:", error?.message, error);
    }
  };
  

  // Delete handlers
  const handleDeleteOpen = (index) => {
    setDeleteDialog({ open: true, index });
  };

  const handleDeleteClose = () => {
    setDeleteDialog({ open: false, index: null });
  };

  const handleDeleteConfirm = async () => {
    try {
      const transportToDelete = data[deleteDialog.index];
      const passengers = transportToDelete.passengers || [];
      // עדכון כל הפרופילים של הנוסעים להסיר את השיבוץ
      for (const passenger of passengers) {
        await updateProfile(passenger.id, { transport: '' }); // או "נדרש שיבוץ"
      }
      // ריקון הנוסעים מההסעה (ליתר ביטחון)
      if (passengers.length > 0) {
        await transportService.updateTransport(transportToDelete.id, {
          ...transportToDelete,
          passengers: []
        });
      }
      // מחיקת ההסעה
      await transportService.deleteTransport(transportToDelete.id);
      // הודעה מתאימה
      let text = `ההסעה ${transportToDelete.cities?.join(', ') || ''} נמחקה בהצלחה.\nימים: ${(transportToDelete.days || []).join(', ')}`;
      setSuccessMessage({
        open: true,
        message: passengers.length > 0
          ? { text, passengers: passengers.map(p => ({ name: p.name, id: p.id })) }
          : text
      });
      setData(prev => prev.filter((t, i) => i !== deleteDialog.index));
      handleDeleteClose();
    } catch (error) {
      console.error("Error deleting transport:", error);
      setSuccessMessage({ open: true, message: 'אירעה שגיאה במחיקת ההסעה. אנא נסה שוב.' });
    }
  };

  // View handlers
  const handleViewOpen = (passengers, days) => {
    setViewDialog({ open: true, passengers, days });
  };
  const handleViewClose = () => {
    setViewDialog({ open: false, passengers: [], days: [] });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3, mt:1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, px: 3 }}>
          {/* ימין: תאריך, חיפוש, דוח */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexDirection: 'column', alignItems: 'flex-start' }}>
            {/* שורה עליונה: תאריך + יום */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="he">
                <DatePicker
                  label="תאריך"
                  value={selectedDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setSelectedDate(newValue);
                    }
                  }}
                  inputFormat="DD/MM/YYYY"
                  slotProps={{
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
                    },
                    textField: {
                      size: 'small',
                      sx: {
                        ml: 2,
                        minWidth: 130,
                        maxWidth: 160,
                        direction: 'rtl',
                        '& .MuiOutlinedInput-notchedOutline legend': {
                          display: 'none',
                        },
                        '& .MuiIconButton-root': {
                          outline: 'none',
                          '&:focus': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                        },
                      },
                      InputProps: {
                        notched: false,
                        sx: {
                          flexDirection: 'row-reverse',
                          input: {
                            textAlign: 'right',
                          },
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
              <Typography sx={{ ml: 1, minWidth: 60, color: 'rgba(64, 99, 112, 0.72)', fontWeight: 600, fontSize: '1.5rem' }}>
                {daysMap[selectedDate ? selectedDate.day() : dayjs().day()]}
              </Typography>
            </Box>
            {/* שורה שניה: שדה חיפוש */}
            <Box sx={{ width: '100%', mt: 1 }}>
              <TextField
                fullWidth
                placeholder="חיפוש לפי אזור מגורים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        edge="end"
                        sx={{ mr: -0.5 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: '#fff',
                    '&:hover': {
                      backgroundColor: '#fff',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(118, 126, 136, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(118, 126, 136, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(118, 126, 136, 0.6)',
                    },
                  },
                }}
                sx={{
                  maxWidth: '400px',
                  '& .MuiInputBase-root': {
                    height: '40px',
                  },
                }}
              />
            </Box>
          </Box>

          {/* שמאל: כפתורים בטור */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
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
                minWidth: '90px',
                height: '40px',
                fontSize: '0.8rem',
                gap: 1,
              }}
              onClick={() => setAddDialog(true)}
            >  הוספת הסעה
            </Button>

            <Button
              variant="contained"
              color="primary"
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
                minWidth: '90px',
                height: '40px',
                fontSize: '0.8rem',
              }}
              onClick={() => setSeatsDialogOpen(true)}
            >
              דוח מקומות פנויים בהסעה
            </Button>
          </Box>
        </Box>


        <Box sx={{ px: 3, pb: 3, flex: 1, overflow: 'auto', height: 'calc(100vh - 120px)' }}>
          <TransportTable
            data={data}
            searchTerm={searchTerm}
            onViewPassengers={handleViewOpen}
            onEditClick={handleEditOpen}
            onDeleteClick={handleDeleteOpen}
            selectedDate={selectedDate}
            tempReservationsByTransport={tempReservationsByTransport} // ✅ זה חדש

          />
        </Box>
      </Box >

      <AddTransportDialog
        open={addDialog}
        onClose={handleAddClose}
        onAdd={handleAddSave}
        initialData={{
          days: [],
          cities: [],
          seats: '',
          type: '',
          passengers: []
        }}
      />

      <EditTransportDialog
        open={editDialog.open}
        onClose={handleEditClose}
        onSave={handleEditSave}
        transportData={editDialog.data}
      />

      <ViewPassengersDialog
        open={viewDialog.open}
        onClose={handleViewClose}
        passengers={viewDialog.passengers}
        transportDays={viewDialog.days}
        profiles={profiles}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteClose}
        dir="rtl"
      >
        <DialogTitle>אישור מחיקה</DialogTitle>
        <DialogContent>
          {deleteDialog.index !== null && (
            <>
              <Typography>
                האם אתה בטוח שברצונך למחוק את ההסעה:
                <b> {data[deleteDialog.index]?.cities?.join(', ') || ''} </b>
                בימים: <b>{(data[deleteDialog.index]?.days || []).join(', ')}</b>?
              </Typography>
              {(data[deleteDialog.index]?.passengers?.length > 0) && (
                <>
                  <Typography color="error" sx={{ mt: 2, mb: 1 }}>
                    יש נוסעים משובצים להסעה זו! לאחר המחיקה תצטרך לשבץ אותם מחדש:
                  </Typography>
                  <Stack spacing={1}>
                    {data[deleteDialog.index]?.passengers.map((p) => (
                      <Chip
                        key={p.id}
                        label={`${p.name} (ת.ז. ${p.id})`}
                        sx={{ fontSize: '1rem', fontWeight: 500, borderRadius: '16px', px: 2, py: 1, background: '#ffe0e0' }}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>ביטול</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            מחק
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={seatsDialogOpen} onClose={() => setSeatsDialogOpen(false)} maxWidth="md" fullWidth dir="rtl">
        <DialogTitle sx={{ position: 'relative', pr: 4, fontWeight: 'bold' }}>
          רשימת מקומות פנויים בכל ההסעות
          <Button
            onClick={() => setSeatsDialogOpen(false)}
            aria-label="סגור"
            sx={{
              position: 'absolute',
              left: 8,
              top: 8,
              minWidth: '32px',
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#888',
              borderRadius: '50%',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ':hover': {
                backgroundColor: '#f0f0f0',
                color: '#333',
              },
              '&:focus': {
                border: 'none',
                outline: 'none',
              },
              '&:active': {
                border: 'none',
                outline: 'none',
              },
              p: 0,
            }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </DialogTitle>
        <DialogContent sx={{ overflow: 'hidden' }}>
          <Box sx={{ maxHeight: '400px', overflowY: 'auto', direction: 'ltr', pr: 1 }}>
            <Table style={{ direction: 'ltr' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>מקומות פנויים (לפי יום)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>ימים</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>יישובים</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>סוג הסעה</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>#</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, idx) => {
                  const availableSeatsByDay = calculateAvailableSeatsByDay(row.type, row.passengers, row.days);
                  return (
                    <TableRow key={row.id || idx}>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                          {row.days && row.days.length > 0 ? row.days.map(day => (
                            <Box
                              key={day}
                              sx={{
                                border: '2px solid #ccc',
                                borderRadius: '16px',
                                padding: '6px 12px',
                                minWidth: '120px',
                                textAlign: 'right',
                                fontWeight: 'bold',
                                backgroundColor: '#f5f5f5',
                              }}
                            >
                              {day}: {availableSeatsByDay[day]}
                            </Box>
                          )) : '—'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{(row.days || []).join(', ')}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{(row.cities || []).join(', ')}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{row.type}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{idx + 1}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              const input = document.getElementById('seatsReportContent');
              if (!input) return;
              const canvas = await html2canvas(input);
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              pdf.save('רשימת מקומות פנויים בהסעות.pdf');
            }}
            variant="outlined"
            sx={{
              border: '1.7px solid rgba(64, 99, 112, 0.72)',
              color: 'rgba(64, 99, 112, 0.72)',
              fontWeight: 'bold',
              ':hover': {
                borderColor: '#7b8f99',
                color: '#5a676e',
                outline: 'none'
              },
              '&:focus': {
                outline: 'none'
              },
              '&:active': {
                outline: 'none'
              },
              minWidth: 'auto',
              ml: 2
            }}
          >
            ייצוא ל־PDF
          </Button>
          <Button
            onClick={() => setSeatsDialogOpen(false)}
            variant="contained"
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
              minWidth: '110px',
            }}
          >
            סגור
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={successMessage.open}
        onClose={() => setSuccessMessage({ open: false, message: '' })}
        dir="rtl"
      >
        <DialogTitle sx={{ 
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          fontWeight: 'bold'
        }}>
          הודעת מערכת
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {successMessage.message && typeof successMessage.message === 'object' ? (
            <>
              <Typography sx={{ mb: 1 }}>{successMessage.message.text}</Typography>
              {successMessage.message.passengers && successMessage.message.passengers.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 'bold', mb: 1 }}>נוסעים שדורשים שיבוץ מחדש:</Typography>
                  <Stack spacing={1}>
                    {successMessage.message.passengers.map((p) => (
                      <Chip
                        key={p.id}
                        label={`${p.name} (ת.ז. ${p.id})`}
                        sx={{ fontSize: '1rem', fontWeight: 500, borderRadius: '16px', px: 2, py: 1, background: '#e3f2fd' }}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          ) : (
            <Typography>{successMessage.message}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSuccessMessage({ open: false, message: '' })}
            variant="contained"
            sx={{
              backgroundColor: 'rgba(142, 172, 183, 0.72)',
              '&:hover': {
                backgroundColor: 'rgb(185, 205, 220)',
              },
              color: 'black',
              fontWeight: 'bold'
            }}
          >
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Transport;


