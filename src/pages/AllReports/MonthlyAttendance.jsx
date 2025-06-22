import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, TextField } from '@mui/material';
import { fetchAllProfiles } from '../../firebase';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import MonthlyAttendanceTable from '../../components/MonthlyAttendanceTable';
import OutlinedInput from '@mui/material/OutlinedInput';
import { TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper } from '@mui/material';

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
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let unsub = null;
    setLoading(true);
    setError('');
    // Fetch profiles once
    fetchAllProfiles().then(profs => setProfiles(profs));
    // Listen to all attendance docs
    const attendanceCol = collection(db, 'attendance');
    unsub = onSnapshot(attendanceCol, (snapshot) => {
      const attByDate = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.date || !data.attendanceList) return;
        const docDate = dayjs(data.date);
        if (docDate.year() === year && docDate.month() + 1 === month) {
          attByDate[data.date] = data.attendanceList;
        }
      });
      setAttendanceByDate(attByDate);
      setLoading(false);
    }, (e) => {
      setError('שגיאה בטעינת נתונים');
      setLoading(false);
    });
    return () => { if (unsub) unsub(); };
  }, [month, year]);

  const days = getMonthDays(year, month);

  return (
    <Box sx={{ direction: 'rtl', bgcolor: '#ebf1f5' ,width: '100%', height: '100%', mt:5  }}>
      <Box sx={{ display: 'flex', alignItems: 'center',  mb: 4, gap: 1 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/Reports')}
          size="small"
          sx={{ minWidth: 'auto', px: 1., py: 0.5, fontSize: '0.75rem' }}
        >
          חזור
        </Button>
        <Typography variant="h4" fontWeight="bold" sx={{ flexGrow: 1, textAlign: 'right' }}>
          דו"ח נוכחות חודשי - {dayjs(`${year}-${month}-01`).format('MMMM YYYY')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="month-select-label" sx={{ textAlign: 'right', right: 25, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: '#ebf1f5', px: 0.5 }}>
            חודש
          </InputLabel>
          <Select
            labelId="month-select-label"
            value={month}
            label="חודש"
            onChange={e => setMonth(Number(e.target.value))}
            input={<OutlinedInput notched={false} label="חודש" />}
          >
            {[...Array(12)].map((_, idx) => (
              <MenuItem key={idx+1} value={idx+1}>{dayjs().month(idx).format('MMMM')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="year-select-label" sx={{ textAlign: 'right', right: 25, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: '#ebf1f5', px: 0.5 }}>
            שנה
          </InputLabel>
          <Select
            labelId="year-select-label"
            value={year}
            label="שנה"
            onChange={e => setYear(Number(e.target.value))}
            input={<OutlinedInput notched={false} label="שנה" />}
          >
            {Array.from({length: (dayjs().year() + 5) - 2025 + 1}, (_, idx) => 2025 + idx).map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={() => {
            const input = document.getElementById('monthlyReportContent');
            html2canvas(input).then(canvas => {
              const imgData = canvas.toDataURL('image/png');
              // const pdf = new jsPDF('p', 'mm', 'a4');
              // const imgProps = pdf.getImageProperties(imgData);
              // const pdfWidth = pdf.internal.pageSize.getWidth();
              // const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
              // pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              // pdf.save(`Monthly Attendance Report - ${dayjs(`${year}-${month}-01`).format('MMMM YYYY')}.pdf`);
            });
          }}
        >
          ייצוא ל־PDF
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            // Prepare data for Excel (Hebrew headers, same as table, with absence reasons)
            const dayNumbers = days.map(day => day.format('D')).reverse();
            const columns = [...dayNumbers, 'סה"כ מטפל', 'סה"כ ותיק', 'שם'];
            const excelData = profiles.map(profile => {
              const row = {};
              // Days columns (right to left)
              dayNumbers.forEach(dayNum => {
                // Find the day object for this dayNum
                const dayObj = days.find(d => d.format('D') === dayNum);
                const dateStr = dayObj.format('YYYY-MM-DD');
                const list = attendanceByDate[dateStr];
                let value = '';
                if (list) {
                  const person = list.find(p => p.id === profile.id);
                  if (person && person.attended === true) {
                    value = '✔️';
                  } else if (person && person.attended === false && person.reason) {
                    value = person.reason;
                  }
                }
                row[dayNum] = value;
              });
              // Totals and name
              row['סה"כ ותיק'] = days.reduce((sum, day) => {
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
              row['סה"כ מטפל'] = days.reduce((sum, day) => {
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
              row['שם'] = profile.name;
              return row;
            });
            const ws = XLSX.utils.json_to_sheet(excelData, { header: columns });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'נוכחות חודשית');
            XLSX.writeFile(wb, `דו"ח נוכחות חודשי - ${dayjs(`${year}-${month}-01`).format('MMMM YYYY')}.xlsx`);
          }}
        >
          ייצוא ל־Excel
        </Button>
      </Box>
      {showSearch && (
        <Box sx={{ mb: 2, maxWidth: 300 }}>
          <TextField
            fullWidth
            size="small"
            label="חפש לפי שם"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
        </Box>
      )}
      {loading ? (
        <CircularProgress sx={{ m: 4 }} />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <div id="monthlyReportContent">
          <MonthlyAttendanceTable
            profiles={profiles}
            attendanceByDate={attendanceByDate}
            days={days}
            searchTerm={searchTerm}
            setShowSearch={setShowSearch}
          />
        </div>
      )}
    </Box>
  );
};

export default MonthlyAttendance;