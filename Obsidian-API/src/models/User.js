import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Model
 * For MROP platform access control
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    organization: {
      type: String,
      default: '',
    },
    services: [
      {
        type: String, // Service names the user has access to
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    permissions: {
      canCreateServices: {
        type: Boolean,
        default: true,
      },
      canDeleteServices: {
        type: Boolean,
        default: false,
      },
      canManageUsers: {
        type: Boolean,
        default: false,
      },
      canViewMetrics: {
        type: Boolean,
        default: true,
      },
      canConfigureAlerts: {
        type: Boolean,
        default: true,
      },
      canRunChaos: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate API key
userSchema.methods.generateApiKey = function () {
  const crypto = require('crypto');
  this.apiKey = `obsidian_${crypto.randomBytes(32).toString('hex')}`;
  return this.apiKey;
};

// Don't return password in JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;