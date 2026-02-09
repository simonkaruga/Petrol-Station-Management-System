import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    reportType: 'sales'
  });

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/reports/${filters.reportType}?startDate=${filters.startDate}&endDate=${filters.endDate}`);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const exportToCSV = () => {
    if (!reportData) return;
    const headers = Object.keys(reportData.data[0] || {});
    const csvContent = [
      headers.join(','),
      ...reportData.data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filters.reportType}-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Sidebar />
      <div style={{ marginLeft: '256px', minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>Reports</h1>
          
          {error && <div style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Generate Report</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Report Type</label>
                <select
                  value={filters.reportType}
                  onChange={(e) => setFilters({...filters, reportType: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="sales">Sales Report</option>
                  <option value="deliveries">Delivery Report</option>
                  <option value="expenses">Expense Report</option>
                  <option value="credit">Credit Report</option>
                  <option value="inventory">Inventory Report</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={generateReport}
                  disabled={loading}
                  style={{ width: '100%', background: '#667eea', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>
          {reportData && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                  {reportData.title} - {new Date(reportData.generatedAt).toLocaleDateString()}
                </h2>
                <button
                  onClick={exportToCSV}
                  style={{ background: '#10b981', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Export to CSV
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {reportData.summary && Object.entries(reportData.summary).map(([key, value]) => (
                  <div key={key} style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>{key}</h3>
                    <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginTop: '4px' }}>
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      {Object.keys(reportData.data[0] || {}).map((key) => (
                        <th key={key} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
