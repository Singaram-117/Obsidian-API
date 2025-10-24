import mongoose from 'mongoose';
import User from './src/models/User.js';
import config from './src/config/config.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/obsidian';

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@obsidian.dev' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminUser = new User({
      email: 'admin@obsidian.dev',
      password: 'Admin@123',
      name: 'System Administrator',
      role: 'admin',
      organization: 'Obsidian MROP',
      isActive: true,
      permissions: {
        canCreateServices: true,
        canDeleteServices: true,
        canManageUsers: true,
        canViewMetrics: true,
        canConfigureAlerts: true,
        canRunChaos: true,
      },
    });

    await adminUser.save();
    console.log('Admin user created successfully:', adminUser.email);
    console.log('Password: Admin@123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdminUser();
