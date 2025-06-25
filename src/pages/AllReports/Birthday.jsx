import React, { useEffect, useState } from 'react';
import { fetchAllProfiles } from '../../firebase';
import { Typography, CircularProgress, Box, Paper, Button, Container, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { useLocation, useNavigate } from 'react-router-dom';
import PDFBirthday from '../../components/PDFBirthday';
import * as XLSX from 'xlsx';
import OutlinedInput from '@mui/material/OutlinedInput';

// הגדרת השפה העברית
dayjs.locale('he');

const Birthday = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const todayFormatted = dayjs().format('DD/MM/YYYY');
  const currentMonth = (dayjs().month() + 1).toString(); // חודשים ב-dayjs מ-0
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

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

  const currentMonthName = hebrewMonths[Number(selectedMonth) - 1];

  const currentMonthCount = (profilesByMonth[selectedMonth] || []).length;

  return (
    <>
      {/* שורת כפתורים - מחוץ ל-Container של הדוח */}
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2, mt:5 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleBack}
          sx={{
            border: '1.7px solid rgba(64, 99, 112, 0.72)',
            color: 'rgba(64, 99, 112, 0.72)',
            fontWeight: 'bold',
            ':hover': {
              borderColor: '#7b8f99',
              color: '#5a676e',
              outline: 'none'
            },
            '&:focus': {
              outline: 'none'
            },
            '&:active': {
              outline: 'none'
            },
            minWidth: 'auto',
            ml: 2
          }}
        >
          חזור
        </Button>
        <FormControl size="small" sx={{ minWidth: 100, ml: 2 }}>
          <InputLabel id="month-select-label"
            sx={{
              textAlign: 'right',
              right: 25,
              left: 'unset',
              transformOrigin: 'top right',
              direction: 'rtl',
              backgroundColor: '#ebf1f5',
              px: 0.5,
              color: 'rgba(64, 99, 112, 0.72)',
              '&.Mui-focused': {
                color: 'rgba(64, 99, 112, 0.72)',
              },
            }}>
            חודש
          </InputLabel>
          <Select
            labelId="month-select-label"
            value={selectedMonth}
            label="חודש"
            onChange={e => setSelectedMonth(e.target.value)}
            input={
              <OutlinedInput
                notched={false}
                label="חודש"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(64, 99, 112, 0.72)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7b8f99',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(64, 99, 112, 0.72)',
                    borderWidth: 2,
                  },
                  '&.Mui-focused': {
                    boxShadow: 'none',
                  },
                  outline: 'none',
                }}
              />
            }
          >
            {hebrewMonths.map((month, idx) => (
              <MenuItem key={idx + 1} value={(idx + 1).toString()}>{month}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{
        position: 'absolute', left: 32, top: 90, zIndex: 10, gap: 2, display: 'flex',mt:5,
        '@media (max-width:600px)': {
          left: 8, top: 80 // מסכים קטנים
        }
      }}>
        <PDFBirthday 
          profilesByMonth={profilesByMonth}
          selectedMonth={selectedMonth}
        />
        <Button
          variant="contained"
          color="primary"
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
            '&:focus': {
              border: 'none',
              outline: 'none'
            },
            '&:active': {
              border: 'none',
              outline: 'none'
            },
            minWidth: '120px',
            ml: 2
          }}
          onClick={async () => {
            const ExcelJS = (await import('exceljs')).default;
            const { saveAs } = await import('file-saver');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('ימי הולדת', {
              views: [{ rightToLeft: true }],
            });
            const columns = ['שם', 'תאריך לידה', 'גיל'];
            worksheet.columns = columns.map((col, idx) => ({
              header: col,
              key: col,
              width: [20, 15, 10][idx],
              style: {
                alignment: { horizontal: 'center' },
                font: { name: 'Arial', size: 12 },
              }
            }));
            // הוספת שורת תאריך ממוזגת מעל הכותרות
            worksheet.insertRow(1, []);
            const dateCell = worksheet.getCell(1, 1);
            dateCell.value = `חודש: ${currentMonthName}`;
            dateCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            dateCell.font = { bold: true, size: 14 };
            dateCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE4ECF1' },
            };
            worksheet.mergeCells(1, 1, 1, columns.length);
            for (let i = 1; i <= columns.length; i++) {
              worksheet.getCell(1, i).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              worksheet.getCell(1, i).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE4ECF1' },
              };
            }
            // עיצוב שורת כותרת (עכשיו בשורה 2)
            const headerRow = worksheet.getRow(2);
            headerRow.height = 25;
            headerRow.eachCell(cell => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE4ECF1' },
              };
              cell.font = { bold: true };
              cell.border = {
                top: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                left: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                bottom: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                right: { style: 'hair', color: { argb: 'FFB0B0B0' } },
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            });
            // מיון שמות
            const monthProfiles = profilesByMonth[selectedMonth] || [];
            const sortedProfiles = [...monthProfiles].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
            sortedProfiles.forEach((profile) => {
              const birthDate = dayjs(profile.birthDate);
              const age = dayjs().diff(birthDate, 'year');
              worksheet.addRow({
                'שם': profile.name,
                'תאריך לידה': birthDate.format('DD/MM/YYYY'),
                'גיל': age
              });
            });
            // גבולות ויישור לכל התאים
            worksheet.eachRow((row, rowNumber) => {
              row.eachCell((cell, colNumber) => {
                cell.border = {
                  top: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                  left: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                  bottom: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                  right: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              });
            });
            // הורד קובץ
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `דוח_ימי_הולדת_${currentMonthName}_${todayFormatted}.xlsx`);
          }}
        >
          ייצוא ל־Excel
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'start', width: '100%', px: { xs: 2, md: 8 }, }}>
        <Container maxWidth={false}
          sx={{ mt: 2, maxWidth: '900px', width: '100%', }}>

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
                  דוח ימי הולדת חודשי
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  {`חודש: ${currentMonthName}`}<br />
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
                    {currentMonthCount}
                  </Typography>
                  <Typography variant="body2">סה"כ ימי הולדת החודש</Typography>
                </Box>
              </Box>

              {/* רשימת ימי הולדת לחודש הנבחר בלבד */}
              {currentMonthCount === 0 ? (
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
                  אין ימי הולדת החודש.
                </Typography>
              ) : (
                <Box
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
                    {currentMonthName} ({currentMonthCount})
                  </Typography>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: 2
                  }}>
                    {profilesByMonth[selectedMonth]?.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
                      .map((profile) => (
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
                          <Box sx={{ color: '#1976d2', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
                            🎂
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                              {profile.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {profile.birthDate ? (() => {
                                const birthDate = dayjs(profile.birthDate);
                                return `תאריך לידה: ${birthDate.format('DD/MM/YYYY')}`;
                              })() : 'תאריך לידה לא צוין'}
                            </Typography>
                            {profile.birthDate && (
                              <Typography variant="body2" color="textSecondary">
                                {`גיל: ${dayjs().diff(dayjs(profile.birthDate), 'year')}`}
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      ))}
                  </Box>
                </Box>
              )}

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
      </Box>
    </>
  );
};

export default Birthday;