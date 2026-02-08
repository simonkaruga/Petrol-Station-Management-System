const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const { CreditCustomer, CreditTransaction, User } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all credit customers
// @route   GET /api/credit/customers
// @access  Private
router.get('/customers', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { customerName: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } },
        { vehicleRegistration: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const customers = await CreditCustomer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['customerName', 'ASC']]
    });

    const totalOutstanding = customers.rows.reduce((sum, customer) => 
      sum + parseFloat(customer.totalDebt), 0);

    res.json({
      success: true,
      data: customers.rows,
      summary: {
        totalOutstanding: totalOutstanding.toFixed(2)
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(customers.count / limit),
        totalCustomers: customers.count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single credit customer with transaction history
// @route   GET /api/credit/customers/:id
// @access  Private
router.get('/customers/:id', authenticateToken, async (req, res, next) => {
  try {
    const customer = await CreditCustomer.findByPk(req.params.id, {
      include: [
        {
          model: CreditTransaction,
          include: [
            {
              model: User,
              as: 'recorder',
              attributes: ['firstName', 'lastName', 'username']
            }
          ],
          order: [['transactionDate', 'DESC']]
        }
      ]
    });

    if (!customer) {
      return next(new ErrorResponse('Customer not found', 404));
    }

    res.json({
      success: true,
      data: customer
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create new credit customer
// @route   POST /api/credit/customers
// @access  Private
router.post('/customers', 
  authenticateToken, 
  requirePermission('manage_sales'),
  activityLogger('CREATE_CREDIT_CUSTOMER', 'credit_customers'),
  [
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('creditLimit').optional().isNumeric().withMessage('Credit limit must be a number')
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

      const { customerName, phoneNumber, vehicleRegistration, creditLimit } = req.body;

      const customer = await CreditCustomer.create({
        customerName,
        phoneNumber: phoneNumber || null,
        vehicleRegistration: vehicleRegistration || null,
        creditLimit: creditLimit || 0,
        totalDebt: 0
      });

      res.status(201).json({
        success: true,
        data: customer
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Record credit sale
// @route   POST /api/credit/sale
// @access  Private
router.post('/sale', 
  authenticateToken, 
  requirePermission('manage_sales'),
  activityLogger('CREDIT_SALE', 'credit_transactions'),
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('fuelType').notEmpty().withMessage('Fuel type is required'),
    body('liters').isNumeric().withMessage('Liters must be a number'),
    body('amount').isNumeric().withMessage('Amount must be a number')
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

      const { customerId, fuelType, liters, amount, notes } = req.body;

      const customer = await CreditCustomer.findByPk(customerId);
      if (!customer) {
        return next(new ErrorResponse('Customer not found', 404));
      }

      if (!customer.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Customer account is inactive'
        });
      }

      const newDebt = parseFloat(customer.totalDebt) + parseFloat(amount);
      if (newDebt > customer.creditLimit) {
        return res.status(400).json({
          success: false,
          message: 'Credit limit exceeded'
        });
      }

      const transaction = await CreditTransaction.create({
        customerId,
        transactionType: 'credit_sale',
        fuelType,
        liters,
        amount,
        recordedBy: req.user.id,
        notes: notes || null
      });

      await customer.update({
        totalDebt: newDebt
      });

      res.status(201).json({
        success: true,
        data: transaction,
        customer: {
          id: customer.id,
          name: customer.customerName,
          totalDebt: newDebt
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Record payment
// @route   POST /api/credit/payment
// @access  Private
router.post('/payment', 
  authenticateToken, 
  requirePermission('manage_sales'),
  activityLogger('CREDIT_PAYMENT', 'credit_transactions'),
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('paymentMethod').isIn(['cash', 'mpesa']).withMessage('Invalid payment method')
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

      const { customerId, amount, paymentMethod, notes } = req.body;

      const customer = await CreditCustomer.findByPk(customerId);
      if (!customer) {
        return next(new ErrorResponse('Customer not found', 404));
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than zero'
        });
      }

      if (amount > customer.totalDebt) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount cannot exceed total debt'
        });
      }

      const transaction = await CreditTransaction.create({
        customerId,
        transactionType: 'payment',
        amount,
        paymentMethod,
        recordedBy: req.user.id,
        notes: notes || null
      });

      const newDebt = parseFloat(customer.totalDebt) - parseFloat(amount);
      await customer.update({
        totalDebt: newDebt
      });

      res.status(201).json({
        success: true,
        data: transaction,
        customer: {
          id: customer.id,
          name: customer.customerName,
          totalDebt: newDebt
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get outstanding debts summary
// @route   GET /api/credit/outstanding
// @access  Private
router.get('/outstanding', authenticateToken, async (req, res, next) => {
  try {
    const customers = await CreditCustomer.findAll({
      where: {
        totalDebt: { [Op.gt]: 0 },
        isActive: true
      },
      order: [['totalDebt', 'DESC']]
    });

    const totalOutstanding = customers.reduce((sum, customer) => 
      sum + parseFloat(customer.totalDebt), 0);

    res.json({
      success: true,
      data: {
        customers,
        totalOutstanding: totalOutstanding.toFixed(2),
        count: customers.length
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete credit customer
// @route   DELETE /api/credit/customers/:id
// @access  Private
router.delete('/customers/:id', authenticateToken, requirePermission('manage_sales'), async (req, res, next) => {
  try {
    const customer = await CreditCustomer.findByPk(req.params.id);
    if (!customer) {
      return next(new ErrorResponse('Customer not found', 404));
    }

    if (customer.totalDebt > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with outstanding debt'
      });
    }

    await customer.destroy();

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;