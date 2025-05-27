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

            {/* חלק עליון - בתוך Container צר */}
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* תאריך */}
                <Typography variant="h5" gutterBottom>
                    תאריך: {todayFormatted}
                </Typography>

                {/* שורת חיפוש */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                    <TextField
                        label="מיון לפי"
                        select
                        SelectProps={{ native: true }}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        size="small"
                        sx={{
                            width: '160px',
                            '& .MuiInputBase-root': {
                                height: '36px',
                                fontSize: '0.8rem',
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '0.75rem',
                                top: '-6px',
                            },
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
                            width: '220px',
                            '& .MuiInputBase-root': {
                                height: '36px',
                                fontSize: '0.8rem',
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '0.75rem',
                                top: '-6px',
                            },
                        }}
                    />
                </Box>
            </Container>

            {/* אזור הטבלה והכפתורים */}
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

                    {/* הטבלה */}
                    <Box sx={{ width: '700px', maxWidth: '900px', height: 400, overflowY: 'auto', mx: 'auto' }}>
                        <AttendanceTable
                            ref={attendanceRef}
                            search={search}
                            sortBy={sortBy}
                            onAttendanceChange={handleAttendanceUpdate}
                        />
                    </Box>

                    {/* פאנל צדדי */}
                    <Box sx={{
                        width: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        p: 2,

                    }}>
                        <Box sx={{
                            p: 2,
                            backgroundColor: '#e3f2fd',
                            borderRadius: 1,
                            textAlign: 'center'
                        }}>
                            <Typography variant="h6" color="primary">
                                נוכחים היום
                            </Typography>
                            <Typography variant="h4" color="primary" fontWeight="bold">
                                {attendanceCount}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSave}
                            fullWidth
                            size="large"
                        >
                            שמירה
                        </Button>

                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => navigate('/AllReports/DailyAttendance', { state: { from: 'home' } })}
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