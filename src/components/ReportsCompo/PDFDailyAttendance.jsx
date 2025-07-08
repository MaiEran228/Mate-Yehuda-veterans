import React from 'react';
import PDFAbsencePeople from './PDFAbsencePeople';
import dayjs from 'dayjs';

const DailyAttendancePDF = ({ attendanceData, profiles, reportDate: reportDateProp }) => {
  // Set the day of the week in Hebrew
  const reportDate = attendanceData?.date || reportDateProp || dayjs().format('YYYY-MM-DD');
  const todayWeekday = dayjs(reportDate).format('dddd');
  const todayFormatted = dayjs(reportDate).format('DD/MM/YYYY');

  // Helper function to find a participant's arrivalDays
  const getProfileArrivalDays = (person) => {
    const profile = profiles.find(p => p.id === person.id || p.name === person.name);
    return profile && Array.isArray(profile.arrivalDays) ? profile.arrivalDays : [];
  };

  // Present who were supposed to arrive today (green)
  const presentExpected = attendanceData.attendanceList.filter(p => {
    if (!p.attended) return false;
    const arrivalDays = getProfileArrivalDays(p);
    return arrivalDays.includes(todayWeekday);
  });

  // Present who arrived on a day they were not supposed to (blue)
  const presentNotExpected = attendanceData.attendanceList.filter(p => {
    if (!p.attended) return false;
    const arrivalDays = getProfileArrivalDays(p);
    return !arrivalDays.includes(todayWeekday);
  });

  // Absent who were supposed to arrive today
  const absentMembers = attendanceData.attendanceList.filter(p => {
    if (p.attended !== false) return false;
    const arrivalDays = getProfileArrivalDays(p);
    return arrivalDays.includes(todayWeekday);
  });

  // Alphabetical sort before creating the PDF data
  const sortedPresentExpected = [...presentExpected].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const sortedPresentNotExpected = [...presentNotExpected].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const sortedAbsentMembers = [...absentMembers].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

  // Columns and data for PDF for each group
  const pdfColumnsPresent = [
    { key: 'caregiver', header: 'מטפל', defaultValue: '' },
    { key: 'city', header: 'יישוב', defaultValue: 'לא צוין' },
    { key: 'name', header: 'שם', defaultValue: '' },
    { key: 'serialNumber', header: 'מס׳', defaultValue: '' },
  ];
  const pdfColumnsNotExpected = [
    { key: 'caregiver', header: 'מטפל', defaultValue: '' },
    { key: 'city', header: 'יישוב', defaultValue: 'לא צוין' },
    { key: 'name', header: 'שם', defaultValue: '' },
    { key: 'serialNumber', header: 'מס׳', defaultValue: '' },
  ];
  const pdfColumnsAbsent = [
    { key: 'reason', header: 'סיבת היעדרות', defaultValue: '' },
    { key: 'city', header: 'יישוב', defaultValue: 'לא צוין' },
    { key: 'name', header: 'שם', defaultValue: '' },
    { key: 'serialNumber', header: 'מס׳', defaultValue: '' },
  ];

  const pdfDataPresent = sortedPresentExpected.map((person, index) => ({
    serialNumber: index + 1,
    name: person.name || '',
    city: person.city || 'לא צוין',
    caregiver: (person.caregiver || person.hasCaregiver) ? 'הגיע עם מטפל' : '',
  }));
  const pdfDataNotExpected = sortedPresentNotExpected.map((person, index) => ({
    serialNumber: index + 1,
    name: person.name || '',
    city: person.city || 'לא צוין',
    caregiver: (person.caregiver || person.hasCaregiver) ? 'הגיע עם מטפל' : '',
  }));
  const pdfDataAbsent = sortedAbsentMembers.map((person, index) => ({
    serialNumber: index + 1,
    name: person.name || '',
    city: person.city || 'לא צוין',
    reason: person.reason || '',
  }));

  const totalPresent = presentExpected.length + presentNotExpected.length;
  const totalAll = totalPresent + absentMembers.length;

  const pdfConfig = {
    title: 'דוח נוכחות יומי',
    subtitle: 'מעון יום לותיקים',
    headerInfo: [
      `תאריך: ${todayFormatted}`,
      `יום: ${todayWeekday}`
    ],
    summaryData: [
      `סה"כ נוכחים: ${totalPresent}`,
      `סה"כ חסרים: ${absentMembers.length}`,
      `סה"כ: ${totalAll}`
    ],
    footerInfo: [
      { text: 'מעון יום לותיקים - דוח אוטומטי', align: 'center' },
      { text: `נוצר בתאריך: ${dayjs().format('DD/MM/YYYY HH:mm')}`, align: 'center' }
    ],
    customStyles: {
      styles: {
        fontSize: 11,
        cellPadding: 6,
        font: 'AlefHebrew'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        fontSize: 12,
        font: 'AlefHebrew'
      }
    }
  };

  return (
    <PDFAbsencePeople
      tables={[
        {
          title: `רשימת נוכחים: ${presentExpected.length}`,
          data: pdfDataPresent,
          columns: pdfColumnsPresent,
          customStyles: {
            ...pdfConfig.customStyles
          },
        },
        {
          title: `נוכחים שהגיעו ביום לא צפוי: ${presentNotExpected.length}`,
          data: pdfDataNotExpected,
          columns: pdfColumnsNotExpected,
          customStyles: {
            ...pdfConfig.customStyles
          },
        },
        {
          title: `רשימת חסרים: ${absentMembers.length}`,
          data: pdfDataAbsent,
          columns: pdfColumnsAbsent,
          customStyles: {
            ...pdfConfig.customStyles
          },
        },
      ]}
      betweenTablesContent={[
        '──────────────────────────────',
        '──────────────────────────────'
      ]}
      fileName={`דוח נוכחות - ${todayFormatted}.pdf`}
      title={pdfConfig.title}
      subtitle={pdfConfig.subtitle}
      headerInfo={pdfConfig.headerInfo}
      summaryData={pdfConfig.summaryData}
      footerInfo={pdfConfig.footerInfo}
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

export default DailyAttendancePDF; 