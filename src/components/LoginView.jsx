import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Utensils, TableProperties } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginView = ({ onLogin }) => {
  const [tableNum, setTableNum] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('table') || '';
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!tableNum.trim()) {
      setError('Please enter a table number first.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(tableNum.trim(), result.user);
    } catch (err) {
      console.error(err);
      setError('Failed to log in with Google. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        className="login-box glass-panel"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="login-header">
          <motion.div 
            className="login-logo"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <div style={{ background: 'var(--accent-primary-glow)', padding: '1.25rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={48} color="var(--accent-primary)" />
            </div>
          </motion.div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', marginTop: '1.5rem' }}>Welcome to FlavorFusion</h2>
          <p style={{ fontSize: '1.1rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Experience gourmet dining at your fingertips.</p>
        </div>

        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.div>
        )}

        <div className="login-form">
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Enter Table Number</label>
            <div style={{ position: 'relative' }}>
              <TableProperties style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
              <input 
                type="number" 
                className="login-input" 
                placeholder="e.g. 05"
                value={tableNum}
                onChange={(e) => setTableNum(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: '3rem', fontSize: '1.1rem', height: '60px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-input)', border: 'none', width: '100%' }}
              />
            </div>
          </div>
          
          <motion.button 
            className="btn-primary" 
            onClick={handleGoogleLogin} 
            disabled={loading || !tableNum.trim()}
            style={{ width: '100%', height: '60px', fontSize: '1.1rem', borderRadius: 'var(--radius-lg)', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Entering...' : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity="0.8"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity="0.8"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity="0.8"/>
                </svg>
                Continue with Google
              </>
            )}
          </motion.button>
        </div>
        
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to our <span style={{ color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginView;
