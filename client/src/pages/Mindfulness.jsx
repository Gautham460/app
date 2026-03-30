import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wind, Play, Pause, RefreshCw, Activity } from 'lucide-react';
import axios from 'axios';

export default function Mindfulness({ user, fitbitData }) {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(60);
  const [phase, setPhase] = useState('Breathe In'); // Breathe In, Hold, Breathe Out

  useEffect(() => {
    let interval = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((timer) => timer - 1);
        const sec = 60 - timer;
        if (sec % 12 < 4) setPhase('Breathe In');
        else if (sec % 12 < 8) setPhase('Hold');
        else setPhase('Breathe Out');
      }, 1000);
    } else if (timer === 0) {
      setIsActive(false);
      setPhase('Relaxed');
      // PERSIST: Log session completion to MongoDB
      const logSession = async () => {
        try {
          await axios.post('https://emotional-energy-os.onrender.com/api/mindfulness/log', {
            userId: user.id || user._id,
            duration: 60, // Fixed for this guided session
            moodBefore: 'Unknown',
            moodAfter: 'Relaxed'
          });
          console.log('Mindfulness session persisted');
        } catch (err) {
          console.error('Failed to log mindfulness session:', err);
        }
      };
      logSession();
    }
    return () => clearInterval(interval);
  }, [isActive, timer, user]);

  const reset = () => {
    setTimer(60);
    setIsActive(false);
    setPhase('Ready');
  };

  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Wind color="#4fd1c5" size={32} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Mindfulness Corner</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Instant mental reset through guided breathing.</p>
        {fitbitData.currentBpm > 0 && (
          <div style={{ marginTop: '0.5rem', color: 'var(--secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={14} /> Live: {fitbitData.currentBpm} BPM
          </div>
        )}
      </header>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ 
          width: '200px', 
          height: '200px', 
          margin: '0 auto 3rem auto',
          borderRadius: '50%',
          border: '2px solid #4fd1c520',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Animated Circle */}
          <div style={{
            width: '100%',
            height: '100%',
            background: isActive ? '#4fd1c520' : 'transparent',
            borderRadius: '50%',
            transform: isActive ? (phase === 'Breathe In' ? 'scale(1.2)' : phase === 'Hold' ? 'scale(1.2)' : 'scale(0.8)') : 'scale(1)',
            transition: 'transform 4s ease-in-out, background 0.5s',
            position: 'absolute'
          }}></div>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#4fd1c5', zIndex: 1 }}>{phase}</p>
        </div>

        <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem' }}>
          00:{timer < 10 ? `0${timer}` : timer}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className="btn" 
            style={{ width: '120px', background: isActive ? 'var(--secondary)' : 'var(--primary)' }}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? <Pause /> : <Play />} {isActive ? 'Pause' : 'Start'}
          </button>
          <button className="btn btn-secondary" style={{ width: '120px' }} onClick={reset}>
            <RefreshCw /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
