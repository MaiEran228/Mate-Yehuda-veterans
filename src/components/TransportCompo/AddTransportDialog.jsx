import React, { useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, InputLabel,
  FormControl, Checkbox, ListItemText, OutlinedInput, Box, Typography,
  IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const transportTypes = ['מיניבוס', 'מונית'];

const initialCities = [
  "צלפון","בקוע","טל שחר","כפר אוריה","תעוז","תרום","מסילת ציון","אשתאול","זנוח",
  "מחסיה","נחם","עג'ור"
];

const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

function AddTransportDialog({ open, onClose, onAdd, initialData }) {
  const [formData, setFormData] = React.useState(initialData);
  const defaultCities = useRef([...initialCities]);
  const [citiesList, setCitiesList] = React.useState(defaultCities.current);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newCity, setNewCity] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cityToDelete, setCityToDelete] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      setFormData({
        ...initialData,
        days: [],
        cities: [],
      });
      setCitiesList(defaultCities.current);
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

  function handleAddCity() {
    const city = newCity.trim();
    if (city && !citiesList.includes(city)) {
      setCitiesList(prev => [...prev, city]);
      defaultCities.current = [...defaultCities.current, city];
      setNewCity("");
      setAddDialogOpen(false);
    }
  }

  function handleRemoveCity(city) {
    setCitiesList(prev => prev.filter(c => c !== city));
    defaultCities.current = defaultCities.current.filter(c => c !== city);
    setFormData(prev => ({
      ...prev,
      cities: (prev.cities || []).filter(c => c !== city)
    }));
  }

  function handleTrashClick(city) {
    setCityToDelete(city);
    setDeleteDialogOpen(true);
  }

  function handleConfirmDelete() {
    if (cityToDelete) {
      handleRemoveCity(cityToDelete);
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
              <FormControl sx={{ width: '170px' }} size="small">
                <InputLabel>ימים</InputLabel>
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
              <FormControl sx={{ width: '170px' }} size="small">
                <InputLabel>סוג הסעה</InputLabel>
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

          {/* שדה יישובים עם כפתור פלוס בצד ימין */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row-reverse' }}>
            <Tooltip title="הוספת יישוב" arrow>
              <IconButton color="primary" size="small" onClick={() => setAddDialogOpen(true)}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <FormControl fullWidth size="small">
              <InputLabel>יישובים</InputLabel>
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
                      <IconButton
                        size="small"
                        color="default"
                        sx={{ ml: 1 }}
                        onClick={e => {
                          e.stopPropagation();
                          handleTrashClick(city);
                        }}
                      >
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
        <Button onClick={onClose}>ביטול</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!formData.type || !formData.days?.length || !formData.cities?.length}
        >
          הוסף
        </Button>
      </DialogActions>
      {/* דיאלוג הוספת יישוב */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>הוספת יישוב חדש</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <OutlinedInput
              autoFocus
              fullWidth
              placeholder="הקלד שם יישוב"
              value={newCity}
              onChange={e => setNewCity(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCity(); }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>ביטול</Button>
          <Button
            onClick={handleAddCity}
            variant="contained"
            disabled={!newCity.trim() || citiesList.includes(newCity.trim())}
          >
            הוסף
          </Button>
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