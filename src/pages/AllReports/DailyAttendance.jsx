import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, } from '@mui/material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import ExportPDFButton from '../../components/ExportPDFButton'; // ודאי שהנתיב נכון


const DailyAttendance = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  const today = dayjs().format('YYYY-MM-DD');
  const todayFormatted = dayjs().format('DD/MM/YYYY');
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;

  const handleBack = () => {
    if (from === 'home') {
      navigate('/'); // למסך הבית
    } else {
      navigate('/Reports'); // לעמוד הדוחות הראשי
    }
  };

  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      const data = await fetchAttendanceByDate(today);
      setAttendanceData(data);
      setLoading(false);
    };

    loadAttendance();
  }, [today]);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `דו"ח נוכחות - ${todayFormatted}`,
  });

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (!attendanceData || !attendanceData.attendanceList) {
    return (
      <Typography variant="body1">
        אין נתוני נוכחות להיום ({todayFormatted})
      </Typography>
    );
  }

  const presentMembers = attendanceData.attendanceList.filter(p => p.attended);
  const absentMembers = attendanceData.attendanceList.filter(p => !p.attended);


  return (
    <Container maxWidth="lg" sx={{ mt: 0.5 }}>

      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" color="primary" onClick={handleBack} sx={{ ml:2 }}>
          חזור
        </Button>

        <ExportPDFButton targetId="reportContent" fileName={`דוח נוכחות - ${todayFormatted}.pdf`} />
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
                {attendanceData.attendanceList.length}
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
                    <Typography variant="caption" color="textSecondary">
                      {person.city} | מטפל: {person.caregiver}
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
                    <Typography variant="caption" color="textSecondary">
                      {person.city} | מטפל: {person.caregiver}
                    </Typography>
                    {person.reason && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                        סיבה: {person.reason}
                      </Typography>
                    )}
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

    </Container>
  );
};

export default DailyAttendance;
