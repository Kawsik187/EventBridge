import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useEscapeKey from '../../hooks/useEscapeKey';

const GoogleLoginButton = ({ onSuccess, onError, text = 'Continue with Google' }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  useEscapeKey(() => setShowPromptModal(false), showPromptModal);

  const handleGoogleClick = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // If client ID is configured and window.google is loaded
    if (clientId && clientId !== 'your_google_client_id_here.apps.googleusercontent.com' && window.google?.accounts?.id) {
      try {
        setLoading(true);
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await googleLogin({ credential: response.credential });
              if (onSuccess) onSuccess();
              else navigate('/');
            } catch (err) {
              if (onError) onError(err.response?.data?.message || 'Google authentication failed');
            } finally {
              setLoading(false);
            }
          },
        });
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Live Google prompt initialization error, falling back to sign-in modal:', err);
      }
    }

    // Modal fallback when VITE_GOOGLE_CLIENT_ID is not yet configured in local environment
    setShowPromptModal(true);
  };

  const handleSimulatedGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail) return;

    try {
      setLoading(true);
      await googleLogin({
        email: customEmail.trim().toLowerCase(),
        name: customName.trim() || customEmail.split('@')[0],
        googleId: `goog_${Date.now()}`,
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      });
      setShowPromptModal(false);
      if (onSuccess) onSuccess();
      else navigate('/');
    } catch (err) {
      if (onError) onError(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: '#ffffff',
          color: '#1f2937',
          border: '1.5px solid #e5e7eb',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '14.5px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.background = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.background = '#ffffff';
        }}
      >
        {/* Authentic Multi-color Google "G" SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            fill="#EA4335"
          />
        </svg>
        <span>{loading ? 'Authenticating with Google...' : text}</span>
      </button>

      {/* Google Sign-In Dialog for environments without VITE_GOOGLE_CLIENT_ID configured */}
      {showPromptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setShowPromptModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>
                Sign in with Google
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                Choose an account or enter your college / Gmail address
              </p>
            </div>

            {/* Quick 1-click Student Accounts */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Quick Test Accounts (1-Click)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'Arun Kumar', email: 'arun.easwari@srmeaswari.ac.in', dept: 'CSE' },
                  { name: 'Sneha Patel', email: 'sneha.it@srmeaswari.ac.in', dept: 'IT' },
                ].map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setCustomEmail(account.email);
                      setCustomName(account.name);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: customEmail === account.email ? '#eff6ff' : '#f9fafb',
                      border: customEmail === account.email ? '1.5px solid #2563eb' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{account.name}</div>
                      <div style={{ fontSize: '11.5px', color: '#6b7280' }}>{account.email}</div>
                    </div>
                    <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                      {account.dept}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', textAlign: 'center', margin: '14px 0' }}>
              <div style={{ borderTop: '1px solid #e5e7eb', position: 'absolute', top: '50%', width: '100%' }}></div>
              <span style={{ position: 'relative', background: '#ffffff', padding: '0 8px', fontSize: '11.5px', color: '#9ca3af', fontWeight: '500' }}>
                or enter any email
              </span>
            </div>

            <form onSubmit={handleSimulatedGoogleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Google / College Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@srmeaswari.ac.in or gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Your Name (e.g. Priya Sharma)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowPromptModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    color: '#4b5563',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#1c4980',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Signing in...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleLoginButton;
