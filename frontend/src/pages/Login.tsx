import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });

      const token = response.data.data?.tokens?.accessToken || response.data.token;
      const user = response.data.data?.user || response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', { email: resetEmail });
      setResetSuccess(true);
      setLoading(false);
      setTimeout(() => {
        setShowReset(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            marginBottom: '20px',
            fontSize: '40px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            ⛽
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Petrol Station
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
            Management System
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1a202c',
            marginBottom: '8px'
          }}>
            {showReset ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p style={{ color: '#718096', marginBottom: '32px', fontSize: '14px' }}>
            {showReset ? 'Enter your email to receive reset instructions' : 'Sign in to continue to your dashboard'}
          </p>

          {error && (
            <div style={{
              background: '#fee',
              border: '1px solid #fcc',
              color: '#c33',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {resetSuccess && (
            <div style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span>
              <span>Password reset instructions sent to your email!</span>
            </div>
          )}

          {showReset ? (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px',
                    color: '#9ca3af'
                  }}>
                    📧
                  </span>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  fontFamily: 'inherit',
                  marginBottom: '12px'
                }}
              >
                {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReset(false);
                  setError('');
                  setResetEmail('');
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
              >
                ← Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px',
                    color: '#9ca3af'
                  }}>
                    👤
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px',
                    color: '#9ca3af'
                  }}>
                    🔒
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '14px 48px 14px 48px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {loading ? '⏳ Signing in...' : '🚀 Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReset(true);
                  setError('');
                }}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  background: 'transparent',
                  color: '#667eea',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit'
                }}
              >
                Forgot your password?
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '13px',
          marginTop: '24px'
        }}>
          © 2024 Petrol Station. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
