import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, InputAdornment
} from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ErrorDialog from '../ErrorDialog';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function SignupModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorDialog({ open: true, message: 'יש למלא את כל השדות' });
      return;
    }
    if (password !== confirmPassword) {
      setErrorDialog({ open: true, message: 'הסיסמאות לא תואמות' });
      return;
    }
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Save the username in Firestore with the email as ID
      await setDoc(doc(db, 'users', email), {
        username: username.trim(),
        email: email,
        createdAt: new Date().toISOString()
      });
      alert("ההרשמה בוצעה בהצלחה");
      // Reset fields
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      onClose();
    } catch (err) {
      setErrorDialog({ open: true, message: 'שגיאה בהרשמה: ' + err.message });
    }
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fff',
      borderRadius: 2,
      border: '1px solid rgb(82, 106, 109)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#b2ebf2',
    },
    '& .MuiInputBase-input': {
      direction: 'rtl',
    },
  };

  return (
    <>
      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, message: '' })}
        title="שגיאה"
      >
        {errorDialog.message === 'יש למלא את כל השדות' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
            <ErrorOutlineIcon style={{ color: 'rgb(105, 148, 179)', fontSize: 48, marginBottom: 8 }} />
            <span style={{ color: 'rgb(105, 148, 179)', fontWeight: 700, fontSize: 18, textAlign: 'center' }}>יש למלא את כל השדות</span>
            <span style={{ color: '#555', fontSize: 15, textAlign: 'center', marginTop: 4 }}>אנא מלא/י את כל השדות לפני ההרשמה</span>
          </div>
        ) : errorDialog.message === 'הסיסמאות לא תואמות' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
            <ErrorOutlineIcon style={{ color: 'rgb(105, 148, 179)', fontSize: 48, marginBottom: 8 }} />
            <span style={{ color: 'rgb(105, 148, 179)', fontWeight: 700, fontSize: 18, textAlign: 'center' }}>הסיסמאות לא תואמות</span>
            <span style={{ color: '#555', fontSize: 15, textAlign: 'center', marginTop: 4 }}>יש להקליד פעמיים את אותה הסיסמה</span>
          </div>
        ) : (
          errorDialog.message
        )}
      </ErrorDialog>
      <Dialog open={open} onClose={onClose}
        PaperProps={{
          sx: {
            borderRadius: 4,
            minWidth: 380,
            maxWidth: 480,
            background: '#fff',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            p: 4,
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgb(105, 148, 179)',
          fontWeight: 700,
          fontSize: '2rem',
          mb: 2
        }}>
          <PersonAddIcon sx={{ fontSize: 32, color: 'rgb(114, 152, 179)', ml: 1 }} />
          הרשמת משתמש חדש
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            placeholder="שם משתמש"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            sx={inputStyle}
          />
          <TextField
            placeholder="הכנס מייל"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            sx={inputStyle}
          />
          <TextField
            placeholder="הכנס סיסמא"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            sx={inputStyle}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            placeholder="אימות סיסמא"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            fullWidth
            sx={inputStyle}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pt: 2 }}>
          <Button onClick={onClose} sx={{
            color: 'rgb(114, 152, 179)',
            fontWeight: 600,
            border: '1px solid rgb(114, 152, 179)',
            background: 'transparent',
            borderRadius: 2,
            px: 4,
            '&:focus': { outline: 'none', border: 'none' },
            '&:active': { outline: 'none', border: 'none' }
          }}>
            ביטול
          </Button>
          <Button onClick={handleSignup} sx={{
            background: 'rgb(114, 152, 179)',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            borderRadius: 2,
            px: 4,
            '&:hover': { background: 'rgb(90, 130, 160)' },
            '&:focus': { outline: 'none', border: 'none' },
            '&:active': { outline: 'none', border: 'none' }
          }}>
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}