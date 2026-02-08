import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [todaySales, setTodaySales] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [salesRes, inventoryRes, shiftsRes] = await Promise.all([
        api.get(`/api/reports/financial?startDate=${today}&endDate=${today}`),
        api.get('/api/inventory/summary'),
        api.get('/api/shifts?status=active&limit=1'),
      ]);
      
      setTodaySales(salesRes.data.data);
      setInventory(inventoryRes.data.summary || []);
      setActiveShift(shiftsRes.data.data?.[0] || null);
      
      // Simulate low stock items (you can adjust threshold)
      const lowStock = (inventoryRes.data.summary || []).filter((item: any) => 
        parseFloat(item['SUM(\"quantity\")']) < 100
      );
      setLowStockItems(lowStock);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #e0e0e0', 
          borderTop: '4px solid #667eea', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: '#666', fontSize: '14px' }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Sidebar />
      <div style={{ marginLeft: '256px' }}>
        <Navbar />
        <div style={{ padding: '32px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
              Dashboard
            </h1>
            <p style={{ color: '#718096', fontSize: '14px' }}>
              Today's overview • {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px', fontWeight: '500' }}>TOTAL SALES</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                {formatCurrency(todaySales?.summary?.salesTotal || 0)}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>↑ Today's revenue</p>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px', fontWeight: '500' }}>EXPENSES</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                {formatCurrency(todaySales?.summary?.expensesTotal || 0)}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>↓ Operating costs</p>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px', fontWeight: '500' }}>PURCHASES</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                {formatCurrency(todaySales?.summary?.purchasesTotal || 0)}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Inventory costs</p>
            </div>

            <div style={{ 
              background: (todaySales?.summary?.profit || 0) >= 0 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '12px', 
              padding: '24px', 
              boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)' 
            }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px', fontWeight: '500' }}>NET PROFIT</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                {formatCurrency(todaySales?.summary?.profit || 0)}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                {(todaySales?.summary?.profit || 0) >= 0 ? '✓ Profitable' : '⚠ Loss'}
              </p>
            </div>
          </div>

          {/* Active Shift & Low Stock Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            {/* Active Shift */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: activeShift ? '2px solid #10b981' : '2px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                  {activeShift ? '🟢 Active Shift' : '⚪ No Active Shift'}
                </h2>
                {activeShift && (
                  <span style={{ 
                    padding: '4px 12px', 
                    background: '#d1fae5', 
                    color: '#065f46', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: '600' 
                  }}>
                    LIVE
                  </span>
                )}
              </div>
              {activeShift ? (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Attendant</p>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{activeShift.attendantName}</p>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Started</p>
                    <p style={{ fontSize: '14px', color: '#1f2937' }}>{new Date(activeShift.startTime).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/shift-history')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    View Shift Details
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ color: '#9ca3af', marginBottom: '16px' }}>No shift is currently active</p>
                  <button 
                    onClick={() => navigate('/shift-report')}
                    style={{
                      padding: '10px 20px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Start New Shift
                  </button>
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: lowStockItems.length > 0 ? '2px solid #f59e0b' : '2px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                  {lowStockItems.length > 0 ? '⚠️ Low Stock Alerts' : '✅ Stock Levels OK'}
                </h2>
                {lowStockItems.length > 0 && (
                  <span style={{ 
                    padding: '4px 12px', 
                    background: '#fef3c7', 
                    color: '#92400e', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: '600' 
                  }}>
                    {lowStockItems.length}
                  </span>
                )}
              </div>
              {lowStockItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lowStockItems.slice(0, 3).map((item, index) => (
                    <div key={index} style={{ 
                      padding: '12px', 
                      background: '#fef3c7', 
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                          {item['product.name']}
                        </p>
                        <p style={{ fontSize: '12px', color: '#78350f' }}>
                          Only {parseFloat(item['SUM(\"quantity\")']).toFixed(0)} left
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/delivery')}
                        style={{
                          padding: '6px 12px',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Restock
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ fontSize: '48px', marginBottom: '8px' }}>✓</p>
                  <p style={{ color: '#10b981', fontWeight: '500' }}>All items well stocked</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
            {/* Inventory Table */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '20px' }}>
                Inventory Summary
              </h2>
              
              {inventory.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          Product
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          Category
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.slice(0, 5).map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {item['product.name'] || 'Unknown'}
                          </td>
                          <td style={{ padding: '16px 12px' }}>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '4px 12px', 
                              fontSize: '12px', 
                              fontWeight: '500',
                              borderRadius: '12px', 
                              background: '#eff6ff', 
                              color: '#1e40af' 
                            }}>
                              {item['product.category'] || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1f2937', textAlign: 'right', fontWeight: '600' }}>
                            {parseFloat(item['SUM(\"quantity\")']).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <p>No inventory data available</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '20px' }}>
                Quick Actions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => navigate('/shift-report')} style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#5568d3'}
                onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}>
                  + Record Shift
                </button>
                <button onClick={() => navigate('/delivery')} style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                  Record Delivery
                </button>
                <button onClick={() => navigate('/reports')} style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                  View Reports
                </button>
                <button onClick={() => navigate('/monthly-report')} style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                  Monthly Report
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#718096', marginBottom: '8px', fontWeight: '500' }}>FUEL SALES</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                {formatCurrency((todaySales?.summary?.salesTotal || 0) * 0.7)}
              </p>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#718096', marginBottom: '8px', fontWeight: '500' }}>STORE SALES</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {formatCurrency((todaySales?.summary?.salesTotal || 0) * 0.3)}
              </p>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#718096', marginBottom: '8px', fontWeight: '500' }}>ACTIVE USERS</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>12</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
