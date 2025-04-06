// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // קובץ CSS שלך
import App from './App.jsx';  // הקומפוננטה הראשית שלך

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
