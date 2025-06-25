import React from 'react';
import { Button } from '@mui/material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { font, fontBold } from '../fonts/AlefHebrew';
import dayjs from 'dayjs';
import 'dayjs/locale/he';

dayjs.locale('he');

const PDFBirthday = ({ profilesByMonth, selectedMonth }) => {
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  const currentMonthName = hebrewMonths[Number(selectedMonth) - 1];

  // פונקציה להפיכת טקסט עברי למצב RTL נכון
  const reverseHebrewText = (text) => {
    if (!text) return text;
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(text)) return text;
    return text.split('').reverse().join('');
  };

  // פונקציה לעיבוד טקסט מעורב (עברית + מספרים)
  const processHebrewText = (text) => {
    if (!text) return text;
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(text)) return text;
    const mixedRegex = /^(\d+\.?\s*)(.+)$/;
    const match = text.match(mixedRegex);
    if (match) {
      const number = match[1];
      const hebrewPart = match[2];
      return number + reverseHebrewText(hebrewPart);
    }
    return reverseHebrewText(text);
  };

  // Base64 encoded cake icon to ensure it always renders correctly
  const cakeIconBase64 = 'data:image/png;base64,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';

  const handleExport = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    try {
      doc.addFileToVFS('AlefHebrew.ttf', font);
      doc.addFont('AlefHebrew.ttf', 'AlefHebrew', 'normal');
      doc.addFileToVFS('AlefHebrew-Bold.ttf', fontBold);
      doc.addFont('AlefHebrew-Bold.ttf', 'AlefHebrew', 'bold');
      doc.setFont('AlefHebrew', 'normal');
    } catch (error) {
      console.error('Error loading fonts:', error);
      doc.setFont('helvetica', 'normal');
    }

    // Title setup
    doc.setFont('AlefHebrew', 'bold');
    doc.setFontSize(22);
    doc.text(processHebrewText('ימי הולדת לחודש ' + currentMonthName), 105, 20, { align: 'center' });
    doc.setFont('AlefHebrew', 'normal');
    doc.setFontSize(14);
    doc.text(processHebrewText(`נכון לתאריך: ${dayjs().format('DD/MM/YYYY')}`), 105, 30, { align: 'center' });
    doc.text(processHebrewText(`סה"כ חוגגים החודש: ${profilesByMonth[selectedMonth]?.length || 0}`), 105, 38, { align: 'center' });
    
    // Card layout
    const cardsPerRow = 3;
    const cardWidth = 54;
    const cardHeight = 32;
    const marginX = 8;
    const marginY = 10;
    const startX = 15;
    let x = startX;
    let y = 50;
    let col = 0;

    const sortedMonthProfiles = (profilesByMonth[selectedMonth] || []).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    sortedMonthProfiles.forEach((profile, idx) => {
      // Draw shadow
      doc.setFillColor(220, 225, 230);
      doc.roundedRect(x + 1, y + 1, cardWidth, cardHeight, 6, 6, 'F');
      
      // Draw card background
      doc.setFillColor(235, 245, 255);
      doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'F');
      
      // Name (bold, blue), right-aligned
      doc.setFont('AlefHebrew', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(33, 102, 183);
      doc.text(processHebrewText(profile.name || ''), x + cardWidth - 6, y + 12, { align: 'right' });

      // Age and birth date (no cake icon)
      doc.setFont('AlefHebrew', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const birthDate = dayjs(profile.birthDate);
      const age = dayjs().diff(birthDate, 'year');
      doc.text(processHebrewText(`גיל: ${age}`), x + cardWidth - 6, y + 20, { align: 'right' });
      doc.text(processHebrewText(`תאריך לידה: ${birthDate.format('DD/MM/YYYY')}`), x + cardWidth - 6, y + 28, { align: 'right' });

      // Next card position
      col++;
      if (col === cardsPerRow) {
        col = 0;
        x = startX;
        y += cardHeight + marginY;
        if (y + cardHeight + marginY > 285) {
          doc.addPage();
          y = 20;
        }
      } else {
        x += cardWidth + marginX;
      }
    });

    // Footer
    doc.setFont('AlefHebrew', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(processHebrewText(`דוח נוצר ב-${dayjs().format('DD/MM/YYYY HH:mm')} | מעון יום לותיקים`), 105, 292, { align: 'center' });

    doc.save(`ימי_הולדת_חודש_${currentMonthName}.pdf`);
  };

  return (
    <Button
      variant="contained"
      onClick={handleExport}
      disableRipple
      sx={{
        backgroundColor: 'rgba(142, 172, 183, 0.72)',
        border: 'none',
        outline: 'none',
        ':hover': {
          backgroundColor: 'rgb(185, 205, 220)',
          border: 'none',
          outline: 'none'
        },
        fontWeight: 'bold',
        color: 'black',
        minWidth: '120px'
      }}
    >
      ייצוא ל-PDF
    </Button>
  );
};

export default PDFBirthday;  