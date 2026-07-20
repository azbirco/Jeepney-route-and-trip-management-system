import authService from '../services/authService.js';

// @desc    User Login
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {

    const { username, password } = req.body;

    const { token, user } = await authService.login(
      username,
      password
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {

    let statusCode = 400;

    if (error.message.includes('Invalid')) {
      statusCode = 401;
    }

    if (error.message.includes('deactivated')) {
      statusCode = 403;
    }

    if (error.message.includes('Server')) {
      statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message
    });

  }
};


// @desc    Get Current User Profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await authService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {

    res.status(
      error.message.includes('not found') ? 404 : 500
    ).json({
      success: false,
      message: error.message
    });

  }
};


// @desc    Update Current User's Own Profile (fullName only)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { fullName } = req.body;

    const updatedUser = await authService.updateProfile(
      req.user.id,
      { fullName }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {

    res.status(
      error.message.includes('not found') ? 404 : 400
    ).json({
      success: false,
      message: error.message
    });

  }
};


// @desc    Change Current User's Own Password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {

    let statusCode = 400;
    if (error.message.includes('incorrect')) statusCode = 401;
    if (error.message.includes('not found')) statusCode = 404;

    res.status(statusCode).json({
      success: false,
      message: error.message
    });

  }
};


// @desc    User Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {

    await authService.logout(
      req.user?.id
    );

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });

  }
};