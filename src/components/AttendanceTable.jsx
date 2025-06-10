import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, TextField, Paper, MenuItem, Box, Skeleton, CircularProgress, TableSortLabel, Tooltip, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
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

export default forwardRef(function AttendanceTable({ onAttendanceChange }, ref) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('city');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter rows based on search query
    const filteredRows = rows.filter(row => {
        const searchLower = searchQuery.toLowerCase();
        return row.name?.toLowerCase().includes(searchLower) ||
               row.city?.toLowerCase().includes(searchLower);
    });

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedRows = [...filteredRows].sort((a, b) => {
        if (!a[orderBy] || !b[orderBy]) return 0;
        
        const comparison = a[orderBy].toLowerCase().localeCompare(b[orderBy].toLowerCase());
        return order === 'asc' ? comparison : -comparison;
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
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Search Field - Fixed */}
                <Box
                    sx={{
                        p: 2,
                        backgroundColor: 'rgba(142, 172, 183, 0.2)',
                        borderBottom: '1px solid rgba(118, 126, 136, 0.2)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2
                    }}
                >
                    <TextField
                        fullWidth
                        placeholder="חיפוש לפי שם או אזור מגורים..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setSearchQuery('')}
                                        edge="end"
                                        sx={{ mr: -0.5 }}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: {
                                backgroundColor: '#fff',
                                '&:hover': {
                                    backgroundColor: '#fff',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(118, 126, 136, 0.2)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(118, 126, 136, 0.4)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(118, 126, 136, 0.6)',
                                },
                            },
                        }}
                        sx={{
                            maxWidth: '400px',
                            '& .MuiInputBase-root': {
                                height: '40px',
                            },
                        }}
                    />
                </Box>

                {/* Table Headers - Fixed */}
                    <Table
                        size="small"
                        sx={{
                            direction: 'rtl',
                            borderCollapse: 'collapse',
                            width: '100%',
                            tableLayout: 'fixed',
                            '& th, & td': {
                            py: 0.5,
                                px: 1,
                                fontSize: '1rem',
                            },
                    }}
                >
                    <TableHead
                        sx={{
                            position: 'sticky',
                            top: '76px',
                            backgroundColor: 'rgba(142, 172, 183, 0.72)',
                            zIndex: 1,
                        }}
                    >
                            <TableRow>
                            <TableCell 
                                align="right" 
                                sx={{ 
                                    width: '30%', 
                                    backgroundColor: 'rgba(142, 172, 183, 0.72)', 
                                    height: '52px', 
                                    fontSize: '1.1rem', 
                                    fontWeight: 'bold',
                                    '& .MuiTableSortLabel-root': {
                                        '&:hover': {
                                            color: 'rgba(0, 0, 0, 0.87)',
                                        },
                                        '&.MuiTableSortLabel-active': {
                                            color: 'rgba(0, 0, 0, 0.87)',
                                            '& .MuiTableSortLabel-icon': {
                                                color: 'rgba(0, 0, 0, 0.87)',
                                            },
                                        },
                                    },
                                }}
                            >
                                <Tooltip 
                                    title="מיון לפי אזור מגורים" 
                                    placement="top"
                                    arrow
                                >
                                    <TableSortLabel
                                        active={orderBy === 'city'}
                                        direction={orderBy === 'city' ? order : 'asc'}
                                        onClick={() => handleSort('city')}
                                        sx={{
                                            '& .MuiTableSortLabel-icon': {
                                                marginRight: '8px',
                                                marginLeft: '0',
                                                opacity: 0.7,
                                                '&:hover': {
                                                    opacity: 1,
                                                },
                                            },
                                        }}
                                    >
                                        אזור מגורים
                                    </TableSortLabel>
                                </Tooltip>
                            </TableCell>
                            <TableCell 
                                align="right" 
                                sx={{ 
                                    width: '30%', 
                                    backgroundColor: 'rgba(142, 172, 183, 0.72)', 
                                    height: '52px', 
                                    fontSize: '1.1rem', 
                                    fontWeight: 'bold',
                                    '& .MuiTableSortLabel-root': {
                                        '&:hover': {
                                            color: 'rgba(0, 0, 0, 0.87)',
                                        },
                                        '&.MuiTableSortLabel-active': {
                                            color: 'rgba(0, 0, 0, 0.87)',
                                            '& .MuiTableSortLabel-icon': {
                                                color: 'rgba(0, 0, 0, 0.87)',
                                            },
                                        },
                                    },
                                }}
                            >
                                <Tooltip 
                                    title="מיון לפי שם" 
                                    placement="top"
                                    arrow
                                >
                                    <TableSortLabel
                                        active={orderBy === 'name'}
                                        direction={orderBy === 'name' ? order : 'asc'}
                                        onClick={() => handleSort('name')}
                                        sx={{
                                            '& .MuiTableSortLabel-icon': {
                                                marginRight: '8px',
                                                marginLeft: '0',
                                                opacity: 0.7,
                                                '&:hover': {
                                                    opacity: 1,
                                                },
                                            },
                                        }}
                                    >
                                        שם
                                    </TableSortLabel>
                                </Tooltip>
                            </TableCell>
                                <TableCell align="right" sx={{ width: '10%', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontSize: '1.1rem', fontWeight: 'bold' }}>נוכח</TableCell>
                                <TableCell align="right" sx={{ width: '10%', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontSize: '1.1rem', fontWeight: 'bold' }}>מטפל</TableCell>
                                <TableCell align="right" sx={{ width: '20%', backgroundColor: 'rgba(142, 172, 183, 0.72)', height: '52px', fontSize: '1.1rem', fontWeight: 'bold' }}>סיבה להיעדרות</TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>

                {/* Table Body - Scrollable */}
                    <TableContainer
                        sx={{
                        flexGrow: 1,
                            overflowY: 'auto',
                            direction: 'ltr',
                        maxHeight: 'calc(100vh - 340px)', // הקטנתי את גובה הטבלה
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
                                py: 0,
                                    px: 1,
                                    fontSize: '1rem',
                                height: '40px',
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
                                                <Box sx={{ height: 40 }} />
                                                ) : (
                                                    <TextField
                                                        select
                                                    placeholder="בחר סיבה"
                                                        variant="standard"
                                                        value={profile.reason}
                                                        onChange={(e) => handleReasonChange(profile.id, e.target.value)}
                                                        fullWidth
                                                    SelectProps={{
                                                        displayEmpty: true,
                                                        renderValue: (value) => value || "בחר סיבה",
                                                        MenuProps: {
                                                            disableScrollLock: true,
                                                            PaperProps: {
                                                                style: {
                                                                    maxHeight: 250
                                                                }
                                                            }
                                                        }
                                                    }}
                                                        sx={{
                                                            fontSize: '0.8rem',
                                                        height: '36px',
                                                            '& .MuiInputBase-root': {
                                                            height: '40px',
                                                            fontSize: '0.9rem',
                                                            '&:before': {
                                                                borderBottomColor: 'rgba(0, 0, 0, 0.2)',
                                                            },
                                                            '&:hover:not(.Mui-disabled):before': {
                                                                borderBottomColor: 'rgba(0, 0, 0, 0.4)',
                                                            },
                                                            '&.Mui-focused:after': {
                                                                borderBottomColor: 'rgba(0, 0, 0, 0.6)',
                                                            }
                                                            },
                                                            '& .MuiSelect-select': {
                                                                paddingTop: '4px',
                                                            paddingBottom: '4px',
                                                            color: profile.reason ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.4)',
                                                            },
                                                        }}
                                                    >
                                                        {reasonOptions.map((option) => (
                                                            <MenuItem 
                                                                key={option} 
                                                                value={option}
                                                                sx={{
                                                                    fontSize: '0.9rem',
                                                                    minHeight: '35px',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(142, 172, 183, 0.1)',
                                                                    },
                                                                    '&.Mui-selected': {
                                                                        backgroundColor: 'rgba(142, 172, 183, 0.2)',
                                                                        '&:hover': {
                                                                            backgroundColor: 'rgba(142, 172, 183, 0.3)',
                                                                        }
                                                                    }
                                                                }}
                                                            >
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