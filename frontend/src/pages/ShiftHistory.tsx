import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { isAdmin } from '../utils/auth';

const ShiftHistory = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const admin = isAdmin();

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await api.get('/shifts?limit=50');
      setShifts(response.data.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewShiftDetails = async (shiftId: number) => {
    try {
      const response = await api.get(`/shifts/${shiftId}`);
      setSelectedShift(response.data.data);
      setEditData(response.data.data);
      setEditMode(false);
    } catch (error) {
      console.error('Error fetching shift details:', error);
    }
  };

  const handleEdit = async () => {
    // If shift is locked, unlock it first
    if (selectedShift.isLocked) {
      if (!window.confirm('This shift is locked. Unlock it to edit?')) return;
      try {
        await api.put(`/shifts/${selectedShift.id}/unlock`);
        const response = await api.get(`/shifts/${selectedShift.id}`);
        setSelectedShift(response.data.data);
        setEditData(response.data.data);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to unlock shift');
        return;
      }
    }
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditData(selectedShift);
    setEditMode(false);
  };

  const handleSaveChanges = async () => {
    if (!window.confirm('Save changes to this shift?')) return;
    
    try {
      console.log('Saving shift data:', editData);
      const response = await api.put(`/shifts/${selectedShift.id}`, editData);
      console.log('Save response:', response.data);
      alert('Changes saved successfully! The shift will remain unlocked.');
      viewShiftDetails(selectedShift.id);
      fetchShifts();
    } catch (error: any) {
      console.error('Save error details:', error.response?.data);
      console.error('Full error:', error);
      alert(error.response?.data?.message || 'Failed to save changes. Check console for details.');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleUnlock = async (shiftId: number) => {
    if (!window.confirm('Are you sure you want to unlock this shift for editing?')) return;
    
    try {
      await api.put(`/shifts/${shiftId}/unlock`);
      alert('Shift unlocked successfully!');
      fetchShifts();
      if (selectedShift && selectedShift.id === shiftId) {
        viewShiftDetails(shiftId);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to unlock shift');
    }
  };

  const handleLock = async (shiftId: number) => {
    if (!window.confirm('Are you sure you want to lock this shift?')) return;
    
    try {
      await api.put(`/shifts/${shiftId}/lock`);
      alert('Shift locked successfully!');
      fetchShifts();
      if (selectedShift && selectedShift.id === shiftId) {
        viewShiftDetails(shiftId);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to lock shift');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>
            Shift History
          </h1>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading shifts...</div>
          ) : (
            <div className="card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Attendant</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Sales</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Money</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift: any) => {
                    const totalMoney = 
                      (parseFloat(shift.fuelCashCollected) || 0) +
                      (parseFloat(shift.fuelMpesaCollected) || 0) +
                      (parseFloat(shift.carWashCash) || 0) +
                      (parseFloat(shift.parkingFeesCollected) || 0) +
                      (parseFloat(shift.gasCashCollected) || 0) +
                      (parseFloat(shift.gasMpesaCollected) || 0);

                    // Calculate expected revenue
                    const petrolSold = (parseFloat(shift.petrolClosing) || 0) - (parseFloat(shift.petrolOpening) || 0);
                    const dieselSold = (parseFloat(shift.dieselClosing) || 0) - (parseFloat(shift.dieselOpening) || 0);
                    const keroseneSold = (parseFloat(shift.keroseneClosing) || 0) - (parseFloat(shift.keroseneOpening) || 0);
                    
                    const expectedRevenue = 
                      (petrolSold * (parseFloat(shift.petrolSellPrice) || 0)) +
                      (dieselSold * (parseFloat(shift.dieselSellPrice) || 0)) +
                      (keroseneSold * (parseFloat(shift.keroseneSellPrice) || 0));
                    
                    const loss = expectedRevenue - (parseFloat(shift.fuelCashCollected) || 0) - (parseFloat(shift.fuelMpesaCollected) || 0);
                    const hasLoss = loss > 50; // Threshold of 50 KES

                    return (
                      <tr key={shift.id} style={{ borderBottom: '1px solid #e5e7eb', background: hasLoss ? '#fef2f2' : 'white' }}>
                        <td style={{ padding: '12px' }}>
                          {new Date(shift.startTime).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px' }}>{shift.attendantName}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          {formatCurrency(shift.totalSales)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                          {formatCurrency(totalMoney)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: shift.status === 'closed' ? '#d1fae5' : '#fef3c7',
                            color: shift.status === 'closed' ? '#065f46' : '#92400e'
                          }}>
                            {shift.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => viewShiftDetails(shift.id)}
                              style={{
                                padding: '6px 16px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              View
                            </button>
                            {admin && shift.isLocked && (
                              <button
                                onClick={() => handleUnlock(shift.id)}
                                style={{
                                  padding: '6px 16px',
                                  background: '#f59e0b',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                title="Unlock for editing"
                              >
                                🔓 Unlock
                              </button>
                            )}
                            {admin && !shift.isLocked && (
                              <button
                                onClick={() => handleLock(shift.id)}
                                style={{
                                  padding: '6px 16px',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                title="Lock shift"
                              >
                                🔒 Lock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Shift Details Modal */}
          {selectedShift && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto',
                width: '90%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Shift Details</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {admin && !editMode && (
                      <button
                        onClick={handleEdit}
                        style={{
                          padding: '8px 16px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {admin && editMode && (
                      <>
                        <button
                          onClick={handleSaveChanges}
                          style={{
                            padding: '8px 16px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            padding: '8px 16px',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedShift(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p><strong>Attendant:</strong> 
                    {editMode ? (
                      <input 
                        type="text" 
                        value={editData.attendantName} 
                        onChange={(e) => handleInputChange('attendantName', e.target.value)}
                        style={{ marginLeft: '8px', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                      />
                    ) : (
                      ` ${selectedShift.attendantName}`
                    )}
                  </p>
                  <p><strong>Date:</strong> {new Date(selectedShift.startTime).toLocaleString()}</p>
                  <p><strong>Status:</strong> {selectedShift.status}</p>
                  {selectedShift.isLocked && (
                    <p style={{ color: '#f59e0b', fontWeight: '600', marginTop: '8px' }}>
                      🔒 This shift is locked
                    </p>
                  )}
                  {!selectedShift.isLocked && (
                    <p style={{ color: '#10b981', fontWeight: '600', marginTop: '8px' }}>
                      🔓 This shift is unlocked for editing
                    </p>
                  )}
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '24px', marginBottom: '12px' }}>
                  Fuel Sales
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Fuel</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Opening</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Closing</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Sold (L)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px' }}>Petrol</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {editMode ? (
                          <input 
                            type="number" 
                            step="0.01"
                            value={editData.petrolOpening} 
                            onChange={(e) => handleInputChange('petrolOpening', e.target.value)}
                            style={{ width: '80px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'right' }}
                          />
                        ) : selectedShift.petrolOpening}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {editMode ? (
                          <input 
                            type="number" 
                            step="0.01"
                            value={editData.petrolClosing} 
                            onChange={(e) => handleInputChange('petrolClosing', e.target.value)}
                            style={{ width: '80px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'right' }}
                          />
                        ) : selectedShift.petrolClosing}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>
                        {((parseFloat(editMode ? editData.petrolClosing : selectedShift.petrolClosing) || 0) - (parseFloat(editMode ? editData.petrolOpening : selectedShift.petrolOpening) || 0)).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px' }}>Diesel</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {editMode ? (
                          <input 
                            type="number" 
                            step="0.01"
                            value={editData.dieselOpening} 
                            onChange={(e) => handleInputChange('dieselOpening', e.target.value)}
                            style={{ width: '80px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'right' }}
                          />
                        ) : selectedShift.dieselOpening}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {editMode ? (
                          <input 
                            type="number" 
                            step="0.01"
                            value={editData.dieselClosing} 
                            onChange={(e) => handleInputChange('dieselClosing', e.target.value)}
                            style={{ width: '80px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'right' }}
                          />
                        ) : selectedShift.dieselClosing}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>
                        {((parseFloat(editMode ? editData.dieselClosing : selectedShift.dieselClosing) || 0) - (parseFloat(editMode ? editData.dieselOpening : selectedShift.dieselOpening) || 0)).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px' }}>Kerosene</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {editMode ? (
                          <input 
                            type="number" 
                            step="0.01"
                            value={editData.keroseneOpening} 
                            onChange={(e) => handleInputChange('keroseneOpening', e.target.value)}
                            style={{ width: '80px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'right' }}
                          />
                        ) : selectedShift.keroseneOpening}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {editMode ? (
                          <input 
                            type="number" 
                            step="0.01"
                            value={editData.keroseneClosing} 
                            onChange={(e) => handleInputChange('keroseneClosing', e.target.value)}
                            style={{ width: '80px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'right' }}
                          />
                        ) : selectedShift.keroseneClosing}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>
                        {((parseFloat(editMode ? editData.keroseneClosing : selectedShift.keroseneClosing) || 0) - (parseFloat(editMode ? editData.keroseneOpening : selectedShift.keroseneOpening) || 0)).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '24px', marginBottom: '12px' }}>
                  Payments Collected
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Fuel Cash</p>
                    <p style={{ fontSize: '20px', fontWeight: '600' }}>
                      {formatCurrency(selectedShift.fuelCashCollected)}
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Fuel M-Pesa</p>
                    <p style={{ fontSize: '20px', fontWeight: '600' }}>
                      {formatCurrency(selectedShift.fuelMpesaCollected)}
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Car Wash</p>
                    <p style={{ fontSize: '20px', fontWeight: '600' }}>
                      {formatCurrency(selectedShift.carWashCash)}
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Gas Sales</p>
                    <p style={{ fontSize: '20px', fontWeight: '600' }}>
                      {formatCurrency((parseFloat(selectedShift.gasCashCollected) || 0) + (parseFloat(selectedShift.gasMpesaCollected) || 0))}
                    </p>
                  </div>
                </div>

                {/* Loss Analysis */}
                {(() => {
                  const petrolSold = (parseFloat(selectedShift.petrolClosing) || 0) - (parseFloat(selectedShift.petrolOpening) || 0);
                  const dieselSold = (parseFloat(selectedShift.dieselClosing) || 0) - (parseFloat(selectedShift.dieselOpening) || 0);
                  const keroseneSold = (parseFloat(selectedShift.keroseneClosing) || 0) - (parseFloat(selectedShift.keroseneOpening) || 0);
                  
                  const expectedFuelRevenue = 
                    (petrolSold * (parseFloat(selectedShift.petrolSellPrice) || 0)) +
                    (dieselSold * (parseFloat(selectedShift.dieselSellPrice) || 0)) +
                    (keroseneSold * (parseFloat(selectedShift.keroseneSellPrice) || 0));
                  
                  const actualFuelRevenue = (parseFloat(selectedShift.fuelCashCollected) || 0) + (parseFloat(selectedShift.fuelMpesaCollected) || 0);
                  const fuelLoss = expectedFuelRevenue - actualFuelRevenue;
                  
                  const petrolLoss = petrolSold > 0 ? (petrolSold * (parseFloat(selectedShift.petrolSellPrice) || 0)) - ((actualFuelRevenue / expectedFuelRevenue) * petrolSold * (parseFloat(selectedShift.petrolSellPrice) || 0)) : 0;
                  const dieselLoss = dieselSold > 0 ? (dieselSold * (parseFloat(selectedShift.dieselSellPrice) || 0)) - ((actualFuelRevenue / expectedFuelRevenue) * dieselSold * (parseFloat(selectedShift.dieselSellPrice) || 0)) : 0;
                  const keroseneLoss = keroseneSold > 0 ? (keroseneSold * (parseFloat(selectedShift.keroseneSellPrice) || 0)) - ((actualFuelRevenue / expectedFuelRevenue) * keroseneSold * (parseFloat(selectedShift.keroseneSellPrice) || 0)) : 0;

                  return fuelLoss > 50 ? (
                    <div style={{
                      marginTop: '24px',
                      padding: '20px',
                      background: '#fef2f2',
                      border: '2px solid #ef4444',
                      borderRadius: '12px'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626', marginBottom: '16px' }}>
                        ⚠️ Loss Detected
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Expected Fuel Revenue</p>
                          <p style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(expectedFuelRevenue)}</p>
                        </div>
                        <div style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Actual Fuel Revenue</p>
                          <p style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(actualFuelRevenue)}</p>
                        </div>
                      </div>
                      <div style={{ padding: '16px', background: '#dc2626', borderRadius: '8px', color: 'white', marginBottom: '12px' }}>
                        <p style={{ fontSize: '14px', opacity: 0.9 }}>TOTAL LOSS</p>
                        <p style={{ fontSize: '32px', fontWeight: '700' }}>{formatCurrency(fuelLoss)}</p>
                      </div>
                      <div style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>Loss Breakdown:</p>
                        {petrolSold > 0 && petrolLoss > 10 && (
                          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>• Petrol: {formatCurrency(petrolLoss)}</p>
                        )}
                        {dieselSold > 0 && dieselLoss > 10 && (
                          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>• Diesel: {formatCurrency(dieselLoss)}</p>
                        )}
                        {keroseneSold > 0 && keroseneLoss > 10 && (
                          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>• Kerosene: {formatCurrency(keroseneLoss)}</p>
                        )}
                        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', fontStyle: 'italic' }}>
                          Possible causes: Meter reading errors, unpaid sales, fuel spillage, or theft
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}

                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>TOTAL MONEY COLLECTED</p>
                  <p style={{ fontSize: '32px', fontWeight: '700' }}>
                    {formatCurrency(
                      (parseFloat(selectedShift.fuelCashCollected) || 0) +
                      (parseFloat(selectedShift.fuelMpesaCollected) || 0) +
                      (parseFloat(selectedShift.carWashCash) || 0) +
                      (parseFloat(selectedShift.parkingFeesCollected) || 0) +
                      (parseFloat(selectedShift.gasCashCollected) || 0) +
                      (parseFloat(selectedShift.gasMpesaCollected) || 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftHistory;
