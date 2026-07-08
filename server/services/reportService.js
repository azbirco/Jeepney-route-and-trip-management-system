import Report from '../models/Report.js';
import Trip from '../models/Trip.js';
import Route from '../models/Route.js';
import Jeepney from '../models/Jeepney.js';
import PassengerStatistic from '../models/PassengerStatistic.js';
import ActivityLog from '../models/ActivityLog.js';

// Helper to prepare local date-range boundaries
const getDateRange = (startDateStr, endDateStr) => {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  const end = endDateStr ? new Date(endDateStr) : new Date();
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Service to generate dynamic performance reports and record audit logs.
 */
export const generateDailyTripReport = async (startDateStr, endDateStr, userId = null, ipAddress = null) => {
  const { start, end } = getDateRange(startDateStr, endDateStr);

  const trips = await Trip.find({
    tripDate: { $gte: start, $lte: end }
  })
  .populate('jeepney')
  .populate('route')
  .populate('schedule');

  const totalTrips = trips.length;
  let completedTrips = 0;
  let cancelledTrips = 0;
  let totalPassengers = 0;

  const tripsByStatus = {
    Scheduled: 0,
    Boarding: 0,
    'In Transit': 0,
    Completed: 0,
    Cancelled: 0
  };

  trips.forEach(trip => {
    tripsByStatus[trip.status] = (tripsByStatus[trip.status] || 0) + 1;
    if (trip.status === 'Completed') {
      completedTrips++;
      totalPassengers += trip.passengerCount || 0;
    } else if (trip.status === 'Cancelled') {
      cancelledTrips++;
    }
  });

  const summaryData = {
    totalTrips,
    completedTrips,
    cancelledTrips,
    totalPassengers,
    tripsByStatus
  };

  const report = await Report.create({
    reportType: 'Daily Trip Report',
    generatedBy: userId,
    dateFrom: start,
    dateTo: end,
    summaryData
  });

  await ActivityLog.create({
    user: userId,
    action: 'Generated Report',
    details: `Generated Daily Trip Report from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. ID: ${report._id}`,
    ipAddress
  });

  return {
    report,
    data: summaryData,
    trips
  };
};

export const generatePassengerSummaryReport = async (startDateStr, endDateStr, userId = null, ipAddress = null) => {
  const { start, end } = getDateRange(startDateStr, endDateStr);

  const tripIds = await Trip.find({
    tripDate: { $gte: start, $lte: end },
    status: 'Completed'
  }).select('_id');

  const stats = await PassengerStatistic.find({
    trip: { $in: tripIds.map(t => t._id) }
  }).populate({
    path: 'trip',
    populate: ['route', 'schedule', 'jeepney']
  });

  let totalPassengers = 0;
  let peakPassengerCount = 0;
  let peakTripCode = 'N/A';
  let totalOccupancySum = 0;

  stats.forEach(stat => {
    totalPassengers += stat.passengerCount;
    totalOccupancySum += stat.occupancyRate || 0;
    if (stat.passengerCount > peakPassengerCount) {
      peakPassengerCount = stat.passengerCount;
      if (stat.trip) peakTripCode = stat.trip.tripCode;
    }
  });

  const averageOccupancy = stats.length > 0 ? (totalOccupancySum / stats.length) : 0;

  const summaryData = {
    totalPassengers,
    averageOccupancy: Number(averageOccupancy.toFixed(2)),
    peakRecord: {
      passengerCount: peakPassengerCount,
      tripCode: peakTripCode
    },
    recordsCount: stats.length
  };

  const report = await Report.create({
    reportType: 'Passenger Summary Report',
    generatedBy: userId,
    dateFrom: start,
    dateTo: end,
    summaryData
  });

  await ActivityLog.create({
    user: userId,
    action: 'Generated Report',
    details: `Generated Passenger Summary Report from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. ID: ${report._id}`,
    ipAddress
  });

  return {
    report,
    data: summaryData,
    details: stats
  };
};

export const generateRouteSummaryReport = async (startDateStr, endDateStr, userId = null, ipAddress = null) => {
  const { start, end } = getDateRange(startDateStr, endDateStr);

  const routes = await Route.find({});
  const routeSummary = [];

  for (const route of routes) {
    const trips = await Trip.find({
      route: route._id,
      tripDate: { $gte: start, $lte: end }
    });

    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length;
    const cancelledTrips = trips.filter(t => t.status === 'Cancelled').length;
    const totalPassengers = trips
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + (t.passengerCount || 0), 0);

    routeSummary.push({
      routeId: route._id,
      origin: route.origin,
      destination: route.destination,
      estimatedFare: route.estimatedFare,
      totalTrips,
      completedTrips,
      cancelledTrips,
      totalPassengers,
      estimatedRevenue: totalPassengers * route.estimatedFare
    });
  }

  const summaryData = {
    routesCount: routes.length,
    routeMetrics: routeSummary
  };

  const report = await Report.create({
    reportType: 'Route Summary Report',
    generatedBy: userId,
    dateFrom: start,
    dateTo: end,
    summaryData
  });

  await ActivityLog.create({
    user: userId,
    action: 'Generated Report',
    details: `Generated Route Summary Report from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. ID: ${report._id}`,
    ipAddress
  });

  return {
    report,
    data: summaryData
  };
};

