import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, InputAdornment, IconButton, Autocomplete, FormControl, InputLabel, Select, MenuItem, Stack, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TransportTable from '../components/TransportTable';
import AddTransportDialog from '../components/AddTransportDialog';
import EditTransportDialog from '../components/EditTransportDialog';
import ViewPassengersDialog from '../components/ViewPassengersDialog';
import { transportService } from '../firebase';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import { calculateAvailableSeatsByDay } from '../utils/transportUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { he } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';

function Transport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, index: null, data: null });
  const [viewDialog, setViewDialog] = useState({ open: false, passengers: [], days: [] });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, index: null });
  const [seatsDialogOpen, setSeatsDialogOpen] = useState(false);

  useEffect(() => {
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

    return () => unsubscribe();
  }, []);

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
      if (updatedTransport.tempReservations) {
        // אם יש שיריון זמני חדש, מוסיף אותו
        const lastReservation = updatedTransport.tempReservations[updatedTransport.tempReservations.length - 1];
        if (lastReservation && !lastReservation.id) {
          await transportService.addTemporaryReservation(updatedTransport.id, {
            ...lastReservation,
            id: Date.now().toString() // מזהה זמני
          });
        }
      }

      // מעדכן את ההסעה
      await transportService.updateTransport(updatedTransport.id, updatedTransport);
      handleEditClose();
    } catch (error) {
      console.error("Error updating transport:", error);
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
      await transportService.deleteTransport(transportToDelete.id);
      handleDeleteClose();
    } catch (error) {
      console.error("Error deleting transport:", error);
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
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          {/* ימין: תאריך, חיפוש, דוח */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="בחר תאריך"
                value={selectedDate ? new Date(selectedDate) : null}
                onChange={(newDate) => setSelectedDate(newDate ? newDate.toISOString().split('T')[0] : null)}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    sx: {
                      width: 200,
                      '& input': {
                        textAlign: 'right',
                        direction: 'rtl',
                        paddingRight: '14px'
                      }
                    },
                    InputLabelProps: {
                      shrink: true,
                    }
                  }
                }}
              />
            </LocalizationProvider>

            <TextField
              label="חיפוש"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
            />


          </Box>

          {/* שמאל: כפתורים בטור */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ height: 40, fontSize: '1rem', minWidth: '150px' }}
              onClick={() => setAddDialog(true)}
            >
              הוספת הסעה
            </Button>

            <Button
              variant="contained"
              color="primary"
              sx={{ height: 40, fontSize: '1rem', minWidth: '150px' }}
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
      />

      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteClose}
        dir="rtl"
      >
        <DialogTitle>אישור מחיקה</DialogTitle>
        <DialogContent>
          האם אתה בטוח שברצונך למחוק את ההסעה?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>ביטול</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            מחק
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={seatsDialogOpen} onClose={() => setSeatsDialogOpen(false)} maxWidth="md" fullWidth dir="rtl">
        <DialogTitle sx={{ fontWeight: 'bold' }}>רשימת מקומות פנויים בכל ההסעות</DialogTitle>
        <DialogContent>
          <div id="seatsReportContent">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>סוג הסעה</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>יישובים</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ימים</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>מקומות פנויים (לפי יום)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, idx) => {
                  const availableSeatsByDay = calculateAvailableSeatsByDay(row.type, row.passengers, row.days);
                  return (
                    <TableRow key={row.id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{(row.cities || []).join(', ')}</TableCell>
                      <TableCell>{(row.days || []).join(', ')}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {row.days && row.days.length > 0 ? row.days.map(day => (
                            <Box
                              key={day}
                              sx={{
                                border: '2px solid #ccc',
                                borderRadius: '16px',
                                padding: '6px 12px',
                                minWidth: '120px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                backgroundColor: '#f5f5f5'
                              }}
                            >
                              {day}: {availableSeatsByDay[day]}
                            </Box>
                          )) : '—'}
                        </Box>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
            color="primary"
            variant="outlined"
          >
            ייצוא ל־PDF
          </Button>
          <Button onClick={() => setSeatsDialogOpen(false)} color="primary" variant="contained">סגור</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Transport;
