// src/components/ToolbarMUI.jsx
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

function ToolbarMUI({ onLogout }) {
  return (
    <AppBar position="fixed" color="default" sx={{ direction: 'ltr' }}>
      <Toolbar sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        {/* כפתורי ניווט – בצד ימין */}
        <Button color="inherit" component={Link} to="/">מסך הבית</Button>
        <Button color="inherit" component={Link} to="/Profiles">פרופילים</Button>
        <Button color="inherit" component={Link} to="/Schedule">מערכת שעות</Button>
        <Button color="inherit" component={Link} to="/Transport">הסעות</Button>
        <Button color="inherit" component={Link} to="/Reports">דו"חות</Button>

        {/* מרווח גמיש */}
        <Box sx={{ flexGrow: 1 }} />

        {/* כפתור התנתקות – בצד שמאל */}
        <Button color="inherit" onClick={onLogout}>
          התנתק
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default ToolbarMUI;