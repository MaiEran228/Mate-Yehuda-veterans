import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem,
  Typography, Box, Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessibleIcon from '@mui/icons-material/Accessible';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function ViewPassengersDialog({ open, onClose, passengers, transportDays = [], profiles = [] }) {
  const [selectedDay, setSelectedDay] = useState('all');

  const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

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

      <DialogContent>
        {passengers && passengers.length > 0 ? (
          <List>
            {passengers.map((passenger, index) => (
              <React.Fragment key={passenger.id || index}>
                <ListItem sx={{ py: 2 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle1" component="span" fontWeight="medium">
                        {passenger.name}
                      </Typography>
                      {passenger.date && (
                        <AccessTimeIcon sx={{ fontSize: 20, color: 'primary.main', ml: 1 }} />
                      )}
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
                        {
                          (() => {
                            const profile = profiles.find(p => p.id === passenger.id);
                            const days = profile && profile.arrivalDays && profile.arrivalDays.length > 0
                              ? profile.arrivalDays
                              : (passenger.arrivalDays || []);
                            return days.length > 0
                              ? days.slice().sort((a, b) => arrivalDaysOrder.indexOf(a) - arrivalDaysOrder.indexOf(b)).join(', ')
                              : 'לא צוין';
                          })()
                        }
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                {index < passengers.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            אין נוסעים רשומים להסעה זו
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