export const generateJeepneyActivityReport = async (startDateStr, endDateStr, userId = null, ipAddress = null) => {
  const { start, end } = getDateRange(startDateStr, endDateStr);

  const jeepneys = await Jeepney.find({});
  const jeepneySummary = [];

  let totalAvailable = 0;
  let totalInTransit = 0;
  let totalInactive = 0;

  jeepneys.forEach(j => {
    if (j.status === 'Available') totalAvailable++;
    else if (j.status === 'In Transit') totalInTransit++;
    else if (j.status === 'Inactive') totalInactive++;
  });

  for (const jeepney of jeepneys) {
    const trips = await Trip.find({
      jeepney: jeepney._id,
      tripDate: { $gte: start, $lte: end }
    });

    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length;
    const cancelledTrips = trips.filter(t => t.status === 'Cancelled').length;

    jeepneySummary.push({
      jeepneyId: jeepney._id,
      jeepneyNumber: jeepney.jeepneyNumber,
      plateNumber: jeepney.plateNumber,
      type: jeepney.type,
      currentStatus: jeepney.status,
      capacity: jeepney.capacity,
      tripsInPeriod: {
        totalTrips,
        completedTrips,
        cancelledTrips
      }
    });
  }

  const summaryData = {
    totalJeepneysCount: jeepneys.length,
    currentStates: {
      Available: totalAvailable,
      InTransit: totalInTransit,
      Inactive: totalInactive
    },
    jeepneyMetrics: jeepneySummary
  };

  const report = await Report.create({
    reportType: 'Jeepney Activity Report',
    generatedBy: userId,
    dateFrom: start,
    dateTo: end,
    summaryData
  });

  await ActivityLog.create({
    user: userId,
    action: 'Generated Report',
    details: `Generated Jeepney Activity Report from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. ID: ${report._id}`,
    ipAddress
  });

  return {
    report,
    data: summaryData
  };
};

export const generateRevenueSummaryReport = async (startDateStr, endDateStr, userId = null, ipAddress = null) => {
  const { start, end } = getDateRange(startDateStr, endDateStr);

  const completedTrips = await Trip.find({
    tripDate: { $gte: start, $lte: end },
    status: 'Completed'
  }).populate('route');

  let overallEstimatedRevenue = 0;
  const revenueByRoute = {};

  completedTrips.forEach(trip => {
    if (trip.route) {
      const routeKey = `${trip.route.origin} - ${trip.route.destination}`;
      const fare = trip.route.estimatedFare || 0;
      const passengerCount = trip.passengerCount || 0;
      const tripRevenue = passengerCount * fare;

      overallEstimatedRevenue += tripRevenue;

      if (!revenueByRoute[routeKey]) {
        revenueByRoute[routeKey] = {
          routeId: trip.route._id,
          origin: trip.route.origin,
          destination: trip.route.destination,
          tripsCount: 0,
          passengersCount: 0,
          revenue: 0
        };
      }

      revenueByRoute[routeKey].tripsCount++;
      revenueByRoute[routeKey].passengersCount += passengerCount;
      revenueByRoute[routeKey].revenue += tripRevenue;
    }
  });

  const summaryData = {
    overallEstimatedRevenue,
    completedTripsCount: completedTrips.length,
    revenueByRoute: Object.values(revenueByRoute)
  };

  const report = await Report.create({
    reportType: 'Revenue Summary Report',
    generatedBy: userId,
    dateFrom: start,
    dateTo: end,
    summaryData
  });

  await ActivityLog.create({
    user: userId,
    action: 'Generated Report',
    details: `Generated Revenue Summary Report from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. Total Estimated Revenue: ₱${overallEstimatedRevenue.toLocaleString()}. ID: ${report._id}`,
    ipAddress
  });

  return {
    report,
    data: summaryData
  };
};

const reportService = {
  generateDailyTripReport,
  generatePassengerSummaryReport,
  generateRouteSummaryReport,
  generateJeepneyActivityReport,
  generateRevenueSummaryReport
};

export default reportService;
