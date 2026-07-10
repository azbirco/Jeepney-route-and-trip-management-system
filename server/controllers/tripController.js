import Trip from '../models/Trip.js';
import Jeepney from '../models/Jeepney.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';
import ActivityLog from '../models/ActivityLog.js';
import passengerStatisticService from '../services/passengerStatisticService.js';


// Create Trip
export const createTrip = async (req, res) => {

  try {

    const {

      jeepney,

      route,

      schedule

    } = req.body;


    const jeepneyExists =
      await Jeepney.findById(jeepney);

    if (!jeepneyExists) {

      return res.status(404).json({

        success: false,

        message: 'Jeepney not found'

      });

    }


    const routeExists =
      await Route.findById(route);

    if (!routeExists) {

      return res.status(404).json({

        success: false,

        message: 'Route not found'

      });

    }


    const scheduleExists =
      await Schedule.findById(schedule);

    if (!scheduleExists) {

      return res.status(404).json({

        success: false,

        message: 'Schedule not found'

      });

    }


    const trip =
      await Trip.create(req.body);


    // Auto-create the passenger statistic record for this trip
    await passengerStatisticService.createPassengerStatistic(
      trip._id,
      trip.passengerCount || 0
    );


    const populatedTrip =
      await Trip.findById(trip._id)

      .populate('jeepney')

      .populate('route')

      .populate('schedule');


    await ActivityLog.create({

      user: req.user?._id,

      action: 'Create Trip',

      details:
        `Created trip ${populatedTrip.tripCode}`,

      ipAddress: req.ip

    });


    res.status(201).json({

      success: true,

      message: 'Trip scheduled successfully',

      data: populatedTrip

    });

  }

  catch (error) {

    res.status(400).json({

      success: false,

      message: error.message

    });

  }

};




// Get Trips
export const getTrips = async (req, res) => {

  try {

    const {

      status,

      jeepneyId,

      routeId,

      search

    } = req.query;


    const query = {};


    if (status) {

      query.status = status;

    }


    if (jeepneyId) {

      query.jeepney = jeepneyId;

    }


    if (routeId) {

      query.route = routeId;

    }


    const trips =
      await Trip.find(query)

      .populate('jeepney')

      .populate('route')

      .populate('schedule')

      .sort({

        createdAt: -1

      });


    let filteredTrips = trips;


    if (search) {

      const regex =
        new RegExp(search, 'i');


      filteredTrips =
        trips.filter(trip =>

          regex.test(trip.tripCode || '') ||

          regex.test(
            trip.jeepney?.plateNumber || ''
          ) ||

          regex.test(
            trip.route?.origin || ''
          ) ||

          regex.test(
            trip.route?.destination || ''
          ) ||

          regex.test(
            trip.status || ''
          )

        );

    }


    res.status(200).json({

      success: true,

      count: filteredTrips.length,

      data: filteredTrips

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};




// Get Trip By Id
export const getTripById = async (req, res) => {

  try {

    const trip =
      await Trip.findById(req.params.id)

      .populate('jeepney')

      .populate('route')

      .populate('schedule');


    if (!trip) {

      return res.status(404).json({

        success: false,

        message: 'Trip not found'

      });

    }


    res.status(200).json({

      success: true,

      data: trip

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};




// Update Trip
export const updateTrip = async (req, res) => {

  try {

    const trip =
      await Trip.findByIdAndUpdate(

        req.params.id,

        req.body,

        {

          new: true,

          runValidators: true

        }

      )

      .populate('jeepney')

      .populate('route')

      .populate('schedule');


    if (!trip) {

      return res.status(404).json({

        success: false,

        message: 'Trip not found'

      });

    }


    // Keep the passenger statistic in sync with the updated trip
    await passengerStatisticService.createPassengerStatistic(
      trip._id,
      trip.passengerCount || 0
    );


    await ActivityLog.create({

      user: req.user?._id,

      action: 'Update Trip',

      details:
        `Updated trip ${trip.tripCode}`,

      ipAddress: req.ip

    });


    res.status(200).json({

      success: true,

      message: 'Trip updated successfully',

      data: trip

    });

  }

  catch (error) {

    res.status(400).json({

      success: false,

      message: error.message

    });

  }

};




// Delete Trip
export const deleteTrip = async (req, res) => {

  try {

    const trip =
      await Trip.findByIdAndDelete(

        req.params.id

      );


    if (!trip) {

      return res.status(404).json({

        success: false,

        message: 'Trip not found'

      });

    }


    await ActivityLog.create({

      user: req.user?._id,

      action: 'Delete Trip',

      details:
        `Deleted trip ${trip.tripCode}`,

      ipAddress: req.ip

    });


    res.status(200).json({

      success: true,

      message: 'Trip deleted successfully'

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};