import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, User, Bot } from 'lucide-react';
import axios from 'axios';

export default function GeminiCoach({ user }) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your Gemini Wellness Coach. How are you feeling today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
          top: messagesEndRef.current.scrollHeight,
          behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/ai/chat', {
        userId: user.id || user._id,
        message: input,
        history: messages
      });
      
      setMessages(prev => [...prev, { role: 'assistant', text: response.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I'm having trouble thinking right now. Let's try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Sparkles color="#a78bfa" size={32} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Gemini Wellness Coach</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Conversational AI powered by Google Gemini.</p>
      </header>

      <div className="glass-card" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '0', 
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(167, 139, 250, 0.2)'
      }}>
        <div 
          ref={messagesEndRef}
          style={{ 
            flex: 1, 
            padding: '2rem', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem' 
          }}
        >
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              gap: '1rem', 
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                padding: '0.75rem', 
                borderRadius: '50%', 
                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(167, 139, 250, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} color="#a78bfa" />}
              </div>
              <div style={{ 
                maxWidth: '70%', 
                padding: '1rem 1.5rem', 
                borderRadius: '1.25rem', 
                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                lineHeight: 1.6
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--text-muted)' }}>
              <div className="live-indicator"></div>
              <span>Gemini is thinking...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Ask your coach anything..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button type="submit" className="btn" style={{ width: 'auto', padding: '0 1.5rem' }} disabled={isLoading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
