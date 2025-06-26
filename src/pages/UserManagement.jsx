import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, TextField, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import DeleteIcon from '@mui/icons-material/Delete';
import { auth, db } from '../firebase';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import ForgotPasswordModal from '../components/ForgotPassword';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function UserManagement() {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleTabChange = (e, newValue) => setTab(newValue);

  // מעקב אחר מצב האימות וקריאת שם המשתמש
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.email);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUsername(userData.username || 'משתמש');
            setUsername(userData.username || '');
          } else {
            // אם אין מסמך, יצירת מסמך חדש עם שם משתמש ברירת מחדל
            const defaultUsername = user.email.split('@')[0]; // שם משתמש מהמייל
            await setDoc(userDocRef, {
              username: defaultUsername,
              email: user.email,
              uid: user.uid,
              createdAt: new Date().toISOString()
            });
            setCurrentUsername(defaultUsername);
            setUsername(defaultUsername);
          }
        } catch (error) {
          console.error('שגיאה בקריאת נתוני המשתמש:', error);
          setCurrentUsername('משתמש');
        }
      } else {
        setCurrentUser(null);
        setCurrentUsername('');
        setUsername('');
      }
    });

    return () => unsubscribe();
  }, []);

  // שינוי שם משתמש - עם יצירת מסמך אם לא קיים
  const handleChangeUsername = async () => {
    if (!currentUser || !username.trim()) return;
    
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.email);
      
      // יצירה או עדכון של המסמך
      await setDoc(userDocRef, {
        username: username.trim(),
        email: currentUser.email,
        uid: currentUser.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true }); // merge: true משמר נתונים קיימים ומעדכן רק את הנתונים החדשים
      
      setCurrentUsername(username.trim());
      alert('שם המשתמש עודכן בהצלחה');
    } catch (error) {
      console.error('שגיאה בעדכון שם המשתמש:', error);
      alert('שגיאה בעדכון שם המשתמש: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // שינוי סיסמה עם אימות
  const handleChangePassword = async () => {
    if (!currentUser || !currentPassword || !password || password !== confirmPassword) {
      alert('נא למלא את כל השדות ולוודא שהסיסמאות תואמות');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('משתמש לא מחובר');
      
      // אימות הסיסמה הנוכחית
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // עדכון סיסמה
      await updatePassword(user, password);
      alert('הסיסמה עודכנה בהצלחה');
      
      // איפוס השדות
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('שגיאה בשינוי סיסמה:', err);
      let errorMessage = 'שגיאה בשינוי הסיסמה';
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'הסיסמה הנוכחית שגויה';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'הסיסמה החדשה חלשה מדי';
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      bgcolor: '#ebf1f5',
      py: 4,
      direction: 'ltr',
      width: '100vw',
      height: '90vh',
    }}>
      {/* הצגת שלום + שם משתמש */}
      {currentUser && currentUsername && (
        <Typography
          variant="h4"
          sx={{
            mt: -5,
            mb: 1,
            color: 'rgb(105, 148, 179)',
            fontWeight: 600,
            textAlign: 'center',
            direction: 'rtl'
          }}
        >
          שלום, {currentUsername.split(' ')[0]}
        </Typography>
      )}

      {/* חלונית ניהול המשתמש */}
      <Paper elevation={3} sx={{ 
        borderRadius: 3, 
        width: { xs: '90%', sm: 450, md: 500 }, 
        minHeight: 'unset',
        height: 'auto',
        maxHeight: 600,
        overflowY: 'auto',
        p: 2,
        maxWidth: 600,
        direction: 'rtl'
      }}>
        <Tabs value={tab} onChange={handleTabChange} centered variant="fullWidth"
          TabIndicatorProps={{
            style: {
              backgroundColor: 'rgba(142, 172, 183, 0.72)',
              height: 4,
              borderRadius: 2,
            }
          }}
          sx={{
            bgcolor: '#fff',
            borderRadius: 2,
            mb: 1.5,
            '& .MuiTab-root': {
              color: 'black',
              fontWeight: 'bold',
              fontSize: '1rem',
              backgroundColor: 'transparent',
            },
            '& .Mui-selected': {
              color: 'black',
              backgroundColor: 'transparent',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'rgba(142, 172, 183, 0.72)',
            },
            '& .MuiTab-root:focus': {
              outline: 'none',
              border: 'none',
            },
            '& .MuiTab-root:active': {
              outline: 'none',
              border: 'none',
            },
          }}
        >
          <Tab icon={<EditIcon />} label="שינוי שם משתמש" />
          <Tab icon={<LockResetIcon />} label="החלפת סיסמה" />
          <Tab icon={<DeleteIcon />} label="מחיקת משתמש" />
        </Tabs>
        
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ borderBottom: '1px solid #e0e0e0', width: '100%' }} />
        </Box>
        
        <TabPanel value={tab} index={0}>
          <Typography variant="h6" mb={2} textAlign="center">שינוי שם משתמש</Typography>
          <Typography variant="body2" mb={2} color="text.secondary" textAlign="center">
            שם המשתמש הנוכחי: {currentUsername}
          </Typography>
          <TextField
            variant="outlined"
            label="שם משתמש חדש"
            fullWidth
            value={username}
            onChange={e => setUsername(e.target.value)}
            sx={{ 
              mb: 2, 
              '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'black',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'black',
              },
            }}
            inputProps={{ style: { direction: 'rtl', textAlign: 'right', paddingRight: 16 } }}
            InputLabelProps={{
              style: { right: 8, left: 'unset', textAlign: 'right', width: 'auto', background: '#fff', paddingRight: 8 },
              shrink: true
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            disabled={!username.trim() || loading}
            onClick={handleChangeUsername}
            sx={{
              backgroundColor: 'rgba(142, 172, 183, 0.72)',
              color: 'black',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgb(185, 205, 220)',
              },
            }}
          >
            {loading ? 'שומר...' : 'שמור שם משתמש'}
          </Button>
        </TabPanel>
        
        <TabPanel value={tab} index={1}>
          <Typography variant="h6" mb={2} textAlign="center">החלפת סיסמה</Typography>
          <TextField
            label="סיסמה נוכחית"
            type="password"
            fullWidth
            size="small"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            sx={{ mb: 1, maxWidth: 480,
              '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'black',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'black',
              },
            }}
            inputProps={{ style: { direction: 'rtl', textAlign: 'right', paddingRight: 16 } }}
            InputProps={{ sx: { textAlign: 'right' } }}
            InputLabelProps={{
              style: { right: 8, left: 'unset', textAlign: 'right', width: 'auto', background: '#fff', paddingRight: 8 },
              shrink: true
            }}
          />
          <Button 
            variant="text" 
            color="primary" 
            size="small"
            sx={{ mb: 0.5, width: '100%', maxWidth:100 ,
              color:  'rgba(53, 63, 67, 0.72)',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              padding: '4px 0',
              textDecoration: 'underline',
              '&:hover': {
                border: 'none',
                boxShadow: 'none',
                textDecoration: 'underline',
              },
              '&:focus': {
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
                textDecoration: 'underline',
              },
              '&:active': {
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
                textDecoration: 'underline',
              },
            }} 
            onClick={() => setShowForgotPassword(true)}
          >
            שכחתי סיסמא
          </Button>
          <Typography variant="subtitle1" textAlign="center" sx={{ mb: 1.5, mt: 1, fontWeight: 500 }}>
            איפוס סיסמא
          </Typography>
          <TextField
            label="סיסמה חדשה"
            type="password"
            fullWidth
            size="small"
            value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 2, maxWidth: 480,
              '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'black',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'black',
              },
            }}
            inputProps={{ style: { direction: 'rtl', textAlign: 'right', paddingRight: 16 } }}
            InputProps={{ sx: { textAlign: 'right' } }}
            InputLabelProps={{
              style: { right: 8, left: 'unset', textAlign: 'right', width: 'auto', background: '#fff', paddingRight: 8 },
              shrink: true
            }}
          />
          <TextField
            label="אימות סיסמה"
            type="password"
            fullWidth
            size="small"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            sx={{ mb: 1, maxWidth: 480,
              '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'black',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'black',
              },
            }}
            inputProps={{ style: { direction: 'rtl', textAlign: 'right', paddingRight: 16 } }}
            InputProps={{ sx: { textAlign: 'right' } }}
            InputLabelProps={{
              style: { right: 8, left: 'unset', textAlign: 'right', width: 'auto', background: '#fff', paddingRight: 8 },
              shrink: true
            }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled={!currentPassword || !password || password !== confirmPassword || loading}
            onClick={handleChangePassword}
            sx={{
              backgroundColor: 'rgba(142, 172, 183, 0.72)',
              color: 'black',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgb(185, 205, 220)',
              },
            }}
          >
            {loading ? 'מחליף...' : 'החלף סיסמה'}
          </Button>
        </TabPanel>
        
        <TabPanel value={tab} index={2}>
          <Typography variant="h6" mb={2} color="error" textAlign="center">מחיקת משתמש</Typography>
          <Typography mb={2} textAlign="center" color="text.secondary">
            שים לב: פעולה זו תמחק את המשתמש לצמיתות!
          </Typography>
          <Button 
            variant="contained" 
            color="error" 
            fullWidth 
            onClick={() => setDeleteDialogOpen(true)}
          >
            מחק משתמש
          </Button>
        </TabPanel>
      </Paper>

      {/* דיאלוג אישור מחיקה */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>אישור מחיקת משתמש</DialogTitle>
        <DialogContent>
          <Typography>האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה הפיכה.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
          <Button color="error" variant="contained" onClick={() => setDeleteDialogOpen(false)}>מחק</Button>
        </DialogActions>
      </Dialog>

      {/* מודל שכחתי סיסמא */}
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </Box>
  );
}