import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Box, Select, MenuItem, Checkbox, Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import dayjs from 'dayjs';
import ErrorDialog from '../ErrorDialog';

const typeColors = {
  regular: '#43a047', // ירוק
  makeup: '#1976d2', // כחול
};

const reasonOptions = ['מחלה', 'אשפוז', 'שמחה', 'אבל', 'שיפוי', 'טיפול בית'];

// סגנון לאייקון עריכה עדין
const subtleEditIconSx = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  opacity: 0.18,
  bgcolor: 'transparent',
  boxShadow: 'none',
  transition: 'opacity 0.2s',
  p: 0,
  '&:hover': {
    opacity: 0.45,
    bgcolor: 'transparent',
    boxShadow: 'none',
  },
  '&:active': {
    transform: 'translate(-50%, -50%) scale(0.9)',
    transition: 'transform 0.1s',
    outline: 'none',
    border: 'none',
    bgcolor: 'rgba(0, 0, 0, 0.1)',
    p: 1,
    borderRadius: '50%',
    minWidth: 40,
    minHeight: 40
  },
  '&:focus': {
    outline: 'none',
    border: 'none'
  }
};

// עדכון ערך ב-Firebase
async function updateAttendanceInFirebase(dateStr, personId, updates) {
  const attendanceDocRef = doc(db, 'attendance', dateStr);
  const attendanceSnap = await getDoc(attendanceDocRef);
  if (!attendanceSnap.exists()) return;
  const data = attendanceSnap.data();
  const list = data.attendanceList || [];
  const idx = list.findIndex(p => p.id === personId);
  if (idx === -1) return;
  const updatedPerson = { ...list[idx], ...updates };
  const updatedList = [...list];
  updatedList[idx] = updatedPerson;
  await updateDoc(attendanceDocRef, { attendanceList: updatedList });
}

