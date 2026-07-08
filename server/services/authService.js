import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import generateToken  from '../utils/generateToken.js';

/**
 * Service to handle authentication operations.
 */
export const login = async (username, password, ipAddress = null) => {
  if (!username || !password) {
    throw new Error('Please provide both username and password');
  }

const user = await User.findOne({
  username
}).select("+password");

  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact an admin.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid username or password');
  }

  // Generate JWT Token
  const token = generateToken(user._id, user.role, user.username);

  // Record successful login
  await ActivityLog.create({
    user: user._id,
    action: 'User Login',
    details: `${user.fullName} logged in successfully as ${user.role}.`,
    ipAddress
  });

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    }
  };
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User profile not found');
  }
  return user;
};

export const logout = async (userId, ipAddress = null) => {
  if (userId) {
    await ActivityLog.create({
      user: userId,
      action: 'User Logout',
      details: `User logged out.`,
      ipAddress
    });
  }
  return { success: true };
};

const authService = {
  login,
  getProfile,
  logout
};

export default authService;
