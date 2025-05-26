import React from 'react';
import { Button, Typography, Grid, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const reports = [
  { name: 'דו"ח נוכחות יומי', path: '/AllReports/DailyAttendance' },
  { name: 'דו"ח היעדרויות יומי', path: '/AllReports/AbsencePeople' },
  { name: 'ימי הולדת השבוע', path: '/AllReports/Birthday' },
  { name: 'דו"ח נוכחות חודשי', path: '/AllReports/MonthlyAttendance' },
  { name: 'חישוב זכאות לפי ימי השבוע', path: '/AllReports/DaysLeft' },
];

const Reports = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: 'center', mt: 6 }}>
      

      <Grid
        container
        spacing={4}
        justifyContent="center"
        alignItems="center"
        sx={{ mt: 4 }}
      >
        {reports.map((report, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              onClick={() => navigate(report.path)}
              sx={{
                width: '200px',
                height: 100,
                fontSize: '1.2rem',
                borderRadius: 3,
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