import React, { useEffect } from 'react';
import { Button, Typography, Grid, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const reports = [
  { name: 'דו"ח נוכחות יומי', path: '/AllReports/DailyAttendance' },
  { name: 'דו"ח היעדרויות יומי', path: '/AllReports/AbsencePeople' },
  { name: 'ימי הולדת החודש', path: '/AllReports/Birthday' },
  { name: 'דו"ח נוכחות חודשי', path: '/AllReports/MonthlyAttendance' },
  { name: 'חישוב זכאות לפי ימי השבוע', path: '/AllReports/DaysLeft' },
];

const Reports = () => {
  const navigate = useNavigate();

  // הגדרת רקע תכלת לכל המסך
  useEffect(() => {
    document.body.style.backgroundColor = '#ebf1f5';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <Box sx={{ 
      textAlign: 'center', 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      width: '100%'
    }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb:12 ,
          color: 'rgba(64, 99, 112, 0.85)',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        בחר/י דוח להצגה
      </Typography>

      <Grid
        container
        spacing={4}
        justifyContent="center"
        alignItems="center"
        sx={{ 
          mt: 4, 
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}
      >
        {reports.map((report, index) => (
          <Grid item key={index} xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate(report.path)}
              sx={{
                width: '200px',
                height: 100,
                fontSize: '1.2rem',
                borderRadius: 3,
                backgroundColor: 'rgba(142, 172, 183, 0.72)',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'rgba(142, 172, 183, 0.85)'
                },
                '&:focus': {
                  outline: 'none'
                },
                '&:active': {
                  outline: 'none'
                }
              }}
            >
              {report.name}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Reports;