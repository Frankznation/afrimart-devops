const { sequelize } = require('../config/database');
const { User, Product, Order, OrderItem, Cart } = require('../models');

const migrate = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync in dependency order (parents before children)
    await User.sync({ alter: true });
    await Product.sync({ alter: true });
    await Order.sync({ alter: true });
    await Cart.sync({ alter: true });
    await OrderItem.sync({ alter: true });
    console.log('✅ All models synchronized successfully');

    console.log('✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
