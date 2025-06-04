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

    // הגדרת רקע תכלת לכל המסך
    useEffect(() => {
        document.body.style.backgroundColor = '#ebf1f5';
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, mb: 2, mr: 3 }}>
                {/* תאריך - מיושר לימין ובולט */}
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 'bold',
                        fontSize: '2rem',
                        color: 'rgb(85, 105, 125)'
                    }}
                >
                    {todayFormatted}
                </Typography>
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
                            color: 'rgb(85, 105, 125)', '& fieldset': { borderColor: 'rgb(85, 105, 125)' },
                            '&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#7b8f99' }
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
                    sx={{ width: 280, '& .MuiOutlinedInput-root': { height: 36, fontSize: '0.8rem',
                        color: 'rgb(85, 105, 125)', '& fieldset': { borderColor: 'rgb(85, 105, 125)' },
                         '&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#7b8f99' } },
                          '& .MuiInputLabel-root': { fontSize: '0.75rem', top: '-6px',
                             color: 'rgb(85, 105, 125)', '&.Mui-focused': { color: '#7b8f99' } } }}
                />
            </Box>


            {/* אזור הטבלה והכפתורים */}
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', }}>

                    {/* הטבלה */}
                    <Box sx={{ width: '1300px', maxWidth: '1300px', overflowY: 'auto', mx: 'auto', borderRadius: '19px', }}>
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
                        gap: 2, p: 2, mt: '130px',
                        ml: -22 // מזיז את הפאנל יותר שמאלה
                    }}>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: 'rgb(233, 241, 247)', // גוון רקע תואם לגוון העיקרי
                                borderRadius: 2,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                color: 'rgb(85, 105, 125)', // צבע טקסט כהה יחסית שמשתלב
                                fontFamily: 'inherit',
                                boxShadow: '0 7px 15px rgba(0, 0, 0, 0.22)',
                            }}
                        >
                            <Typography variant="h6" sx={{ color: 'rgb(85, 105, 125)', fontWeight: 'bold' }}>
                                נוכחים היום
                            </Typography>
                            <Typography variant="h5" sx={{ color: 'rgb(85, 105, 125)', fontWeight: 'bold' }}>
                                {attendanceCount}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            sx={{ backgroundColor: 'rgb(200, 219, 234)', border: '1px solid rgb(175, 194, 208)', ':hover': { backgroundColor: '#rgb(185, 205, 220)' }, fontWeight: 'bold' }}
                            onClick={handleSave}
                            fullWidth
                            size="large"
                            color='black'

                        >
                            שמירה
                        </Button>

                        <Button
                            variant="outlined"
                            sx={{
                                border: '1.8px solid rgb(175, 194, 208)', color: 'rgb(175, 194, 208)', fontWeight: 'bold',
                                ':hover': {borderColor: '#7b8f99', color: '#5a676e', }
                            }} onClick={() => navigate('/AllReports/DailyAttendance', { state: { from: 'home' } })}
                            fullWidth
                            size="large"
                        >
                            הפק דוח יומי
                        </Button>
                    </Box>

                </Box>
            </Container>

        </>
    );
}

export default Home;