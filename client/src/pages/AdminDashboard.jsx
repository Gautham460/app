import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ShieldCheck, Users, Activity, ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgStats = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:5000/api/analytics/admin/org-trends');
        setStats(res.data.data);
      } catch (err) {
        console.error('Admin Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgStats();
  }, []);

  if (loading) return <div className="auth-container">Loading Enterprise Intelligence...</div>;

  const moodData = {
    labels: stats ? Object.keys(stats.moodTrends) : [],
    datasets: [
      {
        label: 'Team Mood Distribution',
        data: stats ? Object.values(stats.moodTrends) : [],
        backgroundColor: [
          '#10b981', // Happy
          '#3b82f6', // Calm
          '#ef4444', // Stressed
          '#a78bfa'  // Neutral
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
            <ArrowLeft size={16} /> Back to My Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck color="var(--primary)" size={32} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Organization Intelligence</h1>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Anonymized wellness oversight for <strong>{user.organization || 'Your Team'}</strong>.</p>
        </div>
        
        <button className="btn" style={{ width: 'auto' }} onClick={() => window.print()}>
          <Download size={16} /> Export Report
        </button>
      </header>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">Total Active Members</span>
          <div className="stat-value">{stats?.totalMembers || 0} <Users size={24} style={{ opacity: 0.5 }} /></div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Logs (This Week)</span>
          <div className="stat-value">{stats?.totalLogs || 0} <Activity size={24} style={{ opacity: 0.5 }} /></div>
        </div>
        <div className="stat-card" style={{ borderLeft: stats?.burnoutAlerts > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
          <span className="stat-label">Burnout Alerts</span>
          <div className="stat-value" style={{ color: stats?.burnoutAlerts > 0 ? '#ef4444' : '#10b981' }}>
            {stats?.burnoutAlerts || 0} <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem', maxWidth: 'none' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Organizational Mood Pulse</h3>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
             <Pie data={moodData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

         <div className="glass-card" style={{ padding: '2rem', maxWidth: 'none' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Organizational Insights</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {stats?.moodTrends?.Stressed > stats?.moodTrends?.Happy ? (
                <>
                  <strong>High Stress Detected</strong>: Current data suggests a stress peak across the team. 
                  <br /><br />
                  <strong>Recommendation</strong>: Schedule a 15-minute guided meditation session for the engineering team before the weekly standup to lower cortisol levels.
                </>
              ) : (
                <>
                  <strong>Positive Momentum</strong>: The team energy is currently <strong>Peak</strong>. 
                  <br /><br />
                  <strong>Recommendation</strong>: This is an excellent time for complex architectural discussions or high-focus creative work.
                </>
              )}
            </p>
            <button className="btn btn-secondary" style={{ marginTop: '2rem' }}>Configure Auto-Reminders</button>
         </div>
      </div>

      <style>{`
        .glass-card {
           background: rgba(30, 41, 59, 0.4);
           backdrop-filter: blur(20px);
           border-radius: 1.5rem;
           border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
