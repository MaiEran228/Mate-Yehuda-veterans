import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, InputAdornment, IconButton, Autocomplete } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TransportTable from '../components/TransportTable';
import AddTransportDialog from '../components/AddTransportDialog';
import EditTransportDialog from '../components/EditTransportDialog';
import ViewPassengersDialog from '../components/ViewPassengersDialog';
import { transportService } from '../firebase';

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
          <Autocomplete
            freeSolo
            options={availableCities}
            value={searchTerm}
            onChange={(event, newValue) => setSearchTerm(newValue || '')}
            onInputChange={(event, newValue) => setSearchTerm(newValue)}
            filterOptions={(options, state) => {
              const inputValue = state.inputValue.toLowerCase();
              return options.filter(option => 
                option.toLowerCase().startsWith(inputValue)
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="חיפוש לפי יישוב"
                variant="outlined"
                size="small"
                dir="rtl"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ position: 'absolute', right: 0, zIndex: 1 }}>
                      <SearchIcon sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        edge="end"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    paddingRight: '40px !important'
                  }
                }}
                sx={{ 
                  width: 280,
                  '& .MuiOutlinedInput-root': {
                    height: 36,
                    fontSize: '0.9rem',
                    color: 'rgb(85, 105, 125)',
                    '& fieldset': { borderColor: 'rgb(85, 105, 125)' },
                    '&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#7b8f99' }
                  }
                }}
              />
            )}
            sx={{
              width: 280,
              '& .MuiAutocomplete-listbox': {
                backgroundColor: 'white',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '& .MuiAutocomplete-option': {
                  padding: '8px 16px',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }
              }
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
              color: 'rgb(85, 105, 125)',
              '&.Mui-focused': { color: '#7b8f99' }
            }
          }}
        >
          <option value="">ללא מיון</option>
          <option value="days">ימים</option>
          <option value="cities">יישובים</option>
          <option value="seats">מקומות פנויים</option>
          <option value="type">סוג הסעה</option>
        </TextField>

        <Button
          variant="contained"
          color="primary"
          onClick={handleAddOpen}
          size="small"
          sx={{ 
            height: 36,
            fontSize: '0.9rem'
          }}
        >
          הוספת הסעה
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
    </>
  );
}

export default Transport;