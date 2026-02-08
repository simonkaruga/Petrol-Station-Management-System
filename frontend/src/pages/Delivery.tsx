import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Delivery = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    quantity: '',
    supplier: '',
    cost: ''
  });

  useEffect(() => {
    fetchDeliveries();
    fetchProducts();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/deliveries', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setDeliveries(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      setFormData({ productId: '', productName: '', quantity: '', supplier: '', cost: '' });
      fetchDeliveries();
    } catch (error) {
      console.error('Error creating delivery:', error);
    }
  };

  if (loading) {
    return (
      <div>
        <Sidebar />
        <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading deliveries...</p>
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
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>Record Delivery</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Add New Delivery</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Product *</label>
                  <select 
                    value={formData.productName} 
                    onChange={(e) => setFormData({...formData, productName: e.target.value})} 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} 
                    required
                  >
                    <option value="">Select a product</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Kerosene">Kerosene</option>
                    <option value="Gas 6kg">Gas 6kg</option>
                    <option value="Gas 13kg">Gas 13kg</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Quantity</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Supplier</label>
                  <input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Cost (KES)</label>
                  <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} required />
                </div>
                <button type="submit" style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Add Delivery</button>
              </form>
            </div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Recent Deliveries</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {deliveries.map(delivery => (
                  <div key={delivery.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontWeight: '600', fontSize: '16px' }}>{delivery.product?.name}</h3>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>Quantity: {delivery.quantity}</p>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>Supplier: {delivery.supplier}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '600', fontSize: '16px' }}>KES {delivery.cost.toLocaleString()}</p>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>{new Date(delivery.createdAt).toLocaleDateString()}</p>
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

export default Delivery;
