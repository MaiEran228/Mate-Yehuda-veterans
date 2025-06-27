import { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Modal, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Header from '../components/ToolBarMUI'; // סרגל כלים קבוע
import AttendanceTable from '../components/AttendanceTable'; // הטבלה
import PDFAbsencePeople from '../components/PDFAbsencePeople'; // קומפוננטת ייצוא PDF
import dayjs from 'dayjs';
import DailyAttendance from "./AllReports/DailyAttendance";
import { useNavigate } from 'react-router-dom';
import CustomDialog from '../components/CustomDialog';

import { saveAttendanceForDate, fetchAllProfiles, fetchAttendanceByDate } from '../firebase'; // יבוא הפונקציה החדשה

// מיפוי ימים לעברית
const daysMap = {
  0: "יום א'",
  1: "יום ב'",
  2: "יום ג'",
  3: "יום ד'",
  4: "יום ה'",
  5: "יום ו'",
  6: "שבת"
};

function Home({ onLogout }) {
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
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column', mt:1,
            overflow: 'hidden' // מונע גלילה בכלל
        }}>
            <Header onLogout={onLogout} />
           
            {/* Static Content Container */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 0',
                overflow: 'hidden' // מונע גלילה
            }}>
                {/* Header Section with Date and Buttons */}
                <Box sx={{
                    width: '95%',
                    maxWidth: '1800px',
                    margin: '0 auto 24px auto', // מרווח קבוע מהטבלה
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
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
                        <Typography sx={{ ml: 1, minWidth: 60, color: 'rgba(64, 99, 112, 0.72)', fontWeight: 600, fontSize: '1.5rem' }}>
                          {daysMap[dayjs(today).day()]}
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

                {/* Table Section - Static Position */}
                <Box sx={{
                    width: '95%',
                    maxWidth: '1800px',
                    margin: '0 auto',
                    flex: 1
                }}>
                    <AttendanceTable
                        ref={attendanceRef}
                        onAttendanceChange={handleAttendanceUpdate}
                    />
                </Box>
            </Box>

            {/* Dialog */}
            <CustomDialog
                open={dialog.open}
                onClose={handleDialogClose}
                title={dialog.isSuccess ? 'שמירת נתונים' : 'שגיאה'}
                dialogContentSx={{ mt: 2 }}
                actions={
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
                }
            >
                <Typography variant="body1" sx={{
                    textAlign: 'right',
                    color: dialog.isSuccess ? 'black' : '#d32f2f',
                    fontSize: '1.1rem',
                    fontWeight: 500
                }}>
                    {dialog.message}
                </Typography>
            </CustomDialog>
        </Box>
    );
}
export default Home;
