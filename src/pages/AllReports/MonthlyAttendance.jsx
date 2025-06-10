import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { fetchAllProfiles } from '../../firebase';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import CheckIcon from '@mui/icons-material/Check';

const typeColors = {
  regular: '#43a047', // ירוק
  makeup: '#1976d2', // כחול
};

const getMonthDays = (year, month) => {
  const days = [];
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`));
  }
  return days;
};

const MonthlyAttendance = () => {
  const [profiles, setProfiles] = useState([]);
  const [attendanceByDate, setAttendanceByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(dayjs().month() + 1); // 1-based
  const [year, setYear] = useState(dayjs().year());

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch profiles
        const profs = await fetchAllProfiles();
        setProfiles(profs);
        // Fetch all attendance docs for the month
        const attendanceCol = collection(db, 'attendance');
        const snapshot = await getDocs(attendanceCol);
        const attByDate = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.date || !data.attendanceList) return;
          const docDate = dayjs(data.date);
          if (docDate.year() === year && docDate.month() + 1 === month) {
            attByDate[data.date] = data.attendanceList;
          }
        });
        setAttendanceByDate(attByDate);
      } catch (e) {
        setError('שגיאה בטעינת נתונים');
      }
      setLoading(false);
    };
    loadData();
  }, [month, year]);

  const days = getMonthDays(year, month);

  // Helper: get attendance type for profileId and date
  const getAttendanceType = (profileId, dateStr) => {
    const list = attendanceByDate[dateStr];
    if (!list) return null;
    const person = list.find(p => p.id === profileId);
    if (!person) return null;
    if (person.attended === true && person.type === 'makeup') return 'makeup';
    if (person.attended === true) return 'regular';
    return null;
  };

  return (
    <Box sx={{ direction: 'rtl', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          דו"ח נוכחות חודשי - {dayjs(`${year}-${month}-01`).format('MMMM YYYY')}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="month-select-label">חודש</InputLabel>
          <Select
            labelId="month-select-label"
            value={month}
            label="חודש"
            onChange={e => setMonth(Number(e.target.value))}
          >
            {[...Array(12)].map((_, idx) => (
              <MenuItem key={idx+1} value={idx+1}>{dayjs().month(idx).format('MMMM')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="year-select-label">שנה</InputLabel>
          <Select
            labelId="year-select-label"
            value={year}
            label="שנה"
            onChange={e => setYear(Number(e.target.value))}
          >
            {[...Array(5)].map((_, idx) => (
              <MenuItem key={year-2+idx} value={year-2+idx}>{year-2+idx}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {loading ? (
        <CircularProgress sx={{ m: 4 }} />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 600, width: '100%', overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '1px solid #bbb' }}>שם</TableCell>
                {days.map(day => (
                  <TableCell key={day.format('YYYY-MM-DD')} align="center" sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '1px solid #bbb', minWidth: 30 }}>
                    {day.format('D')}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '2px solid #888', minWidth: 50 }} align="center">סה"כ ימים</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.map(profile => {
                let totalDays = 0;
                return (
                  <TableRow key={profile.id}>
                    <TableCell sx={{ fontWeight: 'bold', borderLeft: '1px solid #bbb' }}>{profile.name}</TableCell>
                    {days.map(day => {
                      const dateStr = day.format('YYYY-MM-DD');
                      const list = attendanceByDate[dateStr];
                      let attType = null;
                      let hasCaregiver = false;
                      if (list) {
                        const person = list.find(p => p.id === profile.id);
                        if (person && person.attended === true) {
                          attType = person.type === 'makeup' ? 'makeup' : 'regular';
                          hasCaregiver = !!person.caregiver;
                          totalDays++;
                        }
                      }
                      return (
                        <TableCell key={dateStr} align="center" sx={{ borderLeft: '1px solid #eee', minWidth: 30, p: 0.5 }}>
                          {attType === 'regular' && <><CheckIcon sx={{ color: typeColors.regular, verticalAlign: 'middle', fontSize: 18 }} />{hasCaregiver && <span style={{ color: '#888', fontWeight: 'bold', fontSize: '0.9em', marginRight: 2 }}>+1</span>}</>}
                          {attType === 'makeup' && <><CheckIcon sx={{ color: typeColors.makeup, verticalAlign: 'middle', fontSize: 18 }} />{hasCaregiver && <span style={{ color: '#888', fontWeight: 'bold', fontSize: '0.9em', marginRight: 2 }}>+1</span>}</>}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ fontWeight: 'bold', borderLeft: '2px solid #888', minWidth: 50 }}>{totalDays}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default MonthlyAttendance;