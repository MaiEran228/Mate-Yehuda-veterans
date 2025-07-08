import React from 'react';
import PDFAbsencePeople from './PDFAbsencePeople';
import dayjs from 'dayjs';

const PDFDaysLeft = ({ people, selectedMonth }) => {
  // Alphabetical sort
  const sortedPeople = [...people].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const todayFormatted = dayjs().format('DD/MM/YYYY');
  const monthFormatted = dayjs(selectedMonth).format('MM/YYYY');

  // PDF columns
  const pdfColumns = [
    { key: 'missedAfterPenalty', header: 'Missed after penalty', defaultValue: 0, formatter: v => (v === 0 ? '0' : (v || '0')) },
    { key: 'remaining', header: 'Remaining days of eligibility', defaultValue: 0, formatter: v => (v === 0 ? '0' : (v || '0')) },
    { key: 'attendedCount', header: 'Days used', defaultValue: 0, formatter: v => (v === 0 ? '0' : (v || '0')) },
    { key: 'eligible', header: 'Total days of eligibility', defaultValue: 0, formatter: v => (v === 0 ? '0' : (v || '0')) },
    { key: 'name', header: 'Name', defaultValue: '' },
  ];

  // Clean name from problematic characters
  const cleanName = (name) =>
    (name || '')
      .replace(/[\n\r\t\f\v]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '');

  // Data for PDF
  const pdfData = sortedPeople.map((person, idx) => ({
    name: cleanName(person.name),
    eligible: typeof person.eligible === 'number' ? person.eligible : 0,
    attendedCount: typeof person.attendedCount === 'number' ? person.attendedCount : 0,
    remaining: typeof person.remaining === 'number' ? person.remaining : 0,
    missedAfterPenalty: typeof person.missedAfterPenalty === 'number' ? person.missedAfterPenalty : 0,
  }));

  // PDF settings
  const pdfConfig = {
    title: 'Remaining days of eligibility',
    subtitle: `Month: ${monthFormatted}`,
    headerInfo: [
      `Created on: ${todayFormatted}`
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
      fileName={`Remaining_days_of_eligibility_${monthFormatted}.pdf`}
      title={pdfConfig.title}
      subtitle={pdfConfig.subtitle}
      headerInfo={pdfConfig.headerInfo}
      customStyles={pdfConfig.customStyles}
      buttonText="Export to PDF"
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