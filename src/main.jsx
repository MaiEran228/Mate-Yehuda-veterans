// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // your css file
import App from './App.jsx';  // your main component

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
