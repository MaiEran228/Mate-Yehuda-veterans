import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, InputAdornment, IconButton, Autocomplete } from '@mui/material';
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

function Transport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  
  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, index: null, data: null });
  const [viewDialog, setViewDialog] = useState({ open: false, passengers: [], days: [] });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, index: null });
  const [seatsDialogOpen, setSeatsDialogOpen] = useState(false);

  // Subscribe to transports
  useEffect(() => {
    const unsubscribe = transportService.subscribeToTransports(
      (transportList) => {
        setData(transportList);
        // מחלץ את כל היישובים הייחודיים מהנתונים
        const cities = [...new Set(transportList.flatMap(transport => transport.cities || []))];
        setAvailableCities(cities);
        if (loading) setLoading(false);
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
      {/* שורת חיפוש */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        p: 3,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        mb: 6
      }}>
        <Box sx={{ width: 300 }}>
          <TextField
            fullWidth
            placeholder="חיפוש לפי שם או אזור מגורים..."
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

        <TextField
          label="מיון לפי"
          select
          SelectProps={{ native: true }}
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          size="small"
          InputProps={{ notched: false }}
          InputLabelProps={{
            shrink: true,
            sx: {
              right: 24,
              left: 'unset',
              textAlign: 'right',
              transformOrigin: 'top right',
              direction: 'rtl',
              backgroundColor: '#f5f5f5',
              px: 1,
              color: 'rgb(82, 103, 125)'
            }
          }}
          sx={{
            width: 200,
            '& .MuiOutlinedInput-root': {
              height: 36,
              fontSize: '0.9rem',
              color: 'rgb(85, 105, 125)',
              '& fieldset': { borderColor: 'rgb(85, 105, 125)' },
              '&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#7b8f99' }
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.85rem',
            }
          }}
        />

        <Button
          variant="contained"
          onClick={handleAddOpen}
          sx={{ height: 40, fontSize: '1rem', minWidth: '120px' }}
        >
          הוספת הסעה
        </Button>
        <Button
          variant="outlined"
          color="primary"
          sx={{ height: 40, fontSize: '1rem', minWidth: '150px' }}
          onClick={() => setSeatsDialogOpen(true)}
        >
          מקומות פנויים בהסעה
        </Button>
      </Box>

      {/* אזור הטבלה */}
      <Box sx={{ 
        px: 3,
        pb: 3,
        flex: 1,
        overflow: 'auto',
        height: 'calc(100vh - 120px)'  // גובה מסך פחות גובה שורת החיפוש ומרווחים
      }}>
        <TransportTable
          data={data}
          searchTerm={searchTerm}
          sortField={sortField}
          onViewPassengers={handleViewOpen}
          onEditClick={handleEditOpen}
          onDeleteClick={handleDeleteOpen}
        />
      </Box>

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

      {/* דיאלוג אישור מחיקה */}
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

      {/* דיאלוג מקומות פנויים */}
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
                        {row.days && row.days.length > 0 ? row.days.map(day => (
                          <Box key={day} component="span" sx={{ mr: 1 }}>
                            <b>{day}:</b> {availableSeatsByDay[day]}
                          </Box>
                        )) : '—'}
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