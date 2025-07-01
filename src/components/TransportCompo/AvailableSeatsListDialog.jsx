import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableHead, TableRow, TableCell, TableBody, Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const AvailableSeatsListDialog = ({ open, onClose, data, calculateAvailableSeatsByDay }) => {
  const arrivalDaysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle sx={{ position: 'relative', pr: 4, fontWeight: 'bold' }}>
        רשימת מקומות פנויים בכל ההסעות
        <Button
          onClick={onClose}
          aria-label="סגור"
          sx={{
            position: 'absolute',
            left: 8,
            top: 8,
            minWidth: '32px',
            width: '32px',
            height: '32px',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#888',
            borderRadius: '50%',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ':hover': {
              backgroundColor: '#f0f0f0',
              color: '#333',
            },
            '&:focus': {
              border: 'none',
              outline: 'none',
            },
            '&:active': {
              border: 'none',
              outline: 'none',
            },
            p: 0,
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>
      <DialogContent sx={{ overflow: 'hidden' }}>
        <Box id="seatsReportContent" sx={{ maxHeight: '400px', overflowY: 'auto', direction: 'ltr', pr: 1 }}>
          <Table style={{ direction: 'ltr' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>מקומות פנויים (לפי יום)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>ימים</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>יישובים</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>סוג הסעה</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>#</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, idx) => {
                const availableSeatsByDay = calculateAvailableSeatsByDay(row.type, row.passengers, row.days);
                return (
                  <TableRow key={row.id || idx}>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                        {row.days && row.days.length > 0 ? row.days.slice().sort((a, b) => arrivalDaysOrder.indexOf(a) - arrivalDaysOrder.indexOf(b)).reverse().map(day => (
                          <Box
                            key={day}
                            sx={{
                              textAlign: 'right',
                              fontWeight: 'bold',
                            }}
                          >
                            {day}: {availableSeatsByDay[day]}
                          </Box>
                        )) : '—'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{(row.days || []).slice().sort((a, b) => arrivalDaysOrder.indexOf(a) - arrivalDaysOrder.indexOf(b)).join(', ')}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{(row.cities || []).slice().sort((a, b) => a.localeCompare(b, 'he')).join(', ')}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{row.type}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{idx + 1}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
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
            minWidth: '110px',
          }}
        >
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvailableSeatsListDialog; 