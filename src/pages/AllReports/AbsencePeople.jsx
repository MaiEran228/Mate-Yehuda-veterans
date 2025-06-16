import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate, fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import ExportPDFButton from '../../components/ExportPDFButton';
import * as XLSX from 'xlsx';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const AbsencePeople = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();
  const [openNoData, setOpenNoData] = useState(false);

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [inputDate, setInputDate] = useState(dayjs().format('YYYY-MM-DD'));
  const todayFormatted = dayjs(selectedDate).format('DD/MM/YYYY');
  const todayWeekday = dayjs(selectedDate).format('dddd');
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;

  const handleBack = () => {
    if (from === 'home') {
      navigate('/');
    } else {
      navigate('/Reports');
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribeAttendance = onSnapshot(
      doc(db, 'attendance', selectedDate),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setAttendanceData(docSnapshot.data());
        } else {
          setOpenNoData(true);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching attendance:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeAttendance();
  }, [selectedDate]);

  useEffect(() => {
    const loadData = async () => {
      const allProfiles = await fetchAllProfiles();
      setProfiles(allProfiles);
    };
    loadData();
  }, []);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  
  if (!attendanceData) {
    return (
      <Dialog
        open={openNoData}
        onClose={() => {
          setOpenNoData(false);
          navigate('/Reports');
        }}
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
              navigate('/Reports');
            }}
            autoFocus
            disableRipple
            sx={{
              '&:focus': { outline: 'none' },
              '&:active': { outline: 'none' }
            }}
          >
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // מציג את כל מי שמופיע בטבלת הנוכחות כנעדר (attended: false)
  const absentMembers = attendanceData.attendanceList
    .filter(person => person.attended === false)
    .sort((a, b) => (a.city || '').localeCompare(b.city || ''));

  // הגדרת עמודות עבור ה-PDF - בסדר RTL (מימין לשמאל)
  const pdfColumns = [
    { 
      key: 'reason', 
      header: 'סיבת היעדרות', 
      defaultValue: 'לא צוינה סיבה',
      formatter: (value) => value || 'לא צוינה סיבה'
    },
    { key: 'city', header: 'יישוב', defaultValue: 'לא צוין' },
    { key: 'name', header: 'שם', defaultValue: '' },
    { key: 'serialNumber', header: 'מס\'', defaultValue: '' }
  ];

  // נתונים מובנים לייצוא PDF - בסדר RTL
  const pdfData = absentMembers.map((person, index) => ({
    reason: person.reason || 'לא צוינה סיבה',
    city: person.city || 'לא צוין',
    name: person.name || '',
    serialNumber: index + 1
  }));

  // הגדרות עבור ה-PDF
  const pdfConfig = {
    title: 'דוח חסרים יומי',
    subtitle: 'מעון יום לותיקים',
    headerInfo: [
      `תאריך: ${todayFormatted}`,
      `יום: ${todayWeekday}`
    ],
    summaryData: [
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
        fillColor: [211, 47, 47], // צבע אדום כמו בדוח המקורי
        fontSize: 12,
        font: 'AlefHebrew'
      }
    }
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body {
            font-family: Arial, Helvetica, sans-serif !important;
            direction: rtl;
            color: black !important;
            background: white !important;
          }
          
          * {
            font-family: Arial, Helvetica, sans-serif !important;
            color: black !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #333 !important;
            padding: 8px;
            text-align: center;
          }
          
          .print-table th {
            background-color: #f5f5f5 !important;
            font-weight: bold;
          }
        }
        
        .hebrew-text {
          font-family: Arial, Helvetica, sans-serif;
          direction: ltr;
          text-align: right;
        }
      `}</style>

      {/* שורת כפתורים - מחוץ ל-Container של הדוח */}
      <Box className="no-print" sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2 }}>
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
      </Box>

      <Box className="no-print" sx={{
        position: 'absolute', 
        left: 32, 
        top: 90, 
        zIndex: 10,
        display: 'flex',
        gap: 2,
        '@media (max-width:600px)': {
          left: 8, 
          top: 80,
          flexDirection: 'column'
        }
      }}>
        <ExportPDFButton
          data={pdfData}
          columns={pdfColumns}
          fileName={`דוח חסרים - ${todayFormatted}.pdf`}
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
              '&:active': { outline: 'none' }
            }
          }}
        />
        <Button
          variant="contained"
          color="secondary"
          disableRipple
          onClick={() => {
            const excelData = absentMembers.map((person, index) => ({
              'מס': index + 1,
              'שם': person.name,
              'יישוב': person.city || 'לא צוין',
              'סיבת היעדרות': person.reason || 'לא צוינה סיבה',
              'תאריך': todayFormatted
            }));
            
            const ws = XLSX.utils.json_to_sheet(excelData);
            
            // הגדרת רוחב עמודות
            ws['!cols'] = [
              { wch: 5 },   // מס
              { wch: 25 },  // שם  
              { wch: 15 },  // יישוב
              { wch: 20 },  // סיבת היעדרות
              { wch: 12 }   // תאריך
            ];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'חסרים');
            XLSX.writeFile(wb, `דוח חסרים - ${todayFormatted}.xlsx`);
          }}
          sx={{
            '&:focus': { outline: 'none' },
            '&:active': { outline: 'none' }
          }}
        >
          ייצוא ל-Excel
        </Button>
      </Box>

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        width: '100%',
        px: { xs: 2, md: 8 },
      }}>
        <Container maxWidth={false} sx={{ mt: 2, maxWidth: '900px', width: '100%' }}>
          {attendanceData && attendanceData.attendanceList ? (
            <div id="reportContent" className="hebrew-text">
              <Paper sx={{
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                p: 4,
                outline: 'none',
                fontFamily: 'Arial, Helvetica, sans-serif',
                direction: 'rtl',
                backgroundColor: 'white',
                '@media print': {
                  width: '100%',
                  minHeight: 'auto',
                  margin: 0,
                  padding: '20px',
                  boxShadow: 'none',
                  border: 'none'
                }
              }}>

                {/* כותרת ראשית */}
                <Box sx={{
                  textAlign: 'center',
                  mb: 4,
                  pb: 2,
                  borderBottom: '3px solid #d32f2f'
                }}>
                  <Typography variant="h3" sx={{
                    fontWeight: 'bold',
                    color: '#d32f2f',
                    mb: 1,
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    '@media print': {
                      fontSize: '24pt',
                      color: '#000'
                    }
                  }}>
                    דוח חסרים יומי
                  </Typography>
                  <Typography variant="h5" sx={{
                    color: '#666',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    '@media print': {
                      fontSize: '16pt',
                      color: '#000'
                    }
                  }}>
                    מעון יום לותיקים
                  </Typography>
                </Box>

                {/* פרטי התאריך */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 3,
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  '@media print': {
                    backgroundColor: 'transparent',
                    border: '1px solid #333'
                  }
                }}>
                  <Box>
                    <Typography variant="body1" sx={{
                      fontWeight: 'bold',
                      fontFamily: 'Arial, Helvetica, sans-serif'
                    }}>
                      תאריך: {todayFormatted}
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: '#666',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      '@media print': { color: '#000' }
                    }}>
                      יום: {todayWeekday}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{
                      color: '#666',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      '@media print': { color: '#000' }
                    }}>
                      דוח נוצר: {dayjs().format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </Box>
                </Box>

                {/* סיכום סטטיסטי */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 4,
                  p: 3,
                  backgroundColor: '#ffebee',
                  borderRadius: 2,
                  border: '2px solid #d32f2f',
                  '@media print': {
                    backgroundColor: 'transparent',
                    border: '2px solid #333'
                  }
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" sx={{
                      color: '#d32f2f',
                      fontWeight: 'bold',
                      mb: 1,
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      '@media print': {
                        fontSize: '36pt',
                        color: '#000'
                      }
                    }}>
                      {absentMembers.length}
                    </Typography>
                    <Typography variant="h6" sx={{
                      color: '#d32f2f',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      '@media print': {
                        fontSize: '14pt',
                        color: '#000'
                      }
                    }}>
                      סה"כ חסרים
                    </Typography>
                  </Box>
                </Box>

                {/* רשימת חסרים - טבלה */}
                {absentMembers.length > 0 ? (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{
                      mb: 3,
                      fontWeight: 'bold',
                      color: '#d32f2f',
                      borderBottom: '2px solid #d32f2f',
                      pb: 1,
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      '@media print': {
                        fontSize: '18pt',
                        color: '#000',
                        borderBottom: '2px solid #000'
                      }
                    }}>
                      רשימת חסרים ({absentMembers.length})
                    </Typography>

                    <TableContainer component={Paper} sx={{
                      '@media print': {
                        boxShadow: 'none',
                        border: 'none'
                      }
                    }}>
                      <Table className="print-table" sx={{
                        '& .MuiTableCell-root': {
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          '@media print': {
                            border: '1px solid #333 !important',
                            fontSize: '12pt'
                          }
                        }
                      }}>
                        <TableHead>
                          <TableRow sx={{
                            backgroundColor: '#f5f5f5',
                            '@media print': {
                              backgroundColor: '#f5f5f5 !important'
                            }
                          }}>
                            <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>מס'</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>שם</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>יישוב</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>סיבת היעדרות</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {absentMembers.map((person, index) => (
                            <TableRow key={person.id || index} sx={{
                              '&:nth-of-type(even)': {
                                backgroundColor: '#fafafa',
                                '@media print': {
                                  backgroundColor: '#fafafa !important'
                                }
                              }
                            }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>
                                {index + 1}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>
                                {person.name}
                              </TableCell>
                              <TableCell>
                                {person.city || 'לא צוין'}
                              </TableCell>
                              <TableCell>
                                {person.reason || 'לא צוינה סיבה'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  <Box sx={{
                    textAlign: 'center',
                    p: 4,
                    backgroundColor: '#e8f5e8',
                    borderRadius: 2,
                    border: '2px solid #4caf50',
                    mb: 4,
                    '@media print': {
                      backgroundColor: 'transparent',
                      border: '2px solid #333'
                    }
                  }}>
                    <Typography variant="h5" sx={{
                      color: '#4caf50',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      '@media print': {
                        fontSize: '18pt',
                        color: '#000'
                      }
                    }}>
                      🎉 אין חסרים היום! 🎉
                    </Typography>
                    <Typography variant="body1" sx={{
                      mt: 1,
                      color: '#2e7d32',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      '@media print': {
                        color: '#000'
                      }
                    }}>
                      כל החברים נוכחים במעון
                    </Typography>
                  </Box>
                )}

                {/* חתימה וחותמת */}
                <Box sx={{
                  mt: 'auto',
                  pt: 4,
                  borderTop: '2px solid #e0e0e0',
                  '@media print': {
                    marginTop: '50px',
                    borderTop: '2px solid #333',
                    pageBreakInside: 'avoid'
                  }
                }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        mb: 3,
                        '@media print': { fontSize: '10pt' }
                      }}>
                        חתימת אחראי: ___________________
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{
                        color: '#666',
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        '@media print': {
                          color: '#000',
                          fontSize: '9pt'
                        }
                      }}>
                        מעון יום לותיקים<br />
                        דוח אוטומטי - {dayjs().format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </div>
          ) : null}
        </Container>
      </Box>
    </>
  );
};

export default AbsencePeople;