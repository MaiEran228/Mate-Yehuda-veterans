// src/components/ToolbarMUI.jsx
import { AppBar, Toolbar, Button, Box, Divider } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

function ToolbarMUI({ onLogout }) {
  const location = useLocation();
  // Define navigation items
  const navItems = [
    { label: 'מסך הבית', to: '/' },
    { label: 'פרופילים', to: '/Profiles' },
    { label: 'מערכת שעות', to: '/Schedule' },
    { label: 'הסעות', to: '/Transport' },
    { label: 'דו"חות', to: '/Reports' },
  ];

  // Helper to check if current path matches
  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <AppBar position="fixed" color="default" sx={{ direction: 'ltr' }}>
      <Toolbar sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        {/* כפתורי ניווט – בצד ימין */}
        {navItems.map((item, idx) => (
          <Box key={item.to} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              color="inherit"
              component={Link}
              to={item.to}
              sx={{
                fontSize: '0.9rem',
                fontWeight: isActive(item.to) ? 'bold' : 'normal',
                position: 'relative',
                px: 2.2,
                minWidth: 0,
                '&:after': isActive(item.to)
                  ? {
                      content: '""',
                      position: 'absolute',
                      left: '50%',
                      bottom: 0,
                      transform: 'translateX(-50%)',
                      width: 24,
                      height: 0,
                      borderLeft: '12px solid transparent',
                      borderRight: '12px solid transparent',
                      borderTop: '8px solid rgba(21, 84, 147, 0.7)', // Funnel illusion color
                    }
                  : {},
                color: isActive(item.to) ? 'rgba(21, 84, 147, 0.7)' : 'inherit',
                '&:hover': {
                  color: 'rgba(21, 84, 147, 0.7)',
                  fontWeight: 'bold',
                },
                transition: 'color 0.2s',
              }}
              disableRipple={isActive(item.to)}
            >
              {item.label}
            </Button>
            {/* Divider except after last button */}
            {idx < navItems.length  && (
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  mx: 1,
                  borderColor: '#bdbdbd', // צבע כהה יותר
                  height: '36px',         // גובה גדול יותר
                  alignSelf: 'center',
                }}
              />
            )}
          </Box>
        ))}

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