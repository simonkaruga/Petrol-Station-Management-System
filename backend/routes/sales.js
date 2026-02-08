const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const Sale = require('../models/sale');
const Product = require('../models/product');
const Inventory = require('../models/inventory');
const Shift = require('../models/shift');
const CreditTransaction = require('../models/creditTransaction');
const User = require('../models/user');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, paymentMethod, productId, userId, shiftId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }
    
    // Other filters
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    if (productId) {
      where.productId = productId;
    }
    if (userId) {
      where.userId = userId;
    }
    if (shiftId) {
      where.shiftId = shiftId;
    }

    const sales = await Sale.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
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
        },
        {
          model: Shift,
          as: 'shift',
          attributes: ['id', 'startTime', 'endTime']
        }
      ]
    });

    res.json({
      success: true,
      data: sales.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(sales.count / limit),
        totalSales: sales.count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
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
        },
        {
          model: Shift,
          as: 'shift',
          attributes: ['id', 'startTime', 'endTime']
        },
        {
          model: CreditTransaction,
          as: 'creditTransaction',
          attributes: ['customerName', 'creditLimit', 'currentBalance']
        }
      ]
    });

    if (!sale) {
      return next(new ErrorResponse('Sale not found', 404));
    }

    res.json({
      success: true,
      data: sale
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
router.post('/', 
  authenticateToken, 
  requirePermission('manage_sales'),
  [
    body('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('paymentMethod').isIn(['cash', 'mpesa', 'card', 'credit', 'bank_transfer']).withMessage('Invalid payment method'),
    body('customerName').optional().isLength({ min: 2 }).withMessage('Customer name must be at least 2 characters')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        productId, quantity, paymentMethod, customerName, customerPhone, 
        discount, notes, creditTransactionId
      } = req.body;

      // Check if product exists and get current price
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get current inventory and price
      const inventory = await Inventory.findOne({ where: { productId } });
      if (!inventory) {
        return res.status(400).json({
          success: false,
          message: 'Product inventory not found'
        });
      }

      // Check stock availability for non-credit sales
      if (paymentMethod !== 'credit' && inventory.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${inventory.quantity} ${product.unit}`
        });
      }

      // Handle credit sales
      let creditTransaction = null;
      if (paymentMethod === 'credit') {
        if (!customerName) {
          return res.status(400).json({
            success: false,
            message: 'Customer name is required for credit sales'
          });
        }

        if (creditTransactionId) {
          creditTransaction = await CreditTransaction.findByPk(creditTransactionId);
          if (!creditTransaction) {
            return res.status(400).json({
              success: false,
              message: 'Invalid credit transaction'
            });
          }
        } else {
          // Create new credit transaction
          creditTransaction = await CreditTransaction.create({
            userId: req.user.id,
            customerName,
            customerPhone,
            creditLimit: 50000, // Default credit limit
            currentBalance: 0,
            creditType: 'customer',
            creditDate: new Date()
          });
        }

        // Check credit limit
        const totalAmount = quantity * inventory.sellingPrice - (discount || 0);
        if (creditTransaction.currentBalance + totalAmount > creditTransaction.creditLimit) {
          return res.status(400).json({
            success: false,
            message: 'Credit limit exceeded'
          });
        }
      }

      // Get active shift for the user
      const activeShift = await Shift.findOne({
        where: {
          userId: req.user.id,
          status: 'active'
        }
      });

      // Create sale
      const sale = await Sale.create({
        productId,
        userId: req.user.id,
        shiftId: activeShift ? activeShift.id : null,
        quantity,
        unitPrice: inventory.sellingPrice,
        discount: discount || 0,
        paymentMethod,
        paymentReference: req.body.paymentReference || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        creditTransactionId: creditTransaction ? creditTransaction.id : null,
        notes: notes || null
      });

      // Update inventory
      if (paymentMethod !== 'credit') {
        await inventory.update({
          quantity: inventory.quantity - quantity,
          updatedById: req.user.id
        });
      } else if (creditTransaction) {
        // Update credit balance
        await creditTransaction.update({
          currentBalance: creditTransaction.currentBalance + sale.totalAmount
        });
      }

      // Update shift totals if shift exists
      if (activeShift) {
        await activeShift.update({
          totalSales: Sequelize.literal('totalSales + ' + sale.totalAmount)
        });
      }

      res.status(201).json({
        success: true,
        data: sale
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
router.put('/:id', 
  authenticateToken, 
  requirePermission('manage_sales'),
  [
    body('quantity').optional().isNumeric().withMessage('Quantity must be a number'),
    body('paymentMethod').optional().isIn(['cash', 'mpesa', 'card', 'credit', 'bank_transfer']).withMessage('Invalid payment method'),
    body('discount').optional().isNumeric().withMessage('Discount must be a number')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const sale = await Sale.findByPk(req.params.id);
      if (!sale) {
        return next(new ErrorResponse('Sale not found', 404));
      }

      const {
        quantity, paymentMethod, customerName, customerPhone, discount, notes
      } = req.body;

      // For completed sales, only allow updating certain fields
      if (sale.isCompleted && (quantity || paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify quantity or payment method for completed sales'
        });
      }

      // Update sale
      await sale.update({
        quantity: quantity !== undefined ? quantity : sale.quantity,
        paymentMethod: paymentMethod || sale.paymentMethod,
        paymentReference: req.body.paymentReference || sale.paymentReference,
        customerName: customerName || sale.customerName,
        customerPhone: customerPhone || sale.customerPhone,
        discount: discount !== undefined ? discount : sale.discount,
        notes: notes || sale.notes
      });

      res.json({
        success: true,
        data: sale
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private
router.delete('/:id', authenticateToken, requirePermission('manage_sales'), async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return next(new ErrorResponse('Sale not found', 404));
    }

    if (sale.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed sales'
      });
    }

    await sale.destroy();

    res.json({
      success: true,
      message: 'Sale deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Complete sale
// @route   PUT /api/sales/:id/complete
// @access  Private
router.put('/:id/complete', authenticateToken, requirePermission('manage_sales'), async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return next(new ErrorResponse('Sale not found', 404));
    }

    if (sale.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Sale is already completed'
      });
    }

    // Update inventory for non-credit sales
    if (sale.paymentMethod !== 'credit') {
      const inventory = await Inventory.findOne({ where: { productId: sale.productId } });
      if (inventory && inventory.quantity >= sale.quantity) {
        await inventory.update({
          quantity: inventory.quantity - sale.quantity,
          updatedById: req.user.id
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock to complete sale'
        });
      }
    }

    // Complete the sale
    await sale.update({
      isCompleted: true,
      completedAt: new Date()
    });

    res.json({
      success: true,
      data: sale,
      message: 'Sale completed successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get sales summary
// @route   GET /api/sales/summary
// @access  Private
router.get('/summary', authenticateToken, async (req, res, next) => {
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

    const summary = await Sale.findAll({
      where,
      attributes: [
        'paymentMethod',
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    const totalSales = await Sale.sum('totalAmount', { where });
    const totalTransactions = await Sale.count({ where });

    res.json({
      success: true,
      data: {
        summary,
        totalSales: totalSales || 0,
        totalTransactions: totalTransactions || 0
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;