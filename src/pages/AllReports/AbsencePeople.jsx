import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate, fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
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
      </Box>
      <Box sx={{
        position: 'absolute', left: 32, top: 90, zIndex: 10,
        '@media (max-width:600px)': {
          left: 8, top: 80 // מסכים קטנים
        }
      }}>
        <ExportPDFButton
          targetId="reportContent"
          fileName={`דוח נעדרים - ${todayFormatted}.pdf`}
        />
        <Button
          variant="contained"
          color="primary"
          disableRipple
          onClick={() => {
            const columns = ['#', 'שם', 'יישוב', 'סיבת היעדרות'];
            const excelData = absentMembers.map((person, index) => ({
              '#': index + 1,
              'שם': person.name,
              'יישוב': person.city,
              'סיבת היעדרות': person.reason || 'לא צוינה סיבה'
            }));
            const ws = XLSX.utils.json_to_sheet(excelData, { header: columns });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'חסרים');
            XLSX.writeFile(wb, `דוח חסרים - ${todayFormatted}.xlsx`);
          }}
          sx={{
            ml: 2,
            '&:focus': { outline: 'none' },
            '&:active': { outline: 'none' }
          }}
        >
          ייצוא ל-Excel
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          width: '100%',
          px: { xs: 2, md: 8 },
        }}
      >
        <Container maxWidth={false} // או false
          sx={{ mt: 2, maxWidth: '900px', width: '100%', }}>
          {attendanceData && attendanceData.attendanceList ? (
            <div id="reportContent">
              <Paper sx={{width: '210mm', margin: '0 auto',p: 4,outline: 'none'}}>
                {/* כותרת */}
                <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #f44336', pb: 2 }}>
                  <Typography variant="h4" color="error" gutterBottom>
                    דוח חסרים יומי
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    תאריך: {todayFormatted}
                  </Typography>
                </Box>

                {/* סיכום כללי */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  mb: 4,
                  p: 2,
                  backgroundColor: '#fff3f3',
                  borderRadius: 1
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="error">
                      {absentMembers.length}
                    </Typography>
                    <Typography variant="body2">סה"כ חסרים</Typography>
                  </Box>
                </Box>

                {/* רשימת נעדרים */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" color="error" gutterBottom sx={{ borderBottom: '1px solid #f44336', pb: 1 }}>
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
                          fontSize: '0.9rem'
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 'inherit' }}>
                            {index + 1}. {person.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
                            יישוב: {person.city}
                          </Typography>
                          <Typography variant="caption" color="black" sx={{ display: 'block', fontSize: '0.8rem' }}>
                            סיבת היעדרות: {person.reason || 'ללא'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                      אין חסרים להיום!
                    </Typography>
                  )}
                </Box>

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
          ) : null}
        </Container>
      </Box>
    </>
  );
};

export default AbsencePeople;