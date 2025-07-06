import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, InputLabel,
  FormControl, Checkbox, ListItemText, OutlinedInput, Box, Typography,
  IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCities } from '../../hooks/useCities';
import { TextField } from '@mui/material';

const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const transportTypes = ['מיניבוס', 'מונית'];

const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

function EditTransportDialog({ open, onClose, onSave, transportData }) {
  const [formData, setFormData] = React.useState({
    days: [],
    cities: [],
    type: '',
    seats: ''
  });
  
  const { cities: citiesList, addCity, deleteCity } = useCities();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState(null);
  const [addCityError, setAddCityError] = useState("");
  const [addCityTouched, setAddCityTouched] = useState(false);

  React.useEffect(() => {
    if (open && transportData) {
      setFormData({
        days: transportData.days || [],
        cities: transportData.cities || [],
        type: transportData.type || '',
        seats: transportData.seats || '',
        id: transportData.id // חשוב לשמור את ה-ID
      });
    }
  }, [open, transportData]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    if (field === 'type') {
      // עדכון אוטומטי של מספר המקומות לפי סוג ההסעה
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        seats: value === 'מיניבוס' ? 14 : value === 'מונית' ? 4 : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = () => {
    if (transportData && transportData.id) {
      onSave({ ...formData, id: transportData.id });
    }
  };

  async function handleAddCity() {
    setAddCityTouched(true);
    const city = newCity.trim();
    if (!city) return;
    
    try {
      await addCity(city);
      setNewCity("");
      setAddDialogOpen(false);
      setAddCityError("");
      setAddCityTouched(false);
    } catch (error) {
      setAddCityError(error.message);
    }
  }

  async function handleRemoveCity(city) {
    try {
      await deleteCity(city);
      setFormData(prev => ({
        ...prev,
        cities: (prev.cities || []).filter(c => c !== city)
      }));
    } catch (error) {
      console.error('שגיאה במחיקת יישוב:', error);
    }
  }

  function handleTrashClick(city) {
    setCityToDelete(city);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (cityToDelete) {
      await handleRemoveCity(cityToDelete);
    }
    setDeleteDialogOpen(false);
    setCityToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setCityToDelete(null);
  }

  if (!transportData) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        dir="rtl"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 350,
            maxWidth: 450,
          }
        }}
      >
      <DialogTitle sx={{ fontWeight: 700, color: 'rgb(64, 99, 112, 0.72)' }}>
        עריכת הסעה
      </DialogTitle>
      <DialogContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 2.5,
          pt: 2,
        }}>
          {/* שורה ראשונה עם ימים וסוג הסעה */}
          <Box sx={{ 
            display: 'flex',
            width: '100%',
            justifyContent: 'flex-start',
            gap: '25px'
          }}>
            {/* בחירת ימים מרובה */}
            <Box>
              <FormControl sx={{ width: '170px', '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' } }} size="small">
                <InputLabel sx={{ right: 37, left: 'unset', transformOrigin: 'top right', direction: 'rtl', px: 0.5, backgroundColor: 'white' }}>ימים</InputLabel>
                <Select
                  multiple
                  value={formData?.days || []}
                  onChange={handleChange('days')}
                  input={<OutlinedInput label="ימים" />}
                  renderValue={(selected) => selected.slice().sort((a, b) => arrivalDaysOrder.indexOf(a) - arrivalDaysOrder.indexOf(b)).join(', ')}
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox checked={(formData?.days || []).indexOf(day) > -1} />
                      <ListItemText primary={day} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* סוג הסעה */}
            <Box>
              <FormControl sx={{ width: '170px', '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' } }} size="small">
                <InputLabel sx={{ right: 37, left: 'unset', transformOrigin: 'top right', direction: 'rtl', px: 0.5, backgroundColor: 'white' }}>סוג הסעה</InputLabel>
                <Select
                  value={formData?.type || ''}
                  label="סוג הסעה"
                  onChange={handleChange('type')}
                >
                  {transportTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* שדה יישובים עם כפתור פלוס - מתחת לשדה ימים, מיושר לימין */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row-reverse', justifyContent: 'flex-start', mt: 0.5, alignSelf: 'flex-start', mr: 0 }}>
            <Tooltip title="הוספת יישוב" arrow>
              <IconButton color="primary" size="small" onClick={() => setAddDialogOpen(true)}
                sx={{ '&:focus': { outline: 'none', border: 'none' }, '&:active': { outline: 'none', border: 'none' }, '&:hover': { outline: 'none', border: 'none' } }}>
                <AddIcon fontSize="medium" sx={{ color: 'rgba(64, 99, 112, 0.72)', fontWeight: 'bold' }} />
              </IconButton>
            </Tooltip>
            <FormControl sx={{ width: '170px', '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' } }} size="small">
              <InputLabel sx={{ right: 37, left: 'unset', transformOrigin: 'top right', direction: 'rtl', px: 0.5, backgroundColor: 'white' }}>יישובים</InputLabel>
              <Select
                multiple
                value={formData.cities || []}
                onChange={handleChange('cities')}
                input={<OutlinedInput label="יישובים" />}
                renderValue={(selected) => selected.slice().sort((a, b) => a.localeCompare(b, 'he')).join(', ')}
                MenuProps={{
                  PaperProps: {
                    dir: 'rtl',
                    style: { direction: 'rtl' }
                  }
                }}
              >
                {citiesList.slice().sort((a, b) => a.localeCompare(b, 'he')).map((city) => (
                  <MenuItem key={city} value={city} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Checkbox checked={(formData.cities || []).indexOf(city) > -1} />
                      <ListItemText primary={city} />
                    </Box>
                    <Tooltip title="הסרת יישוב" arrow>
                      <IconButton color="error" size="small" onClick={() => handleTrashClick(city)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* מקומות פנויים - כטקסט */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" color="text.secondary">
              מקומות פנויים:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formData?.type ? (formData.type === 'מיניבוס' ? '14' : '4') : '-'}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
        <Button variant="outlined" onClick={onClose} sx={{
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
        }}>ביטול</Button>
        <Button onClick={handleSubmit} sx={{
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
        }} variant="contained" color="primary">שמור</Button>
      </DialogActions>
    </Dialog>

    {/* דיאלוג הוספת יישוב */}
    <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: 'rgb(64, 99, 112, 0.72)' }}>הוספת יישוב חדש</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          placeholder="הקלד שם יישוב"
          type="text"
          fullWidth
          value={newCity}
          onChange={e => setNewCity(e.target.value)}
          error={addCityTouched && !newCity.trim()}
          helperText={addCityTouched && !newCity.trim() ? 'יש להזין שם יישוב' : ''}
        />
        {addCityError && <Typography color="error" fontSize={13}>{addCityError}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => setAddDialogOpen(false)} sx={{
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
        }}>ביטול</Button>
        <Button onClick={handleAddCity} sx={{
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
        }} variant="contained" color="primary">הוסף</Button>
      </DialogActions>
    </Dialog>

    {/* דיאלוג אישור מחיקת יישוב */}
    <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} maxWidth="xs">
      <DialogTitle>אישור מחיקת יישוב</DialogTitle>
      <DialogContent>
        האם אתה בטוח שברצונך למחוק את היישוב <b>{cityToDelete}</b>?
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelDelete}>ביטול</Button>
        <Button onClick={handleConfirmDelete} color="error" variant="contained">אישור</Button>
      </DialogActions>
    </Dialog>
  </>
  );
}

export default EditTransportDialog; 