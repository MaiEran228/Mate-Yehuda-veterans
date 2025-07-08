import React, { useEffect, useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BarChartIcon from '@mui/icons-material/BarChart';
import EventIcon from '@mui/icons-material/Event';
import CakeIcon from '@mui/icons-material/Cake';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TimelineIcon from '@mui/icons-material/Timeline';
import { PieChart } from '@mui/x-charts/PieChart';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { BarChart } from '@mui/x-charts/BarChart';
import DailyDiagrams from '../../components/ReportsCompo/DailyDiagrams';
import Tooltip from '@mui/material/Tooltip';

const reports = [
  { name: 'דו"ח נוכחות יומי', path: '/AllReports/DailyAttendance', row: 1 },
  { name: 'דו"ח חסרים יומי', path: '/AllReports/AbsencePeople', row: 1 },
  { name: 'דו"ח נוכחות חודשי', path: '/AllReports/MonthlyAttendance', row: 1 },
  { name: 'ימי הולדת החודש', path: '/AllReports/Birthday', row: 1 },
  { name: 'חישוב זכאות לפי ימי השבוע', path: '/AllReports/DaysLeft', row: 2 },
];

const Reports = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProfiles(data);
      setLoadingProfiles(false);
    });
    return () => unsubscribe();
  }, []);

  const row1Reports = reports.filter(report => report.row === 1);
  const row2Reports = reports.filter(report => report.row === 2);

  // חישוב התפלגות מטפל/ללא מטפל לפי hasCaregiver
  const withCaregiver = profiles.filter(p => p.hasCaregiver === true).length;
  const withoutCaregiver = profiles.filter(p => p.hasCaregiver !== true).length;
  const caregiverPieData = [
    { id: 0, value: withCaregiver, label: '', displayLabel: 'עם מטפל', color: '#AEDFF7' },
    { id: 1, value: withoutCaregiver, label: '', displayLabel: 'ללא מטפל', color: '#FFB3B3' },
  ];

  // חישוב התפלגות סוגי הסעות
  const transportTypes = ['מונית', 'מיניבוס', 'פרטי', 'אחר'];
  const transportCounts = transportTypes.map(type =>
    profiles.filter(p => (p.transport || 'אחר') === type).length
  );
  const transportPieData = transportTypes.map((type, idx) => ({
    id: idx,
    value: transportCounts[idx],
    label: type,
    color: ['#FFD180', '#B2EBF2', '#C8E6C9', '#D1C4E9'][idx],
  }));

  // חישוב התפלגות ימי הגעה (שמות מלאים)
  const weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
  const arrivalCounts = weekDays.map(dayName =>
    profiles.filter(p => Array.isArray(p.arrivalDays) && p.arrivalDays.includes(dayName)).length
  );
  // הכנה לדיאגרמת עוגה של ימי הגעה
  const arrivalPieData = weekDays.map((day, idx) => ({
    id: idx,
    value: arrivalCounts[idx],
    label: day,
    color: ['#90caf9', '#FFD180', '#C8E6C9', '#B2EBF2', '#D1C4E9'][idx],
  }));

  // חישוב ניצולי שואה
  const holocaustSurvivors = profiles.filter(p => p.isHolocaustSurvivor === true).length;
  const notHolocaustSurvivors = profiles.filter(p => p.isHolocaustSurvivor !== true).length;

  // נתונים לדיאגרמת עוגה של ניצולי שואה
  const holocaustPieData = [
    { id: 0, value: holocaustSurvivors, label: 'ניצול שואה', color: '#A5D6A7' },
    { id: 1, value: notHolocaustSurvivors, label: 'לא ניצול', color: '#81D4FA' },
  ];

  const reportIcons = [
    <EventIcon sx={{ mr: 1 }} />, // דוח נוכחות יומי
    <BarChartIcon sx={{ mr: 1 }} />, // דוח חסרים יומי
    <CalendarMonthIcon sx={{ mr: 1 }} />, // דוח נוכחות חודשי
    <CakeIcon sx={{ mr: 1 }} />, // ימי הולדת החודש
    <TimelineIcon sx={{ mr: 1 }} />, // חישוב זכאות לפי ימי השבוע
  ];

  return (
    <Box
      dir="rtl"
      sx={{
        bgcolor: '#ebf1f5',
        overflowX: 'hidden',
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        mr: 10,
      }}
    >

      {/* תוכן ראשי */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          pt: 5,
          alignItems: 'center',
          maxWidth: '1000px',
          mx: 'auto',
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 3,
            color: 'rgba(64, 99, 112, 0.85)',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            fontSize: { xs: '1.5rem', sm: '2rem' },
          }}
        >
          בחר/י דוח להצגה
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap', mt: 2 }}>
          {[...row1Reports, ...row2Reports].map((report, index) => (
            <Button key={index} variant="contained" onClick={() => navigate(report.path)}
              sx={{
                width: { xs: '120px', sm: '170px' },
                height: { xs: '150px', sm: '200px' },
                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                borderRadius: 3,
                backgroundColor: '#fff',
                color: 'black',
                fontWeight: 'bold',
                border: '3px solid #406370',
                boxShadow: '0 6px 24px 0 rgba(64,99,112,0.18)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, box-shadow 0.2s',
                '&:hover': {
                  backgroundColor: '#f0f4f8',
                  border: '3px solid #406370',
                  boxShadow: '0 8px 32px 0 rgba(64,99,112,0.22)',
                  transform: 'translateY(-2px)',
                },
                '&:focus': {
                  outline: 'none',
                  border: '3px solid #406370',
                  boxShadow: '0 6px 24px 0 rgba(64,99,112,0.18)',
                },
                '&:active': {
                  outline: 'none',
                  border: '3px solid #406370',
                  boxShadow: '0 6px 24px 0 rgba(64,99,112,0.18)',
                },
              }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{report.name}</span>
              <span style={{ marginTop: 12, display: 'block' }}>{reportIcons[index]}</span>
            </Button>
          ))}
        </Box>
        {/* התפלגויות - מוצג מיד אחרי כפתורי הדוחות */}
        <Box
          id="distributions-section"
          sx={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            pt: 2,
            mt: 0,
            alignItems: 'center',
            px: 2,
            maxWidth: '1000px',
            mx: 'auto',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: 'rgba(64, 99, 112, 0.85)',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              fontSize: { xs: '5rem', sm: '2.5rem' },
              mb: 0,
              mt: 0,
            }}
          >
            התפלגויות ונתונים
          </Typography>
          <DailyDiagrams />
          {loadingProfiles ? (
            <Typography>טוען נתונים...</Typography>
          ) : caregiverPieData[0].value + caregiverPieData[1].value === 0 ? (
            <Typography>אין נתונים להצגה.</Typography>
          ) : (
            <>
              <Box sx={{
                  border: '2px solid #b7c9d6',
                  borderRadius: 4,
                  p: 0,
                  mt: 0,
                  bgcolor: '#ebf1f5',
                  maxWidth: '1000px',
                  mx: 'auto',
                  overflow: 'hidden',
              }}>
                  <Box sx={{
                      bgcolor: 'rgb(220, 228, 232)',
                      width: '100%',
                      borderTopRightRadius: 4,
                      borderTopLeftRadius: 4,
                      py: 1.5,
                      px: 2,
                      mb: 0,
                  }}>
                      <Typography variant="h6" sx={{ textAlign: 'center', color: '#406370', fontWeight: 700 }}>
                          התפלגויות כלליות
                      </Typography>
                  </Box>
                  <Box sx={{ p: 4 }}>
                      {/*שורה ראשונה של דיאגרמות*/}
                      <Box sx={{
                          mt: 1,
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 4,
                      }}>
                          <Box sx={{ display: 'flex', gap: 4 }}>
                              {/* קופסה עם הדיאגרמת מטפל והמקרא מימין */}
                              <Box sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  border: '1.5px solid #b7c9d6',
                                  boxShadow: '0 2px 8px rgba(64,99,112,0.07)',
                                  borderRadius: 3,
                                  padding: 2,
                                  width: 410,
                                  bgcolor: '#f0f4f8',
                              }}>
                                  <Typography variant="h7" sx={{ mb: 2, color: '#406370', fontWeight: 600 }}>
                                      מטפל / ללא מטפל  
                                  </Typography>
                                  <Box sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 3,
                                      flexWrap: 'nowrap',
                                      width: '100%',
                                  }}>
                                      {/* מקרא */}
                                      <Box sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'flex-start',
                                          justifyContent: 'center',
                                          minWidth: 130,
                                      }}>
                                          {caregiverPieData.map((item) => (
                                              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                  <Box sx={{
                                                      width: 18,
                                                      height: 18,
                                                      borderRadius: '50%',
                                                      bgcolor: item.color,
                                                      mr: 1,
                                                      border: '1px solid #ccc',
                                                  }} />
                                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                      {item.displayLabel}: {item.value}
                                                  </Typography>
                                              </Box>
                                          ))}
                                      </Box>
                                      {/* עוגת התפלגות */}
                                      <PieChart
                                          series={[{
                                              data: caregiverPieData.map(item => ({ ...item, label: '' })),
                                              arcLabel: (item) => {
                                                  const total = withCaregiver + withoutCaregiver;
                                                  return total ? `${((item.value / total) * 100).toFixed(1)}%` : '';
                                              },
                                              arcLabelMinAngle: 10,
                                              arcLabelRadius: '80%',
                                          }]}
                                          width={280}
                                          height={220}
                                          legend={{ hidden: true }}
                                          slots={{ legend: null }}
                                          sx={{
                                              [`& .MuiPieArcLabel-root`]: {
                                                  fontSize: 14,
                                                  fontWeight: 600,
                                              },
                                              '& .MuiChartsLegend-root': { display: 'none !important' },
                                          }}
                                      />
                                  </Box>
                              </Box>
                              {/* דיאגרמת סוגי הסעות */}
                              <Box sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  border: '1.5px solid #b7c9d6',
                                  boxShadow: '0 2px 8px rgba(64,99,112,0.07)',
                                  borderRadius: 3,
                                  padding: 2,
                                  width: 410,
                                  bgcolor: '#f0f4f8',
                              }}>
                                  <Typography variant="h7" sx={{ mb: 2, color: '#406370', fontWeight: 600 }}>
                                      סוגי הסעות
                                  </Typography>
                                  <Box sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 3,
                                      flexWrap: 'nowrap',
                                      width: '100%',
                                  }}>
                                      {/* מקרא */}
                                      <Box sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'flex-start',
                                          justifyContent: 'center',
                                          minWidth: 130,
                                      }}>
                                          {transportPieData.map((item) => (
                                              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: item.color, mr: 1, border: '1px solid #ccc' }} />
                                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                      {item.label}: {item.value}
                                                  </Typography>
                                              </Box>
                                          ))}
                                      </Box>
                                      <PieChart
                                          series={[{
                                              data: transportPieData.map(item => ({ ...item, label: '' })),
                                              arcLabel: (item) => {
                                                  const total = transportPieData.reduce((sum, t) => sum + t.value, 0);
                                                  return total ? `${((item.value / total) * 100).toFixed(1)}%` : '';
                                              },
                                              arcLabelMinAngle: 10,
                                              arcLabelRadius: '80%',
                                          }]}
                                          width={280}
                                          height={220}
                                          legend={{ hidden: true }}
                                          sx={{
                                              [`& .MuiPieArcLabel-root`]: {
                                                  fontSize: 14,
                                                  fontWeight: 600,
                                              },
                                              '& .MuiChartsLegend-root': { display: 'none !important' },
                                          }}
                                      />
                                  </Box>
                              </Box>
                          </Box>
                      </Box>
                      {/* דיאגרמת עוגה ימי הגעה + דיאגרמת עוגה ניצולי שואה */}
                      <Box sx={{
                          mt: 6,
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 4,
                      }}>
                          {/* דיאגרמת עוגה ימי הגעה */}
                          <Box sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              border: '1.5px solid #b7c9d6',
                              borderRadius: 3,
                              boxShadow: '0 2px 8px rgba(64,99,112,0.07)',
                              p: 2,
                              width: 420,
                              mx: 0,
                              bgcolor: '#f0f4f8',
                          }}>
                              <Typography variant="h6" sx={{ mb: 2, color: '#406370', fontWeight: 600 }}>
                                  ימי הגעה
                              </Typography>
                              <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 3,
                                  flexWrap: 'nowrap',
                                  width: '100%',
                              }}>
                                  {/* מקרא מימין */}
                                  <Box sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-start',
                                      justifyContent: 'center',
                                      minWidth: 130,
                                  }}>
                                      {arrivalPieData.map((item) => (
                                          <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                              <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: item.color, mr: 1, border: '1px solid #ccc' }} />
                                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                  {item.label}: {item.value}
                                              </Typography>
                                          </Box>
                                      ))}
                                  </Box>
                                  <PieChart
                                      series={[{
                                          data: arrivalPieData.map(item => ({ ...item, label: '' })),
                                          arcLabel: (item) => {
                                              const total = arrivalPieData.reduce((sum, t) => sum + t.value, 0);
                                              return total ? `${((item.value / total) * 100).toFixed(1)}%` : '';
                                          },
                                          arcLabelMinAngle: 10,
                                          arcLabelRadius: '80%',
                                      }]}
                                      width={280}
                                      height={220}
                                      legend={{ hidden: true }}
                                      sx={{
                                          [`& .MuiPieArcLabel-root`]: {
                                              fontSize: 14,
                                              fontWeight: 600,
                                          },
                                          '& .MuiChartsLegend-root': { display: 'none !important' },
                                      }}
                                  />
                              </Box>
                          </Box>
                          {/* דיאגרמת עוגה ניצולי שואה */}
                          <Box sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              border: '1.5px solid #b7c9d6',
                              borderRadius: 3,
                              boxShadow: '0 2px 8px rgba(64,99,112,0.07)',
                              p: 2,
                              width: 410,
                              mx: 0,
                              bgcolor: '#f0f4f8',
                          }}>
                              <Typography variant="h6" sx={{ mb: 2, color: '#406370', fontWeight: 600 }}>
                                  ניצולי שואה
                              </Typography>
                              <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 3,
                                  flexWrap: 'nowrap',
                                  width: '100%',
                              }}>
                                  {/* מקרא מימין */}
                                  <Box sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-start',
                                      justifyContent: 'center',
                                      minWidth: 130,
                                  }}>
                                      {holocaustPieData.map((item) => (
                                          <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                              <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: item.color, mr: 1, border: '1px solid #ccc' }} />
                                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                  {item.label}: {item.value}
                                              </Typography>
                                          </Box>
                                      ))}
                                  </Box>
                                  <PieChart
                                      series={[{
                                          data: holocaustPieData.map(item => ({ ...item, label: '' })),
                                          arcLabel: (item) => {
                                              const total = holocaustSurvivors + notHolocaustSurvivors;
                                              return total ? `${((item.value / total) * 100).toFixed(1)}%` : '';
                                          },
                                          arcLabelMinAngle: 10,
                                          arcLabelRadius: '80%',
                                      }]}
                                      width={280}
                                      height={220}
                                      legend={{ hidden: true }}
                                      sx={{
                                          [`& .MuiPieArcLabel-root`]: {
                                              fontSize: 14,
                                              fontWeight: 600,
                                          },
                                          '& .MuiChartsLegend-root': { display: 'none !important' },
                                      }}
                                  />
                              </Box>
                          </Box>
                      </Box>
                  </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
      {/* כפתור עגול צף בפינה הימנית התחתונה */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
        }}
      >
        <Tooltip title="צפיה בהתפלגויות" placement="top">
          <Button
            variant="contained"
            onClick={() => {
              const el = document.getElementById('distributions-section');
              if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 40;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            sx={{
              minWidth: 0,
              width: 64,
              height: 64,
              borderRadius: '50%',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              backgroundColor: 'rgba(142, 172, 183, 0.72)',
              color: 'black',
              fontWeight: 'bold',
              boxShadow: '0 6px 24px 0 rgba(64,99,112,0.18)',
              '&:hover': {
                backgroundColor: 'rgba(142, 172, 183, 0.85)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 32px 0 rgba(64,99,112,0.22)'
              },
              '&:focus': {
                outline: 'none',
              },
              '&:active': {
                outline: 'none',
                boxShadow: 'none',
                transform: 'translateY(0px)',
              },
            }}
          >
            <BarChartIcon sx={{ fontSize: 38 }} />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Reports;