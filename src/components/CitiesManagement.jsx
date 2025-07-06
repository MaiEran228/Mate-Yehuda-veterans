import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, TextField, Box, Typography, Alert,
  Tooltip, Fab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import { useCities } from '../hooks/useCities';

function CitiesManagement({ open, onClose }) {
  const { cities, loading, error, addCity, deleteCity, updateCity } = useCities();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [editingCity, setEditingCity] = useState({ old: '', new: '' });
  const [cityToDelete, setCityToDelete] = useState('');
  const [localError, setLocalError] = useState('');

  const handleAddCity = async () => {
    try {
      setLocalError('');
      const cityName = newCity.trim();
      if (!cityName) {
        setLocalError('יש להזין שם יישוב');
        return;
      }

      await addCity(cityName);
      setNewCity('');
      setAddDialogOpen(false);
    } catch (error) {
      setLocalError(error.message);
    }
  };

  const handleEditCity = async () => {
    try {
      setLocalError('');
      const newCityName = editingCity.new.trim();
      if (!newCityName) {
        setLocalError('יש להזין שם יישוב');
        return;
      }

      await updateCity(editingCity.old, newCityName);
      setEditDialogOpen(false);
      setEditingCity({ old: '', new: '' });
    } catch (error) {
      setLocalError(error.message);
    }
  };

  const handleDeleteCity = async () => {
    try {
      setLocalError('');
      await deleteCity(cityToDelete);
      setDeleteDialogOpen(false);
      setCityToDelete('');
    } catch (error) {
      setLocalError(error.message);
    }
  };

  const openEditDialog = (cityName) => {
    setEditingCity({ old: cityName, new: cityName });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (cityName) => {
    setCityToDelete(cityName);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      {/* דיאלוג ראשי לניהול יישובים */}
      <Dialog 
        open={open} 
        onClose={onClose} 
        dir="rtl"
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">ניהול יישובים</Typography>
          <Tooltip title="הוספת יישוב חדש" arrow>
            <IconButton 
              color="primary" 
              onClick={() => setAddDialogOpen(true)}
              sx={{ ml: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {localError || error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>טוען...</Typography>
            </Box>
          ) : (
            <List>
              {cities.slice().sort((a, b) => a.localeCompare(b, 'he')).map((city) => (
                <ListItem 
                  key={city}
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <ListItemText primary={city} />
                  <ListItemSecondaryAction>
                    <Tooltip title="עריכת יישוב" arrow>
                      <IconButton 
                        edge="end" 
                        onClick={() => openEditDialog(city)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="מחיקת יישוב" arrow>
                      <IconButton 
                        edge="end" 
                        onClick={() => openDeleteDialog(city)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          borderTop: '1px solid #e0e0e0',
          p: 2
        }}>
          <Button onClick={onClose}>סגור</Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג הוספת יישוב */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => { setAddDialogOpen(false); setNewCity(''); setLocalError(''); }}
        dir="rtl"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>הוספת יישוב חדש</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="שם היישוב"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCity(); }}
              error={!!localError}
              helperText={localError}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialogOpen(false); setNewCity(''); setLocalError(''); }}>
            ביטול
          </Button>
          <Button 
            onClick={handleAddCity}
            variant="contained"
            disabled={!newCity.trim()}
          >
            הוסף
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג עריכת יישוב */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => { setEditDialogOpen(false); setEditingCity({ old: '', new: '' }); setLocalError(''); }}
        dir="rtl"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>עריכת יישוב</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="שם היישוב"
              value={editingCity.new}
              onChange={(e) => setEditingCity(prev => ({ ...prev, new: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEditCity(); }}
              error={!!localError}
              helperText={localError}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditDialogOpen(false); setEditingCity({ old: '', new: '' }); setLocalError(''); }}>
            ביטול
          </Button>
          <Button 
            onClick={handleEditCity}
            variant="contained"
            disabled={!editingCity.new.trim()}
          >
            עדכן
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג אישור מחיקה */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => { setDeleteDialogOpen(false); setCityToDelete(''); }}
        dir="rtl"
        maxWidth="xs"
      >
        <DialogTitle>אישור מחיקת יישוב</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את היישוב <b>{cityToDelete}</b>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            פעולה זו תמחק את היישוב מכל ההסעות הקיימות.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setCityToDelete(''); }}>
            ביטול
          </Button>
          <Button 
            onClick={handleDeleteCity} 
            color="error" 
            variant="contained"
          >
            מחק
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CitiesManagement; 