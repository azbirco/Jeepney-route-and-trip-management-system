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
      ipAddress: req.ip
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
      .populate('route');

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
// Update Schedule
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
      ipAddress: req.ip
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
// Delete Schedule
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
      ipAddress: req.ip
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