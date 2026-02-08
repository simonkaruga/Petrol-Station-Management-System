import React from 'react';
import { logout, getUser, isAdmin } from '../utils/auth';

const Navbar = () => {
  const user = getUser();
  const admin = isAdmin();

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '100%',
        padding: '0 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>Wakaruku Petrol Station</h2>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: admin ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#10b981',
            color: 'white',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            {admin ? 'ADMIN' : 'MANAGER'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>{user?.username}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
          <button
            onClick={logout}
            style={{
              background: '#ef4444',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
