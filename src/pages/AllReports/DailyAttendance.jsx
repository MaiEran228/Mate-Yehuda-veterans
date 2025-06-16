import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import ExportPDFButton from '../../components/ExportPDFButton'; // הגירסה הראשונה - עם תמונות
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DailyAttendance = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [inputDate, setInputDate] = useState(dayjs().format('YYYY-MM-DD'));
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;

  const [openNoData, setOpenNoData] = useState(false);
  const [lastValidAttendance, setLastValidAttendance] = useState(null);

  const handleBack = () => {
    if (from === 'home') {
      navigate('/'); // למסך הבית
    } else {
      navigate('/Reports'); // לעמוד הדוחות הראשי
    }
  };

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
  if (!dataToShow || !dataToShow.attendanceList) {
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

  const presentMembers = dataToShow.attendanceList
    .filter(p => p.attended)
    .sort((a, b) => (a.city || '').localeCompare(b.city || ''));
  const absentMembers = dataToShow.attendanceList
    .filter(p => !p.attended)
    .sort((a, b) => (a.city || '').localeCompare(b.city || ''));

  const reportDate = dataToShow?.date || selectedDate;
  const todayFormatted = dayjs(reportDate).format('DD/MM/YYYY');

  return (
    <>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {/* צד ימין */}
        <Box sx={{ display: 'flex', alignItems: 'center',  }}>
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
        {/* צד שמאל */}
        <Box sx={{
          position: 'absolute', left: 32, top: 90, zIndex: 10,
          '@media (max-width:600px)': {
            left: 8, top: 80 // מסכים קטנים
          }
        }}>
          <ExportPDFButton
            targetId="reportContent"
            fileName={`דוח נוכחות - ${todayFormatted}.pdf`}
          />
        </Box>
      </Box>

      <Box sx={{display: 'flex',justifyContent: 'center',alignItems: 'start',width: '100%',px: { xs: 2, md: 8 },}}>
        <Container maxWidth={false} 
          sx={{mt: 2,maxWidth: '900px', width: '100%', }}>
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
                    {presentMembers.length}
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
                  רשימת נוכחים ({presentMembers.length})
                </Typography>
                {presentMembers.length > 0 ? (
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 1.5,
                    mt: 2,
                    '@media print': {
                      pageBreakInside: 'avoid'
                    }
                  }}>
                    {presentMembers.map((person, index) => (
                      <Box key={person.id} sx={{
                        p: 1.5,
                        backgroundColor: '#e8f5e8',
                        borderRadius: 1,
                        fontSize: '0.9rem',
                        '@media print': {
                          pageBreakInside: 'avoid',
                          backgroundColor: '#f0f8f0'
                        }
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 'inherit' }}>
                          {index + 1}. {person.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
                          יישוב: {person.city}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
                          מטפל: {person.caregiver}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                    אין נוכחים היום
                  </Typography>
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
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
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