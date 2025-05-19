import { useState, useEffect } from 'react';
import {
    Box, Paper, TextField, Button, Typography,
    IconButton, InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';

import Sky from '../assets/Sky.jpg';
import { auth } from '../firebase';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
} from 'firebase/auth';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');           // שים לב שיניתי את המשתנה ל-email
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authOK, setAuthOK] = useState(false);

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);  // כאן משתמשים באימייל
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
                backgroundImage: `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${Sky})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Paper elevation={8} sx={{
                display: 'flex', borderRadius: 4, overflow: 'hidden',
                backdropFilter: 'blur(8px)',
            }}>
                <Box sx={{ p: 4, width: 360, background: 'rgba(255,255,255,0.75)' }}>
                    <Typography variant="h6" align="center" mb={3}>התחברות</Typography>

                    <TextField
                      fullWidth
                      label="אימייל"        // שדה אימייל במקום שם משתמש
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

                    <Typography variant="body2" align="right"
                        sx={{ mb: 2, cursor: 'pointer', color: 'primary.main' }}>
                        שכחת סיסמא?
                    </Typography>

                    <Button fullWidth variant="contained" onClick={handleLogin}>
                        היכנס
                    </Button>
                </Box>

                <Box sx={{
                    width: 220,
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(120deg,#b2e0ff 0%,#d5f3ff 100%)',
                }}>
                    <Box sx={{ clipPath: 'inset(30px 0 0 0)' }}>
                        <LockIcon sx={{ fontSize: 90, color: 'white' }} />
                    </Box>

                    <svg width={90} height={90} style={{
                        position: 'absolute',
                        transformOrigin: '45px 32px',
                        transform: authOK
                            ? 'translateY(-22px) rotate(-25deg)'
                            : 'none',
                        transition: 'transform 0.4s ease',
                    }}>
                        <path
                            d="M25 45 v-20 a20 20 0 0 1 40 0 v20"
                            fill="none"
                            stroke="white"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                    </svg>
                </Box>
            </Paper>
        </Box>
    );
}