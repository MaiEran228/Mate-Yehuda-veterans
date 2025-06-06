import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import ExportPDFButton from '../../components/ExportPDFButton'; // ודאי שהנתיב נכון
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
    return null;
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
    <Container maxWidth="lg" sx={{ mt: 0.5 }}>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleBack} 
          sx={{
            ml: 2,
            '&:focus': {
              outline: 'none'
            },
            '&:active': {
              outline: 'none'
            }
          }}
        >
          חזור
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            const input = document.getElementById('reportContent');
            html2canvas(input).then(canvas => {
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const imgProps = pdf.getImageProperties(imgData);
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              pdf.save(`דוח נוכחות - ${todayFormatted}.pdf`);
            });
          }}
          sx={{
            ml: 2,
            '&:focus': {
              outline: 'none'
            },
            '&:active': {
              outline: 'none'
            }
          }}
        >
          ייצוא ל־PDF
        </Button>

        <TextField
          label="בחר תאריך"
          type="date"
          size="small"
          value={inputDate}
          onChange={e => setInputDate(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setSelectedDate(inputDate);
            }
          }}
          sx={{ ml: 2, minWidth: 140 }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <div id="reportContent">{/* תוכן הדוח להדפסה */}
        <Paper sx={{
          width: '900px',
          maxWidth: '800px',
          maxHeight: '90%',
          overflow: 'auto',
          p: 4,
          outline: 'none'
        }}>

          {/* כותרת */}
          <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              דוח נוכחות יומי
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
            backgroundColor: '#f5f5f5',
            borderRadius: 1
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
              <Typography variant="body2">נעדרים</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {dataToShow.attendanceList.length}
              </Typography>
              <Typography variant="body2">סה"כ</Typography>
            </Box>
          </Box>

          {/* רשימת נוכחים */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="success.main" gutterBottom sx={{ borderBottom: '1px solid #4caf50', pb: 1 }}>
              רשימת נוכחים ({presentMembers.length})
            </Typography>
            {presentMembers.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 1, mt: 2 }}>
                {presentMembers.map((person, index) => (
                  <Box key={person.id} sx={{ p: 1, backgroundColor: '#e8f5e8', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>{index + 1}. {person.name}</strong>
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      יישוב: {person.city}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0, display: 'block' }}>
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
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="error.main" gutterBottom sx={{ borderBottom: '1px solid #f44336', pb: 1 }}>
              רשימת נעדרים ({absentMembers.length})
            </Typography>
            {absentMembers.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, mt: 2 }}>
                {absentMembers.map((person, index) => (
                  <Box key={person.id} sx={{ p: 1, backgroundColor: '#ffebee', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>{index + 1}. {person.name}</strong>
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      יישוב: {person.city}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0, display: 'block' }}>
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
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              דוח נוצר ב-{dayjs().format('DD/MM/YYYY HH:mm')} | מעון יום לותיקים
            </Typography>
          </Box>


        </Paper>
      </div>

      <Dialog open={openNoData} onClose={() => setOpenNoData(false)}
        PaperProps={{ sx: { minWidth: 340, border: '1px solid #e0e0e0', boxShadow: 6 } }}
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
            onClick={() => setOpenNoData(false)}
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

    </Container>
  );
};

export default DailyAttendance;