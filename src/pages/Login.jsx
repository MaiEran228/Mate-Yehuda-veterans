import { useState, useEffect } from 'react';
import {
    Box, Paper, TextField, Button, Typography,
    IconButton, InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import r3 from '../assets/Sky.jpg';
import { auth } from '../firebase';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
} from 'firebase/auth';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authOK, setAuthOK] = useState(false);

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setAuthOK(true);
            setTimeout(onLogin, 800);
        } catch (err) {
            alert('אימייל או סיסמה שגויים');
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, user => {
            if (user) console.log('Logged-in:', user.email);
        });
        return unsub;
    }, []);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100vw',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundImage: `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${r3})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Paper elevation={8} sx={{
                borderRadius: 4,
                overflow: 'visible',
                backdropFilter: 'blur(12px)',
                background: 'rgba(255, 255, 255, 0.25)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                width: 500,
                height: 300,
                px: 3,
                pt: 8,
                pb: 4,
                position: 'relative',
            }}>

                {/* מנעול למעלה באמצע – ללא עיגול */}
                <Box sx={{
                    position: 'absolute',
                    top: -50,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    <svg width={70} height={50} style={{
                        transformOrigin: '35px 40px',
                        transform: authOK
                            ? 'translateY(-20px) rotate(-25deg)'
                            : 'none',
                        transition: 'transform 0.4s ease',
                    }}>
                        <path
                            d="M20 45 v-20 a15 15 0 0 1 30 0 v20"
                            fill="none"
                            stroke="#aaa"
                            strokeWidth="6"
                            strokeLinecap="round"
                        />
                    </svg>

                    <svg xmlns="http://www.w3.org/2000/svg" height="70" viewBox="0 0 24 24" fill="#444" style={{ marginTop: '-16px' }}>
                        <path d="M6 10h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2zm6 6a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                </Box>

                {/* תוכן התחברות */}
                <Typography variant="h6" align="center" mb={4} color="grey">
                    התחברות
                </Typography>

                <TextField
                    fullWidth
                    label="אימייל"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="סיסמא"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    sx={{ mb: 1 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <Typography
                    variant="body2"
                    align="right"
                    sx={{ mb: 2, cursor: 'pointer', color: 'grey' }}
                >
                    שכחת סיסמא?
                </Typography>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogin}
                    sx={{
                        backgroundColor: '#aaa',
                        height:50,
                        boxShadow: '0px 6px 15px rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: '#888',
                        }
                    }}
                >
                    היכנס
                </Button>
            </Paper>
        </Box>
    );
}