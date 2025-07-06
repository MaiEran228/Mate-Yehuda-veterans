import React, { useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, InputLabel,
  FormControl, Checkbox, ListItemText, OutlinedInput, Box, Typography,
  IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCities } from '../../hooks/useCities';

const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const transportTypes = ['מיניבוס', 'מונית'];

const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

function AddTransportDialog({ open, onClose, onAdd, initialData }) {
  const [formData, setFormData] = React.useState(initialData);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newCity, setNewCity] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cityToDelete, setCityToDelete] = React.useState(null);
  const [addCityError, setAddCityError] = React.useState("");
  const [addCityTouched, setAddCityTouched] = React.useState(false);
  
  const { cities: citiesList, addCity, deleteCity } = useCities();

  React.useEffect(() => {
    if (open) {
      setFormData({
        ...initialData,
        days: [],
        cities: [],
      });
    }
  }, [open, initialData]);

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
    onAdd(formData);
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

  return (
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
      <DialogTitle sx={{ 
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        py: 2
      }}>
        הוספת הסעה חדשה
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
            gap: '25px'  // מרווח בין האלמנטים
          }}>
            {/* בחירת ימים מרובה */}
            <Box>
              <FormControl sx={{ width: '170px', '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' } }} size="small">
                <InputLabel sx={{ right: 37, left: 'unset', transformOrigin: 'top right', direction: 'rtl', px: 0.5, backgroundColor: 'white' }}>ימים</InputLabel>
                <Select
                  multiple
                  value={formData.days || []}
                  onChange={handleChange('days')}
                  input={<OutlinedInput label="ימים" />}
                  renderValue={(selected) => selected.slice().sort((a, b) => arrivalDaysOrder.indexOf(a) - arrivalDaysOrder.indexOf(b)).join(', ')}
                  
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox checked={(formData.days || []).indexOf(day) > -1} />
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
                  value={formData.type || ''}
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
              {formData.type ? (formData.type === 'מיניבוס' ? '14' : '4') : '-'}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid #e0e0e0',
        p: 2
      }}>
        <Button variant="outlined" onClick={onClose} sx={{
          color: 'rgba(64, 99, 112, 0.72)',
          border: '1.7px solid rgba(64, 99, 112, 0.72)',
          '&:focus': { outline: 'none' },
          ':hover': {
            borderColor: '#7b8f99',
            color: '#5a676e',
            outline: 'none'
          },
          '&:focus': { outline: 'none' },
          '&:active': { outline: 'none' },
          gap: 2,
          ml: 1
        }}>ביטול</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!formData.type || !formData.days?.length || !formData.cities?.length}
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
            
          }}
        >
          הוסף
        </Button>
      </DialogActions>
      {/* דיאלוג הוספת יישוב */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'rgb(64, 99, 112, 0.72)' }}>הוספת יישוב חדש</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <FormControl fullWidth error={!!addCityError && addCityTouched}>
              <OutlinedInput
                autoFocus
                fullWidth
                placeholder="הקלד שם יישוב"
                value={newCity}
                error={!!addCityError && addCityTouched}
                onChange={e => { setNewCity(e.target.value); setAddCityError(""); setAddCityTouched(false); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCity(); }}
                sx={addCityError && addCityTouched ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {}}
              />
              {addCityError && addCityTouched && (
                <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'right' }}>
                  {addCityError}
                </Typography>
              )}
            </FormControl>
          </Box>
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
    </Dialog>
  );
}

export default AddTransportDialog; 