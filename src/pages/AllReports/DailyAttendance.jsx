import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate, fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider, InputAdornment } from '@mui/material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import ExportPDFButton from '../../components/ExportPDFButton'; // הגירסה הראשונה - עם תמונות
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { heIL } from '@mui/x-date-pickers/locales';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import OutlinedInput from '@mui/material/OutlinedInput';




const DailyAttendance = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [inputDate, setInputDate] = useState(dayjs().format('YYYY-MM-DD'));
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;

  const [openNoData, setOpenNoData] = useState(false);
  const [lastValidAttendance, setLastValidAttendance] = useState(null);
  const [pendingDate, setPendingDate] = useState(dayjs(selectedDate));

  const handleBack = () => {
    if (from === 'home') {
      navigate('/'); // למסך הבית
    } else {
      navigate('/Reports'); // לעמוד הדוחות הראשי
    }
  };

  useEffect(() => {
    setAttendanceData(null);
  }, [selectedDate]);

  useEffect(() => {
    // טען את כל הפרופילים
    const loadProfiles = async () => {
      const allProfiles = await fetchAllProfiles();
      setProfiles(allProfiles);
    };
    loadProfiles();
  }, []);

  useEffect(() => {
    // Only fetch if selectedDate is a valid YYYY-MM-DD string
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate);
    if (!selectedDate || !isValidDate) return;
    const loadAttendance = async () => {
      setLoading(true);
      console.log('מביא נתונים לתאריך:', selectedDate);
      const data = await fetchAttendanceByDate(selectedDate);
      if (data && data.attendanceList) {
        setAttendanceData(data);
        setLastValidAttendance(data);
      } else {
        setOpenNoData(true);
      }
      setLoading(false);
    };
    loadAttendance();
  }, [selectedDate]);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `דו"ח נוכחות - ${selectedDate}`,
  });

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  // Always show the last valid attendance data if exists
  const dataToShow = attendanceData && attendanceData.attendanceList ? attendanceData : lastValidAttendance;
  if (!attendanceData || !attendanceData.attendanceList || attendanceData.attendanceList.length === 0) {
    return (
      <Dialog
        open={openNoData}
        onClose={() => setOpenNoData(false)}
        PaperProps={{
          sx: {
            minWidth: 340,
            border: '1px solid #e0e0e0',
            boxShadow: 6,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'right', fontWeight: 'bold' }}>אין נתונים</DialogTitle>
        <Divider sx={{ mb: 1 }} />
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            לא נשמרו נתונים בתאריך:
            <span style={{ color: 'black', fontWeight: 500, marginRight: 6 }}>
              {dayjs(selectedDate).format('DD/MM/YYYY')}
            </span>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setOpenNoData(false);
              if (lastValidAttendance) {
                setSelectedDate(lastValidAttendance.date); // חזרה לתאריך הקודם עם נתונים
                setPendingDate(dayjs(lastValidAttendance.date));
              }
            }}
          >
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // קביעת היום בשבוע בעברית
  const todayWeekday = dayjs(dataToShow.date || selectedDate).format('dddd');

  // פונקציה עוזרת למציאת arrivalDays של משתתף
  const getProfileArrivalDays = (person) => {
    const profile = profiles.find(p => p.id === person.id || p.name === person.name);
    return profile && Array.isArray(profile.arrivalDays) ? profile.arrivalDays : [];
  };

  // נוכחים שהיו אמורים להגיע היום (ירוק)
  const presentExpected = dataToShow.attendanceList.filter(p => {
    if (!p.attended) return false;
    const arrivalDays = getProfileArrivalDays(p);
    return arrivalDays.includes(todayWeekday);
  });

  // נוכחים שהגיעו ביום שלא אמורים (כחול)
  const presentNotExpected = dataToShow.attendanceList.filter(p => {
    if (!p.attended) return false;
    const arrivalDays = getProfileArrivalDays(p);
    return !arrivalDays.includes(todayWeekday);
  });

  // נעדרים שהיו אמורים להגיע היום
  const absentMembers = dataToShow.attendanceList.filter(p => {
    if (p.attended !== false) return false;
    const arrivalDays = getProfileArrivalDays(p);
    return arrivalDays.includes(todayWeekday);
  });

  const reportDate = dataToShow?.date || selectedDate;
  const todayFormatted = dayjs(reportDate).format('DD/MM/YYYY');

  const pdfColumns = [
    { key: 'name', header: 'שם', defaultValue: '' },
    { key: 'city', header: 'יישוב', defaultValue: 'לא צוין' },
    { key: 'caregiver', header: 'מטפל', defaultValue: '' },
    { key: 'serialNumber', header: 'מס\'', defaultValue: '' }
  ];

  const pdfData = presentExpected.map((person, index) => ({
    name: person.name || '',
    city: person.city || 'לא צוין',
    caregiver: person.caregiver || '',
    serialNumber: index + 1
  }));

  const pdfConfig = {
    title: 'דוח נוכחות יומי',
    subtitle: 'מעון יום לותיקים',
    headerInfo: [
      `תאריך: ${todayFormatted}`,
      `יום: ${dayjs(reportDate).format('dddd')}`
    ],
    summaryData: [
      `סה"כ נוכחים: ${presentExpected.length}`,
      `סה"כ חסרים: ${absentMembers.length}`
    ],
    footerInfo: [
      { text: 'מעון יום לותיקים - דוח אוטומטי', align: 'center' },
      { text: `נוצר בתאריך: ${dayjs().format('DD/MM/YYYY HH:mm')}`, align: 'center' }
    ],
    customStyles: {
      styles: {
        fontSize: 11,
        cellPadding: 6,
        font: 'AlefHebrew'
      },
      headStyles: {
        fillColor: [66, 139, 202], // צבע כחול כמו בדוח המקורי
        fontSize: 12,
        font: 'AlefHebrew'
      }
    }
  };

  return (
    <>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 5}}>
        {/* צד ימין */}
        <Box sx={{ display: 'flex', alignItems: 'center', }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBack}
            sx={{ ml: 2 }}
          >
            חזור
          </Button>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="he"
            localeText={{
              ...heIL.components.MuiLocalizationProvider.defaultProps.localeText,
              okButtonLabel: 'אישור',
            }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              {/* שכבת חסימה שמכסה רק את שדה הטקסט, לא את כפתור הלוח שנה */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: '40px', // משאיר את האייקון פתוח
                  bottom: 0,
                  zIndex: 10,
                  pointerEvents: 'all',
                  borderRadius: 1,
                }}
              />
              <DatePicker
                label="תאריך"
                value={pendingDate}
                onChange={(newValue) => setPendingDate(newValue)}
                format="DD/MM/YYYY"
                onAccept={(newValue) => {
                  if (newValue && newValue.isValid()) {
                    setSelectedDate(newValue.format('YYYY-MM-DD'));
                  }
                }}
                slotProps={{
                  actionBar: {
                    actions: ['accept'],
                    sx: {
                      padding: '0px 8px',
                      margin: '-70px 0 0 0',
                      minHeight: '22px',
                      '& .MuiButton-root': {
                        minWidth: 40,
                        padding: '0px 8px',
                        margin: '0 2px',
                        mb: 1,
                        ml: 2,
                        fontSize: '0.875rem',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        height: '28px',
                        borderRadius: '3px',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                      }
                    }
                  },
                  textField: {
                    size: 'small',
                    sx: {
                      ml: 2,
                      minWidth: 130,
                      maxWidth: 160,
                      direction: 'rtl',
                      '& .MuiOutlinedInput-notchedOutline legend': {
                        display: 'none',
                      },
                      '& .MuiIconButton-root': {
                        outline: 'none',
                        '&:focus': {
                          outline: 'none',
                          boxShadow: 'none',
                        },
                      },
                    },
                    
                    InputProps: {
                      notched: false,
                      sx: {
                        flexDirection: 'row-reverse',
                        input: {
                          textAlign: 'right',
                        },
                      },
                    },
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </Box>
        {/* צד שמאל */}
        <Box sx={{
          position: 'absolute', left: 32, top: 90, zIndex: 10,
          '@media (max-width:600px)': {
            left: 8, top: 80 // מסכים קטנים
          }
        }}>
          <ExportPDFButton
            data={pdfData}
            columns={pdfColumns}
            fileName={`דוח נוכחות - ${todayFormatted}.pdf`}
            title={pdfConfig.title}
            subtitle={pdfConfig.subtitle}
            headerInfo={pdfConfig.headerInfo}
            summaryData={pdfConfig.summaryData}
            footerInfo={pdfConfig.footerInfo}
            customStyles={pdfConfig.customStyles}
            buttonText="ייצא ל-PDF"
            buttonProps={{
              disableRipple: true,
              sx: {
                '&:focus': { outline: 'none' },
                '&:active': { outline: 'none' }, mt:5
              }
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'start', width: '100%', px: { xs: 2, md: 8 }, }}>
        <Container maxWidth={false}
          sx={{ mt: 2, maxWidth: '900px', width: '100%', }}>
          <div id="reportContent" style={{ width: '210mm', margin: '0 auto' }}>
            <Paper sx={{ width: '100%', p: 4, outline: 'none', '@media print': { width: '100%', margin: 0, boxShadow: 'none', border: 'none' } }}>

              {/* כותרת */}
              <Box className="header-section" sx={{
                textAlign: 'center',
                mb: 4,
                borderBottom: '2px solid #1976d2',
                pb: 2,
                '@media print': {
                  pageBreakInside: 'avoid'
                }
              }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  דוח נוכחות יומי
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  תאריך: {todayFormatted}
                </Typography>
              </Box>

              {/* סיכום כללי */}
              <Box className="summary-section" sx={{
                display: 'flex',
                justifyContent: 'space-around',
                mb: 4,
                p: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
                '@media print': {
                  backgroundColor: '#f9f9f9',
                  pageBreakInside: 'avoid'
                }
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main">
                    {presentExpected.length}
                  </Typography>
                  <Typography variant="body2">נוכחים</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="error.main">
                    {absentMembers.length}
                  </Typography>
                  <Typography variant="body2">חסרים</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">
                    {dataToShow.attendanceList.length}
                  </Typography>
                  <Typography variant="body2">סה"כ</Typography>
                </Box>
              </Box>

              {/* רשימת נוכחים */}
              <Box className="present-section" sx={{ mb: 4 }}>
                <Typography variant="h6" color="success.main" gutterBottom sx={{
                  borderBottom: '1px solid #4caf50',
                  pb: 1,
                  '@media print': {
                    pageBreakAfter: 'avoid'
                  }
                }}>
                   רשימת נוכחים ({presentExpected.length})
                </Typography>
                {presentExpected.length > 0 ? (
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 1.5,
                    mt: 2,
                    '@media print': {
                      pageBreakInside: 'avoid'
                    }
                  }}>
                    {presentExpected.map((person, index) => (
                      <Box key={person.id || person.name || index} sx={{
                        p: 1.5,
                        backgroundColor: '#e8f5e8',
                        borderRadius: 1,
                        fontSize: '0.9rem',
                        color: 'black',
                        fontWeight: 500,
                        '@media print': {
                          backgroundColor: '#fff',
                          border: '1px solid #333',
                          color: '#000'
                        }
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 'inherit' }}>
                          {index + 1}. {person.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
                          יישוב: {person.city}
                        </Typography>
                        {person.caregiver || person.hasCaregiver ? (
                          <Typography variant="caption" color="black" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 700 }}>
                            הגיע עם מטפל
                          </Typography>
                        ) : null}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="textSecondary">אין נוכחים שהיו אמורים להגיע היום.</Typography>
                )}

                {/* נוכחים שהגיעו ביום לא צפוי */}
                <Typography variant="h6" color="primary" gutterBottom sx={{
                  borderBottom: '1px solid #1976d2',
                  pb: 1,
                  mt: 4,
                  '@media print': {
                    pageBreakAfter: 'avoid'
                  }
                }}>
                  נוכחים שהגיעו ביום לא צפוי ({presentNotExpected.length})
                </Typography>
                {presentNotExpected.length > 0 ? (
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 1.5,
                    mt: 2,
                    '@media print': {
                      pageBreakInside: 'avoid'
                    }
                  }}>
                    {presentNotExpected.map((person, index) => (
                      <Box key={person.id || person.name || index} sx={{
                        p: 1.5,
                        backgroundColor: '#e3f2fd',
                        borderRadius: 1,
                        fontSize: '0.9rem',
                        color: 'black',
                        fontWeight: 500,
                        '@media print': {
                          backgroundColor: '#fff',
                          border: '1px solid #333',
                          color: '#000'
                        }
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 'inherit' }}>
                          {index + 1}. {person.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
                          יישוב: {person.city}
                        </Typography>
                        {person.caregiver || person.hasCaregiver ? (
                          <Typography variant="caption" color="black" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 700 }}>
                            הגיע עם מטפל
                          </Typography>
                        ) : null}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="textSecondary">אין נוכחים חריגים.</Typography>
                )}
              </Box>

              {/* רשימת נעדרים */}
              <Box className="absent-section" sx={{ mb: 4 }}>
                <Typography variant="h6" color="error.main" gutterBottom sx={{
                  borderBottom: '1px solid #f44336',
                  pb: 1,
                  '@media print': {
                    pageBreakAfter: 'avoid'
                  }
                }}>
                  רשימת חסרים ({absentMembers.length})
                </Typography>
                {absentMembers.length > 0 ? (
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 1.5,
                    mt: 2,
                    '@media print': {
                      pageBreakInside: 'avoid'
                    }
                  }}>
                    {absentMembers.map((person, index) => (
                      <Box key={person.id} sx={{
                        p: 1.5,
                        backgroundColor: '#ffebee',
                        borderRadius: 1,
                        fontSize: '0.9rem',
                        '@media print': {
                          pageBreakInside: 'avoid',
                          backgroundColor: '#fdf0f0'
                        }
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 'inherit' }}>
                          {index + 1}. {person.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
                          יישוב: {person.city}
                        </Typography>
                        {person.caregiver || person.hasCaregiver ? (
                          <Typography variant="caption" color="success.main" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 700 }}>
                            הגיע עם מטפל
                          </Typography>
                        ) : null}
                        <Typography variant="caption" color="black" sx={{ display: 'block', fontSize: '0.8rem' }}>
                          סיבת היעדרות: {person.reason || ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                    אין נעדרים היום
                  </Typography>
                )}
              </Box>

              {/* חתימה */}
              <Box className="footer-section" sx={{
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

export default DailyAttendance;