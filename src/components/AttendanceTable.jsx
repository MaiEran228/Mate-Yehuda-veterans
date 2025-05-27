import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, TextField, Paper, MenuItem, Box, Skeleton, CircularProgress } from '@mui/material';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { fetchAllProfiles, fetchAttendanceByDate } from '../firebase';
import dayjs from 'dayjs';

const reasonOptions = ['מחלה', 'אשפוז', 'שמחה', 'אבל'];

// קומפוננטה לשורה עם Skeleton loading
const SkeletonRow = () => (
    <TableRow>
        <TableCell align="right">
            <Skeleton variant="text" width={80} height={20} />
        </TableCell>
        <TableCell align="right">
            <Skeleton variant="text" width={120} height={20} />
        </TableCell>
        <TableCell align="right">
            <Skeleton variant="circular" width={18} height={18} />
        </TableCell>
        <TableCell align="right">
            <Skeleton variant="circular" width={18} height={18} />
        </TableCell>
        <TableCell align="right">
            <Skeleton variant="rectangular" width={100} height={28} />
        </TableCell>
    </TableRow>
);

export default forwardRef(function AttendanceTable({ search, sortBy, onAttendanceChange }, ref) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useImperativeHandle(ref, () => ({
        getAttendanceData: () => rows,
    }));

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const today = dayjs().format('YYYY-MM-DD');
                const attendanceData = await fetchAttendanceByDate(today);

                if (attendanceData && attendanceData.attendanceList?.length) {
                    // טוען מהנוכחות השמורה
                    setRows(attendanceData.attendanceList);
                } else {
                    // טוען מהפרופילים אם אין נוכחות
                    const profiles = await fetchAllProfiles();
                    const dataWithDefaults = profiles.map(profile => ({
                        ...profile,
                        attended: false,
                        caregiver: false,
                        reason: '',
                    }));
                    setRows(dataWithDefaults);
                }
            } catch (err) {
                console.error('Error loading data:', err);
                setError('שגיאה בטעינת הנתונים');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

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

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4 }}>
                <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography color="error" variant="h6">{error}</Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => window.location.reload()} 
                        sx={{ mt: 2 }}
                    >
                        נסה שוב
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0 }}>
            <Paper sx={{ width: '100%' }}>
                <TableContainer
                    sx={{
                        maxHeight: 350,
                        overflowY: 'auto',
                        direction: 'ltr',
                    }}
                >
                    <Table size="small"
                        stickyHeader
                        sx={{
                            direction: 'rtl',
                            '& td, & th': {
                                py: 0,
                                px: 1,
                                height: '10px',
                                fontSize: '0.75rem',
                            },
                        }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="right">אזור מגורים</TableCell>
                                <TableCell align="right">שם</TableCell>
                                <TableCell align="right">נוכח</TableCell>
                                <TableCell align="right">מטפל</TableCell>
                                <TableCell align="right" sx={{ width: 90 }}>סיבה להיעדרות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                // מציג שורות Skeleton במקום טבלה ריקה
                                Array.from({ length: 8 }).map((_, index) => (
                                    <SkeletonRow key={index} />
                                ))
                            ) : (
                                sortedRows.map((profile) => (
                                    <TableRow key={profile.id}>
                                        <TableCell align="right">{profile.city}</TableCell>
                                        <TableCell align="right">{profile.name}</TableCell>
        
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
                                                disabled={!profile.attended}
                                                onChange={(e) =>
                                                    handleCaregiverChange(profile.id, e.target.checked)
                                                }
                                                size="small"
                                                sx={{ p: 0.2, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {profile.attended ? (
                                                <Box sx={{ height: 44 }} />
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
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
});