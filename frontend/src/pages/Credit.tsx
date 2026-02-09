import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const Credit = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    description: '',
    type: 'sale'
  });
  const [paymentData, setPaymentData] = useState({ customerId: '', amount: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/credit/customers');
      setCustomers(response.data.data || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/credit/sale', formData);
      setFormData({ customerId: '', amount: '', description: '', type: 'sale' });
      setSuccess('Credit sale recorded successfully');
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record credit sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/credit/payment', { ...paymentData, paymentMethod: 'cash' });
      setPaymentData({ customerId: '', amount: '' });
      setSuccess('Payment recorded successfully');
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Sidebar />
        <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading credit transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Sidebar />
      <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>Credit Management</h1>
          
          {error && <div style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}
          {success && <div style={{ background: '#d1fae5', borderLeft: '4px solid #10b981', color: '#065f46', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px' }}>{success}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Record Credit Sale</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Customer</label>
                  <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required>
                    <option value="">Select customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Amount (KES)</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Description</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} placeholder="Fuel, products, etc." />
                </div>
                <button type="submit" disabled={submitting} style={{ width: '100%', background: '#ef4444', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Recording...' : 'Record Credit Sale'}</button>
              </form>
            </div>
            
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Record Payment</h2>
              <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Customer</label>
                  <select value={paymentData.customerId} onChange={(e) => setPaymentData({...paymentData, customerId: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required>
                    <option value="">Select customer</option>
                    {customers.filter(c => c.currentBalance > 0).map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name} (Owes: KES {customer.currentBalance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Payment Amount (KES)</label>
                  <input type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required />
                </div>
                <button type="submit" disabled={submitting} style={{ width: '100%', background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Recording...' : 'Record Payment'}</button>
              </form>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px', borderRadius: '12px', color: 'white' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>Total Customers</p>
                  <p style={{ fontSize: '32px', fontWeight: '700' }}>{customers.length}</p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>Total Outstanding</p>
                  <p style={{ fontSize: '32px', fontWeight: '700' }}>KES {customers.reduce((sum, c) => sum + c.currentBalance, 0).toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>Customers with Debt</p>
                  <p style={{ fontSize: '32px', fontWeight: '700' }}>{customers.filter(c => c.currentBalance > 0).length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Customer Balances</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Credit Limit</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Current Balance</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{customer.name}</td>
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>{customer.phone || 'N/A'}</td>
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280', textAlign: 'right' }}>KES {customer.creditLimit.toLocaleString()}</td>
                      <td style={{ padding: '16px 12px', fontSize: '16px', fontWeight: '600', textAlign: 'right', color: customer.currentBalance > 0 ? '#ef4444' : '#10b981' }}>
                        KES {customer.currentBalance.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {customer.currentBalance === 0 ? (
                          <span style={{ display: 'inline-block', padding: '4px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>✓ CLEARED</span>
                        ) : customer.currentBalance >= customer.creditLimit ? (
                          <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>⚠ LIMIT REACHED</span>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>PENDING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credit;
