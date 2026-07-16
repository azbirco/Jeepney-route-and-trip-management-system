import Trip from '../models/Trip.js';
import Route from '../models/Route.js';
import Jeepney from '../models/Jeepney.js';
import PassengerStatistic from '../models/PassengerStatistic.js';
import ActivityLog from '../models/ActivityLog.js';
import Report from '../models/Report.js';


// Computes { start, end } based on a named period (all/today/week/month/year/custom).
// week/month/year mean "from the start of that period up to today" (running totals),
// not a fixed calendar window. 'custom' falls back to explicit startDate/endDate,
// defaulting to today if neither is supplied (matches original default behavior).
const getDateRange = (period, startDateStr, endDateStr) => {
  const now = new Date();
  let start;
  let end = new Date(now);

  switch (period) {
    case 'all':
      return { start: new Date(0), end: new Date(8640000000000000) };

    case 'week': {
      start = new Date(now);
      const day = start.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diffToMonday);
      break;
    }

    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;

    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;

    case 'custom':
      start = startDateStr ? new Date(startDateStr) : new Date(now);
      end = endDateStr ? new Date(endDateStr) : new Date(now);
      break;

    case 'today':
    default:
      start = new Date(now);
      break;
  }

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
    const { period, startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Sorted newest-first so "Recent Trips" on the frontend is actually recent
    // before it gets sliced to the top 20.
    const trips = await Trip.find({ departureDate: { $gte: start, $lte: end } })
      .sort({ departureDate: -1 })
      .populate('jeepney')
      .populate('route')
      .populate('schedule');

    const tripsByStatus = { Scheduled: 0, Departed: 0, Arrived: 0, Cancelled: 0 };
    let arrivedTrips = 0;
    let cancelledTrips = 0;
    let totalPassengers = 0;

    trips.forEach((trip) => {
      tripsByStatus[trip.status] = (tripsByStatus[trip.status] || 0) + 1;
      if (trip.status === 'Arrived') {
        arrivedTrips++;
        totalPassengers += trip.passengerCount || 0;
      }
      if (trip.status === 'Cancelled') cancelledTrips++;
    });

    const summaryData = { totalTrips: trips.length, arrivedTrips, cancelledTrips, totalPassengers, tripsByStatus };

    const report = await maybeSaveReport({
      req, reportType: 'Daily Trip Report', start, end, summaryData
    });

    res.status(200).json({
      success: true,
      reportId: report?._id || null,
      dateFrom: start,
      dateTo: end,
      data: summaryData,
      trips
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Daily Trip Report', error: error.message });
  }
};


// @desc    Passenger Summary Report
// @route   GET /api/reports/passengers
// NOTE: Intentionally Arrived-only. Passenger counts on non-Arrived trips
// (Scheduled/Departed) are not yet final — they can still change before
// the trip is confirmed. This report reflects confirmed, audited data only.
export const getPassengerSummaryReport = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    const arrivedTrips = await Trip.find({
      departureDate: { $gte: start, $lte: end },
      status: 'Arrived'
    }).select('_id');

    const stats = await PassengerStatistic.find({
      trip: { $in: arrivedTrips.map((trip) => trip._id) }
    }).populate({ path: 'trip', populate: ['route', 'schedule', 'jeepney'] });

    // Newest trip date first, for the same "Recent" reasoning as Daily Trip Report.
    stats.sort((a, b) => new Date(b.trip?.departureDate || 0) - new Date(a.trip?.departureDate || 0));

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
      dateFrom: start,
      dateTo: end,
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
    const { period, startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    const routes = await Route.find({});
    const routeSummary = [];

    for (const route of routes) {
      const trips = await Trip.find({ route: route._id, departureDate: { $gte: start, $lte: end } });
      const arrivedTrips = trips.filter((trip) => trip.status === 'Arrived');

      routeSummary.push({
        routeId: route._id,
        origin: route.origin,
        destination: route.destination,
        estimatedFare: route.estimatedFare,
        totalTrips: trips.length,
        scheduledTrips: trips.filter((trip) => trip.status === 'Scheduled').length,
        departedTrips: trips.filter((trip) => trip.status === 'Departed').length,
        arrivedTrips: arrivedTrips.length,
        cancelledTrips: trips.filter((trip) => trip.status === 'Cancelled').length,
        // Arrived-only, same reasoning as Passenger/Revenue Summary reports —
        // passenger counts aren't final until a trip is confirmed Arrived.
        totalPassengers: arrivedTrips.reduce((sum, trip) => sum + (trip.passengerCount || 0), 0)
      });
    }

    const summaryData = { routesCount: routes.length, routeMetrics: routeSummary };

    const report = await maybeSaveReport({
      req, reportType: 'Route Summary Report', start, end, summaryData
    });

    res.status(200).json({
      success: true,
      reportId: report?._id || null,
      dateFrom: start,
      dateTo: end,
      data: summaryData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Route Summary Report', error: error.message });
  }
};


// @desc    Jeepney Activity Report
// @route   GET /api/reports/jeepneys
export const getJeepneyActivityReport = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

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
          scheduledTrips: trips.filter((t) => t.status === 'Scheduled').length,
          departedTrips: trips.filter((t) => t.status === 'Departed').length,
          arrivedTrips: trips.filter((t) => t.status === 'Arrived').length,
          cancelledTrips: trips.filter((t) => t.status === 'Cancelled').length
        }
      });
    }

    const summaryData = { totalJeepneysCount: jeepneys.length, jeepneyMetrics: jeepneySummary };

    const report = await maybeSaveReport({
      req, reportType: 'Jeepney Activity Report', start, end, summaryData
    });

    res.status(200).json({
      success: true,
      reportId: report?._id || null,
      dateFrom: start,
      dateTo: end,
      data: summaryData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Jeepney Activity Report', error: error.message });
  }
};


// @desc    Revenue Summary Report
// @route   GET /api/reports/revenue
// NOTE: Intentionally Arrived-only — revenue is only recognized once a
// trip's passenger count is confirmed at arrival, not while still
// Scheduled/Departed and possibly subject to change.
export const getRevenueSummaryReport = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    const trips = await Trip.find({
      departureDate: { $gte: start, $lte: end },
      status: 'Arrived'
    }).populate('route');

    let revenue = 0;
    const revenueByRoute = {};

    trips.forEach((trip) => {
      if (!trip.route) return;
      const key = `${trip.route.origin}-${trip.route.destination}`;
      const passengerCount = trip.passengerCount || 0;
      const amount = passengerCount * (trip.route.estimatedFare || 0);
      revenue += amount;

      if (!revenueByRoute[key]) {
        revenueByRoute[key] = {
          routeId: trip.route._id,
          origin: trip.route.origin,
          destination: trip.route.destination,
          tripsCount: 0,
          passengersCount: 0,
          revenue: 0
        };
      }
      revenueByRoute[key].tripsCount += 1;
      revenueByRoute[key].passengersCount += passengerCount;
      revenueByRoute[key].revenue += amount;
    });

    const summaryData = {
      overallEstimatedRevenue: revenue,
      arrivedTripsCount: trips.length,
      revenueByRoute: Object.values(revenueByRoute)
    };

    const report = await maybeSaveReport({
      req, reportType: 'Revenue Summary Report', start, end, summaryData
    });

    res.status(200).json({
      success: true,
      reportId: report?._id || null,
      dateFrom: start,
      dateTo: end,
      data: summaryData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Revenue Summary Report', error: error.message });
  }
};