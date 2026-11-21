import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VideoPlayer from './pages/VideoPlayer';
import Welcome from './pages/Welcome';
import TutorPage from './pages/TutorPage';
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(30, 20, 60, 0.95)',
              color: '#fff',
              border: '1px solid rgba(103, 126, 234, 0.3)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/welcome" element={
            <PrivateRoute><Welcome /></PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/video/:lessonId" element={
            <PrivateRoute><VideoPlayer /></PrivateRoute>
          } />
          <Route path="/tutor" element={
            <PrivateRoute><TutorPage /></PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
