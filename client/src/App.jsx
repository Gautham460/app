import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MoodSphere from './pages/MoodSphere';
import EnergyForecast from './pages/EnergyForecast';
import Mindfulness from './pages/Mindfulness';
import Community from './pages/Community';
import HabitLink from './pages/HabitLink';
import SocialReport from './pages/SocialReport';
import GeminiCoach from './pages/GeminiCoach';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

// Automatically send secure HttpOnly cookies on every request across the entire app
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [fitbitData, setFitbitData] = useState({ logs: [], currentBpm: 0 });

  useEffect(() => {
    // Attempt silent login via backend HttpOnly cookie validation
    const fetchSession = async () => {
      try {
        const res = await axios.get('https://emotional-energy-os.onrender.com/api/auth/me');
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingContext(false);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (!user) return;

    const syncFitbit = async () => {
      try {
        const response = await axios.get(`https://emotional-energy-os.onrender.com/api/fitbit/heart-rate/${user.id || user._id}`);
        if (response.data.status === 'success') {
          setFitbitData({
            logs: response.data.data,
            currentBpm: response.data.currentBpm
          });
          
          if (response.data.currentBpm > 100) {
            alert('Smart Alert: Your heart rate is elevated (100+ BPM). Consider a 1-minute breathing exercise in the Mindfulness Corner.');
          }
        }
      } catch (err) {
        console.error('Fitbit sync error:', err);
      }
    };

    syncFitbit();
    const interval = setInterval(syncFitbit, 30000); 
    return () => clearInterval(interval);
  }, [user]);

  if (loadingContext) {
    return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'white',background:'var(--background)'}}>Loading Energy OS Session...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} fitbitData={fitbitData} /> : <Navigate to="/login" />} />
        <Route path="/moodsphere" element={user ? <MoodSphere user={user} fitbitData={fitbitData} /> : <Navigate to="/login" />} />
        <Route path="/forecast" element={user ? <EnergyForecast user={user} fitbitData={fitbitData} /> : <Navigate to="/login" />} />
        <Route path="/mindfulness" element={user ? <Mindfulness user={user} fitbitData={fitbitData} /> : <Navigate to="/login" />} />
        <Route path="/community" element={user ? <Community user={user} fitbitData={fitbitData} /> : <Navigate to="/login" />} />
        <Route path="/habitlink" element={user ? <HabitLink user={user} fitbitData={fitbitData} /> : <Navigate to="/login" />} />
        <Route path="/social" element={user ? <SocialReport user={user} fitbitData={fitbitData} /> : <Navigate to="/login" />} />
        <Route path="/coach" element={user ? <GeminiCoach user={user} /> : <Navigate to="/login" />} />
        
        <Route 
          path="/admin" 
          element={user && (user.role === 'Admin' || user.role === 'Manager') 
            ? <AdminDashboard user={user} /> 
            : <Navigate to="/dashboard" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