const MonthlyAttendanceTable = ({ 
  profiles, 
  attendanceByDate, 
  days, 
  searchTerm, 
  setShowSearch, 
}) => {
  const [localEditData, setLocalEditData] = useState({});
  const [showEditFields, setShowEditFields] = React.useState({});
  const [hoveredCell, setHoveredCell] = useState(null); // { profileId, dateStr }
  const [editDialog, setEditDialog] = useState({ open: false, profile: null, date: null, values: {} }); // { open, profile, date, values }
  const [showSearchField, setShowSearchField] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });

  // אפס מצב עריכה וסטייטים פנימיים בכל שינוי ב-attendanceByDate
  useEffect(() => {
    setLocalEditData({});
    setEditDialog({ open: false, profile: null, date: null, values: {} });
  }, [attendanceByDate]);

  // בדיקה וניפוי של הפרופילים
  useEffect(() => {
    console.log('MonthlyAttendanceTable received profiles:', profiles.length, profiles);
    console.log('Profiles with names:', profiles.filter(p => p.name).length);
    console.log('Profiles without names:', profiles.filter(p => !p.name).length);
    
    // בדיקת ימי הגעה
    profiles.forEach(profile => {
      if (profile.arrivalDays) {
        console.log(`Profile ${profile.name} arrival days:`, profile.arrivalDays);
      }
    });
  }, [profiles]);

  // עדכון searchTerm כשהשדה המקומי משתנה
  useEffect(() => {
    if (setShowSearch) {
      setShowSearch(localSearchTerm);
    }
  }, [localSearchTerm, setShowSearch]);

  // סגירת שדה החיפוש כשלוחצים Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showSearchField) {
        setShowSearchField(false);
        setLocalSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSearchField]);

  // סגירת שדה החיפוש כשלוחצים מחוץ לטבלה
  useEffect(() => {
    const handleClickOutside = (event) => {
      const tableContainer = event.target.closest('.MuiTableContainer-root');
      if (!tableContainer && showSearchField) {
        setShowSearchField(false);
        setLocalSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchField]);

  const handleAttendanceChange = (profileId, date, attended) => {
    setLocalEditData((prev) => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [date]: { ...prev[profileId]?.[date], attended },
      },
    }));
  };

  const handleReasonChange = (profileId, date, reason) => {
    setLocalEditData((prev) => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [date]: { ...prev[profileId]?.[date], reason },
      },
    }));
  };

  const handleOpenEditDialog = (profile, dateStr) => {
    const today = dayjs().startOf('day');
    const editDay = dayjs(dateStr).startOf('day');
    // 1. עדכון יום עתידי
    if (editDay.isAfter(today)) {
      setErrorDialog({ open: true, message: 'לא ניתן לעדכן יום עתידי. ' });
      return;
    }
    const list = attendanceByDate[dateStr];
    let attended = false;
    let hasCaregiver = false;
    let absenceReason = '';
    if (list) {
      const person = list.find(p => p.id === profile.id);
      if (person && person.attended === true) {
        attended = true;
        hasCaregiver = !!person.caregiver;
      } else if (person && person.attended === false && person.reason) {
        absenceReason = person.reason;
      }
    }
    setEditDialog({
      open: true,
      profile,
      date: dateStr,
      values: { attended, caregiver: hasCaregiver, reason: absenceReason }
    });
  };

  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, profile: null, date: null, values: {} });
  };

  const handleSaveEditDialog = async () => {
    const { profile, date, values } = editDialog;
    // בדיקה: לא ניתן לסמן מטפל בלי שהמשתתף עצמו נוכח
    if (values.caregiver && !values.attended) {
      setErrorDialog({ open: true, message: 'לא ניתן לסמן "מטפל" כאשר הפרופיל לא נוכח.' });
      return;
    }
    const updates = {
      attended: values.attended || false,
      caregiver: values.caregiver || false,
      reason: values.attended ? '' : (values.reason || ''),
    };
    await updateAttendanceInFirebase(date, profile.id, updates);
    handleCloseEditDialog();
  };

  // חישוב רוחב העמודות דינמית
  const totalDays = days.length;
  const availableWidth = 100; // אחוזים
  const nameColumnWidth = 14; 
  const totalColumnWidth = 4; 
  const caregiverColumnWidth = 4; 
  const remainingWidth = availableWidth - nameColumnWidth - totalColumnWidth - caregiverColumnWidth;
  const dayColumnWidth = remainingWidth / totalDays; // חלוקה שווה לכל הימים

  
  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* טבלה */}
        <Box sx={{ flex: 1 }}>
          {/* כותרת הטבלה - קבועה */}
          <Table sx={{ 
            width: '100%', 
            direction: 'rtl',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            overflow: 'hidden',
            
          }}>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: '#e3e3e3', 
                    borderLeft: '2px solid #888', 
                    borderBottom: '2px solid #888',
                    width: `${nameColumnWidth}%`,
                    minWidth: 0, // מאפס את ה-minWidth הדיפולטיבי
                    maxWidth: `${nameColumnWidth}%`,
                    padding: '4px 2px', // צמצום ה-padding
                    height: 36, // גובה זהה לשורות הגוף
                    fontSize: '0.8rem',
                    borderTopLeftRadius: '5px'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
                    <IconButton 
                      onClick={() => setShowSearchField(s => !s)} 
                      sx={{ 
                        p: 0.5, // צמצום ה-padding של הכפתור
                        '&:focus': {
                          outline: 'none',
                          border: 'none'
                        },
                        '&:active': {
                          outline: 'none',
                          border: 'none'
                        }
                      }} 
                      size="small"
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                    {showSearchField ? (
                      <TextField
                        size="small"
                        placeholder="חיפוש"
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        sx={{
                          width: '80%',
                          '& .MuiOutlinedInput-root': {
                            height: '24px',
                            fontSize: '0.9rem',
                            '& fieldset': {
                              borderColor: 'transparent'
                            },
                            '&:hover fieldset': {
                              borderColor: 'transparent'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'transparent'
                            }
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span>שם</span>
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: '#e3e3e3', 
                    borderLeft: '2px solid #888', 
                    borderBottom: '2px solid #888',
                    width: `${totalColumnWidth}%`,
                    maxWidth: `${totalColumnWidth}%`,
                    minWidth: 0,
                    padding: '4px 2px',
                    height: 36, // גובה זהה לשורות הגוף
                    fontSize: '0.75rem'
                  }} 
                  align="center"
                >
                  סה"כ ותיק
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: '#e3e3e3', 
                    borderLeft: '2px solid #888', 
                    borderBottom: '2px solid #888',
                    width: `${caregiverColumnWidth}%`,
                    maxWidth: `${caregiverColumnWidth}%`,
                    minWidth: 0,
                    padding: '4px 2px',
                    height: 36, // גובה זהה לשורות הגוף
                    fontSize: '0.75rem'
                  }} 
                  align="center"
                >
                  סה"כ מטפל
                </TableCell>
                {days.map((day, index) => (
                  <TableCell 
                    key={day.format('YYYY-MM-DD')} 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: '#e3e3e3', 
                      borderLeft: '1px solid #bbb', 
                      borderBottom: '2px solid #888',
                      width: `${dayColumnWidth}%`,
                      maxWidth: `${dayColumnWidth}%`,
                      minWidth: 0,
                      padding: '4px 2px',
                      fontSize: '0.7rem',
                      ...(index === days.length - 1 && {
                        borderTopRightRadius: '5px'
                      })
                    }}
                  >
                    {day.format('D')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>

          {/* גוף הטבלה - עם גלילה */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              maxHeight: 600, 
              overflowY: 'scroll',
              overflowX: 'auto', 
              direction: 'ltr',
              '& .MuiTable-root': {
                tableLayout: 'fixed',
                width: '100%'
              },
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#ffffff',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgb(134, 145, 156)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'rgb(134, 136, 139)',
              },
            }}
          >
            <Table size="small" sx={{ width: '100%', direction: 'rtl' }}>
              <TableBody>
                {profiles
                  .filter(profile => {
                    // הצג את כל הפרופילים שיש להם id, גם אם אין להם שם
                    if (!profile.id) return false;
                    // אם יש searchTerm, בדוק אם השם מכיל אותו
                    if (localSearchTerm && profile.name) {
                      return profile.name.includes(localSearchTerm);
                    }
                    return true;
                  })
                  .slice().sort((a, b) => {
                    // מיון לפי שם, אם אין שם - בסוף
                    const nameA = a.name || '';
                    const nameB = b.name || '';
                    return nameA.localeCompare(nameB, 'he');
                  })
                  .map(profile => {
                    // חישוב סך הימים מראש
                    const totalDays = days.reduce((sum, day) => {
                      const dateStr = day.format('YYYY-MM-DD');
                      const list = attendanceByDate[dateStr];
                      if (list) {
                        const person = list.find(p => p.id === profile.id);
                        if (person && person.attended === true) {
                          return sum + 1;
                        }
                      }
                      return sum;
                    }, 0);
                    // חישוב סך הימים עם מטפל
                    const totalCaregiver = days.reduce((sum, day) => {
                      const dateStr = day.format('YYYY-MM-DD');
                      const list = attendanceByDate[dateStr];
                      if (list) {
                        const person = list.find(p => p.id === profile.id);
                        if (person && person.attended === true && person.caregiver) {
                          return sum + 1;
                        }
                      }
                      return sum;
                    }, 0);
                    return (
                      <TableRow key={profile.id} sx={{ minHeight: 36 }}>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold', 
                            borderLeft: '2px solid #888', 
                            width: `${nameColumnWidth}%`,
                            maxWidth: `${nameColumnWidth}%`,
                            minWidth: 0,
                            height: 36, 
                            textAlign: 'right',
                            padding: '4px 2px',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {profile.name || `פרופיל ללא שם (${profile.id})`}
                        </TableCell>
                        <TableCell 
                          align="center" 
                          sx={{ 
                            fontWeight: 'bold', 
                            borderLeft: '2px solid #888', 
                            width: `${totalColumnWidth}%`,
                            maxWidth: `${totalColumnWidth}%`,
                            minWidth: 0,
                            padding: '4px 1px',
                            fontSize: '0.8rem',
                          }}
                        >
                          {totalDays}
                        </TableCell>
                        <TableCell 
                          align="center" 
                          sx={{ 
                            fontWeight: 'bold', 
                            borderLeft: '2px solid #888', 
                            width: `${caregiverColumnWidth}%`,
                            maxWidth: `${caregiverColumnWidth}%`,
                            minWidth: 0,
                            padding: '4px 1px',
                            fontSize: '0.8rem',
                          }}
                        >
                          {totalCaregiver}
                        </TableCell>
                        {days.map(day => {
                          const dateStr = day.format('YYYY-MM-DD');
                          const list = attendanceByDate[dateStr];
                          let attType = null;
                          let hasCaregiver = false;
                          let absenceReason = '';
                          let attended = false;
                          
                          // בדיקה אם היום הנוכחי הוא יום הגעה של הפרופיל
                          const dayOfWeek = day.day(); // 0 = ראשון, 1 = שני, וכו'
                          const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
                          const currentHebrewDay = hebrewDayNames[dayOfWeek];
                          const isRegularDay = profile.arrivalDays && profile.arrivalDays.includes(currentHebrewDay);
                          
                          if (list) {
                            const person = list.find(p => p.id === profile.id);
                            if (person && person.attended === true) {
                              // אם הגיע ביום שאינו יום הגעה רגיל שלו - זה makeup (כחול)
                              attType = isRegularDay ? 'regular' : 'makeup';
                              hasCaregiver = !!person.caregiver;
                              attended = true;
                              
                              // לוג לדיבוג
                              console.log(`Profile: ${profile.name}, Day: ${currentHebrewDay}, ArrivalDays: ${JSON.stringify(profile.arrivalDays)}, IsRegular: ${isRegularDay}, AttType: ${attType}`);
                            } else if (person && person.attended === false && person.reason) {
                              absenceReason = person.reason;
                              attended = false;
                            }
                          }
                          // עדכון הנתונים מהסטייט המקומי
                          const localData = localEditData[profile.id]?.[dateStr];
                          if (localData) {
                            if (localData.attended !== undefined) {
                              attended = localData.attended;
                            }
                            if (localData.reason !== undefined) {
                              absenceReason = localData.reason;
                            }
                          }
                          return (
                            <TableCell
                              key={dateStr}
                              align="center"
                              sx={{ 
                                borderLeft: '1px solid #eee', 
                                width: `${dayColumnWidth}%`,
                                maxWidth: `${dayColumnWidth}%`,
                                minWidth: 0,
                                padding: '2px 1px', 
                                position: 'relative',
                              }}
                              onMouseEnter={() => setHoveredCell(profile.id + '-' + dateStr)}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.1 }}>
                                {attType === 'regular' && (
                                  <>
                                    <CheckIcon sx={{ color: typeColors.regular, verticalAlign: 'middle', fontSize: 18 }} />
                                    {hasCaregiver && (
                                      <span style={{ color: '#888', fontWeight: 'bold', fontSize: '0.55em' }}>+1</span>
                                    )}
                                  </>
                                )}
                                {attType === 'makeup' && (
                                  <>
                                    <CheckIcon sx={{ color: typeColors.makeup, verticalAlign: 'middle', fontSize: 15 }} />
                                    {hasCaregiver && (
                                      <span style={{ color: '#888', fontWeight: 'bold', fontSize: '0.55em' }}>+1</span>
                                    )}
                                  </>
                                )}
                                {absenceReason && (
                                  <span style={{ color: '#d32f2f', fontSize: '0.7em', fontWeight: 'bold' }}>
                                    {absenceReason}
                                  </span>
                                )}
                                {/* אייקון עריכה שמופיע רק במעבר עכבר */}
                                {hoveredCell === profile.id + '-' + dateStr && (
                                  <IconButton size="small" sx={subtleEditIconSx}
                                    onClick={() => handleOpenEditDialog(profile, dateStr)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {/* מקרא */}
        <Box sx={{ 
          p: 1, 
          bgcolor: ' rgb(228, 236, 241)', 
          borderRadius: 1,
          border: '0.3px solid rgb(160, 167, 172)',
          minWidth: 20,
          height: 'fit-content',
          position: 'sticky',
          top: 12,
          mt: 10
        }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'center' }}>
            מקרא
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon sx={{ color: typeColors.regular, fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">נוכח ביום הגעה</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon sx={{ color: typeColors.makeup, fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">נוכח לא ביום הגעה</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ color: '#888', fontWeight: 'bold', fontSize: '0.8em' }}>+1</span>
              <Typography variant="body2" fontWeight="medium">עם מטפל</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* דיאלוג עריכה */}
      <Dialog
        open={editDialog.open}
        onClose={handleCloseEditDialog}
        dir="rtl"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          עריכת נוכחות לתאריך {editDialog.date ? dayjs(editDialog.date).format('DD/MM/YYYY') : ''}
          <IconButton
            onClick={handleCloseEditDialog}
            sx={{ 
              color: 'grey.600',
              '&:hover': { color: 'grey.600' },
              '&:focus': { outline: 'none' }
            }}
          >
            ×
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* שם ותאריך */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1, mt: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {editDialog.profile?.name}
              </Typography>
            </Box>
            
            {/* אפשרויות עריכה */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* הגיע ומטפל - מיושרים לימין */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={editDialog.values.attended || false}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      setEditDialog(prev => ({
                        ...prev,
                        values: {
                          ...prev.values,
                          attended: newVal,
                          reason: newVal ? '' : prev.values.reason
                        }
                      }));
                    }}
                  />
                  <Typography variant="body1" fontWeight="medium">הגיע</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={editDialog.values.caregiver || false}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      setEditDialog(prev => ({
                        ...prev,
                        values: { ...prev.values, caregiver: newVal }
                      }));
                    }}
                  />
                  <Typography variant="body1" fontWeight="medium">מטפל</Typography>
                </Box>
              </Box>
              
              {/* סיבת היעדרות */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1" fontWeight="medium">סיבת היעדרות</Typography>
                <Select
                  value={editDialog.values.reason || ''}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setEditDialog(prev => ({
                      ...prev,
                      values: { ...prev.values, reason: newVal }
                    }));
                  }}
                  displayEmpty
                  fullWidth
                  disabled={editDialog.values.attended}
                >
                  <MenuItem value="">בחר סיבת היעדרות</MenuItem>
                  {reasonOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2,
          gap: 2
        }}>
          <Button 
            onClick={handleCloseEditDialog} 
            variant="outlined"
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
              minWidth: '120px'
            }}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleSaveEditDialog} 
            variant="contained" 
            color="primary"
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
            שמור
          </Button>
        </DialogActions>
      </Dialog>
      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, message: '' })}
        title="שגיאה בעדכון נוכחות"
      >
        {errorDialog.message}
      </ErrorDialog>
    </>
  );
};

export default MonthlyAttendanceTable;