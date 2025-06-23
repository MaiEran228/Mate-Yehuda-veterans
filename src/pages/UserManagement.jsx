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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
            mb: 4,
            color: 'rgb(105, 148, 179)',
            fontWeight: 600,
            textAlign: 'center',
            direction: 'rtl'
          }}
        >
          שלום, {currentUsername}
        </Typography>
      )}

      {/* חלונית ניהול המשתמש */}
      <Paper elevation={3} sx={{ 
        borderRadius: 3, 
        width: { xs: '90%', sm: 450, md: 500 }, 
        minHeight: 420,
        height: 500,
        p: 2,
        maxWidth: 600,
        direction: 'rtl'
      }}>
        <Tabs value={tab} onChange={handleTabChange} centered variant="fullWidth">
          <Tab icon={<EditIcon />} label="שינוי שם משתמש" />
          <Tab icon={<LockResetIcon />} label="החלפת סיסמה" />
          <Tab icon={<DeleteIcon />} label="מחיקת משתמש" />
        </Tabs>
        
        <TabPanel value={tab} index={0}>
          <Typography variant="h6" mb={2} textAlign="center">שינוי שם משתמש</Typography>
          <Typography variant="body2" mb={2} color="text.secondary" textAlign="center">
            שם המשתמש הנוכחי: {currentUsername}
          </Typography>
          <TextField
            label="שם משתמש חדש"
            fullWidth
            value={username}
            onChange={e => setUsername(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ style: { direction: 'rtl' } }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            disabled={!username.trim() || loading}
            onClick={handleChangeUsername}
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
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ style: { direction: 'ltr' } }}
          />
          <Button 
            variant="text" 
            color="primary" 
            sx={{ mb: 2, width: '100%' }} 
            onClick={() => setShowForgotPassword(true)}
          >
            שכחתי סיסמא
          </Button>
          <TextField
            label="סיסמה חדשה"
            type="password"
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ style: { direction: 'ltr' } }}
          />
          <TextField
            label="אימות סיסמה"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ style: { direction: 'ltr' } }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled={!currentPassword || !password || password !== confirmPassword || loading}
            onClick={handleChangePassword}
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
