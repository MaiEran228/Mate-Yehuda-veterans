import {Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Checkbox,TextField,Paper,MenuItem,Box} from '@mui/material';
import { useState, useEffect } from 'react';
import { fetchAllProfiles } from '../firebase';


const reasonOptions = ['מחלה', 'אשפוז', 'שמחה', 'אבל'];

export default function AttendanceTable({ search, sortBy }) {
    const [rows, setRows] = useState([]);

    useEffect(() => { // the connection to the database
        const loadData = async () => {
            const profiles = await fetchAllProfiles();
            console.log("📦 הנתונים שהגיעו מה-DB:", profiles); // ← הדפסת הנתונים
            const dataWithDefaults = profiles.map(profile => ({
                ...profile,
                attended: false,
                caregiver: false,
                reason: '',
            }));
            setRows(dataWithDefaults);
        };
    
        loadData();
    }, []);

    const handleAttendanceChange = (id, checked) => { // check box for attendance
        setRows(prev =>
            prev.map(row =>
                row.id === id
                    ? { ...row, attended: checked, reason: checked ? '' : row.reason }
                    : row
            )
        );
    };

    const handleCaregiverChange = (id, checked) => { // check box for caregiver
        setRows(prev =>
            prev.map(row =>
                row.id === id ? { ...row, caregiver: checked } : row
            )
        );
    };

    const handleReasonChange = (id, value) => { // box for the reason
        setRows(prev =>
            prev.map(row =>
                row.id === id ? { ...row, reason: value } : row
            )
        );
    };

    // search by name
    const filteredRows = rows.filter(row =>
        row.name?.toLowerCase().includes(search.toLowerCase()) ||
        row.city?.toLowerCase().includes(search.toLowerCase())
    );

    // sort by city or name
    const sortedRows = [...filteredRows].sort((a, b) => {
        const fieldA = sortBy === 'שם' ? a.name : a.city;
        const fieldB = sortBy === 'שם' ? b.name : b.city;
        return (fieldA || '').localeCompare(fieldB || '');
    });

    return ( // display
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0 }}>
            <TableContainer component={Paper}>
                <Table size="small"  sx={{ '& td, & th': { py: 0, px: 1, height: '40px', fontSize: '0.75rem' },}} >
                    <TableHead>
                        <TableRow>
                            <TableCell align="right">שם</TableCell>
                            <TableCell align="right">אזור מגורים</TableCell>
                            <TableCell align="right">נוכח</TableCell>
                            <TableCell align="right">מטפל</TableCell>
                            <TableCell align="right" sx={{ width: 90 }}>סיבה להיעדרות</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedRows.map((profile) => (
                            <TableRow key={profile.id}>
                                <TableCell align="right">{profile.name}</TableCell>
                                <TableCell align="right">{profile.city}</TableCell>
                                <TableCell align="right">
                                    <Checkbox
                                        checked={profile.attended}
                                        onChange={(e) =>
                                            handleAttendanceChange(profile.id, e.target.checked)
                                        }
                                        size="small" sx={{p: 0.2, '& .MuiSvgIcon-root': {fontSize: 18,},} }                          />
                                </TableCell>
                                <TableCell align="right">
                                    <Checkbox
                                        checked={profile.caregiver}
                                        onChange={(e) =>
                                            handleCaregiverChange(profile.id, e.target.checked)
                                        }
                                        size="small" sx={{p: 0.2, '& .MuiSvgIcon-root': {fontSize: 18,},} }  
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {!profile.attended && (
                                        <TextField
                                            select
                                            label="סיבה להיעדרות"
                                            variant="standard"
                                            value={profile.reason}
                                            onChange={(e) =>
                                                handleReasonChange(profile.id, e.target.value)
                                            }
                                            fullWidth
                                            sx={{
                                                fontSize: '0.8rem',
                                                '& .MuiInputBase-root': {
                                                  height: '28px',         // גובה כולל של השדה
                                                  fontSize: '0.8rem',
                                                },
                                                '& .MuiInputLabel-root': {
                                                  fontSize: '0.7rem',     // גודל הטקסט של התווית
                                                },
                                                '& .MuiSelect-select': {
                                                  paddingTop: '4px',
                                                  paddingBottom: '2px',
                                                  fontSize: '0.8rem',
                                                },
                                              }}
                                        >
                                            {reasonOptions.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
