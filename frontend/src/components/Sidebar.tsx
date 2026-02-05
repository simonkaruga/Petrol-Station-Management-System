import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isAdmin } from '../utils/auth';

const Sidebar = () => {
  const location = useLocation();
  const admin = isAdmin();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/shift-report', label: 'Record Shift', icon: '📝' },
    { path: '/delivery', label: 'Record Delivery', icon: '🚛' },
    { path: '/credit', label: 'Credit Management', icon: '💳' },
    { path: '/expenses', label: 'Expenses', icon: '💰' },
    { path: '/reports', label: 'Reports', icon: '📈' },
  ];

  if (admin) {
    menuItems.push({ path: '/settings', label: 'Settings', icon: '⚙️' });
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8">⛽ Wakaruku</h1>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
