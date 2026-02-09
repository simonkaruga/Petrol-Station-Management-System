import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

interface ShiftData {
  id: number;
  attendantName: string;
  shiftStartTime: string;
  petrolSold: number;
  dieselSold: number;
  keroseneSold: number;
  petrolProfit: number;
  dieselProfit: number;
  keroseneProfit: number;
  totalMoney: number;
  totalProfit: number;
  createdAt: string;
}

const MonthlyReport = () => {
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchShifts();
  }, [selectedMonth]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/shifts?month=${selectedMonth}`);
      const shiftsData = response.data.data.map((shift: any) => {
        const petrolSold = (parseFloat(shift.petrolClosing) || 0) - (parseFloat(shift.petrolOpening) || 0);
        const dieselSold = (parseFloat(shift.dieselClosing) || 0) - (parseFloat(shift.dieselOpening) || 0);
        const keroseneSold = (parseFloat(shift.keroseneClosing) || 0) - (parseFloat(shift.keroseneOpening) || 0);

        const petrolProfit = petrolSold * ((parseFloat(shift.petrolSellPrice) || 0) - (parseFloat(shift.petrolBuyPrice) || 0));
        const dieselProfit = dieselSold * ((parseFloat(shift.dieselSellPrice) || 0) - (parseFloat(shift.dieselBuyPrice) || 0));
        const keroseneProfit = keroseneSold * ((parseFloat(shift.keroseneSellPrice) || 0) - (parseFloat(shift.keroseneBuyPrice) || 0));

        const totalMoney = 
          (parseFloat(shift.fuelCashCollected) || 0) +
          (parseFloat(shift.fuelMpesaCollected) || 0) +
          (parseFloat(shift.carWashCash) || 0) +
          (parseFloat(shift.parkingFeesCollected) || 0) +
          (parseFloat(shift.gasCashCollected) || 0) +
          (parseFloat(shift.gasMpesaCollected) || 0);

        const servicesProfit = ((parseFloat(shift.carWashCash) || 0) + (parseFloat(shift.parkingFeesCollected) || 0)) * 0.5;
        const gasProfit = ((parseFloat(shift.gasCashCollected) || 0) + (parseFloat(shift.gasMpesaCollected) || 0)) * 0.2;
        const totalProfit = petrolProfit + dieselProfit + keroseneProfit + servicesProfit + gasProfit;

        return {
          id: shift.id,
          attendantName: shift.attendantName,
          shiftStartTime: shift.shiftStartTime,
          petrolSold,
          dieselSold,
          keroseneSold,
          petrolProfit,
          dieselProfit,
          keroseneProfit,
          totalMoney,
          totalProfit,
          createdAt: shift.createdAt
        };
      });
      setShifts(shiftsData);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
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

  const totals = shifts.reduce((acc, shift) => ({
    petrolSold: acc.petrolSold + shift.petrolSold,
    dieselSold: acc.dieselSold + shift.dieselSold,
    keroseneSold: acc.keroseneSold + shift.keroseneSold,
    petrolProfit: acc.petrolProfit + shift.petrolProfit,
    dieselProfit: acc.dieselProfit + shift.dieselProfit,
    keroseneProfit: acc.keroseneProfit + shift.keroseneProfit,
    totalMoney: acc.totalMoney + shift.totalMoney,
    totalProfit: acc.totalProfit + shift.totalProfit,
  }), {
    petrolSold: 0,
    dieselSold: 0,
    keroseneSold: 0,
    petrolProfit: 0,
    dieselProfit: 0,
    keroseneProfit: 0,
    totalMoney: 0,
    totalProfit: 0,
  });

  return (
    <div className="app-container">
      <Sidebar />
      <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1>Monthly Shift Report</h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={() => window.print()}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Report
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Loading shifts...</div>
          ) : shifts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
              No shifts recorded for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          ) : (
            <>
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #667eea' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
                    MONTHLY SHIFT REPORT
                  </h2>
                  <p style={{ color: '#718096', fontSize: '16px' }}>
                    {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ color: '#718096', fontSize: '14px' }}>Wakaruku Petrol Station</p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Attendant</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Petrol (L)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Diesel (L)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Kerosene (L)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Petrol Profit</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Diesel Profit</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Kerosene Profit</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Total Money</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Total Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((shift, index) => (
                        <tr key={shift.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '12px 8px' }}>
                            {new Date(shift.shiftStartTime).toLocaleDateString('en-GB')}
                          </td>
                          <td style={{ padding: '12px 8px' }}>{shift.attendantName}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>{shift.petrolSold.toFixed(2)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>{shift.dieselSold.toFixed(2)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>{shift.keroseneSold.toFixed(2)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#10b981' }}>{formatCurrency(shift.petrolProfit)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#10b981' }}>{formatCurrency(shift.dieselProfit)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#10b981' }}>{formatCurrency(shift.keroseneProfit)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(shift.totalMoney)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#667eea' }}>{formatCurrency(shift.totalProfit)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: '700', fontSize: '14px' }}>
                        <td colSpan={2} style={{ padding: '16px 8px' }}>MONTHLY TOTALS ({shifts.length} shifts)</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>{totals.petrolSold.toFixed(2)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>{totals.dieselSold.toFixed(2)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>{totals.keroseneSold.toFixed(2)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>{formatCurrency(totals.petrolProfit)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>{formatCurrency(totals.dieselProfit)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>{formatCurrency(totals.keroseneProfit)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>{formatCurrency(totals.totalMoney)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>{formatCurrency(totals.totalProfit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ 
                marginTop: '24px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                padding: '32px', 
                borderRadius: '12px', 
                color: 'white' 
              }}>
                <h3 style={{ fontSize: '20px', marginBottom: '24px', textAlign: 'center' }}>MONTHLY SUMMARY</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>Total Shifts</p>
                    <p style={{ fontSize: '32px', fontWeight: '700' }}>{shifts.length}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>Total Fuel Sold</p>
                    <p style={{ fontSize: '32px', fontWeight: '700' }}>{(totals.petrolSold + totals.dieselSold + totals.keroseneSold).toFixed(0)}L</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>Total Money Collected</p>
                    <p style={{ fontSize: '32px', fontWeight: '700' }}>{formatCurrency(totals.totalMoney)}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>Total Profit</p>
                    <p style={{ fontSize: '32px', fontWeight: '700' }}>{formatCurrency(totals.totalProfit)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
