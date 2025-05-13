import { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    IconButton,
    InputAdornment,
    Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AppleIcon from '@mui/icons-material/Apple';
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        if (email === 'admin' && password === '1234') {
            onLogin();
        } else {
            alert('שם משתמש או סיסמה שגויים');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100vw',
                backgroundImage: 'url("/src/assets/background.jpg")', // ודא שהתמונה קיימת
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    p: 4,
                    width: 400,
                    borderRadius: 4,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h6">התחברות</Typography>
                    <Typography variant="body2" color="text.secondary">
                        נא להכניס שם משתמש וסיסמא
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    label="שם משתמש"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="סיסמא"
                    variant="outlined"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 1 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword((prev) => !prev)}>
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Typography
                    variant="body2"
                    align="right"
                    sx={{ mb: 2, cursor: 'pointer', color: 'blue' }}
                >
                    שכחת סיסמא?
                </Typography>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleLogin}
                    sx={{
                        backgroundColor: '#000',
                        color: '#fff',
                        fontWeight: 'bold',
                        mb: 2,
                        '&:hover': {
                            backgroundColor: '#333',
                        },
                    }}
                >
                    היכנס
                </Button>


            </Paper>
        </Box>
    );
}
