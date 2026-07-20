import Schedule from '../models/Schedule.js';
import Route from '../models/Route.js';
import ActivityLog from '../models/ActivityLog.js';

function calculateArrivalTime(departureTime, travelTime) {
  if (!departureTime || travelTime == null) return '';

  const [hour, minute] = departureTime.split(':').map(Number);

  const totalMinutes = hour * 60 + minute + Number(travelTime);

  const arrivalHour = Math.floor((totalMinutes % (24 * 60)) / 60);
  const arrivalMinute = totalMinutes % 60;

  return `${String(arrivalHour).padStart(2, '0')}:${String(arrivalMinute).padStart(2, '0')}`;
}

// =========================
// Create Schedule
// =========================
export const createSchedule = async (req, res) => {
  try {
    const route = await Route.findById(req.body.route);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    req.body.expectedArrivalTime = calculateArrivalTime(
      req.body.departureTime,
      route.estimatedTravelTime
    );

    const schedule = await Schedule.create(req.body);

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Create Schedule',
      details: `Created schedule ${schedule.departureTime}`,

    });

    const populated = await Schedule.findById(schedule._id)
      .populate('route');

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: populated
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          'A schedule with this route and departure time already exists.'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// =========================
// Get Schedules
// =========================
export const getSchedules = async (req, res) => {
  try {

    const { routeId, status } = req.query;

    const query = {};

    if (routeId) {
      query.route = routeId;
    }

    if (status) {
      query.status = status;
    }

    const schedules = await Schedule.find(query)
      .populate('route')
      .populate('lastOverriddenBy', 'username fullName')
      .sort({
        departureTime: 1
      });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// =========================
// Get Schedule By Id
// =========================
export const getScheduleById = async (req, res) => {
  try {

    const schedule = await Schedule.findById(req.params.id)
      .populate('route')
      .populate('lastOverriddenBy', 'username fullName');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.status(200).json({
      success: true,
      data: schedule
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// =========================
// Update Schedule — Terminal Personnel only (normal operational CRUD)
// =========================
export const updateSchedule = async (req, res) => {

  try {

    const route = await Route.findById(req.body.route);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    req.body.expectedArrivalTime = calculateArrivalTime(
      req.body.departureTime,
      route.estimatedTravelTime
    );

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('route');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Update Schedule',
      details: `Updated schedule ${schedule.departureTime}`,

    });

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          'A schedule with this route and departure time already exists.'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });

  }
};

// =========================
// Delete Schedule — Terminal Personnel only (normal operational CRUD)
// =========================
export const deleteSchedule = async (req, res) => {

  try {

    const schedule = await Schedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Delete Schedule',
      details: `Deleted schedule ${schedule.departureTime}`,

    });

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// =========================
// Admin Override — Admin only. Corrects a bad Terminal Personnel entry.
// Applies field changes AND records the correction in one request.
// A reason is mandatory — this is what distinguishes an override from
// a normal edit in the audit trail.
// =========================
export const overrideSchedule = async (req, res) => {

  try {

    const { reason, ...fields } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A reason is required to perform an admin override.'
      });
    }

    const existingSchedule = await Schedule.findById(req.params.id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const routeId = fields.route || existingSchedule.route;
    const route = await Route.findById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    const departureTime = fields.departureTime || existingSchedule.departureTime;

    const updatePayload = {
      ...fields,
      expectedArrivalTime: calculateArrivalTime(departureTime, route.estimatedTravelTime),
      lastOverriddenBy: req.user?._id,
      overrideReason: reason.trim(),
      overriddenAt: new Date(),
      overridePending: true,
      overrideDisputeReason: ''
    };

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    )
      .populate('route')
      .populate('lastOverriddenBy', 'username fullName');

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Admin Override - Schedule',
      details: `Admin corrected schedule ${schedule.scheduleCode}. Reason: ${reason.trim()}`,

    });

    res.status(200).json({
      success: true,
      message: 'Schedule corrected via admin override.',
      data: schedule
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          'A schedule with this route and departure time already exists.'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });

  }

};

// =========================
// Acknowledge Override — Terminal Personnel only. Closes out a
// pending override once they've reviewed and accepted the correction.
// =========================
export const acknowledgeScheduleOverride = async (req, res) => {

  try {

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (!schedule.overridePending) {
      return res.status(400).json({
        success: false,
        message: 'This schedule has no pending override to acknowledge.'
      });
    }

    schedule.overridePending = false;
    schedule.overrideDisputeReason = '';
    await schedule.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Override Acknowledged - Schedule',
      details: `Terminal Personnel acknowledged admin override on schedule ${schedule.scheduleCode}`,

    });

    res.status(200).json({
      success: true,
      message: 'Override acknowledged.',
      data: schedule
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message
    });

  }

};

// =========================
// Dispute Override — Terminal Personnel only. Flags an override back
// to Admin as questionable, with a required explanation.
// =========================
export const disputeScheduleOverride = async (req, res) => {

  try {

    const { disputeReason } = req.body;

    if (!disputeReason || !disputeReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A reason is required to dispute an admin override.'
      });
    }

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (!schedule.overridePending) {
      return res.status(400).json({
        success: false,
        message: 'This schedule has no pending override to dispute.'
      });
    }

    schedule.overrideDisputeReason = disputeReason.trim();
    await schedule.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Override Disputed - Schedule',
      details: `Terminal Personnel disputed admin override on schedule ${schedule.scheduleCode}. Dispute reason: ${disputeReason.trim()}`,

    });

    res.status(200).json({
      success: true,
      message: 'Dispute recorded. Admin has been flagged for re-verification.',
      data: schedule
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message
    });

  }

};