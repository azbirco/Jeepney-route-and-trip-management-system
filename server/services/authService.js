import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import generateToken from '../utils/generateToken.js';

/**
 * Service to handle authentication operations.
 */
export const login = async (username, password, ipAddress = null) => {
  if (!username || !password) {
    throw new Error('Please provide both username and password');
  }

  const user = await User.findOne({ username }).select('+password');

  // FIX: check kung existing muna ang user bago i-access ang .isActive,
  // dati pwedeng mag-crash (TypeError) kung mali ang username.
  if (!user) {
    throw new Error('Invalid username or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact an admin.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid username or password');
  }

  const token = generateToken(user._id, user.role, user.username);

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

// NEW: self-service profile update — WHITELIST lang ang editable fields.
// Username, email, at role ay hindi dito kasama; admin lang ang naka-authorize
// na mag-edit noon via updateUser controller (roleMiddleware: authorize('Admin')).
export const updateProfile = async (userId, { fullName }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User profile not found');
  }

  if (fullName !== undefined && fullName.trim() !== '') {
    user.fullName = fullName.trim();
  }

  await user.save();

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };
};

// NEW: self-service password change — kailangan i-verify muna ang current
// password bago payagan magpalit, para hindi basta mapalitan kung na-hijack
// ang session (e.g. naka-login sa ibang device).
export const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new Error('Please provide both current and new password');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword; // pre-save hook na sa model ang mag-hahash nito
  await user.save();

  return { success: true };
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
  updateProfile,
  changePassword,
  logout
};

export default authService;