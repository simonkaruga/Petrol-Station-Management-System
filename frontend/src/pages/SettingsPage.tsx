import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    petrolTankStock: '10000',
    dieselTankStock: '8000',
    keroseneTankStock: '5000',
    petrolBuyPrice: '164',
    petrolSellPrice: '182',
    dieselBuyPrice: '150',
    dieselSellPrice: '165',
    keroseneBuyPrice: '120',
    keroseneSellPrice: '135',
    gas6kgStock: '50',
    gas13kgStock: '30',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('stationSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setLoading(true);
    // Save to localStorage so it persists
    localStorage.setItem('stationSettings', JSON.stringify(settings));
    setSuccess('Settings saved successfully! Employees will see these values.');
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            Station Settings
          </h1>
          <p style={{ color: '#718096', marginBottom: '24px' }}>
            Update default values for tank stock and fuel prices. Employees will see these values when recording shifts.
          </p>

          {success && (
            <div style={{ padding: '16px', background: '#d1fae5', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '24px', color: '#065f46' }}>
              ✓ {success}
            </div>
          )}

          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Fuel Tank Stock Levels</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Petrol Tank Stock (Liters)</label>
                <input
                  type="number"
                  name="petrolTankStock"
                  value={settings.petrolTankStock}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
              <div className="form-group">
                <label>Diesel Tank Stock (Liters)</label>
                <input
                  type="number"
                  name="dieselTankStock"
                  value={settings.dieselTankStock}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
              <div className="form-group">
                <label>Kerosene Tank Stock (Liters)</label>
                <input
                  type="number"
                  name="keroseneTankStock"
                  value={settings.keroseneTankStock}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Fuel Prices (KES per Liter)</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e40af' }}>⛽ Petrol</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group">
                <label>Buy Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="petrolBuyPrice"
                  value={settings.petrolBuyPrice}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
              <div className="form-group">
                <label>Sell Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="petrolSellPrice"
                  value={settings.petrolSellPrice}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>⛽ Diesel</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group">
                <label>Buy Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="dieselBuyPrice"
                  value={settings.dieselBuyPrice}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
              <div className="form-group">
                <label>Sell Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="dieselSellPrice"
                  value={settings.dieselSellPrice}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#6b21a8' }}>⛽ Kerosene</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Buy Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="keroseneBuyPrice"
                  value={settings.keroseneBuyPrice}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
              <div className="form-group">
                <label>Sell Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="keroseneSellPrice"
                  value={settings.keroseneSellPrice}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Gas Cylinder Stock</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>6kg Gas Stock (Units)</label>
                <input
                  type="number"
                  name="gas6kgStock"
                  value={settings.gas6kgStock}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
              <div className="form-group">
                <label>13kg Gas Stock (Units)</label>
                <input
                  type="number"
                  name="gas13kgStock"
                  value={settings.gas13kgStock}
                  onChange={handleChange}
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '16px 32px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
