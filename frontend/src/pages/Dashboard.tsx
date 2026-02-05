import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

interface FinancialData {
  summary: {
    salesTotal: number;
    expensesTotal: number;
    purchasesTotal: number;
    profit: number;
  };
}

interface InventoryItem {
  'product.name': string;
  'product.category': string;
  'SUM("quantity")': string;
  'COUNT("id")': string;
}

const Dashboard = () => {
  const [todaySales, setTodaySales] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [salesRes, inventoryRes] = await Promise.all([
        api.get(`/reports/financial?startDate=${today}&endDate=${today}`),
        api.get('/inventory/summary'),
      ]);
      
      setTodaySales(salesRes.data.data);
      setInventory(inventoryRes.data.summary || []);
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

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getProfitIcon = (profit: number) => {
    return profit >= 0 ? '📈' : '📉';
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <div className="p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's your station overview</p>
              </div>
              <div className="flex items-center space-x-4">
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Last updated</p>
                  <p className="text-sm font-medium text-gray-700">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Sales Card */}
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Sales</p>
                  <p className="text-3xl font-bold mt-2">
                    {formatCurrency(todaySales?.summary?.salesTotal || 0)}
                  </p>
                  <p className="text-green-100 text-xs mt-1">Today's revenue</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-gradient-to-br from-red-400 to-pink-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold mt-2">
                    {formatCurrency(todaySales?.summary?.expensesTotal || 0)}
                  </p>
                  <p className="text-red-100 text-xs mt-1">Operating costs</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Purchases Card */}
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Purchases</p>
                  <p className="text-3xl font-bold mt-2">
                    {formatCurrency(todaySales?.summary?.purchasesTotal || 0)}
                  </p>
                  <p className="text-blue-100 text-xs mt-1">Inventory costs</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Net Profit Card */}
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Net Profit</p>
                  <p className={`text-3xl font-bold mt-2 ${getProfitColor(todaySales?.summary?.profit || 0)}`}>
                    {formatCurrency(todaySales?.summary?.profit || 0)}
                  </p>
                  <p className="text-purple-100 text-xs mt-1 flex items-center">
                    {getProfitIcon(todaySales?.summary?.profit || 0)} {todaySales?.summary?.profit >= 0 ? 'Profitable' : 'Loss'}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Performance Overview */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Performance Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Sales Growth</p>
                    <p className="text-2xl font-bold text-green-600">+12.5%</p>
                  </div>
                  <div className="text-4xl">🚀</div>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Customer Satisfaction</p>
                    <p className="text-2xl font-bold text-blue-600">4.8/5.0</p>
                  </div>
                  <div className="text-4xl">⭐</div>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Inventory Turnover</p>
                    <p className="text-2xl font-bold text-yellow-600">3.2x</p>
                  </div>
                  <div className="text-4xl">🔄</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Add New Sale</span>
                    <span className="text-blue-500">+</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-green-50 transition-colors border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Manage Inventory</span>
                    <span className="text-green-500">📦</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition-colors border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">View Reports</span>
                    <span className="text-purple-500">📊</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-red-50 transition-colors border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Shift Management</span>
                    <span className="text-red-500">⏰</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📦 Inventory Summary</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Active Products</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider rounded-tl-lg">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider rounded-tr-lg">
                      Locations
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {item['product.name']?.charAt(0) || 'P'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item['product.name'] || 'Unknown Product'}
                            </div>
                            <div className="text-xs text-gray-500">Product ID: {index + 1}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {item['product.category'] || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {parseFloat(item['SUM("quantity")']).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>{item['COUNT("id")']} locations</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {inventory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">📦</div>
                <p>No inventory data available</p>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">⛽</div>
              <p className="text-sm text-gray-600 mb-1">Fuel Sales</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency((todaySales?.summary?.salesTotal || 0) * 0.7)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-sm text-gray-600 mb-1">Store Sales</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency((todaySales?.summary?.salesTotal || 0) * 0.3)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-purple-600">12</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;