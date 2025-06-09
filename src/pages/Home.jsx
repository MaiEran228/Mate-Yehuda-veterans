import { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Modal, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Header from '../components/ToolBarMUI'; // סרגל כלים קבוע
import AttendanceTable from '../components/AttendanceTable'; // הטבלה
import ExportPDFButton from '../components/ExportPDFButton'; // קומפוננטת ייצוא PDF
import dayjs from 'dayjs';
import DailyAttendance from "./AllReports/DailyAttendance";
import { useNavigate } from 'react-router-dom';


import { saveAttendanceForDate, fetchAllProfiles, fetchAttendanceByDate } from '../firebase'; // יבוא הפונקציה החדשה

function Home({ onLogout }) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('אזור מגורים'); // או אזור מגורים וכו'
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState([]);
    const attendanceRef = useRef();
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();
    const today = dayjs().format('YYYY-MM-DD');
    const todayFormatted = dayjs().format('DD/MM/YYYY');
    
    // Add dialog state
    const [dialog, setDialog] = useState({
        open: false,
        message: '',
        isSuccess: false
    });

    const handleClose = () => {
        setModalOpen(false);
    };

    const handleDialogClose = () => {
        setDialog(prev => ({ ...prev, open: false }));
    };

    // 🚀 PRE-LOADING - טוען את הנתונים מוקדם
    useEffect(() => {
        const preloadData = async () => {
            try {
                // טוען את הנתונים בשקט ברקע
                const attendanceData = await fetchAttendanceByDate(today);
                if (!attendanceData?.attendanceList?.length) {
                    // אם אין נוכחות שמורה, טוען את הפרופילים
                    await fetchAllProfiles();
                }
            } catch (error) {
                console.error('Pre-loading failed:', error);
                setDialog({
                    open: true,
                    message: 'שגיאה בטעינת הנתונים',
                    isSuccess: false
                });
            }
        };
        preloadData();
    }, []); // ← רץ פעם אחת כשהקומפוננטה נטענת



    // פונקציה שתקבל את המידע על הנוכחות מהטבלה
    const handleAttendanceUpdate = (count) => {
        setAttendanceCount(count);
    };

    const handleSave = async () => {
        try {
            const rawData = attendanceRef.current?.getAttendanceData?.();
            if (!rawData) {
                setDialog({
                    open: true,
                    message: 'לא נמצאו נתונים לשמירה',
                    isSuccess: false
                });
                return;
            }

            const attendanceList = rawData.map(person => ({
                id: person.id,
                name: person.name,
                city: person.city,
                attended: person.attended,
                caregiver: person.caregiver,
                reason: person.reason
            }));

            await saveAttendanceForDate(today, attendanceList);
            setDialog({
                open: true,
                message: 'הנתונים נשמרו בהצלחה',
                isSuccess: true
            });
        } catch (error) {
            console.error('Save failed:', error);
            setDialog({
                open: true,
                message: 'שגיאה בשמירת הנתונים',
                isSuccess: false
            });
        }
    };

    const closeReport = () => {
        setShowReport(false);
    };

    // הכנת נתונים לדוח
    const presentMembers = reportData.filter(person => person.attended);
    const absentMembers = reportData.filter(person => !person.attended);

    return (
        <>
            <Header onLogout={onLogout} />
            
            {/* Main Container - Full Width */}
            <Box sx={{ 
                width: '100%', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* Search Bar */}
                <Box sx={{
                    width: '95%',
                    maxWidth: '1800px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 2,
                    mb: 2
                }}>
                    <TextField
                        label="מיון לפי"
                        select
                        SelectProps={{ native: true }}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        size="small"
                        sx={{
                            width: 200,
                            '& .MuiOutlinedInput-root': {
                                height: 36,
                                fontSize: '0.8rem',
                                color: 'rgb(85, 105, 125)',
                                '& fieldset': { borderWidth: 2, borderColor: 'rgba(64, 99, 112, 0.72)' },
                                '&:hover fieldset, &.Mui-focused fieldset': { borderWidth: 2, borderColor: '#7b8f99' }
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '0.75rem',
                                top: '-6px',
                                color: 'rgb(85, 105, 125)',
                                '&.Mui-focused': { color: '#7b8f99' }
                            }
                        }}
                    >
                        <option value="שם">שם</option>
                        <option value="אזור מגורים">אזור מגורים</option>
                    </TextField>

                    <TextField
                        label="חיפוש"
                        variant="outlined"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="small"
                        sx={{
                            width: 280,
                            '& .MuiOutlinedInput-root': {
                                height: 36,
                                fontSize: '0.8rem',
                                color: 'rgb(85, 105, 125)',
                                '& fieldset': { borderWidth: 2, borderColor: 'rgba(64, 99, 112, 0.72)' },
                                '&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#7b8f99' }
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '0.75rem',
                                top: '-6px',
                                color: 'rgb(85, 105, 125)',
                                '&.Mui-focused': { color: '#7b8f99' }
                            }
                        }}
                    />
                </Box>

                {/* Header Section with Date and Buttons */}
                <Box sx={{ 
                    width: '95%',
                    maxWidth: '1800px',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                }}>
                    {/* Date Display - Right Side */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2 
                    }}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'rgba(64, 99, 112, 0.72)',
                                fontWeight: 500,
                                fontSize: '2.8rem',
                            }}
                        >
                            {todayFormatted}
                        </Typography>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: 'rgb(233, 241, 247)',
                                borderRadius: 2,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                color: 'rgba(64, 99, 112, 0.72)',
                                fontFamily: 'inherit',
                                boxShadow: '0 7px 15px rgba(0, 0, 0, 0.22)',
                            }}
                        >
                            <Typography variant="h6" sx={{ color: 'rgba(64, 99, 112, 0.72)', fontWeight: 'bold' }}>
                                נוכחים היום
                            </Typography>
                            <Typography variant="h5" sx={{ color: 'rgba(64, 99, 112, 0.72)', fontWeight: 'bold' }}>
                                {attendanceCount}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Buttons - Left Side */}
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 2 
                    }}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
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
                            שמירה
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => navigate('/AllReports/AbsencePeople', { state: { from: 'home' } })}
                            sx={{
                                border: '2px solid rgba(64, 99, 112, 0.72)', 
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
                                minWidth: '150px'
                            }}
                        >
                            הפקת דוח היעדרות
                        </Button>
                    </Box>
                </Box>

                {/* Table Section - Full Width */}
                <Box sx={{ 
                    width: '95%',
                    maxWidth: '1800px'
                }}>
                    <AttendanceTable
                        ref={attendanceRef}
                        search={search}
                        sortBy={sortBy}
                        onAttendanceChange={handleAttendanceUpdate}
                    />
                </Box>
            </Box>

            {/* Dialog for notifications */}
            <Dialog
                open={dialog.open}
                onClose={handleDialogClose}
                dir="rtl"
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                    }
                }}
            >
                <DialogTitle sx={{ 
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    py: 2
                }}>
                    {dialog.isSuccess ? 'שמירת נתונים' : 'שגיאה'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body1" sx={{ 
                        textAlign: 'center',
                        color: dialog.isSuccess ? '#2e7d32' : '#d32f2f',
                        fontSize: '1.1rem',
                        fontWeight: 500
                    }}>
                        {dialog.message}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ 
                    borderTop: '1px solid #e0e0e0',
                    p: 2,
                    justifyContent: 'center'
                }}>
                    <Button
                        onClick={handleDialogClose}
                        variant="contained"
                        sx={{
                            backgroundColor: dialog.isSuccess ? '#2e7d32' : '#d32f2f',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: dialog.isSuccess ? '#1b5e20' : '#aa2424'
                            },
                            minWidth: '120px'
                        }}
                    >
                        אישור
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
export default Home;