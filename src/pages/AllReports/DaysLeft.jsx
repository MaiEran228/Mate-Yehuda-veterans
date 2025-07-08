import React, { useEffect, useState } from 'react';
import { fetchAttendanceByDate, fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import dayjs from 'dayjs';
import PDFDaysLeft from '../../components/ReportsCompo/PDFDaysLeft';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

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
  const hebrewDaysByIndex = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
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
    const hebrewDaysByIndex = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const today = dayjs().format('YYYY-MM-DD');
    // ימים שהיו אמור להגיע ולא הגיע (עד היום)
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
    // מספר הימים שלא הגיע, לאחר ניקוי הופעות לא זכאיות
    const missedAfterPenalty = Math.max(missedDates.length - penalty, 0);
    return {
      id: profile.id,
      name: profile.name,
      eligible,
      attendedCount,
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
    const hebrewDaysByIndex = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
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

  // מיון people לפי שם
  const sortedPeople = [...people].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const sortedExtraPeople = [...extraPeople].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

  return (
    <>
      {/* שורת כפתורים - מחוץ ל-Container של הדוח */}
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2, mt: 5 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/Reports')}
          sx={{
            border: '1.7px solid rgba(64, 99, 112, 0.72)',
            color: 'rgba(64, 99, 112, 0.72)',
            fontWeight: 'bold',
            ':hover': {
              borderColor: '#7b8f99',
              color: '#5a676e',
              outline: 'none'
            },
            '&:focus': {
              outline: 'none'
            },
            '&:active': {
              outline: 'none'
            },
            minWidth: 'auto',
            ml: 2
          }}
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
        position: 'absolute', left: 32, top: 90, zIndex: 10, mt: 5,
        '@media (max-width:600px)': {
          left: 8, top: 80 // מיקום קטן
        }
      }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <PDFDaysLeft people={people} selectedMonth={selectedMonth} />
          <Button
            variant="contained"
            color="primary"
            disableRipple
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
              minWidth: '120px',
            }}
            onClick={async () => {
              const ExcelJS = (await import('exceljs')).default;
              const { saveAs } = await import('file-saver');
              const workbook = new ExcelJS.Workbook();
              const worksheet = workbook.addWorksheet('יתרת ימי זכאות', {
                views: [{ rightToLeft: true }],
              });
              const columns = ['מספור', 'שם', 'סה"כ ימי זכאות החודש', 'מספר הגעות בפועל', 'יתרת ימי זכאות החודש', 'היעדרויות מהימים הצפויים'];
              worksheet.columns = columns.map((col, idx) => ({
                header: col,
                key: col,
                width: [6, 20, 20, 20, 20, 24][idx],
                style: {
                  alignment: { horizontal: 'center' },
                  font: { name: 'Arial', size: 12 },
                }
              }));
              // הוספת שורת תאריך ממוזגת מעל הכותרות
              worksheet.insertRow(1, []);
              const dateCell = worksheet.getCell(1, 1);
              dateCell.value = `חודש: ${dayjs(selectedMonth).format('MM/YYYY')}`;
              dateCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              dateCell.font = { bold: true, size: 14 };
              dateCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE4ECF1' },
              };
              worksheet.mergeCells(1, 1, 1, columns.length);
              for (let i = 1; i <= columns.length; i++) {
                worksheet.getCell(1, i).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                worksheet.getCell(1, i).fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFE4ECF1' },
                };
              }
              // עיצוב שורת כותרת (עכשיו בשורה 2)
              const headerRow = worksheet.getRow(2);
              headerRow.height = 25;
              headerRow.eachCell(cell => {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFE4ECF1' },
                };
                cell.font = { bold: true };
                cell.border = {
                  top: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                  left: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                  bottom: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                  right: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              });
              // מיון שמות
              sortedPeople.forEach((person, idx) => {
                worksheet.addRow({
                  'מספור': idx + 1,
                  'שם': person.name,
                  'סה"כ ימי זכאות החודש': person.eligible,
                  'מספר הגעות בפועל': person.attendedCount,
                  'יתרת ימי זכאות החודש': person.remaining,
                  'היעדרויות מהימים הצפויים': person.missedAfterPenalty
                });
              });
              // גבולות ויישור לכל התאים
              worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNumber) => {
                  cell.border = {
                    top: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                    left: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                    bottom: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                    right: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                  };
                  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                });
              });
              // הורד קובץ
              const buffer = await workbook.xlsx.writeBuffer();
              const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              });
              saveAs(blob, `יתרת_ימי_זכאות_${dayjs(selectedMonth).format('MM_YYYY')}.xlsx`);
            }}
          >
            ייצוא ל-Excel
          </Button>

        </Box>
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
                    טבלת זכאות החודש
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl', tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ccc', padding: 16, backgroundColor: '#f5f5f5' }}>שם</th>
                          <th style={{ border: '1px solid #ccc', padding: 16, backgroundColor: '#f5f5f5' }}>סה"כ ימי זכאות החודש</th>
                          <th style={{ border: '1px solid #ccc', padding: 16, backgroundColor: '#f5f5f5' }}>ימים שנוצלו</th>
                          <th style={{ border: '1px solid #ccc', padding: 16, backgroundColor: '#f5f5f5' }}>יתרת ימי זכאות החודש</th>
                          <th style={{ border: '1px solid #ccc', padding: 16, backgroundColor: '#f5f5f5' }}>היעדרות מהימי הגעה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPeople.map(person => (
                          <tr key={person.id} style={{ minHeight: 48, }}>
                            <td style={{ border: '1px solid #ccc', padding: 16, textAlign: 'center', }}>{person.name}</td>
                            <td style={{ border: '1px solid #ccc', padding: 16, textAlign: 'center', }}>{person.eligible}</td>
                            <td style={{ border: '1px solid #ccc', padding: 16, textAlign: 'center', }}>{person.attendedCount}</td>
                            <td style={{ border: '1px solid #ccc', padding: 16, textAlign: 'center', }}>{person.remaining}</td>
                            <td style={{ border: '1px solid #ccc', padding: 16, textAlign: 'center', }}>{person.missedAfterPenalty}</td>
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
              {sortedExtraPeople.length === 0 ? (
                <div>אין אנשים עם ימי אקסטרה החודש.</div>
              ) : (
                <ul style={{ direction: 'rtl', paddingRight: 0 }}>
                  {sortedExtraPeople.map(p => (
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
      </Box>
    </>
  );
};

export default DaysLeft;