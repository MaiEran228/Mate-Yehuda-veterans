// src/components/ToolbarMUI.jsx
import { AppBar, Toolbar, Button, Box, Divider } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import logoMateYehuda from '../assets/Logo2.jpeg';
import Tooltip from '@mui/material/Tooltip';

function ToolbarMUI({ onLogout }) {
  const location = useLocation();
  
  // Define navigation items (without home)
  const navItems = [
    { label: 'דו"חות', to: '/Reports' },
    { label: 'הסעות', to: '/Transport' },
    { label: 'מערכת שעות', to: '/Schedule' },
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
              mr: 2, // מרווח מימין
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
                height: '90px',
                width: 'auto',
                maxWidth: '120px',
                borderRadius: '100%', // עיגול הפינות
                border: '2px solid rgba(196, 241, 165, 0.89)',
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

        {/* כפתור התנתקות – בצד שמאל */}
        <Button color="inherit" onClick={onLogout} sx={{ fontSize: '1.1rem', px: 2 }}>
          התנתק
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default ToolbarMUI;