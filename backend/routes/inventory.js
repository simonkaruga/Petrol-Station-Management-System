const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const Inventory = require('../models/inventory');
const Product = require('../models/product');
const Delivery = require('../models/delivery');
const User = require('../models/user');
const { authenticate, canManageInventory } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all inventory
// @route   GET /api/inventory
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, lowStock, productId, location } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (productId) {
      where.productId = productId;
    }
    
    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }

    let include = [
      {
        model: Product,
        as: 'product',
        attributes: ['name', 'category', 'unit', 'reorderLevel']
      },
      {
        model: User,
        as: 'updatedBy',
        attributes: ['firstName', 'lastName', 'username']
      }
    ];

    // For low stock filter, we need to join with Product table
    if (lowStock) {
      include = [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category', 'unit', 'reorderLevel'],
          where: {
            reorderLevel: {
              [Op.lt]: Sequelize.col('Inventory.quantity')
            }
          }
        },
        {
          model: User,
          as: 'updatedBy',
          attributes: ['firstName', 'lastName', 'username']
        }
      ];
    }

    const inventory = await Inventory.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[Sequelize.col('product.name'), 'ASC']]
    });

    res.json({
      success: true,
      data: inventory.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(inventory.count / limit),
        totalItems: inventory.count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category', 'unit', 'reorderLevel']
        },
        {
          model: User,
          as: 'updatedBy',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    if (!inventory) {
      return next(new ErrorResponse('Inventory item not found', 404));
    }

    res.json({
      success: true,
      data: inventory
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update inventory
// @route   PUT /api/inventory/:id
// @access  Private
router.put('/:id', 
  authenticate, 
  canManageInventory,
  [
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('sellingPrice').isNumeric().withMessage('Selling price must be a number'),
    body('costPrice').optional().isNumeric().withMessage('Cost price must be a number'),
    body('location').optional().isLength({ min: 1 }).withMessage('Location cannot be empty')
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

      const inventory = await Inventory.findByPk(req.params.id);
      if (!inventory) {
        return next(new ErrorResponse('Inventory item not found', 404));
      }

      const {
        quantity, sellingPrice, costPrice, location, minLevel, maxLevel, batchNumber, expiryDate
      } = req.body;

      // Update inventory
      await inventory.update({
        quantity: quantity !== undefined ? quantity : inventory.quantity,
        sellingPrice: sellingPrice !== undefined ? sellingPrice : inventory.sellingPrice,
        costPrice: costPrice !== undefined ? costPrice : inventory.costPrice,
        location: location || inventory.location,
        minLevel: minLevel !== undefined ? minLevel : inventory.minLevel,
        maxLevel: maxLevel !== undefined ? maxLevel : inventory.maxLevel,
        batchNumber: batchNumber || inventory.batchNumber,
        expiryDate: expiryDate || inventory.expiryDate,
        updatedById: req.user.id
      });

      res.json({
        success: true,
        data: inventory
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Adjust inventory
// @route   POST /api/inventory/:id/adjust
// @access  Private
router.post('/:id/adjust', 
  authenticate, 
  canManageInventory,
  [
    body('adjustment').isNumeric().withMessage('Adjustment amount must be a number'),
    body('reason').notEmpty().withMessage('Reason for adjustment is required')
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

      const inventory = await Inventory.findByPk(req.params.id);
      if (!inventory) {
        return next(new ErrorResponse('Inventory item not found', 404));
      }

      const { adjustment, reason } = req.body;
      const newQuantity = inventory.quantity + parseFloat(adjustment);

      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot adjust inventory below zero'
        });
      }

      // Update inventory
      await inventory.update({
        quantity: newQuantity,
        updatedById: req.user.id
      });

      res.json({
        success: true,
        data: {
          ...inventory.toJSON(),
          previousQuantity: inventory.quantity,
          newQuantity,
          adjustment,
          reason
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get inventory movements
// @route   GET /api/inventory/:id/movements
// @access  Private
router.get('/:id/movements', authenticate, async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);
    if (!inventory) {
      return next(new ErrorResponse('Inventory item not found', 404));
    }

    // Get deliveries for this product
    const deliveries = await Delivery.findAll({
      where: { productId: inventory.productId },
      include: [
        {
          model: User,
          as: 'receivedBy',
          attributes: ['firstName', 'lastName', 'username']
        }
      ],
      order: [['deliveryDate', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        inventory,
        deliveries
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get inventory summary
// @route   GET /api/inventory/summary
// @access  Private
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const summary = await Inventory.findAll({
      attributes: [
        'productId',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalLocations']
      ],
      group: ['productId'],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category', 'unit']
        }
      ],
      raw: true
    });

    const totalValue = await Inventory.sum('quantity', {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: []
        }
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        summary,
        totalValue: totalValue || 0
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;