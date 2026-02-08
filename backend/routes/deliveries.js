const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const Delivery = require('../models/delivery');
const Product = require('../models/product');
const Inventory = require('../models/inventory');
const User = require('../models/user');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Private
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, productId, supplier, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (productId) {
      where.productId = productId;
    }
    
    if (supplier) {
      where.supplier = { [Op.iLike]: `%${supplier}%` };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.deliveryDate = {};
      if (startDate) {
        where.deliveryDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.deliveryDate[Op.lte] = new Date(endDate);
      }
    }

    const deliveries = await Delivery.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['deliveryDate', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category', 'unit']
        },
        {
          model: User,
          as: 'receivedBy',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    res.json({
      success: true,
      data: deliveries.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(deliveries.count / limit),
        totalDeliveries: deliveries.count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single delivery
// @route   GET /api/deliveries/:id
// @access  Private
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category', 'unit']
        },
        {
          model: User,
          as: 'receivedBy',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    if (!delivery) {
      return next(new ErrorResponse('Delivery not found', 404));
    }

    res.json({
      success: true,
      data: delivery
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create new delivery
// @route   POST /api/deliveries
// @access  Private
router.post('/', 
  authenticateToken, 
  requirePermission('manage_inventory'),
  [
    body('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('costPrice').isNumeric().withMessage('Cost price must be a number'),
    body('supplier').notEmpty().withMessage('Supplier is required')
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
        productId, quantity, costPrice, supplier, invoiceNumber, 
        vehicleRegistration, driverName, notes
      } = req.body;

      // Check if product exists
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Create delivery
      const delivery = await Delivery.create({
        productId,
        quantity,
        costPrice,
        supplier,
        invoiceNumber: invoiceNumber || null,
        vehicleRegistration: vehicleRegistration || null,
        driverName: driverName || null,
        notes: notes || null,
        receivedById: req.user.id,
        deliveryDate: new Date()
      });

      // Update inventory
      const inventory = await Inventory.findOne({ where: { productId } });
      if (inventory) {
        await inventory.update({
          quantity: inventory.quantity + quantity,
          costPrice,
          sellingPrice: inventory.sellingPrice || costPrice * 1.2, // Default markup
          updatedById: req.user.id
        });
      } else {
        // Create new inventory record
        await Inventory.create({
          productId,
          quantity,
          costPrice,
          sellingPrice: costPrice * 1.2, // Default markup
          updatedById: req.user.id
        });
      }

      res.status(201).json({
        success: true,
        data: delivery
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update delivery
// @route   PUT /api/deliveries/:id
// @access  Private
router.put('/:id', 
  authenticateToken, 
  requirePermission('manage_inventory'),
  [
    body('status').isIn(['pending', 'received', 'cancelled']).withMessage('Invalid status')
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

      const delivery = await Delivery.findByPk(req.params.id);
      if (!delivery) {
        return next(new ErrorResponse('Delivery not found', 404));
      }

      const { status, notes } = req.body;

      await delivery.update({
        status: status || delivery.status,
        notes: notes || delivery.notes
      });

      res.json({
        success: true,
        data: delivery
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Receive delivery
// @route   PUT /api/deliveries/:id/receive
// @access  Private
router.put('/:id/receive', authenticateToken, requirePermission('manage_inventory'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return next(new ErrorResponse('Delivery not found', 404));
    }

    if (delivery.status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Delivery already received'
      });
    }

    // Update delivery status
    await delivery.update({
      status: 'received',
      receivedById: req.user.id
    });

    // Update inventory
    const inventory = await Inventory.findOne({ where: { productId: delivery.productId } });
    if (inventory) {
      await inventory.update({
        quantity: inventory.quantity + delivery.quantity,
        costPrice: delivery.costPrice,
        updatedById: req.user.id
      });
    }

    res.json({
      success: true,
      data: delivery,
      message: 'Delivery received successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;