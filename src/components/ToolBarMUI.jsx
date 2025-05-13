// src/components/ToolbarMUI.jsx
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

function ToolbarMUI({ onLogout }) {
  return (
    <AppBar position="fixed" color="default" sx={{ direction: 'rtl' }}>
      <Toolbar>

        {/* כפתור התנתקות – בצד שמאל */}
        <Box sx={{ flexGrow: 1 }}>
          <Button color="inherit" onClick={onLogout}>
            התנתק
          </Button>
        </Box>

        {/* כפתורי ניווט – בצד ימין */}
        <Button color="inherit" component={Link} to="/">מסך הבית</Button>
        <Button color="inherit" component={Link} to="/Profiles">פרופילים</Button>
        <Button color="inherit" component={Link} to="/Schedule">מערכת שעות</Button>
        <Button color="inherit" component={Link} to="/Transport">הסעות</Button>
        <Button color="inherit" component={Link} to="/Reports">דו"חות</Button>
      </Toolbar>
    </AppBar>
  );
}

export default ToolbarMUI;