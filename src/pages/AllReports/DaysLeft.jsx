import React, { useEffect, useState } from 'react';
import { fetchAttendanceByDate, fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
//import 'jspdf-font';
import { useNavigate } from 'react-router-dom';

const getMonthDates = (month, year) => {
  const dates = [];
  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(dayjs(`${year}-${month}-${d.toString().padStart(2, '0')}`).format('YYYY-MM-DD'));
  }
  return dates;
};

// פונקציה חדשה: סופרת כמה ימים מתאימים יש בחודש
function countEligibleDaysInMonth(arrivalDays, year, month) {
  // arrivalDays: ['ראשון', 'שלישי', ...]
  // month: 1-based (1=ינואר)
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();
  const hebrewDaysByIndex = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    const hebDay = hebrewDaysByIndex[date.day()];
    if (arrivalDays.includes(hebDay)) {
      count++;
    }
  }
  return count;
}

const DaysLeft = () => {
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0 });
  const [extraOpen, setExtraOpen] = useState(false);
  const [surplusOpen, setSurplusOpen] = useState(false);
  const [surplusList, setSurplusList] = useState([]);
  const navigate = useNavigate();

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
    const [year, month] = selectedMonth.split('-');
    const eligible = Array.isArray(profile.arrivalDays) ? countEligibleDaysInMonth(profile.arrivalDays, Number(year), Number(month)) : 0;
    const attendedCount = attendanceData.filter(p => p.id === profile.id && p.attended).length;
    let missed = false;
    const monthDates = getMonthDates(month, year);
    const hebrewDaysByIndex = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    const today = dayjs().format('YYYY-MM-DD');
    // ימים שהיה אמור להגיע ולא הגיע (עד היום)
    const missedDates = [];
    // הופעות בימים לא זכאים (עד היום)
    let penalty = 0;
    if (Array.isArray(profile.arrivalDays) && profile.arrivalDays.length > 0) {
      for (const dateStr of monthDates) {
        if (dateStr > today) continue; // דילוג על ימים עתידיים
        const d = dayjs(dateStr);
        const hebDay = hebrewDaysByIndex[d.day()];
        const record = attendanceData.find(p => p.id === profile.id && p.date === dateStr);
        if (profile.arrivalDays.includes(hebDay)) {
          if (!(record && record.attended === true)) {
            missedDates.push(dateStr);
            missed = true;
          }
        } else {
          if (record && record.attended === true) {
            penalty++;
          }
        }
      }
    }
    // מספר הימים שלא הגיע, לאחר ניכוי הופעות לא זכאיות
    const missedAfterPenalty = Math.max(missedDates.length - penalty, 0);
    return {
      id: profile.id,
      name: profile.name,
      remaining: Math.max(eligible - attendedCount, 0),
      missed,
      missedDates,
      penalty,
      missedAfterPenalty
    };
  });

  const extraPeople = people.filter(p => p.missed);

  // Surplus days calculation
  const handleSurplusOpen = () => {
    // Show eligible, actual, and difference for each user
    const [year, month] = selectedMonth.split('-');
    const firstDay = dayjs(`${year}-${month}-01`);
    const lastDay = firstDay.endOf('month');
    const numDays = lastDay.date();
    const numWeeks = Math.ceil((firstDay.day() + numDays) / 7);
    const monthDates = getMonthDates(month, year);
    const hebrewDaysByIndex = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    const letterToDay = { 'א': 'ראשון', 'ב': 'שני', 'ג': 'שלישי', 'ד': 'רביעי', 'ה': 'חמישי', 'ו': 'שישי', 'ז': 'שבת' };
    const normalizeDay = (day) => {
      if (!day) return '';
      day = day.replace('יום', '').replace(/\s/g, '');
      return letterToDay[day] || day;
    };
    const today = dayjs().format('YYYY-MM-DD');
    const surplusList = profiles.map(profile => {
      if (!Array.isArray(profile.arrivalDays) || profile.arrivalDays.length === 0) {
        return { id: profile.id, name: profile.name, eligible: 0, actual: 0, diff: 0, missed: 0, total: 0 };
      }
      const eligible = profile.arrivalDays.length * numWeeks;
      let actual = 0;
      let missed = 0;
      profile.arrivalDays.forEach(arrivalDay => {
        const normalizedDay = normalizeDay(arrivalDay);
        // actual: count all relevant days in the month
        actual += monthDates.filter(dateStr => {
          const d = dayjs(dateStr);
          const hebDay = hebrewDaysByIndex[d.day()];
          return hebDay === normalizedDay;
        }).length;
        // missed: only up to today
        monthDates.forEach(dateStr => {
          if (dateStr > today) return; // Skip future days
          const d = dayjs(dateStr);
          const hebDay = hebrewDaysByIndex[d.day()];
          if (hebDay === normalizedDay) {
            const record = attendanceData.find(p => p.id === profile.id && p.date === dateStr);
            if (!(record && record.attended === true)) {
              missed++;
            }
          }
        });
      });
      return { id: profile.id, name: profile.name, eligible, actual, diff: eligible - actual, missed, total: (eligible - actual) + missed };
    });
    setSurplusList(surplusList);
    setSurplusOpen(true);
  };

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
    <>
      {/* שורת כפתורים - מחוץ ל-Container של הדוח */}
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2, mt: 5 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/Reports')}
          sx={{ ml: 2 }}
        >
          חזור
        </Button>
        <TextField
          label="חודש"
          type="month"
          size="small"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          sx={{ ml: 2, minWidth: 140 }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <Box sx={{
        position: 'absolute', left: 32, top: 90, zIndex: 10, mt:5,
        '@media (max-width:600px)': {
          left: 8, top: 80 // מסכים קטנים
        }
      }}>
        <Button variant="contained" onClick={handleExportPDF} sx={{ ml: 2 }}>
          ייצוא ל־PDF
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleSurplusOpen} sx={{ ml: 2 }}>
          ימי עודף
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'start', width: '100%', px: { xs: 2, md: 8 }, }}>
        <Container maxWidth={false}
          sx={{ mt: 2, maxWidth: '900px', width: '100%', }}>
          {loading ? (
            <CircularProgress sx={{ m: 4 }} />
          ) : (
            <div id="daysLeftReportContent">
              <Paper sx={{
                width: '210mm',
                margin: '0 auto',
                p: 4,
                outline: 'none'
              }}>
                <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
                  <Typography variant="h4" color="primary" gutterBottom>
                    דוח ימים נותרים
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    חודש: {dayjs(selectedMonth).format('MM/YYYY')}
                  </Typography>
                </Box>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ pb: 1 }}>
                    טבלת יתרת ימי זכאות לחודש
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl', tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ccc', padding: 16, backgroundColor: '#f5f5f5' }}>שם</th>
                          <th style={{ border: '1px solid #ccc', padding: 16, backgroundColor: '#f5f5f5' }}>יתרת ימי זכאות החודש</th>
                        </tr>
                      </thead>
                      <tbody>
                        {people.map(person => (
                          <tr key={person.id} style={{ minHeight: 48, }}>
                            <td style={{ border: '1px solid #ccc', padding: 16, textAlign: 'center', }}>{person.name}</td>
                            <td style={{ border: '1px solid #ccc', padding: 16, textAlign: 'center', }}>{person.remaining}</td>
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
          <Dialog open={surplusOpen} onClose={() => setSurplusOpen(false)}>
            <DialogTitle>חישוב ימי עודף</DialogTitle>
            <DialogContent>
              <div id="surplusTableContent">
                <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: 12, backgroundColor: '#f5f5f5' }}>שם</th>
                      <th style={{ border: '1px solid #ccc', padding: 12, backgroundColor: '#f5f5f5' }}>מספר ימים שהיה אמור להגיע ולא הגיע</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(person => (
                      <tr key={person.id}>
                        <td style={{ border: '1px solid #ccc', padding: 12, textAlign: 'center' }}>{person.name}</td>
                        <td style={{ border: '1px solid #ccc', padding: 12, textAlign: 'center' }}>{person.missedAfterPenalty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSurplusOpen(false)} color="primary">סגור</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </>
  );
};

export default DaysLeft;