const express = require('express');
const { Op, Sequelize } = require('sequelize');
const Sale = require('../models/sale');
const Expense = require('../models/expense');
const Delivery = require('../models/delivery');
const Inventory = require('../models/inventory');
const Product = require('../models/product');
const Shift = require('../models/shift');
const CreditTransaction = require('../models/creditTransaction');
const User = require('../models/user');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
router.get('/sales', authenticateToken, requirePermission('view_reports'), async (req, res, next) => {
  try {
    const { startDate, endDate, userId, productId, paymentMethod } = req.query;

    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (productId) {
      where.productId = productId;
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category']
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const totalSales = await Sale.sum('totalAmount', { where });
    const totalTransactions = await Sale.count({ where });
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Group by payment method
    const paymentMethodSummary = await Sale.findAll({
      where,
      attributes: [
        'paymentMethod',
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        sales,
        summary: {
          totalSales: totalSales || 0,
          totalTransactions: totalTransactions || 0,
          averageTransaction: parseFloat(averageTransaction.toFixed(2)),
          paymentMethodSummary
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
router.get('/inventory', authenticateToken, requirePermission('view_reports'), async (req, res, next) => {
  try {
    const { lowStock, expired, productId } = req.query;

    const where = {};
    if (productId) {
      where.productId = productId;
    }

    let include = [
      {
        model: Product,
        as: 'product',
        attributes: ['name', 'category', 'unit', 'reorderLevel']
      }
    ];

    // Filter for low stock
    if (lowStock) {
      include[0].where = {
        reorderLevel: {
          [Op.gt]: Sequelize.col('Inventory.quantity')
        }
      };
    }

    // Filter for expired items
    if (expired) {
      where.expiryDate = {
        [Op.lt]: new Date()
      };
    }

    const inventory = await Inventory.findAll({
      where,
      include,
      order: [[Sequelize.col('product.name'), 'ASC']]
    });

    // Calculate total inventory value
    const totalValue = inventory.reduce((sum, item) => {
      return sum + (item.quantity * (item.costPrice || 0));
    }, 0);

    res.json({
      success: true,
      data: {
        inventory,
        summary: {
          totalItems: inventory.length,
          totalValue: parseFloat(totalValue.toFixed(2)),
          lowStockCount: inventory.filter(item => item.quantity <= item.product.reorderLevel).length,
          expiredCount: inventory.filter(item => item.expiryDate && item.expiryDate < new Date()).length
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get financial report
// @route   GET /api/reports/financial
// @access  Private
router.get('/financial', authenticateToken, requirePermission('view_reports'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const salesTotal = await Sale.sum('totalAmount', { where });
    const expensesTotal = await Expense.sum('amount', { where });
    const deliveriesTotal = await Delivery.sum(Sequelize.literal('quantity * costPrice'), { where });

    const profit = (salesTotal || 0) - (expensesTotal || 0) - (deliveriesTotal || 0);

    // Daily sales trend
    const dailySales = await Sale.findAll({
      where,
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        summary: {
          salesTotal: salesTotal || 0,
          expensesTotal: expensesTotal || 0,
          purchasesTotal: deliveriesTotal || 0,
          profit: parseFloat(profit.toFixed(2))
        },
        dailySales
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get employee performance report
// @route   GET /api/reports/employees
// @access  Private
router.get('/employees', authenticateToken, requirePermission('view_reports'), async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }
    
    if (userId) {
      where.userId = userId;
    }

    const salesByUser = await Sale.findAll({
      where,
      attributes: [
        'userId',
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalSales'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'transactionCount'],
        [Sequelize.fn('AVG', Sequelize.col('totalAmount')), 'averageTransaction']
      ],
      group: ['userId'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username', 'role']
        }
      ],
      raw: true
    });

    const shiftsByUser = await Shift.findAll({
      where,
      attributes: [
        'userId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'shiftCount'],
        [Sequelize.fn('SUM', Sequelize.literal('EXTRACT(EPOCH FROM (endTime - startTime))/3600')), 'totalHours']
      ],
      group: ['userId'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        salesByUser,
        shiftsByUser
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get credit report
// @route   GET /api/reports/credit
// @access  Private
router.get('/credit', authenticateToken, requirePermission('view_reports'), async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.creditDate = {};
      if (startDate) {
        where.creditDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.creditDate[Op.lte] = new Date(endDate);
      }
    }
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const credits = await CreditTransaction.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username']
        }
      ],
      order: [['currentBalance', 'DESC']]
    });

    const totalOutstanding = credits.reduce((sum, credit) => sum + credit.currentBalance, 0);
    const totalCreditLimit = credits.reduce((sum, credit) => sum + credit.creditLimit, 0);

    res.json({
      success: true,
      data: {
        credits,
        summary: {
          totalCustomers: credits.length,
          totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
          totalCreditLimit: parseFloat(totalCreditLimit.toFixed(2)),
          utilizationRate: totalCreditLimit > 0 ? parseFloat((totalOutstanding / totalCreditLimit * 100).toFixed(2)) : 0
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get product performance report
// @route   GET /api/reports/products
// @access  Private
router.get('/products', authenticateToken, requirePermission('view_reports'), async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const productSales = await Sale.findAll({
      where,
      attributes: [
        'productId',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'transactionCount']
      ],
      group: ['productId'],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category', 'unit']
        }
      ],
      order: [[Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'DESC']],
      raw: true
    });

    // Filter by category if specified
    let filteredProducts = productSales;
    if (category) {
      filteredProducts = productSales.filter(item => item['product.category'] === category);
    }

    res.json({
      success: true,
      data: {
        products: filteredProducts,
        summary: {
          totalProducts: filteredProducts.length,
          totalRevenue: filteredProducts.reduce((sum, item) => sum + parseFloat(item['SUM("totalAmount")']), 0),
          totalQuantity: filteredProducts.reduce((sum, item) => sum + parseFloat(item['SUM("quantity")']), 0)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;