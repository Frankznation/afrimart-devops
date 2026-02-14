const { Order, OrderItem, Cart, Product, User } = require('../models');
const { sequelize } = require('../config/database');
const emailQueue = require('../jobs/emailQueue');
const { trackOrder } = require('../utils/metrics');

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { shippingAddress, shippingCity, shippingState, shippingPhone, notes } = req.body;

    // Get cart items
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, as: 'product' }],
      transaction: t
    });

    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`
        });
      }

      const itemTotal = parseFloat(item.product.price) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        productName: item.product.name
      });

      // Reduce stock
      await item.product.decrement('stock', { 
        by: item.quantity, 
        transaction: t 
      });
    }

    // Create order
    const order = await Order.create({
      userId: req.user.id,
      orderNumber: generateOrderNumber(),
      totalAmount: totalAmount.toFixed(2),
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPhone,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    }, { transaction: t });

    // Create order items
    const items = await OrderItem.bulkCreate(
      orderItems.map(item => ({ ...item, orderId: order.id })),
      { transaction: t }
    );

    // Clear cart
    await Cart.destroy({
      where: { userId: req.user.id },
      transaction: t
    });

    await t.commit();

    // Track business metrics for Prometheus
    trackOrder(order.totalAmount);

    // Queue email notification (non-blocking)
    try {
      await emailQueue.add('order-confirmation', {
        orderId: order.id,
        userEmail: req.user.email,
        orderNumber: order.orderNumber
      });
    } catch (emailError) {
      console.error('Failed to queue email:', emailError);
    }

    res.status(201).json({
      success: true,
      data: {
        ...order.toJSON(),
        items
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'imageUrl']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Queue status update email
    try {
      await emailQueue.add('order-status-update', {
        orderId: order.id,
        userEmail: order.user.email,
        orderNumber: order.orderNumber,
        status
      });
    } catch (emailError) {
      console.error('Failed to queue email:', emailError);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: OrderItem, as: 'items' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders
};
