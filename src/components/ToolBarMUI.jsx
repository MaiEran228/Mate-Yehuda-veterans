// src/components/ToolbarMUI.jsx
import { AppBar, Toolbar, Button } from '@mui/material';
import { Link } from 'react-router-dom';


function ToolbarMUI() {
  return (
    <AppBar position="fixed" color="default" sx={{ direction: 'rtl' }}>
      <Toolbar sx={{ justifyContent: 'flex-start' }}>
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