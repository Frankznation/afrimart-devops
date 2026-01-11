const { User, Product } = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.findOrCreate({
      where: { email: 'admin@afrimart.com' },
      defaults: {
        email: 'admin@afrimart.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+234-800-000-0000',
        address: '123 Admin Street',
        city: 'Lagos',
        state: 'Lagos'
      }
    });
    console.log('✅ Admin user created');

    // Create test customer
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = await User.findOrCreate({
      where: { email: 'customer@test.com' },
      defaults: {
        email: 'customer@test.com',
        password: customerPassword,
        firstName: 'Test',
        lastName: 'Customer',
        role: 'customer',
        phone: '+234-800-111-1111',
        address: '456 Customer Avenue',
        city: 'Abuja',
        state: 'FCT'
      }
    });
    console.log('✅ Test customer created');

    // Sample products
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system',
        price: 1299000,
        category: 'Electronics',
        stock: 50,
        sku: 'IPH15PRO-128',
        brand: 'Apple',
        weight: 0.187,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Samsung smartphone with S Pen, 200MP camera, and AI features',
        price: 1199000,
        category: 'Electronics',
        stock: 45,
        sku: 'SAM-S24U-256',
        brand: 'Samsung',
        weight: 0.232,
        isFeatured: true,
        discount: 10,
        imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'
      },
      {
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop with M3 Pro chip, 16GB RAM, 512GB SSD',
        price: 2499000,
        category: 'Computers',
        stock: 20,
        sku: 'MBP16-M3-512',
        brand: 'Apple',
        weight: 2.14,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise canceling wireless headphones',
        price: 349000,
        category: 'Audio',
        stock: 100,
        sku: 'SONY-WH1000XM5',
        brand: 'Sony',
        weight: 0.25,
        discount: 15,
        imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400'
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultra-portable laptop with InfinityEdge display, Intel Core i7',
        price: 1399000,
        category: 'Computers',
        stock: 30,
        sku: 'DELL-XPS13-I7',
        brand: 'Dell',
        weight: 1.27,
        imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400'
      },
      {
        name: 'iPad Air 5th Gen',
        description: 'Versatile tablet with M1 chip, 10.9" Liquid Retina display',
        price: 599000,
        category: 'Tablets',
        stock: 60,
        sku: 'IPAD-AIR5-64',
        brand: 'Apple',
        weight: 0.461,
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'
      },
      {
        name: 'Canon EOS R6',
        description: 'Full-frame mirrorless camera with 20MP sensor and 4K video',
        price: 2499000,
        category: 'Cameras',
        stock: 15,
        sku: 'CANON-R6-BODY',
        brand: 'Canon',
        weight: 0.68,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400'
      },
      {
        name: 'LG OLED C3 55"',
        description: '4K OLED TV with α9 Gen6 AI Processor and Dolby Vision',
        price: 1899000,
        category: 'TVs',
        stock: 25,
        sku: 'LG-OLEDC3-55',
        brand: 'LG',
        weight: 18.9,
        discount: 20,
        imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400'
      },
      {
        name: 'Samsung Galaxy Watch 6',
        description: 'Smartwatch with advanced health tracking and fitness features',
        price: 299000,
        category: 'Wearables',
        stock: 80,
        sku: 'SAM-WATCH6-44',
        brand: 'Samsung',
        weight: 0.033,
        imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400'
      },
      {
        name: 'Bose SoundLink Revolve+',
        description: 'Portable Bluetooth speaker with 360° sound',
        price: 279000,
        category: 'Audio',
        stock: 50,
        sku: 'BOSE-REVOLVE-PLUS',
        brand: 'Bose',
        weight: 0.9,
        imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'
      },
      {
        name: 'Logitech MX Master 3S',
        description: 'Ergonomic wireless mouse with precision scrolling',
        price: 99000,
        category: 'Accessories',
        stock: 150,
        sku: 'LOGI-MXMASTER3S',
        brand: 'Logitech',
        weight: 0.141,
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'
      },
      {
        name: 'Nike Air Jordan 1',
        description: 'Classic basketball sneakers in Chicago colorway',
        price: 175000,
        category: 'Footwear',
        stock: 100,
        sku: 'NIKE-AJ1-CHICAGO',
        brand: 'Nike',
        weight: 0.7,
        discount: 5,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
      }
    ];

    for (const productData of products) {
      await Product.findOrCreate({
        where: { sku: productData.sku },
        defaults: productData
      });
    }
    console.log(`✅ ${products.length} products created`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📝 Default Credentials:');
    console.log('   Admin: admin@afrimart.com / admin123');
    console.log('   Customer: customer@test.com / customer123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
