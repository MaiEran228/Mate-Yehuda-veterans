import { useState, useEffect } from 'react';
import {
    Box, Paper, TextField, Button, Typography,
    IconButton, InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import backgtoundLoginpage from '../assets/backgtoundLoginpage.jpg';
import { auth } from '../firebase';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
} from 'firebase/auth';
import SignupModal from '../components/SignupModal';
import ForgotPassword from '../components/ForgotPassword';


export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authOK, setAuthOK] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);


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
                backgroundImage: `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${backgtoundLoginpage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                imageRendering: '-webkit-optimize-contrast',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                willChange: 'transform',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale'
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
                <Box sx={{
                    position: 'absolute',
                    top: -50,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="90"
                        viewBox="0 0 24 24"
                        fill="rgb(65, 85, 115)"
                    >
                        <g
                            style={{
                                transformOrigin: '12px 8px',
                                transform: authOK ? 'rotate(-25deg) translateY(-4px)' : 'none',
                                transition: 'transform 0.4s ease',
                            }}
                        >
                            {/* Arc (shackle) */}
                            <path d="M16 8V6a4 4 0 00-8 0v2h2V6a2 2 0 014 0v2h2z" />
                        </g>

                        {/* Lock body */}
                        <path d="M5 8h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2zm7 10a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>

                </Box>

                {/* תוכן התחברות */}
                <Typography variant="h6" align="center" mb={4} color="rgb(65, 85, 115)">
                    התחברות
                </Typography>

                <TextField
                    fullWidth
                    label="אימייל"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: 'rgb(65, 85, 115)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgb(65, 85, 115)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgb(65, 85, 115)',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgb(65, 85, 115)',
                            '&.Mui-focused': {
                                color: 'rgb(65, 85, 115)',
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: 'rgb(65, 85, 115)',
                        },
                    }}
                />

                <TextField
                    fullWidth
                    label="סיסמא"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    sx={{ 
                        mb: 1,
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: 'rgb(65, 85, 115)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgb(65, 85, 115)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgb(65, 85, 115)',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgb(65, 85, 115)',
                            '&.Mui-focused': {
                                color: 'rgb(65, 85, 115)',
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: 'rgb(65, 85, 115)',
                        },
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton 
                                    onClick={() => setShowPassword(!showPassword)}
                                    sx={{ color: 'rgb(65, 85, 115)' }}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <Typography
                    variant="body2"
                    align="right"
                    sx={{ mb: 2, cursor: 'pointer', color: 'rgb(65, 85, 115)' }}
                    onClick={() => setShowForgotPassword(true)}
                >
                    שכחת סיסמא?
                </Typography>

                <Typography
                    variant="body2"
                    align="right"
                    sx={{ mb: 2, cursor: 'pointer', color: 'rgb(65, 85, 115)' }}
                    onClick={() => setShowSignup(true)}
                >
                    משתמש חדש?
                </Typography>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogin}
                    sx={{
                        backgroundColor: 'rgb(65, 85, 115)',
                        height: 50,
                        boxShadow: '0px 6px 15px rgba(0,0,0,0.5)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: 'rgba(65, 85, 115, 0.8)',
                        }
                    }}
                >
                    היכנס
                </Button>
            </Paper>
            <SignupModal
                open={showSignup}
                onClose={() => setShowSignup(false)}
            />
            {showForgotPassword && (
                <ForgotPassword onClose={() => setShowForgotPassword(false)} />
            )}
        </Box>

    );
}