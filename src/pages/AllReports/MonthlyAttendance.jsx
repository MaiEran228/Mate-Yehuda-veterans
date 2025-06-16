import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, TextField } from '@mui/material';
import { fetchAllProfiles } from '../../firebase';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const reasonOptions = ['מחלה', 'אשפוז', 'שמחה', 'אבל', 'שיפוי', 'טיפול בית'];

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

  const handleEditModeToggle = () => {
    setIsEditLoading(true);
    setTimeout(() => {
      setIsEditMode((prev) => !prev);
      setIsEditLoading(false);
    }, 100);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
  };

  const handleEditSave = async () => {
    try {
      const attendanceCol = collection(db, 'attendance');
      const snapshot = await getDocs(attendanceCol);
      const updates = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.date || !data.attendanceList) return;
        const docDate = dayjs(data.date);
        if (docDate.year() === year && docDate.month() + 1 === month) {
          const updatedList = data.attendanceList.map((person) => {
            const profileId = person.id;
            const dateStr = data.date;
            const editDataForProfile = editData[profileId]?.[dateStr];
            return {
              ...person,
              ...(editDataForProfile || {})
            };
          });
          updates.push(updateDoc(doc.ref, { attendanceList: updatedList }));
        }
      });

      await Promise.all(updates);
      setEditData({});
      setIsEditMode(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving attendance data:', error);
    }
  };

  const handleEditChange = (profileId, date, data) => {
    setEditData((prev) => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [date]: { ...prev[profileId]?.[date], ...data },
      },
    }));
  };

  return (
    <Box sx={{ direction: 'rtl', bgcolor: '#ebf1f5' ,width: '100%', height: '100%'  }}>
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
        <Button
          variant={isEditMode ? "contained" : "outlined"}
          color={isEditMode ? "secondary" : "info"}
          onClick={handleEditModeToggle}
          disabled={isEditLoading}
        >
          {isEditMode ? "סיים עריכה" : "עריכה"}
          {isEditLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Button>
        {isEditMode && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditSave}
          >
            שמור
          </Button>
        )}
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
            isEditMode={isEditMode}
            onEditChange={handleEditChange}
          />
        </div>
      )}
    </Box>
  );
};

export default MonthlyAttendance;