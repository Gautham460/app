import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Heart, Activity, Battery, LogOut, RefreshCw, Zap, Globe, Wind, BarChart3, TrendingUp, Plus, Users, Bell, Sparkles, ShieldCheck, Download } from 'lucide-react';
import Notification from '../components/Notification';
import { encryptData } from '../utils/crypto';
import { calculateBurnoutRisk } from '../utils/ai_engine';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard({ user, setUser, fitbitData }) {
  const navigate = useNavigate();
  const [energyLevel, setEnergyLevel] = useState(5);
  const [emotion, setEmotion] = useState('Neutral');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isPrivacyActive, setIsPrivacyActive] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([
    { id: 1, message: "End-to-end encryption active for health notes", type: "success", time: "Just now" },
    { id: 2, message: "Heart rate sync successful", type: "info", time: "2 mins ago" }
  ]);

  useEffect(() => {
    const checkBurnout = async () => {
      try {
        const response = await axios.get(`https://emotional-energy-os.onrender.com/api/energy/${user.id || user._id}`);
        const logs = response.data;
        if (Array.isArray(logs) && logs.length > 5) {
          const risk = calculateBurnoutRisk(logs, fitbitData.logs);
          if (risk > 75) {
            setNotification({
              message: `High Burnout Risk Detected (${risk}%)! Please take a moment to breathe.`,
              type: 'warning'
            });
          }
        }
      } catch (err) {
        console.error('Burnout check failed:', err.message);
      }
    };
    if (user && fitbitData.logs.length > 0) {
      checkBurnout();
    }
  }, [user, fitbitData.logs]);

  const handleLogout = async () => {
    await axios.post('https://emotional-energy-os.onrender.com/api/auth/logout');
    setUser(null);
    navigate('/login');
  };

  const handleSaveLog = async () => {
    setIsSubmitting(true);
    try {
      const encryptedNotes = isPrivacyActive ? await encryptData(notes, user.id || user._id) : notes;
      await axios.post('https://emotional-energy-os.onrender.com/api/energy/log', {
        userId: user.id || user._id,
        energyLevel: parseInt(energyLevel),
        emotion,
        notes: encryptedNotes,
        isEncrypted: isPrivacyActive
      });
      setNotification({ message: 'Energy log saved successfully!', type: 'success' });
      setNotes('');
    } catch (err) {
      setNotification({ message: 'Failed to save log. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Time,BPM\n" + 
      fitbitData.logs.map(log => `${log.time},${log.value}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "heart_rate_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const emotions = [
    { label: 'Energized', color: '#10b981' },
    { label: 'Focused', color: '#3b82f6' },
    { label: 'Neutral', color: '#6366f1' },
    { label: 'Tired', color: '#f59e0b' },
    { label: 'Stressed', color: '#ef4444' }
  ];

  const chartData = useMemo(() => ({
    labels: (fitbitData.logs || []).map(d => d.time),
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: (fitbitData.logs || []).map(d => d.value),
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 3
      }
    ]
  }), [fitbitData.logs]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleColor: '#94a3b8',
        bodyColor: '#fff'
      }
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="dashboard-layout">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <aside className="sidebar">
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '2.5rem',
            '--pulse-speed': `${60 / (fitbitData.currentBpm || 70)}s` 
          }}>
            <Activity className="bpm-pulse" color="var(--primary)" size={28} />
            <h1>Energy OS</h1>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Link to="/dashboard" className="nav-link active"><Zap size={18} /> Dashboard</Link>
            <Link to="/moodsphere" className="nav-link"><Globe size={18} /> MoodSphere</Link>
            <Link to="/forecast" className="nav-link"><TrendingUp size={18} /> Energy Forecast</Link>
            <Link to="/mindfulness" className="nav-link"><Wind size={18} /> Mindfulness</Link>
            <Link to="/habitlink" className="nav-link"><Plus size={18} /> Habit Link</Link>
            <Link to="/community" className="nav-link"><Users size={18} /> Community</Link>
            <Link to="/social" className="nav-link"><BarChart3 size={18} /> Weekly Report</Link>
            
            {(user.role === 'Admin' || user.role === 'Manager') && (
              <Link to="/admin" className="nav-link" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', marginTop: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <ShieldCheck size={18} /> Org Intelligence
              </Link>
            )}
          </nav>
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <button 
            className={`btn ${isPrivacyActive ? '' : 'btn-secondary'}`} 
            style={{ marginBottom: '1.5rem', width: '100%', border: isPrivacyActive ? '1px solid #ef4444' : '1px solid var(--border)', transition: 'all 0.4s' }}
            onClick={() => setIsPrivacyActive(!isPrivacyActive)}
          >
            <ShieldCheck size={16} /> {isPrivacyActive ? 'Privacy Active' : 'Privacy Shield'}
          </button>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }}></div>
            <div>
              <p style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text)' }}>{user.username}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role} Member</p>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Overview</h2>
            <p style={{ color: 'var(--text-muted)' }}>Welcome back, check your emotional energy and vitals.</p>
          </div>
          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </header>

        <section className="stats-grid">
          <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-label">Live Heart Rate (Fitbit)</span>
            <div className={`stat-value ${isPrivacyActive ? 'privacy-blur' : ''}`} style={{ color: 'var(--secondary)' }}>
              {fitbitData.currentBpm} <span style={{ fontSize: '1rem', fontWeight: '500' }}>BPM</span>
              <div className="live-indicator" style={{ marginLeft: '1rem' }}></div>
            </div>
            <button 
              className="btn" 
              style={{ marginTop: 'auto', backgroundColor: 'var(--secondary)', color: 'white' }} 
              onClick={() => window.location.href = `https://emotional-energy-os.onrender.com/api/fitbit/auth?userId=${user.id || user._id}`}
            >
              Connect Fitbit API
            </button>
            <Heart color="var(--secondary)" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.2 }} size={48} />
          </div>

          <div className="stat-card">
            <span className="stat-label">Average Energy Level</span>
            <div className={`stat-value ${isPrivacyActive ? 'privacy-blur' : ''}`} style={{ color: 'var(--primary)' }}>
              7.2 <span style={{ fontSize: '1rem', fontWeight: '500' }}>/ 10</span>
            </div>
            <Battery color="var(--primary)" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.2 }} size={48} />
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(236, 72, 153, 0.2))', cursor: 'pointer' }} onClick={() => navigate('/coach')}>
            <span className="stat-label" style={{ color: 'white' }}>Gemini AI Coach</span>
            <div className="stat-value" style={{ color: 'white', fontSize: '1.25rem' }}>Wellness Insights <Sparkles size={20} /></div>
          </div>

          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}><Bell size={14} /> Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentAlerts.map(alert => (
                <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', borderLeft: `3px solid ${alert.type === 'warning' ? '#ef4444' : '#10b981'}` }}>
                  <span>{alert.message}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', flex: 1 }}>
          <div className="stat-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Log Emotional Energy</h3>
            <div style={{ marginBottom: '2rem' }}>
              <input type="range" min="1" max="10" value={energyLevel} onChange={(e) => setEnergyLevel(e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Exhausted (1)</span><span>Peak (10)</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
              {emotions.map(emo => (
                <button key={emo.label} onClick={() => setEmotion(emo.label)} style={{ background: emotion === emo.label ? `${emo.color}20` : 'rgba(15,23,42,0.6)', border: `1px solid ${emotion === emo.label ? emo.color : 'var(--border)'}`, color: emotion === emo.label ? emo.color : 'var(--text-muted)' }}>{emo.label}</button>
              ))}
            </div>
            <textarea className="input-field" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..."></textarea>
            <button className="btn" style={{ marginTop: '1rem' }} onClick={handleSaveLog} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Log'}</button>
          </div>

          <div className={`chart-container ${isPrivacyActive ? 'privacy-blur' : ''}`}>
            <h3 style={{ marginBottom: '1.5rem' }}>Heart Rate Trends</h3>
            <div style={{ height: '300px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
