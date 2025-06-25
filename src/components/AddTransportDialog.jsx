import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, InputLabel,
  FormControl, Checkbox, ListItemText, OutlinedInput, Box, Typography,
} from '@mui/material';

const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const transportTypes = ['מיניבוס', 'מונית'];

const cities = [
  'ירושלים','אדרת','אביעזר','נחם','אשתאול','תרום','תעוז',
];

const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

function AddTransportDialog({ open, onClose, onAdd, initialData }) {
  const [formData, setFormData] = React.useState(initialData);

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

          {/* בחירת יישובים מרובה */}
          <FormControl fullWidth size="small">
            <InputLabel>יישובים</InputLabel>
            <Select
              multiple
              value={formData.cities || []}
              onChange={handleChange('cities')}
              input={<OutlinedInput label="יישובים" />}
              renderValue={(selected) => selected.join(', ')}
            >
              {cities.map((city) => (
                <MenuItem key={city} value={city}>
                  <Checkbox checked={(formData.cities || []).indexOf(city) > -1} />
                  <ListItemText primary={city} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
    </Dialog>
  );
}

export default AddTransportDialog; 