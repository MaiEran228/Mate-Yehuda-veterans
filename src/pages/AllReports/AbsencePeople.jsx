import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container } from '@mui/material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import ExportPDFButton from '../../components/ExportPDFButton';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const AbsencePeople = () => {
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
      navigate('/');
    } else {
      navigate('/Reports');
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

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (!attendanceData || !attendanceData.attendanceList) {
    return (
      <Typography variant="body1">
        אין נתוני היעדרויות להיום ({todayFormatted})
      </Typography>
    );
  }

  const absentMembers = attendanceData.attendanceList.filter(p => !p.attended);

  return (
    <Container maxWidth="lg" sx={{ mt: 0.5 }}>
      <Box sx={{ mb: 2 }}>
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
              pdf.save(`דוח היעדרויות - ${todayFormatted}.pdf`);
            });
          }}
          sx={{
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
      </Box>

      <div id="reportContent">
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
              דוח היעדרויות יומי
            </Typography>
            <Typography variant="h6" color="textSecondary">
              תאריך: {todayFormatted}
            </Typography>
          </Box>

          {/* רשימת נעדרים */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="error.main" >
              רשימת נעדרים (סה"כ: {absentMembers.length})
            </Typography>
            {absentMembers.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, mt: 2 }}>
                {absentMembers.map((person, index) => (
                  <Box key={person.id} sx={{ p: 1, backgroundColor: '#ffebee', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>{index + 1}. {person.name}</strong>
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      יישוב: {person.city} {person.reason && `| סיבת היעדרות: ${person.reason}`}
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
    </Container>
  );
};

export default AbsencePeople;