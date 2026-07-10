import Report from '../models/Report.js';
import Trip from '../models/Trip.js';
import Route from '../models/Route.js';
import Jeepney from '../models/Jeepney.js';
import PassengerStatistic from '../models/PassengerStatistic.js';
import ActivityLog from '../models/ActivityLog.js';


const getDateRange = (startDateStr, endDateStr) => {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  const end = endDateStr ? new Date(endDateStr) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Only persist a Report row + ActivityLog entry when the caller explicitly
// asks for it (?save=true). Prevents every dashboard view / tab switch /
// date-filter change from writing a permanent record.
const maybeSaveReport = async ({ req, reportType, start, end, summaryData }) => {
  const shouldSave = req.query.save === 'true';

  if (!shouldSave) return null;

  const report = await Report.create({
    reportType,
    generatedBy: req.user?.id,
    dateFrom: start,
    dateTo: end,
    summaryData
  });

  await ActivityLog.create({
    user: req.user?.id,
    action: 'Generated Report',
    details: `Generated ${reportType} from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. ID: ${report._id}`,
    ipAddress: req.ip
  });

  return report;
};


// @desc    Daily Trip Report
// @route   GET /api/reports/daily-trips
export const getDailyTripReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const trips = await Trip.find({ departureDate: { $gte: start, $lte: end } })
      .populate('jeepney')
      .populate('route')
      .populate('schedule');

    const tripsByStatus = { Scheduled: 0, Departed: 0, Arrived: 0, Cancelled: 0 };
    let completedTrips = 0;
    let cancelledTrips = 0;
    let totalPassengers = 0;

    trips.forEach((trip) => {
      tripsByStatus[trip.status] = (tripsByStatus[trip.status] || 0) + 1;
      if (trip.status === 'Arrived') {
        completedTrips++;
        totalPassengers += trip.passengerCount || 0;
      }
      if (trip.status === 'Cancelled') cancelledTrips++;
    });

    const summaryData = { totalTrips: trips.length, completedTrips, cancelledTrips, totalPassengers, tripsByStatus };

    const report = await maybeSaveReport({
      req, reportType: 'Daily Trip Report', start, end, summaryData
    });

    res.status(200).json({
      success: true,
      reportId: report?._id || null,
      data: summaryData,
      trips
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Daily Trip Report', error: error.message });
  }
};


// @desc    Passenger Summary Report
// @route   GET /api/reports/passengers
export const getPassengerSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const completedTrips = await Trip.find({
      departureDate: { $gte: start, $lte: end },
      status: 'Arrived'
    }).select('_id');

    const stats = await PassengerStatistic.find({
      trip: { $in: completedTrips.map((trip) => trip._id) }
    }).populate({ path: 'trip', populate: ['route', 'schedule', 'jeepney'] });

    let totalPassengers = 0;
    let peakPassengerCount = 0;
    let peakTripCode = 'N/A';
    let totalOccupancySum = 0;

    stats.forEach((stat) => {
      totalPassengers += stat.passengerCount;
      totalOccupancySum += stat.occupancyRate || 0;
      if (stat.passengerCount > peakPassengerCount) {
        peakPassengerCount = stat.passengerCount;
        peakTripCode = stat.trip?.tripCode || 'N/A';
      }
    });

    const averageOccupancy = stats.length ? totalOccupancySum / stats.length : 0;

    const summaryData = {
      totalPassengers,
      averageOccupancy: Number(averageOccupancy.toFixed(2)),
      peakRecord: { passengerCount: peakPassengerCount, tripCode: peakTripCode },
      recordsCount: stats.length
    };

    const report = await maybeSaveReport({
      req, reportType: 'Passenger Summary Report', start, end, summaryData
    });

    res.status(200).json({
      success: true,
      reportId: report?._id || null,
      data: summaryData,
      details: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Passenger Summary Report', error: error.message });
  }
};


// @desc    Route Summary Report
// @route   GET /api/reports/routes
export const getRouteSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const routes = await Route.find({});
    const routeSummary = [];

    for (const route of routes) {
      const trips = await Trip.find({ route: route._id, departureDate: { $gte: start, $lte: end } });
      const completedTrips = trips.filter((trip) => trip.status === 'Arrived');

      routeSummary.push({
        routeId: route._id,
        origin: route.origin,
        destination: route.destination,
        estimatedFare: route.estimatedFare,
        totalTrips: trips.length,
        completedTrips: completedTrips.length,
        cancelledTrips: trips.filter((trip) => trip.status === 'Cancelled').length,
        totalPassengers: completedTrips.reduce((sum, trip) => sum + (trip.passengerCount || 0), 0)
      });
    }

    const summaryData = { routesCount: routes.length, routeMetrics: routeSummary };

    const report = await maybeSaveReport({
      req, reportType: 'Route Summary Report', start, end, summaryData
    });

    res.status(200).json({ success: true, reportId: report?._id || null, data: summaryData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Route Summary Report', error: error.message });
  }
};


// @desc    Jeepney Activity Report
// @route   GET /api/reports/jeepneys
export const getJeepneyActivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const jeepneys = await Jeepney.find({});
    const jeepneySummary = [];

    for (const jeepney of jeepneys) {
      const trips = await Trip.find({ jeepney: jeepney._id, departureDate: { $gte: start, $lte: end } });

      jeepneySummary.push({
        jeepneyId: jeepney._id,
        jeepneyNumber: jeepney.jeepneyNumber,
        plateNumber: jeepney.plateNumber,
        type: jeepney.type,
        currentStatus: jeepney.status,
        capacity: jeepney.capacity,
        tripsInPeriod: {
          totalTrips: trips.length,
          completedTrips: trips.filter((t) => t.status === 'Arrived').length,
          cancelledTrips: trips.filter((t) => t.status === 'Cancelled').length
        }
      });
    }

    const summaryData = { totalJeepneysCount: jeepneys.length, jeepneyMetrics: jeepneySummary };

    const report = await maybeSaveReport({
      req, reportType: 'Jeepney Activity Report', start, end, summaryData
    });

    res.status(200).json({ success: true, reportId: report?._id || null, data: summaryData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Jeepney Activity Report', error: error.message });
  }
};


// @desc    Revenue Summary Report
// @route   GET /api/reports/revenue
export const getRevenueSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const trips = await Trip.find({
      departureDate: { $gte: start, $lte: end },
      status: 'Arrived'
    }).populate('route');

    let revenue = 0;
    const revenueByRoute = {};

    trips.forEach((trip) => {
      if (!trip.route) return;
      const key = `${trip.route.origin}-${trip.route.destination}`;
      const amount = (trip.passengerCount || 0) * (trip.route.estimatedFare || 0);
      revenue += amount;

      if (!revenueByRoute[key]) {
        revenueByRoute[key] = {
          routeId: trip.route._id,
          origin: trip.route.origin,
          destination: trip.route.destination,
          revenue: 0
        };
      }
      revenueByRoute[key].revenue += amount;
    });

    const summaryData = {
      overallEstimatedRevenue: revenue,
      completedTripsCount: trips.length,
      revenueByRoute: Object.values(revenueByRoute)
    };

    const report = await maybeSaveReport({
      req, reportType: 'Revenue Summary Report', start, end, summaryData
    });

    res.status(200).json({ success: true, reportId: report?._id || null, data: summaryData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Revenue Summary Report', error: error.message });
  }
};