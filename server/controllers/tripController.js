import Trip from '../models/Trip.js';
import Jeepney from '../models/Jeepney.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';
import ActivityLog from '../models/ActivityLog.js';
import PassengerStatistic from '../models/PassengerStatistic.js';
import passengerStatisticService from '../services/passengerStatisticService.js';
import synchronizationService from '../services/synchronizationService.js';


// Create Trip
export const createTrip = async (req, res) => {

  try {

    const { jeepney, route, schedule } = req.body;

    const jeepneyExists = await Jeepney.findById(jeepney);
    if (!jeepneyExists) {
      return res.status(404).json({ success: false, message: 'Jeepney not found' });
    }

    const routeExists = await Route.findById(route);
    if (!routeExists) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const scheduleExists = await Schedule.findById(schedule);
    if (!scheduleExists) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const passengerCount = req.body.passengerCount || 0;
    const estimatedRevenue = passengerCount * routeExists.estimatedFare;

    // Notify the driver right away if one was assigned on creation.
    const trip = await Trip.create({
      ...req.body,
      estimatedRevenue,
      driverNotified: req.body.driver ? false : true
    });

    await passengerStatisticService.createPassengerStatistic(trip._id, trip.passengerCount || 0);

    const populatedTrip = await Trip.findById(trip._id)
      .populate('jeepney')
      .populate('route')
      .populate('schedule')
      .populate('driver', 'username fullName');

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Create Trip',
      details: `Created trip ${populatedTrip.tripCode}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Trip scheduled successfully',
      data: populatedTrip
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }

};




// Get Trips
export const getTrips = async (req, res) => {

  try {

    const { status, jeepneyId, routeId, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (jeepneyId) query.jeepney = jeepneyId;
    if (routeId) query.route = routeId;

    if (req.user?.role === 'Driver') {
      query.driver = req.user._id;
    }

    const trips = await Trip.find(query)
      .populate('jeepney')
      .populate('route')
      .populate('schedule')
      .populate('driver', 'username fullName')
      .sort({ createdAt: -1 });

    let filteredTrips = trips;

    if (search) {
      const regex = new RegExp(search, 'i');
      filteredTrips = trips.filter(trip =>
        regex.test(trip.tripCode || '') ||
        regex.test(trip.jeepney?.plateNumber || '') ||
        regex.test(trip.route?.origin || '') ||
        regex.test(trip.route?.destination || '') ||
        regex.test(trip.status || '')
      );
    }

    res.status(200).json({
      success: true,
      count: filteredTrips.length,
      data: filteredTrips
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

};




// Get Trip By Id
export const getTripById = async (req, res) => {

  try {

    const trip = await Trip.findById(req.params.id)
      .populate('jeepney')
      .populate('route')
      .populate('schedule')
      .populate('driver', 'username fullName');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (
      req.user?.role === 'Driver' &&
      (!trip.driver || trip.driver._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this trip.' });
    }

    res.status(200).json({ success: true, data: trip });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

};




// Update Trip — Full edit, Admin & Terminal Personnel only.
export const updateTrip = async (req, res) => {

  try {

    const existingTrip = await Trip.findById(req.params.id);

    if (!existingTrip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const oldDriverId = existingTrip.driver ? existingTrip.driver.toString() : null;
    const newDriverId = 'driver' in req.body ? (req.body.driver || null) : oldDriverId;
    const driverChanged = oldDriverId !== newDriverId;

    const willBeCancelled =
      req.body.status === 'Cancelled' &&
      existingTrip.status !== 'Cancelled';

    const updatePayload = { ...req.body };

    // Re-notify the driver if they're newly assigned/reassigned, or if
    // an already-assigned trip is being cancelled out from under them.
    if (
      (driverChanged && newDriverId) ||
      (willBeCancelled && (newDriverId || oldDriverId))
    ) {
      updatePayload.driverNotified = false;
    }

    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    )
      .populate('jeepney')
      .populate('route')
      .populate('schedule')
      .populate('driver', 'username fullName');

    if (trip.route && typeof trip.passengerCount === 'number') {
      trip.estimatedRevenue = trip.passengerCount * trip.route.estimatedFare;
      await trip.save();
    }

    await passengerStatisticService.createPassengerStatistic(trip._id, trip.passengerCount || 0);

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Update Trip',
      details: `Updated trip ${trip.tripCode}`,
      ipAddress: req.ip
    });

    if (trip.status === 'Arrived' || trip.status === 'Cancelled') {
      synchronizationService
        .sendTransactionRecords(req.user?._id, req.ip)
        .catch(err => console.error('Auto-sync failed silently:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      data: trip
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }

};




// Update Trip Status — Driver-only. Reporting "Arrived" only sets
// arrivalReported=true; status stays 'Departed' until confirmed.
export const updateTripStatus = async (req, res) => {

  try {

    const trip = await Trip.findById(req.params.id)
      .populate('jeepney')
      .populate('route')
      .populate('schedule')
      .populate('driver', 'username fullName');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!trip.driver || trip.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this trip.' });
    }

    const { status, actualDepartureTime, actualArrivalTime } = req.body;
    const allowedStatuses = ['Departed', 'Arrived'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Drivers may only report a trip as Departed or Arrived.'
      });
    }

    if (status === 'Departed') {
      if (trip.status !== 'Scheduled') {
        return res.status(400).json({
          success: false,
          message: 'Only a Scheduled trip can be marked as Departed.'
        });
      }
      trip.status = 'Departed';
      if (actualDepartureTime) trip.actualDepartureTime = actualDepartureTime;
    }

    if (status === 'Arrived') {
      if (trip.status !== 'Departed') {
        return res.status(400).json({
          success: false,
          message: 'Only a Departed trip can be marked as Arrived.'
        });
      }
      if (trip.arrivalReported) {
        return res.status(400).json({
          success: false,
          message: 'You already reported this trip as arrived. Waiting for confirmation.'
        });
      }
      trip.arrivalReported = true;
      trip.arrivalReportedAt = new Date();
      if (actualArrivalTime) trip.actualArrivalTime = actualArrivalTime;
    }

    await trip.save();

    await passengerStatisticService.createPassengerStatistic(trip._id, trip.passengerCount || 0);

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Update Trip Status',
      details:
        status === 'Arrived'
          ? `Driver reported arrival for trip ${trip.tripCode} (pending confirmation)`
          : `Driver marked trip ${trip.tripCode} as ${status}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message:
        status === 'Arrived'
          ? 'Arrival reported. Waiting for Terminal Personnel confirmation.'
          : `Trip marked as ${status} successfully`,
      data: trip
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }

};




