const { Product } = require('../models');
const { Op } = require('sequelize');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search, 
      minPrice, 
      maxPrice,
      sort = 'createdAt',
      order = 'DESC'
    } = req.query;

    const cacheKey = `products:${JSON.stringify(req.query)}`;
    
    // Check cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        ...cached
      });
    }

    const offset = (page - 1) * limit;
    const where = { isActive: true };

    // Filters
    if (category) {
      where.category = category;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]]
    });

    const result = {
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, result, 300);

    res.json({
      success: true,
      cached: false,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const cacheKey = `product:${req.params.id}`;
    
    // Check cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Cache for 10 minutes
    await cacheSet(cacheKey, product, 600);

    res.json({
      success: true,
      cached: false,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    // Invalidate products cache
    await cacheDel('products:*');

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.update(req.body);

    // Invalidate caches
    await cacheDel(`product:${req.params.id}`);
    await cacheDel('products:*');

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete
    await product.update({ isActive: false });

    // Invalidate caches
    await cacheDel(`product:${req.params.id}`);
    await cacheDel('products:*');

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.findAll({
      attributes: ['category'],
      where: { isActive: true },
      group: ['category']
    });

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
};
