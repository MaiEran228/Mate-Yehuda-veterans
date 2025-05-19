import { useState } from 'react';
import { Container, Typography, Box, Button, TextField } from '@mui/material';
import Header from '../components/ToolBarMUI'; // סרגל כלים קבוע
import AttendanceTable from '../components/AttendanceTable'; // הטבלה
import dayjs from 'dayjs';

function Home() {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('שם'); // או אזור מגורים וכו'
    const [attendanceCount, setAttendanceCount] = useState(0);

    const today = dayjs().format('DD/MM/YYYY');

    // פונקציה שתקבל את המידע על הנוכחות מהטבלה
    const handleAttendanceUpdate = (count) => {
        setAttendanceCount(count);
    };

    return (
        <>
            <Header />

            {/* חלק עליון - בתוך Container צר */}
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* תאריך */}
                <Typography variant="h5" gutterBottom>
                    תאריך: {today}
                </Typography>

                {/* שורת חיפוש + כפתורים + COUNTER */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>

                    {/* COUNTER */}
                    <Box sx={{ minWidth: '80px', fontWeight: 'bold', fontSize: '1rem' }}>
                        נוכחים: {attendanceCount}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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

                        <Button variant="contained" color="primary">שמירה</Button>
                        <Button variant="outlined" color="secondary">הפק דוח יומי</Button>
                    </Box>
                </Box>
            </Container>

            {/* הטבלה */}
            <Box sx={{ width: '700px', mt: 0, px: 3 }}>
                <AttendanceTable search={search} sortBy={sortBy} onAttendanceChange={handleAttendanceUpdate} />
            </Box>
        </>
    );
}

export default Home;
