import React from 'react';
import PDFAbsencePeople from './PDFAbsencePeople';
import dayjs from 'dayjs';

const PDFDaysLeft = ({ people, selectedMonth }) => {
  // מיון א"ב
  const sortedPeople = [...people].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const todayFormatted = dayjs().format('DD/MM/YYYY');
  const monthFormatted = dayjs(selectedMonth).format('MM/YYYY');

  // עמודות PDF
  const pdfColumns = [
    { key: 'missedAfterPenalty', header: 'מימי הגעה היעדרות', defaultValue: 0, formatter: v => (v === 0 ? '0' : (v || '0')) },
    { key: 'remaining', header: 'החודש יתרת ימי זכאות', defaultValue: 0, formatter: v => (v === 0 ? '0' : (v || '0')) },
    { key: 'attendedCount', header: 'שנוצלו ימים', defaultValue: 0, formatter: v => (v === 0 ? '0' : (v || '0')) },
    { key: 'eligible', header: 'החודש סה"כ ימי זכאות', defaultValue: 0, formatter: v => (v === 0 ? '0' : (v || '0')) },
    { key: 'name', header: 'שם', defaultValue: '' },
  ];

  // ניקוי שם מתווים בעייתיים
  const cleanName = (name) =>
    (name || '')
      .replace(/[\n\r\t\f\v]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '');

  // דאטה ל-PDF
  const pdfData = sortedPeople.map((person, idx) => ({
    name: cleanName(person.name),
    eligible: typeof person.eligible === 'number' ? person.eligible : 0,
    attendedCount: typeof person.attendedCount === 'number' ? person.attendedCount : 0,
    remaining: typeof person.remaining === 'number' ? person.remaining : 0,
    missedAfterPenalty: typeof person.missedAfterPenalty === 'number' ? person.missedAfterPenalty : 0,
  }));

  // הגדרות PDF
  const pdfConfig = {
    title: 'דוח יתרת ימי זכאות',
    subtitle: `חודש: ${monthFormatted}`,
    headerInfo: [
      `נוצר בתאריך: ${todayFormatted}`
    ],
    customStyles: {
      styles: {
        fontSize: 11,
        cellPadding: 6,
        font: 'AlefHebrew',
        halign: 'center',
      },
      headStyles: {
        fillColor: [180, 180, 180],
        fontSize: 12,
        font: 'AlefHebrew',
        halign: 'center',
      }
    }
  };

  return (
    <PDFAbsencePeople
      data={pdfData}
      columns={pdfColumns}
      fileName={`דוח_יתרת_ימי_זכאות_${monthFormatted}.pdf`}
      title={pdfConfig.title}
      subtitle={pdfConfig.subtitle}
      headerInfo={pdfConfig.headerInfo}
      customStyles={pdfConfig.customStyles}
      buttonText="ייצא ל-PDF"
      buttonProps={{
        disableRipple: true,
        sx: {
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
          '&:focus': {
            border: 'none',
            outline: 'none'
          },
          '&:active': {
            border: 'none',
            outline: 'none'
          },
          minWidth: '120px',
        }
      }}
    />
  );
};

export default PDFDaysLeft; 