// Confirm Arrival — Admin & Terminal Personnel only. Finalizes status.
export const confirmArrival = async (req, res) => {

  try {

    const trip = await Trip.findById(req.params.id)
      .populate('jeepney')
      .populate('route')
      .populate('schedule')
      .populate('driver', 'username fullName');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!trip.arrivalReported) {
      return res.status(400).json({ success: false, message: 'This trip has no pending arrival report to confirm.' });
    }

    if (trip.status === 'Arrived') {
      return res.status(400).json({ success: false, message: 'This trip has already been confirmed as Arrived.' });
    }

    trip.status = 'Arrived';

    if (trip.route && typeof trip.passengerCount === 'number') {
      trip.estimatedRevenue = trip.passengerCount * trip.route.estimatedFare;
    }

    await trip.save();

    await passengerStatisticService.createPassengerStatistic(trip._id, trip.passengerCount || 0);

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Confirm Trip Arrival',
      details: `Confirmed arrival for trip ${trip.tripCode}`,
      ipAddress: req.ip
    });

    synchronizationService
      .sendTransactionRecords(req.user?._id, req.ip)
      .catch(err => console.error('Auto-sync failed silently:', err.message));

    res.status(200).json({
      success: true,
      message: 'Trip arrival confirmed successfully',
      data: trip
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }

};




// Pending Arrivals Count — Admin & Terminal Personnel. Sidebar badge.
export const getPendingArrivalsCount = async (req, res) => {

  try {

    const count = await Trip.countDocuments({
      arrivalReported: true,
      status: { $ne: 'Arrived' }
    });

    res.status(200).json({ success: true, count });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

};




// Driver's own pending notifications count — new assignment/cancellation.
export const getMyPendingNotificationsCount = async (req, res) => {

  try {

    const count = await Trip.countDocuments({
      driver: req.user._id,
      driverNotified: false
    });

    res.status(200).json({ success: true, count });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

};




// Driver acknowledges all pending trip notifications — called when they
// visit "My Trips".
export const acknowledgeNotifications = async (req, res) => {

  try {

    await Trip.updateMany(
      { driver: req.user._id, driverNotified: false },
      { $set: { driverNotified: true } }
    );

    res.status(200).json({ success: true, message: 'Notifications acknowledged' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

};




// Delete Trip
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    await PassengerStatistic.deleteOne({ trip: trip._id });

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Delete Trip',
      details: `Deleted trip ${trip.tripCode}`,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};