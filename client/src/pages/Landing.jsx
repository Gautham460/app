import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, HeartPulse, Sparkles } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'var(--primary)',
        filter: 'blur(120px)',
        opacity: 0.15,
        borderRadius: '50%',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'var(--secondary)',
        filter: 'blur(120px)',
        opacity: 0.15,
        borderRadius: '50%',
        zIndex: 0
      }}></div>

      {/* Main Content Card */}
      <div className="glass-card" style={{ 
        maxWidth: '800px', 
        textAlign: 'center', 
        position: 'relative', 
        zIndex: 1,
        padding: '4rem 2rem',
        animationDuration: '1s'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))', 
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '1.5rem', 
          borderRadius: '50%', 
          marginBottom: '2rem',
          boxShadow: 'inset 0 0 20px rgba(99, 102, 241, 0.5)'
        }}>
          <Activity size={48} color="white" />
        </div>
        
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 800, 
          marginBottom: '1rem',
          background: 'linear-gradient(to right, #fff, var(--text-muted))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2
        }}>
          Emotional Energy
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-muted)', 
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto',
          lineHeight: 1.6
        }}>
          Track your heart rate, map your emotional patterns, and unlock actionable insights for a balanced digital life.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            onClick={() => navigate('/login')}
            style={{ 
              padding: '1rem 2.5rem', 
              fontSize: '1.1rem',
              width: 'auto',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: 'none'
            }}
          >
            Get Started <ArrowRight size={20} />
          </button>
        </div>

        {/* Feature Pills */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '2rem', 
          marginTop: '4rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <HeartPulse size={18} color="var(--secondary)" /> Live Vitals
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Sparkles size={18} color="var(--primary)" /> Smart Analytics
          </div>
        </div>
      </div>
    </div>
  );
}
