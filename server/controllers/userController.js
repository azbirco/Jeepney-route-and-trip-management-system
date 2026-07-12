import User from '../models/User.js';
import Trip from '../models/Trip.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Create a new user account (Admin only)
// @route   POST /api/users
export const createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    const user = await User.create({ username, email, password, fullName, role });

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Create User',
      details: `Created user account ${user.username} (${user.role})`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User account created successfully',
      data: user
    });
  } catch (error) {
    const serverMsg = error.code === 11000
      ? 'Username or email is already registered.'
      : error.message;

    res.status(400).json({ success: false, message: serverMsg });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Driver accounts (Admin & Terminal Personnel), each
//          annotated with whether they currently have an ongoing trip
//          (Scheduled or Departed) — powers the "Assign Driver" dropdown
//          warning so dispatch can make an informed override decision.
// @route   GET /api/users/drivers
export const getDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'Driver', isActive: true })
      .select('username fullName email')
      .sort({ fullName: 1 });

    const driversWithStatus = await Promise.all(
      drivers.map(async (driver) => {
        const ongoingTrip = await Trip.exists({
          driver: driver._id,
          status: { $in: ['Scheduled', 'Departed'] }
        });

        return {
          _id: driver._id,
          username: driver.username,
          fullName: driver.fullName,
          email: driver.email,
          hasOngoingTrip: !!ongoingTrip
        };
      })
    );

    res.status(200).json({
      success: true,
      count: driversWithStatus.length,
      data: driversWithStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { username, email, fullName, role, isActive, password } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (fullName) user.fullName = fullName;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Update User',
      details: `Updated user account ${user.username}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'User account updated successfully',
      data: user
    });
  } catch (error) {
    const serverMsg = error.code === 11000
      ? 'Username or email is already registered.'
      : error.message;

    res.status(400).json({ success: false, message: serverMsg });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Delete User',
      details: `Deleted user account ${user.username}`,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};