import React, { useEffect, useRef, useState } from 'react';
import { fetchAttendanceByDate } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container } from '@mui/material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import ExportPDFButton from '../../components/ExportPDFButton';
import * as XLSX from 'xlsx';

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

  const absentMembers = attendanceData.attendanceList
    .filter(p => !p.attended)
    .sort((a, b) => (a.city || '').localeCompare(b.city || ''));

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
        <ExportPDFButton
          targetId="reportContent"
          fileName={`דוח היעדרויות - ${todayFormatted}.pdf`}
        />
        <Button
          variant="contained"
          color="primary"
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
            XLSX.utils.book_append_sheet(wb, ws, 'נעדרים');
            XLSX.writeFile(wb, `דוח היעדרויות - ${todayFormatted}.xlsx`);
          }}
          sx={{ ml: 8 }}
        >
          ייצוא ל־Excel
        </Button>
      </Box>

      <div id="reportContent">
        <Paper sx={{
          width: '210mm', // A4 width
          margin: '0 auto',
          p: 4,
          outline: 'none'
        }}>
          {/* כותרת */}
          <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #f44336', pb: 2 }}>
            <Typography variant="h4" color="error" gutterBottom>
              דוח היעדרויות יומי
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
              <Typography variant="body2">סה"כ נעדרים</Typography>
            </Box>
          </Box>

          {/* רשימת נעדרים */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="error" gutterBottom sx={{ borderBottom: '1px solid #f44336', pb: 1 }}>
              רשימת נעדרים ({absentMembers.length})
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
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
                      סיבת היעדרות: {person.reason || 'לא צוינה סיבה'}
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
  );
};

export default AbsencePeople;