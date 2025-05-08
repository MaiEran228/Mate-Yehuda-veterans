import { useState } from 'react';
import { Container, Typography, Box, Button, TextField } from '@mui/material';
import Header from '../components/ToolBarMUI'; // סרגל כלים קבוע
import AttendanceTable from '../components/AttendanceTable'; // הטבלה
import dayjs from 'dayjs';

function Home() {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('שם'); // או אזור מגורים וכו'

    const today = dayjs().format('DD/MM/YYYY');

    return (
        <>
            <Header />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* תאריך */}
                <Typography variant="h5" gutterBottom>
                    תאריך: {today}
                </Typography>

                {/* שורת חיפוש + מיון */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        label="חיפוש לפי שם"
                        variant="outlined"
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button variant="contained" color="primary">
                        חיפוש
                    </Button>
                    <TextField
                        label="מיון לפי"
                        select
                        SelectProps={{ native: true }}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="שם">שם</option>
                        <option value="אזור מגורים">אזור מגורים</option>
                    </TextField>
                </Box>


                {/* טבלה */}
                <AttendanceTable search={search} sortBy={sortBy} />

                {/* כפתורים */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button variant="contained" color="primary">שמירה</Button>
                    <Button variant="outlined" color="secondary">הפק דוח יומי</Button>
                </Box>
            </Container>
        </>
    );
}

export default Home;