import React from 'react';
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
} from '@mui/material';

function ViewPassengersDialog({ open, onClose, passengers }) {
  return (
    <Dialog open={open} onClose={onClose} dir="rtl">
      <DialogTitle>רשימת נוסעים</DialogTitle>
      <DialogContent>
        {passengers && passengers.length > 0 ? (
          <List>
            {passengers.map((passenger, index) => (
              <ListItem key={index}>
                <ListItemText primary={passenger} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>אין נוסעים רשומים להסעה זו</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ViewPassengersDialog; 