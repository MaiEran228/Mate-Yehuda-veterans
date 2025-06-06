import { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Modal, Paper } from '@mui/material';
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
    const handleClose = () => {
        setModalOpen(false); // assuming you already have setModalOpen defined
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
                // לא עושים כלום, הטבלה תטען בעצמה
            }
        };
        preloadData();
    }, []); // ← רץ פעם אחת כשהקומפוננטה נטענת



    // פונקציה שתקבל את המידע על הנוכחות מהטבלה
    const handleAttendanceUpdate = (count) => {
        setAttendanceCount(count);
    };

    const handleSave = async () => {
        const rawData = attendanceRef.current?.getAttendanceData?.();
        if (!rawData) return;

        const attendanceList = rawData.map(person => ({
            id: person.id,
            name: person.name,
            city: person.city,
            attended: person.attended,
            caregiver: person.caregiver,
            reason: person.reason
        }));

        await saveAttendanceForDate(today, attendanceList);
        alert('נוכחות נשמרה בהצלחה!');
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
            {/* שורת חיפוש */}
            <Box sx={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'center', gap: 2, mt: 2, mb: 2, mr: -5
            }}>
                <TextField
                    label="מיון לפי"
                    select
                    SelectProps={{ native: true }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    size="small"
                    sx={{
                        width: 200, '& .MuiOutlinedInput-root': {
                            height: 36, fontSize: '0.8rem',
                            color: 'rgb(85, 105, 125)', '& fieldset': {borderWidth: 2,borderColor: 'rgba(64, 99, 112, 0.72)' },
                            '&:hover fieldset, &.Mui-focused fieldset': { borderWidth: 2,borderColor: '#7b8f99' }
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '0.75rem', top: '-6px',
                            color: 'rgb(85, 105, 125)', '&.Mui-focused': { color: '#7b8f99' }
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
                        width: 280, '& .MuiOutlinedInput-root': {
                            height: 36, fontSize: '0.8rem',
                            color: 'rgb(85, 105, 125)', '& fieldset': {  borderWidth: 2, borderColor: 'rgba(64, 99, 112, 0.72)' },
                            '&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#7b8f99' }
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '0.75rem', top: '-6px',
                            color: 'rgb(85, 105, 125)', '&.Mui-focused': { color: '#7b8f99' }
                        }
                    }}
                />
            </Box>


            {/* אזור הטבלה והכפתורים */}
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', }}>

                    {/* הטבלה */}
                    <Box sx={{
                        width: '1300px', maxWidth: '1300px', overflowY: 'auto', mx: 'auto', borderRadius: '12px 12px 8px 8px',
                    }}>
                        <AttendanceTable
                            ref={attendanceRef}
                            search={search}
                            sortBy={sortBy}
                            onAttendanceChange={handleAttendanceUpdate}
                        />
                    </Box>

                    {/* פאנל צדדי */}
                    <Box sx={{
                        width: '200px', minWidth: '220px', display: 'flex', flexDirection: 'column',
                        gap: 2, p: 2, mt: '80px',
                        ml: -22 // מזיז את הפאנל יותר שמאלה
                    }}>
                        {/* תאריך מעוצב */}
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'rgba(64, 99, 112, 0.72)',
                                fontWeight: 500,
                                fontSize: '2.8rem',
                                textAlign: 'center',

                            }}
                        >
                            {todayFormatted}
                        </Typography>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: 'rgb(233, 241, 247)', // גוון רקע תואם לגוון העיקרי
                                borderRadius: 2,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                color: 'rgba(64, 99, 112, 0.72)', // צבע טקסט כהה יחסית שמשתלב
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

                        <Button
                            variant="contained"
                            sx={{ 
                                backgroundColor: 'rgba(142, 172, 183, 0.72)', 
                                border: 'none',
                                outline: 'none',
                                ':hover': { 
                                    backgroundColor: '#rgb(185, 205, 220)',
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
                                }
                            }}
                            onClick={handleSave}
                            fullWidth
                            size="large"
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
                                }
                            }}
                            fullWidth
                            size="large"
                        >
                            הפקת דוח היעדרות
                        </Button>
                    </Box>

                </Box>
            </Container>
        </>
    );
}
export default Home;