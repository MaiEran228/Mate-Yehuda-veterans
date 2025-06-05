import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import jsPDF from 'jspdf';
import 'dayjs/locale/he';
import { Card, CardContent, Typography, Button, Box, Container, Divider } from '@mui/material';
import CakeIcon from '@mui/icons-material/Cake';
import { useNavigate } from 'react-router-dom';

dayjs.extend(isBetween);
dayjs.locale('he');

const Birthday = () => {
  const [birthdays, setBirthdays] = useState([]);
  const navigate = useNavigate();

  // הגדרת רקע תכלת לכל המסך
  useEffect(() => {
    document.body.style.backgroundColor = '#ebf1f5';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    const fetchBirthdays = async () => {
      const today = dayjs();
      const currentMonth = today.month() + 1; // +1 because dayjs months are 0-based
      const querySnapshot = await getDocs(collection(db, 'profiles'));
      const monthBirthdays = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.birthDate || !data.name) return;

        const birthdate = dayjs(data.birthDate);
        const birthMonth = birthdate.month() + 1; // +1 because dayjs months are 0-based

        if (birthMonth === currentMonth) {
          monthBirthdays.push({
            name: data.name,
            fullBirthdate: birthdate.format('DD/MM/YYYY'),
            displayDate: birthdate.format('DD/MM'),
            day: birthdate.date() // הוספת יום החודש למיון
          });
        }
      });

      // מיון לפי יום בחודש
      monthBirthdays.sort((a, b) => a.day - b.day);

      setBirthdays(monthBirthdays);
    };

    fetchBirthdays();
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('ימי הולדת בחודש הנוכחי:', 20, 20);
    birthdays.forEach((person, index) => {
      doc.text(`${index + 1}. ${person.name} - ${person.fullBirthdate}`, 20, 30 + index * 10);
    });
    doc.save('birthday-report.pdf');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 0.5 }}>
      <Box sx={{ mb: 1 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate('/Reports')}>
          חזור
        </Button>
        <Button variant="contained" onClick={exportToPDF} sx={{ mb: 0.2, mr: 5 }}>
          ייצוא ל־PDF
        </Button>
      </Box>
      <div style={{ 
        textAlign: 'center', 
        marginTop: '20px', 
        minHeight: '100vh', 
        padding: '40px',
        border: '1px solid rgba(142, 172, 183, 0.3)',
        borderRadius: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        maxWidth: '1400px',
        margin: '20px auto'
      }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'rgba(64, 99, 112, 0.85)',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          mb: 2
        }}>
          רשימת ימי הולדת החודש
        </Typography>
        <Box sx={{ 
          width: '100%',
          height: '2px',
          backgroundColor: 'rgba(64, 99, 112, 0.85)',
          margin: '0 auto 32px auto',
          borderRadius: '2px'
        }} />
        {birthdays.length === 0 ? (
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>אין ימי הולדת בחודש זה.</Typography>
        ) : (
          <div style={{ 
            maxWidth: '1200px', 
            margin: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            padding: '0 20px',
            justifyContent: 'center'
          }}>
            {birthdays.map((person, index) => (
              <Card 
                key={index} 
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <CardContent sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '20px'
                }}>
                  <div style={{ textAlign: 'right', flex: 1 }}>
                    <Typography variant="h5" sx={{ 
                      color: 'rgba(64, 99, 112, 0.9)',
                      fontWeight: 'bold',
                      mb: 1
                    }}>
                      {person.name}
                    </Typography>
                    <Typography sx={{ 
                      color: 'text.secondary',
                      fontSize: '1.1rem'
                    }}>
                      תאריך לידה: {person.fullBirthdate}
                    </Typography>
                  </div>
                  <CakeIcon sx={{ 
                    fontSize: 45,
                    color: 'rgba(142, 172, 183, 0.9)',
                    ml: 3
                  }} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Birthday;