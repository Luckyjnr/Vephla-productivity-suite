const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/encryption');
const { generateToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validators');

const registerUser = async (email, password, name) => {
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

  // Check if this is the first user (make them admin)
  const userCount = await User.countDocuments();
  const role = userCount === 0 ? 'admin' : 'standard';

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = new User({
    email,
    passwordHash,
    name: name || email.split('@')[0], // Use provided name or email prefix
    role
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
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

  // Ensure user has a name field (for backward compatibility)
  if (!user.name) {
    user.name = email.split('@')[0];
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
      name: user.name,
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