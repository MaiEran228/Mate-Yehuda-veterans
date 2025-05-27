import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import jsPDF from 'jspdf';
import 'dayjs/locale/he';
import { Card, CardContent, Typography, Button, Box, Container } from '@mui/material';
import CakeIcon from '@mui/icons-material/Cake';

dayjs.extend(isBetween);
dayjs.locale('he');

const Birthday = () => {
  const [birthdays, setBirthdays] = useState([]);

  useEffect(() => {
    const fetchBirthdays = async () => {
      const today = dayjs();
      const endOfWeek = today.add(6, 'day');
      const querySnapshot = await getDocs(collection(db, 'profiles'));
      const upcoming = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.birthDate || !data.name) return;

        const birthdate = dayjs(data.birthDate);
        const thisYearBirthday = birthdate.year(today.year());

        if (
          thisYearBirthday.isBetween(today.startOf('day'), endOfWeek.endOf('day'), null, '[]')
        ) {
          upcoming.push({
            name: data.name,
            fullBirthdate: birthdate.format('DD/MM/YYYY'),
            displayDate: birthdate.format('DD/MM'),
          });
        }
      });

      setBirthdays(upcoming);
    };

    fetchBirthdays();
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('ימי הולדת בשבוע הקרוב:', 20, 20);
    birthdays.forEach((person, index) => {
      doc.text(`${index + 1}. ${person.name} - ${person.fullBirthdate}`, 20, 30 + index * 10);
    });
    doc.save('birthday-report.pdf');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 0.5 }}>
      <Box sx={{ mb: 1 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate('Reports')}>
          חזור 
        </Button>
        <Button variant="contained" onClick={exportToPDF} sx={{ mb: 0.2, mr: 5 }}>
          ייצוא ל־PDF
        </Button>
      </Box>
      <div style={{ textAlign: 'center', marginTop: '20px', background: '#f0f8ff', minHeight: '100vh', padding: '40px' }}>
        <Typography variant="h4" gutterBottom>
          🎈 ימי הולדת בשבוע הקרוב
        </Typography>
        {birthdays.length === 0 ? (
          <Typography variant="h6">אין ימי הולדת השבוע.</Typography>
        ) : (
          <div style={{ maxWidth: '600px', margin: 'auto' }}>
            {birthdays.map((person, index) => (
              <Card key={index} variant="outlined" sx={{ margin: 2, backgroundColor: '#fff3e0' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Typography variant="h6">{person.name}</Typography>
                    <Typography color="text.secondary">תאריך לידה: {person.fullBirthdate}</Typography>
                  </div>
                  <CakeIcon color="secondary" sx={{ fontSize: 40 }} />
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