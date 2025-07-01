import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate, fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider, InputAdornment } from '@mui/material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import DailyAttendancePDF from '../../components/ReportsCompo/PDFDailyAttendance.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { heIL } from '@mui/x-date-pickers/locales';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import OutlinedInput from '@mui/material/OutlinedInput';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';




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

  // סה"כ נוכחים (גם ביום הגעה וגם לא ביום הגעה)
  const totalPresent = presentExpected.length + presentNotExpected.length;
  // סה"כ (נוכחים + חסרים)
  const totalAll = totalPresent + absentMembers.length;

  const reportDate = dataToShow?.date || selectedDate;
  const todayFormatted = dayjs(reportDate).format('DD/MM/YYYY');

  // מיון א"ב לפני יצירת הדאטה ל-PDF
  const sortedPresentExpected = [...presentExpected].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const sortedPresentNotExpected = [...presentNotExpected].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const sortedAbsentMembers = [...absentMembers].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

  return (
    <>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 5}}>
        {/* צד ימין */}
        <Box sx={{ display: 'flex', alignItems: 'center', }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBack}
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
          <Box sx={{ display: 'flex', gap: 2, mt: 5 }}>
            <DailyAttendancePDF attendanceData={dataToShow} profiles={profiles} reportDate={reportDate} />
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
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('נוכחות יומית', {
                  views: [{ rightToLeft: true }],
                });
                const columns = ['מספור', 'שם', 'יישוב', 'מטפל', 'נוכחות'];
                worksheet.columns = columns.map((col, idx) => ({
                  header: col,
                  key: col,
                  width: [6, 20, 15, 12, 10][idx],
                  style: {
                    alignment: { horizontal: 'center' },
                    font: { name: 'Arial', size: 12 },
                  }
                }));
                // הוספת שורת תאריך ממוזגת מעל הכותרות
                worksheet.insertRow(1, []);
                const dateCell = worksheet.getCell(1, 1);
                dateCell.value = `תאריך ${todayFormatted}`;
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
                // --- התחלה חדשה: ייצוא לפי מה שמוצג בדף ---
                // 1. נוכחים שהיו אמורים להגיע
                let rowIndex = 1;
                if (presentExpected.length > 0) {
                  presentExpected.forEach((person, idx) => {
                    const arrivalDays = getProfileArrivalDays(person);
                    let attendanceMark = '✔️';
                    let attendanceColor = 'FF43A047'; // ירוק
                    let plusOne = person.caregiver;
                    const row = worksheet.addRow({
                      'מספור': rowIndex++,
                      'שם': person.name,
                      'יישוב': person.city || 'לא צוין',
                      'מטפל': person.caregiver ? 'כן' : '',
                      'נוכחות': attendanceMark,
                    });
                    const cell = row.getCell('נוכחות');
                    if (plusOne) {
                      cell.value = {
                        richText: [
                          { text: '✔️', font: { color: { argb: attendanceColor }, bold: true } },
                        ]
                      };
                    } else {
                      cell.font = { color: { argb: attendanceColor }, bold: true };
                    }
                  });
                }
                // 2. נוכחים חריגים
                if (presentNotExpected.length > 0) {
                  presentNotExpected.forEach((person, idx) => {
                    let attendanceMark = '✔️';
                    let attendanceColor = 'FF1976D2'; // כחול
                    let plusOne = person.caregiver;
                    const row = worksheet.addRow({
                      'מספור': rowIndex++,
                      'שם': person.name,
                      'יישוב': person.city || 'לא צוין',
                      'מטפל': person.caregiver ? 'כן' : '',
                      'נוכחות': attendanceMark,
                    });
                    const cell = row.getCell('נוכחות');
                    if (plusOne) {
                      cell.value = {
                        richText: [
                          { text: '✔️', font: { color: { argb: attendanceColor }, bold: true } },
                          { text: ' +1', font: { color: { argb: 'FF888888' }, bold: true } }
                        ]
                      };
                    } else {
                      cell.font = { color: { argb: attendanceColor }, bold: true };
                    }
                  });
                }
                // 3. נעדרים שהיו אמורים להגיע
                if (absentMembers.length > 0) {
                  absentMembers.forEach((person, idx) => {
                    const row = worksheet.addRow({
                      'מספור': rowIndex++,
                      'שם': person.name,
                      'יישוב': person.city || 'לא צוין',
                      'מטפל': person.caregiver ? 'כן' : '',
                      'נוכחות': person.reason || '-',
                    });
                  });
                }
                // --- סוף שינוי ---
                // יישור אמצע לכל התאים
                worksheet.eachRow((row, rowNumber) => {
                  row.eachCell(cell => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                  });
                });
                // גבולות לכל התאים
                worksheet.eachRow((row, rowNumber) => {
                  row.eachCell((cell, colNumber) => {
                    cell.border = {
                      top: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                      left: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                      bottom: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                      right: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                    };
                  });
                });
                // הוספת מקרא כגוש נפרד לחלוטין ליד הטבלה
                const legendStartCol = columns.length + 2; // עמודה אחת רווח בין הטבלה למקרא
                const legendStartRow = 5; // מתחיל מהשורה החמישית
                // כותרת המקרא
                const legendTitleCell = worksheet.getCell(legendStartRow, legendStartCol);
                legendTitleCell.value = 'מקרא';
                legendTitleCell.font = { bold: true, size: 14 };
                legendTitleCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFE4ECF1' },
                };
                legendTitleCell.border = {
                  top: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  left: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  bottom: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  right: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                };
                legendTitleCell.alignment = { horizontal: 'center' };
                // נוכח ביום הגעה - וי ירוק
                const regularCell = worksheet.getCell(legendStartRow + 1, legendStartCol);
                regularCell.value = '✔️ נוכח ביום הגעה';
                regularCell.font = { color: { argb: 'FF43A047' }, size: 12 };
                regularCell.border = {
                  top: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  left: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  bottom: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  right: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                };
                // נוכח לא ביום הגעה - וי כחול
                const makeupCell = worksheet.getCell(legendStartRow + 2, legendStartCol);
                makeupCell.value = '✔️ נוכח לא ביום הגעה';
                makeupCell.font = { color: { argb: 'FF1976D2' }, size: 12 };
                makeupCell.border = {
                  top: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  left: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  bottom: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                  right: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                };

                // הגדרת רוחב עמודת המקרא
                worksheet.getColumn(legendStartCol).width = 25;
                // הורד קובץ
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                saveAs(blob, `דוח נוכחות - ${todayFormatted}.xlsx`);
              }}
            >
              ייצוא ל-Excel
            </Button>
          </Box>
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
                    {totalPresent}
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
                    {totalAll}
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