import React, { useEffect, useState } from 'react';
import { fetchAttendanceByDate, fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const getMonthDates = (month, year) => {
  const dates = [];
  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(dayjs(`${year}-${month}-${d.toString().padStart(2, '0')}`).format('YYYY-MM-DD'));
  }
  return dates;
};

const DaysLeft = () => {
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0 });
  const [extraOpen, setExtraOpen] = useState(false);

  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      const dates = getMonthDates(month, year);
      const allData = [];
      for (const date of dates) {
        const data = await fetchAttendanceByDate(date);
        if (data && data.attendanceList) {
          allData.push(...data.attendanceList.map(p => ({ ...p, date })));
        }
      }
      setAttendanceData(allData);
      // Fetch all profiles for arrivalDays
      const allProfiles = await fetchAllProfiles();
      setProfiles(allProfiles);
      // Summary
      const present = allData.filter(p => p.attended).length;
      const absent = allData.filter(p => !p.attended).length;
      setSummary({ present, absent, total: allData.length });
      setLoading(false);
    };
    fetchMonthData();
  }, [selectedMonth]);

  // For each person, check if missed any required day
  const people = profiles.map(profile => {
    const eligible = Array.isArray(profile.arrivalDays) ? profile.arrivalDays.length * 4 : 0;
    const attendedCount = attendanceData.filter(p => p.id === profile.id && p.attended).length;
    // Build all dates in month for this person's arrivalDays
    const [year, month] = selectedMonth.split('-');
    const monthDates = getMonthDates(month, year);
    let missed = false;
    if (Array.isArray(profile.arrivalDays) && profile.arrivalDays.length > 0) {
      for (const dateStr of monthDates) {
        const weekday = dayjs(dateStr).format('dddd'); // e.g. 'ראשון'
        if (profile.arrivalDays.includes(weekday)) {
          // Was he marked attended on this date?
          const attended = attendanceData.some(p => p.id === profile.id && p.date === dateStr && p.attended);
          if (!attended) {
            missed = true;
            break;
          }
        }
      }
    }
    return {
      id: profile.id,
      name: profile.name,
      remaining: Math.max(eligible - attendedCount, 0),
      missed
    };
  });

  const extraPeople = people.filter(p => p.missed);

  const handleExportPDF = () => {
    const input = document.getElementById('daysLeftReportContent');
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`דו"ח ימים נותרים - ${selectedMonth}.pdf`);
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 0.5 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <TextField
            label="בחר חודש"
            type="month"
            size="small"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            sx={{ ml: 2, minWidth: 140 }}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={handleExportPDF} sx={{ ml: 2 }}>
            ייצוא ל־PDF
          </Button>
        </Box>
        <Button variant="outlined" color="secondary" onClick={() => setExtraOpen(true)}>
          רשימת אנשים עם ימי אקסטרה
        </Button>
      </Box>
      {loading ? (
        <CircularProgress sx={{ m: 4 }} />
      ) : (
        <div id="daysLeftReportContent">
          <Paper sx={{ width: '100%', maxWidth: '100%', p: 4, outline: 'none', mx: 'auto' }}>
            <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
              <Typography variant="h4" color="primary" gutterBottom>
                דוח ימים נותרים
              </Typography>
              <Typography variant="h6" color="textSecondary">
                חודש: {dayjs(selectedMonth).format('MM/YYYY')}
              </Typography>
            </Box>
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #4caf50', pb: 1 }}>
                טבלת יתרת ימי זכאות לחודש
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', direction: 'rtl' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: 16 }}>שם</th>
                      <th style={{ border: '1px solid #ccc', padding: 16 }}>יתרת ימי זכאות החודש</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(person => (
                      <tr key={person.id} style={{ minHeight: 48, backgroundColor: person.missed ? '#ffeaea' : undefined }}>
                        <td style={{ border: '1px solid #ccc', padding: 16 }}>{person.name}</td>
                        <td style={{ border: '1px solid #ccc', padding: 16 }}>{person.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          </Paper>
        </div>
      )}
      <Dialog open={extraOpen} onClose={() => setExtraOpen(false)}>
        <DialogTitle>רשימת אנשים עם ימי אקסטרה</DialogTitle>
        <DialogContent>
          {extraPeople.length === 0 ? (
            <div>אין אנשים עם ימי אקסטרה החודש.</div>
          ) : (
            <ul style={{ direction: 'rtl', paddingRight: 0 }}>
              {extraPeople.map(p => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtraOpen(false)} color="primary">סגור</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DaysLeft;