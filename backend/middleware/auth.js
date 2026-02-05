const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid or user is inactive.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid.' 
    });
  }
};

// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Check if user can manage products
const canManageProducts = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You do not have permission to manage products.' 
    });
  }

  next();
};

// Check if user can manage sales
const canManageSales = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (!['admin', 'manager', 'attendant'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You do not have permission to manage sales.' 
    });
  }

  next();
};

// Check if user can view reports
const canViewReports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (!['admin', 'manager', 'accountant'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You do not have permission to view reports.' 
    });
  }

  next();
};

// Check if user can manage inventory
const canManageInventory = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You do not have permission to manage inventory.' 
    });
  }

  next();
};

// Check if user can manage expenses
const canManageExpenses = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (!['admin', 'manager', 'accountant'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You do not have permission to manage expenses.' 
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  canManageProducts,
  canManageSales,
  canViewReports,
  canManageInventory,
  canManageExpenses
};