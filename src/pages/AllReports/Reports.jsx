import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const reports = [
  { name: 'דו"ח נוכחות יומי', path: '/AllReports/DailyAttendance', row: 1 },
  { name: 'דו"ח היעדרויות יומי', path: '/AllReports/AbsencePeople', row: 1 },
  { name: 'ימי הולדת החודש', path: '/AllReports/Birthday', row: 1 },
  { name: 'דו"ח נוכחות חודשי', path: '/AllReports/MonthlyAttendance', row: 2 },
  { name: 'חישוב זכאות לפי ימי השבוע', path: '/AllReports/DaysLeft', row: 2 },
];

const Reports = () => {
  const navigate = useNavigate();

  const row1Reports = reports.filter(report => report.row === 1);
  const row2Reports = reports.filter(report => report.row === 2);

  return (
    <Box sx={{
      height: '100vh',
      overflow: 'auto',
      bgcolor: '#ebf1f5',
    }}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '1000px',
        bgcolor: 'transparent',
        padding: '20px',
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 4,
            color: 'rgba(64, 99, 112, 0.85)',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '2rem' },
          }}
        >
          בחר/י דוח להצגה
        </Typography>

        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, sm: 3 },
          alignItems: 'center',
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 2, sm: 3 },
            flexWrap: 'wrap',
          }}>
            {row1Reports.map((report, index) => (
              <Button
                key={index}
                variant="contained"
                onClick={() => navigate(report.path)}
                sx={{
                  width: { xs: '180px', sm: '220px' },
                  height: { xs: '80px', sm: '90px' },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  borderRadius: 3,
                  backgroundColor: 'rgba(142, 172, 183, 0.72)',
                  color: 'black',
                  fontWeight: 'bold',
                  whiteSpace: 'pre-wrap',
                  padding: { xs: '8px', sm: '10px' },
                  '&:hover': {
                    backgroundColor: 'rgba(142, 172, 183, 0.85)'
                  }
                }}
              >
                {report.name}
              </Button>
            ))}
          </Box>

          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 2, sm: 3 },
            flexWrap: 'wrap',
          }}>
            {row2Reports.map((report, index) => (
              <Button
                key={index}
                variant="contained"
                onClick={() => navigate(report.path)}
                sx={{
                  width: { xs: '180px', sm: '220px' },
                  height: { xs: '80px', sm: '90px' },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  borderRadius: 3,
                  backgroundColor: 'rgba(142, 172, 183, 0.72)',
                  color: 'black',
                  fontWeight: 'bold',
                  whiteSpace: 'pre-wrap',
                  padding: { xs: '8px', sm: '10px' },
                  '&:hover': {
                    backgroundColor: 'rgba(142, 172, 183, 0.85)'
                  }
                }}
              >
                {report.name}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Reports;