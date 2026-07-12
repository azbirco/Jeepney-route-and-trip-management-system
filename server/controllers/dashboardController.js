import Jeepney from '../models/Jeepney.js';
import Route from '../models/Route.js';
import Trip from '../models/Trip.js';
import PassengerStatistic from '../models/PassengerStatistic.js';
import SynchronizationLog from '../models/SynchronizationLog.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Dashboard Overview
// @route   GET /api/dashboard
// @access  Private

export const getDashboardOverview = async (req, res) => {
  try {

    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // ============================================
    // KPI
    // ============================================

    const totalJeepneys = await Jeepney.countDocuments();

    const activeRoutes = await Route.countDocuments({
      status: "Active"
    });

    const tripsToday = await Trip.countDocuments({
      departureDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    const passengerStats = await PassengerStatistic.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    const passengersToday = passengerStats.reduce(
      (sum, item) => sum + (item.passengerCount || 0),
      0
    );

    // ============================================
    // Fleet
    // ============================================

    const available = await Jeepney.countDocuments({
      status: "Available"
    });

    const inTransit = await Jeepney.countDocuments({
      status: "In Transit"
    });

    const inactive = await Jeepney.countDocuments({
      status: "Inactive"
    });

    // ============================================
    // Trip Status
    // ============================================

    const scheduled = await Trip.countDocuments({
      status: "Scheduled"
    });

    const departed = await Trip.countDocuments({
      status: "Departed"
    });

    const arrived = await Trip.countDocuments({
      status: "Arrived"
    });

    const cancelled = await Trip.countDocuments({
      status: "Cancelled"
    });

    // ============================================
    // Revenue
    // ============================================

    const estimatedRevenue = passengerStats.reduce(
      (sum, item) => sum + (item.estimatedRevenue || 0),
      0
    );

    const averageOccupancy =
      passengerStats.length > 0
        ? passengerStats.reduce(
            (sum, item) => sum + (item.occupancyRate || 0),
            0
          ) / passengerStats.length
        : 0;

    // ============================================
    // RESPONSE
    // ============================================

    const responseData = {
      success: true,

      metrics: {
        totalJeepneys,
        activeRoutes,
        tripsToday,
        passengersToday
      },

      fleet: {
        available,
        inTransit,
        inactive
      },

      tripStatus: {
        scheduled,
        departed,
        arrived,
        cancelled
      },

      revenue: {
        estimatedRevenue,
        averageOccupancy: Number(
          averageOccupancy.toFixed(2)
        )
      },

      activities: await ActivityLog.find()
        .populate("user", "username fullName")
        .sort({
          createdAt: -1
        })
        .limit(5)
    };

    // Synchronization data: Admin only
    if (req.user?.role?.toLowerCase() === 'admin') {

      const latestSync = await SynchronizationLog.findOne()
        .sort({
          createdAt: -1
        });

      responseData.synchronization = {
        lastSync: latestSync?.lastSync || null,
        status: latestSync?.syncStatus || "Pending",
        records: latestSync?.recordsTransmitted || 0
      };

    }

    res.status(200).json(responseData);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
      error: error.message
    });

  }
};