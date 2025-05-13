import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import ToolbarMUI from './components/ToolBarMUI';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Profiles from './pages/Profiles';
import Transport from './pages/Transport';
import Reports from './pages/Reports';
import Login from './pages/Login';

function AppWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const navigate = useNavigate();

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });  // ⬅ ניתוב ודאי
  };

  return (
    <>
      {isAuthenticated ? (
        <>
          <ToolbarMUI onLogout={handleLogout} />
          <div style={{ marginTop: '64px', padding: '20px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/Profiles" element={<Profiles />} />
              <Route path="/Transport" element={<Transport />} />
              <Route path="/Reports" element={<Reports />} />
              <Route path="/login" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default App;
