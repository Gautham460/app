import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Zap, Heart, Sparkles } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://emotional-energy-os.onrender.com', { withCredentials: true });

export default function MoodSphere({ user, fitbitData }) {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState({
    Happy: 0,
    Calm: 0,
    Stressed: 0,
    Neutral: 0
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`https://emotional-energy-os.onrender.com/api/energy/${user.id || user._id}`);
        const logs = response.data;
        
        const counts = { Happy: 0, Calm: 0, Stressed: 0, Neutral: 0 };
        logs.forEach(log => {
          if (counts.hasOwnProperty(log.emotion)) {
            counts[log.emotion]++;
          }
        });
        setClusters(counts);
      } catch (err) {
        console.error('Failed to fetch mood logs:', err);
      }
    };
    if (user) fetchLogs();

    socket.on('new_log', (newLog) => {
      setClusters(prev => ({
        ...prev,
        [newLog.emotion]: (prev[newLog.emotion] || 0) + 1
      }));
    });

    return () => socket.off('new_log');
  }, [user]);

  const getColor = (mood) => {
    switch(mood) {
      case 'Happy': return '#10b981';
      case 'Calm': return '#3b82f6';
      case 'Stressed': return '#ef4444';
      default: return '#a78bfa';
    }
  };

  const bpm = fitbitData?.currentBpm || 70;
  const pulseDuration = `${Math.max(0.3, 60 / bpm)}s`;

  // Filter clusters with data
  const activeMoods = Object.entries(clusters).filter(([_, count]) => count > 0);
  
  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity color="var(--secondary)" size={32} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Neural Sphere 2.0</h1>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Stable 2D generative biometric visualization.</p>
        </div>
      </header>

      <div className="sphere-container" style={{ 
        maxWidth: '1000px', 
        height: '600px', 
        position: 'relative', 
        overflow: 'hidden', 
        borderRadius: '2rem',
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* SVG Visualization */}
        <svg width="100%" height="100%" viewBox="0 0 800 600" style={{ position: 'absolute' }}>
          <defs>
            {Object.keys(clusters).map(mood => (
              <radialGradient key={mood} id={`grad-${mood}`}>
                <stop offset="0%" stopColor={getColor(mood)} stopOpacity="0.8" />
                <stop offset="100%" stopColor={getColor(mood)} stopOpacity="0" />
              </radialGradient>
            ))}
            <filter id="glow">
              <feGaussianBlur stdDeviation="15" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Central Neural Hub */}
          <circle 
            cx="400" cy="300" 
            r="120" 
            fill="none" 
            stroke="rgba(99, 102, 241, 0.1)" 
            strokeWidth="2" 
            className="pulse-ring"
            style={{ animationDuration: pulseDuration }}
          />

          {/* Generative Orbs */}
          {activeMoods.length === 0 ? (
            <circle cx="400" cy="300" r="50" fill="url(#grad-Neutral)" className="floating-orb" />
          ) : (
            activeMoods.map(([mood, count], i) => {
              const angle = (i / activeMoods.length) * Math.PI * 2;
              const radius = 180;
              const x = 400 + Math.cos(angle) * radius;
              const y = 300 + Math.sin(angle) * radius;
              const size = 40 + (count * 5);
              
              return (
                <g key={mood} className="orb-group" style={{ 
                  '--float-delay': `${i * 0.5}s`,
                  '--pulse-speed': pulseDuration 
                }}>
                  <circle 
                    cx={x} cy={y} 
                    r={size} 
                    fill={`url(#grad-${mood})`}
                    filter="url(#glow)"
                    className="biometric-orb"
                  />
                  <text 
                    x={x} y={y} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="12" 
                    fontWeight="700"
                    style={{ pointerEvents: 'none', opacity: 0.8 }}
                  >
                    {mood.toUpperCase()}
                  </text>
                </g>
              );
            })
          )}
        </svg>

        {/* UI Overlays */}
        <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', zIndex: 5 }}>
           <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>
             <Heart size={14} color="#ef4444" fill="#ef4444" /> {bpm} BPM SYNCED
           </p>
        </div>

        <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
           <div className="glass-card" style={{ padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                <Zap size={16} /> <span style={{ fontWeight: 700 }}>2D ENGINE ACTIVE</span>
              </div>
           </div>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', maxWidth: '1000px' }}>
        {Object.entries(clusters).map(([mood, count]) => (
          <div key={mood} className="glass-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${getColor(mood)}` }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{mood}</p>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: getColor(mood), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {count}
              {count > 5 && <Sparkles size={16} opacity={0.5} />}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .glass-card {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(20px);
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .pulse-ring {
          animation: stroke-pulse var(--pulse-speed, 1s) ease-in-out infinite;
        }

        .orb-group {
          animation: float 6s ease-in-out infinite;
          animation-delay: var(--float-delay, 0s);
        }

        .biometric-orb {
          animation: orb-pulse var(--pulse-speed, 1s) ease-in-out infinite alternate;
        }

        @keyframes stroke-pulse {
          0% { stroke-width: 1; opacity: 0.1; r: 100; }
          50% { stroke-width: 4; opacity: 0.3; r: 140; }
          100% { stroke-width: 1; opacity: 0.1; r: 100; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes orb-pulse {
          from { transform: scale(0.95); opacity: 0.7; }
          to { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
