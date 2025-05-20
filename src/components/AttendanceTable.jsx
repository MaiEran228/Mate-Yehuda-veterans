import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, TextField, Paper, MenuItem, Box } from '@mui/material';
import { useState, useEffect } from 'react';
import { fetchAllProfiles } from '../firebase';


const reasonOptions = ['מחלה', 'אשפוז', 'שמחה', 'אבל'];


export default function AttendanceTable({ search, sortBy, onAttendanceChange }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const profiles = await fetchAllProfiles();
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

    // ☑️ עדכון נוכחות
    const handleAttendanceChange = (id, checked) => {
        setRows(prev =>
            prev.map(row =>
                row.id === id
                    ? {
                        ...row,
                        attended: checked,
                        caregiver: checked ? row.caregiver : false,
                        reason: checked ? '' : row.reason,
                    }
                    : row
            )
        );
    };

    // ☑️ עדכון מטפל (רק אם נוכח מסומן)
    const handleCaregiverChange = (id, checked) => {
        setRows(prev =>
            prev.map(row =>
                row.id === id && row.attended
                    ? { ...row, caregiver: checked }
                    : row
            )
        );
    };

    const handleReasonChange = (id, value) => {
        setRows(prev =>
            prev.map(row =>
                row.id === id ? { ...row, reason: value } : row
            )
        );
    };

    // 🧮 מחשבים נוכחות כוללת
    useEffect(() => {
    if (onAttendanceChange) {
        const count = rows.reduce((acc, row) => {
            let rowCount = 0;
            if (row.attended) rowCount += 1;
            if (row.caregiver) rowCount += 1;
            return acc + rowCount;
        }, 0);
        onAttendanceChange(count);
    }
}, [rows, onAttendanceChange]);

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

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0 }}>
            <Paper sx={{ width: '100%' }}>
                <TableContainer
                    sx={{
                        maxHeight: 350,
                        overflowY: 'auto',
                        direction: 'ltr', // 1️⃣ זה מציב את הגלילה בצד ימין
                    }}
                >
                    <Table size="small"
                        stickyHeader
                        sx={{
                            direction: 'rtl',
                            '& td, & th': {
                                py: 0,
                                px: 1,
                                height: '10px', // ← גובה השורה
                                fontSize: '0.75rem', // ← גודל הפונט אם רוצים גם אותו קטן
                            },
                        }}> {/* 2️⃣ אבל התוכן RTL */}
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
                                            size="small"
                                            sx={{ p: 0.2, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Checkbox
                                            checked={profile.caregiver}
                                            disabled={!profile.attended} // מונע סימון ידני כשהאדם לא נוכח
                                            onChange={(e) =>
                                                handleCaregiverChange(profile.id, e.target.checked)
                                            }
                                            size="small"
                                            sx={{ p: 0.2, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        {profile.attended ? (
                                            <Box sx={{ height: 44 }} />  // div ריק לשמירת גובה
                                        ) : (
                                            <TextField
                                                select
                                                label="סיבה להיעדרות"
                                                variant="standard"
                                                value={profile.reason}
                                                onChange={(e) => handleReasonChange(profile.id, e.target.value)}
                                                fullWidth
                                                sx={{
                                                    fontSize: '0.8rem',
                                                    '& .MuiInputBase-root': {
                                                        height: '28px',
                                                        fontSize: '0.8rem',
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        fontSize: '0.7rem',
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
            </Paper>
        </Box>
    );


}
