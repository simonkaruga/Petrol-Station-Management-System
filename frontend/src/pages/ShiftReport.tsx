import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const ShiftReport = () => {
  const [formData, setFormData] = useState({
    attendantName: '',
    shiftStartTime: '',
    petrolOpening: '',
    petrolClosing: '',
    dieselOpening: '',
    dieselClosing: '',
    keroseneOpening: '',
    keroseneClosing: '',
    fuelCashCollected: '',
    fuelMpesaCollected: '',
    carWashesCount: '',
    carWashCash: '',
    parkingFeesCollected: '',
    gas6kgSold: '',
    gas13kgSold: '',
    gasCashCollected: '',
    gasMpesaCollected: '',
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      await api.post('/shifts', formData);
      setSuccess('Shift report recorded successfully!');
      setFormData({
        attendantName: '',
        shiftStartTime: '',
        petrolOpening: '',
        petrolClosing: '',
        dieselOpening: '',
        dieselClosing: '',
        keroseneOpening: '',
        keroseneClosing: '',
        fuelCashCollected: '',
        fuelMpesaCollected: '',
        carWashesCount: '',
        carWashCash: '',
        parkingFeesCollected: '',
        gas6kgSold: '',
        gas13kgSold: '',
        gasCashCollected: '',
        gasMpesaCollected: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record shift');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const petrolSold = (parseFloat(formData.petrolClosing) || 0) - (parseFloat(formData.petrolOpening) || 0);
  const dieselSold = (parseFloat(formData.dieselClosing) || 0) - (parseFloat(formData.dieselOpening) || 0);
  const keroseneSold = (parseFloat(formData.keroseneClosing) || 0) - (parseFloat(formData.keroseneOpening) || 0);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="content">
          <h1>Record Shift Report</h1>

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="card">
            <form onSubmit={handleSubmit}>
              {/* Shift Details */}
              <h3>Shift Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Attendant Name *</label>
                  <select name="attendantName" value={formData.attendantName} onChange={handleChange} required>
                    <option value="">Select Attendant</option>
                    <option value="Attendant 1">Attendant 1</option>
                    <option value="Attendant 2">Attendant 2</option>
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
                  />
                </div>
              </div>

              {/* Fuel Readings */}
              <h3 style={{ marginTop: '30px' }}>Fuel Readings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Petrol Opening (L)</label>
                  <input type="number" step="0.01" name="petrolOpening" value={formData.petrolOpening} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Petrol Closing (L)</label>
                  <input type="number" step="0.01" name="petrolClosing" value={formData.petrolClosing} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Petrol Sold</label>
                  <input type="text" value={petrolSold.toFixed(2) + ' L'} disabled style={{ background: '#f3f4f6' }} />
                </div>

                <div className="form-group">
                  <label>Diesel Opening (L)</label>
                  <input type="number" step="0.01" name="dieselOpening" value={formData.dieselOpening} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Diesel Closing (L)</label>
                  <input type="number" step="0.01" name="dieselClosing" value={formData.dieselClosing} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Diesel Sold</label>
                  <input type="text" value={dieselSold.toFixed(2) + ' L'} disabled style={{ background: '#f3f4f6' }} />
                </div>

                <div className="form-group">
                  <label>Kerosene Opening (L)</label>
                  <input type="number" step="0.01" name="keroseneOpening" value={formData.keroseneOpening} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Kerosene Closing (L)</label>
                  <input type="number" step="0.01" name="keroseneClosing" value={formData.keroseneClosing} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Kerosene Sold</label>
                  <input type="text" value={keroseneSold.toFixed(2) + ' L'} disabled style={{ background: '#f3f4f6' }} />
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
              <h3 style={{ marginTop: '30px' }}>Gas Cylinders</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>6kg Sold</label>
                  <input type="number" name="gas6kgSold" value={formData.gas6kgSold} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>13kg Sold</label>
                  <input type="number" name="gas13kgSold" value={formData.gas13kgSold} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Gas Cash (KES)</label>
                  <input type="number" step="0.01" name="gasCashCollected" value={formData.gasCashCollected} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Gas M-Pesa (KES)</label>
                  <input type="number" step="0.01" name="gasMpesaCollected" value={formData.gasMpesaCollected} onChange={handleChange} />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '30px' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Shift Report'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftReport;