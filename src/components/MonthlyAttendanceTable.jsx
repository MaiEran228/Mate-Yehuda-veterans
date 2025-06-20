import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Box, Select, MenuItem, Checkbox, Button, Tooltip } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

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
  // isEditMode,
  // onEditChange 
}) => {
  const [localEditData, setLocalEditData] = useState({});
  const [showEditFields, setShowEditFields] = React.useState({});
  const [hoveredCell, setHoveredCell] = useState(null); // { profileId, dateStr }
  const [editCell, setEditCell] = useState(null); // { profileId, dateStr }
  const [editValues, setEditValues] = useState({}); // { attended, caregiver, reason }

  // אפס מצב עריכה וסטייטים פנימיים בכל שינוי ב-attendanceByDate
  useEffect(() => {
    setLocalEditData({});
    setEditCell(null);
    setEditValues({});
  }, [attendanceByDate]);

  const handleAttendanceChange = (profileId, date, attended) => {
    setLocalEditData((prev) => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [date]: { ...prev[profileId]?.[date], attended },
      },
    }));
    // onEditChange(profileId, date, { attended });
  };

  const handleReasonChange = (profileId, date, reason) => {
    setLocalEditData((prev) => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [date]: { ...prev[profileId]?.[date], reason },
      },
    }));
    // onEditChange(profileId, date, { reason });
  };

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600, width: '100%', overflowX: 'auto', direction: 'ltr' }}>
      <Table stickyHeader size="small" sx={{ width: '100%', direction: 'rtl' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '1px solid #bbb', minWidth: 80 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                שם
                <IconButton onClick={() => setShowSearch(s => !s)} sx={{ mr: 1 }}>
                  <SearchIcon />
                </IconButton>
              </Box>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '2px solid #888', minWidth: 50 }} align="center">סה"כ ותיק</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '2px solid #888', minWidth: 35 }} align="center">סה"כ מטפל</TableCell>
            {days.map(day => (
              <TableCell key={day.format('YYYY-MM-DD')} align="center" sx={{ fontWeight: 'bold', bgcolor: '#e3e3e3', borderLeft: '2px solid #bbb', width: 20 }}>
                {day.format('D')}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {profiles
            .filter(profile => profile.name?.includes(searchTerm))
            .slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
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
                <TableRow key={profile.id} sx={{ minHeight: 48 }}>
                  <TableCell sx={{ fontWeight: 'bold', borderLeft: '1px solid #bbb', minWidth: 100, height: 48, textAlign: 'right' }}>{profile.name}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', borderLeft: '2px solid #888', minWidth: 50 }}>{totalDays}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', borderLeft: '2px solid #888', minWidth: 35 }}>{totalCaregiver}</TableCell>
                  {days.map(day => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const list = attendanceByDate[dateStr];
                    let attType = null;
                    let hasCaregiver = false;
                    let absenceReason = '';
                    let attended = false;
                    if (list) {
                      const person = list.find(p => p.id === profile.id);
                      if (person && person.attended === true) {
                        attType = person.type === 'makeup' ? 'makeup' : 'regular';
                        hasCaregiver = !!person.caregiver;
                        attended = true;
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
                        sx={{ borderLeft: '2px solid #eee', width: 70, minWidth: 70, maxWidth: 70, p: 0.5, position: 'relative' }}
                        onMouseEnter={() => setHoveredCell(profile.id + '-' + dateStr)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {editCell === profile.id + '-' + dateStr ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Checkbox
                              checked={editValues.attended || false}
                              onChange={(e) => {
                                const newVal = e.target.checked;
                                if (newVal) {
                                  setEditValues(v => ({ ...v, attended: true, reason: '' }));
                                } else {
                                  setEditValues(v => ({ ...v, attended: false }));
                                }
                              }}
                              size="small"
                            />
                            <span style={{ fontSize: '0.8em' }}>הגיע</span>
                            <Checkbox
                              checked={editValues.caregiver || false}
                              onChange={(e) => {
                                const newVal = e.target.checked;
                                setEditValues(v => ({ ...v, caregiver: newVal }));
                              }}
                              size="small"
                            />
                            <span style={{ fontSize: '0.8em' }}>מטפל</span>
                            <Select
                              value={editValues.reason || ''}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setEditValues(v => ({ ...v, reason: newVal }));
                              }}
                              displayEmpty
                              size="small"
                              sx={{ fontSize: '0.8em', width: '100%', marginTop: 1, direction: 'rtl', maxWidth: '100%', whiteSpace: 'normal', lineHeight: 1.1, minHeight: 32, p: 0 }}
                              MenuProps={{
                                PaperProps: {
                                  sx: { minWidth: 140, maxWidth: 220 },
                                },
                                MenuListProps: {
                                  sx: { p: 0 },
                                },
                              }}
                            >
                              <MenuItem value="" sx={{ whiteSpace: 'normal', fontSize: '0.78em', p: 0.5, lineHeight: 1.2 }}>סיבת היעדרות</MenuItem>
                              {reasonOptions.map((option) => (
                                <MenuItem key={option} value={option} sx={{ whiteSpace: 'normal', fontSize: '0.78em', p: 0.5, lineHeight: 1.2 }}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1, alignItems: 'center' }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                sx={{ minWidth: 0, px: 1, fontSize: '0.8em', height: 24, lineHeight: 1, mb: 0.5, borderRadius: 1, boxShadow: 'none' }}
                                onClick={async () => {
                                  const updates = {
                                    attended: editValues.attended || false,
                                    caregiver: editValues.caregiver || false,
                                    reason: editValues.attended ? '' : (editValues.reason || ''),
                                  };
                                  await updateAttendanceInFirebase(dateStr, profile.id, updates);
                                  setEditCell(null);
                                  setEditValues({});
                                }}
                              >
                                שמור
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                
                                sx={{ minWidth: 0, px: 1, fontSize: '0.8em', height: 24, lineHeight: 1, borderRadius: 1 }}
                                onClick={() => setEditCell(null)}
                              >
                                ביטול
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            {attType === 'regular' && <><CheckIcon sx={{ color: typeColors.regular, verticalAlign: 'middle', fontSize: 28 }} />{hasCaregiver && <span style={{ color: '#888', fontWeight: 'bold', fontSize: '1.2em', marginRight: 2 }}>+1</span>}</>}
                            {attType === 'makeup' && <><CheckIcon sx={{ color: typeColors.makeup, verticalAlign: 'middle', fontSize: 28 }} />{hasCaregiver && <span style={{ color: '#888', fontWeight: 'bold', fontSize: '1em', marginRight: 2 }}>+1</span>}</>}
                            {absenceReason && <span style={{ color: '#d32f2f', fontSize: '0.85em', fontWeight: 500 }}>{absenceReason}</span>}
                            {/* אייקון עריכה שמופיע רק במעבר עכבר */}
                            {hoveredCell === profile.id + '-' + dateStr && (
                              <IconButton size="small" sx={subtleEditIconSx}
                                onClick={() => {
                                  setEditCell(profile.id + '-' + dateStr);
                                  setEditValues({
                                    attended,
                                    caregiver: hasCaregiver,
                                    reason: absenceReason
                                  });
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MonthlyAttendanceTable; 