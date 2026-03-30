import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Download, Award, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { calculateBurnoutRisk, getDeepInsights } from '../utils/ai_engine';
import { decryptData } from '../utils/crypto';

export default function SocialReport({ user, fitbitData }) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [burnoutRisk, setBurnoutRisk] = useState(0);
  const [insight, setInsight] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = user.id || user._id;
        const [logsRes, reportRes] = await Promise.all([
          axios.get(`https://emotional-energy-os.onrender.com/api/energy/${userId}`),
          axios.get(`https://emotional-energy-os.onrender.com/api/ai/report/${userId}`)
        ]);
        
        setLogs(logsRes.data);
        setInsight(reportRes.data.report);
        
        // Dynamic burnout risk calculation based on latest log
        if (logsRes.data.length > 0) {
          const latest = logsRes.data[0];
          const risk = latest.energyLevel < 4 ? 85 : latest.energyLevel < 7 ? 45 : 12;
          setBurnoutRisk(risk);
        }
      } catch (err) {
        console.error('Failed to fetch social report data:', err);
      }
    };
    if (user) fetchData();
  }, [user]);

  const avgEnergy = logs.length > 0 ? (logs.reduce((acc, l) => acc + l.energyLevel, 0) / logs.length).toFixed(1) : '8.2';
  const topMood = logs.length > 0 ? logs[0].emotion : 'Focus';

  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <BarChart3 color="#a78bfa" size={32} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Social Report</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Generate and share your emotional energy week in review.</p>
      </header>

      <div className="glass-card" style={{ 
        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(236, 72, 153, 0.1))',
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '3rem',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <Award size={64} color="#a78bfa" style={{ margin: '0 auto' }} />
          <h2 style={{ fontSize: '1.75rem', marginTop: '1rem' }}>Wellness AI Analysis</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Energy</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{avgEnergy}</p>
          </div>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top Mood</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{topMood}</p>
          </div>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Burnout Risk</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: burnoutRisk > 50 ? '#ef4444' : '#10b981' }}>{burnoutRisk}%</p>
          </div>
        </div>

        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          padding: '2rem', 
          borderRadius: '1.5rem', 
          marginBottom: '2rem',
          borderLeft: '4px solid #a78bfa'
        }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#a78bfa', textAlign: 'left' }}>Deep AI Insight</h3>
          <p style={{ lineHeight: 1.6, textAlign: 'left' }}>{insight}</p>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '3rem' }}>
          <p>Generated on March 10, 2026</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ flex: 1, background: '#a78bfa' }}>
            <Share2 size={18} /> Share to Feed
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }}>
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
