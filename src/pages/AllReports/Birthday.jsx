import React, { useEffect, useState } from 'react';
import { fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { useLocation, useNavigate } from 'react-router-dom';
import ExportPDFButton from '../../components/ExportPDFButton';
import CakeIcon from '@mui/icons-material/Cake';
import * as XLSX from 'xlsx';
import OutlinedInput from '@mui/material/OutlinedInput';

// הגדרת השפה העברית
dayjs.locale('he');

const Birthday = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const todayFormatted = dayjs().format('DD/MM/YYYY');
  const currentMonth = (dayjs().month() + 1).toString(); // חודשים ב-dayjs מ-0
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

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

  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const currentMonthName = hebrewMonths[Number(selectedMonth) - 1];

  // הכנת נתונים חגיגיים לייצוא PDF - מותאם לטיפול ב-ExportPDFButton
  const prepareFestivePDFData = () => {
    const monthProfiles = profilesByMonth[selectedMonth] || [];
    const sortedMonthProfiles = monthProfiles.sort((a, b) => 
      (a.name || '').localeCompare(b.name || '', 'he')
    );

    return sortedMonthProfiles.map((profile, index) => {
      const birthDate = dayjs(profile.birthDate);
      const age = dayjs().diff(birthDate, 'year');
      const dayInMonth = birthDate.date();
      
      // הודעה חגיגית פשוטה - בלי אימוג'ים
      const name = profile.name || 'לא צוין';
      const celebration = `${name} חוגג ${age} שנים ב-${dayInMonth} ל${currentMonthName}`;
      
      return {
        celebration: celebration
      };
    });
  };

  const pdfColumns = [
    { 
      key: 'celebration', 
      header: `חגיגות יום הולדת - ${currentMonthName}`,
      formatter: (value) => value
    }
  ];

  const currentMonthCount = (profilesByMonth[selectedMonth] || []).length;

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
        <FormControl size="small" sx={{ minWidth: 100, ml: 2 }}>
          <InputLabel id="month-select-label" sx={{ textAlign: 'right', right: 25, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: '#ebf1f5', px: 0.5 }}>
            חודש
          </InputLabel>
          <Select
            labelId="month-select-label"
            value={selectedMonth}
            label="חודש"
            onChange={e => setSelectedMonth(e.target.value)}
            input={<OutlinedInput notched={false} label="חודש" />}
          >
            {hebrewMonths.map((month, idx) => (
              <MenuItem key={idx + 1} value={(idx + 1).toString()}>{month}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{
        position: 'absolute', left: 32, top: 90, zIndex: 10, gap: 2, display: 'flex',
        '@media (max-width:600px)': {
          left: 8, top: 80 // מסכים קטנים
        }
      }}>
        <ExportPDFButton
          data={prepareFestivePDFData()}
          columns={pdfColumns}
          fileName={`ימי_הולדת_חודש_${currentMonthName}.pdf`}
          title="ימי הולדת החודש"
          subtitle={`חודש ${currentMonthName} `}
          headerInfo={[
            `מספר חוגגים החודש: ${currentMonthCount}`,
          ]}
          
          footerInfo={[
            { text: `דוח נוצר ב-${dayjs().format('DD/MM/YYYY HH:mm')} במעון יום לותיקים`, align: 'center' },
          ]}
          buttonText="ייצוא ל-PDF"
          customStyles={{
            styles: {
              fontSize: 12,
              cellPadding: 8,
              halign: 'center',
              fillColor: [255, 248, 220], // רקע קרם חם
              textColor: [139, 69, 19]    // חום כהה
            },
            headStyles: {
              fillColor: [255, 182, 193], // ורוד בהיר חגיגי
              textColor: [139, 0, 0],     // אדום כהה
              fontStyle: 'bold',
              fontSize: 14,
              cellPadding: 10
            },
            columnStyles: {
              0: { 
                cellWidth: 'auto', 
                halign: 'center',
                fillColor: [255, 240, 245], // ורוד עדין מאוד
                minCellHeight: 15
              }
            },
            tableOptions: {
              theme: 'plain',
              tableLineWidth: 2,
              tableLineColor: [255, 105, 180] // ורוד חגיגי
            }
          }}
        />
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const columns = ['שם', 'תאריך לידה', 'גיל'];
            const monthProfiles = profilesByMonth[selectedMonth] || [];
            const excelData = monthProfiles
              .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
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
            XLSX.writeFile(wb, `דוח_ימי_הולדת_${currentMonthName}_${todayFormatted}.xlsx`);
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
                  דוח ימי הולדת חודשי
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  {`חודש: ${currentMonthName}`}<br />
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
                    {currentMonthCount}
                  </Typography>
                  <Typography variant="body2">סה"כ ימי הולדת החודש</Typography>
                </Box>
              </Box>

              {/* רשימת ימי הולדת לחודש הנבחר בלבד */}
              {currentMonthCount === 0 ? (
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
                  אין ימי הולדת החודש.
                </Typography>
              ) : (
                <Box
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
                    {currentMonthName} ({currentMonthCount})
                  </Typography>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: 2
                  }}>
                    {profilesByMonth[selectedMonth]?.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
                      .map((profile) => (
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
                          <Box sx={{ color: '#1976d2', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
                            🎂
                          </Box>
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
              )}

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