import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isAdmin } from '../utils/auth';

const Sidebar = () => {
  const location = useLocation();
  const admin = isAdmin();

  const menuSections = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/', label: 'Dashboard' },
      ]
    },
    {
      title: 'DAILY OPERATIONS',
      items: [
        { path: '/shift-report', label: 'Record Shift' },
        { path: '/shift-history', label: 'View Shifts' },
        { path: '/delivery', label: 'Record Delivery' },
        { path: '/expenses', label: 'Record Expense' },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { path: '/credit', label: 'Credit Customers' },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { path: '/monthly-report', label: 'Monthly Report' },
        { path: '/reports', label: 'All Reports' },
      ]
    },
  ];

  if (admin) {
    menuSections.push({
      title: 'ADMIN',
      items: [
        { path: '/users', label: 'User Management' },
        { path: '/settings', label: 'Settings' }
      ]
    });
  }

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: '256px',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      <div style={{ padding: '24px' }}>
        <div style={{ 
          marginBottom: '32px', 
          paddingBottom: '20px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: 'white',
            letterSpacing: '-0.5px'
          }}>
            Petrol Station
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Management System</p>
        </div>
        
        {menuSections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '24px' }}>
            <p style={{ 
              fontSize: '11px', 
              fontWeight: '600', 
              color: '#64748b', 
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              {section.title}
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: location.pathname === item.path ? '#667eea' : 'transparent',
                    color: location.pathname === item.path ? 'white' : '#cbd5e1',
                    borderLeft: location.pathname === item.path ? '3px solid white' : '3px solid transparent'
                  }}
                  onMouseOver={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#cbd5e1';
                    }
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
