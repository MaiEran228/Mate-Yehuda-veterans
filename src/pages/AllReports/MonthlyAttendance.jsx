import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, TextField } from '@mui/material';
import { fetchAllProfiles } from '../../firebase';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import MonthlyAttendanceTable from '../../components/ReportsCompo/MonthlyAttendanceTable';
import OutlinedInput from '@mui/material/OutlinedInput';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper } from '@mui/material';

const getMonthDays = (year, month) => {
  const days = [];
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`));
  }
  return days;
};

const MonthlyAttendance = () => {
  const [profiles, setProfiles] = useState([]);
  const [attendanceByDate, setAttendanceByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(dayjs().month() + 1); // 1-based
  const [year, setYear] = useState(dayjs().year());
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // פונקציה לשלב פרופילים קיימים עם פרופילים שיש להם נתוני נוכחות
  const combineProfilesWithAttendance = (existingProfiles, attendanceData) => {
    const combinedProfiles = new Map();

    // הוסף את כל הפרופילים הקיימים
    existingProfiles.forEach(profile => {
      combinedProfiles.set(profile.id, profile);
    });

    // הוסף פרופילים שיש להם נתוני נוכחות אבל לא קיימים כרגע
    // רק אם יש להם נתוני נוכחות בחודש הנוכחי
    Object.values(attendanceData).forEach(attendanceList => {
      attendanceList.forEach(person => {
        if (!combinedProfiles.has(person.id)) {
          // יצירת פרופיל זמני למי שנמחק אבל יש לו נתוני נוכחות בחודש הנוכחי
          combinedProfiles.set(person.id, {
            id: person.id,
            name: person.name || `פרופיל ללא שם (${person.id})`,
            city: person.city || 'לא צוין',
            arrivalDays: person.arrivalDays || [],
            isDeleted: true // מסמן שזה פרופיל שנמחק
          });
        }
      });
    });

    return Array.from(combinedProfiles.values());
  };

  useEffect(() => {
    setLoading(true);
    setError('');

    // טעינת פרופילים באמצעות fetchAllProfiles (כמו בדף Profiles)
    const loadProfiles = async () => {
      try {
        const profilesData = await fetchAllProfiles();
        console.log('Profiles loaded via fetchAllProfiles:', profilesData.length, profilesData);

        // שלב עם נתוני הנוכחות הקיימים (אם יש)
        const combinedProfiles = combineProfilesWithAttendance(profilesData, attendanceByDate);
        setProfiles(combinedProfiles);
      } catch (error) {
        console.error('Error loading profiles:', error);
        setError('שגיאה בטעינת פרופילים');
      }
    };

    loadProfiles();

    // מאזין לנוכחות (כמו קודם)
    const attendanceCol = collection(db, 'attendance');
    const unsubAttendance = onSnapshot(attendanceCol, (snapshot) => {
      const attByDate = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.date || !data.attendanceList) return;
        const docDate = dayjs(data.date);
        if (docDate.year() === year && docDate.month() + 1 === month) {
          attByDate[data.date] = data.attendanceList;
        }
      });
      console.log('Attendance data loaded:', Object.keys(attByDate).length, 'dates');
      setAttendanceByDate(attByDate);

      // שלב את הפרופילים עם נתוני הנוכחות
      const currentProfiles = profiles.length > 0 ? profiles : [];
      const combinedProfiles = combineProfilesWithAttendance(currentProfiles, attByDate);
      console.log('Combined profiles:', combinedProfiles.length, combinedProfiles);
      setProfiles(combinedProfiles);

      setLoading(false);
    }, (e) => {
      console.error('Error in onSnapshot for attendance:', e);
      setError('שגיאה בטעינת נתוני נוכחות');
      setLoading(false);
    });

    return () => {
      unsubAttendance();
    };
  }, [month, year]);

  // האזנה לשינויים בפרופילים
  useEffect(() => {
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), async (snapshot) => {
      try {
        const profilesData = await fetchAllProfiles();
        console.log('Profiles updated via onSnapshot:', profilesData.length, profilesData);

        // שלב עם נתוני הנוכחות הקיימים
        const combinedProfiles = combineProfilesWithAttendance(profilesData, attendanceByDate);
        setProfiles(combinedProfiles);
      } catch (error) {
        console.error('Error updating profiles:', error);
      }
    }, (e) => {
      console.error('Error in onSnapshot for profiles:', e);
    });

    return () => {
      unsubProfiles();
    };
  }, [attendanceByDate]);

  const days = getMonthDays(year, month);

  return (
    <Box sx={{ direction: 'rtl', bgcolor: '#ebf1f5', width: '100%', height: '80%', mt: 3 }}>
      {/* כפתור חזור מעל הכותרת */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1, mt: 0 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/Reports')}
          size="small"
          sx={{
            border: '1.7px solid rgba(64, 99, 112, 0.72)',
            color: 'rgba(64, 99, 112, 0.72)',
            fontWeight: 'bold',
            height: '28px',
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
          }}
        >
          חזור
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        {/* צד ימין: כותרת */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            דו"ח נוכחות חודשי - {dayjs(`${year}-${month}-01`).format('MMMM YYYY')}
          </Typography>
        </Box>

        {/* צד שמאל: כפתורי ייצוא */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              const workbook = new ExcelJS.Workbook();
              const worksheet = workbook.addWorksheet('נוכחות חודשית', {
                views: [{ rightToLeft: true }],
              });
            
              const dayNumbers = days.map(day => day.format('D'));
              const columns = ['שם', 'סה"כ ותיק', 'סה"כ מטפל', ...dayNumbers];
            
              worksheet.columns = columns.map(col => ({
                header: col,
                key: col,
                width: ['שם', 'סה"כ ותיק', 'סה"כ מטפל'].includes(col) ? 15 : 6, // ימים ברוחב צר
                style: {
                  alignment: { horizontal: 'right' },
                  font: { name: 'Arial', size: 12 },
                }
              }));
            
              // 🟦 הוספת שורת כותרת חודש ושנה בראש האקסל
              worksheet.insertRow(1, []);
              const titleCell = worksheet.getCell(1, 1);
              titleCell.value = `דו"ח נוכחות חודשי - ${dayjs(`${year}-${month}-01`).format('MMMM YYYY')}`;
              titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              titleCell.font = { bold: true, size: 15 };
              titleCell.fill = {
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
              // 🟦 עיצוב שורת כותרת
              const headerRow = worksheet.getRow(2);
              headerRow.height = 25; // הגדלת גובה השורה הראשונה
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
            
              // מיון הפרופילים לפי שם
              const sortedProfiles = [...profiles].sort((a, b) => {
                const nameA = a.name || '';
                const nameB = b.name || '';
                return nameA.localeCompare(nameB, 'he');
              });
              const cellStyles = [];
              sortedProfiles.forEach((profile, profileIndex) => {
                const row = {};
                row['שם'] = profile.name;
                row['סה"כ ותיק'] = days.reduce((sum, day) => {
                  const dateStr = day.format('YYYY-MM-DD');
                  const list = attendanceByDate[dateStr];
                  if (list) {
                    const person = list.find(p => p.id === profile.id);
                    if (person?.attended) sum++;
                  }
                  return sum;
                }, 0);
                row['סה"כ מטפל'] = days.reduce((sum, day) => {
                  const dateStr = day.format('YYYY-MM-DD');
                  const list = attendanceByDate[dateStr];
                  if (list) {
                    const person = list.find(p => p.id === profile.id);
                    if (person?.attended && person.caregiver) sum++;
                  }
                  return sum;
                }, 0);
                dayNumbers.forEach(dayNum => {
                  const dayObj = days.find(d => d.format('D') === dayNum);
                  const dateStr = dayObj.format('YYYY-MM-DD');
                  const list = attendanceByDate[dateStr];
                  let value = '';
                  if (list) {
                    const person = list.find(p => p.id === profile.id);
                    if (person?.attended) {
                      // בדיקה אם זה יום הגעה רגיל או makeup
                      const dayOfWeek = dayObj.day();
                      const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
                      const currentHebrewDay = hebrewDayNames[dayOfWeek];
                      const isRegularDay = profile.arrivalDays && profile.arrivalDays.includes(currentHebrewDay);
                      if (isRegularDay) {
                        value = '✔️'; // ירוק
                        cellStyles.push({ row: profileIndex + 2, col: columns.indexOf(dayNum) + 1, color: 'FF43A047' });
                      } else {
                        value = '✔️'; // כחול
                        cellStyles.push({ row: profileIndex + 2, col: columns.indexOf(dayNum) + 1, color: 'FF1976D2' });
                      }
                      if (person.caregiver) {
                        value += ' +1';
                      }
                    } else if (!person?.attended && person?.reason) {
                      value = person.reason;
                      cellStyles.push({ row: profileIndex + 2, col: columns.indexOf(dayNum) + 1, color: 'FFD32F2F' });
                    }
                  }
                  row[dayNum] = value;
                });
                worksheet.addRow(row);
              });
              // החלת הסטיילינג על התאים
              cellStyles.forEach(style => {
                const cell = worksheet.getCell(style.row, style.col);
                cell.font = { color: { argb: style.color } };
              });
              
              // הוספת מקרא כגוש נפרד לחלוטין ליד הטבלה
              const legendStartCol = columns.length + 1; // עמודה צמודה לטבלה
              const legendStartRow = 5; // מתחיל מהשורה החמישית
              
              // כותרת המקרא
              const legendTitleCell = worksheet.getCell(legendStartRow, legendStartCol);
              legendTitleCell.value = 'מקרא';
              legendTitleCell.font = { bold: true, size: 14 };
              legendTitleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE4ECF1' },
              };
              legendTitleCell.border = {
                top: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                left: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                bottom: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                right: { style: 'thin', color: { argb: 'FFA0A7AC' } },
              };
              legendTitleCell.alignment = { horizontal: 'center' };
              
              // נוכח ביום הגעה - וי ירוק
              const regularCell = worksheet.getCell(legendStartRow + 1, legendStartCol);
              regularCell.value = '✔️ נוכח ביום הגעה';
              regularCell.font = { color: { argb: 'FF43A047' }, size: 12 };
              regularCell.border = {
                top: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                left: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                bottom: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                right: { style: 'thin', color: { argb: 'FFA0A7AC' } },
              };
              
              // נוכח לא ביום הגעה - וי כחול
              const makeupCell = worksheet.getCell(legendStartRow + 2, legendStartCol);
              makeupCell.value = '✔️ נוכח לא ביום הגעה';
              makeupCell.font = { color: { argb: 'FF1976D2' }, size: 12 };
              makeupCell.border = {
                top: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                left: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                bottom: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                right: { style: 'thin', color: { argb: 'FFA0A7AC' } },
              };
              
              // עם מטפל
              const caregiverCell = worksheet.getCell(legendStartRow + 3, legendStartCol);
              caregiverCell.value = '+1 עם מטפל';
              caregiverCell.font = { color: { argb: 'FF888888' }, size: 12 };
              caregiverCell.border = {
                top: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                bottom: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                left: { style: 'thin', color: { argb: 'FFA0A7AC' } },
                right: { style: 'thin', color: { argb: 'FFA0A7AC' } },
              };
              
              // הגדרת רוחב עמודת המקרא
              worksheet.getColumn(legendStartCol).width = 25;
              
              // 🧱 גבולות עדינים לכל תאים בטבלה (לא כולל המקרא)
              worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNumber) => {
                  // רק לתאים בטבלה (לא למקרא)
                  if (colNumber <= columns.length) {
                    cell.border = {
                      top: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                      left: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                      bottom: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                      right: { style: 'hair', color: { argb: 'FFB0B0B0' } },
                    };
                    cell.alignment = { horizontal: 'right' };
                  }
                });
              });
            
              const buffer = await workbook.xlsx.writeBuffer();
              const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              });
            
              saveAs(blob, `דו"ח נוכחות חודשי - ${dayjs(`${year}-${month}-01`).format('MMMM YYYY')}.xlsx`);
            }}
            
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
              minWidth: '120px'
            }}
          >
            ייצוא ל־Excel
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="month-select-label" sx={{ textAlign: 'right', right: 25, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: '#ebf1f5', px: 0.5 }}>
            חודש
          </InputLabel>
          <Select
            labelId="month-select-label"
            value={month}
            label="חודש"
            onChange={e => setMonth(Number(e.target.value))}
            input={<OutlinedInput notched={false} label="חודש" />}
          >
            {[...Array(12)].map((_, idx) => (
              <MenuItem key={idx + 1} value={idx + 1}>{dayjs().month(idx).format('MMMM')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="year-select-label" sx={{ textAlign: 'right', right: 25, left: 'unset', transformOrigin: 'top right', direction: 'rtl', backgroundColor: '#ebf1f5', px: 0.5 }}>
            שנה
          </InputLabel>
          <Select
            labelId="year-select-label"
            value={year}
            label="שנה"
            onChange={e => setYear(Number(e.target.value))}
            input={<OutlinedInput notched={false} label="שנה" />}
          >
            {Array.from({ length: (dayjs().year() + 5) - 2025 + 1 }, (_, idx) => 2025 + idx).map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {
        loading ? (
          <CircularProgress sx={{ m: 4 }} />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <div id="monthlyReportContent">
            <MonthlyAttendanceTable
              profiles={profiles}
              attendanceByDate={attendanceByDate}
              days={days}
              searchTerm={searchTerm}
              setShowSearch={setShowSearch}
            />
          </div>
        )
      }
    </Box >
  );
};

export default MonthlyAttendance;