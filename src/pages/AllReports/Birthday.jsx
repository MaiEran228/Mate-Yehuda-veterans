import React, { useEffect, useState } from 'react';
import { fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { useLocation, useNavigate } from 'react-router-dom';
import ExportPDFButton from '../../components/ExportPDFButton';
import CakeIcon from '@mui/icons-material/Cake';

// הגדרת השפה העברית
dayjs.locale('he');

const Birthday = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const todayFormatted = dayjs().format('DD/MM/YYYY');

  const handleBack = () => {
    if (from === 'home') {
      navigate('/');
    } else {
      navigate('/Reports');
    }
  };

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      const data = await fetchAllProfiles();
      setProfiles(data);
      setLoading(false);
    };

    loadProfiles();
  }, []);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  // מיון הפרופילים לפי חודש ויום
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (!a.birthDate || !b.birthDate) return 0;
    const dateA = dayjs(a.birthDate);
    const dateB = dayjs(b.birthDate);
    return dateA.month() - dateB.month() || dateA.date() - dateB.date();
  });

  // ארגון הפרופילים לפי חודשים
  const profilesByMonth = sortedProfiles.reduce((acc, profile) => {
    if (profile.birthDate) {
      const birthDate = dayjs(profile.birthDate);
      const monthKey = birthDate.format('M');
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(profile);
    }
    return acc;
  }, {});

  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 0.5 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
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
          fileName={`דוח ימי הולדת - ${todayFormatted}.pdf`}
        />
      </Box>

      <div id="reportContent" dir="rtl">
        <Paper sx={{
          width: '210mm',
          margin: '0 auto',
          p: 4,
          outline: 'none'
        }}>
          {/* כותרת */}
          <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              דוח ימי הולדת שנתי
            </Typography>
            <Typography variant="h6" color="textSecondary">
              נוצר בתאריך: {todayFormatted}
            </Typography>
          </Box>

          {/* סיכום */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-around',
            mb: 4,
            p: 2,
            backgroundColor: '#e3f2fd',
            borderRadius: 1
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {profiles.filter(p => p.birthDate).length}
              </Typography>
              <Typography variant="body2">סה"כ ימי הולדת</Typography>
            </Box>
          </Box>

          {/* רשימת ימי הולדת לפי חודשים */}
          {Object.entries(profilesByMonth)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([monthNum, monthProfiles]) => (
              <Box 
                key={monthNum} 
                sx={{ 
                  mb: 4,
                  '@media print': {
                    pageBreakInside: 'avoid'
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  color="primary" 
                  gutterBottom 
                  sx={{ 
                    borderBottom: '1px solid #1976d2',
                    pb: 1,
                    mb: 2
                  }}
                >
                  {hebrewMonths[Number(monthNum) - 1]} ({monthProfiles.length})
                </Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 2
                }}>
                  {monthProfiles.map((profile) => (
                    <Paper
                      key={profile.id}
                      elevation={1}
                      sx={{
                        p: 2,
                        backgroundColor: '#e3f2fd',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <CakeIcon sx={{ color: '#1976d2', fontSize: 32 }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                          {profile.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          תאריך: {dayjs(profile.birthDate).format('DD/MM')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          יישוב: {profile.city || 'לא צוין'}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            ))}

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

export default Birthday;