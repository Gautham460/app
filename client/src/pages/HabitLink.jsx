import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coffee, Bed, Dumbbell, Plus, Zap, Check } from 'lucide-react';
import axios from 'axios';

const ICON_MAP = {
  'Sleep': <Bed size={20} />,
  'Caffeine': <Coffee size={20} />,
  'Exercise': <Dumbbell size={20} />,
  'default': <Zap size={20} />
};

export default function HabitLink({ user }) {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/habit/${user.id || user._id}`);
        setHabits(response.data);
      } catch (err) {
        console.error('Failed to fetch habits:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchHabits();
  }, [user]);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/habit/add', {
        userId: user.id || user._id,
        name: newHabitName
      });
      setHabits([...habits, response.data]);
      setNewHabitName('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add habit:', err);
    }
  };

  const handleLogHabit = async (habitId) => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/habit/log', {
        habitId,
        value: 1 // Default increment for now
      });
      // Update local state
      setHabits(habits.map(h => h._id === habitId ? response.data : h));
    } catch (err) {
      console.error('Failed to log habit:', err);
    }
  };

  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Zap color="#2dd4bf" size={32} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Habit Link</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Discover how your daily habits drive your emotional energy.</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Synchronizing with MongoDB...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {habits.map((habit) => (
            <div key={habit._id} className="stat-card" style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'rgba(45, 212, 191, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', background: '#2dd4bf20', borderRadius: '0.75rem', color: '#2dd4bf' }}>
                  {ICON_MAP[habit.name] || ICON_MAP.default}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{habit.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Logs: {habit.logs?.length || 0}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '1.25rem' }}>
                    {habit.logs?.length > 0 ? `+${(habit.logs.length * 5)}%` : '0%'}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Impact</p>
                </div>
                <button 
                  onClick={() => handleLogHabit(habit._id)}
                  className="btn" 
                  style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Check size={20} />
                </button>
              </div>
            </div>
          ))}

          {showAddModal ? (
            <form onSubmit={handleAddHabit} className="stat-card" style={{ gap: '1rem', padding: '1.5rem' }}>
              <input 
                autoFocus
                type="text" 
                className="input-field" 
                placeholder="Name your new tracker (e.g. Meditation)"
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Add Tracker</button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button 
              className="btn btn-secondary" 
              style={{ borderStyle: 'dashed', height: '80px' }}
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={20} /> Add New Habit Tracker
            </button>
          )}
        </div>
      )}
    </div>
  );
}
