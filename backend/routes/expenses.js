const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const Expense = require('../models/expense');
const Shift = require('../models/shift');
const User = require('../models/user');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userId, category, startDate, endDate, isApproved } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (isApproved !== undefined) {
      where.isApproved = isApproved;
    }
    
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.expenseDate[Op.lte] = new Date(endDate);
      }
    }

    const expenses = await Expense.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['expenseDate', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username']
        },
        {
          model: User,
          as: 'approvedByUser',
          attributes: ['firstName', 'lastName', 'username']
        },
        {
          model: Shift,
          as: 'shift',
          attributes: ['id', 'startTime', 'endTime']
        }
      ]
    });

    const totalExpenses = await Expense.sum('amount', { where });

    res.json({
      success: true,
      data: expenses.rows,
      summary: {
        totalExpenses: totalExpenses || 0
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(expenses.count / limit),
        totalExpensesCount: expenses.count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username']
        },
        {
          model: User,
          as: 'approvedByUser',
          attributes: ['firstName', 'lastName', 'username']
        },
        {
          model: Shift,
          as: 'shift',
          attributes: ['id', 'startTime', 'endTime']
        }
      ]
    });

    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    res.json({
      success: true,
      data: expense
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
router.post('/', 
  authenticateToken, 
  requirePermission('manage_expenses'),
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(['utilities', 'maintenance', 'supplies', 'wages', 'rent', 'other']).withMessage('Invalid category'),
    body('paymentMethod').isIn(['cash', 'mpesa', 'card', 'bank_transfer']).withMessage('Invalid payment method')
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
        amount, description, category, paymentMethod, receiptNumber, 
        notes, shiftId
      } = req.body;

      // Get active shift if not provided
      let expenseShiftId = shiftId;
      if (!expenseShiftId) {
        const activeShift = await Shift.findOne({
          where: {
            userId: req.user.id,
            status: 'active'
          }
        });
        if (activeShift) {
          expenseShiftId = activeShift.id;
        }
      }

      const expense = await Expense.create({
        userId: req.user.id,
        shiftId: expenseShiftId,
        amount,
        description,
        category,
        paymentMethod,
        receiptNumber: receiptNumber || null,
        notes: notes || null,
        expenseDate: new Date()
      });

      res.status(201).json({
        success: true,
        data: expense
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put('/:id', 
  authenticateToken, 
  requirePermission('manage_expenses'),
  [
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('category').optional().isIn(['utilities', 'maintenance', 'supplies', 'wages', 'rent', 'other']).withMessage('Invalid category'),
    body('isApproved').optional().isBoolean().withMessage('isApproved must be a boolean')
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

      const expense = await Expense.findByPk(req.params.id);
      if (!expense) {
        return next(new ErrorResponse('Expense not found', 404));
      }

      const {
        amount, description, category, paymentMethod, receiptNumber, 
        notes, isApproved, approvedBy
      } = req.body;

      await expense.update({
        amount: amount !== undefined ? amount : expense.amount,
        description: description || expense.description,
        category: category || expense.category,
        paymentMethod: paymentMethod || expense.paymentMethod,
        receiptNumber: receiptNumber || expense.receiptNumber,
        notes: notes || expense.notes,
        isApproved: isApproved !== undefined ? isApproved : expense.isApproved,
        approvedBy: approvedBy || expense.approvedBy
      });

      res.json({
        success: true,
        data: expense
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Approve expense
// @route   PUT /api/expenses/:id/approve
// @access  Private
router.put('/:id/approve', authenticateToken, requirePermission('manage_expenses'), async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    if (expense.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Expense is already approved'
      });
    }

    await expense.update({
      isApproved: true,
      approvedBy: req.user.id
    });

    res.json({
      success: true,
      data: expense,
      message: 'Expense approved successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/:id', authenticateToken, requirePermission('manage_expenses'), async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    if (expense.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved expenses'
      });
    }

    await expense.destroy();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;