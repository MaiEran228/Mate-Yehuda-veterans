import React, { useEffect, useState } from 'react';
import { fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { useLocation, useNavigate } from 'react-router-dom';
import ExportPDFButton from '../../components/ExportPDFButton';
import CakeIcon from '@mui/icons-material/Cake';
import * as XLSX from 'xlsx';

// הגדרת השפה העברית
dayjs.locale('he');

const Birthday = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const todayFormatted = dayjs().format('DD/MM/YYYY');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDate, setSelectedDate] = useState(todayFormatted);

  const handleBack = () => {
    if (from === 'home') {
      navigate('/');
    } else {
      navigate('/Reports');
    }
  };

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      const data = await fetchAllProfiles();
      setProfiles(data);
      setLoading(false);
    };

    loadProfiles();
  }, []);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  // מיון הפרופילים לפי חודש ויום
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (!a.birthDate || !b.birthDate) return 0;
    const dateA = dayjs(a.birthDate);
    const dateB = dayjs(b.birthDate);
    return dateA.month() - dateB.month() || dateA.date() - dateB.date();
  });

  // ארגון הפרופילים לפי חודשים
  const profilesByMonth = sortedProfiles.reduce((acc, profile) => {
    if (profile.birthDate) {
      const birthDate = dayjs(profile.birthDate);
      const monthKey = birthDate.format('M');
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(profile);
    }
    return acc;
  }, {});

  // סינון לפי חודש נבחר
  const filteredProfilesByMonth = selectedMonth === 'all'
    ? profilesByMonth
    : { [selectedMonth]: profilesByMonth[selectedMonth] || [] };

  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  return (
    <>
      {/* שורת כפתורים - מחוץ ל-Container של הדוח */}
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleBack}
          sx={{ ml: 2 }}
        >
          חזור
        </Button>
        <TextField
          label="תאריך"
          type="date"
          size="small"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          sx={{ ml: 2, minWidth: 140 }}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl size="small" sx={{ minWidth: 120, ml: 2 }}>
          <InputLabel id="month-select-label">חודש</InputLabel>
          <Select
            labelId="month-select-label"
            value={selectedMonth}
            label="חודש"
            onChange={e => setSelectedMonth(e.target.value)}
          >
            <MenuItem value="all">הכל</MenuItem>
            {hebrewMonths.map((month, idx) => (
              <MenuItem key={idx + 1} value={(idx + 1).toString()}>{month}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{
        position: 'absolute', left: 32, top: 90, zIndex: 10,
        '@media (max-width:600px)': {
          left: 8, top: 80 // מסכים קטנים
        }
      }}>
        <ExportPDFButton
          targetId="reportContent"
          fileName={`ימי הולדת - ${todayFormatted}.pdf`}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const columns = ['שם', 'תאריך לידה', 'גיל'];
            const excelData = sortedProfiles
              .filter(profile => profile.birthDate)
              .map(profile => {
                const birthDate = dayjs(profile.birthDate);
                const age = dayjs().diff(birthDate, 'year');
                return {
                  'שם': profile.name,
                  'תאריך לידה': birthDate.format('DD/MM/YYYY'),
                  'גיל': age
                };
              });
            const ws = XLSX.utils.json_to_sheet(excelData, { header: columns });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'ימי הולדת');
            XLSX.writeFile(wb, `דוח ימי הולדת - ${todayFormatted}.xlsx`);
          }}
          sx={{ ml: 2 }}
        >
          ייצוא ל־Excel
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'start', width: '100%', px: { xs: 2, md: 8 }, }}>
        <Container maxWidth={false}
          sx={{ mt: 2, maxWidth: '900px', width: '100%', }}>

          <div id="reportContent" dir="rtl">
            <Paper sx={{
              width: '210mm',
              margin: '0 auto',
              p: 4,
              outline: 'none'
            }}>
              {/* כותרת */}
              <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  דוח ימי הולדת שנתי
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  נוצר בתאריך: {todayFormatted}
                </Typography>
              </Box>

              {/* סיכום */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                mb: 4,
                p: 2,
                backgroundColor: '#e3f2fd',
                borderRadius: 1
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">
                    {profiles.filter(p => p.birthDate).length}
                  </Typography>
                  <Typography variant="body2">סה"כ ימי הולדת</Typography>
                </Box>
              </Box>

              {/* רשימת ימי הולדת לפי חודשים */}
              {Object.entries(filteredProfilesByMonth)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([monthNum, monthProfiles]) => (
                  <Box
                    key={monthNum}
                    sx={{
                      mb: 4,
                      '@media print': {
                        pageBreakInside: 'avoid'
                      }
                    }}
                  >
                    <Typography
                      variant="h6"
                      color="primary"
                      gutterBottom
                      sx={{
                        borderBottom: '1px solid #1976d2',
                        pb: 1,
                        mb: 2
                      }}
                    >
                      {hebrewMonths[Number(monthNum) - 1]} ({monthProfiles.length})
                    </Typography>
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                      gap: 2
                    }}>
                      {monthProfiles.map((profile) => (
                        <Paper
                          key={profile.id}
                          elevation={1}
                          sx={{
                            p: 2,
                            backgroundColor: '#e3f2fd',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}
                        >
                          <CakeIcon sx={{ color: '#1976d2', fontSize: 32 }} />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                              {profile.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {profile.birthDate ? (() => {
                                const birthDate = dayjs(profile.birthDate);
                                return `תאריך לידה: ${birthDate.format('DD/MM/YYYY')}`;
                              })() : 'תאריך לידה לא צוין'}
                            </Typography>
                            {profile.birthDate && (
                              <Typography variant="body2" color="textSecondary">
                                {`גיל: ${dayjs().diff(dayjs(profile.birthDate), 'year')}`}
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                ))}

              {/* חתימה */}
              <Box sx={{
                mt: 4,
                pt: 2,
                borderTop: '1px solid #e0e0e0',
                textAlign: 'center',
                '@media print': {
                  pageBreakInside: 'avoid'
                }
              }}>
                <Typography variant="caption" color="textSecondary">
                  דוח נוצר ב-{dayjs().format('DD/MM/YYYY HH:mm')} | מעון יום לותיקים
                </Typography>
              </Box>
            </Paper>
          </div>
        </Container>
      </Box>
    </>
  );
};

export default Birthday;