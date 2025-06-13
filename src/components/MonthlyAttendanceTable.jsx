import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Box } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import dayjs from 'dayjs';

const typeColors = {
  regular: '#43a047', // ירוק
  makeup: '#1976d2', // כחול
};

const MonthlyAttendanceTable = ({ 
  profiles, 
  attendanceByDate, 
  days, 
  searchTerm, 
  setShowSearch 
}) => {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600, width: '100%', overflowX: 'auto', direction: 'ltr' }}>
      <Table stickyHeader size="small" sx={{ width: '100%', direction: 'rtl' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '1px solid #bbb',minWidth:80 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                שם
                <IconButton onClick={() => setShowSearch(s => !s)} sx={{ mr: 1 }}>
                  <SearchIcon />
                </IconButton>
              </Box>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '2px solid #888', minWidth: 50 }} align="center">סה"כ ותיק</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '2px solid #888', minWidth: 35 }} align="center">סה"כ מטפל</TableCell>
            {days.map(day => (
              <TableCell key={day.format('YYYY-MM-DD')} align="center" sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '2px solid #bbb', width: 20 }}>
                {day.format('D')}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {profiles
            .filter(profile => profile.name?.includes(searchTerm))
            .map(profile => {
              // חישוב סך הימים מראש
              const totalDays = days.reduce((sum, day) => {
                const dateStr = day.format('YYYY-MM-DD');
                const list = attendanceByDate[dateStr];
                if (list) {
                  const person = list.find(p => p.id === profile.id);
                  if (person && person.attended === true) {
                    return sum + 1;
                  }
                }
                return sum;
              }, 0);
              // חישוב סך הימים עם מטפל
              const totalCaregiver = days.reduce((sum, day) => {
                const dateStr = day.format('YYYY-MM-DD');
                const list = attendanceByDate[dateStr];
                if (list) {
                  const person = list.find(p => p.id === profile.id);
                  if (person && person.attended === true && person.caregiver) {
                    return sum + 1;
                  }
                }
                return sum;
              }, 0);
              return (
                <TableRow key={profile.id} sx={{ minHeight: 48 }}>
                  <TableCell sx={{ fontWeight: 'bold', borderLeft: '1px solid #bbb', minWidth: 100, height: 48, textAlign: 'right' }}>{profile.name}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', borderLeft: '2px solid #888', minWidth: 50 }}>{totalDays}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', borderLeft: '2px solid #888', minWidth: 35 }}>{totalCaregiver}</TableCell>
                  {days.map(day => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const list = attendanceByDate[dateStr];
                    let attType = null;
                    let hasCaregiver = false;
                    let absenceReason = '';
                    if (list) {
                      const person = list.find(p => p.id === profile.id);
                      if (person && person.attended === true) {
                        attType = person.type === 'makeup' ? 'makeup' : 'regular';
                        hasCaregiver = !!person.caregiver;
                      } else if (person && person.attended === false && person.reason) {
                        absenceReason = person.reason;
                      }
                    }
                    return (
                      <TableCell key={dateStr} align="center" sx={{ borderLeft: '2px solid #eee', width: 40, minWidth: 40, maxWidth: 40, p: 0.5 }}>
                        {attType === 'regular' && <><CheckIcon sx={{ color: typeColors.regular, verticalAlign: 'middle', fontSize: 28 }} />{hasCaregiver && <span style={{ color: '#888', fontWeight: 'bold', fontSize: '1.2em', marginRight: 2 }}>+1</span>}</>}
                        {attType === 'makeup' && <><CheckIcon sx={{ color: typeColors.makeup, verticalAlign: 'middle', fontSize: 28 }} />{hasCaregiver && <span style={{ color: '#888', fontWeight: 'bold', fontSize: '1em', marginRight: 2 }}>+1</span>}</>}
                        {absenceReason && <span style={{ color: '#d32f2f', fontSize: '0.85em', fontWeight: 500 }}>{absenceReason}</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MonthlyAttendanceTable; 