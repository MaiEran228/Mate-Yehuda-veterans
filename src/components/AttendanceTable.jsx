import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, TextField, Paper, MenuItem, Box, Skeleton, CircularProgress } from '@mui/material';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { fetchAllProfiles, fetchAttendanceByDate } from '../firebase';
import dayjs from 'dayjs';

const reasonOptions = ['מחלה', 'אשפוז', 'שמחה', 'אבל', 'שיפוי', 'טיפול בית'];

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
        <Box sx={{ width: '100%' }}>
            <Paper
                sx={{
                    width: '100%',
                    borderRadius: '12px 12px 8px 8px',
                    boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.27)',
                    overflow: 'hidden',
                    border: '1px solid rgb(118, 126, 136)',
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Table
                        size="small"
                        sx={{
                            direction: 'rtl',
                            borderCollapse: 'collapse',
                            width: '100%',
                            tableLayout: 'fixed',
                            '& th, & td': {
                                py: 1,
                                px: 1,
                                fontSize: '1rem',
                            },
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell align="right" sx={{ width: '30%', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontSize: '1.1rem', fontWeight: 'bold' }}>אזור מגורים</TableCell>
                                <TableCell align="right" sx={{ width: '30%', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontSize: '1.1rem', fontWeight: 'bold' }}>שם</TableCell>
                                <TableCell align="right" sx={{ width: '10%', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontSize: '1.1rem', fontWeight: 'bold' }}>נוכח</TableCell>
                                <TableCell align="right" sx={{ width: '10%', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontSize: '1.1rem', fontWeight: 'bold' }}>מטפל</TableCell>
                                <TableCell align="right" sx={{ width: '20%', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontSize: '1.1rem', fontWeight: 'bold' }}>סיבה להיעדרות</TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>
                    <TableContainer
                        sx={{
                            maxHeight: 385,
                            overflowY: 'auto',
                            direction: 'ltr',
                            width: '100%',
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
                        <Table
                            size="small"
                            sx={{
                                direction: 'rtl',
                                borderCollapse: 'collapse',
                                width: '100%',
                                tableLayout: 'fixed',
                                '& th, & td': {
                                    py: 1,
                                    px: 1,
                                    fontSize: '1rem',
                                },
                            }}
                        >
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, index) => (
                                        <SkeletonRow key={index} />
                                    ))
                                ) : (
                                    sortedRows.map((profile) => (
                                        <TableRow key={profile.id}>
                                            <TableCell align="right" sx={{ width: '30%' }}>{profile.city}</TableCell>
                                            <TableCell align="right" sx={{ width: '30%' }}>{profile.name}</TableCell>
                                            <TableCell align="right" sx={{ width: '10%' }}>
                                                <Checkbox
                                                    checked={profile.attended}
                                                    onChange={(e) =>
                                                        handleAttendanceChange(profile.id, e.target.checked)
                                                    }
                                                    size="small"
                                                    sx={{ p: 0.2, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ width: '10%' }}>
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
                                            <TableCell align="right" sx={{ width: '20%' }}>
                                                {profile.attended ? (
                                                    <Box sx={{ height: 44 }} />
                                                ) : (
                                                    <TextField
                                                        select
                                                        label={profile.reason ? "" : "סיבה להיעדרות"}
                                                        InputLabelProps={{ shrink: true }}
                                                        variant="standard"
                                                        value={profile.reason}
                                                        onChange={(e) => handleReasonChange(profile.id, e.target.value)}
                                                        fullWidth
                                                        sx={{
                                                            fontSize: '0.8rem',
                                                            minHeight: '44px',
                                                            '& .MuiInputBase-root': {
                                                                height: '28px',
                                                                fontSize: '0.8rem',
                                                                paddingTop: profile.reason ? '20px' : undefined,
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
                </Box>
            </Paper>
        </Box >
    );
});