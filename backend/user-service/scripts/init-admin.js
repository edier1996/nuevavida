const { User } = require('../db');
const dotenv = require('dotenv');

dotenv.config();

const initAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'nuevavida1327@gmail.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('ID:', existingAdmin.id);
      process.exit(0);
    }

    // Create the admin user — password is hashed automatically by the
    // User model's beforeCreate hook, so we pass the plain-text value here.
    const admin = await User.create({
      name: 'Administrador',
      email: 'nuevavida1327@gmail.com',
      password: 'nevavida13272026',
      role: 'admin',
    });

    console.log('✅ Admin user created successfully');
    console.log('Email:', admin.email);
    console.log('ID:', admin.id);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

initAdmin();
