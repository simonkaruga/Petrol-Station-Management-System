const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const Product = require('../models/product');
const Inventory = require('../models/inventory');
const PriceHistory = require('../models/priceHistory');
const User = require('../models/user');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Private
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const products = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['quantity', 'sellingPrice', 'costPrice', 'lastUpdated']
        }
      ]
    });

    res.json({
      success: true,
      data: products.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(products.count / limit),
        totalProducts: products.count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['quantity', 'sellingPrice', 'costPrice', 'lastUpdated']
        }
      ]
    });

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private
router.post('/', 
  authenticateToken, 
  requirePermission('manage_products'),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('category').isIn(['fuel', 'lubricant', 'accessory', 'service']).withMessage('Invalid category'),
    body('unit').isIn(['liters', 'gallons', 'units', 'hours']).withMessage('Invalid unit'),
    body('sellingPrice').isNumeric().withMessage('Selling price must be a number'),
    body('costPrice').optional().isNumeric().withMessage('Cost price must be a number'),
    body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a positive number')
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
        name, description, category, unit, sku, sellingPrice, costPrice, 
        reorderLevel, taxRate, supplier, minStockLevel, maxStockLevel
      } = req.body;

      // Check if product with same name or SKU already exists
      const existingProduct = await Product.findOne({
        where: {
          $or: [
            { name },
            { sku }
          ]
        }
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this name or SKU already exists'
        });
      }

      // Create product
      const product = await Product.create({
        name,
        description,
        category,
        unit,
        sku,
        reorderLevel: reorderLevel || 0,
        taxRate: taxRate || 0.16,
        supplier,
        minStockLevel: minStockLevel || 0,
        maxStockLevel: maxStockLevel || 999999
      });

      // Create initial inventory record
      await Inventory.create({
        productId: product.id,
        quantity: 0,
        sellingPrice,
        costPrice,
        minLevel: minStockLevel || 0,
        maxLevel: maxStockLevel || 999999,
        updatedById: req.user.id
      });

      res.status(201).json({
        success: true,
        data: product
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
router.put('/:id', 
  authenticateToken, 
  requirePermission('manage_products'),
  [
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('category').optional().isIn(['fuel', 'lubricant', 'accessory', 'service']).withMessage('Invalid category'),
    body('unit').optional().isIn(['liters', 'gallons', 'units', 'hours']).withMessage('Invalid unit'),
    body('sellingPrice').optional().isNumeric().withMessage('Selling price must be a number'),
    body('costPrice').optional().isNumeric().withMessage('Cost price must be a number'),
    body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a positive number')
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

      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return next(new ErrorResponse('Product not found', 404));
      }

      const {
        name, description, category, unit, sku, sellingPrice, costPrice, 
        reorderLevel, taxRate, supplier, minStockLevel, maxStockLevel, isActive
      } = req.body;

      // Check for duplicate name or SKU
      if (name && name !== product.name) {
        const existingProduct = await Product.findOne({
          where: { name, id: { [Op.ne]: product.id } }
        });
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Product with this name already exists'
          });
        }
      }

      if (sku && sku !== product.sku) {
        const existingProduct = await Product.findOne({
          where: { sku, id: { [Op.ne]: product.id } }
        });
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Product with this SKU already exists'
          });
        }
      }

      // Update product
      await product.update({
        name: name || product.name,
        description: description || product.description,
        category: category || product.category,
        unit: unit || product.unit,
        sku: sku || product.sku,
        reorderLevel: reorderLevel !== undefined ? reorderLevel : product.reorderLevel,
        taxRate: taxRate !== undefined ? taxRate : product.taxRate,
        supplier: supplier || product.supplier,
        minStockLevel: minStockLevel !== undefined ? minStockLevel : product.minStockLevel,
        maxStockLevel: maxStockLevel !== undefined ? maxStockLevel : product.maxStockLevel,
        isActive: isActive !== undefined ? isActive : product.isActive
      });

      // Update inventory if prices changed
      if (sellingPrice !== undefined || costPrice !== undefined || 
          minStockLevel !== undefined || maxStockLevel !== undefined) {
        
        const inventory = await Inventory.findOne({ where: { productId: product.id } });
        
        if (inventory) {
          const updates = {};
          
          if (sellingPrice !== undefined && sellingPrice !== inventory.sellingPrice) {
            // Create price history record
            await PriceHistory.create({
              productId: product.id,
              oldPrice: inventory.sellingPrice,
              newPrice: sellingPrice,
              changedById: req.user.id,
              reason: 'Manual price update'
            });
            
            updates.sellingPrice = sellingPrice;
          }
          
          if (costPrice !== undefined) {
            updates.costPrice = costPrice;
          }
          
          if (minStockLevel !== undefined) {
            updates.minLevel = minStockLevel;
          }
          
          if (maxStockLevel !== undefined) {
            updates.maxLevel = maxStockLevel;
          }

          if (Object.keys(updates).length > 0) {
            await inventory.update({
              ...updates,
              updatedById: req.user.id
            });
          }
        }
      }

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
router.delete('/:id', authenticateToken, requirePermission('manage_products'), async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    // Check if product has inventory or sales
    const inventory = await Inventory.findOne({ where: { productId: product.id } });
    if (inventory && inventory.quantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with existing inventory'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
router.get('/low-stock', authenticateToken, async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Inventory,
          as: 'inventory',
          where: {
            quantity: {
              [Op.lte]: Sequelize.col('Product.reorderLevel')
            }
          }
        }
      ],
      order: [[Sequelize.col('inventory.quantity'), 'ASC']]
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get product price history
// @route   GET /api/products/:id/price-history
// @access  Private
router.get('/:id/price-history', authenticateToken, async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    const priceHistory = await PriceHistory.findAll({
      where: { productId: product.id },
      include: [
        {
          model: User,
          as: 'changedBy',
          attributes: ['firstName', 'lastName', 'username']
        }
      ],
      order: [['changeDate', 'DESC']]
    });

    res.json({
      success: true,
      data: priceHistory
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;