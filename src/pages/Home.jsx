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

            {/* חלק עליון - בתוך Container צר */}
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* תאריך */}
                <Typography variant="h5" gutterBottom>
                    תאריך: {today}
                </Typography>

                {/* שורת חיפוש + מיון */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
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
                        label="חיפוש לפי שם"
                        variant="outlined"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{
                            height: '36px',
                            minWidth: '40px',
                            fontSize: '0.8rem',
                            px: 1.5,
                        }}
                    >
                        חיפוש
                    </Button>
                </Box>

            </Container>

            {/* הטבלה - מחוץ ל־Container, עם רוחב גמיש */}
            <Box sx={{ width: '700px', mt: 3, px: 3 }}>
                <AttendanceTable search={search} sortBy={sortBy} />
            </Box>

            {/* כפתורי שמירה ודוח */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button variant="contained" color="primary">שמירה</Button>
                <Button variant="outlined" color="secondary">הפק דוח יומי</Button>
            </Box>

        </>
    );
}

export default Home;

