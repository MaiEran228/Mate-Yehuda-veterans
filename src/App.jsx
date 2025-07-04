import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import ToolbarMUI from './components/ToolBarMUI';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Profiles from './pages/Profiles';
import Transport from './pages/Transport';
import Reports from './pages/AllReports/Reports';
import Login from './pages/Login';
import DailyAttendance from './pages/AllReports/DailyAttendance';
import Birthday from './pages/AllReports/Birthday';
import AbsencePeople from './pages/AllReports/AbsencePeople';
import MonthlyAttendance from './pages/AllReports/MonthlyAttendance';
import DaysLeft from './pages/AllReports/DaysLeft';
import UserManagement from './pages/UserManagement';



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
            <Route path="/" element={<Home onLogout={handleLogout} />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/Profiles" element={<Profiles />} />
              <Route path="/Transport" element={<Transport />} />
              <Route path="/Reports" element={<Reports />} />
              <Route path="/AllReports/DailyAttendance" element={<DailyAttendance />} />
              <Route path="/AllReports/Birthday" element={<Birthday />} />
              <Route path="/AllReports/AbsencePeople" element={<AbsencePeople />} />
              <Route path="/AllReports/MonthlyAttendance" element={<MonthlyAttendance />} />
              <Route path="/AllReports/DaysLeft" element={<DaysLeft />} />
              <Route path="/user-management" element={<UserManagement />} />
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
