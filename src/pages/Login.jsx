import { useState, useEffect } from 'react';
import {
    Box, Paper, TextField, Button, Typography,
    IconButton, InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import backgtoundLoginpage from '../assets/backgtoundLoginpage.jpg';
import loginOlder from '../assets/LoginOlder.jpg';
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
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgb(237, 243, 244)',
            }}
        >
            <Paper
                elevation={10}
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    borderRadius: 10,
                    borderColor:'rgb(251, 251, 251)',
                    overflow: 'hidden',
                    minWidth: { xs: 340, md: 900 },
                    maxWidth: 1100,
                    minHeight: { xs: 420, md: 600 },
                    boxShadow: '0 32px 52px 0 rgba(31, 38, 135, 0.18)',
                    position: 'relative',
                    background: 'rgba(255,255,255,0.98)',
                }}
            >
                {/* Left Image Section */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '40%' },
                        minHeight: { xs: 160, md: '100%' },
                        background: `url(${loginOlder}) center center/cover no-repeat`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
                {/* Right Login Section */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '60%' },
                        minHeight: { xs: 'auto', md: '100%' },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg,rgb(235, 244, 244) 0%,rgb(229, 245, 248) 100%)',
                    }}
                >
                    <Box sx={{
                        width: '100%',
                        maxWidth: 420,
                        px: { xs: 2, md: 4 },
                        py: { xs: 3, md: 0 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                    }}>
                        <Box sx={{
                            position: 'absolute',
                            top: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 2,
                            width: 100,
                            height: 100,
                        }}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="100"
                                viewBox="0 0 24 28"
                                fill="rgb(105, 148, 179)"
                                style={{ overflow: 'visible' }}
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
                        <Box sx={{ height: 110, mb: 1 }} /> {/* Spacer for lock icon, increased height to prevent cut-off */}
                        <Typography variant="h5" align="center" mb={3} color="rgb(105, 148, 179)" fontWeight={700}>
                            התחברות
                        </Typography>
                        <TextField
                            fullWidth
                            label="אימייל"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            sx={{
                                mb: 2,
                                background: '#fff',
                                borderRadius: 2,
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    background: '#fff',
                                    borderRadius: 2,
                                    transition: 'background 0.2s',
                                    '&.Mui-focused': {
                                        background: '#fff',
                                    },
                                },
                                '& input:-webkit-autofill': {
                                    WebkitBoxShadow: '0 0 0 1000px #fff inset',
                                    boxShadow: '0 0 0 1000px #fff inset',
                                    WebkitTextFillColor: '#222',
                                },
                                '& input:-webkit-autofill:focus': {
                                    WebkitBoxShadow: '0 0 0 1000px #fff inset',
                                    boxShadow: '0 0 0 1000px #fff inset',
                                    WebkitTextFillColor: '#222',
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
                                background: '#fff',
                                borderRadius: 2,
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    background: '#fff',
                                    borderRadius: 2,
                                    transition: 'background 0.2s',
                                    '&.Mui-focused': {
                                        background: '#fff',
                                    },
                                },
                                '& input:-webkit-autofill': {
                                    WebkitBoxShadow: '0 0 0 1000px #fff inset',
                                    boxShadow: '0 0 0 1000px #fff inset',
                                    WebkitTextFillColor: '#222',
                                },
                                '& input:-webkit-autofill:focus': {
                                    WebkitBoxShadow: '0 0 0 1000px #fff inset',
                                    boxShadow: '0 0 0 1000px #fff inset',
                                    WebkitTextFillColor: '#222',
                                },
                            }}
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
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleLogin}
                            sx={{
                                background: 'rgb(114, 152, 179)',
                                height: 48,
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                color: 'white',
                                borderRadius: 3,
                                boxShadow: '0px 6px 15px rgba(0,0,0,0.08)',
                                mt: 2,
                                mb: 2,
                                '&:hover': {
                                    background: 'rgb(109, 169, 212)',
                                }
                            }}
                        >
                            כניסה
                        </Button>
                        {/* Stacked text buttons for forgot password and sign up */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 1, mb: 2 }}>
                            <Button
                                variant="text"
                                onClick={() => setShowForgotPassword(true)}
                                sx={{
                                    color: 'rgb(105, 148, 179)',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    textDecoration: 'underline',
                                    border: 'none',
                                    minWidth: 0,
                                    p: 0,
                                    mb: 0.5,
                                    '&:hover': {
                                        background: 'none',
                                        color: 'rgb(84, 149, 196)',
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                שכחתי סיסמא
                            </Button>
                            <Button
                                variant="text"
                                onClick={() => setShowSignup(true)}
                                sx={{
                                    color: 'rgb(105, 148, 179)',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    textDecoration: 'underline',
                                    border: 'none',
                                    minWidth: 0,
                                    p: 0,
                                    '&:hover': {
                                        background: 'none',
                                        color: 'rgb(84, 149, 196)',
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                משתמש חדש
                            </Button>
                        </Box>
                        {/* End stacked text buttons */}
                    </Box>
                    <SignupModal open={showSignup} onClose={() => setShowSignup(false)} />
                    {showForgotPassword && (
                        <ForgotPassword onClose={() => setShowForgotPassword(false)} />
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
