import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, InputAdornment
} from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function SignupModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("הסיסמאות לא תואמות");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("ההרשמה בוצעה בהצלחה");
      onClose();
    } catch (err) {
      alert("שגיאה בהרשמה: " + err.message);
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
          px: 4
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
          '&:hover': { background: 'rgb(90, 130, 160)' }
        }}>
          שמור
        </Button>
      </DialogActions>
    </Dialog>
  );
}