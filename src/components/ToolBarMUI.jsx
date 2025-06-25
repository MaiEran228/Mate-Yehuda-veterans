// src/components/ToolbarMUI.jsx
import { AppBar, Toolbar, Button, Box, Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoMateYehuda from '../assets/Logo.png';
import Tooltip from '@mui/material/Tooltip';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function ToolbarMUI({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const handleUserMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleUserMenuClick = (path) => {
    handleUserMenuClose();
    navigate(path);
  };

  // מעקב אחר מצב האימות וקריאת שם המשתמש
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.email);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUsername(userDoc.data().username || 'משתמש');
          } else {
            // אם אין מסמך, יצירת מסמך חדש עם שם משתמש ברירת מחדל
            const defaultUsername = user.email.split('@')[0]; // שם משתמש מהמייל
            await setDoc(userDocRef, {
              username: defaultUsername,
              email: user.email,
              uid: user.uid,
              createdAt: new Date().toISOString()
            });
            setUsername(defaultUsername);
          }
        } catch (error) {
          console.error('שגיאה בקריאת נתוני המשתמש:', error);
          setUsername('משתמש');
        }
      } else {
        setCurrentUser(null);
        setUsername('');
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Define navigation items (without home)
  const navItems = [
    { label: 'דו"חות', to: '/Reports' },
    { label: 'הסעות', to: '/Transport' },
    { label: 'לוח פעילויות', to: '/Schedule' },
    { label: 'פרופילים', to: '/Profiles' },
  ];

  // Helper to check if current path matches
  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <AppBar position="fixed" color="default" sx={{ direction: 'ltr' }}>
      <Toolbar sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        {/* לוגו החברה – בצד ימין */}
        <Tooltip title="מסך הבית" arrow>
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              mr: 0.5, // מרווח קטן יותר מימין
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
              transition: 'opacity 0.2s',
            }}
          >
            <img
              src={logoMateYehuda}
              alt="לוגו החברה"
              style={{
                height: '80px',
                width: 'auto',
                maxWidth: '85px',
                borderRadius: '100%', // עיגול הפינות
                border: '2px solid rgba(76, 109, 55, 0.89)',
              }}
            />
          </Box>
        </Tooltip>

        {/* מפריד אחרי הלוגו */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx: 1,
            borderColor: '#bdbdbd',
            height: '36px',
            alignSelf: 'center',
          }}
        />

        {/* כפתורי ניווט */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {navItems.map((item, idx) => (
            <>
              {idx > 0 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    mx: 1,
                    borderColor: '#bdbdbd',
                    height: '36px',
                    alignSelf: 'center',
                  }}
                />
              )}
              <Button
                key={item.to}
                color="inherit"
                component={Link}
                to={item.to}
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: isActive(item.to) ? 'bold' : 'normal',
                  position: 'relative',
                  px: 2.2,
                  minWidth: 0,
                  color: isActive(item.to) ? 'black' : 'inherit',
                  backgroundColor: isActive(item.to) ? 'rgba(21, 84, 147, 0.08)' : 'transparent',
                  borderRadius: 2,
                  '&:after': isActive(item.to)
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: 8,
                        right: 8,
                        bottom: 0,
                        height: '4px',
                        background: 'rgba(142, 172, 183, 0.72)',
                        borderRadius: '2px',
                      }
                    : {},
                  '&:hover': {
                    color: 'black',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(21, 84, 147, 0.12)',
                  },
                  transition: 'color 0.2s, background 0.2s',
                }}
                disableRipple={isActive(item.to)}
              >
                {item.label}
              </Button>
            </>
          ))}
        </Box>

        {/* מרווח גמיש */}
        <Box sx={{ flexGrow: 1 }} />

        {/* הצגת שלום + שם משתמש */}
        {currentUser && username && (
          <Typography
            variant="body1"
            sx={{
              ml: 2,
              color: 'inherit',
              fontWeight: 500,
            }}
          >
            {username}
          </Typography>
        )}

        {/* אייקון משתמש – ניווט לעמוד ניהול משתמש */}
        <IconButton color="inherit" onClick={() => navigate('/user-management')} sx={{ ml: 1, '&:focus': { outline: 'none', border: 'none' }, '&:active': { outline: 'none', border: 'none' } }}>
          <AccountCircleIcon sx={{ fontSize: 34 }} />
        </IconButton>
        
        {/* כפתור התנתקות – בצד שמאל */}
        <Button color="inherit" onClick={onLogout} sx={{ fontSize: '1.1rem', px: 2 }}>
          התנתק
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default ToolbarMUI;