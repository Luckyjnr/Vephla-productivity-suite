const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/encryption');
const { generateToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validators');

const registerUser = async (email, password) => {
  // Validate input
  if (!validateEmail(email)) {
    throw new Error('INVALID_EMAIL');
  }

  if (!validatePassword(password)) {
    throw new Error('INVALID_PASSWORD');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('EMAIL_EXISTS');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = new User({
    email,
    passwordHash,
    role: 'standard'
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    token
  };
};

const loginUser = async (email, password) => {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt
    },
    token
  };
};

module.exports = {
  registerUser,
  loginUser
};