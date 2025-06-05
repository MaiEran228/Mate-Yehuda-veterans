import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessibleIcon from '@mui/icons-material/Accessible';

function ViewPassengersDialog({ open, onClose, passengers, transportDays = [] }) {
  const [selectedDay, setSelectedDay] = useState('all');

  const handleDayChange = (event, newDay) => {
    if (newDay !== null) {
      setSelectedDay(newDay);
    }
  };

  // מסנן את הנוסעים לפי היום הנבחר
  const filteredPassengers = selectedDay === 'all'
    ? passengers
    : passengers.filter(passenger => passenger.arrivalDays?.includes(selectedDay));

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
          minWidth: 400
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        py: 2
      }}>
        רשימת נוסעים
      </DialogTitle>

      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
        <ToggleButtonGroup
          value={selectedDay}
          exclusive
          onChange={handleDayChange}
          aria-label="בחירת יום"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButton-root': {
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '4px !important',
              px: 2,
              py: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }
            }
          }}
        >
          <ToggleButton value="all" aria-label="כל הימים">
            כל הימים
          </ToggleButton>
          {transportDays.map((day) => (
            <ToggleButton key={day} value={day} aria-label={day}>
              {day}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <DialogContent>
        {filteredPassengers && filteredPassengers.length > 0 ? (
          <List>
            {filteredPassengers.map((passenger, index) => (
              <React.Fragment key={passenger.id || index}>
                <ListItem sx={{ py: 2 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle1" component="span" fontWeight="medium">
                        {passenger.name}
                      </Typography>
                      {passenger.hasCaregiver && (
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                          <AccessibleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                            + מטפל
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        {passenger.city}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        ימי הגעה:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {passenger.arrivalDays?.join(', ') || 'לא צוין'}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                {index < filteredPassengers.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            {selectedDay === 'all' 
              ? 'אין נוסעים רשומים להסעה זו'
              : `אין נוסעים רשומים ליום ${selectedDay}`
            }
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{
        borderTop: '1px solid #e0e0e0',
        p: 2
      }}>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ViewPassengersDialog; 