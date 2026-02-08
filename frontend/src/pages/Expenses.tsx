import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setExpenses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      setFormData({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleDelete = async (expenseId) => {
    try {
      await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  if (loading) {
    return (
      <div>
        <Sidebar />
        <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading expenses...</p>
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
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>Expenses</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Add New Expense</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Description</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required>
                    <option value="">Select a category</option>
                    <option value="utilities">Utilities</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="supplies">Office Supplies</option>
                    <option value="salaries">Salaries</option>
                    <option value="rent">Rent</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Amount (KES)</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required />
                </div>
                <button type="submit" style={{ width: '100%', background: '#ef4444', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Add Expense</button>
              </form>
            </div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Recent Expenses</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {expenses.map(expense => (
                  <div key={expense.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontWeight: '600', fontSize: '16px' }}>{expense.description}</h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', textTransform: 'capitalize' }}>{expense.category}</p>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '600', color: '#ef4444', fontSize: '16px' }}>- KES {expense.amount.toLocaleString()}</p>
                        <button onClick={() => handleDelete(expense.id)} style={{ fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
