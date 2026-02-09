import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { isAdmin } from '../utils/auth';

const ShiftReport = () => {
  const admin = isAdmin();
  const [formData, setFormData] = useState({
    attendantName: '',
    shiftStartTime: '',
    petrolOpening: '',
    petrolClosing: '',
    petrolBuyPrice: '',
    petrolSellPrice: '',
    petrolTankStock: '10000',
    dieselOpening: '',
    dieselClosing: '',
    dieselBuyPrice: '',
    dieselSellPrice: '',
    dieselTankStock: '8000',
    keroseneOpening: '',
    keroseneClosing: '',
    keroseneBuyPrice: '',
    keroseneSellPrice: '',
    keroseneTankStock: '5000',
    fuelCashCollected: '',
    fuelMpesaCollected: '',
    carWashesCount: '',
    carWashCash: '',
    parkingFeesCollected: '',
    gas6kgSold: '',
    gas6kgStock: '50',
    gas13kgSold: '',
    gas13kgStock: '30',
    gasCashCollected: '',
    gasMpesaCollected: '',
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load settings from localStorage on mount and when settings change
  useEffect(() => {
    const loadSettingsFromStorage = () => {
      const saved = localStorage.getItem('stationSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          petrolTankStock: settings.petrolTankStock || prev.petrolTankStock,
          dieselTankStock: settings.dieselTankStock || prev.dieselTankStock,
          keroseneTankStock: settings.keroseneTankStock || prev.keroseneTankStock,
          petrolBuyPrice: settings.petrolBuyPrice || prev.petrolBuyPrice,
          petrolSellPrice: settings.petrolSellPrice || prev.petrolSellPrice,
          dieselBuyPrice: settings.dieselBuyPrice || prev.dieselBuyPrice,
          dieselSellPrice: settings.dieselSellPrice || prev.dieselSellPrice,
          keroseneBuyPrice: settings.keroseneBuyPrice || prev.keroseneBuyPrice,
          keroseneSellPrice: settings.keroseneSellPrice || prev.keroseneSellPrice,
          gas6kgStock: settings.gas6kgStock || prev.gas6kgStock,
          gas13kgStock: settings.gas13kgStock || prev.gas13kgStock,
        }));
      }
    };

    loadSettingsFromStorage();

    // Listen for storage changes (when settings are updated)
    window.addEventListener('storage', loadSettingsFromStorage);
    
    // Also listen for custom event when settings are saved in same tab
    window.addEventListener('settingsUpdated', loadSettingsFromStorage);

    return () => {
      window.removeEventListener('storage', loadSettingsFromStorage);
      window.removeEventListener('settingsUpdated', loadSettingsFromStorage);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      await api.post('/shifts', formData);
      
      // Update tank stock in settings after successful shift submission
      const saved = localStorage.getItem('stationSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        
        // Calculate new tank stock levels
        const newPetrolStock = petrolRemaining;
        const newDieselStock = dieselRemaining;
        const newKeroseneStock = keroseneRemaining;
        const newGas6kgStock = gas6kgRemaining;
        const newGas13kgStock = gas13kgRemaining;
        
        // Update settings with new stock levels
        const updatedSettings = {
          ...settings,
          petrolTankStock: newPetrolStock.toString(),
          dieselTankStock: newDieselStock.toString(),
          keroseneTankStock: newKeroseneStock.toString(),
          gas6kgStock: newGas6kgStock.toString(),
          gas13kgStock: newGas13kgStock.toString()
        };
        
        localStorage.setItem('stationSettings', JSON.stringify(updatedSettings));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('settingsUpdated'));
      }
      
      setSuccess('Shift report recorded successfully! Tank stock levels have been updated.');
      setShowReport(true);
      setIsSubmitted(true);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record shift');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isSubmitted) {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const petrolSold = (parseFloat(formData.petrolClosing) || 0) - (parseFloat(formData.petrolOpening) || 0);
  const dieselSold = (parseFloat(formData.dieselClosing) || 0) - (parseFloat(formData.dieselOpening) || 0);
  const keroseneSold = (parseFloat(formData.keroseneClosing) || 0) - (parseFloat(formData.keroseneOpening) || 0);

  // Calculate remaining stock in tank
  const petrolRemaining = (parseFloat(formData.petrolTankStock) || 0) - petrolSold;
  const dieselRemaining = (parseFloat(formData.dieselTankStock) || 0) - dieselSold;
  const keroseneRemaining = (parseFloat(formData.keroseneTankStock) || 0) - keroseneSold;

  // Calculate profit for each fuel type
  const petrolProfit = petrolSold * ((parseFloat(formData.petrolSellPrice) || 0) - (parseFloat(formData.petrolBuyPrice) || 0));
  const dieselProfit = dieselSold * ((parseFloat(formData.dieselSellPrice) || 0) - (parseFloat(formData.dieselBuyPrice) || 0));
  const keroseneProfit = keroseneSold * ((parseFloat(formData.keroseneSellPrice) || 0) - (parseFloat(formData.keroseneBuyPrice) || 0));

  // Calculate remaining gas cylinders
  const gas6kgRemaining = (parseFloat(formData.gas6kgStock) || 0) - (parseFloat(formData.gas6kgSold) || 0);
  const gas13kgRemaining = (parseFloat(formData.gas13kgStock) || 0) - (parseFloat(formData.gas13kgSold) || 0);

  // Calculate total money collected
  const totalMoney = 
    (parseFloat(formData.fuelCashCollected) || 0) +
    (parseFloat(formData.fuelMpesaCollected) || 0) +
    (parseFloat(formData.carWashCash) || 0) +
    (parseFloat(formData.parkingFeesCollected) || 0) +
    (parseFloat(formData.gasCashCollected) || 0) +
    (parseFloat(formData.gasMpesaCollected) || 0);

  // Calculate actual profit from fuel + other services (assuming 50% profit on services)
  const servicesProfit = ((parseFloat(formData.carWashCash) || 0) + (parseFloat(formData.parkingFeesCollected) || 0)) * 0.5;
  const gasProfit = ((parseFloat(formData.gasCashCollected) || 0) + (parseFloat(formData.gasMpesaCollected) || 0)) * 0.2;
  const totalProfit = petrolProfit + dieselProfit + keroseneProfit + servicesProfit + gasProfit;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>Record Shift Report</h1>

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="card">
            {isSubmitted && (
              <div style={{ 
                padding: '16px', 
                background: '#fef3c7', 
                border: '2px solid #f59e0b', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <div>
                  <p style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>Record Locked</p>
                  <p style={{ fontSize: '14px', color: '#78350f' }}>This shift report has been saved and locked. No further edits are allowed.</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ pointerEvents: isSubmitted ? 'none' : 'auto', opacity: isSubmitted ? 0.7 : 1 }}>
              {/* Shift Details */}
              <h3>Shift Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Attendant Name *</label>
                  <select name="attendantName" value={formData.attendantName} onChange={handleChange} required disabled={isSubmitted}>
                    <option value="">Select Attendant</option>
                    <option value="Raymond">Raymond</option>
                    <option value="Nicoras">Nicoras</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Shift Start Time *</label>
                  <input
                    type="datetime-local"
                    name="shiftStartTime"
                    value={formData.shiftStartTime}
                    onChange={handleChange}
                    required
                    disabled={isSubmitted}
                  />
                </div>
              </div>

              {/* Fuel Readings */}
              <h3 style={{ marginTop: '30px' }}>Fuel Readings & Prices</h3>
              
              {/* Petrol */}
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <h4 style={{ marginBottom: '12px', color: '#1e40af' }}>⛽ Petrol</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Tank Stock (L) {!admin && '🔒'}</label>
                    <input type="number" step="0.01" name="petrolTankStock" value={formData.petrolTankStock} onChange={handleChange} disabled={isSubmitted || !admin} style={{ background: !admin ? '#f3f4f6' : undefined, cursor: !admin ? 'not-allowed' : undefined }} />
                  </div>
                  <div className="form-group">
                    <label>Opening (L)</label>
                    <input type="number" step="0.01" name="petrolOpening" value={formData.petrolOpening} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Closing (L)</label>
                    <input type="number" step="0.01" name="petrolClosing" value={formData.petrolClosing} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Buy Price (KES/L)</label>
                    <input type="number" step="0.01" name="petrolBuyPrice" value={formData.petrolBuyPrice} onChange={handleChange} placeholder="164" />
                  </div>
                  <div className="form-group">
                    <label>Sell Price (KES/L)</label>
                    <input type="number" step="0.01" name="petrolSellPrice" value={formData.petrolSellPrice} onChange={handleChange} placeholder="182" />
                  </div>
                  <div className="form-group">
                    <label>Sold</label>
                    <input type="text" value={petrolSold.toFixed(2) + ' L'} disabled style={{ background: '#dbeafe', fontWeight: '600' }} />
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>Remaining in Tank:</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: petrolRemaining < 1000 ? '#ef4444' : '#10b981' }}>
                    {petrolRemaining.toFixed(2)} L {petrolRemaining < 1000 && '⚠️ Low Stock!'}
                  </span>
                </div>
              </div>

              {/* Diesel */}
              <div style={{ marginBottom: '20px', padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <h4 style={{ marginBottom: '12px', color: '#92400e' }}>⛽ Diesel</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Tank Stock (L) {!admin && '🔒'}</label>
                    <input type="number" step="0.01" name="dieselTankStock" value={formData.dieselTankStock} onChange={handleChange} disabled={isSubmitted || !admin} style={{ background: !admin ? '#f3f4f6' : undefined, cursor: !admin ? 'not-allowed' : undefined }} />
                  </div>
                  <div className="form-group">
                    <label>Opening (L)</label>
                    <input type="number" step="0.01" name="dieselOpening" value={formData.dieselOpening} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Closing (L)</label>
                    <input type="number" step="0.01" name="dieselClosing" value={formData.dieselClosing} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Buy Price (KES/L)</label>
                    <input type="number" step="0.01" name="dieselBuyPrice" value={formData.dieselBuyPrice} onChange={handleChange} placeholder="150" />
                  </div>
                  <div className="form-group">
                    <label>Sell Price (KES/L)</label>
                    <input type="number" step="0.01" name="dieselSellPrice" value={formData.dieselSellPrice} onChange={handleChange} placeholder="165" />
                  </div>
                  <div className="form-group">
                    <label>Sold</label>
                    <input type="text" value={dieselSold.toFixed(2) + ' L'} disabled style={{ background: '#fef3c7', fontWeight: '600' }} />
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>Remaining in Tank:</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: dieselRemaining < 800 ? '#ef4444' : '#10b981' }}>
                    {dieselRemaining.toFixed(2)} L {dieselRemaining < 800 && '⚠️ Low Stock!'}
                  </span>
                </div>
              </div>

              {/* Kerosene */}
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f3e8ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                <h4 style={{ marginBottom: '12px', color: '#6b21a8' }}>⛽ Kerosene</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Tank Stock (L) {!admin && '🔒'}</label>
                    <input type="number" step="0.01" name="keroseneTankStock" value={formData.keroseneTankStock} onChange={handleChange} disabled={isSubmitted || !admin} style={{ background: !admin ? '#f3f4f6' : undefined, cursor: !admin ? 'not-allowed' : undefined }} />
                  </div>
                  <div className="form-group">
                    <label>Opening (L)</label>
                    <input type="number" step="0.01" name="keroseneOpening" value={formData.keroseneOpening} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Closing (L)</label>
                    <input type="number" step="0.01" name="keroseneClosing" value={formData.keroseneClosing} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Buy Price (KES/L)</label>
                    <input type="number" step="0.01" name="keroseneBuyPrice" value={formData.keroseneBuyPrice} onChange={handleChange} placeholder="120" />
                  </div>
                  <div className="form-group">
                    <label>Sell Price (KES/L)</label>
                    <input type="number" step="0.01" name="keroseneSellPrice" value={formData.keroseneSellPrice} onChange={handleChange} placeholder="135" />
                  </div>
                  <div className="form-group">
                    <label>Sold</label>
                    <input type="text" value={keroseneSold.toFixed(2) + ' L'} disabled style={{ background: '#f3e8ff', fontWeight: '600' }} />
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>Remaining in Tank:</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: keroseneRemaining < 500 ? '#ef4444' : '#10b981' }}>
                    {keroseneRemaining.toFixed(2)} L {keroseneRemaining < 500 && '⚠️ Low Stock!'}
                  </span>
                </div>
              </div>

              {/* Fuel Payments */}
              <h3 style={{ marginTop: '30px' }}>Fuel Payments</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Cash Collected (KES)</label>
                  <input type="number" step="0.01" name="fuelCashCollected" value={formData.fuelCashCollected} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>M-Pesa Received (KES)</label>
                  <input type="number" step="0.01" name="fuelMpesaCollected" value={formData.fuelMpesaCollected} onChange={handleChange} />
                </div>
              </div>

              {/* Other Services */}
              <h3 style={{ marginTop: '30px' }}>Other Services</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Car Washes Count</label>
                  <input type="number" name="carWashesCount" value={formData.carWashesCount} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Car Wash Cash (KES)</label>
                  <input type="number" step="0.01" name="carWashCash" value={formData.carWashCash} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Parking Fees (KES)</label>
                  <input type="number" step="0.01" name="parkingFeesCollected" value={formData.parkingFeesCollected} onChange={handleChange} />
                </div>
              </div>

              {/* Gas Cylinders */}
              <h3 style={{ marginTop: '30px' }}>Gas Cylinders Inventory</h3>
              <div style={{ marginBottom: '20px', padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label>6kg Stock Available {!admin && '🔒'}</label>
                    <input type="number" name="gas6kgStock" value={formData.gas6kgStock} onChange={handleChange} disabled={isSubmitted || !admin} style={{ background: !admin ? '#f3f4f6' : '#fff', fontWeight: '600', cursor: !admin ? 'not-allowed' : undefined }} />
                  </div>
                  <div className="form-group">
                    <label>6kg Sold</label>
                    <input type="number" name="gas6kgSold" value={formData.gas6kgSold} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>13kg Stock Available {!admin && '🔒'}</label>
                    <input type="number" name="gas13kgStock" value={formData.gas13kgStock} onChange={handleChange} disabled={isSubmitted || !admin} style={{ background: !admin ? '#f3f4f6' : '#fff', fontWeight: '600', cursor: !admin ? 'not-allowed' : undefined }} />
                  </div>
                  <div className="form-group">
                    <label>13kg Sold</label>
                    <input type="number" name="gas13kgSold" value={formData.gas13kgSold} onChange={handleChange} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'white', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#374151' }}>6kg Remaining:</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: gas6kgRemaining < 10 ? '#ef4444' : '#10b981' }}>
                      {gas6kgRemaining} units {gas6kgRemaining < 10 && '⚠️ Low Stock!'}
                    </span>
                  </div>
                  <div style={{ padding: '12px', background: 'white', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#374151' }}>13kg Remaining:</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: gas13kgRemaining < 10 ? '#ef4444' : '#10b981' }}>
                      {gas13kgRemaining} units {gas13kgRemaining < 10 && '⚠️ Low Stock!'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Gas Cash (KES)</label>
                  <input type="number" step="0.01" name="gasCashCollected" value={formData.gasCashCollected} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Gas M-Pesa (KES)</label>
                  <input type="number" step="0.01" name="gasMpesaCollected" value={formData.gasMpesaCollected} onChange={handleChange} />
                </div>
              </div>

              {/* Summary Section */}
              <div style={{ 
                marginTop: '40px', 
                padding: '24px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Shift Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    padding: '20px', 
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Total Money Collected</p>
                    <p style={{ fontSize: '32px', fontWeight: '700' }}>{formatCurrency(totalMoney)}</p>
                    <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>All payments combined</p>
                  </div>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    padding: '20px', 
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Actual Profit</p>
                    <p style={{ fontSize: '32px', fontWeight: '700' }}>{formatCurrency(totalProfit)}</p>
                    <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>Based on buy/sell prices</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  marginTop: '30px',
                  opacity: isSubmitted ? 0.5 : 1,
                  cursor: isSubmitted ? 'not-allowed' : 'pointer'
                }}
                disabled={loading || isSubmitted}
              >
                {isSubmitted ? '✓ Saved & Locked' : (loading ? 'Saving...' : 'Save Shift Report')}
              </button>
            </form>
          </div>

          {/* Printable Report */}
          {showReport && (
            <div id="printable-report" style={{ 
              marginTop: '40px', 
              background: 'white', 
              padding: '40px', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #667eea', paddingBottom: '20px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>SHIFT REPORT</h2>
                <p style={{ color: '#718096' }}>Wakaruku Petrol Station</p>
                <p style={{ fontSize: '14px', color: '#718096' }}>{new Date().toLocaleString()}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#374151' }}>Attendant:</td>
                    <td style={{ padding: '12px', color: '#1f2937' }}>{formData.attendantName}</td>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#374151' }}>Shift Start:</td>
                    <td style={{ padding: '12px', color: '#1f2937' }}>{new Date(formData.shiftStartTime).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>FUEL SALES</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Fuel Type</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Opening</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Closing</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Sold (L)</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Buy Price</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Sell Price</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>Petrol</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formData.petrolOpening}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formData.petrolClosing}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{petrolSold.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.petrolBuyPrice) || 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.petrolSellPrice) || 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>{formatCurrency(petrolProfit)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>Diesel</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formData.dieselOpening}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formData.dieselClosing}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{dieselSold.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.dieselBuyPrice) || 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.dieselSellPrice) || 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>{formatCurrency(dieselProfit)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>Kerosene</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formData.keroseneOpening}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formData.keroseneClosing}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{keroseneSold.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.keroseneBuyPrice) || 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.keroseneSellPrice) || 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>{formatCurrency(keroseneProfit)}</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>PAYMENTS COLLECTED</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>Fuel Cash</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.fuelCashCollected) || 0)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>Fuel M-Pesa</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.fuelMpesaCollected) || 0)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>Car Wash ({formData.carWashesCount} washes)</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.carWashCash) || 0)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>Parking Fees</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(formData.parkingFeesCollected) || 0)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>Gas (6kg: {formData.gas6kgSold}, 13kg: {formData.gas13kgSold})</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency((parseFloat(formData.gasCashCollected) || 0) + (parseFloat(formData.gasMpesaCollected) || 0))}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px', borderRadius: '12px', color: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>TOTAL MONEY COLLECTED</p>
                    <p style={{ fontSize: '36px', fontWeight: '700' }}>{formatCurrency(totalMoney)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>TOTAL PROFIT</p>
                    <p style={{ fontSize: '36px', fontWeight: '700' }}>{formatCurrency(totalProfit)}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '40px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '12px 32px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print Report
                </button>
                <button
                  onClick={() => setShowReport(false)}
                  style={{
                    padding: '12px 32px',
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftReport;