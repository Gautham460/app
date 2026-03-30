import React, { useEffect } from 'react';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function Notification({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', color: '#10b981' };
      case 'warning': return { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', color: '#f59e0b' };
      default: return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', color: '#3b82f6' };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem 1.5rem',
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${colors.border}`,
      borderRadius: '1rem',
      color: colors.color,
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out forwards'
    }}>
      {getIcon()}
      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{message}</p>
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
