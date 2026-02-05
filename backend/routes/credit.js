const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const CreditTransaction = require('../models/creditTransaction');
const Sale = require('../models/sale');
const User = require('../models/user');
const { authenticate, canManageSales } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all credit transactions
// @route   GET /api/credit
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, customerName, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (customerName) {
      where.customerName = { [Op.iLike]: `%${customerName}%` };
    }
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    if (startDate || endDate) {
      where.creditDate = {};
      if (startDate) {
        where.creditDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.creditDate[Op.lte] = new Date(endDate);
      }
    }

    const credits = await CreditTransaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['customerName', 'ASC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    const totalOutstanding = credits.rows.reduce((sum, credit) => sum + credit.currentBalance, 0);

    res.json({
      success: true,
      data: credits.rows,
      summary: {
        totalOutstanding: totalOutstanding
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(credits.count / limit),
        totalCustomers: credits.count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single credit transaction
// @route   GET /api/credit/:id
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const credit = await CreditTransaction.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    if (!credit) {
      return next(new ErrorResponse('Credit transaction not found', 404));
    }

    // Get credit history (sales)
    const sales = await Sale.findAll({
      where: { creditTransactionId: credit.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        ...credit.toJSON(),
        sales
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create new credit account
// @route   POST /api/credit
// @access  Private
router.post('/', 
  authenticate, 
  canManageSales,
  [
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('creditLimit').isNumeric().withMessage('Credit limit must be a number'),
    body('creditType').isIn(['customer', 'corporate', 'employee']).withMessage('Invalid credit type')
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
        customerName, customerPhone, customerAddress, creditLimit, 
        creditType, notes
      } = req.body;

      const credit = await CreditTransaction.create({
        userId: req.user.id,
        customerName,
        customerPhone: customerPhone || null,
        customerAddress: customerAddress || null,
        creditLimit: creditLimit || 0,
        currentBalance: 0,
        creditType: creditType || 'customer',
        creditDate: new Date(),
        notes: notes || null
      });

      res.status(201).json({
        success: true,
        data: credit
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update credit account
// @route   PUT /api/credit/:id
// @access  Private
router.put('/:id', 
  authenticate, 
  canManageSales,
  [
    body('creditLimit').optional().isNumeric().withMessage('Credit limit must be a number'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
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

      const credit = await CreditTransaction.findByPk(req.params.id);
      if (!credit) {
        return next(new ErrorResponse('Credit transaction not found', 404));
      }

      const { creditLimit, isActive, notes } = req.body;

      await credit.update({
        creditLimit: creditLimit !== undefined ? creditLimit : credit.creditLimit,
        isActive: isActive !== undefined ? isActive : credit.isActive,
        notes: notes || credit.notes
      });

      res.json({
        success: true,
        data: credit
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Make payment to credit account
// @route   POST /api/credit/:id/payment
// @access  Private
router.post('/:id/payment', 
  authenticate, 
  canManageSales,
  [
    body('amount').isNumeric().withMessage('Payment amount must be a number'),
    body('paymentMethod').isIn(['cash', 'mpesa', 'card', 'bank_transfer']).withMessage('Invalid payment method'),
    body('paymentReference').optional().isString().withMessage('Payment reference must be a string')
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

      const credit = await CreditTransaction.findByPk(req.params.id);
      if (!credit) {
        return next(new ErrorResponse('Credit transaction not found', 404));
      }

      const { amount, paymentMethod, paymentReference, notes } = req.body;

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than zero'
        });
      }

      if (amount > credit.currentBalance) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount cannot exceed current balance'
        });
      }

      // Create a sale record to represent the payment (negative amount)
      const paymentSale = await Sale.create({
        productId: null, // No product for payment
        userId: req.user.id,
        quantity: 0,
        unitPrice: 0,
        totalAmount: -amount, // Negative amount represents payment
        paymentMethod,
        paymentReference: paymentReference || null,
        customerName: credit.customerName,
        customerPhone: credit.customerPhone,
        notes: notes || 'Credit payment',
        isCompleted: true,
        completedAt: new Date()
      });

      // Update credit balance
      await credit.update({
        currentBalance: credit.currentBalance - amount
      });

      res.json({
        success: true,
        data: {
          payment: paymentSale,
          updatedCredit: credit,
          message: 'Payment recorded successfully'
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get credit statement
// @route   GET /api/credit/:id/statement
// @access  Private
router.get('/:id/statement', authenticate, async (req, res, next) => {
  try {
    const credit = await CreditTransaction.findByPk(req.params.id);
    if (!credit) {
      return next(new ErrorResponse('Credit transaction not found', 404));
    }

    const sales = await Sale.findAll({
      where: { creditTransactionId: credit.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Calculate running balance
    let runningBalance = 0;
    const statement = sales.map(sale => {
      runningBalance += sale.totalAmount;
      return {
        ...sale.toJSON(),
        runningBalance
      };
    });

    res.json({
      success: true,
      data: {
        credit,
        statement,
        currentBalance: credit.currentBalance
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete credit account
// @route   DELETE /api/credit/:id
// @access  Private
router.delete('/:id', authenticate, canManageSales, async (req, res, next) => {
  try {
    const credit = await CreditTransaction.findByPk(req.params.id);
    if (!credit) {
      return next(new ErrorResponse('Credit transaction not found', 404));
    }

    if (credit.currentBalance > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete credit account with outstanding balance'
      });
    }

    await credit.destroy();

    res.json({
      success: true,
      message: 'Credit account deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;