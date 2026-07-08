import ActivityLog from '../models/ActivityLog.js';

// @desc    Get all system Activity Logs (Audit Trails)
// @route   GET /api/activity-logs
// @access  Private (Admin Only)
export const getActivityLogs = async (req, res) => {
  try {
    const {
      action,
      userId,
      limit = 100,
      page = 1
    } = req.query;

    const query = {};

    if (action) {
      query.action = action;
    }

    if (userId) {
      query.user = userId;
    }

    const currentPage = Math.max(parseInt(page), 1);
    const perPage = Math.min(parseInt(limit), 100);

    const skip = (currentPage - 1) * perPage;

    const logs = await ActivityLog.find(query)
      .populate('user', 'username fullName role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    const totalLogs = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      totalLogs,
      totalPages: Math.ceil(totalLogs / perPage),
      currentPage,
      data: logs
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Error retrieving system activity logs',
      error: error.message
    });

  }
};