import io from 'socket.io-client';

const socket = io('https://emotional-energy-os.onrender.com', { withCredentials: true });

export default function Community({ user, fitbitData }) {
  const navigate = useNavigate();
  const [pulse, setPulse] = useState({
    energyPulse: 7.5,
    moods: [],
    communityPulse: 72
  });

  const fetchPulse = async () => {
    try {
      const response = await axios.get('https://emotional-energy-os.onrender.com/api/analytics/community-vibe');
      const data = response.data;
      setPulse({
        energyPulse: parseFloat(data.averageEnergy) || 7.0,
        moods: data.moods || [],
        communityPulse: 72,
        totalUsers: data.totalUsers || 0
      });
    } catch (err) {
      console.error('Failed to fetch community pulse:', err);
    }
  };

  useEffect(() => {
    fetchPulse();
    
    // SOCKET: Listen for real-time logs to refresh pulse
    socket.on('new_log', () => {
      console.log('Global pulse update received via Socket');
      fetchPulse();
    });

    const interval = setInterval(fetchPulse, 60000); // Fallback long poll
    return () => {
      clearInterval(interval);
      socket.off('new_log');
    };
  }, []);

  const getColor = (mood) => {
    switch(mood) {
      case 'Happy': return '#10b981';
      case 'Calm': return '#3b82f6';
      case 'Stressed': return '#ef4444';
      default: return '#a78bfa';
    }
  };

  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users color="#fbbf24" size={32} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Community Vibe</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Real-time anonymous global emotional energy state.</p>
      </header>

      <section className="stats-grid">
          <div className="stat-card" style={{ animationDelay: '0.1s', background: 'rgba(168, 85, 247, 0.1)' }}>
            <span className="stat-label">Community Energy Avg</span>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {pulse.energyPulse.toFixed(1)} <span style={{ fontSize: '0.875rem' }}>/ 10</span>
            </div>
            <Globe color="var(--primary)" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.2 }} size={48} />
          </div>

          <div className="stat-card" style={{ animationDelay: '0.2s', background: 'rgba(236, 72, 153, 0.1)' }}>
            <span className="stat-label">Community Average BPM</span>
            <div className="stat-value" style={{ color: 'var(--secondary)' }}>
              {Math.round(pulse.communityPulse)} <span style={{ fontSize: '0.875rem' }}>BPM</span>
              <div className="live-indicator" style={{ marginLeft: '1rem' }}></div>
            </div>
            <Zap color="var(--secondary)" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.2 }} size={48} />
          </div>
        </section>

        <section className="glass-card" style={{ padding: '2.5rem', marginTop: '1.5rem', animationDelay: '0.3s' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '2rem' }}>Global Mood Distribution (Past 24h)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '250px', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
            {pulse.moods.length > 0 ? pulse.moods.map((m, idx) => (
              <div key={m._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '100%', 
                  height: `${(m.count / Math.max(...pulse.moods.map(x => x.count))) * 100}%`,
                  background: `linear-gradient(to top, ${getColor(m._id)}, ${getColor(m._id)}40)`,
                  borderRadius: '0.5rem 0.5rem 0 0',
                  minHeight: '4px',
                  transition: 'height 1s ease-out'
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getColor(m._id) }}>{m._id}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.count} logs</span>
              </div>
            )) : (
              <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>No data logged in the last 24 hours.</div>
            )}
          </div>
        </section>
    </div>
  );
}
