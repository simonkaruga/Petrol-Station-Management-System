const express = require('express');
const { Op } = require('sequelize');
const Product = require('../models/product');
const Inventory = require('../models/inventory');
const { authenticateToken } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get current prices for all products
// @route   GET /api/prices
// @access  Private
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { isActive: true },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['sellingPrice', 'costPrice', 'quantity']
        }
      ],
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    const prices = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      unit: product.unit,
      sellingPrice: product.inventory?.sellingPrice || 0,
      costPrice: product.inventory?.costPrice || 0,
      quantity: product.inventory?.quantity || 0,
      taxRate: product.taxRate,
      sku: product.sku
    }));

    res.json({
      success: true,
      data: prices,
      count: prices.length
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get current prices by category
// @route   GET /api/prices/category/:category
// @access  Private
router.get('/category/:category', authenticateToken, async (req, res, next) => {
  try {
    const { category } = req.params;
    
    const products = await Product.findAll({
      where: { 
        isActive: true,
        category: category.toLowerCase()
      },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['sellingPrice', 'costPrice', 'quantity']
        }
      ],
      order: [['name', 'ASC']]
    });

    const prices = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      unit: product.unit,
      sellingPrice: product.inventory?.sellingPrice || 0,
      costPrice: product.inventory?.costPrice || 0,
      quantity: product.inventory?.quantity || 0,
      taxRate: product.taxRate,
      sku: product.sku
    }));

    res.json({
      success: true,
      data: prices,
      count: prices.length
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get current price for specific product
// @route   GET /api/prices/product/:id
// @access  Private
router.get('/product/:id', authenticateToken, async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['sellingPrice', 'costPrice', 'quantity']
        }
      ]
    });

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Product is not active'
      });
    }

    const price = {
      id: product.id,
      name: product.name,
      category: product.category,
      unit: product.unit,
      sellingPrice: product.inventory?.sellingPrice || 0,
      costPrice: product.inventory?.costPrice || 0,
      quantity: product.inventory?.quantity || 0,
      taxRate: product.taxRate,
      sku: product.sku
    };

    res.json({
      success: true,
      data: price
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get fuel prices (special endpoint for fuel products)
// @route   GET /api/prices/fuel
// @access  Private
router.get('/fuel', authenticateToken, async (req, res, next) => {
  try {
    const fuelProducts = await Product.findAll({
      where: { 
        isActive: true,
        category: 'fuel'
      },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['sellingPrice', 'costPrice', 'quantity']
        }
      ],
      order: [['name', 'ASC']]
    });

    const fuelPrices = fuelProducts.map(product => ({
      id: product.id,
      name: product.name,
      unit: product.unit,
      sellingPrice: product.inventory?.sellingPrice || 0,
      costPrice: product.inventory?.costPrice || 0,
      quantity: product.inventory?.quantity || 0,
      sku: product.sku
    }));

    res.json({
      success: true,
      data: fuelPrices,
      count: fuelPrices.length
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;